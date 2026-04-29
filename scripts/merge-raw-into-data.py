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

# Regex to strip Sonar/Perplexity citation brackets like [2], [4][6], [12]
import re as _re
_CITATION_RE = _re.compile(r'\[\d+\]')

def strip_citations(text) -> str:
    """Remove Perplexity citation markers like [2], [4][6] from text."""
    if not isinstance(text, str):
        return str(text) if text is not None else ''
    return _CITATION_RE.sub('', text).strip()

def clean_sonar_strings(obj):
    """Recursively strip citation brackets from all strings in a dict/list."""
    if isinstance(obj, str):
        return strip_citations(obj)
    if isinstance(obj, list):
        return [clean_sonar_strings(v) for v in obj]
    if isinstance(obj, dict):
        return {k: clean_sonar_strings(v) for k, v in obj.items()}
    return obj


# Hard-reject patterns: any Sonar-returned string containing one of these is
# considered stale filler and gets dropped (returned as None) so the merge
# step preserves the previous day's value instead of overwriting with junk.
SONAR_STALE_PATTERNS = (
    "operation epic fury",
    "commenced february 28",
    "commenced feb 28",
    "started february 28",
    "started feb 28",
    " day 42",
    "(day 42)",
    "d42 ",
    "13,000+ targets struck",
    "10,200 total air sorties",
    "85% of defense industrial base",
)


def is_sonar_stale(s) -> bool:
    """Return True if a string contains a known stale-filler pattern."""
    if not isinstance(s, str):
        return False
    low = s.lower()
    return any(p in low for p in SONAR_STALE_PATTERNS)


def reject_stale_strings(obj, path="", warnings=None):
    """Recursively walk a Sonar response and replace stale strings with None.

    Returns (cleaned_obj, list_of_warning_paths).
    """
    if warnings is None:
        warnings = []
    if isinstance(obj, str):
        if is_sonar_stale(obj):
            warnings.append(path or "<root>")
            return None, warnings
        return obj, warnings
    if isinstance(obj, list):
        out = []
        for i, v in enumerate(obj):
            cleaned, _ = reject_stale_strings(v, f"{path}[{i}]", warnings)
            out.append(cleaned)
        # Drop None list items (caller sees a shorter list rather than nulls)
        out = [x for x in out if x is not None]
        return out, warnings
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            cleaned, _ = reject_stale_strings(v, f"{path}.{k}" if path else k, warnings)
            if cleaned is not None:
                out[k] = cleaned
        return out, warnings
    return obj, warnings


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

def update_inflation_fed_rate(inflation_section: dict, raw_fed: dict) -> list[str]:
    """Refresh inflation.fedRate.kpis (3 cards) and inflation.badge from _raw_fed."""
    if not isinstance(raw_fed, dict) or not inflation_section:
        return []
    cpi = raw_fed.get("latest_cpi_headline_pct")
    fed_rate = raw_fed.get("fed_funds_rate_current")
    next_fomc = raw_fed.get("next_fomc_date")
    last_dec = raw_fed.get("last_fomc_decision")
    notes = raw_fed.get("key_notes")
    fw = raw_fed.get("cme_fedwatch") or {}
    updates = []

    fr = inflation_section.get("fedRate") or {}
    kpis = fr.get("kpis") or []
    if not kpis:
        return []

    # KPI 0: Fed Funds Rate
    if fed_rate and len(kpis) >= 1:
        det = last_dec if last_dec else "Held since last FOMC."
        kpis[0]["value"] = str(fed_rate)
        kpis[0]["detail"] = str(det)
        updates.append("fedRate.kpis[Fed Funds Rate]")

    # KPI 1: Next FOMC
    if next_fomc and len(kpis) >= 2:
        kpis[1]["value"] = str(next_fomc)
        if notes:
            kpis[1]["detail"] = str(notes)[:200]
        updates.append("fedRate.kpis[Next FOMC]")

    # KPI 2: Market Pricing — from cme_fedwatch
    if fw and len(kpis) >= 3:
        no_change = fw.get("no_change_pct")
        one_cut = fw.get("one_cut_pct")
        two_cuts = fw.get("two_cuts_pct")
        hike = fw.get("hike_pct")
        parts = []
        if no_change is not None:
            parts.append(f"Hold {no_change:.0f}%")
        if one_cut is not None:
            parts.append(f"-25bp {one_cut:.0f}%")
        if two_cuts is not None:
            parts.append(f"-50bp {two_cuts:.0f}%")
        if hike is not None and hike > 1:
            parts.append(f"Hike {hike:.0f}%")
        if parts:
            kpis[2]["value"] = " · ".join(parts)
            kpis[2]["detail"] = "CME FedWatch implied probabilities."
            updates.append("fedRate.kpis[Market Pricing]")

    fr["kpis"] = kpis
    inflation_section["fedRate"] = fr

    # Badge: drive from CPI level
    if cpi is not None:
        try:
            cv = float(cpi)
            if cv >= 4:
                inflation_section["badge"] = f"CPI {cv:.1f}% — ELEVATED"
            elif cv >= 3:
                inflation_section["badge"] = f"CPI {cv:.1f}% — STICKY ABOVE TARGET"
            else:
                inflation_section["badge"] = f"CPI {cv:.1f}% — APPROACHING TARGET"
            updates.append("inflation.badge")
        except (ValueError, TypeError):
            pass

    # Sources: pull from any "sources" or citation field if Sonar provided one
    raw_sources = raw_fed.get("sources")
    if isinstance(raw_sources, list) and raw_sources:
        inflation_section["sources"] = [str(s) for s in raw_sources[:8]]
        updates.append(f"sources({len(raw_sources)})")

    return [f"inflation: {', '.join(updates)}"] if updates else []


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


# ---------------------------------------------------------------------------
# Analytical processing — TACO, signals, rhetoric, gist, news, operations
# ---------------------------------------------------------------------------

WAR_START_DATE = datetime(2026, 2, 28)   # Day 1


def day_to_date(day: int) -> datetime:
    return WAR_START_DATE + timedelta(days=day - 1)


def day_date_short(day: int) -> str:
    d = day_to_date(day)
    return d.strftime("%d %b").lstrip("0")


def derive_taco_score(raw_intel: dict, raw_rhetoric: dict, raw_bca: dict) -> int:
    """Calculate TACO score (0-50) from raw intelligence signals."""
    score = 5  # baseline during stable ceasefire

    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}

    # 1. Ceasefire status (biggest weight)
    cf = str(intel.get("ceasefire_status", "")).lower()
    if any(w in cf for w in ("collapse", "ended", "broken", "violated")):
        score += 12
    elif "ceasefire" in cf and any(w in cf for w in ("negot", "talks", "proposal")):
        score += 5
    elif "ceasefire" in cf:
        score += 3
    elif any(w in cf for w in ("active conflict", "no ceasefire", "hostilities")):
        score += 20

    # 2. Hormuz
    hz = str(intel.get("hormuz_status", "")).lower()
    if any(w in hz for w in ("blockade", "closed", "mined")):
        score += 8
    elif any(w in hz for w in ("restricted", "partial")):
        score += 4

    # 3. Rhetoric temperature
    temp = str(rhetoric.get("overall_rhetoric_temperature", "")).lower()
    temp_add = {"extreme": 8, "very hot": 7, "hot": 5, "warm": 3, "cool": 1}
    score += temp_add.get(temp, 3)

    # 4. Diplomatic failure signals
    diplo = rhetoric.get("diplomatic_developments", [])
    if isinstance(diplo, list):
        diplo_text = " ".join(str(d) for d in diplo).lower()
        if any(w in diplo_text for w in ("collapse", "fail", "reject", "no deal", "broke down")):
            score += 4

    # 5. Active attacks
    houthi = intel.get("houthi_attacks_last_24h")
    if houthi and isinstance(houthi, (int, float)) and houthi > 0:
        score += 2

    return min(score, 50)


def update_meta_day(data: dict, day: int, taco: int) -> list[str]:
    """Update meta section with correct day, TACO score, threat level."""
    if "meta" not in data:
        return []
    meta = data["meta"]
    updates = []
    old_day = meta.get("day")
    meta["day"] = day
    updates.append(f"meta.day {old_day} -> {day}")

    meta["tacoScore"] = taco
    if taco >= 25:
        meta["threatLevel"] = "EXTREME"
        meta["threatClass"] = "threat-red"
    elif taco >= 15:
        meta["threatLevel"] = "HIGH"
        meta["threatClass"] = "threat-red"
    elif taco >= 8:
        meta["threatLevel"] = "ELEVATED"
        meta["threatClass"] = "threat-orange"
    else:
        meta["threatLevel"] = "MODERATE"
        meta["threatClass"] = "threat-yellow"
    updates.append(f"meta.taco={taco}, threat={meta['threatLevel']}")

    # TACO regime line
    cf = ""
    for src in [data.get("_raw_intelligence", {}), data]:
        cf = str(safe_get(src, "ceasefire_status") or "")
        if cf:
            break
    brent = safe_get(data, "kpis", "brent", "price")
    regime_parts = []
    if cf:
        regime_parts.append(cf.upper()[:60])
    if brent:
        regime_parts.append(f"BRENT ${brent}")
    if regime_parts:
        meta["tacoRegime"] = " · ".join(regime_parts)

    return updates


def update_analytical_signals(data: dict, raw_intel: dict, raw_rhetoric: dict, day: int) -> list[str]:
    """Map raw intelligence to dashboard analytical signal cards."""
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    if not intel and not rhetoric:
        return []

    signals = []
    cf = str(intel.get("ceasefire_status", "")).lower()
    hz = str(intel.get("hormuz_status", "")).lower()
    temp = str(rhetoric.get("overall_rhetoric_temperature", "")).lower()

    # Ceasefire compliance
    cf_day = max(day - 40, 0)
    if any(w in cf for w in ("collapse", "broken", "violated")):
        signals.append({"label": "Ceasefire Compliance", "value": "AT RISK",
                        "score": 3, "scoreColor": "#ef4444",
                        "detail": str(intel.get("ceasefire_status", ""))[:200]})
    elif "ceasefire" in cf and cf_day > 0:
        signals.append({"label": "Ceasefire Compliance", "value": f"DAY {cf_day} ✓",
                        "score": min(5 + cf_day // 3, 8), "scoreColor": "#f59e0b",
                        "detail": str(intel.get("ceasefire_status", ""))[:200]})

    # Diplomatic engagement
    diplo = rhetoric.get("diplomatic_developments", [])
    diplo_text = " ".join(str(d) for d in diplo).lower() if isinstance(diplo, list) else ""
    if any(w in diplo_text for w in ("collapse", "fail", "no deal", "rejected")):
        signals.append({"label": "Diplomatic Engagement", "value": "COLLAPSED",
                        "score": 2, "scoreColor": "#ef4444",
                        "detail": str(diplo[0])[:200] if diplo else ""})
    elif any(w in diplo_text for w in ("negotiat", "talks", "meeting", "proposal")):
        signals.append({"label": "Diplomatic Engagement", "value": "ACTIVE",
                        "score": 6, "scoreColor": "#f59e0b",
                        "detail": str(diplo[0])[:200] if diplo else ""})

    # Hormuz passage
    if "blockade" in hz:
        signals.append({"label": "Hormuz Passage", "value": "BLOCKADE",
                        "score": 2, "scoreColor": "#ef4444",
                        "detail": f"Hormuz: {hz.upper()}"})
    elif "open" in hz:
        t = intel.get("hormuz_daily_vessel_transits")
        val = f"OPEN ({t}/day)" if t else "OPEN"
        signals.append({"label": "Hormuz Passage", "value": val,
                        "score": 7, "scoreColor": "#22c55e",
                        "detail": f"Strait status: {hz}"})

    # Rhetoric temperature
    if temp:
        t_map = {"extreme": (2, "#ef4444"), "very hot": (2, "#ef4444"),
                 "hot": (3, "#ef4444"), "warm": (5, "#f59e0b"), "cool": (7, "#22c55e")}
        sc, col = t_map.get(temp, (5, "#f59e0b"))
        signals.append({"label": "Rhetoric Temperature", "value": temp.upper(),
                        "score": sc, "scoreColor": col,
                        "detail": "Leadership rhetoric assessment"})

    if signals:
        data["analyticalSignals"] = signals
        return [f"analyticalSignals: {len(signals)} signals"]
    return []


def update_rhetoric_tracker(data: dict, raw_rhetoric: dict, day: int) -> list[str]:
    """Add new rhetoric timeline entries and update sentiment."""
    if not raw_rhetoric or "rhetoricTracker" not in data:
        return []

    tracker = data["rhetoricTracker"]
    timeline = tracker.get("timeline", [])
    updates = []

    # Existing dates to avoid duplicates
    existing = {e.get("date", "") for e in timeline}

    sources = [
        ("trump_statements", "Trump", "US"),
        ("iran_leadership_statements", None, "IR"),
        ("israel_statements", None, "IL"),
    ]
    added = 0
    for key, default_speaker, tag in sources:
        stmts = raw_rhetoric.get(key, [])
        if not isinstance(stmts, list):
            continue
        for s in stmts:
            date = s.get("date", day_date_short(day))
            if date in existing:
                continue
            existing.add(date)
            quote = s.get("quote_or_summary", "")
            if not quote:
                continue
            speaker = default_speaker or s.get("speaker", tag)
            if "(" in speaker:
                speaker = speaker.split("(")[0].strip()
            esc_words = ("destroy", "revenge", "nuclear", "war ", "blockade", "won")
            esc = 8 if any(w in quote.lower() for w in esc_words) else 5
            timeline.append({"date": date, "speaker": speaker,
                             "text": quote[:250], "tag": tag, "escalation": esc})
            added += 1

    if added:
        tracker["timeline"] = timeline
        updates.append(f"rhetoricTracker.timeline: +{added} entries")

    # Update sentiment from temperature
    temp = str(raw_rhetoric.get("overall_rhetoric_temperature", "")).lower()
    if temp:
        t_scores = {"cool": 25, "warm": 40, "hot": 60, "very hot": 75, "extreme": 90}
        sc = t_scores.get(temp, 50)
        sent = tracker.get("sentiment", {})
        sent["score"] = sc
        sent["barWidth"] = f"{sc}%"
        sent["barColor"] = "#ef4444" if sc >= 60 else ("#f59e0b" if sc >= 40 else "#22c55e")
        sent["value"] = f"{'Escalatory' if sc >= 60 else 'Mixed'} — {temp}"
        updates.append(f"rhetoricTracker.sentiment -> {sc}")

    return updates


def update_gist_banner(data: dict, raw_intel: dict, raw_rhetoric: dict,
                       raw_fed: dict, kpis: dict) -> list[str]:
    """Generate gist banner bullets from raw intelligence."""
    if "gistBanner" not in data:
        return []
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    fed = raw_fed or {}

    bullets = []
    esc_words = ("collapse", "blockade", "attack", "escalat", "reject", "strike", "nuclear")

    # Key developments (most important source)
    for dev in (intel.get("key_developments") or [])[:3]:
        dev_s = str(dev)
        color = "red" if any(w in dev_s.lower() for w in esc_words) else "yellow"
        bullets.append({"text": dev_s, "color": color})

    # Top diplomatic development (if not duplicate)
    diplo = rhetoric.get("diplomatic_developments", [])
    if isinstance(diplo, list):
        for d in diplo[:2]:
            d_s = str(d)
            if not any(d_s[:35].lower() in b["text"].lower() for b in bullets):
                color = "red" if any(w in d_s.lower() for w in esc_words) else "yellow"
                bullets.append({"text": d_s, "color": color})

    # CPI/inflation
    cpi = fed.get("latest_cpi_headline_pct")
    brent = safe_get(kpis, "brent", "price")
    if cpi:
        note = ""
        kn = fed.get("key_notes")
        if isinstance(kn, list) and kn:
            note = f" {kn[0]}"
        bullets.append({"text": f"CPI {cpi}%. Fed funds {fed.get('fed_funds_rate_current', 'N/A')}.{note}", "color": "yellow"})
    elif brent:
        bullets.append({"text": f"Brent ${brent}.", "color": "yellow"})

    # Pills: derived from live KPIs + intel state, NOT from Sonar prose
    pills = []
    brent_q = (kpis or {}).get("brent") or {}
    if brent_q.get("price"):
        bp = brent_q["price"]
        chg = brent_q.get("changePct") or 0
        if chg >= 2:
            color = "red"
        elif chg >= 0:
            color = "amber"
        else:
            color = "amber"  # falling brent on a wartime dashboard is also notable
        pills.append({"label": f"Brent ${bp:.2f}" if isinstance(bp, (int, float)) else f"Brent {bp}", "color": color})

    # TACO from chart taco array (last entry) or from data root
    taco_val = None
    chart_taco = safe_get(data, "chartData", "taco", default=None)
    if isinstance(chart_taco, list) and chart_taco:
        taco_val = chart_taco[-1]
    elif data.get("meta", {}).get("taco") is not None:
        taco_val = data["meta"]["taco"]
    if taco_val is not None:
        try:
            tv = int(taco_val)
            if tv < 10:
                tcolor = "red"
            elif tv < 20:
                tcolor = "amber"
            else:
                tcolor = "green"
            pills.append({"label": f"TACO {tv}", "color": tcolor})
        except (ValueError, TypeError):
            pass

    vix_q = (kpis or {}).get("vix") or {}
    if vix_q.get("price") is not None:
        vv = vix_q["price"]
        try:
            vf = float(vv)
            if vf >= 25:
                vcolor = "red"
            elif vf >= 18:
                vcolor = "amber"
            else:
                vcolor = "green"
            pills.append({"label": f"VIX {vf:.2f}", "color": vcolor})
        except (ValueError, TypeError):
            pass

    cf = (intel.get("ceasefire_status") or "").lower()
    if cf:
        if any(w in cf for w in ("collapse", "fail", "broken")):
            pills.append({"label": "Talks COLLAPSED", "color": "red"})
        elif any(w in cf for w in ("agreed", "holding", "in effect")):
            pills.append({"label": "Ceasefire HOLDING", "color": "green"})
        elif any(w in cf for w in ("negot", "talks", "underway", "deadlock")):
            pills.append({"label": "Talks ACTIVE", "color": "amber"})

    hz = (intel.get("hormuz_status") or "").upper()
    if hz:
        if "CLOSED" in hz or "BLOCKADE" in hz:
            pills.append({"label": "Hormuz CLOSED", "color": "red"})
        elif "PARTIAL" in hz or "CONTESTED" in hz:
            pills.append({"label": "Hormuz CONTESTED", "color": "amber"})
        elif "OPEN" in hz:
            pills.append({"label": "Hormuz OPEN", "color": "green"})

    cpi_v = (fed or {}).get("latest_cpi_headline_pct")
    if cpi_v is None:
        # Fall back to inflation.derivation.result if Fed payload missing
        deriv = safe_get(data, "inflation", "derivation", "result")
        if isinstance(deriv, str):
            m = _re.search(r"(\d+(?:\.\d+)?)\s*%", deriv)
            if m:
                cpi_v = float(m.group(1))
    if cpi_v is not None:
        try:
            cv = float(cpi_v)
            ccolor = "red" if cv >= 4 else ("amber" if cv >= 3 else "green")
            pills.append({"label": f"CPI {cv:.1f}%", "color": ccolor})
        except (ValueError, TypeError):
            pass

    # Sentiment flag — escalation-of-the-day from key_developments
    all_devs_text = " ".join(str(x) for x in (intel.get("key_developments") or []))
    if "lebanon" in all_devs_text.lower():
        pills.append({"label": "Lebanon ⚠", "color": "red"})

    if bullets:
        data["gistBanner"]["bullets"] = bullets[:5]
    if pills:
        data["gistBanner"]["pills"] = pills[:7]
    notes = []
    if bullets:
        notes.append(f"gistBanner: {len(bullets[:5])} bullets")
    if pills:
        notes.append(f"gistBanner.pills: {len(pills[:7])} pills (live data, not Sonar)")
    return notes


def update_news_now(data: dict, raw_intel: dict, raw_rhetoric: dict) -> list[str]:
    """Generate newsNow cards from raw intelligence and rhetoric."""
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    cards = []

    label_map = [
        (("ceasefire",), "CEASEFIRE"), (("block", "hormuz"), "HORMUZ"),
        (("strike", "attack", "military", "bomb"), "MILITARY"),
        (("nuclear",), "NUCLEAR"), (("talk", "negot", "diplom"), "TALKS"),
    ]

    def pick_label(text):
        t = text.lower()
        for words, lbl in label_map:
            if any(w in t for w in words):
                return lbl
        return "CONFLICT"

    esc_words = ("collapse", "blockade", "attack", "escalat", "reject", "fail")

    for dev in (intel.get("key_developments") or [])[:4]:
        s = str(dev)
        title = s.split(".")[0][:90] if "." in s else s[:90]
        color = "red" if any(w in s.lower() for w in esc_words) else "yellow"
        cards.append({"label": pick_label(s), "title": title, "body": s, "color": color})

    for d in (rhetoric.get("diplomatic_developments") or [])[:2]:
        s = str(d)
        if any(s[:30].lower() in c.get("body", "").lower() for c in cards):
            continue
        title = s.split(".")[0][:90] if "." in s else s[:90]
        cards.append({"label": "TALKS", "title": title, "body": s, "color": "yellow"})

    if cards:
        data["newsNow"] = cards[:6]
        return [f"newsNow: {len(cards[:6])} cards"]
    return []


def update_operations(data: dict, raw_intel: dict, day: int) -> list[str]:
    """Update operations badge and KPIs from intelligence."""
    if "operations" not in data:
        return []
    intel = raw_intel or {}
    updates = []

    cf = str(intel.get("ceasefire_status", ""))
    hz = str(intel.get("hormuz_status", ""))

    # Badge
    parts = []
    cf_day = max(day - 40, 0)
    if "ceasefire" in cf.lower() and cf_day > 0:
        parts.append(f"CEASEFIRE · DAY {cf_day}")
    if any(w in cf.lower() for w in ("collapse", "no deal")):
        parts.append("TALKS COLLAPSED")
    elif any(w in cf.lower() for w in ("negot", "talks")):
        parts.append("NEGOTIATIONS")
    if "blockade" in hz.lower():
        parts.append("NAVAL BLOCKADE")
    if parts:
        data["operations"]["badge"] = " — ".join(parts)
        updates.append("operations.badge updated")

    # KPIs
    kpis = []
    us_strikes = intel.get("us_strikes_total_cumulative")
    if us_strikes is not None:
        kpis.append({"label": f"US Strikes D{day}", "value": "0" if cf_day > 0 else str(us_strikes),
                     "delta": "ZERO — ceasefire" if cf_day > 0 else f"Total: {us_strikes:,}",
                     "note": f"Cumulative: {us_strikes:,}", "color": "green" if cf_day > 0 else "red"})
    troops = safe_get(intel, "us_force_posture", "troops_deployed")
    if troops:
        kpis.append({"label": "US Troops", "value": f"{troops:,}+",
                     "delta": "Forward deployed", "note": "CENTCOM", "color": "yellow"})
    kia = intel.get("us_military_kia")
    if kia is not None:
        kpis.append({"label": "US KIA", "value": str(kia),
                     "delta": "", "note": f"Through D{day}", "color": "red"})
    vessels = intel.get("vessels_attacked_or_sunk")
    if vessels:
        kpis.append({"label": "Vessels Hit", "value": str(vessels),
                     "delta": "Attacked/sunk", "note": "Cumulative", "color": "red"})
    civ = intel.get("civilian_casualties_reported")
    if civ:
        kpis.append({"label": "Civilian Casualties", "value": f"{civ:,}+",
                     "delta": "Reported", "note": f"Through D{day}", "color": "red"})
    if kpis:
        data["operations"]["kpis"] = kpis
        updates.append(f"operations.kpis: {len(kpis)} items")

    # uaeAttackSummary — mirror raw intel iran_attacks_on_uae
    uae_intel = intel.get("iran_attacks_on_uae")
    if isinstance(uae_intel, dict):
        out = {}
        m = uae_intel.get("ballistic_missiles_cumulative")
        if m is not None:
            out["ballisticMissiles"] = f"{m:,}"
        m = uae_intel.get("cruise_missiles_cumulative")
        if m is not None:
            out["cruiseMissiles"] = f"{m:,}"
        m = uae_intel.get("drones_cumulative")
        if m is not None:
            out["drones"] = f"{m:,}"
        m = uae_intel.get("total_cumulative")
        if m is not None:
            out["totalProjectiles"] = f"{m:,}"
        k = uae_intel.get("killed")
        i_inj = uae_intel.get("injured")
        if k is not None or i_inj is not None:
            out["casualties"] = f"{k or 0} killed / {i_inj or 0} injured"
        rate = uae_intel.get("intercept_rate_pct")
        if rate is not None:
            out["interceptRate"] = f"{rate:.0f}%"
        if out:
            existing = data["operations"].get("uaeAttackSummary") or {}
            existing.update(out)
            data["operations"]["uaeAttackSummary"] = existing
            updates.append(f"operations.uaeAttackSummary: {len(out)} field(s)")

    # iranNeighbors — convert intel.iran_attacks_on_neighbors into row list
    nb_intel = intel.get("iran_attacks_on_neighbors")
    if isinstance(nb_intel, dict):
        countries = nb_intel.get("countries_hit") or []
        total = nb_intel.get("total_projectiles") or 0
        if countries and isinstance(countries, list):
            existing_rows = data["operations"].get("iranNeighbors") or []
            # Build a name→row index from existing for note preservation
            existing_by_country = {}
            if isinstance(existing_rows, list):
                for r in existing_rows:
                    if isinstance(r, dict) and r.get("country"):
                        existing_by_country[str(r["country"]).lower()] = r
            new_rows = []
            for c in countries[:6]:
                cn = str(c)
                prev = existing_by_country.get(cn.lower(), {})
                new_rows.append({
                    "country": cn,
                    "missiles": prev.get("missiles", "—"),
                    "drones": prev.get("drones", "—"),
                    "total": prev.get("total", "—"),
                    "notes": prev.get("notes", f"Hit during conflict (cumulative: {total:,} projectiles across all neighbors)"),
                })
            data["operations"]["iranNeighbors"] = new_rows
            updates.append(f"operations.iranNeighbors: {len(new_rows)} country rows")

    # indicators — derive from intel + KPIs (a few mechanical signals)
    inds = []
    cf_l = cf.lower()
    if "ceasefire" in cf_l:
        inds.append({"indicator": "Ceasefire status", "value": "HOLDING" if cf_day > 0 else "NEGOTIATING",
                     "dir": "↑" if cf_day > 0 else "→", "dirClass": "ind-up" if cf_day > 0 else "ind-flat",
                     "notes": str(intel.get("ceasefire_status", ""))[:140]})
    if hz:
        hz_u = hz.upper()
        is_open = "OPEN" in hz_u
        inds.append({"indicator": "Hormuz transit", "value": "OPEN" if is_open else hz_u,
                     "dir": "↑" if is_open else "↓", "dirClass": "ind-up" if is_open else "ind-down",
                     "notes": f"Daily transits: {intel.get('hormuz_daily_vessel_transits', 'N/A')}"})
    houthi = intel.get("houthi_attacks_last_24h")
    if houthi is not None:
        inds.append({"indicator": "Houthi attacks (24h)", "value": str(houthi),
                     "dir": "↑" if int(houthi or 0) > 0 else "→",
                     "dirClass": "ind-down" if int(houthi or 0) > 0 else "ind-flat",
                     "notes": "Bab el Mandeb / Red Sea threat indicator"})
    if inds:
        data["operations"]["indicators"] = inds
        updates.append(f"operations.indicators: {len(inds)} signals")

    return updates


def inject_chart_analytics(chart_append: dict, raw_intel: dict, taco: int, day: int) -> list[str]:
    """Inject TACO score, strikes, and Hormuz data into chartAppend."""
    updates = []
    intel = raw_intel or {}
    ds = day_date_short(day)

    chart_append["taco"] = taco
    updates.append(f"chartAppend.taco = {taco}")

    # Strikes
    cf = str(intel.get("ceasefire_status", "")).lower()
    chart_append["strikeLabels"] = ds
    if "ceasefire" in cf:
        chart_append["strikes_us"] = 0
        chart_append["strikes_iran"] = 0
    else:
        chart_append["strikes_us"] = 0
        chart_append["strikes_iran"] = 0
    updates.append("chartAppend.strikes set")

    # Hormuz
    transits = intel.get("hormuz_daily_vessel_transits")
    if transits is not None:
        chart_append["hormuzTransits"] = transits
    elif "blockade" in str(intel.get("hormuz_status", "")).lower():
        chart_append["hormuzTransits"] = 1
    else:
        chart_append["hormuzTransits"] = 4  # default moderate
    chart_append["hormuzLabels"] = ds
    updates.append(f"chartAppend.hormuz = {chart_append.get('hormuzTransits')}")

    return updates


def update_ceasefire_analytics(data: dict, raw_intel: dict, raw_rhetoric: dict,
                                day: int, taco: int) -> list[str]:
    """Update ceasefireAnalytics section from raw intelligence."""
    if "ceasefireAnalytics" not in data:
        return []
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    ca = data["ceasefireAnalytics"]
    updates = []

    cf = str(intel.get("ceasefire_status", ""))
    cf_lower = cf.lower()

    # Meta
    if "meta" in ca:
        cf_day = max(day - 40, 0)
        if "ceasefire" in cf_lower and cf_day > 0:
            ca["meta"]["badge"] = f"CEASEFIRE DAY {cf_day}"
        elif any(w in cf_lower for w in ("collapse", "ended", "broken")):
            ca["meta"]["badge"] = "CEASEFIRE AT RISK"
        else:
            ca["meta"]["badge"] = f"DAY {day}"
        ca["meta"]["day"] = day
        ca["meta"]["tacoScore"] = taco
        # Headline from ceasefire status + key developments
        key_devs = intel.get("key_developments", [])
        if isinstance(key_devs, list) and key_devs:
            ca["meta"]["headline"] = str(key_devs[0])[:300]
        elif cf:
            ca["meta"]["headline"] = cf[:300]
        updates.append(f"ceasefireAnalytics.meta -> day {day}, {ca['meta']['badge']}")

    # Update demand statuses if we have intelligence
    if "usDemands" in ca and isinstance(ca["usDemands"], list):
        for demand in ca["usDemands"]:
            cat = str(demand.get("category", "")).lower()
            txt = str(demand.get("text", "")).lower()
            # 30-day ceasefire
            if "ceasefire" in txt and "30" in txt:
                if any(w in cf_lower for w in ("collapse", "broken")):
                    demand["status"] = "AT RISK"
                    demand["statusLabel"] = f"Ceasefire fragile — Day {day}"
                    demand["statusColor"] = "#ef4444"
                elif "ceasefire" in cf_lower:
                    cf_day = max(day - 40, 0)
                    demand["status"] = "PARTIAL"
                    demand["statusLabel"] = f"Day {cf_day} of ceasefire"
                    demand["statusColor"] = "#f59e0b"
            # Hormuz
            if "hormuz" in txt:
                hz = str(intel.get("hormuz_status", "")).lower()
                if "blockade" in hz:
                    demand["status"] = "BLOCKED"
                    demand["statusLabel"] = "Naval blockade in effect"
                    demand["statusColor"] = "#ef4444"
                elif "open" in hz:
                    demand["status"] = "OPEN"
                    demand["statusLabel"] = "Strait open, transit normalized"
                    demand["statusColor"] = "#22c55e"
        updates.append("ceasefireAnalytics.demands updated")

    # ── ceasefire sub-block (currentDay etc.) ─────────────────────────────
    cf_day = max(day - 40, 0)
    cf_block = ca.get("ceasefire") or {}
    if cf_day > 0:
        cf_block["currentDay"] = f"DAY {cf_day}"
    cf_status = (intel.get("ceasefire_status") or "")
    if cf_status:
        cf_block["status"] = str(cf_status)[:200]
    if cf_block:
        ca["ceasefire"] = cf_block
        updates.append("ceasefireAnalytics.ceasefire (currentDay/status)")

    # ── summaryKpis: 4 derived KPIs ───────────────────────────────────────
    skp = []
    brent_p = safe_get(raw_intel, "_raw_fmp", "brent", "price")  # may not exist
    if not brent_p:
        # Fall back to KPIs in data
        brent_p = safe_get(data, "kpis", "brent", "price")
    if brent_p:
        skp.append({"label": "Brent", "value": f"${brent_p}",
                    "detail": "Live KPI", "color": "#22c55e"})
    if intel.get("hormuz_status"):
        skp.append({"label": "Hormuz", "value": str(intel["hormuz_status"]).upper()[:14],
                    "detail": f"Daily transits: {intel.get('hormuz_daily_vessel_transits', 'N/A')}",
                    "color": "#22c55e" if "OPEN" in str(intel["hormuz_status"]).upper() else "#ef4444"})
    if intel.get("us_strikes_total_cumulative") is not None:
        skp.append({"label": "US Strikes", "value": f"{intel['us_strikes_total_cumulative']:,}",
                    "detail": "Cumulative", "color": "#94a3b8"})
    if intel.get("us_military_kia") is not None:
        skp.append({"label": "US KIA", "value": str(intel["us_military_kia"]),
                    "detail": f"Through D{day}", "color": "#ef4444"})
    if skp:
        ca["summaryKpis"] = skp
        updates.append(f"ceasefireAnalytics.summaryKpis: {len(skp)} KPIs")

    # NOTE: compromiseZone, chinaFactor, violationImpact still preserve prior
    # values (need analytical Sonar prompt extension to refresh dynamically).

    return updates


def update_intelligence(data: dict, raw_intel: dict, raw_rhetoric: dict,
                        raw_bca: dict, day: int) -> list[str]:
    """Update intelligence section from raw Sonar data."""
    if "intelligence" not in data:
        return []
    intel_data = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    bca = raw_bca or {}
    intl = data["intelligence"]
    updates = []

    cf = str(intel_data.get("ceasefire_status", ""))
    cf_lower = cf.lower()
    hz = str(intel_data.get("hormuz_status", ""))

    # Diplomatic column
    if "diplomatic" in intl:
        diplo_devs = rhetoric.get("diplomatic_developments", [])
        if any(w in cf_lower for w in ("collapse", "fail", "no deal")):
            intl["diplomatic"]["badge"] = "COLLAPSED"
            intl["diplomatic"]["badgeColor"] = "#ef4444"
        elif any(w in cf_lower for w in ("negot", "talks", "proposal")):
            intl["diplomatic"]["badge"] = "TALKS"
            intl["diplomatic"]["badgeColor"] = "#22c55e"
        elif "ceasefire" in cf_lower:
            intl["diplomatic"]["badge"] = "CEASEFIRE"
            intl["diplomatic"]["badgeColor"] = "#f59e0b"
        # Update sections from developments
        if isinstance(diplo_devs, list) and diplo_devs:
            sections = []
            sections.append({
                "title": f"Diplomatic Status — Day {day}",
                "items": [cf if cf else "Status unknown"]
            })
            for dev in diplo_devs[:3]:
                dev_s = str(dev)
                sections.append({
                    "title": dev_s.split(".")[0][:80] if "." in dev_s else dev_s[:80],
                    "items": [dev_s]
                })
            intl["diplomatic"]["sections"] = sections
        updates.append("intelligence.diplomatic updated")

    # Military column
    if "military" in intl:
        us_strikes = intel_data.get("us_strikes_total_cumulative")
        troops = safe_get(intel_data, "us_force_posture", "troops_deployed")
        kia = intel_data.get("us_military_kia")
        sections = []
        if us_strikes is not None:
            stats = []
            stats.append(f"US strikes cumulative: {us_strikes:,}")
            stats.append(f"US KIA: {kia or 'N/A'}")
            if troops:
                stats.append(f"Troops deployed: {troops:,}+")
            sections.append({
                "title": f"Conflict Statistics — Day {day}",
                "items": stats
            })
        key_devs = intel_data.get("key_developments", [])
        if isinstance(key_devs, list):
            for dev in key_devs[:2]:
                dev_s = str(dev)
                if any(w in dev_s.lower() for w in ("military", "strike", "attack", "force", "troop")):
                    sections.append({"title": dev_s.split(".")[0][:80], "items": [dev_s]})
        if sections:
            intl["military"]["sections"] = sections
            intl["military"]["badge"] = "CEASEFIRE" if "ceasefire" in cf_lower else "ACTIVE"
            intl["military"]["badgeColor"] = "#22c55e" if "ceasefire" in cf_lower else "#ef4444"
        updates.append("intelligence.military updated")

    # Energy / Hormuz column (frontend key = "energy")
    if "energy" in intl:
        intl["energy"]["badge"] = hz.upper() if hz else "UNKNOWN"
        intl["energy"]["badgeColor"] = "#ef4444" if "blockade" in hz.lower() else "#22c55e"
        transits = intel_data.get("hormuz_daily_vessel_transits")
        bca_oil = bca.get("oil_supply_disruption_bpd") or bca.get("brent_note")
        items = [f"Hormuz status: {hz}", f"Daily transits: {transits or 'N/A'}"]
        if bca_oil:
            items.append(str(bca_oil))
        sections = [{"title": f"Energy & Shipping — Day {day}", "items": items}]
        intl["energy"]["sections"] = sections
        updates.append("intelligence.energy updated")

    return updates


def update_key_triggers(data: dict, raw_intel: dict, raw_rhetoric: dict,
                        day: int) -> list[str]:
    """Update keyTriggers from intelligence and rhetoric."""
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    if not intel and not rhetoric:
        return []

    triggers = []
    cf = str(intel.get("ceasefire_status", "")).lower()
    hz = str(intel.get("hormuz_status", "")).lower()
    key_devs = intel.get("key_developments", [])
    diplo = rhetoric.get("diplomatic_developments", [])

    # Generate triggers from key developments
    if isinstance(key_devs, list):
        for dev in key_devs[:3]:
            dev_s = str(dev)
            color = "#ef4444" if any(w in dev_s.lower() for w in ("collapse", "attack", "blockade", "escalat")) else "#f59e0b"
            title = dev_s.split(".")[0][:80] if "." in dev_s else dev_s[:80]
            triggers.append({"title": title, "titleColor": color, "body": dev_s})

    # Ceasefire trigger
    if "ceasefire" in cf:
        color = "#ef4444" if any(w in cf for w in ("collapse", "broken", "risk")) else "#f59e0b"
        triggers.append({
            "title": f"Ceasefire Status (Day {day})",
            "titleColor": color,
            "body": str(intel.get("ceasefire_status", ""))
        })

    # Hormuz trigger
    if hz:
        color = "#ef4444" if "blockade" in hz else "#22c55e"
        triggers.append({
            "title": "Hormuz Passage",
            "titleColor": color,
            "body": f"Status: {hz}. Daily transits: {intel.get('hormuz_daily_vessel_transits', 'N/A')}."
        })

    # Diplomatic trigger
    if isinstance(diplo, list) and diplo:
        triggers.append({
            "title": "Diplomatic Outlook",
            "titleColor": "#f59e0b",
            "body": ". ".join(str(d) for d in diplo[:3])
        })

    if triggers:
        data["keyTriggers"] = triggers[:5]
        return [f"keyTriggers: {len(triggers[:5])} triggers"]
    return []


# ---------------------------------------------------------------------------
# Analytical-prose sections — dLive, analyticalOutlook (from fetch_sonar_analytical)
# ---------------------------------------------------------------------------

def _coerce_str(v, default=""):
    if v is None:
        return default
    return str(v).strip()


def update_d_live(data: dict, raw_analytical: dict) -> list[str]:
    """Update dLive from the analytical Sonar bundle. Skip-on-missing preserves prior day."""
    if "dLive" not in data:
        return []
    bundle = raw_analytical or {}
    dl = bundle.get("dLive") if isinstance(bundle, dict) else None
    if not isinstance(dl, dict):
        return []
    target = data["dLive"]
    fields_updated = []
    for key in ("label", "brentRange", "brentNote", "tacoEst", "tacoNote"):
        v = dl.get(key)
        if v is None or (isinstance(v, str) and not v.strip()):
            continue  # preserve previous value
        target[key] = _coerce_str(v)
        fields_updated.append(key)
    if fields_updated:
        return [f"dLive: {len(fields_updated)} field(s) refreshed ({', '.join(fields_updated)})"]
    return []


def update_analytical_outlook(data: dict, raw_analytical: dict) -> list[str]:
    """Update analyticalOutlook from the analytical Sonar bundle."""
    if "analyticalOutlook" not in data:
        return []
    bundle = raw_analytical or {}
    ao = bundle.get("analyticalOutlook") if isinstance(bundle, dict) else None
    if not isinstance(ao, dict):
        return []
    target = data["analyticalOutlook"]
    updated = []

    label = ao.get("label")
    if label and str(label).strip():
        target["label"] = _coerce_str(label)
        updated.append("label")

    cards_in = ao.get("basisCards")
    if isinstance(cards_in, list) and cards_in:
        cards_out = []
        for c in cards_in[:5]:
            if not isinstance(c, dict):
                continue
            lbl = _coerce_str(c.get("label"))
            val = _coerce_str(c.get("value"))
            det = _coerce_str(c.get("detail"))
            if not (lbl and val):
                continue
            # Default coloring by value sentiment
            v_lower = val.lower()
            if any(w in v_lower for w in ("escalat", "high", "fail", "collapse", "danger")):
                border, valc = "#ef4444", "#ef4444"
            elif any(w in v_lower for w in ("stall", "deadlock", "risk", "amber", "low-med")):
                border, valc = "#f59e0b", "#f59e0b"
            elif any(w in v_lower for w in ("steady", "underway", "hold", "open", "calm")):
                border, valc = "#22c55e", "#22c55e"
            else:
                border, valc = "#94a3b8", "#94a3b8"
            cards_out.append({
                "label": lbl,
                "value": val,
                "detail": det,
                "borderColor": border,
                "valueColor": valc,
            })
        if cards_out:
            target["basisCards"] = cards_out
            updated.append(f"basisCards({len(cards_out)})")

    paths_in = ao.get("pathProbabilities")
    if isinstance(paths_in, list) and paths_in:
        paths_out = []
        for p in paths_in[:4]:
            if not isinstance(p, dict):
                continue
            paths_out.append({
                "path": _coerce_str(p.get("path")),
                "probability": _coerce_str(p.get("probability")),
                "trigger": _coerce_str(p.get("trigger")),
            })
        if paths_out:
            target["pathProbabilities"] = paths_out
            updated.append(f"pathProbabilities({len(paths_out)})")

    sd = ao.get("supplyDisruption")
    if isinstance(sd, dict):
        sd_out = {}
        for k in ("current", "risk", "watchpoint"):
            v = sd.get(k)
            if v and str(v).strip():
                sd_out[k] = _coerce_str(v)
        if sd_out:
            existing_sd = target.get("supplyDisruption") or {}
            existing_sd.update(sd_out)
            target["supplyDisruption"] = existing_sd
            updated.append(f"supplyDisruption({len(sd_out)})")

    if updated:
        return [f"analyticalOutlook: {', '.join(updated)}"]
    return []


def update_houthi_red_sea(data: dict, raw_analytical: dict) -> list[str]:
    if "houthiRedSea" not in data:
        return []
    bundle = raw_analytical or {}
    h = bundle.get("houthiRedSea") if isinstance(bundle, dict) else None
    if not isinstance(h, dict):
        return []
    target = data["houthiRedSea"]
    updated = []
    for k in ("status", "lastVerifiedAttack", "threatLevel"):
        v = h.get(k)
        if v and str(v).strip():
            target[k] = _coerce_str(v)
            updated.append(k)
    note = h.get("babElMandebNote")
    if note and str(note).strip():
        bem = target.get("babElMandeb") or {}
        bem["note"] = _coerce_str(note)
        target["babElMandeb"] = bem
        updated.append("babElMandeb.note")
    return [f"houthiRedSea: {', '.join(updated)}"] if updated else []


def update_pipeline_bypass(data: dict, raw_analytical: dict) -> list[str]:
    if "pipelineBypass" not in data:
        return []
    bundle = raw_analytical or {}
    pb = bundle.get("pipelineBypass") if isinstance(bundle, dict) else None
    if not isinstance(pb, dict):
        return []
    target = data["pipelineBypass"]
    updated = []
    mapping = [
        ("saudiEastWestFlow", "saudiEastWest", "currentFlow"),
        ("saudiEastWestStatus", "saudiEastWest", "status"),
        ("habshanFujairahFlow", "habshanFujairah", "currentFlow"),
        ("habshanFujairahStatus", "habshanFujairah", "status"),
    ]
    for src_key, sub_key, field in mapping:
        v = pb.get(src_key)
        if v and str(v).strip():
            sub = target.get(sub_key) or {}
            sub[field] = _coerce_str(v)
            target[sub_key] = sub
            updated.append(f"{sub_key}.{field}")
    note = pb.get("combinedNote")
    if note and str(note).strip():
        cmb = target.get("combined") or {}
        cmb["note"] = _coerce_str(note)
        target["combined"] = cmb
        updated.append("combined.note")
    return [f"pipelineBypass: {len(updated)} field(s)"] if updated else []


def update_arsenal_badge(data: dict, raw_analytical: dict) -> list[str]:
    if "arsenal" not in data:
        return []
    bundle = raw_analytical or {}
    badge = bundle.get("arsenalBadge") if isinstance(bundle, dict) else None
    if not badge or not str(badge).strip():
        return []
    data["arsenal"]["badge"] = _coerce_str(badge)
    return [f"arsenal.badge -> {data['arsenal']['badge'][:40]}"]


def update_taco_inputs(data: dict, raw_analytical: dict) -> list[str]:
    """Refresh tacoInputs (5 cards) from analytical Sonar bundle.

    Schema preserves: name, subDesc, weight, maxScore, hasRhetoricLink (static).
    Sonar provides: per-card score (0-100) and rationale text.
    Computed locally: weighted, scoreClass.
    """
    if "tacoInputs" not in data:
        return []
    bundle = raw_analytical or {}
    ti = bundle.get("tacoInputs") if isinstance(bundle, dict) else None
    if not isinstance(ti, dict):
        return []
    # Map Sonar key -> tacoInputs row name (lowercase compare)
    sonar_key_map = {
        "reversibility": "reversibility",
        "rhetoric": "rhetoric",
        "diplomatic": "diplomatic",
        "marketimplied": "marketImplied",
        "domesticpolitical": "domesticPolitical",
    }
    rows = data["tacoInputs"]
    if not isinstance(rows, list):
        return []
    updated_count = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = str(row.get("name", "")).lower().replace(" ", "").replace("intensity", "")
        # Match approx: e.g. "Rhetoric Intensity" -> "rhetoric", "Domestic Political" -> "domesticpolitical"
        sonar_key = None
        for k, v in sonar_key_map.items():
            if name.startswith(k[:6]):
                sonar_key = k
                break
        if sonar_key is None:
            continue
        sonar_row = ti.get(sonar_key) or ti.get(sonar_key_map[sonar_key])
        if not isinstance(sonar_row, dict):
            continue
        sc = sonar_row.get("score")
        rat = sonar_row.get("rationale")
        if sc is None and not rat:
            continue
        if sc is not None:
            try:
                score = max(0, min(100, int(sc)))
                row["score"] = score
                # Compute weighted: weight is e.g. "30%" -> 0.30
                w = row.get("weight", "0%")
                try:
                    w_pct = float(str(w).rstrip("%")) / 100.0
                    row["weighted"] = f"{score * w_pct:.1f}"
                except (ValueError, TypeError):
                    pass
                # scoreClass
                if score < 33:
                    row["scoreClass"] = "taco-score-red"
                elif score < 66:
                    row["scoreClass"] = "taco-score-amber"
                else:
                    row["scoreClass"] = "taco-score-green"
                updated_count += 1
            except (ValueError, TypeError):
                pass
        if rat and str(rat).strip():
            row["rationale"] = _coerce_str(rat)[:300]
    return [f"tacoInputs: {updated_count}/{len(rows)} card(s) refreshed"] if updated_count else []


def update_market_signals(data: dict, raw_analytical: dict) -> list[str]:
    if "marketSignals" not in data:
        return []
    bundle = raw_analytical or {}
    ms = bundle.get("marketSignals") if isinstance(bundle, dict) else None
    if not isinstance(ms, dict):
        return []
    target = data["marketSignals"]
    updated = []
    mapping = [
        ("futuresCurveNote", "futuresCurve", "note"),
        ("riskReversalNote", "riskReversal", "note"),
        ("cdsSpreadsNote", "cdsSpreads", "note"),
        ("cftcNote", "cftc", "note"),
        ("optionsIntelligenceNote", "optionsIntelligence", "note"),
    ]
    for src_key, sub_key, field in mapping:
        v = ms.get(src_key)
        if not (v and str(v).strip()):
            continue
        existing = target.get(sub_key)
        note_text = _coerce_str(v)
        if isinstance(existing, dict):
            existing[field] = note_text
            target[sub_key] = existing
            updated.append(sub_key)
        elif isinstance(existing, list):
            # Schema variant: list of items. Attach note to first item's `note`
            # field if the item is a dict; otherwise prepend a minimal note row.
            if existing and isinstance(existing[0], dict):
                existing[0][field] = note_text
            else:
                existing.insert(0, {field: note_text})
            target[sub_key] = existing
            updated.append(f"{sub_key}[0]")
        elif existing is None:
            target[sub_key] = {field: note_text}
            updated.append(sub_key)
        # If existing is some other type (string), skip to avoid clobbering
    return [f"marketSignals: {len(updated)} sub-section note(s) refreshed"] if updated else []


# ---------------------------------------------------------------------------
# predictionMarkets — wire Polymarket contracts into signalCards
# ---------------------------------------------------------------------------

# Each slot has a list of keyword sets; a contract question must match ALL
# keywords in at least ONE set to claim the slot. Order matters — first slot
# to match wins, and a contract can only fill one slot.
PREDICTION_MARKET_SLOTS = [
    # (slot_index, contract_label_template, [[kw, kw, ...], ...])
    (0, "US-Iran ceasefire by Dec 31",   [["ceasefire", "iran"], ["us-iran", "ceasefire"]]),
    (1, "Conflict ends by Dec 31",       [["conflict", "end"], ["war", "end"]]),
    (2, "Trump ends ops by Jun 30",      [["trump", "end"], ["trump", "ops"]]),
    (3, "Iran regime falls by Jun 30",   [["regime", "fall"], ["regime", "change"]]),
    (4, "Kharg Island struck",           [["kharg"]]),
    (5, "Leadership change",              [["khamenei"], ["leadership", "iran"]]),
]


def _liq_bucket(volume_usd: float) -> tuple:
    """Return (liqWidth, liqColor, liqLabel, sigQuality, sigClass) by volume."""
    if volume_usd >= 10_000_000:
        return ("100%", "#22c55e", "VERY HIGH", "★★★ RELIABLE", "sig-high")
    if volume_usd >= 3_000_000:
        return ("85%",  "#22c55e", "HIGH",       "★★★ RELIABLE", "sig-high")
    if volume_usd >= 1_000_000:
        return ("50%",  "#f59e0b", "MEDIUM",     "★★ MODERATE",  "sig-med")
    if volume_usd >= 250_000:
        return ("30%",  "#f59e0b", "LOW-MED",    "★ THIN",        "sig-low")
    return ("15%", "#ef4444", "LOW", "★ THIN", "sig-low")


def _fmt_volume(v: float) -> str:
    if v >= 1_000_000:
        return f"${v/1_000_000:.1f}M"
    if v >= 1_000:
        return f"${v/1_000:.0f}K"
    return f"${v:.0f}"


def _prob_color(prob: float) -> str:
    if prob >= 70:
        return "#22c55e"
    if prob >= 30:
        return "#f59e0b"
    return "#94a3b8"


def _match_contract_to_slot(question: str) -> int:
    q = (question or "").lower()
    for slot_idx, _label, keyword_sets in PREDICTION_MARKET_SLOTS:
        for kwset in keyword_sets:
            if all(kw in q for kw in kwset):
                return slot_idx
    return -1


def update_prediction_markets(data: dict, raw_polymarket: dict, day: int) -> list[str]:
    """Update predictionMarkets.signalCards from Polymarket contracts.

    Matches contracts to slot definitions by keyword, then updates rawPrice,
    volume, adjProb, adjDelta (with day-over-day delta), volDelta, and liquidity
    bucket fields. If a slot has no matching contract today, its values are
    preserved from yesterday (no overwrite). The 7 sub-arrays (ceasefire, oil,
    hormuz, regime, escalation, nuclear, comparison) are NOT yet populated by
    this function — TODO follow-up.
    """
    if "predictionMarkets" not in data:
        return []
    if not raw_polymarket or not raw_polymarket.get("_collected"):
        return []
    contracts = raw_polymarket.get("contracts") or []
    if not contracts:
        return []

    pm = data["predictionMarkets"]
    cards = pm.get("signalCards") or []
    if not cards:
        return []

    # Snapshot previous probabilities for delta computation
    prev_probs = []
    for c in cards:
        try:
            prev_probs.append(float(str(c.get("adjProb", "0")).rstrip("%")))
        except (ValueError, TypeError):
            prev_probs.append(None)

    # Pick the highest-volume contract per slot
    best_per_slot = {}  # slot_idx -> contract
    for con in contracts:
        slot_idx = _match_contract_to_slot(con.get("question", ""))
        if slot_idx < 0:
            continue
        prob = con.get("probability")
        if prob is None:
            continue
        vol = float(con.get("volume") or 0)
        cur = best_per_slot.get(slot_idx)
        if cur is None or vol > float(cur.get("volume") or 0):
            best_per_slot[slot_idx] = con

    matched = 0
    for slot_idx, label, _kw in PREDICTION_MARKET_SLOTS:
        if slot_idx >= len(cards):
            continue
        con = best_per_slot.get(slot_idx)
        if con is None:
            continue  # preserve yesterday's card
        prob = float(con.get("probability"))
        vol = float(con.get("volume") or 0)
        liq_width, liq_color, liq_label, sig_q, sig_c = _liq_bucket(vol)
        prev = prev_probs[slot_idx]
        if prev is None or abs(prob - prev) < 0.5:
            arrow, delta_txt = "→", f"{prob:.0f}% steady"
        elif prob > prev:
            arrow, delta_txt = "▲", f"+{prob - prev:.0f}pp from {prev:.0f}% D{day-1}"
        else:
            arrow, delta_txt = "▼", f"{prob - prev:.0f}pp from {prev:.0f}% D{day-1}"
        cards[slot_idx] = {
            "contract": label,
            "rawPrice": f"{prob:.0f}%",
            "volume": _fmt_volume(vol),
            "liqWidth": liq_width,
            "liqColor": liq_color,
            "liqLabel": liq_label,
            "adjProb": f"{prob:.0f}%",
            "adjProbColor": _prob_color(prob),
            "adjDelta": f"{arrow} {delta_txt} (D{day})",
            "volDelta": "→ flat",
            "volDeltaColor": "#94a3b8",
            "sigQuality": sig_q,
            "sigClass": sig_c,
        }
        matched += 1

    pm["signalCards"] = cards
    return [f"predictionMarkets.signalCards: {matched}/{len(PREDICTION_MARKET_SLOTS)} slots updated from {len(contracts)} Polymarket contracts"]


def update_next48h(data: dict, raw_intel: dict, raw_rhetoric: dict,
                   day: int) -> list[str]:
    """Update next48h catalysts from intelligence."""
    intel = raw_intel or {}
    rhetoric = raw_rhetoric or {}
    if not intel and not rhetoric:
        return []
    if "next48h" not in data:
        return []

    n48 = data["next48h"]
    cf = str(intel.get("ceasefire_status", ""))
    hz = str(intel.get("hormuz_status", ""))
    key_devs = intel.get("key_developments", [])
    diplo = rhetoric.get("diplomatic_developments", [])

    # Badge
    if any(w in cf.lower() for w in ("collapse", "broken")):
        n48["badge"] = "TALKS COLLAPSED — ESCALATION WATCH"
    elif "blockade" in hz.lower():
        n48["badge"] = "NAVAL BLOCKADE — HORMUZ FLASHPOINT"
    elif any(w in cf.lower() for w in ("negot", "talks")):
        n48["badge"] = "NEGOTIATIONS — OUTCOME PENDING"
    elif "ceasefire" in cf.lower():
        n48["badge"] = f"CEASEFIRE DAY {max(day - 40, 0)}"
    else:
        n48["badge"] = f"DAY {day} — MONITORING"

    catalysts = []
    rank = 1

    # Top catalyst from key developments
    if isinstance(key_devs, list):
        for dev in key_devs[:2]:
            dev_s = str(dev)
            color = "red" if any(w in dev_s.lower() for w in ("collapse", "attack", "blockade")) else "yellow"
            title = dev_s.split(".")[0][:80] if "." in dev_s else dev_s[:80]
            catalysts.append({
                "rank": str(rank), "title": title,
                "outcomeLabel": "ESCALATION vs DE-ESCALATION",
                "body": dev_s, "color": color
            })
            rank += 1

    # Ceasefire/Hormuz catalyst
    if cf:
        color = "red" if any(w in cf.lower() for w in ("collapse", "broken")) else "yellow"
        catalysts.append({
            "rank": str(rank), "title": "Ceasefire Compliance",
            "outcomeLabel": "HOLD vs COLLAPSE",
            "body": cf, "color": color
        })
        rank += 1

    if hz:
        color = "red" if "blockade" in hz.lower() else "green"
        catalysts.append({
            "rank": str(rank), "title": "Hormuz Passage",
            "outcomeLabel": "OPEN vs BLOCKADE",
            "body": f"Current status: {hz}. Transits: {intel.get('hormuz_daily_vessel_transits', 'N/A')}/day.",
            "color": color
        })
        rank += 1

    # Diplomatic
    if isinstance(diplo, list) and diplo:
        catalysts.append({
            "rank": str(rank), "title": "Diplomatic Track",
            "outcomeLabel": "RESUME vs STALL",
            "body": ". ".join(str(d) for d in diplo[:2]),
            "color": "yellow"
        })

    if catalysts:
        n48["catalysts"] = catalysts[:5]
        return [f"next48h: badge + {len(catalysts[:5])} catalysts"]
    return []


def update_iran_attacks(data: dict, raw_intel: dict, day: int) -> list[str]:
    """Extend iranAttacksUAE.daily to current day and update asOf fields.
    During ceasefire, appends zero-attack entries. Updates cumulative.day."""
    from datetime import date, timedelta
    intel = raw_intel or {}
    DAY1 = date(2026, 2, 28)
    today = DAY1 + timedelta(days=day - 1)
    today_str = today.isoformat()
    updates = []

    # iranAttacksUAE — extend daily array
    if "iranAttacksUAE" in data:
        uae = data["iranAttacksUAE"]
        daily = uae.get("daily", [])
        if isinstance(daily, list):
            last_day = max((d.get("day", 0) for d in daily), default=0)
            for d in range(last_day + 1, day + 1):
                d_date = (DAY1 + timedelta(days=d - 1)).isoformat()
                daily.append({
                    "date": d_date, "day": d,
                    "ballistic": 0, "cruise": 0, "drones": 0,
                    "note": f"Ceasefire Day {d - 40} — zero attacks."
                })
            if last_day < day:
                updates.append(f"iranAttacksUAE.daily extended D{last_day+1}..D{day}")
        # Update cumulative metadata
        if "cumulative" in uae:
            uae["cumulative"]["asOf"] = today_str
            uae["cumulative"]["day"] = day
            uae["cumulative"]["note"] = f"All attack figures frozen since ceasefire. Day {day}."
            updates.append(f"iranAttacksUAE.cumulative -> day {day}")

    # iranAttacksNeighbors — update asOf/day
    if "iranAttacksNeighbors" in data:
        data["iranAttacksNeighbors"]["asOf"] = today_str
        data["iranAttacksNeighbors"]["day"] = day
        updates.append(f"iranAttacksNeighbors -> day {day}")

    return updates


def verify_sections(data: dict, day: int) -> list[str]:
    """Post-merge verification: check every section has current-day data.
    Returns list of warnings for sections that appear stale or malformed."""
    warnings = []

    # Sections that should reference current day
    day_checks = {
        "meta.day": safe_get(data, "meta", "day"),
        "ceasefireAnalytics.meta.day": safe_get(data, "ceasefireAnalytics", "meta", "day"),
        "iranAttacksUAE.cumulative.day": safe_get(data, "iranAttacksUAE", "cumulative", "day"),
        "iranAttacksNeighbors.day": safe_get(data, "iranAttacksNeighbors", "day"),
    }
    for path, val in day_checks.items():
        if val is not None and val != day:
            warnings.append(f"STALE {path}={val}, expected {day}")

    # Chart array alignment
    cd = data.get("chartData", {})
    array_groups = [
        ("main charts", ["labels", "brent", "vix", "hyg", "sp500", "taco"]),
        ("strikes", ["strikeLabels"]),
        ("hormuz", ["hormuzLabels", "hormuzTransits"]),
    ]
    for group_name, keys in array_groups:
        lengths = {}
        for k in keys:
            v = cd.get(k)
            if isinstance(v, list):
                lengths[k] = len(v)
        unique_lens = set(lengths.values())
        if len(unique_lens) > 1:
            warnings.append(f"MISALIGNED {group_name}: {lengths}")

    # Strike arrays must match strikeLabels
    strikes = cd.get("strikes", {})
    sl_len = len(cd.get("strikeLabels", []))
    for sk in ["us", "iran"]:
        sv = strikes.get(sk, [])
        if isinstance(sv, list) and len(sv) != sl_len:
            warnings.append(f"MISALIGNED strikes.{sk}={len(sv)} vs strikeLabels={sl_len}")

    # Intelligence sections must have items arrays (not body)
    intel = data.get("intelligence", {})
    for col in ["diplomatic", "military", "energy"]:
        sections = safe_get(intel, col, "sections")
        if isinstance(sections, list):
            for i, sec in enumerate(sections):
                if "body" in sec and "items" not in sec:
                    warnings.append(f"SCHEMA intelligence.{col}.sections[{i}]: has 'body' not 'items'")

    # Key sections should not be empty
    required = ["gistBanner", "newsNow", "keyTriggers", "operations",
                 "intelligence", "next48h", "ceasefireAnalytics", "analyticalSignals"]
    for key in required:
        val = data.get(key)
        if val is None:
            warnings.append(f"MISSING section: {key}")
        elif isinstance(val, list) and len(val) == 0:
            warnings.append(f"EMPTY section: {key}")
        elif isinstance(val, dict) and not val:
            warnings.append(f"EMPTY section: {key}")

    return warnings


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

    # Hard-reject stale Sonar filler — preserves prior day's value via skip-on-null
    for sonar_key in ("_raw_intelligence", "_raw_rhetoric", "_raw_bca",
                      "_raw_dubai", "_raw_fed", "_raw_analytical"):
        if sonar_key not in raw or raw.get(sonar_key) is None:
            continue
        cleaned, warnings = reject_stale_strings(raw[sonar_key])
        if warnings:
            print(f"  [STALE-FILTER] {sonar_key}: dropped {len(warnings)} field(s) "
                  f"matching stale-pattern blocklist: {warnings[:5]}{'...' if len(warnings) > 5 else ''}")
        raw[sonar_key] = cleaned

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
    if raw.get("kpis"):
        data["kpis"] = enhance_kpi_notes(raw["kpis"], raw)
        all_updates.append(f"kpis updated ({len(raw['kpis'])} tickers)")
        print(f"  [OK] kpis: {', '.join(raw['kpis'].keys())}")
    else:
        print("  [SKIP] kpis: no raw KPI data (weekend or FMP skipped); carrying existing values forward")

    # ------------------------------------------------------------------
    # 3. marketStrip — replace
    # ------------------------------------------------------------------
    if raw.get("marketStrip"):
        data["marketStrip"] = raw["marketStrip"]
        all_updates.append(f"marketStrip updated ({len(raw['marketStrip'])} items)")
        print(f"  [OK] marketStrip: {len(raw['marketStrip'])} items")
    else:
        print("  [SKIP] marketStrip: no raw data (weekend or FMP skipped); carrying existing values forward")

    # ------------------------------------------------------------------
    # 4. chartAppend — merge (keep taco/strikes/hormuz from existing)
    # ------------------------------------------------------------------
    if "chartAppend" in raw:
        existing_chart = data.get("chartAppend", {})
        data["chartAppend"] = merge_chart_append(existing_chart, raw["chartAppend"])
        all_updates.append("chartAppend merged (prices from raw, taco/strikes/hormuz preserved)")
        print("  [OK] chartAppend merged")

    # ------------------------------------------------------------------
    # 4b. predictionMarkets — wire Polymarket contracts into signalCards
    # ------------------------------------------------------------------
    raw_poly = raw.get("_raw_polymarket")
    pm_updates = update_prediction_markets(data, raw_poly, args.day)
    all_updates.extend(pm_updates)
    for u in pm_updates:
        print(f"  [OK] {u}")
    if not pm_updates and raw_poly:
        contracts_n = len((raw_poly or {}).get("contracts") or [])
        print(f"  [SKIP] predictionMarkets — Polymarket returned {contracts_n} contracts but none matched slot keywords")

    # ------------------------------------------------------------------
    # 4c. Analytical bundle — dLive, analyticalOutlook
    # ------------------------------------------------------------------
    raw_analytical = raw.get("_raw_analytical")
    if isinstance(raw_analytical, dict) and not raw_analytical.get("_error"):
        for fn in (
            update_d_live,
            update_analytical_outlook,
            update_houthi_red_sea,
            update_pipeline_bypass,
            update_arsenal_badge,
            update_market_signals,
            update_taco_inputs,
        ):
            updates = fn(data, raw_analytical)
            all_updates.extend(updates)
            for u in updates:
                print(f"  [OK] {u}")
    else:
        if isinstance(raw_analytical, dict) and raw_analytical.get("_error"):
            print(f"  [SKIP] analytical bundle — {raw_analytical.get('_error')}")
        elif isinstance(raw_analytical, list):
            print(f"  [SKIP] analytical bundle — Sonar returned a list at root ({len(raw_analytical)} items); expected dict. Sonar response shape mismatch.")
        else:
            print(f"  [SKIP] analytical bundle — not collected (likely historical mode)")

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
        # Also refresh fedRate KPIs and badge from _raw_fed (cleaned earlier)
        fed_clean = raw.get("_raw_fed")
        infl_updates.extend(update_inflation_fed_rate(data["inflation"], fed_clean))
        all_updates.extend(infl_updates)
        for u in infl_updates:
            print(f"  [OK] {u}")
        if not infl_updates:
            print("  [SKIP] inflation.derivation — no raw data")

    # ------------------------------------------------------------------
    # 8. Analytical: TACO score + meta.day
    # ------------------------------------------------------------------
    raw_intel = clean_sonar_strings(raw.get("_raw_intelligence"))
    raw_rhetoric = clean_sonar_strings(raw.get("_raw_rhetoric"))
    raw_bca = clean_sonar_strings(raw.get("_raw_bca"))
    raw_fed = clean_sonar_strings(raw.get("_raw_fed"))

    taco = derive_taco_score(raw_intel, raw_rhetoric, raw_bca)
    meta_updates = update_meta_day(data, args.day, taco)
    all_updates.extend(meta_updates)
    for u in meta_updates:
        print(f"  [OK] {u}")

    # ------------------------------------------------------------------
    # 9. Analytical signals
    # ------------------------------------------------------------------
    sig_updates = update_analytical_signals(data, raw_intel, raw_rhetoric, args.day)
    all_updates.extend(sig_updates)
    for u in sig_updates:
        print(f"  [OK] {u}")
    if not sig_updates:
        print("  [SKIP] analyticalSignals — no intel data")

    # ------------------------------------------------------------------
    # 10. Rhetoric tracker
    # ------------------------------------------------------------------
    rhet_updates = update_rhetoric_tracker(data, raw_rhetoric, args.day)
    all_updates.extend(rhet_updates)
    for u in rhet_updates:
        print(f"  [OK] {u}")
    if not rhet_updates:
        print("  [SKIP] rhetoricTracker — no rhetoric data")

    # ------------------------------------------------------------------
    # 11. Gist banner
    # ------------------------------------------------------------------
    gist_updates = update_gist_banner(data, raw_intel, raw_rhetoric,
                                       raw_fed, raw.get("kpis", {}))
    all_updates.extend(gist_updates)
    for u in gist_updates:
        print(f"  [OK] {u}")
    if not gist_updates:
        print("  [SKIP] gistBanner — no key developments")

    # ------------------------------------------------------------------
    # 12. News cards
    # ------------------------------------------------------------------
    news_updates = update_news_now(data, raw_intel, raw_rhetoric)
    all_updates.extend(news_updates)
    for u in news_updates:
        print(f"  [OK] {u}")
    if not news_updates:
        print("  [SKIP] newsNow — no developments")

    # ------------------------------------------------------------------
    # 13. Operations
    # ------------------------------------------------------------------
    ops_updates = update_operations(data, raw_intel, args.day)
    all_updates.extend(ops_updates)
    for u in ops_updates:
        print(f"  [OK] {u}")
    if not ops_updates:
        print("  [SKIP] operations — no intel data")

    # ------------------------------------------------------------------
    # 14. Ceasefire Analytics
    # ------------------------------------------------------------------
    cf_updates = update_ceasefire_analytics(data, raw_intel, raw_rhetoric, args.day, taco)
    all_updates.extend(cf_updates)
    for u in cf_updates:
        print(f"  [OK] {u}")
    if not cf_updates:
        print("  [SKIP] ceasefireAnalytics — no intel data")

    # ------------------------------------------------------------------
    # 15. Intelligence columns
    # ------------------------------------------------------------------
    intel_updates = update_intelligence(data, raw_intel, raw_rhetoric, raw_bca, args.day)
    all_updates.extend(intel_updates)
    for u in intel_updates:
        print(f"  [OK] {u}")
    if not intel_updates:
        print("  [SKIP] intelligence — no intel data")

    # ------------------------------------------------------------------
    # 16. Key Triggers
    # ------------------------------------------------------------------
    trig_updates = update_key_triggers(data, raw_intel, raw_rhetoric, args.day)
    all_updates.extend(trig_updates)
    for u in trig_updates:
        print(f"  [OK] {u}")
    if not trig_updates:
        print("  [SKIP] keyTriggers — no intel data")

    # ------------------------------------------------------------------
    # 17. Next 48h Catalysts
    # ------------------------------------------------------------------
    n48_updates = update_next48h(data, raw_intel, raw_rhetoric, args.day)
    all_updates.extend(n48_updates)
    for u in n48_updates:
        print(f"  [OK] {u}")
    if not n48_updates:
        print("  [SKIP] next48h — no intel data")

    # ------------------------------------------------------------------
    # 18. Chart analytics (TACO, strikes, Hormuz)
    # ------------------------------------------------------------------
    if "chartAppend" in data:
        chart_updates = inject_chart_analytics(
            data["chartAppend"], raw_intel, taco, args.day)
        all_updates.extend(chart_updates)
        for u in chart_updates:
            print(f"  [OK] {u}")

    # ------------------------------------------------------------------
    # 19. Iran attack data (extend daily arrays during ceasefire)
    # ------------------------------------------------------------------
    atk_updates = update_iran_attacks(data, raw_intel, args.day)
    all_updates.extend(atk_updates)
    for u in atk_updates:
        print(f"  [OK] {u}")

    # ------------------------------------------------------------------
    # POST-MERGE VERIFICATION
    # ------------------------------------------------------------------
    print()
    print("  ── POST-MERGE VERIFICATION ──")
    verify_warnings = verify_sections(data, args.day)
    if verify_warnings:
        for w in verify_warnings:
            print(f"  ⚠ {w}")
        print(f"  ⚠ {len(verify_warnings)} verification warning(s)")
    else:
        print("  ✓ All sections verified — day {}, arrays aligned, schemas OK".format(args.day))

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
    print("=" * 60)


if __name__ == "__main__":
    main()
