'use strict';
// ===== Clôtures qui se raccordent toutes seules (comme au village) + portillon + onglet « Clôtures » =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  // directions : bit 1 = nord (-z), 2 = est (+x), 4 = sud (+z), 8 = ouest (-x)
  const DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  // segment de la demi-case : du centre vers le bord, dans la direction (dx,dz) ; on construit le long de +x puis on tourne
  const rotY = (dx, dz) => Math.atan2(-dz, dx);
  const T = {
    bois: { n: 'Clôture en bois', post: (b) => { b.box(.13, .95, .13, 0x85552f, 0, .47, 0); b.cone(.1, .1, 4, 0x6b4426, 0, 1.0, 0, 0, Math.PI / 4); },
      seg: (b, a) => { for (const y of [.35, .7]) b.geo(new THREE.BoxGeometry(.5, .1, .06), 0xb07a48, b.M(.25 * Math.cos(a), y, -.25 * Math.sin(a), 0, a, 0)); } },
    blanche: { n: 'Clôture blanche', post: b => { b.box(.12, .9, .12, 0xf7f5ee, 0, .45, 0); b.cone(.09, .12, 4, 0xf7f5ee, 0, .96, 0, 0, Math.PI / 4); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); for (const y of [.25, .58]) b.geo(new THREE.BoxGeometry(.5, .07, .05), 0xebe6da, b.M(.25 * c, y, .25 * s, 0, a, 0)); for (const d of [.17, .34]) { b.geo(new THREE.BoxGeometry(.1, .72, .04), 0xfbfaf4, b.M(d * c, .36, d * s, 0, a, 0)); b.geo(new THREE.ConeGeometry(.07, .12, 4), 0xfbfaf4, b.M(d * c, .78, d * s, 0, a + Math.PI / 4, 0)); } } },
    jardin: { n: 'Clôture de jardin pastel', post: b => { b.box(.12, .85, .12, 0xffe3ea, 0, .42, 0); b.sph(.07, 0xff9fbf, 0, .9, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a), cols = [0xbfe6fa, 0xfff1bd, 0xd8f1e2]; b.geo(new THREE.BoxGeometry(.5, .06, .05), 0xffe3ea, b.M(.25 * c, .3, .25 * s, 0, a, 0)); for (let i = 0; i < 2; i++) { const d = .16 + i * .2; b.geo(new THREE.BoxGeometry(.13, .62, .04), cols[i % 3], b.M(d * c, .33, d * s, 0, a, 0)); b.geo(new THREE.CylinderGeometry(.065, .065, .04, 10, 1, false, Math.PI / 2, Math.PI), cols[i % 3], b.M(d * c, .64, d * s, Math.PI / 2, a, 0)); } } },
    fleurie: { n: 'Clôture fleurie', post: b => { b.box(.12, .8, .12, 0xb07a48, 0, .4, 0); b.sph(.08, 0xff8fc0, 0, .86, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); for (const y of [.3, .62]) b.geo(new THREE.BoxGeometry(.5, .07, .05), 0xc08850, b.M(.25 * c, y, .25 * s, 0, a, 0)); const fl = [0xe8434a, 0xffd23f, 0xff8fc0, 0x6c8cff]; for (let i = 0; i < 3; i++) { const d = .1 + i * .15; b.sph(.05, fl[(i + Math.round(a * 3)) & 3], d * c, .68, d * s); b.sph(.045, 0x5aae46, d * c, .6, d * s + .02, 1.4, .5, 1); } b.ico(.1, 0, 0x58b54a, .28 * c, .1, .28 * s); } },
    bambou: { n: 'Clôture de bambou', post: b => { b.cyl(.06, .065, 1.15, 7, 0xb8c46a, 0, .57, 0); for (const y of [.35, .75]) b.cyl(.068, .068, .04, 7, 0x8f9a48, 0, y, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); for (let i = 1; i <= 3; i++) { const d = i * .14, h = .9 + (i % 2) * .15; b.cyl(.045, .05, h, 6, i % 2 ? 0xc8d27a : 0xa9b45a, d * c, h / 2, d * s); } b.geo(new THREE.BoxGeometry(.5, .04, .04), 0x7a6a3a, b.M(.25 * c, .6, .25 * s, 0, a, 0)); } },
    fer: { n: 'Grille en fer forgé', post: b => { b.box(.1, 1.05, .1, 0x2a2d33, 0, .52, 0); b.sph(.07, 0xd9b84a, 0, 1.1, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); for (const y of [.15, .8]) b.geo(new THREE.BoxGeometry(.5, .04, .04), 0x2a2d33, b.M(.25 * c, y, .25 * s, 0, a, 0)); for (let i = 1; i <= 3; i++) { const d = i * .13; b.geo(new THREE.BoxGeometry(.025, .85, .025), 0x2a2d33, b.M(d * c, .5, d * s, 0, a, 0)); b.cone(.035, .1, 4, 0x2a2d33, d * c, .97, d * s); } b.add(new THREE.TorusGeometry(.06, .012, 4, 10), 0xd9b84a, b.M(.2 * c, .66, .2 * s, 0, a, 0), 0, true); } },
    rondins: { n: 'Barrière de rondins', post: b => { b.cyl(.09, .1, .9, 7, 0x7a5236, 0, .45, 0); b.cyl(.085, .085, .02, 7, 0xd9b382, 0, .905, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); for (const y of [.3, .65]) b.geo(new THREE.CylinderGeometry(.065, .065, .5, 7), 0x9a6a40, b.M(.25 * c, y, .25 * s, 0, a, Math.PI / 2)); } },
    arcenciel: { n: 'Clôture arc-en-ciel', post: b => { b.box(.12, .9, .12, 0xffffff, 0, .45, 0); b.sph(.07, 0xffd23f, 0, .95, 0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a), cols = [0xe8434a, 0xff9a3c, 0xffd23f, 0x4fb35f, 0x5b8fd6, 0x8d6fd1]; b.geo(new THREE.BoxGeometry(.5, .06, .05), 0xffffff, b.M(.25 * c, .3, .25 * s, 0, a, 0)); for (let i = 0; i < 2; i++) { const d = .16 + i * .2, k = (Math.round((a + 4) * 2) + i) % 6; b.geo(new THREE.BoxGeometry(.13, .7, .045), cols[k], b.M(d * c, .37, d * s, 0, a, 0)); b.cone(.09, .12, 4, cols[k], d * c, .78, d * s, 0, a + Math.PI / 4); } } },
    pierre: { n: 'Muret de pierre', post: b => { b.jit(.12); b.box(.4, .62, .4, 0xb9b5aa, 0, .31, 0); b.box(.46, .08, .46, 0xd9d4c8, 0, .66, 0); b.jit(0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); b.jit(.12); b.geo(new THREE.BoxGeometry(.5, .5, .3), 0xa9a59a, b.M(.25 * c, .25, .25 * s, 0, a, 0)); b.geo(new THREE.BoxGeometry(.5, .07, .34), 0xd9d4c8, b.M(.25 * c, .53, .25 * s, 0, a, 0)); b.jit(0); } },
    haie: { n: 'Haie taillée', post: b => { b.jit(.14); b.box(.62, .95, .62, 0x3f8f45, 0, .47, 0); b.ico(.3, 1, 0x4a9e4f, 0, .95, 0, 1, .45, 1); b.jit(0); },
      seg: (b, a) => { const c = Math.cos(a), s = -Math.sin(a); b.jit(.14); b.geo(new THREE.BoxGeometry(.5, .9, .56), 0x3f8f45, b.M(.25 * c, .45, .25 * s, 0, a, 0)); b.jit(0); } }
  };
  G.FENCE_TYPES = T;
  for (const k in T) MD['fence2_' + k] = mask => {
    const b = G.mb(300 + mask), t = T[k]; t.post(b);
    const m = mask & 15, segs = m ? DIRS.filter(d => m & d[2]) : [[1, 0], [-1, 0]];
    for (const [dx, dz] of segs) t.seg(b, rotY(dx, dz));
    return b.done();
  };
  // portillon : arche de jardin qu'on traverse
  MD.portillon = mask => { const b = G.mb(320), ns = (mask & 5) && !(mask & 10), a = ns ? Math.PI / 2 : 0, c = Math.cos(a), s = Math.sin(a);
    for (const sg of [-1, 1]) { b.box(.12, 1.5, .12, 0xf7f5ee, sg * .46 * c, .75, -sg * .46 * s); b.sph(.08, 0xf7f5ee, sg * .46 * c, 1.55, -sg * .46 * s); }
    b.geo(new THREE.TorusGeometry(.46, .045, 6, 16, Math.PI), 0xf7f5ee, b.M(0, 1.5, 0, 0, a, 0), 0, true);
    for (let i = 0; i < 6; i++) { const t = i / 5 * Math.PI; b.sph(.07, [0xff8fc0, 0xe8434a, 0xffd23f][i % 3], Math.cos(t) * .46 * c, 1.5 + Math.sin(t) * .46, -Math.cos(t) * .46 * s); }
    b.jit(.12); b.ico(.12, 0, 0x58b54a, -.46 * c, .3, .46 * s); b.ico(.12, 0, 0x58b54a, .46 * c, .3, -.46 * s); b.jit(0); return b.done(); };
  // ---------- objets & objets d'inventaire ----------
  const FAM = new Set();
  const def = (id, n, model, p) => { G.OBJ[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: .9, take: 1, cat: 'clotures', fence: 1 }, p); FAM.add(id); };
  def('cloture_bois', T.bois.n, 'fence2_bois'); def('cloture_blanche', T.blanche.n, 'fence2_blanche');
  def('cloture_jardin', T.jardin.n, 'fence2_jardin'); def('cloture_fleurie', T.fleurie.n, 'fence2_fleurie'); def('cloture_bambou', T.bambou.n, 'fence2_bambou');
  def('cloture_fer', T.fer.n, 'fence2_fer', { h: 1.05 }); def('cloture_rondins', T.rondins.n, 'fence2_rondins'); def('cloture_arcenciel', T.arcenciel.n, 'fence2_arcenciel');
  def('muret', T.pierre.n, 'fence2_pierre', { h: .66, walk: 1 }); def('haie', T.haie.n, 'fence2_haie', { h: 1.05 });
  def('portillon', 'Portillon fleuri', 'portillon', { h: 0, walk: 1 });
  G.isFence = t => FAM.has(t);
  for (const id of FAM) {
    const it = G.ITEMS[id] || (G.ITEMS[id] = { id, stack: 99 });
    Object.assign(it, { id, n: G.OBJ[id].n, kind: 'place', obj: id, cat: 'clotures', thumb: 'obj:' + id, sell: id === 'portillon' ? 300 : 120, stack: 99 });
  }
  if (!G.CATS.find(c => c.id === 'clotures')) G.CATS.splice(3, 0, { id: 'clotures', n: '🚧 Clôtures' });
  for (const id of ['cloture_jardin', 'cloture_fleurie', 'cloture_bambou', 'cloture_fer', 'cloture_rondins', 'cloture_arcenciel', 'muret', 'portillon']) if (!G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);
  G.RECIPES.push({ id: 'cloture_rondins', need: { bois: 2 }, n: 4 }, { id: 'cloture_bambou', need: { bois: 1, herbe: 2 }, n: 4 }, { id: 'muret', need: { pierre: 3 }, n: 2 }, { id: 'portillon', need: { bois: 4 } });
  // ---------- raccord automatique : on recalcule le masque des voisins à chaque pose / retrait ----------
  const maskAt = (m, x, z) => { let k = 0; for (const [dx, dz, bit] of DIRS) { const o = m.objAt(x + dx, z + dz); if (o && FAM.has(o.t)) k |= bit; } return k; };
  const fix = (m, x, z) => { const o = m.objAt(x, z); if (!o || !FAM.has(o.t) || o.x !== x || o.z !== z) return; const k = maskAt(m, x, z); if (o.v !== k) { o.v = k; if (o._k) m.refresh(o); } };
  const P = G.GMap.prototype, oadd = P.addObj, orem = P.removeObj;
  P.addObj = function (t, tx, tz, r, extra) {
    const fence = FAM.has(t); const o = oadd.call(this, t, tx, tz, fence ? 0 : r, extra);
    if (o && fence) { fix(this, tx, tz); for (const [dx, dz] of DIRS) fix(this, tx + dx, tz + dz); }
    return o;
  };
  P.removeObj = function (o) { orem.call(this, o); if (FAM.has(o.t)) for (const [dx, dz] of DIRS) fix(this, o.x + dx, o.z + dz); };
})();
