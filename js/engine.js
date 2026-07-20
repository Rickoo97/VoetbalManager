import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Store } from './store.js';
import { UI } from './ui.js'; 

export const Engine = {
    generateSquad(n) { 
        let s=[]; 
        // Maak standaard spelers
        for(let i=0;i<n;i++) s.push(this.createPlayer(i<2?"DM":null)); 
        
        // NERF: Verzwak dit team omdat het een startende club in Div 5 is
        s.forEach(p => {
            // Trek willekeurig 5 tot 12 punten van alle stats af
            const penalty = 5 + Math.floor(Math.random() * 8);
            this.applyStatPenalty(p, penalty);
        });

        return s.sort((a,b)=>b.ovr-a.ovr); 
    },
    generateMarket(n) { let s=[]; for(let i=0;i<n;i++) s.push(this.createPlayer()); return s.sort((a,b)=>b.ovr-a.ovr); },

    // Verlaag alle stats consistent en herbereken OVR + waarde
    applyStatPenalty(p, penalty) {
        p.att = Math.max(10, p.att - penalty);
        p.def = Math.max(10, p.def - penalty);
        p.spd = Math.max(10, p.spd - penalty);
        this.recalcPlayer(p);
    },

    // Herbereken OVR, waarde en salaris op basis van de sub-stats
    recalcPlayer(p) {
        p.ovr = Math.round((p.att + p.def + p.spd) / 3);
        p.value = Math.round(p.ovr * p.ovr * 25);
        p.wage = Math.round(p.value / 250);
    },

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
        
        // --- STAP 3: GENERATE STATS ---
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

    // --- TACTIEK SYSTEEM (Rock-Paper-Scissors) ---
    getTacticBonus(myTac, oppTac) {
        // AI kiest willekeurige tactiek als hij niet gedefinieerd is
        if(!oppTac) oppTac = UTILS.choice(['neutral', 'attack', 'defense']);
        
        const myConfig = CONFIG.tactics[myTac];
        
        if (myConfig.strongAgainst === oppTac) return 10; // +10% kracht
        if (myConfig.weakAgainst === oppTac) return -10;  // -10% kracht
        return 0; // Neutraal
    },

    // --- SPONSOR ONDERHANDELINGEN ---
    negotiateSponsor(id, action) {
        const offerIdx = Store.state.club.sponsorOffers.findIndex(o => o.id === id);
        if(offerIdx === -1) return;
        const offer = Store.state.club.sponsorOffers[offerIdx];

        if(action === 'accept') {
            Store.state.club.sponsor = { name: offer.name, amount: offer.amount, weeksLeft: offer.duration };
            Store.state.club.sponsorOffers = []; // Andere aanbiedingen vervallen
            Store.save();
            UI.render();
            UI.alert("🤝 Deal!", `Je hebt getekend bij <strong>${offer.name}</strong> voor <strong>${UTILS.fmtMoney(offer.amount)}</strong> per week.`);
        } 
        else if(action === 'negotiate') {
            // Risico: 40% kans dat ze weglopen
            if(Math.random() < 0.4) {
                Store.state.club.sponsorOffers.splice(offerIdx, 1);
                Store.save();
                UI.render();
                UI.alert("😡 Onderhandeling mislukt", `${offer.name} vond je te hebberig en heeft het aanbod ingetrokken.`);
            } else {
                // Succes: 10% tot 25% meer geld
                const increase = 1.1 + (Math.random() * 0.15);
                offer.amount = Math.round(offer.amount * increase);
                // Markeer als 'onderhandeld' (zodat je niet oneindig doorgaat)
                offer.negotiated = true;
                Store.save();
                UI.render();
                UI.alert("📈 Succes!", `${offer.name} verhoogt het bod naar <strong>${UTILS.fmtMoney(offer.amount)}</strong>!`);
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
                negotiated: false
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
        // Schaal de sub-stats naar het gewenste talentniveau, zodat OVR
        // en att/def/spd consistent blijven (OVR wordt herberekend bij training)
        const targetOvr = 35 + UTILS.rand(0, 15);
        const scale = targetOvr / Math.max(1, talent.ovr);
        const clamp = (n) => Math.max(10, Math.min(99, Math.round(n)));
        talent.att = clamp(talent.att * scale);
        talent.def = clamp(talent.def * scale);
        talent.spd = clamp(talent.spd * scale);
        this.recalcPlayer(talent);
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

    // Vaste vraagprijs per speler per seizoen (niet herrolbaar door opnieuw te bieden)
    getRequiredBid(p) {
        const seed = UTILS.hashString(p.id + "s" + Store.state.game.season);
        let greedFactor = 0.95 + (seed % 31) / 100; // 0.95 - 1.25
        if(p.age < 23) greedFactor += 0.1; // Jong talent is duurder
        if(p.age > 32) greedFactor -= 0.1; // Oude rot is goedkoper
        return Math.round(p.value * greedFactor);
    },

placeBid(id) {
        // 1. Check Transfer Window
        if(!this.isTransferWindowOpen()) {
            return UI.toast("⛔ Markt gesloten! Wacht tot zomer/winter.");
        }
        
        const p = Store.state.market.find(x=>x.id===id); if(!p) return;
        const myDiv = Store.state.club.division; // Jouw divisie (bijv. 5)

        // --- AMBITIE & REALISME CHECK ---
        
        // Stap A: Bepaal welk niveau de speler heeft (in welke divisie hoort hij thuis?)
        let playerLevelDiv = 5; 
        if(p.ovr >= 78) playerLevelDiv = 1;      // Eredivisie ster
        else if(p.ovr >= 72) playerLevelDiv = 2; // KKD / Onderkant Eredivisie
        else if(p.ovr >= 65) playerLevelDiv = 3; // Divisie 3 topper
        else if(p.ovr >= 55) playerLevelDiv = 4; // Divisie 4
        
        // Stap B: Bereken het verschil (Gap)
        const gap = myDiv - playerLevelDiv; 

        // Stap C: De Leeftijdsfactor
        // Jongeren (t/m 23) zijn arrogant/ambitieus. Ouderen (30+) zijn chill.
        let refusalReason = null;

        if (gap > 0) { // Jij speelt lager dan het niveau van de speler
            if (p.age <= 23) {
                // JONGE TALENTEN: Accepteren maximaal 1 divisie lager, anders weigeren ze.
                if(gap > 1) refusalReason = `"Ik ben ${p.age} en heb veel talent (${p.ovr}). Ik ga mijn carrière niet vergooien in Divisie ${myDiv}!"`;
            } 
            else if (p.age >= 30) {
                // OUDEREN: Accepteren bijna alles, zolang je betaalt.
            } 
            else {
                // PRIME LEEFTIJD (24-29): Accepteren maximaal 2 divisies lager.
                if(gap > 2) refusalReason = `"Ik ben in de kracht van mijn leven. Divisie ${myDiv} is echt een stap te ver terug."`;
            }
        }

        // Als de speler weigert, stop de functie en toon bericht
        if (refusalReason) {
            UI.alert("⛔ Speler weigert", refusalReason);
            return;
        }

        // --- BIEDEN VIA MODAL ---
        const minV = Math.round(p.value * 0.9); const maxV = Math.round(p.value * 1.3);
        const info = `Marktwaarde-indicatie: <strong>${UTILS.fmtMoney(minV)} - ${UTILS.fmtMoney(maxV)}</strong><br>Doe een bod op <strong>${p.name}</strong> (${p.age} jr, OVR ${p.ovr}):`;

        UI.prompt(`💸 Bod op ${p.name}`, info, p.value, (val) => {
            const bid = parseInt(val);
            if(isNaN(bid) || bid <= 0) return UI.toast("Ongeldig bedrag");
            if(Store.state.club.budget < bid) return UI.toast("Onvoldoende budget!");
            
            // Vaste vraagprijs: opnieuw bieden verandert de eis niet
            const required = this.getRequiredBid(p);

            if(bid >= required) {
                if(Store.state.team.length >= 30) return UI.toast("Selectie is vol!");
                
                // Succes bericht aanpassen op basis van leeftijd
                let welcomeMsg = "";
                if(p.age > 30 && gap > 0) welcomeMsg = `👴 "Ik kom graag mijn ervaring delen in Divisie ${myDiv}."`;
                else if(p.age < 23) welcomeMsg = `👶 "Bedankt voor de kans, ik ga vlammen!"`;
                else welcomeMsg = `🤝 "De deal is rond."`;

                Store.state.club.budget -= bid;
                Store.state.team.push(p); Store.state.market = Store.state.market.filter(x=>x.id !== id);
                Store.save(); UI.render(); 
                UI.alert("✅ Bod geaccepteerd!", `${welcomeMsg}<br><br><strong>${p.name}</strong> is speler van ${Store.state.club.name}.`);
            } else { 
                UI.alert("❌ Bod geweigerd", `De club (en zaakwaarnemer) willen minstens <strong>${UTILS.fmtMoney(required)}</strong>.`); 
            }
        });
    },
    
    extendContract(id) {
        const p = Store.state.team.find(x => x.id === id);
        if(!p) return;

        // Formule: Tekengeld = 10% van marktwaarde.
        // Je krijgt er 25 weken bij.
        const cost = Math.round(p.value * 0.10);
        
        UI.confirm(
            `✍️ Contract verlengen`,
            `Contractverlenging voor <strong>${p.name}</strong>?<br><br>Huidig: ${p.contract} weken<br>Nieuw: +25 weken<br><br>Kosten: <strong>${UTILS.fmtMoney(cost)}</strong>`,
            () => {
                if(Store.state.club.budget < cost) return UI.toast("Onvoldoende budget!");
                
                Store.state.club.budget -= cost;
                p.contract += 25;
                // Speler wordt ook iets meer waard en vraagt meer salaris na verlenging
                p.wage = Math.round(p.wage * 1.1); 
                
                Store.save();
                UI.render();
                UI.toast("Contract verlengd! ✍️");
            },
            { yesLabel: "Verleng" }
        );
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
        if(Store.state.training && Store.state.training.selected) {
            Store.state.training.selected = Store.state.training.selected.filter(id => id !== p.id);
        }
        Store.save(); UI.render(); 
        UI.alert("🤝 Deal!", `<strong>${p.name}</strong> verkocht aan ${offer.club} voor <strong>${UTILS.fmtMoney(offer.amount)}</strong>.`);
    },

    rejectOffer(offerId) {
        const idx = Store.state.incomingOffers.findIndex(o => o.id === offerId);
        if(idx > -1) { Store.state.incomingOffers.splice(idx, 1); Store.save(); UI.render(); UI.toast("Bod geweigerd."); }
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
            
            if(CONFIG.realLeagues[d]) {
                CONFIG.realLeagues[d].forEach(n => {
                    // Echte clubs (Div 1 & 2) iets sterker maken
                    teams.push(mkTeam(n, d===1?82:74, true)); 
                });
            } else {
                // Fictieve competities (Div 3, 4, 5)
                const size = 18; 
                // Div 3=64, Div 4=57, Div 5=50
                const baseStr = 85 - (d * 7); 
                
                for(let i=0; i<size; i++) {
                    // We voegen variatie toe: sommige teams zijn 55, anderen 49
                    const strength = baseStr + UTILS.rand(-4, 4);
                    teams.push(mkTeam(UTILS.genClubName(), strength, false));
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

    // --- WEDSTRIJDSCHEMA (round-robin via de cirkelmethode) ---
    // Geeft een dubbele competitie terug: elk team speelt 1x thuis en 1x uit
    // tegen elk ander team. rounds[dag-1] = [{h: teamId, a: teamId}, ...]
    generateSchedule(teamIds) {
        const teams = [...teamIds];
        if(teams.length % 2 !== 0) teams.push(null); // oneven: 1 team is vrij per ronde
        const n = teams.length;
        const roundsCount = n - 1;
        
        let rounds = [];
        let arr = [...teams];
        for(let r = 0; r < roundsCount; r++) {
            let round = [];
            for(let i = 0; i < n / 2; i++) {
                const t1 = arr[i], t2 = arr[n - 1 - i];
                if(t1 !== null && t2 !== null) {
                    // Wissel thuis/uit per ronde af voor een eerlijke verdeling
                    round.push(r % 2 === 0 ? { h: t1, a: t2 } : { h: t2, a: t1 });
                }
            }
            rounds.push(round);
            // Roteer alle teams behalve het eerste
            arr.splice(1, 0, arr.pop());
        }
        
        // Tweede seizoenshelft: gespiegeld (thuis wordt uit)
        const secondHalf = rounds.map(round => round.map(m => ({ h: m.a, a: m.h })));
        return [...rounds, ...secondHalf];
    },

    generateAllSchedules() {
        const schedules = {};
        for(let d = 1; d <= 5; d++) {
            if(!Store.state.competitions[d]) continue;
            const ids = Store.state.competitions[d].map(t => t.id);
            // Shuffle zodat de volgorde per seizoen anders is
            ids.sort(() => 0.5 - Math.random());
            schedules[d] = this.generateSchedule(ids);
        }
        Store.state.schedules = schedules;
    },

    // Seizoenslengte hangt af van het aantal teams in JOUW divisie
    getSeasonLength() {
        const teams = Store.state.competitions[Store.state.club.division];
        return teams ? (teams.length - 1) * 2 : CONFIG.maxMatchdays;
    },

    // Volgende tegenstander van de speler opzoeken in het schema
    getMyNextMatch() {
        const div = Store.state.club.division;
        const sched = Store.state.schedules ? Store.state.schedules[div] : null;
        const day = Store.state.game.day;
        if(!sched || !sched[day - 1]) return null;
        
        const m = sched[day - 1].find(x => x.h === Store.state.club.id || x.a === Store.state.club.id);
        if(!m) return null;
        
        const isHome = m.h === Store.state.club.id;
        const oppId = isHome ? m.a : m.h;
        const opp = Store.state.competitions[div].find(t => t.id === oppId);
        if(!opp) return null;
        
        return { opponent: opp, isHome, day };
    },

    initCupSeason() {
        const div = Store.state.club.division;
        if(div <= 3) {
            Store.state.cup = { active: true, inTournament: true, nextRound: 5, history: [] };
        } else {
            Store.state.cup = { active: false, inTournament: false, nextRound: 0, history: [] };
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

        // 2. Wedstrijd spelen met Match Engine (geeft object terug met events)
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

        const cupDays = [5, 10, 15, 20];
        const day = Store.state.game.day;
        let roundName = "";
        if(day === 5) roundName = "1/8 Finale";
        if(day === 10) roundName = "Kwartfinale";
        if(day === 15) roundName = "Halve Finale";
        if(day === 20) roundName = "FINALE";

        // Formatteer de events voor de popup
        let eventStr = matchData.events.length > 0 ? "<br><br><strong>Highlights:</strong><br>" + matchData.events.join("<br>") : "";

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
            UI.alert(`🏆 KNVB Beker - ${roundName}`, `${msg}${eventStr}<br><br>Je ligt uit het toernooi.`);
        } else {
            if(roundName === "FINALE") {
                Store.state.club.budget += 250000;
                c.inTournament = false;
                UI.alert("🏆🏆🏆 Bekerwinnaar!", `Je wint de KNVB Beker!${eventStr}<br><br>Bonus: <strong>€ 250.000</strong>`);
            } else {
                // Volgende ronde bijwerken zodat de Beker-pagina klopt
                c.nextRound = cupDays.find(d => d > day) || 0;
                UI.alert(`🏆 KNVB Beker - ${roundName}`, `${msg}${eventStr}<br><br>Je bent door naar de volgende ronde!`);
            }
        }
    },
    
    calculatePlayerTeamStrength() { const s=Store.state.team; if(s.length===0)return 30; const b=s.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11); return Math.round(b.reduce((a,c)=>a+c.ovr,0)/b.length); },
    upgradeFacility(type) { const lvl=Store.state.club.facilities[type]; if(lvl>=8)return UI.toast("Max level"); const c=CONFIG.costs[type][lvl]; if(Store.state.club.budget<c)return UI.toast("Te weinig budget"); Store.state.club.budget-=c; Store.state.club.facilities[type]++; Store.save(); UI.render(); UI.toast("Upgrade!"); },
    setTactic(key) { Store.state.club.tactic=key; Store.save(); UI.render(); UI.toast(`Tactiek: ${CONFIG.tactics[key].name}`); },

processMatchday() {
        // 0. Game over? Dan kan er niet verder gespeeld worden
        if(Store.state.game.over) { this.showGameOver(); return; }

        // 1. Check of seizoen voorbij is
        if(Store.state.game.day > this.getSeasonLength()) { this.endSeason(); return; }
        
        // 2. Voorbereiding
        Store.state.results = []; 
        const me = Store.state.competitions[Store.state.club.division].find(c => c.id === Store.state.club.id);
        if(me) me.strength = this.calculatePlayerTeamStrength();

        let report = { income: 0, expenses: 0, breakdown: [] };

        // 3. CONTRACTEN AFTELLEN (vóór de bekerwedstrijd, zodat een noodstop
        //    niet kan zorgen dat dezelfde bekerronde 2x gespeeld wordt)
        Store.state.team.forEach(p => p.contract--);

        const leaving = Store.state.team.filter(p => p.contract <= 0);
        if(leaving.length > 0) {
            const leavingIds = leaving.map(p => p.id);
            Store.state.team = Store.state.team.filter(p => p.contract > 0);

            // Verwijder ze ook uit de training selectie en van de transferlijst
            if(Store.state.training && Store.state.training.selected) {
                Store.state.training.selected = Store.state.training.selected.filter(id => !leavingIds.includes(id));
            }
            Store.state.transferList = Store.state.transferList.filter(id => !leavingIds.includes(id));

            UI.alert("⚠️ Contract verlopen!", `De volgende spelers hebben de club transfervrij verlaten:<br>- ${leaving.map(p => p.name).join("<br>- ")}`);
        }

        // 3.5. CRITICAL CHECK: Hebben we nog wel 11 spelers?
        if(Store.state.team.length < 11) {
            // Noodgreep: Voeg 2 zwakke jeugdspelers toe zodat de game niet vastloopt
            for(let i = 0; i < 2; i++) {
                const emergency = this.createPlayer(null, 17);
                this.applyStatPenalty(emergency, 20); // Echt zwakke amateurs
                Store.state.team.push(emergency);
            }
            UI.alert("⛔ Te weinig spelers!", "Je hebt minder dan 11 spelers door verlopen contracten of verkopen.<br><br>Je krijgt noodgedwongen 2 amateurspelers uit de jeugd. Regel snel versterking!");
            Store.save();
            UI.render();
            return; // Stop de week simulatie, speler moet eerst managen
        }

        // 4. Bekerwedstrijden (op vaste dagen)
        if(Store.state.cup && Store.state.cup.inTournament) {
            const days = [5, 10, 15, 20];
            if(days.includes(Store.state.game.day)) this.playCupMatch();
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

        // 6. Simuleer competities (Div 1 t/m 5) volgens het schema
        for(let div = 1; div <= 5; div++) this.simulateRound(div, report);
        
        // 7. Simuleer transfers (AI) en ververs markt
        this.simulateTransfers();
        Store.state.market.splice(0, 3); 
        Store.state.market.push(...this.generateMarket(3)); 
        Store.state.market.sort((a,b)=>b.ovr-a.ovr);
        
        // 8. Nieuws genereren over deze speelronde
        this.generateNews();

        // 9. Afronding & Training Reset
        Store.state.finance.lastWeek = { ...report, profit: report.income - report.expenses };
        
        if(Store.state.training) Store.state.training.done = false;

        this.updateBoardConfidence(); // Vertrouwen bijwerken na alle wedstrijden
        Store.state.game.day++; 
        Store.save(); 
        UI.render(); 
        UI.toast(`Ronde ${Store.state.game.day-1} voltooid.`);
    },

    determineObjective() {
        const div = Store.state.club.division;
        const ovr = this.calculatePlayerTeamStrength();
        
        // Simpele logica: Hoe goed is je team?
        let objText = "Handhaven";
        let objRank = 14; // Veilig
        
        if(ovr > 80) { objText = "Kampioen worden"; objRank = 1; }
        else if(ovr > 70) { objText = "Promoveren / Top 3"; objRank = 3; }
        else if(ovr > 60) { objText = "Linkerrijtje (Top 9)"; objRank = 9; }
        
        Store.state.board.objective = objText;
        Store.state.board.objectiveRank = objRank;
        Store.state.board.confidence = 80; // Reset vertrouwen bij nieuw seizoen
    },

    updateBoardConfidence() {
        const board = Store.state.board;
        const lastMatch = Store.state.results.find(r => r.isYou);
        if(!lastMatch) return; // Geen wedstrijd gespeeld (bv. vrijgeloot)

        // Kijk naar de HUIDIGE positie in de competitie
        // (kopie zodat we de opgeslagen volgorde niet muteren)
        const table = [...Store.state.competitions[Store.state.club.division]]
            .sort((a,b) => b.pts - a.pts || b.gd - a.gd);
            
        const myRank = table.findIndex(t => t.id === Store.state.club.id) + 1;
        
        if(myRank <= board.objectiveRank) {
            board.confidence = Math.min(100, board.confidence + 2);
        } else {
            // Hoe ver zit je eronder?
            const diff = myRank - board.objectiveRank;
            let penalty = 2;
            if(diff > 5) penalty = 5; // Zware straf als je stijf onderaan staat
            
            board.confidence = Math.max(0, board.confidence - penalty);
        }
        
        // CHECK GAME OVER: ontslag is definitief, niet optioneel
        if(board.confidence <= 0) {
            Store.state.game.over = true;
            Store.save();
            this.showGameOver();
        }
    },

    showGameOver() {
        UI.forcedModal(
            "😤 Ontslagen!",
            `Het bestuur heeft geen vertrouwen meer in je.<br>Je doelstelling (<strong>${Store.state.board.objective}</strong>) is uit zicht.<br><br>Je wordt per direct op straat gezet.`,
            "Start nieuwe carrière",
            () => Store.wipe()
        );
    },

simulateRound(divNr, report) {
        const teams = Store.state.competitions[divNr];
        const rounds = Store.state.schedules ? Store.state.schedules[divNr] : null;
        if(!teams || !rounds) return; 
        
        const roundIdx = Store.state.game.day - 1;
        if(roundIdx < 0 || roundIdx >= rounds.length) return;
        
        const byId = {};
        teams.forEach(t => byId[t.id] = t);

        rounds[roundIdx].forEach(m => {
            const h = byId[m.h], a = byId[m.a];
            if(!h || !a) return;
            
            if(h.id === Store.state.club.id) {
                // Ticket inkomsten (alleen bij thuiswedstrijden)
                const inc = Math.round(500 * Math.pow(1.6, Store.state.club.facilities.stadium) * 0.85 * 18 * 1.2);
                Store.state.club.budget += inc;
                if(report) { report.income += inc; report.breakdown.push({txt:"Tickets", amt:inc}); }
            }

            const matchData = this.playMatch(h, a);
            
            // Als jij speelt, slaan we het resultaat + events op
            if(h.id === Store.state.club.id || a.id === Store.state.club.id) {
                const entry = {
                    day: Store.state.game.day,
                    home: h.name, 
                    away: a.name, 
                    score: matchData.score, 
                    events: matchData.events,
                    note: matchData.note,
                    isYou: true
                };
                Store.state.results.push(entry);
                if(!Store.state.seasonResults) Store.state.seasonResults = [];
                Store.state.seasonResults.push(entry);
            }

            this.applyResult(h, a, matchData);
        });
    },

simulateTransfers() {
        // Geen AI transfers als markt dicht is
        if(!this.isTransferWindowOpen()) return;

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

generateNews() {
        const s = Store.state;
        if(!Array.isArray(s.news)) s.news = [];
        let articles = [];

        // A. Nieuws uit JOUW divisie (echte uitslagen)
        s.results.forEach(r => {
            const diff = Math.abs(r.score[0] - r.score[1]);
            const total = r.score[0] + r.score[1];
            
            // Grote uitslag (verschil > 3)
            if(diff >= 3) {
                const winner = r.score[0] > r.score[1] ? r.home : r.away;
                const loser = r.score[0] > r.score[1] ? r.away : r.home;
                const txt = UTILS.choice(CONFIG.newsTemplates.bigWin).replace('[WINNER]', winner).replace('[LOSER]', loser);
                articles.push({ type:'match', text: txt, club: winner, important: true });
            }
            // Doelpuntrijk gelijkspel
            else if(r.score[0] === r.score[1] && total >= 4) {
                const txt = UTILS.choice(CONFIG.newsTemplates.draw).replace('[HOME]', r.home).replace('[AWAY]', r.away);
                articles.push({ type:'match', text: txt, club: r.home });
            }
        });

        // B. Willekeurig nieuws uit topdivisies (Sfeer)
        if(Math.random() < 0.5) {
            const topClubs = CONFIG.realLeagues[1]; // Eredivisie
            const c1 = UTILS.choice(topClubs);
            const c2 = UTILS.choice(topClubs);
            if(c1 !== c2) {
                const txt = `Gerucht: ${c1} heeft interesse in sterspeler van ${c2}.`;
                articles.push({ type:'rumor', text: txt, club: c1 });
            }
        }

        // C. Transfernieuws (sfeer)
        if(Math.random() < 0.3) {
            const names = ["Jansen", "de Jong", "Silva", "Bakker", "Santos"];
            const clubs = CONFIG.realLeagues[1];
            const txt = UTILS.choice(CONFIG.newsTemplates.transfer)
                .replace('[PLAYER]', UTILS.choice(names))
                .replace('[CLUB]', UTILS.choice(clubs));
            articles.push({ type:'transfer', text: txt, club: UTILS.choice(clubs) });
        }

        // D. Club specifiek nieuws (Jij)
        if(s.club.budget < 50000) {
            articles.push({ type:'finance', text: `Zorgen over financiën bij ${s.club.name}.`, club: s.club.name });
        }

        // Voeg toe aan store (Bovenin, nieuwste eerst), max 25 berichten
        const newsItems = articles.map(a => ({ 
            id: UTILS.rid(), 
            week: s.game.day, 
            ...a 
        }));
        
        s.news = [...newsItems, ...s.news].slice(0, 25);
    },

    // Hulpfunctie: Kies een doelpuntenmaker op basis van ATT stat
    pickScorer(team) {
        if(!team || team.length === 0) return UTILS.genName().split(" ")[1];
        
        let candidates = [];
        team.forEach(p => {
            // Gewicht: Aanvallers tellen zwaarder mee
            let weight = p.att;
            if(["SP", "RB", "LB", "VL", "VR"].includes(p.pos)) weight *= 3;
            if(["CAM", "CM"].includes(p.pos)) weight *= 2;
            
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
        if(!Store.state.training) Store.state.training = { selected: [], done: false };
        if(Store.state.training.done) return UI.toast("Training voor deze week is al gedaan!");
        
        const lvl = Store.state.club.facilities.training;
        
        // BEPAAL HET MAX AANTAL SLOTS OP BASIS VAN LEVEL
        let maxSlots = 2; // Level 1 (basis)
        if(lvl >= 2) maxSlots = 3; // Level 2 & 3
        if(lvl >= 4) maxSlots = 4; // Level 4 & 5+

        const sel = Store.state.training.selected;
        if(sel.includes(id)) {
            // Deselecteer
            Store.state.training.selected = sel.filter(x => x !== id);
        } else {
            // Selecteer (met variabele max)
            if(sel.length >= maxSlots) return UI.toast(`Max ${maxSlots} spelers selecteren op dit niveau!`);
            sel.push(id);
        }
        Store.save();
        UI.render(); 
    },

    executeTraining() {
        const t = Store.state.training;
        if(!t || t.done) return;
        if(t.selected.length === 0) return UI.toast("Selecteer eerst spelers.");

        const lvl = Store.state.club.facilities.training;
        let report = [];

        t.selected.forEach(pid => {
            const p = Store.state.team.find(x => x.id === pid);
            if(p) {
                let min = 0;
                let max = 0;

                if (lvl === 1) { min = 0; max = 1; }       // Lvl 1: +0 of +1
                else if (lvl === 2) { min = 0; max = 1; }  // Lvl 2: +0 of +1
                else if (lvl === 3) { min = 0; max = 2; }  // Lvl 3: +0, +1 of +2
                else if (lvl === 4) { min = 0; max = 2; }  // Lvl 4: +0, +1 of +2
                else if (lvl >= 5)  { min = 1; max = 2; }  // Lvl 5: +1 of +2 (Altijd groei)

                const growth = Math.floor(Math.random() * (max - min + 1)) + min;
                
                if(growth > 0) {
                    // Update stats
                    p.att = Math.min(99, p.att + growth);
                    p.def = Math.min(99, p.def + growth);
                    p.spd = Math.min(99, p.spd + growth);
                    this.recalcPlayer(p);
                    
                    report.push(`${p.name} (+${growth})`);
                } else {
                    report.push(`${p.name} (+0)`);
                }
            }
        });

        t.done = true;
        Store.save();
        UI.render();
        UI.alert("💪 Training voltooid!", `Resultaten:<br>- ${report.join("<br>- ")}`);
    },

    // --- MATCH ENGINE ---
    // Simuleert een wedstrijd in blokken van 10 minuten met events.
    // Als de speler meedoet wordt ook het tactiek-systeem (steen-papier-schaar)
    // toegepast en een 'note' teruggegeven voor in de UI.
    playMatch(h, a) {
        const isPlayerHome = h.id === Store.state.club.id;
        const isPlayerAway = a.id === Store.state.club.id;

        let homeSquad = isPlayerHome ? Store.state.team : []; 
        let awaySquad = isPlayerAway ? Store.state.team : [];

        // Basis sterktes + klein thuisvoordeel voor iedereen
        let hStr = h.strength + 3; 
        let aStr = a.strength;
        
        // Stadion bonus (alleen als de speler thuis speelt)
        if(isPlayerHome) hStr += (Store.state.club.facilities.stadium * 2);

        // --- TACTIEK: steen-papier-schaar tegen een random AI tactiek ---
        let note = "";
        let myTacConfig = null;
        if(isPlayerHome || isPlayerAway) {
            const myTac = Store.state.club.tactic;
            myTacConfig = CONFIG.tactics[myTac];
            const aiTac = UTILS.choice(Object.keys(CONFIG.tactics));
            const bonus = this.getTacticBonus(myTac, aiTac);
            
            if(isPlayerHome) hStr = hStr * (1 + bonus / 100);
            else aStr = aStr * (1 + bonus / 100);

            if(bonus > 0) note = `✅ Tactische meesterzet! Jouw ${myTacConfig.name} counterde ${CONFIG.tactics[aiTac].name}.`;
            else if(bonus < 0) note = `❌ Tactisch overklast: de tegenstander speelde ${CONFIG.tactics[aiTac].name}.`;
            else note = "⚖️ Tactieken in evenwicht.";
        }

        // Aanvals/verdedigingsbonus van je tactiek beïnvloedt de kansen
        let myAtt = 0, myDef = 0;
        if(myTacConfig) { myAtt = myTacConfig.attBonus; myDef = myTacConfig.defBonus; }

        // --- DE SIMULATIE (9 blokken van 10 minuten) ---
        let hGoals = 0;
        let aGoals = 0;
        let events = [];
        
        let hRed = false;
        let aRed = false;

        for(let minute = 10; minute <= 90; minute += 10) {
            // Rood nadeel (Rood = 30% krachtverlies)
            let currH = hRed ? hStr * 0.7 : hStr;
            let currA = aRed ? aStr * 0.7 : aStr;

            // 1. KANS OP GOAL
            const diff = currH - currA;
            let hChance = 0.12 + (diff / 500);
            let aChance = 0.12 - (diff / 500);

            // Tactiek: aanvallend = meer eigen kansen, verdedigend = minder kansen tegen
            if(isPlayerHome) { hChance += myAtt / 300; aChance -= myDef / 300; }
            if(isPlayerAway) { aChance += myAtt / 300; hChance -= myDef / 300; }

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
                if(squad.length > 0) {
                    const unlucky = squad[Math.floor(Math.random() * squad.length)];
                    events.push(`🚑 ${minute}' Blessure: ${unlucky.name}`);
                }
            }
        }

        return { score: [hGoals, aGoals], events: events, note: note, homeRed: hRed, awayRed: aRed };
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

endSeason() {
        let msg = `Seizoen ${Store.state.game.season} voorbij!<br>`;

        // 0. Speel resterende rondes van divisies met een langer schema uit
        //    (bijv. Div 2 heeft 20 teams = 38 rondes, jouw divisie mogelijk 34)
        for(let d = 1; d <= 5; d++) {
            const rounds = Store.state.schedules ? Store.state.schedules[d] : null;
            const teams = Store.state.competitions[d];
            if(!rounds || !teams) continue;
            
            const byId = {};
            teams.forEach(t => byId[t.id] = t);
            
            for(let r = Store.state.game.day - 1; r < rounds.length; r++) {
                rounds[r].forEach(m => {
                    const h = byId[m.h], a = byId[m.a];
                    if(!h || !a) return;
                    this.applyResult(h, a, this.playMatch(h, a));
                });
            }
        }
        
        // 1. Bepaal wie verhuist (promotie/degradatie)
        let moves = [];
        
        // Loop door elke divisie om promotie/degradatie te bepalen
        for(let d=1; d<=5; d++) {
            // Sorteer de tabel van deze divisie
            let table = [...Store.state.competitions[d]].sort((a,b) => {
                if (b.pts !== a.pts) return b.pts - a.pts; // Meeste punten
                return b.gd - a.gd; // Beter doelsaldo
            });

            // --- JOUW CLUB CHECK ---
            // Dit blok regelt geld en historie. Dit mag ALLEEN gebeuren voor jouw divisie.
            const myPos = table.findIndex(x => x.id === Store.state.club.id);
            if(myPos > -1) {
                const prize = Math.round(1000000 / d * (table.length - myPos));
                Store.state.club.budget += prize;
                msg += `<br>Je bent geëindigd op plek <strong>${myPos + 1}</strong> in Divisie ${d}.<br>Bonus: <strong>${UTILS.fmtMoney(prize)}</strong><br>`;
                
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
            }

            // --- BEPAAL AI & SPELER VERHUIZINGEN ---
            
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
        const oldDiv = lastHist ? lastHist.division : 5; 
        const newDiv = Store.state.club.division;
        
        if(newDiv < oldDiv) msg += "🎉 <strong>GEPROMOVEERD!</strong> Welkom in Divisie " + newDiv;
        else if(newDiv > oldDiv) msg += "😞 <strong>GEDEGRADEERD...</strong> Succes in Divisie " + newDiv;
        else msg += "Je blijft in Divisie " + newDiv;

        // 4. Overige resets
        Store.state.game.season++;
        Store.state.game.day = 1;
        Store.state.team.forEach(p => { p.age++; p.value = Math.round(p.ovr * p.ovr * 25); });
        Store.state.transferList = []; 
        Store.state.incomingOffers = [];
        Store.state.seasonResults = [];
        Store.state.results = [];
        
        // 5. Nieuw schema voor alle (herschikte) divisies
        this.generateAllSchedules();
        
        // 6. Update UI en Save
        Store.state.ui.viewDivision = Store.state.club.division;
        this.initCupSeason();
        this.determineObjective();

        UI.alert(`🏁 Seizoen ${Store.state.game.season - 1} afgelopen`, msg);
        Store.save(); 
        UI.render();
    },
}
