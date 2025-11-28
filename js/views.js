import { Store } from './store.js';
import { CONFIG } from './config.js';
import { UTILS } from './utils.js';

export const Views = {
    Welcome() {
        const d=document.createElement('div'); d.className="card"; d.style.textAlign="center"; d.style.maxWidth="400px"; d.style.margin="100px auto";
        d.innerHTML=`<h1>${CONFIG.gameTitle}</h1><p class="muted">Start je carrière.</p><div style="margin:30px 0"><label style="display:block;margin-bottom:10px">Clubnaam</label><input type="text" id="inp-name" value="FC Breda" style="padding:10px;width:100%;border-radius:8px;border:1px solid #444;background:var(--bg-body);color:var(--text-main)"></div><button class="primary" id="btn-start" style="width:100%">Start Carrière</button>`;
        return d;
    },

    Dashboard() {
        const d=document.createElement('div');
        let offersHtml = "";
        if(Store.state.incomingOffers.length > 0) offersHtml = `<div style="background:rgba(34,197,94,0.15); border:1px solid #22c55e; padding:15px; border-radius:8px; margin-bottom:20px;"><strong>🚨 Je hebt ${Store.state.incomingOffers.length} nieuw(e) bod(en)!</strong><br><span style="font-size:13px">Ga naar Transfermarkt.</span></div>`;
        
        let sponsorHtml = "";
        if(Store.state.club.sponsor) sponsorHtml = `<div style="margin-bottom:15px; padding:10px; border-radius:8px; background:rgba(34, 197, 94, 0.1); border:1px solid #22c55e;">Sponsor: <strong>${Store.state.club.sponsor.name}</strong> (+ ${UTILS.fmtMoney(Store.state.club.sponsor.amount)}/wk)</div>`;
        else sponsorHtml = `<div style="margin-bottom:15px; padding:10px; border-radius:8px; background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444;">⚠️ <strong>Geen sponsor!</strong> Ga snel naar Sponsors om een deal te sluiten.</div>`;
        
        let cupHtml = "";
        if(Store.state.cup && Store.state.cup.active) {
            const c = Store.state.cup;
            const status = c.inTournament ? "<span style='color:#22c55e'>Je zit nog in het toernooi!</span>" : "<span style='color:#ef4444'>Uitgeschakeld.</span>";
            cupHtml = `<div class="card" style="margin-bottom:15px; border-left:4px solid #facc15"><h3>🏆 KNVB Beker</h3><p>${status}</p></div>`;
        }

        const r = Store.state.results.find(x=>x.isYou);
        let resHTML = r ? `<div style="font-size:20px;font-weight:bold;border-left:4px solid #22c55e;padding-left:10px;margin-top:10px">${r.home} ${r.score[0]} - ${r.score[1]} ${r.away}</div>` : `<p class="muted">Nog geen wedstrijd gespeeld.</p>`;
        d.innerHTML=`<h2>Overzicht</h2>${offersHtml}${sponsorHtml}${cupHtml}<div class="card"><p>Welkom bij <strong>${Store.state.club.name}</strong>.</p><hr style="border:0;border-top:1px dashed var(--border);margin:15px 0"><h3>Laatste resultaat</h3>${resHTML}</div>`;
        return d;
    },
    
    Cup() {
        const d = document.createElement('div');
        const c = Store.state.cup;
        let hist = "";
        if(c.history.length === 0) hist = "<p class='muted'>Nog geen wedstrijden gespeeld.</p>";
        else c.history.forEach(h => { hist += `<div style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between"><span><strong>${h.round}</strong> vs ${h.opponent}</span><span style="font-weight:bold; color:${h.win?'#22c55e':'#ef4444'}">${h.score[0]} - ${h.score[1]}</span></div>`; });
        let status = c.inTournament ? `<div style="padding:20px; text-align:center; background:rgba(34,197,94,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Je zit nog in de race!</h2><p>Volgende ronde rond speeldag ${c.nextRound}</p></div>` : `<div style="padding:20px; text-align:center; background:rgba(239,68,68,0.1); border-radius:8px; margin-bottom:20px"><h2 style="margin:0">Helaas, uitgeschakeld.</h2></div>`;
        d.innerHTML = `<h2>KNVB Beker</h2>${status}<div class="card"><h3>Geschiedenis</h3>${hist}</div>`;
        return d;
    },

    Sponsors() {
        const d=document.createElement('div');
        if(Store.state.club.sponsor) {
            let s = Store.state.club.sponsor;
            d.innerHTML=`<h2>Sponsor</h2><div class="card" style="text-align:center"><h1>${s.name}</h1><h3>${UTILS.fmtMoney(s.amount)} / week</h3><p class="muted">Looptijd: nog <strong>${s.weeksLeft}</strong> weken</p></div>`;
        } else {
            let h=`<h2>Sponsors</h2><div class="card">`;
            Store.state.club.sponsorOffers.forEach(o=>{h+=`<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border)"><div><strong>${o.name}</strong><br>${UTILS.fmtMoney(o.amount)}<br><span class="muted">${o.duration} weken</span></div><button class="primary" onclick="Engine.signSponsor('${o.id}')">Teken</button></div>`});
            d.innerHTML=h+`</div>`;
        } 
        return d; 
    },

Squad() {
        const d=document.createElement('div');
        // Extra header: Con (Contract)
        let h=`<h2>Jouw Selectie</h2><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Con</th><th>Waarde</th><th>Actie</th></tr></thead><tbody>`;
        
        Store.state.team.forEach(p=>{
            let c = p.ovr>=70 ? "color:#22c55e" : "";
            
            // Contract kleur logic
            let conColor = "";
            let conText = `${p.contract} wkn`;
            if(p.contract <= 5) { conColor = "color:#ef4444; font-weight:bold"; conText += " ⚠️"; }
            else if(p.contract <= 10) { conColor = "color:#facc15"; }

            const onList = Store.state.transferList.includes(p.id);
            
            // We maken een dropdown-achtige actie kolom of gewoon twee kleine knoppen
            // Om ruimte te besparen: Als contract < 10 weken is, toon "Verleng" knop. Anders "Verkoop" knop.
            let btnAction = "";
            
            if(p.contract <= 10) {
                 btnAction = `<button class="primary btn-extend" data-id="${p.id}" style="font-size:10px; padding:4px 6px">✍️ Verleng</button>`;
            } else {
                 const btnClass = onList ? "secondary" : "danger";
                 const btnLabel = onList ? "Terug" : "Verkoop";
                 btnAction = `<button class="${btnClass} btn-list" data-id="${p.id}" style="font-size:10px; padding:4px 6px">${btnLabel}</button>`;
            }

            h+=`<tr>
                <td><span class="pill">${p.pos}</span></td>
                <td><strong>${p.name}</strong><br><span class="muted">${p.age} jr</span></td>
                <td style="${c};font-weight:bold">${p.ovr}</td>
                <td style="${conColor}">${conText}</td>
                <td class="money">${UTILS.fmtMoney(p.value)}</td>
                <td>${btnAction}</td>
            </tr>`;
        });
        d.innerHTML=h+`</tbody></table><p class="muted" style="font-size:12px; margin-top:10px">* Spelers met < 10 weken contract kun je verlengen. Als het contract op 0 komt, vertrekken ze gratis.</p></div>`;
        return d;
    },

    TransferMarket() {
        const d=document.createElement('div');
        let offersHtml = "";
        if(Store.state.incomingOffers.length > 0) {
            offersHtml += `<h3>📩 Binnenkomende Biedingen</h3><div class="card">`;
            Store.state.incomingOffers.forEach(o => { offersHtml += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border); padding:10px 0;"><div><span class="muted">Club:</span> <strong>${o.club}</strong><br><span class="muted">Speler:</span> <strong>${o.playerName}</strong><br><span class="muted">Bod:</span> <span style="color:#22c55e; font-weight:bold">${UTILS.fmtMoney(o.amount)}</span></div><div style="display:flex; gap:5px;"><button class="primary btn-acc" data-id="${o.id}">✅</button><button class="danger btn-rej" data-id="${o.id}">❌</button></div></div>`; });
            offersHtml += `</div>`;
        } else { offersHtml = `<div class="card" style="padding:15px; text-align:center; color:#aaa">Geen openstaande biedingen.</div>`; }

        let marketHtml = `<h3>🛒 Spelers Kopen</h3><div class="card"><table><thead><tr><th>Pos</th><th>Naam</th><th>OVR</th><th>Waarde Indicatie</th><th>Actie</th></tr></thead><tbody>`;
        Store.state.market.forEach(p=>{
            let c=p.ovr>=70?"color:#22c55e":"";
            const min = Math.round(p.value * 0.9); const max = Math.round(p.value * 1.3);
            marketHtml+=`<tr><td><span class="pill">${p.pos}</span></td><td><strong>${p.name}</strong><br><span class="muted">${p.age} jr</span></td><td style="${c};font-weight:bold">${p.ovr}</td><td class="money">${UTILS.fmtMoney(min)} - ${UTILS.fmtMoney(max)}</td><td><button class="primary btn-bid" data-id="${p.id}">Bied</button></td></tr>`;
        });
        marketHtml+=`</tbody></table></div>`;
        d.innerHTML = `<h2>Transfermarkt</h2>` + offersHtml + marketHtml;
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
            Store.state.youthAcademy.forEach(p => { listHtml += `<tr><td>${p.pos}</td><td><strong>${p.name}</strong> (${p.age} jr)</td><td>${p.ovr}</td><td><button class="primary btn-sign" data-id="${p.id}">Contract (€ 5.000)</button></td></tr>`; });
            listHtml += `</tbody></table>`;
        }
        d.innerHTML = `<h2>Jeugdopleiding</h2><div class="card" style="display:flex; justify-content:space-between; align-items:center"><div><h3>Hoofd Scout</h3><div class="muted">Kost per sessie: <strong>€ 25.000</strong></div></div><button class="primary" id="btn-scout">🔎 Scout Talent</button></div><h3>Gescout Talent</h3><div class="card">${listHtml}</div>`;
        return d;
    },

    Tactics() {
        const d=document.createElement('div');
        let h=`<h2>Tactiek</h2><div class="card" style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr))">`;
        for(let k in CONFIG.tactics) {
            let t = CONFIG.tactics[k];
            let active = Store.state.club.tactic === k ? "border:2px solid #22c55e;background:rgba(34,197,94,0.1)" : "border:1px solid var(--border)";
            h+=`<div onclick="Engine.setTactic('${k}')" style="padding:15px;border-radius:8px;cursor:pointer;${active}"><h3>${t.name}</h3><p class="muted" style="font-size:12px">${t.desc}</p></div>`;
        }
        d.innerHTML=h+`</div>`;
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
        
        let h=`<h2>Competitie</h2><div class="card">${c}<table><thead><tr><th>#</th><th>Club</th><th>G</th><th>W</th><th>G</th><th>V</th><th>Pt</th></tr></thead><tbody>`; 
        let t=[...Store.state.competitions[v]].sort((a,b)=>b.pts-a.pts); 
        
        t.forEach((x,i)=>{
            let s = "";
            let rowClass = "";
            if(x.id===Store.state.club.id) { rowClass += " my-club"; }
            if(v > 1 && i < 2) { rowClass += " promo"; }
            if(v < 5 && i >= t.length - 2) { rowClass += " rele"; }

            h+=`<tr class="${rowClass}"><td>${i+1}</td><td>${x.name}</td><td>${x.played}</td><td>${x.won}</td><td>${x.draw}</td><td>${x.lost}</td><td><strong>${x.pts}</strong></td></tr>`
        }); 
        d.innerHTML=h+`</tbody></table></div>`; 
        return d; 
    },

    Fixtures() { const d=document.createElement('div'); let h=`<h2>Uitslagen</h2><div class="card"><table>`; if(Store.state.results.length===0)h+="<p class='muted'>Geen data</p>"; else Store.state.results.forEach(r=>{h+=`<tr><td align="right">${r.home}</td><td align="center"><b>${r.score[0]}-${r.score[1]}</b></td><td>${r.away}</td></tr>`}); d.innerHTML=h+`</table></div>`; return d; },
    Finance() { const d=document.createElement('div'); const f=Store.state.finance.lastWeek; let l=""; f.breakdown.forEach(x=>l+=`<div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--border);padding:5px 0"><span>${x.txt}</span><span style="color:${x.amt>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(x.amt)}</span></div>`); d.innerHTML=`<h2>Financiën</h2><div class="card"><h3 style="text-align:center;margin-bottom:20px">${UTILS.fmtMoney(Store.state.club.budget)}</h3><h4>Weekrapport</h4>${l}<div style="display:flex;justify-content:space-between;margin-top:10px;font-weight:bold;font-size:18px"><span>Totaal</span><span style="color:${f.profit>=0?'#22c55e':'#ef4444'}">${UTILS.fmtMoney(f.profit)}</span></div></div>`; return d; },
    History() {
        const d = document.createElement('div');
        const hist = Store.state.history || [];
        
        let content = "";
        if(hist.length === 0) {
            content = `<div class="card" style="text-align:center; padding:30px;"><span style="font-size:40px">📜</span><h3>Nog geen historie</h3><p class="muted">Speel een seizoen uit om hier data te zien.</p></div>`;
        } else {
            let rows = "";
            // Sorteer op seizoen (nieuwste bovenaan)
            [...hist].reverse().forEach(h => {
                let badgeColor = h.result === "Promotie" ? "#22c55e" : (h.result === "Degradatie" ? "#ef4444" : "#facc15");
                rows += `<tr>
                    <td>Seizoen ${h.season}</td>
                    <td>Divisie ${h.division}</td>
                    <td># ${h.rank}</td>
                    <td>${h.points}</td>
                    <td><span class="badge" style="background:${badgeColor}; color:#000">${h.result}</span></td>
                </tr>`;
            });
            content = `<div class="card"><table><thead><tr><th>Seizoen</th><th>Competitie</th><th>Positie</th><th>Punten</th><th>Resultaat</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        
        d.innerHTML = `<h2>🏆 Hall of Fame</h2>${content}`;
        return d;
    },
};