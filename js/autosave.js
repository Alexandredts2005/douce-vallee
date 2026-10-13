'use strict';
// ===== Sauvegarde automatique : dès que l'on change quelque chose (construire, poser, couper, terrain, intérieur, inventaire, clochettes)
// la partie est enregistrée quelques secondes plus tard, et aussi quand on ferme ou quitte la page. Activable dans Options et dans le menu pause. =====
(function () {
  const $ = G.el;
  if (G.settings.autosave == null) G.settings.autosave = true;
  const on = () => G.settings.autosave !== false;
  const A = G.autosave = { sig: null, dirty: false, last: 0, change: 0, t: 0 };
  // petit indicateur discret dans le coin
  const ind = document.createElement('div'); ind.id = 'autosave-ind'; ind.textContent = '💾 Sauvegardé';
  ind.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:60;background:rgba(255,255,255,.88);color:#5a3a22;font:700 13px Nunito,sans-serif;padding:5px 10px;border-radius:12px;box-shadow:0 2px 0 rgba(0,0,0,.12);opacity:0;transition:opacity .4s;pointer-events:none';
  document.body.appendChild(ind); let indT = 0;
  const flash = () => { ind.style.opacity = '1'; clearTimeout(indT); indT = setTimeout(() => ind.style.opacity = '0', 1400); };
  const canSave = () => on() && G.world && (G.state === 'play' || G.state === 'pause') && !(G.move && G.move.c) && !G.ui.fading;
  const save = () => { if (!canSave()) return false; G.saveGame(true); A.dirty = false; A.last = performance.now(); flash(); return true; };
  // empreinte de ce qui compte dans la partie (pas la position du joueur, enregistrée à chaque sauvegarde)
  const sig = () => { let s = G.world ? G.world.rev : 0; for (const id in G.interiors || {}) s += G.interiors[id].rev * 7; if (G.rueMap) s += G.rueMap.rev * 13; s += (G.coins || 0) * 17;
    const inv = G.inv; if (inv) { for (const x of inv.slots || []) if (x) s += (x.n || 1) * 31 + x.id.length; for (const x of inv.hot || []) if (x) s += (typeof x === 'string' ? x.length : 1) * 3; } return s; };
  G.on('update', dt => {
    if (!on() || G.state !== 'play') return; A.t += dt; if (A.t < 1) return; A.t = 0;
    const s = sig(), now = performance.now(); if (A.sig == null) A.sig = s;
    if (s !== A.sig) { A.sig = s; A.dirty = true; A.change = now; if (!A.first) A.first = now; }
    // on enregistre 3 s après la dernière modification, ou au plus tard toutes les 20 s pendant qu'on construit
    if (A.dirty && now - A.last > 4000 && (now - A.change > 3000 || now - A.first > 20000)) { if (save()) A.first = 0; }
  });
  G.on('load', () => { A.sig = null; A.dirty = false; }); G.on('newGame', () => { A.sig = null; A.dirty = false; });
  // en quittant la page ou en changeant d'onglet
  const bye = () => { if (canSave()) try { G.saveGame(true); } catch (e) { } };
  window.addEventListener('pagehide', bye); window.addEventListener('beforeunload', bye);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bye(); });
  // ---------- les réglages : Options et menu pause ----------
  G.on('init', () => {
    const back = $('o-back'), row = back && back.parentNode; if (row && !$('o-autosave')) { const d = document.createElement('div'); d.className = 'opt'; d.innerHTML = 'Sauvegarde automatique (tout ce que tu fais est enregistré tout seul)<input type="checkbox" id="o-autosave">'; row.parentNode.insertBefore(d, row);
      $('o-autosave').checked = on(); $('o-autosave').addEventListener('change', () => { G.settings.autosave = $('o-autosave').checked; G.ui.saveSettings(); G.ui.toast(on() ? '💾 Sauvegarde automatique activée.' : 'Sauvegarde automatique désactivée : pense à sauvegarder dans le menu.'); }); }
    if (row && !$('o-assist')) { const d = document.createElement('div'); d.className = 'opt'; d.innerHTML = 'Aide au déplacement en créatif (saute les ruisseaux et les marches, passe entre les obstacles)<input type="checkbox" id="o-assist">'; row.parentNode.insertBefore(d, row);
      $('o-assist').checked = G.settings.assist !== false; $('o-assist').addEventListener('change', () => { G.settings.assist = $('o-assist').checked; G.ui.saveSettings(); }); }
    const pm = $('p-save') && $('p-save').parentNode; if (pm && !$('p-autosave')) { const b = document.createElement('button'); b.className = 'mbtn'; b.id = 'p-autosave'; pm.insertBefore(b, $('p-save').nextSibling);
      const label = () => b.innerHTML = '<span class="e">' + (on() ? '💾' : '⏸️') + '</span>Sauvegarde auto : ' + (on() ? 'oui' : 'non');
      b.onclick = () => { G.settings.autosave = !on(); G.ui.saveSettings(); if ($('o-autosave')) $('o-autosave').checked = on(); label(); G.sfx('ui'); if (on()) save(); }; label();
      const op = G.ui.pause; G.ui.pause = () => { op(); label(); }; }
    const oa = G.ui.applySettings; if (oa) G.ui.applySettings = () => { oa(); if ($('o-autosave')) $('o-autosave').checked = on(); };
  });
})();
