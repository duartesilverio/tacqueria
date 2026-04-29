// ===== FINANCIAL MICROSTRUCTURE CHARTS =====
function initMicrostructureCharts() {
  var ttOpts = { backgroundColor: 'rgba(10,15,26,0.97)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 };
  var gridX = { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { font: { size: 9 }, color: '#64748b' } };
  var gridY = { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { font: { family: "'JetBrains Mono',monospace", size: 9 }, color: '#64748b' } };
  var lgnd = { position: 'top', labels: { font: { size: 10 }, boxWidth: 12 } };

  // ① BRENT FUTURES CURVE
  var fcCtx = document.getElementById('futuresCurveChart');
  if (fcCtx) {
    new Chart(fcCtx.getContext('2d'), {
      type: 'line',
      data: { labels: ['Jun (M1)', 'Jul (M2)', 'Aug (M3)', 'Sep (M4)', 'Dec (M6)', 'Mar27 (M9)', 'Jun27 (M12)'], datasets: [
        { label: 'Day 42 (10 Apr) — Ceasefire', data: [96.06, 94.50, 92.80, 91.20, 88.50, 85.80, 83.00], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 2.5, pointRadius: 4, fill: true, tension: 0.3 },
        { label: 'Pre-war baseline', data: [73.80, 73.50, 73.20, 72.90, 72.40, 71.80, 71.20], borderColor: '#475569', borderDash: [5,4], borderWidth: 1.5, pointRadius: 3, fill: false, tension: 0.3 }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts,
          annotation: { annotations: { bkwd: { type: 'line', yMin: 98.27, yMax: 98.27, borderColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderDash: [3,3] } } }
        },
        scales: { x: gridX, y: { grid: gridY.grid, ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return '$' + v; } } } }
      }
    });
  }

  // ② OPTIONS SKEW (25-delta RR history)
  var osCtx = document.getElementById('optionsSkewChart');
  if (osCtx) {
    new Chart(osCtx.getContext('2d'), {
      type: 'line',
      data: { labels: ['D1','D3','D5','D7','D9','D11','D13','D15','D17','D19','D21','D23','D25','D27','D29','D31','D33','D35','D37','D39','D41','D42','D45','D47','D49','D51','D53','D55','D57','D59','D61'], datasets: [
        { label: '1M Risk Reversal', data: [-0.5,4.8,7.6,5.9,4.2,4.7,4.8,5.2,5.4,6.8,6.2,5.8,5.5,5.1,4.8,4.5,4.2,3.8,2.8,3.2,3.6,3.8,3.7,3.6,3.5,3.5,3.6,3.7,3.8,3.9,4.0], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.4 },
        { label: '3M Risk Reversal', data: [-0.5,2.8,3.8,3.4,2.8,3.0,2.9,3.1,3.2,3.8,3.5,3.3,3.1,3.0,2.8,2.7,2.6,2.5,2.2,2.5,2.8,2.9,2.9,2.8,2.8,2.8,2.9,2.9,3.0,3.0,3.0], borderColor: '#f59e0b', borderWidth: 2, borderDash: [5,4], pointRadius: 3, fill: false, tension: 0.4 }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts,
          annotation: { annotations: {
            zero: { type: 'line', yMin: 0, yMax: 0, borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, borderDash: [3,3] },
            prewar: { type: 'line', yMin: -0.5, yMax: -0.5, borderColor: 'rgba(71,85,105,0.5)', borderWidth: 1, borderDash: [4,4], label: { content: 'Pre-war', display: true, position: 'end', font: { size: 8 }, color: '#64748b', padding: 2 } }
          }}
        },
        scales: { x: gridX, y: { grid: gridY.grid, title: { display: true, text: 'Vol pts (call − put)', font: { size: 9 }, color: '#475569' },
          ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return (v > 0 ? '+' : '') + v; } } } }
      }
    });
  }

  // ③ CDS SPREADS
  var cdsCtx = document.getElementById('cdsChart');
  if (cdsCtx) {
    new Chart(cdsCtx.getContext('2d'), {
      type: 'line',
      data: { labels: ['Pre-war','D1','D5','D9','D13','D17','D19','D23','D27','D31','D35','D39','D42','D45','D49','D53','D57','D61'], datasets: [
        { label: 'Saudi Arabia', data: [52,55,70,82,88,92,95,98,100,96,92,88,85,82,78,75,73,72],       borderColor: '#f59e0b', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'UAE',          data: [45,42,55,65,72,78,120,115,110,105,100,98,95,90,85,82,80,78],    borderColor: '#38bdf8', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Israel',       data: [78,95,120,142,156,168,175,180,178,172,165,158,152,148,142,138,135,132], borderColor: '#ef4444', borderWidth: 2.5, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Iran',         data: [450,620,980,1400,1850,2200,2950,2800,2600,2400,2250,2150,2100,2050,1980,1920,1880,1850],borderColor: '#8b5cf6', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Qatar',        data: [48,40,45,50,54,58,62,68,72,74,73,72,72,71,70,69,68,68],         borderColor: '#22c55e', borderWidth: 2, borderDash: [5,4], pointRadius: 3, fill: false, tension: 0.4 }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts },
        scales: { x: gridX, y: { grid: gridY.grid, title: { display: true, text: '5Y CDS (bps)', font: { size: 9 }, color: '#475569' },
          ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return v + ' bps'; } } } }
      }
    });
  }

  // ④ CFTC NET SPECULATIVE POSITIONING
  var cftcCtx = document.getElementById('cftcChart');
  if (cftcCtx) {
    new Chart(cftcCtx.getContext('2d'), {
      type: 'bar',
      data: { labels: ['4-Feb','18-Feb','4-Mar','11-Mar','18-Mar','25-Mar','1-Apr','8-Apr (ceasefire)','15-Apr','22-Apr','29-Apr'], datasets: [
        { label: 'WTI Net Long (K contracts)',   data: [182,176,210,235,248,252,240,185,178,172,170], backgroundColor: 'rgba(245,158,11,0.5)', borderColor: '#f59e0b', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Brent Net Long (K contracts)', data: [155,158,182,265,280,275,258,195,188,182,180], backgroundColor: 'rgba(56,189,248,0.4)',  borderColor: '#38bdf8', borderWidth: 1.5, borderRadius: 3 }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts,
          annotation: { annotations: { warStart: { type: 'line', xMin: 4.5, xMax: 4.5, borderColor: 'rgba(239,68,68,0.4)', borderWidth: 1.5, borderDash: [4,3],
            label: { content: 'War starts', display: true, position: 'start', font: { size: 8 }, color: '#ef4444', padding: 2 } } } }
        },
        scales: { x: gridX, y: { grid: gridY.grid, title: { display: true, text: 'Net long (000s contracts)', font: { size: 9 }, color: '#475569' },
          ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return v + 'K'; } } } }
      }
    });
  }

  // ⑤ BRENT–WTI SPREAD
  var bwsCtx = document.getElementById('bwsChart');
  if (bwsCtx) {
    new Chart(bwsCtx.getContext('2d'), {
      type: 'line',
      data: (function() {
        // Read from chartData if defined; fall back to inline hardcoded otherwise.
        var d = (typeof DASHBOARD_DATA !== 'undefined' && DASHBOARD_DATA.chartData) ? DASHBOARD_DATA.chartData : null;
        var bwsLabels = (d && d.bwsLabels) ? d.bwsLabels : ['Pre-war','D1','D3','D5','D7','D9','D11','D13','D15','D17','D19','D21','D23','D25','D27','D29','D31','D33','D35','D37','D39','D41','D42','D45','D47','D49','D51','D53','D55','D57','D59','D61'];
        var bwsHistory = (d && d.bwsHistory) ? d.bwsHistory : [3.4,6.9,8.5,5.2,3.2,5.4,1.7,4.7,5.0,5.1,17.6,14.2,10.5,8.3,6.2,4.8,3.5,2.8,1.5,-3.8,-5.1,-1.5,-1.9,0.5,1.8,2.6,3.2,3.7,4.0,4.3,4.4,4.5];
        var prewar = bwsHistory.map(function(){ return 3.4; });
        return { labels: bwsLabels, datasets: [
          { label: 'Brent–WTI Spread ($)', data: bwsHistory, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.35 },
          { label: 'Pre-war normal', data: prewar, borderColor: '#475569', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false }
        ] };
      })(),
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts,
          annotation: { annotations: {
            danger: { type: 'line', yMin: 15, yMax: 15, borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1, borderDash: [3,3],
              label: { content: 'Structural dislocation', display: true, position: 'end', font: { size: 8 }, color: '#ef4444', padding: 2 } },
            ceasefire: { type: 'line', xMin: 18.5, xMax: 18.5, borderColor: 'rgba(34,197,94,0.4)', borderWidth: 1.5, borderDash: [4,3],
              label: { content: 'Ceasefire', display: true, position: 'start', font: { size: 8 }, color: '#22c55e', padding: 2 } }
          }}
        },
        scales: { x: gridX, y: { grid: gridY.grid, title: { display: true, text: '$/barrel spread', font: { size: 9 }, color: '#475569' },
          ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return '$' + v; } } } }
      }
    });
  }
}
