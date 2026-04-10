// =============================================================================
// TACQUERIA PROSE RENDERER — Extends render engine for data-driven prose
// =============================================================================
// Requires: dashboard-data.js + render.js loaded first
// =============================================================================

(function renderProse() {
  'use strict';
  var D = DASHBOARD_DATA;

  // Reuse helpers (same signatures as render.js)
  function setText(sel, t) { var e = document.querySelectorAll(sel); for (var i = 0; i < e.length; i++) e[i].textContent = t; }
  function setHTML(sel, h) { var e = document.querySelectorAll(sel); for (var i = 0; i < e.length; i++) e[i].innerHTML = h; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /** Convert **bold** markdown to <strong>bold</strong> and escape the rest */
  function mdBold(str) {
    // Split on **…** segments, escape non-bold parts, wrap bold in <strong>
    var parts = str.split(/\*\*(.+?)\*\*/g);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      out += (i % 2 === 1) ? '<strong>' + esc(parts[i]) + '</strong>' : esc(parts[i]);
    }
    return out;
  }

  /** Map "red"/"amber" to hex color */
  function colorHex(c) { return c === 'red' ? '#ef4444' : '#f59e0b'; }
  function colorRgba(c, a) {
    return c === 'red'
      ? 'rgba(239,68,68,' + a + ')'
      : 'rgba(245,158,11,' + a + ')';
  }

  // ── 1. GIST BANNER ────────────────────────────────────────────────────────

  function renderGistBanner() {
    var g = D.gistBanner;

    // Bullets
    var bulletContainer = document.getElementById('gist-banner-bullets');
    if (bulletContainer) {
      var bhtml = '';
      g.bullets.forEach(function(b) {
        bhtml += '<div style="display:flex;align-items:baseline;gap:10px;font-size:0.87rem;line-height:1.65;color:var(--color-text);">';
        bhtml += '<span style="flex-shrink:0;color:' + colorHex(b.color || 'red') + ';font-weight:700;">&rsaquo;</span>';
        bhtml += '<span>' + mdBold(b.text) + '</span>';
        bhtml += '</div>';
      });
      bulletContainer.innerHTML = bhtml;
    }

    // Pills
    var pillContainer = document.getElementById('gist-banner-pills');
    if (pillContainer) {
      var phtml = '';
      g.pills.forEach(function(p) {
        var hex = colorHex(p.color);
        var circle = p.color === 'red' ? '&#x1F534; ' : '&#x1F7E1; ';
        phtml += '<span style="font-size:0.72rem;padding:3px 9px;background:' + colorRgba(p.color, 0.1);
        phtml += ';border:1px solid ' + colorRgba(p.color, 0.25) + ';border-radius:20px;color:' + hex + ';">';
        phtml += circle + esc(p.label) + '</span>';
      });
      pillContainer.innerHTML = phtml;
    }
  }

  // ── 2. NEWS-NOW CARDS ──────────────────────────────────────────────────────

  function renderNewsNow() {
    var container = document.getElementById('news-now-grid');
    if (!container) return;

    var html = '';
    D.newsNow.forEach(function(card) {
      var hex = colorHex(card.color);
      var bdAlpha = colorRgba(card.color, 0.22);
      html += '<div style="background:var(--color-surface);border:1px solid ' + bdAlpha + ';border-left:3px solid ' + hex + ';border-radius:8px;overflow:hidden;">';

      // Toggle button
      html += '<button onclick="this.parentElement.querySelector(\'.nn-body\').style.display=this.parentElement.querySelector(\'.nn-body\').style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.nn-chevron\').style.transform=this.parentElement.querySelector(\'.nn-body\').style.display===\'none\'?\'rotate(0deg)\':\'rotate(180deg)\'" ';
      html += 'style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);background:none;border:none;cursor:pointer;text-align:left;gap:var(--space-3);">';
      html += '<div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:' + hex + ';text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;">' + card.label + '</div>';
      html += '<div style="font-size:0.84rem;font-weight:600;color:var(--color-text);">' + card.title + '</div>';
      html += '</div>';
      html += '<svg class="nn-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" stroke-width="2" style="flex-shrink:0;transform:rotate(0deg);transition:transform 0.2s;"><path d="M6 9l6 6 6-6"/></svg>';
      html += '</button>';

      // Collapsible body
      html += '<div class="nn-body" style="display:none;padding:0 var(--space-4) var(--space-3);font-size:0.77rem;color:var(--color-text-muted);line-height:1.6;">' + card.body + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── 3. ANALYTICAL SIGNALS ──────────────────────────────────────────────────

  function renderAnalyticalSignals() {
    var container = document.getElementById('analytical-signals-grid');
    if (!container) return;

    var html = '';
    D.analyticalSignals.forEach(function(s) {
      var scHex = s.scoreColor === 'red' ? '#ef4444' : '#f59e0b';
      var bgAlpha = s.scoreColor === 'red' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)';
      var bdAlpha = s.scoreColor === 'red' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';

      html += '<div style="padding:8px 10px;background:' + bgAlpha + ';border:1px solid ' + bdAlpha + ';border-radius:6px;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.58rem;color:var(--color-text-faint);text-transform:uppercase;margin-bottom:4px;">' + esc(s.label) + '</div>';
      html += '<div style="font-size:0.78rem;font-weight:600;color:var(--color-text);">' + esc(s.value) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.68rem;color:' + scHex + ';margin-top:2px;">' + s.score + '</div>';
      html += '<div style="font-size:0.68rem;color:var(--color-text-faint);margin-top:3px;line-height:1.3;">' + s.detail + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── 4. D-LIVE BOX ─────────────────────────────────────────────────────────

  function renderDLive() {
    var container = document.getElementById('d-live-box');
    if (!container) return;

    var d = D.dLive;
    var html = '';

    html += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:#38bdf8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:var(--space-2);">' + esc(d.label) + '</div>';
    html += '<div style="background:rgba(56,189,248,0.05);border:1px solid rgba(56,189,248,0.15);border-radius:8px;padding:var(--space-3);">';

    // Brent Range + TACO Est side by side
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-bottom:var(--space-3);">';

    html += '<div>';
    html += '<div style="font-size:0.62rem;color:var(--color-text-faint);font-family:var(--font-mono);text-transform:uppercase;">Brent Range</div>';
    html += '<div style="font-family:var(--font-mono);font-size:0.9rem;font-weight:700;color:var(--color-text);">' + d.brentRange + '</div>';
    html += '<div style="font-size:0.65rem;color:#ef4444;">' + d.brentNote + '</div>';
    html += '</div>';

    html += '<div>';
    html += '<div style="font-size:0.62rem;color:var(--color-text-faint);font-family:var(--font-mono);text-transform:uppercase;">TACO Est.</div>';
    html += '<div style="font-family:var(--font-mono);font-size:0.9rem;font-weight:700;color:var(--color-text);">' + d.tacoEst + '</div>';
    html += '<div style="font-size:0.65rem;color:#ef4444;">' + d.tacoNote + '</div>';
    html += '</div>';

    html += '</div>';

    // Narrative paragraph
    html += '<p style="font-size:0.76rem;color:var(--color-text-muted);line-height:1.55;margin:0;">' + d.narrative + '</p>';

    html += '</div>';

    container.innerHTML = html;
  }

  // ── 5. ANALYTICAL OUTLOOK ──────────────────────────────────────────────────

  function renderAnalyticalOutlook() {
    var container = document.getElementById('analytical-outlook');
    if (!container) return;

    var o = D.analyticalOutlook;
    var html = '';

    // Header label
    html += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:#f59e0b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:var(--space-2);">' + esc(o.label) + '</div>';
    html += '<div style="background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.15);border-radius:8px;overflow:hidden;">';

    // ── Analytical Basis Cards ──
    html += '<div style="border-bottom:1px solid rgba(245,158,11,0.1);padding:var(--space-3);">';
    html += '<div style="font-size:0.6rem;color:var(--color-text-faint);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:var(--space-2);">Analytical Basis &mdash; Intelligence, Market Data &amp; TACO Sub-Scores</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">';

    o.basisCards.forEach(function(c) {
      html += '<div style="background:rgba(0,0,0,0.15);border-radius:6px;padding:6px 8px;border-top:2px solid ' + (c.borderColor || colorHex(c.valueColor || 'red')) + ';">';
      html += '<div style="font-family:var(--font-mono);font-size:0.52rem;color:var(--color-text-faint);text-transform:uppercase;margin-bottom:3px;">' + esc(c.label) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.82rem;font-weight:700;color:' + (c.borderColor || colorHex(c.valueColor || 'red')) + ';">' + esc(c.value) + '</div>';
      html += '<div style="font-size:0.62rem;color:var(--color-text-faint);margin-top:2px;line-height:1.3;">' + c.detail + '</div>';
      html += '</div>';
    });

    html += '</div></div>';

    // ── Path Probabilities ──
    html += '<div style="padding:var(--space-3);">';
    html += '<div style="font-size:0.6rem;color:var(--color-text-faint);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:var(--space-2);">Analytical Assessment &mdash; Path Probabilities &amp; Brent Ranges</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;">';

    o.pathProbabilities.forEach(function(p) {
      var nameColor = p.nameColor || '#ef4444';
      html += '<div style="display:grid;grid-template-columns:130px 1fr 110px;align-items:center;gap:var(--space-2);">';
      html += '<div style="font-size:0.72rem;color:' + nameColor + ';font-weight:600;">' + esc(p.name) + '</div>';
      html += '<div style="background:rgba(0,0,0,0.2);border-radius:3px;height:14px;overflow:hidden;position:relative;">';
      html += '<div style="background:' + p.barGradient + ';width:' + p.barWidth + ';height:100%;border-radius:3px;"></div>';
      html += '<span style="position:absolute;left:6px;top:0;font-family:var(--font-mono);font-size:0.58rem;line-height:14px;color:rgba(255,255,255,0.8);">' + p.drivers + '</span>';
      html += '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.72rem;color:' + nameColor + ';text-align:right;white-space:nowrap;"><strong>' + p.prob + '</strong> &middot; ' + esc(p.brentRange) + '</div>';
      html += '</div>';
    });

    html += '</div>';

    // ── TACO Trajectory + Supply Disruption ──
    html += '<div style="margin-top:var(--space-3);display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);">';

    html += '<div style="padding:6px 8px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);border-radius:6px;">';
    html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:var(--color-text-faint);text-transform:uppercase;margin-bottom:3px;">Supply Disruption Estimate (bpd offline)</div>';
    html += '<div style="font-size:0.68rem;color:var(--color-text-muted);line-height:1.5;">' + o.supplyDisruption + '</div>';
    html += '</div>';

    html += '<div style="padding:6px 8px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.12);border-radius:6px;">';
    html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:var(--color-text-faint);text-transform:uppercase;margin-bottom:3px;">TACO Trajectory D18–22 (Analytical Est.)</div>';
    html += '<div style="font-size:0.68rem;color:var(--color-text-muted);line-height:1.5;">' + o.tacoTrajectory + '</div>';
    html += '</div>';

    html += '</div>';

    // ── Disclaimer ──
    if (o.disclaimer) {
      html += '<div style="margin-top:var(--space-2);padding:6px 8px;background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.1);border-radius:6px;">';
      html += '<div style="font-size:0.64rem;color:var(--color-amber);line-height:1.4;font-style:italic;">' + o.disclaimer + '</div>';
      html += '</div>';
    }

    html += '</div></div>';

    container.innerHTML = html;
  }

  // ── 6. KEY TRIGGERS ────────────────────────────────────────────────────────

  function renderKeyTriggers() {
    var container = document.getElementById('key-triggers-grid');
    if (!container) return;

    var html = '';
    D.keyTriggers.forEach(function(t) {
      html += '<p style="font-size:0.73rem;color:var(--color-text-muted);line-height:1.45;margin:0;">';
      html += '<strong style="color:' + (t.titleColor || '#ef4444') + ';">' + t.title + '</strong> ' + t.body;
      html += '</p>';
    });
    container.innerHTML = html;
  }

  // ── 7. INTELLIGENCE TAB ────────────────────────────────────────────────────

  function renderIntelligence() {
    var container = document.getElementById('intel-grid');
    if (!container) return;

    var columns = ['diplomatic', 'military', 'energy'];
    var titles = { diplomatic: 'Diplomatic', military: 'Military / Operational', energy: 'Energy / Shipping' };
    var html = '';

    columns.forEach(function(col) {
      var data = D.intelligence[col];
      if (!data) return;

      var badgeClass = data.badgeColor === 'red' ? 'badge-red' : 'badge-amber';

      html += '<div class="card intel-card">';
      html += '<div class="card-header"><h3>' + esc(titles[col]) + '</h3><span class="badge ' + badgeClass + '">' + esc(data.badge) + '</span></div>';

      // Sections
      data.sections.forEach(function(sec) {
        html += '<div class="intel-section">';
        html += '<h4>' + sec.title + '</h4>';
        html += '<ul>';
        sec.items.forEach(function(item) {
          html += '<li>' + item + '</li>';
        });
        html += '</ul>';
        html += '</div>';
      });

      // Sources
      if (data.sources && data.sources.length) {
        html += '<div class="sources"><span class="sources-label">Sources</span>';
        data.sources.forEach(function(src, idx) {
          if (idx > 0) html += '<span class="src-sep">&middot;</span>';
          html += '<a href="' + esc(src.url) + '" target="_blank">' + esc(src.label) + '</a>';
        });
        html += '</div>';
      }

      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── 8. NEXT 48H CATALYSTS ──────────────────────────────────────────────────

  function renderNext48h() {
    var container = document.getElementById('next48h-list');
    if (!container) return;

    var n = D.next48h;

    // Badge
    var badgeEl = document.querySelector('#next48h-list').closest('.card');
    if (badgeEl) {
      var badgeSpan = badgeEl.querySelector('.badge');
      if (badgeSpan) badgeSpan.textContent = n.badge;
    }

    var html = '';
    n.catalysts.forEach(function(c) {
      var outcomeClass = c.color === 'red' ? 'outcome-red' : 'outcome-amber';
      html += '<div class="watch-item"><div class="watch-rank">' + c.rank + '</div><div class="watch-content">';
      html += '<h4>' + c.title + '</h4>';
      html += '<div class="watch-outcomes"><div class="outcome ' + outcomeClass + '"><span class="outcome-label">' + c.outcomeLabel + '</span>';
      html += '<p>' + c.body + '</p>';
      html += '</div></div>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  // ── 9. RHETORIC TRACKER ────────────────────────────────────────────────────

  function renderRhetoricTracker() {
    var container = document.getElementById('rhetoric-tracker-content');
    if (!container) return;

    var r = D.rhetoricTracker;
    var html = '';

    // Sentiment bar
    html += '<div class="rhetoric-sentiment-bar">';
    html += '<div class="sentiment-segment sentiment-max-escalation" style="width:' + r.sentiment.maxEscalation + '%"><span>Max Escalation ' + r.sentiment.maxEscalation + '%</span></div>';
    html += '<div class="sentiment-segment sentiment-escalation" style="width:' + r.sentiment.escalation + '%"><span>Escalation ' + r.sentiment.escalation + '%</span></div>';
    html += '<div class="sentiment-segment sentiment-mixed" style="width:' + r.sentiment.mixed + '%"><span>Mixed ' + r.sentiment.mixed + '%</span></div>';
    html += '<div class="sentiment-segment sentiment-deescalation" style="width:' + r.sentiment.deescalation + '%"><span>De-esc ' + r.sentiment.deescalation + '%</span></div>';
    html += '</div>';

    // Timeline
    html += '<div class="rhetoric-timeline">';
    r.timeline.forEach(function(day) {
      html += '<div class="rhetoric-day">';
      html += '<div class="rhetoric-date-marker">';
      html += '<span class="rhetoric-date">' + esc(day.date) + '</span>';
      html += '<span class="rhetoric-day-badge">' + esc(day.dayBadge) + '</span>';
      html += '</div>';
      html += '<div class="rhetoric-entries">';

      day.entries.forEach(function(e) {
        // Determine entry-level class from tag
        var entryClass = 'rhetoric-escalation';
        var tagLower = (e.tag || '').toLowerCase();
        if (tagLower.indexOf('max') !== -1) entryClass = 'rhetoric-max-escalation';
        else if (tagLower.indexOf('de-esc') !== -1 || tagLower.indexOf('deesc') !== -1) entryClass = 'rhetoric-mixed';
        else if (tagLower.indexOf('mixed') !== -1) entryClass = 'rhetoric-mixed';
        else if (tagLower.indexOf('reversal') !== -1) entryClass = 'rhetoric-max-escalation';

        // Tag class
        var tagClass = 'tag-escalation';
        if (tagLower.indexOf('max') !== -1 || tagLower.indexOf('reversal') !== -1) tagClass = 'tag-max-escalation';
        else if (tagLower.indexOf('de-esc') !== -1 || tagLower.indexOf('deesc') !== -1) tagClass = 'tag-deescalation';
        else if (tagLower.indexOf('mixed') !== -1) tagClass = 'tag-mixed';

        // Platform class
        var platLower = (e.platform || '').toLowerCase();
        var platClass = 'platform-press';
        if (platLower.indexOf('truth') !== -1) platClass = 'platform-truth';

        html += '<div class="rhetoric-entry ' + entryClass + '">';
        html += '<div class="rhetoric-meta">';
        html += '<span class="rhetoric-platform ' + platClass + '">' + esc(e.platform) + '</span>';
        if (e.time) html += '<span class="rhetoric-time">' + esc(e.time) + '</span>';
        html += '<span class="rhetoric-tag ' + tagClass + '">' + e.tag + '</span>';
        html += '</div>';
        html += '<blockquote class="rhetoric-quote">' + e.quote + '</blockquote>';

        if (e.tacoImpact) {
          // Impact score class
          var impScore = (e.tacoImpact.score || '').toLowerCase();
          var impClass = 'impact-moderate';
          if (impScore === 'terminal') impClass = 'impact-terminal';
          else if (impScore === 'severe') impClass = 'impact-severe';
          else if (impScore === 'negative') impClass = 'impact-negative';
          else if (impScore === 'positive') impClass = 'impact-positive';

          html += '<div class="rhetoric-taco-impact"><span class="impact-label">TACO Impact:</span> <span class="impact-score ' + impClass + '">' + e.tacoImpact.score + '</span> &mdash; ' + e.tacoImpact.detail + '</div>';
        }
        html += '</div>';
      });

      html += '</div></div>';
    });
    html += '</div>';

    // Pattern Analysis
    if (r.patterns && r.patterns.length) {
      html += '<div class="rhetoric-analysis"><h4>Rhetoric Pattern Analysis</h4><div class="rhetoric-patterns">';
      r.patterns.forEach(function(p) {
        html += '<div class="pattern-card">';
        html += '<div class="pattern-icon">' + p.icon + '</div>';
        html += '<div class="pattern-content">';
        html += '<h5>' + esc(p.title) + '</h5>';
        html += '<p>' + p.detail + '</p>';
        html += '</div></div>';
      });
      html += '</div></div>';
    }

    // Score Summary
    if (r.scoreSummary) {
      var ss = r.scoreSummary;
      html += '<div class="rhetoric-score-summary">';
      html += '<div class="rhetoric-score-box"><span class="rhetoric-score-label">Rhetoric TACO Score</span><span class="rhetoric-score-value rhetoric-score-red">' + ss.score + ' <span class="rhetoric-score-max">/ 100</span></span></div>';
      html += '<div class="rhetoric-score-box"><span class="rhetoric-score-label">Statements Analyzed</span><span class="rhetoric-score-value">' + ss.statementsAnalyzed + '</span></div>';
      html += '<div class="rhetoric-score-box"><span class="rhetoric-score-label">De-escalation Signals</span><span class="rhetoric-score-value rhetoric-score-red">' + ss.deescSignals + '</span></div>';
      html += '<div class="rhetoric-score-box"><span class="rhetoric-score-label">Platform Breakdown</span><span class="rhetoric-score-value">' + ss.platformBreakdown + '</span></div>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── 9B. HYPERLIQUID BRENTOIL ──────────────────────────────────────

  function renderHyperliquid() {
    var hl = D.hyperliquid;
    if (!hl) return;
    setHTML('#hl-price', '$' + hl.price);
    setHTML('#hl-trad-brent', '$' + hl.tradBrent);
    var spread = hl.spread;
    var spreadColor = parseFloat(spread) < 0 ? '#22c55e' : '#ef4444';
    var spreadEl = document.getElementById('hl-spread');
    if (spreadEl) {
      spreadEl.textContent = spread;
      spreadEl.style.color = spreadColor;
    }
    setHTML('#hl-volume', hl.volume);
    setHTML('#hl-commentary', hl.commentary || '');
    if (hl.badge) setHTML('#hl-badge', hl.badge);

    // Chart: HL price vs Trad Brent over time
    var canvas = document.getElementById('hlBrentChart');
    if (canvas && typeof Chart !== 'undefined' && hl.chartLabels) {
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: hl.chartLabels,
          datasets: [
            { label: 'HL BrentOIL', data: hl.chartHL, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 2, pointRadius: 2, tension: 0.3, fill: false },
            { label: 'Trad. Brent', data: hl.chartTrad, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 2, pointRadius: 2, tension: 0.3, fill: false, borderDash: [4, 2] },
            { label: 'Spread', data: hl.chartSpread, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1.5, pointRadius: 1, tension: 0.3, fill: true, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top', labels: { color: '#888', font: { size: 9, family: 'var(--font-mono)' }, boxWidth: 10, padding: 8 } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#666', font: { size: 8 }, maxRotation: 0 } },
            y: { position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888', font: { size: 9 }, callback: function(v) { return '$' + v; } } },
            y1: { position: 'right', grid: { display: false }, ticks: { color: '#ef4444', font: { size: 8 }, callback: function(v) { return v + '%'; } } }
          }
        }
      });
    }
  }

  // ── 10. MARKET SIGNALS ─────────────────────────────────────────────────────

  function renderMarketSignals() {
    var ms = D.marketSignals;

    // Futures Curve
    if (ms.futuresCurve) {
      var fc = ms.futuresCurve;
      setHTML('#ms-futures-m1', fc.m1);
      setHTML('#ms-futures-m6', fc.m6);
      setHTML('#ms-futures-m12', fc.m12);
      setHTML('#ms-futures-commentary', fc.commentary);
    }

    // Risk Reversal
    if (ms.riskReversal) {
      var rr = ms.riskReversal;
      setHTML('#ms-rr-1m', rr.oneMonth);
      setHTML('#ms-rr-3m', rr.threeMonth);
      setHTML('#ms-rr-commentary', rr.commentary);
    }

    // CDS Spreads
    if (ms.cdsSpreads) {
      var cdsBody = document.getElementById('ms-cds-body');
      if (cdsBody) {
        var cdsHtml = '';
        ms.cdsSpreads.forEach(function(row) {
          var changeColor = row.change.indexOf('+') !== -1 && parseInt(row.change.replace(/[^0-9]/g, ''), 10) > 20 ? '#ef4444' : '#f59e0b';
          cdsHtml += '<tr>';
          cdsHtml += '<td>' + esc(row.country) + '</td>';
          cdsHtml += '<td class="mono"><strong>' + row.current + '</strong></td>';
          cdsHtml += '<td class="mono">' + row.preWar + '</td>';
          cdsHtml += '<td class="mono" style="color:' + changeColor + ';">' + esc(row.change) + '</td>';
          cdsHtml += '<td style="font-size:0.68rem;color:' + changeColor + ';">' + esc(row.signal) + '</td>';
          cdsHtml += '</tr>';
        });
        cdsBody.innerHTML = cdsHtml;
      }
      setHTML('#ms-cds-commentary', ms.cdsCommentary || '');
    }

    // CFTC Positioning
    if (ms.cftc) {
      var cftc = ms.cftc;
      setHTML('#ms-cftc-badge', cftc.badge);
      setHTML('#ms-cftc-wti', cftc.wtiNetLong);
      setHTML('#ms-cftc-brent', cftc.brentNetLong);
      setHTML('#ms-cftc-commentary', cftc.commentary);
    }

    // Brent-WTI Spread
    if (ms.brentWtiSpread) {
      var bws = ms.brentWtiSpread;
      setHTML('#ms-bws-current', bws.current);
      setHTML('#ms-bws-prewar', bws.preWar);
      setHTML('#ms-bws-widening', bws.widening);
      setHTML('#ms-bws-brent', bws.brentPrice);
      setHTML('#ms-bws-wti', bws.wtiPrice);
      setHTML('#ms-bws-commentary', bws.commentary);
    }

    // Options Intelligence
    if (ms.optionsIntelligence) {
      var oi = ms.optionsIntelligence;
      setHTML('#ms-oi-badge', oi.badge);
      setHTML('#ms-oi-summary', oi.summary);
      var oiContainer = document.getElementById('ms-oi-signals');
      if (oiContainer && oi.signals) {
        var oiHtml = '';
        oi.signals.forEach(function(s) {
          oiHtml += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--color-border);">';
          oiHtml += '<span style="font-size:0.9rem;flex-shrink:0;margin-top:1px;">' + s.icon + '</span>';
          oiHtml += '<div style="flex:1;min-width:0;">';
          oiHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">';
          oiHtml += '<strong style="font-size:0.72rem;color:var(--color-text);">' + s.title + '</strong>';
          oiHtml += '<span class="badge" style="background:' + s.signalColor + '22;color:' + s.signalColor + ';border:1px solid ' + s.signalColor + '44;font-size:0.55rem;padding:1px 6px;">' + esc(s.signal) + '</span>';
          oiHtml += '</div>';
          oiHtml += '<p style="font-size:0.68rem;color:var(--color-text-muted);line-height:1.45;margin:0;">' + s.explanation + '</p>';
          oiHtml += '</div>';
          oiHtml += '</div>';
        });
        oiContainer.innerHTML = oiHtml;
      }
      setHTML('#ms-oi-bottomline', oi.bottomLine);
    }
  }

  // ── 11. OPERATIONS NARRATIVE ───────────────────────────────────────────────

  function renderOperationsNarrative() {
    var ops = D.operations;

    // Badge
    setHTML('#ops-badge', ops.badge);

    // KPI Row
    var kpiRow = document.getElementById('ops-kpi-row');
    if (kpiRow && ops.kpis) {
      var khtml = '';
      ops.kpis.forEach(function(k) {
        var kpiColorClass = k.color === 'red' ? 'kpi-red' : 'kpi-amber';
        var deltaClass = (k.delta && k.delta.indexOf('↑') !== -1) ? 'delta-up' : 'delta-down';
        khtml += '<div class="kpi-card ' + kpiColorClass + '">';
        khtml += '<span class="kpi-label">' + esc(k.label) + '</span>';
        khtml += '<span class="kpi-value">' + k.value + '</span>';
        khtml += '<span class="kpi-delta ' + deltaClass + '">' + k.delta + '</span>';
        khtml += '<span class="kpi-note">' + k.note + '</span>';
        khtml += '</div>';
      });
      kpiRow.innerHTML = khtml;
    }

    // Operational Indicators Table
    var indBody = document.getElementById('ops-indicators-body');
    if (indBody && ops.indicators) {
      var ihtml = '';
      ops.indicators.forEach(function(row) {
        ihtml += '<tr>';
        ihtml += '<td>' + esc(row.indicator) + '</td>';
        ihtml += '<td class="mono">' + row.value + '</td>';
        ihtml += '<td><span class="' + (row.dirClass || 'dir-up') + '">' + row.dir + '</span></td>';
        ihtml += '<td>' + row.notes + '</td>';
        ihtml += '</tr>';
      });
      indBody.innerHTML = ihtml;
    }

    // Pipeline Bypass
    if (ops.pipeline) {
      var p = ops.pipeline;
      setHTML('#ops-petroline-value', p.petrolineValue || '');
      setHTML('#ops-petroline-status', p.petrolineStatus || '');
      setHTML('#ops-petroline-detail', p.petrolineDetail || '');
      setHTML('#ops-adcop-value', p.adcopValue || '');
      setHTML('#ops-adcop-status', p.adcopStatus || '');
      setHTML('#ops-adcop-detail', p.adcopDetail || '');
    }

    // UAE Attack Summary
    if (ops.uaeAttackSummary) {
      var uae = ops.uaeAttackSummary;
      setHTML('#ops-uae-missiles', uae.ballisticMissiles || '');
      setHTML('#ops-uae-missiles-intercept', uae.ballisticIntercept || '');
      setHTML('#ops-uae-drones', uae.drones || '');
      setHTML('#ops-uae-drones-intercept', uae.droneIntercept || '');
      setHTML('#ops-uae-cruise', uae.cruiseMissiles || '');
      setHTML('#ops-uae-cruise-intercept', uae.cruiseIntercept || '');
      setHTML('#ops-uae-casualties-killed', uae.killed || '');
      setHTML('#ops-uae-casualties-injured', uae.injured || '');
    }

    // Iran + Gulf Neighbors breakdown
    if (ops.iranNeighbors) {
      var nbBody = document.getElementById('ops-iran-neighbors-body');
      if (nbBody) {
        var nhtml = '';
        ops.iranNeighbors.forEach(function(nb) {
          nhtml += '<tr>';
          nhtml += '<td>' + esc(nb.country) + '</td>';
          nhtml += '<td class="mono">' + (nb.missiles || '') + '</td>';
          nhtml += '<td class="mono">' + (nb.drones || '') + '</td>';
          nhtml += '<td class="mono">' + (nb.total || '') + '</td>';
          nhtml += '<td>' + (nb.notes || '') + '</td>';
          nhtml += '</tr>';
        });
        nbBody.innerHTML = nhtml;
      }
    }
  }

  // ── EXECUTE ALL ────────────────────────────────────────────────────────────

  if (D.gistBanner) renderGistBanner();
  if (D.newsNow) renderNewsNow();
  if (D.analyticalSignals) renderAnalyticalSignals();
  if (D.dLive) renderDLive();
  if (D.analyticalOutlook) renderAnalyticalOutlook();
  if (D.keyTriggers) renderKeyTriggers();
  if (D.intelligence) renderIntelligence();
  if (D.next48h) renderNext48h();
  if (D.rhetoricTracker) renderRhetoricTracker();
  if (D.hyperliquid) renderHyperliquid();
  if (D.marketSignals) renderMarketSignals();
  if (D.operations) renderOperationsNarrative();

})();
