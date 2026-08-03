import { Store } from './store.js';
import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Engine } from './engine.js'; 

export const Views = {
    Welcome() {
        const d=document.createElement('div'); d.className="card"; d.style.textAlign="center"; d.style.maxWidth="480px"; d.style.margin="60px auto";
        const demoLogo = UTILS.getClubBadge("FC Start", 60);
        const defaultDiff = CONFIG.defaultDifficulty;
        let diffCards = "";
        Object.values(CONFIG.difficulties).forEach(diff => {
            const selected = diff.id === defaultDiff ? " selected" : "";
            const badge = diff.id === "hard" ? `<span class="diff-badge">Aanbevolen</span>` : "";
            diffCards += `
                <button type="button" class="diff-card${selected}" data-diff="${diff.id}" aria-pressed="${diff.id === defaultDiff}">
                    ${badge}
                    <strong>${diff.label}</strong>
                    <span class="muted">${diff.desc}</span>
                    <span class="diff-meta">Startbudget ${UTILS.fmtMoney(diff.startBudget)}</span>
                </button>`;
        });
        d.innerHTML=`${demoLogo}<h1 style="margin-top:15px">${CONFIG.gameTitle}</h1><p class="muted">Start je carrière.</p>
            <div style="margin:24px 0 8px;text-align:left">
                <label style="display:block;margin-bottom:10px">Clubnaam</label>
                <input type="text" id="inp-name" value="FC Breda" style="padding:10px;width:100%;border-radius:8px;border:1px solid #444;background:var(--bg-body);color:var(--text-main)">
            </div>
            <div style="margin:20px 0;text-align:left">
                <label style="display:block;margin-bottom:10px">Moeilijkheid</label>
                <div class="diff-grid" id="diff-picker">${diffCards}</div>
            </div>
            <button class="primary" id="btn-start" style="width:100%">Start Carrière</button>`;
        return d;
    },

    JobMarket() {
        const d = document.createElement('div');
        const m = Store.state.manager || { reputation: 50, unemployed: false, browsing: false, jobOffers: [] };
        const repPct = m.reputation;
        let repColor = "#ef4444";
        if(repPct >= 40) repColor = "#facc15";
        if(repPct >= 60) repColor = "#22c55e";
        if(repPct >= 80) repColor = "#a855f7";

        let header = m.unemployed
            ? `<h2>📋 Vacatures</h2><div class="card" style="background:rgba(239,68,68,0.1); border-color:#ef4444">😤 Je bent ontslagen. Kies hieronder je volgende club om je carrière voort te zetten.</div>`
            : `<h2>📋 Vacatures</h2><div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e">Je oriënteert je op een nieuwe uitdaging. Je huidige baan blijft van jou totdat je een andere club kiest.</div>`;

        const repCard = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
                <strong>Reputatie</strong>
                <span style="font-size:12px; color:${repColor}; font-weight:bold">${Engine.reputationLabel(m.reputation)}</span>
            </div>
            <div style="background:#334155; height:10px; border-radius:5px; overflow:hidden">
                <div style="background:${repColor}; width:${repPct}%; height:100%"></div>
            </div>
            <div style="text-align:right; font-size:11px; margin-top:3px; color:${repColor}">${m.reputation}/100</div>
            <p class="muted" style="font-size:12px; margin-top:10px; margin-bottom:0">Hogere reputatie = vacatures bij clubs in hogere divisies. Promoties, titels en bekers verhogen je reputatie; degradaties en ontslagen verlagen hem.</p>
        </div>`;

        let offersHtml = "";
        const offers = m.jobOffers || [];
        if(offers.length === 0) {
            offersHtml = `<div class="card" style="text-align:center; padding:30px" class="muted">Geen vacatures beschikbaar. Probeer het later opnieuw.</div>`;
        } else {
            offersHtml = `<h3>Openstaande vacatures</h3>`;
            offers.forEach(o => {
                const badge = UTILS.getClubBadge(o.name, 40);
                const budget = Engine.jobStartBudget(o.division);
                offersHtml += `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                    <div style="display:flex; align-items:center; gap:12px">
                        ${badge}
                        <div>
                            <strong>${o.name}</strong><br>
                            <span class="muted" style="font-size:12px">${UTILS.getLeagueName(o.division)} • Startbudget ${UTILS.fmtMoney(budget)}</span>
                        </div>
                    </div>
                    <button class="primary btn-apply-job" data-id="${o.id}" data-club-name="${o.name}">Solliciteer</button>
                </div>`;
            });
        }

        let footer = "";
        if(!m.unemployed) {
            footer = `<button class="secondary" id="btn-cancel-browsing" style="margin-top:10px">↩️ Terug naar mijn huidige club</button>`;
        }

        d.innerHTML = header + repCard + offersHtml + footer;
        return d;
    },

    Dashboard() {
        const d=document.createElement('div');
        
        // 1. Meldingen
        const offersLen = Store.state.incomingOffers.length;
        let offersHtml = offersLen > 0 ? `<div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e"><strong>🚨 Je hebt ${offersLen} bod(en)!</strong><br><span style="font-size:13px">Ga naar Transfermarkt.</span></div>` : "";

        const pendingCount = (Store.state.pendingSignings || []).length + (Store.state.pendingSales || []).length;
        let pendingHtml = "";
        if(pendingCount > 0 && !Engine.isTransferWindowOpen()) {
            pendingHtml = `<div class="card" style="background:rgba(251,191,36,0.1); border-color:#fbbf24">⏳ <strong>${pendingCount} lopende transfer(s)</strong><br><span style="font-size:13px">Worden officieel zodra ${Engine.nextWindowLabel()} begint.</span></div>`;
        }
        
        const shirtSp = Store.state.club.shirtSponsor;
        const stadiumSp = Store.state.club.stadiumSponsor;
        let sponsorHtml = "";
        if(!shirtSp && !stadiumSp) {
            sponsorHtml = `<div class="card" style="background:rgba(239, 68, 68, 0.1); border-color:#ef4444">⚠️ <strong>Geen sponsors!</strong> Ga snel naar Sponsors om deals te sluiten.</div>`;
        } else {
            let lines = [];
            if(shirtSp) lines.push(`👕 Shirtsponsor: <strong>${shirtSp.name}</strong> (+${UTILS.fmtMoney(shirtSp.amount)}/wk)`);
            else lines.push(`⚠️ <strong>Geen shirtsponsor</strong>`);
            if(stadiumSp) lines.push(`🏟️ Stadionsponsor: <strong>${stadiumSp.name}</strong> (+${UTILS.fmtMoney(stadiumSp.amount)}/wk)`);
            else lines.push(`⚠️ <strong>Geen stadionsponsor</strong>`);
            sponsorHtml = `<div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e">${lines.join("<br>")}</div>`;
        }

        const board = Store.state.board || { confidence: 80, objective: "Geen" };
        const diffLabel = Engine.getDifficulty().label;
    
    // Kleur bepalen: Groen, Oranje of Rood
    let barColor = "#22c55e"; // Groen
    if(board.confidence < 50) barColor = "#facc15"; // Geel
    if(board.confidence < 25) barColor = "#ef4444"; // Rood

    const rep = Store.state.manager ? Store.state.manager.reputation : 50;
    const boardHtml = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px">
            <strong>Bestuur & Verwachting</strong>
            <span style="font-size:12px" class="muted">Doel: ${board.objective} · ${diffLabel}</span>
        </div>
        <div style="background:#334155; height:10px; border-radius:5px; overflow:hidden; position:relative">
            <div style="background:${barColor}; width:${board.confidence}%; height:100%; transition: width 0.3s"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:3px">
        <span style="font-size:11px" class="muted">⭐ Reputatie: ${rep}/100 (${Engine.reputationLabel(rep)})</span>
        <span style="font-size:11px; color:${barColor}">Vertrouwen: ${board.confidence}%</span>
        </div>
    </div>`;
        
            // 2. Stats Grid (Responsive)
        const elevenRating = Engine.calculatePlayerTeamStrength();
        
        // Vorm: laatste 5 wedstrijden (W/G/V)
        const myName = Store.state.club.name;
        const last5 = (Store.state.seasonResults || []).slice(-5);
        let formHtml = "";
        if(last5.length > 0) {
            formHtml = `<div style="display:flex; gap:4px; justify-content:center; margin-top:4px">`;
            last5.forEach(r => {
                const my = r.home === myName ? r.score[0] : r.score[1];
                const opp = r.home === myName ? r.score[1] : r.score[0];
                let cls = "form-d", letter = "G";
                if(my > opp) { cls = "form-w"; letter = "W"; }
                else if(my < opp) { cls = "form-l"; letter = "V"; }
                formHtml += `<span class="form-chip ${cls}">${letter}</span>`;
            });
            formHtml += `</div>`;
        } else {
            formHtml = `<div class="muted" style="font-size:11px; margin-top:6px">Nog geen duels</div>`;
        }
        
        const statsGrid = `
        <div class="responsive-grid">
            <div class="card" style="margin:0; text-align:center"><div class="muted">Elftal Rating</div><div style="font-size:24px; font-weight:bold; color:#22c55e">${elevenRating}</div></div>
            <div class="card" style="margin:0; text-align:center"><div class="muted">Vorm</div>${formHtml}</div>
            <div class="card" style="margin:0; text-align:center"><div class="muted">Selectie</div><div style="font-size:24px; font-weight:bold">${Store.state.team.length}</div></div>
            <div class="card" style="margin:0; text-align:center"><div class="muted">Stadion</div><div style="font-size:24px; font-weight:bold">Lvl ${Store.state.club.facilities.stadium}</div></div>
        </div>`;

        // 3. Volgende wedstrijd (uit het schema)
        let nextHtml = "";
        const next = Engine.getMyNextMatch();
        if(next) {
            const oppBadge = UTILS.getClubBadge(next.opponent.name, 36);
            const locTxt = next.isHome ? "🏟️ Thuis" : "🚌 Uit";
            const tacName = CONFIG.tactics[Store.state.club.tactic].name;
            nextHtml = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                    <div>
                        <div class="muted" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px">Volgende wedstrijd — Speeldag ${next.day}</div>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:8px; font-size:17px; font-weight:bold">
                            ${oppBadge} ${next.opponent.name}
                        </div>
                        <div class="muted" style="font-size:12px; margin-top:4px">${locTxt} • Jouw tactiek: ${tacName}</div>
                    </div>
                    <button class="secondary" data-nav-tab="fixtures" style="font-size:12px">📅 Programma</button>
                </div>
            </div>`;
        }

        // 4. Laatste Resultaat met Visuals
        const r = Store.state.results.find(x=>x.isYou);
        let resHTML = `<p class="muted">Nog geen wedstrijd gespeeld.</p>`;
        
        if(r) {
            let noteHtml = r.note ? `<div style="margin-top:5px; font-size:12px; color:#fbbf24;">${r.note}</div>` : "";
            
            // Events tonen (max 3 regels)
            let eventsShort = "";
            if(r.events && r.events.length > 0) {
                eventsShort = r.events.slice(0, 3).map(e => `<div style="font-size:11px;color:var(--text-muted)">${e.text ?? e}</div>`).join("");
                if(r.events.length > 3) eventsShort += `<div style="font-size:10px;color:var(--text-muted)">... +${r.events.length - 3} meer</div>`;
            }

            // VISUAL UPDATE: Badges ophalen
            const homeBadge = UTILS.getClubBadge(r.home, 32);
            const awayBadge = UTILS.getClubBadge(r.away, 32);

            resHTML = `
            <div style="border-left:4px solid #22c55e; padding-left:15px; margin-top:10px">
                <div style="display:flex; align-items:center; gap:10px; font-size:18px; font-weight:bold; margin-bottom:5px">
                    <div style="display:flex; align-items:center; gap:8px">${homeBadge} ${r.home}</div>
                    <span style="font-size:24px; color:var(--accent); margin:0 10px">${r.score[0]} - ${r.score[1]}</span>
                    <div style="display:flex; align-items:center; gap:8px">${r.away} ${awayBadge}</div>
                </div>
                ${noteHtml}
                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border)">
                    ${eventsShort || "<i style='font-size:11px'>Geen hoogtepunten.</i>"}
                </div>
            </div>`;
        }

        d.innerHTML=`<h2>Overzicht</h2>${offersHtml}${pendingHtml}${sponsorHtml}${boardHtml}${statsGrid}${nextHtml}<div class="card"><h3>Laatste Resultaat</h3>${resHTML}</div>`;
        return d;
    },

    Training() {
        const d = document.createElement('div');
        if(!Store.state.training) Store.state.training = { selected: [], done: false };
        
        const t = Store.state.training;
        const facLvl = Store.state.club.facilities.training;
        
        let header = `<h2>Training <span class="badge">Lvl ${facLvl}</span></h2>`;
        
        // Status blok
        let statusHtml = "";
        if(t.done) {
            statusHtml = `<div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e; text-align:center"><h3>✅ Training Voltooid</h3><p>Volgende week kun je weer trainen.</p></div>`;
        } else {
            const count = t.selected.length;
            let maxSlots = 2;
            if(facLvl >= 2) maxSlots = 3;
            if(facLvl >= 4) maxSlots = 4;
            const btnClass = count > 0 ? "primary" : "secondary";
            statusHtml = `<div class="card" style="display:flex; justify-content:space-between; align-items:center">
                <div><strong>Geselecteerd: ${count} / ${maxSlots}</strong><br><small class="muted">Hoger facility level = meer groei.</small></div>
                <button class="${btnClass}" onclick="Engine.executeTraining()">Start Training</button>
            </div>`;
        }

        // Lijst met spelers (Met Faces)
        let listHtml = `<div class="card"><table><thead><tr><th>Sel</th><th>Speler</th><th>Pos</th><th>OVR</th><th>Potentie</th></tr></thead><tbody>`;
        
        Store.state.team.forEach(p => {
            const isSel = t.selected.includes(p.id);
            const injured = p.injuredWeeks > 0;
            const check = injured ? "🚑" : (isSel ? "✅" : "⬜");
            let rowStyle = isSel ? "background:rgba(34,197,94,0.1)" : "";
            if(injured) rowStyle = "opacity:0.5";
            const face = UTILS.getPlayerFace(p.id); // VISUAL
            
            let pot = "⭐⭐⭐";
            if(p.age > 24) pot = "⭐⭐";
            if(p.age > 29) pot = "⭐";

            listHtml += `<tr style="${rowStyle}; cursor:pointer" onclick="Engine.toggleTrainingSelect('${p.id}')">
                <td>${check}</td>
                <td>
                    <div class="club-row">
                        ${face}
                        <div><strong>${p.flag || ''} ${p.name}</strong><br><span class="muted">${p.age} jr</span></div>
                    </div>
                </td>
                <td><span class="pill">${p.pos}</span></td>
                <td><strong>${p.ovr}</strong></td>
                <td>${pot}</td>
            </tr>`;
        });
        
        d.innerHTML = header + statusHtml + listHtml + "</tbody></table></div>";
        return d;
    },

    // Bouwt de kaart(en) voor één sponsorsoort ('shirt' of 'stadium'), gedeeld
    // door de Sponsors-pagina zodat shirt- en stadionsponsor er identiek uitzien.
    _sponsorSection(type, title, icon) {
        const sponsorKey = type === 'stadium' ? 'stadiumSponsor' : 'shirtSponsor';
        const offersKey = type === 'stadium' ? 'stadiumSponsorOffers' : 'shirtSponsorOffers';
        const current = Store.state.club[sponsorKey];
        const offers = Store.state.club[offersKey] || [];

        let h = `<h3>${icon} ${title}</h3>`;

        if(current) {
            const logo = UTILS.getClubBadge(current.name, 48);
            h += `<div class="card" style="display:flex; align-items:center; gap:15px">
                ${logo}
                <div style="flex:1">
                    <strong style="font-size:18px">${current.name}</strong><br>
                    <span style="color:var(--accent); font-weight:bold">${UTILS.fmtMoney(current.amount)}</span> / week
                    <span class="muted"> • nog ${current.weeksLeft} weken</span>
                </div>
            </div>`;
        } else if(offers.length === 0) {
            h += `<div class="card muted" style="text-align:center; padding:20px">Geen aanbiedingen momenteel.</div>`;
        } else {
            offers.forEach(o => {
                const negotiatedClass = o.negotiated ? "disabled" : "secondary";
                const negAction = o.negotiated ? "" : `onclick="Engine.negotiateSponsor('${type}', '${o.id}', 'negotiate')"`;
                const negText = o.negotiated ? "Onderhandeld" : "Onderhandel (+)";
                const spLogo = UTILS.getClubBadge(o.name, 30);

                h += `<div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                    <div style="display:flex; align-items:center; gap:10px">
                        ${spLogo}
                        <div>
                            <strong>${o.name}</strong><br>
                            <span style="font-size:18px; color:var(--accent); font-weight:bold">${UTILS.fmtMoney(o.amount)}</span> / week<br>
                            <span class="muted">${o.duration} weken</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:5px">
                        <button class="${negotiatedClass}" ${negAction} style="font-size:12px">${negText}</button>
                        <button class="primary" onclick="Engine.negotiateSponsor('${type}', '${o.id}', 'accept')">Teken</button>
                    </div>
                </div>`;
            });
        }
        return h;
    },

    Sponsors() {
        const d = document.createElement('div');
        const f = Store.state.club.facilities;
        const divFactor = 6 - Store.state.club.division;
        const stadiumEstimate = Engine.getStadiumSponsorBase(divFactor, f.stadium);

        let h = `<h2>Sponsors</h2><p class="muted" style="margin-bottom:20px">Twee onafhankelijke inkomstenbronnen: een shirtsponsor en een stadionsponsor (naamgevingsrechten). Je kunt onderhandelen voor een beter bedrag, maar pas op: ze kunnen weglopen!</p>`;

        h += this._sponsorSection('shirt', 'Shirtsponsor', '👕');

        if(!Store.state.club.stadiumSponsor) {
            h += `<div class="card" style="background:rgba(59,130,246,0.08); border-color:#3b82f6; font-size:12px">
                🏟️ <strong>Tip:</strong> een groter stadion (zie Faciliteiten) maakt je aantrekkelijker voor stadionsponsors.
                Bij je huidige stadionniveau (Lvl ${f.stadium}) is de indicatieve waarde ongeveer <strong>${UTILS.fmtMoney(stadiumEstimate)}</strong>/week.
            </div>`;
        }
        h += this._sponsorSection('stadium', 'Stadionsponsor', '🏟️');

        d.innerHTML = h;
        return d; 
    },

    Cup() {
        const d = document.createElement('div');
        const c = Store.state.cup;
        let hist = "";
        if(c.history.length === 0) hist = "<p class='muted'>Nog geen wedstrijden gespeeld.</p>";
        else c.history.forEach(h => { 
            const oppBadge = UTILS.getClubBadge(h.opponent, 24);
            hist += `<div style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center">
                <span><strong>${h.round}</strong> vs <span style="display:inline-flex; vertical-align:middle; margin:0 5px">${oppBadge}</span> ${h.opponent}</span>
                <span style="font-weight:bold; color:${h.win?'#22c55e':'#ef4444'}">${h.score[0]} - ${h.score[1]}</span>
            </div>`; 
        });
        let status = c.inTournament ? `<div style="padding:20px; text-align:center; background:rgba(34,197,94,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Je zit nog in de race!</h2><p>Volgende ronde rond speeldag ${c.nextRound}</p></div>` : `<div style="padding:20px; text-align:center; background:rgba(239,68,68,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Helaas, uitgeschakeld.</h2></div>`;
        d.innerHTML = `<h2>KNVB Beker</h2>${status}<div class="card"><h3>Geschiedenis</h3>${hist}</div>`;
        return d;
    },

    Squad() {
        const d=document.createElement('div');
        let h=`<h2>Jouw Selectie</h2><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th title="Aanval">AAN</th><th title="Verdediging">VER</th><th title="Snelheid">SNL</th><th>Status</th><th>Contract</th><th>Waarde</th><th>Actie</th></tr></thead><tbody>`;
        
        const l = Store.state.lineup || {};
        const inLineup = new Set([l.gk, ...(l.def||[]), ...(l.mid||[]), ...(l.att||[])].filter(Boolean));

        Store.state.team.forEach(p=>{
            let c = p.ovr>=70 ? "color:#22c55e" : "";
            const years = p.contractYears ?? 1;
            let conColor = "";
            let conText = `${years} szn`;
            if(years <= 1) { conColor = "color:#ef4444; font-weight:bold"; conText += " ⚠️"; }

            // Status: verkocht (wacht op window) / blessure / schorsing / basisspeler
            const pendingSale = (Store.state.pendingSales || []).find(s => s.playerId === p.id);
            let status = inLineup.has(p.id) ? `<span class="pill" style="background:rgba(34,197,94,0.15); color:#22c55e">Basis</span>` : `<span class="muted" style="font-size:11px">Bank</span>`;
            if(p.injuredWeeks > 0) status = `<span style="color:#ef4444; font-size:12px">🚑 ${p.injuredWeeks} wk</span>`;
            else if(p.suspended > 0) status = `<span style="color:#ef4444; font-size:12px">🟥 Geschorst</span>`;
            if(pendingSale) status = `<span style="color:#fbbf24; font-size:12px">🚚 Vertrekt (→ ${pendingSale.club})</span>`;

            const onList = Store.state.transferList.includes(p.id);
            let btnAction = "";
            if(pendingSale) {
                btnAction = `<span class="muted" style="font-size:11px">Verkocht</span>`;
            } else if(years <= 1) {
                 btnAction = `<button class="primary btn-extend" data-id="${p.id}" style="font-size:10px; padding:4px 6px">✍️ Verleng</button>`;
            } else {
                 const btnClass = onList ? "secondary" : "danger";
                 const btnLabel = onList ? "Terug" : "Verkoop";
                 btnAction = `<button class="${btnClass} btn-list" data-id="${p.id}" style="font-size:10px; padding:4px 6px">${btnLabel}</button>`;
            }

            const face = UTILS.getPlayerFace(p.id);
            const potentialTag = (p.potential && p.potential >= p.ovr + 10) ? ` <span title="Groot potentieel (${p.potential})" style="font-size:11px">🌟</span>` : "";

            h+=`<tr>
                <td><span class="pill ${p.pos === 'K' ? 'pill-gk' : ''}">${p.pos}</span></td>
                <td>
                    <div class="club-row">
                        ${face}
                        <div><strong>${p.flag || ''} ${p.name}</strong>${potentialTag}<br><span class="muted">${p.age} jr • ${UTILS.fmtMoney(p.wage)}/wk</span></div>
                    </div>
                </td>
                <td style="${c};font-weight:bold">${p.ovr}</td>
                <td class="muted" style="font-size:13px">${p.att || '-'}</td>
                <td class="muted" style="font-size:13px">${p.def || '-'}</td>
                <td class="muted" style="font-size:13px">${p.spd || '-'}</td>
                <td>${status}</td>
                <td style="${conColor}">${conText}</td>
                <td class="money">${UTILS.fmtMoney(p.value)}</td>
                <td>${btnAction}</td>
            </tr>`;
        });
        d.innerHTML=h+`</tbody></table><p class="muted" style="font-size:12px; margin-top:10px">* Spelers met nog 1 seizoen contract kun je verlengen. Contracten lopen af aan het einde van het seizoen. 🌟 = groot groeipotentieel.</p></div>`;
        return d;
    },

    TransferMarket() {
        const d=document.createElement('div');
        const isOpen = Engine.isTransferWindowOpen();
        const statusColor = isOpen ? "#22c55e" : "#ef4444";
        const statusText = isOpen ? "OPEN" : "GESLOTEN";

        let header = `<h2>Transfermarkt <span class="badge" style="background:${statusColor};color:white;font-size:12px;vertical-align:middle;margin-left:10px">${statusText}</span></h2>`;

        let banner = "";
        if(!isOpen) {
            banner = `<div class="card" style="background:rgba(251,191,36,0.1); border-color:#fbbf24">
                ⏳ <strong>De transfermarkt is gesloten</strong> tot ${Engine.nextWindowLabel()}.
                <br><span style="font-size:12px" class="muted">Je kunt nog steeds bieden en biedingen accepteren — deals worden dan pas officieel zodra de window opengaat.</span>
            </div>`;
        }

        // --- LOPENDE TRANSFERS (vooraf afgesproken deals, wachtend op de window) ---
        const pendingIn = Store.state.pendingSignings || [];
        const pendingOut = Store.state.pendingSales || [];
        let pendingHtml = "";
        if(pendingIn.length > 0 || pendingOut.length > 0) {
            pendingHtml += `<h3>⏳ Lopende Transfers</h3><div class="card">`;
            pendingIn.forEach(s => {
                pendingHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border)">
                    <span>📥 <strong>${s.player.name}</strong> <span class="muted">(van ${s.from})</span></span>
                    <span style="color:#22c55e">${UTILS.fmtMoney(s.fee)}</span>
                </div>`;
            });
            pendingOut.forEach(s => {
                pendingHtml += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border)">
                    <span>📤 <strong>${s.playerName}</strong> <span class="muted">→ ${s.club}</span></span>
                    <span style="color:#22c55e">${UTILS.fmtMoney(s.amount)}</span>
                </div>`;
            });
            pendingHtml += `</div>`;
        }

        let offersHtml = "";
        if(Store.state.incomingOffers.length > 0) {
            offersHtml += `<h3>📩 Binnenkomende Biedingen</h3><div class="card">`;
            Store.state.incomingOffers.forEach(o => { 
                const clubBadge = UTILS.getClubBadge(o.club, 24);
                offersHtml += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border); padding:10px 0;">
                    <div>
                        <div class="club-row"><span class="muted">Van:</span> ${clubBadge} <strong>${o.club}</strong></div>
                        <div style="margin-top:4px"><span class="muted">Op:</span> <strong>${o.playerName}</strong></div>
                        <div style="margin-top:4px"><span class="muted">Bod:</span> <span style="color:#22c55e; font-weight:bold">${UTILS.fmtMoney(o.amount)}</span></div>
                    </div>
                    <div style="display:flex; gap:5px;"><button class="primary btn-acc" data-id="${o.id}">✅</button><button class="danger btn-rej" data-id="${o.id}">❌</button></div>
                </div>`; 
            });
            offersHtml += `</div>`;
        } else { offersHtml = `<div class="card" style="padding:15px; text-align:center; color:#aaa">Geen openstaande biedingen.</div>`; }

        let marketHtml = `<h3>🛒 Spelers Kopen</h3><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Van</th><th>Waarde Indicatie</th><th>Actie</th></tr></thead><tbody>`;
        Store.state.market.forEach(p=>{
            let c=p.ovr>=70?"color:#22c55e":"";
            const min = Math.round(p.value * 0.9); const max = Math.round(p.value * 1.3);
            const face = UTILS.getPlayerFace(p.id);
            const potentialTag = (p.potential && p.potential >= p.ovr + 10) ? ` <span title="Groot potentieel" style="font-size:11px">🌟</span>` : "";
            marketHtml+=`<tr>
                <td><span class="pill ${p.pos === 'K' ? 'pill-gk' : ''}">${p.pos}</span></td>
                <td>
                    <div class="club-row">
                        ${face}
                        <div><strong>${p.flag || ''} ${p.name}</strong>${potentialTag}<br><span class="muted">${p.age} jr</span></div>
                    </div>
                </td>
                <td style="${c};font-weight:bold">${p.ovr}</td>
                <td class="muted" style="font-size:12px">${p.fromClub || '-'}</td>
                <td class="money">${UTILS.fmtMoney(min)} - ${UTILS.fmtMoney(max)}</td>
                <td><button class="primary btn-bid" data-id="${p.id}">Bied</button></td>
            </tr>`;
        });
        marketHtml+=`</tbody></table></div>`;
        
        d.innerHTML = header + banner + pendingHtml + offersHtml + marketHtml;
        return d;
    },

    YouthAcademy() {
        const d=document.createElement('div');
        const level = Store.state.club.facilities.training;
        if(level < 3) { d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="text-align:center; padding:40px;"><h1 style="font-size:40px">🔒</h1><h3>Academy Gesloten</h3><p class="muted">Je hebt <strong>Trainingscomplex Niveau 3</strong> nodig.</p><p>Huidig niveau: ${level}</p></div>`; return d; }
        
        let listHtml = "";
        if(Store.state.youthAcademy.length === 0) { listHtml = `<p class="muted">Geen talenten. Stuur de scout op pad!</p>`; } 
        else {
            listHtml = `<table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Potentie</th><th>Actie</th></tr></thead><tbody>`;
            Store.state.youthAcademy.forEach(p => { 
                const face = UTILS.getPlayerFace(p.id);
                const gap = (p.potential || p.ovr) - p.ovr;
                let potHtml = `<span class="muted">-</span>`;
                if(gap >= 15) potHtml = `<span style="color:#22c55e; font-weight:bold">🌟🌟🌟 Toptalent</span>`;
                else if(gap >= 8) potHtml = `<span style="color:#22c55e">🌟🌟 Veelbelovend</span>`;
                else if(gap >= 3) potHtml = `<span style="color:#facc15">🌟 Beperkt</span>`;
                listHtml += `<tr>
                    <td>${p.pos}</td>
                    <td>
                        <div class="club-row">
                            ${face}
                            <strong>${p.flag || ''} ${p.name}</strong> (${p.age} jr)
                        </div>
                    </td>
                    <td>${p.ovr}</td>
                    <td>${potHtml}</td>
                    <td><button class="primary btn-sign" data-id="${p.id}">Contract (€ 5.000)</button></td>
                </tr>`; 
            });
            listHtml += `</tbody></table>`;
        }
        d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="display:flex; justify-content:space-between; align-items:center"><div><h3>Hoofd Scout</h3><div class="muted">Kost per sessie: <strong>€ 25.000</strong></div></div><button class="primary" id="btn-scout">🔎 Scout Talent</button></div><h3>Gescout Talent</h3><div class="card">${listHtml}</div>`;
        return d;
    },

    Tactics() {
        const d=document.createElement('div');
        let h=`<h2>Tactiek & Opstelling</h2><div class="card" style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))">`;
        for(let k in CONFIG.tactics) {
            let t = CONFIG.tactics[k];
            let active = Store.state.club.tactic === k ? "border:2px solid #22c55e;background:rgba(34,197,94,0.1)" : "border:1px solid var(--border)";
            h+=`<div onclick="Engine.setTactic('${k}')" style="padding:15px;border-radius:8px;cursor:pointer;${active}"><h3>${t.name}</h3><p class="muted" style="font-size:12px">${t.desc}</p></div>`;
        }
        h += `</div>`;

        // --- OPSTELLING OP HET VELD ---
        const slots = Engine.getLineupSlots();
        const f = Engine.getFormation();
        const strength = Engine.calculatePlayerTeamStrength();

        // Posities op het veld per linie (aanval boven)
        const rows = { GK: 90, DEF: 70, MID: 45, ATT: 20 };
        const rowCounts = { GK: 1, DEF: f.def, MID: f.mid, ATT: f.att };
        const rowIdx = { GK: 0, DEF: 0, MID: 0, ATT: 0 };

        let nodes = "";
        slots.forEach(s => {
            const i = rowIdx[s.group]++;
            const x = ((i + 1) / (rowCounts[s.group] + 1)) * 100;
            const y = rows[s.group];
            const p = Store.state.team.find(t => t.id === s.id);
            
            let shirt, info;
            if(p) {
                const eff = Engine.effectiveOvr(p, s.group);
                const outOfPos = eff < p.ovr;
                const shirtClass = s.group === "GK" ? "shirt gk" : "shirt";
                shirt = `<div class="${shirtClass}">${eff}</div>`;
                const warn = outOfPos ? " ⚠️" : "";
                info = `<div class="player-info">${p.name.split(" ").slice(-1)[0]} (${p.pos})${warn}</div>`;
            } else {
                shirt = `<div class="shirt empty">?</div>`;
                info = `<div class="player-info">Leeg</div>`;
            }
            
            nodes += `<div class="player-node" data-slot-group="${s.group}" data-slot-key="${s.key}" data-slot-index="${s.index}" style="left:${x}%; top:${y}%">${shirt}${info}</div>`;
        });

        h += `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                <div>
                    <h3 style="margin:0">Opstelling <span class="badge">${f.def}-${f.mid}-${f.att}</span></h3>
                    <span class="muted" style="font-size:12px">Klik op een positie om een speler te kiezen. ⚠️ = uit positie (rating-verlies).</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="text-align:center"><div class="muted" style="font-size:10px; text-transform:uppercase">Elftal Rating</div><strong style="font-size:20px; color:var(--accent)">${strength}</strong></div>
                    <button class="secondary" id="btn-auto-lineup">✨ Auto-opstelling</button>
                </div>
            </div>
            <div class="pitch-container">
                <div class="pitch-line center-line" style="width:100%; height:2px; top:50%; left:0; transform:none"></div>
                <div class="pitch-line center-circle"></div>
                <div class="pitch-line box-top"></div>
                <div class="pitch-line box-bottom"></div>
                ${nodes}
            </div>
        </div>`;

        d.innerHTML = h;
        return d;
    },

    Facilities() {
        const d = document.createElement('div');
        const f = Store.state.club.facilities;
        const div = Store.state.club.division;
        const divFactor = 6 - div;

        // 8 bolletjes die het huidige niveau tonen
        const levelDots = (level) => {
            let dots = '';
            for(let i = 1; i <= 8; i++) dots += `<span class="level-dot${i <= level ? ' filled' : ''}"></span>`;
            return `<div class="level-dots">${dots}</div>`;
        };

        // Eén regel: label + huidige waarde + (indien niet max) pijl naar volgend niveau
        const impactRow = (label, currentStr, nextStr) => {
            const nextHtml = nextStr !== null
                ? `<span class="impact-arrow">→</span> <strong style="color:var(--accent)">${nextStr}</strong>`
                : `<span class="muted" style="font-size:11px">max</span>`;
            return `<div class="impact-row"><span class="muted">${label}</span><div>${currentStr} ${nextHtml}</div></div>`;
        };

        const buildCard = (type, icon, title, tagline, rows) => {
            const level = f[type];
            const isMax = level >= 8;
            const cost = isMax ? null : CONFIG.costs[type][level];
            const btnHtml = isMax
                ? `<button disabled style="width:100%">Max. niveau bereikt</button>`
                : `<button class="primary" onclick="Engine.upgradeFacility('${type}')" style="width:100%">Upgrade naar Lvl ${level + 1} (${UTILS.fmtMoney(cost)})</button>`;
            const maint = Engine.getMaintenanceCost(type, level);

            return `
            <div class="facility-card">
                <h3 style="margin-bottom:2px">${icon} ${title} <span class="badge">Lvl ${level}</span></h3>
                <p class="muted" style="font-size:12px; margin:0 0 8px">${tagline}</p>
                ${levelDots(level)}
                <div class="impact-list">${rows.join('')}</div>
                <div class="impact-row" style="border-top:1px dashed var(--border); margin-top:4px; padding-top:8px">
                    <span class="muted">Onderhoud</span><span style="color:#ef4444">-${UTILS.fmtMoney(maint)}/wk</span>
                </div>
                <div style="margin-top:12px">${btnHtml}</div>
            </div>`;
        };

        // --- STADION ---
        const nextStadium = f.stadium < 8 ? f.stadium + 1 : null;
        const ticketNow = Engine.getTicketIncomeEstimate(div, f.stadium);
        const ticketNext = nextStadium ? Engine.getTicketIncomeEstimate(div, nextStadium) : null;
        const bonusNow = Engine.getStadiumMatchBonus(f.stadium);
        const bonusNext = nextStadium ? Engine.getStadiumMatchBonus(nextStadium) : null;
        const sponsorNow = Engine.getStadiumSponsorBase(divFactor, f.stadium);
        const sponsorNext = nextStadium ? Engine.getStadiumSponsorBase(divFactor, nextStadium) : null;

        const stadiumCard = buildCard('stadium', '🏟️', 'Stadion', 'Meer capaciteit = meer tickets, thuisvoordeel én aantrekkelijker voor stadionsponsors.', [
            impactRow('🎟️ Tickets per thuiswedstrijd', `+${UTILS.fmtMoney(ticketNow)}`, ticketNext !== null ? `+${UTILS.fmtMoney(ticketNext)}` : null),
            impactRow('💪 Thuisvoordeel (teamsterkte)', `+${bonusNow}`, bonusNext !== null ? `+${bonusNext}` : null),
            impactRow('🤝 Stadionsponsor-indicatie', `~${UTILS.fmtMoney(sponsorNow)}/wk`, sponsorNext !== null ? `~${UTILS.fmtMoney(sponsorNext)}/wk` : null),
        ]);

        // --- TRAINING ---
        const nextTraining = f.training < 8 ? f.training + 1 : null;
        const slotsNow = Engine.getTrainingSlots(f.training);
        const slotsNext = nextTraining ? Engine.getTrainingSlots(nextTraining) : null;
        const growthNow = Engine.getTrainingGrowthRange(f.training);
        const growthNext = nextTraining ? Engine.getTrainingGrowthRange(nextTraining) : null;
        const youthUnlocked = f.training >= 3;

        const trainingRows = [
            impactRow('💪 Groei per sessie', `+${growthNow.min} tot +${growthNow.max} OVR`, growthNext ? `+${growthNext.min} tot +${growthNext.max} OVR` : null),
            impactRow('👥 Spelers per sessie', `${slotsNow}`, (slotsNext !== null && slotsNext !== slotsNow) ? `${slotsNext}` : null),
        ];
        trainingRows.push(youthUnlocked
            ? impactRow('🎓 Jeugdopleiding', '🔓 Ontgrendeld', null)
            : impactRow('🎓 Jeugdopleiding', '🔒 Vereist Lvl 3', f.training + 1 >= 3 ? '🔓 Ontgrendeld' : null));

        const trainingCard = buildCard('training', '🏋️', 'Training', 'Meer en snellere spelersgroei, en de sleutel tot je jeugdopleiding.', trainingRows);

        // --- MEDISCH ---
        const nextMedical = f.medical < 8 ? f.medical + 1 : null;
        const chanceNow = Engine.getInjuryChance(f.medical);
        const chanceNext = nextMedical ? Engine.getInjuryChance(nextMedical) : null;
        const reductionNow = Engine.getInjuryDurationReduction(f.medical);
        const reductionNext = nextMedical ? Engine.getInjuryDurationReduction(nextMedical) : null;

        const medicalCard = buildCard('medical', '🏥', 'Medische Staf', 'Minder blessures, en als het misgaat: sneller weer fit.', [
            impactRow('🚑 Blessurekans (per 10 min)', `${(chanceNow * 100).toFixed(1)}%`, chanceNext !== null ? `${(chanceNext * 100).toFixed(1)}%` : null),
            impactRow('⏱️ Kortere uitvalduur', `-${reductionNow} wk`, (reductionNext !== null && reductionNext !== reductionNow) ? `-${reductionNext} wk` : null),
        ]);

        d.innerHTML = `<h2>Faciliteiten</h2><div class="facilities-grid">${stadiumCard}${trainingCard}${medicalCard}</div>`;
        return d;
    },

    League() { 
        const d=document.createElement('div'); 
        const v=Store.state.ui.viewDivision; 
        let c=`<div class="chips" style="margin-bottom:15px">`; 
        for(let i=1;i<=5;i++) c+=`<span class="chip ${v===i?'active':''}" onclick="Store.state.ui.viewDivision=${i};UI.render()">${UTILS.getLeagueShort(i)}</span>`; 
        c+="</div>"; 
        
        let h=`<h2>Competitie</h2><div class="card">${c}<table><thead><tr><th>#</th><th>Club</th><th>G</th><th>W</th><th>G</th><th>V</th><th>DS</th><th>Pt</th></tr></thead><tbody>`; 
        let t=[...Store.state.competitions[v]].sort((a,b)=>b.pts-a.pts||b.gd-a.gd); 
        
        t.forEach((x,i)=>{
            let rowClass = "";
            if(x.id===Store.state.club.id) { rowClass += " my-club"; }
            if(v > 1 && i < 2) { rowClass += " promo"; }
            if(v < 5 && i >= t.length - 2) { rowClass += " rele"; }

            // VISUAL UPDATE: Badge toevoegen
            const badge = UTILS.getClubBadge(x.name, 28);
            const gdColor = x.gd > 0 ? "color:#22c55e" : (x.gd < 0 ? "color:#ef4444" : "");

            h+=`<tr class="${rowClass}">
                <td>${i+1}</td>
                <td><div class="club-row">${badge} <span>${x.name}</span></div></td>
                <td>${x.played}</td><td>${x.won}</td><td>${x.draw}</td><td>${x.lost}</td>
                <td style="${gdColor}">${x.gd > 0 ? '+' : ''}${x.gd}</td>
                <td><strong>${x.pts}</strong></td>
            </tr>`
        }); 
        h += `</tbody></table>
        <div style="display:flex; gap:15px; margin-top:12px; font-size:11px" class="muted">
            ${v > 1 ? '<span><span class="legend-dot" style="background:#22c55e"></span> Promotie</span>' : ''}
            ${v < 5 ? '<span><span class="legend-dot" style="background:#ef4444"></span> Degradatie</span>' : ''}
        </div></div>`;
        d.innerHTML=h; 
        return d; 
    },

    TopScorers() {
        const d = document.createElement('div');
        const v = Store.state.ui.viewDivision;
        let c = `<div class="chips" style="margin-bottom:15px">`;
        for(let i=1; i<=5; i++) c += `<span class="chip ${v===i?'active':''}" onclick="Store.state.ui.viewDivision=${i};UI.render()">${UTILS.getLeagueShort(i)}</span>`;
        c += `</div>`;

        const all = Object.values(Store.state.topScorers || {}).filter(s => s.division === v).sort((a,b) => b.goals - a.goals);

        let rows = "";
        if(all.length === 0) {
            rows = `<tr><td colspan="4" class="muted" style="text-align:center; padding:20px">Nog geen doelpunten dit seizoen in deze divisie.</td></tr>`;
        } else {
            all.slice(0, 20).forEach((s, i) => {
                const isMe = s.club === Store.state.club.name;
                const badge = UTILS.getClubBadge(s.club, 26);
                rows += `<tr class="${isMe ? 'my-club' : ''}">
                    <td>${i+1}</td>
                    <td><strong>${s.name}</strong></td>
                    <td><div class="club-row">${badge} <span>${s.club}</span></div></td>
                    <td><strong style="color:var(--accent)">${s.goals}</strong></td>
                </tr>`;
            });
        }

        d.innerHTML = `<h2>⚽ Topscorers</h2><div class="card">${c}<table><thead><tr><th>#</th><th>Speler</th><th>Club</th><th>Goals</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        return d;
    },

    Fixtures() { 
        const d=document.createElement('div'); 
        const clubId = Store.state.club.id;
        const div = Store.state.club.division;
        const sched = Store.state.schedules ? Store.state.schedules[div] : null;
        const teams = Store.state.competitions[div] || [];
        const currentDay = Store.state.game.day;
        const played = Store.state.seasonResults || [];
        
        let h = `<h2>Programma & Uitslagen</h2>`;

        // 1. Laatste wedstrijd met details (events + tactiek)
        const last = [...played].reverse().find(r => r.isYou);
        if(last) {
            let details = "";
            if(last.note) details += `<div style="color:#fbbf24; font-size:11px; margin-bottom:4px;">${last.note}</div>`;
            if(last.events && last.events.length) details += last.events.map(e => `<span style="display:inline-block; margin-right:8px; font-size:11px; color:#aaa; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${e.text ?? e}</span>`).join(" ");
            
            const homeBadge = UTILS.getClubBadge(last.home, 24);
            const awayBadge = UTILS.getClubBadge(last.away, 24);
            h += `<div class="card">
                <h3 style="font-size:14px">Laatste wedstrijd</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; margin-bottom:5px;">
                    <div class="club-row" style="width:40%">${homeBadge} ${last.home}</div>
                    <span style="font-size:18px; color:var(--accent)">${last.score[0]}-${last.score[1]}</span>
                    <div class="club-row" style="width:40%; justify-content:flex-end">${last.away} ${awayBadge}</div>
                </div>
                <div style="line-height:1.6">${details || "<span class='muted' style='font-size:11px'>Geen hoogtepunten.</span>"}</div>
            </div>`;
        }

        // 2. Volledig seizoensschema van jouw club
        if(!sched) {
            h += `<div class="card"><p class="muted">Geen schema beschikbaar. Speel een ronde om het schema te genereren.</p></div>`;
            d.innerHTML = h;
            return d;
        }

        const byId = {};
        teams.forEach(t => byId[t.id] = t);

        let rows = "";
        sched.forEach((round, idx) => {
            const day = idx + 1;
            const m = round.find(x => x.h === clubId || x.a === clubId);
            if(!m) return; // vrijgeloot deze ronde
            
            const isHome = m.h === clubId;
            const opp = byId[isHome ? m.a : m.h];
            if(!opp) return;
            
            const oppBadge = UTILS.getClubBadge(opp.name, 22);
            const locTag = isHome 
                ? `<span class="pill" style="background:rgba(34,197,94,0.15); color:#22c55e">THUIS</span>` 
                : `<span class="pill" style="background:rgba(59,130,246,0.15); color:#3b82f6">UIT</span>`;

            // Uitslag opzoeken als de ronde al gespeeld is
            let resultCell = `<span class="muted">-</span>`;
            let rowStyle = "";
            
            if(day < currentDay) {
                const res = played.find(r => r.day === day);
                if(res) {
                    const myGoals = res.home === Store.state.club.name ? res.score[0] : res.score[1];
                    const oppGoals = res.home === Store.state.club.name ? res.score[1] : res.score[0];
                    let color = "#facc15", letter = "G"; // Gelijk
                    if(myGoals > oppGoals) { color = "#22c55e"; letter = "W"; }
                    else if(myGoals < oppGoals) { color = "#ef4444"; letter = "V"; }
                    resultCell = `<strong style="color:${color}">${res.score[0]} - ${res.score[1]}</strong> <span class="pill" style="background:${color}; color:#000; margin-left:6px">${letter}</span>`;
                }
            } else if(day === currentDay) {
                rowStyle = "background:rgba(34,197,94,0.08); border-left:3px solid var(--accent)";
                resultCell = `<span style="color:var(--accent); font-weight:bold">▶ Volgende</span>`;
            }

            rows += `<tr style="${rowStyle}">
                <td class="muted">${day}</td>
                <td><div class="club-row">${oppBadge} <span>${opp.name}</span></div></td>
                <td>${locTag}</td>
                <td>${resultCell}</td>
            </tr>`;
        });

        h += `<div class="card"><table><thead><tr><th>Dag</th><th>Tegenstander</th><th>Waar</th><th>Uitslag</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        
        d.innerHTML = h; 
        return d; 
    },

    Finance() { const d=document.createElement('div'); const f=Store.state.finance.lastWeek; let l=""; f.breakdown.forEach(x=>l+=`<div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--border);padding:5px 0"><span>${x.txt}</span><span style="color:${x.amt>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(x.amt)}</span></div>`); d.innerHTML=`<h2>Financiën</h2><div class="card"><h3 style="text-align:center;margin-bottom:20px">${UTILS.fmtMoney(Store.state.club.budget)}</h3><h4>Weekrapport</h4>${l}<div style="display:flex;justify-content:space-between;margin-top:10px;font-weight:bold;font-size:18px"><span>Totaal</span><span style="color:${f.profit>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(f.profit)}</span></div></div>`; return d; },

    History() {
        const d = document.createElement('div');
        const hist = Store.state.history || [];
        
        let content = "";
        if(hist.length === 0) {
            content = `<div class="card" style="text-align:center; padding:30px;"><span style="font-size:40px">📜</span><h3>Nog geen historie</h3><p class="muted">Speel een seizoen uit om hier data te zien.</p></div>`;
        } else {
            let rows = "";
            [...hist].reverse().forEach(h => {
                let badgeColor = "#facc15"; // Handhaving
                if(h.result === "Kampioen") badgeColor = "#a855f7";
                else if(h.result === "Promotie") badgeColor = "#22c55e";
                else if(h.result === "Degradatie") badgeColor = "#ef4444";
                else if(h.result === "Ontslagen") badgeColor = "#f97316";
                let cupTxt = h.cup || "-"; 
                
                rows += `<tr>
                    <td>Seizoen ${h.season}</td>
                    <td>${h.teamName || '-'}</td>
                    <td>Divisie ${h.division}</td>
                    <td># ${h.rank}</td>
                    <td>${h.points}</td>
                    <td><span class="badge" style="background:${badgeColor}; color:#000">${h.result}</span></td>
                    <td><strong>${cupTxt}</strong></td> 
                </tr>`;
            });
            content = `<div class="card"><table><thead><tr><th>Seizoen</th><th>Club</th><th>Divisie</th><th>Pos</th><th>Pt</th><th>Res</th><th>Beker</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        
        d.innerHTML = `<h2>🏆 Hall of Fame</h2>${content}`;
        return d;
    },

    Settings() {
        const d = document.createElement('div');
        const m = Store.state.manager;
        const diff = Engine.getDifficulty();
        const careerCard = (m && !m.unemployed) ? `
        <div class="card">
            <h3>💼 Managerscarrière</h3>
            <p class="muted" style="font-size:13px">Reputatie: <strong>${m.reputation}/100</strong> (${Engine.reputationLabel(m.reputation)}). Sta je open voor een nieuwe uitdaging? Je huidige club blijft van jou totdat je daadwerkelijk tekent bij een andere club.</p>
            <button class="secondary" id="btn-browse-jobs">🔍 Zoek een nieuwe uitdaging</button>
        </div>` : "";

        d.innerHTML = `
        <h2>⚙️ Instellingen</h2>
        ${careerCard}
        <div class="card">
            <h3>🎚️ Moeilijkheid</h3>
            <p class="muted" style="font-size:13px">Deze carrière draait op <strong>${diff.label}</strong>. ${diff.desc}<br>Moeilijkheid kies je alleen bij het starten van een nieuwe carrière.</p>
        </div>
        <div class="card">
            <h3>💾 Save exporteren</h3>
            <p class="muted" style="font-size:13px">Genereer een save-code om je carrière over te zetten naar een ander apparaat (bijv. van PC naar telefoon), of als back-up.</p>
            <div style="display:flex; gap:8px; margin-bottom:10px">
                <button class="primary" id="btn-export-save">Genereer save-code</button>
                <button class="secondary" id="btn-copy-save">📋 Kopieer</button>
            </div>
            <textarea id="export-area" readonly class="save-area" style="display:none" placeholder="Je save-code verschijnt hier..."></textarea>
        </div>

        <div class="card">
            <h3>📥 Save importeren</h3>
            <p class="muted" style="font-size:13px">Plak hier een save-code van een ander apparaat. <strong>Let op:</strong> dit overschrijft je huidige spel!</p>
            <textarea id="import-area" class="save-area" placeholder="Plak je save-code hier..."></textarea>
            <button class="primary" id="btn-import-save" style="margin-top:10px">Importeer save</button>
        </div>

        <div class="card">
            <h3>🗑️ Opnieuw beginnen</h3>
            <p class="muted" style="font-size:13px">Wis je huidige carrière en start opnieuw. Dit kan niet ongedaan gemaakt worden.</p>
            <button class="danger" id="btn-reset">Reset carrière</button>
        </div>

        <div class="card">
            <h3>ℹ️ Over</h3>
            <p class="muted" style="font-size:13px">
                ${CONFIG.gameTitle} — versie ${CONFIG.version}<br>
                Je spel wordt automatisch opgeslagen na elke actie.<br>
                Installeer de game op je telefoon via "Toevoegen aan beginscherm" in je browser.
            </p>
        </div>`;
        return d;
    },

    News() {
        const d = document.createElement('div');
        const news = Store.state.news || [];

        let html = `<h2>📰 Voetbal Nieuws</h2>`;

        if(news.length === 0) {
            html += `<div class="card" style="text-align:center; padding:30px; color:var(--text-muted)">
                <h3>Komkommertijd...</h3>
                <p>Nog geen nieuwsberichten. Speel een ronde!</p>
            </div>`;
        } else {
            html += `<div class="card" style="padding:0">`;
            
            news.forEach((item, index) => {
                const badge = UTILS.getClubBadge(item.club || "FIFA", 36);
                const border = index !== news.length - 1 ? "border-bottom:1px solid var(--border);" : "";
                
                // Icoontje bepalen op basis van type
                let icon = "📰";
                if(item.type === 'match') icon = "⚽";
                if(item.type === 'transfer') icon = "💸";
                if(item.type === 'rumor') icon = "🤫";
                if(item.type === 'finance') icon = "📉";

                html += `
                <div style="display:flex; gap:15px; padding:15px; align-items:center; ${border}">
                    <div style="flex-shrink:0">${badge}</div>
                    <div style="flex:1">
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; margin-bottom:2px">
                            Week ${item.week} • ${icon} ${item.type}
                        </div>
                        <div style="font-weight:500; line-height:1.4">${item.text}</div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        d.innerHTML = html;
        return d;
    }
};