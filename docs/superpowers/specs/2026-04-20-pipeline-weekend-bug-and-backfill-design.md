# Pipeline Weekend Bug + Day 50/51 Backfill + Schedule Change

**Date:** 2026-04-20
**Trigger:** User reported daily dashboard "hasn't been running since the 16th".

## Findings (root cause)

- The scheduled cron has been firing every day on time.
- Day 48 (Apr 16) and Day 49 (Apr 17) ran, committed, and pushed (`6ae2da5`, `2236013`). Local master was just 3 commits behind origin.
- **Day 50 (Apr 18) and Day 51 (Apr 19) failed** with:
  ```
  File "scripts/merge-raw-into-data.py", line 160, in enhance_kpi_notes
      for key, kpi in raw_kpis.items():
  AttributeError: 'NoneType' object has no attribute 'items'
  ```
  Both were weekend runs. Weekend mode skips FMP → `raw["kpis"]` is `None` → crash.
- `BRENTOIL` on Hyperliquid lives on the **xyz spot deployment** (`xyz:BRENTOIL`), not the perpetuals universe. Current code only queries `metaAndAssetCtxs` (perps), so it silently fails on every run.

## Scope

### A. Weekend KPI None guard (blocker)
`scripts/merge-raw-into-data.py`:
- `enhance_kpi_notes()` at line 153: if `raw_kpis` is falsy, return `None` (or the existing KPI dict) so the caller can carry forward dashboard-data.js values.
- `main()` at line 1261: when `enhance_kpi_notes()` returns `None`/empty, leave `data["kpis"]` untouched.

### B. Historical-mode backfill for Day 50 + 51
Add `--historical-date YYYY-MM-DD` to `scripts/collect-data.py`. When set:
- **FMP**: loop tickers calling `/api/v3/historical-price-full/{ticker}?from=<date>&to=<date>`. For weekend dates, carry forward the nearest prior trading day close.
- **Polymarket**: use CLOB `/prices-history?market={token_id}&startTs=<ms>&endTs=<ms>&fidelity=60` to fetch the end-of-day snapshot for each Iran-related market.
- **Hyperliquid**: `candleSnapshot` with `coin="xyz:BRENTOIL"`, `interval="1d"`, `startTime`/`endTime` bracketing the target date.
- **Sonar prompts**: already parameterized via `day_date`; no change.

Scope confirmed: only Day 50 and Day 51 get backfilled. Day 49 already ran with real same-day data.

### C. Hyperliquid xyz:BRENTOIL fix (live mode too)
`fetch_hyperliquid_brentoil()` in `scripts/collect-data.py`:
- Query `spotMetaAndAssetCtxs` (or whichever endpoint exposes the xyz deployer's assets) and resolve `xyz:BRENTOIL`'s mark/OI/volume.
- Keep perp fallback logic in case the asset migrates.

### D. Schedule change
`.github/workflows/daily-update.yml`:
- Change cron from `'30 12 * * *'` (20:30 HKT) to `'0 10 * * *'` (18:00 HKT = 6pm Macau).
- Update the comment above the cron line.

### E. Backfill runs
After A + B + C land on master:
1. Trigger `workflow_dispatch` with `day_override=50` and an input flag that runs historical mode. Verify commit lands.
2. Repeat for `day_override=51`.
3. Pull origin locally to sync.

## Non-goals
- Tonight's Day 52 run is already expected to fire (the user will keep the current 20:30 HKT slot for tonight, since the schedule edit applies from tomorrow onward — GitHub Actions cron changes take effect after the next merge).
- No refactor of the merge/update pipeline beyond the None guard.
- No change to dashboard HTML/JS.

## Risk / rollback
- All changes are script-level. Revert via git if backfills produce wrong output.
- Historical endpoints may have rate limits; add simple retry backoff (already present in `http_get`).
- If xyz:BRENTOIL query fails, leave the existing "not found" warning path — dashboard gracefully carries prior value.
