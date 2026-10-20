'use strict';
// ===== Le Parc des Merveilles : au bout du Boulevard de la Vallée (rue commerçante), une grande porte illuminée ouvre sur un parc d'attractions.
// La grande roue (on la voit dépasser des toits de la rue), le carrousel de chevaux de bois, les montagnes russes, les chaises volantes,
// les tasses qui tournent, et les stands (barbe à papa, glaces, chamboule-tout, pêche aux canards, gaufres, ballons).
// Tout tourne, tout s'illumine le soir, et on monte dans chaque manège (E). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const GOLD = 0xd9b84a, RED = 0xd8343a, CREAM = 0xf6f1e6, WHITE = 0xffffff, NAVY = 0x2f4a8a, IRON = 0x2b2f33, MINT = 0x5fc8a8, PINK = 0xff8fc0, SKY = 0x6bb6ff, SUN = 0xffd23f;
  const BULBS = [0xfff1c8, 0xffd36b, 0xff6b5a, 0x7fd36b, 0x6bb6ff, 0xffa64d];
  const W = 100, H = 90, AV = [46, 53], CR = [37, 42]; // la grande allée (x) et l'allée transversale (z)
  const surv = () => G.mode === 'survie', PRICE = 100;
  // ---------- petits outils de modelage ----------
  const seg = (b, a, c, r, col, n = 6, mat = 0) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, true); g.translate(0, L / 2, 0);
    b.add(g, col, new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); };
  const bulb = (b, x, y, z, k, s = 1) => b.add(new THREE.SphereGeometry(.07 * s, 6, 4), BULBS[k % 6], b.M(x, y, z), 1, true);
  const lo = (b, g, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = 0) => b.add(g, col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), mat, true);
  const mk = (geo, parent) => { const m = new THREE.Mesh(geo, G.MATS); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; parent.add(m); return m; };
  const ctr = (g, w, d) => { g.translate(-w / 2, 0, -d / 2); g.computeBoundingSphere(); g.computeBoundingBox(); return g; }; // les modèles sont centrés sur leur emprise
  const stripes = (b, r0, r1, h, y, n, c1, c2, open) => { for (let k = 0; k < n; k++) b.add(new THREE.CylinderGeometry(r1, r0, h, 2, 1, open !== false, k / n * TAU, TAU / n), k % 2 ? c2 : c1, b.M(0, y, 0)); };

  // ================= LA GRANDE ROUE =================
  const RW = 12.5, AXY = 15.9, NG = 18, GCOL = [RED, SKY, SUN, MINT, PINK, 0xff9a3c];
  const wheelGeo = () => { const b = G.mb(7101), RIM = 0xf2f2f2;
    for (const z of [-1, 1]) { lo(b, new THREE.TorusGeometry(RW, .16, 6, 96), RIM, 0, 0, z * .95); lo(b, new THREE.TorusGeometry(RW - 1.2, .09, 5, 96), RIM, 0, 0, z * .95); lo(b, new THREE.TorusGeometry(3, .12, 5, 40), RED, 0, 0, z * .95);
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, c = Math.cos(a), s = Math.sin(a); seg(b, [c * .6, s * .6, z * .7], [c * RW, s * RW, z * .95], .06, RIM, 5); seg(b, [c * (RW - 1.2), s * (RW - 1.2), z * .95], [Math.cos(a + TAU / 48) * RW, Math.sin(a + TAU / 48) * RW, z * .95], .045, RIM, 4); }
      for (let k = 0; k < 96; k++) { const a = k / 96 * TAU; bulb(b, Math.cos(a) * (RW + .18), Math.sin(a) * (RW + .18), z * .95, k, 1.1); }
      for (let k = 0; k < 24; k++) { const a = (k + .5) / 24 * TAU; for (let j = 1; j <= 4; j++) bulb(b, Math.cos(a) * RW * j / 5, Math.sin(a) * RW * j / 5, z * .95, k + j); } }
    for (let k = 0; k < NG; k++) { const a = k / NG * TAU; seg(b, [Math.cos(a) * RW, Math.sin(a) * RW, -1.05], [Math.cos(a) * RW, Math.sin(a) * RW, 1.05], .08, GOLD, 6); }
    b.cyl(.75, .75, 3.4, 20, GOLD, 0, 0, 0, PI / 2); b.cyl(.95, .95, .3, 20, RED, 0, 0, 1.25, PI / 2); b.cyl(.95, .95, .3, 20, RED, 0, 0, -1.25, PI / 2); b.sph(.5, GOLD, 0, 0, 1.75); b.sph(.5, GOLD, 0, 0, -1.75);
    return b.done(); };
  const gondolaGeo = col => { const b = G.mb(7102 + col % 97);
    b.cyl(.06, .06, .9, 6, IRON, 0, -.45, 0); b.box(.5, .08, .08, GOLD, 0, -.05, 0);
    b.cyl(.75, .7, .12, 18, col, 0, -.95, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; seg(b, [Math.cos(a) * .66, -1.95, Math.sin(a) * .66], [Math.cos(a) * .66, -1.0, Math.sin(a) * .66], .035, WHITE, 4); }
    b.cyl(.75, .72, .2, 18, CREAM, 0, -1.1, 0); lo(b, new THREE.SphereGeometry(.8, 16, 6, 0, TAU, 0, PI / 2), col, 0, -1.0, 0, 0, 0, 0, 1, .45, 1); b.sph(.1, GOLD, 0, -.62, 0);
    b.cyl(.72, .62, .55, 18, col, 0, -2.25, 0); b.cyl(.76, .76, .08, 18, GOLD, 0, -1.98, 0); b.cyl(.62, .5, .2, 18, CREAM, 0, -2.6, 0);
    b.box(.9, .08, .3, 0x8a6a48, 0, -2.05, .3); b.box(.9, .08, .3, 0x8a6a48, 0, -2.05, -.3); bulb(b, 0, -2.72, 0, col & 7, 1.2);
    return b.done(); };
  MD.roue_base = v => { const b = G.mb(7103), ST = 0xd8cfbd, W2 = 0xf2f2f2;
    // l'estrade, l'escalier et la rambarde
    b.P(G.PAT && G.PAT.pierre || 0); b.box(12, .5, 7, ST, 6, .25, 3.5); b.P(0); b.box(11.6, .06, 6.6, 0xc9a26b, 6, .53, 3.5);
    for (let k = 0; k < 4; k++) b.box(3, .5 - k * .12, .4, ST, 6, (.5 - k * .12) / 2, 7.2 + k * .4);
    for (let x = .3; x < 12; x += .7) { b.box(.05, .7, .05, GOLD, x, .9, .2); b.box(.05, .7, .05, GOLD, x, .9, 6.8); } b.box(12, .06, .06, GOLD, 6, 1.25, .2); b.box(12, .06, .06, GOLD, 6, 1.25, 6.8);
    // les deux chevalets en A (le moyeu est à AXY de haut, au milieu)
    for (const z of [3.5 - 1.6, 3.5 + 1.6]) { for (const s of [-1, 1]) { seg(b, [6 + s * 6, .5, z + (z > 3.5 ? 1.6 : -1.6)], [6 + s * .6, AXY, z], .32, W2, 10); seg(b, [6 + s * 6, .5, z + (z > 3.5 ? 1.6 : -1.6)], [6 + s * 4.5, .5, z + (z > 3.5 ? 1.6 : -1.6)], .2, W2, 8); }
      for (let k = 1; k < 5; k++) { const t = k / 5, y = .5 + t * (AXY - .5), xo = 6 * (1 - t) + .6 * t; seg(b, [6 - xo, y, z], [6 + xo, y, z], .1, W2, 6); if (k < 4) { const t2 = (k + 1) / 5, y2 = .5 + t2 * (AXY - .5), xo2 = 6 * (1 - t2) + .6 * t2; seg(b, [6 - xo, y, z], [6 + xo2, y2, z], .07, W2, 5); seg(b, [6 + xo, y, z], [6 - xo2, y2, z], .07, W2, 5); } }
      for (let k = 0; k < 20; k++) { const t = k / 20; for (const s of [-1, 1]) bulb(b, 6 + s * (6 * (1 - t) + .6 * t), .5 + t * (AXY - .5), z, k, 1.2); } }
    // la cabine du caissier et la grande enseigne
    b.box(1.6, 2.2, 1.4, RED, 1.2, 1.6, 6.2); b.box(1.8, .12, 1.6, GOLD, 1.2, 2.76, 6.2); lo(b, new THREE.ConeGeometry(1.2, .8, 4), CREAM, 1.2, 3.2, 6.2, 0, PI / 4); b.box(1.1, .7, .05, 0xbfe6fa, 1.2, 1.9, 6.92, 0, 0, 0, 2);
    return ctr(b.done(), 12, 7); };
  O.roue_base = { id: 'roue_base', n: 'Grande roue', model: 'roue_base', v: 0, fp: [12, 7], h: 1.3, fixed: 1, walk: 1 };

  // ================= LE CARROUSEL =================
  const CRR = 6.2, NH = 14;
  MD.carrousel_base = v => { const b = G.mb(7201);
    b.cyl(CRR + .6, CRR + .8, .35, 40, 0xd8cfbd, 6.5, .17, 6.5); for (let k = 0; k < 3; k++) b.box(2, .12, .45, 0xd8cfbd, 6.5, .06 + k * .12, 13.2 - k * .4 + .0);
    b.cyl(.55, .7, 5.2, 20, GOLD, 6.5, 2.9, 6.5); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.5, 4, .05, k % 2 ? 0xf6e7c1 : 0x9fc4dc, 6.5 + Math.cos(a) * .72, 2.6, 6.5 + Math.sin(a) * .72, 0, -a + PI / 2, 0); }
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; b.box(.25, .5, .08, k % 2 ? RED : CREAM, 6.5 + Math.cos(a) * (CRR + .78), .5, 6.5 + Math.sin(a) * (CRR + .78), 0, -a + PI / 2, 0); }
    return ctr(b.done(), 13, 13); };
  O.carrousel_base = { id: 'carrousel_base', n: 'Carrousel', model: 'carrousel_base', v: 0, fp: [13, 13], h: .4, fixed: 1, walk: 1 };
  const carTopGeo = () => { const b = G.mb(7202);
    b.cyl(CRR, CRR, .12, 40, 0xc9a26b, 0, .42, 0); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; b.box(.05, .02, CRR * .9, 0xb08a5c, Math.cos(a) * CRR * .5, .49, Math.sin(a) * CRR * .5, 0, -a + PI / 2, 0); }
    stripes(b, CRR + .3, .6, 2.2, 6.6, 24, RED, CREAM); b.cyl(CRR + .35, CRR + .35, .7, 40, 0xf6e7c1, 0, 5.3, 0); b.cyl(CRR + .37, CRR + .37, .08, 40, GOLD, 0, 5.62, 0); b.cyl(CRR + .37, CRR + .37, .08, 40, GOLD, 0, 4.98, 0); b.cyl(CRR + .4, CRR + .4, .1, 40, RED, 0, 5.62, 0);
    for (let k = 0; k < 24; k++) { const a = (k + .5) / 24 * TAU; lo(b, new THREE.SphereGeometry(.42, 10, 6, 0, TAU, PI / 2, PI / 2), k % 2 ? RED : CREAM, Math.cos(a) * (CRR + .2), 4.95, Math.sin(a) * (CRR + .2)); }
    for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; bulb(b, Math.cos(a) * (CRR + .42), 5.3, Math.sin(a) * (CRR + .42), k, 1.4); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = (CRR + .3) * .55; bulb(b, Math.cos(a) * r, 6.6, Math.sin(a) * r, k + 2, 1.5); }
    lo(b, new THREE.ConeGeometry(.9, 1.2, 16), GOLD, 0, 8.2, 0); b.sph(.25, GOLD, 0, 8.9, 0); b.add(new THREE.PlaneGeometry(.8, .45), RED, b.M(.42, 9.3, 0), 2); b.cyl(.03, .03, 1, 6, GOLD, 0, 9.3, 0);
    // tableaux peints sous le dais (frise)
    for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * TAU, r = 1.45; b.box(1.3, .9, .06, [SKY, PINK, MINT, SUN][k % 4], Math.cos(a) * r, 4.6, Math.sin(a) * r, 0, -a + PI / 2, 0); b.box(1.42, 1.02, .04, GOLD, Math.cos(a) * (r - .02), 4.6, Math.sin(a) * (r - .02), 0, -a + PI / 2, 0); }
    for (let k = 0; k < NH; k++) { const a = k / NH * TAU, r = CRR - 1.1; seg(b, [Math.cos(a) * r, .48, Math.sin(a) * r], [Math.cos(a) * r, 5.0, Math.sin(a) * r], .05, GOLD, 8); for (let j = 0; j < 8; j++) seg(b, [Math.cos(a) * r, .6 + j * .55, Math.sin(a) * r], [Math.cos(a) * r, .85 + j * .55, Math.sin(a) * r], .058, j % 2 ? 0xfff3d6 : GOLD, 8); }
    return b.done(); };
  const horseGeo = k => { const b = G.mb(7210 + k), COL = [WHITE, 0x8a5a3a, 0x2a2a2e, 0xf3d9b0, 0xb9b9c4][k % 5], MANE = [0xd9b84a, 0x2a1a12, 0xf2f2f2, 0x8a5a3a, 0x5a5a66][k % 5], SAD = [RED, NAVY, 0x3f9a59, 0x9b59d0, 0xff9a3c][k % 5];
    b.sph(.32, COL, 0, 0, 0, 1, .85, 1.75); lo(b, new THREE.CylinderGeometry(.13, .2, .62, 10), COL, 0, .35, .52, -.75, 0, 0);
    b.sph(.17, COL, 0, .62, .8, .8, .85, 1.35); b.sph(.1, COL, 0, .55, 1.0); for (const s of [-1, 1]) { lo(b, new THREE.ConeGeometry(.04, .14, 6), COL, s * .07, .82, .74); b.sph(.03, 0x111111, s * .1, .66, .88); }
    for (let j = 0; j < 6; j++) b.sph(.07, MANE, 0, .5 - j * .08 + .2, .62 - j * .1, 1, 1.3, .8);
    for (const [x, z, f] of [[-.15, .38, 1], [.15, .38, -1], [-.15, -.4, -1], [.15, -.4, 1]]) { seg(b, [x, -.15, z], [x, -.45, z + f * .22], .06, COL, 6); seg(b, [x, -.45, z + f * .22], [x, -.72, z + f * .1], .05, COL, 6); b.sph(.055, GOLD, x, -.74, z + f * .1); }
    for (let j = 0; j < 5; j++) b.sph(.07 - j * .007, MANE, 0, .05 - j * .1, -.58 - j * .07);
    b.box(.5, .1, .5, SAD, 0, .29, .02); b.box(.54, .04, .54, GOLD, 0, .25, .02); for (const s of [-1, 1]) { seg(b, [s * .26, .25, .02], [s * .27, -.18, .05], .012, IRON, 4); b.box(.08, .03, .12, GOLD, s * .27, -.2, .05); }
    lo(b, new THREE.TorusGeometry(.1, .025, 5, 10), GOLD, 0, .68, .86, 0, PI / 2, 0);
    return b.done(); };

  // ================= LES CHAISES VOLANTES =================
  const SWR = 4.2, SWL = 3.8, SWY = 8.2, NS = 16, SWX = 22.5, SWZ = 55.5;
  MD.chaises_base = v => { const b = G.mb(7301); b.cyl(1.6, 1.9, .5, 24, 0xd8cfbd, 2.5, .25, 2.5); b.cyl(.55, .7, SWY, 20, MINT, 2.5, SWY / 2, 2.5);
    for (let k = 0; k < 8; k++) b.cyl(.62, .62, .12, 20, GOLD, 2.5, 1 + k * .95, 2.5); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; bulb(b, 2.5 + Math.cos(a) * .66, 3 + (k % 4) * 1.3, 2.5 + Math.sin(a) * .66, k, 1.3); }
    return ctr(b.done(), 5, 5); };
  O.chaises_base = { id: 'chaises_base', n: 'Chaises volantes', model: 'chaises_base', v: 0, fp: [5, 5], h: 6, fixed: 1 };
  const swingTopGeo = () => { const b = G.mb(7302); stripes(b, SWR + 1.1, .7, 1.6, 1.0, 16, SKY, CREAM); b.cyl(SWR + 1.15, SWR + 1.15, .45, 40, 0xf6e7c1, 0, .2, 0); b.cyl(SWR + 1.17, SWR + 1.17, .06, 40, GOLD, 0, .44, 0);
    for (let k = 0; k < 16; k++) { const a = (k + .5) / 16 * TAU; lo(b, new THREE.SphereGeometry(.4, 8, 5, 0, TAU, PI / 2, PI / 2), k % 2 ? SKY : CREAM, Math.cos(a) * (SWR + 1), -.05, Math.sin(a) * (SWR + 1)); }
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; bulb(b, Math.cos(a) * (SWR + 1.2), .2, Math.sin(a) * (SWR + 1.2), k, 1.4); }
    lo(b, new THREE.ConeGeometry(.6, 1, 12), GOLD, 0, 2.2, 0); b.sph(.18, GOLD, 0, 2.8, 0); for (let k = 0; k < NS; k++) { const a = k / NS * TAU; b.box(.1, .1, .1, IRON, Math.cos(a) * SWR, -.05, Math.sin(a) * SWR); }
    return b.done(); };
  const chairGeo = k => { const b = G.mb(7310 + k), c = [RED, SUN, SKY, MINT, PINK, 0xff9a3c][k % 6];
    for (const s of [-1, 1]) seg(b, [s * .25, 0, 0], [s * .25, -SWL + .35, 0], .012, 0xc9c9c9, 4);
    b.box(.55, .08, .5, c, 0, -SWL + .3, 0); b.box(.55, .55, .06, c, 0, -SWL + .58, -.24); b.box(.06, .25, .45, GOLD, -.27, -SWL + .45, 0); b.box(.06, .25, .45, GOLD, .27, -SWL + .45, 0); seg(b, [-.27, -SWL + .55, .22], [.27, -SWL + .55, .22], .02, IRON, 4);
    return b.done(); };

  // ================= LES TASSES =================
  const CUPR = 4.6, NC = 6;
  MD.tasses_base = v => { const b = G.mb(7401); b.cyl(6.3, 6.5, .3, 40, 0xd8cfbd, 6, .15, 6); b.cyl(6.1, 6.1, .06, 40, 0x9fd8f0, 6, .32, 6); for (let k = 0; k < 60; k++) { const a = k / 60 * TAU; b.box(.08, .5, .08, GOLD, 6 + Math.cos(a) * 6.35, .55, 6 + Math.sin(a) * 6.35); } b.tor(6.35, .05, GOLD, 6, .82, 6, PI / 2, 0, 0, 0, 64); return ctr(b.done(), 12, 12); };
  O.tasses_base = { id: 'tasses_base', n: 'Tasses folles', model: 'tasses_base', v: 0, fp: [12, 12], h: .35, fixed: 1, walk: 1 };
  const cupsTopGeo = () => { const b = G.mb(7402); b.cyl(5.8, 5.8, .1, 40, 0xf7d3e5, 0, .42, 0); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(.1, .02, 5.6, k % 2 ? 0xffffff : PINK, Math.cos(a) * 2.8, .48, Math.sin(a) * 2.8, 0, -a + PI / 2, 0); }
    b.cyl(.9, 1.1, .8, 20, GOLD, 0, .85, 0); lo(b, new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, PI / 2), 0xffffff, 0, 1.25, 0, 0, 0, 0, 1, .6, 1); b.cyl(.1, .1, 1.2, 8, GOLD, 0, 2.2, 0); b.sph(.35, PINK, 0, 2.9, 0); b.tor(.25, .06, PINK, .4, 2.9, 0, 0, 0, PI / 2); return b.done(); };
  const cupGeo = k => { const b = G.mb(7410 + k), c = [PINK, SKY, SUN, MINT, 0xc77dff, 0xff9a3c][k % 6];
    b.cyl(1.25, 1.25, .1, 28, 0xffffff, 0, .48, 0); b.tor(1.25, .06, GOLD, 0, .52, 0, PI / 2, 0, 0, 0, 36);
    lo(b, new THREE.CylinderGeometry(1.0, .65, 1.0, 28, 1, true), c, 0, 1.05, 0); lo(b, new THREE.CylinderGeometry(.96, .61, .95, 28, 1, true), 0xffffff, 0, 1.06, 0, 0, 0, 0, -1, 1, 1); b.cyl(.66, .66, .06, 28, 0xffffff, 0, .58, 0);
    b.tor(1.0, .05, GOLD, 0, 1.55, 0, PI / 2, 0, 0, 0, 36); lo(b, new THREE.TorusGeometry(.32, .08, 6, 14, PI * 1.3), c, 1.05, 1.08, 0, 0, 0, -PI * .65);
    for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; b.sph(.08, 0xffffff, Math.cos(a) * .86, 1.15 + (j % 2) * .18, Math.sin(a) * .86); }
    b.cyl(.12, .12, .8, 10, GOLD, 0, .95, 0); lo(b, new THREE.TorusGeometry(.35, .05, 6, 16), 0x8a6a48, 0, 1.35, 0, PI / 2 - .3, 0, 0); b.cyl(.45, .45, .25, 18, c, 0, .75, 0);
    return b.done(); };

  // ================= LES MONTAGNES RUSSES =================
  const CPTS = [[60, 1.3, 70], [66, 1.3, 70], [72, 1.3, 70], [79, 5, 70], [86, 12.5, 70], [91, 15.5, 68.5], [93.5, 12, 63], [90, 2.4, 56], [84, 2.6, 51], [77, 9, 49.5], [70, 3, 50], [63, 6.5, 52.5], [59, 9.5, 58],
    [62, 3.2, 62.5], [70, 5.2, 61.5], [78, 2.8, 59.5], [86, 6.5, 62.5], [88.5, 4, 74], [84, 2.4, 80], [74, 2.2, 81.5], [64, 3, 80.5], [57.5, 2, 76], [57, 1.4, 72]];
  let CURVE = null, LUT = null, TL = 0, S_LIFT0 = 0, S_LIFT1 = 0, S_ST = 0;
  function track() { if (LUT) return; CURVE = new THREE.CatmullRomCurve3(CPTS.map(p => new V3(p[0], p[1], p[2])), true, 'centripetal', .5); const N = 1600, pts = CURVE.getSpacedPoints(N); TL = CURVE.getLength();
    LUT = pts.slice(0, N).map((p, i) => ({ p, t: pts[(i + 1) % N].clone().sub(pts[(i - 1 + N) % N]).normalize() }));
    const near = q => { let bi = 0, bd = 1e9; LUT.forEach((e, i) => { const d = e.p.distanceToSquared(new V3(q[0], q[1], q[2])); if (d < bd) { bd = d; bi = i; } }); return bi / N * TL; };
    S_ST = near(CPTS[2]); S_LIFT0 = near(CPTS[3]) - 3; S_LIFT1 = near(CPTS[5]); }
  const at = s => { const N = LUT.length, f = ((s % TL) + TL) % TL / TL * N, i = Math.floor(f), j = (i + 1) % N, k = f - i; return { p: LUT[i].p.clone().lerp(LUT[j].p, k), t: LUT[i].t.clone().lerp(LUT[j].t, k).normalize() }; };
  const trackGeo = () => { track(); const b = G.mb(7501), N = LUT.length, step = 3, RAIL = 0xe4e8ec, SP = RED, SUP = 0xf2f2f2;
    for (let i = 0; i < N; i += step) { const A = LUT[i], B = LUT[(i + step) % N], sa = A.t.clone().cross(UP).normalize(), sb = B.t.clone().cross(UP).normalize();
      for (const s of [-.42, .42]) seg(b, [A.p.x + sa.x * s, A.p.y, A.p.z + sa.z * s], [B.p.x + sb.x * s, B.p.y, B.p.z + sb.z * s], .05, RAIL, 5);
      seg(b, [A.p.x, A.p.y - .28, A.p.z], [B.p.x, B.p.y - .28, B.p.z], .13, SP, 6);
      if ((i / step) % 2 === 0) { seg(b, [A.p.x - sa.x * .45, A.p.y - .05, A.p.z - sa.z * .45], [A.p.x + sa.x * .45, A.p.y - .05, A.p.z + sa.z * .45], .045, 0x8a6a48, 4); seg(b, [A.p.x - sa.x * .4, A.p.y - .02, A.p.z - sa.z * .4], [A.p.x, A.p.y - .28, A.p.z], .03, SP, 4); seg(b, [A.p.x + sa.x * .4, A.p.y - .02, A.p.z + sa.z * .4], [A.p.x, A.p.y - .28, A.p.z], .03, SP, 4); }
      if ((i / step) % 6 === 0) { bulb(b, A.p.x + sa.x * .55, A.p.y - .2, A.p.z + sa.z * .55, i, 1.3); bulb(b, A.p.x - sa.x * .55, A.p.y - .2, A.p.z - sa.z * .55, i + 3, 1.3); }
      if ((i / step) % 9 === 0 && A.p.y > 1.6) { const y0 = A.p.y - .35; seg(b, [A.p.x, 0, A.p.z], [A.p.x, y0, A.p.z], .14, SUP, 8); b.cyl(.3, .36, .3, 10, 0xd8cfbd, A.p.x, .15, A.p.z);
        if (y0 > 5) { for (const s of [-1, 1]) seg(b, [A.p.x + sa.x * s * 1.6, 0, A.p.z + sa.z * s * 1.6], [A.p.x, y0 * .6, A.p.z], .08, SUP, 6); for (let y = 2.5; y < y0; y += 2.5) seg(b, [A.p.x - sa.x * .9, y, A.p.z - sa.z * .9], [A.p.x + sa.x * .9, y, A.p.z + sa.z * .9], .05, SUP, 4); } } }
    // la chaîne de la montée
    for (let s = S_LIFT0; s < S_LIFT1; s += .35) { const q = at(s); b.box(.12, .05, .2, 0x55595e, q.p.x, q.p.y - .08, q.p.z); }
    return b.done(); };
  MD.gare_rm = v => { const b = G.mb(7502); b.box(14, .9, 2.3, 0xd8cfbd, 7, .45, 1.15); b.box(14, .06, 2.1, 0xc9a26b, 7, .93, 1.15); b.box(14, .3, 2, 0xb9b0a0, 7, .15, 3.3);
    for (let k = 0; k < 3; k++) b.box(1.6, .9 - k * .3, .35, 0xd8cfbd, 2 + 0, (.9 - k * .3) / 2, -.17 - k * .35 + .0);
    for (const x of [.4, 4.6, 9.4, 13.6]) for (const z of [.3, 4.1]) { b.cyl(.14, .14, 4.2, 10, WHITE, x, 3, z); bulb(b, x, 4.9, z, x | 0, 1.6); }
    b.box(14.6, .25, 5, RED, 7, 5.2, 2.2); for (let k = 0; k < 28; k++) b.box(.5, .4, .08, k % 2 ? RED : CREAM, -.12 + k * .53, 4.92, 4.72);
    lo(b, new THREE.CylinderGeometry(.01, 3.2, 1.6, 4, 1), RED, 7, 6.1, 2.2, 0, PI / 4, 0, 1.6, 1, .5); b.box(6, 1.1, .12, NAVY, 7, 5.9, 4.8); b.box(6.2, .1, .14, GOLD, 7, 6.47, 4.8); b.box(6.2, .1, .14, GOLD, 7, 5.33, 4.8);
    for (let x = .5; x < 14; x += .6) b.box(.05, .65, .05, GOLD, x, 1.25, 2.25); b.box(14, .05, .05, GOLD, 7, 1.55, 2.25);
    return ctr(b.done(), 14, 5); };
  O.gare_rm = { id: 'gare_rm', n: 'Montagnes russes', model: 'gare_rm', v: 0, fp: [14, 5], h: .9, fixed: 1, walk: 1 };
  const carGeo = k => { const b = G.mb(7510 + k), c = [RED, NAVY, SUN][k % 3];
    for (const x of [-.47, .47]) b.box(.1, .45, 1.5, c, x, .35, 0); b.box(1.05, .2, 1.5, c, 0, .22, 0); b.box(1.05, .45, .1, c, 0, .35, .7); for (const x of [-.52, .52]) b.box(.08, .07, 1.55, 0xf2f2f2, x, .6, 0); for (const z of [-.75, .75]) b.box(1.1, .07, .08, 0xf2f2f2, 0, .6, z); b.box(.9, .45, .22, c, 0, .82, -.62); b.box(.8, .1, .9, 0x7a1d24, 0, .5, -.1); b.box(.8, .35, .1, 0x7a1d24, 0, .75, -.5);
    if (k === 0) { lo(b, new THREE.SphereGeometry(.55, 12, 6, 0, TAU, 0, PI / 2), c, 0, .45, .75, PI / 2, 0, 0, 1, .7, 1); b.sph(.12, BULBS[1], -.3, .55, .98, 1, 1, 1, 1); b.sph(.12, BULBS[1], .3, .55, .98, 1, 1, 1, 1); }
    for (const x of [-.45, .45]) for (const z of [-.5, .5]) b.cyl(.13, .13, .12, 10, IRON, x, .08, z, 0, 0, PI / 2);
    seg(b, [-.4, .95, -.05], [.4, .95, -.05], .04, GOLD, 5); return b.done(); };

  // ================= STANDS, PORTIQUE, DÉCOR =================
  const STANDS = [['Barbe à papa', PINK, CREAM], ['Glaces', SKY, CREAM], ['Chamboule-tout', RED, SUN], ['Pêche aux canards', MINT, CREAM], ['Gaufres et churros', 0xff9a3c, CREAM], ['Ballons', 0xc77dff, CREAM]];
  MD.stand_fete = v => { const b = G.mb(7600 + v), [, c1, c2] = STANDS[v % 6], WOOD = 0xc9a26b;
    b.box(3, .9, 1.6, c1, 1.5, .45, .8); b.box(3.1, .08, 1.7, WOOD, 1.5, .94, .85); b.box(3, 1.8, .1, CREAM, 1.5, 1.85, .05);
    for (const x of [.08, 2.92]) for (const z of [.08, 1.55]) b.cyl(.05, .05, 2.6, 8, WHITE, x, 1.3, z);
    for (let k = 0; k < 10; k++) { b.add(new THREE.PlaneGeometry(.31, 1.9), k % 2 ? c1 : c2, b.M(.15 + k * .3, 2.75, 1.05, -.62, 0, 0), 2); lo(b, new THREE.SphereGeometry(.16, 8, 4, 0, TAU, PI / 2, PI / 2), k % 2 ? c1 : c2, .15 + k * .3, 2.22, 1.82); }
    b.box(2.4, .55, .08, c1, 1.5, 3.55, .2); b.box(2.5, .07, .1, GOLD, 1.5, 3.84, .2); b.box(2.5, .07, .1, GOLD, 1.5, 3.27, .2); for (let k = 0; k < 8; k++) bulb(b, .35 + k * .33, 3.92, .26, k + v);
    const k = v % 6;
    if (k === 0) for (let j = 0; j < 7; j++) { b.cyl(.012, .012, .5, 4, WHITE, .5 + j * .33, 1.2, .5); b.sph(.17, [PINK, 0xc8f0ff, 0xfff0a8][j % 3], .5 + j * .33, 1.55, .5, 1, 1.2, 1); }
    if (k === 1) for (let j = 0; j < 6; j++) { lo(b, new THREE.ConeGeometry(.08, .28, 8), 0xd9a45a, .55 + j * .38, 1.15, .6, PI); b.sph(.1, [0xfff3d6, PINK, 0x8a5a3a, MINT][j % 4], .55 + j * .38, 1.33, .6); }
    if (k === 2) { for (let r = 0; r < 4; r++) for (let j = 0; j <= 3 - r; j++) b.cyl(.1, .1, .22, 10, [RED, SUN, SKY][(r + j) % 3], 1.5 - (3 - r) * .11 + j * .22, 1.1 + r * .22, .55); for (let j = 0; j < 3; j++) b.sph(.12, 0xf2f2f2, .4 + j * .25, 1.05, 1.2); }
    if (k === 3) { b.box(2.5, .3, 1.1, 0x8fd3f0, 1.5, 1.1, .7, 0, 0, 0, 2); for (let j = 0; j < 8; j++) { const x = .5 + (j % 4) * .6, z = .45 + Math.floor(j / 4) * .45; b.sph(.1, SUN, x, 1.3, z, 1, .8, 1.2); b.sph(.06, SUN, x, 1.42, z + .09); b.box(.04, .03, .05, 0xff9a3c, x, 1.42, z + .17); } }
    if (k === 4) for (let j = 0; j < 5; j++) { b.box(.4, .06, .4, 0xd9a45a, .6 + j * .45, 1.0, .55); for (let q = 0; q < 3; q++) b.box(.36, .015, .04, 0xb07a3a, .6 + j * .45, 1.04, .44 + q * .11); }
    if (k === 5) for (let j = 0; j < 9; j++) { const x = .6 + (j % 5) * .45, y = 2.4 + Math.floor(j / 5) * .5; seg(b, [1.5, 1, 1.1], [x, y, 1.25], .006, WHITE, 3); b.sph(.22, [RED, SKY, SUN, MINT, PINK, 0xc77dff][j % 6], x, y + .2, 1.25, 1, 1.2, 1); }
    return ctr(b.done(), 3, 2); };
  O.stand_fete = { id: 'stand_fete', n: 'Stand de fête', model: 'stand_fete', v: 0, fp: [3, 2], h: 2.2, fixed: 1, fete: 1 };
  MD.portique_parc = v => { const b = G.mb(7700), ST = 0xf3ead6, W2 = 12;
    for (const s of [-1, 1]) { const x = W2 / 2 + s * 5.2; b.P(G.PAT && G.PAT.pierre || 0); b.box(2, 6, 2, ST, x, 3, .5); b.P(0); b.box(2.3, .4, 2.3, GOLD, x, 6.2, .5); lo(b, new THREE.SphereGeometry(1.15, 18, 10, 0, TAU, 0, PI / 2), RED, x, 6.4, .5); b.cyl(.06, .06, 1.2, 6, GOLD, x, 7.9, .5); b.add(new THREE.PlaneGeometry(.8, .45), SUN, b.M(x + .4, 8.2, .5), 2);
      for (let k = 0; k < 12; k++) bulb(b, x - 1.02, .5 + k * .48, 1.52, k, 1.4), bulb(b, x + 1.02, .5 + k * .48, 1.52, k + 2, 1.4); }
    for (let k = 0; k <= 30; k++) { const a = PI * k / 30, x = W2 / 2 + Math.cos(a) * 4.2, y = 6 + Math.sin(a) * 2.2; b.box(.7, .5, .9, k % 2 ? RED : CREAM, x, y, .5, 0, 0, a - PI / 2); bulb(b, W2 / 2 + Math.cos(a) * 4.62, 6 + Math.sin(a) * 2.62, .98, k, 1.5); }
    b.box(7, 1.3, .2, NAVY, W2 / 2, 8.6, .9); b.box(7.2, .12, .24, GOLD, W2 / 2, 9.3, .9); b.box(7.2, .12, .24, GOLD, W2 / 2, 7.9, .9); for (let k = 0; k < 18; k++) bulb(b, W2 / 2 - 3.4 + k * .4, 9.45, .95, k, 1.3);
    lo(b, new THREE.CircleGeometry(1, 24), SUN, W2 / 2, 9.9, .9); for (let k = 0; k < 12; k++) { const a = k / 12 * PI; b.box(.12, .9, .05, SUN, W2 / 2 + Math.cos(a) * 1.45, 9.9 + Math.sin(a) * 1.45, .88, 0, 0, a - PI / 2); }
    return ctr(b.done(), 12, 1); };
  O.portique_parc = { id: 'portique_parc', n: 'Portique du parc', model: 'portique_parc', v: 0, fp: [12, 1], h: 0, walk: 1, fixed: 1 };
  // la grande porte du parc, au bout du boulevard de la rue commerçante (8 × 3, façade +z)
  MD.porte_parc = v => { const b = G.mb(7800), ST = 0xf3ead6, ST2 = 0xd8cfbd;
    b.P(G.PAT && G.PAT.pierre || 0); for (const x of [0, 6]) b.box(2, 7.5, 3, ST, x + 1, 3.75, 1.5); b.box(8, 2.2, 3, ST, 4, 8.6, 1.5); b.P(0);
    for (const x of [1, 7]) { lo(b, new THREE.SphereGeometry(1.15, 18, 10, 0, TAU, 0, PI / 2), RED, x, 9.7, 1.5); b.cyl(.05, .05, 1.2, 6, GOLD, x, 11.3, 1.5); b.add(new THREE.PlaneGeometry(.7, .4), SUN, b.M(x + .35, 11.6, 1.5), 2); b.box(2.2, .3, 3.2, GOLD, x, 7.6, 1.5); }
    for (let k = 0; k <= 20; k++) { const a = PI * k / 20; b.box(.55, .5, 3.05, k % 2 ? RED : CREAM, 4 + Math.cos(a) * 2.1, 5.5 + Math.sin(a) * 1.8, 1.5, 0, 0, a - PI / 2); bulb(b, 4 + Math.cos(a) * 2.45, 5.5 + Math.sin(a) * 2.15, 3.05, k, 1.5); }
    for (let k = 0; k < 14; k++) for (const x of [2.05, 5.95]) bulb(b, x, .4 + k * .38, 3.05, k, 1.4);
    b.box(6.8, 1.3, .15, NAVY, 4, 8.6, 3.05); b.box(7, .1, .2, GOLD, 4, 9.3, 3.05); b.box(7, .1, .2, GOLD, 4, 7.9, 3.05); for (let k = 0; k < 16; k++) bulb(b, .7 + k * .44, 9.42, 3.1, k, 1.3);
    // dans l'arche : la lueur du parc, des fanions et un sol de dalles
    b.box(4.2, 5.5, .1, 0xffe9b8, 4, 2.75, .05, 0, 0, 0, 1); b.box(4.2, .05, 3, 0xe6e1d6, 4, .03, 1.5);
    for (let k = 0; k < 9; k++) lo(b, new THREE.ConeGeometry(.12, .3, 3), [RED, SUN, SKY, MINT, PINK][k % 5], 2.3 + k * .43, 4.5 - Math.sin(k / 8 * PI) * .25, 2.4, PI);
    return ctr(b.done(), 8, 3); };
  O.porte_parc = { id: 'porte_parc', n: 'Entrée du Parc des Merveilles', model: 'porte_parc', v: 0, fp: [8, 3], h: 0, walk: 1, fixed: 1 };
  MD.borne_parc = () => { const b = G.mb(7801); b.box(.02, .02, .02, 0xf3ead6, 0, -.5, 0); return b.done(); };
  O.borne_parc = { id: 'borne_parc', n: 'Pilier', model: 'borne_parc', v: 0, fp: [1, 1], h: 6, fixed: 1 };

  // ================= LE PARC =================
  const RIDES = {}; // positions des manèges (centre, point d'embarquement)
  G.genParc = () => {
    track(); const m = new G.GMap(W, H, { kind: 'parc', id: 'parc' }), I = (x, z) => z * W + x, r = G.rng(777), force = (t, x, z, rot = 0, ex) => m.addObj(t, x, z, rot, ex), put = (t, x, z, rot = 0, ex) => m.canPlace(t, x, z, rot) ? m.addObj(t, x, z, rot, ex) : null;
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { let s = G.hash2(x, z, 5) < .25 ? 14 : 0;
      if (x >= AV[0] && x <= AV[1] && z >= 4) s = 11; if (z >= CR[0] && z <= CR[1] && x >= 4 && x < W - 4) s = 11; if ((x === AV[0] || x === AV[1]) && z >= 4 && !(z >= CR[0] && z <= CR[1])) s = 9; if ((z === CR[0] || z === CR[1]) && x >= 4 && x < W - 4 && !(x >= AV[0] && x <= AV[1])) s = 9;
      if (x < 3 || z < 3 || x >= W - 3 || z >= H - 3) { m.lvl[I(x, z)] = 3; s = 1; } // le parc est bordé de collines boisées (à la hauteur du pays alentour)
      m.surf[I(x, z)] = s; }
    const pave = (x0, z0, w, h, s = 15) => { for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) if (m.inb(x, z)) m.surf[I(x, z)] = s; };
    // la place centrale et sa fontaine
    pave(38, 22, 24, 13, 11); force('grande_fontaine', 47, 25, 0);
    // la grande roue (nord-ouest)
    pave(10, 9, 28, 22); force('roue_base', 18, 16, 0); RIDES.roue = { cx: 24, cz: 19.5, bx: 24, bz: 23.6 };
    // le carrousel (nord-est)
    pave(66, 9, 22, 22); force('carrousel_base', 70, 13, 0); RIDES.carrousel = { cx: 76.5, cz: 19.5, bx: 76.5, bz: 26.8 };
    // les chaises volantes et les tasses (sud-ouest)
    pave(12, 46, 21, 19); force('chaises_base', 20, 53, 0); RIDES.chaises = { cx: SWX, cz: SWZ, bx: SWX, bz: SWZ + 7.2 };
    pave(14, 68, 20, 17); force('tasses_base', 18, 70, 0); RIDES.tasses = { cx: 24, cz: 76, bx: 24, bz: 83 };
    // les montagnes russes (sud-est) : la gare, puis les rails au-dessus des allées
    pave(56, 66, 18, 8); force('gare_rm', 58, 67, 0); RIDES.rm = { bx: 66, bz: 72.6 };
    // les stands le long de la grande allée
    [[40, 48, 1], [40, 55, 1], [40, 62, 1], [55, 48, 3], [55, 55, 3], [40, 75, 1]].forEach(([x, z, rot], k) => force('stand_fete', x + (rot === 1 ? 2 : 0), z, rot, { v: k }));
    // le portique d'entrée, au sud
    force('portique_parc', 43, 86, 0);
    // bancs, lampadaires, arbres, massifs
    for (let z = 8; z < H - 6; z += 6) { if (z >= CR[0] - 1 && z <= CR[1] + 1) continue; put('lampadaire', AV[0] - 1, z); put('lampadaire', AV[1] + 1, z); }
    for (let x = 8; x < W - 8; x += 7) { if (x >= AV[0] - 1 && x <= AV[1] + 1) continue; put('lampadaire', x, CR[0] - 1); put('lampadaire', x, CR[1] + 1); }
    for (const [x, z, rot] of [[44, 30, 1], [55, 30, 3], [44, 66, 1], [55, 64, 3], [30, 36, 2], [68, 36, 2], [30, 43, 0], [68, 43, 0]]) put('banc_parc', x, z, rot);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if ((x < 3 || z < 3 || x >= W - 3 || z >= H - 3) && r() < .42) put(G.pick(['sapin', 'chene', 'cerisier', 'sapin', 'bouleau'], r), x, z);
    for (let x = 3; x < W - 3; x++) for (const z of [3, H - 4]) if (Math.abs(x + .5 - 49.5) > 8 && r() < .5) put(G.pick(['cerisier', 'buisson', 'hortensia', 'platane'], r), x, z);
    for (let z = 4; z < H - 4; z++) for (const x of [3, W - 4]) if (r() < .45) put(G.pick(['cerisier', 'buisson', 'hortensia', 'platane'], r), x, z);
    const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
    for (let k = 0; k < 340; k++) { const x = 4 + Math.floor(r() * (W - 8)), z = 4 + Math.floor(r() * (H - 8)), s = m.surf[I(x, z)]; if (s !== 0 && s !== 14) continue; if (r() < .4 && !(x >= 55 && z >= 45)) put(G.pick(['cerisier', 'platane', 'buisson', 'hortensia'], r), x, z); else put((r() < .5 ? 'tulipe_' : 'fleur_') + FL[Math.floor(r() * 7)], x, z); }
    const NV = (G.VILLAGERS && G.VILLAGERS.length) || 4;
    m.meta = { parc: true, spawn: { x: 49.5, z: H - 5.6 }, exitZ: H - 3.55, seaZ: H + 1000, plaza: { x: 49.5, z: 36 }, title: 'Parc des Merveilles',
      homes: [{ vi: 1 % NV, x: 30, z: 40 }, { vi: 3 % NV, x: 70, z: 40 }, { vi: 5 % NV, x: 50, z: 60 }, { vi: 6 % NV, x: 50, z: 18 }],
      npcs: [{ role: 'forain', x: 52.5, z: H - 7.5, yaw: PI }] };
    // les manèges qui bougent (dans le groupe de la carte : cachés quand on n'y est pas)
    const A = m.anim = {}, g = m.group;
    // grande roue
    A.wheel = new THREE.Group(); A.wheel.position.set(24, AXY, 19.5); g.add(A.wheel); mk(wheelGeo(), A.wheel);
    const gGeo = GCOL.map(c => gondolaGeo(c)); A.gond = []; for (let k = 0; k < NG; k++) A.gond.push(mk(gGeo[k % GCOL.length], g));
    // carrousel
    A.car = new THREE.Group(); A.car.position.set(76.5, .35, 19.5); g.add(A.car); mk(carTopGeo(), A.car); A.horses = [];
    for (let k = 0; k < NH; k++) { const hm = mk(horseGeo(k), A.car), a = k / NH * TAU, rr = CRR - 1.1; hm.userData = { a, rr, ph: k * 1.7 }; hm.position.set(Math.cos(a) * rr, 1.8, Math.sin(a) * rr); hm.rotation.y = -a + PI; A.horses.push(hm); }
    // chaises volantes
    A.sw = new THREE.Group(); A.sw.position.set(SWX, SWY, SWZ); g.add(A.sw); mk(swingTopGeo(), A.sw); A.chairs = [];
    for (let k = 0; k < NS; k++) { const c = mk(chairGeo(k), g); c.userData = { a: k / NS * TAU }; A.chairs.push(c); }
    A.swT = 0;
    // tasses
    A.cups = new THREE.Group(); A.cups.position.set(24, 0, 76); g.add(A.cups); mk(cupsTopGeo(), A.cups); A.cupM = [];
    for (let k = 0; k < NC; k++) { const c = new THREE.Group(), a = k / NC * TAU; c.position.set(Math.cos(a) * CUPR, 0, Math.sin(a) * CUPR); A.cups.add(c); mk(cupGeo(k), c); A.cupM.push(c); }
    // montagnes russes
    mk(trackGeo(), g); A.train = [0, 1, 2].map(k => mk(carGeo(k), g)); A.rm = { s: S_ST, v: 0, wait: 3, rider: false };
    // guirlandes au-dessus de la grande allée et de l'allée transversale
    const gb = G.mb(7900); for (let z = 8; z < H - 6; z += 6) { if (z >= CR[0] - 2 && z <= CR[1] + 2) continue; const A0 = [AV[0] - .5, 3.6, z + .5], B0 = [AV[1] + 1.5, 3.6, z + .5], n = 14; let last = null;
      for (let i = 0; i <= n; i++) { const t = i / n, p = [A0[0] + (B0[0] - A0[0]) * t, A0[1] - Math.sin(t * PI) * .6, A0[2]]; if (last) seg(gb, last, p, .01, IRON, 3); if (i && i < n) bulb(gb, p[0], p[1] - .08, p[2], i + z, 1.3); last = p; } }
    for (let x = 8; x < W - 8; x += 7) { if (x >= AV[0] - 1 && x <= AV[1] + 1) continue; const A0 = [x + .5, 3.6, CR[0] - .6], B0 = [x + .5, 3.6, CR[1] + 1.6], n = 10; let last = null;
      for (let i = 0; i <= n; i++) { const t = i / n, p = [A0[0], A0[1] - Math.sin(t * PI) * .5, A0[2] + (B0[2] - A0[2]) * t]; if (last) seg(gb, last, p, .01, IRON, 3); if (i && i < n) bulb(gb, p[0], p[1] - .08, p[2], i + x, 1.3); last = p; } }
    mk(gb.done(), g);
    G.mapLabel(m, '🎡 Grande roue', 24, 3.4, 26.4, 1.05); G.mapLabel(m, '🎠 Carrousel', 76.5, 3.2, 27.6, 1.05); G.mapLabel(m, '🎢 Montagnes russes', 66, 7.2, 72.2, 1.1);
    G.mapLabel(m, '🪂 Chaises volantes', 23, 3, 61.5, 1); G.mapLabel(m, '☕ Tasses folles', 24, 2.6, 83.4, 1); G.mapLabel(m, '🎪 Parc des Merveilles', 49.5, 10.6, 86.6, 1.4);
    STANDS.forEach(([n], k) => { const p = [[42, 49.8], [42, 56.8], [42, 63.8], [56, 49.8], [56, 56.8], [42, 76.8]][k]; G.mapLabel(m, n, p[0] + .5 + (k >= 3 && k < 5 ? .5 : 0), 4.3, p[1], .8); });
    return m;
  };

  // ---------- l'animation des manèges ----------
  const SWING = { up: 6, hold: 22, down: 6, rest: 7 }, SWC = SWING.up + SWING.hold + SWING.down + SWING.rest;
  const swOmega = t => { const c = t % SWC; return c < SWING.up ? c / SWING.up * 1.25 : c < SWING.up + SWING.hold ? 1.25 : c < SWING.up + SWING.hold + SWING.down ? (1 - (c - SWING.up - SWING.hold) / SWING.down) * 1.25 : 0; };
  function animate(m, dt) {
    const A = m.anim; if (!A) return; const t = performance.now() / 1000;
    // grande roue : un tour en 70 secondes ; les nacelles restent droites
    A.wheel.rotation.z -= dt * TAU / 70; const wr = A.wheel.rotation.z;
    A.gond.forEach((gm, k) => { const a = k / NG * TAU + wr; gm.position.set(24 + Math.cos(a) * RW, AXY + Math.sin(a) * RW, 19.5); gm.rotation.set(0, 0, Math.sin(t * .8 + k) * .04); });
    // carrousel
    A.car.rotation.y += dt * .42; A.horses.forEach(hm => { hm.position.y = 1.75 + Math.sin(t * 2.2 + hm.userData.ph) * .32; hm.rotation.x = Math.sin(t * 2.2 + hm.userData.ph + 1) * .08; });
    // chaises volantes : elles s'envolent en tournant
    A.swT += dt; const om = swOmega(A.swT); A.swA = (A.swA || 0) + om * dt; A.sw.rotation.y = -A.swA; const th = Math.atan(om * om * (SWR + 1.5) / 9.8) * .95;
    A.chairs.forEach(c => { const a = c.userData.a + A.swA; c.position.set(SWX + Math.cos(a) * SWR, SWY - .05, SWZ + Math.sin(a) * SWR); c.rotation.order = 'YXZ'; c.rotation.set(-th, PI / 2 - a, 0); c.userData.th = th; c.userData.aa = a; });
    // tasses : le plateau tourne doucement, chaque tasse tourne vite sur elle-même
    A.cups.rotation.y += dt * .45; A.cupM.forEach((c, k) => c.rotation.y += dt * (1.6 + k * .25) * (k % 2 ? 1 : -1));
    // montagnes russes : le train fait le tour, s'arrête à la gare, la chaîne le remonte
    const R = A.rm; if (R.wait > 0) { R.wait -= dt; R.v = 0; }
    else { const s = ((R.s % TL) + TL) % TL, lift = s >= S_LIFT0 && s < S_LIFT1, y = at(s).p.y, top = at(S_LIFT1).p.y + .2;
      if (lift || (s >= S_ST - 1 && s < S_LIFT1)) R.v += (3 - R.v) * Math.min(1, dt * 2); else R.v = Math.max(2.5, Math.sqrt(Math.max(0, 9 + 2 * 9.8 * (top - y))) * .93);
      const toSt = ((S_ST - s) % TL + TL) % TL; if (toSt < 25 && R.lap) R.v = Math.max(.6, Math.min(R.v, 1 + toSt * .6)); R.s += R.v * dt; if (s > S_LIFT1 + 4) R.lap = 1;
      if (R.lap && toSt < .25) { R.s = S_ST; R.lap = 0; R.wait = 5; if (R.rider) R.done = 1; } }
    A.train.forEach((cm, k) => { const q = at(R.s - k * 1.75); cm.position.copy(q.p); cm.lookAt(q.p.x + q.t.x, q.p.y + q.t.y, q.p.z + q.t.z); });
  }
  G.on('update', dt => { const m = G.parcMap; if (!m || (G.map !== m)) return; animate(m, Math.min(dt || 0, .1)); });

  // ---------- la carte du parc, l'entrée, la sortie ----------
  const P = G.parc = {
    get() { if (!G.parcMap) { const m = G.parcMap = G.genParc(); G.scene.add(m.group); m.buildAll(); m.group.visible = false; G.ents.spawnVillagers(m); m.objr.setOutlines(G.settings.outlines === 'tout' && G.settings.quality !== 'low'); } return G.parcMap; },
    go(x, z, yaw, instant) { const m = P.get(), s = m.meta.spawn, f = () => { G.enterMap(m, x != null ? x : s.x, z != null ? z : s.z, yaw != null ? yaw : PI); if (!G.flags.parc) { G.flags.parc = 1; setTimeout(() => G.ui.toast('🎡 Bienvenue au Parc des Merveilles ! Approche-toi d\'un manège et appuie sur E pour monter.', 7000), 600); } };
      if (instant) return f(); G.sfx('door'); G.ui.fade(f, .45); },
    back() { const r = G.rue.get(), g = r.meta.parcGate || { x: r.W - 5, z: 10 }; G.sfx('door'); G.ui.fade(() => G.enterMap(r, g.x, g.z, -PI / 2), .45); },
    leave() { const p = G.player; if (p && p.vehicle && p.vehicle.ride) leave(p); },
    reset() { if (G.parcMap) { G.scene.remove(G.parcMap.group); G.ents.removeNPCs && G.ents.removeNPCs(G.parcMap); for (const v of G.ents.villagers.slice()) if (v.map === G.parcMap) { G.scene.remove(v.root); G.scene.remove(v.blob); G.ents.villagers.splice(G.ents.villagers.indexOf(v), 1); } } G.parcMap = null; }
  };
  // dans la rue : la porte du parc au bout du boulevard (à l'est), et la grande roue qui dépasse des toits
  const ogr = G.genRue; G.genRue = () => { const m = ogr(); try {
      const x0 = m.W - 3; for (const o of [...m.list]) { const [w, d] = G.fpDims(G.OBJ[o.t], o.r || 0); if ((o.x + w > x0 && o.z + d > 5 && o.z < 14) || (o.x >= x0 - 8 && o.z >= 7 && o.z <= 13 && ['platane', 'banc_fer', 'candelabre'].includes(o.t))) m.removeObj(o); }
      // l'enseigne peinte au-dessus de l'arche
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 30, 0, 160);
      gr.addColorStop(0, '#fff3c0'); gr.addColorStop(.6, '#ffd23f'); gr.addColorStop(1, '#d99a1a'); c.fillStyle = '#2f4a8a'; c.fillRect(0, 0, 1024, 192); c.strokeStyle = '#d9b84a'; c.lineWidth = 8; c.strokeRect(8, 8, 1008, 176);
      c.font = '700 96px Fredoka, "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#7a1d24'; c.strokeText('PARC DES MERVEILLES', 512, 100); c.fillStyle = gr; c.fillText('PARC DES MERVEILLES', 512, 100);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sign.position.set(x0 - .14, 8.6, 10); sign.rotation.y = -PI / 2; m.group.add(sign);
      m.addObj('porte_parc', x0, 6, 3); for (const z of [6, 7, 8, 11, 12, 13]) for (let x = x0; x < m.W; x++) m.addObj('borne_parc', x, z, 0);
      m.meta.parcGate = { x: x0 - 1.2, z: 10, x1: x0 + .2 };
      G.mapLabel(m, '🎡 Parc des Merveilles', x0 - .3, 9.8, 10, 1.3);
      const wg = new THREE.Group(); wg.position.set(m.W + 22, AXY + 2, 10); wg.rotation.y = PI / 2 - .5; m.group.add(wg); mk(wheelGeo(), wg); m.parcWheel = wg;
    } catch (e) { console.error('porte du parc', e); } return m; };
  G.on('update', dt => { const m = G.rueMap; if (m && m.parcWheel && G.map === m) m.parcWheel.children[0].rotation.z -= (dt || 0) * TAU / 70; });
  G.on('move', (p, m) => {
    if (G.ui.fading || p.vehicle || G.state !== 'play') return;
    if (m === G.rueMap && m.meta.parcGate) { const g = m.meta.parcGate; if (p.x > g.x1 && Math.abs(p.z - g.z) < 1.9) P.go(); }
    else if (m === G.parcMap && p.z > m.meta.exitZ && Math.abs(p.x - 49.5) < 4) P.back();
  });
  // sauvegarder dans le parc : on y revient au chargement
  G.on('save', mods => { if (G.map && G.map === G.parcMap) { const p = G.player; mods.parc = { x: p.x, z: p.z, yaw: p.yaw }; } });
  let loadP = null; G.on('init', () => { const or = G.restore; G.restore = d => { loadP = d.mods && d.mods.parc || null; return or(d); }; });
  G.on('load', () => { P.reset(); const s = loadP; loadP = null; if (s) P.go(s.x, s.z, s.yaw, true); });

  // ---------- Gaspard, le forain ----------
  G.NPCS.forain = { n: 'Gaspard', sp: 'forain', col: 0xc0503c, shirt: 0xd8343a, pants: 0x2f4a8a, neckwear: 0xffd23f, eyeCol: 0x5a3a22, pitch: .95 };
  G.npcRoles.forain = v => G.npcSay(v, ['Approchez, approchez ! Bienvenue au Parc des Merveilles, ' + G.playerName + ' !', 'La grande roue, le carrousel, les montagnes russes, les chaises volantes, les tasses folles… et les stands !',
    surv() ? 'Chaque tour de manège coûte ' + PRICE + ' clochettes. Approche-toi d\'un manège et appuie sur E.' : 'Aujourd\'hui, tout est gratuit ! Approche-toi d\'un manège et appuie sur E.'], ['Merci !']);

  // ---------- monter dans les manèges ----------
  const NAMES = { roue: '🎡 Grande roue', carrousel: '🎠 Carrousel', chaises: '🪂 Chaises volantes', tasses: '☕ Tasses folles', rm: '🎢 Montagnes russes' };
  const nearRide = () => { const m = G.parcMap, p = G.player; if (!m || G.map !== m || p.vehicle) return null; let best = null; for (const k in RIDES) { const R = RIDES[k], d = Math.hypot(R.bx - p.x, R.bz - p.z); if (d < 3.2 && (!best || d < best[0])) best = [d, k]; } return best && best[1]; };
  const pay = () => { if (!surv()) return true; if (G.coins < PRICE) { G.sfx('error'); G.ui.toast('Il faut ' + PRICE + ' clochettes pour un tour de manège.'); return false; } G.coins -= PRICE; G.ui.dirtyHud(); G.sfx('coin'); return true; };
  function board(k) { const m = G.parcMap, A = m.anim, p = G.player; if (!pay()) return;
    const v = p.vehicle = { ride: k, o: { t: 'ride' }, mesh: null, t: 0, back: { x: p.x, z: p.z, yaw: p.yaw } };
    if (k === 'roue') v.i = (() => { let bi = 0, by = 1e9; A.gond.forEach((g, i) => { if (g.position.y < by) { by = g.position.y; bi = i; } }); return bi; })();
    if (k === 'carrousel') { let bi = 0, bd = 1e9; A.horses.forEach((h, i) => { const w = h.getWorldPosition(new V3()), d = Math.hypot(w.x - p.x, w.z - p.z); if (d < bd) { bd = d; bi = i; } }); v.i = bi; v.end = 45; }
    if (k === 'chaises') { const c = A.swT % SWC; if (c < SWC - SWING.rest) A.swT += SWC - c; A.swT -= 1.5; v.i = Math.floor(Math.random() * NS); v.end = SWC - SWING.rest + 1.2; }
    if (k === 'tasses') { v.i = Math.floor(Math.random() * NC); v.end = 40; }
    if (k === 'rm') { A.rm.s = S_ST; A.rm.v = 0; A.rm.wait = 1.2; A.rm.lap = 0; A.rm.rider = true; A.rm.done = 0; }
    if (k === 'roue') v.end = 70;
    G.sfx('fanfare'); G.ui.toast(NAMES[k] + ' : c\'est parti ! (E pour descendre)', 4000); }
  function leave(p) { const v = p.vehicle, b = v.back, m = G.parcMap; p.vehicle = null; if (m && m.anim) m.anim.rm.rider = false; G.clearPose && G.clearPose(p.C); p.teleport(b.x, b.z, b.yaw); G.sfx('land'); }
  const SEAT = new V3();
  function rideTick(p, dt) {
    const v = p.vehicle, m = G.parcMap, A = m && m.anim; if (!A || G.map !== m) { p.vehicle = null; return; } v.t += dt; const I = G.input;
    if (G.ui.canPlay() && I.hit('KeyE') && v.t > .5) return leave(p);
    let yaw = p.yaw, pose = 'chaise', armsUp = false;
    if (v.ride === 'roue') { const g = A.gond[v.i]; SEAT.set(g.position.x, g.position.y - 2.1, g.position.z + .3); yaw = PI; if (v.t > v.end) return leave(p); }
    else if (v.ride === 'carrousel') { const h = A.horses[v.i]; h.getWorldPosition(SEAT); SEAT.y += .38; yaw = new THREE.Euler().setFromQuaternion(h.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y; pose = 'cheval'; if (v.t > v.end) return leave(p); }
    else if (v.ride === 'chaises') { const c = A.chairs[v.i], th = c.userData.th || 0, a = c.userData.aa || 0, L = SWL - .3; SEAT.set(c.position.x + Math.cos(a) * Math.sin(th) * L, c.position.y - Math.cos(th) * L, c.position.z + Math.sin(a) * Math.sin(th) * L); yaw = Math.atan2(Math.cos(a), Math.sin(a)); armsUp = th > .5; if (v.t > v.end) return leave(p); }
    else if (v.ride === 'tasses') { const c = A.cupM[v.i]; c.getWorldPosition(SEAT); SEAT.y += 1.07; const q = new THREE.Euler().setFromQuaternion(c.getWorldQuaternion(new THREE.Quaternion()), 'YXZ'); yaw = q.y; SEAT.x += Math.sin(yaw) * -.45; SEAT.z += Math.cos(yaw) * -.45; if (v.t > v.end) return leave(p); }
    else if (v.ride === 'rm') { const c = A.train[0]; SEAT.copy(c.position).add(new V3(0, .6, 0)); const q = at(A.rm.s); yaw = Math.atan2(q.t.x, q.t.z); armsUp = A.rm.v > 9; if (A.rm.done) return leave(p); }
    p.x = SEAT.x; p.z = SEAT.z; p.y = SEAT.y; p.yaw = yaw; p.vx = p.vz = p.vy = 0; p.onGround = true; p.swim = false; p.blob.visible = false; if (p.toolMesh) p.toolMesh.visible = false;
    p.animate(dt, 0); const q = pose === 'cheval' ? { bob: -.3, lean: .05, thigh: -1.2, shin: .9, arm: -.9, fore: -.5, armZ: .05 } : G.sitPose(.45, 'chaise'); G.applyPose(p.C, q);
    if (armsUp) { p.C.armL.rotation.x = p.C.armR.rotation.x = -2.8; p.C.armL.rotation.z = -.35; p.C.armR.rotation.z = .35; }
    p.place(); p.root.position.set(p.x, p.y - .45, p.z);
  }
  G.on('init', () => { const F = G.feat, ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (v && v.ride) return rideTick(p, dt); return ou(p, dt); }; });
  // les stands : petits jeux et gourmandises
  const PRIZES = ['cadeau', 'coquillage', 'baies', 'pomme'];
  const stand = o => { const k = (o.v || 0) % 6, p = G.player, [cx, cz] = G.map.center(o), give = (id, n) => G.ITEMS[id] && G.act.give(id, n || 1, cx, o.y, cz);
    if (surv() && G.coins < 50) { G.sfx('error'); return G.ui.toast('Il faut 50 clochettes.'); } if (surv()) { G.coins -= 50; G.ui.dirtyHud(); G.sfx('coin'); }
    G.fx.burst(cx, o.y + 1.6, cz, 18, [0xffd23f, 0xff8fc0, 0x6bb6ff], 2.5, .7, 4);
    if (k === 0) { G.ui.toast('🍭 Une barbe à papa toute rose ! Miam…'); G.feat.emote && G.feat.emote('rire'); }
    else if (k === 1) { const g = G.pick(['glace_vanille', 'glace_fraise', 'sorbet_citron', 'coupe_glacee']); give(g); G.ui.toast('🍦 Une glace pour toi !'); }
    else if (k === 2) { const n = 3 + Math.floor(Math.random() * 8); G.sfx(n >= 10 ? 'fanfare' : 'pop'); G.ui.toast(n >= 10 ? '🥫 Tout est tombé ! Tu gagnes un gros lot !' : '🥫 Tu fais tomber ' + n + ' boîtes sur 10 !'); if (n >= 8) give(G.pick(PRIZES)); }
    else if (k === 3) { const w = Math.random() < .5; G.sfx(w ? 'fanfare' : 'splash'); G.ui.toast(w ? '🦆 Le canard a une étoile dessous : gagné !' : '🦆 Pas d\'étoile sous ce canard… Rejoue !'); if (w) give(G.pick(PRIZES)); }
    else if (k === 4) { give(G.pick(['crepe', 'tarte', 'madeleine'].filter(id => G.ITEMS[id])) || 'tarte'); G.ui.toast('🧇 Une gaufre toute chaude, avec du sucre glace !'); }
    else { G.ui.toast('🎈 Un ballon ! Il s\'envole…'); for (let j = 0; j < 14; j++) G.fx.one(p.x, p.y + 2, p.z, (Math.random() - .5) * .3, 2.2, (Math.random() - .5) * .3, 3, -.6, [0xd8343a, 0x6bb6ff, 0xffd23f][j % 3], .3, 0); } };
  const oint = G.act.interact; G.act.interact = () => { const p = G.player, m = G.map;
    if (m === G.parcMap && p && !p.vehicle && !p.sit && !G.ents.villagerInFront(p)) { const k = nearRide(); if (k) return board(k); const [tx, tz] = p.target(), o = m.objAt(tx, tz); if (o && o.t === 'stand_fete') return stand(o); }
    return oint(); };
  const ouse = G.act.useful; G.act.useful = o => (o && G.OBJ[o.t].fete) || ouse(o);
  G.on('update', () => { const k = nearRide(), el = G.el('parc-tip'); if (k && G.ui.canPlay()) { let t = el; if (!t) { t = document.createElement('div'); t.id = 'parc-tip'; t.className = 'card'; t.style.cssText = 'position:absolute;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font:700 15px Nunito,sans-serif;padding:6px 14px;z-index:12'; G.el('hud').appendChild(t); }
      t.innerHTML = '<kbd>E</kbd> Monter : ' + NAMES[k] + (surv() ? ' (' + PRICE + ' 🔔)' : ''); t.hidden = false; } else if (el) el.hidden = true; });
  G.on('newGame', () => P.reset());
})();
