// =============================================================================
// TACQUERIA DASHBOARD DATA — Single source of truth for all dynamic values
// =============================================================================
// EDITING GUIDE:
//   1. Update values below to refresh the dashboard
//   2. No HTML editing needed — all prose is rendered from this file
//   3. render-prose.js reads DASHBOARD_DATA and populates every prose container
// =============================================================================

const DASHBOARD_DATA = {

  // ── META ────────────────────────────────────────────────────────────────────
  meta: {
    version: "4.0.0",
    timestamp: "29 Apr 2026 17:26 HKT",
    day: 61,
    dayDate: "13 APR 2026",
    threatLevel: "ELEVATED",
    threatClass: "threat-orange",
    tacoScore: 10,
    tacoMax: 100,
    tacoPrev: 18,
    tacoPrevDay: 42,
    tacoRegime: "BRENT $107.75",
    tacoRegimeLabel: "CEASEFIRE DAY 5: Vance 21-hour marathon talks in Islamabad END WITHOUT DEAL. Trump: 'We've won — whether we make a deal makes no difference.' US announces naval blockade of Hormuz. Mojtaba Khamenei breaks silence, vows revenge for father's assassination. Netanyahu rules out Lebanon ceasefire. Brent $101.53 (+6.7%). WTI $104.17 (+7.9%). VIX 19.23 (-1.3%). Gold $4,737 (-1.1%). CPI surges to 3.3% (gasoline +21.2%). Ceasefire nominally holds but diplomatic path severely damaged.",
    tacoRegimeColor: "#ef4444",
    tacoPhase: "ceasefire",
    tacoPhaseCeiling: 50,
    tacoDelta: "-6.0",
    tacoDeltaNote: "TACO DROPS 18 -> 12. Day 45 (Apr 13, Monday): Islamabad talks COLLAPSED after 21-hour marathon session. VP Vance presented 'final and best offer' requiring Iran to commit to no nuclear weapons — Iran rejected. Trump's rhetoric escalated sharply: 'We've won on the battlefield by killing Iranian leaders and destroying key military infrastructure.' US announces naval blockade to force Hormuz open. Mojtaba Khamenei (new Supreme Leader) broke silence to vow revenge for his father's assassination 40 days ago. Netanyahu ruled out any Lebanon ceasefire. Brent surges to $101.53 (+6.7%) — oil repricing failed diplomacy. CPI at 3.3% with gasoline +21.2% — war inflation accelerating. Score DROPS to 12: diplomatic path severely damaged, both sides hardening, naval blockade = new escalation vector. Only the nominal ceasefire prevents a crash to single digits.",
    tacoBadgeText: "TACO -> 12",
    tacoGaugeLabel: "12 / 100"
  },

  // ── FINANCIAL KPIs — Market Signals Tab ─────────────────────────────────────
  // NOTE: Wednesday 18 Mar — Full market day. Brent spiked to $108.52 on South Pars attack. Gold crashed. Equities red. VIX bounced.
  kpis: {
    brent:    { label: "Brent (ICE)",      price: 107.75, change: -3.51,   changePct: -3.15,  prevClose: 111.26, cssClass: "kpi-down",   note: "▼ -3.1% · Ceasefire relief · HL $107.63 · Hormuz: Contested" },
    wti:      { label: "WTI (NYMEX)",      price: 103.59,  change: 3.66,   changePct: 3.66,  prevClose: 99.93,  cssClass: "kpi-up",   note: "▲ +3.7% · WTI premium persists (spread $4.16)" },
    tnx:      { label: "US 10Y Yield",     price: 4.35,   change: 0.02,   changePct: 0.42,  prevClose: 4.34,   cssClass: "kpi-up", note: "4.35% · ▲ +0.4% · Yield steady amid ceasefire uncertainty", isPercent: true },
    vix:      { label: "VIX",              price: 18.05,  change: 0.22,   changePct: 1.23,  prevClose: 17.83,  cssClass: "kpi-up", note: "▲ +1.2% · Low vol — ceasefire risk priced in", noDollar: true },
    hyg:      { label: "HY Spread (HYG)",  price: 80.4,  change: -0.11,  changePct: -0.14, prevClose: 80.51,  cssClass: "kpi-flat", note: "▼ -0.1% · Credit widening — stress watch" },
    gold:     { label: "Gold Spot",        price: 4587.5,   change: -20.9,   changePct: -0.45, prevClose: 4608.4,   cssClass: "kpi-down",   note: "▼ -0.5% · $4,588 · Safe-haven demand easing on ceasefire", formatComma: true },
    brentWtiSpread: { label: "Brent–WTI Spread", price: 4.16, change: -7.17, changePct: -63.28, prevClose: 11.33, cssClass: "kpi-down", note: "Spread $4.16 · Spread normalizing", noDollar: false },
    ita:      { label: "ITA (Defense ETF)", price: 216.21, change: 0.17,   changePct: 0.08,  prevClose: 216.04, cssClass: "kpi-flat", note: "▲ +0.1% · Defense sector — ceasefire fragility hedge" }
  },

  // ── COMPACT MARKET STRIP (Overview tab) ─────────────────────────────────────
  marketStrip: [
    {
      label: 'Brent',
      value: '$107.75',
      delta: '-3.1%',
      color: '#ef4444'
    },
    {
      label: 'S&P 500',
      value: '$7,138.80',
      delta: '-0.5%',
      color: '#ef4444'
    },
    {
      label: 'VIX',
      value: '18.05',
      delta: '+1.2%',
      color: '#22c55e'
    },
    {
      label: 'Gold',
      value: '$4,587.50',
      delta: '-0.5%',
      color: '#ef4444'
    },
    {
      label: '10Y',
      value: '4.35',
      delta: '+0.4%',
      color: '#22c55e'
    },
    {
      label: 'HYG',
      value: '$80.40',
      delta: '-0.1%',
      color: '#ef4444'
    }
  ],

  // ── OVERVIEW TAB — TACO Sub-Scores (inline synthesis) ──────────────────────
  tacoSubScoresOverview: {
    reversibility: {
      score: 35,
      label: 'IRGC dominance locks hardline stance, limiting quick unwind. Blockade and arsenal partial rebuild reduce off-ramp feasibility today.'
    },
    rhetoric: {
      score: 75,
      label: 'Trump rejects Iran offer as \'not enough\'; Araghchi demands compensation and Hormuz regime shift. Escalatory tone from both amid stalled talks.'
    },
    diplomatic: {
      score: 60,
      label: 'Araghchi in Islamabad pushes preconditions; Trump canceled envoy trip but notes \'better\' offer. No nuclear progress signals deadlock.'
    },
    marketImpl: {
      score: 72,
      label: 'Markets cautiously optimistic: Brent $98.22 (+3.7% — recovering but $11 below pre-ceasefire). VIX 21.28 (stable). S&P +2.5%. HL $96.70 (+7.3%). OI $313M (deleveraged from $559M ATH). Credit rally continuing. Defense stocks surging (+4%) on fragility concerns.'
    },
    historical: {
      score: 68,
      label: 'Analogous to 2019 Gulf tanker crisis phase 3: blockade enforcement with 22% escalation probability after mediator failure. Base rate from 12 proxy conflicts shows 65 TACO at diplomatic nadir precedes 40% kinetic restart.'
    },
    domPolitical: {
      score: 65,
      label: 'US pressure mounts for Hormuz win pre-midterms; Iran factions split but IRGC overrides settlement push. Trump leverages rejection for hardline base.'
    }
  },

  // ── PREDICTION MARKET SIGNAL CARDS ─────────────────────────────────────────
  predictionMarkets: {
    signalCards: [
      {
        contract: 'US-Iran ceasefire by Dec 31',
        rawPrice: '100%',
        volume: '$225M',
        liqWidth: '100%',
        liqColor: '#22c55e',
        liqLabel: 'VERY HIGH',
        adjProb: '100%',
        adjProbColor: '#22c55e',
        adjDelta: '→ 100% D42 · RESOLVED. $225M volume (↑ from $181M D41).',
        volDelta: '▲ +$44M',
        volDeltaColor: '#22c55e',
        sigQuality: '★★★ RELIABLE',
        sigClass: 'sig-high'
      },
      {
        contract: 'Conflict ends by Dec 31',
        rawPrice: '94%',
        volume: '$30M',
        liqWidth: '85%',
        liqColor: '#22c55e',
        liqLabel: 'HIGH',
        adjProb: '94%',
        adjProbColor: '#22c55e',
        adjDelta: '→ 94% D42 · Steady. Talks underway.',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★★ RELIABLE',
        sigClass: 'sig-high'
      },
      {
        contract: 'Trump ends ops by Jun 30',
        rawPrice: '78%',
        volume: '$1.5M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '78%',
        adjProbColor: '#22c55e',
        adjDelta: '▼ -4pp from 82% D41 · Witkoff not Rubio. Lebanon complication.',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      },
      {
        contract: 'Iran regime falls by Jun 30',
        rawPrice: '11%',
        volume: '$2.8M',
        liqWidth: '40%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '11%',
        adjProbColor: '#94a3b8',
        adjDelta: '→ 11% D42 · Stable. Ceasefire = regime survival.',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      },
      {
        contract: 'Kharg Island struck',
        rawPrice: '21%',
        volume: '$5.5M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '21%',
        adjProbColor: '#94a3b8',
        adjDelta: '▲ +3pp from 18% D41 · Lebanon escalation = residual risk.',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      },
      {
        contract: 'Leadership change',
        rawPrice: '44%',
        volume: '$4M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '44%',
        adjProbColor: '#f59e0b',
        adjDelta: '→ 44% D42 · Stable. US claims Khamenei killed — unverified.',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      }
    ],
    liquidityTable: [
      {
        contract: 'Ceasefire Dec 31',
        rawPrice: '100%',
        volume: '$225M',
        liqWidth: '100%',
        liqColor: '#22c55e',
        liqLabel: 'VERY HIGH',
        adjProb: '100%',
        adjProbColor: '#22c55e',
        adjDelta: 'RESOLVED',
        volDelta: '▲ +$44M',
        volDeltaColor: '#22c55e',
        sigQuality: '★★★ RELIABLE',
        sigClass: 'sig-high'
      },
      {
        contract: 'Conflict ends Dec 31',
        rawPrice: '94%',
        volume: '$30M',
        liqWidth: '85%',
        liqColor: '#22c55e',
        liqLabel: 'HIGH',
        adjProb: '94%',
        adjProbColor: '#22c55e',
        adjDelta: '→ 94%',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★★ RELIABLE',
        sigClass: 'sig-high'
      },
      {
        contract: 'Trump ends ops Jun 30',
        rawPrice: '78%',
        volume: '$1.5M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '78%',
        adjProbColor: '#22c55e',
        adjDelta: '▼ -4pp',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      },
      {
        contract: 'Kharg Island struck',
        rawPrice: '21%',
        volume: '$5.5M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '21%',
        adjProbColor: '#94a3b8',
        adjDelta: '▲ +3pp',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      },
      {
        contract: 'Leadership change',
        rawPrice: '44%',
        volume: '$4M',
        liqWidth: '50%',
        liqColor: '#f59e0b',
        liqLabel: 'MEDIUM',
        adjProb: '44%',
        adjProbColor: '#f59e0b',
        adjDelta: '→ 44%',
        volDelta: '→ flat',
        volDeltaColor: '#94a3b8',
        sigQuality: '★★ MODERATE',
        sigClass: 'sig-med'
      }
    ],
    ceasefire: [
      {
        contract: 'US-Iran ceasefire by Dec 31',
        prob: '100%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '100%',
        volume: '$225M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Ceasefire holds 2 weeks',
        prob: '85%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '85%',
        volume: '$12M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Ceasefire extended beyond Apr 22',
        prob: '62%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '62%',
        volume: '$8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Permanent ceasefire by Jun 30',
        prob: '58%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '58%',
        volume: '$6M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Conflict ends by Dec 31',
        prob: '94%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '94%',
        volume: '$30M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Hormuz fully reopens by Apr 30',
        prob: '55%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '55%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Trump ends operations by Jun 30',
        prob: '78%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '78%',
        volume: '$1.5M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Israel-Lebanon ceasefire Apr 30',
        prob: '28%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '28%',
        volume: '$3M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'US-Iran ceasefire by Apr 15',
        prob: '100%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '100%',
        volume: '$35M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Ceasefire holds until Apr 22',
        prob: '80%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '80%',
        volume: '$10M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Formal peace agreement by Jun 30',
        prob: '35%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '35%',
        volume: '$5M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Hormuz normalized by May 15',
        prob: '48%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '48%',
        volume: '$3M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Lebanon included in ceasefire by Apr 30',
        prob: '22%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '22%',
        volume: '$2M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Ceasefire collapses by Apr 22',
        prob: '15%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '15%',
        volume: '$7M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'New Iran-US hostilities by May 15',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      }
    ],
    oil: [
      {
        contract: 'Brent >$110 Apr 30',
        prob: '22%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '22%',
        volume: '$18M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Brent >$100 Apr 30',
        prob: '38%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '38%',
        volume: '$15M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Brent >$90 Apr 30',
        prob: '72%',
        probClass: 'prob-high',
        fillColor: '#22c55e',
        fillWidth: '72%',
        volume: '$12M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Brent <$85 Apr 30',
        prob: '15%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '15%',
        volume: '$5M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Brent >$120 by Dec 31',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Brent >$100 by Apr 30',
        prob: '35%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '35%',
        volume: '$10M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Brent >$90 by Apr 30',
        prob: '68%',
        probClass: 'prob-mid',
        fillColor: '#22c55e',
        fillWidth: '68%',
        volume: '$7M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'WTI >$100 Apr 30',
        prob: '32%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '32%',
        volume: '$6M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      }
    ],
    hormuz: [
      {
        contract: 'Hormuz fully blockaded (>48h)',
        prob: '8%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '8%',
        volume: '$22M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Hormuz transit <2/day for 1 week',
        prob: '12%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '12%',
        volume: '$8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Hormuz fully normalized by May 15',
        prob: '48%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '48%',
        volume: '$5M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran reopens Hormuz fully by Apr 30',
        prob: '38%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '38%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Hormuz tanker incident by Apr 30',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$6M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Hormuz normalized by May 15',
        prob: '45%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '45%',
        volume: '$3M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Iran closes Hormuz again (>24h)',
        prob: '22%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '22%',
        volume: '$9M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      }
    ],
    regime: [
      {
        contract: 'Iranian regime falls by Jun 30',
        prob: '11%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '11%',
        volume: '$2.8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Mojtaba Khamenei killed/captured',
        prob: '44%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '44%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran holds elections by Dec 2026',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$1.8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'IRGC military coup',
        prob: '6%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '6%',
        volume: '$1.2M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iranian regime collapse Dec 31',
        prob: '8%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '8%',
        volume: '$2M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Leadership change confirmed',
        prob: '44%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '44%',
        volume: '$3.5M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Supreme Leader confirmed alive',
        prob: '52%',
        probClass: 'prob-mid',
        fillColor: '#f59e0b',
        fillWidth: '52%',
        volume: '$3M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran accepts external mediation',
        prob: '65%',
        probClass: 'prob-mid',
        fillColor: '#22c55e',
        fillWidth: '65%',
        volume: '$2M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran constitutional change 2026',
        prob: '4%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '4%',
        volume: '$0.8M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      }
    ],
    escalation: [
      {
        contract: 'US strikes Iranian nuclear sites',
        prob: '12%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '12%',
        volume: '$15M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Kharg Island struck by US/Israel',
        prob: '21%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '21%',
        volume: '$5.5M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'US ground troops enter Iran',
        prob: '5%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '5%',
        volume: '$8M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Israel strikes Hezbollah in Lebanon (ceasefire period)',
        prob: '95%',
        probClass: 'prob-high',
        fillColor: '#ef4444',
        fillWidth: '95%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran retaliates for Lebanon strikes',
        prob: '35%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '35%',
        volume: '$6M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'US-Iran conflict re-escalates by May 15',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$5M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Israel-Iran direct exchange during ceasefire',
        prob: '28%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '28%',
        volume: '$3M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      }
    ],
    nuclear: [
      {
        contract: 'Iran achieves nuclear breakout 2026',
        prob: '8%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '8%',
        volume: '$6M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'IAEA confirms enrichment halted',
        prob: '28%',
        probClass: 'prob-low',
        fillColor: '#f59e0b',
        fillWidth: '28%',
        volume: '$3M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Nuclear deal framework by Jun 30',
        prob: '22%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '22%',
        volume: '$4M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Iran confirms enrichment continues',
        prob: '75%',
        probClass: 'prob-high',
        fillColor: '#ef4444',
        fillWidth: '75%',
        volume: '$2.5M',
        platform: 'Polymarket',
        platformClass: 'plat-poly'
      },
      {
        contract: 'Uranium removal as part of deal',
        prob: '18%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '18%',
        volume: '$2M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      },
      {
        contract: 'Nuclear issue resolved by Dec 2026',
        prob: '15%',
        probClass: 'prob-low',
        fillColor: '#ef4444',
        fillWidth: '15%',
        volume: '$3M',
        platform: 'Kalshi',
        platformClass: 'plat-kalshi'
      }
    ],
    comparison: [
      {
        contract: 'Ceasefire by Dec 31',
        poly: '100%',
        kalshi: '100%',
        spread: '0pp',
        spreadClass: 'spread-tight',
        signal: 'CONVERGED — RESOLVED'
      },
      {
        contract: 'Brent >$100 Apr 30',
        poly: '38%',
        kalshi: '35%',
        spread: '3pp',
        spreadClass: 'spread-tight',
        signal: 'Tight spread — moderate consensus'
      },
      {
        contract: 'Hormuz normalized by May 15',
        poly: '48%',
        kalshi: '45%',
        spread: '3pp',
        spreadClass: 'spread-tight',
        signal: 'Aligned — modest optimism'
      },
      {
        contract: 'Leadership change',
        poly: '44%',
        kalshi: '44%',
        spread: '0pp',
        spreadClass: 'spread-tight',
        signal: 'CONVERGED — coin flip'
      }
    ]
  },

  // ── TACO INPUT INDICATORS (TACO Score tab) ─────────────────────────────────
  tacoInputs: [
    {
      name: 'Reversibility',
      subDesc: 'Can Trump undo this with a tweet?',
      weight: '30%',
      signal: 'Day 42 (Apr 10): ISLAMABAD TALKS UNDERWAY. First face-to-face since war began. Araghchi heading to Pakistan. Ceasefire holding — attacks ZERO on Apr 8. Hormuz transits 2-4/day (down from 8/day D41 — Iran briefly closed again). BUT: Both sides claim incompatible victories. Iran\'s 10-point plan demands: non-aggression guarantees, enrichment acceptance, sanctions removal, war damages, US withdrawal, Lebanon ceasefire. US position: nuclear material removal, Iran military destroyed, regime \'out of options.\' These demands are fundamentally irreconcilable. Score holds at 22: talks happening = positive, but structural incompatibility = no upgrade.',
      score: 35,
      maxScore: 100,
      weighted: '10.5',
      scoreClass: 'taco-score-amber',
      isNew: true,
      hasRhetoricLink: false,
      rationale: 'IRGC dominance locks hardline stance, limiting quick unwind. Blockade and arsenal partial rebuild reduce off-ramp feasibility today.'
    },
    {
      name: 'Rhetoric Intensity',
      subDesc: 'Words before weapons',
      weight: '20%',
      signal: 'Day 42: Hegseth — \'New regime is out of options and out of time, so they cut a deal.\' Nuclear material removal framed as agreed. Iran: \'Enrichment won\'t be curtailed\' — direct contradiction. Iran Ambassador to Pakistan: \'critical, sensitive stage.\' UK FM Cooper: Lebanon should be covered. Vance agreed Lebanon NOT covered. Netanyahu intensifying Beirut strikes (112 killed, 300+ wounded). Rhetoric is mixed: ceasefire-supporting on US-Iran bilateral front, but Lebanon front = escalatory. Score 48 (down from 52): net neutral-to-negative as Lebanon rhetoric intensifies.',
      score: 75,
      maxScore: 100,
      weighted: '15.0',
      scoreClass: 'taco-score-green',
      isNew: true,
      hasRhetoricLink: true,
      rationale: 'Trump rejects Iran offer as \'not enough\'; Araghchi demands compensation and Hormuz regime shift. Escalatory tone from both amid stalled talks.'
    },
    {
      name: 'Diplomatic',
      subDesc: 'Backchannel to breakthrough',
      weight: '20%',
      signal: 'Day 42: HIGHEST DIPLOMATIC ACTIVITY OF THE WAR. Islamabad talks confirmed — Araghchi heading to Pakistan. Witkoff (not Rubio) leading US delegation — possible downgrade but still senior envoy. Pakistan hosting = neutral ground. Iran Ambassador: \'critical, sensitive stage.\' Framework on the table. But: 10-point plan vs US demands = collision course on enrichment, sanctions, Lebanon. UK pushing Lebanon inclusion (Cooper). Israel-Lebanon EXCLUDED from ceasefire per Vance. Score rises to 70: talks happening is the most important diplomatic signal of the entire conflict.',
      score: 60,
      maxScore: 100,
      weighted: '12.0',
      scoreClass: 'taco-score-amber',
      isNew: true,
      hasRhetoricLink: false,
      rationale: 'Araghchi in Islamabad pushes preconditions; Trump canceled envoy trip but notes \'better\' offer. No nuclear progress signals deadlock.'
    },
    {
      name: 'Historical Precedent',
      subDesc: 'Rhymes with the past',
      weight: '10%',
      signal: 'Day 42: First face-to-face talks. Korean War: ceasefire announced Day 38, first talks Day 43 at Kaesong — remarkably similar timeline. But Kaesong talks took 2 years to produce armistice. Camp David (1978): talks began after military pressure, took 13 days. Incompatible victory narratives are the worst starting condition for talks — both sides need face-saving off-ramps. Lebanon as spoiler: cf. 2006 UNSCR 1701 where Lebanon linkage was the final obstacle. Score holds at 22.',
      score: 2,
      maxScore: 100,
      weighted: '0.2',
      scoreClass: 'taco-score-red',
      isNew: true,
      hasRhetoricLink: false
    },
    {
      name: 'Market-Implied',
      subDesc: 'Money talks',
      weight: '10%',
      signal: 'Day 42: Markets rebounding on talks optimism. Brent $98.22 (+3.7%) — recovering from ceasefire crash but still $11 below pre-ceasefire $109. VIX 21.28 (+1.1% — slight uptick on fragility). S&P +2.5%. HL $96.70 (+7.3%), OI $313M (deleveraged from $559M ATH). HYG +0.6% (credit rally continues). Defense stocks surging: ITA +4%. Ceasefire PM 100% ($225M volume). Oil markets pricing Brent $90-100 range. Score 72 (down from 78): oil recovering rather than falling = markets less certain.',
      score: 40,
      maxScore: 100,
      weighted: '4.0',
      scoreClass: 'taco-score-amber',
      isNew: true,
      hasRhetoricLink: false,
      rationale: 'Options skew to upside disruption; futures backwardation embeds 30% strike odds. De-escalation priced low absent deal signals.'
    },
    {
      name: 'Domestic Political',
      subDesc: 'Ballot box pressure',
      weight: '10%',
      signal: 'Day 42: Trump narrative maintaining — Hegseth: \'regime out of options.\' Military victory declared. But Witkoff (not Rubio) = less investment in diplomatic success. Polymarket: 78% Trump ends ops (↓4pp from D41), 94% conflict ends. Netanyahu acting independently — escalating Lebanon during ceasefire — is the biggest political wildcard. Iran hardliners protesting against ceasefire. Domestic pressure: if oil stays at $98 rather than falling to $85-90, CPI relief narrative weakens. Score holds at 40.',
      score: 65,
      maxScore: 100,
      weighted: '6.5',
      scoreClass: 'taco-score-amber',
      isNew: true,
      hasRhetoricLink: false,
      rationale: 'US pressure mounts for Hormuz win pre-midterms; Iran factions split but IRGC overrides settlement push. Trump leverages rejection for hardline base.'
    }
  ],

  // ── TACO ANALYTICS KPIs ────────────────────────────────────────────────────
  tacoAnalytics: {
    momentum: {
      value: '+1.8',
      note: 'TACO rising on IRGC veto signals and Trump offer rejection.'
    },
    regime: {
      value: 'NEGOTIATION DEADLOCK',
      note: 'IRGC preconditions vs US nuclear redline; blockade as leverage point.'
    },
    lagSignal: {
      value: 'Brent +2d',
      note: 'Brent up 4% lags Hormuz contestation, confirming supply fear embed.'
    },
    nextTrigger: {
      value: 'TACO >=24',
      note: 'Watch Araghchi readout, tanker intercepts, Trump X post, Hezbollah action, UAE Iron Dome ops next 48h.'
    }
  },

  // ── CHART DATA (consolidates data.js + charts.js hardcoded data) ───────────
  chartData: {
    labels: ['Feb 28', 'Mar 1', 'Mar 2', 'Mar 3', 'Mar 4', 'Mar 5', 'Mar 6', 'Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Mar 16', 'Mar 17', 'Mar 18', 'Mar 19', 'Mar 20', 'Mar 21', 'Mar 22', 'Mar 23', 'Mar 24', 'Mar 25', 'Mar 26', 'Mar 27', 'Mar 28', 'Mar 29', 'Mar 30', 'Mar 31', 'Apr 1', 'Apr 2', 'Apr 3', 'Apr 4', 'Apr 5', 'Apr 6', 'Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20', 'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28', 'Apr 29'],
    brent: [73.2, 80.1, 86.4, 91.7, 94.3, 89.5, 88.0, 91.2, 94.0, 95.4, 90.3, 91.98, 95.8, 100.46, 103.14, 103.14, 106.11, 101.6, 108.52, 116.45, 106.93, 112.89, 112.89, 101.34, 103.5, 100.59, 105.61, 109.97, 109.97, 109.97, 107.9, 107.6, 101.22, 109.37, 109.03, 109.03, 109.03, 108.28, 110.47, 102.5, 95.02, 96.06, 96.06, 96.06, 101.53, 95.87, 95.34, 97.41, 89.03, 90.38, 95.42, 95.12, 94.3, 99.1, 102.92, 106, 106.23, 111.95, 111.95, 111.95, 105.43],
    vix: [22.1, 26.4, 28.9, 30.2, 31.8, 30.1, 29.4, 28.7, 27.6, 26.9, 25.8, 24.93, 25.72, 27.29, 27.19, 27.19, 26.13, 22.24, 23.23, 25.93, 24.82, 26.78, 26.78, 24.48, 26.77, 25.25, 27.15, 28.63, 28.63, 28.63, 30.51, 28.62, 24.23, 27.72, 23.87, 23.87, 23.87, 23.88, 25.71, 21.5, 21.23, 19.31, 19.31, 19.31, 19.23, 18, 18.36, 18.94, 17.61, 17.48, 17.48, 19.53, 18.86, 19.12, 19.64, 19.16, 18.94, 18.92, 18.92, 18.92, 17.84],
    hyg: [80.0, 79.1, 78.3, 77.8, 77.4, 77.8, 78.1, 78.5, 79.0, 79.3, 79.6, 80.1, 79.9, 79.36, 79.2, 79.2, 79.2, 79.75, 79.68, 79.4, 79.66, 78.92, 78.92, 79.53, 79.19, 79.52, 79.42, 78.9, 78.9, 78.9, 78.72, 78.82, 79.56, 79.37, 79.56, 79.56, 79.56, 79.63, 79.55, 79.9, 80.14, 80.28, 80.28, 80.28, 79.96, 80.43, 80.5, 80.34, 80.65, 80.65, 80.65, 80.65, 80.58, 80.37, 80.5, 80.37, 80.48, 80.51, 80.51, 80.51, 80.4],
    sp500: [6050, 5940, 5870, 5820, 5790, 5810, 5840, 5870, 5910, 6100, 6250, 6310, 6781, 6672, 6632, 6632, 6632, 6734.51, 6682.77, 6624.7, 6606.49, 6506.48, 6506.48, 6631.26, 6546.85, 6605.87, 6591.9, 6477.26, 6477.26, 6477.26, 6368.85, 6343.72, 6528.52, 6575.32, 6582.69, 6582.69, 6582.69, 6608.75, 6578.67, 6720.0, 6779.38, 6824.66, 6824.66, 6824.66, 6816.89, 6934.41, 6966.78, 7016.5, 7111.38, 7126.05, 7126.05, 7126.06, 7109.14, 7064.01, 7137.9, 7108.4, 7165.08, 7173.91, 7173.91, 7173.91, 7138.8],
    taco: [45, 40, 35, 30, 26, 22, 18, 15, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 2, 6, 7, 8, 7, 7, 7, 7, 7, 8, 12, 9, 10, 8, 7, 9, 6, 15, 18, 18, 15, 12, 12, 12, 14, 19, 21, 21, 15, 15, 13, 15, 30, 15, 26, 15, 15, 13, 18],
    strikeLabels: ['28 Feb', '1 Mar', '2 Mar', '3 Mar', '4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar', '11 Mar', '12 Mar', '13 Mar', '14 Mar', '15 Mar', '16 Mar', '17 Mar', '18 Mar', '19 Mar', '20 Mar', '21 Mar', '22 Mar', '23 Mar', '24 Mar', '25 Mar', '28 Mar', '29 Mar', '30 Mar', '31 Mar', '1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '6 Apr', '7 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '13 Apr', '14 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '20 Apr', '21 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '27 Apr', '28 Apr', '29 Apr'],
    strikes: {
      us: [500, 600, 550, 450, 400, 420, 380, 500, 480, 450, 430, 420, 490, 520, 600, 580, 620, 290, 480, 510, 500, 520, 530, 540, 550, 550, 580, 600, 580, 560, 500, 520, 480, 500, 510, 550, 600, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      iran: [200, 150, 100, 60, 40, 30, 25, 35, 30, 25, 20, 18, 35, 40, 38, 42, 45, 30, 35, 40, 50, 55, 65, 60, 55, 70, 75, 70, 65, 60, 50, 55, 50, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    hormuzLabels: ['26 Feb', '27 Feb', '28 Feb', '1 Mar', '2 Mar', '3 Mar', '4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar', '11 Mar', '12 Mar', '13 Mar', '14 Mar', '15 Mar', '16 Mar', '17 Mar', '18 Mar', '19 Mar', '20 Mar', '21 Mar', '22 Mar', '23 Mar', '24 Mar', '25 Mar', '26 Mar', '27 Mar', '28 Mar', '29 Mar', '30 Mar', '31 Mar', '1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '6 Apr', '7 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '13 Apr', '14 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '20 Apr', '21 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '27 Apr', '28 Apr', '29 Apr'],
    hormuzTransits: [24, 24, 37, 4, 6, 5, 3, 4, 5, 5, 5, 5, 5, 2, 0, 1, 1, 1, 0, 4, 5, 4, 3, 2, 2, 2, 0, 6, 6, 8, 3, 4, 4, 5, 6, 5, 1, 4, 4, 3, 2, 5, 8, 4, 5, 5, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    etfs: {
      ITA: {
        prices: [215, 218, 222, 226, 229, 227, 230, 233, 235, 237, 234, 236, 239, 241, 243, 243, 243, 229, 231, 230, 227, 223, 226, 221, 226, 226, 228, 216, 211, 219, 224, 222, 222, 222, 223, 223, 235, 232, 232, 232, 230, 233]
      },
      XLE: {
        prices: [82, 84, 87, 90, 93, 91, 89, 91, 94, 96, 93, 94, 96, 97, 98, 98, 98, 96, 100, 100, 100, 59, 60, 61, 61, 61, 62, 63, 62, 61, 59, 59, 59, 59, 59, 60, 58, 57, 58, 57, 57, 59]
      },
      XOP: {
        prices: [130, 134, 138, 143, 148, 145, 142, 144, 149, 153, 150, 151, 154, 156, 158, 158, 158, 155, 162, 165, 175, 177, 176, 180, 182, 182, 185, 188, 185, 182, 175, 178, 178, 178, 177, 182, 174, 169, 172, 168, 168, 171]
      },
      GLD: {
        prices: [490, 493, 496, 500, 503, 505, 504, 506, 508, 510, 509, 511, 512, 514, 515, 515, 500, 501, 487, 472, 426, 413, 411, 404, 416, 416, 420, 415, 415, 430, 438, 429, 429, 429, 431, 427, 432, 435, 435, 438, 437, 440]
      },
      TLT: {
        prices: [87, 88, 89, 90, 91, 91, 90, 90, 91, 91, 90, 90, 91, 91, 91, 91, 91, 92, 91, 90, 87, 86, 86, 86, 87, 87, 86, 86, 87, 87, 86, 87, 87, 87, 87, 86, 87, 87, 87, 87, 86, 87]
      }
    }
  ,
    pmCeasefireLabels: ['Ceasefire Mar 31', 'Ceasefire Jun 30', 'Conflict ends Mar 31', 'Conflict ends Dec 31', 'Trump ends ops Apr 30', 'Trump ends ops Jun 30', 'Diplomatic mtg Apr 30'],
    pmCeasefireData: [2, 61, 2, 82, 40, 73, 48],
    pmOilLabels: ['Oil >$120 Apr', 'WTI $105 Apr 30', 'Hormuz 0-10 ships Mar', 'Oil >$150 Jun', 'Kharg no Iran Apr 30', 'WTI $120+ EOY', 'SPR <375M May', 'Gas $4 EOM'],
    pmOilPoly: [
      62,
      58,
      90,
      28,
      39,
      null,
      78,
      null
    ],
    pmOilKalshi: [
      null,
      null,
      null,
      null,
      null,
      58,
      null,
      null
    ],
    pmCompareLabels: ['Hormuz Closure', 'Nuclear Deal <2027', 'Pahlavi Leads Iran', 'WTI $120+'],
    pmComparePoly: [97, 38, 13, 62],
    pmCompareKalshi: [97, 40, 14, 58],
    pmBubbleContracts: [
      {
        x: 97,
        vol: 29.0,
        label: 'Hormuz closure',
        src: 'Poly',
        color: '#ef4444',
        labelSide: 'left'
      },
      {
        x: 76,
        vol: 28.0,
        label: 'Ceasefire Dec 31',
        src: 'Poly',
        color: '#a78bfa',
        labelSide: 'left'
      },
      {
        x: 62,
        vol: 45.0,
        label: 'Oil >$120 Apr',
        src: 'Poly',
        color: '#ef4444',
        labelSide: 'right'
      },
      {
        x: 66,
        vol: 24.0,
        label: 'US ground war',
        src: 'Poly',
        color: '#f97316',
        labelSide: 'left'
      },
      {
        x: 82,
        vol: 20.0,
        label: 'Conflict ends Dec',
        src: 'Poly',
        color: '#22c55e',
        labelSide: 'right'
      },
      {
        x: 55,
        vol: 8.0,
        label: 'Hormuz >48h',
        src: 'Poly',
        color: '#fb923c',
        labelSide: 'right'
      },
      {
        x: 45,
        vol: 12.0,
        label: 'Regime falls <2027',
        src: 'Poly',
        color: '#4ade80',
        labelSide: 'right'
      },
      {
        x: 35,
        vol: 6.0,
        label: 'Iran nuclear weapon',
        src: 'Poly',
        color: '#38bdf8',
        labelSide: 'right'
      },
      {
        x: 58,
        vol: 0.75,
        label: 'WTI $120 EOY',
        src: 'Kalshi',
        color: '#fbbf24',
        labelSide: 'right'
      },
      {
        x: 90,
        vol: 0.65,
        label: 'Hormuz 0-10 ships',
        src: 'Poly',
        color: '#fb923c',
        labelSide: 'left'
      },
      {
        x: 39,
        vol: 2.5,
        label: 'Kharg no Iran Apr',
        src: 'Poly',
        color: '#f87171',
        labelSide: 'left'
      }
    ]},

  // ── DUBAI WATCH — Used Car Panic Index ─────────────────────────────────────
  dubaiWatch: {
    snapshots: [
      {
        date: '2026-02-27',
        day: 0,
        dubizzle: 26642,
        dubicars: 27073,
        yallamotor: 37583,
        source: 'baseline'
      },
      {
        date: '2026-02-28',
        day: 1,
        dubizzle: 26700,
        dubicars: 27100,
        yallamotor: 37600,
        source: 'live'
      },
      {
        date: '2026-03-01',
        day: 2,
        dubizzle: 26750,
        dubicars: 27150,
        yallamotor: 37650,
        source: 'live'
      },
      {
        date: '2026-03-02',
        day: 3,
        dubizzle: 26800,
        dubicars: 27200,
        yallamotor: 37700,
        source: 'live'
      },
      {
        date: '2026-03-03',
        day: 4,
        dubizzle: 26850,
        dubicars: 27250,
        yallamotor: 37750,
        source: 'live'
      },
      {
        date: '2026-03-04',
        day: 5,
        dubizzle: 26900,
        dubicars: 27300,
        yallamotor: 37800,
        source: 'live'
      },
      {
        date: '2026-03-06',
        day: 7,
        dubizzle: 26950,
        dubicars: 27350,
        yallamotor: 37850,
        source: 'live'
      },
      {
        date: '2026-03-08',
        day: 9,
        dubizzle: 27100,
        dubicars: 27400,
        yallamotor: 37900,
        source: 'live'
      },
      {
        date: '2026-03-10',
        day: 11,
        dubizzle: 27200,
        dubicars: 27450,
        yallamotor: 37950,
        source: 'live'
      },
      {
        date: '2026-03-12',
        day: 13,
        dubizzle: 27150,
        dubicars: 27500,
        yallamotor: 38000,
        source: 'live'
      },
      {
        date: '2026-03-14',
        day: 15,
        dubizzle: 27050,
        dubicars: 27350,
        yallamotor: 38050,
        source: 'live'
      },
      {
        date: '2026-03-16',
        day: 17,
        dubizzle: 26950,
        dubicars: 27200,
        yallamotor: 38100,
        source: 'live'
      },
      {
        date: '2026-03-17',
        day: 18,
        dubizzle: 26900,
        dubicars: 27150,
        yallamotor: 38120,
        source: 'live'
      },
      {
        date: '2026-03-18',
        day: 19,
        dubizzle: 26850,
        dubicars: 27100,
        yallamotor: 38150,
        source: 'live'
      },
      {
        date: '2026-03-19',
        day: 20,
        dubizzle: 26800,
        dubicars: 27050,
        yallamotor: 38180,
        source: 'live'
      },
      {
        date: '2026-03-20',
        day: 21,
        dubizzle: 26750,
        dubicars: 27000,
        yallamotor: 38200,
        source: 'live'
      },
      {
        date: '2026-03-21',
        day: 22,
        dubizzle: 26700,
        dubicars: 26950,
        yallamotor: 38220,
        source: 'live'
      },
      {
        date: '2026-03-24',
        day: 25,
        dubizzle: 26600,
        dubicars: 26800,
        yallamotor: 38250,
        source: 'live'
      },
      {
        date: '2026-03-25',
        day: 26,
        dubizzle: 26550,
        dubicars: 26750,
        yallamotor: 38270,
        source: 'live'
      },
      {
        date: '2026-03-27',
        day: 28,
        dubizzle: 26500,
        dubicars: 26700,
        yallamotor: 38280,
        source: 'live'
      },
      {
        date: '2026-03-30',
        day: 31,
        dubizzle: 26450,
        dubicars: 26650,
        yallamotor: 38290,
        source: 'live'
      },
      {
        date: '2026-04-01',
        day: 33,
        dubizzle: 26400,
        dubicars: 26600,
        yallamotor: 38280,
        source: 'live'
      },
      {
        date: '2026-04-03',
        day: 35,
        dubizzle: 26380,
        dubicars: 26580,
        yallamotor: 38260,
        source: 'live'
      },
      {
        date: '2026-04-04',
        day: 36,
        dubizzle: 26364,
        dubicars: 26542,
        yallamotor: 38240,
        source: 'live'
      },
      {
        date: '2026-04-05',
        day: 37,
        dubizzle: 26350,
        dubicars: 26520,
        yallamotor: 38250,
        source: 'live'
      },
      {
        date: '2026-04-06',
        day: 38,
        dubizzle: 26340,
        dubicars: 26500,
        yallamotor: 38260,
        source: 'live'
      },
      {
        date: '2026-04-07',
        day: 39,
        dubizzle: 26330,
        dubicars: 26480,
        yallamotor: 38280,
        source: 'live'
      },
      {
        date: '2026-04-08',
        day: 40,
        dubizzle: 26313,
        dubicars: 26847,
        yallamotor: 38327,
        source: 'live'
      },
      {
        date: '2026-04-09',
        day: 41,
        dubizzle: 26313,
        dubicars: 26847,
        yallamotor: 38327,
        source: 'live'
      },
      {
        date: '2026-04-10',
        day: 42,
        dubizzle: 26496,
        dubicars: 26312,
        yallamotor: 38327,
        source: 'live'
      },
      {
        date: '2026-04-13',
        day: 45,
        dubizzle: 27349,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-14',
        day: 46,
        dubizzle: 27185,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-15',
        day: 47,
        dubizzle: 27533,
        dubicars: 4526,
        yallamotor: 272,
        source: 'live'
      },
      {
        date: '2026-04-16',
        day: 48,
        dubizzle: 26917,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-17',
        day: 49,
        dubizzle: 27184,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-20',
        day: 52,
        dubizzle: 27988,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-21',
        day: 53,
        dubizzle: 28304,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-22',
        day: 54,
        dubizzle: 28049,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-23',
        day: 55,
        dubizzle: 28013,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-24',
        day: 56,
        dubizzle: 28131,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-26',
        day: 58,
        dubizzle: 28246,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-27',
        day: 59,
        dubizzle: 28241,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-28',
        day: 60,
        dubizzle: 28376,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      },
      {
        date: '2026-04-29',
        day: 61,
        dubizzle: 27789,
        dubicars: null,
        yallamotor: null,
        source: 'live'
      }
    ],
    baselines: {
      dubizzle: 26642,
      dubicars: 27073,
      yallamotor: 37583
    },
    latest: {
      dubizzle: {
        total: 27789,
        changePct: 0.0
      },
      dubicars: {
        total: 4526,
        changePct: 0
      },
      yallamotor: {
        total: 272,
        changePct: 0
      },
      date: '2026-04-29',
      day: 61
    },
    luxury: {
      date: '2026-04-10',
      day: 42,
      dubizzle: 1850,
      dubicars: 1420
    },
    dataNote: 'Day 42 (Apr 10, Friday — Islamabad Talks Day): Dubizzle 26,506 (▲ +193 from D41 — first significant rise since ceasefire, possible inventory refresh or \'wait-and-see\' sellers returning), DubiCars 26,312 (▼ -535 — sharp drop, possible delisting of ceasefire-panic listings), YallaMotor 38,327 (stable). DIVERGENCE: Dubizzle UP, DubiCars DOWN. Mixed signal — ceasefire creating market uncertainty, not clear recovery. Pre-war baselines: Dubizzle 26,642 (-0.5%), DubiCars 27,073 (-2.8%), YallaMotor 37,583 (+2.0%).'
  },

  // ── PIPELINE BYPASS STATUS ──────────────────────────────────────────────────
  pipelineBypass: {
    saudiEastWest: {
      name: 'Saudi East-West Pipeline (Petroline)',
      route: 'Abqaiq → Yanbu (Red Sea)',
      length: '1,200 km',
      capacity: '7M bpd',
      currentFlow: '~6.8M bpd (ramping on Hormuz blockade)',
      preWarFlow: '2.8M bpd',
      status: 'SURGE · HORMUZ BLOCKED',
      note: 'D42: Hormuz transits 2-4/day (DOWN from 8/day D41 after Iran briefly closed again). Pipeline bypass demand still elevated. The brief Hormuz closure demonstrates fragility — pipeline remains critical backup. Flow easing from ~6.5M peak but still well above pre-war 2.8M.'
    },
    habshanFujairah: {
      name: 'Abu Dhabi Crude Oil Pipeline (ADCOP)',
      route: 'Habshan → Fujairah (bypasses Hormuz)',
      length: '370 km',
      capacity: '1.5M bpd',
      currentFlow: '~1.7M bpd (maxed out)',
      preWarFlow: '0.9M bpd',
      status: 'FULL LOAD',
      note: 'D42: UAE continues to route significant volumes through Fujairah bypass. Hormuz uncertainty (Iran closed it briefly Apr 8-9) keeps ADCOP flow elevated above pre-war. Will normalize only when Hormuz fully stabilizes.'
    },
    combined: {
      note: 'Bypasses at ~8.5M bpd offset half of Hormuz shortfall. Capacity strained if blockade persists beyond week.'
    }
  },

  // ── HOUTHI / RED SEA THREAT ─────────────────────────────────────────────────
  houthiRedSea: {
    status: 'Houthi posture aggressive amid Lebanon ceasefire strain.',
    lastVerifiedAttack: 'April 28, 2026: Israeli strikes on Hezbollah in Beqaa Valley prompt Houthi rhetoric escalation.',
    threatLevel: 'MODERATE',
    babElMandeb: {
      normalFlow: '~6M bpd oil + LNG',
      currentFlow: 'REDUCED — ceasefire easing but Houthi not party to deal',
      note: 'Flows stable but insured premiums up 20% on proxy threats. Ceasefire non-binding for Houthis, linked to Lebanon war. Near-term risk rises if US-Iran talks fail, prompting Red Sea reprisals.'
    },
    houthiPosture: 'D42: CEASEFIRE DAY 2 — No new Houthi attacks. However, ceasefire is US-Iran bilateral; Lebanon and proxies explicitly excluded by Netanyahu/Vance. Houthi leader praised ceasefire but reserved right to \'defend the ummah.\' Iran may restrain proxies during Islamabad talks as good-faith gesture, but this is voluntary and reversible.',
    dualChokepoint: 'D42: Hormuz 2-4/day (DOWN from 8/day D41 — Iran closed briefly Apr 8-9 over Lebanon strikes). Bab el-Mandeb quiet. DUAL CHOKEPOINT RISK REDUCED but not eliminated. Lebanon is the trigger for both: if Netanyahu continues Beirut strikes, Iran can close Hormuz again and Houthis can resume Red Sea attacks.',
    sources: ['Republic World', 'Crypto Briefing', 'FDD Analysis', 'BCA Research']
  },

  // ── IRAN DAILY ATTACKS ON UAE ───────────────────────────────────────────────
  iranAttacksUAE: {
    cumulative: {
      asOf: '2026-04-29',
      day: 61,
      ballisticMissiles: {
        detected: 524,
        intercepted: 501,
        seaFall: 19,
        impact: 4
      },
      cruiseMissiles: {
        detected: 55,
        intercepted: 53
      },
      drones: {
        detected: 2468,
        intercepted: 2293,
        impact: 175
      },
      casualties: {
        killed: 14,
        injured: 252
      },
      interceptRate: '93.4%',
      note: 'All attack figures frozen since ceasefire. Day 61.'
    },
    daily: [
      {
        date: '2026-02-28',
        day: 1,
        ballistic: 35,
        cruise: 0,
        drones: 120,
        note: 'Opening salvo'
      },
      {
        date: '2026-03-01',
        day: 2,
        ballistic: 28,
        cruise: 5,
        drones: 95,
        note: 'Sustained barrage'
      },
      {
        date: '2026-03-02',
        day: 3,
        ballistic: 22,
        cruise: 3,
        drones: 88,
        note: 'High tempo'
      },
      {
        date: '2026-03-03',
        day: 4,
        ballistic: 20,
        cruise: 3,
        drones: 75,
        note: 'Declining slightly'
      },
      {
        date: '2026-03-04',
        day: 5,
        ballistic: 18,
        cruise: 2,
        drones: 70,
        note: 'TEL attrition'
      },
      {
        date: '2026-03-05',
        day: 6,
        ballistic: 15,
        cruise: 2,
        drones: 65,
        note: 'TEL hunt intensifying'
      },
      {
        date: '2026-03-06',
        day: 7,
        ballistic: 14,
        cruise: 2,
        drones: 60,
        note: 'Week 1 declining'
      },
      {
        date: '2026-03-07',
        day: 8,
        ballistic: 12,
        cruise: 2,
        drones: 55,
        note: 'Launcher shortage emerging'
      },
      {
        date: '2026-03-08',
        day: 9,
        ballistic: 10,
        cruise: 1,
        drones: 50,
        note: 'Drones now primary'
      },
      {
        date: '2026-03-09',
        day: 10,
        ballistic: 8,
        cruise: 1,
        drones: 48,
        note: 'Ballistic declining'
      },
      {
        date: '2026-03-10',
        day: 11,
        ballistic: 8,
        cruise: 1,
        drones: 45,
        note: 'TELs ~50% destroyed'
      },
      {
        date: '2026-03-11',
        day: 12,
        ballistic: 6,
        cruise: 1,
        drones: 42,
        note: 'Shift to drones'
      },
      {
        date: '2026-03-12',
        day: 13,
        ballistic: 6,
        cruise: 1,
        drones: 40,
        note: 'Sustained drone wave'
      },
      {
        date: '2026-03-13',
        day: 14,
        ballistic: 5,
        cruise: 1,
        drones: 38,
        note: 'Low ballistic'
      },
      {
        date: '2026-03-14',
        day: 15,
        ballistic: 5,
        cruise: 0,
        drones: 35,
        note: 'Cruise missiles exhausted'
      },
      {
        date: '2026-03-16',
        day: 17,
        ballistic: 4,
        cruise: 0,
        drones: 30,
        note: 'Weekend lull'
      },
      {
        date: '2026-03-18',
        day: 19,
        ballistic: 3,
        cruise: 0,
        drones: 28,
        note: 'TELs ~75% destroyed'
      },
      {
        date: '2026-03-20',
        day: 21,
        ballistic: 2,
        cruise: 0,
        drones: 25,
        note: 'Drones dominant'
      },
      {
        date: '2026-03-22',
        day: 23,
        ballistic: 2,
        cruise: 0,
        drones: 22,
        note: 'Low tempo'
      },
      {
        date: '2026-03-25',
        day: 26,
        ballistic: 1,
        cruise: 0,
        drones: 20,
        note: 'TELs ~83% destroyed'
      },
      {
        date: '2026-03-28',
        day: 29,
        ballistic: 1,
        cruise: 0,
        drones: 18,
        note: 'Attrition'
      },
      {
        date: '2026-03-30',
        day: 31,
        ballistic: 1,
        cruise: 0,
        drones: 15,
        note: 'Minimal'
      },
      {
        date: '2026-04-01',
        day: 33,
        ballistic: 0,
        cruise: 0,
        drones: 12,
        note: 'Ballistic exhausted'
      },
      {
        date: '2026-04-03',
        day: 35,
        ballistic: 0,
        cruise: 0,
        drones: 20,
        note: 'Drone surge pre-deadline'
      },
      {
        date: '2026-04-04',
        day: 36,
        ballistic: 0,
        cruise: 0,
        drones: 15,
        note: 'Last pre-ceasefire attacks'
      },
      {
        date: '2026-04-05',
        day: 37,
        ballistic: 0,
        cruise: 0,
        drones: 10,
        note: 'Winding down'
      },
      {
        date: '2026-04-06',
        day: 38,
        ballistic: 0,
        cruise: 0,
        drones: 8,
        note: 'Pre-ceasefire wind-down'
      },
      {
        date: '2026-04-07',
        day: 39,
        ballistic: 0,
        cruise: 0,
        drones: 5,
        note: 'Last attacks before ceasefire'
      },
      {
        date: '2026-04-08',
        day: 40,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'CEASEFIRE — Zero attacks'
      },
      {
        date: '2026-04-09',
        day: 41,
        ballistic: 0,
        cruise: 0,
        drones: 5,
        note: 'Near-zero. 5 drones detected (possibly pre-ceasefire launches).'
      },
      {
        date: '2026-04-10',
        day: 42,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'CEASEFIRE DAY 2 — Zero attacks. Compliance holding on GCC front.'
      },
      {
        date: '2026-04-11',
        day: 43,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 3 — zero attacks.'
      },
      {
        date: '2026-04-12',
        day: 44,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 4 — zero attacks.'
      },
      {
        date: '2026-04-13',
        day: 45,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 5 — zero attacks.'
      },
      {
        date: '2026-04-14',
        day: 46,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 6 — zero attacks.'
      },
      {
        date: '2026-04-15',
        day: 47,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 7 — zero attacks.'
      },
      {
        date: '2026-04-16',
        day: 48,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 8 — zero attacks.'
      },
      {
        date: '2026-04-17',
        day: 49,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 9 — zero attacks.'
      },
      {
        date: '2026-04-18',
        day: 50,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 10 — zero attacks.'
      },
      {
        date: '2026-04-19',
        day: 51,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 11 — zero attacks.'
      },
      {
        date: '2026-04-20',
        day: 52,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 12 — zero attacks.'
      },
      {
        date: '2026-04-21',
        day: 53,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 13 — zero attacks.'
      },
      {
        date: '2026-04-22',
        day: 54,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 14 — zero attacks.'
      },
      {
        date: '2026-04-23',
        day: 55,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 15 — zero attacks.'
      },
      {
        date: '2026-04-24',
        day: 56,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 16 — zero attacks.'
      },
      {
        date: '2026-04-25',
        day: 57,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 17 — zero attacks.'
      },
      {
        date: '2026-04-26',
        day: 58,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 18 — zero attacks.'
      },
      {
        date: '2026-04-27',
        day: 59,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 19 — zero attacks.'
      },
      {
        date: '2026-04-28',
        day: 60,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 20 — zero attacks.'
      },
      {
        date: '2026-04-29',
        day: 61,
        ballistic: 0,
        cruise: 0,
        drones: 0,
        note: 'Ceasefire Day 21 — zero attacks.'
      }
    ]
  },

  // ── IRAN DAILY ATTACKS ON ALL NEIGHBORS ─────────────────────────────────────
  iranAttacksNeighbors: {
    asOf: '2026-04-29',
    day: 61,
    totalProjectiles: 4850,
    countriesHit: 6,
    countries: {
      uae: {
        ballistic: 524,
        cruise: 55,
        drones: 2468,
        totalMissiles: 579,
        totalDrones: 2468,
        total: 3047,
        killed: 14,
        injured: 252,
        keyTargets: 'Al Dhafra, Dubai ports, ADNOC facilities',
        interceptRate: '93.4%'
      },
      bahrain: {
        ballistic: 85,
        cruise: 12,
        drones: 320,
        totalMissiles: 97,
        totalDrones: 320,
        total: 417,
        killed: 3,
        injured: 45,
        keyTargets: 'US 5th Fleet HQ, Isa Air Base',
        interceptRate: '91%'
      },
      saudiArabia: {
        ballistic: 120,
        cruise: 18,
        drones: 410,
        totalMissiles: 138,
        totalDrones: 410,
        total: 548,
        killed: 5,
        injured: 68,
        keyTargets: 'Dhahran, Ras Tanura, SANG bases',
        interceptRate: '92%'
      },
      qatar: {
        ballistic: 45,
        cruise: 5,
        drones: 180,
        totalMissiles: 50,
        totalDrones: 180,
        total: 230,
        killed: 1,
        injured: 22,
        keyTargets: 'Al Udeid Air Base',
        interceptRate: '94%'
      },
      kuwait: {
        ballistic: 55,
        cruise: 8,
        drones: 250,
        totalMissiles: 63,
        totalDrones: 250,
        total: 313,
        killed: 2,
        injured: 35,
        keyTargets: 'Camp Arifjan, Ali Al Salem',
        interceptRate: '93%'
      },
      oman: {
        ballistic: 20,
        cruise: 3,
        drones: 100,
        totalMissiles: 23,
        totalDrones: 100,
        total: 123,
        killed: 0,
        injured: 8,
        keyTargets: 'Thumrait, Masirah (limited strikes)',
        interceptRate: '95%'
      }
    }
  },

  // ── OVERVIEW PREDICTION MARKET CONSENSUS (compact cards in overview) ───────
  overviewPredMktCards: [
    {
      title: 'Ceasefire',
      detail: 'Polymarket · $225M',
      prob: '100%',
      delta: '→ 100% D42 · RESOLVED. $225M vol (+$44M).',
      deltaColor: '#22c55e'
    },
    {
      title: 'Conflict ends Dec 31',
      detail: 'Polymarket · $30M',
      prob: '94%',
      delta: '→ 94% D42 · Steady · Talks underway',
      deltaColor: '#22c55e'
    },
    {
      title: 'Trump ends ops Jun 30',
      detail: 'Polymarket · $1.5M',
      prob: '78%',
      delta: '▼ -4pp from 82% · Witkoff not Rubio',
      deltaColor: '#f59e0b'
    },
    {
      title: 'Kharg Island',
      detail: 'Polymarket · $5.5M',
      prob: '21%',
      delta: '▲ +3pp · Lebanon risk → residual escalation',
      deltaColor: '#f59e0b'
    }
  ],

  // ── TACO CONFIG (legacy — used by gauge, animation, analytics) ─────────────
  tacoConfig: {
    compositeScore: 18,
    phase: 'ceasefire',
    phaseCeiling: 50,
    indicators: {
      reversibility: {
        weight: 30,
        score: 22
      },
      rhetoricIntensity: {
        weight: 20,
        score: 48
      },
      diplomatic: {
        weight: 20,
        score: 70
      },
      historical: {
        weight: 10,
        score: 22
      },
      marketImplied: {
        weight: 10,
        score: 72
      },
      domesticPolitical: {
        weight: 10,
        score: 40
      }
    },
    rhetoric: {
      totalStatements: 118,
      breakdown: {
        maxEscalation: 80,
        escalation: 38,
        mixed: 34,
        deescalation: 40
      },
      deescalationSignals: 40,
      deescalationReversed: 10,
      rhetoricToActionLagHrs: 6,
      keyPhrases: [
        {
          date: '2026-02-28',
          phrase: 'The future is yours to take',
          score: 40,
          platform: 'Truth Social'
        },
        {
          date: '2026-03-01',
          phrase: 'Four weeks, or less',
          score: 30,
          platform: 'Daily Wire'
        },
        {
          date: '2026-03-05',
          phrase: 'Obliteration like nobody\'s seen',
          score: 95,
          platform: 'Truth Social'
        },
        {
          date: '2026-03-14',
          phrase: 'They\'re getting HAMMERED',
          score: 75,
          platform: 'Truth Social'
        },
        {
          date: '2026-03-22',
          phrase: 'Running low on everything',
          score: 65,
          platform: 'Pentagon briefing'
        },
        {
          date: '2026-04-04',
          phrase: 'Core objectives nearing completion',
          score: 25,
          platform: 'White House'
        },
        {
          date: '2026-04-08',
          phrase: 'Regime is out of options and out of time',
          score: 30,
          platform: 'Pentagon — Hegseth'
        },
        {
          date: '2026-04-09',
          phrase: '10-point plan is fraudulent',
          score: 45,
          platform: 'Truth Social'
        },
        {
          date: '2026-04-10',
          phrase: 'Enrichment won\'t be curtailed',
          score: 55,
          platform: 'Iran FM — Araghchi'
        }
      ]
    }
  },

  // ── PROSE SECTIONS — Rendered by render-prose.js ──────────────────────────

  // ── 1. GIST BANNER ──────────────────────────────────────────────────────────
  gistBanner: {
    bullets: [
      {
        text: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss Strait of Hormuz security with Sultan Haitham al Tariq.',
        color: 'yellow'
      },
      {
        text: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following Netanyahu\'s order after call with UAE President Mohammed bin Zayed.',
        color: 'yellow'
      },
      {
        text: 'April 25: US forces intercepted US-sanctioned Panamanian-flagged gas tanker Sevan in Arabian Sea for transporting Iranian oil.',
        color: 'yellow'
      },
      {
        text: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.',
        color: 'yellow'
      },
      {
        text: 'Iran\'s Foreign Minister states no direct talks.',
        color: 'yellow'
      }
    ],
    pills: [
      {
        label: 'Brent $107.75',
        color: 'amber'
      },
      {
        label: 'TACO 18',
        color: 'amber'
      },
      {
        label: 'VIX 18.05',
        color: 'amber'
      },
      {
        label: 'Talks ACTIVE',
        color: 'amber'
      },
      {
        label: 'Hormuz CONTESTED',
        color: 'amber'
      },
      {
        label: 'CPI 3.3%',
        color: 'amber'
      },
      {
        label: 'Lebanon ⚠',
        color: 'red'
      }
    ]
  },

  // ── 2. NEWS-NOW CARDS ────────────────────────────────────────────────────────
  newsNow: [
    {
      label: 'HORMUZ',
      title: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss St',
      body: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss Strait of Hormuz security with Sultan Haitham al Tariq.',
      color: 'yellow'
    },
    {
      label: 'CONFLICT',
      title: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following Netanyahu\'s',
      body: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following Netanyahu\'s order after call with UAE President Mohammed bin Zayed.',
      color: 'yellow'
    },
    {
      label: 'CONFLICT',
      title: 'April 25: US forces intercepted US-sanctioned Panamanian-flagged gas tanker Sevan in Arabi',
      body: 'April 25: US forces intercepted US-sanctioned Panamanian-flagged gas tanker Sevan in Arabian Sea for transporting Iranian oil.',
      color: 'yellow'
    },
    {
      label: 'MILITARY',
      title: 'April 28: Israeli airstrikes hit Hezbollah targets in Lebanon\'s Beqaa Valley',
      body: 'April 28: Israeli airstrikes hit Hezbollah targets in Lebanon\'s Beqaa Valley.',
      color: 'yellow'
    },
    {
      label: 'TALKS',
      title: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP ',
      body: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.',
      color: 'yellow'
    },
    {
      label: 'TALKS',
      title: 'Iran\'s Foreign Minister states no direct talks',
      body: 'Iran\'s Foreign Minister states no direct talks.',
      color: 'yellow'
    }
  ],

  // ── 3. ANALYTICAL SIGNALS ────────────────────────────────────────────────────
  analyticalSignals: [
    {
      label: 'Diplomatic Engagement',
      value: 'ACTIVE',
      score: 6,
      scoreColor: '#f59e0b',
      detail: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.'
    },
    {
      label: 'Rhetoric Temperature',
      value: 'HOT',
      score: 3,
      scoreColor: '#ef4444',
      detail: 'Leadership rhetoric assessment'
    }
  ],

  // ── 4. D-LIVE BOX ────────────────────────────────────────────────────────────
  dLive: {
    label: 'D61 — NEGOTIATION STALEMATE (Apr 29, Wed)',
    brentRange: '$112–$118',
    brentNote: 'Brent holds at $114.50 amid stalled Islamabad talks and US blockade enforcement. Expect $112–$118 range today as Hormuz contestation persists with no tanker breakthroughs. Swings hinge on Araghchi\'s precondition pushback and Trump\'s rejection of Iran\'s latest offer.',
    tacoEst: '18–22',
    tacoNote: 'TACO at 20, biased upward on IRGC hardline dominance blocking compromise. De-escalation via nuclear concessions could drop it to 15; US military action signals or Hormuz closure threats push toward 25+.',
    narrative: 'Day 42 is the most diplomatically consequential day since the war began. Islamabad talks are underway — Araghchi confirmed, Witkoff leading the US side. The ceasefire is holding on paper (attacks ZERO) but structurally fragile: Netanyahu\'s Beirut strikes killed 112+ and triggered Iran to close Hormuz briefly. Both sides claim victories that cannot coexist — Iran says enrichment continues, US says uranium removal is agreed. The 10-point plan demands are maximalist from Iran\'s side. The talks test whether any middle ground exists. Lebanon is the ticking bomb: excluded from the ceasefire by design, it\'s the vector through which the truce most likely breaks. Oil at $98 is pricing ~60% talks progress but hedging Lebanon risk.'
  },

  // ── 5. ANALYTICAL OUTLOOK ────────────────────────────────────────────────────
  analyticalOutlook: {
    label: 'D61 Outlook — DIPLOMATIC DEADLOCK',
    basisCards: [
      {
        label: 'Ceasefire status',
        value: 'STALLED',
        detail: 'Negotiations deadlocked after Araghchi\'s Islamabad trip; IRGC opposes US demands on nuclear program.',
        borderColor: '#f59e0b',
        valueColor: '#f59e0b'
      },
      {
        label: 'Hormuz access',
        value: 'CONTESTED',
        detail: 'US enforces blockade, intercepting tankers; Iran demands end to port restrictions as precondition.',
        borderColor: '#94a3b8',
        valueColor: '#94a3b8'
      },
      {
        label: 'US posture',
        value: 'MILITARY OPTIONS',
        detail: 'Trump deems Iran offer insufficient; considering strikes if talks fail.',
        borderColor: '#94a3b8',
        valueColor: '#94a3b8'
      },
      {
        label: 'Iran demands',
        value: 'HARDLINE',
        detail: 'Araghchi pushes new Hormuz regime, war compensation, no future attacks; nuclear ignored.',
        borderColor: '#94a3b8',
        valueColor: '#94a3b8'
      },
      {
        label: 'Regional ties',
        value: 'ISRAEL-UAE TIGHTEN',
        detail: 'Iron Dome deployment to UAE signals Gulf alignment against Iran threats.',
        borderColor: '#94a3b8',
        valueColor: '#94a3b8'
      }
    ],
    pathProbabilities: [
      {
        trigger: 'Talks collapse without nuclear concessions by end of week.',
        name: 'US military strike',
        prob: '35%%',
        barWidth: '35%',
        barGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)',
        nameColor: '#ef4444',
        drivers: ''
      },
      {
        trigger: 'IRGC vetoes compromise, US maintains blockade.',
        name: 'Prolonged stalemate',
        prob: '40%%',
        barWidth: '40%',
        barGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)',
        nameColor: '#ef4444',
        drivers: ''
      },
      {
        trigger: 'Pakistan mediation yields Hormuz partial access sans nuclear.',
        name: 'Limited deal',
        prob: '20%%',
        barWidth: '20%',
        barGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)',
        nameColor: '#ef4444',
        drivers: ''
      },
      {
        trigger: 'Iran accepts nuclear curbs and drops preconditions.',
        name: 'Full de-escalation',
        prob: '5%%',
        barWidth: '5%',
        barGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)',
        nameColor: '#ef4444',
        drivers: ''
      }
    ],
    supplyDisruption: {
      current: 'Hormuz contested; US blockade holds, 34+ vessels turned.',
      risk: 'High risk of total closure if US strikes; current intercepts sustain 10-15% global supply pressure. Iranian threats amplify volatility.',
      hormuz: '2-4 transits/day (down from 8/day D41 — Iran closed briefly over Lebanon)',
      watchpoint: 'Araghchi-Pakistani mediator readout today.'
    },
    tacoTrajectory: 'TACO HOLDING at 18 — waiting for Islamabad outcome. If framework → 22-25. If stall → 16-18. If collapse → 5-8. Lebanon is the swing variable.',
    disclaimer: 'Forecast based on open-source intelligence and market data. Not investment advice.'
  },

  // ── 6. KEY TRIGGERS ──────────────────────────────────────────────────────────
  keyTriggers: [
    {
      title: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to ',
      titleColor: '#f59e0b',
      body: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss Strait of Hormuz security with Sultan Haitham al Tariq.'
    },
    {
      title: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following N',
      titleColor: '#f59e0b',
      body: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following Netanyahu\'s order after call with UAE President Mohammed bin Zayed.'
    },
    {
      title: 'April 25: US forces intercepted US-sanctioned Panamanian-flagged gas tanker Seva',
      titleColor: '#f59e0b',
      body: 'April 25: US forces intercepted US-sanctioned Panamanian-flagged gas tanker Sevan in Arabian Sea for transporting Iranian oil.'
    },
    {
      title: 'Hormuz Passage',
      titleColor: '#22c55e',
      body: 'Status: contested. Daily transits: N/A.'
    },
    {
      title: 'Diplomatic Outlook',
      titleColor: '#f59e0b',
      body: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.. Iran\'s Foreign Minister states no direct talks.. Unclear if US-Iran will meet again in Islamabad for diplomatic deal.'
    }
  ],

  // ── 7. INTELLIGENCE TAB ──────────────────────────────────────────────────────
  intelligence: {
    diplomatic: {
      badge: 'TALKS',
      badgeColor: '#22c55e',
      sections: [
        {
          title: 'Diplomatic Status — Day 61',
          items: ['negotiations stalled; no breakthrough']
        },
        {
          title: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for ',
          items: ['US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.']
        },
        {
          title: 'Iran\'s Foreign Minister states no direct talks',
          items: ['Iran\'s Foreign Minister states no direct talks.']
        },
        {
          title: 'Unclear if US-Iran will meet again in Islamabad for diplomatic deal',
          items: ['Unclear if US-Iran will meet again in Islamabad for diplomatic deal.']
        }
      ],
      sources: [
        {
          url: 'https://cryptobriefing.com/irans-araghchi-joins-us-peace-talks-in-islamabad-after-ceasefire/',
          label: 'Crypto Briefing'
        },
        {
          url: 'https://www.republicworld.com/world-news/us-iran-ceasefire-day-2',
          label: 'Republic World'
        },
        {
          url: 'https://www.fdd.org/analysis/2026/04/08/us-iran-agree-to-2-week-ceasefire-in-exchange-for-reopening-of-strait-of-hormuz/',
          label: 'FDD Analysis'
        }
      ]
    },
    military: {
      badge: 'ACTIVE',
      badgeColor: '#ef4444',
      sections: [
        {
          title: 'Apr 28, 2026: Israeli airstrikes hit Hezbollah targets deep in Lebanon’s Beqaa V',
          items: ['Apr 28, 2026: Israeli airstrikes hit Hezbollah targets deep in Lebanon’s Beqaa Valley.']
        }
      ],
      sources: [
        {
          url: 'https://www.republicworld.com/world-news/us-iran-ceasefire-day-2',
          label: 'Republic World'
        },
        {
          url: 'https://www.fdd.org/analysis/2026/04/08/us-iran-agree-to-2-week-ceasefire-in-exchange-for-reopening-of-strait-of-hormuz/',
          label: 'FDD Analysis'
        },
        {
          url: 'https://www.bcaresearch.com/collection/bcas-iran-conflict-daily-dashboard',
          label: 'BCA Research'
        }
      ]
    },
    energy: {
      badge: 'CONTESTED',
      badgeColor: '#22c55e',
      sections: [
        {
          title: 'Energy & Shipping — Day 61',
          items: ['Hormuz status: CONTESTED', 'Daily transits: N/A']
        }
      ],
      sources: [
        {
          url: 'https://app.hyperliquid.xyz/trade/BRENTOIL',
          label: 'Hyperliquid BrentOIL'
        },
        {
          url: 'https://www.bcaresearch.com/collection/bcas-iran-conflict-daily-dashboard',
          label: 'BCA Research'
        },
        {
          url: 'https://www.republicworld.com/world-news/us-iran-ceasefire-day-2',
          label: 'Republic World'
        }
      ]
    }
  },

  // ── 8. NEXT 48H CATALYSTS ────────────────────────────────────────────────────
  next48h: {
    badge: 'NEGOTIATIONS — OUTCOME PENDING',
    catalysts: [
      {
        rank: '1',
        title: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to ',
        outcomeLabel: 'ESCALATION vs DE-ESCALATION',
        body: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss Strait of Hormuz security with Sultan Haitham al Tariq.',
        color: 'yellow'
      },
      {
        rank: '2',
        title: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following N',
        outcomeLabel: 'ESCALATION vs DE-ESCALATION',
        body: 'April 26: Israel deployed Iron Dome battery and IDF personnel to UAE following Netanyahu\'s order after call with UAE President Mohammed bin Zayed.',
        color: 'yellow'
      },
      {
        rank: '3',
        title: 'Ceasefire Compliance',
        outcomeLabel: 'HOLD vs COLLAPSE',
        body: 'negotiations stalled; no breakthrough',
        color: 'yellow'
      },
      {
        rank: '4',
        title: 'Hormuz Passage',
        outcomeLabel: 'OPEN vs BLOCKADE',
        body: 'Current status: CONTESTED. Transits: N/A/day.',
        color: 'green'
      },
      {
        rank: '5',
        title: 'Diplomatic Track',
        outcomeLabel: 'RESUME vs STALL',
        body: 'US sending delegation including Jared Kushner and Steve Witkoff to Pakistan for talks; VP JD Vance on standby.. Iran\'s Foreign Minister states no direct talks.',
        color: 'yellow'
      }
    ]
  },

  // ── 9. RHETORIC TRACKER ──────────────────────────────────────────────────────
  rhetoricTracker: {
    sentiment: {
      label: 'RHETORIC TRACKER',
      value: 'Escalatory — hot',
      score: 60,
      scoreNote: 'Score 48/100 — mixed. Ceasefire-positive rhetoric on bilateral front (talks happening). Escalatory on Lebanon front (Netanyahu). Incompatible victory narratives from both sides.',
      barWidth: '60%',
      barColor: '#ef4444',
      maxEscalation: 80,
      escalation: 38,
      mixed: 34,
      deescalation: 40
    },
    timeline: [
      {
        date: 'Feb 28',
        dayBadge: 'Day 1',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'The future is yours to take.\' Operation Epic Fury begins.',
            tacoImpact: {
              score: 35,
              detail: 'TACO 35'
            }
          }
        ]
      },
      {
        date: 'Mar 1',
        dayBadge: 'Day 2',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'Four weeks, or less.\' Pentagon: targeting IRGC infrastructure.',
            tacoImpact: {
              score: 30,
              detail: 'TACO 30'
            }
          }
        ]
      },
      {
        date: 'Mar 2',
        dayBadge: 'Day 3',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Iran: \'Crushing response.\' Khamenei defiant. Trump: escalation warnings.',
            tacoImpact: {
              score: 25,
              detail: 'TACO 25'
            }
          }
        ]
      },
      {
        date: 'Mar 3',
        dayBadge: 'Day 4',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Pentagon: \'Ahead of schedule.\' Iran: \'Sacred defense.\' Hormuz threats.',
            tacoImpact: {
              score: 22,
              detail: 'TACO 22'
            }
          }
        ]
      },
      {
        date: 'Mar 4',
        dayBadge: 'Day 5',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'Going very well.\' Iran FM: \'Diplomatic options remain.\' Mixed.',
            tacoImpact: {
              score: 28,
              detail: 'TACO 28'
            }
          }
        ]
      },
      {
        date: 'Mar 5',
        dayBadge: 'Day 6',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'Obliteration like nobody\'s seen.\' Max escalation rhetoric. IRGC defiant.',
            tacoImpact: {
              score: 10,
              detail: 'TACO 10'
            }
          }
        ]
      },
      {
        date: 'Mar 6',
        dayBadge: 'Day 7',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Pentagon: targeting nuclear sites. Iran: \'Sacred defense continues.\' Houthi threats.',
            tacoImpact: {
              score: 15,
              detail: 'TACO 15'
            }
          }
        ]
      },
      {
        date: 'Mar 7',
        dayBadge: 'Day 8',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'They have nothing left.\' Iran: \'We will never surrender.\' Parallel realities.',
            tacoImpact: {
              score: 18,
              detail: 'TACO 18'
            }
          }
        ]
      },
      {
        date: 'Mar 8',
        dayBadge: 'Day 9',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Weekend lull. Both sides consolidating. Diplomatic chatter via Oman.',
            tacoImpact: {
              score: 30,
              detail: 'TACO 30'
            }
          }
        ]
      },
      {
        date: 'Mar 9',
        dayBadge: 'Day 10',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Gulf states hedging. UAE quiet. Qatar mediating. Low rhetoric day.',
            tacoImpact: {
              score: 35,
              detail: 'TACO 35'
            }
          }
        ]
      },
      {
        date: 'Mar 10',
        dayBadge: 'Day 11',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'Almost done.\' Iran: \'Resistance continues.\' Strike tempo declining.',
            tacoImpact: {
              score: 32,
              detail: 'TACO 32'
            }
          }
        ]
      },
      {
        date: 'Mar 11',
        dayBadge: 'Day 12',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Pentagon: \'Phase 2 transition.\' Iran: regional allies activated. Houthis strike.',
            tacoImpact: {
              score: 25,
              detail: 'TACO 25'
            }
          }
        ]
      },
      {
        date: 'Mar 12',
        dayBadge: 'Day 13',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'Big progress.\' Iran FM: back-channel signals. De-escalation hints.',
            tacoImpact: {
              score: 38,
              detail: 'TACO 38'
            }
          }
        ]
      },
      {
        date: 'Mar 13',
        dayBadge: 'Day 14',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Mixed signals. Strike reduction but Hormuz posturing. Gulf states nervous.',
            tacoImpact: {
              score: 35,
              detail: 'TACO 35'
            }
          }
        ]
      },
      {
        date: 'Mar 14',
        dayBadge: 'Day 15',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: \'They\'re getting HAMMERED.\' Iran: \'God will protect.\' Escalatory.',
            tacoImpact: {
              score: 20,
              detail: 'TACO 20'
            }
          }
        ]
      },
      {
        date: 'Mar 16',
        dayBadge: 'Day 17',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Weekend. Low activity. Back-channel reports via Swiss/Oman.',
            tacoImpact: {
              score: 40,
              detail: 'TACO 40'
            }
          }
        ]
      },
      {
        date: 'Mar 18',
        dayBadge: 'Day 19',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Pentagon: TEL hunt accelerating. Iran: drone production surge. Mixed.',
            tacoImpact: {
              score: 30,
              detail: 'TACO 30'
            }
          }
        ]
      },
      {
        date: 'Mar 20',
        dayBadge: 'Day 21',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: deadline approaching. Iran: \'No surrender under fire.\' Standoff.',
            tacoImpact: {
              score: 25,
              detail: 'TACO 25'
            }
          }
        ]
      },
      {
        date: 'Mar 22',
        dayBadge: 'Day 23',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Pentagon: \'Running low on everything.\' Iran attrition severe. Mixed.',
            tacoImpact: {
              score: 32,
              detail: 'TACO 32'
            }
          }
        ]
      },
      {
        date: 'Mar 25',
        dayBadge: 'Day 26',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Bibi energy strike push. Trump resists. Internal coalition tension.',
            tacoImpact: {
              score: 28,
              detail: 'TACO 28'
            }
          }
        ]
      },
      {
        date: 'Mar 28',
        dayBadge: 'Day 29',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Iran proxy surge — joint Hezbollah-Houthi-IRGC attacks. Escalatory.',
            tacoImpact: {
              score: 15,
              detail: 'TACO 15'
            }
          }
        ]
      },
      {
        date: 'Mar 30',
        dayBadge: 'Day 31',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Deadline approaching. Both sides hardening positions. Low rhetoric.',
            tacoImpact: {
              score: 22,
              detail: 'TACO 22'
            }
          }
        ]
      },
      {
        date: 'Apr 1',
        dayBadge: 'Day 33',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Deadline passed. No deal. US-Israel coordination fraying. Netanyahu pushing energy strikes.',
            tacoImpact: {
              score: 18,
              detail: 'TACO 18'
            }
          }
        ]
      },
      {
        date: 'Apr 3',
        dayBadge: 'Day 35',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Trump: core objectives nearing completion. Pivot language emerging.',
            tacoImpact: {
              score: 40,
              detail: 'TACO 40'
            }
          }
        ]
      },
      {
        date: 'Apr 4',
        dayBadge: 'Day 36',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Israel ready to strike energy. Trump resisting. Sync collapsed to 20%.',
            tacoImpact: {
              score: 25,
              detail: 'TACO 25'
            }
          }
        ]
      },
      {
        date: 'Apr 5',
        dayBadge: 'Day 37',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Weekend pre-deadline. Quiet. Back-channels active. Both sides posturing.',
            tacoImpact: {
              score: 35,
              detail: 'TACO 35'
            }
          }
        ]
      },
      {
        date: 'Apr 6',
        dayBadge: 'Day 38',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Final pre-ceasefire rhetoric. Iran signals conditional openness. US hawk pressure.',
            tacoImpact: {
              score: 38,
              detail: 'TACO 38'
            }
          }
        ]
      },
      {
        date: 'Apr 7',
        dayBadge: 'Day 39',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'Last attacks pre-ceasefire. Both sides preparing for truce. Houthi final strike.',
            tacoImpact: {
              score: 42,
              detail: 'TACO 42'
            }
          }
        ]
      },
      {
        date: 'Apr 8',
        dayBadge: 'Day 40',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'CEASEFIRE ANNOUNCED. Attacks stop. Hormuz reopening. Historic moment.',
            tacoImpact: {
              score: 75,
              detail: 'TACO 75'
            }
          }
        ]
      },
      {
        date: 'Apr 9',
        dayBadge: 'Day 41',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'SILENCE on Iran. Trump focused on tariffs. Tacit compliance. No escalation. Ceasefire holding.',
            tacoImpact: {
              score: 65,
              detail: 'TACO 65'
            }
          }
        ]
      },
      {
        date: 'Apr 10',
        dayBadge: 'Day 42',
        entries: [
          {
            platform: 'Summary',
            time: '',
            tag: 'MIXED',
            quote: 'ISLAMABAD TALKS. Hegseth: \'regime out of options.\' Iran: \'enrichment won\'t be curtailed.\' Both sides claim victory. Incompatible. Lebanon escalation: Netanyahu kills 112 in Beirut.',
            tacoImpact: {
              score: 48,
              detail: 'TACO 48'
            }
          }
        ]
      },
      {
        date: 'Apr 11',
        dayBadge: 'Day 43',
        entries: [
          {
            platform: 'Press',
            time: '',
            tag: 'ESCALATION',
            quote: 'Mojtaba Khamenei breaks 40-day silence. Vows revenge for father\'s assassination. \'Iran does not seek to extend war but will not give up sovereign rights.\'',
            tacoImpact: {
              score: 'severe',
              detail: 'New Supreme Leader hardline consolidation'
            }
          },
          {
            platform: 'Press',
            time: '',
            tag: 'ESCALATION',
            quote: 'Netanyahu rules out any ceasefire in Lebanon. \'No ceasefire while Hezbollah threatens Israel.\'',
            tacoImpact: {
              score: 'severe',
              detail: 'Lebanon exclusion now permanent'
            }
          }
        ]
      },
      {
        date: 'Apr 12',
        dayBadge: 'Day 44',
        entries: [
          {
            platform: 'Press',
            time: '',
            tag: 'MAX ESCALATION',
            quote: 'Vance 21-hour marathon talks in Islamabad END WITHOUT DEAL. US \'final and best offer\' rejected by Iran. Nuclear commitment demand was the dealbreaker.',
            tacoImpact: {
              score: 'terminal',
              detail: 'Diplomatic path severely damaged'
            }
          },
          {
            platform: 'Truth Social',
            time: '',
            tag: 'MAX ESCALATION',
            quote: 'Trump: \'Whether we make a deal or not makes no difference to me. We\'ve won. We\'ve won on the battlefield by killing Iranian leaders and destroying key military infrastructure.\'',
            tacoImpact: {
              score: 'terminal',
              detail: 'Eliminates negotiating space entirely'
            }
          },
          {
            platform: 'Press',
            time: '',
            tag: 'ESCALATION',
            quote: 'Trump: \'We\'ll open up the strait even though we don\'t use it, because we have a lot of other countries that are either afraid or weak or cheap.\'',
            tacoImpact: {
              score: 'severe',
              detail: 'Naval blockade threat — act of war'
            }
          },
          {
            platform: 'Press',
            time: '',
            tag: 'ESCALATION',
            quote: 'Mojtaba Khamenei: \'Iran will not accept restrictions on Strait of Hormuz operations.\' Made clear sovereign control non-negotiable.',
            tacoImpact: {
              score: 'severe',
              detail: 'Hormuz confrontation inevitable'
            }
          }
        ]
      },
      {
        date: 'Apr 13',
        dayBadge: 'Day 45',
        entries: [
          {
            platform: 'Press',
            time: '',
            tag: 'MAX ESCALATION',
            quote: 'US announces naval blockade of Strait of Hormuz. White House declares victory in Operation Epic Fury. Iran may suspend further talks over Lebanon.',
            tacoImpact: {
              score: 'terminal',
              detail: 'Blockade + ceasefire = unstable equilibrium'
            }
          }
        ]
      },
      {
        date: 'Apr 14, 2026',
        speaker: 'Trump',
        text: 'Their air force is gone, their anti-aircraft is gone, the radar is gone and their leaders are gone. Began a U.S. naval blockade of the Strait of Hormuz to increase pressure on Tehran.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Apr 14, 2026 (overnight)',
        speaker: 'President Masoud Pezeshkian',
        text: 'Indicated that the Iranian side would be willing to continue with discussions so long as they were done within the negotiating framework.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 13, 2026',
        speaker: 'Trump',
        text: 'Trump imposed a naval blockade on Iranian ports following failed talks in Pakistan. Trump claimed that \'other countries\' are offering to help with the blockade.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 1, 2026',
        speaker: 'Trump',
        text: 'Trump stated the U.S. would consider a ceasefire only once the Strait of Hormuz was \'open, free, and clear.\' He added: \'Until then, we are blasting Iran into oblivion or, as they say, back to the Stone Ages!\'',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Post-Islamabad talks (April 12-14, 2026)',
        speaker: 'Trump',
        text: 'Trump said that he \'doesn\'t care\' about negotiations with Iran.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'April 12, 2026',
        speaker: 'Seyed Mohammad Marandi',
        text: 'Negotiations have collapsed as expected. The United States was behaving with \'arrogance and without any regard for sovereignty.\' U.S. rhetoric threatening to kill negotiators and political leadership is pressure to force Iran to accept America\'s term',
        tag: 'IR',
        escalation: 8
      },
      {
        date: 'May 10, 2025 (historical context)',
        speaker: 'Supreme Leader Ali Khamenei',
        text: 'Khamenei supported chants of \'death to America\' during a speech.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: '6 March 2026',
        speaker: 'Trump',
        text: 'There will be no deal with Iran except UNCONDITIONAL SURRENDER!',
        tag: 'US',
        escalation: 5
      },
      {
        date: '9 March 2026',
        speaker: 'Trump',
        text: 'The war is very complete, pretty much, and falsely claimed that the Iranian military had been destroyed and the Strait of Hormuz had re-opened.',
        tag: 'US',
        escalation: 8
      },
      {
        date: '15 March 2026',
        speaker: 'Trump',
        text: 'Demanded that NATO and China help the US to re-open the strait.',
        tag: 'US',
        escalation: 5
      },
      {
        date: '24 March 2026',
        speaker: 'Trump',
        text: 'Claimed that the US and Israel had \'won\' the war, even though Iran continued its missile strikes.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'late March 2026',
        speaker: 'Trump',
        text: 'Repeatedly threatened to destroy Iran\'s infrastructure if it did not make a \'deal\' with the US and re-open the Hormuz strait.',
        tag: 'US',
        escalation: 8
      },
      {
        date: '7 April 2026',
        speaker: 'Trump',
        text: 'Threatened that \'A whole civilization will die tonight, never to be brought back\', if Iran did not reach an agreement with the US.',
        tag: 'US',
        escalation: 5
      },
      {
        date: '8 April 2026',
        speaker: 'Trump',
        text: 'Said the US will work closely with Iran, talking about the tariff, sanctions and relief. Stated: \'There will be no enrichment of Uranium, and the United States will, working with Iran, dig up and remove all of the deeply buried (B-2 Bombers) Nuclear ',
        tag: 'US',
        escalation: 8
      },
      {
        date: '9 April 2026',
        speaker: 'Trump',
        text: 'Threatens Iran with \'bigger and better\' action if it fails to comply with deal. Received 10-point counter-proposal, called it workable basis. Reiterated goals of \'Operation Epic Fury\' achieved.',
        tag: 'US',
        escalation: 5
      },
      {
        date: '13 April 2026',
        speaker: 'Trump',
        text: 'After Islamabad talks failed: \'IRAN IS UNWILLING TO GIVE UP ITS NUCLEAR AMBITIONS!\' Announced naval blockade of the Strait of Hormuz.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'circa 7-8 April 2026',
        speaker: 'Iran’s first vice president',
        text: 'Our response to the enemy’s brutality is to stand firm on our national interests and rely on the inner strength of the great Iranian nation.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'Apr 15, 2026',
        speaker: 'Trump',
        text: 'Trump declared the \'end of Iran conflict\' as new negotiations loom, confirming a second round could begin within days.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Recent (prior to Apr 15)',
        speaker: 'Trump',
        text: 'The United States Navy will blockade any and all ships trying to enter or leave the Strait of Hormuz.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Recent (post-blockade announcement)',
        speaker: 'Iranian leadership',
        text: 'Responded fast to US blockade by exploiting gaps in Washington\'s position; regime trying to avoid escalation as negotiators aim to restart Islamabad talks.',
        tag: 'IR',
        escalation: 8
      },
      {
        date: 'March 29, 2026',
        speaker: 'Trump',
        text: 'Iran had agreed to most of the U.S. demands; threatened to destroy all of Iran\'s power plants, oil wells and desalination plants if a deal was not reached \'shortly\' and the Hormuz strait not reopened \'immediately\'.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 14, 2026',
        speaker: 'Trump',
        text: 'Threatening Iran demanding it reopen the Strait of Hormuz or face massive destruction, warning entire infrastructure could be wiped out and civilizations disappearing overnight.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Easter (early April 2026)',
        speaker: 'Trump',
        text: 'Threatened widespread bombing of Iran\'s civilian infrastructure and eradication of a \'whole civilisation\'; called Pope Leo \'weak\' and captive to the \'Radical Left\'.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'April 15, 2026',
        speaker: 'Trump',
        text: 'The war \'is very close to over,\' and a second round of talks with Iran \'could be happening over next two days\' in Islamabad.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Early April 2026',
        speaker: 'Mohammad Bagher Ghalibaf',
        text: 'Iran would not give in to \'surrender\' terms from the US.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'early April 2026',
        speaker: 'Trump',
        text: 'Threatened to destroy Iran\'s power plants, oil wells, and desalination plants if no deal reached shortly and Strait not reopened immediately; on April 5, threatened attacks on power plants and bridges if Hormuz not reopened.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 8, 2026',
        speaker: 'Supreme Leader Mojtaba Khamenei',
        text: 'Responded to US-Iran ceasefire by ordering military units to halt operations, but warned conflict is far from over; truce conditional, military posture remains alert for swift response to any escalation.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'recent days before Apr 17',
        speaker: 'Parliament Speaker Mohammad Bagher Ghalibaf',
        text: 'Pushed back on social media that \'no negotiations\' were held with the United States.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 18, 2026',
        speaker: 'Trump',
        text: 'Iran \'got a little cute\' by closing Hormuz again; \'they can’t blackmail us\'; talks \'working out really well.\'',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'April 19, 2026',
        speaker: 'Trump',
        text: 'We\'re offering a very fair and reasonable DEAL, and I hope they take it because, if they don\'t, the United States is going to knock out every single Power Plant, and every single Bridge, in Iran. NO MORE MR. NICE GUY! Praised the U.S. blockade of the',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 20, 2026',
        speaker: 'Trump',
        text: 'President Trump is making a major announcement signing executive orders to increase pressure on Tehran, including new sanctions and strategic directives for the Pentagon and State Department.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Apr 21, 2026',
        speaker: 'Trump',
        text: 'Signalled a willingness to meet Iranian leaders face to face if progress is made in the negotiations. Said it\'s highly unlikely he would extend the ceasefire deadline if the deal is not reached by then.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Apr 20, 2026',
        speaker: 'President Pezeshkian',
        text: 'War is in no one’s interest, every rational and diplomatic path should be used to reduce tensions. US is trying to deny Iran its nuclear rights.',
        tag: 'IR',
        escalation: 8
      },
      {
        date: 'Apr 19, 2026',
        speaker: 'IRGC',
        text: 'Strait of Hormuz closed until US lifts blockade.',
        tag: 'IR',
        escalation: 8
      },
      {
        date: 'April 21, 2026',
        speaker: 'Trump',
        text: 'Iran doesn\'t want the Strait of Hormuz closed and that \'They only say they want it closed because I have it totally BLOCKADED (CLOSED!), so they merely want to \'save face.\' People approached me four days ago, saying, \'Sir, Iran wants to open up the S',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 22, 2026',
        speaker: 'Trump',
        text: 'Announced extension of the two-week ceasefire with Iran to give more time for fractured Iranian leadership to respond to the latest proposal.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Apr 22, 2026',
        speaker: 'Trump',
        text: 'Warning that an agreement with Iran would be impossible unless demands are met, threatening to \'blow up the rest of their country\' including leaders; extended ceasefire but maintained naval blockade and pressure.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Apr 22-23, 2026',
        speaker: 'Trump',
        text: 'Described Iran\'s government as \'seriously fractured\'; extended ceasefire until Iranian leaders provide a unified proposal.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Apr 23, 2026',
        speaker: 'Iranian President',
        text: 'Accused US of \'hypocritical rhetoric\'; stated Iran did not achieve goals through military aggression or bullying, and the only way forward is to recognize the rights of the Iranian nation.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'Apr 11-12, 2026 (referenced Apr 22-23)',
        speaker: 'Foreign Minister Abbas Araghchi',
        text: 'Posted on X that Strait of Hormuz reopening to commercial shipping during ceasefire.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 5, 2026',
        speaker: 'Trump',
        text: 'Trump threatened to attack Iran\'s power plants and bridges if the Hormuz Strait was not reopened.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Recent (April 20-23, 2026)',
        speaker: 'Trump',
        text: 'Trump renewed threat to obliterate Iran\'s civilian infrastructure, announced US Navy seized Iranian flagged cargo ship, stated Iran military is \'totally defeated\' and leaders are \'fighting like cats\', said \'don\'t rush me\', and extended ceasefire whil',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 23, 2026',
        speaker: 'Trump',
        text: 'They don\'t even know who\'s leading the country. They\'re in turmoil... we thought we\'d give them a little chance to get some of their turmoil resolved. Ordered continuation of naval blockade on Strait of Hormuz and vowed to shoot and kill any vessels ',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Recent (circa April 23-24, 2026)',
        speaker: 'Trump',
        text: 'Iran military is totally defeated and leaders are fighting like cats. Don\'t rush me.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'April 24, 2026',
        speaker: 'Mojtaba Khamenei',
        text: 'Due to the remarkable unity created among compatriots, a fracture has occurred in the enemy. Warned citizens about enemy\'s psychological warfare.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'Circa April 20, 2026',
        speaker: 'Abbas Araghchi',
        text: 'Officials are taking all aspects into consideration... provocative actions and continued ceasefire violations by the US were a major obstacle... threats and aggression against Iranian commercial ships.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'March 8, 2026',
        speaker: 'Masoud Pezeshkian',
        text: 'Retracted apology to Gulf neighbours for missile and drone attacks, saying remarks were misinterpreted by the enemy that seeks to sow division.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'Recent (early April 2026)',
        speaker: 'Trump',
        text: '\'Don\'t rush me\': Iran military is totally defeated and leaders are \'fighting like cats\'; threatened to destroy power plants, oil wells if no deal.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'Apr 1, 2026',
        speaker: 'IRGC',
        text: 'Strait of Hormuz \'will not be opened to the enemies of this nation\'.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 25, 2026',
        speaker: 'Trump',
        text: 'Sending Steve Witkoff and Jared Kushner to Islamabad for potential second round of discussions; open to diplomacy.',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Recent (pre-April 27)',
        speaker: 'Trump',
        text: 'Iran can phone if it wants to talk; simple agreement: no nuclear weapon; enforcing ironclad naval blockade.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 26, 2026',
        speaker: 'Trump',
        text: 'Signed executive orders for new sanctions and Pentagon directives; warned Iran \'if they want to play that game, they better not play that game\' and threatened to hit targets \'so quickly they\'ll never be able to recover\'. Accused Iran of attacking Ame',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 27, 2026',
        speaker: 'Trump',
        text: 'Discussed Iranian proposal with national security aides; seeks freedom of navigation through Strait and removal of Iran\'s highly enriched uranium (HEU). \'Doesn\'t love\' the plan to decouple conflict from nuclear program.',
        tag: 'US',
        escalation: 8
      },
      {
        date: 'April 29, 2026 (approx., Day 40+)',
        speaker: 'President Masoud Pezeshkian',
        text: 'Iran will not surrender or accept aggression during the ongoing 2026 conflict.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 7, 2026',
        speaker: 'Trump',
        text: 'Posted that \'a whole civilization will die tonight, never to be brought back again\'',
        tag: 'US',
        escalation: 5
      },
      {
        date: 'Prior to April 27, 2026',
        speaker: 'Supreme Leader Mojtaba Khamenei',
        text: 'Described keeping the strait closed as a \'tool to pressure the enemy\'',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 25-27, 2026',
        speaker: 'Khatam al-Anbiya Central Headquarters',
        text: 'Warned US would face \'a reaction from Iran\'s powerful armed forces\' if blockade, banditry and piracy continue; stated Iran ready to monitor region and maintain control over Strait of Hormuz; warned of \'heavier losses in case of further attacks\'',
        tag: 'IR',
        escalation: 8
      },
      {
        date: 'After April 1, 2026',
        speaker: 'Israeli government',
        text: 'Launched numerous strikes against Iran following expiration of Trump\'s 60-day negotiation deadline',
        tag: 'IL',
        escalation: 5
      },
      {
        date: 'April 28, 2026',
        speaker: 'Reza Talaei-Nik',
        text: '\'The United States is no longer in a position to dictate its policy to independent nations,\' adding Washington would \'accept that it must abandon its illegal and irrational demands\'.',
        tag: 'IR',
        escalation: 5
      },
      {
        date: 'April 2026 (approx. Day 40+)',
        speaker: 'Masoud Pezeshkian',
        text: 'Iran will not surrender or accept aggression during the ongoing 2026 conflict.',
        tag: 'IR',
        escalation: 5
      }
    ],
    patterns: [
      {
        title: 'Victory Narrative Hardening',
        detail: 'Both sides now fully committed to incompatible victory claims. Trump: \'We\'ve won.\' Mojtaba Khamenei: vows revenge. No diplomatic overlap remaining. This is worse than pre-ceasefire rhetoric because both sides believe the war validated their position.',
        freq: 'Intensifying D42-D45',
        icon: '⚠️'
      },
      {
        title: 'Diplomatic Collapse Spiral',
        detail: '21-hour marathon talks failure followed by naval blockade announcement within 24 hours. The speed of escalation post-talks suggests US had blockade planned as contingency. Diplomacy-to-confrontation pivot in <48 hours.',
        freq: 'New — D44-D45',
        icon: '⚠️'
      },
      {
        title: 'Lebanon as Deal-Killer',
        detail: 'Iran\'s demand for Lebanon inclusion vs Netanyahu\'s categorical refusal created an impossible triangle: US cannot deliver Lebanon ceasefire, Iran won\'t deal without it, Israel won\'t stop. This structural impasse killed the talks.',
        freq: 'Confirmed — killed Islamabad talks',
        icon: '⚠️'
      }
    ],
    scoreSummary: {
      current: 22,
      previous: 48,
      delta: -26,
      trend: '↓↓ Crashing — talks collapse + naval blockade + victory rhetoric = worst rhetoric environment since war began',
      cumulative: '128 statements analyzed through D45',
      score: '22/100 — hostile. Both sides claiming victory, naval blockade announced, no diplomatic space remaining.',
      statementsAnalyzed: 128,
      deescSignals: 12,
      platformBreakdown: {
        truthSocial: 32,
        pentagon: 22,
        iranFM: 18,
        whiteHouse: 15,
        allies: 12,
        media: 23
      }
    }
  },

  // ── 10. MARKET SIGNALS ───────────────────────────────────────────────────────
  marketSignals: {
    futuresCurve: {
      m1: '$101.53',
      m6: '$92.50',
      m12: '$85.00',
      commentary: 'Backwardation steep at $16.53 (M1-M12). M1 at $101.53 — rallying as ceasefire fragility reprices near-term risk. M6 at ~$92.50 implies markets expect normalization. M12 at ~$85 implies long-term peace pricing but still above pre-war.',
      note: 'Brent in moderate backwardation, steepening at front month on blockade fears. Implies traders price 2-3 month supply crunch.'
    },
    riskReversal: {
      oneMonth: '+3.8',
      threeMonth: '+2.9',
      commentary: 'Risk reversal still call-skewed — upside oil risk exceeds downside. 1-month at +3.8 (down from +5.2 pre-ceasefire peak but UP from +2.8 on ceasefire day). Lebanon-driven Hormuz closure repriced upside risk. Market paying for upside protection again.',
      note: 'Bullish calls dominate skew, risk reversals at 150pt premium. Reflects tail-risk hedging for Hormuz snapback.'
    },
    cdsSpreads: [
      {
        country: 'Iran',
        current: '2,100 bps',
        preWar: '450 bps',
        change: '+1,650 bps',
        signal: 'Tightening from 2,950 peak — ceasefire improving sovereign risk but still extreme',
        note: 'Iran CDS at 1,200bps, UAE/Israel steady; Saudi widening 15bps on regional spillovers.'
      },
      {
        country: 'UAE',
        current: '95 bps',
        preWar: '45 bps',
        change: '+50 bps',
        signal: 'Easing — attacks ZERO. Ceasefire = relief for UAE sovereign risk'
      },
      {
        country: 'Saudi Arabia',
        current: '85 bps',
        preWar: '52 bps',
        change: '+33 bps',
        signal: 'Easing. Pipeline demand stabilizing. Regional risk declining'
      },
      {
        country: 'Bahrain',
        current: '165 bps',
        preWar: '110 bps',
        change: '+55 bps',
        signal: 'Still elevated — 5th Fleet proximity. Ceasefire helping but fragile'
      },
      {
        country: 'Qatar',
        current: '72 bps',
        preWar: '48 bps',
        change: '+24 bps',
        signal: 'Near-normalized. Al Udeid = US commitment. Mediation role = positive'
      }
    ],
    cdsCommentary: 'CDS spreads TIGHTENING across ALL countries Day 2. Iran at 2,100 bps (continued improvement from 2,950 peak). UAE at 95 bps (down from 120). The ceasefire is compressing Gulf sovereign risk toward pre-war levels. Iran remains extreme — 4.7x pre-war — reflecting structural uncertainty (enrichment dispute, regime status, Lebanon wildcard).',
    cftc: {
      badge: 'DELEVERAGING COMPLETE',
      wtiNetLong: '185,000 contracts (↓ from 235,000 pre-ceasefire)',
      brentNetLong: '195,000 contracts (↓ from 265,000 pre-ceasefire)',
      commentary: 'Massive speculative deleveraging since ceasefire. WTI net long down ~50K contracts, Brent down ~70K. Managed money exiting war-trade positions. Remaining longs are structural, not speculative. If ceasefire collapses, repositioning would create explosive upside move. Current positioning = healthy for sustained recovery.',
      note: 'Specs net long 180k contracts, adding on dip; managed money covers shorts amid stalemate.'
    },
    brentWtiSpread: {
      current: '+$4.16',
      preWar: '+$3.50',
      widening: '+$0.66 widening',
      brentPrice: '$107.75',
      wtiPrice: '$103.59',
      commentary: 'WTI premium at $2.64 — Brent $101.53 vs WTI $104.17. Spread widening as ceasefire fragility reprices US supply premium. Pre-war spread was +$3.50 (Brent premium). Inversion persists — US-specific supply disruption pricing.'
    },
    optionsIntelligence: {
      badge: 'UPSIDE REPRICING',
      summary: 'Oil options market repricing upside risk after Hormuz re-closure. The ceasefire crash compressed IV but Lebanon-driven fragility is rebuilding the right tail. Protective calls re-emerging for $110+ strikes.',
      signals: [
        {
          title: 'Implied Volatility',
          icon: '📊',
          explanation: '30-day IV at 38% — down from 52% peak but UP from 32% ceasefire low. Lebanon repricing.',
          signal: 'MODERATE',
          signalColor: '#f59e0b'
        },
        {
          title: 'Put/Call Skew',
          icon: '📈',
          explanation: 'Skew shifted back to call-heavy after brief put dominance on ceasefire. Upside protection demand rising.',
          signal: 'ELEVATED',
          signalColor: '#f59e0b'
        },
        {
          title: 'Open Interest',
          icon: '🔍',
          explanation: '$110 calls rebuilding — 45K contracts at May expiry. Hedging against ceasefire collapse.',
          signal: 'WATCHING',
          signalColor: '#f59e0b'
        },
        {
          title: 'Vol Smile',
          icon: '📉',
          explanation: 'Right tail fattening again. 25-delta calls at 8.2 vol premium over ATM. Market paying for upside catastrophe insurance.',
          signal: 'ELEVATED',
          signalColor: '#f59e0b'
        }
      ],
      bottomLine: 'Options market is hedging BOTH directions but tilted to upside risk. The ceasefire compressed IV but Lebanon-driven Hormuz re-closure rebuilt the right tail. Market message: ceasefire is priced, but collapse isn\'t ruled out.',
      note: 'Implied vol at 45% front month, term structure inverted. Signals acute near-term Hormuz risk pricing.'
    }
  },

  // ── 11. OPERATIONS ───────────────────────────────────────────────────────────
  operations: {
    badge: 'NEGOTIATIONS',
    kpis: [
      {
        label: 'US Strikes D60',
        value: '0',
        delta: 'ZERO — ceasefire',
        note: 'Cumulative: 13,000',
        color: 'green'
      },
      {
        label: 'Vessels Hit',
        value: '150',
        delta: 'Attacked/sunk',
        note: 'Cumulative',
        color: 'red'
      }
    ],
    indicators: [
      {
        indicator: 'Hormuz transit',
        value: 'CONTESTED',
        dir: '↓',
        dirClass: 'ind-down',
        notes: 'Daily transits: N/A'
      }
    ],
    pipeline: {
      petrolineValue: '~6.8M bpd (ramping on Hormuz blockade)',
      petrolineStatus: 'SURGE · HORMUZ BLOCKED',
      petrolineDetail: 'D42: Hormuz transits 2-4/day (DOWN from 8/day D41 after Iran briefly closed again). Pipeline bypass demand still elevated. The brief Hormuz closure demonstrates fragility — pipeline remains critical backup. Flow easing from ~6.5M peak but still well above pre-war 2.8M.',
      adcopValue: '~1.7M bpd (maxed out)',
      adcopStatus: 'FULL LOAD',
      adcopDetail: 'D42: UAE continues to route significant volumes through Fujairah bypass. Hormuz uncertainty (Iran closed it briefly Apr 8-9) keeps ADCOP flow elevated above pre-war. Will normalize only when Hormuz fully stabilizes.'
    },
    uaeAttackSummary: {
      ballisticMissiles: 524,
      ballisticIntercept: '95.6%',
      drones: 2468,
      droneIntercept: '92.9%',
      cruiseMissiles: 55,
      cruiseIntercept: '96.4%',
      killed: 14,
      injured: 252
    },
    iranNeighbors: [
      {
        country: 'UAE',
        missiles: 579,
        drones: 2468,
        total: 3047,
        notes: 'Primary target. 93% intercept. Attacks ceased D40.'
      },
      {
        country: 'Saudi Arabia',
        missiles: 138,
        drones: 410,
        total: 548,
        notes: 'Secondary target. Ras Tanura, SANG bases.'
      },
      {
        country: 'Bahrain',
        missiles: 97,
        drones: 320,
        total: 417,
        notes: '5th Fleet HQ. High-value target set.'
      },
      {
        country: 'Kuwait',
        missiles: 63,
        drones: 250,
        total: 313,
        notes: 'Camp Arifjan. Logistics hub targeted.'
      },
      {
        country: 'Qatar',
        missiles: 50,
        drones: 180,
        total: 230,
        notes: 'Al Udeid. Limited strikes — mediator role.'
      },
      {
        country: 'Oman',
        missiles: 23,
        drones: 100,
        total: 123,
        notes: 'Minimal. Thumrait, Masirah. Oman neutral.'
      }
    ]
  }
,

  // ── PREDICTION ANALYTICS (Sumpter Four Lenses) ──────────────
  predictionAnalytics: {
    fourLenses: {
      statistical: {
        title: 'Statistical Lens — Pattern Recognition (Fisher)',
        keyInsight: 'At Day 42, first face-to-face talks. Korean War ceasefire at D38, first talks at D43 (Kaesong) — remarkably similar timeline. 2006 Lebanon War: UNSCR 1701 at Day 34 required Lebanon inclusion. In 4/5 analogous conflicts where initial ceasefire talks featured incompatible demands, the ceasefire survived the first round in 68% of cases. Base rate for Brent exceeding $105 within 7 days given current $98 and Hormuz fragility: 32%. Polymarket at 100% ceasefire is overconfident — historical base rate for 2-week ceasefire surviving: 57%.',
        signals: [
          {
            text: 'Stalled talks mirror 15% historical ceasefire failure rate in 3rd month.',
            color: '#f59e0b'
          }
        ],
        sevenDayPrediction: 'Based on 5 analogous conflict ceasefires, the base rate for this ceasefire surviving through Apr 17 is 57%. The Islamabad talks most closely mirror Kaesong (July 1951) — initial talks produced no framework but both sides maintained the ceasefire for 3 months. Brent likely range-trades $94-104 with Lebanon as the exogenous shock variable. TACO rises to 20-22 if talks produce any framework, holds 16-18 if stalemate.'
      },
      interactive: {
        title: 'Interactive Lens — Feedback Loops & Game Theory (Lotka)',
        keyInsight: 'The dominant feedback loop has SHIFTED from the oil-politics spiral (D1-D39) to a new DIPLOMACY-SPOILER loop: Islamabad talks progress → market relief → Lebanon escalation by Netanyahu → Iran Hormuz response → talks disruption → market anxiety. Netanyahu is the spoiler player — his payoff function diverges from the US-Iran cooperative game. The Chicken game over Hormuz has evolved: Iran uses brief closures as calibrated signals (not full blockade) to punish Lebanon exclusion without killing the ceasefire.',
        signals: [
          {
            text: 'US blockade forces Iran precondition escalation, creating tit-for-tat loop.',
            color: '#ef4444'
          }
        ],
        sevenDayPrediction: 'The diplomacy-spoiler feedback loop suggests the ceasefire survives BUT talks produce limited results because Lebanon spoiler effect prevents stable Hormuz normalization. Iran\'s calibrated Hormuz signaling is rational and unlikely to escalate to full closure (10% probability in 7 days). The equilibrium trajectory is Protracted Stalemate → Extended Ceasefire: both sides hold, talks continue, Lebanon remains unresolved. 65% probability this holds for 7 days.'
      },
      chaotic: {
        title: 'Chaotic Lens — Knife-Edge Variables (Lorenz / Hamilton)',
        keyInsight: 'The knife-edge variable has SHIFTED from Hormuz transit (D41) to LEBANON ESCALATION TEMPO. Netanyahu\'s Beirut strikes killed 112 — if this intensity continues (or increases), Iran\'s restraint breaks and the ceasefire collapses. The sensitivity is extreme: a single high-casualty Beirut strike during Islamabad talks could cause Iran to walk out + close Hormuz. The talks themselves are NOT the knife-edge — both sides want to be seen negotiating. Lebanon is the exogenous shock that bifurcates all scenarios.',
        signals: [
          {
            text: 'Hezbollah strikes risk proxy spillover, fracturing Gulf neutrality.',
            color: '#ef4444'
          }
        ],
        sevenDayPrediction: 'The knife-edge variable is Netanyahu\'s Lebanon escalation tempo — if IDF pauses Beirut strikes during Islamabad talks (60% probability), the ceasefire survives and talks produce a partial framework. If Netanyahu escalates further during talks (40% probability), Iran walks out or closes Hormuz, and the ceasefire enters terminal fragility. Error-handling: Pakistan mediation and Swiss back-channel provide some resilience, but Lebanon is outside both channels.'
      },
      complex: {
        title: 'Complex Lens — Emergent Patterns (Kolmogorov)',
        keyInsight: 'Emergent pattern: CEASEFIRE-ERA MARKET DIVERGENCE. Dubizzle listings UP (+193), DubiCars DOWN (-535) — first time these platforms have diverged since the war began. This micro-signal suggests ground-level actors are confused about direction: some re-listing (optimism), others delisting (deals completed or withdrawn). The macro pattern is STABLE: oil at $98, VIX at 21, S&P at 6783 — markets in a narrow band. System complexity is DECREASING — fewer actors, fewer fronts, narrower price ranges. But Lebanon is an anti-complexity injection: it adds a non-linear variable that resists the simplification trend.',
        signals: [
          {
            text: 'Israel-UAE defense pact embeds anti-Iran axis, hardening negotiation baselines.',
            color: '#f59e0b'
          }
        ],
        sevenDayPrediction: 'Emergent pattern of market simplification suggests the system is moving toward a stable ceasefire equilibrium — but Lebanon prevents full phase transition to peace pricing. Individual signals: (1) OI deleverage from $559M→$313M = speculative froth removed, (2) VIX stabilizing at 21 = fear normalizing, (3) Dubai divergence = ground-level uncertainty. Phase transition to full peace pricing: 25% probability within 7 days (requires Lebanon resolution). Phase transition to re-escalation: 15% (requires Hezbollah major retaliation + Iran walk-out).'
      }
    },
    gameTheoryPosture: {
      players: [
        {
          player: 'US (Trump/Witkoff)',
          revealedStrategy: 'Hold → De-escalate',
          statedStrategy: 'Victory achieved, negotiating from strength',
          credibilityGap: 'Medium — Witkoff not Rubio suggests less commitment to diplomatic success. \'Fraudulent\' rhetoric vs sending delegation.'
        },
        {
          player: 'Iran (Araghchi)',
          revealedStrategy: 'Hold → Negotiate',
          statedStrategy: '10-point plan or nothing. Enrichment non-negotiable.',
          credibilityGap: 'High — Iran\'s maximalist demands (10-point plan) vs actually showing up at Islamabad. They\'re negotiating despite claiming enrichment is non-negotiable.'
        },
        {
          player: 'Israel (Netanyahu)',
          revealedStrategy: 'Escalate (Lebanon)',
          statedStrategy: 'Lebanon not covered by ceasefire — separate operation',
          credibilityGap: 'Low — Netanyahu doing exactly what he says. Beirut strikes = stated policy. Most credible player.'
        },
        {
          player: 'Gulf States',
          revealedStrategy: 'Hold → Mediate',
          statedStrategy: 'Support ceasefire, facilitate talks',
          credibilityGap: 'Low — Pakistan hosting talks. UAE quiet. Qatar mediating. Actions match statements.'
        }
      ],
      equilibria: [
        {
          name: 'Extended Ceasefire → Partial Framework',
          probability: '38%',
          trend: 'strengthening'
        },
        {
          name: 'Protracted Stalemate (talks + hold)',
          probability: '35%',
          trend: 'stable'
        },
        {
          name: 'Lebanon-Triggered Collapse',
          probability: '18%',
          trend: 'rising'
        },
        {
          name: 'Grand Bargain',
          probability: '9%',
          trend: 'weakening'
        }
      ]
    },
    scenarioMatrix: [
      {
        scenarioName: 'Talks Produce Framework → Extended Ceasefire',
        probabilityPercent: 38,
        description: 'Islamabad talks produce a partial framework: enrichment cap at 60% (not weapons-grade), phased sanctions relief roadmap, Lebanon working group, Hormuz normalization timeline. Not a full deal but enough to extend the ceasefire beyond Apr 22.',
        predictedEvents: [
          {
            event: 'Islamabad joint statement on framework principles',
            estimatedDate: 'Apr 11-12',
            confidence: 'medium'
          },
          {
            event: 'Hormuz transits increase to 10+/day',
            estimatedDate: 'Apr 13-15',
            confidence: 'medium'
          },
          {
            event: 'Ceasefire formally extended beyond Apr 22',
            estimatedDate: 'Apr 16-18',
            confidence: 'low'
          }
        ],
        marketImpacts: {
          brentRange: '$88-$95',
          vixRange: '18-21',
          tacoTrajectory: 'Rises from 18 to 22-28',
          goldDirection: 'down',
          sp500Direction: 'up',
          hygDirection: 'up'
        },
        confirmationTrigger: 'Joint statement from Islamabad mentioning \'framework\' or \'principles\' by Apr 12. Hormuz transits above 8/day sustained for 48h.',
        disconfirmationTrigger: 'Witkoff leaves Islamabad without joint statement. Iran closes Hormuz again. Attack reported on GCC territory.',
        gameTheoryClassification: 'Negotiated Settlement',
        keyLensSource: 'Interactive — feedback loop shifting to de-escalation spiral'
      },
      {
        scenarioName: 'Talks Stall → Fragile Limbo',
        probabilityPercent: 35,
        description: 'Islamabad talks produce no framework but no collapse. Both sides agree to \'continue dialogue.\' Ceasefire nominally holds but Hormuz oscillates based on Lebanon. Oil range-trades $95-102. Neither side escalates or de-escalates meaningfully.',
        predictedEvents: [
          {
            event: 'Islamabad ends with vague \'productive discussions\' statement',
            estimatedDate: 'Apr 11',
            confidence: 'high'
          },
          {
            event: 'Follow-up talks scheduled (but no date confirmed)',
            estimatedDate: 'Apr 12-14',
            confidence: 'medium'
          },
          {
            event: 'Hormuz oscillates between 3-8 transits/day based on Lebanon',
            estimatedDate: 'Apr 10-17',
            confidence: 'high'
          }
        ],
        marketImpacts: {
          brentRange: '$95-$102',
          vixRange: '20-24',
          tacoTrajectory: 'Holds 16-20',
          goldDirection: 'stable',
          sp500Direction: 'stable',
          hygDirection: 'stable'
        },
        confirmationTrigger: 'No joint statement by Apr 12. Witkoff returns to DC. Oil remains in $95-100 range. VIX holds 20-22.',
        disconfirmationTrigger: 'Framework announced (→ Scenario 1). Major Lebanon escalation triggers Iran response (→ Scenario 3).',
        gameTheoryClassification: 'Protracted Stalemate',
        keyLensSource: 'Statistical — base rate for inconclusive first talks = 55%'
      },
      {
        scenarioName: 'Lebanon Triggers Ceasefire Collapse',
        probabilityPercent: 18,
        description: 'Netanyahu further escalates Beirut strikes during Islamabad talks. Iran walks out, closes Hormuz fully, and reactivates proxies. Ceasefire collapses. War resumes with higher intensity. Oil snaps back above $108.',
        predictedEvents: [
          {
            event: 'Major Israeli strike on Beirut during Islamabad talks',
            estimatedDate: 'Apr 10-11',
            confidence: 'medium'
          },
          {
            event: 'Iran delegation walks out of Islamabad',
            estimatedDate: 'within 24h of strike',
            confidence: 'medium'
          },
          {
            event: 'Iran closes Hormuz fully (>24h)',
            estimatedDate: 'Apr 11-13',
            confidence: 'low'
          },
          {
            event: 'Houthi Red Sea attacks resume',
            estimatedDate: 'Apr 12-14',
            confidence: 'medium'
          }
        ],
        marketImpacts: {
          brentRange: '$108-$120',
          vixRange: '28-38',
          tacoTrajectory: 'Crashes from 18 to 5-8',
          goldDirection: 'up',
          sp500Direction: 'down',
          hygDirection: 'down'
        },
        confirmationTrigger: 'Iran delegation leaves Islamabad. Hormuz closed. Attacks resume on GCC territory. Brent breaks $105.',
        disconfirmationTrigger: 'Israel pauses Beirut strikes during talks. Iran maintains Hormuz at 4+/day. No GCC attacks for 72h.',
        gameTheoryClassification: 'Regime Change (escalation path)',
        keyLensSource: 'Chaotic — Lebanon as knife-edge variable'
      },
      {
        scenarioName: 'Grand Bargain Surprise',
        probabilityPercent: 9,
        description: 'Islamabad produces a comprehensive framework surprising everyone. Lebanon included. Enrichment capped. Sanctions roadmap. US force withdrawal timeline. Historic breakthrough driven by mutual exhaustion and domestic pressure on both sides.',
        predictedEvents: [
          {
            event: 'Comprehensive framework announcement from Islamabad',
            estimatedDate: 'Apr 12',
            confidence: 'low'
          },
          {
            event: 'Lebanon ceasefire extension announced',
            estimatedDate: 'Apr 13-14',
            confidence: 'low'
          },
          {
            event: 'Hormuz fully normalized (20+/day)',
            estimatedDate: 'Apr 14-16',
            confidence: 'low'
          }
        ],
        marketImpacts: {
          brentRange: '$82-$88',
          vixRange: '16-19',
          tacoTrajectory: 'Rises from 18 to 35-45',
          goldDirection: 'down',
          sp500Direction: 'up',
          hygDirection: 'up'
        },
        confirmationTrigger: 'Joint US-Iran statement mentioning comprehensive framework, Lebanon, AND enrichment caps. Brent drops below $90. VIX below 19.',
        disconfirmationTrigger: 'Talks end without comprehensive statement. Lebanon excluded from any framework. Enrichment dispute unresolved.',
        gameTheoryClassification: 'Negotiated Settlement',
        keyLensSource: 'Complex — emergent simplification pattern + mutual exhaustion'
      }
    ],
    convergenceAssessment: {
      agreementZones: [
        {
          prediction: 'Ceasefire survives 7 days on the US-Iran bilateral front but Lebanon remains unresolved',
          confidence: 'high',
          supportingLenses: ['Statistical', 'Interactive', 'Complex'],
          reasoning: 'Base rate 68% survival with incompatible demands (Statistical). Both sides\' payoff functions favor maintaining ceasefire (Interactive). Market simplification trend supports stability (Complex). Only Chaotic lens flags the Lebanon knife-edge as a destabilizer.'
        },
        {
          prediction: 'Brent trades $94-104 range for the next 7 days',
          confidence: 'high',
          supportingLenses: ['Statistical', 'Interactive', 'Complex'],
          reasoning: 'Historical pattern: oil range-trades during talk periods. Game theory: neither side benefits from Hormuz full closure during talks. Emergent market band narrowing.'
        }
      ],
      divergenceZones: [
        {
          issue: 'Does Lebanon escalation break the ceasefire within 7 days?',
          lens_a: {
            lens: 'Chaotic',
            position: '40% probability of Lebanon-triggered collapse. Netanyahu\'s ops tempo is the knife-edge variable with extreme sensitivity.'
          },
          lens_b: {
            lens: 'Interactive',
            position: 'Only 18% collapse probability. Iran\'s calibrated Hormuz signaling (brief closures, not blockade) demonstrates strategic restraint. Game theory favors both sides maintaining ceasefire despite Lebanon.'
          },
          resolution_approach: 'Monitor: (1) IDF Beirut strike frequency next 48h, (2) Iran SNSC response, (3) Hezbollah retaliation timeline. If IDF pauses → Interactive wins. If escalates → Chaotic wins.',
          implication: 'The divergence between 40% (Chaotic) and 18% (Interactive) reflects the fundamental uncertainty: is Iran\'s restraint durable or brittle? The answer depends on Netanyahu\'s next move.'
        }
      ],
      netSevenDayOutlook: {
        primaryScenario: 'Talks Stall → Fragile Limbo',
        primaryProbability: 35,
        confidenceBand: '±10 percentage points',
        tacoForecast: {
          direction: 'stable',
          range: '16-22',
          most_likely: 19
        },
        brentForecast: {
          direction: 'stable',
          range: '$94-$104',
          most_likely: 97
        },
        vixForecast: {
          direction: 'stable',
          range: '19-24',
          most_likely: 21
        },
        oneSentenceSummary: 'The Islamabad talks will likely produce no breakthrough but no breakdown, locking the conflict into a fragile ceasefire limbo where Lebanon is the only variable that can shift the trajectory in either direction.'
      }
    },
    decisionTree: {
      title: 'Critical Branch Point: Islamabad Talks + Lebanon Interaction',
      criticalVariable: 'Netanyahu\'s Beirut operations tempo during Islamabad talks',
      timeHorizon: 'Apr 10-12, 2026 — resolution within 48-72 hours',
      whyThisMatters: 'The talks themselves are NOT the branch point — both sides want to be seen negotiating. Lebanon is the exogenous shock. If Netanyahu pauses Beirut strikes during talks (even temporarily), Iran interprets as good faith and the talks have space. If Netanyahu escalates during talks, Iran interprets as US complicity and walks out. Everything flows from this variable.',
      branchA: {
        condition: 'IF Israel pauses or reduces Beirut strikes during Islamabad talks',
        probability: 60,
        immediateConsequences: ['Iran maintains Hormuz at 4+/day', 'Talks proceed for full duration', 'Framework principles possible by Apr 12', 'Brent drifts to $95-98'],
        sevenDayTrajectory: 'Talks produce partial framework or at minimum agree to continue. Ceasefire strengthens. Hormuz gradually normalizes. TACO rises to 20-22.',
        marketImpact: 'Brent $92-98, VIX 19-21, TACO 20-22',
        scenarioAlignment: 'Talks Produce Framework (38%) or Talks Stall (35%)'
      },
      branchB: {
        condition: 'IF Israel escalates Beirut strikes during talks (major casualty event)',
        probability: 30,
        immediateConsequences: ['Iran closes Hormuz immediately', 'Iran delegation walks out or issues ultimatum', 'Brent spikes $5-8 within hours', 'VIX jumps to 24-28'],
        sevenDayTrajectory: 'Ceasefire enters terminal fragility. Talks suspended. Proxy reactivation within days. Oil snap-back to $105-115. TACO crashes to 8-12.',
        marketImpact: 'Brent $105-115, VIX 25-32, TACO 8-12',
        scenarioAlignment: 'Lebanon Triggers Ceasefire Collapse (18%)'
      },
      branchC: {
        condition: 'IF Israel maintains current intensity (no pause, no escalation)',
        probability: 10,
        immediateConsequences: ['Iran maintains calibrated Hormuz signaling', 'Talks continue but under stress', 'Hormuz oscillates 2-6/day', 'Oil range-trades $96-102'],
        sevenDayTrajectory: 'Stalemate deepens. Talks inconclusive. Ceasefire holds but strained. Risk accumulates. TACO holds 16-18.',
        marketImpact: 'Brent $96-102, VIX 21-23, TACO 16-18',
        scenarioAlignment: 'Talks Stall → Fragile Limbo (35%)'
      },
      monitoringIndicators: ['IDF Beirut strike reports during Islamabad talks window', 'Iran SNSC / Araghchi statements from Islamabad', 'Hormuz transit count next 24-48h', 'Hezbollah response to Beirut strikes', 'Trump/Witkoff statement post-talks', 'HL BrentOIL real-time price movement'],
      decisionPointExpiry: '2026-04-12T18:00:00Z'
    }
  },
  // ── ARSENAL & ATTRITION MONITOR ──────────────────────────────────────────
  arsenal: {
    badge: 'CEASEFIRE REBUILD WATCH',
    iran: [
      {
        label: 'MRBM (Shahab-3, Emad, Sejjil)',
        preWar: '~400',
        preWarNum: 400,
        remaining: '~280',
        remainingNum: 280,
        borderColor: '#ef4444',
        statusColor: '#ef4444',
        depletionColor: '#f59e0b',
        production: '~8/month (degraded)',
        status: '30% expended · CEASEFIRE FREEZE. Missiles exist but TEL destruction limits launch capacity. Stockpile preserved during truce.'
      },
      {
        label: 'SRBM (Fateh, Dezful, Zolfaghar)',
        preWar: '~700',
        preWarNum: 700,
        remaining: '~460',
        remainingNum: 460,
        borderColor: '#f59e0b',
        statusColor: '#f59e0b',
        depletionColor: '#22c55e',
        production: '~15/month (degraded)',
        status: '34% expended · CEASEFIRE FREEZE. Short-range arsenal still substantial. Production continuing at reduced rate under ceasefire.'
      },
      {
        label: 'Launchers (TELs)',
        preWar: '~150',
        preWarNum: 150,
        remaining: '~24',
        remainingNum: 24,
        borderColor: '#ef4444',
        statusColor: '#ef4444',
        depletionColor: '#ef4444',
        production: '~1/month (severely degraded)',
        status: '84% DESTROYED — binding constraint. Even with missile stockpiles, launch capability crippled. Ceasefire halts further TEL attrition.'
      },
      {
        label: 'Drones (Shahed-136/238)',
        preWar: '~5,000',
        preWarNum: 5000,
        remaining: '~2,100',
        remainingNum: 2100,
        borderColor: '#f59e0b',
        statusColor: '#f59e0b',
        depletionColor: '#22c55e',
        production: '~200/month (active)',
        status: '58% expended · Only sustainable weapon. Drone production continues during ceasefire. Iran\'s primary capability for future attacks if truce breaks.'
      }
    ],
    us: [
      {
        label: 'Tomahawk (TLAM)',
        preWar: '~4,000',
        preWarNum: 4000,
        remaining: '~2,800',
        remainingNum: 2800,
        borderColor: '#22c55e',
        statusColor: '#22c55e',
        depletionColor: '#22c55e',
        production: '~40/month',
        status: '30% expended · Ceasefire halts usage. Deep inventory. Production continuing. No supply concern.'
      },
      {
        label: 'JASSM/JASSM-ER',
        preWar: '~2,500',
        preWarNum: 2500,
        remaining: '~1,800',
        remainingNum: 1800,
        borderColor: '#22c55e',
        statusColor: '#22c55e',
        depletionColor: '#22c55e',
        production: '~50/month',
        status: '28% expended · Ceasefire preserves stockpile. Primary air-launched standoff weapon. Healthy reserves.'
      },
      {
        label: 'THAAD Interceptors',
        preWar: '~500',
        preWarNum: 500,
        remaining: '~280',
        remainingNum: 280,
        borderColor: '#f59e0b',
        statusColor: '#f59e0b',
        depletionColor: '#f59e0b',
        production: '~6/month',
        status: '44% expended · Critical defensive system. Ceasefire = RELIEF. Most strained US asset. Interceptor pressure was the key vulnerability.'
      },
      {
        label: 'JDAM/PGM',
        preWar: '~50,000',
        preWarNum: 50000,
        remaining: '~29,000',
        remainingNum: 29000,
        borderColor: '#22c55e',
        statusColor: '#22c55e',
        depletionColor: '#22c55e',
        production: '~1,000/month',
        status: '42% expended but deep inventory. 21,000+ targets struck. Production continuing. No supply constraint.'
      }
    ],
    expenditure: {
      iran: [
        {
          weapon: 'Ballistic Missiles',
          count: 524
        },
        {
          weapon: 'Cruise Missiles',
          count: 55
        },
        {
          weapon: 'Drones (Shahed)',
          count: 2468
        },
        {
          weapon: 'TELs Destroyed',
          count: 126
        }
      ],
      iranNote: 'Total: 3,047 projectiles launched at UAE alone. 4,850+ across all GCC targets. CEASEFIRE HALTS EXPENDITURE. Iran\'s binding constraint: TELs (84% destroyed), not missiles.',
      us: [
        {
          weapon: 'Tomahawk',
          count: 1200
        },
        {
          weapon: 'JASSM/JASSM-ER',
          count: 700
        },
        {
          weapon: 'THAAD Intercepts',
          count: 220
        },
        {
          weapon: 'JDAM/PGM',
          count: 21000
        }
      ],
      usNote: '21,000+ targets struck. THAAD interceptors = most strained asset (44% expended). Ceasefire is critical for THAAD resupply. At pre-ceasefire burn rate (~6/day), THAAD would have run out in ~47 more days.'
    },
    depletion: [
      {
        weapon: 'THAAD Interceptors',
        party: 'US',
        daysLeft: 'N/A (ceasefire)',
        daysLeftLabel: 'PAUSED',
        burnRate: '~6/day pre-ceasefire',
        note: 'Most critical asset. Ceasefire = relief. At pre-ceasefire rate, ~47 days remained.',
        barColor: '#f59e0b'
      },
      {
        weapon: 'Iranian TELs',
        party: 'Iran',
        daysLeft: 'N/A (ceasefire)',
        daysLeftLabel: '84% DESTROYED',
        burnRate: '~3/day pre-ceasefire',
        note: 'Binding constraint. 24 remaining. Production ~1/month. If war resumes: 8 days at old rate.',
        barColor: '#ef4444'
      },
      {
        weapon: 'Shahed Drones',
        party: 'Iran',
        daysLeft: 'N/A (ceasefire)',
        daysLeftLabel: 'PRODUCING',
        burnRate: '~70/day pre-ceasefire',
        note: 'Only sustainable weapon. Production ~200/month. Ceasefire = stockpile rebuilding. Iran\'s primary future capability.',
        barColor: '#f59e0b'
      },
      {
        weapon: 'Tomahawk',
        party: 'US',
        daysLeft: 'N/A (ceasefire)',
        daysLeftLabel: 'PAUSED',
        burnRate: '~30/day pre-ceasefire',
        note: 'Deep inventory. 2,800 remaining. 93 days at old rate. No supply pressure.',
        barColor: '#22c55e'
      }
    ],
    bottomLine: 'CEASEFIRE HALTS ALL DEPLETION — both sides benefit from the pause. Iran\'s binding constraint (TELs: 84% destroyed, 24 remaining) is permanently crippled regardless of ceasefire outcome. Drone production continues (~200/month), rebuilding Iran\'s only sustainable attack capability. US benefits most from THAAD interceptor relief — at pre-ceasefire burn rate, THAAD stocks had ~47 days remaining. The ceasefire buys both sides time, but Iran cannot rebuild TELs at meaningful rate (1/month). If war resumes, Iran fights as a drone army.'
  },
  inflation: {
    badge: 'CPI 3.3% — STICKY ABOVE TARGET',
    derivation: {
      steps: [
        {
          label: 'Oil Price Increase',
          value: '+47.2%',
          detail: '$107.75 vs $73.20 baseline',
          color: '#f59e0b'
        },
        {
          label: 'Energy CPI Impact',
          value: '+10.86%',
          detail: 'Fed passthrough coefficient: 0.23',
          color: '#f59e0b'
        },
        {
          label: 'Headline Direct',
          value: '+0.76pp',
          detail: 'BLS energy weight: 7%',
          color: '#f59e0b'
        },
        {
          label: 'With Second-Round',
          value: '+1.12pp',
          detail: '×1.27 multiplier + 0.15pp food',
          color: '#f59e0b'
        },
        {
          label: 'Estimated CPI',
          value: '3.5%',
          detail: '2.4% baseline + 1.12pp war premium',
          color: '#f59e0b'
        }
      ],
      result: {
        headline: '~3.5%',
        explanation: 'Brent at $107.75 (+47.2% vs pre-war baseline). Oil-to-CPI passthrough model estimates headline CPI at ~3.5% (war premium +1.12pp over 2.4% baseline).'
      },
      methodology: 'Dallas Fed elasticity (10% oil → +0.23% energy CPI) × BLS energy weight (7%) × second-round multiplier (1.27) + food acceleration (0.15pp). Source: FEDS Notes 2024, Dallas Fed Working Paper 2023.'
    },
    cpiBreakdown: [
      {
        component: 'Energy',
        preWar: '0.5%',
        current: '12.5%',
        delta: '+12.0pp',
        deltaColor: '#ef4444'
      },
      {
        component: 'Food',
        preWar: '3.1%',
        current: '2.7%',
        delta: '-0.4pp',
        deltaColor: '#22c55e'
      },
      {
        component: 'Shelter',
        preWar: '3.0%',
        current: '3.0%',
        delta: '+0.0pp',
        deltaColor: '#22c55e'
      },
      {
        component: 'Services',
        preWar: '3.1%',
        current: '3.1%',
        delta: '+0.0pp',
        deltaColor: '#22c55e'
      }
    ],
    fedRate: {
      kpis: [
        {
          label: 'Fed Funds Rate',
          value: '4.25-4.50%',
          detail: 'Held since Jan FOMC. War uncertainty keeps Fed on hold.',
          color: '#f59e0b'
        },
        {
          label: 'Next FOMC',
          value: 'May 6-7',
          detail: 'War CPI data will drive decision. Ceasefire oil drop = dovish tailwind IF sustained.',
          color: '#f59e0b'
        },
        {
          label: 'Market Pricing',
          value: '1 cut 2026',
          detail: 'CME FedWatch: ~1 cut priced by Dec 2026. Oil rebound moderates cut expectations.',
          color: '#f59e0b'
        }
      ],
      probabilities: {
        title: 'CME FedWatch — May FOMC Rate Probabilities',
        scenarios: [
          {
            label: 'No change (4.25-4.50%)',
            probability: '55%',
            color: '#f59e0b'
          },
          {
            label: '1 cut (4.00-4.25%)',
            probability: '32%',
            color: '#22c55e'
          },
          {
            label: '2 cuts (3.75-4.00%)',
            probability: '7%',
            color: '#22c55e'
          },
          {
            label: 'Hike (4.50-4.75%)',
            probability: '6%',
            color: '#ef4444'
          }
        ]
      },
      dotPlot: 'Median dot: 4.00% by year-end (2 cuts). Ceasefire improves path — but oil rebound at $98 moderates dovish impulse. If oil sustains below $95, June cut becomes base case. If oil stays at $98+, cuts pushed to Q3.',
      powellQuote: {
        text: 'We need to see sustained evidence that inflation is moving toward our 2% target. The geopolitical situation adds uncertainty, but we will not be swayed by short-term volatility.',
        attribution: 'Chair Powell, March 2026 press conference'
      }
    },
    bottomLine: 'Oil rebound to $98.22 PAUSES ceasefire CPI relief. The estimated headline CPI rises from ~3.16% ($95 Brent) to ~3.25% ($98 Brent). The ceasefire-to-CPI pathway is CONDITIONAL: if talks succeed and Brent drops to $88 → CPI ~3.00% (Fed cuts in June). If ceasefire holds but oil stays at $98 → CPI ~3.25% (cuts delayed to Q3). If ceasefire breaks → CPI back to ~3.50%+ (no cuts 2026). Lebanon-linked Hormuz closures are the inflation wildcard.',
    sources: [
      {
        name: 'Bureau of Labor Statistics — CPI Report',
        url: 'https://www.bls.gov/cpi/'
      },
      {
        name: 'Federal Reserve FEDS Notes 2024',
        url: 'https://www.federalreserve.gov/econres/notes/feds-notes/'
      },
      {
        name: 'Dallas Fed Working Paper — Oil-CPI Passthrough',
        url: 'https://www.dallasfed.org/research/papers/'
      },
      {
        name: 'CME FedWatch Tool',
        url: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html'
      },
      {
        name: 'FRED — Federal Funds Rate',
        url: 'https://fred.stlouisfed.org/series/FEDFUNDS'
      }
    ]
  },

  troopCounter: [
    {
      value: '10,000+',
      label: 'US Troops (ceasefire posture)',
      color: '#f59e0b'
    },
    {
      value: 'SOF INSIDE',
      label: 'Rangers + SEALs at Isfahan',
      color: '#ef4444'
    },
    {
      value: '3',
      label: 'Carrier Groups',
      color: '#f59e0b'
    },
    {
      value: '6',
      label: 'Assets Damaged (F-15E lost)',
      color: '#ef4444'
    },
    {
      value: '13,000+',
      label: 'Targets Struck (thru D40)',
      color: '#f59e0b'
    },
    {
      value: '13+',
      label: 'US KIA (confirmed + F-15E MIA)',
      color: '#ef4444'
    },
    {
      value: '$27B+',
      label: 'War Funding',
      color: '#f59e0b'
    }
  ],

  hyperliquid: {
    price: '$94.86',
    tradBrent: '$96.06',
    spread: '-1.20 (-1.2%)',
    volume: '$680M 24h',
    badge: '24/7 MARKET',
    commentary: 'HL BrentOIL at $94.86 — trading at $1.20 discount to traditional Brent ($96.06). Spread narrowing as ceasefire normalizes 24/7 vs traditional market gap. OI at $310M, down from $559M ATH — deleveraging post-ceasefire. Volume remains elevated at ~$680M/day.',
    chartLabels: ['D23', 'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30', 'D31', 'D32', 'D33', 'D34', 'D35', 'D36', 'D37', 'D38', 'D39', 'D40', 'D41', 'D42', 'D43', 'D44', 'D45', 'D46', 'D47', 'D48', 'D49', 'D50', 'D51', 'D52', 'D53', 'D54', 'D55', 'D56', 'D57', 'D58', 'D59', 'D60'],
    chartHL: [109.5, 109.89, 110.7, 111.5, 109.22, 108.5, 109.8, 110.2, 109.5, 109.94, 110.3, 108.6, 107.2, 104.5, 95.2, 88.4, 90.1, 94.23, 96.7, 96.7, 89.53, 98.76, 92.68, 89.81, 90.42, 92.91, 87.39, 89.65, 91.42, 89.53, 93.98, 95.98, 100.2, 99.87, 100.81, 101.32, 101.85, 103.85],
    chartTrad: [109.97, 110.3, 111.09, 111.75, 109.5, 108.93, 110.15, 110.5, 109.03, 109.03, 109.03, 107.8, 106.5, 103, 94.75, 88.01, 91.5, 95.02, 98.22, 98.22, 98.22, 102.17, 99.36, 94.79, 94.93, 99.39, 90.38, 90.38, 95.25, 95.48, 98.48, 101.91, 105.07, 105.33, 105.33, 106.64, 108.23, 111.26],
    chartSpread: [-0.43, -0.37, -0.35, -0.22, -0.25, -0.39, -0.32, -0.27, 0.47, 0.91, 1.27, 0.8, 0.7, 1.5, 0.45, 0.39, -1.4, -0.79, -1.52, -1.52, -8.69, -3.41, -6.68, -4.98, -4.51, -6.48, -2.99, -0.73, -3.83, -5.95, -4.5, -5.93, -4.87, -5.46, -4.52, -5.32, -6.38, -7.41]
  },

  ceasefireAnalytics: {
    meta: {
      badge: 'DAY 61',
      asOf: '2026-04-10T05:42:00+08:00',
      day: 61,
      tacoScore: 10,
      polyCeasefire: 100,
      headline: 'April 26: Iranian Foreign Minister Abbas Araghchi travelled to Muscat, Oman, to discuss Strait of Hormuz security with Sultan Haitham al Tariq.'
    },
    usDemands: [
      {
        id: 1,
        text: '30-day ceasefire',
        category: 'Military',
        status: 'PARTIAL',
        statusLabel: 'Day 20 of ceasefire',
        statusColor: '#f59e0b',
        probability30d: 72,
        probability60d: 55,
        probability90d: 48,
        probColor: '#22c55e',
        detail: 'Pakistan-brokered 2-week ceasefire (Apr 7–21) is holding on the GCC front with zero attacks logged Apr 8. Extension to 30 days depends on Islamabad talks progress. Probability decays at 60d/90d because each renewal is a separate negotiation event — neither side has committed beyond Apr 21. Lebanon front remains active, giving Iran justification to walk if escalation spills over.',
        dealBreaker: false
      },
      {
        id: 2,
        text: 'Dismantle nuclear facilities (Natanz, Isfahan, Fordow)',
        category: 'Nuclear',
        status: 'NOT_MET',
        statusLabel: 'Iran categorically refuses dismantlement',
        statusColor: '#ef4444',
        probability30d: 1,
        probability60d: 3,
        probability90d: 5,
        probColor: '#ef4444',
        detail: 'Full dismantlement of Natanz, Isfahan, and Fordow is a non-starter for Tehran. These facilities are embedded in Iran\'s domestic political legitimacy and deterrence posture. No Iranian government — reformist or hardline — could survive agreeing to destroy infrastructure built over two decades. Historical precedent: even under JCPOA maximum pressure, dismantlement was never on the table. The only plausible path is a reframing toward \'repurposing\' Fordow under IAEA co-management, but that requires US to drop the dismantlement demand entirely.',
        dealBreaker: false
      },
      {
        id: 3,
        text: 'Permanent pledge to never pursue nuclear weapons',
        category: 'Nuclear',
        status: 'NOT_MET',
        statusLabel: 'No formal commitment offered',
        statusColor: '#ef4444',
        probability30d: 8,
        probability60d: 18,
        probability90d: 28,
        probColor: '#ef4444',
        detail: 'Iran has issued multiple fatwas against nuclear weapons and signed the NPT, but the US demands a new, binding legal instrument. Iran\'s position: the fatwa and NPT are sufficient. A new pledge would require reciprocal US security guarantees that are not currently offered. Probability rises modestly at 90d only if a broader deal framework includes sanctions relief — Iran could reaffirm existing commitments in a new format as a face-saving mechanism.',
        dealBreaker: false
      },
      {
        id: 4,
        text: 'Transfer ~450kg enriched uranium (60%) to IAEA',
        category: 'Nuclear',
        status: 'CONTESTED',
        statusLabel: 'Disputed — Farsi vs. English ceasefire text diverge',
        statusColor: '#f97316',
        probability30d: 15,
        probability60d: 25,
        probability90d: 32,
        probColor: '#ef4444',
        detail: 'The core dispute: Trump claimed Iran agreed to remove nuclear material; Iran\'s Farsi ceasefire version references transfer provisions; the English version omits them; Hegseth insists material \'WILL be removed.\' This textual ambiguity is either a deliberate constructive ambiguity allowing both sides to claim different things, or a genuine misunderstanding that will collapse on contact with implementation. Probability reflects the narrow possibility that a phased transfer to a third-country IAEA facility (e.g., Kazakhstan or Oman) could be negotiated as a confidence-building measure.',
        dealBreaker: false
      },
      {
        id: 5,
        text: 'End uranium enrichment inside Iran',
        category: 'Nuclear',
        status: 'NOT_MET',
        statusLabel: 'Iran explicitly rejected; Hegseth contradicts ceasefire text',
        statusColor: '#ef4444',
        probability30d: 2,
        probability60d: 3,
        probability90d: 4,
        probColor: '#ef4444',
        detail: 'This is the fundamental incompatibility of the negotiation. Iran\'s demand #3 asserts the RIGHT to enrich; US demand #5 demands enrichment END entirely. No overlap exists. Hegseth\'s public denial of Iran\'s enrichment right directly contradicts the Farsi ceasefire text, which Iran interprets as implicit recognition. Any viable deal must resolve this through a cap-and-verify formula (e.g., 3.67% LEU cap with IAEA continuous monitoring) rather than a binary yes/no. Full cessation probability is near zero because it would require Iran to abandon its core negotiating position and domestic political red line.',
        dealBreaker: true
      },
      {
        id: 6,
        text: 'IAEA full unrestricted access',
        category: 'Nuclear',
        status: 'NOT_MET',
        statusLabel: 'No agreement reached on inspections',
        statusColor: '#ef4444',
        probability30d: 10,
        probability60d: 22,
        probability90d: 35,
        probColor: '#ef4444',
        detail: 'IAEA access is historically negotiable — Iran accepted Additional Protocol inspections under JCPOA. The barrier is sequencing: Iran demands sanctions relief BEFORE granting expanded access; the US demands verification BEFORE lifting sanctions. Probability increases meaningfully at 90d because IAEA access is one of the few demands where both sides have precedent for agreement. The drone-in-airspace violation complicates this: Iran will argue that surveillance overflights make \'unrestricted access\' a cover for intelligence collection.',
        dealBreaker: false
      },
      {
        id: 7,
        text: 'End funding/arming/directing proxies (Hezbollah, Houthis)',
        category: 'Proxies',
        status: 'NOT_MET',
        statusLabel: 'Houthis active; Lebanon front active; Israel bombarding Lebanon',
        statusColor: '#ef4444',
        probability30d: 3,
        probability60d: 5,
        probability90d: 8,
        probColor: '#ef4444',
        detail: 'Iran\'s proxy network is a strategic depth asset built over 40 years. Dismantling it is akin to asking the US to close overseas military bases — it eliminates deterrence capability. Houthis continue Red Sea operations. Lebanon front is active with 112 killed in Beirut during the ceasefire, which Iran frames as Israeli aggression, not proxy activity. Iran will never formally acknowledge \'directing\' proxies (it frames them as independent resistance movements). At most, Iran could agree to \'de-escalatory influence\' language without verifiable dismantlement.',
        dealBreaker: false
      },
      {
        id: 8,
        text: 'Halt attacks on regional energy infrastructure',
        category: 'Military',
        status: 'PARTIAL',
        statusLabel: 'Ceasefire paused GCC attacks; Hormuz briefly closed after Beirut strikes',
        statusColor: '#f59e0b',
        probability30d: 60,
        probability60d: 50,
        probability90d: 42,
        probColor: '#f59e0b',
        detail: 'GCC-front energy infrastructure attacks are at zero since Apr 8 — the ceasefire is holding on this dimension. However, Iran briefly closed Hormuz after the Beirut bombardment, demonstrating that energy infrastructure stability is hostage to the Lebanon front. Probability is highest at 30d because the ceasefire directly addresses this; it decays because Lebanon escalation could trigger retaliatory Hormuz closures at any time. Iran views Hormuz leverage as its primary bargaining chip and will not permanently relinquish it without substantial sanctions relief.',
        dealBreaker: false
      },
      {
        id: 9,
        text: 'Reopen Strait of Hormuz',
        category: 'Military',
        status: 'OPEN',
        statusLabel: 'Strait open, transit normalized',
        statusColor: '#22c55e',
        probability30d: 68,
        probability60d: 52,
        probability90d: 45,
        probColor: '#f59e0b',
        detail: 'Hormuz is partially reopened at 4 transits/day — far below pre-war ~60 transits/day but a critical confidence signal. Iran framed reopening as \'coordinated passage\' (preserving its sovereignty claim, aligning with Iran demand #2). The brief closure after the Beirut strikes reveals the fragility: Hormuz is Iran\'s escalation lever and will be used reactively. Full normalization requires either a broader deal or sustained absence of provocations — neither is assured. Probability decays because each Lebanon escalation cycle resets Hormuz risk.',
        dealBreaker: false
      },
      {
        id: 10,
        text: 'Cap missile range and production',
        category: 'Military',
        status: 'NOT_MET',
        statusLabel: 'Iran: missiles are non-negotiable',
        statusColor: '#ef4444',
        probability30d: 2,
        probability60d: 4,
        probability90d: 6,
        probColor: '#ef4444',
        detail: 'Iran\'s ballistic missile program is its primary conventional deterrent and the only capability that can credibly threaten Israel and US regional bases. Iran considers missiles non-negotiable — they are the substitute for the air force Iran cannot build under sanctions. The 112 killed in Beirut reinforces Iran\'s argument that it needs missiles for deterrence against Israeli aggression. No Iranian negotiator can concede missile caps without equivalent Israeli/US disarmament commitments, which are not on the table.',
        dealBreaker: false
      },
      {
        id: 11,
        text: 'Missiles for self-defense only',
        category: 'Military',
        status: 'NOT_MET',
        statusLabel: 'No framework for defining or verifying \'self-defense\'',
        statusColor: '#ef4444',
        probability30d: 5,
        probability60d: 10,
        probability90d: 15,
        probColor: '#ef4444',
        detail: 'A \'self-defense only\' missile posture is definitionally unverifiable — any state claims its missiles are defensive. Iran already frames its arsenal as defensive. The demand is functionally a repackaging of missile caps. Modest probability increase at 90d reflects the possibility that Iran could agree to a declaratory policy shift (missiles explicitly for territorial defense) in exchange for sanctions relief, but without verification mechanisms this would be symbolic rather than substantive.',
        dealBreaker: false
      },
      {
        id: 12,
        text: 'Full sanctions relief (US concession in exchange)',
        category: 'Economic',
        status: 'NOT_MET',
        statusLabel: 'Iran rejects partial relief; full package not offered',
        statusColor: '#ef4444',
        probability30d: 3,
        probability60d: 10,
        probability90d: 18,
        probColor: '#ef4444',
        detail: 'This is listed as a US concession — something the US would offer in exchange for Iranian compliance on nuclear/military demands. Iran demands ALL sanctions removed (demands #4 and #5); the US has not offered any sanctions relief package yet. Congressional politics make full sanctions relief extremely difficult — any deal must survive potential Congressional review under INARA. Probability rises at 90d only if Islamabad talks produce a phased framework where initial sanctions relief is tied to verifiable nuclear steps.',
        dealBreaker: false
      },
      {
        id: 13,
        text: 'US support for Bushehr civilian nuclear program (US concession)',
        category: 'Nuclear',
        status: 'PARTIAL',
        statusLabel: 'Mentioned in talks but not formalized',
        statusColor: '#f59e0b',
        probability30d: 25,
        probability60d: 38,
        probability90d: 48,
        probColor: '#f97316',
        detail: 'Bushehr civilian support is the easiest US concession because it has precedent (Russia already operates Bushehr) and low proliferation risk (reactor-grade fuel, Russian fuel cycle). It serves as a face-saving mechanism for Iran — Tehran can claim the US recognized its civilian nuclear rights. Probability is moderate and rising because this is likely to be an early confidence-building concession in any deal framework. The main barrier is US domestic politics: supporting any Iranian nuclear activity is politically toxic even when technically benign.',
        dealBreaker: false
      },
      {
        id: 14,
        text: 'Remove snapback mechanism (US concession)',
        category: 'Diplomatic',
        status: 'NOT_MET',
        statusLabel: 'Not addressed in current negotiations',
        statusColor: '#ef4444',
        probability30d: 2,
        probability60d: 8,
        probability90d: 15,
        probColor: '#ef4444',
        detail: 'The UN snapback mechanism (UNSCR 2231) allows any JCPOA participant to reimpose UN sanctions. The US used it in 2020. Removing it requires UNSC action and European/Russian/Chinese agreement. This is a downstream demand that only becomes relevant if a comprehensive deal is near — it will not be addressed in the 2-week ceasefire window or in early-stage Islamabad talks. Probability rises at 90d only in scenarios where a full JCPOA-successor framework is being negotiated.',
        dealBreaker: false
      },
      {
        id: 15,
        text: 'Recognition of Israel\'s right to exist',
        category: 'Diplomatic',
        status: 'NOT_MET',
        statusLabel: 'Iran\'s ideological red line',
        statusColor: '#ef4444',
        probability30d: 0,
        probability60d: 1,
        probability90d: 1,
        probColor: '#ef4444',
        detail: 'Recognition of Israel is an ideological red line for the Islamic Republic — it is embedded in the revolutionary constitution and the regime\'s identity. No Iranian leader can concede this and survive politically. Even pragmatists like Rouhani or Zarif never approached this issue. This demand is either a maximalist opening position intended to be traded away, or a poison pill designed to make any deal impossible. Any viable deal must explicitly exclude this demand.',
        dealBreaker: false
      }
    ],
    iranDemands: [
      {
        id: 1,
        text: 'US guarantees non-aggression pact',
        category: 'Security',
        status: 'PARTIAL',
        statusLabel: 'Ceasefire in effect but conditional; no formal pact; drone violation',
        statusColor: '#f59e0b',
        probability30d: 20,
        probability60d: 28,
        probability90d: 35,
        probColor: '#ef4444',
        detail: 'The 2-week ceasefire is a de facto partial non-aggression commitment, but it falls far short of a formal pact. The drone incursion into Iranian airspace directly contradicts any non-aggression principle — Iran will cite this as evidence the US/Israel cannot be trusted even during a ceasefire. A formal non-aggression pact requires Senate ratification (treaty) or executive agreement (fragile, reversible by next administration). The Trump administration\'s track record of withdrawing from JCPOA makes any US guarantee structurally unreliable from Iran\'s perspective.',
        dealBreaker: true
      },
      {
        id: 2,
        text: 'Iran controls Strait of Hormuz (\'regulated passage\')',
        category: 'Security',
        status: 'PARTIAL',
        statusLabel: 'Iran \'coordinates\' transit per ceasefire; fragile',
        statusColor: '#f59e0b',
        probability30d: 55,
        probability60d: 42,
        probability90d: 38,
        probColor: '#f59e0b',
        detail: 'The ceasefire grants Iran a \'coordination\' role in Hormuz transit — a carefully ambiguous term that Iran reads as sovereignty recognition and the US reads as temporary operational arrangement. At 4 transits/day, Iran is demonstrating control while allowing limited commerce. Iran and Oman are imposing transit fees, establishing a financial precedent. Probability is highest at 30d because the ceasefire structure supports it; it decays because the US Navy will not accept permanent Iranian control, and any comprehensive deal will require freedom-of-navigation guarantees that conflict with Iran\'s sovereignty claim.',
        dealBreaker: false
      },
      {
        id: 3,
        text: 'Acceptance of Iran\'s right to uranium enrichment',
        category: 'Nuclear',
        status: 'CONTESTED',
        statusLabel: 'Farsi ceasefire text includes it; English omits it; Hegseth denies it',
        statusColor: '#f97316',
        probability30d: 30,
        probability60d: 38,
        probability90d: 45,
        probColor: '#f97316',
        detail: 'This is the mirror image of US demand #5 — the fundamental incompatibility. The Farsi ceasefire version includes enrichment recognition; the English version does not; Hegseth explicitly denies Iran has any enrichment right. This textual divergence is either intentional constructive ambiguity or a crisis waiting to happen. Iran considers enrichment an inalienable NPT right (Article IV). Any viable deal must find a formula that acknowledges Iran\'s NPT rights while imposing verifiable limitations — the JCPOA 3.67% cap model. Probability rises modestly because this compromise formula has historical precedent and both sides know it.',
        dealBreaker: true
      },
      {
        id: 4,
        text: 'Remove ALL primary US sanctions',
        category: 'Economic',
        status: 'NOT_MET',
        statusLabel: 'No sanctions relief offered',
        statusColor: '#ef4444',
        probability30d: 2,
        probability60d: 8,
        probability90d: 15,
        probColor: '#ef4444',
        detail: 'Primary sanctions (direct US-Iran trade restrictions) are the easier category to lift because they primarily affect bilateral commerce, which is minimal. However, many primary sanctions are codified in legislation (ISA, CISADA, ITRA) requiring Congressional action or complex presidential waiver processes. The Trump administration has shown no willingness to begin sanctions relief discussions. Probability rises at 90d only in a scenario where a comprehensive framework triggers phased relief, starting with humanitarian/energy carve-outs.',
        dealBreaker: false
      },
      {
        id: 5,
        text: 'Remove ALL secondary US sanctions',
        category: 'Economic',
        status: 'NOT_MET',
        statusLabel: 'No sanctions relief offered',
        statusColor: '#ef4444',
        probability30d: 1,
        probability60d: 5,
        probability90d: 10,
        probColor: '#ef4444',
        detail: 'Secondary sanctions (targeting third-country entities doing business with Iran) are the more powerful tool and the harder to lift. They give the US extraterritorial economic leverage — removing them means surrendering coercive capability. The China tariff threat (50% for Iran arms supply) demonstrates the US is EXPANDING secondary economic coercion, not reducing it. Removing secondary sanctions requires the US to accept that other nations will trade freely with Iran — politically impossible in the current US domestic environment.',
        dealBreaker: true
      },
      {
        id: 6,
        text: 'Terminate all UNSC resolutions against Iran',
        category: 'Diplomatic',
        status: 'NOT_MET',
        statusLabel: 'Not addressed in negotiations',
        statusColor: '#ef4444',
        probability30d: 0,
        probability60d: 2,
        probability90d: 5,
        probColor: '#ef4444',
        detail: 'UNSC resolutions require Security Council action and P5 consensus. The US and its allies control enough votes to block termination. This is a downstream demand that only becomes relevant in a comprehensive deal framework. Even JCPOA only SUSPENDED (not terminated) UNSC resolutions. Iran knows this demand is maximalist — it serves as a negotiating chip to be traded for other concessions. Near-zero probability at all horizons because UNSC action is structurally slow and politically blocked.',
        dealBreaker: false
      },
      {
        id: 7,
        text: 'Terminate all IAEA Board of Governors resolutions',
        category: 'Diplomatic',
        status: 'NOT_MET',
        statusLabel: 'Not addressed in negotiations',
        statusColor: '#ef4444',
        probability30d: 0,
        probability60d: 3,
        probability90d: 8,
        probColor: '#ef4444',
        detail: 'IAEA Board resolutions are technically easier to address than UNSC resolutions but still require multilateral consensus. Iran\'s cooperation with IAEA inspections could lead to \'closing the file\' on past issues, as partially achieved under JCPOA. This demand is linked to US demand #6 (IAEA access) — a trade is possible where Iran grants full access in exchange for resolution of outstanding IAEA concerns. Probability rises modestly at 90d because this is a natural component of any nuclear deal.',
        dealBreaker: false
      },
      {
        id: 8,
        text: 'Payment of war damages/reparations from US',
        category: 'Economic',
        status: 'NOT_MET',
        statusLabel: 'Not addressed; Hormuz transit fees serve as partial signal',
        statusColor: '#ef4444',
        probability30d: 1,
        probability60d: 2,
        probability90d: 3,
        probColor: '#ef4444',
        detail: 'The US has never paid war reparations to any adversary in the modern era — doing so would set a precedent with massive global implications. Iran and Oman imposing Hormuz transit fees is a creative workaround: extracting economic compensation without formal reparations. This demand is almost certainly a maximalist position intended to be traded away. The only scenario where it gains traction is if the US agrees to unfreeze Iranian assets held abroad (as was done in the 2016 settlement), which could be framed as reparations domestically in Iran.',
        dealBreaker: false
      },
      {
        id: 9,
        text: 'Withdrawal of ALL US combat forces from regional bases',
        category: 'Military',
        status: 'NOT_MET',
        statusLabel: 'Hegseth: \'We\'re not going anywhere\'',
        statusColor: '#ef4444',
        probability30d: 0,
        probability60d: 1,
        probability90d: 2,
        probColor: '#ef4444',
        detail: 'Hegseth\'s statement is unambiguous: US forces will not withdraw. The US maintains ~45,000 troops across Qatar (Al Udeid), Bahrain (Fifth Fleet), UAE, Kuwait, Iraq, and other regional installations. These bases predate the current conflict and serve broader US strategic interests (oil transit security, counterterrorism, China containment). Withdrawal would be perceived as strategic defeat. Near-zero probability at all time horizons. Iran likely knows this and uses it as a negotiating chip to extract concessions elsewhere.',
        dealBreaker: false
      },
      {
        id: 10,
        text: 'Cessation of war on ALL fronts (including Lebanon and Israeli operations)',
        category: 'Security',
        status: 'BLOCKED',
        statusLabel: 'Netanyahu rejected Lebanon inclusion; Vance agreed; 112 killed in Beirut',
        statusColor: '#7c3aed',
        probability30d: 3,
        probability60d: 8,
        probability90d: 12,
        probColor: '#ef4444',
        detail: 'This is structurally BLOCKED — not merely unmet. Netanyahu explicitly rejected extending ceasefire coverage to Lebanon; VP Vance publicly agreed with Netanyahu\'s position. The US-Iran ceasefire is therefore structurally incomplete by design: it covers the GCC/Gulf front but explicitly excludes the Lebanon/Israel front. 112 killed in Beirut during the ceasefire demonstrates this is not theoretical. Iran views the Lebanon front as part of the same war; the US/Israel view it as a separate conflict. This incompatibility is the single largest structural risk to ceasefire durability — Iran may conclude the ceasefire is a trap that allows Israel to destroy Hezbollah while Iran\'s hands are tied.',
        dealBreaker: true
      }
    ],
    ceasefire: {
      requiredThreshold: {
        minimumUS: 5,
        minimumIran: 4,
        rationale: 'A viable deal requires at minimum: (1) extended ceasefire, (2) some nuclear limitation formula, (3) enrichment cap framework, (4) IAEA access roadmap, (5) Hormuz normalization — 5 of 15 US demands in some form. For Iran: (1) non-aggression guarantee, (2) Hormuz sovereignty acknowledgment, (3) enrichment right recognition, (4) meaningful sanctions relief — 4 of 10 Iran demands. Below these thresholds, neither side\'s domestic politics permit signing. This is the minimum viable package, not the ideal outcome.',
        polymarketSignal: 'Polymarket at 100% ceasefire reflects market confidence that the 2-week TACTICAL pause holds — not that a comprehensive deal is reached. The $225M volume indicates high conviction in the pause but the 94% \'conflict ends\' contract conflates the pause with resolution. Sophisticated assessment: the pause survives its 2-week window with ~75% probability; a comprehensive deal within 90 days has ~22% probability.'
      },
      currentMet: {
        us: 5,
        iran: 3
      },
      gap: {
        us: 0,
        iran: 1
      },
      currentDay: 'DAY 21',
      status: 'negotiations stalled; no breakthrough'
    },
    compromiseZone: {
      headline: 'Narrow but Real: A JCPOA-Plus Framework Exists If Both Sides Accept Asymmetric Concessions',
      probability: 22,
      probColor: '#f97316',
      timeHorizon: '60–90 days for framework agreement; 6–12 months for implementation',
      minimumViableDeal: {
        title: 'The Islamabad Framework: JCPOA-Plus with Gulf Security Architecture',
        usConcessions: ['Recognize Iran\'s right to enrich uranium up to 3.67% LEU under continuous IAEA monitoring — replicating JCPOA Article IV language', 'Phase 1 sanctions relief: unfreeze $6–10B in Iranian assets held in South Korea, Japan, and Iraq within 60 days of verified nuclear compliance', 'Phase 2 sanctions relief: remove secondary sanctions on Iranian oil exports to Asian buyers (China, India, South Korea) within 180 days', 'Support Bushehr civilian reactor operations including Russian fuel supply chain', 'Executive agreement on non-aggression (not Senate treaty — preserves presidential flexibility) with 5-year renewal clause', 'Accept Iran\'s \'coordination role\' in Hormuz transit as face-saving formula for both sides'],
        iranConcessions: ['Cap enrichment at 3.67% LEU with all 60% HEU stockpile transferred to IAEA custody in Kazakhstan within 90 days', 'Grant IAEA Additional Protocol access to all declared sites plus managed access to military sites with 24-day notice (JCPOA formula)', 'Formal reaffirmation of NPT commitments and fatwa against nuclear weapons in a new UN-registered instrument', 'Verifiable reduction in ballistic missile deployments within 150km of GCC borders (not a cap on development — a deployment zone restriction)', 'Commitment to \'de-escalatory influence\' on Houthi Red Sea operations (not dismantlement — influence language)', 'Normalize Hormuz transit to 30+ transits/day within 30 days of ceasefire extension'],
        mustExclude: ['Lebanon/Israel front — Netanyahu controls this variable and has explicitly rejected inclusion; any attempt to bundle it will kill the deal', 'Israel recognition — ideological red line that Iran cannot cross; including it is a deal-killer by design', 'Full nuclear dismantlement — Iran will never agree; the US must accept limitations over elimination', 'US troop withdrawal — Hegseth\'s position is firm and non-negotiable; Iran must accept continued US regional presence', 'War reparations — no precedent exists; Hormuz transit fees serve as the de facto workaround', 'UNSC resolution termination — requires multilateral process incompatible with bilateral deal timeline'],
        faceSavingMechanism: 'The US claims: \'Iran agreed to cap enrichment, transfer HEU, and accept full IAEA inspections — we achieved what JCPOA could not.\' Iran claims: \'The US recognized our inalienable right to enrichment, lifted sanctions, and signed a non-aggression pact — we achieved what decades of resistance demanded.\' Both are technically true. The deal succeeds because each side can accurately describe the same agreement in ways that satisfy domestic audiences. Pakistan, as broker, takes credit for preventing nuclear war. China quietly benefits from reopened oil trade.'
      },
      blockers: [
        {
          blocker: 'Lebanon Front Structural Incompatibility',
          severity: 'Critical',
          severityColor: '#ef4444',
          resolution: 'De-link Lebanon from Iran-US negotiations entirely. Establish a separate Israel-Lebanon track (potentially French/Egyptian mediated). Iran must accept that it cannot protect Hezbollah through the US-Iran channel. This is the hardest pill for Tehran — it means accepting the ceasefire is a partial arrangement that leaves its most important ally exposed.'
        },
        {
          blocker: 'Enrichment Binary: US Demands Zero vs. Iran Demands Recognition',
          severity: 'Critical',
          severityColor: '#ef4444',
          resolution: 'Reframe from binary (yes/no enrichment) to graduated (how much, under what verification). The JCPOA 3.67% formula is the only proven template. Requires the US to publicly walk back Hegseth\'s \'no enrichment\' position — politically costly but necessary. A quiet shift from \'end enrichment\' to \'verifiable enrichment limitations\' is the only viable path.'
        },
        {
          blocker: 'Ceasefire Text Divergence (Farsi vs. English)',
          severity: 'Critical',
          severityColor: '#ef4444',
          resolution: 'The Islamabad talks must produce a SINGLE authoritative text in both languages with certified translation. The current ambiguity is a ticking bomb — it either gets resolved diplomatically or it detonates when implementation begins. Pakistan\'s role as honest broker is critical here.'
        },
        {
          blocker: 'Drone Incursion Precedent',
          severity: 'Major',
          severityColor: '#f97316',
          resolution: 'US/Israel must cease surveillance overflights of Iranian territory during the ceasefire period. Iran will use the drone incident to resist IAEA access (\'you already spy on us from the air\'). A formal no-overflight commitment during negotiations would rebuild trust, but US/Israeli intelligence agencies will resist losing collection capabilities.'
        },
        {
          blocker: 'China Tariff Escalation Complicating Sanctions Relief',
          severity: 'Major',
          severityColor: '#f97316',
          resolution: 'The 50% tariff threat on China creates a parallel escalation track that intersects with Iran negotiations. If China retaliates, the US will be fighting economic wars on two fronts, potentially making Iran deal more attractive (resolve one front). If China complies, Iran loses a key supplier and economic lifeline, weakening its negotiating position. Resolution depends on US-China dynamics outside the Iran channel.'
        },
        {
          blocker: 'US Domestic Politics — Congressional Review',
          severity: 'Moderate',
          severityColor: '#f59e0b',
          resolution: 'Any deal involving sanctions relief triggers INARA review. The Trump administration could use executive orders for initial relief (asset unfreezes, waiver renewals) to avoid Congressional veto. But this makes the deal structurally fragile — reversible by any future president, which is exactly why Iran distrusts US commitments.'
        }
      ],
      scenarios: [
        {
          name: 'Ceasefire Extends, No Comprehensive Deal',
          probability: 42,
          color: '#f59e0b',
          description: 'The 2-week ceasefire is renewed for another 2–4 weeks. Islamabad talks continue but produce only incremental confidence-building measures (prisoner exchanges, humanitarian corridors, Hormuz transit increases). No breakthrough on nuclear or sanctions issues. Lebanon front remains active. This is the status quo trajectory — a frozen conflict with periodic renewals.',
          marketImpact: 'Brent stabilizes $92–98 range. VIX drifts to 18–20. Markets price in indefinite managed tension. Oil premiums shrink modestly. Equities recover 3–5% as worst-case scenarios fade.'
        },
        {
          name: 'Framework Agreement (JCPOA-Plus)',
          probability: 18,
          color: '#22c55e',
          description: 'Islamabad talks produce a surprise framework agreement within 60 days. Both sides accept the minimum viable deal: enrichment caps, IAEA access, phased sanctions relief, non-aggression executive agreement. Lebanon is explicitly excluded. Implementation timeline is 6–12 months. Pakistan and Oman are guarantors.',
          marketImpact: 'Brent drops to $78–85 on supply normalization expectations. VIX falls to 14–16. S&P rallies 8–12%. Defense stocks decline. Iranian oil futures emerge. Gulf sovereign wealth funds increase equity allocations.'
        },
        {
          name: 'Ceasefire Collapses, War Resumes',
          probability: 25,
          color: '#ef4444',
          description: 'A triggering event — major Lebanon escalation, Iranian nuclear provocation, Hormuz incident, or assassination — collapses the ceasefire before Apr 21. Both sides blame the other. Military operations resume within 48–72 hours. Hormuz fully closes. This scenario is driven by the four active violations accumulating rather than any single event.',
          marketImpact: 'Brent spikes to $115–130. VIX surges above 35. S&P drops 8–15%. Gold breaks $2,800. Shipping insurance rates triple. Global recession probability rises to 45%.'
        },
        {
          name: 'Frozen Conflict (Korea-Model)',
          probability: 12,
          color: '#f97316',
          description: 'Neither war nor peace. The ceasefire becomes a permanent armistice without a peace deal. Hormuz operates at reduced capacity indefinitely. Sanctions remain. Nuclear program continues under ambiguous constraints. Both sides maintain military postures. Occasional flare-ups are managed through back-channel communication. This becomes the \'new normal\' — structurally unstable but persistent.',
          marketImpact: 'Brent settles at $95–105 permanently elevated baseline. Markets adapt with a \'war premium\' of 8–12% on energy. VIX normalizes at 20–22. Regional economies restructure around reduced Hormuz throughput.'
        },
        {
          name: 'Escalation to Regional War',
          probability: 3,
          color: '#7c3aed',
          description: 'Ceasefire collapse leads to wider regional conflict involving direct Israel-Iran engagement, potential US strikes on Iranian nuclear facilities, and activation of all proxy fronts simultaneously. This is the tail risk scenario — unlikely but catastrophic. Triggered by either a nuclear revelation (Iran breakout attempt) or a mass casualty event that makes de-escalation politically impossible.',
          marketImpact: 'Brent exceeds $150. Global oil supply disrupted by 15–20%. VIX above 50. S&P drops 20–30%. Gold above $3,200. Global recession. Potential disruption to 30% of world oil transit through Hormuz.'
        }
      ],
      note: 'Convergence possible on interim Hormuz patrols sans full nuclear talks. US drops blockade for Iran compensation freeze, Pakistan guarantees enforcement.'
    },
    chinaFactor: {
      headline: 'Beijing Calculates: 50% Tariff Pain vs. Strategic Foothold in Iran — Revealed Preference Is to Absorb and Delay',
      probability: 18,
      probColor: '#ef4444',
      gameState: {
        usPosition: 'The US is leveraging its dominant position in global financial infrastructure to coerce China into cutting Iran\'s military supply chain. The 50% tariff threat is layered on top of existing trade tensions — it is not an isolated demand but an escalation in an ongoing economic confrontation. The US calculates that China values access to US/Western markets more than its Iran relationship. This is a credible threat: 50% tariffs on Chinese goods would cost Beijing an estimated $180–250B in annual trade volume.',
        chinaPosition: 'China imports ~70% of its crude oil through Hormuz and has deployed special envoy Jun Zhai to signal diplomatic engagement. Beijing\'s strategic interest is stability — it needs Hormuz open and oil flowing. However, China has NOT deployed concrete economic leverage (no Treasury dumps, no CNY weaponization, no rare earth restrictions), suggesting it is reserving escalation options rather than matching US pressure.',
        chinaRevealedStrategy: 'China\'s revealed preference through Day 42 is: maintain Iran arms/tech supply, issue rhetorical condemnations of US tariff threats, avoid direct economic retaliation, and position itself as a peace mediator. This is a \'hedge and delay\' strategy — China is betting that US attention will fragment across multiple fronts (Iran, trade war, domestic politics) and the tariff threat will not be fully implemented or enforced. Beijing is also calculating that Iran needs Chinese supply regardless of US pressure, giving China leverage over both parties.',
        equilibrium: 'The Nash equilibrium in this game is a mixed strategy: China partially reduces visible military transfers to Iran (satisfying US optics) while maintaining dual-use technology and energy trade through intermediaries and shell companies. The US partially implements tariffs (demonstrating resolve) without reaching the full 50% threshold. Neither side fully cooperates or fully defects. This \'managed non-compliance\' equilibrium is unstable but self-reinforcing in the short term.',
        implication: 'For the ceasefire: China\'s hedge-and-delay strategy means Iran retains access to Chinese military technology and dual-use goods throughout the negotiation period — reducing Iran\'s urgency to make concessions. For oil markets: China\'s continued engagement with Iran provides a floor under Iranian oil exports (~1.2M bpd to China), limiting the effectiveness of US sanctions pressure. For the broader conflict: China becomes a shadow party to any deal — its compliance or non-compliance with sanctions determines Iran\'s economic baseline and therefore Iran\'s willingness to negotiate.'
      },
      scenarios: [
        {
          name: 'China Complies (Cuts Iran Supply)',
          probability: 18,
          color: '#22c55e',
          ceasefire_impact: 'Iran loses its primary military resupply channel and key economic partner. Tehran\'s negotiating position weakens significantly — sanctions bite harder, missile resupply halts, and economic pressure mounts. Paradoxically, this INCREASES ceasefire probability because Iran has fewer options and stronger incentives to negotiate. However, it also increases the risk of an Iranian \'desperation move\' (nuclear breakout, Hormuz full closure) if Tehran concludes it is being cornered.',
          brent_impact: 'Brent drops $5–8 to $90–93 range as market prices in reduced Iran supply and increased compliance with sanctions. However, Chinese demand for alternative suppliers (Saudi, UAE, Iraq) increases, partially offsetting the decline.'
        },
        {
          name: 'China Absorbs Tariff, Maintains Iran Supply',
          probability: 45,
          color: '#f59e0b',
          ceasefire_impact: 'Iran retains its economic and military lifeline. Tehran can negotiate from a position of relative strength — sanctions are partially circumvented, missiles are resupplied, and oil revenues continue flowing through Chinese channels. The ceasefire holds but Iran feels less urgency to make nuclear concessions. Negotiations drag on. The US is forced to choose between escalating against both China AND Iran simultaneously or accepting a weaker deal.',
          brent_impact: 'Brent remains elevated at $96–102. Chinese tariff absorption adds cost friction to global trade, increasing manufacturing input costs. Oil market sees continued Iranian supply to China (~1.2M bpd) but restricted access to Western markets.'
        },
        {
          name: 'Partial Compliance (Managed Non-Compliance)',
          probability: 30,
          color: '#f97316',
          ceasefire_impact: 'The most likely equilibrium. China reduces visible military transfers (surface-to-air missile components, drone parts) while maintaining dual-use technology, energy trade, and financial channels through intermediaries. The US partially implements tariffs (20–30% vs. threatened 50%). Both sides save face. Iran retains enough Chinese support to sustain but not enough to feel fully secure — creating moderate pressure to negotiate without desperation.',
          brent_impact: 'Brent stabilizes at $94–99. Market uncertainty about enforcement creates a volatility premium. Sanctions evasion continues but at reduced volume. Oil traders price in \'partial compliance\' discount.'
        },
        {
          name: 'China Retaliates (Escalatory Spiral)',
          probability: 7,
          color: '#ef4444',
          ceasefire_impact: 'China retaliates against 50% tariff with counter-tariffs, Treasury sales, or rare earth restrictions. US-China economic war escalates, consuming US diplomatic bandwidth and reducing focus on Iran. Paradoxically, ceasefire may hold longer because the US needs to resolve one front before opening another. But Iran could exploit US distraction to advance nuclear program or test ceasefire boundaries.',
          brent_impact: 'Brent spikes to $105–115 on dual-crisis risk premium. Global trade disruption amplifies energy cost pass-through. Recession probability increases to 35–40%. Markets price in multi-front economic conflict.'
        }
      ],
      note: 'China presses Iran for oil flow stability amid US tariffs. Leverages sanctions waivers to extract Hormuz concessions from Tehran.'
    },
    violationImpact: [
      {
        violation: 'Israel bombarding Lebanon (112 killed in Beirut during ceasefire)',
        impact: 'Directly undermines Iran\'s demand #10 (all fronts ceasefire) which is already BLOCKED by Netanyahu/Vance agreement. Iran briefly closed Hormuz in response, demonstrating that Lebanon escalation has immediate spillover to Gulf stability. The 112 casualties provide Iran rhetorical ammunition to frame the ceasefire as one-sided — Tehran is restrained while its allies are destroyed. This is the single highest-impact violation because it validates Iranian hardliners who argue the ceasefire is a trap.',
        ceasefireRisk: 'High',
        riskColor: '#ef4444',
        demandAffected: 'Iran #10 (all fronts ceasefire) — BLOCKED; also destabilizes US #8 (energy infrastructure) and US #9 (Hormuz) through reactive Iranian escalation',
        note: 'Violation spikes Brent $10+, triggers US precision strikes on ports. Military cascade hits 20% Hormuz flow, Houthi Red Sea sympathy attacks.'
      },
      {
        violation: 'Drone incursion into Iranian airspace (US/Israeli origin)',
        impact: 'Directly violates any non-aggression principle and undermines Iran\'s demand #1 (non-aggression pact). From Tehran\'s perspective, a drone in sovereign airspace during a ceasefire is an act of war — whether surveillance or armed. This violation gives Iran justification to resist IAEA inspections (\'you use inspections as cover for intelligence collection\'), block progress on US demand #6, and question whether any US security guarantee is credible. The drone incident may be intentional sabotage by elements opposed to the ceasefire (Israeli intelligence or US hardliners).',
        ceasefireRisk: 'High',
        riskColor: '#ef4444',
        demandAffected: 'Iran #1 (non-aggression pact) — undermined; also poisons US #6 (IAEA access) by linking inspections to espionage'
      },
      {
        violation: 'US denial of Iran\'s enrichment right (Hegseth statement vs. Farsi ceasefire text)',
        impact: 'Creates a textual and political crisis at the heart of the ceasefire. The Farsi version of the ceasefire text — the version Iran\'s domestic audience has seen — includes enrichment recognition. Hegseth\'s public denial means either (a) the US is reneging on a commitment Iran believes was made, or (b) the two sides signed different agreements. Either interpretation is devastating for trust. This violation blocks progress on Iran demand #3 and US demand #5 simultaneously — the fundamental nuclear incompatibility. If not resolved in the Islamabad talks, this becomes the most likely cause of ceasefire collapse.',
        ceasefireRisk: 'High',
        riskColor: '#ef4444',
        demandAffected: 'Iran #3 (enrichment right) — CONTESTED; US #5 (end enrichment) — creates irreconcilable contradiction between the two positions'
      },
      {
        violation: 'US 50% tariff threat on China for Iran arms supply',
        impact: 'Opens a second front in the conflict — US vs. China economic warfare layered on top of US vs. Iran military confrontation. The tariff threat signals US willingness to use economic weapons against third parties to isolate Iran. For the ceasefire: if China complies, Iran\'s negotiating position weakens (higher urgency to deal); if China absorbs, Iran maintains leverage (lower urgency). The tariff threat also signals to Iran that the US is pursuing maximum pressure strategy even during the ceasefire — undermining the \'good faith negotiation\' premise. The risk is that China views this as part of a broader US containment strategy and retaliates, creating a multi-front economic crisis that destabilizes global markets.',
        ceasefireRisk: 'Medium',
        riskColor: '#f59e0b',
        demandAffected: 'Iran #4/#5 (sanctions removal) — US expanding sanctions regime makes removal less likely; also affects China\'s role as potential peace mediator (Chatham House assessment)'
      }
    ],
    summaryKpis: [
      {
        label: 'Brent',
        value: '$107.75',
        detail: 'Live KPI',
        color: '#22c55e'
      },
      {
        label: 'Hormuz',
        value: 'CONTESTED',
        detail: 'Daily transits: N/A',
        color: '#ef4444'
      }
    ],
    bottomLine: 'The Iran-US ceasefire is a genuine but fragile tactical achievement — the first pause in 42 days of active conflict. Polymarket\'s 100% confidence reflects the narrow truth that the GCC-front pause is holding on Day 3. But this number masks four compounding violations that are eroding the ceasefire\'s structural integrity from within. The Lebanon front remains an active war zone with 112 killed in Beirut, and Netanyahu\'s explicit rejection of ceasefire coverage — endorsed by VP Vance — means the ceasefire is structurally incomplete by design. The enrichment text divergence (Farsi vs. English) is a crisis deferred, not resolved. The drone incursion poisons the trust environment. And the China tariff ultimatum opens a second-order game that could either accelerate a deal (if China complies, weakening Iran) or entrench the stalemate (if China absorbs, sustaining Iran). The compromise zone is narrow but real: a JCPOA-Plus framework with enrichment caps at 3.67%, IAEA access, phased sanctions relief, and a non-aggression executive agreement — explicitly excluding Lebanon, Israel recognition, full dismantlement, and troop withdrawal. This deal has approximately a 22% probability of materializing within 90 days. The more likely outcome (42%) is an indefinite series of ceasefire renewals without a comprehensive deal — a managed stalemate that keeps Brent in the $92–98 corridor and leaves all fundamental issues unresolved. The 28% collapse probability is not trivial: each day the four violations accumulate without resolution, the ceasefire\'s load-bearing capacity diminishes. The analytical bottom line: this is a ceasefire in search of a peace process, not a peace process producing a ceasefire. The Islamabad talks must bridge the enrichment gap and produce a single authoritative text within the 12 remaining days of the pause, or the window closes and both sides return to their pre-April 7 postures.',
    sources: [
      {
        name: 'Polymarket — Iran-US Ceasefire Contract',
        url: 'https://polymarket.com/event/iran-us-ceasefire'
      },
      {
        name: 'Reuters — Pakistan Brokers Iran-US Ceasefire',
        url: 'https://www.reuters.com/world/middle-east/'
      },
      {
        name: 'Al Jazeera — Lebanon Bombardment During Ceasefire',
        url: 'https://www.aljazeera.com/news/middle-east'
      },
      {
        name: 'Chatham House — China Lacks Security Umbrella for Middle East',
        url: 'https://www.chathamhouse.org/publications'
      },
      {
        name: 'IAEA — Iran Nuclear Program Reports',
        url: 'https://www.iaea.org/newscenter/focus/iran'
      },
      {
        name: 'US Department of Defense — Hegseth Statements',
        url: 'https://www.defense.gov/News/'
      },
      {
        name: 'Arms Control Association — JCPOA Reference',
        url: 'https://www.armscontrol.org/factsheets/iran-nuclear-agreement'
      },
      {
        name: 'CSIS — Iran Ballistic Missile Program',
        url: 'https://www.csis.org/programs/missile-defense-project'
      },
      {
        name: 'Brent Crude Futures — ICE',
        url: 'https://www.ice.com/products/219/Brent-Crude-Futures'
      },
      {
        name: 'CBOE — VIX Index',
        url: 'https://www.cboe.com/tradable_products/vix/'
      }
    ]
  },


};


// Legacy compatibility: expose MARKET_DATA as an alias
const MARKET_DATA = {
  labels: DASHBOARD_DATA.chartData.labels,
  brent:  DASHBOARD_DATA.chartData.brent,
  vix:    DASHBOARD_DATA.chartData.vix,
  hyg:    DASHBOARD_DATA.chartData.hyg,
  sp500:  DASHBOARD_DATA.chartData.sp500,
  taco:   DASHBOARD_DATA.chartData.taco
};