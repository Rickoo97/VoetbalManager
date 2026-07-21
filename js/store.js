import { CONFIG } from './config.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';

export const Store = {
    state: {
        game: { day: 1, season: 1, over: false },
        club: { 
            id: "player_club", name: "Mijn Club", budget: CONFIG.startBudget, division: 5,
            facilities: { stadium: 1, training: 1, medical: 1 },
            tactic: "neutral",
            sponsor: null, sponsorOffers: []
        },
        board: { 
        confidence: 80,       // Start vertrouwen
        objective: "Top 5",   // Wordt overschreven bij start seizoen
        objectiveRank: 5      // De plek die je moet halen
    },
        cup: { active: false, inTournament: false, nextRound: 0, history: [] },
        ui: { currentTab: 'welcome', viewDivision: 5, theme: 'dark' },
        finance: { lastWeek: { income: 0, expenses: 0, profit: 0, breakdown: [] } },

        news: [],
        training: { selected: [], done: false },
        history: [],
        schedules: {},       // Wedstrijdschema per divisie (round-robin)
        seasonResults: [],   // Alle gespeelde wedstrijden van JOUW club dit seizoen
        lineup: null,        // Opstelling: { gk, def: [], mid: [], att: [] }

        team: [], market: [], transferList: [], incomingOffers: [], youthAcademy: [],
        competitions: {}, results: []
    },

    init() {
        const saved = localStorage.getItem("ovm_save_v36");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                
                // 1. Merge de basis state
                this.state = { ...this.state, ...parsed };

                // Zorg dat nieuwe state-onderdelen bestaan in oude saves
                if(!this.state.training) this.state.training = { selected: [], done: false };
                if(!Array.isArray(this.state.news)) this.state.news = [];
                if(!Array.isArray(this.state.history)) this.state.history = [];
                if(!Array.isArray(this.state.seasonResults)) this.state.seasonResults = [];
                if(this.state.game.over === undefined) this.state.game.over = false;

                // --- DATA MIGRATIE ---
                const upgradePlayer = (p) => {
                    // 1. Stats fix (uit vorige update)
                    if(p.att === undefined) {
                        p.att = p.ovr; p.def = p.ovr; p.spd = p.ovr;
                        if(["SP", "LB", "RB"].includes(p.pos)) { p.att += 5; p.def -= 5; }
                        if(["CV", "DM"].includes(p.pos)) { p.def += 5; p.att -= 5; }
                    }
                    // 2. Week-contracten omzetten naar seizoenscontracten
                    if(p.contractYears === undefined) {
                        const weeks = p.contract !== undefined ? p.contract : 34;
                        p.contractYears = Math.max(1, Math.min(4, Math.ceil(weeks / 34)));
                        delete p.contract;
                    }
                    // 3. Nieuw salaris-model
                    p.wage = Engine.calcWage(p);
                    // 4. Blessure/schorsing velden
                    if(p.injuredWeeks === undefined) p.injuredWeeks = 0;
                    if(p.suspended === undefined) p.suspended = 0;
                };
                
                if(this.state.team) this.state.team.forEach(upgradePlayer);
                if(this.state.market) this.state.market.forEach(upgradePlayer);
                if(this.state.youthAcademy) this.state.youthAcademy.forEach(upgradePlayer);

                // 5. Keepers: oude saves hebben geen 'K' positie.
                //    Maak van de 2 minst aanvallende verdedigers keepers.
                if(this.state.team && this.state.team.length > 0 && !this.state.team.some(p => p.pos === "K")) {
                    const candidates = [...this.state.team]
                        .filter(p => ["CV", "DM", "VVM", "VL", "VR"].includes(p.pos))
                        .sort((a, b) => a.att - b.att);
                    candidates.slice(0, 2).forEach(p => { p.pos = "K"; });
                }
                // --------------------------------------------
                
                // 2. Merge complexe objecten apart (zodat nieuwe features niet overschreven worden)
                if(parsed.club) {
                    this.state.club = { ...this.state.club, ...parsed.club };
                    // Zorg dat facilities behouden blijven, maar nieuwe facilities ook werken
                    if(parsed.club.facilities) {
                        this.state.club.facilities = { ...this.state.club.facilities, ...parsed.club.facilities };
                    }
                }

                // 3. Cup check (voor oude saves die nog geen cup hadden)
                if(!this.state.cup) {
                    this.state.cup = { active: false, inTournament: false, nextRound: 0, history: [] };
                }

                // 4. Schema check: oude saves hebben nog geen wedstrijdschema
                const hasComps = this.state.competitions && this.state.competitions[1];
                const hasSchedule = this.state.schedules && this.state.schedules[1];
                if(hasComps && !hasSchedule) {
                    Engine.generateAllSchedules();
                }

                // 4b. Opstelling: genereer automatisch als die nog niet bestaat
                if(this.state.team && this.state.team.length > 0 && !this.state.lineup) {
                    Engine.autoPickLineup();
                }

                // 5. UI check: als we op 'welcome' staan maar wel een team hebben -> ga naar dashboard
                if(this.state.ui.currentTab === 'welcome' && this.state.team && this.state.team.length > 0) {
                    this.state.ui.currentTab = 'dashboard';
                }

            } catch (e) { 
                console.error("Savegame corrupt of verouderd:", e);
                this.state.ui.currentTab = 'welcome'; 
            }
        } else { 
            this.state.ui.currentTab = 'welcome'; 
        }
        
        // Pas het thema direct toe bij het laden
        UI.applyTheme();
    },

    startGame(customName) {
        // Sanitize: naam wordt in HTML gebruikt, dus geen speciale tekens
        const cleanName = (customName || "").replace(/[<>&"']/g, "").trim().slice(0, 30);
        this.state.club.name = cleanName || "Mijn Club FC";
        this.state.club.budget = CONFIG.startBudget;
        this.state.club.facilities = { stadium: 1, training: 1, medical: 1 };
        this.state.club.tactic = "neutral";
        this.state.game.day = 1;
        this.state.game.season = 1;
        this.state.game.over = false;
        this.state.club.division = 5;
        this.state.ui.viewDivision = 5;
        this.state.ui.currentTab = 'dashboard';
        
        // Genereer nieuwe data via de Engine
        this.state.team = Engine.generateSquad(18);
        this.state.market = Engine.generateMarket(15);
        this.state.transferList = [];
        this.state.incomingOffers = [];
        this.state.youthAcademy = [];
        this.state.training = { selected: [], done: false };
        this.state.news = [];
        this.state.history = [];
        this.state.seasonResults = [];
        this.state.results = [];
        
        this.state.competitions = Engine.generateAllDivisions();
        Engine.generateAllSchedules();
        Engine.autoPickLineup();
        Engine.generateSponsorOffers();
        Engine.initCupSeason();

        Engine.determineObjective()
        this.save();
        UI.render(); 
    },

    save(showToast = false) { 
        localStorage.setItem("ovm_save_v36", JSON.stringify(this.state)); 
        if(showToast) UI.toast("Spel opgeslagen"); 
    },
    
    wipe() {
        localStorage.removeItem("ovm_save_v36");
        location.reload();
    },

    // Save als tekst-code (voor overzetten naar een ander apparaat)
    exportSave() {
        return btoa(unescape(encodeURIComponent(JSON.stringify(this.state))));
    },

    importSave(code) {
        try {
            const json = decodeURIComponent(escape(atob((code || "").trim())));
            const parsed = JSON.parse(json);
            if(!parsed.club || !parsed.team) throw new Error("invalid save");
            localStorage.setItem("ovm_save_v36", json);
            location.reload();
        } catch(e) {
            UI.toast("❌ Ongeldige save-code!");
        }
    },

    reset() { 
        UI.confirm(
            "Opnieuw beginnen?",
            "Weet je zeker dat je opnieuw wilt beginnen?<br>Alle voortgang gaat verloren.",
            () => this.wipe(),
            { danger: true, yesLabel: "Ja, reset alles" }
        );
    }
};
