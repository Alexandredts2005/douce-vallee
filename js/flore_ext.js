'use strict';
// ===== Flore d'extérieur : 20 espèces de plus, chacune dessinée pour elle-même (pas des boules recolorées) :
// massette, herbe de la pampa, lupin, digitale, rose trémière, pied-d'alouette, agapanthe, allium géant, hosta, capucine,
// chardon, pissenlit, myosotis, bruyère, échinacée, nénuphar (sur l'eau), papyrus, oiseau de paradis, cœur-de-Marie, cyprès.
// Les sauvages poussent d'elles-mêmes à la création du monde : pissenlits et myosotis dans les prés, digitales en forêt,
// bruyère et chardons sur les collines, massettes et papyrus au bord de l'eau, nénuphars sur les étangs et les lacs. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2;
  const SK = () => G.SK || {};
  const C = c => new THREE.Color(c), dark = (c, k = .75) => C(c).multiplyScalar(k).getHex(), light = (c, k = .3) => C(c).lerp(C(0xffffff), k).getHex();
  const STEM = 0x3f8a3a, LEAF = 0x4a9a40, LEAF2 = 0x5aae4a, LEAFD = 0x2f6f32;
  // ---------- pièces de base ----------
  let SEG = 6; // finesse des sphères (moins loin de la caméra)
  const E = (b, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, seg = SEG, mat = 0) => (seg = SEG < 6 ? Math.min(seg, 4) : seg, b.add(new THREE.SphereGeometry(1, seg, Math.max(3, seg - 2)), col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), mat, true));
  const QQ = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0), VV = new THREE.Vector3(), PV = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  const stem = (b, x0, y0, z0, x1, y1, z1, r = .012, col = STEM, seg = SEG < 6 ? 3 : 5) => { VV.set(x1 - x0, y1 - y0, z1 - z0); const L = VV.length() || .01; VV.divideScalar(L); QQ.setFromUnitVectors(YA, VV); PV.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    b.S(SK().leaf); b.add(new THREE.CylinderGeometry(r * .75, r, L, seg), col, new THREE.Matrix4().compose(PV, QQ, S1), 0, true); };
  // pétale (ou feuille) qui part du rayon r, tourné vers l'extérieur (angle a), penché de tilt depuis la verticale (π/2 : à plat, plus : retombant)
  const pet = (b, col, cx, cy, cz, a, r, wide, len, thin, tilt, seg = Math.max(4, SEG - 1)) => { const d = r + Math.sin(tilt) * len; E(b, col, cx + Math.cos(a) * d, cy + Math.cos(tilt) * len, cz + Math.sin(a) * d, wide, len, thin, tilt, PI / 2 - a, 0, seg); };
  // longue feuille en lame, dressée puis courbée vers l'extérieur
  const blade = (b, x, z, a, len, wid, tilt = .5, col = LEAF) => { b.S(SK().leaf); pet(b, col, x, 0, z, a, 0, wid, len * .3, wid * .16, tilt * .35); const t2 = tilt + .35, bx = x + Math.cos(a) * Math.sin(tilt * .35) * len * .6, bz = z + Math.sin(a) * Math.sin(tilt * .35) * len * .6;
    pet(b, dark(col, .92), bx, Math.cos(tilt * .35) * len * .58, bz, a, 0, wid * .85, len * .25, wid * .14, t2); };
  // disque tourné vers l'extérieur (angle a), un peu levé (up) : fleur vue de face
  const disc = (b, col, x, y, z, a, rad, th, up = 0, seg = SEG + 2) => E(b, col, x, y, z, rad, rad, th, -up, PI / 2 - a, 0, seg);
  // une tige qui s'arque : n points de (x0,0,z0) vers le haut puis en retombant vers l'extérieur (angle a)
  const arch = (b, x0, z0, a, h, reach, n, r = .007, col = STEM) => { const P = []; for (let i = 0; i <= n; i++) { const t = i / n, out = reach * t, y = h * Math.sin(t * PI * .8); P.push([x0 + Math.cos(a) * out, y, z0 + Math.sin(a) * out]); }
    for (let i = 0; i < n; i++) stem(b, ...P[i], ...P[i + 1], r * (1 - i / n * .4), col, 5); return P; };
  const N = (n, q) => Math.max(1, Math.round(n * q));
  // petite épine (pyramide à 4 faces : 8 triangles)
  const spine = (b, r, h, col, x, y, z, rx = 0, ry = 0, rz = 0) => b.add(new THREE.ConeGeometry(r, h, 4), col, b.M(x, y, z, rx, ry, rz), 0, false);

  // ---------- les espèces : [id, nom, hauteur de collision, prix, options, dessin (b, r, q) — q : 1 de près, ~0,35 au loin] ----------
  const SPEC = [];
  const sp = (id, n, h, sell, o, f) => SPEC.push({ id, n, h, sell, o: o || {}, f });

  // massette (quenouille) : lames dressées et épis bruns veloutés
  sp('massette', 'Massette', 1.1, 160, { wet: 1 }, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(16, q); i++) { const a = r() * TAU, d = r() * .1; blade(b, Math.cos(a) * d, Math.sin(a) * d, a, 1.15 + r() * .45, .035, .15 + r() * .3, i % 2 ? LEAF : 0x5f9a48); }
    for (let i = 0; i < N(5, q); i++) { const a = i * 2.4 + r(), d = .05 + r() * .08, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.3 + r() * .35, lx = x + Math.cos(a) * .08, lz = z + Math.sin(a) * .08;
      stem(b, x, 0, z, lx, h, lz, .008, 0x6a8a48); b.S(sk.fabric); b.add(new THREE.CylinderGeometry(.034, .036, .24, 9), 0x6a3f22, b.M(lx - Math.cos(a) * .012, h - .2, lz - Math.sin(a) * .012, Math.cos(a) * .05, 0, -Math.sin(a) * .05), 0, true);
      E(b, 0x6a3f22, lx - Math.cos(a) * .012, h - .08, lz - Math.sin(a) * .012, .034, .02, .034); E(b, 0x6a3f22, lx - Math.cos(a) * .012, h - .32, lz - Math.sin(a) * .012, .036, .02, .036); stem(b, lx, h - .07, lz, lx, h + .12, lz, .004, 0x8a7a50); } b.S(null); });

  // herbe de la pampa : grande fontaine de feuilles fines et plumets crème
  sp('pampa', 'Herbe de la pampa', 1.6, 220, {}, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(34, q); i++) { const a = r() * TAU, d = r() * .14; blade(b, Math.cos(a) * d, Math.sin(a) * d, a, .9 + r() * .5, .022, .5 + r() * .9, i % 3 ? 0x7a9a5a : 0x9aaa6a); }
    for (let i = 0; i < N(8, q); i++) { const a = r() * TAU, d = .04 + r() * .1, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.8 + r() * .5, lx = x + Math.cos(a) * (.18 + r() * .2), lz = z + Math.sin(a) * (.18 + r() * .2), col = i % 3 ? 0xf2e7c9 : 0xead7c0;
      stem(b, x, 0, z, lx, h - .3, lz, .007, 0xb0a070); b.S(sk.fabric); const tl = Math.atan2(Math.hypot(lx - x, lz - z), h), px = lx + Math.cos(a) * .03, pz = lz + Math.sin(a) * .03, py = h - .08;
      E(b, col, px, py, pz, .035, .2, .035, Math.sin(a) * tl, 0, -Math.cos(a) * tl, 7); // cœur du plumet, puis des brins plumeux qui s'écartent
      for (let k = 0; k < N(12, q); k++) { const aa = k * 2.4, yy = py - .12 + (k % 4) * .07; pet(b, k % 3 ? col : light(col, .25), px + Math.cos(a) * (yy - py + .12) * .12, yy, pz + Math.sin(a) * (yy - py + .12) * .12, aa, .01, .016, .1 - (k % 4) * .012, .012, .3 + (k % 3) * .12, 5); } b.S(null); } });

  // lupin : feuilles palmées et épis serrés de fleurs en papillon, couleurs mêlées
  const LUP = [0x5f6ff0, 0xe86aa8, 0x9a5ad8, 0xf6f0fa, 0xffcf3a, 0xd83a6a];
  sp('lupin', 'Lupin', 1, 180, { sc: 1.2 }, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(7, q); i++) { const a = i / 7 * TAU + r() * .4, d = .12 + r() * .05, x = Math.cos(a) * d, z = Math.sin(a) * d, y = .14 + r() * .12; stem(b, 0, 0, 0, x, y, z, .005); b.S(sk.leaf);
      for (let k = 0; k < N(8, q); k++) pet(b, k % 2 ? LEAF : LEAF2, x, y, z, k / 8 * TAU, .005, .014, .045, .006, 1.25); }
    for (let i = 0; i < N(5, q); i++) { const a = i / 5 * TAU + r(), d = .03 + r() * .08, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .8 + r() * .3, col = LUP[Math.floor(r() * LUP.length)], y0 = h * .45;
      stem(b, x, 0, z, x, h, z, .011); b.S(sk.petal); const ring = N(10, q);
      for (let k = 0; k < ring; k++) { const t = k / ring, y = y0 + t * (h - y0), rr = .045 * (1 - t * .7); for (let j = 0; j < 3; j++) { const aa = j / 3 * TAU + k * .7; E(b, j % 2 ? col : light(col, .35), x + Math.cos(aa) * rr, y, z + Math.sin(aa) * rr, .017 * (1 - t * .5), .013, .02 * (1 - t * .5), .3, PI / 2 - aa, 0, 6); } }
      b.S(sk.leaf); E(b, 0x7aa04a, x, h + .02, z, .012, .03, .012, 0, 0, 0, 6); } b.S(null); });

  // digitale : rosette de grandes feuilles et hautes grappes de clochettes tachetées, toutes du même côté
  sp('digitale', 'Digitale', 1.3, 180, { sc: 1.15 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(9, q); i++) pet(b, i % 2 ? 0x4f8a42 : 0x5f9a4a, 0, .01, 0, i * 2.4, .02, .07, .16, .012, 1.25 + r() * .2);
    for (let i = 0; i < N(3, q); i++) { const a = i * 2.1 + r(), d = .05 + r() * .05, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.1 + r() * .35, col = r() < .25 ? 0xf6eef4 : 0xd47fc8, fa = a + PI * .1;
      stem(b, x, 0, z, x, h, z, .011); const n = N(12, q);
      for (let k = 0; k < n; k++) { const t = k / n, y = h * .48 + t * h * .45, s = 1 - t * .45, aa = fa + (k % 3 - 1) * .5, bx = x + Math.cos(aa) * .035, bz = z + Math.sin(aa) * .035;
        b.S(sk.petal); E(b, col, bx, y - .015, bz, .022 * s, .042 * s, .022 * s, 0, PI / 2 - aa, 0, 7); E(b, dark(col, .55), bx + Math.cos(aa) * .016 * s, y - .045 * s, bz + Math.sin(aa) * .016 * s, .014 * s, .008, .014 * s, 0, 0, 0, 6); }
      b.S(sk.leaf); for (let k = 0; k < N(4, q); k++) E(b, 0x7aa04a, x, h - k * .03, z, .01, .016, .01, 0, 0, 0, 6); } b.S(null); });

  // rose trémière : hautes hampes couvertes de grandes fleurs ouvertes, larges feuilles rondes au pied
  const TREM = [0xf28ab8, 0xc8203a, 0xfaf2f0, 0x5a1a3a, 0xffd0a0];
  sp('rose_tremiere', 'Rose trémière', 2, 240, { sc: 1.1 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(7, q); i++) { const a = i * 2.4; stem(b, 0, 0, 0, Math.cos(a) * .12, .14, Math.sin(a) * .12, .006); pet(b, i % 2 ? LEAF : LEAFD, Math.cos(a) * .12, .14, Math.sin(a) * .12, a, 0, .1, .07, .012, 1.4, 9); }
    for (let i = 0; i < N(3, q); i++) { const a = i * 2.2 + r(), d = .04 + r() * .05, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.8 + r() * .5, col = TREM[Math.floor(r() * TREM.length)];
      stem(b, x, 0, z, x, h, z, .016); const n = N(10, q);
      for (let k = 0; k < n; k++) { const t = k / n, y = h * .4 + t * h * .55, aa = k * 2.4 + i, s = 1 - t * .55, fx = x + Math.cos(aa) * .05 * s, fz = z + Math.sin(aa) * .05 * s;
        if (t > .8) { b.S(sk.leaf); E(b, 0x6a9a48, fx, y, fz, .022 * s + .008, .03, .022 * s + .008, 0, 0, 0, 6); continue; }
        b.S(sk.petal); disc(b, col, fx, y, fz, aa, .075 * s, .018, .35); disc(b, light(col, .25), fx + Math.cos(aa) * .006, y + .002, fz + Math.sin(aa) * .006, aa, .04 * s, .012, .35);
        E(b, 0xf6e27a, fx + Math.cos(aa) * .016, y + .006, fz + Math.sin(aa) * .016, .012, .012, .012, 0, 0, 0, 6);
        b.S(sk.leaf); if (k % 3 === 0) pet(b, LEAF, x, y - .03, z, aa + 1.5, .01, .05, .05, .008, 1.3); } } b.S(null); });

  // pied-d'alouette (delphinium) : épis bleus très serrés, feuillage découpé
  const DEL = [0x3f5ae0, 0x6a5ae0, 0x8fb0ff, 0xa06ad8];
  sp('delphinium', 'Pied-d\'alouette', 1.3, 220, {}, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(10, q); i++) { const a = i * 2.4; for (let k = 0; k < 3; k++) pet(b, k % 2 ? LEAF : LEAF2, Math.cos(a) * .06, .12 + k * .03, Math.sin(a) * .06, a + (k - 1) * .35, .01, .016, .06, .006, 1.1 + k * .1); }
    for (let i = 0; i < N(4, q); i++) { const a = i * 1.7 + r(), d = .04 + r() * .07, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.2 + r() * .35, col = DEL[Math.floor(r() * DEL.length)];
      stem(b, x, 0, z, x, h, z, .012); b.S(sk.petal); const n = N(13, q);
      for (let k = 0; k < n; k++) { const t = k / n, y = h * .42 + t * h * .56, rr = .05 * (1 - t * .65); for (let j = 0; j < 4; j++) { const aa = j / 4 * TAU + k * .9, fx = x + Math.cos(aa) * rr, fz = z + Math.sin(aa) * rr;
        disc(b, j % 2 ? col : light(col, .15), fx, y, fz, aa, .02 * (1 - t * .4), .006, .2, 6); if ((j + k) % 3 === 0) E(b, 0xffffff, fx + Math.cos(aa) * .006, y, fz + Math.sin(aa) * .006, .005, .005, .005, 0, 0, 0, 4); } } } b.S(null); });

  // agapanthe : feuilles en ruban et boules de trompettes bleues au bout de longues tiges
  sp('agapanthe', 'Agapanthe', 1, 200, { sc: 1.2 }, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(16, q); i++) blade(b, 0, 0, i * 2.4, .45 + r() * .15, .028, .8 + r() * .5, i % 2 ? LEAF : LEAFD);
    for (let i = 0; i < N(4, q); i++) { const a = i * 1.6 + r(), d = .03 + r() * .05, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .85 + r() * .25, col = r() < .2 ? 0xf6f6fa : 0x5a7ae8;
      stem(b, x, 0, z, x, h, z, .008); const n = N(20, q);
      for (let k = 0; k < n; k++) { const aa = k * 2.4, tl = Math.acos(1 - 2 * ((k + .5) / n)) * .75, ex = x + Math.cos(aa) * Math.sin(tl) * .08, ey = h + Math.cos(tl) * .08, ez = z + Math.sin(aa) * Math.sin(tl) * .08;
        stem(b, x, h, z, ex, ey, ez, .002, 0x6a9a48, 4); b.S(sk.petal); pet(b, k % 2 ? col : light(col, .2), ex, ey, ez, aa, 0, .012, .022, .012, tl, 6); } } b.S(null); });

  // allium géant : grosses boules violettes faites de petites étoiles
  sp('allium', 'Allium géant', 1, 200, {}, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(7, q); i++) blade(b, 0, 0, i * 2.4, .35 + r() * .1, .03, 1 + r() * .4, 0x5f9a5a);
    for (let i = 0; i < N(4, q); i++) { const a = i * 1.6 + r(), d = .04 + r() * .08, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .85 + r() * .35, R = .07 + r() * .025, col = r() < .2 ? 0xf2eefa : 0x9a5ad8;
      stem(b, x, 0, z, x, h, z, .009, 0x5f9a4a); b.S(sk.petal); E(b, dark(col, .6), x, h + R * .9, z, R * .8, R * .8, R * .8, 0, 0, 0, 8); const n = N(42, q);
      for (let k = 0; k < n; k++) { const yy = 1 - 2 * (k + .5) / n, rr = Math.sqrt(1 - yy * yy), aa = k * 2.39996; E(b, k % 3 ? col : light(col, .3), x + Math.cos(aa) * rr * R, h + R * .9 + yy * R, z + Math.sin(aa) * rr * R, .013, .013, .013, 0, 0, 0, 5); } } b.S(null); });

  // hosta : rosette de grandes feuilles en cœur panachées de crème, quelques hampes mauves
  sp('hosta', 'Hosta', .6, 160, { sc: 1.4 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(13, q); i++) { const a = i * 2.4 + r() * .3, tl = .95 + (i % 3) * .2, y = .02 + (i % 4) * .03;
      pet(b, 0xe6e2a8, 0, y, 0, a, .02, .095, .15, .012, tl, 9); pet(b, i % 2 ? 0x3f8a42 : 0x4f9a48, 0, y + .006, 0, a, .03, .07, .13, .012, tl, 9); }
    for (let i = 0; i < N(3, q); i++) { const a = i * 2.2 + r(), x = Math.cos(a) * .06, z = Math.sin(a) * .06, h = .55 + r() * .15; stem(b, x, 0, z, x + Math.cos(a) * .05, h, z + Math.sin(a) * .05, .005);
      b.S(sk.petal); for (let k = 0; k < N(7, q); k++) { const y = h * .65 + k * .03, aa = a + k * 1.1; E(b, 0xc8b0ec, x + Math.cos(a) * .04 + Math.cos(aa) * .02, y, z + Math.sin(a) * .04 + Math.sin(aa) * .02, .011, .022, .011, .5, PI / 2 - aa, 0, 6); } } b.S(null); });

  // capucine : coussin de feuilles rondes en ombrelle et fleurs orange, jaunes et rouges
  const CAP = [0xff8a1a, 0xffc21a, 0xd8301a, 0xff6a2a];
  sp('capucine', 'Capucine', 0, 120, { pick: 1, sc: 1.7 }, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(15, q); i++) { const a = r() * TAU, d = .05 + r() * .22, x = Math.cos(a) * d, z = Math.sin(a) * d, y = .07 + r() * .18; stem(b, x * .4, 0, z * .4, x, y, z, .004, 0x7aaa4a, 4);
      b.S(sk.leaf); E(b, i % 2 ? 0x6fb84a : 0x5fa844, x, y, z, .05 + r() * .02, .007, .05 + r() * .02, (r() - .5) * .4, r() * TAU, (r() - .5) * .4, 10); E(b, 0xb8d88a, x, y + .006, z, .006, .002, .006, 0, 0, 0, 5); }
    for (let i = 0; i < N(8, q); i++) { const a = r() * TAU, d = .08 + r() * .2, x = Math.cos(a) * d, z = Math.sin(a) * d, y = .15 + r() * .17, col = CAP[i % CAP.length]; b.S(sk.petal);
      for (let k = 0; k < 5; k++) { const aa = a + (k - 2) * .55; disc(b, k % 2 ? col : light(col, .12), x + Math.cos(aa) * .02, y + Math.abs(k - 2) * -.004, z + Math.sin(aa) * .02, a, .022, .006, .5, 6); }
      E(b, dark(col, .6), x + Math.cos(a) * .006, y + .004, z + Math.sin(a) * .006, .007, .007, .007, 0, 0, 0, 5); stem(b, x, y, z, x - Math.cos(a) * .045, y + .02, z - Math.sin(a) * .045, .005, col, 4); } b.S(null); });

  // chardon : feuilles épineuses gris-vert, têtes à bractées piquantes et houppe violette
  sp('chardon', 'Chardon', 1, 140, { sc: 1.2 }, (b, r, q) => { const sk = SK(), GV = 0x7a9a7a;
    b.S(sk.leaf); for (let i = 0; i < N(8, q); i++) { const a = i * 2.4; pet(b, i % 2 ? GV : 0x6a8a6a, 0, .02, 0, a, .02, .05, .15, .01, 1.15);
      for (let k = 0; k < 3; k++) { const t = .35 + k * .25, d = .02 + Math.sin(1.15) * .3 * t, y = .02 + Math.cos(1.15) * .3 * t; if (q > .6) for (const s2 of [-1, 1]) spine(b, .006, .04, 0xd8e0c8, Math.cos(a) * d + Math.cos(a + s2 * PI / 2) * .04, y, Math.sin(a) * d + Math.sin(a + s2 * PI / 2) * .04, 0, 0, s2 * 1.2); } }
    for (let i = 0; i < N(5, q); i++) { const a = i * 1.3 + r(), d = .03 + r() * .1, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .7 + r() * .35, hx = x + Math.cos(a) * .06, hz = z + Math.sin(a) * .06;
      stem(b, x, 0, z, hx, h, hz, .01, GV); pet(b, GV, hx, h * .55, hz, a + 1, .005, .02, .05, .006, 1.1);
      b.S(sk.leaf); E(b, 0x6f8f5a, hx, h + .02, hz, .034, .038, .034, 0, 0, 0, 8); for (let k = 0; k < N(10, q); k++) { const aa = k / 10 * TAU; spine(b, .008, .045, 0x8aa070, hx + Math.cos(aa) * .03, h + .005, hz + Math.sin(aa) * .03, Math.sin(aa) * 1.4, 0, -Math.cos(aa) * 1.4); }
      b.S(sk.petal); E(b, 0xa04ab8, hx, h + .07, hz, .03, .026, .03, 0, 0, 0, 8); for (let k = 0; k < N(12, q); k++) { const aa = k * 2.4, tl = .25 + (k % 3) * .2; stem(b, hx, h + .07, hz, hx + Math.cos(aa) * Math.sin(tl) * .045, h + .07 + Math.cos(tl) * .045, hz + Math.sin(aa) * Math.sin(tl) * .045, .003, 0xc06ad8, 3); } } b.S(null); });

  // pissenlit : rosette de feuilles dentées, fleurs jaunes et une boule de graines
  sp('pissenlit', 'Pissenlit', 0, 60, { pick: 1, wild: 1, sc: 1.5 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(9, q); i++) { const a = i * 2.4 + r() * .3; for (let k = 0; k < 3; k++) pet(b, k % 2 ? LEAF2 : LEAF, Math.cos(a) * k * .045, .005, Math.sin(a) * k * .045, a + (k % 2 ? .25 : -.25), .005, .022, .03, .004, 1.45); }
    for (let i = 0; i < N(2, q); i++) { const a = i * 3 + r(), x = Math.cos(a) * .05, z = Math.sin(a) * .05, h = .18 + r() * .08; stem(b, 0, 0, 0, x, h, z, .004, 0x8ab05a, 4); b.S(sk.petal);
      for (let L = 0; L < 2; L++) for (let k = 0; k < N(10 - L * 3, q); k++) pet(b, L ? 0xffd21a : 0xffc21a, x, h, z, k / (10 - L * 3) * TAU + L, .003, .007, .018 - L * .005, .003, 1.35 - L * .5, 4); E(b, 0xffb81a, x, h + .004, z, .01, .006, .01, 0, 0, 0, 5); }
    const a = r() * TAU, x = -Math.cos(a) * .06, z = -Math.sin(a) * .06, h = .28 + r() * .05; stem(b, 0, 0, 0, x, h, z, .004, 0x9ab06a, 4);
    b.S(null); b.add(new THREE.SphereGeometry(.045, q < .6 ? 6 : 10, q < .6 ? 4 : 8), 0xffffff, b.M(x, h + .04, z), 2, true); E(b, 0xe8e2c8, x, h + .04, z, .008, .008, .008, 0, 0, 0, 5);
    if (q > .6) for (let k = 0; k < 14; k++) { const yy = 1 - 2 * (k + .5) / 14, rr = Math.sqrt(1 - yy * yy), aa = k * 2.4; E(b, 0xfaf8f0, x + Math.cos(aa) * rr * .045, h + .04 + yy * .045, z + Math.sin(aa) * rr * .045, .005, .005, .005, 0, 0, 0, 4); } });

  // myosotis : coussin bas piqué de minuscules fleurs bleues à œil jaune
  sp('myosotis', 'Myosotis', 0, 60, { pick: 1, wild: 1, sc: 1.9 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(14, q); i++) { const a = r() * TAU, d = r() * .14; pet(b, i % 2 ? LEAF : LEAF2, Math.cos(a) * d, .01, Math.sin(a) * d, a, .01, .018, .04, .006, 1.1 + r() * .3, 6); }
    for (let i = 0; i < N(6, q); i++) { const a = r() * TAU, d = r() * .12, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .12 + r() * .08; stem(b, x * .5, 0, z * .5, x, h, z, .003, STEM, 4); b.S(sk.petal);
      for (let k = 0; k < N(6, q); k++) { const aa = k * 2.4, rr = .012 + k * .004, fx = x + Math.cos(aa) * rr, fz = z + Math.sin(aa) * rr, fy = h + .012 - k * .003;
        E(b, k % 3 ? 0x6a9ef0 : 0x8ab6ff, fx, fy, fz, .011, .003, .011, 0, 0, 0, 6); if (k % 2 === 0) E(b, 0xffe04a, fx, fy + .003, fz, .003, .002, .003, 0, 0, 0, 3); } } b.S(null); });

  // bruyère : touffe basse et dense couverte de petits épis roses
  const BRU = [0xd86aa8, 0xc85a98, 0xe88ac0, 0xf6eef4, 0xa85ac8];
  sp('bruyere', 'Bruyère', 0, 120, { wild: 1, sc: 1.6 }, (b, r, q) => { const sk = SK(), col = BRU[Math.floor(r() * BRU.length)];
    b.S(sk.leaf); for (let i = 0; i < N(7, q); i++) { const a = r() * TAU, d = r() * .14; b.blob(.1 + r() * .05, q < .6 ? 0 : 1, i % 2 ? 0x3f6a3a : 0x4f7a42, Math.cos(a) * d, .08 + r() * .05, Math.sin(a) * d, 1, .7, 1); }
    b.S(sk.petal); for (let i = 0; i < N(40, q); i++) { const a = r() * TAU, d = Math.sqrt(r()) * .2, x = Math.cos(a) * d, z = Math.sin(a) * d, y = .13 + (1 - d / .2) * .1 + r() * .04, c2 = i % 4 ? col : light(col, .3);
      for (let k = 0; k < 2; k++) E(b, c2, x, y + k * .024, z, .014 - k * .004, .014, .014 - k * .004, 0, 0, 0, 4); } b.S(null); });

  // échinacée : marguerites roses aux pétales retombants autour d'un cône orange
  sp('echinacee', 'Échinacée', .9, 160, { sc: 1.2 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(8, q); i++) pet(b, i % 2 ? LEAF : LEAFD, 0, .02, 0, i * 2.4, .02, .03, .11, .008, 1.05 + r() * .25);
    for (let i = 0; i < N(6, q); i++) { const a = i * 1.1 + r(), d = .03 + r() * .1, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .65 + r() * .25, col = r() < .2 ? 0xf6f0ea : 0xe86a9a;
      stem(b, x * .3, 0, z * .3, x, h, z, .007); pet(b, LEAF, x, h * .5, z, a + 1.2, .005, .02, .06, .006, 1.1);
      b.S(sk.leaf); E(b, 0xb0521a, x, h + .025, z, .028, .032, .028, 0, 0, 0, 8); E(b, 0xd8782a, x, h + .045, z, .02, .014, .02, 0, 0, 0, 6);
      b.S(sk.petal); for (let k = 0; k < N(13, q); k++) pet(b, k % 2 ? col : light(col, .15), x, h + .015, z, k / 13 * TAU, .026, .013, .038, .005, 1.95, 6); } b.S(null); });

  // nénuphar : feuilles rondes fendues posées sur l'eau, fleurs ouvertes blanches ou roses
  const WY = -.3; // la surface de l'eau est 32 cm sous le niveau de la case
  sp('nenuphar', 'Nénuphar', 0, 200, { onWater: 1, wild: 1 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(5, q); i++) { const a = i * 2.4 + r(), d = i ? .16 + r() * .2 : 0, x = Math.cos(a) * d, z = Math.sin(a) * d, R = .11 + r() * .07;
      b.add(new THREE.CylinderGeometry(R, R, .012, 22, 1, false, a + .2, TAU - .4), i % 2 ? 0x3f8a3a : 0x4f9a40, b.M(x, WY + .006 * (i % 2), z), 0, false); E(b, 0x2f6a2a, x, WY + .008, z, .01, .003, .01, 0, 0, 0, 5); }
    for (let i = 0; i < N(2, q); i++) { const a = i * 2.9 + r(), x = Math.cos(a) * .1, z = Math.sin(a) * .1, col = r() < .5 ? 0xfaf6f2 : 0xf6a8c8; b.S(sk.petal);
      for (let L = 0; L < 3; L++) for (let k = 0; k < 8; k++) pet(b, L === 2 ? light(col, .3) : col, x, WY + .01 + L * .008, z, k / 8 * TAU + L * .4, .01, .016 - L * .002, .045 - L * .01, .007, 1.25 - L * .35, 6);
      E(b, 0xffd23f, x, WY + .03, z, .018, .012, .018, 0, 0, 0, 7); } b.S(null); });

  // papyrus : tiges triangulaires et ombelles de fins rayons
  sp('papyrus', 'Papyrus', 1.4, 200, { wet: 1 }, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(8, q); i++) { const a = r() * TAU, d = r() * .1, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 1.2 + r() * .6, tx = x + Math.cos(a) * .1, tz = z + Math.sin(a) * .1;
      b.S(sk.leaf); b.add(new THREE.CylinderGeometry(.006, .01, .12, 6), 0x8a6a40, b.M(x, .06, z), 0, true); stem(b, x, 0, z, tx, h, tz, .009, 0x5f9a48, 3);
      const n = N(26, q); for (let k = 0; k < n; k++) { const aa = k * 2.4, tl = 1.0 + (k % 5) * .18, L = .2 + (k % 4) * .03, ex = tx + Math.cos(aa) * Math.sin(tl) * L, ey = h + Math.cos(tl) * L, ez = tz + Math.sin(aa) * Math.sin(tl) * L;
        stem(b, tx, h, tz, ex, ey, ez, .0025, k % 2 ? 0x6fae4a : 0x5f9a40, 3); if (k % 2 === 0) E(b, 0x9a8a50, ex, ey, ez, .006, .006, .006, 0, 0, 0, 4); } } b.S(null); });

  // oiseau de paradis : feuilles en pagaie et fleurs en tête d'oiseau, crête orange et langue bleue
  sp('strelitzia', 'Oiseau de paradis', 1.2, 260, {}, (b, r, q) => { const sk = SK();
    for (let i = 0; i < N(9, q); i++) { const a = i * 2.4 + r() * .3, d = .03, h = .45 + r() * .35, tl = .15 + r() * .35, x = Math.cos(a) * (d + Math.sin(tl) * h), z = Math.sin(a) * (d + Math.sin(tl) * h), y = Math.cos(tl) * h;
      stem(b, Math.cos(a) * d, 0, Math.sin(a) * d, x, y, z, .008, 0x5f8a50); b.S(sk.leaf); pet(b, i % 2 ? 0x3f7a4a : 0x4f8a52, x, y, z, a, 0, .07, .2, .012, tl + .1, 9); }
    for (let i = 0; i < N(3, q); i++) { const a = i * 2.1 + r(), d = .06, x = Math.cos(a) * d, z = Math.sin(a) * d, h = .9 + r() * .25; stem(b, x * .3, 0, z * .3, x, h, z, .011, 0x6a8a58);
      b.S(sk.leaf); pet(b, 0x4a6a5a, x, h, z, a, -.04, .022, .12, .02, 1.5, 8); E(b, 0x8a3a6a, x + Math.cos(a) * .12, h + .01, z + Math.sin(a) * .12, .02, .012, .016, 0, PI / 2 - a, 0, 6);
      b.S(sk.petal); for (let k = 0; k < 4; k++) { const aa = a + (k - 1.5) * .18; pet(b, k % 2 ? 0xff8a1a : 0xffa63a, x + Math.cos(a) * .05, h + .02, z + Math.sin(a) * .05, aa, 0, .012, .06, .008, .35 + k * .12, 6); }
      pet(b, 0x3a5ad8, x + Math.cos(a) * .06, h + .025, z + Math.sin(a) * .06, a, 0, .01, .05, .008, .9, 6); } b.S(null); });

  // cœur-de-Marie : tiges arquées d'où pendent des cœurs roses à goutte blanche
  sp('coeur_marie', 'Cœur-de-Marie', .7, 200, { sc: 1.3 }, (b, r, q) => { const sk = SK();
    b.S(sk.leaf); for (let i = 0; i < N(8, q); i++) { const a = i * 2.4, x = Math.cos(a) * .08, z = Math.sin(a) * .08; stem(b, 0, 0, 0, x, .25, z, .005, 0x6a9a7a); for (let k = 0; k < 3; k++) pet(b, k % 2 ? 0x7aaa8a : 0x6a9a7a, x, .25, z, a + (k - 1) * .6, .01, .03, .06, .006, 1.2); }
    for (let i = 0; i < N(5, q); i++) { const a = i / 5 * TAU + r() * .5, P = arch(b, 0, 0, a, .55 + r() * .15, .3 + r() * .1, 6, .006, 0x9a6a7a), n = N(6, q);
      for (let k = 0; k < n; k++) { const t = .35 + k / n * .62, j = Math.min(P.length - 2, Math.floor(t * (P.length - 1))), f = t * (P.length - 1) - j, p = P[j].map((v, c) => v + (P[j + 1][c] - v) * f), s = 1 - k / n * .5;
        stem(b, p[0], p[1], p[2], p[0], p[1] - .025, p[2], .002, 0x9a6a7a, 3); b.S(sk.petal); const tx = -Math.sin(a) * .011 * s, tz = Math.cos(a) * .011 * s, hy = p[1] - .04 * s;
        E(b, 0xf06a9a, p[0] + tx, hy, p[2] + tz, .014 * s, .018 * s, .011 * s, 0, PI / 2 - a, .3, 6); E(b, 0xf06a9a, p[0] - tx, hy, p[2] - tz, .014 * s, .018 * s, .011 * s, 0, PI / 2 - a, -.3, 6); E(b, 0xfaf4f6, p[0], hy - .02 * s, p[2], .006 * s, .01 * s, .006 * s, 0, 0, 0, 5); } } b.S(null); });

  // cyprès de Provence : grand fuseau sombre et serré
  sp('cypres', 'Cyprès de Provence', 5, 300, { tree: 1 }, (b, r, q) => { const sk = SK();
    b.S(sk.bark); b.cyl(.06, .1, .7, 8, 0x5a3d26, 0, .35, 0); b.S(sk.leaf); const n = N(22, q);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), y = .45 + t * 4.9, R = .5 * Math.sin(Math.min(1, t * 2.4 + .15) * PI / 2) * (1 - Math.pow(t, 1.6) * .92) + .05;
      for (let k = 0; k < (q < .6 ? 1 : 3); k++) { const a = r() * TAU, d = R * .25 * k; b.blob(R * (k ? .7 : 1), q < .6 ? 0 : 1, (i + k) % 3 ? 0x2f5a32 : 0x3a6a3a, Math.cos(a) * d, y + (r() - .5) * .15, Math.sin(a) * d, 1, 1.25, 1); } } b.S(null); });

  // ---------- modèles, objets, objets d'inventaire ----------
  const build = (v, q) => { const s = SPEC[v]; if (!s) return G.MODELS._missing(); const b = G.mb(2400 + v); SEG = q < .6 ? 4 : 6; try { s.f(b, G.rng(91 + v * 7), q); } finally { SEG = 6; }
    const g = b.done(), k = s.o.sc; if (k) { g.scale(k, k, k); g.computeBoundingSphere(); g.computeBoundingBox(); } return g; };
  MD.flx = v => build(v, 1); MD.flx_lod = v => build(v, .35);
  SPEC.forEach((s, v) => { const id = 'nx_' + s.id, tree = s.o.tree;
    O[id] = Object.assign({ id, n: s.n, model: 'flx', v, fp: [1, 1], h: s.h, take: 1, cat: 'fleurs' }, s.o.pick ? { pick: id, take: 0 } : {}, s.o.onWater ? { onWater: 1 } : {}, tree ? { chop: 3, grow: 1, shadow: .7, cat: 'nature' } : {});
    G.ITEMS[id] = { id, n: s.n, stack: tree ? 9 : 99, sell: s.sell, kind: 'place', obj: id, cat: tree ? 'nature' : 'fleurs', thumb: 'obj:' + id, desc: s.o.onWater ? 'Se pose sur l\'eau calme (étang, lac, rivière).' : 'Plante d\'extérieur.' };
    if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); });
  G.FLORE_EXT = SPEC.map(s => 'nx_' + s.id);
  // ce sont des plantes : un bâtiment posé par-dessus les écrase comme le reste de la nature
  const oin = G.isNature; if (oin) G.isNature = o => oin(o) || !!(o && O[o.t] && O[o.t].model === 'flx' && o.dk == null);

  // ---------- elles poussent d'elles-mêmes à la création du monde ----------
  G.on('worldgen', (map, ctx) => { if (!ctx || !ctx.layout) return; const r = G.rng((ctx.seed || 1) + 4242), A = G.ACRE, B = G.BORDER;
    const ok = (t, x, z) => { if (!map.inb(x, z)) return false; const i = map.idx(x, z); if (map.ramp[i] || G.SURF[map.surf[i]].path) return false; return map.canPlace(t, x, z); };
    const patch = (t, cx, cz, n, sp2) => { for (let j = 0; j < n; j++) { const x = cx + Math.floor((r() - .5) * sp2 * 2), z = cz + Math.floor((r() - .5) * sp2 * 2); if (ok(t, x, z)) map.addObj(t, x, z); } };
    const nearWater = (x, z) => { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz; if (map.inb(xx, zz) && map.water[map.idx(xx, zz)] === 1) return true; } return false; };
    const WILD = { plaine: [['nx_pissenlit', 2, 5], ['nx_myosotis', 1, 4], ['nx_lupin', 1, 2]], verger: [['nx_pissenlit', 2, 5], ['nx_echinacee', 1, 2]], jardin: [['nx_myosotis', 2, 4], ['nx_lupin', 1, 2], ['nx_rose_tremiere', 1, 2]],
      foret: [['nx_digitale', 2, 3], ['nx_myosotis', 1, 3], ['nx_coeur_marie', 1, 1]], colline: [['nx_bruyere', 2, 4], ['nx_chardon', 1, 3], ['nx_pissenlit', 1, 4], ['nx_cypres', 1, 1]],
      plateau: [['nx_bruyere', 2, 4], ['nx_chardon', 2, 3], ['nx_cypres', 1, 2]], montagne: [['nx_bruyere', 2, 4], ['nx_chardon', 1, 2]] };
    for (let az = 0; az < ctx.layout.length; az++) for (let ax = 0; ax < ctx.layout[0].length; ax++) { const id = ctx.layout[az][ax], a = G.ACRES[id]; if (!a || a.beach || a.struct) continue; const x0 = B + ax * A, z0 = B + az * A;
      for (const [t, np, per] of WILD[id] || []) for (let k = 0; k < np; k++) patch(t, x0 + 2 + Math.floor(r() * (A - 4)), z0 + 2 + Math.floor(r() * (A - 4)), per, t === 'nx_cypres' ? 0 : 2);
      // bords de l'eau douce : massettes et papyrus ; eau calme des étangs et des lacs : nénuphars
      let wet = 0, lil = 0; const wantW = a.water || a.pond || /riviere|cascade/.test(id) ? 6 : 0, wantL = a.pond || a.lake ? 5 : 0;
      for (let k = 0; k < 160 && (wet < wantW || lil < wantL); k++) { const x = x0 + Math.floor(r() * A), z = z0 + Math.floor(r() * A); if (!map.inb(x, z)) continue; const i = map.idx(x, z);
        if (map.water[i] === 1 && lil < wantL && !/riviere|cascade/.test(id)) { let still = true; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!map.inb(x + dx, z + dz)) still = false; if (still && map.canPlace('nx_nenuphar', x, z)) { map.addObj('nx_nenuphar', x, z); lil++; } }
        else if (!map.water[i] && wet < wantW && nearWater(x, z)) { const t = r() < .7 ? 'nx_massette' : 'nx_papyrus'; if (ok(t, x, z)) { map.addObj(t, x, z); wet++; } } } } });
})();
