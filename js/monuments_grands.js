'use strict';
// ===== Deux monuments refaits à l'échelle exacte :
// • la tour Eiffel, 15 cases jusqu'au bout de l'antenne (330 m réels) : les quatre piliers en treillis séparés jusqu'au 2e étage,
//   leurs arêtes courbes (le profil exponentiel de Gustave Eiffel), les grandes arches décoratives sous le 1er étage, la frise
//   d'arcades, les pavillons, le 2e étage, le fût unique jusqu'au 3e étage, la lanterne et les antennes rouges et blanches ;
// • Notre-Dame de Paris, immense : tours de 8 cases (69 m), flèche à 11 cases (96 m), près de 15 cases de long — façade
//   occidentale complète (trois portails à voussures, tympans, statues des ébrasements, galerie des rois, galerie de la Vierge,
//   grande rose, galerie à claire-voie, chimères, tours et leurs abat-son), nef et doubles bas-côtés, arcs-boutants et culées
//   à pinacles, gargouilles, transept et ses deux roses, chevet et ses arcs-boutants rayonnants, flèche et ses douze apôtres.
//   On entre dedans : grande nef à colonnes, vitraux, bancs, chœur et autel. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2, PT = G.PAT || {}, SK = () => G.SK || {};
  const UP = new THREE.Vector3(0, 1, 0), V = (x, y, z) => new THREE.Vector3(x, y, z), BOX = new THREE.BoxGeometry(1, 1, 1);
  // ---------- outils ----------
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0, rx = 0, rz = 0) => b.add(BOX, col, b.M(x, y, z, rx, ry, rz, w, h, d), mat, false);
  function beam(b, p, q, w, col, mat = 0, d = w) { const dir = V(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = dir.length(); if (L < 1e-4) return; dir.normalize();
    b.add(BOX, col, new THREE.Matrix4().compose(V((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, dir), V(w, L, d)), mat, false); }
  function rod(b, p, q, r, col, seg = 8, mat = 0, r1 = r) { const dir = V(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = dir.length(); if (L < 1e-4) return; dir.normalize();
    b.add(new THREE.CylinderGeometry(r1, r, L, seg, 1), col, new THREE.Matrix4().compose(V((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)), mat, true); }
  const path = (b, P, w, col, mat = 0, d = w) => { for (let i = 0; i < P.length - 1; i++) beam(b, P[i], P[i + 1], w, col, mat, d); };
  // arc brisé (gothique) : liste de points [u, y] de la naissance gauche à la naissance droite en passant par la clé
  function ptd(w, ys, hr, n = 7) { const R = (hr * hr + w * w / 4) / w, c = R - w / 2, a = Math.atan2(hr, c), P = [];
    for (let i = 0; i <= n; i++) { const t = PI - a * i / n; P.push([c + R * Math.cos(t), ys + R * Math.sin(t)]); }
    for (let i = n - 1; i >= 0; i--) { const t = PI - a * i / n; P.push([-(c + R * Math.cos(t)), ys + R * Math.sin(t)]); } return P; }
  const arcPts = (cx, w, ys, hr, n) => ptd(w, ys, hr, n).map(([u, y]) => [u + cx, y]);
  // un mur percé (fenêtres brisées, roses rondes), extrudé dans l'épaisseur
  function wall(b, w, h, holes, depth, col, m) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
    for (const o of holes) { const p = new THREE.Path(); if (o.r) p.absarc(o.x, o.y, o.r, 0, TAU, true); else { const P = arcPts(o.x, o.w, o.y + o.h - o.hr, o.hr, 6); p.moveTo(o.x - o.w / 2, o.y); P.forEach(([u, y]) => p.lineTo(u, y)); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x - o.w / 2, o.y); } s.holes.push(p); }
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -depth / 2); b.add(g, col, m, 0, false); }
  const ring = (b, r, t, col, x, y, z, rx = 0, ry = 0, mat = 0, seg = 32) => b.add(new THREE.TorusGeometry(r, t, 5, seg), col, b.M(x, y, z, rx, ry, 0), mat, true);
  // un petit personnage de pierre (statues des portails, rois, apôtres)
  function statue(b, x, y, z, s, col, ry = 0, crown) { bx(b, .075 * s, .28 * s, .06 * s, col, x, y + .14 * s, z, ry); bx(b, .05 * s, .055 * s, .05 * s, col, x, y + .31 * s, z, ry); bx(b, .09 * s, .03 * s, .07 * s, col, x, y + .015 * s, z, ry); if (crown) bx(b, .056 * s, .025 * s, .054 * s, crown, x, y + .35 * s, z, ry); }

  // =====================================================================
  // ============================ TOUR EIFFEL =============================
  // =====================================================================
  MD.tour_eiffel = () => { const b = G.mb(5400), sk = SK(), IR = 0x6b5848, IR2 = 0x58483a, WARM = 0xffd98a, S = 15 / 330;
    const Y1 = 57.6 * S, Y2 = 115.7 * S, Y3 = 276 * S, YT = 300 * S;
    const W = y => 2.66 * Math.exp(-.2406 * y) + .18; // demi-largeur extérieure : le profil courbe de la tour
    const I = y => Math.max(.1, 1.66 - .293 * y); // bord intérieur des piliers (ils se rejoignent au 2e étage)
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    // une travée de treillis entre deux sections carrées A et B : quatre membrures, montant central et croix de Saint-André sur chaque face, ceinture
    function bay(A, B, wc, wb) { for (let c = 0; c < 4; c++) beam(b, A[c], B[c], wc, IR);
      for (let f = 0; f < 4; f++) { const c1 = f, c2 = (f + 1) % 4, am = mid(A[c1], A[c2]), bm = mid(B[c1], B[c2]);
        beam(b, am, bm, wc * .55, IR2); beam(b, A[c1], bm, wb, IR2); beam(b, am, B[c1], wb, IR2); beam(b, am, B[c2], wb, IR2); beam(b, A[c2], bm, wb, IR2); beam(b, B[c1], B[c2], wb * 1.3, IR2); } }
    b.S(sk.iron);
    // ----- les quatre piliers -----
    const ys = []; for (let i = 0; i <= 11; i++) ys.push(Y1 * i / 11); for (let i = 1; i <= 9; i++) ys.push(Y1 + (Y2 - Y1) * i / 9);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const C = y => { const w = W(y), n = I(y); return [[sx * n, y, sz * n], [sx * w, y, sz * n], [sx * w, y, sz * w], [sx * n, y, sz * w]]; };
      for (let k = 0; k < ys.length - 1; k++) { const t = ys[k] / Y2; bay(C(ys[k]), C(ys[k + 1]), .075 - .03 * t, .02);
        const o = C(ys[k])[2]; b.add(BOX, WARM, b.M(o[0] + sx * .04, o[1], o[2] + sz * .04, 0, 0, 0, .045, .045, .045), 1, false); } // ampoules dorées (scintillent la nuit)
      const w0 = W(0), n0 = I(0), c0 = (w0 + n0) / 2, s0 = w0 - n0 + .3; b.S(sk.stone); b.P(PT.pierre); bx(b, s0, .2, s0, 0xcfc4a8, sx * c0, .1, sz * c0); bx(b, s0 - .12, .1, s0 - .12, 0xd8ceb4, sx * c0, .25, sz * c0); b.P(0); b.S(sk.iron); }
    // ----- les quatre grandes arches décoratives -----
    const yS = .9, yA = Y1 - .24, R0 = I(yS), H0 = yA - yS;
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, map = (u, y) => { const d = W(y) - .03; return [Math.cos(ry) * u + Math.sin(ry) * d, y, -Math.sin(ry) * u + Math.cos(ry) * d]; };
      const A = [], Bq = []; for (let i = 0; i <= 28; i++) { const t = PI * i / 28; A.push(map(R0 * Math.cos(t), yS + H0 * Math.sin(t))); Bq.push(map((R0 - .13) * Math.cos(t), yS + (H0 - .12) * Math.sin(t))); }
      path(b, A, .055, IR); path(b, Bq, .035, IR2);
      for (let i = 0; i <= 28; i += 2) beam(b, A[i], Bq[i], .022, IR2);
      for (let i = 1; i < 28; i += 2) { const c = mid(A[i], Bq[i]); b.add(new THREE.TorusGeometry(.045, .009, 4, 10), IR2, b.M(c[0], c[1], c[2], 0, ry, 0), 0, true); } }
    // ----- 1er étage : ceinture, frise d'arcades, plancher autour du grand vide, garde-corps, pavillons -----
    function floor(y, wOut, wIn, hBelt, nArc, pav) { b.S(sk.iron);
      for (let f = 0; f < 4; f++) { const ry = f * PI / 2, c = Math.cos(ry), s = Math.sin(ry), L = 2 * wOut;
        bx(b, L + .1, hBelt, .1, IR, s * wOut, y - hBelt / 2 + .04, c * wOut, ry); // poutre de ceinture
        for (let k = 0; k < nArc; k++) { const u = -wOut + (k + .5) * L / nArc, r = L / nArc * .42; b.add(new THREE.TorusGeometry(r, .011, 4, 12, PI), IR2, b.M(s * (wOut + .055) + c * u, y - hBelt + .02, c * (wOut + .055) - s * u, 0, ry, 0), 0, true); } // frise d'arcades
        if (wIn > 0) bx(b, L, .06, wOut - wIn, IR2, s * (wOut + wIn) / 2, y + .04, c * (wOut + wIn) / 2, ry); else if (f === 0) bx(b, L, .06, L, IR2, 0, y + .04, 0); // plancher
        for (let k = 0; k <= nArc * 2; k++) { const u = -wOut + k * L / (nArc * 2); bx(b, .015, .14, .015, IR2, s * (wOut + .03) + c * u, y + .14, c * (wOut + .03) - s * u, ry); } bx(b, L + .06, .02, .02, IR2, s * (wOut + .03), y + .21, c * (wOut + .03), ry); // garde-corps
        if (pav) { const pw = L * .62; bx(b, pw, .26, .32, 0x7a6858, s * (wOut - .3), y + .2, c * (wOut - .3), ry); for (let k = 0; k < 12; k++) bx(b, pw / 12 * .7, .14, .02, WARM, s * (wOut - .13) + c * (-pw / 2 + (k + .5) * pw / 12), y + .2, c * (wOut - .13) - s * (-pw / 2 + (k + .5) * pw / 12), ry, 1); bx(b, pw + .06, .03, .38, IR2, s * (wOut - .3), y + .345, c * (wOut - .3), ry); } } }
    floor(Y1, W(Y1) + .06, I(Y1) - .02, .22, 16, true);
    floor(Y2, W(Y2) + .05, 0, .15, 10, true); bx(b, .2, .04, .2, 0x2a2a2e, 0, Y2 + .07, 0);
    // ----- le fût, du 2e au 3e étage -----
    const N3 = 20; for (let k = 0; k < N3; k++) { const y0 = Y2 + (Y3 - Y2) * k / N3, y1 = Y2 + (Y3 - Y2) * (k + 1) / N3, C = y => { const w = W(y); return [[-w, y, -w], [w, y, -w], [w, y, w], [-w, y, w]]; };
      bay(C(y0), C(y1), .06 - .025 * k / N3, .016); if (k % 2 === 0) for (const c of C(y0)) b.add(BOX, WARM, b.M(c[0] * 1.05, c[1], c[2] * 1.05, 0, 0, 0, .04, .04, .04), 1, false); }
    bx(b, .14, Y3 - Y2, .14, 0x4a3e34, 0, (Y2 + Y3) / 2, 0); bx(b, .04, Y3 - Y2, .2, 0xd8c040, .1, (Y2 + Y3) / 2, 0); // cage des ascenseurs
    // ----- le sommet : 3e étage, lanterne, antennes -----
    const w3 = W(Y3) + .08; bx(b, w3 * 2, .06, w3 * 2, IR2, 0, Y3, 0); bx(b, w3 * 1.7, .34, w3 * 1.7, 0x7a6858, 0, Y3 + .2, 0);
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2; for (let k = 0; k < 5; k++) { const u = -w3 * .65 + k * w3 * .325; bx(b, .08, .2, .02, WARM, Math.sin(ry) * w3 * .86 + Math.cos(ry) * u, Y3 + .2, Math.cos(ry) * w3 * .86 - Math.sin(ry) * u, ry, 1); } }
    bx(b, w3 * 1.9, .03, w3 * 1.9, IR2, 0, Y3 + .38, 0); bx(b, w3 * 1.1, .3, w3 * 1.1, 0x6e5c4c, 0, Y3 + .55, 0); bx(b, w3 * 1.25, .03, w3 * 1.25, IR2, 0, Y3 + .71, 0);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; beam(b, [Math.cos(a) * w3 * .55, Y3 + .72, Math.sin(a) * w3 * .55], [0, YT - .05, 0], .03, IR); }
    b.add(new THREE.CylinderGeometry(.1, .14, .3, 12), 0x6e5c4c, b.M(0, YT - .1, 0), 0, true); b.add(new THREE.SphereGeometry(.12, 14, 8, 0, TAU, 0, PI / 2), IR2, b.M(0, YT + .05, 0), 0, true);
    b.add(new THREE.SphereGeometry(.07, 10, 8), 0xfff2c0, b.M(0, YT + .2, 0), 1, true); // le phare
    for (let k = 0; k < 6; k++) rod(b, [0, YT + .22 + k * .13, 0], [0, YT + .22 + (k + 1) * .13, 0], .03 - k * .003, k % 2 ? 0xf6f6f6 : 0xd83a3a, 8); // antennes
    rod(b, [0, YT + 1.0, 0], [0, 15, 0], .012, 0xd8d8d8, 6); for (const a of [0, 2.1, 4.2]) bx(b, .1, .1, .02, 0xe8e8e8, Math.cos(a) * .06, YT + .5, Math.sin(a) * .06, a);
    b.add(new THREE.SphereGeometry(.03, 8, 6), 0xff3030, b.M(0, 15, 0), 1, true);
    b.S(null); return b.done(); };

  // =====================================================================
  // ========================== NOTRE-DAME DE PARIS ========================
  // =====================================================================
  MD.notre_dame = () => { const b = G.mb(5500), sk = SK(), C0 = 0xdcd2b8, C1 = 0xcfc4a6, C2 = 0xe9e0c8, DK = 0x2c2620, ROOF = 0x6c7884, COP = 0x6aa894, GLD = 0xe8c25a, WOOD = 0x4a3020;
    const GL = [0x2a3aa8, 0xb8283a, 0x6a2a98, 0x2a7a98, 0xd8a83a, 0x2a6a3a];
    const z0 = 7.4, zB = 5.4, zT = -.37, zA = -5.6, HN = 4.0, RID = 5.0;
    b.S(sk.stone);
    // ----- parvis -----
    b.P(PT.dalles || PT.carrelage || 11); bx(b, 7.0, .04, 1.2, 0xd8d2c4, 0, .02, 7.9); b.P(0);
    // ----- le massif occidental -----
    b.P(PT.pierre); bx(b, 4.76, 5.9, 1.5, C0, 0, 2.95, (zB + z0 - .5) / 2);
    // niveau des portails : mur percé de trois portails brisés
    const PO = [[0, .88, 2.05, .58], [-1.5, .8, 1.82, .5], [1.5, .8, 1.82, .5]];
    wall(b, 4.76, 2.3, PO.map(([x, w, h, hr]) => ({ x, y: 0, w, h, hr })), .5, C0, b.M(0, 0, z0 - .25));
    // niveau de la rose : grande rose ronde, grandes baies des tours
    wall(b, 4.76, 2.2, [{ x: 0, y: 1.1, r: .66 }, { x: -1.5, y: .18, w: .92, h: 1.78, hr: .5 }, { x: 1.5, y: .18, w: .92, h: 1.78, hr: .5 }], .36, C0, b.M(0, 2.8, z0 - .18));
    b.P(0);
    // les portails : voussures peuplées de statuettes, statues des ébrasements, tympan sculpté, linteau, portes ferrées, trumeau
    for (const [x, w, h, hr] of PO) { const ys = h - hr;
      for (let k = 0; k < 4; k++) { const ww = w - .07 - k * .07, P = arcPts(x, ww, ys - .03 * k, hr - .03 - k * .03, 6).map(([u, y]) => [u, y, z0 - .06 - k * .1]); path(b, P, .045, k % 2 ? C2 : C1, 0, .08);
        for (let i = 1; i < P.length - 1; i += 2) bx(b, .03, .05, .03, C2, P[i][0], P[i][1] - .04, P[i][2] + .02); for (const sd of [-1, 1]) beam(b, [x + sd * ww / 2, 0, z0 - .06 - k * .1], [x + sd * ww / 2, ys - .03 * k, z0 - .06 - k * .1], .045, C1, 0, .08); }
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) statue(b, x + sd * (w / 2 - .07 - k * .045), .34, z0 - .1 - k * .1, 1.15, C2, 0);
      bx(b, w - .32, .3, .5, C1, x, .15, z0 - .25); // soubassement
      const wi = w - .36, yl = ys - .2; bx(b, wi, .08, .08, C1, x, yl, z0 - .44); // linteau
      const ty = arcPts(x, wi, yl, ys - yl + hr - .32, 6), ts = new THREE.Shape(); ts.moveTo(ty[0][0], ty[0][1]); ty.forEach(([u, y]) => ts.lineTo(u, y)); ts.lineTo(ty[0][0], ty[0][1]);
      b.add(new THREE.ExtrudeGeometry(ts, { depth: .04, bevelEnabled: false }), C2, b.M(0, 0, z0 - .48), 0, false); // tympan
      for (let r = 0; r < 3; r++) { const yy = yl + .1 + r * .17, n = 7 - r * 2; for (let i = 0; i < n; i++) statue(b, x + (i - (n - 1) / 2) * wi / 8, yy, z0 - .42, .5, 0xd8ceb4); } // registres sculptés
      for (const sd of [-1, 1]) { bx(b, wi / 2 - .03, yl - .3, .04, WOOD, x + sd * wi / 4, .3 + (yl - .3) / 2, z0 - .46); for (let k = 0; k < 3; k++) bx(b, wi / 2 - .08, .02, .015, 0x1e1e20, x + sd * wi / 4, .5 + k * (yl - .6) / 2, z0 - .435); }
      bx(b, .08, yl - .3, .08, C1, x, .3 + (yl - .3) / 2, z0 - .42); statue(b, x, .62, z0 - .36, 1.1, C2); }
    // galerie des rois
    bx(b, 4.76, .5, .3, C1, 0, 2.55, z0 - .35); bx(b, 4.9, .06, .1, C1, 0, 2.31, z0 + .03); bx(b, 4.9, .07, .12, C1, 0, 2.79, z0 + .03);
    for (let i = 0; i < 28; i++) { const x = -2.3 + (i + .5) * 4.6 / 28; bx(b, .1, .38, .02, DK, x, 2.52, z0 - .19); statue(b, x, 2.33, z0 - .12, .95, C2, 0, GLD); beam(b, [x - .07, 2.7, z0 - .05], [x, 2.76, z0 - .05], .018, C1); beam(b, [x, 2.76, z0 - .05], [x + .07, 2.7, z0 - .05], .018, C1); bx(b, .025, .4, .04, C1, x + 2.3 / 28, 2.52, z0 - .03); }
    // galerie de la Vierge (balustrade) et ses statues
    for (let i = 0; i <= 46; i++) bx(b, .022, .2, .022, C1, -2.35 + i * 4.7 / 46, 2.93, z0 + .05); bx(b, 4.8, .04, .07, C1, 0, 3.05, z0 + .05);
    statue(b, 0, 3.07, z0 + .05, 1.4, C2); for (const sd of [-1, 1]) { statue(b, sd * .25, 3.07, z0 + .05, 1.15, C2); bx(b, .1, .16, .01, C2, sd * .31, 3.33, z0 + .03, sd * .4); statue(b, sd * 1.5, 3.07, z0 + .05, 1.3, C2); }
    // la grande rose occidentale
    const rose = (x, y, z, R, ry) => { const m = (r0, r1, n, k0, mat = 1) => { for (let i = 0; i < n; i++) b.add(new THREE.RingGeometry(r0, r1, 3, 1, i * TAU / n, TAU / n), GL[(i + k0) % GL.length], b.M(x, y, z, 0, ry, 0), mat, false); };
      b.add(new THREE.CircleGeometry(R * .16, 16), GLD, b.M(x, y, z, 0, ry, 0), 1, false); m(R * .16, R * .42, 12, 0); m(R * .42, R * .7, 24, 2); m(R * .7, R, 24, 4);
      const pz = d => [x + Math.sin(ry) * d, z + Math.cos(ry) * d], [fx, fz] = pz(.025);
      for (let i = 0; i < 24; i++) { const a = i * TAU / 24, c = Math.cos(a), s = Math.sin(a), r0 = i % 2 ? R * .42 : R * .16; beam(b, [fx + Math.cos(ry) * c * r0, y + s * r0, fz - Math.sin(ry) * c * r0], [fx + Math.cos(ry) * c * R, y + s * R, fz - Math.sin(ry) * c * R], .022, C2, 0, .04); }
      for (const r of [.16, .42, .7, 1]) ring(b, R * r, .02, C2, fx, y, fz, 0, ry, 0, 40);
      for (let i = 0; i < 24; i++) { const a = (i + .5) * TAU / 24; ring(b, R * .11, .01, C2, fx + Math.cos(ry) * Math.cos(a) * R * .85, y + Math.sin(a) * R * .85, fz - Math.sin(ry) * Math.cos(a) * R * .85, 0, ry, 0, 12); } };
    rose(0, 3.9, z0 - .22, .66, 0);
    // les grandes baies géminées des tours, à ce niveau
    for (const sd of [-1, 1]) { const x = sd * 1.5; for (const dx of [-.22, .22]) { bx(b, .36, 1.1, .03, 0x2a3048, x + dx, 3.42, z0 - .3, 0, 1); path(b, arcPts(x + dx, .38, 3.97, .22, 4).map(([u, y]) => [u, y, z0 - .27]), .03, C1); }
      bx(b, .06, 1.55, .08, C1, x, 3.7, z0 - .25); ring(b, .14, .025, C1, x, 4.3, z0 - .26); b.add(new THREE.CircleGeometry(.13, 12), 0x3a4a8a, b.M(x, 4.3, z0 - .29), 1, false); }
    // grande galerie à claire-voie
    bx(b, 4.76, .9, .1, DK, 0, 5.45, z0 - .36); bx(b, 4.9, .08, .5, C1, 0, 5.02, z0 - .2); bx(b, 4.9, .1, .5, C1, 0, 5.86, z0 - .2);
    for (let i = 0; i < 27; i++) { const x = -2.3 + i * 4.6 / 26; rod(b, [x, 5.06, z0 - .05], [x, 5.6, z0 - .05], .022, C2, 6); if (i < 26) { const x2 = x + 4.6 / 26; beam(b, [x, 5.6, z0 - .05], [(x + x2) / 2, 5.74, z0 - .05], .02, C1); beam(b, [(x + x2) / 2, 5.74, z0 - .05], [x2, 5.6, z0 - .05], .02, C1); } }
    // contreforts de la façade, et chimères à leur sommet
    for (const u of [-2.38, -.82, .82, 2.38]) { b.P(PT.pierre); bx(b, .32, 5.0, .3, C0, u, 2.5, z0 + .15); b.P(0); bx(b, .38, .1, .36, C1, u, 2.3, z0 + .16); bx(b, .38, .1, .36, C1, u, 4.98, z0 + .16); bx(b, .26, .9, .2, C0, u, 5.45, z0 + .05);
      if (Math.abs(u) > 1) statue(b, u, 1.4, z0 + .32, 1.1, C2);
      bx(b, .08, .08, .14, 0x8a8478, u, 5.97, z0 + .12); bx(b, .06, .065, .07, 0x8a8478, u, 6.05, z0 + .2); for (const s of [-1, 1]) bx(b, .02, .1, .08, 0x8a8478, u + s * .05, 6.0, z0 + .1, s * .4); }
    // les deux tours
    for (const sd of [-1, 1]) { const x = sd * 1.5, zc = (zB + z0 - .1) / 2, dz = z0 - .1 - zB;
      b.P(PT.pierre); bx(b, 1.76, 2.1, dz, C0, x, 6.95, zc); b.P(0);
      const faces = [[0, x, z0 - .1, 1.76], [PI, x, zB, 1.76], [PI / 2 * sd, x + sd * .88, zc, dz]];
      for (const [ry, cx, cz, fw] of faces) { const nx = Math.sin(ry), nz = Math.cos(ry), tx = Math.cos(ry), tz = -Math.sin(ry), f = (u, y, d) => [cx + tx * u + nx * d, y, cz + tz * u + nz * d];
        for (const du of [-fw * .22, fw * .22]) { const p = f(du, 6.85, .005); bx(b, .36, 1.5, .04, DK, p[0], p[1], p[2], ry);
          for (let k = 0; k < 9; k++) { const q = f(du, 6.25 + k * .15, .02); bx(b, .32, .02, .035, 0x5a4a3a, q[0], q[1], q[2], ry, 0, .5); } // abat-son
          path(b, arcPts(du, .44, 7.45, .26, 5).map(([u, y]) => f(u, y, .03)), .04, C1); for (const e of [-.22, .22]) rod(b, f(du + e, 6.1, .04), f(du + e, 7.45, .04), .022, C2, 6); }
        const mm = f(0, 6.85, .03); bx(b, .07, 1.6, .06, C1, mm[0], mm[1], mm[2], ry); }
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) { const px = x + cx * .9, pz = zc + cz * (dz / 2 + .02); bx(b, .16, 2.0, .16, C1, px, 6.92, pz); b.cone(.07, .3, 8, C1, px, 8.08, pz); }
      bx(b, 1.86, .08, dz + .12, C1, x, 7.96, zc); bx(b, 1.6, .05, dz - .2, ROOF, x, 8.0, zc);
      for (let k = 0; k <= 14; k++) { const u = -.88 + k * 1.76 / 14; for (const zz of [zc - dz / 2, zc + dz / 2]) bx(b, .02, .14, .02, C1, x + u, 8.07, zz); }
      for (let k = 0; k <= 14; k++) { const w = -dz / 2 + k * dz / 14; for (const xx of [x - .88, x + .88]) bx(b, .02, .14, .02, C1, xx, 8.07, zc + w); }
      for (const [w, d] of [[1.8, 0], [0, 1]]) { if (w) { bx(b, w, .02, .02, C1, x, 8.15, zc - dz / 2); bx(b, w, .02, .02, C1, x, 8.15, zc + dz / 2); } else { bx(b, .02, .02, dz, C1, x - .88, 8.15, zc); bx(b, .02, .02, dz, C1, x + .88, 8.15, zc); } } }
    b.cyl(.14, .14, 1.1, 8, C1, -2.3, 7.9, zB + .1); b.cone(.17, .4, 8, ROOF, -2.3, 8.65, zB + .1); // tourelle d'escalier
    // ----- nef, transept, chœur : le corps de la cathédrale -----
    const body = (z1, z2) => { const L = z1 - z2, zc = (z1 + z2) / 2; b.P(PT.pierre); bx(b, 1.5, HN, L, C0, 0, HN / 2, zc); bx(b, .8, 2.6, L, C0, -1.15, 1.3, zc); bx(b, .8, 2.6, L, C0, 1.15, 1.3, zc); bx(b, 1.15, 2.0, L, C0, -2.125, 1.0, zc); bx(b, 1.15, 2.0, L, C0, 2.125, 1.0, zc); b.P(PT.ardoise);
      for (const s of [-1, 1]) { bx(b, 1.3, .06, L + .04, ROOF, s * .41, 4.5, zc, 0, 0, 0, -s * .896); bx(b, .87, .05, L, ROOF, s * 1.15, 2.8, zc, 0, 0, 0, -s * .39); bx(b, 1.22, .05, L, ROOF, s * 2.125, 2.25, zc, 0, 0, 0, -s * .335); } b.P(0);
      for (let z = z2 + .1; z < z1; z += .22) bx(b, .03, .09, .03, 0x8a92a0, 0, RID + .04, z); // crête du faîtage
      bx(b, .06, .05, L, 0x8a92a0, 0, RID, zc); };
    body(zB, .45); body(-1.18, zA);
    // fenêtres hautes (vitraux), fenêtres des bas-côtés
    const bays = (z1, z2, n) => { const out = []; for (let i = 0; i < n; i++) out.push(z1 - (i + .5) * (z1 - z2) / n); return out; };
    for (const zw of [...bays(zB - .1, .55, 6), ...bays(-1.3, zA + .2, 5)]) for (const s of [-1, 1]) {
      bx(b, .02, .72, .24, GL[Math.abs(Math.round(zw * 3)) % GL.length], s * .757, 3.35, zw, 0, 1); path(b, ptd(.28, 3.72, .16, 4).map(([u, y]) => [s * .77, y, zw + u]), .025, C1); bx(b, .022, .74, .02, C1, s * .77, 3.36, zw);
      bx(b, .02, .6, .18, GL[(Math.abs(Math.round(zw * 5)) + 2) % GL.length], s * 2.705, 1.15, zw, 0, 1); path(b, ptd(.22, 1.45, .12, 3).map(([u, y]) => [s * 2.715, y, zw + u]), .022, C1); }
    // arcs-boutants de la nef et du chœur
    const flyer = (s, z) => { b.P(PT.pierre); bx(b, .45, 3.3, .2, C0, s * 2.95, 1.65, z); b.P(0); bx(b, .5, .08, .26, C1, s * 2.95, 1.2, z); bx(b, .5, .08, .26, C1, s * 2.95, 2.4, z);
      b.cone(.13, .55, 8, C1, s * 2.95, 3.58, z); for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; bx(b, .03, .05, .03, C2, s * 2.95 + Math.cos(a) * .08, 3.5 + (k % 2) * .12, z + Math.sin(a) * .08); } bx(b, .02, .08, .02, C2, s * 2.95, 3.9, z);
      beam(b, [s * 2.73, 3.22, z], [s * .8, 3.82, z], .1, C1, 0, .12); const A = []; for (let i = 0; i <= 8; i++) { const t = i / 8 * PI / 2; A.push([s * (.8 + 1.93 * Math.cos(t)), 2.86 + .77 * Math.sin(t), z]); } path(b, A, .08, C0, 0, .11);
      for (let i = 2; i <= 6; i += 2) { const p = A[i], ty = 3.22 + (3.82 - 3.22) * (2.73 - Math.abs(p[0])) / 1.93; beam(b, p, [p[0], ty, z], .025, C2, 0, .05); }
      bx(b, .22, .05, .05, C1, s * 3.27, 3.05, z); bx(b, .07, .07, .07, 0x8a8478, s * 3.4, 3.06, z); }; // gargouille
    for (let i = 0; i <= 6; i++) for (const s of [-1, 1]) flyer(s, zB - .3 - i * (zB - .3 - .6) / 6);
    for (let i = 0; i <= 4; i++) for (const s of [-1, 1]) flyer(s, -1.5 - i * .82);
    // le transept et ses deux roses
    b.P(PT.pierre); bx(b, 6.0, HN, 1.63, C0, 0, HN / 2, zT); b.P(PT.ardoise); for (const s of [-1, 1]) bx(b, 6.0, .06, 1.3, ROOF, 0, 4.5, zT + s * .41, 0, 0, s * .884); b.P(0);
    for (let x = -2.95; x < 2.96; x += .22) bx(b, .03, .09, .03, 0x8a92a0, x, RID + .04, zT);
    for (const s of [-1, 1]) { const xf = s * 3.0, ry = s * PI / 2, fz = (u, y, d) => [xf + s * d, y, zT - s * u];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.83, 0, 0, .83, 0, 1.05, 0, 0, 0, .83, 0, 0, -.83, 0, 1.05, 0], 3)); g.computeVertexNormals(); b.add(g, C0, b.M(xf, HN, zT), 0, false); // pignon
      rose(xf + s * .02, 2.95, zT, .72, ry); ring(b, .74, .05, C1, xf + s * .03, 2.95, zT, 0, ry);
      const pw = .8; bx(b, .04, 1.6, pw, DK, xf + s * .01, .8, zT); path(b, arcPts(0, pw + .12, 1.25, .45, 6).map(([u, y]) => fz(u, y, .04)), .05, C1, 0, .08); path(b, arcPts(0, pw + .26, 1.3, .5, 6).map(([u, y]) => fz(u, y, .06)), .05, C2, 0, .08);
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const p = fz(sd * (pw / 2 + .08 + k * .08), .3, .06 + k * .03); statue(b, p[0], p[1], p[2], 1, C2, ry); }
      for (let k = 0; k < 11; k++) { const p = fz(-.75 + k * .15, 2.05, .04); rod(b, p, [p[0], 2.4, p[2]], .02, C2, 6); } const gp = fz(0, 2.43, .04); bx(b, .06, .05, 1.6, C1, gp[0], gp[1], gp[2]);
      const sr = fz(0, 4.42, .02); b.add(new THREE.CircleGeometry(.18, 16), GL[0], b.M(sr[0], sr[1], sr[2], 0, ry, 0), 1, false); ring(b, .19, .025, C1, sr[0] + s * .01, sr[1], sr[2], 0, ry);
      for (let k = 0; k < 8; k++) { const t = k / 8, pL = fz(-.83 + .83 * t, HN + 1.05 * t, .03), pR = fz(.83 - .83 * t, HN + 1.05 * t, .03); bx(b, .05, .06, .05, C2, pL[0], pL[1] + .05, pL[2]); bx(b, .05, .06, .05, C2, pR[0], pR[1] + .05, pR[2]); } // crochets du pignon
      const top = fz(0, HN + 1.05, .02); rod(b, top, [top[0], top[1] + .35, top[2]], .02, C1); bx(b, .02, .03, .14, C1, top[0], top[1] + .25, top[2]);
      for (const sd of [-1, 1]) { const p = fz(sd * .9, 0, .04); b.cyl(.12, .13, 4.9, 8, C1, p[0], 2.45, p[2]); b.cone(.14, .6, 8, C1, p[0], 5.2, p[2]); bx(b, .02, .1, .02, C2, p[0], 5.55, p[2]); for (const y of [1.3, 2.5, 3.7]) b.cyl(.15, .15, .05, 8, C2, p[0], y, p[2]); } }
    // ----- le chevet et ses arcs-boutants rayonnants -----
    b.P(PT.pierre); b.add(new THREE.CylinderGeometry(.75, .75, HN, 16, 1, false, PI / 2, PI), C0, b.M(0, HN / 2, zA), 0, false);
    b.add(new THREE.CylinderGeometry(1.55, 1.55, 2.6, 20, 1, false, PI / 2, PI), C0, b.M(0, 1.3, zA), 0, false); b.add(new THREE.CylinderGeometry(2.7, 2.7, 2.0, 24, 1, false, PI / 2, PI), C0, b.M(0, 1.0, zA), 0, false); b.P(PT.ardoise);
    b.add(new THREE.ConeGeometry(.82, 1.0, 16, 1, false, PI / 2, PI), ROOF, b.M(0, HN + .5, zA), 0, false); b.add(new THREE.CylinderGeometry(.78, 1.58, .4, 20, 1, true, PI / 2, PI), ROOF, b.M(0, 2.78, zA), 0, false); b.add(new THREE.CylinderGeometry(1.58, 2.74, .45, 24, 1, true, PI / 2, PI), ROOF, b.M(0, 2.22, zA), 0, false); b.P(0);
    for (let k = 0; k < 6; k++) { const a = PI / 2 + PI * (k + .5) / 6, ps = r => [Math.sin(a) * r, Math.cos(a) * r + zA]; let [x, z] = ps(.765); bx(b, .22, .72, .02, GL[k % GL.length], x, 3.35, z, a, 1); [x, z] = ps(2.715); bx(b, .18, .6, .02, GL[(k + 3) % GL.length], x, 1.15, z, a, 1); }
    for (let k = 0; k < 7; k++) { const a = PI / 2 + PI * (k + .5) / 7, P = r => [Math.sin(a) * r, Math.cos(a) * r + zA];
      const [px, pz] = P(2.95); b.P(PT.pierre); bx(b, .2, 3.3, .45, C0, px, 1.65, pz, a); b.P(0); b.cone(.13, .55, 8, C1, px, 3.58, pz); bx(b, .02, .08, .02, C2, px, 3.9, pz);
      const [ax, az] = P(2.75), [wx, wz] = P(.8); beam(b, [ax, 3.22, az], [wx, 3.82, wz], .1, C1, 0, .12); const A = []; for (let i = 0; i <= 8; i++) { const t = i / 8 * PI / 2, [x, z] = P(.8 + 1.93 * Math.cos(t)); A.push([x, 2.86 + .77 * Math.sin(t), z]); } path(b, A, .08, C0, 0, .11);
      const [gx, gz] = P(3.3); bx(b, .07, .07, .07, 0x8a8478, gx, 3.06, gz); }
    // ----- la flèche et ses douze apôtres -----
    b.add(new THREE.CylinderGeometry(.3, .33, 1.0, 8), 0x7a8590, b.M(0, RID + .5, zT), 0, false);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4 + PI / 8, c = Math.cos(a), s = Math.sin(a); bx(b, .12, .62, .02, DK, s * .315, RID + .5, zT + c * .315, a);
      const v = k * PI / 4; rod(b, [Math.sin(v) * .36, RID, zT + Math.cos(v) * .36], [Math.sin(v) * .36, RID + 1.35, zT + Math.cos(v) * .36], .02, 0x8a95a0, 6); b.cone(.04, .2, 6, 0x8a95a0, Math.sin(v) * .36, RID + 1.45, zT + Math.cos(v) * .36); }
    b.add(new THREE.ConeGeometry(.3, 4.9, 8), 0x7a8590, b.M(0, RID + 1.0 + 2.45, zT), 0, false);
    for (let k = 0; k < 8; k++) { const v = k * PI / 4; for (let y = RID + 1.2; y < RID + 5.6; y += .32) { const r = .3 * (1 - (y - RID - 1.0) / 4.9) + .015; bx(b, .03, .05, .03, 0x9aa4b0, Math.sin(v) * r, y, zT + Math.cos(v) * r, v); } }
    for (const y of [RID + 2.2, RID + 3.6]) { const r = .3 * (1 - (y - RID - 1.0) / 4.9) + .01; b.add(new THREE.TorusGeometry(r, .022, 4, 8), 0x9aa4b0, b.M(0, y, zT, PI / 2, 0, PI / 8), 0, true); }
    b.S(sk.gold); rod(b, [0, RID + 5.85, zT], [0, RID + 6.15, zT], .012, GLD); bx(b, .1, .015, .015, GLD, 0, RID + 6.08, zT); bx(b, .05, .05, .02, GLD, 0, RID + 6.18, zT); b.S(sk.stone); // croix et coq
    for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (let k = 0; k < 3; k++) { const d = .5 + k * .2, off = (k - 1) * .09, x = dx * d + dz * off, z = zT + dz * d + dx * off; statue(b, x, RID - .05 - Math.abs(off) * 1.1, z, 1.1, COP, Math.atan2(dx, dz)); }
    b.S(null); return b.done(); };

  // =====================================================================
  // ========================= INTÉRIEUR DE LA CATHÉDRALE =================
  // =====================================================================
  MD.colonne_nef = () => { const b = G.mb(5600), C = 0xe2d8c0, D = 0xcfc4a6; b.S(SK().stone);
    bx(b, .5, .12, .5, D, 0, .06, 0); b.cyl(.2, .22, .14, 16, D, 0, .19, 0); b.cyl(.16, .16, 2.4, 16, C, 0, 1.46, 0); for (let k = 0; k < 4; k++) { const a = k * PI / 2; b.cyl(.045, .045, 2.4, 8, C, Math.cos(a) * .17, 1.46, Math.sin(a) * .17); }
    b.cyl(.27, .17, .22, 16, D, 0, 2.77, 0); bx(b, .5, .07, .5, D, 0, 2.92, 0); for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; rod(b, [Math.cos(a) * .18, 2.95, Math.sin(a) * .18], [Math.cos(a) * .5, 3.25, Math.sin(a) * .5], .04, D, 6); } // nervures de voûte
    b.S(null); return b.done(); };
  O.colonne_nef = { id: 'colonne_nef', n: 'Colonne gothique', model: 'colonne_nef', v: 0, fp: [1, 1], h: 3.2, fixed: 1 };
  MD.vitrail_mur = v => { const b = G.mb(5610 + (v || 0)), C = 0xd8ceb4, cols = [0x2a3aa8, 0xb8283a, 0x6a2a98, 0x2a7a98, 0xd8a83a]; b.S(SK().stone);
    const z = -.44; bx(b, .9, 2.5, .06, C, 0, 1.6, z - .02);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) bx(b, .27, .3, .02, cols[(r * 2 + c + (v || 0)) % 5], (c - .5) * .3, .62 + r * .33, z + .02, 0, 1);
    b.add(new THREE.CircleGeometry(.16, 14), cols[(v || 0) % 5], b.M(0, 2.66, z + .02), 1, false); path(b, ptd(.66, 2.45, .5, 5).map(([u, y]) => [u, y, z + .04]), .04, C); bx(b, .03, 1.95, .03, C, 0, 1.45, z + .04); bx(b, .7, .04, .03, C, 0, .45, z + .04);
    b.S(null); return b.done(); };
  O.vitrail_mur = { id: 'vitrail_mur', n: 'Vitrail', model: 'vitrail_mur', v: 0, fp: [1, 1], h: .2, walk: 1, fixed: 1 };
  G.ROOMKINDS.cathedrale = { W: 15, H: 26, floor: 'damier_noir', wall: 'briques_creme', trim: 0x8a6a46 };
  G.ROOMFILL.cathedrale = (m, P) => { const ok = (t, x, z, r = 0, ex) => (G.ITEMS[t] || O[t]) && P(t, x, z, r, ex);
    for (let z = 2; z <= 22; z += 3) { ok('colonne_nef', 3, z); ok('colonne_nef', 11, z); } // deux rangées de colonnes
    for (let z = 2; z <= 23; z += 3) { ok('vitrail_mur', 0, z, 1, { v: z % 5 }); ok('vitrail_mur', 14, z, 3, { v: (z + 2) % 5 }); }
    for (let x = 1; x <= 13; x += 3) if (x !== 7) ok('vitrail_mur', x, 0, 0, { v: x % 5 });
    ok('autel', 6, 2); ok('torchere', 5, 2); ok('torchere', 9, 2); ok('statue', 4, 1); ok('statue', 10, 1); ok('piano_droit', 12, 1, 0); ok('tapis_savonnerie', 6, 4); ok('vase_chine', 5, 1); ok('vase_chine', 9, 1);
    for (let z = 7; z <= 21; z += 2) { ok('banc', 4, z, 2); ok('banc', 9, z, 2); }
    for (let z = 4; z <= 20; z += 4) { ok('lustre_bougies', 7, z); } for (const x of [1, 13]) for (let z = 5; z <= 20; z += 5) ok('torchere', x, z);
    ok('plante', 1, 24); ok('plante', 13, 24); };
  G.ROOMNPC.cathedrale = ['cure', 7.5, 3.6];

  // ---------- un monument dégage la place : arbres, buissons et rochers sous lui sont enlevés (comme les fleurs sous une maison) ----------
  const orp = G.replaces; G.replaces = (d, q) => orp(d, q) || (!!d && !!d.monument && !!q && !!G.isNature && G.isNature(q));

  // =====================================================================
  // ============================ CATALOGUE ===============================
  // =====================================================================
  Object.assign(O.tour_eiffel || (O.tour_eiffel = { id: 'tour_eiffel', model: 'tour_eiffel', v: 0, take: 1, cat: 'construction' }), { n: 'Tour Eiffel', monument: 1, fp: [6, 6], h: 15, light: 1, ly: 13.8, ld: 16, li: 1.5 });
  Object.assign(O.notre_dame || (O.notre_dame = { id: 'notre_dame', model: 'notre_dame', v: 0, take: 1, cat: 'construction' }), { n: 'Notre-Dame de Paris', monument: 1, fp: [7, 16], h: 11.2, light: 1, ly: 3.9, ld: 9, li: .8, enter: 'cathedrale' });
  for (const [id, n, sell, desc] of [['tour_eiffel', 'Tour Eiffel', 80000, 'À l\'échelle exacte : 15 cases jusqu\'à l\'antenne. Quatre piliers en treillis aux arêtes courbes, grandes arches, deux étages, le fût et le sommet. La nuit, elle scintille d\'or.'],
    ['notre_dame', 'Notre-Dame de Paris', 120000, 'Immense : tours de 8 cases, flèche à 11, quinze cases de long. Portails sculptés, galerie des rois, grande rose, arcs-boutants, transept et chevet, flèche et apôtres. On peut entrer dedans !']]) {
    G.ITEMS[id] = Object.assign(G.ITEMS[id] || {}, { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 1, desc }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); }
})();
