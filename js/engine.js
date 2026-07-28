import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Store } from './store.js';
import { UI } from './ui.js'; 

export const Engine = {
    generateSquad(n) { 
        let s=[]; 
        // Volg het sjabloon: 2 keepers + een dekkende veldbezetting
        for(let i=0;i<n;i++) {
            const pos = CONFIG.squadTemplate[i] || null;
            s.push(this.createPlayer(pos));
        }
        
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
        p.wage = this.calcWage(p);
    },

    // Salaris: schaalt met waarde én rating, zodat lonen echt drukken op het budget
    calcWage(p) {
        return Math.round(p.value / 150 + p.ovr * 5);
    },

    isYouthTeam(name) {
        return name.toLowerCase().startsWith("jong ");
    },

    isTransferWindowOpen() {
        const d = Store.state.game.day;
        return (d >= 1 && d <= 6) || (d >= 17 && d <= 22);
    },

    // Wanneer gaat de volgende window open? (voor vooraf afgesproken deals)
    nextWindowLabel() {
        const d = Store.state.game.day;
        if(d < 17) return "de winterstop (speeldag 17)";
        return "de zomerstop (start van het volgende seizoen)";
    },

    // Voer vooraf overeengekomen transfers uit zodra de transferwindow opengaat.
    // Wordt elke speelronde aangeroepen; doet niets als de window dicht is.
    processPendingDeals() {
        if(!this.isTransferWindowOpen()) return;
        if(!Store.state.pendingSignings) Store.state.pendingSignings = [];
        if(!Store.state.pendingSales) Store.state.pendingSales = [];

        // Aankopen komen binnen
        const signings = Store.state.pendingSignings;
        if(signings.length > 0) {
            let lines = [];
            signings.forEach(s => {
                if(Store.state.team.length < 30) {
                    Store.state.team.push(s.player);
                    lines.push(`✅ ${s.player.name} (van ${s.from})`);
                } else {
                    // Selectie vol: transfersom terugstorten
                    Store.state.club.budget += s.fee;
                    lines.push(`↩️ ${s.player.name} — selectie was vol, transfersom teruggestort`);
                }
            });
            Store.state.pendingSignings = [];
            this.validateLineup();
            UI.alert("📥 Transferwindow open — aanwinsten gearriveerd!", lines.join("<br>"));
        }

        // Verkochte spelers vertrekken (het geld komt nu pas binnen)
        const sales = Store.state.pendingSales;
        if(sales.length > 0) {
            let lines = [];
            sales.forEach(s => {
                const idx = Store.state.team.findIndex(p => p.id === s.playerId);
                if(idx > -1) {
                    Store.state.club.budget += s.amount;
                    Store.state.team.splice(idx, 1);
                    lines.push(`💰 ${s.playerName} → ${s.club} (${UTILS.fmtMoney(s.amount)})`);
                }
                if(Store.state.training && Store.state.training.selected) {
                    Store.state.training.selected = Store.state.training.selected.filter(id => id !== s.playerId);
                }
            });
            Store.state.pendingSales = [];
            this.validateLineup();
            if(lines.length > 0) UI.alert("📤 Transferwindow open — spelers vertrokken", lines.join("<br>"));
        }
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

        if(pos === "K") {
            // Keeper: 'def' staat voor keeperskwaliteit
            def = rand(15, 30); spd = rand(-5, 10); att = rand(-25, -10);
        } else if(["SP", "LB", "RB"].includes(pos)) {
            // Aanvallers (spits + buitenspelers)
            att = rand(10, 30); spd = rand(5, 25); def = rand(-10, 10);
        } else if(["CV", "VL", "VR"].includes(pos)) {
            // Verdedigers (centraal + backs)
            def = rand(10, 30); spd = rand(-5, 15); att = rand(-10, 10);
        } else if(["DM", "VVM"].includes(pos)) {
            // Verdedigende middenvelders
            def = rand(5, 25); spd = rand(0, 15); att = rand(-5, 10);
        } else {
            att = rand(0, 20); def = rand(0, 20); spd = rand(0, 20);
        }

        const clamp = (n) => Math.max(10, Math.min(99, Math.floor(n)));
        att = clamp(att); def = clamp(def); spd = clamp(spd);

        const ovr = Math.round((att + def + spd) / 3);
        const val = Math.round(ovr*ovr*25 + UTILS.rand(0,10000));
        const contractYears = UTILS.rand(1, 4);

        // --- STAP 4: RETURN OBJECT MET VLAG ---
        const p = { 
            id: UTILS.rid(), 
            name: fullName,     // De gekozen naam
            nat: code,          // De landcode (bijv "NL")
            flag: nationData.flag, // De emoji vlag (bijv "🇳🇱")
            age, pos, ovr, att, def, spd, value: val, wage: 0, contractYears,
            injuredWeeks: 0, suspended: 0
        }; 
        p.wage = this.calcWage(p);
        this.assignPotential(p);
        return p;
    },

    // --- SPELERONTWIKKELING (potentieel, groei, veroudering, pensioen) ---

    // Verborgen potentieel: jonge spelers hebben veel groeiruimte, ouderen nauwelijks
    assignPotential(p) {
        if(p.age <= 21) p.potential = Math.min(94, p.ovr + UTILS.rand(8, 25));
        else if(p.age <= 25) p.potential = Math.min(92, p.ovr + UTILS.rand(3, 12));
        else if(p.age <= 29) p.potential = Math.min(90, p.ovr + UTILS.rand(0, 5));
        else p.potential = p.ovr;
    },

    // Gedeelde groei/verval-curve: geeft alleen de OVR-delta voor dit seizoen
    // terug (groei richting potentieel bij jonge spelers, verval na de dertig).
    // Wordt door twee varianten gebruikt omdat volledige spelers (att/def/spd)
    // en lichte AI-selecties (alleen ovr) verschillend moeten worden bijgewerkt.
    growthDelta(p) {
        if(p.potential === undefined) this.assignPotential(p);

        let delta = 0;
        if(p.age <= 21) delta = UTILS.rand(1, 3);
        else if(p.age <= 25) delta = UTILS.rand(0, 2);
        else if(p.age <= 29) delta = UTILS.rand(-1, 1);
        else if(p.age <= 32) delta = -UTILS.rand(1, 2);
        else delta = -UTILS.rand(2, 4);

        // Groei stopt bij het potentieel; verval mag altijd doorzetten
        if(delta > 0) {
            const room = p.potential - p.ovr;
            delta = Math.min(delta, Math.max(0, room));
        }
        return delta;
    },

    // Seizoensontwikkeling voor VOLLEDIGE spelers (met att/def/spd) —
    // gebruikt voor jouw eigen selectie. Geeft de OVR-verandering terug.
    developPlayer(p) {
        const delta = this.growthDelta(p);
        if(delta !== 0) {
            const clamp = (n) => Math.max(10, Math.min(99, n));
            p.att = clamp(p.att + delta);
            p.def = clamp(p.def + delta);
            p.spd = clamp(p.spd + delta);
            this.recalcPlayer(p);
        }
        return delta;
    },

    // Seizoensontwikkeling voor LICHTE AI-selecties (alleen ovr, geen
    // att/def/spd) — gebruikt in developAISquads(). Past ovr direct aan.
    developLightPlayer(p) {
        const delta = this.growthDelta(p);
        if(delta !== 0) {
            p.ovr = Math.max(20, Math.min(94, p.ovr + delta));
            p.value = Math.round(p.ovr * p.ovr * 25);
        }
        return delta;
    },

    // Kans dat een oudere speler aan het einde van het seizoen stopt
    retirementChance(age) {
        if(age < 34) return 0;
        if(age === 34) return 0.15;
        if(age === 35) return 0.35;
        if(age === 36) return 0.6;
        return 0.85;
    },

    // --- OPSTELLING & FORMATIE ---

    getFormation() {
        return CONFIG.tactics[Store.state.club.tactic].formation;
    },

    getPosGroup(pos) {
        for(const g in CONFIG.positionGroups) {
            if(CONFIG.positionGroups[g].includes(pos)) return g;
        }
        return "MID";
    },

    isAvailable(p) {
        return (p.injuredWeeks || 0) <= 0 && (p.suspended || 0) <= 0;
    },

    // Effectieve rating van een speler op een plek in de opstelling.
    // Buiten positie spelen kost rating; een veldspeler op keeper is een ramp.
    effectiveOvr(p, slotGroup) {
        const pGroup = this.getPosGroup(p.pos);
        if(pGroup === slotGroup) return p.ovr;
        if(slotGroup === "GK" || pGroup === "GK") return Math.round(p.ovr * 0.5);
        // Naastgelegen linie (DEF<->MID of MID<->ATT) kost minder dan DEF<->ATT
        const order = { DEF: 0, MID: 1, ATT: 2 };
        const dist = Math.abs(order[pGroup] - order[slotGroup]);
        return Math.round(p.ovr * (dist >= 2 ? 0.7 : 0.85));
    },

    // Kies automatisch de beste 11 voor de huidige formatie
    autoPickLineup() {
        const f = this.getFormation();
        const pool = Store.state.team.filter(p => this.isAvailable(p));
        const lineup = { gk: null, def: [], mid: [], att: [] };
        const used = new Set();

        const pickBest = (group, count, target) => {
            // Eerst spelers die écht op deze positie spelen, beste eerst
            const natives = pool.filter(p => !used.has(p.id) && this.getPosGroup(p.pos) === group)
                                .sort((a,b) => b.ovr - a.ovr);
            for(const p of natives) {
                if(target.length >= count) break;
                target.push(p.id); used.add(p.id);
            }
        };

        const gkSlot = [];
        pickBest("GK", 1, gkSlot);
        pickBest("DEF", f.def, lineup.def);
        pickBest("MID", f.mid, lineup.mid);
        pickBest("ATT", f.att, lineup.att);
        lineup.gk = gkSlot[0] || null;

        // Vul gaten met de beste overgebleven spelers (op effectieve rating)
        const fillGap = (group, arr, count) => {
            while(arr.length < count) {
                const rest = pool.filter(p => !used.has(p.id))
                                 .sort((a,b) => this.effectiveOvr(b, group) - this.effectiveOvr(a, group));
                if(rest.length === 0) break;
                arr.push(rest[0].id); used.add(rest[0].id);
            }
        };
        if(!lineup.gk) {
            const rest = pool.filter(p => !used.has(p.id))
                             .sort((a,b) => this.effectiveOvr(b, "GK") - this.effectiveOvr(a, "GK"));
            if(rest.length > 0) { lineup.gk = rest[0].id; used.add(rest[0].id); }
        }
        fillGap("DEF", lineup.def, f.def);
        fillGap("MID", lineup.mid, f.mid);
        fillGap("ATT", lineup.att, f.att);

        Store.state.lineup = lineup;
        return lineup;
    },

    // Repareer de opstelling: verwijder verkochte/geblesseerde/geschorste spelers,
    // pas groepsgroottes aan de formatie aan en vul gaten automatisch
    validateLineup() {
        if(!Store.state.lineup) return this.autoPickLineup();
        
        const l = Store.state.lineup;
        const f = this.getFormation();
        const valid = (id) => {
            if(!id) return false;
            const p = Store.state.team.find(x => x.id === id);
            return !!p && this.isAvailable(p);
        };

        if(!valid(l.gk)) l.gk = null;
        l.def = (l.def || []).filter(valid).slice(0, f.def);
        l.mid = (l.mid || []).filter(valid).slice(0, f.mid);
        l.att = (l.att || []).filter(valid).slice(0, f.att);

        // Dubbele ids eruit (kan door migratie)
        const seen = new Set();
        const dedupe = (id) => { if(!id || seen.has(id)) return false; seen.add(id); return true; };
        if(l.gk && !dedupe(l.gk)) l.gk = null;
        l.def = l.def.filter(dedupe);
        l.mid = l.mid.filter(dedupe);
        l.att = l.att.filter(dedupe);

        // Gaten vullen
        const pool = Store.state.team.filter(p => this.isAvailable(p) && !seen.has(p.id));
        const fill = (group, arr, count) => {
            while(arr.length < count && pool.length > 0) {
                pool.sort((a,b) => this.effectiveOvr(b, group) - this.effectiveOvr(a, group));
                const p = pool.shift();
                arr.push(p.id); seen.add(p.id);
            }
        };
        if(!l.gk) {
            pool.sort((a,b) => this.effectiveOvr(b, "GK") - this.effectiveOvr(a, "GK"));
            const p = pool.shift();
            if(p) { l.gk = p.id; seen.add(p.id); }
        }
        fill("DEF", l.def, f.def);
        fill("MID", l.mid, f.mid);
        fill("ATT", l.att, f.att);
        
        return l;
    },

    // Zet een speler op een plek in de opstelling (haalt hem weg van zijn oude plek)
    assignToLineup(group, index, playerId) {
        const l = Store.state.lineup || this.autoPickLineup();
        const p = Store.state.team.find(x => x.id === playerId);
        if(!p) return;
        if(!this.isAvailable(p)) return UI.toast("Deze speler is niet beschikbaar!");

        // Verwijder van huidige plek
        if(l.gk === playerId) l.gk = null;
        ["def","mid","att"].forEach(g => { l[g] = l[g].map(id => id === playerId ? null : id); });

        // Zet neer (de oude bezetter gaat eruit)
        if(group === "gk") l.gk = playerId;
        else l[group][index] = playerId;

        Store.save();
        UI.render();
    },

    // Alle slots als platte lijst: [{group, id}]
    getLineupSlots() {
        const l = this.validateLineup();
        const f = this.getFormation();
        const slots = [{ group: "GK", key: "gk", index: 0, id: l.gk }];
        for(let i=0; i<f.def; i++) slots.push({ group: "DEF", key: "def", index: i, id: l.def[i] || null });
        for(let i=0; i<f.mid; i++) slots.push({ group: "MID", key: "mid", index: i, id: l.mid[i] || null });
        for(let i=0; i<f.att; i++) slots.push({ group: "ATT", key: "att", index: i, id: l.att[i] || null });
        return slots;
    },

    // Teamsterkte = gemiddelde effectieve rating van de opgestelde 11
    calculatePlayerTeamStrength() {
        if(Store.state.team.length === 0) return 30;
        const slots = this.getLineupSlots();
        let total = 0;
        slots.forEach(s => {
            const p = Store.state.team.find(x => x.id === s.id);
            total += p ? this.effectiveOvr(p, s.group) : 20; // leeg gat = zwakke amateur
        });
        return Math.round(total / slots.length);
    },

    // De opgestelde spelers (voor scorers/blessures)
    getLineupPlayers() {
        const slots = this.getLineupSlots();
        return slots.map(s => Store.state.team.find(x => x.id === s.id)).filter(Boolean);
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

    // --- AI SELECTIES ---
    // Elke AI club krijgt een lichte selectie (naam, positie, leeftijd, OVR,
    // waarde — geen volledige stats) zodat de transfermarkt, topscorers en
    // wedstrijdverslagen over échte, individuele spelers gaan i.p.v. anonieme cijfers.

    aiSquadTemplate: ["K", "K", "CV", "CV", "CV", "VL", "VR", "DM", "VVM", "CM", "CM", "CAM", "LB", "RB", "SP", "SP"],

    generateAIPlayer(pos, teamStrength, ageOverride) {
        const allNations = Object.keys(CONFIG.nations);
        let code = "NL";
        if(Math.random() > 0.60) code = UTILS.choice(allNations.filter(k => k !== "NL"));
        const nationData = CONFIG.nations[code];

        const age = ageOverride || UTILS.rand(17, 34);
        let ovr = teamStrength + UTILS.rand(-6, 6);
        if(age <= 20) ovr -= UTILS.rand(2, 6); // jonkies zijn nog niet op niveau
        ovr = Math.max(25, Math.min(94, ovr));

        const p = {
            id: UTILS.rid(),
            name: `${UTILS.choice(nationData.first)} ${UTILS.choice(nationData.last)}`,
            nat: code,
            flag: nationData.flag,
            age, pos, ovr,
            value: Math.round(ovr * ovr * 25)
        };
        this.assignPotential(p);
        return p;
    },

    generateSquadForTeam(team) {
        team.squad = this.aiSquadTemplate.map(pos => this.generateAIPlayer(pos, team.strength));
        this.recalcTeamStrength(team);
    },

    generateAISquads() {
        for(let d = 1; d <= 5; d++) {
            if(!Store.state.competitions[d]) continue;
            Store.state.competitions[d].forEach(t => {
                if(t.id !== Store.state.club.id && !t.squad) this.generateSquadForTeam(t);
            });
        }
    },

    // Sterkte van een AI team = gemiddelde OVR van de beste 11 in de selectie.
    // Beschermt tegen corrupte (NaN) entries zodat een team nooit zonder
    // geldige sterkte (en dus zonder doelpunten) komt te zitten.
    recalcTeamStrength(team) {
        if(!team.squad || team.squad.length === 0) return;
        const valid = team.squad.filter(p => Number.isFinite(p.ovr));
        if(valid.length === 0) return; // behoud de vorige sterkte i.p.v. NaN
        const best = [...valid].sort((a, b) => b.ovr - a.ovr).slice(0, 11);
        const avg = Math.round(best.reduce((s, p) => s + p.ovr, 0) / best.length);
        if(Number.isFinite(avg)) team.strength = avg;
    },

    // Jaarlijkse ontwikkeling van AI selecties: leeftijd, groei/verval,
    // pensioen (met vervanging door een jong talent) en bijgewerkte sterkte.
    developAISquads() {
        for(let d = 1; d <= 5; d++) {
            const teams = Store.state.competitions[d];
            if(!teams) continue;
            teams.forEach(team => {
                if(team.id === Store.state.club.id || !team.squad) return;
                team.squad.forEach(p => { p.age++; });

                const staying = [];
                team.squad.forEach(p => {
                    if(Math.random() < this.retirementChance(p.age)) return; // stopt
                    this.developLightPlayer(p);
                    staying.push(p);
                });
                const retiredCount = team.squad.length - staying.length;
                for(let i = 0; i < retiredCount; i++) {
                    staying.push(this.generateAIPlayer(UTILS.choice(this.aiSquadTemplate), team.strength, 17 + UTILS.rand(0, 2)));
                }
                team.squad = staying;
                this.recalcTeamStrength(team);
            });
        }
    },

    // Zoek een AI speler in alle selecties (voor transfers/topscorer-koppeling)
    findAIPlayer(playerId) {
        for(let d = 1; d <= 5; d++) {
            const teams = Store.state.competitions[d];
            if(!teams) continue;
            for(const team of teams) {
                if(!team.squad) continue;
                const idx = team.squad.findIndex(p => p.id === playerId);
                if(idx > -1) return { team, player: team.squad[idx], index: idx, division: d };
            }
        }
        return null;
    },

    // Maak van een lichte AI speler een volwaardige speler voor jouw selectie
    hydrateAIPlayer(entry) {
        let attOff = 0, defOff = 0, spdOff = 0;
        if(entry.pos === "K") { defOff = 12; attOff = -12; }
        else if(["SP","LB","RB"].includes(entry.pos)) { attOff = 10; defOff = -10; }
        else if(["CV","VL","VR"].includes(entry.pos)) { defOff = 10; attOff = -10; }
        else if(["DM","VVM"].includes(entry.pos)) { defOff = 6; attOff = -6; }

        const clamp = (n) => Math.max(10, Math.min(99, Math.round(n)));
        const p = {
            id: entry.id,
            name: entry.name,
            nat: entry.nat,
            flag: entry.flag,
            age: entry.age,
            pos: entry.pos,
            att: clamp(entry.ovr + attOff),
            def: clamp(entry.ovr + defOff),
            spd: clamp(entry.ovr + spdOff),
            ovr: entry.ovr,
            value: entry.value,
            wage: 0,
            contractYears: Math.max(2, UTILS.rand(1, 4)),
            injuredWeeks: 0,
            suspended: 0,
            potential: entry.potential
        };
        p.ovr = Math.round((p.att + p.def + p.spd) / 3);
        p.value = Math.round(p.ovr * p.ovr * 25);
        p.wage = this.calcWage(p);
        if(p.potential === undefined) this.assignPotential(p);
        return p;
    },

    // De transfermarkt = een steekproef van spelers die AI-clubs in de etalage hebben
    refreshMarket(count) {
        const entries = [];
        let guard = 0;
        while(entries.length < count && guard++ < 200) {
            const d = UTILS.rand(1, 5);
            const teams = Store.state.competitions[d];
            if(!teams) continue;
            const team = UTILS.choice(teams);
            if(!team || team.id === Store.state.club.id || !team.squad || team.squad.length <= 12) continue;
            const p = UTILS.choice(team.squad);
            if(!p) continue;
            if(entries.some(e => e.id === p.id) || Store.state.market.some(e => e.id === p.id)) continue;
            entries.push({ ...p, fromClub: team.name, fromClubId: team.id });
        }
        return entries;
    },

    // --- AI-ONDERLINGE TRANSFERS (alleen als de window open is) ---
    simulateAITransfers() {
        if(!this.isTransferWindowOpen()) return;

        const numTransfers = UTILS.rand(1, 3);
        for(let i = 0; i < numTransfers; i++) {
            // Verkoper: willekeurige club met genoeg spelers
            const dSell = UTILS.rand(1, 5);
            const sellers = (Store.state.competitions[dSell] || []).filter(t => t.id !== Store.state.club.id && t.squad && t.squad.length > 13);
            if(sellers.length === 0) continue;
            const seller = UTILS.choice(sellers);
            const pIdx = UTILS.rand(0, seller.squad.length - 1);
            const player = seller.squad[pIdx];

            // Koper: club uit dezelfde of een hogere divisie (met ruimte in de selectie)
            const dBuy = Math.max(1, dSell - UTILS.rand(0, 1));
            const buyers = (Store.state.competitions[dBuy] || []).filter(t => t.id !== Store.state.club.id && t.id !== seller.id && t.squad && t.squad.length < 22);
            if(buyers.length === 0) continue;
            const buyer = UTILS.choice(buyers);

            seller.squad.splice(pIdx, 1);
            buyer.squad.push(player);
            this.recalcTeamStrength(seller);
            this.recalcTeamStrength(buyer);

            // Als hij op de markt stond, is hij niet langer te koop
            Store.state.market = Store.state.market.filter(e => e.id !== player.id);

            if(!Store.state.news) Store.state.news = [];
            const txt = UTILS.choice(CONFIG.newsTemplates.transfer)
                .replace('[PLAYER]', player.name)
                .replace('[CLUB]', buyer.name);
            Store.state.news = [{ id: UTILS.rid(), week: Store.state.game.day, type: 'transfer', text: txt, club: buyer.name }, ...Store.state.news].slice(0, 25);
        }
    },

    // --- TOPSCORERS ---
    // Houdt per speler het aantal doelpunten dit seizoen bij (alle divisies).
    recordGoals(events, homeTeam, awayTeam) {
        if(!events || events.length === 0) return;
        if(!Store.state.topScorers) Store.state.topScorers = {};

        events.forEach(ev => {
            if(ev.type !== 'goal' || !ev.scorerId) return;
            const club = ev.side === 'home' ? homeTeam : awayTeam;
            const existing = Store.state.topScorers[ev.scorerId];
            if(existing) {
                existing.goals++;
                existing.name = ev.scorerName || existing.name;
                existing.club = club.name;
                existing.division = this.findClubDivision(club.id);
            } else {
                Store.state.topScorers[ev.scorerId] = {
                    name: ev.scorerName,
                    club: club.name,
                    division: this.findClubDivision(club.id),
                    goals: 1
                };
            }
        });
    },

    findClubDivision(clubId) {
        for(let d = 1; d <= 5; d++) {
            if(Store.state.competitions[d] && Store.state.competitions[d].some(t => t.id === clubId)) return d;
        }
        return Store.state.club.division;
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
        talent.value = 10000; talent.wage = 100; talent.contractYears = 3;
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
        const isOpen = this.isTransferWindowOpen();
        const minV = Math.round(p.value * 0.9); const maxV = Math.round(p.value * 1.3);
        const fromClub = p.fromClub ? ` van <strong>${p.fromClub}</strong>` : "";
        let info = `Marktwaarde-indicatie: <strong>${UTILS.fmtMoney(minV)} - ${UTILS.fmtMoney(maxV)}</strong><br>Doe een bod op <strong>${p.name}</strong>${fromClub} (${p.age} jr, OVR ${p.ovr}):`;
        if(!isOpen) info += `<br><br><span style="color:#fbbf24">⏳ De transfermarkt is gesloten. Bij een akkoord sluit hij pas aan bij ${this.nextWindowLabel()}.</span>`;

        UI.prompt(`💸 Bod op ${p.name}`, info, p.value, (val) => {
            const bid = parseInt(val);
            if(isNaN(bid) || bid <= 0) return UI.toast("Ongeldig bedrag");
            if(Store.state.club.budget < bid) return UI.toast("Onvoldoende budget!");
            
            // Vaste vraagprijs: opnieuw bieden verandert de eis niet
            const required = this.getRequiredBid(p);

            if(bid >= required) {
                if(Store.state.team.length >= 30 && isOpen) return UI.toast("Selectie is vol!");
                
                // Succes bericht aanpassen op basis van leeftijd
                let welcomeMsg = "";
                if(p.age > 30 && gap > 0) welcomeMsg = `👴 "Ik kom graag mijn ervaring delen in Divisie ${myDiv}."`;
                else if(p.age < 23) welcomeMsg = `👶 "Bedankt voor de kans, ik ga vlammen!"`;
                else welcomeMsg = `🤝 "De deal is rond."`;

                Store.state.club.budget -= bid;
                const hydrated = this.hydrateAIPlayer(p);
                hydrated.contractYears = Math.max(2, hydrated.contractYears || 2); // Nieuwe aankoop tekent minimaal 2 seizoenen

                // Haal hem weg bij zijn (AI-)club en van de markt
                const found = this.findAIPlayer(p.id);
                if(found) { found.team.squad.splice(found.index, 1); this.recalcTeamStrength(found.team); }
                Store.state.market = Store.state.market.filter(x=>x.id !== id);

                if(isOpen) {
                    Store.state.team.push(hydrated);
                    this.validateLineup();
                    Store.save(); UI.render(); 
                    UI.alert("✅ Bod geaccepteerd!", `${welcomeMsg}<br><br><strong>${p.name}</strong> is speler van ${Store.state.club.name}.`);
                } else {
                    if(!Store.state.pendingSignings) Store.state.pendingSignings = [];
                    Store.state.pendingSignings.push({ player: hydrated, from: p.fromClub || "een andere club", fee: bid });
                    Store.save(); UI.render();
                    UI.alert("🤝 Deal afgesproken!", `${welcomeMsg}<br><br><strong>${p.name}</strong> sluit zich aan bij ${Store.state.club.name} zodra ${this.nextWindowLabel()} begint.`);
                }
            } else { 
                UI.alert("❌ Bod geweigerd", `De club (en zaakwaarnemer) willen minstens <strong>${UTILS.fmtMoney(required)}</strong>.`); 
            }
        });
    },
    
    extendContract(id) {
        const p = Store.state.team.find(x => x.id === id);
        if(!p) return;
        if(this.hasPendingSale(id)) return UI.toast("Deze speler is al verkocht en wacht op de transferwindow.");

        // Tekengeld = 15% van marktwaarde, contract +2 seizoenen, salaris +15%
        const cost = Math.round(p.value * 0.15);
        const newWage = Math.round(p.wage * 1.15);
        
        UI.confirm(
            `✍️ Contract verlengen`,
            `Contractverlenging voor <strong>${p.name}</strong>?<br><br>
             Huidig contract: <strong>${p.contractYears} seizoen(en)</strong><br>
             Nieuw contract: <strong>+2 seizoenen</strong><br>
             Nieuw salaris: <strong>${UTILS.fmtMoney(newWage)}/wk</strong> (was ${UTILS.fmtMoney(p.wage)})<br><br>
             Tekengeld: <strong>${UTILS.fmtMoney(cost)}</strong>`,
            () => {
                if(Store.state.club.budget < cost) return UI.toast("Onvoldoende budget!");
                
                Store.state.club.budget -= cost;
                p.contractYears += 2;
                p.wage = newWage;
                
                Store.save();
                UI.render();
                UI.toast("Contract verlengd! ✍️");
            },
            { yesLabel: "Verleng" }
        );
    },

    hasPendingSale(playerId) {
        return !!(Store.state.pendingSales || []).find(s => s.playerId === playerId);
    },

    toggleTransferList(id) {
        if(this.hasPendingSale(id)) return UI.toast("Deze speler is al verkocht en wacht op de transferwindow.");
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
        Store.state.incomingOffers.splice(oIdx, 1);
        const tlIdx = Store.state.transferList.indexOf(offer.playerId); if(tlIdx > -1) Store.state.transferList.splice(tlIdx, 1);

        if(this.isTransferWindowOpen()) {
            Store.state.club.budget += offer.amount;
            Store.state.team.splice(pIndex, 1);
            if(Store.state.training && Store.state.training.selected) {
                Store.state.training.selected = Store.state.training.selected.filter(id => id !== p.id);
            }
            this.validateLineup();
            Store.save(); UI.render(); 
            UI.alert("🤝 Deal!", `<strong>${p.name}</strong> verkocht aan ${offer.club} voor <strong>${UTILS.fmtMoney(offer.amount)}</strong>.`);
        } else {
            // Window dicht: deal is rond, maar hij blijft gewoon inzetbaar tot de window opengaat
            if(!Store.state.pendingSales) Store.state.pendingSales = [];
            Store.state.pendingSales.push({ playerId: p.id, playerName: p.name, club: offer.club, amount: offer.amount });
            Store.save(); UI.render();
            UI.alert("🤝 Deal afgesproken!", `<strong>${p.name}</strong> vertrekt naar ${offer.club} voor <strong>${UTILS.fmtMoney(offer.amount)}</strong> zodra ${this.nextWindowLabel()} begint.<br><br>Hij blijft tot dan gewoon inzetbaar.`);
        }
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

        // 4. Opslaan in historie
        c.history.push({ 
            round: roundName, 
            opponent: opp.name, 
            result: msg, 
            score: res, 
            win: win,
            events: matchData.events 
        });

        // 5. Live weergave van de bekerwedstrijd, daarna het resultaat
        UI.showLiveMatch({
            home: Store.state.club.name,
            away: opp.name,
            score: res,
            events: matchData.events,
            note: matchData.note
        }, { competition: `KNVB Beker — ${roundName}` });

        // 6. Resultaat afhandelen
        if(!win) {
            c.inTournament = false;
            UI.alert(`🏆 KNVB Beker - ${roundName}`, `${msg}<br><br>Je ligt uit het toernooi.`);
        } else {
            if(roundName === "FINALE") {
                Store.state.club.budget += 250000;
                c.inTournament = false;
                UI.alert("🏆🏆🏆 Bekerwinnaar!", `Je wint de KNVB Beker!<br><br>Bonus: <strong>€ 250.000</strong>`);
            } else {
                // Volgende ronde bijwerken zodat de Beker-pagina klopt
                c.nextRound = cupDays.find(d => d > day) || 0;
                UI.alert(`🏆 KNVB Beker - ${roundName}`, `${msg}<br><br>Je bent door naar de volgende ronde!`);
            }
        }
    },
    
    upgradeFacility(type) { const lvl=Store.state.club.facilities[type]; if(lvl>=8)return UI.toast("Max level"); const c=CONFIG.costs[type][lvl]; if(Store.state.club.budget<c)return UI.toast("Te weinig budget"); Store.state.club.budget-=c; Store.state.club.facilities[type]++; Store.save(); UI.render(); UI.toast("Upgrade!"); },
    setTactic(key) { 
        Store.state.club.tactic=key; 
        this.validateLineup(); // formatie kan veranderd zijn (bv. 4-4-2 -> 5-3-2)
        Store.save(); UI.render(); UI.toast(`Tactiek: ${CONFIG.tactics[key].name}`); 
    },

processMatchday() {
        // 0. Geen actief spel of game over? Dan niets doen
        if(!Store.state.team || Store.state.team.length === 0) return;
        if(Store.state.game.over) { this.showGameOver(); return; }

        // 1. Check of seizoen voorbij is
        if(Store.state.game.day > this.getSeasonLength()) { this.endSeason(); return; }

        // 1.5. Vooraf afgesproken transfers uitvoeren zodra de window opengaat
        this.processPendingDeals();
        
        // 2. Voorbereiding: opstelling repareren (blessures/schorsingen/verkopen)
        //    en teamsterkte berekenen op basis van de opgestelde 11
        Store.state.results = []; 
        this.validateLineup();
        const me = Store.state.competitions[Store.state.club.division].find(c => c.id === Store.state.club.id);
        if(me) me.strength = this.calculatePlayerTeamStrength();

        let report = { income: 0, expenses: 0, breakdown: [] };

        // 3. CRITICAL CHECK: Hebben we nog wel 11 spelers?
        if(Store.state.team.length < 11) {
            // Noodgreep: vul aan tot 11 met zwakke amateurs zodat de game niet vastloopt
            let added = 0;
            while(Store.state.team.length < 11) {
                const emergency = this.createPlayer(null, 17);
                this.applyStatPenalty(emergency, 20); // Echt zwakke amateurs
                Store.state.team.push(emergency);
                added++;
            }
            this.validateLineup();
            if(me) me.strength = this.calculatePlayerTeamStrength();
            UI.alert("⛔ Te weinig spelers!", `Je had minder dan 11 spelers.<br><br>De club heeft noodgedwongen <strong>${added} amateurspeler(s)</strong> uit de jeugd doorgeschoven. Regel snel versterking!`);
        }

        // 4. Bekerwedstrijden (op vaste dagen)
        if(Store.state.cup && Store.state.cup.inTournament) {
            const days = [5, 10, 15, 20];
            if(days.includes(Store.state.game.day)) this.playCupMatch();
        }

        // 5. Financiën (Salaris & Onderhoud)
        const wages = Store.state.team.reduce((sum, p) => sum + p.wage, 0);
        const maint = (Store.state.club.facilities.stadium * 500) + (Store.state.club.facilities.training * 400) + (Store.state.club.facilities.medical * 600);
        
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
        
        // 7. Simuleer transfers: AI-clubs bieden op jouw spelers, AI-clubs handelen
        //    onderling (alleen tijdens de window), en de markt ververst
        this.simulateTransfers();
        this.simulateAITransfers();
        Store.state.market.splice(0, 3); 
        Store.state.market.push(...this.refreshMarket(3)); 
        Store.state.market.sort((a,b)=>b.ovr-a.ovr);
        
        // 8. Nieuws genereren over deze speelronde
        this.generateNews();

        // 9. Blessures & schorsingen aftellen (na de wedstrijden van deze week)
        Store.state.team.forEach(p => {
            if(p.injuredWeeks > 0) p.injuredWeeks--;
            if(p.suspended > 0) p.suspended--;
        });

        // 10. Afronding & Training Reset
        Store.state.finance.lastWeek = { ...report, profit: report.income - report.expenses };
        
        if(Store.state.training) Store.state.training.done = false;

        this.updateBoardConfidence(); // Vertrouwen bijwerken na alle wedstrijden
        Store.state.game.day++; 
        Store.save(); 
        UI.render(); 

        // 11. LIVE WEDSTRIJD: speel jouw wedstrijd van deze ronde visueel af
        const myMatch = Store.state.results.find(r => r.isYou);
        if(myMatch) {
            UI.showLiveMatch(myMatch, { competition: UTILS.getLeagueName(Store.state.club.division) });
        }
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

        // Rode cijfers? Het bestuur wordt onrustig.
        if(Store.state.club.budget < 0) {
            board.confidence = Math.max(0, board.confidence - 2);
            if(board.confidence > 0 && board.confidence < 30) {
                UI.toast("⚠️ Het bestuur eist dat je de schulden wegwerkt!");
            }
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
                // Schaalt met divisie (meer publiek) en stadionniveau
                const div = Store.state.club.division;
                const stadium = Store.state.club.facilities.stadium;
                const inc = Math.round(4000 * (6 - div) * (1 + 0.35 * (stadium - 1)));
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
        // AI-clubs mogen het hele jaar door bieden op jouw spelers (net als in het echt,
        // onderhandelingen starten ruim voor de window). Buiten de window blijft een
        // geaccepteerd bod 'pending' tot de window opengaat (zie processPendingDeals/acceptOffer).
        const windowOpen = this.isTransferWindowOpen();
        const chanceMultiplier = windowOpen ? 1 : 0.4;

        Store.state.team.forEach(p => {
            if(this.hasPendingSale(p.id)) return; // al verkocht, wacht op window
            let chance = (Store.state.transferList.includes(p.id) ? 0.25 : (p.ovr > 75 ? 0.02 : 0)) * chanceMultiplier;
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

    // Hulpfunctie: Kies een doelpuntenmaker op basis van aanvalskracht.
    // Werkt zowel met volledige spelers (att/def/spd) als lichte AI-selecties
    // (alleen ovr) — geeft altijd {id, name} terug zodat we topscorers kunnen bijhouden.
    pickScorer(team) {
        const fallback = () => { const n = UTILS.genName(); return { id: null, name: n.split(" ")[1] }; };
        if(!team || team.length === 0) return fallback();
        
        let candidates = [];
        team.forEach(p => {
            if(p.pos === "K") return; // Keepers scoren niet
            // Gewicht: Aanvallers tellen zwaarder mee. 'att' voor volledige spelers,
            // anders 'ovr' als benadering voor lichte AI-selecties.
            let weight = Math.max(1, p.att !== undefined ? p.att : p.ovr);
            if(["SP", "RB", "LB"].includes(p.pos)) weight *= 3;
            if(["CAM", "CM"].includes(p.pos)) weight *= 2;
            
            candidates.push({ id: p.id, name: p.name, weight: weight });
        });
        if(candidates.length === 0) return fallback();

        // Totale 'score-kans' massa
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        
        for(const c of candidates) {
            if(random < c.weight) return c;
            random -= c.weight;
        }
        return candidates[0]; // Fallback
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

        const player = Store.state.team.find(p => p.id === id);
        if(player && player.injuredWeeks > 0) return UI.toast("Geblesseerde spelers kunnen niet trainen!");

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
    // Simuleert een wedstrijd per minuut met gestructureerde events
    // ({min, type, side, text}) zodat de live-weergave ze kan afspelen.
    // Blessures en rode kaarten voor JOUW spelers hebben echte gevolgen.
    playMatch(h, a) {
        const isPlayerHome = h.id === Store.state.club.id;
        const isPlayerAway = a.id === Store.state.club.id;
        const playerInvolved = isPlayerHome || isPlayerAway;

        // De opgestelde 11 (voor scorers, blessures en kaarten)
        const myLineup = playerInvolved ? this.getLineupPlayers() : [];

        // Basis sterktes + klein thuisvoordeel voor iedereen
        let hStr = h.strength + 3; 
        let aStr = a.strength;
        
        // Stadion bonus (alleen als de speler thuis speelt)
        if(isPlayerHome) hStr += (Store.state.club.facilities.stadium * 2);

        // --- TACTIEK: steen-papier-schaar tegen een random AI tactiek ---
        let note = "";
        let myTacConfig = null;
        if(playerInvolved) {
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

        // Medische staf: lagere blessurekans en kortere uitval
        const medical = Store.state.club.facilities.medical;
        const injuryChance = Math.max(0.002, 0.012 - medical * 0.001);

        // --- DE SIMULATIE (9 blokken van 10 minuten) ---
        let hGoals = 0;
        let aGoals = 0;
        let events = [];
        
        let hRed = false;
        let aRed = false;
        const alreadyHurt = new Set();

        for(let block = 10; block <= 90; block += 10) {
            // Events krijgen een 'echte' minuut binnen dit blok
            const minute = block - UTILS.rand(0, 9);
            
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
                const scorer = isPlayerHome ? this.pickScorer(myLineup) : this.pickScorer(h.squad);
                events.push({ min: minute, type: 'goal', side: 'home', text: `⚽ ${minute}' Goal: ${scorer.name}`, scorerId: scorer.id, scorerName: scorer.name });
            }

            // Uit scoort?
            if(Math.random() < aChance) {
                aGoals++;
                const scorer = isPlayerAway ? this.pickScorer(myLineup) : this.pickScorer(a.squad);
                events.push({ min: minute, type: 'goal', side: 'away', text: `⚽ ${minute}' Goal: ${scorer.name}`, scorerId: scorer.id, scorerName: scorer.name });
            }

            // 2. KANS OP ROOD (Zeer klein, maar grote impact)
            if(!hRed && Math.random() < 0.005) { // 0.5% kans per 10 min
                hRed = true;
                let txt = `🟥 ${minute}' Rode kaart (thuisploeg)`;
                if(isPlayerHome && myLineup.length > 0) {
                    const sinner = UTILS.choice(myLineup);
                    sinner.suspended = 2; // wordt na deze week 1 -> mist volgende wedstrijd
                    txt = `🟥 ${minute}' Rode kaart: ${sinner.name} (1 duel geschorst)`;
                }
                events.push({ min: minute, type: 'red', side: 'home', text: txt });
            }
            if(!aRed && Math.random() < 0.005) {
                aRed = true;
                let txt = `🟥 ${minute}' Rode kaart (uitploeg)`;
                if(isPlayerAway && myLineup.length > 0) {
                    const sinner = UTILS.choice(myLineup);
                    sinner.suspended = 2;
                    txt = `🟥 ${minute}' Rode kaart: ${sinner.name} (1 duel geschorst)`;
                }
                events.push({ min: minute, type: 'red', side: isPlayerAway ? 'away' : 'away', text: txt });
            }
            
            // 3. KANS OP BLESSURE (Alleen voor jouw spelers, met echte uitval)
            if(playerInvolved && myLineup.length > 0 && Math.random() < injuryChance) {
                const candidates = myLineup.filter(p => !alreadyHurt.has(p.id));
                if(candidates.length > 0) {
                    const unlucky = UTILS.choice(candidates);
                    alreadyHurt.add(unlucky.id);
                    // Uitvalduur: 2-6 'ticks' = mist 1 tot 5 wedstrijden; medische staf verkort dit
                    let duration = UTILS.rand(2, 6) - Math.floor(medical / 3);
                    duration = Math.max(2, duration);
                    unlucky.injuredWeeks = duration;
                    events.push({ min: minute, type: 'injury', side: isPlayerHome ? 'home' : 'away', text: `🚑 ${minute}' Blessure: ${unlucky.name} (${duration - 1} wk uit de roulatie)` });
                }
            }
        }

        events.sort((x, y) => x.min - y.min);

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

        this.recordGoals(resultObj.events, h, a);
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
                const prize = CONFIG.prizePerPlace[d] * (table.length - myPos);
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

        // 3b. Topscorer van het seizoen (voordat de tellers resetten)
        if(Store.state.topScorers) {
            const scorers = Object.values(Store.state.topScorers).sort((a,b) => b.goals - a.goals);
            if(scorers.length > 0) {
                const top = scorers[0];
                msg += `<br><br>⚽ <strong>Topscorer (Divisie ${top.division}):</strong> ${top.name} (${top.club}) — ${top.goals} goals`;
            }
        }
        Store.state.topScorers = {};

        // 3c. AI-selecties ontwikkelen: ouder worden, groeien/verzwakken, pensioen
        this.developAISquads();

        // 4. Overige resets
        Store.state.game.season++;
        Store.state.game.day = 1;
        Store.state.transferList = []; 
        Store.state.incomingOffers = [];
        Store.state.seasonResults = [];
        Store.state.results = [];

        // 4a. Spelerontwikkeling voor je eigen selectie: leeftijd, groei/verval, pensioen
        let retiring = [];
        let growthReport = [];
        Store.state.team.forEach(p => {
            p.age++;
            p.injuredWeeks = 0;
            p.suspended = 0;
            if(Math.random() < this.retirementChance(p.age)) {
                retiring.push(p);
                return;
            }
            const delta = this.developPlayer(p);
            if(delta > 0) growthReport.push({ name: p.name, delta });
        });

        if(retiring.length > 0) {
            const retiringIds = retiring.map(p => p.id);
            Store.state.team = Store.state.team.filter(p => !retiringIds.includes(p.id));
            if(Store.state.training && Store.state.training.selected) {
                Store.state.training.selected = Store.state.training.selected.filter(id => !retiringIds.includes(id));
            }
            msg += `<br><br>👋 <strong>Met pensioen:</strong><br>- ${retiring.map(p => `${p.name} (${p.age} jr)`).join("<br>- ")}`;
        }

        if(growthReport.length > 0) {
            growthReport.sort((a,b) => b.delta - a.delta);
            const top = growthReport.slice(0, 3);
            msg += `<br><br>📈 <strong>Grootste ontwikkeling:</strong><br>- ${top.map(g => `${g.name} (+${g.delta})`).join("<br>- ")}`;
        }

        // 4b. CONTRACTEN: elk seizoen telt af; spelers zonder contract vertrekken
        Store.state.team.forEach(p => p.contractYears--);
        const leaving = Store.state.team.filter(p => p.contractYears <= 0);
        if(leaving.length > 0) {
            const leavingIds = leaving.map(p => p.id);
            Store.state.team = Store.state.team.filter(p => p.contractYears > 0);
            if(Store.state.training && Store.state.training.selected) {
                Store.state.training.selected = Store.state.training.selected.filter(id => !leavingIds.includes(id));
            }
            msg += `<br><br>⚠️ <strong>Contract afgelopen — deze spelers vertrekken:</strong><br>- ${leaving.map(p => p.name).join("<br>- ")}`;
        }
        this.validateLineup();
        
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
