#!/usr/bin/env python3
"""
backfill-chart-gaps.py — Insert missing weekend dates into chartData arrays.

The daily pipeline only appends a chartData.labels entry on weekdays (FMP
data unavailable on weekends), but the calendar clock keeps moving. As a
result, labels has fewer entries than the actual day count: e.g., D61 with
58 entries means 3 missing weekend dates.

Stats models (regime detection, Bayesian) read from labels.length and
display "n=58" instead of "n=61". Charts visually appear "behind" by the
gap count.

This script:
  1. Reads chartData.labels, finds gaps in the Feb 28 -> today sequence.
  2. For each missing day, forward-fills entries into labels + the 5
     aligned price/score arrays (brent, vix, hyg, sp500, taco) at the
     correct position.
  3. Validates JS and writes back. Backup: dashboard-data.js.bak5.

Limitations:
  - Only handles the 6 main chartData arrays. strikeLabels/strikes/hormuz
    chart arrays may have their own historical baselines and are NOT
    touched.
  - Forward-fill uses the previous day's closing value (reasonable for
    weekend gaps where markets are closed).

Usage:
  python scripts/backfill-chart-gaps.py --dry-run
  python scripts/backfill-chart-gaps.py
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

DAY_1 = date(2026, 2, 28)
REPO = Path(__file__).resolve().parent.parent
DATA_JS = REPO / "js" / "dashboard-data.js"

ARRAYS_TO_FILL = ("labels", "brent", "vix", "hyg", "sp500", "taco")


def date_to_label(d):
    return f"{d.strftime('%b')} {d.day}"


def parse_array(text, key):
    """Return (start, end, list of items as strings) for `<key>: [ ... ]`."""
    m = re.search(rf"^(\s*){re.escape(key)}:\s*\[(.*?)\]", text, re.M | re.S)
    if not m:
        return None
    contents = m.group(2)
    items = [x.strip() for x in contents.split(",") if x.strip()]
    return m.start(2) - 1, m.end(2) + 1, items  # bracket positions


def reconstruct_array(items, key):
    """Rebuild `<key>: [item1, item2, ...]` array contents."""
    if key == "labels":
        # quoted strings
        return "[" + ", ".join(f"'{x.strip(chr(39)).strip(chr(34))}'" if not x.startswith("'") else x for x in items) + "]"
    return "[" + ", ".join(items) + "]"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    text = DATA_JS.read_text(encoding="utf-8")

    # Parse current labels
    parsed = parse_array(text, "labels")
    if parsed is None:
        print("ERROR: chartData.labels not found")
        sys.exit(1)
    _, _, label_items = parsed
    label_strs = [x.strip("'\"") for x in label_items]
    print(f"Current labels: {len(label_strs)} entries, last: {label_strs[-1]}")

    # Build expected calendar from D1 to today (last label)
    last_label_str = label_strs[-1]
    # parse last_label_str like "Apr 29"
    months = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
              "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}
    parts = last_label_str.split()
    last_date = date(2026, months[parts[0]], int(parts[1]))
    print(f"Last label parsed as: {last_date.isoformat()}")

    expected = []
    d = DAY_1
    while d <= last_date:
        expected.append(date_to_label(d))
        d += timedelta(days=1)

    missing = [(i, lbl) for i, lbl in enumerate(expected) if lbl not in label_strs]
    if not missing:
        print("No gaps detected. Nothing to backfill.")
        return
    print(f"Missing dates: {[m[1] for m in missing]}")

    # For each array, parse current values
    arrays = {}
    for key in ARRAYS_TO_FILL:
        p = parse_array(text, key)
        if p is None:
            print(f"WARN: array '{key}' not found, skipping")
            continue
        arrays[key] = list(p[2])  # list of string items
    if "labels" not in arrays:
        print("ERROR: labels array required")
        sys.exit(1)

    # Sanity: all arrays should have same length as labels
    n_labels = len(arrays["labels"])
    for k, v in arrays.items():
        if len(v) != n_labels:
            print(f"WARN: array '{k}' has {len(v)} entries, labels has {n_labels} — skipping")
            del arrays[k]
    print(f"Aligned arrays: {list(arrays.keys())}")

    # Insert missing entries with forward-fill
    # Build a label-to-original-index map
    label_to_orig = {x.strip("'\""): i for i, x in enumerate(arrays["labels"])}
    # Walk expected dates in order, building the new aligned arrays
    new_arrays = {k: [] for k in arrays}
    last_known = {k: None for k in arrays}
    for exp_lbl in expected:
        if exp_lbl in label_to_orig:
            idx = label_to_orig[exp_lbl]
            for k in new_arrays:
                v = arrays[k][idx]
                new_arrays[k].append(v)
                last_known[k] = v
        else:
            # Forward-fill from last known
            for k in new_arrays:
                if k == "labels":
                    new_arrays[k].append(f"'{exp_lbl}'")
                    last_known[k] = f"'{exp_lbl}'"
                else:
                    fill = last_known[k] if last_known[k] is not None else "0"
                    new_arrays[k].append(fill)

    print(f"\nNew array lengths: " + ", ".join(f"{k}={len(v)}" for k, v in new_arrays.items()))

    # Replace arrays in text
    new_text = text
    for k in new_arrays:
        new_contents = ", ".join(new_arrays[k])
        # Replace using same regex as parser to find the exact array
        pattern = re.compile(rf"(^\s*{re.escape(k)}:\s*)\[.*?\]", re.M | re.S)
        replacement = rf"\g<1>[{new_contents}]"
        new_text, n = pattern.subn(replacement, new_text, count=1)
        if n == 0:
            print(f"ERROR: failed to replace {k}")
            sys.exit(1)

    if args.dry_run:
        print("\n[DRY-RUN] No file writes.")
        for lbl in [m[1] for m in missing]:
            idx = expected.index(lbl)
            preview = {k: new_arrays[k][idx] for k in new_arrays}
            print(f"  Would insert {lbl}: {preview}")
        return

    backup = DATA_JS.with_suffix(".js.bak5")
    shutil.copy2(DATA_JS, backup)
    print(f"\nBackup: {backup.name}")
    DATA_JS.write_text(new_text, encoding="utf-8")
    print(f"Wrote {DATA_JS}")

    print("Validating JS syntax...")
    result = subprocess.run(["node", "--check", str(DATA_JS)], capture_output=True, text=True)
    if result.returncode != 0:
        print("[ERROR] JS syntax invalid! Restoring backup.")
        print(result.stderr)
        shutil.copy2(backup, DATA_JS)
        sys.exit(1)
    print("OK — JS valid.\n")
    print(f"Filled {len(missing)} gap(s). Stats models should now show n={len(expected)}.")


if __name__ == "__main__":
    main()
