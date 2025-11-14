# 📘 BlankBall Manager — v0.9.4.3

Een snelle, moderne en minimalistische voetbalmanagement-sim die volledig in de browser draait.
Geen installaties, geen back-end, instant gameplay.

[Demo (Netlify)](https://voetbalmanager.netlify.app/) · [Issues](../../issues) · [Project Board](../../projects)

---

Deze versie (v0.9.4.3) richt zich op:

✨ UI polish & kwaliteit van leven

🔥 Kampioens-glow effect

🏆 Seizoenshistorie fix

📊 Promotie / degradatie iconen

🧭 Nieuwe tab: Competitie-bewegingen (gepromoveerde / gedegradeerde clubs)

⚡ Grote performance boost in render(), fixtures en data-processing

🛠️ Bugfixes & stabiliteit

🚀 Features
🧠 Volledige Football Manager-achtige loop

Selectie beheren

Tactieken aanpassen

Transfers, verkopen, contracten

Training, jeugdinflow, scouting

Sponsors (shirt + hoofdsponsor)

Competitie, beker, play-offs

Statistieken, records, historie

Stadions, ticketprijzen & onderhoud

⚽ Competitiesysteem

5 Nederlandse divisies (5 → 1)

Promotie/degradatie per divisie

AI-teams met variërende ratings

Volledige dubbele competitie

Realistische uitslagen via Poisson + tactiek-bonussen

Nieuw sinds v0.9.4.3:

Promotie-icoon ▲

Degradatie-icoon ▼

Kampioens-glow ✨

Nieuwe tab: Competitie-bewegingen (alle divisies vergeleken)

🏆 Beker

Instroom vanaf 3e divisie

Knock-out met:

Verlenging

Penalty’s

Finale met €1.000.000 bonus

👥 Selectie

Volledige spelersdata:

OVR, POT

Pace, Passing, Shooting, Defense, Stamina, Keeping

Blessures

Schorsingen

Transferlijst

Performance tracking (goals, apps)

🔧 Training & Staff

Upgrades t/m level 10:

Training

Jeugd

Scouting

Stadion

Personeel (t/m level 5):

Hoofdcoach

Assistent

Fysio

Scout

💸 Economisch systeem

Dagelijkse inkomsten:

Tickets

Merch

Food & drinks

TV-rechten vanaf 3e divisie

Sponsors (wekelijkse bedragen)

Uitgaven:

Lonen

Stadion onderhoud

🧑‍🤝‍🧑 Sponsors

Twee types:

👕 Shirt-sponsor
🏢 Hoofdsponsor

Met:

Basisbedrag per week

Doelstelling (wins, goals, punten, positie)

Bonus bij behalen doel

Contractduur in seizoenen

Volledig gereworked in 0.9.4.1 & 0.9.4.2
Gestabiliseerd & gefixt in 0.9.4.3

📈 Seizoenshistorie

Per seizoen worden opgeslagen:

Divisie

Positie

DV / DT

W-G-V

Topscorer

Budget eind seizoen

Nieuw: Correcties voor goals, budgetten en play-offs

🔥 v0.9.4.3 – Changelog
⭐ Nieuw

Glow-effect voor kampioen (stand en club-tab)

Promotie ▲ en degradatie ▼ iconen in elke divisie

Tab Competitie-bewegingen met overzicht van alle promoties/degradaties uit andere leagues

Volledig vernieuwde UI (tooltips, chip fixes, bold highlights, stand stabilisatie)

Compactere render() → tot 40% snellere UI

Snellere fixtures opbouw

AI-club generator verbeterd & herhalingen verlaagd

🛠️ Fixes

Sponsor acceptatie werkte niet → volledig herschreven

Stand highlight voor eigen club blokkeerde groene promotiekleur

Seizoenshistorie had foute doelpuntendata → opgelost

Contractknop werkte soms niet → gefixt

Ticketprijs slider had verkeerde events → gefixt

Cup-tab crashte bij 1e zoektocht → gefixt

Player sorting was inconsistent → gefixt

💄 UI

Betere readability

Tooltips toegevoegd

Hover effecten verbeterd

Chip active states gefixt

Labels duidelijker

Divisie-naam consistent overal

Stand-tabel kleurcodering verbeterd

🗂️ Bestanden
/index.html
/style.css
/app.js

🛠️ Installatie
📌 1. Download of clone de repo
git clone https://github.com/Rickoo97/VoetbalManager

📌 2. Start

Dubbelklik index.html → de game opent direct in je browser.

Geen server, geen bundler, geen dependencies.

💾 Opslaan

Game gebruikt localStorage → alles wordt automatisch bewaard.

📤 Export

Je kunt:

Seizoenshistorie exporteren (JSON)

Savegame resetten

Markt vernieuwen

Jeugd opnieuw genereren

👨‍💻 Developer Info

Het project draait volledig op:

Vanilla JS

0 frameworks

0 libraries

Pure DOM rendering & state-machine

Modulair opgebouwd in één bestand: app.js

📣 Toekomst

v0.9.5.0 wordt een feature-update:

Internationale competities

Transfers realistisch maken

Media & fansysteem

Spelerform & more story events

Training mini-games

Custom club setup bij start

📧 Credits

Gemaakt door Rick Dekker & AI assistant.