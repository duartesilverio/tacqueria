// ===== WHALE WATCH — PREDICTION MARKET BETTOR TRACKING =====
// Tracks large trades across Iran/conflict-related Polymarket markets
// Uses Polymarket Data API (public, no auth required)

(function() {
  'use strict';

  // ── CONFIGURATION ──────────────────────────────────────────
  const WHALE_THRESHOLD = 500;    // USD — trades above this are "notable"
  const SHARK_THRESHOLD = 5000;   // USD — "shark" trades
  const MEGA_THRESHOLD  = 25000;  // USD — "whale" trades
  const REFRESH_INTERVAL = 60000; // 60s auto-refresh
  const MAX_TRADES_DISPLAY = 50;  // max trades in feed
  const DATA_API = 'https://data-api.polymarket.com';

  // Iran/conflict condition IDs to monitor (active high-volume markets)
  const WATCHED_MARKETS = [
    // Ceasefire
    { cid: '0x3c6bcb7da14ea576e5af25547dbd96f2bb24ac34e748e76aecff2ee9195dd1ac', label: 'Ceasefire Mar 31', category: 'ceasefire' },
    { cid: '0x80059ff4e694f878c0498f6f3a067ee7ca62dc2fc46251a4287b58355ce47bc5', label: 'Ceasefire Apr 30', category: 'ceasefire' },
    { cid: '0x07d45de444dbe0595c068a9eade49ace2bd381e30d6a45022d801ec10e7d0294', label: 'Ceasefire Mar 15', category: 'ceasefire' },
    // Conflict ends
    { cid: '0xc5dee81018bb9a94aeeae933e3824b534fad8aaadbd342c2a518e1eddbf88593', label: 'Conflict Ends Mar 15', category: 'ceasefire' },
    { cid: '0x5a200d7d560169d60dc82cd16bb14c16f36f029fdf609dcb92d06a554f9f0fe1', label: 'Conflict Ends Mar 31', category: 'ceasefire' },
    { cid: '0xa6ddb7146f48a12dbf73456d654211b01d7493829932c31b7fe85d82120d338f', label: 'Conflict Ends Apr 30', category: 'ceasefire' },
    // US forces enter Iran
    { cid: '0x306d10d4a4d51b41910dbc779ca00908bd917c131541c5c42bbbc736258d2d56', label: 'US Enters Iran Mar 31', category: 'escalation' },
    { cid: '0xe4b9a52d2bb336ff9d84799b70e72e8e5f4507df881af60f3f4daeb9f541a80e', label: 'US Enters Iran Dec 31', category: 'escalation' },
    // Regime
    { cid: '0x9352c559e9648ab4cab236087b64ca85c5b7123a4c7d9d7d4efde4a39c18056f', label: 'Regime Falls Jun 30', category: 'regime' },
    { cid: '0xcc07920770fdaadcdc4dff75056e88140d0988c9cb1dbfb4a78eda51b2868027', label: 'Leadership Change Mar 31', category: 'regime' },
    { cid: '0x377e7fe65cf198a7fc4fdae3f2136b74729279267858daaf96718b23bc2a5607', label: 'Leadership Change Dec 31', category: 'regime' },
    // Oil
    { cid: '0xf64f880b571d7a70d858649d30f0843aa57307e304aeb617349df74ce34d044e', label: 'Crude $120 EOM', category: 'oil' },
    { cid: '0x814657a16a3c5b39834864251372e30f68ddcd0f040c5c6a83a52cddb2c35226', label: 'Crude $110 EOM', category: 'oil' },
    { cid: '0xc5300759dc2089042380795fe7384010a6b6ebdf9e6da7ed3f786d9a5f61c563', label: 'Crude $100 EOM', category: 'oil' },
  ];

  // Build lookup maps
  const cidToLabel = {};
  const cidToCategory = {};
  WATCHED_MARKETS.forEach(m => {
    cidToLabel[m.cid] = m.label;
    cidToCategory[m.cid] = m.category;
  });

  // ── STATE ──────────────────────────────────────────────────
  let allTrades = [];
  let walletProfiles = {};  // proxyWallet -> { totalVol, tradeCount, lastSeen, pseudonym }
  let refreshTimer = null;
  let isLoading = false;
  let lastFetchTime = null;
  let fetchErrors = 0;

  // ── API FETCHING ───────────────────────────────────────────

  async function fetchTradesForMarket(cid, limit) {
    limit = limit || 100;
    const url = `${DATA_API}/trades?market=${cid}&limit=${limit}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn(`[WhaleWatch] Failed to fetch trades for ${cidToLabel[cid] || cid}:`, e.message);
      return [];
    }
  }

  async function fetchAllTrades() {
    if (isLoading) return;
    isLoading = true;
    updateLoadingState(true);

    const startTime = Date.now();
    const batchSize = 5; // fetch 5 markets at a time to avoid rate limits
    const allResults = [];

    for (let i = 0; i < WATCHED_MARKETS.length; i += batchSize) {
      const batch = WATCHED_MARKETS.slice(i, i + batchSize);
      const promises = batch.map(m => fetchTradesForMarket(m.cid, 80));
      const results = await Promise.allSettled(promises);
      results.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          allResults.push(...r.value);
        }
      });
      // Small delay between batches
      if (i + batchSize < WATCHED_MARKETS.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Process trades
    const trades = allResults
      .map(t => {
        const usdValue = t.size * t.price;
        return {
          wallet: t.proxyWallet,
          side: t.side,
          size: t.size,
          price: t.price,
          usdValue: usdValue,
          timestamp: t.timestamp,
          title: t.title,
          conditionId: t.conditionId,
          label: cidToLabel[t.conditionId] || t.title,
          category: cidToCategory[t.conditionId] || 'other',
          outcome: t.outcome,
          outcomeIndex: t.outcomeIndex,
          name: t.name || t.pseudonym || '',
          pseudonym: t.pseudonym || '',
          txHash: t.transactionHash,
        };
      })
      .filter(t => t.usdValue >= WHALE_THRESHOLD)
      .sort((a, b) => b.timestamp - a.timestamp);

    // Deduplicate by txHash
    const seen = new Set();
    const deduped = [];
    for (const t of trades) {
      const key = t.txHash + t.wallet + t.size;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(t);
      }
    }

    allTrades = deduped.slice(0, MAX_TRADES_DISPLAY * 3);

    // Build wallet profiles
    walletProfiles = {};
    for (const t of allResults) {
      const w = t.proxyWallet;
      if (!walletProfiles[w]) {
        walletProfiles[w] = { totalVol: 0, tradeCount: 0, lastSeen: 0, pseudonym: t.pseudonym || t.name || '', buys: 0, sells: 0 };
      }
      const usd = t.size * t.price;
      walletProfiles[w].totalVol += usd;
      walletProfiles[w].tradeCount++;
      walletProfiles[w].lastSeen = Math.max(walletProfiles[w].lastSeen, t.timestamp);
      if (t.side === 'BUY') walletProfiles[w].buys += usd;
      else walletProfiles[w].sells += usd;
      if (!walletProfiles[w].pseudonym && (t.pseudonym || t.name)) {
        walletProfiles[w].pseudonym = t.pseudonym || t.name;
      }
    }

    lastFetchTime = new Date();
    fetchErrors = 0;
    isLoading = false;
    updateLoadingState(false);
    renderAll();

    const elapsed = Date.now() - startTime;
    console.log(`[WhaleWatch] Fetched ${allResults.length} raw trades → ${deduped.length} whale trades ($${WHALE_THRESHOLD}+) in ${elapsed}ms`);
  }

  // ── RENDERING ──────────────────────────────────────────────

  function formatUSD(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }

  function formatTime(ts) {
    const d = new Date(ts * 1000);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return Math.floor(diff) + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function shortWallet(w) {
    if (!w) return '???';
    return w.slice(0, 6) + '…' + w.slice(-4);
  }

  function getTradeClass(usd) {
    if (usd >= MEGA_THRESHOLD) return 'whale-mega';
    if (usd >= SHARK_THRESHOLD) return 'whale-shark';
    return 'whale-notable';
  }

  function getTradeIcon(usd) {
    if (usd >= MEGA_THRESHOLD) return '🐋';
    if (usd >= SHARK_THRESHOLD) return '🦈';
    return '🐟';
  }

  function getCategoryColor(cat) {
    switch (cat) {
      case 'ceasefire': return '#22c55e';
      case 'escalation': return '#ef4444';
      case 'regime': return '#8b5cf6';
      case 'oil': return '#f59e0b';
      default: return '#64748b';
    }
  }

  function getCategoryIcon(cat) {
    switch (cat) {
      case 'ceasefire': return '🕊';
      case 'escalation': return '⚔';
      case 'regime': return '🏛';
      case 'oil': return '🛢';
      default: return '📊';
    }
  }

  function updateLoadingState(loading) {
    const indicator = document.getElementById('whale-loading');
    if (indicator) {
      indicator.style.display = loading ? 'flex' : 'none';
    }
  }

  function renderAll() {
    renderSummaryCards();
    renderTradeFeed();
    renderTopWallets();
    renderFlowAnalysis();
    renderLastUpdate();
  }

  function renderLastUpdate() {
    const el = document.getElementById('whale-last-update');
    if (el && lastFetchTime) {
      el.textContent = `Last updated: ${lastFetchTime.toLocaleTimeString()} · Auto-refresh: ${REFRESH_INTERVAL / 1000}s`;
    }
  }

  function renderSummaryCards() {
    const container = document.getElementById('whale-summary-cards');
    if (!container) return;

    const now = Date.now() / 1000;
    const h24 = allTrades.filter(t => (now - t.timestamp) < 86400);
    const h1 = allTrades.filter(t => (now - t.timestamp) < 3600);

    const totalVol24h = h24.reduce((s, t) => s + t.usdValue, 0);
    const whaleCount = h24.filter(t => t.usdValue >= MEGA_THRESHOLD).length;
    const buyVol = h24.filter(t => t.side === 'BUY').reduce((s, t) => s + t.usdValue, 0);
    const sellVol = h24.filter(t => t.side === 'SELL').reduce((s, t) => s + t.usdValue, 0);
    const buyPct = totalVol24h > 0 ? Math.round((buyVol / totalVol24h) * 100) : 50;
    const biggestTrade = h24.length > 0 ? h24.reduce((a, b) => a.usdValue > b.usdValue ? a : b) : null;

    // Unique wallets
    const uniqueWallets = new Set(h24.map(t => t.wallet)).size;

    container.innerHTML = `
      <div class="whale-stat-card">
        <div class="whale-stat-label">24H WHALE VOLUME</div>
        <div class="whale-stat-value">${formatUSD(totalVol24h)}</div>
        <div class="whale-stat-sub">${h24.length} notable trades · ${uniqueWallets} wallets</div>
      </div>
      <div class="whale-stat-card">
        <div class="whale-stat-label">BUY / SELL RATIO</div>
        <div class="whale-stat-value">${buyPct}% <span class="whale-buy-tag">BUY</span></div>
        <div class="whale-stat-bar">
          <div class="whale-bar-buy" style="width:${buyPct}%"></div>
          <div class="whale-bar-sell" style="width:${100 - buyPct}%"></div>
        </div>
        <div class="whale-stat-sub">${formatUSD(buyVol)} buy · ${formatUSD(sellVol)} sell</div>
      </div>
      <div class="whale-stat-card">
        <div class="whale-stat-label">MEGA WHALES (24H)</div>
        <div class="whale-stat-value">${whaleCount} <span style="font-size:0.65rem;color:var(--color-text-faint);">$${(MEGA_THRESHOLD / 1000).toFixed(0)}K+ trades</span></div>
        <div class="whale-stat-sub">${h1.length} trades last hour</div>
      </div>
      <div class="whale-stat-card">
        <div class="whale-stat-label">LARGEST TRADE</div>
        <div class="whale-stat-value">${biggestTrade ? formatUSD(biggestTrade.usdValue) : 'N/A'}</div>
        <div class="whale-stat-sub">${biggestTrade ? (biggestTrade.side + ' ' + biggestTrade.label) : '—'}</div>
      </div>
    `;
  }

  function renderTradeFeed() {
    const container = document.getElementById('whale-trade-feed');
    if (!container) return;

    const display = allTrades.slice(0, MAX_TRADES_DISPLAY);

    if (display.length === 0) {
      container.innerHTML = '<div class="whale-empty">No whale trades detected yet. Data refreshes every 60s.</div>';
      return;
    }

    let html = '';
    for (const t of display) {
      const cls = getTradeClass(t.usdValue);
      const icon = getTradeIcon(t.usdValue);
      const catIcon = getCategoryIcon(t.category);
      const catColor = getCategoryColor(t.category);
      const sideClass = t.side === 'BUY' ? 'whale-side-buy' : 'whale-side-sell';
      const displayName = t.pseudonym || t.name || shortWallet(t.wallet);
      const polygonscanUrl = `https://polygonscan.com/tx/${t.txHash}`;

      html += `
        <div class="whale-trade-row ${cls}">
          <div class="whale-trade-icon">${icon}</div>
          <div class="whale-trade-body">
            <div class="whale-trade-top">
              <span class="whale-trade-amount ${sideClass}">${t.side} ${formatUSD(t.usdValue)}</span>
              <span class="whale-trade-market" style="border-color:${catColor};">${catIcon} ${t.label}</span>
              <span class="whale-trade-outcome">${t.outcome} @ ${(t.price * 100).toFixed(0)}¢</span>
            </div>
            <div class="whale-trade-bottom">
              <a href="${polygonscanUrl}" target="_blank" rel="noopener" class="whale-wallet-link" title="${t.wallet}">${displayName}</a>
              <span class="whale-trade-time">${formatTime(t.timestamp)}</span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderTopWallets() {
    const container = document.getElementById('whale-top-wallets');
    if (!container) return;

    const wallets = Object.entries(walletProfiles)
      .filter(([_, p]) => p.totalVol >= SHARK_THRESHOLD)
      .sort((a, b) => b[1].totalVol - a[1].totalVol)
      .slice(0, 15);

    if (wallets.length === 0) {
      container.innerHTML = '<div class="whale-empty">No significant wallets detected yet.</div>';
      return;
    }

    let html = `<table class="whale-wallet-table">
      <thead><tr>
        <th>Tier</th><th>Wallet</th><th>Total Vol</th><th>Trades</th><th>Buy/Sell</th><th>Last Active</th>
      </tr></thead><tbody>`;

    for (const [addr, p] of wallets) {
      const tier = p.totalVol >= MEGA_THRESHOLD ? '🐋 Whale' : '🦈 Shark';
      const tierClass = p.totalVol >= MEGA_THRESHOLD ? 'whale-tier-mega' : 'whale-tier-shark';
      const displayName = p.pseudonym || shortWallet(addr);
      const buyPct = p.totalVol > 0 ? Math.round((p.buys / p.totalVol) * 100) : 50;
      const profileUrl = `https://polymarket.com/profile/${addr}`;

      html += `<tr class="${tierClass}">
        <td>${tier}</td>
        <td><a href="${profileUrl}" target="_blank" rel="noopener" class="whale-wallet-link">${displayName}</a></td>
        <td class="mono">${formatUSD(p.totalVol)}</td>
        <td class="mono">${p.tradeCount}</td>
        <td>
          <div class="whale-mini-bar">
            <div class="whale-bar-buy" style="width:${buyPct}%" title="${buyPct}% buy"></div>
            <div class="whale-bar-sell" style="width:${100 - buyPct}%" title="${100 - buyPct}% sell"></div>
          </div>
        </td>
        <td class="mono">${formatTime(p.lastSeen)}</td>
      </tr>`;
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function renderFlowAnalysis() {
    const container = document.getElementById('whale-flow-chart');
    if (!container) return;

    // Group by category
    const categories = ['ceasefire', 'escalation', 'regime', 'oil'];
    const catLabels = { ceasefire: '🕊 Ceasefire/Diplomacy', escalation: '⚔ Escalation', regime: '🏛 Regime Change', oil: '🛢 Oil Thresholds' };

    const now = Date.now() / 1000;
    const recent = allTrades.filter(t => (now - t.timestamp) < 86400);

    let html = '<div class="whale-flow-grid">';

    for (const cat of categories) {
      const catTrades = recent.filter(t => t.category === cat);
      const buyVol = catTrades.filter(t => t.side === 'BUY').reduce((s, t) => s + t.usdValue, 0);
      const sellVol = catTrades.filter(t => t.side === 'SELL').reduce((s, t) => s + t.usdValue, 0);
      const totalVol = buyVol + sellVol;
      const buyPct = totalVol > 0 ? Math.round((buyVol / totalVol) * 100) : 50;
      const netFlow = buyVol - sellVol;
      const flowDir = netFlow >= 0 ? 'inflow' : 'outflow';
      const flowColor = netFlow >= 0 ? '#22c55e' : '#ef4444';
      const color = getCategoryColor(cat);

      // YES-side dominance: buying YES (=buying outcome) vs buying NO (=selling YES)
      const yesBuys = catTrades.filter(t => t.side === 'BUY' && t.outcomeIndex === 0).reduce((s, t) => s + t.usdValue, 0);
      const noBuys = catTrades.filter(t => t.side === 'BUY' && t.outcomeIndex === 1).reduce((s, t) => s + t.usdValue, 0);
      const sentiment = yesBuys > noBuys ? 'YES-leaning' : (noBuys > yesBuys ? 'NO-leaning' : 'Neutral');
      const sentColor = yesBuys > noBuys ? '#22c55e' : (noBuys > yesBuys ? '#ef4444' : '#64748b');

      html += `
        <div class="whale-flow-card" style="border-top: 2px solid ${color};">
          <div class="whale-flow-label">${catLabels[cat]}</div>
          <div class="whale-flow-vol">${formatUSD(totalVol)}</div>
          <div class="whale-flow-bar">
            <div class="whale-bar-buy" style="width:${buyPct}%"></div>
            <div class="whale-bar-sell" style="width:${100 - buyPct}%"></div>
          </div>
          <div class="whale-flow-meta">
            <span style="color:${flowColor};">Net: ${flowDir === 'inflow' ? '+' : ''}${formatUSD(Math.abs(netFlow))}</span>
            <span style="color:${sentColor};">Whale ${sentiment}</span>
          </div>
          <div class="whale-flow-trades">${catTrades.length} trades · ${buyPct}% buy</div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ── INITIALIZATION ─────────────────────────────────────────

  function init() {
    const panel = document.querySelector('[data-panel="predmkts"]');
    if (!panel) {
      console.warn('[WhaleWatch] Crowd Forecast panel not found');
      return;
    }

    // Insert Whale Watch section at the top of the predmkts panel
    const whaleSection = document.createElement('div');
    whaleSection.id = 'whale-watch-section';
    whaleSection.innerHTML = `
      <div class="whale-watch-header">
        <div class="whale-watch-title-row">
          <h3 class="predmkt-section-title" style="margin:0;">
            🐋 Whale Watch — Live Trade Intelligence
          </h3>
          <div class="whale-controls">
            <span id="whale-last-update" class="whale-update-ts"></span>
            <button id="whale-refresh-btn" class="whale-refresh-btn" title="Refresh now">↻</button>
          </div>
        </div>
        <p class="predmkt-section-desc" style="margin:var(--space-2) 0 0 0;">
          Real-time tracking of large trades ($${WHALE_THRESHOLD}+) across Iran/conflict prediction markets on <a href="https://polymarket.com" target="_blank" rel="noopener">Polymarket</a>.
          🐋 = $${(MEGA_THRESHOLD / 1000).toFixed(0)}K+ whale &nbsp; 🦈 = $${(SHARK_THRESHOLD / 1000).toFixed(0)}K+ shark &nbsp; 🐟 = $${WHALE_THRESHOLD}+ notable.
          All trades settle on-chain (Polygon) — fully transparent and verifiable.
        </p>
        <div id="whale-loading" class="whale-loading" style="display:none;">
          <div class="whale-loading-spinner"></div>
          <span>Fetching whale trades across ${WATCHED_MARKETS.length} markets…</span>
        </div>
      </div>

      <!-- Summary Cards -->
      <div id="whale-summary-cards" class="whale-summary-cards"></div>

      <!-- Flow Analysis -->
      <div class="section-card" style="margin-top:var(--space-3);">
        <h4 class="whale-section-subtitle">Category Flow — Whale Sentiment by Sector (24h)</h4>
        <div id="whale-flow-chart"></div>
      </div>

      <!-- Live Trade Feed -->
      <div class="section-card" style="margin-top:var(--space-3);">
        <h4 class="whale-section-subtitle">Live Trade Feed — ${MAX_TRADES_DISPLAY} Most Recent</h4>
        <div id="whale-trade-feed" class="whale-trade-feed"></div>
      </div>

      <!-- Top Wallets -->
      <div class="section-card" style="margin-top:var(--space-3);">
        <h4 class="whale-section-subtitle">Top Wallets — Leaderboard</h4>
        <p class="predmkt-section-desc" style="margin:0 0 var(--space-2) 0;">Ranked by total volume across all monitored Iran/conflict markets. Click wallet to view full Polymarket profile.</p>
        <div id="whale-top-wallets"></div>
      </div>

      <div class="whale-disclaimer">
        <p>Data sourced from <a href="https://data-api.polymarket.com" target="_blank" rel="noopener">Polymarket Data API</a> (public). 
        Trades settle on <a href="https://polygonscan.com" target="_blank" rel="noopener">Polygon</a>. 
        Inspired by <a href="https://polywhaler.com" target="_blank" rel="noopener">Polywhaler</a>.
        Thresholds: 🐋 $${(MEGA_THRESHOLD / 1000).toFixed(0)}K+ · 🦈 $${(SHARK_THRESHOLD / 1000).toFixed(0)}K+ · 🐟 $${WHALE_THRESHOLD}+.
        Auto-refreshes every ${REFRESH_INTERVAL / 1000}s.</p>
      </div>
    `;

    // ── BUILD 2-COLUMN GRID LAYOUT ─────────────────────────
    // LEFT col = whale watch (dynamic), RIGHT col = volume intel + signal contracts + charts (static HTML)

    // Identify the static sections to move into the right column
    const allCards = Array.from(panel.children);
    // Volume Intelligence = section-card with #pmVolBubbleChart
    const volIntelCard = panel.querySelector('#pmVolBubbleChart');
    const volIntelSection = volIntelCard ? volIntelCard.closest('.section-card') : null;
    // Key Signal Contracts = section-card with .predmkt-signal-grid
    const signalSection = panel.querySelector('.predmkt-signal-grid');
    const signalCard = signalSection ? signalSection.closest('.section-card') : null;
    // Charts row = .predmkt-charts-row (ceasefire + oil charts)
    const chartsRow = panel.querySelector('.predmkt-charts-row');

    // Create the grid wrapper
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'whale-volume-grid';

    // Left column: whale watch
    const leftCol = document.createElement('div');
    leftCol.className = 'whale-left-col';
    leftCol.appendChild(whaleSection);

    // Right column: Volume Intelligence + Signal Contracts + Charts
    const rightCol = document.createElement('div');
    rightCol.className = 'whale-right-col';
    if (volIntelSection) rightCol.appendChild(volIntelSection);
    if (signalCard) rightCol.appendChild(signalCard);
    if (chartsRow) rightCol.appendChild(chartsRow);

    gridWrapper.appendChild(leftCol);
    gridWrapper.appendChild(rightCol);

    // Insert the grid wrapper after the header section-card (first child of predmkts)
    const headerCard = panel.querySelector('.section-card');
    if (headerCard && headerCard.nextSibling) {
      panel.insertBefore(gridWrapper, headerCard.nextSibling);
    } else {
      panel.appendChild(gridWrapper);
    }

    // Refresh button
    const refreshBtn = document.getElementById('whale-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        fetchAllTrades();
      });
    }

    // Initial fetch when tab is activated
    const tabBtn = document.querySelector('[data-tab="predmkts"]');
    if (tabBtn) {
      tabBtn.addEventListener('click', function() {
        if (!lastFetchTime) {
          fetchAllTrades();
        }
      });
    }

    // Also fetch immediately if the tab is already active
    if (panel.classList.contains('active')) {
      fetchAllTrades();
    }

    // Auto-refresh
    refreshTimer = setInterval(function() {
      const activePanel = document.querySelector('.tab-panel.active');
      if (activePanel && activePanel.getAttribute('data-panel') === 'predmkts') {
        fetchAllTrades();
      }
    }, REFRESH_INTERVAL);

    console.log('[WhaleWatch] Initialized — monitoring', WATCHED_MARKETS.length, 'markets');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
