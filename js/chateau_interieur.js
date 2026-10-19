'use strict';
// ===== Intérieur des châteaux classiques à la française : les pièces suivent vraiment l'extérieur =====
// Chaque pavillon, corps de logis, avant-corps ou aile du château (seul ou assemblé) devient une pièce, à la même place et dans les mêmes
// proportions, avec ses fenêtres exactement là où elles sont sur la façade : plus le château est grand, plus il y a de pièces.
// Entre les pièces, de grandes arches ouvertes en enfilade. Murs épais à embrasures et volets intérieurs, boiseries à filets dorés,
// pilastres, corniches à denticules, portes-fenêtres cintrées à petits bois, rideaux de velours à embrasses, appliques, glaces, tableaux,
// parquets Versailles et marbre, lustres. Le soleil entre vraiment par les fenêtres (ombres des petits bois sur le parquet), avec des
// rayons et de la poussière dorée, longs et chauds au lever et au coucher. Les murs entre la caméra et le joueur s'abaissent (comme dans
// les Sims) mais gardent leur ombre. Le plan se modifie avec la touche H (chateau_plan.js). =====
(function () {
  const PI = Math.PI, TAU = PI * 2, O = G.OBJ, GOLD = 0xd9b04a, VER = 5, KS = 3.3, RL = 17, RD = 28, KEEP = ['v', 'f', 'g', 'iid', 'off', 'txt'];
  const VOID = 0, WALL = 1, FLOOR = 2, OPEN = 3, DOOR = 4, NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const SK = () => G.SK || {}, CAM = { pitch: .9, dist: 15, ty: 1.2, fx: 1, fz: 1, fy: 1, dz: -1.7 }, GAP = .08; // GAP : le plancher d'un étage est posé juste au-dessus du plafond de celui du dessous
  // ---------- décors ----------
  const PAINTS = { peinture_ivoire: [0xf7f3ea, 'Blanc ivoire'], peinture_lin: [0xf1ebe0, 'Lin'], peinture_or: [0xead9a8, 'Jaune Louis XV'], peinture_sauge: [0xc9d4c2, 'Vert sauge'],
    peinture_bleu: [0xbfcad6, 'Bleu Trianon'], peinture_rose: [0xead2cf, 'Rose poudré'], peinture_rouge: [0x7c2c30, 'Rouge Pompadour'], peinture_empire: [0x3f5a4a, 'Vert Empire'], peinture_nuit: [0x2c3548, 'Bleu nuit'] };
  const FLOORK = { chevrons_chene: 1, batons_rompus: 2, damier_marbre: 3, chevrons_noyer: 4, batons_noyer: 5 };
  const CURT = { rouge: [0x8a2f3a, 'Velours rouge'], bleu: [0x2f4a8a, 'Velours bleu roi'], vert: [0x2f5a3f, 'Velours vert Empire'], or: [0xc9a23a, 'Damas or'], rose: [0xd98a9a, 'Soie rose'],
    lin: [0xe8dcc0, 'Lin écru'], voile: [0xf6f4ee, 'Voilage blanc'], aucun: [0, 'Sans rideaux'] };
  const WSTY = { cintree: 'Porte-fenêtre cintrée', pf: 'Porte-fenêtre', fen: 'Fenêtre à allège', oeil: 'Œil-de-bœuf' };
  const OPS = { a: 'Grande arche ouverte', p: 'Double porte', o: 'Passage' };
  const LUS = ['lustre_versailles', 'lustre_cristal', 'lustre_bougies', 'lustre_cascade', 'lustre_murano', 'lustre_tulipes', 'lustre_globe', 'lustre_anneaux', 'lustre_lanterne'];
  const KIND = { salon: ['Grand salon', 'peinture_ivoire', 'damier_marbre', 'rouge', 'lustre_versailles'], galerie: ['Galerie des Glaces', 'peinture_lin', 'chevrons_chene', 'or', 'lustre_cristal'],
    manger: ['Salle à manger', 'peinture_sauge', 'batons_noyer', 'vert', 'lustre_bougies'], biblio: ['Bibliothèque', 'peinture_empire', 'chevrons_noyer', 'or', 'lustre_lanterne'],
    chambre: ['Chambre du Roi', 'peinture_bleu', 'batons_rompus', 'bleu', 'lustre_murano'], musique: ['Salon de musique', 'peinture_or', 'chevrons_chene', 'rouge', 'lustre_cascade'],
    reine: ['Chambre de la Reine', 'peinture_rose', 'batons_rompus', 'rose', 'lustre_tulipes'], cabinet: ['Cabinet', 'peinture_nuit', 'chevrons_noyer', 'or', 'lustre_globe'],
    anti: ['Antichambre', 'peinture_lin', 'marbre', 'lin', 'lustre_anneaux'], vestibule: ['Hall d’honneur', 'pierre_taille', 'damier_marbre', 'aucun', 'lustre_versailles'],
    bal: ['Salle de bal', 'peinture_or', 'chevrons_chene', 'or', 'lustre_cristal'], chapelle: ['Chapelle', 'pierre_taille', 'dalles_ivoire', 'voile', 'lustre_bougies'],
    billard: ['Salle de billard', 'peinture_empire', 'chevrons_noyer', 'vert', 'lustre_lanterne'], boudoir: ['Boudoir', 'peinture_rose', 'batons_rompus', 'rose', 'lustre_tulipes'],
    jeux: ['Salon des jeux', 'peinture_bleu', 'chevrons_chene', 'bleu', 'lustre_globe'], palier: ['Palier d’honneur', 'peinture_ivoire', 'damier_marbre', 'rouge', 'lustre_versailles'],
    apparat: ['Salon d’apparat', 'peinture_or', 'chevrons_chene', 'rouge', 'lustre_cristal'], gardes: ['Salle des gardes', 'pierre_taille', 'pierre', 'rouge', 'lustre_anneaux'] };
  const ORDER2 = ['chambre', 'reine', 'biblio', 'boudoir', 'cabinet', 'musique', 'jeux', 'chambre', 'reine', 'billard', 'anti'];
  const ORDER = ['manger', 'chambre', 'biblio', 'musique', 'reine', 'cabinet', 'billard', 'boudoir', 'jeux', 'gardes', 'anti'];
  const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
  G.CHPLAN = { PAINTS, FLOORK, CURT, WSTY, OPS, LUS, KIND };

  // =====================================================================
  // ============ 1. LE PLAN : une grille de cases tirée de l'extérieur =====
  // =====================================================================
  // un étage (fl) : les mêmes murs que le rez-de-chaussée, sans les bâtiments moins hauts, sans porte ; des pièces différentes
  function genPlan0(info, etg) {
    const L0 = G.chateauFusion.layout(0, info.cols, info.rows), C = L0.C, wins = etg ? L0.wins.filter(w => w.B.nf > etg) : L0.wins, onW = G.chateauFusion.onW, n = info.cols * info.rows, BB = etg ? C.B.filter(B => B.nf > etg) : C.B;
    let ex0 = Infinity, ex1 = -Infinity, ez0 = Infinity, ez1 = -Infinity; for (const B of C.B) { ex0 = Math.min(ex0, B.x0); ex1 = Math.max(ex1, B.x1); ez0 = Math.min(ez0, B.z0); ez1 = Math.max(ez1, B.z1); }
    // la même échelle pour tous les châteaux, seuls ou assemblés : les pièces ont toujours la surface du bâtiment de pierre (sans les jardins ni la cour),
    // et plus le château est grand, plus il y a de pièces (seuls les palais immenses sont un peu resserrés)
    let k = KS; const ar = (ex1 - ex0) * (ez1 - ez0) * k * k; if (ar > 26000) k *= Math.sqrt(26000 / ar);
    const bw = Math.ceil((ex1 - ex0) * k), px = Math.max(1, Math.ceil((24 - bw) / 2)), W = bw + 2 * px, H = Math.ceil((ez1 - ez0) * k) + 2, N = W * H;
    const X = x => (x - ex0) * k + px, Z = z => (z - ez0) * k + 1, id = new Int16Array(N).fill(-1), at = (x, z) => x < 0 || z < 0 || x >= W || z >= H ? -1 : id[z * W + x];
    // chaque bloc est découpé en grandes pièces traversantes, d'une façade à l'autre (des fenêtres des deux côtés), longues de deux ou trois travées ;
    // l'avant-corps entier est le hall d'honneur (avec le grand escalier) ; une aile longue et étroite reste une galerie
    const parts = [], cuts = (L, m) => { const c = []; for (let s = 0; s <= m; s++) c.push(Math.round(s * L / m)); return c; }; let gals = 0;
    BB.forEach((B, bi) => { const x0 = Math.round(X(B.x0)), x1 = Math.round(X(B.x1)), z0 = Math.round(Z(B.z0)), z1 = Math.round(Z(B.z1)), w = x1 - x0, d = z1 - z0; if (w < 1 || d < 1) return;
      const push = (a, b, c, e, role) => parts.push({ bi, k: B.k, role, x0: x0 + a, x1: x0 + b, z0: z0 + c, z1: z0 + e });
      // un nombre impair de pièces côte à côte : le vestibule reste centré sur la porte (jamais une cloison juste derrière elle)
      if (B.k === 'centre') { const nc = Math.max(1, Math.round(w / 26)), zs = d >= 30 ? [0, Math.round(d * .56), d] : [0, d], xs = cuts(w, nc % 2 ? nc : nc + 1);
        for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) push(xs[i], xs[i + 1], zs[j], zs[j + 1], zs.length > 2 && j === 0 ? 'salon' : 'vest'); return; }
      const lg = Math.max(w, d), sh = Math.min(w, d), gal = lg / sh >= 2.3 && sh <= 14 && lg >= 20 && gals < 2; if (gal) gals++;
      const xs = cuts(w, gal && w >= d ? 1 : Math.max(1, Math.round(w / (w >= d ? RL : RD)))), zs = cuts(d, gal && d > w ? 1 : Math.max(1, Math.round(d / (d > w ? RL : RD))));
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) push(xs[i], xs[i + 1], zs[j], zs[j + 1], gal ? 'gal' : ''); });
    parts.forEach((P, i) => { for (let z = Math.max(0, P.z0); z < Math.min(H, P.z1); z++) for (let x = Math.max(0, P.x0); x < Math.min(W, P.x1); x++) id[z * W + x] = i; });
    // une pièce trop étroite (moins de 7 cases) rejoint sa voisine
    const rep = parts.map((_, i) => i), find = i => rep[i] === i ? i : (rep[i] = find(rep[i]));
    parts.forEach((P, i) => { if (Math.min(P.x1 - P.x0, P.z1 - P.z0) >= 7 || P.role === 'vest' || P.role === 'salon') return; const cnt = new Map();
      for (let z = P.z0; z < P.z1; z++) for (let x = P.x0; x < P.x1; x++) for (const [dx, dz] of NB4) { const q = at(x + dx, z + dz); if (q >= 0 && q !== i) cnt.set(q, (cnt.get(q) || 0) + 1); }
      let best = -1, bc = 0; for (const [q, c] of cnt) { if (parts[q].role === 'vest') continue; if (c > bc || (c === bc && parts[q].k === 'pav')) { best = q; bc = c; } } if (best >= 0) rep[find(i)] = find(best); });
    for (let i = 0; i < N; i++) if (id[i] >= 0) id[i] = find(id[i]);
    // murs : le tour du château et une cloison (une case d'épaisseur) entre deux pièces
    const T = new Uint8Array(N);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x, r = id[i]; if (r < 0) continue;
      const ext = at(x - 1, z) < 0 || at(x + 1, z) < 0 || at(x, z - 1) < 0 || at(x, z + 1) < 0, cl = at(x + 1, z) !== r || at(x, z + 1) !== r; T[i] = ext || cl ? WALL : FLOOR; }
    // numéros de pièces 1..n, et le rôle de chacune (vestibule, salon, galerie)
    const num = new Map(), Rg = new Uint8Array(N), role = {}; for (let i = 0; i < N; i++) if (T[i] === FLOOR) { const r = id[i]; if (!num.has(r)) num.set(r, num.size + 1); Rg[i] = num.get(r); }
    parts.forEach((P, i) => { const r = num.get(find(i)); if (!r || !P.role) return; const pr = { vest: 3, salon: 2, gal: 1 }; if (!role[r] || pr[P.role] > pr[role[r]]) role[r] = P.role; });
    const fl = (x, z) => x < 0 || z < 0 || x >= W || z >= H || T[z * W + x] !== FLOOR ? 0 : Rg[z * W + x];
    // une grande arche au milieu de chaque cloison entre deux pièces
    const pairs = new Map(); for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) { if (T[z * W + x] !== WALL) continue; const L = fl(x - 1, z), Rr = fl(x + 1, z), U = fl(x, z - 1), D = fl(x, z + 1);
      if (L && Rr && L !== Rr) { const key = Math.min(L, Rr) + '|' + Math.max(L, Rr) + '|v' + x; (pairs.get(key) || pairs.set(key, []).get(key)).push(z); }
      if (U && D && U !== D) { const key = Math.min(U, D) + '|' + Math.max(U, D) + '|h' + z; (pairs.get(key) || pairs.set(key, []).get(key)).push(x); } }
    const best = new Map(); for (const [key, list] of pairs) { list.sort((a, b) => a - b); let s = 0; for (let i = 1; i <= list.length; i++) if (i === list.length || list[i] !== list[i - 1] + 1) {
        const len = i - s, pr = key.split('|'), pk = pr[0] + '|' + pr[1]; if (!best.has(pk) || best.get(pk).len < len) best.set(pk, { len, a: list[s], o: pr[2][0], c: +pr[2].slice(1) }); s = i; } }
    for (const { len, a, o, c } of best.values()) { const ow = len >= 5 ? G.clamp(Math.round(len * .5), 3, Math.min(7, len - 2)) : len >= 3 ? len - 2 : len, s0 = a + Math.floor((len - ow) / 2);
      for (let j = s0; j < s0 + ow; j++) T[o === 'v' ? j * W + c : c * W + j] = OPEN; }
    // porte d'entrée : au milieu de l'avant-corps, sur la façade
    const D0 = C.D, dz = Math.round(Z(D0.z1)) - 1, dx0 = Math.round(X(0) - 1.5); let door = null;
    if (etg) { } else if (dz > 0 && [0, 1, 2].every(j => T[dz * W + dx0 + j] === WALL && fl(dx0 + j, dz - 1))) { for (let j = 0; j < 3; j++) T[dz * W + dx0 + j] = DOOR; door = { x0: dx0, x1: dx0 + 2, z: dz, sx: dx0 + 1.5, sz: dz - .7 }; }
    else { // repli : la place la plus proche du milieu sur la même façade, sinon sur la façade la plus basse (trois cases de mur, du parquet derrière, dehors devant)
      const okD = (x, z) => [0, 1, 2].every(j => T[z * W + x + j] === WALL && fl(x + j, z - 1) && (z + 1 >= H || id[(z + 1) * W + x + j] < 0));
      for (let dd = 0; dd <= 14 && !door && dz > 0 && dz < H; dd++) for (const x of dd ? [dx0 - dd, dx0 + dd] : [dx0]) if (!door && x > 0 && x + 2 < W && okD(x, dz)) door = { x0: x, x1: x + 2, z: dz };
      for (let z = H - 1; z > 0 && !door; z--) { let bx = -1; for (let x = 1; x + 2 < W; x++) if (okD(x, z) && (bx < 0 || Math.abs(x + 1.5 - W / 2) < Math.abs(bx + 1.5 - W / 2))) bx = x; if (bx >= 0) door = { x0: bx, x1: bx + 2, z }; }
      if (door) { for (let j = 0; j < 3; j++) T[door.z * W + door.x0 + j] = DOOR; door.sx = door.x0 + 1.5; door.sz = door.z - .7; } }
    // portes de côté, au bout des ailes : trois cases de façade devant la pièce (dans le même ordre que dehors)
    const doors = etg ? [] : [door]; for (const w of wins) { if (etg || !w.door || w.B === C.D || w.f !== 0) continue; const p = onW(w.B.H, w.f, w.a, 0, 0), z = Math.round(Z(w.B.z1)) - 1, xc = Math.floor(X(p[0])); let sd = null;
      for (let dd = 0; dd <= 7 && !sd; dd++) for (const x of dd ? [xc - 1 - dd, xc - 1 + dd] : [xc - 1]) if (!sd && x > 0 && x + 2 < W && [0, 1, 2].every(j => T[z * W + x + j] === WALL && fl(x + j, z - 1))) { for (let j = 0; j < 3; j++) T[z * W + x + j] = DOOR; sd = { x0: x, x1: x + 2, z, sx: x + 1.5, sz: z - .7 }; }
      doors.push(sd); }
    // fenêtres du rez-de-chaussée : exactement là où elles sont sur la façade
    const ww = G.clamp(C.sp * k * .6, 1.2, 1.9), wl = [];
    for (const w of wins) { if (w.door && !etg) continue; const B = w.B, p = onW(B.H, w.f, w.a, 0, 0), f = w.f;
      let cx, cz, nx = 0, nz = 0, uu; if (f === 0) { cz = Math.round(Z(B.z1)) - 1; uu = X(p[0]); nz = -1; } else if (f === 1) { cz = Math.round(Z(B.z0)); uu = X(p[0]); nz = 1; } else if (f === 2) { cx = Math.round(X(B.x1)) - 1; uu = Z(p[2]); nx = -1; } else { cx = Math.round(X(B.x0)); uu = Z(p[2]); nx = 1; }
      const good = s => { const x = nz ? s : cx, z = nz ? cz : s; if (x < 0 || z < 0 || x >= W || z >= H || T[z * W + x] !== WALL) return 0; const inn = fl(x + nx, z + nz), ox = x - nx, oz = z - nz, out = ox >= 0 && oz >= 0 && ox < W && oz < H ? T[oz * W + ox] : VOID; return inn && out === VOID ? inn : 0; };
      const c0 = Math.floor(uu), room = good(c0); if (!room) continue; let a = c0, b = c0; while (a > 0 && good(a - 1) === room) a--; while (good(b + 1) === room) b++;
      const wfit = Math.min(ww, 2 * (Math.min(uu - a, b + 1 - uu) - .1)); if (wfit < .9) continue;
      wl.push({ x: nz ? c0 : cx, z: nz ? cz : c0, nx, nz, u: uu, w: +wfit.toFixed(3), st: etg === 0 ? 'cintree' : etg === 1 ? 'pf' : 'fen', c: '', r: room }); } // comme dehors : portes-fenêtres cintrées, puis hautes fenêtres, puis fenêtres à allège
    // les pièces : le vestibule derrière la porte, le grand salon derrière lui, puis les appartements en enfilade (galeries, salle de bal, chapelle…)
    const R = num.size, rooms = [], box = []; for (let r = 1; r <= R; r++) box[r] = { x0: W, x1: 0, z0: H, z1: 0, a: 0 };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const r = Rg[z * W + x]; if (!r) continue; const b = box[r]; b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.z0 = Math.min(b.z0, z); b.z1 = Math.max(b.z1, z); b.a++; }
    const cen = r => [(box[r].x0 + box[r].x1) / 2, (box[r].z0 + box[r].z1) / 2], dist = (a, b) => { const [ax, az] = cen(a), [bx2, bz] = cen(b); return Math.hypot(ax - bx2, az - bz); };
    let vest = door ? fl(door.x0 + 1, door.z - 1) : 0; if (!vest) for (let r = 1; r <= R; r++) if (role[r] === 'vest') { vest = r; break; } if (!vest) vest = 1;
    let salon = 0; for (let r = 1; r <= R; r++) if (role[r] === 'salon' && (!salon || dist(r, vest) < dist(salon, vest))) salon = r;
    if (!salon) { let bd = Infinity; for (let r = 1; r <= R; r++) if (r !== vest && box[r].a >= 60 && dist(r, vest) - box[r].a * .01 < bd) { bd = dist(r, vest) - box[r].a * .01; salon = r; } } // la grande pièce la plus proche du hall
    const kindOf = {}; kindOf[vest] = etg ? 'palier' : 'vestibule'; if (salon) kindOf[salon] = etg ? 'apparat' : 'salon';
    const rest = []; for (let r = 1; r <= R; r++) if (!kindOf[r]) rest.push(r); const ref = salon || vest; rest.sort((a, b) => dist(a, ref) - dist(b, ref) || cen(a)[0] - cen(b)[0]);
    let ng = 0; for (const r of rest) if (role[r] === 'gal' && ng < 2) { kindOf[r] = 'galerie'; ng++; }
    if (etg) { let oj = etg * 3; for (const r of rest) if (!kindOf[r]) kindOf[r] = ORDER2[oj++ % ORDER2.length]; }
    if (rest.length >= 5) { let big = 0; for (const r of rest) if (!kindOf[r] && box[r].a >= 120 && (!big || box[r].a > box[big].a)) big = r; if (big) kindOf[big] = 'bal'; }
    if (rest.length >= 6) { let far = 0; for (const r of rest) if (!kindOf[r] && box[r].a >= 40 && box[r].a <= 170 && (!far || dist(r, ref) > dist(far, ref))) far = r; if (far) kindOf[far] = 'chapelle'; }
    let oi = 0; for (const r of rest) if (!kindOf[r]) kindOf[r] = ORDER[oi++ % ORDER.length];
    const used = {};
    for (let r = 1; r <= R; r++) { const kd = kindOf[r] || 'anti', K = KIND[kd], c = used[kd] = (used[kd] || 0) + 1, b = box[r];
      rooms.push({ id: r, k: kd, n: K[0] + (c > 1 ? ROMAN[c - 1] || ' ' + c : ''), wall: K[1], floor: K[2], curt: K[3], lus: K[4], app: 1, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); }
    for (const w of wl) w.c = ''; // rideaux : ceux de la pièce
    const court = C.court ? [X(C.court[0]), Z(C.court[1]), X(C.court[2]), Z(C.court[3])].map(v => +v.toFixed(2)) : null;
    return { v: VER, sig: planSig(info), fl: etg, W, H, k, px, court: etg ? null : court, doors, CH: n >= 8 ? 7 : 6.2, T: G.b64.enc(T), R: G.b64.enc(Rg), ops: {}, rooms, wins: wl, door, n };
  }
  const planSig = info => '0|' + info.cols + '|' + info.rows;
  function genPlan(info) { const fl = info.fl || 0, pl = genPlan0(info, fl), S = stairsOf(info); pl.nfl = S.nfl; pl.stairs = S.list; return pl; }
  G.genChateauPlan = genPlan;
  // ---------- les grands escaliers de marbre ----------
  // au centre, dans le hall d'honneur, face à l'entrée : un escalier majestueux, aussi large que le hall le permet ;
  // dans chaque aile (à gauche et à droite) : un escalier droit ; aux étages supérieurs : un escalier près du palier et dans les ailes
  // { lvl : étage de départ, ax : 'x' ou 'z' (sens de la montée), s : +1 / -1, x0 z0 x1 z1 : la volée, lnd : profondeur des paliers,
  //   lo / hi : où l'on arrive en bas / en haut, grand : l'escalier d'honneur }
  const SCache = {};
  // les cases d'une volée : le long de l'axe (a), en travers (b) ; les paliers en bas (lo) et en haut (hi)
  function flightCells(x0, z0, ax, s, len, lnd, wd) { const r = [], lo = [], hi = [];
    for (let a = -lnd; a < len + lnd; a++) for (let b = 0; b < wd; b++) { const aa = s > 0 ? a : len - 1 - a, x = ax === 'x' ? x0 + aa : x0 + b, z = ax === 'z' ? z0 + aa : z0 + b; (a < 0 ? lo : a >= len ? hi : r).push([x, z]); }
    return { r, lo, hi }; }
  G.chFlightCells = flightCells;
  function stairsOf(info) {
    const key = planSig(info); if (SCache[key]) return SCache[key];
    const L = G.chateauFusion.layout(0, info.cols, info.rows), C = L.C, list = []; let nfl = Math.max(1, ...C.B.map(B => B.nf));
    if (nfl >= 3 && C.B.filter(B => B.nf >= 3).every(B => B === C.D)) nfl = 2; // le dernier étage n'est qu'au-dessus du hall (les combles du pavillon central) : il ne se visite pas
    if (nfl < 2) return SCache[key] = { nfl, list };
    const P = []; for (let f = 0; f < nfl; f++) P.push(genPlan0(info, f));
    const W = P[0].W, H = P[0].H, D = P.map(p => ({ T: G.b64.dec(p.T), R: G.b64.dec(p.R) })), k = P[0].k, px = P[0].px;
    let ex0 = Infinity, ez0 = Infinity; for (const B of C.B) { ex0 = Math.min(ex0, B.x0); ez0 = Math.min(ez0, B.z0); }
    const X = x => (x - ex0) * k + px, Z = z => (z - ez0) * k + 1;
    // trop près d'une arche ou d'une porte (on garde les passages libres)
    const near = P.map((p, f) => { const T = D[f].T, o = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) if (T[i] === OPEN || T[i] === DOOR) { const x = i % W, z = (i - x) / W; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H) o[zz * W + xx] = 1; } } return o; });
    const taken = new Uint8Array(W * H * nfl);
    function fits(lvl, x0, z0, ax, s, len, lnd, wd) {
      const A = D[lvl], B2 = D[lvl + 1], c = flightCells(x0, z0, ax, s, len, lnd, wd), ok = (x, z, F, f2) => x >= 0 && z >= 0 && x < W && z < H && F.T[z * W + x] === FLOOR && !near[f2][z * W + x];
      let rA = -1, rB = -1; for (const [x, z] of c.r) { if (!ok(x, z, A, lvl) || !ok(x, z, B2, lvl + 1) || taken[lvl * W * H + z * W + x] || taken[(lvl + 1) * W * H + z * W + x]) return null;
        const ra = A.R[z * W + x], rb = B2.R[z * W + x]; if (rA < 0) { rA = ra; rB = rb; } else if (ra !== rA || rb !== rB) return null; }
      for (const [x, z] of c.lo) if (!ok(x, z, A, lvl) || A.R[z * W + x] !== rA || taken[lvl * W * H + z * W + x]) return null;
      for (const [x, z] of c.hi) if (!ok(x, z, B2, lvl + 1) || B2.R[z * W + x] !== rB || taken[(lvl + 1) * W * H + z * W + x]) return null;
      // contre un mur, c'est plus beau (et ça ne coupe pas la pièce en deux)
      let wall = 0; for (const [x, z] of c.r) for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H && A.T[zz * W + xx] === WALL) wall++; }
      return { c, wall };
    }
    function take(lvl, best, len, lnd, wd, grand) {
      const c = best.c, xs = c.r.map(p => p[0]), zs = c.r.map(p => p[1]);
      for (const [x, z] of c.r.concat(c.lo)) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H) taken[lvl * W * H + zz * W + xx] = 1; }
      for (const [x, z] of c.r.concat(c.hi)) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H) taken[(lvl + 1) * W * H + zz * W + xx] = 1; }
      const mid = arr => [arr.reduce((t, p) => t + p[0], 0) / arr.length + .5, arr.reduce((t, p) => t + p[1], 0) / arr.length + .5];
      const lo = c.lo.filter(p => Math.abs((best.ax === 'x' ? p[0] : p[1]) - (best.ax === 'x' ? c.lo[0][0] : c.lo[0][1])) < .5), hi = c.hi.filter(p => Math.abs((best.ax === 'x' ? p[0] : p[1]) - (best.ax === 'x' ? c.hi[c.hi.length - 1][0] : c.hi[c.hi.length - 1][1])) < .5);
      list.push({ lvl, ax: best.ax, s: best.s, x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs), lnd, lo: mid(lo.length ? lo : c.lo), hi: mid(hi.length ? hi : c.hi), len, grand: grand ? 1 : 0 }); return true;
    }
    // un escalier droit près d'un point (ax0, az0) : la meilleure place à moins de rad cases, contre un mur si possible
    function place(lvl, ax0, az0, rad, wd = 3, rm = 0) { // rm : seulement dans cette pièce
      for (const [len, lnd] of [[8, 2], [7, 2], [7, 1], [6, 1], [5, 1]]) { let best = null, bs = Infinity;
        for (let z0 = Math.max(0, Math.round(az0 - rad)); z0 < Math.min(H, az0 + rad); z0++) for (let x0 = Math.max(0, Math.round(ax0 - rad)); x0 < Math.min(W, ax0 + rad); x0++) for (const ax of ['x', 'z']) for (const s of [1, -1]) {
          const q = fits(lvl, x0, z0, ax, s, len, lnd, wd); if (!q || (rm && D[lvl].R[q.c.r[0][1] * W + q.c.r[0][0]] !== rm)) continue; const mx = q.c.lo.reduce((t, p) => t + p[0], 0) / q.c.lo.length, mz = q.c.lo.reduce((t, p) => t + p[1], 0) / q.c.lo.length, sc = Math.hypot(mx - ax0, mz - az0) - q.wall * .8;
          if (sc < bs) { bs = sc; best = { ax, s, c: q.c }; } }
        if (best) return take(lvl, best, len, lnd, wd, false); }
      return false;
    }
    // 1. l'escalier d'honneur : dans le hall, dans l'axe de la porte, il monte vers le fond ; le plus large possible (jusqu'à 7 cases)
    const door = P[0].door, hall = door ? D[0].R[(door.z - 1) * W + door.x0 + 1] : 0; let hallBox = null;
    if (hall) { let x0 = W, x1 = 0, z0 = H, z1 = 0; for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (D[0].T[z * W + x] === FLOOR && D[0].R[z * W + x] === hall) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } hallBox = { x0, x1, z0, z1 }; }
    const grandAt = (lvl, hb) => { if (!hb) return false; const iw = hb.x1 - hb.x0 + 1, id = hb.z1 - hb.z0 + 1, cxh = (hb.x0 + hb.x1 + 1) / 2, front = id >= 13 ? 3 : 2;
      const wds = []; for (let wd = Math.min(7, iw - 2); wd >= 3; wd--) wds.push(wd); wds.sort((a, b) => ((iw - a) % 2) - ((iw - b) % 2) || b - a); // bien au milieu du hall d'abord
      for (const wd of wds) for (const [len, lnd] of [[10, 2], [9, 2], [8, 2], [8, 1], [7, 1], [6, 1]]) { if (2 * lnd + len + front > id) continue;
        for (const dz of [0, 1, 2]) { const x0 = Math.round(cxh - wd / 2), z0 = hb.z0 + lnd + dz; if (z0 + len + lnd - 1 > hb.z1 - front) continue; const q = fits(lvl, x0, z0, 'z', -1, len, lnd, wd); if (q) return take(lvl, { ax: 'z', s: -1, c: q.c }, len, lnd, wd, wd >= 4); } }
      return false; };
    // les ailes : les deux bouts du château (pavillons au bout des ailes, ou les pavillons d'angle)
    const xsB = C.B.filter(B => B !== C.D); let wings = (C.ends || []).filter(Boolean);
    if (wings.length < 2 && xsB.length) { const lft = xsB.reduce((a, b) => b.x0 < a.x0 ? b : a), rgt = xsB.reduce((a, b) => b.x1 > a.x1 ? b : a); wings = lft === rgt ? [lft] : [lft, rgt]; }
    for (let lvl = 0; lvl < nfl - 1; lvl++) { let n = 0;
      if (lvl === 0 && grandAt(0, hallBox)) n++;
      else if (!n && hallBox && place(lvl, (hallBox.x0 + hallBox.x1 + 1) / 2, (hallBox.z0 + hallBox.z1 + 1) / 2, 22, lvl ? 3 : 4)) n++;
      for (const B of wings) { if (B.nf <= lvl + 1) continue; const wx = X((B.x0 + B.x1) / 2), wz = Z((B.z0 + B.z1) / 2); let rm = 0; // dans la pièce de l'aile (sinon la plus proche)
        for (let r2 = 0; r2 < 4 && !rm; r2++) for (let dz = -r2; dz <= r2 && !rm; dz++) for (let dx = -r2; dx <= r2 && !rm; dx++) { const xx = Math.floor(wx) + dx, zz = Math.floor(wz) + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H && D[lvl].T[zz * W + xx] === FLOOR) rm = D[lvl].R[zz * W + xx]; }
        if ((rm && place(lvl, wx, wz, 24, 3, rm)) || place(lvl, wx, wz, 12)) n++; }
      if (!n) place(lvl, Math.floor(W / 2), Math.floor(H / 2), Math.max(W, H)); } // au moins un escalier par étage
    return SCache[key] = { nfl, list };
  }

  // ---------- lecture du plan (mise en cache sur la carte) ----------
  function planData(m) {
    if (m._pd) return m._pd; const pl = m.meta.plan, W = pl.W, H = pl.H, T = G.b64.dec(pl.T), R = G.b64.dec(pl.R), N = W * H, bl = new Uint8Array(N);
    for (let i = 0; i < N; i++) bl[i] = T[i] === FLOOR || T[i] === OPEN || T[i] === DOOR ? 0 : 1;
    const su = new Uint8Array(N), st = [], efl = pl.fl || 0;
    for (const q of pl.stairs || []) { const up = q.lvl === efl; if (!up && q.lvl !== efl - 1) continue; const o = Object.assign({ up }, q); st.push(o);
      for (let z = q.z0; z <= q.z1; z++) for (let x = q.x0; x <= q.x1; x++) su[z * W + x] = up ? 1 : 2;
      const Lp = up ? q.lo : q.hi; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.floor(Lp[0]) + dx, zz = Math.floor(Lp[1]) + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H && !su[zz * W + xx]) su[zz * W + xx] = 3; }
      const wd = q.ax === 'x' ? q.z1 - q.z0 + 1 : q.x1 - q.x0 + 1, len = q.ax === 'x' ? q.x1 - q.x0 + 1 : q.z1 - q.z0 + 1, fc = flightCells(q.x0, q.z0, q.ax, q.s, len, q.lnd || 2, wd);
      for (const [xx, zz] of up ? fc.lo : fc.hi) if (xx >= 0 && zz >= 0 && xx < W && zz < H && !su[zz * W + xx]) su[zz * W + xx] = 3; }
    return m._pd = { pl, W, H, T, R, bl, su, st, CH: pl.CH, room: id => pl.rooms.find(q => q.id === id) || pl.rooms[0] };
  }
  // une pièce est faite des cases de sol reliées sans passer par une arche (après une retouche du plan, on renumérote)
  function renumber(m) {
    const pd = planData(m), { W, H, T, R, pl } = pd, N = W * H, nr = new Uint8Array(N), old = pl.rooms, rooms = []; let k = 0;
    for (let i = 0; i < N; i++) { if (T[i] !== FLOOR || nr[i]) continue; k++; const cnt = new Map(), st = [i]; nr[i] = k; let x0 = W, x1 = 0, z0 = H, z1 = 0;
      while (st.length) { const c = st.pop(), x = c % W, z = (c - x) / W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); if (R[c]) cnt.set(R[c], (cnt.get(R[c]) || 0) + 1);
        for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = zz * W + xx; if (T[j] === FLOOR && !nr[j]) { nr[j] = k; st.push(j); } } }
      let bo = 0, bc = -1; for (const [r, c] of cnt) if (c > bc) { bo = r; bc = c; } const base = old.find(q => q.id === bo) || old[0] || { k: 'anti', n: 'Pièce', wall: 'peinture_lin', floor: 'chevrons_chene', curt: 'rouge', lus: 'lustre_cristal', app: 1 };
      const same = rooms.filter(q => q.n === base.n || ROMAN.some(r => r && q.n === base.n + r)).length; // une pièce coupée en deux : « Grand salon » et « Grand salon II »
      rooms.push(Object.assign({}, base, { id: k, x0, x1, z0, z1, n: same ? base.n + (ROMAN[same] || ' ' + (same + 1)) : base.n })); }
    for (const w of pl.wins) { const j = (w.z + w.nz) * W + w.x + w.nx; w.r = T[j] === FLOOR ? nr[j] : 0; }
    pl.R = G.b64.enc(nr); pl.rooms = rooms; m._pd = null;
  }

  // =====================================================================
  // ============ 2. LA CARTE DE L'INTÉRIEUR, ses meubles, ses lustres =====
  // =====================================================================
  function makePlanInterior(iid, info, old) {
    const pl = genPlan(info), m = new G.GMap(pl.W, pl.H, { interior: true, kind: 'maison', id: iid });
    m.surf.fill(6); Object.assign(m.meta, { shell: { kind: 'maison' }, stage: G.HOME_STAGES.length, plan: pl, noExit: 1, ceilH: pl.CH, sunny: 1, bright: 1, cam: Object.assign({}, CAM) });
    if (old) for (const k of ['door', 'title', 'fromId']) if (old.meta[k] != null) m.meta[k] = old.meta[k];
    if (pl.door) m.addObj('paillasson', pl.door.x0 + 1, pl.door.z - 1);
    const op = old && old.meta.plan, ok2 = op && op.k ? op.k : pl.k, sc = pl.k / ok2, opx = op ? (op.px != null ? op.px : op.W > 25 ? 1 : Math.max(1, Math.round((op.W - (pl.W - 2 * pl.px) / pl.k * ok2) / 2))) : pl.px;
    if (old) for (const q of old.list) { if (q.t === 'paillasson' || !O[q.t]) continue; const ex = {}; for (const k of KEEP) if (q[k] != null) ex[k] = q[k]; const nx = op ? Math.round((q.x - opx) * sc + pl.px) : q.x, nz = op ? Math.round((q.z - 1) * sc + 1) : q.z; if (!relocate(m, q.t, nx, nz, q.r || 0, ex)) stash(q.t); }
    lustres(m); furnish(m);
    G.buildShell(m); m.buildAll(); return m;
  }
  const stash = t => { if (!G.ITEMS[t]) return; const left = G.storeAdd ? G.storeAdd(t, 1) : 1; if (left > 0 && G.inv) G.inv.add(t, 1); };
  // à la même place si possible, sinon sur la case libre la plus proche (en tournant l'objet si besoin)
  function relocate(m, t, x, z, r, ex) {
    const pd = planData(m), { W, H } = pd, d = O[t]; if (!d) return false;
    const tryAt = (xx, zz) => { for (const rr of [r, (r + 1) & 3, (r + 2) & 3, (r + 3) & 3]) if (m.canPlace(t, xx, zz, rr)) { m.addObj(t, xx, zz, rr, ex); return true; } return false; };
    if (x >= 0 && z >= 0 && x < W && z < H && tryAt(x, z)) return true;
    const sx = G.clamp(x, 0, W - 1), sz = G.clamp(z, 0, H - 1); for (let rad = 1; rad < Math.max(W, H); rad++) for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue; if (tryAt(sx + dx, sz + dz)) return true; }
    return false;
  }
  // lustres au plafond, en ligne le long de la pièce (un tous les 7 à 8 mètres)
  // replace : on enlève d'abord ceux de la pièce (back(t) reçoit chacun) ; take(t) : payer chaque lustre posé (mode survie), sinon ils sont offerts
  function lustres(m, onlyRoom, replace, back, take) {
    const pd = planData(m), { W, T, R, pl } = pd;
    for (const rm of pl.rooms) { if (onlyRoom && rm.id !== onlyRoom) continue; let has = false;
      for (const o of [...m.list]) if (O[o.t].ceil && R[o.z * W + o.x] === rm.id) { if (replace) { m.removeObj(o); if (back) back(o.t); } else has = true; }
      if (has || !rm.lus || !O[rm.lus]) continue; const w = rm.x1 - rm.x0 + 1, d = rm.z1 - rm.z0 + 1, long = w >= d, L = long ? w : d, nl = G.clamp(Math.round(L / 7.5), 1, 7);
      for (let i = 0; i < nl; i++) { const t = (i + .5) / nl, x = Math.floor(long ? rm.x0 + t * w : rm.x0 + w / 2), z = Math.floor(long ? rm.z0 + d / 2 : rm.z0 + t * d); let stop = false;
        for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + ox, zz = z + oz, j = zz * W + xx; if (T[j] === FLOOR && R[j] === rm.id && m.canPlace(rm.lus, xx, zz)) { if (take && !take(rm.lus)) stop = true; else m.addObj(rm.lus, xx, zz); break; } }
        if (stop) break; } }
  }
  // ---------- ameublement de départ, selon la pièce (comme dans un vrai château : cheminée sur le mur plein, consoles entre les fenêtres, symétrie) ----------
  function furnish(m, onlyRoom) { const sv = G._deckY; G._deckY = 0; try { furnish0(m, onlyRoom); } finally { G._deckY = sv; } } // les meubles se posent aussi sur les tapis
  function furnish0(m, onlyRoom) {
    const pd = planData(m), { W, H, T, R, pl } = pd, ti = (x, z) => x < 0 || z < 0 || x >= W || z >= H ? VOID : T[z * W + x];
    const keep = new Uint8Array(W * H); // garder libres les passages : devant les arches, les portes et la porte d'entrée
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const t = T[z * W + x]; if (t !== OPEN && t !== DOOR) continue; const kr = t === DOOR ? 2 : 1; for (let dz = -kr; dz <= kr; dz++) for (let dx = -kr; dx <= kr; dx++) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H) keep[zz * W + xx] = 1; } }
    const winAt = new Set(); for (const w of pl.wins) for (let s = Math.floor(w.u - w.w / 2 - .55); s <= Math.floor(w.u + w.w / 2 + .55); s++) winAt.add(w.nz ? s + ',' + (w.z + w.nz) : (w.x + w.nx) + ',' + s);
    for (const rm of pl.rooms) { if (onlyRoom && rm.id !== onlyRoom) continue;
      let busy = false; for (const o of m.list) if (!O[o.t].ceil && o.t !== 'paillasson' && R[o.z * W + o.x] === rm.id) { busy = true; break; } if (busy) continue;
      const inRoom = (x, z) => x >= 0 && z >= 0 && x < W && z < H && T[z * W + x] === FLOOR && R[z * W + x] === rm.id;
      const P = (t, x, z, r = 0, tall) => { const d = O[t]; if (!d) return false; const [w, dd] = G.fpDims(d, r);
        for (let zz = z; zz < z + dd; zz++) for (let xx = x; xx < x + w; xx++) if (!inRoom(xx, zz) || keep[zz * W + xx] || (tall && winAt.has(xx + ',' + zz))) return false;
        if (!m.canPlace(t, x, z, r)) return false; m.addObj(t, x, z, r); return true; };
      const x0 = rm.x0, x1 = rm.x1, z0 = rm.z0, z1 = rm.z1, cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2), w = x1 - x0 + 1, d = z1 - z0 + 1, long = w >= d;
      // contre un mur plein : dos au mur, la place libre la plus proche de « pos » le long du côté (0 = début, 1 = fin)
      const atWall = (t, s, pos = .5, tall = false) => { const d0 = O[t]; if (!d0) return false; const r = { n: 0, s: 2, w: 1, e: 3 }[s], [fw, fd] = G.fpDims(d0, r), along = s === 'n' || s === 's', span = along ? fw : fd, L = along ? w : d;
        const cand = []; for (let i = 0; i + span <= L; i++) cand.push(i); cand.sort((a, b) => Math.abs(a + span / 2 - L * pos) - Math.abs(b + span / 2 - L * pos));
        for (const i of cand) { const x = s === 'e' ? x1 - fw + 1 : along ? x0 + i : x0, z = s === 's' ? z1 - fd + 1 : along ? z0 : z0 + i; let ok = true;
          for (let j = 0; j < span && ok; j++) { const bx2 = along ? x + j : (s === 'w' ? x - 1 : x1 + 1), bz = along ? (s === 'n' ? z - 1 : z1 + 1) : z + j; if (ti(bx2, bz) !== WALL || winAt.has((along ? bx2 : (s === 'w' ? x : x1)) + ',' + (along ? (s === 'n' ? z : z1) : bz)) && tall) ok = false; }
          if (ok && P(t, x, z, r, tall)) return true; } return false; };
      const corners = (t, inset = 0) => { P(t, x0 + inset, z0 + inset); P(t, x1 - inset, z0 + inset); P(t, x0 + inset, z1 - inset); P(t, x1 - inset, z1 - inset); };
      const pairWall = (t, s, tall) => { atWall(t, s, .22, tall); atWall(t, s, .78, tall); };
      const group = (gx, gz) => { P('tapis_savonnerie', gx - 1, gz - 1) || P('tapis', gx - 1, gz); P('gueridon', gx, gz - 1) || P('table_basse', gx, gz - 1); P('fauteuil_louis', gx - 2, gz - 1, 1); P('fauteuil_louis', gx + 1, gz - 1, 3); P('canape_velours', gx - 1, gz + 1, 2); };
      const fire = (s = 'n') => atWall('cheminee_marbre', s, .5, true) || atWall('cheminee_marbre', s === 'n' ? 's' : 'n', .5, true) || atWall('cheminee_marbre', s === 'w' ? 'e' : 'w', .5, true) || atWall('cheminee_marbre', s === 'e' ? 'w' : 'e', .5, true);
      switch (rm.k) {
        case 'vestibule': { const gs = pd.st.find(q => q.up && q.grand && q.ax === 'z' && R[q.z0 * W + q.x0] === rm.id);
          if (gs) { const lnd = gs.lnd || 2, zb = gs.s < 0 ? gs.z1 + 1 : gs.z0 - 1, zt = gs.s < 0 ? gs.z0 : gs.z1; // au pied du grand escalier : statues et torchères, de chaque côté
            for (const [xx, sg] of [[gs.x0 - 2, -1], [gs.x1 + 2, 1]]) { P('statue_antique', xx, zb) || P('statue_antique', xx - sg, zb); P('torchere', xx, zb + (gs.s < 0 ? lnd : -lnd)) ; P('vase_chine', xx, zt + (gs.s < 0 ? 1 : -1)); P('buste', xx, Math.round((gs.z0 + gs.z1) / 2)); } }
          else P('gueridon', cx, cz) || P('gueridon', cx, cz - 1);
          for (const s of ['w', 'e']) { atWall('console_doree', s, .2, true); atWall('console_doree', s, .8, true); atWall('banc_coussins', s, .5); }
          P('statue_antique', x0, z0) || P('statue_antique', x0 + 1, z0 + 1); P('statue_antique', x1, z0) || P('statue_antique', x1 - 1, z0 + 1); corners('vase_chine'); P('torchere', x0 + 1, z1 - 1); P('torchere', x1 - 1, z1 - 1); break; }
        case 'salon': fire('n'); group(cx, cz + 1); pairWall('console_doree', 'w', true); pairWall('console_doree', 'e', true); corners('torchere');
          P('harpe', x0 + 1, z1 - 1); P('statue_antique', x1 - 1, z1 - 1); if (pl.n >= 4) atWall('trone', 's', .5); corners('vase_chine', 1); break;
        case 'galerie': { const L = long ? w : d; for (let i = 2, k = 0; i < L - 2; i += 3, k++) { const a = (long ? x0 : z0) + i;
            for (const s of long ? ['n', 's'] : ['w', 'e']) { const t = k % 2 ? 'buste' : 'statue_antique', x = long ? a : (s === 'w' ? x0 : x1), z = long ? (s === 'n' ? z0 : z1) : a; P(t, x, z, 0, true); }
            if (k % 2 === 0) P('banc_coussins', long ? a - 1 : cx, long ? cz : a, long ? 0 : 1); else P('vase_chine', long ? a : cx, long ? cz : a); }
          corners('torchere'); break; }
        case 'bal': for (const s of ['n', 's', 'w', 'e']) for (const p of [.15, .3, .7, .85]) atWall('chaise_louis', s, p); pairWall('console_doree', 'w', true); pairWall('console_doree', 'e', true);
          corners('torchere'); P('harpe', x0 + 2, z0 + 2); P('clavecin', x0 + 3, z0 + 1); P('chaise_louis', x0 + 3, z0 + 2, 2); fire('n'); break;
        case 'manger': { const n = G.clamp((long ? w : d) - 6, 2, 9), s0 = (long ? cx : cz) - Math.floor(n / 2);
          for (let i = 0; i < n; i++) { const x = long ? s0 + i : cx, z = long ? cz : s0 + i; if (P('table_noyer', x, z)) { if (long) { P('chaise_louis', x, z - 1, 0); P('chaise_louis', x, z + 1, 2); } else { P('chaise_louis', x - 1, z, 1); P('chaise_louis', x + 1, z, 3); } } }
          P('fauteuil_louis', long ? s0 - 1 : cx, long ? cz : s0 - 1, long ? 1 : 0); P('fauteuil_louis', long ? s0 + n : cx, long ? cz : s0 + n, long ? 3 : 2);
          const tb = m.objAt(long ? s0 : cx, long ? cz : s0); if (tb && tb.t === 'table_noyer' && G.mergeFurniture) { const sv = G.ui.toast, sf = G.sfx; G.ui.toast = () => { }; G.sfx = () => { }; try { G.mergeFurniture(m, tb); } finally { G.ui.toast = sv; G.sfx = sf; } }
          fire(long ? 'n' : 'w'); atWall('console_doree', long ? 's' : 'e', .5, true); corners('torchere'); corners('vase_chine', 1); break; }
        case 'biblio': P('tapis_savonnerie', cx - 2, cz + 1); for (const s of ['n', 'w', 'e']) for (let p = .1; p < .95; p += .14) atWall('bibliotheque', s, p, true); P('bureau_ecritoire', cx - 1, cz, 0); P('fauteuil_louis', cx, cz - 1, 2);
          P('globe_terrestre', x1 - 1, z1 - 1); P('buste', x0 + 1, z1 - 1); P('fauteuil_louis', cx - 2, cz + 2, 1); P('gueridon', cx - 1, cz + 2); P('fauteuil_louis', cx, cz + 2, 3); break;
        case 'chambre': case 'reine': atWall('lit_baldaquin', 'n', .5, true) || atWall('lit_baldaquin', 'w', .5, true) || atWall('lit_baldaquin', 'e', .5, true) || atWall('lit_baldaquin', 's', .5, true) || atWall('lit_baldaquin', 'n', .5);
          atWall('commode_fleurie', 'n', .15); atWall('commode_fleurie', 'n', .85); fire('w') ; atWall('console_doree', 'e', .5, true); atWall('armoire', 's', .2, true);
          group(cx, z1 - 2); P('paravent', x1 - 1, z1, 2); P(rm.k === 'reine' ? 'harpe' : 'globe_terrestre', x0 + 1, z1 - 1); P('vase_chine', x1, z0 + 2); break;
        case 'musique': atWall('clavecin', 'n', .35) || P('clavecin', cx - 1, z0 + 1); P('harpe', cx + 1, z0 + 1); atWall('piano_droit', 'w', .5, true);
          for (const [dx, dz] of [[-2, 3], [-1, 3], [1, 3], [2, 3], [-1, 4], [1, 4]]) P('chaise_louis', cx + dx, z0 + dz, 2); atWall('canape_velours', 's', .5); corners('torchere'); atWall('buste', 'e', .5, true); break;
        case 'cabinet': P('bureau', cx - 1, cz, 0); P('fauteuil_louis', cx, cz - 1, 2); pairWall('bibliotheque', 'n', true); fire('w'); P('globe_terrestre', x1 - 1, z1 - 1); P('buste', x1 - 1, z0 + 1); P('chaise_club', x0 + 1, z1 - 1); break;
        case 'chapelle': atWall('autel', 'n', .5, true) || atWall('autel', 'w', .5, true) || atWall('autel', 'e', .5, true) || atWall('autel', 's', .5, true); for (let z = z0 + 3, k = 0; z < z1 - 1 && k < 8; z += 2, k++) { P('banc_coussins', cx - 2, z, 0); P('banc_coussins', cx + 1, z, 0); }
          P('torchere', cx - 2, z0 + 1); P('torchere', cx + 2, z0 + 1); P('statue_antique', x0 + 1, z0 + 1); P('statue_antique', x1 - 1, z0 + 1); corners('vase_chine', 0); break;
        case 'billard': P('billard', cx - 1, cz - 1) || P('billard', cx - 1, cz - 1, 1); pairWall('chaise_club', 'w'); pairWall('chaise_club', 'e'); fire('n'); corners('torchere'); P('globe_terrestre', x1 - 1, z1 - 1); break;
        case 'boudoir': group(cx, cz); P('paravent', x0 + 1, z0, 0); P('harpe', x1 - 1, z0 + 1); fire('w'); atWall('commode_fleurie', 'e', .5); P('vase_chine', x1, z1); break;
        case 'jeux': for (const [gx, gz] of [[cx - 2, cz], [cx + 2, cz]]) { if (P('gueridon', gx, gz)) { P('fauteuil_louis', gx - 1, gz, 1); P('fauteuil_louis', gx + 1, gz, 3); P('chaise_louis', gx, gz + 1, 2); } } fire('n'); atWall('console_doree', 's', .5, true); corners('torchere'); break;
        case 'gardes': for (const s of ['w', 'e']) for (const p of [.2, .5, .8]) atWall(p === .5 ? 'banc_coussins' : 'armure', s, p, true); fire('n'); corners('torchere'); P('coffre', x1 - 1, z1 - 1); break;
        default: pairWall('banc_coussins', 'w'); pairWall('banc_coussins', 'e'); atWall('console_doree', 'n', .5, true); P('buste', cx, cz) || P('statue_antique', cx, cz); corners('vase_chine'); break;
      }
    }
  }

  // =====================================================================
  // ============ 3. ENTRER, SORTIR, SE COGNER AUX MURS ===================
  // =====================================================================
  const GP = G.GMap.prototype, oth = GP.terrainH, ocp = GP.canPlace;
  // un escalier : la marche monte (ou la cage descend) en continu le long de la volée
  const stairAt = (pd, x, z) => { for (const q of pd.st) if (x >= q.x0 && x < q.x1 + 1 && z >= q.z0 && z < q.z1 + 1) return q; return null; };
  const stairT = (q, x, z) => { const a = q.ax === 'x' ? x : z, a0 = q.ax === 'x' ? q.x0 : q.z0, a1 = (q.ax === 'x' ? q.x1 : q.z1) + 1; return G.clamp(q.s > 0 ? (a - a0) / (a1 - a0) : (a1 - a) / (a1 - a0), 0, 1); };
  GP.terrainH = function (x, z) { const pd = this.meta && this.meta.plan ? planData(this) : null; if (pd) { const tx = Math.floor(x), tz = Math.floor(z); if (tx >= 0 && tz >= 0 && tx < pd.W && tz < pd.H) { const c = pd.su[tz * pd.W + tx];
      if (c === 1 || c === 2) { const q = stairAt(pd, x, z); if (q) { const t = stairT(q, x, z); return q.up ? (pd.CH + GAP) * t : -(pd.CH + GAP) * (1 - t); } }
      if (pd.bl[tz * pd.W + tx]) return pd.CH; } } return oth.call(this, x, z); };
  GP.canPlace = function (t, tx, tz, r = 0) { if (this.meta && this.meta.plan) { const pd = planData(this), d = O[t]; if (d) { const [w, dd] = G.fpDims(d, r); for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (x < 0 || z < 0 || x >= pd.W || z >= pd.H || pd.T[z * pd.W + x] !== FLOOR || pd.su[z * pd.W + x]) return false; } } // (rien sur les escaliers ni leurs paliers)
    return ocp.call(this, t, tx, tz, r); };
  // on arrive juste derrière la porte d'entrée
  // (et jamais dans le vide autour du château : si la place demandée n'est pas du parquet, on prend le parquet le plus proche de l'entrée)
  G.on('init', () => { const oem = G.enterMap; G.enterMap = (map, x, z, yaw) => { const pl = map && map.meta && map.meta.plan;
    if (pl) { const def = Math.abs(x - (Math.floor(map.W / 2) + .5)) < .01 && Math.abs(z - (map.H - 1.4)) < .01; const sd = G._chSide >= 0 && pl.doors && pl.doors[G._chSide + 1]; G._chSide = -1; if (sd && def) { x = sd.sx; z = sd.sz - 1.9; yaw = PI; } else if (pl.door && def) { x = pl.door.sx; z = pl.door.sz; yaw = PI; const pd0 = planData(map), z2 = pl.door.z - 2.6; if (pd0.T[Math.floor(z2) * pd0.W + Math.floor(x)] === FLOOR) z = z2; } // deux pas dans le vestibule : la caméra a la place d'être derrière
      const pd = planData(map), walk = (a, b) => { const tx = Math.floor(a), tz = Math.floor(b); return tx >= 0 && tz >= 0 && tx < pd.W && tz < pd.H && pd.T[tz * pd.W + tx] === FLOOR; };
      if (!walk(x, z)) { const ax = pl.door ? pl.door.sx : pd.W / 2, az = pl.door ? pl.door.sz : pd.H - 2; let bd = Infinity, bx = x, bz = z;
        for (let i = 0; i < pd.W * pd.H; i++) if (pd.T[i] === FLOOR) { const cx = i % pd.W + .5, cz = Math.floor(i / pd.W) + .5, dd = (cx - ax) ** 2 + (cz - az) ** 2; if (dd < bd) { bd = dd; bx = cx; bz = cz; } }
        x = bx; z = bz; if (yaw == null) yaw = PI; } }
    return oem(map, x, z, yaw); }; });
  // avant d'entrer dans un château classique : son intérieur suit le plan actuel du château (créé ou refait, les meubles sont gardés)
  function prepare(o) {
    if (!o || (G.net && G.net.visit) || !G.chateauInfo) return; const info = G.chateauInfo(o); if (!info || info.st !== 0) return;
    const q = info.main || o; if (!q.iid) q.iid = 'b' + q.t + '_' + q.x + '_' + q.z; const iid = q.iid, im = G.interiors[iid], sig = planSig(info);
    if (im && im.meta.plan && im.meta.plan.sig === sig && im.meta.plan.v === VER && im.meta.plan.door) { ensureFloors(im); return; } // (un plan sans porte, d'une ancienne version, est refait)
    const nm = makePlanInterior(iid, info, im); if (im) G.scene.remove(im.group); G.interiors[iid] = nm; G.scene.add(nm.group); nm.group.visible = false; ensureFloors(nm);
  }
  // les étages : une carte par étage, créée la première fois qu'on y monte (refaite si le château a changé, les meubles gardés)
  const FLN = ['Rez-de-chaussée', '1er étage', '2e étage', '3e étage', '4e étage'];
  function floorMap(base, fl) {
    if (!fl) return base; const id = base.id + '_f' + fl, pl0 = base.meta.plan; let im = G.interiors[id];
    if (im && im.meta.plan && im.meta.plan.sig === pl0.sig && im.meta.plan.v === VER) return im;
    if (G.net && G.net.visit) return null;
    const sg = pl0.sig.split('|'), nm = makePlanInterior(id, { cols: +sg[1], rows: +sg[2], fl }, im);
    nm.meta.base = base.id; nm.meta.title = (base.meta.title || 'Château') + ' — ' + (FLN[fl] || fl + 'e étage');
    if (im) G.scene.remove(im.group); G.interiors[id] = nm; G.scene.add(nm.group); nm.group.visible = false; return nm;
  }
  // monter (dir = 1) ou descendre (dir = -1) le grand escalier : on arrive sur le palier, dos à la volée
  function goFloor(m, q, dir) {
    const fl = (m.meta.plan.fl || 0) + dir, base = m.meta.base ? G.interiors[m.meta.base] : m; if (!base || fl < 0) return;
    const to = fl === 0 ? base : floorMap(base, fl); if (!to) { G.ui.toast('Cet étage n’est pas ouvert aux visiteurs.'); return; }
    const vx = q.ax === 'x' ? q.s : 0, vz = q.ax === 'z' ? q.s : 0, [x, z] = dir > 0 ? q.hi : q.lo, yaw = dir > 0 ? Math.atan2(vx, vz) : Math.atan2(-vx, -vz);
    G.sfx('step', .6); G.ui.fade(() => G.enterMap(to, x, z, yaw), .12);
  }
  const oen = G.act.enterHouse; G.act.enterHouse = o => { try { prepare(o); } catch (e) { console.warn('intérieur du château', e); } return oen(o); };

  // =====================================================================
  // ============ 4. LE DESSIN DE L'INTÉRIEUR =============================
  // =====================================================================
  // vue du village (de haut) : les murs entre la caméra et le joueur sont coupés net à hauteur d'appui, avec un dessus de pierre
  // (le reste du mur n'est pas dessiné ; son ombre, elle, reste entière). À la souris, les murs restent toujours debout.
  // wid = numéro du segment de mur ; wid + .5 = le dessus de pierre de ce segment, caché sous le sol tant que le mur est debout.
  let CUTN = 0; const newCut = () => ({ id: ++CUTN, tex: { value: null }, n: { value: 1 }, low: { value: 1.12 }, top: { value: 7.2 } });
  const CUT = newCut(); // (chaque étage a les siens : ses murs s'abaissent sans toucher à ceux des autres étages, visibles en même temps)
  const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6); // la coupe des étages empilés (tout ce qui est au-dessus est caché)
  const cutCache = new Map();
  function cutMat(base, U = CUT) {
    let mm = cutCache.get(base); if (!mm) cutCache.set(base, mm = new Map()); if (mm.has(U.id)) return mm.get(U.id); const c = base.clone(), ob = base.onBeforeCompile, k0 = base.customProgramCacheKey ? base.customProgramCacheKey() : '';
    c.onBeforeCompile = (sh, r) => { ob.call(base, sh, r); sh.uniforms.uCutTex = U.tex; sh.uniforms.uCutN = U.n; sh.uniforms.uCutLow = U.low; sh.uniforms.uCutTop = U.top;
      sh.vertexShader = 'attribute float wid;\nuniform sampler2D uCutTex;\nuniform float uCutN, uCutLow, uCutTop;\nvarying float vCutY, vCutW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n'
        + '{ float wi = floor( wid + .01 ), cap = step( .25, wid - wi ), cw = texture2D( uCutTex, vec2( ( wi + .5 ) / uCutN, .5 ) ).r;\n'
        + '  if ( cap > .5 ) transformed.y = cw > .003 ? mix( uCutTop, uCutLow, cw ) - .004 : -3.0;\n  vCutY = transformed.y; vCutW = cap > .5 ? 0.0 : cw; }');
      sh.fragmentShader = 'uniform float uCutLow, uCutTop;\nvarying float vCutY, vCutW;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if ( vCutW > .003 && vCutY > mix( uCutTop, uCutLow, vCutW ) ) discard;'); };
    c.customProgramCacheKey = () => k0 + '|cut2'; if (base.extensions) c.extensions = base.extensions; if (base.alphaToCoverage) c.alphaToCoverage = true; mm.set(U.id, c); return c;
  }
  const cutMats = U => G.MATS.map(m => m ? cutMat(m, U) : m);
  const matCache = {};
  const paintMat = col => matCache['p' + col] || (matCache['p' + col] = G.premiumMat({ color: col }, { cloud: false, rough: .78 }));
  const wallTexMat = id => matCache['w' + id] || (matCache['w' + id] = G.premiumMat({ map: G.patTex('wall', id) }, { cloud: false, rough: .85 }));
  const floorMat = id => matCache['f' + id] || (matCache['f' + id] = FLOORK[id] ? G.premiumMat({ color: 0xffffff }, { cloud: false, floor: FLOORK[id], bump: 1 }) : G.premiumMat({ map: G.patTex('floor', id) }, { cloud: false, rough: .45 }));
  const mirrorMat = () => matCache.mir || (matCache.mir = G.premiumMat({ color: 0xe9eef2 }, { cloud: false, rough: .04, metal: .92 }));
  const viewMat = (sky, U) => cutMat((sky ? G.M.windowSky : G.M.windowTall) || G.M.window, U);
  // tableaux de maître peints par le jeu
  const arts = [];
  function artMat(k) { if (arts[k]) return arts[k]; const c = G.cv(256, 200), x = c.getContext('2d'), r = G.rng(70 + k);
    const skies = [['#9fc7e8', '#f3d9b0'], ['#f2a37a', '#ffe2b0'], ['#6f86b8', '#d8c7e8'], ['#bfe0f0', '#f8f0d8'], ['#2c3858', '#7a6a98'], ['#c9d8c0', '#f6e8c8']], [t, h] = skies[k % skies.length];
    const g = x.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, t); g.addColorStop(1, h); x.fillStyle = g; x.fillRect(0, 0, 256, 200);
    if (k % 3 === 2) { x.fillStyle = '#e8dcc6'; x.fillRect(96, 70, 64, 60); x.fillStyle = '#6a7486'; x.beginPath(); x.moveTo(90, 72); x.lineTo(128, 46); x.lineTo(166, 72); x.fill(); for (let i = 0; i < 4; i++) { x.fillStyle = '#7a95b8'; x.fillRect(102 + i * 15, 84, 8, 14); } }
    for (let i = 0; i < 3; i++) { x.fillStyle = ['#6f8f5a', '#5a7a48', '#48663a'][i]; x.beginPath(); x.moveTo(0, 200); for (let px = 0; px <= 256; px += 16) x.lineTo(px, 120 + i * 22 + Math.sin(px * .03 + i * 2 + k) * 12 + r() * 5); x.lineTo(256, 200); x.fill(); }
    if (k % 2) { x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(196, 54, 16, 0, TAU); x.fill(); }
    for (let i = 0; i < 7; i++) { const px = 16 + r() * 224, py = 128 + r() * 40; x.fillStyle = '#3f5a32'; x.beginPath(); x.ellipse(px, py, 10, 16, 0, 0, TAU); x.fill(); x.fillStyle = '#5a3a22'; x.fillRect(px - 1.5, py + 12, 3, 8); }
    x.globalAlpha = .08; for (let i = 0; i < 900; i++) { x.fillStyle = r() < .5 ? '#000' : '#fff'; x.fillRect(r() * 256, r() * 200, 2, 1); } x.globalAlpha = 1;
    const tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return arts[k] = G.premiumMat({ map: tx }, { cloud: false, rough: .55 }); }
  // plafond peint : ciel d'apothéose, nuées, figures drapées, putti, gloire dorée, cadre en trompe-l'œil
  let ceilM = null; function ceilMat() { if (ceilM) return ceilM; const c = G.cv(512, 512), x = c.getContext('2d'), r = G.rng(911);
    const g = x.createRadialGradient(256, 256, 30, 256, 256, 360); g.addColorStop(0, '#fff6d8'); g.addColorStop(.35, '#cfe3f4'); g.addColorStop(.8, '#8fb3d9'); g.addColorStop(1, '#e8c98a'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i++) { const a = r() * TAU, d = 110 + r() * 150, px = 256 + Math.cos(a) * d, py = 256 + Math.sin(a) * d, rr = 18 + r() * 36, cg = x.createRadialGradient(px, py - rr * .3, 2, px, py, rr); cg.addColorStop(0, 'rgba(255,252,244,.95)'); cg.addColorStop(1, 'rgba(240,226,206,0)'); x.fillStyle = cg; x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill(); }
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r() * .3, d = 150 + r() * 40; x.save(); x.translate(256 + Math.cos(a) * d, 256 + Math.sin(a) * d); x.rotate(a + PI / 2);
      x.fillStyle = ['#c0392b', '#2f5fa8', '#d9a84a', '#7a3d8a', '#3f8a5a'][i % 5]; x.beginPath(); x.ellipse(0, 6, 11, 21, .3, 0, TAU); x.fill(); x.fillStyle = '#f2cfae'; x.beginPath(); x.arc(0, -16, 7, 0, TAU); x.fill(); x.fillRect(-15, -7, 30, 4); x.restore(); }
    for (let i = 0; i < 7; i++) { const a = r() * TAU, d = 70 + r() * 60, px = 256 + Math.cos(a) * d, py = 256 + Math.sin(a) * d; x.fillStyle = '#f4d3b5'; x.beginPath(); x.arc(px, py, 7, 0, TAU); x.arc(px + 5, py - 9, 5, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(px - 8, py - 4, 7, 3, -.6, 0, TAU); x.ellipse(px + 8, py - 4, 7, 3, .6, 0, TAU); x.fill(); }
    const gg = x.createRadialGradient(256, 256, 0, 256, 256, 72); gg.addColorStop(0, 'rgba(255,240,180,1)'); gg.addColorStop(1, 'rgba(255,230,150,0)'); x.fillStyle = gg; x.beginPath(); x.arc(256, 256, 72, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,225,140,.5)'; x.lineWidth = 3; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; x.beginPath(); x.moveTo(256 + Math.cos(a) * 30, 256 + Math.sin(a) * 30); x.lineTo(256 + Math.cos(a) * 96, 256 + Math.sin(a) * 96); x.stroke(); }
    x.strokeStyle = '#c9a23a'; x.lineWidth = 14; x.strokeRect(7, 7, 498, 498); x.strokeStyle = '#8a6a2a'; x.lineWidth = 3; x.strokeRect(18, 18, 476, 476);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return ceilM = G.premiumMat({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .42 }, { cloud: false, rough: .7 }); }
  // constructeur de modèle qui marque chaque pièce avec son segment de mur
  // boîte unité (36 sommets, bon sens des faces) pour la voie rapide
  let UB = null; const unitBox = () => UB || (UB = (() => { const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(); return { p: g.attributes.position.array, n: g.attributes.normal.array }; })());
  const colC = new Map(), colOf = c => { let v = colC.get(c); if (!v) { const C = new THREE.Color(c); colC.set(c, v = [C.r, C.g, C.b]); } return v; };
  class CB extends G.MB {
    constructor(s) { super(s); this.wid = 0; this.fq = new Map(); }
    add(geo, col, m, mat = 0, smooth = false) { const L = this.parts.map(p => p.length); super.add(geo, col, m, mat, smooth); for (let i = 0; i < this.parts.length; i++) if (this.parts[i].length > L[i]) { this.parts[i][this.parts[i].length - 1].userData.wid = this.wid; break; } return this; }
    fq_(col, mat, k) { let pat = 0; if (this.pat && mat === 0) { pat = this.pat; mat = 4; } const sk = this.sk != null ? this.sk : G.surfKind ? G.surfKind(col, mat) : 0, key = mat * 4096 + sk * 64 + pat;
      let q = this.fq.get(key); if (!q) this.fq.set(key, q = { mat, sk, pat, n: 0, p: new Float32Array(3 * 2048), nn: new Float32Array(3 * 2048), c: new Float32Array(3 * 2048), w: new Float32Array(2048) });
      if (q.n + k > q.w.length) { let L = q.w.length * 2; while (L < q.n + k) L *= 2; const gr = (a, s) => { const b2 = new Float32Array(L * s); b2.set(a); return b2; }; q.p = gr(q.p, 3); q.nn = gr(q.nn, 3); q.c = gr(q.c, 3); q.w = gr(q.w, 1); }
      return q; }
    // boîte tournée autour de la verticale, écrite directement dans des tableaux (beaucoup plus rapide que BoxGeometry)
    fbox(w, h, d, col, x, y, z, ry = 0, mat = 0) { const q = this.fq_(col, mat, 36), U = unitBox(), cs = Math.cos(ry), sn = Math.sin(ry), C = colOf(col), wd = this.wid, P = q.p, N = q.nn, Cc = q.c;
      for (let i = 0; i < 108; i += 3) { const lx = U.p[i] * w, ly = U.p[i + 1] * h, lz = U.p[i + 2] * d, nx = U.n[i], nz = U.n[i + 2], o = q.n * 3;
        P[o] = x + lx * cs + lz * sn; P[o + 1] = y + ly; P[o + 2] = z - lx * sn + lz * cs; N[o] = nx * cs + nz * sn; N[o + 1] = U.n[i + 1]; N[o + 2] = -nx * sn + nz * cs; Cc[o] = C[0]; Cc[o + 1] = C[1]; Cc[o + 2] = C[2]; q.w[q.n++] = wd; } return this; }
    // quadrilatère a0 a1 c1 c0 (deux triangles a0 a1 c1 / a0 c1 c0), normale de la face
    fquad(a0, a1, c1, c0, col, mat = 0) { const q = this.fq_(col, mat, 6), C = colOf(col), wd = this.wid, ux = a1[0] - a0[0], uy = a1[1] - a0[1], uz = a1[2] - a0[2], vx = c1[0] - a0[0], vy = c1[1] - a0[1], vz = c1[2] - a0[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (const Pt of [a0, a1, c1, a0, c1, c0]) { const o = q.n * 3; q.p[o] = Pt[0]; q.p[o + 1] = Pt[1]; q.p[o + 2] = Pt[2]; q.nn[o] = nx; q.nn[o + 1] = ny; q.nn[o + 2] = nz; q.c[o] = C[0]; q.c[o + 1] = C[1]; q.c[o + 2] = C[2]; q.w[q.n++] = wd; } return this; }
    done() {
      for (const q of this.fq.values()) { if (!q.n) continue; const g = new THREE.BufferGeometry(), n3 = q.n * 3; g.setAttribute('position', new THREE.BufferAttribute(q.p.slice(0, n3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(q.nn.slice(0, n3), 3)); g.setAttribute('color', new THREE.BufferAttribute(q.c.slice(0, n3), 3));
        g.userData.pat = q.pat; g.userData.sk = q.sk; g.userData.widArr = q.w.slice(0, q.n); this.parts[q.mat].push(g); } this.fq.clear();
      const g = super.done(), n = g.attributes.position.count, w = new Float32Array(n); let o = 0;
      for (let m = 0; m < this.parts.length; m++) for (const q of this.parts[m]) { const c = q.attributes.position.count; if (q.userData.widArr) w.set(q.userData.widArr, o); else w.fill(q.userData.wid || 0, o, o + c); o += c; }
      g.setAttribute('wid', new THREE.BufferAttribute(w, 1)); return g; }
  }
  // géométrie simple (faces texturées, vues des fenêtres, glaces, tableaux)
  class Acc {
    constructor() { this.p = []; this.n = []; this.uv = []; this.w = []; }
    add(geo, M, wid, uk = .5, vk = uk) { const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, U = g.attributes.uv, v = new THREE.Vector3(), nn = new THREE.Vector3(0, 0, 1).applyMatrix3(new THREE.Matrix3().getNormalMatrix(M)).normalize();
      for (let i = 0; i < P.count; i++) { v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(M); this.p.push(v.x, v.y, v.z); this.n.push(nn.x, nn.y, nn.z); this.uv.push(U ? U.getX(i) * uk : 0, U ? U.getY(i) * vk : 0); this.w.push(wid); } }
    geo() { if (!this.p.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('wid', new THREE.Float32BufferAttribute(this.w, 1)); g.computeBoundingSphere(); return g; }
  }
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0) => b.fbox(w, h, d, col, x, y, z, ry, mat);
  const dot = (b, r, col, x, y, z, mat = 0) => b.add(new THREE.IcosahedronGeometry(r, 0), col, b.M(x, y, z), mat);
  // une rangée de petites boîtes identiques (denticules) en une seule géométrie
  const rowGeo = (n, w, h, d, step) => { const base = new THREE.BoxGeometry(w, h, d).toNonIndexed(), P = base.attributes.position.array, Nn = base.attributes.normal.array, c = P.length, pos = new Float32Array(c * n), nor = new Float32Array(c * n);
    for (let k = 0; k < n; k++) { for (let i = 0; i < c; i += 3) { pos[k * c + i] = P[i] + k * step; pos[k * c + i + 1] = P[i + 1]; pos[k * c + i + 2] = P[i + 2]; } nor.set(Nn, k * c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g; };
  const dark = (c, k = .78) => new THREE.Color(c).multiplyScalar(k).getHex(), light = (c, k = .3) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex();
  // repère d'une face de mur : la ligne (x ou z = e), son étendue t0..t1, la normale vers la pièce
  function faceFrame(horiz, e, t0, t1, nrm) {
    const nx = horiz ? 0 : nrm, nz = horiz ? nrm : 0, ax = nz, az = -nx, pos = ax + az > 0, L = t1 - t0;
    const O3 = horiz ? new THREE.Vector3(pos ? t0 : t1, 0, e) : new THREE.Vector3(e, 0, pos ? t0 : t1), A3 = new THREE.Vector3(ax, 0, az), N3 = new THREE.Vector3(nx, 0, nz);
    const M = new THREE.Matrix4().makeBasis(A3, new THREE.Vector3(0, 1, 0), N3).setPosition(O3);
    return { horiz, e, t0, t1, L, nx, nz, ax, az, M, ry: Math.atan2(nx, nz), s: t => pos ? t - t0 : t1 - t, P: (s, y, w = 0) => [O3.x + ax * s + nx * w, y, O3.z + az * s + nz * w] };
  }
  // forme d'une baie dans le plan du mur (s, y) : rectangle, cintre, anse de panier ou œil-de-bœuf
  function bayPts(kind, s0, s1, y0, y1, CH) {
    const pts = [], hw = (s1 - s0) / 2, c = (s0 + s1) / 2, arc = (ys, h, n = 14) => { for (let i = 0; i <= n; i++) { const t = PI - i / n * PI; pts.push([c + hw * Math.cos(t), ys + h * Math.sin(t)]); } };
    if (kind === 'oeil') { for (let i = 0; i < 20; i++) { const t = i / 20 * TAU; pts.push([c + hw * Math.cos(t), (y0 + y1) / 2 + hw * Math.sin(t)]); } return pts; }
    pts.push([s0, y0]); pts.push([s1, y0]);
    if (kind === 'rect') { pts.push([s1, y1]); pts.push([s0, y1]); return pts; }
    const h = kind === 'arc' ? hw : Math.min(hw, y1 - y0 - .4), ys = y1 - h; pts.push([s1, ys]); const tmp = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * PI; tmp.push([c + hw * Math.cos(t), ys + h * Math.sin(t)]); } pts.push(...tmp); pts.push([s0, ys]); return pts;
  }
  // hauteur des baies selon le style
  const winY = (st, CH) => { const y1 = Math.min(CH - 1.35, 4.8); return st === 'fen' ? [1.05, y1] : st === 'oeil' ? [CH - 2.45, CH - 1.15] : [.1, y1]; };
  const winKind = st => st === 'cintree' ? 'arc' : st === 'oeil' ? 'oeil' : 'rect';
  const opH = (t, w, CH) => t === 'a' ? [3.0, Math.min(w / 2, CH - 1.0 - 3.0)] : t === 'd' ? [3.3, Math.min(w / 2, CH - 1.1 - 3.3)] : [t === 'p' ? 3.7 : 3.9, 0];

  // ---------- les grands escaliers de marbre : la volée qui monte, ou la cage qui descend vers l'étage du dessous ----------
  const MARB = 0xf3efe7, MARB2 = 0xe3dccd, CARP = 0x9a2f3a, BALU = 0xf8f4ec, CAGE = 0xe9e1d0;
  function stairsGeo(b, pd, CH, sk) {
    const RH = CH + GAP; // la volée monte jusqu'au plancher de l'étage du dessus (posé juste au-dessus du plafond)
    for (const q of pd.st) {
      const along = q.ax, s = q.s, a0 = along === 'x' ? q.x0 : q.z0, a1 = (along === 'x' ? q.x1 : q.z1) + 1, b0 = along === 'x' ? q.z0 : q.x0, b1 = (along === 'x' ? q.z1 : q.x1) + 1, L = a1 - a0, Wd = b1 - b0;
      const P = (a, bb, y) => along === 'x' ? [a, y, bb] : [bb, y, a]; // (le long, en travers, hauteur) → (x, y, z)
      const A = t => s > 0 ? a0 + t * L : a1 - t * L, n = Math.max(12, Math.round(RH / .19)), bc = (b0 + b1) / 2;
      const box = (la, lb, h, col, a, bb, y) => along === 'x' ? bx(b, la, h, lb, col, a, y, bb) : bx(b, lb, h, la, col, bb, y, a);
      if (!q.up) { // à l'étage : l'ouverture de l'escalier, bordée d'une balustrade dorée (sauf du côté du palier) ; par l'ouverture, on voit la volée et l'étage du dessous
        b.S(sk.stone); const nb = Math.max(2, Math.round(L / .45)), nw = Math.max(2, Math.round(Wd / .45));
        for (const bb of [b0 + .05, b1 - .05]) { box(L, .14, .08, GOLD, (a0 + a1) / 2, bb, 1.05); for (let k = 0; k <= nb; k++) box(.09, .09, 1.0, BALU, a0 + k * L / nb, bb, .5); }
        box(.14, Wd, .08, GOLD, A(0), bc, 1.05); for (let k = 0; k <= nw; k++) box(.09, .09, 1.0, BALU, A(0), b0 + k * Wd / nw, .5); b.S(null);
        if (q.grand) for (const ta of [0, 1]) for (const bb of [b0 + .05, b1 - .05]) { const p = P(A(ta), bb, 0); b.S(sk.stone); bx(b, .26, 1.16, .26, MARB2, p[0], .58, p[2]); bx(b, .32, .08, .32, MARB, p[0], 1.2, p[2]); b.S(null);
          b.S(sk.gold); b.cyl(.06, .11, .1, 10, GOLD, p[0], 1.29, p[2]); dot(b, .15, GOLD, p[0], 1.46, p[2]); b.cyl(.13, .08, .08, 10, GOLD, p[0], 1.63, p[2]); b.cone(.06, .2, 8, GOLD, p[0], 1.76, p[2]); b.S(null); }
        continue; }
      // les marches : marbre plein (deux tons), nez de marche clair, tapis rouge et tringles dorées
      b.S(sk.stone); for (let i = 0; i < n; i++) { const t1 = (i + 1) / n, dl = L / n + .002; box(dl, Wd - .1, RH * t1, i % 2 ? MARB : MARB2, A((i + .5) / n), bc, RH * t1 / 2); box(dl * .22, Wd - .1, .04, 0xfbf8f2, A(t1) - s * dl * .11, bc, RH * t1 - .02); } b.S(null);
      const cw = Wd * (q.grand ? .62 : .46); b.S(sk.velvet); for (let i = 0; i < n; i++) box(L / n + .002, cw, .03, CARP, A((i + .5) / n), bc, RH * (i + 1) / n + .015); b.S(null);
      b.S(sk.gold); for (let i = 1; i < n; i += 2) box(.03, cw + .04 * Wd, .035, GOLD, A(i / n), bc, RH * i / n + .035);
      if (q.grand) for (const sg of [-1, 1]) for (let i = 0; i < n; i++) box(L / n + .002, .06, .034, GOLD, A((i + .5) / n), bc + sg * cw / 2, RH * (i + 1) / n + .017); b.S(null);
      // rampes : balustres de marbre sous une main courante dorée, piliers de départ (à grands candélabres pour l'escalier d'honneur)
      const rail = (bb, ya, yb) => { const pa = P(A(0), bb, ya), pb = P(A(1), bb, yb), xa = new THREE.Vector3(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]), len = xa.length(); xa.normalize();
        const za = new THREE.Vector3().crossVectors(xa, new THREE.Vector3(0, 1, 0)).normalize(), ya2 = new THREE.Vector3().crossVectors(za, xa);
        b.S(sk.gold); b.add(new THREE.BoxGeometry(len, .09, .13), GOLD, new THREE.Matrix4().makeBasis(xa, ya2, za).setPosition(new THREE.Vector3((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2))); b.S(null); };
      for (const bb of [b0 + .1, b1 - .1]) {
        rail(bb, 1.05, RH + 1.05); b.S(sk.stone); for (let t = .03; t < .99; t += .055) { const y = RH * Math.ceil(t * n) / n, p = P(A(t), bb, y + .5); bx(b, .1, 1.0, .1, BALU, p[0], p[1], p[2]); dot(b, .07, BALU, p[0], y + .35, p[2]); } b.S(null);
        if (q.grand) { const pn = P(A(0) - s * .32, bb + (bb < bc ? -.12 : .12), 0); b.S(sk.stone); bx(b, .7, .16, .7, MARB2, pn[0], .08, pn[2]); bx(b, .52, 1.12, .52, MARB, pn[0], .72, pn[2]); bx(b, .66, .12, .66, MARB2, pn[0], 1.34, pn[2]); b.S(null);
          b.S(sk.gold); b.cyl(.05, .1, .55, 10, GOLD, pn[0], 1.67, pn[2]); dot(b, .09, GOLD, pn[0], 1.96, pn[2]);
          for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4, ex = pn[0] + Math.cos(a) * .26, ez = pn[2] + Math.sin(a) * .26; b.add(new THREE.BoxGeometry(.27, .035, .035), GOLD, b.M((pn[0] + ex) / 2, 1.98, (pn[2] + ez) / 2, 0, -a, 0)); b.cyl(.045, .03, .07, 8, GOLD, ex, 2.03, ez); }
          b.S(null); b.S(sk.ceramic); for (let k = 0; k < 5; k++) { const a = k / 4 * TAU + PI / 4, r = k < 4 ? .26 : 0, ex = pn[0] + Math.cos(a) * r, ez = pn[2] + Math.sin(a) * r, cy = k < 4 ? 2.16 : 2.2; b.cyl(.024, .024, .2, 6, 0xfff8ec, ex, cy, ez); dot(b, .04, 0xffd27a, ex, cy + .15, ez, 1); } b.S(null); }
        else { const pn = P(A(0) - s * .15, bb, .7); b.S(sk.stone); bx(b, .32, 1.4, .32, MARB2, pn[0], pn[1], pn[2]); b.S(null); b.S(sk.gold); dot(b, .16, GOLD, pn[0], pn[1] + .85, pn[2]); b.S(null); } }
    }
  }
  function planShell(m) {
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); } if (m._pv && m._pv.tex) m._pv.tex.dispose();
    delete m._cx; delete m._fw; delete m._gl; m._pd = null; const pd = planData(m), { W, H, T, R, CH, pl } = pd, sk = SK(), n = pl.n || 1;
    let edges = 0; for (let i = 0; i < W * H; i++) if (T[i] === FLOOR) { const x = i % W, z = (i - x) / W; for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx >= 0 && zz >= 0 && xx < W && zz < H && T[zz * W + xx] !== FLOOR) edges++; } }
    const rich = edges < 1700; // denticules, filets dorés partout (sauf dans les palais immenses)
    const ti = (x, z) => x < 0 || z < 0 || x >= W || z >= H ? VOID : T[z * W + x], isF = (x, z) => ti(x, z) === FLOOR, solid = t => t === WALL || t === OPEN || t === DOOR;
    const g = new THREE.Group(), b = new CB(990), bs = new CB(991), texW = {}, flA = {}, views = { t: new Acc(), s: new Acc() }, mir = new Acc(), art = {}, ceil = new Acc();
    const roomOf = r => pd.room(r);
    // ----- segments de mur (ce qui s'abaisse ensemble) -----
    const hs = new Int32Array(W * H).fill(-1), vs = new Int32Array(W * H).fill(-1), segs = [null];
    for (let z = 0; z < H; z++) { let s = -1; for (let x = 0; x < W; x++) { const i = z * W + x; if (solid(T[i]) && (isF(x, z - 1) || isF(x, z + 1))) { if (s < 0) { s = segs.length; segs.push({ o: 'h', c: z, a: x, b: x }); } segs[s].b = x; hs[i] = s; } else s = -1; } }
    for (let x = 0; x < W; x++) { let s = -1; for (let z = 0; z < H; z++) { const i = z * W + x; if (solid(T[i]) && (isF(x - 1, z) || isF(x + 1, z))) { if (s < 0) { s = segs.length; segs.push({ o: 'v', c: x, a: z, b: z }); } segs[s].b = z; vs[i] = s; } else s = -1; } }
    const capW = (x, z) => { const i = z * W + x; if (hs[i] > 0) return hs[i]; if (vs[i] > 0) return vs[i]; for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = zz * W + xx; if (hs[j] > 0) return hs[j]; if (vs[j] > 0) return vs[j]; } return 0; };
    // ----- fenêtres par face -----
    const winOf = new Map(); for (const w of pl.wins) { const horiz = !!w.nz, e = horiz ? (w.nz < 0 ? w.z : w.z + 1) : (w.nx < 0 ? w.x : w.x + 1), key = (horiz ? 'h' : 'v') + (horiz ? w.nz : w.nx) + '|' + e; (winOf.get(key) || winOf.set(key, []).get(key)).push(w); }
    const beams = [];
    // ----- faces intérieures : courses le long d'une ligne, côté pièce -----
    const runs = new Map(); const push = (key, t, item) => { (runs.get(key) || runs.set(key, []).get(key)).push(Object.assign({ t }, item)); };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (T[z * W + x] !== FLOOR) continue; const r = R[z * W + x];
      if (solid(ti(x, z - 1))) push('h1|' + z, x, { k: ti(x, z - 1), wid: hs[(z - 1) * W + x], r, cx: x, cz: z - 1 });
      if (solid(ti(x, z + 1))) push('h-1|' + (z + 1), x, { k: ti(x, z + 1), wid: hs[(z + 1) * W + x], r, cx: x, cz: z + 1 });
      if (solid(ti(x - 1, z))) push('v1|' + x, z, { k: ti(x - 1, z), wid: vs[z * W + x - 1], r, cx: x - 1, cz: z });
      if (solid(ti(x + 1, z))) push('v-1|' + (x + 1), z, { k: ti(x + 1, z), wid: vs[z * W + x + 1], r, cx: x + 1, cz: z }); }
    const opDone = new Set(), y1w = Math.min(CH - 1.35, 4.8);
    for (const [key, list] of runs) { list.sort((a, c) => a.t - c.t); const horiz = key[0] === 'h', nrm = +key.slice(1, key.indexOf('|')), e = +key.slice(key.indexOf('|') + 1);
      let s = 0; for (let i = 1; i <= list.length; i++) { if (i < list.length && list[i].t === list[i - 1].t + 1 && list[i].wid === list[i - 1].wid && list[i].r === list[i - 1].r) continue;
        faceRun(horiz, nrm, e, list.slice(s, i), (winOf.get((horiz ? 'h' : 'v') + nrm + '|' + e) || [])); s = i; } }
    function faceRun(horiz, nrm, e, items, wins) {
      const t0 = items[0].t, t1 = items[items.length - 1].t + 1, F = faceFrame(horiz, e, t0, t1, nrm), L = F.L, rm = roomOf(items[0].r), wid = items[0].wid > 0 ? items[0].wid : 0;
      const paint = PAINTS[rm.wall], wallCol = paint ? paint[0] : 0xf4efe6, dk = new THREE.Color(wallCol).getHSL({}).l < .42, trim = paint ? light(wallCol, dk ? .14 : .45) : 0xf7f3ea, gold = GOLD;
      b.wid = wid; bs.wid = 0;
      // baies : arches et portes (encoches qui descendent au sol), fenêtres (trous)
      const notches = []; let j = 0; while (j < items.length) { const it = items[j]; if (it.k === WALL) { j++; continue; } let k2 = j; while (k2 + 1 < items.length && items[k2 + 1].k === it.k) k2++;
        const wa = items[j].t, wb2 = items[k2].t + 1, type = it.k === DOOR ? 'd' : (pl.ops[it.cx + ',' + it.cz] || 'a'), sa = Math.min(F.s(wa), F.s(wb2)), sb = Math.max(F.s(wa), F.s(wb2)); notches.push({ s0: sa, s1: sb, type, cells: items.slice(j, k2 + 1) }); j = k2 + 1; }
      const holes = []; for (const w of wins) { const sc = F.s(w.u); if (sc < w.w / 2 - .02 || sc > L - w.w / 2 + .02) continue; const [y0, y1] = winY(w.st, CH); holes.push({ win: w, s0: sc - w.w / 2, s1: sc + w.w / 2, y0, y1, kind: winKind(w.st) }); }
      // le mur : contour avec les encoches, trous des fenêtres
      const sh = new THREE.Shape(); sh.moveTo(0, 0); for (const nt of notches.sort((a, c) => a.s0 - c.s0)) { const [ys, hh] = opH(nt.type, nt.s1 - nt.s0, CH); sh.lineTo(nt.s0, 0); sh.lineTo(nt.s0, ys);
        if (hh > .05) for (let i = 1; i <= 16; i++) { const t = PI - i / 16 * PI; sh.lineTo((nt.s0 + nt.s1) / 2 + (nt.s1 - nt.s0) / 2 * Math.cos(t), ys + hh * Math.sin(t)); } else sh.lineTo(nt.s1, ys);
        sh.lineTo(nt.s1, 0); }
      sh.lineTo(L, 0); sh.lineTo(L, CH); sh.lineTo(0, CH); sh.lineTo(0, 0);
      for (const h of holes) { const p = new THREE.Path(), pts = bayPts(h.kind, h.s0, h.s1, h.y0, h.y1, CH); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); sh.holes.push(p); }
      const sg = new THREE.ShapeGeometry(sh, 1);
      if (paint) { b.S(sk.paint); b.add(sg, wallCol, F.M, 0, true); b.S(null); } else (texW[rm.wall] || (texW[rm.wall] = new Acc())).add(sg, F.M, wid);
      // plinthe, cimaise, panneaux à filets dorés, pilastres entre les baies ; corniche à denticules et frise tout le long
      const blocks = [...notches.map(q => [q.s0 - .22, q.s1 + .22]), ...holes.map(q => [q.s0 - .24, q.s1 + .24])].sort((a, c) => a[0] - c[0]), segs2 = []; let u = 0;
      for (const [a, c] of blocks) { if (a > u + .05) segs2.push([u, a]); u = Math.max(u, c); } if (L > u + .05) segs2.push([u, L]);
      const R2 = (u0, u1, y, hh, d, col, k = sk.paint) => { if (u1 - u0 < .02) return; b.S(k); const p = F.P((u0 + u1) / 2, y, d / 2); bx(b, u1 - u0, hh, d, col, p[0], p[1], p[2], F.ry); b.S(null); };
      const V2 = (s, y0, y1, w, d, col, k = sk.paint) => { if (y1 - y0 < .02) return; b.S(k); const p = F.P(s, (y0 + y1) / 2, d / 2); bx(b, w, y1 - y0, d, col, p[0], p[1], p[2], F.ry); b.S(null); };
      for (const [u0, u1] of segs2) { R2(u0, u1, .15, .3, .05, trim); R2(u0, u1, .31, .035, .075, trim); R2(u0, u1, 1.05, .07, .055, trim);
        const pw = u1 - u0; if (pw < .7) continue; const np = Math.max(1, Math.round(pw / 1.7)), gap = .16, ytop = CH - 1.35;
        for (let k = 0; k < np; k++) { const a = u0 + gap + k * (pw - gap) / np, c = u0 + (k + 1) * (pw - gap) / np;
          for (const [y0, y1] of [[.46, .9], [1.36, ytop]]) { if (y1 - y0 < .3 || c - a < .3) continue; R2(a, c, y0, .03, .024, trim); R2(a, c, y1, .03, .024, trim); V2(a, y0, y1, .03, .024, trim); V2(c, y0, y1, .03, .024, trim);
            if (y0 > 1 && (rich || n < 4)) { const iy0 = y0 + .08, iy1 = y1 - .08; R2(a + .08, c - .08, iy0, .01, .014, gold, sk.gold); R2(a + .08, c - .08, iy1, .01, .014, gold, sk.gold); V2(a + .08, iy0, iy1, .01, .014, gold, sk.gold); V2(c - .08, iy0, iy1, .01, .014, gold, sk.gold); } } }
        // appliques dorées à deux bougies
        if (rm.app && pw > 1.25) { const ax = (u0 + u1) / 2; b.S(sk.gold); let p = F.P(ax, 2.7, .03); bx(b, .1, .24, .05, gold, p[0], p[1], p[2], F.ry);
          for (const t of [-1, 1]) { p = F.P(ax + t * .17, 2.62, .14); b.cyl(.022, .018, .04, 8, gold, p[0], p[1], p[2]); const q = F.P(ax + t * .09, 2.6, .09); b.add(new THREE.BoxGeometry(.18, .02, .02), gold, b.M(q[0], q[1], q[2], 0, F.ry, 0)); b.S(sk.ceramic); b.cyl(.012, .012, .12, 8, 0xfff8ec, p[0], p[1] + .08, p[2]); b.S(null); dot(b, .022, 0xffd27a, p[0], p[1] + .17, p[2], 1); b.S(sk.gold); }
          b.S(null); }
        // tableaux sur les grands murs sans fenêtre ; glaces dans la galerie
        if (pw > 2.4) { const c = (u0 + u1) / 2;
          if (rm.k === 'galerie') { const mw = Math.min(1.7, pw - .9), my0 = .5, my1 = y1w; const p = F.P(c, (my0 + my1) / 2, .02), mg = new THREE.ShapeGeometry(new THREE.Shape(bayPts('arc', -mw / 2, mw / 2, my0, my1, CH).map(q => new THREE.Vector2(q[0], q[1]))), 1);
            mir.add(mg, new THREE.Matrix4().makeBasis(new THREE.Vector3(F.ax, 0, F.az), new THREE.Vector3(0, 1, 0), new THREE.Vector3(F.nx, 0, F.nz)).setPosition(new THREE.Vector3(...F.P(c, 0, .035))), wid);
            b.S(sk.gold); V2(c - mw / 2 - .05, my0, my1 - mw / 2, .1, .06, gold, sk.gold); V2(c + mw / 2 + .05, my0, my1 - mw / 2, .1, .06, gold, sk.gold); R2(c - mw / 2 - .05, c + mw / 2 + .05, my0, .1, .06, gold, sk.gold);
            b.add(new THREE.TorusGeometry(mw / 2 + .05, .05, 4, 12, PI), gold, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(c, my1 - mw / 2, .04)), 0, true); b.S(null); }
          else if (n < 30 || rich) { const fw = Math.min(1.9, pw * .45), fh = fw * .74, fy = Math.min(CH - 1.9, 3.6), k = (Math.round(F.e * 3 + c * 7) % 6 + 6) % 6; b.S(sk.gold); const p = F.P(c, fy, .03); bx(b, fw + .16, fh + .16, .06, gold, p[0], p[1], p[2], F.ry); b.S(null);
            (art[k] || (art[k] = new Acc())).add(new THREE.PlaneGeometry(fw, fh), new THREE.Matrix4().makeBasis(new THREE.Vector3(F.ax, 0, F.az), new THREE.Vector3(0, 1, 0), new THREE.Vector3(F.nx, 0, F.nz)).setPosition(new THREE.Vector3(...F.P(c, fy, .064))), wid, 1, 1); } } }
      // pilastres cannelés entre les fenêtres (et de loin en loin sur les murs pleins), chapiteaux dorés au salon et à la galerie
      const pil = []; const hs2 = holes.slice().sort((a, c) => a.s0 - c.s0); for (let i = 0; i + 1 < hs2.length; i++) { const g2 = hs2[i + 1].s0 - hs2[i].s1; if (g2 > .95) pil.push((hs2[i].s1 + hs2[i + 1].s0) / 2); }
      if (!hs2.length) for (const [u0, u1] of segs2) if (u1 - u0 > 4.6) for (let k = 1, nn = Math.floor((u1 - u0) / 3.4); k < nn; k++) pil.push(u0 + k * (u1 - u0) / nn);
      const gk = rm.k === 'salon' || rm.k === 'galerie' || rm.k === 'musique';
      for (const s of pil) { V2(s, .3, CH - 1.0, .44, .08, trim); for (const t of [-.12, 0, .12]) V2(s + t, .65, CH - 1.35, .025, .095, dark(trim, .9)); R2(s - .3, s + .3, .3, .22, .11, trim); R2(s - .3, s + .3, CH - 1.08, .2, .12, gk ? gold : trim, gk ? sk.gold : sk.paint); }
      // corniche, frise, denticules
      R2(0, L, CH - .12, .24, .22, trim); R2(0, L, CH - .31, .13, .15, trim); R2(0, L, CH - .41, .06, .09, trim); R2(0, L, CH - .95, .05, .055, trim); if (gk) R2(0, L, CH - .48, .018, .1, gold, sk.gold);
      if (rich && L > .4) { b.S(sk.paint); b.add(rowGeo(Math.floor((L - .1) / .17), .06, .06, .06, .17), trim, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(.09, CH - .54, .07)), 0, true); b.S(null); }
      // frise du parquet le long du mur
      { const fk = FLOORK[rm.floor], fb = fk === 3 || rm.floor === 'marbre' || rm.floor === 'damier_noir' ? 0x2a2a30 : fk === 4 || fk === 5 ? 0x4a2c18 : 0x6a4428, p = F.P(L / 2, .006, .2); bs.S(sk.wood); bx(bs, L, .008, .26, fb, p[0], p[1], p[2], F.ry); bs.S(null); }
      // fenêtres : embrasure à volets intérieurs, chambranle, menuiserie à petits bois, crémone dorée, rideaux, vue dehors
      for (const h of holes) winDetail(F, h, rm, trim, wallCol, wid);
      // arches et portes : une seule fois par baie (elle traverse le mur)
      for (const nt of notches) { const key = nt.cells.map(c => c.cx + ',' + c.cz).join(';'); if (nt.type !== 'd' && opDone.has(key)) { archFace(F, nt, trim, gk, false); continue; } opDone.add(key); archFace(F, nt, trim, gk, true); }
    }
    function winDetail(F, h, rm, trim, wallCol, wid) {
      const win = h.win, w = h.s1 - h.s0, sc = (h.s0 + h.s1) / 2, pts = bayPts(h.kind, h.s0, h.s1, h.y0, h.y1, CH), dJ = -.36, dO = -1, stone = 0xe9dcc3, white = 0xf7f3ea, cur = CURT[win.c || rm.curt] || CURT.rouge;
      // embrasure (intérieure peinte, extérieure en pierre)
      const strip = (d0, d1, col, k) => { b.S(k); for (let i = 0; i < pts.length; i++) { const p0 = pts[i], p1 = pts[(i + 1) % pts.length]; if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 1e-4) continue;
          b.fquad(F.P(p0[0], p0[1], d0), F.P(p1[0], p1[1], d0), F.P(p1[0], p1[1], d1), F.P(p0[0], p0[1], d1), col); } b.S(null); };
      strip(0, dJ, wallCol, sk.paint); strip(dJ, dO, stone, sk.stone);
      // volets intérieurs repliés dans l'embrasure (deux panneaux moulurés de chaque côté)
      if (h.kind !== 'oeil') for (const sgn of [-1, 1]) { const s = sgn < 0 ? h.s0 + .025 : h.s1 - .025, top = h.kind === 'arc' ? h.y1 - w / 2 : h.y1; b.S(sk.paint);
        for (const [y0, y1] of [[h.y0 + .08, h.y0 + (top - h.y0) * .42], [h.y0 + (top - h.y0) * .46, top - .06]]) { const p = F.P(s, (y0 + y1) / 2, dJ / 2); b.add(new THREE.BoxGeometry(.03, y1 - y0, -dJ - .06), light(wallCol, .25), b.M(p[0], p[1], p[2], 0, F.ry, 0)); } b.S(null); }
      // chambranle mouluré autour de la baie, clé de voûte
      b.S(sk.paint); if (h.kind === 'oeil') b.add(new THREE.TorusGeometry(w / 2 + .06, .06, 4, 14), trim, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(sc, (h.y0 + h.y1) / 2, .04)), 0, true);
      else { const top = h.kind === 'arc' ? h.y1 - w / 2 : h.y1; for (const s of [h.s0 - .07, h.s1 + .07]) { const p = F.P(s, (h.y0 + top) / 2, .03); bx(b, .14, top - h.y0, .06, trim, p[0], p[1], p[2], F.ry); }
        if (h.kind === 'arc') { b.add(new THREE.TorusGeometry(w / 2 + .07, .07, 4, 14, PI), trim, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(sc, top, .03)), 0, true); const p = F.P(sc, h.y1 + .02, .06); bx(b, .2, .34, .1, trim, p[0], p[1], p[2], F.ry); b.S(sk.gold); dot(b, .04, GOLD, ...F.P(sc, h.y1 + .02, .12)); b.S(sk.paint); }
        else { const p = F.P(sc, h.y1 + .07, .03); bx(b, w + .28, .14, .06, trim, p[0], p[1], p[2], F.ry); } }
      if (win.st === 'fen' || h.y0 > .5) { const p = F.P(sc, h.y0 - .04, .1); bx(b, w + .3, .07, .22, trim, p[0], p[1], p[2], F.ry); const q = F.P(sc, h.y0 / 2, .025); bx(b, w * .8, h.y0 * .55, .03, light(trim, .1), q[0], q[1], q[2], F.ry); } b.S(null);
      // menuiserie : dormant, montant central, petits bois, imposte en éventail, crémone
      b.S(sk.paint); const top = h.kind === 'arc' ? h.y1 - w / 2 : h.y1, mw = .055;
      if (h.kind === 'oeil') { b.add(new THREE.TorusGeometry(w / 2 - .03, .035, 4, 12), white, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(sc, (h.y0 + h.y1) / 2, dJ)), 0, true); for (const r2 of [0, PI / 2]) { const p = F.P(sc, (h.y0 + h.y1) / 2, dJ); b.add(new THREE.BoxGeometry(w - .06, .03, .04), white, b.M(p[0], p[1], p[2], 0, F.ry, r2)); } }
      else { for (const s of [h.s0 + mw / 2, h.s1 - mw / 2, sc]) { const p = F.P(s, (h.y0 + top) / 2, dJ); bx(b, s === sc ? .07 : mw, top - h.y0, .07, white, p[0], p[1], p[2], F.ry); }
        let p = F.P(sc, h.y0 + .03, dJ); bx(b, w, .06, .07, white, p[0], p[1], p[2], F.ry); p = F.P(sc, top - .02, dJ); bx(b, w, .06, .07, white, p[0], p[1], p[2], F.ry);
        for (const s of [sc - w / 4, sc + w / 4]) { p = F.P(s, (h.y0 + top) / 2, dJ); bx(b, .028, top - h.y0, .045, white, p[0], p[1], p[2], F.ry); }
        for (let y = h.y0 + .62; y < top - .2; y += .62) { p = F.P(sc, y, dJ); bx(b, w, .028, .045, white, p[0], p[1], p[2], F.ry); }
        if (h.kind === 'arc') { for (const t of [PI / 4, PI / 2, 3 * PI / 4]) { const r2 = w / 2 - .04, q = F.P(sc + Math.cos(t) * r2 / 2, top + Math.sin(t) * r2 / 2, dJ); b.add(new THREE.BoxGeometry(r2, .028, .045), white, b.M(q[0], q[1], q[2], 0, F.ry, 0).multiply(new THREE.Matrix4().makeRotationZ(t * (F.nx + F.nz > 0 ? 1 : 1)))); }
          b.add(new THREE.TorusGeometry(w / 2 - .03, .03, 4, 12, PI), white, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(sc, top, dJ)), 0, true); }
        b.S(sk.gold); p = F.P(sc + .05, 1.15, dJ + .05); bx(b, .022, top - h.y0 - .3, .022, GOLD, p[0], (h.y0 + top) / 2, p[2], F.ry); p = F.P(sc + .09, 1.15, dJ + .07); bx(b, .1, .03, .03, GOLD, p[0], p[1], p[2], F.ry); }
      b.S(null);
      // vue dehors (au nu extérieur du mur)
      const vw = w + .1, vh = h.y1 - h.y0 + .1; views[h.kind === 'oeil' ? 's' : 't'].add(new THREE.PlaneGeometry(vw, vh), new THREE.Matrix4().makeBasis(new THREE.Vector3(F.ax, 0, F.az), new THREE.Vector3(0, 1, 0), new THREE.Vector3(F.nx, 0, F.nz)).setPosition(new THREE.Vector3(...F.P(sc, (h.y0 + h.y1) / 2, dO + .02))), wid, 1, 1);
      // rideaux de velours sur les côtés (ils laissent passer le soleil), embrasses à glands, cantonnière frangée d'or
      if (cur[0] && h.kind !== 'oeil') { const col = cur[0], ch = h.y1 + .55, sk2 = (win.c || rm.curt) === 'voile' ? sk.fabric : sk.velvet; b.S(sk2);
        for (const sgn of [-1, 1]) { const cx = sgn < 0 ? h.s0 - .3 : h.s1 + .3; for (let k = 0; k < 3; k++) { const p = F.P(cx + sgn * (k - 1) * .1, ch / 2, .16 + (k % 2) * .03); b.add(new THREE.BoxGeometry(.13, ch, .06), k % 2 ? dark(col, .8) : col, b.M(p[0], p[1], p[2], 0, F.ry, 0), 0, true); }
          b.S(sk.gold); b.add(new THREE.TorusGeometry(.12, .018, 4, 10), GOLD, b.M(...F.P(cx, 1.15, .22), PI / 2, F.ry, 0), 0, true); dot(b, .045, GOLD, ...F.P(cx + sgn * .14, 1.0, .24)); b.S(sk2); }
        let p = F.P(sc, ch - .12, .2); b.add(new THREE.BoxGeometry(w + 1.0, .42, .1), col, b.M(p[0], p[1], p[2], 0, F.ry, 0)); b.S(sk.gold); p = F.P(sc, ch - .34, .21); bx(b, w + 1.02, .04, .11, GOLD, p[0], p[1], p[2], F.ry);
        p = F.P(sc, ch - .39, .225); bx(b, w + .98, .06, .025, GOLD, p[0], p[1], p[2], F.ry); p = F.P(sc, ch + .14, .12); bx(b, w + 1.2, .035, .035, GOLD, p[0], p[1], p[2], F.ry); b.S(null); }
      // rayon de soleil : le contour intérieur de la baie
      const yt = h.kind === 'arc' ? h.y1 - w / 2 * .3 : h.y1; beams.push({ pts: [F.P(h.s0, h.y0, 0), F.P(h.s1, h.y0, 0), F.P(h.s1, yt, 0), F.P(h.s0, yt, 0)], nx: F.nx, nz: F.nz, r: win.r, wid, box: [rm.x0, rm.z0, rm.x1 + 1, rm.z1 + 1] });
    }
    function archFace(F, nt, trim, gk, first) {
      const w = nt.s1 - nt.s0, sc = (nt.s0 + nt.s1) / 2, [ys, hh] = opH(nt.type, w, CH), pts = []; pts.push([nt.s0, 0]); pts.push([nt.s0, ys]); if (hh > .05) for (let i = 1; i <= 16; i++) { const t = PI - i / 16 * PI; pts.push([sc + w / 2 * Math.cos(t), ys + hh * Math.sin(t)]); } else pts.push([nt.s1, ys]); pts.push([nt.s1, 0]);
      const col = 0xf2ede2, depth = -1;
      // archivolte moulurée, clé, impostes, pilastres de part et d'autre (sur chaque face)
      b.S(sk.paint); for (const s of [nt.s0 - .1, nt.s1 + .1]) { const p = F.P(s, ys / 2, .035); bx(b, .2, ys, .07, trim, p[0], p[1], p[2], F.ry); const q = F.P(s, ys - .06, .05); bx(b, .3, .12, .1, gk ? GOLD : trim, q[0], q[1], q[2], F.ry); }
      if (hh > .05) { b.add(new THREE.TorusGeometry(w / 2 + .1, .085, 4, 14, PI), trim, new THREE.Matrix4().multiplyMatrices(F.M, new THREE.Matrix4().makeTranslation(sc, ys, .03)).multiply(new THREE.Matrix4().makeScale(1, hh / (w / 2), 1)), 0, true);
        const p = F.P(sc, ys + hh + .05, .07); bx(b, .3, .46, .12, trim, p[0], p[1], p[2], F.ry); if (gk) { b.S(sk.gold); dot(b, .07, GOLD, ...F.P(sc, ys + hh + .02, .15)); b.S(sk.paint); } }
      else { const p = F.P(sc, ys + .08, .035); bx(b, w + .4, .16, .07, trim, p[0], p[1], p[2], F.ry); }
      for (const s of [nt.s0 - .5, nt.s1 + .5]) { if (s < .2 || s > F.L - .2) continue; const p = F.P(s, (CH - 1) / 2 + .15, .04); bx(b, .4, CH - 1.3, .08, trim, p[0], p[1], p[2], F.ry); const q = F.P(s, CH - 1.05, .06); bx(b, .52, .18, .12, gk ? GOLD : trim, q[0], q[1], q[2], F.ry); }
      b.S(null);
      if (nt.type === 'd') entryDoor(F, nt, ys, hh, trim);
      else if (nt.type === 'p') { if (first) { b.S(sk.paint); for (const sgn of [-1, 1]) { const lw = w / 2 - .05, s = sgn < 0 ? nt.s0 : nt.s1, p = F.P(s - sgn * .05, ys / 2, lw / 2 + .05); b.add(new THREE.BoxGeometry(.07, ys - .1, lw), 0xf7f3ea, b.M(p[0], p[1], p[2], 0, F.ry, 0)); // vantaux ouverts contre le mur
            for (const [y0, y1] of [[.25, ys * .42], [ys * .48, ys - .3]]) { const q = F.P(s - sgn * .095, (y0 + y1) / 2, lw / 2 + .05); b.add(new THREE.BoxGeometry(.02, y1 - y0, lw - .25), GOLD, b.M(q[0], q[1], q[2], 0, F.ry, 0)); } } b.S(null); }
        const p = F.P(sc, ys + .75, .04); b.S(sk.gold); bx(b, Math.min(w, 2.2) + .14, .9, .05, GOLD, p[0], p[1], p[2], F.ry); b.S(null); // dessus-de-porte peint
        (art[1] || (art[1] = new Acc())).add(new THREE.PlaneGeometry(Math.min(w, 2.2), .76), new THREE.Matrix4().makeBasis(new THREE.Vector3(F.ax, 0, F.az), new THREE.Vector3(0, 1, 0), new THREE.Vector3(F.nx, 0, F.nz)).setPosition(new THREE.Vector3(...F.P(sc, ys + .75, .07))), b.wid, 1, 1); }
      if (!first) return;
      // tableaux et intrados (dessous de l'arche) sur toute l'épaisseur du mur, avec rosaces dorées
      b.S(sk.paint); for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i], p1 = pts[i + 1]; if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 1e-4) continue; b.fquad(F.P(p0[0], p0[1], 0), F.P(p0[0], p0[1], depth), F.P(p1[0], p1[1], depth), F.P(p1[0], p1[1], 0), col); } b.S(null);
      if (hh > .05 && w > 1.8) { b.S(sk.gold); for (let i = 3; i < 16; i += 3) { const t = PI - i / 16 * PI, p = F.P(sc + w / 2 * Math.cos(t) * .97, ys + hh * Math.sin(t) * .97, -.5); dot(b, .05, GOLD, p[0], p[1], p[2]); } b.S(null); }
      // seuil de marbre
      for (const c of nt.cells) { bs.wid = 0; bs.S(sk.stone); bx(bs, 1, .02, 1, nt.type === 'd' ? 0xd9d2c4 : 0xf1ede6, c.cx + .5, .01, c.cz + .5); bs.S(null); }
    }
    function entryDoor(F, nt, ys, hh, trim) {
      const w = nt.s1 - nt.s0, sc = (nt.s0 + nt.s1) / 2, d = -.5, col = 0x2f4f7a; b.S(sk.paint);
      for (const sgn of [-1, 1]) { const lx = sc + sgn * w / 4, p = F.P(lx, ys / 2, d); bx(b, w / 2 - .03, ys, .09, col, p[0], p[1], p[2], F.ry);
        for (const [y0, y1] of [[.3, ys * .4], [ys * .46, ys - .25]]) { const q = F.P(lx, (y0 + y1) / 2, d + .05); bx(b, w / 2 - .34, y1 - y0, .025, dark(col, .85), q[0], q[1], q[2], F.ry); }
        b.S(sk.gold); dot(b, .05, GOLD, ...F.P(sc + sgn * .12, 1.2, d + .07)); b.S(sk.paint); }
      if (hh > .05) { views.s.add(new THREE.CircleGeometry(w / 2, 18, 0, PI), new THREE.Matrix4().makeBasis(new THREE.Vector3(F.ax, 0, F.az), new THREE.Vector3(0, 1, 0), new THREE.Vector3(F.nx, 0, F.nz)).setPosition(new THREE.Vector3(...F.P(sc, ys, d - .02))), b.wid, 1, 1);
        for (const t of [PI / 4, PI / 2, 3 * PI / 4]) { const q = F.P(sc + Math.cos(t) * w / 4, ys + Math.sin(t) * hh / 2, d); b.add(new THREE.BoxGeometry(w / 2, .035, .05), 0xf7f3ea, b.M(q[0], q[1], q[2], 0, F.ry, 0).multiply(new THREE.Matrix4().makeRotationZ(t))); } }
      b.S(null);
    }
    // ----- faces extérieures des murs du tour (vues de loin) : pierre de taille, trous des fenêtres, porte -----
    const outer = new Map(); for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const t = T[z * W + x]; if (!solid(t)) continue;
      if (ti(x, z + 1) === VOID) (outer.get('h1|' + (z + 1)) || outer.set('h1|' + (z + 1), []).get('h1|' + (z + 1))).push({ t: x, k: t, wid: capW(x, z) });
      if (ti(x, z - 1) === VOID) (outer.get('h-1|' + z) || outer.set('h-1|' + z, []).get('h-1|' + z)).push({ t: x, k: t, wid: capW(x, z) });
      if (ti(x + 1, z) === VOID) (outer.get('v1|' + (x + 1)) || outer.set('v1|' + (x + 1), []).get('v1|' + (x + 1))).push({ t: z, k: t, wid: capW(x, z) });
      if (ti(x - 1, z) === VOID) (outer.get('v-1|' + x) || outer.set('v-1|' + x, []).get('v-1|' + x)).push({ t: z, k: t, wid: capW(x, z) }); }
    for (const [key, list] of outer) { list.sort((a, c) => a.t - c.t); const horiz = key[0] === 'h', nrm = +key.slice(1, key.indexOf('|')), e = +key.slice(key.indexOf('|') + 1);
      let s = 0; for (let i = 1; i <= list.length; i++) { if (i < list.length && list[i].t === list[i - 1].t + 1 && list[i].wid === list[i - 1].wid) continue; const items = list.slice(s, i); s = i;
        const t0 = items[0].t, t1 = items[items.length - 1].t + 1, F = faceFrame(horiz, e, t0, t1, nrm), L = F.L; b.wid = items[0].wid;
        const sh = new THREE.Shape(); sh.moveTo(0, 0); const dc = items.filter(q => q.k === DOOR); if (dc.length) { const s0 = Math.min(F.s(dc[0].t), F.s(dc[dc.length - 1].t + 1)), s1 = Math.max(F.s(dc[0].t), F.s(dc[dc.length - 1].t + 1)), [ys, hh] = opH('d', s1 - s0, CH); sh.lineTo(s0, 0); sh.lineTo(s0, ys); for (let k = 1; k <= 16; k++) { const tt = PI - k / 16 * PI; sh.lineTo((s0 + s1) / 2 + (s1 - s0) / 2 * Math.cos(tt), ys + hh * Math.sin(tt)); } sh.lineTo(s1, 0); }
        sh.lineTo(L, 0); sh.lineTo(L, CH); sh.lineTo(0, CH); sh.lineTo(0, 0);
        for (const w of pl.wins) { const wh = !!w.nz; if (wh !== horiz || -(wh ? w.nz : w.nx) !== nrm) continue; const we = wh ? (w.nz < 0 ? w.z + 1 : w.z) : (w.nx < 0 ? w.x + 1 : w.x); if (we !== e) continue; const sc = F.s(w.u); if (sc < w.w / 2 || sc > L - w.w / 2) continue;
          const [y0, y1] = winY(w.st, CH), pts = bayPts(winKind(w.st), sc - w.w / 2, sc + w.w / 2, y0, y1, CH), p = new THREE.Path(); p.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) p.lineTo(pts[k][0], pts[k][1]); sh.holes.push(p); }
        b.P(G.PAT.pierre); b.add(new THREE.ShapeGeometry(sh, 1), 0xefe3c9, F.M, 0, true); b.P(0);
        const p = F.P(L / 2, CH - .1, .1); b.P(G.PAT.pierre); bx(b, L + .2, .2, .2, 0xe2d4b6, p[0], p[1], p[2], F.ry); const q = F.P(L / 2, .2, .06); bx(b, L, .4, .12, 0xd9cfba, q[0], q[1], q[2], F.ry); b.P(0); } }
    // ----- dessus des murs (vus d'en haut) -----
    for (let z = 0; z < H; z++) { let x = 0; while (x < W) { if (!solid(T[z * W + x])) { x++; continue; } const wid = capW(x, z); let x2 = x; while (x2 + 1 < W && solid(T[z * W + x2 + 1]) && capW(x2 + 1, z) === wid) x2++;
        b.wid = wid; b.S(sk.stone); bx(b, x2 - x + 1, .06, 1, 0x6f6252, (x + x2 + 1) / 2, CH + .03, z + .5); b.S(null); x = x2 + 1; } }
    // dessus de pierre des murs coupés (vue du village) : rangé sous le sol tant que le mur est debout ; pas sur les arches ni la porte
    for (let z = 0; z < H; z++) { let x = 0; while (x < W) { const wid = T[z * W + x] === WALL ? capW(x, z) : 0; if (!wid) { x++; continue; } let x2 = x; while (x2 + 1 < W && T[z * W + x2 + 1] === WALL && capW(x2 + 1, z) === wid) x2++;
        b.wid = wid + .5; b.S(sk.stone); b.fquad([x, -1, z + 1], [x2 + 1, -1, z + 1], [x2 + 1, -1, z], [x, -1, z], 0xd8ccb3); b.S(null); x = x2 + 1; } }
    b.wid = 0;
    // ----- sols (par pièce), bordure de frise le long des murs ; plafonds peints, rosaces sous les lustres -----
    for (const rm of pl.rooms) for (const pass of [0, 1]) { const cells = new Uint8Array(W * H); let any = false; for (let i = 0; i < W * H; i++) if (T[i] === FLOOR && R[i] === rm.id && pd.su[i] !== (pass ? 1 : 2)) { cells[i] = 1; any = true; } if (!any) continue; // sol sans la cage, plafond sans la volée
      const acc = flA[rm.floor] || (flA[rm.floor] = new Acc());
      for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (!cells[z * W + x]) continue; let x2 = x; while (x2 + 1 < W && cells[z * W + x2 + 1]) x2++; let z2 = z, ok = true; while (ok && z2 + 1 < H) { for (let xx = x; xx <= x2; xx++) if (!cells[(z2 + 1) * W + xx]) { ok = false; break; } if (ok) z2++; }
        for (let zz = z; zz <= z2; zz++) for (let xx = x; xx <= x2; xx++) cells[zz * W + xx] = 0; const w = x2 - x + 1, d = z2 - z + 1;
        if (!pass) { acc.add(new THREE.PlaneGeometry(w, d), new THREE.Matrix4().makeRotationX(-PI / 2).premultiply(new THREE.Matrix4().makeTranslation(x + w / 2, .004, z + d / 2)), 0, w / 2, d / 2); continue; }
        bs.S(sk.paint); bs.add(new THREE.PlaneGeometry(w, d), 0xf6f1e8, new THREE.Matrix4().makeRotationX(PI / 2).premultiply(new THREE.Matrix4().makeTranslation(x + w / 2, CH, z + d / 2)), 0, true); bs.S(null); }
    }
    // rosaces du plafond au-dessus des lustres : tournées vers le bas seulement (vues d'en haut, quand le plafond s'efface, elles disparaissent aussi)
    for (const o of m.list) if (O[o.t].ceil) { const x = o.x + .5, z = o.z + .5; bs.S(sk.paint); bs.add(new THREE.CircleGeometry(.58, 28), 0xfbf8f1, bs.M(x, CH - .015, z, PI / 2, 0, 0)); bs.S(sk.gold);
      bs.add(new THREE.RingGeometry(.46, .53, 28), GOLD, bs.M(x, CH - .022, z, PI / 2, 0, 0)); bs.add(new THREE.RingGeometry(.2, .24, 20), GOLD, bs.M(x, CH - .024, z, PI / 2, 0, 0)); bs.add(new THREE.CircleGeometry(.08, 12), GOLD, bs.M(x, CH - .026, z, PI / 2, 0, 0)); bs.S(null); }
    // dehors (la cour d'honneur et les jardins, vus des fenêtres et d'en haut) : gazon tondu à bandes, allées de gravier le long des façades,
    // et dans chaque cour fermée, un bassin à vasque au milieu d'une croisée d'allées
    const efl = pl.fl || 0, lw = new CB(992); lw.P(G.PAT.gazon); bx(lw, W + 8, .04, H + 8, 0x6ea946, W / 2, -.03 - efl * (CH + GAP), H / 2); lw.P(0); // aux étages, le jardin est loin en dessous
    stairsGeo(bs, pd, CH, sk);
    if (!efl) { const dW = new Uint8Array(W * H).fill(9), q = []; for (let i = 0; i < W * H; i++) if (solid(T[i])) { dW[i] = 0; q.push(i); }
      for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, z = (i - x) / W; if (dW[i] >= 2) continue; for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = zz * W + xx; if (T[j] === VOID && dW[j] > dW[i] + 1) { dW[j] = dW[i] + 1; q.push(j); } } }
      bs.P(G.PAT.gravier); for (let z = 0; z < H; z++) { let x = 0; while (x < W) { const i = z * W + x; if (T[i] !== VOID || dW[i] > 2) { x++; continue; } let x2 = x; while (x2 + 1 < W && T[z * W + x2 + 1] === VOID && dW[z * W + x2 + 1] <= 2) x2++; bx(bs, x2 - x + 1, .03, 1, 0xdccdab, (x + x2 + 1) / 2, 0, z + .5); x = x2 + 1; } } bs.P(0);
      // la cour d'honneur (ou une cour fermée) : croisée d'allées, quatre parterres de buis à broderies, ifs taillés, et la grande fontaine au milieu
      const courtGarden = (a0, c0, a1, c1) => { const cw = a1 - a0, cd = c1 - c0, ccx = (a0 + a1) / 2, ccz = (c0 + c1) / 2; if (cw < 6 || cd < 6) return; const Rb = G.clamp(Math.min(cw, cd) * .15, 1.2, 4.5), aw = G.clamp(cw * .14, 1.6, 3.2);
        bs.P(G.PAT.gravier); bx(bs, cw, .03, cd, 0xdccdab, ccx, .002, ccz); bs.P(0);
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const xa = sx < 0 ? a0 + 1 : ccx + aw / 2, xb2 = sx < 0 ? ccx - aw / 2 : a1 - 1, za = sz < 0 ? c0 + 1 : ccz + aw / 2, zb = sz < 0 ? ccz - aw / 2 : c1 - 1; if (xb2 - xa < 2 || zb - za < 2) continue;
          // pelouse ou broderie (brique pilée), cadre de buis, ifs en cône aux angles, médaillon
          const brod = (sx + sz) % 4 === 0; bs.P(brod ? G.PAT.gravier : G.PAT.gazon); bx(bs, xb2 - xa, .06, zb - za, brod ? 0xb35f45 : 0x7cbc50, (xa + xb2) / 2, .01, (za + zb) / 2); bs.P(0);
          bs.P(G.PAT.buis); for (const [ww, dd, x, z] of [[xb2 - xa, .35, (xa + xb2) / 2, za + .17], [xb2 - xa, .35, (xa + xb2) / 2, zb - .17], [.35, zb - za, xa + .17, (za + zb) / 2], [.35, zb - za, xb2 - .17, (za + zb) / 2]]) bx(bs, ww, .55, dd, 0x3d6e31, x, .27, z);
          if (brod) { const mx = (xa + xb2) / 2, mz = (za + zb) / 2, rr = Math.min(xb2 - xa, zb - za) * .28; for (const r2 of [rr, rr * .55]) bs.add(new THREE.TorusGeometry(r2, .12, 4, 28), 0x3d6e31, bs.M(mx, .1, mz, PI / 2, 0, 0, 1, 1, 1.6));
            for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bs.add(new THREE.TorusGeometry(rr * .55, .1, 4, 18, PI * 1.4), 0x3d6e31, bs.M(mx + qx * (xb2 - xa) * .3, .1, mz + qz * (zb - za) * .3, PI / 2, 0, Math.atan2(qz, qx) + PI * .3, 1, 1, 1.6)); }
          else { const mx = (xa + xb2) / 2, mz = (za + zb) / 2; bs.add(new THREE.IcosahedronGeometry(.6, 1), 0x2b5a2a, bs.M(mx, .6, mz)); }
          bs.P(0); for (const [x, z] of [[xa + .6, za + .6], [xb2 - .6, za + .6], [xa + .6, zb - .6], [xb2 - .6, zb - .6]]) { bs.P(G.PAT.buis); bs.add(new THREE.ConeGeometry(.5, 2.1, 12), 0x2b5a2a, bs.M(x, 1.05, z)); bs.P(0); } }
        // la fontaine : bassin mouluré, vasque, jet et nappes d'eau
        bs.S(sk.stone); bs.add(new THREE.CylinderGeometry(Rb + .35, Rb + .45, 1.1, 48), 0xece5d5, bs.M(ccx, .55, ccz)); bs.S(null); bs.add(new THREE.CylinderGeometry(Rb, Rb, .02, 48), 0x7cc6de, bs.M(ccx, 1.0, ccz), 2);
        bs.S(sk.stone); bs.add(new THREE.CylinderGeometry(.4, .6, 2.4, 12), 0xece5d5, bs.M(ccx, 1.7, ccz)); bs.add(new THREE.CylinderGeometry(Rb * .48, .35, .5, 28), 0xece5d5, bs.M(ccx, 3.1, ccz)); bs.add(new THREE.CylinderGeometry(.2, .3, 1.2, 10), 0xece5d5, bs.M(ccx, 3.9, ccz)); bs.add(new THREE.CylinderGeometry(Rb * .25, .15, .3, 20), 0xece5d5, bs.M(ccx, 4.6, ccz)); bs.S(null);
        bs.add(new THREE.CylinderGeometry(Rb * .43, Rb * .43, .02, 28), 0x7cc6de, bs.M(ccx, 3.33, ccz), 2); bs.add(new THREE.CylinderGeometry(Rb * .47, Rb * .66, 2.3, 28, 1, true), 0xe2f4fa, bs.M(ccx, 2.18, ccz), 2);
        bs.add(new THREE.CylinderGeometry(Rb * .26, Rb * .36, 1.4, 20, 1, true), 0xe2f4fa, bs.M(ccx, 4.05, ccz), 2); bs.add(new THREE.CylinderGeometry(.07, .14, 2.2, 8, 1, true), 0xeef8fc, bs.M(ccx, 5.85, ccz), 2);
        bs.S(sk.gold); bs.add(new THREE.SphereGeometry(.22, 12, 10), GOLD, bs.M(ccx, 4.82, ccz)); bs.S(null); };
      if (pl.court) courtGarden(...pl.court);
      // cours fermées : le vide qu'on n'atteint pas depuis le bord du plan
      const out = new Uint8Array(W * H), st = []; for (let x = 0; x < W; x++) for (const z of [0, H - 1]) if (T[z * W + x] === VOID) { out[z * W + x] = 1; st.push(z * W + x); } for (let z = 0; z < H; z++) for (const x of [0, W - 1]) if (T[z * W + x] === VOID && !out[z * W + x]) { out[z * W + x] = 1; st.push(z * W + x); }
      while (st.length) { const i = st.pop(), x = i % W, z = (i - x) / W; for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = zz * W + xx; if (T[j] === VOID && !out[j]) { out[j] = 1; st.push(j); } } }
      const seen = new Uint8Array(W * H); for (let i0 = 0; i0 < W * H; i0++) { if (T[i0] !== VOID || out[i0] || seen[i0]) continue; let a0 = W, a1 = 0, c0 = H, c1 = 0; const st2 = [i0]; seen[i0] = 1;
        while (st2.length) { const i = st2.pop(), x = i % W, z = (i - x) / W; a0 = Math.min(a0, x); a1 = Math.max(a1, x); c0 = Math.min(c0, z); c1 = Math.max(c1, z); for (const [dx, dz] of NB4) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = zz * W + xx; if (T[j] === VOID && !seen[j]) { seen[j] = 1; st2.push(j); } } }
        const inC = pl.court && (a0 + a1) / 2 > pl.court[0] && (a0 + a1) / 2 < pl.court[2] && (c0 + c1) / 2 > pl.court[1] - 2 && (c0 + c1) / 2 < pl.court[3]; if (!inC) courtGarden(a0, c0, a1 + 1, c1 + 1); } }
    // plafonds peints (salon, galerie, salle de bal, chapelle, salon de musique) : ciel, nuées et figures, voussure à cadre doré — on les voit d'en bas
    const PAINTED = { apparat: 1, palier: 1, salon: 1, galerie: 1, bal: 1, chapelle: 1, musique: 1, vestibule: 1 };
    for (const rm of pl.rooms) { if (!PAINTED[rm.k] || pd.st.some(q => q.x1 >= rm.x0 && q.x0 <= rm.x1 && q.z1 >= rm.z0 && q.z0 <= rm.z1)) continue; const w = rm.x1 - rm.x0 + 1, d = rm.z1 - rm.z0 + 1; let cnt = 0; for (let z = rm.z0; z <= rm.z1; z++) for (let x = rm.x0; x <= rm.x1; x++) if (T[z * W + x] === FLOOR && R[z * W + x] === rm.id) cnt++;
      if (cnt < w * d * .97) continue; const iw = w - 2.4, id = d - 2.4; if (iw < 2 || id < 2) continue; const cx = rm.x0 + w / 2, cz = rm.z0 + d / 2;
      ceil.add(new THREE.PlaneGeometry(iw, id), new THREE.Matrix4().makeRotationX(PI / 2).premultiply(new THREE.Matrix4().makeTranslation(cx, CH - .035, cz)), 0, 1, 1);
      const strip = (x, z, ww, dd, y, col, kk) => { bs.S(kk); bs.add(new THREE.PlaneGeometry(ww, dd), col, new THREE.Matrix4().makeRotationX(PI / 2).premultiply(new THREE.Matrix4().makeTranslation(x, y, z))); bs.S(null); }; // tournés vers le bas : invisibles d'en haut
      for (const [ww, dd, x, z] of [[iw + .3, .16, cx, cz - id / 2 - .07], [iw + .3, .16, cx, cz + id / 2 + .07], [.16, id + .3, cx - iw / 2 - .07, cz], [.16, id + .3, cx + iw / 2 + .07, cz]]) strip(x, z, ww, dd, CH - .03, GOLD, sk.gold);
      for (const [ww, dd, x, z] of [[iw + 1.4, .5, cx, cz - id / 2 - .45], [iw + 1.4, .5, cx, cz + id / 2 + .45], [.5, id + .4, cx - iw / 2 - .45, cz], [.5, id + .4, cx + iw / 2 + .45, cz]]) strip(x, z, ww, dd, CH - .025, 0xf3e7c4, sk.paint);
      for (const [x, z] of [[cx - iw / 2 - .45, cz - id / 2 - .45], [cx + iw / 2 + .45, cz - id / 2 - .45], [cx - iw / 2 - .45, cz + id / 2 + .45], [cx + iw / 2 + .45, cz + id / 2 + .45]]) { bs.S(sk.gold); bs.add(new THREE.CircleGeometry(.32, 16), GOLD, bs.M(x, CH - .028, z, PI / 2, 0, 0)); bs.S(null); } }
    // ----- assemblage -----
    const U = m._cutU || (m._cutU = newCut()), CM = cutMats(U), add = (geo, mat, shadow = true) => { if (!geo) return; const me = new THREE.Mesh(geo, mat); me.castShadow = shadow; me.receiveShadow = true; me.frustumCulled = false; g.add(me); return me; };
    add(b.done(), CM); add(bs.done(), G.MATS); m._lawn = add(lw.done(), G.MATS, false);
    for (const id in texW) add(texW[id].geo(), cutMat(wallTexMat(id), U));
    for (const id in flA) add(flA[id].geo(), floorMat(id), false);
    // les vitres : le vrai dehors (photographié autour du château) dès qu'il est prêt, sinon la vue peinte
    const vT = add(views.t.geo(), outReady(m) ? outMat(U) : viewMat(false, U), false), vS = add(views.s.geo(), outReady(m) ? outMat(U) : viewMat(true, U), false); add(mir.geo(), cutMat(mirrorMat(), U), false);
    for (const k in art) add(art[k].geo(), cutMat(artMat(+k), U), false);
    add(ceil.geo(), ceilMat(), false);
    m.shell = g; m.group.add(g);
    // rayons de soleil (une seule géométrie, mise à jour quand le soleil bouge)
    const NB = beams.length * 2, bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NB * 24 * 3), 3)); bg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(NB * 24 * 2), 2)); bg.setDrawRange(0, 0);
    const bm = new THREE.Mesh(bg, beamMat()); bm.frustumCulled = false; bm.renderOrder = 4; g.add(bm);
    // les murs déjà abaissés le restent quand on redessine (retouche du décor depuis le plan)
    const oc = m._pv && m._pv.segs.length === segs.length ? m._pv.cut : null, cut = oc ? oc.slice() : new Float32Array(segs.length), cv = new Uint8Array(segs.length * 4); for (let i = 0; i < segs.length; i++) cv[i * 4] = Math.round(cut[i] * 255);
    const tex = new THREE.DataTexture(cv, segs.length, 1, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true; U.tex.value = tex; U.n.value = segs.length; U.top.value = CH + .12;
    m._pv = { segs, cut, cv, tex, beams, bm, bt: 0, room: m._pv ? m._pv.room : 0, views: [vT, vS].filter(Boolean) };
  }
  // ---------- rayons de soleil : prismes de lumière qui partent des fenêtres ----------
  let bMat = null;
  // rayons : bords doux (la lumière s'efface quand on la voit par la tranche), fondu vers le sol, poussière qui ondule lentement
  function beamMat() { if (bMat) return bMat;
    return bMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(0xffe2a8) }, uOp: { value: .1 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, extensions: { derivatives: true },
      vertexShader: 'varying vec2 vUv; varying vec3 vW;\nvoid main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOp, uT; varying vec2 vUv; varying vec3 vW;\nvoid main() { vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); float f = abs(dot(n, normalize(cameraPosition - vW)));\n'
        + '  float l = pow(clamp(vUv.y, 0.0, 1.0), 1.25), s = sin(dot(vW, vec3(2.3, 1.1, 1.7)) + uT * .55) * sin(dot(vW, vec3(-1.3, 2.9, .7)) - uT * .4);\n'
        + '  float d = smoothstep(.6, 3.5, distance(cameraPosition, vW));\n'
        + '  gl_FragColor = vec4(uCol, clamp(uOp * l * d * pow(f, 1.3) * (.8 + .2 * s) * 2.0, 0.0, 1.0)); }' }); }
  const SD = new THREE.Vector3(), CW = new THREE.Color(), CS = new THREE.Color(0xffd08a);
  function updBeams(m, dt) {
    const pv = m._pv, L = G.lights; if (!pv || !L || (pv.bt -= dt) > 0) return; pv.bt = .2;
    SD.copy(L.sun.position).sub(L.sun.target.position).normalize(); const day = L.sun.intensity > .25 && SD.y > .1, low = 1 - G.clamp((SD.y - .18) / .5, 0, 1), k = Math.min(1, (L.sun.intensity - .25) * 2.2);
    bMat.uniforms.uOp.value = (.1 + .09 * low) * k; bMat.uniforms.uCol.value.copy(CW.copy(L.sun.color).lerp(CS, .35 + .35 * low));
    const pos = pv.bm.geometry.attributes.position, uv = pv.bm.geometry.attributes.uv, p = G.player, live = []; let q = 0;
    if (day && p) for (const be of pv.beams) { if (-(SD.x * be.nx + SD.z * be.nz) <= .04 || (be.wid && pv.cut[be.wid] > .5) || Math.abs(be.pts[0][0] - p.x) > 34 || Math.abs(be.pts[0][2] - p.z) > 34) continue; live.push(be);
      const ends = be.pts.map(a => { let t = a[1] / Math.max(.1, SD.y); const [bx0, bz0, bx1, bz1] = be.box; for (let it = 0; it < 2; it++) { const fx = a[0] - SD.x * t, fz = a[2] - SD.z * t; if (fx < bx0 - .02 || fx > bx1 + .02 || fz < bz0 - .02 || fz > bz1 + .02) t *= .82; }
        return [a[0] - SD.x * t, a[1] - SD.y * t, a[2] - SD.z * t]; });
      for (const sc of [1, .55]) { const cx = be.pts.reduce((s, a) => s + a[0], 0) / 4, cy = be.pts.reduce((s, a) => s + a[1], 0) / 4, cz = be.pts.reduce((s, a) => s + a[2], 0) / 4, ex = ends.reduce((s, a) => s + a[0], 0) / 4, ey = ends.reduce((s, a) => s + a[1], 0) / 4, ez = ends.reduce((s, a) => s + a[2], 0) / 4;
        const A2 = be.pts.map(a => [cx + (a[0] - cx) * sc, cy + (a[1] - cy) * sc, cz + (a[2] - cz) * sc]), B2 = ends.map(a => [ex + (a[0] - ex) * sc, ey + (a[1] - ey) * sc, ez + (a[2] - ez) * sc]);
        for (let s = 0; s < 4; s++) { const a0 = A2[s], a1 = A2[(s + 1) % 4], b1 = B2[(s + 1) % 4], b0 = B2[s]; for (const [P, v] of [[a0, 0], [a1, 0], [b1, 1], [a0, 0], [b1, 1], [b0, 1]]) { if (q >= pos.count) break; pos.setXYZ(q, P[0], P[1], P[2]); uv.setXY(q, .5, 1 - v); q++; } } } }
    pv.bm.geometry.setDrawRange(0, q); pos.needsUpdate = true; uv.needsUpdate = true; pv.live = live;
    // beaucoup de rayons tout près (longue galerie) : chacun un peu plus doux, pour ne pas noyer la pièce de lumière
    let near = 0; if (p) for (const be of live) if (Math.abs(be.pts[0][0] - p.x) < 16 && Math.abs(be.pts[0][2] - p.z) < 16) near++; bMat.uniforms.uOp.value *= Math.pow(6 / Math.max(6, near), .8);
    // poussière dorée qui danse dans la lumière
    if (live.length && G.state === 'play') for (let i = 0; i < 3; i++) { const be = live[Math.floor(Math.random() * live.length)], a = be.pts[0], c2 = be.pts[2], f = Math.random(), y = a[1] + (c2[1] - a[1]) * Math.random(), x0 = a[0] + (c2[0] - a[0]) * f, z0 = a[2] + (c2[2] - a[2]) * f, t = Math.random() * y / Math.max(.1, SD.y);
      G.fx.one(x0 - SD.x * t, y - SD.y * t, z0 - SD.z * t, (Math.random() - .5) * .04, .015, (Math.random() - .5) * .04, 3.5 + Math.random() * 2, -.008, 0xfff1c4, .03, 0); }
  }
  // ---------- vue du village : les murs entre la caméra et le joueur sont coupés (à la souris : jamais) ----------
  function updCut(m, dt) {
    const pv = m._pv, p = G.player, cam = G.camera; if (!pv || !p || !cam) return; const U = m._cutU || CUT; U.tex.value = pv.tex; U.n.value = pv.segs.length; U.top.value = planData(m).CH + .12;
    const inside = (G.firstPerson && G.firstPerson()) || (G.mouseMode && G.mouseMode()), vx0 = cam.position.x - p.x, vz0 = cam.position.z - p.z, vl = Math.hypot(vx0, vz0) || 1, vx = vx0 / vl, vz = vz0 / vl, reach = Math.min(28, vl + 4);
    let dirty = false;
    for (let i = 1; i < pv.segs.length; i++) { const s = pv.segs[i]; let want = 0;
      if (!inside) { const ax = s.o === 'h' ? s.a : s.c + .5, az = s.o === 'h' ? s.c + .5 : s.a, bx2 = s.o === 'h' ? s.b + 1 : s.c + .5, bz2 = s.o === 'h' ? s.c + .5 : s.b + 1;
        // le point du segment le plus proche du joueur, et sa position dans le couloir caméra → joueur
        const ex = bx2 - ax, ez = bz2 - az, ll = ex * ex + ez * ez || 1, tt = G.clamp(((p.x - ax) * ex + (p.z - az) * ez) / ll, 0, 1), qx = ax + ex * tt - p.x, qz = az + ez * tt - p.z, fw = qx * vx + qz * vz, lat = Math.abs(qx * vz - qz * vx);
        const cx = (ax + bx2) / 2 - p.x, cz = (az + bz2) / 2 - p.z, cf = cx * vx + cz * vz, perp = Math.abs(ex * vx + ez * vz) / Math.sqrt(ll) < .72;
        if ((fw > .55 && fw < reach && lat < 4.2) || (perp && cf > -.45 && cf < reach && Math.abs(cx * vz - cz * vx) < 16 + Math.sqrt(ll) / 2)) want = 1; }
      const c = pv.cut[i], nv = c + G.clamp(want - c, -dt * 3.5, dt * 3.5); if (Math.abs(nv - c) > 1e-4) { pv.cut[i] = nv; pv.cv[i * 4] = Math.round(nv * 255); dirty = true; } }
    if (dirty) pv.tex.needsUpdate = true;
  }
  // nom de la pièce où l'on entre, en haut de l'écran
  let lab = null, labT = 0;
  function roomLabel(m, dt) {
    if (G.ui.modal) { if (lab) lab.style.opacity = '0'; labT = 0; return; } // un panneau est ouvert (le plan, l'inventaire…) : pas d'étiquette par-dessus
    const pd = planData(m), p = G.player, pv = m._pv; if (!p || !pv) return; const tx = Math.floor(p.x), tz = Math.floor(p.z); if (tx < 0 || tz < 0 || tx >= pd.W || tz >= pd.H) return; const r = pd.R[tz * pd.W + tx];
    if (r && r !== pv.room) { pv.room = r; const rm = pd.pl.rooms.find(q => q.id === r); if (rm) { if (!lab) { lab = document.createElement('div'); lab.style.cssText = 'position:fixed;left:50%;top:74px;transform:translateX(-50%);padding:8px 22px;border-radius:999px;background:rgba(40,28,14,.62);color:#fff3d6;font:800 17px/1.2 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;transition:opacity .6s;z-index:40;text-shadow:0 1px 3px #0008;border:1px solid #d9b04a88'; document.body.appendChild(lab); }
        lab.textContent = '⚜ ' + rm.n + ' ⚜'; lab.style.opacity = '1'; labT = 2.6; } }
    if (lab && labT > 0 && (labT -= dt) <= 0) lab.style.opacity = '0';
  }
  // =====================================================================
  // ============ 5. PAR LES FENÊTRES, LE VRAI DEHORS =====================
  // =====================================================================
  // Le monde autour du château est photographié tout autour (six vues, comme une caméra à 360° posée au milieu de l'avant-corps, à hauteur
  // des fenêtres, tournée comme le château) : les vitres montrent le vrai village, les jardins du château, ses ailes, le ciel et le soleil de
  // l'heure. La photo est refaite toutes les quelques secondes, une vue par image, pour que le jeu reste fluide.
  const OUT = { rt: null, cam: null, mat: null, map: null, src: null, ready: false, face: 6, t: 0 };
  const ZM = new THREE.Matrix4().makeScale(0, 0, 0);
  const outQ = () => { const q = G.settings && G.settings.quality; return q === 'low' ? { s: 192, every: 60 } : q === 'high' ? { s: 384, every: 10 } : { s: 288, every: 20 }; };
  function outRT() {
    if (OUT.rt) return OUT.rt; const R = G.renderer, hf = R && R.capabilities && R.capabilities.isWebGL2;
    OUT.rt = new THREE.WebGLCubeRenderTarget(outQ().s, { type: hf ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    OUT.rt.texture.mapping = THREE.CubeRefractionMapping; OUT.cam = new THREE.CubeCamera(.3, 900, OUT.rt); return OUT.rt;
  }
  // la vitre laisse passer la vue tout droit (réfraction neutre), à peine teintée
  function outMat(U) { if (!OUT.base) OUT.base = new THREE.MeshBasicMaterial({ envMap: outRT().texture, refractionRatio: 1, color: 0xf4f8ff, fog: false }); return cutMat(OUT.base, U); }
  function outReady(m) { return OUT.ready && OUT.map === m && !!OUT.src; }
  // le château dans le monde (ou sur l'île) : sa place, sa hauteur, son orientation, et le milieu de l'avant-corps
  function outSrc(m) {
    if (!m || !m.meta || !m.meta.plan || !G.chateauInfo || !G.chateauFusion) return null;
    for (const w of [G.world, G.island]) { if (!w || !w.list) continue; let o = null; const bid = m.meta.base || m.id; for (const q of w.list) if (q.iid === bid) { o = q; break; } if (!o) continue;
      const info = G.chateauInfo(o); if (!info || info.cx == null) return null; let dx = 0, dz = 0, fh = 3;
      try { const LC = G.chateauFusion.layout(0, info.cols, info.rows).C, D = LC.D; fh = LC.FH; [dx, dz] = G.chateauFusion.toW(info.r, (D.x0 + D.x1) / 2, (D.z0 + D.z1) / 2); } catch (e) { }
      const x = info.cx + dx, z = info.cz + dz, CL = G.CELL || 8, cw = Math.ceil(w.W / CL), ch = Math.ceil(w.H / CL), V = new Uint8Array(cw * ch);
      for (let k = 0; k < V.length; k++) V[k] = Math.hypot((k % cw) * CL + CL / 2 - x, Math.floor(k / cw) * CL + CL / 2 - z) < 130 ? 1 : 0; // ce qu'on voit des fenêtres : jusqu'à 130 cases
      for (const g of w.chunks) if (g) for (const me of g.children) me.frustumCulled = true;
      return { w, o, x, z, V, y: w.terrainH(x, z) + 2.6 + (m.meta.plan.fl || 0) * fh, rot: (info.r & 3) * PI / 2 }; }
    return null;
  }
  // photographier le dehors : le monde redevient visible le temps des vues (ciel, nuages, mer, lumière du jour), le château intérieur est caché
  function outCapture() {
    const R = G.renderer, sc = G.scene, src = OUT.src, w = src.w, L = G.lights, cam = outRT() && OUT.cam; if (!R || !sc || !L || !cam) return;
    const P = new THREE.Vector3(src.x, src.y, src.z), cp = G.camera.position, info = G.skyInfo || { h: 12, n: 0, day: true }, svClip = CLIP.constant; CLIP.constant = 1e6;
    const vis = sc.children.map(c => c.visible), keep = c => c.isLight || c === w.group || c === G.skyMesh || c === G.stars || c === G.sunMesh || c === G.moonMesh || (G.M.cloud && c.material === G.M.cloud) || (c.userData && c.userData.map === w);
    const sv = { bg: sc.background, fn: sc.fog.near, ff: sc.fog.far, hemi: L.hemi.intensity, amb: L.amb.intensity, sun: L.sun.intensity, sp: L.sun.position.clone(), st: L.sun.target.position.clone(), room: L.roomLight ? L.roomLight.intensity : 0,
      lamps: (L.lamps || []).map(l => l.intensity), cl: G.U.cloudAmt ? G.U.cloudAmt.value : 0, glow: G.M.glow ? G.M.glow.color.clone() : null, sky: G.skyMesh && G.skyMesh.position.clone(), stars: G.stars && G.stars.position.clone(),
      so: G.stars && G.stars.material.opacity, sunP: G.sunMesh && G.sunMesh.position.clone(), sunQ: G.sunMesh && G.sunMesh.quaternion.clone(), moonP: G.moonMesh && G.moonMesh.position.clone(), moonQ: G.moonMesh && G.moonMesh.quaternion.clone(), wv: w.group.visible };
    try {
      // tout le monde autour (jusqu'à 170 cases), comme si on était dehors à la place du château
      // le château lui-même est caché le temps de la photo (sinon on verrait l'envers de ses murs, ses rideaux, ses corniches)
      const an = src.o._grp && src.o._grp.anchor ? src.o._grp.anchor : src.o; sv.an = an; sv.anA = an._anim; an._anim = ZM; w.objr.refresh(an);
      const p = G.player, ox = p.x, oz = p.z; w.cullV = src.V; w.cullVer = (w.cullVer || 0) + 1; w.chunks.forEach((g, k) => { if (g) g.visible = Math.hypot((k % w.cw) * 24 + 12 - src.x, Math.floor(k / w.cw) * 24 + 12 - src.z) < 200; });
      p.x = src.x; p.z = src.z; try { w.objr.cull(src.V, w.cullVer); } finally { p.x = ox; p.z = oz; } // (les objets lointains en version simplifiée, comptés depuis le château)
      sc.children.forEach(c => { c.visible = keep(c); }); w.group.visible = true;
      if (G.sunMesh) { G.sunMesh.visible = !!info.day; G.sunMesh.position.copy(sv.sunP).sub(cp).add(P); G.sunMesh.lookAt(P); }
      if (G.moonMesh) { G.moonMesh.visible = !info.day; G.moonMesh.position.copy(sv.moonP).sub(cp).add(P); G.moonMesh.lookAt(P); }
      if (G.skyMesh) G.skyMesh.position.copy(P); if (G.stars) { G.stars.position.copy(P); G.stars.material.opacity = (info.n || 0) * .9; }
      sc.background = null; const vast = w.lazyT && w.lazyT(); sc.fog.near = vast ? 100 : 110; sc.fog.far = vast ? 330 : 420;
      const [li, hi] = G.skyAt ? G.skyAt(info.h) : [.9, .62], n = info.n || 0; L.hemi.intensity = hi; L.amb.intensity = .1 + n * .08; L.sun.intensity = li;
      const SDv = sv.sp.clone().sub(sv.st).normalize(); L.sun.position.copy(P).addScaledVector(SDv, 60); L.sun.target.position.copy(P); L.sun.target.updateMatrixWorld();
      if (L.roomLight) L.roomLight.intensity = 0; for (const l of L.lamps || []) l.intensity = 0; if (G.U.cloudAmt) G.U.cloudAmt.value = .24 * (1 - n);
      if (G.M.glow) G.M.glow.color.setRGB(G.lerp(.62, 1.08, n), G.lerp(.7, .98, n), .78);
      cam.position.copy(P); cam.rotation.set(0, src.rot, 0); cam.updateMatrixWorld(true);
      // les six vues d'un coup, avec les ombres du dehors calculées une seule fois ; vers le ciel et vers le sol, sans les objets
      R.shadowMap.needsUpdate = true; for (const i of [0, 4, 1, 5, 2, 3]) { const up = i === 2, down = i === 3; w.group.visible = !up; w.objr.group.visible = !down; R.setRenderTarget(OUT.rt, i); R.render(sc, cam.children[i]); }
      w.group.visible = true; w.objr.group.visible = true;
    } catch (e) { console.warn('vue du dehors', e); }
    finally {
      if (sv.an) { sv.an._anim = sv.anA || null; try { w.objr.refresh(sv.an); } catch (e) { } }
      CLIP.constant = svClip; R.setRenderTarget(null); R.shadowMap.needsUpdate = true; sc.children.forEach((c, i) => { c.visible = vis[i]; }); w.group.visible = sv.wv;
      sc.background = sv.bg; sc.fog.near = sv.fn; sc.fog.far = sv.ff; L.hemi.intensity = sv.hemi; L.amb.intensity = sv.amb; L.sun.intensity = sv.sun; L.sun.position.copy(sv.sp); L.sun.target.position.copy(sv.st); L.sun.target.updateMatrixWorld();
      if (L.roomLight) L.roomLight.intensity = sv.room; (L.lamps || []).forEach((l, i) => { l.intensity = sv.lamps[i]; }); if (G.U.cloudAmt) G.U.cloudAmt.value = sv.cl; if (sv.glow) G.M.glow.color.copy(sv.glow);
      if (G.skyMesh) G.skyMesh.position.copy(sv.sky); if (G.stars) { G.stars.position.copy(sv.stars); G.stars.material.opacity = sv.so; }
      if (G.sunMesh) { G.sunMesh.position.copy(sv.sunP); G.sunMesh.quaternion.copy(sv.sunQ); } if (G.moonMesh) { G.moonMesh.position.copy(sv.moonP); G.moonMesh.quaternion.copy(sv.moonQ); }
    }
  }
  // les vitres de l'intérieur passent sur la vraie vue
  function outApply(m) { const pv = m._pv; if (!pv || !pv.views) return; for (const me of pv.views) me.material = outMat(m._cutU); }
  G.on('frame', dt => {
    const m = G.map; if (!m || !m.interior || !m.meta || !m.meta.plan || !m._pv || G.state === 'editor' || G.state === 'title') return;
    if (OUT.map !== m) { OUT.map = m; OUT.ready = false; OUT.src = outSrc(m); if (!OUT.src) return; outCapture(); OUT.ready = true; outApply(m); OUT.t = outQ().every; return; }
    if (OUT.src && (OUT.t -= dt) <= 0) { OUT.t = outQ().every; outCapture(); } // le ciel et la lumière changent avec l'heure
  });
  G.on('enterMap', () => { if (G._chSwap) return; OUT.map = null; OUT.ready = false; }); // (en changeant d'étage par l'escalier, on garde la vue)
  G.chateauOutside = OUT;
  // ---------- branchements ----------
  const obs = G.buildShell; G.buildShell = m => { if (m && m.meta && m.meta.plan) return planShell(m); return obs(m); };
  G.on('update', dt => {
    const m = G.map, p = G.player; if (!m || !m.interior || !m.meta.plan || !p) { if (lab && lab.style.opacity !== '0') lab.style.opacity = '0'; return; }
    if (!G.ui.fading && m.meta.plan.stairs) { const pd = planData(m), tx = Math.floor(p.x), tz = Math.floor(p.z), c = tx >= 0 && tz >= 0 && tx < pd.W && tz < pd.H ? pd.su[tz * pd.W + tx] : 0;
      if (c === 1 || c === 2) { const q = stairAt(pd, p.x, p.z), t = q && stairT(q, p.x, p.z); if (q && q.up && t > .82 && swapFloor(m, q, 1)) return; if (q && !q.up && t < .5 && swapFloor(m, q, -1)) return; } }
    const pl = m.meta.plan; if (!G.ui.fading) for (const [i, d] of (pl.doors || [pl.door]).entries()) if (d && p.x > d.x0 && p.x < d.x1 + 1 && p.z > d.z + .3) { const dw = m.meta.doorsW && m.meta.doorsW[i]; if (dw) m.meta.door = dw; G.act.exitHouse(); return; }
    if (bMat) bMat.uniforms.uT.value += dt; updCut(m, dt); updBeams(m, dt); roomLabel(m, dt);
  });
  // ---------- caméra à la souris : elle reste dans le château, devant les murs et sous le plafond ----------
  // (elle se rapproche aussitôt quand un mur ou le plafond la gênerait, puis se recule doucement quand la place revient)
  let camK = 1;
  G.on('frame', dt => {
    const m = G.map, p = G.player, cam = G.camera, C = G.cam;
    if (!m || !m.interior || !m.meta || !m.meta.plan || !p || !cam || !C || p.vehicle || !(G.mouseMode && G.mouseMode()) || (G.firstPerson && G.firstPerson()) || (G.state !== 'play' && G.state !== 'pause')) { camK = 1; return; }
    const pd = planData(m), { W, H, T, CH } = pd, dist = C.mdist || 5.5, pit = C.mp == null ? .35 : C.mp, hd = Math.cos(pit) * dist;
    const x0 = C.cx, y0 = C.cy, z0 = C.cz, ex = Math.sin(C.yaw) * hd, ey = Math.sin(pit) * dist, ez = Math.cos(C.yaw) * hd;
    // une place libre pour la caméra : du parquet tout autour (ou une arche, sous son cintre), ni dans le sol ni contre le plafond
    const yTop = (p.y > .3 ? 2 * CH + GAP : CH) - .35, yBot = p.y < -.3 ? -CH : .25;
    const free = (x, y, z) => { if (y > yTop || y < yBot) return false;
      for (const ox of [-.27, .27]) for (const oz of [-.27, .27]) { const tx = Math.floor(x + ox), tz = Math.floor(z + oz); if (tx < 0 || tz < 0 || tx >= W || tz >= H) return false; const t = T[tz * W + tx];
        if (t !== FLOOR && !(t === OPEN && y < 2.8)) return false; } // (pas dans l'embrasure de la porte d'entrée : on la verrait de trop près)
      return true; };
    const n = Math.max(6, Math.ceil(dist / .08)); let k = 1;
    for (let i = 1; i <= n; i++) { const t = i / n; if (!free(x0 + ex * t, y0 + ey * t, z0 + ez * t)) { k = (i - 1) / n; break; } }
    k = Math.max(k, Math.min(1, .8 / dist)); // jamais dans la tête du personnage
    camK = k < camK ? k : Math.min(k, camK + dt * 2.5 / dist);
    cam.position.set(x0 + ex * camK, y0 + ey * camK, z0 + ez * camK); cam.lookAt(x0, y0, z0);
  });
  G.on('enterMap', m => { if (lab) lab.style.opacity = '0'; if (m && m.meta && m.meta.plan) m.meta.cam = Object.assign({}, CAM); if (m && m._pv) { m._pv.room = 0; if (m._cutU) { m._cutU.tex.value = m._pv.tex; m._cutU.n.value = m._pv.segs.length; } } if (m && m.meta && m.meta.plan && !m._pv) { G.buildShell(m); m.buildAll(); }
    if (m && m.meta && m.meta.plan && !m.isVisit && !G.flags.chPlanTip) { G.flags.chPlanTip = 1; setTimeout(() => G.ui.toast('⚜ Ton château a de vraies pièces ! Appuie sur H pour ouvrir le plan : murs, arches, fenêtres, rideaux, lustres, décor et meubles.', 7000), 1600); } });
  // =====================================================================
  // ============ 6. LES ÉTAGES, LES UNS AU-DESSUS DES AUTRES ==============
  // =====================================================================
  // Les étages d'un château sont empilés pour de vrai : l'étage du dessous se voit par l'ouverture des escaliers, celui du dessus
  // se dévoile (en coupe, comme une maison de poupée) à mesure qu'on monte l'escalier, et on passe de l'un à l'autre en marchant, sans fondu.
  let stackL = [];
  G.on('init', () => { if (G.renderer) G.renderer.clippingPlanes = [CLIP]; });
  const floorsOf = m => { const base = m.meta.base ? G.interiors[m.meta.base] : m; if (!base || !base.meta || !base.meta.plan) return [m]; const n = base.meta.plan.nfl || 1, out = [base]; for (let f = 1; f < n; f++) out.push(G.interiors[base.id + '_f' + f] || null); return out; };
  // tous les étages sont préparés en entrant (sinon le premier pas sur l'escalier ferait attendre)
  function ensureFloors(base) { if (!base || !base.meta || !base.meta.plan || base.meta.base) return; const n = base.meta.plan.nfl || 1;
    for (let f = 1; f < n; f++) { const fm = floorMap(base, f); if (fm && !fm._pv) { G.buildShell(fm); fm.buildAll(); } } }
  // passer à l'étage du dessus (dir = 1) ou du dessous (dir = −1) : le joueur, la caméra et les étages glissent ensemble d'un étage, rien ne bouge à l'écran
  function swapFloor(m, q, dir) {
    const fl = (m.meta.plan.fl || 0) + dir, base = m.meta.base ? G.interiors[m.meta.base] : m; if (!base || fl < 0) return false;
    const to = fl === 0 ? base : floorMap(base, fl); if (!to) { if (!m._noUp) { m._noUp = 1; G.ui.toast('Cet étage n’est pas ouvert aux visiteurs.'); } return false; }
    if (!to._pv) { G.buildShell(to); to.buildAll(); }
    const p = G.player, CH = planData(m).CH, dy = dir * (CH + GAP), C = G.cam;
    if (m._pv) { m._pv.cut.fill(0); m._pv.cv.fill(0); m._pv.tex.needsUpdate = true; if (m._pv.bm) m._pv.bm.geometry.setDrawRange(0, 0); } // l'étage qu'on quitte : murs debout, sans rayons de soleil
    G.map = to; to.group.visible = true; to.group.position.y = 0; m.group.position.y = -dy;
    p.y -= dy; if (typeof p.airTop === 'number') p.airTop -= dy; if (C && C.cy) C.cy -= dy; if (G.camera) { G.camera.position.y -= dy; G.camera.updateMatrixWorld(); }
    G.ui.mmRev = -1;
    if (OUT.ready && OUT.src) { OUT.map = to; OUT.src = outSrc(to) || OUT.src; outApply(to); OUT.t = Math.min(OUT.t, 2); } // la vue des fenêtres suit (refaite à la hauteur de cet étage dans un instant)
    G._chSwap = true; try { G.emit('enterMap', to); } finally { G._chSwap = false; }
    return true;
  }
  G.on('frame', dt => {
    const m = G.map, p = G.player, cur = m && m.interior && m.meta && m.meta.plan ? m : null;
    const reset = keep => { for (const F of stackL) if (F && F !== keep) { F.group.position.y = 0; if (F !== m) F.group.visible = false; if (F._lawn) F._lawn.visible = true; } };
    // on a quitté le château : ses étages reviennent à leur place, cachés
    if (!cur) { if (stackL.length) { reset(null); stackL = []; } CLIP.constant = 1e6; return; }
    const floors = floorsOf(cur); if (stackL.length && stackL[0] !== floors[0]) reset(cur); stackL = floors;
    const fl = cur.meta.plan.fl || 0, CH = cur.meta.plan.CH, r = p ? G.clamp((p.y / CH - .28) / .5, 0, 1) : 0, rr = r * r * (3 - 2 * r);
    // l'étage du dessous : quand on est près d'une ouverture d'escalier (ou qu'on la descend)
    let nearWell = false; if (fl > 0 && p) { if (p.y < -.05) nearWell = true; else for (const q of planData(cur).st) if (!q.up && Math.max(q.x0 - p.x, p.x - q.x1 - 1, q.z0 - p.z, p.z - q.z1 - 1, 0) < 14) { nearWell = true; break; } }
    let low = cur;
    floors.forEach((F, f) => { if (!F) return; if (F === cur) { F.group.position.y = 0; F.group.visible = true; return; }
      const d = f - fl, show = (d === -1 && nearWell) || (d === 1 && rr > .002); F.group.position.y = d * (CH + GAP); F.group.visible = show;
      if (show) { if (!F._pv) { G.buildShell(F); F.buildAll(); } F.flush(); if (F._pv && F._pv.bm) F._pv.bm.geometry.setDrawRange(0, 0); if (d < 0) low = F; else if (dt) updCut(F, Math.min(dt, .1)); } }); // (l'étage du dessus : ses murs devant le joueur s'abaissent aussi)
    for (const F of floors) if (F && F._lawn) F._lawn.visible = F === low;
    // en coupe : tout ce qui dépasse est caché ; l'étage du dessus se dévoile à mesure qu'on monte
    CLIP.constant = CH + .01 + rr * (GAP + CH * .94);
  });
  // ranger les meubles d'une pièce (dans les casiers en mode Survie)
  const clearRoom = (m, id) => { const pd = planData(m); let n = 0; for (const o of [...m.list]) { const d = O[o.t]; if (d.ceil || o.t === 'paillasson' || pd.R[o.z * pd.W + o.x] !== id) continue; m.removeObj(o); if (G.mode === 'survie') stash(o.t); n++; } return n; };
  G.chateauInterior = { planData, clearRoom, stash, renumber, lustres, furnish, relocate, genPlan, makePlanInterior, prepare, rebuild: m => { m._pd = null; G.buildShell(m); }, VOID, WALL, FLOOR, OPEN, DOOR };
})();
