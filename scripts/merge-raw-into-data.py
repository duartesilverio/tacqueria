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

    if bullets:
        data["gistBanner"]["bullets"] = bullets[:5]
        return [f"gistBanner: {len(bullets[:5])} bullets"]
    return []


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
    print("  Sections LEFT UNCHANGED: predictionMarkets, tacoSubScoresOverview,")
    print("    pipelineBypass, intelligence (deep columns), arsenal.")
    print("=" * 60)


if __name__ == "__main__":
    main()
