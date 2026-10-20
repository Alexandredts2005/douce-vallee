'use strict';
// ===== Grottes : avec la pelle, face à une paroi de plus d'un niveau de haut (2 niveaux ou plus au-dessus de ses pieds),
// on creuse une galerie SOUS la montagne. Dessus, rien ne change : la même herbe, on marche dessus comme avant.
// Dessous, un vrai passage : sol de gravier, parois de terre en couches, plafond de roche à stalactites, entrée en arc de rochers,
// parfois des cristaux qui brillent ou des champignons lumineux. On creuse en trois coups de pelle (la paroi se fissure, puis s'écroule)
// et on prolonge la galerie dans tous les sens. Dans la grotte, la caméra suit le joueur dans le tunnel, et une petite lueur l'accompagne.
// Chaque paroi abattue rapporte de la pierre (parfois du fer, de l'or ou un fossile). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, CL = G.CAVE_CL = 2.25; // CL : hauteur sous plafond
  const SK = () => G.SK || {};
  const ROCK = 0x7f705e, ROCKD = 0x5e5446, ROCKL = 0x948573, GRAV = 0x8a8274, BANDS = [0xa97d51, 0x9a6f47, 0xb88b5c, 0x8f6640, 0xa57a4f];
  const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]], ROT = [0, -PI / 2, PI, PI / 2]; // N, E, S, O (le côté nord est construit puis tourné)
  const NEW = 32; // les galeries sous la montagne (les toutes premières grottes abaissaient le terrain : on les remet d'aplomb au chargement)

  // ---------- la galerie : modèle « grotte_k_cccc_v », origine au niveau de l'herbe, sol k niveaux plus bas ----------
  // c (par côté) : r paroi, o galerie voisine, e entrée ; v : variante (cristaux, champignons, stalagmites, rien)
  function build(name) { const [, ks, sides, vs] = name.split('_'), k = +ks, F = -k * T, vr = +vs[0], b = G.mb(2700 + k * 7 + vr), sk = SK(), r = G.rng(k * 31 + vr * 7 + sides.charCodeAt(0) + sides.charCodeAt(2) * 3);
    const rotM = (i, x, y, z) => new THREE.Matrix4().makeRotationY(ROT[i]).multiply(new THREE.Matrix4().makeTranslation(x, y, z));
    // sol de gravier et cailloux, plafond de roche et stalactites
    b.S(sk.stone); b.jit(.1); b.box(1.0, .12, 1.0, GRAV, 0, F - .06, 0); b.box(1.0, .16, 1.0, ROCKD, 0, F + CL + .08, 0); b.jit(0);
    for (let i = 0; i < 7; i++) b.add(new THREE.IcosahedronGeometry(.03 + r() * .04, 0), i % 2 ? 0x9a9286 : 0x6f685c, b.M((r() - .5) * .85, F + .01, (r() - .5) * .85, 0, r() * PI, 0, 1, .6, 1), 0, false);
    for (let i = 0; i < 4 + Math.floor(r() * 4); i++) { const h = .1 + r() * .32, rr = .025 + r() * .045; b.add(new THREE.ConeGeometry(rr, h, 6), i % 2 ? ROCKL : ROCK, b.M((r() - .5) * .8, F + CL - h / 2 + .01, (r() - .5) * .8, PI, r() * PI, 0), 0, false); }
    for (let i = 0; i < 4; i++) { const c = sides[i];
      if (c === 'r') { // paroi de terre en couches, quelques pierres et des racines qui pendent
        for (let y = 0, n = 0; y < CL - .005; n++) { const h = Math.min(CL - y, .2 + ((n * 5 + i) % 3) * .07); b.add(new THREE.BoxGeometry(1.0, h, .08), BANDS[(n + vr + i) % 5], rotM(i, 0, F + y + h / 2, -.5 + .04), 0, false); y += h; }
        for (let j = 0; j < 5; j++) b.add(new THREE.IcosahedronGeometry(.04 + r() * .06, 0), j % 2 ? 0x8a8580 : 0xa6a199, rotM(i, (r() - .5) * .85, F + .15 + r() * (CL - .3), -.5 + .08).multiply(new THREE.Matrix4().makeScale(1, .8, .5)), 0, false);
        if (r() < .5) { const x = (r() - .5) * .7; b.add(new THREE.CylinderGeometry(.006, .012, .35, 4), 0x6a4a2a, rotM(i, x, F + CL - .17, -.5 + .1).multiply(new THREE.Matrix4().makeRotationZ(.2)), 0, false); } }
      else if (c === 'e') { // l'entrée : un arc de gros rochers et une clé de voûte
        const pts = []; for (let y = .15; y < 1.6; y += .4) for (const s of [-1, 1]) pts.push([s * .44, y]); for (let a = 0; a <= 6; a++) { const t = a / 6 * PI; pts.push([Math.cos(t) * .44, 1.62 + Math.sin(t) * .5]); }
        pts.forEach(([x, y], j) => b.add(new THREE.IcosahedronGeometry(.12 + (j % 3) * .025, 0), j % 2 ? ROCK : ROCKL, rotM(i, x, F + y, -.5 + .03).multiply(new THREE.Matrix4().makeRotationY(j)), 0, false));
        b.add(new THREE.BoxGeometry(.2, .24, .2), ROCKL, rotM(i, 0, F + 2.12, -.5 + .04), 0, false); } }
    b.S(null);
    // trésors : cristaux contre une paroi, champignons lumineux, stalagmites
    const wall = [0, 1, 2, 3].filter(i => sides[i] === 'r'), wi = wall.length ? wall[vr % wall.length] : -1;
    if (vr === 0 && wi >= 0) { const col = k % 2 ? 0xb48ae8 : 0x7ad8f0; for (let j = 0; j < 5; j++) { const h = .16 + r() * .3, x = (r() - .5) * .6, z = -.36 + r() * .1, tilt = (r() - .5) * .7;
        b.add(new THREE.CylinderGeometry(.035, .045, h, 6), col, rotM(wi, x, F + h / 2, z).multiply(new THREE.Matrix4().makeRotationZ(tilt)), 1, false);
        b.add(new THREE.ConeGeometry(.035, .08, 6), 0xffffff, rotM(wi, x - Math.sin(tilt) * h * .5, F + h + .03, z).multiply(new THREE.Matrix4().makeRotationZ(tilt)), 1, false); } }
    else if (vr === 1) for (let j = 0; j < 6; j++) { const x = (r() - .5) * .7, z = (r() - .5) * .7, h = .05 + r() * .08; b.cyl(.01, .012, h, 6, 0xe8e2d0, x, F + h / 2, z); b.sph(.035 + r() * .02, 0x6af0d0, x, F + h + .01, z, 1, .45, 1, 1, 8, 6); }
    else if (vr === 2) for (let j = 0; j < 3; j++) { const h = .15 + r() * .3, x = (r() - .5) * .6, z = (r() - .5) * .6; b.add(new THREE.ConeGeometry(.06 + r() * .04, h, 6), ROCKL, b.M(x, F + h / 2, z), 0, false); }
    return b.done(); }
  const ogg = G.getGeo; G.getGeo = (name, v = 0) => { if (typeof name === 'string' && name.startsWith('grotte_') && !MD[name]) MD[name] = () => build(name); return ogg(name, v); };

  // ---------- l'objet et le registre des galeries de la carte ----------
  const depth = o => ((o.v || 0) & 15) || 2, floorY = o => o.y - depth(o) * T;
  O.grotte = { id: 'grotte', n: 'Galerie de grotte', model: 'grotte', v: 2 | NEW, fp: [1, 1], h: 0, walk: 1, cave: 1, keyOf: (v, o) => (o && o._gk) || 'grotte_' + ((v & 15) || 2) + '_rrrr_3' + ':0' };
  const isCave = q => !!(q && q.t === 'grotte');
  G.caveAt = (m, tx, tz) => { const c = m && m.caves; if (!c || !c.size || !m.inb(tx, tz)) return null; return c.get(tz * m.W + tx) || null; };
  G.caveFloor = (m, i) => { const o = m.caves && m.caves.get(i); return o ? floorY(o) : null; }; // pour world.js : l'entrée est ouverte dans la falaise
  function relink(m, o) { if (!m.list.has(o)) return; const k = depth(o), F = floorY(o); let s = '';
    for (const [dx, dz] of NB) { const x = o.x + dx, z = o.z + dz; if (!m.inb(x, z)) { s += 'r'; continue; } const q = G.caveAt(m, x, z), j = m.idx(x, z);
      if (q && Math.abs(floorY(q) - F) < .1) { s += 'o'; continue; } const top = m.water[j] ? m.waterSurf(x, z) : m.baseH(x, z);
      s += top <= F + .05 && !m.ramp[j] ? 'e' : 'r'; }
    const key = 'grotte_' + k + '_' + s + '_' + Math.floor(G.hash2(o.x, o.z, 41) * 4) + ':0';
    if (key !== o._gk) { o._gk = key; if (o._k) m.refresh(o); } }
  const around = (m, x, z) => { for (const [dx, dz] of [[0, 0], ...NB]) { const q = G.caveAt(m, x + dx, z + dz); if (q) relink(m, q); if (m.inb(x + dx, z + dz)) m.markDirty(x + dx, z + dz); } };
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj, otop = GP.topAt;
  GP.addObj = function (t, tx, tz, r, extra) {
    if (t === 'grotte' && extra && extra.v != null && !(extra.v & NEW) && this.inb(tx, tz)) { const i = this.idx(tx, tz); this.lvl[i] += (extra.v & 15) || 2; if (this.surf[i] === 15) this.surf[i] = 0; extra = Object.assign({}, extra, { v: extra.v | NEW }); this.markDirty(tx, tz); } // ancienne grotte
    const o = oadd.call(this, t, tx, tz, r, extra); if (o && t === 'grotte') { (this.caves || (this.caves = new Map())).set(tz * this.W + tx, o); around(this, tx, tz); } return o; };
  GP.removeObj = function (o) { const res = orem.call(this, o); if (isCave(o) && this.caves) { this.caves.delete(o.z * this.W + o.x); around(this, o.x, o.z); } return res; };
  const ods = G.GMap.deserialize; G.GMap.deserialize = function (d) { const m = ods.call(this, d); if (m.caves) for (const o of m.caves.values()) relink(m, o); return m; };
  // dans la galerie, on marche sur son sol (les pieds sont sous le plafond) ; dessus, sur l'herbe de la montagne
  GP.topAt = function (x, z) { if (this.caves && this.caves.size && G._feetY != null) { const o = G.caveAt(this, Math.floor(x), Math.floor(z)); if (o) { const F = floorY(o); if (G._feetY < F + CL - .5) return F; } } return otop.call(this, x, z); };

  // ---------- creuser : trois coups de pelle, la paroi se fissure puis s'écroule ----------
  const HITS = 3, prog = new Map(); let told = false;
  // devant soi, une paroi d'au moins deux niveaux qu'on peut creuser ? → { i, tx, tz, F (sol), k }
  function wallAhead(m, p, tx, tz) { if (!m || !p || m.interior || !m.inb(tx, tz)) return null; const px = Math.floor(p.x), pz = Math.floor(p.z), i = m.idx(tx, tz), pi = m.idx(px, pz);
    const here = G.caveAt(m, px, pz), F = here ? floorY(here) : m.baseH(px, pz); if (Math.abs(p.y - F) > .45 || (!here && (m.water[pi] || m.ramp[pi]))) return null;
    if (G.caveAt(m, tx, tz) || m.water[i] || m.ramp[i]) return null; const k = Math.round((m.baseH(tx, tz) - F) / T); if (k < 2) return null; return { i, tx, tz, F, k: Math.min(15, k) }; }
  // fissures dessinées sur la paroi (3 étapes)
  const crackTex = []; const crackMat = n => { if (!crackTex[n]) { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'), r = G.rng(70 + n); x.strokeStyle = 'rgba(40,24,12,.92)'; x.lineCap = 'round';
      for (let s = 0; s < 3 + n * 4; s++) { let px = 64 + (r() - .5) * 70, py = 128 + (r() - .5) * 160; x.lineWidth = 2.5 + r() * 3; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 5 + n * 2; j++) { px += (r() - .5) * 40; py += (r() - .5) * 40; x.lineTo(px, py); } x.stroke(); }
      crackTex[n] = G.curveMat(new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); } return crackTex[n]; };
  function crack(m, w, p, n) { let e = prog.get(w.i); if (!e) { e = { n: 0 }; prog.set(w.i, e); } e.n = n; e.t = 0;
    if (!e.mesh) { const dx = w.tx - Math.floor(p.x), dz = w.tz - Math.floor(p.z); e.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), crackMat(1)); e.mesh.position.set(w.tx + .5 - dx * .505, w.F + 1.05, w.tz + .5 - dz * .505); e.mesh.rotation.y = Math.atan2(-dx, -dz); e.mesh.renderOrder = 3; m.group.add(e.mesh); e.m = m; }
    e.mesh.material = crackMat(Math.min(3, n)); return e; }
  const clearCrack = i => { const e = prog.get(i); if (e && e.mesh) { e.mesh.parent && e.mesh.parent.remove(e.mesh); } prog.delete(i); };
  function hitWall(m, p, tx, tz) { const w = wallAhead(m, p, tx, tz); if (!w) return false; const o = m.objAt(tx, tz);
    if (o && !(G.isNature && G.isNature(o)) && !(o.t === 'trou' || O[o.t].dig || O[o.t].pick || O[o.t].fill)) { G.ui.toast('Quelque chose bloque la paroi ici.'); G.sfx('error'); return true; }
    if (G.net && G.net.visit) { G.ui.toast('On ne creuse que dans son propre village.'); return true; }
    const n = ((prog.get(w.i) || {}).n || 0) + 1, cx = w.tx + .5 - (w.tx - Math.floor(p.x)) * .5, cz = w.tz + .5 - (w.tz - Math.floor(p.z)) * .5, cy = w.F + .9 + Math.random() * .5;
    G.sfx('dig'); G.sfx('mine', .5 + n * .15); G.fx.burst(cx, cy, cz, 10 + n * 6, [0x8a6440, 0xb08a5c, 0x6a5d4e, 0x9a9286], 2.2 + n * .4, .7, 9, .1 + n * .02); if (G.cam && G.cam.shake) G.cam.shake(.05 + n * .04);
    if (n < HITS) { crack(m, w, p, n); if (!told) { told = true; G.ui.toast('⛏️ La paroi se fissure… encore quelques coups de pelle pour creuser la grotte !'); } return true; }
    // la paroi s'écroule : la galerie s'ouvre
    clearCrack(w.i); if (o) m.removeObj(o);
    m.addObj('grotte', w.tx, w.tz, 0, { v: w.k | NEW });
    const mx = w.tx + .5, mz = w.tz + .5; G.fx.burst(mx, w.F + 1.2, mz, 40, [0x8a6440, 0xb08a5c, 0x6a5d4e, 0x9a9286, 0x7f705e], 3.2, 1.0, 11, .18); G.fx.puff(mx, w.F + .6, mz, 14, 0xc8b8a0, 1.1); G.fx.puff(cx, w.F + 1.4, cz, 8, 0xd8c8b0, .8);
    G.sfx('chop', .8); if (G.cam && G.cam.shake) G.cam.shake(.3);
    const give = G.act.give, rr = Math.random(); if (give) { give('pierre', 1 + (Math.random() < .5 ? 1 : 0), mx, w.F + .5, mz); if (rr < .2) give('fer', 1, mx, w.F + .8, mz); else if (rr < .24) give('or', 1, mx, w.F + .8, mz); else if (rr < .27) give('fossile', 1, mx, w.F + .8, mz); }
    if (G.lampRefresh) G.lampRefresh(); return true; }
  // la pelle : creuser une paroi (geste à l'horizontale), ou le sol (geste vers le bas) — un vrai mouvement de pelle dans les deux cas
  const otool = G.act.tool; G.act.tool = (t, tx, tz) => { const p = G.player, m = G.map;
    if (t !== 'shovel' || !p || !m || p.act) return otool(t, tx, tz);
    const wall = !!wallAhead(m, p, tx, tz); G.sfx('swing', .5);
    p.act = { kind: wall ? 'digwall' : 'dig', t: 0, dur: wall ? .78 : .66, hitAt: wall ? .56 : .6, done: false, fn: () => { if (wall) { if (!hitWall(m, p, tx, tz)) G.act.dig(tx, tz, m.objAt(tx, tz)); } else G.act.dig(tx, tz, m.objAt(tx, tz)); } }; };
  // une paroi entamée puis laissée retrouve son aspect au bout d'un moment
  G.on('update', dt => { for (const [i, e] of prog) if ((e.t += dt) > 25) clearCrack(i); });

  // ---------- dans la grotte : la caméra suit dans le tunnel, une petite lueur accompagne le joueur ----------
  let lamp = null, blend = 0, camDir = null; const CP = new THREE.Vector3(), CT = new THREE.Vector3(), NP = new THREE.Vector3(), NT = new THREE.Vector3(), LK = new THREE.Vector3();
  G.on('init', scene => { lamp = new THREE.PointLight(0xffe6c8, 0, 6.5, 1.7); scene.add(lamp); });
  const inside = (m, p) => { const o = G.caveAt(m, Math.floor(p.x), Math.floor(p.z)); return o && p.y < floorY(o) + CL - .5 ? o : null; };
  // jusqu'où la caméra peut reculer dans la direction (dx,dz) sans sortir du passage
  function room(m, F, x, z, dx, dz) { let d = 0; for (let s = .1; s <= 2.8; s += .1) { const px = x + dx * s, pz = z + dz * s, tx = Math.floor(px), tz = Math.floor(pz); if (!m.inb(tx, tz)) break;
      const q = G.caveAt(m, tx, tz), ok = q ? Math.abs(floorY(q) - F) < .1 : m.baseH(tx, tz) <= F + .3 && !m.water[m.idx(tx, tz)]; if (!ok) break; d = s; } return Math.max(0, d - .28); }
  G.on('frame', dt => { const m = G.map, p = G.player, cam = G.camera; if (!m || !p || !cam || !lamp) return; dt = Math.min(dt || 0, .1);
    const o = G.state === 'play' && !m.interior && !p.vehicle && !(G.firstPerson && G.firstPerson()) ? inside(m, p) : null;
    blend = G.clamp(blend + (o ? dt * 3 : -dt * 3), 0, 1); lamp.intensity += ((o ? .55 : 0) - lamp.intensity) * Math.min(1, dt * 4);
    if (lamp.intensity > .01) lamp.position.set(p.x, p.y + 1.7, p.z);
    if (blend <= 0) { camDir = null; CP.set(0, 0, 0); return; }
    const F = o ? floorY(o) : p.y; NT.set(p.x, p.y + 1.0, p.z);
    // direction : celle de la caméra habituelle si le tunnel le permet, sinon le côté le plus dégagé
    const yaw = G.cam ? G.cam.yaw : 0, d0 = [Math.sin(yaw), Math.cos(yaw)], C = [d0, [0, 1], [1, 0], [0, -1], [-1, 0]];
    let best = null; for (const d of C) { const L = room(m, F, p.x, p.z, d[0], d[1]), sc = L < .5 ? L - 9 : L + (d[0] * d0[0] + d[1] * d0[1]) * .9 + (camDir && d[0] === camDir[0] && d[1] === camDir[1] ? .5 : 0); if (!best || sc > best[0]) best = [sc, d, L]; } // jamais vers une paroi trop proche
    camDir = best[1]; const L = best[2], tight = L < .5; // coincé de tous les côtés : la caméra se met au-dessus du joueur, sous le plafond let cx = p.x + camDir[0] * L, cz = p.z + camDir[1] * L;
    if (G.caveAt(m, Math.floor(cx), Math.floor(cz))) { if (camDir[0] === 0) cx += (Math.floor(cx) + .5 - cx) * .6; if (camDir[1] === 0) cz += (Math.floor(cz) + .5 - cz) * .6; } // au milieu du tunnel
    NP.set(cx, F + (tight ? CL - .15 : Math.min(CL - .3, 1.75)), cz);
    if (!CP.lengthSq()) { CP.copy(cam.position); CT.copy(NT); }
    const k = 1 - Math.exp(-dt * 7); CP.lerp(NP, k); CT.lerp(NT, k);
    const s = G.smooth(blend); cam.position.lerp(CP, s); LK.set(G.cam.cx, G.cam.cy, G.cam.cz).lerp(CT, s); cam.lookAt(LK); cam.updateMatrixWorld(); });
})();
