/* ============================================================
   PREDICTION ANALYTICS — Four Lenses + Scenario Matrix Renderer
   Reads all data from DASHBOARD_DATA.predictionAnalytics
   ============================================================ */
(function () {
  'use strict';

  const PA = DASHBOARD_DATA.predictionAnalytics;
  if (!PA) return;

  // ── Helpers ─────────────────────────────────────────────────
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function mdBold(str) {
    var parts = str.split(/\*\*(.+?)\*\*/g);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      out += (i % 2 === 1) ? '<strong>' + esc(parts[i]) + '</strong>' : esc(parts[i]);
    }
    return out;
  }

  const LENS_ICONS = {
    statistical: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><circle cx="9" cy="13" r="2"/><circle cx="14" cy="8" r="2"/><circle cx="19" cy="11" r="2"/><path d="M9 13l5-5 5 3" stroke-dasharray="2 2"/></svg>',
    interactive: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6M6 9v6M18 9v6M9 18h6"/></svg>',
    chaotic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke-dasharray="3 2"/><path d="M12 8v0"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    complex: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/></svg>'
  };

  const LENS_COLORS = {
    statistical: { main: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
    interactive: { main: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    chaotic:     { main: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
    complex:     { main: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' }
  };

  const LENS_LABELS = {
    statistical: 'Fisher',
    interactive: 'Lotka',
    chaotic: 'Lorenz',
    complex: 'Kolmogorov'
  };

  const LENS_WEIGHTS = {
    statistical: 25,
    interactive: 35,
    chaotic: 20,
    complex: 20
  };

  // ── 1. FOUR LENSES (2×2 grid) ──────────────────────────────
  function renderFourLenses() {
    const container = document.getElementById('pa-four-lenses');
    if (!container || !PA.fourLenses) return;

    const lensOrder = ['statistical', 'interactive', 'chaotic', 'complex'];
    let html = '';

    lensOrder.forEach(key => {
      const lens = PA.fourLenses[key];
      if (!lens) return;
      const c = LENS_COLORS[key];
      const label = LENS_LABELS[key];
      const weight = LENS_WEIGHTS[key];

      html += '<div class="pa-lens-card" style="border-color:' + c.border + ';">';

      // Header
      html += '<div class="pa-lens-header">';
      html += '<div class="pa-lens-icon" style="color:' + c.main + ';">' + LENS_ICONS[key] + '</div>';
      html += '<div class="pa-lens-title-wrap">';
      html += '<div class="pa-lens-name" style="color:' + c.main + ';">' + esc(lens.title || key) + '</div>';
      html += '<div class="pa-lens-subtitle">' + esc(label) + ' · Weight ' + weight + '%</div>';
      html += '</div>';
      html += '</div>';

      // Key insight
      if (lens.keyInsight) {
        html += '<div class="pa-lens-insight">' + mdBold(lens.keyInsight) + '</div>';
      }

      // Signals list
      if (lens.signals && lens.signals.length) {
        html += '<div class="pa-lens-signals">';
        lens.signals.forEach(sig => {
          const sigColor = sig.color === 'red' ? '#ef4444' : sig.color === 'amber' ? '#f59e0b' : sig.color === 'green' ? '#22c55e' : '#60a5fa';
          html += '<div class="pa-signal-row">';
          html += '<span class="pa-signal-dot" style="background:' + sigColor + ';"></span>';
          html += '<span>' + mdBold(sig.text) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      // 7-day prediction
      if (lens.sevenDayPrediction) {
        html += '<div class="pa-lens-prediction" style="border-color:' + c.border + ';background:' + c.bg + ';">';
        html += '<div class="pa-pred-label" style="color:' + c.main + ';">7-DAY PREDICTION</div>';
        html += '<div class="pa-pred-text">' + mdBold(lens.sevenDayPrediction) + '</div>';
        html += '</div>';
      }

      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ── 2. SCENARIO MATRIX ──────────────────────────────────────
  function renderScenarioMatrix() {
    const container = document.getElementById('pa-scenario-matrix');
    if (!container || !PA.scenarioMatrix) return;

    let html = '';

    PA.scenarioMatrix.forEach((sc, idx) => {
      const prob = sc.probabilityPercent || 0;
      const probColor = prob >= 40 ? '#ef4444' : prob >= 25 ? '#f59e0b' : prob >= 15 ? '#60a5fa' : '#8b8f9a';
      const borderColor = prob >= 40 ? 'rgba(239,68,68,0.25)' : prob >= 25 ? 'rgba(245,158,11,0.25)' : prob >= 15 ? 'rgba(96,165,250,0.25)' : 'rgba(139,143,154,0.2)';
      const leftBorder = prob >= 40 ? '#ef4444' : prob >= 25 ? '#f59e0b' : prob >= 15 ? '#60a5fa' : '#555a66';

      html += '<div class="pa-scenario-card" style="border-color:' + borderColor + ';border-left:4px solid ' + leftBorder + ';">';

      // Top row: probability + name + market range
      html += '<div class="pa-scenario-top">';

      // Probability
      html += '<div class="pa-scenario-prob">';
      html += '<div class="pa-prob-num" style="color:' + probColor + ';">' + prob + '%</div>';
      html += '<div class="pa-prob-label">Analytical</div>';
      html += '</div>';

      // Body
      html += '<div class="pa-scenario-body">';
      html += '<div class="pa-scenario-name">' + esc(sc.scenarioName) + '</div>';
      html += '<div class="pa-scenario-desc">' + mdBold(sc.description) + '</div>';

      // Predicted events
      if (sc.predictedEvents && sc.predictedEvents.length) {
        html += '<div class="pa-scenario-events">';
        sc.predictedEvents.forEach(ev => {
          const confColor = ev.confidence === 'high' ? '#22c55e' : ev.confidence === 'medium' ? '#f59e0b' : '#8b8f9a';
          html += '<div class="pa-event-row">';
          html += '<span class="pa-event-date">' + esc(ev.estimatedDate) + '</span>';
          html += '<span class="pa-event-text">' + esc(ev.event) + '</span>';
          html += '<span class="pa-event-conf" style="color:' + confColor + ';">' + esc(ev.confidence) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      // Tags
      html += '<div class="pa-scenario-tags">';
      if (sc.marketImpacts) {
        const mi = sc.marketImpacts;
        if (mi.brentRange) html += '<span class="pa-tag pa-tag-red">Brent: ' + esc(mi.brentRange) + '</span>';
        if (mi.vixRange) html += '<span class="pa-tag pa-tag-amber">VIX: ' + esc(mi.vixRange) + '</span>';
        if (mi.tacoTrajectory) html += '<span class="pa-tag pa-tag-blue">TACO: ' + esc(mi.tacoTrajectory) + '</span>';
      }
      if (sc.gameTheoryClassification) {
        html += '<span class="pa-tag pa-tag-purple">' + esc(sc.gameTheoryClassification) + '</span>';
      }
      html += '</div>';

      html += '</div>'; // body

      // Market sidebar
      if (sc.marketImpacts) {
        html += '<div class="pa-scenario-market">';
        html += '<div class="pa-market-label">Brent Range</div>';
        html += '<div class="pa-market-val" style="color:' + probColor + ';">' + esc(sc.marketImpacts.brentRange || '—') + '</div>';
        if (sc.marketImpacts.vixRange) {
          html += '<div class="pa-market-sub">VIX: ' + esc(sc.marketImpacts.vixRange) + '</div>';
        }
        if (sc.marketImpacts.tacoTrajectory) {
          html += '<div class="pa-market-sub">TACO: ' + esc(sc.marketImpacts.tacoTrajectory) + '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // top

      // Triggers row
      if (sc.confirmationTrigger || sc.disconfirmationTrigger) {
        html += '<div class="pa-scenario-triggers">';
        if (sc.confirmationTrigger) {
          html += '<div class="pa-trigger-item"><span class="pa-trigger-label" style="color:#22c55e;">CONFIRMS:</span> ' + mdBold(sc.confirmationTrigger) + '</div>';
        }
        if (sc.disconfirmationTrigger) {
          html += '<div class="pa-trigger-item"><span class="pa-trigger-label" style="color:#ef4444;">RULES OUT:</span> ' + mdBold(sc.disconfirmationTrigger) + '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // card
    });

    container.innerHTML = html;
  }

  // ── 3. CONVERGENCE ASSESSMENT ───────────────────────────────
  function renderConvergence() {
    const container = document.getElementById('pa-convergence');
    if (!container || !PA.convergenceAssessment) return;
    const ca = PA.convergenceAssessment;

    let html = '';

    // Agreement zones
    if (ca.agreementZones && ca.agreementZones.length) {
      html += '<div class="pa-conv-section">';
      html += '<div class="pa-conv-label" style="color:#22c55e;">AGREEMENT ZONES — HIGH CONFIDENCE</div>';
      ca.agreementZones.forEach(az => {
        html += '<div class="pa-conv-card pa-conv-agree">';
        html += '<div class="pa-conv-pred">' + mdBold(az.prediction) + '</div>';
        if (az.reasoning) html += '<div class="pa-conv-reason">' + esc(az.reasoning) + '</div>';
        if (az.supportingLenses) {
          html += '<div class="pa-conv-lenses">';
          az.supportingLenses.forEach(l => {
            const lc = LENS_COLORS[l] || LENS_COLORS.statistical;
            html += '<span class="pa-conv-lens-tag" style="color:' + lc.main + ';border-color:' + lc.border + ';background:' + lc.bg + ';">' + esc(l) + '</span>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // Divergence zones
    if (ca.divergenceZones && ca.divergenceZones.length) {
      html += '<div class="pa-conv-section">';
      html += '<div class="pa-conv-label" style="color:#f59e0b;">DIVERGENCE ZONES — GENUINE UNCERTAINTY</div>';
      ca.divergenceZones.forEach(dz => {
        html += '<div class="pa-conv-card pa-conv-diverge">';
        html += '<div class="pa-conv-issue">' + mdBold(dz.issue) + '</div>';
        if (dz.lensA && dz.lensB) {
          html += '<div class="pa-conv-vs">';
          const lcA = LENS_COLORS[dz.lensA.lens] || LENS_COLORS.statistical;
          const lcB = LENS_COLORS[dz.lensB.lens] || LENS_COLORS.statistical;
          html += '<div class="pa-conv-vs-side" style="border-color:' + lcA.border + ';"><span class="pa-conv-vs-label" style="color:' + lcA.main + ';">' + esc(dz.lensA.lens) + ':</span> ' + esc(dz.lensA.position) + '</div>';
          html += '<div class="pa-conv-vs-divider">vs</div>';
          html += '<div class="pa-conv-vs-side" style="border-color:' + lcB.border + ';"><span class="pa-conv-vs-label" style="color:' + lcB.main + ';">' + esc(dz.lensB.lens) + ':</span> ' + esc(dz.lensB.position) + '</div>';
          html += '</div>';
        }
        if (dz.implication) html += '<div class="pa-conv-impl">' + esc(dz.implication) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Net outlook
    if (ca.netSevenDayOutlook) {
      const nso = ca.netSevenDayOutlook;
      html += '<div class="pa-conv-section">';
      html += '<div class="pa-conv-label" style="color:#60a5fa;">NET 7-DAY OUTLOOK</div>';
      html += '<div class="pa-conv-card pa-conv-outlook">';
      if (nso.primaryScenario) {
        html += '<div class="pa-outlook-primary">' + esc(nso.primaryScenario) + '</div>';
      }
      if (nso.confidenceBand) {
        html += '<div class="pa-outlook-band">' + esc(nso.confidenceBand) + '</div>';
      }
      if (nso.synthesis) {
        html += '<div class="pa-outlook-synthesis">' + mdBold(nso.synthesis) + '</div>';
      }
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── 4. DECISION TREE ────────────────────────────────────────
  function renderDecisionTree() {
    const container = document.getElementById('pa-decision-tree');
    if (!container || !PA.decisionTree) return;
    const dt = PA.decisionTree;

    let html = '';

    // Critical variable
    html += '<div class="pa-dt-variable">';
    html += '<div class="pa-dt-var-label">CRITICAL BINARY VARIABLE</div>';
    html += '<div class="pa-dt-var-name">' + mdBold(dt.criticalVariable || '') + '</div>';
    if (dt.timeHorizon) html += '<div class="pa-dt-var-horizon">Resolution window: ' + esc(dt.timeHorizon) + '</div>';
    html += '</div>';

    // Branches
    if (dt.branches && dt.branches.length) {
      html += '<div class="pa-dt-branches">';
      dt.branches.forEach((br, idx) => {
        const brColor = idx === 0 ? '#ef4444' : idx === 1 ? '#22c55e' : '#f59e0b';
        const brBg = idx === 0 ? 'rgba(239,68,68,0.06)' : idx === 1 ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)';
        const brBorder = idx === 0 ? 'rgba(239,68,68,0.2)' : idx === 1 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)';

        html += '<div class="pa-dt-branch" style="background:' + brBg + ';border-color:' + brBorder + ';">';

        // Branch header with probability
        html += '<div class="pa-dt-branch-head">';
        html += '<div class="pa-dt-branch-cond" style="color:' + brColor + ';">' + esc(br.condition || ('Branch ' + (idx + 1))) + '</div>';
        if (br.probability !== undefined) {
          html += '<div class="pa-dt-branch-prob" style="color:' + brColor + ';">' + br.probability + '%</div>';
        }
        html += '</div>';

        if (br.consequence) {
          html += '<div class="pa-dt-branch-cons">' + mdBold(br.consequence) + '</div>';
        }

        if (br.marketImpact) {
          html += '<div class="pa-dt-branch-impact">' + esc(br.marketImpact) + '</div>';
        }

        html += '</div>';
      });
      html += '</div>';
    }

    // Monitoring indicators
    if (dt.monitoringIndicators && dt.monitoringIndicators.length) {
      html += '<div class="pa-dt-monitors">';
      html += '<div class="pa-dt-monitor-label">MONITORING INDICATORS</div>';
      dt.monitoringIndicators.forEach(mi => {
        html += '<div class="pa-dt-monitor-item">' + esc(mi) + '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── 5. GAME THEORY POSTURE TABLE ────────────────────────────
  function renderGameTheory() {
    const container = document.getElementById('pa-game-theory');
    if (!container || !PA.gameTheoryPosture) return;
    const gt = PA.gameTheoryPosture;

    let html = '';

    // Player postures
    if (gt.players && gt.players.length) {
      html += '<div class="pa-gt-table-wrap">';
      html += '<table class="pa-gt-table">';
      html += '<thead><tr>';
      html += '<th>Player</th><th>Revealed Strategy</th><th>Stated Strategy</th><th>Credibility Gap</th>';
      html += '</tr></thead><tbody>';
      gt.players.forEach(p => {
        const gapColor = p.credibilityGap === 'High' ? '#ef4444' : p.credibilityGap === 'Medium' ? '#f59e0b' : '#22c55e';
        html += '<tr>';
        html += '<td class="pa-gt-player">' + esc(p.player) + '</td>';
        html += '<td>' + esc(p.revealedStrategy) + '</td>';
        html += '<td>' + esc(p.statedStrategy) + '</td>';
        html += '<td style="color:' + gapColor + ';">' + esc(p.credibilityGap) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
    }

    // Equilibria assessment
    if (gt.equilibria && gt.equilibria.length) {
      html += '<div class="pa-gt-equilibria">';
      gt.equilibria.forEach(eq => {
        const trendIcon = eq.trend === 'strengthening' ? '&#9650;' : eq.trend === 'weakening' ? '&#9660;' : '&#9654;';
        const trendColor = eq.trend === 'strengthening' ? '#ef4444' : eq.trend === 'weakening' ? '#22c55e' : '#f59e0b';
        html += '<div class="pa-gt-eq-card">';
        html += '<div class="pa-gt-eq-name">' + esc(eq.name) + '</div>';
        html += '<div class="pa-gt-eq-prob">' + (eq.probability || 0) + '%</div>';
        html += '<div class="pa-gt-eq-trend" style="color:' + trendColor + ';">' + trendIcon + ' ' + esc(eq.trend || 'stable') + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── INIT ────────────────────────────────────────────────────
  renderFourLenses();
  renderScenarioMatrix();
  renderConvergence();
  renderDecisionTree();
  renderGameTheory();

})();
