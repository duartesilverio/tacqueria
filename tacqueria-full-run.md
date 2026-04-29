---
name: tacqueria-full-run
description: Full run procedure for the Tacqueria Iran-US war conflict dashboard. API-assisted pipeline using collect-data.py (FMP, Hyperliquid, Polymarket, Perplexity Sonar) + Python patch scripts. Deploys to a Cloudflare Worker (`tacqueria.duarte-silverio.workers.dev`) via Cloudflare Workers Builds, which auto-builds on every push to GitHub `master`.
triggers:
  - do a full run
  - update the dashboard
  - refresh data
  - do a data update
  - do a light run
---

# Tacqueria Dashboard — Full Run Procedure (v5.0.0 — API-Assisted)

## When to Use This Skill

Use when the user asks to:
- "do a full run"
- "update the dashboard"
- "refresh data"
- "do a data update"
- "do a light run" (data-only, no HTML editing)
- Any request to update the Tacqueria Iran-US war conflict dashboard

## Architecture (v5.0.0 — API-Assisted Pipeline)

```
tacqueria/
├── index.html              (~2,355 lines — static HTML template)
├── js/dashboard-data.js    (~1,387 lines — ALL dynamic data + ALL prose content)
├── js/render.js            (351 lines — populates KPIs, charts, pills)
├── js/render-prose.js      (570 lines — populates prose containers from data)
├── scripts/
│   ├── collect-data.py     (NEW — automated data collection via APIs)
│   ├── update-dashboard.py (patches dashboard-data.js from JSON input)
│   └── update-html.py      (patches index.html from JSON input)
├── js/charts.js, data.js, taco-v2.js, tabs.js, theme.js, fullscreen.js, taco-analytics.js
├── js/prediction-charts.js, whale-watch.js, bibi-watch.js, dubai-watch.js
├── js/render-prediction.js  (386 lines — populates Prediction Analytics tab)
├── js/arsenal.js            (148 lines — populates Arsenal & Attrition section in Operations tab)
├── js/inflation.js          (148 lines — populates Inflation & Fed Funds Rate tab in Analytical group)
├── js/ceasefire-analytics.js    (440 lines — populates Ceasefire Analytics tab in Analytical group)
│   (render.js also renders troopCounter in overview sidebar)
├── css/prediction-analytics.css (614 lines — Prediction Analytics styles)
├── css/ceasefire-analytics.css  (603 lines — Ceasefire Analytics styles)
├── css/ (mobile.css, overrides.css, layout.css, variables.css, etc.)
├── data/iran_markets.json, latest_data.json
├── .env                    (API keys — not in git)
├── _headers                (Cloudflare Worker static-asset cache headers)
```

### Key Principle: API-Assisted Collection + Script-Assisted Patching

In v5.0.0, data collection is automated via `collect-data.py`, eliminating expensive LLM sub-agents:

1. `collect-data.py` fetches all factual data via APIs → writes `day-N-raw.json`
2. LLM reads raw data → writes analytical prose into `day-N-data.json` (NO external tool calls needed)
3. Python scripts patch the large files surgically
4. `git push` triggers Cloudflare Workers Builds auto-deploy

**Cost savings**: ~90% reduction in data collection (from ~$3-6 in LLM sub-agents to ~$0.25-0.40 in API calls)

### Three Python Scripts

**`scripts/collect-data.py`** — Automated data collection (NEW in v5.0.0)
- Fetches market data via FMP API (16 tickers: Brent, WTI, VIX, S&P, Gold, TNX, HYG, ITA, defense stocks, ETFs)
- Fetches Hyperliquid BRENTOIL via REST API (24/7 oil futures)
- Fetches Polymarket Iran contracts via Gamma API
- Fetches intelligence, rhetoric, CPI/Fed, BCA ops, Dubai Watch via Perplexity Sonar API
- Handles weekend mode automatically (skips FMP, carries Friday prices)
- Runs all sources in parallel via ThreadPoolExecutor
- Output: `scripts/day-N-raw.json` with mechanical data + raw research for LLM synthesis

**`scripts/update-dashboard.py`** — Patches dashboard-data.js
- Input: JSON file with updated sections
- Handles: meta field updates, KPI price patches, full section replacements, chartData array appends
- Validates JS syntax after patching
- Backs up to .bak before writing

**`scripts/update-html.py`** — Patches index.html
- Input: JSON file with day number, scores, badge counts
- Handles: stat banner n-count, chart headers (Day 1→N), TACO gauge, scenarios title, triggers badge, regime flags, TACO inputs badge
- Uses HTML entity-aware regexes (&mdash;, &middot;, &rarr;)
- Also supports `htmlPatches` array for arbitrary regex replacements

### Data Properties in dashboard-data.js

| Property | ~Line | Rendered By | Content |
|----------|-------|-------------|---------|
| `meta` | 13 | render.js | Version, day, TACO score, regime |
| `kpis` | 37 | render.js | 8 financial instruments with prices/notes (brent, wti, tnx, vix, hyg, gold, brentWtiSpread, ita) |
| `marketStrip` | 49 | render.js | 6-item compact overview strip |
| `tacoSubScoresOverview` | 59 | render.js | 6 TACO sub-component scores |
| `predictionMarkets` | 69 | render.js | Signal cards, liquidity table, category tables |
| `tacoInputs` | ~200 | render.js | 6 TACO indicators with signals/scores |
| `tacoConfig` | ~370 | render.js | Composite score, rhetoric breakdown, key phrases |
| `tacoAnalytics` | ~430 | render.js | Momentum, regime, lag signal, next trigger |
| `chartData` | ~470 | charts.js + taco-analytics.js | ALL time series arrays |
| `overviewPredMktCards` | ~560 | render.js | 4 overview prediction market cards |
| `dubaiWatch` | ~570 | dubai-watch.js | Snapshots, latest counts, luxury brands |
| `gistBanner` | 588 | render-prose.js | 5 bullets + 7 pills |
| `newsNow` | 608 | render-prose.js | 6 collapsible news cards |
| `analyticalSignals` | 648 | render-prose.js | 5 signal assessment cards |
| `dLive` | 687 | render-prose.js | D-LIVE box (Brent range, TACO est, narrative) |
| `analyticalOutlook` | 697 | render-prose.js | 5 basis cards, 4 path probabilities, trajectory |
| `keyTriggers` | 775 | render-prose.js | 3 trigger watch cards |
| `intelligence` | 794 | render-prose.js | 3-column intel (diplomatic, military, energy) |
| `next48h` | 913 | render-prose.js | 7 catalyst watchlist items |
| `rhetoricTracker` | 969 | render-prose.js | Sentiment bar, timeline, patterns, score summary |
| `marketSignals` | 1199 | render-prose.js | Futures curve, CDS, CFTC, risk reversal, brentWtiSpread, optionsIntelligence |
| `operations` | 1228 | render-prose.js | Badge, KPI cards, indicator rows |
| `predictionAnalytics` | ~3070 | render-prediction.js | Four Lenses, Game Theory, Scenario Matrix, Convergence, Decision Tree |
| `arsenal` | ~3490 | arsenal.js | Iran & US weapons stockpiles, production rates, expenditure, depletion projections |
| `inflation` | ~3700 | inflation.js | Oil-to-CPI passthrough derivation, CPI breakdown, Fed funds rate, rate path probabilities |
| `troopCounter` | ~3730 | render.js | US Force Posture sidebar: troops, marines, carriers, vessels sunk, targets, KIA, funding |
| `hyperliquid` | ~3750 | render-prose.js | Hyperliquid BrentOIL-USDC 24/7 price, spread vs trad Brent, chart, volume |
| `ceasefireAnalytics` | ~3780 | ceasefire-analytics.js | Demand matrix (US 15 + Iran 10), ceasefire threshold progress, compromise zone, China tariff factor, violation impact, outcome scenarios |

---

## Run Types

### Light Run (~$0.30 API + minimal LLM)
Data-only update. `collect-data.py` → LLM writes JSON → script patches dashboard-data.js → git push.

**Does NOT cover:** Triggers tab rows, Scenarios tab, TACO Analytics HTML, Stat Model banner

### Full Run (~$0.40 API + moderate LLM)
Complete update including HTML patches via script.

**Flow:** `collect-data.py` → LLM reads raw + writes JSONs → Run scripts → git push

---

## PHASE 1 — Automated Data Collection

**Run the collection script. This replaces ALL sub-agent calls (browser_task, search_web, finance_quotes).**

```bash
python scripts/collect-data.py --day {N}
```

The script auto-detects weekends and handles everything in parallel. Override with:
- `--weekend` — force weekend mode (skip FMP, carry Friday prices)
- `--no-auto-weekend` — force weekday mode even if the date falls on Sat/Sun

### What the Script Collects

| Source | API | Model/Tier | Output |
|--------|-----|------------|--------|
| Market prices (16 tickers) | FMP `/api/v3/quote/` | Free tier | `kpis`, `marketStrip`, `chartAppend` |
| Hyperliquid BRENTOIL | HL REST `metaAndAssetCtxs` | Free (no key) | `hyperliquid` |
| Polymarket Iran contracts | Gamma API `/markets?tag=iran` | Free (no key) | `_raw_polymarket` |
| Intelligence sweep | Perplexity Sonar `sonar-pro` | ~$0.10-0.20 | `_raw_intelligence` |
| CPI/Fed data | Perplexity Sonar `sonar` | ~$0.02 | `_raw_fed` |
| Rhetoric monitoring | Perplexity Sonar `sonar` | ~$0.02 | `_raw_rhetoric` |
| BCA/operations data | Perplexity Sonar `sonar-pro` | ~$0.05-0.10 | `_raw_bca` |
| Dubai Watch car counts | Perplexity Sonar `sonar` | ~$0.02 | `_raw_dubai` |

### Output: `scripts/day-{N}-raw.json`

**Complete mechanical sections (no LLM needed):**
- `kpis` — all 8 instruments with price/change/changePct/prevClose/cssClass/note
- `marketStrip` — 6-item compact overview
- `chartAppend` — new day's values for all time-series arrays
- `hyperliquid` — price, spread, volume, OI
- `inflation_derivation` — mechanical CPI passthrough calculation from Brent price

**Raw research data (LLM reads these to write analytical sections):**
- `_raw_intelligence` — conflict stats, strike counts, Hormuz, casualties, key developments
- `_raw_rhetoric` — Trump/Iran/Israel leadership statements with timestamps and tone
- `_raw_polymarket` — all Iran-related contract probabilities and volumes
- `_raw_bca` — UAE attacks, Gulf neighbor attacks, oil production cuts, ceasefire odds
- `_raw_dubai` — car listing counts (best-effort)
- `_raw_fed` — latest CPI, Fed rate, FedWatch probabilities

### Weekend Rule (handled automatically by the script)

- **FMP skipped** — carries Friday's prices from previous `day-N-data.json`
- **Hyperliquid always fetched** — 24/7 market
- **Sonar always fetched** — war doesn't stop on weekends
- **chartAppend uses Friday market values** — keeps arrays aligned for stat models
- **TACO score still set by LLM** — not in the raw file

### API Keys

Stored in `.env` (project root, not in git):
```
FMP_API_KEY=B4w60DIzcKRgXjRT1TARzoGA0O6Fn5n0
PERPLEXITY_API_KEY=pplx-xxxxxxxxx
```

### Inflation Passthrough Model (computed mechanically by script)

Uses current Brent price from FMP:
- oil_increase = (current_brent - 73.20) / 73.20
- energy_cpi_impact = oil_increase * 0.23 (Fed coefficient)
- headline_direct = 0.07 * energy_cpi_impact (BLS energy weight)
- headline_total = headline_direct * 1.27 + 0.15pp (second-round + food)
- estimated_cpi = 2.4% + headline_total

---

## PHASE 2 — Write JSON Input Files

**This is where the LLM's analytical work happens.** The LLM reads `scripts/day-{N}-raw.json` (produced by Phase 1) and writes two JSON files. It does NOT read dashboard-data.js or make external tool calls.

The LLM should:
1. Read `scripts/day-{N}-raw.json` for all factual data (prices, research, contracts)
2. Use the mechanical sections (`kpis`, `marketStrip`, `chartAppend`, `hyperliquid`, `inflation_derivation`) directly — they are already in the correct format
3. Synthesize the `_raw_*` sections into analytical prose (intelligence, rhetoric, operations, etc.)
4. Write `scripts/day-{N}-data.json` and `scripts/day-{N}-html.json`

### 2A. Dashboard Data Input (day-N-data.json)

Write a JSON file to `scripts/day-{N}-data.json` with ALL sections.

The JSON has these top-level keys. **Every key listed below MUST be included** in the input file for a full run:

#### Mechanical sections (copy from raw.json or fill from raw research):
- `meta`: { version, timestamp, day, dayDate, threatLevel, threatClass, tacoScore, tacoMax, tacoPrev, tacoPrevDay, tacoRegime, tacoRegimeLabel, tacoRegimeColor, tacoPhase, tacoPhaseCeiling, tacoDelta, tacoDeltaNote, tacoBadgeText, tacoGaugeLabel }
- `kpis`: { brent: {price, change, changePct, prevClose, cssClass, note}, wti: {...}, tnx: {...}, vix: {...}, hyg: {...}, gold: {...}, brentWtiSpread: {price, change, changePct, prevClose, cssClass, note}, ita: {...} }
- `marketStrip`: [ {label, value, delta, color} × 6 ]
- `tacoSubScoresOverview`: { reversibility: {score, label}, rhetoric: {...}, diplomatic: {...}, marketImpl: {...}, historical: {...}, domPolitical: {...} }
- `tacoAnalytics`: { momentum: {value, note}, regime: {value, note}, lagSignal: {value, note}, nextTrigger: {value, note} }
- `tacoConfig`: { compositeScore, phase, phaseCeiling, indicators: {...}, rhetoric: { totalStatements, breakdown, deescalationSignals, deescalationReversed, rhetoricToActionLagHrs, keyPhrases: [...] } }
- `overviewPredMktCards`: [ {title, detail, prob, delta, deltaColor} × 4 ]
- `chartData`: Full chartData object with ALL arrays (labels, brent, vix, hyg, sp500, taco, strikeLabels, strikes, hormuzLabels, hormuzTransits, etfs, pmCeasefireLabels, pmCeasefireData, pmOilLabels, pmOilPoly, pmOilKalshi, pmCompareLabels, pmComparePoly, pmCompareKalshi, pmBubbleContracts)
  - **IMPORTANT**: Copy previous day's arrays and APPEND the new day's value. Do NOT truncate history.
  - Previous day's data is listed in the skill's "Previous Day Reference" section below.
- `dubaiWatch`: Full object (snapshots array with new entry appended, baselines, latest, luxury, dataNote)
- `pipelineBypass`: Full object (saudiEastWest, habshanFujairah, combined)
- `houthiRedSea`: Full object
- `iranAttacksUAE`: Full object (cumulative + daily array with new entry appended)
- `iranAttacksNeighbors`: Must be an OBJECT (not array!) with structure: {asOf, day, totalProjectiles, countriesHit, countries: {uae: {ballistic, cruise, drones, totalMissiles, totalDrones, total, killed, injured, keyTargets, interceptRate}, bahrain: {...}, saudiArabia: {...}, qatar: {...}, kuwait: {...}, oman: {...}}}. The `.countries` sub-object is required by charts.js for the Gulf Neighbors breakdown chart. If written as a flat array, the chart silently fails.

#### Prediction Markets (fill from Polymarket/Kalshi data):
- `predictionMarkets`: { signalCards, liquidityTable, ceasefire, oil, hormuz, regime, escalation, nuclear, comparison }

#### Analytical/Prose sections (LLM writes fresh analysis):
- `gistBanner`: { bullets: [{text, color}], pills: [{label, color}] }
- `newsNow`: [ {label, title, body, color} × 6 ]
- `analyticalSignals`: [ {label, value, score, scoreColor, detail} × 5 ]
- `dLive`: { label, brentRange, brentNote, tacoEst, tacoNote, narrative }
- `analyticalOutlook`: { label, basisCards, pathProbabilities, supplyDisruption, tacoTrajectory, disclaimer }
  - **CRITICAL SCHEMA**: basisCards[]: {label, value, detail, borderColor (#hex), valueColor (#hex)} — NOT {title, body, color}.
  - **CRITICAL SCHEMA**: pathProbabilities[]: {name, prob (e.g. '48%'), brentRange, barWidth (e.g. '48%'), barGradient (CSS gradient), nameColor (#hex), drivers} — NOT {path, probability, brent, taco, note}.
- `keyTriggers`: [ {title, titleColor, body} × 3 ]
- `intelligence`: { diplomatic: {badge, badgeColor, sections, sources}, military: {...}, energy: {...} }
  - **CRITICAL SCHEMA**: sections[].title + sections[].items (array of STRINGS, not objects). sources[] must be objects {url, label} NOT plain strings.
- `next48h`: { badge, catalysts: [{rank, title, outcomeLabel, body, color}] }
  - **CRITICAL SCHEMA**: Each catalyst needs: rank (string number), title, outcomeLabel (short label), body (detail text), color.
- `rhetoricTracker`: { sentiment, timeline, patterns, scoreSummary }
  - **Timeline MUST be continuous** from Day 1 to current day. Copy previous timeline and ADD new day's entries.
- `marketSignals`: { futuresCurve, riskReversal, cdsSpreads, cdsCommentary, cftc, brentWtiSpread: {current, preWar, widening, brentPrice, wtiPrice, commentary}, optionsIntelligence: {badge, summary, signals: [{title, icon, explanation, signal, signalColor}], bottomLine} }
  - **CRITICAL**: `futuresCurve` must be {m1, m6, m12, commentary}. `riskReversal` must be {oneMonth, threeMonth, commentary}. `cftc` must be {badge, wtiNetLong, brentNetLong, commentary}. ALL must be objects, NOT strings.
  - **CRITICAL**: `cdsSpreads` must be [{country, current, preWar, change, signal}]. UPDATE EVERY RUN with current bps values.
  - **CRITICAL**: `brentWtiSpread` in marketSignals is DIFFERENT from `brentWtiSpread` in `kpis`. The KPI one uses {price, change, changePct}. The marketSignals one uses {current, preWar, widening, brentPrice, wtiPrice, commentary}. BOTH must be updated each run.
- `operations`: { badge, kpis, indicators, pipeline, uaeAttackSummary, iranNeighbors }
  - **CRITICAL SCHEMA**: kpis[]: {label, value, delta, note, color} — NOT {detail}.
  - **CRITICAL SCHEMA**: indicators[]: {indicator, value, dir, dirClass ('dir-up'/'dir-down'/'dir-flat'), notes} — NOT {label, detail, color}.
  - **CRITICAL SCHEMA**: pipeline: {petrolineValue, petrolineStatus, petrolineDetail, adcopValue, adcopStatus, adcopDetail} — NOT a string.
  - **CRITICAL SCHEMA**: uaeAttackSummary: {ballisticMissiles, ballisticIntercept, drones, droneIntercept, cruiseMissiles, cruiseIntercept, killed, injured} — NOT a string.
  - **CRITICAL SCHEMA**: iranNeighbors: [{country, missiles, drones, total, notes}] — NOT a string.

#### Inflation & Fed Funds Rate (analytical derivation):
- `inflation`: { badge, derivation: {steps: [{label, value, detail, color}], result: {headline, explanation}, methodology}, cpiBreakdown: [{component, preWar, current, delta, deltaColor}], fedRate: {kpis: [{label, value, detail, color}], probabilities: {title, scenarios: [{label, probability, color}]}, dotPlot, powellQuote: {text, attribution}}, bottomLine, sources: [{name, url}] }
  - **Derivation model**: Oil price increase → gasoline passthrough (Dallas Fed elasticity) → energy CPI (Fed passthrough coefficients) → headline CPI (BLS energy weight × energy CPI increase + second-round effects + food acceleration).
  - **Key formula**: 10% oil increase → +0.4% headline CPI (direct + second-round). Energy weight in CPI basket: ~7%. At +46% oil (pre-war $73.20 → $106.93): derives ~3.5% headline CPI.
  - **Fed section**: Current rate, FOMC decision, dot plot summary, CME FedWatch rate path probabilities (no cuts 48%, 1 cut 33%, 2 cuts 12%, hike 7%).
  - **Sources**: BLS CPI report, Fed FEDS Notes, Dallas Fed elasticity paper, CNBC/FRED rate data, CME FedWatch/Morningstar, TD Economics.
  - Renderer: `js/inflation.js` — fully data-driven, no HTML editing needed. Added to `update-dashboard.py` full_replace_sections list.
  - Tab location: Analytical group → "Inflation" tab.

#### Arsenal & Attrition (data-driven from operations board):
- `arsenal`: { badge, iran: [{label, preWar, preWarNum, remaining, remainingNum, borderColor, statusColor, depletionColor, production, status}], us: [{...same schema...}], expenditure: {iran: [{weapon, count}], iranNote, us: [{weapon, count}], usNote}, depletion: [{weapon, party, daysLeft, daysLeftLabel, burnRate, note, barColor}], bottomLine }
  - **Iran weapons**: MRBM, SRBM, Launchers (TELs), Drones (Shahed). Sources: JINSA, IDF assessments, Pentagon briefings.
  - **US weapons**: Tomahawk, JASSM/JASSM-ER, THAAD interceptors, JDAM/PGM. Sources: CSIS, Military Times, Breaking Defense.
  - **Expenditure**: Derived from `iranAttacksUAE`, `iranAttacksNeighbors`, and `chartData.strikes` arrays.
  - **Depletion**: Calculate days-to-depletion = remaining / daily_burn_rate for each weapon class. Sort by urgency.
  - **Key insight**: Iran's launcher destruction (83% by D21) is the binding constraint — missiles exist but cannot be launched. Drones are Iran's only sustainable weapon. US faces THAAD interceptor pressure (~54 days) as critical defensive gap.
  - Renderer: `js/arsenal.js` — fully data-driven, no HTML editing needed.

#### Troop Deployment Counter (overview sidebar):
- `troopCounter`: [ {value, label, color} ] — array of 7 items displayed in narrow column next to gist banner.
  - Update each run: troop count, marines en route, carrier groups, vessels sunk, targets struck, US KIA, war funding.
  - Renderer: built into `render.js`. Added to `update-dashboard.py` full_replace_sections list.

#### Inflation & Fed Funds Rate:
- `inflation`: Full object — derive CPI estimate from current oil price vs pre-war baseline using passthrough model. Update Fed rate data from latest FOMC/FedWatch.
  - **Passthrough formula**: oil_increase_pct = (current_brent - 73.20) / 73.20. energy_cpi_impact = oil_increase_pct × 0.23. headline_direct = 0.07 × energy_cpi_impact. headline_total = headline_direct × 1.27 + food_acceleration (~0.15pp). estimated_cpi = 2.4% + headline_total.
  - **Research needed**: Current Brent price, latest FOMC decision, CME FedWatch probabilities, any new inflation data (CPI, PCE releases).

#### TACO Inputs (analytical + scored):
- `tacoInputs`: [ {name, subDesc, weight, signal, score, maxScore, weighted, scoreClass, isNew, hasRhetoricLink} × 6 ]

#### Prediction Analytics (Sumpter Four Lenses — use `prediction-analytics` skill for methodology):
- `predictionAnalytics`: Full object — generated using the `prediction-analytics` skill framework
  - `fourLenses`: { statistical: {title, keyInsight, signals: [{text, color}], sevenDayPrediction}, interactive: {...}, chaotic: {...}, complex: {...} }
  - `gameTheoryPosture`: { players: [{player, revealedStrategy, statedStrategy, credibilityGap}], equilibria: [{name, probability, trend}] }
  - `scenarioMatrix`: [{scenarioName, probabilityPercent, description, predictedEvents: [{event, estimatedDate, confidence}], marketImpacts: {brentRange, vixRange, tacoTrajectory, goldDirection, sp500Direction, hygDirection}, confirmationTrigger, disconfirmationTrigger, gameTheoryClassification, keyLensSource}]
  - `convergenceAssessment`: { agreementZones: [{prediction, confidence, supportingLenses, reasoning}], divergenceZones: [{issue, lensA: {lens, position}, lensB: {lens, position}, implication}], netSevenDayOutlook: {primaryScenario, confidenceBand, synthesis} }
  - `decisionTree`: { criticalVariable, timeHorizon, branches: [{condition, probability, consequence, marketImpact}], monitoringIndicators: [] }
  - **IMPORTANT**: Load the `prediction-analytics` skill for full methodology guidance. Apply all four Sumpter lenses (Statistical/Fisher, Interactive/Lotka, Chaotic/Lorenz, Complex/Kolmogorov) with game theory overlay. Scenario probabilities must sum to ~100%. NO references to statistical models (GARCH, VAR, etc.).

### 2B. HTML Input (day-N-html.json)

Write a JSON file to `scripts/day-{N}-html.json`:

```json
{
  "day": 20,
  "tacoScore": 2,
  "scenariosDate": "19 MAR 2026",
  "triggersEscalation": 10,
  "triggersAmber": 5,
  "regimeFlagsTriggered": 5,
  "htmlPatches": [
    {
      "find": "regex pattern to find",
      "replace": "replacement text",
      "dotall": true
    }
  ]
}
```

The `htmlPatches` array is the escape hatch for any complex HTML edits not covered by the standard fields (trigger row details, scenarios path probabilities, momentum KPI cards, regime flag readings, etc.).

Use `htmlPatches` for:
- Updating individual trigger row answer/status/detail text
- Updating scenarios path matrix probabilities/ranges
- Updating momentum KPI card values and notes
- Updating regime flag readings with current values vs thresholds
- Any other HTML content that isn't a simple counter/label

### 2C. How to Write chartData Without Reading the File

The LLM should NOT read dashboard-data.js to get previous chart data. Instead:

**Previous day's chart endpoints are recorded here (update after each run):**

```
Day 22 endpoints (current):
  labels: last = 'Mar 21', array length = 22
  brent: last = 112.89, array length = 22
  vix: last = 26.78, array length = 22
  hyg: last = 78.92, array length = 22
  sp500: last = 6506.48, array length = 22
  taco: last = 2, array length = 22
  strikeLabels: last = '21 Mar', array length = 22
  strikes.us: last = 520, array length = 22
  strikes.iran: last = 55, array length = 22
  hormuzLabels: last = '21 Mar', array length = 24
  hormuzTransits: last = 2, array length = 24
```

For Day 23: use `chartAppend` key in the input JSON to append single values:
```json
{
  "chartAppend": {
    "labels": "Mar 19",
    "brent": 109.50,
    "vix": 24.10,
    "hyg": 79.50,
    "sp500": 6650,
    "taco": 2,
    "strikeLabels": "19 Mar",
    "hormuzLabels": "19 Mar",
    "hormuzTransits": 4
  }
}
```

OR provide the full `chartData` object (copied from previous run + new values appended) if complex nested updates are needed (ETF sparklines, bubble chart, prediction market charts).

---

## PHASE 3 — Run Scripts

```bash
# Step 1: Validate & auto-fix schema mismatches (ALWAYS run this first)
python scripts/validate-and-fix-data.py scripts/day-{N}-data.json --fix

# Step 2: Patch dashboard-data.js
python scripts/update-dashboard.py scripts/day-{N}-data.json

# Step 3: Patch index.html (Full Run only)
python scripts/update-html.py scripts/day-{N}-html.json
```

Both scripts:
- Back up to .bak before writing
- Validate output (JS syntax check for dashboard-data.js)
- Print which sections were patched

If a script fails, check the error output. Common issues:
- Section not found → check section key name matches exactly
- JS syntax error → malformed JSON input (bad quotes, trailing commas)
- The script restores from backup automatically on JS syntax failure

---

## PHASE 4 — Deploy via Git (Cloudflare Workers Builds)

```bash
git add js/dashboard-data.js index.html latest_data.json
git commit -m "Day {N} update — {brief summary}"
git push
```

Cloudflare Workers Builds auto-deploys on push to `master` (the `tacqueria` worker is git-connected to `duartesilverio/tacqueria`; if builds start failing with auth errors, regenerate the build token under Workers & Pages → tacqueria → Settings → Builds).
Live URL: https://tacqueria.duarte-silverio.workers.dev
GitHub repo: https://github.com/duartesilverio/tacqueria

## PHASE 5 — Verify (Optional — Skip if Confident)

Open https://tacqueria.duarte-silverio.workers.dev and check:
- Version number, day number, TACO score, Brent price are updated
- Charts show the new day's data point
- No console errors

Skip verification if:
- Both scripts reported success with no warnings
- JS syntax validation passed
- This is a routine update with no structural changes

---

## Critical Rules

1. **Statistical models should NOT be used in overview prediction OR Scenarios tab** — base on analytical data only (TACO sub-scores, prediction markets, intelligence signals, market conditions). Stat model outputs (Granger, VAR, GARCH, Bayesian, Ridge, HMM) belong exclusively in Tab 10 (Stat Models).
2. **Replace "UNDERPOWERED" with "INSUFFICIENT DATA"** across all model warnings
3. **Stat model note must be updated each run**: calculate X = 30 − current_day, Y = 60 − current_day for days remaining (handled by update-html.py automatically)
4. **Footer text**: "Engine42 did the heavy lifting; a carbon-based co-author stayed in charge of the thinking, and the credits."
5. **War start date**: Feb 28, 2026 (Operation Epic Fury)
6. **Equity markets note**: S&P/DJI/NASDAQ only update during US market hours — note as "Fri close" or "pre-market" on weekends/early morning
7. **Deploy via git push**: a Cloudflare Worker (`tacqueria`) connected to the GitHub repo via Cloudflare Workers Builds auto-deploys from `master` to https://tacqueria.duarte-silverio.workers.dev. GitHub repo: duartesilverio/tacqueria. NOTE: this is a Cloudflare Worker, NOT a Cloudflare Pages project.
8. **Chart data is centralized**: ALL chart time series live in `dashboard-data.js` under `chartData`. The Market & Risk chart in TACO Analytics reuses the same data source as the overview chart (single update, both reflect).
9. **Projection chart is dynamic**: Scenario ranges, branch point, labels, n-count note, and INSUFFICIENT DATA warning in the forward projection chart are all computed from current data at runtime. No manual projection editing needed.
10. **One-file update principle**: For Light Runs, only `dashboard-data.js` needs editing (via script). For Full Runs, also edit index.html (via script).
11. **Market & Risk chart**: Overview and TACO Analytics use same `chartData` source — update once, both reflect.
12. **Dubai Watch**: All content data-driven from `dubaiWatch` in dashboard-data.js. No HTML editing needed.
13. **Rhetoric Timeline must be continuous**: Never skip days — entries from Day 1 to current day.
14. **ALL dynamic labels must be updated each run**: Day numbers, dates, TACO scores, badge counts.
15. **NEVER read dashboard-data.js or index.html directly** — use the scripts. The only exception is debugging a script failure.
16. **Data collection is automated**: Run `python scripts/collect-data.py --day N` instead of browser_task/search_web calls. The script handles FMP, Hyperliquid, Polymarket, and Sonar queries in parallel.
19. **Inflation & Fed Funds Rate**: Data-driven from `inflation` in dashboard-data.js. Rendered by `js/inflation.js`. Update oil prices, recalculate passthrough model (use current Brent vs pre-war $73.20 baseline), update Fed rate data from latest FOMC, CME FedWatch probabilities. No HTML editing needed. Added to `update-dashboard.py` full_replace_sections list.
18. **Arsenal & Attrition**: Data-driven from `arsenal` in dashboard-data.js. Rendered by `js/arsenal.js`. Update stockpile estimates, expenditure counts (from `iranAttacksUAE`/`iranAttacksNeighbors`/`chartData.strikes`), and recalculate depletion days each run. No HTML editing needed. Added to `update-dashboard.py` full_replace_sections list.
20. **ALWAYS run the FULL pipeline after writing JSON**: validate-and-fix-data.py --fix → update-dashboard.py → update-html.py → git push. Do NOT stop after writing the JSON — the data must be patched and deployed. If you write JSON but don't deploy, the dashboard shows stale data.
21. **ALWAYS run validate-and-fix-data.py before update-dashboard.py**: The LLM frequently generates wrong property names (e.g., `bullets` instead of `items`, `path` instead of `name`, `detail` instead of `body`). The validator catches and auto-fixes these. Pipeline: validate-and-fix-data.py --fix → update-dashboard.py → update-html.py → git push.
22. **Bibi Watch**: Data is HARDCODED in `js/bibi-watch.js` (not in dashboard-data.js). The `rhetoricTimeline` array and `syncData` array must be manually extended each run by editing the JS file. Add new entries for the current day with: {day, date, dateLabel, statement, context, aggression (1-10), target, iranResponse, prediction} for timeline, and {day, dayLabel, bibiAgg, trumpAgg, goalAlign, timingSync, sync, note} for syncData. Key narrative thread: US-Israel sync has collapsed from 95% (D1) to ~20% (D26) as Trump pivots to ceasefire while Netanyahu escalates.
17. **Prediction Analytics**: Uses `prediction-analytics` skill methodology (Sumpter's Four Ways of Thinking + game theory). The tab is fully data-driven from `predictionAnalytics` in dashboard-data.js — no HTML editing needed. Scenario probabilities must sum to ~100%. Load the skill before writing this section.
23. **Stat Model Consensus**: taco-v2.js computes a quantitative consensus score (0–100) from 6 models. It runs eagerly on page load (not lazy). The consensus feeds a regime flag in the TACO Analytics tab via `window.STAT_MODEL_CONSENSUS` → `updateStatModelRegimeFlag()`. Model thresholds use **array length N** (weekday data points), NOT calendar war days. Current thresholds: Granger n≥30, VAR n≥30, Regime n≥40, GARCH n≥60, Bayesian n≥20, Ridge n≥30.
24. **Chart day labels use war days, not array indices**: `taco-analytics.js` and `taco-v2.js` compute actual war day numbers from date labels (Feb 28 = Day 1). Weekend gaps appear as D23→D26 jumps. Never use `'D' + (i+1)` for chart labels — always derive from dates.
25. **chartData arrays: no duplicates**: The `update-dashboard.py` `chartAppend` mechanism appends to arrays. If a label is appended twice (e.g., from a re-run), it creates duplicates that misalign labels vs data. The pipeline does NOT deduplicate — avoid double-appending by not re-running the same day's data.
26. **Do NOT include `chartData` key in Opus JSON**: The old full-replacement logic destroyed core time series. PM chart arrays are already in the file. Only use `chartAppend` for incremental updates. If PM data needs updating, add PM keys directly to the JSON root (the script handles partial replacement).
27. **KPI numeric fields**: Opus MUST write KPI price/change/changePct/prevClose as numbers (e.g., `109.97`), not strings (`"$109.97"`). The `update-dashboard.py` normalizes strings to numbers as a fallback, but clean input is preferred.
28. **LLM reads raw data, not external tools**: In v5.0.0 the LLM reads `day-N-raw.json` (produced by `collect-data.py`) instead of making external tool calls. This eliminates browser_task and search_web costs entirely.
30. **Ceasefire Analytics tab**: Fully data-driven from `ceasefireAnalytics` in dashboard-data.js. Rendered by `js/ceasefire-analytics.js`. Lazy-initialized in tabs.js via `window.ceasefireInit`. Tab ID: `ceasefire`. Located in Analytical group after Prediction Analytics. Schema: {meta, usDemands[15], iranDemands[10], ceasefire{requiredThreshold, currentMet, gap}, compromiseZone{headline, probability, probColor, timeHorizon, minimumViableDeal, blockers, scenarios}, chinaFactor{headline, probability, probColor, gameState, scenarios}, violationImpact[4], summaryKpis[6], bottomLine, sources}. Status colors: MET=#22c55e, PARTIAL=#f59e0b, CONTESTED=#f97316, NOT_MET=#ef4444, BLOCKED=#7c3aed. Use Opus for analytical generation. Do NOT reference statistical models. Each demand has: id, text, category, status, statusLabel, statusColor, probability30d/60d/90d, probColor, detail, dealBreaker.
29. **TACO Composition (two layers)**: Layer 1 = analytical assessment (6 qualitative sub-scores from Opus, primary). Layer 2 = stat model consensus (6 quantitative models computed in browser, advisory). The stat model consensus appears as the 8th regime flag in the TACO Analytics tab. When layers diverge, the divergence is itself a signal. The "TACO Composition — How the Score is Built" section in the TACO Analytics tab explains the heuristics.

## Version Bumping

- Data refresh (Light Run): increment last digit (v3.1.0 → v3.1.1)
- Full Run with data + HTML: increment middle digit (v3.1.x → v3.2.0)
- Structural/architectural changes: increment first digit (v4.x.x → v5.0.0)

## Previous Day Reference (Update After Each Run)

This section records the last values for arrays so the LLM can append without reading the file.

**Last updated: Day 37 (5 Apr 2026 — Sunday) — EVE OF DEADLINE**

```
chartData market arrays (length = 34 — weekend data appended with Fri close + actual TACO):
  labels: [..., 'Apr 3', 'Apr 4', 'Apr 5']  length=34
  brent: [..., 109.03, 109.03, 109.03]  last=109.03, length=34  (Fri close carried)
  vix: [..., 23.87, 23.87, 23.87]  last=23.87, length=34
  hyg: [..., 79.56, 79.56, 79.56]  last=79.56, length=34
  sp500: [..., 6582.69, 6582.69, 6582.69]  last=6582.69, length=34
  taco: [..., 10, 8, 7]  last=7, length=34  (actual TACO scores for D35/D36/D37)

Strikes arrays (length = 36):
  strikeLabels: [..., '3 Apr', '4 Apr']  last='4 Apr'
  strikes.us: [..., 480, 500]  last=500
  strikes.iran: [..., 50, 55]  last=55

hormuz arrays (length = 39):
  hormuzLabels: [..., '3 Apr', '4 Apr']  last='4 Apr'
  hormuzTransits: [..., 1, 4]  last=4

ETF sparklines (length = 35):
  ITA: [..., 222, 222, 222]
  XLE: [..., 59, 59, 59]
  XOP: [..., 178, 178, 178]
  GLD: [..., 429, 429, 429]
  TLT: [..., 87, 87, 87]

Dubai Watch latest (Day 36):
  dubizzle: 26364, dubicars: 26542, yallamotor: 38240

BCA (Apr 3): Attacks UAE 20/day, Hormuz ~65 vessels/7-day, ME cuts 8.8 MMb/d
  Ceasefire Apr 30: 24%, Jun 30: 64%. Leadership change: 23%↓

Key scores (Day 36):
  TACO: 8 (↓ from 10 — tri-front attack + energy strike preparation)
  Brent: $109.03 (Fri close), HL: $109.94, OI $552M ATH
  Houthis 5th attack — JOINT with IRGC + Hezbollah targeting Ben Gurion Airport
  Israel ready to strike energy sites (awaiting Trump approval)
  IRGC drone attacked MSC Ishyka in Hormuz
  Trump: core objectives nearing completion, 2-3 weeks hard push
  US intel: Iran won't negotiate seriously
  Polymarket: US enters 97%(!), Ceasefire 70%, Trump ends ops 69%↓
  Scenarios: Trump Vetoes Energy 40%, Grinding 32%, Energy+SOF 18%, Conflagration 10%
```

Rhetoric through D36. Dubai Watch 25 snapshots. Iran attacks daily 27 entries.

n=32 data points (weekend, no market append). 6/7 stat models active.

Bibi Watch through D36: sync 38% (dipped on energy strike divergence), Bibi agg 7 (wants energy strikes), Trump 5.

Deploy: `git push` to duartesilverio/tacqueria → Cloudflare Workers Builds auto-deploys
Live URL: https://tacqueria.duarte-silverio.workers.dev
