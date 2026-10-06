'use strict';
// ===== Rue commerçante v2 : vrais immeubles à étages collés les uns aux autres, galerie d'art, brocante Méli-Mélo, habitations =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, WIN = 0xfff0c2, ST = 0xd9d2c2, P = (...a) => G.prism(...a);
  const dark = c => new THREE.Color(c).multiplyScalar(.75).getHex();
  // ---------- façade paramétrique : rez-de-chaussée, étages, balcons, volets, jardinières, toits ----------
  function facade(b, o) {
    const w = o.w, W = w - .08, D = 2.3, z0 = -.15, fz = z0 + D / 2, fl = o.floors || 2, g = 1.95, FH = 1.5, Ht = g + (fl - 1) * FH, top = .16 + Ht, nW = o.nWin || (w >= 4 ? 3 : 2);
    b.box(W + .14, .16, D + .3, 0xb9a58a, 0, .08, z0 + .05); b.box(W, Ht, D, o.wall, 0, .16 + Ht / 2, z0);
    if (o.base != null) { b.jit(o.baseJit || 0); b.box(W + .04, g - .05, D + .04, o.base, 0, .16 + (g - .05) / 2, z0); b.jit(0); }
    for (let i = 0; i < fl; i++) b.box(W + .14, .1, .18, o.trim, 0, .16 + g + i * FH, fz + .03);
    for (const s of [-1, 1]) b.box(.14, Ht, .1, o.trim, s * (W / 2 - .02), .16 + Ht / 2, fz + .02);
    for (let i = 1; i < fl; i++) { const y = .16 + g + (i - .5) * FH + .12;
      for (let k = 0; k < nW; k++) { const x = -W / 2 + (k + .5) * W / nW, arch = o.arched;
        b.box(.62, .82, .06, o.frame || 0xf7f5ee, x, y, fz + .02); b.box(.5, .7, .07, WIN, x, y, fz + .03, 0, 0, 0, 1); b.box(.035, .7, .08, o.frame || 0xf7f5ee, x, y, fz + .045); b.box(.5, .035, .08, o.frame || 0xf7f5ee, x, y + .1, fz + .045);
        if (arch) b.add(new THREE.CylinderGeometry(.31, .31, .07, 12, 1, false, -Math.PI / 2, Math.PI), o.frame || 0xf7f5ee, b.M(x, y + .41, fz + .03, -Math.PI / 2, 0, 0)); else b.box(.72, .07, .13, o.trim, x, y + .46, fz + .05);
        if (o.shutters != null) for (const s of [-1, 1]) { b.box(.2, .74, .045, o.shutters, x + s * .43, y, fz + .04); for (let l = 0; l < 4; l++) b.box(.18, .02, .05, dark(o.shutters), x + s * .43, y - .27 + l * .18, fz + .045); }
        if (o.flowers && i === 1) { b.box(.62, .13, .17, 0x8a5a34, x, y - .47, fz + .1); b.sph(.08, 0x58b54a, x, y - .38, fz + .1, 3.3, .6, 1.1); for (let f = 0; f < 4; f++) b.sph(.055, [0xff8fc0, 0xe8434a, 0xffd23f, 0xffffff][(f + k + i) % 4], x - .22 + f * .15, y - .34, fz + .14); } }
      if (o.balcony && i === o.balcony) { const bw = W * .82; b.box(bw, .07, .46, ST, 0, y - .5, fz + .22); for (let k = 0; k <= 9; k++) b.box(.035, .36, .035, 0x2a2d33, -bw / 2 + k * bw / 9, y - .3, fz + .43); b.box(bw, .045, .05, 0x2a2d33, 0, y - .11, fz + .43); for (const s of [-1, 1]) b.box(.035, .36, .4, 0x2a2d33, s * bw / 2, y - .3, fz + .24); } }
    b.box(W + .24, .16, D + .14, o.trim, 0, top + .08, z0); for (let k = 0; k < Math.round(W / .3); k++) b.box(.08, .1, .1, o.trim, -W / 2 + .15 + k * .3, top - .02, fz + .1);
    if (o.roof === 'plat') { b.box(W + .1, .34, .14, o.trim, 0, top + .32, fz - .02); for (const s of [-1, 1]) b.box(.14, .34, D, o.trim, s * W / 2, top + .32, z0); if (o.balustre) for (let k = 0; k < Math.round(W / .22); k++) b.cyl(.035, .045, .26, 6, ST, -W / 2 + .12 + k * .22, top + .3, fz + .05); }
    else if (o.roof === 'mansarde') { b.box(W + .06, .95, D - .1, o.roofCol, 0, top + .63, z0 - .05); b.box(W + .1, 1.0, .1, o.roofCol, 0, top + .6, fz - .22, -.32); b.box(W - .4, .1, D - .6, dark(o.roofCol), 0, top + 1.12, z0 - .1);
      for (let k = 0; k < nW; k++) { const x = -W / 2 + (k + .5) * W / nW; b.box(.46, .55, .5, o.wall, x, top + .58, fz - .12); P(b, .64, .34, .64, o.roofCol, x, top + .86, fz - .12); b.box(.3, .34, .03, WIN, x, top + .55, fz + .15, 0, 0, 0, 1); } }
    else { const rh = o.roofH || 1.15; P(b, D + .55, rh, W + .3, o.roofCol, 0, top + .1, z0, Math.PI / 2); P(b, D, rh * .85, W, o.wall, 0, top + .1, z0, Math.PI / 2); if (o.oeil) { b.cyl(.2, .2, .06, 14, WIN, 0, top + .5, fz - .2, Math.PI / 2, 0, 0, 1); b.add(new THREE.TorusGeometry(.21, .04, 5, 16), o.trim, b.M(0, top + .5, fz - .17), 0, true); } }
    if (o.chimney) { b.box(.32, .95, .32, 0xa9553e, W / 2 - .45, top + .85, z0 - .45); b.box(.38, .08, .38, 0x8e4532, W / 2 - .45, top + 1.34, z0 - .45); }
    return { W, fz, g, top, Ht };
  }
  G.facade = facade;
  const door = (b, x, fz, col, w = .7) => { b.box(w + .14, 1.44, .06, 0xf7f5ee, x, .88, fz + .02); b.box(w, 1.33, .08, col, x, .83, fz + .03); b.box(.02, 1.26, .09, dark(col), x, .83, fz + .04); for (const s of [-1, 1]) b.box(w * .36, .5, .085, dark(col), x + s * w * .24, 1.05, fz + .035); b.sph(.035, 0xffd23f, x - .07, .82, fz + .09); b.sph(.035, 0xffd23f, x + .07, .82, fz + .09); b.box(w + .32, .07, .45, ST, x, .05, fz + .25); };
  const vitrine = (b, x, fz, w, frame) => { b.box(w + .12, 1.18, .06, frame, x, 1.02, fz + .02); b.box(w, 1.04, .07, WIN, x, 1.02, fz + .03, 0, 0, 0, 1); b.box(w + .18, .1, .22, frame, x, .4, fz + .09); for (let k = 1; k < Math.round(w / .55); k++) b.box(.04, 1.04, .08, frame, x - w / 2 + k * w / Math.round(w / .55), 1.02, fz + .04); };
  const awning = (b, W, fz, y, c1, c2) => { const n = Math.max(4, Math.round(W / .4)); for (let i = 0; i < n; i++) { const c = i % 2 ? c2 : c1, x = -W / 2 + (i + .5) * W / n; b.box(W / n + .006, .07, .72, c, x, y, fz + .33, .42); b.cone(W / n / 2, .14, 3, c, x, y - .2, fz + .63, Math.PI, Math.PI / 6, 0); } };
  const board = (b, w, fz, y, col, edge) => { b.box(w, .38, .08, col, 0, y, fz + .06); b.box(w + .08, .05, .09, edge, 0, y + .19, fz + .06); b.box(w + .08, .05, .09, edge, 0, y - .19, fz + .06); };
  const pot = (b, x, z, col) => { b.cyl(.17, .13, .26, 8, 0xc8673e, x, .13, z); b.jit(.12); b.ico(.2, 1, 0x4f9a46, x, .45, z, 1, 1.1, 1); b.jit(0); b.sph(.05, col, x + .08, .55, z + .12); b.sph(.05, col, x - .1, .5, z + .1); };
  // ---------- boutiques ----------
  MD.shop = v => { const b = G.mb(201), o = G.facade(b, { w: 4, floors: 2, wall: 0xfff4dc, base: 0x3f9a59, trim: 0xf7f5ee, roof: 'pignon', roofCol: 0x3f9a59, shutters: 0x2f7a45, flowers: 1, chimney: 1, oeil: 1 });
    vitrine(b, -.85, o.fz, 1.55, 0x2f7a45); door(b, 1.1, o.fz, 0x2f6b45); awning(b, o.W, o.fz, 1.78, 0x3f9a59, 0xffffff); board(b, o.W * .62, o.fz, 2.42, 0x2f6b45, 0xffd23f);
    b.box(.8, .5, .45, 0xc69c68, -1.35, .25, o.fz + .62); for (let i = 0; i < 6; i++) b.sph(.09, [0xe8343a, 0xff9420, 0xffd23f][i % 3], -1.62 + i * .11, .55, o.fz + .58);
    for (const [x, c] of [[-1.3, 0xe8434a], [-.9, 0x5b8fd6], [-.5, 0xffd23f]]) b.box(.22, .28, .2, c, x, .62, o.fz - .25); return b.done(); };
  MD.couturiere = v => { const b = G.mb(202), o = G.facade(b, { w: 3, floors: 2, wall: 0xffe6ef, base: 0xffffff, trim: 0xf7c6d8, roof: 'mansarde', roofCol: 0xe86f9c, shutters: 0xff8fc0, flowers: 1, frame: 0xffffff });
    vitrine(b, -.42, o.fz, 1.25, 0xe86f9c); door(b, .95, o.fz, 0xb5533f, .58); awning(b, o.W, o.fz, 1.78, 0xff8fc0, 0xffffff); board(b, o.W * .7, o.fz, 2.42, 0xffffff, 0xe86f9c);
    for (const [x, c] of [[-.75, 0x8d6fd1], [-.15, 0x3fb3b0]]) { b.cyl(.13, .22, .5, 10, c, x, .95, o.fz - .2); b.sph(.09, c, x, 1.25, o.fz - .2, 1.2, .6, 1); b.sph(.06, 0xf3e6c8, x, 1.36, o.fz - .2); } return b.done(); };
  MD.cafe = v => { const b = G.mb(203), o = G.facade(b, { w: 3, floors: 3, wall: 0xf3e2c4, base: 0x9a4f36, baseJit: .1, trim: 0x6b4426, roof: 'plat', balcony: 1, shutters: 0x2f6b45, flowers: 1 });
    vitrine(b, -.5, o.fz, 1.15, 0x6b4426); door(b, .88, o.fz, 0x2f6b45, .62); awning(b, o.W, o.fz, 1.78, 0x2f6b45, 0xf7f5ee); board(b, o.W * .7, o.fz, 2.42, 0x2f2a26, 0xe8c27a);
    const y = o.top + .55; b.cyl(.42, .42, .05, 16, 0xf7f5ee, 0, y, .1); b.cyl(.27, .21, .42, 14, 0xf7f5ee, 0, y + .23, .1, 0, 0, 0, 0, true); b.cyl(.24, .24, .02, 14, 0x5a3420, 0, y + .43, .1); b.add(new THREE.TorusGeometry(.12, .035, 6, 12), 0xf7f5ee, b.M(.3, y + .23, .1), 0, true);
    b.sph(.07, 0xffffff, -.04, y + .6, .1, 1, 1, 1, 2); b.sph(.06, 0xffffff, .05, y + .74, .1, 1, 1, 1, 2);
    for (const x of [-1.05, .2]) { b.cyl(.28, .28, .04, 12, 0xf7f5ee, x, .72, o.fz + 1.0); b.cyl(.04, .05, .7, 6, 0x2a2d33, x, .36, o.fz + 1.0); } return b.done(); };
  MD.salon = v => { const b = G.mb(204), o = G.facade(b, { w: 3, floors: 2, wall: 0xffd9e8, base: 0xffffff, trim: 0xb06ab3, roof: 'mansarde', roofCol: 0x8d4f9a, flowers: 1, arched: 1 });
    b.cyl(.42, .42, .06, 20, WIN, -.45, 1.05, o.fz + .03, Math.PI / 2, 0, 0, 1); b.add(new THREE.TorusGeometry(.44, .055, 6, 22), 0xb06ab3, b.M(-.45, 1.05, o.fz + .06), 0, true); for (let k = 0; k < 4; k++) b.box(.02, .84, .07, 0xffffff, -.45, 1.05, o.fz + .06, 0, 0, k * Math.PI / 4);
    door(b, .88, o.fz, 0xffffff, .58); board(b, o.W * .7, o.fz, 2.42, 0xb06ab3, 0xffffff);
    for (let i = 0; i < 8; i++) b.cyl(.07, .07, .13, 10, [0xe8434a, 0xffffff, 0x4a7fd1][i % 3], 1.38, .5 + i * .13, o.fz + .12); b.sph(.09, 0xf7f5ee, 1.38, 1.6, o.fz + .12);
    for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(.1, .028, 6, 14), 0xd9b84a, b.M(-.16 * s, 1.95, o.fz + .12), 0, true); } return b.done(); };
  MD.chausseur = v => { const b = G.mb(205), o = G.facade(b, { w: 3, floors: 2, wall: 0xeed9b5, base: 0x2f6b6b, trim: 0xf7f5ee, roof: 'pignon', roofCol: 0x2f6b6b, shutters: 0x2f6b6b, flowers: 1 });
    vitrine(b, -.45, o.fz, 1.2, 0x1f4f4f); door(b, .92, o.fz, 0x1f4f4f, .58); awning(b, o.W, o.fz, 1.78, 0xf29a3a, 0xffffff); board(b, o.W * .7, o.fz, 2.42, 0x1f4f4f, 0xf29a3a);
    [0xe8434a, 0x5b8fd6, 0xffd23f].forEach((c, i) => { b.box(.2, .1, .3, c, -.85 + i * .38, .85, o.fz - .15); b.box(.08, .12, .1, c, -.91 + i * .38, .94, o.fz - .23); });
    b.box(.06, .06, .5, 0x2a2d33, 1.3, 2.75, o.fz + .2); b.box(.3, .45, .22, 0x8a5a34, 1.3, 2.45, o.fz + .45); b.box(.48, .17, .22, 0x8a5a34, 1.39, 2.17, o.fz + .45); b.box(.31, .05, .23, 0xf7f5ee, 1.3, 2.65, o.fz + .45); return b.done(); };
  MD.agence = v => { const b = G.mb(206), o = G.facade(b, { w: 3, floors: 3, wall: 0xe3eaf3, base: 0xb9c4d4, trim: 0xffffff, roof: 'mansarde', roofCol: 0x3d4f7a, balcony: 2, shutters: 0x5b8fd6 });
    door(b, 0, o.fz, 0x3d4f7a, .7); for (const x of [-.55, .55]) b.cyl(.07, .085, 1.6, 10, 0xffffff, x, .96, o.fz + .2, 0, 0, 0, 0, true); P(b, 1.4, .34, .5, 0xffffff, 0, 1.78, o.fz + .2);
    for (const x of [-1.05, 1.05]) { b.box(.4, .62, .06, WIN, x, 1.05, o.fz + .03, 0, 0, 0, 1); b.box(.5, .72, .05, 0xffffff, x, 1.05, o.fz + .02); }
    board(b, o.W * .66, o.fz, 2.42, 0xffffff, 0x3d4f7a); b.box(.36, .24, .1, 0xf3d9b0, -.6, 2.42, o.fz + .12); P(b, .46, .22, .12, 0xd9544d, -.6, 2.54, o.fz + .12); return b.done(); };
  MD.club = v => { const b = G.mb(207), o = G.facade(b, { w: 3, floors: 2, wall: 0x5b3f8f, base: 0x3f2a66, trim: 0xffd23f, roof: 'plat', frame: 0xffd23f });
    b.box(.8, 1.26, .08, 0xc0283a, 0, .8, o.fz + .03); for (let i = 0; i < 4; i++) b.box(.04, 1.2, .09, 0x9a1f2e, -.27 + i * .18, .8, o.fz + .04); b.box(1.05, .1, .12, 0xffd23f, 0, 1.48, o.fz + .05);
    for (let i = 0; i < 11; i++) b.sph(.045, 0xfff3b0, -.6 + i * .12, 1.62, o.fz + .08, 1, 1, 1, 1); for (const x of [-.6, .6]) for (let k = 0; k < 4; k++) b.sph(.045, 0xfff3b0, x, .5 + k * .3, o.fz + .08, 1, 1, 1, 1);
    [[-1.05, 0xff8fc0], [1.05, 0x6fe3d0]].forEach(([x, c]) => { b.box(.46, .66, .04, c, x, 1.05, o.fz + .03); b.sph(.12, 0xffffff, x, 1.15, o.fz + .06, 1, 1, .3); });
    board(b, o.W * .8, o.fz, 2.42, 0xff5fa8, 0xffd23f); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.geo(new THREE.ConeGeometry(.2, .66, 3), 0xffd23f, b.M(Math.sin(a) * .3, o.top + 1.0 + Math.cos(a) * .3, 0, 0, 0, -a), 1); } b.cyl(.24, .24, .12, 10, 0xffd23f, 0, o.top + 1.0, 0, Math.PI / 2, 0, 0, 1); b.box(.06, .5, .06, 0x2a2d33, 0, o.top + .5, 0); return b.done(); };
  MD.melimelo = v => { const b = G.mb(208), o = G.facade(b, { w: 4, floors: 2, wall: 0xf0d9a8, base: 0x8a5a34, baseJit: .08, trim: 0x6b4426, roof: 'pignon', roofCol: 0xb5533f, shutters: 0x4f9a46, flowers: 1, chimney: 1 });
    vitrine(b, -.75, o.fz, 1.75, 0x6b4426); door(b, 1.15, o.fz, 0x4f9a46, .62); awning(b, o.W, o.fz, 1.78, 0xffc23d, 0x8a5a34); board(b, o.W * .62, o.fz, 2.42, 0x6b4426, 0xffc23d);
    b.box(.45, .06, .45, 0xd4a46c, -1.25, .66, o.fz - .25); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(.05, .6, .05, 0x85552f, -1.25 + sx * .18, .36, o.fz - .25 + sz * .18); b.box(.45, .45, .06, 0xd4a46c, -1.25, .95, o.fz - .46);
    b.cyl(.06, .08, .1, 8, 0xf7f5ee, -.4, .48, o.fz - .25); b.cyl(.02, .02, .3, 5, 0xf7f5ee, -.4, .68, o.fz - .25); b.cyl(.12, .18, .18, 8, 0xfff0c2, -.4, .9, o.fz - .25, 0, 0, 0, 1);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.add(new THREE.TorusGeometry(.13, .035, 4, 10, TAU / 4), 0x4fb35f, b.M(0, 2.42, o.fz + .12, 0, 0, a), 0, true); } return b.done(); };
  MD.galerie = v => { const b = G.mb(209), o = G.facade(b, { w: 4, floors: 2, wall: 0xf3eee3, base: 0xdcd5c6, trim: 0xd9b84a, roof: 'plat', balustre: 1, arched: 1, frame: 0xffffff });
    door(b, 0, o.fz, 0x3a2a1a, .8); for (const x of [-1.25, 1.25]) { b.box(.7, 1.1, .06, WIN, x, 1.0, o.fz + .03, 0, 0, 0, 1); b.add(new THREE.CylinderGeometry(.35, .35, .07, 12, 1, false, -Math.PI / 2, Math.PI), WIN, b.M(x, 1.55, o.fz + .03, -Math.PI / 2, 0, 0), 1); b.box(.8, .06, .2, 0xd9b84a, x, .43, o.fz + .08); }
    for (const x of [-.75, .75]) { b.cyl(.09, .1, 1.8, 10, 0xffffff, x, 1.05, o.fz + .18, 0, 0, 0, 0, true); b.box(.26, .1, .26, 0xd9b84a, x, 1.98, o.fz + .18); b.box(.26, .08, .26, 0xd9b84a, x, .12, o.fz + .18); }
    board(b, o.W * .55, o.fz, 2.42, 0x3a2a1a, 0xd9b84a); b.box(.42, .32, .06, 0xd9b84a, 0, 2.42, o.fz + .12); b.box(.32, .22, .065, 0x5b8fd6, 0, 2.42, o.fz + .13); b.sph(.06, 0xffd23f, .06, 2.45, o.fz + .17);
    b.sph(.35, 0x7fb6c8, 0, o.top + .55, -.2, 1, .8, 1, 0, 16, 10); b.cyl(.04, .04, .4, 6, 0xd9b84a, 0, o.top + 1.0, -.2); return b.done(); };
  // habitations (non visitables) : 4 styles
  const HAB = [{ wall: 0xdfe6ee, base: 0xc9d1dc, trim: 0xffffff, roof: 'mansarde', roofCol: 0x55607a, shutters: null, balcony: 1, flowers: 1, door: 0x3d4f7a },
    { wall: 0xffe9a8, base: 0xf3d58a, trim: 0xffffff, roof: 'pignon', roofCol: 0xc0503c, shutters: 0x4f9a46, flowers: 1, door: 0x4f9a46, chimney: 1 },
    { wall: 0xffd9e3, base: 0xffffff, trim: 0xf7f5ee, roof: 'mansarde', roofCol: 0x8d6fd1, shutters: 0xff8fc0, flowers: 1, balcony: 2, door: 0xb06ab3 },
    { wall: 0xb5553d, base: 0x8e3f2c, trim: 0xf3eee3, roof: 'plat', shutters: null, flowers: 1, door: 0x2a2d33, baseJit: .12, balustre: 1 }];
  MD.immeuble = v => { const s = HAB[v % 4], b = G.mb(210 + v); if (v % 4 === 3) b.jit(.08); const o = G.facade(b, Object.assign({ w: 3, floors: 3 }, s)); b.jit(0);
    door(b, 0, o.fz, s.door, .62); for (const x of [-.95, .95]) { b.box(.44, .56, .06, WIN, x, 1.1, o.fz + .03, 0, 0, 0, 1); b.box(.54, .66, .05, s.trim, x, 1.1, o.fz + .02); b.box(.6, .07, .14, s.trim, x, .78, o.fz + .06); }
    b.box(.5, .16, .05, 0xd9b84a, 0, 1.68, o.fz + .06); pot(b, -.6, o.fz + .5, 0xff8fc0); pot(b, .6, o.fz + .5, 0xffd23f); return b.done(); };
  // chevalet vide (galerie)
  MD.chevalet_vide = v => { const b = G.mb(211); for (const s of [-1, 1]) b.box(.05, 1.75, .05, 0x6b4426, s * .32, .85, -.08, -.12, 0, s * .1); b.box(.05, 1.7, .05, 0x6b4426, 0, .82, -.32, .3, 0, 0); b.box(.8, .05, .12, 0x6b4426, 0, .72, 0); b.box(.86, 1.06, .06, 0xd9b84a, 0, 1.27, 0); b.box(.76, .96, .065, 0xe8e2d4, 0, 1.27, .005); return b.done(); };
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0, fixed: 1 }, p);
  obj('galerie', 'Galerie d\'art', 'galerie', { h: 4.8, fp: [4, 3], enter: 'galerie' }); obj('melimelo', 'Méli-Mélo', 'melimelo', { h: 4.8, fp: [4, 3], enter: 'melimelo' });
  obj('immeuble', 'Immeuble', 'immeuble', { h: 6.2, fp: [3, 3] }); obj('cadre_vide', 'Emplacement vide', 'chevalet_vide', { h: 1.5 });
  for (const id of ['boutique', 'couturiere', 'cafe', 'salon', 'chausseur', 'agence', 'club']) if (O[id]) { O[id].h = Math.max(O[id].h, 4.6); O[id].fixed = 1; }
  // ---------- intérieurs : galerie et brocante ----------
  Object.assign(G.ROOMKINDS, { galerie: { W: 12, H: 8, floor: 'marbre', wall: 'creme', trim: 0xd9b84a }, melimelo: { W: 10, H: 8, floor: 'parquet', wall: 'damier', trim: 0x6b4426 } });
  const SLOTS = [[1, 1], [4, 1], [7, 1], [10, 1], [1, 4], [4, 4], [7, 4], [10, 4]];
  G.ROOMFILL.galerie = (m, P) => { P('plante', 0, 6); P('plante', 11, 6); P('banc_parc', 5, 6); P('lampe', 0, 0); P('lampe', 11, 0); P('lanterne', 3, 6); P('lanterne', 8, 6); fillGallery(m); };
  function fillGallery(m) { for (const o of [...m.list]) if (o.t === 'cadre_vide' || o.t.startsWith('tableau_art_')) m.removeObj(o); const art = (G.dex && G.dex.art) || {};
    SLOTS.forEach(([x, z], k) => { const id = art[k] ? 'tableau_art_' + k : 'cadre_vide'; if (m.canPlace(id, x, z)) m.addObj(id, x, z); }); }
  G.ROOMFILL.melimelo = (m, P) => { P('comptoir', 4, 1); for (const [t, x, z] of [['canape', 0, 3], ['table', 3, 4], ['chaise', 4, 4, 3], ['lampe', 0, 0], ['etagere', 9, 0], ['tonneau', 9, 3], ['caisse', 9, 5], ['tv', 2, 0], ['horloge', 7, 0], ['aquarium', 6, 5], ['plante', 0, 6], ['tapis', 2, 5], ['lanterne', 8, 6]]) P(t, x, z); };
  Object.assign(G.ROOMNPC, { galerie: ['galerie', 6, 6.2], melimelo: ['melimelo', 5.5, .6] });
  Object.assign(G.NPCS, { galerie: { n: 'Céleste', sp: 'hibou', col: 0xf3b6d0, shirt: 0x8d6fd1, pitch: 1.2, eyes: 'doux' }, melimelo: { n: 'Mélo', sp: 'alpaga', col: 0xf3e6c8, shirt: 0xe8a23a, apron: 0x6b4426, pitch: 1.1 } });
  // la galerie se met à jour à chaque visite
  const oenter = G.act.enterHouse; G.act.enterHouse = o => { const r = oenter(o); if (G.OBJ[o.t].enter === 'galerie') setTimeout(() => { const im = G.interiors[o.iid] || (G.net && G.net.visit && G.net.visit.interiors[o.iid]); if (im) fillGallery(im); }, 450); return r; };
  // ---------- personnages ----------
  const say = (v, l, c) => G.npcSay(v, l, c), ART = ['La Joconde', 'Nuit étoilée', 'Nymphéas', 'Le Cri', 'Tournesols', 'La Grande Vague', 'Jeune fille à la perle', 'Coucher de soleil'];
  G.npcRoles.galerie = v => { const art = (G.dex.art = G.dex.art || {}), n = Object.keys(art).length;
    return say(v, ['Hou hou ! Bienvenue à la galerie, ' + G.playerName + '. Je suis Céleste, la sœur du Professeur Plume.', 'Nous exposons ' + n + ' chef' + (n > 1 ? 's' : '') + '-d\'œuvre sur 8. Rounard en vend parfois sur la place…'], ['Faire don d\'un tableau', 'Au revoir']).then(k => {
      if (k !== 0) return; const have = ART.map((_, i) => i).filter(i => !art[i] && G.inv.count('tableau_art_' + i) > 0);
      if (!have.length) return say(v, ['Tu n\'as pas de tableau que nous n\'exposons pas déjà…', 'Va voir Rounard sur la grande place : il en vend tous les jours !']);
      return say(v, ['Quel tableau veux-tu nous confier ?'], have.map(i => ART[i]).concat(['Rien finalement'])).then(c => { const i = have[c]; if (i == null) return;
        if (G.mode === 'survie') G.inv.remove('tableau_art_' + i, 1); art[i] = true; G.ui.dirtyHot(); G.sfx('fanfare'); fillGallery(G.map);
        return say(v, ['Magnifique ! « ' + ART[i] + ' » rejoint la galerie. Merci infiniment !', Object.keys(art).length === 8 ? 'La collection est COMPLÈTE ! Tu es un mécène de légende !' : 'Encore ' + (8 - Object.keys(art).length) + ' tableau' + (8 - Object.keys(art).length > 1 ? 'x' : '') + ' à trouver !']); }); }); };
  const daily = () => { const r = G.rng(G.clock.day * 977 + 3), pool = Object.values(G.ITEMS).filter(i => i.kind === 'place' && i.cat === 'mobilier' && !i.id.startsWith('tableau_art')), out = []; while (out.length < 10 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id); return out; };
  G.npcRoles.melimelo = v => say(v, ['Bienvenue chez Méli-Mélo ! Ici, les meubles ont une deuxième vie, mêêê !'], ['Voir la brocante du jour', 'Vendre mes affaires', 'Au revoir']).then(k => {
    if (k === 0) return G.ui.openShop(v, { list: daily(), title: 'Méli-Mélo — brocante du jour', quote: '« Tout change chaque jour ! Reviens demain, mêêê ! »', noSell: true });
    if (k === 1) return G.ui.openShop(v, { list: [], title: 'Méli-Mélo — on rachète tout', quote: '« On rachète tes meubles et tes trouvailles ! »' }); });
  // ---------- la nouvelle rue : des blocs d'immeubles collés, avec des passages entre eux ----------
  const ROW = [['musee', 4, 'rue_musee', 'Musée'], ['galerie', 4, 'rue_galerie', 'Galerie d\'art'], null, ['immeuble', 3, null, null, 0], ['cafe', 3, 'rue_cafe', 'Café Le Perchoir'], ['boutique', 4, 'rue_boutique', 'Bazar Gaston'], null,
    ['couturiere', 3, 'rue_couture', 'Sœurs Laine'], ['salon', 3, 'rue_salon', 'Salon Frisette'], ['chausseur', 3, 'rue_chausseur', 'Chausseur Lacet'], ['immeuble', 3, null, null, 1], null,
    ['melimelo', 4, 'rue_meli', 'Méli-Mélo'], ['immeuble', 3, null, null, 2], ['jardinerie', 4, 'rue_jardin', 'Jardinerie'], null, ['agence', 3, 'rue_agence', 'Agence Nid Douillet'], ['club', 3, 'rue_club', 'Club Rire'], ['immeuble', 3, null, null, 3]];
  G.genRue = () => {
    let width = 0; for (const e of ROW) width += e ? e[1] : 2; const W = width + 12, H = 24, EX = Math.floor(W / 2) - 1, m = new G.GMap(W, H, { kind: 'rue', id: 'rue' }), I = (x, z) => z * W + x, r = G.rng(4242);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = I(x, z); if (x < 3 || x >= W - 3 || z < 4 || z >= H - 3) { m.lvl[i] = 3; m.surf[i] = 1; } else m.surf[i] = G.hash2(x, z, 7) < .1 ? 14 : 0; }
    for (let z = H - 3; z < H - 1; z++) for (const x of [EX, EX + 1]) { m.lvl[I(x, z)] = 0; m.surf[I(x, z)] = 3; }
    for (let x = 3; x < W - 3; x++) { for (const z of [8, 9, 13, 14]) m.surf[I(x, z)] = 11; for (const z of [10, 11, 12]) m.surf[I(x, z)] = 4; }
    for (let z = 15; z < H - 3; z++) for (const x of [EX, EX + 1]) m.surf[I(x, z)] = 3;
    const put = (t, x, z, rot = 0, ex) => m.canPlace(t, x, z, rot) ? m.addObj(t, x, z, rot, ex) : null, labels = [], alleys = [];
    let x = 6; for (const e of ROW) { if (!e) { alleys.push(x); x += 2; continue; } const [t, w, iid, name, v] = e, ex = {}; if (iid) ex.iid = iid; if (v != null) ex.v = v; const o = put(t, x, 5, 0, ex); if (o && name) labels.push([name, m.center(o)[0]]); x += w; }
    m.addObj('tunnel2', EX, H - 1, 2, { v: 23 });
    for (const a of alleys) { put('lampadaire', a, 9); put('banc_parc', a, 8) || put('pot_fleurs', a + 1, 8); }
    for (let lx = 5; lx < W - 4; lx += 7) if (Math.abs(lx - EX - .5) > 2.5) put('lampadaire', lx, 13);
    put('horloge', EX - 2, 13); put('parasol', 3 + 2, 9);
    for (let bx = 7; bx < W - 6; bx += 12) if (Math.abs(bx - EX) > 4) put('banc_parc', bx, 14, 2);
    for (const [dx, dz] of [[-1, 15], [2, 15], [-1, 19], [2, 19]]) put('lanterne_pierre', EX + dx, dz);
    for (const fx of [EX - 10, EX + 9]) put('fontaine', fx, 16); for (const sx of [EX - 18, EX + 17]) put('statue', sx, 17);
    for (let tx = 4; tx < W - 4; tx += 4) if (Math.abs(tx - EX) > 3) put(G.pick(['cerisier', 'chene', 'bouleau', 'cerisier'], r), tx, 18 + (tx % 3 === 0 ? 1 : 0));
    const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
    for (let cx = 6; cx < W - 6; cx += 6) if (Math.abs(cx - EX) > 4) for (let k = 0; k < 6; k++) put((k % 2 ? 'tulipe_' : 'fleur_') + FL[(cx + k) % 7], cx + (k % 3), 16 + Math.floor(k / 3));
    for (let xx = 2; xx < W - 2; xx++) for (const zz of [2, 3]) if (r() < .4) put(r() < .6 ? 'sapin' : 'chene', xx, zz);
    for (let zz = 4; zz < H - 2; zz++) for (const xx of [2, W - 3]) if (r() < .35) put(r() < .6 ? 'sapin' : 'chene', xx, zz);
    for (let xx = 2; xx < W - 2; xx++) if (Math.abs(xx - EX - .5) > 3 && r() < .35) put(r() < .5 ? 'sapin' : 'chene', xx, H - 2);
    m.meta = { rue: true, spawn: { x: EX + 1, z: H - 3.2 }, exitZ: H - 2.35, exitX: EX + 1, seaZ: H + 1000, plaza: { x: EX + 1, z: 11 }, homes: [{ vi: 0, x: EX - 8, z: 10 }, { vi: 2, x: EX + 9, z: 10 }, { vi: 1, x: EX - 20, z: 10 }], title: 'Rue commerçante' };
    for (const [n, lx] of labels) G.mapLabel(m, n, lx, 2.45, 8.12, .9);
    G.mapLabel(m, '⛲ ' + G.villageName + ' · Rue commerçante', EX + 1, 5.35, H - 1.55, 1.25);
    return m;
  };
})();
