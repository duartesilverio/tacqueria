#!/usr/bin/env python3
"""
backfill-hyperliquid.py — Extend hyperliquid chart arrays in dashboard-data.js.

The hyperliquid section's chartLabels/chartHL/chartTrad/chartSpread arrays were
last extended on 2026-04-14 (Day 45) and stop at D42. This script fetches HL
xyz:BRENTOIL daily candles AND FMP Brent (BZUSD) daily prices for a date range
and appends the missing entries directly to js/dashboard-data.js.

Usage:
    python scripts/backfill-hyperliquid.py --start 43 --end 60
    python scripts/backfill-hyperliquid.py --dry-run --start 43 --end 60

Safety: validates JS syntax via `node --check` after writing. Backs up the
file to dashboard-data.js.bak3 before modifying.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

DAY_1 = datetime(2026, 2, 28, tzinfo=timezone.utc)
REPO = Path(__file__).resolve().parent.parent
DATA_JS = REPO / "js" / "dashboard-data.js"

HL_API = "https://api.hyperliquid.xyz/info"
HL_COIN = "xyz:BRENTOIL"
FMP_API = "https://financialmodelingprep.com/api/v3"
FMP_KEY = os.environ.get("FMP_API_KEY", "5pfcRwLEz6OPlpMtKrWyikS2UdP4ZQEd")  # fallback per memory


def http_post(url, payload, timeout=30):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def http_get(url, timeout=30):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read())


def day_to_date(day_num: int) -> datetime:
    return DAY_1 + timedelta(days=day_num - 1)


def fetch_hl_range(start_day: int, end_day: int) -> dict:
    """Return {day_num: hl_price} for the inclusive range using one candleSnapshot call."""
    start_dt = day_to_date(start_day).replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = day_to_date(end_day).replace(hour=23, minute=59, second=59)
    payload = {
        "type": "candleSnapshot",
        "req": {
            "coin": HL_COIN,
            "interval": "1d",
            "startTime": int(start_dt.timestamp() * 1000),
            "endTime": int(end_dt.timestamp() * 1000),
        },
    }
    data = http_post(HL_API, payload)
    if not isinstance(data, list):
        return {}
    out = {}
    for c in data:
        ts = c.get("t")
        close = c.get("c")
        if ts is None or close is None:
            continue
        candle_dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
        # Map back to day number
        delta = (candle_dt.date() - DAY_1.date()).days + 1
        if start_day <= delta <= end_day:
            try:
                out[delta] = round(float(close), 2)
            except (ValueError, TypeError):
                pass
    return out


def fetch_fmp_range(start_day: int, end_day: int) -> dict:
    """Return {day_num: brent_price} from FMP historical-price-full BZUSD."""
    start_str = day_to_date(start_day).strftime("%Y-%m-%d")
    end_str = day_to_date(end_day).strftime("%Y-%m-%d")
    url = f"{FMP_API}/historical-price-full/BZUSD?from={start_str}&to={end_str}&apikey={FMP_KEY}"
    try:
        data = http_get(url)
    except Exception as e:
        print(f"  [WARN] FMP fetch failed: {e}")
        return {}
    if not isinstance(data, dict):
        return {}
    out = {}
    for row in data.get("historical") or []:
        date_str = row.get("date")
        close = row.get("close")
        if not date_str or close is None:
            continue
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        delta = (d.date() - DAY_1.date()).days + 1
        if start_day <= delta <= end_day:
            try:
                out[delta] = round(float(close), 2)
            except (ValueError, TypeError):
                pass
    return out


def array_to_js(values, fmt="g"):
    """Format a list of numbers as JS array contents (no surrounding brackets)."""
    parts = []
    for v in values:
        if isinstance(v, str):
            parts.append(f"'{v}'")
        else:
            parts.append(format(v, fmt) if fmt != "g" else str(v))
    return ", ".join(parts)


def replace_hyperliquid_array(text, key, new_full_array_js):
    """Replace `<key>: [...]` inside the hyperliquid block."""
    # Find hyperliquid section bounds
    hl_start = text.find("hyperliquid: {")
    if hl_start < 0:
        raise ValueError("hyperliquid section not found")
    # Find matching close brace
    depth = 0
    i = hl_start
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                hl_end = i + 1
                break
        i += 1
    else:
        raise ValueError("hyperliquid section unterminated")

    section = text[hl_start:hl_end]
    pattern = re.compile(rf"({re.escape(key)}:\s*\[)[^\]]*(\])", re.DOTALL)
    new_section, n = pattern.subn(rf"\g<1>{new_full_array_js}\g<2>", section, count=1)
    if n == 0:
        raise ValueError(f"key '{key}' not found in hyperliquid section")
    return text[:hl_start] + new_section + text[hl_end:]


def parse_existing_arrays(text):
    """Extract chartLabels, chartHL, chartTrad, chartSpread current values."""
    hl_start = text.find("hyperliquid: {")
    depth = 0
    i = hl_start
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                hl_end = i + 1
                break
        i += 1
    section = text[hl_start:hl_end]
    out = {}
    for key in ("chartLabels", "chartHL", "chartTrad", "chartSpread"):
        m = re.search(rf"{key}:\s*\[([^\]]*)\]", section, re.DOTALL)
        if not m:
            continue
        contents = m.group(1).strip()
        if not contents:
            out[key] = []
            continue
        # Parse numbers or quoted strings
        items = [it.strip() for it in contents.split(",")]
        if key == "chartLabels":
            out[key] = [it.strip("'\"") for it in items]
        else:
            try:
                out[key] = [float(it) for it in items if it]
            except ValueError:
                out[key] = []
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, required=True)
    parser.add_argument("--end", type=int, required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.end < args.start:
        parser.error("--end must be >= --start")

    text = DATA_JS.read_text(encoding="utf-8")
    existing = parse_existing_arrays(text)
    print(f"Existing chartLabels: {existing.get('chartLabels', [])}")
    print(f"  count: HL={len(existing.get('chartHL', []))}, Trad={len(existing.get('chartTrad', []))}, Spread={len(existing.get('chartSpread', []))}")

    # Determine the highest D-N already in chartLabels (e.g., 'D42')
    last_day = 0
    for lbl in existing.get("chartLabels", []):
        m = re.match(r"D(\d+)", lbl)
        if m:
            last_day = max(last_day, int(m.group(1)))
    print(f"Last day already in chart: D{last_day}")

    # Only fetch the gap from last_day+1 to args.end (don't refetch existing)
    fetch_start = max(args.start, last_day + 1)
    fetch_end = args.end
    if fetch_start > fetch_end:
        print(f"Nothing to backfill — chart already extends to D{last_day} (requested D{args.start}..D{args.end}).")
        return

    print(f"\nFetching HL candles for D{fetch_start}..D{fetch_end}...")
    hl_prices = fetch_hl_range(fetch_start, fetch_end)
    print(f"  Got {len(hl_prices)} HL prices: {hl_prices}")

    print(f"\nFetching FMP Brent for D{fetch_start}..D{fetch_end}...")
    fmp_prices = fetch_fmp_range(fetch_start, fetch_end)
    print(f"  Got {len(fmp_prices)} FMP prices: {fmp_prices}")

    # Build new appended values, forward-filling on gaps
    new_labels = list(existing.get("chartLabels", []))
    new_hl = list(existing.get("chartHL", []))
    new_trad = list(existing.get("chartTrad", []))
    new_spread = list(existing.get("chartSpread", []))

    last_hl = new_hl[-1] if new_hl else 0
    last_trad = new_trad[-1] if new_trad else 0

    for d in range(fetch_start, fetch_end + 1):
        new_labels.append(f"D{d}")
        hl_v = hl_prices.get(d, last_hl)
        trad_v = fmp_prices.get(d, last_trad)
        spread_v = round(hl_v - trad_v, 2)
        new_hl.append(hl_v)
        new_trad.append(trad_v)
        new_spread.append(spread_v)
        last_hl, last_trad = hl_v, trad_v

    print(f"\nNew array lengths: labels={len(new_labels)}, HL={len(new_hl)}, Trad={len(new_trad)}, Spread={len(new_spread)}")
    print(f"New tail: D{fetch_start}..D{fetch_end}")
    for i in range(fetch_end - fetch_start + 1):
        idx = -((fetch_end - fetch_start + 1) - i)
        print(f"  {new_labels[idx]}: HL={new_hl[idx]}, Trad={new_trad[idx]}, Spread={new_spread[idx]}")

    if args.dry_run:
        print("\n[DRY-RUN] No file writes.")
        return

    # Backup
    backup = DATA_JS.with_suffix(".js.bak3")
    shutil.copy2(DATA_JS, backup)
    print(f"\nBackup: {backup.name}")

    # Apply
    text = replace_hyperliquid_array(text, "chartLabels", array_to_js(new_labels))
    text = replace_hyperliquid_array(text, "chartHL", array_to_js(new_hl))
    text = replace_hyperliquid_array(text, "chartTrad", array_to_js(new_trad))
    text = replace_hyperliquid_array(text, "chartSpread", array_to_js(new_spread))
    DATA_JS.write_text(text, encoding="utf-8")
    print(f"Wrote {DATA_JS}")

    # Validate
    print("Validating JS syntax...")
    result = subprocess.run(["node", "--check", str(DATA_JS)], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ERROR] JS syntax invalid! Restoring backup.")
        print(result.stderr)
        shutil.copy2(backup, DATA_JS)
        sys.exit(1)
    print("OK — JS syntax valid.")


if __name__ == "__main__":
    main()
