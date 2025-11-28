import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Store } from './store.js';
import { UI } from './ui.js'; 

export const Engine = {
    generateSquad(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer(i<2?"DM":null)); return s.sort((a,b)=>b.ovr-a.ovr); },
    generateMarket(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer()); return s.sort((a,b)=>b.ovr-a.ovr); },

// Helper: Checkt of een team een beloftenteam is
    isYouthTeam(name) {
        return name.toLowerCase().startsWith("jong ");
    },
    
createPlayer(posOverride, ageOverride) { 
        const pos = posOverride || UTILS.choice(CONFIG.positions); 
        const age = ageOverride || UTILS.rand(16,35);
        
        // Bepaal basisniveau op basis van leeftijd
        let base = 40;
        if(age > 22) base = 55;
        if(age > 28) base = 60;
        
        // Genereer specifieke stats op basis van positie
        let att, def, spd;
        const rand = (min, max) => base + UTILS.rand(min, max);

        if(["SP", "LB", "RB", "VL", "VR"].includes(pos)) {
            // Aanvallers: Hoog aanval, redelijk snel, laag verdediging
            att = rand(10, 30); spd = rand(5, 25); def = rand(-10, 10);
        } else if(["CV", "VVM", "DM"].includes(pos)) {
            // Verdedigers: Hoog verdediging, traag, laag aanval
            def = rand(10, 30); spd = rand(-5, 15); att = rand(-10, 10);
        } else {
            // Middenvelders: Gebalanceerd
            att = rand(0, 20); def = rand(0, 20); spd = rand(0, 20);
        }

        // Zorg dat stats niet onder 10 of boven 99 komen
        const clamp = (n) => Math.max(10, Math.min(99, Math.floor(n)));
        att = clamp(att); def = clamp(def); spd = clamp(spd);

        // OVR is het gemiddelde (maar we wegen de 'belangrijke' stat zwaarder voor de waarde)
        const ovr = Math.round((att + def + spd) / 3);
        const val = Math.round(ovr*ovr*25 + UTILS.rand(0,10000));
        const wage = Math.round(val/250); 

        // Voeg contract toe: Tussen 20 en 50 weken
        const contract = UTILS.rand(20, 50);

        return { id: UTILS.rid(), name: UTILS.genName(), age, pos, ovr, att, def, spd, value: val, wage, contract: contract }; 
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
        
        // Kies een willekeurige divisie voor de tegenstander (1, 2 of 3)
        const possibleDivs = [1, 2, 3];
        const rndDiv = UTILS.choice(possibleDivs);
        
        // --- NIEUWE LOGICA: Filter Jong teams eruit ---
        const opponents = Store.state.competitions[rndDiv].filter(t => 
            t.id !== Store.state.club.id &&  // Niet tegen jezelf
            !this.isYouthTeam(t.name)        // GEEN Jong teams
        );
        // ----------------------------------------------

        // Fallback: als er door het filteren geen tegenstanders zijn (heel onwaarschijnlijk), pak gewoon iemand
        const opp = opponents.length > 0 ? UTILS.choice(opponents) : Store.state.competitions[rndDiv][0];

        // ... (rest van de functie blijft hetzelfde: playMatch, uitslag, history push etc.)
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

        // Verwijder spelers met contract <= 0
        if(leavingPlayers.length > 0) {
            Store.state.team = Store.state.team.filter(p => p.contract > 0);
            alert(`⚠️ CONTRACT VERLOPEN!\n\nDe volgende spelers hebben de club transfervrij verlaten:\n- ${leavingPlayers.join("\n- ")}`);
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
        let msg = `Seizoen ${Store.state.game.season} voorbij!\n`;
        
        // 1. Bewaar de eindstanden van dit seizoen (voor historie) en bepaal wie verhuist
        // We maken een tijdelijke lijst van verhuizingen: { teamId: "ajax", from: 1, to: 2 }
        let moves = [];
        
        // Loop door elke divisie om promotie/degradatie te bepalen
        for(let d=1; d<=5; d++) {
            // Sorteer de tabel van deze divisie
            let table = Store.state.competitions[d].sort((a,b) => {
                if (b.pts !== a.pts) return b.pts - a.pts; // Meeste punten
                return b.gd - a.gd; // Beter doelsaldo
            });

            // --- JOUW CLUB CHECK ---
            const myPos = table.findIndex(x => x.id === Store.state.club.id);
            if(myPos > -1) {
                const prize = Math.round(1000000 / d * (table.length - myPos));
                Store.state.club.budget += prize;
                msg += `\nJe bent geëindigd op plek ${myPos + 1} in Divisie ${d}.\nBonus: ${UTILS.fmtMoney(prize)}\n`;
                
                // Hall of Fame update (zoals we eerder bespraken)
                if(!Store.state.history) Store.state.history = [];
                let resTxt = "Handhaving";
                if(d > 1 && myPos < 2) resTxt = "Promotie";
                if(d < 5 && myPos >= table.length - 2) resTxt = "Degradatie";
                
                Store.state.history.push({
                    season: Store.state.game.season,
                    division: d,
                    teamName: Store.state.club.name,
                    rank: myPos + 1,
                    points: table[myPos].pts,
                    result: resTxt
                });
            }

// --- BEPAAL AI & SPELER VERHUIZINGEN ---
            
            // PROMOTIE LOGICA
            if(d > 1) {
                let promotionSlots = 2; // Top 2 promoveert normaal gesproken
                let promotedCount = 0;
                
                // We loopen door de ranglijst van boven naar beneden
                for(let i=0; i<table.length; i++) {
                    const t = table[i];
                    
                    // Als we al genoeg teams hebben laten promoveren, stoppen we
                    if(promotedCount >= promotionSlots) break;

                    // SPECIFIEKE REGEL: Van Div 2 (KKD) naar Div 1 (Eredivisie)
                    // Jong teams mogen NIET promoveren
                    if(d === 2 && this.isYouthTeam(t.name)) {
                        // Doe niets, sla dit team over voor promotie
                        // Ze krijgen wel hun prijzengeld (dat is hierboven al geregeld), maar verhuizen niet.
                        continue; 
                    }
                    
                    // Als het geen Jong team is (of we zitten in een lagere divisie waar het niet uitmaakt), verhuis het team
                    moves.push({ team: t, from: d, to: d - 1 });
                    promotedCount++;
                }
            }
            
            // DEGRADATIE LOGICA (Bodem 2 zakt)
            // Hier hoeven we niks aan te passen, Jong teams kunnen wel degraderen
            if(d < 5) {
                const degradanten = table.slice(table.length - 2);
                degradanten.forEach(t => moves.push({ team: t, from: d, to: d + 1 }));
            }
        }

        // 2. Voer de verhuizingen uit
        // We maken 'schone' lijsten voor het nieuwe seizoen, maar behouden de teams
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
        
        // Berichtgeving bouwen op basis van je nieuwe divisie
        const oldDiv = Store.state.history[Store.state.history.length-1].division;
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
};