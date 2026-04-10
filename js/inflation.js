/**
 * Inflation & Fed Funds Rate Renderer
 * Populates the Inflation tab from DASHBOARD_DATA.inflation
 * Fully data-driven — no HTML editing needed for updates.
 */
(function renderInflation() {
  'use strict';
  var D = (typeof DASHBOARD_DATA !== 'undefined') ? DASHBOARD_DATA.inflation : null;
  if (!D) return;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function $(sel) { return document.querySelector(sel); }

  /* ── Badge ── */
  var badge = $('#inflation-badge');
  if (badge && D.badge) { badge.textContent = D.badge; }

  /* ── Oil-to-CPI Derivation Model ── */
  var derivEl = $('#inflation-derivation');
  if (derivEl && D.derivation) {
    var dv = D.derivation;
    var html = '';

    // Step cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-bottom:var(--space-3);">';
    dv.steps.forEach(function(step) {
      html += '<div style="background:var(--color-surface-offset);border:1px solid var(--color-border);border-radius:8px;padding:10px 12px;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:' + (step.color || 'var(--color-text-faint)') + ';text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;">' + esc(step.label) + '</div>';
      html += '<div style="font-size:0.95rem;font-weight:700;color:var(--color-text);margin-bottom:2px;">' + esc(step.value) + '</div>';
      html += '<div style="font-size:0.68rem;color:var(--color-text-muted);line-height:1.45;">' + step.detail + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Result card
    if (dv.result) {
      html += '<div style="padding:10px 14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;margin-bottom:var(--space-3);">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:#ef4444;text-transform:uppercase;letter-spacing:0.07em;">Derived CPI Estimate</div>';
      html += '</div>';
      html += '<div style="font-size:1.3rem;font-weight:800;color:#ef4444;margin-bottom:4px;">' + esc(dv.result.headline) + '</div>';
      html += '<div style="font-size:0.72rem;color:var(--color-text-muted);line-height:1.55;">' + dv.result.explanation + '</div>';
      html += '</div>';
    }

    // Methodology note
    if (dv.methodology) {
      html += '<div style="font-size:0.65rem;color:var(--color-text-faint);line-height:1.5;font-style:italic;">' + dv.methodology + '</div>';
    }

    derivEl.innerHTML = html;
  }

  /* ── CPI Breakdown Table ── */
  var breakdownEl = $('#inflation-cpi-breakdown');
  if (breakdownEl && D.cpiBreakdown) {
    var html = '<table style="width:100%;border-collapse:collapse;font-size:0.72rem;">';
    html += '<thead><tr style="border-bottom:1px solid var(--color-border);">';
    html += '<th style="text-align:left;padding:6px 8px;color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.6rem;text-transform:uppercase;">Component</th>';
    html += '<th style="text-align:right;padding:6px 8px;color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.6rem;text-transform:uppercase;">Pre-War</th>';
    html += '<th style="text-align:right;padding:6px 8px;color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.6rem;text-transform:uppercase;">Current Est.</th>';
    html += '<th style="text-align:right;padding:6px 8px;color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.6rem;text-transform:uppercase;">Delta</th>';
    html += '</tr></thead><tbody>';
    D.cpiBreakdown.forEach(function(row) {
      var dColor = row.deltaColor || (parseFloat(row.delta) > 0 ? '#ef4444' : '#22c55e');
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">';
      html += '<td style="padding:6px 8px;color:var(--color-text-muted);">' + esc(row.component) + '</td>';
      html += '<td style="text-align:right;padding:6px 8px;font-family:var(--font-mono);color:var(--color-text-muted);">' + esc(row.preWar) + '</td>';
      html += '<td style="text-align:right;padding:6px 8px;font-family:var(--font-mono);color:var(--color-text);font-weight:600;">' + esc(row.current) + '</td>';
      html += '<td style="text-align:right;padding:6px 8px;font-family:var(--font-mono);color:' + dColor + ';font-weight:600;">' + esc(row.delta) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    breakdownEl.innerHTML = html;
  }

  /* ── Fed Funds Rate Section ── */
  var fedEl = $('#inflation-fed-rate');
  if (fedEl && D.fedRate) {
    var fr = D.fedRate;
    var html = '';

    // Rate KPI cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:var(--space-3);">';
    fr.kpis.forEach(function(k) {
      html += '<div style="background:var(--color-surface-offset);border:1px solid var(--color-border);border-radius:8px;padding:10px 12px;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;">' + esc(k.label) + '</div>';
      html += '<div style="font-size:0.95rem;font-weight:700;color:' + (k.color || 'var(--color-text)') + ';margin-bottom:2px;">' + esc(k.value) + '</div>';
      html += '<div style="font-size:0.68rem;color:var(--color-text-muted);line-height:1.45;">' + k.detail + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Rate probability bars
    if (fr.probabilities) {
      html += '<div style="margin-bottom:var(--space-3);">';
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;">' + esc(fr.probabilities.title || 'Rate Path Probabilities — 2026') + '</div>';
      fr.probabilities.scenarios.forEach(function(s) {
        var barColor = s.color || '#6366f1';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
        html += '<div style="width:110px;font-size:0.68rem;color:var(--color-text-muted);flex-shrink:0;">' + esc(s.label) + '</div>';
        html += '<div style="flex:1;background:rgba(255,255,255,0.04);border-radius:4px;height:18px;overflow:hidden;position:relative;">';
        html += '<div style="width:' + s.probability + '%;background:' + barColor + ';height:100%;border-radius:4px;transition:width 0.5s ease;"></div>';
        html += '</div>';
        html += '<div style="width:40px;text-align:right;font-family:var(--font-mono);font-size:0.72rem;font-weight:600;color:' + barColor + ';">' + s.probability + '%</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Dot plot summary
    if (fr.dotPlot) {
      html += '<div style="padding:10px 14px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:8px;margin-bottom:var(--space-3);">';
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:#6366f1;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">Fed Dot Plot — March 2026</div>';
      html += '<div style="font-size:0.72rem;color:var(--color-text-muted);line-height:1.55;">' + fr.dotPlot + '</div>';
      html += '</div>';
    }

    // Powell quote
    if (fr.powellQuote) {
      html += '<div style="border-left:3px solid rgba(99,102,241,0.4);padding:8px 14px;margin-bottom:var(--space-3);">';
      html += '<div style="font-size:0.75rem;color:var(--color-text);line-height:1.55;font-style:italic;">"' + esc(fr.powellQuote.text) + '"</div>';
      html += '<div style="font-size:0.65rem;color:var(--color-text-faint);margin-top:4px;">— ' + esc(fr.powellQuote.attribution) + '</div>';
      html += '</div>';
    }

    fedEl.innerHTML = html;
  }

  /* ── Bottom Line ── */
  var blEl = $('#inflation-bottomline');
  if (blEl && D.bottomLine) {
    blEl.innerHTML = D.bottomLine;
  }

  /* ── Sources ── */
  var srcEl = $('#inflation-sources');
  if (srcEl && D.sources) {
    var html = '<span class="sources-label">Sources</span>';
    D.sources.forEach(function(s, i) {
      if (i > 0) html += '<span class="src-sep">&middot;</span>';
      html += '<a href="' + esc(s.url) + '" target="_blank">' + esc(s.name) + '</a>';
    });
    srcEl.innerHTML = html;
  }

})();
