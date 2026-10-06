'use strict';
// ===== Modèles — partie 2 : mobilier, lumières, constructions (matériaux : 0 normal, 1 lueur, 2 transparent, 3 feu) =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  const WOOD = 0xb07a48, DWOOD = 0x85552f, LWOOD = 0xd4a46c, IRON = 0x3f444c, STONE = 0xb9b5aa, DSTONE = 0x8f8b82, WIN = 0xfff0c2;
  const legs = (b, w, d, h, col, t = .07) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(t, h, t, col, sx * (w / 2 - t / 2), h / 2, sz * (d / 2 - t / 2)); };
  function prism(b, W, H, L, col, x, y, z, ry = 0, mat = 0) {
    const g = new THREE.CylinderGeometry(1, 1, L, 3); g.rotateX(-Math.PI / 2);
    const sx = W / 1.732, sy = H / 1.5;
    b.geo(g, col, b.M(x, y + .5 * sy, z, 0, ry, 0, sx, sy, 1), mat);
  }
  G.prism = prism;
  const flame = (b, x, y, z, s = 1) => { b.cone(.13 * s, .38 * s, 6, 0xff8a1f, x, y + .19 * s, z, 0, 0, 0, 3); b.cone(.08 * s, .26 * s, 6, 0xffe14a, x, y + .15 * s, z + .02, 0, .5, 0, 3); };

  MD.bench = v => {
    const b = G.mb(40), slat = v ? 0x4f8a4f : WOOD, leg = v ? 0x2c2f33 : DWOOD;
    for (let i = 0; i < 3; i++) b.box(1.7, .06, .14, slat, 0, .45, -.16 + i * .16);
    b.box(1.7, .12, .05, slat, 0, .7, -.27, -.15, 0, 0); b.box(1.7, .12, .05, slat, 0, .88, -.3, -.15, 0, 0);
    for (const sx of [-.72, .72]) { b.box(.08, .45, .08, leg, sx, .22, .15); b.box(.08, .9, .08, leg, sx, .45, -.25); if (v) b.box(.08, .06, .48, leg, sx, .62, -.05); }
    return b.done();
  };
  MD.chair = v => { const b = G.mb(41); b.box(.5, .06, .48, LWOOD, 0, .46, 0); legs(b, .46, .44, .45, DWOOD); b.box(.5, .5, .06, LWOOD, 0, .75, -.21); b.box(.36, .1, .07, 0xd77a61, 0, .85, -.17); return b.done(); };
  MD.table = v => { const b = G.mb(42); b.box(.92, .08, .92, LWOOD, 0, .74, 0); legs(b, .8, .8, .72, DWOOD, .08); b.box(.98, .015, .3, 0xe8f0ff, 0, .785, 0); return b.done(); };
  MD.picnic = v => {
    const b = G.mb(43); b.box(1.8, .07, .64, LWOOD, 0, .72, 0); for (const z of [-.52, .52]) { b.box(1.8, .06, .22, LWOOD, 0, .42, z); }
    for (const x of [-.7, .7]) { b.box(.08, .78, .08, DWOOD, x, .38, -.3, -.5); b.box(.08, .78, .08, DWOOD, x, .38, .3, .5); b.box(.08, .06, 1.3, DWOOD, x, .36, 0); }
    return b.done();
  };
  MD.lamp_post = v => {
    const b = G.mb(44); b.cyl(.16, .2, .25, 8, IRON, 0, .12, 0); b.cyl(.05, .07, 2.15, 6, IRON, 0, 1.2, 0);
    b.box(.34, .05, .34, IRON, 0, 2.27, 0); b.box(.26, .34, .26, WIN, 0, 2.46, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.04, .36, .04, IRON, sx * .14, 2.46, sz * .14);
    b.cone(.26, .22, 4, IRON, 0, 2.74, 0, 0, Math.PI / 4); b.sph(.04, IRON, 0, 2.88, 0); return b.done();
  };
  MD.lantern = v => { const b = G.mb(45); b.cyl(.16, .18, .06, 8, IRON, 0, .03, 0); b.cyl(.12, .12, .3, 8, WIN, 0, .22, 0, 0, 0, 0, 1); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .4; b.box(.03, .32, .03, IRON, Math.cos(a) * .13, .22, Math.sin(a) * .13); } b.cone(.17, .14, 8, IRON, 0, .44, 0); b.tor(.06, .012, IRON, 0, .55, 0); return b.done(); };
  MD.stone_lantern = v => { const b = G.mb(46); b.cyl(.28, .32, .14, 6, DSTONE, 0, .07, 0); b.cyl(.09, .12, .5, 6, STONE, 0, .38, 0); b.box(.42, .08, .42, STONE, 0, .66, 0); b.box(.3, .26, .3, STONE, 0, .83, 0); b.box(.31, .14, .2, WIN, 0, .84, 0, 0, 0, 0, 1); b.box(.2, .14, .31, WIN, 0, .84, 0, 0, 0, 0, 1); b.cone(.4, .24, 4, DSTONE, 0, 1.08, 0, 0, Math.PI / 4); b.sph(.06, DSTONE, 0, 1.23, 0); return b.done(); };
  MD.torch = v => { const b = G.mb(47); b.cyl(.04, .05, .95, 5, DWOOD, 0, .47, 0); b.cyl(.08, .06, .12, 6, IRON, 0, .95, 0); flame(b, 0, 1.0, 0, .8); return b.done(); };
  MD.campfire = v => {
    const b = G.mb(48); b.jit(.15); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; b.ico(.12, 0, i % 2 ? 0x9a978f : 0x85827a, Math.cos(a) * .38, .07, Math.sin(a) * .38); } b.jit(0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; b.cyl(.05, .06, .62, 6, DWOOD, 0, .1, 0, 0, a, Math.PI / 2 - .2); }
    flame(b, 0, .08, 0, 1.2); flame(b, .1, .06, .05, .7); flame(b, -.09, .06, -.04, .75); return b.done();
  };
  MD.fence = v => {
    const b = G.mb(49);
    if (v === 1) { for (let i = 0; i < 5; i++) { const x = -.4 + i * .2; b.box(.1, .78, .04, 0xf7f5ee, x, .39, 0); b.cone(.07, .12, 4, 0xf7f5ee, x, .84, 0, 0, Math.PI / 4); } b.box(1, .07, .05, 0xebe6da, 0, .25, -.03); b.box(1, .07, .05, 0xebe6da, 0, .6, -.03); }
    else { for (const x of [-.44, .44]) b.box(.12, .9, .12, DWOOD, x, .45, 0); b.box(1, .1, .06, WOOD, 0, .35, 0); b.box(1, .1, .06, WOOD, 0, .7, 0); }
    return b.done();
  };
  MD.hedge = v => { const b = G.mb(50); b.jit(.12); b.box(.92, .9, .92, 0x3f8f45, 0, .45, 0); for (let i = 0; i < 4; i++) b.ico(.32, 1, 0x4a9e4f, (i % 2 - .5) * .4, .92, (Math.floor(i / 2) - .5) * .4, 1, .6, 1); return b.done(); };
  MD.barrel = v => { const b = G.mb(51); b.cyl(.33, .3, .9, 9, WOOD, 0, .45, 0); b.cyl(.345, .345, .07, 9, IRON, 0, .2, 0); b.cyl(.345, .345, .07, 9, IRON, 0, .7, 0); b.cyl(.28, .28, .02, 9, LWOOD, 0, .905, 0); return b.done(); };
  MD.crate = v => { const b = G.mb(52); b.box(.76, .76, .76, LWOOD, 0, .38, 0); for (const z of [-.39, .39]) { b.box(.8, .1, .03, WOOD, 0, .1, z); b.box(.8, .1, .03, WOOD, 0, .66, z); b.box(.1, .76, .03, WOOD, 0, .38, z, 0, 0, .78); } for (const x of [-.39, .39]) { b.box(.03, .1, .8, WOOD, x, .1, 0); b.box(.03, .1, .8, WOOD, x, .66, 0); } return b.done(); };
  MD.mailbox = v => { const b = G.mb(53); b.box(.09, .9, .09, DWOOD, 0, .45, 0); b.box(.34, .26, .5, 0x5b8fd6, 0, 1.0, 0); b.cyl(.17, .17, .5, 10, 0x5b8fd6, 0, 1.13, 0, Math.PI / 2); b.box(.03, .22, .04, 0xe8443a, .19, 1.15, -.1); b.box(.03, .08, .12, 0xe8443a, .19, 1.24, -.05); b.box(.2, .04, .01, 0x2a3b55, 0, 1.0, .255); return b.done(); };
  MD.sign = v => { const b = G.mb(54); b.box(.08, 1, .08, DWOOD, 0, .5, 0); b.box(.8, .45, .06, LWOOD, 0, .95, .05); b.box(.84, .05, .07, WOOD, 0, 1.18, .05); for (let i = 0; i < 3; i++) b.box(.5 - i * .1, .03, .01, 0x6b4a32, -.05 + i * .03, 1.03 - i * .09, .085); return b.done(); };
  MD.board = v => {
    const b = G.mb(55); for (const x of [-.75, .75]) b.box(.1, 1.7, .1, DWOOD, x, .85, 0);
    b.box(1.6, 1, .07, 0x9f7a52, 0, 1.15, 0); b.box(1.8, .08, .3, 0xc0503c, 0, 1.72, 0, .0); prism(b, 1.85, .25, .4, 0xc0503c, 0, 1.72, 0);
    [[-.45, 1.3, 0xffffff], [.1, 1.2, 0xfff3b0], [.5, 1.35, 0xcfe8ff], [-.2, .9, 0xffd6e0], [.45, .92, 0xffffff]].forEach(([x, y, c]) => b.box(.36, .3, .01, c, x, y, .04, 0, 0, (x * 7 % 1) * .2 - .1));
    return b.done();
  };
  MD.fountain = v => {
    const b = G.mb(56); b.cyl(.95, 1, .45, 14, STONE, 0, .22, 0); b.cyl(.8, .8, .04, 14, 0x5fb6e8, 0, .4, 0, 0, 0, 0, 2);
    b.cyl(.14, .2, .9, 8, STONE, 0, .6, 0); b.cyl(.42, .16, .16, 10, STONE, 0, 1.05, 0); b.cyl(.36, .36, .03, 10, 0x6fc3f0, 0, 1.12, 0, 0, 0, 0, 2);
    b.cyl(.05, .09, .35, 6, 0xbfe6fa, 0, 1.3, 0, 0, 0, 0, 2); b.sph(.1, 0xdff4ff, 0, 1.48, 0, 1, 1, 1, 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.cyl(.015, .03, .5, 4, 0xbfe6fa, Math.cos(a) * .45, .85, Math.sin(a) * .45, Math.sin(a) * .6, 0, -Math.cos(a) * .6, 2); }
    return b.done();
  };
  MD.well = v => { const b = G.mb(57); b.cyl(.48, .5, .6, 10, STONE, 0, .3, 0); b.cyl(.38, .38, .02, 10, 0x2f5f7a, 0, .5, 0); for (const x of [-.45, .45]) b.box(.09, 1.4, .09, DWOOD, x, .9, 0); prism(b, 1.3, .45, .9, 0xb5533f, 0, 1.55, 0, Math.PI / 2); b.cyl(.04, .04, .9, 6, DWOOD, 0, 1.4, 0, 0, 0, Math.PI / 2); b.cyl(.1, .08, .16, 8, WOOD, .1, 1.0, 0); return b.done(); };
  MD.statue = v => { const b = G.mb(58), c = 0xd9b84a; b.box(.8, .5, .8, STONE, 0, .25, 0); b.box(.9, .08, .9, DSTONE, 0, .52, 0); b.cone(.3, .8, 8, c, 0, .96, 0); b.sph(.22, c, 0, 1.52, 0); b.cone(.14, .22, 5, c, 0, 1.78, 0); b.cyl(.04, .04, .5, 5, c, .28, 1.2, 0, 0, 0, .7); b.ico(.1, 0, 0xfff1a0, .48, 1.42, 0, 1, 1, 1, 1); return b.done(); };
  MD.flowerpot = v => { const b = G.mb(59); b.cyl(.26, .18, .38, 8, 0xc8673e, 0, .19, 0); b.cyl(.28, .28, .06, 8, 0xd8784e, 0, .38, 0); b.cyl(.23, .23, .02, 8, 0x5a3a22, 0, .4, 0); [0xff8fc0, 0xffd23f, 0xe8434a, 0xfaf7f0].forEach((c, i) => { const a = i / 4 * TAU; b.sph(.08, c, Math.cos(a) * .11, .5, Math.sin(a) * .11, 1, .7, 1); }); b.jit(.1); b.ico(.12, 0, 0x5aae46, 0, .45, 0); return b.done(); };
  MD.parasol = v => { const b = G.mb(60); b.cyl(.03, .03, 2.1, 5, 0xf7f5ee, 0, 1.05, 0); for (let i = 0; i < 8; i++) b.geo(new THREE.ConeGeometry(1.15, .5, 2, 1, false, i / 8 * TAU, TAU / 8), i % 2 ? 0xffffff : 0xe8434a, b.M(0, 2.0, 0)); b.sph(.05, 0xf7f5ee, 0, 2.27, 0); b.cyl(.2, .25, .08, 8, 0xdcd6c8, 0, .04, 0); return b.done(); };
  MD.deckchair = v => { const b = G.mb(61); for (const x of [-.28, .28]) { b.box(.05, .05, 1, LWOOD, x, .25, 0, -.1); b.box(.05, .6, .05, LWOOD, x, .45, -.42, .5); } for (let i = 0; i < 4; i++) b.box(.52, .03, .22, i % 2 ? 0xffffff : 0x4aa8e0, 0, .3 + Math.max(0, i - 1) * .18, .3 - i * .22, i > 1 ? -.9 : -.1); return b.done(); };
  MD.workbench = v => { const b = G.mb(62); b.box(1.8, .12, .8, LWOOD, 0, .82, 0); legs(b, 1.7, .7, .78, DWOOD, .1); b.box(1.6, .06, .6, WOOD, 0, .3, 0); b.box(.18, .14, .18, IRON, .7, .95, .25); b.box(.5, .02, .12, 0xc9ccd2, -.3, .89, .1, 0, .3); b.box(.06, .06, .3, DWOOD, .2, .9, -.15, 0, .5); b.box(.1, .08, .14, IRON, .25, .92, -.25, 0, .5); return b.done(); };
  MD.scarecrow = v => { const b = G.mb(63); b.box(.08, 1.5, .08, DWOOD, 0, .75, 0); b.box(1, .07, .07, DWOOD, 0, 1.15, 0); b.box(.5, .5, .25, 0x5b8fd6, 0, 1.05, 0); b.sph(.2, 0xe8d29a, 0, 1.48, 0); b.cyl(.38, .38, .03, 10, 0xd9be5c, 0, 1.63, 0); b.cone(.2, .28, 8, 0xd9be5c, 0, 1.78, 0); b.box(.05, .05, .01, 0x2a2a2a, -.07, 1.52, .19); b.box(.05, .05, .01, 0x2a2a2a, .07, 1.52, .19); return b.done(); };
  MD.snowman = v => { const b = G.mb(64); b.sph(.42, 0xffffff, 0, .4, 0); b.sph(.3, 0xffffff, 0, .95, 0); b.sph(.21, 0xffffff, 0, 1.35, 0); b.cone(.04, .18, 5, 0xff8a1f, 0, 1.35, .26, Math.PI / 2); b.sph(.03, 0x222222, -.07, 1.42, .18); b.sph(.03, 0x222222, .07, 1.42, .18); b.cyl(.15, .15, .2, 10, 0x2a2a35, 0, 1.6, 0); b.cyl(.22, .22, .03, 10, 0x2a2a35, 0, 1.51, 0); b.cyl(.015, .02, .5, 4, DWOOD, .45, 1.0, 0, 0, 0, -1); b.cyl(.015, .02, .5, 4, DWOOD, -.45, 1.0, 0, 0, 0, 1); b.box(.5, .06, .1, 0xe8434a, 0, 1.17, .05); return b.done(); };
  MD.swing = v => { const b = G.mb(65); for (const x of [-.85, .85]) { b.box(.08, 2.05, .08, DWOOD, x, 1, .3, .28); b.box(.08, 2.05, .08, DWOOD, x, 1, -.3, -.28); } b.cyl(.05, .05, 1.8, 6, DWOOD, 0, 1.95, 0, 0, 0, Math.PI / 2); for (const x of [-.25, .25]) b.cyl(.012, .012, 1.4, 3, 0xe8d29a, x, 1.25, 0); b.box(.6, .05, .25, 0xe8434a, 0, .55, 0); return b.done(); };
  MD.windmill = v => { const b = G.mb(66); b.cyl(.85, 1.25, 4, 10, 0xf2ece0, 0, 2, 0); b.cone(1.05, 1.1, 10, 0xb5533f, 0, 4.55, 0); b.box(.5, .9, .06, DWOOD, 0, .45, 1.2); b.box(.35, .35, .05, WIN, 0, 2.6, 1.0, -.2, 0, 0, 1); b.cyl(.12, .12, .4, 8, DWOOD, 0, 3.6, 1.05, Math.PI / 2); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .3; b.box(.32, 1.8, .04, i % 2 ? 0xf7f5ee : 0xe9dfc8, Math.sin(a) * .95, 3.6 + Math.cos(a) * .95, 1.28, 0, 0, -a); } return b.done(); };
  MD.lighthouse = v => { const b = G.mb(67); for (let i = 0; i < 6; i++) { const r0 = .85 - i * .08, r1 = .85 - (i + 1) * .08; b.cyl(r1, r0, .8, 12, i % 2 ? 0xe8443a : 0xf7f5ee, 0, .4 + i * .8, 0); } b.cyl(.6, .6, .12, 12, IRON, 0, 4.86, 0); b.cyl(.36, .36, .6, 10, 0xfff3b0, 0, 5.2, 0, 0, 0, 0, 1); b.cone(.48, .5, 10, 0xe8443a, 0, 5.75, 0); b.box(.4, .7, .06, DWOOD, 0, .35, .82); return b.done(); };
  MD.bridge = v => { const b = G.mb(68); for (let i = 0; i < 5; i++) b.box(1.02, .1, .17, i % 2 ? WOOD : LWOOD, 0, .05, -.4 + i * .2); for (const x of [-.48, .48]) { b.box(.06, .06, 1.02, DWOOD, x, .55, 0); b.box(.08, .55, .08, DWOOD, x, .28, -.45); b.box(.08, .55, .08, DWOOD, x, .28, .45); } b.box(.9, .12, .12, DWOOD, 0, -.05, 0, 0, 0, 0); return b.done(); };
  MD.pier = v => { const b = G.mb(69); for (let i = 0; i < 5; i++) b.box(1.02, .09, .18, i % 2 ? 0xb08a5c : 0xc69c68, 0, .05, -.4 + i * .2); for (const x of [-.42, .42]) b.cyl(.07, .07, 1.6, 6, DWOOD, x, -.7, 0); return b.done(); };
  MD.planks = v => { const b = G.mb(70); for (let i = 0; i < 5; i++) b.box(.98, .08, .18, i % 2 ? WOOD : LWOOD, 0, .04, -.4 + i * .2); return b.done(); };
  MD.bed = v => { const b = G.mb(71); b.box(.95, .3, 1.9, DWOOD, 0, .18, 0); b.box(.88, .14, 1.8, 0xfaf7f0, 0, .38, 0); b.box(.92, .1, 1.2, 0x6c8cff, 0, .47, .3); b.box(.6, .12, .3, 0xffffff, 0, .5, -.68); b.box(.95, .8, .1, DWOOD, 0, .4, -.95); b.box(.95, .5, .08, DWOOD, 0, .25, .95); return b.done(); };
  MD.sleepbag = v => { const b = G.mb(72); b.box(.75, .12, 1.7, 0x4f9a4a, 0, .06, .05); b.sph(.37, 0x5aae46, 0, .1, .7, 1, .3, .4); b.box(.5, .1, .3, 0xfaf7f0, 0, .14, -.65); return b.done(); };
  MD.rug = v => { const b = G.mb(73); b.cyl(.95, .95, .02, 18, 0xd77a61, 0, .01, 0); b.cyl(.7, .7, .025, 18, 0xf2c46b, 0, .012, 0); b.cyl(.4, .4, .03, 18, 0x6c8cff, 0, .014, 0); return b.done(); };
  MD.shelf = v => { const b = G.mb(74); for (const x of [-.42, .42]) b.box(.06, 1.8, .4, WOOD, x, .9, 0); for (let i = 0; i < 4; i++) b.box(.86, .05, .4, LWOOD, 0, .05 + i * .55, 0); const r = G.rng(3); for (let s = 0; s < 3; s++) for (let i = 0; i < 6; i++) b.box(.1, .32 + r() * .12, .3, [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffc23d, 0x8d6fd1][Math.floor(r() * 5)], -.32 + i * .12, .26 + s * .55, 0); return b.done(); };
  MD.wardrobe = v => { const b = G.mb(75); b.box(.9, 1.95, .55, LWOOD, 0, .98, 0); b.box(.02, 1.7, .01, DWOOD, 0, 1, .28); b.sph(.03, 0xffd23f, -.07, 1.0, .29); b.sph(.03, 0xffd23f, .07, 1.0, .29); b.box(.95, .08, .6, WOOD, 0, 1.98, 0); return b.done(); };
  MD.sofa = v => { const b = G.mb(76), c = 0xd77a61; b.box(1.8, .35, .8, c, 0, .22, 0); b.box(1.8, .5, .2, c, 0, .62, -.3); for (const x of [-.85, .85]) b.box(.2, .5, .8, c, x, .4, 0); for (const x of [-.4, .4]) b.box(.75, .12, .6, 0xe58f78, x, .45, .05); return b.done(); };
  MD.lamp_table = v => { const b = G.mb(77); b.box(.5, .5, .45, LWOOD, 0, .25, 0); b.box(.04, .2, .02, DWOOD, 0, .3, .23); b.cyl(.08, .1, .05, 8, 0xf7f5ee, 0, .53, 0); b.cyl(.025, .025, .25, 5, 0xf7f5ee, 0, .67, 0); b.cyl(.13, .2, .2, 8, 0xfff0c2, 0, .86, 0, 0, 0, 0, 1); return b.done(); };
  MD.plant_pot = v => { const b = G.mb(78); b.cyl(.22, .16, .36, 8, 0xf7f5ee, 0, .18, 0); b.jit(.12); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.sph(.17, i % 2 ? 0x3f8f45 : 0x58b54a, Math.cos(a) * .17, .62 + (i % 3) * .1, Math.sin(a) * .17, .6, 1.4, .35); } b.ico(.15, 0, 0x4a9e45, 0, .9, 0); return b.done(); };
  MD.doormat = v => { const b = G.mb(79); b.box(.9, .03, .6, 0x9b5a2a, 0, .015, 0); b.box(.7, .035, .4, 0xc07a3a, 0, .02, 0); return b.done(); };
  MD.fireplace = v => { const b = G.mb(80); b.box(1.7, 1.4, .6, 0xc4654a, 0, .7, 0); b.box(.9, .7, .1, 0x2a1a12, 0, .45, .27); b.box(1.9, .1, .7, WOOD, 0, 1.45, 0); b.box(.7, .5, .5, 0xa9553e, 0, 1.75, -.05); flame(b, 0, .12, .25, 1.1); flame(b, .18, .12, .22, .7); return b.done(); };
  MD.tv = v => { const b = G.mb(81); b.box(.9, .4, .45, DWOOD, 0, .2, 0); b.box(.8, .52, .1, 0x2a2d33, 0, .68, 0); b.box(.7, .42, .02, 0x8fd0ff, 0, .68, .05, 0, 0, 0, 1); return b.done(); };

  // ---------- Constructions ----------
  const ROOFS = [0xd9544d, 0x4a7fd1, 0xf08bb0, 0x55a85a, 0xf29a3a, 0x8d6fd1, 0x3fb3b0, 0xe8c23a, 0xc0503c];
  const WALLS = [0xfaf1dc, 0xf2f2ea, 0xfff4f6, 0xf3f7e8, 0xfff1dd, 0xf0ebff, 0xe8fbf9, 0xfffae6, 0xf7efe2];
  function windowAt(b, x, y, z, ry = 0, w = .5, h = .5) {
    b.box(w + .1, h + .1, .06, 0xf7f5ee, x, y, z, 0, ry); b.box(w, h, .07, WIN, x, y, z + (ry ? 0 : .005), 0, ry, 0, 1);
    b.box(w, .04, .08, 0xf7f5ee, x, y, z, 0, ry); b.box(.04, h, .08, 0xf7f5ee, x, y, z, 0, ry);
  }
  G.windowAt = windowAt;
  function door(b, x, z, col = DWOOD) { b.box(.62, 1.15, .08, col, x, .6, z); b.box(.68, .06, .1, 0xf7f5ee, x, 1.2, z); b.sph(.04, 0xffd23f, x + .2, .58, z + .05); b.box(.8, .08, .4, STONE, x, .04, z + .2); }
  MD.house = v => {
    const b = G.mb(90 + v), roof = ROOFS[v % ROOFS.length], wall = WALLS[v % WALLS.length];
    b.box(2.6, 1.9, 2.3, wall, 0, .95, -.05); b.box(2.7, .16, 2.4, 0xb9a58a, 0, .08, -.05);
    prism(b, 3.2, 1.35, 2.9, roof, 0, 1.88, -.05, Math.PI / 2);
    prism(b, 2.6, 1.17, 2.32, wall, 0, 1.88, -.05, Math.PI / 2);
    b.box(.38, .9, .38, 0xa9553e, .75, 2.75, -.5); b.box(.46, .1, .46, 0x8e4532, .75, 3.2, -.5);
    door(b, 0, 1.12, v % 2 ? 0x6b4a32 : DWOOD); windowAt(b, -.82, 1.15, 1.11); windowAt(b, .82, 1.15, 1.11);
    windowAt(b, 1.31, 1.1, -.05, Math.PI / 2); windowAt(b, -1.31, 1.1, -.05, Math.PI / 2);
    b.box(.9, .06, .3, roof, -.82, 1.48, 1.2); b.box(.9, .06, .3, roof, .82, 1.48, 1.2);
    b.jit(.12); b.ico(.28, 1, 0x4fa847, -1.35, .25, 1.15, 1, .8, 1); b.ico(.25, 1, 0x58b54a, 1.35, .22, 1.15, 1, .8, 1); b.jit(0);
    return b.done();
  };
  MD.villa = v => {
    const b = G.mb(99), roof = 0x5a6fb8, wall = 0xfaf4e6;
    b.box(3.6, 2.2, 2.4, wall, 0, 1.1, -.05); b.box(3.7, .16, 2.5, 0xb9a58a, 0, .08, -.05);
    prism(b, 4.3, 1.5, 3.0, roof, 0, 2.18, -.05, Math.PI / 2); prism(b, 3.6, 1.26, 2.42, wall, 0, 2.18, -.05, Math.PI / 2);
    b.box(1.2, 1.8, .9, wall, 1.1, .9, 1.4); prism(b, 1.5, .7, 1.05, roof, 1.1, 1.8, 1.4);
    door(b, -.5, 1.17); windowAt(b, -1.35, 1.25, 1.16); windowAt(b, 1.1, 1.2, 1.86); windowAt(b, .25, 1.6, 1.16, 0, .4, .4);
    windowAt(b, 0, 2.75, 1.0, 0, .45, .4); windowAt(b, 1.81, 1.2, -.3, Math.PI / 2); windowAt(b, -1.81, 1.2, -.3, Math.PI / 2);
    b.box(.4, 1.1, .4, 0xa9553e, -1.1, 3.1, -.6); return b.done();
  };
  MD.cabin = v => {
    const b = G.mb(98), log = 0x9a6a40;
    for (let i = 0; i < 6; i++) { b.cyl(.15, .15, 2.7, 7, i % 2 ? log : 0x8a5d38, 0, .15 + i * .29, 1.05, 0, 0, Math.PI / 2); b.cyl(.15, .15, 2.7, 7, i % 2 ? log : 0x8a5d38, 0, .15 + i * .29, -1.15, 0, 0, Math.PI / 2); b.cyl(.15, .15, 2.3, 7, i % 2 ? 0x8a5d38 : log, 1.2, .3 + i * .29, -.05, Math.PI / 2); b.cyl(.15, .15, 2.3, 7, i % 2 ? 0x8a5d38 : log, -1.2, .3 + i * .29, -.05, Math.PI / 2); }
    b.box(2.3, 1.7, 2.1, 0x8a5d38, 0, .9, -.05);
    prism(b, 3.1, 1.2, 2.9, 0x5a3f2c, 0, 1.75, -.05, Math.PI / 2); prism(b, 2.6, 1.0, 2.3, 0x9a6a40, 0, 1.75, -.05, Math.PI / 2);
    door(b, .3, 1.21, 0x6b4a32); windowAt(b, -.65, 1.05, 1.22); b.box(.36, .8, .36, DSTONE, -.8, 2.6, -.5); flame(b, -.8, 2.98, -.5, .0001);
    return b.done();
  };
  MD.tent = v => {
    const b = G.mb(97); prism(b, 1.9, 1.75, 1.8, 0xf08c3a, 0, 0, 0);
    const g = new THREE.CircleGeometry(.62, 3); g.rotateZ(Math.PI / 2); b.geo(g, 0x4a2c1a, b.M(0, .41, .905, 0, 0, 0, .9, 1.14, 1));
    prism(b, 1.95, .08, 1.84, 0xd8742a, 0, 1.68, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.box(.04, .2, .04, DWOOD, sx * 1.1, .1, sz * .85); b.cyl(.008, .008, 1.2, 3, 0xe8d29a, sx * .9, .55, sz * .87, 0, 0, sx * .85); }
    b.cyl(.03, .03, 2, 5, DWOOD, 0, 1.0, 0); return b.done();
  };
  MD.shop = v => {
    const b = G.mb(96), wall = 0xfff4dc;
    b.box(3.6, 2.4, 2.4, wall, 0, 1.2, -.1); b.box(3.7, .16, 2.5, 0xb9a58a, 0, .08, -.1);
    prism(b, 4.2, 1.3, 3.0, 0x3f9a59, 0, 2.38, -.1, Math.PI / 2); prism(b, 3.6, 1.1, 2.42, wall, 0, 2.38, -.1, Math.PI / 2);
    for (let i = 0; i < 8; i++) b.box(.46, .08, .7, i % 2 ? 0xffffff : 0x4fb35f, -1.61 + i * .46, 1.95, 1.35, .45);
    b.box(1.2, 1.0, .06, WIN, -1.0, 1.2, 1.12, 0, 0, 0, 1); b.box(1.3, .08, .1, 0xf7f5ee, -1.0, 1.72, 1.12); b.box(1.3, .08, .1, 0xf7f5ee, -1.0, .68, 1.12);
    door(b, .8, 1.12, 0x3f7a4a); b.box(1.6, .5, .1, 0x6b4a32, 0, 2.95, 1.05); b.sph(.16, 0x4fb35f, -.4, 2.95, 1.1, 1, 1, .4); b.sph(.12, 0xffc23d, .1, 2.95, 1.1, 1, 1, .4); b.sph(.12, 0xe8434a, .5, 2.95, 1.1, 1, 1, .4);
    b.box(.6, .55, .45, LWOOD, 1.55, .28, 1.45); b.sph(.12, 0xe8343a, 1.45, .6, 1.45); b.sph(.12, 0xff9420, 1.65, .6, 1.4);
    return b.done();
  };
})();
