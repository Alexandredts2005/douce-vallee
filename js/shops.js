'use strict';
// ===== Boutiques de la rue commerçante : café, salon de coiffure, chausseur, jardinerie, agence, club des émotes (façades, intérieurs, commerçants) =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, WIN = 0xfff0c2, P = (...a) => G.prism(...a), win = (...a) => G.windowAt(...a);
  const base = (b, w, d = 2.4) => b.box(w + .1, .16, d, 0xb9a58a, 0, .08, -.05);
  const door = (b, x, z, col, w = .66) => { b.box(w, 1.2, .08, col, x, .76, z); b.box(w + .08, .07, .1, 0xf7f5ee, x, 1.38, z); b.sph(.04, 0xffd23f, x + w * .32, .74, z + .05); b.box(w + .2, .07, .4, 0xd9d2c2, x, .04, z + .22); };
  const awning = (b, w, z, y, c1, c2, n = 6) => { for (let i = 0; i < n; i++) b.box(w / n + .005, .07, .62, i % 2 ? c2 : c1, -w / 2 + (i + .5) * w / n, y, z, .42); b.box(w + .04, .12, .06, c1, 0, y - .2, z + .27); };
  // ---------- façades ----------
  MD.cafe = v => {
    const b = G.mb(150), W = 0xf3e2c4, BR = 0x9a4f36; base(b, 2.7);
    b.box(2.6, 2.3, 2.2, W, 0, 1.3, -.1); b.jit(.1); b.box(2.64, .62, 2.24, BR, 0, .47, -.1); b.jit(0); b.box(2.72, .1, 2.32, 0x6b4426, 0, .82, -.1);
    P(b, 3.1, 1.0, 2.7, 0x5a3a2a, 0, 2.42, -.1, Math.PI / 2); P(b, 2.6, .84, 2.22, W, 0, 2.42, -.1, Math.PI / 2);
    b.box(1.1, .78, .06, WIN, -.55, 1.18, 1.0, 0, 0, 0, 1); b.box(1.2, .07, .1, 0x6b4426, -.55, 1.6, 1.02); b.box(1.2, .07, .1, 0x6b4426, -.55, .77, 1.02); b.box(.05, .78, .08, 0x6b4426, -.55, 1.18, 1.03);
    door(b, .72, 1.0, 0x2f6b45); awning(b, 2.6, 1.22, 1.85, 0x2f6b45, 0xf7f5ee);
    b.box(1.5, .34, .07, 0x2f2a26, 0, 2.2, 1.03); b.box(1.3, .06, .08, 0xe8c27a, 0, 2.2, 1.06);
    b.cyl(.42, .42, .05, 16, 0xf7f5ee, 0, 3.04, .1); b.cyl(.27, .21, .42, 14, 0xf7f5ee, 0, 3.27, .1, 0, 0, 0, 0, true); b.cyl(.24, .24, .02, 14, 0x5a3420, 0, 3.47, .1);
    b.add(new THREE.TorusGeometry(.12, .035, 6, 12), 0xf7f5ee, b.M(.3, 3.27, .1), 0, true);
    b.sph(.07, 0xffffff, -.04, 3.63, .1, 1, 1, 1, 2); b.sph(.06, 0xffffff, .05, 3.76, .1, 1, 1, 1, 2);
    return b.done();
  };
  MD.salon = v => {
    const b = G.mb(151), W = 0xffd9e8, T = 0xffffff; base(b, 2.7);
    b.box(2.6, 2.3, 2.2, W, 0, 1.3, -.1); b.box(2.62, .24, 2.22, T, 0, .28, -.1);
    P(b, 3.1, 1.15, 2.7, 0xb06ab3, 0, 2.42, -.1, Math.PI / 2); P(b, 2.6, .98, 2.22, W, 0, 2.42, -.1, Math.PI / 2);
    b.cyl(.38, .38, .06, 18, WIN, -.6, 1.25, 1.0, Math.PI / 2, 0, 0, 1); b.add(new THREE.TorusGeometry(.4, .05, 6, 20), T, b.M(-.6, 1.25, 1.03), 0, true);
    door(b, .7, 1.0, 0xffffff); awning(b, 2.6, 1.22, 1.9, 0xb06ab3, 0xffffff);
    for (let i = 0; i < 7; i++) b.cyl(.07, .07, .14, 10, [0xe8434a, 0xffffff, 0x4a7fd1][i % 3], 1.42, .55 + i * .14, 1.06); b.sph(.09, 0xf7f5ee, 1.42, 1.58, 1.06);
    for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(.11, .03, 6, 14), 0xd9b84a, b.M(-.18 * s, 2.0, 1.06), 0, true); b.box(.06, .6, .03, 0xc9ccd2, .1 * s, 2.36, 1.06, 0, 0, s * .35); }
    return b.done();
  };
  MD.chausseur = v => {
    const b = G.mb(152), W = 0xeed9b5, T = 0x2f6b6b; base(b, 2.7);
    b.box(2.6, 2.3, 2.2, W, 0, 1.3, -.1); b.box(2.64, .2, 2.24, T, 0, .26, -.1); b.box(2.66, .14, 2.26, T, 0, 2.38, -.1);
    P(b, 3.0, .9, 2.6, T, 0, 2.45, -.1, Math.PI / 2); P(b, 2.6, .78, 2.22, W, 0, 2.45, -.1, Math.PI / 2);
    b.box(1.1, .8, .06, WIN, -.55, 1.15, 1.0, 0, 0, 0, 1); b.box(1.18, .07, .1, T, -.55, 1.58, 1.02); b.box(1.18, .07, .1, T, -.55, .74, 1.02);
    [0xe8434a, 0x5b8fd6, 0xffd23f].forEach((c, i) => { b.box(.2, .1, .3, c, -.88 + i * .33, .86, .9); b.box(.08, .12, .1, c, -.94 + i * .33, .95, .82); });
    door(b, .72, 1.0, T); awning(b, 2.6, 1.22, 1.85, 0xf29a3a, 0xffffff);
    b.box(.06, .06, .5, 0x2a2d33, 1.25, 2.05, 1.2); b.box(.3, .45, .22, 0x8a5a34, 1.25, 1.75, 1.45); b.box(.48, .17, .22, 0x8a5a34, 1.34, 1.47, 1.45); b.box(.31, .05, .23, 0xf7f5ee, 1.25, 1.95, 1.45);
    for (let i = 0; i < 3; i++) b.box(.2, .02, .24, 0xf7f5ee, 1.25, 1.62 + i * .09, 1.46);
    return b.done();
  };
  MD.jardinerie = v => {
    const b = G.mb(153), BR = 0x9a4f36, F = 0xf7f5ee; base(b, 3.7);
    b.jit(.1); b.box(3.5, .5, 2.2, BR, 0, .41, -.1); b.jit(0);
    b.jit(.15); for (let i = 0; i < 9; i++) b.ico(.24 + (i % 3) * .05, 1, [0x3f8f45, 0x58b54a, 0x4a9e4f][i % 3], -1.4 + i * .35, .85 + (i % 2) * .15, -.5 + (i % 3) * .25); b.jit(0);
    [[-1.1, 0xe8434a], [-.3, 0xffd23f], [.5, 0xff8fc0], [1.2, 0x6c8cff]].forEach(([x, c]) => b.sph(.1, c, x, 1.08, .35));
    b.box(3.42, 1.45, 2.12, 0xd8f3e0, 0, 1.38, -.1, 0, 0, 0, 2);
    for (let i = 0; i <= 5; i++) { const x = -1.71 + i * .684; b.box(.06, 1.45, .06, F, x, 1.38, .96); b.box(.06, 1.45, .06, F, x, 1.38, -1.16); }
    for (const z of [.96, -1.16]) { b.box(3.48, .06, .06, F, 0, 2.1, z); b.box(3.48, .05, .05, F, 0, 1.38, z); }
    for (const x of [-1.71, 1.71]) { b.box(.06, 1.45, 2.1, F, x, 1.38, -.1); }
    b.geo(new THREE.CylinderGeometry(1.06, 1.06, 3.42, 14, 1, true, 0, Math.PI), 0xd8f3e0, b.M(0, 2.1, -.1, 0, Math.PI / 2, Math.PI / 2), 2);
    for (let i = 0; i <= 4; i++) b.add(new THREE.TorusGeometry(1.06, .03, 4, 14, Math.PI), F, b.M(-1.7 + i * .85, 2.1, -.1, 0, Math.PI / 2, 0), 0, true);
    b.box(.9, 1.2, .1, 0x6b4426, 0, .76, 1.02); b.box(.04, 1.15, .11, 0x4f2f1a, 0, .76, 1.03); b.box(1.1, .07, .4, 0xd9d2c2, 0, .04, 1.25);
    b.box(.08, 1.1, .08, 0x6b4426, -1.45, .55, 1.4); b.box(.8, .36, .06, 0xc69c68, -1.45, 1.22, 1.42); b.sph(.1, 0x58b54a, -1.45, 1.47, 1.42, 1.4, .7, .4);
    return b.done();
  };
  MD.agence = v => {
    const b = G.mb(154), W = 0xe3eaf3, T = 0x3d4f7a; base(b, 2.7);
    b.box(2.6, 2.4, 2.2, W, 0, 1.36, -.1); b.box(2.64, .22, 2.24, 0xb9c4d4, 0, .27, -.1);
    P(b, 3.15, 1.25, 2.75, T, 0, 2.55, -.1, Math.PI / 2); P(b, 2.6, 1.05, 2.22, W, 0, 2.55, -.1, Math.PI / 2);
    for (const x of [-.82, .82]) { win(b, x, 1.85, 1.0, 0, .5, .5); b.box(.14, .55, .05, 0x5b8fd6, x - .35, 1.85, 1.02); b.box(.14, .55, .05, 0x5b8fd6, x + .35, 1.85, 1.02); }
    door(b, 0, 1.0, 0x3d4f7a, .7); for (const x of [-.52, .52]) b.cyl(.07, .08, 1.45, 10, 0xffffff, x, .9, 1.15, 0, 0, 0, 0, true); P(b, 1.3, .35, .4, 0xffffff, 0, 1.6, 1.15);
    b.box(1.3, .34, .07, 0xffffff, 0, 2.62, .95); b.box(.36, .24, .1, 0xf3d9b0, -.45, 2.62, .99); P(b, .46, .22, .12, 0xd9544d, -.45, 2.74, .99); b.box(.7, .05, .08, T, .2, 2.66, .99); b.box(.5, .04, .08, T, .1, 2.57, .99);
    b.box(.34, .8, .34, 0xa9553e, .8, 3.0, -.6); return b.done();
  };
  MD.club = v => {
    const b = G.mb(155), W = 0x5b3f8f, T = 0xffd23f; base(b, 2.7);
    b.box(2.6, 2.5, 2.2, W, 0, 1.41, -.1); b.box(2.72, .2, 2.32, 0x3f2a66, 0, 2.7, -.1); b.box(2.64, .24, 2.24, 0x3f2a66, 0, .28, -.1);
    b.box(.78, 1.25, .08, 0xc0283a, 0, .79, 1.0); for (let i = 0; i < 4; i++) b.box(.04, 1.2, .09, 0x9a1f2e, -.27 + i * .18, .79, 1.01); b.box(1.0, .1, .12, T, 0, 1.47, 1.02);
    for (let i = 0; i < 11; i++) b.sph(.045, 0xfff3b0, -.55 + i * .11, 1.62, 1.06, 1, 1, 1, 1);
    for (const x of [-.55, .55]) for (let k = 0; k < 4; k++) b.sph(.045, 0xfff3b0, x, .5 + k * .3, 1.06, 1, 1, 1, 1);
    [[-1.0, 0xff8fc0], [1.0, 0x6fe3d0]].forEach(([x, c]) => { b.box(.48, .66, .04, c, x, 1.35, 1.0); b.sph(.12, 0xffffff, x, 1.45, 1.03, 1, 1, .3); });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.geo(new THREE.ConeGeometry(.16, .55, 3), T, b.M(Math.sin(a) * .26, 3.2 + Math.cos(a) * .26, .5, 0, 0, -a), 1); } b.cyl(.2, .2, .1, 10, T, 0, 3.2, .5, Math.PI / 2, 0, 0, 1);
    b.box(.06, .5, .06, 0x2a2d33, 0, 2.95, .5); b.box(1.8, .22, .05, 0xff5fa8, 0, 2.45, 1.02, 0, 0, 0, 1);
    return b.done();
  };
  // ---------- mobilier des boutiques ----------
  MD.percolateur = v => { const b = G.mb(156); b.box(.85, .82, .55, 0x6b4426, 0, .41, 0); b.box(.9, .05, .6, 0xc69c68, 0, .84, 0); b.box(.42, .46, .32, 0xc9ccd2, 0, 1.1, -.05); b.box(.3, .1, .2, 0x2a2d33, 0, 1.36, -.05); b.cyl(.04, .04, .12, 6, 0x2a2d33, -.08, .98, .12); b.cyl(.07, .06, .1, 8, 0xf7f5ee, .25, .92, .15); b.cyl(.07, .06, .1, 8, 0xf7f5ee, -.28, .92, .1); b.sph(.03, 0xe8434a, .12, 1.2, .12, 1, 1, 1, 1); return b.done(); };
  MD.tabouret = v => { const b = G.mb(157); b.cyl(.2, .2, .07, 12, 0xc0283a, 0, .62, 0); b.cyl(.04, .05, .58, 6, 0xc9ccd2, 0, .3, 0); b.cyl(.18, .2, .04, 10, 0xc9ccd2, 0, .02, 0); b.add(new THREE.TorusGeometry(.13, .015, 4, 12), 0xc9ccd2, b.M(0, .25, 0, Math.PI / 2, 0, 0), 0, true); return b.done(); };
  MD.fauteuil_coif = v => { const b = G.mb(158); b.box(.6, .12, .55, 0xf08bb0, 0, .45, 0); b.box(.6, .62, .1, 0xf08bb0, 0, .75, -.24); for (const x of [-.32, .32]) b.box(.08, .25, .5, 0xf7f5ee, x, .6, 0); b.cyl(.06, .1, .38, 8, 0xc9ccd2, 0, .2, 0); b.cyl(.24, .26, .04, 12, 0xc9ccd2, 0, .02, 0); b.box(.05, .7, .05, 0xc9ccd2, 0, 1.25, -.32); b.sph(.27, 0xf7f5ee, 0, 1.38, -.12, 1, .8, 1.05); b.sph(.22, 0xb06ab3, 0, 1.33, -.07, 1, .7, 1); return b.done(); };
  MD.rayon_chaussures = v => { const b = G.mb(159); b.box(1.9, 1.6, .45, 0xd4a46c, 0, .8, -.02); const r = G.rng(8); for (let s = 0; s < 3; s++) { b.box(1.85, .04, .46, 0x85552f, 0, .32 + s * .48, 0); for (let i = 0; i < 4; i++) { const c = [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffc23d, 0xff8fc0, 0x2a2d33, 0xf7f5ee][Math.floor(r() * 7)], x = -.7 + i * .46; for (const d of [-.07, .07]) { b.box(.11, .08, .24, c, x + d, .39 + s * .48, .04); b.box(.1, .12, .08, c, x + d, .44 + s * .48, -.05); } } } return b.done(); };
  MD.scene_club = v => { const b = G.mb(160); b.box(2.9, .4, 1.9, 0x6b4426, 0, .2, 0); b.box(2.95, .06, 1.95, 0xc69c68, 0, .42, 0); for (const x of [-1.35, 1.35]) { b.box(.3, 2.4, .2, 0xc0283a, x, 1.6, -.7); for (let k = 0; k < 3; k++) b.box(.06, 2.3, .22, 0x9a1f2e, x - .1 + k * .1, 1.6, -.69); } b.box(3.0, .35, .25, 0xc0283a, 0, 2.7, -.7); b.box(3.1, .08, .3, 0xffd23f, 0, 2.52, -.68); for (const x of [-.9, 0, .9]) { b.sph(.09, 0xfff3b0, x, 2.6, -.5, 1, 1, 1, 1); } b.cyl(.015, .02, 1.1, 5, 0x2a2d33, .6, .95, .3); b.sph(.05, 0x2a2d33, .6, 1.52, .3); return b.done(); };
  MD.maquette = v => { const b = G.mb(161); b.box(.7, .8, .7, 0xf7f5ee, 0, .4, 0); b.box(.76, .05, .76, 0xd9d2c2, 0, .82, 0); b.box(.4, .26, .32, 0xfaf1dc, 0, .98, 0); P(b, .5, .2, .4, [0xd9544d, 0x4a7fd1, 0x55a85a][v % 3], 0, 1.11, 0, Math.PI / 2); b.box(.08, .14, .02, 0x85552f, 0, .92, .17); b.sph(.06, 0x58b54a, .26, .92, .2); return b.done(); };
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p);
  obj('cafe', 'Café Le Perchoir', 'cafe', { h: 3.2, fp: [3, 3], enter: 'cafe' });
  obj('salon', 'Salon Frisette', 'salon', { h: 3.2, fp: [3, 3], enter: 'salon' });
  obj('chausseur', 'Chausseur Lacet', 'chausseur', { h: 3.2, fp: [3, 3], enter: 'chausseur' });
  obj('jardinerie', 'Jardinerie Feuillu', 'jardinerie', { h: 3.2, fp: [4, 3], enter: 'jardinerie' });
  obj('agence', 'Agence Nid Douillet', 'agence', { h: 3.4, fp: [3, 3], enter: 'agence' });
  obj('club', 'Club Rire', 'club', { h: 3.2, fp: [3, 3], enter: 'club' });
  obj('percolateur', 'Percolateur', 'percolateur', { h: 1.0, take: 1, cat: 'mobilier' });
  obj('tabouret', 'Tabouret de bar', 'tabouret', { h: .6, walk: 1, sit: 1, take: 1, cat: 'mobilier' });
  obj('fauteuil_coif', 'Fauteuil de coiffure', 'fauteuil_coif', { h: .55, sit: 1, take: 1, cat: 'mobilier' });
  obj('rayon_chaussures', 'Étagère à chaussures', 'rayon_chaussures', { h: 1.6, fp: [2, 1], take: 1, cat: 'mobilier' });
  obj('scene_club', 'Petite scène', 'scene_club', { h: .42, walk: 1, fp: [3, 2], take: 1, cat: 'mobilier' });
  obj('maquette', 'Maquette de maison', 'maquette', { h: 1.1, take: 1, cat: 'mobilier' });
  for (const id of ['percolateur', 'tabouret', 'fauteuil_coif', 'rayon_chaussures', 'scene_club', 'maquette']) G.ITEMS[id] = { id, n: O[id].n, kind: 'place', obj: id, cat: 'mobilier', thumb: 'obj:' + id, sell: 250, stack: O[id].fp[0] * O[id].fp[1] > 2 ? 1 : 99 };
  // ---------- intérieurs ----------
  Object.assign(G.ROOMKINDS, {
    cafe: { W: 9, H: 7, floor: 'parquet_fonce', wall: 'lambris', trim: 0x6b4426 }, salon: { W: 8, H: 7, floor: 'damier_noir', wall: 'rose', trim: 0xb06ab3 },
    chausseur: { W: 7, H: 6, floor: 'bois_clair', wall: 'briques', trim: 0x2f6b6b }, jardinerie: { W: 9, H: 7, floor: 'pierre', wall: 'jungle', trim: 0x6b4426 },
    agence: { W: 8, H: 7, floor: 'moquette', wall: 'carreaux', trim: 0x3d4f7a }, club: { W: 9, H: 7, floor: 'damier_noir', wall: 'etoiles', trim: 0xffd23f }
  });
  Object.assign(G.ROOMFILL, {
    cafe: (m, P) => { P('comptoir', 3, 1); P('percolateur', 6, 1); P('etagere', 0, 0); P('etagere', 8, 0); for (const x of [3, 4, 5]) P('tabouret', x, 2); P('table', 1, 4); P('chaise', 1, 5, 2); P('chaise', 0, 4, 1); P('table', 7, 4); P('chaise', 7, 5, 2); P('chaise', 8, 4, 3); P('plante', 0, 6); P('plante', 8, 6); P('lampe', 2, 0); P('lampe', 7, 2); P('lanterne', 6, 6); },
    salon: (m, P) => { P('miroir', 2, 0); P('miroir', 5, 0); P('fauteuil_coif', 2, 1, 2); P('fauteuil_coif', 5, 1, 2); P('canape', 1, 5); P('plante', 0, 0); P('plante', 7, 0); P('pot_fleurs', 7, 5); P('lampe', 0, 3); P('lampe', 7, 3); P('tapis', 3, 3); },
    chausseur: (m, P) => { P('rayon_chaussures', 0, 0); P('rayon_chaussures', 5, 0); P('comptoir', 2, 1); P('banc', 1, 4); P('miroir', 6, 3); P('plante', 0, 3); P('lampe', 5, 4); P('lampe', 0, 2); },
    jardinerie: (m, P) => { P('comptoir', 3, 1); for (const x of [0, 1, 7, 8]) P('plante', x, 0); for (const x of [1, 2, 6, 7]) P('pot_fleurs', x, 4); P('tonneau', 0, 5); P('tonneau', 8, 5); P('lanterne', 2, 0); P('lanterne', 6, 0); P('lampe', 8, 2); P('arrosoir_deco', 0, 2); },
    agence: (m, P) => { P('bureau', 3, 1); P('chaise', 3, 3, 2); P('chaise', 4, 3, 2); P('maquette', 0, 0, 0, { v: 0 }); P('maquette', 7, 0, 0, { v: 1 }); P('maquette', 0, 3, 0, { v: 2 }); P('plante', 7, 5); P('tableau', 5, 0); P('lampe', 1, 1); P('lampe', 6, 2); P('tapis', 3, 4); },
    club: (m, P) => { P('scene_club', 3, 0); P('table', 1, 3); P('chaise', 0, 3, 1); P('table', 7, 3); P('chaise', 8, 3, 3); P('table', 1, 5); P('table', 7, 5); P('lampe', 0, 0); P('lampe', 8, 0); P('lanterne', 2, 2); P('lanterne', 6, 2); P('tapis', 3, 3); }
  });
  Object.assign(G.ROOMNPC, { cafe: ['cafe', 4.5, .6], salon: ['salon', 3.6, 2.4], chausseur: ['chausseur', 3.5, .55], jardinerie: ['jardin', 4.5, .6], agence: ['agence', 4, .6], club: ['club', 4.5, 1.1] });
  Object.assign(G.NPCS, {
    cafe: { n: 'Robusto', sp: 'pigeon', col: 0x9aa3b8, shirt: 0x6b4426, apron: 0xf7f5ee, pitch: .85 },
    salon: { n: 'Frisette', sp: 'caniche', col: 0xffe4ef, shirt: 0xb06ab3, pitch: 1.35, eyes: 'doux' },
    chausseur: { n: 'Lacet', sp: 'mouffette', col: 0x3a3440, shirt: 0xe8a23a, pitch: 1.05 },
    jardin: { n: 'Feuillu', sp: 'paresseux', col: 0xa08a6a, shirt: 0x4fb35f, apron: 0x2f8a45, pitch: .7, eyes: 'doux' },
    agence: { n: 'Léon', sp: 'loutre', col: 0xa0724a, shirt: 0x3d4f7a, pitch: 1.0 },
    club: { n: 'Dr Rigolo', sp: 'axolotl', col: 0xffb3c8, shirt: 0x5b3f8f, pitch: 1.45, eyes: 'anime' }
  });
  // un arrosoir décoratif pour la jardinerie (ne se ramasse pas)
  MD.arrosoir_deco = v => { const b = G.mb(162); b.cyl(.18, .2, .3, 10, 0x4fb35f, 0, .15, 0); b.cyl(.025, .035, .35, 6, 0x4fb35f, .26, .25, 0, 0, 0, -.9); b.add(new THREE.TorusGeometry(.12, .02, 4, 10, Math.PI), 0x3f8f45, b.M(-.05, .3, 0), 0, true); return b.done(); };
  obj('arrosoir_deco', 'Arrosoir', 'arrosoir_deco', { h: .35 });
  // ---------- commerçants ----------
  const say = (v, l, c) => G.npcSay(v, l, c), PN = () => G.playerName, surv = () => G.mode === 'survie';
  const later = f => setTimeout(f, 60);
  const pay = (n, v, ok) => { if (!surv() || !n) return ok(); if (G.coins < n) return say(v, ['Oh… il te manque ' + (n - G.coins).toLocaleString('fr-FR') + ' clochettes. Reviens quand tu les auras !']); G.coins -= n; G.ui.dirtyHud(); G.sfx('coin'); return ok(); };
  const price = n => surv() ? ' (' + n.toLocaleString('fr-FR') + ' 🔔)' : '';
  G.npcRoles.cafe = v => say(v, [G.pick(['Roucou… Bienvenue au Perchoir, ' + PN() + '.', 'Roucou. Un bon café bien chaud, ' + PN() + ' ?', 'Ah, ' + PN() + '. Ta table habituelle est libre. Roucou.'])], ['Un café' + price(200), 'Bavarder', 'Au revoir']).then(k => {
    if (k === 0) return pay(200, v, () => { const p = G.player; p.food = Math.min(10, p.food + 3); p.hp = Math.min(10, p.hp + 1); G.ui.dirtyHud(); G.flags.cafe = (G.flags.cafe || 0) + 1; G.sfx('eat'); G.popup('☕', p.x, p.y + 1.6, p.z, 'gold');
      const l = [G.pick(['Voilà. Un mélange maison, torréfié avec amour. Roucou.', 'Un moka des montagnes. Doux comme un nuage. Roucou.', 'Un petit noir bien serré. Ça réveille les plumes !'])];
      if (G.flags.cafe === 5) { l.push('Te voilà un·e vrai·e habitué·e… Tiens, ce percolateur est pour ta maison.'); later(() => { G.act.give('percolateur', 1); G.sfx('fanfare'); }); } return say(v, l); });
    if (k === 1) return say(v, [G.pick(['Le Professeur Plume passe ici chaque matin. Toujours un double serré.', 'On dit qu\'une étoile filante exauce les vœux… Roucou.', 'Le café, c\'est comme les amis : meilleur quand on prend le temps.', 'Le soir, la rue est si calme… J\'aime entendre le train passer.', 'Frisette dit que les cheveux poussent mieux avec du café. Je n\'y crois pas trop.'])]);
  });
  const style = (v, sec, cost, title, done) => G.ui.openWardrobe({ sections: sec, title, okLabel: 'Valider' + price(cost), onDone: look => later(() => pay(cost, v, () => { G.player.setLook(look); G.sfx('fanfare'); G.ui.toast(done); })) });
  G.npcRoles.salon = v => say(v, ['Bienvenue au Salon Frisette, mon trésor ! Une petite transformation aujourd\'hui ?'], ['Coiffure' + price(300), 'Visage et yeux' + price(300), 'Au revoir']).then(k => {
    if (k === 0) style(v, ['cheveux'], 300, 'Salon Frisette — coiffure', 'Une coiffure de star ! ✨'); if (k === 1) style(v, ['visage'], 300, 'Salon Frisette — visage', 'Tu es rayonnant·e ! ✨'); });
  G.npcRoles.chausseur = v => say(v, ['Yo ' + PN() + ' ! Chez Lacet, on a les plus belles chaussures du pays. Tu essaies ?'], ['Pantalons et chaussures' + price(200), 'Au revoir']).then(k => { if (k === 0) style(v, ['bas'], 200, 'Chausseur Lacet', 'Trop classe ! 👟'); });
  const GARDEN = ['pousse', 'pommier', 'oranger', 'pecher', 'cerisier', 'buisson', 'hortensia', 'buisson_baies', 'haie', 'cloture_jardin', 'cloture_fleurie', 'portillon', 'pot_fleurs', 'plante', 'arrosoir', 'pelle',
    'tulipe_rouge', 'tulipe_jaune', 'tulipe_blanche', 'tulipe_rose', 'tulipe_bleue', 'tulipe_violette', 'tulipe_orange', 'fleur_rouge', 'fleur_jaune', 'fleur_blanche', 'fleur_rose', 'fleur_bleue', 'fleur_violette', 'fleur_orange'];
  G.npcRoles.jardin = v => say(v, ['Ooooh… bon… jour… Bienvenue… à la… jardinerie…'], ['Acheter des plantes', 'Un conseil', 'Au revoir']).then(k => {
    if (k === 0) return G.ui.openShop(v, { list: GARDEN.filter(id => G.ITEMS[id]), title: 'Jardinerie Feuillu', quote: '« Arrose… tes fleurs… chaque jour… Elles… poussent… plus vite… »', noSell: true });
    if (k === 1) return say(v, [G.pick(['Plante… une pousse… et arrose-la… En deux jours… elle devient… un arbre…', 'Les clôtures… de jardin… se raccordent… toutes seules…', 'Les fleurs… près de l\'eau… attirent… les libellules…', 'Un verger… ça rapporte… beaucoup… de clochettes…'])]); });
  const homeObj = () => G.world && [...G.world.list].find(o => o.iid === (G.homeId ? G.homeId() : 'home'));
  G.npcRoles.agence = v => say(v, ['Bonjour ' + PN() + ' ! Léon, de l\'Agence Nid Douillet. On parle de ta maison ?'], ['Agrandir ma maison', 'Repeindre la façade', 'Au revoir']).then(k => {
    if (k === 0) { const hi = G.interiors[G.homeId ? G.homeId() : 'home'], st = (hi && hi.meta.stage) || 1; if (st >= G.HOME_STAGES.length) return say(v, ['Ta maison est déjà la plus grande du village ! Bientôt, peut-être… un château ?']);
      const cost = surv() ? G.HOME_COST[st] : 0, [w, h] = G.HOME_STAGES[st];
      return say(v, ['On peut agrandir ta pièce principale à ' + w + '×' + h + ' cases' + (cost ? ' pour ' + cost.toLocaleString('fr-FR') + ' clochettes' : ', gratuitement en mode Créatif') + '. On signe ?'], ['Oui !', 'Plus tard']).then(c => { if (c !== 0) return;
        return pay(cost, v, () => { G.expandHome(); G.sfx('fanfare'); return say(v, ['Travaux terminés ! Ta maison mesure maintenant ' + w + '×' + h + '. Va vite la décorer (touche H chez toi) !']); }); }); }
    if (k === 1) { const o = homeObj(); if (!o) return say(v, ['Hmm… je ne trouve pas ta maison sur le plan du village !']);
      return say(v, ['Quelle couleur de toit te ferait plaisir ?' + (surv() ? ' C\'est 2 000 clochettes.' : '')], ['Rouge', 'Bleu', 'Rose', 'Vert']).then(c => { if (c < 0) return;
        return pay(2000, v, () => { o.v = c; G.world.refresh(o); G.sfx('craft'); return say(v, ['C\'est fait ! Ta maison a fière allure.']); }); }); } });
  G.npcRoles.club = v => {
    const known = G.flags.emotes || (G.flags.emotes = ['salut', 'rire', 'surprise', 'assis']), left = G.feat.EMOTES.map(e => e[0]).filter(e => !known.includes(e));
    if (!left.length) return say(v, ['Ha ha ha ! Tu connais toutes mes émotes ! Tu es la star du Club Rire !']);
    if (G.flags.clubDay === G.clock.day) return say(v, ['Ha ha ! Reviens demain, j\'aurai une nouvelle émote pour toi !', 'En attendant, entraîne-toi : touche G !']);
    const e = G.pick(left), E = G.feat.EMOTES.find(x => x[0] === e);
    return say(v, ['Bienvenue au Club Rire ! Ha ha ha !', 'Regarde-moi bien… et fais comme moi !'], ['Essayer !', 'Non merci']).then(c => { if (c !== 0) return; known.push(e); G.flags.clubDay = G.clock.day; G.sfx('fanfare'); G.feat.emote(e);
      return say(v, ['Bravo ! Tu as appris l\'émote « ' + E[2] + ' » ' + E[1] + ' !', 'Utilise-la avec la touche G. Reviens demain pour une autre !']); });
  };
  // ---------- on ne prend ni ne pose rien dans les commerces ni dans la rue ----------
  const HOMEK = ['maison', 'villa', 'cabane', 'tente'], locked = m => m && (m.id === 'rue' || (m.interior && !HOMEK.includes(m.kind)));
  G.isLockedMap = locked; // remplaçable (les villages visités sont aussi protégés)
  const no = () => { G.sfx('error'); G.ui.toast(G.map.visit ? 'Tu es en visite : on ne touche à rien chez les autres !' : G.map.id === 'rue' ? 'La rue commerçante appartient à la mairie : pas touche !' : 'Ce n\'est pas chez toi : on ne touche à rien !'); };
  const ot = G.act.take; G.act.take = () => { if (G.isLockedMap(G.map)) { const p = G.player, [tx, tz] = p.target(), o = G.map.objAt(tx, tz); if (o && !G.OBJ[o.t].pick) return no(); } return ot(); };
  const ou = G.act.use; G.act.use = () => { const it = G.inv.held(); if (it && G.isLockedMap(G.map) && (['place', 'surf', 'terra', 'bridge'].includes(it.kind) || ['shovel', 'axe', 'pick'].includes(it.tool))) return no(); return ou(); };
  const oh = G.act.hold; G.act.hold = () => { const it = G.inv.held(); if (it && G.isLockedMap(G.map) && ['place', 'surf', 'terra'].includes(it.kind)) return; return oh(); };
})();
