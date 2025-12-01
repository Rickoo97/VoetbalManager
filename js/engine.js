import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Store } from './store.js';
import { UI } from './ui.js'; 

export const Engine = {
    generateSquad(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer(i<2?"DM":null)); return s.sort((a,b)=>b.ovr-a.ovr); },
    generateMarket(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer()); return s.sort((a,b)=>b.ovr-a.ovr); },

    isYouthTeam(name) {
        return name.toLowerCase().startsWith("jong ");
    },

    isTransferWindowOpen() {
        const d = Store.state.game.day;
        return (d >= 1 && d <= 6) || (d >= 17 && d <= 22);
    },
    
createPlayer(posOverride, ageOverride) { 
        const pos = posOverride || UTILS.choice(CONFIG.positions); 
        const age = ageOverride || UTILS.rand(16,35);
        
        // --- STAP 1: KIES NATIONALITEIT ---
        // 60% kans op Nederland (NL), 40% kans op willekeurig ander land
        const allNations = Object.keys(CONFIG.nations); // ["NL", "BE", "DE", ...]
        let code = "NL";

        if(Math.random() > 0.60) {
            // Kies een random land dat NIET NL is
            const foreign = allNations.filter(k => k !== "NL");
            code = UTILS.choice(foreign);
        }

        // Haal de data op uit config (vlag en namenlijsten)
        const nationData = CONFIG.nations[code];
        
        // --- STAP 2: KIES NAAM ---
        const firstName = UTILS.choice(nationData.first);
        const lastName = UTILS.choice(nationData.last);
        const fullName = `${firstName} ${lastName}`;
        
        // --- STAP 3: GENERATE STATS (ongewijzigd) ---
        let base = 40;
        if(age > 22) base = 55;
        if(age > 28) base = 60;
        
        let att, def, spd;
        const rand = (min, max) => base + UTILS.rand(min, max);

        if(["SP", "LB", "RB", "VL", "VR"].includes(pos)) {
            att = rand(10, 30); spd = rand(5, 25); def = rand(-10, 10);
        } else if(["CV", "VVM", "DM"].includes(pos)) {
            def = rand(10, 30); spd = rand(-5, 15); att = rand(-10, 10);
        } else {
            att = rand(0, 20); def = rand(0, 20); spd = rand(0, 20);
        }

        const clamp = (n) => Math.max(10, Math.min(99, Math.floor(n)));
        att = clamp(att); def = clamp(def); spd = clamp(spd);

        const ovr = Math.round((att + def + spd) / 3);
        const val = Math.round(ovr*ovr*25 + UTILS.rand(0,10000));
        const wage = Math.round(val/250); 
        const contract = UTILS.rand(20, 50);

        // --- STAP 4: RETURN OBJECT MET VLAG ---
        return { 
            id: UTILS.rid(), 
            name: fullName,     // De gekozen naam
            nat: code,          // De landcode (bijv "NL")
            flag: nationData.flag, // De emoji vlag (bijv "🇳🇱")
            age, pos, ovr, att, def, spd, value: val, wage, contract 
        }; 
    },

    // --- NIEUW: TACTIEK SYSTEEM ---
    getTacticBonus(myTac, oppTac) {
        // AI kiest willekeurige tactiek als hij niet gedefinieerd is
        if(!oppTac) oppTac = UTILS.choice(['neutral', 'attack', 'defense']);
        
        const myConfig = CONFIG.tactics[myTac];
        
        if (myConfig.strongAgainst === oppTac) return 10; // +10% kracht
        if (myConfig.weakAgainst === oppTac) return -10;  // -10% kracht
        return 0; // Neutraal
    },

    playMatch(h, a) {
        // 1. Basis: Teamsterkte + Thuisvoordeel
        let hStr = h.strength + (h.id === Store.state.club.id ? 5 : 0); // Klein thuisvoordeel
        let aStr = a.strength;

        // 2. Faciliteiten Bonus (alleen voor speler)
        if(h.id === Store.state.club.id) hStr += (Store.state.club.facilities.stadium * 2);
        
        // 3. NIEUW: Tactiek Bonus (Rock-Paper-Scissors)
        let tacticalMsg = "";
        
        if(h.id === Store.state.club.id || a.id === Store.state.club.id) {
            const playerClub = h.id === Store.state.club.id ? h : a;
            const aiClub = h.id === Store.state.club.id ? a : h;
            
            // AI kiest random tactiek voor deze wedstrijd
            const aiTac = UTILS.choice(Object.keys(CONFIG.tactics));
            const myTac = Store.state.club.tactic;
            
            const bonus = this.getTacticBonus(myTac, aiTac);
            
            // Pas bonus toe op spelers team
            if(playerClub === h) hStr += (hStr * (bonus / 100));
            else aStr += (aStr * (bonus / 100));

            // Bericht voor in de uitslag (zichtbaar voor speler)
            if(bonus > 0) tacticalMsg = "✅ Tactische Meesterzet!";
            else if(bonus < 0) tacticalMsg = "❌ Tactisch overklast.";
            else tacticalMsg = "⚖️ Tactiek in evenwicht.";
            
            // Sla AI tactiek op voor feedback (optioneel)
            // console.log(`Jij: ${myTac}, AI: ${aiTac} -> Bonus: ${bonus}%`);
        }

        // 4. Doelpunten berekenen
        const diff = hStr - aStr;
        
        // Gemiddelde goals: 1.5 per team, plus correctie voor krachtsverschil
        let gH = Math.max(0, Math.round(1.5 + (diff/15) + UTILS.rand(-1, 2)));
        let gA = Math.max(0, Math.round(1.2 - (diff/15) + UTILS.rand(-1, 2)));

        return { score: [gH, gA], note: tacticalMsg };
    },

    applyResult(h, a, resultObj) { 
        const [gh, ga] = resultObj.score;
        
        h.played++; a.played++; 
        h.gf+=gh; h.ga+=ga; h.gd=h.gf-h.ga; 
        a.gf+=ga; a.ga+=gh; a.gd=a.gf-a.ga; 
        
        if(gh > ga) { h.won++; h.pts+=3; a.lost++; }
        else if(ga > gh) { a.won++; a.pts+=3; h.lost++; }
        else { h.draw++; h.pts++; a.draw++; a.pts++; } 
    },

    // --- NIEUW: SPONSOR ONDERHANDELINGEN ---
    negotiateSponsor(id, action) {
        const offerIdx = Store.state.club.sponsorOffers.findIndex(o => o.id === id);
        if(offerIdx === -1) return;
        const offer = Store.state.club.sponsorOffers[offerIdx];

        if(action === 'accept') {
            Store.state.club.sponsor = { name: offer.name, amount: offer.amount, weeksLeft: offer.duration };
            Store.state.club.sponsorOffers = []; // Andere aanbiedingen vervallen
            Store.save();
            UI.render();
            alert(`🤝 DEAL!\n\nJe hebt getekend bij ${offer.name} voor ${UTILS.fmtMoney(offer.amount)} per week.`);
        } 
        else if(action === 'negotiate') {
            // Risico: 40% kans dat ze weglopen
            if(Math.random() < 0.4) {
                Store.state.club.sponsorOffers.splice(offerIdx, 1);
                Store.save();
                UI.render();
                alert(`😡 ONDERHANDELING MISLUKT\n\n${offer.name} vond je te hebberig en heeft het aanbod ingetrokken.`);
            } else {
                // Succes: 10% tot 25% meer geld
                const increase = 1.1 + (Math.random() * 0.15);
                offer.amount = Math.round(offer.amount * increase);
                // Markeer als 'onderhandeld' (zodat je niet oneindig doorgaat)
                offer.negotiated = true;
                Store.save();
                UI.render();
                alert(`📈 SUCCES!\n\n${offer.name} verhoogt het bod naar ${UTILS.fmtMoney(offer.amount)}!`);
            }
        }
    },

    generateSponsorOffers() {
        let offers = []; 
        const divFactor = (6 - Store.state.club.division); 
        let pool = Store.state.club.division <= 2 ? CONFIG.sponsors.global : (Store.state.club.division <= 3 ? CONFIG.sponsors.national : CONFIG.sponsors.local);
        
        for(let i=0; i<3; i++) {
            offers.push({ 
                id: UTILS.rid(), 
                name: UTILS.choice(pool), 
                amount: Math.round(15000 * divFactor + UTILS.rand(-2000, 5000)), 
                duration: UTILS.rand(10, 34),
                negotiated: false // Nieuwe flag
            });
        }
        Store.state.club.sponsorOffers = offers;
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
        // --- NIEUW: Check Transfer Window ---
        if(!this.isTransferWindowOpen()) {
            return UI.toast("⛔ Markt gesloten! Wacht tot zomer/winter.");
        }
        // ------------------------------------
        
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
    
    extendContract(id) {
        const p = Store.state.team.find(x => x.id === id);
        if(!p) return;

        // Formule: Tekengeld = 10% van marktwaarde.
        // Je krijgt er 25 weken bij.
        const cost = Math.round(p.value * 0.10);
        
        if(confirm(`Contractverlenging voor ${p.name}?\n\nHuidig: ${p.contract} weken\nNieuw: +25 weken\n\nKosten: ${UTILS.fmtMoney(cost)}`)) {
            if(Store.state.club.budget < cost) return UI.toast("Onvoldoende budget!");
            
            Store.state.club.budget -= cost;
            p.contract += 25;
            // Speler wordt ook iets meer waard en vraagt meer salaris na verlenging
            p.wage = Math.round(p.wage * 1.1); 
            
            Store.save();
            UI.render();
            UI.toast("Contract verlengd! ✍️");
        }
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
    
// Wordt alleen aangeroepen bij start nieuw spel
    generateAllDivisions() { 
        let comps = {}; 
        
        // Helper om teams te maken met vaste ID's indien mogelijk
        const mkTeam = (name, strength, isReal) => {
            // Maak een 'slug' van de naam als ID (bijv. "Ajax" -> "ajax")
            const id = isReal ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : UTILS.rid();
            return { 
                id: id, 
                name: name, 
                strength: strength, 
                pts: 0, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0 
            };
        };

        for(let d=1; d<=5; d++){ 
            let teams = []; 
            
            // Echte competities (Div 1 & 2)
            if(CONFIG.realLeagues[d]) {
                CONFIG.realLeagues[d].forEach(n => {
                    // Ajax, PSV, etc krijgen nu een vast ID
                    teams.push(mkTeam(n, d===1?80:70, true));
                });
            } else {
                // Fictieve competities (Div 3, 4, 5) - vul aan tot 18 teams voor balans
                const size = 18; 
                for(let i=0; i<size; i++) {
                    teams.push(mkTeam(UTILS.genClubName(), 90-(d*10), false));
                }
            }
            comps[d] = teams; 
        }

        // Voeg JOUW club toe (vervangt een random team of wordt toegevoegd)
        // We verwijderen het zwakste AI team uit jouw startdivisie (div 5) om ruimte te maken
        const myDiv = Store.state.club.division; // standaard 5
        if(comps[myDiv]) {
            comps[myDiv].pop(); // Verwijder laatste AI team
            comps[myDiv].push({ 
                id: Store.state.club.id, 
                name: Store.state.club.name, 
                strength: 0, // Wordt berekend bij wedstrijden
                pts: 0, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0 
            });
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
        
        // 1. Tegenstander bepalen (Geen Jong teams)
        const possibleDivs = [1, 2, 3];
        const rndDiv = UTILS.choice(possibleDivs);
        
        // Filter Jong teams eruit
        const opponents = Store.state.competitions[rndDiv].filter(t => 
            t.id !== Store.state.club.id && 
            !this.isYouthTeam(t.name)
        );
        // Fallback als filter faalt (zeldzaam)
        const opp = opponents.length > 0 ? UTILS.choice(opponents) : Store.state.competitions[rndDiv][0];

        // 2. Wedstrijd spelen met Match Engine 2.0 (geeft object terug met events)
        const matchData = this.playMatch({strength: this.calculatePlayerTeamStrength(), id: Store.state.club.id}, opp);
        const res = matchData.score; // [goalsHome, goalsAway]
        
        // 3. Winst of Verlies bepalen
        let msg = "", win = false;
        if(res[0] === res[1]) {
            win = Math.random() > 0.5;
            msg = `Gelijkspel (${res[0]}-${res[1]}). Strafschoppen... ${win ? 'GEWONNEN!' : 'VERLOREN.'}`;
        } else if(res[0] > res[1]) { 
            win = true; 
            msg = `WINST! (${res[0]}-${res[1]})`; 
        } else { 
            win = false; 
            msg = `VERLIES. (${res[0]}-${res[1]})`; 
        }

        let roundName = "";
        if(Store.state.game.day === 5) roundName = "1/8 Finale";
        if(Store.state.game.day === 10) roundName = "Kwartfinale";
        if(Store.state.game.day === 15) roundName = "Halve Finale";
        if(Store.state.game.day === 20) roundName = "FINALE";

        // Formatteer de events voor de popup
        let eventStr = matchData.events.length > 0 ? "\n\nHighlights:\n" + matchData.events.join("\n") : "";

        // 4. Opslaan in historie
        c.history.push({ 
            round: roundName, 
            opponent: opp.name, 
            result: msg, 
            score: res, 
            win: win,
            events: matchData.events 
        });

        // 5. Resultaat afhandelen
        if(!win) {
            c.inTournament = false;
            alert(`🏆 KNVB BEKER - ${roundName}\n\n${msg}${eventStr}\n\nJe ligt uit het toernooi.`);
        } else {
            if(roundName === "FINALE") {
                Store.state.club.budget += 250000;
                c.inTournament = false;
                alert(`🏆🏆🏆 KAMPIOEN!\n\nJe wint de KNVB Beker!${eventStr}\n\nBonus: € 250.000`);
            } else {
                alert(`🏆 KNVB BEKER - ${roundName}\n\n${msg}${eventStr}\n\nJe bent door naar de volgende ronde!`);
            }
        }
    },
    
    calculatePlayerTeamStrength() { const s=Store.state.team; if(s.length===0)return 30; const b=s.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11); return Math.round(b.reduce((a,c)=>a+c.ovr,0)/b.length); },
    upgradeFacility(type) { const lvl=Store.state.club.facilities[type]; if(lvl>=8)return UI.toast("Max level"); const c=CONFIG.costs[type][lvl]; if(Store.state.club.budget<c)return UI.toast("Te weinig budget"); Store.state.club.budget-=c; Store.state.club.facilities[type]++; Store.save(); UI.render(); UI.toast("Upgrade!"); },
    setTactic(key) { Store.state.club.tactic=key; Store.save(); UI.render(); UI.toast(`Tactiek: ${CONFIG.tactics[key].name}`); },

processMatchday() {
        // 1. Check of seizoen voorbij is
        if(Store.state.game.day > CONFIG.maxMatchdays) { this.endSeason(); return; }
        
        // 2. Voorbereiding
        Store.state.results = []; 
        const me = Store.state.competitions[Store.state.club.division].find(c => c.id === Store.state.club.id);
        if(me) me.strength = this.calculatePlayerTeamStrength();

        let report = { income: 0, expenses: 0, breakdown: [] };
        
        // 3. Bekerwedstrijden (op vaste dagen)
        if(Store.state.cup && Store.state.cup.inTournament) {
            const days = [5, 10, 15, 20];
            if(days.includes(Store.state.game.day)) this.playCupMatch();
        }

        // 4. CONTRACT FIX: Eerst verlagen, dan kijken wie weg moet
        Store.state.team.forEach(p => p.contract--);

        const leavingPlayers = Store.state.team
            .filter(p => p.contract <= 0)
            .map(p => p.name);

        if(leavingPlayers.length > 0) {
            // Verwijder spelers met afgelopen contract uit de database
            Store.state.team = Store.state.team.filter(p => p.contract > 0);
            alert(`⚠️ CONTRACT VERLOPEN!\n\nDe volgende spelers hebben de club transfervrij verlaten:\n- ${leavingPlayers.join("\n- ")}`);
        }

        // 5. Financiën (Salaris & Onderhoud)
        const wages = Store.state.team.reduce((sum, p) => sum + p.wage, 0);
        const maint = (Store.state.club.facilities.stadium * 1000) + (Store.state.club.facilities.training * 800) + (Store.state.club.facilities.medical * 1500);
        
        report.expenses = wages + maint;
        report.breakdown.push({txt:"Salarissen & Onderhoud", amt:-(wages+maint)});

        // Sponsor inkomsten
        if(Store.state.club.sponsor) {
            report.income += Store.state.club.sponsor.amount;
            report.breakdown.push({txt:`Sponsor (${Store.state.club.sponsor.name})`, amt:Store.state.club.sponsor.amount});
            
            Store.state.club.sponsor.weeksLeft--;
            if(Store.state.club.sponsor.weeksLeft<=0) { 
                Store.state.club.sponsor=null; 
                UI.toast("Sponsor contract afgelopen"); 
                this.generateSponsorOffers(); 
            }
        }
        
        // Budget updaten
        Store.state.club.budget += (report.income - report.expenses);

        // 6. Simuleer competities (Div 1 t/m 5)
        for(let div = 1; div <= 5; div++) this.simulateRound(div, report);
        
        // 7. Simuleer transfers (AI) en ververs markt
        this.simulateTransfers();
        Store.state.market.splice(0, 3); 
        Store.state.market.push(...this.generateMarket(3)); 
        Store.state.market.sort((a,b)=>b.ovr-a.ovr);
        
        // 8. Afronding & Training Reset
        Store.state.finance.lastWeek = { ...report, profit: report.income - report.expenses };
        
        // NIEUW: Zorg dat je volgende week weer kunt trainen
        if(Store.state.training) Store.state.training.done = false;

        Store.state.game.day++; 
        Store.save(); 
        UI.render(); 
        UI.toast(`Ronde ${Store.state.game.day-1} voltooid.`);
    },

simulateRound(divNr, report) {
        const teams = Store.state.competitions[divNr];
        if(!teams) return; 
        if(Store.state.game.day > (teams.length-1)*2) return;
        
        const shuf = [...teams].sort(()=>0.5-Math.random());
        for(let i=0; i<shuf.length; i+=2) {
            const h=shuf[i], a=shuf[i+1]; if(!a) break;
            
            if(h.id===Store.state.club.id) {
                // Ticket inkomsten logic (ongewijzigd)
                const inc = Math.round(500 * Math.pow(1.6, Store.state.club.facilities.stadium) * 0.85 * 18 * 1.2);
                Store.state.club.budget += inc;
                if(report) { report.income+=inc; report.breakdown.push({txt:"Tickets", amt:inc}); }
            }

            // --- HIER IS DE WIJZIGING ---
            const matchData = this.playMatch(h, a); // Geeft nu object terug
            
            // Als jij speelt, slaan we de events op om te tonen
            if(divNr===Store.state.club.division && (h.id===Store.state.club.id || a.id===Store.state.club.id)) {
                Store.state.results.push({
                    home: h.name, 
                    away: a.name, 
                    score: matchData.score, 
                    events: matchData.events, // <--- We bewaren de events!
                    isYou: true
                });
            }

            this.applyResult(h, a, matchData);
        }
    },

simulateTransfers() {
        // --- NIEUW: Geen AI transfers als markt dicht is ---
        if(!this.isTransferWindowOpen()) return;
        // ---------------------------------------------------

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

// --- MATCH ENGINE 2.0 ---
    
    // Hulpfunctie: Kies een doelpuntenmaker op basis van ATT stat
    pickScorer(team) {
        // Filter spelers die kunnen scoren (alles behalve keepers meestal, maar keepers kunnen in theorie ook)
        // We geven aanvallers meer kans.
        let candidates = [];
        team.forEach(p => {
            // Gewicht: Aanvallers tellen zwaarder mee
            let weight = p.att;
            if(["SP", "RB", "LB", "VL", "VR"].includes(p.pos)) weight *= 3;
            if(["CAM", "CM"].includes(p.pos)) weight *= 2;
            
            // Voeg speler X keer toe aan de loterij-bak op basis van gewicht
            // (Simpele gewogen random)
            candidates.push({ id: p.id, name: p.name, weight: weight });
        });

        // Totale 'score-kans' massa
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        
        for(const c of candidates) {
            if(random < c.weight) return c.name;
            random -= c.weight;
        }
        return candidates[0].name; // Fallback
    },

    // --- TRAINING LOGIC ---
    toggleTrainingSelect(id) {
        if(Store.state.training.done) return UI.toast("Training voor deze week is al gedaan!");
        
        const sel = Store.state.training.selected;
        if(sel.includes(id)) {
            // Deselecteer
            Store.state.training.selected = sel.filter(x => x !== id);
        } else {
            // Selecteer (max 3)
            if(sel.length >= 3) return UI.toast("Max 3 spelers selecteren!");
            sel.push(id);
        }
        Store.save();
        UI.render(); // Ververs scherm om vinkje te tonen
    },

    executeTraining() {
        const t = Store.state.training;
        if(t.done) return;
        if(t.selected.length === 0) return UI.toast("Selecteer eerst spelers.");

        // Formule: Trainingslevel bepaalt hoeveel ze groeien
        // Level 1 = 1 punt, Level 8 = max 3 punten erbij
        const facilityLvl = Store.state.club.facilities.training;
        
        let report = [];

        t.selected.forEach(pid => {
            const p = Store.state.team.find(x => x.id === pid);
            if(p) {
                // Bereken groei
                const growth = 1 + Math.floor(Math.random() * (facilityLvl / 3)); 
                
                // Update stats
                p.att = Math.min(99, p.att + growth);
                p.def = Math.min(99, p.def + growth);
                p.spd = Math.min(99, p.spd + growth);
                // Herbereken OVR
                p.ovr = Math.round((p.att + p.def + p.spd) / 3);
                // Waarde stijgt mee
                p.value = Math.round(p.ovr * p.ovr * 25);

                report.push(`${p.name} (+${growth})`);
            }
        });

        t.done = true;
        Store.save();
        UI.render();
        alert(`💪 TRAINING VOLTOOID!\n\nResultaten:\n- ${report.join("\n- ")}`);
    },

    playMatch(h, a) {
        // 1. Basis Stats Ophalen
        // We halen de echte selecties op om scorers te kunnen kiezen
        // Voor de speler is dat Store.state.team. Voor AI moeten we even improviseren (genereren of uit pool halen)
        // Omdat AI teams geen gedetailleerde spelerslijst in memory hebben, simuleren we namen voor hen.
        
        const isPlayerHome = h.id === Store.state.club.id;
        const isPlayerAway = a.id === Store.state.club.id;

        let homeSquad = isPlayerHome ? Store.state.team : []; 
        let awaySquad = isPlayerAway ? Store.state.team : [];

        // Bereken Sterktes (zoals voorheen, maar uitgebreider)
        let hStr = h.strength; 
        let aStr = a.strength;
        
        // Thuisvoordeel & Tactiek
        if(isPlayerHome) hStr += (Store.state.club.facilities.stadium * 2) + CONFIG.tactics[Store.state.club.tactic].attBonus;
        if(isPlayerAway) aStr += CONFIG.tactics[Store.state.club.tactic].attBonus;

        // --- DE SIMULATIE (9 blokken van 10 minuten) ---
        let hGoals = 0;
        let aGoals = 0;
        let events = []; // Hier slaan we op: "Minuut 12: Goal Janssen"
        
        let hRed = false;
        let aRed = false;

        for(let minute = 10; minute <= 90; minute += 10) {
            // Rood nadeel (Rood = 30% krachtverlies)
            let currH = hRed ? hStr * 0.7 : hStr;
            let currA = aRed ? aStr * 0.7 : aStr;

            // 1. KANS OP GOAL
            // Het verschil in sterkte bepaalt de kans. 
            // Basis kans per 10 min is klein (bijv. 15%).
            const diff = currH - currA;
            const hChance = 0.12 + (diff / 500); // Bijv: 0.12 + 0.04 = 16%
            const aChance = 0.12 - (diff / 500);

            // Thuis scoort?
            if(Math.random() < hChance) {
                hGoals++;
                const scorer = isPlayerHome ? this.pickScorer(homeSquad) : UTILS.genName().split(" ")[1]; // Alleen achternaam voor AI
                events.push(`⚽ ${minute}' ${scorer}`);
            }

            // Uit scoort?
            if(Math.random() < aChance) {
                aGoals++;
                const scorer = isPlayerAway ? this.pickScorer(awaySquad) : UTILS.genName().split(" ")[1];
                events.push(`⚽ ${minute}' ${scorer}`);
            }

            // 2. KANS OP ROOD (Zeer klein, maar grote impact)
            // Alleen als er nog geen rood is
            if(!hRed && Math.random() < 0.005) { // 0.5% kans per 10 min
                hRed = true;
                events.push(`🟥 ${minute}' Rode kaart (Thuis)`);
            }
            if(!aRed && Math.random() < 0.005) {
                aRed = true;
                events.push(`🟥 ${minute}' Rode kaart (Uit)`);
            }
            
            // 3. KANS OP BLESSURE (Alleen voor speler relevant)
            if((isPlayerHome || isPlayerAway) && Math.random() < 0.01) {
                const squad = isPlayerHome ? homeSquad : awaySquad;
                // Pak willekeurige speler die nog niet geblesseerd is
                const unlucky = squad[Math.floor(Math.random() * squad.length)];
                // We doen er nu niks mee in de database, maar melden het wel
                events.push(`🚑 ${minute}' Blessure: ${unlucky.name}`);
            }
        }

        // Sorteer events op minuut (hoewel ze al op volgorde staan door de loop)
        return { score: [hGoals, aGoals], events: events, homeRed: hRed, awayRed: aRed };
    },

    // AANGEPASTE applyResult omdat playMatch nu een OBJECT teruggeeft in plaats van een array
    applyResult(h, a, resultObj) { 
        const [gh, ga] = resultObj.score;
        
        h.played++; a.played++; 
        h.gf+=gh; h.ga+=ga; h.gd=h.gf-h.ga; 
        a.gf+=ga; a.ga+=gh; a.gd=a.gf-a.ga; 
        
        if(gh > ga) { h.won++; h.pts+=3; a.lost++; }
        else if(ga > gh) { a.won++; a.pts+=3; h.lost++; }
        else { h.draw++; h.pts++; a.draw++; a.pts++; } 
    },

endSeason() {
        let msg = `Seizoen ${Store.state.game.season} voorbij!\n`;
        
        // 1. Bewaar de eindstanden van dit seizoen (voor historie) en bepaal wie verhuist
        let moves = [];
        
        // Loop door elke divisie om promotie/degradatie te bepalen
        for(let d=1; d<=5; d++) {
            // Sorteer de tabel van deze divisie
            let table = Store.state.competitions[d].sort((a,b) => {
                if (b.pts !== a.pts) return b.pts - a.pts; // Meeste punten
                return b.gd - a.gd; // Beter doelsaldo
            });

            // --- JOUW CLUB CHECK ---
            // Dit blok regelt geld en historie. Dit mag ALLEEN gebeuren voor jouw divisie.
            const myPos = table.findIndex(x => x.id === Store.state.club.id);
            if(myPos > -1) {
                const prize = Math.round(1000000 / d * (table.length - myPos));
                Store.state.club.budget += prize;
                msg += `\nJe bent geëindigd op plek ${myPos + 1} in Divisie ${d}.\nBonus: ${UTILS.fmtMoney(prize)}\n`;
                
                // --- HALL OF FAME UPDATE ---
                if(!Store.state.history) Store.state.history = [];
                
                // 1. Bepaal resultaat tekst (resTxt)
                let resTxt = "Handhaving";
                if(d > 1 && myPos < 2) resTxt = "Promotie"; // Top 2
                if(d < 5 && myPos >= table.length - 2) resTxt = "Degradatie"; // Laatste 2

                // 2. Beker check
                const cupWin = Store.state.cup.history.find(h => h.round === "FINALE" && h.win === true);
                const cupResult = cupWin ? "🏆 Winnaar" : "Geen";

                Store.state.history.push({
                    season: Store.state.game.season,
                    division: d,
                    teamName: Store.state.club.name,
                    rank: myPos + 1,
                    points: table[myPos].pts,
                    result: resTxt,
                    cup: cupResult
                });
            } // <--- BELANGRIJK: Deze accolade sluit nu het "Mijn Club" gedeelte af!

            // --- BEPAAL AI & SPELER VERHUIZINGEN ---
            // Dit gebeurt nu voor ELKE divisie (buiten het if-blok hierboven)
            
            // PROMOTIE LOGICA
            if(d > 1) {
                let promotionSlots = 2; // Top 2 promoveert
                let promotedCount = 0;
                
                for(let i=0; i<table.length; i++) {
                    const t = table[i];
                    if(promotedCount >= promotionSlots) break;

                    // Jong teams mogen NIET promoveren naar Eredivisie (Div 1)
                    if(d === 2 && this.isYouthTeam(t.name)) {
                        continue; 
                    }
                    
                    moves.push({ team: t, from: d, to: d - 1 });
                    promotedCount++;
                }
            }
            
            // DEGRADATIE LOGICA (Bodem 2 zakt)
            if(d < 5) {
                const degradanten = table.slice(table.length - 2);
                degradanten.forEach(t => moves.push({ team: t, from: d, to: d + 1 }));
            }
        }

        // 2. Voer de verhuizingen uit
        let newComps = {};
        for(let d=1; d<=5; d++) newComps[d] = [];

        // Eerst iedereen in de nieuwe bakjes stoppen
        for(let d=1; d<=5; d++) {
            Store.state.competitions[d].forEach(team => {
                // Check of dit team gaat verhuizen
                const move = moves.find(m => m.team.id === team.id);
                const targetDiv = move ? move.to : d; // Zo niet, blijf in 'd'
                
                // Reset stats voor nieuwe seizoen
                team.pts=0; team.played=0; team.won=0; team.draw=0; team.lost=0; team.gf=0; team.ga=0; team.gd=0;
                
                // Als team jij bent, update je state
                if(team.id === Store.state.club.id) {
                    Store.state.club.division = targetDiv;
                }

                newComps[targetDiv].push(team);
            });
        }

        // 3. Update de globale state
        Store.state.competitions = newComps;
        
        // Berichtgeving bouwen
        const lastHist = Store.state.history[Store.state.history.length-1];
        // Veiligheidscheck voor het geval history leeg is (zou niet moeten kunnen)
        const oldDiv = lastHist ? lastHist.division : 5; 
        const newDiv = Store.state.club.division;
        
        if(newDiv < oldDiv) msg += "🎉 GEPROMOVEERD! Welkom in Divisie " + newDiv;
        else if(newDiv > oldDiv) msg += "😞 GEDEGRADEERD... Succes in Divisie " + newDiv;
        else msg += "Je blijft in Divisie " + newDiv;

        // 4. Overige resets
        Store.state.game.season++;
        Store.state.game.day = 1;
        Store.state.team.forEach(p => { p.age++; p.value = Math.round(p.ovr * p.ovr * 25); });
        Store.state.transferList = []; 
        Store.state.incomingOffers = [];
        
        // 5. Update UI en Save
        Store.state.ui.viewDivision = Store.state.club.division;
        this.initCupSeason();
        
        alert(msg); 
        Store.save(); 
        UI.render();
    },
}
