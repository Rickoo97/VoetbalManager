import { CONFIG } from './config.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';

export const Store = {
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
                
                // 1. Merge de basis state
                this.state = { ...this.state, ...parsed };

                // NIEUW: Training state toevoegen aan bestaande saves
                if(!this.state.training) {
                    this.state.training = { selected: [], done: false };
                }

                // --- DATA MIGRATIE ---
                const upgradePlayer = (p) => {
                    // 1. Stats fix (uit vorige update)
                    if(p.att === undefined) {
                        p.att = p.ovr; p.def = p.ovr; p.spd = p.ovr;
                        if(["SP", "LB", "RB"].includes(p.pos)) { p.att += 5; p.def -= 5; }
                        if(["CV", "DM"].includes(p.pos)) { p.def += 5; p.att -= 5; }
                    }
                    // 2. NIEUW: Contract fix
                    // Geef bestaande spelers willekeurig tussen 10 en 40 weken contract
                    if(p.contract === undefined) {
                        p.contract = Math.floor(Math.random() * 30) + 10;
                    }
                };
                
                if(this.state.team) this.state.team.forEach(upgradePlayer);
                if(this.state.market) this.state.market.forEach(upgradePlayer);
                
                if(!this.state.history) this.state.history = []; // Maak historie lijst aan als die mist
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

                // 4. UI check: als we op 'welcome' staan maar wel een team hebben -> ga naar dashboard
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
        this.state.club.name = customName || "Mijn Club FC";
        this.state.club.budget = CONFIG.startBudget;
        this.state.club.facilities = { stadium: 1, training: 1, medical: 1 };
        this.state.club.tactic = "neutral";
        this.state.game.day = 1;
        this.state.game.season = 1;
        this.state.club.division = 5;
        this.state.ui.viewDivision = 5;
        this.state.ui.currentTab = 'dashboard';
        
        // Genereer nieuwe data via de Engine
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

    save() { 
        localStorage.setItem("ovm_save_v36", JSON.stringify(this.state)); 
        UI.toast("Spel opgeslagen"); 
    },
    
    reset() { 
        if(confirm("Weet je zeker dat je opnieuw wilt beginnen? Alle voortgang gaat verloren.")){ 
            localStorage.removeItem("ovm_save_v36"); 
            location.reload(); 
        } 
    }
};