// Initialize overview market chart on page load (overview is default active tab)
document.addEventListener('DOMContentLoaded', function() {
  initConflictMarketChart();
});

/* ===== THEME TOGGLE ===== */
(function initTheme() {
  var toggle = document.querySelector('[data-theme-toggle]');
  var root = document.documentElement;
  var current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', current);

  if (toggle) {
    toggle.addEventListener('click', function() {
      current = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', current);
      toggle.setAttribute('aria-label', 'Switch to ' + (current === 'dark' ? 'light' : 'dark') + ' mode');

      if (current === 'dark') {
        toggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
      } else {
        toggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      }

      // Rebuild charts with new theme colors
      if (window.conflictOpsInit) {
        if (window.strikeChartInstance) { window.strikeChartInstance.destroy(); }
        if (window.hormuzChartInstance) { window.hormuzChartInstance.destroy(); }
        initConflictOpsCharts();
      }
      if (window.predmktChartsInit) {
        if (window.predCeasefireChart) { window.predCeasefireChart.destroy(); }
        if (window.predOilChart) { window.predOilChart.destroy(); }
        if (window.predCompareChart) { window.predCompareChart.destroy(); }
        window.predmktChartsInit = false;
        initPredMktCharts();
        window.predmktChartsInit = true;
      }
    });
  }
})();
