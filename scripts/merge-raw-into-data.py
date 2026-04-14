#!/usr/bin/env python3
"""
merge-raw-into-data.py
Merges day-N-raw.json (fresh FMP/Sonar data) into day-N-data.json (full dashboard file).

Updates mechanical data (KPIs, marketStrip, chartAppend, inflation derivation, etc.)
while preserving analyst-written sections (gistBanner, newsNow, intelligence, operations).

Usage:
  python scripts/merge-raw-into-data.py --day 45
"""

import argparse
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def extract_json_from_dashboard_js(js_path: Path) -> dict:
    """Extract DASHBOARD_DATA object from dashboard-data.js as a Python dict.
    Uses node to eval the JS file and serialize DASHBOARD_DATA to JSON."""
    import subprocess, tempfile
    helper = Path(tempfile.mktemp(suffix=".cjs"))
    out_json = Path(tempfile.mktemp(suffix=".json"))
    try:
        # Node script: eval the JS file in global scope, serialize DASHBOARD_DATA
        # argv[2]=input js, argv[3]=output json (argv[1] is the script itself)
        helper.write_text(
            'const fs = require("fs");\n'
            'const src = fs.readFileSync(process.argv[2], "utf8");\n'
            'const data = (0, eval)(src + "; DASHBOARD_DATA");\n'
            'fs.writeFileSync(process.argv[3], JSON.stringify(data));\n',
            encoding="utf-8"
        )
        result = subprocess.run(
            ["node", str(helper), str(js_path), str(out_json)],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            print(f"  [WARN] node extraction failed: {result.stderr[:200]}")
            return None
        return json.loads(out_json.read_text(encoding="utf-8"))
    finally:
        helper.unlink(missing_ok=True)
        out_json.unlink(missing_ok=True)


def resolve_files(day: int):
    """Resolve RAW_FILE and DATA_FILE paths for the given day number.
    If day-N-data.json doesn't exist, try previous data files, then fall back
    to extracting current state from js/dashboard-data.js."""
    raw_file = SCRIPT_DIR / f"day-{day}-raw.json"
    data_file = SCRIPT_DIR / f"day-{day}-data.json"

    if not data_file.exists():
        # Try 1: Find most recent previous data file as base
        candidates = sorted(SCRIPT_DIR.glob("day-*-data.json"), reverse=True)
        base = None
        for c in candidates:
            try:
                n = int(c.stem.split("-")[1])
                if n < day:
                    base = c
                    break
            except (ValueError, IndexError):
                continue
        if base:
            import shutil
            shutil.copy2(base, data_file)
            print(f"  [BASE] Copied {base.name} -> {data_file.name}")
        else:
            # Try 2: Extract from js/dashboard-data.js (always in repo)
            js_path = SCRIPT_DIR.parent / "js" / "dashboard-data.js"
            if js_path.exists():
                print(f"  [BASE] No data files found, extracting from dashboard-data.js...")
                extracted = extract_json_from_dashboard_js(js_path)
                if extracted:
                    save_json(data_file, extracted)
                    print(f"  [BASE] Extracted dashboard-data.js -> {data_file.name}")
                else:
                    print(f"  [ERROR] Failed to extract data from dashboard-data.js")
                    sys.exit(1)
            else:
                print(f"  [ERROR] No base data file found for day {day}")
                sys.exit(1)

    return raw_file, data_file

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [SAVED] {path.name}")


def safe_get(d, *keys, default=None):
    """Safely traverse nested dicts."""
    for k in keys:
        if not isinstance(d, dict):
            return default
        d = d.get(k, default)
    return d


def fmt_pct(val):
    """Format a percentage change nicely."""
    if val is None:
        return ""
    sign = "+" if val >= 0 else ""
    return f"{sign}{val:.1f}%"


def arrow(val):
    if val is None:
        return "→"
    return "▲" if val > 0 else ("▼" if val < 0 else "→")

# ---------------------------------------------------------------------------
# KPI note enhancers
# ---------------------------------------------------------------------------

def enhance_kpi_notes(raw_kpis: dict, raw_data: dict) -> dict:
    """Take raw KPI data and write contextual notes for each ticker."""
    enhanced = {}
    hl_price = safe_get(raw_data, "_raw_hl", "price")
    hormuz_status = safe_get(raw_data, "_raw_intelligence", "hormuz_status", default="")
    ceasefire_status = safe_get(raw_data, "_raw_intelligence", "ceasefire_status", default="")

    for key, kpi in raw_kpis.items():
        kpi = dict(kpi)  # shallow copy
        price = kpi.get("price")
        change_pct = kpi.get("changePct", 0)
        change = kpi.get("change", 0)
        arr = arrow(change)

        if key == "brent":
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            if ceasefire_status:
                parts.append("Ceasefire relief")
            if hl_price:
                parts.append(f"HL ${hl_price:.2f}")
            if hormuz_status:
                parts.append(f"Hormuz: {hormuz_status.replace('_', ' ').title()}")
            kpi["note"] = " · ".join(parts)

        elif key == "wti":
            spread = None
            if "brentWtiSpread" in raw_kpis:
                spread = raw_kpis["brentWtiSpread"].get("price")
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            if spread is not None:
                parts.append(f"WTI premium persists (spread ${spread:.2f})")
            else:
                parts.append("WTI premium note")
            kpi["note"] = " · ".join(parts)

        elif key == "tnx":
            kpi["note"] = f"{price:.2f}% · {arr} {fmt_pct(change_pct)} · Yield steady amid ceasefire uncertainty"

        elif key == "vix":
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            if abs(change_pct) < 2:
                parts.append("Low vol — ceasefire risk priced in")
            else:
                parts.append("Risk repricing on ceasefire fragility")
            kpi["note"] = " · ".join(parts)

        elif key == "hyg":
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            parts.append("Credit steady — no stress signal" if change_pct >= 0 else "Credit widening — stress watch")
            kpi["note"] = " · ".join(parts)

        elif key == "gold":
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            parts.append(f"${price:,.0f}")
            parts.append("Safe-haven demand easing on ceasefire" if change_pct <= 0 else "Safe-haven bid — ceasefire doubts")
            kpi["note"] = " · ".join(parts)

        elif key == "brentWtiSpread":
            spread = price
            # Guard against nonsensical % when spread crosses zero
            prev = kpi.get("prevClose", 0)
            if abs(prev) < 0.01:
                kpi["changePct"] = round(change, 2)
            parts = [f"Spread ${spread:.2f}"]
            if spread is not None and spread < 0:
                parts.append("WTI > Brent ANOMALY · Normalizing on ceasefire")
            else:
                parts.append("Spread normalizing")
            kpi["note"] = " · ".join(parts)

        elif key == "ita":
            parts = [f"{arr} {fmt_pct(change_pct)}"]
            parts.append("Defense sector — ceasefire fragility hedge" if change_pct >= 0 else "Defense sector pullback on peace hopes")
            kpi["note"] = " · ".join(parts)

        else:
            # Leave unknown KPIs with their raw note
            pass

        enhanced[key] = kpi

    return enhanced


# ---------------------------------------------------------------------------
# chartAppend merge — update prices but keep taco/strikes/hormuz from existing
# ---------------------------------------------------------------------------

def merge_chart_append(existing: dict, raw: dict) -> dict:
    merged = dict(existing)  # start with existing (has taco, strikes, hormuz)

    # Overwrite price fields from raw
    for field in ("labels", "brent", "vix", "hyg", "sp500",
                  "etf_ITA", "etf_XLE", "etf_XOP", "etf_GLD", "etf_TLT"):
        if field in raw:
            merged[field] = raw[field]

    # Map raw etf_ fields into existing nested etfs dict if present
    if "etfs" in merged:
        etf_map = {
            "etf_ITA": "ITA", "etf_XLE": "XLE", "etf_XOP": "XOP",
            "etf_GLD": "GLD", "etf_TLT": "TLT",
        }
        for raw_key, etf_key in etf_map.items():
            if raw_key in raw and raw[raw_key] is not None:
                merged["etfs"][etf_key] = round(raw[raw_key])

    return merged


# ---------------------------------------------------------------------------
# Dubai Watch update
# ---------------------------------------------------------------------------

def update_dubai_watch(dubai_section: dict, raw_dubai: dict, day: int, day_date: str) -> list[str]:
    """Update dubaiWatch snapshots and latest from raw_dubai data."""
    updates = []
    if not raw_dubai:
        return updates

    dubizzle = raw_dubai.get("dubizzle")
    dubicars = raw_dubai.get("dubicars")
    yallamotor = raw_dubai.get("yallamotor")

    if dubizzle is None and dubicars is None and yallamotor is None:
        return updates

    today_str = datetime.now().strftime("%Y-%m-%d")

    # Update latest
    if "latest" in dubai_section:
        latest = dubai_section["latest"]
        # Compute changePct from previous snapshot if available
        prev_snap = None
        if "snapshots" in dubai_section and dubai_section["snapshots"]:
            prev_snap = dubai_section["snapshots"][-1]

        for platform, new_val in [("dubizzle", dubizzle), ("dubicars", dubicars), ("yallamotor", yallamotor)]:
            if new_val is None:
                continue
            # Calculate changePct from previous snapshot
            change_pct = 0.0
            if prev_snap and platform in prev_snap:
                prev_val = prev_snap[platform]
                if isinstance(prev_val, dict):
                    prev_val = prev_val.get("total", prev_val)
                if prev_val and prev_val > 0:
                    change_pct = round((new_val - prev_val) / prev_val * 100, 1)
            # Always store as {total, changePct} object
            latest[platform] = {"total": new_val, "changePct": change_pct}
            updates.append(f"dubaiWatch.latest.{platform} = {new_val} ({change_pct:+.1f}%)")
        latest["date"] = today_str
        latest["day"] = day

    # Update or append today's snapshot
    if "snapshots" in dubai_section:
        snapshots = dubai_section["snapshots"]
        # Find if today's snapshot already exists
        today_snap = None
        for snap in snapshots:
            if snap.get("date") == today_str or snap.get("day") == day:
                today_snap = snap
                break

        if today_snap:
            if dubizzle is not None:
                today_snap["dubizzle"] = dubizzle
            if dubicars is not None:
                today_snap["dubicars"] = dubicars
            if yallamotor is not None:
                today_snap["yallamotor"] = yallamotor
            today_snap["source"] = "live"
            updates.append(f"dubaiWatch.snapshots[day={day}] updated")
        else:
            new_snap = {
                "date": today_str,
                "day": day,
                "dubizzle": dubizzle,
                "dubicars": dubicars,
                "yallamotor": yallamotor,
                "source": "live",
            }
            snapshots.append(new_snap)
            updates.append(f"dubaiWatch.snapshots appended day={day}")

    return updates


# ---------------------------------------------------------------------------
# Troop counter update
# ---------------------------------------------------------------------------

def update_troop_counter(troop_list: list, raw_intel: dict) -> list[str]:
    """Update troopCounter entries from raw intelligence data."""
    updates = []
    if not raw_intel or not troop_list:
        return updates

    troops = raw_intel.get("us_force_posture", {}).get("troops_deployed")
    kia = raw_intel.get("us_military_kia")
    targets = raw_intel.get("us_force_posture", {}).get("targets_struck")

    for item in troop_list:
        label_lower = item.get("label", "").lower()

        if troops is not None and "troops" in label_lower:
            old_val = item["value"]
            item["value"] = f"{troops:,}+"
            if old_val != item["value"]:
                updates.append(f"troopCounter.troops: {old_val} -> {item['value']}")

        elif kia is not None and "kia" in label_lower:
            old_val = item["value"]
            item["value"] = f"{kia}+"
            if old_val != item["value"]:
                updates.append(f"troopCounter.KIA: {old_val} -> {item['value']}")

        elif targets is not None and "targets" in label_lower:
            old_val = item["value"]
            item["value"] = f"{targets:,}+"
            if old_val != item["value"]:
                updates.append(f"troopCounter.targets: {old_val} -> {item['value']}")

    return updates


# ---------------------------------------------------------------------------
# Inflation derivation update
# ---------------------------------------------------------------------------

def update_inflation_derivation(inflation_section: dict, raw_derivation: dict) -> list[str]:
    """Store the mechanical derivation from raw.json into inflation.derivation."""
    updates = []
    if not raw_derivation or not inflation_section:
        return updates

    deriv = inflation_section.get("derivation", {})
    if not deriv:
        inflation_section["derivation"] = {}
        deriv = inflation_section["derivation"]

    # Update steps from raw derivation
    if "steps" in raw_derivation:
        raw_steps = raw_derivation["steps"]
        new_steps = []
        for step in raw_steps:
            new_steps.append({
                "label": step.get("label", ""),
                "value": step.get("value", ""),
                "detail": step.get("detail", ""),
                "color": "#f59e0b",
            })
        deriv["steps"] = new_steps
        updates.append(f"inflation.derivation.steps updated ({len(new_steps)} steps)")

    # Update result from raw derivation
    if "estimatedCpi" in raw_derivation:
        est = raw_derivation["estimatedCpi"]
        brent = raw_derivation.get("currentBrent", "?")
        increase = raw_derivation.get("oilIncreasePct", "?")
        headline_total = raw_derivation.get("headlineTotal", "?")

        deriv["result"] = {
            "headline": f"~{est}%",
            "explanation": (
                f"Brent at ${brent} ({'+' if isinstance(increase, (int, float)) and increase > 0 else ''}"
                f"{increase}% vs pre-war baseline). "
                f"Oil-to-CPI passthrough model estimates headline CPI at ~{est}% "
                f"(war premium +{headline_total}pp over 2.4% baseline)."
            ),
        }
        updates.append(f"inflation.derivation.result -> ~{est}%")

    return updates


# ===========================================================================
# MAIN
# ===========================================================================

def main():
    parser = argparse.ArgumentParser(description="Merge raw API data into dashboard data file")
    parser.add_argument("--day", type=int, required=True, help="Day number (e.g. 45)")
    args = parser.parse_args()

    print("=" * 60)
    print(f"merge-raw-into-data.py  (Day {args.day})")
    print("=" * 60)

    RAW_FILE, DATA_FILE = resolve_files(args.day)

    # Load files
    if not RAW_FILE.exists():
        print(f"[ERROR] Raw file not found: {RAW_FILE}")
        sys.exit(1)

    raw = load_json(RAW_FILE)
    data = load_json(DATA_FILE)

    all_updates = []

    # ------------------------------------------------------------------
    # 1. meta.timestamp
    # ------------------------------------------------------------------
    hkt = timezone(timedelta(hours=8))
    now_hkt = datetime.now(hkt)
    # Windows doesn't support %-d; use %#d on Windows, fall back to %d
    try:
        ts = now_hkt.strftime("%#d %b %Y %H:%M HKT")  # Windows
    except ValueError:
        ts = now_hkt.strftime("%d %b %Y %H:%M HKT").lstrip("0")  # Unix fallback
    if "meta" in data:
        data["meta"]["timestamp"] = ts
        all_updates.append(f"meta.timestamp -> {ts}")
    print(f"  [OK] meta.timestamp = {ts}")

    # ------------------------------------------------------------------
    # 2. KPIs — replace with raw, enhance notes
    # ------------------------------------------------------------------
    if "kpis" in raw:
        data["kpis"] = enhance_kpi_notes(raw["kpis"], raw)
        all_updates.append(f"kpis updated ({len(raw['kpis'])} tickers)")
        print(f"  [OK] kpis: {', '.join(raw['kpis'].keys())}")

    # ------------------------------------------------------------------
    # 3. marketStrip — replace
    # ------------------------------------------------------------------
    if "marketStrip" in raw:
        data["marketStrip"] = raw["marketStrip"]
        all_updates.append(f"marketStrip updated ({len(raw['marketStrip'])} items)")
        print(f"  [OK] marketStrip: {len(raw['marketStrip'])} items")

    # ------------------------------------------------------------------
    # 4. chartAppend — merge (keep taco/strikes/hormuz from existing)
    # ------------------------------------------------------------------
    if "chartAppend" in raw:
        existing_chart = data.get("chartAppend", {})
        data["chartAppend"] = merge_chart_append(existing_chart, raw["chartAppend"])
        all_updates.append("chartAppend merged (prices from raw, taco/strikes/hormuz preserved)")
        print("  [OK] chartAppend merged")

    # ------------------------------------------------------------------
    # 5. Dubai Watch — update from _raw_dubai
    # ------------------------------------------------------------------
    raw_dubai = raw.get("_raw_dubai")
    if raw_dubai and "dubaiWatch" in data:
        day = safe_get(raw, "_meta", "day", default=args.day)
        day_date = safe_get(raw, "_meta", "dayDate", default="")
        dubai_updates = update_dubai_watch(data["dubaiWatch"], raw_dubai, day, day_date)
        all_updates.extend(dubai_updates)
        for u in dubai_updates:
            print(f"  [OK] {u}")
        if not dubai_updates:
            print("  [SKIP] dubaiWatch — no new data in raw")

    # ------------------------------------------------------------------
    # 6. Troop Counter — update from _raw_intelligence
    # ------------------------------------------------------------------
    raw_intel = raw.get("_raw_intelligence")
    if raw_intel and "troopCounter" in data:
        troop_updates = update_troop_counter(data["troopCounter"], raw_intel)
        all_updates.extend(troop_updates)
        for u in troop_updates:
            print(f"  [OK] {u}")
        if not troop_updates:
            print("  [SKIP] troopCounter — no changes")

    # ------------------------------------------------------------------
    # 7. Inflation derivation — store mechanical derivation from raw
    # ------------------------------------------------------------------
    raw_deriv = raw.get("inflation_derivation")
    if raw_deriv and "inflation" in data:
        infl_updates = update_inflation_derivation(data["inflation"], raw_deriv)
        all_updates.extend(infl_updates)
        for u in infl_updates:
            print(f"  [OK] {u}")
        if not infl_updates:
            print("  [SKIP] inflation.derivation — no raw data")

    # ------------------------------------------------------------------
    # Save
    # ------------------------------------------------------------------
    print()
    save_json(DATA_FILE, data)

    # Summary
    print()
    print(f"  TOTAL UPDATES: {len(all_updates)}")
    for u in all_updates:
        print(f"    - {u}")
    print()
    print("  Sections LEFT UNCHANGED: gistBanner, newsNow, intelligence,")
    print("    operations, predictionMarkets, tacoSubScoresOverview,")
    print("    pipelineBypass, and all other analytical sections.")
    print("=" * 60)


if __name__ == "__main__":
    main()
