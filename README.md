# BlankBall Manager ⚽
*Een lichte voetbal-management game die volledig in de browser draait — geen backend nodig.*

[Demo (Netlify)](https://voetbalmanager.netlify.app/) · [Issues](../../issues) · [Project Board](../../projects)

---

## 🔥 Wat is nieuw in v0.9.4
### T2 — Staf & Trainingsschema’s
- Nieuwe **staf** (lvl 1–5): **Hoofdcoach**, **Assistent**, **Fysio**, **Scout**.
- Kies een **trainingsschema**: *Herstel, Techniek, Tactiek, Intensief*.
- Effecten:
  - Coach ↑ trainingsgroei.
  - Assistent geeft mini-matchboost.
  - Fysio ↓ blessurekans en duur.
  - Scout ↑ kwaliteit spelers op de markt & jeugdinstroom.

### T5 — Ticketprijs & Onderhoud
- Stel je **ticketprijs** (8–40 euro) in via **Faciliteiten → Stadion**.
- Vraag reageert op prijs & divisie. Te duur = lagere bezetting.
- **Onderhoudskosten** stadion per speeldag (groeien met stadium level).
- Financieel popover toont nu ook **Publiek** en **Onderhoud**.

### T6 — Seizoenshistorie & Records
- **Seizoenshistorie** (seizoen, divisie, positie, DV/DT, W-G-V, topscorer, budget eind).
- **Clubrecords**: hoogste opkomst, grootste overwinning, langste winreeks.
- **Exporteer** je geschiedenis naar JSON vanuit het **Club**-tab.

### Bugfix
- **Contract**-knop werkte niet; nu gefixt (exposed als `app.negotiate`).

---

## ▶️ Spelen
Open `index.html` in je browser (of host statisch via GitHub Pages/Netlify).

---

## 🧩 Tips
- Zet na promotie je **ticketprijs** iets omhoog en upgrade langzaam je **stadion**. Let op onderhoudskosten.
- **Herstel**-schema tussen drukke weken verkleint blessurerisico’s.
- **Scout** upgraden is top voor goede markt/jeugd.

---

## 🧭 Roadmap
- Eventlog per minuut (goals/kaarten/wissels).
- PWA (offline speelbaar) + mobile drag & drop optimalisaties.
- Contractclausules (release/promotiebonus).

## 🗂️ Projectstructuur