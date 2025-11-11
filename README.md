# BlankBall Manager ⚽
*Een lichte voetbal-management game die volledig in de browser draait — geen backend nodig.*

[Demo (Netlify)](https://voetbalmanager.netlify.app/) · [Issues](../../issues) · [Project Board](../../projects)

---

## 🚀 Wat is nieuw in v0.9.2
- **Club-tab gerepareerd** en uitgebreid met:
  - **Statistieken (all-time)**: seizoenen, W–G–V, GF/GA, inkomsten, lonen, prijzengeld.
  - **Prijzenkast**: beker- en landstitels worden automatisch toegevoegd per seizoen.
  - **Beste klasseringen per divisie**.
- **Stand-kleuren**: promotie/play-off/degradatie zones per divisie.
- **Beker**: bij gelijkspel **verlenging + penalty’s** (geen coinflip).
- **Simuleren**: keuze voor *winterstop*, *volledig seizoen* of *tot volgende beker-actie*.
- **Financieel popover**: klik op **Budget**-kaart voor inkomsten/uitgaven van de laatste speeldag.
- **Competitiestructuur**:
  - **Kampioen Divisie (D1)** heeft **18 teams**.
  - **Hoofdklasse (D2)**: #1–2 promotie direct, **#3–6** spelen **play-offs** tegen **#16 van D1**.

> Zie ook v0.9.1: sorteren in tabellen, autosubs 60–75’, etc.

---

## 🎯 Features (samenvatting)
- **Competitie**: start in **5e divisie** en klim via 4e, 3e, **Hoofdklasse**, **Kampioen Divisie**.
- **Formaties & speelstijl**: 4-3-3, 4-4-2, 3-5-2 + *Zeer verdedigend*, *Balbezit*, *Zeer aanvallend*.
- **Beker** (knock-out met loting) **vanaf 3e divisie**; ET+pens; prijzengeld per ronde.
- **Contractonderhandelingen** (loon + duur), kans op acceptatie o.b.v. aanbod/divisie.
- **Transfers**: markt, transferlijst, AI-biedingen.
- **Blessures & schorsingen**, **Autosubs** (max 5), **Jeugdinstroom**, **Training**.
- **Sponsors** met doelstellingen + wekelijkse inkomsten en bonus.
- **Faciliteiten** t/m **niveau 10** (stadion-cap per divisie; meer inkomsten op hogere niveaus).
- **Financiën**: lonen, ticket/merch/food, prijzengeld, popover-overzicht.
- **Saves**: lokaal via `localStorage` + resetknop.

---

## 🧭 Roadmap
- Eventlog per minuut (goals/kaarten/wissels).
- Ticketprijs instelbaar per thuisduel (vraag-elasticiteit).
- PWA (offline speelbaar) + mobile drag & drop optimalisaties.
- Contractclausules (release/promotiebonus).

## 🗂️ Projectstructuur