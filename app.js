// BlankBall Manager v0.9 (split build)
(() => {
console.log('v0.9 loaded (split)');

const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const choice=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=n=>'€ '+n.toLocaleString('nl-NL');
const DIV_NAME={5:'5e divisie',4:'4e divisie',3:'3e divisie',2:'Hoofdklasse',1:'Kampioen Divisie'};
const POS=['GK','DEF','MID','ATT'];

let state={
  clubName:'Your FC',
  season:1, division:5,
  budget:750_000,
  training:1,youth:1,scouting:1,stadium:1,
  squad:[], aiClubs:[],
  fixtures:[], table:[], matchday:1,
  market:[], youthPool:[], offers:[],
  tactics:{ style:'defensive', formation:'4-3-3' },
  lineup:Array(11).fill(null), bench:Array(6).fill(null),
  filters:{pos:'ALL',status:'ALL',ovr:'ALL',search:''},
  sponsors:{active:null, offers:[]}, sponsorProgress:{wins:0,points:0,goals:0},
  cup:{eligible:false, active:false, round:0, teams:[], fixtures:[], history:[]}
};

const saveKey='blankball-save-v090';
function save(){ localStorage.setItem(saveKey, JSON.stringify(state)); alert('Opgeslagen.'); }
function load(){ const raw=localStorage.getItem(saveKey); if(raw){ try{state=JSON.parse(raw);}catch(e){ console.warn('Save corrupt -> nieuw'); } } }
function reset(){ if(confirm('Weet je zeker?')){ localStorage.removeItem(saveKey); location.reload(); } }

const NAMES={first:['Jan','Piet','Klaas','Noah','Milan','Sem','Lucas','Daan','Levi','Luuk','Jayden','Finn','Mees','Jesse','Mats','Owen','Max','Jens','Thijs','Niek','Bram','Timo','Rayan','Sven','Koen','Siem','Lars','Ruben','Tom','Niels','Gijs','Joep','Damian','Mauro','Tijn'],
last:['Jansen','de Vries','van Dijk','Bakker','Visser','Smit','Mulder','de Boer','de Groot','van den Berg','Kuipers','Hendriks','Dekker','Willems','Meijer','Vos','Peters','de Leeuw','Schouten','Bos','van Dam','Hoekstra','Verbeek','Willemse','van Ginkel','Koster','Jacobs','Maas','Post','Schipper']};
const clubPool=['Waalwijk Town','Breda City','Ajax Amateurs','Zwolle Noord','FC Polder','Rijnsburg','Maasland','Kustboys','IJsselmeer SC','Brabant United','Veluwe Rangers','Rotterdam Rovers','NAC Old Boys','Tilburg Tigers','Gouda United','Lek Boys','Merwe Rangers'];

function rndName(){return choice(NAMES.first)+' '+choice(NAMES.last);}
function roman(n){const r=['','I','II','III','IV','V']; return r[n]||String(n);}
function baseOverall(posBias){ return clamp(Math.round(rand(35,55)+posBias+state.division*2),30,85); }
function wageFromOvr(ovr){ return (ovr*ovr*8)+rand(500,2000); }
function valueFromOvr(ovr){ return (ovr**2)*120 + rand(10_000,80_000); }

function genPlayer(pos){
  const bias={GK:0,DEF:2,MID:3,ATT:4}[pos]||0;
  const ovr=baseOverall(bias); const pot=clamp(ovr+rand(5,25)+state.youth*2,ovr+2,99);
  const age=rand(16,34);
  const p={id:rid(),name:rndName(),age,pos,ovr,pot,
    pace:clamp(rand(30,90)+(pos==='ATT'?8:0),20,99),
    passing:clamp(rand(30,90)+(pos==='MID'?8:0),20,99),
    shooting:clamp(rand(25,88)+(pos==='ATT'?10:0),15,99),
    defense:clamp(rand(25,88)+(pos==='DEF'?10:0),15,99),
    stamina:clamp(rand(40,95),20,99),
    keeping:clamp(rand(20,90)+(pos==='GK'?15:0),10,99),
    wage:0,value:0,contract:rand(1,3),listed:false,injured:0,suspended:0,yellows:0,reds:0,apps:0
  };
  p.wage=Math.round(wageFromOvr(p.ovr)/52); p.value=Math.round(valueFromOvr(p.ovr)); return p;
}
function rid(){ try{return [...crypto.getRandomValues(new Uint32Array(3))].map(x=>x.toString(16)).join('');}catch{return String(Math.random()).slice(2)} }

function genInitialSquad(){
  const s=[]; s.push(genPlayer('GK')); s.push(genPlayer('GK'));
  for(let i=0;i<7;i++) s.push(genPlayer('DEF'));
  for(let i=0;i<7;i++) s.push(genPlayer('MID'));
  for(let i=0;i<4;i++) s.push(genPlayer('ATT'));
  s.sort((a,b)=>b.ovr-a.ovr); for(let i=0;i<3;i++) s[i].ovr+=4; return s;
}
function genAIClubs(){
  const count=12, arr=[];
  for(let i=0;i<count-1;i++){
    arr.push({id:rid(),name:clubPool[i%clubPool.length]+' '+roman(6-state.division),
      rating:clamp(55+(5-state.division)*4+rand(-6,6),40,85),points:0,gf:0,ga:0,gd:0});
  }
  return arr;
}

function divisionName(){ return DIV_NAME[state.division]||`Divisie ${state.division}`; }

function scheduleFixtures(){
  const teams=[{id:'you',name:state.clubName,rating:avgOvrEffective(state.squad)}].concat(state.aiClubs.map(c=>({id:c.id,name:c.name,rating:c.rating})));
  let n=teams.length; if(n%2===1){teams.push({id:'bye',name:'BYE',rating:0}); n++;}
  const half=n/2, rotation=teams.slice(1), rounds=n-1; const fixtures=[];
  for(let r=0;r<rounds;r++){
    const left=[teams[0]].concat(rotation.slice(0,half-1));
    const right=rotation.slice(half-1).reverse();
    for(let i=0;i<half;i++){
      const home=(r%2===0)?left[i]:right[i], away=(r%2===0)?right[i]:left[i];
      if(home.id==='bye'||away.id==='bye') continue;
      fixtures.push({home:home.id,away:away.id,md:r+1});
    }
    rotation.unshift(rotation.pop());
  }
  const second=fixtures.map(f=>({home:f.away,away:f.home,md:f.md+rounds}));
  const all=fixtures.concat(second).map(f=>({id:rid(),md:f.md,played:false,home:f.home,away:f.away,
    homeName:f.home==='you'?state.clubName:state.aiClubs.find(x=>x.id===f.home)?.name||'?',
    awayName:f.away==='you'?state.clubName:state.aiClubs.find(x=>x.id===f.away)?.name||'?',score:null}));
  state.fixtures=all;
  state.table=[{id:'you',name:state.clubName,pts:0,gf:0,ga:0,gd:0}, ...state.aiClubs.map(c=>({id:c.id,name:c.name,pts:0,gf:0,ga:0,gd:0}))];
  state.matchday=1;
}

function avgOvr(sq){return Math.round(sq.reduce((a,b)=>a+b.ovr,0)/sq.length);}
function avgOvrEffective(sq){
  const active=sq.filter(p=>p.injured<=0&&p.suspended<=0);
  if(active.length===0) return Math.round(avgOvr(sq)*0.65);
  let base=Math.round(active.reduce((a,b)=>a+b.ovr,0)/active.length);
  const missing=sq.length-active.length;
  return Math.max(30,Math.round(base-missing*1.8));
}
function tacticsModifiers(){
  const st=state.tactics.style, fm=state.tactics.formation;
  let fbonus=0; if(fm==='3-5-2') fbonus=1; if(fm==='4-3-3') fbonus=0.5;
  if(st==='defensive') return {ratingBonus:2+fbonus, goalMul:0.95, concedeBias:-0.05};
  if(st==='possession') return {ratingBonus:3+fbonus, goalMul:1.05, concedeBias:-0.02};
  if(st==='attacking') return {ratingBonus:1+fbonus, goalMul:1.15, concedeBias:+0.06};
  return {ratingBonus:0, goalMul:1, concedeBias:0};
}
function lambdaFromRating(a,b){const diff=a-b; const base=1.1; return clamp(base+diff/50,0.4,2.2);}
function poisson(l){l=Math.max(0.05,l); let L=Math.exp(-l),k=0,p=1; do{k++;p*=Math.random();}while(p>L); return k-1;}
function playMatch(hr,ar,homeIsYou,awayIsYou){
  const homeAdv=3; let H=hr+(homeIsYou?homeAdv:0), A=ar+(awayIsYou?homeAdv:0), gb=1.2, bias=0;
  if(homeIsYou||awayIsYou){ const m=tacticsModifiers(); if(homeIsYou){H+=m.ratingBonus; gb*=m.goalMul; bias+=-m.concedeBias;} if(awayIsYou){A+=m.ratingBonus; gb*=m.goalMul; bias+=m.concedeBias;} }
  const hg=poisson(lambdaFromRating(H,A)*gb + bias);
  const ag=poisson(lambdaFromRating(A,H)*gb - bias);
  return [hg,ag];
}
function addResult(idA,ga,idB,gb){
  const tA=state.table.find(t=>t.id===idA), tB=state.table.find(t=>t.id===idB); if(!tA||!tB) return;
  tA.gf+=ga; tA.ga+=gb; tA.gd=tA.gf-tA.ga; tB.gf+=gb; tB.ga+=ga; tB.gd=tB.gf-tB.ga;
  if(ga>gb) tA.pts+=3; else if(ga<gb) tB.pts+=3; else {tA.pts+=1; tB.pts+=1;}
}

function playNextMatchday(){
  const md=state.matchday, todays=state.fixtures.filter(f=>!f.played&&f.md===md);
  if(todays.length===0){ endSeason(); return; }
  const youRate=avgOvrEffective(state.squad);
  state.squad.forEach(p=>{ if(p.suspended>0) p.suspended=Math.max(0,p.suspended-1); });

  let youHadMatch=false, youHome=false;
  todays.forEach(f=>{
    const homeYou=(f.home==='you'), awayYou=(f.away==='you');
    let hr=homeYou?youRate:(state.aiClubs.find(c=>c.id===f.home)?.rating||60);
    let ar=awayYou?youRate:(state.aiClubs.find(c=>c.id===f.away)?.rating||60);
    if(homeYou||awayYou){
      youHadMatch=true; youHome=homeYou;
      const starters=pickStartingXI(); starters.forEach(p=>p.apps++); simulateCardsFor(starters);
      const subRes=makeAutoSubs(starters); if(subRes.count>0){ if(homeYou) hr+=subRes.boost; else ar+=subRes.boost; toast(`Automatische wissels: ${subRes.count} (+${subRes.boost.toFixed(1)})`); }
    }
    if(!homeYou) hr+=Math.random()*1.0; if(!awayYou) ar+=Math.random()*1.0;
    const res=playMatch(hr,ar,homeYou,awayYou); f.score=res; f.played=true; addResult(f.home,res[0],f.away,res[1]);
    if(homeYou||awayYou){ if(res[0]!==res[1]){ if((homeYou&&res[0]>res[1])||(awayYou&&res[1]>res[0])) state.sponsorProgress.wins++; } state.sponsorProgress.points+=(res[0]>res[1]?3:res[0]===res[1]?1:0); state.sponsorProgress.goals+=(homeYou?res[0]:res[1]);}
  });

  const weekly=state.squad.reduce((a,p)=>a+p.wage,0); state.budget=Math.max(0,state.budget-weekly);
  if(youHadMatch){ const rev=matchdayRevenue(youHome); state.budget+=rev; toast(`Inkomsten speeldag: ${fmt(rev)}${state.sponsors.active?` • Sponsor ${fmt(state.sponsors.active.baseWeekly)}`:''}`); if(state.sponsors.active) state.budget+=state.sponsors.active.baseWeekly; }
  injuriesTick(); trainTick(); generateOffersTick();
  state.matchday++; render();
}

function injuriesTick(){
  state.squad.forEach(p=>{ if(p.injured>0) p.injured=Math.max(0,p.injured-1); });
  const hadMatch=state.fixtures.some(f=>f.md===state.matchday&&(f.home==='you'||f.away==='you'));
  if(!hadMatch) return;
  const baseProb=0.12 - state.training*0.015;
  if(Math.random()<baseProb){
    const cands=state.squad.filter(p=>p.injured<=0);
    if(cands.length){ const p=choice(cands); const w=rand(1, Math.random()<0.2?6:3); p.injured=w; toast(`${p.name} geblesseerd (${w} wk)`); }
  }
}
function trainTick(){
  const f=0.15+state.training*0.05;
  state.squad.forEach(p=>{
    if(p.age<33 && p.ovr<p.pot && p.injured===0){
      if(Math.random()<f){ p.ovr=clamp(p.ovr+1,20,99); const stat=choice(['pace','passing','shooting','defense','stamina','keeping']); p[stat]=clamp(p[stat]+1,1,99); p.value=Math.round(valueFromOvr(p.ovr)); p.wage=Math.round(wageFromOvr(p.ovr)/52); }
    }
  });
}

function refreshMarket(){
  const size=18, arr=[];
  for(let i=0;i<size;i++){ const pos=choice(POS); const p=genPlayer(pos); p.ovr=clamp(p.ovr+rand(0,state.scouting),20,95); p.pot=clamp(Math.max(p.pot,p.ovr+rand(3,15)),p.ovr+1,99); arr.push(p); }
  state.market=arr;
}
function buyPlayer(id){
  const p=state.market.find(x=>x.id===id); if(!p) return; const fee=Math.round(p.value*(0.85+Math.random()*0.6));
  if(state.budget<fee){ alert('Onvoldoende budget.'); return; }
  state.budget-=fee; state.squad.push(p); state.market=state.market.filter(x=>x.id!==id); render();
}
function releasePlayer(id){ const i=state.squad.findIndex(x=>x.id===id); if(i>-1 && confirm('Contract ontbinden?')){ state.squad.splice(i,1); render(); } }
function toggleList(id){ const p=state.squad.find(x=>x.id===id); if(p){ p.listed=!p.listed; render(); } }
function generateOffersTick(){
  const listed=state.squad.filter(p=>p.listed); if(!listed.length) return;
  listed.forEach(p=>{ const prob=0.18+state.scouting*0.02; if(Math.random()<prob){ const club=choice(state.aiClubs); const base=p.value*(0.8+Math.random()*0.6); state.offers.push({id:rid(),playerId:p.id,playerName:p.name,club:club.name,amount:Math.round(base),wageRelief:p.wage}); } });
}
function acceptOffer(id){ const o=state.offers.find(x=>x.id===id); if(!o) return; const idx=state.squad.findIndex(p=>p.id===o.playerId); if(idx===-1) return; state.budget+=o.amount; state.squad.splice(idx,1); state.offers=state.offers.filter(x=>x.id!==id); toast(`Verkocht: ${o.playerName} voor ${fmt(o.amount)}`); render(); }
function rejectOffer(id){ state.offers=state.offers.filter(x=>x.id!==id); render(); }

// Facilities & tickets
function facCost(kind,lvl){ const base={training:300_000,youth:350_000,scouting:250_000,stadium:800_000}[kind]; return Math.round(base*(1+(lvl-1)*0.55)*(6-state.division)*0.9); }
function upgrade(kind){ const cur=state[kind]; if(cur>=10) return alert('Max niveau 10'); const cost=facCost(kind,cur+1); if(state.budget<cost) return alert('Onvoldoende budget'); state.budget-=cost; state[kind]++; render(); }
const STADIUM_LVL=[0,800,1200,2500,5000,10000,18000,26000,35000,42000,50000];
const DIV_CAP={5:1200,4:5000,3:12000,2:25000,1:50000};
function stadiumCapacity(l){ const lvl=STADIUM_LVL[clamp(l,1,10)], cap=DIV_CAP[state.division]||1200; return Math.min(lvl,cap); }
function ticketPrice(){ return 10+(6-state.division)*3; }
function baseDemand(){ return 300+(6-state.division)*2500; }
function matchdayRevenue(home){
  const cap=stadiumCapacity(state.stadium); let d=baseDemand()+rand(-600,1000);
  let att=home?Math.min(cap,Math.max(150,Math.round(d))):Math.round(Math.min(cap,d)*0.35);
  const tickets=att*ticketPrice(), food=Math.round(att*(state.stadium>=6?5.5:4.0)), merch=Math.round(att*(state.division<=2?2.5:1.2));
  const gross=tickets+food+merch; return home?gross:Math.round(gross*0.25);
}

// Youth
function generateYouthPool(){
  const c=2+Math.ceil(state.youth/2), arr=[];
  for(let i=0;i<c;i++){ const pos=choice(POS); const p=genPlayer(pos); p.age=rand(15,18); p.ovr=clamp(rand(30,45)+state.youth,25,75); p.pot=clamp(p.ovr+rand(10,30)+state.youth,p.ovr+8,99); p.value=Math.round(valueFromOvr(p.ovr)*0.4); p.wage=Math.max(200,Math.round(p.wage*0.4)); arr.push(p); }
  state.youthPool=arr;
}
function signYouth(id){ const p=state.youthPool.find(x=>x.id===id); if(!p) return; if(state.squad.length>=32) return alert('Selectie vol (32)'); state.squad.push(p); state.youthPool=state.youthPool.filter(x=>x.id!==id); render(); }

// Sponsors
function genSponsorOffers(){
  const brands=['EnergyUp','Kaas&Co','TechNova','SfeerShots','PixelPro','GreenBank','AirNL','Spurt','StadionShop','CryptoCat'];
  const arr=[]; for(let i=0;i<3;i++){ const brand=choice(brands);
    const baseWeekly=Math.round((8000+(6-state.division)*6000)*(0.8+Math.random()*0.6));
    const t=choice(['wins','points','goals','position']); let target,label;
    if(t==='wins'){target=10-(state.division-1); label=`Behaal ${target} overwinningen`; }
    if(t==='points'){target=45-(state.division-1)*5; label=`Behaal ${target} punten`; }
    if(t==='goals'){target=40-(state.division-1)*5; label=`Scoor ${target} goals`; }
    if(t==='position'){target=Math.max(1,6-(5-state.division)); label=`Eindig ${target}e of beter`; }
    const bonus=Math.round(baseWeekly*10*(1+Math.random()*0.5));
    arr.push({id:rid(),brand,baseWeekly,objective:{type:t,target,label},bonus});
  }
  state.sponsors.offers=arr; if(!state.sponsors.active) state.sponsors.active=null;
}
function acceptSponsor(id){ const o=state.sponsors.offers.find(x=>x.id===id); if(!o) return; state.sponsors.active=o; state.sponsors.offers=state.sponsors.offers.filter(x=>x.id!==id); toast(`Sponsor: ${o.brand} (${fmt(o.baseWeekly)}/wk)`); }
function cancelSponsor(){ if(state.sponsors.active && confirm('Sponsor opzeggen?')) state.sponsors.active=null; }
function sponsorProgressText(){
  const a=state.sponsors.active; if(!a) return '—';
  const sp=state.sponsorProgress; const {type,target}=a.objective; let have=0;
  if(type==='wins') have=sp.wins; if(type==='points') have=sp.points; if(type==='goals') have=sp.goals;
  if(type==='position'){ const pos=state.table.slice().sort((x,y)=>y.pts-x.pts||y.gd-x.gd||y.gf-x.gf).findIndex(t=>t.id==='you')+1; have=pos? (pos<=target?target:pos):0; return `Huidige positie: ${have} • Doel: ≤ ${target}`; }
  return `Voortgang: ${have}/${target}`;
}

// Contracts
function desiredWage(p){
  const base=Math.round(wageFromOvr(p.ovr)/52);
  const ageAdj=(p.age<=22?1.1:(p.age>=30?0.95:1.0));
  const divAdj=(6-state.division)*0.06+1;
  return Math.round(base*ageAdj*divAdj);
}
function negotiateContract(id){
  const p=state.squad.find(x=>x.id===id); if(!p) return;
  const ask=desiredWage(p);
  const yearsStr=prompt(`${p.name} — huidige: ${p.contract} jr • ${fmt(p.wage)}/wk\nGewenst: ≈ ${fmt(ask)}/wk\nVoer contractduur in (1–4 jaar):`, Math.min(3, Math.max(1,p.contract||2)));
  if(!yearsStr) return; const years=clamp(parseInt(yearsStr)||2,1,4);
  const wageStr=prompt(`Voer weekloon in voor ${p.name} (gewenst ≈ ${fmt(ask)}):`, ask);
  if(!wageStr) return; const wage=Math.max(200, parseInt(wageStr)||ask);
  const generosity = wage/ask;
  let acceptChance = 0.2 + (generosity-0.9)*0.9;
  if(state.division<=2) acceptChance+=0.05;
  if(years>=3) acceptChance+=0.05;
  acceptChance=clamp(acceptChance,0.02,0.98);
  if(Math.random()<acceptChance){
    const bonus = wage*2;
    if(state.budget<bonus) { alert('Onvoldoende budget voor tekenbonus.'); return; }
    state.budget-=bonus;
    p.contract=years; p.wage=wage;
    toast(`Contract getekend: ${p.name} • ${years} jr • ${fmt(wage)}/wk (tekenbonus ${fmt(bonus)})`);
  }else{
    const hint=Math.round(ask*1.05);
    alert(`${p.name} weigert. Tip: probeer ≥ ${fmt(hint)} of langere duur.`);
  }
  render();
}

// Formations
const FORMATIONS={'4-3-3':{DEF:4,MID:3,ATT:3}, '4-4-2':{DEF:4,MID:4,ATT:2}, '3-5-2':{DEF:3,MID:5,ATT:2}};
function pickStartingXI(){
  ensureArrays();
  const ids=state.lineup.filter(Boolean);
  let xi=ids.map(id=>state.squad.find(p=>p.id===id)).filter(Boolean).filter(p=>p.injured<=0&&p.suspended<=0);
  const need=Object.assign({GK:1,DEF:4,MID:4,ATT:2}, FORMATIONS[state.tactics.formation]||{});
  if(xi.filter(p=>p.pos==='GK').length<1){
    const gk=bestOf(poolAvail().filter(p=>p.pos==='GK'),1); xi=xi.concat(gk);
  }
  const addPos=(pos,c)=>{ const have=xi.filter(p=>p.pos===pos).length; if(have<c){ xi=xi.concat(bestOf(poolAvail().filter(p=>p.pos===pos), c-have)); } };
  addPos('DEF',need.DEF); addPos('MID',need.MID); addPos('ATT',need.ATT);
  while(xi.length<11){ const rest=poolAvail(); if(!rest.length) break; xi.push(rest.shift()); }
  return xi.slice(0,11);

  function poolAvail(){ return state.squad.filter(p=>p.injured<=0&&p.suspended<=0 && !xi.some(x=>x.id===p.id)).slice().sort((a,b)=>b.ovr-a.ovr); }
  function bestOf(arr,n){ return arr.slice(0,n); }
}

// Cup
function cupEligible(){ return state.division<=3; }
function genCupTeams(){
  const teams=[{id:'you',name:state.clubName,div:state.division, rating:avgOvrEffective(state.squad)}];
  while(teams.length<32){
    const div=choice([1,2,3]);
    const name=choice(clubPool)+' ' + (div===1?'A':div===2?'B':'C');
    const rating= clamp(65+(3-div)*6 + rand(-5,5), 50, 90);
    teams.push({id:rid(),name,div,rating});
  }
  return teams;
}
function cupResetStart(){
  state.cup.eligible=cupEligible();
  if(!state.cup.eligible){ state.cup={eligible:false,active:false,round:0,teams:[],fixtures:[],history:[]}; return; }
  state.cup.active=true; state.cup.round=32; state.cup.teams=genCupTeams(); state.cup.fixtures=[]; state.cup.history=[];
}
function cupDraw(){
  if(!state.cup.active) return;
  const pool=state.cup.teams.slice();
  shuffle(pool);
  const fx=[];
  for(let i=0;i<pool.length;i+=2){
    const A=pool[i],B=pool[i+1];
    fx.push({id:rid(),home:A.id,away:B.id,homeName:A.name,awayName:B.name,played:false,score:null});
  }
  state.cup.fixtures=fx;
  toast(`Beker loting: ${fx.length} wedstrijden (${state.cup.round}-finale)`);
}
function cupPlayRound(){
  const fx=state.cup.fixtures; if(!fx || fx.length===0){ alert('Geen loting nog.'); return; }
  const youRate=avgOvrEffective(state.squad);
  const nextTeams=[];
  fx.forEach(f=>{
    let hr=(f.home==='you')?youRate:(state.cup.teams.find(t=>t.id===f.home)?.rating||60);
    let ar=(f.away==='you')?youRate:(state.cup.teams.find(t=>t.id===f.away)?.rating||60);
    const res=playMatch(hr,ar,f.home==='you',f.away==='you'); f.score=res; f.played=true;
    let winHome = res[0]>res[1]; if(res[0]===res[1]){ winHome = Math.random()<0.5; }
    const winnerId=winHome?f.home:f.away;
    nextTeams.push(state.cup.teams.find(t=>t.id===winnerId));
  });
  const roundPrize={32:80_000,16:120_000,8:200_000,4:320_000,2:600_000,1:1_000_000}[state.cup.round]||80_000;
  const youInFx = fx.find(f=>f.home==='you'||f.away==='you');
  if(youInFx){
    const youWon = (youInFx.score[0]>youInFx.score[1] && youInFx.home==='you') || (youInFx.score[1]>youInFx.score[0] && youInFx.away==='you') || (youInFx.score[0]===youInFx.score[1] && Math.random()<0.5);
    if(youWon){ state.budget += roundPrize; toast(`Beker: door naar volgende ronde! Prijs: ${fmt(roundPrize)}`); }
    else { toast('Beker: uitgeschakeld.'); }
  }
  state.cup.history.push(...fx);
  state.cup.teams=nextTeams;
  if(nextTeams.length===1){
    const winner=nextTeams[0];
    const bonus=1_000_000;
    if(winner.id==='you'){ state.budget+=bonus; alert(`Je wint de Beker! Bonus ${fmt(bonus)}.`); }
    state.cup.active=false; state.cup.round=0; state.cup.fixtures=[];
  }else{
    state.cup.round = nextTeams.length;
    state.cup.fixtures=[];
  }
  render();
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

// XI & DnD
function ensureArrays(){ if(!Array.isArray(state.lineup)) state.lineup=Array(11).fill(null); if(!Array.isArray(state.bench)) state.bench=Array(6).fill(null); }
function removeEverywhere(pid){ if(!pid) return; const li=state.lineup.indexOf(pid); if(li>-1) state.lineup[li]=null; const bi=state.bench.indexOf(pid); if(bi>-1) state.bench[bi]=null; }
function toggleXI(id){
  ensureArrays(); const p=state.squad.find(x=>x.id===id); if(!p||p.injured>0||p.suspended>0) return;
  const idx=state.lineup.indexOf(id); if(idx>-1){ state.lineup[idx]=null; } else{ const free=state.lineup.findIndex(x=>!x); if(free===-1) return alert('Je XI zit vol (11)'); removeEverywhere(id); state.lineup[free]=id; } render();
}
function autoXI(){ ensureArrays(); const best=pickStartingXI().map(p=>p.id); for(let i=0;i<11;i++) state.lineup[i]=best[i]||null; render(); }
function clearXI(){ ensureArrays(); for(let i=0;i<11;i++) state.lineup[i]=null; render(); }
function clearBench(){ ensureArrays(); for(let i=0;i<6;i++) state.bench[i]=null; render(); }
function dragStart(e,from,id,slot){ state._drag={from,id,slot}; }
function dropToXI(e,idx){ e.preventDefault(); ensureArrays(); const d=state._drag||{}; const p=state.squad.find(x=>x.id===d.id); if(!p||p.injured>0||p.suspended>0) return; removeEverywhere(p.id); state.lineup[idx]=p.id; render(); }
function dropToBench(e,idx){ e.preventDefault(); ensureArrays(); const d=state._drag||{}; const p=state.squad.find(x=>x.id===d.id); if(!p||p.injured>0||p.suspended>0) return; removeEverywhere(p.id); state.bench[idx]=p.id; render(); }

// Cards/Subs
function simulateCardsFor(starters){
  starters.forEach(p=>{ let y=0, r=false; if(Math.random()<0.08) y=1; if(Math.random()<0.015) r=true; if(!r&&y===1&&Math.random()<0.03) r=true; p.yellows+=y; if(r){p.reds+=1;p.suspended+=1;} if(y>0&&p.yellows%5===0) p.suspended+=1; });
}
function makeAutoSubs(starters){
  const bench=state.bench.map(id=>state.squad.find(p=>p.id===id)).filter(p=>p&&p.injured<=0&&p.suspended<=0);
  const maxAllowed=Math.min(5,bench.length), desired=Math.max(0,Math.min(maxAllowed,3+Math.floor(Math.random()*3))); if(desired===0) return {count:0,boost:0};
  const subs=bench.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,desired), field=starters.slice(); const replaced=[];
  subs.forEach(sub=>{ let cands=field.filter(p=>p.pos===sub.pos); if(!cands.length) cands=field.slice(); cands.sort((a,b)=>a.ovr-b.ovr); const t=cands[0]; if(t){ replaced.push(t); const idx=field.findIndex(x=>x.id===t.id); if(idx>-1) field.splice(idx,1); } sub.apps++; });
  const avg=a=>a.length?a.reduce((s,p)=>s+p.ovr,0)/a.length:0; const boost=Math.max(0,(avg(subs)-avg(replaced))/8); return {count:subs.length,boost};
}

// End season
function endSeason(){
  state.table.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  const pos=state.table.findIndex(t=>t.id==='you')+1;
  let msg=`Seizoen ${state.season} klaar. Positie: ${pos}/${state.table.length}.`;
  const prize=Math.round(800_000/state.division*(state.table.length-pos+1)*0.6); state.budget+=prize; msg+=`\nPrijzengeld: ${fmt(prize)}`;
  if(state.sponsors.active){ const a=state.sponsors.active; const sp=state.sponsorProgress; const t=a.objective; let ok=false;
    if(t.type==='wins') ok=sp.wins>=t.target; if(t.type==='points') ok=sp.points>=t.target; if(t.type==='goals') ok=sp.goals>=t.target; if(t.type==='position') ok=pos<=t.target;
    if(ok){ state.budget+=a.bonus; msg+=`\nSponsorbonus: ${fmt(a.bonus)} (doel gehaald)`; } else msg+='\nSponsorbonus gemist.'; }
  if(pos<=2 && state.division>1){ state.division--; msg+=`\nPROMOTIE → ${divisionName()}`; }
  else if(pos>=state.table.length-1 && state.division<5){ state.division++; msg+=`\nDegradatie → ${divisionName()}`; }
  state.squad.forEach(p=>{ p.age++; if(p.contract>0) p.contract--; if(p.injured>0) p.injured=Math.max(0,p.injured-1); p.suspended=0; p.yellows=0; p.reds=0; p.apps=0; });
  state.squad=state.squad.filter(p=>{ if(p.contract<=0 && Math.random()<0.5) return false; if(p.age<=26) p.ovr=clamp(p.ovr+rand(0,2),1,99); if(p.age>=31) p.ovr=clamp(p.ovr-rand(0,2),1,99); p.value=Math.round(valueFromOvr(p.ovr)); p.wage=Math.round(wageFromOvr(p.ovr)/52); return true; });
  alert(msg);
  state.season++; state.sponsorProgress={wins:0,points:0,goals:0};
  genSponsorOffers(); state.aiClubs=genAIClubs(); scheduleFixtures(); refreshMarket(); generateYouthPool(); state.offers=[];
  cupResetStart();
  render();
}

// Views
function viewSquad(){
  const posOps=['ALL','GK','DEF','MID','ATT'], statOps=['ALL','FIT','INJ','SUS','LISTED'], ovrOps=['ALL','50+','60+','70+'];
  const posChips=posOps.map(p=>`<span class="chip ${state.filters.pos===p?'active':''}" data-pos="${p}">${p}</span>`).join('');
  const statChips=statOps.map(s=>{const L={ALL:'Alle',FIT:'Fit',INJ:'Blessure',SUS:'Schors',LISTED:'Op TL'}[s];return `<span class="chip ${state.filters.status===s?'active':''}" data-status="${s}">${L}</span>`}).join('');
  const ovrChips=ovrOps.map(o=>`<span class="chip ${state.filters.ovr===o?'active':''}" data-ovr="${o}">${o}</span>`).join('');
  let list=state.squad.slice();
  if(state.filters.pos!=='ALL') list=list.filter(p=>p.pos===state.filters.pos);
  if(state.filters.status==='FIT') list=list.filter(p=>p.injured===0&&p.suspended===0);
  if(state.filters.status==='INJ') list=list.filter(p=>p.injured>0);
  if(state.filters.status==='SUS') list=list.filter(p=>p.suspended>0);
  if(state.filters.status==='LISTED') list=list.filter(p=>p.listed);
  if(state.filters.ovr!=='ALL'){ const t=parseInt(state.filters.ovr); list=list.filter(p=>p.ovr>=t); }
  const q=state.filters.search.toLowerCase().trim(); if(q) list=list.filter(p=>`${p.name} ${p.pos}`.toLowerCase().includes(q));
  const rows=list.sort((a,b)=>b.ovr-a.ovr).map(p=>`<tr>
    <td class="pos">${p.pos}</td>
    <td><strong>${p.name}</strong>
      <div class="muted">${p.age} jr • Pot ${p.pot}
        ${p.listed?'<span class=tag>TL</span>':''}
        ${p.injured>0?`<span class=tag style="background:#2a1720;color:#ff9fb3;border-color:#ff9fb3">Blessure ${p.injured}w</span>`:''}
        ${p.suspended>0?`<span class=tag style="background:#2a202f;color:#fbbf24;border-color:#fbbf24">Schors ${p.suspended}w</span>`:''}
      </div>
    </td>
    <td>${p.ovr}</td><td>${p.pace}</td><td>${p.passing}</td><td>${p.shooting}</td><td>${p.defense}</td>
    <td>${p.apps}</td>
    <td>${p.contract} jr</td>
    <td class="money nowrap">${fmt(p.wage)}/w</td>
    <td class="money">${fmt(p.value)}</td>
    <td>
      <button onclick="app.negotiate('${p.id}')">Contract</button>
      <button onclick="app.release('${p.id}')">Ontbind</button>
      <button class="secondary" onclick="app.toggleList('${p.id}')">${p.listed?'Van TL':'Op TL'}</button>
    </td>
  </tr>`).join('');
  const inj=state.squad.filter(p=>p.injured>0).length, sus=state.squad.filter(p=>p.suspended>0).length;
  return `<div class="grid grid-2">
    <div class="card">
      <h2>Selectie (${state.squad.length}) — Gem. OVR ${avgOvr(state.squad)} ${inj?`<span class=tag>${inj} blessures</span>`:''} ${sus?`<span class=tag>${sus} schorsingen</span>`:''}</h2>
      <div class="chips" id="posChips">${posChips}</div>
      <div class="chips" id="statusChips" style="margin-top:6px">${statChips}</div>
      <div class="chips" id="ovrChips" style="margin:6px 0">${ovrChips}</div>
      <input id="searchInput" placeholder="Zoek speler/positie..." style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#0f1728;color:#e5e7eb;margin:6px 0" value="${state.filters.search.replace(/"/g,'&quot;')}">
      <table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>PAC</th><th>PAS</th><th>SHO</th><th>DEF</th><th>Apps</th><th>Contract</th><th>Loon</th><th>Waarde</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card">
      <h2>Teamsterkte</h2>
      <div class="progress" style="margin-top:10px"><span style="width:${avgOvrEffective(state.squad)}%"></span></div>
      <div class="muted" style="margin-top:6px">Effectieve sterkte (blessures & schorsingen meegerekend).</div>
    </div>
  </div>`;
}

function viewTactics(){
  const style=state.tactics.style, form=state.tactics.formation;
  const styleChips=[['defensive','Zeer verdedigend'],['possession','Balbezit'],['attacking','Zeer aanvallend']].map(([k,l])=>`<span class="chip ${style===k?'active':''}" data-style="${k}">${l}</span>`).join('');
  const formChips=Object.keys(FORMATIONS).map(k=>`<span class="chip ${form===k?'active':''}" data-form="${k}">${k}</span>`).join('');
  const selectedXI=new Set(state.lineup.filter(Boolean)), selectedBench=new Set(state.bench.filter(Boolean));
  const rows=state.squad.slice().sort((a,b)=>b.ovr-a.ovr).map(p=>{
    const disabled=(p.injured>0||p.suspended>0), onXI=selectedXI.has(p.id), onB=selectedBench.has(p.id);
    const tags=[onXI?'<span class=tag>XI</span>':'',onB?'<span class=tag>Bank</span>':'',p.listed?'<span class=tag>TL</span>':'',p.injured>0?`<span class=tag style="background:#2a1720;color:#ff9fb3;border-color:#ff9fb3">Blessure ${p.injured}w</span>`:'',p.suspended>0?`<span class=tag style="background:#2a202f;color:#fbbf24;border-color:#fbbf24">Schors ${p.suspended}w</span>`:''].filter(Boolean).join(' ');
    return `<tr class="${disabled?'':'draggable'}" draggable="${!disabled}" ondragstart="app.dragStart(event,'pool','${p.id}')"
      ${disabled?"style='opacity:.6'":''}><td class="pos">${p.pos}</td><td><strong>${p.name}</strong><div class="muted">${p.ovr} OVR • ${p.age} jr ${tags}</div></td>
      <td>${p.pace}</td><td>${p.passing}</td><td>${p.shooting}</td><td>${p.defense}</td>
      <td><button ${disabled?'disabled':''} class="${onXI?'primary':''}" onclick="app.toggleXI('${p.id}')">${onXI?'In XI':'Naar XI'}</button></td></tr>`;
  }).join('');
  const xi=Array.from({length:11},(_,i)=>state.lineup[i]||null);
  const xiSlots=xi.map((pid,idx)=>{ const p=pid?state.squad.find(s=>s.id===pid):null; return `<div class="slot ${p?'filled':''}" ondragover="event.preventDefault()" ondrop="app.dropToXI(event,${idx})">${p?`<div class="chip">${p.pos} • ${p.name} (${p.ovr})</div> <button style="margin-left:8px" onclick="app.clearSlotXI(${idx})">×</button>`:'<span class="muted">Drop hier</span>'}</div>` }).join('');
  const bench=Array.from({length:6},(_,i)=>state.bench[i]||null);
  const benchSlots=bench.map((pid,idx)=>{ const p=pid?state.squad.find(s=>s.id===pid):null; return `<div class="slot ${p?'filled':''}" ondragover="event.preventDefault()" ondrop="app.dropToBench(event,${idx})">${p?`<div class="chip">${p.pos} • ${p.name} (${p.ovr})</div> <button style="margin-left:8px" onclick="app.clearSlotBench(${idx})">×</button>`:'<span class="muted">Bank</span>'}</div>` }).join('');
  return `<div class="grid grid-2">
    <div class="card">
      <h2>Opstelling — drag & drop</h2>
      <div class="hint">XI: <strong>${state.lineup.filter(Boolean).length}</strong>/11 • Bank: <strong>${state.bench.filter(Boolean).length}</strong>/6</div>
      <div style="display:flex;gap:8px;margin:8px 0"><button class="secondary" onclick="app.autoXI()">Auto (beste XI)</button><button onclick="app.clearXI()">Leegmaken XI</button><button onclick="app.clearBench()">Leegmaken bank</button><button class="primary" onclick="app.saveXI()">Opslaan</button></div>
      <table><thead><tr><th>Pos</th><th>Speler</th><th>PAC</th><th>PAS</th><th>SHO</th><th>DEF</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card">
      <h2>Speelveld</h2>
      <div class="pitch"><div class="pitch-grid">${xiSlots}</div><h3>Bank (6)</h3><div class="bench-bar">${benchSlots}</div></div>
      <h3 style="margin-top:10px">Speelstijl</h3><div class="chips" id="styleChips">${styleChips}</div>
      <h3 style="margin-top:10px">Formatie</h3><div class="chips" id="formChips">${formChips}</div>
    </div>
  </div>`;
}

function viewFixtures(){
  const fixtures=state.fixtures.map(f=>{ const s=f.score?`${f.score[0]} - ${f.score[1]}`:'<span class="muted">–</span>'; const you=(f.home==='you'||f.away==='you'); return `<tr ${you?"style='font-weight:700'":''}><td>${f.md}</td><td>${f.homeName}</td><td>${f.awayName}</td><td>${s}</td></tr>` }).join('');
  const tableRows=state.table.slice().sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf).map((t,i)=>`<tr ${t.id==='you'?"style='font-weight:700'":''}><td>${i+1}</td><td>${t.name}</td><td>${t.pts}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td></tr>`).join('');
  return `<div class="grid grid-2">
    <div class="card"><h2>Programma</h2><table><thead><tr><th>MD</th><th>Thuis</th><th>Uit</th><th>Score</th></tr></thead><tbody>${fixtures}</tbody></table></div>
    <div class="card"><h2>Stand — ${divisionName()}</h2><table><thead><tr><th>#</th><th>Club</th><th>Pt</th><th>DV</th><th>DT</th><th>DS</th></tr></thead><tbody>${tableRows}</tbody></table></div>
  </div>`;
}

function viewTransfers(){
  const rows=state.market.map(p=>`<tr><td class="pos">${p.pos}</td><td><strong>${p.name}</strong><div class="muted">${p.age} jr • Pot ${p.pot}</div></td><td>${p.ovr}</td><td class="money">${fmt(Math.round(p.value*0.85))}–${fmt(Math.round(p.value*1.45))}</td><td class="money">${fmt(p.wage)}/w</td><td><button class="primary" onclick="app.buy('${p.id}')">Koop</button></td></tr>`).join('');
  const offers= state.offers.length? state.offers.map(o=>`<tr><td><strong>${o.playerName}</strong></td><td>${o.club}</td><td class="money">${fmt(o.amount)}</td><td><button class="primary" onclick="app.accept('${o.id}')">Accepteer</button> <button onclick="app.reject('${o.id}')">Weiger</button></td></tr>`).join('') : `<tr><td colspan="4" class="muted">Geen biedingen momenteel.</td></tr>`;
  return `<div class="grid grid-2">
    <div class="card"><h2>Transfermarkt</h2><div class="muted">Scouting beïnvloedt kwaliteit.</div><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Transfersom</th><th>Loon</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="card"><h2>Biedingen op jouw spelers</h2><table><thead><tr><th>Speler</th><th>Club</th><th>Bod</th><th>Actie</th></tr></thead><tbody>${offers}</tbody></table></div>
  </div>`;
}

function viewFacilities(){
  const block=(label,key,extra='')=>{ const lvl=state[key]; return `<div class="card"><h2>${label}</h2><div class="muted">Niveau: ${lvl} / 10</div><div class="progress" style="margin:8px 0 10px"><span style="width:${lvl*10}%"></span></div><div class="muted">Upgrade kost: <span class="money">${lvl<10?fmt(facCost(key,lvl+1)):'—'}</span></div>${extra}<button ${lvl>=10?'disabled':''} class="primary" onclick="app.upgrade('${key}')">Upgrade</button></div>` };
  const stadInfo=`<div class="muted" style="margin:8px 0">Capaciteit: <strong>${stadiumCapacity(state.stadium).toLocaleString('nl-NL')}</strong> (div-cap: ${DIV_CAP[state.division].toLocaleString('nl-NL')}) • Ticket: <strong>${fmt(ticketPrice())}</strong></div>`;
  return `<div class="grid grid-2"><div class="grid grid-3">${block('Training','training')}${block('Jeugd','youth')}${block('Scouting','scouting')}</div>${block('Stadion','stadium',stadInfo)}</div>`;
}

function viewSponsors(){
  const a=state.sponsors.active;
  const active=a?`<div class="card"><h2>Actieve sponsor: ${a.brand}</h2><div class="muted">Basis: <strong>${fmt(a.baseWeekly)}/wk</strong> • Doel: <strong>${a.objective.label}</strong> • Bonus: <strong>${fmt(a.bonus)}</strong></div><div class="muted" style="margin-top:8px">${sponsorProgressText()}</div><div style="margin-top:8px"><button class="danger" onclick="app.cancelSponsor()">Opzeggen</button></div></div>`:`<div class="card"><h2>Geen actieve sponsor</h2><div class="muted">Kies hieronder.</div></div>`;
  const offers=state.sponsors.offers.map(o=>`<tr><td><strong>${o.brand}</strong></td><td>${o.objective.label}</td><td class="money">${fmt(o.baseWeekly)}/wk</td><td class="money">${fmt(o.bonus)}</td><td><button class="primary" onclick="app.acceptSponsor('${o.id}')">Accepteer</button></td></tr>`).join('');
  return `<div class="grid grid-2">${active}<div class="card"><h2>Beschikbare sponsordeals</h2><table><thead><tr><th>Merk</th><th>Doelstelling</th><th>Basis</th><th>Bonus</th><th></th></tr></thead><tbody>${offers||'<tr><td class="muted" colspan="5">Geen aanbiedingen. Nieuwe deals bij seizoenseinde.</td></tr>'}</tbody></table></div></div>`;
}

function viewYouth(){ const rows=state.youthPool.map(p=>`<tr><td class="pos">${p.pos}</td><td><strong>${p.name}</strong><div class="muted">${p.age} jr • Pot ${p.pot}</div></td><td>${p.ovr}</td><td class="money">${fmt(p.wage)}/w</td><td><button class="primary" onclick="app.signYouth('${p.id}')">Teken</button></td></tr>`).join(''); return `<div class="card"><h2>Jeugdinstroom</h2><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Loon</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`; }

function viewClub(){ return `<div class="grid grid-2"><div class="card"><h2>Clubinfo</h2><div class="muted">Naam: <strong>${state.clubName}</strong></div><div class="muted">Divisie: ${divisionName()}</div><div class="muted">Seizoen: ${state.season}</div><div class="muted">Gem. OVR selectie: ${avgOvr(state.squad)}</div><div class="muted">Stadion: Niveau ${state.stadium} • ${stadiumCapacity(state.stadium).toLocaleString('nl-NL')} plekken</div></div><div class="card"><h2>Acties</h2><button onclick="app.refreshMarket()">Ververs markt</button> <button onclick="app.generateYouthPool()">Nieuwe jeugd</button></div></div>`; }

function viewCup(){
  if(!state.cup.eligible) return `<div class="card"><h2>Beker</h2><div class="muted">Je doet mee vanaf de <strong>3e divisie</strong>. Jouw club zit nu in ${divisionName()}.</div></div>`;
  const r=state.cup.round||0, fx=state.cup.fixtures||[];
  const youFixture=fx.find(f=>f.home==='you'||f.away==='you');
  const histRows=state.cup.history.slice(-16).map(f=>`<tr><td>${f.homeName}</td><td>${f.awayName}</td><td>${f.score?`${f.score[0]} - ${f.score[1]}`:'–'}</td></tr>`).join('');
  const fxRows=fx.length?fx.map(f=>`<tr ${((f.home==='you'||f.away==='you')?'style="font-weight:700"':'')}><td>${f.homeName}</td><td>${f.awayName}</td><td>${f.score?`${f.score[0]} - ${f.score[1]}`:'—'}</td></tr>`).join(''):`<tr><td class="muted" colspan="3">Nog geen loting.</td></tr>`;
  const top=`<div class="card"><h2>Beker — ${r? (r===2?'Finale':r===4?'Halve finale':r===8?'Kwartfinale':r+'-finale'):'afgelopen'}</h2><div class="muted">${youFixture?`Volgende tegenstander: <strong>${youFixture.home==='you'?youFixture.awayName:youFixture.homeName}</strong>`:'—'}</div><div style="margin-top:8px"><button class="secondary" onclick="app.cupDraw()">Loting</button> <button class="primary" onclick="app.cupPlay()">Speel ronde</button></div></div>`;
  const mid=`<div class="card"><h2>Huidige ronde</h2><table><thead><tr><th>Thuis</th><th>Uit</th><th>Score</th></tr></thead><tbody>${fxRows}</tbody></table></div>`;
  const bot=`<div class="card"><h2>Recent gespeelde bekerduels</h2><table><thead><tr><th>Thuis</th><th>Uit</th><th>Score</th></tr></thead><tbody>${histRows||'<tr><td class="muted" colspan="3">Nog geen geschiedenis.</td></tr>'}</tbody></table></div>`;
  return `<div class="grid grid-2">${top}${mid}${bot}</div>`;
}

// Render
function render(){
  byId('title').textContent=`${state.clubName} — ${divisionName()}`;
  byId('subtitle').textContent=`Seizoen ${state.season} • Gem. OVR ${avgOvr(state.squad)} • Eff. ${avgOvrEffective(state.squad)}`;
  byId('budget').textContent=fmt(state.budget);
  const wages=state.squad.reduce((a,p)=>a+p.wage,0); byId('wages').textContent=fmt(wages);
  byId('facSummary').textContent=`T${state.training} • Y${state.youth} • S${state.scouting} • ST${state.stadium}`;
  byId('division').textContent=divisionName(); byId('matchday').textContent=state.matchday; byId('seasonYear').textContent=state.season; byId('clubLabel').textContent=state.clubName;

  const active=document.querySelector('.tab.active')?.getAttribute('data-tab')||'squad';
  const view=byId('view'); let html='';
  if(active==='squad') html=viewSquad();
  if(active==='tactics') html=viewTactics();
  if(active==='fixtures') html=viewFixtures();
  if(active==='cup') html=viewCup();
  if(active==='transfers') html=viewTransfers();
  if(active==='facilities') html=viewFacilities();
  if(active==='sponsors') html=viewSponsors();
  if(active==='youth') html=viewYouth();
  if(active==='club') html=viewClub();
  view.innerHTML=html;

  if(active==='tactics'){
    qsa('#styleChips .chip').forEach(ch=>ch.addEventListener('click',()=>{ state.tactics.style=ch.getAttribute('data-style'); render(); }));
    qsa('#formChips .chip').forEach(ch=>ch.addEventListener('click',()=>{ state.tactics.formation=ch.getAttribute('data-form'); render(); }));
  }
  if(active==='squad'){
    qsa('#posChips .chip').forEach(ch=>ch.addEventListener('click',()=>{ state.filters.pos=ch.getAttribute('data-pos'); render(); }));
    qsa('#statusChips .chip').forEach(ch=>ch.addEventListener('click',()=>{ state.filters.status=ch.getAttribute('data-status'); render(); }));
    qsa('#ovrChips .chip').forEach(ch=>ch.addEventListener('click',()=>{ state.filters.ovr=ch.getAttribute('data-ovr'); render(); }));
    const si=byId('searchInput'); if(si) si.addEventListener('input',()=>{ state.filters.search=si.value; });
  }
}

function toast(msg){ const el=document.createElement('div'); el.textContent=msg; el.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#0b1220;border:1px solid rgba(255,255,255,.1);padding:10px 14px;border-radius:12px;z-index:1000;box-shadow:0 10px 30px rgba(0,0,0,.4)'; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); }
function byId(id){return document.getElementById(id)}
function qsa(sel){return Array.from(document.querySelectorAll(sel))}

// Attach & init
function attach(){
  qsa('.tab').forEach(el=>el.addEventListener('click',()=>{ qsa('.tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); render(); }));
  byId('playBtn').addEventListener('click',playNextMatchday);
  byId('simulateBtn').addEventListener('click',()=>{ const maxMd=Math.max(...state.fixtures.map(f=>f.md)); while(state.matchday<=maxMd){ playNextMatchday(); } });
  byId('saveBtn').addEventListener('click',save);
  byId('resetBtn').addEventListener('click',reset);
  byId('renameBtn').addEventListener('click',()=>{ const n=prompt('Nieuwe clubnaam:', state.clubName); if(n&&n.trim()){ state.clubName=n.trim(); const me=state.table.find(t=>t.id==='you'); if(me) me.name=state.clubName; state.fixtures.forEach(f=>{ if(f.home==='you') f.homeName=state.clubName; if(f.away==='you') f.awayName=state.clubName; }); render(); } });
}
function init(){
  load();
  if(!state.squad || state.squad.length===0){
    state.clubName=prompt('Clubnaam?', 'SfeerShots FC') || 'Your FC';
    state.squad=genInitialSquad(); state.aiClubs=genAIClubs(); scheduleFixtures(); refreshMarket(); generateYouthPool(); genSponsorOffers();
    cupResetStart();
  }else{
    state.offers=state.offers||[]; ensureArrays();
    state.tactics=state.tactics||{style:'defensive',formation:'4-3-3'};
    state.filters=state.filters||{pos:'ALL',status:'ALL',ovr:'ALL',search:''};
    state.sponsors=state.sponsors||{active:null,offers:[]};
    state.sponsorProgress=state.sponsorProgress||{wins:0,points:0,goals:0};
    if(!state.sponsors.offers||state.sponsors.offers.length===0) genSponsorOffers();
    state.stadium=state.stadium||1;
    if(!state.cup) state.cup={eligible:false,active:false,round:0,teams:[],fixtures:[],history:[]};
    if(cupEligible() && (!state.cup.active || !state.cup.round)) cupResetStart();
    state.squad.forEach(p=>{ if(typeof p.injured!=='number') p.injured=0; if(typeof p.listed!=='boolean') p.listed=false; ['suspended','yellows','reds','apps'].forEach(k=>{ if(typeof p[k]!=='number') p[k]=0; }); if(typeof p.contract!=='number') p.contract=2; if(typeof p.wage!=='number') p.wage=Math.round(wageFromOvr(p.ovr)/52); });
  }
  attach(); render();
}

// expose to window
window.app={
  buy:buyPlayer, release:releasePlayer, toggleList, accept:acceptOffer, reject:rejectOffer,
  upgrade, refreshMarket, generateYouthPool, signYouth,
  toggleXI, autoXI, clearXI, clearBench, dragStart, dropToXI, dropToBench,
  clearSlotXI:(i)=>{state.lineup[i]=null; render();}, clearSlotBench:(i)=>{state.bench[i]=null; render();},
  saveXI:()=>toast('Opstelling & bank opgeslagen.'),
  acceptSponsor, cancelSponsor,
  negotiate:negotiateContract,
  cupDraw:()=>{ if(!state.cup.active||state.cup.round<=1){ alert('Beker nog niet actief of al klaar.'); return; } if(state.cup.fixtures.length){ alert('Ronde al geloot.'); return; } cupDraw(); render(); },
  cupPlay:()=>{ if(!state.cup.active||!state.cup.fixtures.length){ alert('Geen wedstrijden om te spelen.'); return; } cupPlayRound(); }
};

init();

})();
