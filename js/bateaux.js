'use strict';
// ===== De beaux bateaux, tous différents : voilier de plaisance, pointu marseillais, canot Riva en acajou, chalutier à timonerie,
// barque à rames. Vraie coque galbée (étrave, tableau, ligne de flottaison, liston), ponts en teck, gréements, accastillage.
// La proue est vers +x, la flottaison à y = 0. Le bateau du capitaine (au ponton) reste le voilier. =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3, UP = new V3(0, 1, 0), rb = (...a) => G.rbox(...a);
  const BRASS = 0xd9b45a, CHROME = 0xd8dde3, ROPE = 0xd9c49a;
  function seg(b, a, c, r, col, n = 6, mat = 0) { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return;
    b.geo(new THREE.CylinderGeometry(r, r, L, n, 1, true), col, new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); }
  // triangles colorés, double face (voiles, fanions)
  function voile(b, pts, col, sh = .86) { const C = new THREE.Color(col), pos = [], nor = [], cl = [], u = new V3(), w = new V3();
    for (let i = 1; i + 1 < pts.length; i++) { const A = new V3(...pts[0]), B = new V3(...pts[i]), Cc = new V3(...pts[i + 1]), n = u.subVectors(B, A).cross(w.subVectors(Cc, A)).normalize().clone();
      for (const [P, s, k] of [[A, 1, 1], [B, 1, 1], [Cc, 1, 1], [A, -1, sh], [Cc, -1, sh], [B, -1, sh]]) { pos.push(P.x, P.y, P.z); nor.push(n.x * s, n.y * s, n.z * s); cl.push(C.r * k, C.g * k, C.b * k); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); b.parts[0].push(g); }
  // ---------- la coque : sections le long de x (tableau à −L/2, étrave à +L/2), forme en V arrondi ----------
  function coque(b, o) { const { L, W, D, F, sheer = .12, N = 18, K = 18, open = false, clinker = 0 } = o, C = o.cols, pos = [], col = [], idx = [], sec = [];
    const half = t => W / 2 * (t < .38 ? .8 + .2 * Math.sin(t / .38 * PI / 2) : Math.pow(Math.cos((t - .38) / .62 * PI / 2), .85)), top = t => F + sheer * t * t, keel = t => -D + (D + .12) * Math.pow(t, 4);
    const c3 = new THREE.Color(), colAt = y => { if (y < 0) return c3.set(C.bas); if (C.liston != null && Math.abs(y - (o.listonY || F - .05)) < .028) return c3.set(C.liston); if (C.botte != null && y < .05) return c3.set(C.botte);
      c3.set(C.coque); if (clinker) c3.multiplyScalar(.9 + .14 * (Math.floor((y + 1) / clinker) % 2)); return c3; };
    for (let i = 0; i <= N; i++) { const t = i / N, x = -L / 2 + t * L, w = half(t), y1 = top(t), y0 = keel(t), row = [];
      for (let k = 0; k <= K; k++) { const u = k / K * 2 - 1, y = y0 + (y1 - y0) * Math.pow(Math.abs(u), 1.7); row.push(pos.length / 3); pos.push(x, y, w * u); const c = colAt(y); col.push(c.r, c.g, c.b); } sec.push(row); }
    for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) { const a = sec[i][k], b2 = sec[i + 1][k], c = sec[i + 1][k + 1], d = sec[i][k + 1]; idx.push(a, c, d, a, b2, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const out = g.toNonIndexed(); b.parts[0].push(out);
    if (open) { const inn = out.clone(), p = inn.attributes.position, n = inn.attributes.normal, c = inn.attributes.color, ci = new THREE.Color(C.dedans || 0x9a6e44);
      for (let i = 0; i < p.count; i += 3) { const sw = (at) => { const t0 = [at.getX(i + 1), at.getY(i + 1), at.getZ(i + 1)]; at.setXYZ(i + 1, at.getX(i + 2), at.getY(i + 2), at.getZ(i + 2)); at.setXYZ(i + 2, ...t0); }; sw(p); sw(n); }
      for (let i = 0; i < n.count; i++) { n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); const k = .8 + .2 * (Math.floor((p.getY(i) + 1) / .07) % 2); c.setXYZ(i, ci.r * k, ci.g * k, ci.b * k); } b.parts[0].push(inn); }
    // tableau arrière
    const s0 = sec[0], tp = [], tc = []; for (let k = 0; k < K; k++) { const A = s0[k], B2 = s0[k + 1], P = i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], m = [-L / 2, top(0), 0];
      tp.push(...m, ...P(B2), ...P(A), ...m, ...P(A), ...P(B2)); const c = new THREE.Color(C.tableau || C.coque); for (let q = 0; q < 6; q++) tc.push(c.r, c.g, c.b); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3)); tg.computeVertexNormals(); b.parts[0].push(tg);
    // pont (ou petits pontages avant/arrière pour un bateau ouvert)
    for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; if (open && t0 > .12 && t1 < .86) continue; const x0 = -L / 2 + t0 * L, x1 = -L / 2 + t1 * L, w0 = half(t0) * .97, w1 = half(t1) * .97, y0 = top(t0) - .02, y1 = top(t1) - .02;
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, -w0, x0, y0, w0, x1, y1, w1, x0, y0, -w0, x1, y1, w1, x1, y1, -w1], 3)); pg.computeVertexNormals(); b.geo(pg, i % 2 ? C.pont : new THREE.Color(C.pont).multiplyScalar(.93).getHex(), b.M()); }
    if (open) { b.box(L * .72, .03, W * .55, C.dedans || 0x9a6e44, 0, -D * .45, 0); for (let k = -2; k <= 2; k++) b.box(L * .7, .012, .02, 0x6b4a2a, 0, -D * .45 + .02, k * .08); }
    // listons (plats-bords) le long de la coque
    for (const s of [-1, 1]) for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; seg(b, [-L / 2 + t0 * L, top(t0), s * half(t0)], [-L / 2 + t1 * L, top(t1), s * half(t1)], .022, C.plat || 0xf4f1e8, 5); }
    return { half, top, keel, L, W }; }
  const pare = (b, x, y, z) => { b.cyl(.045, .045, .16, 10, 0xf4f1ea, x, y, z, 0, 0, 0, 0, true); seg(b, [x, y + .08, z], [x, y + .2, z * .9], .006, ROPE, 4); };
  const bouee = (b, x, y, z, ry = 0) => { b.geo(new THREE.TorusGeometry(.1, .032, 8, 18), 0xff6a3a, b.M(x, y, z, 0, ry, 0), 0, true); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; b.box(.02, .07, .07, 0xffffff, x + Math.cos(a) * .1 * Math.cos(ry), y + Math.sin(a) * .1, z - Math.cos(a) * .1 * Math.sin(ry), 0, ry, a); } };
  const drapeau = (b, x, y, z, cols = [0x1f3f9a, 0xffffff, 0xe1262f]) => cols.forEach((c, k) => voile(b, [[x - .02 - k * .09, y, z], [x - .02 - (k + 1) * .09, y, z], [x - .02 - (k + 1) * .09, y - .13, z], [x - .02 - k * .09, y - .13, z]], c, .9));

  // 0 — voilier de plaisance (sloop) : coque blanche, liston marine, roof, mât, grand-voile, foc, haubans
  function voilier(b) { const H = coque(b, { L: 2.35, W: .86, D: .24, F: .28, sheer: .14, cols: { coque: 0xf7f5ef, bas: 0x8a2a2a, liston: 0x1f3a6b, pont: 0xc4935e, plat: 0xb88a5a, tableau: 0xf7f5ef }, listonY: .2 });
    rb(b, .78, .2, .46, .06, 0xf7f5ef, -.05, H.top(.45) + .08, 0); rb(b, .8, .03, .48, .02, 0xc4935e, -.05, H.top(.45) + .19, 0); for (const s of [-1, 1]) for (const x of [-.3, -.05, .2]) b.cyl(.035, .035, .02, 12, 0x2f5f8a, x, H.top(.45) + .1, s * .235, PI / 2, 0, 0, 1);
    b.box(.42, .02, .34, 0x8a5a34, -.78, H.top(.1) - .06, 0); for (const s of [-1, 1]) b.box(.42, .08, .05, 0xc4935e, -.78, H.top(.1) + .01, s * .18);
    seg(b, [-1.08, H.top(0) + .05, 0], [-.95, H.top(.05) + .3, 0], .012, 0x3a3a3a, 6); b.cyl(.06, .06, .02, 12, 0x2a2a2a, -.95, H.top(.05) + .3, 0, 0, 0, PI / 2);
    const mx = .22, my = H.top(.6), mt = my + 2.5; b.cyl(.028, .035, mt - my, 10, 0xe8eaed, mx, (my + mt) / 2, 0); seg(b, [mx, my + .5, 0], [-.95, my + .45, 0], .022, 0xe8eaed, 8);
    voile(b, [[mx - .03, my + .52, 0], [mx - .03, mt - .08, 0], [-.6, my + 1.4, .03], [-.92, my + .5, 0]], 0xfbfaf4); for (let k = 1; k < 4; k++) seg(b, [mx - .03, my + .52 + k * .48, .006], [-.92 + k * .2, my + .5 + k * .3, .02], .004, 0xd8d4c8, 3);
    voile(b, [[mx + .04, mt - .35, 0], [1.12, H.top(1) + .04, 0], [.45, my + .3, .06]], 0xf4f1e6); for (const s of [-1, 1]) { seg(b, [mx, mt - .3, 0], [mx - .05, my, s * H.half(.6)], .004, 0x9aa0a6, 3); seg(b, [mx, mt - .3, 0], [-.6, my, s * H.half(.3) * .9], .004, 0x9aa0a6, 3); }
    seg(b, [mx, mt, 0], [1.16, H.top(1) + .05, 0], .004, 0x9aa0a6, 3); seg(b, [mx, mt, 0], [-1.15, H.top(0) + .1, 0], .004, 0x9aa0a6, 3); drapeau(b, mx, mt + .12, 0); b.sph(.035, 0xffffff, mx, mt + .02, 0, 1, 1, 1, 1, 8, 6);
    for (const s of [-1, 1]) { for (const x of [-.6, .4]) pare(b, x, H.top(.4) - .14, s * (H.half(.4) + .05)); } bouee(b, -1.18, H.top(0) - .02, 0, PI / 2);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const t = .1 + i * .2, x = -1.175 + t * 2.35; seg(b, [x, H.top(t), s * H.half(t) * .95], [x, H.top(t) + .18, s * H.half(t) * .95], .007, CHROME, 4); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const t0 = .1 + i * .2, t1 = t0 + .2, a = -1.175 + t0 * 2.35, c = -1.175 + t1 * 2.35; seg(b, [a, H.top(t0) + .18, s * H.half(t0) * .95], [c, H.top(t1) + .18, s * H.half(t1) * .95], .006, CHROME, 4); } }
  // 1 — pointu marseillais : coque bleue à bandes blanche et rouge, haute étrave, antenne de voile latine roulée, filets, rames
  function pointu(b) { const H = coque(b, { L: 2.15, W: .82, D: .22, F: .3, sheer: .1, open: true, cols: { coque: 0x2f7aa8, bas: 0x3a2a20, liston: 0xffffff, pont: 0xb07a48, plat: 0xd8342c, dedans: 0xb98a58, tableau: 0x2f7aa8 }, listonY: .24 });
    for (const x of [-1.075, 1.075]) { seg(b, [x, H.top(x > 0 ? 1 : 0), 0], [x + (x > 0 ? .06 : -.03), H.top(x > 0 ? 1 : 0) + .3, 0], .03, 0xd8342c, 6); b.sph(.04, 0xd8342c, x + (x > 0 ? .06 : -.03), H.top(x > 0 ? 1 : 0) + .32, 0, 1, 1, 1, 0, 8, 6); }
    for (const x of [-.35, .3]) b.box(.16, .04, H.half(.5) * 1.9, 0xc4935e, x, .14, 0);
    seg(b, [.35, .1, 0], [.35, 1.05, 0], .025, 0x8a5a34, 8); seg(b, [-.75, .5, .05], [.95, 1.25, .05], .02, 0x8a5a34, 8); for (let k = 0; k < 6; k++) { const t = k / 5; b.sph(.05, 0xefe4c8, -.65 + t * 1.5, .55 + t * .66, .07, 1.6, .8, .8, 0, 8, 6); }
    b.jit(.25); for (let k = 0; k < 7; k++) b.blob(.08, 0, 0xc9a86a, -.65 + (k % 4) * .1, .06 + Math.floor(k / 4) * .07, (k % 3 - 1) * .1, 1.3, .6, 1); b.jit(0); for (let k = 0; k < 3; k++) b.sph(.05, 0xff7a2a, -.75 + k * .1, .16, .22 - k * .1, 1, 1, 1, 0, 8, 6);
    for (const s of [-1, 1]) { seg(b, [-.05, .3, s * .3], [.75, .26, s * .5], .015, 0xb07a48, 5); b.box(.18, .012, .07, 0xb07a48, .82, .25, s * .52, 0, 0, -.05); }
    b.cyl(.04, .05, .1, 8, 0x2a2a2a, -.95, H.top(0) + .05, 0); b.cyl(.035, .035, .1, 8, 0xfff1c8, -.95, H.top(0) + .15, 0, 0, 0, 0, 1); b.cone(.05, .06, 8, 0x2a2a2a, -.95, H.top(0) + .23, 0); }
  // 2 — canot automobile façon Riva : acajou verni à joints clairs, sièges de cuir crème, pare-brise chromé, pavillon
  function riva(b) { const H = coque(b, { L: 2.45, W: .84, D: .2, F: .26, sheer: .05, cols: { coque: 0x7a3418, bas: 0xece8de, liston: 0xe9e2d0, pont: 0x8a3c1c, plat: 0xd8dde3, tableau: 0x6b2c14 }, listonY: .07 });
    for (let k = -3; k <= 3; k++) { b.box(.9, .006, .012, 0xf2e8d6, .55, H.top(.8) - .005, k * .085); b.box(.55, .006, .012, 0xf2e8d6, -.88, H.top(.1) - .005, k * .085); }
    b.box(.95, .05, .62, 0x3a1e10, -.15, .12, 0); for (const x of [.12, -.42]) { rb(b, .3, .12, .64, .04, 0xefe2c4, x, .2, 0); rb(b, .08, .26, .64, .03, 0xefe2c4, x - .15, .32, 0, 0, 0, .2); }
    seg(b, [.33, H.top(.62), -.32], [.36, H.top(.62) + .2, 0], .008, CHROME, 5); seg(b, [.33, H.top(.62), .32], [.36, H.top(.62) + .2, 0], .008, CHROME, 5);
    voile(b, [[.33, H.top(.62), -.3], [.36, H.top(.62) + .19, 0], [.33, H.top(.62), .3]], 0xcfe8f5, 1);
    b.cyl(.09, .09, .015, 16, 0xf4f1ea, .22, .4, .15, 0, 0, PI / 2 - .5); seg(b, [.18, .26, .15], [.22, .4, .15], .01, CHROME, 5);
    for (const s of [-1, 1]) { b.box(.06, .02, .02, CHROME, .95, H.top(.88) + .01, s * .12); b.box(.06, .02, .02, CHROME, -1.0, H.top(.05) + .01, s * .25); }
    seg(b, [-1.18, H.top(0), 0], [-1.25, H.top(0) + .38, 0], .008, 0x5a3a20, 5); drapeau(b, -1.25, H.top(0) + .38, 0); b.sph(.03, 0xffffff, 1.0, H.top(.95) + .04, 0, 1, 1, 1, 1, 8, 6);
    for (const s of [-1, 1]) b.box(.03, .05, .06, 0xd8342c, .98, H.top(.92) + .015, s * .18, 0, 0, 0, 1); }
  // 3 — chalutier : coque rouge, timonerie blanche vitrée, mât et radar, portique arrière, filets et caisses de poisson
  function chalutier(b) { const H = coque(b, { L: 2.4, W: .92, D: .25, F: .34, sheer: .18, cols: { coque: 0xb3372d, bas: 0x1d1d1f, liston: 0xffffff, pont: 0x8d9298, plat: 0xffffff, tableau: 0xb3372d }, listonY: .3 });
    const x = -.2, y = H.top(.4); rb(b, .55, .5, .6, .05, 0xf6f4ee, x, y + .25, 0); rb(b, .62, .05, .66, .02, 0x2f5a7a, x, y + .52, 0);
    for (const s of [-1, 1]) for (const dx of [-.12, .12]) b.box(.18, .18, .02, 0x9fd0f0, x + dx, y + .34, s * .305); b.box(.02, .18, .44, 0x9fd0f0, x + .28, y + .34, 0); b.box(.02, .2, .2, 0xfff1c8, x - .28, y + .3, 0, 0, 0, 0, 1);
    seg(b, [x + .1, y + .55, 0], [x + .1, y + 1.45, 0], .022, 0xf6f4ee, 8); seg(b, [x + .1, y + 1.1, -.25], [x + .1, y + 1.1, .25], .012, 0xf6f4ee, 5); b.box(.3, .04, .06, 0x2a2d33, x + .1, y + 1.3, 0, 0, .6, 0); b.sph(.035, 0xffd23f, x + .1, y + 1.48, 0, 1, 1, 1, 1, 8, 6);
    for (const s of [-1, 1]) seg(b, [-.95, H.top(.05), s * .3], [-1.05, H.top(.05) + .75, s * .25], .02, 0xd8dde3, 6); seg(b, [-1.05, H.top(.05) + .75, -.25], [-1.05, H.top(.05) + .75, .25], .02, 0xd8dde3, 6);
    b.cyl(.13, .13, .4, 14, 0x3a6a8a, -.72, H.top(.2) + .1, 0, PI / 2, 0, 0); b.jit(.3); for (let k = 0; k < 6; k++) b.blob(.07, 0, 0x6a8a7a, -.75 + (k % 3) * .05, H.top(.2) + .1 - k * .03, (k % 2 - .5) * .3, 1, 1.6, 1); b.jit(0);
    for (let k = 0; k < 3; k++) { rb(b, .2, .1, .16, .015, 0x3a8acb, .45 + k * .22, H.top(.7) + .05, -.18); for (let f = 0; f < 3; f++) b.sph(.03, 0xb8c4cc, .4 + k * .22 + f * .05, H.top(.7) + .11, -.18, 2, .7, 1, 0, 6, 4); }
    for (const s of [-1, 1]) for (const t of [.25, .5, .72]) b.geo(new THREE.TorusGeometry(.07, .03, 6, 12), 0x1d1d1f, b.M(-1.2 + t * 2.4, H.top(t) - .12, s * (H.half(t) + .02), 0, 0, 0), 0, true);
    bouee(b, x, y + .3, .31, 0); b.sph(.06, 0xff7a2a, .95, H.top(.9) + .06, .1, 1, 1, 1, 0, 8, 6); }
  // 4 — barque à rames à clins : bois naturel, bancs, rames croisées, canne à pêche, seau
  function barque(b) { const H = coque(b, { L: 1.85, W: .8, D: .18, F: .26, sheer: .14, open: true, clinker: .055, cols: { coque: 0xb08050, bas: 0x4a3524, pont: 0xa87848, plat: 0x7a5232, dedans: 0xc49a68, tableau: 0xa87848 } });
    for (const x of [-.4, .25]) b.box(.16, .035, H.half(.5) * 1.85, 0x9a6e44, x, .14, 0); for (const s of [-1, 1]) { b.cyl(.015, .015, .08, 6, 0x6a6a6a, -.08, H.top(.45) + .03, s * H.half(.45)); }
    for (const s of [-1, 1]) { seg(b, [-.08, H.top(.45) + .04, s * H.half(.45)], [.75, .06, s * .12], .016, 0xc49a68, 6); b.box(.24, .012, .08, 0xc49a68, .82, .05, s * .1, 0, 0, -.1); }
    seg(b, [-.6, .1, -.15], [.6, .65, -.3], .007, 0x5a3a20, 4); seg(b, [.6, .65, -.3], [.7, .2, -.32], .002, 0xdddddd, 3); b.cyl(.06, .05, .12, 10, 0x9aa0a6, -.55, .1, .15); b.tor(.05, .006, 0x6a6a6a, -.55, .2, .15, 0, 0, PI / 2, 0, 10);
    b.geo(new THREE.TorusGeometry(.08, .018, 6, 14), ROPE, b.M(.62, H.top(.85) - .02, 0, PI / 2, 0, 0), 0, true); }
  const VAR = [voilier, pointu, riva, chalutier, barque];
  MD.boat = v => { const b = G.mb(500 + (v % 5)); VAR[(v % 5 + 5) % 5](b); return b.done(); };

  // chaque bateau reçoit son modèle (selon sa place) ; celui du ponton du capitaine reste le voilier
  const vary = m => { if (!m || !m.list) return; const pier = m.meta && m.meta.pier;
    const todo = [...m.list].filter(o => o.t === 'bateau' && o.v == null && !(pier && Math.hypot(o.x - pier.x, o.z - pier.z) < 5)).sort((a, b) => a.x + a.z * 1000 - b.x - b.z * 1000);
    todo.forEach((o, k) => { o.v = (k + Math.floor(G.hash2(m.W, m.H, 41) * 5)) % 5; try { m.refresh(o); } catch (e) { } }); }; // les bateaux voisins ne se ressemblent jamais
  G.on('load', () => vary(G.world)); G.on('newGame', () => vary(G.world)); G.on('enterMap', m => vary(m));
})();
