'use strict';
// ===== Ferronnerie verte, façon kiosque et passerelles Belle Époque :
// - plateforme en fer forgé (case 1 × 1) : les cases posées côte à côte forment une grande plateforme, la balustrade
//   (main courante ronde, barreaux, volutes, médaillons dorés) ne court que sur les bords libres ;
//   des colonnes en fonte cannelées à chapiteau doré et consoles en volute la portent, aux angles et toutes les 5 cases ;
// - plateforme suspendue : sans colonnes ;
// - équerres seulement là où elles ont prise : contre une falaise ou un mur de maison juste à côté (à la hauteur du plancher),
//   ferme en fer vers une colonne ou des piliers d'escalier à 3 cases au plus ; rien ne pend dans le vide ;
// - escaliers en fer forgé (1 ou 2 cases de long) qui montent d'un niveau, rampes à volutes, raccords comme ceux en pierre.
// Les niveaux s'empilent : on pose à la hauteur où l'on se trouve (sol → 1er étage ; sur le 1er → 1er ; sur le 2e → 2e…),
// les colonnes grandissent jusqu'au plancher. On passe dessous (seules les colonnes arrêtent), on marche dessus, la balustrade retient.
// Variante (v) — plateforme : 1 N, 2 E, 4 S, 8 W bords raccordés · 16 x multiple de 5 · 256 z multiple de 5 · 32 suspendue · 64/128 étage − 1
//               escalier : 1 long · 4 / 8 voisin gauche / droite · 16 suite en bas · 32 suite en haut · 64/128 hauteur du bas (en niveaux). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const GR = 0x2f5e45, GRD = 0x234536, GRL = 0x3f7a5a, GOLD = 0xd4af37, DK = 0.08; // vert bouteille, plancher, doré
  const SIDES = [[1, 0], [2, -PI / 2], [4, PI], [8, PI / 2]]; // N, E, S, W : bit et rotation (le bord nord est construit, puis tourné)
  const lvlOf = v => G.lvlOf(v); // étage sur 3 bits (escaliers.js)
  // ---------- outils : pièces placées dans un repère tourné (un bord de la case), barres entre deux points, arcs ----------
  const Mx = new THREE.Matrix4(), Rq = new THREE.Quaternion(), Eu = new THREE.Euler();
  const put = (b, g, col, base, x, y, z, rx = 0, ry = 0, rz = 0, smooth = false) => { Eu.set(rx, ry, rz, 'YXZ'); Mx.compose(new V3(x, y, z), Rq.setFromEuler(Eu), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(Mx) : Mx.clone(), 0, smooth); };
  const bar = (b, base, a, c, r, col, n = 6) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, false);
    const m = new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)); b.add(g, col, base ? base.clone().multiply(m) : m, 0, true); };
  const arc = (R, t, a) => new THREE.TorusGeometry(R, t, 4, Math.max(6, Math.round(a * 5)), a);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // tout ce qui est construit pendant f est surélevé de dy (escalier posé en hauteur)
  const lifted = (b, dy, f) => { if (!dy) return f(); const oa = b.add; b.add = (g, c, m, mat, sm) => oa.call(b, g, c, new THREE.Matrix4().makeTranslation(0, dy, 0).multiply(m), mat, sm); try { f(); } finally { b.add = oa; } };
  // ---------- balustrade d'un bord (repère : bord nord, x de −0,5 à 0,5) ----------
  function railing(b, base, y0, startPost, endPost) {
    const z = -.5 + .045;
    put(b, box(1, .035, .03), GR, base, 0, y0 + .07, z); put(b, box(1, .02, .022), GR, base, 0, y0 + .74, z); put(b, box(1, .014, .036), GOLD, base, 0, y0 + .9, z);
    put(b, new THREE.CylinderGeometry(.028, .028, 1, 10), GR, base, 0, y0 + .935, z, 0, 0, PI / 2, true);
    for (let i = 0; i < 7; i++) { const x = -.5 + (i + .5) / 7; put(b, box(.016, .67, .016), GR, base, x, y0 + .405, z);
      put(b, new THREE.SphereGeometry(.016, 8, 6), GOLD, base, x, y0 + .755, z, 0, 0, 0, true); }
    for (let i = 0; i < 6; i++) { const x = -.5 + (i + 1) / 7; // volutes en S entre la lisse et la main courante
      put(b, arc(.034, .005, PI), GR, base, x - .034, y0 + .815, z, 0, 0, 0, true); put(b, arc(.034, .005, PI), GR, base, x + .034, y0 + .815, z, 0, 0, PI, true); }
    // médaillon central doré et grandes volutes en C de part et d'autre
    put(b, new THREE.TorusGeometry(.075, .009, 6, 20), GR, base, 0, y0 + .42, z, 0, 0, 0, true); put(b, new THREE.SphereGeometry(.03, 10, 8), GOLD, base, 0, y0 + .42, z, 0, 0, 0, true);
    for (const s of [-1, 1]) { put(b, arc(.11, .008, PI * 1.25), GR, base, s * .27, y0 + .42, z, 0, 0, s < 0 ? PI * .375 : -PI * .625, true); put(b, new THREE.SphereGeometry(.018, 8, 6), GOLD, base, s * .27, y0 + .42, z, 0, 0, 0, true); }
    for (const [ok, x] of [[startPost, -.5 + .03], [endPost, .5 - .03]]) if (ok) { put(b, box(.055, 1.0, .055), GR, base, x, y0 + .5, z); put(b, box(.08, .03, .08), GR, base, x, y0 + 1.0, z); put(b, new THREE.SphereGeometry(.034, 12, 10), GOLD, base, x, y0 + 1.055, z, 0, 0, 0, true); }
  }
  // ---------- style Eiffel : un quart de cercle de fer (de bas en haut, en s'écartant), des anneaux dans l'écoinçon, des boulons dorés ----------
  // p(t) donne un point du repère ; base : repère tourné (ou null)
  function curveBars(b, base, p, r, n = 10) { let a = p(0); for (let i = 1; i <= n; i++) { const c = p(i / n); bar(b, base, a, c, r, GR, 6); a = c; } }
  // console courbe : part de (x0,z0) à la hauteur yb, monte en s'écartant de L dans la direction (dx,dz) jusqu'à yt
  function eiffelConsole(b, base, x0, z0, dx, dz, yb, yt, L) { const R = yt - yb, P = t => { const a = t * PI / 2; return [x0 + dx * L * (1 - Math.cos(a)), yb + R * Math.sin(a), z0 + dz * L * (1 - Math.cos(a))]; };
    curveBars(b, base, P, .016, 8); bar(b, base, [x0, yb, z0], [x0, yt, z0], .014, GR, 6); bar(b, base, [x0, yt - .01, z0], [x0 + dx * L, yt - .01, z0 + dz * L], .014, GR, 6);
    const ry = Math.atan2(dx, dz) + PI / 2; for (const [f, rr] of [[.36, .08], [.7, .05]]) { const q = [x0 + dx * L * f * .55, yt - R * (1 - f) * .45, z0 + dz * L * f * .55]; put(b, arc(rr * Math.min(1.4, L / .45), .007, PI * 2), GR, base, q[0], q[1], q[2], 0, ry, 0, true); }
    put(b, arc(.05, .007, PI * 1.5), GR, base, x0 + dx * L * .9, yt - .06, z0 + dz * L * .9, 0, ry, PI, true);
    for (const q of [[x0, yb, z0], [x0 + dx * L, yt - .01, z0 + dz * L]]) put(b, new THREE.SphereGeometry(.024, 6, 4), GOLD, base, q[0], q[1], q[2], 0, 0, 0, true); }
  // ---------- colonne en fonte du sol jusqu'en top : socle, fût cannelé, bagues dorées, chapiteau, consoles en volute ----------
  function column(b, x, z, dirs, top) {
    G.rbox(b, .2, .08, .2, .02, GRD, x, .04, z); b.tor(.062, .016, GOLD, x, .1, z, PI / 2, 0, 0, 0, 16);
    const h = top - .3; b.cyl(.04, .046 + Math.min(.02, h * .006), h, 16, GR, x, .1 + h / 2, z, 0, 0, 0, 0, true);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; b.box(.008, h - .06, .012, GRL, x + Math.cos(a) * .043, .13 + (h - .06) / 2, z + Math.sin(a) * .043, 0, -a, 0); }
    for (let y = .55; y < top - .4; y += T) b.tor(.047, .011, GOLD, x, y, z, PI / 2, 0, 0, 0, 16); // une bague dorée à chaque étage
    b.cyl(.085, .045, .12, 16, GR, x, top - .14, z, 0, 0, 0, 0, true); b.tor(.07, .012, GOLD, x, top - .2, z, PI / 2, 0, 0, 0, 16); b.box(.19, .04, .19, GRD, x, top - .06, z);
    for (const [dx, dz] of dirs) eiffelConsole(b, null, x + dx * .05, z + dz * .05, dx, dz, top - .8, top - .05, .44); // consoles courbes, du fût jusque sous le plancher
  }
  // ---------- ferme en treillis sous une case sans appui, vers le pilier le plus proche (colonne d'une plateforme ou pilier d'escalier) ----------
  // dir : N, E, S, O ; k : distance du pilier en cases (1 à 3) ; off : position du pilier dans sa case, le long de la ferme ; lat : 0 dans l'axe, 1 / 2 d'un côté, 3 des deux côtés.
  // Chaque case dessine son morceau, celle qui touche le pilier va jusqu'au fût : la ferme est d'un seul tenant, plus haute près du pilier.
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], OFFS = [0, .37, -.38, .38], LAT = .38, WGS = .065;
  const ring = R => new THREE.TorusGeometry(R, .007, 4, 14);
  function truss(b, top, dir, k, lat, off) {
    const [dx, dz] = DIRS[dir], nx = -dz, nz = dx, sp = k + off, s1 = k === 1 ? sp : .5, y1 = top - DK - .018, ry = Math.atan2(dx, dz) + PI / 2;
    const low = s => y1 - .16 - .55 * Math.pow(Math.max(0, 1 - Math.max(0, sp - s) / 3.2), 2);
    const posts = []; for (let s = -.5; s < s1 - .3; s += .5) posts.push(s); // un montant tous les demi-cases ; le montant du bord côté pilier est celui de la case suivante
    const lines = lat === 3 ? [-LAT, LAT] : lat === 1 ? [LAT] : lat === 2 ? [-LAT] : [0];
    for (const l of lines) { const W = (s, y) => [dx * s + nx * l, y, dz * s + nz * l];
      curveBars(b, null, t => { const s = -.5 + (s1 + .5) * t; return W(s, low(s)); }, .02, Math.max(3, Math.round((s1 + .5) * 6))); // membrure basse courbe
      bar(b, null, W(-.5, y1), W(s1, y1), .016, GR, 6); // membrure haute, contre le plancher
      posts.forEach((s, i) => { const s2 = i + 1 < posts.length ? posts[i + 1] : s1, q = W(s, low(s)), q2 = W(s2, low(s2)), mid = (s + s2) / 2, h = y1 - low(mid), m = W(mid, (y1 + low(mid)) / 2);
        bar(b, null, W(s, y1), q, .011, GR, 6); b.sph(.02, GOLD, q[0], q[1], q[2], 1, 1, 1, 0, 6, 4); // montant, boulon doré
        bar(b, null, W(s, y1), q2, .008, GR, 5); bar(b, null, q, W(s2, y1), .008, GR, 5); // croix de Saint-André
        if (h > .22) put(b, ring(Math.min(.11, h * .28)), GR, null, m[0], m[1], m[2], 0, ry, 0, true); });
      if (k === 1) { const e = W(s1, low(s1)); b.sph(.026, GOLD, e[0], e[1], e[2], 1, 1, 1, 0, 8, 6); } } // boulonnée sur le fût
    if (lines.length === 2) for (const s of posts) bar(b, null, [dx * s - nx * LAT, low(s), dz * s - nz * LAT], [dx * s + nx * LAT, low(s), dz * s + nz * LAT], .008, GR, 5); // entretoises entre les deux fermes
  }
  // équerre murale (côté nord du repère) : montant plaqué contre la paroi (gap : retrait du mur derrière le bord de la case), bras sous le plancher, grande courbe et anneaux
  function wallBracket(b, base, y0, gap) { for (const x of [-.27, .27]) { const z = -.5 - gap + .03; b.add(new THREE.BoxGeometry(.09, .9, .02), GRD, base.clone().multiply(new THREE.Matrix4().makeTranslation(x, y0 - .45, z - .018)), 0);
    eiffelConsole(b, base, x, z, 0, 1, y0 - .82, y0 - .02, .62 + gap); for (const y of [y0 - .12, y0 - .7]) put(b, new THREE.SphereGeometry(.02, 8, 6), GOLD, base, x, y, z - .005, 0, 0, 0, true); } }
  // ---------- plateforme (wg : retrait du mur de chaque côté, 3 bits par côté, en pas de 6,5 cm) ----------
  function platform(b, v, wg = 0) {
    const susp = v & 32, k = lvlOf(v) + 1, top = k * T, solid = (v >> 11) & 15;
    b.box(1, DK, 1, GRD, 0, top - DK / 2, 0);
    for (let q = -2; q <= 2; q++) { b.box(1, .012, .022, GR, 0, top + .004, q * .2); b.box(.022, .012, 1, GR, q * .2, top + .004, 0); } // caillebotis
    b.box(1, .06, .05, GRD, 0, top - DK - .03, 0); b.box(.05, .06, 1, GRD, 0, top - DK - .03, 0); // poutres sous le plancher
    for (const [bit, a] of SIDES) { if (v & bit) continue; const base = new THREE.Matrix4().makeRotationY(a), nxt = SIDES[(SIDES.findIndex(s => s[0] === bit) + 1) % 4][0];
      put(b, box(1, .14, .035), GR, base, 0, top - DK - .07, -.5 + .0175); put(b, box(1, .012, .006), GOLD, base, 0, top - DK - .07, -.5 - .002); // poutre de rive, filet doré
      for (let q = 0; q < 4; q++) put(b, arc(.11, .007, PI), GR, base, -.375 + q * .25, top - DK - .14, -.5 + .02, 0, 0, PI, true); // festons
      railing(b, base, top, true, !!(v & nxt)); }
    // une falaise ou un mur de maison juste à côté, à la hauteur du plancher : l'équerre s'y fixe d'elle-même (montant contre la paroi, bras sous le plancher)
    SIDES.forEach(([bit, a], i) => { if (solid & (1 << i)) wallBracket(b, new THREE.Matrix4().makeRotationY(a), top - DK - .02, ((wg >> (3 * i)) & 7) * WGS); });
    // sinon, dans chaque axe, une ferme vers la colonne ou les piliers d'escalier les plus proches (3 cases au plus) ; sans rien à quoi se fixer, rien ne pend sous le plancher
    for (const ax of [0, 1]) { const f = (v >> (15 + 8 * ax)) & 255; if (f & 3) truss(b, top, (f & 3) === 1 ? ax : ax + 2, (f >> 2) & 3 || 1, (f >> 4) & 3, OFFS[(f >> 6) & 3]); }
    if (!susp) { const cols = [], tp = top - DK; if ((v & 16) && (v & 256)) cols.push([0, 0, [[1, 0], [-1, 0], [0, 1], [0, -1]]]);
      for (const [b1, b2, cx, cz] of [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]]) if (!(v & b1) && !(v & b2)) cols.push([cx, cz, [[-Math.sign(cx), 0], [0, -Math.sign(cz)]]]);
      for (const [x, z, d] of cols) column(b, x, z, d, tp); }
  }
  MD.plateforme_fer = v => { const b = G.mb(960 + ((v || 0) & 1023)); platform(b, v || 0); return b.done(); };
  // le jeu réserve les variantes ≥ 100 aux lampes éteintes : étage, suspendue et « z multiple de 5 » vont dans le nom du modèle
  for (let c = 0; c < 64; c++) MD['pf_' + c] = v => { const b = G.mb(1100 + c * 32 + (v & 31)); platform(b, (v & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2)); return b.done(); };
  // équerres murales (4 bits), fermes des deux axes (2 × 8 bits) et retrait des murs (o.wg) vont aussi dans le nom du modèle
  const pfKey = (v, o) => { const c = Math.min(15, lvlOf(v)) * 4 + (v & 32 ? 2 : 0) + (v & 256 ? 1 : 0), ex = ((v >> 11) & 15) | (((v >> 15) & 0xffff) << 4), wg = (o && o.wg) || 0;
    return (ex ? 'pfx_' + c + '_' + ex + (wg ? '_' + wg : '') : 'pf_' + c) + ':' + (v & 31); };
  const ogg = G.getGeo; G.getGeo = (name, v = 0) => { if (typeof name === 'string' && name.startsWith('pfx_') && !MD[name]) { const [, c, ex, wg] = name.split('_').map(Number);
      MD[name] = vv => { const b = G.mb(1100 + c * 32 + (vv & 31)); platform(b, (vv & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2) | ((ex & 15) << 11) | (((ex >> 4) & 0xffff) << 15), wg || 0); return b.done(); }; }
    return ogg(name, v); };
  // ---------- escalier en fer forgé ----------
  const NST = D => D === 1 ? 6 : 8;
  function ironStairs(b, D, J, e) {
    const n = NST(D), rr = T / n, t = D / n, L = Math.hypot(D, T), a = Math.atan2(T, D), hr = z => .95 + (D / 2 - z) / D * T, Y0 = e * T;
    lifted(b, Y0, () => {
      for (const s of [-1, 1]) { put(b, box(.03, .16, L + .05), GR, null, s * .47, T / 2 - .04, 0, a); put(b, box(.034, .012, L + .05), GOLD, null, s * .47, T / 2 + .045, 0, a); } // limons
      for (let i = 0; i < n; i++) { const zf = D / 2 - i * t, top = (i + 1) * rr, zc = zf - t / 2;
        b.box(.9, .025, t - .015, GRD, 0, top - .0125, zc); b.box(.9, .035, .02, GR, 0, top - .0175, zf - .01);
        for (let k = -1; k <= 1; k++) b.box(.86, .008, .018, GRL, 0, top + .004, zc + k * t * .28);
        put(b, arc(.07, .006, PI), GR, null, 0, top - .035, zf - .012, 0, 0, PI, true); } // feston sous le nez de marche
      for (const s of [-1, 1]) { if (s < 0 ? J.L : J.R) continue; const x = s * .47;
        bar(b, null, [x, hr(D / 2), D / 2 - .03], [x, hr(-D / 2), -D / 2 + .03], .026, GR, 10); bar(b, null, [x, hr(D / 2) - .05, D / 2 - .03], [x, hr(-D / 2) - .05, -D / 2 + .03], .007, GOLD, 6);
        for (let i = 0; i < n; i++) { const zc = D / 2 - (i + .5) * t, top = (i + 1) * rr; b.box(.016, hr(zc) - top, .016, GR, x, (hr(zc) + top) / 2, zc);
          if (i < n - 1) put(b, arc(.05, .006, PI * 1.5), GR, null, x, (hr(zc - t / 2) + top + rr) / 2, zc - t / 2, 0, PI / 2, -a, true); }
        if (!J.F) { b.box(.055, 1.02, .055, GR, x, .51, D / 2 - .03); b.box(.08, .03, .08, GR, x, 1.03, D / 2 - .03); b.sph(.036, GOLD, x, 1.09, D / 2 - .03, 1, 1, 1, 0, 12, 10);
          if (!e) for (const R of [.1, .065, .035]) put(b, arc(R, .009, PI * 1.6), GR, null, x, .3, D / 2 + .02 + R * .3, 0, PI / 2, 0, true); } // volute de départ
        if (!J.B) { b.box(.055, 1.2, .055, GR, x, T + .4, -D / 2 + .03); b.sph(.036, GOLD, x, T + 1.04, -D / 2 + .03, 1, 1, 1, 0, 12, 10); } } });
    // supports : une colonne sous le milieu de la grande volée ; en hauteur, des colonnes du sol jusqu'aux deux bouts
    // supports : au sol, une colonne sous le milieu de la grande volée ; en hauteur, une paire de colonnes tous les 3 escaliers (J.P)
    if (D === 2 && (!e || J.P)) column(b, 0, 0, [], Y0 + T / 2 - .12);
    if (e && J.P) for (const s of [-1, 1]) { column(b, s * .4, D / 2 - .12, [], Y0 - .04); eiffelConsole(b, null, s * .4, D / 2 - .12, 0, -1, Y0 - .75, Y0 + .25, .5); eiffelConsole(b, null, s * .4, D / 2 - .12, 0, 1, Y0 - .75, Y0 - .1, .3); }
  }
  MD.esc_fer = v => { const b = G.mb(980 + ((v || 0) & 3)); ironStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32, P: v & 2 }, lvlOf(v)); return b.done(); };
  for (let e = 0; e < 16; e++) MD['ef_' + e] = v => { const b = G.mb(1700 + e * 4 + (v & 3)); ironStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32, P: v & 2 }, e); return b.done(); };
  const efKey = v => 'ef_' + lvlOf(v) + ':' + (v & 63);
  // ===================== MARBRE BLANC ET PIERRE DE TAILLE : la même terrasse, version palais =====================
  // dalle de marbre à damier, corniche moulurée, balustres en vase et pilastres à boule, consoles de pierre sous le bord ;
  // piliers en pierre de taille (assises de blocs, socle, chapiteau de marbre) et arcs de pierre vers le pilier le plus proche ;
  // contre un mur ou une falaise, de grosses consoles de pierre. Les piliers descendent jusqu'au fond de l'eau : on la pose au bord d'un lac.
  const MW = 0xf5f2ec, MG = 0xdfd9cf, MV = 0xcfc8bd, ST = 0xd9cfbd, STD = 0xc8bca6, STL = 0xe4dccd;
  const BAL = [[0, 0], [.034, 0], [.034, .04], [.026, .06], [.03, .12], [.046, .22], [.05, .3], [.04, .37], [.024, .44], [.02, .48], [.03, .5], [.036, .54], [0, .54]].map(p => new THREE.Vector2(p[0], p[1]));
  const balGeo = new THREE.LatheGeometry(BAL, 12);
  function marbleRail(b, base, y0, startPost, endPost) { const z = -.5 + .06;
    put(b, box(1, .08, .12), MV, base, 0, y0 + .04, z); put(b, box(1, .03, .14), MW, base, 0, y0 + .095, z); // plinthe
    for (let i = 0; i < 5; i++) b.add(balGeo.clone(), MW, base.clone().multiply(new THREE.Matrix4().makeTranslation(-.4 + i * .2, y0 + .11, z)), 0, true); // balustres
    put(b, box(1, .05, .15), MW, base, 0, y0 + .675, z); put(b, box(1, .06, .12), MW, base, 0, y0 + .73, z); put(b, new THREE.CylinderGeometry(.06, .06, 1, 12), MW, base, 0, y0 + .77, z, 0, 0, PI / 2, true); // main courante moulurée
    for (const [ok, x] of [[startPost, -.5 + .07], [endPost, .5 - .07]]) if (ok) { put(b, box(.15, .78, .15), MW, base, x, y0 + .39, z); put(b, box(.19, .05, .19), MG, base, x, y0 + .8, z); put(b, box(.13, .04, .13), MW, base, x, y0 + .845, z);
      b.add(new THREE.LatheGeometry([[0, 0], [.05, 0], [.04, .03], [.06, .08], [.045, .13], [.02, .15], [.025, .17], [0, .19]].map(p => new THREE.Vector2(p[0], p[1])), 12), MW, base.clone().multiply(new THREE.Matrix4().makeTranslation(x, y0 + .865, z)), 0, true); } } // pilastre et vase
  // pilier en pierre de taille : socle, assises alternées, chapiteau de marbre ; il descend sous terre (ou au fond de l'eau)
  const sbox = (b, w, h, d, col, x, y, z) => b.add(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z), 0, false); // bloc de pierre de taille, arêtes vives
  function stonePier(b, x, z, top) { const y0 = -1.4; b.S(G.SK && G.SK.stone);
    for (let y = y0, k = 0; y < top - .2; k++) { const h = Math.min(.36, top - .2 - y), w = k % 2 ? .27 : .25; sbox(b, w, h - .014, w, k % 3 === 0 ? STD : k % 3 === 1 ? ST : STL, x, y + h / 2, z); sbox(b, w - .03, .016, w - .03, 0xa89c88, x, y + h - .007, z); y += h; }
    sbox(b, .36, .2, .36, STD, x, .1, z); sbox(b, .32, .05, .32, ST, x, .225, z); b.S(null);
    b.box(.34, .06, .34, MW, x, top - .17, z); b.box(.3, .08, .3, MG, x, top - .11, z); b.box(.36, .06, .36, MW, x, top - .04, z); }
  // arc de pierre vers un pilier (même courbe que la ferme en fer) : voussoirs et écoinçon plein
  function stoneArch(b, top, dir, k, lat, off) { const [dx, dz] = DIRS[dir], nx = -dz, nz = dx, sp = k + off, s1 = k === 1 ? sp : .5, y1 = top - DK, low = s => y1 - .16 - .55 * Math.pow(Math.max(0, 1 - Math.max(0, sp - s) / 3.2), 2);
    const lines = lat === 3 ? [-LAT, LAT] : lat === 1 ? [LAT] : lat === 2 ? [-LAT] : [0], n = Math.max(4, Math.round((s1 + .5) * 8)); b.S(G.SK && G.SK.stone);
    for (const l of lines) for (let i = 0; i < n; i++) { const sa = -.5 + (s1 + .5) * i / n, sb = -.5 + (s1 + .5) * (i + 1) / n, sm = (sa + sb) / 2, lo = low(sm), h = y1 - lo, w = sb - sa;
      b.add(new THREE.BoxGeometry(.14, h, w), i % 2 ? ST : STL, new THREE.Matrix4().makeRotationY(Math.atan2(dx, dz)).premultiply(new THREE.Matrix4().makeTranslation(dx * sm + nx * l, lo + h / 2, dz * sm + nz * l)), 0, false);
      b.add(new THREE.BoxGeometry(.16, .05, w), STD, new THREE.Matrix4().makeRotationY(Math.atan2(dx, dz)).premultiply(new THREE.Matrix4().makeTranslation(dx * sm + nx * l, lo - .02, dz * sm + nz * l)), 0, false); } // voussoir
    b.S(null); }
  function stoneCorbel(b, base, y0, gap) { b.S(G.SK && G.SK.stone); for (const x of [-.27, .27]) { const z = -.5 - gap + .03;
      put(b, box(.18, .7, .1 + gap), STD, base, x, y0 - .35, z + (.05 - gap / 2) - .02); put(b, box(.18, .14, .45 + gap), ST, base, x, y0 - .07, z + (.45 + gap) / 2 - .02);
      for (let k = 0; k < 4; k++) { const t = k / 4; put(b, box(.17, .12, .1), k % 2 ? ST : STL, base, x, y0 - .55 + t * .4, z + .09 + t * .3); } } b.S(null); }
  function platformMarble(b, v, wg = 0) {
    const susp = v & 32, k = lvlOf(v) + 1, top = k * T, solid = (v >> 11) & 15, sk = G.SK || {};
    b.S(sk.stone); b.box(1, DK, 1, MW, 0, top - DK / 2, 0); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) b.box(.48, .008, .48, (i + j) % 2 ? MW : MG, -.25 + i * .5, top + .004, -.25 + j * .5); // damier
    b.box(1, .06, .06, MV, 0, top - DK - .03, 0); b.box(.06, .06, 1, MV, 0, top - DK - .03, 0);
    for (const [bit, a] of SIDES) { if (v & bit) continue; const base = new THREE.Matrix4().makeRotationY(a), nxt = SIDES[(SIDES.findIndex(s => s[0] === bit) + 1) % 4][0];
      put(b, box(1, .1, .07), MW, base, 0, top - DK - .04, -.5 + .025); put(b, box(1, .05, .05), MG, base, 0, top - DK - .11, -.5 + .035); put(b, box(1, .04, .035), MW, base, 0, top - .02, -.5 - .005); // corniche
      for (let q = 0; q < 4; q++) put(b, box(.07, .12, .1), MV, base, -.375 + q * .25, top - DK - .18, -.5 + .06); // modillons
      marbleRail(b, base, top, true, !!(v & nxt)); }
    SIDES.forEach(([bit, a], i) => { if (solid & (1 << i)) stoneCorbel(b, new THREE.Matrix4().makeRotationY(a), top - DK - .02, ((wg >> (3 * i)) & 7) * WGS); });
    for (const ax of [0, 1]) { const f = (v >> (15 + 8 * ax)) & 255; if (f & 3) stoneArch(b, top, (f & 3) === 1 ? ax : ax + 2, (f >> 2) & 3 || 1, (f >> 4) & 3, OFFS[(f >> 6) & 3]); }
    if (!susp) { const tp = top - DK; if ((v & 16) && (v & 256)) stonePier(b, 0, 0, tp); for (const [b1, b2, cx, cz] of CORN0) if (!(v & b1) && !(v & b2)) stonePier(b, cx, cz, tp); }
    b.S(null); }
  const CORN0 = [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]];
  for (let c = 0; c < 64; c++) MD['pm_' + c] = v => { const b = G.mb(1500 + c * 32 + (v & 31)); platformMarble(b, (v & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2)); return b.done(); };
  const pmKey = (v, o) => pfKey(v, o).replace(/^pf/, 'pm');
  const ogg2 = G.getGeo; G.getGeo = (name, v = 0) => { if (typeof name === 'string' && name.startsWith('pmx_') && !MD[name]) { const [, c, ex, wg] = name.split('_').map(Number);
      MD[name] = vv => { const b = G.mb(1500 + c * 32 + (vv & 31)); platformMarble(b, (vv & 31) | (c & 2 ? 32 : 0) | (c & 1 ? 256 : 0) | G.lvlBits(c >> 2) | ((ex & 15) << 11) | (((ex >> 4) & 0xffff) << 15), wg || 0); return b.done(); }; }
    return ogg2(name, v); };
  // escalier de marbre : marches pleines, balustrade sur la pente ; en hauteur, tout le dessous est en pierre de taille
  function marbleStairs(b, D, J, e) { const n = NST(D), rr = T / n, t = D / n, Y0 = e * T, hr = z => .8 + (D / 2 - z) / D * T, a = Math.atan2(T, D), L = Math.hypot(D, T), sk = G.SK || {};
    for (let i = 0; i < n; i++) { const zf = D / 2 - i * t, zc = zf - t / 2, topY = Y0 + (i + 1) * rr; b.S(sk.stone);
      b.box(.96, .05, t + .02, MW, 0, topY - .025, zc - .01); b.box(.94, rr, .03, MG, 0, topY - rr / 2, zf - .015); // giron et contremarche
      const bot = e ? -1.4 : 0; for (let y = bot, kk = 0; y < topY - .06; kk++) { const h = Math.min(.36, topY - .05 - y); sbox(b, .92, h - .014, t - .004, (kk + i) % 3 === 0 ? STD : (kk + i) % 3 === 1 ? ST : STL, 0, y + h / 2, zc); y += h; } b.S(null); }
    for (const s of [-1, 1]) { if (s < 0 ? J.L : J.R) continue; const x = s * .44;
      lifted(b, Y0, () => { put(b, box(.1, .08, L + .02), MV, null, x, T / 2 + .05, 0, a); // limon
        for (let i = 0; i < n; i++) { const zc = D / 2 - (i + .5) * t, base = (i + 1) * rr; b.add(balGeo.clone(), MW, new THREE.Matrix4().makeTranslation(x, base + .02, zc).multiply(new THREE.Matrix4().makeScale(1, 1.1, 1)), 0, true); }
        put(b, box(.13, .06, L + .05), MW, null, x, (hr(D / 2) + hr(-D / 2)) / 2 - (.8 - .66) , 0, a); put(b, new THREE.CylinderGeometry(.055, .055, L + .05, 10), MW, null, x, (hr(D / 2) + hr(-D / 2)) / 2 - .1, 0, a + PI / 2, 0, 0, true);
        if (!J.F) { b.box(.16, .9, .16, MW, x, .45, D / 2 - .06); b.box(.2, .05, .2, MG, x, .92, D / 2 - .06); b.sph(.07, MW, x, 1.02, D / 2 - .06); }
        if (!J.B) { b.box(.16, .95, .16, MW, x, T + .48, -D / 2 + .06); b.sph(.07, MW, x, T + 1.02, -D / 2 + .06); } }); } }
  MD.esc_marbre = v => { const b = G.mb(1990 + ((v || 0) & 3)); marbleStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32 }, lvlOf(v)); return b.done(); };
  for (let e = 0; e < 16; e++) MD['em_' + e] = v => { const b = G.mb(1990 + e * 4 + (v & 3)); marbleStairs(b, v & 1 ? 2 : 1, { L: v & 4, R: v & 8, F: v & 16, B: v & 32 }, e); return b.done(); };
  const emKey = v => 'em_' + lvlOf(v) + ':' + (v & 61);
  const oko = G.objKey; G.objKey = o => { const d = O[o.t]; return d && d.keyOf ? d.keyOf(o.v != null ? o.v : d.v || 0, o) : oko(o); };
  // ---------- collisions ----------
  const loc = (o, x, z) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r), dx = x - (o.x + w / 2), dz = z - (o.z + dd / 2), r = o.r & 3;
    return [r === 0 ? dx : r === 1 ? -dz : r === 2 ? -dx : dz, r === 0 ? dz : r === 1 ? dx : r === 2 ? -dz : -dx]; };
  const CORN = [[1, 2, .36, -.36], [2, 4, .36, .36], [4, 8, -.36, .36], [8, 1, -.36, -.36]];
  const platH = (o, x, z) => { const v = o.v || 0, lx = x - o.x - .5, lz = z - o.z - .5, f = G._feetY, top = (lvlOf(v) + 1) * T;
    if (f != null && f < o.y + top - 1.4) { // en dessous : seules les colonnes arrêtent
      if (!(v & 32)) { if ((v & 16) && (v & 256) && Math.hypot(lx, lz) < .1) return top; for (const [b1, b2, cx, cz] of CORN) if (!(v & b1) && !(v & b2) && Math.hypot(lx - cx, lz - cz) < .1) return top; }
      return 0; }
    const R = .075; if ((!(v & 1) && lz < -.5 + R) || (!(v & 4) && lz > .5 - R) || (!(v & 2) && lx > .5 - R) || (!(v & 8) && lx < -.5 + R)) return top + 1.0; // balustrade
    return top; };
  const stairH = D => (o, x, z) => { const [lx, lz] = loc(o, x, z), n = NST(D), f = G.clamp((D / 2 - lz) / D, 0, 1), v = o.v != null ? o.v : O[o.t].v, Y0 = lvlOf(v) * T, fy = G._feetY;
    if (Y0 && fy != null && fy < o.y + Y0 + f * T - 1.4) { // sous un escalier en hauteur : seules ses colonnes arrêtent
      for (const s of [-1, 1]) for (const zz of [D / 2 - .12, -D / 2 + .12]) if (Math.hypot(lx - s * .4, lz - zz) < .1) return Y0 + T; return 0; }
    if ((lx < -.43 && !(v & 4)) || (lx > .43 && !(v & 8))) return Y0 + .95 + f * T; // rampe
    return Y0 + (G.clamp(Math.floor((D / 2 - lz) / (D / n)), 0, n - 1) + 1) * T / n; };
  // ---------- hauteur de pose : celle où se tient le joueur ----------
  const placeLvl = (m, tx, tz, min) => { const p = G.player; if (!p || !m.inb(tx, tz)) return min; return G.clamp(Math.round((p.y - m.baseH(tx, tz)) / T), min, 14 + min); }; // jusqu'à 15 étages : une terrasse au bord d'une falaise de niveau 10, au-dessus de l'eau
  // ---------- objets, objets d'inventaire, fabrication ----------
  const add = (id, n, o, sell, fer, desc) => { O[id] = Object.assign({ id, n, v: 0, h: T + 1, walk: 1, take: 1, cat: 'construction' }, o); G.ITEMS[id] = { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 99, desc };
    G.RECIPES.push({ id, need: typeof fer === 'object' ? fer : { fer } }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  const platGhost = susp => (m, ax, az) => (susp ? 32 : 0) | G.lvlBits(placeLvl(m, ax, az, 1) - 1);
  add('plateforme_fer', 'Plateforme en fer forgé', { model: 'plateforme_fer', fp: [1, 1], plat: 1, hAt: platH, ghostV: platGhost(false), keyOf: pfKey }, 500, 4, 'Pose plusieurs cases côte à côte : une grande plateforme avec balustrade, portée par des colonnes en fonte. Elle se pose à ta hauteur : monte dessus pour construire l\'étage suivant.');
  add('plateforme_fer_susp', 'Plateforme suspendue en fer forgé', { model: 'plateforme_fer', v: 32, fp: [1, 1], plat: 1, susp: 1, up: 1, hAt: platH, ghostV: platGhost(true), keyOf: pfKey }, 500, 4, 'La même plateforme sans colonnes. Elle se pose au-dessus de tout : arbres, lampadaires, eau… Contre une falaise ou un mur, des équerres s\'y fixent d\'elles-mêmes ; à 3 cases d\'un pilier, une ferme en fer l\'y relie.');
  add('escalier_fer', 'Escalier en fer forgé (court)', { model: 'esc_fer', fp: [1, 1], stair: 1, hAt: stairH(1), ghostV: (m, ax, az) => G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: efKey }, 700, 6, 'Monte d\'un niveau. Posé depuis une plateforme, il part de son plancher vers l\'étage suivant.');
  add('escalier_fer_long', 'Escalier en fer forgé (long)', { model: 'esc_fer', v: 1, fp: [1, 2], stair: 1, hAt: stairH(2), ghostV: (m, ax, az) => 1 | G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: efKey }, 1000, 10, 'Monte d\'un niveau en pente douce. Posé depuis une plateforme, il part de son plancher vers l\'étage suivant.');
  // marbre : sous l'escalier, c'est de la pierre pleine (on ne passe pas dessous)
  const stairHM = D => (o, x, z) => { const [lx, lz] = loc(o, x, z), n = NST(D), f = G.clamp((D / 2 - lz) / D, 0, 1), v = o.v != null ? o.v : O[o.t].v, Y0 = lvlOf(v) * T;
    if ((lx < -.4 && !(v & 4)) || (lx > .4 && !(v & 8))) return Y0 + .85 + f * T; return Y0 + (G.clamp(Math.floor((D / 2 - lz) / (D / n)), 0, n - 1) + 1) * T / n; };
  add('plateforme_marbre', 'Terrasse en marbre blanc', { model: 'pm_0', fp: [1, 1], plat: 1, waterOK: 1, hAt: platH, ghostV: platGhost(false), keyOf: pmKey }, 900, { pierre: 6 }, 'Marbre blanc à damier et balustres : pose plusieurs cases côte à côte, au bord de l\'eau ou au-dessus. Plus elle est haute, plus elle repose sur des piliers et des arcs en pierre de taille. Monte dessus pour construire l\'étage suivant.');
  add('escalier_marbre', 'Escalier en marbre (court)', { model: 'esc_marbre', fp: [1, 1], stair: 1, waterOK: 1, hAt: stairHM(1), ghostV: (m, ax, az) => G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: emKey }, 1100, { pierre: 8 }, 'Monte d\'un niveau, en marches de marbre sur un massif de pierre de taille, avec sa balustrade.');
  add('escalier_marbre_long', 'Escalier en marbre (long)', { model: 'esc_marbre', v: 1, fp: [1, 2], stair: 1, waterOK: 1, hAt: stairHM(2), ghostV: (m, ax, az) => 1 | G.lvlBits(placeLvl(m, ax, az, 0)), keyOf: emKey }, 1500, { pierre: 12 }, 'Monte d\'un niveau en pente douce, en marbre et pierre de taille.');
  // ---------- raccords : bords des plateformes (voisine au même étage, escalier qui arrive ou qui part, haut de falaise), colonnes ----------
  const NB = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  const platAt = (m, x, z, dk) => { for (const q of [m.upAt && m.upAt(x, z), m.objAt(x, z)]) if (q && O[q.t].plat && Math.abs(G.platDeck(q) - dk) < .01) return q; return null; };
  function relinkPlat(m, o) { const d = O[o.t], dk = G.platDeck(o); let v = ((o.v || 0) & 1728) | (d.susp ? 32 : 0);
    for (const [dx, dz, bit] of NB) { const x = o.x + dx, z = o.z + dz; if (!m.inb(x, z)) continue; if (platAt(m, x, z, dk)) { v |= bit; continue; } const q = m.objAt(x, z), qd = q && O[q.t];
      if (qd && qd.stair) { const F = G.FR[q.r & 3], sb = G.stairBase(q); if ((F[0] === dx && F[1] === dz && Math.abs(sb + T - dk) < .01) || (F[0] === -dx && F[1] === -dz && Math.abs(sb - dk) < .01)) v |= bit; } // un escalier arrive ou part de ce bord
      else if (!m.water[m.idx(x, z)] && m.baseH(x, z) > dk - .3) v |= bit; } // du sol au niveau du plancher ou plus haut (falaise, butte) : pas de balustrade, seulement côté vide
    if (o.x % 5 === 0) v |= 16; if (o.z % 5 === 0) v |= 256;
    let solid = 0, wg = 0; NB.forEach(([dx, dz], i) => { const g = wallAt(m, o.x, o.z, dx, dz, dk); if (g >= 0) { solid |= 1 << i; wg |= Math.min(7, Math.round(g / WGS)) << (3 * i); } }); v |= solid << 11;
    // sans mur à côté ni colonne à elle : dans chaque axe (N–S, E–O), une ferme vers la colonne ou les piliers d'escalier les plus proches, à 3 cases au plus
    // (à égalité : nord, est) ; les cases entre elle et le pilier choisissent le même, la ferme est d'un seul tenant
    if (!solid && (d.susp || !hasCol(v))) for (const [ax, a, c] of [[0, 0, 2], [1, 1, 3]]) { const ra = pillarToward(m, o, dk, NB[a][0], NB[a][1]), rc = pillarToward(m, o, dk, NB[c][0], NB[c][1]);
      const pick = ra && (!rc || ra[0] <= rc[0]) ? [1, ra] : rc ? [2, rc] : null;
      if (pick) { const [sg, [k, oi, lat]] = pick; v |= (sg | k << 2 | lat << 4 | oi << 6) << (15 + 8 * ax); } }
    if (v !== o.v || wg !== (o.wg || 0)) { o.v = v; if (wg) o.wg = wg; else delete o.wg; if (o._k) m.refresh(o); } }
  // le pilier le plus proche dans une direction, en ligne droite le long des plateformes du même étage (3 cases au plus, sans passer sous une case tenue par un mur) :
  // les colonnes d'une plateforme, ou les piliers d'un escalier en fer qui montent au moins jusqu'au plancher → [distance, position le long de la ferme (OFFS), côtés]
  function pillarToward(m, o, dk, dx, dz) { const cx0 = o.x + .5, cz0 = o.z + .5, nx = -dz, nz = dx;
    for (let k = 1; k <= 3; k++) { const x = o.x + dx * k, z = o.z + dz * k, q = platAt(m, x, z, dk), pts = [];
      if (q) { const qv = q.v || 0; if (O[q.t].susp || !hasCol(qv)) { if ((qv >> 11) & 15) return null; continue; }
        if ((qv & 16) && (qv & 256)) pts.push([x + .5, z + .5]);
        for (const [b1, b2, cx, cz] of CORN) if (!(qv & b1) && !(qv & b2)) pts.push([x + .5 + cx, z + .5 + cz]); }
      else { const st = m.inb(x, z) && m.objAt(x, z), sv = st ? (st.v != null ? st.v : O[st.t].v) || 0 : 0;
        if (!ironSt(st) || !(sv & 2) || !lvlOf(sv) || G.stairBase(st) < dk - .3) return null;
        const D = O[st.t].fp[1], [w, dd] = G.fpDims(O[st.t], st.r), r = st.r & 3, lz = D / 2 - .12; // la paire de piliers au pied de la volée
        for (const lx of [-.4, .4]) { const [wx, wz] = r === 0 ? [lx, lz] : r === 1 ? [lz, -lx] : r === 2 ? [-lx, -lz] : [-lz, lx]; pts.push([st.x + w / 2 + wx, st.z + dd / 2 + wz]); } }
      let best = []; for (const [px, pz] of pts) { const s = (px - cx0) * dx + (pz - cz0) * dz, l = (px - cx0) * nx + (pz - cz0) * nz;
        if (Math.abs(l) > .45 || s < k - .55 || s > k + .55) continue; // un pilier dans l'axe de la case, dans la case du pilier
        if (!best.length || s < best[0][0] - .05) best = [[s, l]]; else if (s < best[0][0] + .05) best.push([s, l]); }
      if (!best.length) return null;
      const off = best[0][0] - k; let oi = 0; OFFS.forEach((f, i) => { if (Math.abs(f - off) < Math.abs(OFFS[oi] - off)) oi = i; });
      let lat = 0; for (const [, l] of best) lat |= l > .1 ? 1 : l < -.1 ? 2 : 0;
      return [k, oi, lat]; }
    return null; }
  // les plateformes autour d'une case (deux passes : une case regarde si sa voisine a une colonne, qui dépend de ses propres voisines)
  function relinkNear(m, x0, z0, x1, z1) { const L = []; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { if (!m.inb(x, z)) continue; for (const q of [m.objAt(x, z), m.upAt && m.upAt(x, z)]) if (q && O[q.t].plat && !L.includes(q)) L.push(q); }
    for (let n = 0; n < 2; n++) for (const q of L) relinkPlat(m, q); }
  G.ironRelink = relinkNear; // la carte des hauteurs s'en sert quand le relief change sous les terrasses
  // une case a-t-elle sa propre colonne ? (croisement des multiples de 5, ou coin extérieur)
  const hasCol = v => !!(((v & 16) && (v & 256)) || [[1, 2], [2, 4], [4, 8], [8, 1]].some(([a, c]) => !(v & a) && !(v & c)));
  // un mur juste à côté, sur toute la hauteur de l'équerre : paroi de falaise ou de butte qui monte au moins jusqu'au plancher, mur de maison ou de bâtiment
  // (une falaise plus basse que le plancher, un arbre, un lampadaire, une grille ou une tente ne tiennent rien)
  const wallAt = (m, px, pz, dx, dz, dk) => { const x = px + dx, z = pz + dz; if (!m.inb(x, z)) return -1; const i = m.idx(x, z); if (!m.water[i] && m.baseH(x, z) > dk - .3) return 0;
    const q = m.objAt(x, z), qd = q && O[q.t]; if (!qd || !(qd.enter || qd.fixed) || qd.plat || qd.stair || qd.walk || qd.chop || qd.seeThru || !((qd.h || 0) >= 2.6) || (q.y || 0) + qd.h < dk - .3) return -1;
    return wallGap(q, px, pz, dx, dz, dk); };
  // la façade d'un bâtiment est souvent en retrait du bord de sa case : on la cherche (rayons aux deux montants, en haut et en bas de l'équerre), à 45 cm au plus
  const RC = new THREE.Raycaster(), RM = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })), WGC = new WeakMap();
  function wallGap(q, px, pz, dx, dz, dk) { let c = WGC.get(q); if (!c) WGC.set(q, c = new Map()); const ck = px + ',' + pz + ',' + dx + ',' + dz + ',' + dk; if (c.has(ck)) return c.get(ck);
    let g = 0; try { const key = G.objKey(q), sp = key.lastIndexOf(':'), d = O[q.t], [w, dd] = G.fpDims(d, q.r || 0);
      RM.geometry = G.getGeo(key.slice(0, sp), +key.slice(sp + 1)); RM.position.set(q.x + w / 2, q.y || 0, q.z + dd / 2); RM.rotation.set(0, (q.r || 0) * PI / 2, 0); RM.updateMatrixWorld(true); RC.far = .5;
      const ex = px + .5 + dx * .5, ez = pz + .5 + dz * .5;
      for (const t of [-.27, .27]) for (const y of [dk - .2, dk - .75]) { if (g < 0) continue; RC.set(new V3(ex - dz * t - dx * .05, y, ez + dx * t - dz * .05), new V3(dx, 0, dz)); const h = RC.intersectObject(RM, false)[0]; g = h ? Math.max(g, h.distance - .05) : -1; } }
    catch (e) { g = -1; } RM.geometry = null;
    c.set(ck, g); return g; }
  // escaliers en fer : on compte depuis le bas de la volée, une paire de colonnes tous les 3 escaliers
  const ironSt = q => !!(q && O[q.t] && O[q.t].stair && O[q.t].model === 'esc_fer');
  function stairNext(m, o, sg) { const d = O[o.t], [w, dd] = G.fpDims(d, o.r), Fv = G.FR[o.r & 3], L = d.fp[1], x = Math.floor(o.x + w / 2 + Fv[0] * sg * (L / 2 + .5)), z = Math.floor(o.z + dd / 2 + Fv[1] * sg * (L / 2 + .5)), q = m.objAt(x, z);
    if (!ironSt(q) || q === o || (q.r & 3) !== (o.r & 3)) return null; return Math.abs(G.stairBase(q) - (G.stairBase(o) - sg * T)) < .05 ? q : null; }
  function stairChain(m, o) { if (!ironSt(o)) return; let b = o, n = 0; while (n++ < 64) { const q = stairNext(m, b, 1); if (!q) break; b = q; }
    let i = 0, q = b; while (q && i < 64) { const v0 = q.v != null ? q.v : O[q.t].v, want = i % 3 === 0 ? 2 : 0; if ((v0 & 2) !== want) { q.v = (v0 & ~2) | want; if (q._k) m.refresh(q); relinkNear(m, q.x - 3, q.z - 3, q.x + 4, q.z + 4); } q = stairNext(m, q, -1); i++; } }
  // on pose ou on enlève une plateforme ou un escalier : les escaliers voisins se raccordent, les plateformes alentour revoient balustrades, équerres et fermes
  const touch = (m, o) => { const d = O[o.t], [w, dd] = G.fpDims(d, o.r || 0), R = d.plat ? 6 : 4, near = q => q.x >= o.x - 1 && q.x <= o.x + w && q.z >= o.z - 1 && q.z <= o.z + dd;
    for (let z = o.z - 1; z <= o.z + dd; z++) for (let x = o.x - 1; x <= o.x + w; x++) { if (!m.inb(x, z)) continue; const q = m.objAt(x, z); if (q && q !== o && O[q.t].stair && near(q)) { if (G.stairRelink) G.stairRelink(m, q); stairChain(m, q); } }
    relinkNear(m, o.x - R, o.z - R, o.x + w - 1 + R, o.z + dd - 1 + R); };
  // au chargement d'une carte, les maisons peuvent arriver après les plateformes : on revoit toutes les plateformes une fois tout posé
  const ods = G.GMap.deserialize; G.GMap.deserialize = function (d) { const m = ods.call(this, d), L = []; for (const o of m.list) if (O[o.t] && O[o.t].plat) L.push(o);
    for (let n = 0; n < 2; n++) for (const o of L) relinkPlat(m, o); return m; };
  // pose par le joueur : la plateforme ou l'escalier en fer prend la hauteur où il se tient
  let placing = false; const opl = G.act.placeObj; G.act.placeObj = (it, tx, tz) => { placing = true; try { return opl(it, tx, tz); } finally { placing = false; } };
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  GP.addObj = function (t, tx, tz, r, extra) { const d = O[t], plat = d && d.plat;
    if (placing && this === G.map && d && (plat || t.startsWith('escalier_fer') || t.startsWith('escalier_marbre'))) { const r0 = t === 'plateforme_marbre' ? placeLvl(this, tx, tz, 0) : -1, lv = r0 === 0 ? 0 : plat ? placeLvl(this, tx, tz, 1) - 1 : placeLvl(this, tx, tz, 0); extra = Object.assign({}, extra, { v: ((d.v || 0) & ~1728) | G.lvlBits(lv) }); if (r0 === 0) extra.cy = -T; } // marbre posé depuis le sol : dalle au ras de l'eau et de la berge
    const o = oadd.call(this, t, tx, tz, plat ? 0 : r, extra);
    if (o && (plat || d.stair)) { if (plat) relinkPlat(this, o); else if (G.stairRelink) G.stairRelink(this, o); touch(this, o); if (d.stair) stairChain(this, o); } return o; };
  GP.removeObj = function (o) { const d = o && O[o.t], hit = d && (d.plat || d.stair); const res = orem.call(this, o); if (hit) touch(this, o); return res; };
  // arbres et buissons sur une terrasse en marbre (jardin suspendu)
  const odk = G.deckOK; G.deckOK = d => { if (odk(d)) return true; if (!d || !(d.chop || d.grow) || d.enter || d.fixed || d.onWater) return false; const p = G.player, m = G.map; if (!p || !m || !m.upAt) return false; const [tx, tz] = p.target();
    return [m.upAt(tx, tz), m.objAt(tx, tz)].some(q => q && q.t === 'plateforme_marbre' && Math.abs(G.platDeck(q) - p.y) < .6); };
  const otake = G.act.take; G.act.take = () => { const p = G.player, m = G.map; if (p && m && m.upAt && !p.act && !p.sit && !p.dead) { const [tx, tz] = p.target(), u = m.upAt(tx, tz), g = m.objAt(tx, tz);
      if (u && !(g && g.dk != null) && (!g || p.y > G.platDeck(u) - .6)) { const [cx, cz] = m.center(u); if (G.mode === 'survie' && G.inv.add(u.t, 1) > 0) { G.ui.toast('Inventaire plein !'); return; } m.removeObj(u); G.sfx('pickup'); G.fx.puff(cx, G.platDeck(u), cz, 10, 0xffffff, .7); return; } } return otake(); };
})();
