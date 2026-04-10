// ===== CONFLICT CHART FULLSCREEN =====
function toggleConflictChartFullscreen() {
  var card = document.getElementById('conflictMarketCard');
  var wrap = document.getElementById('conflictChartWrap');
  var btn  = document.getElementById('conflictChartFsBtn');
  var label = document.getElementById('conflictFsLabel');
  var icon  = document.getElementById('conflictFsIcon');

  var isFs = card.classList.toggle('chart-fullscreen');

  if (isFs) {
    wrap.style.height = 'calc(100vh - 160px)';
    label.textContent = 'Exit';
    icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
    document.body.style.overflow = 'hidden';
  } else {
    wrap.style.height = '280px';
    label.textContent = 'Fullscreen';
    icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
    document.body.style.overflow = '';
  }

  // Resize chart to fit new dimensions
  if (window._conflictChart) {
    setTimeout(function() { window._conflictChart.resize(); }, 50);
  }
}

// ESC to exit fullscreen
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var card = document.getElementById('conflictMarketCard');
    if (card && card.classList.contains('chart-fullscreen')) {
      toggleConflictChartFullscreen();
    }
  }
});

// ===== PROJECTION CHART FULLSCREEN =====
function toggleProjectionFullscreen() {
  var card  = document.getElementById('projectionCard');
  var wrap  = document.getElementById('projChartWrap');
  var label = document.getElementById('projFsLabel');
  var icon  = document.getElementById('projFsIcon');
  var isFs  = card.classList.toggle('chart-fullscreen');
  if (isFs) {
    wrap.style.height = 'calc(100vh - 280px)';
    label.textContent = 'Exit';
    icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
    document.body.style.overflow = 'hidden';
  } else {
    wrap.style.height = '220px';
    label.textContent = 'Fullscreen';
    icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
    document.body.style.overflow = '';
  }
  if (window._projectionChart) setTimeout(function() { window._projectionChart.resize(); }, 50);
}

// ===== TACO MKT HIST FULLSCREEN =====
function toggleTacoMktFullscreen() {
  var card  = document.getElementById('tacoMktHistCard');
  var wrap  = document.getElementById('tacoMktChartWrap');
  var label = document.getElementById('tacoMktFsLabel');
  var icon  = document.getElementById('tacoMktFsIcon');
  var isFs  = card.classList.toggle('chart-fullscreen');
  if (isFs) {
    wrap.style.height = 'calc(100vh - 160px)';
    label.textContent = 'Exit';
    icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
    document.body.style.overflow = 'hidden';
  } else {
    wrap.style.height = '280px';
    label.textContent = 'Fullscreen';
    icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
    document.body.style.overflow = '';
  }
  if (window._tacoMktChart) setTimeout(function() { window._tacoMktChart.resize(); }, 50);
}

// ESC closes any open fullscreen
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  ['projectionCard','tacoMktHistCard'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains('chart-fullscreen')) {
      el.classList.remove('chart-fullscreen');
      document.body.style.overflow = '';
      if (id === 'projectionCard') {
        document.getElementById('projChartWrap').style.height = '220px';
        document.getElementById('projFsLabel').textContent = 'Fullscreen';
        if (window._projectionChart) window._projectionChart.resize();
      } else {
        document.getElementById('tacoMktChartWrap').style.height = '280px';
        document.getElementById('tacoMktFsLabel').textContent = 'Fullscreen';
        if (window._tacoMktChart) window._tacoMktChart.resize();
      }
    }
  });
});
