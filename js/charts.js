/* ===== CHARTS ===== */
function getChartColors() {
  var style = getComputedStyle(document.documentElement);
  return {
    red: style.getPropertyValue('--color-red').trim(),
    amber: style.getPropertyValue('--color-amber').trim(),
    green: style.getPropertyValue('--color-green').trim(),
    text: style.getPropertyValue('--color-text').trim(),
    textMuted: style.getPropertyValue('--color-text-muted').trim(),
    textFaint: style.getPropertyValue('--color-text-faint').trim(),
    border: style.getPropertyValue('--color-border').trim(),
    surface: style.getPropertyValue('--color-surface').trim()
  };
}

function initCharts() {
  // Legacy no-op — strike/hormuz charts now live in conflictops tab.
  // Called only for theme-rebuild compatibility; actual init is in initConflictOpsCharts().
}

function initConflictOpsCharts() {
  var colors = getChartColors();

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = colors.textMuted;

  // ── UAE Daily Attack Chart (stacked bar) ──────────────────
  var uaeCtx = document.getElementById('uaeAttackChart');
  if (uaeCtx) {
    if (window.uaeAttackChartInstance) { window.uaeAttackChartInstance.destroy(); }
    var uaeData = DASHBOARD_DATA.iranAttacksUAE.daily;
    var uaeLabels = uaeData.map(function(d) { return 'D' + d.day; });
    window.uaeAttackChartInstance = new Chart(uaeCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: uaeLabels,
        datasets: [
          {
            label: 'Ballistic Missiles',
            data: uaeData.map(function(d) { return d.ballistic; }),
            backgroundColor: colors.red + 'cc',
            borderColor: colors.red,
            borderWidth: 1,
            borderRadius: 2
          },
          {
            label: 'Cruise Missiles',
            data: uaeData.map(function(d) { return d.cruise; }),
            backgroundColor: '#818cf8cc',
            borderColor: '#818cf8',
            borderWidth: 1,
            borderRadius: 2
          },
          {
            label: 'Drones',
            data: uaeData.map(function(d) { return d.drones; }),
            backgroundColor: colors.amber + 'cc',
            borderColor: colors.amber,
            borderWidth: 1,
            borderRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 10 } }
          },
          tooltip: {
            backgroundColor: 'rgba(8,12,24,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            padding: 10,
            callbacks: {
              afterBody: function(items) {
                var idx = items[0].dataIndex;
                var d = uaeData[idx];
                var total = d.ballistic + d.cruise + d.drones;
                return 'Total: ' + total + ' projectiles';
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
          },
          y: {
            stacked: true,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } },
            title: {
              display: true,
              text: 'Projectiles',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }


  // ── UAE Cumulative Projectiles Chart (stacked area) ──────────────────
  var uaeCumulCtx = document.getElementById('uaeCumulChart');
  if (uaeCumulCtx) {
    if (window.uaeCumulChartInstance) { window.uaeCumulChartInstance.destroy(); }
    var uaeDaily = DASHBOARD_DATA.iranAttacksUAE.daily;
    var cLabels = uaeDaily.map(function(d) { return 'D' + d.day; });
    // Build cumulative arrays
    var cBallistic = [], cCruise = [], cDrones = [];
    var rb = 0, rc = 0, rd = 0;
    uaeDaily.forEach(function(d) {
      rb += d.ballistic; rc += d.cruise; rd += d.drones;
      cBallistic.push(rb); cCruise.push(rc); cDrones.push(rd);
    });
    window.uaeCumulChartInstance = new Chart(uaeCumulCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: cLabels,
        datasets: [
          {
            label: 'Drones',
            data: cDrones,
            borderColor: colors.amber,
            backgroundColor: colors.amber + '30',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: colors.amber,
            borderWidth: 2
          },
          {
            label: 'Ballistic Missiles',
            data: cBallistic,
            borderColor: colors.red,
            backgroundColor: colors.red + '30',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: colors.red,
            borderWidth: 2
          },
          {
            label: 'Cruise Missiles',
            data: cCruise,
            borderColor: '#818cf8',
            backgroundColor: '#818cf830',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#818cf8',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 10 } }
          },
          tooltip: {
            backgroundColor: 'rgba(8,12,24,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            padding: 10,
            callbacks: {
              afterBody: function(items) {
                var idx = items[0].dataIndex;
                return 'Combined: ' + (cBallistic[idx] + cCruise[idx] + cDrones[idx]).toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
          },
          y: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } },
            title: {
              display: true,
              text: 'Cumulative Count',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }

  // ── Gulf Neighbors Missiles vs Drones (stacked horizontal bar) ──────────
  var gulfBDCtx = document.getElementById('gulfBreakdownChart');
  if (gulfBDCtx) {
    if (window.gulfBreakdownChartInstance) { window.gulfBreakdownChartInstance.destroy(); }
    var nb2 = DASHBOARD_DATA.iranAttacksNeighbors.countries;
    var bdLabels = ['UAE', 'Bahrain', 'Saudi', 'Qatar', 'Kuwait', 'Oman'];
    var bdKeys = ['uae', 'bahrain', 'saudiArabia', 'qatar', 'kuwait', 'oman'];
    // Extract missiles and drones per country
    var bdMissiles = bdKeys.map(function(k) {
      var c = nb2[k];
      if (c.ballistic !== null && c.cruise !== null) return (c.ballistic || 0) + (c.cruise || 0);
      if (c.totalMissiles !== undefined) return parseInt(String(c.totalMissiles).replace(/[^0-9]/g, '')) || 0;
      // Estimate: total - drones (rough)
      var tot = typeof c.total === 'number' ? c.total : parseInt(String(c.total).replace(/[^0-9]/g, '')) || 0;
      return Math.round(tot * 0.3); // rough estimate for countries with no breakdown
    });
    var bdDrones = bdKeys.map(function(k) {
      var c = nb2[k];
      if (c.drones !== null && c.drones !== undefined) return typeof c.drones === 'number' ? c.drones : parseInt(String(c.drones).replace(/[^0-9]/g, '')) || 0;
      if (c.totalDrones !== undefined) return parseInt(String(c.totalDrones).replace(/[^0-9]/g, '')) || 0;
      var tot = typeof c.total === 'number' ? c.total : parseInt(String(c.total).replace(/[^0-9]/g, '')) || 0;
      return Math.round(tot * 0.7);
    });
    window.gulfBreakdownChartInstance = new Chart(gulfBDCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: bdLabels,
        datasets: [
          {
            label: 'Missiles',
            data: bdMissiles,
            backgroundColor: colors.red + 'bb',
            borderColor: colors.red,
            borderWidth: 1,
            borderRadius: 2
          },
          {
            label: 'Drones',
            data: bdDrones,
            backgroundColor: colors.amber + 'bb',
            borderColor: colors.amber,
            borderWidth: 1,
            borderRadius: 2
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 10 } }
          },
          tooltip: {
            backgroundColor: 'rgba(8,12,24,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            padding: 10,
            callbacks: {
              afterBody: function(items) {
                var idx = items[0].dataIndex;
                var k = bdKeys[idx];
                var c = nb2[k];
                var parts = [];
                if (c.killed !== undefined && c.killed !== 'unknown') parts.push('Killed: ' + c.killed);
                if (c.interceptRate) parts.push('Intercept: ' + c.interceptRate);
                return parts;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: function(v) {
                return v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'K' : v;
              }
            },
            title: {
              display: true,
              text: 'Projectiles',
              font: { size: 10 },
              color: colors.textFaint
            }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 11, weight: 600 } }
          }
        }
      }
    });
  }

  // Airstrike tempo chart
  var strikeCtx = document.getElementById('strikeChart');
  if (strikeCtx) {
    if (window.strikeChartInstance) { window.strikeChartInstance.destroy(); }
    window.strikeChartInstance = new Chart(strikeCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: DASHBOARD_DATA.chartData.strikeLabels,
        datasets: [
          {
            label: 'US/Israel Strikes (est.)',
            data: DASHBOARD_DATA.chartData.strikes.us,
            backgroundColor: colors.red + 'cc',
            borderColor: colors.red,
            borderWidth: 1,
            borderRadius: 2
          },
          {
            label: 'Iran Retaliatory Launches (est.)',
            data: DASHBOARD_DATA.chartData.strikes.iran,
            backgroundColor: colors.amber + 'cc',
            borderColor: colors.amber,
            borderWidth: 1,
            borderRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 16,
              font: { size: 10 }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
          },
          y: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } },
            title: {
              display: true,
              text: 'Est. Strikes / Launches',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }

  // Hormuz transits chart
  var hormuzCtx = document.getElementById('hormuzChart');
  if (hormuzCtx) {
    if (window.hormuzChartInstance) { window.hormuzChartInstance.destroy(); }
    window.hormuzChartInstance = new Chart(hormuzCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: DASHBOARD_DATA.chartData.hormuzLabels,
        datasets: [{
          label: 'Tanker Transits/Day',
          data: DASHBOARD_DATA.chartData.hormuzTransits,
          borderColor: colors.red,
          backgroundColor: colors.red + '20',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: colors.red,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 16,
              font: { size: 10 }
            }
          },
          annotation: {}
        },
        scales: {
          x: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } }
          },
          y: {
            min: 0,
            max: 40,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 } },
            title: {
              display: true,
              text: 'Transits / Day',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }
}

/* ========================================
   TACO PROBABILITY MONITOR — CONFIG
   Now reads from DASHBOARD_DATA.tacoConfig (set by render.js → window.TACO_CONFIG)
   ======================================== */
// TACO_CONFIG is set by render.js from DASHBOARD_DATA.tacoConfig
// If for any reason render.js hasn't run yet, define a fallback
if (typeof TACO_CONFIG === 'undefined') {
  var TACO_CONFIG = DASHBOARD_DATA.tacoConfig;
}

/* ===== TACO GAUGE ANIMATION ===== */
(function initTacoGauge() {
  var score = TACO_CONFIG.compositeScore;
  var arcEl = document.getElementById('tacoArc');
  var needleEl = document.getElementById('tacoNeedle');

  if (!arcEl || !needleEl) return;

  // Semi-circle arc length = pi * r = pi * 100 = 314.16
  var totalArc = 314.2;
  var targetOffset = totalArc - (score / 100) * totalArc;

  // Needle: -90 deg = 0 score (far left), +90 deg = 100 score (far right)
  var needleAngle = -90 + (score / 100) * 180;

  // Animate after brief delay
  setTimeout(function() {
    arcEl.style.strokeDashoffset = targetOffset;
    needleEl.style.transform = 'rotate(' + needleAngle + 'deg)';
  }, 400);
})();

/* ===== TACO TAB INITIALIZATION ===== */
(function initTacoTabAnimation() {
  // Re-animate gauge when TACO tab is shown
  var tacoTabBtn = document.querySelector('[data-tab="taco"]');
  if (tacoTabBtn) {
    tacoTabBtn.addEventListener('click', function() {
      var arcEl = document.getElementById('tacoArc');
      var needleEl = document.getElementById('tacoNeedle');
      if (!arcEl || !needleEl) return;

      var score = TACO_CONFIG.compositeScore;
      var totalArc = 314.2;
      var targetOffset = totalArc - (score / 100) * totalArc;
      var needleAngle = -90 + (score / 100) * 180;

      // Reset to starting position
      arcEl.style.transition = 'none';
      needleEl.style.transition = 'none';
      arcEl.style.strokeDashoffset = totalArc;
      needleEl.style.transform = 'rotate(-90deg)';

      // Force reflow
      void arcEl.offsetWidth;

      // Animate to target
      setTimeout(function() {
        arcEl.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)';
        needleEl.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)';
        arcEl.style.strokeDashoffset = targetOffset;
        needleEl.style.transform = 'rotate(' + needleAngle + 'deg)';
      }, 50);
    });
  }
})();

/* ===== ANIMATE PROGRESS BARS ===== */
(function animateBars() {
  var bars = document.querySelectorAll('.progress-fill');
  bars.forEach(function(bar) {
    var w = bar.style.width;
    bar.style.width = '0%';
    setTimeout(function() {
      bar.style.width = w;
    }, 300);
  });
})();

/* ===== PREDICTION MARKET CHARTS ===== */
function initPredMktCharts() {
  var colors = getChartColors();
  var polyColor = '#818cf8';
  var kalshiColor = '#4ade80';

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = colors.textMuted;

  // ── Volume Intelligence Bubble Chart ──────────────────
  var bubbleCtx = document.getElementById('pmVolBubbleChart');
  if (bubbleCtx) {
    // Give adjacent overlapping contracts unique y-offsets so they don't stack
    var contracts = DASHBOARD_DATA.chartData.pmBubbleContracts;

    // Slightly separate contracts with very close x/y so bubbles and labels don't pile up
    var yJitter = [0, 0, 0, -6, 0, 6, 0, 8, -8, 0];

    var toR = function(v) { return Math.min(34, Math.max(5, Math.sqrt(v) * 4.8)); };
    var toY = function(v, ji) { return Math.min(97, Math.max(4, Math.log10(Math.max(v, 0.01) * 1000 + 1) * 30)) + (ji||0); };

    // Label plugin with bg pill and smart side selection
    var labelPlugin = {
      id: 'bubbleLabels',
      afterDatasetsDraw: function(chart) {
        var ctx2 = chart.ctx;
        var ca = chart.chartArea;
        ctx2.save();
        ctx2.font = '600 9px Inter, sans-serif';

        contracts.forEach(function(c, di) {
          var meta = chart.getDatasetMeta(di);
          var pt = meta.data[0];
          if (!pt) return;
          var r = toR(c.vol);
          var tw = ctx2.measureText(c.label).width;
          var pad = 4;

          // Decide which side: honour hint but flip if it would clip
          var goRight = c.labelSide === 'right';
          if (goRight && pt.x + r + 6 + tw + pad * 2 > ca.right + 10) goRight = false;
          if (!goRight && pt.x - r - 6 - tw - pad * 2 < ca.left - 10) goRight = true;

          var lx = goRight ? pt.x + r + 5 : pt.x - r - 5 - tw - pad * 2;
          var ly = pt.y - 6;

          // Dark pill background
          ctx2.fillStyle = 'rgba(8,12,24,0.82)';
          var rx = 3;
          var bw = tw + pad * 2, bh = 14;
          ctx2.beginPath();
          ctx2.moveTo(lx + rx, ly); ctx2.lineTo(lx + bw - rx, ly);
          ctx2.quadraticCurveTo(lx + bw, ly, lx + bw, ly + rx);
          ctx2.lineTo(lx + bw, ly + bh - rx);
          ctx2.quadraticCurveTo(lx + bw, ly + bh, lx + bw - rx, ly + bh);
          ctx2.lineTo(lx + rx, ly + bh);
          ctx2.quadraticCurveTo(lx, ly + bh, lx, ly + bh - rx);
          ctx2.lineTo(lx, ly + rx);
          ctx2.quadraticCurveTo(lx, ly, lx + rx, ly);
          ctx2.closePath();
          ctx2.fill();

          // Label text in contract colour
          ctx2.fillStyle = c.color;
          ctx2.fillText(c.label, lx + pad, ly + 10);
        });
        ctx2.restore();
      }
    };

    new Chart(bubbleCtx.getContext('2d'), {
      type: 'bubble',
      plugins: [labelPlugin],
      data: {
        datasets: contracts.map(function(c, i) {
          return {
            label: c.label,
            data: [{ x: c.x, y: toY(c.vol, yJitter[i]), r: toR(c.vol) }],
            backgroundColor: c.color + '38',
            borderColor: c.color,
            borderWidth: 2,
            hoverBackgroundColor: c.color + '70',
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        // Generous padding so large bubbles near edges don't clip
        layout: { padding: { top: 20, right: 20, bottom: 4, left: 4 } },
        clip: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(8,12,24,0.97)',
            borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            titleColor: '#e2e8f0', bodyColor: '#94a3b8', padding: 10,
            callbacks: {
              title: function(items) { return contracts[items[0].datasetIndex].label; },
              label: function(ctx) {
                var c = contracts[ctx.datasetIndex];
                var q = c.vol < 1 ? '⚠ Thin — directional only' : c.vol > 10 ? '✓ Deep — high confidence' : '~ Medium liquidity';
                return ['Prob: ' + c.x + '%', 'Vol: $' + c.vol.toFixed(c.vol >= 1 ? 1 : 3) + 'M', c.src, q];
              }
            }
          },
          annotation: {
            annotations: {
              thinZone: {
                type: 'box', xMin: 0, xMax: 103, yMin: 0, yMax: 24,
                backgroundColor: 'rgba(239,68,68,0.05)',
                borderColor: 'rgba(239,68,68,0.18)', borderWidth: 1,
                label: { content: 'THIN  <$1M', display: true, position: { x: 'end', y: 'center' },
                  font: { size: 9, family: 'JetBrains Mono, monospace' }, color: 'rgba(239,68,68,0.55)', padding: 4 }
              },
              deepZone: {
                type: 'box', xMin: 0, xMax: 103, yMin: 72, yMax: 100,
                backgroundColor: 'rgba(34,197,94,0.04)',
                borderColor: 'rgba(34,197,94,0.15)', borderWidth: 1,
                label: { content: 'DEEP  >$10M', display: true, position: { x: 'end', y: 'center' },
                  font: { size: 9, family: 'JetBrains Mono, monospace' }, color: 'rgba(34,197,94,0.5)', padding: 4 }
              }
            }
          }
        },
        scales: {
          x: {
            min: -2, max: 103,
            title: { display: true, text: 'Implied probability (%)', font: { size: 10 }, color: '#64748b' },
            grid: { color: 'rgba(255,255,255,0.055)' },
            ticks: { font: { family: "'JetBrains Mono',monospace", size: 9 }, color: '#64748b',
              callback: function(v) { return v >= 0 && v <= 100 ? v + '%' : ''; }, stepSize: 20 }
          },
          y: {
            min: -2, max: 108,
            title: { display: true, text: 'Liquidity depth  ·  bubble size = volume', font: { size: 10 }, color: '#64748b' },
            grid: { color: 'rgba(255,255,255,0.055)' },
            ticks: {
              font: { family: "'JetBrains Mono',monospace", size: 9 }, color: '#64748b',
              callback: function(v) {
                if (v === 0)   return 'Thin';
                if (v === 25)  return '~$1M';
                if (v === 50)  return '~$3M';
                if (v === 75)  return '~$10M';
                if (v === 100) return 'Deep';
                return '';
              },
              stepSize: 25
            }
          }
        }
      }
    });
  }

  var ceasefireCtx = document.getElementById('predmkt-ceasefire-chart');
  if (ceasefireCtx) {
    window.predCeasefireChart = new Chart(ceasefireCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: DASHBOARD_DATA.chartData.pmCeasefireLabels,
        datasets: [{
          label: 'YES Probability (%)',
          data: DASHBOARD_DATA.chartData.pmCeasefireData,
          backgroundColor: [
            '#22c55e80', '#22c55ecc', '#22c55e80', '#22c55ecc',
            '#22c55e80', colors.amber + 'cc', '#22c55e80'
          ],
          borderColor: [
            '#22c55e', '#22c55e', '#22c55e', '#22c55e',
            '#22c55e', colors.amber, '#22c55e'
          ],
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ctx.raw + '% YES'; }
            }
          }
        },
        scales: {
          x: {
            min: 0, max: 100,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: function(v) { return v + '%'; }
            }
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
          }
        }
      }
    });
  }

  // Oil Price Thresholds bar chart
  var oilCtx = document.getElementById('predmkt-oil-chart');
  if (oilCtx) {
    window.predOilChart = new Chart(oilCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: DASHBOARD_DATA.chartData.pmOilLabels,
        datasets: [
          {
            label: 'Polymarket',
            data: DASHBOARD_DATA.chartData.pmOilPoly,
            backgroundColor: polyColor + '99',
            borderColor: polyColor,
            borderWidth: 1,
            borderRadius: 3
          },
          {
            label: 'Kalshi',
            data: DASHBOARD_DATA.chartData.pmOilKalshi,
            backgroundColor: kalshiColor + '99',
            borderColor: kalshiColor,
            borderWidth: 1,
            borderRadius: 3
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 12, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ctx.dataset.label + ': ' + ctx.raw + '% YES'; }
            }
          }
        },
        scales: {
          x: {
            min: 0, max: 100,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: function(v) { return v + '%'; }
            }
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 10 } }
          }
        }
      }
    });
  }

  // Platform Comparison grouped bar chart
  var compareCtx = document.getElementById('predmkt-compare-chart');
  if (compareCtx) {
    window.predCompareChart = new Chart(compareCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: DASHBOARD_DATA.chartData.pmCompareLabels,
        datasets: [
          {
            label: 'Polymarket',
            data: DASHBOARD_DATA.chartData.pmComparePoly,
            backgroundColor: polyColor + 'bb',
            borderColor: polyColor,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Kalshi',
            data: DASHBOARD_DATA.chartData.pmCompareKalshi,
            backgroundColor: kalshiColor + 'bb',
            borderColor: kalshiColor,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 16, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ctx.dataset.label + ': ' + ctx.raw + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          },
          y: {
            min: 0, max: 100,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: function(v) { return v + '%'; }
            },
            title: {
              display: true,
              text: 'YES Probability (%)',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }
}

// ===== CONFLICT MARKET HISTORY CHART =====
function initConflictMarketChart() {
  const el = document.getElementById('conflictMarketChart');
  if (!el) return;

  const colors = getComputedStyle(document.documentElement);

  // Dynamic day labels from DASHBOARD_DATA
  const dateLabels = DASHBOARD_DATA.chartData.labels;
  const labels = dateLabels.map((d, i) => 'D' + (i + 1) + '\n' + d);

  // Read from unified data source
  const rawBrent = DASHBOARD_DATA.chartData.brent;
  const rawVIX   = DASHBOARD_DATA.chartData.vix;
  const rawHYG   = DASHBOARD_DATA.chartData.hyg;
  const rawSP    = DASHBOARD_DATA.chartData.sp500;
  const rawTACO  = DASHBOARD_DATA.chartData.taco;

  // Index to Day 1 = 100
  function idx(arr) { return arr.map(v => parseFloat((v / arr[0] * 100).toFixed(2))); }

  const brentIdx = idx(rawBrent);
  const vixIdx   = idx(rawVIX);
  const hygIdx   = idx(rawHYG);
  const spIdx    = idx(rawSP);
  const tacoIdx  = idx(rawTACO);

  if (window._conflictChart) { window._conflictChart.destroy(); }
  const ctx = el.getContext('2d');
  window._conflictChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Brent Crude',
          data: brentIdx,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'VIX',
          data: vixIdx,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'HYG (HY Spread)',
          data: hygIdx,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'S&P 500',
          data: spIdx,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'TACO Score',
          data: tacoIdx,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.06)',
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          padding: 10,
          callbacks: {
            title: function(items) {
              const d = items[0].dataIndex;
              return `Day ${d+1} — ${dateLabels[d] || ''}`;
            },
            label: function(ctx) {
              const raw = [rawBrent, rawVIX, rawHYG, rawSP, rawTACO][ctx.datasetIndex][ctx.dataIndex];
              const units = ['$/bbl', 'pts', '$', 'pts', '/100'];
              const labels = ['Brent', 'VIX', 'HYG', 'S&P 500', 'TACO'];
              const sign = ctx.parsed.y >= 100 ? '+' : '';
              return `${labels[ctx.datasetIndex]}: ${raw} ${units[ctx.datasetIndex]}  (${sign}${(ctx.parsed.y - 100).toFixed(1)}%)`;
            }
          }
        },
        annotation: {
          annotations: {
            baseline: {
              type: 'line',
              yMin: 100, yMax: 100,
              borderColor: 'rgba(148,163,184,0.25)',
              borderWidth: 1,
              borderDash: [3, 3]
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 9 },
            color: '#64748b',
            maxRotation: 0
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)', lineWidth: 0.5 },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 9 },
            color: '#64748b',
            callback: function(v) { return (v >= 100 ? '+' : '') + (v - 100).toFixed(0) + '%'; }
          },
          title: {
            display: true,
            text: 'Change from Day 1 (%)',
            font: { size: 9 },
            color: '#475569'
          }
        }
      }
    }
  });
}

/* ===== ETF SPARKLINE CHARTS ===== */
function initEtfSparklines() {
  var colors = getChartColors();

  // ETF data from DASHBOARD_DATA
  var etfRaw = DASHBOARD_DATA.chartData.etfs;
  var etfData = {};
  Object.keys(etfRaw).forEach(function(ticker) {
    var e = etfRaw[ticker];
    etfData[ticker] = {
      prices: e.prices,
      color: e.color === 'green' ? colors.green : e.color
    };
  });

  Object.keys(etfData).forEach(function(ticker) {
    var canvas = document.getElementById('etf-chart-' + ticker);
    if (!canvas) return;

    var d = etfData[ticker];
    var ctx = canvas.getContext('2d');

    // Create gradient fill
    var gradient = ctx.createLinearGradient(0, 0, 0, 48);
    gradient.addColorStop(0, d.color + '30');
    gradient.addColorStop(1, d.color + '05');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: d.prices.map(function(_, i) { return i + 1; }),
        datasets: [{
          data: d.prices,
          borderColor: d.color,
          backgroundColor: gradient,
          borderWidth: 1.5,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHitRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(8,12,24,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            padding: 6,
            displayColors: false,
            callbacks: {
              title: function(items) {
                var day = items[0].dataIndex + 1;
                return 'Day ' + day;
              },
              label: function(ctx2) {
                return '$' + ctx2.parsed.y;
              }
            }
          }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        interaction: { mode: 'index', intersect: false }
      }
    });
  });
}
