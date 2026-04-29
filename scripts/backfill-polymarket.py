#!/usr/bin/env python3
"""
backfill-polymarket.py — Refresh predictionMarkets sub-arrays from live Polymarket.

The sub-arrays under predictionMarkets (ceasefire / oil / hormuz / regime /
escalation / nuclear) are snapshot tables, not time series. They've been frozen
at Day 42 values since the dashboard's initial commit because no merge step
ever touched them. This script fetches live Polymarket Iran-related contracts,
fuzzy-matches each to the existing rows by question keywords, and refreshes:
  - prob (percentage string)
  - probClass (prob-high/prob-mid/prob-low)
  - fillColor (hex)
  - fillWidth (percent)
  - volume ($X.XM/K)

Rows that don't match any current Polymarket contract are LEFT ALONE (preserves
analyst-curated labels). Rows that DO match get their numerical fields refreshed
to today's values.

The `comparison` sub-array uses a different schema (poly + kalshi columns) and
needs Kalshi data which isn't currently collected — SKIPPED.

Usage:
    python scripts/backfill-polymarket.py
    python scripts/backfill-polymarket.py --dry-run

Safety: validates JS via `node --check`, backs up to dashboard-data.js.bak4.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA_JS = REPO / "js" / "dashboard-data.js"
POLYMARKET_API = "https://gamma-api.polymarket.com/markets"


def http_get(url, timeout=30):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; tacqueria-backfill/1.0)",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  [HTTP] {url[:80]}... {e}")
        return None


def fetch_iran_markets():
    """Fetch all Iran-related Polymarket contracts via paginated full-list scan.

    The tag-based filter returns too few results post-ceasefire. Instead, page
    through markets with active=true and closed=false then filter client-side
    by keyword on the question text.
    """
    print("[POLY] Fetching Iran markets (paginated client-side filter)...")
    keywords = ("iran", "hormuz", "brent", "ceasefire", "khamenei",
                "nuclear", "regime", "kharg", "middle east", "tehran",
                "houthi", "israel-iran", "us-iran")
    seen_ids = set()
    out = []
    offset = 0
    page_size = 100
    pages_fetched = 0
    max_pages = 10  # safety cap; 1000 markets is plenty
    # Include closed/resolved markets too — Iran-conflict markets have largely
    # resolved post-ceasefire, but their final probabilities and volumes are
    # still useful data points for the dashboard.
    while pages_fetched < max_pages:
        url = f"{POLYMARKET_API}?limit={page_size}&offset={offset}"
        data = http_get(url)
        if not isinstance(data, list) or not data:
            break
        pages_fetched += 1
        added = 0
        for m in data:
            mid = m.get("id", "")
            if mid in seen_ids:
                continue
            seen_ids.add(mid)
            q = m.get("question", "")
            ql = q.lower()
            if not any(kw in ql for kw in keywords):
                continue
            prices = m.get("outcomePrices", [])
            prob = None
            if prices:
                # outcomePrices may be a JSON-encoded string list
                if isinstance(prices, str):
                    try:
                        prices = json.loads(prices)
                    except (ValueError, TypeError):
                        prices = []
                if isinstance(prices, list) and prices:
                    try:
                        prob = round(float(prices[0]) * 100, 1)
                    except (ValueError, TypeError):
                        pass
            volume = m.get("volume", 0)
            out.append({
                "question": q,
                "probability": prob,
                "volume": float(volume) if volume else 0.0,
            })
            added += 1
        offset += page_size
        if len(data) < page_size:
            break  # last page
    print(f"  Scanned {pages_fetched} page(s), found {len(out)} Iran-related contracts:")
    for c in out:
        prob_str = f"{c['probability']:.1f}%" if c['probability'] is not None else "n/a"
        print(f"    - {c['question'][:90]} (prob={prob_str}, vol=${c['volume']:.0f})")
    return out


def tokens(s):
    """Extract significant lowercase tokens from a string."""
    return set(re.findall(r"[a-z]{4,}", (s or "").lower()))


def best_match(query, contracts):
    """Return contract with highest token overlap with query, or None."""
    q_tokens = tokens(query)
    if not q_tokens:
        return None
    best, best_score = None, 0
    for c in contracts:
        ct = tokens(c["question"])
        score = len(q_tokens & ct)
        if score > best_score:
            best_score, best = score, c
    # Require at least 2 token overlap to call it a match
    return best if best_score >= 2 else None


def prob_visuals(prob):
    """Return (probClass, fillColor) given a probability percent."""
    if prob >= 70:
        return "prob-high", "#22c55e"
    if prob >= 30:
        return "prob-mid", "#f59e0b"
    return "prob-low", "#ef4444"


def fmt_volume(v):
    if v >= 1_000_000:
        return f"${v/1_000_000:.1f}M"
    if v >= 1_000:
        return f"${v/1_000:.0f}K"
    return f"${v:.0f}"


def parse_subarray(text, key):
    """Find the predictionMarkets.<key> array, return (start, end, contents)."""
    pm_start = text.find("predictionMarkets:")
    if pm_start < 0:
        return None
    # Find the named sub-array within the predictionMarkets block
    sub_pattern = re.compile(rf"^(\s*){re.escape(key)}:\s*\[", re.MULTILINE)
    m = sub_pattern.search(text, pm_start)
    if not m:
        return None
    arr_start = m.end() - 1  # position of '['
    # Walk to matching ']' (handle nested objects/strings)
    depth = 0
    i = arr_start
    in_string = None
    while i < len(text):
        ch = text[i]
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == in_string:
                in_string = None
        elif ch in ("'", '"'):
            in_string = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return arr_start, i + 1, text[arr_start:i + 1]
        i += 1
    return None


def parse_rows(arr_text):
    """Parse a JS array of {key: value, ...} objects into Python dicts.

    Hacky: relies on consistent formatting in dashboard-data.js. Each row is
    delimited by `{ ... }` at depth 1.
    """
    rows = []
    depth = 0
    cur = []
    in_string = None
    for ch in arr_text:
        if in_string:
            cur.append(ch)
            if ch == "\\":
                continue
            if ch == in_string:
                in_string = None
            continue
        if ch in ("'", '"'):
            in_string = ch
        if ch == "{":
            depth += 1
            if depth == 1:
                cur = ["{"]
                continue
        elif ch == "}":
            depth -= 1
            if depth == 0:
                cur.append("}")
                rows.append("".join(cur))
                cur = []
                continue
        if depth >= 1:
            cur.append(ch)
    return rows


def parse_row_field(row_text, field):
    """Extract a string-valued field's quoted content from a JS row literal."""
    m = re.search(rf"{re.escape(field)}:\s*'((?:[^'\\]|\\.)*)'", row_text)
    if m:
        return m.group(1)
    m = re.search(rf'{re.escape(field)}:\s*"((?:[^"\\]|\\.)*)"', row_text)
    if m:
        return m.group(1)
    return None


def replace_row_field(row_text, field, new_value):
    """Replace a string-valued field in a JS row literal."""
    # Quote with single quotes; escape any embedded
    escaped = new_value.replace("\\", "\\\\").replace("'", "\\'")
    quoted = f"'{escaped}'"
    pat = re.compile(rf"({re.escape(field)}:\s*)('[^']*'|\"[^\"]*\")")
    new_text, n = pat.subn(rf"\g<1>{quoted}", row_text, count=1)
    return new_text if n else row_text


def refresh_subarray(text, key, contracts):
    """Refresh a sub-array's matched rows with live Polymarket data.

    Returns (new_text, refreshed_count, total_rows).
    """
    parsed = parse_subarray(text, key)
    if parsed is None:
        return text, 0, 0
    arr_start, arr_end, arr_text = parsed
    rows = parse_rows(arr_text)
    refreshed = 0
    new_rows = []
    for r in rows:
        contract_label = parse_row_field(r, "contract")
        if not contract_label:
            new_rows.append(r)
            continue
        match = best_match(contract_label, contracts)
        if match is None or match.get("probability") is None:
            new_rows.append(r)
            continue
        prob = float(match["probability"])
        prob_class, fill_color = prob_visuals(prob)
        prob_str = f"{prob:.0f}%"
        vol_str = fmt_volume(float(match.get("volume") or 0))

        rr = r
        rr = replace_row_field(rr, "prob", prob_str)
        rr = replace_row_field(rr, "probClass", prob_class)
        rr = replace_row_field(rr, "fillColor", fill_color)
        rr = replace_row_field(rr, "fillWidth", prob_str)
        rr = replace_row_field(rr, "volume", vol_str)
        new_rows.append(rr)
        refreshed += 1

    # Reassemble. Keep array bracket + indentation around rows.
    # Capture leading indent of the array opening
    new_arr = "[\n      " + ",\n      ".join(new_rows) + "\n    ]"
    new_text = text[:arr_start] + new_arr + text[arr_end:]
    return new_text, refreshed, len(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    contracts = fetch_iran_markets()
    if not contracts:
        print("\nNo Iran-related Polymarket contracts found. This usually means")
        print("the specific markets the dashboard tracks have resolved/archived")
        print("post-ceasefire and are not currently exposed via the Gamma API.")
        print("Re-run when Iran-conflict markets become active again, or update")
        print("the keyword filter / pagination strategy if the API changes.")
        sys.exit(1)

    text = DATA_JS.read_text(encoding="utf-8")

    sub_keys = ("ceasefire", "oil", "hormuz", "regime", "escalation", "nuclear")
    # comparison uses poly+kalshi schema — skipped (no Kalshi fetcher)

    summary = []
    for key in sub_keys:
        text, refreshed, total = refresh_subarray(text, key, contracts)
        summary.append((key, refreshed, total))
        print(f"  predictionMarkets.{key}: {refreshed}/{total} rows refreshed")

    if args.dry_run:
        print("\n[DRY-RUN] No file writes.")
        return

    backup = DATA_JS.with_suffix(".js.bak4")
    shutil.copy2(DATA_JS, backup)
    print(f"\nBackup: {backup.name}")

    DATA_JS.write_text(text, encoding="utf-8")
    print(f"Wrote {DATA_JS}")

    print("Validating JS syntax...")
    result = subprocess.run(["node", "--check", str(DATA_JS)], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] JS syntax invalid! Restoring backup.")
        print(result.stderr)
        shutil.copy2(backup, DATA_JS)
        sys.exit(1)
    print("OK — JS valid.\n")

    total_refreshed = sum(r for _, r, _ in summary)
    print(f"Total: {total_refreshed} rows refreshed across 6 sub-arrays.")
    if total_refreshed == 0:
        print("(No rows matched — check that fuzzy matching against contract labels is working.)")


if __name__ == "__main__":
    main()
