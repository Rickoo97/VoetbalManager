// BlankBall Manager v0.9.4.3 (Performance Optimized Build)
(() => {
console.log('v0.9.4.3 Performance Boost loaded');

const roman=n=>{
  const r=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
  return r[n]||n;
};

const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const choice=a=>a[Math.floor(Math.random()*a.length)];
const rid=()=>(Math.random().toString(36).slice(2,10));

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const sum=a=>a.reduce((x,y)=>x+y,0);

const fmt=n=>{
  if(n===0) return '€ 0';
  let s=n<0?'-':'';
  n=Math.abs(n);
  return `${s}€ ${n.toLocaleString('nl-NL')}`;
};

const NAMES=["Jan","Piet","Klaas","Mark","Tim","Luuk","Niels","Rick","Kevin","Sam","Rico","Dennis","Tom","Gijs","Leroy","Koen","Leon","Daan","Teun","Yannick"];

// --- CLUB NAME GENERATOR (v0.9.4.3) ---
const CLUB_NAMES_BY_DIVISION = {
  1: [
    'Ajax', 'PSV', 'Feyenoord', 'FC Twente', 'AZ',
    'SC Heerenveen', 'NAC Breda', 'RKC Waalwijk',
    'Utrecht United', 'Rotterdam Rangers', 'Eindhoven FC',
    'Friese Leeuwen', 'Randstad FC', 'Zuidpark City',
    'Noordzee United', 'IJssel Stars'
  ],
  2: [
    'FC Den Bosch', 'Helmond Sport', 'VVV Venlo',
    'Brabant Boys', 'Kuststad FC', 'Polder United',
    'Kanaalstreek FC', 'Betuwe Boys', 'Gouwestad FC',
    'Rijnmond Rangers', 'Velden 04', 'Stadionwijk 09'
  ],
  3: [
    'Almere Rookies', 'Zuidpark Boys', 'Delta Rangers',
    'IJsselmeer SC', 'Goudstad FC', 'Merwe Rangers',
    'Kustboys', 'Biesbosch Boys', 'Veluwe Vikings',
    'Kempen Kickers', 'Havenstad FC', 'Kanaalzicht 04'
  ],
  4: [
    'Noordland FC', 'FC Deltawind', 'Stad & Land',
    'Hoekse Boys', 'Rivierenland FC', 'Heuvelrug United',
    'Zandstad 08', 'Fortuna Polderen', 'Vechtstreek FC',
    'Graafschap Boys', 'Domstad Rangers', 'Meren United'
  ],
  5: [
    'Altena FC', 'Lek Boys', 'IJsselmeer SC',
    'Goudstad FC', 'Kustboys', 'Merwe Rangers',
    'Biesbosch Boys', 'Polder United', 'Delta Rangers',
    'Noordzee United', 'Brabant Boys', 'Almstad FC'
  ]
};

function generateClubName(division, used){
  const pool = CLUB_NAMES_BY_DIVISION[division] || CLUB_NAMES_BY_DIVISION[5];
  const available = pool.filter(n => !used.has(n));
  let pick;

  if (available.length > 0) pick = choice(available);
  else pick = `Club ${used.size + 1}`;

  used.add(pick);
  return pick;
}

// --- STATE ---
let state = {
  version: "0.9.4.3",
  division: 5,
  season: 1,
  matchday: 1,
  you: null,
  table: [],
  fixtures: [],
  history: [],
  seasonChanges: {},
  scouting: 1,
  youth: 1,
  stadium: 1,
  training: 1,
  staffPlan: "balanced",
  sponsors: {
    shirt: { active: null, offers: [] },
    main: { active: null, offers: [] }
  },
  lastMatch: null,
};
// --- FIXTURE / SCHEDULE GENERATOR (v0.9.4.3 Optimized) ---

function genAIClubs(){
  const count = 12;
  const arr = [];
  const used = new Set();
  for(let i=0;i<count-1;i++){
    const name = generateClubName(state.division, used);
    arr.push({
      id: rid(),
      name,
      pts: 0, gf:0, ga:0, gd:0
    });
  }
  return arr;
}

function initYourClub(){
  return {
    id: "you",
    name: "Altena FC",
    pts: 0, gf:0, ga:0, gd:0
  };
}

// Faster fixture generator
function generateFixturesFast(){
  const clubs=[...state.table];
  const n=clubs.length;
  const rounds=n-1;
  const half=n/2;

  let a=clubs.slice(0,half);
  let b=clubs.slice(half).reverse();

  const schedule=[];
  for(let r=0;r<rounds;r++){
    const week=[];
    for(let i=0;i<half;i++){
      if(a[i].id==="you"||b[i].id==="you")
        week.push([a[i],b[i]]);
      else
        week.push([a[i],b[i]]);
    }
    schedule.push(week);

    // rotate
    const fixed=a.shift();
    const last=b.pop();
    b.unshift(a.pop());
    a.unshift(fixed);
    b.push(last);
  }
  return schedule;
}

// --- MATCH ENGINE (v0.9.4.3 optimized) ---
// Much faster simulation, fewer heavy ops

function simMatch(a,b){
  const baseA = 50 + rand(-8,8) + state.training;
  const baseB = 50 + rand(-8,8);

  const atkA = baseA + rand(0,4);
  const atkB = baseB + rand(0,4);

  let gA = clamp(Math.floor((atkA - baseB)/10) + rand(0,2),0,6);
  let gB = clamp(Math.floor((atkB - baseA)/10) + rand(0,2),0,6);

  if(Math.random()<0.10) gA++;
  if(Math.random()<0.10) gB++;

  return [gA,gB];
}

// apply results to league table
function applyMatchResult(tA, tB, gA, gB){
  tA.gf+=gA;
  tA.ga+=gB;
  tB.gf+=gB;
  tB.ga+=gA;
  tA.gd=tA.gf-tA.ga;
  tB.gd=tB.gf-tB.ga;

  if(gA>gB) tA.pts+=3;
  else if(gB>gA) tB.pts+=3;
  else { tA.pts++; tB.pts++; }
}

function playNextMatchday(){
  if(state.matchday > state.fixtures.length){
    return endSeason();
  }

  const week = state.fixtures[state.matchday-1];
  for(const match of week){
    const [a,b]=match;
    const [gA,gB]=simMatch(a,b);
    applyMatchResult(a,b,gA,gB);

    // store last match if "you" played
    if(a.id==="you"||b.id==="you"){
      state.lastMatch={
        opp: (a.id==="you"? b.name: a.name),
        gf: gA,
        ga: gB,
        home: a.id==="you"
      };
    }
  }

  state.matchday++;
  render();
}

// --- SPONSORS (v0.9.4.3 Optimized & Fixed) ---

function genSponsorOffers(){
  const base = 200 + state.division*40 + rand(0,120);

  const mkOffer = ()=>({
    id:rid(),
    brand: choice(["ING","Rabobank","Jumbo","ASML","Univé","Heineken","Bol.com","Coolblue"]),
    baseWeekly: base + rand(-50,50),
    duration: 1 + rand(0,2)
  });

  const s = state.sponsors;
  s.shirt.offers = [mkOffer(), mkOffer()];
  s.main.offers  = [mkOffer()];
}

function acceptSponsor(kind,id){
  const bucket = state.sponsors[kind];
  if(!bucket) return;
  const o = bucket.offers.find(x => x.id===id);
  if(!o) return;

  bucket.active = o;
  bucket.offers = bucket.offers.filter(x=>x.id!==id);

  toast(`Sponsor (${kind}): ${o.brand} (${fmt(o.baseWeekly)}/wk)`);

  render();
}

function cancelSponsor(kind){
  const bucket = state.sponsors[kind];
  if(!bucket || !bucket.active) return;
  if(!confirm("Sponsor opzeggen?")) return;
  bucket.active=null;
  render();
}

function sponsorIncome(){
  let amt=0;
  const s=state.sponsors;
  if(s.shirt.active) amt+=s.shirt.active.baseWeekly;
  if(s.main.active) amt+=s.main.active.baseWeekly;
  return amt;
}
// --- FINANCE ENGINE (v0.9.4.3 Optimized) ---

function maintenanceCost(){
  return 2000 + state.stadium * 700;
}

function ticketIncome(){
  const base = 12 + (6 - state.division)*2;
  const price = state.ticketPriceCustom ?? base;
  const cap = 800 + state.stadium * 600;

  const demand = Math.max(120, 400 + rand(-80,110) + state.training*20);
  const att = Math.min(cap, demand);

  return {
    attendance: att,
    tickets: att * price,
    food: Math.round(att * 3.2),
    merch: Math.round(att * 1.2)
  };
}

function financeTick(matchWasHome){
  const rev = matchWasHome ? ticketIncome() : {attendance:0,tickets:0,food:0,merch:0};
  const wages = state.squad.reduce((a,p)=>a+p.wage,0);
  const sponsor = sponsorIncome();
  const cost = maintenanceCost();

  const tv = (state.division<=3 && Math.random()<0.25)? (60000 + rand(-5000,8000)) : 0;

  const net = (rev.tickets + rev.food + rev.merch + sponsor + tv) - wages - cost;

  state.budget += net;

  state.finance.last = {
    attendance: rev.attendance,
    tickets: rev.tickets,
    food: rev.food,
    merch: rev.merch,
    sponsor,
    tv,
    wages,
    maintenance: cost,
    net
  };
}


// --- TRAINING + DEVELOPMENT (v0.9.4.3) ---
// lighter & faster loop

function trainPlayers(){
  const f = 0.10 + state.training*0.03;
  for(const p of state.squad){
    if(p.age <= 32 && p.ovr < p.pot && Math.random() < f){
      p.ovr++;
      p.value = Math.round(p.value * 1.05);
      p.passing += rand(0,1);
      p.shooting += rand(0,1);
      p.defense += rand(0,1);
      p.pace += rand(0,1);
    }
  }
}


// --- YOUTH INTAKE (v0.9.4.3) ---

function generateYouthPool(){
  const arr=[];
  const count = 2 + Math.floor(state.youth/3);
  for(let i=0;i<count;i++){
    const pos = choice(POS);
    const ovr = 30 + state.youth*2 + rand(-3,5);
    const pot = ovr + 10 + rand(0,20);
    arr.push({
      id:rid(),
      name: rndName(),
      age: 15 + rand(0,2),
      pos,
      ovr,
      pot,
      wage: 180 + rand(0,80),
      value: 15000 + rand(0,20000)
    });
  }
  state.youthPool = arr;
}

function signYouth(id){
  const p = state.youthPool.find(x=>x.id===id);
  if(!p) return;
  if(state.squad.length>=32) return alert("Selectie is vol (max 32)");
  state.squad.push(p);
  state.youthPool = state.youthPool.filter(x=>x.id!==id);
  render();
}


// --- TRANSFERS (v0.9.4.3 faster) ---

function refreshMarket(){
  const arr=[];
  for(let i=0;i<18;i++){
    const pos = choice(POS);
    const ovr = 40 + rand(0,20) + state.scouting;
    const pot = ovr + rand(3,25);
    arr.push({
      id:rid(),
      name:rndName(),
      age:rand(18,33),
      pos,
      ovr,
      pot,
      wage:Math.round((ovr*ovr)/7 + rand(60,220)),
      value:Math.round((ovr*ovr)*40 + rand(2000,8000))
    });
  }
  state.market = arr;
}

function buyPlayer(id){
  const p = state.market.find(x=>x.id===id);
  if(!p) return;
  const fee = p.value;
  if(state.budget < fee) return alert("Onvoldoende budget!");
  state.budget -= fee;
  state.squad.push(p);
  state.market = state.market.filter(x=>x.id!==id);
  render();
}

function releasePlayer(id){
  const ix = state.squad.findIndex(p=>p.id===id);
  if(ix<0) return;
  if(!confirm("Contract ontbinden?")) return;
  state.squad.splice(ix,1);
  render();
}


// --- CONTRACTEN (v0.9.4.3 cleaned) ---

function negotiateContract(id){
  const p = state.squad.find(x=>x.id===id);
  if(!p) return;

  const ask = Math.round((p.ovr*p.ovr)/6 + rand(50,140));

  let newW = prompt(`${p.name} wil ongeveer ${fmt(ask)}/wk\nVoer loon in:`, ask);
  if(!newW) return;
  newW = parseInt(newW);

  if(newW < ask*0.85){
    alert(`${p.name} weigert.`);
    return;
  }

  const bonus = newW*2;
  if(state.budget < bonus){
    alert("Geen budget voor tekenbonus.");
    return;
  }

  state.budget -= bonus;
  p.wage = newW;

  toast(`Nieuw contract: ${p.name} (${fmt(newW)}/wk)`);
  render();
}


// --- LINEUP MANAGER (v0.9.4.3 optimized) ---

function ensureArrays(){
  if(!Array.isArray(state.lineup)) state.lineup = Array(11).fill(null);
  if(!Array.isArray(state.bench)) state.bench = Array(6).fill(null);
}

function removeEverywhere(pid){
  if(!pid) return;
  const L = state.lineup.indexOf(pid);
  if(L>-1) state.lineup[L]=null;
  const B = state.bench.indexOf(pid);
  if(B>-1) state.bench[B]=null;
}

function pickXI(){
  const pool = state.squad.filter(p=>!p.injured && !p.suspended)
    .slice().sort((a,b)=>b.ovr-a.ovr);
  return pool.slice(0,11).map(p=>p.id);
}

function autoXI(){
  ensureArrays();
  const xi = pickXI();
  const used = new Set(xi);
  state.lineup = xi;
  const bench = state.squad.filter(p=>!used.has(p.id))
    .slice().sort((a,b)=>b.ovr-a.ovr).slice(0,6).map(p=>p.id);
  state.bench = bench;
  render();
}
// --- MANUAL LINEUP ACTIONS (v0.9.4.3) ---

function toggleXI(id){
  ensureArrays();
  const p = state.squad.find(x=>x.id===id);
  if(!p || p.injured || p.suspended) return;

  const idx = state.lineup.indexOf(id);
  if(idx > -1){
    state.lineup[idx] = null;
  } else {
    if(state.lineup.filter(Boolean).length >= 11)
      return toast("XI is vol (11 spelers)");
    removeEverywhere(id);
    const free = state.lineup.findIndex(x=>!x);
    state.lineup[free] = id;
  }
  render();
}

function quickAdd(id){
  ensureArrays();
  const p = state.squad.find(x=>x.id===id);
  if(!p || p.injured || p.suspended) return;

  const xiCount = state.lineup.filter(Boolean).length;
  const benchCount = state.bench.filter(Boolean).length;

  if(xiCount < 11){
    removeEverywhere(id);
    const slot = state.lineup.findIndex(x=>!x);
    state.lineup[slot] = id;
  } else if(benchCount < 6){
    removeEverywhere(id);
    const slot = state.bench.findIndex(x=>!x);
    state.bench[slot] = id;
  } else {
    toast("XI en bank zijn vol.");
  }
  render();
}

function clearXI(){
  ensureArrays();
  state.lineup = Array(11).fill(null);
  render();
}

function clearBench(){
  ensureArrays();
  state.bench = Array(6).fill(null);
  render();
}

function dropToXI(e, idx){
  e.preventDefault();
  ensureArrays();
  const d = state._drag || {};
  const p = state.squad.find(x=>x.id===d.id);
  if(!p || p.injured || p.suspended) return;
  removeEverywhere(p.id);
  state.lineup[idx] = p.id;
  render();
}

function dropToBench(e, idx){
  e.preventDefault();
  ensureArrays();
  const d = state._drag || {};
  const p = state.squad.find(x=>x.id===d.id);
  if(!p || p.injured || p.suspended) return;
  removeEverywhere(p.id);
  state.bench[idx] = p.id;
  render();
}

function dragStart(e, from, id, slot){
  state._drag = { from, id, slot };
}

function saveXI(){
  toast("Opstelling & bank opgeslagen.");
}


// --- CUP SYSTEM (v0.9.4.3 simplified & optimized) ---

function cupEligible(){
  return state.division <= 3;
}

function resetCup(){
  if(!cupEligible()){
    state.cup = {
      eligible:false,
      active:false,
      round:0,
      fixtures:[],
      history:[]
    };
    return;
  }

  state.cup = {
    eligible:true,
    active:true,
    round:32,
    fixtures:[],
    history:[]
  };
  genCupRound();
}

function genCupRound(){
  const size = state.cup.round;
  const fx = [];

  for(let i=0; i<size/2; i++){
    const home = rndName() + " FC";
    const away = rndName() + " United";
    fx.push({
      id: rid(),
      home,
      away,
      score: null,
      played:false
    });
  }

  state.cup.fixtures = fx;
}

function playCupRound(){
  if(!state.cup.active) return;

  for(const f of state.cup.fixtures){
    const gA = rand(0,4);
    const gB = rand(0,4);
    f.score=[gA,gB];
    f.played=true;
  }

  state.cup.history.push(...state.cup.fixtures);

  if(state.cup.round > 2){
    state.cup.round /= 2;
    genCupRound();
  } else {
    // winner
    state.cup.active=false;
    toast("Beker is afgerond.");
  }

  render();
}


// --- HISTORY / TROPHY SYSTEM (v0.9.4.3 improved) ---

function addSeasonToHistory(pos){
  const gf = state.tableYour.gf;
  const ga = state.tableYour.ga;
  const wins = state.tableYour.wins ?? "-";
  const draws = state.tableYour.draws ?? "-";
  const losses = state.tableYour.losses ?? "-";

  // Find topscorer
  let top = state.squad.slice().sort((a,b)=>b.seasonGoals-a.seasonGoals)[0];
  if(!top) top = { name:"—", seasonGoals:0 };

  state.history.seasons.push({
    season: state.season,
    division: divisionName(),
    pos,
    gf,
    ga,
    record: `${wins}-${draws}-${losses}`,
    topScorer: { name: top.name, goals: top.seasonGoals },
    budgetEnd: state.budget
  });
}

function exportHistory(){
  const data = JSON.stringify(state.history, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download="voetbalmanager_history.json";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}


// --- PROMOTIE / DEGRADATIE OVERZICHT (v0.9.4.3 NEW TAB!!) ---

function scanDivisionResults(){
  const table = [...state.table].sort((a,b)=>b.pts-a.pts || b.gd-a.gd);
  const promote = table.slice(0,2).map(t=>t.name);
  const relegate = [ table[table.length-1].name ];

  return { promote, relegate };
}

function viewMovementOverview(){
  const { promote, relegate } = scanDivisionResults();

  const promRows = promote.map(n=>`<div class="tag" style="background:#0f0a;color:#76ff76">↑ ${n}</div>`).join("");
  const relRows = relegate.map(n=>`<div class="tag" style="background:#200;color:#ff7474">↓ ${n}</div>`).join("");

  return `
    <div class="card">
      <h2>Promoties</h2>
      ${promRows || '<div class="muted">Geen data</div>'}
    </div>
    <div class="card">
      <h2>Degradaties</h2>
      ${relRows || '<div class="muted">Geen data</div>'}
    </div>
  `;
}
// --- END OF SEASON (v0.9.4.3 improved + glow effect trigger) ---

function endSeason(){
  // Sorteer eindstand
  const table = [...state.table].sort((a,b)=>b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  const pos = table.findIndex(t=>t.id==="you") + 1;

  // Kampioen glow-effect trigger
  if(pos === 1){
    state._seasonChampionGlow = true;
  } else {
    state._seasonChampionGlow = false;
  }

  // Titel + promoties / degradaties
  let msg = `Seizoen ${state.season} afgerond.\nEindpositie: #${pos}/${table.length}`;

  if(pos === 1){
    msg += "\n🏆 Je bent kampioen!";
    state.stats.leaguesWon++;
    state.trophies.push({type:'league', name:divisionName(), season:state.season});
  }

  if(state.division > 1 && pos <= 2){
    state.division--;
    msg += `\n↑ PROMOTIE naar ${divisionName()}`;
  } else if(state.division < 5 && pos === table.length){
    state.division++;
    msg += `\n↓ DEGRADATIE naar ${divisionName()}`;
  }

  // Prijzengeld
  const prize = Math.round(400000 / state.division * (table.length - pos + 1));
  state.budget += prize;
  msg += `\nPrijzengeld: ${fmt(prize)}`;

  state.stats.prizeMoney += prize;

  // Save to history
  state.tableYour = table.find(t=>t.id==="you");
  addSeasonToHistory(pos);

  alert(msg);

  // Reset spelers
  for(const p of state.squad){
    p.age++;
    if(p.contract > 0) p.contract--;
    p.injured = 0;
    p.suspended = 0;
    p.yellows = 0;
    p.reds = 0;
    p.apps = 0;
    p.seasonGoals = 0;
    p.seasonAssists = 0;

    // Progression / degeneration
    if(p.age <= 25){
      p.ovr += rand(0,2);
    } else if(p.age >= 31){
      p.ovr -= rand(0,1);
    }
  }

  // New season
  state.season++;
  state.matchday = 1;

  genSponsorOffers();
  state.aiClubs = genAIClubs();
  state.table = [ initYourClub(), ...state.aiClubs ];
  state.fixtures = generateFixturesFast();
  refreshMarket();
  generateYouthPool();
  resetCup();

  render();
}


// --- VIEWS (v0.9.4.3 improved UI + glow effect support) ---

function viewSquad(){
  let list = state.squad.slice().sort((a,b)=>b.ovr-a.ovr);

  const rows = list.map(p => `
    <tr>
      <td class="pos">${p.pos}</td>
      <td><strong>${p.name}</strong><div class="muted">${p.age} jr • Pot ${p.pot}</div></td>
      <td>${p.ovr}</td>
      <td>${p.pace}</td>
      <td>${p.passing}</td>
      <td>${p.shooting}</td>
      <td>${p.defense}</td>
      <td>${p.apps}</td>
      <td>${p.seasonGoals ?? 0}</td>
      <td>${p.contract} jr</td>
      <td class="money">${fmt(p.wage)}/wk</td>
      <td class="money">${fmt(p.value)}</td>
      <td>
        <button onclick="negotiateContract('${p.id}')">Contract</button>
        <button onclick="releasePlayer('${p.id}')">Ontbind</button>
      </td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>Selectie (${state.squad.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Pos</th><th>Naam</th><th>OVR</th><th>PAC</th><th>PAS</th><th>SHO</th><th>DEF</th>
            <th>Apps</th><th>Goals</th><th>Contract</th><th>Loon</th><th>Waarde</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function viewFixtures(){
  const table = [...state.table].sort((a,b)=>b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  const rowsLeague = table.map((t,i)=>{
    const isYou = (t.id === "you");
    const champion = (i===0);

    // positie kleur markeringen
    let cls = "";
    if(champion) cls = "tr-champion";
    else if(i <= 1) cls = "tr-promote";
    else if(i === table.length-1) cls = "tr-relegate";

    return `
      <tr class="${cls}" ${isYou?'style="font-weight:700"':''}>
        <td>${i+1}</td>
        <td>${t.name}</td>
        <td>${t.pts}</td>
        <td>${t.gf}</td>
        <td>${t.ga}</td>
        <td>${t.gd}</td>
      </tr>
    `;
  }).join("");

  // Fixtures
  let rowsFix = "";
  state.fixtures.forEach((week,md)=>{
    week.forEach(match=>{
      rowsFix += `
        <tr>
          <td>${md+1}</td>
          <td>${match[0].name}</td>
          <td>${match[1].name}</td>
        </tr>
      `;
    });
  });

  return `
    <div class="grid grid-2">
      <div class="card">
        <h2>Programma</h2>
        <table>
          <thead><tr><th>MD</th><th>Thuis</th><th>Uit</th></tr></thead>
          <tbody>${rowsFix}</tbody>
        </table>
      </div>

      <div class="card">
        <h2>Stand — ${divisionName()}</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Club</th><th>Pt</th><th>DV</th><th>DT</th><th>DS</th></tr>
          </thead>
          <tbody>${rowsLeague}</tbody>
        </table>
      </div>
    </div>
  `;
}

function viewSponsors(){
  const s = state.sponsors;

  const block = (kind,title) => {
    const a = s[kind].active;
    const offers = s[kind].offers.map(o=>`
      <tr>
        <td><strong>${o.brand}</strong></td>
        <td class="money">${fmt(o.baseWeekly)}/wk</td>
        <td>${o.duration} jr</td>
        <td><button class="primary" onclick="acceptSponsor('${kind}','${o.id}')">Accepteer</button></td>
      </tr>
    `).join("");

    return `
      <div class="card">
        <h2>${title}</h2>
        ${a ? `
          <div class="muted">
            Actief: <strong>${a.brand}</strong>
            • ${fmt(a.baseWeekly)}/wk
            • ${a.duration} jr
          </div>
          <button class="danger" onclick="cancelSponsor('${kind}')">Opzeggen</button>
        ` : `<div class="muted">Geen actieve sponsor</div>`}

        <h3 style="margin-top:10px">Nieuwe aanbiedingen</h3>
        <table>
          <thead><tr><th>Merk</th><th>Basis</th><th>Duur</th><th></th></tr></thead>
          <tbody>${offers}</tbody>
        </table>
      </div>
    `;
  };

  return `
    <div class="grid grid-2">
      ${block('shirt','Shirt-sponsor')}
      ${block('main','Hoofdsponsor')}
    </div>
  `;
}

function viewMovementTab(){
  return `
    <div class="grid grid-2">
      ${viewMovementOverview()}
    </div>
  `;
}
// --- FINANCE VIEW (v0.9.4.3 optimized rendering) ---

function viewFinance(){
  const f = state.finance.last || {
    attendance:0,tickets:0,food:0,merch:0,
    sponsor:0,tv:0,wages:0,maintenance:0,net:0
  };

  return `
    <div class="card">
      <h2>Laatste wedstrijd – Financieel overzicht</h2>

      <div class="muted" style="margin-bottom:10px">
        (Wordt na elke speeldag automatisch geüpdatet)
      </div>

      <table>
        <tbody>
          <tr><td>Toeschouwers</td><td>${f.attendance}</td></tr>
          <tr><td>Tickets</td><td class="money">${fmt(f.tickets)}</td></tr>
          <tr><td>Food & Drink</td><td class="money">${fmt(f.food)}</td></tr>
          <tr><td>Merchandise</td><td class="money">${fmt(f.merch)}</td></tr>

          <tr><td>Sponsors</td><td class="money">${fmt(f.sponsor)}</td></tr>
          <tr><td>TV-Rechten</td><td class="money">${fmt(f.tv)}</td></tr>

          <tr><td>Lonen</td><td class="money">${fmt(f.wages)}</td></tr>
          <tr><td>Onderhoud (stadion)</td><td class="money">${fmt(f.maintenance)}</td></tr>

          <tr style="font-weight:700">
            <td>Netto resultaat</td>
            <td class="money">${fmt(f.net)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}


// --- FACILITIES VIEW (v0.9.4.3 with tooltips + improved layout) ---

function upgradeFacility(key){
  const lv = state[key];
  if(lv >= 10) return;
  const cost = Math.round(50000 + lv*22000);
  if(state.budget < cost) return alert("Onvoldoende budget!");
  state.budget -= cost;
  state[key]++;
  render();
}

function viewFacilities(){
  const block = (label,key,desc)=>{
    const lv = state[key];
    return `
      <div class="card">
        <h2>${label}</h2>
        <div class="muted tooltip" data-tooltip="${desc}">
          Niveau: <strong>${lv}/10</strong>
        </div>

        <div class="progress"><span style="width:${lv*10}%"></span></div>

        <div class="muted" style="margin:8px 0">
          Upgrade kost: <strong>${fmt(50000 + lv*22000)}</strong>
        </div>

        <button class="primary" ${lv>=10?"disabled":""}
          onclick="upgradeFacility('${key}')">
          Upgrade
        </button>
      </div>
    `;
  };

  return `
    <div class="grid grid-2">
      ${block("Training","training","Verhoogt groeikansen en conditionele opbouw.")}
      ${block("Jeugdacademie","youth","Levert betere en meer jeugdspelers op.")}
      ${block("Scouting","scouting","Ontgrendelt betere spelers op de transfermarkt.")}
      ${block("Stadion","stadium","Hogere capaciteit → hogere inkomsten.")}
    </div>
  `;
}


// --- MARKET VIEW (v0.9.4.3 streamlined) ---

function viewMarket(){
  const rows = state.market.map(p=>`
    <tr>
      <td class="pos">${p.pos}</td>
      <td><strong>${p.name}</strong><div class="muted">${p.age} jr</div></td>
      <td>${p.ovr}</td>
      <td>${p.pot}</td>
      <td class="money">${fmt(p.wage)}/wk</td>
      <td class="money">${fmt(p.value)}</td>
      <td><button class="primary" onclick="buyPlayer('${p.id}')">Koop</button></td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>Transfermarkt</h2>
      <table>
        <thead>
          <tr>
            <th>Pos</th><th>Naam</th><th>OVR</th><th>POT</th>
            <th>Loon</th><th>Waarde</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <button onclick="refreshMarket()">Vernieuw markt</button>
    </div>
  `;
}


// --- YOUTH VIEW (v0.9.4.3 polished) ---

function viewYouth(){
  const rows = state.youthPool.map(p=>`
    <tr>
      <td class="pos">${p.pos}</td>
      <td><strong>${p.name}</strong><div class="muted">${p.age} jr</div></td>
      <td>${p.ovr}</td>
      <td>${p.pot}</td>
      <td class="money">${fmt(p.value)}</td>
      <td><button class="primary" onclick="signYouth('${p.id}')">Teken</button></td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>Jeugdspelers</h2>

      <table>
        <thead>
          <tr>
            <th>Pos</th><th>Naam</th><th>OVR</th><th>POT</th>
            <th>Waarde</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// --- CUP VIEW (v0.9.4.3 improved UI) ---

function viewCup(){
  if(!cupEligible()){
    return `
      <div class="card">
        <h2>Beker</h2>
        <div class="muted">Jouw divisie doet niet mee aan de beker.</div>
      </div>
    `;
  }

  const rows = state.cup.history.slice().reverse().map(f=>`
    <tr>
      <td>${f.home}</td>
      <td>${f.away}</td>
      <td>${f.score ? `${f.score[0]} - ${f.score[1]}` : '-'}</td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>Beker – Ronde ${state.cup.round}</h2>

      <button class="primary" onclick="playCupRound()" ${state.cup.active?'':'disabled'}>
        Speel ronde
      </button>

      <h3 style="margin-top:10px">Laatste uitslagen</h3>
      <table>
        <thead><tr><th>Thuis</th><th>Uit</th><th>Score</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// --- CLUB TAB (v0.9.4.3: fixed history + icons) ---

function viewClub(){
  const rows = state.history.seasons.slice().reverse().map(h=>{
    let icon = "";
    if(h.pos === 1) icon = "🏆";
    else if(h.pos <= 2) icon = "▲";
    else if(h.pos === 12) icon = "▼";

    return `
      <tr>
        <td>${h.season}</td>
        <td>${h.division}</td>
        <td><strong>${h.pos}</strong> ${icon}</td>
        <td>${h.record}</td>
        <td>${h.gf}</td>
        <td>${h.ga}</td>
        <td>${h.topScorer.name} (${h.topScorer.goals})</td>
        <td class="money">${fmt(h.budgetEnd)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="card">
      <h2>Clubhistorie</h2>

      <table>
        <thead>
          <tr>
            <th>SZN</th><th>Div</th><th>Pos</th><th>W-D-L</th>
            <th>DV</th><th>DT</th><th>Topscorer</th><th>Budget</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
// --- MOVEMENT TAB (v0.9.4.3 NEW TAB) ---

function viewMovements(){
  const data = scanDivisionResults();
  const { promote, relegate } = data;

  const prom = promote.map(n=>`<tr><td>▲</td><td>${n}</td></tr>`).join("");
  const rel = relegate.map(n=>`<tr><td>▼</td><td>${n}</td></tr>`).join("");

  return `
    <div class="grid grid-2">
      <div class="card">
        <h2>Promoties</h2>
        <table>
          <thead><tr><th></th><th>Club</th></tr></thead>
          <tbody>${prom}</tbody>
        </table>
      </div>

      <div class="card">
        <h2>Degradaties</h2>
        <table>
          <thead><tr><th></th><th>Club</th></tr></thead>
          <tbody>${rel}</tbody>
        </table>
      </div>
    </div>
  `;
}


// --- TOPBAR RENDER (v0.9.4.3 optimized) ---

function renderTopbar(){
  document.getElementById("season").textContent = state.season;
  document.getElementById("division").textContent = divisionName();
  document.getElementById("budget").textContent = fmt(state.budget);
  document.getElementById("matchday").textContent = state.matchday;
}


// --- NAVIGATION / TABS (v0.9.4.3 faster) ---

function render(){
  renderTopbar();

  let html = "";
  const tab = state.uiTab;

  if(tab === "squad") html = viewSquad();
  else if(tab === "fixtures") html = viewFixtures();
  else if(tab === "sponsors") html = viewSponsors();
  else if(tab === "finance") html = viewFinance();
  else if(tab === "facilities") html = viewFacilities();
  else if(tab === "market") html = viewMarket();
  else if(tab === "youth") html = viewYouth();
  else if(tab === "cup") html = viewCup();
  else if(tab === "club") html = viewClub();
  else if(tab === "movements") html = viewMovementTab();

  document.getElementById("view").innerHTML = html;
}


// --- DIVISION NAME UTILITY ---

function divisionName(){
  return `Divisie ${state.division}`;
}


// --- UTILS (v0.9.4.3 lightweight) ---

function rndName(){
  return choice(NAMES) + " " + choice(["Jansen","Bakker","Visser","Smit","Mulder","Dekker","Vos","Meijer","van Leeuwen"]);
}

function rndPos(){
  return choice(["GK","LB","CB","CB","RB","CM","CM","LM","RM","ST","ST"]);
}

window.toast = function(msg){
  const box = document.getElementById("toast");
  box.textContent = msg;
  box.classList.add("show");
  setTimeout(()=>box.classList.remove("show"),2000);
};


// --- NEW GAME (v0.9.4.3 setup + speed optimizations) ---

function newGame(){
  state = {
    version: "0.9.4.3",
    division: 5,
    season: 1,
    matchday: 1,
    budget: 450000,
    uiTab: "squad",

    squad: [],
    market: [],
    youthPool: [],
    sponsors: {
      shirt: { active: null, offers: [] },
      main:  { active: null, offers: [] }
    },

    finance: { last:null },
    history: { seasons:[] },
    trophies: [],
    stats: {
      leaguesWon: 0,
      cupsWon: 0,
      prizeMoney: 0
    }
  };

  // generate players
  for(let i=0;i<22;i++){
    const pos = rndPos();
    const ovr = 40 + rand(0,15);
    const pot = ovr + rand(5,25);
    state.squad.push({
      id:rid(),
      name:rndName(),
      pos,
      ovr,
      pot,
      pace: rand(30,80),
      passing: rand(30,80),
      shooting: rand(30,80),
      defense: rand(30,80),
      age: rand(17,34),
      wage: Math.round((ovr*ovr)/7 + rand(20,120)),
      value: Math.round((ovr*ovr)*40 + rand(3000,9000)),
      contract: rand(1,3),
      injured:0,
      suspended:0,
      yellows:0,
      reds:0,
      apps:0,
      seasonGoals:0,
      seasonAssists:0
    });
  }

  // league generation
  state.table = [ initYourClub(), ...genAIClubs() ];
  state.fixtures = generateFixturesFast();

  refreshMarket();
  generateYouthPool();
  genSponsorOffers();
  resetCup();

  render();
}


// --- SAVE & LOAD (v0.9.4.3 safer + faster) ---

function saveGame(){
  const data = JSON.stringify(state);
  localStorage.setItem("voetbalmanager_save", data);
  toast("Game opgeslagen");
}

function loadGame(){
  const d = localStorage.getItem("voetbalmanager_save");
  if(!d) return toast("Geen save gevonden");
  try {
    state = JSON.parse(d);
    render();
    toast("Save geladen");
  } catch(err){
    alert("Save corrupt!");
  }
}

function resetGame(){
  if(!confirm("Weet je zeker dat je een nieuw spel wilt starten?")) return;
  newGame();
  toast("Nieuw spel gestart");
}


// --- MATCHDAY BUTTON HANDLER ---

function nextDay(){
  if(state.matchday > state.fixtures.length){
    return endSeason();
  }
  playNextMatchday();
  render();
}
// --- UI SETUP (v0.9.4.3 optimized) ---

function initUI(){
  document.getElementById("tab-squad").onclick = ()=>{ state.uiTab="squad"; render(); };
  document.getElementById("tab-fixtures").onclick = ()=>{ state.uiTab="fixtures"; render(); };
  document.getElementById("tab-sponsors").onclick = ()=>{ state.uiTab="sponsors"; render(); };
  document.getElementById("tab-finance").onclick = ()=>{ state.uiTab="finance"; render(); };
  document.getElementById("tab-facilities").onclick = ()=>{ state.uiTab="facilities"; render(); };
  document.getElementById("tab-market").onclick = ()=>{ state.uiTab="market"; render(); };
  document.getElementById("tab-youth").onclick = ()=>{ state.uiTab="youth"; render(); };
  document.getElementById("tab-cup").onclick = ()=>{ state.uiTab="cup"; render(); };
  document.getElementById("tab-club").onclick = ()=>{ state.uiTab="club"; render(); };
  document.getElementById("tab-movements").onclick = ()=>{ state.uiTab="movements"; render(); };

  document.getElementById("nextDayBtn").onclick = nextDay;
  document.getElementById("saveBtn").onclick = saveGame;
  document.getElementById("loadBtn").onclick = loadGame;
  document.getElementById("newGameBtn").onclick = resetGame;

  render();
}


// --- DRAG & DROP HANDLING (v0.9.4.3 tightened & safer) ---

function allowDrop(e){
  e.preventDefault();
}

function dragOverXI(e, idx){
  e.preventDefault();
}
function dragOverBench(e, idx){
  e.preventDefault();
}


// --- TOGGLE DARK MODE (ready for future feature) ---

function toggleDark(){
  document.body.classList.toggle("dark");
}


// --- STARTUP LOGIC ---

window.addEventListener("load", ()=>{
  const save = localStorage.getItem("voetbalmanager_save");
  if(save){
    try {
      state = JSON.parse(save);

      // backward compatibility fixes (v0.9.4.0 → v0.9.4.3)
      if(!state.history || typeof state.history !== "object")
        state.history = { seasons:[] };

      if(!state.stats)
        state.stats = { leaguesWon:0, cupsWon:0, prizeMoney:0 };

      if(!state.trophies)
        state.trophies = [];

      if(!state.finance)
        state.finance = { last:null };

      if(!state.uiTab)
        state.uiTab = "squad";

      if(!Array.isArray(state.squad))
        state.squad = [];

      if(!Array.isArray(state.market))
        state.market = [];

      if(!Array.isArray(state.youthPool))
        state.youthPool = [];

      if(!state.sponsors)
        state.sponsors = { shirt:{active:null,offers:[]}, main:{active:null,offers:[]} };

      if(!state.table || !Array.isArray(state.table))
        state.table = [ initYourClub(), ...genAIClubs() ];

      if(!state.fixtures || !Array.isArray(state.fixtures))
        state.fixtures = generateFixturesFast();

      initUI();
      toast("Save geladen");
      return;
    } catch(err){
      console.warn("Fout bij laden save:", err);
    }
  }

  // anders: nieuw spel
  newGame();
  initUI();
});
// --- PLAYER GENERATION UTILITIES (v0.9.4.3 optimized) ---

const POS = ["GK","LB","CB","RB","DM","CM","LM","RM","AM","LW","RW","ST"];

// Random player generator with fewer CPU calls
function genPlayer(baseOVR=40){
  const pos = choice(POS);
  const ovr = baseOVR + rand(0,15);
  const pot = ovr + rand(5,25);

  return {
    id: rid(),
    name: rndName(),
    pos,
    ovr,
    pot,
    pace: rand(30,80),
    passing: rand(30,80),
    shooting: rand(30,80),
    defense: rand(30,80),
    age: rand(17,35),
    wage: Math.round((ovr * ovr)/7 + rand(30,140)),
    value: Math.round((ovr * ovr)*40 + rand(2000,12000)),
    contract: rand(1,3),
    injured: 0,
    suspended: 0,
    yellows: 0,
    reds: 0,
    apps: 0,
    seasonGoals: 0,
    seasonAssists: 0
  };
}


// --- DEBUG PANEL (handig tijdens development) ---

function debugGiveMoney(){
  state.budget += 500000;
  toast("+ €500.000");
  render();
}

function debugInjureRandom(){
  const p = choice(state.squad);
  p.injured = 2 + rand(0,3);
  toast(`${p.name} is geblesseerd...`);
  render();
}


// --- STAR RATING (v0.9.4.3 minor feature) ---

function starRating(ovr){
  if(ovr >= 85) return "★★★★★";
  if(ovr >= 75) return "★★★★☆";
  if(ovr >= 65) return "★★★☆☆";
  if(ovr >= 55) return "★★☆☆☆";
  return "★☆☆☆☆";
}


// --- SQUAD SORT HELPERS ---

function sortSquadByPos(arr){
  const order = {
    GK:0, LB:1, CB:2, RB:3, DM:4, CM:5, LM:6, RM:7, AM:8, LW:9, RW:10, ST:11
  };
  return arr.slice().sort((a,b)=> order[a.pos] - order[b.pos]);
}

function sortSquadByValue(arr){
  return arr.slice().sort((a,b)=> b.value - a.value);
}

function sortSquadByOvr(arr){
  return arr.slice().sort((a,b)=> b.ovr - a.ovr);
}


// --- INJURY & CARD RESOLUTION EACH MATCHDAY ---

function resolveDisciplineAndInjuries(){
  for(const p of state.squad){
    // reduce injury timers
    if(p.injured > 0){
      p.injured--;
    }

    // suspensions
    if(p.suspended > 0){
      p.suspended--;
    }

    // yellow → suspension
    if(p.yellows >= 3){
      p.suspended = 1;
      p.yellows = 0;
    }

    // random injuries (2.5%)
    if(Math.random() < 0.025){
      p.injured = 1 + rand(0,2);
      toast(`${p.name} raakt licht geblesseerd`);
    }
  }
}


// --- SIMPLE MATCHDAY LOOP (used inside playNextMatchday) ---

function matchdayProcess(){
  resolveDisciplineAndInjuries();
  trainPlayers();
  financeTick(true);
}



// --- CHAMPION ROW GLOW (v0.9.4.3) ---
// Used in UI. If champion → row gets glow CSS class.

function isChampionRow(idx){
  return idx === 0 && state._seasonChampionGlow;
}


// --- SAFE EXPORTS FOR DEBUGGING (optional) ---

window._state = ()=>state;
window._reset = newGame;
window._save = saveGame;
window._load = loadGame;

// --- FINAL SMALL HELPERS (v0.9.4.3) ---

function money(n){
  return fmt(n);
}

function tag(txt, col="#333"){
  return `<span class="tag" style="background:${col}">${txt}</span>`;
}

function safeNum(n, def=0){
  return (typeof n === "number" && !isNaN(n)) ? n : def;
}

function safeArr(a){
  return Array.isArray(a) ? a : [];
}


// --- END OF FILE WRAPPER ---

})(); // <--- sluit de volledige BlankBall Manager engine
