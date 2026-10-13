'use strict';
// ===== Ferronnerie verte, façon kiosque et passerelles Belle Époque :
// - plateforme en fer forgé (case 1 × 1, plancher à un niveau de haut) : les cases posées côte à côte forment une grande plateforme,
//   la balustrade (main courante ronde, barreaux, volutes, médaillons dorés) ne court que sur les bords libres ;
//   des colonnes en fonte cannelées à chapiteau doré et consoles en volute la portent, aux angles et toutes les 5 cases ;
// - plateforme suspendue : la même, sans les colonnes (festons sous le bord) ;
// - escaliers en fer forgé (1 ou 2 cases de long) qui montent d'un niveau, rampes à volutes, raccords comme ceux en pierre.
// On passe sous la plateforme (seules les colonnes arrêtent), on marche dessus, la balustrade retient. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const GR = 0x2f5e45, GRD = 0x234536, GRL = 0x3f7a5a, GOLD = 0xd4af37, DK = 0.08; // vert bouteille, plancher, doré
  const SIDES = [[1, 0], [2, -PI / 2], [4, PI], [8, PI / 2]]; // N, E, S, W : bit et rotation (le bord nord est construit, puis tourné)
  // ---------- outils : pièces placées dans un repère tourné (un bord de la case), barres entre deux points, arcs ----------
  const Mx = new THREE.Matrix4(), Rq = new THREE.Quaternion(), Eu = new THREE.Euler();
  const put = (b, g, col, base, x, y, z, rx = 0, ry = 0, rz = 0, smooth = false) => { Eu.set(rx, ry, rz, 'YXZ'); Mx.compose(new V3(x, y, z), Rq.setFromEuler(Eu), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(Mx) : Mx.clone(), 0, smooth); };
  const bar = (b, base, a, c, r, col, n = 6) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, false);
    const m = new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(m) : m, 0, true); };
  const arc = (R, t, a) => new THREE.TorusGeometry(R, t, 4, Math.max(6, Math.round(a * 5)), a);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // ---------- balustrade d'un bord (repère : bord nord, x de −0,5 à 0,5) ----------
  function railing(b, base, y0, startPost, endPost) {
    const z = -.5 + .045;
    put(b, box(1, .035, .03), GR, base, 0, y0 + .07, z); put(b, box(1, .02, .022), GR, base, 0, y0 + .74, z); put(b, box(1, .014, .036), GOLD, base, 0, y0 + .9, z);
    put(b, new THREE.CylinderGeometry(.028, .028, 1, 10), GR, base, 0, y0 + .935, z, 0, 0, PI / 2, true);
    for (let i = 0; i < 7; i++) { const x = -.5 + (i + .5) / 7; put(b, box(.016, .67, .016), GR, base, x, y0 + .405, z);
      put(b, new THREE.SphereGeometry(.016, 8, 6), GOLD, base, x, y0 + .755, z, 0, 0, 0, true); }
    for (let i = 0; i < 6; i++) { const x = -.5 + (i + 1) / 7; // volutes en S entre la lisse et la main courante
      put(b, arc(.034, .005, PI), GR, base, x - .034, y0 + .815, z, 0, 0, 0, true); put(b, arc(.034, .005, PI), GR, base, x + .034, y0 + .815, z, 0, 0, PI, true); }
    // médaillon central doré et grandes volutes en C de part et d'autre
    put(b, new THREE.TorusGeometry(.075, .009, 6, 20), GR, base, 0, y0 + .42, z, 0, 0, 0, true); put(b, new THREE.SphereGeometry(.03, 10, 8), GOLD, base, 0, y0 + .42, z, 0, 0, 0, true);
    for (const s of [-1, 1]) { put(b, arc(.11, .008, PI * 1.25), GR, base, s * .27, y0 + .42, z, 0, 0, s < 0 ? PI * .375 : -PI * .625, true); put(b, new THREE.SphereGeometry(.018, 8, 6), GOLD, base, s * .27, y0 + .42, z, 0, 0, 0, true); }
    for (const [ok, x] of [[startPost, -.5 + .03], [endPost, .5 - .03]]) if (ok) { put(b, box(.055, 1.0, .055), GR, base, x, y0 + .5, z); put(b, box(.08, .03, .08), GR, base, x, y0 + 1.0, z); put(b, new THREE.SphereGeometry(.034, 12, 10), GOLD, base, x, y0 + 1.055, z, 0, 0, 0, true); }
  }
  // ---------- colonne en fonte : socle, fût cannelé, bagues dorées, chapiteau, consoles en volute vers le plancher ----------
  function column(b, x, z, dirs) {
    const top = T - DK; G.rbox(b, .2, .08, .2, .02, GRD, x, .04, z); b.tor(.062, .016, GOLD, x, .1, z, PI / 2, 0, 0, 0, 16);
    b.cyl(.04, .046, top - .3, 16, GR, x, .1 + (top - .3) / 2, z, 0, 0, 0, 0, true);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; b.box(.008, top - .36, .012, GRL, x + Math.cos(a) * .043, .13 + (top - .36) / 2, z + Math.sin(a) * .043, 0, -a, 0); }
    b.tor(.047, .011, GOLD, x, .55, z, PI / 2, 0, 0, 0, 16); b.cyl(.085, .045, .12, 16, GR, x, top - .14, z, 0, 0, 0, 0, true); b.tor(.07, .012, GOLD, x, top - .2, z, PI / 2, 0, 0, 0, 16); b.box(.19, .04, .19, GRD, x, top - .06, z);
    for (const [dx, dz] of dirs) { const ry = Math.atan2(-dz, dx); put(b, arc(.17, .012, PI / 2), GR, null, x + dx * .17, top - .21, z + dz * .17, 0, ry, PI / 2, true); // console : du fût jusque sous le plancher
      put(b, arc(.05, .007, PI * 1.5), GR, null, x + dx * .1, top - .14, z + dz * .1, 0, ry, 0, true); }
  }
  // ---------- plateforme : v = bords raccordés (1 N, 2 E, 4 S, 8 W) | 16 colonne du quadrillage (toutes les 5 cases) | 32 suspendue ----------
  function platform(b, v) {
    const susp = v & 32, top = T;
    b.box(1, DK, 1, GRD, 0, top - DK / 2, 0);
    for (let k = -2; k <= 2; k++) { b.box(1, .012, .022, GR, 0, top + .004, k * .2); b.box(.022, .012, 1, GR, k * .2, top + .004, 0); } // caillebotis
    b.box(1, .06, .05, GRD, 0, top - DK - .03, 0); b.box(.05, .06, 1, GRD, 0, top - DK - .03, 0); // poutres sous le plancher
    for (const [bit, a] of SIDES) { if (v & bit) continue; const base = new THREE.Matrix4().makeRotationY(a), nxt = SIDES[(SIDES.findIndex(s => s[0] === bit) + 1) % 4][0];
      put(b, box(1, .14, .035), GR, base, 0, top - DK - .07, -.5 + .0175); put(b, box(1, .012, .006), GOLD, base, 0, top - DK - .07, -.5 - .002); // poutre de rive, filet doré
      for (let k = 0; k < 4; k++) put(b, arc(.11, .007, PI), GR, base, -.375 + k * .25, top - DK - .14, -.5 + .02, 0, 0, PI, true); // festons
      railing(b, base, top, true, !!(v & nxt)); }
    if (!susp) { const cols = []; if (v & 16) cols.push([0, 0, [[1, 0], [-1, 0], [0, 1], [0, -1]]]);
      for (const [b1, b2, cx, cz] of [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]]) if (!(v & b1) && !(v & b2)) cols.push([cx, cz, [[-Math.sign(cx), 0], [0, -Math.sign(cz)]]]);
      for (const [x, z, d] of cols) column(b, x, z, d); }
  }
  MD.plateforme_fer = v => { const b = G.mb(960 + (v & 63)); platform(b, v || 0); return b.done(); };
  // ---------- escalier en fer forgé : marches ajourées, limons, rampes à volutes (mêmes raccords que l'escalier en pierre) ----------
  const NST = D => D === 1 ? 6 : 8;
  function ironStairs(b, D, J) {
    const n = NST(D), rr = T / n, t = D / n, L = Math.hypot(D, T), a = Math.atan2(T, D), hr = z => .95 + (D / 2 - z) / D * T;
    for (const s of [-1, 1]) { put(b, box(.03, .16, L + .05), GR, null, s * .47, T / 2 - .04, 0, a); put(b, box(.034, .012, L + .05), GOLD, null, s * .47, T / 2 + .045, 0, a); } // limons
    for (let i = 0; i < n; i++) { const zf = D / 2 - i * t, top = (i + 1) * rr, zc = zf - t / 2;
      b.box(.9, .025, t - .015, GRD, 0, top - .0125, zc); b.box(.9, .035, .02, GR, 0, top - .0175, zf - .01);
      for (let k = -1; k <= 1; k++) b.box(.86, .008, .018, GRL, 0, top + .004, zc + k * t * .28);
      put(b, arc(.07, .006, PI), GR, null, 0, top - .035, zf - .012, 0, 0, PI, true); } // feston sous le nez de marche
    for (const s of [-1, 1]) { if (s < 0 ? J.L : J.R) continue; const x = s * .47;
      bar(b, null, [x, hr(D / 2), D / 2 - .03], [x, hr(-D / 2), -D / 2 + .03], .026, GR, 10); bar(b, null, [x, hr(D / 2) - .05, D / 2 - .03], [x, hr(-D / 2) - .05, -D / 2 + .03], .007, GOLD, 6);
      for (let i = 0; i < n; i++) { const zc = D / 2 - (i + .5) * t, top = (i + 1) * rr; b.box(.016, hr(zc) - top, .016, GR, x, (hr(zc) + top) / 2, zc);
        if (i < n - 1) put(b, arc(.05, .006, PI * 1.5), GR, null, x, (hr(zc - t / 2) + top + rr) / 2, zc - t / 2, 0, PI / 2, -a, true); }
      if (!J.F) { b.box(.055, 1.02, .055, GR, x, .51, D / 2 - .03); b.box(.08, .03, .08, GR, x, 1.03, D / 2 - .03); b.sph(.036, GOLD, x, 1.09, D / 2 - .03, 1, 1, 1, 0, 12, 10);
        for (const [R, y] of [[.1, .3], [.065, .3], [.035, .3]]) put(b, arc(R, .009, PI * 1.6), GR, null, x, y, D / 2 + .02 + R * .3, 0, PI / 2, 0, true); } // volute de départ
      if (!J.B) { b.box(.055, 1.2, .055, GR, x, T + .4, -D / 2 + .03); b.sph(.036, GOLD, x, T + 1.04, -D / 2 + .03, 1, 1, 1, 0, 12, 10); } }
    if (D === 2) column(b, 0, 0, []); // une colonne sous le milieu de la grande volée
  }
  MD.esc_fer = v => { const b = G.mb(980 + (v & 3)); ironStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32 }); return b.done(); };
  // ---------- collisions ----------
  const loc = (o, x, z) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r), dx = x - (o.x + w / 2), dz = z - (o.z + dd / 2), r = o.r & 3;
    return [r === 0 ? dx : r === 1 ? -dz : r === 2 ? -dx : dz, r === 0 ? dz : r === 1 ? dx : r === 2 ? -dz : -dx]; };
  const platH = (o, x, z) => { const v = o.v || 0, lx = x - o.x - .5, lz = z - o.z - .5, f = G._feetY;
    if (f != null && f < o.y + .35) { // en dessous : seules les colonnes arrêtent
      if (!(v & 32)) { if ((v & 16) && Math.hypot(lx, lz) < .1) return T; for (const [b1, b2, cx, cz] of [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]]) if (!(v & b1) && !(v & b2) && Math.hypot(lx - cx, lz - cz) < .1) return T; }
      return 0; }
    const R = .075; if ((!(v & 1) && lz < -.5 + R) || (!(v & 4) && lz > .5 - R) || (!(v & 2) && lx > .5 - R) || (!(v & 8) && lx < -.5 + R)) return T + 1.0; // balustrade
    return T; };
  const stairH = D => (o, x, z) => { const [lx, lz] = loc(o, x, z), n = NST(D), f = G.clamp((D / 2 - lz) / D, 0, 1), v = o.v != null ? o.v : O[o.t].v;
    if ((lx < -.43 && !(v & 4)) || (lx > .43 && !(v & 8))) return .95 + f * T; // rampe
    return (G.clamp(Math.floor((D / 2 - lz) / (D / n)), 0, n - 1) + 1) * T / n; };
  // ---------- objets, objets d'inventaire, fabrication ----------
  const add = (id, n, o, sell, fer, desc) => { O[id] = Object.assign({ id, n, v: 0, h: T + 1, walk: 1, cat: 'construction' }, o); G.ITEMS[id] = { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 99, desc };
    G.RECIPES.push({ id, need: { fer } }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  add('plateforme_fer', 'Plateforme en fer forgé', { model: 'plateforme_fer', fp: [1, 1], plat: 1, hAt: platH }, 500, 4, 'Pose plusieurs cases côte à côte : une grande plateforme avec balustrade, portée par des colonnes en fonte.');
  add('plateforme_fer_susp', 'Plateforme suspendue en fer forgé', { model: 'plateforme_fer', v: 32, fp: [1, 1], plat: 1, susp: 1, hAt: platH }, 500, 4, 'La même plateforme, sans colonnes : elle a l\'air de flotter.');
  add('escalier_fer', 'Escalier en fer forgé (court)', { model: 'esc_fer', fp: [1, 1], stair: 1, hAt: stairH(1) }, 700, 6, 'Monte d\'un niveau, jusqu\'à une plateforme ou en haut d\'une falaise.');
  add('escalier_fer_long', 'Escalier en fer forgé (long)', { model: 'esc_fer', v: 1, fp: [1, 2], stair: 1, hAt: stairH(2) }, 1000, 10, 'Monte d\'un niveau en pente douce, jusqu\'à une plateforme ou en haut d\'une falaise.');
  // ---------- raccords : bords des plateformes (voisine, escalier qui arrive, terrain au niveau du plancher), colonnes ----------
  const NB = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  function relinkPlat(m, o) { const d = O[o.t]; let v = d.susp ? 32 : 0;
    for (const [dx, dz, bit] of NB) { const x = o.x + dx, z = o.z + dz; if (!m.inb(x, z)) continue; const q = m.objAt(x, z), qd = q && O[q.t];
      if (qd && qd.plat && Math.abs(q.y - o.y) < .01) v |= bit;
      else if (qd && qd.stair && Math.abs(q.y - o.y) < .01) { const F = G.FR[q.r & 3]; if (F[0] === dx && F[1] === dz) v |= bit; } // un escalier arrive sur ce bord
      else if (!q && !m.water[m.idx(x, z)] && Math.abs(m.baseH(x, z) - (o.y + T)) < .01) v |= bit; } // le haut d'une falaise, au niveau du plancher
    if (!d.susp && o.x % 5 === 0 && o.z % 5 === 0) v |= 16;
    if (v !== o.v) { o.v = v; if (o._k) m.refresh(o); } }
  const touch = (m, o) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r || 0); for (let z = o.z - 1; z <= o.z + dd; z++) for (let x = o.x - 1; x <= o.x + w; x++) { const q = m.objAt(x, z); if (!q || q === o) continue; const qd = O[q.t];
    if (qd.plat) relinkPlat(m, q); else if (qd.stair && G.stairRelink) G.stairRelink(m, q); } };
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  GP.addObj = function (t, tx, tz, r, extra) { const d = O[t], plat = d && d.plat; const o = oadd.call(this, t, tx, tz, plat ? 0 : r, extra);
    if (o && (plat || d.stair)) { if (plat) relinkPlat(this, o); touch(this, o); } return o; };
  GP.removeObj = function (o) { const d = o && O[o.t], hit = d && (d.plat || d.stair); const res = orem.call(this, o); if (hit) touch(this, o); return res; };
})();
