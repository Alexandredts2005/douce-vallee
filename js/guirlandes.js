'use strict';
// ===== Guirlandes (5 styles) : on prend une guirlande en main, on clique un piquet, un coin de maison, un arbre, un lampadaire
// (ou le sol nu : un piquet s'y plante tout seul), puis un autre endroit : la guirlande se tend entre les deux, et on continue
// de point en point. X arrête la guirlande en cours, ou décroche la guirlande visée. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI;
  const ST = {
    guinguette: { n: 'Guirlande guinguette', ico: '💡', step: .55, wire: 0x23272a, need: { fer: 1, herbe: 2 } },
    fanions: { n: 'Guirlande de fanions', ico: '🎏', step: .34, wire: 0xece6d8, need: { herbe: 3 } },
    lampions: { n: 'Guirlande de lampions', ico: '🏮', step: .9, wire: 0x2a2620, need: { herbe: 2, bois: 1 } },
    etoiles: { n: 'Guirlande d\'étoiles', ico: '⭐', step: .42, wire: 0x3a3226, need: { fer: 1, herbe: 1 } },
    noel: { n: 'Guirlande multicolore', ico: '🎄', step: .3, wire: 0x1f4a26, need: { fer: 1, herbe: 2 } } };
  const FLAG = [0xe8434a, 0xffd23f, 0x3f8fe0, 0x4fb35f, 0xff8fc0, 0xfaf7f0], LAMP = [0xe8434a, 0xff9a3a, 0xffd23f, 0xff6f91, 0x3fb3b0], XMAS = [0xff3b3b, 0x3bd16f, 0x5a7bff, 0xffd23f, 0xff8a2a];
  // un motif accroché au fil en (x, y, z) ; ang = direction du fil
  function deco(b, s, x, y, z, k, ang) {
    if (s === 'guinguette') { b.cyl(.024, .024, .06, 8, 0x1b1b1d, x, y - .03, z); b.sph(.058, 0xfff0c4, x, y - .1, z, 1, 1.12, 1, 1, 10, 8); }
    else if (s === 'fanions') { const g = new THREE.ConeGeometry(.1, .19, 3); b.geo(g, FLAG[k % FLAG.length], b.M(x, y - .1, z, PI, ang, 0, 1, 1, .1)); }
    else if (s === 'lampions') { const c = LAMP[k % LAMP.length]; b.cyl(.012, .012, .08, 4, 0x1b1b1d, x, y - .04, z); b.sph(.12, c, x, y - .2, z, 1, 1.18, 1, 1, 12, 9); b.cyl(.06, .06, .03, 10, 0x1b1b1d, x, y - .07, z); b.cyl(.06, .06, .03, 10, 0x1b1b1d, x, y - .33, z); }
    else if (s === 'etoiles') { b.geo(new THREE.OctahedronGeometry(.075, 0), 0xffe08a, b.M(x, y - .08, z, 0, -ang, PI / 4, 1, 1, .35), 1); }
    else { b.cyl(.018, .018, .035, 6, 0x1f4a26, x, y - .02, z); b.sph(.034, XMAS[k % XMAS.length], x, y - .06, z, 1, 1.4, 1, 1, 8, 6); }
  }
  // un tronçon de guirlande de a à b, avec une jolie chaînette (le fil pend au milieu)
  function segment(b, s, a, c) {
    const S = ST[s], dx = c[0] - a[0], dz = c[2] - a[2], len = Math.hypot(dx, c[1] - a[1], dz), sag = Math.min(1.3, .1 + len * .07), ang = Math.atan2(dz, dx);
    const at = t => new THREE.Vector3(a[0] + dx * t, a[1] + (c[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + dz * t);
    const pts = []; for (let i = 0; i <= 16; i++) pts.push(at(i / 16));
    b.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, s === 'fanions' ? .01 : .013, 4, false), S.wire, b.M());
    const n = Math.max(1, Math.floor(len / S.step)); for (let k = 1; k < n; k++) { const p = at(k / n); deco(b, s, p.x, p.y, p.z, k, ang); }
  }
  // objets : le piquet, et des aperçus pour les vignettes de l'inventaire
  MD.piquet_guirlande = () => { const b = G.mb(901); b.cyl(.06, .075, 2.3, 8, 0x8a6a48, 0, 1.15, 0); b.cyl(.09, .09, .06, 8, 0x5e4630, 0, 2.32, 0); b.cyl(.1, .12, .12, 8, 0x6b6f76, 0, .06, 0);
    b.add(new THREE.TorusGeometry(.05, .012, 5, 10), 0x34383c, b.M(0, 2.22, .07, 0, 0, 0), 0, true); return b.done(); };
  O.piquet_guirlande = { id: 'piquet_guirlande', n: 'Piquet à guirlande', model: 'piquet_guirlande', v: 0, fp: [1, 1], h: 2.3, take: 1, cat: 'mobilier' };
  G.ITEMS.piquet_guirlande = { id: 'piquet_guirlande', n: 'Piquet à guirlande', stack: 99, sell: 20, kind: 'place', obj: 'piquet_guirlande', cat: 'mobilier', thumb: 'obj:piquet_guirlande' };
  G.RECIPES.push({ id: 'piquet_guirlande', need: { bois: 2 }, n: 2 });
  for (const s in ST) { const id = 'guirlande_' + s;
    MD[id] = () => { const b = G.mb(910); b.cyl(.05, .06, 1.3, 8, 0x8a6a48, -.8, .65, 0); b.cyl(.05, .06, 1.3, 8, 0x8a6a48, .8, .65, 0); segment(b, s, [-.8, 1.25, 0], [.8, 1.25, 0]); return b.done(); };
    O[id] = { id, n: ST[s].n, model: id, v: 0, fp: [1, 1], h: 1 };
    G.ITEMS[id] = { id, n: ST[s].n, ico: ST[s].ico, stack: 99, sell: 60, kind: 'garland', style: s, cat: 'mobilier', thumb: 'obj:' + id };
    G.RECIPES.push({ id, need: ST[s].need, n: 3 }); }
  // ---------- affichage de toutes les guirlandes du village ----------
  function rebuild(m) {
    if (m._gar) { m.group.remove(m._gar); m._gar.traverse(c => c.geometry && c.geometry.dispose()); } const g = m._gar = new THREE.Group(); m.group.add(g);
    for (const q of m.meta.garlands || []) { if (!ST[q.s]) continue; const b = G.mb(920); segment(b, q.s, q.a, q.b); const me = new THREE.Mesh(b.done(), G.MATS); me.frustumCulled = false; me.castShadow = false; me.receiveShadow = true; g.add(me); }
  }
  G.rebuildGarlands = rebuild;
  // ---------- accrocher ----------
  const GS = G.garland = { a: null, s: null };
  function anchorAt(m, tx, tz, p, plant) {
    // sur une terrasse : on vise ce qui est posé sur le plancher (lampadaire, piquet, parasol…), pas la dalle elle-même
    let o = null; if (m.dk && m.dk.size && m.inb(tx, tz)) { const i = tz * m.W + tx; for (const k of [i, i + m.W * m.H]) { const q = m.dk.get(k); if (q && (!o || q.y > o.y)) o = q; } }
    if (!o) o = m.objAt(tx, tz); if (o && O[o.t] && (O[o.t].plat || O[o.t].floor)) o = null;
    if (o) { const d = O[o.t], [w, dd] = G.fpDims(d, o.r || 0);
      if (o.t === 'piquet_guirlande') return { x: o.x + .5, y: o.y + 2.22, z: o.z + .5 };
      if (d.chop >= 3) return { x: o.x + .5, y: o.y + 2.3, z: o.z + .5 };
      if (d.enter || w * dd >= 4) { const cx = p.x < o.x + w / 2 ? o.x + .1 : o.x + w - .1, cz = p.z < o.z + dd / 2 ? o.z + .1 : o.z + dd - .1; return { x: cx, y: o.y + Math.min(d.h || 3, 4.2) * .68, z: cz }; } // coin de maison, sous l'avant-toit
      return { x: o.x + w / 2, y: o.y + Math.max(.9, Math.min(d.h || 1, 4) * .92), z: o.z + dd / 2 }; }
    if (!plant) return { x: tx + .5, y: m.topAt(tx + .5, tz + .5) + 2.22, z: tz + .5 };
    const dy = G._deckY; G._deckY = m.inb(tx, tz) ? m.topAt(tx + .5, tz + .5) : null; let q = null; // piquet planté sur le plancher s'il y en a un
    try { if (m.canPlace('piquet_guirlande', tx, tz, 0)) q = m.addObj('piquet_guirlande', tx, tz, 0); } finally { G._deckY = dy; }
    if (q) { return { x: tx + .5, y: q.y + 2.22, z: tz + .5, planted: q }; }
    return null;
  }
  function click(it) {
    const m = G.map, p = G.player; if (m !== G.world) { G.ui.toast('Les guirlandes se posent dehors, dans ton village.'); return; }
    const [tx, tz] = p.target(), s = it.style, pt = anchorAt(m, tx, tz, p, true); if (!pt) { G.ui.toast('Impossible d\'accrocher ici.'); G.sfx('error'); return; }
    if (!GS.a || GS.s !== s) { GS.a = pt; GS.s = s; G.sfx('ui'); G.ui.toast('📍 Accroché ! Clique un autre piquet, coin de maison, arbre ou le sol pour tendre la guirlande · X pour arrêter.', 6000); return; }
    const a = GS.a, len = Math.hypot(pt.x - a.x, pt.z - a.z); if (len < .8) return;
    if (len > 26) { G.ui.toast('Trop loin : 26 cases au plus entre deux points.'); if (pt.planted) m.removeObj(pt.planted); return; }
    if (G.mode !== 'creatif' && !G.inv.useHeld(1)) { GS.a = null; return; }
    (m.meta.garlands = m.meta.garlands || []).push({ s, a: [a.x, a.y, a.z], b: [pt.x, pt.y, pt.z] }); m.rev++; rebuild(m); GS.a = pt; G.sfx('place');
    if (G.mode !== 'creatif' && !G.inv.held()) { GS.a = null; G.ui.toast('Plus de guirlande en main.'); }
  }
  // distance (au sol) entre un point et un tronçon
  const segDist = (q, x, z) => { const ax = q.a[0], az = q.a[2], bx = q.b[0] - ax, bz = q.b[2] - az, L2 = bx * bx + bz * bz || 1, t = G.clamp(((x - ax) * bx + (z - az) * bz) / L2, 0, 1); return Math.hypot(x - ax - bx * t, z - az - bz * t); };
  // aperçu du fil pendant qu'on tend la guirlande
  let prev = null; const pmat = G.curveMat(new THREE.LineBasicMaterial({ color: 0xfff2c4, transparent: true, opacity: .85 }));
  G.on('init', () => {
    const ou = G.act.use; G.act.use = () => { const it = G.inv.held(), p = G.player; if (it && it.kind === 'garland' && !p.vehicle && !p.sit && !p.swim) return click(it); return ou(); };
    const ot = G.act.take; G.act.take = () => { const it = G.inv.held(), m = G.map;
      if (GS.a) { GS.a = null; G.ui.toast('Guirlande terminée.'); G.sfx('ui'); return; }
      if (it && it.kind === 'garland' && m === G.world && (m.meta.garlands || []).length) { const [tx, tz] = G.player.target(); let bi = -1, bd = 1.3; m.meta.garlands.forEach((q, i) => { const d = segDist(q, tx + .5, tz + .5); if (d < bd) { bd = d; bi = i; } });
        if (bi >= 0) { const q = m.meta.garlands.splice(bi, 1)[0]; m.rev++; rebuild(m); if (G.mode !== 'creatif') G.inv.add('guirlande_' + q.s, 1); G.sfx('pickup'); G.ui.toast('Guirlande décrochée.'); return; } }
      return ot(); };
  });
  G.on('update', () => {
    const it = G.inv && G.inv.held(), m = G.map; if (GS.a && (!it || it.kind !== 'garland' || it.style !== GS.s || m !== G.world)) GS.a = null;
    if (!GS.a) { if (prev) prev.visible = false; return; }
    if (!prev) { prev = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), pmat); prev.frustumCulled = false; G.scene.add(prev); }
    const [tx, tz] = G.player.target(), pt = anchorAt(m, tx, tz, G.player, false), P = prev.geometry.attributes.position; P.setXYZ(0, GS.a.x, GS.a.y, GS.a.z); P.setXYZ(1, pt.x, pt.y, pt.z); P.needsUpdate = true; prev.visible = true;
  });
  G.on('load', () => { if (G.world) rebuild(G.world); }); G.on('newGame', () => { GS.a = null; if (G.world) rebuild(G.world); });
})();
