/**
 * Ceasefire Analytics Renderer
 * Populates the Ceasefire Analytics tab from DASHBOARD_DATA.ceasefireAnalytics
 * Fully data-driven — no HTML editing needed for updates.
 * Exposed as window.initCeasefireAnalytics for lazy tab initialization.
 */
window.initCeasefireAnalytics = function initCeasefireAnalytics() {
  'use strict';
  var D = (typeof DASHBOARD_DATA !== 'undefined') ? DASHBOARD_DATA.ceasefireAnalytics : null;
  if (!D) {
    console.warn('ceasefireAnalytics: DASHBOARD_DATA.ceasefireAnalytics not found');
    return;
  }

  /* ── Header Badge + Note ── */
  var badgeEl = $('#ca-badge');
  if (badgeEl && D.meta && D.meta.badge) { badgeEl.textContent = D.meta.badge; }

    function esc(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }
  function $(sel) { return document.querySelector(sel); }
  function pct(n) { return Math.min(100, Math.max(0, Number(n) || 0)); }

  /* ══════════════════════════════════════════════
     SUMMARY KPI CARDS
  ══════════════════════════════════════════════ */
  var kpiEl = $('#ca-summary-kpis');
  if (kpiEl && D.summaryKpis && D.summaryKpis.length) {
    var html = '';
    D.summaryKpis.forEach(function(k) {
      html += '<div class="ca-kpi-card">';
      html += '<div class="ca-kpi-label">' + esc(k.label) + '</div>';
      html += '<div class="ca-kpi-value" style="color:' + (k.color || 'var(--color-text)') + ';">' + esc(k.value) + '</div>';
      html += '<div class="ca-kpi-detail">' + esc(k.detail) + '</div>';
      html += '</div>';
    });
    kpiEl.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     CEASEFIRE THRESHOLD PROGRESS BAR
  ══════════════════════════════════════════════ */
  var threshEl = $('#ca-threshold-bar');
  if (threshEl && D.ceasefire) {
    var cf = D.ceasefire;
    var rt = cf.requiredThreshold || {};
    var cm = cf.currentMet || {};
    var gap = cf.gap || {};

    // US side
    var usMin   = rt.minimumUS  || 5;
    var usCur   = cm.us         || 0;
    var usPct   = pct((usCur / 15) * 100);
    var usThPct = pct((usMin / 15) * 100);

    // Iran side
    var irMin   = rt.minimumIran || 4;
    var irCur   = cm.iran        || 0;
    var irPct   = pct((irCur / 10) * 100);
    var irThPct = pct((irMin / 10) * 100);

    var usBar = (usCur >= usMin) ? '#22c55e' : (usCur >= usMin - 1 ? '#f59e0b' : '#ef4444');
    var irBar = (irCur >= irMin) ? '#22c55e' : (irCur >= irMin - 1 ? '#f59e0b' : '#ef4444');

    var html = '<div style="font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-faint);margin-bottom:var(--space-3);">Demand Satisfaction Progress — Minimum Threshold for Viable Ceasefire</div>';
    html += '<div class="ca-threshold-grid">';

    // US demands progress
    html += '<div class="ca-threshold-side">';
    html += '<div class="ca-threshold-label">🇺🇸 US Demands (of 15 total)</div>';
    html += '<div class="ca-threshold-progress">';
    html += '<div class="ca-progress-track" style="position:relative;">';
    html += '<div class="ca-progress-fill" style="width:' + usPct + '%;background:' + usBar + ';"></div>';
    // threshold marker
    html += '<div style="position:absolute;top:-2px;bottom:-2px;width:2px;background:#6366f1;left:' + usThPct + '%;" title="Minimum threshold"></div>';
    html += '</div>';
    html += '<div class="ca-threshold-numbers">';
    html += '<span class="ca-thresh-current" style="color:' + usBar + ';">' + usCur + '</span>';
    html += '<span class="ca-thresh-sep">/</span>';
    html += '<span class="ca-thresh-needed">min ' + usMin + ' needed</span>';
    html += '</div>';
    html += '</div>';
    if (gap.iran !== undefined) {
      var usGap = Math.max(0, usMin - usCur);
      html += '<div style="font-size:0.63rem;color:var(--color-text-faint);margin-top:3px;">';
      if (usGap > 0) {
        html += '<span style="color:#f59e0b;">▲ ' + usGap + ' more demand' + (usGap > 1 ? 's' : '') + ' Iran must satisfy</span>';
      } else {
        html += '<span style="color:#22c55e;">✓ US threshold met</span>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Iran demands progress
    html += '<div class="ca-threshold-side">';
    html += '<div class="ca-threshold-label">🇮🇷 Iran Demands (of 10 total)</div>';
    html += '<div class="ca-threshold-progress">';
    html += '<div class="ca-progress-track" style="position:relative;">';
    html += '<div class="ca-progress-fill" style="width:' + irPct + '%;background:' + irBar + ';"></div>';
    html += '<div style="position:absolute;top:-2px;bottom:-2px;width:2px;background:#6366f1;left:' + irThPct + '%;" title="Minimum threshold"></div>';
    html += '</div>';
    html += '<div class="ca-threshold-numbers">';
    html += '<span class="ca-thresh-current" style="color:' + irBar + ';">' + irCur + '</span>';
    html += '<span class="ca-thresh-sep">/</span>';
    html += '<span class="ca-thresh-needed">min ' + irMin + ' needed</span>';
    html += '</div>';
    html += '</div>';
    var irGap = Math.max(0, irMin - irCur);
    html += '<div style="font-size:0.63rem;color:var(--color-text-faint);margin-top:3px;">';
    if (irGap > 0) {
      html += '<span style="color:#f59e0b;">▲ ' + irGap + ' more demand' + (irGap > 1 ? 's' : '') + ' US must satisfy</span>';
    } else {
      html += '<span style="color:#22c55e;">✓ Iran threshold met</span>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>'; // end grid

    // Rationale
    if (rt.rationale) {
      html += '<div style="font-size:0.7rem;color:var(--color-text-muted);line-height:1.6;margin-top:var(--space-3);padding-top:var(--space-2);border-top:1px solid rgba(255,255,255,0.06);">';
      html += '<strong style="color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.05em;">Threshold Rationale: </strong>' + esc(rt.rationale);
      html += '</div>';
    }
    if (rt.polymarketSignal) {
      html += '<div style="font-size:0.65rem;color:#38bdf8;font-style:italic;margin-top:6px;">';
      html += '📊 ' + esc(rt.polymarketSignal);
      html += '</div>';
    }

    threshEl.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     DEMAND MATRIX — TWO COLUMNS
  ══════════════════════════════════════════════ */
  var gridEl = $('#ca-demand-grid');
  if (gridEl) {
    function renderDemandColumn(demands, title, flagEmoji) {
      var total = demands.length;
      var metCount = demands.filter(function(d) {
        return d.status === 'MET' || d.status === 'PARTIAL' || d.status === 'CONTESTED';
      }).length;

      var html = '<div class="ca-demand-column">';
      // Header
      html += '<div class="ca-demand-col-header">';
      html += '<div class="ca-demand-col-title">' + flagEmoji + ' ' + esc(title) + '</div>';
      html += '<div class="ca-demand-col-count">' + metCount + '/' + total + ' partially addressed</div>';
      html += '</div>';

      // Demands list
      demands.forEach(function(item) {
        var prob90Color = item.probColor || '#ef4444';

        html += '<div class="ca-demand-item">';
        // Number
        html += '<div class="ca-demand-num">' + esc(item.id) + '</div>';
        // Body
        html += '<div class="ca-demand-body">';
        html += '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">';
        html += '<span class="ca-demand-text">' + esc(item.text) + '</span>';
        if (item.dealBreaker) {
          html += '<span class="ca-dealbreaker-tag">Deal Breaker</span>';
        }
        html += '</div>';
        if (item.category) {
          html += '<span class="ca-category-chip">' + esc(item.category) + '</span>';
        }
        html += '<div class="ca-demand-detail">' + esc(item.detail) + '</div>';
        // Probability row
        html += '<div style="display:flex;align-items:center;gap:8px;margin-top:3px;">';
        // 30d
        html += '<div class="ca-prob-row">';
        html += '<div class="ca-prob-track-sm"><div class="ca-prob-fill-sm" style="width:' + pct(item.probability30d) + '%;background:' + (item.probability30d >= 50 ? '#22c55e' : item.probability30d >= 25 ? '#f59e0b' : '#ef4444') + ';"></div></div>';
        html += '<span>' + pct(item.probability30d) + '% 30d</span>';
        html += '</div>';
        // 60d
        html += '<div class="ca-prob-row">';
        html += '<div class="ca-prob-track-sm"><div class="ca-prob-fill-sm" style="width:' + pct(item.probability60d) + '%;background:' + (item.probability60d >= 50 ? '#22c55e' : item.probability60d >= 25 ? '#f59e0b' : '#ef4444') + ';"></div></div>';
        html += '<span>' + pct(item.probability60d) + '% 60d</span>';
        html += '</div>';
        // 90d
        html += '<div class="ca-prob-row">';
        html += '<div class="ca-prob-track-sm"><div class="ca-prob-fill-sm" style="width:' + pct(item.probability90d) + '%;background:' + prob90Color + ';"></div></div>';
        html += '<span>' + pct(item.probability90d) + '% 90d</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>'; // end body
        // Status pill (right side)
        html += '<div class="ca-demand-meta">';
        html += '<span class="ca-status-pill" style="color:' + (item.statusColor || '#6b7280') + ';background:' + (item.statusColor || '#6b7280') + '18;border:1px solid ' + (item.statusColor || '#6b7280') + '30;">' + esc(item.status === 'NOT_MET' ? 'NOT MET' : item.status === 'PARTIAL' ? 'PARTIAL' : item.status) + '</span>';
        if (item.statusLabel) {
          html += '<div style="font-size:0.58rem;color:var(--color-text-faint);text-align:right;max-width:120px;line-height:1.35;">' + esc(item.statusLabel) + '</div>';
        }
        html += '</div>';
        html += '</div>'; // end item
      });

      html += '</div>'; // end column
      return html;
    }

    var gridHtml = '';
    if (D.usDemands && D.usDemands.length) {
      gridHtml += renderDemandColumn(D.usDemands, 'US 15-Point Demands', '🇺🇸');
    }
    if (D.iranDemands && D.iranDemands.length) {
      gridHtml += renderDemandColumn(D.iranDemands, 'Iran 10-Point Demands', '🇮🇷');
    }
    gridEl.innerHTML = gridHtml;
  }

  /* ══════════════════════════════════════════════
     COMPROMISE ZONE
  ══════════════════════════════════════════════ */
  var compEl = $('#ca-compromise-zone');
  if (compEl && D.compromiseZone) {
    var cz = D.compromiseZone;
    var html = '';

    // Header
    html += '<div class="ca-compromise-header">';
    html += '<div>';
    html += '<div style="font-size:0.82rem;font-weight:700;color:var(--color-text);">' + esc(cz.headline) + '</div>';
    if (cz.timeHorizon) {
      html += '<div style="font-size:0.65rem;color:var(--color-text-faint);margin-top:3px;">Time horizon: ' + esc(cz.timeHorizon) + '</div>';
    }
    html += '</div>';
    html += '<div class="ca-compromise-prob">';
    html += '<div>';
    html += '<div class="ca-prob-big" style="color:' + (cz.probColor || '#f59e0b') + ';">' + pct(cz.probability) + '%</div>';
    html += '<div class="ca-prob-label">Viable<br>Compromise<br>Probability</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Minimum Viable Deal
    var mvd = cz.minimumViableDeal;
    if (mvd) {
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-faint);margin-bottom:var(--space-2);">' + esc(mvd.title || 'Minimum Viable Deal') + '</div>';
      html += '<div class="ca-mvd-grid">';

      // US Concessions
      html += '<div class="ca-mvd-side">';
      html += '<div class="ca-mvd-label" style="color:#60a5fa;">🇺🇸 US Must Concede</div>';
      html += '<ul class="ca-mvd-items">';
      (mvd.usConcessions || []).forEach(function(item) {
        html += '<li class="ca-mvd-item"><div class="ca-mvd-dot" style="background:#60a5fa;"></div><span>' + esc(item) + '</span></li>';
      });
      html += '</ul>';
      html += '</div>';

      // Iran Concessions
      html += '<div class="ca-mvd-side">';
      html += '<div class="ca-mvd-label" style="color:#34d399;">🇮🇷 Iran Must Concede</div>';
      html += '<ul class="ca-mvd-items">';
      (mvd.iranConcessions || []).forEach(function(item) {
        html += '<li class="ca-mvd-item"><div class="ca-mvd-dot" style="background:#34d399;"></div><span>' + esc(item) + '</span></li>';
      });
      html += '</ul>';
      html += '</div>';

      html += '</div>'; // end mvd-grid

      // Must exclude
      if (mvd.mustExclude && mvd.mustExclude.length) {
        html += '<div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.15);border-radius:7px;padding:9px 12px;margin-bottom:var(--space-2);">';
        html += '<div style="font-family:var(--font-mono);font-size:0.52rem;text-transform:uppercase;letter-spacing:0.07em;color:#a78bfa;margin-bottom:5px;">Must Leave Off the Table</div>';
        html += '<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;">';
        mvd.mustExclude.forEach(function(item) {
          html += '<li style="display:flex;align-items:baseline;gap:6px;font-size:0.68rem;color:var(--color-text-muted);"><div style="width:4px;height:4px;border-radius:50%;background:#7c3aed;flex-shrink:0;margin-top:5px;"></div><span>' + esc(item) + '</span></li>';
        });
        html += '</ul>';
        html += '</div>';
      }

      // Face-saving mechanism — handle both spellings
      var faceSaving = mvd.facesSavingMechanism || mvd.faceSavingMechanism;
      if (faceSaving) {
        html += '<div style="font-size:0.7rem;color:var(--color-text-muted);line-height:1.55;margin-bottom:var(--space-3);">';
        html += '<strong style="color:var(--color-text-faint);font-family:var(--font-mono);font-size:0.52rem;text-transform:uppercase;letter-spacing:0.05em;">Face-Saving Mechanism: </strong>' + esc(faceSaving);
        html += '</div>';
      }
    }

    // Blockers
    var blockers = cz.blockers;
    if (blockers && blockers.length) {
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-faint);margin-bottom:var(--space-2);">Deal Blockers</div>';
      html += '<div id="ca-blockers">';
      blockers.forEach(function(b) {
        var sevColor = b.severityColor || (b.severity === 'Critical' ? '#ef4444' : b.severity === 'Major' ? '#f97316' : '#f59e0b');
        html += '<div class="ca-blocker-row">';
        html += '<span class="ca-blocker-severity" style="color:' + sevColor + ';background:' + sevColor + '18;border:1px solid ' + sevColor + '30;">' + esc(b.severity) + '</span>';
        html += '<div class="ca-blocker-issue">' + esc(b.blocker) + '</div>';
        html += '<div class="ca-blocker-resolution"><em style="color:var(--color-text-faint);font-style:normal;font-size:0.6rem;">Path to resolution: </em>' + esc(b.resolution) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Scenarios
    var scenarios = cz.scenarios;
    if (scenarios && scenarios.length) {
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-faint);margin:var(--space-3) 0 var(--space-2);">Outcome Scenarios (60-Day Window)</div>';
      html += '<div class="ca-scenario-grid">';
      scenarios.forEach(function(sc) {
        var sc_color = sc.color || '#6366f1';
        html += '<div class="ca-scenario-card" style="border-color:' + sc_color + '30;">';
        html += '<div class="ca-scenario-header">';
        html += '<div class="ca-scenario-name" style="color:' + sc_color + ';">' + esc(sc.name) + '</div>';
        html += '<div class="ca-scenario-prob" style="color:' + sc_color + ';">' + pct(sc.probability) + '%</div>';
        html += '</div>';
        html += '<div class="ca-scenario-desc">' + esc(sc.description) + '</div>';
        if (sc.marketImpact) {
          html += '<div class="ca-scenario-market">Market: ' + esc(sc.marketImpact) + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    compEl.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     CHINA FACTOR
  ══════════════════════════════════════════════ */
  var chinaEl = $('#ca-china-factor');
  if (chinaEl && D.chinaFactor) {
    var cf2 = D.chinaFactor;
    var html = '';

    // Header
    html += '<div class="ca-china-header">';
    html += '<div>';
    html += '<div style="font-size:0.82rem;font-weight:700;color:var(--color-text);">🇨🇳 China Factor — 50% Tariff Ultimatum</div>';
    html += '<div style="font-size:0.68rem;color:var(--color-text-muted);margin-top:3px;">' + esc(cf2.headline) + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;">';
    html += '<div style="font-size:1.4rem;font-weight:800;font-family:var(--font-mono);color:' + (cf2.probColor || '#ef4444') + ';">' + pct(cf2.probability) + '%</div>';
    html += '<div style="font-family:var(--font-mono);font-size:0.52rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-faint);">China<br>Compliance<br>Probability</div>';
    html += '</div>';
    html += '</div>';

    // Game State
    if (cf2.gameState) {
      var gs = cf2.gameState;
      html += '<div class="ca-game-state-grid">';
      var fields = [
        { key: 'usPosition',          label: 'US Position' },
        { key: 'chinaPosition',        label: "China's Position" },
        { key: 'chinaRevealedStrategy',label: 'China Revealed Strategy' },
        { key: 'equilibrium',          label: 'Game Theory Equilibrium' },
        { key: 'implication',          label: 'Ceasefire Implication' }
      ];
      fields.forEach(function(f) {
        if (gs[f.key]) {
          html += '<div class="ca-game-cell">';
          html += '<div class="ca-game-cell-label">' + esc(f.label) + '</div>';
          html += '<div class="ca-game-cell-text">' + esc(gs[f.key]) + '</div>';
          html += '</div>';
        }
      });
      html += '</div>';
    }

    // China scenarios
    if (cf2.scenarios && cf2.scenarios.length) {
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-faint);margin-bottom:var(--space-2);">China Response Scenarios</div>';
      html += '<div class="ca-scenario-grid">';
      cf2.scenarios.forEach(function(sc) {
        var sc_color = sc.color || '#6366f1';
        html += '<div class="ca-scenario-card" style="border-color:' + sc_color + '30;">';
        html += '<div class="ca-scenario-header">';
        html += '<div class="ca-scenario-name" style="color:' + sc_color + ';">' + esc(sc.name) + '</div>';
        html += '<div class="ca-scenario-prob" style="color:' + sc_color + ';">' + pct(sc.probability) + '%</div>';
        html += '</div>';
        if (sc.ceasefire_impact) {
          html += '<div class="ca-scenario-desc">' + esc(sc.ceasefire_impact) + '</div>';
        }
        if (sc.brent_impact) {
          html += '<div class="ca-scenario-market">Brent: ' + esc(sc.brent_impact) + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    chinaEl.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     VIOLATION IMPACT
  ══════════════════════════════════════════════ */
  var violEl = $('#ca-violations');
  if (violEl && D.violationImpact && D.violationImpact.length) {
    var html = '';
    D.violationImpact.forEach(function(v) {
      var riskColor = v.riskColor || '#ef4444';
      html += '<div class="ca-violation-card" style="border-left-color:' + riskColor + ';">';
      html += '<div class="ca-violation-header">';
      html += '<div style="font-size:0.72rem;font-weight:700;color:var(--color-text);">' + esc(v.violation) + '</div>';
      html += '<div class="ca-violation-risk" style="color:' + riskColor + ';">' + esc(v.ceasefireRisk) + ' RISK</div>';
      html += '</div>';
      html += '<div class="ca-violation-impact">' + esc(v.impact) + '</div>';
      if (v.demandAffected) {
        html += '<div class="ca-violation-demand">Blocks: ' + esc(v.demandAffected) + '</div>';
      }
      html += '</div>';
    });
    violEl.innerHTML = html;
  }

  /* ══════════════════════════════════════════════
     BOTTOM LINE
  ══════════════════════════════════════════════ */
  var blEl = $('#ca-bottom-line');
  if (blEl && D.bottomLine) {
    blEl.innerHTML =
      '<div class="ca-bottom-line-label">Analytical Assessment</div>' +
      '<div class="ca-bottom-line-text">' + esc(D.bottomLine) + '</div>';
  }

  /* ══════════════════════════════════════════════
     SOURCES
  ══════════════════════════════════════════════ */
  var srcEl = $('#ca-sources');
  if (srcEl && D.sources && D.sources.length) {
    var links = D.sources.map(function(s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a>';
    });
    srcEl.innerHTML = links.join('<span class="src-sep"> · </span>');
  }

};
