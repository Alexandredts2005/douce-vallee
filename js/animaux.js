'use strict';
// ===== Animaux : la vallée prend vie. Chats et chiens autour des maisons ; vaches, moutons, cochons, poules, coq, chevaux, âne
// et chèvres à la ferme ; lapins, écureuils, renard, cerf, biche et faon, hérisson (la nuit) dans les prés et les bois ;
// canards et leurs canetons, cygnes, grenouilles, tortues sur l'eau et les berges ; escargots sous la pluie ; poissons qui sautent.
// Chaque animal est modelé (pelage, ventre, museau, truffe, yeux brillants, oreilles, sabots, cornes…) et articulé :
// pattes qui marchent, trottent ou bondissent, tête qui broute ou regarde, queue qui remue. Ils se promènent, broutent,
// s'assoient, se couchent, dorment la nuit ; les sauvages s'enfuient si l'on court vers eux (approche doucement !).
// E à côté d'un animal : on le caresse (cœurs, ronron, aboiement, meuh…) ; un chien caressé nous suit un moment. =====
(function () {
  const PI = Math.PI, TAU = PI * 2, R = Math.random, O = G.OBJ;
  const SK = () => G.SK || {};
  // ---------- outils de modelage ----------
  const UP = new THREE.Vector3(0, 1, 0);
  const ell = (b, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, ws = 16, hs = 12) => b.add(new THREE.SphereGeometry(1, ws, hs), col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), 0, true);
  function tube(b, p, q, r1, r2, col, seg = 10) { const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = d.length(); d.normalize();
    const m = new THREE.Matrix4().compose(new THREE.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d), new THREE.Vector3(1, 1, 1));
    b.add(new THREE.CylinderGeometry(r2, r1, L, Math.max(8, seg), 1), col, m, 0, true); }
  // une suite de points : tubes + rotules (queues, cous, bois de cerf)
  function chain(b, P, r0, r1, col, joints = true) { for (let i = 0; i < P.length - 1; i++) { const a = r0 + (r1 - r0) * i / (P.length - 1), c = r0 + (r1 - r0) * (i + 1) / (P.length - 1); tube(b, P[i], P[i + 1], a, c, col); if (joints && i) ell(b, col, P[i][0], P[i][1], P[i][2], a, a, a, 0, 0, 0, 10, 8); } }
  // yeux brillants : bille sombre (ou iris + pupille fendue / en barre) et reflet ; hc = centre de la tête
  function eyes(b, hc, ex, ey, ez, r, iris, kind) {
    for (const s of [-1, 1]) { const p = [hc[0] + s * ex, hc[1] + ey, hc[2] + ez], n = new THREE.Vector3(s * ex, ey * .5, ez).normalize(); b.S(SK().ceramic);
      if (iris) { ell(b, iris, p[0], p[1], p[2], r, r, r * .8); const k = r * .5, sc = kind === 'slit' ? [r * .2, r * .78, r * .3] : kind === 'bar' ? [r * .78, r * .22, r * .3] : [r * .5, r * .5, r * .3]; ell(b, 0x0b0b0d, p[0] + n.x * k, p[1] + n.y * k, p[2] + n.z * k, sc[0], sc[1], sc[2], 0, 0, 0, 10, 8); }
      else ell(b, 0x16120f, p[0], p[1], p[2], r, r, r * .85);
      ell(b, 0xffffff, p[0] + n.x * r * .7, p[1] + r * .38, p[2] + n.z * r * .7, r * .26, r * .26, r * .2, 0, 0, 0, 8, 6); }
    b.S(null); }
  // taches posées sur un ellipsoïde (vache, dalmatien, faon, cheval pommelé)
  function spots(b, rnd, c, a, n, col, s0, s1, minY = -.2, flat = .25) { for (let i = 0; i < n; i++) { const th = rnd() * TAU, ph = Math.acos(minY + rnd() * (1 - minY)), u = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)], s = s0 + rnd() * (s1 - s0);
      ell(b, col, c[0] + u[0] * a[0] * .97, c[1] + u[1] * a[1] * .97, c[2] + u[2] * a[2] * .97, s, s * flat + .004, s * (.8 + rnd() * .5), 0, th, 0, 10, 6); } }
  const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
  // une patte : du haut (0) jusqu'au sol (-len) ; pied : coussinet, sabot, patte d'oiseau
  function legGeo(len, r0, r1, col, foot, fcol, low) { const b = G.mb(7), sk = SK(); b.S(sk.fabric);
    ell(b, col, 0, -r0 * .4, 0, r0 * 1.25, r0 * 1.6, r0 * 1.3); // muscle de l'épaule / cuisse
    if (low && low !== col) { tube(b, [0, 0, 0], [0, -len * .55, 0], r0, (r0 + r1) / 2, col); tube(b, [0, -len * .55, 0], [0, -len + r1 * 1.2, 0], (r0 + r1) / 2, r1, low); }
    else tube(b, [0, 0, 0], [0, -len + r1 * 1.2, 0], r0, r1, col);
    if (foot === 'paw') ell(b, low || col, 0, -len + r1 * 1.05, r1 * .45, r1 * 1.35, r1 * 1.05, r1 * 1.7);
    else if (foot === 'hoof') { b.S(null); tube(b, [0, -len + r1 * 1.7, 0], [0, -len, 0], r1 * 1.08, r1 * 1.3, fcol || 0x2a221c); }
    else if (foot === 'bird') { b.S(null); for (const a of [-.5, 0, .5]) tube(b, [0, -len, 0], [Math.sin(a) * r0 * 6, -len, Math.cos(a) * r0 * 6], r1 * .8, r1 * .5, fcol); tube(b, [0, -len, 0], [0, -len, -r0 * 3.5], r1 * .7, r1 * .4, fcol); }
    else ell(b, low || col, 0, -len + r1, 0, r1 * 1.2, r1, r1 * 1.3);
    b.S(null); return b.done(); }
  const done = b => { const g = b.done(); g.computeBoundingSphere(); return g; };

  // =====================================================================
  // ============================ ESPÈCES =================================
  // =====================================================================
  // Chaque espèce fabrique : body (dans le repère du torse, le sol sous le centre du corps en 0), head (pivot au cou),
  // tail (pivot à la croupe), legs [géométrie avant, arrière], hips (épaules / hanches), neck, tailAt, gait, taille.
  const SPECIES = {};
  const def = (k, o) => { SPECIES[k] = o; o.k = k; };
  // ----- quadrupède générique -----
  function quadBody(b, c) { const y = c.leg + c.R * .85, sk = SK(); b.S(sk.fabric);
    ell(b, c.fur, 0, y, 0, c.W / 2, c.R, c.L / 2); // tronc
    ell(b, c.fur, 0, y + c.R * .06, c.L * .3, c.W * .52, c.R * 1.04, c.L * .25); // poitrail, épaules
    ell(b, c.fur, 0, y + c.R * .04, -c.L * .3, c.W * .55, c.R * 1.02, c.L * .25); // croupe, cuisses
    ell(b, c.belly, 0, y - c.R * .38, c.L * .06, c.W * .38, c.R * .62, c.L * .36); // ventre
    b.S(null); return y; }
  function quadSpec(c, head, tail, extra) { const b = G.mb(c.seed || 11), y = quadBody(b, c), rnd = G.rng(c.seed || 11); if (extra) extra(b, y, rnd);
    const hy = c.leg + c.R * .3, hb = G.mb((c.seed || 11) + 1); head(hb, c, rnd);
    const t = G.mb((c.seed || 11) + 2); tail(t, c, rnd);
    return { body: done(b), head: done(hb), tail: done(t), legs: [legGeo(hy, c.legR * 1.15, c.legR * .8, c.legCol || c.fur, c.foot, c.hoof, c.low), legGeo(hy, c.legR * 1.3, c.legR * .8, c.legCol || c.fur, c.foot, c.hoof, c.low)],
      hips: [[c.W * .3, hy, c.L * .33], [c.W * .31, hy, -c.L * .32]], neck: [0, y + c.R * .45 + (c.neckUp || 0), c.L / 2 - c.R * .25 + (c.neckFwd || 0)], tailAt: [0, y + c.R * .45, -c.L / 2 + .02], bodyY: y, leg: hy, L: c.L, R: c.R }; }

  // ---------- CHAT ----------
  const CAT = { roux: [0xe2883e, 0xfff1de, 0xc0622a, 0x9acd32], gris: [0x8c8d94, 0xeceae6, 0x55565c, 0xe8b838], noir: [0x232327, 0xf4f2ee, 0x232327, 0xe8c838], siamois: [0xefe0c6, 0xfaf3e6, 0x4a382c, 0x5aa6e8], calico: [0xf6f1ea, 0xfaf6f0, 0xe08a3a, 0x9acd32] };
  Object.keys(CAT).forEach((v, i) => { const [fur, belly, mark, iris] = CAT[v], dark = v === 'siamois' ? mark : fur;
    def('chat_' + v, { sp: 'chat', name: 'le chat', icon: '🐱', gait: 'walk', speed: .9, run: 2.6, size: .45, pet: 1, flee: 0, home: 'village', build: () => quadSpec({ seed: 300 + i, L: .46, R: .092, W: .16, leg: .16, legR: .026, fur, belly, foot: 'paw', low: v === 'siamois' ? mark : v === 'noir' ? 0xf4f2ee : null },
      (b, c) => { const hc = [0, .07, .085], sk = SK(); b.S(sk.fabric);
        ell(b, v === 'siamois' ? shade(fur, .95) : fur, hc[0], hc[1], hc[2], .1, .088, .092); ell(b, belly, 0, .04, .145, .062, .045, .045); // tête, museau clair
        if (v === 'siamois') ell(b, mark, 0, .06, .14, .07, .06, .05); // masque
        if (v === 'calico') { ell(b, 0x2a2420, -.05, .12, .08, .055, .04, .05); ell(b, 0xe08a3a, .05, .1, .06, .05, .045, .05); }
        for (const s of [-1, 1]) { b.S(sk.fabric); b.cone(.042, .085, 10, v === 'siamois' ? mark : v === 'calico' && s < 0 ? 0x2a2420 : fur, s * .058, .155, .075, -.12, 0, -s * .3); b.S(null); b.cone(.026, .055, 10, 0xf2a0a8, s * .056, .15, .085, -.12, 0, -s * .3); }
        b.S(sk.skin); ell(b, 0xf28a9a, 0, .058, .181, .013, .01, .008); b.S(null); // truffe rose
        tube(b, [0, .05, .18], [0, .033, .176], .003, .003, 0x5a3a36); // bouche
        eyes(b, hc, .043, .02, .075, .021, iris, 'slit');
        for (const s of [-1, 1]) for (const a of [-.12, .05]) tube(b, [s * .035, .045, .17], [s * .13, .045 + a * .3, .16 + a * .1], .0025, .0015, 0xf6f2ea); }, // moustaches
      (b, c) => { const col = v === 'siamois' ? mark : v === 'gris' ? fur : fur; b.S(SK().fabric); chain(b, [[0, 0, 0], [0, .02, -.1], [0, .1, -.17], [0, .22, -.19], [0, .3, -.14]], .026, .02, col); ell(b, v === 'gris' ? mark : col, 0, .3, -.14, .022, .03, .022); b.S(null); },
      (b, y, rnd) => { if (v === 'gris' || v === 'roux') for (let i = 0; i < 6; i++) { const z = -.17 + i * .07; ell(b, mark, 0, y + .085, z, .07, .016, .018, 0, 0, 0, 10, 6); } // rayures du tigré
        if (v === 'calico') { spots(b, rnd, [0, y, 0], [.08, .092, .23], 5, 0xe08a3a, .04, .07, .1); spots(b, rnd, [0, y, 0], [.08, .092, .23], 4, 0x2a2420, .035, .06, .1); } }) }); });

  // ---------- CHIEN ----------
  const DOG = { golden: { fur: 0xdba25a, belly: 0xf2d6a2, ear: 0xc88a44, L: .66, R: .14, W: .23, leg: .27, ears: 'flop', tail: 'plume' },
    dalmatien: { fur: 0xf6f4ee, belly: 0xffffff, ear: 0x1c1c1e, L: .66, R: .13, W: .21, leg: .3, ears: 'flop', tail: 'thin', spot: 0x1c1c1e },
    berger: { fur: 0xc98d4a, belly: 0xe8c08a, ear: 0x2a2018, L: .7, R: .14, W: .22, leg: .3, ears: 'up', tail: 'plume', saddle: 0x231c16 },
    teckel: { fur: 0x8a4622, belly: 0xa8622e, ear: 0x6a3418, L: .6, R: .1, W: .17, leg: .1, ears: 'flop', tail: 'thin' } };
  Object.keys(DOG).forEach((v, i) => { const D = DOG[v];
    def('chien_' + v, { sp: 'chien', name: 'le chien', icon: '🐶', gait: 'walk', speed: 1.2, run: 4, size: .6, pet: 1, flee: 0, home: 'village', build: () => quadSpec({ seed: 320 + i, L: D.L, R: D.R, W: D.W, leg: D.leg, legR: .038, fur: D.fur, belly: D.belly, foot: 'paw', neckUp: .02 },
      (b, c) => { const hc = [0, .1, .08], sk = SK(), s0 = v === 'teckel' ? .85 : 1; b.S(sk.fabric);
        ell(b, D.fur, 0, .1 * s0, .08, .115 * s0, .105 * s0, .11 * s0); // crâne
        ell(b, v === 'berger' ? 0x2a2018 : D.belly, 0, .06 * s0, .19 * s0, .062, .055, .1); // museau
        ell(b, D.fur, 0, .085 * s0, .16 * s0, .07, .055, .07);
        b.S(SK().ceramic); ell(b, 0x161414, 0, .085 * s0, .285 * s0, .03, .024, .022); b.S(null); // truffe
        ell(b, 0xe8707a, 0, .015 * s0, .22 * s0, .025, .008, .04, .35); // langue
        eyes(b, [0, .1 * s0, .08], .052 * s0, .04 * s0, .085 * s0, .02, 0x5a3418, 'round');
        b.S(sk.fabric); for (const s of [-1, 1]) { if (D.ears === 'up') { b.cone(.05, .12, 10, D.ear, s * .065, .2 * s0, .06, -.1, 0, -s * .2); b.S(null); b.cone(.03, .08, 10, 0xd8a890, s * .064, .19 * s0, .07, -.1, 0, -s * .2); b.S(sk.fabric); }
          else ell(b, D.ear, s * .105 * s0, .07 * s0, .06, .03, .09 * s0, .06, .1, 0, s * .25); }
        if (v === 'dalmatien') { ell(b, 0x1c1c1e, .05, .15, .06, .03, .02, .03); ell(b, 0x1c1c1e, -.03, .13, .15, .02, .015, .02); }
        b.S(null); b.tor(.085 * s0, .016, 0xd8343a, 0, -.02, -.01, PI / 2 - .3); ell(b, 0xf2c84a, 0, -.09, .05, .022, .022, .008); }, // collier, médaille
      (b, c) => { b.S(SK().fabric); if (D.tail === 'plume') { chain(b, [[0, 0, 0], [0, .06, -.1], [0, .16, -.18], [0, .24, -.2]], .035, .022, D.fur); for (let i = 0; i < 5; i++) ell(b, D.belly, 0, .04 + i * .045, -.1 - i * .025, .02, .035, .04); }
        else chain(b, [[0, 0, 0], [0, .05, -.1], [0, .13, -.18], [0, .2, -.2]], .022, .012, D.fur); b.S(null); },
      (b, y, rnd) => { if (D.spot) spots(b, rnd, [0, y, 0], [D.W / 2, D.R, D.L / 2], 26, D.spot, .016, .03, -.3, .3);
        if (D.saddle) ell(b, D.saddle, 0, y + D.R * .45, -.02, D.W * .5, D.R * .6, D.L * .36); }) }); });

  // ---------- LAPIN ----------
  [['brun', 0x9a7a5a, 0xe8dcc8], ['gris', 0xa9a5a0, 0xeeeae4], ['blanc', 0xf6f2ec, 0xffffff]].forEach(([v, fur, belly], i) =>
    def('lapin_' + v, { sp: 'lapin', name: 'le lapin', icon: '🐰', gait: 'hop', speed: .7, run: 4.2, size: .3, pet: 1, flee: 4.5, wild: 1, home: 'pre', build: () => {
      const b = G.mb(340 + i), sk = SK(); b.S(sk.fabric); ell(b, fur, 0, .13, -.03, .1, .1, .14); ell(b, fur, 0, .12, -.1, .105, .095, .09); ell(b, belly, 0, .1, .03, .07, .08, .08);
      for (const s of [-1, 1]) ell(b, fur, s * .07, .08, -.1, .04, .065, .08); // cuisses
      ell(b, 0xffffff, 0, .16, -.19, .04, .04, .04); b.S(null); // queue pompon
      const h = G.mb(341 + i); h.S(sk.fabric); ell(h, fur, 0, .06, .05, .07, .068, .075); ell(h, belly, 0, .035, .1, .04, .035, .035);
      for (const s of [-1, 1]) { ell(h, fur, s * .028, .17, .02, .025, .1, .016, -.15, 0, s * .12); h.S(null); ell(h, 0xf2b2bc, s * .028, .17, .032, .014, .08, .006, -.15, 0, s * .12); h.S(sk.fabric); }
      h.S(sk.skin); ell(h, 0xf28aa0, 0, .055, .122, .011, .008, .006); h.S(null); eyes(h, [0, .06, .05], .05, .015, .035, .019, null);
      for (const s of [-1, 1]) tube(h, [s * .02, .035, .115], [s * .09, .04, .11], .002, .0012, 0xffffff);
      const legF = legGeo(.075, .016, .013, fur, 'paw'), lb = G.mb(342 + i); lb.S(sk.fabric); ell(lb, fur, 0, -.04, .02, .02, .035, .03); ell(lb, fur, 0, -.065, .03, .022, .016, .065); lb.S(null);
      return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, fur, 0, 0, 0)), legs: [legF, done(lb)], hips: [[.04, .075, .06], [.065, .075, -.08]], neck: [0, .18, .07], tailAt: [0, .16, -.19], bodyY: .13, leg: .075, L: .3, R: .1 }; } }));

  // ---------- ÉCUREUIL ----------
  def('ecureuil', { sp: 'ecureuil', name: "l'écureuil", icon: '🐿️', gait: 'hop', speed: .9, run: 4.6, size: .25, pet: 1, flee: 4, wild: 1, home: 'bois', build: () => { const fur = 0xc4572a, belly = 0xf4e2c4, b = G.mb(350), sk = SK();
    b.S(sk.fabric); ell(b, fur, 0, .1, -.01, .055, .065, .09); ell(b, belly, 0, .09, .04, .035, .05, .045); for (const s of [-1, 1]) ell(b, fur, s * .04, .07, -.05, .025, .045, .05); b.S(null);
    const h = G.mb(351); h.S(sk.fabric); ell(h, fur, 0, .05, .04, .045, .043, .05); ell(h, belly, 0, .03, .075, .025, .022, .022);
    for (const s of [-1, 1]) { h.cone(.016, .04, 10, fur, s * .025, .1, .03, -.1, 0, -s * .2); ell(h, shade(fur, .8), s * .026, .125, .03, .006, .014, .006); } h.S(null);
    ell(h, 0x2a1a14, 0, .04, .098, .008, .006, .005); eyes(h, [0, .05, .04], .033, .012, .025, .012, null);
    const t = G.mb(352); t.S(sk.fabric); const P = [[0, 0, 0], [0, .06, -.05], [0, .15, -.07], [0, .23, -.04], [0, .28, .02], [0, .27, .07]]; for (let i = 0; i < P.length; i++) { const r = .03 + Math.sin(i / (P.length - 1) * PI) * .028; ell(t, i % 2 ? fur : shade(fur, 1.08), P[i][0], P[i][1], P[i][2], r * .9, r, r * 1.1); } t.S(null);
    return { body: done(b), head: done(h), tail: done(t), legs: [legGeo(.055, .012, .009, fur, 'paw'), legGeo(.06, .02, .012, fur, 'paw')], hips: [[.03, .055, .05], [.04, .055, -.05]], neck: [0, .14, .06], tailAt: [0, .1, -.09], bodyY: .1, leg: .055, L: .2, R: .065 }; } });

  // ---------- HÉRISSON ----------
  def('herisson', { sp: 'herisson', name: 'le hérisson', icon: '🦔', gait: 'walk', speed: .35, run: .8, size: .26, pet: 1, flee: 0, curl: 1, night: 1, wild: 1, home: 'pre', build: () => { const b = G.mb(360), rnd = G.rng(360), sk = SK();
    b.S(sk.fabric); ell(b, 0xb89a78, 0, .07, 0, .1, .07, .13); b.S(null);
    for (let i = 0; i < 90; i++) { const th = rnd() * TAU, ph = Math.acos(.05 + rnd() * .95) * .95, u = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)]; if (u[2] > .55 && u[1] < .55) continue;
      const p = [u[0] * .11, .08 + u[1] * .085, u[2] * .14 - .01], q = [p[0] + u[0] * .06, p[1] + u[1] * .06, p[2] + u[2] * .06 - .015]; tube(b, p, q, .009, .002, i % 3 ? 0x5a4632 : 0xe2d2b8, 6); }
    const h = G.mb(361); h.S(sk.fabric); ell(h, 0xd4b48a, 0, .03, .03, .05, .045, .05); h.cone(.035, .07, 10, 0xd4b48a, 0, .025, .085, PI / 2, 0, 0); h.S(SK().ceramic); ell(h, 0x161210, 0, .025, .12, .012, .01, .01); h.S(null);
    eyes(h, [0, .03, .03], .03, .018, .03, .011, null); for (const s of [-1, 1]) ell(h, 0xb89a78, s * .035, .07, .01, .014, .014, .008);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [legGeo(.035, .011, .009, 0x8a6a4a, 'paw'), legGeo(.035, .012, .009, 0x8a6a4a, 'paw')], hips: [[.06, .035, .06], [.06, .035, -.06]], neck: [0, .05, .11], tailAt: [0, .06, -.13], bodyY: .07, leg: .035, L: .26, R: .07 }; } });

  // ---------- RENARD ----------
  def('renard', { sp: 'renard', name: 'le renard', icon: '🦊', gait: 'walk', speed: 1.1, run: 4.8, size: .6, pet: 1, flee: 6.5, wild: 1, home: 'bois', build: () => quadSpec({ seed: 370, L: .58, R: .1, W: .16, leg: .22, legR: .028, fur: 0xe2702a, belly: 0xfaf3ea, foot: 'paw', low: 0x2a1c16 },
    (b, c) => { const sk = SK(), fur = 0xe2702a; b.S(sk.fabric); ell(b, fur, 0, .08, .07, .09, .075, .085); ell(b, 0xfaf3ea, 0, .05, .1, .07, .045, .06);
      b.cone(.045, .14, 12, fur, 0, .06, .19, PI / 2, 0, 0); ell(b, 0xfaf3ea, 0, .035, .19, .03, .02, .06); b.S(SK().ceramic); ell(b, 0x141212, 0, .062, .262, .016, .013, .012); b.S(sk.fabric);
      for (const s of [-1, 1]) { b.cone(.05, .12, 10, 0x2a1c16, s * .055, .17, .05, -.1, 0, -s * .22); b.S(null); b.cone(.034, .09, 10, 0xfaf3ea, s * .054, .165, .062, -.1, 0, -s * .22); b.S(sk.fabric); }
      b.S(null); eyes(b, [0, .08, .07], .045, .025, .062, .016, 0xe8a030, 'slit'); },
    (b) => { b.S(SK().fabric); const P = [[0, 0, 0], [0, -.04, -.1], [0, -.06, -.22], [0, -.04, -.34], [0, 0, -.42]]; for (let i = 0; i < P.length; i++) { const r = .035 + Math.sin(i / (P.length - 1) * PI * .85) * .045; ell(b, i === P.length - 1 ? 0xfaf3ea : 0xe2702a, P[i][0], P[i][1], P[i][2], r, r * .95, r * 1.4); } b.S(null); }) });

  // ---------- CERF, BICHE, FAON ----------
  function deerSpec(seed, k, antlers, fawn) { const fur = fawn ? 0xb07a44 : antlers ? 0x8e5c34 : 0xa8723e, belly = 0xf3e8d8;
    return quadSpec({ seed, L: .9 * k, R: .16 * k, W: .27 * k, leg: .55 * k, legR: .032 * k, fur, belly, foot: 'hoof', hoof: 0x2a221c, neckUp: .02, neckFwd: -.04 },
      (b) => { const sk = SK(); b.S(sk.fabric); ell(b, fur, 0, .15 * k, .07 * k, .07 * k, .2 * k, .08 * k, .42); // cou
        const hc = [0, .32 * k, .14 * k]; ell(b, fur, hc[0], hc[1], hc[2], .075 * k, .075 * k, .095 * k); ell(b, fur, 0, .3 * k, .25 * k, .045 * k, .045 * k, .075 * k, .2); ell(b, belly, 0, .28 * k, .23 * k, .04 * k, .025 * k, .06 * k, .2);
        b.S(SK().ceramic); ell(b, 0x161210, 0, .3 * k, .315 * k, .022 * k, .02 * k, .015 * k); b.S(sk.fabric);
        for (const s of [-1, 1]) { ell(b, fur, s * .085 * k, .39 * k, .1 * k, .022 * k, .07 * k, .035 * k, -.3, 0, s * .9); b.S(null); ell(b, 0xf0d2c0, s * .085 * k, .39 * k, .108 * k, .014 * k, .05 * k, .012 * k, -.3, 0, s * .9); b.S(sk.fabric); }
        b.S(null); eyes(b, hc, .06 * k, .015 * k, .05 * k, .017 * k, null);
        if (antlers) for (const s of [-1, 1]) { const c = 0xd8c8a8, base = [s * .035, .4, .13], P = [base, [s * .09, .5, .1], [s * .14, .62, .05], [s * .16, .74, .0], [s * .15, .84, -.06]]; chain(b, P, .016, .009, c);
          for (const [i, d] of [[1, [.03, .1, .07]], [2, [.05, .11, .06]], [3, [.04, .1, -.02]]]) tube(b, P[i], [P[i][0] + s * d[0], P[i][1] + d[1], P[i][2] + d[2]], .01, .005, c); } },
      (b) => { b.S(SK().fabric); ell(b, 0xf6efe6, 0, -.01, -.02, .045 * k, .06 * k, .03 * k); ell(b, fur, 0, .02, -.03, .03 * k, .05 * k, .02 * k); b.S(null); },
      (b, y, rnd) => { ell(b, 0xf6efe6, 0, y + .02 * k, -.43 * k, .09 * k, .1 * k, .04 * k); if (fawn) spots(b, rnd, [0, y, 0], [.135 * k, .16 * k, .45 * k], 22, 0xfaf4ea, .014, .022, .25, .3); }); }
  def('cerf', { sp: 'cerf', name: 'le cerf', icon: '🦌', gait: 'walk', speed: 1, run: 6, size: 1.1, pet: 1, flee: 9, wild: 1, home: 'bois', build: () => deerSpec(380, 1.05, true) });
  def('biche', { sp: 'cerf', name: 'la biche', icon: '🦌', gait: 'walk', speed: 1, run: 6, size: 1, pet: 1, flee: 9, wild: 1, home: 'bois', build: () => deerSpec(382, .95, false) });
  def('faon', { sp: 'cerf', name: 'le faon', icon: '🦌', gait: 'walk', speed: 1, run: 6, size: .7, pet: 1, flee: 9, wild: 1, home: 'bois', build: () => deerSpec(384, .62, false, true) });

  // ---------- VACHE ----------
  [['normande', 0xf2eee6, 0x6a3e22], ['holstein', 0xf6f4f0, 0x1e1e20]].forEach(([v, fur, mark], i) =>
    def('vache_' + v, { sp: 'vache', name: 'la vache', icon: '🐮', gait: 'walk', speed: .55, run: 2, size: 1.4, pet: 1, flee: 0, home: 'ferme', build: () => quadSpec({ seed: 390 + i, L: 1.32, R: .3, W: .56, leg: .42, legR: .065, fur, belly: fur, foot: 'hoof', hoof: 0x2a2420, neckUp: -.08, neckFwd: .02 },
      (b) => { const sk = SK(); b.S(sk.fabric); ell(b, fur, 0, .02, .1, .16, .2, .17, .35); // cou épais
        const hc = [0, .05, .3]; ell(b, v === 'normande' ? fur : mark, hc[0], hc[1], hc[2], .14, .15, .16); ell(b, fur, 0, .0, .4, .12, .12, .1); // tête, chanfrein
        if (v === 'normande') for (const s of [-1, 1]) ell(b, mark, s * .09, .09, .36, .06, .06, .05); // lunettes de la normande
        else ell(b, 0xf6f4f0, 0, .06, .43, .04, .1, .04); // liste blanche
        b.S(sk.skin); ell(b, 0xf0b8b0, 0, -.06, .47, .12, .085, .07); b.S(null); for (const s of [-1, 1]) ell(b, 0x5a3a36, s * .045, -.05, .53, .018, .012, .01); // mufle rose, naseaux
        eyes(b, hc, .12, .06, .1, .028, null);
        b.S(sk.fabric); for (const s of [-1, 1]) { ell(b, v === 'normande' ? mark : 0x1e1e20, s * .2, .12, .26, .09, .035, .05, 0, 0, s * .3); b.S(null); ell(b, 0xe8b0a8, s * .2, .115, .27, .06, .02, .03, 0, 0, s * .3); b.S(sk.fabric); }
        b.S(null); for (const s of [-1, 1]) chain(b, [[s * .1, .19, .26], [s * .17, .23, .27], [s * .2, .3, .29]], .022, .01, 0xece2c8); // cornes
        b.tor(.15, .02, 0x6a4022, 0, -.12, .12, PI / 2 - .5); b.S(SK().gold); b.cone(.05, .1, 12, 0xd8b04a, 0, -.26, .22, 0, 0, 0); ell(b, 0xb08a3a, 0, -.31, .22, .015, .015, .015); b.S(null); }, // collier et cloche
      (b) => { chain(b, [[0, 0, 0], [0, -.05, -.06], [0, -.3, -.08], [0, -.55, -.07]], .022, .016, fur); b.S(SK().fabric); ell(b, mark, 0, -.6, -.07, .035, .07, .035); b.S(null); },
      (b, y, rnd) => { spots(b, rnd, [0, y, 0], [.28, .3, .66], v === 'normande' ? 11 : 14, mark, .1, .19, -.45, .2);
        b.S(SK().skin); ell(b, 0xf2b8b4, 0, y - .3, -.3, .12, .09, .12); for (const s of [-1, 1]) for (const t of [-1, 1]) tube(b, [s * .05, y - .36, -.3 + t * .05], [s * .05, y - .42, -.3 + t * .05], .016, .012, 0xe8a4a0); b.S(null); }) }));

  // ---------- MOUTON ----------
  [['noir', 0x26221f], ['blanc', 0xe6d8c2]].forEach(([v, face], i) =>
    def('mouton_' + v, { sp: 'mouton', name: 'le mouton', icon: '🐑', gait: 'walk', speed: .55, run: 2.6, size: .8, pet: 1, flee: 0, home: 'ferme', build: () => { const b = G.mb(400 + i), rnd = G.rng(400 + i), sk = SK(); b.S(sk.fabric);
      const y = .5; for (let k = 0; k < 30; k++) { const th = rnd() * TAU, ph = Math.acos(rnd() * 2 - 1), u = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)]; if (u[1] < -.6) continue; const r = .11 + rnd() * .05; ell(b, shade(0xf6f2ea, .92 + rnd() * .1), u[0] * .22, y + u[1] * .17, u[2] * .33, r, r * .9, r, 0, 0, 0, 12, 8); }
      ell(b, 0xf2eee6, 0, y, 0, .25, .22, .38); b.S(null);
      const h = G.mb(402 + i); h.S(sk.fabric); ell(h, face, 0, .02, .1, .075, .085, .11, .3); ell(h, face, 0, -.03, .19, .055, .055, .06);
      for (let k = 0; k < 6; k++) ell(h, 0xf6f2ea, (k % 3 - 1) * .04, .1 + (k > 2 ? .02 : 0), .04 + (k > 2 ? .04 : 0), .045, .04, .045); // toupet de laine
      for (const s of [-1, 1]) ell(h, face, s * .1, .05, .06, .065, .022, .035, 0, -s * .3, s * .3); h.S(null);
      ell(h, 0x161210, 0, -.04, .245, .022, .012, .01); eyes(h, [0, .02, .1], .06, .03, .06, .016, 0xc8a050, 'bar');
      const t = G.mb(404 + i); t.S(sk.fabric); ell(t, 0xf2eee6, 0, -.03, -.03, .05, .07, .05); t.S(null);
      return { body: done(b), head: done(h), tail: done(t), legs: [legGeo(.3, .03, .024, face, 'hoof', 0x1e1a18), legGeo(.3, .034, .024, face, 'hoof', 0x1e1a18)], hips: [[.12, .3, .22], [.12, .3, -.22]], neck: [0, .62, .32], tailAt: [0, .56, -.38], bodyY: y, leg: .3, L: .76, R: .22 }; } }));

  // ---------- COCHON ----------
  def('cochon', { sp: 'cochon', name: 'le cochon', icon: '🐷', gait: 'walk', speed: .6, run: 2.6, size: .9, pet: 1, flee: 0, home: 'ferme', build: () => { const pk = 0xf4b0b2, dk = 0xe58f98;
    return quadSpec({ seed: 410, L: .86, R: .23, W: .44, leg: .14, legR: .045, fur: pk, belly: 0xf8c4c4, foot: 'hoof', hoof: 0x8a5a54, neckUp: -.06 },
      (b) => { const sk = SK(); b.S(sk.skin); const hc = [0, .02, .1]; ell(b, pk, hc[0], hc[1], hc[2], .16, .15, .15); ell(b, pk, 0, -.04, .12, .14, .1, .12);
        tube(b, [0, -.01, .22], [0, -.01, .29], .07, .068, dk); ell(b, shade(dk, .9), 0, -.01, .292, .066, .066, .008); for (const s of [-1, 1]) ell(b, 0x6a3a3e, s * .025, -.01, .298, .012, .018, .006);
        for (const s of [-1, 1]) b.add(new THREE.ConeGeometry(.07, .13, 10), pk, b.M(s * .1, .14, .08, .9, 0, s * .4, 1, 1, .35), 0, true); b.S(null);
        tube(b, [-.04, -.07, .23], [.04, -.07, .23], .004, .004, 0x8a4a50); eyes(b, hc, .085, .06, .12, .016, null); },
      (b) => { b.S(SK().skin); b.add(new THREE.TorusGeometry(.035, .01, 8, 18, PI * 1.7), pk, b.M(0, .02, -.03, 0, PI / 2, 0), 0, true); b.S(null); },
      (b, y, rnd) => { spots(b, rnd, [0, y, 0], [.22, .23, .43], 4, 0x9a6a4a, .04, .07, -.1, .15); }); } });

  // ---------- POULE, COQ ----------
  function hen(seed, rooster, body, accent) { const b = G.mb(seed), sk = SK(); b.S(sk.fabric);
    ell(b, body, 0, .2, 0, .11, .12, .15); ell(b, rooster ? accent : body, 0, .23, .1, .085, .1, .08); // corps, poitrail
    for (const s of [-1, 1]) ell(b, shade(body, .85), s * .1, .21, -.01, .03, .075, .11, -.15); // ailes
    if (rooster) { for (let i = 0; i < 6; i++) { const a = -.5 + i * .2, P = [[0, .25, -.1], [Math.sin(a) * .04, .38 + i * .01, -.2], [Math.sin(a) * .07, .4, -.3], [Math.sin(a) * .08, .3, -.36]]; chain(b, P, .018, .006, i % 2 ? 0x1a3a2e : 0x2a2a32, false); } }
    else for (let i = 0; i < 5; i++) ell(b, shade(body, i % 2 ? .82 : .95), (i - 2) * .02, .3, -.13, .02, .07, .035, .5); // queue
    b.S(null); const h = G.mb(seed + 1); h.S(sk.fabric); ell(h, rooster ? accent : body, 0, .06, .02, .05, .055, .05); if (rooster) ell(h, accent, 0, 0, -.01, .065, .07, .055); h.S(null);
    for (let i = 0; i < (rooster ? 5 : 3); i++) ell(h, 0xe0302a, 0, .11 + Math.sin(i / (rooster ? 4 : 2) * PI) * .02, .045 - i * .02, .013, rooster ? .03 : .02, .014); // crête
    ell(h, 0xe0302a, 0, .01, .06, .012, rooster ? .03 : .02, .01); h.cone(.016, .045, 10, 0xe8b83a, 0, .055, .08, PI / 2, 0, 0); eyes(h, [0, .06, .02], .038, .015, .028, .011, 0xe8902a, 'round');
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [legGeo(.12, .012, .009, 0xe8b83a, 'bird', 0xe8b83a), null], hips: [[.04, .12, .01]], neck: [0, .3, .12], tailAt: [0, .25, -.15], bodyY: .2, leg: .12, L: .3, R: .12, biped: 1 }; }
  def('poule_rousse', { sp: 'poule', name: 'la poule', icon: '🐔', gait: 'waddle', speed: .5, run: 2.4, size: .35, pet: 1, flee: 2.4, home: 'ferme', build: () => hen(420, false, 0xb8622a) });
  def('poule_blanche', { sp: 'poule', name: 'la poule', icon: '🐔', gait: 'waddle', speed: .5, run: 2.4, size: .35, pet: 1, flee: 2.4, home: 'ferme', build: () => hen(423, false, 0xf6f1e8) });
  def('coq', { sp: 'coq', name: 'le coq', icon: '🐓', gait: 'waddle', speed: .5, run: 2.4, size: .42, pet: 1, flee: 2.4, home: 'ferme', build: () => { const s = hen(426, true, 0x8a2a1a, 0xe8902a); return s; } });

  // ---------- CANARDS, CANETONS, CYGNE ----------
  function duck(seed, v) { const b = G.mb(seed), sk = SK(), male = v === 'male', kid = v === 'caneton', body = kid ? 0xf6d84a : male ? 0xc4c2bc : 0x9a7a58, s = kid ? .55 : 1;
    b.S(sk.fabric); ell(b, body, 0, .06 * s, 0, .1 * s, .075 * s, .17 * s); if (male) { ell(b, 0x7a3e22, 0, .08, .1, .085, .07, .07); ell(b, 0x1c1c1e, 0, .09, -.13, .07, .05, .06); b.S(null); b.add(new THREE.TorusGeometry(.03, .008, 6, 12, PI * 1.5), 0x1c1c1e, b.M(0, .12, -.16, 0, PI / 2, PI / 2), 0, true); b.S(sk.fabric); }
    if (!kid) for (const sd of [-1, 1]) { ell(b, male ? 0xd8d6d0 : shade(body, .85), sd * .07, .09, -.02, .03, .045, .12, -.1); b.S(null); ell(b, 0x3a5ad8, sd * .095, .09, -.05, .006, .018, .03); b.S(sk.fabric); }
    if (!male && !kid) { const rnd = G.rng(seed); spots(b, rnd, [0, .06, 0], [.1, .075, .17], 18, 0x6a4a30, .012, .02, -.1, .3); }
    b.S(null); const h = G.mb(seed + 1); h.S(sk.fabric); const hcol = kid ? 0xf6d84a : male ? 0x1f6a3a : 0x8a6a4a;
    ell(h, kid ? 0xf6d84a : body, 0, .02 * s, 0, .04 * s, .07 * s, .045 * s); ell(h, hcol, 0, .09 * s, .025 * s, .05 * s, .045 * s, .055 * s); if (male) { h.S(null); h.tor(.04, .007, 0xffffff, 0, .045, .005, PI / 2); }
    h.S(null); ell(h, kid ? 0xf0a040 : male ? 0xe8c83a : 0xe08a3a, 0, .08 * s, .085 * s, .026 * s, .01 * s, .045 * s); eyes(h, [0, .09 * s, .025 * s], .04 * s, .015 * s, .03 * s, .01 * s, null);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [legGeo(.05 * s, .01, .008, 0xe8902a, 'bird', 0xe8902a), null], hips: [[.03 * s, .05 * s, .0]], neck: [0, .1 * s, .12 * s], tailAt: [0, .08, -.16], bodyY: .06 * s, leg: .05 * s, L: .34 * s, R: .075 * s, biped: 1, swim: 1 }; }
  def('canard_male', { sp: 'canard', name: 'le canard', icon: '🦆', gait: 'swim', speed: .45, run: 1.8, size: .35, pet: 1, flee: 3.2, wild: 1, home: 'eau', build: () => duck(430, 'male') });
  def('canard_cane', { sp: 'canard', name: 'la cane', icon: '🦆', gait: 'swim', speed: .45, run: 1.8, size: .35, pet: 1, flee: 3.2, wild: 1, home: 'eau', build: () => duck(433, 'cane') });
  def('caneton', { sp: 'caneton', name: 'le caneton', icon: '🐥', gait: 'swim', speed: .5, run: 1.8, size: .2, pet: 1, flee: 3.2, wild: 1, home: 'eau', build: () => duck(436, 'caneton') });
  def('cygne', { sp: 'cygne', name: 'le cygne', icon: '🦢', gait: 'swim', speed: .35, run: 1.4, size: .7, pet: 1, flee: 3, wild: 1, home: 'eau', build: () => { const b = G.mb(440), sk = SK(), W = 0xfbfaf6; b.S(sk.fabric);
    ell(b, W, 0, .1, 0, .17, .12, .3); for (const s of [-1, 1]) ell(b, shade(W, .97), s * .1, .17, -.04, .07, .07, .22, -.25, s * .15); ell(b, W, 0, .16, -.28, .06, .06, .08, -.6); b.S(null);
    const h = G.mb(441); h.S(sk.fabric); const P = [[0, 0, 0], [0, .1, .04], [0, .22, .02], [0, .33, -.02], [0, .42, .02], [0, .47, .08]]; chain(h, P, .045, .03, W); ell(h, W, 0, .47, .09, .04, .04, .055); h.S(null);
    ell(h, 0xe8702a, 0, .455, .15, .016, .014, .05); ell(h, 0x1c1c1e, 0, .47, .115, .018, .02, .02); eyes(h, [0, .47, .09], .035, .01, .015, .009, null);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [null, null], hips: [], neck: [0, .12, .24], tailAt: [0, .1, -.3], bodyY: .1, leg: 0, L: .6, R: .12, biped: 1, swim: 1 }; } });

  // ---------- CHEVAL, ÂNE, CHÈVRE ----------
  function horse(seed, fur, mane, low, k, donkey, dapple) { const belly = donkey ? 0xf2eee8 : fur;
    return quadSpec({ seed, L: 1.36 * k, R: .28 * k, W: .46 * k, leg: .62 * k, legR: .062 * k, fur, belly, foot: 'hoof', hoof: 0x2a221c, low, neckUp: .02, neckFwd: -.06 },
      (b) => { const sk = SK(); b.S(sk.fabric); ell(b, fur, 0, .2 * k, .14 * k, .13 * k, .3 * k, .16 * k, .75); // encolure
        const hc = [0, .46 * k, .38 * k]; ell(b, fur, hc[0], hc[1], hc[2], .11 * k, .12 * k, .14 * k); ell(b, fur, 0, .37 * k, .54 * k, .085 * k, .085 * k, .15 * k, .7); ell(b, donkey ? 0xf2eee8 : shade(fur, .9), 0, .29 * k, .63 * k, .08 * k, .075 * k, .075 * k, .7);
        for (const s of [-1, 1]) ell(b, 0x2a1e1a, s * .035 * k, .29 * k, .7 * k, .012, .016, .008); // naseaux
        if (!donkey && !dapple) ell(b, 0xfaf6ee, 0, .44 * k, .5 * k, .02 * k, .1 * k, .06 * k, .7); // liste blanche
        for (const s of [-1, 1]) { const eh = donkey ? .2 : .1; b.cone(.035 * k, eh * k, 10, fur, s * .05 * k, (.6 + eh / 2) * k, .32 * k, -.2, 0, -s * (donkey ? .3 : .12)); }
        b.S(null); eyes(b, hc, .085 * k, .03 * k, .03 * k, .022 * k, null);
        b.S(sk.hair); for (let i = 0; i < 9; i++) { const u = i / 8; ell(b, mane, 0, (.06 + u * .48) * k, (-.06 + u * .36) * k, .032 * k, (donkey ? .045 : .07) * k, .055 * k, .7); } // crinière
        if (!donkey) ell(b, mane, 0, .58 * k, .4 * k, .03 * k, .05 * k, .05 * k, .3); b.S(null);
        b.tor(.1 * k, .012, 0x5a3a22, 0, .4 * k, .5 * k, .7); }, // licol
      (b) => { b.S(SK().hair); if (donkey) { chain(b, [[0, 0, 0], [0, -.15, -.05], [0, -.45, -.06]], .02, .015, fur); ell(b, mane, 0, -.5, -.06, .03, .08, .03); }
        else for (const dx of [-.025, 0, .025]) chain(b, [[dx, 0, 0], [dx * 1.5, -.12 * k, -.1 * k], [dx * 2, -.4 * k, -.14 * k], [dx * 2.5, -.7 * k, -.12 * k]], .03 * k, .018 * k, mane, false); b.S(null); },
      (b, y, rnd) => { if (dapple) spots(b, rnd, [0, y, 0], [.22 * k, .26 * k, .68 * k], 30, shade(fur, .82), .03, .055, -.1, .25); }); }
  def('cheval_bai', { sp: 'cheval', name: 'le cheval', icon: '🐴', gait: 'walk', speed: .8, run: 4, size: 1.5, pet: 1, flee: 0, home: 'ferme', build: () => horse(450, 0x7a4422, 0x1c1410, 0x1c1410, 1) });
  def('cheval_gris', { sp: 'cheval', name: 'le cheval', icon: '🐴', gait: 'walk', speed: .8, run: 4, size: 1.5, pet: 1, flee: 0, home: 'ferme', build: () => horse(453, 0xd8d6d0, 0xf2f0ea, 0x8a8884, 1, false, true) });
  def('cheval_palomino', { sp: 'cheval', name: 'le cheval', icon: '🐴', gait: 'walk', speed: .8, run: 4, size: 1.5, pet: 1, flee: 0, home: 'ferme', build: () => horse(456, 0xe2b66a, 0xfaf2e2, 0xe2b66a, 1) });
  def('ane', { sp: 'ane', name: "l'âne", icon: '🫏', gait: 'walk', speed: .6, run: 2.6, size: 1.1, pet: 1, flee: 0, home: 'ferme', build: () => horse(459, 0x8e8682, 0x3a3432, 0x6a6460, .8, true) });
  [['blanche', 0xf2eee6, 0xd8c8b0], ['brune', 0x7a5232, 0x2a1e18]].forEach(([v, fur, horn], i) =>
    def('chevre_' + v, { sp: 'chevre', name: 'la chèvre', icon: '🐐', gait: 'walk', speed: .65, run: 3, size: .8, pet: 1, flee: 0, home: 'ferme', build: () => quadSpec({ seed: 460 + i, L: .74, R: .15, W: .25, leg: .34, legR: .03, fur, belly: fur, foot: 'hoof', hoof: 0x2a221c, neckUp: .02 },
      (b) => { const sk = SK(); b.S(sk.fabric); ell(b, fur, 0, .08, .07, .065, .14, .08, .4); const hc = [0, .2, .14]; ell(b, fur, hc[0], hc[1], hc[2], .07, .075, .09); ell(b, fur, 0, .16, .21, .045, .045, .07, .4);
        ell(b, shade(fur, .8), 0, .07, .2, .02, .055, .02, .2); // barbiche
        for (const s of [-1, 1]) ell(b, fur, s * .085, .21, .09, .05, .016, .025, 0, -s * .4, s * .2); b.S(null);
        for (const s of [-1, 1]) chain(b, [[s * .03, .26, .1], [s * .04, .33, .05], [s * .05, .36, -.03], [s * .055, .33, -.09]], .016, .006, 0x8a8278);
        ell(b, 0x1c1816, 0, .15, .275, .014, .01, .008); eyes(b, hc, .055, .02, .05, .016, 0xd8a838, 'bar'); },
      (b) => { b.S(SK().fabric); ell(b, fur, 0, .04, -.02, .025, .06, .025, .6); b.S(null); }) }));

  // ---------- GRENOUILLE, TORTUE, ESCARGOT ----------
  def('grenouille', { sp: 'grenouille', name: 'la grenouille', icon: '🐸', gait: 'frog', speed: .5, run: 3, size: .15, pet: 1, flee: 2.2, wild: 1, night: .5, home: 'berge', build: () => { const g = 0x5aa83a, b = G.mb(470), sk = SK(); b.S(sk.skin);
    ell(b, g, 0, .04, 0, .055, .035, .07); ell(b, 0xd8e88a, 0, .03, .01, .045, .025, .055); for (const s of [-1, 1]) { ell(b, g, s * .055, .025, -.03, .025, .02, .045, 0, s * .3); ell(b, g, s * .07, .01, .01, .015, .01, .04, 0, -s * .3); } // cuisses repliées, pieds
    const rnd = G.rng(470); spots(b, rnd, [0, .04, 0], [.055, .035, .07], 7, 0x2e6a22, .008, .014, .2, .3); b.S(null);
    const h = G.mb(471); h.S(sk.skin); ell(h, g, 0, .02, .03, .045, .028, .04); for (const s of [-1, 1]) ell(h, g, s * .026, .045, .025, .018, .018, .018); h.S(null);
    eyes(h, [0, .045, .025], .026, .004, .008, .012, 0xe8c838, 'bar'); tube(h, [-.035, .012, .05], [.035, .012, .05], .002, .002, 0x2e4a22);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [legGeo(.02, .008, .006, g, 'paw'), null], hips: [[.03, .02, .04]], neck: [0, .04, .05], tailAt: [0, .04, -.07], bodyY: .04, leg: .02, L: .14, R: .035, biped: 1 }; } });
  def('tortue', { sp: 'tortue', name: 'la tortue', icon: '🐢', gait: 'walk', speed: .12, run: .2, size: .3, pet: 1, flee: 0, curl: 1, wild: 1, home: 'berge', build: () => { const b = G.mb(480), sk = SK(), sh = 0x6a6a34;
    b.S(SK().ceramic); ell(b, sh, 0, .07, 0, .12, .085, .15); const rnd = G.rng(480); for (let i = 0; i < 9; i++) { const th = i < 1 ? 0 : (i - 1) / 8 * TAU, rr = i < 1 ? 0 : .7, u = [Math.cos(th) * rr, Math.sqrt(1 - rr * rr * .8), Math.sin(th) * rr]; ell(b, shade(sh, .8), u[0] * .12 * .95, .07 + u[1] * .085 * .95, u[2] * .15 * .95, .04, .012, .045, 0, th, 0, 6, 4); }
    b.S(null); ell(b, 0xc8b878, 0, .035, 0, .115, .02, .14); b.S(sk.skin); ell(b, 0x8a9a5a, 0, .03, -.15, .02, .015, .03);
    const h = G.mb(481); h.S(sk.skin); ell(h, 0x8a9a5a, 0, 0, .02, .03, .028, .05); ell(h, 0x8a9a5a, 0, .01, .07, .032, .03, .035); h.S(null); eyes(h, [0, .01, .07], .025, .01, .015, .009, null);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [legGeo(.04, .02, .017, 0x8a9a5a, 'paw'), legGeo(.04, .02, .017, 0x8a9a5a, 'paw')], hips: [[.08, .04, .08], [.08, .04, -.08]], neck: [0, .05, .14], tailAt: [0, .04, -.15], bodyY: .07, leg: .04, L: .3, R: .085 }; } });
  def('escargot', { sp: 'escargot', name: "l'escargot", icon: '🐌', gait: 'slide', speed: .05, run: .05, size: .12, pet: 1, flee: 0, curl: 1, rain: 1, home: 'pre', build: () => { const b = G.mb(490), sk = SK();
    b.S(sk.skin); ell(b, 0xc8b49a, 0, .012, .0, .022, .012, .07); b.S(SK().ceramic); for (let i = 0; i < 9; i++) { const a = i * .75, r = .045 * Math.pow(.86, i), rr = .032 * Math.pow(.84, i); ell(b, i % 2 ? 0xb87a3a : 0xd89a4a, Math.cos(a) * .0 + 0, .045 + Math.sin(a) * rr, -.01 + Math.cos(a) * rr, r * .55, r, r); } b.S(null);
    const h = G.mb(491); h.S(sk.skin); ell(h, 0xc8b49a, 0, .015, .02, .016, .014, .02); for (const s of [-1, 1]) { tube(h, [s * .006, .022, .025], [s * .014, .055, .04], .003, .002, 0xb8a48a); ell(h, 0x2a2420, s * .014, .056, .04, .004, .004, .004); } h.S(null);
    return { body: done(b), head: done(h), tail: done(G.mb(1).box(.001, .001, .001, 0, 0, 0, 0)), legs: [null, null], hips: [], neck: [0, .005, .06], tailAt: [0, .01, -.07], bodyY: .012, leg: 0, L: .14, R: .02, biped: 1 }; } });

  // =====================================================================
  // ============================ SONS ====================================
  // =====================================================================
  const AU = () => { const A = G.audio; return A && A.ok && A.ctx && A.sfxG ? A : null; };
  let noiseBuf = null;
  function tone(type, f0, f1, dur, vol, at = 0, o = {}) { const A = AU(); if (!A) return; try { const C = A.ctx, t = C.currentTime + at, osc = C.createOscillator(), g = C.createGain(); let out = osc;
      osc.type = type; osc.frequency.setValueAtTime(f0, t); if (o.mid) osc.frequency.linearRampToValueAtTime(o.mid, t + dur * .45); osc.frequency.linearRampToValueAtTime(f1, t + dur);
      if (o.vib) { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibA || f0 * .04; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
      if (o.trem) { const l = C.createOscillator(), lg = C.createGain(), tg = C.createGain(); tg.gain.value = .5; l.frequency.value = o.trem; lg.gain.value = .5; l.connect(lg); lg.connect(tg.gain); out.connect(tg); out = tg; l.start(t); l.stop(t + dur + .05); }
      if (o.lp || o.bp) { const f = C.createBiquadFilter(); f.type = o.bp ? 'bandpass' : 'lowpass'; f.frequency.value = o.bp || o.lp; f.Q.value = o.q || (o.bp ? 4 : .8); out.connect(f); out = f; }
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.04, dur * .2)); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur); out.connect(g); g.connect(A.sfxG); osc.start(t); osc.stop(t + dur + .05); } catch (e) { } }
  function noise(dur, vol, f, at = 0, type = 'bandpass') { const A = AU(); if (!A) return; try { const C = A.ctx, t = C.currentTime + at; if (!noiseBuf) { noiseBuf = C.createBuffer(1, C.sampleRate, C.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = C.createBufferSource(), fl = C.createBiquadFilter(), g = C.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = 1.5; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(A.sfxG); s.start(t); s.stop(t + dur + .02); } catch (e) { } }
  const VOICE = {
    chat: k => { tone('sawtooth', 560, 470, .55 * k, .05, 0, { mid: 780, lp: 1700, vib: 6, vibA: 12 }); },
    ronron: () => { tone('sawtooth', 48, 46, 1.6, .05, 0, { trem: 24, lp: 300 }); },
    chien: () => { for (const a of [0, .2]) { noise(.08, .1, 700, a); tone('square', 330, 190, .11, .05, a, { lp: 1200 }); } },
    vache: () => { tone('sawtooth', 150, 112, 1.3, .06, 0, { mid: 165, lp: 650, vib: 4, vibA: 3 }); },
    mouton: () => { tone('sawtooth', 330, 300, .7, .05, 0, { trem: 17, lp: 1500 }); },
    chevre: () => { tone('sawtooth', 430, 380, .6, .05, 0, { trem: 24, lp: 1800 }); },
    cochon: () => { for (const a of [0, .16, .3]) tone('square', 180, 130, .09, .05, a, { lp: 650 }); },
    poule: () => { [0, .14, .28].forEach(a => tone('square', 760, 620, .06, .035, a, { lp: 2400 })); tone('square', 980, 720, .22, .04, .45, { lp: 2400 }); },
    coq: () => { [[520, .14], [760, .14], [880, .32], [700, .45]].reduce((t, [f, d]) => { tone('sawtooth', f, f * .95, d, .045, t, { lp: 2600, vib: 7 }); return t + d; }, 0); },
    canard: () => { for (const a of [0, .18]) tone('sawtooth', 470, 400, .11, .045, a, { bp: 1100, q: 3 }); },
    caneton: () => { for (const a of [0, .12, .24]) tone('sine', 2100, 2500, .05, .03, a); },
    cygne: () => { tone('square', 520, 480, .2, .03, 0, { bp: 900 }); },
    cheval: () => { tone('sawtooth', 620, 480, .7, .04, 0, { mid: 980, lp: 2200, vib: 12, vibA: 40 }); },
    ane: () => { for (let i = 0; i < 3; i++) { tone('sawtooth', 620, 560, .22, .045, i * .5, { lp: 1800 }); tone('sawtooth', 240, 220, .26, .05, i * .5 + .22, { lp: 900 }); } },
    grenouille: () => { for (const a of [0, .11]) tone('sawtooth', 120, 95, .1, .06, a, { lp: 700, trem: 60 }); },
    renard: () => { tone('square', 920, 560, .12, .03, 0, { lp: 2400 }); },
    cerf: () => { tone('sawtooth', 220, 160, .9, .035, 0, { lp: 700 }); },
    lapin: () => { noise(.06, .03, 3000); }, ecureuil: () => { for (let i = 0; i < 5; i++) tone('square', 2400, 2000, .03, .02, i * .05, { lp: 4000 }); },
    herisson: () => { for (let i = 0; i < 3; i++) noise(.05, .05, 1600, i * .08); }, tortue: () => { }, escargot: () => { },
    splash: () => { noise(.35, .08, 1400, 0, 'lowpass'); } };
  const voice = (sp, d) => { const f = VOICE[sp]; if (!f) return; const p = G.player, A = AU(); if (!A) return; const g = A.sfxG.gain.value, k = d == null ? 1 : Math.max(0, 1 - d / 26); if (k < .05) return; try { A.sfxG.gain.value = g * k; f(1); } finally { A.sfxG.gain.value = g; } };
  G.animalVoice = voice;

  // =====================================================================
  // ======================== FABRIQUE D'UN ANIMAL =========================
  // =====================================================================
  const SPEC = {}; const specOf = k => SPEC[k] || (SPEC[k] = SPECIES[k].build());
  function make(k) { const D = SPECIES[k], S = specOf(k), g = new THREE.Group(), torso = new THREE.Group(), mesh = (geo, sh) => { const me = new THREE.Mesh(geo, G.MATS); me.castShadow = sh; me.frustumCulled = true; return me; }, big = D.size > .5;
    g.add(torso); torso.add(mesh(S.body, big)); const head = new THREE.Group(); head.position.set(...S.neck); head.add(mesh(S.head, big)); torso.add(head);
    const tail = new THREE.Group(); tail.position.set(...S.tailAt); tail.add(mesh(S.tail, false)); torso.add(tail);
    const legs = []; if (S.biped) { if (S.legs[0]) for (const s of [-1, 1]) { const h = S.hips[0], pv = new THREE.Group(); pv.position.set(s * h[0], h[1], h[2]); pv.add(mesh(S.legs[0], false)); torso.add(pv); legs.push(pv); } }
    else for (const [i, s] of [[0, 1], [0, -1], [1, 1], [1, -1]]) { if (!S.legs[i]) continue; const h = S.hips[i], pv = new THREE.Group(); pv.position.set(s * h[0], h[1], h[2]); pv.add(mesh(S.legs[i], big)); torso.add(pv); legs.push(pv); }
    g.rotation.order = 'YXZ'; return { k, D, S, g, torso, head, tail, legs, x: 0, y: 0, z: 0, yaw: R() * TAU, st: 'idle', t: 1 + R() * 3, ph: R() * TAU, act: null, actT: 0, spd: 0, fade: 0, happy: 0, follow: 0, curl: 0, hop: 0, voiceT: 8 + R() * 20, look: 0 }; }

  // =====================================================================
  // ============================ HABITATS ================================
  // =====================================================================
  const FARM_RX = /^(grange|moulin|eolienne_ferme|botte_foin|foin|enclos|abreuvoir|poulailler|mangeoire|epouvantail|tracteur|charrette|ferme_)/;
  let farmCache = { rev: -1, m: null, L: [] };
  function farms(m) { if (farmCache.m === m && farmCache.rev === m.rev) return farmCache.L; const L = []; for (const o of m.list) if (FARM_RX.test(o.t)) { const c = m.center(o); if (!L.some(q => Math.hypot(q[0] - c[0], q[1] - c[1]) < 14)) L.push(c); } farmCache = { rev: m.rev, m, L }; return L; }
  const water = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return false; const i = m.idx(tx, tz); if (!m.water[i]) return false; const o = m.objAt(tx, tz); return !o || !!O[o.t].onWater && !O[o.t].veh2 && !O[o.t].vessel; };
  const small = o => { const d = O[o.t]; return d.walk && !d.plat ? true : G.isFlowerObj(o) || (!d.enter && !d.plat && !d.stair && !d.fixed && (d.h || 0) < .35); };
  function landOK(m, x, z, y0) { const tx = Math.floor(x), tz = Math.floor(z); if (tx < 2 || tz < 2 || tx >= m.W - 2 || tz >= m.H - 2) return false; const i = m.idx(tx, tz); if (m.water[i]) return false; const o = m.objAt(tx, tz); if (o && !small(o)) return false;
    if (m.up && m.up.get(i)) return false; if (y0 != null && Math.abs(gy(m, x, z) - y0) > .5) return false; return true; }
  const gy = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z), o = m.inb(tx, tz) && m.objAt(tx, tz); return o && O[o.t].walk && !O[o.t].plat ? m.topAt(x, z) : m.terrainH(x, z); };
  function near(m, x, z, r, f) { let n = 0; const tx = Math.floor(x), tz = Math.floor(z); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (!m.inb(tx + dx, tz + dz)) continue; const o = m.objAt(tx + dx, tz + dz); if (o && f(o, O[o.t])) n++; } return n; }
  function waterNear(m, x, z, r) { const tx = Math.floor(x), tz = Math.floor(z); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (m.inb(tx + dx, tz + dz) && m.water[m.idx(tx + dx, tz + dz)]) return true; return false; }
  function landNear(m, x, z, r) { const tx = Math.floor(x), tz = Math.floor(z); let n = 0; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (m.inb(tx + dx, tz + dz) && !m.water[m.idx(tx + dx, tz + dz)]) n++; return n; }
  // ce qui peut vivre ici
  function habitat(m, x, z) {
    if (water(m, x, z)) { const ln = landNear(m, x, z, 5); return ln > 3 && ln < 70 ? 'eau' : null; } // pas au large
    if (!landOK(m, x, z)) return null;
    if (waterNear(m, x, z, 1)) return 'berge';
    const fm = farms(m); for (const f of fm) if (Math.hypot(f[0] - x, f[1] - z) < 13) return 'ferme';
    if (near(m, x, z, 5, (o, d) => !!d.enter) > 0) return 'village';
    if (near(m, x, z, 3, (o, d) => d.chop >= 3) >= 3) return 'bois';
    return 'pre';
  }
  const POOL = {
    village: ['chat_roux', 'chat_gris', 'chat_noir', 'chat_siamois', 'chat_calico', 'chien_golden', 'chien_dalmatien', 'chien_berger', 'chien_teckel'],
    ferme: ['vache_normande', 'vache_holstein', 'vache_normande', 'mouton_noir', 'mouton_blanc', 'mouton_blanc', 'cochon', 'cochon', 'poule_rousse', 'poule_blanche', 'poule_rousse', 'coq', 'cheval_bai', 'cheval_gris', 'cheval_palomino', 'ane', 'chevre_blanche', 'chevre_brune'],
    bois: ['ecureuil', 'ecureuil', 'renard', 'cerf_famille', 'lapin_brun', 'herisson'],
    pre: ['lapin_brun', 'lapin_gris', 'lapin_blanc', 'lapin_brun', 'renard', 'herisson', 'escargot'],
    berge: ['grenouille', 'grenouille', 'tortue', 'grenouille'],
    eau: ['canard_famille', 'canard_couple', 'cygne_couple', 'canard_couple'] };
  const CAP = { village: 5, ferme: 14, bois: 7, pre: 6, berge: 4, eau: 8 };

  // =====================================================================
  // ======================== VIE DES ANIMAUX =============================
  // =====================================================================
  let scene = null, list = [], spawnT = 0, fishT = 6, fish = null, lastMap = null;
  G.on('init', sc => { scene = sc; });
  G.animals = () => list; G.animalSpawn = (k, x, z, home) => SPECIES[k] && add(k, x, z, home || SPECIES[k].home); G.ANIMALS = SPECIES;
  function add(k, x, z, home) { const a = make(k), m = G.map; a.x = x; a.z = z; a.hx = x; a.hz = z; a.home = home; a.y = a.D.gait === 'swim' ? m.waterSurf(Math.floor(x), Math.floor(z)) : gy(m, x, z); a.g.scale.setScalar(.01); a.g.position.set(a.x, a.y, a.z); scene.add(a.g); list.push(a); return a; }
  function remove(a) { scene.remove(a.g); const i = list.indexOf(a); if (i >= 0) list.splice(i, 1); }
  function spawn(m, p) { const night = G.night ? G.night() : 0, rain = !!(G.weather && G.weather.wet > .3);
    for (let t = 0; t < 10; t++) { const a = R() * TAU, d = 16 + R() * 26, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, h = habitat(m, x, z); if (!h) continue;
      const cnt = list.filter(q => q.home === h && !q.kid).length; if (cnt >= CAP[h] * (G.settings.quality === 'low' ? .5 : 1)) continue;
      let k = G.pick(POOL[h]); const D0 = SPECIES[k];
      if (D0 && D0.rain && !rain) continue; if (D0 && D0.night && night < .4 && D0.night === 1) k = 'lapin_brun';
      if (h === 'eau' && list.some(q => q.home === 'eau' && Math.hypot(q.x - x, q.z - z) < 6)) continue;
      if (k === 'cerf_famille') { add('cerf', x, z, h); for (const [kk, dx, dz] of [['biche', 1.4, .6], ['faon', .8, -1]]) if (landOK(m, x + dx, z + dz)) add(kk, x + dx, z + dz, h); return; }
      if (k === 'canard_famille') { const mo = add('canard_cane', x, z, h); for (let i = 0; i < 3 + (R() < .5 ? 1 : 0); i++) { const c = add('caneton', x - i * .3, z - .3, h); c.mother = mo; c.rank = i + 1; c.kid = 1; } return; }
      if (k === 'canard_couple') { add('canard_male', x, z, h); if (water(m, x + .6, z)) add('canard_cane', x + .6, z, h); return; }
      if (k === 'cygne_couple') { add('cygne', x, z, h); if (water(m, x + 1.2, z + .4)) add('cygne', x + 1.2, z + .4, h); return; }
      if (SPECIES[k].gait === 'swim' ? water(m, x, z) : landOK(m, x, z)) { add(k, x, z, h); return; } } }
  // nouvelle destination autour de la maison de l'animal
  function wander(a, m) { const D = a.D, r = D.home === 'ferme' ? 7 : D.gait === 'swim' ? 5 : 6;
    for (let t = 0; t < 8; t++) { const ang = R() * TAU, d = 1 + R() * r, x = a.hx + Math.cos(ang) * d, z = a.hz + Math.sin(ang) * d; if (D.gait === 'swim' ? water(m, x, z) : landOK(m, x, z)) { a.tx = x; a.tz = z; a.st = 'walk'; return; } } a.st = 'idle'; a.t = 1 + R() * 2; }
  function flee(a, m, p) { const dx = a.x - p.x, dz = a.z - p.z, L = Math.hypot(dx, dz) || 1, D = a.D;
    for (let t = 0; t < 8; t++) { const ang = Math.atan2(dx, dz) + (R() - .5) * 1.6, d = 5 + R() * 6, x = a.x + Math.sin(ang) * d, z = a.z + Math.cos(ang) * d; if (D.gait === 'swim' ? water(m, x, z) : landOK(m, x, z)) { a.tx = x; a.tz = z; a.st = 'run'; a.t = 4; return true; } } return false; }
  const IDLE = { chat: ['sit', 'lie', 'wash', 'look', 'sleep'], chien: ['sit', 'lie', 'sniff', 'look', 'scratch'], vache: ['graze', 'graze', 'lie', 'look'], mouton: ['graze', 'graze', 'look', 'lie'], chevre: ['graze', 'look', 'graze'], cochon: ['sniff', 'graze', 'lie'],
    cheval: ['graze', 'graze', 'look'], ane: ['graze', 'look'], poule: ['peck', 'peck', 'look'], coq: ['peck', 'look', 'crow'], lapin: ['graze', 'look', 'sit'], ecureuil: ['sit', 'look', 'graze'], renard: ['sit', 'sniff', 'look'], cerf: ['graze', 'graze', 'look'],
    herisson: ['sniff', 'sniff'], grenouille: ['look', 'look', 'croak'], tortue: ['look', 'graze'], escargot: ['look'], canard: ['look', 'dabble', 'preen'], caneton: ['look'], cygne: ['look', 'preen'] };
  const lerp = (a, b, k) => a + (b - a) * k, angDiff = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  function nearestWater(m, x, z, r) { let best = null, bd = 1e9; const tx = Math.floor(x), tz = Math.floor(z); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const X = tx + dx, Z = tz + dz; if (m.inb(X, Z) && m.water[m.idx(X, Z)]) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [X + .5, Z + .5]; } } } return best; }

  G.on('frame', dt => { const m = G.map, p = G.player; dt = Math.min(dt || 0, .1); if (!scene || !m || !p) return;
    const on = !m.interior && G.state === 'play' && (m === G.world || m === G.island);
    if (!on || m !== lastMap) { if (list.length) { for (const a of [...list]) remove(a); } lastMap = m; if (fish) fish.g.visible = false; if (!on) return; }
    const night = G.night ? G.night() : 0, sleepy = night > .6;
    if ((spawnT -= dt) < 0) { spawnT = .45; spawn(m, p); }
    const pv = Math.hypot(p.vx || 0, p.vz || 0), riding = !!p.vehicle;
    for (const a of [...list]) { const D = a.D, S = a.S, d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d > 62) { remove(a); continue; }
      a.fade = Math.min(1, a.fade + dt * 2.5); a.g.scale.setScalar(Math.max(.01, a.fade));
      a.ph += dt; a.t -= dt; if (a.happy > 0) a.happy -= dt; if (a.follow > 0) a.follow -= dt; if (a.curl > 0) a.curl -= dt;
      // ----- réactions au joueur -----
      const spook = D.flee ? D.flee * (pv < 2.6 && !riding ? .45 : 1) * (riding ? 1.4 : 1) : 0;
      if (a.kid && a.mother && list.includes(a.mother)) { if (a.mother.st === 'run' && a.st !== 'run') { a.st = 'run'; a.t = 3; } }
      else if (spook && d < spook && a.st !== 'run' && a.happy <= 0) { const wt = D.sp === 'grenouille' && nearestWater(m, a.x, a.z, 2); if (wt) { a.dive = 1; a.tx = wt[0]; a.tz = wt[1]; a.st = 'run'; a.t = 3; voice('grenouille', d); } else if (flee(a, m, p)) { if (R() < .5) voice(D.sp, d); } }
      if (D.curl && d < 1.6 && pv > .5 && a.curl <= 0) { a.curl = 4 + R() * 3; a.st = 'idle'; a.t = a.curl; }
      if (a.follow > 0 && a.st !== 'run') { if (d > 2) { a.tx = p.x - Math.sin(p.yaw) * .9; a.tz = p.z - Math.cos(p.yaw) * .9; a.st = d > 5 ? 'run' : 'walk'; } else if (a.st === 'walk' || a.st === 'run') { a.st = 'idle'; a.act = 'sit'; a.t = 1; } }
      // ----- voix -----
      if ((a.voiceT -= dt) < 0) { a.voiceT = 14 + R() * 30; if (d < 22 && !(sleepy && !D.night)) { if (D.sp === 'coq') { const h = G.clock.min / 60; if (h > 5.5 && h < 9 || R() < .2) voice('coq', d); } else if (D.sp === 'grenouille') { if (night > .3 || R() < .3) voice('grenouille', d); } else if (!D.wild || R() < .3) voice(D.sp, d); } }
      // ----- décisions -----
      if (a.kid && a.mother && list.includes(a.mother)) { const mo = a.mother, f = a.rank * .32; a.tx = mo.x - Math.sin(mo.yaw) * f; a.tz = mo.z - Math.cos(mo.yaw) * f; const dd = Math.hypot(a.tx - a.x, a.tz - a.z); a.st = dd > .12 ? (mo.st === 'run' || dd > 1 ? 'run' : 'walk') : 'idle'; }
      else if (a.t < 0 && a.st !== 'run' && a.follow <= 0 && a.curl <= 0) { const asleep = sleepy && !D.night && D.sp !== 'canard' && D.sp !== 'cygne';
        if (asleep) { a.st = 'idle'; a.act = D.sp === 'poule' || D.sp === 'coq' || D.gait === 'swim' || D.sp === 'grenouille' ? 'look' : 'sleep'; a.t = 6 + R() * 6; }
        else if (a.st === 'idle' && R() < .62) wander(a, m);
        else { a.st = 'idle'; a.act = G.pick(IDLE[D.sp] || ['look']); a.t = 2 + R() * (a.act === 'sleep' || a.act === 'lie' ? 10 : 5); if (a.act === 'crow') voice('coq', d); } }
      if (a.st === 'run' && a.t < 0 && Math.hypot(a.tx - a.x, a.tz - a.z) < .3) { a.st = 'idle'; a.t = 1; }
      // ----- déplacement -----
      let moving = false;
      if (a.st === 'walk' || a.st === 'run') { const run = a.st === 'run', sp = run ? D.run : D.speed, dx = a.tx - a.x, dz = a.tz - a.z, dd = Math.hypot(dx, dz);
        if (dd < .12) { if (!a.kid) { a.st = 'idle'; a.act = run ? 'look' : null; a.t = run ? .8 : 1 + R() * 3; if (a.dive) { a.dive = 0; voice('splash', d); G.fx.burst(a.x, a.y, a.z, 8, [0xffffff, 0x9fdcff], 1.2, .4, 6); remove(a); continue; } } }
        else { a.yaw = G.angLerp(a.yaw, Math.atan2(dx, dz), Math.min(1, dt * (run ? 7 : 4))); const fa = Math.cos(angDiff(a.yaw, Math.atan2(dx, dz))), step = sp * dt * Math.max(.15, fa) * (D.gait === 'hop' || D.gait === 'frog' ? (Math.sin(a.hop * PI) > .05 ? 1.6 : .15) : 1);
          const nx = a.x + Math.sin(a.yaw) * step, nz = a.z + Math.cos(a.yaw) * step, ok = D.gait === 'swim' ? water(m, nx, nz) : landOK(m, nx, nz, a.y) || (a.dive && waterNear(m, nx, nz, 0));
          if (ok && Math.hypot(nx - p.x, nz - p.z) > .45) { a.x = nx; a.z = nz; moving = true; } else { a.st = 'idle'; a.t = .4 + R(); if (a.kid) a.t = .1; } } }
      // ----- hauteur -----
      if (D.gait === 'swim') { const ws = m.waterSurf(Math.floor(a.x), Math.floor(a.z)); a.y = ws - .01 + Math.sin(a.ph * 2 + a.x) * .012; }
      else a.y = lerp(a.y, a.dive && water(m, a.x, a.z) ? m.waterSurf(Math.floor(a.x), Math.floor(a.z)) : gy(m, a.x, a.z), Math.min(1, dt * 12));
      // ----- regarder le joueur -----
      const lookP = a.st === 'idle' && d < 5 && (a.act === 'look' || a.happy > 0 || a.follow > 0); let lookY = 0;
      if (lookP) { lookY = G.clamp(angDiff(Math.atan2(p.x - a.x, p.z - a.z), a.yaw), -.9, .9); if (Math.abs(lookY) > .85 && a.happy > 0) a.yaw = G.angLerp(a.yaw, Math.atan2(p.x - a.x, p.z - a.z), dt * 3); }
      a.look = lerp(a.look, lookY, Math.min(1, dt * 4));
      animate(a, dt, moving, d);
    }
    // ----- un poisson saute de temps en temps -----
    if ((fishT -= dt) < 0) { fishT = 6 + R() * 10; for (let t = 0; t < 12; t++) { const ang = R() * TAU, dd = 5 + R() * 18, x = p.x + Math.cos(ang) * dd, z = p.z + Math.sin(ang) * dd; if (water(m, x, z) && water(m, x + 1, z) && water(m, x, z + 1)) { jumpFish(m, x, z); break; } } }
    if (fish && fish.on) updFish(m, dt);
  });
  // ---------- les poses ----------
  function animate(a, dt, moving, d) { const D = a.D, S = a.S, T = a.torso, H = a.head, L = a.legs, gait = D.gait, run = a.st === 'run';
    a.g.position.set(a.x, a.y, a.z); a.g.rotation.y = a.yaw;
    let tilt = 0, drop = 0, headX = 0, headY = a.look, legA = 0, roll = 0, bob = 0; const act = a.st === 'idle' ? a.act : null, legsTo = [0, 0, 0, 0];
    if (moving) { const f = run ? (gait === 'hop' ? 2.2 : 2.6) : 1.6; a.gph = (a.gph || 0) + dt * (D.speed > .3 ? 5.5 : 3) * f * (D.size > 1 ? .7 : 1.2); }
    if (gait === 'hop' || gait === 'frog') { if (moving) a.hop = (a.hop + dt * (run ? 3.2 : 2.1)) % 1; else a.hop = 0; const u = Math.sin(a.hop * PI); bob = u * (gait === 'frog' ? .09 : D.size * .45) * (run ? 1.2 : .7); tilt = moving ? -Math.cos(a.hop * PI) * .25 : 0;
      for (let i = 0; i < L.length; i++) legsTo[i] = moving ? (i < 2 ? -.6 : .9) * u : 0; }
    else if (moving) { const g = a.gph, amp = run ? .75 : .45; if (S.biped) { legsTo[0] = Math.sin(g) * amp; legsTo[1] = -Math.sin(g) * amp; roll = gait === 'waddle' || gait === 'swim' ? Math.sin(g) * .12 : 0; bob = Math.abs(Math.sin(g)) * .01; if (gait === 'waddle') headX = Math.sin(g * 2) * .25; }
      else { legsTo[0] = Math.sin(g) * amp; legsTo[3] = Math.sin(g) * amp; legsTo[1] = -Math.sin(g) * amp; legsTo[2] = -Math.sin(g) * amp; bob = Math.abs(Math.cos(g)) * S.R * (run ? .25 : .1); headX = Math.sin(g * 2) * .05; } }
    if (gait === 'slide' && moving) bob = 0;
    // repos
    if (act === 'graze') { headX = .9 + Math.sin(a.ph * 6) * .05; if (S.biped) headX = .6; }
    else if (act === 'peck') { headX = Math.max(0, Math.sin(a.ph * 7)) * 1.1; }
    else if (act === 'sniff') { headX = .55 + Math.sin(a.ph * 9) * .06; headY += Math.sin(a.ph * 1.3) * .4; }
    else if (act === 'sit' && !S.biped) { tilt = -.42; drop = S.leg * .25; headX = -.2; legsTo[2] = legsTo[3] = -1.25; legsTo[0] = legsTo[1] = .42; }
    else if (act === 'lie' || act === 'sleep') { drop = S.leg * .78; headX = act === 'sleep' ? .35 : .05; legsTo[0] = legsTo[1] = -1.35; legsTo[2] = legsTo[3] = 1.35; if (act === 'sleep' && (a.zz = (a.zz || 0) - dt) < 0 && d < 14) { a.zz = 1.4; G.fx.one(a.x, a.y + S.bodyY + S.R * 1.6, a.z, .1, .35, 0, 1.4, -.2, 0xffffff, .09, .6); } }
    else if (act === 'wash') { tilt = -.42; drop = S.leg * .25; legsTo[2] = legsTo[3] = -1.25; legsTo[0] = .42; legsTo[1] = -.9 + Math.sin(a.ph * 8) * .3; headX = .3 + Math.sin(a.ph * 8) * .1; }
    else if (act === 'scratch') { legsTo[3] = -.9 + Math.sin(a.ph * 22) * .4; headY = -.5; tilt = -.15; }
    else if (act === 'crow') { headX = -.7; }
    else if (act === 'dabble') { tilt = .9 + Math.sin(a.ph * 3) * .1; headX = .8; }
    else if (act === 'preen') { headY = 1.2 + Math.sin(a.ph * 4) * .2; headX = .4; }
    else if (act === 'croak') { bob = Math.max(0, Math.sin(a.ph * 10)) * .006; }
    if (a.happy > 0 && !moving) { if (D.sp === 'chien') { bob = Math.abs(Math.sin(a.ph * 10)) * .08; } }
    if (a.curl > 0) { drop = S.leg * .9; headX = .6; for (let i = 0; i < 4; i++) legsTo[i] = i < 2 ? -1.4 : 1.4; }
    // appliquer, en douceur
    const k = Math.min(1, dt * 8); T.rotation.x = lerp(T.rotation.x, tilt, k); T.rotation.z = lerp(T.rotation.z, roll, k); T.position.y = lerp(T.position.y, bob - drop, Math.min(1, dt * 14));
    if (act === 'sit' || act === 'wash') { T.position.z = lerp(T.position.z, -S.L * .12, k); } else T.position.z = lerp(T.position.z, 0, k);
    H.rotation.x = lerp(H.rotation.x, headX, k); H.rotation.y = lerp(H.rotation.y, headY, k);
    const hs = a.curl > 0 && (D.sp === 'herisson' || D.sp === 'tortue' || D.sp === 'escargot') ? .05 : 1; H.scale.setScalar(lerp(H.scale.x, hs, k)); for (const l of L) l.scale.y = lerp(l.scale.y, hs, k);
    for (let i = 0; i < L.length; i++) L[i].rotation.x = lerp(L[i].rotation.x, legsTo[i], Math.min(1, dt * (moving ? 18 : 6)));
    // la queue
    const tl = a.tail; let wag = 0, tx = 0;
    if (D.sp === 'chien') wag = Math.sin(a.ph * (a.happy > 0 || a.follow > 0 ? 18 : 6)) * (a.happy > 0 || a.follow > 0 ? .7 : .25);
    else if (D.sp === 'chat') { wag = Math.sin(a.ph * 1.6) * .35; tx = moving ? -.2 : .1; }
    else if (D.sp === 'vache' || D.sp === 'cheval' || D.sp === 'ane') wag = Math.sin(a.ph * 2.2) * .25 + (Math.sin(a.ph * .7) > .8 ? Math.sin(a.ph * 14) * .3 : 0);
    else if (D.sp === 'cochon') wag = Math.sin(a.ph * 9) * .3; else if (D.sp === 'renard' || D.sp === 'ecureuil') { wag = Math.sin(a.ph * 2) * .2; tx = moving ? (D.sp === 'renard' ? -.3 : .3) : 0; }
    tl.rotation.y = wag; tl.rotation.x = lerp(tl.rotation.x, tx, k);
    // ondes autour des nageurs
    if (D.gait === 'swim' && moving && (a.wake = (a.wake || 0) - dt) < 0) { a.wake = .35; G.fx.one(a.x - Math.sin(a.yaw) * S.L * .5, a.y + .01, a.z - Math.cos(a.yaw) * S.L * .5, 0, .02, 0, .9, 0, 0xffffff, .05 * (D.size + .3), 3); } }

  // ---------- le poisson qui saute ----------
  function jumpFish(m, x, z) { if (!fish) { const b = G.mb(495), sk = SK(); b.S(SK().ceramic); ell(b, 0x8a9aa8, 0, 0, 0, .05, .07, .2); ell(b, 0xe8eef2, 0, -.025, .02, .04, .04, .15); b.add(new THREE.ConeGeometry(.08, .12, 4), 0x6a7a88, b.M(0, 0, -.24, -PI / 2, 0, 0, .25, 1, 1), 0, false); b.S(null); eyes(b, [0, .015, .12], .035, 0, 0, .012, 0xe8d8a8, 'round');
      fish = { g: new THREE.Mesh(done(b), G.MATS) }; fish.g.castShadow = true; scene.add(fish.g); }
    const ws = m.waterSurf(Math.floor(x), Math.floor(z)), a = R() * TAU; Object.assign(fish, { on: 1, t: 0, x, z, ws, dx: Math.sin(a) * 1.2, dz: Math.cos(a) * 1.2, yaw: a, h: .5 + R() * .5 }); fish.g.visible = true; G.fx.burst(x, ws, z, 8, [0xffffff, 0x9fdcff], 1.4, .45, 7); voice('splash', Math.hypot(x - G.player.x, z - G.player.z)); }
  function updFish(m, dt) { const f = fish; f.t += dt / .9; const u = Math.min(1, f.t); fish.g.position.set(f.x + f.dx * u, f.ws + Math.sin(u * PI) * f.h - .05, f.z + f.dz * u); fish.g.rotation.set(-Math.cos(u * PI) * 1.1, f.yaw, Math.sin(u * TAU * 2) * .2, 'YXZ');
    if (u >= 1) { f.on = 0; fish.g.visible = false; G.fx.burst(f.x + f.dx, f.ws, f.z + f.dz, 10, [0xffffff, 0x9fdcff], 1.6, .5, 7); voice('splash', Math.hypot(f.x - G.player.x, f.z - G.player.z)); } }

  // =====================================================================
  // ======================== CARESSER UN ANIMAL ==========================
  // =====================================================================
  function petTarget() { const p = G.player; if (!p || p.vehicle || p.sit || p.swim || p.dead) return null; const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); let best = null, bd = 1.25;
    for (const a of list) { if (!a.D.pet || a.fade < 1) continue; const reach = .55 + a.D.size * .5, d = Math.hypot(a.x - (p.x + fx * reach * .8), a.z - (p.z + fz * reach * .8)); if (d < bd + a.D.size * .3 && Math.abs(a.y - p.y) < 1.2) { bd = d; best = a; } } return best; }
  const PET = { chat: ['Ronron… 💕', 'Il ferme les yeux et ronronne.', 'Il se frotte contre tes jambes !'], chien: ['Il remue la queue comme un fou ! 🐾', 'Ouaf ! Il te suit partout.', 'Il te lèche la main.'], vache: ['Meuh ! Elle a l\'air contente.', 'Elle te regarde avec ses grands yeux doux.'],
    mouton: ['Sa laine est toute douce.', 'Bêêê !'], chevre: ['Elle essaie de mâchouiller ta manche !', 'Mêêê !'], cochon: ['Groin groin ! Il adore les gratouilles.', 'Il se roule de bonheur.'], cheval: ['Il souffle doucement dans ta main.', 'Il hennit de plaisir.'], ane: ['Hi-han ! Il est ravi.', 'Il pose sa tête sur ton épaule.'],
    poule: ['Cot cot ! Elle picore tes chaussures.'], coq: ['Il gonfle fièrement ses plumes.'], lapin: ['Il remue le bout du nez.', 'Tout doux… il ne bouge plus.'], ecureuil: ['Il te regarde, une noisette dans les pattes.'], herisson: ['Aïe ! Ça pique un peu… 🦔'],
    renard: ['Il se laisse approcher… quelle chance !'], cerf: ['Il te laisse caresser son museau.'], grenouille: ['Croâ ! Toute fraîche et toute lisse.'], tortue: ['Elle rentre la tête, puis la ressort tout doucement.'], escargot: ['Il rentre dans sa coquille.'],
    canard: ['Coin coin !'], caneton: ['Piou piou !'], cygne: ['Il incline gracieusement son long cou.'] };
  function pet(a) { const p = G.player, D = a.D; a.happy = 3.5; a.st = 'idle'; a.act = D.sp === 'chat' ? 'sit' : 'look'; a.t = 3.5; a.yaw = Math.atan2(p.x - a.x, p.z - a.z); p.yaw = Math.atan2(a.x - p.x, a.z - p.z);
    G.fx.burst(a.x, a.y + a.S.bodyY + a.S.R * 1.6, a.z, 7, [0xff6f9a, 0xffa8c4, 0xff4f7a], 1.1, 1.1, -1.2, .16); if (D.sp === 'chat') { voice('chat'); setTimeout(() => voice('ronron'), 500); } else voice(D.sp);
    if (D.sp === 'chien') a.follow = 25; if (D.curl) { a.curl = 3; }
    G.ui.toast(D.icon + ' Tu caresses ' + D.name + '. ' + G.pick(PET[D.sp] || ['Il a l\'air content.']), 3500); G.sfx('pickup', .3); }
  G.extraPrompt = () => { if (G.map && G.map.interior) return null; const a = petTarget(); return a ? '<kbd>E</kbd>' + a.D.icon + ' Caresser ' + a.D.name : null; };
  G.on('init', () => { const oi = G.act.interact; G.act.interact = () => { const p = G.player; if (p && !p.vehicle && !p.sit && !G.ents.villagerInFront(p)) { const a = petTarget(); if (a) return pet(a); } return oi(); }; });
})();
