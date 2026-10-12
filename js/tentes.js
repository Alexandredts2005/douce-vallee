'use strict';
// ===== Tentes et kiosques ronds ultra détaillés : kiosque à musique, kiosque à journaux, tente de la voyante,
// tente de Rounard, chapiteau des jeux, tente de camping (toiles plissées, festons, cordages, guirlandes lumineuses) =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3, UP = new V3(0, 1, 0), GOLD = 0xe8c25a, PT = G.PAT || {};
  // ---------- outils ----------
  const lathe = (b, pts, col, x, y, z, seg = 32, sx = 1, sz = 1, p0 = 0, pL = TAU, mat = 0) => b.geo(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg, p0, pL), col, b.M(x, y, z, 0, 0, 0, sx, 1, sz), mat, true);
  // toit rayé (profil de l'avant-toit vers la pointe) + dessous uni
  const striped = (b, pts, n, cA, cB, x, y, z, sx = 1, sz = 1, inner = null) => { for (let i = 0; i < n; i++) lathe(b, pts, i % 2 ? cB : cA, x, y, z, 3, sx, sz, i / n * TAU, TAU / n); if (inner != null) lathe(b, [...pts].reverse(), inner, x, y, z, n * 2, sx, sz); };
  // festons (lambrequins) autour d'un bord ; glow = petites ampoules au bout
  const valance = (b, r, y, n, cols, sx = 1, sz = 1, glow = false) => { const w = PI * r / n * 1.04;
    for (let i = 0; i < n; i++) { const a = (i + .5) / n * TAU, x = Math.cos(a) * r * sx, z = Math.sin(a) * r * sz, c = cols[i % cols.length];
      for (const f of [0, PI]) b.geo(new THREE.CircleGeometry(w, 8, PI, PI), c, b.M(x, y, z, 0, PI / 2 - a + f, 0));
      if (glow) b.sph(.035, 0xfff1b8, x, y - w * .95, z, 1, 1, 1, 1, 6, 4); } };
  // toile tombante plissée (ouverte devant si gap > 0)
  const drape = (b, r, h, y, col, folds = 14, amp = .05, gap = 0, sx = 1, sz = 1, flare = 1.04) => { const g = new THREE.CylinderGeometry(r, r * flare, h, Math.max(24, folds * 4), 3, true, gap / 2, TAU - gap), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(x, z), k = 1 + amp * Math.sin(a * folds); p.setX(i, x * k); p.setZ(i, z * k); } g.computeVertexNormals(); b.geo(g, col, b.M(0, y, 0, 0, 0, 0, sx, 1, sz), 0, true);
    const gi = g.clone(); gi.scale(.985, 1, .985); const ix = gi.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } gi.computeVertexNormals(); b.geo(gi, new THREE.Color(col).multiplyScalar(.6), b.M(0, y, 0, 0, 0, 0, sx, 1, sz), 0, true); };
  const rope = (b, a, c, r, col) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); b.geo(new THREE.CylinderGeometry(r, r, L, 4, 1, true), col, new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1))); };
  // guirlande de fanions entre deux points (avec flèche)
  const bunting = (b, a, c, n, cols, sag = .25, lights = false) => { let prev = a; for (let i = 1; i <= n; i++) { const t = i / n, p = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - Math.sin(t * PI) * sag, a[2] + (c[2] - a[2]) * t]; rope(b, prev, p, .008, 0x3a2a1e); prev = p;
      if (i < n) { if (lights) b.sph(.03, [0xfff1b8, 0xffd27a, 0xffb3c6][i % 3], p[0], p[1] - .03, p[2], 1, 1, 1, 1, 5, 4); else b.cone(.055, .13, 3, cols[i % cols.length], p[0], p[1] - .07, p[2], PI, Math.atan2(c[0] - a[0], c[2] - a[2]), 0); } } };
  const stake = (b, x, z, top) => { b.cone(.03, .18, 5, 0x6b4a2c, x, .06, z, PI); rope(b, [x, .1, z], top, .007, 0xd8c8a0); };
  const lantern = (b, x, y, z, col = 0xffd27a, s = 1) => { b.cyl(.06 * s, .05 * s, .03 * s, 8, GOLD, x, y + .12 * s, z); b.cyl(.055 * s, .055 * s, .17 * s, 8, col, x, y, z, 0, 0, 0, 1); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; b.box(.01 * s, .18 * s, .01 * s, GOLD, x + Math.cos(a) * .058 * s, y, z + Math.sin(a) * .058 * s); } b.cone(.08 * s, .1 * s, 8, GOLD, x, y + .18 * s, z); b.sph(.02 * s, GOLD, x, y + .25 * s, z); };
  const rug = (b, w, d, x, z, c1, c2) => { G.rbox(b, w, .02, d, .008, c1, x, .012, z); G.rbox(b, w * .82, .022, d * .72, .008, c2, x, .014, z); G.rbox(b, w * .4, .024, d * .3, .006, c1, x, .016, z); for (let k = 0; k < 10; k++) for (const s of [-1, 1]) b.box(.02, .006, .06, 0xf3e6c8, x - w * .45 + k * w * .1, .006, z + s * (d / 2 + .02)); };

  // ===================== kiosque à musique (4×4) =====================
  MD.kiosque = v => { const b = G.mb(181), IR = 0x2c3a35, CR = 0xf3ead2, GR = 0x2f6b55, ST = 0xe6ddc9, R = 1.62, n = 8;
    b.P(PT.pierre); b.cyl(1.82, 1.9, .4, 8, ST, 0, .2, 0, 0, PI / 8); b.P(0); b.cyl(1.86, 1.86, .06, 8, 0xd8cfba, 0, .42, 0, 0, PI / 8); b.P(PT.planches); b.cyl(1.74, 1.74, .03, 8, 0xb88a5a, 0, .455, 0, 0, PI / 8); b.P(0);
    b.P(PT.pierre); for (let k = 0; k < 2; k++) b.box(1.1 - k * .1, .2 * (k + 1), .14, ST, 0, .1 * (k + 1), 1.92 - k * .14); b.P(0);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + PI / 8, x = Math.cos(a) * R, z = Math.sin(a) * R;
      b.cyl(.07, .09, .12, 8, IR, x, .52, z); b.cyl(.045, .05, 2.05, 8, IR, x, 1.52, z); for (let k = 0; k < 4; k++) b.tor(.05, .012, GOLD, x, .8 + k * .45, z, PI / 2, 0, 0, 0, 8); b.cyl(.08, .05, .1, 8, GOLD, x, 2.58, z);
      const a2 = (i + 1) / n * TAU + PI / 8, x2 = Math.cos(a2) * R, z2 = Math.sin(a2) * R, mx = (x + x2) / 2, mz = (z + z2) / 2, L = Math.hypot(x2 - x, z2 - z), ry = -Math.atan2(z2 - z, x2 - x);
      b.geo(new THREE.TorusGeometry(L / 2, .018, 4, 16, PI), IR, b.M(mx, 2.6, mz, PI, ry, 0)); for (let k = 0; k < 3; k++) b.tor(.06, .01, IR, mx + (x2 - x) * (k - 1) * .22, 2.48, mz + (z2 - z) * (k - 1) * .22, 0, ry, 0, 0, 10);
      if (i !== 1) { b.box(L, .05, .05, IR, mx, 1.12, mz, 0, ry, 0); b.box(L, .035, .035, IR, mx, .58, mz, 0, ry, 0); b.box(L, .04, .06, GOLD, mx, 1.16, mz, 0, ry, 0);
        for (let k = 1; k < 6; k++) { const t = k / 6, px = x + (x2 - x) * t, pz = z + (z2 - z) * t; b.box(.018, .52, .018, IR, px, .85, pz); b.tor(.07, .01, IR, px, .85, pz, 0, ry, 0, 0, 10); } } }
    // toit en cloche rayé, festons lumineux, lanterneau, girouette
    const roof = [[2.0, 2.62], [1.8, 2.78], [1.35, 3.0], [.9, 3.3], [.55, 3.7], [.42, 3.95], [.25, 4.12], [0, 4.18]];
    striped(b, roof, 16, GR, CR, 0, 0, 0, 1, 1, 0xf7f0e0); b.tor(2.0, .045, GOLD, 0, 2.62, 0, PI / 2, 0, 0, 0, 32); valance(b, 2.0, 2.6, 32, [GR, CR], 1, 1, true);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.cyl(.015, .015, .32, 4, IR, Math.cos(a) * .22, 4.32, Math.sin(a) * .22); }
    b.cyl(.2, .2, .05, 12, CR, 0, 4.17, 0); lathe(b, [[.3, 4.48], [.2, 4.6], [.1, 4.7], [0, 4.74]], GR, 0, 0, 0, 12); b.sph(.07, 0xfff1b8, 0, 4.32, 0, 1, 1, 1, 1, 8, 6);
    b.cyl(.012, .012, .45, 4, GOLD, 0, 4.95, 0); b.sph(.035, GOLD, 0, 4.86, 0); b.box(.35, .02, .02, GOLD, 0, 5.05, 0); b.cone(.04, .08, 4, GOLD, .19, 5.05, 0, 0, 0, -PI / 2); b.box(.07, .07, .01, GOLD, -.16, 5.07, 0); b.box(.02, .02, .25, GOLD, 0, 4.98, 0); b.box(.22, .02, .02, GOLD, 0, 4.98, 0);
    // pupitres, chaises, grosse caisse, partitions
    for (let k = 0; k < 4; k++) { const a = PI + .5 + k * .55, x = Math.cos(a) * .95, z = Math.sin(a) * .95; b.cyl(.012, .012, .75, 4, IR, x, .85, z); b.box(.26, .2, .01, IR, x, 1.25, z + .02, -.4, -a - PI / 2, 0); b.box(.2, .15, .005, 0xfaf7f0, x, 1.26, z + .04, -.4, -a - PI / 2, 0);
      const cx = Math.cos(a) * .7, cz = Math.sin(a) * .7; b.box(.24, .03, .24, 0x8a5a34, cx, .72, cz); for (const s of [-1, 1]) for (const t of [-1, 1]) b.cyl(.012, .012, .26, 4, 0x5a3820, cx + s * .1, .59, cz + t * .1); b.box(.24, .26, .03, 0x8a5a34, cx - Math.cos(a) * .12, .88, cz - Math.sin(a) * .12, 0, -a - PI / 2, 0); }
    b.cyl(.2, .2, .24, 16, 0xc8342c, .3, .66, -.5, PI / 2, 0, 0); b.cyl(.19, .19, .245, 16, 0xfaf7f0, .3, .66, -.5, PI / 2, 0, 0); for (const s of [-1, 1]) b.tor(.2, .015, GOLD, .3, .66, -.5 + s * .12, 0, 0, 0, 0, 16);
    // jardinières autour du socle
    for (let i = 0; i < 6; i++) { const a = PI * (1.15 + i * .14), x = Math.cos(a) * 1.92, z = Math.sin(a) * 1.92; b.jit(.1); b.blob(.18, 1, 0x4a8a4f, x, .3, z, 1.3, .7, 1.3); b.jit(0); for (let k = 0; k < 4; k++) b.sph(.05, [0xe8434a, 0xffffff, 0xffd23f, 0xb583e6][(i + k) % 4], x + Math.cos(k * 1.6) * .12, .44, z + Math.sin(k * 1.6) * .12, 1, 1, 1, 0, 5, 4); }
    return b.done(); };

  // ===================== kiosque à journaux (2×2) =====================
  MD.kiosque_journaux = () => { const b = G.mb(431), GN = 0x2f5a46, r = G.rng(4);
    b.cyl(.82, .86, .25, 8, 0x26463a, 0, .125, 0, 0, PI / 8); b.cyl(.78, .78, 1.45, 8, GN, 0, .97, 0, 0, PI / 8);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = Math.cos(a) * .8, z = Math.sin(a) * .8; b.box(.06, 1.5, .06, 0x1f3a30, x, .95, z); if (i >= 5 || i === 0) continue;
      const a2 = a + TAU / 16, px = Math.cos(a2) * .8, pz = Math.sin(a2) * .8; b.box(.5, .7, .02, [0xe8434a, 0x5b8fd6, 0xffd23f, 0xff8fc0][i % 4], px, 1.25, pz, 0, -a2 + PI / 2, 0); b.box(.42, .08, .025, 0xffffff, px, 1.45, pz, 0, -a2 + PI / 2, 0); }
    for (let row = 0; row < 3; row++) for (let k = 0; k < 8; k++) { const a = PI / 2 - .9 + k * .26; b.box(.17, .23, .02, [0xe8434a, 0x5b8fd6, 0xffd23f, 0x4fb35f, 0xffffff, 0xff8fc0][Math.floor(r() * 6)], Math.cos(a) * .86, .45 + row * .3, Math.sin(a) * .86, -.15, -a + PI / 2, 0); }
    b.box(1.6, .05, .45, 0x2f7a4a, 0, 1.78, .8, -.35); valance(b, .9, 1.7, 16, [GN, 0xd9b84a]);
    lathe(b, [[.98, 1.72], [.9, 1.85], [.6, 2.05], [.45, 2.3], [.3, 2.5], [.15, 2.62], [0, 2.66]], GN, 0, 0, 0, 16); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.03, .5, .03, GOLD, Math.cos(a) * .6, 2.12, Math.sin(a) * .6, Math.sin(a) * .5, 0, -Math.cos(a) * .5); }
    b.tor(.95, .03, GOLD, 0, 1.72, 0, PI / 2, 0, 0, 0, 24); b.sph(.08, GOLD, 0, 2.7, 0); b.cone(.04, .2, 6, GOLD, 0, 2.86, 0); b.box(.7, .14, .02, 0x1f3a30, 0, 1.6, .79); lantern(b, .55, 1.4, .72, 0xfff1c8, .8);
    return b.done(); };

  // ===================== tente de la voyante (3×3, porte devant) =====================
  MD.tente_voyante = v => { const b = G.mb(183), PU = 0x4b2a7b, DP = 0x2e1a52, MG = 0xb03a8c, gap = .9;
    b.cyl(1.45, 1.45, .04, 24, 0x3a2a1e, 0, .02, 0); rug(b, 1.0, .7, 0, 1.55, 0x8a2a4a, 0xe8c25a);
    drape(b, 1.3, 1.5, .78, PU, 16, .05, gap); b.cyl(1.0, 1.0, 1.4, 16, 0x0f0a18, 0, .75, -.1, 0, 0, 0, 0, true);
    for (const s of [-1, 1]) { const a = s * gap / 2; b.geo(new THREE.ConeGeometry(.3, 1.4, 8, 1, true, 0, PI), MG, b.M(Math.sin(a) * 1.35, .8, Math.cos(a) * 1.35, 0, a + (s > 0 ? 0 : PI), 0, 1, 1, .35)); b.tor(.08, .02, GOLD, Math.sin(a * 1.4) * 1.36, .85, Math.cos(a * 1.4) * 1.36, 0, a, 0, 0, 8); }
    b.cyl(.06, .08, .3, 10, GOLD, 0, .25, -.3); b.sph(.18, 0xb9a8ff, 0, .55, -.3, 1, 1, 1, 1, 14, 10); b.cyl(.3, .3, .2, 12, 0x5a2a6a, 0, .2, -.3);
    for (let i = 0; i < 26; i++) { const a = gap / 2 + .1 + (i % 13) / 13 * (TAU - gap - .2), y = .3 + Math.floor(i / 13) * .7 + (i % 3) * .12, rr = 1.34; if (i % 4 === 0) b.tor(.06, .015, GOLD, Math.sin(a) * rr, y, Math.cos(a) * rr, 0, a, 0, 0, 10); else b.geo(new THREE.OctahedronGeometry(.035, 0), GOLD, b.M(Math.sin(a) * rr, y, Math.cos(a) * rr, 0, a, 0, 1, 1, .4)); }
    const roof = [[1.62, 1.5], [1.45, 1.62], [1.1, 1.8], [.75, 2.05], [.45, 2.35], [.28, 2.62], [.15, 2.85], [0, 2.95]];
    striped(b, roof, 12, PU, DP, 0, 0, 0, 1, 1, 0x3a2050); b.tor(1.6, .04, GOLD, 0, 1.5, 0, PI / 2, 0, 0, 0, 32); valance(b, 1.6, 1.48, 24, [MG, PU]);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.cos(a) * 1.62, z = Math.sin(a) * 1.62; b.cone(.03, .14, 6, GOLD, x, 1.25, z, PI); b.sph(.025, GOLD, x, 1.34, z); }
    b.cyl(.012, .012, .4, 4, GOLD, 0, 3.1, 0); b.sph(.05, GOLD, 0, 2.97, 0); b.geo(new THREE.TorusGeometry(.13, .03, 6, 14, PI * 1.3), GOLD, b.M(0, 3.38, 0, 0, 0, -.6), 0, true); b.geo(new THREE.OctahedronGeometry(.06, 0), 0xfff1b8, b.M(.07, 3.46, 0), 1);
    for (const s of [-1, 1]) { const x = s * .62; b.cyl(.005, .005, .25, 3, GOLD, x, 1.42, 1.45); lantern(b, x, 1.15, 1.45, s > 0 ? 0xc77dff : 0xffd27a, .9); }
    for (let k = 0; k < 6; k++) { const a = PI * .35 + k * .5; stake(b, Math.cos(a) * 1.48, Math.sin(a) * -1.48, [Math.cos(a) * 1.55, 1.45, Math.sin(a) * -1.55]); }
    return b.done(); };

  // ===================== tente de Rounard (3×3, bazar) =====================
  MD.tente_rounard = v => { const b = G.mb(184), TE = 0x1f6f6c, OR = 0xe8803a, CR = 0xf3e6c8, W = 2.5;
    b.box(2.9, .04, 2.9, 0x3a2a1e, 0, .02, 0); rug(b, 1.3, .8, 0, 1.25, 0x1f4f7a, OR);
    for (const [x, z, ry] of [[0, -W / 2, 0], [-W / 2, 0, PI / 2], [W / 2, 0, PI / 2]]) for (let k = 0; k < 10; k++) b.box(W / 10 + .002, 1.45, .03, k % 2 ? TE : CR, x + (ry ? 0 : -W / 2 + (k + .5) * W / 10), .78, z + (ry ? -W / 2 + (k + .5) * W / 10 : 0), 0, ry, 0);
    for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) b.box(.3, 1.45, .03, k % 2 ? TE : CR, s * (W / 2 - .15 - k * .3), .78, W / 2); b.geo(new THREE.ConeGeometry(.28, 1.4, 6, 1, true, 0, PI), OR, b.M(s * .55, .8, W / 2 + .02, 0, s > 0 ? -PI / 2 : PI / 2, 0, 1, 1, .3)); }
    b.box(1.0, 1.45, .02, 0x120c08, 0, .78, W / 2 - .3); for (const [x, z] of [[-W / 2, -W / 2], [W / 2, -W / 2], [-W / 2, W / 2], [W / 2, W / 2]]) { b.cyl(.04, .05, 1.6, 8, 0x6b4426, x, .8, z); b.sph(.06, GOLD, x, 1.62, z); }
    const yR = 1.55; for (let f = 0; f < 4; f++) for (let k = 0; k < 8; k++) { const t0 = k / 8, ry = f * PI / 2, c = Math.cos(ry), s = Math.sin(ry), w = W + .3, lx = -w / 2 + (t0 + 1 / 16) * w;
      const g = new THREE.BufferGeometry(), A = [-w / 2 + t0 * w, 0, w / 2], B = [-w / 2 + (t0 + 1 / 8) * w, 0, w / 2], T = [0, 1.15, 0], L = p => [p[0] * c + p[2] * s, p[1] + yR, -p[0] * s + p[2] * c];
      const sc = (p, k2) => [p[0] * (1 - k2), p[1], p[2] * (1 - k2)]; g.setAttribute('position', new THREE.Float32BufferAttribute([...L(A), ...L(B), ...L(T), ...L(B), ...L(A), ...L(T)], 3)); b.geo(g, k % 2 ? OR : CR, new THREE.Matrix4()); }
    valance(b, 1.95, 1.5, 28, [TE, OR], .74, .74);
    b.cyl(.015, .015, .7, 4, 0x6b4426, 0, 2.95, 0); b.geo(new THREE.ConeGeometry(.2, .32, 3), OR, b.M(.17, 3.18, 0, 0, 0, -PI / 2, 1, 1, .1)); b.sph(.05, GOLD, 0, 3.32, 0);
    b.box(1.5, .04, .7, OR, 0, 1.5, W / 2 + .3, -.3); for (const s of [-1, 1]) { b.cyl(.025, .025, 1.45, 6, 0x6b4426, s * .72, .73, W / 2 + .62); rope(b, [s * .72, 1.45, W / 2 + .62], [s * 1.1, .02, W / 2 + .95], .007, 0xd8c8a0); }
    bunting(b, [-.72, 1.42, W / 2 + .62], [.72, 1.42, W / 2 + .62], 9, [OR, TE, CR, 0xe8434a], .1, true);
    for (const [x, z, h] of [[-1.05, 1.55, .35], [1.0, 1.6, .3]]) { G.rbox(b, .4, h, .35, .02, 0x8a5a34, x, h / 2, z); b.box(.42, .03, .37, 0x6b4426, x, h * .6, z); }
    b.cyl(.09, .13, .32, 10, 0x2f5fa8, -1.05, .51, 1.55); b.sph(.12, 0xc8342c, 1.0, .42, 1.6, 1, .8, 1); G.rbox(b, .32, .26, .03, .01, GOLD, 1.0, .62, 1.45); G.rbox(b, .26, .2, .02, .005, 0x5b8fd6, 1.0, .62, 1.47);
    for (const s of [-1, 1]) lantern(b, s * .5, 1.18, W / 2 + .5, 0xffb347, .9);
    return b.done(); };

  // ===================== chapiteau des jeux (5×4) =====================
  MD.chapiteau = v => { const b = G.mb(182), RD = 0xd8342c, WH = 0xfaf4ea, YE = 0xffd23f, BL = 0x2f5fa8, SX = 1.05, SZ = .84, gap = .7;
    b.cyl(2.45, 2.45, .04, 32, 0x8a6a4a, 0, .02, 0, 0, 0, 0, 0, false); for (let i = 0; i < 20; i++) { const a = gap / 2 + i / 20 * (TAU - gap), g = new THREE.CylinderGeometry(2.3, 2.34, 1.55, 3, 1, true, a, (TAU - gap) / 20); b.geo(g, i % 2 ? WH : RD, b.M(0, .8, 0, 0, 0, 0, SX, 1, SZ)); }
    b.geo(new THREE.CircleGeometry(.6, 12, 0, PI), 0x120c08, b.M(0, .02, 2.3 * SZ - .02, 0, 0, 0, 1, 1.25, 1)); b.box(1.2, 1.5, .02, 0x120c08, 0, .75, 2.3 * SZ - .06);
    // arche d'entrée à ampoules
    for (const s of [-1, 1]) { b.box(.12, 1.7, .12, YE, s * .66, .85, 2.3 * SZ + .05); for (let k = 0; k < 6; k++) b.sph(.035, 0xfff1b8, s * .66, .2 + k * .28, 2.3 * SZ + .12, 1, 1, 1, 1, 6, 4); }
    b.geo(new THREE.TorusGeometry(.66, .07, 6, 18, PI), YE, b.M(0, 1.7, 2.3 * SZ + .05), 0, true); for (let k = 0; k <= 8; k++) { const a = k / 8 * PI; b.sph(.035, 0xfff1b8, Math.cos(a) * .66, 1.7 + Math.sin(a) * .66, 2.3 * SZ + .13, 1, 1, 1, 1, 6, 4); }
    G.rbox(b, 1.1, .3, .05, .02, BL, 0, 2.5, 2.3 * SZ + .1); for (let k = 0; k < 5; k++) b.geo(new THREE.OctahedronGeometry(.05, 0), YE, b.M(-.4 + k * .2, 2.5, 2.3 * SZ + .14, 0, 0, 0, 1, 1, .4));
    // toit : cône en creux rayé, festons, mât, fanions jusqu'au sol
    const roof = [[2.5, 1.55], [2.2, 1.75], [1.7, 2.1], [1.2, 2.55], [.7, 3.1], [.35, 3.6], [.12, 3.95], [0, 4.0]];
    striped(b, roof, 20, RD, WH, 0, 0, 0, SX, SZ, 0xf3d9c8); valance(b, 2.5, 1.53, 36, [YE, BL], SX, SZ, true);
    b.cyl(.04, .05, 1.2, 8, 0x6b4426, 0, 4.4, 0); b.sph(.08, YE, 0, 5.02, 0); b.geo(new THREE.ConeGeometry(.22, .5, 3), RD, b.M(.26, 4.85, 0, 0, 0, -PI / 2, 1, 1, .1));
    for (const [x, z] of [[-2.6, 0], [2.6, 0], [0, -2.05]]) { b.cyl(.03, .04, 2.2, 6, 0x6b4426, x * SX * .9, 1.1, z * SZ * .9); b.geo(new THREE.ConeGeometry(.12, .3, 3), [YE, BL, RD][(x + 3) % 3 | 0], b.M(x * SX * .9 + .14, 2.1, z * SZ * .9, 0, 0, -PI / 2, 1, 1, .1)); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, ex = Math.cos(a) * 2.45 * SX, ez = Math.sin(a) * 2.45 * SZ; if (Math.abs(Math.atan2(ez, ex) - PI / 2) < .4) continue; bunting(b, [0, 4.0, 0], [ex * 1.02, 1.6, ez * 1.02], 10, [RD, YE, BL, WH], .15); stake(b, ex * 1.06, ez * 1.06, [ex, 1.5, ez]); }
    return b.done(); };

  // ===================== tente de camping (2×2) : tente cloche en toile =====================
  MD.tent = v => { const b = G.mb(185 + (v || 0)), CV = 0xe9dcc0, SM = 0xcdbb98, gap = .8;
    drape(b, .95, .6, .3, CV, 10, .03, gap); b.cyl(.75, .75, .58, 12, 0x221a12, 0, .3, -.08, 0, 0, 0, 0, true);
    const roof = [[.98, .6], [.8, .82], [.55, 1.15], [.3, 1.5], [.1, 1.78], [0, 1.82]]; striped(b, roof, 16, CV, 0xe2d4b6, 0, 0, 0, 1, 1, 0xd8c8a8);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; rope(b, [Math.cos(a) * .98, .6, Math.sin(a) * .98], [Math.cos(a) * .05, 1.8, Math.sin(a) * .05], .006, SM); }
    for (const s of [-1, 1]) { const a = s * gap / 2; b.geo(new THREE.ConeGeometry(.22, .6, 6, 1, true, 0, PI), SM, b.M(Math.sin(a) * .96, .32, Math.cos(a) * .96, 0, a + (s > 0 ? 0 : PI), 0, 1, 1, .3)); }
    b.cyl(.025, .025, .35, 6, 0x6b4426, 0, 1.95, 0); b.geo(new THREE.ConeGeometry(.08, .2, 3), 0x3f8f5a, b.M(.1, 2.05, 0, 0, 0, -PI / 2, 1, 1, .1));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .5; if (Math.abs(a % TAU - PI / 2) < .5) continue; stake(b, Math.cos(a) * .98, Math.sin(a) * .98, [Math.cos(a) * .9, .62, Math.sin(a) * .9]); }
    lantern(b, .45, .55, .88, 0xffd27a, .7); G.rbox(b, .7, .02, .4, .01, 0x8a4b2a, 0, .012, .95);
    return b.done(); };
})();
