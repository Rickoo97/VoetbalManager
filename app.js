/**
 * Online Voetbal Manager V3.6
 * - FIX: Automatische tab-wissel na promotie/degradatie.
 * - UI: Groene (promotie) en Rode (degradatie) zones in de stand.
 */

// --- 1. CONFIGURATIE ---
const CONFIG = {
    version: "3.6",
    gameTitle: "Online Voetbal Manager",
    startBudget: 300000,
    currency: "€",
    maxMatchdays: 34,

    costs: {
        stadium: [0, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000],
        training: [0, 75000, 150000, 300000, 750000, 1500000, 3000000, 6000000],
        medical:  [0, 50000, 100000, 200000, 500000, 1000000, 2000000, 4000000]
    },

    tactics: {
        neutral: { name: "Neutraal (4-4-2)", attBonus: 0, defBonus: 0, desc: "Gebalanceerde speelstijl." },
        attack:  { name: "Aanvallend (4-3-3)", attBonus: 5, defBonus: -5, desc: "Scoor meer, maar geef meer weg." },
        defense: { name: "Verdedigend (5-3-2)", attBonus: -5, defBonus: 5, desc: "Parkeer de bus. Minder tegengoals." }
    },

    sponsors: {
        local: ["Bakkerij Jansen", "Garage Snel", "Café 't Hoekje", "Slagerij Henk", "Kapsalon Modern"],
        national: ["Jumbo", "Albert Heijn", "Gamma", "Praxis", "Coolblue", "Bol.com"],
        global: ["Ziggo", "KPN", "Philips", "Heineken", "ASML", "Shell", "ING"]
    },
    
    firstNames: ["Jan", "Piet", "Klaas", "Luuk", "Daan", "Sem", "Lucas", "Milan", "Levi", "Noah", "Thijs", "Jesse", "Bram", "Tom", "Tim", "Lars", "Finn", "Kevin", "Rico", "Nick", "Xavi", "Mo", "Denzel"],
    lastNames:  ["Jansen", "de Vries", "Bakker", "Visser", "Smit", "Meijer", "de Jong", "Mulder", "Groot", "Bos", "Vos", "Peters", "Hendriks", "Dekker", "Brouwer", "Koning", "Maas", "Simons", "Gakpo"],
    positions: ["DM", "VL", "CV", "VR", "VVM", "CM", "CAM", "LB", "SP", "RB"],
    
    realLeagues: {
        1: ["PSV", "Feyenoord", "FC Twente", "AZ", "Ajax", "NEC", "FC Utrecht", "Sparta Rotterdam", "Go Ahead Eagles", "Fortuna Sittard", "sc Heerenveen", "PEC Zwolle", "Almere City FC", "Heracles Almelo", "RKC Waalwijk", "Willem II", "FC Groningen", "NAC Breda"],
        2: ["Excelsior", "FC Volendam", "Vitesse", "ADO Den Haag", "Roda JC", "FC Dordrecht", "De Graafschap", "FC Emmen", "SC Cambuur", "VVV-Venlo", "MVV Maastricht", "Helmond Sport", "Telstar", "TOP Oss", "FC Den Bosch", "FC Eindhoven", "Jong Ajax", "Jong PSV", "Jong AZ", "Jong FC Utrecht"]
    },
    cities: ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Breda", "Zwolle", "Leiden", "Maastricht", "Dordrecht", "Emmen", "Venlo"],
    suffixes: ["FC", "United", "City", "Boys", "'04", "SV", "Rangers", "Stars"]
};

const UTILS = {
    rid: () => Math.random().toString(36).slice(2, 10),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    fmtMoney: (n) => `${CONFIG.currency} ${n.toLocaleString('nl-NL')}`,
    genName: () => `${UTILS.choice(CONFIG.firstNames)} ${UTILS.choice(CONFIG.lastNames)}`,
    genClubName: () => `${UTILS.choice(CONFIG.cities)} ${UTILS.choice(CONFIG.suffixes)}`,
    getLeagueName: (div) => div === 1 ? "Eredivisie" : (div === 2 ? "Keuken Kampioen Div" : `Divisie ${div}`),
    getLeagueShort: (div) => div === 1 ? "ERE" : (div === 2 ? "KKD" : `DIV ${div}`)
};

// --- 2. STATE ---
const Store = {
    state: {
        game: { day: 1, season: 1 },
        club: { 
            id: "player_club", name: "Mijn Club", budget: CONFIG.startBudget, division: 5,
            facilities: { stadium: 1, training: 1, medical: 1 },
            tactic: "neutral",
            sponsor: null, sponsorOffers: []
        },
        cup: { active: false, inTournament: false, nextRound: 0, history: [] },
        ui: { currentTab: 'welcome', viewDivision: 5, theme: 'dark' },
        finance: { lastWeek: { income: 0, expenses: 0, profit: 0, breakdown: [] } },
        
        team: [], market: [], transferList: [], incomingOffers: [], youthAcademy: [],
        competitions: {}, results: []
    },

    init() {
        const saved = localStorage.getItem("ovm_save_v36");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                this.state.club = { ...this.state.club, ...parsed.club };
                this.state.club.facilities = { ...this.state.club.facilities, ...parsed.club.facilities };
                if(!this.state.cup) this.state.cup = { active: false, inTournament: false, nextRound: 0, history: [] };
                if(this.state.ui.currentTab === 'welcome' && this.state.team.length > 0) this.state.ui.currentTab = 'dashboard';
            } catch (e) { this.state.ui.currentTab = 'welcome'; }
        } else { this.state.ui.currentTab = 'welcome'; }
        UI.applyTheme();
    },

    startGame(customName) {
        this.state.club.name = customName || "Mijn Club FC";
        this.state.club.budget = CONFIG.startBudget;
        this.state.club.facilities = { stadium: 1, training: 1, medical: 1 };
        this.state.club.tactic = "neutral";
        this.state.game.day = 1;
        this.state.game.season = 1;
        this.state.club.division = 5;
        this.state.ui.viewDivision = 5;
        this.state.ui.currentTab = 'dashboard';
        
        this.state.team = Engine.generateSquad(18);
        this.state.market = Engine.generateMarket(15);
        this.state.transferList = [];
        this.state.incomingOffers = [];
        this.state.youthAcademy = [];
        
        this.state.competitions = Engine.generateAllDivisions();
        Engine.generateSponsorOffers();
        Engine.initCupSeason();

        this.save();
        UI.render(); 
    },

    save() { localStorage.setItem("ovm_save_v36", JSON.stringify(this.state)); UI.toast("Spel opgeslagen"); },
    reset() { if(confirm("Opnieuw beginnen?")){ localStorage.removeItem("ovm_save_v36"); location.reload(); } }
};

// --- 3. ENGINE ---
const Engine = {
    generateSquad(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer(i<2?"DM":null)); return s.sort((a,b)=>b.ovr-a.ovr); },
    generateMarket(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer()); return s.sort((a,b)=>b.ovr-a.ovr); },
    
    createPlayer(posOverride, ageOverride) { 
        const finalPos = posOverride || UTILS.choice(CONFIG.positions); 
        const age = ageOverride || UTILS.rand(16,35);
        let base = 40;
        if(age > 22) base = 55;
        if(age > 28) base = 60;
        const ovr = base + UTILS.rand(0,20); 
        const val = Math.round(ovr*ovr*25 + UTILS.rand(0,10000));
        const wage = Math.round(val/250); 
        return { id: UTILS.rid(), name: UTILS.genName(), age: age, pos: finalPos, ovr: ovr, value: val, wage: wage }; 
    },

    scoutYouth() {
        if(Store.state.club.facilities.training < 3) return UI.toast("Je hebt Training Level 3 nodig!");
        const cost = 25000;
        if(Store.state.club.budget < cost) return UI.toast("Scouten kost € 25.000");
        Store.state.club.budget -= cost;
        const talent = this.createPlayer(null, 15 + UTILS.rand(0,1));
        talent.ovr = 35 + UTILS.rand(0,15); 
        talent.value = 10000; talent.wage = 100;
        Store.state.youthAcademy.push(talent);
        Store.save(); UI.render(); UI.toast("Talent gevonden!");
    },

    promoteYouth(id) {
        const idx = Store.state.youthAcademy.findIndex(x=>x.id===id); if(idx<0) return;
        const p = Store.state.youthAcademy[idx];
        if(Store.state.team.length >= 30) return UI.toast("Selectie is vol!");
        if(Store.state.club.budget < 5000) return UI.toast("Te weinig geld");
        Store.state.club.budget -= 5000;
        Store.state.team.push(p); Store.state.youthAcademy.splice(idx, 1);
        Store.save(); UI.render(); UI.toast(`${p.name} getekend!`);
    },

    placeBid(id) {
        const p = Store.state.market.find(x=>x.id===id); if(!p) return;
        const minV = Math.round(p.value * 0.9); const maxV = Math.round(p.value * 1.3);
        const ask = prompt(`Marktwaarde: ${UTILS.fmtMoney(minV)} - ${UTILS.fmtMoney(maxV)}\nDoe een bod op ${p.name}:`, p.value);
        if(!ask) return;
        const bid = parseInt(ask);
        if(isNaN(bid)) return UI.toast("Ongeldig bedrag");
        if(Store.state.club.budget < bid) return UI.toast("Onvoldoende budget!");
        const required = Math.round(p.value * (0.95 + Math.random()*0.3)); 
        if(bid >= required) {
            if(Store.state.team.length >= 30) return UI.toast("Selectie is vol!");
            Store.state.club.budget -= bid;
            Store.state.team.push(p); Store.state.market = Store.state.market.filter(x=>x.id !== id);
            Store.save(); UI.render(); alert(`✅ BOD GEACCEPTEERD!\n\n${p.name} komt naar jouw club.`);
        } else { alert(`❌ BOD GEWEIGERD.\n\nDe club wil minstens ${UTILS.fmtMoney(required)}.`); }
    },

    toggleTransferList(id) {
        const idx = Store.state.transferList.indexOf(id);
        if(idx > -1) { Store.state.transferList.splice(idx, 1); UI.toast("Van transferlijst."); } 
        else { Store.state.transferList.push(id); UI.toast("Op transferlijst."); }
        Store.save(); UI.render();
    },

    acceptOffer(offerId) {
        const oIdx = Store.state.incomingOffers.findIndex(o => o.id === offerId); if(oIdx < 0) return;
        const offer = Store.state.incomingOffers[oIdx];
        const pIndex = Store.state.team.findIndex(p => p.id === offer.playerId);
        
        if(pIndex < 0) { Store.state.incomingOffers.splice(oIdx, 1); Store.save(); UI.render(); return; }
        if(Store.state.team.length <= 11) return UI.toast("Minimaal 11 spelers houden!");
        
        const p = Store.state.team[pIndex];
        Store.state.club.budget += offer.amount;
        Store.state.team.splice(pIndex, 1); Store.state.incomingOffers.splice(oIdx, 1);
        const tlIdx = Store.state.transferList.indexOf(offer.playerId); if(tlIdx > -1) Store.state.transferList.splice(tlIdx, 1);
        Store.save(); UI.render(); alert(`🤝 DEAL!\n\n${p.name} verkocht aan ${offer.club} voor ${UTILS.fmtMoney(offer.amount)}.`);
    },

    rejectOffer(offerId) {
        const idx = Store.state.incomingOffers.findIndex(o => o.id === offerId);
        if(idx > -1) { Store.state.incomingOffers.splice(idx, 1); Store.save(); UI.render(); UI.toast("Bod geweigerd."); }
    },

    generateSponsorOffers() {
        let offers = []; const divFactor = (6 - Store.state.club.division); 
        let pool = Store.state.club.division <= 2 ? CONFIG.sponsors.global : (Store.state.club.division <= 3 ? CONFIG.sponsors.national : CONFIG.sponsors.local);
        for(let i=0; i<3; i++) offers.push({ id:UTILS.rid(), name:UTILS.choice(pool), amount: 15000*divFactor + UTILS.rand(-2000,5000), duration: UTILS.rand(10,30) });
        Store.state.club.sponsorOffers = offers;
    },
    
    signSponsor(id) { 
        const o = Store.state.club.sponsorOffers.find(x=>x.id===id); 
        if(o) { Store.state.club.sponsor = {name:o.name, amount:o.amount, weeksLeft:o.duration}; Store.state.club.sponsorOffers=[]; Store.save(); UI.render(); } 
    },
    
    generateAllDivisions() { 
        let comps={}; 
        for(let d=1;d<=5;d++){ 
            let teams=[]; let size=d===1?18:(d===2?20:16); let ai=(d===5)?size-1:size; 
            const mkTeam = (id, name, str) => ({ id, name, strength: str, pts: 0, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0 });
            if(CONFIG.realLeagues[d]) CONFIG.realLeagues[d].forEach(n => teams.push(mkTeam(UTILS.rid(), n, d===1?80:70))); 
            else for(let i=0;i<ai;i++) teams.push(mkTeam(UTILS.rid(), UTILS.genClubName(), 90-(d*10))); 
            if(d===5) teams.push(mkTeam(Store.state.club.id, Store.state.club.name, 0)); 
            comps[d]=teams; 
        } 
        return comps; 
    },

    initCupSeason() {
        const div = Store.state.club.division;
        if(div <= 3) {
            Store.state.cup = { active: true, inTournament: true, nextRound: 5, history: [] };
        } else {
            Store.state.cup = { active: false, inTournament: false, history: [] };
        }
    },

    playCupMatch() {
        const c = Store.state.cup;
        if(!c.inTournament) return;
        const possibleDivs = [1, 2, 3];
        const rndDiv = UTILS.choice(possibleDivs);
        const opponents = Store.state.competitions[rndDiv].filter(t => t.id !== Store.state.club.id);
        const opp = UTILS.choice(opponents);
        const res = this.playMatch({strength: this.calculatePlayerTeamStrength(), id: Store.state.club.id}, opp);
        
        let msg = "", win = false;
        if(res[0] === res[1]) {
            win = Math.random() > 0.5;
            msg = `Gelijkspel (${res[0]}-${res[1]}). Strafschoppen... ${win ? 'GEWONNEN!' : 'VERLOREN.'}`;
        } else if(res[0] > res[1]) { win = true; msg = `WINST! (${res[0]}-${res[1]})`; } 
        else { win = false; msg = `VERLIES. (${res[0]}-${res[1]})`; }

        let roundName = "";
        if(Store.state.game.day === 5) roundName = "1/8 Finale";
        if(Store.state.game.day === 10) roundName = "Kwartfinale";
        if(Store.state.game.day === 15) roundName = "Halve Finale";
        if(Store.state.game.day === 20) roundName = "FINALE";

        c.history.push({ round: roundName, opponent: opp.name, result: msg, score: res, win: win });

        if(!win) {
            c.inTournament = false;
            alert(`🏆 KNVB BEKER - ${roundName}\n\n${msg}\n\nJe ligt uit het toernooi.`);
        } else {
            if(roundName === "FINALE") {
                Store.state.club.budget += 250000;
                c.inTournament = false;
                alert(`🏆🏆🏆 KAMPIOEN!\n\nJe wint de KNVB Beker!\nBonus: € 250.000`);
            } else {
                alert(`🏆 KNVB BEKER - ${roundName}\n\n${msg}\n\nJe bent door naar de volgende ronde!`);
            }
        }
    },
    
    calculatePlayerTeamStrength() { const s=Store.state.team; if(s.length===0)return 30; const b=s.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11); return Math.round(b.reduce((a,c)=>a+c.ovr,0)/b.length); },
    upgradeFacility(type) { const lvl=Store.state.club.facilities[type]; if(lvl>=8)return UI.toast("Max level"); const c=CONFIG.costs[type][lvl]; if(Store.state.club.budget<c)return UI.toast("Te weinig budget"); Store.state.club.budget-=c; Store.state.club.facilities[type]++; Store.save(); UI.render(); UI.toast("Upgrade!"); },
    setTactic(key) { Store.state.club.tactic=key; Store.save(); UI.render(); UI.toast(`Tactiek: ${CONFIG.tactics[key].name}`); },

    processMatchday() {
        if(Store.state.game.day > CONFIG.maxMatchdays) { this.endSeason(); return; }
        Store.state.results = []; 
        const me = Store.state.competitions[Store.state.club.division].find(c => c.id === Store.state.club.id);
        if(me) me.strength = this.calculatePlayerTeamStrength();

        let report = { income: 0, expenses: 0, breakdown: [] };
        if(Store.state.cup && Store.state.cup.inTournament) {
            const days = [5, 10, 15, 20];
            if(days.includes(Store.state.game.day)) this.playCupMatch();
        }

        const wages = Store.state.team.reduce((sum, p) => sum + p.wage, 0);
        const maint = (Store.state.club.facilities.stadium * 1000) + (Store.state.club.facilities.training * 800) + (Store.state.club.facilities.medical * 1500);
        report.expenses = wages + maint;
        report.breakdown.push({txt:"Salarissen & Onderhoud", amt:-(wages+maint)});

        if(Store.state.club.sponsor) {
            report.income += Store.state.club.sponsor.amount;
            report.breakdown.push({txt:`Sponsor (${Store.state.club.sponsor.name})`, amt:Store.state.club.sponsor.amount});
            Store.state.club.sponsor.weeksLeft--;
            if(Store.state.club.sponsor.weeksLeft<=0) { Store.state.club.sponsor=null; UI.toast("Sponsor contract afgelopen"); this.generateSponsorOffers(); }
        }
        Store.state.club.budget += (report.income - report.expenses);

        for(let div = 1; div <= 5; div++) this.simulateRound(div, report);
        this.simulateTransfers();
        Store.state.market.splice(0, 3); Store.state.market.push(...this.generateMarket(3)); Store.state.market.sort((a,b)=>b.ovr-a.ovr);
        Store.state.finance.lastWeek = { ...report, profit: report.income - report.expenses };
        Store.state.game.day++; Store.save(); UI.render(); UI.toast(`Ronde ${Store.state.game.day-1} voltooid.`);
    },

    simulateRound(divNr, report) {
        const teams = Store.state.competitions[divNr];
        if(!teams) return; 
        if(Store.state.game.day > (teams.length-1)*2) return;
        
        const shuf = [...teams].sort(()=>0.5-Math.random());
        for(let i=0; i<shuf.length; i+=2) {
            const h=shuf[i], a=shuf[i+1]; if(!a) break;
            if(h.id===Store.state.club.id) {
                const inc = Math.round(500 * Math.pow(1.6, Store.state.club.facilities.stadium) * 0.85 * 18 * 1.2);
                Store.state.club.budget += inc;
                if(report) { report.income+=inc; report.breakdown.push({txt:"Tickets", amt:inc}); }
            }
            const res = this.playMatch(h,a);
            if(divNr===Store.state.club.division) Store.state.results.push({home:h.name, away:a.name, score:res, isYou:(h.id===Store.state.club.id||a.id===Store.state.club.id)});
            this.applyResult(h,a,res);
        }
    },

    simulateTransfers() {
        Store.state.team.forEach(p => {
            let chance = Store.state.transferList.includes(p.id) ? 0.25 : (p.ovr > 75 ? 0.02 : 0);
            if(Math.random() < chance) {
                const existing = Store.state.incomingOffers.find(o => o.playerId === p.id);
                if(existing) return;
                let allAIClubs = [];
                for(let d=1; d<=5; d++) if(Store.state.competitions[d]) allAIClubs.push(...Store.state.competitions[d].filter(c => c.id !== Store.state.club.id));
                if(allAIClubs.length === 0) return; 
                const buyer = UTILS.choice(allAIClubs);
                const factor = 0.9 + (Math.random() * 0.4);
                const amount = Math.round(p.value * factor);
                Store.state.incomingOffers.push({ id: UTILS.rid(), playerId: p.id, playerName: p.name, club: buyer.name, amount: amount });
                UI.toast(`📩 Bod van ${buyer.name} op ${p.name}!`);
            }
        });
    },

    playMatch(h,a){ 
        let hS=h.strength+3, aS=a.strength;
        if(h.id===Store.state.club.id) hS += 2+(Store.state.club.facilities.stadium*0.4) + CONFIG.tactics[Store.state.club.tactic].attBonus;
        if(a.id===Store.state.club.id) aS += CONFIG.tactics[Store.state.club.tactic].attBonus;
        let gH = Math.max(0, Math.round(1.5 + ((hS-aS)/15) + UTILS.rand(-1,2)));
        let gA = Math.max(0, Math.round(1.2 - ((hS-aS)/15) + UTILS.rand(-1,2)));
        return [gH,gA];
    },
    applyResult(h,a,[gh,ga]){ h.played++;a.played++;h.gf+=gh;h.ga+=ga;h.gd=h.gf-h.ga;a.gf+=ga;a.ga+=gh;a.gd=a.gf-a.ga; if(gh>ga){h.won++;h.pts+=3;a.lost++}else if(ga>gh){a.won++;a.pts+=3;h.lost++}else{h.draw++;h.pts++;a.draw++;a.pts++} },

    endSeason() {
        let msg=`Seizoen ${Store.state.game.season} voorbij!\n`;
        let newC=JSON.parse(JSON.stringify(Store.state.competitions));
        
        for(let d=1; d<=5; d++) {
            let t=Store.state.competitions[d].sort((a,b)=>b.pts-a.pts);
            if(t.find(x=>x.id===Store.state.club.id)){
                let pos=t.findIndex(x=>x.id===Store.state.club.id);
                Store.state.club.budget += Math.round(1000000/d*(t.length-pos));
                if(d>1 && pos<2) { msg+="GEPROMOVEERD! 🎉"; Store.state.club.division--; }
                if(d<5 && pos>=t.length-2) { msg+="GEDEGRADEERD... 😞"; Store.state.club.division++; }
            }
            newC[d].forEach(x=>{ x.played=0;x.pts=0;x.gf=0;x.ga=0;x.gd=0;x.won=0;x.draw=0;x.lost=0; });
        }
        
        Store.state.competitions=newC;
        Store.state.team.forEach(p=>{ p.age++; p.value=Math.round(p.ovr*p.ovr*25); });
        Store.state.transferList = []; Store.state.incomingOffers = [];
        Store.state.game.season++; Store.state.game.day=1;
        
        // --- FIX: Reset UI View naar de nieuwe divisie! ---
        Store.state.ui.viewDivision = Store.state.club.division;
        
        this.initCupSeason();
        alert(msg); Store.save(); UI.render();
    }
};

// --- 4. UI ---
const UI = {
    elements: {},
    init() {
        this.elements.app = document.getElementById("view");
        document.body.addEventListener('click', (e) => this.handleClicks(e));
        this.render();
    },

    handleClicks(e) {
        const t = e.target;
        if(t.id === 'btn-continue') { if(Store.state.ui.currentTab !== 'welcome') Engine.processMatchday(); }
        if(t.id === 'btn-save') Store.save();
        if(t.id === 'btn-reset') Store.reset();
        if(t.id === 'btn-theme-toggle') this.toggleTheme();
        if(t.id === 'btn-start') Store.startGame(document.getElementById("inp-name").value);
        if(t.id === 'btn-scout') Engine.scoutYouth();
        
        if(t.classList.contains('btn-list')) Engine.toggleTransferList(t.dataset.id);
        if(t.classList.contains('btn-bid')) Engine.placeBid(t.dataset.id);
        if(t.classList.contains('btn-acc')) Engine.acceptOffer(t.dataset.id);
        if(t.classList.contains('btn-rej')) Engine.rejectOffer(t.dataset.id);
        if(t.classList.contains('btn-sign')) Engine.promoteYouth(t.dataset.id);
    },

    toggleTheme() { Store.state.ui.theme = (Store.state.ui.theme==='dark'?'light':'dark'); this.applyTheme(); Store.save(); this.updateThemeBtn(); },
    applyTheme() { document.body.classList.toggle('light-mode', Store.state.ui.theme==='light'); },
    updateThemeBtn() { document.getElementById("btn-theme-toggle").innerText = Store.state.ui.theme==='light' ? "☀️ Licht" : "🌙 Donker"; },
    toast(msg) { const t=document.getElementById("toast"); t.innerText=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3000); },

    render() {
        this.renderNav(); this.updateThemeBtn();
        const tab = Store.state.ui.currentTab;
        const cont = this.elements.app;
        if(tab==='welcome') { document.querySelector(".sidebar").style.display='none'; document.querySelector(".top-header").style.display='none'; }
        else { document.querySelector(".sidebar").style.display='flex'; document.querySelector(".top-header").style.display='flex'; this.renderTopbar(); }

        cont.innerHTML="";
        if(tab==='welcome') cont.appendChild(Views.Welcome());
        else if(tab==='dashboard') cont.appendChild(Views.Dashboard());
        else if(tab==='squad') cont.appendChild(Views.Squad());
        else if(tab==='transfers') cont.appendChild(Views.TransferMarket());
        else if(tab==='youth') cont.appendChild(Views.YouthAcademy());
        else if(tab==='tactics') cont.appendChild(Views.Tactics());
        else if(tab==='league') cont.appendChild(Views.League());
        else if(tab==='fixtures') cont.appendChild(Views.Fixtures());
        else if(tab==='club') cont.appendChild(Views.Facilities());
        else if(tab==='sponsors') cont.appendChild(Views.Sponsors());
        else if(tab==='finance') cont.appendChild(Views.Finance());
        else if(tab==='beker') cont.appendChild(Views.Cup());
    },

    renderNav() {
        const nav = document.getElementById("main-nav"); nav.innerHTML="";
        const L = [
            {id:'dashboard',i:'🏠',l:'Overzicht'}, {id:'squad',i:'👥',l:'Selectie'}, 
            {id:'transfers',i:'💸',l:'Transfermarkt'}, {id:'youth',i:'🎓',l:'Jeugd'},
            {id:'tactics',i:'📋',l:'Tactiek'}, {id:'league',i:'🏆',l:'Competitie'}, 
            {id:'fixtures',i:'📅',l:'Programma'}, {id:'club',i:'🏗️',l:'Faciliteiten'}, 
            {id:'sponsors',i:'🤝',l:'Sponsors'}, {id:'finance',i:'📊',l:'Financiën'}
        ];
        if(Store.state.club.division <= 3) L.push({id:'beker', i:'🏆', l:'KNVB Beker'});
        L.forEach(x=>{
            const d=document.createElement('div'); d.className=`nav-item ${Store.state.ui.currentTab===x.id?'active':''}`;
            d.innerHTML=`<span style="margin-right:8px">${x.i}</span> ${x.l}`; d.onclick=()=>{Store.state.ui.currentTab=x.id;this.render();};
            nav.appendChild(d);
        });
    },

    renderTopbar() {
        document.getElementById("budget").innerText = UTILS.fmtMoney(Store.state.club.budget);
        document.getElementById("club-name").innerText = Store.state.club.name;
        document.getElementById("club-division").innerText = UTILS.getLeagueShort(Store.state.club.division);
        let max = 0;
        if(Store.state.competitions[Store.state.club.division]) {
            max = (Store.state.competitions[Store.state.club.division].length-1)*2;
        }
        document.getElementById("matchday").innerText = `${Store.state.game.day} / ${max}`;
    }
};

// --- 5. VIEWS ---
const Views = {
    Welcome() {
        const d=document.createElement('div'); d.className="card"; d.style.textAlign="center"; d.style.maxWidth="400px"; d.style.margin="100px auto";
        d.innerHTML=`<h1>${CONFIG.gameTitle}</h1><p class="muted">Start je carrière.</p><div style="margin:30px 0"><label style="display:block;margin-bottom:10px">Clubnaam</label><input type="text" id="inp-name" value="FC Breda" style="padding:10px;width:100%;border-radius:8px;border:1px solid #444;background:var(--bg-body);color:var(--text-main)"></div><button class="primary" id="btn-start" style="width:100%">Start Carrière</button>`;
        return d;
    },

    Dashboard() {
        const d=document.createElement('div');
        let offersHtml = "";
        if(Store.state.incomingOffers.length > 0) offersHtml = `<div style="background:rgba(34,197,94,0.15); border:1px solid #22c55e; padding:15px; border-radius:8px; margin-bottom:20px;"><strong>🚨 Je hebt ${Store.state.incomingOffers.length} nieuw(e) bod(en)!</strong><br><span style="font-size:13px">Ga naar Transfermarkt.</span></div>`;
        let sponsorHtml = "";
        if(Store.state.club.sponsor) sponsorHtml = `<div style="margin-bottom:15px; padding:10px; border-radius:8px; background:rgba(34, 197, 94, 0.1); border:1px solid #22c55e;">Sponsor: <strong>${Store.state.club.sponsor.name}</strong> (+ ${UTILS.fmtMoney(Store.state.club.sponsor.amount)}/wk)</div>`;
        else sponsorHtml = `<div style="margin-bottom:15px; padding:10px; border-radius:8px; background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444;">⚠️ <strong>Geen sponsor!</strong> Ga snel naar Sponsors om een deal te sluiten.</div>`;
        
        let cupHtml = "";
        if(Store.state.cup && Store.state.cup.active) {
            const c = Store.state.cup;
            const status = c.inTournament ? "<span style='color:#22c55e'>Je zit nog in het toernooi!</span>" : "<span style='color:#ef4444'>Uitgeschakeld.</span>";
            cupHtml = `<div class="card" style="margin-bottom:15px; border-left:4px solid #facc15"><h3>🏆 KNVB Beker</h3><p>${status}</p></div>`;
        }

        const r = Store.state.results.find(x=>x.isYou);
        let resHTML = r ? `<div style="font-size:20px;font-weight:bold;border-left:4px solid #22c55e;padding-left:10px;margin-top:10px">${r.home} ${r.score[0]} - ${r.score[1]} ${r.away}</div>` : `<p class="muted">Nog geen wedstrijd gespeeld.</p>`;
        d.innerHTML=`<h2>Overzicht</h2>${offersHtml}${sponsorHtml}${cupHtml}<div class="card"><p>Welkom bij <strong>${Store.state.club.name}</strong>.</p><hr style="border:0;border-top:1px dashed var(--border);margin:15px 0"><h3>Laatste resultaat</h3>${resHTML}</div>`;
        return d;
    },
    
    Cup() {
        const d = document.createElement('div');
        const c = Store.state.cup;
        let hist = "";
        if(c.history.length === 0) hist = "<p class='muted'>Nog geen wedstrijden gespeeld.</p>";
        else c.history.forEach(h => { hist += `<div style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between"><span><strong>${h.round}</strong> vs ${h.opponent}</span><span style="font-weight:bold; color:${h.win?'#22c55e':'#ef4444'}">${h.score[0]} - ${h.score[1]}</span></div>`; });
        let status = c.inTournament ? `<div style="padding:20px; text-align:center; background:rgba(34,197,94,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Je zit nog in de race!</h2><p>Volgende ronde rond speeldag ${c.nextRound}</p></div>` : `<div style="padding:20px; text-align:center; background:rgba(239,68,68,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Helaas, uitgeschakeld.</h2></div>`;
        d.innerHTML = `<h2>KNVB Beker</h2>${status}<div class="card"><h3>Geschiedenis</h3>${hist}</div>`;
        return d;
    },

    Sponsors() {
        const d=document.createElement('div');
        if(Store.state.club.sponsor) {
            let s = Store.state.club.sponsor;
            d.innerHTML=`<h2>Sponsor</h2><div class="card" style="text-align:center"><h1>${s.name}</h1><h3>${UTILS.fmtMoney(s.amount)} / week</h3><p class="muted">Looptijd: nog <strong>${s.weeksLeft}</strong> weken</p></div>`;
        } else {
            let h=`<h2>Sponsors</h2><div class="card">`;
            Store.state.club.sponsorOffers.forEach(o=>{h+=`<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border)"><div><strong>${o.name}</strong><br>${UTILS.fmtMoney(o.amount)}<br><span class="muted">${o.duration} weken</span></div><button class="primary" onclick="Engine.signSponsor('${o.id}')">Teken</button></div>`});
            d.innerHTML=h+`</div>`;
        } 
        return d; 
    },

    Squad() {
        const d=document.createElement('div');
        let h=`<h2>Jouw Selectie</h2><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Waarde</th><th>Status</th></tr></thead><tbody>`;
        Store.state.team.forEach(p=>{
            let c=p.ovr>=70?"color:#22c55e":"";
            const onList = Store.state.transferList.includes(p.id);
            const btnClass = onList ? "secondary" : "danger";
            const btnText = onList ? "Van lijst halen" : "Op lijst zetten";
            const badge = onList ? '<span class="badge" style="background:#ef4444;color:white;margin-left:5px;font-size:10px">TE KOOP</span>' : '';
            h+=`<tr><td><span class="pill">${p.pos}</span></td><td><strong>${p.name}</strong> ${badge}<br><span class="muted">${p.age} jr</span></td><td style="${c};font-weight:bold">${p.ovr}</td><td class="money">${UTILS.fmtMoney(p.value)}</td><td><button class="${btnClass} btn-list" data-id="${p.id}" style="font-size:11px; padding:4px 8px">${btnText}</button></td></tr>`;
        });
        d.innerHTML=h+`</tbody></table></div>`;
        return d;
    },

    TransferMarket() {
        const d=document.createElement('div');
        let offersHtml = "";
        if(Store.state.incomingOffers.length > 0) {
            offersHtml += `<h3>📩 Binnenkomende Biedingen</h3><div class="card">`;
            Store.state.incomingOffers.forEach(o => { offersHtml += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border); padding:10px 0;"><div><span class="muted">Club:</span> <strong>${o.club}</strong><br><span class="muted">Speler:</span> <strong>${o.playerName}</strong><br><span class="muted">Bod:</span> <span style="color:#22c55e; font-weight:bold">${UTILS.fmtMoney(o.amount)}</span></div><div style="display:flex; gap:5px;"><button class="primary btn-acc" data-id="${o.id}">✅</button><button class="danger btn-rej" data-id="${o.id}">❌</button></div></div>`; });
            offersHtml += `</div>`;
        } else { offersHtml = `<div class="card" style="padding:15px; text-align:center; color:#aaa">Geen openstaande biedingen.</div>`; }

        let marketHtml = `<h3>🛒 Spelers Kopen</h3><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Waarde Indicatie</th><th>Actie</th></tr></thead><tbody>`;
        Store.state.market.forEach(p=>{
            let c=p.ovr>=70?"color:#22c55e":"";
            const min = Math.round(p.value * 0.9); const max = Math.round(p.value * 1.3);
            marketHtml+=`<tr><td><span class="pill">${p.pos}</span></td><td><strong>${p.name}</strong><br><span class="muted">${p.age} jr</span></td><td style="${c};font-weight:bold">${p.ovr}</td><td class="money">${UTILS.fmtMoney(min)} - ${UTILS.fmtMoney(max)}</td><td><button class="primary btn-bid" data-id="${p.id}">Bied</button></td></tr>`;
        });
        marketHtml+=`</tbody></table></div>`;
        d.innerHTML = `<h2>Transfermarkt</h2>` + offersHtml + marketHtml;
        return d;
    },

    YouthAcademy() {
        const d=document.createElement('div');
        const level = Store.state.club.facilities.training;
        if(level < 3) { d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="text-align:center; padding:40px;"><h1 style="font-size:40px">🔒</h1><h3>Academy Gesloten</h3><p class="muted">Je hebt <strong>Trainingscomplex Niveau 3</strong> nodig.</p><p>Huidig niveau: ${level}</p></div>`; return d; }
        let listHtml = "";
        if(Store.state.youthAcademy.length === 0) { listHtml = `<p class="muted">Geen talenten. Stuur de scout op pad!</p>`; } 
        else {
            listHtml = `<table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Actie</th></tr></thead><tbody>`;
            Store.state.youthAcademy.forEach(p => { listHtml += `<tr><td>${p.pos}</td><td><strong>${p.name}</strong> (${p.age} jr)</td><td>${p.ovr}</td><td><button class="primary btn-sign" data-id="${p.id}">Contract (€ 5.000)</button></td></tr>`; });
            listHtml += `</tbody></table>`;
        }
        d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="display:flex; justify-content:space-between; align-items:center"><div><h3>Hoofd Scout</h3><div class="muted">Kost per sessie: <strong>€ 25.000</strong></div></div><button class="primary" id="btn-scout">🔎 Scout Talent</button></div><h3>Gescout Talent</h3><div class="card">${listHtml}</div>`;
        return d;
    },

    Tactics() {
        const d=document.createElement('div');
        let h=`<h2>Tactiek</h2><div class="card" style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))">`;
        for(let k in CONFIG.tactics) {
            let t = CONFIG.tactics[k];
            let active = Store.state.club.tactic === k ? "border:2px solid #22c55e;background:rgba(34,197,94,0.1)" : "border:1px solid var(--border)";
            h+=`<div onclick="Engine.setTactic('${k}')" style="padding:15px;border-radius:8px;cursor:pointer;${active}"><h3>${t.name}</h3><p class="muted" style="font-size:12px">${t.desc}</p></div>`;
        }
        d.innerHTML=h+`</div>`;
        return d;
    },

    Facilities() {
        const d=document.createElement('div');
        const f = Store.state.club.facilities;
        const btn = (t, l) => l>=8 ? `<button disabled>Max</button>` : `<button class="primary" onclick="Engine.upgradeFacility('${t}')">Upgrade (${UTILS.fmtMoney(CONFIG.costs[t][l])})</button>`;
        d.innerHTML=`<h2>Faciliteiten</h2><div class="card" style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))"><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏟️ Stadion <span class="badge">Lvl ${f.stadium}</span></h3><p class="muted">Meer tickets.</p>${btn('stadium', f.stadium)}</div><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏋️ Training <span class="badge">Lvl ${f.training}</span></h3><p class="muted">Spelersgroei & Jeugd.</p>${btn('training', f.training)}</div><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏥 Medisch <span class="badge">Lvl ${f.medical}</span></h3><p class="muted">Minder blessures (Toekomst).</p>${btn('medical', f.medical)}</div></div>`;
        return d;
    },

    League() { 
        const d=document.createElement('div'); 
        const v=Store.state.ui.viewDivision; 
        let c=`<div class="chips" style="margin-bottom:15px">`; 
        for(let i=1;i<=5;i++) c+=`<span class="chip ${v===i?'active':''}" onclick="Store.state.ui.viewDivision=${i};UI.render()">${UTILS.getLeagueShort(i)}</span>`; 
        c+="</div>"; 
        
        let h=`<h2>Competitie</h2><div class="card">${c}<table><thead><tr><th>#</th><th>Club</th><th>G</th><th>W</th><th>G</th><th>V</th><th>Pt</th></tr></thead><tbody>`; 
        let t=[...Store.state.competitions[v]].sort((a,b)=>b.pts-a.pts); 
        
        t.forEach((x,i)=>{
            let s = "";
            let rowClass = "";

            // Jouw club highlight
            if(x.id===Store.state.club.id) {
                rowClass += " my-club";
            }

            // Promotie/Degradatie Kleuren
            // Top 2 = Promotie (behalve in div 1)
            if(v > 1 && i < 2) {
                rowClass += " promo";
            }
            // Bodem 2 = Degradatie (behalve in div 5)
            if(v < 5 && i >= t.length - 2) {
                rowClass += " rele";
            }

            h+=`<tr class="${rowClass}"><td>${i+1}</td><td>${x.name}</td><td>${x.played}</td><td>${x.won}</td><td>${x.draw}</td><td>${x.lost}</td><td><strong>${x.pts}</strong></td></tr>`
        }); 
        d.innerHTML=h+`</tbody></table></div>`; 
        return d; 
    },

    Fixtures() { const d=document.createElement('div'); let h=`<h2>Uitslagen</h2><div class="card"><table>`; if(Store.state.results.length===0)h+="<p class='muted'>Geen data</p>"; else Store.state.results.forEach(r=>{h+=`<tr><td align="right">${r.home}</td><td align="center"><b>${r.score[0]}-${r.score[1]}</b></td><td>${r.away}</td></tr>`}); d.innerHTML=h+`</table></div>`; return d; },
    Finance() { const d=document.createElement('div'); const f=Store.state.finance.lastWeek; let l=""; f.breakdown.forEach(x=>l+=`<div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--border);padding:5px 0"><span>${x.txt}</span><span style="color:${x.amt>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(x.amt)}</span></div>`); d.innerHTML=`<h2>Financiën</h2><div class="card"><h3 style="text-align:center;margin-bottom:20px">${UTILS.fmtMoney(Store.state.club.budget)}</h3><h4>Weekrapport</h4>${l}<div style="display:flex;justify-content:space-between;margin-top:10px;font-weight:bold;font-size:18px"><span>Totaal</span><span style="color:${f.profit>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(f.profit)}</span></div></div>`; return d; }
};

window.addEventListener('DOMContentLoaded', () => { Store.init(); UI.init(); });