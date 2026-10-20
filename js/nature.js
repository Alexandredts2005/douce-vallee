'use strict';
// ===== Nature premium : fleurs réalistes (tulipes et pensées refaites + 11 espèces : roses, marguerites, tournesols, lys,
// coquelicots, jacinthes, iris, lavande, cosmos, muguet, dahlias), prairies fleuries ; nuages volumétriques faits de
// centaines de bouffées éclairées par le soleil (liseré argenté à contre-jour, ventre gris, couchers de soleil roses). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, PI = Math.PI;
  const SK = () => G.SK || {};
  const STEM = 0x3f8a3a, LEAF = 0x4a9a40, LEAF2 = 0x5aae4a;
  const C = c => new THREE.Color(c), dark = (c, k = .75) => C(c).multiplyScalar(k).getHex(), light = (c, k = .3) => C(c).lerp(C(0xffffff), k).getHex();
  // ---------- pièces de base (peu de triangles : on en pose des centaines) ----------
  const E = (b, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, seg = 8) => b.add(new THREE.SphereGeometry(1, seg, Math.max(5, seg - 2)), col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), 0, true);
  const QQ = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0), VV = new THREE.Vector3(), PV = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  const stem = (b, x0, y0, z0, x1, y1, z1, r = .012, col = STEM) => { VV.set(x1 - x0, y1 - y0, z1 - z0); const L = VV.length() || .01; VV.divideScalar(L); QQ.setFromUnitVectors(YA, VV); PV.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    b.S(SK().leaf); b.add(new THREE.CylinderGeometry(r * .75, r, L, 6), col, new THREE.Matrix4().compose(PV, QQ, S1), 0, true); };
  // pétale attaché au rayon r, tourné vers l'extérieur (angle a), penché de tilt depuis la verticale (π/2 : à plat, plus : retombant)
  const pet = (b, col, cx, cy, cz, a, r, wide, len, thin, tilt, seg = 7) => { const d = r + Math.sin(tilt) * len; E(b, col, cx + Math.cos(a) * d, cy + Math.cos(tilt) * len, cz + Math.sin(a) * d, wide, len, thin, tilt, PI / 2 - a, 0, seg); };
  // feuille en lame dressée, qui se courbe vers l'extérieur
  const blade = (b, x, z, a, len, wid, tilt = .5, col = LEAF) => { b.S(SK().leaf); pet(b, col, x, 0, z, a, 0, wid, len * .3, wid * .16, tilt * .35); const t2 = tilt + .35, bx = x + Math.cos(a) * Math.sin(tilt * .35) * len * .6, bz = z + Math.sin(a) * Math.sin(tilt * .35) * len * .6; pet(b, dark(col, .92), bx, Math.cos(tilt * .35) * len * .58, bz, a, 0, wid * .85, len * .25, wid * .14, t2); };
  // feuille posée qui s'étale (presque à plat)
  const leafAt = (b, x, y, z, a, len, wid, droop = .9, col = LEAF) => { b.S(SK().leaf); pet(b, col, x, y, z, a, 0, wid, len * .5, wid * .14, PI / 2 + droop * .25 - .25); };
  // ===================== fleurs existantes refaites =====================
  MD.tulip = v => { const b = G.mb(22 + v), c = G.FLOWCOL[v % 7], cd = dark(c, .84), sk = SK();
    for (const [dx, dz, h, ry] of [[-.09, .02, .46, .3], [.12, .07, .38, 1.4], [.0, -.13, .42, 2.5]]) {
      stem(b, dx * .6, 0, dz * .6, dx, h, dz, .011);
      b.S(sk.leaf); E(b, 0x2f6a2a, dx, h + .006, dz, .02, .016, .02);
      b.S(sk.petal); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + ry, inner = k % 2; pet(b, inner ? c : cd, dx, h, dz, a, inner ? .008 : .012, inner ? .028 : .032, .042, .009, inner ? .12 : .24); } }
    blade(b, -.06, .05, .4, .5, .045, .55); blade(b, .08, -.04, 3.3, .46, .045, .5); blade(b, .03, .1, 1.9, .4, .04, .6);
    return b.done(); };
  MD.tulip_lod = v => { const b = G.mb(22 + v), c = G.FLOWCOL[v % 7]; for (const [dx, dz, h] of [[-.09, .02, .46], [.12, .07, .38], [0, -.13, .42]]) { stem(b, dx * .6, 0, dz * .6, dx, h, dz, .011); b.S(SK().petal); E(b, c, dx, h + .045, dz, .035, .05, .035, 0, 0, 0, 6); } b.S(null); return b.done(); };
  MD.flower = v => { const b = G.mb(30 + v), c = G.FLOWCOL[v % 7], sk = SK(), blot = v === 2 ? 0x6a4aa8 : v === 3 ? 0xb03a6a : dark(c, .35), t = -.65, ct = Math.cos(t), st = Math.sin(t);
    for (const [dx, dz, h] of [[0, 0, .24], [-.17, .1, .2], [.16, .08, .22], [.04, -.16, .19]]) {
      stem(b, dx * .7, 0, dz * .7, dx, h, dz, .008);
      const fy = h + .03, P = (ox, oy, sx, sy, col, z = 0) => E(b, col, dx + ox, fy + oy * ct, dz - oy * st + .01 + z, sx, sy, .01, -t, 0, 0, 8);
      b.S(sk.petal); P(-.028, .032, .036, .04, c); P(.028, .032, .036, .04, c); P(-.04, -.006, .032, .03, c, .004); P(.04, -.006, .032, .03, c, .004); P(0, -.028, .04, .034, c, .008);
      b.S(null); P(0, -.004, .022, .018, blot, .012); b.S(sk.petal); E(b, v === 1 ? 0xff9f1a : 0xffd84a, dx, fy, dz + .025, .008, .008, .006, 0, 0, 0, 6); }
    for (let i = 0; i < 6; i++) leafAt(b, 0, .03, 0, i / 6 * TAU + .3, .17, .07, .6, i % 2 ? LEAF : LEAF2);
    return b.done(); };
  MD.flower_lod = v => { const b = G.mb(30 + v), c = G.FLOWCOL[v % 7]; b.S(SK().leaf); E(b, LEAF, 0, .05, 0, .18, .05, .18, 0, 0, 0, 6); b.S(SK().petal); for (const [dx, dz, h] of [[0, 0, .24], [-.17, .1, .2], [.16, .08, .22]]) E(b, c, dx, h + .03, dz + .01, .055, .05, .025, .65, 0, 0, 6); return b.done(); };
  // ===================== nouvelles espèces =====================
  const SP = {};
  const def = (id, n, cols, build, h = .5) => { SP[id] = { n, cols, build, h }; MD['fl_' + id] = v => { const b = G.mb(900 + Object.keys(SP).indexOf(id) * 10 + v); build(b, cols[v % cols.length][1], v); return b.done(); }; };
  def('rose', 'Rose', [['rouge', 0xc81f35], ['rose', 0xf28ab0], ['blanche', 0xfaf3ee], ['jaune', 0xffd84a], ['orange', 0xff8a3a]], (b, c) => { const sk = SK();
    for (const [dx, dz, h] of [[0, 0, .55], [-.14, .08, .45], [.13, -.06, .4]]) { stem(b, dx * .5, 0, dz * .5, dx, h, dz, .011, 0x356a2c);
      for (let i = 0; i < 3; i++) leafAt(b, dx * (.4 + i * .2), h * (.3 + i * .2), dz * (.4 + i * .2), i * 2.1 + dx * 9, .1, .05, .5, 0x2f6a2a);
      b.S(sk.leaf); for (let k = 0; k < 5; k++) pet(b, 0x2f6a2a, dx, h, dz, k / 5 * TAU, .006, .007, .016, .004, 2.2);
      b.S(sk.petal); E(b, dark(c, .78), dx, h + .03, dz, .016, .026, .016);
      for (let L = 0; L < 3; L++) for (let k = 0; k < 5; k++) pet(b, L === 2 ? light(c, .06) : c, dx, h + .01, dz, k / 5 * TAU + L * 1.26, .006 + L * .006, .022 + L * .005, .024 + L * .003, .007, .2 + L * .38); } }, .65);
  def('marguerite', 'Marguerite', [['blanche', 0xfaf8f2], ['jaune', 0xffd23f]], (b, c) => { const sk = SK();
    for (const [dx, dz, h] of [[0, 0, .45], [-.15, .1, .38], [.14, -.08, .41], [.06, .15, .33]]) { stem(b, dx * .6, 0, dz * .6, dx, h, dz, .007);
      b.S(sk.petal); for (let k = 0; k < 14; k++) pet(b, c, dx, h, dz, k / 14 * TAU, .012, .008, .022, .003, 1.45);
      E(b, c === 0xffd23f ? 0x5a3214 : 0xffc71a, dx, h + .006, dz, .016, .01, .016, 0, 0, 0, 8); }
    for (let i = 0; i < 7; i++) leafAt(b, 0, .02, 0, i / 7 * TAU, .12, .035, .7, LEAF2); }, .5);
  def('tournesol', 'Tournesol', [['jaune', 0xffc21a]], (b, c) => { const sk = SK();
    stem(b, 0, 0, 0, .02, 1.25, .03, .028, 0x4a8a30); for (let i = 0; i < 5; i++) leafAt(b, 0, .25 + i * .2, 0, i * 2.3, .26, .1, .4, i % 2 ? LEAF : LEAF2);
    const hy = 1.3; b.S(sk.leaf); E(b, 0x3a6a2a, .02, hy - .02, .03, .13, .03, .13, 0, 0, 0, 12); b.S(sk.wood); E(b, 0x4a2a12, .02, hy, .03, .12, .035, .12, 0, 0, 0, 14);
    b.S(sk.petal); for (let L = 0; L < 2; L++) for (let k = 0; k < 20; k++) pet(b, L ? light(c, .1) : c, .02, hy, .03, k / 20 * TAU + L * .16, .11 + L * .01, .022, .045, .006, 1.4 - L * .2); }, 1.4);
  def('lys', 'Lys', [['blanc', 0xfbf6ee], ['rose', 0xf6a0b8], ['orange', 0xff9a3c]], (b, c) => { const sk = SK();
    stem(b, 0, 0, 0, 0, .7, 0, .012); for (let i = 0; i < 8; i++) leafAt(b, 0, .1 + i * .07, 0, i * 2.4, .16, .03, .2, LEAF);
    for (const [a, y] of [[0, .74], [2.2, .66], [4.3, .7]]) { const fx = Math.cos(a) * .08, fz = Math.sin(a) * .08; stem(b, 0, y - .1, 0, fx, y, fz, .007);
      b.S(sk.petal); for (let k = 0; k < 6; k++) pet(b, k % 2 ? c : light(c, .15), fx, y, fz, k / 6 * TAU + a, .008, .018, .045, .006, 1.0);
      for (let k = 0; k < 5; k++) { const pa = k / 5 * TAU; stem(b, fx, y, fz, fx + Math.cos(pa) * .02, y + .06, fz + Math.sin(pa) * .02, .002, 0xd8e8a0); b.S(null); E(b, 0xc8501a, fx + Math.cos(pa) * .02, y + .062, fz + Math.sin(pa) * .02, .006, .009, .004, 0, 0, 0, 6); } } }, .85);
  def('coquelicot', 'Coquelicot', [['rouge', 0xe0201a]], (b, c) => { const sk = SK();
    for (const [dx, dz, h] of [[0, 0, .5], [-.13, .09, .4], [.14, .02, .46], [.03, -.14, .36]]) { stem(b, dx * .3, 0, dz * .3, dx, h, dz, .006, 0x4f8a3a);
      b.S(sk.petal); for (let k = 0; k < 4; k++) pet(b, k % 2 ? c : dark(c, .9), dx, h, dz, k / 4 * TAU + dx * 7, .006, .042, .036, .008, .65, 8);
      b.S(null); E(b, 0x1a1414, dx, h + .018, dz, .014, .01, .014); b.S(sk.leaf); E(b, 0x5a7a3a, dx, h + .028, dz, .009, .008, .009, 0, 0, 0, 6); }
    for (let i = 0; i < 6; i++) leafAt(b, 0, .02, 0, i / 6 * TAU + .4, .12, .05, .5, 0x5a8a3a); }, .55);
  def('jacinthe', 'Jacinthe', [['bleue', 0x5a6ad8], ['rose', 0xf28ab8], ['blanche', 0xf6f2fa], ['violette', 0x8a4ac8]], (b, c) => { const sk = SK();
    for (const [dx, dz] of [[0, 0], [.13, .06]]) { stem(b, dx, 0, dz, dx, .32, dz, .014); b.S(sk.petal);
      for (let i = 0; i < 26; i++) { const y = .16 + (i / 26) * .18, a = i * 2.4, r = .038 - (i / 26) * .015; pet(b, i % 3 ? c : light(c, .2), dx, y, dz, a, r * .5, .012, .014, .01, 1.6, 6); } }
    for (let i = 0; i < 6; i++) blade(b, 0, 0, i / 6 * TAU, .26, .03, .7, LEAF2); }, .4);
  def('iris', 'Iris', [['violet', 0x6a3ac0], ['bleu', 0x4a6ad8], ['jaune', 0xffd23f]], (b, c) => { const sk = SK();
    for (const [dx, dz, h] of [[0, 0, .6], [.12, .07, .5]]) { stem(b, dx, 0, dz, dx, h, dz, .01); b.S(sk.petal);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + dx * 5; pet(b, light(c, .12), dx, h, dz, a, .005, .02, .04, .007, .25); pet(b, c, dx, h, dz, a + PI / 3, .01, .024, .045, .007, 1.85); pet(b, 0xffc21a, dx, h + .004, dz, a + PI / 3, .012, .005, .018, .004, 1.75, 5); } }
    for (let i = 0; i < 6; i++) blade(b, Math.cos(i) * .03, Math.sin(i) * .03, i * 1.05, .5, .022, .2, i % 2 ? 0x4a8a5a : 0x5a9a6a); }, .7);
  def('lavande', 'Lavande', [['violette', 0x8a6ad8]], (b, c) => { const sk = SK();
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = .03 + (i % 4) * .03, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .34 + (i % 3) * .06, tx = x * 2.2, tz = z * 2.2; stem(b, x, 0, z, tx, h, tz, .004, 0x7a9a7a);
      b.S(sk.petal); for (let k = 0; k < 6; k++) E(b, k % 2 ? c : dark(c, .85), tx * (1 + k * .02), h + k * .022, tz * (1 + k * .02), .012, .016, .012, 0, 0, 0, 6); }
    for (let i = 0; i < 10; i++) leafAt(b, 0, .03, 0, i / 10 * TAU, .1, .02, 1.1, 0x8aa88a); }, .5);
  def('cosmos', 'Cosmos', [['rose', 0xf27ab8], ['blanc', 0xfaf6f8], ['pourpre', 0xc0287a]], (b, c) => { const sk = SK();
    for (const [dx, dz, h] of [[0, 0, .62], [-.15, .06, .52], [.13, -.1, .56]]) { stem(b, dx * .4, 0, dz * .4, dx, h, dz, .005);
      b.S(sk.petal); for (let k = 0; k < 8; k++) pet(b, c, dx, h, dz, k / 8 * TAU, .01, .016, .026, .005, 1.35); E(b, 0xffc21a, dx, h + .006, dz, .013, .009, .013, 0, 0, 0, 7); }
    for (let i = 0; i < 12; i++) { const a = i * 2.1; stem(b, 0, .1 + (i % 4) * .05, 0, Math.cos(a) * .1, .18 + (i % 4) * .06, Math.sin(a) * .1, .003, LEAF2); } }, .7);
  def('muguet', 'Muguet', [['blanc', 0xfbfbf4]], (b, c) => { const sk = SK();
    for (const a of [.4, 2.6]) { b.S(sk.leaf); pet(b, LEAF, 0, 0, 0, a, .01, .05, .15, .01, .25, 8); }
    stem(b, 0, 0, 0, .03, .28, .02, .005); for (let i = 0; i < 7; i++) { const t = i / 6, x = .03 + t * .1, y = .28 - t * t * .1, z = .02; stem(b, x, y, z, x, y - .03, z, .002); b.S(sk.petal); E(b, c, x, y - .04, z, .015, .016, .015, 0, 0, 0, 7); } }, .3);
  def('dahlia', 'Dahlia', [['rouge', 0xc81f3a], ['orange', 0xff7a2a], ['rose', 0xf27ab0], ['jaune', 0xffcf3a]], (b, c) => { const sk = SK();
    stem(b, 0, 0, 0, 0, .55, 0, .013); for (let i = 0; i < 6; i++) leafAt(b, 0, .12 + i * .06, 0, i * 2.3, .14, .06, .5, LEAF);
    b.S(sk.petal); for (let L = 0; L < 4; L++) { const n = 6 + L * 4; for (let k = 0; k < n; k++) pet(b, L % 2 ? c : light(c, .1), 0, .58, 0, k / n * TAU + L, .006 + L * .016, .014 + L * .002, .018, .008, .3 + L * .38, 6); } }, .65);
  for (const id in SP) { const s = SP[id]; s.cols.forEach(([cn, col], v) => { const oid = id + '_' + cn; if (O[oid]) return;
    O[oid] = { id: oid, n: s.n + (s.cols.length > 1 ? ' ' + cn : ''), model: 'fl_' + id, v, fp: [1, 1], h: 0, pick: oid, water: 1 };
    G.ITEMS[oid] = { id: oid, n: O[oid].n, stack: 99, sell: 90, kind: 'place', obj: oid, cat: 'fleurs', thumb: 'obj:' + oid }; if (G.SHOPLIST && v === 0) G.SHOPLIST.push(oid); }); }
  G.FLOWER_SPECIES = SP;
  // ---------- prairies fleuries : quelques massifs sauvages par acre à la création du monde ----------
  G.on('worldgen', (map, ctx) => { if (!ctx || !ctx.layout || map !== map) return; const r = G.rng((ctx.seed || 1) + 777), W = map.W, A = G.ACRE, B = G.BORDER;
    const WILD = ['coquelicot_rouge', 'marguerite_blanche', 'cosmos_rose', 'cosmos_blanc', 'lavande_violette', 'marguerite_jaune', 'jacinthe_bleue', 'muguet_blanc', 'iris_violet'];
    for (let az = 0; az < ctx.layout.length; az++) for (let ax = 0; ax < ctx.layout[0].length; ax++) { const id = ctx.layout[az][ax], a = G.ACRES[id]; if (!a || a.water || a.beach || a.struct) continue;
      const n = id === 'jardin' ? 4 : id === 'plaine' || id === 'verger' || id === 'colline' ? 2 : 1;
      for (let k = 0; k < n; k++) { const t = WILD[Math.floor(r() * WILD.length)], cx = B + ax * A + 2 + Math.floor(r() * (A - 4)), cz = B + az * A + 2 + Math.floor(r() * (A - 4));
        for (let j = 0; j < 7; j++) { const x = cx + Math.floor(r() * 4) - 1, z = cz + Math.floor(r() * 3) - 1; if (!map.inb(x, z)) continue; const i = map.idx(x, z); if (map.water[i] || map.ramp[i] || G.SURF[map.surf[i]].path) continue; if (map.canPlace(t, x, z)) map.addObj(t, x, z); } } } });

  // ===================== NUAGES VOLUMÉTRIQUES =====================
  const CL = { n: 0, mesh: null, puffs: [], clouds: [] };
  const CVS = `uniform float uCurve; uniform vec3 uCC; uniform vec2 uCF; attribute vec3 iPos; attribute vec4 iDat; varying vec2 vUv; varying vec4 vDat; varying vec3 vWP;
void main() { vUv = uv; vDat = iDat; vec3 r = vec3( viewMatrix[ 0 ][ 0 ], viewMatrix[ 1 ][ 0 ], viewMatrix[ 2 ][ 0 ] ), u = vec3( viewMatrix[ 0 ][ 1 ], viewMatrix[ 1 ][ 1 ], viewMatrix[ 2 ][ 1 ] );
  vec3 wp = iPos + ( r * position.x + u * position.y ) * iDat.x; vWP = wp; vec2 cd = wp.xz - uCC.xz; float ca = dot( cd, uCF ), cl = cd.x * uCF.y - cd.y * uCF.x; wp.y -= uCurve * ( ca * ca + .3 * cl * cl ) * .6;
  gl_Position = projectionMatrix * viewMatrix * vec4( wp, 1. ); }`;
  const CFS = `uniform vec3 uSunDir, uSunCol, uTop, uHor; uniform float uNight, uTime, uFade, uCine; varying vec2 vUv; varying vec4 vDat; varying vec3 vWP;
float h( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
float n( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3. - 2. * f ); return mix( mix( h( i ), h( i + vec2( 1., 0. ) ), f.x ), mix( h( i + vec2( 0., 1. ) ), h( i + vec2( 1., 1. ) ), f.x ), f.y ); }
void main() {
  vec2 p = vUv * 2. - 1.; float d = length( p ); if ( d > 1. ) discard;
  float fb = n( vUv * 4. + vDat.w * 13. + uTime * .02 ) * .5 + n( vUv * 9. - vDat.w * 7. ) * .3 + n( vUv * 18. ) * .2;
  float a = smoothstep( 1., .35, d + ( fb - .5 ) * .55 );
  if ( a < .01 ) discard;
  // relief de la bouffée : normale bombée vers la caméra + position dans le nuage (vDat.y : haut/bas, vDat.z : vers le soleil)
  float lit = clamp( vDat.z * .55 + .5 + ( -p.y * .25 ) + ( fb - .5 ) * .35, 0., 1. ), up = clamp( vDat.y, 0., 1. );
  vec3 V = normalize( cameraPosition - vWP ); float fwd = pow( max( dot( -V, uSunDir ), 0. ), 6. );
  vec3 sun = uSunCol * ( 1. - uNight * .85 ), sky = mix( uHor, uTop, .35 );
  float sh = clamp( up * .65 + lit * .5, 0., 1. );
  vec3 shadowC = mix( sky, vec3( .62, .66, .74 ), .55 ) * .86, litC = vec3( 1.02, 1.0, .98 ) * mix( vec3( 1. ), sun, .45 ) * 1.18;
  shadowC = mix( shadowC, mix( uTop * vec3( .72, .68, .88 ), uHor * vec3( .8, .72, .76 ), .5 ), uCine * .65 ); litC = mix( litC, sun * vec3( 1.3, 1.08, .86 ) * 1.4, uCine * .75 ); // shader cinéma : ventres gris mauve, sommets dorés
  vec3 col = mix( shadowC, litC, smoothstep( .1, .95, sh ) ) + sun * fwd * ( 1. - a ) * ( 1.4 + uCine * .5 );
  col = mix( col, col * vec3( .22, .25, .38 ), uNight * .8 );
  gl_FragColor = vec4( col, a * .92 * uFade );
}`;
  function buildClouds(scene) {
    const N = 24, per = 28, total = N * per, g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(2, 2);
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
    const iPos = new Float32Array(total * 3), iDat = new Float32Array(total * 4); g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 4).setUsage(THREE.DynamicDrawUsage)); g.instanceCount = total;
    const SU = G.SU || {}, mat = new THREE.ShaderMaterial({ vertexShader: CVS, fragmentShader: CFS, transparent: true, depthWrite: false, fog: false,
      uniforms: { uCurve: G.U.curve, uCC: G.U.cc, uCF: G.U.cf, uSunDir: SU.uSunDir || { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: SU.uTime || { value: 0 }, uFade: { value: 1 }, uCine: SU.uCine || { value: 0 } } });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -5; scene.add(mesh);
    const r = G.rng(808); CL.clouds = [];
    for (let c = 0; c < N; c++) { const sx = 16 + r() * 18, sz = 9 + r() * 10, sy = 5 + r() * 5, cl = { x: r(), z: r(), y: 52 + r() * 26, s: .5 + r() * .8, puffs: [] };
      for (let k = 0; k < per; k++) { const a = r() * TAU, rr = Math.sqrt(r()), ox = Math.cos(a) * rr * sx, oz = Math.sin(a) * rr * sz, top = 1 - rr * .7, oy = (r() * .9 + .1) * sy * top - sy * .15;
        cl.puffs.push({ ox, oy, oz, size: (5.5 + r() * 6) * (.7 + top * .5), up: (oy / sy) + .3, seed: r() }); }
      CL.clouds.push(cl); }
    CL.mesh = mesh; CL.iPos = iPos; CL.iDat = iDat; CL.g = g; CL.order = new Array(total).fill(0).map((_, i) => i); CL.tmp = new Float32Array(total);
  }
  const V3 = new THREE.Vector3();
  G.on('init', scene => { buildClouds(scene); if (G.M.cloud) G.M.cloud.visible = false; });
  G.on('frame', dt => {
    if (!CL.mesh) return; const m = G.map, inside = !!(m && m.interior), si = G.skyInfo, L = G.lights; CL.mesh.visible = !inside && G.settings.quality !== 'low'; if (!CL.mesh.visible || !si || !L) return;
    // très grand monde : les nuages suivent la caméra dans une fenêtre qui se répète (même densité que sur l'ancienne carte)
    const vast = G.world && G.world.W * G.world.H > 90000, u = CL.mesh.material.uniforms, W = vast ? 620 : (G.world && G.world.W || 200) + 260, H = vast ? 330 : (G.world && G.world.H || 120) + 220, cam = G.camera.position, n = si.n || 0, wind = G.weather && G.weather.wind != null ? G.weather.wind : 1;
    u.uSunCol.value.copy(L.sun.color).multiplyScalar(.75 + .25 * Math.min(1, L.sun.intensity)); u.uTop.value.copy(si.top); u.uHor.value.copy(si.hor); u.uNight.value = n; u.uFade.value = G.weather && G.weather.cover != null ? .55 + .45 * G.weather.cover : 1;
    const toSun = V3.copy(L.sun.position).sub(L.sun.target.position).normalize(); let k = 0;
    for (const cl of CL.clouds) { cl.x = (cl.x + dt * cl.s * .0012 * wind) % 1; let cx = -130 + cl.x * W, cz = -110 + cl.z * H;
      if (vast) { cx = cam.x - W / 2 + (((cl.x * W - cam.x + W / 2) % W) + W) % W; cz = cam.z - H / 2 + (((cl.z * H - cam.z + H / 2) % H) + H) % H; }
      for (const pf of cl.puffs) { const x = cx + pf.ox, y = cl.y + pf.oy, z = cz + pf.oz; CL.iPos[k * 3] = x; CL.iPos[k * 3 + 1] = y; CL.iPos[k * 3 + 2] = z; const len = Math.hypot(pf.ox, pf.oy, pf.oz) || 1;
        CL.iDat[k * 4] = pf.size; CL.iDat[k * 4 + 1] = pf.up; CL.iDat[k * 4 + 2] = (pf.ox * toSun.x + pf.oy * toSun.y + pf.oz * toSun.z) / len; CL.iDat[k * 4 + 3] = pf.seed; CL.tmp[k] = (x - cam.x) ** 2 + (y - cam.y) ** 2 + (z - cam.z) ** 2; k++; } }
    // de l'arrière vers l'avant (transparence correcte)
    const ord = CL.order; ord.sort((a, b) => CL.tmp[b] - CL.tmp[a]); const P = CL.iPos.slice(), Dd = CL.iDat.slice();
    for (let i = 0; i < ord.length; i++) { const j = ord[i]; CL.iPos[i * 3] = P[j * 3]; CL.iPos[i * 3 + 1] = P[j * 3 + 1]; CL.iPos[i * 3 + 2] = P[j * 3 + 2]; for (let q = 0; q < 4; q++) CL.iDat[i * 4 + q] = Dd[j * 4 + q]; }
    CL.g.attributes.iPos.needsUpdate = true; CL.g.attributes.iDat.needsUpdate = true;
  });
})();
