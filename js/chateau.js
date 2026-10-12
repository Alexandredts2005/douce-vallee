'use strict';
// ===== Grands châteaux à la française (9 × 7 cases) : classique (façon Vaux-le-Vicomte), Renaissance de la Loire, Louis XIII brique et pierre.
// La maison du joueur peut devenir l'un d'eux à l'agence ; ils sont aussi au catalogue en mode Créatif. =====
(function () {
  const MD = G.MODELS, A = G.ARCH, PT = A.PT, TAU = Math.PI * 2;
  const { wb, fenetre, porte, quoins, GLASS, GOLD, IRONC } = A;
  // tronc de pyramide (toits à la Mansart, toits en pavillon, toits à croupe) : base w0×d0, sommet w1×d1, hauteur h
  function frustum(b, w0, d0, w1, d1, h, col, x, y, z, pat = 0) {
    const a = w0 / 2, c = d0 / 2, e = w1 / 2, f = d1 / 2, p = [];
    const q = (A1, B1, C1, D1) => { p.push(...A1, ...B1, ...C1, ...A1, ...C1, ...D1); };
    q([-a, 0, c], [a, 0, c], [e, h, f], [-e, h, f]); q([a, 0, -c], [-a, 0, -c], [-e, h, -f], [e, h, -f]);
    q([a, 0, c], [a, 0, -c], [e, h, -f], [e, h, f]); q([-a, 0, -c], [-a, 0, c], [-e, h, f], [-e, h, -f]);
    if (e > 0 && f > 0) q([-e, h, f], [e, h, f], [e, h, -f], [-e, h, -f]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    b.P(pat); b.geo(g, col, b.M(x, y, z)); b.P(0);
  }
  const blk = (xc, zc, w, d, fh, wh) => ({ xc, zc, w, d, fh, wh });
  function walls(b, H, col, pat) { b.P(pat); b.box(H.w, H.wh, H.d, col, H.xc, H.fh + H.wh / 2, H.zc); b.P(0); }
  function cornice(b, H, y, col, over = .12, h = .16) { b.P(PT.pierre); b.box(H.w + over * 2, h, H.d + over * 2, col, H.xc, y, H.zc); b.P(0); }
  function balustrade(b, x0, x1, z, y, col) { const n = Math.max(2, Math.round((x1 - x0) / .16)); b.box(x1 - x0, .06, .16, col, (x0 + x1) / 2, y + .02, z); b.box(x1 - x0 + .04, .07, .2, col, (x0 + x1) / 2, y + .38, z); for (let k = 0; k <= n; k++) b.cyl(.035, .045, .3, 6, col, x0 + k * (x1 - x0) / n, y + .2, z); }
  function balconnet(b, x, y, z, w) { b.P(PT.pierre); b.box(w + .2, .06, .28, 0xe9e1cf, x, y, z + .14); b.P(0); b.box(w + .2, .03, .03, IRONC, x, y + .34, z + .27); for (let k = 0; k <= 6; k++) b.box(.02, .32, .02, IRONC, x - (w + .2) / 2 + k * (w + .2) / 6, y + .18, z + .27); }
  function epi(b, x, y, z, s = 1) { b.cyl(.025 * s, .04 * s, .3 * s, 6, GOLD, x, y + .15 * s, z); b.sph(.07 * s, GOLD, x, y + .34 * s, z, 1, 1, 1, 0, 8, 6); b.cone(.04 * s, .18 * s, 6, GOLD, x, y + .5 * s, z); }
  function topiaire(b, x, z) { b.cyl(.2, .16, .3, 8, 0xd9d2c2, x, .15, z); b.cone(.24, .9, 10, 0x2f6b3a, x, .75, z); b.sph(.1, 0x2f6b3a, x, 1.25, z); }
  function statue(b, x, z, col = 0xece6d8) { b.P(PT.pierre); b.box(.36, .5, .36, 0xd9d2c2, x, .25, z); b.P(0); b.cyl(.09, .14, .5, 8, col, x, .75, z); b.sph(.09, col, x, 1.08, z); b.box(.36, .06, .06, col, x, .9, z, 0, 0, .5); }
  function perron(b, x, z0, w, steps, col) { b.P(PT.pierre); for (let k = 0; k < steps; k++) b.box(w + (steps - k) * .3, .15, .32, col, x, .075 + k * .15, z0 + (steps - k) * .3 - .1); b.P(0); }
  function cheminee(b, x, z, y0, y1, col, cap) { b.P(PT.pierre); b.box(.36, y1 - y0, .7, col, x, (y0 + y1) / 2, z); b.box(.44, .1, .78, cap, x, y1 + .05, z); b.P(0); for (const dz of [-.18, .18]) b.cyl(.05, .06, .16, 6, 0xc0603c, x, y1 + .18, z + dz); }
  // ---------- 1. château classique (pierre blonde, toits à la Mansart, dôme central) ----------
  function classique(b) {
    const ST = 0xf0e4c8, ST2 = 0xe6d8b8, SL = 0x4a5464, WIN = { glass: 0x9fb9d4, frame: 0xf7f2e6, sill: ST2, lintel: ST2, lintelPat: PT.pierre, curt: 0xfff1d6 };
    b.P(PT.pierre); b.box(8.8, .45, 4.6, 0xd9cfba, 0, .225, -.35); b.P(0);
    const C = blk(0, -.5, 5.4, 3.0, .45, 3.6), AV = blk(0, -.3, 2.5, 3.4, .45, 4.0), PL = blk(-3.45, -.4, 1.5, 3.6, .45, 3.8), PR = blk(3.45, -.4, 1.5, 3.6, .45, 3.8);
    for (const H of [C, AV, PL, PR]) walls(b, H, ST, PT.pierre);
    // bandeaux, pilastres, corniches
    for (const H of [C, PL, PR]) { cornice(b, H, H.fh + 1.95, ST2, .04, .1); cornice(b, H, H.fh + H.wh + .06, ST2); }
    cornice(b, AV, AV.fh + 1.95, ST2, .04, .1); cornice(b, AV, AV.fh + AV.wh + .06, ST2);
    for (const a of [-1.15, -.42, .42, 1.15]) wb(b, AV, 0, a, AV.fh + AV.wh / 2, 0, .16, AV.wh, .06, 0xf7efdc);
    for (const H of [PL, PR]) for (const a of [-.62, .62]) wb(b, H, 0, a, H.fh + H.wh / 2, 0, .14, H.wh, .05, 0xf7efdc);
    // fenêtres : rez-de-chaussée en plein cintre, étage rectangulaire avec balconnets
    const y1 = .45 + .95, y2 = .45 + 2.75;
    for (const s of [-1, 1]) { for (const a of [1.62, 2.27]) { fenetre(b, C, 0, s * a, y1, Object.assign({ w: .44, h: 1.15, arch: 1, pane: 'petits' }, WIN)); fenetre(b, C, 0, s * a, y2, Object.assign({ w: .44, h: 1.0, pane: 'petits' }, WIN)); }
      fenetre(b, s < 0 ? PL : PR, 0, 0, y1, Object.assign({ w: .5, h: 1.15, arch: 1, pane: 'petits' }, WIN)); fenetre(b, s < 0 ? PL : PR, 0, 0, y2, Object.assign({ w: .5, h: 1.0, pane: 'petits' }, WIN)); balconnet(b, s * 3.45, y2 - .62, 1.4, .5);
      fenetre(b, AV, 0, s * .8, y1, Object.assign({ w: .44, h: 1.15, arch: 1, pane: 'petits' }, WIN)); }
    for (const a of [-.8, 0, .8]) fenetre(b, AV, 0, a, y2, Object.assign({ w: .44, h: 1.0, pane: 'petits' }, WIN)); balconnet(b, 0, y2 - .62, 1.4, 2.0);
    for (const f of [2, 3]) for (const H of [f === 2 ? PR : PL]) { fenetre(b, H, f, -.8, y1, Object.assign({ w: .44, h: 1.1, pane: 'petits' }, WIN)); fenetre(b, H, f, .8, y1, Object.assign({ w: .44, h: 1.1, pane: 'petits' }, WIN)); fenetre(b, H, f, -.8, y2, Object.assign({ w: .44, h: .95, pane: 'petits' }, WIN)); fenetre(b, H, f, .8, y2, Object.assign({ w: .44, h: .95, pane: 'petits' }, WIN)); }
    porte(b, AV, 0, 0, { w: .8, h: 1.55, col: 0x2f4f7a, style: 'vitre', frame: 0xf7f2e6, arch: 1, steps: 0, lamp: 2 });
    // fronton triangulaire avec horloge
    const yA = AV.fh + AV.wh + .14; b.P(PT.pierre); G.prism(b, 2.7, .75, .35, ST2, 0, yA, 1.25); b.P(0); b.cyl(.22, .22, .05, 16, 0xffffff, 0, yA + .3, 1.44, Math.PI / 2, 0, 0); b.add(new THREE.TorusGeometry(.23, .035, 5, 18), GOLD, b.M(0, yA + .3, 1.46), 0, true); b.box(.02, .16, .02, 0x222222, 0, yA + .35, 1.47); b.box(.12, .02, .02, 0x222222, .05, yA + .3, 1.47);
    // toits : Mansart sur le corps, dôme sur l'avant-corps, pavillons pointus
    const yC = C.fh + C.wh + .14; frustum(b, 5.4, 3.0, 4.6, 2.2, 1.0, SL, 0, yC, -.5, PT.ardoise); frustum(b, 4.6, 2.2, 3.4, .5, .6, SL, 0, yC + 1.0, -.5, PT.ardoise);
    for (const s of [-1, 1]) for (const x of [1.95]) { const z = .9; b.P(PT.pierre); b.box(.5, .62, .45, ST, s * x, yC + .45, z); b.P(0); b.cyl(.13, .13, .05, 12, GLASS, s * x, yC + .5, z + .24, Math.PI / 2, 0, 0, 1); b.add(new THREE.TorusGeometry(.15, .035, 5, 14), ST2, b.M(s * x, yC + .5, z + .25), 0, true); G.prism(b, .62, .25, .5, SL, s * x, yC + .76, z); }
    balustrade(b, -2.6, -1.3, 1.1, yC, ST2); balustrade(b, 1.3, 2.6, 1.1, yC, ST2);
    const yD = AV.fh + AV.wh + .14; b.P(PT.pierre); b.box(2.4, .55, 3.3, ST, 0, yD + .27, -.35); b.P(0); frustum(b, 2.7, 3.6, 2.1, 2.6, .55, SL, 0, yD + .55, -.3, PT.ardoise); b.P(PT.ardoise); b.sph(1.15, SL, 0, yD + 1.1, -.3, 1, .95, 1.1, 0, 16, 10); b.P(0);
    b.cyl(.28, .3, .55, 8, ST, 0, yD + 2.35, -.3); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.07, .4, .07, ST2, Math.cos(a) * .3, yD + 2.37, -.3 + Math.sin(a) * .3); } b.cone(.34, .45, 8, SL, 0, yD + 2.85, -.3); epi(b, 0, yD + 3.05, -.3, 1.2);
    for (const s of [-1, 1]) { const yP = PL.fh + PL.wh + .14; frustum(b, 1.7, 3.8, .3, 1.6, 1.9, SL, s * 3.45, yP, -.4, PT.ardoise); epi(b, s * 3.45, yP + 1.9, -.4); for (const z of [-1.2, .4]) b.box(.06, .06, .06, GOLD, s * 3.45, yP + 1.92, z); }
    for (const [x, z] of [[-1.6, -1.4], [1.6, -1.4], [-3.45, -1.6], [3.45, -1.6]]) cheminee(b, x, z, yC, yC + 2.1, ST2, ST);
    // perron, statues, ifs taillés
    perron(b, 0, 1.4, 1.8, 3, 0xe9e1cf); for (const s of [-1, 1]) { statue(b, s * 1.8, 2.3); topiaire(b, s * 2.6, 2.6); topiaire(b, s * 4.0, 2.6); b.jit(.06); b.blob(.3, 1, 0x4a8a4f, s * 3.3, .3, 2.05, 2.2, .7, .9); b.jit(0); for (let k = 0; k < 6; k++) b.sph(.06, [0xffffff, 0xe8434a, 0xffd23f][k % 3], s * (2.75 + k * .22), .55, 2.25, 1, 1, 1, 0, 6, 4); }
  }
  // ---------- 2. château de la Loire (tuffeau blanc, tours rondes à toits pointus, lucarnes ouvragées) ----------
  function loire(b) {
    const TU = 0xf4eedd, TU2 = 0xe5dcc5, SL = 0x3d4450, WIN = { glass: 0x9fb9d4, frame: 0xf7f2e6, sill: TU2, lintel: TU2, lintelPat: PT.pierre, curt: 0xf9edd6 };
    b.P(PT.pierre); b.box(8.6, .35, 4.6, 0xcfc6b2, 0, .175, -.6); b.P(0);
    const C = blk(0, -.6, 5.6, 3.0, .35, 3.5), AV = blk(0, -.4, 1.6, 3.0, .35, 3.9); walls(b, C, TU, PT.pierre); walls(b, AV, TU, PT.pierre);
    cornice(b, C, C.fh + 1.8, TU2, .04, .1); cornice(b, C, C.fh + C.wh + .06, TU2); cornice(b, AV, AV.fh + 1.8, TU2, .04, .1);
    const y1 = .35 + .9, y2 = .35 + 2.65;
    for (const s of [-1, 1]) for (const a of [1.45]) { fenetre(b, C, 0, s * a, y1, Object.assign({ w: .55, h: 1.05 }, WIN)); fenetre(b, C, 0, s * a, y2, Object.assign({ w: .55, h: .95 }, WIN)); }
    for (const f of [2, 3]) { fenetre(b, C, f, 0, y1, Object.assign({ w: .5, h: 1.0 }, WIN)); fenetre(b, C, f, 0, y2, Object.assign({ w: .5, h: .9 }, WIN)); }
    porte(b, AV, 0, 0, { w: .78, h: 1.5, col: 0x6b4426, style: 'planches', frame: TU2, arch: 1, steps: 2, lamp: 2 }); fenetre(b, AV, 0, 0, y2, Object.assign({ w: .55, h: 1.0 }, WIN));
    // toit très pentu à croupes, pignon de l'avant-corps et lucarnes à pinacles
    const yC = C.fh + C.wh + .14; frustum(b, 5.9, 3.3, 4.4, .2, 2.4, SL, 0, yC, -.6, PT.ardoise); b.box(4.5, .06, .1, GOLD, 0, yC + 2.42, -.6);
    const yA = AV.fh + AV.wh; b.P(PT.pierre); G.prism(b, 1.75, 1.3, 3.0, TU, 0, yA, -.4); b.P(0); b.P(PT.ardoise); G.prism(b, 2.0, 1.45, 3.2, SL, 0, yA + .02, -.4); b.P(0); fenetre(b, blk(0, -.4, 1.6, 3.0, 0, 0), 0, 0, yA + .45, Object.assign({ w: .38, h: .5, arch: 1 }, WIN)); epi(b, 0, yA + 1.45, 1.1);
    for (const x of [-1.6, 1.6]) { const z = .55, y = yC + .3; b.P(PT.pierre); b.box(.75, 1.05, .5, TU, x, y + .52, z); b.P(0); fenetre(b, blk(x, z, .75, .5, 0, 0), 0, 0, y + .5, Object.assign({ w: .4, h: .6 }, WIN)); b.P(PT.pierre); G.prism(b, .85, .55, .5, TU2, x, y + 1.05, z); b.P(0); for (const s of [-1, 1]) { b.box(.1, .3, .1, TU2, x + s * .38, y + 1.2, z + .2); b.cone(.07, .3, 6, TU2, x + s * .38, y + 1.5, z + .2); } b.cone(.08, .35, 6, TU2, x, y + 1.75, z); }
    for (const x of [-1.9, 0, 1.9]) cheminee(b, x, -1.6, yC + .4, yC + 3.0, TU2, TU);
    // quatre tours rondes, mâchicoulis et toits en poivrière
    for (const [x, z] of [[-3.05, .5], [3.05, .5], [-3.05, -1.9], [3.05, -1.9]]) { const r = .85, hT = 4.4;
      b.P(PT.pierre); b.cyl(r, r + .05, hT, 16, TU, x, .35 + hT / 2, z); b.cyl(r + .12, r + .02, .3, 16, TU2, x, .35 + hT + .1, z); b.P(0);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(.1, .18, .1, TU2, x + Math.cos(a) * (r + .06), .35 + hT - .12, z + Math.sin(a) * (r + .06)); }
      b.P(PT.ardoise); b.cone(r + .18, 2.6, 16, SL, x, .35 + hT + .25 + 1.3, z); b.P(0); epi(b, x, .35 + hT + 2.5, z, 1.1);
      if (z > 0) for (const y of [1.3, 2.9]) { const zf = z + r * .92; b.box(.34, .6, .06, TU2, x - Math.sign(x) * .2, .35 + y, zf); b.box(.26, .52, .05, GLASS, x - Math.sign(x) * .2, .35 + y, zf + .02, 0, 0, 0, 1); b.box(.26, .03, .06, TU2, x - Math.sign(x) * .2, .35 + y + .05, zf + .03); } }
    for (const s of [-1, 1]) { topiaire(b, s * 1.25, 2.3); topiaire(b, s * 2.3, 2.3); b.jit(.06); b.blob(.28, 1, 0x4a8a4f, s * 3.6, .3, 2.2, 1.6, .7, .9); b.jit(0); for (let k = 0; k < 5; k++) b.sph(.06, [0xff8fc0, 0xffffff, 0xb583e6][k % 3], s * (3.2 + k * .2), .55, 2.4, 1, 1, 1, 0, 6, 4); }
  }
  // ---------- 3. château Louis XIII (brique rose, chaînages de pierre, hauts toits d'ardoise) ----------
  function louis13(b) {
    const BR = 0xc0614a, ST = 0xeee6d4, SL = 0x3f4552, WIN = { glass: 0x9fb9d4, frame: 0xffffff, sill: ST, lintel: ST, lintelPat: PT.pierre, curt: 0xfff1d6, shut: null };
    b.P(PT.pierre); b.box(8.8, .35, 4.6, 0xd2c9b6, 0, .175, -.45); b.P(0);
    const C = blk(0, -.55, 5.0, 3.0, .35, 3.2), PL = blk(-3.35, -.35, 1.9, 3.6, .35, 3.6), PR = blk(3.35, -.35, 1.9, 3.6, .35, 3.6);
    for (const H of [C, PL, PR]) { walls(b, H, BR, PT.brique); quoins(b, H, [0, 2, 3], ST); cornice(b, H, H.fh + 1.75, ST, .03, .1); cornice(b, H, H.fh + H.wh + .06, ST); }
    const y1 = .35 + .9, y2 = .35 + 2.5;
    for (const a of [-1.75, -.95, .95, 1.75]) { fenetre(b, C, 0, a, y1, Object.assign({ w: .48, h: 1.05, pane: 'petits' }, WIN)); fenetre(b, C, 0, a, y2, Object.assign({ w: .48, h: .95, pane: 'petits' }, WIN)); }
    for (const H of [PL, PR]) { for (const a of [-.45, .45]) { fenetre(b, H, 0, a, y1, Object.assign({ w: .46, h: 1.05, pane: 'petits' }, WIN)); fenetre(b, H, 0, a, y2 + .2, Object.assign({ w: .46, h: .95, pane: 'petits' }, WIN)); } }
    for (const [H, f] of [[PR, 2], [PL, 3]]) for (const a of [-.8, .8]) { fenetre(b, H, f, a, y1, Object.assign({ w: .44, h: 1.0, pane: 'petits' }, WIN)); fenetre(b, H, f, a, y2 + .2, Object.assign({ w: .44, h: .9, pane: 'petits' }, WIN)); }
    porte(b, C, 0, 0, { w: .82, h: 1.5, col: 0x3f5f45, style: 'panneaux', frame: ST, imposte: 1, fronton: ST, steps: 2, lamp: 2 });
    // toits : hauts toits à croupes séparés, campanile sur le corps central, lucarnes de pierre
    const yC = C.fh + C.wh + .14; frustum(b, 5.3, 3.3, 3.9, .3, 2.0, SL, 0, yC, -.55, PT.ardoise); b.box(4.0, .05, .08, GOLD, 0, yC + 2.02, -.55);
    for (const x of [-1.3, 0, 1.3]) { const z = .55, y = yC + .25; b.P(PT.pierre); b.box(.6, .8, .45, ST, x, y + .4, z); b.P(0); fenetre(b, blk(x, z, .6, .45, 0, 0), 0, 0, y + .4, Object.assign({ w: .32, h: .45 }, WIN)); b.P(PT.pierre); b.add(new THREE.CylinderGeometry(.34, .34, .45, 12, 1, false, -Math.PI / 2, Math.PI), ST, b.M(x, y + .8, z, -Math.PI / 2, 0, 0)); b.P(0); }
    b.cyl(.36, .36, .7, 8, ST, 0, yC + 2.3, -.55); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.08, .5, .08, BR, Math.cos(a) * .36, yC + 2.3, -.55 + Math.sin(a) * .36); } b.P(PT.ardoise); b.sph(.42, SL, 0, yC + 2.75, -.55, 1, .9, 1, 0, 12, 8); b.P(0); epi(b, 0, yC + 3.1, -.55, 1.1);
    for (const s of [-1, 1]) { const yP = PL.fh + PL.wh + .14; frustum(b, 2.2, 3.9, .4, 1.8, 2.5, SL, s * 3.35, yP, -.35, PT.ardoise); epi(b, s * 3.35, yP + 2.5, .4); epi(b, s * 3.35, yP + 2.5, -1.1);
      b.P(PT.brique); b.box(.42, 2.6, .8, BR, s * 3.35, yP + 1.4, -1.9); b.P(0); b.P(PT.pierre); b.box(.5, .1, .88, ST, s * 3.35, yP + 2.75, -1.9); b.P(0); }
    for (const x of [-1.5, 1.5]) { b.P(PT.brique); b.box(.4, 2.6, .7, BR, x, yC + 1.2, -1.9); b.P(0); b.P(PT.pierre); b.box(.48, .1, .78, ST, x, yC + 2.55, -1.9); b.P(0); }
    for (const s of [-1, 1]) { topiaire(b, s * 1.6, 2.4); statue(b, s * 2.6, 2.5); b.jit(.06); b.blob(.3, 1, 0x4a8a4f, s * 3.6, .3, 2.3, 1.7, .7, .9); b.jit(0); for (let k = 0; k < 5; k++) b.sph(.06, [0xe8434a, 0xffffff, 0xffd23f][k % 3], s * (3.2 + k * .2), .55, 2.45, 1, 1, 1, 0, 6, 4); }
  }
  const STYLES = G.CHATEAUX = [{ n: 'Château classique à la française', f: classique }, { n: 'Château de la Loire', f: loire }, { n: 'Château Louis XIII', f: louis13 }];
  MD.chateau2 = v => { const b = G.mb(260 + v); STYLES[v % STYLES.length].f(b); return b.done(); };
  G.OBJ.chateau_grand = { id: 'chateau_grand', n: 'Grand château', model: 'chateau2', v: 0, h: 9, fp: [9, 7], enter: 'maison', take: 0 };
  STYLES.forEach((s, k) => { const id = 'chateau_cat' + k; G.OBJ[id] = { id, n: s.n, model: 'chateau2', v: k, h: 9, fp: [9, 7], enter: 'maison', take: 1, cat: 'construction' }; G.ITEMS[id] = { id, n: s.n, stack: 1, sell: 500, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id }; });
  // ---------- transformer la maison en grand château : il faut un terrain plat de 9 × 7 cases ----------
  const soft = d => !(d.enter || d.shop || d.fixed || d.portal || d.onWater || d.walk && d.h > .5);
  G.placeGrandChateau = (o, style) => {
    const m = G.world, d0 = G.OBJ[o.t], [w0, dd0] = G.fpDims(d0, o.r), F = G.FR[o.r], L = m.lvl[m.idx(o.x, o.z)];
    const [W, D] = G.fpDims(G.OBJ.chateau_grand, o.r), CD = G.OBJ.chateau_grand.fp[1], LX = F[1], LZ = -F[0]; // LX, LZ : direction le long de la façade
    const fx = o.x + w0 / 2 + F[0] * dd0 / 2, fz = o.z + dd0 / 2 + F[1] * dd0 / 2; // milieu de la façade de la maison
    const tries = []; for (const j of [0, 1, -1, 2]) for (const k of [0, 1, -1, 2, -2, 3, -3]) tries.push([k, j]);
    for (const [k, j] of tries) {
      const ccx = fx - F[0] * CD / 2 + LX * k + F[0] * j, ccz = fz - F[1] * CD / 2 + LZ * k + F[1] * j;
      const X0 = Math.round(ccx - W / 2), Z0 = Math.round(ccz - D / 2); let ok = true; const clear = new Set();
      for (let z = Z0; z < Z0 + D && ok; z++) for (let x = X0; x < X0 + W && ok; x++) { if (x < 3 || z < 3 || x >= m.W - 3 || z >= m.H - 3) { ok = false; break; } const i = m.idx(x, z); if (m.water[i] || m.ramp[i] || m.lvl[i] !== L) { ok = false; break; } const q = m.objAt(x, z); if (q && q !== o) { if (soft(G.OBJ[q.t]) || q.t === 'boite_lettres') clear.add(q); else ok = false; } }
      if (!ok) continue;
      let mail = false; for (const q of clear) { if (q.t === 'boite_lettres') mail = true; else if (G.OBJ[q.t].take && G.ITEMS[q.t] && G.storage) { const s = G.storage.findIndex(e => !e); if (s >= 0) G.storage[s] = { id: q.t, n: 1 }; } m.removeObj(q); }
      const ex = { iid: o.iid, v: style }; m.removeObj(o); const c = m.addObj('chateau_grand', X0, Z0, o.r, ex);
      const [ox, oz] = m.center(c), front = [ox + F[0] * (CD / 2 + 1.2), oz + F[1] * (CD / 2 + 1.2)];
      if (mail) { for (const [dx, dz] of [[3, 0], [-3, 0], [4, 0], [-4, 0], [3, 1], [-3, 1]]) { const mx = Math.floor(front[0] + (F[1] !== 0 ? dx : 0)), mz = Math.floor(front[1] + (F[0] !== 0 ? dx : 0) + dz * F[1]); if (m.canPlace('boite_lettres', mx, mz)) { m.addObj('boite_lettres', mx, mz); break; } } }
      if (m.meta.homesP && o.iid) m.meta.homesP[o.iid] = { x: front[0], z: front[1] };
      for (let k2 = 0; k2 < 4; k2++) G.fx.puff(ox + (Math.random() - .5) * W, 1.5, oz + (Math.random() - .5) * D, 26, 0xf3ead2, 1.4);
      return { obj: c, front };
    }
    return null;
  };
})();
