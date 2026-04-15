#!/usr/bin/env python3
"""
Tacqueria Dashboard Updater — Patches dashboard-data.js from a small JSON input.

Instead of having an LLM read and rewrite the entire 1,387-line file,
this script takes a compact JSON input and surgically patches only the
sections that changed.

Usage:
  python scripts/update-dashboard.py input.json [--dry-run]

Input JSON format: see scripts/input-schema.md
Output: writes updated dashboard-data.js in place (backs up to .bak first)
"""

import json
import sys
import re
import os
import shutil
from datetime import datetime, timedelta

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(PROJECT_DIR, "js", "dashboard-data.js")

def load_input(path):
    """Load the input JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_dashboard_data(path):
    """Load dashboard-data.js and return the raw text."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_js_object(text):
    """
    Extract the DASHBOARD_DATA object from the JS file as text.
    Returns (preamble, object_text, postamble).
    """
    # Find the start of the object
    match = re.search(r'^const DASHBOARD_DATA = \{', text, re.MULTILINE)
    if not match:
        raise ValueError("Could not find DASHBOARD_DATA object in file")
    
    start = match.start()
    preamble = text[:start]
    
    # Find the matching closing brace by counting braces
    brace_count = 0
    obj_start = text.index('{', start)
    for i in range(obj_start, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                obj_end = i + 1
                break
    
    # Find the semicolon after the closing brace
    semi = text.index(';', obj_end)
    
    object_text = text[start:semi+1]
    postamble = text[semi+1:]
    
    return preamble, object_text, postamble


def replace_section(text, section_key, new_value_js):
    """
    Replace a top-level section in the DASHBOARD_DATA object.
    Finds '  section_key: {' or '  section_key: [' and replaces until
    the matching close.
    """
    # Pattern to find the section start (top-level property)
    # Match:  meta: {  or  kpis: {  or  marketStrip: [
    patterns = [
        # Object value
        rf'(\n  {re.escape(section_key)}: )\{{',
        # Array value
        rf'(\n  {re.escape(section_key)}: )\[',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            prefix = match.group(1)
            value_start = match.start() + len(prefix)
            open_char = text[value_start]
            close_char = '}' if open_char == '{' else ']'
            
            # Find matching close
            depth = 0
            for i in range(value_start, len(text)):
                if text[i] == open_char:
                    depth += 1
                elif text[i] == close_char:
                    depth -= 1
                    if depth == 0:
                        value_end = i + 1
                        break
            
            # Replace
            return text[:match.start()] + prefix + new_value_js + text[value_end:]
    
    raise ValueError(f"Could not find section '{section_key}' in dashboard data")


def js_string(s):
    """Escape a string for JS single-quoted string literal."""
    if s is None:
        return 'null'
    s = str(s)
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\n', '\\n')
    return f"'{s}'"


def to_js_value(val, indent=4):
    """Convert a Python value to a JS literal string with proper formatting."""
    if val is None:
        return 'null'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        return js_string(val)
    if isinstance(val, list):
        return to_js_array(val, indent)
    if isinstance(val, dict):
        return to_js_object(val, indent)
    return str(val)


def to_js_object(obj, indent=4):
    """Convert a Python dict to a JS object literal string."""
    if not obj:
        return '{}'
    
    pad = ' ' * indent
    inner_pad = ' ' * (indent + 2)
    
    lines = ['{']
    items = list(obj.items())
    for i, (key, val) in enumerate(items):
        # Key doesn't need quotes if it's a valid JS identifier
        if re.match(r'^[a-zA-Z_$][a-zA-Z0-9_$]*$', str(key)):
            key_str = str(key)
        else:
            key_str = js_string(str(key))
        
        val_str = to_js_value(val, indent + 2)
        comma = ',' if i < len(items) - 1 else ''
        lines.append(f'{inner_pad}{key_str}: {val_str}{comma}')
    
    lines.append(f'{pad}}}')
    return '\n'.join(lines)


def to_js_array(arr, indent=4):
    """Convert a Python list to a JS array literal string."""
    if not arr:
        return '[]'
    
    # For simple arrays (numbers, strings), use compact format
    if all(isinstance(x, (int, float)) for x in arr):
        return '[' + ', '.join(str(x) for x in arr) + ']'
    
    if all(isinstance(x, str) for x in arr):
        return '[' + ', '.join(js_string(x) for x in arr) + ']'
    
    # For arrays of objects, use multi-line format
    pad = ' ' * indent
    inner_pad = ' ' * (indent + 2)
    
    lines = ['[']
    for i, item in enumerate(arr):
        val_str = to_js_value(item, indent + 2)
        comma = ',' if i < len(arr) - 1 else ''
        # If it's a multi-line value, indent properly
        if '\n' in val_str:
            lines.append(f'{inner_pad}{val_str}{comma}')
        else:
            lines.append(f'{inner_pad}{val_str}{comma}')
    
    lines.append(f'{pad}]')
    return '\n'.join(lines)


def append_to_array(text, section_path, new_values):
    """
    Append values to an existing array in the JS text.
    section_path is like 'chartData.labels' or 'chartData.brent'
    new_values is a list of values to append.
    """
    parts = section_path.split('.')
    
    # Build regex to find the array
    if len(parts) == 1:
        pattern = rf'(\n    {re.escape(parts[0])}: \[)(.*?)(\])'
    elif len(parts) == 2:
        # Find the parent section first, then the child array within it
        # This is more complex - we need to find within context
        parent = parts[0]
        child = parts[1]
        
        # Find parent section
        parent_match = re.search(rf'\n  {re.escape(parent)}: \{{', text)
        if not parent_match:
            raise ValueError(f"Could not find parent section '{parent}'")
        
        # Search within parent for child array
        search_start = parent_match.end()
        child_pattern = rf'(\n      {re.escape(child)}: \[)(.*?)(\])'
        child_match = re.search(child_pattern, text[search_start:], re.DOTALL)
        
        if not child_match:
            # Try with different indent
            child_pattern = rf'(\n    {re.escape(child)}: \[)(.*?)(\])'
            child_match = re.search(child_pattern, text[search_start:], re.DOTALL)
        
        if not child_match:
            raise ValueError(f"Could not find array '{child}' in section '{parent}'")
        
        actual_start = search_start + child_match.start()
        actual_end = search_start + child_match.end()
        
        existing_array = child_match.group(2)
        prefix = child_match.group(1)
        
        # Append new values
        new_items = ', '.join(to_js_value(v) for v in new_values)
        new_array = existing_array.rstrip() + ', ' + new_items
        
        return text[:actual_start] + prefix + new_array + ']' + text[actual_end:]
    
    raise ValueError(f"Unsupported section path depth: {section_path}")


def update_meta(text, inp):
    """Update the meta section."""
    meta = inp.get('meta')
    if not meta:
        return text
    
    # Find and replace individual meta fields
    for key, val in meta.items():
        if isinstance(val, str):
            pattern = rf'({re.escape(key)}: )"[^"]*"'
            replacement = rf'\g<1>"{val}"'
            new_text = re.sub(pattern, replacement, text, count=1)
            if new_text == text:
                # Try single quotes
                pattern = rf'({re.escape(key)}: )\'[^\']*\''
                replacement = rf'\g<1>"{val}"'
                new_text = re.sub(pattern, replacement, text, count=1)
            text = new_text
        elif isinstance(val, (int, float)):
            pattern = rf'({re.escape(key)}: )\d+\.?\d*'
            replacement = rf'\g<1>{val}'
            text = re.sub(pattern, replacement, text, count=1)
    
    return text


def update_kpi(text, kpi_key, kpi_data):
    """Update a single KPI entry."""
    # Find the KPI line
    pattern = rf'({re.escape(kpi_key)}:\s*\{{)(.*?)(\}})'
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text
    
    existing = match.group(2)
    
    # Update individual fields within the KPI
    for field, val in kpi_data.items():
        if isinstance(val, str):
            field_pattern = rf'({re.escape(field)}: )"((?:[^"\\]|\\.)*)"'
            field_replacement = rf'\g<1>"{val}"'
            new_existing = re.sub(field_pattern, field_replacement, existing, count=1)
            existing = new_existing
        elif isinstance(val, (int, float)):
            field_pattern = rf'({re.escape(field)}: )-?\d+\.?\d*'
            field_replacement = rf'\g<1>{val}'
            new_existing = re.sub(field_pattern, field_replacement, existing, count=1)
            existing = new_existing
        elif isinstance(val, bool):
            field_pattern = rf'({re.escape(field)}: )(true|false)'
            field_replacement = rf'\g<1>{"true" if val else "false"}'
            new_existing = re.sub(field_pattern, field_replacement, existing, count=1)
            existing = new_existing
    
    return text[:match.start()] + match.group(1) + existing + match.group(3) + text[match.end():]


def normalize_kpi_data(kpi_data):
    """Normalize KPI values: strip $ and + signs, convert numeric strings to numbers."""
    result = {}
    numeric_fields = ['price', 'change', 'changePct', 'prevClose']
    for key, val in kpi_data.items():
        if key in numeric_fields and isinstance(val, str):
            # Strip $, +, %, commas and convert to number
            cleaned = val.replace('$', '').replace('+', '').replace('%', '').replace(',', '').strip()
            try:
                result[key] = float(cleaned)
            except ValueError:
                result[key] = val  # Keep original if can't parse
        else:
            result[key] = val
    return result


def append_to_nested_array(text, parent_key, child_key, value):
    """Append a value to a nested array like strikes.us or etfs.ITA within chartData."""
    # Find the pattern: child_key: [values...]
    # We need to be within the parent_key context
    pattern = rf'({re.escape(child_key)}:\s*\[)([^\]]*)(\])'
    
    matches = list(re.finditer(pattern, text))
    if not matches:
        raise ValueError(f"Could not find {parent_key}.{child_key} array")
    
    # Find the match that's within the chartData section
    chart_start = text.find('chartData:')
    if chart_start < 0:
        raise ValueError("chartData section not found")
    
    best_match = None
    for m in matches:
        if m.start() > chart_start:
            # Check it's within the parent context
            preceding = text[max(chart_start, m.start() - 200):m.start()]
            if parent_key in preceding:
                best_match = m
                break
    
    if not best_match:
        raise ValueError(f"Could not find {parent_key}.{child_key} within chartData")
    
    existing = best_match.group(2).rstrip().rstrip(',')
    if isinstance(value, str):
        new_val = f"'{value}'"
    else:
        new_val = str(value)
    
    new_content = existing + ', ' + new_val if existing.strip() else new_val
    return text[:best_match.start()] + best_match.group(1) + new_content + best_match.group(3) + text[best_match.end():]


def append_to_etf_prices(text, etf_name, value):
    """Append a value to etfs.{ETF_NAME}.prices array (e.g., etfs.ITA.prices)."""
    pattern = rf'({re.escape(etf_name)}:\s*\{{\s*prices:\s*\[)([^\]]*?)(\])'
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"Could not find etfs.{etf_name}.prices array")
    existing = match.group(2).rstrip().rstrip(',')
    new_content = existing + ', ' + str(value) if existing.strip() else str(value)
    return text[:match.start()] + match.group(1) + new_content + match.group(3) + text[match.end():]


def find_section_end(text, section_key):
    """Find the position of the closing brace/bracket of a section."""
    pattern = rf'{re.escape(section_key)}:\s*([\{{\[])'
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"Section {section_key} not found")
    
    open_char = match.group(1)
    close_char = '}' if open_char == '{' else ']'
    depth = 1
    i = match.end()
    while i < len(text) and depth > 0:
        if text[i] == open_char:
            depth += 1
        elif text[i] == close_char:
            depth -= 1
        i += 1
    return i - 1  # Position of the closing brace/bracket


def patch_dashboard(text, inp):
    """Apply all patches from input JSON to the dashboard text."""
    
    # 1. META — patch individual fields
    if 'meta' in inp:
        text = update_meta(text, inp)
    
    # 2. KPIs — patch individual instrument fields
    if 'kpis' in inp:
        for kpi_key, kpi_data in inp['kpis'].items():
            # Normalize string values to numbers where needed
            kpi_data = normalize_kpi_data(kpi_data)
            text = update_kpi(text, kpi_key, kpi_data)
    
    # 3. FULL SECTION REPLACEMENTS — for sections provided in full
    full_replace_sections = [
        'marketStrip', 'tacoSubScoresOverview', 'predictionMarkets',
        'tacoInputs', 'tacoAnalytics', 'tacoConfig',
        'overviewPredMktCards', 'dubaiWatch', 'pipelineBypass',
        'houthiRedSea', 'iranAttacksUAE', 'iranAttacksNeighbors',
        'gistBanner', 'newsNow', 'analyticalSignals', 'dLive',
        'analyticalOutlook', 'keyTriggers', 'intelligence',
        'next48h', 'rhetoricTracker', 'marketSignals', 'operations',
        'predictionAnalytics', 'arsenal', 'inflation', 'troopCounter', 'hyperliquid'
    ]
    
    for section in full_replace_sections:
        if section in inp:
            new_js = to_js_value(inp[section], 2)
            try:
                text = replace_section(text, section, new_js)
                print(f"  ✓ Replaced section: {section}")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
    
    # 4. CHART DATA — merge, don't destroy
    # Strategy: If both chartAppend and chartData exist, MERGE chartData into
    # existing section (only replacing PM sub-arrays), then append new values.
    # If only chartData exists, do PARTIAL replacement (only keys present in input).
    # NEVER do a full chartData replacement — it destroys core time series.
    
    if 'chartData' in inp:
        # Partial replacement: only replace sub-keys that exist in input
        cd_input = inp['chartData']
        for sub_key in cd_input:
            # Try to replace existing sub-key using direct regex
            pattern = rf'({re.escape(sub_key)}:\s*)'
            # Check if sub_key exists within chartData section
            cd_start = text.find('chartData: {')
            cd_end_pos = find_section_end(text, 'chartData')
            cd_section = text[cd_start:cd_end_pos+1] if cd_start >= 0 else ''
            
            if f'{sub_key}:' in cd_section:
                # Replace existing
                try:
                    new_js = to_js_value(cd_input[sub_key], 4)
                    text = replace_section(text, sub_key, new_js)
                    print(f"  ✓ Replaced chartData.{sub_key}")
                except ValueError:
                    print(f"  ✗ Warning: Could not replace chartData.{sub_key}")
            else:
                # Insert new sub-key before chartData closing brace
                try:
                    insert_pos = find_section_end(text, 'chartData')
                    insert_js = f",\n    {sub_key}: {to_js_value(cd_input[sub_key], 4)}"
                    text = text[:insert_pos] + insert_js + text[insert_pos:]
                    print(f"  ✓ Inserted chartData.{sub_key}")
                except Exception as e2:
                    print(f"  ✗ Warning: Could not update chartData.{sub_key}: {e2}")
    
    if 'chartAppend' in inp:
        appends = inp['chartAppend']

        # Dedup: if this label already exists in chartData.labels, skip all appends
        new_label = appends.get('labels')
        if new_label is not None:
            label_str = f"'{new_label}'" if isinstance(new_label, str) else str(new_label)
            # Find the labels array and check if the last entry matches
            import re as _re
            labels_match = _re.search(r"labels:\s*\[([^\]]+)\]", text)
            if labels_match:
                existing = labels_match.group(1).strip()
                last_label = existing.rsplit(',', 1)[-1].strip()
                if last_label == label_str:
                    print(f"  ⊘ chartAppend skipped: {label_str} already last entry in labels (dedup)")
                    return text

        # Simple top-level arrays in chartData
        simple_arrays = ['labels', 'brent', 'vix', 'hyg', 'sp500', 'taco']
        for arr_name in simple_arrays:
            if arr_name in appends:
                try:
                    text = append_to_array(text, f'chartData.{arr_name}', [appends[arr_name]])
                    print(f"  ✓ Appended to chartData.{arr_name}")
                except ValueError as e:
                    print(f"  ✗ Warning: {e}")
        
        # Strike arrays — append to nested strikes.us and strikes.iran
        if 'strikeLabels' in appends:
            try:
                text = append_to_array(text, 'chartData.strikeLabels', [appends['strikeLabels']])
                print(f"  ✓ Appended to chartData.strikeLabels")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
        if 'strikes_us' in appends:
            try:
                text = append_to_nested_array(text, 'strikes', 'us', appends['strikes_us'])
                print(f"  ✓ Appended to chartData.strikes.us")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
        if 'strikes_iran' in appends:
            try:
                text = append_to_nested_array(text, 'strikes', 'iran', appends['strikes_iran'])
                print(f"  ✓ Appended to chartData.strikes.iran")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
        
        # ETF sparkline arrays — structure: etfs.ITA.prices: [...]
        if 'etfs' in appends:
            for etf_name, etf_val in appends['etfs'].items():
                try:
                    text = append_to_etf_prices(text, etf_name, etf_val)
                    print(f"  ✓ Appended to chartData.etfs.{etf_name}.prices")
                except ValueError as e:
                    print(f"  ✗ Warning: {e}")
        
        # Hormuz arrays
        if 'hormuzLabels' in appends:
            try:
                text = append_to_array(text, 'chartData.hormuzLabels', [appends['hormuzLabels']])
                print(f"  ✓ Appended to chartData.hormuzLabels")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
        if 'hormuzTransits' in appends:
            try:
                text = append_to_array(text, 'chartData.hormuzTransits', [appends['hormuzTransits']])
                print(f"  ✓ Appended to chartData.hormuzTransits")
            except ValueError as e:
                print(f"  ✗ Warning: {e}")
    
    return text


def main():
    if len(sys.argv) < 2:
        print("Usage: python update-dashboard.py <input.json> [--dry-run]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    # Load input
    print(f"Loading input from {input_path}...")
    inp = load_input(input_path)
    
    # Load current dashboard data
    print(f"Loading dashboard-data.js...")
    text = load_dashboard_data(DATA_FILE)
    original_len = len(text.split('\n'))
    
    # Apply patches
    print("Applying patches...")
    text = patch_dashboard(text, inp)
    new_len = len(text.split('\n'))
    
    if dry_run:
        print(f"\n[DRY RUN] Would write {new_len} lines (was {original_len})")
        # Write to stdout or temp file
        dry_path = DATA_FILE + '.preview'
        with open(dry_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Preview written to {dry_path}")
    else:
        # Backup
        backup_path = DATA_FILE + '.bak'
        shutil.copy2(DATA_FILE, backup_path)
        print(f"Backup saved to {backup_path}")
        
        # Write
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n✓ Dashboard updated: {new_len} lines (was {original_len})")
    
    # Validate JS syntax
    print("\nValidating JS syntax...")
    ret = os.system(f'node -c "{DATA_FILE}" 2>&1')
    if ret == 0:
        print("✓ JS syntax valid")
    else:
        print("✗ JS syntax error — check output above")
        if not dry_run:
            print(f"Restoring from backup...")
            shutil.copy2(backup_path, DATA_FILE)
            sys.exit(1)


if __name__ == '__main__':
    main()
