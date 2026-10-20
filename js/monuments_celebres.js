'use strict';
// ===== Monuments célèbres du monde, en version Douce Vallée, à poser dans le village (catalogue Construction) :
// (la tour Eiffel et Notre-Dame sont dans monuments_grands.js) arc de Triomphe, pyramide du Louvre, Notre-Dame de Paris, Sacré-Cœur, obélisque de la Concorde,
// Moulin Rouge (enseigne au néon, ailes qui tournent), statue de la Liberté (flambeau allumé), Big Ben (cadrans éclairés),
// tour de Pise (qui penche !), Colisée, Parthénon, Taj Mahal, pagode à cinq toits, Atomium, Christ Rédempteur,
// basilique Saint-Basile et ses bulbes de toutes les couleurs, moaï, Stonehenge, pyramide de Khéops et le Sphinx. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2, PT = G.PAT || {};
  const SK = () => G.SK || {};
  const UP = new THREE.Vector3(0, 1, 0), V = (x, y, z) => new THREE.Vector3(x, y, z);
  // ---------- outils ----------
  function beam(b, p, q, w, col, mat = 0, d = w) { const dir = V(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = dir.length(); if (L < 1e-4) return; dir.normalize();
    b.add(new THREE.BoxGeometry(w, L, d), col, new THREE.Matrix4().compose(V((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)), mat, false); }
  function rod(b, p, q, r0, col, seg = 10, mat = 0, r1 = r0) { const dir = V(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = dir.length(); if (L < 1e-4) return; dir.normalize();
    b.add(new THREE.CylinderGeometry(r1, r0, L, seg, 1), col, new THREE.Matrix4().compose(V((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)), mat, true); }
  const lathe = (b, pts, col, x, y, z, seg = 28, mat = 0, sx = 1, sy = 1, sz = 1, phiS = 0, phiL = TAU) => b.add(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0, r), h)), seg, phiS, phiL), col, b.M(x, y, z, 0, 0, 0, sx, sy, sz), mat, true);
  const ONION = [[1, 0], [1.12, .16], [1.2, .32], [1.12, .46], [.86, .6], [.52, .74], [.26, .85], [.1, .94], [0, 1]];
  const onion = (b, r, h, col, x, y, z, mat = 0, seg = 28) => lathe(b, ONION.map(([a, c]) => [a * r, c * h]), col, x, y, z, seg, mat);
  const DOME = n => { const P = []; for (let i = 0; i <= n; i++) { const a = i / n * PI / 2; P.push([Math.cos(a), Math.sin(a)]); } return P; };
  const dome = (b, r, h, col, x, y, z, mat = 0) => lathe(b, DOME(10).map(([a, c]) => [a * r, c * h]), col, x, y, z, 28, mat);
  const ell = (b, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, mat = 0) => b.add(new THREE.SphereGeometry(1, 16, 12), col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), mat, true);
  // forme percée d'arcs (plein cintre ou brisés), extrudée dans l'épaisseur (z), centrée
  function arched(w, h, holes) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
    for (const o of holes) { const p = new THREE.Path(), x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y0 = o.y || 0, r = o.w / 2;
      p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y0 + o.h - (o.pointed ? r * 1.4 : r));
      if (o.pointed) { p.quadraticCurveTo(x1, y0 + o.h - r * .4, o.x, y0 + o.h); p.quadraticCurveTo(x0, y0 + o.h - r * .4, x0, y0 + o.h - r * 1.4); }
      else p.absarc(o.x, y0 + o.h - r, r, 0, PI, false);
      p.lineTo(x0, y0); s.holes.push(p); } return s; }
  function extrude(b, shape, depth, col, m, mat = 0) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 14 }); g.translate(0, 0, -depth / 2); b.add(g, col, m, mat, false); }
  // une arche décorative (demi-tore) : centre, rayon, épaisseur, orientation
  const archRing = (b, r, t, col, x, y, z, ry = 0, mat = 0, arc = PI) => b.add(new THREE.TorusGeometry(r, t, 6, 20, arc), col, b.M(x, y, z, 0, ry, 0), mat, true);
  // pyramide à base carrée (côté a en bas, c en haut)
  const frustum = (b, a, c, h, col, x, y, z, mat = 0, ry = 0) => b.add(new THREE.CylinderGeometry(c * Math.SQRT1_2, a * Math.SQRT1_2, h, 4, 1), col, b.M(x, y + h / 2, z, 0, PI / 4 + ry, 0), mat, false);
  // lettres au néon : police 5 × 7
  const FONT = { M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'], N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'], G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'] };
  function neon(b, txt, x, y, z, px, col) { const W = txt.length * 6 * px; let cx = x - W / 2;
    for (const ch of txt) { const g = FONT[ch] || FONT[' ']; g.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '1') b.add(new THREE.BoxGeometry(px * .82, px * .82, px * .4), col, b.M(cx + (i + .5) * px, y + (6 - j + .5) * px, z), 1, false); }); cx += 6 * px; } }

  const IRON = 0x7a6450, IRON2 = 0x5e4c3c, STONE = 0xe6dcc4, MARBLE = 0xf4f0e6, GOLD = 0xe8c25a, SLATE = 0x4a5562, GLASS = 0x9fd8ff, WARM = 0xffd98a, DARK = 0x2e2a26;

  // =====================================================================
  // 2. ARC DE TRIOMPHE
  // =====================================================================
  MD.arc_triomphe = () => { const b = G.mb(5110), C = 0xe9dfc6, D = 0xd2c6aa, sk = SK(); b.S(sk.stone); b.P(PT.pierre);
    extrude(b, arched(4.6, 3.9, [{ x: 0, w: 1.5, h: 3.0 }]), 2.4, C, b.M(0, 0, 0)); // le grand arc
    extrude(b, arched(2.4, 3.9, [{ x: 0, w: .86, h: 1.95 }]), .2, C, b.M(-2.32, 0, 0, 0, PI / 2, 0)); extrude(b, arched(2.4, 3.9, [{ x: 0, w: .86, h: 1.95 }]), .2, C, b.M(2.32, 0, 0, 0, PI / 2, 0)); // petits arcs des côtés
    b.box(4.8, .14, 2.6, D, 0, .07, 0); // socle
    for (const sx of [-1, 1]) b.box(1.62, .12, 2.55, D, sx * 1.56, 2.28, 0); // corniche d'imposte (de part et d'autre de l'arc)
    b.box(4.85, .2, 2.65, D, 0, 3.95, 0); b.box(4.6, .85, 2.4, C, 0, 4.47, 0); b.box(4.75, .14, 2.55, D, 0, 4.95, 0); // grande corniche, attique, couronnement
    b.P(0);
    for (const x of [-2.31, 2.31]) b.add(new THREE.BoxGeometry(.02, 1.5, .8), 0x4a4238, b.M(x, .78, 0), 0, false); // fond des petits arcs
    for (const z of [-1.21, 1.21]) { archRing(b, .78, .055, D, 0, 2.25, z); // archivolte
      b.box(4.4, .28, .05, 0xdcd0b4, 0, 3.55, z); for (let i = 0; i < 22; i++) ell(b, 0xcfc2a2, -2.1 + i * .2, 3.55, z + Math.sign(z) * .03, .06, .09, .03); // frise sculptée
      for (let i = 0; i < 10; i++) { b.add(new THREE.CylinderGeometry(.075, .075, .03, 12), 0xd8ccae, b.M(-2.0 + i * .445, 4.45, z + Math.sign(z) * .02, PI / 2, 0, 0), 0, true); } // boucliers de l'attique
      for (const x of [-1.55, 1.55]) { const zz = z + Math.sign(z) * .06; b.box(1.0, 1.35, .06, 0xdcd0b4, x, .95, zz - Math.sign(z) * .03); // groupes sculptés (la Marseillaise…)
        const sz = Math.sign(z); for (let k = 0; k < 4; k++) { const fx = x - .33 + k * .22, lean = (k - 1.5) * .14, fy = .45; // personnages drapés
          ell(b, 0xd2c6a6, fx, fy + .26, zz + sz * .05, .075, .23, .05, 0, 0, lean); ell(b, 0xd8ccb0, fx - lean * .25, fy + .55, zz + sz * .06, .05, .056, .045);
          rod(b, [fx, fy + .4, zz + sz * .07], [fx + (k % 2 ? .15 : -.15), fy + .62 + (k % 2) * .1, zz + sz * .07], .018, 0xd2c6a6); }
        ell(b, 0xd2c6a6, x, 1.3, zz + sz * .06, .06, .16, .05); ell(b, 0xd8ccb0, x, 1.5, zz + sz * .07, .045, .05, .04); for (const s2 of [-1, 1]) ell(b, 0xd8ccb0, x + s2 * .17, 1.4, zz + sz * .05, .17, .06, .02, 0, 0, s2 * .5); // génie ailé
        rod(b, [x + .05, 1.4, zz + sz * .08], [x + .22, 1.72, zz + sz * .08], .015, 0xd2c6a6); // son glaive
        b.box(1.2, .55, .04, 0xdcd0b4, x, 3.0, zz - sz * .02); for (let k = 0; k < 7; k++) { const fx = x - .45 + k * .15; ell(b, 0xd2c6a6, fx, 2.95, zz + sz * .02, .04, .12, .03, 0, 0, (k % 3 - 1) * .2); ell(b, 0xd8ccb0, fx, 3.13, zz + sz * .025, .03, .033, .025); } } }
    // drapeau tricolore suspendu sous la voûte
    for (let i = 0; i < 3; i++) b.add(new THREE.BoxGeometry(.4, 1.8, .015), [0x1f4ea8, 0xf6f6f6, 0xd8283a][i], b.M(-.4 + i * .4, 1.95, 0), 0, false); b.box(1.3, .03, .03, GOLD, 0, 2.87, 0);
    b.box(.9, .06, .5, 0x8a8478, 0, .17, 0); b.add(new THREE.SphereGeometry(.07, 8, 6), 0xffa040, b.M(0, .27, 0), 1, true); // tombe du Soldat inconnu, flamme
    b.S(null); return b.done(); };

  // =====================================================================
  // 3. PYRAMIDE DU LOUVRE
  // =====================================================================
  MD.pyramide_louvre = () => { const b = G.mb(5120), sk = SK(), A = 4.0, H = 2.6, M = 0x3a3e44; b.S(sk.stone); b.P(PT.carrelage || 11);
    b.box(4.9, .08, 4.9, 0xd8d4cc, 0, .04, 0); b.P(0); b.box(4.3, .14, 4.3, 0xc8c2b6, 0, .1, 0);
    for (const [x, z] of [[-1.9, 1.9], [1.9, 1.9], [-1.9, -1.9], [1.9, -1.9]]) { b.box(.8, .1, .8, 0xc8c2b6, x, .1, z); b.S(sk.glass); b.box(.68, .02, .68, 0x3a6a8a, x, .16, z); b.S(sk.stone); b.add(new THREE.ConeGeometry(.03, .4, 6), 0xffffff, b.M(x, .36, z), 2, false); } // bassins et jets
    b.S(sk.glass); const y0 = .17, apex = [0, y0 + H, 0], C = [[-A / 2, y0, A / 2], [A / 2, y0, A / 2], [A / 2, y0, -A / 2], [-A / 2, y0, -A / 2]];
    for (let s = 0; s < 4; s++) { const p0 = C[s], p1 = C[(s + 1) % 4], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...apex], 3)); g.computeVertexNormals(); b.add(g, GLASS, new THREE.Matrix4(), 2, false); }
    b.S(sk.steel); for (let s = 0; s < 4; s++) { const p0 = C[s], p1 = C[(s + 1) % 4], N = 12, lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
      beam(b, p0, apex, .05, M); beam(b, p0, p1, .06, M);
      for (let i = 1; i < N; i++) { const t = i / N; beam(b, lerp(p0, apex, t), lerp(p1, apex, t), .016, M); } // horizontales
      for (let i = 1; i < N; i++) { const t = i / N; beam(b, lerp(p0, p1, t), lerp(p0, apex, 1 - t), .012, M); beam(b, lerp(p0, p1, t), lerp(p1, apex, t), .012, M); } } // losanges
    b.S(null); return b.done(); };

  // =====================================================================
  // 4. STATUE DE LA LIBERTÉ
  // =====================================================================
  MD.statue_liberte = () => { const b = G.mb(5130), sk = SK(), CU = 0x6fb3a0, CU2 = 0x5a9a88, GR = 0xc8beae; b.S(sk.stone);
    const star = new THREE.Shape(); for (let i = 0; i < 22; i++) { const a = i / 22 * TAU - PI / 2, r = i % 2 ? 1.0 : 1.45; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    b.P(PT.pierre); b.add(new THREE.ExtrudeGeometry(star, { depth: .5, bevelEnabled: false }), 0xb8b0a0, b.M(0, .5, 0, PI / 2, 0, 0), 0, false);
    b.box(1.75, .55, 1.75, GR, 0, .78, 0); b.box(1.38, 2.9, 1.38, GR, 0, 2.5, 0); b.P(0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.26, 2.9, .26, 0xd2c8b8, sx * .62, 2.5, sz * .62);
    for (let i = 0; i < 4; i++) { const ry = i * PI / 2, f = (x, y, z) => [Math.sin(ry) * z + Math.cos(ry) * x, y, Math.cos(ry) * z - Math.sin(ry) * x];
      b.add(new THREE.BoxGeometry(.7, .9, .05), 0x3a3a3c, b.M(...f(0, 3.2, .69), 0, ry, 0), 0, false); for (const x of [-.24, 0, .24]) b.add(new THREE.CylinderGeometry(.04, .04, .9, 10), 0xd8ceb8, b.M(...f(x, 3.2, .73), 0, ry, 0), 0, true); // loggia
      b.add(new THREE.CylinderGeometry(.16, .16, .03, 14), 0xd8ceb8, b.M(...f(0, 2.0, .7), PI / 2, ry, 0), 0, true); }
    b.box(1.55, .14, 1.55, 0xd2c8b8, 0, 4.0, 0); b.box(1.2, .55, 1.2, GR, 0, 4.35, 0); b.box(1.32, .08, 1.32, 0xd2c8b8, 0, 4.66, 0);
    // la statue, en cuivre vert-de-gris
    b.S(sk.steel); const y = 4.7; b.box(.85, .2, .85, CU2, 0, y + .1, 0);
    lathe(b, [[.5, 0], [.46, .5], [.4, 1.2], [.33, 1.9], [.36, 2.25], [.4, 2.55], [.3, 2.75], [.13, 2.85], [0, 2.86]], CU, 0, y + .2, 0, 24);
    for (let i = 0; i < 9; i++) { const a = -.8 + i * .2; ell(b, CU2, Math.sin(a) * .45, y + 1.15, Math.cos(a) * .43, .035, .95, .05, 0, a, 0); } // plis de la toge
    rod(b, [-.35, y + 2.0, .2], [.35, y + 2.75, .22], .07, CU2); // l'étole en travers
    ell(b, CU, 0, y + 3.18, .02, .22, .27, .23); ell(b, CU2, 0, y + 3.25, -.12, .2, .2, .16); ell(b, CU, 0, y + 3.13, .22, .04, .06, .05); // tête, chignon, nez
    b.tor(.23, .04, CU2, 0, y + 3.32, .01, PI / 2 - .15); for (let i = 0; i < 7; i++) { const a = -PI * .5 + i * PI / 6; rod(b, [Math.sin(a) * .22, y + 3.36, Math.cos(a) * .22], [Math.sin(a) * .5, y + 3.65, Math.cos(a) * .5], .045, CU, 6, 0, .005); } // couronne à sept rayons
    rod(b, [.3, y + 2.62, 0], [.42, y + 3.3, .05], .09, CU); rod(b, [.42, y + 3.3, .05], [.48, y + 4.05, .08], .075, CU); ell(b, CU, .48, y + 4.1, .08, .08, .09, .08); // bras levé
    rod(b, [.48, y + 4.05, .08], [.5, y + 4.55, .09], .045, CU2); lathe(b, [[.05, 0], [.18, .08], [.21, .16], [.23, .2]], CU2, .5, y + 4.5, .09, 16);
    b.S(SK().gold); lathe(b, [[.2, 0], [.22, .12], [.17, .3], [.08, .48], [0, .6]], GOLD, .5, y + 4.7, .09, 16, 1); b.S(sk.steel); // la flamme dorée
    rod(b, [-.3, y + 2.5, .05], [-.42, y + 2.0, .25], .085, CU); b.add(new THREE.BoxGeometry(.38, .6, .08), CU2, b.M(-.38, y + 1.95, .33, -.15, 0, .2), 0, false); // la tablette
    b.S(null); return b.done(); };

  // =====================================================================
  // 5. BIG BEN
  // =====================================================================
  MD.big_ben = () => { const b = G.mb(5140), sk = SK(), C = 0xd9c28c, D = 0xc4aa72, W = 2.0; b.S(sk.stone);
    b.P(PT.pierre); b.box(2.5, .45, 2.5, D, 0, .22, 0); b.box(W, 8.6, W, C, 0, 4.75, 0); b.P(0);
    for (let i = 0; i < 4; i++) { const ry = i * PI / 2, f = (x, y, z) => [Math.sin(ry) * z + Math.cos(ry) * x, y, Math.cos(ry) * z - Math.sin(ry) * x];
      for (let k = 0; k < 6; k++) { const x = -.83 + k * .332; b.add(new THREE.BoxGeometry(.05, 8.4, .05), D, b.M(...f(x, 4.7, W / 2 + .02), 0, ry, 0), 0, false); } // nervures gothiques
      for (let lv = 0; lv < 7; lv++) { b.add(new THREE.BoxGeometry(W + .04, .06, .06), D, b.M(...f(0, 1.4 + lv * 1.15, W / 2 + .02), 0, ry, 0), 0, false);
        for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(.13, .55, .02), lv > 4 ? 0xffe2a0 : 0x3a3328, b.M(...f(-.664 + k * .332, 1.85 + lv * 1.15, W / 2 + .035), 0, ry, 0), lv > 4 ? 1 : 0, false); }
      // le cadran (éclairé la nuit) et son cadre doré
      b.add(new THREE.BoxGeometry(2.25, 2.25, .1), C, b.M(...f(0, 10.15, 1.08), 0, ry, 0), 0, false);
      b.add(new THREE.CylinderGeometry(.82, .82, .06, 40), 0xfaf2da, b.M(...f(0, 10.15, 1.15), PI / 2, ry, 0), 1, true); b.S(sk.gold);
      b.add(new THREE.TorusGeometry(.84, .05, 8, 40), GOLD, b.M(...f(0, 10.15, 1.17), 0, ry, 0), 0, true); b.add(new THREE.TorusGeometry(.58, .02, 6, 40), GOLD, b.M(...f(0, 10.15, 1.18), 0, ry, 0), 0, true);
      for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; b.add(new THREE.BoxGeometry(.2, .2, .04), GOLD, b.M(...f(Math.cos(a) * 1.0, 10.15 + Math.sin(a) * 1.0, 1.15), 0, ry, a), 0, false); }
      b.S(sk.stone); for (let k = 0; k < 12; k++) { const a = k * TAU / 12; b.add(new THREE.BoxGeometry(.04, .13, .02), 0x1c1c1e, b.M(...f(Math.sin(a) * .7, 10.15 + Math.cos(a) * .7, 1.19), 0, ry, -a), 0, false); }
      b.add(new THREE.BoxGeometry(.05, .5, .02), 0x1c1c1e, b.M(...f(-.12, 10.32, 1.2), 0, ry, .5), 0, false); b.add(new THREE.BoxGeometry(.035, .68, .02), 0x1c1c1e, b.M(...f(.22, 10.25, 1.21), 0, ry, -1.2), 0, false); // aiguilles (10 h 10)
      // le beffroi ajouré
      for (let k = 0; k < 3; k++) b.add(new THREE.BoxGeometry(.32, .75, .04), 0x2a2622, b.M(...f(-.55 + k * .55, 11.85, .96), 0, ry, 0), 0, false); }
    b.P(PT.pierre); b.box(2.3, .2, 2.3, D, 0, 11.35, 0); b.box(1.95, 1.0, 1.95, C, 0, 11.85, 0); b.box(2.15, .15, 2.15, D, 0, 12.42, 0); b.P(0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.box(.2, 1.3, .2, D, sx * 1.02, 11.9, sz * 1.02); b.cone(.12, .6, 8, SLATE, sx * 1.02, 12.85, sz * 1.02); b.S(sk.gold); b.add(new THREE.SphereGeometry(.05, 8, 6), GOLD, b.M(sx * 1.02, 13.17, sz * 1.02), 0, true); b.S(sk.stone); }
    b.P(PT.ardoise); frustum(b, 1.95, .1, 2.2, SLATE, 0, 12.5, 0); b.P(0); b.S(sk.gold);
    for (let i = 0; i < 4; i++) { const ry = i * PI / 2; b.add(new THREE.BoxGeometry(.24, .34, .1), GOLD, b.M(Math.sin(ry) * .58, 13.2, Math.cos(ry) * .58, -.4, ry, 0), 0, false); }
    rod(b, [0, 14.6, 0], [0, 15.4, 0], .04, GOLD); ell(b, GOLD, 0, 15.0, 0, .08, .08, .08); b.add(new THREE.BoxGeometry(.3, .04, .04), GOLD, b.M(0, 15.25, 0), 0, false);
    b.S(null); return b.done(); };

  // =====================================================================
  // 6. TOUR DE PISE (penchée de 4°)
  // =====================================================================
  MD.tour_pise = () => { const b = G.mb(5150), sk = SK(), C = 0xf3efe6, D = 0xd8d2c4; b.S(sk.stone);
    b.cyl(.88, .92, 1.4, 32, C, 0, .7, 0); for (let i = 0; i < 15; i++) { const a = i / 15 * TAU; b.add(new THREE.CylinderGeometry(.04, .04, 1.2, 8), D, b.M(Math.sin(a) * .9, .7, Math.cos(a) * .9), 0, true); b.add(new THREE.TorusGeometry(.17, .025, 5, 10, PI), D, b.M(Math.sin(a + PI / 15) * .9, 1.2, Math.cos(a + PI / 15) * .9, 0, a + PI / 15 + PI / 2, 0), 0, true); }
    for (let lv = 0; lv < 6; lv++) { const y = 1.4 + lv * 1.0; b.cyl(.95, .95, .08, 32, D, 0, y + .04, 0); b.cyl(.68, .68, 1.0, 28, C, 0, y + .5, 0);
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; b.add(new THREE.CylinderGeometry(.035, .04, .8, 8), C, b.M(Math.sin(a) * .87, y + .48, Math.cos(a) * .87), 0, true);
        b.add(new THREE.TorusGeometry(.11, .022, 4, 8, PI), D, b.M(Math.sin(a + PI / 24) * .87, y + .88, Math.cos(a + PI / 24) * .87, 0, a + PI / 24 + PI / 2, 0), 0, true);
        if (i % 2 === 0) b.add(new THREE.BoxGeometry(.12, .4, .02), 0x2c2a28, b.M(Math.sin(a) * .69, y + .5, Math.cos(a) * .69, 0, a, 0), 0, false); } }
    b.cyl(.95, .95, .1, 32, D, 0, 7.45, 0); b.cyl(.58, .58, .9, 24, C, 0, 7.95, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.add(new THREE.CylinderGeometry(.03, .03, .7, 8), C, b.M(Math.sin(a) * .66, 7.9, Math.cos(a) * .66), 0, true); if (i % 2) b.add(new THREE.BoxGeometry(.18, .45, .02), 0x2c2a28, b.M(Math.sin(a) * .59, 7.95, Math.cos(a) * .59, 0, a, 0), 0, false); }
    b.cyl(.72, .72, .08, 24, D, 0, 8.42, 0); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.add(new THREE.BoxGeometry(.08, .16, .08), C, b.M(Math.sin(a) * .66, 8.54, Math.cos(a) * .66), 0, false); }
    b.S(null); const g = b.done(); g.applyMatrix4(new THREE.Matrix4().makeRotationX(.07)); g.translate(0, -.03, 0); g.computeBoundingSphere(); g.computeBoundingBox(); return g; };

  // =====================================================================
  // 7. COLISÉE
  // =====================================================================
  MD.colisee = () => { const b = G.mb(5160), sk = SK(), C = 0xdccfb2, D = 0xcbbd9c, RX = 3.7, RZ = 3.15, N = 48, rnd = G.rng(5160); b.S(sk.stone);
    const P = (a, k) => [Math.cos(a) * RX * k, Math.sin(a) * RZ * k], tan = a => Math.atan2(-Math.cos(a) * RZ, -Math.sin(a) * RX);
    const ruined = a => { const d = Math.atan2(Math.sin(a - 2.4), Math.cos(a - 2.4)); return Math.abs(d) < .85; };
    b.P(PT.pierre);
    for (let i = 0; i < N; i++) { const a = i / N * TAU, a2 = (i + .5) / N * TAU, [x, z] = P(a, 1), ry = tan(a), ru = ruined(a), top = ru ? 1.25 + rnd() * 1.4 : 4.75;
      for (let t = 0; t < 3; t++) { const y0 = .2 + t * 1.25; if (y0 > top) break; const hh = Math.min(1.25, top - y0);
        b.add(new THREE.BoxGeometry(.15, hh, .5), C, b.M(x, y0 + hh / 2, z, 0, ry, 0), 0, false); // pilier
        if (hh > 1.1) { const [ax, az] = P(a2, 1), [dx, dz] = P(a2, .955); b.add(new THREE.BoxGeometry(.34, 1.0, .03), 0x5a4e3c, b.M(dx, y0 + .5, dz, 0, tan(a2), 0), 0, false); archRing(b, .17, .035, D, ax, y0 + .85, az, tan(a2), 0); // couloir dans l'ombre, arc b.add(new THREE.BoxGeometry(.48, .2, .48), C, b.M(ax, y0 + 1.15, az, 0, tan(a2), 0), 0, false); // arc et linteau
          b.add(new THREE.CylinderGeometry(.045, .05, .95, 8), D, b.M(...(() => { const [cx, cz] = P(a, 1.075); return [cx, y0 + .5, cz]; })()), 0, true); } } // colonne engagée
      if (!ru) { const [ax, az] = P(a2, 1); b.add(new THREE.BoxGeometry(.48, 1.0, .5), C, b.M(ax, 4.25, az, 0, tan(a2), 0), 0, false); b.add(new THREE.BoxGeometry(.2, 1.0, .5), C, b.M(x, 4.25, z, 0, ry, 0), 0, false); if (i % 2) b.add(new THREE.BoxGeometry(.14, .2, .04), 0x4a4238, b.M(...(() => { const [cx, cz] = P(a2, 1.075); return [cx, 4.2, cz]; })(), 0, tan(a2), 0), 0, false); }
      for (let t = 1; t <= 3; t++) { const y = .2 + t * 1.25; if (y > top + .05) continue; b.add(new THREE.BoxGeometry(.5, .07, .62), D, b.M(...(() => { const [cx, cz] = P(a2, 1.01); return [cx, y, cz]; })(), 0, tan(a2), 0), 0, false); } }
    b.P(0); // les gradins et l'arène
    for (let k = 0; k < 5; k++) { const s = .9 - k * .1, y = 2.4 - k * .48; b.add(new THREE.CylinderGeometry(1, 1, .45, 48, 1, true), D, b.M(0, y, 0, 0, 0, 0, RX * s, 1, RZ * s), 0, false); b.add(new THREE.RingGeometry(.88, 1, 48), shade(D, 1 - k * .03), b.M(0, y + .225, 0, -PI / 2, 0, 0, RX * s, RZ * s, 1), 0, false); }
    b.add(new THREE.CylinderGeometry(1, 1, .3, 40), 0xe0c89a, b.M(0, .2, 0, 0, 0, 0, RX * .48, 1, RZ * .48), 0, false);
    for (let k = -3; k <= 3; k++) b.add(new THREE.BoxGeometry(.04, .02, RZ * .8), 0x7a6648, b.M(k * .38, .36, 0), 0, false); // souterrains
    for (let i = 0; i < 14; i++) { const a = 2.4 + (rnd() - .5) * 1.4, [x, z] = P(a, 1.25 + rnd() * .2); b.add(new THREE.BoxGeometry(.3 + rnd() * .3, .18, .25), C, b.M(x, .09, z, rnd(), rnd() * 3, 0), 0, false); } // blocs tombés
    b.S(null); return b.done(); };
  const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();

  // =====================================================================
  // 9. SACRÉ-CŒUR
  // =====================================================================
  MD.sacre_coeur = () => { const b = G.mb(5180), sk = SK(), W = 0xf7f5ee, D = 0xe6e2d6; b.S(sk.stone);
    for (let i = 0; i < 5; i++) b.box(4.6 - i * .2, .14, .5, D, 0, .07 + i * .14, 3.1 - i * .3); // le grand escalier
    b.P(PT.pierre); b.box(3.6, 2.6, 1.3, W, 0, 1.6, 1.95); b.box(4.8, 3.2, 3.6, W, 0, 1.9, -.4); b.box(2.6, 3.0, 1.6, W, 0, 1.8, -2.6); b.P(0);
    extrude(b, arched(3.4, 2.0, [{ x: -1.05, w: .72, h: 1.5 }, { x: 0, w: .8, h: 1.65 }, { x: 1.05, w: .72, h: 1.5 }]), .1, D, b.M(0, .3, 2.66));
    b.add(new THREE.BoxGeometry(3.2, 1.6, .02), 0x3a3430, b.M(0, 1.0, 2.58), 0, false);
    for (const sx of [-1, 1]) { b.box(.4, .5, .5, D, sx * 1.95, 2.95, 2.4); ell(b, 0x6a5a3a, sx * 1.95, 3.45, 2.4, .16, .28, .26); } // statues équestres
    b.box(3.8, .2, 1.45, D, 0, 3.0, 1.95); b.box(1.2, .9, .2, W, 0, 3.45, 2.5); b.cone(.8, .5, 4, W, 0, 4.15, 2.5, 0, PI / 4, 0);
    // le grand dôme sur son tambour à colonnes
    const dy = 3.5; b.cyl(1.25, 1.3, .3, 32, D, 0, dy + .15, -.4); b.cyl(1.05, 1.05, 1.6, 32, W, 0, dy + 1.1, -.4);
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; b.add(new THREE.CylinderGeometry(.05, .055, 1.45, 8), D, b.M(Math.cos(a) * 1.12, dy + 1.05, -.4 + Math.sin(a) * 1.12), 0, true); if (i % 2) b.add(new THREE.BoxGeometry(.18, .7, .02), 0x3c3c48, b.M(Math.cos(a) * 1.06, dy + 1.1, -.4 + Math.sin(a) * 1.06, 0, -a + PI / 2, 0), 0, false); }
    b.cyl(1.22, 1.22, .14, 32, D, 0, dy + 1.95, -.4);
    lathe(b, [[1.12, 0], [1.14, .4], [1.06, .95], [.86, 1.5], [.55, 1.95], [.25, 2.25], [0, 2.38]], W, 0, dy + 2.0, -.4, 32);
    b.cyl(.22, .24, .55, 16, W, 0, dy + 4.62, -.4); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(new THREE.CylinderGeometry(.02, .02, .45, 6), D, b.M(Math.cos(a) * .24, dy + 4.62, -.4 + Math.sin(a) * .24), 0, true); }
    lathe(b, [[.26, 0], [.24, .12], [.14, .3], [0, .38]], W, 0, dy + 4.9, -.4, 16); b.S(sk.gold); rod(b, [0, dy + 5.25, -.4], [0, dy + 5.75, -.4], .025, GOLD); b.add(new THREE.BoxGeometry(.2, .03, .03), GOLD, b.M(0, dy + 5.62, -.4), 0, false); b.S(sk.stone);
    // les quatre petits dômes
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 1.85, z = -.4 + sz * 1.35; b.cyl(.38, .4, .9, 20, W, x, 3.95, z); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(new THREE.CylinderGeometry(.025, .025, .8, 6), D, b.M(x + Math.cos(a) * .41, 3.95, z + Math.sin(a) * .41), 0, true); }
      lathe(b, [[.4, 0], [.4, .2], [.3, .55], [.15, .75], [0, .82]], W, x, 4.4, z, 20); rod(b, [x, 5.2, z], [x, 5.5, z], .03, D); }
    // le campanile
    b.P(PT.pierre); b.box(1.0, 6.4, 1.0, W, 0, 3.2, -2.75); b.P(0); for (let i = 0; i < 4; i++) { const ry = i * PI / 2; b.add(new THREE.BoxGeometry(.3, .8, .02), 0x3a3430, b.M(Math.sin(ry) * .51, 5.6, -2.75 + Math.cos(ry) * .51, 0, ry, 0), 0, false); }
    b.box(1.15, .15, 1.15, D, 0, 6.45, -2.75); b.cyl(.42, .45, .7, 16, W, 0, 6.9, -2.75); lathe(b, [[.45, 0], [.44, .3], [.3, .7], [.12, .95], [0, 1.02]], W, 0, 7.25, -2.75, 20);
    b.S(sk.gold); rod(b, [0, 8.25, -2.75], [0, 8.75, -2.75], .025, GOLD); b.S(null); return b.done(); };

  // =====================================================================
  // 10. OBÉLISQUE DE LA CONCORDE
  // =====================================================================
  MD.obelisque = () => { const b = G.mb(5190), sk = SK(), P = 0xc99a88; b.S(sk.stone);
    b.box(1.6, .2, 1.6, 0x9a9ea4, 0, .1, 0); b.box(1.3, 1.3, 1.3, 0x8a8e94, 0, .85, 0); b.box(1.42, .14, 1.42, 0x9a9ea4, 0, 1.55, 0); b.box(1.1, .3, 1.1, 0x8a8e94, 0, 1.77, 0);
    b.S(sk.gold); for (let i = 0; i < 4; i++) { const ry = i * PI / 2; b.add(new THREE.BoxGeometry(.8, .7, .02), 0x6a6e74, b.M(Math.sin(ry) * .66, .85, Math.cos(ry) * .66, 0, ry, 0), 0, false); for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(.6, .03, .01), GOLD, b.M(Math.sin(ry) * .675, .65 + k * .13, Math.cos(ry) * .675, 0, ry, 0), 0, false); }
    b.S(sk.stone); frustum(b, .62, .4, 6.4, P, 0, 1.92, 0); b.S(sk.gold); frustum(b, .4, .02, .55, GOLD, 0, 8.32, 0); b.S(sk.stone);
    for (let i = 0; i < 4; i++) { const ry = i * PI / 2; for (let c = -1; c <= 1; c++) for (let k = 0; k < 16; k++) { const y = 2.3 + k * .36, half = .31 - (y - 1.92) / 6.4 * .11, sl = .11 / 6.4 * .5;
        b.add(new THREE.BoxGeometry(.07, .1 + (k * 7 + c * 3) % 3 * .04, .012), 0x7a5a4a, b.M(Math.sin(ry) * (half + .005) + Math.cos(ry) * c * .16 * (half / .31), y, Math.cos(ry) * (half + .005) - Math.sin(ry) * c * .16 * (half / .31), -sl, ry, 0), 0, false); } }
    b.S(null); return b.done(); };

  // =====================================================================
  // 11. MOULIN ROUGE (les ailes tournent)
  // =====================================================================
  MD.moulin_rouge = () => { const b = G.mb(5200), sk = SK(), R = 0xb8282a, R2 = 0x8a1a1c; b.S(sk.paint);
    b.P(PT.crepi); b.box(3.8, 3.0, 2.4, R, .1, 1.5, -.2); b.P(0); b.box(4.0, .16, 2.6, 0x2a1a1a, .1, 3.08, -.2);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -1.4 + i * .7 + .1, y = 1.35 + j * 1.0; b.box(.36, .55, .04, 0xffe2a0, x, y, 1.0, 0, 0, 0, 1); b.box(.46, .06, .06, 0xf6f0e6, x, y - .32, 1.02); b.box(.46, .06, .06, 0xf6f0e6, x, y + .32, 1.02); }
    b.box(3.4, .14, .7, 0x1a1a1a, .1, .92, 1.25); for (let i = 0; i < 18; i++) b.add(new THREE.SphereGeometry(.035, 8, 6), WARM, b.M(-1.5 + i * .19, .84, 1.6), 1, true); // marquise et ampoules
    b.box(1.0, .8, .04, 0x2a1418, .1, .4, .98);
    neon(b, 'MOULIN ROUGE', .1, 3.25, 1.02, .055, 0xff3040); b.box(4.0, .55, .06, 0x1a1012, .1, 3.45, .98);
    // le moulin
    b.cyl(.62, .72, 2.2, 8, R, -1.15, 4.25, -.62); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(new THREE.BoxGeometry(.04, 2.2, .04), 0xf6e6c6, b.M(-1.15 + Math.cos(a) * .66, 4.25, -.62 + Math.sin(a) * .66), 0, false); }
    b.cone(.82, .8, 8, R2, -1.15, 5.75, -.62); b.add(new THREE.SphereGeometry(.12, 10, 8), 0xffd23f, b.M(-1.15, 5.0, .08), 1, true);
    b.S(null); return b.done(); };
  MD.moulin_rouge_ailes = () => { const b = G.mb(5201); for (let i = 0; i < 4; i++) { const a = i * PI / 2, c = Math.cos(a), s = Math.sin(a); b.add(new THREE.BoxGeometry(.06, 1.7, .04), 0x6a1a1a, b.M(c * .85, s * .85, 0, 0, 0, a - PI / 2), 0, false);
      for (let k = 0; k < 5; k++) { const r = .45 + k * .27; b.add(new THREE.BoxGeometry(.38, .03, .03), 0xd8282a, b.M(c * r - s * .2, s * r + c * .2, 0, 0, 0, a), 0, false); b.add(new THREE.SphereGeometry(.03, 6, 4), WARM, b.M(c * r - s * .4, s * r + c * .4, .02), 1, true); }
      beam(b, [c * .3, s * .3, 0], [c * 1.7 - s * .4, s * 1.7 + c * .4, 0], .03, 0x6a1a1a); beam(b, [c * 1.7, s * 1.7, 0], [c * 1.7 - s * .4, s * 1.7 + c * .4, 0], .03, 0x6a1a1a); }
    b.add(new THREE.CylinderGeometry(.1, .1, .12, 10), 0x3a1a1a, b.M(0, 0, 0, PI / 2, 0, 0), 0, true); return b.done(); };

  // =====================================================================
  // 12. COLOSSES : MOAÏ, CHRIST RÉDEMPTEUR
  // =====================================================================
  MD.moai = () => { const b = G.mb(5210), sk = SK(), C = 0x6e6a64, D = 0x5a5650; b.S(sk.stone); b.jit(.06);
    b.P(PT.moellons); b.box(1.9, .4, 1.5, 0x7a766e, 0, .2, 0); b.P(0);
    b.box(1.05, 1.3, .75, C, 0, 1.05, 0); for (const s of [-1, 1]) ell(b, D, s * .25, 1.0, .38, .06, .32, .03, 0, 0, s * 1.3); // torse, mains sculptées
    b.box(.92, 1.5, .78, C, 0, 2.4, .02); b.box(.98, .2, .3, D, 0, 2.78, .3); // tête, arcade
    b.add(new THREE.ConeGeometry(.17, .75, 4), C, b.M(0, 2.42, .38, -.12, PI / 4, 0, 1, 1, .7), 0, false); // le nez
    b.box(.42, .08, .14, D, 0, 1.98, .38); b.box(.5, .25, .2, C, 0, 1.75, .3); // lèvres, menton
    for (const s of [-1, 1]) { b.box(.1, .9, .2, D, s * .5, 2.4, .02); ell(b, 0xf2f0ea, s * .21, 2.6, .42, .08, .05, .02); ell(b, 0x1c1a18, s * .21, 2.6, .44, .035, .035, .01); } // oreilles, yeux de corail
    b.jit(0); b.cyl(.4, .44, .45, 16, 0xa04a3a, 0, 3.4, -.02); b.cyl(.28, .3, .1, 16, 0x8a3a2e, 0, 3.67, -.02); // le pukao
    b.S(null); return b.done(); };
  MD.christ_redempteur = () => { const b = G.mb(5220), sk = SK(), W = 0xeeeae0, D = 0xd8d4c8, rnd = G.rng(5220); b.S(sk.stone);
    for (let i = 0; i < 9; i++) ell(b, i % 2 ? 0x8a8478 : 0x7a8a5a, (rnd() - .5) * 1.8, .3 + rnd() * .4, (rnd() - .5) * 1.8, .5 + rnd() * .3, .4 + rnd() * .3, .5 + rnd() * .3); // le Corcovado
    b.P(PT.pierre); b.box(1.6, .6, 1.6, D, 0, 1.0, 0); b.box(1.15, 2.0, 1.15, W, 0, 2.3, 0); b.box(1.3, .12, 1.3, D, 0, 3.32, 0); b.P(0);
    b.add(new THREE.BoxGeometry(.4, .8, .02), 0x4a3a2a, b.M(0, 1.7, .58), 0, false);
    lathe(b, [[.42, 0], [.38, .8], [.33, 1.8], [.36, 2.6], [.42, 3.2], [.38, 3.5], [.2, 3.65], [0, 3.68]], W, 0, 3.38, 0, 24);
    for (let i = 0; i < 7; i++) { const a = -.6 + i * .2; ell(b, D, Math.sin(a) * .36, 4.6, Math.cos(a) * .35, .03, 1.1, .04, 0, a, 0); }
    b.box(3.2, .3, .32, W, 0, 6.6, 0); for (const s of [-1, 1]) { ell(b, W, s * 1.0, 6.42, 0, .55, .22, .18); ell(b, W, s * 1.62, 6.6, 0, .1, .1, .09); } // bras ouverts, manches, mains
    ell(b, W, 0, 7.12, .02, .2, .25, .21); ell(b, D, 0, 7.18, -.08, .2, .22, .17); ell(b, W, 0, 7.06, .2, .03, .05, .04); // tête, cheveux
    ell(b, 0xd8d0c0, 0, 6.2, .38, .08, .1, .03); // le cœur
    b.S(null); return b.done(); };

  // =====================================================================
  // 13. COLISÉE GREC : PARTHÉNON
  // =====================================================================
  MD.parthenon = () => { const b = G.mb(5230), sk = SK(), M = 0xeee5d2, D = 0xdcd0b6, rnd = G.rng(5230); b.S(sk.stone);
    for (let i = 0; i < 3; i++) b.box(5.0 - i * .25, .16, 8.0 - i * .25, D, 0, .08 + i * .16, 0);
    const y0 = .48, col = (x, z, h) => { b.add(new THREE.CylinderGeometry(.17, .2, h, 20), M, b.M(x, y0 + h / 2, z), 0, false); if (h > 2.4) { lathe(b, [[.18, 0], [.27, .12], [.27, .16]], D, x, y0 + h, z, 16); b.box(.5, .1, .5, D, x, y0 + h + .21, z); } };
    const H = 2.6, xs = [], zs = []; for (let i = 0; i < 8; i++) xs.push(-2.1 + i * .6); for (let i = 0; i < 13; i++) zs.push(-3.6 + i * .6);
    const broken = new Set([4, 5, 6]);
    for (const x of xs) { col(x, 3.6, H); col(x, -3.6, H); }
    for (let i = 1; i < 12; i++) { col(-2.1, zs[i], H); if (broken.has(i)) col(2.1, zs[i], .5 + rnd() * .8); else col(2.1, zs[i], H); }
    for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(.19, .19, .45, 20), D, b.M(3.0 + rnd() * .5, .2, -.8 + i * .45 + rnd() * .2, 0, rnd(), PI / 2), 0, false); // tambours tombés
    const yE = y0 + H + .26; b.box(4.7, .35, 7.7, M, 0, yE + .17, 0); // architrave
    for (let i = 0; i < 36; i++) { const t = i / 36; for (const [x, z, ry] of [[-2.36 + t * 4.72, 3.86, 0], [-2.36 + t * 4.72, -3.86, 0], [2.36, -3.8 + t * 7.6, PI / 2], [-2.36, -3.8 + t * 7.6, PI / 2]]) if (!(ry && x > 0 && t > .3 && t < .6)) b.add(new THREE.BoxGeometry(.08, .32, .03), i % 2 ? 0xbfb296 : M, b.M(x, yE + .52, z, 0, ry, 0), 0, false); } // triglyphes
    b.box(4.9, .12, 7.9, D, 0, yE + .74, 0);
    for (const z of [3.85, -3.85]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-2.45, 0, 0, 2.45, 0, 0, 0, .75, 0], 3)); g.computeVertexNormals(); b.add(g, M, b.M(0, yE + .8, z, 0, z > 0 ? 0 : PI, 0), 0, false);
      for (let k = 0; k < 7; k++) ell(b, 0xe2d8c0, -1.3 + k * .43, yE + .95 - Math.abs(k - 3) * .08, z + Math.sign(z) * .03, .1, .14 - Math.abs(k - 3) * .02, .04); }
    b.P(PT.pierre); b.box(3.2, 1.6, 5.5, 0xe6dcc4, 0, y0 + .8, -.2); b.P(0); // la cella, en ruine
    b.S(null); return b.done(); };

  // =====================================================================
  // 14. TAJ MAHAL
  // =====================================================================
  MD.taj_mahal = () => { const b = G.mb(5240), sk = SK(), W = 0xf6f3ec, D = 0xe4ded0, INK = 0x3a3430; b.S(sk.stone);
    b.P(PT.carrelage || 11); b.box(8.6, .6, 8.6, D, 0, .3, 0); b.P(0); for (let i = 0; i < 4; i++) { const ry = i * PI / 2; for (let k = 0; k < 9; k++) b.add(new THREE.BoxGeometry(.6, .35, .02), 0xd2cab8, b.M(Math.sin(ry) * 4.31 + Math.cos(ry) * (-3.6 + k * .9), .3, Math.cos(ry) * 4.31 - Math.sin(ry) * (-3.6 + k * .9), 0, ry, 0), 0, false); }
    // les quatre minarets
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 3.85, z = sz * 3.85; b.cyl(.22, .3, 5.4, 16, W, x, 3.3, z); for (const y of [2.3, 4.1, 5.85]) { b.cyl(.42, .42, .08, 16, D, x, y, z); b.tor(.4, .02, D, x, y + .12, z, PI / 2); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(new THREE.CylinderGeometry(.02, .02, .35, 6), W, b.M(x + Math.cos(a) * .25, 6.15, z + Math.sin(a) * .25), 0, true); }
      b.cyl(.32, .32, .06, 16, D, x, 6.36, z); onion(b, .22, .5, W, x, 6.38, z); b.S(sk.gold); rod(b, [x, 6.85, z], [x, 7.15, z], .02, GOLD); b.S(sk.stone); }
    // le mausolée à pans coupés
    const S = 2.3, c = .7, oct = new THREE.Shape(); [[-S + c, -S], [S - c, -S], [S, -S + c], [S, S - c], [S - c, S], [-S + c, S], [-S, S - c], [-S, -S + c]].forEach(([x, z], i) => i ? oct.lineTo(x, z) : oct.moveTo(x, z));
    b.add(new THREE.ExtrudeGeometry(oct, { depth: 3.6, bevelEnabled: false }), W, b.M(0, 4.2, 0, PI / 2, 0, 0), 0, false);
    for (let i = 0; i < 4; i++) { const ry = i * PI / 2, f = (x, y, z) => [Math.sin(ry) * z + Math.cos(ry) * x, y, Math.cos(ry) * z - Math.sin(ry) * x];
      extrude(b, arched(2.2, 3.4, [{ x: 0, w: 1.3, h: 2.7, pointed: 1, y: .25 }]), .14, W, b.M(...f(0, .6, S + .07), 0, ry, 0)); // pishtaq
      b.add(new THREE.BoxGeometry(1.3, 2.5, .02), 0xd8d0c0, b.M(...f(0, 1.95, S - .1), 0, ry, 0), 0, false); b.add(new THREE.BoxGeometry(.6, 1.0, .02), INK, b.M(...f(0, 1.35, S - .08), 0, ry, 0), 0, false);
      for (const t of [[-1.1, 0], [1.1, 0]]) b.add(new THREE.BoxGeometry(.04, 3.3, .02), INK, b.M(...f(t[0], 2.3, S + .15), 0, ry, 0), 0, false); b.add(new THREE.BoxGeometry(2.2, .04, .02), INK, b.M(...f(0, 3.95, S + .15), 0, ry, 0), 0, false); // calligraphie
      const rd = ry + PI / 4, g = (x, y, z) => [Math.sin(rd) * z + Math.cos(rd) * x, y, Math.cos(rd) * z - Math.sin(rd) * x];
      for (const yy of [1.0, 2.6]) extrude(b, arched(.95, 1.4, [{ x: 0, w: .55, h: 1.15, pointed: 1, y: .1 }]), .08, W, b.M(...g(0, yy - .4, S * 1.12), 0, rd, 0));
      for (let k = 0; k < 9; k++) b.add(new THREE.BoxGeometry(.12, .18, .06), W, b.M(...f(-1.9 + k * .475, 4.3, S + .02), 0, ry, 0), 0, false); } // créneaux
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { rod(b, [sx * 2.08, 4.2, sz * 2.08], [sx * 2.08, 5.4, sz * 2.08], .06, W); b.cone(.08, .35, 8, W, sx * 2.08, 5.55, sz * 2.08); } // guldastas
    // le bulbe
    b.cyl(1.35, 1.35, 1.0, 32, W, 0, 4.7, 0); b.tor(1.37, .04, D, 0, 5.2, 0, PI / 2);
    lathe(b, [[1.3, 0], [1.5, .45], [1.62, .95], [1.5, 1.5], [1.15, 2.0], [.65, 2.4], [.28, 2.68], [.12, 2.85], [0, 2.95]], W, 0, 5.2, 0, 40);
    lathe(b, [[.28, 0], [.22, .12], [.08, .18]], D, 0, 7.95, 0, 16); b.S(sk.gold); rod(b, [0, 8.1, 0], [0, 9.3, 0], .035, GOLD, 8, 0, .015); ell(b, GOLD, 0, 8.5, 0, .09, .09, .09); ell(b, GOLD, 0, 8.8, 0, .07, .07, .07); b.add(new THREE.TorusGeometry(.08, .015, 6, 12, PI), GOLD, b.M(0, 9.3, 0), 0, true); b.S(sk.stone);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 1.6, z = sz * 1.6; b.cyl(.48, .48, .08, 16, D, x, 4.25, z); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(new THREE.CylinderGeometry(.03, .03, .55, 6), W, b.M(x + Math.cos(a) * .36, 4.55, z + Math.sin(a) * .36), 0, true); }
      b.cyl(.48, .48, .06, 16, D, x, 4.85, z); onion(b, .34, .75, W, x, 4.88, z); b.S(sk.gold); rod(b, [x, 5.6, z], [x, 5.95, z], .02, GOLD); b.S(sk.stone); } // chhatris
    b.S(null); return b.done(); };

  // =====================================================================
  // 15. PAGODE À CINQ TOITS
  // =====================================================================
  MD.pagode = () => { const b = G.mb(5250), sk = SK(), RED = 0xa8322a, ROOF = 0x3e4248, WOOD = 0x5a3a24; b.S(sk.stone);
    b.P(PT.pierre); b.box(3.6, .45, 3.6, 0xb8b0a0, 0, .22, 0); b.P(0); for (const s of [-1, 1]) b.box(.9, .22, .4, 0xb8b0a0, 0, .11, s * 2.0);
    let y = .45; for (let i = 0; i < 5; i++) { const s = 2.5 - i * .32, h = .95 - i * .06; b.S(sk.paint); b.box(s, h, s, RED, 0, y + h / 2, 0);
      for (let k = 0; k < 4; k++) { const ry = k * PI / 2, f = (x, yy, z) => [Math.sin(ry) * z + Math.cos(ry) * x, yy, Math.cos(ry) * z - Math.sin(ry) * x];
        b.add(new THREE.BoxGeometry(s * .5, h * .55, .02), 0xf2e6c8, b.M(...f(0, y + h * .5, s / 2 + .01), 0, ry, 0), 0, false); for (let j = 0; j < 5; j++) b.add(new THREE.BoxGeometry(.02, h * .55, .02), WOOD, b.M(...f(-s * .2 + j * s * .1, y + h * .5, s / 2 + .02), 0, ry, 0), 0, false);
        for (const t of [-1, 1]) b.add(new THREE.BoxGeometry(.08, h, .08), WOOD, b.M(...f(t * s / 2, y + h / 2, s / 2), 0, ry, 0), 0, false); }
      b.S(sk.wood); b.box(s + .2, .1, s + .2, WOOD, 0, y + h + .05, 0); // poutres
      const r = s * .5 + .75, rh = .45; b.S(null); b.P(PT.tuiles); b.add(new THREE.CylinderGeometry(s * .3, r * Math.SQRT2, rh, 4, 1), ROOF, b.M(0, y + h + .1 + rh / 2, 0, 0, PI / 4, 0), 0, false); b.P(0);
      for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4, cx = Math.cos(a) * r * Math.SQRT2 * .98, cz = Math.sin(a) * r * Math.SQRT2 * .98; rod(b, [cx * .8, y + h + .14, cz * .8], [cx * 1.06, y + h + .42, cz * 1.06], .05, ROOF, 6, 0, .02); b.add(new THREE.SphereGeometry(.05, 8, 6), GOLD, b.M(cx * 1.06, y + h + .44, cz * 1.06), 0, true); } // coins relevés, clochettes
      y += h + .1 + rh * .6; }
    b.S(sk.gold); b.cyl(.16, .2, .3, 12, 0xb08a4a, 0, y + .15, 0); for (let k = 0; k < 9; k++) b.tor(.12 - k * .006, .03, 0xb08a4a, 0, y + .45 + k * .17, 0, PI / 2); rod(b, [0, y + .3, 0], [0, y + 2.3, 0], .035, 0xb08a4a); ell(b, GOLD, 0, y + 2.35, 0, .1, .14, .1); b.S(null); return b.done(); };

  // =====================================================================
  // 16. ATOMIUM
  // =====================================================================
  MD.atomium = () => { const b = G.mb(5260), sk = SK(), ST = 0xd8dde3, E = 2.9, cy = 5.7; b.S(sk.steel);
    const q = new THREE.Quaternion().setFromUnitVectors(V(1, 1, 1).normalize(), UP), pts = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) { const v = V(x, y, z).multiplyScalar(E / 2).applyQuaternion(q); pts.push([v.x, v.y + cy, v.z]); }
    const C = [0, cy, 0];
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]); if (Math.abs(d - E) < .01) rod(b, pts[i], pts[j], .13, ST, 12); }
    for (const p of pts) rod(b, p, C, .13, ST, 12);
    for (const p of [...pts, C]) { b.add(new THREE.SphereGeometry(.6, 28, 20), ST, b.M(...p), 0, true); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.add(new THREE.BoxGeometry(.1, .05, .02), 0xbfe6ff, b.M(p[0] + Math.cos(a) * .6, p[1] + .12, p[2] + Math.sin(a) * .6, 0, -a + PI / 2, 0), 1, false); } }
    const low = pts.reduce((a, p) => p[1] < a[1] ? p : a); rod(b, [low[0], 0, low[2]], low, .22, 0xc8ccd2, 14);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; rod(b, [Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1], [Math.cos(a) * .7, 3.6, Math.sin(a) * .7], .1, 0xc8ccd2); }
    b.S(sk.stone); b.cyl(1.2, 1.3, .25, 20, 0xc8c4bc, low[0], .12, low[2]); b.S(null); return b.done(); };

  // =====================================================================
  // 17. BASILIQUE SAINT-BASILE (bulbes multicolores)
  // =====================================================================
  function gores(b, r, h, cols, x, y, z, mode, n = 12) { const P = ONION.map(([a, c]) => [a * r, c * h]);
    if (mode === 'v') { for (let i = 0; i < n; i++) lathe(b, P, cols[i % cols.length], x, y, z, 3, 0, 1, 1, 1, i / n * TAU, TAU / n); }
    else if (mode === 'h') { for (let i = 0; i < P.length - 1; i++) lathe(b, [P[i], P[i + 1]], cols[i % cols.length], x, y, z, 24); }
    else { for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < n; k++) lathe(b, [P[i], P[i + 1]], cols[(i + k) % cols.length], x, y, z, 2, 0, 1, 1, 1, k / n * TAU + i * .25, TAU / n); } }
  MD.saint_basile = () => { const b = G.mb(5270), sk = SK(), BR = 0xa8402e, WT = 0xf2ece0; b.S(sk.stone);
    b.P(PT.brique); b.box(5.6, .7, 5.6, BR, 0, .35, 0); b.P(0); b.box(5.8, .1, 5.8, WT, 0, .72, 0);
    const tower = (x, z, r, h, top, cols, mode) => { b.P(PT.brique); b.cyl(r, r * 1.05, h, 8, BR, x, .75 + h / 2, z); b.P(0);
      for (let k = 0; k < 3; k++) b.cyl(r * 1.08, r * 1.08, .06, 8, WT, x, .75 + h * (.3 + k * .3), z); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + PI / 8; b.add(new THREE.BoxGeometry(.12, .35, .02), 0x2a2422, b.M(x + Math.cos(a) * r * .93, .75 + h * .75, z + Math.sin(a) * r * .93, 0, -a + PI / 2, 0), 0, false); }
      b.cyl(r * .62, r * .66, top * .25, 12, WT, x, .75 + h + top * .125, z); gores(b, r * .62, top, cols, x, .75 + h + top * .22, z, mode); b.S(sk.gold); rod(b, [x, .75 + h + top * 1.2, z], [x, .75 + h + top * 1.6, z], .025, GOLD); b.add(new THREE.BoxGeometry(.16, .025, .025), GOLD, b.M(x, .75 + h + top * 1.5, z), 0, false); b.S(sk.stone); };
    b.P(PT.brique); b.cyl(.9, 1.0, 4.4, 8, BR, 0, 2.95, 0); b.P(0); b.cone(.95, 3.0, 8, 0xd8c890, 0, 6.65, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; beam(b, [Math.cos(a) * .9, 5.15, Math.sin(a) * .9], [0, 8.1, 0], .04, 0x2e7a4a); }
    gores(b, .26, .55, [GOLD], 0, 8.1, 0, 'h'); b.S(sk.gold); rod(b, [0, 8.6, 0], [0, 9.2, 0], .025, GOLD); b.S(sk.stone); // tour centrale à toit en pavillon
    tower(0, 2.0, .62, 2.2, 1.3, [0xd8282a, 0xf6f2e8], 'v'); tower(2.0, 0, .62, 2.4, 1.3, [0x2e9a4a, 0xf2c83a], 'h'); tower(0, -2.0, .62, 2.3, 1.3, [0x2a5ad8, 0xf6f2e8], 'x'); tower(-2.0, 0, .62, 2.2, 1.3, [0xe8902a, 0x2e9a4a, 0xf2c83a], 'h');
    tower(1.45, 1.45, .45, 1.7, 1.0, [0x2e9a4a, 0xd8282a], 'x'); tower(-1.45, 1.45, .45, 1.6, 1.0, [0xf2c83a, 0x2a5ad8], 'v'); tower(1.45, -1.45, .45, 1.6, 1.0, [0xd8282a, 0xf2c83a], 'h'); tower(-1.45, -1.45, .45, 1.7, 1.0, [0x8a3ad8, 0xf6f2e8], 'x');
    b.S(null); return b.done(); };

  // =====================================================================
  // 18. STONEHENGE
  // =====================================================================
  MD.stonehenge = () => { const b = G.mb(5280), sk = SK(), rnd = G.rng(5280), C = 0x9c9a92; b.S(sk.stone); b.jit(.12);
    b.add(new THREE.TorusGeometry(3.25, .14, 4, 40), 0x7aa84a, b.M(0, -.05, 0, PI / 2, 0, 0, 1, 1, .5), 0, false); // le talus
    const N = 24, R0 = 2.75, miss = new Set([3, 4, 9, 14, 15, 19]);
    for (let i = 0; i < N; i++) { const a = i / N * TAU, x = Math.cos(a) * R0, z = Math.sin(a) * R0; if (miss.has(i)) { if (i % 2) b.box(.4, .3, 1.6, C, x * .9, .15, z * .9, rnd() * .3, a, 0); continue; }
      b.box(.4, 1.9 + rnd() * .15, .26, C, x, .95, z, (rnd() - .5) * .06, -a + PI / 2, (rnd() - .5) * .08);
      if (!miss.has((i + 1) % N) && i % 3 !== 2) { const a2 = (i + .5) / N * TAU; b.box(.78, .22, .28, shade(C, .95), Math.cos(a2) * R0, 2.0, Math.sin(a2) * R0, 0, -a2 + PI / 2, 0); } }
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * .62, r = 1.55 - Math.abs(i - 2) * .12, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 2.6 - Math.abs(i - 2) * .3, ry = -a + PI / 2; // les trilithes en fer à cheval
      for (const s of [-1, 1]) b.box(.4, h, .32, shade(C, .92), x + Math.cos(ry) * s * .3, h / 2, z - Math.sin(ry) * s * .3, 0, ry, 0); if (i !== 1) b.box(1.05, .26, .34, C, x, h + .13, z, 0, ry, 0); else b.box(1.05, .26, .34, C, x + .5, .13, z + .6, 0, ry + .6, 0); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + .1; if (i % 4 === 3) continue; b.box(.22, .8 + rnd() * .3, .16, 0x7e8a92, Math.cos(a) * 2.15, .45, Math.sin(a) * 2.15, 0, -a, 0); } // pierres bleues
    b.box(.9, .12, .4, 0x8a8478, 0, .06, -.3); b.jit(0); b.S(null); return b.done(); };

  // =====================================================================
  // 19. PYRAMIDE DE KHÉOPS, SPHINX
  // =====================================================================
  MD.pyramide_kheops = () => { const b = G.mb(5290), sk = SK(); b.S(sk.stone); b.P(PT.pierre); b.jit(.05);
    const N = 24, A = 8.6, H = 6.0; for (let i = 0; i < N; i++) { const s = A * (1 - i / N), h = H / N; b.add(new THREE.BoxGeometry(s, h, s), shade(0xe2c58a, .92 + (i % 3) * .04), b.M(0, i * h + h / 2, 0), 0, false); }
    b.P(0); b.jit(0); b.S(sk.gold); frustum(b, A / N * 1.1, .02, H / N * 1.6, GOLD, 0, H, 0); b.S(sk.stone);
    b.add(new THREE.BoxGeometry(.4, .5, .05), 0x3a2e22, b.M(0, 1.6, A * (1 - 1.6 / H) / 2 + .02), 0, false); b.S(null); return b.done(); };
  MD.sphinx = () => { const b = G.mb(5300), sk = SK(), C = 0xd8b878, D = 0xc8a668; b.S(sk.stone); b.jit(.04);
    b.P(PT.pierre); b.box(2.9, .3, 4.7, 0xc8b088, 0, .15, 0); b.P(0);
    ell(b, C, 0, .95, -.5, .85, .65, 1.6); ell(b, C, 0, .85, -1.7, .8, .55, .55); for (const s of [-1, 1]) { ell(b, D, s * .55, .65, -1.6, .35, .4, .5); b.box(.32, .28, 1.5, C, s * .4, .45, 1.15); ell(b, D, s * .4, .42, 1.9, .18, .14, .2); } // corps, croupe, pattes
    ell(b, C, 0, 1.35, .7, .55, .55, .5); // poitrail
    const hy = 2.0, hz = .85; b.box(.6, .7, .6, C, 0, hy, hz); b.add(new THREE.ConeGeometry(.1, .2, 4), D, b.M(0, hy - .02, hz + .32, -PI / 2, PI / 4, 0, 1, 1, .6), 0, false);
    for (const s of [-1, 1]) { for (let k = 0; k < 5; k++) b.add(new THREE.BoxGeometry(.06, .9, .3), k % 2 ? 0xc8a868 : 0xe0c488, b.M(s * (.34 + k * .04), hy - .25, hz - .05 - k * .04, 0, 0, s * .12), 0, false); ell(b, 0x2a2420, s * .14, hy + .08, hz + .3, .05, .03, .02); }
    b.box(.72, .18, .7, 0xe0c488, 0, hy + .42, hz - .04); b.box(.12, .35, .1, D, 0, hy - .5, hz + .2); b.jit(0); b.S(null); return b.done(); };

  // =====================================================================
  // ======================= OBJETS DU CATALOGUE ==========================
  // =====================================================================
  const add = (id, n, o, sell, desc) => { O[id] = Object.assign({ id, n, model: id, v: 0, take: 1, cat: 'construction', monument: 1 }, o);
    G.ITEMS[id] = Object.assign(G.ITEMS[id] || {}, { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 1, desc }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  add('arc_triomphe', 'Arc de Triomphe', { fp: [5, 3], h: 5.1 }, 45000, 'Grand arc, frises sculptées, boucliers de l\'attique et le drapeau tricolore sous la voûte.');
  add('pyramide_louvre', 'Pyramide du Louvre', { fp: [5, 5], h: 2.8 }, 40000, 'Verre et acier en losanges, entourée de ses bassins et de leurs jets d\'eau.');
  add('sacre_coeur', 'Basilique du Sacré-Cœur', { fp: [6, 7], h: 12.3 }, 70000, 'Toute blanche, son grand dôme sur un tambour à colonnes, ses quatre petits dômes et son campanile.');
  add('obelisque', 'Obélisque de la Concorde', { fp: [2, 2], h: 8.9 }, 25000, 'Granit rose couvert de hiéroglyphes, et sa pointe dorée.');
  add('moulin_rouge', 'Moulin Rouge', { fp: [4, 3], h: 6.2, light: 1, ly: 3.2, ld: 8, li: 1.2 }, 50000, 'Enseigne au néon, marquise d\'ampoules et ses ailes rouges qui tournent.');
  add('statue_liberte', 'Statue de la Liberté', { fp: [3, 3], h: 10.6, light: 1, ly: 9.9, ld: 10, li: 1.4 }, 70000, 'Sur son fort en étoile et son piédestal : couronne à sept rayons, tablette, et le flambeau doré allumé la nuit.');
  add('big_ben', 'Big Ben', { fp: [3, 3], h: 15.4, light: 1, ly: 10.2, ld: 8, li: .9 }, 65000, 'La tour de l\'horloge, ses quatre cadrans dorés (éclairés la nuit), son beffroi et sa flèche.');
  add('tour_pise', 'Tour de Pise', { fp: [3, 3], h: 8.7 }, 55000, 'Six étages de colonnades en marbre blanc… et elle penche vraiment !');
  add('colisee', 'Colisée', { fp: [8, 7], h: 4.8 }, 85000, 'Trois rangées d\'arcades, l\'attique, les gradins et l\'arène — et le côté en ruine.');
  add('parthenon', 'Parthénon', { fp: [5, 8], h: 4.1 }, 75000, 'Colonnes doriques cannelées, triglyphes, frontons sculptés et quelques tambours tombés.');
  add('taj_mahal', 'Taj Mahal', { fp: [9, 9], h: 9.4 }, 99000, 'Marbre blanc, grands arcs brisés, quatre minarets, chhatris et son immense bulbe à pointe dorée.');
  add('pagode', 'Pagode à cinq toits', { fp: [4, 4], h: 9 }, 45000, 'Cinq étages laqués de rouge, toits aux coins relevés et clochettes, flèche en bronze à neuf anneaux.');
  add('atomium', 'Atomium', { fp: [5, 5], h: 9.2 }, 60000, 'Neuf boules d\'acier reliées comme les atomes d\'un cristal ; leurs hublots s\'allument la nuit.');
  add('christ_redempteur', 'Christ Rédempteur', { fp: [3, 3], h: 7.4 }, 60000, 'Les bras grands ouverts sur son piédestal, au sommet de son rocher.');
  add('saint_basile', 'Basilique Saint-Basile', { fp: [6, 6], h: 9.2 }, 80000, 'Neuf tours de brique coiffées de bulbes rayés, à damiers et à bandes de toutes les couleurs.');
  add('moai', 'Moaï', { fp: [2, 2], h: 3.7 }, 20000, 'La grande tête de pierre de l\'île de Pâques, son chapeau rouge et ses yeux de corail.');
  add('stonehenge', 'Stonehenge', { fp: [7, 7], h: 2.9 }, 50000, 'Le cercle de pierres levées, ses linteaux, les trilithes en fer à cheval et les pierres bleues.');
  add('pyramide_kheops', 'Pyramide de Khéops', { fp: [9, 9], h: 6.3 }, 95000, 'Vingt-quatre gradins de pierre et une pointe d\'or.');
  add('sphinx', 'Sphinx', { fp: [3, 5], h: 2.6 }, 45000, 'Le lion couché à tête de pharaon, coiffé du némès rayé.');

  // ---------- les ailes du Moulin Rouge tournent ----------
  let scene = null, rev = -1, mapRef = null, sails = [];
  G.on('init', sc => { scene = sc; });
  G.on('frame', dt => { const m = G.map; if (!scene || !m) return; if (m !== mapRef || m.rev !== rev) { for (const s of sails) scene.remove(s.me); sails = []; mapRef = m; rev = m.rev;
      for (const o of m.list) if (o.t === 'moulin_rouge') { const me = new THREE.Mesh(G.getGeo('moulin_rouge_ailes'), G.MATS), [cx, cz] = m.center(o), r = (o.r || 0) * PI / 2, lx = -1.15, lz = .16;
        me.position.set(cx + lx * Math.cos(r) + lz * Math.sin(r), o.y + 5.0, cz - lx * Math.sin(r) + lz * Math.cos(r)); me.rotation.order = 'YXZ'; me.rotation.y = r; me.castShadow = true; scene.add(me); sails.push({ me }); } }
    for (const s of sails) s.me.rotation.z -= dt * .5; });
})();
