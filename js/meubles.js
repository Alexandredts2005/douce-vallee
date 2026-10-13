'use strict';
// ===== Tables, chaises, fauteuils, bancs et canapés en dizaines de variantes, qui FUSIONNENT avec F :
// pose deux tables côte à côte (ou vingt, ou un rectangle de 10 × 4…), mets-toi devant et appuie sur F → une seule table immense,
// pieds aux coins (et régulièrement le long des grands côtés), plateau continu. Pareil pour les chaises (→ banquette),
// les bancs et les canapés (→ aussi longs qu'on veut). F à nouveau : on les sépare.
// + Lustres accrochés AU PLAFOND (au-dessus d'une table, par exemple), qui éclairent vraiment la pièce. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, PI = Math.PI;
  const rb = (...a) => G.rbox(...a), dark = (c, k = .75) => new THREE.Color(c).multiplyScalar(k).getHex(), light = (c, k = .25) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex();
  const SK = () => G.SK || {};
  const GOLD = 0xd9b04a, IRON = 0x2c3036, CHROME = 0xc9ccd2, WHITE = 0xf4f1ea;
  // ===================== TABLES (1 × 1, fusion dans les 4 directions) =====================
  // v : bits 1 nord (−z), 2 est (+x), 4 sud (+z), 8 ouest (−x) = côtés liés ; 16 = pied au milieu des grands côtés
  const TS = {
    classique: { n: 'Table en bois', top: 0xe2bf8f, frame: 0xc99a68, leg: 0x8a5a36, h: .78, t: .055, legR: .035, turned: 1, vase: 1 },
    ferme: { n: 'Table de ferme en chêne', top: 0xb98a5a, frame: 0x8f6338, leg: 0x7a5232, h: .78, t: .075, legR: .05, square: 1 },
    noyer: { n: 'Table en noyer', top: 0x6e4529, frame: 0x5a361f, leg: 0x5a361f, h: .78, t: .045, legR: .03, taper: 1, sabot: GOLD },
    marbre: { n: 'Table en marbre (bistrot)', top: 0xf2efe9, frame: IRON, leg: IRON, h: .76, t: .04, legR: .022, round: 1, marble: 1 },
    verre: { n: 'Table en verre', top: 0xd8eef6, frame: CHROME, leg: CHROME, h: .76, t: .022, legR: .018, glass: 1 },
    blanche: { n: 'Table blanche de campagne', top: 0xf4f1ea, frame: 0xe8e2d6, leg: 0xf4f1ea, h: .78, t: .05, legR: .034, turned: 1 },
    nappe: { n: 'Table avec nappe', top: 0xfbfaf6, frame: 0xc99a68, leg: 0x8a5a36, h: .78, t: .05, legR: .034, cloth: 0xfbfaf6, hem: 0xe8434a },
    jardin: { n: 'Table de jardin en fer forgé', top: 0x2f5a46, frame: 0x2f5a46, leg: 0x2f5a46, h: .74, t: .02, legR: .016, lattice: 1, round: 1 },
    rondins: { n: 'Table en rondins', top: 0xa8774a, frame: 0x7a5232, leg: 0x7a5232, h: .76, t: .09, legR: .07, logs: 1 },
    banquet: { n: 'Table de banquet royale', top: 0x4a2a1a, frame: 0x3a2014, leg: 0x3a2014, h: .8, t: .06, legR: .045, turned: 1, runner: 0xb22a35, sabot: GOLD, candles: 1 },
    basse: { n: 'Table basse japonaise', top: 0x3a2618, frame: 0x2a1a10, leg: 0x2a1a10, h: .36, t: .06, legR: .045, square: 1 }
  };
  function tableModel(k, v) {
    const s = TS[k], b = G.mb(700 + Object.keys(TS).indexOf(k)), N = v & 1, E = v & 2, Sd = v & 4, W = v & 8, mid = v & 16, sk = SK();
    if (s.round && !(v & 15)) { // table ronde sur pied central (bistrot, jardin)
      const y = s.h; if (s.marble) { b.S(sk.ceramic); b.cyl(.4, .4, s.t, 36, s.top, 0, y - s.t / 2, 0, 0, 0, 0, 0, true); b.S(sk.gold); b.tor(.4, .008, GOLD, 0, y - s.t / 2, 0, PI / 2, 0, 0, 0, 36); }
      else { b.S(sk.iron); b.tor(.4, .015, s.top, 0, y - .01, 0, PI / 2, 0, 0, 0, 30); for (let i = 0; i < 8; i++) b.box(.8, .008, .014, s.top, 0, y - .01, 0, 0, i / 8 * PI, 0); b.tor(.2, .01, s.top, 0, y - .01, 0, PI / 2, 0, 0, 0, 24); }
      b.S(sk.iron); b.cyl(.03, .04, y - .05, 12, s.leg, 0, (y - .05) / 2 + .02, 0); b.cyl(.06, .03, .1, 12, s.leg, 0, y - .1, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.box(.36, .025, .04, s.leg, Math.cos(a) * .16, .03, Math.sin(a) * .16, 0, -a, 0); b.sph(.022, s.leg, Math.cos(a) * .32, .02, Math.sin(a) * .32); }
      b.S(null); return b.done();
    }
    const ins = .04, x0 = W ? -.5 : -.5 + ins, x1 = E ? .5 : .5 - ins, z0 = N ? -.5 : -.5 + ins, z1 = Sd ? .5 : .5 - ins, y = s.h, ty = y - s.t / 2;
    // plateau (arêtes vives du côté des liens pour un raccord invisible, arrondies dehors)
    b.S(s.glass ? sk.glass : s.marble ? sk.ceramic : s.top === WHITE || s.top === 0xfbfaf6 ? sk.paint : sk.wood);
    if (s.logs) { const n = 4; for (let i = 0; i < n; i++) { const zz = z0 + (z1 - z0) * (i + .5) / n; b.add(new THREE.CylinderGeometry((z1 - z0) / n / 2, (z1 - z0) / n / 2, x1 - x0, 12, 1, false, 0, PI), i % 2 ? s.top : dark(s.top, .92), b.M((x0 + x1) / 2, y - .045, zz, 0, 0, PI / 2), 0, true); } }
    else b.add(new THREE.BoxGeometry(x1 - x0, s.t, z1 - z0), s.top, b.M((x0 + x1) / 2, ty, (z0 + z1) / 2), s.glass ? 2 : 0);
    const r = s.t / 2; b.S(s.glass ? sk.steel : s.marble ? sk.ceramic : sk.wood);
    if (!N) b.cyl(r, r, x1 - x0, 10, s.glass ? CHROME : s.top, (x0 + x1) / 2, ty, z0, 0, 0, PI / 2, 0, true);
    if (!Sd) b.cyl(r, r, x1 - x0, 10, s.glass ? CHROME : s.top, (x0 + x1) / 2, ty, z1, 0, 0, PI / 2, 0, true);
    if (!W) b.cyl(r, r, z1 - z0, 10, s.glass ? CHROME : s.top, x0, ty, (z0 + z1) / 2, PI / 2, 0, 0, 0, true);
    if (!E) b.cyl(r, r, z1 - z0, 10, s.glass ? CHROME : s.top, x1, ty, (z0 + z1) / 2, PI / 2, 0, 0, 0, true);
    for (const [cx, cz, a, c] of [[x0, z0, !W, !N], [x1, z0, !E, !N], [x0, z1, !W, !Sd], [x1, z1, !E, !Sd]]) if (a && c) b.sph(r, s.glass ? CHROME : s.top, cx, ty, cz, 1, 1, 1, 0, 10, 8);
    // ceinture sous le plateau, le long des côtés libres
    const ay = y - s.t - .05, ai = ins + .05, ax0 = W ? -.5 : -.5 + ai, ax1 = E ? .5 : .5 - ai, az0 = N ? -.5 : -.5 + ai, az1 = Sd ? .5 : .5 - ai;
    b.S(s.glass ? sk.steel : s.leg === IRON ? sk.iron : sk.wood);
    if (!s.glass && !s.lattice) { if (!N) b.box(ax1 - ax0, .08, .025, s.frame, (ax0 + ax1) / 2, ay, az0); if (!Sd) b.box(ax1 - ax0, .08, .025, s.frame, (ax0 + ax1) / 2, ay, az1); if (!W) b.box(.025, .08, az1 - az0, s.frame, ax0, ay, (az0 + az1) / 2); if (!E) b.box(.025, .08, az1 - az0, s.frame, ax1, ay, (az0 + az1) / 2); }
    else { if (!N) b.box(ax1 - ax0, .015, .015, s.frame, (ax0 + ax1) / 2, y - s.t - .01, az0); if (!Sd) b.box(ax1 - ax0, .015, .015, s.frame, (ax0 + ax1) / 2, y - s.t - .01, az1); if (!W) b.box(.015, .015, az1 - az0, s.frame, ax0, y - s.t - .01, (az0 + az1) / 2); if (!E) b.box(.015, .015, az1 - az0, s.frame, ax1, y - s.t - .01, (az0 + az1) / 2); }
    // pieds : aux coins libres, et au milieu des côtés libres (grandes tables)
    const leg = (x, z) => { const h = y - s.t - .01; if (s.square) { b.box(s.legR * 2, h, s.legR * 2, s.leg, x, h / 2, z); }
      else if (s.turned) { b.cyl(s.legR * .75, s.legR * .9, h * .55, 12, s.leg, x, h * .3, z); b.sph(s.legR * 1.25, s.leg, x, h * .6, z, 1, .8, 1); b.cyl(s.legR * .9, s.legR * 1.1, h * .38, 12, s.leg, x, h * .8, z); b.sph(s.legR * 1.1, s.leg, x, .03, z, 1, .6, 1); }
      else if (s.logs) b.cyl(s.legR, s.legR * 1.1, h, 10, s.leg, x, h / 2, z);
      else b.cyl(s.legR * (s.taper ? 1.1 : 1), s.legR * (s.taper ? .55 : 1), h, 12, s.leg, x, h / 2, z);
      if (s.sabot) { b.S(sk.gold); b.cyl(s.legR * .7, s.legR * .6, .05, 10, s.sabot, x, .025, z); b.S(s.leg === IRON ? sk.iron : sk.wood); } };
    const li = s.legR + .07;
    if (!W && !N) leg(-.5 + li, -.5 + li); if (!E && !N) leg(.5 - li, -.5 + li); if (!W && !Sd) leg(-.5 + li, .5 - li); if (!E && !Sd) leg(.5 - li, .5 - li);
    const nFree = (!N) + (!Sd) + (!W) + (!E);
    if (mid && nFree === 1) { if (!N) leg(0, -.5 + li); if (!Sd) leg(0, .5 - li); if (!W) leg(-.5 + li, 0); if (!E) leg(.5 - li, 0); }
    // nappe qui tombe sur les côtés libres, chemin de table, bougeoirs, petit bouquet
    if (s.cloth) { b.S(sk.fabric); const cy = y + .004, hy = y - .26; b.add(new THREE.BoxGeometry(1.0 - (W ? 0 : .0) , .008, 1.0), s.cloth, b.M(0, cy, 0));
      const drape = (x, z, w, rot) => { b.box(w, y - hy, .012, s.cloth, x, (y + hy) / 2, z, 0, rot, 0); for (let i = 0; i < Math.round(w / .1); i++) b.sph(.022, s.hem, x + Math.cos(rot) * (-w / 2 + (i + .5) * w / Math.round(w / .1)), hy, z - Math.sin(rot) * (-w / 2 + (i + .5) * w / Math.round(w / .1)), 1, .5, .5); };
      if (!N) drape(0, -.506, 1.0, 0); if (!Sd) drape(0, .506, 1.0, 0); if (!W) drape(-.506, 0, 1.0, PI / 2); if (!E) drape(.506, 0, 1.0, PI / 2); }
    const colZ = !E && !W && (N || Sd); if (s.runner && (colZ || (N && Sd) || (!N && !Sd))) { b.S(sk.velvet); const alongX = !colZ; if (alongX) b.box(1.0, .006, .3, s.runner, 0, y + .003, 0); else b.box(.3, .006, 1.0, s.runner, 0, y + .003, 0); b.S(sk.gold); if (alongX) for (const z of [-.15, .15]) b.box(1.0, .007, .02, GOLD, 0, y + .004, z); else for (const x of [-.15, .15]) b.box(.02, .007, 1.0, GOLD, x, y + .004, 0); }
    if (s.candles && (mid || !(v & 15))) { b.S(sk.gold); b.cyl(.05, .07, .03, 12, GOLD, 0, y + .015, 0); b.cyl(.012, .018, .26, 8, GOLD, 0, y + .15, 0); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.box(.12, .01, .012, GOLD, Math.cos(a) * .06, y + .28, Math.sin(a) * .06, 0, -a, 0); b.cyl(.016, .016, .02, 8, GOLD, Math.cos(a) * .12, y + .29, Math.sin(a) * .12); b.S(sk.ceramic); b.cyl(.011, .011, .1, 8, 0xfff8ec, Math.cos(a) * .12, y + .35, Math.sin(a) * .12); b.S(null); b.cone(.01, .035, 8, 0xffd27a, Math.cos(a) * .12, y + .42, Math.sin(a) * .12, 0, 0, 0, 3); b.S(sk.gold); } }
    if (s.vase && !(v & 15)) { b.S(sk.ceramic); b.cyl(.045, .06, .14, 12, 0x6c9ad6, 0, y + .07, 0); b.S(sk.petal); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.sph(.042, [0xff8fc0, 0xffd23f, 0xffffff][i % 3], Math.cos(a) * .05, y + .18 + (i % 2) * .03, Math.sin(a) * .05); } }
    b.S(null); return b.done();
  }
  // ===================== CHAISES & FAUTEUILS (1 × 1, fusion à gauche/droite → banquette) =====================
  // v : bit 1 = lié à gauche (x local −), 2 = lié à droite (x local +)
  const CS = {
    classique: { n: 'Chaise', wood: 0x8a5a36, seat: 0xc99a68, cush: 0xd77a61, h: .46, back: 'barreaux' },
    paillee: { n: 'Chaise paillée', wood: 0x9a6a40, seat: 0xd8b878, h: .45, back: 'echelle', straw: 1 },
    louis: { n: 'Chaise Louis XV', wood: 0xe8d9b8, gilt: GOLD, seat: 0x6b8fb8, cush: 0x6b8fb8, h: .47, back: 'medaillon', velvet: 1 },
    bistrot: { n: 'Chaise de bistrot', wood: 0x3a2416, seat: 0x3a2416, h: .46, back: 'courbe', thin: 1 },
    jardin: { n: 'Chaise de jardin', wood: 0x2f5a46, seat: 0x2f5a46, h: .45, back: 'grille', iron: 1, thin: 1 },
    scandi: { n: 'Chaise scandinave', wood: 0xd9b48a, seat: 0xf4f1ea, h: .46, back: 'coque', shell: 1 },
    velours: { n: 'Chaise en velours', wood: 0x2a1a10, seat: 0x2f6b5a, cush: 0x2f6b5a, h: .48, back: 'haut', velvet: 1 },
    club: { n: 'Fauteuil club en cuir', wood: 0x3a2416, seat: 0x7a3f22, cush: 0x7a3f22, h: .42, back: 'club', arms: 1, leather: 1 },
    rotin: { n: 'Fauteuil en rotin', wood: 0xc8a067, seat: 0xc8a067, cush: 0xf3ead2, h: .42, back: 'rotin', arms: 1 },
    bergere: { n: 'Bergère fleurie', wood: 0xc99a68, seat: 0xf3d6dc, cush: 0xf3d6dc, h: .44, back: 'bergere', arms: 1, velvet: 1 }
  };
  function chairModel(k, v) {
    const s = CS[k], b = G.mb(760 + Object.keys(CS).indexOf(k)), L = v & 1, R = v & 2, sk = SK(), y = s.h, arm = s.arms;
    const hw = arm ? .34 : .25, x0 = L ? -.5 : -hw, x1 = R ? .5 : hw, d = arm ? .32 : .24, zb = -d + .02;
    const woodSk = s.iron ? sk.iron : s.wood === 0xe8d9b8 ? sk.paint : sk.wood, seatSk = s.velvet ? sk.velvet : s.leather ? sk.plastic : s.straw ? sk.fabric : woodSk;
    // assise
    b.S(seatSk); if (s.shell) { b.S(sk.plastic); b.add(new THREE.BoxGeometry(x1 - x0, .03, d * 2 - .04), s.seat, b.M((x0 + x1) / 2, y, 0)); }
    else if (arm) { b.add(new THREE.BoxGeometry(x1 - x0, .14, d * 2), s.seat, b.M((x0 + x1) / 2, y - .02, 0)); b.S(s.velvet ? sk.velvet : sk.fabric); b.add(new THREE.BoxGeometry(x1 - x0 - (L ? 0 : .06) - (R ? 0 : .06), .08, d * 2 - .08), s.cush, b.M((x0 + x1) / 2 + (L ? .03 : 0) - (R ? .03 : 0), y + .08, .03)); }
    else { b.add(new THREE.BoxGeometry(x1 - x0, .045, d * 2), s.seat, b.M((x0 + x1) / 2, y, 0)); if (s.cush) { b.S(s.velvet ? sk.velvet : sk.fabric); b.add(new THREE.BoxGeometry(x1 - x0 - (L ? 0 : .04) - (R ? 0 : .04), .04, d * 2 - .05), s.cush, b.M((x0 + x1) / 2, y + .04, .01)); } }
    if (s.straw) for (let i = 0; i < 6; i++) b.box(x1 - x0, .006, .02, dark(s.seat, .85), (x0 + x1) / 2, y + .025, -d + .05 + i * (d * 2 - .1) / 5);
    // pieds (aux extrémités libres, et au milieu quand la banquette est longue)
    b.S(woodSk); const lr = s.thin ? .014 : .022, legs = []; if (!L) legs.push(x0 + .05); if (!R) legs.push(x1 - .05); if (L && R) legs.push(0);
    for (const x of legs) for (const z of [-d + .05, d - .05]) { if (s.shell) b.cyl(.014, .011, y, 8, s.wood, x * (1 - (z > 0 ? .05 : 0)), y / 2, z * 1.05, z > 0 ? .1 : -.1, 0, 0); else if (arm && s.leather) b.cyl(.025, .02, .08, 10, s.wood, x, .04, z); else b.cyl(lr, lr * .8, y - .02, 10, s.wood, x, (y - .02) / 2, z); }
    if (s.gilt) { b.S(sk.gold); for (const x of legs) for (const z of [-d + .05, d - .05]) b.cyl(lr * .9, lr * .7, .03, 8, GOLD, x, .015, z); b.S(woodSk); }
    // dossier continu
    const by = y + .05, bh = s.back === 'haut' ? .66 : s.back === 'club' || s.back === 'rotin' || s.back === 'bergere' ? .42 : .52, bx0 = L ? -.5 : x0 + (arm ? .04 : .0), bx1 = R ? .5 : x1 - (arm ? .04 : 0);
    if (s.back === 'barreaux' || s.back === 'echelle') { for (const x of [x0 + .03, x1 - .03]) if ((x < 0 && !L) || (x > 0 && !R)) b.cyl(.018, .018, bh, 10, s.wood, x, by + bh / 2, zb); if (L && R) b.cyl(.018, .018, bh, 10, s.wood, 0, by + bh / 2, zb);
      const n = s.back === 'echelle' ? 3 : 2; for (let i = 0; i < n; i++) b.box(bx1 - bx0, .045, .02, s.back === 'echelle' ? s.wood : s.seat, (bx0 + bx1) / 2, by + .16 + i * (bh - .2) / (n - 1 || 1), zb); b.box(bx1 - bx0, .07, .035, s.wood, (bx0 + bx1) / 2, by + bh, zb); }
    else if (s.back === 'courbe') { b.add(new THREE.BoxGeometry(bx1 - bx0, .05, .02), s.wood, b.M((bx0 + bx1) / 2, by + bh, zb)); for (const x of [x0 + .02, x1 - .02]) if ((x < 0 && !L) || (x > 0 && !R)) { b.cyl(.012, .012, bh, 8, s.wood, x, by + bh / 2, zb); b.tor(.08, .008, s.wood, x * .5, by + .25, zb, 0, 0, 0, 0, 14); } }
    else if (s.back === 'grille') { b.box(bx1 - bx0, .02, .02, s.wood, (bx0 + bx1) / 2, by + bh, zb); b.box(bx1 - bx0, .02, .02, s.wood, (bx0 + bx1) / 2, by + .05, zb); for (let i = 0; i <= Math.round((bx1 - bx0) / .07); i++) b.box(.01, bh, .01, s.wood, bx0 + i * .07, by + bh / 2, zb); for (const x of [x0 + .02, x1 - .02]) if ((x < 0 && !L) || (x > 0 && !R)) b.cyl(.014, .014, bh + .4, 8, s.wood, x, (by + bh) / 2, zb); }
    else if (s.back === 'coque') { b.S(sk.plastic); const n = 7, w = bx1 - bx0; for (let i = 0; i < n; i++) { const t = (i + .5) / n - .5, a = t * (L || R ? 0 : 1.6); b.box(w / n + .004, bh * .62, .03, s.seat, bx0 + (i + .5) * w / n, by + bh * .42, zb + .05 - Math.cos(a) * .06 + (L || R ? -.01 : 0), -.1, a * .6, 0); } }
    else if (s.back === 'medaillon') { b.S(sk.velvet); const cx = (bx0 + bx1) / 2, w = bx1 - bx0; if (L || R) b.box(w, bh * .8, .04, s.cush, cx, by + bh * .5, zb); else b.sph(.19, s.cush, cx, by + bh * .55, zb, 1, 1.3, .18); b.S(sk.gold); if (!L && !R) b.tor(.19, .014, s.gilt, cx, by + bh * .55, zb, 0, 0, 0, 0, 24); else { b.box(w, .02, .045, s.gilt, cx, by + bh * .92, zb); b.box(w, .02, .045, s.gilt, cx, by + bh * .1, zb); } for (const x of [x0 + .02, x1 - .02]) if ((x < 0 && !L) || (x > 0 && !R)) b.cyl(.014, .014, bh, 8, s.gilt, x, by + bh / 2, zb); b.S(woodSk); }
    else { // dossiers rembourrés : haut, club, rotin, bergère
      b.S(s.velvet ? sk.velvet : s.leather ? sk.plastic : sk.fabric); b.add(new THREE.BoxGeometry(bx1 - bx0, bh, .1), s.seat, b.M((bx0 + bx1) / 2, by + bh / 2, zb + .02, -.08, 0, 0));
      if (s.back === 'club' || s.back === 'haut') for (let i = 0; i < Math.round((bx1 - bx0) / .12); i++) for (let j = 0; j < 2; j++) b.sph(.012, dark(s.seat, .7), bx0 + .06 + i * .12 + j * .06, by + bh * (.35 + j * .3), zb + .075, 1, 1, .5, 0, 6, 4);
      if (s.back === 'rotin') { b.S(sk.wood); for (let i = 0; i <= 8; i++) b.box(.008, bh, .104, dark(s.seat, .85), bx0 + i * (bx1 - bx0) / 8, by + bh / 2, zb + .02, -.08, 0, 0); }
      if (s.cush && arm) { b.S(sk.fabric); b.add(new THREE.BoxGeometry(bx1 - bx0 - .04, bh * .75, .07), s.cush, b.M((bx0 + bx1) / 2, by + bh * .45, zb + .09, -.12, 0, 0)); } }
    // accoudoirs aux extrémités libres
    if (arm) { b.S(s.leather ? sk.plastic : s.velvet ? sk.velvet : sk.fabric); for (const [x, ok] of [[x0 + .045, !L], [x1 - .045, !R]]) if (ok) { b.box(.09, .24, d * 2, s.seat, x, y + .1, 0); b.cyl(.06, .06, d * 2, 14, s.seat, x, y + .24, 0, PI / 2, 0, 0, 0, true); } }
    b.S(null); return b.done();
  }
  // ===================== BANCS, CANAPÉS, TABLE DE PIQUE-NIQUE (2 × 1, fusion bout à bout) =====================
  const BS = {
    bois: { n: 'Banc en bois', slat: 0xb07a48, frame: 0x85552f, kind: 'parc' },
    parc: { n: 'Banc de parc', slat: 0x4f8a4f, frame: 0x2c2f33, kind: 'parc', iron: 1 },
    fer: { n: 'Banc en fer forgé', slat: 0x8a5a36, frame: 0x1f2226, kind: 'parc', iron: 1, ornate: 1 },
    pierre: { n: 'Banc en pierre', slat: 0xcfc8b8, frame: 0xb9b2a2, kind: 'pierre' },
    blanc: { n: 'Banc de jardin blanc', slat: 0xf4f1ea, frame: 0xf4f1ea, kind: 'lutyens' },
    rondin: { n: 'Banc en rondin', slat: 0xa8774a, frame: 0x7a5232, kind: 'rondin' },
    moderne: { n: 'Banc design', slat: 0xc89a68, frame: 0x9a9690, kind: 'moderne' },
    coussins: { n: 'Banquette à coussins', slat: 0xf3ead2, frame: 0x8a5a36, kind: 'banquette', cush: 0x5b7fb5 },
    bambou: { n: 'Banc en bambou', slat: 0xc8ce8e, frame: 0xa9b45a, kind: 'parc', bamboo: 1 },
    canape: { n: 'Canapé', slat: 0x7fa58a, frame: 0x5e3b22, kind: 'canape' },
    chesterfield: { n: 'Canapé Chesterfield', slat: 0x6e3a22, frame: 0x3a2416, kind: 'canape', leather: 1 },
    velours: { n: 'Canapé en velours', slat: 0x3d5a8a, frame: 0x2a1a10, kind: 'canape', velvet: 1 },
    lin: { n: 'Canapé en lin', slat: 0xe8e0d0, frame: 0xb08a5a, kind: 'canape' },
    pique: { n: 'Table de pique-nique', slat: 0xd4a46c, frame: 0x85552f, kind: 'pique' }
  };
  function benchModel(k, v) {
    const s = BS[k], b = G.mb(800 + Object.keys(BS).indexOf(k)), L = v & 1, R = v & 2, sk = SK(), x0 = L ? -1 : -.9, x1 = R ? 1 : .9, w = x1 - x0, cx = (x0 + x1) / 2;
    const fsk = s.iron ? sk.iron : s.kind === 'pierre' || s.kind === 'moderne' ? sk.stone : sk.wood;
    const ends = []; if (!L) ends.push([-.82, -1]); if (!R) ends.push([.82, 1]);
    if (s.kind === 'parc' || s.kind === 'lutyens') {
      b.S(s.kind === 'lutyens' ? sk.paint : sk.wood); for (let i = 0; i < 4; i++) b.add(new THREE.BoxGeometry(w, .035, .1), s.slat, b.M(cx, .45, -.18 + i * .12));
      for (let i = 0; i < 3; i++) b.add(new THREE.BoxGeometry(w, .09, .03), s.slat, b.M(cx, .62 + i * .13, -.29 - i * .03, -.18, 0, 0));
      if (s.kind === 'lutyens') { b.add(new THREE.BoxGeometry(w, .05, .05), s.slat, b.M(cx, 1.0, -.37)); for (let i = 0; i <= Math.round(w / .08); i++) b.box(.02, .38, .02, s.slat, x0 + i * w / Math.round(w / .08), .78, -.33, -.18, 0, 0); }
      if (s.bamboo) { b.S(sk.wood); for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(.022, .022, w, 8), i % 2 ? s.slat : dark(s.slat, .9), b.M(cx, .45, -.2 + i * .07, 0, 0, PI / 2), 0, true); }
      b.S(fsk); for (const [x, sg] of ends) { b.box(.06, .45, .06, s.frame, x, .22, .17); b.box(.06, .95, .06, s.frame, x, .47, -.3, -.12, 0, 0); b.box(.06, .05, .5, s.frame, x, .62, -.04); b.box(.06, .05, .45, s.frame, x, .42, -.06);
        if (s.ornate) { b.tor(.1, .012, s.frame, x, .26, -.05, 0, PI / 2, 0, 0, 14); b.tor(.06, .01, s.frame, x, .75, -.33, 0, PI / 2, 0, 0, 12); } }
      b.box(.05, .42, .05, s.frame, 0, .22, -.05); }
    else if (s.kind === 'pierre') { b.P(G.PAT ? G.PAT.pierre : 0); b.add(new THREE.BoxGeometry(w + (L ? 0 : .08) + (R ? 0 : .08), .1, .5), s.slat, b.M(cx, .42, 0)); for (const [x] of ends) b.box(.18, .37, .42, s.frame, x * .95, .185, 0); if (L && R) b.box(.18, .37, .42, s.frame, 0, .185, 0); b.P(0); }
    else if (s.kind === 'rondin') { b.S(sk.wood); b.add(new THREE.CylinderGeometry(.22, .22, w, 14, 1, false, 0, PI), s.slat, b.M(cx, .3, 0, 0, 0, -PI / 2), 0, true); b.add(new THREE.BoxGeometry(w, .01, .43), light(s.slat, .2), b.M(cx, .301, 0)); b.S(sk.bark); for (const [x] of ends) { b.cyl(.13, .14, .3, 12, s.frame, x, .15, -.1); b.cyl(.13, .14, .3, 12, s.frame, x, .15, .12); } }
    else if (s.kind === 'moderne') { b.S(sk.stone); for (const [x] of ends) b.box(.12, .42, .46, s.frame, x * .98, .21, 0); if (L && R) b.box(.12, .42, .46, s.frame, 0, .21, 0); b.S(sk.wood); for (let i = 0; i < 7; i++) b.add(new THREE.BoxGeometry(w, .04, .055), s.slat, b.M(cx, .44, -.2 + i * .067)); }
    else if (s.kind === 'banquette') { b.S(sk.wood); b.add(new THREE.BoxGeometry(w, .36, .55), s.frame, b.M(cx, .18, 0)); b.S(sk.fabric); b.add(new THREE.BoxGeometry(w, .1, .5), s.slat, b.M(cx, .41, .01)); const n = Math.max(1, Math.round(w / .5)); for (let i = 0; i < n; i++) b.sph(.13, i % 2 ? s.cush : 0xf2c46b, x0 + (i + .5) * w / n, .58, -.18, 1.2, 1, .45); }
    else if (s.kind === 'canape') { const sSk = s.velvet ? sk.velvet : s.leather ? sk.plastic : sk.fabric, c = s.slat, l = light(c, .12);
      b.S(sSk); b.add(new THREE.BoxGeometry(w, .26, .8), c, b.M(cx, .23, 0)); b.add(new THREE.BoxGeometry(w, .62, .2), c, b.M(cx, .55, -.32));
      const n = Math.max(1, Math.round((w - (L ? 0 : .2) - (R ? 0 : .2)) / .8)), ix0 = L ? -1 : -.78, ix1 = R ? 1 : .78;
      for (let i = 0; i < n; i++) { const cw = (ix1 - ix0) / n, x = ix0 + (i + .5) * cw; b.box(cw - .02, .14, .62, l, x, .43, .07); b.box(cw - .04, .4, .15, l, x, .7, -.22, -.18, 0, 0); }
      if (s.leather) for (let i = 0; i < Math.round(w / .1); i++) for (let j = 0; j < 2; j++) b.sph(.011, dark(c, .65), x0 + .05 + i * .1 + j * .05, .62 + j * .12, -.215, 1, 1, .5, 0, 6, 4);
      for (const [x, sg] of ends) { b.box(.18, .44, .8, c, x * 1.05, .38, 0); b.cyl(.1, .1, .8, 16, c, x * 1.05, .62, 0, PI / 2, 0, 0, 0, true); }
      b.S(sk.wood); for (const [x] of ends) for (const z of [-.3, .3]) b.cyl(.03, .022, .1, 8, s.frame, x * .95, .05, z); }
    else if (s.kind === 'pique') { b.S(sk.wood); b.add(new THREE.BoxGeometry(w, .07, .64), s.slat, b.M(cx, .72, 0)); for (const z of [-.52, .52]) b.add(new THREE.BoxGeometry(w, .06, .22), s.slat, b.M(cx, .42, z));
      for (const [x] of ends) { b.box(.08, .78, .08, s.frame, x * .85, .38, -.3, -.5); b.box(.08, .78, .08, s.frame, x * .85, .38, .3, .5); b.box(.08, .06, 1.3, s.frame, x * .85, .36, 0); } }
    b.S(null); return b.done();
  }
  // ---------- enregistrement des modèles et des objets ----------
  const FAM = {}; // type → { kind: 'table' | 'seat', len }
  const item = (id, n, cat, sell, extra) => { G.ITEMS[id] = Object.assign({ id, n, stack: 99, sell, kind: 'place', obj: id, cat, thumb: 'obj:' + id }, extra || {}); };
  for (const k in TS) { MD['tbl_' + k] = v => tableModel(k, v); const id = k === 'classique' ? 'table' : 'table_' + k, ex = O[id];
    O[id] = Object.assign({}, ex || {}, { id, n: TS[k].n, model: 'tbl_' + k, v: 0, fp: [1, 1], h: TS[k].h, walk: 1, take: 1, cat: 'assises', merge: 'table' }); FAM[id] = { kind: 'table', len: 1 };
    item(id, TS[k].n, 'assises', 180 + Object.keys(TS).indexOf(k) * 20); }
  for (const k in CS) { MD['chr_' + k] = v => chairModel(k, v); const id = k === 'classique' ? 'chaise' : 'chaise_' + k, ex = O[id];
    O[id] = Object.assign({}, ex || {}, { id, n: CS[k].n, model: 'chr_' + k, v: 0, fp: [1, 1], h: CS[k].h + .02, walk: 1, sit: 1, take: 1, cat: 'assises', merge: 'seat' }); FAM[id] = { kind: 'seat', len: 1 };
    item(id, CS[k].n, 'assises', 150 + Object.keys(CS).indexOf(k) * 30); }
  for (const k in BS) { MD['bnc_' + k] = v => benchModel(k, v); const id = k === 'bois' ? 'banc' : k === 'parc' ? 'banc_parc' : k === 'canape' ? 'canape' : k === 'pique' ? 'table_pique' : (BS[k].kind === 'canape' ? 'canape_' : 'banc_') + k, ex = O[id], s = BS[k];
    O[id] = Object.assign({}, ex || {}, { id, n: s.n, model: 'bnc_' + k, v: 0, fp: [2, 1], h: s.kind === 'pique' ? .75 : s.kind === 'canape' ? .55 : .5, walk: 1, sit: 1, take: 1, cat: 'assises', merge: 'seat' }); FAM[id] = { kind: 'seat', len: 2 };
    item(id, s.n, 'assises', 220 + Object.keys(BS).indexOf(k) * 25, { stack: 9 }); }
  if (!G.CATS.find(c => c.id === 'assises')) G.CATS.splice(3, 0, { id: 'assises', n: '🪑 Tables & sièges' });
  for (const id of ['table_ferme', 'table_marbre', 'table_nappe', 'table_jardin', 'chaise_paillee', 'chaise_bistrot', 'chaise_jardin', 'chaise_club', 'chaise_rotin', 'banc_fer', 'banc_blanc', 'banc_rondin', 'canape_chesterfield', 'canape_velours']) if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);
  G.RECIPES.push({ id: 'table_ferme', need: { bois: 9 } }, { id: 'chaise_paillee', need: { bois: 3, herbe: 3 } }, { id: 'banc_rondin', need: { bois: 6 } }, { id: 'table_rondins', need: { bois: 8 } }, { id: 'banc_pierre', need: { pierre: 8 } }, { id: 'table_jardin', need: { fer: 3 } }, { id: 'chaise_jardin', need: { fer: 2 } });
  G.isMergeable = t => !!FAM[t];

  // ===================== FUSION (touche F) =====================
  const RT = [[1, 0], [0, -1], [-1, 0], [0, 1]]; // droite locale (+x) dans le monde, selon la rotation r
  const DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]], OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const seatNb = (m, o, side) => { const f = FAM[o.t], [dx, dz] = RT[o.r & 3], n = f.len * side, q = m.objAt(o.x + dx * n, o.z + dz * n); return q && q.t === o.t && (q.r & 3) === (o.r & 3) && q.x === o.x + dx * n && q.z === o.z + dz * n ? q : null; };
  const tableNb = (m, o, d) => { const q = m.objAt(o.x + d[0], o.z + d[1]); return q && q.t === o.t ? q : null; };
  function group(m, o) {
    const f = FAM[o.t], seen = new Set([o]), st = [o];
    while (st.length) { const a = st.pop(); const nbs = f.kind === 'table' ? DIRS.map(d => tableNb(m, a, d)) : [seatNb(m, a, -1), seatNb(m, a, 1)]; for (const q of nbs) if (q && !seen.has(q)) { seen.add(q); st.push(q); } }
    return [...seen];
  }
  const linked = (m, o) => { const f = FAM[o.t]; if (f.kind === 'table') return DIRS.every(d => { const q = tableNb(m, o, d); return !q || (o.v & d[2]); }); const l = seatNb(m, o, -1), r = seatNb(m, o, 1); return (!l || (o.v & 1)) && (!r || (o.v & 2)); };
  function merge(m, o) {
    const f = FAM[o.t], g = group(m, o), name = G.OBJ[o.t].n.toLowerCase();
    if (g.length < 2) { G.sfx('error'); G.ui.toast(f.kind === 'table' ? 'Pose une autre table identique juste à côté, puis appuie sur F devant pour les fusionner !' : 'Pose un autre siège identique juste à côté (même sens), puis appuie sur F pour en faire une banquette !'); return; }
    const join = !g.every(q => linked(m, q));
    for (const q of g) {
      let v = 0; if (join) { if (f.kind === 'table') { for (const d of DIRS) if (tableNb(m, q, d)) v |= d[2]; if (((q.x + q.z) % 3 + 3) % 3 === 0) v |= 16; } else { if (seatNb(m, q, -1)) v |= 1; if (seatNb(m, q, 1)) v |= 2; } }
      if ((q.v || 0) !== v) { q.v = v; m.refresh(q); } const [cx, cz] = m.center(q); G.fx.puff(cx, q.y + .5, cz, 3, 0xf3ead2, .45); }
    G.sfx(join ? 'craft' : 'pop'); G.cam.shake(.04);
    if (f.kind === 'table') { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of g) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); }
      G.ui.toast(join ? `✨ ${g.length} tables fusionnées : une grande table de ${x1 - x0 + 1} × ${z1 - z0 + 1} !` : `Les ${g.length} tables sont séparées.`); }
    else G.ui.toast(join ? `✨ ${g.length} sièges fusionnés en une longue banquette !` : `Les ${g.length} sièges sont séparés.`);
    if (G.net && G.net.markDirty) G.net.markDirty();
  }
  G.mergeFurniture = merge;
  // quand on retire un meuble fusionné, ses voisins ferment leur côté
  const P = G.GMap.prototype, orem = P.removeObj;
  P.removeObj = function (o) {
    const f = FAM[o.t]; let nbs = null;
    if (f && o.v) nbs = f.kind === 'table' ? DIRS.map(d => [tableNb(this, o, d), OPP[d[2]]]) : [[seatNb(this, o, -1), 2], [seatNb(this, o, 1), 1]];
    orem.call(this, o);
    if (nbs) for (const [q, bit] of nbs) if (q && (q.v & bit)) { q.v &= ~bit; if (FAM[q.t].kind === 'table' && !(q.v & 15)) q.v = 0; this.refresh(q); }
  };
  // F devant un meuble fusionnable (appui franc, pas en restant appuyé)
  const ou = G.act.use;
  G.act.use = () => { const p = G.player, m = G.map, I = G.input;
    if (p && m && !p.dead && !p.sit && !p.fish && !p.act && !p.charging && !p.vehicle && !p.swim && (I.hit('KeyF') || I.mouse.pl || I.gpHit(2))) { const [tx, tz] = p.target(), o = m.objAt(tx, tz); if (o && FAM[o.t]) return merge(m, o); }
    return ou(); };
  // s'asseoir sur une banquette : à la place la plus proche
  const osit = G.act.sitOn;
  G.act.sitOn = o => { const f = FAM[o.t]; if (!f || f.len !== 1) return osit(o); const p = G.player, [cx, cz] = G.map.center(o), d = G.OBJ[o.t]; p.sit = { o, px: p.x, pz: p.z }; p.x = cx; p.z = cz; p.y = o.y + Math.min(d.h, .5) - .3; p.vx = p.vz = p.vy = 0; p.yaw = o.r * PI / 2; G.sfx('place', .5); };

  // ===================== LUSTRES (au plafond) =====================
  // le modèle pend à partir du plafond (y = 0 en haut) ; v = 2 × hauteur sous plafond → longueur de la chaîne
  const CRY = 0xeaf6ff, CANDLE = 0xfff8ec, FLAME = 0xffd27a;
  const LS = {
    cristal: { n: 'Lustre en cristal', body: 1.1, li: 2.6 },
    versailles: { n: 'Lustre Versailles (grand)', body: 1.6, li: 3.2 },
    bougies: { n: 'Lustre à bougies en fer forgé', body: .7, li: 2.0 },
    anneaux: { n: 'Suspension anneaux lumineux', body: .6, li: 2.4 },
    murano: { n: 'Lustre de Murano', body: 1.0, li: 2.4 },
    tulipes: { n: 'Lustre tulipes', body: .8, li: 2.2 },
    cascade: { n: 'Lustre cascade', body: 1.4, li: 2.6 },
    globe: { n: 'Suspension globe', body: .5, li: 1.8 },
    lanterne: { n: 'Lanterne suspendue', body: .7, li: 1.8 },
    industriel: { n: 'Suspension industrielle', body: .45, li: 1.8 }
  };
  const BOTTOM = 2.55; // hauteur du bas des lustres au-dessus du sol (on passe dessous)
  const lTop = (ch, body) => Math.min(-.12, -(ch - BOTTOM - body)); // y du haut du corps, sous le plafond
  function chainTo(b, len, col = GOLD) { b.S(SK().gold); const n = Math.max(1, Math.round(len / .06)); for (let i = 0; i < n; i++) b.add(new THREE.TorusGeometry(.018, .005, 5, 8), col, b.M(0, -i * len / n - .03, 0, 0, i % 2 ? PI / 2 : 0, 0), 0, true); b.S(null); }
  function rosace(b, r = .22) { b.S(SK().paint); b.cyl(r, r * .8, .04, 28, 0xf4f1ea, 0, -.02, 0, 0, 0, 0, 0, true); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.sph(.03, 0xf4f1ea, Math.cos(a) * r * .8, -.04, Math.sin(a) * r * .8, 1, .5, 1); } b.S(SK().gold); b.cyl(.05, .04, .06, 14, GOLD, 0, -.07, 0); b.S(null); }
  function drop(b, x, y, z, s = 1) { b.S(SK().gem); b.add(new THREE.OctahedronGeometry(.025 * s, 0), CRY, b.M(x, y, z, 0, .4, 0, 1, 1.7, 1), 1); b.S(null); }
  function candle(b, x, y, z, s = 1) { b.S(SK().gold); b.cyl(.03 * s, .022 * s, .03, 10, GOLD, x, y, z); b.S(SK().ceramic); b.cyl(.013 * s, .013 * s, .1 * s, 8, CANDLE, x, y + .065 * s, z); b.S(null); b.sph(.018 * s, FLAME, x, y + .135 * s, z, 1, 1.5, 1, 1, 8, 6); }
  function lustreModel(k, v) {
    const s = LS[k], ch = v / 2, b = G.mb(860 + Object.keys(LS).indexOf(k)), sk = SK(), top = lTop(ch, s.body);
    rosace(b, k === 'versailles' ? .32 : .22); chainTo(b, Math.max(.06, -top - .06), k === 'bougies' || k === 'industriel' ? IRON : GOLD);
    const Y = top; // haut du corps du lustre
    if (k === 'cristal' || k === 'versailles' || k === 'cascade') {
      const big = k === 'versailles' ? 1.45 : 1, tiers = k === 'versailles' ? [[.85, -.55, 18], [.6, -.28, 12], [.36, -.02, 8]] : [[.6, -.45, 12], [.4, -.2, 8], [.22, 0, 6]];
      b.S(sk.gold); b.cyl(.025 * big, .04 * big, s.body * .8, 12, GOLD, 0, Y - s.body * .45, 0); b.sph(.07 * big, GOLD, 0, Y - s.body * .85, 0, 1, 1.2, 1);
      // couronne au sommet : petites feuilles d'acanthe dorées et pampilles
      b.S(sk.gold); b.tor(.16 * big, .014, GOLD, 0, Y - .06, 0, PI / 2, 0, 0, 0, 24); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; b.cone(.022, .09, 6, GOLD, Math.cos(a) * .16 * big, Y - .01, Math.sin(a) * .16 * big, 0, 0, 0); drop(b, Math.cos(a) * .17 * big, Y - .14, Math.sin(a) * .17 * big, .8); }
      for (const [r0, dy, n] of tiers) { const r = r0 * big, yy = Y + dy * big - s.body * .35; b.S(sk.gold); b.tor(r, .016 * big, GOLD, 0, yy, 0, PI / 2, 0, 0, 0, 48); b.tor(r * .97, .007 * big, 0xe8c87a, 0, yy - .03, 0, PI / 2, 0, 0, 0, 48);
        const spokes = Math.max(4, n >> 1); for (let i = 0; i < spokes; i++) { const a = (i + .5) / spokes * TAU; b.cyl(.009 * big, .012 * big, r, 6, GOLD, Math.cos(a) * r / 2, yy - .015, Math.sin(a) * r / 2, 0, -a, PI / 2); b.sph(.02 * big, GOLD, Math.cos(a) * r * .55, yy - .03, Math.sin(a) * r * .55, 1, 1.3, 1); }
        for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, a2 = (i + 1) / n * TAU, x2 = Math.cos(a2) * r, z2 = Math.sin(a2) * r;
          candle(b, x, yy + .01, z, big); for (let d = 1; d <= 3; d++) drop(b, x, yy - .045 - d * .062 * big, z, big * (1 - d * .1));
          for (let k = 1; k < 6; k++) { const t = k / 6, sag = Math.sin(t * PI) * .11 * big; drop(b, (x + (x2 - x) * t) * 1.04, yy - .05 - sag, (z + (z2 - z) * t) * 1.04, .55 * big); } } } // guirlandes de cristal
      if (k === 'cascade' || k === 'versailles') { b.S(sk.gem); const n = k === 'cascade' ? 36 : 24; for (let i = 0; i < n; i++) { const a = i / n * TAU * 3, r = .1 + (i / n) * .5 * big, yy = Y - s.body * .2 - (i / n) * s.body * .7; b.cyl(.003, .003, .18, 3, CRY, Math.cos(a) * r, yy, Math.sin(a) * r, 0, 0, 0, 1); drop(b, Math.cos(a) * r, yy - .11, Math.sin(a) * r, .9); } }
      b.S(sk.gold); b.sph(.05 * big, GOLD, 0, Y - s.body + .04, 0, 1, .8, 1); b.S(sk.gem); b.add(new THREE.OctahedronGeometry(.07 * big, 0), CRY, b.M(0, Y - s.body - .06, 0, 0, .4, 0, 1, 2.2, 1), 1); b.S(null);
    }
    else if (k === 'bougies') { b.S(sk.iron); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4; b.cyl(.006, .006, .55, 4, IRON, Math.cos(a) * .25, Y - .25, Math.sin(a) * .25, Math.sin(a) * .47, 0, -Math.cos(a) * .47); }
      b.tor(.5, .02, IRON, 0, Y - .5, 0, PI / 2, 0, 0, 0, 36); b.tor(.5, .01, IRON, 0, Y - .56, 0, PI / 2, 0, 0, 0, 36); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.S(sk.iron); b.add(new THREE.TorusGeometry(.04, .006, 4, 8), IRON, b.M(Math.cos(a) * .5, Y - .53, Math.sin(a) * .5, 0, -a + PI / 2, 0), 0, true); candle(b, Math.cos(a) * .5, Y - .49, Math.sin(a) * .5, 1.2); } }
    else if (k === 'anneaux') { b.S(sk.steel); for (const [r, yy] of [[.55, -.45], [.4, -.3], [.25, -.15]]) { for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; b.cyl(.002, .002, -yy, 3, 0x9a9a9a, Math.cos(a) * r, Y + yy / 2, Math.sin(a) * r); } b.tor(r, .02, 0xd9d4ca, 0, Y + yy, 0, PI / 2, 0, 0, 0, 48); b.S(null); b.tor(r, .012, 0xfff6e0, 0, Y + yy - .016, 0, PI / 2, 0, 0, 1, 48); b.S(sk.steel); } }
    else if (k === 'murano') { b.S(sk.gem); b.cyl(.04, .06, .5, 12, 0xf3e6c8, 0, Y - .25, 0, 0, 0, 0, 2); const cols = [0xff8fc0, 0x8fd0ff, 0xffd27a, 0xb8f0a0, 0xc8a8ff]; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = .4 + (i % 2) * .08;
        b.add(new THREE.TorusGeometry(r * .5, .018, 6, 12, PI * .8), cols[i % 5], b.M(Math.cos(a) * r * .5, Y - .5, Math.sin(a) * r * .5, 0, -a, PI * 1.05), 2, true); b.cone(.06, .14, 10, cols[(i + 2) % 5], Math.cos(a) * r, Y - .42, Math.sin(a) * r, PI, 0, 0, 1); for (let d = 0; d < 3; d++) b.sph(.02, cols[(i + d) % 5], Math.cos(a) * r * .7, Y - .62 - d * .06, Math.sin(a) * r * .7, 1, 1.3, 1, 2); }
      b.sph(.08, 0xffd27a, 0, Y - .75, 0, 1, 1.4, 1, 2); }
    else if (k === 'tulipes') { b.S(sk.gold); b.cyl(.02, .03, .3, 10, GOLD, 0, Y - .15, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = .3; b.add(new THREE.TorusGeometry(.18, .012, 6, 12, PI * .55), GOLD, b.M(Math.cos(a) * .15, Y - .32, Math.sin(a) * .15, 0, -a, PI * 1.1), 0, true);
        b.S(null); b.add(new THREE.CylinderGeometry(.08, .03, .14, 12, 1, true), 0xfff4e4, b.M(Math.cos(a) * r, Y - .42, Math.sin(a) * r), 1, true); b.S(sk.gold); } }
    else if (k === 'globe') { b.S(sk.gold); b.cyl(.004, .004, .2, 4, 0x2a2d33, 0, Y - .1, 0); b.cyl(.04, .05, .06, 12, GOLD, 0, Y - .22, 0); b.S(null); b.sph(.22, 0xfff6e8, 0, Y - .45, 0, 1, 1, 1, 1, 24, 18); }
    else if (k === 'lanterne') { b.S(sk.iron); b.box(.34, .03, .34, IRON, 0, Y - .05, 0); b.cone(.26, .16, 4, IRON, 0, Y + .02, 0, 0, PI / 4); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.02, .5, .02, IRON, sx * .15, Y - .32, sz * .15); b.box(.34, .03, .34, IRON, 0, Y - .58, 0); b.S(null); b.box(.27, .44, .27, 0xfff0c2, 0, Y - .32, 0, 0, 0, 0, 1); b.S(sk.iron); b.cone(.07, .1, 8, IRON, 0, Y - .64, 0, PI, 0, 0); }
    else if (k === 'industriel') { b.S(sk.iron); b.cyl(.004, .004, .1, 4, 0x2a2d33, 0, Y - .05, 0); b.add(new THREE.CylinderGeometry(.06, .3, .28, 24, 1, true), 0x2f3a3a, b.M(0, Y - .24, 0), 0, true); b.cyl(.06, .06, .04, 16, 0x2f3a3a, 0, Y - .1, 0); b.S(sk.gold); b.tor(.3, .01, 0xb08a4a, 0, Y - .38, 0, PI / 2, 0, 0, 0, 32); b.S(null); b.sph(.07, 0xfff0c2, 0, Y - .33, 0, 1, 1, 1, 1); }
    b.S(null); return b.done();
  }
  for (const k in LS) { const id = 'lustre_' + k, s = LS[k]; MD['lustre_' + k] = v => lustreModel(k, v);
    O[id] = { id, n: s.n, model: 'lustre_' + k, v: 6, fp: [1, 1], h: 0, walk: 1, ceil: 1, light: 1, toggle: 1, take: 1, cat: 'lustres', li: s.li, ld: 13, ly: o => lTop(o.v / 2, s.body) - s.body * .5 };
    item(id, s.n + ' (plafond)', 'lustres', 1200 + Object.keys(LS).indexOf(k) * 150, { stack: 9, desc: 'Se pose au plafond, même au-dessus d\'une table. Éclaire vraiment la pièce (E pour allumer/éteindre).' }); }
  if (!G.CATS.find(c => c.id === 'lustres')) G.CATS.splice(4, 0, { id: 'lustres', n: '💡 Lustres' });
  for (const id of ['lustre_cristal', 'lustre_bougies', 'lustre_globe', 'lustre_lanterne', 'lustre_tulipes']) if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);
  // poser au plafond : seulement à l'intérieur ; retirer (X) / allumer (E) un lustre quand rien n'est posé au sol dessous
  const opl = G.act.placeObj; G.act.placeObj = (it, tx, tz) => { const d = G.OBJ[it.obj]; if (d && d.ceil && !G.map.interior) { G.sfx('error'); return G.ui.toast('Un lustre s\'accroche au plafond : pose-le dans une maison !'); } if (d && d.ceil) { const m = G.map; if (!m.canPlace(it.obj, tx, tz, 0)) { G.sfx('error'); return G.ui.toast('Il y a déjà un lustre ici.'); } if (!G.inv.useHeld(1)) return; const o = m.addObj(it.obj, tx, tz, 0); G.sfx('place'); G.fx.burst(tx + .5, o.y - 1, tz + .5, 12, [0xfff3b0, 0xffffff], 1.5, .8, 2); G.lampRefresh && G.lampRefresh(); return; } return opl(it, tx, tz); };
  const otk = G.act.take; G.act.take = () => { const p = G.player, m = G.map; if (p && m && !p.act && !p.sit) { const [tx, tz] = p.target(), c = m.ceilAt && m.ceilAt(tx, tz) || m.ceilAt && m.ceilAt(Math.floor(p.x), Math.floor(p.z));
      if (c && !m.objAt(tx, tz)) { m.removeObj(c); G.sfx('pickup'); G.fx.puff(c.x + .5, c.y - 1.2, c.z + .5, 10, 0xffffff, .7); if (G.mode === 'survie' && G.inv.add(c.t, 1) > 0) G.ui.toast('Inventaire plein !'); G.lampRefresh && G.lampRefresh(); return; } } return otk(); };
  const oin = G.act.interact; G.act.interact = () => { const p = G.player, m = G.map; if (p && m && m.interior && !p.act && !p.sit && !G.ents.villagerInFront(p)) { const [tx, tz] = p.target(), o = m.objAt(tx, tz), c = m.ceilAt && (m.ceilAt(tx, tz) || m.ceilAt(Math.floor(p.x), Math.floor(p.z)));
      if (c && (!o || !G.act.useful(o))) { c.off = !c.off; m.refresh(c); G.sfx('ui'); G.lampRefresh && G.lampRefresh(); return; } } return oin(); };
})();
