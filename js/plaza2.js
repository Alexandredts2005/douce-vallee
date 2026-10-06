'use strict';
// ===== Grande place sur 2 acres : fontaine immense, tente de la voyante, tente de Rounard, chapiteau des jeux, kiosque à musique =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, GD = 0xd9b84a, MB = 0xeee9df, M2 = 0xdcd5c6, WL = 0xcdeeff, WA = 0x6fc3f0;
  // ---------- la fontaine immense (6×6) ----------
  MD.grande_fontaine = v => {
    const b = G.mb(180);
    b.cyl(2.98, 3.0, .2, 32, 0xcfc8b8, 0, .1, 0); b.cyl(2.75, 2.8, .62, 32, MB, 0, .5, 0, 0, 0, 0, 0, true);
    b.add(new THREE.TorusGeometry(2.76, .09, 6, 40), GD, b.M(0, .82, 0, Math.PI / 2, 0, 0), 0, true); b.cyl(2.6, 2.6, .04, 32, WA, 0, .72, 0, 0, 0, 0, 2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.box(.3, .5, .22, M2, Math.cos(a) * 2.79, .47, Math.sin(a) * 2.79, 0, -a, 0); b.sph(.07, GD, Math.cos(a) * 2.84, .84, Math.sin(a) * 2.84); }
    b.cyl(.55, .8, .35, 16, M2, 0, .9, 0); b.cyl(.38, .5, 1.4, 16, MB, 0, 1.75, 0, 0, 0, 0, 0, true);
    b.cyl(1.55, .95, .32, 28, MB, 0, 2.5, 0, 0, 0, 0, 0, true); b.add(new THREE.TorusGeometry(1.55, .06, 6, 32), GD, b.M(0, 2.66, 0, Math.PI / 2, 0, 0), 0, true); b.cyl(1.45, 1.45, .03, 28, WA, 0, 2.62, 0, 0, 0, 0, 2);
    b.geo(new THREE.CylinderGeometry(1.5, 2.45, 1.85, 28, 1, true), WL, b.M(0, 1.72, 0), 2);
    b.cyl(.22, .32, 1.0, 12, MB, 0, 3.15, 0, 0, 0, 0, 0, true); b.cyl(.85, .5, .22, 20, MB, 0, 3.7, 0, 0, 0, 0, 0, true); b.add(new THREE.TorusGeometry(.85, .045, 6, 24), GD, b.M(0, 3.81, 0, Math.PI / 2, 0, 0), 0, true);
    b.cyl(.78, .78, .03, 20, WA, 0, 3.78, 0, 0, 0, 0, 2); b.geo(new THREE.CylinderGeometry(.8, 1.48, .95, 20, 1, true), WL, b.M(0, 3.18, 0), 2);
    b.cyl(.14, .2, .35, 10, GD, 0, 3.98, 0); b.sph(.22, GD, 0, 4.35, 0, 1, 1.2, 1); b.cone(.12, .5, 10, GD, 0, 4.78, 0); b.sph(.06, 0xfff3b0, 0, 5.08, 0, 1, 1, 1, 1); b.cyl(.04, .08, .6, 8, WL, 0, 5.4, 0, 0, 0, 0, 2);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + TAU / 8, x = Math.cos(a), z = Math.sin(a);
      b.add(new THREE.SphereGeometry(.2, 10, 8), GD, b.M(x * 1.12, 1.3, z * 1.12, 0, -a, .55, 1.6, .75, .8), 0, true); b.cone(.1, .3, 6, GD, x * .82, 1.05, z * .82, 0, -a, 2.4);
      b.add(new THREE.TorusGeometry(.7, .05, 5, 14, Math.PI * .6), WL, b.M(x * 1.55, .75, z * 1.55, 0, -a, 0), 2, true); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.cyl(.025, .05, .9, 6, WL, Math.cos(a) * 2.25, 1.15, Math.sin(a) * 2.25, 0, 0, 0, 2); b.sph(.07, 0xffffff, Math.cos(a) * 2.25, 1.62, Math.sin(a) * 2.25, 1, 1, 1, 2); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; b.sph(.09, 0xbfe9ff, Math.cos(a) * 2.35, .7, Math.sin(a) * 2.35, 1, .5, 1, 1); }
    return b.done();
  };
  // ---------- kiosque à musique (4×4) ----------
  MD.kiosque = v => {
    const b = G.mb(181), W = 0xf3e6c8;
    b.cyl(1.92, 2.0, .45, 8, W, 0, .22, 0, 0, Math.PI / 8); b.cyl(1.95, 1.95, .05, 8, 0xb07a48, 0, .47, 0, 0, Math.PI / 8); b.box(1.1, .22, .5, W, 0, .11, 1.95);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, x = Math.cos(a) * 1.75, z = Math.sin(a) * 1.75; b.cyl(.06, .07, 2.2, 8, 0xffffff, x, 1.55, z);
      const a2 = a + TAU / 8, x2 = Math.cos(a2) * 1.75, z2 = Math.sin(a2) * 1.75; if (Math.abs(Math.atan2(z + z2, x + x2) - Math.PI / 2) > .4) { const l = Math.hypot(x2 - x, z2 - z); b.box(l, .06, .05, 0xffffff, (x + x2) / 2, 1.2, (z + z2) / 2, 0, -Math.atan2(z2 - z, x2 - x), 0); b.box(l, .05, .05, 0xffffff, (x + x2) / 2, .75, (z + z2) / 2, 0, -Math.atan2(z2 - z, x2 - x), 0); } }
    b.cone(2.35, 1.15, 8, 0x3f7a58, 0, 3.2, 0, 0, Math.PI / 8); b.cyl(2.3, 2.3, .1, 8, 0xffffff, 0, 2.65, 0, 0, Math.PI / 8); b.sph(.12, GD, 0, 3.85, 0); b.cone(.05, .3, 6, GD, 0, 4.05, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.cone(.1, .18, 3, [0xe8434a, 0xffd23f, 0x5b8fd6, 0xffffff][i % 4], Math.cos(a) * 2.25, 2.5, Math.sin(a) * 2.25, Math.PI, -a, 0); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; b.sph(.08, 0xfff1b8, Math.cos(a) * 1.2, 2.45, Math.sin(a) * 1.2, 1, 1, 1, 1); }
    return b.done();
  };
  // ---------- chapiteau des jeux (5×4) ----------
  MD.chapiteau = v => {
    const b = G.mb(182), R = 0xd8342c, W = 0xfaf4ea, Y = 0xffd23f;
    for (let i = 0; i < 16; i++) { const t0 = i / 16 * TAU, c = i % 2 ? W : R; b.geo(new THREE.CylinderGeometry(2.3, 2.3, 1.6, 2, 1, true, t0, TAU / 16), c, b.M(0, .8, 0, 0, 0, 0, 1.05, 1, .84)); b.geo(new THREE.ConeGeometry(2.45, 1.8, 2, 1, true, t0, TAU / 16), c, b.M(0, 2.5, 0, 0, 0, 0, 1.05, 1, .84)); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; b.sph(.1, i % 2 ? Y : 0x5b8fd6, Math.sin(a) * 2.45 * 1.05, 1.58, Math.cos(a) * 2.45 * .84, 1, .7, 1); }
    b.cyl(.05, .05, 1.2, 6, 0x6b4426, 0, 3.85, 0); b.box(.5, .3, .02, Y, .27, 4.25, 0); b.sph(.08, Y, 0, 4.48, 0);
    b.box(.95, 1.2, .1, 0x2a1018, 0, .62, 1.94); for (const s of [-1, 1]) b.geo(new THREE.ConeGeometry(.3, 1.3, 6), R, b.M(s * .55, .65, 1.95, 0, 0, s * .12)); b.box(1.6, .32, .08, Y, 0, 1.45, 1.98); b.box(1.4, .08, .09, R, 0, 1.45, 2.01);
    for (let i = 0; i < 9; i++) b.sph(.045, 0xfff3b0, -.8 + i * .2, 1.66, 1.98, 1, 1, 1, 1);
    for (const s of [-1, 1]) { b.cyl(.04, .04, 2.2, 5, 0x6b4426, s * 2.65, 1.1, 1.5); b.cone(.18, .3, 3, s > 0 ? 0x5b8fd6 : Y, s * 2.65, 2.25, 1.5, 0, 0, -Math.PI / 2 * s); }
    return b.done();
  };
  // ---------- tente de la voyante (3×3) ----------
  MD.tente_voyante = v => {
    const b = G.mb(183), PU = 0x4a2a7a;
    b.cyl(1.38, 1.42, .12, 8, 0xb9a58a, 0, .06, 0, 0, Math.PI / 8); b.geo(new THREE.CylinderGeometry(1.3, 1.3, 1.3, 8, 1, true), PU, b.M(0, .77, 0, 0, Math.PI / 8, 0));
    b.cone(1.55, 1.55, 8, 0x5b3a8f, 0, 2.18, 0, 0, Math.PI / 8); b.add(new THREE.TorusGeometry(.2, .055, 6, 14, Math.PI * 1.3), GD, b.M(0, 3.15, 0, 0, 0, .9), 1, true);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.ico(.06, 0, 0xffe27a, Math.cos(a) * 1.31, .55 + (i % 3) * .32, Math.sin(a) * 1.31, 1, 1, 1, 1); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; b.ico(.05, 0, 0xffe27a, Math.cos(a) * .95, 2.0, Math.sin(a) * .95, 1, 1, 1, 1); }
    b.box(.72, 1.05, .05, 0x1a0f2a, 0, .64, 1.27); for (const s of [-1, 1]) b.box(.28, 1.1, .06, 0x8a3fbf, s * .4, .66, 1.29, 0, 0, s * .1);
    b.sph(.2, 0xbfe6fa, 0, 1.55, 1.32, 1, 1, .5, 2); b.cyl(.14, .18, .1, 10, GD, 0, 1.33, 1.32);
    return b.done();
  };
  // ---------- tente de Rounard (3×3) ----------
  MD.tente_rounard = v => {
    const b = G.mb(184), G1 = 0x3f6b3a, G2 = 0xd9d2a6;
    b.cyl(1.38, 1.42, .12, 8, 0xb9a58a, 0, .06, 0, 0, Math.PI / 8);
    for (let i = 0; i < 12; i++) { const t0 = i / 12 * TAU, c = i % 2 ? G2 : G1; b.geo(new THREE.CylinderGeometry(1.3, 1.3, 1.25, 2, 1, true, t0, TAU / 12), c, b.M(0, .75, 0)); b.geo(new THREE.ConeGeometry(1.5, 1.4, 2, 1, true, t0, TAU / 12), c, b.M(0, 2.07, 0)); }
    b.box(.4, .3, .02, 0xb08a5c, .7, 1.9, 1.05, -.6, .5, 0); b.cyl(.04, .04, .5, 5, 0x6b4426, 0, 2.95, 0); b.box(.35, .22, .02, 0xe8a23a, .18, 3.08, 0);
    b.box(.72, 1.0, .05, 0x1a120a, 0, .62, 1.3); b.box(.86, .1, .08, 0x6b4426, 0, 1.16, 1.31);
    b.box(.05, .9, .05, 0x6b4426, -.9, .45, 1.45); b.box(.05, .9, .05, 0x6b4426, -.75, .45, 1.55); b.box(.5, .4, .04, GD, -.82, .95, 1.55); b.box(.42, .32, .045, 0x5b8fd6, -.82, .95, 1.56); b.sph(.08, 0xffd23f, -.75, 1.0, 1.59);
    b.cyl(.12, .12, .3, 8, 0xfff0c2, .95, .9, 1.25, 0, 0, 0, 1); b.cone(.15, .12, 8, 0x2a2d33, .95, 1.11, 1.25);
    return b.done();
  };
  MD.boule_cristal = v => { const b = G.mb(185); b.cyl(.42, .42, .05, 14, 0x5b3a8f, 0, .7, 0); b.cyl(.07, .1, .66, 8, 0x3a2a1a, 0, .35, 0); b.cyl(.3, .3, .02, 8, 0x3a2a1a, 0, .02, 0); b.cyl(.13, .16, .08, 10, GD, 0, .76, 0); b.sph(.21, 0xbfe6fa, 0, .99, 0, 1, 1, 1, 2, 16, 12); b.sph(.09, 0xd9b8ff, 0, .99, 0, 1, 1, 1, 1); return b.done(); };
  // ---------- chevalets et chefs-d'œuvre ----------
  const ART = ['La Joconde', 'Nuit étoilée', 'Nymphéas', 'Le Cri', 'Tournesols', 'La Grande Vague', 'Jeune fille à la perle', 'Coucher de soleil'];
  MD.chevalet = v => {
    const b = G.mb(186 + v), Z = .05, D = (w, h, c, x, y) => b.box(w, h, .012, c, x, 1.27 + y, Z), S = (r, c, x, y, sx = 1, sy = 1) => b.sph(r, c, x, 1.27 + y, Z, sx, sy, .12);
    for (const s of [-1, 1]) b.box(.05, 1.75, .05, 0x6b4426, s * .32, .85, -.08, -.12, 0, s * .1); b.box(.05, 1.7, .05, 0x6b4426, 0, .82, -.32, .3, 0, 0); b.box(.8, .05, .12, 0x6b4426, 0, .72, 0);
    b.box(.86, 1.06, .06, GD, 0, 1.27, 0); b.box(.76, .96, .065, 0xf3ead2, 0, 1.27, .005);
    if (v === 0) { D(.76, .96, 0x6a6a3a, 0, 0); D(.7, .3, 0x8a8a5a, 0, .3); S(.11, 0xe8c9a0, 0, .18, .85, 1.15); S(.15, 0x3a2a1a, 0, .2, 1.05, 1.4); S(.11, 0xe8c9a0, 0, .18, .85, 1.15); D(.42, .42, 0x2a2418, 0, -.23); S(.06, 0xe8c9a0, -.05, -.25, 1.6, .7); }
    else if (v === 1) { D(.76, .96, 0x1f3c8a, 0, 0); for (let i = 0; i < 4; i++) b.add(new THREE.TorusGeometry(.07 + i * .02, .012, 4, 12), 0x8fb0ff, b.M(-.15 + i * .1, 1.27 + .22 - (i % 2) * .08, Z + .01), 0, true); S(.07, 0xffe27a, .25, .33); for (let i = 0; i < 6; i++) S(.025, 0xffe27a, -.3 + i * .11, .38 - (i % 2) * .1); b.cone(.08, .5, 5, 0x1a3a1a, -.25, 1.05, Z + .03); D(.76, .2, 0x2a4a6a, 0, -.38); }
    else if (v === 2) { D(.76, .96, 0x5a9a8a, 0, 0); for (let i = 0; i < 9; i++) S(.06, 0x3f8f45, -.28 + (i % 3) * .28, -.3 + Math.floor(i / 3) * .3, 1.4, .6); for (let i = 0; i < 6; i++) S(.03, 0xff9fbf, -.22 + (i % 3) * .26, -.25 + Math.floor(i / 3) * .4); }
    else if (v === 3) { for (let i = 0; i < 5; i++) D(.76, .12, [0xe8432a, 0xf29a3a, 0xffc23d, 0xe86a3a, 0xd8342c][i], 0, .42 - i * .12); D(.76, .36, 0x2a3a6a, 0, -.3); b.box(.9, .05, .02, 0x8a5a34, -.05, 1.0, Z + .02, 0, 0, -.5); S(.09, 0xf3e6c8, .05, -.08, .9, 1.25); S(.04, 0x1a1a1a, .03, -.1, 1, 1.4); D(.1, .28, 0x1a1a1a, .05, -.32); }
    else if (v === 4) { D(.76, .96, 0xe8c860, 0, 0); D(.26, .28, 0xd9a03a, 0, -.3); for (let i = 0; i < 6; i++) { const x = -.24 + (i % 3) * .24, y = .02 + Math.floor(i / 3) * .2; S(.075, 0xffd23f, x, y); S(.03, 0x6b4426, x, y); } }
    else if (v === 5) { D(.76, .96, 0xf0e6d0, 0, 0); b.add(new THREE.TorusGeometry(.26, .06, 4, 16, Math.PI), 0x2f5fb8, b.M(-.08, 1.12, Z + .01), 0, true); b.add(new THREE.TorusGeometry(.18, .03, 4, 14, Math.PI), 0xffffff, b.M(-.06, 1.16, Z + .02), 0, true); D(.76, .2, 0x2f5fb8, 0, -.38); b.cone(.1, .12, 3, 0x6a7a9a, .2, 1.1, Z + .01); }
    else if (v === 6) { D(.76, .96, 0x1a1a1a, 0, 0); S(.13, 0xe8c9a0, 0, .02, .9, 1.15); S(.16, 0x2f5fb8, -.03, .16, 1.1, .8); S(.08, 0xffd23f, .05, .28, 1.2, .8); S(.025, 0xffffff, .1, -.04); D(.36, .28, 0xc9a03a, 0, -.32); }
    else { for (let i = 0; i < 6; i++) D(.76, .16, [0x3b4c8e, 0x8a5aa8, 0xf5a07e, 0xffc890, 0xffdcb4, 0x2f6b8a][i], 0, .4 - i * .16); S(.12, 0xfff3b0, .1, -.05); D(.76, .2, 0x1f3a5a, 0, -.38); }
    return b.done();
  };
  ART.forEach((n, k) => { O['tableau_art_' + k] = { id: 'tableau_art_' + k, n, model: 'chevalet', v: k, fp: [1, 1], h: 1.5, take: 1, cat: 'mobilier' };
    G.ITEMS['tableau_art_' + k] = { id: 'tableau_art_' + k, n: n + ' (tableau)', kind: 'place', obj: 'tableau_art_' + k, cat: 'mobilier', thumb: 'obj:tableau_art_' + k, buy: 3980, sell: 1245, stack: 1, desc: 'Un chef-d\'œuvre sur son chevalet. Rounard jure qu\'il est authentique !' }; });
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0, fixed: 1 }, p);
  obj('grande_fontaine', 'Grande fontaine', 'grande_fontaine', { fp: [6, 6], h: 2.6, fountain: 1 });
  obj('kiosque', 'Kiosque à musique', 'kiosque', { fp: [4, 4], h: .47, walk: 1 });
  obj('chapiteau', 'Chapiteau des jeux', 'chapiteau', { fp: [5, 4], h: 2.4 });
  obj('tente_voyante', 'Tente de la voyante', 'tente_voyante', { fp: [3, 3], h: 2.4, enter: 'voyante' });
  obj('tente_rounard', 'Tente de Rounard', 'tente_rounard', { fp: [3, 3], h: 2.4, enter: 'rounard' });
  obj('boule_cristal', 'Boule de cristal', 'boule_cristal', { h: 1.1, fixed: 0, take: 1, cat: 'mobilier' });
  G.ITEMS.boule_cristal = { id: 'boule_cristal', n: 'Boule de cristal', kind: 'place', obj: 'boule_cristal', cat: 'mobilier', thumb: 'obj:boule_cristal', buy: 2400, sell: 600, stack: 9 };
  for (const id of ['gare', 'mairie', 'musee', 'couturiere', 'tunnel', 'tunnel2', 'signal_pn', 'stand_jeux']) if (O[id]) O[id].fixed = 1;
  // ---------- intérieurs ----------
  Object.assign(G.ROOMKINDS, { voyante: { W: 6, H: 6, floor: 'moquette', wall: 'etoiles', trim: 0xd9b84a }, rounard: { W: 7, H: 6, floor: 'parquet_fonce', wall: 'lambris', trim: 0x3f6b3a } });
  Object.assign(G.ROOMFILL, {
    voyante: (m, P) => { P('boule_cristal', 2, 2); P('lanterne', 0, 0); P('lanterne', 5, 0); P('etagere', 0, 3); P('plante', 5, 4); P('tapis', 2, 3); },
    rounard: (m, P) => { for (const [x, z, k] of [[0, 0, 1], [2, 0, 3], [4, 0, 4], [6, 0, 5], [0, 3, 0], [6, 3, 6]]) P('tableau_art_' + k, x, z); P('lanterne', 1, 2); P('lanterne', 5, 2); P('tonneau', 6, 5); P('caisse', 0, 5); }
  });
  Object.assign(G.ROOMNPC, { voyante: ['voyante', 2.5, 1.3], rounard: ['rounard', 3.5, 1.7] });
  Object.assign(G.NPCS, {
    voyante: { n: 'Madame Étoile', sp: 'chat', col: 0x3a3050, shirt: 0x8a3fbf, pitch: .95, eyes: 'doux' },
    rounard: { n: 'Rounard', sp: 'renard', col: 0x5a8fb8, shirt: 0xe8a23a, pitch: 1.1, eyes: 'anime', mouth: 'chat' },
    musicien: { n: 'Dédé', sp: 'chien', col: 0xfaf7f0, shirt: 0x2a2d33, pitch: .9 }
  });
  // ---------- les attractions ----------
  const say = (v, l, c) => G.npcSay(v, l, c), PN = () => G.playerName, surv = () => G.mode === 'survie';
  const pay = (n, v, ok) => { if (!surv() || !n) return ok(); if (G.coins < n) return say(v, ['Il te manque ' + (n - G.coins).toLocaleString('fr-FR') + ' clochettes, mon petit…']); G.coins -= n; G.ui.dirtyHud(); G.sfx('coin'); return ok(); };
  const FORTUNES = [['argent', 'Je vois… une pluie de clochettes ! Secoue les arbres aujourd\'hui : la fortune te sourit.'], ['amour', 'Je vois un cœur… Quelqu\'un au village pense très fort à toi. Va lui parler !'],
    ['peche', 'Je vois l\'eau… un poisson rare nage près de toi. Lance ta ligne, sois patient·e.'], ['ciel', 'Les étoiles brillent pour toi… Ce soir, guette les étoiles filantes et fais un vœu.'], ['calme', 'Je vois… une journée paisible. Les petits bonheurs sont les plus doux.']];
  G.npcRoles.voyante = v => {
    if (G.flags.fortune && G.flags.fortune.day === G.clock.day) return say(v, ['Les étoiles ont déjà parlé pour aujourd\'hui…', FORTUNES[G.flags.fortune.k][1], 'Reviens demain, ' + PN() + '.']);
    return say(v, ['Approche… Les étoiles m\'ont parlé de toi, ' + PN() + '…'], ['Lire mon avenir' + (surv() ? ' (100 🔔)' : ''), 'Au revoir']).then(k => { if (k !== 0) return;
      return pay(100, v, () => { const f = Math.floor(G.hash2(G.clock.day, G.hashStr(PN()) & 1023, 7) * FORTUNES.length); G.flags.fortune = { day: G.clock.day, k: f }; G.sfx('craft'); const p = G.player; G.fx.burst(p.x, p.y + 1.6, p.z, 20, [0xd9b8ff, 0xffe27a, 0xffffff], 2, 1, -1);
        return say(v, ['Concentre-toi… Mmmmh…', 'La boule s\'éclaire !', FORTUNES[f][1]]); }); });
  };
  // la chance aux clochettes : un sac tombe à coup sûr en secouant un arbre ce jour-là
  const oshake = G.act.shakeTree; G.act.shakeTree = o => { const r = oshake(o), f = G.flags.fortune, d = G.OBJ[o.t], m = G.map;
    if (f && f.day === G.clock.day && FORTUNES[f.k][0] === 'argent' && d.shake === 'coins' && G.flags.lucky !== G.clock.day) { G.flags.lucky = G.clock.day; for (const [dx, dz] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1]]) if (m.canPlace('sac_pieces', o.x + dx, o.z + dz)) { const fo = m.addObj('sac_pieces', o.x + dx, o.z + dz); G.anim.drop(m, fo); G.sfx('coin'); G.ui.toast('La voyante avait raison ! 💰'); break; } }
    return r; };
  const artOfDay = () => { const r = G.rng(G.clock.day * 131 + 7), ids = ART.map((_, k) => 'tableau_art_' + k); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, 4); };
  G.npcRoles.rounard = v => say(v, ['Psst ! Par ici, cousin ! Rounard, marchand d\'art… honnête, hein, très honnête.'], ['Voir les tableaux du jour', 'C\'est authentique ?', 'Au revoir']).then(k => {
    if (k === 0) return G.ui.openShop(v, { list: artOfDay().concat(['boule_cristal']), title: 'Tente de Rounard', quote: '« Que des chefs-d\'œuvre ! Enfin… presque tous. Hé hé ! »', noSell: true });
    if (k === 1) return say(v, ['Authentique ? Moi ? Évidemment ! Le Professeur Plume en voudrait pour son musée !', '…Bon, peut-être pas tous. Mais ils sont très jolis, non ?']); });
  // ---------- concert de Dédé au kiosque (le soir) ----------
  const SONGS = [{ n: 'Valse des lucioles', bpm: 92, root: 60, prog: [0, 9, 5, 7], mel: [4, 7, 9, 7, 4, 2, 0, null, 2, 4, 7, 4, 2, 0, 2, null, 4, 7, 9, 12, 9, 7, 4, null, 2, 4, 2, 0, -3, 0, null, null] },
    { n: 'Samba de la place', bpm: 124, root: 62, prog: [0, 5, 7, 5], mel: [0, 2, 4, 7, null, 7, 9, 7, 4, null, 4, 2, 0, 2, 4, null, 7, 9, 12, 9, 7, null, 4, 7, 4, 2, 0, null, 2, 0, null, null] }];
  const tone = (type, f, t, dur, vol, dest) => { const A = G.audio, C = A.ctx, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(dest || A.sfxG); o.start(t); o.stop(t + dur + .05); };
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12), PENTA = [0, 2, 4, 5, 7, 9, 11];
  const CONCERT = G.concert = { on: false, end: 0 };
  function playSong(s) {
    const A = G.audio; if (!A || !A.ok) return 0; const C = A.ctx, t0 = C.currentTime + .1, spb = 60 / s.bpm / 2; let dur = 0;
    for (let rep = 0; rep < 2; rep++) for (let i = 0; i < 32; i++) { const t = t0 + (rep * 32 + i) * spb, bar = Math.floor(i / 8), ch = s.root + s.prog[bar];
      if (i % 8 === 0) tone('sine', mtof(ch - 24), t, spb * 6, .2); if (i % 4 === 2) tone('triangle', mtof(ch - 12 + 7), t, spb * 2, .06);
      if (i % 2 === 0) [0, 4, 7].forEach((x, k) => tone('triangle', mtof(ch + x - ([9, 4].includes(s.prog[bar]) && x === 4 ? 1 : 0)), t + k * .012, spb * 1.6, .045));
      const d = s.mel[i]; if (d != null) { const n = s.root + 12 + d; tone('triangle', mtof(n), t, spb * 1.8, .11); tone('square', mtof(n + 12), t, spb * .4, .012); }
      if (s.bpm > 110 && i % 2 === 1) tone('square', 3200 + Math.random() * 400, t, .02, .01); dur = (rep * 32 + i + 1) * spb; }
    return dur;
  }
  const musician = () => G.ents.villagers.find(x => x.npc === 'musicien');
  G.npcRoles.musicien = v => {
    if (CONCERT.on) return say(v, ['♪ … ♪ (Dédé est en plein concert !)']);
    return say(v, ['Salut ' + PN() + ' ! Ce soir, c\'est concert au kiosque. Une petite chanson ?'], [SONGS[0].n, SONGS[1].n, 'Au revoir']).then(k => { if (k < 0 || k > 1) return;
      const d = playSong(SONGS[k]); if (!d) return say(v, ['Hmm, je n\'entends pas le son… Active le son du jeu !']); CONCERT.on = true; CONCERT.end = performance.now() + d * 1000; CONCERT.v = v; G.audio.music.on = false; G.ui.toast('🎸 « ' + SONGS[k].n + ' » par Dédé');
      if (G.flags.concertDay !== G.clock.day) { G.flags.concertDay = G.clock.day; G.flags.emotes = G.flags.emotes || ['salut', 'rire', 'surprise', 'assis']; if (!G.flags.emotes.includes('danse')) { G.flags.emotes.push('danse'); setTimeout(() => G.ui.toast('Tu as appris l\'émote « Danser » 💃 (touche G)'), 1500); } } });
  };
  // ---------- la place (une ou deux acres) ----------
  G.STRUCT.place = c => {
    const { map, ox, oz, ax, az, layout, put, flat, targets, meta, surf, I: ix, A } = c;
    if (ax > 0 && layout[az][ax - 1] === 'place') return; // déjà construite avec l'acre de gauche
    const big = ax + 1 < layout[0].length && layout[az][ax + 1] === 'place', Wd = big ? 32 : 16, cx = ox + Wd / 2, cz = oz + 8.5, rx = big ? 15 : 7.4, rz = 7.4;
    flat(ox + 1, oz + 1, Wd - 2, 14);
    for (let z = oz; z < oz + 16; z++) for (let x = ox; x < ox + Wd; x++) { const e = ((x + .5 - cx) / rx) ** 2 + ((z + .5 - cz) / rz) ** 2; if (e < 1) surf[ix(x, z)] = e > .84 ? 9 : 11; if (Math.hypot(x + .5 - cx, z + .5 - (oz + 8)) < 4.4) surf[ix(x, z)] = 4; }
    const fx = Math.floor(cx) - 3, f = put('grande_fontaine', fx, oz + 5); if (f) meta.fountain = { x: fx + 3, z: oz + 8 };
    const ring = []; for (let i = 0; i < (big ? 14 : 10); i++) { const a = i / (big ? 14 : 10) * TAU + .2; ring.push([Math.floor(cx + Math.cos(a) * (rx - .6)), Math.floor(cz + Math.sin(a) * (rz - .6))]); }
    if (big) {
      const tv = put('tente_voyante', ox + 2, oz + 2, 0, { iid: 'place_voyante' }); put('kiosque', ox + 6, oz + 1); put('tableau', ox + 11, oz + 2);
      const ch = put('chapiteau', ox + 19, oz + 1); put('tente_rounard', ox + 26, oz + 2, 0, { iid: 'place_rounard' });
      G.npcHost(meta, 'jeux', ox + 21.5, oz + 5.7, 0); G.npcHost(meta, 'musicien', ox + 8, oz + 3, 0); meta.kiosque = { x: ox + 8, z: oz + 3 };
      for (const [x, z, r] of [[ox + 10, oz + 7, 1], [ox + 21, oz + 7, 3], [ox + 12, oz + 12, 2], [ox + 18, oz + 12, 2]]) put('banc_parc', x, z, r);
      for (const [x, z] of [[ox + 1, oz + 13], [ox + 30, oz + 13], [ox + 1, oz + 8], [ox + 30, oz + 8]]) put('cerisier', x, z, 0, { f: 3 });
      meta.games = { x: ox + 16, z: oz + 12.6 };
    } else {
      put('stand_jeux', ox + 12, oz + 3) && G.npcHost(meta, 'jeux', ox + 13, oz + 5.6, 0); put('tente_voyante', ox + 1, oz + 2, 0, { iid: 'place_voyante' }); put('tableau', ox + 6, oz + 2);
      for (const [x, z, r] of [[ox + 3, oz + 7, 1], [ox + 7, oz + 13, 2]]) put('banc_parc', x, z, r); meta.games = { x: ox + 8, z: oz + 13 };
    }
    for (const [x, z] of ring) if ((Math.abs(x + .5 - cx) > 4 || Math.abs(z + .5 - (oz + 8)) > 4) && !(Math.abs(x + .5 - cx) < 3 && z > cz)) put('lampadaire', x, z);
    const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
    for (const [x0, z0] of big ? [[ox + 10, oz + 4], [ox + 24, oz + 6], [ox + 9, oz + 11], [ox + 22, oz + 11]] : [[ox + 2, oz + 11], [ox + 12, oz + 11]]) for (let k = 0; k < 4; k++) put('tulipe_' + FL[(x0 + k) % 7], x0 + (k % 2), z0 + Math.floor(k / 2));
    meta.plaza = { x: cx, z: oz + 14.6 }; c.setPlaza([Math.floor(cx), oz + 15]);
  };
  // dans un village aléatoire, la place prend deux acres quand c'est possible
  const orl = G.randomLayout; G.randomLayout = seed => { const L = orl(seed); for (let z = 0; z < L.length; z++) for (let x = 0; x < L[0].length; x++) if (L[z][x] === 'place') { const n = L[z][x + 1]; if (n && !G.ACRES[n].water && !G.ACRES[n].struct && !G.ACRES[n].beach) { L[z][x + 1] = 'place'; return L; } const w = L[z][x - 1]; if (w && !G.ACRES[w].water && !G.ACRES[w].struct && !G.ACRES[w].beach) { L[z][x - 1] = 'place'; return L; } return L; } return L; };
  // ---------- on ne déplace pas les grands monuments ----------
  const ot = G.act.take; G.act.take = () => { const p = G.player, m = G.map, [tx, tz] = p.target(), o = m.objAt(tx, tz); if (o && G.OBJ[o.t].fixed && !p.act) { G.sfx('error'); return G.ui.toast('Ça ne se déplace pas !'); } return ot(); };
  // ---------- vœu à la grande fontaine ----------
  const oint = G.act.interact; G.act.interact = () => {
    const p = G.player, m = G.map; if (!p.act && !p.sit && !p.fish && !p.swim && !G.ents.villagerInFront(p)) { const [tx, tz] = p.target(), o = m.objAt(tx, tz);
      if (o && o.t === 'grande_fontaine') { if (surv() && G.coins < 10) return G.ui.toast('Il faut une clochette à lancer dans la fontaine !'); if (surv()) { G.coins -= 10; G.ui.dirtyHud(); }
        const [cx, cz] = m.center(o); G.sfx('coin'); G.fx.burst(cx, o.y + 1.2, cz, 24, [0xffe27a, 0xffffff, 0xbfe6fa], 3, 1.2, 2); G.feat.emote && G.feat.emote('bravo');
        if (G.flags.wish !== G.clock.day && Math.random() < .35) { G.flags.wish = G.clock.day; for (const [dx, dz] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const x = Math.floor(p.x) + dx, z = Math.floor(p.z) + dz; if (m.canPlace('cadeau', x, z)) { const g = m.addObj('cadeau', x, z); G.anim.drop(m, g); break; } } G.ui.toast('Ton vœu est exaucé ! 🎁'); }
        else G.ui.toast(G.pick(['Tu lances une clochette et fais un vœu… 🌟', 'Plouf ! La clochette brille au fond de l\'eau…', 'Un vœu pour ' + G.villageName + ' ! ✨'])); return; } }
    return oint();
  };
  // ---------- vie de la place : gerbes d'eau, bruit de l'eau, Dédé seulement le soir ----------
  G.on('update', dt => {
    const m = G.world, p = G.player; if (!m || !p) return; const h = G.clock.min / 60;
    const mu = musician(); if (mu) { const show = h >= 18 || h < 1 || CONCERT.on; mu.visible = mu.visible && show; mu.root.visible = mu.blob.visible = mu.visible;
      if (!mu.guitar) { const b = G.mb(187); b.sph(.17, 0xc0503c, 0, 0, 0, 1, 1.25, .45); b.sph(.05, 0x2a1a12, 0, .03, .07, 1, 1, .3); b.box(.06, .45, .04, 0x6b4426, 0, .38, 0); b.box(.1, .1, .05, 0x2a2d33, 0, .62, 0); const g = new THREE.Mesh(b.done(), G.MATS); g.position.set(-.1, -.05, .14); g.rotation.set(.2, 0, .9); mu.C.hand.add(g); mu.guitar = g; }
      if (CONCERT.on && mu.visible) { const t = performance.now() / 1000; mu.C.armR.rotation.x = -.7 + Math.sin(t * 12) * .35; mu.C.armL.rotation.x = -1.1; mu.C.body.position.y = Math.abs(Math.sin(t * 4)) * .04; if (Math.random() < dt * 3) G.popup(G.pick(['♪', '♫', '♬']), mu.x + (Math.random() - .5), mu.y + 1.7, mu.z, 'gold'); } }
    if (CONCERT.on && performance.now() > CONCERT.end) { CONCERT.on = false; G.audio.music.on = true; if (G.map === m && CONCERT.v) G.npcSay(CONCERT.v, ['Merci, merci ! Vous êtes un public formidable !']); }
    const f = m.meta.fountain; if (!f || G.map !== m) return; const d = Math.hypot(p.x - f.x, p.z - f.z); if (d > 38) return;
    G.ents.fallDist = Math.min(G.ents.fallDist || 99, d * 1.25 + 4);
    const y0 = m.baseH(Math.floor(f.x), Math.floor(f.z)), n = d < 22 ? 3 : 1;
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = .3 + Math.random() * .5; G.fx.one(f.x, y0 + 5.65, f.z, Math.cos(a) * s, 1.6 + Math.random(), Math.sin(a) * s, .9, 5, 0xe8f7ff, .12, 1);
      const b2 = Math.floor(Math.random() * 12) / 12 * TAU; G.fx.one(f.x + Math.cos(b2) * 2.25, y0 + 1.65, f.z + Math.sin(b2) * 2.25, 0, 1.2 + Math.random() * .6, 0, .5, 6, 0xffffff, .09, 1); }
  });
})();
