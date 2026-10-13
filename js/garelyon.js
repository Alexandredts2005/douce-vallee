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
    const F = k.foliage(b, cl, { pal: v ? [0x34472f, 0x5f7556, 0x8fa27e] : [0x1d4a22, 0x3d7d32, 0x7db55a], c: [0, 2.1, 0], seed: 11 + v * 7, amp: v ? .3 : .16, tufts: v ? 40 : 26, leaf: v ? 1 : 0 });
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
    b.box(2.6, .1, 1.4, 0x8a1f2c, 0, top + .01, -3.3); for (let k = 0; k < n; k++) { b.box(1.6, .012, run / n, 0x8a1f2c, 0, (k + 1) * top / n + .006, 3.8 - (k + .5) * run / n); b.box(1.6, top / n, .012, 0x7a1a26, 0, (k + .5) * top / n, 3.8 - k * run / n + .006); }
    for (const s of [-1, 1]) { const x = s * 1.25, pts = [];
      for (let k = 0; k <= n; k += 2) { const y = k * top / n, z = 3.8 - k * run / n; seg(b, [x, y, z], [x, y + .85, z], .025, .025, IRON, 6); b.sph(.035, GOLD, x, y + .5, z, 1, 1.6, 1, 0, 8, 6); pts.push([x, y + .88, z]); }
      for (let i = 0; i < pts.length - 1; i++) seg(b, pts[i], pts[i + 1], .045, .045, GOLD, 8);
      b.P(G.PAT.pierre); b.box(.3, 1.2, .3, ST2, x, .6, 3.85); b.P(0); b.cyl(.08, .1, .3, 10, IRON, x, 1.35, 3.85); b.sph(.17, 0xfff1c8, x, 1.65, 3.85, 1, 1, 1, 1, 14, 10); b.cone(.05, .12, 8, GOLD, x, 1.86, 3.85); }
    b.P(G.PAT.pierre); b.box(2.9, .35, 1.45, ST2, 0, top - .12, -3.27); b.P(0); for (let z = -3.95; z <= -2.5; z += .18) for (const s of [-1, 1]) seg(b, [s * 1.4, top, z], [s * 1.4, top + .8, z], .02, .02, IRON, 5);
    for (const s of [-1, 1]) seg(b, [s * 1.4, top + .82, -3.98], [s * 1.4, top + .82, -2.45], .04, .04, GOLD, 8);
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
  // on monte l'escalier marche par marche (rampes et poteaux bloquent sur les côtés) ; la mezzanine est un plancher à 5,2 de haut
  const MY = 5.2, stepH = lz => lz >= 3.8 ? 0 : Math.min(24, Math.ceil((3.8 - lz) / (6.4 / 24))) * MY / 24;
  O.escalier_tb.hAt = (o, x, z, m) => { const [cx, cz] = m.center(o), F = G.FR[o.r & 3], dx = x - cx, dz = z - cz, lz = dx * F[0] + dz * F[1], lx = dx * F[1] - dz * F[0];
    return Math.abs(lx) > 1.22 ? (lz > 3.5 ? 1.8 : stepH(lz) + 1.2) : stepH(lz); };
  MD.vide = () => { const b = G.mb(486); b.box(.01, .01, .01, 0x000000, 0, -2, 0); return b.done(); };
  const TB_TABLES = [25.6, 27.6, 29.6, 31.6, 33.6, 35.6];
  fx1('mezz_tb', 'Mezzanine du Train Bleu', 'vide', [4, 13], MY, { hAt: (o, x, z) => {
    if (x - o.x < .3 || z - o.z < .22) return MY + 2; if (x - o.x > 3.86 && (z < 30 || z > 33)) return MY + 1.2;
    for (const tz of TB_TABLES) if (Math.abs(z - tz) < .48 && x - o.x > .6 && x - o.x < 2.4) return MY + .9; return MY; } });
  // gares déjà visitées avec l'ancien escalier : on pose la mezzanine et on décale l'escalier
  G.on('enterMap', m => { if (!m || m.kind !== 'gare' || m.W < 44 || [...m.list].some(o => o.t === 'mezz_tb')) return;
    for (const o of [...m.list]) if (o.t === 'escalier_tb' || (o.x <= 3 && o.z >= 25 && o.t !== 'paillasson')) m.removeObj(o);
    m.addObj('mezz_tb', 0, 25); if (m.canPlace('escalier_tb', 4, 30, 1)) m.addObj('escalier_tb', 4, 30, 1); });

  // ---------- 5. L'EXTÉRIEUR DE LA GARE (6 × 3) : façade de pierre, verrière en plein cintre, beffroi à quatre horloges,
  // marquise de fer et de verre, et la grande halle vitrée au-dessus des quais (elle déborde au-dessus des rails, derrière) ----------
  const FONT = { A: ['010', '101', '111', '101', '101'], E: ['111', '100', '110', '100', '111'], G: ['111', '100', '101', '101', '111'], R: ['110', '101', '110', '101', '101'], V: ['101', '101', '101', '101', '010'], O: ['111', '101', '101', '101', '111'], I: ['111', '010', '010', '010', '111'], S: ['111', '100', '111', '001', '111'], U: ['101', '101', '101', '101', '111'], C: ['111', '100', '100', '100', '111'], M: ['10001', '11011', '10101', '10001', '10001'], N: ['1001', '1101', '1011', '1001', '1001'], T: ['111', '010', '010', '010', '010'] };
  // lettres en relief sur une façade (face +z si sg = 1, face −z si sg = −1)
  function lettres(b, txt, x, y, z, px, col, sg = 1) { let w = -1; for (const c of txt) w += (FONT[c] ? FONT[c][0].length : 2) + 1; let cx = -w * px / 2;
    for (const c of txt) { const g = FONT[c]; if (!g) { cx += 3 * px; continue; } g.forEach((row, r) => [...row].forEach((k, i) => { if (k === '1') b.box(px * .92, px * .92, px * .5, col, x + sg * (cx + (i + .5) * px), y + (4 - r) * px, z); })); cx += (g[0].length + 1) * px; } }
  function horloge(b, x, y, z, ry, r) { const q = new THREE.Quaternion().setFromAxisAngle(UP, ry), P = (lx, ly, lz) => new V3(lx, ly, lz).applyQuaternion(q).add(new V3(x, y, z));
    let p = P(0, 0, .04); b.cyl(r + .08, r + .08, .08, 28, 0xd8cbb0, p.x, p.y, p.z, PI / 2, ry, 0); p = P(0, 0, .09); b.cyl(r, r, .03, 28, 0xfffaf0, p.x, p.y, p.z, PI / 2, ry, 0); p = P(0, 0, .1); b.tor(r, .025, GOLD, p.x, p.y, p.z, 0, ry, 0, 0, 28);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; p = P(Math.cos(a) * r * .8, Math.sin(a) * r * .8, .11); b.box(k % 3 ? .035 : .07, .022, .012, 0x222222, p.x, p.y, p.z, 0, ry, a); }
    for (const [a, L, w] of [[PI / 2 - (10 + 8 / 60) / 12 * TAU, r * .5, .035], [PI / 2 - 8 / 60 * TAU, r * .78, .022]]) { p = P(Math.cos(a) * L / 2, Math.sin(a) * L / 2, .12); b.box(L, w, .012, 0x1e1e1e, p.x, p.y, p.z, 0, ry, a); } p = P(0, 0, .13); b.sph(.03, GOLD, p.x, p.y, p.z, 1, 1, 1, 0, 8, 6); }
  MD.gare = v => { const b = G.mb(490), A = G.ARCH, PT = A.PT, GS = 0xeadfc8, GS2 = 0xd8cbb0, GS3 = 0xf3ead6, SL = 0x4d5866, IR = 0x34403e, GL = 0xbfdcf0, W = A.fenetre, D = A.porte;
    const blk = (xc, zc, w, d, fh, wh) => ({ xc, zc, w, d, fh, wh }), HALL = blk(-.95, -.05, 4.1, 2.7, .25, 4.35), TOW = blk(2.15, .6, 1.4, 1.3, .25, 6.7), WING = blk(2.2, -.75, 1.5, 1.3, .25, 3.1);
    const walls = H => { b.P(PT.pierre); b.box(H.w, H.wh, H.d, GS, H.xc, H.fh + H.wh / 2, H.zc); b.P(0); }, corn = (H, y, o = .1, h = .16) => { b.P(PT.pierre); b.box(H.w + o * 2, h, H.d + o * 2, GS2, H.xc, y, H.zc); b.P(0); };
    b.P(PT.pierre); b.box(6.3, .25, 3.1, 0xcfc4ad, 0, .125, 0); b.P(0);
    for (const H of [HALL, TOW, WING]) { walls(H); corn(H, H.fh + .1, .05, .2); corn(H, H.fh + H.wh + .08, .12, .2); }
    corn(HALL, HALL.fh + 2.2, .04, .1);
    // --- la grande verrière en plein cintre (réseau de fer en éventail) et ses voussoirs ---
    const zf = HALL.zc + HALL.d / 2, X = HALL.xc, yS = 3.0, R = 1.3;
    b.geo(new THREE.CylinderGeometry(R, R, .06, 32, 1, false, -PI / 2, PI), GL, b.M(X, yS, zf + .09, -PI / 2, 0, 0), 2);
    b.box(R * 2, yS - 2.1, .06, GL, X, (yS + 2.1) / 2, zf + .09, 0, 0, 0, 2); b.box(R * 2 + .1, yS - 2.05, .04, 0x2a3a46, X, (yS + 2.1) / 2, zf + .03); b.P(PT.pierre); b.box(R * 2 + .5, .12, .2, GS2, X, 2.04, zf + .1); b.P(0);
    b.geo(new THREE.CylinderGeometry(R - .02, R - .02, .02, 32, 1, false, -PI / 2, PI), 0x2a3a46, b.M(X, yS, zf + .03, -PI / 2, 0, 0));
    for (let k = 1; k < 10; k++) { const a = k / 10 * PI; b.box(R, .035, .03, IR, X + Math.cos(a) * R / 2, yS + Math.sin(a) * R / 2, zf + .13, 0, 0, a); }
    for (const rr of [.45, .95]) b.geo(new THREE.TorusGeometry(rr, .025, 5, 24, PI), IR, b.M(X, yS, zf + .13), 0, true); b.box(R * 2, .05, .04, IR, X, yS, zf + .13); for (const a of [-.95, -.48, 0, .48, .95]) b.box(.035, yS - 2.1, .03, IR, X + a * R, (yS + 2.1) / 2, zf + .13); b.box(R * 2, .04, .03, IR, X, 2.55, zf + .13);
    for (let k = 0; k <= 14; k++) { const a = k / 14 * PI; b.P(PT.pierre); b.box(.3, .2, .16, k === 7 ? GS3 : GS2, X + Math.cos(a) * (R + .26), yS + Math.sin(a) * (R + .26), zf + .1, 0, 0, a - PI / 2); b.P(0); }
    b.P(PT.pierre); b.box(.4, .45, .2, GS3, X, yS + R + .32, zf + .12); b.P(0); b.sph(.12, GOLD, X, yS + R + .35, zf + .24, 1, 1.2, .5, 0, 10, 8);
    // trois portes vitrées sous la marquise
    for (const a of [-1.15, 0, 1.15]) D(b, HALL, 0, a, { w: .6, h: 1.3, col: 0x2f5a46, style: 'vitre', frame: 0xf2ead8, steps: 0, lampPos: 'none' });
    // pilastres, statues assises au sommet, attique « GARE » et cartouche
    for (const s of [-1, 1]) { const x = X + s * 1.92; b.P(PT.pierre); b.box(.32, HALL.wh, .14, GS3, x, HALL.fh + HALL.wh / 2, zf + .07); b.box(.42, .22, .26, GS2, x, HALL.fh + HALL.wh - .1, zf + .1); b.P(0);
      b.P(PT.pierre); b.box(.36, .3, .36, GS2, x, HALL.fh + HALL.wh + .35, zf - .1); b.P(0); b.cyl(.09, .15, .45, 8, 0xf3ecdc, x, HALL.fh + HALL.wh + .72, zf - .1); b.sph(.1, 0xf3ecdc, x, HALL.fh + HALL.wh + 1.03, zf - .1); b.box(.36, .05, .07, 0xf3ecdc, x, HALL.fh + HALL.wh + .85, zf - .05, 0, 0, s * .5); }
    b.P(PT.pierre); b.box(3.2, .9, .35, GS, X, HALL.fh + HALL.wh + .5, zf - .2); b.P(0); lettres(b, 'GARE', X, HALL.fh + HALL.wh + .25, zf, .1, GOLD);
    b.P(PT.pierre); G.prism(b, 2.0, .55, .35, GS2, X, HALL.fh + HALL.wh + .95, zf - .2); b.P(0); b.sph(.17, GOLD, X, HALL.fh + HALL.wh + 1.2, zf - .02, 1.3, 1, .4, 0, 12, 8);
    // fenêtres des côtés et du dos de la halle
    const WO = { glass: 0x9fb9d4, frame: 0xf2ead8, sill: GS2, pane: 'petits' };
    for (const a of [-.6, .6]) { W(b, HALL, 3, a, 1.4, Object.assign({ w: .45, h: .95, arch: 1 }, WO)); W(b, HALL, 3, a, 3.3, Object.assign({ w: .45, h: .8 }, WO)); }
    // toit à la Mansart de la halle, crête dorée, œils-de-bœuf
    const yR = HALL.fh + HALL.wh + .18; b.P(PT.ardoise); b.box(HALL.w - .2, .9, HALL.d - .6, SL, X, yR + .45, HALL.zc - .3); b.P(0);
    for (let k = 0; k < 14; k++) b.box(.035, .14, .035, GOLD, X - 1.7 + k * .26, yR + .97, HALL.zc - .3);
    for (const a of [-1.1, 0, 1.1]) { b.P(PT.pierre); b.box(.4, .45, .2, GS, X + a, yR + .45, HALL.zc + .97); b.P(0); b.cyl(.12, .12, .04, 14, GL, X + a, yR + .47, HALL.zc + 1.08, PI / 2, 0, 0, 1); b.tor(.13, .025, GOLD, X + a, yR + .47, HALL.zc + 1.09, 0, 0, 0, 0, 14); }
    // marquise de fer et de verre, consoles, lanternes
    const zm = zf + .5, YM = 1.88; b.box(4.0, .05, 1.0, 0xcfe6f5, X, YM, zm, -.1, 0, 0, 2); b.box(4.05, .1, .05, IR, X, YM - .04, zf + 1.0); b.box(4.05, .08, .05, IR, X, YM + .05, zf + .02);
    for (let k = 0; k < 18; k++) b.sph(.03, IR, X - 1.95 + k * .23, YM - .11, zf + 1.0, 1, 1, 1, 0, 5, 4);
    for (const a of [-1.85, -.6, .6, 1.85]) { b.box(.04, .04, 1.0, IR, X + a, YM - .03, zm, -.1); seg(b, [X + a, YM - .5, zf + .03], [X + a, YM - .03, zf + .9], .02, .02, IR, 5); b.geo(new THREE.TorusGeometry(.18, .015, 5, 10, PI), IR, b.M(X + a, YM - .25, zf + .25, 0, PI / 2, 0), 0, true); }
    for (const a of [-.58, .58]) { b.cyl(.01, .01, .15, 4, IR, X + a, YM - .14, zf + .75); b.cyl(.07, .06, .16, 8, IR, X + a, YM - .28, zf + .75); b.cyl(.05, .05, .1, 8, 0xfff1c8, X + a, YM - .36, zf + .75, 0, 0, 0, 1); }
    // --- le beffroi à quatre horloges (façon « Big Ben » de la Gare de Lyon) ---
    for (const s of [-1, 1]) { b.P(PT.pierre); b.box(.16, TOW.wh, .16, GS3, TOW.xc + s * .66, TOW.fh + TOW.wh / 2, TOW.zc + .66); b.box(.16, TOW.wh, .16, GS3, TOW.xc + s * .66, TOW.fh + TOW.wh / 2, TOW.zc - .66); b.P(0); }
    D(b, TOW, 0, 0, { w: .55, h: 1.25, col: 0x2f5a46, style: 'vitre', frame: 0xf2ead8, arch: 1, steps: 0, lamp: 2 });
    for (const y of [2.6, 3.9, 5.2]) { W(b, TOW, 0, 0, y, Object.assign({ w: .32, h: .8, arch: 1 }, WO)); W(b, TOW, 2, 0, y, Object.assign({ w: .32, h: .8, arch: 1 }, WO)); W(b, TOW, 1, 0, y, Object.assign({ w: .32, h: .8, arch: 1 }, WO)); W(b, TOW, 3, 0, y - .65, Object.assign({ w: .32, h: .7, arch: 1 }, WO)); }
    for (const y of [2.1, 3.35, 4.6]) corn(TOW, y, .03, .08);
    const yB = TOW.fh + TOW.wh; b.P(PT.pierre); b.box(1.55, 1.5, 1.45, GS, TOW.xc, yB + .75, TOW.zc); b.P(0); corn(blk(TOW.xc, TOW.zc, 1.55, 1.45, 0, 0), yB + 1.55, .1, .18);
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, dx = Math.sin(ry) * .74, dz = Math.cos(ry) * .74; horloge(b, TOW.xc + dx, yB + .75, TOW.zc + dz, ry, .55); }
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = TOW.xc + sx * .74, z = TOW.zc + sz * .7; b.P(PT.pierre); b.cyl(.13, .14, 1.4, 10, GS3, x, yB + .9, z); b.P(0); b.P(PT.ardoise); b.cone(.17, .55, 10, SL, x, yB + 1.9, z); b.P(0); b.sph(.035, GOLD, x, yB + 2.2, z, 1, 1, 1, 0, 6, 4); }
    const yP = yB + 1.64; b.P(PT.ardoise); b.cone(1.0, 2.6, 4, SL, TOW.xc, yP + 1.3, TOW.zc, 0, PI / 4); b.P(0);
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, dx = Math.sin(ry) * .42, dz = Math.cos(ry) * .42; b.P(PT.pierre); b.box(.3, .5, .25, GS, TOW.xc + dx, yP + .55, TOW.zc + dz, 0, ry, 0); b.P(0); G.prism(b, .4, .22, .3, SL, TOW.xc + dx * 1.05, yP + .85, TOW.zc + dz * 1.05, ry); b.box(.12, .22, .02, 0xffe2a0, TOW.xc + dx * 1.3, yP + .55, TOW.zc + dz * 1.3, 0, ry, 0, 1); }
    b.cyl(.03, .05, .7, 8, GOLD, TOW.xc, yP + 2.9, TOW.zc); b.sph(.09, GOLD, TOW.xc, yP + 3.0, TOW.zc, 1, 1, 1, 0, 10, 8); b.cone(.04, .25, 6, GOLD, TOW.xc, yP + 3.4, TOW.zc);
    b.cyl(.012, .012, .7, 4, 0xdddddd, TOW.xc + .1, yP + 3.35, TOW.zc); [0x1f3f9a, 0xffffff, 0xe1262f].forEach((c, k) => b.box(.13, .26, .012, c, TOW.xc + .17 + k * .13, yP + 3.55, TOW.zc));
    // aile basse et son toit
    b.P(PT.ardoise); G.prism(b, WING.d + .3, .7, WING.w + .2, SL, WING.xc, WING.fh + WING.wh + .14, WING.zc, PI / 2); b.P(0); W(b, WING, 2, 0, 1.4, Object.assign({ w: .4, h: .9, arch: 1 }, WO)); W(b, WING, 2, 0, 2.7, Object.assign({ w: .4, h: .6 }, WO));
    // côté quais : portes vers les voies, fenêtres cintrées, « VOIES », horloge
    const zb = HALL.zc - HALL.d / 2; for (const a of [-1.15, 0, 1.15]) D(b, HALL, 1, a, { w: .6, h: 1.3, col: 0x2f5a46, style: 'vitre', frame: 0xf2ead8, steps: 0, lampPos: 'none' });
    for (const a of [-1.55, -.55, .55, 1.55]) W(b, HALL, 1, a, 2.85, Object.assign({ w: .38, h: .85, arch: 1 }, WO)); lettres(b, 'VOIES', X, 3.65, zb - .02, .08, GOLD, -1); horloge(b, X, 4.25, zb - .02, PI, .32);
    // --- la grande halle vitrée au-dessus des quais (voûte de fer et de verre, colonnes de fonte, lampes) ---
    const SX0 = -3.6, SX1 = 7.4, SZ0 = -1.55, SZ1 = -4.45, SY = 3.4, SR = 1.25, SZC = (SZ0 + SZ1) / 2, SW = SZ0 - SZ1, ARC = t => [SZC + Math.cos(t) * SW / 2, SY + Math.sin(t) * SR];
    for (let x = SX0; x <= SX1 + .01; x += 1.1) { for (let i = 0; i < 12; i++) { const [z0, y0] = ARC(i / 12 * PI), [z1, y1] = ARC((i + 1) / 12 * PI); b.box(.07, .1, Math.hypot(z1 - z0, y1 - y0) + .02, IR, x, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0), 0, 0); }
      for (const z of [SZ0, SZ1]) b.box(.06, .06, .5, IR, x, SY - .15, z + (z === SZ0 ? -.2 : .2), z === SZ0 ? -.6 : .6, 0, 0); }
    const gl = []; for (let i = 0; i < 12; i++) { const [z0, y0] = ARC(i / 12 * PI), [z1, y1] = ARC((i + 1) / 12 * PI); b.box(SX1 - SX0, .04, .04, IR, (SX0 + SX1) / 2, y0, z0); gl.push([z0, y0, z1, y1]); }
    for (const [z0, y0, z1, y1] of gl) b.box(SX1 - SX0, .02, Math.hypot(z1 - z0, y1 - y0), 0xd8ecf8, (SX0 + SX1) / 2, (y0 + y1) / 2 + .02, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0), 0, 0, 2);
    for (const z of [SZ0, SZ1]) { b.box(SX1 - SX0 + .2, .16, .14, IR, (SX0 + SX1) / 2, SY, z); b.box(SX1 - SX0 + .2, .05, .06, 0x5a6a68, (SX0 + SX1) / 2, SY - .2, z);
      for (let x = SX0 + .2; x <= SX1; x += 2.2) { if (z === SZ1 && x > 4.6 && x < 7.4) continue; // passage vers le tunnel de la rue commerçante b.cyl(.07, .1, SY - .1, 10, IR, x, (SY - .1) / 2, z); b.cyl(.15, .12, .18, 10, IR, x, .09, z); b.cyl(.14, .08, .2, 10, GOLD, x, SY - .2, z);
        b.geo(new THREE.TorusGeometry(.35, .025, 5, 10, PI / 2), IR, b.M(x, SY - .4, z + (z === SZ0 ? -.35 : .35), 0, PI / 2, z === SZ0 ? 0 : PI / 2), 0, true); } }
    for (const x of [SX0, SX1]) for (let i = 1; i < 6; i++) { const [z1, y1] = ARC(i / 6 * PI); b.box(.04, Math.hypot(z1 - SZC, y1 - SY), .04, IR, x, (SY + y1) / 2, (SZC + z1) / 2, Math.atan2(z1 - SZC, y1 - SY), 0, 0); }
    for (let x = SX0 + .55; x < SX1; x += 2.2) { b.cyl(.01, .01, .9, 4, 0x555555, x, SY + .6, SZC); b.cyl(.09, .05, .1, 8, IR, x, SY + .12, SZC); b.sph(.1, 0xfff1c8, x, SY, SZC, 1, 1, 1, 1, 10, 8); }
    // perron, bacs à fleurs
    b.P(PT.pierre); b.box(4.4, .12, .4, GS2, X, .06, zf + .2); b.P(0);
    for (const s of [-1, 1]) { const x = X + s * 2.25; rb(b, .5, .35, .3, .03, 0x2f4a3a, x, .42, zf + .2); for (let k = 0; k < 5; k++) b.sph(.06, [0xe8434a, 0xffffff, 0xffd23f][k % 3], x - .18 + k * .09, .65, zf + .2, 1, 1, 1, 0, 6, 5); }
    return b.done(); };

  // ---------- 6. PORTAILS DE TUNNEL : pierre de taille, voussoirs et clé, pilastres, corniche, lanternes, lierre ;
  // v = largeur*10 + niveau de la falaise (le modèle descend du haut de la falaise jusqu'au sol) ----------
  MD.tunnel = v => { const w = Math.floor(v / 10) || 3, lv = v % 10 || 2, y0 = -lv * G.TIER, b = G.mb(495 + v), PT = G.PAT, ow = w === 3 ? 2.3 : 1.9, oh = w === 3 ? 2.55 : 2.35, z = .5, hr = oh - ow / 2;
    const S1 = 0xb7ab94, S2 = 0x9d927d, S3 = 0xd6ccb6, FW = ow + 2.1, FH = Math.min(-y0 + .35, oh + 1.25), DK = 0x0b0907;
    b.P(PT.pierre); b.box(FW, FH, .3, S1, 0, y0 + FH / 2, z - .1); b.P(0);
    b.box(ow, hr, .04, DK, 0, y0 + hr / 2, z + .07); b.geo(new THREE.CircleGeometry(ow / 2, 24, 0, PI), DK, b.M(0, y0 + hr, z + .07));
    for (const [k, c] of [[.92, 0x16120e], [.82, 0x0e0b09]]) { b.box(ow * k, hr, .03, c, 0, y0 + hr / 2, z + .08); b.geo(new THREE.CircleGeometry(ow / 2 * k, 24, 0, PI), c, b.M(0, y0 + hr, z + .08)); }
    for (let k = 0; k <= 12; k++) { const a = k / 12 * PI, key = k === 6; b.P(PT.pierre); b.box(key ? .34 : .26, key ? .42 : .3, .36, key ? S3 : (k % 2 ? S2 : S1), Math.cos(a) * (ow / 2 + .17), y0 + hr + Math.sin(a) * (ow / 2 + .17), z + .12, 0, 0, a - PI / 2); b.P(0); }
    for (const s of [-1, 1]) { const x = s * (ow / 2 + .2); b.P(PT.pierre); for (let k = 0; k < Math.ceil(hr / .3); k++) b.box(k % 2 ? .44 : .34, .27, .36, k % 2 ? S2 : S1, x + s * (k % 2 ? .05 : 0), y0 + .15 + k * .3, z + .12); b.P(0);
      const px = s * (FW / 2 - .2); b.P(PT.pierre); b.box(.36, FH, .2, S3, px, y0 + FH / 2, z + .1); b.box(.46, .25, .28, S2, px, y0 + .12, z + .12); b.box(.46, .2, .28, S2, px, y0 + FH - .45, z + .12); b.P(0);
      // lanterne murale
      const lx = s * (ow / 2 + .62), ly = y0 + hr + .15; b.box(.06, .06, .3, IRON, lx, ly + .25, z + .3); seg(b, [lx, ly + .4, z + .12], [lx, ly + .25, z + .42], .015, .015, IRON, 5); b.cyl(.09, .07, .05, 8, IRON, lx, ly + .14, z + .42); b.cyl(.06, .06, .18, 8, 0xfff1c8, lx, ly, z + .42, 0, 0, 0, 1); b.cone(.1, .12, 8, IRON, lx, ly + .16, z + .42); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; b.box(.012, .18, .012, IRON, lx + Math.cos(a) * .065, ly, z + .42 + Math.sin(a) * .065); } }
    b.P(PT.pierre); b.box(FW + .3, .18, .42, S3, 0, y0 + FH - .2, z + .1); b.box(FW + .1, .1, .36, S2, 0, y0 + FH - .34, z + .1); b.P(0);
    for (let k = 0; k < Math.round(FW / .22); k++) b.cyl(.04, .05, .22, 6, S3, -FW / 2 + .15 + k * .22, y0 + FH - .02, z + .05);
    if (w === 2) { rb(b, 2.75, .32, .05, .02, 0x1f3a2c, 0, y0 + hr + ow / 2 + .45, z + .32); lettres(b, 'RUE COMMERCANTE', 0, y0 + hr + ow / 2 + .345, z + .36, .042, GOLD); }
    b.jit(.25); for (let k = 0; k < 14; k++) { const x = -FW / 2 + .2 + ((k * 37) % 100) / 100 * (FW - .4), h = .3 + ((k * 53) % 70) / 100; b.blob(.13, 0, k % 2 ? 0x3f7a35 : 0x4f8f3f, x, y0 + FH - .25 - h * .5, z + .32, .9, h * 2.4, .5); } b.jit(0);
    return b.done(); };

  // ---------- 7. LE TRAIN QUI TRAVERSE LE VILLAGE : le même Orient-Express (wagon-lits puis Pullman), roulant le long de x ----------
  MD.train = v => { const b = G.mb(447); loco(b, 0); voiture(b, -4.95, .55, 0); voiture(b, -10.95, -5.15, 1); const g = b.done(); g.rotateY(PI / 2); g.computeBoundingSphere(); g.computeBoundingBox(); return g; };

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
    P('jardiniere', 21, 30); P('mezz_tb', 0, 25); P('escalier_tb', 4, 30, 1); P('guichet', 26, 26); P('kiosque_journaux', 16, 25); P('stand_fleurs', 32, 34); P('piano', 12, 35);
    for (const [x, z] of [[18, 29], [25, 29]]) P('banc_gare', x, z, 0); for (const [x, z] of [[18, 34], [25, 34]]) P('banc_gare', x, z, 2);
    for (const [x, z, v] of [[14, 28, 0], [30, 28, 1], [14, 33, 1], [30, 33, 0], [9, 26, 0], [35, 26, 1]]) P(v ? 'olivier_caisse' : 'oranger_caisse', x, z);
    for (const [x, z] of [[20, 36], [24, 36], [13, 31], [12, 29], [42, 37], [17, 37]]) P('palmier_pot', x, z);
    for (const [x, z] of [[13, 26], [31, 26], [11, 36], [33, 37], [19, 32], [26, 32]]) P('candelabre', x, z);
    for (const [x, z] of [[37, 27], [39, 29], [37, 31], [39, 33], [37, 35]]) { P('table_bistrot', x, z); P('chaise_bistrot', x - 1, z, 1); P('chaise_bistrot', x + 1, z, 3); }
    for (const [x, z] of [[20, 27], [24, 27], [16, 31]]) P('malles', x, z, x % 4); P('chariot_bagages', 28, 31, 1); };
  // les locomotives fument doucement (et lâchent un peu de vapeur au ras des cylindres)
  let puffT = 0; G.on('update', dt => { const m = G.map; if (!m || !m._gx || (puffT -= dt) > 0) return; puffT = .55;
    for (const o of m.list) if (o.t === 'train_orient') { const x = o.x + 1, z = o.z + 21.1; G.fx.puff(x, 3.05, z, 2, 0xf2f2f2, .8); if (Math.random() < .3) G.fx.puff(x + (Math.random() < .5 ? -.95 : .95), .9, z - .6, 2, 0xffffff, .45); } });
  // ===================== GARE PROVENÇALE (gare au milieu d'un grand monde, sans tunnel) =====================
  // grande gare de pays : crépi ocre, chaînes d'angle en pierre, tuiles romaines et génoise, volets bleu lavande, campanile en fer forgé,
  // horloge au fronton, grande marquise de fonte et de verre sur le quai, jardinières de lavande et oliviers en pot
  MD.gare_provence = v => { const b = G.mb(495), A = G.ARCH, PT = A.PT, W = A.fenetre, D = A.porte;
    const OC = 0xf1d7a6, ST = 0xeee3cc, ST2 = 0xd9ccb0, TU = 0xc96a3e, TU2 = 0xa8522f, SH = 0x7fa7b8, GR = 0x3d6b52, GL = 0xcfe6f2;
    const blk = (xc, zc, w, d, fh, wh) => ({ xc, zc, w, d, fh, wh }), MAIN = blk(0, .05, 3.6, 2.5, .3, 3.6), WL = blk(-3.2, .15, 2.8, 2.1, .3, 2.35), WR = blk(3.2, .15, 2.8, 2.1, .3, 2.35);
    b.P(PT.pierre); b.box(10, .3, 3.1, ST2, 0, .15, 0); b.P(0);
    // toit à quatre pans en tuiles romaines, génoise sous l'avant-toit
    const hip = (H, ph, ov = .3) => { const w = H.w + ov * 2, d = H.d + ov * 2, y0 = H.fh + H.wh, h = d / 2 * ph, x0 = H.xc - w / 2, x1 = H.xc + w / 2, z0 = H.zc - d / 2, z1 = H.zc + d / 2, r0 = x0 + d / 2, r1 = x1 - d / 2, zc = H.zc, yt = y0 + h;
      const P = [x0, y0, z1, x1, y0, z1, r1, yt, zc, x0, y0, z1, r1, yt, zc, r0, yt, zc, x1, y0, z0, x0, y0, z0, r0, yt, zc, x1, y0, z0, r0, yt, zc, r1, yt, zc, x0, y0, z0, x0, y0, z1, r0, yt, zc, x1, y0, z1, x1, y0, z0, r1, yt, zc];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); b.P(PT.tuiles); b.geo(g, TU, b.M()); b.P(0);
      b.cyl(.07, .07, r1 - r0 + .1, 8, TU2, H.xc, yt + .02, zc, 0, 0, PI / 2);
      for (const s of [-1, 1]) { for (let k = 0; k < Math.round(w / .15); k++) for (const [dy, dx] of [[.05, 0], [.14, .075]]) b.cyl(.04, .04, .12, 6, k % 2 ? TU : TU2, x0 + .1 + k * .15 + dx, y0 - dy, zc + s * (d / 2 - ov + .05), PI / 2);
        for (let k = 0; k < Math.round(d / .15); k++) b.cyl(.04, .04, .12, 6, TU2, H.xc + s * (w / 2 - ov + .05), y0 - .05, z0 + .1 + k * .15, 0, 0, PI / 2); }
      return yt; };
    for (const H of [MAIN, WL, WR]) { b.P(PT.crepi); b.box(H.w, H.wh, H.d, OC, H.xc, H.fh + H.wh / 2, H.zc); b.P(0);
      b.P(PT.pierre); for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < Math.floor(H.wh / .3); k++) b.geo(new THREE.BoxGeometry(k % 2 ? .2 : .3, .27, k % 2 ? .3 : .2), ST, b.M(H.xc + sx * (H.w / 2 - .07), H.fh + .15 + k * .3, H.zc + sz * (H.d / 2 - .07)));
      b.box(H.w + .1, .16, H.d + .1, ST2, H.xc, H.fh + .08, H.zc); b.box(H.w + .14, .12, H.d + .14, ST, H.xc, H.fh + H.wh - .06, H.zc); b.P(0); }
    const WO = { glass: 0x9fb9d4, frame: 0xf6efe0, sill: ST2, shut: SH, pane: 'petits' };
    // bâtiment voyageurs : trois grandes portes vitrées en plein cintre, étage à volets, bandeau entre les étages
    for (const f of [0, 1]) { for (const a of [-1.15, 0, 1.15]) { D(b, MAIN, f, a, { w: .72, h: 1.7, col: GR, style: 'vitre', frame: 0xf6efe0, arch: 1, steps: 0, lampPos: 'none' }); W(b, MAIN, f, a, 3.05, Object.assign({ w: .5, h: .85 }, WO)); } }
    b.P(PT.pierre); b.box(MAIN.w + .08, .1, MAIN.d + .08, ST, 0, 2.35, MAIN.zc); b.P(0);
    for (const f of [2, 3]) W(b, MAIN, f, 0, 3.05, Object.assign({ w: .5, h: .85 }, WO));
    // ailes : fenêtres cintrées à volets devant, derrière et au bout
    for (const H of [WL, WR]) { for (const f of [0, 1]) for (const a of [-.85, 0, .85]) W(b, H, f, a, 1.35, Object.assign({ w: .5, h: 1.05, arch: 1 }, WO)); W(b, H, H === WL ? 3 : 2, 0, 1.35, Object.assign({ w: .5, h: 1.05, arch: 1 }, WO)); }
    // fronton, horloge, enseigne « GARE »
    const yM = MAIN.fh + MAIN.wh; b.P(PT.pierre); G.prism(b, 2.6, .75, .3, ST, 0, yM - .02, MAIN.zc + MAIN.d / 2 - .05); b.P(0); horloge(b, 0, yM + .26, MAIN.zc + MAIN.d / 2 + .12, 0, .26);
    b.P(PT.pierre); b.box(2.2, .38, .08, ST, 0, 2.63, MAIN.zc + MAIN.d / 2 + .04); b.P(0); lettres(b, 'GARE', 0, 2.55, MAIN.zc + MAIN.d / 2 + .1, .085, 0x2f4f6a);
    const yt = hip(MAIN, .62); hip(WL, .62); hip(WR, .62);
    // campanile en fer forgé et sa cloche
    b.P(PT.pierre); b.box(.5, .45, .5, ST, 0, yt + .2, MAIN.zc); b.P(0);
    for (const ry of [0, PI / 2]) b.geo(new THREE.TorusGeometry(.32, .022, 5, 20, PI), IRON, b.M(0, yt + .42, MAIN.zc, 0, ry, 0), 0, true);
    b.geo(new THREE.ConeGeometry(.13, .22, 12, 1, true), GOLD, b.M(0, yt + .58, MAIN.zc)); b.sph(.05, GOLD, 0, yt + .46, MAIN.zc, 1, 1, 1, 0, 8, 6); b.cyl(.012, .012, .5, 5, IRON, 0, yt + .98, MAIN.zc); b.sph(.05, GOLD, 0, yt + 1.25, MAIN.zc, 1, 1, 1, 0, 8, 6);
    b.box(.3, .03, .015, IRON, .1, yt + 1.12, MAIN.zc); b.box(.015, .015, .14, IRON, 0, yt + 1.12, MAIN.zc);
    // marquise du quai : verre sur fonte verte, colonnes à chapiteau et consoles en volute
    const zq = -1.25, zb = -2.75, yq = 2.25;
    b.box(10, .05, zq - zb, GL, 0, yq + .12, (zq + zb) / 2, -.09, 0, 0, 2); b.box(10, .1, .07, GR, 0, yq - .02, zb); b.box(10, .08, .07, GR, 0, yq + .2, zq);
    for (let k = 0; k < 34; k++) b.sph(.028, GR, -4.95 + k * .3, yq - .1, zb, 1, 1, 1, 0, 5, 4);
    for (const x of [-4.4, -2.2, 0, 2.2, 4.4]) { b.cyl(.055, .07, yq, 10, GR, x, yq / 2, zb + .25); b.cyl(.11, .11, .1, 10, GR, x, .05, zb + .25); b.box(.18, .1, .18, GR, x, yq - .02, zb + .25);
      b.geo(new THREE.TorusGeometry(.32, .02, 5, 12, PI / 2), GR, b.M(x, yq - .35, zb + .57, 0, PI / 2, 0), 0, true); b.cyl(.06, .05, .14, 8, IRON, x, yq - .2, zb + .25); b.cyl(.045, .045, .08, 8, 0xfff0c4, x, yq - .3, zb + .25, 0, 0, 0, 1); }
    // petite marquise au-dessus des portes d'entrée
    b.box(3.6, .04, .75, GL, 0, 2.15, MAIN.zc + MAIN.d / 2 + .38, .12, 0, 0, 2); b.box(3.62, .07, .05, GR, 0, 2.08, MAIN.zc + MAIN.d / 2 + .75);
    for (const a of [-1.75, 1.75]) seg(b, [a, 1.75, MAIN.zc + MAIN.d / 2 + .02], [a, 2.1, MAIN.zc + MAIN.d / 2 + .7], .015, .015, GR, 5);
    // jardinières de lavande et oliviers en pot, devant la gare
    const zl = 1.62; for (const H of [WL, WR]) { b.box(2.4, .3, .32, 0xb5653a, H.xc, .45, zl); for (let k = 0; k < 9; k++) { b.cyl(.012, .012, .2, 4, 0x6a7d4a, H.xc - 1.05 + k * .26, .68, zl); b.sph(.07, k % 3 ? 0x9b84d4 : 0x8a72c8, H.xc - 1.05 + k * .26, .82, zl, .8, 1.6, .8, 0, 6, 5); } }
    for (const x of [-2.0, 2.0]) { b.cyl(.2, .15, .38, 12, 0xb5653a, x, .49, 1.55); b.cyl(.05, .07, .7, 6, 0x6b5a46, x, .95, 1.55); b.jit(.1); for (const [dx, dy, dz, r] of [[0, 1.45, 0, .32], [.2, 1.35, .1, .22], [-.2, 1.38, -.05, .24], [0, 1.65, .05, .2]]) b.blob(r, 1, 0x8f9c6a, x + dx, dy, 1.55 + dz, 1, .85, 1); b.jit(0); }
    return b.done(); };
  O.gare_provence = Object.assign({}, O.gare, { id: 'gare_provence', n: 'Gare', model: 'gare_provence', v: 0, fp: [10, 3], h: 9 });
})();
