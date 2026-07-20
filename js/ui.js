import { Store } from './store.js';
import { Views } from './views.js';
import { Engine } from './engine.js';
import { UTILS } from './utils.js';

export const UI = {
    elements: {},
    modalQueue: [],
    modalOpen: false,
    
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
        if(t.closest('#btn-save')) { Store.save(true); return; }
        if(t.closest('#btn-reset')) { Store.reset(); return; }
        if(t.closest('#btn-theme-toggle')) { this.toggleTheme(); return; }
        if(t.closest('#btn-start')) { Store.startGame(document.getElementById("inp-name").value); return; }
        if(t.closest('#btn-scout')) { Engine.scoutYouth(); return; }

        // --- NAV VANUIT "MEER" MENU (mobiel) ---
        const navBtn = t.closest('[data-nav-tab]');
        if(navBtn) {
            Store.state.ui.currentTab = navBtn.dataset.navTab;
            const ov = t.closest('.modal-overlay');
            if(ov) this.closeModal(ov);
            this.render();
            return;
        }

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
        if(btn.classList.contains('btn-extend')) Engine.extendContract(btn.dataset.id);
    },

    // --- MODAL SYSTEEM (vervangt alert/confirm/prompt) ---
    // Modals worden in een wachtrij gezet zodat meerdere meldingen
    // (bv. contract verlopen + bekeruitslag) na elkaar getoond worden.

    _buildModal(cfg) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const content = document.createElement('div');
        content.className = 'modal-content';

        if(cfg.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `<h3 style="margin:0">${cfg.title}</h3>`;
            content.appendChild(header);
        }

        if(cfg.html) {
            const body = document.createElement('div');
            body.className = 'modal-body';
            body.innerHTML = cfg.html;
            content.appendChild(body);
        }

        let inputEl = null;
        if(cfg.input) {
            inputEl = document.createElement('input');
            inputEl.type = cfg.input.type || 'text';
            inputEl.value = cfg.input.value ?? '';
            inputEl.className = 'modal-input';
            content.appendChild(inputEl);
        }

        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        (cfg.buttons || [{ label: 'OK', class: 'primary' }]).forEach(b => {
            const btnEl = document.createElement('button');
            btnEl.className = b.class || 'secondary';
            btnEl.textContent = b.label;
            btnEl.onclick = (ev) => {
                ev.stopPropagation();
                this.closeModal(overlay);
                if(b.onClick) b.onClick(inputEl ? inputEl.value : undefined);
            };
            footer.appendChild(btnEl);
        });
        content.appendChild(footer);
        overlay.appendChild(content);

        if(inputEl) {
            // Enter = eerste primaire knop
            inputEl.addEventListener('keydown', (ev) => {
                if(ev.key === 'Enter') {
                    const primary = footer.querySelector('button.primary');
                    if(primary) primary.click();
                }
            });
        }

        return { overlay, inputEl };
    },

    _processModalQueue() {
        if(this.modalOpen) return;
        const next = this.modalQueue.shift();
        if(!next) return;
        this.modalOpen = true;
        const { overlay, inputEl } = this._buildModal(next);
        document.body.appendChild(overlay);
        if(inputEl) inputEl.focus();
    },

    closeModal(overlay) {
        overlay.remove();
        this.modalOpen = false;
        this._processModalQueue();
    },

    // Melding met 1 OK-knop
    alert(title, html, onClose) {
        this.modalQueue.push({ title, html, buttons: [{ label: 'OK', class: 'primary', onClick: onClose }] });
        this._processModalQueue();
    },

    // Ja/Nee vraag
    confirm(title, html, onYes, opts = {}) {
        this.modalQueue.push({ title, html, buttons: [
            { label: opts.noLabel || 'Annuleren', class: 'secondary' },
            { label: opts.yesLabel || 'Bevestigen', class: opts.danger ? 'danger' : 'primary', onClick: onYes }
        ]});
        this._processModalQueue();
    },

    // Invoer vragen (bv. transferbod)
    prompt(title, html, defaultValue, onSubmit) {
        this.modalQueue.push({ title, html, input: { type: 'number', value: defaultValue }, buttons: [
            { label: 'Annuleren', class: 'secondary' },
            { label: 'Bevestig', class: 'primary', onClick: (v) => onSubmit(v) }
        ]});
        this._processModalQueue();
    },

    // Modal zonder annuleer-optie (bv. game over)
    forcedModal(title, html, buttonLabel, onClick) {
        this.modalQueue.push({ title, html, buttons: [{ label: buttonLabel, class: 'danger', onClick }] });
        this._processModalQueue();
    },

    // "Meer" menu op mobiel: alle tabs in een grid
    showMoreMenu(items) {
        let grid = `<div class="more-menu-grid">`;
        items.forEach(x => {
            const active = Store.state.ui.currentTab === x.id ? ' active' : '';
            grid += `<button class="more-menu-item${active}" data-nav-tab="${x.id}"><span>${x.i}</span>${x.l}</button>`;
        });
        grid += `</div>`;
        this.modalQueue.push({ title: 'Menu', html: grid, buttons: [{ label: 'Sluiten', class: 'secondary' }] });
        this._processModalQueue();
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
        if(btn) btn.innerText = Store.state.ui.theme==='light' ? "☀️" : "🌙"; 
    },

    toast(msg) { 
        const t = document.getElementById("toast"); 
        if(!t) return;
        t.innerText = msg; 
        t.classList.add("show"); 
        // Reset timer om te voorkomen dat hij te snel verdwijnt bij meerdere kliks
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove("show"), 3000); 
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
            case 'training': cont.appendChild(Views.Training()); break;
            case 'transfers': cont.appendChild(Views.TransferMarket()); break;
            case 'youth': cont.appendChild(Views.YouthAcademy()); break;
            case 'tactics': cont.appendChild(Views.Tactics()); break;
            case 'league': cont.appendChild(Views.League()); break;
            case 'fixtures': cont.appendChild(Views.Fixtures()); break;
            case 'club': cont.appendChild(Views.Facilities()); break;
            case 'sponsors': cont.appendChild(Views.Sponsors()); break;
            case 'finance': cont.appendChild(Views.Finance()); break;
            case 'history': cont.appendChild(Views.History()); break;
            case 'news': cont.appendChild(Views.News()); break;
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
            {id:'training',i:'💪',l:'Training'}, 
            {id:'transfers',i:'💸',l:'Transfermarkt'}, 
            {id:'youth',i:'🎓',l:'Jeugd'},
            {id:'tactics',i:'📋',l:'Tactiek'}, 
            {id:'league',i:'🏆',l:'Competitie'}, 
            {id:'fixtures',i:'📅',l:'Programma'}, 
            {id:'club',i:'🏗️',l:'Faciliteiten'}, 
            {id:'sponsors',i:'🤝',l:'Sponsors'}, 
            {id:'finance',i:'📊',l:'Financiën'},
            {id:'history',i:'📜',l:'Historie'},
            {id:'news', i:'📰', l:'Nieuws'}
        ];

        // Voeg beker alleen toe als je divisie hoog genoeg is (Div 1, 2 of 3)
        if(Store.state.club.division <= 3) {
            L.push({id:'beker', i:'🏆', l:'KNVB Beker'});
        }

        // Op mobiel tonen we alleen deze 4 tabs + een "Meer" knop
        const primaryIds = ['dashboard', 'squad', 'transfers', 'league'];

        L.forEach(x => {
            const d = document.createElement('div'); 
            const isPrimary = primaryIds.includes(x.id);
            d.className = `nav-item ${isPrimary ? 'nav-primary' : 'nav-secondary'} ${Store.state.ui.currentTab===x.id?'active':''}`;
            d.innerHTML = `<span style="margin-right:8px">${x.i}</span> ${x.l}`; 
            d.onclick = () => { Store.state.ui.currentTab = x.id; this.render(); };
            nav.appendChild(d);
        });

        // "Meer" knop (alleen zichtbaar op mobiel via CSS)
        const more = document.createElement('div');
        const moreActive = !primaryIds.includes(Store.state.ui.currentTab) && Store.state.ui.currentTab !== 'welcome';
        more.className = `nav-item nav-more ${moreActive ? 'active' : ''}`;
        more.innerHTML = `<span style="margin-right:8px">☰</span> Meer`;
        more.onclick = () => this.showMoreMenu(L);
        nav.appendChild(more);
    },

    renderTopbar() {
        // Update stats bovenin
        const elBudget = document.getElementById("budget");
        const elName = document.getElementById("club-name");
        const elDiv = document.getElementById("club-division");
        const elMatch = document.getElementById("matchday");

        if(elName) {
            // Voeg badge toe aan de header
            const badge = UTILS.getClubBadge(Store.state.club.name, 24);
            elName.innerHTML = `<div style="display:flex; align-items:center; gap:8px">${badge} ${Store.state.club.name}</div>`;
        }
        if(elBudget) elBudget.innerText = UTILS.fmtMoney(Store.state.club.budget);
        if(elDiv) elDiv.innerText = UTILS.getLeagueShort(Store.state.club.division);
        
        let max = 0;
        if(Store.state.competitions[Store.state.club.division]) {
            max = (Store.state.competitions[Store.state.club.division].length-1)*2;
        }
        if(elMatch) elMatch.innerText = `${Store.state.game.day} / ${max}`;
    }
};
