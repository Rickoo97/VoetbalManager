# BlankBall Manager ⚽
*Een lichte voetbal-management game die volledig in de browser draait — geen backend nodig.*

[Demo (Netlify)](https://voetbalmanager.netlify.app/) · [Issues](../../issues) · [Project Board](../../projects)

---

## 🚀 Wat is nieuw in v0.9.3
- **Sponsors gesplitst**:
  - **Shirt-sponsor** *(1–3 seizoenen)* en **Hoofdsponsor** *(2–4 seizoenen)*.
  - Beide betalen **wekelijkse basis** + **seizoensbonus** bij het halen van de doelstelling.
  - Contractduur telt af aan het einde van een seizoen.
- **TV-inkomsten** vanaf **3e divisie**: kans dat je wedstrijd wordt uitgezonden → extra geld (thuis > uit). Terug te zien in het **financieel popover**.
- **Opstelling UX**:
  - **Auto beste XI** vult nu óók **automatisch de bank (6)** met de volgende beste fitte spelers.
  - **Dubbelklik** op speler: snelle toevoeging naar XI (of bank indien XI vol).
- Alles van v0.9.2 blijft natuurlijk beschikbaar (Club-statistieken, Prijzenkast, Stand-kleuren, Beker ET+pens, sim-opties, etc.).

---

## 🎯 Korte handleiding Sponsors
Ga naar **Sponsors**:
- Kies apart een **Shirt-sponsor** en een **Hoofdsponsor** uit de aanbiedingen.
- Je ziet **basis/week**, **bonus**, **doelstelling** en **contractduur**.
- Aan het einde van het seizoen:
  - Bonus wordt uitgekeerd als doel gehaald.
  - Contractduur **-1**; bij 0 loopt het contract af.
- Wekelijks ontvang je beide sponsorbedragen. Dit zie je in het financieel popover.

---

## 📺 TV-gelden
- Beschikbaar vanaf **3e divisie**.
- Kans op uitzending:
  - 3e divisie: ~20% → **€50k thuis / €25k uit**
  - Hoofdklasse: ~35% → **€120k / €60k**
  - Kampioen Divisie: ~50% → **€300k / €150k**
- TV-geld wordt getoond in de popover van de laatste speeldag.

---

## 🧠 Opstelling tips
- **Dubbelklik** op een speler om hem snel toe te voegen (eerst XI, daarna bank).
- **Auto (beste XI + bank)** zet de ideale XI én vult de bank met 6 beste fitte reserves.
- Drag & drop werkt zoals voorheen (grotere dropzones op het veld/bank).

---

## ☁️ Deploy
Staat al klaar om statisch te hosten (GitHub Pages / Netlify).  
**Netlify**: geen build command; **Publish directory** is `/`.

---

## 🧭 Roadmap
- Eventlog per minuut (goals/kaarten/wissels).
- Ticketprijs instelbaar per thuisduel (vraag-elasticiteit).
- PWA (offline speelbaar) + mobile drag & drop optimalisaties.
- Contractclausules (release/promotiebonus).

## 🗂️ Projectstructuur