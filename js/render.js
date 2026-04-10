// =============================================================================
// TACQUERIA RENDER ENGINE — Populates HTML from DASHBOARD_DATA
// =============================================================================
// Requires: dashboard-data.js loaded first
// Strategy:
//   - data-bind="key" attributes → textContent updates
//   - Container IDs with -body suffix → generated table rows
//   - Container IDs with -grid suffix → generated card grids
// =============================================================================

(function renderDashboard() {
  'use strict';
  var D = DASHBOARD_DATA;

  // ── UTILITY HELPERS ──────────────────────────────────────────────────────

  function setText(selector, text) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = text;
    }
  }

  function setHTML(selector, html) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      els[i].innerHTML = html;
    }
  }

  function bindText(key, text) {
    setText('[data-bind="' + key + '"]', text);
  }

  function bindHTML(key, html) {
    setHTML('[data-bind="' + key + '"]', html);
  }

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── META VALUES ──────────────────────────────────────────────────────────

  function renderMeta() {
    var m = D.meta;
    bindText('meta-timestamp', m.timestamp);
    bindText('meta-day', 'DAY ' + m.day);
    bindText('meta-daydate', m.dayDate);
    bindText('meta-version', m.version);

    // Gist banner day/date line
    bindHTML('meta-gist-line', 'DAY ' + m.day + ' &middot; ' + m.dayDate + ' &middot; LIVE DATA');
    bindHTML('meta-gist-taco', 'TACO ' + m.tacoScore + '/100 &middot; ' + m.tacoRegimeLabel.replace('/', '&#47;'));

    // Prediction markets timestamp badge
    bindText('pm-timestamp', m.timestamp);

    // Footer
    var footerTs = document.getElementById('footer-timestamp');
    if (footerTs) {
      footerTs.innerHTML = 'Tacqueria v' + esc(m.version) + ' &middot; Data as of <span id="footer-date"></span>';
    }
  }

  // ── COMPACT MARKET STRIP (Overview tab) ──────────────────────────────────

  function renderMarketStrip() {
    var container = document.getElementById('market-strip-grid');
    if (!container) return;

    var html = '';
    D.marketStrip.forEach(function(item) {
      var bgAlpha = item.color === 'red' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)';
      var bdAlpha = item.color === 'red' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)';
      var deltaColor = item.delta.indexOf('↑') !== -1 || item.delta.indexOf('+') !== -1 ? '#ef4444' : '#22c55e';
      if (item.isSpecial) deltaColor = '#ef4444';

      var valueColor = item.isSpecial ? '#ef4444' : 'var(--color-text)';

      html += '<div style="padding:8px 10px;background:' + bgAlpha + ';border:1px solid ' + bdAlpha + ';border-radius:7px;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.58rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.06em;">' + esc(item.label) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:1.05rem;font-weight:700;color:' + valueColor + ';line-height:1.2;">' + esc(item.value) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.68rem;color:' + deltaColor + ';">' + item.delta + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── FINANCIAL KPIs (Market Signals tab) ──────────────────────────────────

  function renderKPIs() {
    var container = document.getElementById('kpi-row-1');
    var container2 = document.getElementById('kpi-row-2');
    if (!container || !container2) return;

    var kpiKeys1 = ['brent', 'wti', 'tnx', 'vix'];
    var kpiKeys2 = ['hyg', 'gold', 'brentWtiSpread', 'ita'];

    function renderKPIRow(keys, target) {
      var html = '';
      keys.forEach(function(key) {
        var k = D.kpis[key];
        var priceStr = k.noDollar ? k.price.toFixed(2) : '$' + (k.formatComma ? k.price.toLocaleString() : k.price.toFixed(2));
        if (k.isPercent) priceStr = k.price.toFixed(2) + '%';
        var isUp = k.change >= 0;
        var deltaClass = isUp ? 'delta-up' : 'delta-down';
        var arrow = isUp ? '↑' : '↓';
        var sign = isUp ? '+' : '';
        var changeStr = k.noDollar || k.isPercent ? sign + k.change.toFixed(2) : sign + '$' + Math.abs(k.change).toFixed(2);
        var pctStr = '(' + sign + k.changePct.toFixed(2) + '%)';

        html += '<div class="kpi-card ' + esc(k.cssClass) + '">';
        html += '<span class="kpi-label">' + esc(k.label) + '</span>';
        html += '<span class="kpi-value">' + priceStr + '</span>';
        html += '<span class="kpi-delta ' + deltaClass + '">' + arrow + ' ' + changeStr + ' ' + pctStr + '</span>';
        html += '<details class="kpi-note-toggle"><summary>Details</summary><span class="kpi-note">' + esc(k.note) + '</span></details>';
        html += '</div>';
      });
      target.innerHTML = html;
    }

    renderKPIRow(kpiKeys1, container);
    renderKPIRow(kpiKeys2, container2);

    // ETF row (3rd row, smaller)
    var etfRow = document.getElementById('kpi-row-etf');
    var etfData = D.chartData && D.chartData.etfs;
    if (etfRow && etfData) {
      var etfMeta = [
        { key: 'ITA', label: 'ITA', name: 'Aerospace & Defense', tag: 'WAR +', tagClass: 'beneficiary' },
        { key: 'XLE', label: 'XLE', name: 'Energy Select', tag: 'WAR +', tagClass: 'beneficiary' },
        { key: 'XOP', label: 'XOP', name: 'Oil & Gas E&P', tag: 'WAR +', tagClass: 'beneficiary' },
        { key: 'GLD', label: 'GLD', name: 'Gold Shares', tag: 'HAVEN', tagClass: 'haven' },
        { key: 'TLT', label: 'TLT', name: '20+ Year Treasury', tag: 'HAVEN', tagClass: 'haven' }
      ];
      var eh = '';
      etfMeta.forEach(function(m) {
        var e = etfData[m.key];
        if (!e) return;
        var prices = e.prices;
        var cur = prices[prices.length - 1];
        var start = prices[0];
        var pct = ((cur - start) / start * 100).toFixed(1);
        var isUp = cur >= start;
        var arrow = isUp ? '\u2191' : '\u2193';
        var sign = isUp ? '+' : '';
        var deltaColor = isUp ? 'var(--color-green)' : 'var(--color-red)';
        var tagBg = m.tagClass === 'beneficiary' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
        var tagColor = m.tagClass === 'beneficiary' ? '#22c55e' : '#f59e0b';
        eh += '<div class="kpi-card-etf">';
        eh += '<div class="kpi-etf-top">';
        eh += '<span class="kpi-etf-ticker">' + m.key + '</span>';
        eh += '<span class="kpi-etf-tag" style="background:' + tagBg + ';color:' + tagColor + ';">' + m.tag + '</span>';
        eh += '</div>';
        eh += '<div class="kpi-etf-name">' + m.name + '</div>';
        eh += '<div class="kpi-etf-price">$' + cur + '</div>';
        eh += '<div class="kpi-etf-delta" style="color:' + deltaColor + ';">' + arrow + ' ' + sign + pct + '%</div>';
        eh += '</div>';
      });
      etfRow.innerHTML = eh;
    }
  }

  // ── OVERVIEW PREDICTION MARKET CONSENSUS ─────────────────────────────────

  function renderOverviewPredMktCards() {
    var container = document.getElementById('overview-predmkt-consensus');
    if (!container) return;

    var html = '';
    D.overviewPredMktCards.forEach(function(c) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--color-border);border-radius:6px;">';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:0.72rem;font-weight:600;color:var(--color-text);">' + esc(c.title) + '</div>';
      html += '<div style="font-size:0.65rem;color:var(--color-text-faint);">' + esc(c.detail) + '</div>';
      html += '</div>';
      html += '<div style="text-align:right;flex-shrink:0;">';
      html += '<div style="font-family:var(--font-mono);font-size:1rem;font-weight:700;color:var(--color-text);">' + esc(c.prob) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.7rem;color:' + c.deltaColor + ';">' + c.delta + '</div>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  // ── OVERVIEW TACO SUB-SCORES ─────────────────────────────────────────────

  function renderOverviewTacoSubScores() {
    var container = document.getElementById('overview-taco-subscores');
    if (!container) return;

    var keys = ['reversibility', 'rhetoric', 'diplomatic', 'marketImpl', 'historical', 'domPolitical'];
    var html = '';
    keys.forEach(function(key) {
      var s = D.tacoSubScoresOverview[key];
      var scoreColor = s.score <= 10 ? '#ef4444' : '#f59e0b';
      html += '<div>';
      html += '<div style="font-size:0.58rem;color:var(--color-text-faint);font-family:var(--font-mono);text-transform:uppercase;">' + esc(s.label) + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:' + scoreColor + ';">' + s.score + '/100</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── OVERVIEW COMPOSITE TACO ──────────────────────────────────────────────

  function renderOverviewComposite() {
    var m = D.meta;
    bindHTML('overview-taco-score', m.tacoScore + '<span style="font-size:0.9rem;color:var(--color-text-faint);font-weight:400;">/' + m.tacoMax + '</span>');
    bindHTML('overview-taco-delta', '&#x2193; from ' + m.tacoPrev + ' (D' + m.tacoPrevDay + ') &rarr; 8 (D12) &middot; Kharg Island bombed + Brent $103');
  }

  // ── SIGNAL CARDS (Prediction Markets tab) ────────────────────────────────

  function renderSignalCards() {
    var container = document.getElementById('pm-signal-grid');
    if (!container) return;

    var html = '';
    D.predictionMarkets.signalCards.forEach(function(c) {
      html += '<div class="signal-card signal-' + c.color + '">';
      html += '<div class="signal-header">' + esc(c.header) + '</div>';
      html += '<div class="signal-prob">' + c.prob + '%</div>';
      html += '<div class="signal-detail">' + esc(c.detail) + '</div>';
      html += '<div class="signal-vol">' + esc(c.vol) + '</div>';
      html += '<div class="prob-bar"><div class="prob-fill prob-fill-' + c.color + '" style="width:' + c.prob + '%"></div></div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ── GENERIC PREDICTION MARKET TABLE RENDERER ─────────────────────────────

  function renderPMTable(containerId, rows) {
    var tbody = document.getElementById(containerId);
    if (!tbody) return;

    var html = '';
    rows.forEach(function(r) {
      var rowClass = r.rowClass ? ' class="' + r.rowClass + '"' : '';
      var probClass = r.probClass ? ' ' + r.probClass : '';
      html += '<tr' + rowClass + '>';
      html += '<td>' + esc(r.contract) + '</td>';
      html += '<td class="pm-prob' + probClass + '">' + esc(r.prob) + '</td>';
      html += '<td><div class="prob-bar-sm"><div class="prob-fill prob-fill-' + r.fillColor + '" style="width:' + r.fillWidth + '"></div></div></td>';
      html += '<td>' + esc(r.volume) + '</td>';
      html += '<td class="pm-src ' + r.platformClass + '">' + esc(r.platform) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ── LIQUIDITY-ADJUSTED TABLE ─────────────────────────────────────────────

  function renderLiquidityTable() {
    var tbody = document.getElementById('pm-liquidity-body');
    if (!tbody) return;

    var html = '';
    D.predictionMarkets.liquidityTable.forEach(function(r) {
      html += '<tr>';
      html += '<td>' + esc(r.contract) + '</td>';
      html += '<td><span class="pm-prob">' + esc(r.rawPrice) + '</span></td>';
      html += '<td class="mono">' + esc(r.volume) + '</td>';
      html += '<td><div class="liq-bar-wrap"><div class="liq-bar" style="width:' + r.liqWidth + ';background:' + r.liqColor + ';"></div></div><span class="liq-score" style="color:' + r.liqColor + ';">' + esc(r.liqLabel) + '</span></td>';
      html += '<td><span class="vol-adj-prob" style="color:' + r.adjProbColor + ';">' + esc(r.adjProb) + '</span> <span class="vol-adj-delta">' + esc(r.adjDelta) + '</span></td>';
      html += '<td class="mono" style="color:' + r.volDeltaColor + ';">' + r.volDelta + '</td>';
      html += '<td><span class="sig-quality ' + r.sigClass + '">' + r.sigQuality + '</span></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ── PLATFORM COMPARISON TABLE ────────────────────────────────────────────

  function renderComparisonTable() {
    var tbody = document.getElementById('pm-comparison-body');
    if (!tbody) return;

    var html = '';
    D.predictionMarkets.comparison.forEach(function(r) {
      var spreadClass = r.spreadClass ? ' ' + r.spreadClass : '';
      html += '<tr>';
      html += '<td>' + esc(r.contract) + '</td>';
      html += '<td class="pm-prob">' + esc(r.poly) + '</td>';
      html += '<td class="pm-prob">' + esc(r.kalshi) + '</td>';
      html += '<td class="pm-spread' + spreadClass + '">' + esc(r.spread) + '</td>';
      html += '<td>' + esc(r.signal) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ── TACO INPUTS TABLE ────────────────────────────────────────────────────

  function renderTacoInputs() {
    var tbody = document.getElementById('taco-inputs-body');
    if (!tbody) return;

    var html = '';
    D.tacoInputs.forEach(function(r) {
      var rowClass = r.isNew ? ' class="rhetoric-row-highlight"' : '';
      html += '<tr' + rowClass + '>';
      html += '<td><strong>' + esc(r.name) + '</strong>';
      if (r.isNew) html += ' <span class="new-indicator-badge">NEW</span>';
      html += '<br><span class="taco-subdesc">' + esc(r.subDesc) + '</span></td>';
      html += '<td class="mono">' + esc(r.weight) + '</td>';
      html += '<td>' + esc(r.signal);
      if (r.hasRhetoricLink) {
        html += ' <a href="#" onclick="document.querySelector(\'.rhetoric-tracker-card\').scrollIntoView({behavior:\'smooth\'});return false;" class="rhetoric-link">See full tracker below &darr;</a>';
      }
      html += '</td>';
      html += '<td class="mono"><span class="taco-score-cell ' + r.scoreClass + '">' + r.score + '</span>/100</td>';
      html += '<td class="mono">' + esc(r.weighted) + '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;

    // Update composite score in tfoot
    var tfoot = document.getElementById('taco-inputs-tfoot');
    if (tfoot) {
      tfoot.innerHTML = '<tr><td colspan="3"><strong>COMPOSITE TACO SCORE</strong></td><td class="mono" colspan="2"><strong class="taco-composite">' + D.meta.tacoScore + '.0 / 100</strong></td></tr>';
    }
  }

  // ── TACO GAUGE VALUES ────────────────────────────────────────────────────

  function renderTacoGauge() {
    var m = D.meta;

    // Score text inside SVG gauge
    var scoreText = document.getElementById('tacoScoreText');
    if (scoreText) scoreText.textContent = m.tacoScore;

    // Badge
    var badge = document.getElementById('tacoBadge');
    if (badge) badge.textContent = m.tacoBadgeText;

    // TACO inputs badge
    bindHTML('taco-inputs-badge', 'COMPOSITE: ' + m.tacoScore + '/100 &middot; D' + m.day);
  }

  // ── TACO ANALYTICS KPIs ──────────────────────────────────────────────────

  function renderTacoAnalyticsKPIs() {
    var a = D.tacoAnalytics;
    bindText('taco-mom-value', a.momentum.value);
    bindText('taco-mom-note', a.momentum.note);
    bindText('taco-regime-value', a.regime.value);
    bindText('taco-regime-note', a.regime.note);
    bindText('taco-lag-value', a.lagSignal.value);
    bindText('taco-lag-note', a.lagSignal.note);
    bindText('taco-trigger-value', a.nextTrigger.value);
    bindText('taco-trigger-note', a.nextTrigger.note);
  }

  // ── WIRE TACO_CONFIG from DASHBOARD_DATA ─────────────────────────────────

  function wireTacoConfig() {
    // Expose as global for charts.js and taco-analytics.js
    window.TACO_CONFIG = D.tacoConfig;
  }

  // ── EXECUTE ALL RENDERS ──────────────────────────────────────────────────

  wireTacoConfig();
  // ── TROOP DEPLOYMENT COUNTER ─────────────────────────────────────────
  function renderTroopCounter() {
    var container = document.getElementById('troop-counter-items');
    if (!container || !D.troopCounter) return;
    var html = '';
    D.troopCounter.forEach(function(item) {
      html += '<div style="text-align:center;">';
      html += '<div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:' + (item.color || '#3b82f6') + ';line-height:1.1;">' + item.value + '</div>';
      html += '<div style="font-family:var(--font-mono);font-size:0.42rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.06em;line-height:1.3;">' + item.label + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  renderTroopCounter();
  renderMeta();
  renderMarketStrip();
  renderOverviewComposite();
  renderOverviewTacoSubScores();
  renderOverviewPredMktCards();
  renderKPIs();
  renderSignalCards();
  renderLiquidityTable();
  renderPMTable('pm-ceasefire-body', D.predictionMarkets.ceasefire);
  renderPMTable('pm-oil-body', D.predictionMarkets.oil);
  renderPMTable('pm-hormuz-body', D.predictionMarkets.hormuz);
  renderPMTable('pm-regime-body', D.predictionMarkets.regime);
  renderPMTable('pm-escalation-body', D.predictionMarkets.escalation);
  renderPMTable('pm-nuclear-body', D.predictionMarkets.nuclear);
  renderComparisonTable();
  renderTacoInputs();
  renderTacoGauge();
  renderTacoAnalyticsKPIs();

})();

// --- Stat Model Consensus → Regime Flag Bridge + Blended TACO ---
function updateStatModelRegimeFlag() {
  var smc = window.STAT_MODEL_CONSENSUS;
  if (!smc) return;
  var D = DASHBOARD_DATA;
  var taco = D.chartData.taco;
  var brent = D.chartData.brent;
  var N = taco.length;

  // === 1. UPDATE STAT MODEL REGIME FLAG ===
  var flagEl = document.getElementById('regime-flag-statmodel');
  if (flagEl) {
    var flagClass = smc.composite <= 40 ? 'regime-flag-red' : smc.composite >= 60 ? 'regime-flag-green' : 'regime-flag-amber';
    var dotClass = smc.composite <= 40 ? 'red' : smc.composite >= 60 ? 'green' : 'amber';
    flagEl.className = 'regime-flag ' + flagClass;
    var dotEl = document.getElementById('regime-dot-statmodel');
    if (dotEl) dotEl.className = 'regime-dot ' + dotClass;
    var readingEl = document.getElementById('regime-reading-statmodel');
    if (readingEl) readingEl.textContent = smc.composite + '/100';
    var predEl = document.getElementById('regime-pred-statmodel');
    if (predEl) predEl.textContent = smc.direction + ' · ' + smc.readyCount + '/' + smc.totalModels + ' models · ' + smc.confidence;
  }

  // === 2. UPDATE ALL REGIME FLAGS FROM LIVE DATA ===
  var currentTACO = taco[N - 1];
  var brentDay1 = brent[0];
  var brentNow = brent[N - 1];
  var brentPct = ((brentNow / brentDay1) - 1) * 100;
  var vix = D.chartData.vix;
  var vixDay1 = vix[0];
  var vixNow = vix[N - 1];
  var vixPct = (vixNow / vixDay1) * 100;

  // Momentum: count consecutive days of TACO change
  var streak = 0;
  var lastDelta = 0;
  for (var i = N - 1; i >= 1; i--) {
    var d = taco[i] - taco[i - 1];
    if (i === N - 1) { lastDelta = d; streak = 1; }
    else if ((d < 0 && lastDelta < 0) || (d > 0 && lastDelta > 0) || (d === 0 && lastDelta === 0)) { streak++; }
    else break;
  }
  var momentumStr = (lastDelta >= 0 ? '+' : '') + lastDelta.toFixed(1) + ' ×' + streak + 'd';

  // Reversibility from tacoConfig
  var revScore = D.tacoConfig && D.tacoConfig.indicators && D.tacoConfig.indicators.reversibility
    ? D.tacoConfig.indicators.reversibility.score : '?';

  // False floor: check if TACO stabilized then dropped
  var falseFloor = 'Not detected';
  if (N >= 10) {
    var mid = taco.slice(Math.max(0, N - 10), N - 3);
    var recent = taco.slice(N - 3);
    var midAvg = mid.reduce(function(a, b) { return a + b; }, 0) / mid.length;
    var recentAvg = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
    if (recentAvg > midAvg + 0.5) falseFloor = 'Rising from floor';
    else if (recentAvg < midAvg - 0.5) falseFloor = 'Confirmed';
    else falseFloor = 'Stable';
  }

  // Rhetoric score from tacoConfig
  var rhetScore = D.tacoConfig && D.tacoConfig.indicators && D.tacoConfig.indicators.rhetoricIntensity
    ? D.tacoConfig.indicators.rhetoricIntensity.score : '?';

  // Update each flag
  var flags = [
    { idx: 0, reading: currentTACO + '/100', prediction: currentTACO < 10 ? 'Attrition regime active' : 'Above threshold', cls: currentTACO < 10 ? 'red' : currentTACO < 20 ? 'amber' : 'green' },
    { idx: 1, reading: momentumStr, prediction: streak >= 7 ? 'Sustained trend · no reversal signal' : streak >= 3 ? 'Short streak' : 'No clear trend', cls: (lastDelta < 0 && streak >= 7) ? 'red' : (lastDelta < 0 && streak >= 3) ? 'amber' : 'green' },
    { idx: 2, reading: revScore + '/100', prediction: revScore < 5 ? 'Structural lock-in' : revScore < 15 ? 'Limited reversibility' : 'Reversible', cls: revScore < 5 ? 'red' : revScore < 15 ? 'amber' : 'green' },
    { idx: 3, reading: '+' + brentPct.toFixed(1) + '%', prediction: brentPct > 10 ? 'Supply shock confirmed' : 'Below threshold', cls: brentPct > 10 ? 'red' : brentPct > 5 ? 'amber' : 'green' },
    { idx: 4, reading: vixPct.toFixed(1) + '%', prediction: vixPct > 135 ? 'Equity stress' : vixPct > 110 ? 'Elevated' : 'Complacency risk', cls: vixPct > 135 ? 'red' : vixPct > 110 ? 'amber' : 'green' },
    { idx: 5, reading: falseFloor, prediction: falseFloor === 'Confirmed' ? 'Bear trap · deep grind' : falseFloor === 'Rising from floor' ? 'Recovery underway' : 'Stable', cls: falseFloor === 'Confirmed' ? 'red' : falseFloor === 'Rising from floor' ? 'green' : 'amber' },
    { idx: 6, reading: rhetScore + '/100', prediction: rhetScore < 5 ? 'Rhetoric = noise' : rhetScore < 20 ? 'Moderate signal' : 'Strong signal', cls: rhetScore < 5 ? 'green' : rhetScore < 20 ? 'amber' : 'red' }
  ];

  var regimeContainer = document.querySelector('.regime-flag:not(#regime-flag-statmodel)');
  if (regimeContainer) {
    var allFlags = regimeContainer.parentElement.querySelectorAll('.regime-flag:not(#regime-flag-statmodel)');
    flags.forEach(function(f) {
      var el = allFlags[f.idx];
      if (!el) return;
      el.className = 'regime-flag regime-flag-' + f.cls;
      var dot = el.querySelector('.regime-dot');
      if (dot) dot.className = 'regime-dot ' + f.cls;
      var reading = el.querySelector('.regime-reading');
      if (reading) reading.textContent = f.reading;
      var pred = el.querySelector('.regime-prediction');
      if (pred) pred.textContent = f.prediction;
    });
  }

  // Count triggered flags
  var triggered = flags.filter(function(f) { return f.cls === 'red'; }).length;
  var amber = flags.filter(function(f) { return f.cls === 'amber'; }).length;
  // Add stat model flag
  if (smc.composite <= 40) triggered++;
  else if (smc.composite < 60) amber++;

  // === 3. BLENDED TACO SCORE (Option A) ===
  // 80% analytical + 20% stat consensus (when ≥4 models active)
  // With <4 models: 90/10. With <2 models: 100/0 (advisory only)
  var analyticalScore = D.meta.tacoScore;
  var statScore = smc.composite / 100 * D.meta.tacoMax; // scale 0-100 consensus to 0-tacoMax
  var statWeight = smc.readyCount >= 4 ? 0.20 : smc.readyCount >= 2 ? 0.10 : 0;
  var analyticalWeight = 1 - statWeight;
  var blendedScore = Math.round(analyticalWeight * analyticalScore + statWeight * statScore);
  var adjustment = blendedScore - analyticalScore;

  // Show blended score indicator
  var blendEl = document.getElementById('taco-blend-indicator');
  if (blendEl) {
    if (statWeight > 0) {
      var adjStr = adjustment >= 0 ? '+' + adjustment : '' + adjustment;
      var adjColor = adjustment > 0 ? '#22c55e' : adjustment < 0 ? '#ef4444' : 'var(--color-text-faint)';
      blendEl.innerHTML = '<div style="padding:8px 12px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.15);border-radius:6px;margin-top:8px;">' +
        '<div style="font-family:var(--font-mono);font-size:0.58rem;color:#8b5cf6;text-transform:uppercase;letter-spacing:0.04em;">Quantitative Adjustment (Layer 2)</div>' +
        '<div style="display:flex;align-items:baseline;gap:8px;margin-top:2px;">' +
          '<span style="font-size:0.85rem;color:var(--color-text-muted);">Analytical: <b>' + analyticalScore + '</b></span>' +
          '<span style="font-size:0.75rem;color:var(--color-text-faint);">×' + (analyticalWeight * 100).toFixed(0) + '%</span>' +
          '<span style="font-size:0.75rem;color:var(--color-text-faint);">+</span>' +
          '<span style="font-size:0.85rem;color:#8b5cf6;">Stat: <b>' + (statScore).toFixed(1) + '</b></span>' +
          '<span style="font-size:0.75rem;color:var(--color-text-faint);">×' + (statWeight * 100).toFixed(0) + '%</span>' +
          '<span style="font-size:0.75rem;color:var(--color-text-faint);">=</span>' +
          '<span style="font-size:1rem;font-weight:800;color:' + adjColor + ';">' + blendedScore + '</span>' +
          '<span style="font-size:0.7rem;color:' + adjColor + ';font-family:var(--font-mono);">' + (adjustment !== 0 ? '(' + adjStr + ' from analytical)' : '(no change)') + '</span>' +
        '</div>' +
        '<div style="font-size:0.62rem;color:var(--color-text-faint);margin-top:4px;">' + smc.readyCount + '/' + smc.totalModels + ' models active → stat weight ' + (statWeight * 100).toFixed(0) + '%. At 4+ models: 20%. At 2-3 models: 10%. Below 2: advisory only (0%).</div>' +
      '</div>';
    } else {
      blendEl.innerHTML = '<div style="padding:6px 12px;background:rgba(100,116,139,0.06);border:1px solid rgba(100,116,139,0.1);border-radius:6px;margin-top:8px;font-size:0.65rem;color:var(--color-text-faint);">' +
        'Stat model consensus: advisory only (' + smc.readyCount + '/' + smc.totalModels + ' models active, need ≥2 for quantitative adjustment).' +
      '</div>';
    }
  }

  // Export blended score
  window.TACO_BLENDED = { analytical: analyticalScore, stat: statScore, blended: blendedScore, adjustment: adjustment, statWeight: statWeight };
}
