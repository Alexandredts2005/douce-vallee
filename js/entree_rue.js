'use strict';
// ===== Grande entrée de la rue commerçante (v2) : le pignon d'un immense hall de verre et de fonte.
// Deux pavillons de pierre coiffés de dômes, un grand arc vitré en éventail, une grande marquise de fer forgé vert
// sur colonnes de fonte (lambrequins, crête, consoles à volutes, tirants, lanternes), des ailes à arcades et boutiques,
// et une vraie place devant : fontaine à vasques, parterres fleuris, candélabres, terrasse de café, kiosque. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2, PT = G.PAT, K = G.SK, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const ST = 0xeadfc6, ST2 = 0xd8caac, ST3 = 0xbdad8e, GR = 0x2e5e48, GR2 = 0x22483a, GOLD = 0xd9b84a, GL = 0xcde6ee, ZINC = 0x7c8794, WIN = 0xfff0c2, GRAN = 0x8d8983, MARB = 0xf1ebdf;
  // repères (origine = centre de l'emprise 10×5) : façade au bord des falaises, naissance de l'arc, rayon du hall, fond du hall, porte
  const Z0 = -1.5, SP = 5.4, RV = 4.0, ZB = -9.0, DW = 2.5, DH = 3.8, EY = SP + RV + .73;
  const MQ = { RX: 5.0, RZ: 3.7, YA: 4.32, YE: 4.54, TH: PI / 2 - .02 }; // marquise en demi-ellipse, plus haute au bord (éventail)
  const mqP = (th, t) => [MQ.RX * Math.sin(th) * t, MQ.YA + (MQ.YE - MQ.YA) * Math.pow(t, 1.4), Z0 + MQ.RZ * Math.cos(th) * t];
  const COL = mqP(.82, .955); // colonnes de fonte (x = ±COL[0])

  // ---------- petits outils ----------
  // boîte aux arêtes adoucies, plus légère que celle du moteur (108 triangles au lieu de 300) : il y en a plus d'une centaine ici
  const SBC = new Map();
  function softBox(w, h, d) { const key = w.toFixed(3) + ',' + h.toFixed(3) + ',' + d.toFixed(3); if (SBC.has(key)) return SBC.get(key).clone();
    const half = [w / 2, h / 2, d / 2], r = Math.min(.08, Math.min(w, h, d) * .3), core = half.map(v => v - r), coords = half.map(v => [-v, -v + r, v - r, v]), pos = [], nor = [];
    const pt = raw => { const c = raw.map((v, i) => Math.max(-core[i], Math.min(core[i], v))), dv = raw.map((v, i) => v - c[i]), l = Math.hypot(...dv) || 1; return { p: c.map((v, i) => v + dv[i] / l * r), n: dv.map(v => v / l) }; };
    const tri = (a, b, c) => { const ab = b.p.map((v, i) => v - a.p[i]), ac = c.p.map((v, i) => v - a.p[i]), cr = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]], nn = a.n.map((v, i) => v + b.n[i] + c.n[i]);
      if (cr.reduce((t, v, i) => t + v * nn[i], 0) < 0) [b, c] = [c, b]; for (const q of [a, b, c]) { pos.push(...q.p); nor.push(...q.n); } };
    for (let ax = 0; ax < 3; ax++) for (const sd of [-1, 1]) { const u = (ax + 1) % 3, v = (ax + 2) % 3, gr = coords[u].map(a => coords[v].map(c => { const raw = [0, 0, 0]; raw[ax] = sd * half[ax]; raw[u] = a; raw[v] = c; return pt(raw); }));
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const A = gr[i][j], B = gr[i + 1][j], C = gr[i + 1][j + 1], E = gr[i][j + 1]; tri(A, B, C); tri(A, C, E); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); SBC.set(key, g); return g.clone(); }
  const RB = (b, w, h, d, col, x, y, z, rx = 0, ry = 0, rz = 0, mat = 0) => Math.min(w, h, d) < .081 ? b.geo(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, rx, ry, rz), mat) : b.add(softBox(w, h, d), col, b.M(x, y, z, rx, ry, rz), mat, true);
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0) => b.geo(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, 0, ry, 0), mat);
  const br = (b, w, h, d, col, x, y, z, rx, ry, rz, mat = 0) => b.geo(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, rx, ry, rz), mat);
  const lo = (b, g, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = 0) => b.add(g, col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), mat, true);
  const pc = (b, rt, rb, h, n, col, x, y, z, mat = 0) => b.add(new THREE.CylinderGeometry(rt, rb, h, n), col, b.M(x, y, z), mat); // cylindre à peu de pans
  const ball = (b, r, col, x, y, z, mat = 0) => lo(b, r < .036 ? new THREE.OctahedronGeometry(r) : new THREE.SphereGeometry(r, 7, 5), col, x, y, z, 0, 0, 0, 1, 1, 1, mat); // les toutes petites : un octaèdre suffit
  // bloc long coupé en morceaux : le monde est courbé, un seul long bloc ne suivrait pas la courbure
  const lb = (b, w, h, d, col, x, y, z, mat = 0, round = 0) => { const ax = w >= d, L = ax ? w : d, n = Math.max(1, Math.ceil(L / 1.5)), s = L / n;
    for (let i = 0; i < n; i++) { const c = -L / 2 + (i + .5) * s, X = x + (ax ? c : 0), Z = z + (ax ? 0 : c), W = ax ? s + .004 : w, D = ax ? d : s + .004; if (round) RB(b, W, h, D, col, X, y, Z, 0, 0, 0, mat); else bx(b, W, h, D, col, X, y, Z, 0, mat); } };
  // tige d'un point à un autre (ferronneries, tirants, fils)
  const seg = (b, a, c, r, col, n = 6, mat = 0) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, true); g.translate(0, L / 2, 0);
    b.add(g, col, new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); };
  const line = (b, pts, r, col, n = 5, mat = 0) => { for (let i = 0; i + 1 < pts.length; i++) seg(b, pts[i], pts[i + 1], r, col, n, mat); };
  // arc de cercle (tore partiel) dans le plan XY, tourné ensuite
  const arc = (b, r, t, col, x, y, z, a0, a1, rx = 0, ry = 0, rz = 0, mat = 0, n = 0) => { const g = new THREE.TorusGeometry(r, t, 4, n || Math.max(6, Math.round(Math.abs(a1 - a0) * r * 5)), a1 - a0); g.rotateZ(a0); b.add(g, col, b.M(x, y, z, rx, ry, rz), mat, true); };
  // volute de fer forgé dans un plan vertical : P(u, v) donne le point 3D
  const spiral = (b, P, cu, cv, r0, a0, turns, sgn, rad, col) => { const pts = [], n = Math.max(6, Math.round(turns * 16)); for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + sgn * t * turns * TAU, r = r0 * (1 - .8 * t); pts.push(P(cu + Math.cos(a) * r, cv + Math.sin(a) * r)); } line(b, pts, rad, col, 4); };
  // géométrie visible des deux côtés (verrières)
  const dbl = g0 => { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, q = new Float32Array(p.length * 2); q.set(p);
    for (let i = 0; i < p.length; i += 9) { q.set(p.subarray(i, i + 3), p.length + i); q.set(p.subarray(i + 6, i + 9), p.length + i + 3); q.set(p.subarray(i + 3, i + 6), p.length + i + 6); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(q, 3)); o.computeVertexNormals(); return o; };
  const tris = pts => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; };
  const flat = (w, d, nx, nz) => new THREE.PlaneGeometry(w, d, nx || Math.max(1, Math.ceil(w)), nz || Math.max(1, Math.ceil(d))).rotateX(-PI / 2);
  const BAL = new THREE.LatheGeometry([[0, 0], [.07, 0], [.07, .05], [.04, .1], [.075, .25], [.04, .39], [.06, .42], [.06, .46], [0, .46]].map(([x, y]) => new THREE.Vector2(x, y)), 6);
  const URN = new THREE.LatheGeometry([[0, 0], [.13, 0], [.13, .05], [.06, .09], [.07, .16], [.2, .28], [.22, .38], [.18, .46], [.21, .5], [0, .5]].map(([x, y]) => new THREE.Vector2(x, y)), 12);

  // lanterne de fonte suspendue (y : bas de la lanterne)
  const lantern = (b, x, y, z, s = 1) => { b.S(K.paint);
    lo(b, new THREE.ConeGeometry(.06 * s, .12 * s, 6), GOLD, x, y - .05 * s, z, PI); pc(b, .12 * s, .08 * s, .06 * s, 6, GR, x, y + .03 * s, z);
    pc(b, .12 * s, .09 * s, .34 * s, 6, WIN, x, y + .23 * s, z, 1);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; bx(b, .02 * s, .36 * s, .02 * s, GR2, x + Math.sin(a) * .115 * s, y + .23 * s, z + Math.cos(a) * .115 * s); }
    pc(b, .05 * s, .16 * s, .1 * s, 6, GR, x, y + .45 * s, z); lo(b, new THREE.ConeGeometry(.07 * s, .13 * s, 6), GR, x, y + .56 * s, z); ball(b, .03 * s, GOLD, x, y + .65 * s, z); };
  // cadran d'horloge (les aiguilles, elles, tournent : voir plus bas)
  const clockFace = (b, x, y, z, R) => { b.S(null); b.cyl(R, R, .05, 32, 0xfbf8ee, x, y, z, PI / 2); b.S(K.gold); b.tor(R + .03, .05, GOLD, x, y, z + .03, 0, 0, 0, 0, 32);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, big = i % 3 === 0; br(b, big ? .05 : .025, R * (big ? .2 : .13), .012, 0x1d1f22, x + Math.sin(a) * R * .8, y + Math.cos(a) * R * .8, z + .03, 0, 0, -a); } };
  // statue de marbre dans sa niche, bras levé tenant une couronne d'or
  const statue = (b, x, y, z, s) => { b.S(K.stone); b.cyl(.2, .23, .16, 12, ST2, x, y + .08, z);
    b.cyl(.12, .21, .95, 12, MARB, x, y + .63, z); b.cyl(.1, .12, .34, 12, MARB, x, y + 1.25, z); b.sph(.085, MARB, x, y + 1.51, z); b.sph(.09, MARB, x - s * .02, y + 1.55, z - .03, 1, .8, 1);
    seg(b, [x - s * .11, y + 1.36, z], [x - s * .2, y + 1.06, z + .05], .035, MARB, 6); seg(b, [x + s * .11, y + 1.36, z], [x + s * .16, y + 1.66, z + .06], .035, MARB, 6); seg(b, [x + s * .16, y + 1.66, z + .06], [x + s * .14, y + 1.9, z + .08], .03, MARB, 6);
    b.S(K.gold); arc(b, .09, .018, GOLD, x + s * .14, y + 1.98, z + .08, 0, TAU); };

  // ---------- le hall : sol de mosaïque, boutiques sur deux niveaux, voûte de verre sur fermes de fonte ajourées ----------
  function hall(b) { const L = Z0 - ZB, zc = (Z0 + ZB) / 2, SIGN = [0xa8553f, 0x2f6fb8, 0x8a3d6b, 0xc0862f, 0x3f8a59, 0x5b4a8a];
    b.S(K.stone).P(PT.carrelage); b.geo(flat(2 * RV, L, 8, 8), 0xe8dfcc, b.M(0, .014, zc)); b.P(0);
    b.geo(flat(1.1, L, 1, 8), 0xa8553f, b.M(0, .02, zc)); for (const s of [-1, 1]) b.geo(flat(.08, L, 1, 8), GOLD, b.M(s * .6, .022, zc));
    for (const s of [-1, 1]) { const xi = s * RV, k0 = -s; // xi : face intérieure du mur, k0 : vers l'intérieur
      b.S(K.stone).P(PT.pierre); lb(b, 1.0, SP + .3, L + .2, ST, s * (RV + .5), (SP + .3) / 2, zc); b.P(0);
      lb(b, 1.2, .18, L + .2, ST2, s * (RV + .5), SP + .38, zc); // corniche extérieure, au-dessus des falaises
      const NB = 5, bl = (L - .3) / NB;
      b.S(K.paint); for (let k = 0; k <= NB; k++) { const z = Z0 - .3 - k * bl; bx(b, .14, SP - .1, .16, GR, xi + k0 * .07, (SP - .1) / 2, z); bx(b, .2, .1, .22, GOLD, xi + k0 * .08, 2.25, z); }
      for (let k = 0; k < NB; k++) { const z = Z0 - .3 - (k + .5) * bl, sc = SIGN[(k + (s > 0 ? 3 : 0)) % SIGN.length];
        bx(b, .05, 1.45, bl - .5, WIN, xi + k0 * .03, 1.02, z, 0, 1); for (const y of [.27, 1.76]) bx(b, .07, .08, bl - .4, GR, xi + k0 * .05, y, z);
        for (const f of [-.25, .25]) bx(b, .07, 1.45, .035, GR, xi + k0 * .05, 1.02, z + f * (bl - .5));
        bx(b, .08, .3, bl - .3, sc, xi + k0 * .06, 2.0, z); for (const y of [1.83, 2.17]) bx(b, .09, .04, bl - .26, GOLD, xi + k0 * .065, y, z);
        // étage : fenêtres cintrées
        bx(b, .04, 1.0, bl - .7, 0xf3e3bf, xi + k0 * .03, 3.55, z); lo(b, new THREE.CircleGeometry((bl - .7) / 2, 10, 0, PI), 0xf3e3bf, xi + k0 * .03, 4.05, z, 0, -s * PI / 2, 0);
        arc(b, (bl - .7) / 2 + .05, .035, GR, xi + k0 * .05, 4.05, z, 0, PI, 0, PI / 2, 0); bx(b, .06, 1.0, .03, GR, xi + k0 * .05, 3.55, z); }
      // galerie à balcon
      b.S(K.stone); lb(b, .5, .1, L, ST2, xi + k0 * .25, 2.35, zc); b.S(K.paint);
      lb(b, .05, .05, L, GOLD, xi + k0 * .48, 2.86, zc); lb(b, .03, .03, L, GR, xi + k0 * .48, 2.45, zc);
      for (let z = Z0 - .25; z > ZB; z -= .22) bx(b, .022, .4, .022, GR, xi + k0 * .48, 2.65, z);
      b.S(K.stone); lb(b, .3, .22, L, ST2, xi + k0 * .1, SP - .08, zc); }
    // voûte de verre et fermes en treillis
    b.S(K.glass); const vl = Z0 - .05 - ZB, vz = (Z0 - .05 + ZB) / 2, vg = new THREE.CylinderGeometry(RV, RV, vl, 28, 8, true, -PI / 2, PI); vg.rotateX(-PI / 2);
    b.add(dbl(vg), GL, b.M(0, SP, vz), 2);
    b.S(K.paint); for (let z = Z0 - .5; z >= ZB - .01; z -= 1.4) { arc(b, RV - .02, .055, GR, 0, SP, z, 0, PI, 0, 0, 0, 0, 28); arc(b, RV - .34, .04, GR, 0, SP, z, 0, PI, 0, 0, 0, 0, 24);
      for (let k = 0; k < 14; k++) { const a = k / 14 * PI, a2 = (k + .5) / 14 * PI, a3 = (k + 1) / 14 * PI, o = q => [Math.cos(q) * (RV - .04), SP + Math.sin(q) * (RV - .04), z], i = q => [Math.cos(q) * (RV - .32), SP + Math.sin(q) * (RV - .32), z];
        seg(b, o(a), i(a2), .014, GR, 4); seg(b, i(a2), o(a3), .014, GR, 4); } }
    for (let k = 1; k < 12; k++) { const a = k / 12 * PI; lb(b, .05, .05, vl, GR, Math.cos(a) * (RV + .01), SP + Math.sin(a) * (RV + .01), vz); }
    // lanterneau vitré sur le faîte, toit de zinc et crête
    b.S(K.glass); lb(b, .9, .36, vl, GL, 0, SP + RV + .16, vz, 2); b.S(K.paint);
    for (let i = 0; i < 4; i++) { const l = vl / 4; G.prism(b, 1.1, .32, l + .01, ZINC, 0, SP + RV + .34, Z0 - .05 - (i + .5) * l); }
    for (let z = Z0 - .2; z > ZB; z -= .3) { lo(b, new THREE.ConeGeometry(.025, .16, 4), GR, 0, SP + RV + .74, z); ball(b, .022, GOLD, 0, SP + RV + .83, z); }
    lb(b, .04, .04, vl, GR, 0, SP + RV + .66, vz);
    // suspensions à globes
    for (let z = Z0 - 1.2; z > ZB + .5; z -= 2.1) { seg(b, [0, SP + RV - .1, z], [0, 4.75, z], .012, GR2, 4); b.cyl(.06, .14, .08, 12, GOLD, 0, 4.72, z); b.sph(.22, WIN, 0, 4.5, z, 1, 1, 1, 1); }
    // fond : grand arc lumineux (la rue continue au-delà)
    b.S(K.stone).P(PT.pierre); lb(b, 2 * RV + 2, SP, .4, ST, 0, SP / 2, ZB - .2, 0, 1); lo(b, new THREE.CylinderGeometry(RV + 1, RV + 1, .4, 28, 1, false, -PI / 2, PI), ST, 0, SP, ZB - .2, -PI / 2, 0, 0); b.P(0);
    b.S(null); lo(b, new THREE.PlaneGeometry(4.4, 3.4), 0xfff3d6, 0, 1.7, ZB + .02, 0, 0, 0, 1, 1, 1, 1); lo(b, new THREE.CircleGeometry(2.2, 20, 0, PI), 0xfff3d6, 0, 3.4, ZB + .02, 0, 0, 0, 1, 1, 1, 1);
    b.S(K.stone); arc(b, 2.32, .14, ST2, 0, 3.4, ZB + .04, 0, PI); for (const s of [-1, 1]) RB(b, .3, 3.4, .3, ST2, s * 2.32, 1.7, ZB + .04);
    b.S(K.paint); for (let k = 1; k < 8; k++) { const a = k / 8 * PI; seg(b, [0, 3.4, ZB + .05], [Math.cos(a) * 2.2, 3.4 + Math.sin(a) * 2.2, ZB + .05], .02, GR, 4); } arc(b, 1.2, .025, GR, 0, 3.4, ZB + .05, 0, PI);
    for (let k = 1; k < 12; k++) { const a = k / 12 * PI; seg(b, [Math.cos(a) * .5, SP + Math.sin(a) * .5, ZB + .02], [Math.cos(a) * (RV - .08), SP + Math.sin(a) * (RV - .08), ZB + .02], .03, GR2, 4); } arc(b, 2.4, .03, GR2, 0, SP, ZB + .02, 0, PI); }

  // ---------- façade centrale : vitrages, porte, linteau de fonte, bandeau d'enseigne, grand arc vitré en éventail ----------
  function facade(b) {
    b.S(K.stone); lb(b, 2 * DW + .4, .05, .8, GRAN, 0, .025, Z0 + .05); // seuil de granit
    for (const s of [-1, 1]) { const w = RV - DW, xc = s * (DW + w / 2);
      b.P(PT.pierre); RB(b, w, .55, .3, ST2, xc, .275, Z0); b.P(0);
      b.S(K.glass); bx(b, w, DH - .55, .03, GL, xc, (DH + .55) / 2, Z0, 0, 2);
      b.S(K.paint); bx(b, .2, DH, .22, GR, s * DW, DH / 2, Z0 + .03); bx(b, .26, .2, .26, GR2, s * DW, .1, Z0 + .03); b.S(K.gold); bx(b, .24, .06, .25, GOLD, s * DW, DH - .2, Z0 + .03); b.S(K.paint);
      bx(b, .06, DH - .55, .1, GR, xc, (DH + .55) / 2, Z0 + .02); for (const y of [1.75, 2.95]) bx(b, w, .06, .1, GR, xc, y, Z0 + .02);
      arc(b, .32, .03, GR, xc, 3.37, Z0 + .03, 0, TAU); arc(b, .32, .03, GR, xc, 1.15, Z0 + .03, 0, TAU); b.S(K.gold); ball(b, .06, GOLD, xc, 3.37, Z0 + .05); ball(b, .06, GOLD, xc, 1.15, Z0 + .05); }
    // linteau de fonte rivetée, bandeau d'enseigne vert et or
    b.S(K.paint); lb(b, 2 * RV, .5, .26, GR, 0, DH + .25, Z0 + .04);
    b.S(K.gold); for (let x = -RV + .2; x < RV - .1; x += .3) { ball(b, .025, GOLD, x, DH + .07, Z0 + .18); ball(b, .025, GOLD, x, DH + .43, Z0 + .18); }
    for (let x = -RV + .45; x < RV - .3; x += .5) lo(b, new THREE.TorusGeometry(.1, .018, 4, 12), GOLD, x, DH + .25, Z0 + .18);
    b.S(K.paint); lb(b, 2 * RV - .2, .78, .1, GR2, 0, 4.81, Z0 + .02); b.S(K.gold); for (const y of [4.44, 5.18]) lb(b, 2 * RV - .2, .04, .12, GOLD, 0, y, Z0 + .03);
    for (const s of [-1, 1]) { bx(b, .04, .78, .12, GOLD, s * (RV - .12), 4.81, Z0 + .03); lo(b, new THREE.OctahedronGeometry(.09), GOLD, s * (RV - .38), 4.81, Z0 + .09); }
    b.S(K.paint); lb(b, 2 * RV, .2, .22, GR, 0, SP - .1, Z0 + .02); b.S(K.gold); lb(b, 2 * RV, .03, .24, GOLD, 0, SP - .02, Z0 + .03);
    // grand arc vitré : verre, meneaux rayonnants, cercles, boucles, soleil d'or au centre
    b.S(K.glass); b.add(dbl(new THREE.CircleGeometry(RV, 40, 0, PI)), GL, b.M(0, SP, Z0 - .04), 2);
    b.S(K.paint); for (let k = 1; k < 12; k++) { const a = k / 12 * PI; seg(b, [Math.cos(a) * .6, SP + Math.sin(a) * .6, Z0], [Math.cos(a) * RV, SP + Math.sin(a) * RV, Z0], .035, GR, 5); }
    for (const [r, t] of [[1.6, .035], [2.7, .035], [3.5, .035], [RV - .03, .07]]) arc(b, r, t, GR, 0, SP, Z0, 0, PI);
    for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * PI; lo(b, new THREE.TorusGeometry(.27, .02, 4, 14), GR, Math.cos(a) * 3.1, SP + Math.sin(a) * 3.1, Z0); }
    b.S(K.gold); for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * PI; br(b, .13, .13, .03, GOLD, Math.cos(a) * 2.15, SP + Math.sin(a) * 2.15, Z0 + .01, 0, 0, PI / 4 + a); }
    lo(b, new THREE.CircleGeometry(.6, 20, 0, PI), GOLD, 0, SP, Z0 + .02); arc(b, .62, .05, GOLD, 0, SP, Z0 + .03, 0, PI);
    for (let k = 0; k <= 10; k++) { const a = k / 10 * PI; br(b, .03, .5, .02, GOLD, Math.cos(a) * .9, SP + Math.sin(a) * .9, Z0 + .02, 0, 0, a - PI / 2); } ball(b, .14, GOLD, 0, SP + .02, Z0 + .06);
    // archivolte de pierre à claveaux, clé sculptée
    b.S(K.stone).P(PT.pierre); const NV = 19;
    for (let k = 0; k < NV; k++) { const a = (k + .5) / NV * PI, key = k === (NV - 1) / 2, rr = key ? .95 : .7, rm = RV + rr / 2 - .02, w = (RV + .35) * PI / NV - .04;
      RB(b, key ? w * 1.3 : w, rr, key ? .8 : k % 2 ? .62 : .54, k % 2 ? ST : ST2, Math.cos(a) * rm, SP + Math.sin(a) * rm, Z0 + .12, 0, 0, a - PI / 2); }
    b.P(0); b.S(K.gold); lo(b, new THREE.SphereGeometry(.3, 14, 10), GOLD, 0, SP + RV + .46, Z0 + .52, 0, 0, 0, .8, 1, .25); lo(b, new THREE.SphereGeometry(.2, 12, 8), GR, 0, SP + RV + .46, Z0 + .57, 0, 0, 0, .8, 1, .25);
    // écoinçons et médaillons
    b.S(K.stone); const R2 = RV + .68, a0 = Math.acos(RV / R2);
    for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(s * RV, SP + Math.sin(a0) * R2); sh.lineTo(s * RV, EY); sh.lineTo(0, EY);
      for (let i = 0; i <= 14; i++) { const t = i / 14, a = s > 0 ? PI / 2 + (a0 - PI / 2) * t : PI / 2 + (PI / 2 - a0) * t; sh.lineTo(Math.cos(a) * R2, SP + Math.sin(a) * R2); }
      b.P(PT.pierre); b.add(new THREE.ExtrudeGeometry(sh, { depth: .42, bevelEnabled: false }), ST, b.M(0, 0, Z0 - .2)); b.P(0);
      b.S(K.gold); arc(b, .3, .045, GOLD, s * 3.3, 9.3, Z0 + .25, 0, TAU); b.S(K.paint); lo(b, new THREE.CircleGeometry(.27, 16), GR, s * 3.3, 9.3, Z0 + .23); b.S(K.gold); lo(b, new THREE.OctahedronGeometry(.13), GOLD, s * 3.3, 9.3, Z0 + .28, 0, 0, 0, 1, 1.3, .4); } }

  // ---------- entablement, attique à horloge, ailerons, couronnement doré ----------
  function crown(b) {
    b.S(K.stone).P(PT.pierre); lb(b, 11.7, .28, 1.75, ST2, 0, EY + .14, Z0 - .37, 0, 1); lb(b, 11.6, .34, 1.7, ST, 0, EY + .45, Z0 - .4, 0, 1); b.P(0);
    lb(b, 11.95, .2, 2.0, ST2, 0, EY + .72, Z0 - .32, 0, 1);
    b.S(K.gold); for (let x = -5.7; x <= 5.71; x += .3) bx(b, .1, .1, .06, GOLD, x, EY + .45, Z0 + .46);
    b.S(K.stone); for (let x = -5.85; x <= 5.86; x += .195) bx(b, .09, .08, .1, ST3, x, EY + .58, Z0 + .58);
    // attique central et horloge
    const AY = EY + .82; b.P(PT.pierre); RB(b, 3.2, 1.4, .8, ST, 0, AY + .7, Z0 - .02); b.P(0); RB(b, 3.4, .14, .9, ST2, 0, AY + 1.45, Z0 - .02);
    clockFace(b, 0, AY + .68, Z0 + .43, .52);
    b.S(K.stone); for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(s * 1.6, AY); sh.lineTo(s * 3.3, AY); sh.quadraticCurveTo(s * 1.75, AY + .15, s * 1.6, AY + 1.3); sh.lineTo(s * 1.6, AY);
      b.add(new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: false }), ST2, b.M(0, 0, Z0 - .25)); arc(b, .17, .05, ST2, s * 3.1, AY + .2, Z0 + .1, 0, TAU * .8, 0, 0, 0);
      b.S(K.gold); ball(b, .07, GOLD, s * 3.1, AY + .2, Z0 + .17); b.S(K.stone);
      // vases de pierre fleuris au bout des ailerons
      lo(b, URN, ST2, s * 3.55, AY, Z0 + .05, 0, 0, 0, .9, 1, .9); b.S(K.leaf); b.jit(.1); b.ico(.2, 1, 0x4f9a46, s * 3.55, AY + .58, Z0 + .05, 1.2, .8, 1.2); b.jit(0); b.S(null);
      for (let k = 0; k < 5; k++) ball(b, .05, [0xff6b8a, 0xffd23f, 0xffffff, 0xff6b8a, 0xb97cff][k], s * 3.55 + Math.cos(k * 1.3) * .17, AY + .66, Z0 + .05 + Math.sin(k * 1.3) * .17); b.S(K.stone); }
    // fronton cintré et sphère armillaire dorée
    lo(b, new THREE.TorusGeometry(1.75, .13, 5, 24, PI), ST2, 0, AY + 1.5, Z0 + .1, 0, 0, 0, 1, .42, 1); lo(b, new THREE.CircleGeometry(1.7, 24, 0, PI), ST, 0, AY + 1.5, Z0 + .02, 0, 0, 0, 1, .42, 1);
    b.S(K.gold); lo(b, new THREE.CircleGeometry(.36, 14, 0, PI), GOLD, 0, AY + 1.53, Z0 + .05); for (let k = 0; k <= 8; k++) { const a = k / 8 * PI; br(b, .025, .26, .02, GOLD, Math.cos(a) * .5, AY + 1.53 + Math.sin(a) * .4, Z0 + .05, 0, 0, a - PI / 2); }
    b.S(K.stone); RB(b, .5, .25, .4, ST2, 0, AY + 2.32, Z0 + .02); b.S(K.gold);
    arc(b, .32, .025, GOLD, 0, AY + 2.82, Z0 + .02, 0, TAU); arc(b, .32, .025, GOLD, 0, AY + 2.82, Z0 + .02, 0, TAU, 0, PI / 2, 0); arc(b, .32, .02, GOLD, 0, AY + 2.82, Z0 + .02, 0, TAU, PI / 2, 0, .4);
    ball(b, .1, GOLD, 0, AY + 2.82, Z0 + .02); seg(b, [0, AY + 2.45, Z0 + .02], [0, AY + 3.45, Z0 + .02], .02, GOLD, 5); lo(b, new THREE.ConeGeometry(.05, .2, 6), GOLD, 0, AY + 3.5, Z0 + .02); }

  // ---------- pavillons de pierre : bossages, niche à statue, colonnes engagées, médaillon, dôme de zinc et drapeau ----------
  function pylon(b, s) { const xc = s * 4.85, W = 1.7, zf = Z0 + .45, zb = Z0 - 1.25, D = zf - zb, zc = (zf + zb) / 2;
    b.S(K.stone).P(PT.pierre); RB(b, W + .16, .6, D + .16, ST3, xc, .3, zc); RB(b, W, SP - .6, D, ST, xc, .6 + (SP - .6) / 2, zc);
    RB(b, W + .14, .22, D + .14, ST2, xc, SP + .11, zc); RB(b, W - .1, EY - SP - .22, D - .1, ST, xc, SP + .22 + (EY - SP - .22) / 2, zc - .05); b.P(0);
    for (let y = 1.0; y < SP - .2; y += .45) bx(b, W + .01, .03, .03, ST3, xc, y, zf + .002);
    // niche et statue
    RB(b, .84, 2.0, .06, ST3, xc, 2.25, zf + .01); lo(b, new THREE.CircleGeometry(.42, 16, 0, PI), ST3, xc, 3.25, zf + .03);
    for (let k = 1; k < 8; k++) { const a = k / 8 * PI; br(b, .03, .3, .02, ST, xc + Math.cos(a) * .2, 3.25 + Math.sin(a) * .2, zf + .05, 0, 0, a - PI / 2); }
    arc(b, .5, .07, ST2, xc, 3.25, zf + .06, 0, PI); for (const k of [-1, 1]) RB(b, .14, 2.0, .14, ST2, xc + k * .5, 2.25, zf + .06); RB(b, 1.2, .14, .3, ST2, xc, 1.2, zf + .1);
    statue(b, xc, 1.27, zf + .12, s);
    // lanterne d'applique sur console à volute
    b.S(K.paint); const lx = xc + s * .64; seg(b, [lx, 3.45, zf], [lx, 3.45, zf + .5], .025, GR, 5); spiral(b, (u, v) => [lx, v, zf + u], .16, 3.3, .14, PI / 2, 1.1, -1, .016, GR); lantern(b, lx, 2.72, zf + .5, 1.05); seg(b, [lx, 3.4, zf + .5], [lx, 3.45, zf + .5], .012, GR2);
    // étage : colonnes engagées, médaillon, guirlande, cartouche
    b.S(K.stone); for (const k of [-1, 1]) { const x = xc + k * .55; RB(b, .46, .16, .2, ST2, x, SP + .3, zf - .04); b.cyl(.17, .19, EY - SP - .7, 16, ST, x, SP + .38 + (EY - SP - .7) / 2, zf - .05, 0, 0, 0, 0, true);
      b.S(K.gold); b.cyl(.24, .16, .26, 12, GOLD, x, EY - .2, zf - .05); RB(b, .5, .08, .26, GOLD, x, EY - .04, zf - .05); b.S(K.stone); }
    b.S(K.gold); arc(b, .36, .05, GOLD, xc, 7.7, zf - .05, 0, TAU); b.S(K.paint); lo(b, new THREE.CircleGeometry(.33, 18), GR2, xc, 7.7, zf - .085); b.S(K.gold); lo(b, new THREE.OctahedronGeometry(.14), GOLD, xc, 7.7, zf - .04, 0, 0, 0, 1, 1.3, .4);
    for (let k = 0; k <= 8; k++) { const t = k / 8, x = xc - .38 + t * .76, y = 7.05 - Math.sin(t * PI) * .22; lo(b, new THREE.SphereGeometry(.05, 6, 4), k % 2 ? 0x6f9a4a : GOLD, x, y, zf - .06); }
    b.S(K.stone); RB(b, .7, .5, .05, ST2, xc, 8.85, zf - .08); b.S(K.gold); bx(b, .5, .03, .03, GOLD, xc, 8.85, zf - .05);
    // attique, dôme de zinc côtelé d'or, lanternon, drapeau
    b.S(K.stone).P(PT.pierre); RB(b, W, .7, D - .1, ST2, xc, EY + 1.17, zc - .05); b.P(0); RB(b, W + .1, .1, D, ST3, xc, EY + 1.56, zc - .05);
    const DY = EY + 1.6; b.S(K.paint); lo(b, new THREE.SphereGeometry(.78, 20, 8, 0, TAU, 0, PI / 2), ZINC, xc, DY, zc - .05);
    b.S(K.gold); for (let k = 0; k < 8; k++) arc(b, .79, .025, GOLD, xc, DY, zc - .05, 0, PI / 2, 0, k * PI / 4, 0, 0, 10);
    b.S(K.paint); pc(b, .2, .2, .42, 8, GR, xc, DY + .98, zc - .05); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bx(b, .03, .4, .03, GOLD, xc + Math.sin(a) * .2, DY + .98, zc - .05 + Math.cos(a) * .2); }
    lo(b, new THREE.ConeGeometry(.26, .3, 8), ZINC, xc, DY + 1.34, zc - .05); b.S(K.gold); ball(b, .07, GOLD, xc, DY + 1.52, zc - .05);
    seg(b, [xc, DY + 1.5, zc - .05], [xc, DY + 2.75, zc - .05], .022, GOLD, 6); ball(b, .05, GOLD, xc, DY + 2.78, zc - .05);
    b.S(K.fabric); [0x2f4fa8, 0xf6f4ee, 0xd8343a].forEach((c, i) => br(b, .3, .55, .02, c, xc + s * (.17 + i * .3), DY + 2.38, zc - .05 + Math.sin(i * 1.4) * .05, 0, s * (i - 1) * .12, 0)); b.S(null); }

  // ---------- ailes : arcades de boutiques, petites marquises, corniche et balustrade sur les falaises ----------
  function wing(b, s) { const x0 = s * 5.7, x1 = s * 9.05, xc = (x0 + x1) / 2, W = Math.abs(x1 - x0), zf = Z0 + .06;
    b.S(K.stone).P(PT.pierre); RB(b, W, 4.1, .5, ST, xc, 2.05, Z0 - .19); RB(b, W + .1, .45, .58, ST3, xc, .225, Z0 - .17); b.P(0);
    RB(b, W + .06, .2, .7, ST2, xc, 4.18, Z0 - .12); RB(b, W + .12, .12, .8, ST2, xc, 4.34, Z0 - .1);
    for (const x of [x0 + s * .14, xc, x1 - s * .14]) { RB(b, .24, 3.6, .12, ST2, x, 2.2, zf); RB(b, .32, .14, .16, ST2, x, 3.98, zf + .01); }
    // balustrade
    RB(b, W, .1, .36, ST2, xc, 4.45, Z0 - .02); RB(b, W + .04, .1, .38, ST2, xc, 5.05, Z0 - .02);
    for (let x = Math.min(x0, x1) + .3; x < Math.max(x0, x1) - .25; x += .21) lo(b, BAL, ST, x, 4.5, Z0 - .02, 0, 0, 0, 1, 1.15, 1);
    for (const x of [x0 + s * .2, x1 - s * .2]) RB(b, .32, .72, .4, ST2, x, 4.78, Z0 - .02);
    lo(b, URN, ST2, x1 - s * .2, 5.14, Z0 - .02, 0, 0, 0, .8, .9, .8); b.S(K.leaf); b.jit(.1); b.ico(.18, 1, 0x4f9a46, x1 - s * .2, 5.66, Z0 - .02, 1.2, .8, 1.2); b.jit(0); b.S(null);
    for (let k = 0; k < 5; k++) ball(b, .045, [0xff6b8a, 0xffd23f, 0xffffff, 0xd8343a, 0xb97cff][k], x1 - s * .2 + Math.cos(k * 1.3) * .16, 5.74, Z0 - .02 + Math.sin(k * 1.3) * .16);
    // deux arcades : une porte vitrée, une vitrine ; petites marquises de verre
    [xc - s * .82, xc + s * .82].forEach((x, i) => { b.S(K.stone); arc(b, .66, .08, ST2, x, 2.62, zf + .02, 0, PI); RB(b, .16, .2, .14, ST, x, 3.3, zf + .04);
      b.S(null); bx(b, 1.08, 2.2, .04, i ? WIN : 0xe9d9b0, x, 1.52, zf, 0, i ? 1 : 0); lo(b, new THREE.CircleGeometry(.54, 14, 0, PI), WIN, x, 2.62, zf + .005, 0, 0, 0, 1, 1, 1, 1);
      b.S(K.paint); for (const k of [-1, 1]) bx(b, .08, 2.2, .08, GR, x + k * .54, 1.52, zf + .02); bx(b, 1.16, .08, .08, GR, x, 2.62, zf + .02); arc(b, .54, .03, GR, x, 2.62, zf + .03, 0, PI);
      for (let k = 1; k < 6; k++) { const a = k / 6 * PI; seg(b, [x, 2.62, zf + .03], [x + Math.cos(a) * .54, 2.62 + Math.sin(a) * .54, zf + .03], .012, GR, 4); }
      if (!i) { bx(b, .5, 2.0, .06, GR, x, 1.0 + .42, zf + .03); bx(b, .36, .9, .07, 0xe9d9b0, x, 1.85, zf + .04); b.S(K.gold); ball(b, .03, GOLD, x + .17, 1.32, zf + .08); b.S(K.paint); for (const k of [-1, 1]) bx(b, .22, 2.0, .05, GR, x + k * .4, 1.42, zf + .03); }
      else { bx(b, 1.08, .4, .07, GR, x, .62, zf + .03); for (const k of [-.27, .27]) bx(b, .04, 1.7, .07, GR, x + k, 1.67, zf + .03); }
      bx(b, 1.0, .26, .06, GR2, x, 3.0, zf + .03); b.S(K.gold); bx(b, .7, .04, .07, GOLD, x, 3.0, zf + .04); b.S(K.paint);
      // petite marquise : verre incliné, cadre, lambrequin, deux consoles
      b.S(K.glass); br(b, 1.36, .025, .86, GL, x, 3.5, zf + .43, .16, 0, 0, 2); b.S(K.paint);
      bx(b, 1.4, .1, .05, GR, x, 3.43, zf + .86); bx(b, 1.4, .05, .05, GR, x, 3.6, zf + .02); for (const k of [-1, 1]) br(b, .04, .05, .88, GR, x + k * .68, 3.52, zf + .43, .16, 0, 0);
      for (let k = 0; k < 7; k++) { const xx = x - .6 + k * .2; lo(b, new THREE.ConeGeometry(.04, .1, 4), GR, xx, 3.33, zf + .86, PI); }
      for (const k of [-1, 1]) { const cx = x + k * .58, P = (u, v) => [cx, v, zf + u]; line(b, [[cx, 2.95, zf], [cx, 3.2, zf + .35], [cx, 3.42, zf + .78]], .018, GR, 4); spiral(b, P, .2, 3.25, .1, PI, 1.2, 1, .012, GR); } }); }

  // ---------- la grande marquise : verre en éventail, nervures en treillis, cercles, bandeau, crête, lambrequin, consoles, colonnes ----------
  function fonte(b, x, z, H) { b.S(K.stone); RB(b, .44, .16, .44, ST3, x, .08, z); b.S(K.paint);
    b.cyl(.17, .2, .14, 16, GR, x, .23, z); b.S(K.gold); b.tor(.15, .03, GOLD, x, .31, z, PI / 2, 0, 0, 0, 16); b.S(K.paint);
    b.cyl(.1, .12, H - .78, 16, GR, x, .3 + (H - .78) / 2, z, 0, 0, 0, 0, true);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bx(b, .022, H - 1.4, .022, GR2, x + Math.cos(a) * .105, .55 + (H - 1.4) / 2, z + Math.sin(a) * .105); }
    b.S(K.gold); b.tor(.11, .025, GOLD, x, 1.25, z, PI / 2, 0, 0, 0, 16); b.tor(.1, .02, GOLD, x, H - .8, z, PI / 2, 0, 0, 0, 16);
    // chapiteau à feuilles d'acanthe
    b.S(K.paint); b.cyl(.22, .1, .34, 16, GR, x, H - .58, z);
    b.S(K.gold); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2; lo(b, new THREE.SphereGeometry(.06, 6, 4), GOLD, x + Math.cos(a) * .16, H - .52, z + Math.sin(a) * .16, 0, -a, .5, 1.6, .8, .5); }
    b.S(K.paint); RB(b, .48, .08, .48, GR2, x, H - .37, z); RB(b, .3, .3, .3, GR, x, H - .18, z); }
  function marquise(b) { const { RX, RZ, YA, YE, TH } = MQ, NS = 16, NT = 7, th = i => -TH + 2 * TH * i / NS;
    // verrière
    const pts = []; for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { const t0 = j / NT, t1 = (j + 1) / NT, A = mqP(th(i), t0), B = mqP(th(i + 1), t0), C = mqP(th(i + 1), t1), D = mqP(th(i), t1); if (j === 0) pts.push(...A, ...C, ...D); else pts.push(...A, ...B, ...C, ...A, ...C, ...D); }
    b.S(K.glass); b.add(dbl(tris(pts)), 0xd3ecef, b.M(0, .03, 0), 2);
    // nervures : membrure haute, membrure basse en ventre de poisson, anneaux de dentelle
    b.S(K.paint); for (let i = 1; i < NS; i++) { const a = th(i), top = [], bot = [], dep = t => .42 * Math.pow(1 - t, 1.3) + .02;
      for (let k = 0; k <= 8; k++) { const t = k / 8, p = mqP(a, t); top.push(p); bot.push([p[0], p[1] - dep(t), p[2]]); }
      line(b, top, .03, GR, 5); line(b, bot, .022, GR, 5);
      const ry = Math.atan2(RX * Math.sin(a), RZ * Math.cos(a)) - PI / 2;
      for (const t of [.15, .34, .53, .72]) { const p = mqP(a, t), d = dep(t), rr = d * .36; if (rr < .035) continue; lo(b, new THREE.TorusGeometry(rr, .012, 3, 10), GR, p[0], p[1] - d / 2, p[2], 0, ry, 0); }
      b.S(K.gold); const q = mqP(a, .9); ball(b, .03, GOLD, q[0], q[1] - .06, q[2]); b.S(K.paint); }
    for (const t of [.36, .66]) { const r = []; for (let i = 0; i <= 32; i++) r.push(mqP(-TH + 2 * TH * i / 32, t)); line(b, r, .022, GR, 5); }
    b.S(K.gold); { const r = []; for (let i = 0; i <= 16; i++) r.push(mqP(-TH + 2 * TH * i / 16, .12)); line(b, r, .03, GOLD, 5); }
    // bandeau du bord, filets d'or, crête de fleurons, lambrequin festonné à gouttes d'or
    const NE = 40, E = []; for (let i = 0; i <= NE; i++) E.push(mqP(-TH + 2 * TH * i / NE, 1));
    for (let i = 0; i < NE; i++) { const a = E[i], c = E[i + 1], mx = (a[0] + c[0]) / 2, mz = (a[2] + c[2]) / 2, L = Math.hypot(c[0] - a[0], c[2] - a[2]) + .012, ry = Math.atan2(-(c[2] - a[2]), c[0] - a[0]);
      b.S(K.paint); br(b, L, .26, .05, GR, mx, YE - .1, mz, 0, ry, 0); br(b, L, .035, .08, GR2, mx, YE - .23, mz, 0, ry, 0); br(b, L, .03, .09, GR2, mx, YE + .03, mz, 0, ry, 0);
      b.S(K.gold); br(b, L, .025, .07, GOLD, mx, YE - .09, mz, 0, ry, 0);
      b.S(K.paint); br(b, L, .1, .02, GR, mx, YE - .3, mz, 0, ry, 0); lo(b, dbl(new THREE.CircleGeometry(L / 2, 8, PI, PI)), GR, mx, YE - .35, mz, 0, ry, 0);
      b.S(K.gold); lo(b, new THREE.ConeGeometry(.025, .08, 5), GOLD, mx, YE - .35 - L / 2 - .02, mz, PI); ball(b, .016, GOLD, mx, YE - .35 - L / 2 - .07, mz);
      b.S(K.paint); bx(b, .016, .16, .016, GR, mx, YE + .12, mz); lo(b, new THREE.ConeGeometry(.03, .1, 4), GR, mx, YE + .22, mz); b.S(K.gold); ball(b, .02, GOLD, mx, YE + .28, mz);
      b.S(K.paint); bx(b, .012, .1, .012, GR, a[0], YE + .08, a[2]); }
    // cartouche doré au milieu du bord
    { const e = mqP(0, 1); b.S(K.gold); lo(b, new THREE.SphereGeometry(.17, 14, 10), GOLD, e[0], YE - .1, e[2] + .05, 0, 0, 0, 1.3, .9, .25); b.S(K.paint); lo(b, new THREE.SphereGeometry(.11, 12, 8), GR, e[0], YE - .1, e[2] + .08, 0, 0, 0, 1.3, .9, .25); }
    // poutre murale et rosace d'or au départ de l'éventail
    b.S(K.paint); lb(b, 2 * RV, .14, .14, GR, 0, YA + .02, Z0 + .07); b.S(K.gold); lo(b, new THREE.CircleGeometry(.42, 16, PI, PI), GOLD, 0, YA - .02, Z0 + .15); arc(b, .44, .03, GOLD, 0, YA - .02, Z0 + .16, PI, TAU);
    lo(b, new THREE.SphereGeometry(.16, 12, 8), GOLD, 0, YA - .32, Z0 + .2, 0, 0, 0, 1, 1.2, .5);
    // grandes consoles à volutes contre les pavillons
    const CT = YE - .1; for (const s of [-1, 1]) { const cx = s * 4.12, zf = Z0 + .45, P = (u, v) => [cx, v, zf + u], out = [];
      b.S(K.paint); for (let k = 0; k <= 10; k++) { const f = k / 10 * PI / 2; out.push(P(1.25 * (1 - Math.cos(f)), 2.9 + (CT - 2.9) * Math.sin(f))); } line(b, out, .035, GR, 5);
      seg(b, P(0, 2.8), P(0, CT + .03), .04, GR, 5); seg(b, P(0, CT), P(1.3, CT), .035, GR, 5);
      spiral(b, P, .4, 3.85, .28, -PI / 2, 1.25, 1, .022, GR); spiral(b, P, .95, CT - .17, .13, PI / 2, 1.1, -1, .018, GR); spiral(b, P, .12, 3.2, .1, 0, 1, 1, .015, GR);
      b.S(K.gold); ball(b, .05, GOLD, ...P(.4, 3.85)); ball(b, .035, GOLD, ...P(.95, CT - .17)); for (let k = 1; k < 4; k++) seg(b, P(k * .3, CT), P(k * .3, CT - .1), .012, GOLD, 4); }
    // tirants accrochés au grand arc, avec ridoirs et rosaces
    for (const [ax, ay, a] of [[1.5, 6.4, .45], [3.0, 6.0, 1.1]]) for (const s of [-1, 1]) { const A = [s * ax, ay, Z0 + .04], p = mqP(s * a, .82), B = [p[0], p[1] + .02, p[2]], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
      b.S(K.paint); seg(b, A, B, .018, GR2, 5); b.S(K.gold); lo(b, new THREE.SphereGeometry(.1, 10, 6), GOLD, ...A, 0, 0, 0, 1, 1, .4); seg(b, [M[0], M[1] - .1, M[2]], [M[0], M[1] + .1, M[2]], .03, GOLD, 6); ball(b, .04, GOLD, ...B); }
    // lanternes suspendues sous la verrière
    for (const a of [-.62, 0, .62]) { const p = mqP(a, .58); b.S(K.paint); seg(b, [p[0], 3.88, p[2]], [p[0], p[1] - .02, p[2]], .012, GR2, 4); lantern(b, p[0], 3.18, p[2], 1.1); }
    // colonnes de fonte, consoles en S le long du bord, globes dorés au-dessus
    for (const s of [-1, 1]) { const x = s * COL[0], z = COL[2], H = YE - .3; fonte(b, x, z, H);
      const e = mqP(s * .82, 1); b.S(K.paint); seg(b, [x, H, z], [e[0], YE - .24, e[2]], .04, GR, 5);
      const tg = [Math.cos(s * .82) * MQ.RX, -Math.sin(s * .82) * MQ.RZ], tl = Math.hypot(tg[0], tg[1]), ux = tg[0] / tl, uz = tg[1] / tl;
      for (const k of [-1, 1]) { const P = (u, v) => [x + ux * u * k, v, z + uz * u * k]; line(b, [P(0, H - .3), P(.25, H - .05), P(.6, YE - .3)], .02, GR, 4); spiral(b, P, .3, H - .25, .11, PI, 1.1, 1, .014, GR); }
      b.S(K.paint); b.cyl(.09, .13, .16, 12, GR, e[0], YE + .1, e[2]); seg(b, [e[0], YE + .18, e[2]], [e[0], YE + .5, e[2]], .03, GR, 6); b.S(K.gold); b.tor(.07, .02, GOLD, e[0], YE + .48, e[2], PI / 2);
      b.S(null); b.sph(.17, WIN, e[0], YE + .66, e[2], 1, 1, 1, 1); b.S(K.gold); lo(b, new THREE.ConeGeometry(.06, .12, 8), GOLD, e[0], YE + .87, e[2]); } }

  // ---------- décor du sol de la place (dessiné avec la porte) : cercle de granit, bordures des parterres, arceaux ----------
  const HOOP = new THREE.TorusGeometry(.13, .011, 3, 6, PI);
  function plaza(b) { b.S(K.stone); const FZ = 5.5; // centre de la fontaine (z local)
    b.add(new THREE.RingGeometry(2.08, 2.4, 48, 1).rotateX(-PI / 2), GRAN, b.M(0, .013, FZ)); b.add(new THREE.RingGeometry(2.46, 2.53, 48, 1).rotateX(-PI / 2), 0xf4f0e6, b.M(0, .014, FZ));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + PI / 8; br(b, .16, .012, .55, k % 2 ? GRAN : 0xc9b98f, Math.sin(a) * 2.85, .013, FZ + Math.cos(a) * 2.85, 0, a, 0); }
    for (const s of [-1, 1]) { const x0 = s > 0 ? 5 : -8, x1 = x0 + 3, z0 = 3.5, z1 = 7.5, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      lb(b, 3.1, .1, .1, GRAN, cx, .05, z0 + .05); lb(b, 3.1, .1, .1, GRAN, cx, .05, z1 - .05); lb(b, .1, .1, 3.9, GRAN, x0 + .05, .05, cz); lb(b, .1, .1, 3.9, GRAN, x1 - .05, .05, cz);
      b.S(K.paint); for (let x = x0 + .3; x < x1 - .2; x += .32) for (const z of [z0 + .17, z1 - .17]) lo(b, HOOP, GR, x + .16, 0, z);
      for (let z = z0 + .3; z < z1 - .2; z += .32) for (const x of [x0 + .17, x1 - .17]) lo(b, HOOP, GR, x, 0, z + .16, 0, PI / 2, 0); b.S(K.stone); }
    lb(b, 18, .03, .14, GRAN, 0, .015, 8.5); }

  MD.porte_marquise = v => { const b = G.mb(1907); hall(b); facade(b); crown(b); for (const s of [-1, 1]) { pylon(b, s); wing(b, s); } marquise(b); plaza(b); return b.done(); };

  // ---------- fontaine de la place : bassin mouluré, piédestal à mascarons, deux vasques de bronze, nappes d'eau ----------
  MD.fontaine_marquise = v => { const b = G.mb(1908), R = 1.85, WA = 0x8fd0de, NAP = 0xe4f6fa;
    b.S(K.stone).P(PT.pierre); b.cyl(R + .14, R + .22, .12, 48, ST3, 0, .06, 0); b.cyl(R + .02, R + .08, .24, 48, ST, 0, .24, 0); b.P(0);
    b.cyl(R - .1, R - .1, .02, 40, 0x3f7f8f, 0, .38, 0); b.tor(R - .02, .1, ST2, 0, .5, 0, PI / 2, 0, 0, 0, 48);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + PI / 8; br(b, .44, .2, .03, ST2, Math.sin(a) * (R + .09), .28, Math.cos(a) * (R + .09), 0, a, 0); }
    b.S(K.glass); b.cyl(R - .08, R - .08, .02, 40, WA, 0, .43, 0, 0, 0, 0, 2);
    // piédestal et mascarons crachant l'eau
    b.S(K.stone).P(PT.pierre); pc(b, .5, .58, .6, 8, ST, 0, .7, 0); b.P(0); pc(b, .6, .6, .1, 8, ST2, 0, 1.03, 0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU, x = Math.sin(a) * .56, z = Math.cos(a) * .56; b.S(K.gold); b.sph(.09, GOLD, x, .78, z, 1, 1, .7);
      b.S(K.glass); line(b, [[x * 1.05, .76, z * 1.05], [x * 1.6, .7, z * 1.6], [x * 2.0, .5, z * 2.0], [x * 2.15, .44, z * 2.15]], .022, NAP, 5, 2); }
    // vasques de bronze vert, rebords dorés, nappes qui retombent
    b.S(K.paint); b.cyl(.14, .2, .5, 12, GR, 0, 1.33, 0); b.cyl(.95, .22, .3, 32, GR, 0, 1.7, 0); b.S(K.gold); b.tor(.95, .04, GOLD, 0, 1.85, 0, PI / 2, 0, 0, 0, 32);
    b.S(K.glass); b.cyl(.88, .88, .02, 28, WA, 0, 1.82, 0, 0, 0, 0, 2);
    // filets d'eau qui débordent des vasques et retombent en pluie, ronds dans l'eau
    for (let k = 0; k < 24; k++) { const a = (k + .5) / 24 * TAU, c = Math.cos(a), n = Math.sin(a); line(b, [[n * .97, 1.84, c * .97], [n * 1.06, 1.72, c * 1.06], [n * 1.13, 1.25, c * 1.13], [n * 1.17, .44, c * 1.17]], .022, NAP, 4, 2); }
    b.tor(1.17, .025, NAP, 0, .44, 0, PI / 2, 0, 0, 2, 32); b.tor(.66, .02, NAP, 0, 1.83, 0, PI / 2, 0, 0, 2, 24);
    b.S(K.paint); b.cyl(.07, .1, .5, 12, GR, 0, 2.08, 0); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; b.S(K.gold); b.sph(.07, GOLD, Math.sin(a) * .1, 2.05, Math.cos(a) * .1); }
    b.S(K.paint); b.cyl(.46, .1, .16, 24, GR, 0, 2.36, 0); b.S(K.gold); b.tor(.46, .025, GOLD, 0, 2.44, 0, PI / 2, 0, 0, 0, 24);
    b.S(K.glass); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, c = Math.cos(a), n = Math.sin(a); line(b, [[n * .47, 2.43, c * .47], [n * .53, 2.34, c * .53], [n * .61, 2.02, c * .61], [n * .66, 1.84, c * .66]], .018, NAP, 4, 2); }
    b.S(K.gold); b.sph(.1, GOLD, 0, 2.55, 0, 1, 1.5, 1); lo(b, new THREE.ConeGeometry(.04, .14, 6), GOLD, 0, 2.72, 0);
    b.S(K.glass); lo(b, new THREE.ConeGeometry(.05, .45, 8), NAP, 0, 2.95, 0, 0, 0, 0, 1, 1, 1, 2); return b.done(); };

  const mk = (id, n, model, p) => { O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p); };
  // collisions : la façade, les avancées des pavillons et les deux colonnes ; on passe librement sous la marquise et par la porte
  mk('porte_marquise', 'Entrée de la rue commerçante', 'porte_marquise', { fp: [10, 5], h: 12, walk: 1, fixed: 1, light: 1, ly: 3.6, ld: 11,
    hAt: (o, x, z, m) => { const [cx, cz] = m.center(o), lx = x - cx, lz = z - cz, ax = Math.abs(lx);
      if (lz < Z0 + .14 && ax > DW - .12) return 12; if (lz < Z0 + .58 && ax > RV - .06) return 12;
      if (Math.hypot(ax - COL[0], lz - COL[2]) < .26) return 6; return 0; } });
  mk('fontaine_marquise', 'Fontaine de la place', 'fontaine_marquise', { fp: [4, 4], h: .95, fixed: 1, fountain: 1, shadow: 1.2,
    hAt: (o, x, z, m) => { const [cx, cz] = m.center(o); return Math.hypot(x - cx, z - cz) < 2.02 ? .95 : 0; } });

  // ---------- la place : sols, fontaine, parterres, candélabres, bancs, orangers, terrasse, kiosque ----------
  const upgrade = m => { const g = m.meta.rueGate; if (!g || !g.big || g.v2 || m.interior) return false;
    const old = [...m.list].find(o => o.t === 'grande_porte'); if (!old) return false;
    const gx = old.x, L = m.lvl[m.idx(gx + 5, 5)], keep = o => O[o.t].enter || o.t === 'voie' || o.t === 'passage_niveau';
    m.removeObj(old);
    for (let z = 3; z < 15; z++) for (let x = gx - 4; x < gx + 14; x++) { if (!m.inb(x, z)) continue; const o = m.objAt(x, z); if (o && !keep(o)) m.removeObj(o); }
    for (let z = 4; z < 15; z++) for (let x = gx - 4; x < gx + 14; x++) { if (!m.inb(x, z)) continue; const i = m.idx(x, z), bed = z >= 9 && z <= 12 && ((x >= gx - 3 && x <= gx - 1) || (x >= gx + 10 && x <= gx + 12));
      m.lvl[i] = L; m.water[i] = 0; m.ramp[i] = 0; m.surf[i] = bed ? 7 : z === 14 ? 4 : 11; m.markDirty(x, z); }
    m.addObj('porte_marquise', gx, 3, 0);
    const put = (t, x, z, r = 0) => { if (m.canPlace(t, x, z, r)) m.addObj(t, x, z, r); };
    put('fontaine_marquise', gx + 3, 9);
    for (const [x, z] of [[gx + 2, 8], [gx + 7, 8], [gx + 2, 13], [gx + 7, 13]]) put('candelabre', x, z);
    for (const z of [9, 11]) { put('banc_fer', gx, z, 1); put('banc_fer', gx + 9, z, 3); }
    const bed = [['tulipe_rouge', 'tulipe_blanche', 'tulipe_rouge'], ['tulipe_blanche', 'rose_rose', 'tulipe_blanche'], ['tulipe_blanche', 'rose_rose', 'tulipe_blanche'], ['tulipe_rouge', 'tulipe_blanche', 'tulipe_rouge']];
    for (const x0 of [gx - 3, gx + 10]) for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) put(bed[r][c], x0 + c, 9 + r);
    for (const [x, z] of [[gx - 1, 7], [gx + 10, 7], [gx - 4, 13], [gx + 13, 13]]) put('oranger_caisse', x, z);
    for (const z of [5, 7]) { put('table_marbre', gx - 3, z); put('chaise_jardin', gx - 4, z, 1); put('chaise_jardin', gx - 2, z, 3); }
    put('kiosque_journaux', gx + 11, 5); put('colonne_morris', gx + 13, 7); put('fontaine_wallace', gx - 4, 9); put('fontaine_wallace', gx + 13, 9);
    m.meta.rueGate = { x0: gx + 2.6, x1: gx + 7.4, z: 3.75, sx: gx + 5, sz: 5.4, y: L * G.TIER, big: 1, v2: 1 };
    if (m._gateLbl && m.labels) m.labels.remove(m._gateLbl); m._gateLbl = G.mapLabel(m, '🏬 Rue commerçante', gx + 5, L * G.TIER + 13.4, 4.5, 1.7);
    if (m._pmDeco) m._pmDeco.forEach(o => o.parent && o.parent.remove(o)); m._pmDeco = undefined; return true; };
  G.on('worldgen', m => { upgrade(m); });
  G.on('load', () => { const m = G.world; if (m && upgrade(m)) m.flush(); });

  // ---------- enseigne peinte et aiguilles de l'horloge (à l'heure du jeu) ----------
  let TEX = null;
  const signTex = () => { if (TEX) return TEX; const c = G.cv(1024, 96), x = c.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = '#22483a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#d9b84a'; x.lineWidth = 4; x.strokeRect(6, 6, W - 12, H - 12); x.lineWidth = 1.5; x.strokeRect(14, 14, W - 28, H - 28);
    const gr = x.createLinearGradient(0, 18, 0, H - 18); gr.addColorStop(0, '#fbe8a0'); gr.addColorStop(.55, '#e2bd55'); gr.addColorStop(1, '#a8812a');
    x.font = 'bold 60px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.letterSpacing = '9px'; } catch (e) { /* ancien navigateur */ }
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillText('RUE COMMERÇANTE', W / 2 + 2, H / 2 + 5); x.fillStyle = gr; x.fillText('RUE COMMERÇANTE', W / 2, H / 2 + 2);
    x.fillStyle = '#e2bd55'; for (const cx of [60, W - 60]) { x.save(); x.translate(cx, H / 2); x.rotate(PI / 4); x.fillRect(-9, -9, 18, 18); x.restore(); x.beginPath(); x.arc(cx + (cx < W / 2 ? 34 : -34), H / 2, 5, 0, TAU); x.fill(); }
    TEX = new THREE.CanvasTexture(c); TEX.anisotropy = 4; return TEX; };
  // murs de soutènement en pierre (avec balustrade) là où le terrain autour de la place est plus haut : plus de talus de terre
  const walls = (m, o) => { const gx = o.x, L = m.lvl[m.idx(gx + 5, 8)], T = G.TIER, b = G.mb(1909); let n = 0;
    const edge = (x, z, nx, nz) => { const X = x + nx, Z = z + nz; if (!m.inb(X, Z)) return; const i = m.idx(X, Z); if (m.ramp[i] || m.water[i]) return; const dl = m.lvl[i] - L; if (dl <= 0) return;
      const h = dl * T, ex = x + .5 + nx * .5, ez = z + .5 + nz * .5, al = nx === 0, W = (w, d) => al ? [w, d] : [d, w], box = (w, hh, d, col, off, yy, round = 1) => { const [a, c] = W(w, d); if (round) RB(b, a, hh, c, col, ex - nx * off, yy, ez - nz * off); else bx(b, a, hh, c, col, ex - nx * off, yy, ez - nz * off); };
      b.S(K.stone).P(PT.pierre); box(1.0, h, .16, ST, .08, h / 2); b.P(0); box(1.0, .32, .24, ST3, .12, .16); box(1.02, .12, .34, ST2, .03, h + .06);
      for (let k = 0; k < 4; k++) { const t = -.375 + k * .25, px = ex + (al ? t : 0) + nx * .14, pz = ez + (al ? 0 : t) + nz * .14; lo(b, BAL, ST, px, h + .12, pz, 0, 0, 0, 1, 1.1, 1); }
      box(1.0, .08, .2, ST2, -.14, h + .66); if ((al ? x : z) % 3 === 0) { box(.26, .72, .26, ST2, -.14, h + .4); lo(b, URN, ST2, ex + nx * .14, h + .76, ez + nz * .14, 0, 0, 0, .55, .55, .55); }
      n++; };
    for (let z = 4; z < 15; z++) { edge(gx - 4, z, -1, 0); edge(gx + 13, z, 1, 0); }
    for (let x = gx - 4; x < gx + 14; x++) edge(x, 14, 0, 1);
    if (!n) return null; const mesh = new THREE.Mesh(b.done(), G.MATS); mesh.position.y = L * T; mesh.castShadow = mesh.receiveShadow = true; m.group.add(mesh); return mesh; };
  const deco = (m, o) => { const cx = o.x + 5, cz = o.z + 2.5, y = o.y, out = [];
    const wl = walls(m, o); if (wl) out.push(wl);
    const sm = G.curveMat(new THREE.MeshBasicMaterial({ map: signTex() })), sg = new THREE.Mesh(new THREE.PlaneGeometry(6.9, .62, 6, 1), sm); sg.position.set(cx, y + 4.81, cz + Z0 + .08); m.group.add(sg); out.push(sg);
    const hm = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x1d1f22 })), hand = (w, l) => { const g = new THREE.PlaneGeometry(w, l); g.translate(0, l / 2 - .06, 0); const h = new THREE.Mesh(g, hm); h.position.set(cx, y + EY + .82 + .68, cz + Z0 + .48); m.group.add(h); out.push(h); return h; };
    out.hr = hand(.07, .32); out.mn = hand(.045, .46); out.sign = sm;
    // l'étiquette flottante passe au-dessus du couronnement (sinon cachée par la façade)
    if (m.labels) for (const sp of m.labels.children) if (Math.abs(sp.position.x - cx) < .7 && sp.position.z < cz + Z0 && sp.position.z > cz + Z0 - 3 && sp.position.y > y + 2) sp.position.set(cx, y + 13.4, cz + Z0 + .5);
    return out; };
  G.on('frame', () => { const m = G.map; if (!m || m.interior || !m.group) return;
    if (m._pmDeco === undefined) { let o = null; for (const q of m.list) if (q.t === 'porte_marquise') { o = q; break; } m._pmDeco = o ? deco(m, o) : null; }
    const d = m._pmDeco; if (!d) return; const mn = G.clock ? G.clock.min : 0;
    d.mn.rotation.z = -(mn % 60) / 60 * TAU; d.hr.rotation.z = -((mn / 60) % 12) / 12 * TAU;
    const n = G.SU && G.SU.uNight ? G.SU.uNight.value : 0; d.sign.color.setScalar(1 - .3 * n); });
})();
