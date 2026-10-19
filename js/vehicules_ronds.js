'use strict';
// ===== Véhicules tout en rondeur : la voiturette (une petite citadine bombée, bulle vitrée, ailes rondes, chromes), le jet-ski (coque profilée),
// la montgolfière (enveloppe en goutte à fuseaux de couleur, nacelle d'osier tressé, brûleur), le cheval (encolure, tête, crinière et queue
// modelées) et l'hélicoptère (poutre de queue effilée, rotor anticouple, patins recourbés). Mêmes dimensions et mêmes points d'attache
// qu'avant : la conduite, les sièges et les roues ne changent pas. =====
(function () {
  const MD = G.MODELS, PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const CHROME = 0xd9dee2, DK = 0x1b1c20, TYRE = 0x1c1c1f, GLASS = 0xcfefff;
  const C3 = c => new THREE.Color(c), dark = (c, k = .7) => C3(c).multiplyScalar(k).getHex(), light = (c, k = .35) => C3(c).lerp(C3(0xffffff), k).getHex();
  const SK = () => G.SK || {};
  // un tronc de cône entre deux points (r1 au départ, r2 à l'arrivée)
  function seg(b, p1, p2, r1, r2, col, n = 14, mat = 0) { const a = new V3(...p1), c = new V3(...p2), d = c.clone().sub(a), L = d.length(); if (L < 1e-4) return;
    b.add(new THREE.CylinderGeometry(r2, r1, L, n), col, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); }
  const ell = (b, col, x, y, z, rx, ry, rz, mat = 0, ws = 28, hs = 18) => b.add(new THREE.SphereGeometry(1, ws, hs), col, b.M(x, y, z, 0, 0, 0, rx, ry, rz), mat, true);
  // un corps de révolution couché le long de x (profil : [rayon, x])
  function lathe(b, prof, col, x, y, z, sy = 1, sz = 1, seg2 = 32, mat = 0) { const g = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), seg2); g.rotateZ(-PI / 2);
    b.add(g, col, b.M(x, y, z, 0, 0, 0, 1, sy, sz), mat, true); }

  // =====================================================================
  // la voiturette (avant vers +x ; roues à x ±.62, z ±.5, rayon .28 ; sièges à x −.2, z ±.26)
  // =====================================================================
  const CCOL = [0x9fd0c9, 0xe8434a, 0xffd23f, 0x5b8fd6, 0xf2e6d2];
  function corpsAuto(b, v) { const c = CCOL[v % 5], cd = dark(c, .82), sk = SK();
    // la caisse : un galet bombé (capot, flancs, malle) sur un bas de caisse arrondi ; des ailes rondes au-dessus des roues
    ell(b, c, .02, .66, 0, 1.0, .34, .55, 0, 36, 20); b.box(1.84, .3, 1.02, c, 0, .5, 0);
    for (const x of [.62, -.62]) for (const s of [-1, 1]) ell(b, c, x, .55, s * .49, .4, .3, .17, 0, 24, 14);
    b.box(1.7, .05, 1.06, cd, 0, .37, 0); // le bas de caisse foncé (jupe)
    // la bulle vitrée, son toit, ses montants
    ell(b, GLASS, -.22, 1.1, 0, .66, .56, .5, 2, 32, 20);
    b.add(new THREE.SphereGeometry(1, 32, 10, 0, TAU, 0, PI * .3), c, b.M(-.22, 1.1, 0, 0, 0, 0, .675, .575, .512), 0, true); // le toit, posé sur le haut de la bulle
    b.add(new THREE.TorusGeometry(1, .02, 6, 40), dark(c, .8), b.M(-.22, 1.1 + .575 * Math.cos(PI * .3), 0, PI / 2, 0, 0, .675 * Math.sin(PI * .3), .512 * Math.sin(PI * .3), 1), 0, true);
    b.add(new THREE.TorusGeometry(1, .025, 6, 48), CHROME, b.M(-.22, .96, 0, PI / 2, 0, 0, .64, .48, 1), 0, true); // le jonc chromé à la base de la bulle
    // l'intérieur : deux sièges, le tableau de bord, le volant
    for (const s of [-1, 1]) { b.box(.36, .14, .34, 0x7a3a26, -.28, .74, s * .26); b.box(.12, .42, .34, 0x7a3a26, -.48, .98, s * .26); }
    b.box(.16, .12, .7, 0x3a2a22, .24, .92, 0); b.tor(.12, .02, DK, .24, 1.02, -.26, 0, PI / 2 + .45, 0, 0, 24); seg(b, [.36, .96, -.26], [.24, 1.02, -.26], .015, .015, DK, 6);
    // l'avant : phares ronds, calandre chromée, pare-chocs, bouchon de radiateur
    for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(.1, .025, 8, 24), CHROME, b.M(.97, .72, s * .32, 0, PI / 2, 0), 0, true); ell(b, 0xfff6c8, .985, .72, s * .32, .03, .095, .095, 1, 16, 10);
      ell(b, 0xffb03a, .93, .58, s * .42, .03, .04, .04, 1, 10, 8); }
    b.add(new THREE.TorusGeometry(.13, .02, 6, 24), CHROME, b.M(1.0, .6, 0, 0, PI / 2, 0, 1, .7, 1), 0, true); for (let k = -2; k <= 2; k++) b.box(.02, .14, .02, CHROME, 1.0, .6, k * .045);
    for (const xb of [1.04, -1.04]) { seg(b, [xb, .42, -.5], [xb, .42, .5], .05, .05, CHROME, 14); for (const s of [-1, 1]) b.sph(.05, CHROME, xb, .42, s * .5, 1, 1, 1, 0, 12, 10); }
    ell(b, CHROME, .62, .99, 0, .05, .03, .03, 0, 12, 8);
    // l'arrière : feux, roue de secours, plaque
    for (const s of [-1, 1]) ell(b, 0xff3a2a, -1.0, .66, s * .38, .03, .06, .05, 1, 12, 8);
    b.add(new THREE.TorusGeometry(.17, .07, 10, 24), TYRE, b.M(-1.05, .78, 0, 0, PI / 2, 0), 0, true); b.cyl(.13, .13, .08, 20, light(c, .4), -1.06, .78, 0, 0, 0, PI / 2);
    b.box(.02, .1, .26, 0xf7f5ee, -1.02, .46, 0);
    // flancs : ligne de portière, poignée, rétroviseurs
    for (const s of [-1, 1]) { b.box(.02, .3, .02, cd, .3, .72, s * .555); b.box(.02, .3, .02, cd, -.62, .72, s * .555); b.box(.1, .025, .02, CHROME, -.5, .82, s * .56); seg(b, [.36, .92, s * .5], [.4, .98, s * .58], .012, .012, CHROME, 6); ell(b, CHROME, .4, 1.0, s * .6, .025, .045, .06, 0, 12, 8); }
  }
  function roueAuto(b, x, y, z) { b.add(new THREE.TorusGeometry(.2, .085, 12, 32), TYRE, b.M(x, y, z), 0, true); b.cyl(.17, .17, .14, 28, 0xf2efe6, x, y, z, PI / 2); b.cyl(.11, .11, .15, 24, CHROME, x, y, z, PI / 2);
    for (const s of [-1, 1]) b.sph(.05, CHROME, x, y, z + s * .08, 1, 1, .5); }
  MD.voiturette = v => { const b = G.mb(2530 + (v || 0)); corpsAuto(b, v || 0); for (const x of [.62, -.62]) for (const z of [.5, -.5]) roueAuto(b, x, .28, z); return b.done(); };
  MD.voiturette_corps = v => { const b = G.mb(2530 + (v || 0)); corpsAuto(b, v || 0); return b.done(); };
  MD.voiturette_roue = () => { const b = G.mb(2539); roueAuto(b, 0, 0, 0); return b.done(); };

  // =====================================================================
  // le jet-ski (avant vers +x ; selle à y .6)
  // =====================================================================
  MD.jetski = v => { const V = v || 0, b = G.mb(2570 + V), hull = [0xffffff, 0xffd23f, 0x45c7c1, 0xe8434a][V % 4], c = [0xe8434a, 0x3b78d8, 0x2f8f55, 0xff9a3c][V % 4];
    const P = [[0, -1.02], [.26, -1.0], [.38, -.85], [.43, -.5], [.44, .05], [.41, .45], [.32, .8], [.17, 1.03], [0, 1.16]];
    lathe(b, P, hull, 0, .24, 0, .5, 1, 36);                                   // la coque
    lathe(b, P.map(([r, x]) => [r * .93, x]), c, 0, .31, 0, .34, 1, 36);        // le pont, de couleur
    for (const s of [-1, 1]) b.box(1.3, .04, .02, light(c, .5), -.05, .28, s * .43);  // filet sur les flancs
    // la selle (un boudin), la colonne de direction, le guidon, le pare-brise
    seg(b, [-.62, .52, 0], [.08, .52, 0], .15, .15, 0x222226, 18); b.sph(.15, 0x222226, -.62, .52, 0, 1, 1, 1, 0, 16, 12); b.sph(.15, 0x222226, .08, .52, 0, 1, 1, 1, 0, 16, 12);
    seg(b, [.22, .4, 0], [.42, .7, 0], .1, .06, c, 14); seg(b, [.44, .72, -.3], [.44, .72, .3], .018, .018, CHROME, 10); for (const s of [-1, 1]) seg(b, [.44, .72, s * .22], [.44, .72, s * .34], .03, .03, DK, 10);
    b.add(new THREE.SphereGeometry(.3, 20, 10, 0, PI, 0, PI / 3), 0xd9f2ff, b.M(.6, .52, 0, 0, PI / 2, -.5), 2, true);
    // l'arrière : marchepied et tuyère
    b.box(.3, .06, .62, light(c, .2), -.95, .3, 0); seg(b, [-1.0, .18, 0], [-1.12, .18, 0], .07, .05, DK, 12);
    for (const s of [-1, 1]) ell(b, 0xfff6c8, .92, .4, s * .12, .03, .035, .035, 1, 10, 8);
    return b.done(); };

  // =====================================================================
  // la montgolfière : enveloppe en goutte à fuseaux, jupe, suspentes, brûleur, nacelle d'osier
  // =====================================================================
  const BAL = [[0xe8434a, 0xffc23d, 0x5b8fd6], [0x4fb35f, 0xffffff, 0xff8fc0], [0x8d6fd1, 0xffd23f, 0x45c7c1], [0xff9a3c, 0xf7f0dc, 0x2f6fb8]];
  MD.montgolfiere = v => { const b = G.mb(127), cols = BAL[(v || 0) % 4], NG = 16;
    const prof = [[.42, 2.78], [.62, 2.9], [.9, 3.12], [1.2, 3.45], [1.45, 3.85], [1.6, 4.3], [1.66, 4.75], [1.6, 5.2], [1.4, 5.6], [1.06, 5.92], [.6, 6.12], [0, 6.2]].map(p => new THREE.Vector2(p[0], p[1]));
    for (let i = 0; i < NG; i++) b.add(new THREE.LatheGeometry(prof, 3, i / NG * TAU, TAU / NG), cols[i % 3], b.M(0, 0, 0), 0, true); // les fuseaux
    for (let i = 0; i < NG; i++) { const a = i / NG * TAU; for (let k = 0; k < prof.length - 1; k++) seg(b, [Math.sin(a) * prof[k].x * 1.005, prof[k].y, Math.cos(a) * prof[k].x * 1.005], [Math.sin(a) * prof[k + 1].x * 1.005, prof[k + 1].y, Math.cos(a) * prof[k + 1].x * 1.005], .012, .012, 0xf7f0dc, 4); } // les coutures
    b.add(new THREE.TorusGeometry(1.665, .035, 6, 64), 0xf7f0dc, b.M(0, 4.75, 0, PI / 2, 0, 0), 0, true);
    b.add(new THREE.CylinderGeometry(.43, .5, .36, 32, 1, true), cols[0], b.M(0, 2.62, 0), 0, true); b.add(new THREE.TorusGeometry(.5, .025, 6, 32), 0x7a5236, b.M(0, 2.44, 0, PI / 2, 0, 0), 0, true); // la jupe
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + PI / 8; seg(b, [Math.cos(a) * .48, 2.44, Math.sin(a) * .48], [Math.cos(a) * .44, .66, Math.sin(a) * .44], .008, .008, 0xd9c79a, 4); }
    // le brûleur : cadre, deux bouteilles de flamme, la flamme
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4; seg(b, [Math.cos(a) * .42, .7, Math.sin(a) * .42], [Math.cos(a) * .18, 1.18, Math.sin(a) * .18], .015, .015, 0x8f969e, 6); }
    b.add(new THREE.TorusGeometry(.2, .02, 6, 20), 0x8f969e, b.M(0, 1.18, 0, PI / 2, 0, 0), 0, true); b.cyl(.09, .11, .22, 16, 0x4a4f56, 0, 1.18, 0);
    b.cone(.08, .3, 10, 0xff9a3c, 0, 1.44, 0, 0, 0, 0, 3); b.cone(.05, .2, 8, 0xffe14a, 0, 1.42, 0, 0, 0, 0, 3);
    // la nacelle d'osier : tressage, bord de cuir rembourré, poignées de corde
    b.box(.94, .64, .94, 0xa8743f, 0, .32, 0);
    for (let k = 0; k < 7; k++) { const y = .08 + k * .085; for (const s of [-1, 1]) { b.box(.95, .025, .02, k % 2 ? 0x8a5d38 : 0xc08a52, 0, y, s * .475); b.box(.02, .025, .95, k % 2 ? 0xc08a52 : 0x8a5d38, s * .475, y, 0); } }
    for (let k = 0; k < 9; k++) for (const s of [-1, 1]) { const u = -.42 + k * .105; b.box(.018, .6, .02, 0x7a5236, u, .32, s * .48); b.box(.02, .6, .018, 0x7a5236, s * .48, .32, u); }
    for (const s of [-1, 1]) { seg(b, [-.5, .68, s * .5], [.5, .68, s * .5], .05, .05, 0x5a3a24, 12); seg(b, [s * .5, .68, -.5], [s * .5, .68, .5], .05, .05, 0x5a3a24, 12); }
    for (const [x, z] of [[.5, .5], [-.5, .5], [.5, -.5], [-.5, -.5]]) b.sph(.06, 0x5a3a24, x, .68, z);
    for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(.08, .012, 4, 12, PI), 0xd9c79a, b.M(s * .49, .5, 0, 0, PI / 2, PI), 0, true);
    return b.done(); };

  // =====================================================================
  // le cheval : encolure et tête modelées, crinière, queue, genoux (mêmes pivots : jambes à x ±.45, z ±.14, y .98)
  // =====================================================================
  const HCOL = [[0x8a5a34, 0x2b1d12], [0x2b2b30, 0x111114], [0xf2ede4, 0xd9cdbb], [0xa8572a, 0x5a2a12], [0xd9b36a, 0xf3ead2]];
  function corpsCheval(b, v) { const [c, m] = HCOL[v % 5], hoof = 0x2b2420;
    ell(b, c, 0, 1.05, 0, .66, .38, .34, 0, 28, 18); ell(b, c, .42, 1.12, 0, .33, .35, .3); ell(b, c, -.42, 1.08, 0, .33, .34, .3);  // le corps, le poitrail, la croupe
    seg(b, [.44, 1.18, 0], [.8, 1.68, 0], .21, .13, c, 18); ell(b, c, .46, 1.22, 0, .2, .2, .18);                                 // l'encolure
    ell(b, c, .86, 1.72, 0, .2, .15, .14); ell(b, c, 1.03, 1.6, 0, .15, .11, .11); ell(b, 0x4a3426, 1.13, 1.55, 0, .05, .06, .09);  // la tête, le chanfrein, le bout du nez
    for (const s of [-1, 1]) { ell(b, DK, 1.15, 1.56, s * .045, .015, .02, .015, 0, 8, 6); ell(b, 0x111111, .93, 1.77, s * .11, .028, .03, .025, 0, 10, 8); b.cone(.045, .15, 10, c, .8, 1.9, s * .07, 0, 0, -.2); }
    for (let k = 0; k < 10; k++) { const t = k / 9, r = .21 - t * .08 + .03, x = .44 + .36 * t - .812 * r, y = 1.18 + .5 * t + .584 * r; ell(b, m, x, y, 0, .07, .075, .05, 0, 10, 8); }  // la crinière, sur le dessus de l'encolure
    ell(b, m, .92, 1.84, 0, .05, .03, .06, 0, 10, 8);                                                                                // le toupet
    seg(b, [-.66, 1.12, 0], [-.78, .92, 0], .07, .06, m, 12); seg(b, [-.78, .92, 0], [-.82, .62, 0], .06, .035, m, 12);            // la queue
    // la selle, le tapis, les étriers, la bride
    b.box(.46, .08, .5, 0x7a3a22, -.02, 1.42, 0); b.box(.52, .03, .58, 0xd9b84a, -.02, 1.38, 0); b.box(.12, .1, .44, 0x5a2a12, -.18, 1.48, 0); b.box(.08, .1, .3, 0x5a2a12, .16, 1.48, 0);
    for (const s of [-1, 1]) { seg(b, [-.02, 1.38, s * .27], [-.02, 1.08, s * .27], .008, .008, 0x333333, 4); b.add(new THREE.TorusGeometry(.04, .01, 4, 10), CHROME, b.M(-.02, 1.04, s * .27), 0, true); }
    b.add(new THREE.TorusGeometry(.12, .012, 6, 16), 0x3a2a22, b.M(1.0, 1.62, 0, 0, PI / 2, .5), 0, true); seg(b, [1.06, 1.58, .1], [.5, 1.42, .2], .008, .008, 0x3a2a22, 4); seg(b, [1.06, 1.58, -.1], [.5, 1.42, -.2], .008, .008, 0x3a2a22, 4);
  }
  const jambe = (b, x, y, z, c) => { seg(b, [x, y, z], [x, y - .5, z], .085, .06, c, 14); b.sph(.065, c, x, y - .5, z); seg(b, [x, y - .5, z], [x, y - .9, z], .055, .045, c, 12); b.cyl(.065, .075, .1, 14, 0x2b2420, x, y - .93, z); };
  MD.cheval = v => { const b = G.mb(2520 + (v || 0)), c = HCOL[(v || 0) % 5][0]; corpsCheval(b, v || 0); for (const [x, z] of [[.45, .14], [.45, -.14], [-.45, .14], [-.45, -.14]]) jambe(b, x, .98, z, c); return b.done(); };
  MD.cheval_corps = v => { const b = G.mb(2520 + (v || 0)); corpsCheval(b, v || 0); return b.done(); };
  MD.cheval_jambe = v => { const b = G.mb(2529 + (v || 0)); jambe(b, 0, 0, 0, HCOL[(v || 0) % 5][0]); return b.done(); };

  // =====================================================================
  // l'hélicoptère : poutre de queue effilée, dérive arrondie, patins recourbés (rotor à y 2.04, rotor de queue en (−2.1, 1.5, .08))
  // =====================================================================
  const KCOL = [0xe8434a, 0x3b78d8, 0xffc23d, 0x2f8f55, 0xf2f2f2];
  function corpsHelico(b, v) { const c = KCOL[v % 5];
    ell(b, c, 0, .62, 0, .78, .32, .58, 0, 32, 20); ell(b, GLASS, .05, 1.14, 0, .74, .6, .56, 2, 32, 22); b.add(new THREE.TorusGeometry(1, .03, 6, 48), dark(c, .8), b.M(.05, .9, 0, PI / 2, 0, 0, .74, .56, 1), 0, true);
    ell(b, c, -.45, .92, 0, .36, .3, .3, 0, 24, 16); seg(b, [-.6, .98, 0], [-2.1, 1.3, 0], .13, .06, c, 18);                 // le capot moteur, la poutre de queue
    ell(b, c, -2.12, 1.52, 0, .18, .32, .04, 0, 20, 12); ell(b, c, -1.98, 1.26, 0, .14, .03, .32, 0, 20, 10);                 // la dérive, le stabilisateur
    b.box(.42, .12, .5, 0x555a60, 0, 1.78, 0); b.cyl(.05, .05, .2, 12, DK, 0, 1.92, 0); b.cyl(.06, .06, .12, 12, DK, -2.1, 1.5, .03, PI / 2);
    // les patins : deux tubes recourbés vers l'avant, et leurs jambes de force
    for (const s of [-1, 1]) { seg(b, [-.75, .08, s * .48], [.6, .08, s * .48], .035, .035, DK, 12); b.add(new THREE.TorusGeometry(.14, .035, 8, 12, PI / 2), DK, b.M(.6, .22, s * .48, 0, 0, -PI / 2), 0, true);
      seg(b, [.38, .1, s * .48], [.3, .5, s * .3], .025, .025, DK, 8); seg(b, [-.45, .1, s * .48], [-.38, .5, s * .3], .025, .025, DK, 8); }
    for (const s of [-1, 1]) b.box(.3, .3, .3, 0x6b3a26, .1, .72, s * .22); ell(b, 0xff3a2a, -2.13, 1.86, 0, .03, .03, .03, 1, 10, 8); ell(b, 0xfff6c8, .7, .55, 0, .05, .05, .08, 1, 12, 10);
  }
  const rotor = (b, y = 0) => { for (const a of [0, PI / 2]) b.box(4.2, .035, .17, 0x2b2b30, 0, y, 0, 0, a, 0); b.cyl(.13, .13, .1, 16, 0x777777, 0, y, 0); b.sph(.07, 0x999999, 0, y + .07, 0); };
  MD.helico = v => { const b = G.mb(2540 + (v || 0)); corpsHelico(b, v || 0); rotor(b, 2.04); for (const a of [0, PI / 2]) b.box(.62, .02, .07, DK, -2.1, 1.5, .1, 0, 0, a); return b.done(); };
  MD.helico_corps = v => { const b = G.mb(2540 + (v || 0)); corpsHelico(b, v || 0); return b.done(); };
  MD.helico_rotor = () => { const b = G.mb(2549); rotor(b); return b.done(); };
  MD.helico_queue = () => { const b = G.mb(2548); for (const a of [0, PI / 2]) b.box(.62, .02, .07, DK, 0, 0, 0, 0, 0, a); b.cyl(.04, .04, .06, 10, 0x777777, 0, 0, 0, PI / 2); return b.done(); };
})();
