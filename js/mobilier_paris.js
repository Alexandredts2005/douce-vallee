'use strict';
// ===== Le mobilier parisien, plus vrai que nature : la colonne Morris (socle de fonte à panneaux, fût couvert d'affiches de spectacle,
// frise dorée, corniche à denticules et lambrequin festonné, dôme en écailles de zinc à nervures, lanterne et épi doré) et la fontaine
// Wallace (socle octogonal à degrés, piédestal à écusson, quatre cariatides drapées qui portent la coupole, dauphins, filet d'eau). =====
(function () {
  const MD = G.MODELS, PI = Math.PI, TAU = PI * 2, GOLD = 0xd9b84a, VW = 0x1f4f3a, VW2 = 0x1d4a33;
  const C3 = c => new THREE.Color(c), light = (c, k = .3) => C3(c).lerp(C3(0xffffff), k).getHex(), dark = (c, k = .7) => C3(c).multiplyScalar(k).getHex();
  const SK = () => G.SK || {}, PAT = () => G.PAT || {};
  const oct = (b, rt, rb, h, col, y, mat = 0) => b.add(new THREE.CylinderGeometry(rt, rb, h, 8), col, b.M(0, y, 0, 0, PI / 8, 0), mat);
  const ring = (b, r, t, col, y, seg = 48) => b.add(new THREE.TorusGeometry(r, t, 6, seg), col, b.M(0, y, 0, PI / 2, 0, 0), 0, true);
  function seg(b, p1, p2, r1, r2, col, n = 10) { const a = new THREE.Vector3(...p1), c = new THREE.Vector3(...p2), d = c.clone().sub(a), L = d.length(); if (L < 1e-4) return;
    b.add(new THREE.CylinderGeometry(r2, r1, L, n), col, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)), 0, true); }

  // ---------- la colonne Morris ----------
  MD.colonne_morris = v => { const b = G.mb(917), sk = SK(), P = PAT(), hi = light(VW, .18);
    b.S(sk.paint);
    // le socle de fonte : plinthe, tores, tambour à panneaux moulurés
    b.cyl(.58, .62, .1, 40, VW, 0, .05, 0); b.cyl(.52, .56, .08, 40, VW, 0, .14, 0); ring(b, .52, .035, VW, .19);
    b.cyl(.48, .51, .3, 40, VW, 0, .36, 0); for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * TAU; b.box(.18, .2, .02, hi, Math.cos(a) * .5, .36, Math.sin(a) * .5, 0, PI / 2 - a, 0); }
    ring(b, .48, .04, VW, .52);
    b.S(null);
    // le fût, couvert d'affiches de spectacle
    b.P(P.affiches || 0); b.cyl(.43, .43, 1.86, 56, VW, 0, 1.46, 0, 0, 0, 0, 0, true); b.P(0);
    // la frise dorée, la corniche à denticules, le lambrequin festonné
    b.S(sk.paint); ring(b, .44, .035, VW, 2.4); b.cyl(.47, .45, .2, 40, VW, 0, 2.5, 0); b.S(null);
    b.S(sk.gold); ring(b, .47, .012, GOLD, 2.43, 56); ring(b, .47, .012, GOLD, 2.57, 56); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; b.sph(.028, GOLD, Math.cos(a) * .475, 2.5, Math.sin(a) * .475, .6, 1, 1); } b.S(null);
    b.S(sk.paint); b.cyl(.56, .5, .1, 40, VW, 0, 2.65, 0);
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; b.box(.04, .05, .06, VW, Math.cos(a) * .535, 2.585, Math.sin(a) * .535, 0, PI / 2 - a, 0); }
    for (let i = 0; i < 24; i++) { const a = (i + .5) / 24 * TAU; b.add(new THREE.CylinderGeometry(.075, .075, .015, 12, 1, false, -PI / 2, PI), VW, b.M(Math.cos(a) * .565, 2.6, Math.sin(a) * .565, PI / 2, PI / 2 - a, 0), 0, true); }
    // le dôme en écailles de zinc, ses nervures, les petits frontons, la lanterne et l'épi
    b.P(P.zinc || 0); b.add(new THREE.SphereGeometry(.53, 48, 18, 0, TAU, 0, PI / 2), VW, b.M(0, 2.7, 0, 0, 0, 0, 1, .62, 1), 0, true); b.P(0);
    for (let i = 0; i < 8; i++) b.add(new THREE.TorusGeometry(.535, .016, 4, 18, PI / 2), hi, b.M(0, 2.7, 0, 0, -i / 8 * TAU, 0, 1, .62, 1), 0, true);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .26; G.prism(b, .2, .12, .07, VW, Math.cos(a) * .5, 2.72, Math.sin(a) * .5, PI / 2 - a); }
    b.cyl(.09, .14, .14, 20, VW, 0, 3.06, 0); b.S(sk.gold); ring(b, .1, .015, GOLD, 3.12, 20); b.sph(.075, GOLD, 0, 3.2, 0); b.cone(.035, .2, 12, GOLD, 0, 3.36, 0); b.S(null);
    return b.done(); };

  // ---------- la fontaine Wallace ----------
  function cariatide(b, a) { const ca = Math.cos(a), sa = Math.sin(a), ox = ca * .16, oz = sa * .16, tx = -sa, tz = ca, y0 = .76, ry = PI / 2 - a, T = (r, t, y) => [ox + ca * r + tx * t, y0 + y, oz + sa * r + tz * t];
    // la robe drapée qui s'évase jusqu'au sol, ses plis
    const prof = [[0, 0], [.115, 0], [.11, .05], [.095, .18], [.075, .32], [.058, .42], [.055, .46], [0, .46]].map(p => new THREE.Vector2(p[0], p[1]));
    b.add(new THREE.LatheGeometry(prof, 22), VW2, b.M(ox, y0, oz, 0, ry, 0, 1, 1, .82), 0, true);
    for (let k = 0; k < 6; k++) { const t = (k - 2.5) * .036; seg(b, T(.09, t * 1.15, .02), T(.05, t * .55, .42), .011, .006, light(VW2, .12), 6); }
    // le corsage, la taille, les épaules, le cou, la tête et son chignon
    b.add(new THREE.SphereGeometry(1, 16, 12), VW2, b.M(...T(0, 0, .52), 0, ry, 0, .062, .1, .048), 0, true);
    b.add(new THREE.SphereGeometry(1, 16, 10), VW2, b.M(...T(0, 0, .6), 0, ry, 0, .085, .035, .045), 0, true);
    seg(b, T(0, 0, .62), T(0, 0, .67), .02, .018, VW2, 10); b.sph(.044, VW2, ...T(.005, 0, .71), 1, 1.12, 1); b.sph(.027, VW2, ...T(-.035, 0, .74));
    // les bras levés : de l'épaule au coude, du coude aux mains qui portent la coupole
    for (const s2 of [-1, 1]) { const sh = T(0, s2 * .075, .6), el = T(.012, s2 * .1, .76), ha = T(-.01, s2 * .055, .95); seg(b, sh, el, .019, .016, VW2, 8); seg(b, el, ha, .016, .013, VW2, 8); b.sph(.018, VW2, ...ha); }
    // le voile qui tombe des épaules dans le dos
    seg(b, T(-.03, 0, .62), T(-.07, 0, .2), .03, .06, light(VW2, .06), 10);
  }
  MD.fontaine_wallace = v => { const b = G.mb(918), sk = SK(), P = PAT(), hi = light(VW2, .15);
    b.S(sk.paint);
    // le socle octogonal à deux degrés, le piédestal à panneaux, l'écusson
    oct(b, .5, .54, .1, VW2, .05); oct(b, .42, .46, .12, VW2, .16);
    oct(b, .27, .31, .44, VW2, .44); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.box(.14, .3, .02, hi, Math.cos(a) * .285, .44, Math.sin(a) * .285, 0, PI / 2 - a, 0); }
    b.sph(.06, light(VW2, .25), 0, .48, .3, 1, 1.3, .35); oct(b, .34, .3, .06, VW2, .69);
    // la vasque et sa grille, au pied des cariatides
    ring(b, .12, .02, VW2, .74, 24); for (const r of [0, PI / 2]) b.box(.22, .015, .015, dark(VW2, .8), 0, .73, 0, 0, r, 0);
    b.S(null);
    // les quatre cariatides, dos à dos
    b.S(sk.paint); for (let i = 0; i < 4; i++) cariatide(b, i / 4 * TAU + PI / 4); b.S(null);
    // l'entablement, la coupole en écailles, les dauphins, l'épi
    b.S(sk.paint); oct(b, .36, .34, .06, VW2, 1.73); oct(b, .38, .38, .04, hi, 1.78);
    b.P(P.zinc || 0); b.add(new THREE.CylinderGeometry(.07, .35, .26, 8), VW2, b.M(0, 1.93, 0, 0, PI / 8, 0)); b.P(0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4, x = Math.cos(a) * .33, z = Math.sin(a) * .33;
      b.add(new THREE.TorusGeometry(.06, .024, 6, 12, PI * 1.25), VW2, b.M(x, 1.86, z, 0, -a, PI * .15), 0, true); b.sph(.032, VW2, x + Math.cos(a) * .05, 1.83, z + Math.sin(a) * .05); b.cone(.035, .07, 8, VW2, x - Math.cos(a) * .03, 1.95, z - Math.sin(a) * .03); }
    b.cyl(.04, .06, .1, 12, VW2, 0, 2.1, 0); b.sph(.045, VW2, 0, 2.18, 0); b.cone(.025, .1, 8, VW2, 0, 2.27, 0); b.S(null);
    // le filet d'eau qui tombe du centre de la coupole dans la vasque
    b.cyl(.011, .011, .94, 8, 0xcfefff, 0, 1.22, 0, 0, 0, 0, 2); b.add(new THREE.SphereGeometry(.06, 12, 8), 0xdff4ff, b.M(0, .76, 0, 0, 0, 0, 1, .3, 1), 2, true);
    return b.done(); };
})();
