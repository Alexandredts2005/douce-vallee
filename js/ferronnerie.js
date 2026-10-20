'use strict';
// ===== Ferronnerie verte, façon kiosque et passerelles Belle Époque :
// - plateforme en fer forgé (case 1 × 1) : les cases posées côte à côte forment une grande plateforme, la balustrade
//   (main courante ronde, barreaux, volutes, médaillons dorés) ne court que sur les bords libres ;
//   des colonnes en fonte cannelées à chapiteau doré et consoles en volute la portent, aux angles et toutes les 5 cases ;
// - plateforme suspendue : sans colonnes, mais avec des équerres de fixation et des axes à boule dorée sous le plancher,
//   tous les 5 cases de balustrade ;
// - escaliers en fer forgé (1 ou 2 cases de long) qui montent d'un niveau, rampes à volutes, raccords comme ceux en pierre.
// Les niveaux s'empilent : on pose à la hauteur où l'on se trouve (sol → 1er étage ; sur le 1er → 1er ; sur le 2e → 2e…),
// les colonnes grandissent jusqu'au plancher. On passe dessous (seules les colonnes arrêtent), on marche dessus, la balustrade retient.
// Variante (v) — plateforme : 1 N, 2 E, 4 S, 8 W bords raccordés · 16 x multiple de 5 · 256 z multiple de 5 · 32 suspendue · 64/128 étage − 1
//               escalier : 1 long · 4 / 8 voisin gauche / droite · 16 suite en bas · 32 suite en haut · 64/128 hauteur du bas (en niveaux). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const GR = 0x2f5e45, GRD = 0x234536, GRL = 0x3f7a5a, GOLD = 0xd4af37, DK = 0.08; // vert bouteille, plancher, doré
  const SIDES = [[1, 0], [2, -PI / 2], [4, PI], [8, PI / 2]]; // N, E, S, W : bit et rotation (le bord nord est construit, puis tourné)
  const lvlOf = v => G.lvlOf(v); // étage sur 3 bits (escaliers.js)
  // ---------- outils : pièces placées dans un repère tourné (un bord de la case), barres entre deux points, arcs ----------
  const Mx = new THREE.Matrix4(), Rq = new THREE.Quaternion(), Eu = new THREE.Euler();
  const put = (b, g, col, base, x, y, z, rx = 0, ry = 0, rz = 0, smooth = false) => { Eu.set(rx, ry, rz, 'YXZ'); Mx.compose(new V3(x, y, z), Rq.setFromEuler(Eu), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(Mx) : Mx.clone(), 0, smooth); };
  const bar = (b, base, a, c, r, col, n = 6) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, false);
    const m = new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(m) : m, 0, true); };
  const arc = (R, t, a) => new THREE.TorusGeometry(R, t, 4, Math.max(6, Math.round(a * 5)), a);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // tout ce qui est construit pendant f est surélevé de dy (escalier posé en hauteur)
  const lifted = (b, dy, f) => { if (!dy) return f(); const oa = b.add; b.add = (g, c, m, mat, sm) => oa.call(b, g, c, new THREE.Matrix4().makeTranslation(0, dy, 0).multiply(m), mat, sm); try { f(); } finally { b.add = oa; } };
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
  // ---------- colonne en fonte du sol jusqu'en top : socle, fût cannelé, bagues dorées, chapiteau, consoles en volute ----------
  function column(b, x, z, dirs, top) {
    G.rbox(b, .2, .08, .2, .02, GRD, x, .04, z); b.tor(.062, .016, GOLD, x, .1, z, PI / 2, 0, 0, 0, 16);
    const h = top - .3; b.cyl(.04, .046 + Math.min(.02, h * .006), h, 16, GR, x, .1 + h / 2, z, 0, 0, 0, 0, true);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; b.box(.008, h - .06, .012, GRL, x + Math.cos(a) * .043, .13 + (h - .06) / 2, z + Math.sin(a) * .043, 0, -a, 0); }
    for (let y = .55; y < top - .4; y += T) b.tor(.047, .011, GOLD, x, y, z, PI / 2, 0, 0, 0, 16); // une bague dorée à chaque étage
    b.cyl(.085, .045, .12, 16, GR, x, top - .14, z, 0, 0, 0, 0, true); b.tor(.07, .012, GOLD, x, top - .2, z, PI / 2, 0, 0, 0, 16); b.box(.19, .04, .19, GRD, x, top - .06, z);
    for (const [dx, dz] of dirs) { const ry = Math.atan2(-dz, dx); put(b, arc(.17, .012, PI / 2), GR, null, x + dx * .17, top - .21, z + dz * .17, 0, ry, PI / 2, true); // console : du fût jusque sous le plancher
      put(b, arc(.05, .007, PI * 1.5), GR, null, x + dx * .1, top - .14, z + dz * .1, 0, ry, 0, true); }
  }
  // ---------- équerre de fixation (plateforme suspendue) : montant, bras, écharpe à volute, boulons dorés ; dir = vers l'extérieur ----------
  function bracket(b, base, y0) {
    const z = -.5 + .06, L = .42;
    put(b, box(.035, L, .035), GR, base, 0, y0 - L / 2, z); put(b, box(.035, .035, L), GR, base, 0, y0 - .02, z + L / 2);
    bar(b, base, [0, y0 - L + .03, z], [0, y0 - .04, z + L - .03], .014, GR, 8);
    put(b, arc(.13, .009, PI / 2), GR, base, 0, y0 - .04 - .13, z + .02, 0, -PI / 2, 0, true); put(b, arc(.06, .008, PI * 1.5), GR, base, 0, y0 - .2, z + .12, 0, -PI / 2, 0, true);
    for (const [yy, zz] of [[y0 - L + .05, z - .02], [y0 - .06, z - .02], [y0 - .03, z + L - .04]]) put(b, new THREE.SphereGeometry(.02, 10, 8), GOLD, base, 0, yy, zz, 0, 0, 0, true);
    put(b, new THREE.SphereGeometry(.035, 12, 10), GOLD, base, 0, y0 - L - .02, z, 0, 0, 0, true); // boule de pendentif sous le montant
  }
  // ---------- ferme sous une case sans appui : une diagonale et une membrure basse vers le pilier le plus proche (dir = N, E, S, O) ----------
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  function truss(b, top, dir) { const [dx, dz] = DIRS[dir], y1 = top - DK - .08, y2 = top - DK - .72;
    bar(b, null, [-dx * .5, y2, -dz * .5], [dx * .5, y2, dz * .5], .018, GR, 8); // membrure basse
    bar(b, null, [-dx * .45, y1, -dz * .45], [dx * .45, y2 + .02, dz * .45], .016, GR, 8); // diagonale vers le pilier
    bar(b, null, [-dx * .45, y1, -dz * .45], [-dx * .45, y2, -dz * .45], .012, GR, 6); // montant
    const ry = Math.atan2(dx, dz); put(b, arc(.13, .008, PI * 1.5), GR, null, -dx * .1, (y1 + y2) / 2 + .05, -dz * .1, 0, ry + PI / 2, 0, true); put(b, arc(.06, .007, PI * 1.5), GR, null, dx * .2, (y1 + y2) / 2 - .12, dz * .2, 0, ry + PI / 2, PI, true);
    for (const [px, py, pz] of [[-dx * .45, y1, -dz * .45], [-dx * .45, y2, -dz * .45], [dx * .45, y2 + .02, dz * .45]]) b.sph(.022, GOLD, px, py, pz, 1, 1, 1, 0, 10, 8); }
  // ---------- plateforme ----------
  function platform(b, v) {
    const susp = v & 32, k = lvlOf(v) + 1, top = k * T, solid = (v >> 11) & 15, brace = (v >> 15) & 7;
    b.box(1, DK, 1, GRD, 0, top - DK / 2, 0);
    for (let q = -2; q <= 2; q++) { b.box(1, .012, .022, GR, 0, top + .004, q * .2); b.box(.022, .012, 1, GR, q * .2, top + .004, 0); } // caillebotis
    b.box(1, .06, .05, GRD, 0, top - DK - .03, 0); b.box(.05, .06, 1, GRD, 0, top - DK - .03, 0); // poutres sous le plancher
    for (const [bit, a] of SIDES) { if (v & bit) continue; const base = new THREE.Matrix4().makeRotationY(a), nxt = SIDES[(SIDES.findIndex(s => s[0] === bit) + 1) % 4][0];
      put(b, box(1, .14, .035), GR, base, 0, top - DK - .07, -.5 + .0175); put(b, box(1, .012, .006), GOLD, base, 0, top - DK - .07, -.5 - .002); // poutre de rive, filet doré
      for (let q = 0; q < 4; q++) put(b, arc(.11, .007, PI), GR, base, -.375 + q * .25, top - DK - .14, -.5 + .02, 0, 0, PI, true); // festons
      railing(b, base, top, true, !!(v & nxt));
      // suspendue et accrochée à rien : une équerre sous le bord, tous les 5 cases de balustrade (x multiple de 5 au nord et au sud, z à l'est et à l'ouest)
      if (susp && !solid && ((bit & 5) ? (v & 16) : (v & 256))) bracket(b, base, top - DK - .14); }
    // contre une falaise, un mur, un rocher… : l'équerre se fixe toute seule du bon côté (montant contre le solide, bras sous le plancher)
    SIDES.forEach(([bit, a], i) => { if (solid & (1 << i)) { const base = new THREE.Matrix4().makeRotationY(a); bracket(b, base, top - DK - .02); } });
    if (!susp && brace) truss(b, top, brace - 1);
    if (susp && (v & 16) && (v & 256)) { // axe de fixation central : tige à boule dorée sous le croisement des poutres
      b.cyl(.022, .022, .55, 10, GR, 0, top - DK - .06 - .275, 0, 0, 0, 0, 0, true); b.tor(.03, .008, GOLD, 0, top - DK - .2, 0, PI / 2, 0, 0, 0, 12); b.sph(.05, GOLD, 0, top - DK - .36, 0, 1, 1.2, 1, 0, 14, 12); b.cone(.02, .07, 10, GOLD, 0, top - DK - .44, 0, PI); }
    if (!susp) { const cols = [], tp = top - DK; if ((v & 16) && (v & 256)) cols.push([0, 0, [[1, 0], [-1, 0], [0, 1], [0, -1]]]);
      for (const [b1, b2, cx, cz] of [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]]) if (!(v & b1) && !(v & b2)) cols.push([cx, cz, [[-Math.sign(cx), 0], [0, -Math.sign(cz)]]]);
      for (const [x, z, d] of cols) column(b, x, z, d, tp); }
  }
  MD.plateforme_fer = v => { const b = G.mb(960 + ((v || 0) & 1023)); platform(b, v || 0); return b.done(); };
  // le jeu réserve les variantes ≥ 100 aux lampes éteintes : étage, suspendue et « z multiple de 5 » vont dans le nom du modèle
  for (let c = 0; c < 64; c++) MD['pf_' + c] = v => { const b = G.mb(1100 + c * 32 + (v & 31)); platform(b, (v & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2)); return b.done(); };
  const pfKey = v => { const c = Math.min(15, lvlOf(v)) * 4 + (v & 32 ? 2 : 0) + (v & 256 ? 1 : 0), ex = ((v >> 11) & 15) | (((v >> 15) & 7) << 4); return (ex ? 'pfx_' + c + '_' + ex : 'pf_' + c) + ':' + (v & 31); };
  const ogg = G.getGeo; G.getGeo = (name, v = 0) => { if (typeof name === 'string' && name.startsWith('pfx_') && !MD[name]) { const [, c, ex] = name.split('_').map(Number);
      MD[name] = vv => { const b = G.mb(1100 + c * 32 + (vv & 31)); platform(b, (vv & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2) | ((ex & 15) << 11) | ((ex >> 4) << 15)); return b.done(); }; }
    return ogg(name, v); };
  // ---------- escalier en fer forgé ----------
  const NST = D => D === 1 ? 6 : 8;
  function ironStairs(b, D, J, e) {
    const n = NST(D), rr = T / n, t = D / n, L = Math.hypot(D, T), a = Math.atan2(T, D), hr = z => .95 + (D / 2 - z) / D * T, Y0 = e * T;
    lifted(b, Y0, () => {
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
          if (!e) for (const R of [.1, .065, .035]) put(b, arc(R, .009, PI * 1.6), GR, null, x, .3, D / 2 + .02 + R * .3, 0, PI / 2, 0, true); } // volute de départ
        if (!J.B) { b.box(.055, 1.2, .055, GR, x, T + .4, -D / 2 + .03); b.sph(.036, GOLD, x, T + 1.04, -D / 2 + .03, 1, 1, 1, 0, 12, 10); } } });
    // supports : une colonne sous le milieu de la grande volée ; en hauteur, des colonnes du sol jusqu'aux deux bouts
    // supports : au sol, une colonne sous le milieu de la grande volée ; en hauteur, une paire de colonnes tous les 3 escaliers (J.P)
    if (D === 2 && (!e || J.P)) column(b, 0, 0, [], Y0 + T / 2 - .12);
    if (e && J.P) for (const s of [-1, 1]) column(b, s * .4, D / 2 - .12, [], Y0 - .04);
  }
  MD.esc_fer = v => { const b = G.mb(980 + ((v || 0) & 3)); ironStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32, P: v & 2 }, lvlOf(v)); return b.done(); };
  for (let e = 0; e < 16; e++) MD['ef_' + e] = v => { const b = G.mb(1700 + e * 4 + (v & 3)); ironStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32, P: v & 2 }, e); return b.done(); };
  const efKey = v => 'ef_' + lvlOf(v) + ':' + (v & 63);
  const oko = G.objKey; G.objKey = o => { const d = O[o.t]; return d && d.keyOf ? d.keyOf(o.v != null ? o.v : d.v || 0) : oko(o); };
  // ---------- collisions ----------
  const loc = (o, x, z) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r), dx = x - (o.x + w / 2), dz = z - (o.z + dd / 2), r = o.r & 3;
    return [r === 0 ? dx : r === 1 ? -dz : r === 2 ? -dx : dz, r === 0 ? dz : r === 1 ? dx : r === 2 ? -dz : -dx]; };
  const CORN = [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]];
  const platH = (o, x, z) => { const v = o.v || 0, lx = x - o.x - .5, lz = z - o.z - .5, f = G._feetY, top = (lvlOf(v) + 1) * T;
    if (f != null && f < o.y + top - 1.4) { // en dessous : seules les colonnes arrêtent
      if (!(v & 32)) { if ((v & 16) && (v & 256) && Math.hypot(lx, lz) < .1) return top; for (const [b1, b2, cx, cz] of CORN) if (!(v & b1) && !(v & b2) && Math.hypot(lx - cx, lz - cz) < .1) return top; }
      return 0; }
    const R = .075; if ((!(v & 1) && lz < -.5 + R) || (!(v & 4) && lz > .5 - R) || (!(v & 2) && lx > .5 - R) || (!(v & 8) && lx < -.5 + R)) return top + 1.0; // balustrade
    return top; };
  const stairH = D => (o, x, z) => { const [lx, lz] = loc(o, x, z), n = NST(D), f = G.clamp((D / 2 - lz) / D, 0, 1), v = o.v != null ? o.v : O[o.t].v, Y0 = lvlOf(v) * T, fy = G._feetY;
    if (Y0 && fy != null && fy < o.y + Y0 + f * T - 1.4) { // sous un escalier en hauteur : seules ses colonnes arrêtent
      for (const s of [-1, 1]) for (const zz of [D / 2 - .12, -D / 2 + .12]) if (Math.hypot(lx - s * .4, lz - zz) < .1) return Y0 + T; return 0; }
    if ((lx < -.43 && !(v & 4)) || (lx > .43 && !(v & 8))) return Y0 + .95 + f * T; // rampe
    return Y0 + (G.clamp(Math.floor((D / 2 - lz) / (D / n)), 0, n - 1) + 1) * T / n; };
  // ---------- hauteur de pose : celle où se tient le joueur ----------
  const placeLvl = (m, tx, tz, min) => { const p = G.player; if (!p || !m.inb(tx, tz)) return min; return G.clamp(Math.round((p.y - m.baseH(tx, tz)) / T), min, 14 + min); }; // jusqu'à 15 étages : une terrasse au bord d'une falaise de niveau 10, au-dessus de l'eau
  // ---------- objets, objets d'inventaire, fabrication ----------
  const add = (id, n, o, sell, fer, desc) => { O[id] = Object.assign({ id, n, v: 0, h: T + 1, walk: 1, take: 1, cat: 'construction' }, o); G.ITEMS[id] = { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 99, desc };
    G.RECIPES.push({ id, need: { fer } }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  const platGhost = susp => (m, ax, az) => (susp ? 32 : 0) | G.lvlBits(placeLvl(m, ax, az, 1) - 1);
  add('plateforme_fer', 'Plateforme en fer forgé', { model: 'plateforme_fer', fp: [1, 1], plat: 1, hAt: platH, ghostV: platGhost(false), keyOf: pfKey }, 500, 4, 'Pose plusieurs cases côte à côte : une grande plateforme avec balustrade, portée par des colonnes en fonte. Elle se pose à ta hauteur : monte dessus pour construire l\'étage suivant.');
  add('plateforme_fer_susp', 'Plateforme suspendue en fer forgé', { model: 'plateforme_fer', v: 32, fp: [1, 1], plat: 1, susp: 1, up: 1, hAt: platH, ghostV: platGhost(true), keyOf: pfKey }, 500, 4, 'La même plateforme sans colonnes, tenue par des équerres de fixation tous les 5 cases. Elle se pose au-dessus de tout : arbres, lampadaires, eau…');
  add('escalier_fer', 'Escalier en fer forgé (court)', { model: 'esc_fer', fp: [1, 1], stair: 1, hAt: stairH(1), ghostV: (m, ax, az) => G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: efKey }, 700, 6, 'Monte d\'un niveau. Posé depuis une plateforme, il part de son plancher vers l\'étage suivant.');
  add('escalier_fer_long', 'Escalier en fer forgé (long)', { model: 'esc_fer', v: 1, fp: [1, 2], stair: 1, hAt: stairH(2), ghostV: (m, ax, az) => 1 | G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: efKey }, 1000, 10, 'Monte d\'un niveau en pente douce. Posé depuis une plateforme, il part de son plancher vers l\'étage suivant.');
  // ---------- raccords : bords des plateformes (voisine au même étage, escalier qui arrive ou qui part, haut de falaise), colonnes ----------
  const NB = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  const platAt = (m, x, z, dk) => { for (const q of [m.upAt && m.upAt(x, z), m.objAt(x, z)]) if (q && O[q.t].plat && Math.abs(G.platDeck(q) - dk) < .01) return q; return null; };
  function relinkPlat(m, o) { const d = O[o.t], dk = G.platDeck(o); let v = ((o.v || 0) & 1728) | (d.susp ? 32 : 0);
    for (const [dx, dz, bit] of NB) { const x = o.x + dx, z = o.z + dz; if (!m.inb(x, z)) continue; if (platAt(m, x, z, dk)) { v |= bit; continue; } const q = m.objAt(x, z), qd = q && O[q.t];
      if (qd && qd.stair) { const F = G.FR[q.r & 3], sb = G.stairBase(q); if ((F[0] === dx && F[1] === dz && Math.abs(sb + T - dk) < .01) || (F[0] === -dx && F[1] === -dz && Math.abs(sb - dk) < .01)) v |= bit; } // un escalier arrive ou part de ce bord
      else if (!m.water[m.idx(x, z)] && m.baseH(x, z) > dk - .3) v |= bit; } // du sol au niveau du plancher ou plus haut (falaise, butte) : pas de balustrade, seulement côté vide
    if (o.x % 5 === 0) v |= 16; if (o.z % 5 === 0) v |= 256;
    let solid = 0; NB.forEach(([dx, dz], i) => { if (solidAt(m, o.x + dx, o.z + dz, dk)) solid |= 1 << i; }); v |= solid << 11;
    if (!d.susp && !solid && !hasCol(v)) { let best = 0, bk = 99; NB.forEach(([dx, dz], i) => { for (let k = 1; k <= 6 && k < bk; k++) { const q = platAt(m, o.x + dx * k, o.z + dz * k, dk); if (!q) break; if (!O[q.t].susp && hasCol(q.v || 0)) { bk = k; best = i + 1; break; } } }); v |= best << 15; }
    if (v !== o.v) { o.v = v; if (o._k) m.refresh(o); } }
  // une case a-t-elle sa propre colonne ? (croisement des multiples de 5, ou coin extérieur)
  const hasCol = v => !!(((v & 16) && (v & 256)) || [[1, 2], [2, 4], [4, 8], [8, 1]].some(([a, c]) => !(v & a) && !(v & c)));
  // ce qui est solide à côté : falaise ou butte à la hauteur du plancher, mur de maison, rocher, gros bâtiment
  const solidAt = (m, x, z, dk) => { if (!m.inb(x, z)) return false; const i = m.idx(x, z); if (!m.water[i] && m.baseH(x, z) > dk - .3) return true;
    const q = m.objAt(x, z), qd = q && O[q.t]; return !!(qd && !qd.plat && !qd.stair && !qd.walk && (q.y || 0) + (qd.h || 0) > dk - .3 && (qd.enter || qd.fixed || qd.mine || qd.h > 2)); };
  // escaliers en fer : on compte depuis le bas de la volée, une paire de colonnes tous les 3 escaliers
  const ironSt = q => !!(q && O[q.t] && O[q.t].stair && O[q.t].model === 'esc_fer');
  function stairNext(m, o, sg) { const d = O[o.t], [w, dd] = G.fpDims(d, o.r), Fv = G.FR[o.r & 3], L = d.fp[1], x = Math.floor(o.x + w / 2 + Fv[0] * sg * (L / 2 + .5)), z = Math.floor(o.z + dd / 2 + Fv[1] * sg * (L / 2 + .5)), q = m.objAt(x, z);
    if (!ironSt(q) || q === o || (q.r & 3) !== (o.r & 3)) return null; return Math.abs(G.stairBase(q) - (G.stairBase(o) - sg * T)) < .05 ? q : null; }
  function stairChain(m, o) { if (!ironSt(o)) return; let b = o, n = 0; while (n++ < 64) { const q = stairNext(m, b, 1); if (!q) break; b = q; }
    let i = 0, q = b; while (q && i < 64) { const v0 = q.v != null ? q.v : O[q.t].v, want = i % 3 === 0 ? 2 : 0; if ((v0 & 2) !== want) { q.v = (v0 & ~2) | want; if (q._k) m.refresh(q); } q = stairNext(m, q, -1); i++; } }
  const touch = (m, o) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r || 0), R = d.plat ? 6 : 1, near = q => q.x >= o.x - 1 && q.x <= o.x + w && q.z >= o.z - 1 && q.z <= o.z + dd;
    for (let z = o.z - R; z <= o.z + dd - 1 + R; z++) for (let x = o.x - R; x <= o.x + w - 1 + R; x++) { if (!m.inb(x, z)) continue; for (const q of [m.objAt(x, z), m.upAt && m.upAt(x, z)]) { if (!q || q === o) continue; const qd = O[q.t];
      if (qd.plat) relinkPlat(m, q); else if (qd.stair && near(q)) { if (G.stairRelink) G.stairRelink(m, q); stairChain(m, q); } } } };
  // pose par le joueur : la plateforme ou l'escalier en fer prend la hauteur où il se tient
  let placing = false; const opl = G.act.placeObj; G.act.placeObj = (it, tx, tz) => { placing = true; try { return opl(it, tx, tz); } finally { placing = false; } };
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  GP.addObj = function (t, tx, tz, r, extra) { const d = O[t], plat = d && d.plat;
    if (placing && this === G.map && d && (plat || t.startsWith('escalier_fer'))) { const lv = plat ? placeLvl(this, tx, tz, 1) - 1 : placeLvl(this, tx, tz, 0); extra = Object.assign({}, extra, { v: ((d.v || 0) & ~1728) | G.lvlBits(lv) }); }
    const o = oadd.call(this, t, tx, tz, plat ? 0 : r, extra);
    if (o && (plat || d.stair)) { if (plat) relinkPlat(this, o); else if (G.stairRelink) G.stairRelink(this, o); touch(this, o); if (d.stair) stairChain(this, o); } return o; };
  GP.removeObj = function (o) { const d = o && O[o.t], hit = d && (d.plat || d.stair); const res = orem.call(this, o); if (hit) touch(this, o); return res; };
  const otake = G.act.take; G.act.take = () => { const p = G.player, m = G.map; if (p && m && m.upAt && !p.act && !p.sit && !p.dead) { const [tx, tz] = p.target(), u = m.upAt(tx, tz), g = m.objAt(tx, tz);
      if (u && !(g && g.dk != null) && (!g || p.y > G.platDeck(u) - .6)) { const [cx, cz] = m.center(u); if (G.mode === 'survie' && G.inv.add(u.t, 1) > 0) { G.ui.toast('Inventaire plein !'); return; } m.removeObj(u); G.sfx('pickup'); G.fx.puff(cx, G.platDeck(u), cz, 10, 0xffffff, .7); return; } } return otake(); };
})();
