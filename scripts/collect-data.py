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

def fetch_fmp_quotes(tickers_map, historical_date=None):
    """Fetch quotes from FMP for all tickers.

    If historical_date is provided, use /historical-price-full per ticker and
    return a synthesized "live-quote-shaped" record for that date. For weekend
    dates, carry forward the nearest prior trading day close.
    Returns dict: {dashboard_name: {price, change, changePct, prevClose, ...}}
    """
    if historical_date is not None:
        return _fetch_fmp_historical_quotes(tickers_map, historical_date)

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


def _fetch_fmp_historical_quotes(tickers_map, target_date):
    """Fetch FMP historical EOD for each ticker on target_date.
    Carries forward the nearest prior trading day if target_date has no bar
    (weekends, holidays).
    """
    print(f"[FMP] Fetching historical quotes for {target_date.strftime('%Y-%m-%d')}...")
    results = {}
    # Query a 7-day window ending on target_date so weekend dates pick up Friday.
    from_date = (target_date - timedelta(days=7)).strftime("%Y-%m-%d")
    to_date = target_date.strftime("%Y-%m-%d")

    for dash_name, fmp_ticker in tickers_map.items():
        url = (
            f"{FMP_BASE}/historical-price-full/{urllib.parse.quote(fmp_ticker)}"
            f"?from={from_date}&to={to_date}&apikey={FMP_API_KEY}"
        )
        data = http_get(url)
        bars = None
        if isinstance(data, dict):
            bars = data.get("historical")
        elif isinstance(data, list):  # some FMP responses shaped as list
            bars = data
        if not bars:
            print(f"  [FMP] Missing history: {dash_name} ({fmp_ticker})")
            results[dash_name] = None
            continue

        # FMP returns bars newest-first. Pick the most recent bar on or before target_date.
        target_iso = target_date.strftime("%Y-%m-%d")
        chosen = None
        prev = None
        for bar in bars:
            bar_date = bar.get("date", "")
            if bar_date <= target_iso and chosen is None:
                chosen = bar
            elif chosen is not None and prev is None:
                prev = bar
                break
        if chosen is None:
            print(f"  [FMP] No bar on/before {target_iso}: {dash_name}")
            results[dash_name] = None
            continue

        close = float(chosen.get("close", 0))
        prev_close = float(prev.get("close", close)) if prev else float(chosen.get("open", close))
        change = close - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0

        if abs(change_pct) < 0.3:
            css_class = "kpi-flat"
        elif change_pct > 0:
            css_class = "kpi-up"
        else:
            css_class = "kpi-down"
        arrow = "▲" if change > 0 else "▼" if change < 0 else "–"

        results[dash_name] = {
            "price": round(close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "prevClose": round(prev_close, 2),
            "cssClass": css_class,
            "arrow": arrow,
            "marketStatus": "historical",
            "timestamp": chosen.get("date", ""),
        }

    results["_collected"] = True
    results["_historical"] = True
    got = sum(1 for v in results.values() if isinstance(v, dict) and "price" in v)
    print(f"  [FMP] Got {got} historical quotes")
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# HYPERLIQUID BRENTOIL
# ═══════════════════════════════════════════════════════════════════════════════

HL_BRENTOIL_COIN = "xyz:BRENTOIL"  # HIP-3 builder-deployed perp on xyz DEX
HL_BRENTOIL_DEX = "xyz"


def fetch_hyperliquid_brentoil(historical_date=None):
    """Fetch BRENTOIL mark price, OI, volume from Hyperliquid xyz HIP-3 deployer.

    If historical_date (datetime) is provided, use candleSnapshot to fetch the
    1d candle for that UTC date. Otherwise use live metaAndAssetCtxs.
    """
    if historical_date is not None:
        return _fetch_hl_brentoil_historical(historical_date)

    print("[HL] Fetching BRENTOIL data (xyz HIP-3)...")
    payload = {"type": "metaAndAssetCtxs", "dex": HL_BRENTOIL_DEX}
    data = http_post(HL_API, payload)

    if not data or not isinstance(data, list) or len(data) < 2:
        print("  [HL] No data returned")
        return {"_error": "Hyperliquid API failed", "_collected": False}

    meta = data[0]
    ctxs = data[1]

    for i, asset in enumerate(meta.get("universe", [])):
        if asset.get("name") == HL_BRENTOIL_COIN:
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
            print(f"  [HL] {HL_BRENTOIL_COIN}: ${mark_px:.2f} (OI: {result['openInterestUsd']}, Vol: {result['volumeUsd']})")
            return result

    all_names = [a.get("name", "") for a in meta.get("universe", [])]
    print(f"  [HL] {HL_BRENTOIL_COIN} not found in xyz universe. Sample names: {all_names[:10]}")
    return {"_error": f"{HL_BRENTOIL_COIN} not found on xyz deployer", "_collected": False}


def _fetch_hl_brentoil_historical(target_date):
    """Fetch 1d candle for xyz:BRENTOIL on the given UTC date (datetime)."""
    print(f"[HL] Fetching historical {HL_BRENTOIL_COIN} for {target_date.strftime('%Y-%m-%d')}...")
    start_ms = int(datetime(target_date.year, target_date.month, target_date.day).timestamp() * 1000)
    end_ms = start_ms + 86400000 - 1
    payload = {
        "type": "candleSnapshot",
        "req": {"coin": HL_BRENTOIL_COIN, "interval": "1d", "startTime": start_ms, "endTime": end_ms},
    }
    data = http_post(HL_API, payload)
    if not data or not isinstance(data, list) or not data:
        print("  [HL] No historical candle returned")
        return {"_error": "Hyperliquid historical API failed", "_collected": False}

    # Pick the candle matching our start timestamp (snapshot may include adjacent candles).
    candle = next((c for c in data if c.get("t") == start_ms), data[0])
    close = float(candle["c"])
    open_ = float(candle["o"])
    change_24h = close - open_
    change_pct = (change_24h / open_ * 100) if open_ else 0
    volume = float(candle.get("v", 0))

    result = {
        "price": round(close, 2),
        "prevDayPx": round(open_, 2),
        "change24h": round(change_24h, 2),
        "changePct": round(change_pct, 2),
        "openInterest": 0,
        "openInterestUsd": "n/a (historical)",
        "volume24h": round(volume, 2),
        "volumeUsd": f"${round(volume * close / 1e6, 1)}M",
        "funding": 0,
        "_collected": True,
        "_historical": True,
    }
    print(f"  [HL] {HL_BRENTOIL_COIN} @ {target_date.strftime('%Y-%m-%d')}: close=${close:.2f} (open=${open_:.2f})")
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# POLYMARKET
# ═══════════════════════════════════════════════════════════════════════════════

POLYMARKET_CLOB_PRICES_HISTORY = "https://clob.polymarket.com/prices-history"


def fetch_polymarket_iran(historical_date=None):
    """Fetch Iran-related prediction market contracts from Polymarket Gamma API.

    If historical_date (datetime) is set, the probability for each market is
    replaced by the last CLOB price on that UTC date (via /prices-history).
    """
    mode = "historical" if historical_date else "live"
    print(f"[POLY] Fetching Iran markets ({mode})...")
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
                if historical_date is not None:
                    prob = _poly_historical_probability(market, historical_date)
                if prob is None and prices and len(prices) > 0:
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
        "_historical": historical_date is not None,
    }


def _poly_historical_probability(market, target_date):
    """Look up the Yes-outcome price at end of target_date UTC via CLOB."""
    clob_ids_raw = market.get("clobTokenIds")
    if not clob_ids_raw:
        return None
    try:
        token_ids = json.loads(clob_ids_raw) if isinstance(clob_ids_raw, str) else clob_ids_raw
    except (ValueError, TypeError):
        return None
    if not token_ids:
        return None
    yes_token = token_ids[0]
    start_ts = int(datetime(target_date.year, target_date.month, target_date.day).timestamp())
    end_ts = start_ts + 86400 - 1
    url = f"{POLYMARKET_CLOB_PRICES_HISTORY}?market={yes_token}&startTs={start_ts}&endTs={end_ts}&fidelity=60"
    data = http_get(url)
    if not isinstance(data, dict):
        return None
    history = data.get("history") or []
    if not history:
        return None
    # Take the last sample within the day (end-of-day snapshot).
    last_price = history[-1].get("p")
    if last_price is None:
        return None
    try:
        return round(float(last_price) * 100, 1)
    except (ValueError, TypeError):
        return None


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


def _coerce_dict_response(parsed):
    """If Sonar returned a list / string-wrapped JSON when we expected a dict,
    unwrap to a dict so the caller doesn't crash on .get(). Pass dicts through
    untouched. Handles common malformed shapes:
      - [{...full bundle...}]              → unwrap single dict
      - [{section1: {...}}, {section2: ...}] → shallow-merge into one dict
      - ["{ ...JSON... }"]                  → parse string as JSON
      - "{ ...JSON... }"                    → parse string as JSON
    """
    # If it's a string that looks like JSON, try parsing it
    if isinstance(parsed, str):
        s = parsed.strip()
        # Strip markdown code fences
        if s.startswith("```"):
            lines = s.split("\n")
            if len(lines) > 2:
                s = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
        if s.startswith("{") or s.startswith("["):
            try:
                inner = json.loads(s)
                return _coerce_dict_response(inner)
            except (ValueError, TypeError):
                pass
        return parsed  # caller handles
    if isinstance(parsed, dict):
        return parsed
    if isinstance(parsed, list):
        # Try to extract dicts from list (recursing on string elements)
        candidates = []
        for x in parsed:
            if isinstance(x, dict):
                candidates.append(x)
            elif isinstance(x, str):
                # Maybe this string is a JSON object
                coerced = _coerce_dict_response(x)
                if isinstance(coerced, dict):
                    candidates.append(coerced)
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            merged = {}
            for d in candidates:
                merged.update(d)
            return merged
    return parsed  # let caller handle; merge step has isinstance guards


def try_parse_json(text):
    """Try to extract and parse JSON from text (may be wrapped in markdown)."""
    # Try direct parse
    try:
        return _coerce_dict_response(json.loads(text))
    except json.JSONDecodeError:
        pass

    # Try extracting from ```json ... ``` block
    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if m:
        try:
            return _coerce_dict_response(json.loads(m.group(1)))
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
                            return _coerce_dict_response(json.loads(text[start : i + 1]))
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
This is Day {day_num} of the conflict. Today's date is {day_date}.

CRITICAL FOR key_developments: Each item must be a SPECIFIC EVENT THAT HAPPENED IN THE LAST 48-72 HOURS, with a date or time reference if possible. Do NOT include:
- War-start references or "Operation X commenced..." sentences
- Cumulative-totals filler ("Over N total sorties flown", "N targets struck over X days")
- Generic stockpile/destruction summaries
- Anything older than 3 days
If fewer than 5 fresh events occurred, return fewer items rather than padding with old context. Quality over quantity.

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
  "key_developments": ["<string — 5-8 fresh events from the last 48-72 hours; NO war-start references, NO cumulative-total filler, each event must be dated or time-anchored>"],
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
  "key_notes": "<any relevant inflation/Fed commentary related to Iran war oil price impact>",
  "cpi_breakdown": {{
    "energy_yoy_pct": <number or null — Energy component CPI YoY %>,
    "energy_pre_war_pct": <number or null — pre-war (Feb 2026) Energy CPI YoY % for delta context>,
    "food_yoy_pct": <number or null>,
    "food_pre_war_pct": <number or null>,
    "shelter_yoy_pct": <number or null>,
    "shelter_pre_war_pct": <number or null>,
    "services_yoy_pct": <number or null>,
    "services_pre_war_pct": <number or null>
  }}
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


def fetch_sonar_analytical(day_num, day_date, intel_summary):
    """Generate the analytical-prose sections (dLive, analyticalOutlook) in one call.

    Takes a brief intel summary so Sonar can ground the analysis in actual
    current-state data rather than speculating. Returns a structured JSON
    bundle that the merge step writes to dashboard-data.js.
    """
    print("[SONAR] Analytical bundle (sonar-pro)...")
    system = (
        "You are a markets/geopolitics analyst writing structured analytical commentary "
        "for a war-tracking dashboard. Return ONLY valid JSON matching the schema EXACTLY. "
        "No markdown, no code fences, no prose outside the JSON. Your output MUST be a "
        "single JSON object that begins with `{` and ends with `}`, NOT a list, NOT a "
        "string, NOT a partial section. The object MUST contain ALL of these top-level "
        "keys: dLive, analyticalOutlook, houthiRedSea, pipelineBypass, arsenalBadge, "
        "marketSignals, tacoInputs, predictionAnalytics, tacoHistorical, tacoAnalytics, "
        "ceasefireAnalyticsExtras. Each note field should be 2-4 sentences of crisp "
        "analytical prose grounded in TODAY'S state. Do NOT include war-start references, "
        "cumulative-total filler, or generic context. If a sub-field cannot be confidently "
        "filled, use null — but the parent key MUST still be present."
    )
    user = f"""Today is {day_date} (Day {day_num} of the US-Iran conflict).

Brief on current state:
{intel_summary}

Return JSON matching exactly this schema:
{{
  "dLive": {{
    "label": "<short headline e.g. 'D{day_num} — <THEME> (<short date>, <weekday>)'>",
    "brentRange": "<expected range today, e.g. '$108–$115'>",
    "brentNote": "<2-4 sentences: where Brent is now, what range to expect today, what swings it; ground in today's catalysts>",
    "tacoEst": "<TACO range estimate today, e.g. '12–16'>",
    "tacoNote": "<2-4 sentences: where TACO is now, what direction it's biased, what would push it which way>"
  }},
  "analyticalOutlook": {{
    "label": "<headline e.g. 'D{day_num} Outlook — <THEME>'>",
    "basisCards": [
      {{"label": "<situational driver>", "value": "<short status, e.g. 'ESCALATING' / 'STALLED' / '78% PROB'>", "detail": "<1-2 sentence detail>"}}
    ],
    "pathProbabilities": [
      {{"name": "<short scenario name e.g. 'US military strike' / 'Limited deal' / 'Full de-escalation'>", "prob": "<percent integer e.g. 35>", "brentRange": "<expected Brent range under this scenario, e.g. '$108-115'>", "trigger": "<1 sentence catalyst that would trigger this path>", "drivers": "<1 sentence of key drivers if different from trigger>"}}
    ],
    "supplyDisruption": {{
      "current": "<status line>",
      "risk": "<risk assessment 1-2 sentences>",
      "watchpoint": "<key thing to watch next 48h>"
    }}
  }},
  "houthiRedSea": {{
    "status": "<short status line about Bab el Mandeb / Houthi posture today>",
    "lastVerifiedAttack": "<date and 1-sentence description of most recent verified Houthi attack>",
    "threatLevel": "<LOW|MODERATE|HIGH|CRITICAL>",
    "babElMandebNote": "<2-3 sentences: current flow status, ceasefire effect, near-term risk>"
  }},
  "pipelineBypass": {{
    "saudiEastWestFlow": "<current flow figure or status, e.g. '~5.5M bpd (easing as Hormuz reopens)'>",
    "saudiEastWestStatus": "<short status badge, e.g. 'EASING · HORMUZ FRAGILE'>",
    "habshanFujairahFlow": "<current flow figure or status>",
    "habshanFujairahStatus": "<short status badge>",
    "combinedNote": "<1-2 sentences on the combined bypass capacity vs current Hormuz state>"
  }},
  "arsenalBadge": "<one short badge string, e.g. 'CEASEFIRE STOCKPILE FREEZE' or 'ACTIVE DEPLETION' or 'POST-WAR REBUILD'>",
  "marketSignals": {{
    "futuresCurveNote": "<1-2 sentences on Brent futures curve shape today (contango/backwardation) and what it implies>",
    "riskReversalNote": "<1-2 sentences on options skew / risk reversals today>",
    "cdsSpreadsNote": "<1-2 sentences on regional CDS or sovereign spreads today>",
    "cftcNote": "<1-2 sentences on speculator positioning if known>",
    "optionsIntelligenceNote": "<1-2 sentences on options-implied volatility regime>"
  }},
  "tacoInputs": {{
    "reversibility": {{"score": <0-100>, "rationale": "<2 sentences on how reversible the war footing is right now>"}},
    "rhetoric": {{"score": <0-100>, "rationale": "<2 sentences on rhetoric intensity from Trump/Iran leadership>"}},
    "diplomatic": {{"score": <0-100>, "rationale": "<2 sentences on diplomatic activity / talks state>"}},
    "marketImplied": {{"score": <0-100>, "rationale": "<2 sentences on market-implied de-escalation odds>"}},
    "domesticPolitical": {{"score": <0-100>, "rationale": "<2 sentences on US/Iran domestic political pressure on continuation vs settlement>"}}
  }},
  "predictionAnalytics": {{
    "fourLenses": {{
      "statistical": {{"signals": [{{"text": "<1 sentence pattern-recognition / base-rate signal>", "color": "<#22c55e (green=de-escal) | #f59e0b (amber=watch) | #ef4444 (red=escal)>"}}]}},
      "interactive": {{"signals": [{{"text": "<1 sentence game-theory / feedback-loop signal>", "color": "<hex>"}}]}},
      "chaotic": {{"signals": [{{"text": "<1 sentence non-linear / black-swan / regime-shift signal>", "color": "<hex>"}}]}},
      "complex": {{"signals": [{{"text": "<1 sentence emergent / institutional / systems signal>", "color": "<hex>"}}]}}
    }}
  }},
  "tacoHistorical": {{
    "score": <0-100>,
    "label": "<2 sentences: historical analogue / base-rate framing for current war state, citing relevant prior conflicts and statistical priors. NO Operation Epic Fury references.>"
  }},
  "tacoAnalytics": {{
    "momentum": {{"value": "<short label e.g. '+2.0' or '-1.5'>", "note": "<1 sentence on TACO score momentum direction and what's driving it>"}},
    "regime": {{"value": "<regime label e.g. 'CEASEFIRE (HOLDING)' or 'NEGOTIATION DEADLOCK' or 'KINETIC ESCALATION'>", "note": "<1 sentence describing the regime and key signals>"}},
    "lagSignal": {{"value": "<lag-correlated leading indicator, e.g. 'Brent -3d' or 'VIX -2d'>", "note": "<1 sentence on what the lag tells us right now>"}},
    "nextTrigger": {{"value": "<concise trigger threshold, e.g. 'TACO >= 22' or 'Brent <$95'>", "note": "<1 sentence: 3-5 specific watchpoints for the next 48-72h>"}}
  }},
  "ceasefireAnalyticsExtras": {{
    "compromiseZoneNote": "<2 sentences: where US and Iran demands could converge into a deal>",
    "chinaFactorNote": "<2 sentences: China's role / leverage in current dynamics, including any tariff/oil/sanctions threads>",
    "violationImpactSummary": "<2 sentences: what would happen on a ceasefire violation today, market and military>"
  }}
}}

Constraints:
- basisCards: 3-5 items
- pathProbabilities: 3-4 items, percentages should sum to ~100
- All prose must be CURRENT (today's catalysts, not historical)
- Do NOT mention 'Operation Epic Fury' or war-start dates
- Each value field on basisCards stays under 25 chars
- For sub-fields you cannot confidently fill, return null — DO NOT fabricate"""
    expected_keys = {"dLive", "analyticalOutlook", "houthiRedSea", "pipelineBypass",
                     "arsenalBadge", "marketSignals", "tacoInputs", "predictionAnalytics",
                     "tacoHistorical", "tacoAnalytics", "ceasefireAnalyticsExtras"}
    # Try once. If response misses ALL expected keys (partial / over-unwrapped),
    # retry once with a stricter reminder — Sonar sometimes returns just one
    # inner section (e.g. a single basisCard) instead of the full bundle.
    response = sonar_query("sonar-pro", system, user)
    if isinstance(response, dict) and (expected_keys & set(response.keys())):
        return response
    if isinstance(response, dict) and response.get("_error"):
        return response
    print("  [ANALYTICAL] First response had no expected keys — retrying with reinforcement...")
    reinforced_user = (
        "PREVIOUS ATTEMPT FAILED: your response did not contain the required top-level keys. "
        "You MUST return a single JSON object with these EXACT 11 keys at the root level: "
        "dLive, analyticalOutlook, houthiRedSea, pipelineBypass, arsenalBadge, marketSignals, "
        "tacoInputs, predictionAnalytics, tacoHistorical, tacoAnalytics, ceasefireAnalyticsExtras. "
        "Do NOT return just one section. Do NOT wrap in a list. Begin with `{` and end with `}`.\n\n"
        + user
    )
    response2 = sonar_query("sonar-pro", system, reinforced_user)
    return response2


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


def _scrape_count(urls, patterns, label):
    """Try a list of URLs; on first that returns a useful count, return it.

    Some marketplaces are SPA / JS-rendered and return a small placeholder
    HTML to non-browser clients — those won't match any pattern. Some are
    blocked by Cloudflare anti-bot. Fall back to None and let the merge step
    forward-fill from the last snapshot.
    """
    if isinstance(urls, str):
        urls = [urls]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers=_BROWSER_HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw = resp.read()
                # Decompress gzip/deflate if present
                if resp.headers.get("Content-Encoding") == "gzip":
                    import gzip
                    raw = gzip.decompress(raw)
                elif resp.headers.get("Content-Encoding") == "deflate":
                    import zlib
                    raw = zlib.decompress(raw)
                elif resp.headers.get("Content-Encoding") == "br":
                    try:
                        import brotli
                        raw = brotli.decompress(raw)
                    except ImportError:
                        pass  # brotli not installed; raw bytes may still parse
                html = raw.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"  [DUBAI/{label}] {url[:60]}: {e}")
            continue
        for pat in patterns:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                try:
                    raw_num = m.group(1).replace(",", "")
                    if "k" in raw_num.lower():
                        return int(float(raw_num.lower().replace("k", "")) * 1000)
                    return int(raw_num)
                except (ValueError, AttributeError):
                    continue
        print(f"  [DUBAI/{label}] {url[:60]}: no count match in {len(html)}b")
    return None


def fetch_dubai_watch(day_date):
    """Scrape UAE used-car marketplaces for total listing counts.

    LIMITATION: dubizzle and dubicars serve a JS-rendered SPA shell to non-
    browser clients (Cloudflare anti-bot). Reliable scraping for those needs
    playwright/puppeteer. yallamotor sometimes returns full HTML, sometimes
    rate-limits. Counts that fail to scrape return None and the merge step
    forward-fills from the most recent successful snapshot.
    """
    print("[SCRAPE] Dubai Watch...")
    out = {}

    out["dubizzle"] = _scrape_count(
        [
            "https://dubai.dubizzle.com/motors/used-cars/",
            "https://www.dubizzle.com/en-uae/motors/used-cars/",
        ],
        [
            r'"total[_-]?(?:results|count|hits)"\s*:\s*"?(\d[\d,]+)',
            r'(\d[\d,]{4,})\s*(?:used\s+)?cars?\s+(?:for\s+sale|in\s+(?:dubai|uae))',
            r'<meta[^>]*description[^>]*content="[^"]*?(\d[\d,]{4,})\s*(?:used\s+)?cars?',
            r'showing\s+\d+[\d,\s\-of]*\s+of\s+(\d[\d,]+)',
        ],
        "dubizzle",
    )

    out["dubicars"] = _scrape_count(
        [
            "https://www.dubicars.com/used-cars",
            "https://www.dubicars.com/used-cars/uae",
            "https://www.dubicars.com/",
        ],
        [
            r'(\d[\d,]{3,})\s*(?:used\s+)?cars?\s+(?:for\s+sale|listed|in\s+(?:dubai|uae))',
            r'"total[_-]?(?:results|count|listings)"\s*:\s*"?(\d[\d,]+)',
            r'<meta[^>]*description[^>]*content="[^"]*?(\d[\d,]{3,})\s*(?:used\s+)?cars',
            r'(\d[\d,]{3,})\s*(?:results|listings)',
        ],
        "dubicars",
    )

    out["yallamotor"] = _scrape_count(
        [
            "https://uae.yallamotor.com/used-cars",
            "https://uae.yallamotor.com/used-cars/dubai",
        ],
        [
            r'(\d[\d,]{2,})\s*(?:used\s+)?cars?\s+(?:for\s+sale|listed|in\s+(?:dubai|uae))',
            r'"total[_-]?(?:results|count)"\s*:\s*"?(\d[\d,]+)',
            r'<meta[^>]*description[^>]*content="[^"]*?(\d[\d,]{2,})\s*(?:used\s+)?cars',
            r'(\d[\d,]+)\s*(?:results|listings|vehicles)',
        ],
        "yallamotor",
    )

    found = sum(1 for v in out.values() if v is not None)
    print(f"  [DUBAI] Scraped {found}/3 platforms: {out}")
    out["data_freshness"] = f"live scrape on {day_date}"
    out["note"] = ""
    out["_collected"] = found > 0
    return out


# Back-compat alias for any code still referencing the old name
fetch_sonar_dubai_watch = fetch_dubai_watch


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
    parser.add_argument("--historical", action="store_true",
                        help="Backfill mode: use historical endpoints for FMP, "
                             "Polymarket, and Hyperliquid scoped to the --day date.")
    args = parser.parse_args()

    day_num = args.day
    day_date_obj = WAR_START + timedelta(days=day_num - 1)
    day_date = day_date_obj.strftime("%d %b %Y")
    day_date_short = day_date_obj.strftime("%b %-d") if os.name != "nt" else day_date_obj.strftime("%b %#d")
    is_weekend = args.weekend or (not args.no_auto_weekend and day_date_obj.weekday() >= 5)
    historical_date = day_date_obj if args.historical else None
    if historical_date is not None:
        print(f"  [HISTORICAL] Backfill mode: all market data scoped to {historical_date.strftime('%Y-%m-%d')}")

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
        # In historical mode, FMP's historical endpoint carries forward prior
        # trading-day closes, so we run it on weekends too.
        if (not is_weekend) or historical_date is not None:
            futures["fmp"] = pool.submit(fetch_fmp_quotes, FMP_TICKERS, historical_date)
        futures["hl"] = pool.submit(fetch_hyperliquid_brentoil, historical_date)
        futures["poly"] = pool.submit(fetch_polymarket_iran, historical_date)

        # Tier B: Sonar research
        # Dubai watch is a real HTTP scrape, runs regardless of Sonar key
        futures["dubai"] = pool.submit(fetch_dubai_watch, day_date)
        if PERPLEXITY_API_KEY:
            futures["intel"] = pool.submit(fetch_sonar_intelligence, day_num, day_date)
            futures["fed"] = pool.submit(fetch_sonar_cpi_fed, day_date)
            futures["rhetoric"] = pool.submit(fetch_sonar_rhetoric, day_num, day_date)
            futures["bca"] = pool.submit(fetch_sonar_bca, day_date)
        else:
            print("[WARN] No PERPLEXITY_API_KEY — skipping Sonar queries\n")

        # Collect results
        for name, future in futures.items():
            try:
                results[name] = future.result(timeout=120)
            except Exception as e:
                print(f"  [{name.upper()}] Error: {e}")
                results[name] = {"_error": str(e), "_collected": False}

    # ── Sequential analytical Sonar (depends on intel) ────────────────────
    if PERPLEXITY_API_KEY and not historical_date:
        intel_data = results.get("intel") or {}
        rhetoric_data = results.get("rhetoric") or {}
        cf = intel_data.get("ceasefire_status", "")
        hz = intel_data.get("hormuz_status", "")
        key_devs = intel_data.get("key_developments", []) or []
        diplo = rhetoric_data.get("diplomatic_developments", []) or []
        intel_summary_lines = [
            f"Ceasefire status: {cf}",
            f"Hormuz status: {hz}",
            f"Key developments (last 48-72h):",
        ]
        for d in key_devs[:5]:
            intel_summary_lines.append(f"  - {d}")
        if diplo:
            intel_summary_lines.append("Diplomatic developments:")
            for d in diplo[:3]:
                intel_summary_lines.append(f"  - {d}")
        intel_summary = "\n".join(intel_summary_lines)
        try:
            results["analytical"] = fetch_sonar_analytical(day_num, day_date, intel_summary)
        except Exception as e:
            print(f"  [ANALYTICAL] Error: {e}")
            results["analytical"] = {"_error": str(e), "_collected": False}

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
        "_raw_analytical": results.get("analytical"),

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
