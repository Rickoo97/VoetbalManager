import { Store } from './store.js';
import { UI } from './ui.js';
import { Engine } from './engine.js'; // Nodig om hem op window te zetten

// 1. Maak Engine globaal beschikbaar (voor de onclick="" in HTML strings)
window.Engine = Engine;
window.Store = Store; // Handig voor debugging in console
window.UI = UI;

// 2. Start de applicatie
document.addEventListener('DOMContentLoaded', () => {
    Store.init();
    UI.init();
});

// 3. PWA: service worker registreren (offline spelen + installeerbaar)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Service worker registratie mislukt:', err);
        });
    });
}