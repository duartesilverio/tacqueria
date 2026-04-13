#!/usr/bin/env python3
"""
Tacqueria HTML Updater — Patches the 4 hardcoded sections in index.html.

Sections that still require HTML editing (not data-driven):
  1. Triggers tab rows (15 triggers)
  2. Scenarios tab (decision tree, path matrix)
  3. TACO Analytics hardcoded elements (momentum KPIs, regime flags, chart headers)
  4. Stat Model n-count banner

Usage:
  python scripts/update-html.py html-input.json [--dry-run]

Input JSON format: see scripts/input-schema.md
"""

import json
import sys
import re
import os
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
HTML_FILE = os.path.join(PROJECT_DIR, "index.html")


def load_input(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_html(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def replace_between_markers(text, start_marker, end_marker, new_content):
    """Replace content between two HTML comment markers."""
    pattern = re.compile(
        rf'({re.escape(start_marker)})(.*?)({re.escape(end_marker)})',
        re.DOTALL
    )
    match = pattern.search(text)
    if not match:
        raise ValueError(f"Could not find markers: {start_marker} ... {end_marker}")
    return text[:match.start()] + match.group(1) + '\n' + new_content + '\n' + match.group(3) + text[match.end():]


def replace_by_id(text, element_id, new_inner_html):
    """Replace the innerHTML of an element by its id."""
    # Match: id="element_id">...< (greedy but bounded)
    pattern = rf'(id="{re.escape(element_id)}"[^>]*>)(.*?)(</)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return text[:match.start()] + match.group(1) + new_inner_html + match.group(3) + text[match.end():]
    return text


def replace_text_content(text, pattern_str, replacement):
    """Replace text matching a regex pattern."""
    return re.sub(pattern_str, replacement, text, count=1)


# ── STAT MODEL BANNER ────────────────────────────────────────────────────────

def update_stat_banner(text, day_num):
    """Update the stat model n-count banner with current day number."""
    n = day_num
    x = 30 - n  # days to reach 30 observations
    y = 60 - n  # days to reach 60 for GARCH
    
    # Update n=XX in banner-n-count span
    text = re.sub(
        r'(<span id="banner-n-count">)n=\d+(</span>)',
        rf'\g<1>n={n}\2',
        text
    )
    
    # Update n=XX in banner-n-display div
    text = re.sub(
        r'(<div id="banner-n-display"[^>]*>)n=\d+(</div>)',
        rf'\g<1>n={n}\2',
        text
    )
    
    # Update the "n=XX days only" note
    text = re.sub(
        r'n=\d+ days only\.',
        f'n={n} days only.',
        text
    )
    
    # Update "Six models applied to n=XX daily observations"
    text = re.sub(
        r'Six models applied to <span id="banner-n-count">n=\d+</span> daily observations',
        f'Six models applied to <span id="banner-n-count">n={n}</span> daily observations',
        text
    )
    
    # Update n=XX / days display
    text = re.sub(
        r'n=\d+ / days',
        f'n={n} / days',
        text
    )
    
    # Update days remaining note
    if x > 0:
        days_30_text = f"{x} more days of conflict data to reach 30 observations (the baseline for most models)"
    else:
        days_30_text = "30-observation threshold has been met for most models"
    
    if y > 0:
        days_60_text = f"{y} more days for GARCH to reach 60"
    else:
        days_60_text = "GARCH 60-observation threshold has also been met"
    
    # Replace the days remaining text (various formats it could be in)
    text = re.sub(
        r'minimum \d+ more days of conflict data to reach 30 observations.*?and \d+ more days for GARCH to reach 60',
        f'minimum {days_30_text}, and {days_60_text}',
        text,
        flags=re.DOTALL
    )
    
    # Also update generic n=XX references in analysis text
    text = re.sub(r'Caution: n=\d+ only', f'Caution: n={n} only', text)
    text = re.sub(r'n=\d+ provides INSUFFICIENT DATA', f'n={n} provides INSUFFICIENT DATA', text)
    text = re.sub(r'spurious \+slope due to n=\d+', f'spurious +slope due to n={n}', text)
    # Base case anchored line is too dynamic — skip, handled by htmlPatches if needed
    
    print(f"  ✓ Stat banner: n={n}, X={x}, Y={y}")
    return text


# ── CHART HEADERS ─────────────────────────────────────────────────────────────

def update_chart_headers(text, day_num):
    """Update 'Day 1→N' in chart titles (handles both → and &rarr;)."""
    text = re.sub(r'Day 1(?:→|&rarr;)\d+', f'Day 1&rarr;{day_num}', text)
    print(f"  ✓ Chart headers: Day 1→{day_num}")
    return text


# ── TACO SCORE TEXT ───────────────────────────────────────────────────────────

def update_taco_gauge(text, score):
    """Update the TACO gauge SVG score text."""
    text = re.sub(
        r'(<text[^>]*id="tacoScoreText"[^>]*>)\d+(</text>)',
        rf'\g<1>{score}\2',
        text
    )
    print(f"  ✓ TACO gauge: {score}")
    return text


# ── SCENARIOS TAB ─────────────────────────────────────────────────────────────

def update_scenarios_day(text, day_num, date_str):
    """Update day references in Scenarios tab."""
    # "War Scenario Model — DXX Decision Tree" (handles both — and &mdash;)
    text = re.sub(
        r'War Scenario Model (?:—|&mdash;) D\d+ Decision Tree',
        f'War Scenario Model &mdash; D{day_num} Decision Tree',
        text
    )
    
    # "ANALYTICAL ASSESSMENT · DXX · DATE" (handles both · and &middot;)
    text = re.sub(
        r'ANALYTICAL ASSESSMENT (?:·|&middot;) D\d+ (?:·|&middot;) \d+ [A-Z]+ \d{4}',
        f'ANALYTICAL ASSESSMENT &middot; D{day_num} &middot; {date_str}',
        text
    )
    
    # "Analytical · n=XX · Date" (handles both · and &middot;)
    text = re.sub(
        r'Analytical (?:·|&middot;) n=\d+',
        f'Analytical &middot; n={day_num}',
        text
    )
    
    print(f"  ✓ Scenarios: D{day_num}")
    return text


# ── TACO ANALYTICS MOMENTUM KPI ROW ──────────────────────────────────────────

def update_momentum_kpis(text, inp):
    """Update the 4 momentum KPI cards in TACO Analytics."""
    kpis = inp.get('tacoMomentumKpis')
    if not kpis:
        return text
    
    # These are identified by their content/structure rather than IDs
    # We update specific known patterns
    
    if 'momentum_value' in kpis:
        # "−1.0" or similar delta value in momentum card
        text = re.sub(
            r'(<div class="kpi-value[^"]*"[^>]*>)([^<]*)(</div>\s*<div class="kpi-label[^"]*"[^>]*>Momentum)',
            rf'\g<1>{kpis["momentum_value"]}\3',
            text,
            flags=re.DOTALL
        )
    
    if 'momentum_note' in kpis:
        # Update the kpi-note under Momentum
        pass  # Too fragile to regex — handled by direct HTML input
    
    print(f"  ✓ Momentum KPIs updated")
    return text


# ── REGIME FLAGS ──────────────────────────────────────────────────────────────

def update_regime_flags_badge(text, triggered, total=7):
    """Update the regime flags badge count."""
    text = re.sub(
        r'\d+ of 7 TRIGGERED',
        f'{triggered} of {total} TRIGGERED',
        text
    )
    print(f"  ✓ Regime flags: {triggered} of {total}")
    return text


# ── TACO INPUTS BADGE ─────────────────────────────────────────────────────────

def update_taco_inputs_badge(text, score, day_num):
    """Update COMPOSITE: X/100 · DNN badge (handles both · and &middot;)."""
    text = re.sub(
        r'COMPOSITE: \d+/100 (?:·|&middot;) D\d+',
        f'COMPOSITE: {score}/100 &middot; D{day_num}',
        text
    )
    print(f"  ✓ TACO inputs badge: {score}/100 · D{day_num}")
    return text


# ── TACO PRECEDENT CARD ──────────────────────────────────────────────────────

def update_taco_precedent(text, day_num):
    """Update 'Day NN' in TACO BROKEN precedent card."""
    text = re.sub(
        r'(TACO BROKEN[^<]*Day )\d+',
        rf'\g<1>{day_num}',
        text
    )
    return text


# ── TRIGGERS TAB ──────────────────────────────────────────────────────────────

def update_triggers_badge(text, escalation_count, amber_count):
    """Update the triggers badge."""
    text = re.sub(
        r'\d+ ESCALATION · \d+ AMBER',
        f'{escalation_count} ESCALATION · {amber_count} AMBER',
        text
    )
    print(f"  ✓ Triggers badge: {escalation_count} ESCALATION · {amber_count} AMBER")
    return text


# ── DIRECT HTML PATCHES ───────────────────────────────────────────────────────

def apply_html_patches(text, patches):
    """
    Apply a list of direct regex patches to the HTML.
    Each patch is: { "find": "regex pattern", "replace": "replacement" }
    This is the escape hatch for complex/unique HTML edits.
    """
    for patch in patches:
        find = patch['find']
        replace = patch['replace']
        flags = re.DOTALL if patch.get('dotall', False) else 0
        new_text = re.sub(find, replace, text, count=1, flags=flags)
        if new_text != text:
            print(f"  ✓ Patch applied: {find[:60]}...")
            text = new_text
        else:
            print(f"  ✗ Patch not matched: {find[:60]}...")
    return text


# ── MAIN ──────────────────────────────────────────────────────────────────────

def patch_html(text, inp):
    """Apply all patches from input JSON to the HTML text."""
    
    day_num = inp['day']
    taco_score = inp.get('tacoScore', 2)
    
    # 1. Stat Model Banner
    text = update_stat_banner(text, day_num)
    
    # 2. Chart Headers
    text = update_chart_headers(text, day_num)
    
    # 3. TACO Gauge Score
    text = update_taco_gauge(text, taco_score)
    
    # 4. Scenarios Tab Day
    if 'scenariosDate' in inp:
        text = update_scenarios_day(text, day_num, inp['scenariosDate'])
    
    # 5. TACO Inputs Badge
    text = update_taco_inputs_badge(text, taco_score, day_num)
    
    # 6. TACO Precedent Card
    text = update_taco_precedent(text, day_num)
    
    # 7. Triggers Badge
    if 'triggersEscalation' in inp and 'triggersAmber' in inp:
        text = update_triggers_badge(text, inp['triggersEscalation'], inp['triggersAmber'])
    
    # 8. Regime Flags Badge
    if 'regimeFlagsTriggered' in inp:
        text = update_regime_flags_badge(text, inp['regimeFlagsTriggered'])
    
    # 9. Direct HTML patches (escape hatch for complex edits)
    if 'htmlPatches' in inp:
        text = apply_html_patches(text, inp['htmlPatches'])
    
    return text


def main():
    if len(sys.argv) < 2:
        print("Usage: python update-html.py <html-input.json> [--dry-run]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    print(f"Loading input from {input_path}...")
    inp = load_input(input_path)
    
    print(f"Loading index.html...")
    text = load_html(HTML_FILE)
    original_len = len(text.split('\n'))
    
    print("Applying HTML patches...")
    text = patch_html(text, inp)
    new_len = len(text.split('\n'))
    
    if dry_run:
        print(f"\n[DRY RUN] Would write {new_len} lines (was {original_len})")
        dry_path = HTML_FILE + '.preview'
        with open(dry_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Preview written to {dry_path}")
    else:
        backup_path = HTML_FILE + '.bak'
        shutil.copy2(HTML_FILE, backup_path)
        print(f"Backup saved to {backup_path}")
        
        with open(HTML_FILE, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n✓ HTML updated: {new_len} lines (was {original_len})")


if __name__ == '__main__':
    main()
