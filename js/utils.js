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
    getLeagueShort: (div) => div === 1 ? "ERE" : (div === 2 ? "KKD" : `DIV ${div}`),

    // --- NIEUW: VISUELE GENERATORS ---

    // 1. Helper: Zet string om naar getal (voor consistente kleuren)
    hashString: (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash);
    },

    // 2. Club Badge Generator (HTML String)
    getClubBadge: (name, size = 30) => {
        const hash = UTILS.hashString(name);
        // Palette van 'echte' voetbal kleuren (Rood, Blauw, Groen, Geel, Zwart, Paars, Oranje, Wit, Lichtblauw)
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#1f2937', '#a855f7', '#f97316', '#f3f4f6', '#06b6d4'];
        
        const mainColor = colors[hash % colors.length];
        const secColor = colors[(hash + 1) % colors.length];
        const letter = name.substring(0, 1).toUpperCase();

        return `
        <div class="club-badge" style="
            width:${size}px; height:${size}px; 
            background: linear-gradient(135deg, ${mainColor} 50%, ${secColor} 50%);
            font-size:${size * 0.6}px;">
            ${letter}
        </div>`;
    },

    // 3. Speler Face Generator (Simpele Avatar)
    getPlayerFace: (id, size = 32) => {
        const hash = UTILS.hashString(id);
        const skinTones = ['#f5d0b0', '#e0ac69', '#8d5524', '#c68642', '#f0c7a0'];
        const skin = skinTones[hash % skinTones.length];
        
        return `
        <div class="player-face" style="width:${size}px; height:${size}px; background:${skin}">
            <div class="player-eyes"></div>
            <div class="player-mouth"></div>
        </div>`;
    }
};