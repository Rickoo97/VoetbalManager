import { Store } from './store.js';
import { Views } from './views.js';
import { Engine } from './engine.js';
import { UTILS } from './utils.js';

export const UI = {
    elements: {},
    
    init() {
        this.elements.app = document.getElementById("view");
        // We luisteren op de body, zodat we alle dynamische knoppen ook vangen
        document.body.addEventListener('click', (e) => this.handleClicks(e));
        this.render();
    },

    handleClicks(e) {
        const t = e.target;

        // --- GLOBAL BUTTONS (ID Check met closest voor veiligheid) ---
        if(t.closest('#btn-continue')) { 
            if(Store.state.ui.currentTab !== 'welcome') Engine.processMatchday(); 
            return;
        }
        if(t.closest('#btn-save')) { Store.save(); return; }
        if(t.closest('#btn-reset')) { Store.reset(); return; }
        if(t.closest('#btn-theme-toggle')) { this.toggleTheme(); return; }
        if(t.closest('#btn-start')) { Store.startGame(document.getElementById("inp-name").value); return; }
        if(t.closest('#btn-scout')) { Engine.scoutYouth(); return; }

        // --- DYNAMISCHE BUTTONS (Class Check met closest) ---
        // We zoeken naar het dichtstbijzijnde <button> element
        const btn = t.closest('button');
        
        // Als er niet op een knop is geklikt, stoppen we hier
        if (!btn) return;

        // Nu kijken we naar de classes op de knop zelf
        if(btn.classList.contains('btn-list')) Engine.toggleTransferList(btn.dataset.id);
        if(btn.classList.contains('btn-bid')) Engine.placeBid(btn.dataset.id);
        if(btn.classList.contains('btn-acc')) Engine.acceptOffer(btn.dataset.id);
        if(btn.classList.contains('btn-rej')) Engine.rejectOffer(btn.dataset.id);
        if(btn.classList.contains('btn-sign')) Engine.promoteYouth(btn.dataset.id);
    },

    toggleTheme() { 
        Store.state.ui.theme = (Store.state.ui.theme==='dark'?'light':'dark'); 
        this.applyTheme(); 
        Store.save(); 
        this.updateThemeBtn(); 
    },

    applyTheme() { 
        // Schakelt de CSS class op de body in/uit
        document.body.classList.toggle('light-mode', Store.state.ui.theme==='light'); 
    },

    updateThemeBtn() { 
        const btn = document.getElementById("btn-theme-toggle");
        if(btn) btn.innerText = Store.state.ui.theme==='light' ? "☀️ Licht" : "🌙 Donker"; 
    },

    toast(msg) { 
        const t = document.getElementById("toast"); 
        if(!t) return;
        t.innerText = msg; 
        t.classList.add("show"); 
        // Reset timer om te voorkomen dat hij te snel verdwijnt bij meerdere kliks
        setTimeout(() => t.classList.remove("show"), 3000); 
    },

    render() {
        this.renderNav(); 
        this.updateThemeBtn();
        
        const tab = Store.state.ui.currentTab;
        const cont = this.elements.app;

        // Toggle sidebar en header visibility op basis van of je ingelogd bent
        const sidebar = document.querySelector(".sidebar");
        const header = document.querySelector(".top-header");

        if(tab === 'welcome') { 
            if(sidebar) sidebar.style.display='none'; 
            if(header) header.style.display='none'; 
        } else { 
            if(sidebar) sidebar.style.display='flex'; 
            if(header) header.style.display='flex'; 
            this.renderTopbar(); 
        }

        // Render de juiste View
        cont.innerHTML = "";
        switch(tab) {
            case 'welcome': cont.appendChild(Views.Welcome()); break;
            case 'dashboard': cont.appendChild(Views.Dashboard()); break;
            case 'squad': cont.appendChild(Views.Squad()); break;
            case 'transfers': cont.appendChild(Views.TransferMarket()); break;
            case 'youth': cont.appendChild(Views.YouthAcademy()); break;
            case 'tactics': cont.appendChild(Views.Tactics()); break;
            case 'league': cont.appendChild(Views.League()); break;
            case 'fixtures': cont.appendChild(Views.Fixtures()); break;
            case 'club': cont.appendChild(Views.Facilities()); break;
            case 'sponsors': cont.appendChild(Views.Sponsors()); break;
            case 'finance': cont.appendChild(Views.Finance()); break;
            case 'beker': cont.appendChild(Views.Cup()); break;
            default: cont.innerHTML = "<p>Pagina niet gevonden</p>";
        }
    },

    renderNav() {
        const nav = document.getElementById("main-nav"); 
        if(!nav) return;
        nav.innerHTML = "";
        
        const L = [
            {id:'dashboard',i:'🏠',l:'Overzicht'}, 
            {id:'squad',i:'👥',l:'Selectie'}, 
            {id:'transfers',i:'💸',l:'Transfermarkt'}, 
            {id:'youth',i:'🎓',l:'Jeugd'},
            {id:'tactics',i:'📋',l:'Tactiek'}, 
            {id:'league',i:'🏆',l:'Competitie'}, 
            {id:'fixtures',i:'📅',l:'Programma'}, 
            {id:'club',i:'🏗️',l:'Faciliteiten'}, 
            {id:'sponsors',i:'🤝',l:'Sponsors'}, 
            {id:'finance',i:'📊',l:'Financiën'}
        ];

        // Voeg beker alleen toe als je divisie hoog genoeg is (Div 1, 2 of 3)
        if(Store.state.club.division <= 3) {
            L.push({id:'beker', i:'🏆', l:'KNVB Beker'});
        }

        L.forEach(x => {
            const d = document.createElement('div'); 
            d.className = `nav-item ${Store.state.ui.currentTab===x.id?'active':''}`;
            d.innerHTML = `<span style="margin-right:8px">${x.i}</span> ${x.l}`; 
            d.onclick = () => { Store.state.ui.currentTab = x.id; this.render(); };
            nav.appendChild(d);
        });
    },

    renderTopbar() {
        // Update stats bovenin
        const elBudget = document.getElementById("budget");
        const elName = document.getElementById("club-name");
        const elDiv = document.getElementById("club-division");
        const elMatch = document.getElementById("matchday");

        if(elBudget) elBudget.innerText = UTILS.fmtMoney(Store.state.club.budget);
        if(elName) elName.innerText = Store.state.club.name;
        if(elDiv) elDiv.innerText = UTILS.getLeagueShort(Store.state.club.division);
        
        let max = 0;
        if(Store.state.competitions[Store.state.club.division]) {
            max = (Store.state.competitions[Store.state.club.division].length-1)*2;
        }
        if(elMatch) elMatch.innerText = `${Store.state.game.day} / ${max}`;
    }
};