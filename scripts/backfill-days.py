#!/usr/bin/env python3
"""
backfill-days.py — Re-fetch historical data for a range of past days.

Tacqueria's daily pipeline overlooks past data when a day is skipped or a
section was never being merged. This script loops a day range and re-runs the
historical-mode collectors (FMP, Polymarket CLOB, Hyperliquid candleSnapshot)
to produce per-day raw data files. Sonar prose collectors do NOT support a
historical mode — those sections cannot be backfilled and are skipped.

Output: scripts/day-{N}-raw-backfill.json per day. These files are NOT applied
to js/dashboard-data.js automatically — apply step is a separate script (TBD)
because rewinding meta.day or the current-state fields would break the live
dashboard. Use this script first to confirm we can fetch the data, then build
a targeted apply step for the array sections that need it.

Usage:
    python scripts/backfill-days.py --start 43 --end 60
    python scripts/backfill-days.py --start 50 --end 51   # just weekends
    python scripts/backfill-days.py --day 55              # single day
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

DAY_1_DATE = datetime(2026, 2, 28)  # Operation start
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_DIR = SCRIPT_DIR.parent
COLLECT_SCRIPT = SCRIPT_DIR / "collect-data.py"


def day_to_date(day_num: int) -> datetime:
    return DAY_1_DATE + timedelta(days=day_num - 1)


def backfill_one_day(day: int) -> tuple:
    """Run collect-data.py in historical mode for a single day.

    Returns (success, output_path, error_message).
    """
    date = day_to_date(day)
    date_str = date.strftime("%Y-%m-%d")
    print(f"\n=== Day {day} ({date_str}, {date.strftime('%a')}) ===")

    # collect-data.py writes to scripts/day-{N}-raw.json by default.
    # We rename it after to avoid clobbering the daily pipeline output.
    raw_path = SCRIPT_DIR / f"day-{day}-raw.json"
    backup_path = SCRIPT_DIR / f"day-{day}-raw.live-backup.json"
    backfill_path = SCRIPT_DIR / f"day-{day}-raw-backfill.json"

    # Preserve any existing live raw file before clobbering
    moved_live = False
    if raw_path.exists() and not backfill_path.exists():
        raw_path.rename(backup_path)
        moved_live = True
        print(f"  [PRESERVE] Moved live raw to {backup_path.name}")

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(COLLECT_SCRIPT),
                "--day",
                str(day),
                "--historical",
            ],
            cwd=REPO_DIR,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        # Restore live raw if we moved it
        if moved_live and backup_path.exists():
            backup_path.rename(raw_path)
        return False, None, "timeout"

    # Print the collector's stdout (lossy summary — full output in stderr if needed)
    if result.stdout:
        for line in result.stdout.splitlines()[-30:]:
            print(f"  {line}")

    if result.returncode != 0:
        print(f"  [ERROR] collect-data exited {result.returncode}")
        if result.stderr:
            print(f"  stderr (tail): {result.stderr[-500:]}")
        if moved_live and backup_path.exists():
            backup_path.rename(raw_path)
        return False, None, f"exit code {result.returncode}"

    # Move the produced raw to a backfill-specific name
    if raw_path.exists():
        raw_path.rename(backfill_path)
        print(f"  [SAVED] {backfill_path.name}")

    # Restore live raw
    if moved_live and backup_path.exists():
        backup_path.rename(raw_path)

    return True, backfill_path, None


def main():
    parser = argparse.ArgumentParser(description="Backfill historical data for past days")
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument("--day", type=int, help="Single day to backfill")
    g.add_argument("--start", type=int, help="First day in range (inclusive)")
    parser.add_argument("--end", type=int, help="Last day in range (inclusive); required with --start")
    args = parser.parse_args()

    if args.day is not None:
        days = [args.day]
    else:
        if args.end is None:
            parser.error("--end required when using --start")
        if args.end < args.start:
            parser.error("--end must be >= --start")
        days = list(range(args.start, args.end + 1))

    print(f"Backfill plan: {len(days)} day(s) — {days[0]}..{days[-1]}")
    print(f"Note: Sonar prose sections (intelligence, rhetoric, fed, dubai) CANNOT be backfilled.")
    print(f"Note: Backfill only retrieves FMP, Polymarket, Hyperliquid (the historical-capable sources).")
    print(f"Note: This script ONLY collects. Apply-to-dashboard is a separate manual step.\n")

    succeeded = []
    failed = []
    for d in days:
        ok, path, err = backfill_one_day(d)
        if ok:
            succeeded.append((d, path))
        else:
            failed.append((d, err))

    print("\n" + "=" * 60)
    print(f"Backfill complete: {len(succeeded)}/{len(days)} succeeded")
    if succeeded:
        print("\nSucceeded:")
        for d, p in succeeded:
            print(f"  Day {d}: {p.name if p else '(no path)'}")
    if failed:
        print("\nFailed:")
        for d, err in failed:
            print(f"  Day {d}: {err}")
    print("\nNext step: review the *-raw-backfill.json files, then build/run an")
    print("apply script that merges the historical chart-array entries into")
    print("js/dashboard-data.js without touching meta.day or current-state fields.")


if __name__ == "__main__":
    main()
