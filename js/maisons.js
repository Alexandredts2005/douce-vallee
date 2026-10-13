'use strict';
// ===== 17 nouvelles maisons : manoir victorien à tourelle, basque, alsacienne, bastide provençale, villa moderne à toit-terrasse,
// coloniale à galerie, maison de pêcheur, longère bretonne, chaumière, maison hollandaise à redents, maison des Cyclades au dôme bleu,
// riad marocain, maison en A, maison champignon, maison en pain d'épices, villa Art déco, manoir Tudor.
// Toutes se posent depuis le catalogue (onglet Bâtiments) et se choisissent chez Léon (« Repeindre la façade »). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, A = G.ARCH, PT = G.PAT, TAU = Math.PI * 2, PI = Math.PI;
  const SK = () => G.SK || {}, GLASS = A.GLASS, IRON = A.IRONC, STONE = A.STONEC, GOLD = A.GOLD;
  const dark = A.dark, light = A.light;
  // ---------- toits ----------
  // toit à quatre pans (croupe) ; renvoie les cotes attendues par maison()
  function tri(b, pts, col, pat) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); b.P(pat || 0); b.geo(g, col, b.M()); b.P(0); }
  function hip(b, cx, cz, w, d, y, h, col, pat, thick = .09) {
    const rl = Math.max(0, w - d), r = [[-rl, y + h, 0], [rl, y + h, 0]].map(p => [p[0] + cx, p[1], p[2] + cz]), c = (x, z) => [cx + x, y, cz + z];
    const A1 = c(-w, d), B1 = c(w, d), C1 = c(w, -d), D1 = c(-w, -d), P = [];
    const q = (a, bq, cq, dq) => P.push(...a, ...bq, ...cq, ...a, ...cq, ...dq), t = (a, bq, cq) => P.push(...a, ...bq, ...cq);
    q(A1, B1, r[1], r[0]); q(C1, D1, r[0], r[1]); t(B1, C1, r[1]); t(D1, A1, r[0]);
    tri(b, P, col, pat);
    // sous-face (épaisseur) et bordure
    const U = []; for (const [a, bq] of [[A1, B1], [B1, C1], [C1, D1], [D1, A1]]) { const a2 = [a[0], a[1] - thick, a[2]], b2 = [bq[0], bq[1] - thick, bq[2]]; U.push(...a, ...a2, ...b2, ...a, ...b2, ...bq); }
    tri(b, U, dark(col, .7), 0);
    return y + h;
  }
  const hipRoof = (pitch = .55, over = .24) => (b, H, s) => { const yT = H.fh + H.wh, w = H.w / 2 + over, d = H.d / 2 + over, h = Math.min(w, d) * pitch;
    const top = hip(b, 0, H.zc, w, d, yT - .02, h, s.roof, s.rp); b.P(PT.pierre); b.box(H.w + .02, .07, H.d + .02, s.trim, 0, yT - .03, H.zc); b.P(0);
    b.cyl(.05, .05, H.w + over * 2, 8, A.ZINC, 0, yT - .1, H.zc + d + .02, 0, 0, PI / 2); return { yT, yR: yT, top: top + .04, tn: 0 }; };
  const flatRoof = (rail = 1) => (b, H, s) => { const yT = H.fh + H.wh; b.box(H.w + .16, .12, H.d + .16, s.trim, 0, yT + .06, H.zc); b.box(H.w - .1, .04, H.d - .1, 0x9a948a, 0, yT + .14, H.zc);
    if (rail === 1) for (const [x, z, w, d] of [[0, H.zc + H.d / 2, H.w + .16, .08], [0, H.zc - H.d / 2, H.w + .16, .08], [-H.w / 2, H.zc, .08, H.d], [H.w / 2, H.zc, .08, H.d]]) b.box(w, .28, d, s.wall, x, yT + .26, z);
    else if (rail === 2) { b.S(SK().glass); b.box(H.w + .1, .32, .03, GLASS, 0, yT + .3, H.zc + H.d / 2 + .04, 0, 0, 0, 2); b.S(SK().steel); b.box(H.w + .12, .03, .05, 0xc9ccd2, 0, yT + .47, H.zc + H.d / 2 + .04); b.S(null); }
    return { yT, yR: yT, top: yT + .4, tn: 0 }; };
  const mansardRoof = () => (b, H, s) => { const yT = H.fh + H.wh, w = H.w / 2 + .12, d = H.d / 2 + .12, h1 = .82, inset = .3, sk = SK();
    // brisis (partie raide) en ardoise, terrasson (partie basse) au-dessus
    const P = [], c = (x, y, z) => [x, y, H.zc + z], lo = [c(-w, yT, d), c(w, yT, d), c(w, yT, -d), c(-w, yT, -d)], hi = [c(-w + inset, yT + h1, d - inset), c(w - inset, yT + h1, d - inset), c(w - inset, yT + h1, -d + inset), c(-w + inset, yT + h1, -d + inset)];
    for (let i = 0; i < 4; i++) { const a = lo[i], bq = lo[(i + 1) % 4], cq = hi[(i + 1) % 4], dq = hi[i]; P.push(...a, ...bq, ...cq, ...a, ...cq, ...dq); } tri(b, P, s.roof, PT.ardoise);
    const top = hip(b, 0, H.zc, w - inset, d - inset, yT + h1, .32, dark(s.roof, .9), PT.ardoise, .02);
    b.box(H.w + .3, .08, H.d + .3, s.trim, 0, yT, H.zc); b.S(sk.steel); b.box(H.w - inset * 2 + .3, .04, .04, 0xc9ccd2, 0, yT + h1, H.zc + d - inset); b.S(null);
    for (const x of [-.75, .75]) { const z = H.zc + d - .15; b.box(.44, .52, .36, s.trim, x, yT + .42, z - .06); A.P(b, .58, .26, .44, s.roof, x, yT + .68, z - .06); b.S(sk.glass); b.box(.28, .32, .02, GLASS, x, yT + .4, z + .13, 0, 0, 0, 1); b.S(null); }
    return { yT, yR: yT, top: top + .05, tn: 0 }; };
  const thatchRoof = () => (b, H, s) => { const yT = H.fh + H.wh, w = H.w / 2 + .32, d = H.d / 2 + .32, h = Math.min(w, d) * 1.05;
    const top = hip(b, 0, H.zc, w, d, yT - .1, h, s.roof, PT.bardeaux, .2);
    b.jit(.06); b.cyl(.16, .16, Math.max(.1, (w - d) * 2) + .3, 12, dark(s.roof, .85), 0, top - .02, H.zc, 0, 0, PI / 2, 0, true); for (const sx of [-1, 1]) b.sph(.17, dark(s.roof, .85), sx * (Math.max(0, w - d) + .12), top - .02, H.zc);
    for (const [z, len] of [[H.zc + d, w * 2], [H.zc - d, w * 2]]) b.cyl(.13, .13, len, 10, light(s.roof, .08), 0, yT - .14, z, 0, 0, PI / 2, 0, true); b.jit(0);
    // lucarne « en œil » dans le chaume
    b.sph(.36, s.roof, 0, yT + .35, H.zc + d - .25, 1.2, .55, .8); b.S(SK().glass); b.box(.32, .2, .02, GLASS, 0, yT + .33, H.zc + d + .02, 0, 0, 0, 1); b.S(null);
    return { yT, yR: yT, top: top + .12, tn: 0 }; };
  // pignon à redents (maison hollandaise) : la façade dépasse le toit en escalier
  const stepRoof = () => (b, H, s) => { const R = A.toitZ(b, H, { col: s.roof, pat: s.rp, wall: s.wall, wallPat: s.wp, pitch: 1.35, fascia: s.trim, over: .05 }), zf = H.zc + H.d / 2 + .04, half = H.w / 2;
    b.P(s.wp); for (let i = 0; i < 4; i++) { const x0 = half - i * (half / 4), y0 = R.yT + i * (R.yR - R.yT) / 4; for (const sx of [-1, 1]) b.box(half / 4 + .02, (R.yR - R.yT) / 4 + .12, .16, s.wall, sx * (x0 - half / 8), y0 + (R.yR - R.yT) / 8 + .06, zf); } b.box(.42, .4, .16, s.wall, 0, R.yR + .1, zf); b.P(0);
    b.P(PT.pierre); for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) b.box(half / 4 + .08, .05, .2, STONE, sx * (half - i * half / 4 - half / 8), R.yT + (i + 1) * (R.yR - R.yT) / 4 + .12, zf); b.box(.5, .06, .2, STONE, 0, R.yR + .32, zf); b.P(0);
    b.S(SK().glass); A.fenetre(b, H, 0, 0, R.yT + .55, { w: .4, h: .5, frame: s.trim, pane: 'petits' }); b.S(null); return R; };
  // ---------- ajouts : tourelle, bow-window, galerie à colonnes, véranda ----------
  function tourelle(b, s, x, z, h) { b.P(s.wp); b.cyl(.42, .44, h, 18, s.wall, x, h / 2, z); b.P(0); b.cyl(.48, .48, .08, 18, s.trim, x, h + .04, z);
    b.P(PT.ardoise); b.cone(.55, 1.3, 18, s.roof, x, h + .68, z); b.P(0); b.S(SK().gold); b.cyl(.012, .012, .35, 5, GOLD, x, h + 1.45, z); b.sph(.04, GOLD, x, h + 1.6, z); b.S(null);
    for (const y of [1.05, 2.2]) { if (y > h - .3) continue; b.box(.22, .44, .05, s.trim, x, y, z + .42); b.S(SK().glass); b.box(.16, .36, .03, GLASS, x, y, z + .45, 0, 0, 0, 1); b.S(null); } }
  function bow(b, s, H) { const zf = H.zc + H.d / 2, y0 = H.fh, h = 1.1; for (const [a, x] of [[-.6, -.48], [0, 0], [.6, .48]]) { b.box(.42, h, .08, s.trim, x - .95 + (a ? Math.sign(a) * .02 : 0), y0 + h / 2 + .05, zf + .22 - Math.abs(a) * .2, 0, a, 0); b.S(SK().glass); b.box(.34, .7, .03, GLASS, x - .95, y0 + .62, zf + .27 - Math.abs(a) * .2, 0, a, 0, 1); b.S(null); }
    b.P(s.rp); A.P(b, 1.3, .25, .5, s.roof, -.95, y0 + h + .05, zf + .22, 0); b.P(0); }
  function galerie(b, s, H) { const zf = H.zc + H.d / 2, pd = .5; b.P(PT.planches); b.box(H.w + .2, .07, pd, 0xc9a16e, 0, H.fh - .03, zf + pd / 2); b.box(H.w + .2, .06, pd, 0xc9a16e, 0, H.fh + 1.85, zf + pd / 2); b.P(0);
    for (let i = 0; i < 5; i++) { const x = -H.w / 2 - .05 + i * (H.w + .1) / 4; b.cyl(.05, .055, 1.85, 10, s.trim, x, H.fh + .92, zf + pd - .06); b.cyl(.045, .05, 1.0, 10, s.trim, x, H.fh + 2.38, zf + pd - .06); }
    for (const y of [H.fh + .45, H.fh + 2.3]) { b.box(H.w + .2, .04, .04, s.trim, 0, y, zf + pd - .06); for (let k = 0; k < 18; k++) b.box(.025, .38, .025, s.trim, -H.w / 2 + k * H.w / 17, y - .2, zf + pd - .06); }
    b.P(s.rp); b.box(H.w + .3, .07, pd + .2, s.roof, 0, H.fh + 2.95, zf + pd / 2 + .02, .15); b.P(0); }
  function veranda(b, s, H) { const x0 = H.w / 2, w = .55, sk = SK(); b.box(w, .12, H.d * .8, STONE, x0 + w / 2, .06, H.zc); for (const z of [-.3, .3]) for (const x of [x0 + .05, x0 + w - .03]) b.box(.04, 1.3, .04, 0xf7f5ee, x, .7, H.zc + z * H.d);
    b.S(sk.glass); b.box(.02, 1.2, H.d * .78, GLASS, x0 + w - .02, .7, H.zc, 0, 0, 0, 2); b.box(w, 1.2, .02, GLASS, x0 + w / 2, .7, H.zc + H.d * .39, 0, 0, 0, 2); b.box(w + .05, .03, H.d * .8, GLASS, x0 + w / 2, 1.38, H.zc, 0, 0, -.25, 2); b.S(null);
    b.S(sk.leaf); for (let i = 0; i < 3; i++) b.blob(.13, 1, 0x4fa847, x0 + .25, .3, H.zc - .2 + i * .25); b.S(null); }
  // ---------- les 17 styles ----------
  const NEW = [
    { n: 'Manoir victorien', wall: 0xc9b8d8, wp: PT.bardage, base: 0x8f8b82, roof: 0x4a4f5c, rp: PT.ardoise, trim: 0xffffff, door: 0x6a3a5a, ds: 'vitre', shut: null, curt: 0xfff1d6, corners: 1, porch: 1, lamp: 2, roofFn: hipRoof(.75, .2), x: { tour: 1, bow: 1 } },
    { n: 'Maison basque', wall: 0xfaf8f2, wp: PT.crepi, base: 0xb9b2a2, roof: 0xb84a32, rp: PT.tuiles, Z: 1, pitch: .5, trim: 0x8a2a1e, frame: 0xffffff, door: 0x8a2a1e, ds: 'planches', shut: 0x8a2a1e, curt: 0xfff1d6, colombage: 0x8a2a1e, balcon: 1, lamp: 1 },
    { n: 'Maison alsacienne', wall: 0xf3c9a8, wp: PT.crepi, base: 0xa9a29a, roof: 0xb8553c, rp: PT.tuiles, pitch: 1.3, trim: 0x6b3a22, frame: 0xffffff, door: 0x6b3a22, ds: 'planches', shut: 0x3f7a4a, curt: 0xfff6e8, colombage: 0x6b3a22, fleurs: [0xe8434a, 0xff6f91, 0xffffff, 0xffd23f], dormer: 1, lamp: 1 },
    { n: 'Bastide provençale', wall: 0xf0cf9a, wp: PT.crepi, base: 0xc8b9a0, roof: 0xd07a4a, rp: PT.tuiles, trim: 0xf3e6d0, door: 0x7a8fc8, ds: 'planches', shut: 0x8fa0d8, curt: 0xfff6e0, fleurs: [0xb583e6, 0xffffff], genoise: 1, lamp: 2, roofFn: hipRoof(.38, .26), quoin: 0xe8dcc8 },
    { n: 'Villa moderne', wall: 0xf6f6f2, wp: PT.crepi, base: 0x8a8f96, roof: 0x5a5f66, rp: 0, trim: 0xe8e8e4, frame: 0x2a2d33, door: 0x8a5a36, ds: 'vitre', curt: 0xf4f4f0, pane: 'grand', noChim: 1, lamp: 1, roofFn: flatRoof(2), x: { bardage: 0x9a6a40, baie: 1 } },
    { n: 'Maison coloniale', wall: 0xfaf8f0, wp: PT.bardage, base: 0xa9a29a, roof: 0x3f5a4a, rp: PT.bardeaux, trim: 0xffffff, door: 0x2f5a46, ds: 'panneaux', shut: 0x2f6b45, curt: 0xffffff, lamp: 2, roofFn: hipRoof(.5, .3), x: { galerie: 1 } },
    { n: 'Maison de pêcheur', wall: 0x6f9fc8, wp: PT.bardage, base: 0xb9b5aa, roof: 0xf4f4f0, rp: PT.ardoise, Z: 1, pitch: .9, trim: 0xffffff, frame: 0xffffff, door: 0xe8a23a, ds: 'vitre', shut: 0xffffff, curt: 0xdff6ff, corners: 1, lamp: 1, x: { bouee: 1 } },
    { n: 'Longère bretonne', wall: 0xa9a59a, wp: PT.moellons, base: 0x8f8b82, roof: 0x3a3f4a, rp: PT.ardoise, pitch: 1.05, trim: 0xf3eee4, frame: 0xffffff, door: 0x2f5f9a, ds: 'panneaux', curt: 0xffffff, bigChim: 1, lintel: 0x8a8578, lamp: 1, x: { chim2: 1 } },
    { n: 'Chaumière en chaume', wall: 0xfaf5ea, wp: PT.crepi, base: 0x8f8b82, roof: 0xc9a35a, rp: PT.bardeaux, trim: 0x6b4a32, frame: 0xf3ead8, door: 0x5a7a4a, ds: 'planches', shut: 0x5a7a4a, curt: 0xf6e6c8, roofFn: thatchRoof(), fleurs: [0xff8fc0, 0xe8434a, 0xffffff], noChim: 1, lamp: 1, ivy: 1 },
    { n: 'Maison hollandaise', wall: 0x9a4a32, wp: PT.brique, base: 0x6f6a63, roof: 0x3a3f48, rp: PT.ardoise, trim: 0xffffff, frame: 0xffffff, door: 0x2f5a3a, ds: 'vitre', curt: 0xffffff, pane: 'petits', roofFn: stepRoof(), noChim: 1, lamp: 1, fleurs: [0xff6f91, 0xffd23f, 0xffffff] },
    { n: 'Riad marocain', wall: 0xd88a5a, wp: PT.crepi, base: 0xb06a42, roof: 0xd88a5a, rp: 0, trim: 0xf3e0c0, frame: 0x2f7a8a, door: 0x2f6a8a, ds: 'planches', curt: 0xfff1d6, arch: 1, noChim: 1, lamp: 1, roofFn: flatRoof(1), x: { zellige: 1, creneaux: 1 } },
    { n: 'Maison Art déco', wall: 0xf3e6c8, wp: PT.crepi, base: 0x5a5f66, roof: 0x5a5f66, rp: 0, trim: 0xd9b04a, frame: 0x2a2d33, door: 0x2a2d33, ds: 'vitre', curt: 0xfff8e8, pane: 'grand', noChim: 1, lamp: 2, roofFn: flatRoof(1), x: { deco: 1 } },
    { n: 'Manoir Tudor', wall: 0xf3ead6, wp: PT.crepi, base: 0x9a4a32, roof: 0x4a3f3a, rp: PT.ardoise, pitch: 1.35, trim: 0x3a2a1e, frame: 0xf3ead8, door: 0x5a3a24, ds: 'planches', curt: 0xfff1d6, pane: 'petits', colombage: 0x3a2a1e, dormer: 2, lamp: 2, bigChim: 1 },
    { n: 'Hôtel particulier', wall: 0xece2cf, wp: PT.pierre, base: 0xb9b2a2, roof: 0x4a5464, rp: PT.ardoise, trim: 0xf6f0e2, frame: 0xffffff, door: 0x2a3f5a, ds: 'panneaux', shut: null, curt: 0xfff8e8, lintel: 0xe8dcc8, quoin: 0xe2d6c0, fronton: 0xe2d6c0, imposte: 1, lamp: 2, roofFn: mansardRoof() }
  ];
  const base = G.HOUSE_STYLES.length; NEW.forEach(s => G.HOUSE_STYLES.push(s));
  // modèle « maison » : on ajoute les détails spéciaux après la construction de base
  const omh = MD.house;
  MD.house = v => { const s = G.HOUSE_STYLES[v % G.HOUSE_STYLES.length]; if (!s.x) return omh(v); const b = G.mb(90 + v); A.maison(b, s); extras(b, s); return b.done(); };
  function extras(b, s) { const H = { w: 2.8, d: 2.2, zc: s.porch ? -.2 : -.08, fh: s.fh || .2, wh: 1.85 }, x = s.x, sk = SK();
    if (x.tour) tourelle(b, s, 1.2, -.1 + .9, 2.6);
    if (x.bow) bow(b, s, H);
    if (x.galerie) galerie(b, s, H);
    if (x.bardage) { b.P(PT.planches); b.box(1.0, H.wh, .04, x.bardage, -.9, H.fh + H.wh / 2, H.zc + H.d / 2 + .02); b.P(0); }
    if (x.baie) { b.S(sk.glass); b.box(1.3, 1.3, .03, GLASS, .55, H.fh + .75, H.zc + H.d / 2 + .03, 0, 0, 0, 2); b.S(sk.iron); b.box(1.36, .05, .05, 0x2a2d33, .55, H.fh + 1.42, H.zc + H.d / 2 + .04); b.box(.04, 1.36, .05, 0x2a2d33, .55, H.fh + .75, H.zc + H.d / 2 + .04); b.S(null); veranda(b, s, H); }
    if (x.bouee) { b.tor(.13, .045, 0xe8434a, -1.2, 1.2, H.zc + H.d / 2 + .06, 0, 0, 0, 0, 14); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; b.box(.05, .06, .1, 0xffffff, -1.2 + Math.cos(a) * .13, 1.2 + Math.sin(a) * .13, H.zc + H.d / 2 + .08, 0, 0, a); } b.box(.5, .04, .04, 0x8a6a46, .9, .9, H.zc + H.d / 2 + .08); }
    if (x.chim2) { b.P(PT.moellons); b.box(.5, 2.0, .5, s.base, -H.w / 2 + .15, H.fh + H.wh + .55, H.zc - .35); b.P(0); }
    if (x.zellige) { b.S(sk.ceramic); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) b.box(.1, .1, .02, (i + j) % 2 ? 0x2f8a9a : 0xf3e0c0, -.35 + i * .1, H.fh + .08 + j * .1, H.zc + H.d / 2 + .04); b.S(null); }
    if (x.creneaux) { const y = H.fh + H.wh + .4; for (let i = 0; i < 9; i++) b.box(.16, .18, .16, s.wall, -1.3 + i * .325, y + .09, H.zc + H.d / 2); }
    if (x.deco) { b.S(sk.gold); for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) b.box(.04, H.wh - .3 - k * .25, .03, GOLD, sx * (1.25 - k * .07), H.fh + (H.wh - .3 - k * .25) / 2 + .15, H.zc + H.d / 2 + .02); b.box(1.2, .05, .03, GOLD, 0, H.fh + H.wh - .1, H.zc + H.d / 2 + .02); b.S(null);
      b.cyl(.3, .3, .05, 24, GLASS, 0, H.fh + H.wh + .15, H.zc + H.d / 2 + .02, PI / 2, 0, 0, 1); b.tor(.3, .03, GOLD, 0, H.fh + H.wh + .15, H.zc + H.d / 2 + .04, 0, 0, 0, 0, 24); }
  }
  // ---------- maisons à formes spéciales ----------
  const SPEC = {};
  SPEC['Maison des Cyclades'] = v => { const b = G.mb(960), W = 0xfbfaf6, BL = 0x2f6ad8, sk = SK();
    b.P(PT.crepi); b.box(2.2, 1.9, 1.9, W, -.2, .95, -.15); b.box(1.2, 1.3, 1.4, W, .95, .65, .1); b.P(0); b.box(2.3, .1, 2.0, W, -.2, 1.95, -.15); b.box(1.3, .08, 1.5, W, .95, 1.34, .1);
    b.cyl(.55, .55, .35, 24, W, -.6, 2.15, -.35); b.S(sk.ceramic); b.add(new THREE.SphereGeometry(.58, 24, 12, 0, TAU, 0, PI / 2), BL, b.M(-.6, 2.32, -.35), 0, true); b.S(null); b.sph(.05, W, -.6, 2.95, -.35); b.box(.03, .3, .03, W, -.6, 3.1, -.35); b.box(.16, .03, .03, W, -.6, 3.15, -.35);
    for (const [x, y, z] of [[-.7, 1.0, .8], [.25, 1.0, .8], [.95, .7, .81]]) { b.box(.38, .55, .05, BL, x, y, z); b.box(.3, .46, .03, 0xdff0ff, x, y, z + .03, 0, 0, 0, 1); }
    b.box(.5, 1.05, .06, BL, -.2, .55, .8); b.add(new THREE.CylinderGeometry(.25, .25, .06, 14, 1, false, -PI / 2, PI), BL, b.M(-.2, 1.07, .8, -PI / 2, 0, 0));
    b.S(sk.leaf); for (let i = 0; i < 9; i++) b.blob(.13, 1, 0x3f8a3a, .6 + (i % 3) * .2, 1.2 + Math.floor(i / 3) * .2, .85); b.S(sk.petal); for (let i = 0; i < 16; i++) b.sph(.045, 0xd23f8f, .55 + (i % 4) * .13, 1.15 + Math.floor(i / 4) * .14, .95); b.S(null);
    b.P(PT.pierre); b.box(2.9, .12, 2.6, 0xe8e2d6, 0, .06, 0); for (let i = 0; i < 3; i++) b.box(.8 - i * .1, .1, .25, 0xe8e2d6, -.2, .06 + i * .02, 1.15 + i * .1); b.P(0); return b.done(); };
  SPEC['Maison en A'] = v => { const b = G.mb(961), wood = 0x8a5a36, sk = SK();
    b.P(PT.pierre); b.box(2.6, .2, 2.6, STONE, 0, .1, -.1); b.P(0);
    const h = 3.2; b.P(PT.planches); for (const s of [-1, 1]) b.box(2.25, .1, 2.5, 0x4a3f3a, s * .66, h / 2 + .05, -.1, 0, 0, s * -1.05); b.P(0);
    b.P(PT.planches); b.box(.04, .04, .04, wood, 0, 0, 0); b.P(0);
    const P = []; for (const z of [1.13, -1.33]) P.push(-1.2, .2, z, 1.2, .2, z, 0, h, z); { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); b.P(PT.planches); b.geo(g, wood, b.M()); b.P(0); }
    b.S(sk.glass); { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.95, .45, 1.16, .95, .45, 1.16, 0, 2.6, 1.16], 3)); b.geo(g, GLASS, b.M(), 1); } b.S(null);
    for (const x of [-.45, 0, .45]) b.box(.04, 2.0, .05, 0x2a2d33, x, 1.35, 1.18); b.box(1.8, .04, .05, 0x2a2d33, 0, 1.4, 1.18);
    b.P(PT.planches); b.box(1.8, .08, .5, 0xa8774a, 0, .24, 1.4); b.P(0); for (const x of [-.8, .8]) b.box(.05, .5, .05, wood, x, .5, 1.6); b.box(1.7, .04, .04, wood, 0, .75, 1.6);
    b.box(.5, 1.0, .06, 0x3a5a3a, .55, .72, 1.17); b.S(sk.gold); b.sph(.03, GOLD, .4, .7, 1.22); b.S(null); A.cheminee(b, .4, -.6, 2.0, 3.4, 0x6f6a63); return b.done(); };
  SPEC['Maison champignon'] = v => { const b = G.mb(962), sk = SK();
    b.P(PT.moellons); b.cyl(1.0, 1.1, 1.9, 24, 0xe8dcc8, 0, .95, -.1); b.P(0);
    b.add(new THREE.SphereGeometry(1.55, 32, 16, 0, TAU, 0, PI / 2.2), 0xd8302a, b.M(0, 1.75, -.1, 0, 0, 0, 1, .75, 1), 0, true); b.cyl(1.32, 1.1, .2, 28, 0xf3e6c8, 0, 1.78, -.1);
    for (let i = 0; i < 14; i++) { const a = i * 2.4, e = .3 + (i % 4) * .22; b.sph(.14 + (i % 3) * .05, 0xfaf8f2, Math.cos(a) * Math.cos(e) * 1.45, 1.75 + Math.sin(e) * 1.1, -.1 + Math.sin(a) * Math.cos(e) * 1.45, 1, .5, 1); }
    b.box(.55, 1.05, .1, 0x6b4a32, 0, .55, .96); b.add(new THREE.CylinderGeometry(.275, .275, .1, 14, 1, false, -PI / 2, PI), 0x6b4a32, b.M(0, 1.07, .96, -PI / 2, 0, 0)); b.S(sk.gold); b.sph(.03, GOLD, .15, .6, 1.02); b.S(null);
    for (const a of [-.9, .9]) { const x = Math.sin(a) * 1.02, z = Math.cos(a) * 1.02 - .1; b.cyl(.2, .2, .06, 16, 0x6b4a32, x, 1.15, z, PI / 2, a, 0); b.cyl(.15, .15, .07, 16, 0xfff0c2, x, 1.15, z + .01, PI / 2, a, 0, 1); }
    b.S(sk.leaf); for (let i = 0; i < 7; i++) b.blob(.15, 1, i % 2 ? 0x4fa847 : 0x3f8f45, -1.1 + i * .37, .18, 1.05); b.S(sk.petal); for (let i = 0; i < 10; i++) b.sph(.045, [0xffd23f, 0xff8fc0, 0xffffff][i % 3], -1.1 + i * .25, .34, 1.12); b.S(null);
    b.P(PT.pierre); for (let i = 0; i < 4; i++) b.cyl(.18, .18, .05, 10, 0xb9b2a2, (i % 2 ? .1 : -.1), .03, 1.25 + i * .22); b.P(0); return b.done(); };
  SPEC['Maison en pain d\'épices'] = v => { const b = G.mb(963), CK = 0xa8683a, IC = 0xfffaf6, sk = SK(), H = { w: 2.6, d: 2.1, zc: -.1, fh: .15, wh: 1.7 };
    b.box(H.w, H.wh, H.d, CK, 0, H.fh + H.wh / 2, H.zc); b.box(H.w + .1, H.fh, H.d + .1, 0x8a4f2a, 0, H.fh / 2, H.zc);
    const R = A.toitX(b, H, { col: 0xf3a0b8, pat: PT.tuiles, wall: CK, pitch: .95, fascia: IC });
    for (let i = 0; i < 22; i++) b.sph(.045, IC, -H.w / 2 - .2 + i * (H.w + .4) / 21, R.yE - .04, H.zc + H.d / 2 + .3, 1, 1.4, 1);
    b.S(sk.plastic); for (let i = 0; i < 8; i++) b.sph(.06, [0xe8434a, 0x4fb35f, 0xffd23f, 0x5b8fd6][i % 4], -1.05 + i * .3, H.fh + H.wh - .1, H.zc + H.d / 2 + .04, 1, 1, .5); b.S(null);
    b.box(.55, 1.1, .06, 0xe8434a, 0, H.fh + .55, H.zc + H.d / 2 + .02); for (let k = 0; k < 5; k++) b.box(.6, .03, .07, IC, 0, H.fh + .1 + k * .25, H.zc + H.d / 2 + .03, 0, 0, k % 2 ? .3 : -.3);
    for (const x of [-.85, .85]) { b.box(.5, .5, .05, IC, x, H.fh + 1.0, H.zc + H.d / 2 + .02); b.box(.4, .4, .06, 0xfff0c2, x, H.fh + 1.0, H.zc + H.d / 2 + .03, 0, 0, 0, 1); }
    b.cyl(.06, .06, .9, 12, 0xffffff, -1.3, .45, H.zc + H.d / 2 + .25); for (let k = 0; k < 6; k++) b.cyl(.062, .062, .06, 12, 0xe8434a, -1.3, .1 + k * .15, H.zc + H.d / 2 + .25); b.tor(.1, .04, 0xffffff, -1.2, .9, H.zc + H.d / 2 + .25, 0, 0, 0, 0, 12);
    b.cyl(.06, .06, .9, 12, 0xffffff, 1.3, .45, H.zc + H.d / 2 + .25); for (let k = 0; k < 6; k++) b.cyl(.062, .062, .06, 12, 0x4fb35f, 1.3, .1 + k * .15, H.zc + H.d / 2 + .25);
    A.cheminee(b, .8, H.zc - .4, R.yT + .2, R.top + .3, 0xa8683a); return b.done(); };
  for (const n in SPEC) G.HOUSE_STYLES.push({ n, spec: SPEC[n] });
  const omh2 = MD.house; MD.house = v => { const s = G.HOUSE_STYLES[v % G.HOUSE_STYLES.length]; if (s && s.spec) return s.spec(v); return omh2(v); };
  // ---------- objets et objets d'inventaire ----------
  for (let k = base; k < G.HOUSE_STYLES.length; k++) { const id = 'maison_s' + k, s = G.HOUSE_STYLES[k];
    O[id] = { id, n: s.n, model: 'house', v: k, h: 3.4, fp: [3, 3], enter: 'maison', take: 1, cat: 'construction' };
    G.ITEMS[id] = { id, n: s.n, stack: 1, sell: 150, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id }; }
})();
