'use strict';
// ===== Transports : vélo, skateboard, cheval, voiturette, hélicoptère, tapis volant, jet-ski.
// W ouvre le garage de poche (le véhicule sort avec une petite animation, W le range), E monte sur un véhicule posé
// ou garé. En multijoueur : on monte comme passager dans le véhicule d'un ami (E à côté), et son klaxon s'entend. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
  const CHROME = 0xcfd5da, DK = 0x1b1c20, TYRE = 0x18181a;
  // ---------- modèles (avant du véhicule vers +x, comme la moto) ----------
  const tube = (b, x1, y1, x2, y2, z, r, col) => { const L = Math.hypot(x2 - x1, y2 - y1); b.cyl(r, r, L, 8, col, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, Math.atan2(y2 - y1, x2 - x1) - PI / 2); };
  function roueVelo(b, x, y = .33, r = .3) { b.add(new THREE.TorusGeometry(r, .032, 8, 30), TYRE, b.M(x, y, 0), 0, true); b.add(new THREE.TorusGeometry(r - .035, .012, 6, 30), CHROME, b.M(x, y, 0), 0, true);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; b.geo(new THREE.BoxGeometry(.006, r - .04, .006), CHROME, b.M(x + Math.cos(a) * (r - .04) / 2, y + Math.sin(a) * (r - .04) / 2, 0, 0, 0, a - PI / 2)); } b.cyl(.035, .035, .1, 10, DK, x, y, 0, PI / 2); }
  const VCOL = [0x2f8f8a, 0xe8434a, 0xffc23d, 0x5b8fd6, 0xf2e6d2];
  function cadreVelo(b, v) { const c = VCOL[v % 5];
    tube(b, .42, .9, .02, .36, 0, .028, c); tube(b, -.14, .86, .02, .36, 0, .028, c); tube(b, .42, .86, -.12, .82, 0, .026, c); for (const s of [-1, 1]) { tube(b, .02, .36, -.55, .33, s * .05, .016, c); tube(b, -.13, .82, -.55, .33, s * .05, .016, c); tube(b, .45, .92, .55, .33, s * .045, .018, CHROME); }
    b.box(.24, .05, .12, 0x3a2a22, -.17, .9, 0); b.cyl(.012, .012, .1, 6, CHROME, -.15, .85, 0); b.cyl(.016, .016, .52, 8, CHROME, .44, 1.0, 0, PI / 2); for (const s of [-1, 1]) b.cyl(.026, .026, .1, 8, 0x5a3a26, .44, 1.0, s * .27, PI / 2);
    b.cyl(.016, .016, .14, 8, CHROME, .44, .94, 0); b.cyl(.09, .09, .02, 18, CHROME, .02, .36, .07, PI / 2); b.box(.1, .02, .05, DK, .02, .36, .14); b.box(.1, .02, .05, DK, .02, .36, -.14);
    b.box(.32, .2, .24, 0xc89157, .62, .92, 0); b.box(.34, .03, .26, 0x9a6a3a, .62, 1.02, 0); b.sph(.035, 0xffd23f, .38, 1.04, -.18); b.box(.36, .03, .2, CHROME, -.42, .68, 0); b.box(.22, .1, .02, c, .55, .52, 0); }
  MD.velo = v => { const b = G.mb(2500 + (v || 0)); cadreVelo(b, v || 0); roueVelo(b, .55); roueVelo(b, -.55); return b.done(); };
  MD.velo_cadre = v => { const b = G.mb(2500 + (v || 0)); cadreVelo(b, v || 0); return b.done(); };
  MD.velo_roue = () => { const b = G.mb(2509); roueVelo(b, 0, 0); return b.done(); };
  MD.skate = v => { const b = G.mb(2510 + (v || 0)), c = [0xe8434a, 0x3b78d8, 0x2b2b30, 0xffc23d, 0x9b59d0][(v || 0) % 5];
    b.box(.78, .035, .26, 0xd9a26a, 0, .16, 0); b.box(.78, .012, .24, c, 0, .182, 0, 0, 0, 0, 0); for (const s of [-1, 1]) { b.box(.16, .035, .24, 0xd9a26a, s * .45, .19, 0, 0, 0, s * .35); b.box(.06, .05, .16, CHROME, s * .3, .12, 0); for (const z of [-.1, .1]) b.cyl(.045, .045, .04, 12, 0xfff2c8, s * .3, .08, z, PI / 2); }
    b.box(.4, .004, .1, 0xffffff, 0, .19, 0); return b.done(); };
  const HCOL = [[0x8a5a34, 0x2b1d12], [0x2b2b30, 0x111114], [0xf2ede4, 0xd9cdbb], [0xa8572a, 0x5a2a12], [0xd9b36a, 0xf3ead2]];
  function corpsCheval(b, v) { const [c, m] = HCOL[v % 5];
    b.sph(.36, c, 0, 1.05, 0, 1.85, 1.05, .95, 0, 18, 12); b.sph(.3, c, .42, 1.12, 0, 1.1, 1.15, 1); b.sph(.3, c, -.42, 1.08, 0, 1.1, 1.1, 1);
    tube(b, .5, 1.2, .78, 1.68, 0, .15, c); b.sph(.17, c, .82, 1.72, 0, 1.2, 1, .9); b.box(.34, .15, .16, c, 1.0, 1.66, 0, 0, 0, -.55); b.sph(.08, 0x4a3426, 1.12, 1.56, 0, 1.2, .8, 1.3);
    for (const s of [-1, 1]) { b.cone(.05, .14, 6, c, .78, 1.9, s * .07); b.sph(.025, 0x111111, .93, 1.76, s * .085); }
    for (let k = 0; k < 6; k++) b.box(.1, .14, .05, m, .52 + k * .055, 1.32 + k * .08, 0, 0, 0, -.6); b.cone(.09, .6, 8, m, -.88, .82, 0, 0, 0, 2.6);
    b.box(.46, .08, .5, 0x7a3a22, -.02, 1.4, 0); b.box(.5, .03, .56, 0xd9b84a, -.02, 1.36, 0); b.box(.12, .1, .44, 0x5a2a12, -.18, 1.47, 0); b.box(.06, .1, .3, 0x5a2a12, .16, 1.47, 0);
    for (const s of [-1, 1]) { b.cyl(.01, .01, .34, 4, 0x333333, -.02, 1.2, s * .27); b.box(.07, .02, .08, CHROME, -.02, 1.02, s * .27); } b.tor(.06, .012, 0x333333, 1.08, 1.6, 0, 0, PI / 2, 0); }
  const jambe = (b, x, y, z, c) => { b.cyl(.075, .065, .5, 10, c, x, y - .25, z); b.cyl(.055, .05, .42, 10, c, x, y - .7, z); b.cyl(.07, .075, .1, 10, 0x2b2420, x, y - .93, z); };
  MD.cheval = v => { const b = G.mb(2520 + (v || 0)), c = HCOL[(v || 0) % 5][0]; corpsCheval(b, v || 0); for (const [x, z] of [[.45, .14], [.45, -.14], [-.45, .14], [-.45, -.14]]) jambe(b, x, .98, z, c); return b.done(); };
  MD.cheval_corps = v => { const b = G.mb(2520 + (v || 0)); corpsCheval(b, v || 0); return b.done(); };
  MD.cheval_jambe = v => { const b = G.mb(2529 + (v || 0)); jambe(b, 0, 0, 0, HCOL[(v || 0) % 5][0]); return b.done(); };
  const CCOL = [0x9fd0c9, 0xe8434a, 0xffd23f, 0x5b8fd6, 0xf2e6d2];
  function corpsAuto(b, v) { const c = CCOL[v % 5];
    b.box(1.9, .42, 1.06, c, 0, .58, 0); b.sph(.55, c, .62, .72, 0, 1.0, .5, .95); b.box(1.08, .07, 1.06, c, -.2, 1.74, 0); b.box(.96, .06, .94, 0xd9cdbb, -.2, 1.79, 0); b.box(.06, .92, 1.0, c, -.72, 1.25, 0);
    b.box(.06, .84, .92, 0xcfefff, .34, 1.25, 0, 0, 0, -.2, 2); for (const s of [-1, 1]) { b.box(.86, .7, .03, 0xcfefff, -.2, 1.28, s * .51, 0, 0, 0, 2); b.box(.06, .98, .05, c, .32, 1.25, s * .5, 0, 0, -.2); b.box(.06, .96, .05, c, -.7, 1.25, s * .5); b.sph(.1, 0xfff6c8, .98, .72, s * .32, .6, 1, 1, 1); b.cyl(.11, .11, .04, 14, CHROME, .96, .72, s * .32, 0, 0, PI / 2);
      for (const x of [.62, -.62]) b.cyl(.34, .34, .14, 16, c, x, .42, s * .5, PI / 2); b.box(.1, .05, .05, CHROME, .45, .9, s * .53); b.box(.08, .06, .03, 0xff3a2a, -.95, .62, s * .38, 0, 0, 0, 1); }
    b.box(.08, .12, 1.1, CHROME, 1.0, .42, 0); b.box(.08, .12, 1.1, CHROME, -1.0, .42, 0); b.box(.04, .18, .5, 0x333338, .99, .62, 0);
    for (const s of [-1, 1]) { b.box(.36, .2, .34, 0x6b3a26, -.2, .7, s * .26); b.box(.08, .46, .34, 0x6b3a26, -.38, 1.0, s * .26); } b.tor(.13, .02, DK, .18, .95, -.26, 0, PI / 2 + .5, 0); b.cyl(.015, .015, .3, 5, DK, .1, .85, -.26, 0, 0, .9); }
  const roueAuto = (b, x, z) => { b.cyl(.28, .28, .16, 18, TYRE, x, .28, z, PI / 2); b.cyl(.17, .17, .17, 14, 0xe8e8e8, x, .28, z, PI / 2); b.cyl(.06, .06, .18, 10, CHROME, x, .28, z, PI / 2); };
  MD.voiturette = v => { const b = G.mb(2530 + (v || 0)); corpsAuto(b, v || 0); for (const x of [.62, -.62]) for (const z of [.5, -.5]) roueAuto(b, x, z); return b.done(); };
  MD.voiturette_corps = v => { const b = G.mb(2530 + (v || 0)); corpsAuto(b, v || 0); return b.done(); };
  MD.voiturette_roue = () => { const b = G.mb(2539); roueAuto(b, 0, 0); const g = b.done(); g.translate(0, -.28, 0); return g; };
  const KCOL = [0xe8434a, 0x3b78d8, 0xffc23d, 0x2f8f55, 0xf2f2f2];
  function corpsHelico(b, v) { const c = KCOL[v % 5];
    b.sph(.62, c, 0, .62, 0, 1.25, .5, .92, 0, 20, 14); b.sph(.62, 0xcfefff, .05, 1.14, 0, 1.2, .95, .9, 2, 20, 14); b.box(1.2, .05, .06, c, -.05, .72, .55); b.box(1.2, .05, .06, c, -.05, .72, -.55); tube(b, -.6, .95, -2.1, 1.25, 0, .09, c); b.box(.36, .5, .05, c, -2.1, 1.45, 0, 0, 0, -.3); b.box(.4, .05, .5, c, -1.95, 1.22, 0);
    b.box(.4, .12, .5, 0x555a60, 0, 1.78, 0); b.cyl(.05, .05, .2, 8, DK, 0, 1.92, 0);
    for (const s of [-1, 1]) { b.cyl(.035, .035, 2.1, 8, DK, 0, .08, s * .48, 0, 0, PI / 2); b.cyl(.025, .025, .5, 6, DK, .4, .3, s * .42, .3 * s); b.cyl(.025, .025, .5, 6, DK, -.45, .3, s * .42, .3 * s); }
    for (const s of [-1, 1]) b.box(.3, .3, .3, 0x6b3a26, .1, .72, s * .22); b.box(.04, .04, .2, 0xff3a2a, -2.12, 1.72, 0, 0, 0, 0, 1); }
  const rotor = (b, y = 0) => { for (const a of [0, PI / 2]) b.box(4.2, .03, .17, 0x2b2b30, 0, y, 0, 0, a, 0); b.cyl(.12, .12, .08, 12, 0x777777, 0, y, 0); };
  MD.helico = v => { const b = G.mb(2540 + (v || 0)); corpsHelico(b, v || 0); rotor(b, 2.04); b.box(.6, .02, .08, DK, -2.1, 1.5, .08); return b.done(); };
  MD.helico_corps = v => { const b = G.mb(2540 + (v || 0)); corpsHelico(b, v || 0); return b.done(); };
  MD.helico_rotor = () => { const b = G.mb(2549); rotor(b); return b.done(); };
  MD.helico_queue = () => { const b = G.mb(2548); b.box(.6, .02, .08, DK, 0, 0, 0); return b.done(); };
  const TCOL = [[0xb8323a, 0xffd23f, 0x2a4f8a], [0x2a4f8a, 0xf2e6d2, 0xb8323a], [0x2f7a45, 0xffd23f, 0x8e1f2a], [0x6b2a8a, 0xff9a3c, 0x45c7c1]];
  function segTapis(b, v, i, n, ox = 0, oy = 0) { const [c1, c2, c3] = TCOL[v % 4], w = 2.0 / n;
    b.box(w + .005, .035, 1.2, c1, ox, oy, 0); b.box(w + .006, .037, .14, c2, ox, oy, .5); b.box(w + .006, .037, .14, c2, ox, oy, -.5); if (i % 2) b.box(w * .5, .038, .5, c3, ox, oy, 0); else b.sph(.12, c2, ox, oy + .01, 0, 1, .12, 1);
    if (i === 0 || i === n - 1) for (let k = 0; k < 6; k++) b.cyl(.015, .025, .14, 5, c2, ox + (i === 0 ? -1 : 1) * (w / 2 + .06), oy, -.5 + k * .2, 0, 0, PI / 2); }
  MD.tapis = v => { const b = G.mb(2550 + (v || 0)); for (let i = 0; i < 6; i++) segTapis(b, v || 0, i, 6, -1 + (2 / 6) * (i + .5), .05); return b.done(); };
  MD.tapis_seg = v => { const b = G.mb(2560 + v); segTapis(b, Math.floor(v / 10), v % 10, 6); return b.done(); };
  const JCOL = [0xffffff, 0xffd23f, 0x45c7c1, 0xe8434a];
  MD.jetski = v => { const b = G.mb(2570 + (v || 0)), c = [0xe8434a, 0x3b78d8, 0x2f8f55, 0xff9a3c][(v || 0) % 4];
    b.sph(.42, JCOL[(v || 0) % 4], 0, .25, 0, 2.0, .45, .85, 0, 20, 12); b.box(1.2, .06, .5, c, -.1, .4, 0); b.cone(.3, .5, 14, JCOL[(v || 0) % 4], .95, .28, 0, 0, 0, -PI / 2);
    b.box(.7, .14, .28, 0x222226, -.3, .52, 0); b.cyl(.06, .08, .3, 10, c, .35, .55, 0, 0, 0, -.3); b.cyl(.016, .016, .46, 8, CHROME, .42, .72, 0, PI / 2); b.box(.1, .03, .4, c, .9, .46, 0, 0, 0, 0, 1); return b.done(); };

  // ---------- les véhicules ----------
  const VEH = {
    velo: { n: 'Vélo', ico: '🚲', kind: 'ground', fp: [2, 1], tiers: [['🚲 Balade', 4.6], ['🚴 Sportif', 8]], acc: 3.4, turn: 2.6, hop: 1, space: 'bell', lean: 1, pose: 'velo', sell: 1200, need: { bois: 2, fer: 6 }, w: .3, pts: [[.7, 0], [0, 0], [-.6, 0]] },
    skate: { n: 'Skateboard', ico: '🛹', kind: 'ground', fp: [1, 1], tiers: [['🛹 Cool', 6.5], ['⚡ À fond', 10]], acc: 4, turn: 2.4, hop: 1, jump: 7, pose: 'skate', sell: 800, need: { bois: 6, fer: 2 }, pts: [[.4, 0], [-.4, 0]] },
    cheval: { n: 'Cheval', ico: '🐴', kind: 'ground', fp: [2, 1], tiers: [['🐴 Pas', 2.6], ['🐎 Trot', 6.2], ['💨 Galop', 12.5]], acc: 4.2, turn: 2.3, hop: 1, jump: 8.6, lean: .5, pose: 'cheval', space: 'jump', sell: 4500, need: { pomme: 10, bois: 6 }, pts: [[1.0, 0], [0, 0], [-.85, 0], [.3, .25], [.3, -.25]] },
    voiturette: { n: 'Voiturette', ico: '🚗', kind: 'ground', fp: [2, 2], tiers: [['🐢 Tranquille', 6], ['🚗 Normale', 11], ['🏁 Rallye', 16.5]], acc: 3.6, turn: 1.9, hop: 0, space: 'horn', pose: 'auto', sell: 6000, need: { fer: 20, bois: 6, pierre: 6 }, pts: [[1.0, 0], [1.0, .45], [1.0, -.45], [0, .5], [0, -.5], [-1.0, .45], [-1.0, -.45]] },
    helico: { n: 'Hélicoptère', ico: '🚁', kind: 'fly', fp: [3, 3], max: 13, climb: 5, hover: 0, pose: 'auto', sell: 15000, need: { fer: 35, or: 4 } },
    tapis: { n: 'Tapis volant', ico: '🧞', kind: 'fly', fp: [2, 1], max: 9, climb: 4, hover: .45, pose: 'tailleur', sell: 9000, need: { herbe: 20, or: 2 } },
    jetski: { n: 'Jet-ski', ico: '🌊', kind: 'sea', fp: [2, 1], max: 14.5, acc: 6, turn: 2.2, space: 'horn', pose: 'moto', sell: 5000, need: { fer: 16, pierre: 4 } }
  };
  // sièges (position dans le repère du modèle) : le premier est le conducteur, les suivants sont pour les amis passagers
  const SEATS = G.SEATS = {
    velo: { ry: PI / 2, s: [[-.17, .93, 0, 'velo'], [-.42, .72, 0, 'porte']] },
    skate: { ry: PI / 2, s: [[0, .2, 0, 'skate']] },
    cheval: { ry: PI / 2, s: [[-.03, 1.45, 0, 'cheval'], [-.5, 1.42, 0, 'cheval']] },
    voiturette: { ry: PI / 2, s: [[-.2, .8, -.26, 'auto'], [-.2, .8, .26, 'auto']] },
    helico: { ry: PI / 2, s: [[.1, .88, -.22, 'auto'], [.1, .88, .22, 'auto']] },
    tapis: { ry: PI / 2, s: [[.35, .08, 0, 'tailleur'], [-.45, .08, 0, 'tailleur']] },
    jetski: { ry: PI / 2, s: [[-.15, .6, 0, 'moto'], [-.55, .6, 0, 'moto']] },
    moto: { ry: PI / 2, s: [[-.36, .84, 0, 'moto'], [-.64, .86, 0, 'moto']] },
    boat: { ry: PI / 2, s: v => v === 4 ? [[-.05, .18, 0, 'banc'], [.45, .18, 0, 'banc']] : [[-.4, [.36, .34, .34, .46][v] || .36, 0, 'banc'], [.35, [.36, .34, .34, .46][v] || .36, 0, 'banc'], [.05, [.36, .34, .34, .46][v] || .36, .2, 'banc']] },
    montgolfiere: { ry: 0, s: [[0, .3, 0, 'debout'], [.35, .3, .25, 'debout'], [-.35, .3, -.25, 'debout']] },
    avion: { ry: 0, s: [[0, .36, -.15, 'auto'], [0, .36, -.85, 'auto']] }
  };
  const seatList = (g, v) => { const S = SEATS[g]; if (!S) return null; return typeof S.s === 'function' ? S.s(v | 0) : S.s; };
  const POSE = { velo: { bob: -.3, lean: .22, thigh: -1.1, shin: .8, arm: -1.15, fore: -.25, armZ: .12 }, porte: { bob: -.3, lean: -.05, thigh: -1.45, shin: 1.2, arm: -.3, fore: -.7, armZ: .05 }, cheval: { bob: -.3, lean: .08, thigh: -.95, shin: .55, arm: -.9, fore: -.5, armZ: .1 },
    auto: { bob: -.3, lean: -.08, thigh: -1.45, shin: .75, arm: -.95, fore: -.4, armZ: .08 }, tailleur: { bob: -.3, lean: .05, thigh: -1.5, shin: 1.7, arm: -.35, fore: -.7, armZ: .1 }, moto: { bob: -.3, lean: .18, thigh: -1.15, shin: .95, arm: -1.15, fore: -.35, armZ: .16 }, banc: { bob: -.3, lean: -.04, thigh: -1.45, shin: 1.25, arm: -.3, fore: -.85, armZ: .04 } };
  const hipY = q => q ? q.bob + .64 * Math.cos(q.lean || 0) : 0;
  for (const id in VEH) { const S = VEH[id]; S.id = id;
    O[id] = { id, n: S.n, model: id, v: 0, fp: S.fp, h: S.kind === 'fly' ? 1 : .9, take: 1, cat: 'construction', balloon: 1, veh2: 1, ico: S.ico, onWater: S.kind === 'sea' ? 1 : 0 };
    G.ITEMS[id] = { id, n: S.n, stack: 1, sell: S.sell, buy: S.sell * 3, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, desc: S.ico + ' W : garage de poche. E pour monter dessus.' };
    G.RECIPES.push({ id, need: S.need }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); }

  // ---------- sons ----------
  const AU = () => { const A = G.audio; return A && A.ok && A.ctx && A.sfxG ? A : null; };
  function beep(f, d, type = 'square', vol = .06, f2) { const A = AU(); if (!A) return; try { const C = A.ctx, t = C.currentTime, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.linearRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + d + .05); } catch (e) { } }
  const HORN = { horn: k => { beep(392, .38, 'square', .05 * k); beep(494, .38, 'square', .04 * k); }, bell: k => { beep(1568, .7, 'sine', .07 * k); setTimeout(() => beep(2093, .6, 'sine', .05 * k), 110); },
    neigh: k => { beep(620, .25, 'sawtooth', .035 * k, 980); setTimeout(() => beep(900, .45, 'sawtooth', .03 * k, 480), 230); }, magic: k => [0, 1, 2, 3].forEach(i => setTimeout(() => beep([784, 988, 1175, 1568][i], .35, 'sine', .05 * k), i * 90)), clop: k => beep(180 + Math.random() * 40, .06, 'triangle', .05 * k) };
  const hornOf = g => g === 'velo' ? 'bell' : g === 'cheval' ? 'neigh' : g === 'tapis' ? 'magic' : 'horn';
  function honk(g) { HORN[hornOf(g)](1); G.hornT = [Date.now(), g]; }
  const ENG = { on: false, kind: null,
    start(kind) { const A = AU(); if (!A || ENG.on) return; const c = A.ctx; ENG.kind = kind; ENG.o = c.createOscillator(); ENG.f = c.createBiquadFilter(); ENG.g = c.createGain(); ENG.o.type = kind === 'helico' ? 'sawtooth' : kind === 'jetski' ? 'sawtooth' : 'square'; ENG.f.type = 'lowpass'; ENG.f.frequency.value = kind === 'jetski' ? 1100 : 480; ENG.g.gain.value = 0; ENG.o.connect(ENG.f); ENG.f.connect(ENG.g); ENG.g.connect(A.sfxG);
      if (kind === 'helico') { ENG.l = c.createOscillator(); ENG.lg = c.createGain(); ENG.l.frequency.value = 11; ENG.lg.gain.value = .025; ENG.l.connect(ENG.lg); ENG.lg.connect(ENG.g.gain); ENG.l.start(); } ENG.o.start(); ENG.on = true; },
    set(rpm, vol) { if (!ENG.on) return; const t = AU().ctx.currentTime, base = ENG.kind === 'helico' ? 52 : ENG.kind === 'jetski' ? 70 : 34; ENG.o.frequency.setTargetAtTime(base + rpm * (ENG.kind === 'jetski' ? 110 : 60), t, .08); ENG.g.gain.setTargetAtTime(vol, t, .1); if (ENG.l) ENG.l.frequency.setTargetAtTime(9 + rpm * 6, t, .1); },
    stop() { if (!ENG.on) return; try { ENG.g.gain.value = 0; ENG.o.stop(); if (ENG.l) ENG.l.stop(); } catch (e) { } ENG.l = null; ENG.on = false; } };
  // ---------- tableau de bord ----------
  const hud = document.createElement('div'); hud.id = 'veh-hud'; hud.hidden = true; hud.style.cssText = 'position:fixed;left:50%;bottom:138px;transform:translateX(-50%);z-index:40;background:rgba(30,26,22,.8);color:#fff;font:700 14px Nunito,sans-serif;padding:8px 14px;border-radius:16px;text-align:center;pointer-events:none;line-height:1.5;max-width:92vw'; document.body.appendChild(hud);
  const hudSet = (v, html) => { if ((v.hudT = (v.hudT || 0) + 1) % 5) return; hud.innerHTML = html; };

  // ---------- sol, obstacles (comme la moto) ----------
  const small = (o, d) => d.walk || G.isFlowerObj(o) || (d.pick && !d.enter) || (!d.enter && !d.chop && (d.h || 0) < .55);
  function ground(m, x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return null; const o = m.objAt(tx, tz), d = o && O[o.t]; if (d && d.walk) return m.topAt(x, z); if (m.isWaterAt(x, z)) return null; return m.terrainH(x, z); }
  function obstacle(m, x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return 99; const o = m.objAt(tx, tz), d = o && O[o.t]; let top = m.terrainH(x, z);
    if (o && !small(o, d)) { const fp = G.fpDims(d, o.r || 0); if (d.chop >= 3 || (fp[0] * fp[1] === 1 && !d.enter)) { if (Math.hypot(x - tx - .5, z - tz - .5) < .34) top = Math.max(top, o.y + Math.min(d.h || 3, 4)); } else top = Math.max(top, m.topAt(x, z)); }
    for (const e of G.ents.villagers) if (e.map === m && e.visible && Math.hypot(e.x - x, e.z - z) < .42) top = Math.max(top, e.y + 3); return top; }
  function fits(m, S, x, z, h, y, air) { const fx = Math.sin(h), fz = Math.cos(h), lim = y + (air ? .15 : .62);
    for (const [a, b] of S.pts) { const px = x + fx * a + fz * b, pz = z + fz * a - fx * b; if (obstacle(m, px, pz) > lim || (!air && ground(m, px, pz) === null)) return false; } return true; }

  // ---------- caméra de poursuite ----------
  function camFn(camera, C, dt, mouse) { const v = G.player.vehicle; if (!v) return false; const k = 1 - Math.exp(-dt * (mouse ? 7 : 3)); if (mouse) C.yaw = G.angLerp(C.yaw, C.tyaw, k); else { C.yaw = G.angLerp(C.yaw, v.h + PI, k); C.tyaw = C.yaw; }
    const fly = v.S.kind === 'fly', dist = (fly ? 7 : v.S.id === 'voiturette' ? 6.2 : 5) + Math.abs(v.spd) * .16, pitch = mouse ? G.clamp(C.mp, .05, 1.1) : fly ? .5 : .36, tx = v.x, ty = v.y + (fly ? 1.2 : v.S.id === 'cheval' ? 1.7 : 1.05), tz = v.z, kk = Math.min(1, 10 * dt);
    if (!C.cx) { C.cx = tx; C.cy = ty; C.cz = tz; } C.cx += (tx - C.cx) * kk; C.cy += (ty - C.cy) * kk; C.cz += (tz - C.cz) * kk;
    const hd = Math.cos(pitch) * dist; camera.position.set(C.cx + Math.sin(C.yaw) * hd, C.cy + Math.sin(pitch) * dist, C.cz + Math.cos(C.yaw) * hd);
    const gh = G.map.terrainH(camera.position.x, camera.position.z); if (gh < 40 && camera.position.y < gh + .9) camera.position.y = gh + .9; camera.lookAt(C.cx, C.cy, C.cz); return true; }

  // ---------- construire le véhicule animé ----------
  function build(S, col) { const grp = new THREE.Group(), part = (g, v, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(G.getGeo(g, v), G.MATS); me.castShadow = true; me.frustumCulled = false; me.position.set(x, y, z); grp.add(me); return me; }, P = {};
    if (S.id === 'velo') { part('velo_cadre', col); P.w = [part('velo_roue', 0, .55, .33), part('velo_roue', 0, -.55, .33)]; }
    else if (S.id === 'voiturette') { part('voiturette_corps', col); P.w = []; for (const x of [.62, -.62]) for (const z of [.5, -.5]) P.w.push(part('voiturette_roue', 0, x, .28, z)); }
    else if (S.id === 'cheval') { part('cheval_corps', col); P.legs = [[.45, .14], [.45, -.14], [-.45, .14], [-.45, -.14]].map(([x, z]) => part('cheval_jambe', col, x, .98, z)); }
    else if (S.id === 'helico') { part('helico_corps', col); P.rot = part('helico_rotor', 0, 0, 2.04, 0); P.tail = part('helico_queue', 0, -2.1, 1.5, .08); }
    else if (S.id === 'tapis') { P.seg = []; for (let i = 0; i < 6; i++) P.seg.push(part('tapis_seg', col * 10 + i, -1 + (2 / 6) * (i + .5), .05, 0)); }
    else part(S.id, col);
    grp.rotation.order = 'YXZ'; G.scene.add(grp); return { grp, P }; }
  const SEATV = new V3(), Q1 = new THREE.Quaternion(), QY = new THREE.Quaternion(), YAX = new V3(0, 1, 0);
  // position du siège k (dans le monde) et orientation du personnage assis
  G.seatWorld = (mesh, g, v, k, out = {}) => { const L = seatList(g, v), s = L && L[k]; if (!s || !mesh) return null; mesh.updateMatrixWorld(); out.pos = mesh.localToWorld(SEATV.set(s[0], s[1], s[2])).clone(); mesh.getWorldQuaternion(Q1); out.q = Q1.clone().multiply(QY.setFromAxisAngle(YAX, SEATS[g].ry)); out.pose = s[3]; return out; };

  // ---------- monter, sortir de la poche, ranger, garer ----------
  let lastToggle = 0;
  function ride(S, col, x, z, h, pop, y) {
    const m = G.map, p = G.player; const { grp, P } = build(S, col); p.fish && G.act.stopFish(); p.emote = null; p.sit = null; p.root.rotation.order = 'YXZ';
    const gy = y != null ? y : S.kind === 'sea' ? m.waterSurf(Math.floor(x), Math.floor(z)) : m.topAt(x, z);
    p.vehicle = { veh2: 1, S, o: { t: S.id, r: 0, v: col }, vg: [S.id, col], v: col, x, z, y: gy, vy: 0, h, spd: 0, gear: Math.min(S.tiers ? S.tiers.length - 1 : 0, 1), mesh: grp, P, t: 0, lean: 0, camFn, anim: pop ? { k: 'in', t: 0 } : null, alt: 0 };
    if (pop) { grp.scale.setScalar(.01); G.sfx('pop'); G.fx.burst(x, gy + .5, z, 18, [0xffffff, 0xf3ead2, 0xffe08a], 2.6, .55, 6); }
    if (S.id !== 'velo' && S.id !== 'skate' && S.id !== 'cheval' && S.id !== 'tapis') ENG.start(S.id);
    if (S.id === 'cheval') HORN.neigh(1); if (S.id === 'tapis') HORN.magic(1);
    hud.hidden = false; G.cam.cx = 0; G.sfx('place', .6);
    const keys = S.kind === 'fly' ? 'Espace : monter · Maj : descendre · E : atterrir' : S.kind === 'sea' ? 'Espace : klaxon · E : accoster' : (S.tiers.length > 1 ? '1 2 3 : allures · ' : '') + (S.jump ? 'Espace : sauter · ' : S.space ? 'Espace : ' + (S.space === 'bell' ? 'sonnette' : 'klaxon') + ' · ' : '') + 'E : garer';
    G.ui.toast(S.ico + ' ' + S.n + ' ! ' + keys + ' · W : ranger dans ta poche', 6000);
  }
  function mountObj(o) { const m = G.map, p = G.player; if (p.vehicle || p.swim || p.sit) return; const S = VEH[o.t], [cx, cz] = m.center(o); m.removeObj(o); ride(S, o.v || 0, cx, cz, (o.r || 0) * PI / 2 + PI / 2, false); if (p.vehicle) p.vehicle.fromObj = 1; }
  function leave(p, v) { lastToggle = performance.now(); G.scene.remove(v.mesh); p.vehicle = null; ENG.stop(); hud.hidden = true; G.clearPose && G.clearPose(p.C); if (p.toolMesh) p.toolMesh.visible = true; p.root.rotation.set(0, p.yaw, 0); p.root.rotation.order = 'XYZ'; p.root.visible = true; p.blob.visible = true; G.cam.cx = 0; }
  G.vehLeave = () => { const p = G.player; if (p && p.vehicle && p.vehicle.veh2) leave(p, p.vehicle); if (p && p.vehicle && p.vehicle.pass) hopOff(p); };
  function stow(p, v) { if (v.anim) return; if (v.fromObj && G.net && G.net.visit && !v.parking) { v.parking = 1; park(p, v); if (p.vehicle === v) v.parking = 0; return; } /* le véhicule d'un ami : on le regare */ v.spd = 0; v.anim = { k: 'out', t: 0 }; G.sfx('pickup'); ENG.set(.2, .01); }
  function stowDone(p, v) { const m = G.map, gy = v.S.kind === 'sea' ? null : ground(m, v.x, v.z); G.fx.burst(v.x, v.y + .5, v.z, 14, [0xffffff, 0xf3ead2], 2.2, .5, 6); leave(p, v);
    let x = v.x, z = v.z; if (gy === null || v.S.kind === 'fly' || v.S.kind === 'sea') { const s = landNear(m, v.x, v.z); if (s) { x = s[0]; z = s[1]; } } p.teleport(x, z, v.h); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true);
    if (G.mode !== 'creatif') { if (G.inv.add(v.S.id, 1) > 0) G.ui.toast('Inventaire plein !'); else G.ui.toast(v.S.ico + ' ' + v.S.n + ' rangé dans ton inventaire.'); } else G.ui.toast(v.S.ico + ' ' + v.S.n + ' rangé.'); }
  function landNear(m, x, z) { let best = null, bd = 1e9; for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const tx = Math.floor(x) + dx, tz = Math.floor(z) + dz; if (!m.inb(tx, tz) || m.isWaterAt(tx + .5, tz + .5)) continue; const o = m.objAt(tx, tz); if (o && !O[o.t].walk) continue; const d = Math.hypot(tx + .5 - x, tz + .5 - z); if (d < bd) { bd = d; best = [tx + .5, tz + .5]; } } return best; }
  // E : on gare le véhicule là (en visite, il retourne dans la poche : on ne laisse rien chez les amis)
  function park(p, v) { const m = G.map; if (Math.abs(v.spd) > 3) { G.ui.toast('Ralentis avant de descendre.'); return; } if (G.net && G.net.visit && !v.fromObj) return stow(p, v);
    const r = ((Math.round((v.h - PI / 2) / (PI / 2)) % 4) + 4) % 4, [w, d] = G.fpDims(O[v.S.id], r); let spot = null;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const ax = Math.round(v.x - w / 2) + dx, az = Math.round(v.z - d / 2) + dz; if (m.canPlace(v.S.id, ax, az, r)) { spot = [ax, az]; break; } }
    if (!spot) { if (v.S.kind !== 'ground') return stow(p, v); G.ui.toast('Pas de place pour garer ici.'); G.sfx('error'); return; }
    m.addObj(v.S.id, spot[0], spot[1], r, { v: v.v }); leave(p, v); let sx = v.x + Math.cos(v.h) * 1.1, sz = v.z - Math.sin(v.h) * 1.1; if (v.S.kind !== 'ground') { const s = landNear(m, v.x, v.z); if (s) { sx = s[0]; sz = s[1]; } }
    p.teleport(sx, sz, v.h); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true); G.sfx('place', .5); }
  function anim(p, v, dt) { const a = v.anim; if (!a) return false; const D = a.k === 'in' ? .45 : .35; a.t += dt; const u = Math.min(1, a.t / D), b = u - 1, s = a.k === 'in' ? 1 + 2.70158 * b * b * b + 1.70158 * b * b : 1 - u * u;
    v.mesh.scale.setScalar(Math.max(.01, s)); if (a.k === 'out') v.spd = 0; if (u >= 1) { if (a.k === 'in') { v.anim = null; v.mesh.scale.setScalar(1); } else { stowDone(p, v); return true; } } return false; }
  // le pilote, assis au bon endroit sur son véhicule
  function seatRider(p, v, dt, extra) { const S = v.S, st = G.seatWorld(v.mesh, S.id, v.v, 0), C = p.C, q = POSE[st ? st.pose : 'moto'];
    p.yaw = v.h; p.vx = p.vz = p.vy = 0; p.onGround = true; p.swim = false; p.animate(dt, 0); if (p.toolMesh) p.toolMesh.visible = false; p.blob.visible = false;
    if (S.id === 'skate') { G.clearPose && G.clearPose(C); C.legL.rotation.x = -.25; C.legR.rotation.x = .2; C.armL.rotation.z = -1.0 - v.lean; C.armR.rotation.z = 1.0 - v.lean; C.armL.rotation.x = C.armR.rotation.x = 0; C.body.position.y = -.08; C.body.rotation.x = .1;
      p.x = st.pos.x; p.z = st.pos.z; p.y = st.pos.y; p.root.position.set(p.x, p.y, p.z); p.root.rotation.set(0, v.h - PI / 2, -v.lean * .6, 'YXZ'); return; }
    if (q) G.applyPose(C, q); if (extra) extra(C);
    p.x = st.pos.x; p.z = st.pos.z; p.y = st.pos.y - hipY(q); p.root.position.set(p.x, p.y, p.z); p.root.quaternion.copy(st.q); }

  // ---------- conduite au sol : vélo, skate, cheval, voiturette ----------
  function updGround(p, v, dt) { const S = v.S, I = G.input, m = G.map, free = G.ui.canPlay(); let gas = 0, steer = 0;
    if (free && !v.anim) { if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1; if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1;
      if (I.gp && I.gp.on) { steer += I.gp.lx; gas -= I.gp.ly; if (I.gp.b[7]) gas += 1; if (I.gp.b[6]) gas -= 1; } if (I.touch) { steer += I.touch.mx; gas -= I.touch.my; } steer = G.clamp(steer, -1, 1); gas = G.clamp(gas, -1, 1);
      for (let g = 0; g < S.tiers.length; g++) if (I.hit('Digit' + (g + 1), 'Numpad' + (g + 1)) && v.gear !== g) { v.gear = g; G.sfx('ui'); G.ui.toast(S.tiers[g][0]); }
      if (I.hit('Space')) { if (S.jump && !v.air) { v.vy = S.jump; v.air = true; v.spd = Math.max(v.spd, S.id === 'cheval' ? 4 : v.spd); G.sfx('jump', .5); if (S.id === 'cheval') HORN.neigh(.6); } else if (S.space && S.space !== 'jump') honk(S.id); }
      if (I.hit('KeyZ') || I.chars.veh) { I.chars.veh = false; stow(p, v); } if (I.hit('KeyE')) { park(p, v); if (!p.vehicle) return; } }
    if (anim(p, v, dt)) return; if (v.anim) { gas = 0; steer = 0; }
    const max = S.tiers[v.gear][1], target = gas > 0 ? max * gas : gas < 0 ? (v.spd > .5 ? 0 : -2.2) : 0, acc = gas < 0 && v.spd > .5 ? 14 : S.acc + v.gear * 1.2;
    if (!v.air) v.spd += G.clamp(target - v.spd, -acc * dt * (gas ? 1 : .7), acc * dt);
    v.h -= steer * S.turn * G.clamp(Math.abs(v.spd) / 3, .3, 1) / (1 + Math.abs(v.spd) * .04) * dt * (v.spd < -.1 ? -1 : 1);
    const dir = v.spd >= 0 ? 1 : -1, aspd = Math.abs(v.spd), fx = Math.sin(v.h), fz = Math.cos(v.h), nx = v.x + fx * v.spd * dt, nz = v.z + fz * v.spd * dt;
    if (fits(m, S, nx, nz, v.h, v.y, v.air)) { v.x = nx; v.z = nz; }
    else if (!v.air && aspd > 1 && S.hop) { const la = (1.0 + aspd * dt) * dir, top = obstacle(m, v.x + fx * la, v.z + fz * la), lx = v.x + fx * (la + 1.1 * dir), lz = v.z + fz * (la + 1.1 * dir), lg = ground(m, lx, lz);
      if (top <= v.y + (S.jump ? 1.6 : 1.0) && lg !== null && lg <= top + .2 && fits(m, S, lx, lz, v.h, lg, false)) { v.vy = Math.sqrt(2 * 22 * (top - v.y + .55)); v.air = true; G.sfx('jump', .4); }
      else slide(); }
    else if (!v.air) slide(); else v.spd *= .97;
    function slide() { const ax = fits(m, S, nx, v.z, v.h, v.y, false), az = fits(m, S, v.x, nz, v.h, v.y, false), cx = Math.abs(fx), cz = Math.abs(fz), alongX = ax && cx > .25 && (!az || cz <= .25 || cx >= cz);
      if (alongX || (az && cz > .25)) { if (alongX) v.x = nx; else v.z = nz; v.spd *= Math.pow(.55, dt); } else { v.h += (steer ? -Math.sign(steer) : 1) * 2.2 * dt; if (aspd > 6) { G.cam.shake && G.cam.shake(.2); G.sfx('hurt', .3); } v.spd *= Math.pow(.2, dt); } }
    const gy = ground(m, v.x, v.z);
    if (v.air || gy === null || gy < v.y - .08) { v.air = true; v.vy -= 22 * dt; v.y += v.vy * dt;
      if (gy !== null && v.y <= gy && v.vy <= 0) { v.y = gy; v.vy = 0; v.air = false; G.sfx('land', .5); G.fx.puff(v.x, gy + .05, v.z, 6, 0xf3ead2, .5); }
      else if (gy === null && v.vy < 0 && v.y < m.waterSurf(Math.floor(v.x), Math.floor(v.z)) + .1) { const s0 = v.safe || { x: v.x, z: v.z, y: 0 }; v.x = s0.x; v.z = s0.z; v.y = s0.y; v.vy = 0; v.spd = 0; v.air = false; G.sfx('splash', .6); G.ui.toast('Plouf ! Retour sur la rive.'); } }
    else { v.vy = 0; v.y = gy; if ((v.safeT = (v.safeT || 0) + dt) > .3) { v.safeT = 0; v.safe = { x: v.x, z: v.z, y: v.y }; } }
    v.lean += (-steer * G.clamp(Math.abs(v.spd) / 8, 0, 1) * .3 * (S.lean || 0) - v.lean) * Math.min(1, 6 * dt);
    const M = v.mesh; M.position.set(v.x, v.y, v.z); M.rotation.set(-v.lean, v.h - PI / 2, S.id === 'cheval' ? Math.sin(v.t * 9) * .03 * Math.min(1, aspd / 6) : 0);
    const P = v.P; if (P.w) { const sp = v.spd * dt / (S.id === 'velo' ? .33 : .28); for (const w of P.w) w.rotation.z -= sp; }
    let extra = null;
    if (P.legs) { v.gait = (v.gait || 0) + dt * (2 + aspd * 1.05); const g = v.gait, k = Math.min(1, aspd / 2.5), amp = v.air ? .6 : .45 + .25 * Math.min(1, aspd / 10);
      P.legs.forEach((L, i) => { const ph = i === 0 || i === 3 ? 0 : PI; L.rotation.z = v.air ? (i < 2 ? .7 : -.6) : Math.sin(g + ph + (i > 1 ? .4 : 0)) * amp * k; });
      if (!v.air && aspd > 1 && (v.clop = (v.clop || 0) - dt) < 0) { v.clop = G.clamp(2.2 / (aspd + 1), .12, .5); HORN.clop(Math.min(1, aspd / 6) * .9); }
      const bounce = !v.air ? Math.abs(Math.sin(v.gait)) * .06 * Math.min(1, aspd / 4) : 0; M.position.y += bounce; }
    if (S.id === 'velo') { v.ped = (v.ped || 0) + v.spd * dt * 2.2; extra = C => { C.legL.rotation.x = -1.1 + Math.sin(v.ped) * .38; C.legR.rotation.x = -1.1 - Math.sin(v.ped) * .38; }; }
    seatRider(p, v, dt, extra);
    if (S.id === 'voiturette' && Math.abs(v.spd) > .5 && (v.puff = (v.puff || 0) - dt) < 0) { v.puff = .14; G.fx.one(v.x - fx * 1.05, v.y + .35, v.z - fz * 1.05, -fx * .4, .3, -fz * .4, 2.2, -.02, 0xd9d9d9, .1, .8); }
    if (S.id === 'skate' && !v.air && aspd > 2 && (v.puff = (v.puff || 0) - dt) < 0) { v.puff = .2; G.fx.one(v.x, v.y + .05, v.z, 0, .2, 0, .5, 0, 0xf3ead2, .06, .5); }
    if (ENG.on) ENG.set(.3 + aspd / max, .02 + Math.min(.045, aspd * .004));
    hudSet(v, S.ico + ' <b>' + Math.round(aspd * 7) + ' km/h</b>' + (S.tiers.length > 1 ? ' · ' + S.tiers[v.gear][0] : '') + '<br><span style="font-size:12px;opacity:.85">' + (S.tiers.length > 1 ? '1 2 3 : allures · ' : '') + (S.jump ? 'Espace : sauter · ' : S.space ? 'Espace : ' + (S.space === 'bell' ? 'sonnette' : 'klaxon') + ' · ' : '') + 'W : ranger · E : garer</span>'); }

  // ---------- vol : hélicoptère, tapis volant ----------
  function updFly(p, v, dt) { const S = v.S, I = G.input, m = G.map, free = G.ui.canPlay(); let gas = 0, steer = 0, up = 0;
    if (free && !v.anim) { if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1; if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1; if (I.down('Space')) up += 1; if (I.down('ShiftLeft', 'ShiftRight', 'KeyC')) up -= 1;
      if (I.gp && I.gp.on) { steer += I.gp.lx; gas -= I.gp.ly; if (I.gp.b[0]) up += 1; if (I.gp.b[1]) up -= 1; } if (I.touch) { steer += I.touch.mx; gas -= I.touch.my; } steer = G.clamp(steer, -1, 1); gas = G.clamp(gas, -1, 1);
      if (I.hit('KeyZ') || I.chars.veh) { I.chars.veh = false; v.stowing = true; v.landing = true; } if (I.hit('KeyE')) { v.landing = !v.landing; G.ui.toast(v.landing ? 'Atterrissage…' : 'On repart !'); } }
    if (anim(p, v, dt)) return;
    const gy = Math.max(m.topAt(v.x, v.z), m.isWaterAt(v.x, v.z) ? m.waterSurf(Math.floor(v.x), Math.floor(v.z)) : -99), floor = gy + (v.landing ? 0 : S.hover);
    if (v.landing) { up = -1; gas = 0; } const vyT = up * S.climb; v.vy += (vyT - v.vy) * Math.min(1, 3 * dt); v.y += v.vy * dt; if (v.y < floor) { v.y = floor; v.vy = Math.max(0, v.vy); } if (v.y > gy + 40) v.y = gy + 40;
    const onGround = v.y - gy < .06, target = onGround && S.id === 'helico' ? 0 : gas > 0 ? S.max * gas : gas < 0 ? -S.max * .35 : 0;
    v.spd += G.clamp(target - v.spd, -6 * dt, 3.5 * dt); v.h -= steer * 1.9 * dt;
    const fx = Math.sin(v.h), fz = Math.cos(v.h), nx = G.clamp(v.x + fx * v.spd * dt, 3, m.W - 3), nz = G.clamp(v.z + fz * v.spd * dt, 3, m.H - 3);
    if (m.topAt(nx + fx * .8, nz + fz * .8) < v.y + .3 && m.topAt(nx, nz) < v.y + .3) { v.x = nx; v.z = nz; } else { v.spd *= .3; if (!v.landing) v.vy = Math.max(v.vy, 2.5); }
    if (v.landing && onGround) { if (v.stowing) { v.stowing = false; v.landing = false; return stow(p, v); } if (!m.isWaterAt(v.x, v.z)) { v.landing = false; park(p, v); if (!p.vehicle) return; } else { v.landing = false; G.ui.toast('Pas sur l\'eau ! Trouve la terre ferme.'); } }
    const M = v.mesh, sn = v.spd / S.max; M.position.set(v.x, v.y, v.z);
    if (S.id === 'helico') { v.rpm = (v.rpm || 0) + ((onGround && !gas && !up ? .35 : 1) - (v.rpm || 0)) * Math.min(1, dt * 1.5); M.rotation.set(-steer * .18 * Math.min(1, Math.abs(sn) + .3), v.h - PI / 2, -sn * .2); v.P.rot.rotation.y += dt * 28 * v.rpm; v.P.tail.rotation.z += dt * 40 * v.rpm;
      if (v.y - gy < 4 && (v.dust = (v.dust || 0) - dt) < 0) { v.dust = .06; const a = Math.random() * TAU; G.fx.one(v.x + Math.cos(a) * 1.6, gy + .1, v.z + Math.sin(a) * 1.6, Math.cos(a) * 2, .3, Math.sin(a) * 2, .7, 0, m.isWaterAt(v.x, v.z) ? 0xffffff : 0xe8dcc0, .14, .9); }
      ENG.set(v.rpm * (1 + Math.abs(sn) * .4), .03 + v.rpm * .03); }
    else { M.rotation.set(-steer * .15, v.h - PI / 2, -sn * .08 + Math.sin(v.t * 1.3) * .03); v.P.seg.forEach((s, i) => { s.position.y = .05 + Math.sin(v.t * 3.2 - i * .9) * (.04 + Math.abs(sn) * .05); s.rotation.z = Math.cos(v.t * 3.2 - i * .9) * .12; });
      if ((v.spark = (v.spark || 0) - dt) < 0) { v.spark = .05; G.fx.one(v.x - fx * 1.1 + (Math.random() - .5) * .8, v.y + .05, v.z - fz * 1.1 + (Math.random() - .5) * .8, (Math.random() - .5) * .3, .1, (Math.random() - .5) * .3, .9, -.2, [0xffd23f, 0xff8fc0, 0x9fdcff, 0xffffff][Math.floor(Math.random() * 4)], .12, 1); } }
    seatRider(p, v, dt);
    hudSet(v, S.ico + ' <b>' + Math.round(Math.abs(v.spd) * 7) + ' km/h</b> · ' + Math.max(0, Math.round(v.y - gy)) + ' m<br><span style="font-size:12px;opacity:.85">Espace / Maj : monter · descendre · E : atterrir · W : ranger</span>'); }

  // ---------- sur l'eau : jet-ski ----------
  const waterOk = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return false; const i = m.idx(tx, tz); if (!m.water[i]) return false; const o = m.occ[i] ? m.objs[m.occ[i] - 1] : null; return !o || o.t === 'pont' || O[o.t].veh2; };
  function updSea(p, v, dt) { const S = v.S, I = G.input, m = G.map, free = G.ui.canPlay(); let gas = 0, steer = 0;
    if (free && !v.anim) { if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1; if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1;
      if (I.gp && I.gp.on) { steer += I.gp.lx; gas -= I.gp.ly; } if (I.touch) { steer += I.touch.mx; gas -= I.touch.my; } steer = G.clamp(steer, -1, 1); gas = G.clamp(gas, -1, 1);
      if (I.hit('Space')) honk(S.id); if (I.hit('KeyZ') || I.chars.veh) { I.chars.veh = false; stow(p, v); } if (I.hit('KeyE')) { if (Math.abs(v.spd) > 2) G.ui.toast('Ralentis pour accoster.'); else { const s = landNear(m, v.x, v.z); if (!s || Math.hypot(s[0] - v.x, s[1] - v.z) > 3.5) G.ui.toast('Approche-toi d\'une rive pour descendre.'); else return stow(p, v); } } }
    if (anim(p, v, dt)) return;
    const target = gas > 0 ? S.max * gas : gas < 0 ? -S.max * .3 : 0; v.spd += G.clamp(target - v.spd, -S.acc * 1.5 * dt, S.acc * dt); v.h -= steer * S.turn * G.clamp(Math.abs(v.spd) / 3, .35, 1) * dt * (v.spd < -.1 ? -1 : 1);
    const fx = Math.sin(v.h), fz = Math.cos(v.h), nx = v.x + fx * v.spd * dt, nz = v.z + fz * v.spd * dt;
    if (waterOk(m, nx + fx * .9, nz + fz * .9) && waterOk(m, nx, nz) && waterOk(m, nx - fx * .8, nz - fz * .8)) { v.x = nx; v.z = nz; } else { if (Math.abs(v.spd) > 3) { G.cam.shake && G.cam.shake(.2); G.sfx('splash', .4); } v.spd *= -.25; }
    const ws = m.waterSurf(Math.floor(v.x), Math.floor(v.z)); if (Math.abs(v.spd) > 9 && !v.air && Math.random() < dt * .8) { v.air = true; v.vy = 3 + Math.random() * 2; G.sfx('splash', .5); }
    if (v.air) { v.vy -= 14 * dt; v.y += v.vy * dt; if (v.y <= ws - .05) { v.y = ws - .05; v.air = false; G.fx.burst(v.x, ws, v.z, 14, [0xffffff, 0x9fdcff], 3, .5, 4); } } else v.y += (ws - .05 + Math.sin(v.t * 3) * .04 - v.y) * Math.min(1, 8 * dt);
    v.lean += (-steer * G.clamp(Math.abs(v.spd) / 8, 0, 1) * .35 - v.lean) * Math.min(1, 5 * dt);
    const M = v.mesh; M.position.set(v.x, v.y, v.z); M.rotation.set(-v.lean, v.h - PI / 2, -G.clamp(v.spd / S.max, -1, 1) * .1 + (v.air ? .15 : 0));
    if (Math.abs(v.spd) > 1 && (v.wake = (v.wake || 0) - dt) < 0) { v.wake = .03; for (const s of [-1, 1]) G.fx.one(v.x - fx * 1.0 + fz * s * .3, ws + .05, v.z - fz * 1.0 - fx * s * .3, -fx * .8 + fz * s * 1.2, 1.2, -fz * .8 - fx * s * 1.2, .5, 4, 0xffffff, .12, 1); }
    seatRider(p, v, dt); ENG.set(.3 + Math.abs(v.spd) / S.max, .025 + Math.min(.05, Math.abs(v.spd) * .004));
    hudSet(v, S.ico + ' <b>' + Math.round(Math.abs(v.spd) * 7) + ' km/h</b><br><span style="font-size:12px;opacity:.85">Espace : klaxon · E : accoster · W : ranger</span>'); }

  // ---------- passager : on monte dans le véhicule d'un ami ----------
  const ST = {};
  function friendVehicles() { const net = G.net, out = []; if (!net || !net.online()) return out; for (const q of net.peersHere()) { const pr = q.pr, vh = pr.vh, a = net.av.get(q.id); if (!vh || !a || !a.veh || !a.veh.visible || !seatList(vh.g, vh.v)) continue; out.push({ q, pr, vh, a }); } return out; }
  function freeSeat(f) { const L = seatList(f.vh.g, f.vh.v), used = new Set(); for (const q of G.net.peersHere()) if (q.pr.rd && q.pr.rd.i === f.pr.pid) used.add(q.pr.rd.s); for (let k = 1; k < L.length; k++) if (!used.has(k)) return k; return -1; }
  G.nearFriendVehicle = () => { const p = G.player; if (!p || p.vehicle || p.sit || p.swim) return null; let best = null, bd = 2.8; for (const f of friendVehicles()) { const P0 = f.a.veh.position, d = Math.hypot(P0.x - p.x, P0.z - p.z); if (d < bd && Math.abs(P0.y - p.y) < 3) { bd = d; best = f; } } return best; };
  function hopOn(f) { const p = G.player, k = freeSeat(f); if (k < 0) { G.ui.toast('Plus de place dans ce véhicule !'); G.sfx('error'); return; }
    p.fish && G.act.stopFish(); p.emote = null; p.sit = null; p.vehicle = { pass: 1, pid: f.pr.pid, seat: k, g: f.vh.g, gv: f.vh.v | 0, n: f.pr.n || 'ton ami', miss: 0, t: 0, x: p.x, z: p.z, y: p.y };
    p.root.rotation.order = 'XYZ'; G.sfx('pop'); G.ui.toast('🪑 Tu montes avec ' + (f.pr.n || 'ton ami') + ' ! E pour descendre.', 4500); }
  function hopOff(p) { const v = p.vehicle; if (!v || !v.pass) return; p.vehicle = null; G.clearPose && G.clearPose(p.C); p.root.quaternion.identity(); p.root.rotation.set(0, p.yaw, 0); p.blob.visible = true; p.root.visible = true; if (p.toolMesh) p.toolMesh.visible = true;
    const m = G.map, s = landNear(m, p.x, p.z) || [p.x, p.z]; p.teleport(s[0], s[1], p.yaw); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true); G.sfx('land', .5); }
  // le véhicule qui porte un passager (chez moi : le mien si je conduis ; sinon celui de l'ami)
  const driverMesh = pid => { const net = G.net; if (!net) return null; if (pid === net.ses) { const v = G.player.vehicle; return v && v.mesh ? { mesh: v.mesh, g: v.vg ? v.vg[0] : v.moto ? 'moto' : v.boat2 || v.boat ? 'boat' : v.plane2 ? 'avion' : v.o && O[v.o.t] ? O[v.o.t].model : null, v: v.vg ? v.vg[1] : v.v || 0 } : null; }
    for (const q of net.peers.values()) if (q.pr && q.pr.pid === pid) { const a = net.av.get(q.id); if (a && a.veh && a.veh.visible && q.pr.vh) return { mesh: a.veh, g: q.pr.vh.g, v: q.pr.vh.v | 0 }; } return null; };
  G.passengerSeat = rd => { if (!rd || typeof rd.i !== 'string') return null; const d = driverMesh(rd.i); if (!d || !d.g) return null; return G.seatWorld(d.mesh, d.g, d.v, rd.s | 0, {}); };
  function updPass(p, v, dt) { const I = G.input, free = G.ui.canPlay(); v.t += dt;
    if (free && (I.hit('KeyE') || I.hit('KeyZ'))) return hopOff(p);
    const st = G.passengerSeat({ i: v.pid, s: v.seat }); if (!st) { if ((v.miss += dt) > 1.2) { G.ui.toast(v.n + ' est descendu·e : tu mets pied à terre.'); hopOff(p); } return; } v.miss = 0;
    const C = p.C, q = POSE[st.pose]; p.animate(dt, 0); p.vx = p.vz = p.vy = 0; p.onGround = true; p.swim = false; if (p.toolMesh) p.toolMesh.visible = false; p.blob.visible = false;
    if (q) G.applyPose(C, q); else { G.clearPose && G.clearPose(C); C.armL.rotation.x = C.armR.rotation.x = -.5; }
    p.x = st.pos.x; p.z = st.pos.z; p.y = st.pos.y - hipY(q); p.root.position.set(p.x, p.y, p.z); p.root.quaternion.copy(st.q); const e = new THREE.Euler().setFromQuaternion(st.q, 'YXZ'); p.yaw = e.y; }
  G.rideState = () => { const v = G.player && G.player.vehicle; return v && v.pass ? { i: v.pid, s: v.seat } : null; };

  // ---------- garage de poche (W) ----------
  const LIST = ['moto', 'velo', 'skate', 'cheval', 'voiturette', 'helico', 'tapis', 'jetski'], ICO = { moto: '🏍️' };
  const owned = () => LIST.filter(id => G.mode === 'creatif' || G.inv.count(id) > 0);
  const GAR = G.garage = { last: 'velo', el: null };
  const css = document.createElement('style'); css.textContent = `#garage{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:55;background:rgba(255,248,230,.97);border-radius:22px;box-shadow:0 5px 0 #e3cfa3,0 14px 34px rgba(0,0,0,.28);padding:10px 12px 8px;font-family:var(--f-display);max-width:94vw}
#garage .t{font-size:15px;color:#6b4a2a;text-align:center;margin-bottom:6px}#garage .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}#garage button{border:none;background:#fff;border-radius:14px;box-shadow:0 3px 0 #ead9b4;width:74px;padding:6px 4px;font-family:inherit;color:#4a3320;font-size:12px}
#garage button .i{display:block;font-size:30px;line-height:1.15}#garage button.on{box-shadow:0 0 0 3px #e8a23a,0 3px 0 #b97a14}#garage button .k{display:block;font-size:11px;opacity:.6}`; document.head.appendChild(css);
  GAR.close = () => { if (GAR.el) { GAR.el.remove(); GAR.el = null; } if (G.ui.modal === 'garage') G.ui.modal = null; };
  GAR.summon = id => { GAR.close(); const p = G.player, m = G.map; if (!p || p.vehicle || p.swim || p.sit || p.dead || m.interior) return; GAR.last = id; G.store && G.store.set('dv_garage_last', id);
    if (id === 'moto') return G.motoDeploy && G.motoDeploy(); const S = VEH[id]; if (G.mode !== 'creatif' && G.inv.count(id) < 1) { G.ui.toast('Il te faut un·e ' + S.n.toLowerCase() + ' dans ton inventaire.'); return; }
    let x = p.x, z = p.z, y = null;
    if (S.kind === 'sea') { let best = null, bd = 9; const [fx, fz] = p.facing(); for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const tx = Math.floor(p.x + fx * 2) + dx, tz = Math.floor(p.z + fz * 2) + dz, cx = tx + .5, cz = tz + .5; if (!waterOk(m, cx, cz) || !waterOk(m, cx + 1, cz) || !waterOk(m, cx - 1, cz) || !waterOk(m, cx, cz + 1) || !waterOk(m, cx, cz - 1)) continue; const d = Math.hypot(cx - p.x, cz - p.z); if (d < bd) { bd = d; best = [cx, cz]; } }
      if (!best) { G.ui.toast('🌊 Il faut de l\'eau assez large juste devant toi.'); G.sfx('error'); return; } x = best[0]; z = best[1]; }
    else if (!p.onGround) return;
    if (G.mode !== 'creatif') G.inv.remove(id, 1); ride(S, G.store ? (G.store.get('dv_col_' + id, 0) | 0) : 0, x, z, p.yaw, true, y); };
  GAR.open = () => { const p = G.player; if (!p || G.ui.modal || p.dead || G.map.interior) return; const L = owned();
    if (!L.length) { G.ui.toast('Ton garage est vide : fabrique ou achète un véhicule (vélo, cheval, voiturette…).'); G.sfx('error'); return; }
    if (L.length === 1) return GAR.summon(L[0]); const last = L.includes(GAR.last) ? GAR.last : L[0];
    const el = GAR.el = document.createElement('div'); el.id = 'garage'; el.innerHTML = '<div class="t">🅿️ Garage de poche — clique, ou appuie sur un chiffre (W à nouveau : ' + (ICO[last] || VEH[last].ico) + ')</div><div class="row">' + L.map((id, i) => '<button data-v="' + id + '" class="' + (id === last ? 'on' : '') + '"><span class="i">' + (ICO[id] || VEH[id].ico) + '</span>' + (id === 'moto' ? 'Moto' : VEH[id].n) + '<span class="k">' + (i + 1) + '</span></button>').join('') + '</div>';
    document.body.appendChild(el); G.ui.modal = 'garage'; el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => GAR.summon(b.dataset.v)); G.sfx('open'); };
  document.addEventListener('keydown', e => { if (!GAR.el) return; const L = owned(), last = L.includes(GAR.last) ? GAR.last : L[0];
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); GAR.close(); } else if (e.code === 'KeyZ') { e.preventDefault(); GAR.summon(last); } else if (/^Digit[1-9]$/.test(e.code)) { const id = L[+e.code.slice(5) - 1]; if (id) { e.preventDefault(); GAR.summon(id); } } }, true);
  try { const s = G.store && G.store.get('dv_garage_last', null); if (s) GAR.last = s; } catch (e) { }

  // ---------- branchements ----------
  G.on('init', () => {
    const F = G.feat, ob = F.board; F.board = o => O[o.t] && O[o.t].veh2 ? mountObj(o) : ob(o);
    const ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (v && v.pass) return updPass(p, v, dt); if (!v || !v.veh2) return ou(p, dt); dt = Math.min(dt, .05); v.t += dt;
      if (v.S.kind === 'fly') return updFly(p, v, dt); if (v.S.kind === 'sea') return updSea(p, v, dt); return updGround(p, v, dt); };
    // E à côté du véhicule d'un ami : on monte comme passager
    const oi = G.act.interact; G.act.interact = () => { if (G.player && G.player.vehicle) return; const f = G.nearFriendVehicle(); if (f && !G.ents.villagerInFront(G.player)) return hopOn(f); return oi(); };
    const og = G.toTitle; G.toTitle = () => { G.vehLeave(); return og(); };
    const os = G.serialize; G.serialize = () => { const p = G.player, v = p && p.vehicle; if (v && v.pass) { p.vehicle = null; try { return os(); } finally { p.vehicle = v; } } return os(); };
    // bouton tactile 🅿️
    const tk = document.getElementById('tb-take'); if (tk && !document.getElementById('tb-garage')) { const b = tk.cloneNode(false); b.id = 'tb-garage'; b.textContent = '🅿️'; b.title = 'Garage de poche'; b.style.right = '350px';
      b.addEventListener('pointerdown', e => { e.preventDefault(); const p = G.player; if (p.vehicle && p.vehicle.veh2) G.input.chars.veh = true; else if (p.vehicle && p.vehicle.moto) G.input.chars.moto = true; else GAR.open(); }); tk.parentNode.appendChild(b); }
  });
  G.on('load', () => { GAR.close(); }); G.on('newGame', () => { GAR.close(); });
  // les autres joueurs : leur klaxon s'entend, leur hélice tourne
  G.remoteVeh = (a, pr, dt) => { if (!a.veh || !pr.vh) return; const p = G.player, d = Math.hypot(a.veh.position.x - p.x, a.veh.position.z - p.z);
    if (Array.isArray(pr.hk) && pr.hk[0] !== a.hk) { const fresh = a.hk !== undefined; a.hk = pr.hk[0]; if (fresh && d < 35 && Date.now() - pr.hk[0] < 4000) HORN[hornOf(pr.hk[1])](Math.max(.15, 1 - d / 35)); }
    if (pr.vh.g === 'helico') { if (!a.rot) { a.rot = new THREE.Mesh(G.getGeo('helico_rotor'), G.MATS); a.rot.frustumCulled = false; a.rot.position.set(0, 2.04, 0); a.veh.add(a.rot); a.veh.geometry = G.getGeo('helico_corps', pr.vh.v | 0); } a.rot.rotation.y += dt * 25; } };
})();
