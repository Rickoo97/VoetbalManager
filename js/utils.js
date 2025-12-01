import { CONFIG } from './config.js';

export const UTILS = {
    rid: () => Math.random().toString(36).slice(2, 10),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    choice: (arr) => {
        if (!arr || arr.length === 0) return "Onbekend";
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    fmtMoney: (n) => `${CONFIG.currency} ${n.toLocaleString('nl-NL')}`,
    
    // Simpele fallback generator
    genName: () => {
        // Pakt gewoon een willekeurige naam uit de NL lijst als fallback
        // De echte logica zit nu in Engine.createPlayer
        const n = CONFIG.nations.NL; 
        return `${UTILS.choice(n.first)} ${UTILS.choice(n.last)}`;
    },

    genClubName: () => `${UTILS.choice(CONFIG.cities)} ${UTILS.choice(CONFIG.suffixes)}`,
    getLeagueName: (div) => div === 1 ? "Eredivisie" : (div === 2 ? "Keuken Kampioen Div" : `Divisie ${div}`),
    getLeagueShort: (div) => div === 1 ? "ERE" : (div === 2 ? "KKD" : `DIV ${div}`)
};