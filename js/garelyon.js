'use strict';
// ===== Gare de Lyon : trains façon Orient-Express (locomotive à vapeur, wagons-lits bleus, voitures Pullman),
// palmiers en vase d'Anduze, orangers et oliviers en caisse de Versailles, candélabres à globes, terrasse de brasserie,
// bancs de gare, malles de voyage, grand escalier du « Train Bleu » — et l'aménagement du grand hall =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const K = () => G.TREEKIT, rb = (...a) => G.rbox(...a);
  const GOLD = 0xd9b45a, BRASS = 0xc9a24a, IRON = 0x262c2f, BLK = 0x15171a, STEEL = 0x8d939a, RED = 0x9a1f24, WOOD = 0x6b3f22;
  // ---------- outils ----------
  const M4 = (x, y, z, q, s) => new THREE.Matrix4().compose(new V3(x, y, z), q || new THREE.Quaternion(), s || new V3(1, 1, 1));
  // tige effilée de a à c
  function seg(b, a, c, ra, rc, col, sides = 8, mat = 0) { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return;
    b.geo(new THREE.CylinderGeometry(rc, ra, L, sides, 1, true), col, M4((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2, new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())), mat, true); }
  // demi-cylindre couché le long de z (toits cintrés), aplati de « flat »
  const arc = (b, r, len, flat, col, x, y, z) => b.geo(new THREE.CylinderGeometry(r, r, len, 22, 1, false, -PI / 2, PI), col, new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeScale(1, flat, 1)).multiply(new THREE.Matrix4().makeRotationX(-PI / 2)), 0, true);
  const lathe = (b, pts, col, x, y, z, n = 24, mat = 0) => b.geo(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), n), col, b.M(x, y, z), mat, true);
  // géométrie à couleurs par sommet, ajoutée telle quelle (double face : la face arrière est un peu plus sombre)
  function tris(b, list) { const pos = [], nor = [], col = [], u = new V3(), w = new V3();
    for (const [A, B, C, ca, cb, cc] of list) { u.subVectors(B, A); w.subVectors(C, A); const n = u.clone().cross(w).normalize(); if (n.y < 0) n.negate();
      const add = (P, c, s, sg) => { pos.push(P.x, P.y, P.z); nor.push(n.x * sg, n.y * sg, n.z * sg); col.push(c.r * s, c.g * s, c.b * s); };
      add(A, ca, 1, 1); add(B, cb, 1, 1); add(C, cc, 1, 1); add(A, ca, .6, -1); add(C, cc, .6, -1); add(B, cb, .6, -1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); b.parts[0].push(g); }
  // palme (rachis arqué, folioles retombantes de chaque côté), depuis P0 vers l'angle a, élévation el, longueur L
  function palme(b, list, P0, a, el, L, o = {}) { const n = o.n || 18, d = new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), p = new V3(...P0), side = new V3(-Math.sin(a), 0, Math.cos(a));
    const C0 = new THREE.Color(o.c0 || 0x2c5a26), C1 = new THREE.Color(o.c1 || 0x6fae45), pts = [];
    for (let i = 0; i <= n; i++) { pts.push(p.clone()); d.y -= (o.bend || 1.3) / n; d.normalize(); p.addScaledVector(d, L / n); }
    for (let i = 1; i < n; i++) { const t = i / n, A = pts[i], dd = new V3().subVectors(pts[i + 1], A).normalize(), ll = (o.lf || .42) * Math.sin(PI * Math.min(1, t * 1.05 + .08)) * (.85 + .3 * ((i * 7) % 3) / 2), c = C0.clone().lerp(C1, t * .9);
      for (const sg of [-1, 1]) { const tip = A.clone().addScaledVector(side, sg * ll * .82).addScaledVector(dd, ll * .45).add(new V3(0, -ll * (o.droop || .55), 0)), wv = dd.clone().multiplyScalar(.035 + .02 * (1 - t));
        list.push([A.clone().sub(wv), A.clone().add(wv), tip, c, c, C1.clone().lerp(c, .3)]); } }
    for (let i = 0; i < n; i += 3) seg(b, [pts[i].x, pts[i].y, pts[i].z], [pts[i + 3 > n ? n : i + 3].x, pts[i + 3 > n ? n : i + 3].y, pts[i + 3 > n ? n : i + 3].z], .022 * (1 - i / n) + .008, .012, o.stem || 0x5a7a30, 5);
    return pts; }

  // ---------- 1. TRAINS FAÇON ORIENT-EXPRESS (22 cases de long, la locomotive vers le hall +z) ----------
  function roue(b, x, y, z, r, rim, hub, spokes = 12, cw = 0) { const s = Math.sign(x);
    b.tor(r * .92, r * .09, BLK, x, y, z, 0, PI / 2, 0, 0, 24); b.tor(r * .8, r * .06, rim, x + s * .01, y, z, 0, PI / 2, 0, 0, 22);
    b.cyl(r * .2, r * .24, .16, 10, rim, x + s * .02, y, z, 0, 0, PI / 2); b.cyl(r * .1, r * .1, .2, 8, hub, x + s * .03, y, z, 0, 0, PI / 2); for (let k = 0; k < spokes; k++) b.box(.045, r * 1.62, .04, rim, x + s * .015, y, z, k / spokes * PI, 0, 0);
    if (cw) { b.box(.05, r * .42, r * .85, rim, x + s * .02, y - r * .5, z); b.cyl(.045, .045, .12, 8, STEEL, x + s * .08, y + r * .45, z, 0, 0, PI / 2); } }
  function bogie(b, z, w = .62) { b.box(1.32, .16, 1.25, BLK, 0, .5, z); for (const s of [-1, 1]) { for (const dz of [-.38, .38]) { roue(b, s * w, .26, z + dz, .24, 0x3b3f44, STEEL, 8); b.box(.1, .14, .16, 0x2a2e33, s * (w + .1), .3, z + dz); }
      for (const dz of [-.2, .2]) b.cyl(.05, .05, .16, 8, 0x55595e, s * .55, .62, z + dz); b.box(.06, .1, 1.1, 0x2a2e33, s * (w + .08), .44, z); } }
  function loco(b, v) { const BOI = v ? 0x1b3a2c : 0x17191c, LINE = v ? GOLD : 0xb8322a;
    // châssis, tablier rouge, tampons, attelage
    b.box(1.5, .3, 6.6, BLK, 0, .8, 7.6); b.box(1.86, .06, 6.5, 0x202326, 0, 1.12, 7.6); for (const s of [-1, 1]) b.box(.03, .14, 6.5, LINE, s * .93, 1.06, 7.6);
    b.box(1.8, .36, .16, 0xb3221c, 0, .86, 10.98); for (const s of [-1, 1]) { b.cyl(.07, .09, .32, 10, STEEL, s * .58, .86, 11.2, PI / 2, 0, 0); b.cyl(.16, .16, .05, 16, 0x6b7076, s * .58, .86, 11.38, PI / 2, 0, 0); }
    b.box(.1, .12, .3, 0x3a3d42, 0, .86, 11.2); b.tor(.07, .02, 0x3a3d42, 0, .78, 11.35, PI / 2, 0, 0);
    // roues : bissel avant, trois essieux moteurs à contrepoids, bielles et cylindres
    for (const z of [9.95, 10.55]) for (const s of [-1, 1]) roue(b, s * .62, .3, z, .3, 0x9a1f24, STEEL, 10);
    for (const z of [5.45, 6.85, 8.25]) for (const s of [-1, 1]) roue(b, s * .66, .64, z, .62, 0x9a1f24, STEEL, 16, 1);
    for (const s of [-1, 1]) { b.box(.05, .1, 2.95, 0xa8adb3, s * .8, .86, 6.85); seg(b, [s * .84, .86, 6.85], [s * .84, .7, 9.0], .045, .045, 0xb8bdc3, 6);
      b.cyl(.27, .27, 1.05, 18, 0x23272b, s * .8, .9, 9.45, PI / 2, 0, 0); for (const z of [8.9, 10.0]) b.cyl(.29, .29, .06, 18, BRASS, s * .8, .9, z, PI / 2, 0, 0); b.box(.08, .08, .9, STEEL, s * .8, .76, 8.5);
      b.box(.04, .9, .9, BOI, s * .9, 2.0, 10.2); b.box(.02, .06, .9, LINE, s * .92, 2.42, 10.2); }
    // chaudière, cerclages de laiton, boîte à fumée, cheminée, dômes, sifflet
    b.cyl(.66, .66, 4.7, 26, BOI, 0, 1.8, 7.55, PI / 2, 0, 0, 0, true); for (const z of [5.5, 6.5, 7.5, 8.5, 9.4]) b.tor(.665, .022, BRASS, 0, 1.8, z, 0, 0, 0, 0, 26);
    b.cyl(.7, .7, .95, 26, 0x0e1012, 0, 1.8, 10.35, PI / 2, 0, 0, 0, true); b.cyl(.6, .6, .06, 26, 0x1c1f22, 0, 1.8, 10.84, PI / 2, 0, 0); b.tor(.6, .03, STEEL, 0, 1.8, 10.86, 0, 0, 0, 0, 26);
    b.cyl(.07, .07, .06, 12, STEEL, 0, 1.8, 10.9, PI / 2, 0, 0); b.box(.32, .035, .035, 0x4a4f55, 0, 1.8, 10.95); rb(b, .42, .16, .03, .02, BRASS, 0, 1.38, 10.9); b.box(.3, .08, .035, 0x2a2a2a, 0, 1.38, 10.92);
    b.cyl(.17, .21, .5, 16, 0x0e1012, 0, 2.68, 10.1); b.cyl(.23, .23, .07, 16, 0x0e1012, 0, 2.95, 10.1);
    for (const [z, r] of [[8.2, .3], [7.0, .24]]) { b.cyl(r, r * 1.08, .3, 16, BRASS, 0, 2.5, z); b.sph(r, BRASS, 0, 2.65, z, 1, .55, 1, 0, 16, 8); }
    b.cyl(.04, .05, .25, 8, BRASS, 0, 2.55, 5.8); b.cyl(.06, .04, .14, 8, BRASS, 0, 2.72, 5.8); for (const s of [-1, 1]) b.cyl(.05, .06, .2, 8, BRASS, s * .14, 2.52, 6.05);
    for (const s of [-1, 1]) seg(b, [s * .7, 2.0, 5.2], [s * .7, 2.0, 10.2], .018, .018, BRASS, 5);
    // fanaux
    for (const [x, y] of [[-.55, 1.22], [.55, 1.22], [0, 2.32]]) { b.cyl(.09, .08, .16, 10, 0x1e2124, x, y, 10.95, PI / 2, 0, 0); b.cyl(.065, .065, .04, 10, 0xfff3c8, x, y, 11.04, PI / 2, 0, 0, 1); }
    // cabine : vitres chaudes, toit cintré, main courante
    rb(b, 1.86, 1.55, 1.25, .05, BOI, 0, 1.92, 4.55); arc(b, 1.0, 1.45, .3, 0x101214, 0, 2.66, 4.5);
    for (const s of [-1, 1]) { b.box(.03, .5, .55, 0xffc477, s * .935, 2.2, 4.55, 0, 0, 0, 1); b.box(.035, .55, .04, BRASS, s * .94, 2.2, 4.55); b.box(.02, .06, 1.2, LINE, s * .94, 1.5, 4.55); }
    for (const s of [-1, 1]) { b.cyl(.17, .17, .03, 16, 0xffc477, s * .45, 2.25, 5.19, PI / 2, 0, 0, 1); b.tor(.17, .025, BRASS, s * .45, 2.25, 5.2, 0, 0, 0, 0, 16); }
    // tender : caisse, charbon, trois essieux
    rb(b, 1.82, 1.15, 3.05, .06, BOI, 0, 1.45, 2.45); for (const s of [-1, 1]) { b.box(.02, .05, 2.95, LINE, s * .92, 1.15, 2.45); b.box(.02, .05, 2.95, LINE, s * .92, 1.9, 2.45); rb(b, .42, .17, .03, .02, 0xa8862e, s * .925, 1.5, 2.45, 0, s * PI / 2, 0); }
    b.jit(.25); for (let k = 0; k < 16; k++) b.blob(.2 + (k % 3) * .05, 0, 0x1a1a1c, -.55 + (k % 4) * .37, 2.08 + (k % 2) * .06, 1.3 + Math.floor(k / 4) * .62, 1, .6, 1); b.jit(0);
    b.box(1.5, .25, 3.0, BLK, 0, .68, 2.45); for (const z of [1.45, 2.45, 3.45]) for (const s of [-1, 1]) roue(b, s * .62, .3, z, .3, 0x9a1f24, STEEL, 10);
    b.box(1.1, 1.3, .14, 0x2a2d31, 0, 1.4, .8); }
  // voiture : 0 = wagon-lits bleu nuit, 1 = Pullman teck et crème ; fenêtres transparentes : on voit les tables, les lampes, les rideaux
  function voiture(b, z0, z1, st) { const L = z1 - z0, zc = (z0 + z1) / 2, LOW = st ? 0x4f2a17 : 0x1a2747, UPC = st ? 0xe6d6b4 : 0x1a2747, WALLIN = st ? 0x7a4626 : 0x6e4024, SEAT = st ? 0x2f5a3e : 0x8a1f2c, CUR = st ? 0xc9a24a : 0x9a2430;
    b.box(1.36, .2, L - .5, BLK, 0, .66, zc); for (const s of [-1, 1]) seg(b, [s * .5, .58, z0 + .9], [s * .5, .36, zc], .02, .02, STEEL, 5), seg(b, [s * .5, .36, zc], [s * .5, .58, z1 - .9], .02, .02, STEEL, 5);
    rb(b, .7, .3, .9, .04, 0x2a2e33, -.2, .45, zc); bogie(b, z0 + 1.0); bogie(b, z1 - 1.0);
    b.box(1.62, .08, L - .02, 0x2a2e33, 0, .82, zc); b.box(1.5, .02, L - .4, 0x7a1e22, 0, .87, zc);
    const pitch = .74, ww = .5, n = Math.floor((L - 1.5) / pitch), zs = zc - (n - 1) * pitch / 2;
    for (const s of [-1, 1]) { const x = s * .8;
      b.box(.06, .8, L, LOW, x, 1.25, zc); b.box(.06, .34, L, UPC, x, 2.38, zc);
      // trumeaux entre les fenêtres, et les vestibules pleins aux deux bouts
      for (let i = 0; i <= n; i++) { const za = i === 0 ? z0 : zs + (i - .5) * pitch + ww / 2, zb = i === n ? z1 : zs + (i + .5) * pitch - ww / 2; b.box(.06, .58, zb - za, UPC, x, 1.94, (za + zb) / 2); }
      for (let i = 0; i < n; i++) { const z = zs + i * pitch;
        b.box(.02, .56, ww, 0xffe2b0, x * .99, 1.94, z, 0, 0, 0, 2); for (const dz of [-1, 1]) b.box(.035, .6, .035, GOLD, x * 1.01, 1.94, z + dz * ww / 2); b.box(.035, .035, ww + .04, GOLD, x * 1.01, 2.24, z); b.box(.04, .04, ww + .08, GOLD, x * 1.01, 1.64, z);
        for (const dz of [-1, 1]) b.box(.02, .5, .1, CUR, x * .93, 1.95, z + dz * .2); b.box(.02, .07, ww, CUR, x * .93, 2.19, z);
        // dedans : banquettes de velours, table nappée, lampe à abat-jour rose
        b.box(.5, .04, .34, 0xfaf6ee, s * .48, 1.42, z); b.box(.06, .5, .06, 0x3a2a1e, s * .48, 1.15, z); b.cyl(.025, .03, .16, 6, BRASS, s * .58, 1.52, z); b.cyl(.04, .07, .08, 8, 0xffb6a0, s * .58, 1.62, z, 0, 0, 0, 1);
        b.box(.4, .12, .4, SEAT, s * .45, 1.08, z - .34); b.box(.4, .45, .08, SEAT, s * .45, 1.32, z - .5); }
      for (const zz of [z0 + .4, z1 - .4]) { b.box(.07, 1.3, .5, LOW, x * 1.005, 1.55, zz); b.box(.02, .3, .22, 0xffe2b0, x * 1.02, 1.95, zz, 0, 0, 0, 1); b.cyl(.015, .015, .5, 6, BRASS, x * 1.04, 1.4, zz + .2);
        for (const dz of [-.3, .3]) seg(b, [x * 1.05, .95, zz + dz], [x * 1.05, 1.8, zz + dz], .015, .015, BRASS, 5); b.box(.3, .04, .45, 0x3a3d42, x * 1.0, .62, zz); }
      // filets d'or et blason
      for (const y of [.88, 1.64, 2.23, 2.54]) b.box(.02, .02, L - .2, GOLD, x * 1.012, y, zc);
      b.cyl(.15, .15, .02, 18, GOLD, x * 1.015, 1.25, zc, 0, 0, PI / 2); b.cyl(.11, .11, .025, 18, LOW, x * 1.02, 1.25, zc, 0, 0, PI / 2); b.cyl(.05, .05, .03, 10, GOLD, x * 1.025, 1.25, zc, 0, 0, PI / 2);
      b.box(.02, .7, .5, WALLIN, x * .95, 1.25, zc); }
    // doublure intérieure en bois, plafond lumineux
    b.box(.02, .36, L - 1.0, WALLIN, -.76, 1.12, zc); b.box(.02, .36, L - 1.0, WALLIN, .76, 1.12, zc); b.box(1.5, .02, L - 1.0, 0xffe7c0, 0, 2.52, zc, 0, 0, 0, 1);
    // toit à lanterneau, aérateurs, bouts de caisse et soufflets
    arc(b, .86, L - .04, .34, 0x2c3034, 0, 2.55, zc);
    for (let z = z0 + .7; z < z1 - .5; z += .8) b.cyl(.06, .07, .12, 8, 0x3a3e43, 0, 2.86, z);
    for (const z of [z0 + .03, z1 - .03]) { b.box(1.62, 1.75, .06, LOW, 0, 1.7, z); b.box(.95, 1.6, .2, 0x1d1f22, 0, 1.6, z + (z === z0 ? -.1 : .1)); for (let k = 0; k < 6; k++) b.box(1.0, .03, .22, 0x2c2f33, 0, .9 + k * .28, z + (z === z0 ? -.1 : .1)); } }
  MD.train_orient = v => { const b = G.mb(440 + v); loco(b, v); voiture(b, -4.95, .55, v); voiture(b, -10.95, -5.15, v); return b.done(); };

  // ---------- 2. PLANTES ----------
  // palmier kentia dans un vase d'Anduze vernissé
  MD.palmier_pot = v => { const b = G.mb(450 + v), list = [], r = G.rng(450 + v), vc = v ? 0x2f5f8a : 0x7a8f3a;
    lathe(b, [[0, 0], [.2, 0], [.22, .05], [.2, .1], [.27, .28], [.36, .55], [.4, .72], [.43, .78], [.4, .82], [.36, .8], [0, .78]], vc, 0, 0, 0, 28);
    b.tor(.39, .03, v ? 0xe9e1cf : 0xc98f3a, 0, .62, 0, PI / 2, 0, 0, 0, 28); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.sph(.05, v ? 0xe9e1cf : 0xc98f3a, Math.cos(a) * .37, .55, Math.sin(a) * .37, 1, 1.3, 1, 0, 8, 6); }
    b.cyl(.37, .37, .02, 24, 0x3a2716, 0, .77, 0); b.jit(.3); for (let k = 0; k < 6; k++) b.blob(.07, 0, 0x4f7a32, (r() - .5) * .5, .78, (r() - .5) * .5, 1, .4, 1); b.jit(0);
    for (const [x, z] of [[0, 0], [.08, .06], [-.07, .05]]) seg(b, [x, .76, z], [x * 2, 1.25, z * 2], .045, .03, 0x6f7a3a, 7);
    for (let k = 0; k < 15; k++) { const a = k / 15 * TAU + (r() - .5) * .4, up = k % 3 === 0, el = up ? 1.15 + r() * .2 : .55 + r() * .45;
      palme(b, list, [(r() - .5) * .1, 1.1 + r() * .2, (r() - .5) * .1], a, el, up ? 1.25 + r() * .3 : 1.5 + r() * .35, { n: 18, bend: up ? .9 : 1.5, lf: up ? .3 : .42, c0: 0x24501f, c1: 0x6fb04a }); }
    tris(b, list); return b.done(); };
  // oranger (v0) ou olivier (v1) taillé en boule, dans une caisse de Versailles
  MD.arbre_caisse = v => { const b = G.mb(460 + v), k = K(), CB = v ? 0x2f4a3a : 0xece6d6;
    rb(b, .8, .62, .8, .03, CB, 0, .43, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.box(.1, .78, .1, IRON, sx * .4, .45, sz * .4); b.sph(.065, GOLD, sx * .4, .9, sz * .4, 1, 1, 1, 0, 10, 8); b.box(.12, .08, .12, IRON, sx * .4, .06, sz * .4); }
    for (const f of [0, 1, 2, 3]) { const a = f * PI / 2, cx = Math.sin(a) * .41, cz = Math.cos(a) * .41; b.box(f % 2 ? .03 : .5, .4, f % 2 ? .5 : .03, v ? 0x284034 : 0xdcd5c2, cx, .45, cz); for (const y of [.18, .72]) b.box(f % 2 ? .03 : .78, .04, f % 2 ? .78 : .03, IRON, cx * 1.02, y, cz * 1.02); }
    b.cyl(.36, .36, .02, 18, 0x3a2716, 0, .74, 0);
    const bp = v ? k.bark.brun(0x8a8478, 2.2) : k.bark.brun(0x6e5236, 1.4); 
    const sub = G.mb(461 + v); k.trunk(sub, { h: 1.45, r0: v ? .1 : .075, r1: .05, seed: v ? 2.2 : 1.4, lean: v ? [.12, -.06] : [0, 0], flare: v ? .9 : .4, roots: v ? 3 : 4, paintFn: bp });
    const tg = sub.done(); tg.translate(0, .74, 0); b.parts[0].push(tg);
    const cl = v ? [[.1, 2.1, 0, .46, 1.2, .8, 1], [-.32, 1.95, .12, .34, 1, .8, 1], [.42, 1.98, -.1, .32, 1, .8, 1], [0, 2.36, -.18, .32, 1, .75, 1], [-.1, 1.85, -.3, .28]] : [[0, 2.15, 0, .55, 1, .95, 1], [.28, 2.05, .2, .32], [-.3, 2.1, .1, .33], [.05, 2.45, -.1, .34], [-.1, 1.95, -.3, .3]];
    const F = k.foliage(b, cl, { pal: v ? [0x34472f, 0x5f7556, 0x8fa27e] : [0x1d4a22, 0x3d7d32, 0x7db55a], c: [0, 2.1, 0], seed: 11 + v * 7, amp: v ? .3 : .16, tufts: v ? 40 : 26 });
    if (!v) for (let n = 0; n < 16; n++) { const [x, y, z] = F.spot(-.3); k.lo(b, new THREE.SphereGeometry(.075, 9, 7), 0xff8c1a, x, y, z); k.lo(b, new THREE.SphereGeometry(.02, 4, 3), 0x3f6a2a, x, y + .075, z); }
    else for (let n = 0; n < 10; n++) { const [x, y, z] = F.spot(-.5); k.lo(b, new THREE.SphereGeometry(.022, 6, 4), 0x2f2a3a, x, y - .03, z); }
    return b.done(); };
  // grande jardinière ronde (3 × 3) : vasque de pierre moulurée, palmiers, fougères, fleurs
  MD.jardiniere = v => { const b = G.mb(470), list = [], r = G.rng(470);
    lathe(b, [[0, 0], [1.25, 0], [1.3, .08], [1.22, .14], [1.3, .5], [1.42, .58], [1.44, .66], [1.36, .7], [0, .66]], 0xe2d8c4, 0, 0, 0, 40); b.tor(1.1, .05, 0xcfc3a9, 0, .25, 0, PI / 2, 0, 0, 0, 40);
    b.cyl(1.3, 1.3, .02, 36, 0x3a2716, 0, .66, 0);
    const FL = [0xe8434a, 0xffffff, 0xffc23d, 0xb583e6, 0xff8fc0]; for (let k = 0; k < 64; k++) { const a = k / 64 * TAU, rr = 1.1 + (k % 2) * .1; b.sph(.065, FL[k % 5], Math.cos(a) * rr, .74 + (k % 3) * .03, Math.sin(a) * rr, 1, .8, 1, 0, 8, 6); }
    b.jit(.2); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; b.blob(.14, 0, 0x3f7a32, Math.cos(a) * .95, .74, Math.sin(a) * .95, 1, .6, 1); } b.jit(0);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; palme(b, list, [Math.cos(a) * .7, .7, Math.sin(a) * .7], a, .35, .75, { n: 10, bend: 1.8, lf: .16, droop: .3, c0: 0x2f6a2a, c1: 0x7fc25a }); }
    for (const [x, z] of [[0, 0], [.18, .1]]) seg(b, [x, .66, z], [x * 1.4, 2.4, z * 1.4], .09, .07, 0x7a6644, 9);
    for (let y = .9; y < 2.4; y += .15) b.tor(.085, .02, 0x6a5838, 0, y, 0, PI / 2, 0, 0, 0, 10);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + (r() - .5) * .3, up = k % 3 === 0; palme(b, list, [0, 2.45, 0], a, up ? 1.0 : .45 + r() * .3, up ? 1.5 : 2.0 + r() * .3, { n: 20, bend: up ? 1.0 : 1.6, lf: up ? .38 : .5, c0: 0x24501f, c1: 0x74b44c }); }
    tris(b, list); return b.done(); };

  // ---------- 3. MOBILIER ----------
  // candélabre de fonte à cinq globes (s'allume la nuit)
  MD.candelabre = v => { const b = G.mb(480);
    b.cyl(.34, .4, .14, 8, IRON, 0, .07, 0, 0, PI / 8); b.cyl(.28, .32, .3, 8, IRON, 0, .29, 0, 0, PI / 8); b.tor(.29, .03, GOLD, 0, .45, 0, PI / 2, 0, 0, 0, 16);
    lathe(b, [[0, 0], [.17, 0], [.12, .25], [.1, .5], [.085, 1.6], [.11, 1.68], [.08, 1.75], [.075, 2.5], [.12, 2.56], [.1, 2.62], [0, 2.62]], IRON, 0, .44, 0, 16);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.02, 1.05, .02, 0x3a4246, Math.cos(a) * .088, 1.5, Math.sin(a) * .088); }
    b.tor(.09, .025, GOLD, 0, 2.15, 0, PI / 2, 0, 0, 0, 14); b.tor(.115, .02, GOLD, 0, 3.05, 0, PI / 2, 0, 0, 0, 14);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4, cx = Math.cos(a), cz = Math.sin(a); let px = 0, py = 2.95;
      for (let i = 1; i <= 6; i++) { const t = i / 6, nx = cx * .55 * t, ny = 2.95 + Math.sin(t * PI) * .28 - t * .05; seg(b, [px * cx || 0, py, (px ? px * cz : 0)], [nx, ny, cz * .55 * t], .03, .028, IRON, 6); px = .55 * t; py = ny; }
      seg(b, [cx * .12, 2.62, cz * .12], [cx * .42, 2.9, cz * .42], .018, .016, IRON, 5);
      b.cyl(.05, .07, .08, 10, GOLD, cx * .55, 2.96, cz * .55); b.sph(.15, 0xfff1c8, cx * .55, 3.14, cz * .55, 1, 1.05, 1, 1, 16, 12); }
    b.cyl(.06, .08, .1, 10, GOLD, 0, 3.12, 0); b.sph(.18, 0xfff1c8, 0, 3.33, 0, 1, 1.05, 1, 1, 16, 12); b.cone(.05, .14, 8, GOLD, 0, 3.58, 0);
    return b.done(); };
  // table de bistrot : plateau de marbre, pied de fonte, café et croissant
  MD.table_bistrot = v => { const b = G.mb(481);
    b.cyl(.36, .36, .045, 28, 0xf4f1ea, 0, .74, 0); b.tor(.36, .018, 0xb9b4a8, 0, .74, 0, PI / 2, 0, 0, 0, 28);
    lathe(b, [[0, 0], [.05, 0], [.035, .08], [.03, .55], [.06, .66], [.09, .7], [0, .72]], IRON, 0, .02, 0, 14);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; seg(b, [0, .1, 0], [Math.cos(a) * .28, .02, Math.sin(a) * .28], .025, .02, IRON, 6); b.sph(.03, IRON, Math.cos(a) * .28, .02, Math.sin(a) * .28, 1, 1, 1, 0, 6, 4); }
    b.cyl(.07, .07, .012, 16, 0xffffff, .12, .77, .05); lathe(b, [[0, 0], [.03, 0], [.045, .05], [.048, .06], [0, .06]], 0xffffff, .12, .776, .05, 14); b.cyl(.04, .04, .005, 12, 0x3a1e0e, .12, .832, .05);
    b.tor(.018, .006, 0xffffff, .17, .81, .05, 0, 0, 0, 0, 8);
    b.geo(new THREE.TorusGeometry(.055, .028, 8, 12, PI * 1.3), 0xd9953a, b.M(-.12, .785, -.06, PI / 2, 0, .3), 0, true);
    b.cyl(.025, .03, .12, 10, 0xe8f4ff, -.05, .82, .13, 0, 0, 0, 2); seg(b, [-.05, .82, .13], [-.04, .97, .12], .006, .006, 0x3f7a2a, 4); b.sph(.03, 0xd8243a, -.04, .99, .12, 1, 1, 1, 0, 8, 6);
    return b.done(); };
  // chaise de bistrot en bois courbé (dos tourné vers -z)
  MD.chaise_bistrot = v => { const b = G.mb(482), BW = 0x4a2814;
    b.cyl(.2, .2, .035, 20, 0xd9b77a, 0, .47, 0); b.tor(.2, .018, BW, 0, .47, 0, PI / 2, 0, 0, 0, 20);
    for (const [x, z] of [[-.15, .15], [.15, .15], [-.13, -.13], [.13, -.13]]) seg(b, [x * .9, .46, z * .9], [x * 1.25, 0, z * 1.25], .017, .015, BW, 6);
    b.tor(.15, .012, BW, 0, .22, 0, PI / 2, 0, 0, 0, 16);
    for (const s of [-1, 1]) seg(b, [s * .14, .46, -.12], [s * .13, 1.0, -.2], .016, .015, BW, 6);
    b.geo(new THREE.TorusGeometry(.13, .016, 6, 14, PI), BW, b.M(0, 1.0, -.2, -.12, 0, 0), 0, true); b.geo(new THREE.TorusGeometry(.09, .012, 6, 12, PI), BW, b.M(0, .82, -.18, -.12, 0, 0), 0, true);
    return b.done(); };
  // banc de gare : lattes de chêne, joues de fonte ornées
  MD.banc_gare = v => { const b = G.mb(483), OAKC = 0x8a5a32, FT = 0x1f3a2c;
    for (let k = 0; k < 5; k++) rb(b, 1.86, .045, .085, .015, OAKC, 0, .46, -.17 + k * .095);
    for (let k = 0; k < 4; k++) rb(b, 1.86, .085, .04, .015, OAKC, 0, .62 + k * .1, -.27 - k * .025, -.22, 0, 0);
    for (const x of [-.86, .86]) { b.box(.06, .06, .5, FT, x, .42, -.02); seg(b, [x, 0, .2], [x, .42, .14], .03, .028, FT, 6); seg(b, [x, 0, -.22], [x, .42, -.2], .03, .028, FT, 6);
      seg(b, [x, .42, -.22], [x, .98, -.36], .028, .025, FT, 6); b.tor(.09, .022, FT, x, .62, .16, 0, PI / 2, 0, 0, 12); b.box(.06, .05, .32, FT, x, .66, .02); b.sph(.035, GOLD, x, .68, .18, 1, 1, 1, 0, 8, 6);
      b.box(.12, .03, .12, FT, x, .015, .2); b.box(.12, .03, .12, FT, x, .015, -.22); }
    return b.done(); };
  // malles de voyage, carton à chapeau, valise
  MD.malles = v => { const b = G.mb(484), r = G.rng(484 + v);
    const malle = (w, h, d, col, x, y, z, ry) => { rb(b, w, h, d, .03, col, x, y, z, 0, ry, 0); const q = new THREE.Quaternion().setFromAxisAngle(UP, ry), P = (lx, ly, lz) => new V3(lx, ly, lz).applyQuaternion(q).add(new V3(x, y, z));
      for (const t of [-.3, .3]) { const p = P(t * w, 0, 0); b.box(.06, h + .01, d + .01, 0x3a2414, p.x, p.y, p.z, 0, ry, 0); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const p = P(sx * (w / 2 - .02), sy * (h / 2 - .02), d / 2); b.box(.06, .06, .02, BRASS, p.x, p.y, p.z, 0, ry, 0); }
      const lk = P(0, h * .3, d / 2 + .01); b.box(.06, .07, .02, BRASS, lk.x, lk.y, lk.z, 0, ry, 0);
      for (let k = 0; k < 2; k++) { const p = P((r() - .5) * w * .5, (r() - .5) * h * .4, d / 2 + .012); b.box(.12, .08, .01, [0xe8434a, 0xffd23f, 0x5b8fd6, 0xffffff][Math.floor(r() * 4)], p.x, p.y, p.z, 0, ry, (r() - .5) * .5); } };
    malle(.82, .42, .5, 0x6b3a1e, 0, .21, 0, .1); malle(.62, .32, .4, 0x23345e, .02, .58, .02, -.15); malle(.42, .24, .3, 0x7a1e22, -.04, .86, 0, .3);
    b.cyl(.17, .17, .22, 18, 0xe8dcc0, .3, 1.09, .05); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.box(.04, .22, .02, 0xd9a0b0, .3 + Math.cos(a) * .17, 1.09, .05 + Math.sin(a) * .17, 0, -a + PI / 2, 0); } b.cyl(.18, .18, .03, 18, 0xd9a0b0, .3, 1.21, .05);
    return b.done(); };
  // grand escalier du restaurant « Le Train Bleu » (3 × 8) : marches de pierre, balustres, rampe dorée, palier et candélabres
  MD.escalier_tb = v => { const b = G.mb(485), ST = 0xeee5d2, ST2 = 0xd8ccb2, n = 24, top = 5.2, run = 6.4;
    for (let k = 0; k < n; k++) { const y = (k + 1) * top / n, z = 3.8 - (k + .5) * run / n; b.P(G.PAT.pierre); b.box(2.6, y, run / n + .02, k % 2 ? ST : 0xf3ecdc, 0, y / 2, z); b.P(0); b.box(2.62, .03, .06, ST2, 0, y, z + run / n / 2); }
    b.box(2.6, .1, .7, 0x8a1f2c, 0, top + .01, -2.9); for (let k = 0; k < n; k++) { b.box(1.6, .012, run / n, 0x8a1f2c, 0, (k + 1) * top / n + .006, 3.8 - (k + .5) * run / n); b.box(1.6, top / n, .012, 0x7a1a26, 0, (k + .5) * top / n, 3.8 - k * run / n + .006); }
    for (const s of [-1, 1]) { const x = s * 1.25, pts = [];
      for (let k = 0; k <= n; k += 2) { const y = k * top / n, z = 3.8 - k * run / n; seg(b, [x, y, z], [x, y + .85, z], .025, .025, IRON, 6); b.sph(.035, GOLD, x, y + .5, z, 1, 1.6, 1, 0, 8, 6); pts.push([x, y + .88, z]); }
      for (let i = 0; i < pts.length - 1; i++) seg(b, pts[i], pts[i + 1], .045, .045, GOLD, 8);
      b.P(G.PAT.pierre); b.box(.3, 1.2, .3, ST2, x, .6, 3.85); b.P(0); b.cyl(.08, .1, .3, 10, IRON, x, 1.35, 3.85); b.sph(.17, 0xfff1c8, x, 1.65, 3.85, 1, 1, 1, 1, 14, 10); b.cone(.05, .12, 8, GOLD, x, 1.86, 3.85); }
    b.P(G.PAT.pierre); b.box(2.9, .35, .9, ST2, 0, top - .12, -3.0); b.P(0); for (let z = -3.4; z <= -2.5; z += .18) for (const s of [-1, 1]) seg(b, [s * 1.4, top, z], [s * 1.4, top + .8, z], .02, .02, IRON, 5);
    for (const s of [-1, 1]) seg(b, [s * 1.4, top + .82, -3.45], [s * 1.4, top + .82, -2.45], .04, .04, GOLD, 8);
    return b.done(); };

  // ---------- objets ----------
  const fx1 = (id, n, model, fp, h, ex = {}) => { O[id] = Object.assign({ id, n, model, v: 0, fp, h, fixed: 1 }, ex); };
  fx1('train_orient', 'Orient-Express', 'train_orient', [2, 22], 2.9);
  fx1('palmier_pot', 'Palmier en pot', 'palmier_pot', [1, 1], 1.1);
  fx1('oranger_caisse', 'Oranger en caisse', 'arbre_caisse', [1, 1], 1.0); fx1('olivier_caisse', 'Olivier en caisse', 'arbre_caisse', [1, 1], 1.0, { v: 1 });
  fx1('jardiniere', 'Grande jardinière', 'jardiniere', [3, 3], 1.0);
  fx1('candelabre', 'Candélabre', 'candelabre', [1, 1], 3.6, { light: 1 });
  fx1('table_bistrot', 'Table de bistrot', 'table_bistrot', [1, 1], .78, { walk: 1 });
  fx1('chaise_bistrot', 'Chaise de bistrot', 'chaise_bistrot', [1, 1], .5, { walk: 1, sit: 1 });
  fx1('banc_gare', 'Banc de gare', 'banc_gare', [2, 1], .5, { walk: 1, sit: 1 });
  fx1('malles', 'Malles de voyage', 'malles', [1, 1], 1.2);
  fx1('escalier_tb', 'Escalier du Train Bleu', 'escalier_tb', [3, 8], 6);

  // ---------- 4. L'AMÉNAGEMENT DU GRAND HALL (44 × 38) ----------
  G.ROOMNPC.gare = ['gare', 28, 27.4];
  G.ROOMFILL.gare = (m, P) => { const { TX } = G.GARE; m.meta.sunny = 1; m.meta.cam = { pitch: .36, dist: 24, ty: 3.4, fx: .75, fz: .7, dz: 2.4 };
    TX.forEach((tx, k) => P('train_orient', tx - 1, 1, 0, { v: k % 2 }));
    // quais : candélabres, bancs, palmiers, malles et chariots
    for (const z of [3, 9, 15, 21]) { P('candelabre', 2, z); P('candelabre', 10, z); P('candelabre', 33, z); P('candelabre', 41, z); P('candelabre', z % 2 ? 19 : 25, z); }
    for (const z of [5, 12, 18]) { P('banc_gare', 9, z + 1, 1); P('banc_gare', 33, z, 3); P('banc_gare', 21, z, 1); P('banc_gare', 23, z + 1, 3); }
    for (const z of [7, 13, 19]) { P('palmier_pot', 22, z - 2); P('palmier_pot', 2, z); P('palmier_pot', 41, z - 1); }
    for (const [x, z] of [[8, 21], [12, 4], [17, 20], [27, 9], [31, 21], [36, 14]]) P('malles', x, z, (x + z) % 4); for (const [x, z] of [[8, 19], [17, 14], [27, 17], [36, 5]]) P('chariot_bagages', x, z, 1);
    P('kiosque_journaux', 21, 9); P('stand_fleurs', 18, 22);
    // hall des pas perdus : jardinière sur la rosace, escalier du Train Bleu, guichets, kiosque, terrasses, orangers, oliviers
    P('jardiniere', 21, 30); P('escalier_tb', 3, 30, 1); P('guichet', 26, 26); P('kiosque_journaux', 16, 25); P('stand_fleurs', 32, 34); P('piano', 12, 35);
    for (const [x, z] of [[18, 29], [25, 29]]) P('banc_gare', x, z, 0); for (const [x, z] of [[18, 34], [25, 34]]) P('banc_gare', x, z, 2);
    for (const [x, z, v] of [[14, 28, 0], [30, 28, 1], [14, 33, 1], [30, 33, 0], [9, 26, 0], [35, 26, 1]]) P(v ? 'olivier_caisse' : 'oranger_caisse', x, z);
    for (const [x, z] of [[20, 36], [24, 36], [1, 25], [12, 29], [42, 37], [17, 37]]) P('palmier_pot', x, z);
    for (const [x, z] of [[13, 26], [31, 26], [11, 36], [33, 37], [19, 32], [26, 32]]) P('candelabre', x, z);
    for (const [x, z] of [[37, 27], [39, 29], [37, 31], [39, 33], [37, 35], [1, 34], [2, 36]]) { P('table_bistrot', x, z); P('chaise_bistrot', x - 1, z, 1); P('chaise_bistrot', x + 1, z, 3); }
    for (const [x, z] of [[20, 27], [24, 27], [16, 31]]) P('malles', x, z, x % 4); P('chariot_bagages', 28, 31, 1); };
  // les locomotives fument doucement (et lâchent un peu de vapeur au ras des cylindres)
  let puffT = 0; G.on('update', dt => { const m = G.map; if (!m || !m._gx || (puffT -= dt) > 0) return; puffT = .55;
    for (const o of m.list) if (o.t === 'train_orient') { const x = o.x + 1, z = o.z + 21.1; G.fx.puff(x, 3.05, z, 2, 0xf2f2f2, .8); if (Math.random() < .3) G.fx.puff(x + (Math.random() < .5 ? -.95 : .95), .9, z - .6, 2, 0xffffff, .45); } });
})();
