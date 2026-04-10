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
      data: { labels: ['Apr (M1)', 'May (M2)', 'Jun (M3)', 'Jul (M4)', 'Sep (M6)', 'Dec (M9)', 'Mar27 (M12)'], datasets: [
        { label: 'Day 13 (12 Mar)', data: [98.27, 96.10, 94.30, 92.80, 89.40, 86.20, 82.15], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 2.5, pointRadius: 4, fill: true, tension: 0.3 },
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
      data: { labels: ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'], datasets: [
        { label: '1M Risk Reversal', data: [-0.5,2.1,4.8,8.2,7.6,6.3,5.9,5.4,4.2,4.5,4.7,4.9,4.8], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.4 },
        { label: '3M Risk Reversal', data: [-0.5,1.2,2.8,4.1,3.8,3.5,3.4,3.2,2.8,2.9,3.0,2.9,2.9], borderColor: '#f59e0b', borderWidth: 2, borderDash: [5,4], pointRadius: 3, fill: false, tension: 0.4 }
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
      data: { labels: ['Pre-war','D1','D3','D5','D7','D9','D11','D13'], datasets: [
        { label: 'Saudi Arabia', data: [42,55,62,70,78,82,86,88],       borderColor: '#f59e0b', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'UAE',          data: [35,42,48,55,60,65,70,72],       borderColor: '#38bdf8', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Israel',       data: [78,95,108,120,132,142,150,156], borderColor: '#ef4444', borderWidth: 2.5, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Iraq',         data: [195,220,245,268,282,295,304,310],borderColor: '#8b5cf6', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4 },
        { label: 'Qatar',        data: [38,40,42,45,48,50,52,54],       borderColor: '#22c55e', borderWidth: 2, borderDash: [5,4], pointRadius: 3, fill: false, tension: 0.4 }
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
      data: { labels: ['4-Feb','11-Feb','18-Feb','25-Feb','4-Mar','10-Mar (war)'], datasets: [
        { label: 'WTI Net Long (K contracts)',   data: [182,179,176,185,210,218], backgroundColor: 'rgba(245,158,11,0.5)', borderColor: '#f59e0b', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Brent Net Long (K contracts)', data: [155,152,158,160,182,196], backgroundColor: 'rgba(56,189,248,0.4)',  borderColor: '#38bdf8', borderWidth: 1.5, borderRadius: 3 }
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
      data: { labels: ['Pre-war','D1','D3','D5','D7','D9','D11','D13','D15','D17','D19'], datasets: [
        { label: 'Brent–WTI Spread ($)', data: [3.4,6.9,8.5,5.2,3.2,5.4,1.7,4.7,5.0,5.1,17.6], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 2.5, pointRadius: 4, fill: true, tension: 0.35 },
        { label: 'Pre-war normal', data: [3.4,3.4,3.4,3.4,3.4,3.4,3.4,3.4,3.4,3.4,3.4], borderColor: '#475569', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: lgnd, tooltip: ttOpts,
          annotation: { annotations: {
            danger: { type: 'line', yMin: 15, yMax: 15, borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1, borderDash: [3,3],
              label: { content: 'Structural dislocation', display: true, position: 'end', font: { size: 8 }, color: '#ef4444', padding: 2 } }
          }}
        },
        scales: { x: gridX, y: { grid: gridY.grid, title: { display: true, text: '$/barrel spread', font: { size: 9 }, color: '#475569' },
          ticks: { font: gridY.ticks.font, color: '#64748b', callback: function(v) { return '$' + v; } } } }
      }
    });
  }
}
