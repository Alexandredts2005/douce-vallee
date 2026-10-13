'use strict';
// ===== Déplacer un bâtiment déjà construit (touche B) : la mairie, les maisons, la boutique, le musée, les monuments…
// B devant le bâtiment pour le soulever, on marche jusqu'à la nouvelle place (R pour tourner), B pour le poser, X pour annuler.
// Les habitants, les portes, les icônes de la carte suivent le bâtiment. =====
(function () {
  const O = G.OBJ, KEEP = ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt'];
  const NO = new Set(['voie', 'rails', 'tunnel', 'tunnel2', 'gare', 'gare_provence', 'grande_porte', 'signal_pn', 'paillasson', 'ponton', 'pont', 'passage_niveau']);
  const MV = G.move = { c: null };
  let ghost = null, gmat = null;
  const free = () => G.state === 'play' && !G.ui.modal && !G.ui.fading;
  function makeGhost(c) {
    if (!gmat) gmat = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x8fe39a, transparent: true, opacity: .45, depthWrite: false }));
    const d = O[c.t]; ghost = new THREE.Mesh(G.getGeo(d.model, c.ex.v != null ? c.ex.v : d.v || 0), gmat); ghost.frustumCulled = false; ghost.renderOrder = 6; G.scene.add(ghost);
  }
  const dropGhost = () => { if (ghost) { G.scene.remove(ghost); ghost = null; } };
  const spot = c => { const m = G.world, d = O[c.t], r = G.placeRot || 0, [tx, tz] = G.player.target(), [ax, az] = G.act.anchor(d, r, tx, tz); return { ax, az, r, ok: m.canPlace(c.t, ax, az, r) && !G.act.occupiedByMe(d, r, ax, az) }; };
  // ---------- soulever ----------
  function lift() {
    const m = G.world, p = G.player; if (G.map !== m || m.isVisit || (G.net && G.net.visit)) { G.ui.toast('On ne déplace les bâtiments que dans son propre village.'); return; }
    const [tx, tz] = p.target(); let o = m.objAt(tx, tz); if (!o) o = m.objAt(Math.floor(p.x), Math.floor(p.z));
    if (!o) { G.ui.toast('Place-toi devant un bâtiment, puis appuie sur B pour le déplacer.'); return; }
    const d = O[o.t]; if (NO.has(o.t) || d.fixedPlace) { G.ui.toast('« ' + d.n + ' » ne peut pas être déplacé.'); G.sfx('error'); return; }
    const ex = {}; for (const k of KEEP) if (o[k] != null) ex[k] = o[k]; const [cx, cz] = m.center(o), [w, dd] = G.fpDims(d, o.r || 0);
    MV.c = { t: o.t, ex, x: o.x, z: o.z, r: o.r || 0, cx, cz, box: [o.x - 3, o.z - 3, o.x + w + 3, o.z + dd + 3] }; G.placeRot = o.r || 0;
    m.removeObj(o); makeGhost(MV.c); G.sfx('pickup'); G.fx.puff(cx, o.y + .5, cz, 12, 0xf3ead2, .9);
    G.ui.toast('🏗️ Tu déplaces « ' + d.n + ' ». Marche jusqu\'à la nouvelle place · R pour tourner · B pour poser · X pour annuler.', 8000);
  }
  // ---------- poser : tout ce qui était attaché au bâtiment le suit ----------
  function follow(m, c, dx, dz) {
    const b = c.box, inB = q => q && typeof q.x === 'number' && typeof q.z === 'number' && q.x >= b[0] && q.x <= b[2] && q.z >= b[1] && q.z <= b[3], mv = q => { q.x += dx; q.z += dz; };
    for (const k in m.meta) { const v = m.meta[k]; if (!v || typeof v !== 'object' || ['layout', 'train', 'track', 'rueGate', 'aerodrome'].includes(k)) continue;
      if (Array.isArray(v)) { for (const q of v) if (q && typeof q === 'object' && !Array.isArray(q) && inB(q)) mv(q); }
      else if (k === 'homesP') { for (const id in v) if (inB(v[id])) mv(v[id]); } else if (inB(v)) mv(v); }
    for (const e of G.ents.villagers) if (e.map === m && e.fixed && inB(e.home)) { mv(e.home); e.x += dx; e.z += dz; }
    for (const id in G.interiors) { const dm = G.interiors[id].meta && G.interiors[id].meta.door; if (dm && inB(dm)) mv(dm); }
  }
  function drop() {
    const c = MV.c, m = G.world, s = spot(c); if (!s.ok) { G.ui.toast('Pas de place ici : il faut un terrain plat et libre.'); G.sfx('error'); return; }
    const o = m.addObj(c.t, s.ax, s.az, s.r, c.ex), [cx, cz] = m.center(o); follow(m, c, cx - c.cx, cz - c.cz);
    MV.c = null; dropGhost(); G.sfx('place'); G.fx.puff(cx, o.y + .3, cz, 16, 0xf3ead2, 1.1); G.ui.mmRev = -1; G.ui.toast('✅ « ' + O[c.t].n + ' » est à sa nouvelle place !'); G.saveGame(true);
  }
  // annuler : le bâtiment retourne à sa place (ou juste à côté si elle a été prise)
  function cancel(quiet) {
    const c = MV.c; if (!c) return; const m = G.world; MV.c = null; dropGhost();
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) if (m.canPlace(c.t, c.x + dx, c.z + dz, c.r)) { m.addObj(c.t, c.x + dx, c.z + dz, c.r, c.ex); if (!quiet) G.ui.toast('Déplacement annulé.'); return; }
    m.addObj(c.t, c.x, c.z, c.r, c.ex);
  }
  G.on('update', () => {
    const I = G.input; if (!free()) return;
    if (I.ch('b')) { if (MV.c) drop(); else lift(); }
    if (!MV.c || !ghost) return; const s = spot(MV.c), m = G.world, d = O[MV.c.t], [w, dd] = G.fpDims(d, s.r), x = s.ax + w / 2, z = s.az + dd / 2;
    ghost.position.set(x, m.terrainH(x, z) + .02, z); ghost.rotation.set(0, s.r * Math.PI / 2, 0); gmat.color.setHex(s.ok ? 0x8fe39a : 0xff8a80);
  });
  // X annule pendant un déplacement ; on ne perd jamais un bâtiment (sauvegarde, menu, changement de carte)
  G.on('init', () => {
    const ot = G.act.take; G.act.take = () => MV.c ? cancel() : ot();
    const os = G.serialize; G.serialize = () => { if (MV.c) cancel(true); return os(); };
    const ott = G.toTitle; G.toTitle = () => { if (MV.c) cancel(true); return ott(); };
  });
  G.on('enterMap', m => { if (MV.c && m !== G.world) cancel(true); });
})();
