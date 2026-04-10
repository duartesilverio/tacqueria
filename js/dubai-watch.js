/* ============================================================
   DUBAI WATCH — Used Car Panic Index Charts
   Reads all data from DASHBOARD_DATA.dubaiWatch
   ============================================================ */
(function () {
  'use strict';

  const DW = DASHBOARD_DATA.dubaiWatch;
  if (!DW) return;

  // ── Color palette ───────────────────────────────────────────
  const COLORS = {
    dubizzle:   { line: '#60a5fa', fill: 'rgba(96,165,250,0.12)' },
    dubicars:   { line: '#f59e0b', fill: 'rgba(245,158,11,0.12)' },
    yallamotor: { line: '#a78bfa', fill: 'rgba(167,139,250,0.12)' },
    grid: 'rgba(255,255,255,0.05)',
    gridLight: 'rgba(0,0,0,0.07)',
    textMuted: '#8b8f9a',
    textFaint: '#555a66'
  };

  const LUXURY_COLORS = [
    '#f59e0b', // Mercedes — amber (largest)
    '#60a5fa', // BMW — blue
    '#a78bfa', // Porsche — purple
    '#f97316', // Land Rover — orange
    '#ef4444', // Ferrari — red
    '#22c55e', // Rolls-Royce — green
    '#ec4899', // Lamborghini — pink
    '#06b6d4'  // Bentley — cyan
  ];

  // ── UTILITY: Theme-aware grid color ─────────────────────────
  function gridColor() {
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? COLORS.gridLight : COLORS.grid;
  }

  // ── KPI CARDS — populate from data ──────────────────────────
  function renderKPIs() {
    const latest = DW.latest;
    const platforms = ['dubizzle', 'dubicars', 'yallamotor'];
    const labels = { dubizzle: 'Dubizzle', dubicars: 'DubiCars', yallamotor: 'YallaMotor' };

    platforms.forEach(p => {
      const valEl = document.getElementById('dubai-kpi-' + p + '-val');
      const deltaEl = document.getElementById('dubai-kpi-' + p + '-delta');
      if (!valEl || !deltaEl) return;

      const d = latest[p];
      valEl.textContent = d.total.toLocaleString();

      const sign = d.changePct > 0 ? '+' : '';
      deltaEl.textContent = sign + d.changePct.toFixed(1) + '% vs pre-war';
      deltaEl.className = 'dubai-kpi-delta ' + (d.changePct > 0.5 ? 'up' : d.changePct < -0.5 ? 'down' : 'flat');
    });

    // Combined total
    const totalEl = document.getElementById('dubai-kpi-combined-val');
    const totalDeltaEl = document.getElementById('dubai-kpi-combined-delta');
    if (totalEl) {
      const total = latest.dubizzle.total + latest.dubicars.total + latest.yallamotor.total;
      totalEl.textContent = total.toLocaleString();
    }
    if (totalDeltaEl) {
      const baseTotal = DW.baselines.dubizzle + DW.baselines.dubicars + DW.baselines.yallamotor;
      const curTotal = latest.dubizzle.total + latest.dubicars.total + latest.yallamotor.total;
      const pct = ((curTotal - baseTotal) / baseTotal * 100);
      const sign = pct > 0 ? '+' : '';
      totalDeltaEl.textContent = sign + pct.toFixed(1) + '% vs pre-war';
      totalDeltaEl.className = 'dubai-kpi-delta ' + (pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat');
    }
  }

  // ── LISTING TIMELINE CHART ──────────────────────────────────
  let timelineChart = null;

  function buildTimelineChart() {
    const ctx = document.getElementById('dubai-timeline-chart');
    if (!ctx) return;

    // Build datasets from snapshots — one per platform
    const snapshots = DW.snapshots;
    const platforms = ['dubizzle', 'dubicars', 'yallamotor'];
    const names = { dubizzle: 'Dubizzle', dubicars: 'DubiCars', yallamotor: 'YallaMotor' };
    const colorKeys = { dubizzle: 'dubizzle', dubicars: 'dubicars', yallamotor: 'yallamotor' };

    // Collect all unique dates as labels
    const allDates = snapshots.map(s => s.date);

    const datasets = platforms.map(p => ({
      label: names[p],
      data: snapshots.map(s => s[p] ?? null),
      borderColor: COLORS[colorKeys[p]].line,
      backgroundColor: COLORS[colorKeys[p]].fill,
      borderWidth: 2,
      pointRadius: snapshots.map(s => s[p] != null ? 5 : 0),
      pointBackgroundColor: COLORS[colorKeys[p]].line,
      pointBorderColor: COLORS[colorKeys[p]].line,
      pointHoverRadius: 7,
      spanGaps: true,
      tension: 0.3,
      fill: false
    }));

    // War start annotation
    const warDateIndex = allDates.indexOf('2026-02-28');

    if (timelineChart) timelineChart.destroy();

    timelineChart = new Chart(ctx, {
      type: 'line',
      data: { labels: allDates.map(formatDateLabel), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: COLORS.textMuted,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              boxWidth: 12,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17,19,24,0.95)',
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
            callbacks: {
              label: function(ctx) {
                if (ctx.raw == null) return ctx.dataset.label + ': No data';
                return ctx.dataset.label + ': ' + ctx.raw.toLocaleString();
              }
            }
          },
          annotation: {
            annotations: {
              warLine: {
                type: 'line',
                xMin: warDateIndex >= 0 ? warDateIndex : undefined,
                xMax: warDateIndex >= 0 ? warDateIndex : undefined,
                borderColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                borderDash: [6, 3],
                label: {
                  display: true,
                  content: 'WAR STARTS',
                  position: 'start',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  font: { family: "'JetBrains Mono', monospace", size: 9, weight: 600 },
                  padding: { top: 2, bottom: 2, left: 6, right: 6 }
                }
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: COLORS.textFaint,
              font: { family: "'JetBrains Mono', monospace", size: 9 }
            },
            grid: { color: gridColor() }
          },
          y: {
            ticks: {
              color: COLORS.textFaint,
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              callback: v => (v / 1000).toFixed(0) + 'k'
            },
            grid: { color: gridColor() }
          }
        }
      }
    });
  }

  // ── LUXURY BREAKDOWN CHART (horizontal bar) ─────────────────
  let luxuryChart = null;

  function buildLuxuryChart() {
    const ctx = document.getElementById('dubai-luxury-chart');
    if (!ctx) return;

    const lux = DW.luxury;
    const brandOrder = ['mercedes', 'bmw', 'porsche', 'landRover', 'ferrari', 'rollsRoyce', 'lamborghini', 'bentley'];
    const brandLabels = {
      mercedes: 'Mercedes', bmw: 'BMW', porsche: 'Porsche',
      landRover: 'Land Rover', ferrari: 'Ferrari', rollsRoyce: 'Rolls-Royce',
      lamborghini: 'Lamborghini', bentley: 'Bentley'
    };

    const dubizzleData = brandOrder.map(b => lux.dubizzle.brands[b] || 0);
    const dubicarsData = brandOrder.map(b => lux.dubicars.brands[b] || 0);

    if (luxuryChart) luxuryChart.destroy();

    luxuryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: brandOrder.map(b => brandLabels[b]),
        datasets: [
          {
            label: 'Dubizzle',
            data: dubizzleData,
            backgroundColor: 'rgba(96, 165, 250, 0.7)',
            borderColor: '#60a5fa',
            borderWidth: 1,
            borderRadius: 3
          },
          {
            label: 'DubiCars',
            data: dubicarsData,
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderColor: '#f59e0b',
            borderWidth: 1,
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: COLORS.textMuted,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              boxWidth: 12,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17,19,24,0.95)',
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
            callbacks: {
              label: function(ctx) {
                return ctx.dataset.label + ': ' + ctx.raw.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: COLORS.textFaint,
              font: { family: "'JetBrains Mono', monospace", size: 9 }
            },
            grid: { color: gridColor() }
          },
          y: {
            ticks: {
              color: COLORS.textMuted,
              font: { family: "'JetBrains Mono', monospace", size: 9 }
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ── HELPER: Format date label ───────────────────────────────
  function formatDateLabel(isoDate) {
    const d = new Date(isoDate + 'T00:00:00Z');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }

  // ── SNAPSHOT TABLE — populate from data ─────────────────────
  function renderSnapshotTable() {
    const tbody = document.getElementById('dubai-snapshot-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    DW.snapshots.forEach(s => {
      const tr = document.createElement('tr');
      const dayLabel = s.day != null ? 'D' + s.day : 'Pre-war';
      const srcClass = s.source === 'live' ? 'live' : 'wayback';
      const srcLabel = s.source === 'live' ? 'LIVE' : 'WAYBACK';

      tr.innerHTML =
        '<td>' + formatDateLabel(s.date) + '</td>' +
        '<td>' + dayLabel + '</td>' +
        '<td>' + (s.dubizzle != null ? s.dubizzle.toLocaleString() : '<span style="color:var(--color-text-faint)">—</span>') + '</td>' +
        '<td>' + (s.dubicars != null ? s.dubicars.toLocaleString() : '<span style="color:var(--color-text-faint)">—</span>') + '</td>' +
        '<td>' + (s.yallamotor != null ? s.yallamotor.toLocaleString() : '<span style="color:var(--color-text-faint)">—</span>') + '</td>' +
        '<td><span class="source-tag ' + srcClass + '">' + srcLabel + '</span></td>';

      tbody.appendChild(tr);
    });
  }

  // ── RENDER LUXURY BARS (HTML fallback for non-chart display) ──
  function renderLuxuryBars() {
    const containers = {
      dubizzle: document.getElementById('dubai-luxury-bars-dubizzle'),
      dubicars: document.getElementById('dubai-luxury-bars-dubicars')
    };

    ['dubizzle', 'dubicars'].forEach(p => {
      const el = containers[p];
      if (!el) return;

      const lux = DW.luxury[p];
      const totalEl = el.closest('.dubai-luxury-platform')?.querySelector('.dubai-luxury-total');
      if (totalEl) totalEl.textContent = lux.total.toLocaleString() + ' luxury listings';

      const brands = lux.brands;
      const maxVal = Math.max(...Object.values(brands));
      const brandLabels = {
        mercedes: 'Mercedes', bmw: 'BMW', porsche: 'Porsche',
        landRover: 'Land Rover', ferrari: 'Ferrari', rollsRoyce: 'Rolls-Royce',
        lamborghini: 'Lamborghini', bentley: 'Bentley'
      };

      // Sort by count desc
      const sorted = Object.entries(brands).sort((a, b) => b[1] - a[1]);

      el.innerHTML = '';
      sorted.forEach(([brand, count], i) => {
        const pct = (count / maxVal * 100).toFixed(0);
        el.innerHTML +=
          '<div class="dubai-luxury-bar">' +
            '<span class="dubai-luxury-bar-label">' + (brandLabels[brand] || brand) + '</span>' +
            '<div class="dubai-luxury-bar-track">' +
              '<div class="dubai-luxury-bar-fill" style="width:' + pct + '%;background:' + LUXURY_COLORS[i % LUXURY_COLORS.length] + ';"></div>' +
            '</div>' +
            '<span class="dubai-luxury-bar-count">' + count.toLocaleString() + '</span>' +
          '</div>';
      });
    });
  }

  // ── INIT ────────────────────────────────────────────────────
  function init() {
    // Day label
    var dayEl = document.getElementById('dubai-day-label');
    if (dayEl) dayEl.textContent = DW.latest.day;

    renderKPIs();
    buildTimelineChart();
    buildLuxuryChart();
    renderSnapshotTable();
    renderLuxuryBars();
  }

  // Run on load, and re-run when tab becomes visible (lazy init)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render charts when tab is activated (Chart.js needs visible canvas)
  document.addEventListener('click', function (e) {
    if (e.target.matches('[data-tab="dubaiwatch"]')) {
      setTimeout(function () {
        buildTimelineChart();
        buildLuxuryChart();
      }, 100);
    }
  });

  // Theme change listener — rebuild charts for correct grid colors
  const obs = new MutationObserver(function () {
    if (timelineChart) buildTimelineChart();
    if (luxuryChart) buildLuxuryChart();
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
