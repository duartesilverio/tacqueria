// ===== TACO ANALYTICS CHARTS =====
function initTacoAnalyticsCharts() {
  // Read from unified data source
  const rawBrent = DASHBOARD_DATA.chartData.brent;
  const rawVIX   = DASHBOARD_DATA.chartData.vix;
  const rawHYG   = DASHBOARD_DATA.chartData.hyg;
  const rawSP    = DASHBOARD_DATA.chartData.sp500;
  const rawTACO  = DASHBOARD_DATA.chartData.taco;
  const n = rawTACO.length;

  // Pearson correlation helper
  function pearson(a, b) {
    const na = a.length;
    const ma = a.reduce((s,v)=>s+v,0)/na;
    const mb = b.reduce((s,v)=>s+v,0)/na;
    let num=0, da=0, db=0;
    for (let i=0;i<na;i++) {
      num += (a[i]-ma)*(b[i]-mb);
      da  += (a[i]-ma)**2;
      db  += (b[i]-mb)**2;
    }
    return da && db ? num/Math.sqrt(da*db) : 0;
  }

  // Compute lag correlations: TACO(t) vs market(t+lag) for lags 0..5
  function lagCorrs(market) {
    return [0,1,2,3,4,5].map(lag => {
      const t  = rawTACO.slice(0, n-lag);
      const m  = market.slice(lag, n);
      return parseFloat(pearson(t, m).toFixed(3));
    });
  }

  // For HYG: TACO low → HYG falls (spread widens) → positive r (both fall together)
  // For Brent/VIX: TACO low → they rise → negative r
  const brentCorrs = lagCorrs(rawBrent);
  const vixCorrs   = lagCorrs(rawVIX);
  const hygCorrs   = lagCorrs(rawHYG);
  const spCorrs    = lagCorrs(rawSP);

  // ---- 1. LAG CORRELATION CHART ----
  const lagEl = document.getElementById('lagCorrelationChart');
  if (lagEl) {
    new Chart(lagEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Lag 0', 'Lag +1d', 'Lag +2d', 'Lag +3d', 'Lag +4d', 'Lag +5d'],
        datasets: [
          { label: 'Brent',   data: brentCorrs, backgroundColor: 'rgba(245,158,11,0.75)',  borderColor: '#f59e0b', borderWidth: 1, borderRadius: 3 },
          { label: 'VIX',     data: vixCorrs,   backgroundColor: 'rgba(239,68,68,0.75)',   borderColor: '#ef4444', borderWidth: 1, borderRadius: 3 },
          { label: 'HYG',     data: hygCorrs,   backgroundColor: 'rgba(139,92,246,0.75)',  borderColor: '#8b5cf6', borderWidth: 1, borderRadius: 3 },
          { label: 'S&P 500', data: spCorrs,    backgroundColor: 'rgba(34,197,94,0.75)',   borderColor: '#22c55e', borderWidth: 1, borderRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 10 }, boxWidth: 12, padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: r = ${ctx.raw > 0 ? '+' : ''}${ctx.raw}`
            }
          },
          annotation: { annotations: { zero: { type:'line', yMin:0, yMax:0, borderColor:'rgba(148,163,184,0.3)', borderWidth:1 } } }
        },
        scales: {
          x: { grid:{display:false}, ticks:{font:{size:9}, color:'#64748b'} },
          y: {
            min: -1, max: 1,
            grid: { color:'rgba(255,255,255,0.05)' },
            ticks: { font:{family:"'JetBrains Mono',monospace",size:9}, color:'#64748b', callback: v => v.toFixed(1) },
            title: { display:true, text:'Pearson r', font:{size:9}, color:'#475569' }
          }
        }
      }
    });
  }

  // ---- 2. TACO MOMENTUM CHART ----
  const momEl = document.getElementById('tacoMomentumChart');
  if (momEl) {
    // Use war day numbers from date labels
    const _momWarStart = new Date(2026, 1, 28);
    const _momLabels = DASHBOARD_DATA.chartData.labels;
    const dayLabels = _momLabels.map(function(lbl) {
      var p = lbl.split(' '); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(p[0]);
      var wd = m >= 0 ? Math.round((new Date(2026, m, parseInt(p[1])) - _momWarStart) / 86400000) + 1 : null;
      return 'D' + wd;
    });
    // Daily deltas (null for day 1)
    const deltas = [null];
    for (let i=1;i<n;i++) deltas.push(parseFloat((rawTACO[i]-rawTACO[i-1]).toFixed(1)));

    // 3-day rolling avg of deltas
    const rolling = deltas.map((_, i) => {
      if (i < 3) return null;
      const slice = deltas.slice(i-2, i+1).filter(v => v !== null);
      return parseFloat((slice.reduce((a,b)=>a+b,0)/slice.length).toFixed(2));
    });

    const barColors = deltas.map(v => v === null ? 'transparent' : v >= 0 ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)');
    const barBorders = deltas.map(v => v === null ? 'transparent' : v >= 0 ? '#22c55e' : '#ef4444');

    new Chart(momEl.getContext('2d'), {
      data: {
        labels: dayLabels,
        datasets: [
          {
            type: 'bar', label: 'Daily Δ TACO',
            data: deltas,
            backgroundColor: barColors, borderColor: barBorders, borderWidth: 1, borderRadius: 3,
            yAxisID: 'y'
          },
          {
            type: 'line', label: '3d Rolling Avg',
            data: rolling,
            borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)',
            borderWidth: 2, pointRadius: 3, tension: 0.4, fill: false,
            yAxisID: 'y', spanGaps: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position:'top', labels:{font:{size:10}, boxWidth:12, padding:10} },
          tooltip: {
            backgroundColor:'rgba(15,23,42,0.95)', borderColor:'rgba(255,255,255,0.08)', borderWidth:1,
            callbacks: {
              label: ctx => ctx.raw === null ? '' : `${ctx.dataset.label}: ${ctx.raw > 0 ? '+' : ''}${ctx.raw}`
            }
          },
          annotation: { annotations: { zero: { type:'line', yMin:0, yMax:0, borderColor:'rgba(148,163,184,0.25)', borderWidth:1, borderDash:[3,3] } } }
        },
        scales: {
          x: { grid:{display:false}, ticks:{font:{size:9}, color:'#64748b'} },
          y: {
            grid:{color:'rgba(255,255,255,0.05)'},
            ticks:{font:{family:"'JetBrains Mono',monospace",size:9}, color:'#64748b', callback:v=>(v>0?'+':'')+v},
            title:{display:true, text:'TACO Point Change', font:{size:9}, color:'#475569'}
          }
        }
      }
    });
  }

  // ---- 3. FORWARD PROJECTION CHART ----
  const projEl = document.getElementById('tacoProjectionChart');
  if (projEl) {
    // Simple linear regression: TACO(t) → Brent(t+3), fit on available days
    const fitLen = n - 3;  // fit uses all days where lag-3 target exists
    const tx  = rawTACO.slice(0, fitLen);
    const ty  = rawBrent.slice(3, fitLen + 3);
    const mx  = tx.reduce((a,b)=>a+b,0)/tx.length;
    const my  = ty.reduce((a,b)=>a+b,0)/ty.length;
    let num=0, den=0;
    tx.forEach((v,i)=>{ num+=(v-mx)*(ty[i]-my); den+=(v-mx)**2; });
    const slope = den ? num/den : 0;
    const intercept = my - slope*mx;
    const predict = taco => slope*taco + intercept;

    // Dynamic labels: use actual war day numbers from date labels
    const warStart = new Date(2026, 1, 28); // Feb 28, 2026
    const _projLabels = DASHBOARD_DATA.chartData.labels;
    const warDayNums = _projLabels.map(function(lbl) {
      var parts = lbl.split(' ');
      var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(parts[0]);
      var d = parseInt(parts[1]);
      if (mon < 0 || isNaN(d)) return null;
      var dt = new Date(2026, mon, d);
      return Math.round((dt - warStart) / 86400000) + 1;
    });
    const allLabels = warDayNums.map(function(wd) { return 'D' + wd; });
    // Add 3 projection days after last war day
    var lastWD = warDayNums[warDayNums.length - 1] || n;
    for (var p = 1; p <= 3; p++) allLabels.push('D' + (lastWD + p));
    // Historical actuals + nulls for projection window
    const actual = [...rawBrent, null, null, null];
    // Model fit on known days (offset by 3)
    const fitData = rawTACO.slice(0, fitLen).map(t => parseFloat(predict(t).toFixed(2)));
    const modelFit = Array(3).fill(null).concat(fitData);
    while (modelFit.length < allLabels.length) modelFit.push(null);

    // Current values for scenario branching
    const currentTACO = rawTACO[n - 1];
    const lastBrent = rawBrent[n - 1];
    const day = DASHBOARD_DATA.meta.day;

    // The regression gives a spurious POSITIVE slope because both TACO & Brent fell
    // together after the Day 5 spike (demand destruction dominated). Economically,
    // escalation (TACO↓) should push Brent UP and de-escalation should push it DOWN.
    // We therefore use scenario-based projections for the boxes and label the chart honestly.

    // Scenario projections (economically grounded, not from regression):
    // Base: current TACO stays, Brent drifts ±2 from current
    // Escalation: TACO halves → supply shock → +$10–$20 from current
    // De-escalation: TACO doubles → IEA normalisation → −$15–$25 from current
    // Derive projection probabilities from analyticalOutlook.pathProbabilities
    var _projDeescProb = 0, _projEscProb = 0, _projBaseProb = 0;
    var _paths = DASHBOARD_DATA.analyticalOutlook && DASHBOARD_DATA.analyticalOutlook.pathProbabilities;
    if (_paths && _paths.length) {
      _paths.forEach(function(p) {
        var prob = parseInt(p.prob) || 0;
        var name = (p.name || '').toLowerCase();
        if (name.indexOf('diplom') >= 0 || name.indexOf('de-esc') >= 0 || name.indexOf('resolution') >= 0 || name.indexOf('breakthrough') >= 0 || name.indexOf('ceasefire') >= 0) {
          _projDeescProb += prob;
        } else if (name.indexOf('escal') >= 0 || name.indexOf('conflag') >= 0 || name.indexOf('uranium') >= 0 || name.indexOf('ground') >= 0 || name.indexOf('sof') >= 0) {
          _projEscProb += prob;
        } else {
          _projBaseProb += prob;
        }
      });
    }
    if (_projDeescProb + _projEscProb + _projBaseProb === 0) {
      _projBaseProb = 50; _projEscProb = 25; _projDeescProb = 25;
    }

    const baseRange = { lo: Math.round(lastBrent - 3), hi: Math.round(lastBrent + 5) };
    const bearRange = { lo: Math.round(lastBrent + 8), hi: Math.round(lastBrent + 18) };
    const bullRange = { lo: Math.round(lastBrent - 25), hi: Math.round(lastBrent - 15) };

    const fmtRange = r => '$' + r.lo + '–$' + r.hi;
    const baseEl = document.getElementById('projBaseVal');
    const bearEl = document.getElementById('projBearVal');
    const bullEl = document.getElementById('projBullVal');
    const noteEl = document.getElementById('projModelNote');
    if (baseEl) baseEl.textContent = fmtRange(baseRange);
    if (bearEl) bearEl.textContent = fmtRange(bearRange);
    if (bullEl) bullEl.textContent = fmtRange(bullRange);
    // Populate probability badges and TACO values in scenario boxes
    var _bpEl = document.getElementById('projBaseProb');
    var _epEl = document.getElementById('projEscProb');
    var _dpEl = document.getElementById('projDeescProb');
    if (_bpEl) _bpEl.textContent = _projBaseProb + '% probability';
    if (_epEl) _epEl.textContent = _projEscProb + '% probability';
    if (_dpEl) _dpEl.textContent = _projDeescProb + '% probability';
    var _btEl = document.getElementById('projBaseTaco');
    var _etEl = document.getElementById('projEscTaco');
    var _dtEl = document.getElementById('projDeescTaco');
    if (_btEl) _btEl.textContent = currentTACO;
    if (_etEl) _etEl.textContent = Math.max(1, Math.round(currentTACO / 2));
    if (_dtEl) _dtEl.textContent = Math.min(100, currentTACO * 3);

    const daysRemain = 30 - day;
    const daysRemain60 = 60 - day;
    if (noteEl) {
      noteEl.innerHTML = '<strong style="color:var(--color-text-muted);">Note on methodology:</strong> The regression line (dashed amber) on the chart shows the descriptive fit of TACO(t) vs Brent(t+3) over Days 1–' + n + '. '
        + 'It yields a <em>positive</em> slope — a statistical artefact: after the Day 5 spike, both TACO and Brent fell together (demand destruction + war pricing unwinding simultaneously), which confounds the causal direction. '
        + 'Economically, lower TACO (more escalation) should push Brent <em>higher</em>, not lower. '
        + 'The scenario ranges below therefore use economic reasoning: escalation → supply shock → ' + fmtRange(bearRange) + '; de-escalation → IEA release + normalisation → ' + fmtRange(bullRange) + '. '
        + 'Regression approach revisited at n≥30 (' + daysRemain + ' days). INSUFFICIENT DATA: sample n=' + n + ' (' + daysRemain + ' to 30, ' + daysRemain60 + ' to 60). Not a trading recommendation.';
    }

    // All 3 scenarios branch from last actual day, fan out 3 days
    const branchIdx = n - 1;  // last actual data point
    const projection = Array(n).fill(null);
    const bearCase   = Array(n).fill(null);
    const bullCase   = Array(n).fill(null);
    // Branch point
    projection[branchIdx] = lastBrent;
    bearCase[branchIdx]   = lastBrent;
    bullCase[branchIdx]   = lastBrent;
    // Base: gentle drift toward midpoint of range
    const baseMid = (baseRange.lo + baseRange.hi) / 2;
    const bearMid = (bearRange.lo + bearRange.hi) / 2;
    const bullMid = (bullRange.lo + bullRange.hi) / 2;
    for (let d = 1; d <= 3; d++) {
      const t = d / 3; // interpolation factor
      projection.push(parseFloat((lastBrent + t * (baseMid - lastBrent)).toFixed(0)));
      bearCase.push(parseFloat((lastBrent + t * (bearMid - lastBrent)).toFixed(0)));
      bullCase.push(parseFloat((lastBrent + t * (bullMid - lastBrent)).toFixed(0)));
    }
    window._projectionChart = new Chart(projEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          { label:'Brent Actual',            data:actual,     borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.08)', borderWidth:2.5, pointRadius:3, tension:0.3, spanGaps:false },
          { label:'Model Fit (lag-3)',        data:modelFit,   borderColor:'rgba(245,158,11,0.35)', borderWidth:1.5, borderDash:[4,3], pointRadius:2, tension:0.3, spanGaps:false },
          { label:'Base (TACO=' + currentTACO + ') · ' + _projBaseProb + '%',            data:projection, borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,0.08)', borderWidth:2.5, borderDash:[8,4], pointRadius:4, tension:0.3, spanGaps:false, fill:false },
          { label:'Escalation (→' + Math.max(1, Math.round(currentTACO/2)) + ') · ' + _projEscProb + '%',      data:bearCase,   borderColor:'#ef4444', borderWidth:2, borderDash:[4,3], pointRadius:3, tension:0.3, spanGaps:false },
          { label:'De-escalation (→' + Math.min(100, currentTACO*3) + ') · ' + _projDeescProb + '%', data:bullCase,   borderColor:'#22c55e', borderWidth:2, borderDash:[4,3], pointRadius:3, tension:0.3, spanGaps:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: {
          legend: { position:'top', labels:{font:{size:10}, boxWidth:12, padding:10} },
          tooltip: {
            backgroundColor:'rgba(15,23,42,0.95)', borderColor:'rgba(255,255,255,0.08)', borderWidth:1,
            callbacks: { label: ctx => ctx.raw === null ? '' : `${ctx.dataset.label}: $${ctx.raw}` }
          },
          annotation: {
            annotations: {
              projStart: { type:'line', xMin:branchIdx, xMax:branchIdx, borderColor:'rgba(148,163,184,0.3)', borderWidth:1, borderDash:[4,4],
                label:{ content:'Projection →', display:true, position:'start', font:{size:9}, color:'#64748b', backgroundColor:'transparent' } }
            }
          }
        },
        scales: {
          x: { grid:{display:false}, ticks:{font:{size:9}, color:'#64748b'} },
          y: {
            grid:{color:'rgba(255,255,255,0.05)'},
            ticks:{font:{family:"'JetBrains Mono',monospace",size:9}, color:'#64748b', callback:v=>'$'+v},
            title:{display:true, text:'Brent ($/bbl)', font:{size:9}, color:'#475569'}
          }
        }
      }
    });
  }

  // ---- 4. MARKET HISTORY CHART (reuses DASHBOARD_DATA — same source as overview) ----
  const mktEl = document.getElementById('tacoMktHistChart');
  if (mktEl) {
    // Read from same unified data source as overview chart (no duplication)
    const rawBrentM = rawBrent;
    const rawVIXM   = rawVIX;
    const rawHYGM   = rawHYG;
    const rawSPM    = rawSP;
    const rawTACOM  = rawTACO;
    const dateLabels = DASHBOARD_DATA.chartData.labels;
    // Compute war day numbers for this chart too
    const _mktWarStart = new Date(2026, 1, 28);
    const _mktWarDays = dateLabels.map(function(lbl) {
      var p = lbl.split(' '); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(p[0]);
      return m >= 0 ? Math.round((new Date(2026, m, parseInt(p[1])) - _mktWarStart) / 86400000) + 1 : null;
    });
    const dayLabelsM = dateLabels.map((d, i) => 'D' + (_mktWarDays[i] || i+1) + '\n' + d);
    function idxM(arr) { return arr.map(v => parseFloat((v / arr[0] * 100).toFixed(2))); }
    window._tacoMktChart = new Chart(mktEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: dayLabelsM,
        datasets: [
          { label:'Brent Crude',    data:idxM(rawBrentM), borderColor:'#f59e0b', borderWidth:2, pointRadius:3, tension:0.3, fill:false },
          { label:'VIX',            data:idxM(rawVIXM),   borderColor:'#ef4444', borderWidth:2, pointRadius:3, tension:0.3, fill:false },
          { label:'HYG (HY Spread)',data:idxM(rawHYGM),   borderColor:'#8b5cf6', borderWidth:2, pointRadius:3, tension:0.3, fill:false },
          { label:'S&P 500',        data:idxM(rawSPM),    borderColor:'#22c55e', borderWidth:2, pointRadius:3, tension:0.3, fill:false },
          { label:'TACO Score',     data:idxM(rawTACOM),  borderColor:'#38bdf8', borderWidth:2, borderDash:[5,4], pointRadius:3, tension:0.3, fill:false }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins: {
          legend:{ display:false },
          tooltip:{
            backgroundColor:'rgba(15,23,42,0.95)', borderColor:'rgba(255,255,255,0.08)', borderWidth:1,
            titleColor:'#94a3b8', bodyColor:'#e2e8f0', padding:10,
            callbacks: {
              title: items => { const d=items[0].dataIndex; const wd=_mktWarDays[d]||d+1; return `Day ${wd} — ${dateLabels[d] || ''}`; },
              label: ctx => {
                const raw=[rawBrentM,rawVIXM,rawHYGM,rawSPM,rawTACOM][ctx.datasetIndex][ctx.dataIndex];
                const units=['$/bbl','pts','$','pts','/100'];
                const names=['Brent','VIX','HYG','S&P 500','TACO'];
                const sign=ctx.parsed.y>=100?'+':'';
                return `${names[ctx.datasetIndex]}: ${raw} ${units[ctx.datasetIndex]}  (${sign}${(ctx.parsed.y-100).toFixed(1)}%)`;
              }
            }
          }
        },
        scales: {
          x:{ grid:{display:false}, ticks:{font:{family:"'JetBrains Mono',monospace",size:9}, color:'#64748b', maxRotation:0} },
          y:{
            grid:{color:'rgba(255,255,255,0.05)', lineWidth:0.5},
            ticks:{font:{family:"'JetBrains Mono',monospace",size:9}, color:'#64748b', callback:v=>(v>=100?'+':'')+(v-100).toFixed(0)+'%'},
            title:{display:true, text:'Change from Day 1 (%)', font:{size:9}, color:'#475569'}
          }
        }
      }
    });
  }
}
