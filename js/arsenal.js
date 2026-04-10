// =============================================================================
// TACQUERIA ARSENAL & ATTRITION RENDERER
// =============================================================================
// Renders weapons stockpile, production, expenditure, and depletion data
// Requires: dashboard-data.js loaded first
// =============================================================================

(function renderArsenal() {
  'use strict';
  var D = DASHBOARD_DATA;
  if (!D.arsenal) return;

  var a = D.arsenal;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ── Helper: render a weapon card ──
  function weaponCard(item) {
    var borderColor = item.borderColor || '#ef4444';
    var statusColor = item.statusColor || borderColor;
    var depletionColor = item.depletionColor || '#f59e0b';

    var html = '<div style="background:var(--color-surface-offset);border-radius:6px;padding:8px 10px;border-top:2px solid ' + borderColor + ';">';
    html += '<div style="font-family:var(--font-mono);font-size:0.52rem;color:var(--color-text-faint);text-transform:uppercase;margin-bottom:3px;">' + esc(item.label) + '</div>';
    html += '<div style="font-family:var(--font-mono);font-size:0.9rem;font-weight:700;color:' + borderColor + ';">' + esc(item.preWar) + '</div>';
    html += '<div style="font-size:0.58rem;color:var(--color-text-faint);margin-top:2px;">Pre-war stockpile</div>';

    // Remaining bar
    if (item.remaining !== undefined && item.preWarNum > 0) {
      var pct = Math.max(2, Math.min(100, (item.remainingNum / item.preWarNum) * 100));
      var barColor = pct < 20 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
      html += '<div style="margin-top:6px;background:rgba(0,0,0,0.2);border-radius:3px;height:10px;overflow:hidden;position:relative;">';
      html += '<div style="background:' + barColor + ';width:' + pct.toFixed(1) + '%;height:100%;border-radius:3px;transition:width 0.5s;"></div>';
      html += '</div>';
      html += '<div style="display:flex;justify-content:space-between;margin-top:3px;">';
      html += '<span style="font-family:var(--font-mono);font-size:0.55rem;color:' + statusColor + ';">' + esc(item.remaining) + ' left</span>';
      html += '<span style="font-family:var(--font-mono);font-size:0.55rem;color:' + statusColor + ';">' + pct.toFixed(0) + '%</span>';
      html += '</div>';
    }

    // Production
    if (item.production) {
      html += '<div style="font-size:0.58rem;color:var(--color-text-faint);margin-top:4px;">' + esc(item.production) + '</div>';
    }

    // Status note
    if (item.status) {
      html += '<div style="font-family:var(--font-mono);font-size:0.55rem;color:' + depletionColor + ';margin-top:3px;">' + esc(item.status) + '</div>';
    }

    html += '</div>';
    return html;
  }

  // ── 1. Iran Arsenal Grid ──
  var iranGrid = document.getElementById('arsenal-iran-grid');
  if (iranGrid && a.iran) {
    var ih = '';
    a.iran.forEach(function(item) { ih += weaponCard(item); });
    iranGrid.innerHTML = ih;
  }

  // ── 2. US Arsenal Grid ──
  var usGrid = document.getElementById('arsenal-us-grid');
  if (usGrid && a.us) {
    var uh = '';
    a.us.forEach(function(item) { uh += weaponCard(item); });
    usGrid.innerHTML = uh;
  }

  // ── 3. Expenditure Summary ──
  var expDiv = document.getElementById('arsenal-expenditure');
  if (expDiv && a.expenditure) {
    var eh = '';

    // Iran side
    eh += '<div style="background:var(--color-surface-offset);border-radius:6px;padding:10px 12px;border-left:3px solid #ef4444;">';
    eh += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:#ef4444;text-transform:uppercase;margin-bottom:6px;">Iran &mdash; Fired / Expended</div>';
    a.expenditure.iran.forEach(function(row) {
      eh += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:2px 0;border-bottom:1px solid var(--color-border);">';
      eh += '<span style="font-size:0.68rem;color:var(--color-text-muted);">' + esc(row.weapon) + '</span>';
      eh += '<span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:600;color:#ef4444;">' + esc(row.count) + '</span>';
      eh += '</div>';
    });
    if (a.expenditure.iranNote) {
      eh += '<div style="font-size:0.6rem;color:var(--color-text-faint);margin-top:6px;line-height:1.4;">' + a.expenditure.iranNote + '</div>';
    }
    eh += '</div>';

    // US side
    eh += '<div style="background:var(--color-surface-offset);border-radius:6px;padding:10px 12px;border-left:3px solid #3b82f6;">';
    eh += '<div style="font-family:var(--font-mono);font-size:0.6rem;color:#3b82f6;text-transform:uppercase;margin-bottom:6px;">US &mdash; Fired / Expended</div>';
    a.expenditure.us.forEach(function(row) {
      eh += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:2px 0;border-bottom:1px solid var(--color-border);">';
      eh += '<span style="font-size:0.68rem;color:var(--color-text-muted);">' + esc(row.weapon) + '</span>';
      eh += '<span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:600;color:#3b82f6;">' + esc(row.count) + '</span>';
      eh += '</div>';
    });
    if (a.expenditure.usNote) {
      eh += '<div style="font-size:0.6rem;color:var(--color-text-faint);margin-top:6px;line-height:1.4;">' + a.expenditure.usNote + '</div>';
    }
    eh += '</div>';

    expDiv.innerHTML = eh;
  }

  // ── 4. Depletion Projections ──
  var depDiv = document.getElementById('arsenal-depletion');
  if (depDiv && a.depletion) {
    var dh = '';
    a.depletion.forEach(function(item) {
      var barColor = item.barColor || '#ef4444';
      var bgAlpha = barColor === '#ef4444' ? 'rgba(239,68,68,0.06)' : barColor === '#3b82f6' ? 'rgba(59,130,246,0.06)' : 'rgba(245,158,11,0.06)';
      var bdAlpha = barColor === '#ef4444' ? 'rgba(239,68,68,0.15)' : barColor === '#3b82f6' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)';

      dh += '<div style="display:grid;grid-template-columns:100px 1fr 120px;align-items:center;gap:8px;padding:6px 10px;background:' + bgAlpha + ';border:1px solid ' + bdAlpha + ';border-radius:6px;">';
      dh += '<div>';
      dh += '<div style="font-size:0.68rem;font-weight:600;color:' + barColor + ';">' + esc(item.weapon) + '</div>';
      dh += '<div style="font-family:var(--font-mono);font-size:0.52rem;color:var(--color-text-faint);">' + esc(item.party) + '</div>';
      dh += '</div>';

      // Depletion bar (max 120 days = 100%)
      var maxDays = 120;
      var pct = Math.min(100, (item.daysLeft / maxDays) * 100);
      dh += '<div style="background:rgba(0,0,0,0.2);border-radius:3px;height:14px;overflow:hidden;position:relative;">';
      dh += '<div style="background:' + barColor + ';width:' + pct.toFixed(1) + '%;height:100%;border-radius:3px;"></div>';
      dh += '<span style="position:absolute;left:6px;top:0;font-family:var(--font-mono);font-size:0.55rem;line-height:14px;color:rgba(255,255,255,0.85);">' + esc(item.burnRate) + '</span>';
      dh += '</div>';

      dh += '<div style="text-align:right;">';
      dh += '<div style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:' + barColor + ';">' + esc(item.daysLeftLabel) + '</div>';
      dh += '<div style="font-size:0.55rem;color:var(--color-text-faint);">' + esc(item.note) + '</div>';
      dh += '</div>';
      dh += '</div>';
    });
    depDiv.innerHTML = dh;
  }

  // ── 5. Badge ──
  var badge = document.getElementById('arsenal-badge');
  if (badge && a.badge) badge.textContent = a.badge;

  // ── 6. Bottom Line ──
  var bl = document.getElementById('arsenal-bottomline');
  if (bl && a.bottomLine) bl.innerHTML = a.bottomLine;

})();
