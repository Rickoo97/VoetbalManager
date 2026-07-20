import { Store } from './store.js';
import { CONFIG } from './config.js';
import { UTILS } from './utils.js';
import { Engine } from './engine.js'; 

export const Views = {
    Welcome() {
        const d=document.createElement('div'); d.className="card"; d.style.textAlign="center"; d.style.maxWidth="400px"; d.style.margin="100px auto";
        // Visuele upgrade: Een groot logo boven de titel
        const demoLogo = UTILS.getClubBadge("FC Start", 60);
        d.innerHTML=`${demoLogo}<h1 style="margin-top:15px">${CONFIG.gameTitle}</h1><p class="muted">Start je carrière.</p><div style="margin:30px 0"><label style="display:block;margin-bottom:10px">Clubnaam</label><input type="text" id="inp-name" value="FC Breda" style="padding:10px;width:100%;border-radius:8px;border:1px solid #444;background:var(--bg-body);color:var(--text-main)"></div><button class="primary" id="btn-start" style="width:100%">Start Carrière</button>`;
        return d;
    },

    Dashboard() {
        const d=document.createElement('div');
        
        // 1. Meldingen
        const offersLen = Store.state.incomingOffers.length;
        let offersHtml = offersLen > 0 ? `<div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e"><strong>🚨 Je hebt ${offersLen} bod(en)!</strong><br><span style="font-size:13px">Ga naar Transfermarkt.</span></div>` : "";
        
        let sponsorHtml = Store.state.club.sponsor 
            ? `<div class="card" style="background:rgba(34,197,94,0.1); border-color:#22c55e">Sponsor: <strong>${Store.state.club.sponsor.name}</strong> (+ ${UTILS.fmtMoney(Store.state.club.sponsor.amount)}/wk)</div>`
            : `<div class="card" style="background:rgba(239, 68, 68, 0.1); border-color:#ef4444">⚠️ <strong>Geen sponsor!</strong> Ga snel naar Sponsors om een deal te sluiten.</div>`;

        const board = Store.state.board || { confidence: 80, objective: "Geen" };
    
    // Kleur bepalen: Groen, Oranje of Rood
    let barColor = "#22c55e"; // Groen
    if(board.confidence < 50) barColor = "#facc15"; // Geel
    if(board.confidence < 25) barColor = "#ef4444"; // Rood

    const boardHtml = `
    <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px">
            <strong>Bestuur & Verwachting</strong>
            <span style="font-size:12px" class="muted">Doel: ${board.objective}</span>
        </div>
        <div style="background:#334155; height:10px; border-radius:5px; overflow:hidden; position:relative">
            <div style="background:${barColor}; width:${board.confidence}%; height:100%; transition: width 0.3s"></div>
        </div>
        <div style="text-align:right; font-size:11px; margin-top:3px; color:${barColor}">
            Vertrouwen: ${board.confidence}%
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

        d.innerHTML=`<h2>Overzicht</h2>${offersHtml}${sponsorHtml}${boardHtml}${statsGrid}${nextHtml}<div class="card"><h3>Laatste Resultaat</h3>${resHTML}</div>`;
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

    Sponsors() {
        const d = document.createElement('div');
        if(Store.state.club.sponsor) {
            let s = Store.state.club.sponsor;
            // Fake logo voor sponsor
            const logo = UTILS.getClubBadge(s.name, 50);
            d.innerHTML=`<h2>Sponsor</h2><div class="card" style="text-align:center">
                <div style="display:flex;justify-content:center;margin-bottom:10px">${logo}</div>
                <h1>${s.name}</h1>
                <h3>${UTILS.fmtMoney(s.amount)} / week</h3>
                <p class="muted">Looptijd: nog <strong>${s.weeksLeft}</strong> weken</p>
            </div>`;
        } else {
            let h = `<h2>Sponsors</h2><p class="muted" style="margin-bottom:20px">Kies een sponsor. Je kunt onderhandelen voor een beter bedrag, maar pas op: ze kunnen weglopen!</p>`;
            
            if(Store.state.club.sponsorOffers.length === 0) {
                h += `<div class="card">Geen aanbiedingen momenteel.</div>`;
            } else {
                Store.state.club.sponsorOffers.forEach(o => {
                    const negotiatedClass = o.negotiated ? "disabled" : "secondary";
                    const negAction = o.negotiated ? "" : `onclick="Engine.negotiateSponsor('${o.id}', 'negotiate')"`;
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
                            <button class="primary" onclick="Engine.negotiateSponsor('${o.id}', 'accept')">Teken</button>
                        </div>
                    </div>`;
                });
            }
            d.innerHTML = h;
        } 
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

            // Status: blessure / schorsing / basisspeler
            let status = inLineup.has(p.id) ? `<span class="pill" style="background:rgba(34,197,94,0.15); color:#22c55e">Basis</span>` : `<span class="muted" style="font-size:11px">Bank</span>`;
            if(p.injuredWeeks > 0) status = `<span style="color:#ef4444; font-size:12px">🚑 ${Math.max(1, p.injuredWeeks - 1)} wk</span>`;
            else if(p.suspended > 0) status = `<span style="color:#ef4444; font-size:12px">🟥 Geschorst</span>`;

            const onList = Store.state.transferList.includes(p.id);
            let btnAction = "";
            if(years <= 1) {
                 btnAction = `<button class="primary btn-extend" data-id="${p.id}" style="font-size:10px; padding:4px 6px">✍️ Verleng</button>`;
            } else {
                 const btnClass = onList ? "secondary" : "danger";
                 const btnLabel = onList ? "Terug" : "Verkoop";
                 btnAction = `<button class="${btnClass} btn-list" data-id="${p.id}" style="font-size:10px; padding:4px 6px">${btnLabel}</button>`;
            }

            const face = UTILS.getPlayerFace(p.id);

            h+=`<tr>
                <td><span class="pill ${p.pos === 'K' ? 'pill-gk' : ''}">${p.pos}</span></td>
                <td>
                    <div class="club-row">
                        ${face}
                        <div><strong>${p.flag || ''} ${p.name}</strong><br><span class="muted">${p.age} jr • ${UTILS.fmtMoney(p.wage)}/wk</span></div>
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
        d.innerHTML=h+`</tbody></table><p class="muted" style="font-size:12px; margin-top:10px">* Spelers met nog 1 seizoen contract kun je verlengen. Contracten lopen af aan het einde van het seizoen.</p></div>`;
        return d;
    },

    TransferMarket() {
        const d=document.createElement('div');
        const isOpen = Engine.isTransferWindowOpen();
        const statusColor = isOpen ? "#22c55e" : "#ef4444";
        const statusText = isOpen ? "OPEN" : "GESLOTEN";

        let header = `<h2>Transfermarkt <span class="badge" style="background:${statusColor};color:white;font-size:12px;vertical-align:middle;margin-left:10px">${statusText}</span></h2>`;

        if(!isOpen) {
            d.innerHTML = header + `<div class="card" style="text-align:center; padding:40px; color:var(--text-muted)">
                <div style="font-size:40px; margin-bottom:10px">🔒</div>
                <h3>De transfermarkt is gesloten.</h3>
                <p>Je kunt alleen spelers kopen en verkopen tijdens de zomer- en winterstop.</p>
            </div>`;
            return d;
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

        let marketHtml = `<h3>🛒 Spelers Kopen</h3><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Waarde Indicatie</th><th>Actie</th></tr></thead><tbody>`;
        Store.state.market.forEach(p=>{
            let c=p.ovr>=70?"color:#22c55e":"";
            const min = Math.round(p.value * 0.9); const max = Math.round(p.value * 1.3);
            const face = UTILS.getPlayerFace(p.id);
            marketHtml+=`<tr>
                <td><span class="pill ${p.pos === 'K' ? 'pill-gk' : ''}">${p.pos}</span></td>
                <td>
                    <div class="club-row">
                        ${face}
                        <div><strong>${p.flag || ''} ${p.name}</strong><br><span class="muted">${p.age} jr • ${UTILS.fmtMoney(p.wage)}/wk</span></div>
                    </div>
                </td>
                <td style="${c};font-weight:bold">${p.ovr}</td>
                <td class="money">${UTILS.fmtMoney(min)} - ${UTILS.fmtMoney(max)}</td>
                <td><button class="primary btn-bid" data-id="${p.id}">Bied</button></td>
            </tr>`;
        });
        marketHtml+=`</tbody></table></div>`;
        
        d.innerHTML = header + offersHtml + marketHtml;
        return d;
    },

    YouthAcademy() {
        const d=document.createElement('div');
        const level = Store.state.club.facilities.training;
        if(level < 3) { d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="text-align:center; padding:40px;"><h1 style="font-size:40px">🔒</h1><h3>Academy Gesloten</h3><p class="muted">Je hebt <strong>Trainingscomplex Niveau 3</strong> nodig.</p><p>Huidig niveau: ${level}</p></div>`; return d; }
        
        let listHtml = "";
        if(Store.state.youthAcademy.length === 0) { listHtml = `<p class="muted">Geen talenten. Stuur de scout op pad!</p>`; } 
        else {
            listHtml = `<table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Actie</th></tr></thead><tbody>`;
            Store.state.youthAcademy.forEach(p => { 
                const face = UTILS.getPlayerFace(p.id);
                listHtml += `<tr>
                    <td>${p.pos}</td>
                    <td>
                        <div class="club-row">
                            ${face}
                            <strong>${p.name}</strong> (${p.age} jr)
                        </div>
                    </td>
                    <td>${p.ovr}</td>
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
        const d=document.createElement('div');
        const f = Store.state.club.facilities;
        const btn = (t, l) => l>=8 ? `<button disabled>Max</button>` : `<button class="primary" onclick="Engine.upgradeFacility('${t}')">Upgrade (${UTILS.fmtMoney(CONFIG.costs[t][l])})</button>`;
        d.innerHTML=`<h2>Faciliteiten</h2><div class="card" style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))"><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏟️ Stadion <span class="badge">Lvl ${f.stadium}</span></h3><p class="muted">Meer tickets.</p>${btn('stadium', f.stadium)}</div><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏋️ Training <span class="badge">Lvl ${f.training}</span></h3><p class="muted">Spelersgroei & Jeugd.</p>${btn('training', f.training)}</div><div style="border:1px solid var(--border);padding:15px;border-radius:8px"><h3>🏥 Medisch <span class="badge">Lvl ${f.medical}</span></h3><p class="muted">Minder blessures (Toekomst).</p>${btn('medical', f.medical)}</div></div>`;
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
                let badgeColor = h.result === "Promotie" ? "#22c55e" : (h.result === "Degradatie" ? "#ef4444" : "#facc15");
                let cupTxt = h.cup || "-"; 
                
                rows += `<tr>
                    <td>Seizoen ${h.season}</td>
                    <td>Divisie ${h.division}</td>
                    <td># ${h.rank}</td>
                    <td>${h.points}</td>
                    <td><span class="badge" style="background:${badgeColor}; color:#000">${h.result}</span></td>
                    <td><strong>${cupTxt}</strong></td> 
                </tr>`;
            });
            content = `<div class="card"><table><thead><tr><th>Seizoen</th><th>Divisie</th><th>Pos</th><th>Pt</th><th>Res</th><th>Beker</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        
        d.innerHTML = `<h2>🏆 Hall of Fame</h2>${content}`;
        return d;
    },

    Settings() {
        const d = document.createElement('div');
        d.innerHTML = `
        <h2>⚙️ Instellingen</h2>
        
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