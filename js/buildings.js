'use strict';
// ===== Nouveaux bâtiments, objets, acres et personnages : mairie, musée, rue commerçante, gare, île, jeux =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2, WIN = 0xfff0c2, DW = 0x85552f, LW = 0xd4a46c, WOOD = 0xb07a48, IRON = 0x3f444c, ST = 0xd9d2c2;
  const P = (...a) => G.prism(...a), win = (...a) => G.windowAt(...a);
  const door2 = (b, x, z, col = 0x8a5a34, w = .9) => { b.box(w, 1.3, .07, col, x, .78, z); b.box(.02, 1.25, .08, 0x5a3a22, x, .78, z); b.sph(.035, 0xffd23f, x - .08, .78, z + .05); b.sph(.035, 0xffd23f, x + .08, .78, z + .05); b.box(w + .3, .1, .5, ST, x, .05, z + .25); };
  MD.mairie = v => {
    const b = G.mb(120), W = 0xf6f1e6; b.box(3.8, .22, 2.8, ST, 0, .11, -.05); b.box(3.4, 2.3, 2.1, W, 0, 1.36, -.25);
    P(b, 3.9, 1.1, 2.5, 0x55689f, 0, 2.5, -.25, Math.PI / 2); P(b, 3.4, .94, 2.12, W, 0, 2.5, -.25, Math.PI / 2);
    for (const x of [-1.25, -.42, .42, 1.25]) { b.cyl(.12, .13, 1.85, 10, 0xffffff, x, 1.15, 1.08, 0, 0, 0, 0, true); b.box(.32, .1, .32, W, x, 2.1, 1.08); }
    b.box(3.1, .22, .55, W, 0, 2.25, 1.08); P(b, 3.2, .55, .55, W, 0, 2.36, 1.08);
    door2(b, 0, .84); win(b, -1.15, 1.5, .84); win(b, 1.15, 1.5, .84);
    b.cyl(.27, .27, .06, 18, 0xffffff, 0, 2.62, 1.37, Math.PI / 2); b.add(new THREE.TorusGeometry(.27, .03, 6, 18), 0xd9b84a, b.M(0, 2.62, 1.4), 0, true); b.box(.03, .2, .02, 0x2a2a2a, 0, 2.7, 1.41); b.box(.15, .03, .02, 0x2a2a2a, .06, 2.62, 1.41);
    b.cyl(.03, .03, 1.6, 5, 0xb8b8b8, 1.75, 3.3, -.3); b.box(.6, .36, .02, 0x4fb35f, 2.06, 3.85, -.3); b.box(.6, .12, .025, 0xffffff, 2.06, 3.85, -.3);
    for (const x of [-1.7, 1.7]) { b.jit(.12); b.ico(.3, 1, 0x4fa847, x, .35, 1.2, 1, .8, 1); b.jit(0); }
    return b.done();
  };
  MD.musee = v => {
    const b = G.mb(121), W = 0xefe6d2; b.box(3.9, .3, 2.9, ST, 0, .15, 0); b.box(3.7, .14, .6, ST, 0, .34, 1.15); b.box(3.5, 2.2, 2.1, W, 0, 1.4, -.3);
    for (let i = 0; i < 6; i++) b.cyl(.11, .12, 1.95, 10, 0xffffff, -1.5 + i * .6, 1.38, 1.05, 0, 0, 0, 0, true);
    b.box(3.6, .25, .6, W, 0, 2.45, 1.0); P(b, 3.7, .75, .65, W, 0, 2.58, 1.0); P(b, 3.9, 1.0, 2.5, 0xb59e78, 0, 2.5, -.3, Math.PI / 2);
    b.sph(.75, 0x7fb6c8, 0, 3.2, -.35, 1, .8, 1, 0, 16, 10); b.cyl(.06, .06, .5, 6, 0xd9b84a, 0, 4.0, -.35);
    door2(b, 0, .78, 0x6b4a32); b.box(.5, .7, .03, 0xd9544d, -1.2, 1.5, .76); b.box(.5, .7, .03, 0x5b8fd6, 1.2, 1.5, .76);
    b.sph(.18, 0xffffff, 0, 2.78, 1.33, 1.6, .9, .3); b.box(.5, .08, .05, 0x6b4a32, 0, 2.78, 1.36);
    return b.done();
  };
  MD.couturiere = v => {
    const b = G.mb(122), W = 0xffe6ef; b.box(2.7, .16, 2.4, 0xb9a58a, 0, .08, -.05); b.box(2.6, 2, 2.2, W, 0, 1.08, -.1);
    P(b, 3.1, 1.2, 2.7, 0xe86f9c, 0, 2.06, -.1, Math.PI / 2); P(b, 2.6, 1.0, 2.22, W, 0, 2.06, -.1, Math.PI / 2);
    for (let i = 0; i < 6; i++) b.box(.44, .07, .6, i % 2 ? 0xffffff : 0xff8fc0, -1.1 + i * .44, 1.72, 1.2, .45);
    b.box(1.1, .95, .06, WIN, -.6, 1.05, 1.01, 0, 0, 0, 1); b.box(1.2, .08, .1, 0xffffff, -.6, 1.56, 1.02);
    b.sph(.12, 0xff8fc0, -.6, 1.25, 1.06); b.cone(.2, .45, 8, 0xff8fc0, -.6, .9, 1.06);
    b.box(.6, 1.15, .08, 0xb5533f, .75, .6, 1.02); b.sph(.035, 0xffd23f, .92, .62, 1.07);
    b.cyl(.16, .16, .12, 12, 0xf7f5ee, 0, 2.55, 1.06, Math.PI / 2); b.cyl(.1, .1, .14, 12, 0xff8fc0, 0, 2.55, 1.07, Math.PI / 2);
    return b.done();
  };
  MD.gare = v => {
    const b = G.mb(123); b.box(5.8, .2, 2.8, ST, 0, .1, 0); b.box(5.4, 1.05, 2, 0xc4654a, 0, .7, -.1); b.box(5.4, 1.2, 2, 0xf3e6c8, 0, 1.82, -.1);
    P(b, 5.9, 1.0, 2.5, 0x3f7a58, 0, 2.42, -.1, Math.PI / 2); P(b, 5.4, .84, 2.02, 0xf3e6c8, 0, 2.42, -.1, Math.PI / 2);
    b.box(1.2, 2.2, 1.2, 0xf3e6c8, 0, 3.0, .1); b.cone(.95, .7, 4, 0x3f7a58, 0, 4.45, .1, 0, Math.PI / 4);
    b.cyl(.38, .38, .06, 18, 0xffffff, 0, 3.4, .72, Math.PI / 2); b.add(new THREE.TorusGeometry(.38, .04, 6, 18), 0x2a2d33, b.M(0, 3.4, .75), 0, true); b.box(.035, .26, .02, 0x2a2a2a, 0, 3.5, .76); b.box(.2, .035, .02, 0x2a2a2a, .08, 3.4, .76);
    door2(b, 0, .91, 0x6b4a32, 1.1); for (const x of [-2, -1.1, 1.1, 2]) win(b, x, 1.75, .91, 0, .55, .6);
    for (const x of [-2.6, 2.6]) b.box(.18, 2.4, .18, 0xf3e6c8, x, 1.3, .9);
    b.box(5.9, .1, 1.3, 0x3f7a58, 0, 2.2, -1.6, -.12); for (const x of [-2.5, 0, 2.5]) b.cyl(.06, .06, 2.1, 6, IRON, x, 1.1, -2.1);
    b.box(1.8, .4, .06, 0x2f4f9a, 0, 2.62, .93); b.box(1.6, .1, .07, 0xffffff, 0, 2.62, .94);
    return b.done();
  };
  MD.rails = v => { const b = G.mb(124); for (let i = 0; i < 3; i++) b.box(1.1, .07, .18, 0x7a5236, 0, .035, -.33 + i * .33); for (const x of [-.32, .32]) b.box(.07, .07, 1.02, 0x9aa2ad, x, .1, 0); return b.done(); };
  MD.stand = v => {
    const b = G.mb(125); for (const sx of [-.85, .85]) for (const sz of [-.75, .75]) b.box(.1, 1.9, .1, 0xf7f5ee, sx, .95, sz);
    b.box(1.9, .9, .5, 0xffd23f, 0, .45, .6); b.box(1.95, .08, .55, 0xffffff, 0, .92, .6);
    for (let i = 0; i < 8; i++) b.geo(new THREE.ConeGeometry(1.4, .55, 2, 1, false, i / 8 * TAU, TAU / 8), i % 2 ? 0xffffff : 0xe8434a, b.M(0, 2.15, 0, 0, 0, 0, 1, 1, 1));
    [[-.85, 0xe8434a], [.85, 0x5b8fd6], [0, 0x4fb35f]].forEach(([x, c]) => { b.cyl(.005, .005, .5, 3, 0xffffff, x, 2.45, .75); b.sph(.17, c, x, 2.78, .75, 1, 1.15, 1); });
    b.box(1.4, .1, .3, WOOD, 0, 1.4, -.6); b.box(.2, .2, .2, 0xff8fc0, -.4, 1.55, -.6); b.sph(.12, 0xffc23d, .1, 1.57, -.6); b.box(.18, .26, .18, 0x5b8fd6, .5, 1.58, -.6);
    return b.done();
  };
  MD.boat = v => {
    const b = G.mb(126); b.box(1.9, .35, .8, 0xc0503c, 0, .05, 0); b.box(1.9, .1, .82, 0xffffff, 0, .25, 0); b.cone(.4, .6, 4, 0xc0503c, 1.15, .05, 0, 0, Math.PI / 4, -Math.PI / 2, 0);
    b.box(1.6, .05, .65, LW, 0, .23, 0); b.cyl(.035, .04, 1.7, 6, DW, -.1, 1.1, 0);
    P(b, .95, 1.3, .04, 0xffffff, .35, .45, 0); b.box(.3, .18, .02, 0x5b8fd6, -.1, 2.0, 0);
    return b.done();
  };
  MD.montgolfiere = v => {
    const b = G.mb(127), cols = [0xe8434a, 0xffc23d, 0x5b8fd6, 0xffffff, 0x4fb35f, 0xff8fc0, 0xff9a3c, 0x8d6fd1];
    for (let i = 0; i < 8; i++) b.add(new THREE.SphereGeometry(1.55, 3, 12, i / 8 * TAU, TAU / 8), cols[i], b.M(0, 4.3, 0, 0, 0, 0, 1, 1.18, 1), 0, true);
    b.cyl(.5, .9, .7, 10, 0xe8434a, 0, 2.75, 0, 0, 0, 0, 0, true);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + TAU / 8; b.cyl(.01, .01, 1.5, 3, 0xd9c79a, Math.cos(a) * .42, 1.75, Math.sin(a) * .42, Math.sin(a) * .18, 0, -Math.cos(a) * .18); }
    b.box(.95, .62, .95, 0xa8743f, 0, .31, 0); b.box(1.02, .08, 1.02, 0x7a5236, 0, .64, 0); for (let i = 0; i < 3; i++) b.box(.97, .03, .97, 0x8a5d38, 0, .12 + i * .17, 0);
    b.cyl(.09, .11, .22, 8, IRON, 0, 1.15, 0); b.cone(.08, .25, 6, 0xff9a3c, 0, 1.38, 0, 0, 0, 0, 3);
    return b.done();
  };
  MD.chest = v => { const b = G.mb(128); b.box(.8, .45, .55, WOOD, 0, .23, 0); b.cyl(.275, .275, .8, 10, 0xc08850, 0, .45, 0, 0, 0, Math.PI / 2, 0, true); for (const x of [-.3, .3]) b.box(.06, .74, .58, IRON, x, .32, 0); b.box(.12, .14, .05, 0xffd23f, 0, .44, .29); return b.done(); };
  MD.lockers = v => { const b = G.mb(129); b.box(1.8, 1.9, .55, 0x5b8fd6, 0, .95, 0); for (let i = 0; i < 4; i++) { const x = -.68 + i * .45; for (const y of [.5, 1.4]) { b.box(.4, .78, .02, 0x6fa0e6, x, y, .28); b.box(.06, .04, .02, 0xffffff, x + .1, y + .2, .29); b.box(.12, .02, .02, 0x2a3b55, x, y + .3, .29); } } return b.done(); };
  MD.mirror = v => { const b = G.mb(130); b.box(.5, .08, .4, DW, 0, .04, 0); b.box(.08, .4, .08, DW, 0, .25, 0); b.sph(.36, 0xd4a46c, 0, 1.15, 0, .9, 1.35, .15); b.sph(.31, 0xd8f0ff, 0, 1.15, .02, .9, 1.35, .12, 1); return b.done(); };
  MD.counter = v => { const b = G.mb(131); b.box(2.9, .95, .7, LW, 0, .48, 0); b.box(3, .08, .8, WOOD, 0, .99, 0); b.box(2.8, .7, .02, 0xe8c27a, 0, .5, .36); b.box(.3, .2, .25, 0x2a2d33, .9, 1.13, 0); b.box(.25, .05, .2, 0xffd23f, .9, 1.25, 0); return b.done(); };
  MD.shelfshop = v => { const b = G.mb(132); b.box(1.9, 1.6, .5, LW, 0, .8, -.05); const r = G.rng(5); for (let s = 0; s < 3; s++) { b.box(1.85, .04, .5, DW, 0, .3 + s * .5, 0); for (let i = 0; i < 6; i++) { const c = [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffc23d, 0xff8fc0, 0xffffff][Math.floor(r() * 6)]; if (r() < .5) b.box(.2, .22, .2, c, -.75 + i * .3, .44 + s * .5, .05); else b.sph(.1, c, -.75 + i * .3, .42 + s * .5, .05); } } return b.done(); };
  MD.desk = v => { const b = G.mb(133); b.box(1.8, .08, .8, WOOD, 0, .78, 0); for (const x of [-.8, .8]) b.box(.2, .78, .75, LW, x, .39, 0); b.box(.4, .02, .3, 0xffffff, -.3, .83, .05, 0, .2); b.box(.3, .02, .25, 0xfff3b0, .1, .83, -.1, 0, -.15); b.cyl(.05, .06, .18, 8, 0xe8434a, .55, .9, 0); return b.done(); };
  MD.mannequin = v => { const c = [0xff8fc0, 0x5b8fd6, 0xffc23d, 0x4fb35f][v % 4], b = G.mb(134 + v); b.cyl(.2, .22, .06, 10, DW, 0, .03, 0); b.cyl(.025, .025, .8, 5, DW, 0, .45, 0); b.cyl(.14, .26, .55, 12, c, 0, .95, 0, 0, 0, 0, 0, true); b.sph(.15, c, 0, 1.25, 0, 1, .6, .8); b.sph(.08, 0xf3e6c8, 0, 1.42, 0); return b.done(); };
  MD.pedestal = v => { const b = G.mb(135); b.box(.75, .12, .75, ST, 0, .06, 0); b.cyl(.24, .28, .75, 10, 0xf3eee3, 0, .5, 0, 0, 0, 0, 0, true); b.box(.7, .08, .7, ST, 0, .9, 0); return b.done(); };
  MD.aquarium = v => { const b = G.mb(136); b.box(1.8, .55, .7, DW, 0, .28, 0); b.box(1.75, .7, .62, 0xbfe6fa, 0, .9, 0, 0, 0, 0, 2); b.box(1.7, .1, .58, 0xf1dda2, 0, .6, 0); b.box(1.8, .06, .7, DW, 0, 1.27, 0); [[-.5, .9, 0xff9a3c], [.2, 1.0, 0xffd23f], [.55, .82, 0xe8434a]].forEach(([x, y, c]) => b.sph(.07, c, x, y, 0, 1.6, 1, .7)); b.cone(.05, .3, 4, 0x4fb35f, -.2, .8, -.1); return b.done(); };
  MD.hut = v => {
    const b = G.mb(137); b.box(2.6, .2, 2.4, 0xc69c68, 0, .1, 0); for (let i = 0; i < 9; i++) { b.cyl(.09, .09, 1.8, 6, i % 2 ? 0xc8a46a : 0xb8945a, -1.1 + i * .275, 1.05, 1.05); b.cyl(.09, .09, 1.8, 6, i % 2 ? 0xc8a46a : 0xb8945a, -1.1 + i * .275, 1.05, -1.05); }
    b.box(2.3, 1.8, 2, 0xb8945a, 0, 1.05, 0); b.cone(2.1, 1.6, 8, 0xd9be7c, 0, 2.7, 0); b.cone(2.15, .4, 8, 0xc9ac68, 0, 2.05, 0);
    b.box(.7, 1.2, .06, 0x5a3a22, 0, .8, 1.07); b.box(.5, .4, .05, WIN, .75, 1.3, 1.07, 0, 0, 0, 1); return b.done();
  };
  MD.treasure = v => { const b = G.mb(138); b.box(.8, .45, .55, 0x8a5a34, 0, .23, 0); b.cyl(.275, .275, .8, 10, 0x9a6a40, 0, .45, 0, 0, 0, Math.PI / 2, 0, true); for (const x of [-.3, 0, .3]) b.box(.05, .75, .58, 0xffd23f, x, .32, 0); b.box(.14, .16, .05, 0xffd23f, 0, .44, .29); return b.done(); };
  MD.clockpost = v => { const b = G.mb(139); b.cyl(.12, .16, .2, 8, IRON, 0, .1, 0); b.cyl(.05, .06, 2.1, 6, IRON, 0, 1.15, 0); b.cyl(.28, .28, .12, 16, IRON, 0, 2.4, 0, Math.PI / 2); for (const z of [-.07, .07]) b.cyl(.24, .24, .02, 16, 0xffffff, 0, 2.4, z, Math.PI / 2, 0, 0, 1); return b.done(); };
  MD.fin = v => { const b = G.mb(140); b.cone(.18, .45, 3, 0x5a6670, 0, .2, 0, 0, Math.PI / 2, 0); return b.done(); };

  // ---------- objets ----------
  const O = G.OBJ, obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p);
  obj('mairie', 'Mairie', 'mairie', { h: 3.6, fp: [4, 3], enter: 'mairie' });
  obj('musee', 'Musée', 'musee', { h: 3.8, fp: [4, 3], enter: 'musee' });
  obj('couturiere', 'Couturière', 'couturiere', { h: 3.2, fp: [3, 3], enter: 'couturiere' });
  obj('gare', 'Gare', 'gare', { h: 4, fp: [6, 3], enter: 'gare' });
  obj('rails', 'Rails', 'rails', { h: .12, walk: 1 });
  obj('stand_jeux', 'Stand des jeux', 'stand', { h: 2, fp: [2, 2], games: 1 });
  obj('bateau', 'Bateau', 'boat', { h: .5, fp: [2, 1], onWater: 1 });
  obj('montgolfiere', 'Montgolfière', 'montgolfiere', { h: .7, fp: [2, 2], balloon: 1, take: 1, cat: 'construction' });
  obj('coffre', 'Coffre de rangement', 'chest', { h: .7, walk: 1, storage: 1, take: 1, cat: 'mobilier' });
  obj('casiers', 'Casiers', 'lockers', { h: 2, fp: [2, 1], storage: 1 });
  obj('miroir', 'Miroir', 'mirror', { h: 1.7, wardrobe: 1, take: 1, cat: 'mobilier' });
  obj('comptoir', 'Comptoir', 'counter', { h: 1, fp: [3, 1] });
  obj('rayon', 'Rayon', 'shelfshop', { h: 1.6, fp: [2, 1] });
  obj('bureau', 'Bureau', 'desk', { h: .9, fp: [2, 1], take: 1, cat: 'mobilier' });
  obj('mannequin', 'Mannequin', 'mannequin', { h: 1.6, take: 1, cat: 'mobilier' });
  obj('vitrine', 'Vitrine', 'pedestal', { h: 1 });
  obj('aquarium', 'Aquarium', 'aquarium', { h: 1.3, fp: [2, 1], take: 1, cat: 'mobilier' });
  obj('hutte', 'Hutte de plage', 'hut', { h: 3, fp: [3, 3], enter: 'hutte' });
  obj('coffre_tresor', 'Coffre au trésor', 'treasure', { h: .7, treasure: 1 });
  obj('horloge', 'Horloge de rue', 'clockpost', { h: 2.6, take: 1, cat: 'mobilier' });
  O.armoire.wardrobe = 1; O.boutique.shop = 0; O.boutique.enter = 'boutique'; O.boutique.h = 3.6;
  // ---------- objets d'inventaire ----------
  const I = G.ITEMS, item = (id, n, p) => I[id] = Object.assign({ id, n, stack: 99, sell: 0 }, p);
  for (const id of ['montgolfiere', 'coffre', 'miroir', 'bureau', 'mannequin', 'aquarium', 'horloge']) item(id, O[id].n, { kind: 'place', obj: id, cat: O[id].cat || 'mobilier', thumb: 'obj:' + id, sell: 300, stack: id === 'montgolfiere' ? 1 : 99 });
  item('perche', 'Perche', { kind: 'tool', tool: 'pole', ico: '🎋', stack: 1, sell: 200, cat: 'outils', thumb: 'tool:pole', desc: 'Face à une rivière : saute par-dessus !' });
  const FO = (id, n, ico, sell) => item(id, n, { kind: 'fossil', ico, sell, cat: 'fossiles' });
  FO('ammonite', 'Ammonite', '🐚', 1100); FO('trilobite', 'Trilobite', '🦂', 1300); FO('dent_trex', 'Dent de T-Rex', '🦷', 2500); FO('crane_tricera', 'Crâne de tricératops', '💀', 3500);
  FO('oeuf_dino', 'Œuf de dinosaure', '🥚', 2000); FO('fougere', 'Fougère fossile', '🌿', 900); FO('ambre', 'Ambre', '🟠', 1500);
  G.FOSSILS = ['ammonite', 'trilobite', 'dent_trex', 'crane_tricera', 'oeuf_dino', 'fougere', 'ambre'];
  I.fossile.n = 'Fossile inconnu'; I.fossile.desc = 'Fais-le identifier au musée par le Professeur Plume.';
  item('poisson_clown', 'Poisson-clown', { kind: 'fish', ico: '🐠', sell: 650, food: 1, cat: 'poissons' }); item('poisson_lune', 'Poisson-lune', { kind: 'fish', ico: '🐡', sell: 4000, food: 3, cat: 'poissons' }); item('espadon', 'Espadon', { kind: 'fish', ico: '🐟', sell: 6000, food: 4, cat: 'poissons' });
  item('ornithoptere', 'Ornithoptère', { kind: 'bug', ico: '🦋', sell: 3000, cat: 'insectes' });
  G.FISH.ile = [['poisson_clown', 25], ['daurade', 14], ['calamar', 12], ['poisson_lune', 7], ['espadon', 4], ['requin', 4]];
  G.HABITAT = { carpe: 'Rivière', truite: 'Rivière', poisson_chat: 'Rivière', saumon: 'Rivière (rare)', grenouille: 'Rivière, étang', carassin: 'Étang', poisson_rouge: 'Étang (rare)', sardine: 'Mer', bar: 'Mer', daurade: 'Mer', calamar: 'Mer', requin: 'Mer (très rare)', poisson_clown: 'Mer de l\'île', poisson_lune: 'Mer de l\'île (rare)', espadon: 'Mer de l\'île (très rare)',
    papillon: 'Le jour, partout', papillon_bleu: 'Le jour (rare)', coccinelle: 'Le jour, sur les fleurs', libellule: 'Le jour, près de l\'eau', luciole: 'La nuit', scarabee: 'La nuit (rare)', ornithoptere: 'L\'île, le jour (rare)',
    ammonite: 'Fissures brillantes', trilobite: 'Fissures brillantes', dent_trex: 'Fissures brillantes', crane_tricera: 'Fissures brillantes', oeuf_dino: 'Fissures brillantes', fougere: 'Fissures brillantes', ambre: 'Fissures brillantes' };
  G.SHOPLIST.push('perche', 'coffre', 'miroir', 'aquarium', 'horloge', 'bureau', 'mannequin', 'montgolfiere');
  G.RECIPES.push({ id: 'perche', need: { bois: 6 } }, { id: 'coffre', need: { bois: 8, fer: 1 } }, { id: 'miroir', need: { bois: 3, fer: 2 } });
  // ---------- personnages fixes ----------
  G.NPCS = {
    shop: { n: 'Gaston', sp: 'blaireau', col: 0x8b8f99, shirt: 0x4fb35f, apron: 0x2f8a45, pitch: .95 },
    mairie: { n: 'Marguerite', sp: 'chien', col: 0xf2d39b, shirt: 0x5b8fd6, pitch: 1.3, eyes: 'anime' },
    musee: { n: 'Professeur Plume', sp: 'hibou', col: 0x9a7552, shirt: 0x6b4a32, pitch: .85 },
    couture: { n: 'Mme Laine', sp: 'mouton', col: 0xfff2e6, shirt: 0xff8fc0, pitch: 1.2, eyes: 'doux' },
    gare: { n: 'Pablo', sp: 'singe', col: 0xb07a48, shirt: 0x2f4f9a, pitch: 1.15 },
    capitaine: { n: 'Capitaine Bigorneau', sp: 'grenouille', col: 0x6fbf5a, shirt: 0xfaf7f0, pitch: .9 },
    ile: { n: 'Papy Écaille', sp: 'tortue', col: 0xb9c98a, shirt: 0xff9a3c, pitch: .7, eyes: 'doux' },
    jeux: { n: 'Filou', sp: 'renard', col: 0xf08a3c, shirt: 0xffd23f, pitch: 1.25, eyes: 'anime', mouth: 'chat' }
  };
  // ---------- acres & structures ----------
  Object.assign(G.ACRES, { gare: { n: 'Gare', col: '#c9846b', ico: '🚉', lvl: 0, struct: 'gare' }, mairie: { n: 'Mairie', col: '#b8c8e8', ico: '🏛️', lvl: 0, struct: 'mairie' }, rue: { n: 'Rue commerçante', col: '#e9b8a0', ico: '🏬', lvl: 0, struct: 'rue' } });
  G.DEFAULT_LAYOUT[0][3] = 'gare'; G.DEFAULT_LAYOUT[1][3] = 'mairie'; G.DEFAULT_LAYOUT[1][4] = 'verger'; G.DEFAULT_LAYOUT[2][4] = 'place';  const npc = (meta, role, x, z, yaw = 0) => (meta.npcs = meta.npcs || []).push({ role, x, z, yaw });
  G.STRUCT = {
    gare(c) { const { ox, oz, put, flat, targets, meta, surf, I: ix } = c; flat(ox + 1, oz + 1, 14, 9);
      for (let x = ox; x < ox + 16; x++) put('rails', x, oz + 1, 1); put('gare', ox + 5, oz + 3); put('montgolfiere', ox + 12, oz + 7); put('horloge', ox + 3, oz + 7); put('banc', ox + 2, oz + 4); put('lampadaire', ox + 4, oz + 6); put('lampadaire', ox + 11, oz + 6);
      for (let x = ox + 4; x < ox + 12; x++) surf[ix(x, oz + 6)] = 11; meta.gare = { x: ox + 8, z: oz + 6.6 }; targets.push([ox + 8, oz + 6, 4]); },
    mairie(c) { const { ox, oz, put, flat, targets, meta, surf, I: ix } = c; flat(ox + 3, oz + 4, 10, 9);
      put('mairie', ox + 6, oz + 5); for (let z = oz + 8; z < oz + 11; z++) for (let x = ox + 5; x < ox + 11; x++) surf[ix(x, z)] = 11;
      put('lampadaire', ox + 5, oz + 8); put('lampadaire', ox + 10, oz + 8); ['tulipe_rouge', 'tulipe_jaune', 'tulipe_blanche', 'fleur_rose'].forEach((t, k) => { put(t, ox + 4, oz + 5 + k); put(t, ox + 11, oz + 5 + k); });
      meta.mairie = { x: ox + 8, z: oz + 8.6 }; targets.push([ox + 8, oz + 8, 4]); },
    rue(c) { const { ox, oz, put, flat, targets, meta, surf, I: ix } = c; flat(ox + 1, oz + 3, 14, 10);
      for (let x = ox + 1; x < ox + 15; x++) for (const z of [oz + 9, oz + 10]) surf[ix(x, z)] = 4;
      put('musee', ox + 2, oz + 4); put('couturiere', ox + 10, oz + 5);
      for (const x of [ox + 1, ox + 7, ox + 14]) put('lampadaire', x, oz + 11); put('banc', ox + 7, oz + 7); put('pot_fleurs', ox + 6, oz + 7); put('pot_fleurs', ox + 9, oz + 7);
      meta.musee = { x: ox + 4, z: oz + 7.6 }; meta.couture = { x: ox + 11.5, z: oz + 8.6 }; targets.push([ox + 4, oz + 8, 4]); targets.push([ox + 11, oz + 9, 4]); }
  };
  G.npcHost = npc;
})();
