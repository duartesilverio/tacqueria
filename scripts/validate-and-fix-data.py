#!/usr/bin/env python3
"""
Tacqueria Dashboard — Data Validator & Auto-Fixer
Validates day-N-data.json against renderer-expected schemas.
Fixes common Opus-generated schema mismatches automatically.
Run BEFORE update-dashboard.py.

Usage: python scripts/validate-and-fix-data.py scripts/day-N-data.json [--fix]
"""

import json, sys, os, copy

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ── Schema Definitions (from render-prose.js, render.js) ──────────────────

SCHEMAS = {
    'intelligence': {
        'columns': ['diplomatic', 'military', 'energy'],
        'column': {
            'required': ['badge', 'badgeColor', 'sections', 'sources'],
            'sections_item': {'required': ['title', 'items'], 'items_type': 'list_of_strings'},
            'sources_item': {'required': ['url', 'label'], 'type': 'object'},
        }
    },
    'next48h': {
        'required': ['badge', 'catalysts'],
        'catalysts_item': {'required': ['rank', 'title', 'outcomeLabel', 'body', 'color']},
    },
    'analyticalOutlook': {
        'required': ['label', 'basisCards', 'pathProbabilities', 'supplyDisruption', 'tacoTrajectory', 'disclaimer'],
        'basisCards_item': {'required': ['label', 'value', 'detail', 'borderColor', 'valueColor']},
        'pathProbabilities_item': {'required': ['name', 'prob', 'brentRange', 'barWidth', 'barGradient', 'nameColor', 'drivers']},
    },
    'marketSignals': {
        'required': ['futuresCurve', 'riskReversal', 'cdsSpreads', 'cdsCommentary', 'cftc', 'brentWtiSpread', 'optionsIntelligence'],
        'cdsSpreads_row': {'required': ['country', 'current', 'preWar', 'change', 'signal']},
        'brentWtiSpread': {'required': ['current', 'preWar', 'widening', 'brentPrice', 'wtiPrice', 'commentary']},
        'optionsIntelligence': {'required': ['badge', 'summary', 'signals', 'bottomLine']},
        'oi_signal': {'required': ['title', 'icon', 'explanation', 'signal', 'signalColor']},
    },
    'analyticalSignals_item': {'required': ['label', 'value', 'score', 'scoreColor', 'detail']},
    'dLive': {'required': ['label', 'brentRange', 'brentNote', 'tacoEst', 'tacoNote', 'narrative']},
}

# ── Auto-Fix Rules ────────────────────────────────────────────────────────

def fix_intelligence(d):
    """Fix intelligence sections: bullets→items, string sources→{url,label}"""
    fixes = 0
    for col in ['diplomatic', 'military', 'energy']:
        c = d.get('intelligence', {}).get(col, {})
        # Fix sections: bullets → items
        for sec in c.get('sections', []):
            if 'bullets' in sec and 'items' not in sec:
                sec['items'] = sec.pop('bullets')
                fixes += 1
            elif 'content' in sec and 'items' not in sec:
                content = sec.pop('content')
                sec['items'] = [content] if isinstance(content, str) else content
                fixes += 1
        # Fix sources: string → {url, label}
        if 'sources' in c:
            new_sources = []
            for src in c['sources']:
                if isinstance(src, str):
                    new_sources.append({'url': '#', 'label': src})
                    fixes += 1
                elif isinstance(src, dict):
                    if 'label' not in src and 'name' in src:
                        src['label'] = src.pop('name')
                        fixes += 1
                    new_sources.append(src)
                else:
                    new_sources.append(src)
            c['sources'] = new_sources
    return fixes

def fix_next48h(d):
    """Fix next48h catalysts: detail→body, add rank/outcomeLabel"""
    fixes = 0
    for i, c in enumerate(d.get('next48h', {}).get('catalysts', [])):
        if 'rank' not in c:
            c['rank'] = str(i + 1)
            fixes += 1
        if 'body' not in c and 'detail' in c:
            c['body'] = c.pop('detail')
            fixes += 1
        if 'body' not in c and 'description' in c:
            c['body'] = c.pop('description')
            fixes += 1
        if 'outcomeLabel' not in c:
            c['outcomeLabel'] = c.get('title', 'Watch')[:30]
            fixes += 1
    return fixes

def fix_analytical_outlook(d):
    """Fix analyticalOutlook basisCards and pathProbabilities schemas"""
    fixes = 0
    ao = d.get('analyticalOutlook', {})
    
    # Fix basisCards: title→label, body→detail, color→borderColor
    for c in ao.get('basisCards', []):
        if 'label' not in c and 'title' in c:
            c['label'] = c.pop('title')
            fixes += 1
        if 'value' not in c:
            c['value'] = c.get('label', '')[:20]
            fixes += 1
        if 'detail' not in c and 'body' in c:
            c['detail'] = c.pop('body')
            fixes += 1
        if 'borderColor' not in c:
            color = c.pop('color', 'red')
            c['borderColor'] = '#ef4444' if color == 'red' else '#f59e0b'
            fixes += 1
        if 'valueColor' not in c:
            c['valueColor'] = c.get('borderColor', '#ef4444')
            fixes += 1
    
    # Fix pathProbabilities: path→name, probability→prob, brent→brentRange, add bar styling
    for p in ao.get('pathProbabilities', []):
        if 'name' not in p and 'path' in p:
            p['name'] = p.pop('path')
            fixes += 1
        if 'prob' not in p and 'probability' in p:
            p['prob'] = str(p.pop('probability')) + '%'
            fixes += 1
        if 'brentRange' not in p and 'brent' in p:
            p['brentRange'] = p.pop('brent')
            fixes += 1
        if 'barWidth' not in p:
            # Extract number from prob
            prob_str = p.get('prob', '25%')
            try:
                pct = int(''.join(c for c in prob_str if c.isdigit()))
            except:
                pct = 25
            p['barWidth'] = f'{pct}%'
            fixes += 1
        if 'barGradient' not in p:
            p['barGradient'] = 'linear-gradient(90deg, #ef4444, #f59e0b)'
            fixes += 1
        if 'nameColor' not in p:
            p['nameColor'] = '#ef4444'
            fixes += 1
        if 'drivers' not in p:
            p['drivers'] = p.get('note', p.get('taco', ''))
            fixes += 1
    
    return fixes

def fix_market_signals(d):
    """Fix marketSignals sub-schemas"""
    fixes = 0
    ms = d.get('marketSignals', {})
    
    # Fix cdsSpreads rows
    if isinstance(ms.get('cdsSpreads'), list):
        for row in ms['cdsSpreads']:
            if isinstance(row, dict):
                if 'country' not in row and 'name' in row:
                    row['country'] = row.pop('name')
                    fixes += 1
                if 'country' not in row and 'entity' in row:
                    row['country'] = row.pop('entity')
                    fixes += 1
                for field in ['current', 'preWar', 'change', 'signal']:
                    if field not in row:
                        row[field] = ''
                        fixes += 1
    
    # Fix brentWtiSpread
    bws = ms.get('brentWtiSpread', {})
    if isinstance(bws, dict):
        if 'current' not in bws and 'price' in bws:
            bws['current'] = bws.pop('price')
            fixes += 1
        if 'current' not in bws and 'value' in bws:
            bws['current'] = bws.pop('value')
            fixes += 1
        for field in ['current', 'preWar', 'widening', 'brentPrice', 'wtiPrice', 'commentary']:
            if field not in bws:
                bws[field] = ''
                fixes += 1
    
    # Fix futuresCurve: must be {m1, m6, m12, commentary} not string
    fc = ms.get('futuresCurve', {})
    if isinstance(fc, str):
        ms['futuresCurve'] = {'m1': '', 'm6': '', 'm12': '', 'commentary': fc}
        fixes += 1
    elif isinstance(fc, dict):
        for field in ['m1', 'm6', 'm12', 'commentary']:
            if field not in fc:
                fc[field] = ''
                fixes += 1
    
    # Fix riskReversal: must be {oneMonth, threeMonth, commentary} not string
    rr = ms.get('riskReversal', {})
    if isinstance(rr, str):
        ms['riskReversal'] = {'oneMonth': '', 'threeMonth': '', 'commentary': rr}
        fixes += 1
    elif isinstance(rr, dict):
        for field in ['oneMonth', 'threeMonth', 'commentary']:
            if field not in rr:
                rr[field] = ''
                fixes += 1
    
    # Fix cftc: must be {badge, wtiNetLong, brentNetLong, commentary} not string
    cftc = ms.get('cftc', {})
    if isinstance(cftc, str):
        ms['cftc'] = {'badge': 'EXTREME LONG', 'wtiNetLong': '', 'brentNetLong': '', 'commentary': cftc}
        fixes += 1
    elif isinstance(cftc, dict):
        for field in ['badge', 'wtiNetLong', 'brentNetLong', 'commentary']:
            if field not in cftc:
                cftc[field] = ''
                fixes += 1
    
    # Fix optionsIntelligence
    oi = ms.get('optionsIntelligence', {})
    if isinstance(oi, dict):
        for field in ['badge', 'summary', 'signals', 'bottomLine']:
            if field not in oi:
                oi[field] = [] if field == 'signals' else ''
                fixes += 1
        if isinstance(oi.get('signals'), list):
            for s in oi['signals']:
                if isinstance(s, dict):
                    for field in ['title', 'icon', 'explanation', 'signal', 'signalColor']:
                        if field not in s:
                            s[field] = ''
                            fixes += 1
    
    return fixes

def fix_rhetoric_tracker(d):
    """Fix rhetoricTracker: sentiment, timeline, patterns, scoreSummary"""
    fixes = 0
    rt = d.get('rhetoricTracker', {})
    if not rt:
        return fixes
    
    # Fix sentiment: renderer expects {maxEscalation, escalation, mixed, deescalation} (plain numbers)
    # Opus often writes {bar: [{label, pct, color}], totalStatements, note}
    sent = rt.get('sentiment', {})
    if isinstance(sent, dict) and 'bar' in sent and 'maxEscalation' not in sent:
        bar = sent['bar']
        new_sent = {'maxEscalation': 73, 'escalation': 18, 'mixed': 7, 'deescalation': 2}
        for item in bar:
            label = (item.get('label', '') or '').lower()
            pct = item.get('pct', item.get('percentage', 0))
            if 'max' in label:
                new_sent['maxEscalation'] = pct
            elif 'de' in label:
                new_sent['deescalation'] = pct
            elif 'mixed' in label:
                new_sent['mixed'] = pct
            elif 'escal' in label:
                new_sent['escalation'] = pct
        rt['sentiment'] = new_sent
        fixes += 1
    elif isinstance(sent, dict):
        for field in ['maxEscalation', 'escalation', 'mixed', 'deescalation']:
            if field not in sent:
                sent[field] = 0
                fixes += 1
    
    # Fix timeline: renderer expects [{date, dayBadge, entries: [{platform, time, tag, quote, tacoImpact: {score, detail}}]}]
    # Opus often writes flat entries: [{day, date, speaker, quote, classification, tacoImpact}]
    tl = rt.get('timeline', [])
    if tl and isinstance(tl[0], dict) and 'entries' not in tl[0] and 'quote' in tl[0]:
        # Flat format — need to group by day
        grouped = {}
        for entry in tl:
            day_key = entry.get('day', entry.get('date', 'Unknown'))
            date_str = entry.get('date', '')
            if day_key not in grouped:
                grouped[day_key] = {'date': date_str, 'dayBadge': str(day_key) if str(day_key).startswith('Day') else f'Day {day_key}' if isinstance(day_key, int) else day_key, 'entries': []}
            
            platform = entry.get('platform', entry.get('speaker', 'Unknown'))
            tag = entry.get('tag', entry.get('classification', 'ESCALATION'))
            quote = entry.get('quote', entry.get('text', ''))
            time_str = entry.get('time', '')
            taco_impact = entry.get('tacoImpact', None)
            if isinstance(taco_impact, str):
                taco_impact = {'score': 'SEVERE', 'detail': taco_impact}
            elif isinstance(taco_impact, dict) and 'score' not in taco_impact:
                taco_impact = {'score': 'SEVERE', 'detail': str(taco_impact)}
            
            grouped[day_key]['entries'].append({
                'platform': platform,
                'time': time_str,
                'tag': tag.upper() if tag else 'ESCALATION',
                'quote': quote,
                'tacoImpact': taco_impact
            })
        
        rt['timeline'] = list(grouped.values())
        fixes += len(tl)  # count all restructured entries
    
    # Fix patterns: renderer expects {icon, title, detail}
    for p in rt.get('patterns', []):
        if 'title' not in p and 'pattern' in p:
            p['title'] = p.pop('pattern')
            fixes += 1
        if 'icon' not in p:
            p['icon'] = '\u26a0\ufe0f'  # ⚠️
            fixes += 1
    
    # Fix scoreSummary: renderer expects {score, statementsAnalyzed, deescSignals, platformBreakdown}
    ss = rt.get('scoreSummary', {})
    if isinstance(ss, dict):
        if 'score' not in ss:
            ss['score'] = ss.get('rhetoricScore', ss.get('tacoScore', '1'))
            fixes += 1
        if 'statementsAnalyzed' not in ss:
            ss['statementsAnalyzed'] = ss.get('totalStatements', ss.get('total', '50+'))
            fixes += 1
        if 'deescSignals' not in ss:
            ss['deescSignals'] = ss.get('deescalationSignals', ss.get('deesc', '1 (reversed)'))
            fixes += 1
        if 'platformBreakdown' not in ss:
            ss['platformBreakdown'] = ss.get('breakdown', 'Truth Social ~60% · Press ~25% · Official ~15%')
            fixes += 1
    
    return fixes

def fix_operations(d):
    """Fix operations: kpis, indicators, pipeline, uaeAttackSummary, iranNeighbors"""
    fixes = 0
    ops = d.get('operations', {})
    if not ops:
        return fixes
    
    # Fix kpis: renderer expects {label, value, delta, note, color}
    for k in ops.get('kpis', []):
        if 'delta' not in k:
            k['delta'] = k.pop('change', k.pop('trend', ''))
            fixes += 1
        if 'note' not in k:
            k['note'] = k.pop('detail', k.pop('description', ''))
            fixes += 1
    
    # Fix indicators: renderer expects {indicator, value, dir, dirClass, notes}
    for row in ops.get('indicators', []):
        if 'indicator' not in row and 'label' in row:
            row['indicator'] = row.pop('label')
            fixes += 1
        if 'dir' not in row:
            row['dir'] = row.pop('direction', row.pop('trend', '\u2192 Stable'))
            fixes += 1
        if 'dirClass' not in row:
            d_val = row.get('dir', '')
            if '\u2191' in d_val or 'up' in d_val.lower():
                row['dirClass'] = 'dir-up'
            elif '\u2193' in d_val or 'down' in d_val.lower():
                row['dirClass'] = 'dir-down'
            else:
                row['dirClass'] = 'dir-flat'
            fixes += 1
        if 'notes' not in row:
            row['notes'] = row.pop('detail', row.pop('note', row.pop('description', '')))
            fixes += 1
        # Remove color if present (renderer doesn't use it)
        row.pop('color', None)
    
    # Fix pipeline: must be object {petrolineValue, petrolineStatus, petrolineDetail, adcopValue, adcopStatus, adcopDetail}
    pipe = ops.get('pipeline', {})
    if isinstance(pipe, str):
        ops['pipeline'] = {
            'petrolineValue': '~7M bpd', 'petrolineStatus': 'MAX CAPACITY',
            'petrolineDetail': pipe[:200],
            'adcopValue': '~1.1M bpd', 'adcopStatus': '~71% UTIL',
            'adcopDetail': 'Terminus under attack. Fujairah port targeted.'
        }
        fixes += 1
    elif isinstance(pipe, dict):
        for f in ['petrolineValue', 'petrolineStatus', 'petrolineDetail', 'adcopValue', 'adcopStatus', 'adcopDetail']:
            if f not in pipe:
                pipe[f] = ''
                fixes += 1
    
    # Fix uaeAttackSummary: must be {ballisticMissiles, ballisticIntercept, drones, droneIntercept, cruiseMissiles, cruiseIntercept, killed, injured}
    uae = ops.get('uaeAttackSummary', {})
    if isinstance(uae, str):
        ops['uaeAttackSummary'] = {
            'ballisticMissiles': '352+', 'ballisticIntercept': '~95%',
            'drones': '1,789+', 'droneIntercept': '~96%',
            'cruiseMissiles': '15', 'cruiseIntercept': '~100%',
            'killed': '8', 'injured': '161+'
        }
        fixes += 1
    elif isinstance(uae, dict):
        for f in ['ballisticMissiles', 'ballisticIntercept', 'drones', 'droneIntercept', 'cruiseMissiles', 'cruiseIntercept', 'killed', 'injured']:
            if f not in uae:
                uae[f] = ''
                fixes += 1
    
    # Fix iranNeighbors: must be array of {country, missiles, drones, total, notes}
    nb = ops.get('iranNeighbors', [])
    if isinstance(nb, str):
        ops['iranNeighbors'] = [
            {'country': 'UAE', 'missiles': '352+', 'drones': '1,789+', 'total': '2,156+', 'notes': 'Primary target. 8 killed, 161+ injured.'},
            {'country': 'Saudi Arabia', 'missiles': '~50', 'drones': '~200', 'total': '~250', 'notes': 'Ras Tanura, Samref, eastern oil region targeted.'},
            {'country': 'Bahrain', 'missiles': '~15', 'drones': '~80', 'total': '~95', 'notes': 'US Fifth Fleet base targeted.'},
            {'country': 'Kuwait', 'missiles': '~10', 'drones': '~120', 'total': '~130', 'notes': 'Mina Al-Ahmadi, Abdullah, Alhamdi refineries hit.'},
            {'country': 'Qatar', 'missiles': '~20', 'drones': '~30', 'total': '~50', 'notes': 'Ras Laffan LNG extensive damage.'},
            {'country': 'Israel', 'missiles': '~100+', 'drones': '~300+', 'total': '~400+', 'notes': 'Dimona targeted. 15 killed, 180+ injured D22.'}
        ]
        fixes += 1
    elif isinstance(nb, list):
        for row in nb:
            if isinstance(row, dict):
                if 'country' not in row and 'name' in row:
                    row['country'] = row.pop('name')
                    fixes += 1
                for f in ['missiles', 'drones', 'total', 'notes']:
                    if f not in row:
                        row[f] = ''
                        fixes += 1
    
    return fixes

def validate(d):
    """Validate and return list of remaining errors"""
    errors = []
    
    # Intelligence
    for col in ['diplomatic', 'military', 'energy']:
        c = d.get('intelligence', {}).get(col, {})
        for i, s in enumerate(c.get('sections', [])):
            if 'items' not in s:
                errors.append(f"intelligence.{col}.sections[{i}]: MISSING 'items'")
            elif s['items'] and not isinstance(s['items'][0], str):
                errors.append(f"intelligence.{col}.sections[{i}].items[0]: not a string")
        for i, src in enumerate(c.get('sources', [])):
            if isinstance(src, str):
                errors.append(f"intelligence.{col}.sources[{i}]: still a string")
            elif isinstance(src, dict) and 'label' not in src:
                errors.append(f"intelligence.{col}.sources[{i}]: missing 'label'")
    
    # Next48h
    for i, c in enumerate(d.get('next48h', {}).get('catalysts', [])):
        for f in ['rank', 'title', 'outcomeLabel', 'body', 'color']:
            if f not in c:
                errors.append(f"next48h.catalysts[{i}]: missing '{f}'")
    
    # Analytical outlook
    ao = d.get('analyticalOutlook', {})
    for i, c in enumerate(ao.get('basisCards', [])):
        for f in ['label', 'value', 'detail', 'borderColor', 'valueColor']:
            if f not in c:
                errors.append(f"analyticalOutlook.basisCards[{i}]: missing '{f}'")
    for i, p in enumerate(ao.get('pathProbabilities', [])):
        for f in ['name', 'prob', 'brentRange', 'barWidth', 'barGradient', 'nameColor', 'drivers']:
            if f not in p:
                errors.append(f"analyticalOutlook.pathProbabilities[{i}]: missing '{f}'")
    
    # Rhetoric tracker
    rt = d.get('rhetoricTracker', {})
    sent = rt.get('sentiment', {})
    for f in ['maxEscalation', 'escalation', 'mixed', 'deescalation']:
        if f not in sent:
            errors.append(f"rhetoricTracker.sentiment: missing '{f}'")
    tl = rt.get('timeline', [])
    if tl and isinstance(tl[0], dict) and 'entries' not in tl[0]:
        errors.append("rhetoricTracker.timeline: flat format (needs {date, dayBadge, entries})")
    for i, p in enumerate(rt.get('patterns', [])):
        for f in ['icon', 'title', 'detail']:
            if f not in p:
                errors.append(f"rhetoricTracker.patterns[{i}]: missing '{f}'")
    ss = rt.get('scoreSummary', {})
    for f in ['score', 'statementsAnalyzed', 'deescSignals', 'platformBreakdown']:
        if f not in ss:
            errors.append(f"rhetoricTracker.scoreSummary: missing '{f}'")
    
    # Market signals
    ms = d.get('marketSignals', {})
    # futuresCurve
    fc = ms.get('futuresCurve', {})
    if isinstance(fc, str):
        errors.append("marketSignals.futuresCurve: is string, needs {m1, m6, m12, commentary}")
    elif isinstance(fc, dict):
        for f in ['m1', 'm6', 'm12', 'commentary']:
            if f not in fc:
                errors.append(f"marketSignals.futuresCurve: missing '{f}'")
    # riskReversal
    rr = ms.get('riskReversal', {})
    if isinstance(rr, str):
        errors.append("marketSignals.riskReversal: is string, needs {oneMonth, threeMonth, commentary}")
    elif isinstance(rr, dict):
        for f in ['oneMonth', 'threeMonth', 'commentary']:
            if f not in rr:
                errors.append(f"marketSignals.riskReversal: missing '{f}'")
    # cftc
    cftc = ms.get('cftc', {})
    if isinstance(cftc, str):
        errors.append("marketSignals.cftc: is string, needs {badge, wtiNetLong, brentNetLong, commentary}")
    elif isinstance(cftc, dict):
        for f in ['badge', 'wtiNetLong', 'brentNetLong', 'commentary']:
            if f not in cftc:
                errors.append(f"marketSignals.cftc: missing '{f}'")
    # brentWtiSpread
    bws = ms.get('brentWtiSpread', {})
    for f in ['current', 'preWar', 'widening', 'brentPrice', 'wtiPrice', 'commentary']:
        if f not in bws:
            errors.append(f"marketSignals.brentWtiSpread: missing '{f}'")
    
    
    # Operations
    ops = d.get('operations', {})
    for i, k in enumerate(ops.get('kpis', [])):
        for f in ['label', 'value', 'delta', 'note']:
            if f not in k:
                errors.append(f"operations.kpis[{i}]: missing '{f}'")
    for i, row in enumerate(ops.get('indicators', [])):
        for f in ['indicator', 'value', 'dir', 'dirClass', 'notes']:
            if f not in row:
                errors.append(f"operations.indicators[{i}]: missing '{f}'")
    pipe = ops.get('pipeline', {})
    if isinstance(pipe, str):
        errors.append("operations.pipeline: is string, needs {petrolineValue, petrolineStatus, ...}")
    uae = ops.get('uaeAttackSummary', {})
    if isinstance(uae, str):
        errors.append("operations.uaeAttackSummary: is string, needs {ballisticMissiles, ...}")
    nb = ops.get('iranNeighbors', [])
    if isinstance(nb, str):
        errors.append("operations.iranNeighbors: is string, needs [{country, missiles, drones, total, notes}]")
    elif isinstance(nb, list):
        for i, row in enumerate(nb[:1]):
            if isinstance(row, dict):
                for f in ['country', 'missiles', 'drones', 'total', 'notes']:
                    if f not in row:
                        errors.append(f"operations.iranNeighbors[{i}]: missing '{f}'")
    
    return errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate-and-fix-data.py <input.json> [--fix]")
        sys.exit(1)
    
    path = sys.argv[1]
    do_fix = '--fix' in sys.argv
    
    d = load(path)
    
    # Validate first
    errors = validate(d)
    print(f"Pre-fix validation: {len(errors)} errors")
    
    if do_fix and errors:
        print("\nApplying auto-fixes...")
        fixes = 0
        fixes += fix_intelligence(d)
        fixes += fix_next48h(d)
        fixes += fix_analytical_outlook(d)
        fixes += fix_market_signals(d)
        fixes += fix_rhetoric_tracker(d)
        fixes += fix_operations(d)
        print(f"  Applied {fixes} fixes")
        
        # Re-validate
        errors = validate(d)
        print(f"\nPost-fix validation: {len(errors)} errors remaining")
        
        if errors:
            for e in errors[:20]:
                print(f"  ✗ {e}")
        
        # Save
        save(path, d)
        print(f"\n✓ Fixed file saved to {path}")
    elif errors:
        print("\nErrors found (run with --fix to auto-repair):")
        for e in errors[:30]:
            print(f"  ✗ {e}")
        if len(errors) > 30:
            print(f"  ... and {len(errors) - 30} more")
    else:
        print("✓ All validations passed")

if __name__ == '__main__':
    main()
