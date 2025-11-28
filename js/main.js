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