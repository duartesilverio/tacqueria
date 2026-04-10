/* ===== TWO-TIER TAB NAVIGATION ===== */
(function initTabs() {
  var groupBtns  = document.querySelectorAll('.nav-group-btn');
  var subRows    = document.querySelectorAll('.nav-sub-row');
  var tabBtns    = document.querySelectorAll('.tab-btn');
  var panels     = document.querySelectorAll('.tab-panel');

  function hideAllPanels() {
    panels.forEach(function(p) { p.classList.remove('active'); });
  }
  function deactivateAllTabs() {
    tabBtns.forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
  }
  function showPanel(target) {
    var panel = document.querySelector('[data-panel="' + target + '"]');
    if (panel) panel.classList.add('active');
    // Lazy-init charts on first visit
    if (target === 'markets' && !window.chartsInitialized) {
      initCharts(); initMicrostructureCharts(); initEtfSparklines();
      window.chartsInitialized = true;
    }
    if (target === 'conflictops' && !window.conflictOpsInit) {
      setTimeout(function() { initConflictOpsCharts(); }, 50);
      window.conflictOpsInit = true;
    }
    if (target === 'predmkts' && !window.predmktChartsInit) {
      initPredMktCharts(); window.predmktChartsInit = true;
    }
    if (target === 'tacoanalytics' && !window.tacoAnalyticsInit) {
      initTacoAnalyticsCharts(); window.tacoAnalyticsInit = true;
    }
    // Update stat model regime flag whenever either tab is visited
    if (target === 'tacoanalytics' || target === 'tacov2') {
      if (typeof updateStatModelRegimeFlag === 'function') updateStatModelRegimeFlag();
    }
    if (target === 'tacov2' && !window.tacoV2Init) {
      initTacoV2(); window.tacoV2Init = true;
      // Update the stat model regime flag in TACO Analytics tab
      updateStatModelRegimeFlag();
    }
    if (target === 'ceasefire' && !window.ceasefireInit) {
      if (typeof initCeasefireAnalytics === 'function') { initCeasefireAnalytics(); }
      window.ceasefireInit = true;
    }
  }

  /* --- Group button click --- */
  groupBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = btn.getAttribute('data-group');
      var directTab = btn.getAttribute('data-tab'); // Overview has this

      // Activate this group button
      groupBtns.forEach(function(g) { g.classList.remove('active'); });
      btn.classList.add('active');

      // Hide all sub-rows
      subRows.forEach(function(row) { row.classList.remove('active'); });
      deactivateAllTabs();
      hideAllPanels();

      if (directTab) {
        // Direct-link group (Overview) — no sub-row, just show the panel
        showPanel(directTab);
      } else {
        // Group with sub-tabs — show sub-row + activate first (or remembered) tab
        var subRow = document.querySelector('[data-subgroup="' + group + '"]');
        if (subRow) {
          subRow.classList.add('active');
          var activeInRow = subRow.querySelector('.tab-btn.active');
          if (!activeInRow) {
            var firstBtn = subRow.querySelector('.tab-btn');
            if (firstBtn) firstBtn.click();
          } else {
            showPanel(activeInRow.getAttribute('data-tab'));
          }
        }
      }
    });
  });

  /* --- Sub-tab button click --- */
  tabBtns.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.getAttribute('data-tab');
      deactivateAllTabs();
      hideAllPanels();
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      showPanel(target);
    });
  });

  // Ensure overview panel is visible on load
  showPanel('overview');
})();

// Initialize overview market chart on page load
document.addEventListener('DOMContentLoaded', function() {
  initConflictMarketChart();
});

// Compute stat model consensus eagerly on page load.
// This runs the MATH only (no Chart.js rendering). Charts render when tab is clicked.
window.addEventListener('load', function() {
  if (typeof computeStatConsensusOnly === 'function') {
    try {
      computeStatConsensusOnly();
      if (typeof updateStatModelRegimeFlag === 'function') updateStatModelRegimeFlag();
    } catch(e) {
      console.warn('Stat consensus pre-compute failed:', e.message);
    }
  }
});
