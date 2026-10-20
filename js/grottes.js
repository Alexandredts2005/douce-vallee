'use strict';
// ===== Grottes : avec la pelle, face à une paroi de plus d'un niveau de haut (2 niveaux ou plus au-dessus de ses pieds),
// on creuse une galerie dans la montagne. La case creusée descend au niveau du sol de la galerie et porte une voûte de roche :
// dessus, la montagne reste intacte (herbe, on marche dessus) ; dessous, on passe debout. On continue de creuser pour
// prolonger la galerie dans tous les sens. Entrée en arc de rochers, stalactites, cristaux qui brillent, champignons lumineux.
// Chaque coup de pelle rapporte de la pierre (parfois du fer, de l'or ou un fossile). Quand on est dans la grotte, la voûte
// autour de soi s'efface pour qu'on se voie. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, CL = 2.25; // CL : hauteur sous voûte
  const SK = () => G.SK || {}, PAT = () => G.PAT || {};
  const ROCK = 0x7f705e, ROCK2 = 0x6a5d4e, ROCKL = 0x948573;
  const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]], ROT = [0, -PI / 2, PI, PI / 2]; // N, E, S, O (le côté nord est construit puis tourné)

  // ---------- la voûte : nom du modèle « grotte_k_cccc_v[s] » ----------
  // k : hauteur de la montagne en niveaux au-dessus du sol de la galerie ; c (par côté) : r roche, o galerie voisine, e entrée, 1-9 façade à partir de ce niveau ; v : variante ; s : neige
  function build(name) { const [, ks, sides, vs] = name.split('_'), k = +ks, top = k * T, vr = +vs[0], snow = vs[1] === 's', b = G.mb(2700 + k * 7 + vr), sk = SK(), P = PAT(), r = G.rng(k * 31 + vr * 7 + sides.charCodeAt(0));
    const rotM = (i, x, y, z) => new THREE.Matrix4().makeRotationY(ROT[i]).multiply(new THREE.Matrix4().makeTranslation(x, y, z));
    // la dalle de roche, et la montagne par-dessus (herbe ou neige)
    b.S(sk.stone); b.jit(.08); b.box(.998, top - CL, .998, ROCK, 0, (top + CL) / 2, 0); b.jit(0);
    b.P(snow ? 0 : (P.gazon || 0)); b.box(1.0, .05, 1.0, snow ? 0xf4f6fa : 0x62b04a, 0, top - .02, 0); b.P(0);
    // stalactites sous la voûte
    for (let i = 0; i < 4 + Math.floor(r() * 4); i++) { const h = .12 + r() * .35, rr = .03 + r() * .05, x = (r() - .5) * .8, z = (r() - .5) * .8; b.add(new THREE.ConeGeometry(rr, h, 6), i % 2 ? ROCKL : ROCK, b.M(x, CL - h / 2 + .01, z, PI, r() * PI, 0), 0, false); }
    for (let i = 0; i < 4; i++) { const c = sides[i]; if (c === 'r' || c === 'o') continue;
      const fb = c === 'e' ? CL : (+c) * T; if (top - fb > .05) { // façade de roche vue du dehors, au-dessus de l'entrée ou de la marche
        const BANDS = [0xa97d51, 0x9a6f47, 0xb88b5c, 0x8f6640, 0xa57a4f]; for (let y = fb, n = 0; y < top - .01; n++) { const h = Math.min(top - y, .22 + ((n * 7) % 3) * .06); b.add(new THREE.BoxGeometry(1.0, h, .12), BANDS[(n + vr) % 5], rotM(i, 0, y + h / 2, -.5 + .06), 0, false); y += h; } // couches de terre comme la falaise
        for (let j = 0; j < 7; j++) b.add(new THREE.IcosahedronGeometry(.05 + r() * .05, 0), j % 2 ? 0x8a8580 : 0xa6a199, rotM(i, (r() - .5) * .8, fb + r() * (top - fb), -.5 + .01).multiply(new THREE.Matrix4().makeScale(1, .8, .45)), 0, false);
        b.add(new THREE.BoxGeometry(1.02, .06, .14), snow ? 0xf4f6fa : 0x5aa844, rotM(i, 0, top - .03, -.5 + .06), 0, false); } // liseré d'herbe au bord
      if (c === 'e') { // l'entrée : un arc de gros rochers, une clé de voûte
        const pts = []; for (let y = .15; y < 1.7; y += .42) for (const s of [-1, 1]) pts.push([s * .44, y]); for (let a = 0; a <= 6; a++) { const t = a / 6 * PI; pts.push([Math.cos(t) * .44, 1.72 + Math.sin(t) * .45]); }
        pts.forEach(([x, y], j) => b.add(new THREE.IcosahedronGeometry(.13 + (j % 3) * .025, 0), j % 2 ? ROCK : ROCKL, rotM(i, x, y, -.5 + .02).multiply(new THREE.Matrix4().makeRotationY(j)), 0, false));
        b.add(new THREE.BoxGeometry(.2, .26, .2), ROCKL, rotM(i, 0, 2.2, -.5 + .03), 0, false); } }
    b.S(null);
    // trésors de la grotte, selon la variante : cristaux, champignons lumineux, stalagmites
    const wall = [0, 1, 2, 3].filter(i => sides[i] === 'r'), wi = wall.length ? wall[vr % wall.length] : -1;
    if (vr === 0 && wi >= 0) { const col = k % 2 ? 0xb48ae8 : 0x7ad8f0; for (let j = 0; j < 5; j++) { const h = .18 + r() * .3, x = (r() - .5) * .6, tilt = (r() - .5) * .7;
        b.add(new THREE.CylinderGeometry(.035, .045, h, 6), col, rotM(wi, x, h / 2, -.38 + r() * .1).multiply(new THREE.Matrix4().makeRotationZ(tilt)), 1, false);
        b.add(new THREE.ConeGeometry(.035, .08, 6), 0xffffff, rotM(wi, x - Math.sin(tilt) * h * .5, h + .03, -.38 + r() * .1).multiply(new THREE.Matrix4().makeRotationZ(tilt)), 1, false); } }
    else if (vr === 1) for (let j = 0; j < 6; j++) { const x = (r() - .5) * .7, z = (r() - .5) * .7, h = .05 + r() * .08; b.cyl(.01, .012, h, 6, 0xe8e2d0, x, h / 2, z); b.sph(.035 + r() * .02, 0x6af0d0, x, h + .01, z, 1, .45, 1, 1, 8, 6); }
    else if (vr === 2) for (let j = 0; j < 3; j++) { const h = .15 + r() * .3, x = (r() - .5) * .6, z = (r() - .5) * .6; b.add(new THREE.ConeGeometry(.06 + r() * .04, h, 6), ROCKL, b.M(x, h / 2, z), 0, false); }
    return b.done(); }
  const ogg = G.getGeo; G.getGeo = (name, v = 0) => { if (typeof name === 'string' && name.startsWith('grotte_') && !MD[name]) MD[name] = () => build(name); return ogg(name, v); };

  // ---------- l'objet : on marche dessous (dans la galerie) ou dessus (sur la montagne) ----------
  const roofOf = o => ((o.v || 0) & 15) * T;
  O.grotte = { id: 'grotte', n: 'Galerie de grotte', model: 'grotte', v: 2, fp: [1, 1], h: 3, walk: 1, cave: 1,
    hAt: o => (G._feetY != null && G._feetY < o.y + CL - .3) ? 0 : roofOf(o), keyOf: (v, o) => (o && o._gk) || 'grotte_' + ((v & 15) || 2) + '_rrrr_3' + ':0' };
  const isCave = q => !!(q && q.t === 'grotte');
  function relink(m, o) { if (!m.list.has(o)) return; const k = (o.v || 0) & 15, L = m.lvl[m.idx(o.x, o.z)]; let s = '';
    for (const [dx, dz] of NB) { const x = o.x + dx, z = o.z + dz; if (!m.inb(x, z)) { s += 'r'; continue; } const q = m.objAt(x, z), j = m.idx(x, z);
      if (isCave(q)) { s += 'o'; continue; } const nl = m.lvl[j] - (m.water[j] ? 1 : 0);
      s += nl >= L + k ? 'r' : nl <= L ? 'e' : String(Math.min(9, nl - L)); }
    const vr = Math.floor(G.hash2(o.x, o.z, 41) * 4), snow = m.surf[m.idx(o.x, o.z)] === 8 || (o.v >> 4) & 1, key = 'grotte_' + k + '_' + s + '_' + vr + (snow ? 's' : '') + ':0';
    if (key !== o._gk) { o._gk = key; if (o._k) m.refresh(o); } }
  const around = (m, x, z) => { for (const [dx, dz] of [[0, 0], ...NB]) { const q = m.inb(x + dx, z + dz) && m.objAt(x + dx, z + dz); if (isCave(q)) relink(m, q); } };
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  GP.addObj = function (t, tx, tz, r, extra) { const o = oadd.call(this, t, tx, tz, r, extra); if (o && t === 'grotte') around(this, tx, tz); return o; };
  GP.removeObj = function (o) { const res = orem.call(this, o); if (isCave(o)) around(this, o.x, o.z); return res; };
  const ods = G.GMap.deserialize; G.GMap.deserialize = function (d) { const m = ods.call(this, d); for (const o of m.list) if (isCave(o)) relink(m, o); return m; };

  // ---------- creuser avec la pelle ----------
  let told = false;
  const odig = G.act.dig; G.act.dig = (tx, tz, o) => { const m = G.map, p = G.player;
    if (!m || !p || m.interior || !m.inb(tx, tz)) return odig(tx, tz, o);
    const i = m.idx(tx, tz), pi = m.idx(Math.floor(p.x), Math.floor(p.z)), Lf = m.lvl[pi], Lt = m.lvl[i];
    if (m.water[i] || m.ramp[i] || m.water[pi] || Lt - Lf < 2 || Math.abs(p.y - Lf * T) > .45) return odig(tx, tz, o); // pas une paroi assez haute devant soi : on creuse un trou comme d'habitude
    if (o && !(G.isNature && G.isNature(o)) && !(o.t === 'trou' || O[o.t].dig || O[o.t].pick || O[o.t].fill)) { G.ui.toast('Quelque chose bloque la paroi ici.'); G.sfx('error'); return; }
    if (G.net && G.net.visit) { G.ui.toast('On ne creuse que dans son propre village.'); return; }
    if (o) m.removeObj(o);
    const snow = m.surf[i] === 8; m.lvl[i] = Lf; m.ramp[i] = 0; m.surf[i] = 15; m.markDirty(tx, tz);
    m.addObj('grotte', tx, tz, 0, { v: Math.min(15, Lt - Lf) | (snow ? 16 : 0) });
    const c = [tx + .5, Lf * T + 1, tz + .5]; G.sfx('dig'); G.sfx('mine', .6); G.fx.burst(c[0], c[1], c[2], 18, [0x8a7a66, 0x6a5d4e, 0xb08a5c], 2.6, .7, 12); if (G.cam && G.cam.shake) G.cam.shake(.15);
    const give = G.act.give, rr = Math.random(); if (give) { give('pierre', 1 + (Math.random() < .5 ? 1 : 0), c[0], c[1], c[2]); if (rr < .2) give('fer', 1, c[0], c[1] + .3, c[2]); else if (rr < .24) give('or', 1, c[0], c[1] + .3, c[2]); else if (rr < .27) give('fossile', 1, c[0], c[1] + .3, c[2]); }
    if (!told) { told = true; G.ui.toast('⛏️ Tu creuses une grotte dans la montagne ! Continue pour prolonger la galerie.'); }
    if (G.lampRefresh) G.lampRefresh(); };

  // ---------- dans la grotte : la voûte autour de soi s'efface pour qu'on se voie ----------
  const Z0 = new THREE.Matrix4().makeScale(0, 0, 0), hid = new Set();
  G.on('frame', () => { const m = G.map, p = G.player; const now = new Set();
    if (m && p && !m.interior) { const o = m.objAt(Math.floor(p.x), Math.floor(p.z));
      if (isCave(o) && p.y < o.y + CL - .3) for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const q = m.inb(o.x + dx, o.z + dz) && m.objAt(o.x + dx, o.z + dz); if (isCave(q) && Math.hypot(dx, dz) <= 4.3) now.add(q); } }
    for (const q of hid) if (!now.has(q)) { if (q._anim === Z0) { q._anim = null; if (q._k && m) m.refresh(q); } hid.delete(q); }
    for (const q of now) if (!hid.has(q) && !q._anim) { q._anim = Z0; if (q._k) m.refresh(q); hid.add(q); } });
})();
