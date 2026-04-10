/* ========================================
   BIBI WATCH — Netanyahu Rhetoric Monitor
   Charts & Dynamic Rendering
   ======================================== */

(function() {
  'use strict';

  /* ── DATA ── */

  var rhetoricTimeline = [
    {
      day: 1, date: 'Feb 28', dateLabel: 'Day 1 — Feb 28, 2026',
      statement: '"We will destroy their missiles and raze their missile industry to the ground."',
      context: 'Joint announcement with Trump.',
      aggression: 9,
      target: 'International',
      iranResponse: 'Massive retaliation — missiles on Gulf states, Hormuz closure begins',
      prediction: 'Expected retaliation → Confirmed'
    },
    {
      day: 2, date: 'Mar 1', dateLabel: 'Day 2 — Mar 1, 2026',
      statement: '"This war may take some time but it will not take years."',
      context: '',
      aggression: 6,
      target: 'Israeli public (reassurance)',
      iranResponse: 'Continued strikes on US bases, 4 GCC states hit',
      prediction: null
    },
    {
      day: 3, date: 'Mar 2', dateLabel: 'Day 3 — Mar 2, 2026',
      statement: 'Rubio reveals Netanyahu call about Khamenei intelligence led to strike timing.',
      context: '',
      aggression: 7,
      target: 'International (implied: we can get anyone)',
      iranResponse: 'Leadership vacuum emerges, Pezeshkian scrambles for control',
      prediction: null
    },
    {
      day: 7, date: 'Mar 7', dateLabel: 'Day 7 — Mar 7, 2026',
      statement: '"He ordered the restoration of Iran\'s nuclear and ballistic capabilities, buried them deep underground. If we hadn\'t acted immediately, within months Iran\'s industries of death would have been immune."',
      context: 'Official gov.il statement.',
      aggression: 8,
      target: 'International justification',
      iranResponse: 'Pezeshkian\'s apology to neighbors (D7), "fire at will" admission → IRGC pushback',
      prediction: 'Ceasefire odds briefly rose on de-escalation hopes, then crashed after continued strikes'
    },
    {
      day: 9, date: 'Mar 9', dateLabel: 'Day 9 — Mar 9, 2026',
      statement: 'Strategic silence — lets Trump absorb media pressure.',
      context: 'Trump gives 5 contradictory statements in one day (CNN).',
      aggression: 2,
      target: 'N/A (silent)',
      iranResponse: 'Iran recalibrates',
      prediction: 'Strategic silence score: Notable'
    },
    {
      day: 10, date: 'Mar 10', dateLabel: 'Day 10 — Mar 10, 2026',
      statement: '"Iran\'s leadership openly calls for hostility toward Israel."',
      context: '',
      aggression: 5,
      target: 'International framing',
      iranResponse: 'IRGC declares "reciprocal retaliation is over" — continuous strikes',
      prediction: null
    },
    {
      day: 11, date: 'Mar 11', dateLabel: 'Day 11 — Mar 11, 2026',
      statement: 'NYT: "Trump Wants to Bend Iran. Netanyahu Wants to Break It."',
      context: 'Divergence emerges: Trump hints at exit, Netanyahu pushes regime change.',
      aggression: 7,
      target: 'Implicit through surrogates',
      iranResponse: 'Divergence signals noted by markets',
      prediction: null
    },
    {
      day: 14, date: 'Mar 12', dateLabel: 'Day 14 — Mar 12, 2026 — FIRST PRESS CONFERENCE',
      statement: '"Iran is no longer the same Iran. This is no longer the same Middle East." "We are not waiting. We are initiating. We are attacking with a force the like of which has not been seen before." "I have added another goal: create conditions for the Iranian people to overthrow this regime."',
      context: 'First press conference since war began. Threatens Mojtaba Khamenei: "I wouldn\'t issue life insurance policies on any of the leaders." Addresses Iranian people: "Help is on the way." Compares Khamenei to "a kind of Hitler." Claims he speaks with Trump "nearly every day."',
      aggression: 9,
      target: 'Multi-audience (Israeli + Iranian people + international)',
      iranResponse: 'Continued strikes, missiles during his speech, IRGC autonomous. Pezeshkian accused Netanyahu of "deception based on geography."',
      prediction: null
    },
    {
      day: 15, date: 'Mar 14', dateLabel: 'Day 15 — Mar 14, 2026',
      statement: '"Deranged scumbags." Shifted rhetoric from "eliminate regime" to "diminish capabilities as nuclear/missile threat." Admitted war is "on Trump\'s terms."',
      context: 'Graham warned: "please be careful with your target selections." Netanyahu: "If we must defeat them repeatedly, we will continue to do so."',
      aggression: 8,
      target: 'Israeli public + international',
      iranResponse: 'Kharg Island strikes. IRGC escalates Gulf attacks. Pezeshkian 3 conditions rejected.',
      prediction: null
    },
    {
      day: 16, date: 'Mar 15', dateLabel: 'Day 16 — Mar 15, 2026',
      statement: 'Isfahan factory strike authorized. Netanyahu backing Israeli intelligence targets deeper into Iran.',
      context: 'Operations channeled through IDF rather than public rhetoric.',
      aggression: 7,
      target: 'Via IDF operations',
      iranResponse: 'Drone attacks on multiple Gulf states intensify. Zero Hormuz transit.',
      prediction: null
    },
    {
      day: 17, date: 'Mar 16', dateLabel: 'Day 17 — Mar 16, 2026',
      statement: 'Katz: NATO threats escalated, Chabahar port strikes authorized. Netanyahu channeling operations through defense minister.',
      context: 'Proxy rhetoric via Katz. VIX fell -3.9% despite Dubai airport strike.',
      aggression: 7,
      target: 'Proxy rhetoric via Katz',
      iranResponse: 'Dubai airport drone strike, UAE airspace closed.',
      prediction: null
    },
    {
      day: 18, date: 'Mar 17', dateLabel: 'Day 18 — Mar 17, 2026 — LARIJANI KILLED + GROUND OPS',
      statement: 'Defense Minister Katz announced elimination of Ali Larijani (SNSC secretary) and Basij commander Soleimani. IDF launched ground operations in southern Lebanon (36th Division). Qassem designated as elimination target.',
      context: 'Most significant targeted killing since Khamenei on Feb 28. New front opened in Lebanon. France/Germany/UK warned against ground offensive.',
      aggression: 9,
      target: 'Multi-front: Iran decapitation + Lebanon ground invasion',
      iranResponse: 'Handwritten note released (proof of life?). Saudi 35-drone barrage. UAE airspace closed. Fujairah fuel tank hit.',
      prediction: null
    },
    {
      day: 19, date: 'Mar 18', dateLabel: 'Day 19 — Mar 18, 2026 — SOUTH PARS + KHATIB KILLED',
      statement: 'Netanyahu approved Israeli strike on South Pars gas field. IRGC Gen. Khatib killed in Bushehr strike. IDF expanded Litani River ops in Lebanon.',
      context: 'South Pars attack triggered energy tit-for-tat escalation. Iran vowed retaliation against 5 Gulf oil sites.',
      aggression: 10,
      target: 'Iran energy infrastructure + military leadership',
      iranResponse: 'Ras Laffan (Qatar LNG) struck. Habshan (UAE) targeted. Energy war fully open.',
      prediction: null
    },
    {
      day: 20, date: 'Mar 19', dateLabel: 'Day 20 — Mar 19, 2026',
      statement: 'Netanyahu: "Iran no longer has the ability to enrich uranium or make ballistic missiles." Halted South Pars strikes at Trump\'s request.',
      context: 'Rare concession to Trump pressure on energy targeting. Claimed victory on nuclear/missile front.',
      aggression: 7,
      target: 'International — victory narrative',
      iranResponse: 'Kuwait refinery fires. Continued Gulf-wide energy attacks.',
      prediction: null
    },
    {
      day: 21, date: 'Mar 20', dateLabel: 'Day 21 — Mar 20, 2026 — NATANZ + DIMONA',
      statement: 'IDF struck Natanz nuclear facility (again). Killed IRGC spokesman Naini. Struck Tehran during Nowruz.',
      context: 'Nowruz strikes seen as provocative. Iran responded by targeting Dimona.',
      aggression: 9,
      target: 'Iran nuclear sites + leadership',
      iranResponse: 'Iran struck Dimona + Arad — 180+ injured. Biggest Iranian strike on Israeli soil.',
      prediction: null
    },
    {
      day: 22, date: 'Mar 21', dateLabel: 'Day 22 — Mar 21, 2026 — TRUMP ULTIMATUM',
      statement: 'Netanyahu: "If you want proof Iran endangers the entire world, the last 48 hours have given it." Called on world leaders to join the war.',
      context: 'Trump issued 48-hour Hormuz ultimatum. Bibi used Dimona attack to rally international support.',
      aggression: 8,
      target: 'International coalition building',
      iranResponse: 'Iran threatened to mine entire Persian Gulf. Targeted Barakah nuclear plant (UAE).',
      prediction: null
    },
    {
      day: 23, date: 'Mar 22', dateLabel: 'Day 23 — Mar 22, 2026 — WEEKEND',
      statement: 'Israel DM threatened to "set Iran back decades." IDF chief approved strikes on "all fronts."',
      context: 'Trump extended ultimatum 5 days. Israel frustrated by sudden diplomatic pivot.',
      aggression: 8,
      target: 'Iran — maximum pressure maintained',
      iranResponse: 'Iran denied all talks. Continued missile strikes on Israel.',
      prediction: null
    },
    {
      day: 24, date: 'Mar 23', dateLabel: 'Day 24 — Mar 23, 2026 — TRUMP TALKS CONFUSION',
      statement: 'IDF "completed extensive strikes" in Isfahan. Israeli analysts described "confusion" at Trump\'s sudden shift to talks.',
      context: 'Trump claimed productive talks. Iran denied. Israel struck energy infrastructure despite supposed pause.',
      aggression: 7,
      target: 'Iran infrastructure — acting independently of US diplomatic signals',
      iranResponse: 'Cluster bombs on Tel Aviv. David\'s Sling malfunction. 4+ casualties.',
      prediction: null
    },
    {
      day: 25, date: 'Mar 24', dateLabel: 'Day 25 — Mar 24, 2026 — CEASEFIRE CONFUSION',
      statement: 'Netanyahu: "More weeks of fighting expected." IDF Army Chief: "Operation against Hezbollah has merely commenced."',
      context: 'Stark contrast with Trump\'s ceasefire talk. Israel openly planning long-term campaign while US floats peace.',
      aggression: 8,
      target: 'Hezbollah + Iran — long war framing',
      iranResponse: '3 missile waves at Israel. Tel Aviv hit with cluster munitions.',
      prediction: null
    },
    {
      day: 26, date: 'Mar 25', dateLabel: 'Day 26 — Mar 25, 2026 — 15-POINT PLAN',
      statement: 'IDF launched "large-scale strikes" on Qazvin + Isfahan. Hit gas facilities despite Trump\'s energy pause promise.',
      context: 'US delivered 15-point ceasefire plan via Pakistan. Israel continued strikes — clear divergence from US diplomatic posture.',
      aggression: 8,
      target: 'Iran energy/government infrastructure',
      iranResponse: 'Named new SNSC head. Fresh missile waves at Israel and Gulf.',
      prediction: null
    },
    {
      day: 27, date: 'Mar 26', dateLabel: 'Day 27 — Mar 26, 2026 — IRAN REJECTS PLAN',
      statement: 'IDF continued large-scale strikes despite US ceasefire push. Israel unclear if it even supports the 15-point plan. Netanyahu insists strikes continue regardless.',
      context: 'Iran rejected 15-point plan and issued counter-proposal demanding reparations + sovereignty over Hormuz. 82nd Airborne deploying. Ground invasion odds surging.',
      aggression: 9,
      target: 'Iran government/military infrastructure — Qazvin, Isfahan',
      iranResponse: '80/day regional attacks (35 at Israel). Cluster munitions. Counter-demands: reparations, Hormuz sovereignty, cessation.',
      prediction: null
    },
    {
      day: 28, date: 'Mar 27', dateLabel: 'Day 28 — Mar 27, 2026 — TANGSIRI KILLED',
      statement: 'Netanyahu celebrated killing of IRGC Navy commander Tangsiri: "We will eliminate every commander of terror until Iran\'s military machine is broken." IDF intensified strikes on IRGC naval assets.',
      context: 'Israel assassinated IRGC Navy chief Tangsiri — highest-ranking kill of war. Trump extended deadline to Apr 6. Pakistan confirms indirect talks. 82nd Airborne deploying. Pentagon weighs 10K more troops.',
      aggression: 10,
      target: 'IRGC Navy command — Tangsiri assassination + naval base strikes',
      iranResponse: '70/day regional attacks (30 at Israel). Vows "Strait will run red." Hormuz collapsed to 2-3 transits. Counter-proposal: 5 conditions including reparations.',
      prediction: null
    },
    {
      day: 29, date: 'Mar 28', dateLabel: 'Day 29 — Mar 28, 2026 — HOUTHIS ENTER WAR',
      statement: 'Netanyahu largely silent as Houthis open new front. IDF focused on 50-jet strike on Iranian arms factories. Israel intercepted Yemen missile near Dimona.',
      context: 'Houthis launch first missiles at Israel since war began — new front opens. 12 US troops injured at Prince Sultan. Trump: war not finished. IRGC warns Gulf civilians. One month of war: 13 US KIA, 1,937 Iranian dead.',
      aggression: 8,
      target: 'Iranian arms manufacturing — 3 factory complexes, weapons + missile components',
      iranResponse: '75/day attacks (Prince Sultan strike, Jerusalem missile). Houthis join with ballistic missiles at Beer Sheva/Dimona. IRGC civilian evacuation warning.',
      prediction: null
    },
    {
      day: 30, date: 'Mar 29', dateLabel: 'Day 30 — Mar 29, 2026 — PAKISTAN SUMMIT',
      statement: 'Netanyahu maintained strike tempo while diplomats gathered. IDF struck Arak nuclear complex + Ardakan yellowcake plant. Expanded Lebanon invasion beyond Litani River. 3 journalists killed by Israeli drone.',
      context: 'Pakistan hosts 4-FM summit (Saudi, Turkey, Egypt) — largest diplomatic push of war. Marines arrived. Houthis 2nd attack on Israel. Tel Aviv hit (8 impacts). Iran allows humanitarian Hormuz transit. 1/3 of Iran missiles destroyed.',
      aggression: 8,
      target: 'Nuclear sites (Arak + Ardakan) + weapons manufacturing + Lebanon expansion + Iraq',
      iranResponse: '70/day attacks (Tel Aviv 8 impacts, 1 killed). Houthis 2nd strike. Qalibaf: never accept humiliation. IRGC threatens universities. Allows humanitarian transit.',
      prediction: null
    },
    {
      day: 31, date: 'Mar 30', dateLabel: 'Day 31 — Mar 30, 2026 — SOF DEPLOYED',
      statement: 'Netanyahu quiet as markets react to diplomacy. IDF maintaining strike tempo but no new high-profile targets. Focus shifting to Lebanon invasion expansion.',
      context: 'SOF (Rangers + SEALs) deployed — Kharg Island / Hormuz / Isfahan targets. Brent crashed -4.15% on Pakistan summit optimism. Rubio-Araghchi direct meeting possible within days. Republican pushback on ground war.',
      aggression: 7,
      target: 'Continued strikes on Iranian weapons infrastructure + Lebanon operations',
      iranResponse: '65/day attacks. Tehran: "set Americans on fire" if ground troops. Allowing humanitarian Hormuz transit. Response to 15-point plan transmitted via Pakistan.',
      prediction: null
    },
    {
      day: 32, date: 'Mar 31', dateLabel: 'Day 32 — Mar 31, 2026 — KHARG THREAT',
      statement: 'Netanyahu quiet as Trump escalates rhetoric to Kharg Island threat. Israel military says weapons strikes completing "in days." IDF focus on Lebanon buffer zone expansion.',
      context: 'Trump threatened to obliterate Kharg Island, power plants, desalination. Markets ignored it (VIX -6.5%). Vance: objectives met. Pakistan summit concluded. Iran attacks declining to 15/day. Hormuz improving.',
      aggression: 7,
      target: 'Iranian weapons manufacturing — completing campaign. Lebanon buffer zone.',
      iranResponse: '60/day attacks declining. 70/day at Israel (Houthi contribution). Publicly rejecting talks but transmitted response via Pakistan. Hormuz opening selectively.',
      prediction: null
    },
    {
      day: 33, date: 'Apr 1', dateLabel: 'Day 33 — Apr 1, 2026 — MARKETS PRICE PEACE',
      statement: 'Netanyahu silent as markets surge. IDF announced completion of weapons production strikes. Focus shifting from destruction to negotiation positioning.',
      context: 'Brent crashed to $101 (below $105 first time since D10). S&P +2.91% biggest rally of war. VIX at war-low 24.2. Trump: deal soon, new reasonable regime. Pakistan hosting direct talks. HL BrentOIL $847M volume record.',
      aggression: 6,
      target: 'Completing weapons production campaign — winding down strike targets',
      iranResponse: '50/day attacks declining sharply. FM calls US demands excessive but continues indirect talks via Pakistan. Allowing Pakistani ships through Hormuz.',
      prediction: null
    },
    {
      day: 34, date: 'Apr 2', dateLabel: 'Day 34 — Apr 2, 2026 — MARKET REVERSAL',
      statement: 'Netanyahu quiet as oil whipsaws. IDF maintaining reduced strike tempo after completing weapons campaign. No major Israeli escalation — focus on Lebanon consolidation.',
      context: 'Brent surged +8.12% reversing yesterday\'s crash. Iran FM Araghchi: trust is zero, no negotiations. Pakistan FM to Beijing for China backing. Houthis 3rd attack on Israel. WTI>Brent inversion.',
      aggression: 5,
      target: 'Lebanon consolidation + reduced Iran strikes. Weapons campaign completed.',
      iranResponse: '55/day attacks. Araghchi denied negotiations, "prepared for ground invasion." Houthis 3rd coordinated strike. Hormuz still IRGC-controlled.',
      prediction: null
    },
    {
      day: 35, date: 'Apr 3', dateLabel: 'Day 35 — Apr 3, 2026 — EXIT SIGNAL',
      statement: 'Netanyahu winding down operations. IDF weapons campaign complete. Focus on Lebanon buffer zone consolidation. No new major strikes on Iran announced.',
      context: 'Trump: leaving very soon, 2-3 weeks. Rubio: can see finish line. China-Pakistan 5-point plan. VIX declining to 23.87 despite $109 oil. US enters Iran at 91% on Polymarket (ground entry = endgame). Houthis 4th attack.',
      aggression: 5,
      target: 'Reduced — campaign objectives largely met. Lebanon consolidation.',
      iranResponse: '50/day declining. Hardliners vs moderates split. No response to 15-point plan. Hormuz volatile. Houthis coordinating 4th strike.',
      prediction: null
    },
    {
      day: 36, date: 'Apr 4', dateLabel: 'Day 36 — Apr 4, 2026 — TRI-FRONT ATTACK',
      statement: 'Netanyahu signaled readiness to strike Iranian energy sites — awaiting Trump approval. Israeli protests against war growing. IDF maintaining operations in Lebanon and against Houthi/IRGC launches.',
      context: 'Houthis 5th attack — first JOINT operation with IRGC + Hezbollah targeting Ben Gurion Airport. IRGC drone attacked vessel in Hormuz. Trump: core objectives nearing completion. US intel: Iran won\'t negotiate seriously. Polymarket: US enters 97%.',
      aggression: 7,
      target: 'Awaiting energy strike approval from Trump. Lebanon buffer. Counter-Houthi operations.',
      iranResponse: '55/day attacks. Tri-front coordinated strike (IRGC + Hezbollah + Houthis). MSC Ishyka drone attack in Hormuz. FM denies negotiations. QatarEnergy tanker hit.',
      prediction: null
    },
    {
      day: 37, date: 'Apr 5', dateLabel: 'Day 37 — Apr 5, 2026 — EVE OF DEADLINE',
      statement: 'Netanyahu pushing for energy strikes if deadline passes. IDF maintaining operations. Israeli protests growing but security cabinet aligned on continued pressure.',
      context: 'April 6 deadline TOMORROW. US enters Iran at 100% on Polymarket. Tri-front attacks continuing (Iran+Hezbollah+Houthis on Tel Aviv). HL BrentOIL rising on deadline premium. B1 bridge collapsed. Iran demands Lebanon in ceasefire.',
      aggression: 7,
      target: 'Awaiting deadline outcome. Energy infrastructure strike list prepared. Lebanon operations.',
      iranResponse: '60/day attacks. Tri-front coordination maintained. Demands Lebanon inclusion. FM says trust is zero. Communicating via Pakistan despite denials.',
      prediction: null
    },
    {
      day: 38, date: 'Apr 6', dateLabel: 'Day 38 — Apr 6, 2026 — DEADLINE DAY',
      statement: 'Netanyahu struck South Pars petrochemical plant. Lobbying Trump for energy infrastructure strikes. Security cabinet on high alert for multiple scenarios.',
      context: 'Apr 6 deadline extended 24h to Apr 7 (3rd extension). 45-day ceasefire proposal from Egypt/Pakistan/Turkey. IRGC intel chief assassinated. F-15E shot down. Iran structural paralysis — can\'t accept. 25+ killed today.',
      aggression: 8,
      target: 'South Pars petrochemical + continued military targets. Energy strike list ready.',
      iranResponse: '45/day attacks declining. Attacks on UAE at ZERO. Weighing 45-day framework but Araghchi rejects deadline language. IRGC intel chief killed — decision chain broken.',
      prediction: null
    },
    {
      day: 39, date: 'Apr 7', dateLabel: 'Day 39 — Apr 7, 2026 — POWER DAY',
      statement: 'Netanyahu aligned with Trump on maximum pressure. Israel reportedly struck Kharg Island. IDF intensified strikes on Karaj electrical infrastructure. Security cabinet preparing for full energy campaign if deadline passes.',
      context: 'Trump: "A whole civilization will die tonight." Kharg Island struck (NYT). Iran rejects ceasefire, 10-point counter. Attacks surged to 75/day. 45-day Islamabad Accord still alive. Iran: 14M ready to sacrifice. Karaj 18 killed.',
      aggression: 9,
      target: 'Kharg Island + Karaj electrical grid + continuing military infrastructure. Energy strike campaign imminent.',
      iranResponse: '75/day attacks (surged from near-zero!). IRGC: "deprive US of oil for years." Human chains around power plants. 10-point counter-demands. FM rejects ceasefire as "pause to regroup."',
      prediction: null
    },
    {
      day: 40, date: 'Apr 8', dateLabel: 'Day 40 — Apr 8, 2026 — CEASEFIRE',
      statement: 'Netanyahu accepted ceasefire under US pressure. Clarified: Lebanon conflict NOT included. IDF stands down from Iran operations. Relief internally but hardliners furious.',
      context: 'Pakistan brokered 2-week ceasefire just before 8PM ET deadline. Trump: DEAL! Brent crashed 13%. VIX -17.65%. S&P +3%. Iran: Hormuz open under Iranian military management. Iran hardliners protest (death to compromisers). Fragile.',
      aggression: 3,
      target: 'Ceasefire — stand-down from Iran strikes. Lebanon still active.',
      iranResponse: 'Ceasefire accepted. Attacks continued briefly post-announcement. Gas facility ablaze in Abu Dhabi. Hardliners protesting in Tehran. Hormuz being slowly opened.',
      prediction: null
    },
    {
      day: 41, date: 'Apr 9', dateLabel: 'Day 41 — Apr 9, 2026 — CEASEFIRE HOLDS',
      statement: 'Netanyahu holding on Lebanon. IDF standing down from Iran. Waiting for Islamabad talks Apr 10. Israeli security cabinet concerned about unresolved issues.',
      context: 'Ceasefire holding day 1. Brent $95 (-13%). VIX 21.23 war-low. Islamabad talks tomorrow. Trump called 10-point plan fraudulent (mixed signals). Fragile. Iran hardliners protesting. HL $1.53B volume ATH.',
      aggression: 3,
      target: 'Lebanon operations continuing. Iran: ceasefire.',
      iranResponse: '5/day residual. Ceasefire nominally holding. Hormuz 8 transits. Islamabad talks Apr 10 confirmed by Iran, not yet by US.',
      prediction: null
    },
    {
      day: 42, date: 'Apr 10', dateLabel: 'Day 42 — Apr 10, 2026 — ISLAMABAD TALKS',
      statement: 'Netanyahu intensified Beirut strikes even as ceasefire held on Iran front. Rejected Lebanon inclusion. Israel extracting maximum strategic gain before talks constrain options.',
      context: 'Islamabad talks underway. Ceasefire holding (attacks zero Apr 8). But Netanyahu struck Beirut (112 killed) triggering Iran to briefly close Hormuz. Lebanon is the Achilles heel. Witkoff leading US, not Rubio.',
      aggression: 6,
      target: 'Lebanon operations accelerating — Iran ceasefire, not Lebanon ceasefire. Hezbollah targets.',
      iranResponse: 'Attacks at zero on GCC front. Briefly closed Hormuz after Beirut strikes. Araghchi heading to Islamabad. Enrichment won\'t be curtailed (contradicts Trump).',
      prediction: null
    }
  ];

  var syncData = [
    { day: 1,  dayLabel: 'D1',  bibiAgg: 9, trumpAgg: 9, goalAlign: 95, timingSync: 'Perfect', sync: 95, note: 'Joint launch' },
    { day: 2,  dayLabel: 'D2',  bibiAgg: 6, trumpAgg: 7, goalAlign: 90, timingSync: 'High',    sync: 82, note: 'Both reassuring' },
    { day: 3,  dayLabel: 'D3',  bibiAgg: 7, trumpAgg: 8, goalAlign: 85, timingSync: 'High',    sync: 80, note: 'Rubio reveal' },
    { day: 5,  dayLabel: 'D5',  bibiAgg: 8, trumpAgg: 8, goalAlign: 85, timingSync: 'High',    sync: 84, note: 'Peak oil spike' },
    { day: 7,  dayLabel: 'D7',  bibiAgg: 8, trumpAgg: 6, goalAlign: 70, timingSync: 'Medium',  sync: 68, note: 'Trump celebrates Pezeshkian "surrender"' },
    { day: 9,  dayLabel: 'D9',  bibiAgg: 2, trumpAgg: 4, goalAlign: 55, timingSync: 'Low',     sync: 42, note: 'Trump contradicts himself 5x (CNN)' },
    { day: 10, dayLabel: 'D10', bibiAgg: 5, trumpAgg: 5, goalAlign: 60, timingSync: 'Medium',  sync: 55, note: 'Both moderate' },
    { day: 11, dayLabel: 'D11', bibiAgg: 7, trumpAgg: 3, goalAlign: 45, timingSync: 'Low',     sync: 38, note: 'NYT: "Bend vs Break" divergence' },
    { day: 13, dayLabel: 'D13', bibiAgg: 9, trumpAgg: 4, goalAlign: 40, timingSync: 'Low',     sync: 36, note: 'Bibi escalates, Trump wants exit' },
    { day: 14, dayLabel: 'D14', bibiAgg: 9, trumpAgg: 5, goalAlign: 45, timingSync: 'Medium',  sync: 44, note: 'Press conference, Trump patience thin' },
    { day: 15, dayLabel: 'D15', bibiAgg: 8, trumpAgg: 5, goalAlign: 42, timingSync: 'Low',     sync: 40, note: 'Bibi "deranged scumbags", Trump wants exit' },
    { day: 16, dayLabel: 'D16', bibiAgg: 7, trumpAgg: 4, goalAlign: 40, timingSync: 'Low',     sync: 38, note: 'Isfahan strike, Trump focused on oil' },
    { day: 17, dayLabel: 'D17', bibiAgg: 7, trumpAgg: 5, goalAlign: 42, timingSync: 'Low',     sync: 40, note: 'Katz channeling, Chabahar strikes' },
    { day: 18, dayLabel: 'D18', bibiAgg: 9, trumpAgg: 5, goalAlign: 38, timingSync: 'Low',     sync: 41, note: 'Larijani killed + Lebanon ground ops while Trump seeks Hormuz reopening' },
    { day: 19, dayLabel: 'D19', bibiAgg: 10, trumpAgg: 5, goalAlign: 35, timingSync: 'Low',    sync: 35, note: 'South Pars strike — energy war opened without US approval' },
    { day: 20, dayLabel: 'D20', bibiAgg: 7,  trumpAgg: 4, goalAlign: 40, timingSync: 'Medium', sync: 42, note: 'Bibi halts South Pars at Trump request — rare concession' },
    { day: 21, dayLabel: 'D21', bibiAgg: 9,  trumpAgg: 4, goalAlign: 30, timingSync: 'Low',    sync: 32, note: 'Natanz struck on Nowruz — Iran retaliates on Dimona' },
    { day: 22, dayLabel: 'D22', bibiAgg: 8,  trumpAgg: 8, goalAlign: 55, timingSync: 'Medium', sync: 55, note: 'Dimona rallied both leaders briefly — Trump ultimatum' },
    { day: 23, dayLabel: 'D23', bibiAgg: 8,  trumpAgg: 3, goalAlign: 25, timingSync: 'Low',    sync: 28, note: 'Trump extends deadline. Israel frustrated — DM: set Iran back decades' },
    { day: 24, dayLabel: 'D24', bibiAgg: 7,  trumpAgg: 3, goalAlign: 22, timingSync: 'Low',    sync: 25, note: 'Israeli analysts confused by Trump talks pivot. IDF acts independently.' },
    { day: 25, dayLabel: 'D25', bibiAgg: 8,  trumpAgg: 3, goalAlign: 20, timingSync: 'Low',    sync: 22, note: 'Bibi: more weeks of fighting. Trump: deal. Widest divergence of war.' },
    { day: 26, dayLabel: 'D26', bibiAgg: 8,  trumpAgg: 3, goalAlign: 18, timingSync: 'Low',    sync: 20, note: 'IDF strikes Isfahan despite ceasefire plan. US-Israel sync at all-time low.' },
    { day: 27, dayLabel: 'D27', bibiAgg: 9,  trumpAgg: 4, goalAlign: 20, timingSync: 'Low',    sync: 22, note: 'Iran rejects plan. Both sides recalibrate. 82nd Airborne deployment aligns interests briefly.' },
    { day: 28, dayLabel: 'D28', bibiAgg: 10, trumpAgg: 3, goalAlign: 15, timingSync: 'Low',    sync: 18, note: 'Tangsiri killed — Bibi peak aggression. Trump extends to Apr 6, Pakistan talks. Maximum divergence.' },
    { day: 29, dayLabel: 'D29', bibiAgg: 8,  trumpAgg: 6, goalAlign: 30, timingSync: 'Medium', sync: 32, note: 'Houthis enter war. Trump reverses to hawkish. Prince Sultan attack re-aligns US-Israel briefly.' },
    { day: 30, dayLabel: 'D30', bibiAgg: 8,  trumpAgg: 5, goalAlign: 28, timingSync: 'Low',    sync: 28, note: 'Pakistan summit — diplomacy diverges from Israeli strikes on nuclear sites. Trump pushes Abraham Accords while Bibi escalates Lebanon.' },
    { day: 31, dayLabel: 'D31', bibiAgg: 7,  trumpAgg: 5, goalAlign: 30, timingSync: 'Medium', sync: 30, note: 'SOF deployed. Brent crashes -4.15%. Markets pricing diplomacy. Bibi quieter. GOP pushback constrains ground war.' },
    { day: 32, dayLabel: 'D32', bibiAgg: 6,  trumpAgg: 7, goalAlign: 35, timingSync: 'Medium', sync: 35, note: 'Trump Kharg threat re-aligns with Israeli maximalism. Vance says objectives met. Israel completing strikes. Markets ignore bluster.' },
    { day: 33, dayLabel: 'D33', bibiAgg: 5,  trumpAgg: 4, goalAlign: 45, timingSync: 'Medium', sync: 42, note: 'Markets price peace. Both leaders winding down. Trump deal-mode. Israel completing strikes. Sync recovering from all-time lows.' },
    { day: 34, dayLabel: 'D34', bibiAgg: 5,  trumpAgg: 5, goalAlign: 40, timingSync: 'Medium', sync: 38, note: 'Araghchi cold shower. Markets reverse. Both sides recalibrating. Pakistan brings China in. Sync dips slightly on reality check.' },
    { day: 35, dayLabel: 'D35', bibiAgg: 4,  trumpAgg: 3, goalAlign: 50, timingSync: 'High',   sync: 48, note: 'Exit mode. Trump 2-3 weeks. Rubio finish line. Both sides winding down. Highest sync since D1 week.' },
    { day: 36, dayLabel: 'D36', bibiAgg: 7,  trumpAgg: 5, goalAlign: 40, timingSync: 'Medium', sync: 38, note: 'Tri-front attack re-escalates. Bibi wants energy strikes. Trump hardening with 2-3 week hard push. Sync dips on energy strike divergence.' },
    { day: 37, dayLabel: 'D37', bibiAgg: 7,  trumpAgg: 6, goalAlign: 42, timingSync: 'Medium', sync: 40, note: 'Eve of deadline. Both aligned on maximum pressure. Ground entry confirmed (PM 100%). Sync stable as both prepare for Monday.' },
    { day: 38, dayLabel: 'D38', bibiAgg: 8,  trumpAgg: 5, goalAlign: 38, timingSync: 'Medium', sync: 35, note: 'Deadline day. Israel strikes South Pars. Trump extends again. Bibi wants energy escalation, Trump prefers 45-day deal framework.' },
    { day: 39, dayLabel: 'D39', bibiAgg: 9,  trumpAgg: 8, goalAlign: 55, timingSync: 'High',   sync: 52, note: 'Power Day. Both at maximum. Kharg struck. Civilization rhetoric. Highest alignment since D4 — both want Iran crushed by midnight.' },
    { day: 40, dayLabel: 'D40', bibiAgg: 3,  trumpAgg: 4, goalAlign: 40, timingSync: 'Medium', sync: 35, note: 'Ceasefire. Both stand down from Iran. Bibi: Lebanon not included. Trump claims victory. Both diverge on what ceasefire means.' },
    { day: 41, dayLabel: 'D41', bibiAgg: 3,  trumpAgg: 4, goalAlign: 38, timingSync: 'Medium', sync: 32, note: 'Ceasefire holds day 1. Bibi uneasy. Trump mixed signals (called plan fraudulent). Islamabad talks tomorrow.' },
    { day: 42, dayLabel: 'D42', bibiAgg: 6,  trumpAgg: 4, goalAlign: 32, timingSync: 'Low',    sync: 28, note: 'Islamabad talks day. Bibi strikes Beirut during ceasefire — lowest sync point since ceasefire. Trump and Bibi diverging on Lebanon scope.' }
  ];

  var predictionMatrix = [
    { signal: 'Threatens leadership',       response: 'Missile barrage within 24h',                    hitRate: 100 },
    { signal: 'Addresses Iranian people',    response: 'IRGC hawks escalate, domestic pushback',        hitRate: 85 },
    { signal: 'Claims victory',              response: 'Iran demonstrates capability to contradict',    hitRate: 75 },
    { signal: 'Strategic silence',           response: 'De-escalation window',                          hitRate: 60 },
    { signal: 'Regime change rhetoric',      response: 'Iran declares "no red lines"',                  hitRate: 90 }
  ];

  var probabilityShifts = [
    { name: 'Ceasefire by Mar 31',    oldPct: 26, newPct: 22, direction: 'down', color: 'green' },
    { name: 'Regime falls Jun 30',    oldPct: 22, newPct: 28, direction: 'up',   color: 'red' },
    { name: 'US forces enter Iran',   oldPct: 29, newPct: 25, direction: 'down', color: 'amber' },
    { name: 'Crude $120 EOM',         oldPct: 37, newPct: 40, direction: 'up',   color: 'red' }
  ];

  /* ── HELPERS ── */

  function getChartColors() {
    var style = getComputedStyle(document.documentElement);
    return {
      red:       style.getPropertyValue('--color-red').trim(),
      amber:     style.getPropertyValue('--color-amber').trim(),
      green:     style.getPropertyValue('--color-green').trim(),
      primary:   style.getPropertyValue('--color-primary').trim(),
      text:      style.getPropertyValue('--color-text').trim(),
      textMuted: style.getPropertyValue('--color-text-muted').trim(),
      textFaint: style.getPropertyValue('--color-text-faint').trim(),
      border:    style.getPropertyValue('--color-border').trim(),
      surface:   style.getPropertyValue('--color-surface').trim(),
      surface2:  style.getPropertyValue('--color-surface-2').trim()
    };
  }

  function aggClass(score) {
    if (score >= 8) return 'agg-high';
    if (score >= 5) return 'agg-med';
    return 'agg-low';
  }

  function aggColorClass(score) {
    if (score >= 8) return 'bibi-aggression-high';
    if (score >= 5) return 'bibi-aggression-med';
    return 'bibi-aggression-low';
  }

  function syncZoneClass(score) {
    if (score >= 80) return 'sync-lockstep';
    if (score >= 60) return 'sync-aligned';
    if (score >= 40) return 'sync-diverging';
    return 'sync-decoupled';
  }

  function syncZoneLabel(score) {
    if (score >= 80) return 'LOCKSTEP';
    if (score >= 60) return 'ALIGNED';
    if (score >= 40) return 'DIVERGING';
    return 'DECOUPLED';
  }

  /* ── RENDER PROBABILITY SHIFT CARDS ── */

  function renderProbShifts() {
    var container = document.getElementById('bibiProbShifts');
    if (!container) return;

    var html = '';
    probabilityShifts.forEach(function(item) {
      var shiftClass = item.direction === 'up' ? 'shift-up' : 'shift-down';
      var arrow = item.direction === 'up' ? '↑' : '↓';
      var barColor = item.color === 'red' ? 'var(--color-red)' : item.color === 'green' ? 'var(--color-green)' : 'var(--color-amber)';

      html += '<div class="prob-shift-card">' +
        '<div class="prob-shift-name">' + item.name + '</div>' +
        '<div class="prob-shift-values">' +
          '<span class="prob-shift-old">' + item.oldPct + '%</span>' +
          '<span class="prob-shift-arrow">→</span>' +
          '<span class="prob-shift-new ' + shiftClass + '">' + item.newPct + '% ' + arrow + '</span>' +
        '</div>' +
        '<div class="prob-shift-bar">' +
          '<div class="prob-shift-fill" style="width:' + item.newPct + '%;background:' + barColor + ';"></div>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  /* ── AGGRESSION TIMELINE CHART ── */

  function initAggressionChart() {
    var ctx = document.getElementById('bibiAggressionChart');
    if (!ctx) return;
    var colors = getChartColors();

    if (window.bibiAggressionChartInstance) {
      window.bibiAggressionChartInstance.destroy();
    }

    // Full day labels from D1 to D14
    var labels = [];
    var data = [];
    var dayMap = {};
    rhetoricTimeline.forEach(function(e) { dayMap[e.day] = e.aggression; });
    for (var d = 1; d <= 14; d++) {
      labels.push('D' + d);
      data.push(dayMap[d] || null);
    }

    window.bibiAggressionChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Aggression Score',
          data: data,
          borderColor: colors.red,
          backgroundColor: colors.red + '20',
          fill: true,
          tension: 0.3,
          pointRadius: function(context) {
            return context.raw !== null ? 5 : 0;
          },
          pointBackgroundColor: colors.red,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          spanGaps: true,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              pezeshkian: {
                type: 'line',
                xMin: 6, xMax: 6,
                borderColor: colors.amber + '80',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: 'Pezeshkian apology',
                  position: 'start',
                  font: { size: 9, family: "'JetBrains Mono', monospace" },
                  color: colors.amber,
                  backgroundColor: 'transparent',
                  padding: 2
                }
              },
              trumpNothing: {
                type: 'line',
                xMin: 10, xMax: 10,
                borderColor: colors.primary + '80',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: 'Trump "nothing left"',
                  position: 'start',
                  font: { size: 9, family: "'JetBrains Mono', monospace" },
                  color: colors.primary,
                  backgroundColor: 'transparent',
                  padding: 2
                }
              },
              pressConf: {
                type: 'line',
                xMin: 13, xMax: 13,
                borderColor: colors.red + '80',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: 'Press conference',
                  position: 'start',
                  font: { size: 9, family: "'JetBrains Mono', monospace" },
                  color: colors.red,
                  backgroundColor: 'transparent',
                  padding: 2
                }
              }
            }
          },
          tooltip: {
            backgroundColor: colors.surface,
            titleColor: colors.text,
            bodyColor: colors.textMuted,
            borderColor: colors.border,
            borderWidth: 1,
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'Inter', sans-serif", size: 11 },
            callbacks: {
              label: function(ctx) {
                return 'Aggression: ' + ctx.parsed.y + '/10';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: colors.textMuted }
          },
          y: {
            min: 0, max: 10,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              color: colors.textMuted,
              stepSize: 2
            },
            title: {
              display: true,
              text: 'Aggression (1-10)',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }

  /* ── SYNC INDEX CHART (centerpiece) ── */

  function initSyncChart() {
    var ctx = document.getElementById('bibiSyncChart');
    if (!ctx) return;
    var colors = getChartColors();

    if (window.bibiSyncChartInstance) {
      window.bibiSyncChartInstance.destroy();
    }

    var labels = syncData.map(function(d) { return d.dayLabel; });
    var bibiAggData = syncData.map(function(d) { return d.bibiAgg; });
    var trumpAggData = syncData.map(function(d) { return d.trumpAgg; });
    var syncScores = syncData.map(function(d) { return d.sync; });

    window.bibiSyncChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'SYNC Score',
            data: syncScores,
            borderColor: colors.amber,
            backgroundColor: colors.amber + '18',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: function(context) {
              var val = context.raw;
              if (val >= 80) return colors.green;
              if (val >= 60) return colors.primary;
              if (val >= 40) return colors.amber;
              return colors.red;
            },
            pointBorderColor: colors.surface,
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            yAxisID: 'ySync',
            order: 0
          },
          {
            label: 'Bibi Aggression',
            data: bibiAggData,
            borderColor: colors.red,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 3,
            pointBackgroundColor: colors.red,
            pointBorderWidth: 0,
            tension: 0.3,
            yAxisID: 'yAgg',
            order: 1
          },
          {
            label: 'Trump Aggression',
            data: trumpAggData,
            borderColor: colors.primary,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 3,
            pointBackgroundColor: colors.primary,
            pointBorderWidth: 0,
            tension: 0.3,
            yAxisID: 'yAgg',
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              color: colors.textMuted
            }
          },
          annotation: {
            annotations: {
              lockstep: {
                type: 'box',
                yMin: 80, yMax: 100,
                yScaleID: 'ySync',
                backgroundColor: 'rgba(34, 197, 94, 0.06)',
                borderWidth: 0,
                label: {
                  display: true,
                  content: 'LOCKSTEP',
                  position: { x: 'end', y: 'center' },
                  font: { size: 8, family: "'JetBrains Mono', monospace", weight: 700 },
                  color: colors.green + '60',
                  backgroundColor: 'transparent'
                }
              },
              aligned: {
                type: 'box',
                yMin: 60, yMax: 80,
                yScaleID: 'ySync',
                backgroundColor: 'rgba(96, 165, 250, 0.05)',
                borderWidth: 0,
                label: {
                  display: true,
                  content: 'ALIGNED',
                  position: { x: 'end', y: 'center' },
                  font: { size: 8, family: "'JetBrains Mono', monospace", weight: 700 },
                  color: colors.primary + '60',
                  backgroundColor: 'transparent'
                }
              },
              diverging: {
                type: 'box',
                yMin: 40, yMax: 60,
                yScaleID: 'ySync',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderWidth: 0,
                label: {
                  display: true,
                  content: 'DIVERGING',
                  position: { x: 'end', y: 'center' },
                  font: { size: 8, family: "'JetBrains Mono', monospace", weight: 700 },
                  color: colors.amber + '60',
                  backgroundColor: 'transparent'
                }
              },
              decoupled: {
                type: 'box',
                yMin: 0, yMax: 40,
                yScaleID: 'ySync',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderWidth: 0,
                label: {
                  display: true,
                  content: 'DECOUPLED',
                  position: { x: 'end', y: 'center' },
                  font: { size: 8, family: "'JetBrains Mono', monospace", weight: 700 },
                  color: colors.red + '60',
                  backgroundColor: 'transparent'
                }
              }
            }
          },
          tooltip: {
            backgroundColor: colors.surface,
            titleColor: colors.text,
            bodyColor: colors.textMuted,
            borderColor: colors.border,
            borderWidth: 1,
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'Inter', sans-serif", size: 11 },
            callbacks: {
              afterBody: function(tooltipItems) {
                var idx = tooltipItems[0].dataIndex;
                return syncData[idx].note;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: colors.textMuted }
          },
          ySync: {
            type: 'linear',
            position: 'left',
            min: 0, max: 100,
            grid: { color: colors.border, lineWidth: 0.5 },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              color: colors.textMuted,
              stepSize: 20
            },
            title: {
              display: true,
              text: 'SYNC Score (0-100)',
              font: { size: 10 },
              color: colors.textFaint
            }
          },
          yAgg: {
            type: 'linear',
            position: 'right',
            min: 0, max: 10,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              color: colors.textMuted,
              stepSize: 2
            },
            title: {
              display: true,
              text: 'Aggression (1-10)',
              font: { size: 10 },
              color: colors.textFaint
            }
          }
        }
      }
    });
  }

  /* ── INIT ON TAB SWITCH ── */

  var chartsInitialized = false;

  function initBibiWatch() {
    renderProbShifts();
    initAggressionChart();
    initSyncChart();
    chartsInitialized = true;
  }

  // Listen for tab switch via MutationObserver on the panel
  var bibiPanel = document.querySelector('[data-panel="bibi"]');
  if (bibiPanel) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class' && bibiPanel.classList.contains('active')) {
          // Small delay to allow layout to settle
          setTimeout(function() {
            initBibiWatch();
          }, 80);
        }
      });
    });
    observer.observe(bibiPanel, { attributes: true });

    // Also init if already active
    if (bibiPanel.classList.contains('active')) {
      initBibiWatch();
    }
  }

  // Re-init charts on theme change
  var themeObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'data-theme' && chartsInitialized) {
        setTimeout(function() {
          if (bibiPanel && bibiPanel.classList.contains('active')) {
            initBibiWatch();
          } else {
            chartsInitialized = false; // will re-init on next tab switch
          }
        }, 100);
      }
    });
  });
  themeObserver.observe(document.documentElement, { attributes: true });

})();
