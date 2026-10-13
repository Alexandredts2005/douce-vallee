'use strict';
// ===== Rue commerçante v3 : une vraie rue — deux rangées de façades face à face, trottoirs bordés de granit,
// chaussée pavée, platanes, candélabres, terrasses de café, marché couvert, guirlandes de guinguette,
// une église et des grands magasins qui ferment la perspective, un passage couvert vers la gare.
// Plus de « trou creusé » entouré de falaises : la rue est tenue par des immeubles, la ville continue derrière. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, PI = Math.PI, PT = G.PAT;
  const WIN = 0xfff0c2, ST = 0xd9d2c2, IRON = 0x2b2f33, GR = 0x2f5240, GOLD = 0xd9b84a, ZINC = 0x7f8a96, SLATE = 0x55607a, CREAM = 0xf6f1e6;
  const P = (...a) => G.prism(...a), V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const dark = (c, k = .75) => new THREE.Color(c).multiplyScalar(k).getHex();
  const vary = (c, r, a = .25) => new THREE.Color(c).multiplyScalar(1 - a / 2 + r() * a).getHex();
  const sg = (r, w = 7, h = 5) => new THREE.SphereGeometry(r, w, h);
  // petite pièce peu facettée (fruits, ampoules…) : b.sph impose beaucoup de facettes
  const lo = (b, g, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = 0) => b.add(g, col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), mat, true);
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0) => b.geo(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, 0, ry, 0), mat);
  // cylindre d'un point à un autre (fils, tiges, ferronneries)
  const seg = (b, a, c, ra, rb, col, n = 6, mat = 0) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(rb, ra, L, n, 1, false); g.translate(0, L / 2, 0);
    b.add(g, col, new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); };
  const halfDisc = (b, r, col, x, y, z, mat = 0) => b.add(new THREE.CylinderGeometry(r, r, .06, 16, 1, false, -PI / 2, PI), col, b.M(x, y, z, -PI / 2, 0, 0), mat);
  const halfRing = (b, r, t, col, x, y, z, sy = 1) => b.add(new THREE.TorusGeometry(r, t, 6, 20, PI), col, b.M(x, y, z, 0, 0, 0, 1, sy, 1), 0, true);

  // ---------- devantures (mêmes proportions que les boutiques de la rue v2) ----------
  const door = (b, x, fz, col, w = .7) => { b.box(w + .14, 1.44, .06, 0xf7f5ee, x, .88, fz + .02); b.box(w, 1.33, .08, col, x, .83, fz + .03); b.box(.02, 1.26, .09, dark(col), x, .83, fz + .04); for (const s of [-1, 1]) b.box(w * .36, .5, .085, dark(col), x + s * w * .24, 1.05, fz + .035); b.sph(.035, 0xffd23f, x - .07, .82, fz + .09); b.sph(.035, 0xffd23f, x + .07, .82, fz + .09); b.box(w + .32, .07, .45, ST, x, .05, fz + .25); };
  const vitrine = (b, x, fz, w, frame) => { b.box(w + .12, 1.18, .06, frame, x, 1.02, fz + .02); b.box(w, 1.04, .07, WIN, x, 1.02, fz + .03, 0, 0, 0, 1); b.box(w + .18, .1, .22, frame, x, .4, fz + .09); const n = Math.max(1, Math.round(w / .55)); for (let k = 1; k < n; k++) b.box(.04, 1.04, .08, frame, x - w / 2 + k * w / n, 1.02, fz + .04); };
  const awning = (b, W, fz, y, c1, c2) => { const n = Math.max(4, Math.round(W / .4)); for (let i = 0; i < n; i++) { const c = i % 2 ? c2 : c1, x = -W / 2 + (i + .5) * W / n; b.box(W / n + .006, .07, .72, c, x, y, fz + .33, .42); b.cone(W / n / 2, .14, 3, c, x, y - .2, fz + .63, PI, PI / 6, 0); } };
  const board = (b, w, fz, y, col, edge) => { b.box(w, .38, .08, col, 0, y, fz + .06); b.box(w + .08, .05, .09, edge, 0, y + .19, fz + .06); b.box(w + .08, .05, .09, edge, 0, y - .19, fz + .06); };
  const pot = (b, x, z, col) => { b.cyl(.17, .13, .26, 8, 0xc8673e, x, .13, z); b.jit(.12); b.ico(.2, 1, 0x4f9a46, x, .45, z, 1, 1.1, 1); b.jit(0); b.sph(.05, col, x + .08, .55, z + .12); b.sph(.05, col, x - .1, .5, z + .1); };
  // devanture de bois peint : pilastres, corniche, soubassement sous la vitrine
  const devanture = (b, W, fz, col, edge, vx = -.4, vw = 1.35) => { for (const s of [-1, 1]) { b.box(.18, 1.86, .1, col, s * (W / 2 - .12), 1.02, fz + .05); b.box(.24, .08, .13, edge, s * (W / 2 - .12), 1.98, fz + .06); b.box(.24, .12, .13, edge, s * (W / 2 - .12), .1, fz + .06); }
    b.box(W - .1, .12, .11, col, 0, 1.86, fz + .05); b.box(W - .06, .045, .12, edge, 0, 1.94, fz + .06); b.box(vw + .1, .34, .08, col, vx, .26, fz + .04); };
  // fenêtre à petits bois (s : +1 façade avant, -1 façade arrière)
  const fen = (b, x, y, z, s, fr, w = .5, h = .7, lit = true) => { b.box(w + .12, h + .12, .05, fr, x, y, z + s * .02); b.box(w, h, .06, lit ? WIN : 0x39404a, x, y, z + s * .03, 0, 0, 0, lit ? 1 : 0);
    b.box(.03, h, .07, fr, x, y, z + s * .04); b.box(w, .03, .07, fr, x, y + h * .15, z + s * .04); b.box(w + .2, .07, .13, fr, x, y + h / 2 + .1, z + s * .05); b.box(w + .16, .06, .15, ST, x, y - h / 2 - .06, z + s * .06); };
  const clock = (b, x, y, z, R, s = 1) => { b.cyl(R, R, .05, 24, 0xfbfaf4, x, y, z, PI / 2); b.tor(R + .02, .045, GOLD, x, y, z + s * .03, 0, 0, 0, 0, 24);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.box(.025, R * .18, .012, 0x1d1f22, x + Math.sin(a) * R * .8, y + Math.cos(a) * R * .8, z + s * .03, 0, 0, -a); }
    for (const [a, L, w] of [[-.95, .5, .035], [1.05, .72, .025]]) b.box(w, R * L, .014, 0x1d1f22, x + Math.sin(a) * R * L / 2, y + Math.cos(a) * R * L / 2, z + s * .036, 0, 0, -a);
    b.sph(.03, 0x1d1f22, x, y, z + s * .04); };

  // ---------- marchandises (étals, marché couvert, vitrines) ----------
  function cageot(b, r, kind, x, z, w, d, y) {
    b.box(w, .1, d, 0xc49a62, x, y + .05, z); for (const s of [-1, 1]) b.box(w + .01, .035, .025, 0x9a6a40, x, y + .09, z + s * (d / 2 - .01));
    const it = ITEM[kind], st = it.step, nx = Math.max(1, Math.floor((w - .04) / st)), nz = Math.max(1, Math.floor((d - .04) / st));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) it.f(b, r, x - w / 2 + .02 + (i + .5) * (w - .04) / nx + (r() - .5) * st * .15, y + .1, z - d / 2 + .02 + (j + .5) * (d - .04) / nz + (r() - .5) * st * .15);
  }
  const ITEM = {
    pommes: { step: .1, f: (b, r, x, y, z) => lo(b, sg(.047), vary(0xd8343a, r), x, y + .04, z) },
    oranges: { step: .11, f: (b, r, x, y, z) => lo(b, sg(.052), vary(0xff9420, r, .15), x, y + .045, z) },
    citrons: { step: .1, f: (b, r, x, y, z) => lo(b, sg(.04), vary(0xffe14a, r, .15), x, y + .035, z, 0, r() * 3, 0, 1, .85, 1.3) },
    poires: { step: .1, f: (b, r, x, y, z) => { lo(b, sg(.045), vary(0x9cc63f, r), x, y + .04, z); lo(b, sg(.03), vary(0x9cc63f, r), x, y + .1, z); } },
    tomates: { step: .095, f: (b, r, x, y, z) => lo(b, sg(.044), vary(0xd42a2a, r, .2), x, y + .035, z, 0, 0, 0, 1, .8, 1) },
    choux: { step: .19, f: (b, r, x, y, z) => lo(b, new THREE.IcosahedronGeometry(.085, 1), vary(0x7cbf4a, r), x, y + .06, z, 0, r() * 3, 0, 1, .82, 1) },
    aubergines: { step: .12, f: (b, r, x, y, z) => lo(b, sg(.038), vary(0x4a2a5e, r, .2), x, y + .03, z, 0, r() * 3, 0, 2.2, 1, 1) },
    carottes: { step: .12, f: (b, r, x, y, z) => { const a = r() * .6 - .3; lo(b, new THREE.ConeGeometry(.026, .24, 6), 0xf07f1e, x, y + .03, z, 0, a, PI / 2); lo(b, new THREE.ConeGeometry(.03, .08, 5), 0x4f9a36, x + .15 * Math.cos(a), y + .03, z - .15 * Math.sin(a), 0, a, -PI / 2); } },
    raisin: { step: .14, f: (b, r, x, y, z) => { const c = r() < .5 ? 0x5a2a6e : 0xb8d05a; for (let k = 0; k < 7; k++) lo(b, sg(.022, 5, 4), c, x + (r() - .5) * .07, y + .025 + (k % 3) * .02, z + (r() - .5) * .07); } },
    fraises: { step: .07, f: (b, r, x, y, z) => lo(b, new THREE.ConeGeometry(.025, .045, 6), 0xe0242e, x, y + .022, z, PI, 0, 0) },
    champignons: { step: .08, f: (b, r, x, y, z) => { lo(b, sg(.035, 7, 4), 0xc9a27a, x, y + .045, z, 0, 0, 0, 1, .55, 1); lo(b, new THREE.CylinderGeometry(.014, .016, .04, 5), 0xf0e6d6, x, y + .02, z); } },
  };
  const seau = (b, r, x, z, y, col) => { b.cyl(.12, .095, .22, 10, 0x9aa3ab, x, y + .11, z); b.cyl(.115, .115, .01, 10, 0x2f4a2a, x, y + .215, z);
    for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + r(), rr = q ? .04 + r() * .05 : 0, fx = x + Math.cos(a) * rr * 1.5, fz = z + Math.sin(a) * rr * 1.5, top = y + .5 + r() * .14;
      seg(b, [x + Math.cos(a) * rr * .5, y + .22, z + Math.sin(a) * rr * .5], [fx, top, fz], .007, .007, 0x3f7a2a, 3); lo(b, sg(.042, 7, 5), q % 4 === 0 ? 0xffffff : col, fx, top + .02, fz, 0, 0, 0, 1, .75, 1); } };
  const fromages = (b, r, ox, oz, Y) => { b.box(1.76, .05, .58, 0x8a5a34, ox, Y + .025, oz);
    for (const [x, z, rr, c] of [[-.6, -.06, .17, 0xe0b85a], [.6, .02, .15, 0xd9a84a]]) { b.cyl(rr, rr, .1, 18, c, ox + x, Y + .1, oz + z); b.cyl(rr - .016, rr - .016, .012, 18, 0xf6dd8f, ox + x, Y + .156, oz + z); }
    for (let q = 0; q < 6; q++) b.cyl(.045, .045, .05, 10, 0xf7f3ea, ox - .2 + (q % 3) * .1, Y + .075, oz - .13 + Math.floor(q / 3) * .14);
    b.cone(.075, .1, 4, 0x8f9488, ox + .12, Y + .1, oz + .14, 0, PI / 4, 0);
    for (let q = 0; q < 3; q++) P(b, .18, .1, .16, 0xf2d27a, ox + .2 - q * .03, Y + .05 + q * .1, oz - .14);
    b.cyl(.09, .09, .08, 14, 0xe8e4d8, ox + .32, Y + .09, oz + .18); b.cyl(.085, .085, .012, 14, 0x8a9aa8, ox + .32, Y + .136, oz + .18); };
  const poissons = (b, r, ox, oz, Y) => { b.box(1.76, .07, .6, 0xe9f5fb, ox, Y + .035, oz); for (let q = 0; q < 14; q++) lo(b, sg(.05, 5, 3), 0xf7fbff, ox - .8 + r() * 1.6, Y + .07, oz - .26 + r() * .52, 0, 0, 0, 1, .4, 1);
    for (let q = 0; q < 8; q++) { const x = ox - .72 + q * .2, z = oz + (q % 2 ? .08 : -.1), a = (q % 2 ? 1 : -1) * .45, dx = Math.sin(a), dz = Math.cos(a), col = q % 3 === 2 ? 0xd98a7a : 0xb9c6ce;
      lo(b, sg(.05, 8, 5), col, x, Y + .12, z, 0, a, 0, 1, .45, 2.6); lo(b, new THREE.ConeGeometry(.055, .09, 4), dark(col, .85), x - dx * .17, Y + .12, z - dz * .17, PI / 2, a, 0, 1, 1, .25); lo(b, sg(.012, 5, 3), 0x1d1f22, x + dx * .1 + dz * .03, Y + .14, z + dz * .1 - dx * .03); }
    for (const [x, z] of [[-.75, .22], [.75, -.22], [.05, .24]]) lo(b, sg(.04), 0xffe14a, ox + x, Y + .1, oz + z, 0, 0, 0, 1, .85, 1.3);
    lo(b, sg(.08, 9, 6), 0xe0602a, ox + .55, Y + .12, oz + .2, 0, 0, 0, 1.25, .5, 1); for (let q = 0; q < 6; q++) { const s = q < 3 ? 1 : -1, j = q % 3; seg(b, [ox + .55 + s * .07, Y + .11, oz + .17 + j * .03], [ox + .55 + s * .16, Y + .08, oz + .14 + j * .05], .008, .006, 0xe0602a, 3); } };
  const pains = (b, r, ox, oz, Y) => { b.box(1.76, .05, .58, 0x8a5a34, ox, Y + .025, oz);
    for (let q = 0; q < 7; q++) lo(b, new THREE.CylinderGeometry(.03, .03, .6, 8), vary(0xd9953a, r, .15), ox - .48, Y + .085, oz - .24 + q * .075, 0, (r() - .5) * .2, PI / 2);
    for (let q = 0; q < 5; q++) lo(b, sg(.085, 10, 7), vary(0xb7742e, r, .15), ox + .08 + (q % 3) * .17, Y + .09, oz + (q < 3 ? -.12 : .13), 0, 0, 0, 1, .6, 1);
    for (let q = 0; q < 4; q++) b.add(new THREE.TorusGeometry(.042, .022, 6, 10, PI * 1.3), 0xe0a64a, b.M(ox + .68, Y + .075, oz - .2 + q * .13, -PI / 2, 0, .3), 0, true); };

  // ---------- 1. platane d'alignement, avec sa grille de fonte ----------
  function platane(lod) { const k = G.TREEKIT, b = G.mb(901);
    const bp = (C, x, y, z) => { const a = Math.atan2(z, x), q = k.vnoise(Math.cos(a) * 2.4 + 3.1, Math.sin(a) * 2.4, y * 2.0), q2 = k.vnoise(Math.cos(a) * 6 + 9, Math.sin(a) * 6, y * 5);
      C.set(q > .6 ? 0xe4dfc4 : q > .44 ? 0xb3ad8a : 0x858069); C.multiplyScalar((q2 > .72 ? .82 : 1) * (.72 + .28 * Math.min(1, y / .5))); }; // écorce en plaques claires
    const top = k.trunk(b, { h: 3.1, r0: .16, r1: .1, seed: 4.2, lean: [.05, .03], flare: .4, roots: 4, paintFn: bp });
    if (!lod) for (const e of [[.95, 3.75, .3], [-.9, 3.85, .2], [.25, 3.9, -.9], [-.3, 3.95, .85], [.1, 4.5, .05]]) k.limb(b, [top[0] * .8, 2.7, top[2] * .8], e, .085, .035, bp);
    k.foliage(b, [[0, 4.55, 0, 1.1, 1.25, .78, 1.2], [1.0, 4.1, .3, .72], [-1.0, 4.15, .2, .74], [.3, 4.15, -1.0, .72], [-.35, 4.2, .95, .72], [.75, 4.75, -.6, .6], [-.7, 4.85, -.45, .58], [.1, 5.2, .2, .68, 1, .8, 1]],
      { pal: [0x2f5f27, 0x56953a, 0xa3cc62], c: [0, 4.45, 0], seed: 13, tufts: lod ? 0 : 40, det: lod ? 1 : undefined });
    b.add(new THREE.CircleGeometry(.44, 20).rotateX(-PI / 2), 0x3b2c1e, b.M(0, .006, 0));
    if (!lod) { for (const s of [-1, 1]) { b.box(.98, .022, .05, IRON, 0, .014, s * .465); b.box(.05, .022, .98, IRON, s * .465, .014, 0); }
      b.tor(.22, .014, IRON, 0, .016, 0, PI / 2, 0, 0, 0, 24); b.tor(.36, .014, IRON, 0, .016, 0, PI / 2, 0, 0, 0, 28);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.box(.26, .016, .022, IRON, Math.cos(a) * .32, .016, Math.sin(a) * .32, 0, -a, 0); } }
    return b.done(); }
  MD.rue_platane = () => platane(false); MD.rue_platane_lod = () => platane(true);

  // ---------- 2. colonne Morris ----------
  MD.colonne_morris = v => { const b = G.mb(910);
    b.cyl(.5, .54, .1, 16, GR, 0, .05, 0); b.cyl(.45, .49, .24, 16, GR, 0, .22, 0); b.tor(.46, .03, GR, 0, .35, 0, PI / 2, 0, 0, 0, 24);
    b.cyl(.4, .4, 2.0, 24, 0xe9e2cf, 0, 1.36, 0, 0, 0, 0, 0, true);
    const C = [[0xd8343a, 0xffd23f], [0x2f6fb8, 0xffffff], [0xf29a3a, 0x3a2a1a], [0x6a3f8f, 0xffc6e0], [0x3f9a59, 0xfff4dc], [0x1d1f22, 0xe8c27a], [0xffd9e3, 0xd8343a], [0x5bb3d6, 0xfff0c2]];
    for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU + .05, al = TAU / 8 - .1, [c1, c2] = C[(i + v) % 8], h = 1.5 - (i % 3) * .14, y0 = .5 + (i % 2) * .1;
      b.add(new THREE.CylinderGeometry(.406, .406, h, 5, 1, true, a0, al), c1, b.M(0, y0 + h / 2, 0), 0, true);
      b.add(new THREE.CylinderGeometry(.41, .41, .16, 4, 1, true, a0 + .1, al - .2), c2, b.M(0, y0 + h * .8, 0), 0, true);
      b.add(new THREE.CylinderGeometry(.41, .41, h * .3, 4, 1, true, a0 + .18, al - .36), c2, b.M(0, y0 + h * .38, 0), 0, true); }
    b.tor(.43, .04, GR, 0, 2.37, 0, PI / 2, 0, 0, 0, 28); b.cyl(.48, .44, .16, 24, GR, 0, 2.47, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.box(.06, .1, .05, GR, Math.cos(a) * .47, 2.36, Math.sin(a) * .47, 0, -a, 0); }
    b.sph(.46, GR, 0, 2.55, 0, 1, .55, 1, 0, 24, 12);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, pts = [0, .33, .66, 1].map(t => { const ph = PI / 2 * (1 - t); return [Math.cos(a) * .475 * Math.sin(ph), 2.55 + .265 * Math.cos(ph), Math.sin(a) * .475 * Math.sin(ph)]; });
      for (let j = 0; j < 3; j++) seg(b, pts[j], pts[j + 1], .016, .016, 0x24402f, 4); }
    b.cyl(.07, .1, .18, 10, GR, 0, 2.88, 0); b.sph(.07, GOLD, 0, 3.02, 0); b.cone(.035, .14, 8, GOLD, 0, 3.14, 0);
    return b.done(); };

  // ---------- 3. fontaine Wallace ----------
  MD.fontaine_wallace = v => { const b = G.mb(911);
    b.cyl(.44, .48, .12, 8, GR, 0, .06, 0, 0, PI / 8); b.cyl(.34, .4, .44, 8, GR, 0, .34, 0, 0, PI / 8); b.cyl(.41, .35, .1, 8, GR, 0, .61, 0, 0, PI / 8);
    b.cyl(.16, .16, .04, 14, 0x5d7f9a, 0, .67, 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4, x = Math.cos(a) * .22, z = Math.sin(a) * .22, fx = Math.cos(a), fz = Math.sin(a);
      b.cyl(.065, .12, .62, 10, GR, x, .97, z); b.cyl(.055, .065, .2, 8, GR, x, 1.38, z); b.sph(.058, GR, x, 1.55, z, 1, 1.1, 1, 0, 10, 8);
      seg(b, [x - fz * .05, 1.45, z + fx * .05], [x * .45 - fz * .1, 1.68, z * .45 + fx * .1], .02, .016, GR, 5); seg(b, [x + fz * .05, 1.45, z - fx * .05], [x * .45 + fz * .1, 1.68, z * .45 - fx * .1], .02, .016, GR, 5); }
    b.cyl(.32, .32, .06, 16, GR, 0, 1.71, 0); b.sph(.3, GR, 0, 1.74, 0, 1, .75, 1, 0, 16, 10);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 10; i++) { const a = (i + k * .5) / 10 * TAU, rr = .27 - k * .075; lo(b, sg(.045, 6, 4), 0x264536, Math.cos(a) * rr, 1.79 + k * .065, Math.sin(a) * rr, 0, 0, 0, 1, .45, 1); }
    b.cyl(.03, .05, .14, 8, GR, 0, 2.0, 0); b.sph(.045, GR, 0, 2.1, 0);
    b.cyl(.012, .012, .95, 6, 0xcfefff, 0, 1.17, 0, 0, 0, 0, 2);
    return b.done(); };

  // ---------- 4. étals du marché (2 × 1, le client devant +z) ----------
  const ETAL = [['fruits', 'Étal de fruits', 0xd8343a, 0xfff4e8], ['legumes', 'Étal de légumes', 0x3f9a59, 0xfff4dc], ['fleurs', 'Étal de fleurs', 0xff8fc0, 0xffffff], ['fromages', 'Étal de fromages', 0xf2c84b, 0xfffbe8], ['poissons', 'Étal de poissons', 0x2f6fb8, 0xffffff], ['pains', 'Étal du boulanger', 0xb5533f, 0xf3e2c4]];
  MD.etal_marche = v => { const k = v % 6, b = G.mb(920 + k), r = G.rng(920 + k), c1 = ETAL[k][2], c2 = ETAL[k][3], WD = 0xa47148, Y = .86;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.05, Y, .05, dark(WD), sx * .84, Y / 2, sz * .26);
    for (const sx of [-1, 1]) b.box(.04, .04, .52, dark(WD), sx * .84, .3, 0);
    b.box(1.86, .04, .7, WD, 0, Y - .02, 0);
    for (let i = 0; i < 9; i++) b.box(.207, .3, .022, i % 2 ? c2 : c1, -.828 + i * .207, Y - .2, .36);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const h = sz > 0 ? 1.95 : 2.15; b.cyl(.022, .022, h, 6, 0x5a3a22, sx * .9, h / 2, sz * .42); }
    for (let i = 0; i < 9; i++) { const x = -.96 + (i + .5) * 1.92 / 9, c = i % 2 ? c2 : c1; b.box(1.92 / 9 + .004, .03, 1.04, c, x, 2.06, 0, .19); b.cone(1.92 / 18, .12, 3, c, x, 1.9, .52, PI, PI / 6, 0); }
    if (k === 0) ['pommes', 'oranges', 'citrons', 'poires'].forEach((t, i) => cageot(b, r, t, -.66 + i * .44, -.02, .4, .56, Y));
    else if (k === 1) ['tomates', 'carottes', 'choux', 'aubergines'].forEach((t, i) => cageot(b, r, t, -.66 + i * .44, -.02, .4, .56, Y));
    else if (k === 2) [0xe8343a, 0xffd23f, 0xff8fc0, 0xa46be0].forEach((c, i) => seau(b, r, -.66 + i * .44, -.02, Y, c));
    else if (k === 3) fromages(b, r, 0, -.02, Y); else if (k === 4) poissons(b, r, 0, -.02, Y); else pains(b, r, 0, -.02, Y);
    for (const x of [-.44, .44]) { b.box(.17, .12, .016, 0x1d1f22, x, Y + .07, .33, -.35); b.box(.11, .012, .02, 0xf4f2ec, x, Y + .08, .335, -.35); }
    return b.done(); };

  // ---------- 5. marché couvert de fonte et de verre (9 × 3, façade +z) ----------
  MD.halle_rue = v => { const b = G.mb(930), r = G.rng(930), GL = 0xd6ebf2, BR = 0xa9553f, HE = 2.7, HR = 3.4, HL = 3.95, ZF = 1.36, ZB = -1.36, XS = [-4.38, -1.46, 1.46, 4.38];
    b.P(PT.pierre).box(8.94, .05, 2.94, 0xd9d0bd, 0, .025, 0).P(0);
    // mur du fond : soubassement de brique et grande verrière à petits bois
    b.P(PT.brique).box(8.9, .95, .24, BR, 0, .475, ZB - .03).P(0); b.box(8.96, .08, .32, ST, 0, .99, ZB - .03);
    b.box(8.8, HE - 1.03, .04, GL, 0, (1.03 + HE) / 2, ZB - .03, 0, 0, 0, 2);
    for (let i = 0; i <= 12; i++) bx(b, .04, HE - 1.03, .07, GR, -4.4 + i * 8.8 / 12, (1.03 + HE) / 2, ZB - .03);
    for (const y of [1.6, 2.2]) bx(b, 8.8, .035, .07, GR, 0, y, ZB - .03);
    // colonnes, poutres, arcs de fonte ajourés
    const col = (x, z) => { b.cyl(.11, .13, .16, 8, GR, x, .13, z); b.cyl(.065, .075, HE - .45, 10, GR, x, .21 + (HE - .45) / 2, z, 0, 0, 0, 0, true); b.tor(.08, .022, GOLD, x, .55, z, PI / 2, 0, 0, 0, 12); b.cyl(.15, .075, .22, 8, GR, x, HE - .14, z); };
    for (const x of XS) { col(x, ZF); col(x, ZB + .14); }
    for (const z of [ZF, ZB]) { b.box(8.96, .18, .1, GR, 0, HE + .06, z); b.box(8.96, .025, .11, GOLD, 0, HE - .02, z); }
    for (const xc of [-2.92, 0, 2.92]) { halfRing(b, 1.39, .035, GR, xc, HE - .36, ZF, .26);
      for (let k = 1; k < 6; k++) { const a = k / 6 * PI, x = xc + Math.cos(a) * 1.39, y = HE - .36 + Math.sin(a) * 1.39 * .26; seg(b, [x, y, ZF], [x, HE - .02, ZF], .012, .012, GR, 4); } }
    // verrière à deux pans, lanterneau vitré, toit de zinc et crête de fonte
    for (const s of [-1, 1]) { const z0 = s * 1.42, z1 = s * .55, y0 = HE + .15, L = Math.hypot(z0 - z1, HR - y0), a = Math.atan2(HR - y0, Math.abs(z0 - z1)), zc = (z0 + z1) / 2, yc = (y0 + HR) / 2;
      b.box(8.94, .025, L, GL, 0, yc, zc, s * a, 0, 0, 2); for (let i = 0; i <= 13; i++) b.box(.035, .05, L, GR, -4.45 + i * 8.9 / 13, yc + .03, zc, s * a);
      b.box(8.94, HL - HR, .03, GL, 0, (HR + HL) / 2, s * .55, 0, 0, 0, 2); for (let i = 0; i <= 26; i++) bx(b, .03, HL - HR, .05, GR, -4.45 + i * 8.9 / 26, (HR + HL) / 2, s * .56);
      for (const y of [HR, HL]) b.box(8.98, .06, .08, GR, 0, y, s * .56);
      const L2 = Math.hypot(.66, .3); b.box(9.04, .04, L2, ZINC, 0, HL + .17, s * .33, s * Math.atan2(.3, .66));
      P(b, 2.84, HR - HE - .15, .03, GL, s * 4.47, HE + .15, 0, PI / 2, 2); }
    b.box(9.0, .05, .06, GR, 0, HL + .32, 0); for (let i = 0; i < 30; i++) b.cone(.03, .14, 5, GR, -4.35 + i * .3, HL + .4, 0);
    // trois comptoirs au fond : primeur, fromager, poissonnier
    const stall = (xc, sign, fill) => { b.box(2.3, .82, .55, 0x8a5a34, xc, .41, -.72); b.box(2.36, .05, .6, 0xf2eee6, xc, .845, -.72);
      for (let i = 0; i < 6; i++) b.box(.04, .7, .02, 0x6b4426, xc - 1.05 + i * .42, .41, -.44);
      for (const s of [-1, 1]) seg(b, [xc + s * .7, HE - .02, -.7], [xc + s * .7, 2.36, -.7], .006, .006, IRON, 3);
      b.box(1.6, .26, .04, sign, xc, 2.22, -.7); b.box(1.66, .03, .045, GOLD, xc, 2.355, -.7); b.box(1.66, .03, .045, GOLD, xc, 2.085, -.7);
      seg(b, [xc, HL, -.1], [xc, 2.56, -.1], .006, .006, IRON, 3); b.cone(.18, .14, 12, GR, xc, 2.5, -.1); b.sph(.07, 0xfff1c8, xc, 2.43, -.1, 1, 1, 1, 1);
      for (const y of [1.4, 1.85]) b.box(2.2, .05, .3, 0x8a5a34, xc, y, -1.12); for (const s of [-1, 1]) b.box(.05, 1.0, .3, 0x6b4426, xc + s * 1.1, 1.4, -1.12);
      fill(xc); };
    stall(-2.92, 0xd8343a, xc => { ['pommes', 'oranges', 'tomates', 'choux'].forEach((t, i) => cageot(b, r, t, xc - .84 + i * .56, -.72, .5, .44, .87));
      ['raisin', 'fraises', 'champignons'].forEach((t, i) => cageot(b, r, t, xc - .7 + i * .7, -1.12, .6, .26, 1.425));
      for (const x of [-1.3, 1.3]) for (let q = 0; q < 3; q++) lo(b, sg(.14, 10, 7), 0xf08a2a, xc + x + (q - 1) * .1, .14 + (q === 1 ? .2 : 0), -.2 - (q % 2) * .12, 0, 0, 0, 1, .75, 1); });
    stall(0, 0xf2c84b, xc => { fromages(b, r, xc, -.72, .87);
      for (let q = 0; q < 8; q++) { const x = xc - .9 + q * .25; seg(b, [x, 2.0, -1.24], [x, 1.9, -1.24], .005, .005, 0xf4f2ec, 3); lo(b, new THREE.CylinderGeometry(.032, .028, .3, 7), 0x7a3a2a, x, 1.74, -1.24); }
      for (let q = 0; q < 6; q++) b.cyl(.06, .06, .14, 10, [0xc8673e, 0xf4f2ec, 0x5a3a22][q % 3], xc - .8 + q * .32, 1.5, -1.12); });
    stall(2.92, 0x2f6fb8, xc => { poissons(b, r, xc, -.72, .87); for (let q = 0; q < 5; q++) seau(b, r, xc - .8 + q * .4, -1.12, 1.425, [0xe8343a, 0xffd23f, 0xff8fc0, 0xa46be0, 0xffffff][q]); });
    return b.done(); };

  // ---------- 6. passage couvert de la gare (4 × 3) : on passe sous l'immeuble ----------
  MD.passage_gare = v => { const b = G.mb(940), WL = 0xe7dfcf, TR = CREAM, D = 2.3, zc = -.15, ZF = 1.0, ZB = -1.3, HG = 2.75, top = 4.62, XO = .96;
    for (const s of [-1, 1]) { b.P(PT.pierre).box(1.0, HG, D, WL, s * 1.46, HG / 2, zc).P(0); b.box(1.06, .1, D + .06, TR, s * 1.46, .05, zc); }
    b.box(3.94, top - HG, D, WL, 0, (HG + top) / 2, zc); b.box(4.08, .14, D + .14, TR, 0, HG + .07, zc);
    const spandrel = (side, z) => { const s = new THREE.Shape(); s.moveTo(side * XO, 1.8); s.lineTo(side * XO, HG); s.lineTo(0, HG); s.absarc(0, 1.8, .95, PI / 2, side > 0 ? 0 : PI, side > 0); s.lineTo(side * XO, 1.8);
      b.add(new THREE.ExtrudeGeometry(s, { depth: .08, bevelEnabled: false }), WL, b.M(0, 0, z - .04), 0, false); };
    for (const [z, s] of [[ZF, 1], [ZB, -1]]) { spandrel(1, z); spandrel(-1, z); halfRing(b, .96, .055, TR, 0, 1.8, z + s * .05); b.box(.2, .32, .12, TR, 0, 2.62, z + s * .04); for (const k of [-1, 1]) b.box(.16, .1, .12, TR, k * .96, 1.8, z + s * .03);
      b.box(2.2, .3, .06, 0x2f4f3a, 0, 3.08, z + s * .03); b.box(2.26, .035, .07, GOLD, 0, 3.24, z + s * .035); b.box(2.26, .035, .07, GOLD, 0, 2.92, z + s * .035); }
    // sous la voûte : plafond à caissons, lanterne, petites vitrines de passage
    b.box(1.9, .05, D - .02, 0xefe8da, 0, HG - .025, zc); for (let i = 0; i < 4; i++) b.box(1.9, .04, .05, TR, 0, HG - .06, zc - D / 2 + .3 + i * .58);
    seg(b, [0, HG - .05, zc], [0, 2.42, zc], .008, .008, IRON, 3); b.cyl(.09, .12, .05, 8, IRON, 0, 2.4, zc); b.box(.16, .22, .16, 0xfff1c8, 0, 2.27, zc, 0, 0, 0, 1); b.cone(.13, .1, 4, IRON, 0, 2.43, zc, 0, PI / 4, 0); b.cyl(.05, .07, .04, 8, IRON, 0, 2.15, zc);
    for (const s of [-1, 1]) { b.box(.016, 1.42, 1.62, 0x5a3a22, s * .952, 1.25, zc); b.box(.016, 1.3, 1.5, WIN, s * .935, 1.25, zc, 0, 0, 0, 1); b.box(.03, .2, 1.62, 0x2f4f3a, s * .94, 2.05, zc); }
    b.P(PT.carrelage).box(1.9, .02, D + .4, 0xe8dcc6, 0, .01, zc + .1).P(0);
    // étage : fenêtres, horloge de gare au-dessus de l'arche côté rue
    for (const [z, s] of [[ZF, 1], [ZB, -1]]) for (const x of [-1.32, 1.32]) fen(b, x, 3.85, z, s, TR, .48, .7);
    clock(b, 0, 3.85, ZF + .03, .36); fen(b, 0, 3.85, ZB, -1, TR, .48, .7);
    // corniche, toit mansardé, lucarnes, cheminées
    b.box(4.14, .16, D + .16, TR, 0, top + .08, zc); for (let k = 0; k < 13; k++) b.box(.08, .1, .1, TR, -1.76 + k * .3, top - .02, ZF + .08);
    b.box(3.9, .95, D - .5, SLATE, 0, top + .64, zc); b.box(3.96, 1.0, .08, SLATE, 0, top + .58, ZF - .25, -.35); b.box(3.96, 1.0, .08, SLATE, 0, top + .58, ZB + .25, .35);
    for (const [z, s] of [[ZF, 1], [ZB, -1]]) for (const x of [-1, 1]) { b.box(.5, .56, .45, WL, x, top + .6, z - s * .3); P(b, .66, .32, .55, SLATE, x, top + .88, z - s * .3); b.box(.3, .34, .03, WIN, x, top + .58, z - s * .07, 0, 0, 0, 1); }
    for (const x of [-1.6, 1.6]) { b.box(.3, .7, .3, 0xb0704f, x, top + 1.3, zc); b.box(.36, .08, .36, 0x8e4532, x, top + 1.66, zc); }
    return b.done(); };

  // ---------- 7. grille de la gare, au bout de la ruelle (4 × 1) ----------
  MD.grille_gare = v => { const b = G.mb(945), PS = 0xe1d8c6;
    for (const s of [-1, 1]) { const x = s * 1.6, hx = s * 1.3;
      b.P(PT.pierre).box(.5, 2.1, .5, PS, x, 1.05, 0).P(0); b.box(.6, .1, .6, ST, x, 2.15, 0); b.box(.56, .1, .56, PS, x, .05, 0);
      b.cyl(.06, .09, .1, 8, IRON, x, 2.25, 0); b.box(.2, .3, .2, 0xfff1c8, x, 2.45, 0, 0, 0, 0, 1); b.cone(.17, .14, 4, IRON, x, 2.67, 0, 0, PI / 4, 0); b.sph(.03, GOLD, x, 2.76, 0);
      for (let i = 0; i <= 9; i++) { const z = .05 + i * .13; bx(b, .022, 1.75, .022, IRON, hx, .98, z); b.cone(.025, .08, 4, GOLD, hx, 1.9, z); } // vantail grand ouvert
      for (const y of [.18, 1.0, 1.78]) bx(b, .03, .04, 1.25, IRON, hx, y, .65); b.add(new THREE.TorusGeometry(.2, .015, 4, 14), IRON, b.M(hx, 1.4, .65, 0, PI / 2, 0), 0, true); }
    halfRing(b, 1.6, .03, IRON, 0, 2.2, 0, .38); halfRing(b, 1.5, .02, IRON, 0, 2.2, 0, .32);
    b.box(1.3, .32, .05, 0x2f4f3a, 0, 2.62, 0); b.box(1.36, .04, .06, GOLD, 0, 2.8, 0); b.box(1.36, .04, .06, GOLD, 0, 2.44, 0);
    return b.done(); };

  // ---------- 8. échoppes et maisons de ville de la rangée sud (3 × 3, façade +z, tournées vers la rue) ----------
  const ECH = [
    { wall: 0xf3e2c4, front: 0x7a3b2a, trim: 0xf7f5ee, roof: 'mansarde', roofCol: SLATE, shutters: 0x2f6b45, flowers: 1, sign: [0x7a3b2a, GOLD], goods: 'pain', hang: 'pain' },
    { wall: 0xeef3e6, front: 0x3f7a4a, trim: 0xffffff, roof: 'pignon', roofCol: 0xb5533f, shutters: 0x3f7a4a, flowers: 1, aw: [0x3f7a4a, 0xffffff], sign: [0x3f7a4a, 0xffffff], goods: 'fleurs', hang: 'fleur' },
    { wall: 0xe3e8ef, front: 0x2d3f66, trim: 0xffffff, roof: 'mansarde', roofCol: SLATE, shutters: 0x2d3f66, flowers: 1, aw: [0x2d3f66, 0xe8c27a], sign: [0x2d3f66, GOLD], goods: 'livres', hang: 'livre' },
    { wall: 0xf7f5ee, front: 0xf7f5ee, trim: 0x3f9a59, roof: 'plat', balustre: 1, sign: [0xffffff, 0x3f9a59], goods: 'pharma', hang: 'croix' },
    { wall: 0xfff1c4, front: 0x6b4426, trim: 0xffffff, roof: 'pignon', roofCol: 0xc0503c, shutters: 0x6b4426, flowers: 1, aw: [0xf2c84b, 0xffffff], sign: [0x6b4426, 0xf2c84b], goods: 'fromage', hang: 'fromage' },
    { wall: 0xf3eadb, front: 0xffcd00, trim: 0x2f4f8a, roof: 'mansarde', roofCol: SLATE, shutters: 0x2f4f8a, sign: [0xffcd00, 0x2f4f8a], goods: 'poste', hang: 'poste' },
    { wall: 0xffe6ef, front: 0xa7d9c9, trim: 0xffffff, roof: 'mansarde', roofCol: 0x8d6fd1, shutters: 0xff8fc0, flowers: 1, aw: [0xff8fc0, 0xffffff], sign: [0xffffff, 0xff8fc0], goods: 'patisserie', hang: 'gateau' },
    { wall: 0xf0dcc0, front: 0x8e1f2a, trim: 0xd9b84a, roof: 'pignon', roofCol: 0xb5533f, shutters: 0x8e1f2a, flowers: 1, balcony: 1, aw: [0x8e1f2a, 0xf0dcc0], sign: [0x1d1f22, GOLD], goods: 'brasserie', hang: 'chope' },
    { wall: 0xe8e2d6, front: 0x8e1f2a, trim: 0xffffff, roof: 'pignon', roofCol: 0x6a6f7a, shutters: 0x5b8fd6, sign: [0x8e1f2a, 0xffffff], goods: 'tabac', hang: 'carotte' },
    { home: 1, wall: 0xdfe6ee, base: 0xc9d1dc, trim: 0xffffff, roof: 'mansarde', roofCol: SLATE, balcony: 1, flowers: 1, door: 0x3d4f7a },
    { home: 1, wall: 0xffe9a8, base: 0xf3d58a, trim: 0xffffff, roof: 'pignon', roofCol: 0xc0503c, shutters: 0x4f9a46, flowers: 1, door: 0x4f9a46, chimney: 1 },
    { home: 1, wall: 0xd7ecdf, base: 0xbfdccb, trim: 0xffffff, roof: 'pignon', roofCol: 0x6a6f7a, shutters: 0x5b8fd6, flowers: 1, door: 0x5b8fd6, oeil: 1 },
    { home: 1, wall: 0xb5553d, base: 0x8e3f2c, trim: 0xf3eee3, roof: 'plat', flowers: 1, door: 0x2a2d33, balustre: 1, baseJit: .12 },
  ];
  // vitrines garnies (posées sur l'appui de la vitrine, x de -1 à .2)
  const GOODS = {
    pain: (b, fz) => { const r = G.rng(1); for (let q = 0; q < 3; q++) lo(b, sg(.09, 10, 7), vary(0xb7742e, r, .15), -.85 + q * .22, .5, fz + .11, 0, 0, 0, 1, .6, 1); for (let q = 0; q < 3; q++) lo(b, new THREE.CylinderGeometry(.03, .03, .55, 8), 0xd9953a, -.05 + q * .06, .7, fz + .12, 0, 0, .35); },
    fleurs: (b, fz) => { const r = G.rng(2); for (let i = 0; i < 3; i++) { b.box(1.3, .16, .2, 0x8a5a34, -.35, .08 + i * .22, fz + .62 - i * .17); for (let q = 0; q < 4; q++) seau(b, r, -.85 + q * .33, fz + .62 - i * .17, .08 + i * .22, [0xe8343a, 0xffd23f, 0xff8fc0, 0xa46be0, 0xffffff][(q + i * 2) % 5]); } },
    livres: (b, fz) => { const r = G.rng(3); for (let q = 0; q < 14; q++) b.box(.05, .16 + r() * .08, .12, [0xd8343a, 0x2f6fb8, 0x3f9a59, 0xf2c84b, 0x8d6fd1, 0x1d1f22][q % 6], -1.0 + q * .075, .53, fz + .12); b.box(.9, .45, .45, 0x6b4426, -.4, .23, fz + .5); for (let q = 0; q < 8; q++) b.box(.08, .2, .38, [0xd8343a, 0x2f6fb8, 0xf2c84b, 0x3f9a59][q % 4], -.72 + q * .09, .52, fz + .5, 0, 0, .15); },
    pharma: (b, fz) => { for (let q = 0; q < 6; q++) b.box(.1, .12 + (q % 3) * .04, .08, [0xffffff, 0x3f9a59, 0x8fd1f0][q % 3], -.95 + q * .17, .52, fz + .12); },
    fromage: (b, fz) => { for (let q = 0; q < 3; q++) { b.cyl(.13, .13, .08, 14, 0xe0b85a, -.85 + q * .3, .5, fz + .12); b.cyl(.115, .115, .01, 14, 0xf6dd8f, -.85 + q * .3, .545, fz + .12); } b.box(.5, .7, .04, 0x1d1f22, .25, .38, fz + .35, -.2); b.box(.4, .03, .05, 0xf4f2ec, .25, .5, fz + .37, -.2); },
    poste: (b, fz) => { b.box(.36, .5, .28, 0xffcd00, -1.27, .65, fz + .3); b.box(.38, .06, .3, 0x2f4f8a, -1.27, .92, fz + .3); b.box(.2, .03, .02, 0x1d1f22, -1.27, .78, fz + .445); b.box(.06, .4, .06, 0x2a2d33, -1.27, .2, fz + .3); for (let q = 0; q < 4; q++) b.box(.2, .14, .02, [0xf4f2ec, 0xffcd00, 0xd8343a, 0x5bb3d6][q], -.9 + q * .25, .55, fz + .11); },
    patisserie: (b, fz) => { const MC = [0xff8fc0, 0xa7d9c9, 0xffd23f, 0xb583e6, 0xffffff, 0xf29a3a]; b.cyl(.2, .2, .02, 16, 0xf4f2ec, -.7, .5, fz + .12); b.cyl(.13, .13, .02, 14, 0xf4f2ec, -.7, .62, fz + .12); b.cyl(.015, .015, .25, 5, 0xd9b84a, -.7, .58, fz + .12);
      for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; lo(b, sg(.035, 7, 4), MC[q % 6], -.7 + Math.cos(a) * .15, .53, fz + .12 + Math.sin(a) * .15, 0, 0, 0, 1, .7, 1); }
      b.cyl(.14, .14, .1, 16, 0xff8fc0, -.15, .5, fz + .12); b.cyl(.1, .1, .08, 14, 0xffffff, -.15, .59, fz + .12); lo(b, sg(.03, 7, 5), 0xd8243a, -.15, .66, fz + .12); },
    brasserie: (b, fz) => { b.box(.5, .7, .04, 0x1d1f22, 1.32, .4, fz + .35, -.2); for (let q = 0; q < 4; q++) b.box(.36, .025, .05, 0xf4f2ec, 1.32, .58 - q * .09, fz + .37, -.2); for (const x of [-1.32, 1.32]) { b.box(.05, .26, .08, GOLD, x, 1.82, fz + .16); b.sph(.07, 0xfff1c8, x, 1.98, fz + .2, 1, 1, 1, 1); } },
    tabac: (b, fz) => { b.box(.7, .55, .3, 0x5a5f68, -.45, .28, fz + .25); for (let q = 0; q < 6; q++) b.box(.2, .26, .02, [0xf4f2ec, 0xd8343a, 0x2f6fb8, 0xffd23f][q % 4], -.68 + (q % 3) * .23, .5 + Math.floor(q / 3) * .05, fz + .3 + Math.floor(q / 3) * .08, -.5); },
  };
  // enseignes en drapeau (perpendiculaires à la façade)
  const bracket = (b, x, y, fz) => { b.box(.03, .03, .55, IRON, x, y + .22, fz + .3); seg(b, [x, y - .05, fz + .02], [x, y + .21, fz + .45], .012, .012, IRON, 4); b.box(.05, .32, .05, IRON, x, y + .08, fz + .03); };
  const HANG = {
    pain: (b, x, y, fz) => { bracket(b, x, y, fz); b.cyl(.2, .2, .04, 16, GOLD, x, y, fz + .42, 0, 0, PI / 2); for (const s of [-1, 1]) lo(b, new THREE.CylinderGeometry(.03, .03, .3, 8), 0xb7742e, x + s * .03, y, fz + .42, .6, 0, 0); },
    fleur: (b, x, y, fz) => { bracket(b, x, y, fz); b.cyl(.2, .2, .04, 16, 0x3f7a4a, x, y, fz + .42, 0, 0, PI / 2); for (const s of [-1, 1]) { for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; lo(b, sg(.05, 7, 5), 0xff8fc0, x + s * .03, y + Math.cos(a) * .08, fz + .42 + Math.sin(a) * .08, 0, 0, 0, .4, 1, 1); } lo(b, sg(.04, 7, 5), 0xffd23f, x + s * .035, y, fz + .42, 0, 0, 0, .4, 1, 1); } },
    livre: (b, x, y, fz) => { bracket(b, x, y, fz); for (const s of [-1, 1]) { b.box(.03, .3, .22, 0x2d3f66, x, y, fz + .42 + s * .1, s * .35); b.box(.035, .26, .19, 0xf4f2ec, x, y + .005, fz + .42 + s * .095, s * .35); } },
    croix: (b, x, y, fz) => { bracket(b, x, y, fz); b.box(.08, .4, .14, 0x2fd36a, x, y, fz + .42, 0, 0, 0, 1); b.box(.08, .14, .4, 0x2fd36a, x, y, fz + .42, 0, 0, 0, 1); b.box(.06, .46, .46, 0xf4f2ec, x, y, fz + .42); },
    fromage: (b, x, y, fz) => { bracket(b, x, y, fz); P(b, .08, .26, .4, 0xf2c84b, x, y - .13, fz + .42); b.box(.09, .05, .4, 0xd9a84a, x, y - .13, fz + .42); },
    poste: (b, x, y, fz) => { bracket(b, x, y, fz); b.box(.05, .3, .42, 0xffcd00, x, y, fz + .42); for (const s of [-1, 1]) { lo(b, sg(.07, 8, 5), 0x2f4f8a, x + s * .03, y, fz + .4, 0, 0, 0, .4, .6, 1.3); lo(b, new THREE.ConeGeometry(.05, .12, 4), 0x2f4f8a, x + s * .03, y + .03, fz + .52, PI / 2, 0, 0, .4, 1, 1); } },
    gateau: (b, x, y, fz) => { bracket(b, x, y, fz); b.cyl(.1, .08, .14, 12, 0xff8fc0, x, y - .06, fz + .42); lo(b, sg(.11, 10, 7), 0xffffff, x, y + .04, fz + .42, 0, 0, 0, 1, .7, 1); lo(b, sg(.035, 7, 5), 0xd8243a, x, y + .13, fz + .42); },
    chope: (b, x, y, fz) => { bracket(b, x, y, fz); b.cyl(.09, .09, .22, 12, GOLD, x, y - .02, fz + .4); lo(b, sg(.095, 10, 6), 0xfff8ea, x, y + .1, fz + .4, 0, 0, 0, 1, .5, 1); b.add(new THREE.TorusGeometry(.06, .018, 6, 12, PI), GOLD, b.M(x, y - .02, fz + .5, 0, PI / 2, -PI / 2), 0, true); },
    carotte: (b, x, y, fz) => { bracket(b, x, y, fz); b.add(new THREE.OctahedronGeometry(1, 0), 0xc8202e, b.M(x, y - .05, fz + .42, 0, 0, 0, .07, .34, .2), 0); b.box(.16, .07, .3, 0xf4f2ec, x, y - .05, fz + .42); },
  };
  MD.rue_echoppe = v => { const s = ECH[v % ECH.length], b = G.mb(980 + v);
    const o = G.facade(b, Object.assign({ w: 3, floors: 2 }, s, { base: s.home ? s.base : null }));
    if (s.home) { door(b, 0, o.fz, s.door, .62); for (const x of [-.95, .95]) { b.box(.44, .56, .06, WIN, x, 1.1, o.fz + .03, 0, 0, 0, 1); b.box(.54, .66, .05, s.trim, x, 1.1, o.fz + .02); b.box(.6, .07, .14, s.trim, x, .78, o.fz + .06); }
      pot(b, -.55, o.fz + .45, 0xff8fc0); pot(b, .55, o.fz + .45, 0xffd23f); return b.done(); }
    devanture(b, o.W, o.fz, s.front, s.sign[1]); vitrine(b, -.4, o.fz, 1.35, s.front === 0xf7f5ee ? 0x3f9a59 : s.front); door(b, .92, o.fz, dark(s.front === 0xf7f5ee ? 0x3f9a59 : s.front, .8), .56);
    if (s.aw) awning(b, o.W, o.fz, 1.78, s.aw[0], s.aw[1]);
    board(b, o.W * .7, o.fz, 2.42, s.sign[0], s.sign[1]); GOODS[s.goods](b, o.fz); HANG[s.hang](b, o.W / 2 - .22, 2.95, o.fz);
    return b.done(); };

  // ---------- 9. immeubles d'angle (4 × 3) ----------
  const ANG = [{ wall: 0xeadfca, roofCol: ZINC, rdc: 'hotel' }, { wall: 0xf2e6cc, roofCol: SLATE, rdc: 'tabac' }, { wall: 0xe4dccf, roofCol: ZINC, rdc: 'banque' }, { wall: 0xf0e4c2, roofCol: SLATE, rdc: 'cafe' }];
  MD.rue_angle = v => { const s = ANG[v % 4], b = G.mb(990 + v), o = G.facade(b, { w: 4, floors: 3, wall: s.wall, trim: CREAM, roof: 'mansarde', roofCol: s.roofCol, balcony: 2, flowers: 1, chimney: 1, nWin: 3 }), fz = o.fz;
    if (s.rdc === 'hotel') { door(b, 0, fz, 0x3d4f7a, .8); for (const x of [-1.35, 1.35]) fen(b, x, 1.05, fz, 1, CREAM, .6, .9); board(b, 2.6, fz, 2.42, 0x1d3a5f, GOLD);
      b.box(1.4, .05, .7, 0xd6ebf2, 0, 1.75, fz + .38, -.1, 0, 0, 2); for (const x of [-.68, .68]) seg(b, [x, 2.15, fz + .02], [x, 1.77, fz + .7], .015, .015, IRON, 4);
      for (const x of [-.95, .95]) { seg(b, [x, 2.2, fz + .05], [x, 2.75, fz + .6], .012, .012, GOLD, 4); [0x2f4f9a, 0xffffff, 0xd8343a].forEach((c, i) => b.box(.02, .3, .1, c, x, 2.55 - .02 * i, fz + .43 + i * .1, .7)); } }
    else if (s.rdc === 'tabac') { devanture(b, o.W, fz, 0x8e1f2a, 0xffffff, -.6, 1.9); vitrine(b, -.6, fz, 1.9, 0x8e1f2a); door(b, 1.25, fz, 0x5a141c, .6); board(b, 2.6, fz, 2.42, 0x8e1f2a, 0xffffff); HANG.carotte(b, o.W / 2 - .22, 2.95, fz); GOODS.tabac(b, fz); }
    else if (s.rdc === 'banque') { b.P(PT.pierre).box(o.W - .04, 1.9, .1, 0xe0d6c2, 0, 1.0, fz + .02).P(0); door(b, 0, fz + .06, 0x2a2d33, .8); P(b, 1.3, .3, .2, 0xe0d6c2, 0, 1.68, fz + .14); for (const x of [-1.35, 1.35]) fen(b, x, 1.05, fz + .06, 1, 0xf2ece0, .55, 1.0); board(b, 2.6, fz, 2.42, 0x2a2d33, GOLD); }
    else { devanture(b, o.W, fz, 0x2f5a3a, GOLD, -.6, 1.9); vitrine(b, -.6, fz, 1.9, 0x2f5a3a); door(b, 1.25, fz, 0x22402a, .6); awning(b, o.W, fz, 1.78, 0xd8343a, 0xf7f0e0); board(b, 2.6, fz, 2.42, 0x2f5a3a, GOLD); GOODS.brasserie(b, fz); }
    return b.done(); };

  // ---------- 10. immeubles du fond (toits de la ville, derrière les boutiques) ----------
  const FOND = [[0xeadfca, ZINC], [0xe4ddd2, SLATE], [0xf0e4c2, ZINC], [0xd9c7b0, SLATE], [0xb5553d, 0x6a6f7a], [0xf2dfe3, ZINC]];
  MD.rue_fond = v => { const b = G.mb(950 + v), r = G.rng(950 + v), [WL, RF] = FOND[v % 6], fl = 4 + (v % 3 === 1 ? 1 : 0), FH = 1.55, W = 3.96, D = 2.6, z0 = -.1, fz = z0 + D / 2, H = .2 + fl * FH;
    b.box(W, H, D, WL, 0, H / 2, z0);
    for (let i = 0; i < fl; i++) { const y = .2 + i * FH + .8; b.box(W + .06, .08, .1, CREAM, 0, .2 + i * FH, fz + .03);
      for (let k = 0; k < 3; k++) { const x = -1.3 + k * 1.3, lit = r() < .6; b.box(.62, .96, .04, CREAM, x, y, fz + .01); b.box(.5, .84, .05, lit ? WIN : 0x3a414c, x, y, fz + .02, 0, 0, 0, lit ? 1 : 0); b.box(.02, .84, .06, CREAM, x, y, fz + .03); b.box(.5, .02, .06, CREAM, x, y + .13, fz + .03);
        if (i === 1 || i === fl - 1) { b.box(.74, .04, .3, ST, x, y - .46, fz + .15); for (let q = 0; q < 7; q++) b.box(.014, .3, .014, IRON, x - .33 + q * .11, y - .3, fz + .29); b.box(.74, .03, .03, IRON, x, y - .15, fz + .29); }
        else b.box(.7, .05, .12, ST, x, y - .46, fz + .06); } }
    b.box(W + .2, .18, D + .16, CREAM, 0, H + .09, z0);
    b.box(W - .1, 1.0, D - .5, RF, 0, H + .68, z0); b.box(W, .95, .06, RF, 0, H + .6, fz - .2, -.35); b.box(W, .95, .06, RF, 0, H + .6, z0 - D / 2 + .2, .35);
    for (let k = 0; k < 2; k++) { const x = -.95 + k * 1.9; b.box(.48, .58, .4, CREAM, x, H + .62, fz - .16); P(b, .62, .3, .5, RF, x, H + .91, fz - .16); b.box(.28, .34, .03, WIN, x, H + .6, fz + .05, 0, 0, 0, 1); }
    for (const x of [-1.5, 1.4]) { b.box(.36, .8, .3, 0xb0704f, x, H + 1.45, z0 - .3); for (let q = 0; q < 3; q++) b.cyl(.04, .04, .16, 6, 0xc0603c, x - .1 + q * .1, H + 1.92, z0 - .3); }
    return b.done(); };

  // ---------- 11. le musée : façade néoclassique, colonnade, fronton à la chouette, coupole ----------
  MD.musee_rue = v => { const b = G.mb(965), S1 = 0xeee7d6, S2 = 0xd9cfb8, BZ = 0x6b4a2a, ZF = .72;
    b.P(PT.pierre).box(5.9, 4.3, 2.2, S1, 0, 2.15, ZF - 1.1).P(0);
    b.P(PT.pierre).box(5.8, .36, .4, S2, 0, .18, ZF + .2).box(5.4, .12, .36, S2, 0, .06, 1.3).box(5.4, .24, .24, S2, 0, .12, 1.24).box(5.4, .36, .12, S2, 0, .18, 1.18).P(0);
    for (let i = 0; i < 6; i++) { const x = -2.5 + i; b.cyl(.19, .19, .08, 14, S2, x, .4, .95); b.cyl(.15, .17, .1, 14, S1, x, .49, .95); b.cyl(.13, .15, 2.85, 14, S1, x, 1.965, .95, 0, 0, 0, 0, true);
      b.box(.4, .1, .4, S2, x, 3.45, .95); for (const s of [-1, 1]) b.tor(.055, .02, S2, x + s * .15, 3.34, 1.1, 0, 0, 0, 0, 12); }
    b.box(5.9, .5, .62, S1, 0, 3.75, .9); b.box(5.6, .16, .02, GOLD, 0, 3.78, 1.215);
    P(b, 6.0, 1.05, .6, S1, 0, 4.0, .9); P(b, 5.2, .82, .03, S2, 0, 4.08, 1.215);
    for (const s of [-1, 1]) b.box(3.25, .12, .66, S2, s * 1.5, 4.0 + .525, .9, 0, 0, -s * .337);
    // la chouette du Professeur Plume, dorée, au tympan
    b.sph(.17, GOLD, 0, 4.3, 1.24, 1, 1.1, .4); b.sph(.12, GOLD, 0, 4.52, 1.24, 1, .9, .4); for (const s of [-1, 1]) { b.sph(.045, 0xfff8e8, s * .05, 4.54, 1.29, 1, 1, .4); b.cone(.03, .09, 4, GOLD, s * .08, 4.65, 1.24); }
    // portes de bronze, imposte, hautes fenêtres, bannières d'exposition
    b.box(1.0, 2.1, .06, BZ, 0, 1.41, ZF + .03); b.box(.02, 2.0, .07, dark(BZ), 0, 1.41, ZF + .04); for (const s of [-1, 1]) for (const y of [.95, 1.85]) b.box(.36, .6, .065, dark(BZ, .85), s * .24, y, ZF + .035); for (const s of [-1, 1]) b.sph(.035, GOLD, s * .07, 1.4, ZF + .08);
    halfDisc(b, .5, WIN, 0, 2.46, ZF + .03, 1); b.add(new THREE.TorusGeometry(.52, .04, 6, 18, PI), S2, b.M(0, 2.46, ZF + .05), 0, true);
    for (const s of [-1, 1]) { fen(b, s * 2.0, 2.0, ZF, 1, S2, .5, 1.4); b.box(.55, 1.8, .025, s < 0 ? 0xa8323e : 0x2f4f8a, s * 1.0, 2.55, .95); b.box(.55, .06, .03, GOLD, s * 1.0, 3.44, .95); b.box(.55, .05, .03, GOLD, s * 1.0, 1.7, .95);
      if (s < 0) b.tor(.12, .035, 0xf4f2ec, -1.0, 2.7, .97, 0, 0, 0, 0, 14); else for (const k of [-1, 1]) lo(b, sg(.09, 8, 6), k < 0 ? 0xffd23f : 0x6fd3f0, 1.0 + k * .09, 2.7, .97, 0, 0, k * .4, 1, .6, .3); }
    // toit-terrasse à balustres, tambour et coupole
    for (let k = 0; k < 28; k++) b.cyl(.03, .04, .24, 6, S2, -2.8 + k * .207, 4.42, ZF - .12); b.box(5.9, .06, .12, S2, 0, 4.56, ZF - .12);
    b.cyl(1.05, 1.05, .7, 24, S1, 0, 4.65, -.45); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(.1, .6, .06, S2, Math.cos(a) * 1.07, 4.65, -.45 + Math.sin(a) * 1.07, 0, -a + PI / 2, 0); }
    b.sph(1.08, 0x7fb6c8, 0, 5.0, -.45, 1, .85, 1, 0, 24, 14); b.cyl(.18, .2, .4, 10, S1, 0, 5.98, -.45); b.cone(.24, .3, 10, 0x7fb6c8, 0, 6.33, -.45); b.sph(.07, GOLD, 0, 6.53, -.45);
    for (const s of [-1, 1]) { b.cyl(.04, .05, 1.5, 8, BZ, s * 2.85, .75, 1.3); b.sph(.13, 0xfff1c8, s * 2.85, 1.6, 1.3, 1, 1, 1, 1); b.cyl(.06, .08, .06, 8, GOLD, s * 2.85, 1.47, 1.3); }
    return b.done(); };

  // ---------- 12. la jardinerie de la rue (4 × 3) : façade verte et petite serre devant la vitrine ----------
  MD.jardinerie_rue = v => { const b = G.mb(975), r = G.rng(975), o = G.facade(b, { w: 4, floors: 2, wall: 0xf1f4e6, trim: 0xffffff, roof: 'pignon', roofCol: 0x3f7a4a, shutters: 0x3f7a4a, flowers: 1, chimney: 1 }), fz = o.fz, GL = 0xd8f3e0;
    devanture(b, o.W, fz, 0x3f7a4a, 0xffffff, -.5, 2.4);
    const vx = -.5, vw = 2.4, vd = .62;
    b.box(vw, .3, vd, 0x8a5a34, vx, .15, fz + vd / 2); b.box(vw - .1, .02, vd - .1, 0x3b2c1e, vx, .31, fz + vd / 2);
    b.jit(.15); for (let i = 0; i < 9; i++) b.ico(.16 + (i % 3) * .04, 1, [0x3f8f45, 0x58b54a, 0x4a9e4f][i % 3], vx - 1.0 + i * .25, .5 + (i % 2) * .18, fz + .25 + (i % 3) * .1); b.jit(0);
    for (let i = 0; i < 8; i++) lo(b, sg(.05, 7, 5), [0xe8434a, 0xffd23f, 0xff8fc0, 0xffffff][i % 4], vx - .95 + i * .27, .78 + (i % 2) * .12, fz + .45);
    b.box(vw, 1.3, .03, GL, vx, .95, fz + vd, 0, 0, 0, 2); for (const s of [-1, 1]) b.box(.03, 1.3, vd, GL, vx + s * vw / 2, .95, fz + vd / 2, 0, 0, 0, 2);
    b.box(vw + .04, .03, vd + .1, GL, vx, 1.66, fz + vd / 2, .25, 0, 0, 2);
    for (let i = 0; i <= 6; i++) bx(b, .035, 1.3, .035, 0xffffff, vx - vw / 2 + i * vw / 6, .95, fz + vd); for (const y of [.31, 1.6]) bx(b, vw, .035, .035, 0xffffff, vx, y, fz + vd);
    door(b, 1.35, fz, 0x2f5a3a, .56); board(b, o.W * .62, fz, 2.42, 0x3f7a4a, 0xffffff);
    for (let q = 0; q < 3; q++) pot(b, 1.75 - q * .02, fz + .35 + q * .38, [0xff8fc0, 0xffd23f, 0xe8434a][q]);
    for (const x of [-1.3, .3]) { seg(b, [x, 2.3, fz + .02], [x, 2.3, fz + .35], .01, .01, IRON, 3); seg(b, [x, 2.3, fz + .35], [x, 2.0, fz + .35], .006, .006, IRON, 3); b.cyl(.14, .09, .14, 10, 0x8a5a34, x, 1.93, fz + .35); b.jit(.15); b.ico(.16, 1, 0x4f9a46, x, 1.98, fz + .35, 1.1, .7, 1.1); b.jit(0); lo(b, sg(.04, 7, 5), 0xff8fc0, x + .08, 1.88, fz + .45); }
    return b.done(); };

  // ---------- 13. l'église, au bout ouest (10 × 4, façade +z) ----------
  MD.rue_eglise = v => { const b = G.mb(960), S1 = 0xe6dcc6, S2 = 0xcdc0a3, SL = 0x56606e, ZF = 1.2, TW = 2.5, TZ = ZF - 1.1, pz = TZ + 1.16;
    b.P(PT.pierre).box(9.8, .12, .78, S2, 0, .06, 1.61).box(9.4, .24, .5, S2, 0, .12, 1.47).box(9.0, .36, .26, S2, 0, .18, 1.35).P(0);
    b.P(PT.pierre).box(5.0, 5.0, 3.1, S1, 0, 2.5, ZF - 1.55).P(0); P(b, 5.4, 2.1, 3.3, SL, 0, 5.0, ZF - 1.6);
    b.P(PT.pierre); P(b, 5.0, 1.95, .24, S1, 0, 5.0, ZF - .12); b.P(0);
    for (const s of [-1, 1]) { b.P(PT.pierre).box(2.3, 3.3, 2.8, S1, s * 3.7, 1.65, ZF - 1.6).P(0); b.box(2.5, .1, 3.0, SL, s * 3.75, 3.55, ZF - 1.6, 0, 0, -s * .2);
      b.box(.68, 1.5, .06, S2, s * 3.7, 1.85, ZF - .18); b.box(.55, 1.3, .04, 0x5a2f6e, s * 3.7, 1.85, ZF - .14, 0, 0, 0, 1); b.add(new THREE.ConeGeometry(.28, .35, 4), 0x5a2f6e, b.M(s * 3.7, 2.67, ZF - .14, 0, PI / 4, 0, 1, 1, .2), 1);
      for (const x of [2.55, 4.85]) b.P(PT.pierre).box(.36, 3.0, .5, S2, s * x, 1.5, ZF - .15).P(0); }
    // clocher-porche
    b.P(PT.pierre).box(TW, 9.0, 2.3, S1, 0, 4.5, TZ).P(0);
    for (const y of [5.3, 9.0]) b.box(TW + .14, .16, 2.44, S2, 0, y, TZ);
    for (const s of [-1, 1]) b.P(PT.pierre).box(.3, 9.0, .3, S2, s * (TW / 2 + .02), 4.5, TZ + 1.07).P(0);
    b.box(1.5, 2.6, .08, 0x2e241c, 0, 1.3, pz); b.box(1.16, 1.9, .08, 0x5a3a22, 0, 1.31, pz + .03); b.box(.03, 1.86, .09, 0x3a2516, 0, 1.31, pz + .04);
    for (const s of [-1, 1]) for (const y of [.75, 1.6]) b.box(.4, .04, .09, IRON, s * .3, y, pz + .05);
    halfDisc(b, .58, S2, 0, 2.26, pz + .03); for (let i = 0; i < 3; i++) b.add(new THREE.TorusGeometry(.66 + i * .13, .055, 6, 20, PI), i % 2 ? S1 : S2, b.M(0, 2.26, pz + .05 + i * .015), 0, true);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) b.cyl(.05, .05, 1.9, 8, i % 2 ? S1 : S2, s * (.66 + i * .13), 1.31, pz + .05);
    const ry = 4.2; b.cyl(.72, .72, .05, 28, 0x2c3f8f, 0, ry, pz, PI / 2, 0, 0, 1);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.sph(.12, [0xd8343a, 0xffc23d, 0x3fae6a, 0xb04ad8][i % 4], Math.cos(a) * .47, ry + Math.sin(a) * .47, pz + .02, 1, 1, .3, 1); }
    b.sph(.16, 0xffc23d, 0, ry, pz + .02, 1, 1, .3, 1); b.tor(.74, .06, S2, 0, ry, pz + .04, 0, 0, 0, 0, 32); b.tor(.27, .035, S2, 0, ry, pz + .04, 0, 0, 0, 0, 20);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + PI / 12; b.box(.46, .04, .05, S2, Math.cos(a) * .5, ry + Math.sin(a) * .5, pz + .045, 0, 0, a); }
    clock(b, 0, 6.3, pz + .02, .48);
    const belfry = (cx, cz, a) => { for (const o of [-.45, .45]) { const lx = cx + Math.cos(a) * o, lz = cz - Math.sin(a) * o;
      b.box(.4, 1.25, .06, 0x231c16, lx, 7.65, lz, 0, a, 0); b.add(new THREE.ConeGeometry(.24, .3, 4), 0x231c16, b.M(lx, 8.42, lz, 0, a + PI / 4, 0, 1, 1, .25), 0);
      for (let k = 0; k < 5; k++) b.box(.38, .04, .1, 0x6b5a48, lx, 7.15 + k * .24, lz, -.5, a, 0); } };
    belfry(0, TZ + 1.17, 0); belfry(0, TZ - 1.17, PI); belfry(1.27, TZ, PI / 2); belfry(-1.27, TZ, -PI / 2);
    b.cone(1.32, 4.6, 8, SL, 0, 9.1 + 2.3, TZ, 0, PI / 8, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cone(.17, 1.0, 4, S2, sx * 1.1, 9.6, TZ + sz * 1.0, 0, PI / 4, 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; b.box(.3, .4, .3, SL, Math.sin(a) * 1.0, 10.1, TZ + Math.cos(a) * 1.0, 0, a, 0); P(b, .36, .25, .36, SL, Math.sin(a) * 1.0, 10.3, TZ + Math.cos(a) * 1.0, a); }
    b.sph(.11, GOLD, 0, 13.75, TZ); b.box(.06, .7, .06, GOLD, 0, 14.15, TZ); b.box(.36, .06, .06, GOLD, 0, 14.28, TZ);
    b.sph(.09, GOLD, 0, 14.6, TZ, 1.3, .9, .6); b.cone(.07, .2, 4, GOLD, -.14, 14.66, TZ, 0, 0, PI / 2);
    return b.done(); };

  // ---------- 14. les grands magasins, au bout est (10 × 4, façade +z) ----------
  MD.rue_magasins = v => { const b = G.mb(970), WL = 0xf1e8d6, GL = 0xcfe6f0, ZF = 1.3, D = 3.2, zc = ZF - D / 2, G0 = 3.2, FH = 1.55, H = G0 + 3 * FH;
    b.box(9.9, H, D, WL, 0, H / 2, zc); b.P(PT.pierre).box(9.94, G0, D + .04, 0xe2d6bf, 0, G0 / 2, zc).P(0);
    for (const x of [-3.85, -2.05, 2.05, 3.85]) { b.box(1.4, 1.9, .06, WIN, x, 1.3, ZF + .03, 0, 0, 0, 1); halfDisc(b, .7, WIN, x, 2.25, ZF + .03, 1);
      b.add(new THREE.TorusGeometry(.73, .05, 6, 18, PI), GOLD, b.M(x, 2.25, ZF + .07), 0, true); for (const s of [-1, 1]) b.box(.08, 1.95, .1, GOLD, x + s * .73, 1.3, ZF + .06); b.box(1.56, .1, .14, GOLD, x, .32, ZF + .08);
      for (const s of [-1, 1]) { const mx = x + s * .32, c = [0xd8343a, 0x2f6fb8, 0xffd23f, 0x8d6fd1, 0x3f9a59, 0xff8fc0][(Math.round(x * 3) + s + 18) % 6]; b.cyl(.015, .015, .5, 5, 0x1d1f22, mx, .62, ZF + .14); b.cone(.2, .62, 10, c, mx, 1.12, ZF + .14); b.cyl(.07, .09, .26, 8, c, mx, 1.55, ZF + .14); b.sph(.08, 0xf2e6dc, mx, 1.78, ZF + .14); } }
    b.box(2.0, 2.5, .06, 0x1d2a3a, 0, 1.25, ZF + .03); b.box(1.7, 2.15, .07, GL, 0, 1.2, ZF + .05, 0, 0, 0, 2); for (const x of [-.85, 0, .85]) b.box(.05, 2.15, .08, GOLD, x, 1.2, ZF + .06);
    b.box(2.9, .05, 1.0, GL, 0, 2.75, ZF + .5, -.1, 0, 0, 2); b.box(2.94, .08, .06, GOLD, 0, 2.7, ZF + 1.0); for (const x of [-1.4, 0, 1.4]) seg(b, [x, 3.3, ZF + .02], [x, 2.78, ZF + .95], .02, .02, IRON, 4);
    b.box(7.2, .42, .06, 0x1d3a5f, 0, G0 + .05, ZF + .04); b.box(7.3, .04, .07, GOLD, 0, G0 + .28, ZF + .045); b.box(7.3, .04, .07, GOLD, 0, G0 - .18, ZF + .045);
    for (let f = 0; f < 3; f++) { const y = G0 + f * FH + .9; b.box(9.96, .1, .12, CREAM, 0, G0 + f * FH + .32, ZF + .05);
      for (let k = 0; k < 7; k++) { const x = -4.2 + k * 1.4; fen(b, x, y, ZF, 1, CREAM, .62, .95);
        if (f === 0) { b.box(.9, .05, .34, ST, x, y - .55, ZF + .17); for (let q = 0; q < 7; q++) b.cyl(.012, .012, .32, 4, GOLD, x - .4 + q * .133, y - .38, ZF + .32); b.box(.9, .03, .03, GOLD, x, y - .22, ZF + .32); } } }
    b.box(10.1, .22, D + .2, CREAM, 0, H + .11, zc); b.box(9.6, 1.1, D - .6, ZINC, 0, H + .77, zc); b.box(9.9, 1.15, .08, ZINC, 0, H + .68, ZF - .28, -.36);
    for (const x of [-3.2, -2.1, 2.1, 3.2]) { b.cyl(.2, .2, .06, 14, WIN, x, H + .75, ZF - .1, PI / 2, 0, 0, 1); b.tor(.21, .035, GOLD, x, H + .75, ZF - .07, 0, 0, 0, 0, 16); }
    // coupole centrale dorée, lanterne et drapeau
    const dz = ZF - 1.4; b.cyl(1.3, 1.3, .9, 28, CREAM, 0, H + .45, dz); b.sph(1.32, 0x3f5a6e, 0, H + .9, dz, 1, .9, 1, 0, 24, 14);
    for (let i = 0; i < 8; i++) b.add(new THREE.TorusGeometry(1.33, .03, 4, 12, PI / 2), GOLD, b.M(0, H + .9, dz, 0, i / 8 * TAU, 0, 1, .9, 1), 0, true);
    b.cyl(.25, .28, .5, 10, CREAM, 0, H + 2.25, dz); b.sph(.27, GOLD, 0, H + 2.55, dz, 1, .8, 1); seg(b, [0, H + 2.7, dz], [0, H + 3.7, dz], .02, .02, IRON, 4);
    [0x2f4f9a, 0xffffff, 0xd8343a].forEach((c, i) => b.box(.2, .38, .02, c, .1 + i * .2, H + 3.48, dz));
    for (const s of [-1, 1]) { b.box(.9, .8, .9, CREAM, s * 4.5, H + .4, ZF - .5); b.cone(.66, 1.0, 4, SLATE, s * 4.5, H + 1.3, ZF - .5, 0, PI / 4, 0); b.sph(.08, GOLD, s * 4.5, H + 1.85, ZF - .5); }
    return b.done(); };

  // ---------- objets ----------
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p);
  obj('platane', 'Platane', 'rue_platane', { h: 6, chop: 3, shake: 'coins', shadow: 1.3 });
  obj('colonne_morris', 'Colonne Morris', 'colonne_morris', { h: 3.1, take: 1 });
  obj('fontaine_wallace', 'Fontaine Wallace', 'fontaine_wallace', { h: 2.2, fountain: 1, take: 1 });
  ETAL.forEach(([k, n], i) => obj('etal_' + k, n, 'etal_marche', { v: i, fp: [2, 1], h: 2.2, take: 1 }));
  obj('halle_rue', 'Marché couvert', 'halle_rue', { fp: [9, 3], h: 4.4, fixed: 1, seeThru: 1 }); // verrière : la caméra voit au travers, on ne la cache pas
  obj('passage_gare', 'Passage de la Gare', 'passage_gare', { fp: [4, 3], h: 6.2, fixed: 1 });
  obj('grille_gare', 'Grille de la gare', 'grille_gare', { fp: [4, 1], h: 2.8, fixed: 1, seeThru: 1 });
  obj('rue_echoppe', 'Boutique de la rue', 'rue_echoppe', { fp: [3, 3], h: 5, fixed: 1 });
  obj('rue_angle', 'Immeuble d\'angle', 'rue_angle', { fp: [4, 3], h: 6.6, fixed: 1 });
  obj('rue_fond', 'Immeuble', 'rue_fond', { fp: [4, 3], h: 9.5, fixed: 1 });
  obj('musee_rue', 'Musée', 'musee_rue', { fp: [6, 3], h: 6.6, fixed: 1, enter: 'musee' });
  obj('jardinerie_rue', 'Jardinerie Feuillu', 'jardinerie_rue', { fp: [4, 3], h: 5, fixed: 1, enter: 'jardinerie' });
  obj('rue_eglise', 'Église', 'rue_eglise', { fp: [10, 4], h: 14.8, fixed: 1 });
  obj('rue_magasins', 'Grands Magasins', 'rue_magasins', { fp: [10, 4], h: 11.5, fixed: 1 });
  // le mobilier urbain s'achète aussi pour décorer son village
  const item = (id, n, cat, sell) => { G.ITEMS[id] = { id, n, stack: 99, sell, kind: 'place', obj: id, cat, thumb: 'obj:' + id }; };
  item('platane', 'Platane', 'nature', 80); item('colonne_morris', 'Colonne Morris', 'mobilier', 420); item('fontaine_wallace', 'Fontaine Wallace', 'mobilier', 650);
  ETAL.forEach(([k, n]) => item('etal_' + k, n, 'mobilier', 320));
  for (const id of ['colonne_morris', 'fontaine_wallace', 'etal_fruits', 'etal_fleurs', 'etal_pains']) if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);

  // ---------- décor fixe de la rue (bordures, caniveaux, guirlandes, fanions, ville alentour) ----------
  function textPlane(m, lines, o) { const c = G.cv(o.cw || 512, o.ch || 192), x = c.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = o.bg; G.rrect(x, 4, 4, W - 8, H - 8, o.rad || 18); x.fill(); if (o.border) { x.lineWidth = o.lw || 8; x.strokeStyle = o.border; G.rrect(x, 14, 14, W - 28, H - 28, Math.max(4, (o.rad || 18) - 8)); x.stroke(); }
    x.fillStyle = o.fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const [t, size, y] of lines) { x.font = 'bold ' + size + 'px Fredoka, Nunito, sans-serif'; x.fillText(t, W / 2, y * H); }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const mat = G.curveMat(new THREE.MeshBasicMaterial({ map: tex })), mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h, Math.max(1, Math.round(o.w)), 1), mat);
    mesh.position.set(o.x, o.y, o.z); mesh.rotation.y = o.ry || 0; m.group.add(mesh); (m.signs || (m.signs = [])).push(mat); return mesh; }
  function decor(m) {
    const W = m.W, H = m.H, b = G.mb(999), r = G.rng(999), EX = 30;
    // bordures de granit et caniveaux, par morceaux d'un mètre (le monde est courbé : un long bloc ne suivrait pas la courbure)
    for (let x = 4; x < W - 4; x++) for (const [z, s] of [[9, 1], [13, -1]]) { bx(b, 1.0, .05, .16, vary(0xbab5aa, r, .1), x + .5, .025, z); bx(b, 1.0, .015, .3, 0x8f8a80, x + .5, .0075, z + s * .23); }
    for (let k = 0; k < 4; k++) bx(b, 2.3, .012, .5, 0xf2f0ea, EX, .006, 9.65 + k * .9); // passage piéton devant le passage de la gare
    for (const [mx, mz] of [[12.5, 11.2], [24.5, 10.3], [38.5, 11.6], [50.5, 10.4]]) { b.add(new THREE.CircleGeometry(.3, 16).rotateX(-PI / 2), 0x4f4b44, b.M(mx, .009, mz)); b.tor(.3, .02, 0x3f3b35, mx, .01, mz, PI / 2, 0, 0, 0, 16); }
    // guirlandes de guinguette en zigzag et fanions au-dessus du marché
    const BULB = [0xfff1c8, 0xffd36b, 0xff6b5a, 0x7fd36b, 0x6bb6ff, 0xffa64d], FLAG = [0xd8343a, 0xffd23f, 0x2f6fb8, 0x3f9a59, 0xffffff, 0xff8fc0];
    const strand = (A, B, sag, deco) => { const L = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.max(4, Math.round(L / .42)), dx = (B[0] - A[0]) / L, dz = (B[2] - A[2]) / L; let prev = A;
      for (let i = 1; i <= n; i++) { const t = i / n, p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t];
        seg(b, prev, p, .008, .008, 0x22252a, 3); if (i < n) deco(p, i, dx, dz); prev = p; } };
    const bulb = (p, i) => { bx(b, .03, .05, .03, 0x22252a, p[0], p[1] - .02, p[2]); lo(b, sg(.045, 6, 4), BULB[i % 6], p[0], p[1] - .075, p[2], 0, 0, 0, 1, 1.2, 1, 1); };
    const flag = (p, i, dx, dz) => { const w = .13, h = .26, a = [p[0] - dx * w, p[1], p[2] - dz * w], c = [p[0] + dx * w, p[1], p[2] + dz * w], d = [p[0], p[1] - h, p[2]], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...c, ...d, ...a, ...d, ...c], 3)); b.add(g, FLAG[i % 6], b.M(), 0, false); };
    const NY = 3.45, SY = 3.3, NZ = 5.58, SZ = 16.42, zig = [22, 26, 30, 34, 38, 42, 46, 50, 54];
    for (let i = 0; i + 1 < zig.length; i++) { const nth = i % 2 === 0, A = nth ? [zig[i], NY, NZ] : [zig[i], SY, SZ], B = nth ? [zig[i + 1], SY, SZ] : [zig[i + 1], NY, NZ]; strand(A, B, .75, bulb); }
    for (const fx of [5.5, 9.5, 12.5, 16.5]) { const halle = fx > 10 && fx < 18; strand([fx, NY, NZ], [fx, halle ? 2.95 : SY, halle ? 16.1 : SZ], .55, flag); }
    // la ville continue tout autour (silhouettes d'immeubles, arbres) : on ne voit plus le bord du monde
    const block = (x, z, w, d, h) => { const wall = [0xeadfca, 0xe4ddd2, 0xf0e4c2, 0xd9c7b0, 0xcfd6dc, 0xb5553d][Math.floor(r() * 6)], roof = r() < .5 ? ZINC : r() < .5 ? SLATE : 0xb5533f;
      bx(b, w, h, d, wall, x, h / 2, z); P(b, (w > d ? d : w) + .3, 1.3, (w > d ? w : d) + .3, roof, x, h, z, w > d ? PI / 2 : 0);
      for (let k = 0; k < Math.floor((h - .6) / 1.6); k++) { bx(b, w + .03, .45, d + .03, dark(wall, .82), x, 1.1 + k * 1.6, z); if (r() < .5) bx(b, .35, .4, d + .06, WIN, x + (r() - .5) * (w - .6), 1.1 + k * 1.6, z, 0, 1); }
      if (r() < .7) bx(b, .4, .9, .4, 0xb0704f, x + (r() - .5) * w * .6, h + .9, z); };
    for (let x = -18; x < W + 18; x += 4.3) block(x, -6.5 - r() * 3, 4, 5, 7 + r() * 6);
    for (let z = -4; z < H + 8; z += 4.6) { block(-6.5 - r() * 3, z, 5, 4.2, 6 + r() * 6); block(W + 6.5 + r() * 3, z, 5, 4.2, 6 + r() * 6); }
    for (let x = -14; x < W + 14; x += 3.2) { const z = H + 2.5 + r() * 9, h = 1.4 + r() * .8; b.cyl(.14, .2, h, 6, 0x6b4a32, x, h / 2, z); b.jit(.08); b.blob(1.2 + r() * .6, 1, [0x3f7a32, 0x4f8f3a, 0x5a9a44][Math.floor(r() * 3)], x, h + 1.0, z, 1, .9, 1); b.jit(0); }
    const g = b.done(), mesh = new THREE.Mesh(g, G.MATS); mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false; m.group.add(mesh);
    // sol au-delà de la carte
    const sk = new THREE.PlaneGeometry(W + 240, H + 240, 72, 54); sk.rotateX(-PI / 2); sk.translate(W / 2, -.06, H / 2);
    const pa = sk.attributes.position, ca = new Float32Array(pa.count * 3), C = new THREE.Color();
    for (let i = 0; i < pa.count; i++) { C.set(0x6f8f54).multiplyScalar(.82 + G.hash2(Math.floor(pa.getX(i) / 7) + 500, Math.floor(pa.getZ(i) / 7) + 500, 5) * .3); ca[i * 3] = C.r; ca[i * 3 + 1] = C.g; ca[i * 3 + 2] = C.b; }
    sk.setAttribute('color', new THREE.BufferAttribute(ca, 3)); const skm = new THREE.Mesh(sk, G.MATS[0]); skm.receiveShadow = true; skm.frustumCulled = false; m.group.add(skm);
    // plaques de rue émaillées et enseigne des grands magasins
    const plate = { bg: '#1f4f9a', fg: '#ffffff', border: '#e9f0ff', rad: 22, w: .56, h: .25, cw: 512, ch: 224 }, PL = [['GRAND-RUE', 92, .44], [G.villageName.toUpperCase(), 34, .78]];
    textPlane(m, PL, Object.assign({}, plate, { x: 2.65, y: 3.05, z: 5.57 })); textPlane(m, PL, Object.assign({}, plate, { x: 57.35, y: 3.05, z: 5.57 }));
    textPlane(m, PL, Object.assign({}, plate, { x: 2.65, y: 3.05, z: 16.43, ry: PI })); textPlane(m, PL, Object.assign({}, plate, { x: 57.35, y: 3.05, z: 16.43, ry: PI }));
    textPlane(m, [['GRANDS MAGASINS DE LA VALLÉE', 92, .52]], { bg: '#1d3a5f', fg: '#e9c46a', w: 7.0, h: .4, cw: 2048, ch: 118, rad: 6, x: 56.6, y: 3.25, z: 11, ry: -PI / 2 });
  }

  // ---------- la rue ----------
  const NROW = [['rue_angle', 4, 0], ['immeuble', 3, 0], ['musee_rue', 6, null, 'rue_musee', 'Musée'], ['galerie', 4, null, 'rue_galerie', 'Galerie d\'art'], ['cafe', 3, null, 'rue_cafe', 'Café Le Perchoir'], ['boutique', 4, null, 'rue_boutique', 'Bazar Gaston'],
    ['immeuble', 3, 1], ['couturiere', 3, null, 'rue_couture', 'Sœurs Laine'], ['salon', 3, null, 'rue_salon', 'Salon Frisette'], ['chausseur', 3, null, 'rue_chausseur', 'Chausseur Lacet'], ['immeuble', 3, 2],
    ['melimelo', 4, null, 'rue_meli', 'Méli-Mélo'], ['jardinerie_rue', 4, null, 'rue_jardin', 'Jardinerie Feuillu'], ['agence', 3, null, 'rue_agence', 'Agence Nid Douillet'], ['club', 3, null, 'rue_club', 'Club Rire'], ['immeuble', 3, 3], ['rue_angle', 4, 1]];
  const SROW = [['rue_angle', 4, 2], ['rue_echoppe', 3, 0], ['rue_echoppe', 3, 9], ['halle_rue', 9], ['rue_echoppe', 3, 1], ['rue_echoppe', 3, 2], ['rue_echoppe', 3, 3], ['passage_gare', 4], ['rue_echoppe', 3, 4], ['rue_echoppe', 3, 10],
    ['rue_echoppe', 3, 5], ['rue_echoppe', 3, 6], ['rue_echoppe', 3, 7], ['rue_echoppe', 3, 11], ['rue_echoppe', 3, 12], ['rue_echoppe', 3, 8], ['rue_angle', 4, 3]];
  const CAMH = { rue_angle: 6.4, rue_echoppe: 4.8, halle_rue: 2.9, passage_gare: 5.6 }; // hauteur que la caméra doit survoler (rangée sud)
  G.genRue = () => {
    const W = 60, H = 28, EX = 30, m = new G.GMap(W, H, { kind: 'rue', id: 'rue' }), I = (x, z) => z * W + x, r = G.rng(4243);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const side = x < 4 || x >= W - 4;
      m.surf[I(x, z)] = z <= 5 || (z >= 16 && z <= 18) || (side && z <= 18) ? 3 : z <= 8 || (z >= 13 && z <= 15) ? 11 : z <= 12 ? 4 : G.hash2(x, z, 7) < .16 ? 14 : 0; }
    for (let z = 19; z <= 22; z++) for (const x of [EX - 1, EX]) m.surf[I(x, z)] = 4;
    const force = (t, x, z, rot, ex) => m.addObj(t, x, z, rot, ex), put = (t, x, z, rot = 0, ex) => m.canPlace(t, x, z, rot) ? m.addObj(t, x, z, rot, ex) : null, labels = [];
    // les toits de la ville, derrière les boutiques
    for (let k = 0; k < 15; k++) force('rue_fond', k * 4, 0, 0, { v: k % 6, ch: 8 });
    // rangée nord : les boutiques, plein sud
    let x = 0; for (const [t, w, v, iid, name] of NROW) { const ex = { ch: 6 }; if (v != null) ex.v = v; if (iid) ex.iid = iid; force(t, x, 3, 0, ex); if (name) labels.push([name, x + w / 2, t === 'musee_rue' ? 3.78 : 2.45]); x += w; }
    // rangée sud : échoppes, marché couvert, passage de la gare (façades vers la rue)
    x = 0; for (const [t, w, v] of SROW) { const ex = { ch: CAMH[t] }; if (v != null) ex.v = v; force(t, x, 16, 2, ex); x += w; }
    // la perspective est fermée par l'église (ouest) et les grands magasins (est)
    force('rue_eglise', 0, 6, 1, { ch: 12 }); force('rue_magasins', W - 4, 6, 3, { ch: 9 });
    // trottoir nord : platanes, candélabres, bancs, colonne Morris, terrasse du café
    // (les grands arbres seulement devant les immeubles : vus d'en haut, ils ne cachent pas les vitrines)
    for (const px of [5, 25, 37, 54]) put('platane', px, 8);
    for (const cx of [8, 16, 22, 31, 40, 46, 52]) put('candelabre', cx, 8);
    for (const bx2 of [13, 27, 48]) put('banc_fer', bx2, 8);
    put('olivier_caisse', 11, 8); put('oranger_caisse', 34, 8); put('colonne_morris', 43, 8, 0, { v: 3 });
    for (const tx of [17, 19]) put('table_bistrot', tx, 7);
    put('chaise_bistrot', 16, 7, 1); put('chaise_bistrot', 18, 7, 3); put('chaise_bistrot', 20, 7, 3); put('chaise_bistrot', 17, 8, 2); put('chaise_bistrot', 19, 8, 2); put('parasol', 18, 8);
    put('oranger_caisse', 7, 6); put('oranger_caisse', 12, 6); put('pot_fleurs', 24, 6); put('pot_fleurs', 26, 6); put('pot_fleurs', 53, 6); put('pot_fleurs', 55, 6);
    // trottoir sud : platanes, candélabres, étals, kiosque, fontaine Wallace, terrasse de la brasserie
    [7, 13, 19, 25, 34, 40, 46, 52].forEach((px, i) => put(i % 2 ? 'olivier_caisse' : 'oranger_caisse', px, 13));
    for (const cx of [4, 10, 16, 22, 28, 31, 37, 43, 49, 55]) put('candelabre', cx, 13);
    for (const bx2 of [20, 47]) put('banc_fer', bx2, 13, 2);
    put('etal_fruits', 10, 14, 2); put('etal_legumes', 16, 14, 2); put('etal_fleurs', 19, 15, 2); put('etal_pains', 5, 15, 2); put('etal_fromages', 33, 15, 2);
    put('colonne_morris', 24, 15); put('fontaine_wallace', 35, 14); put('kiosque_journaux', 41, 14);
    for (const tx of [44, 46]) put('table_bistrot', tx, 14);
    put('chaise_bistrot', 43, 14, 1); put('chaise_bistrot', 45, 14, 1); put('chaise_bistrot', 44, 15, 2); put('chaise_bistrot', 46, 15, 2); put('parasol', 45, 15);
    // la ruelle de la gare : grilles, et la grille de la gare au bout
    for (const fz of [19, 20]) { put('cloture_fer', EX - 2, fz, 0, { v: 5 }); put('cloture_fer', EX + 1, fz, 0, { v: 5 }); }
    force('grille_gare', EX - 2, 21, 0, { ch: 2.8 });
    // jardins derrière les échoppes : haies, arbres fruitiers, fleurs ; puis les arbres de la colline
    for (let gx = 2; gx < W - 2; gx++) if (gx < EX - 2 || gx > EX + 1) put('haie', gx, 21, 0, { v: (gx > 2 && gx !== EX + 2 ? 8 : 0) | (gx < W - 3 && gx !== EX - 3 ? 2 : 0) });
    for (const hx of [9, 15, 21, 36, 42, 48, 54]) for (const hz of [19, 20]) put('haie', hx, hz, 0, { v: hz === 19 ? 4 : 5 });
    const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
    for (let gx = 4; gx < W - 4; gx++) { if (gx >= EX - 2 && gx <= EX + 1) continue; if (gx % 6 === 0) put(G.pick(['pommier', 'cerisier', 'oranger', 'pecher'], r), gx, 20); else if (r() < .45) put((r() < .5 ? 'tulipe_' : 'fleur_') + FL[Math.floor(r() * 7)], gx, 19 + (r() < .5 ? 0 : 1)); }
    // au sud (entre la caméra et la rue) : rien de haut, des massifs et des fleurs ; les arbres seulement loin du passage
    for (let tz = 22; tz < H - 2; tz++) for (let tx2 = 2; tx2 < W - 2; tx2++) { if (tx2 >= EX - 3 && tx2 <= EX + 2) continue; const far = Math.abs(tx2 + .5 - EX) > 16;
      if (far && tz >= 24 && G.hash2(tx2, tz, 11) < .28) put(G.pick(['chene', 'bouleau', 'cerisier', 'pommier'], r), tx2, tz);
      else if (G.hash2(tx2, tz, 12) < .16) put(G.pick(['buisson', 'hortensia', 'buisson_baies'], r), tx2, tz); else if (G.hash2(tx2, tz, 13) < .2) put((r() < .5 ? 'tulipe_' : 'fleur_') + FL[Math.floor(r() * 7)], tx2, tz); }
    m.meta = { rue: true, rue3: true, spawn: { x: EX, z: 19.6 }, exitZ: 20.9, exitX: EX, seaZ: H + 1000, plaza: { x: EX, z: 11 }, title: 'Rue commerçante',
      homes: [{ vi: 0, x: 23, z: 10.5 }, { vi: 2, x: 41, z: 10.5 }, { vi: 1, x: 12, z: 7.4 }], npcs: [{ role: 'marche', x: 14.5, z: 17.65, yaw: PI }] };
    // la caméra survole les immeubles de la rangée sud au lieu de se cacher derrière
    m.camH = (cx, cz) => { const t = m.terrainH(cx, cz), o = m.objAt(Math.floor(cx), Math.floor(cz)); return o && o.ch ? Math.max(t, o.y + o.ch) : t; };
    for (const [n, lx, ly] of labels) G.mapLabel(m, n, lx, ly, 6.15, .9);
    G.mapLabel(m, 'Marché couvert', 14.5, 3.3, 15.8, .95);
    G.mapLabel(m, '🚉 Passage de la Gare', EX, 3.35, 16.2, 1.0);
    G.mapLabel(m, '🏬 ' + G.villageName + ' · Rue commerçante', EX, 3.7, 19.1, 1.1);
    decor(m);
    return m;
  };

  // ---------- la maraîchère du marché couvert ----------
  G.NPCS.marche = { n: 'Mathilde', sp: 'maraichere', col: 0xb5653a, shirt: 0x3f9a59, apron: 0xf3e2c4, neckwear: 0xd8343a, eyeCol: 0x5a3a22, pitch: 1.18 };
  const stock = () => { const r = G.rng(G.clock.day * 131 + 7), take = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(r() * c.length), 1)[0]); return out; };
    const fl = Object.values(G.ITEMS).filter(i => i.kind === 'place' && i.cat === 'fleurs').map(i => i.id);
    return take(['pomme', 'orange', 'peche', 'cerise', 'coco', 'baies', 'champignon'].filter(id => G.ITEMS[id]), 4).concat(take(['pommier', 'oranger', 'pecher', 'cerisier', 'platane'].filter(id => G.ITEMS[id]), 2), take(fl, 6), ['tarte', 'soupe'].filter(id => G.ITEMS[id])); };
  G.npcRoles.marche = v => G.npcSay(v, ['Bonjour ' + G.playerName + ' ! Bienvenue au marché couvert de ' + G.villageName + '.', 'Fruits, fleurs, jeunes arbres : mes étals changent tous les matins !'], ['Voir les étals du jour', 'Vendre ma récolte', 'Au revoir']).then(k => {
    if (k === 0) return G.ui.openShop(v, { list: stock(), title: 'Marché couvert — étals du jour', quote: '« Tout frais, tout beau, tout de saison ! »', noSell: true });
    if (k === 1) return G.ui.openShop(v, { list: [], title: 'Marché couvert — je rachète', quote: '« Fruits, poissons, coquillages : je te les rachète au juste prix ! »' }); });

  // ---------- anciennes sauvegardes : position dans l'ancienne rue, porte de sortie des boutiques ----------
  const R = G.rue, ogo = R.go;
  R.go = (x, z, yaw, instant) => { if (x != null) { const m = R.get(); if (!m.meta.rue3 || !(x > 4 && x < m.W - 4 && z > 5.6 && z < 20.8) || m.topAt(x, z) > .45) x = z = yaw = null; } return ogo(x, z, yaw, instant); };
  G.on('init', () => { const oex = G.act.exitHouse; G.act.exitHouse = () => { const im = G.map;
    if (im && im.interior && im.meta.fromId === 'rue' && G.rueMap) { const o = [...G.rueMap.list].find(q => q.iid && q.iid === im.id), d = o && G.OBJ[o.t];
      if (d) { const [cx, cz] = G.rueMap.center(o), F = G.FR[o.r]; im.meta.door = { x: cx + F[0] * (d.fp[1] / 2 + .7), z: cz + F[1] * (d.fp[1] / 2 + .7), yaw: o.r * PI / 2 }; } }
    return oex(); }; });
  // plaques et enseignes peintes : moins vives la nuit
  G.on('frame', () => { const m = G.rueMap; if (!m || G.map !== m || !m.signs) return; const n = G.SU && G.SU.uNight ? G.SU.uNight.value : 0; for (const mt of m.signs) mt.color.setScalar(1 - .62 * n); });
})();
