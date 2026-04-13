#!/usr/bin/env python3
"""
Tacqueria Dashboard — Automated Data Collection Script
======================================================
Replaces expensive LLM sub-agent calls with direct API calls:
  - FMP API for financial market data
  - Hyperliquid REST API for BRENTOIL 24/7 futures
  - Polymarket Gamma API for prediction market contracts
  - Perplexity Sonar API for intelligence, rhetoric, CPI/Fed, BCA, Dubai Watch

Usage:
  python scripts/collect-data.py --day 43
  python scripts/collect-data.py --day 43 --weekend   # skip FMP, carry Friday prices

Output:
  scripts/day-{N}-raw.json
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent

def load_env():
    """Load .env file from project root."""
    env_path = PROJECT_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

load_env()

FMP_API_KEY = os.environ.get("FMP_API_KEY", "B4w60DIzcKRgXjRT1TARzoGA0O6Fn5n0")
FMP_BASE = "https://financialmodelingprep.com/api/v3"
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
PERPLEXITY_BASE = "https://api.perplexity.ai/chat/completions"
HL_API = "https://api.hyperliquid.xyz/info"
POLYMARKET_API = "https://gamma-api.polymarket.com/markets"

WAR_START = datetime(2026, 2, 28)
PRE_WAR_BRENT = 73.20  # baseline for inflation model

# FMP ticker mapping: dashboard name -> FMP ticker
FMP_TICKERS = {
    "brent": "BZUSD",
    "wti": "CLUSD",
    "gold": "GCUSD",
    "vix": "^VIX",
    "sp500": "^GSPC",
    "tnx": "^TNX",
    "hyg": "HYG",
    "ita": "ITA",
    # Defense stocks (for reference/marketStrip)
    "lmt": "LMT",
    "rtx": "RTX",
    "noc": "NOC",
    "gd": "GD",
    # ETF sparklines
    "xle": "XLE",
    "xop": "XOP",
    "gld": "GLD",
    "tlt": "TLT",
}

# Dubai Watch pre-war baselines
DUBAI_BASELINES = {
    "dubizzle": 26642,
    "dubicars": 27073,
    "yallamotor": 37583,
}


# ═══════════════════════════════════════════════════════════════════════════════
# HTTP HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def http_get(url, headers=None, retries=2, timeout=30):
    """GET request with retries. Returns parsed JSON or None."""
    hdrs = {"User-Agent": "Tacqueria/1.0"}
    if headers:
        hdrs.update(headers)
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=hdrs)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode())
                return data
        except Exception as e:
            if attempt < retries:
                time.sleep(1 * (attempt + 1))
            else:
                print(f"  [HTTP GET] Failed after {retries + 1} attempts: {url[:80]}... — {e}")
                return None
    return None


def http_post(url, payload, headers=None, retries=2, timeout=60):
    """POST request with retries. Returns parsed JSON or None."""
    hdrs = {"User-Agent": "Tacqueria/1.0", "Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    body = json.dumps(payload).encode()
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, data=body, headers=hdrs, method="POST")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode())
                return data
        except Exception as e:
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
            else:
                print(f"  [HTTP POST] Failed after {retries + 1} attempts: {url[:80]}... — {e}")
                return None
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# FMP FINANCE
# ═══════════��═══════════════════════════════════════════════════════════════════

def fetch_fmp_quotes(tickers_map):
    """Fetch real-time quotes from FMP for all tickers.
    Returns dict: {dashboard_name: {price, change, changePct, prevClose, ...}}
    """
    print("[FMP] Fetching market quotes...")
    results = {}

    # FMP /quote/ supports comma-separated tickers
    fmp_tickers = list(tickers_map.values())
    ticker_str = ",".join(urllib.parse.quote(t) for t in fmp_tickers)
    url = f"{FMP_BASE}/quote/{ticker_str}?apikey={FMP_API_KEY}"
    data = http_get(url)

    if not data or not isinstance(data, list):
        print("  [FMP] No data returned")
        return {"_error": "FMP API returned no data", "_collected": False}

    # Build lookup: FMP symbol -> quote data
    fmp_lookup = {}
    for item in data:
        sym = item.get("symbol", "")
        fmp_lookup[sym] = item

    # Map back to dashboard names
    for dash_name, fmp_ticker in tickers_map.items():
        quote = fmp_lookup.get(fmp_ticker)
        if not quote:
            print(f"  [FMP] Missing: {dash_name} ({fmp_ticker})")
            results[dash_name] = None
            continue

        price = quote.get("price", 0)
        change = quote.get("change", 0)
        change_pct = quote.get("changesPercentage", 0)
        prev_close = quote.get("previousClose", 0)

        # Determine CSS class
        if abs(change_pct) < 0.3:
            css_class = "kpi-flat"
        elif change_pct > 0:
            css_class = "kpi-up"
        else:
            css_class = "kpi-down"

        # Direction arrow
        arrow = "▲" if change > 0 else "▼" if change < 0 else "–"

        results[dash_name] = {
            "price": round(price, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "prevClose": round(prev_close, 2),
            "cssClass": css_class,
            "arrow": arrow,
            "marketStatus": quote.get("marketStatus", ""),
            "timestamp": quote.get("timestamp", ""),
        }

    results["_collected"] = True
    print(f"  [FMP] Got {sum(1 for v in results.values() if isinstance(v, dict) and 'price' in v)} quotes")
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# HYPERLIQUID BRENTOIL
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_hyperliquid_brentoil():
    """Fetch BRENTOIL mark price, OI, volume from Hyperliquid."""
    print("[HL] Fetching BRENTOIL data...")
    payload = {"type": "metaAndAssetCtxs"}
    data = http_post(HL_API, payload)

    if not data or not isinstance(data, list) or len(data) < 2:
        print("  [HL] No data returned")
        return {"_error": "Hyperliquid API failed", "_collected": False}

    meta = data[0]
    ctxs = data[1]

    # Find BRENTOIL in the universe
    for i, asset in enumerate(meta.get("universe", [])):
        if asset.get("name") == "BRENTOIL":
            ctx = ctxs[i]
            mark_px = float(ctx["markPx"])
            prev_day_px = float(ctx.get("prevDayPx", 0))
            oi = float(ctx.get("openInterest", 0))
            volume = float(ctx.get("dayNtlVlm", 0))
            funding = float(ctx.get("funding", 0))

            change_24h = mark_px - prev_day_px if prev_day_px else 0
            change_pct = (change_24h / prev_day_px * 100) if prev_day_px else 0

            result = {
                "price": round(mark_px, 2),
                "prevDayPx": round(prev_day_px, 2),
                "change24h": round(change_24h, 2),
                "changePct": round(change_pct, 2),
                "openInterest": round(oi, 2),
                "openInterestUsd": f"${round(oi * mark_px / 1e6, 1)}M",
                "volume24h": round(volume, 2),
                "volumeUsd": f"${round(volume / 1e6, 1)}M",
                "funding": round(funding, 6),
                "_collected": True,
            }
            print(f"  [HL] BRENTOIL: ${mark_px:.2f} (OI: {result['openInterestUsd']}, Vol: {result['volumeUsd']})")
            return result

    # BRENTOIL perp may not exist yet — list available oil-related coins for debugging
    all_names = [a.get("name", "") for a in meta.get("universe", [])]
    oil_related = [n for n in all_names if any(k in n.upper() for k in ("OIL", "BRENT", "CRUDE", "WTI"))]
    print(f"  [HL] BRENTOIL not found. Oil-related coins: {oil_related or 'none'}")
    return {"_error": "BRENTOIL not listed on Hyperliquid", "_collected": False}


# ═══════════════════════════════════════════════════════════════════════════════
# POLYMARKET
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_polymarket_iran():
    """Fetch Iran-related prediction market contracts from Polymarket Gamma API."""
    print("[POLY] Fetching Iran markets...")
    results = []

    # Try multiple search terms to catch all Iran-related markets
    search_terms = ["iran", "middle east war", "brent oil", "ceasefire"]
    seen_ids = set()

    for term in search_terms:
        url = f"{POLYMARKET_API}?tag={urllib.parse.quote(term)}&limit=50&active=true"
        data = http_get(url)
        if data and isinstance(data, list):
            for market in data:
                mid = market.get("id", "")
                if mid in seen_ids:
                    continue
                seen_ids.add(mid)

                question = market.get("question", "")
                # Filter for Iran/war relevance
                q_lower = question.lower()
                if not any(kw in q_lower for kw in ["iran", "hormuz", "brent", "oil", "ceasefire",
                                                     "middle east", "trump", "war", "strike",
                                                     "nuclear", "sanctions"]):
                    continue

                outcomes = market.get("outcomes", [])
                prices = market.get("outcomePrices", [])
                volume = market.get("volume", 0)
                liquidity = market.get("liquidity", 0)

                # Parse probability (first outcome price = "Yes" probability)
                prob = None
                if prices and len(prices) > 0:
                    try:
                        prob = round(float(prices[0]) * 100, 1)
                    except (ValueError, TypeError):
                        pass

                results.append({
                    "question": question,
                    "probability": prob,
                    "volume": round(float(volume), 2) if volume else 0,
                    "liquidity": round(float(liquidity), 2) if liquidity else 0,
                    "outcomes": outcomes,
                })

    print(f"  [POLY] Found {len(results)} Iran-related contracts")
    return {
        "contracts": results,
        "_collected": len(results) > 0,
        "_error": "No contracts found" if len(results) == 0 else None,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PERPLEXITY SONAR
# ═══════════════════════════════════════════════════════════════════════════════

def sonar_query(model, system_prompt, user_prompt, retries=1):
    """Call Perplexity Sonar API. Returns parsed response text."""
    if not PERPLEXITY_API_KEY:
        return {"_error": "PERPLEXITY_API_KEY not set", "_collected": False}

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 4000,
    }
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    }

    for attempt in range(retries + 1):
        data = http_post(PERPLEXITY_BASE, payload, headers=headers, timeout=90)
        if data and "choices" in data:
            content = data["choices"][0]["message"]["content"]
            citations = data.get("citations", [])

            # Try to parse as JSON
            parsed = try_parse_json(content)
            if parsed is not None:
                if isinstance(parsed, dict):
                    parsed["_sources"] = citations
                return parsed
            else:
                # Return raw text with citations
                return {
                    "_text": content,
                    "_sources": citations,
                    "_collected": True,
                }

        if attempt < retries:
            print(f"  [SONAR] Retry {attempt + 1}...")
            time.sleep(3)

    return {"_error": f"Sonar {model} failed after {retries + 1} attempts", "_collected": False}


def try_parse_json(text):
    """Try to extract and parse JSON from text (may be wrapped in markdown)."""
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from ```json ... ``` block
    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding first { ... } or [ ... ]
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        if start >= 0:
            depth = 0
            for i in range(start, len(text)):
                if text[i] == start_char:
                    depth += 1
                elif text[i] == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start : i + 1])
                        except json.JSONDecodeError:
                            break

    return None


# ─────────────────────────────────────────────────────────────────────────────
# SONAR RESEARCH QUERIES
# ─────────────────────────────────────────────────────────────────────────────

def fetch_sonar_intelligence(day_num, day_date):
    """Intelligence sweep: conflict stats, strikes, Hormuz, casualties."""
    print("[SONAR] Intelligence sweep (sonar-pro)...")

    system = (
        "You are a conflict data extraction assistant. Return ONLY valid JSON "
        "matching the schema below. No markdown, no explanation. If a data point "
        "is unavailable, use null."
    )
    user = f"""Search for the latest data on the US-Iran military conflict as of {day_date}.
This is Day {day_num} of the conflict (started Feb 28, 2026, Operation Epic Fury).

Return JSON matching this schema:
{{
  "conflict_day": {day_num},
  "us_strikes_total_cumulative": <integer or null>,
  "iran_strikes_total_cumulative": <integer or null>,
  "us_military_kia": <integer or null>,
  "iran_military_kia": <integer or null>,
  "civilian_casualties_reported": <integer or null>,
  "hormuz_status": "<OPEN|PARTIALLY_CLOSED|CLOSED|CONTESTED>",
  "hormuz_daily_vessel_transits": <integer or null>,
  "vessels_attacked_or_sunk": <integer or null>,
  "oil_production_cuts_mmbd": <number or null>,
  "ceasefire_status": "<string — current state of any ceasefire talks>",
  "houthi_attacks_last_24h": <integer or null>,
  "key_developments": ["<string — most important 5-8 events>"],
  "iran_attacks_on_uae": {{
    "ballistic_missiles_cumulative": <int or null>,
    "cruise_missiles_cumulative": <int or null>,
    "drones_cumulative": <int or null>,
    "total_cumulative": <int or null>,
    "killed": <int or null>,
    "injured": <int or null>,
    "intercept_rate_pct": <number or null>
  }},
  "iran_attacks_on_neighbors": {{
    "countries_hit": ["<country names>"],
    "total_projectiles": <int or null>
  }},
  "us_force_posture": {{
    "troops_deployed": <int or null>,
    "carrier_groups": <int or null>,
    "targets_struck": <int or null>
  }}
}}"""

    return sonar_query("sonar-pro", system, user)


def fetch_sonar_cpi_fed(day_date):
    """CPI, Fed rate, FedWatch probabilities."""
    print("[SONAR] CPI/Fed data (sonar)...")

    system = (
        "You are an economic data extraction assistant. Return ONLY valid JSON. "
        "No markdown, no explanation."
    )
    user = f"""Search for the latest US inflation and Federal Reserve data as of {day_date}.

Return JSON:
{{
  "latest_cpi_headline_pct": <number — latest CPI year-over-year %>,
  "latest_cpi_date": "<month year of latest CPI reading>",
  "latest_core_cpi_pct": <number or null>,
  "fed_funds_rate_current": "<e.g. 5.25-5.50%>",
  "next_fomc_date": "<date>",
  "last_fomc_decision": "<e.g. held rates unchanged>",
  "cme_fedwatch": {{
    "no_change_pct": <number>,
    "one_cut_pct": <number>,
    "two_cuts_pct": <number>,
    "hike_pct": <number>
  }},
  "key_notes": "<any relevant inflation/Fed commentary related to Iran war oil price impact>"
}}"""

    return sonar_query("sonar", system, user)


def fetch_sonar_rhetoric(day_num, day_date):
    """Trump/Iran leadership statements and rhetoric."""
    print("[SONAR] Rhetoric monitoring (sonar)...")

    system = (
        "You are a geopolitical rhetoric analyst. Return ONLY valid JSON. "
        "No markdown."
    )
    user = f"""Search for the latest statements from US and Iranian leadership regarding the Iran conflict as of {day_date} (Day {day_num}).

Return JSON:
{{
  "trump_statements": [
    {{"date": "<date>", "source": "<Truth Social/press conf/etc>", "quote_or_summary": "<text>", "tone": "<hawkish/dovish/mixed>", "aggression_1_10": <int>}}
  ],
  "iran_leadership_statements": [
    {{"speaker": "<name/title>", "date": "<date>", "quote_or_summary": "<text>", "tone": "<defiant/conciliatory/mixed>"}}
  ],
  "israel_statements": [
    {{"speaker": "<name>", "date": "<date>", "quote_or_summary": "<text>", "tone": "<string>"}}
  ],
  "diplomatic_developments": ["<key diplomatic events>"],
  "overall_rhetoric_temperature": "<hot/warm/cooling/cold>"
}}"""

    return sonar_query("sonar", system, user)


def fetch_sonar_bca(day_date):
    """BCA Research conflict dashboard equivalent data."""
    print("[SONAR] BCA/operations data (sonar-pro)...")

    system = (
        "You are a military operations data analyst. Return ONLY valid JSON. "
        "No markdown."
    )
    user = f"""Search for the latest military operations data from the US-Iran conflict as of {day_date}. Look for data from BCA Research Iran Conflict Dashboard, JINSA, IDF, Pentagon briefings, and news sources.

Return JSON:
{{
  "iranian_attacks_on_uae_daily_latest": {{
    "date": "<date>",
    "ballistic_missiles": <int or null>,
    "cruise_missiles": <int or null>,
    "drones": <int or null>
  }},
  "gulf_neighbor_attacks": [
    {{"country": "<name>", "missiles": <int>, "drones": <int>, "total": <int>}}
  ],
  "hormuz_transits": {{
    "daily_vessels": <int or null>,
    "seven_day_avg": <int or null>,
    "status_note": "<string>"
  }},
  "oil_production_cuts": [
    {{"country": "<name>", "cut_mmbd": <number>, "note": "<string>"}}
  ],
  "total_me_production_cut_mmbd": <number or null>,
  "ceasefire_probability": {{
    "apr_30_pct": <number or null>,
    "jun_30_pct": <number or null>
  }},
  "leadership_change_probability_pct": <number or null>
}}"""

    return sonar_query("sonar-pro", system, user)


def fetch_sonar_dubai_watch(day_date):
    """Dubai used car listing counts (best-effort)."""
    print("[SONAR] Dubai Watch (sonar)...")

    system = (
        "You are a data extraction assistant. Return ONLY valid JSON. "
        "No markdown."
    )
    user = f"""Search for the current number of used car listings on these Dubai car marketplaces as of {day_date}:
1. dubai.dubizzle.com/motors/used-cars/ (total listings count)
2. dubicars.com (total used car listings)
3. yallamotor.com (total used car listings in UAE)

These counts are being tracked as a proxy for evacuation/capital flight from the Gulf during the Iran conflict.

Return JSON:
{{
  "dubizzle": <integer count or null>,
  "dubicars": <integer count or null>,
  "yallamotor": <integer count or null>,
  "data_freshness": "<how recent the numbers are>",
  "note": "<any relevant context about car market trends in Dubai>"
}}"""

    return sonar_query("sonar", system, user)


# ═══════════════════════════════════════════════════════════════════════════════
# DATA ASSEMBLY
# ═══════════════════════════════════════════════════════════════════════════════

def assemble_kpis(fmp_data, hl_data):
    """Build the kpis section from FMP + Hyperliquid data."""
    if not fmp_data.get("_collected"):
        return None

    def kpi(name, note_fn=None):
        q = fmp_data.get(name)
        if not q:
            return None
        note = note_fn(q) if note_fn else f"{q['arrow']} {q['changePct']:+.1f}%"
        return {
            "price": q["price"],
            "change": q["change"],
            "changePct": q["changePct"],
            "prevClose": q["prevClose"],
            "cssClass": q["cssClass"],
            "note": note,
        }

    brent = fmp_data.get("brent", {})
    wti = fmp_data.get("wti", {})
    hl_price = hl_data.get("price", 0) if hl_data.get("_collected") else 0

    # Brent-WTI spread
    brent_px = brent.get("price", 0) if brent else 0
    wti_px = wti.get("price", 0) if wti else 0
    spread = round(brent_px - wti_px, 2) if brent_px and wti_px else 0
    prev_brent = brent.get("prevClose", 0) if brent else 0
    prev_wti = wti.get("prevClose", 0) if wti else 0
    prev_spread = round(prev_brent - prev_wti, 2) if prev_brent and prev_wti else 0
    spread_change = round(spread - prev_spread, 2)
    spread_pct = round((spread_change / abs(prev_spread) * 100), 2) if abs(prev_spread) > 0.01 else 0

    kpis = {
        "brent": kpi("brent", lambda q: f"{q['arrow']} {q['changePct']:+.1f}% · HL ${hl_price:.2f}" if hl_price else f"{q['arrow']} {q['changePct']:+.1f}%"),
        "wti": kpi("wti"),
        "tnx": kpi("tnx", lambda q: f"{q['price']:.2f}% · {q['arrow']} {q['changePct']:+.1f}%"),
        "vix": kpi("vix"),
        "hyg": kpi("hyg"),
        "gold": kpi("gold"),
        "brentWtiSpread": {
            "price": spread,
            "change": spread_change,
            "changePct": spread_pct,
            "prevClose": prev_spread,
            "cssClass": "kpi-flat" if abs(spread_pct) < 0.3 else ("kpi-up" if spread_pct > 0 else "kpi-down"),
            "note": f"Spread ${spread:.2f} ({spread_change:+.2f})",
        },
        "ita": kpi("ita"),
    }

    return kpis


def assemble_market_strip(fmp_data):
    """Build the 6-item marketStrip from FMP data."""
    if not fmp_data.get("_collected"):
        return None

    items = []
    strip_map = [
        ("brent", "Brent"),
        ("sp500", "S&P 500"),
        ("vix", "VIX"),
        ("gold", "Gold"),
        ("tnx", "10Y"),
        ("hyg", "HYG"),
    ]
    for key, label in strip_map:
        q = fmp_data.get(key)
        if not q:
            continue
        color = "#22c55e" if q["change"] > 0 else "#ef4444" if q["change"] < 0 else "#94a3b8"
        items.append({
            "label": label,
            "value": f"${q['price']:,.2f}" if key not in ("vix", "tnx") else f"{q['price']:.2f}",
            "delta": f"{q['changePct']:+.1f}%",
            "color": color,
        })

    return items


def assemble_chart_append(fmp_data, hl_data, day_date_short):
    """Build the chartAppend object for time-series extension."""
    append = {"labels": day_date_short}

    if fmp_data.get("_collected"):
        for key in ("brent", "vix", "hyg", "sp500"):
            q = fmp_data.get(key)
            if q:
                append[key] = q["price"]

        # ETF sparklines
        for etf in ("ita", "xle", "xop", "gld", "tlt"):
            q = fmp_data.get(etf)
            if q:
                append[f"etf_{etf.upper()}"] = q["price"]

    # taco is NOT set here — LLM determines TACO score
    # strike counts, hormuz transits come from intelligence data

    return append


def assemble_hyperliquid(hl_data, brent_price):
    """Build the hyperliquid dashboard section."""
    if not hl_data.get("_collected"):
        return None

    hl_price = hl_data["price"]
    spread = round(hl_price - brent_price, 2) if brent_price else 0
    spread_pct = round((spread / brent_price * 100), 2) if brent_price else 0

    return {
        "price": hl_price,
        "tradBrent": brent_price,
        "spread": f"{'+'if spread >= 0 else ''}{spread:.2f} ({spread_pct:+.1f}%)",
        "volume": hl_data["volumeUsd"],
        "openInterest": hl_data["openInterestUsd"],
        "funding": hl_data["funding"],
        "badge": "24/7 MARKET",
    }


def assemble_inflation_derivation(brent_price):
    """Mechanical CPI passthrough calculation from current Brent price."""
    if not brent_price:
        return None

    oil_increase_pct = (brent_price - PRE_WAR_BRENT) / PRE_WAR_BRENT
    energy_cpi_impact = oil_increase_pct * 0.23  # Fed passthrough coefficient
    headline_direct = 0.07 * energy_cpi_impact  # BLS energy weight
    headline_total = headline_direct * 1.27 + 0.0015  # second-round + food
    estimated_cpi = 2.4 + (headline_total * 100)

    return {
        "currentBrent": brent_price,
        "preWarBaseline": PRE_WAR_BRENT,
        "oilIncreasePct": round(oil_increase_pct * 100, 1),
        "energyCpiImpact": round(energy_cpi_impact * 100, 2),
        "headlineDirect": round(headline_direct * 100, 2),
        "headlineTotal": round(headline_total * 100, 2),
        "estimatedCpi": round(estimated_cpi, 1),
        "steps": [
            {"label": "Oil Price Increase", "value": f"+{oil_increase_pct * 100:.1f}%", "detail": f"${brent_price:.2f} vs ${PRE_WAR_BRENT:.2f} baseline"},
            {"label": "Energy CPI Impact", "value": f"+{energy_cpi_impact * 100:.2f}%", "detail": "Fed passthrough coefficient: 0.23"},
            {"label": "Headline Direct", "value": f"+{headline_direct * 100:.2f}pp", "detail": "BLS energy weight: 7%"},
            {"label": "With Second-Round", "value": f"+{headline_total * 100:.2f}pp", "detail": "×1.27 multiplier + 0.15pp food"},
            {"label": "Estimated CPI", "value": f"{estimated_cpi:.1f}%", "detail": f"2.4% baseline + {headline_total * 100:.2f}pp war premium"},
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PREVIOUS DAY DATA
# ═══════════════════════════════════════════════════════════════════════════════

def load_previous_day(day_num):
    """Load the most recent day-N-data.json for carrying forward data on weekends."""
    for d in range(day_num - 1, 0, -1):
        path = SCRIPT_DIR / f"day-{d}-data.json"
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Tacqueria data collection")
    parser.add_argument("--day", type=int, required=True, help="War day number")
    parser.add_argument("--weekend", action="store_true",
                        help="Weekend mode: skip FMP, carry Friday prices")
    parser.add_argument("--no-auto-weekend", action="store_true",
                        help="Disable auto-weekend detection (force weekday mode)")
    args = parser.parse_args()

    day_num = args.day
    day_date_obj = WAR_START + timedelta(days=day_num - 1)
    day_date = day_date_obj.strftime("%d %b %Y")
    day_date_short = day_date_obj.strftime("%b %-d") if os.name != "nt" else day_date_obj.strftime("%b %#d")
    is_weekend = args.weekend or (not args.no_auto_weekend and day_date_obj.weekday() >= 5)

    print(f"{'='*60}")
    print(f"  TACQUERIA DATA COLLECTION — Day {day_num} ({day_date})")
    print(f"  Weekend mode: {'YES' if is_weekend else 'NO'}")
    print(f"{'='*60}\n")

    # Load previous day for weekend carry-forward
    prev_data = None
    if is_weekend:
        prev_data = load_previous_day(day_num)
        if prev_data:
            print(f"[PREV] Loaded previous day data for weekend carry-forward\n")

    # ── Parallel data collection ──────────────────────────────────────────
    results = {}
    futures = {}

    with ThreadPoolExecutor(max_workers=8) as pool:
        # Tier A: Direct APIs
        if not is_weekend:
            futures["fmp"] = pool.submit(fetch_fmp_quotes, FMP_TICKERS)
        futures["hl"] = pool.submit(fetch_hyperliquid_brentoil)
        futures["poly"] = pool.submit(fetch_polymarket_iran)

        # Tier B: Sonar research
        if PERPLEXITY_API_KEY:
            futures["intel"] = pool.submit(fetch_sonar_intelligence, day_num, day_date)
            futures["fed"] = pool.submit(fetch_sonar_cpi_fed, day_date)
            futures["rhetoric"] = pool.submit(fetch_sonar_rhetoric, day_num, day_date)
            futures["bca"] = pool.submit(fetch_sonar_bca, day_date)
            futures["dubai"] = pool.submit(fetch_sonar_dubai_watch, day_date)
        else:
            print("[WARN] No PERPLEXITY_API_KEY — skipping Sonar queries\n")

        # Collect results
        for name, future in futures.items():
            try:
                results[name] = future.result(timeout=120)
            except Exception as e:
                print(f"  [{name.upper()}] Error: {e}")
                results[name] = {"_error": str(e), "_collected": False}

    # ── Weekend carry-forward ─────────────────────────────────────────────
    if is_weekend and prev_data:
        # Carry Friday's FMP data from previous day's kpis
        results["fmp"] = {}
        prev_kpis = prev_data.get("kpis", {})
        for dash_name in FMP_TICKERS:
            prev_kpi = prev_kpis.get(dash_name)
            if prev_kpi:
                results["fmp"][dash_name] = {
                    "price": prev_kpi.get("price", 0),
                    "change": 0,
                    "changePct": 0,
                    "prevClose": prev_kpi.get("price", 0),
                    "cssClass": "kpi-flat",
                    "arrow": "–",
                    "marketStatus": "Weekend · Fri close",
                }
        # S&P 500 not in kpis — extract from previous chartData or marketStrip
        if "sp500" not in results["fmp"]:
            # Try chartData last value
            prev_chart = prev_data.get("chartData", {})
            sp_arr = prev_chart.get("sp500", [])
            if sp_arr:
                sp_val = sp_arr[-1] if isinstance(sp_arr, list) else 0
            else:
                # Try marketStrip
                sp_val = 0
                for item in prev_data.get("marketStrip", []):
                    if "S&P" in item.get("label", ""):
                        val_str = item.get("value", "0").replace("$", "").replace(",", "")
                        try:
                            sp_val = float(val_str)
                        except ValueError:
                            pass
            if sp_val:
                results["fmp"]["sp500"] = {
                    "price": sp_val, "change": 0, "changePct": 0,
                    "prevClose": sp_val, "cssClass": "kpi-flat",
                    "arrow": "–", "marketStatus": "Weekend · Fri close",
                }
        results["fmp"]["_collected"] = True

    # ── Assemble output ───────────────────────────────────────────────────
    fmp = results.get("fmp", {})
    hl = results.get("hl", {})
    brent_price = fmp.get("brent", {}).get("price", 0) if isinstance(fmp.get("brent"), dict) else 0

    output = {
        "_meta": {
            "script": "collect-data.py",
            "collected_at": datetime.now().astimezone().isoformat(),
            "day": day_num,
            "dayDate": day_date.upper(),
            "dayDateShort": day_date_short,
            "isWeekend": is_weekend,
        },

        # Complete mechanical sections
        "kpis": assemble_kpis(fmp, hl),
        "marketStrip": assemble_market_strip(fmp),
        "chartAppend": assemble_chart_append(fmp, hl, day_date_short),
        "hyperliquid": assemble_hyperliquid(hl, brent_price),
        "inflation_derivation": assemble_inflation_derivation(brent_price),

        # Raw research data for LLM synthesis
        "_raw_intelligence": results.get("intel"),
        "_raw_rhetoric": results.get("rhetoric"),
        "_raw_polymarket": results.get("poly"),
        "_raw_bca": results.get("bca"),
        "_raw_dubai": results.get("dubai"),
        "_raw_fed": results.get("fed"),

        # Raw FMP + HL for reference
        "_raw_fmp": {k: v for k, v in fmp.items() if k != "_collected"} if fmp.get("_collected") else None,
        "_raw_hl": hl if hl.get("_collected") else None,
    }

    # ── Write output ──────────────────────────────────────────────────────
    out_path = SCRIPT_DIR / f"day-{day_num}-raw.json"
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  OUTPUT: {out_path}")
    print(f"{'='*60}")
    print(f"\n  Collected:")

    section_status = {
        "FMP Quotes": fmp.get("_collected", False),
        "Hyperliquid": hl.get("_collected", False),
        "Polymarket": results.get("poly", {}).get("_collected", False),
        "Intelligence": bool(results.get("intel") and not results.get("intel", {}).get("_error")),
        "CPI/Fed": bool(results.get("fed") and not results.get("fed", {}).get("_error")),
        "Rhetoric": bool(results.get("rhetoric") and not results.get("rhetoric", {}).get("_error")),
        "BCA/Ops": bool(results.get("bca") and not results.get("bca", {}).get("_error")),
        "Dubai Watch": bool(results.get("dubai") and not results.get("dubai", {}).get("_error")),
    }

    for name, ok in section_status.items():
        status = "OK" if ok else "FAILED" if not is_weekend or name != "FMP Quotes" else "SKIPPED (weekend)"
        icon = "+" if ok else "!" if "SKIP" in status else "x"
        print(f"    [{icon}] {name}: {status}")

    print(f"\n  Next: LLM reads {out_path.name} -> writes day-{day_num}-data.json\n")


if __name__ == "__main__":
    main()
