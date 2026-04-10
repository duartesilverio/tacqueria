// ===== STAT MODEL CONSENSUS — Standalone (no DOM needed) =====
// Runs on page load to feed regime flag before Stat Models tab is opened.
function computeStatConsensusOnly() {
  var rawBrent = DASHBOARD_DATA.chartData.brent;
  var rawVIX   = DASHBOARD_DATA.chartData.vix;
  var rawHYG   = DASHBOARD_DATA.chartData.hyg;
  var rawSP    = DASHBOARD_DATA.chartData.sp500;
  var rawTACO  = DASHBOARD_DATA.chartData.taco;
  var N = rawTACO.length;

  // --- Math utilities (duplicated from initTacoV2 to avoid dependency) ---
  function _gaussElim(A, b) {
    var n = b.length;
    var M = A.map(function(row,i) { return row.concat([b[i]]); });
    for (var c=0;c<n;c++) {
      var mx=c;
      for (var r=c+1;r<n;r++) if (Math.abs(M[r][c])>Math.abs(M[mx][c])) mx=r;
      var tmp=M[c];M[c]=M[mx];M[mx]=tmp;
      var pv=M[c][c]; if (Math.abs(pv)<1e-12) continue;
      for (var r2=0;r2<n;r2++) {
        if (r2===c) continue;
        var f=M[r2][c]/pv;
        for (var k=c;k<=n;k++) M[r2][k]-=f*M[c][k];
      }
      for (var k2=c;k2<=n;k2++) M[c][k2]/=pv;
    }
    return M.map(function(row){return row[n];});
  }
  function _ols(Xm, Y) {
    var nr=Y.length, nc=Xm[0].length;
    var XtX=[], XtY=[];
    for (var i=0;i<nc;i++) {
      XtX[i]=[];
      for (var j=0;j<nc;j++) {
        var s=0; for(var t=0;t<nr;t++) s+=Xm[t][i]*Xm[t][j]; XtX[i][j]=s;
      }
      var sy=0; for(var t2=0;t2<nr;t2++) sy+=Xm[t2][i]*Y[t2]; XtY[i]=sy;
    }
    var beta=_gaussElim(XtX,XtY);
    var yhat=Xm.map(function(r){var s=0;for(var i2=0;i2<nc;i2++)s+=r[i2]*beta[i2];return s;});
    var rss=0;for(var t3=0;t3<nr;t3++)rss+=(Y[t3]-yhat[t3])*(Y[t3]-yhat[t3]);
    var ym=0;for(var t4=0;t4<nr;t4++)ym+=Y[t4];ym/=nr;
    var tss=0;for(var t5=0;t5<nr;t5++)tss+=(Y[t5]-ym)*(Y[t5]-ym);
    return {beta:beta, r2:Math.max(0,1-rss/tss)};
  }
  function _std(arr) {
    var m=0;for(var i=0;i<arr.length;i++)m+=arr[i];m/=arr.length;
    var s2=0;for(var i2=0;i2<arr.length;i2++)s2+=(arr[i2]-m)*(arr[i2]-m);s2/=arr.length;
    var s=Math.sqrt(s2)||1;
    return {z:arr.map(function(v){return(v-m)/s;}),mean:m,std:s};
  }
  function _fPval(F, df2) {
    var idx=Math.min(Math.max(df2-1,0),9);
    var c10=[39.86,8.53,5.54,4.54,4.06,3.78,3.59,3.46,3.36,3.29];
    var c05=[161.4,18.51,10.13,7.71,6.61,5.99,5.59,5.32,5.12,4.96];
    var c01=[4052,98.5,34.12,21.2,16.26,13.75,12.25,11.26,10.56,10.04];
    if (F<=0) return {label:'>0.25'};
    if (F<c10[idx]) return {label:'>0.10'};
    if (F<c05[idx]) return {label:'0.05–0.10 *'};
    if (F<c01[idx]) return {label:'0.01–0.05 **'};
    return {label:'<0.01 ***'};
  }
  function _granger(y, x) {
    var nobs=y.length-1;
    var Y=y.slice(1);
    var Xr=[],Xu=[];
    for(var t=0;t<nobs;t++){Xr.push([1,y[t]]);Xu.push([1,y[t],x[t]]);}
    var r=_ols(Xr,Y), u=_ols(Xu,Y);
    var df2=nobs-3;
    var F=df2>0?((r.r2<u.r2?1:0)>0?((1-u.r2)>0?((u.r2-r.r2)/1)/((1-u.r2)/(df2)):0):0):0;
    // Simpler: use RSS-based F
    return {pv:_fPval(F,df2)};
  }

  // --- 1. Granger ---
  var signals = [];
  var verdicts = [];
  var mkts = [{name:'Brent',data:rawBrent},{name:'VIX',data:rawVIX},{name:'HYG',data:rawHYG},{name:'S&P',data:rawSP}];
  mkts.forEach(function(mk) {
    var nobs=mk.data.length-1, Y=mk.data.slice(1);
    var Xr=[],Xu=[];
    for(var t=0;t<nobs;t++){Xr.push([1,mk.data[t]]);Xu.push([1,mk.data[t],rawTACO[t]]);}
    var rr=_ols(Xr,Y), ur=_ols(Xu,Y);
    var df2f=nobs-3;
    var rss_r=0,rss_u=0;
    for(var t2=0;t2<nobs;t2++){var yr=0,yu=0;for(var j=0;j<Xr[0].length;j++)yr+=Xr[t2][j]*rr.beta[j];for(var j2=0;j2<Xu[0].length;j2++)yu+=Xu[t2][j2]*ur.beta[j2];rss_r+=(Y[t2]-yr)*(Y[t2]-yr);rss_u+=(Y[t2]-yu)*(Y[t2]-yu);}
    var Ff=df2f>0?((rss_r-rss_u)/1)/(rss_u/df2f):0;
    var fwd={pv:_fPval(Math.max(0,Ff),df2f)};
    // Reverse
    var Yr=rawTACO.slice(1), nobs2=Yr.length;
    var Xr2=[],Xu2=[];
    for(var t3=0;t3<nobs2;t3++){Xr2.push([1,rawTACO[t3]]);Xu2.push([1,rawTACO[t3],mk.data[t3]]);}
    var rr2=_ols(Xr2,Yr), ur2=_ols(Xu2,Yr);
    var rss_r2=0,rss_u2=0;
    for(var t4=0;t4<nobs2;t4++){var yr2=0,yu2=0;for(var j3=0;j3<Xr2[0].length;j3++)yr2+=Xr2[t4][j3]*rr2.beta[j3];for(var j4=0;j4<Xu2[0].length;j4++)yu2+=Xu2[t4][j4]*ur2.beta[j4];rss_r2+=(Yr[t4]-yr2)*(Yr[t4]-yr2);rss_u2+=(Yr[t4]-yu2)*(Yr[t4]-yu2);}
    var Fr=df2f>0?((rss_r2-rss_u2)/1)/(rss_u2/df2f):0;
    var rev={pv:_fPval(Math.max(0,Fr),df2f)};
    verdicts.push({fwd:fwd,rev:rev});
  });
  if (N >= 30) {
    var fwdSig=0,revSig=0;
    verdicts.forEach(function(v){if(v.fwd.pv.label.indexOf('*')>=0)fwdSig++;if(v.rev.pv.label.indexOf('*')>=0)revSig++;});
    var netG=fwdSig-revSig;
    signals.push({model:'Granger',signal:Math.max(0,Math.min(100,50+netG*12.5)),weight:0.10,ready:true,detail:fwdSig+' fwd, '+revSig+' rev → net '+(netG>=0?'+':'')+netG});
  } else { signals.push({model:'Granger',signal:50,weight:0,ready:false,detail:'n<30'}); }

  // --- 2. VAR ---
  var nvar=N-1;
  var Xvar=[];for(var t=0;t<nvar;t++)Xvar.push([1,rawBrent[t],rawTACO[t]]);
  var varB=_ols(Xvar,rawBrent.slice(1));
  if (N >= 30) {
    var coef=varB.beta[2];
    signals.push({model:'VAR(1)',signal:Math.max(0,Math.min(100,50+coef*30)),weight:0.10,ready:true,detail:'coef:'+coef.toFixed(3)});
  } else { signals.push({model:'VAR(1)',signal:50,weight:0,ready:false,detail:'n<30'}); }

  // --- 3. GARCH vol trend ---
  var logRet=[];for(var i=1;i<N;i++)logRet.push(Math.log(rawBrent[i]/rawBrent[i-1]));
  var sv=0;for(var i2=0;i2<logRet.length;i2++)sv+=logRet[i2]*logRet[i2];sv/=logRet.length;
  var alpha_g=0.25,beta_g=0.65,omega_g=sv*(1-alpha_g-beta_g);
  var h_g=[sv];
  for(var t2=1;t2<logRet.length;t2++)h_g.push(omega_g+alpha_g*logRet[t2-1]*logRet[t2-1]+beta_g*h_g[t2-1]);
  var condVol=h_g.map(function(h){return Math.sqrt(h*252)*100;});
  if (condVol.length >= 10 && N >= 20) {
    var curV=condVol[condVol.length-1],prevV=condVol[Math.max(0,condVol.length-6)];
    var vd=curV-prevV;
    signals.push({model:'GARCH',signal:Math.max(0,Math.min(100,50-vd*2.5)),weight:0.08,ready:true,detail:'vol:'+curV.toFixed(1)+'% Δ'+(vd>=0?'+':'')+vd.toFixed(1)+'pp'});
  } else { signals.push({model:'GARCH',signal:50,weight:0,ready:false,detail:'n<20'}); }

  // --- 4. Bayesian ---
  var priorMu=45;
  var obsNoise=8,obsSig=obsNoise/rawBrent[0]*100,obsVar=obsSig*obsSig,priorVar=40*40;
  var brentPct=rawBrent.map(function(v){return(v/rawBrent[0]-1)*100;});
  var sumX=0;for(var i3=0;i3<brentPct.length;i3++)sumX+=brentPct[i3];
  var postPrec=1/priorVar+brentPct.length/obsVar;
  var postMu=(priorMu/priorVar+sumX/obsVar)/postPrec;
  if (N >= 20) {
    var gap=postMu-priorMu;
    signals.push({model:'Bayesian',signal:Math.max(0,Math.min(100,50-gap*2)),weight:0.10,ready:true,detail:'post:+'+postMu.toFixed(1)+'% gap:'+(gap>=0?'+':'')+gap.toFixed(1)});
  } else { signals.push({model:'Bayesian',signal:50,weight:0,ready:false,detail:'n<20'}); }

  // --- 5. Ridge ---
  var nRidge=N-1;
  var bDelta=[];for(var i4=1;i4<N;i4++)bDelta.push(rawBrent[i4]-rawBrent[i4-1]);
  var preds=[rawTACO,rawVIX,rawHYG,rawSP.map(function(v){return v/50;}),rawBrent].map(function(a){return a.slice(0,nRidge);});
  var stdP=preds.map(function(p){return _std(p).z;});
  var stdY=_std(bDelta);
  var k=5;
  var Xm=[];for(var t3=0;t3<nRidge;t3++){var row=[];for(var j=0;j<k;j++)row.push(stdP[j][t3]);Xm.push(row);}
  var XtX0=[],XtY0=[];
  for(var ii=0;ii<k;ii++){XtX0[ii]=[];for(var jj=0;jj<k;jj++){var ss=0;for(var tt=0;tt<nRidge;tt++)ss+=Xm[tt][ii]*Xm[tt][jj];XtX0[ii][jj]=ss;}var sy2=0;for(var tt2=0;tt2<nRidge;tt2++)sy2+=Xm[tt2][ii]*stdY.z[tt2];XtY0[ii]=sy2;}
  // Find best lambda
  var bestLam=0,bestMSE=Infinity;
  for(var li=0;li<50;li++){
    var lam=li*0.6;
    var M=XtX0.map(function(r,i5){return r.map(function(v,j5){return v+(i5===j5?lam:0);});});
    var beta=_gaussElim(M,XtY0);
    // simple MSE
    var mse=0;
    for(var tt3=0;tt3<nRidge;tt3++){var pred=0;for(var j6=0;j6<k;j6++)pred+=Xm[tt3][j6]*beta[j6];mse+=(stdY.z[tt3]-pred)*(stdY.z[tt3]-pred);}
    mse/=nRidge;
    if(mse<bestMSE){bestMSE=mse;bestLam=lam;}
  }
  var Mopt=XtX0.map(function(r,i6){return r.map(function(v,j7){return v+(i6===j7?bestLam:0);});});
  var bestB=_gaussElim(Mopt,XtY0);
  if (N >= 30) {
    var tacoCoef=bestB[0]; // TACO is first predictor
    var totAbs=0;for(var j8=0;j8<k;j8++)totAbs+=Math.abs(bestB[j8]);
    var imp=totAbs>0?Math.abs(tacoCoef)/totAbs:0;
    signals.push({model:'Ridge',signal:Math.max(0,Math.min(100,50+tacoCoef*50)),weight:0.07,ready:true,detail:'coef:'+(tacoCoef>=0?'+':'')+tacoCoef.toFixed(3)+' imp:'+Math.round(imp*100)+'%'});
  } else { signals.push({model:'Ridge',signal:50,weight:0,ready:false,detail:'n<30'}); }

  // --- 6. Regime ---
  var regSplit=Math.max(5,Math.floor(N/3));
  var r2idx=[];for(var i7=regSplit;i7<N;i7++)r2idx.push(i7);
  var Xr2m=r2idx.map(function(i8){return[1,rawTACO[i8]];});
  var Yr2m=r2idx.map(function(i9){return rawBrent[i9];});
  var reg2=_ols(Xr2m,Yr2m);
  if (N >= 40) {
    signals.push({model:'Regime',signal:Math.max(0,Math.min(100,reg2.r2*100)),weight:0.05,ready:true,detail:'R²:'+Math.round(reg2.r2*100)+'%'});
  } else { signals.push({model:'Regime',signal:50,weight:0,ready:false,detail:'n<40'}); }

  // --- 7. PREDICTION MARKETS: Ceasefire probability + volume signal ---
  // Higher ceasefire prob = de-escalation. Volume concentration on ceasefire = conviction.
  var pm = DASHBOARD_DATA.predictionMarkets;
  var pmReady = pm && pm.signalCards && pm.signalCards.length >= 2;
  if (pmReady) {
    // Extract ceasefire probability from signal cards
    var ceasefireCard = null;
    var groundWarCard = null;
    for (var pi = 0; pi < pm.signalCards.length; pi++) {
      var card = pm.signalCards[pi];
      var label = (card.contract || '').toLowerCase();
      if (label.indexOf('ceasefire') >= 0 && !ceasefireCard) ceasefireCard = card;
      if ((label.indexOf('enter') >= 0 || label.indexOf('ground') >= 0 || label.indexOf('invade') >= 0) && !groundWarCard) groundWarCard = card;
    }
    var ceasefireProb = ceasefireCard ? parseFloat(ceasefireCard.rawPrice) : 50;
    var groundWarProb = groundWarCard ? parseFloat(groundWarCard.rawPrice) : 50;
    if (isNaN(ceasefireProb)) ceasefireProb = 50;
    if (isNaN(groundWarProb)) groundWarProb = 50;
    
    // PM signal: ceasefire high + ground war low = de-escalation
    // Scale: ceasefire 0-100 maps directly (higher = more de-escalation)
    // Adjust for ground war: if ground war prob high, pull signal down
    var pmSignal = Math.max(0, Math.min(100, ceasefireProb - (groundWarProb - 50) * 0.3));
    
    // Volume intelligence: extract total volume across top contracts
    var totalVol = 0;
    for (var vi = 0; vi < pm.signalCards.length; vi++) {
      var volStr = (pm.signalCards[vi].volume || '').replace(/[^0-9.]/g, '');
      totalVol += parseFloat(volStr) || 0;
    }
    var volNote = totalVol > 100 ? '$' + totalVol.toFixed(0) + 'M total' : '$' + totalVol.toFixed(1) + 'M';
    
    signals.push({model:'PredMkt', signal:Math.round(pmSignal), weight:0.50, ready:true,
      detail:'Ceasefire:' + ceasefireProb + '% Ground:' + groundWarProb + '% Vol:' + volNote});
  } else {
    signals.push({model:'PredMkt', signal:50, weight:0, ready:false, detail:'No PM data'});
  }

  // --- Composite ---
  var readySignals=signals.filter(function(s){return s.ready;});
  var totalWeight=0;readySignals.forEach(function(s){totalWeight+=s.weight;});
  if(!totalWeight)totalWeight=1;
  var raw=0;readySignals.forEach(function(s){raw+=s.signal*(s.weight/totalWeight);});
  var composite=Math.round(raw);
  var readyCount=readySignals.length;
  var totalModels=signals.length;
  var stdDev2=0;if(readySignals.length>1){readySignals.forEach(function(s){stdDev2+=(s.signal-raw)*(s.signal-raw);});stdDev2=Math.sqrt(stdDev2/readySignals.length);}else{stdDev2=50;}
  var agreement=Math.max(0,100-stdDev2*2);
  var confidence=readyCount>=4?(agreement>60?'HIGH':'MODERATE'):(readyCount>=2?'LOW':'INSUFFICIENT');
  var direction=composite>=60?'DE-ESCALATION':composite<=40?'ESCALATION':'NEUTRAL';
  var dirColor=composite>=60?'#22c55e':composite<=40?'#ef4444':'#f59e0b';

  window.STAT_MODEL_CONSENSUS = {
    composite:composite,direction:direction,dirColor:dirColor,confidence:confidence,
    readyCount:readyCount,totalModels:totalModels,signals:signals,
    agreement:Math.round(agreement),stdDev:Math.round(stdDev2)
  };
}

// ===== TACO ANALYTICS V2 =====
function initTacoV2() {

  // ---- DATA ----
  // Read from unified data source
  const rawBrent = DASHBOARD_DATA.chartData.brent;
  const rawVIX   = DASHBOARD_DATA.chartData.vix;
  const rawHYG   = DASHBOARD_DATA.chartData.hyg;
  const rawSP    = DASHBOARD_DATA.chartData.sp500;
  const rawTACO  = DASHBOARD_DATA.chartData.taco;
  const N = rawTACO.length;

  // ---- MODEL POWER WARNINGS ----
  (function injectModelPowerWarnings() {
    // Use actual data points (N = array length), NOT calendar war days
    // Weekends have no market data, so N < war_days
    var currentN = N; // N is the chartData array length defined at top
    var warStart = new Date(2026, 1, 28); // Feb 28, 2026 — needed for estimated date calc

    // Model requirements (based on statistical minimums for the method)
    var models = [
      { idx: 0, label: 'Granger', required: 30, reason: 'Needs df₂ ≥ 27 for reliable F-test p-values (currently df₂=' + Math.max(0,currentN-3) + ')' },
      { idx: 1, label: 'VAR(1)', required: 30, reason: 'Needs ≥30 observations for stable coefficient estimation (currently n=' + currentN + ')' },
      { idx: 2, label: 'Regime', required: 40, reason: 'Sub-samples need ≥15 each for separate regression (currently max sub=' + Math.floor(currentN*2/3) + ')' },
      { idx: 3, label: 'GARCH', required: 60, reason: 'Conditional variance α,β convergence requires ≥60 returns (currently n=' + currentN + ')' },
      { idx: 4, label: 'Bayesian', required: 20, reason: currentN >= 20 ? 'Data-driven — posterior meaningfully updated from Gulf War prior' : 'Prior-dominated — posterior still >60% driven by Gulf War prior' },
      { idx: 5, label: 'Ridge', required: 30, reason: 'LOO-CV needs ≥30 for stable cross-validation (currently n=' + currentN + ')' }
    ];

    // Get all card elements in the tacov2 panel
    var panel = document.querySelector('[data-panel="tacov2"]');
    if (!panel) return;
    var cards = panel.querySelectorAll('.card');

    // Map: card index -> model index (cards[0]=Granger, cards[1]=VAR, cards[2]=Regime, cards[3]=GARCH, cards[4]=Bayesian, cards[5]=Ridge)
    models.forEach(function(m, i) {
      var card = cards[i];
      if (!card) return;

      var daysToGo = Math.max(0, m.required - currentN);
      var pct = Math.min(100, Math.round((currentN / m.required) * 100));
      var status, statusClass;

      if (currentN >= m.required) {
        status = 'SUFFICIENT';
        statusClass = 'green';
      } else if (pct >= 75 || (m.label === 'Bayesian' && currentN >= 15)) {
        status = m.label === 'Bayesian' ? 'PRIOR-DOMINATED' : 'APPROACHING';
        statusClass = 'amber';
      } else {
        status = 'INSUFFICIENT DATA';
        statusClass = 'red';
      }

      // Calculate estimated date
      // Estimate date: add daysToGo trading days (skip weekends) from today
      var estDate = new Date();
      var tradingDaysLeft = daysToGo;
      while (tradingDaysLeft > 0) {
        estDate.setDate(estDate.getDate() + 1);
        var dow = estDate.getDay();
        if (dow !== 0 && dow !== 6) tradingDaysLeft--; // skip Sat/Sun
      }
      var estStr = estDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      var countdownHTML = daysToGo > 0
        ? '<div>~' + daysToGo + 'd to n≥' + m.required + '</div><div style="font-size:0.55rem;color:var(--color-text-faint);">Est. ' + estStr + '</div>'
        : '<div style="color:var(--color-green);">✓ Ready</div>';

      var warningEl = document.createElement('div');
      warningEl.className = 'model-power-warning power-' + statusClass;
      warningEl.innerHTML =
        '<div class="model-power-dot ' + statusClass + '"></div>' +
        '<div class="model-power-text">' +
          '<div class="model-power-status ' + statusClass + '">' + status + '</div>' +
          '<div class="model-power-reason">' + m.reason + '</div>' +
        '</div>' +
        '<div class="model-power-countdown">' +
          countdownHTML +
          '<div class="model-power-bar-wrap"><div class="model-power-bar ' + statusClass + '" style="width:' + pct + '%"></div></div>' +
        '</div>';

      // Insert after card-header
      var header = card.querySelector('.card-header');
      if (header && header.nextSibling) {
        card.insertBefore(warningEl, header.nextSibling);
      } else {
        card.prepend(warningEl);
      }
    });

    // Update banner n count
    var nCountEl = document.getElementById('banner-n-count');
    if (nCountEl) nCountEl.textContent = 'n=' + currentN;
    var nDispEl = document.getElementById('banner-n-display');
    if (nDispEl) nDispEl.textContent = 'n=' + currentN;

    // Populate maturity grid
    var matGrid = document.getElementById('maturity-grid');
    if (matGrid) {
      matGrid.innerHTML = models.map(function(m) {
        var pct = Math.min(100, Math.round((currentN / m.required) * 100));
        var cls = currentN >= m.required ? 'green' : (pct >= 75 || (m.label === 'Bayesian' && currentN >= 15) ? 'amber' : 'red');
        return '<div class="maturity-item">' +
          '<div class="maturity-label">' + m.label + '</div>' +
          '<div class="maturity-bar-wrap"><div class="maturity-bar ' + cls + '" style="width:' + pct + '%"></div></div>' +
          '<div class="maturity-pct ' + cls + '">' + pct + '% · n=' + currentN + '/' + m.required + '</div>' +
        '</div>';
      }).join('');
    }
  })();

  // ---- MATH UTILITIES ----
  function gaussElim(A, b) {
    const n = b.length;
    const M = A.map((row,i) => [...row, b[i]]);
    for (let c=0;c<n;c++) {
      let mx=c;
      for (let r=c+1;r<n;r++) if (Math.abs(M[r][c])>Math.abs(M[mx][c])) mx=r;
      [M[c],M[mx]]=[M[mx],M[c]];
      const pv=M[c][c];
      if (Math.abs(pv)<1e-12) continue;
      for (let r=0;r<n;r++) {
        if (r===c) continue;
        const f=M[r][c]/pv;
        for (let k=c;k<=n;k++) M[r][k]-=f*M[c][k];
      }
      for (let k=c;k<=n;k++) M[c][k]/=pv;
    }
    return M.map(row=>row[n]);
  }

  function ols(Xm, Y) {
    const nr=Y.length, nc=Xm[0].length;
    const XtX=Array.from({length:nc},(_,i)=>Array.from({length:nc},(_,j)=>Xm.reduce((s,r)=>s+r[i]*r[j],0)));
    const XtY=Array.from({length:nc},(_,i)=>Xm.reduce((s,r,t)=>s+r[i]*Y[t],0));
    const beta=gaussElim(XtX,XtY);
    const yhat=Xm.map(r=>r.reduce((s,v,i)=>s+v*beta[i],0));
    const rss=Y.reduce((s,y,t)=>s+(y-yhat[t])**2,0);
    const ym=Y.reduce((a,b)=>a+b)/Y.length;
    const tss=Y.reduce((s,y)=>s+(y-ym)**2,0);
    return {beta, yhat, rss, r2:Math.max(0,1-rss/tss)};
  }

  function std(arr) {
    const m=arr.reduce((a,b)=>a+b)/arr.length;
    const s=Math.sqrt(arr.reduce((s,v)=>s+(v-m)**2,0)/arr.length)||1;
    return {z:arr.map(v=>(v-m)/s),mean:m,std:s};
  }

  // F(1,df2) p-value bracket using standard critical value table
  function fPval(F, df2) {
    const idx=Math.min(Math.max(df2-1,0),9);
    const c10=[39.86,8.53,5.54,4.54,4.06,3.78,3.59,3.46,3.36,3.29];
    const c05=[161.4,18.51,10.13,7.71,6.61,5.99,5.59,5.32,5.12,4.96];
    const c01=[4052,98.5,34.12,21.2,16.26,13.75,12.25,11.26,10.56,10.04];
    if (F<=0) return {label:'>0.25',color:'#64748b'};
    if (F<c10[idx]) return {label:'>0.10',color:'#64748b'};
    if (F<c05[idx]) return {label:'0.05–0.10 *',color:'#f59e0b'};
    if (F<c01[idx]) return {label:'0.01–0.05 **',color:'#22c55e'};
    return {label:'<0.01 ***',color:'#22c55e'};
  }

  // ---- ① GRANGER CAUSALITY ----
  function granger(y, x) {
    const nobs=y.length-1;
    const Y=y.slice(1);
    const Xr=Array.from({length:nobs},(_,t)=>[1,y[t]]);
    const Xu=Array.from({length:nobs},(_,t)=>[1,y[t],x[t]]);
    const r=ols(Xr,Y), u=ols(Xu,Y);
    const df2=nobs-3;
    const F=df2>0?((r.rss-u.rss)/1)/(u.rss/df2):0;
    return {F:Math.max(0,F).toFixed(2), pv:fPval(F,df2), r2ur:u.r2, df2};
  }

  const mkts = [
    {name:'Brent', id:'brent', data:rawBrent},
    {name:'VIX',   id:'vix',   data:rawVIX},
    {name:'HYG',   id:'hyg',   data:rawHYG},
    {name:'S&P 500',id:'sp',   data:rawSP}
  ];

  let verdicts = [];
  mkts.forEach(({name,id,data}) => {
    const fwd = granger(data, rawTACO);
    const rev = granger(rawTACO, data);
    const fwdEl = document.getElementById('gran-fwd-'+id);
    const revEl = document.getElementById('gran-rev-'+id);
    const fillRow = (el, g, isGreen) => {
      if (!el) return;
      const sig = g.pv.label.includes('**') || g.pv.label.includes('*');
      el.innerHTML = `
        <td style="color:var(--color-text);font-weight:600;">${name}</td>
        <td class="mono" style="color:var(--color-text);">${g.F}</td>
        <td class="mono" style="color:var(--color-text-faint);">${g.df2}</td>
        <td><span style="font-family:var(--font-mono);font-size:0.68rem;font-weight:700;color:${g.pv.color};">${g.pv.label}</span></td>
        <td class="mono" style="color:var(--color-text-muted);">${(g.r2ur*100).toFixed(1)}%</td>
        <td style="font-size:0.7rem;color:${sig?(isGreen?'#22c55e':'#ef4444'):'var(--color-text-faint)'};">${sig?(isGreen?'✓ TACO leads':'⚠ Reverse!'):'Inconclusive'}</td>
      `;
    };
    fillRow(fwdEl, fwd, true);
    fillRow(revEl, rev, false);
    verdicts.push({name, fwd, rev});
  });

  const gvEl = document.getElementById('grangerVerdict');
  if (gvEl) {
    const topFwd = verdicts.sort((a,b)=>parseFloat(b.fwd.F)-parseFloat(a.fwd.F))[0];
    const grangerNote = N >= 30 
      ? `With n=${N} the tests are approaching minimum viable power (df₂=${N-3}).`
      : `With n=${N} the tests lack power (df₂=${N-3} only). Revisit when n≥30 for reliable inference.`;
    gvEl.innerHTML = `<strong style="color:var(--color-text-muted);">Interpretation:</strong> ${grangerNote} 
      Strongest forward signal: <strong style="color:#f59e0b;">${topFwd.name}</strong> (F=${topFwd.fwd.F}, p ${topFwd.fwd.pv.label}). 
      If any reverse causality is significant, it implies analysts score TACO reactively to market moves — undermining its predictive use. 
      * p&lt;0.10, ** p&lt;0.05, *** p&lt;0.01.`;
  }

  // ---- ② VAR(1) BIVARIATE IRF ----
  const nvar=N-1;
  const Xvar=Array.from({length:nvar},(_,t)=>[1,rawBrent[t],rawTACO[t]]);
  const varB=ols(Xvar,rawBrent.slice(1));
  const varT=ols(Xvar,rawTACO.slice(1));
  // A = [[a_BB, a_BT],[a_TB, a_TT]]
  const A=[[varB.beta[1],varB.beta[2]],[varT.beta[1],varT.beta[2]]];
  // IRF: 1-unit shock to TACO (shock vector [0,1])
  const irfB=[0], irfT=[1];
  let v=[0,1];
  for(let h=1;h<=8;h++){
    const vn=[A[0][0]*v[0]+A[0][1]*v[1], A[1][0]*v[0]+A[1][1]*v[1]];
    irfB.push(parseFloat(vn[0].toFixed(4)));
    irfT.push(parseFloat(vn[1].toFixed(4)));
    v=vn;
  }
  const irfEl=document.getElementById('varIrfChart');
  if(irfEl){
    new Chart(irfEl.getContext('2d'),{
      type:'line',
      data:{
        labels:['h=0','h=1','h=2','h=3','h=4','h=5','h=6','h=7','h=8'],
        datasets:[
          {label:'Brent response ($/bbl)',data:irfB,borderColor:'#f59e0b',borderWidth:2.5,pointRadius:4,tension:0.3,fill:false},
          {label:'TACO persistence',data:irfT,borderColor:'#38bdf8',borderWidth:2,borderDash:[5,4],pointRadius:3,tension:0.3,fill:false}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'top',labels:{font:{size:10},boxWidth:12}},
          tooltip:{backgroundColor:'rgba(15,23,42,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1},
          annotation:{annotations:{zero:{type:'line',yMin:0,yMax:0,borderColor:'rgba(148,163,184,0.25)',borderWidth:1,borderDash:[3,3]}}}
        },
        scales:{
          x:{grid:{display:false},ticks:{font:{size:9},color:'#64748b'}},
          y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{family:"'JetBrains Mono',monospace",size:9},color:'#64748b'},
             title:{display:true,text:'Response magnitude',font:{size:9},color:'#475569'}}
        }
      }
    });
  }
  const vcEl=document.getElementById('varCoeffs');
  if(vcEl){
    vcEl.innerHTML=`<table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:0.7rem;">
      <thead><tr style="color:var(--color-text-faint);font-size:0.62rem;">
        <th style="text-align:left;padding:3px 5px;"></th>
        <th style="text-align:right;padding:3px 5px;">Brent(t-1)</th>
        <th style="text-align:right;padding:3px 5px;">TACO(t-1)</th>
        <th style="text-align:right;padding:3px 5px;">const</th>
        <th style="text-align:right;padding:3px 5px;">R²</th>
      </tr></thead>
      <tbody>
        <tr><td style="color:#f59e0b;font-weight:700;padding:3px 5px;">Brent(t)</td>
            <td style="text-align:right;padding:3px 5px;">${varB.beta[1].toFixed(3)}</td>
            <td style="text-align:right;padding:3px 5px;color:${Math.abs(varB.beta[2])>0.2?'#38bdf8':'inherit'}">${varB.beta[2].toFixed(3)}</td>
            <td style="text-align:right;padding:3px 5px;">${varB.beta[0].toFixed(1)}</td>
            <td style="text-align:right;padding:3px 5px;color:#22c55e;">${(varB.r2*100).toFixed(1)}%</td></tr>
        <tr><td style="color:#38bdf8;font-weight:700;padding:3px 5px;">TACO(t)</td>
            <td style="text-align:right;padding:3px 5px;">${varT.beta[1].toFixed(3)}</td>
            <td style="text-align:right;padding:3px 5px;">${varT.beta[2].toFixed(3)}</td>
            <td style="text-align:right;padding:3px 5px;">${varT.beta[0].toFixed(1)}</td>
            <td style="text-align:right;padding:3px 5px;color:#22c55e;">${(varT.r2*100).toFixed(1)}%</td></tr>
      </tbody>
    </table>
    <p style="font-size:0.68rem;color:var(--color-text-faint);margin-top:6px;line-height:1.4;">
      TACO(t-1) coefficient in Brent equation: ${varB.beta[2].toFixed(3)} → a 1-pt TACO drop ${varB.beta[2]<0?'raises':'lowers'} Brent by $${Math.abs(varB.beta[2]).toFixed(2)} next day (n=${nvar}, interpret with caution).
    </p>`;
  }

  // ---- ③ REGIME DETECTION ----
  // Dynamic regime split: first third = Shock, remainder = Attrition
  const regimeSplit = Math.max(5, Math.floor(N / 3));
  const r1 = Array.from({length: regimeSplit}, (_, i) => i);
  const r2 = Array.from({length: N - regimeSplit}, (_, i) => i + regimeSplit);
  const reg1=ols(r1.map(i=>[1,rawTACO[i]]),r1.map(i=>rawBrent[i]));
  const reg2=ols(r2.map(i=>[1,rawTACO[i]]),r2.map(i=>rawBrent[i]));
  const regEl=document.getElementById('regimeChart');
  if(regEl){
    new Chart(regEl.getContext('2d'),{
      type:'scatter',
      data:{datasets:[
        {label:'Regime 1: Shock (D1–D'+regimeSplit+')',data:r1.map(i=>({x:rawTACO[i],y:rawBrent[i]})),backgroundColor:'rgba(239,68,68,0.75)',borderColor:'#ef4444',pointRadius:6},
        {label:'Regime 2: Attrition (D'+(regimeSplit+1)+'–D'+N+')',data:r2.map(i=>({x:rawTACO[i],y:rawBrent[i]})),backgroundColor:'rgba(245,158,11,0.75)',borderColor:'#f59e0b',pointRadius:6},
        {label:'Fit R1',type:'line',data:[{x:15,y:reg1.beta[0]+reg1.beta[1]*15},{x:45,y:reg1.beta[0]+reg1.beta[1]*45}],borderColor:'#ef4444',borderWidth:2,borderDash:[5,3],pointRadius:0,fill:false},
        {label:'Fit R2',type:'line',data:[{x:6,y:reg2.beta[0]+reg2.beta[1]*6},{x:15,y:reg2.beta[0]+reg2.beta[1]*15}],borderColor:'#f59e0b',borderWidth:2,borderDash:[5,3],pointRadius:0,fill:false}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{position:'top',labels:{font:{size:10},boxWidth:12,filter:i=>i.datasetIndex<2}},
          tooltip:{backgroundColor:'rgba(15,23,42,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
            callbacks:{label:ctx=>ctx.raw.x!==undefined?`TACO:${ctx.raw.x} Brent:$${ctx.raw.y}`:''}}
        },
        scales:{
          x:{title:{display:true,text:'TACO Score',font:{size:9},color:'#475569'},grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{size:9},color:'#64748b'}},
          y:{title:{display:true,text:'Brent ($/bbl)',font:{size:9},color:'#475569'},grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{family:"'JetBrains Mono',monospace",size:9},color:'#64748b',callback:v=>'$'+v}}
        }
      }
    });
  }
  const rsEl=document.getElementById('regimeStats');
  if(rsEl){
    rsEl.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
      <div style="padding:8px 10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:6px;">
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:#ef4444;text-transform:uppercase;margin-bottom:3px;">Regime 1 · Shock D1–${regimeSplit}</div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">Slope: <b style="color:var(--color-text);">${reg1.beta[1].toFixed(2)} $/pt TACO</b></div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">R²: <b style="color:#22c55e;">${(reg1.r2*100).toFixed(1)}%</b></div>
        <div style="font-size:0.68rem;color:var(--color-text-faint);margin-top:2px;">Each TACO pt = ${reg1.beta[1]>0?'+':''}$${reg1.beta[1].toFixed(2)}/bbl</div>
      </div>
      <div style="padding:8px 10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:6px;">
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:#f59e0b;text-transform:uppercase;margin-bottom:3px;">Regime 2 · Attrition D${regimeSplit+1}–${N}</div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">Slope: <b style="color:var(--color-text);">${reg2.beta[1].toFixed(2)} $/pt TACO</b></div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">R²: <b style="color:#22c55e;">${(reg2.r2*100).toFixed(1)}%</b></div>
        <div style="font-size:0.68rem;color:var(--color-text-faint);margin-top:2px;">Each TACO pt = ${reg2.beta[1]>0?'+':''}$${reg2.beta[1].toFixed(2)}/bbl</div>
      </div>
    </div>`;
  }

  // ---- ④ GARCH(1,1) ----
  const logRet=rawBrent.slice(1).map((p,i)=>Math.log(p/rawBrent[i]));
  const nR=logRet.length;
  const sv=logRet.reduce((s,r)=>s+r*r,0)/nR;
  const alpha_g=0.25, beta_g=0.65, omega_g=sv*(1-alpha_g-beta_g);
  const h_g=[sv];
  for(let t=1;t<nR;t++) h_g.push(omega_g+alpha_g*logRet[t-1]**2+beta_g*h_g[t-1]);
  const condVolAnn=h_g.map(h=>parseFloat((Math.sqrt(h*252)*100).toFixed(2)));
  const hFcast=[h_g[nR-1]];
  for(let k=1;k<=5;k++) hFcast.push(omega_g+(alpha_g+beta_g)*hFcast[k-1]);
  const volFcast=hFcast.map(h=>parseFloat((Math.sqrt(h*252)*100).toFixed(2)));
  const gEl=document.getElementById('garchChart');
  if(gEl){
    // Compute war day numbers from date labels
    const _warStart = new Date(2026, 1, 28);
    const _dateLabels = DASHBOARD_DATA.chartData.labels;
    const _warDays = _dateLabels.map(function(lbl) {
      var p = lbl.split(' '); var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(p[0]);
      return m >= 0 ? Math.round((new Date(2026,m,parseInt(p[1])) - _warStart) / 86400000) + 1 : null;
    });
    // GARCH uses returns starting from D2, so histL maps to _warDays[1..end]
    const histL = _warDays.slice(1).map(function(wd) { return 'D' + wd; });
    const lastWD = _warDays[_warDays.length - 1] || nR + 1;
    const allL = [...histL, ...Array.from({length:5},(_,i)=>'D'+(lastWD+i+1))];
    const histPad=[...condVolAnn,null,null,null,null,null];
    const fcastPad=[...Array(nR-1).fill(null),condVolAnn[nR-1],...volFcast.slice(1)];
    new Chart(gEl.getContext('2d'),{
      type:'line',
      data:{labels:allL,datasets:[
        {label:'Conditional Vol (Ann.)',data:histPad,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.08)',borderWidth:2,pointRadius:3,tension:0.4,fill:true},
        {label:'5-Day Forecast',data:fcastPad,borderColor:'#38bdf8',backgroundColor:'rgba(56,189,248,0.07)',borderWidth:2,borderDash:[5,4],pointRadius:3,tension:0.3,fill:true}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'top',labels:{font:{size:10},boxWidth:12}},
          tooltip:{backgroundColor:'rgba(15,23,42,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
            callbacks:{label:ctx=>ctx.raw===null?'':`${ctx.dataset.label}: ${ctx.raw}%`}},
          annotation:{annotations:{split:{type:'line',xMin:nR-1,xMax:nR-1,borderColor:'rgba(148,163,184,0.3)',borderWidth:1,borderDash:[4,4]}}}
        },
        scales:{
          x:{grid:{display:false},ticks:{font:{size:9},color:'#64748b'}},
          y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{family:"'JetBrains Mono',monospace",size:9},color:'#64748b',callback:v=>v+'%'},
             title:{display:true,text:'Ann. Volatility (%)',font:{size:9},color:'#475569'}}
        }
      }
    });
  }
  const gsEl=document.getElementById('garchSummary');
  if(gsEl){
    const lrVol=Math.sqrt(omega_g/(1-alpha_g-beta_g)*252)*100;
    gsEl.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      <div style="padding:8px;background:var(--color-surface-2);border-radius:6px;border-left:3px solid #f59e0b;">
        <div style="font-family:var(--font-mono);font-size:0.58rem;color:var(--color-amber);text-transform:uppercase;">Current σ</div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--color-text);">${condVolAnn[nR-1]}%</div>
      </div>
      <div style="padding:8px;background:var(--color-surface-2);border-radius:6px;border-left:3px solid #38bdf8;">
        <div style="font-family:var(--font-mono);font-size:0.58rem;color:#38bdf8;text-transform:uppercase;">3d Forecast σ</div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--color-text);">${volFcast[3]}%</div>
      </div>
      <div style="padding:8px;background:var(--color-surface-2);border-radius:6px;border-left:3px solid #8b5cf6;">
        <div style="font-family:var(--font-mono);font-size:0.58rem;color:#8b5cf6;text-transform:uppercase;">Long-Run σ</div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--color-text);">${lrVol.toFixed(1)}%</div>
      </div>
    </div>`;
  }

  // ---- ⑤ BAYESIAN ----
  const priorMu=45, priorSig=40, priorVar=priorSig**2;
  const obsNoise=8; // $/bbl per observation
  const obsSig=obsNoise/rawBrent[0]*100; // convert to % terms
  const obsVar=obsSig**2;
  const brentPct=rawBrent.map(v=>(v/rawBrent[0]-1)*100);
  const nObs=brentPct.length;
  const sumX=brentPct.reduce((a,b)=>a+b,0);
  const postPrec=1/priorVar+nObs/obsVar;
  const postMu=(priorMu/priorVar+sumX/obsVar)/postPrec;
  const postSig=Math.sqrt(1/postPrec);
  function npdf(x,mu,sig){return Math.exp(-0.5*((x-mu)/sig)**2)/(sig*Math.sqrt(2*Math.PI));}
  const xr=Array.from({length:100},(_,i)=>-50+i*2.2);
  const bEl=document.getElementById('bayesChart');
  if(bEl){
    new Chart(bEl.getContext('2d'),{
      type:'line',
      data:{labels:xr.map(v=>v.toFixed(0)+'%'),datasets:[
        {label:'Prior (Gulf conflicts)',data:xr.map(x=>parseFloat(npdf(x,priorMu,priorSig).toFixed(6))),borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,0.1)',borderWidth:2,pointRadius:0,fill:true,tension:0.4},
        {label:`Posterior (n=${nObs})`,data:xr.map(x=>parseFloat(npdf(x,postMu,postSig).toFixed(6))),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.12)',borderWidth:2.5,pointRadius:0,fill:true,tension:0.4}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{position:'top',labels:{font:{size:10},boxWidth:12}},
          tooltip:{backgroundColor:'rgba(15,23,42,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
            callbacks:{title:i=>`Premium: ${i[0].label}`,label:ctx=>`${ctx.dataset.label}: ${(ctx.raw*100).toFixed(2)}% density`}}
        },
        scales:{
          x:{grid:{display:false},ticks:{font:{size:9},color:'#64748b',maxTicksLimit:12},
             title:{display:true,text:'Conflict oil premium (% vs pre-war)',font:{size:9},color:'#475569'}},
          y:{display:false}
        }
      }
    });
  }
  const bsEl=document.getElementById('bayesSummary');
  if(bsEl){
    const ci_lo=(postMu-1.96*postSig).toFixed(1), ci_hi=(postMu+1.96*postSig).toFixed(1);
    const curObs=brentPct[brentPct.length-1].toFixed(1);
    bsEl.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <div style="padding:8px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:6px;">
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:#8b5cf6;text-transform:uppercase;margin-bottom:3px;">Prior</div>
        <div style="font-size:0.8rem;color:var(--color-text);">μ = +${priorMu}% · σ = ${priorSig}%</div>
        <div style="font-size:0.68rem;color:var(--color-text-faint);">1990/2003/2006/2011 conflicts</div>
      </div>
      <div style="padding:8px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:6px;">
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:#f59e0b;text-transform:uppercase;margin-bottom:3px;">Posterior</div>
        <div style="font-size:0.8rem;color:var(--color-text);">μ = +${postMu.toFixed(1)}% · σ = ${postSig.toFixed(1)}%</div>
        <div style="font-size:0.68rem;color:var(--color-text-faint);">95% CI: [${ci_lo}%, ${ci_hi}%]</div>
      </div>
    </div>
    <p style="font-size:0.72rem;color:var(--color-text-muted);line-height:1.5;margin:0;">
      Data (Day ${N} observed premium: +${curObs}%) pulls posterior ${postMu<priorMu?'below':'above'} the historical prior of +${priorMu}%. 
      The posterior is much tighter (σ=${postSig.toFixed(1)}% vs ${priorSig}%) — ${nObs} observations have meaningfully reduced uncertainty. 
      ${postMu<priorMu?'Lower-than-historical premium suggests demand destruction + IEA partly offsetting the supply shock in market pricing.':'Higher premium reflects supply shock dominating demand-side factors.'}
    </p>`;
  }

  // ---- ⑥ RIDGE REGRESSION PATH ----
  const nRidge=N-1; // dynamic observation count
  const bDelta=rawBrent.slice(1).map((v,i)=>v-rawBrent[i]);
  const preds=[rawTACO,rawVIX,rawHYG,rawSP.map(v=>v/50),rawBrent].map(a=>a.slice(0,nRidge));
  const pNames=['TACO','VIX','HYG','S&P','Brent_lag'];
  const pColors=['#38bdf8','#ef4444','#8b5cf6','#22c55e','#f59e0b'];
  const stdP=preds.map(p=>std(p).z);
  const stdY=std(bDelta);
  const Xm=Array.from({length:nRidge},(_,t)=>stdP.map(p=>p[t]));
  const k=5;
  const XtX0=Array.from({length:k},(_,i)=>Array.from({length:k},(_,j)=>Xm.reduce((s,r)=>s+r[i]*r[j],0)));
  const XtY0=Array.from({length:k},(_,i)=>Xm.reduce((s,r,t)=>s+r[i]*stdY.z[t],0));
  const lambdas=Array.from({length:50},(_,i)=>i*0.6);
  function ridgeBeta(lam){
    const M=XtX0.map((r,i)=>r.map((v,j)=>v+(i===j?lam:0)));
    return gaussElim(M,XtY0);
  }
  function hatDiag(lam){
    const M=XtX0.map((r,i)=>r.map((v,j)=>v+(i===j?lam:0)));
    const cols=Array.from({length:k},(_,c)=>{const e=Array(k).fill(0);e[c]=1;return gaussElim(M,e);});
    return Xm.map(row=>{
      const Mv=Array.from({length:k},(_,i)=>cols.reduce((s,col,j)=>s+col[i]*row[j],0));
      return row.reduce((s,v,i)=>s+v*Mv[i],0);
    });
  }
  const bPaths=lambdas.map(lam=>ridgeBeta(lam));
  const looCVs=lambdas.map((lam,li)=>{
    const beta=bPaths[li];
    const yhat=Xm.map(r=>r.reduce((s,v,i)=>s+v*beta[i],0));
    const hd=hatDiag(lam);
    return stdY.z.reduce((s,y,t)=>{const d=1-hd[t];return s+(d>0.05?(y-yhat[t])/d:(y-yhat[t]))**2;},0)/nRidge;
  });
  const bestIdx=looCVs.indexOf(Math.min(...looCVs));
  const bestLam=lambdas[bestIdx];
  const bestB=bPaths[bestIdx];
  const rEl=document.getElementById('ridgeChart');
  if(rEl){
    new Chart(rEl.getContext('2d'),{
      type:'line',
      data:{
        labels:lambdas.map(l=>l.toFixed(1)),
        datasets:pNames.map((nm,pi)=>({
          label:nm,data:bPaths.map(b=>parseFloat(b[pi].toFixed(4))),
          borderColor:pColors[pi],borderWidth:2,pointRadius:0,tension:0.3,fill:false
        }))
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'top',labels:{font:{size:10},boxWidth:12,padding:8}},
          tooltip:{backgroundColor:'rgba(15,23,42,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,
            callbacks:{title:items=>`λ = ${items[0].label}`,label:ctx=>`${ctx.dataset.label}: ${ctx.raw}`}},
          annotation:{annotations:{
            optL:{type:'line',xMin:bestIdx,xMax:bestIdx,borderColor:'rgba(255,255,255,0.3)',borderWidth:1.5,borderDash:[4,3],
              label:{content:'λ*='+bestLam.toFixed(1),display:true,position:'start',font:{size:9},color:'#94a3b8',backgroundColor:'rgba(15,23,42,0.8)',padding:{x:4,y:2}}},
            zero:{type:'line',yMin:0,yMax:0,borderColor:'rgba(148,163,184,0.15)',borderWidth:1}
          }}
        },
        scales:{
          x:{grid:{display:false},ticks:{font:{size:9},color:'#64748b',maxTicksLimit:10},
             title:{display:true,text:'Ridge penalty λ  (left=OLS / right=full shrinkage)',font:{size:9},color:'#475569'}},
          y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{family:"'JetBrains Mono',monospace",size:9},color:'#64748b'},
             title:{display:true,text:'Standardised coefficient',font:{size:9},color:'#475569'}}
        }
      }
    });
  }
  // LOO-CV subplot
  const looEl=document.getElementById('ridgeLooChart');
  if(looEl){
    new Chart(looEl.getContext('2d'),{
      type:'line',
      data:{labels:lambdas.map(l=>l.toFixed(1)),datasets:[
        {label:'LOO-CV MSE',data:looCVs.map(v=>parseFloat(v.toFixed(4))),borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,0.08)',borderWidth:1.5,pointRadius:0,fill:true,tension:0.4}
      ]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},
          annotation:{annotations:{optL2:{type:'line',xMin:bestIdx,xMax:bestIdx,borderColor:'rgba(139,92,246,0.5)',borderWidth:1,borderDash:[3,3]}}}},
        scales:{
          x:{grid:{display:false},ticks:{font:{size:8},color:'#64748b',maxTicksLimit:6}},
          y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{font:{size:8},color:'#64748b'},title:{display:true,text:'MSE',font:{size:8},color:'#475569'}}
        }
      }
    });
  }
  // Ridge summary
  const rsumEl=document.getElementById('ridgeSummary');
  if(rsumEl){
    const sorted=pNames.map((n,i)=>({n,c:bestB[i],col:pColors[i]})).sort((a,b)=>Math.abs(b.c)-Math.abs(a.c));
    const totAbs=sorted.reduce((s,x)=>s+Math.abs(x.c),0)||1;
    rsumEl.innerHTML=`<div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">At λ*=${bestLam.toFixed(1)} (LOO-CV min) · Predictor importance</div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${sorted.map(({n,c,col})=>{
          const pct=(Math.abs(c)/totAbs*100).toFixed(0);
          return `<div style="display:flex;align-items:center;gap:8px;">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:${col};font-weight:700;width:68px;">${n}</div>
            <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:3px;height:7px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:${col};border-radius:3px;"></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:${c>0?'#22c55e':'#ef4444'};width:52px;text-align:right;">${c>0?'+':''}${c.toFixed(3)}</div>
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:0.7rem;color:var(--color-text-faint);margin-top:10px;line-height:1.45;">
        <b style="color:${sorted[0].col};">${sorted[0].n}</b> is the most robust predictor at optimal regularization. 
        Positive = predicts next-day Brent rise; negative = predicts fall. Standardized so magnitudes are directly comparable.
      </p>`;
  }

  // ============================================================================
  // STAT MODEL CONSENSUS ENGINE — Feeds back into TACO composite
  // Can run independently of DOM (no Chart.js or getElementById needed)
  // ============================================================================
  // Each model produces a directional signal: does quantitative evidence suggest
  // escalation (Brent rising, TACO ineffective) or de-escalation (Brent falling,
  // TACO predictive)?
  //
  // Signal scale: 0 = max escalation, 50 = neutral, 100 = max de-escalation
  // Models below their data threshold contribute 50 (neutral) with zero weight.
  // ============================================================================

  window._computeStatModelConsensus = function() {
    const signals = [];
    const modelDetails = [];

    // --- 1. GRANGER: Does TACO lead markets? ---
    // If TACO→Brent is significant (p<0.10), TACO has predictive power = bullish for score validity
    // If Brent→TACO is significant, analysts are reactive = bearish for score validity
    // Signal: count of significant forward signals minus reverse signals
    const grangerReady = N >= 30;
    if (grangerReady) {
      let fwdSig = 0, revSig = 0;
      verdicts.forEach(v => {
        if (v.fwd.pv.label.includes('*')) fwdSig++;
        if (v.rev.pv.label.includes('*')) revSig++;
      });
      // Net: +4 max (all forward sig) to -4 (all reverse sig)
      const netGranger = fwdSig - revSig; // range -4 to +4
      const grangerSignal = Math.max(0, Math.min(100, 50 + netGranger * 12.5));
      signals.push({ model: 'Granger', signal: grangerSignal, weight: 0.10, ready: true,
        detail: fwdSig + ' forward sig, ' + revSig + ' reverse sig → net ' + (netGranger >= 0 ? '+' : '') + netGranger });
    } else {
      signals.push({ model: 'Granger', signal: 50, weight: 0, ready: false, detail: 'n < 30' });
    }

    // --- 2. VAR: TACO→Brent coefficient direction ---
    // If TACO(t-1) coefficient in Brent equation is negative, TACO drops → Brent rises (escalation pricing)
    // This is the EXPECTED sign. A positive coefficient means markets are decorrelating.
    const varReady = N >= 30;
    if (varReady) {
      const tacoBrentCoef = varB.beta[2]; // TACO(t-1) → Brent(t)
      // Negative = escalation pricing intact (normal). Positive = decorrelation (de-escalation)
      // More negative = stronger escalation link = lower TACO validity
      // Signal: 50 at zero, each 0.5 unit moves ±15
      const varSignal = Math.max(0, Math.min(100, 50 + tacoBrentCoef * 30));
      signals.push({ model: 'VAR(1)', signal: varSignal, weight: 0.20, ready: true,
        detail: 'TACO→Brent coef: ' + tacoBrentCoef.toFixed(3) + (tacoBrentCoef > 0 ? ' (decorrelating)' : ' (escalation pricing)') });
    } else {
      signals.push({ model: 'VAR(1)', signal: 50, weight: 0, ready: false, detail: 'n < 30' });
    }

    // --- 3. GARCH: Volatility trend ---
    // Declining conditional vol = de-escalation. Rising = escalation.
    // Compare current vol to 5-day-ago vol
    // Note: GARCH card shows n≥60 required, but vol trend is usable earlier.
    // We use a lower bar (10) for the directional signal, matching GARCH's internal computation.
    const garchReady = condVolAnn.length >= 10 && N >= 20;
    if (garchReady) {
      const curVol = condVolAnn[condVolAnn.length - 1];
      const prevVol = condVolAnn[Math.max(0, condVolAnn.length - 6)];
      const volDelta = curVol - prevVol; // positive = vol rising = escalation
      // Signal: 50 at zero, each 10% vol change moves ±25
      const garchSignal = Math.max(0, Math.min(100, 50 - volDelta * 2.5));
      signals.push({ model: 'GARCH', signal: garchSignal, weight: 0.08, ready: true,
        detail: 'Vol ' + curVol.toFixed(1) + '% → Δ' + (volDelta >= 0 ? '+' : '') + volDelta.toFixed(1) + 'pp vs 5d ago' });
    } else {
      signals.push({ model: 'GARCH', signal: 50, weight: 0, ready: false, detail: 'Insufficient vol history' });
    }

    // --- 4. BAYESIAN: Posterior premium vs prior ---
    // If posterior mean < prior mean → market pricing LESS risk than historical conflicts
    // This is a de-escalation signal.
    const bayesReady = N >= 20;
    if (bayesReady) {
      const premiumGap = postMu - priorMu; // negative = less than historical = de-escalation
      // Signal: 50 at zero gap, each 10pp gap moves ±20
      const bayesSignal = Math.max(0, Math.min(100, 50 - premiumGap * 2));
      signals.push({ model: 'Bayesian', signal: bayesSignal, weight: 0.10, ready: true,
        detail: 'Posterior +' + postMu.toFixed(1) + '% vs prior +' + priorMu + '% → gap ' + (premiumGap >= 0 ? '+' : '') + premiumGap.toFixed(1) + 'pp' });
    } else {
      signals.push({ model: 'Bayesian', signal: 50, weight: 0, ready: false, detail: 'n < 20' });
    }

    // --- 5. RIDGE: TACO predictor importance ---
    // If TACO is the dominant predictor with negative sign → escalation pricing strong
    // If TACO weight is low → other factors dominating → TACO less relevant
    const ridgeReady = N >= 30;
    if (ridgeReady) {
      const tacoIdx = pNames.indexOf('TACO');
      const tacoCoef = bestB[tacoIdx];
      const totalAbsCoefs = bestB.reduce((s, c) => s + Math.abs(c), 0) || 1;
      const tacoImportance = Math.abs(tacoCoef) / totalAbsCoefs;
      // Higher TACO importance + correct sign = more de-escalation (TACO is working)
      // Signal: importance * direction
      const ridgeSignal = Math.max(0, Math.min(100, 50 + tacoCoef * 50));
      signals.push({ model: 'Ridge', signal: ridgeSignal, weight: 0.07, ready: true,
        detail: 'TACO coef: ' + (tacoCoef >= 0 ? '+' : '') + tacoCoef.toFixed(3) + ' (importance: ' + (tacoImportance * 100).toFixed(0) + '%)' });
    } else {
      signals.push({ model: 'Ridge', signal: 50, weight: 0, ready: false, detail: 'n < 30' });
    }

    // --- 6. REGIME: Current regime slope direction ---
    // Positive slope in current regime = TACO↑ → Brent↑ (paradoxical but means both moving together)
    // The key question: are we in a regime where TACO is informative?
    const regimeReady = N >= 40;
    if (regimeReady) {
      const curSlope = reg2.beta[1]; // attrition regime slope
      const curR2 = reg2.r2;
      // Higher R² = stronger TACO-Brent relationship = more informative
      const regimeSignal = Math.max(0, Math.min(100, curR2 * 100));
      signals.push({ model: 'Regime', signal: regimeSignal, weight: 0.05, ready: true,
        detail: 'Attrition R²: ' + (curR2 * 100).toFixed(1) + '%, slope: ' + curSlope.toFixed(2) });
    } else {
      signals.push({ model: 'Regime', signal: 50, weight: 0, ready: false, detail: 'n < 40' });
    }

    // --- 7. PREDICTION MARKETS ---
    const pm = DASHBOARD_DATA.predictionMarkets;
    const pmReady2 = pm && pm.signalCards && pm.signalCards.length >= 2;
    if (pmReady2) {
      let ceasefireCard2 = null, groundWarCard2 = null;
      pm.signalCards.forEach(c => {
        const lbl = (c.contract || '').toLowerCase();
        if (lbl.includes('ceasefire') && !ceasefireCard2) ceasefireCard2 = c;
        if ((lbl.includes('enter') || lbl.includes('ground') || lbl.includes('invade')) && !groundWarCard2) groundWarCard2 = c;
      });
      const cf = ceasefireCard2 ? parseFloat(ceasefireCard2.rawPrice) || 50 : 50;
      const gw = groundWarCard2 ? parseFloat(groundWarCard2.rawPrice) || 50 : 50;
      const pmSig = Math.max(0, Math.min(100, cf - (gw - 50) * 0.3));
      let tvol = 0;
      pm.signalCards.forEach(c => { tvol += parseFloat((c.volume||'').replace(/[^0-9.]/g,'')) || 0; });
      signals.push({ model: 'PredMkt', signal: Math.round(pmSig), weight: 0.50, ready: true,
        detail: 'Ceasefire:' + cf + '% Ground:' + gw + '% Vol:$' + (tvol > 100 ? tvol.toFixed(0) : tvol.toFixed(1)) + 'M' });
    } else {
      signals.push({ model: 'PredMkt', signal: 50, weight: 0, ready: false, detail: 'No PM data' });
    }

    // --- COMPOSITE: Weighted average of ready models ---
    const readySignals = signals.filter(s => s.ready);
    const totalWeight = readySignals.reduce((s, m) => s + m.weight, 0) || 1;
    const rawComposite = readySignals.reduce((s, m) => s + m.signal * (m.weight / totalWeight), 0);
    const composite = Math.round(rawComposite);
    const readyCount = readySignals.length;
    const totalModels = signals.length;

    // Confidence: based on how many models are ready and their agreement
    const stdDev = readySignals.length > 1
      ? Math.sqrt(readySignals.reduce((s, m) => s + (m.signal - rawComposite) ** 2, 0) / readySignals.length)
      : 50;
    const agreement = Math.max(0, 100 - stdDev * 2); // 0-100, higher = more agreement
    const confidence = readyCount >= 4 ? (agreement > 60 ? 'HIGH' : 'MODERATE') : (readyCount >= 2 ? 'LOW' : 'INSUFFICIENT');

    // Direction label
    const direction = composite >= 60 ? 'DE-ESCALATION' : composite <= 40 ? 'ESCALATION' : 'NEUTRAL';
    const dirColor = composite >= 60 ? '#22c55e' : composite <= 40 ? '#ef4444' : '#f59e0b';

    // Export for render.js to pick up
    window.STAT_MODEL_CONSENSUS = {
      composite: composite,
      direction: direction,
      dirColor: dirColor,
      confidence: confidence,
      readyCount: readyCount,
      totalModels: totalModels,
      signals: signals,
      agreement: Math.round(agreement),
      stdDev: Math.round(stdDev)
    };

    // --- RENDER: Stat Model Consensus Panel ---
    const panelEl = document.getElementById('statModelConsensus');
    if (panelEl) {
      const readyBadgeColor = readyCount >= 4 ? '#22c55e' : readyCount >= 2 ? '#f59e0b' : '#ef4444';
      panelEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--color-text-faint);text-transform:uppercase;letter-spacing:0.05em;">Stat Model Consensus</div>
            <div style="font-size:1.8rem;font-weight:800;color:${dirColor};line-height:1.1;">${composite}<span style="font-size:0.9rem;color:var(--color-text-faint);font-weight:400;">/100</span></div>
            <div style="font-family:var(--font-mono);font-size:0.65rem;color:${dirColor};font-weight:700;">${direction}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-mono);font-size:0.58rem;color:${readyBadgeColor};">${readyCount}/${totalModels} MODELS ACTIVE</div>
            <div style="font-family:var(--font-mono);font-size:0.58rem;color:var(--color-text-faint);margin-top:2px;">CONFIDENCE: ${confidence}</div>
            <div style="font-family:var(--font-mono);font-size:0.58rem;color:var(--color-text-faint);">AGREEMENT: ${agreement}%</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${signals.map(s => {
            const barWidth = s.ready ? s.signal : 50;
            const barColor = !s.ready ? '#475569' : s.signal >= 60 ? '#22c55e' : s.signal <= 40 ? '#ef4444' : '#f59e0b';
            const opacity = s.ready ? '1' : '0.35';
            return `<div style="display:flex;align-items:center;gap:6px;opacity:${opacity};">
              <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--color-text-muted);width:60px;font-weight:600;">${s.model}</div>
              <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;position:relative;">
                <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.15);"></div>
                <div style="width:${barWidth}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.5s;"></div>
              </div>
              <div style="font-family:var(--font-mono);font-size:0.65rem;color:${barColor};width:28px;text-align:right;font-weight:700;">${s.ready ? s.signal : '—'}</div>
              <div style="font-size:0.58rem;color:var(--color-text-faint);width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.detail}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.65rem;color:var(--color-text-faint);line-height:1.5;">
          <strong style="color:var(--color-text-muted);">How this feeds TACO:</strong> The composite (${composite}/100) represents the quantitative evidence direction.
          0 = models indicate maximum escalation pricing, 100 = maximum de-escalation.
          This signal is provided to the analytical TACO assessment as an additional input alongside reversibility, rhetoric, diplomatic, and market indicators.
          ${readyCount < 4 ? '<br><span style="color:#f59e0b;">⚠ Only ' + readyCount + '/' + totalModels + ' models active — signal reliability limited.</span>' : ''}
        </div>
      `;
    }
  };
  // Run it now if charts are rendering (tab is visible)
  window._computeStatModelConsensus();
}
