'use strict';
// ===== L'Hôtel de Ville : un intérieur immense sur cinq niveaux (le rez-de-chaussée et quatre étages), autour d'un atrium ouvert jusqu'au
// toit de verre. Au rez-de-chaussée, la Salle des Pas Perdus : colonnade de marbre, le grand comptoir d'accueil au centre (et les guichets
// de l'État civil et de l'Urbanisme), Marianne entre les drapeaux, deux escaliers d'honneur en marbre qui montent à la Galerie d'honneur.
// Aux étages, des galeries à balustrades autour de l'atrium, et de grandes salles : Mariages, Conseil municipal, Fêtes, Trésor…
// Au milieu, un lustre d'or immense descend du toit de verre jusqu'au-dessus du comptoir, en traversant tous les étages.
// On monte et on descend en marchant (le système des étages des châteaux, chateau_interieur.js, avec son atrium). =====
(function () {
  const PI = Math.PI, TAU = PI * 2, O = G.OBJ, MD = G.MODELS, GOLD = 0xd9b04a, MARB = 0xf3efe7, MARB2 = 0xe3dccd;
  const VOID = 0, WALL = 1, FLOOR = 2, OPEN = 3, DOOR = 4;
  // le plan : 57 × 45 cases, cinq niveaux de 8 m sous plafond ; l'atrium est vide aux étages (x 15 → 41, z 16 → le bord sud)
  const W = 57, H = 45, CH = 8, NF = 5, GAP = .08, FH = CH + GAP, AX0 = 15, AX1 = 42, AZ0 = 16, XC = W / 2, ZL = 30, SIG = 'mairie|3';
  const ROOF = NF * FH; // le toit de verre, au-dessus de l'atrium (hauteur comptée depuis le rez-de-chaussée)
  const CAMB = { pitch: .8, dist: 19, ty: 1.3, fx: 1, fz: 1, fy: 1, dz: -2.2 };

  // ---------- les escaliers : deux escaliers d'honneur dans l'atrium (vers la Galerie d'honneur), puis deux par étage dans les ailes ----------
  const STAIRS = []; {
    const f = (lvl, x0, x1, z0, z1, grand) => STAIRS.push({ lvl, ax: 'z', s: -1, x0, z0, x1, z1, lnd: 2, len: z1 - z0 + 1, lo: [(x0 + x1 + 1) / 2, z1 + 2.5], hi: [(x0 + x1 + 1) / 2, z0 - 1.5], grand: grand ? 1 : 0 });
    f(0, 17, 22, 16, 29, 1); f(0, 34, 39, 16, 29, 1);
    for (let l = 1; l < NF - 1; l++) { if (l % 2) { f(l, 2, 6, 20, 33); f(l, 50, 54, 20, 33); } else { f(l, 8, 12, 20, 33); f(l, 44, 48, 20, 33); } } }

  // ---------- les salles de chaque niveau : [genre, nom, murs, sol, rideaux, lustres] (genre « galerie » : des glaces sur les murs, sinon des tableaux) ----------
  const STY = [
    { hall: ['hall', 'Salle des Pas Perdus', 'pierre_taille', 'damier_marbre', 'rouge', null] },
    { gal: ['salon', 'Galerie d’honneur', 'peinture_ivoire', 'damier_marbre', 'rouge', null], w: ['apparat', 'Salon d’honneur', 'peinture_rouge', 'chevrons_chene', 'or', 'lustre_murano'],
      c: ['salon', 'Salle des Mariages', 'peinture_or', 'damier_marbre', 'rouge', 'lustre_versailles'], e: ['cabinet', 'Bureau du Maire', 'peinture_empire', 'chevrons_noyer', 'vert', 'lustre_bougies'] },
    { gal: ['salon', 'Galerie des Conseillers', 'peinture_lin', 'batons_rompus', 'bleu', null], w: ['biblio', 'Bibliothèque municipale', 'peinture_empire', 'chevrons_noyer', 'or', 'lustre_lanterne'],
      c: ['conseil', 'Salle du Conseil municipal', 'peinture_bleu', 'chevrons_chene', 'bleu', 'lustre_cristal'], e: ['archives', 'Archives de la Ville', 'peinture_lin', 'batons_noyer', 'lin', 'lustre_industriel'] },
    { gal: ['galerie', 'Galerie des Glaces', 'peinture_or', 'chevrons_chene', 'or', null], w: ['musique', 'Salon de musique', 'peinture_or', 'chevrons_chene', 'rouge', 'lustre_murano'],
      c: ['bal', 'Salle des Fêtes', 'peinture_ivoire', 'chevrons_chene', 'or', 'lustre_cristal'], e: ['jeux', 'Salon des jeux', 'peinture_bleu', 'chevrons_chene', 'bleu', 'lustre_globe'] },
    { gal: ['salon', 'Galerie des Portraits', 'peinture_rose', 'batons_rompus', 'rose', null], w: ['apparat', 'Salon des Ambassadeurs', 'peinture_rouge', 'damier_marbre', 'or', 'lustre_anneaux'],
      c: ['tresor', 'Salle du Trésor', 'peinture_nuit', 'damier_marbre', 'or', 'lustre_cristal'], e: ['belvedere', 'Belvédère', 'peinture_sauge', 'batons_rompus', 'voile', 'lustre_tulipes'] }];
  const GAL_LUS = [null, 'lustre_bougies', 'lustre_anneaux', 'lustre_bougies', 'lustre_anneaux']; // (des lustres à bougies dans les galeries : légers, on en voit beaucoup à la fois)

  // ---------- le plan d'un niveau (grille de cases, pièces, fenêtres, porte) ----------
  const PC = {};
  function build(fl) {
    const N = W * H, T = new Uint8Array(N), I = (x, z) => z * W + x;
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) T[I(x, z)] = x === 0 || z === 0 || x === W - 1 || z === H - 1 ? WALL : FLOOR;
    let door = null;
    if (!fl) { for (let x = 27; x <= 29; x++) T[I(x, H - 1)] = DOOR; door = { x0: 27, x1: 29, z: H - 1, sx: XC, sz: H - 1.7 }; }
    else {
      for (let z = AZ0; z < H; z++) for (let x = AX0; x < AX1; x++) T[I(x, z)] = VOID; // l'atrium, ouvert du sol au toit
      for (let x = 1; x < W - 1; x++) T[I(x, 10)] = WALL; for (let z = 1; z < 10; z++) { T[I(19, z)] = WALL; T[I(37, z)] = WALL; } // trois grandes salles au fond
      for (const [a, b] of [[7, 12], [25, 31], [44, 49]]) for (let x = a; x <= b; x++) T[I(x, 10)] = OPEN; // une grande arche vers chacune
      for (let z = 4; z <= 6; z++) { T[I(19, z)] = OPEN; T[I(37, z)] = OPEN; } // et des arches entre elles, en enfilade
      for (const q of STAIRS) if (q.lvl === fl - 1) for (let z = q.z0; z <= q.z1; z++) for (let x = q.x0; x <= q.x1; x++) T[I(x, z)] = FLOOR; // le haut des volées qui arrivent du dessous
    }
    // les pièces : les cases de sol reliées sans passer par une arche
    const R = new Uint8Array(N), rooms = []; let nr = 0;
    for (let i = 0; i < N; i++) { if (T[i] !== FLOOR || R[i]) continue; nr++; R[i] = nr; const st = [i]; let x0 = W, x1 = 0, z0 = H, z1 = 0;
      while (st.length) { const c = st.pop(), x = c % W, z = (c - x) / W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= H) continue; const j = I(xx, zz); if (T[j] === FLOOR && !R[j]) { R[j] = nr; st.push(j); } } }
      const at = (x, z) => R[I(x, z)] === nr, S = STY[fl], k = !fl ? 'hall' : at(9, 5) ? 'w' : at(28, 5) ? 'c' : at(46, 5) ? 'e' : 'gal', s = S[k] || S.hall || S.gal;
      rooms.push({ id: nr, k: s[0], n: s[1], wall: s[2], floor: s[3], curt: s[4], lus: s[5], app: 1, x0, x1, z0, z1 }); }
    // les fenêtres des murs du tour : de grandes portes-fenêtres cintrées, avec un œil-de-bœuf au-dessus
    const wins = [], roomAt = (x, z) => x >= 0 && z >= 0 && x < W && z < H && T[I(x, z)] === FLOOR ? R[I(x, z)] : 0;
    const row = (horiz, line, a0, a1, nrm, step) => { const len = a1 - a0, cnt = Math.floor((len - 1) / step); if (cnt < 1) return;
      for (let k = 0; k < cnt; k++) { const u = a0 + (len - (cnt - 1) * step) / 2 + k * step; if (!fl && horiz && line === H - 1 && Math.abs(u - XC) < 4) continue; // (pas sur la porte)
        const cx = horiz ? Math.floor(u) : line, cz = horiz ? line : Math.floor(u), r = roomAt(horiz ? cx : line + nrm, horiz ? line + nrm : cz); if (!r || T[I(cx, cz)] !== WALL) continue;
        const w = { x: cx, z: cz, nx: horiz ? 0 : nrm, nz: horiz ? nrm : 0, u, w: 1.9, st: 'cintree', c: '', r }; wins.push(w, Object.assign({}, w, { st: 'oeil', w: 1.3 })); } };
    row(true, 0, 1, W - 1, 1, 4); row(false, 0, 1, H - 1, 1, 4.5); row(false, W - 1, 1, H - 1, -1, 4.5);
    if (!fl) row(true, H - 1, 1, W - 1, -1, 4); else { row(true, H - 1, 1, AX0, -1, 4); row(true, H - 1, AX1, W - 1, -1, 4); }
    return { sig: SIG, kind: 'mairie', fl, nfl: NF, W, H, k: 1, px: 0, court: null, door, doors: fl ? [] : [door], CH, T: G.b64.enc(T), R: G.b64.enc(R), ops: {}, rooms, wins, n: 1,
      stairs: STAIRS.map(q => Object.assign({}, q, { lo: q.lo.slice(), hi: q.hi.slice() })), atr: [AX0, AZ0, AX1, H], cam: Object.assign({}, CAMB) };
  }
  const plan = fl => JSON.parse(JSON.stringify(PC[fl] || (PC[fl] = build(fl))));
  const TG = {}, gridOf = fl => TG[fl] || (TG[fl] = G.b64.dec((PC[fl] || (PC[fl] = build(fl))).T));

  // =====================================================================
  // les meubles et les personnages
  // =====================================================================
  function furnish(m) {
    const fl = m.meta.plan.fl || 0, P = (t, x, z, r = 0, ex) => !!O[t] && m.canPlace(t, x, z, r) && (m.addObj(t, x, z, r, ex), true);
    const PM = (t, x, z, r = 0, ex) => { P(t, x, z, r, ex); const d = O[t]; if (!d) return; const w = G.fpDims(d, r)[0]; P(t, W - x - w, z, r === 1 ? 3 : r === 3 ? 1 : r, ex); }; // (et son symétrique, de l'autre côté)
    if (!fl) {
      // ----- la Salle des Pas Perdus -----
      P('hdv_tapis', 26, 35); P('hdv_accueil', 21, 33); PM('hdv_guichet', 15, 37);
      P('hdv_marianne', 28, 25); PM('hdv_drapeau', 26, 25);
      for (const z of [16, 20, 24, 28, 32, 36, 40]) PM('hdv_colonne', 14, z); PM('hdv_colonne', 26, 15);
      for (const z of [18, 22, 26, 30]) { PM('banc_parc', 6, z, 1); PM('banc_parc', 10, z, 1); }
      for (const [x, z] of [[2, 2], [2, 42], [12, 42], [25, 42], [13, 16]]) PM('oranger_caisse', x, z);
      P('horloge', 28, 1); PM('statue_antique', 24, 1); PM('hdv_drapeau', 22, 1);
      PM('casiers', 2, 1); PM('bureau', 5, 5); PM('chaise', 5, 6, 2); PM('lampe', 8, 5); for (const x of [11, 12]) PM('bibliotheque', x, 1);
      PM('bureau', 5, 10); PM('chaise', 5, 11, 2); PM('plante', 2, 9); PM('statue_antique', 17, 2); PM('vase_chine', 2, 14);
      for (const z of [22, 36]) PM('lustre_bougies', 7, z); PM('lustre_bougies', 10, 8);
      m.meta.npcs = [{ role: 'mairie', x: XC, z: 32.55, yaw: 0 }, { role: 'hdv_ec', x: 18, z: 36.55, yaw: 0 }, { role: 'hdv_urb', x: 39, z: 36.55, yaw: 0 }];
      if (G.ents && G.ents.spawnVillagers) G.ents.spawnVillagers(m);
    } else {
      // ----- la galerie autour de l'atrium (et les ailes) -----
      for (const x of [2, 15, 21]) PM('banc_parc', x, 11); PM('pot_fleurs', 1, 11); PM('buste', 14, 11);
      PM('console_doree', 1, 37, 1); PM('vase_chine', 1, 40); PM('statue_antique', 1, 42); PM('oranger_caisse', 13, 42); PM('torchere', 13, 17); PM('buste', 1, 17);
      const gl = GAL_LUS[fl]; if (gl) { for (const x of [13, 24]) PM(gl, x, 13); PM(gl, 7, 30); }
      if (fl === 1) { // Salon d'honneur · Salle des Mariages · Bureau du Maire
        P('tapis_savonnerie', 8, 3); P('cheminee_marbre', 9, 1); P('gueridon', 9, 3); P('canape_velours', 9, 4, 2); P('fauteuil_louis', 7, 3, 1); P('fauteuil_louis', 12, 3, 3);
        P('console_doree', 2, 1); P('console_doree', 15, 1); P('vase_chine', 1, 1); P('vase_chine', 17, 1); P('piano_droit', 2, 7); P('harpe', 17, 7); P('plante', 1, 9); P('plante', 18, 9);
        for (let x = 26; x <= 30; x++) P('table_banquet', x, 3); P('fauteuil_louis', 28, 2); P('hdv_marianne', 28, 1); PM('hdv_drapeau', 26, 1);
        P('tapis_savonnerie', 27, 5); P('tapis_savonnerie', 27, 7); for (const z of [5, 6, 7, 8]) for (const x of [22, 23, 24, 25]) PM('chaise_velours', x, z, 2);
        PM('pot_fleurs', 21, 2); PM('pot_fleurs', 21, 9); PM('pot_fleurs', 25, 3);
        P('tapis_savonnerie', 45, 4); P('bureau_ecritoire', 46, 4); P('fauteuil_louis', 46, 3); P('chaise_louis', 45, 6, 2); P('chaise_louis', 48, 6, 2);
        for (const x of [40, 41, 53, 54]) P('bibliotheque', x, 1); P('hdv_drapeau', 44, 1); P('hdv_drapeau', 49, 1); P('globe_terrestre', 54, 7); P('horloge', 38, 5); P('fauteuil_louis', 39, 7, 1); P('plante', 55, 9);
      } else if (fl === 2) { // Bibliothèque · Salle du Conseil · Archives
        for (const x of [2, 3, 4, 14, 15, 16]) P('bibliotheque', x, 1); for (const z of [3, 4, 5]) P('bibliotheque', 1, z, 1);
        for (const x of [5, 6, 11, 12]) { P('table_noyer', x, 5); P('chaise_louis', x, 4, 0); P('chaise_louis', x, 6, 2); } P('globe_terrestre', 16, 7); P('gueridon', 16, 4); P('fauteuil_louis', 15, 4, 1); P('lampe_arc', 17, 8);
        for (let x = 24; x <= 32; x++) P('table_noyer', x, 3); for (let z = 4; z <= 7; z++) { P('table_noyer', 24, z); P('table_noyer', 32, z); P('chaise_louis', 23, z, 1); P('chaise_louis', 33, z, 3); }
        P('fauteuil_louis', 28, 2); for (let x = 24; x <= 32; x++) if (x !== 28) P('chaise_louis', x, 2, 0); P('hdv_marianne', 28, 1); PM('hdv_drapeau', 26, 1); P('tapis_savonnerie', 27, 5); PM('banc_parc', 21, 8, 2);
        for (const z of [2, 4, 6]) for (const x of [39, 42, 48, 51]) P('casiers', x, z); P('bureau', 45, 8); P('chaise', 45, 7, 0); P('coffre', 54, 8); P('coffre', 54, 2); P('armoire', 55, 5); P('plante', 38, 9);
      } else if (fl === 3) { // Salon de musique · Salle des Fêtes · Salon des jeux
        P('harpe', 3, 2); P('clavecin', 6, 2); P('piano_droit', 11, 1); P('tabouret', 11, 2); P('torchere', 1, 1); P('torchere', 18, 1);
        for (let x = 5; x <= 13; x++) if (x !== 9) { P('chaise_velours', x, 6, 2); P('chaise_velours', x, 7, 2); }
        P('scene_club', 27, 1); P('piano_droit', 24, 1); P('harpe', 32, 1); for (let z = 3; z <= 8; z++) { P('table_banquet', 20, z); P('table_banquet', 36, z); } PM('torchere', 21, 1); PM('torchere', 21, 9);
        P('billard', 41, 3); P('billard', 49, 3); for (const x of [43, 50]) { P('table', x, 7); P('chaise', x - 1, 7, 1); P('chaise', x + 1, 7, 3); P('chaise', x, 8, 2); }
        P('globe_terrestre', 55, 1); P('console_doree', 38, 1); P('plante', 55, 9);
      } else { // Salon des Ambassadeurs · Salle du Trésor · Belvédère
        P('tapis_savonnerie', 8, 4); P('cheminee_marbre', 9, 1); P('canape_chesterfield', 9, 6, 2); P('fauteuil_louis', 7, 4, 1); P('fauteuil_louis', 12, 4, 3); P('gueridon', 9, 4);
        P('console_doree', 2, 1); P('console_doree', 15, 1); P('vase_chine', 1, 1); P('vase_chine', 17, 1); P('statue_antique', 1, 8); P('statue_antique', 18, 8);
        P('tapis_savonnerie', 27, 4); P('tapis_savonnerie', 27, 6); P('trone', 28, 2); for (const z of [4, 7]) for (const x of [22, 24]) PM('vitrine', x, z);
        PM('armure', 21, 1); PM('vase_chine', 23, 1); PM('statue_antique', 21, 9); P('boule_cristal', 28, 8);
        for (const x of [40, 44, 48, 52]) P('banc_parc', x, 3, 2); P('globe_terrestre', 47, 6); P('lampe_arc', 39, 8); P('plante', 55, 1); P('plante', 38, 1); P('plante', 55, 9);
      }
    }
    if (G.chateauInterior) G.chateauInterior.lustres(m); // les lustres des salons
  }

  // =====================================================================
  // le décor propre à l'Hôtel de Ville : balustrades de l'atrium, bords des planchers, toit de verre, lustre géant, devise
  // =====================================================================
  // les bords de l'atrium sur un niveau : cases de plancher (hors haut des volées) le long du vide → des tronçons droits
  function atriumEdges(fl) {
    const T = gridOf(fl), wells = new Set(), E = new Map();
    for (const q of STAIRS) if (q.lvl === fl - 1) for (let z = q.z0; z <= q.z1; z++) for (let x = q.x0; x <= q.x1; x++) wells.add(z * W + x);
    const isV = (x, z) => x >= AX0 && x < AX1 && z >= AZ0 && z < H && T[z * W + x] === VOID;
    const add = (o, line, t, s) => { const key = o + '|' + line + '|' + s; (E.get(key) || E.set(key, []).get(key)).push(t); };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x; if (T[i] !== FLOOR || wells.has(i)) continue;
      if (isV(x + 1, z)) add('v', x + 1, z, 1); if (isV(x - 1, z)) add('v', x, z, -1); if (isV(x, z + 1)) add('h', z + 1, x, 1); if (isV(x, z - 1)) add('h', z, x, -1); }
    const out = []; for (const [key, list] of E) { const [o, line, s] = key.split('|'); list.sort((a, b) => a - b); let a = list[0];
      for (let k = 1; k <= list.length; k++) if (k === list.length || list[k] !== list[k - 1] + 1) { out.push({ o, line: +line, s: +s, a, b: list[k - 1] + 1 }); a = list[k]; } }
    return out;
  }
  // une pièce posée le long d'un tronçon : u le long du bord (0 → longueur), w vers le vide (+) ou vers le plancher (−)
  const fb = (b, w, h, d, col, x, y, z, ry) => b.fbox ? b.fbox(w, h, d, col, x, y, z, ry) : b.add(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, 0, ry, 0)); // (boîte rapide, ou ordinaire)
  const along = (e, u, w) => e.o === 'v' ? [e.line + e.s * w, e.a + u] : [e.a + u, e.line + e.s * w];
  function balustrade(b, sk, rowGeo, e) {
    const L = e.b - e.a, ry = e.o === 'v' ? PI / 2 : 0, rowM = (u, w, y) => { const [x, z] = along(e, u, w); return new THREE.Matrix4().makeRotationY(e.o === 'v' ? -PI / 2 : 0).setPosition(x, y, z); };
    const box = (u0, u1, w, y, hh, d, col) => { const [x, z] = along(e, (u0 + u1) / 2, w); fb(b, u1 - u0, hh, d, col, x, y, z, ry); };
    b.S(sk.stone); box(0, L, -.16, .07, .14, .32, MARB2); box(0, L, -.16, .87, .1, .26, MARB); b.S(null);
    const n = Math.max(1, Math.floor((L - .2) / .3)); b.S(sk.stone); b.add(rowGeo(n, .075, .6, .075, (L - .2) / n), 0xf8f4ec, rowM(.1 + (L - .2) / n / 2, -.16, .5), 0, true); b.add(rowGeo(n, .12, .16, .12, (L - .2) / n), 0xf8f4ec, rowM(.1 + (L - .2) / n / 2, -.16, .4), 0, true); b.S(null);
    b.S(sk.gold); box(0, L, -.16, .935, .03, .16, GOLD); b.S(null);
    // piliers (tous les 4 m) coiffés d'un globe lumineux
    for (let u = 0; u <= L + .01; u += L / Math.max(1, Math.round(L / 4))) { const [x, z] = along(e, Math.min(L - .17, Math.max(.17, u)), -.16); b.S(sk.stone); fb(b, .3, 1.0, .34, MARB, x, .5, z, ry); fb(b, .36, .08, .4, MARB2, x, 1.03, z, ry); b.S(sk.gold);
      b.add(new THREE.CylinderGeometry(.05, .08, .16, 10), GOLD, b.M(x, 1.15, z)); b.S(null); b.add(new THREE.SphereGeometry(.13, 12, 10), 0xfff1c8, b.M(x, 1.33, z), 1, true); }
  }
  // le bord du plancher du dessus, vu de l'atrium : un bandeau de marbre à filets d'or et denticules (au niveau du plafond)
  function fascia(b, sk, rowGeo, e, y0) {
    const L = e.b - e.a, ry = e.o === 'v' ? PI / 2 : 0, box = (u0, u1, w, y, hh, d, col) => { const [x, z] = along(e, (u0 + u1) / 2, w); fb(b, u1 - u0, hh, d, col, x, y, z, ry); };
    b.S(sk.stone); box(0, L, .08, y0 + .3, .62, .26, MARB); box(0, L, .1, y0 - .02, .1, .3, MARB2); b.S(null);
    b.S(sk.gold); box(0, L, .22, y0 + .52, .04, .04, GOLD); box(0, L, .22, y0 + .1, .03, .04, GOLD); b.S(null);
    const n = Math.max(1, Math.floor((L - .1) / .2)), [x, z] = along(e, .1 + (L - .1) / n / 2, .25); b.S(sk.stone); b.add(rowGeo(n, .07, .07, .07, (L - .1) / n), MARB2, new THREE.Matrix4().makeRotationY(e.o === 'v' ? -PI / 2 : 0).setPosition(x, y0 + .2, z), 0, true); b.S(null);
  }
  // le lustre géant : sept couronnes d'or étagées, des centaines de bougies, des pampilles et des guirlandes de cristal
  function lustre(b, sk, x, z) {
    const TI = [[4.8, 4.6], [10.2, 5.8], [16, 5.4], [21.8, 4.6], [27.6, 3.8], [33.2, 2.8], [37.6, 1.8]], tube = (r, t, y, col = GOLD, seg = 72) => b.add(new THREE.TorusGeometry(r, t, 6, seg), col, b.M(x, y, z, PI / 2, 0, 0), 0, true);
    b.S(sk.gold); b.add(new THREE.CylinderGeometry(.08, .08, ROOF - 4, 10), GOLD, b.M(x, (ROOF + 4) / 2, z)); b.S(null);
    TI.forEach(([y, r], ti) => {
      b.S(sk.gold); tube(r, .1, y); tube(r * 1.03, .05, y - .28); tube(r * .55, .07, y + .05); b.add(new THREE.SphereGeometry(.45, 16, 12), GOLD, b.M(x, y, z, 0, 0, 0, 1, .8, 1), 0, true);
      b.add(new THREE.CylinderGeometry(.25, .42, .6, 14), GOLD, b.M(x, y - .55, z)); b.add(new THREE.ConeGeometry(.3, .7, 12), GOLD, b.M(x, y - 1.15, z, PI, 0, 0));
      const na = 8 + ti % 2 * 4; for (let k = 0; k < na; k++) { const a = k / na * TAU, cx = x + Math.cos(a) * r / 2, cz = z + Math.sin(a) * r / 2; b.fbox(r, .08, .08, GOLD, cx, y, cz, -a);
        b.add(new THREE.TorusGeometry(r * .18, .03, 4, 12, PI), GOLD, b.M(x + Math.cos(a) * r * .78, y - r * .16, z + Math.sin(a) * r * .78, 0, -a + PI / 2, PI), 0, true); }
      b.S(null);
      // bougies et flammes
      const nc = Math.round(r * 7); for (let k = 0; k < nc; k++) { const a = (k + .5) / nc * TAU, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
        b.S(sk.gold); b.add(new THREE.CylinderGeometry(.1, .07, .05, 8), GOLD, b.M(cx, y + .1, cz)); b.S(sk.ceramic); b.add(new THREE.CylinderGeometry(.045, .045, .34, 6), 0xfff8ec, b.M(cx, y + .3, cz)); b.S(null);
        b.add(new THREE.SphereGeometry(.06, 6, 5), 0xffd27a, b.M(cx, y + .52, cz, 0, 0, 0, 1, 1.8, 1), 1, true); }
      // pampilles (en grappes de trois) et guirlandes de perles entre les bras
      const nd = Math.round(r * 9); for (let k = 0; k < nd; k++) { const a = k / nd * TAU, cx = x + Math.cos(a) * r * 1.03, cz = z + Math.sin(a) * r * 1.03;
        for (let j = 0; j < 3; j++) b.add(new THREE.IcosahedronGeometry(.055 - j * .008, 0), 0xeaf6ff, b.M(cx, y - .38 - j * .16, cz, 0, 0, 0, 1, 1.5, 1), (k + j) % 3 ? 0 : 1); }
      for (let k = 0; k < na; k++) { const a0 = k / na * TAU, a1 = (k + 1) / na * TAU; for (let j = 1; j < 9; j++) { const t = j / 9, a = a0 + (a1 - a0) * t, rr = r * .97, sag = Math.sin(t * PI) * (.35 + r * .06);
          b.add(new THREE.IcosahedronGeometry(.045, 0), 0xeaf6ff, b.M(x + Math.cos(a) * rr, y - .3 - sag, z + Math.sin(a) * rr), j % 2, false); } }
      // entre deux couronnes : un vase d'or et une boule de cristal sur la tige
      if (ti < TI.length - 1) { const ym = (y + TI[ti + 1][0]) / 2; b.S(sk.gold); b.add(new THREE.CylinderGeometry(.18, .28, .5, 12), GOLD, b.M(x, ym - .3, z)); b.add(new THREE.CylinderGeometry(.3, .18, .4, 12), GOLD, b.M(x, ym + .15, z)); b.S(null);
        b.add(new THREE.SphereGeometry(.32, 14, 10), 0xdff1ff, b.M(x, ym + .65, z), 1, true); }
    });
    // la goutte du bas et la couronne du haut
    b.S(sk.gold); b.add(new THREE.ConeGeometry(.25, .9, 12), GOLD, b.M(x, 2.9, z, PI, 0, 0)); b.S(null); b.add(new THREE.SphereGeometry(.3, 14, 10), 0xdff1ff, b.M(x, 3.6, z), 1, true);
    b.S(sk.gold); tube(1.2, .08, ROOF - 1.2); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.add(new THREE.ConeGeometry(.08, .45, 6), GOLD, b.M(x + Math.cos(a) * 1.2, ROOF - .95, z + Math.sin(a) * 1.2)); }
    b.add(new THREE.CylinderGeometry(1.6, 1.9, .12, 32), GOLD, b.M(x, ROOF - .1, z)); b.S(null);
  }
  // la devise, en lettres d'or sur le bord de la Galerie d'honneur
  let devT = null; function deviseTex() {
    if (devT) return devT; const c = G.cv(2048, 128), x = c.getContext('2d'); x.font = 'bold 84px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#5a3a10'; x.fillText('LIBERTÉ · ÉGALITÉ · FRATERNITÉ', 1026, 68); x.fillStyle = '#f2cf6a'; x.fillText('LIBERTÉ · ÉGALITÉ · FRATERNITÉ', 1024, 64);
    devT = new THREE.CanvasTexture(c); devT.anisotropy = 4; return devT; }
  function shell(m, { bs, g, pd, sk, rowGeo }) {
    const fl = pd.pl.fl || 0;
    // à chaque étage : la balustrade le long de l'atrium, et sous elle l'épaisseur du plancher (un bandeau de marbre) ; au dernier, la corniche du toit
    if (fl) for (const e of atriumEdges(fl)) { balustrade(bs, sk, rowGeo, e); fascia(bs, sk, rowGeo, e, -.7); }
    if (fl === 1) { // la devise, en lettres d'or sur le bord de la Galerie d'honneur, entre les deux escaliers
      const dv = new THREE.Mesh(new THREE.PlaneGeometry(9.6, .6), new THREE.MeshBasicMaterial({ map: deviseTex(), transparent: true, depthWrite: false, toneMapped: false }));
      dv.position.set(XC, -.38, AZ0 + .29); dv.renderOrder = 3; g.add(dv); }
    if (fl) return;
    if (G.mapLabel && !m._hdvLbl) { m._hdvLbl = 1; G.mapLabel(m, '🏛️ Accueil de la Mairie', XC, 2.75, 34.35, 1.2); G.mapLabel(m, '📜 État civil', 18, 2.4, 38.35, .9); G.mapLabel(m, '🗺️ Urbanisme', 39, 2.4, 38.35, .9); } // (aussi après un chargement)
    lustre(bs, sk, XC, ZL);
    // le toit de verre de l'atrium : une verrière à résille dorée et sa coupole (caché quand la caméra passe au-dessus)
    const rb = G.mb(4720), ax = (AX0 + AX1) / 2, az = (AZ0 + H) / 2, aw = AX1 - AX0, ad = H - AZ0;
    rb.add(new THREE.BoxGeometry(aw, .04, ad), 0xd6ecf7, rb.M(ax, ROOF + .02, az), 2); rb.S(sk.gold);
    for (let k = 0; k <= 9; k++) rb.add(new THREE.BoxGeometry(.1, .16, ad), GOLD, rb.M(AX0 + k * aw / 9, ROOF + .08, az)); for (let k = 0; k <= 10; k++) rb.add(new THREE.BoxGeometry(aw, .16, .1), GOLD, rb.M(ax, ROOF + .08, AZ0 + k * ad / 10));
    rb.S(null); rb.add(new THREE.SphereGeometry(8, 40, 14, 0, TAU, 0, PI / 2), 0xd6ecf7, rb.M(XC, ROOF + .1, ZL, 0, 0, 0, 1, .5, 1), 2, true); rb.S(sk.gold);
    for (let k = 0; k < 16; k++) rb.add(new THREE.TorusGeometry(8, .07, 4, 24, PI / 2), GOLD, rb.M(XC, ROOF + .1, ZL, 0, k / 16 * TAU, 0, 1, .5, 1), 0, true); rb.add(new THREE.TorusGeometry(8, .12, 4, 64), GOLD, rb.M(XC, ROOF + .1, ZL, PI / 2, 0, 0), 0, true);
    rb.S(null); for (const e of atriumEdges(NF - 1)) fascia(rb, sk, rowGeo, e, ROOF - GAP - .6); // la corniche du haut de l'atrium (avec le toit : cachée quand on est au-dessus)
    const roof = new THREE.Mesh(rb.done(), G.MATS); roof.frustumCulled = false; g.add(roof); m._hdvRoof = roof;
  }
  G.CHGEN = G.CHGEN || {}; G.CHGEN.mairie = { plan, furnish, shell };

  // =====================================================================
  // les meubles de l'Hôtel de Ville
  // =====================================================================
  const obj = (id, n, fp, h, p) => { O[id] = Object.assign({ id, n, model: id, v: 0, fp, h }, p || {}); };
  // le grand comptoir d'honneur (15 cases) : marbre blanc, panneaux d'acajou à filets d'or, lampes de banquier, médaillon de la République
  function comptoir(b, w) {
    const hw = w / 2 - .05; b.S(G.SK && G.SK.stone); b.box(w, .12, 1.9, 0x2a2628, 0, .06, 0); b.S(null);
    b.S(G.SK && G.SK.wood); b.box(w - .1, .95, 1.55, 0x5a3220, 0, .6, -.08); b.S(null);
    const np = Math.round(w / 2.1); for (let k = 0; k < np; k++) { const x = -hw + (k + .5) * (2 * hw / np), pw = 2 * hw / np - .3; b.S(G.SK && G.SK.wood); b.box(pw, .62, .04, 0x7a4428, x, .58, .7); b.S(G.SK && G.SK.gold);
      b.box(pw + .04, .025, .03, GOLD, x, .9, .72); b.box(pw + .04, .025, .03, GOLD, x, .26, .72); b.box(.025, .62, .03, GOLD, x - pw / 2, .58, .72); b.box(.025, .62, .03, GOLD, x + pw / 2, .58, .72); b.S(null); }
    for (let k = 0; k <= np; k++) { const x = -hw + k * (2 * hw / np); b.S(G.SK && G.SK.stone); b.box(.2, .98, .12, MARB, x, .6, .68); b.S(G.SK && G.SK.gold); b.box(.24, .06, .14, GOLD, x, 1.06, .68); b.S(null); }
    b.S(G.SK && G.SK.stone); b.box(w + .1, .07, 1.8, MARB, 0, 1.1, -.03); b.box(w, .26, .36, MARB2, 0, 1.27, .62); b.box(w + .06, .05, .42, MARB, 0, 1.42, .62); b.S(null);
    b.S(G.SK && G.SK.gold); b.box(w + .12, .03, .03, GOLD, 0, 1.135, .87); b.box(w + .08, .03, .03, GOLD, 0, 1.45, .84); b.S(null);
    if (w > 10) { b.S(G.SK && G.SK.gold); b.cyl(.36, .36, .06, 24, GOLD, 0, .62, .76, PI / 2, 0, 0); b.S(null); b.cyl(.27, .27, .065, 24, 0x2f4f9a, 0, .62, .77, PI / 2, 0, 0); b.S(G.SK && G.SK.gold); b.box(.06, .26, .02, GOLD, -.06, .62, .81); b.box(.16, .05, .02, GOLD, 0, .7, .81); b.box(.06, .26, .02, GOLD, .08, .62, .81); b.S(null); }
    for (const x of [-hw * .7, 0, hw * .7]) { b.S(G.SK && G.SK.gold); b.cyl(.09, .11, .04, 12, GOLD, x, 1.16, -.35); b.cyl(.015, .015, .32, 6, GOLD, x, 1.32, -.35); b.S(null);
      b.add(new THREE.CylinderGeometry(.1, .22, .12, 16, 1, true, 0, PI), 0x2f8a5a, b.M(x, 1.5, -.35, 0, 0, PI / 2), 1, true); b.sph(.05, 0xfff1c8, x, 1.47, -.35, 1, 1, 1, 1); }
    for (const x of [-hw * .35, hw * .35]) { b.box(.4, .06, .3, 0xf7f5ee, x, 1.17, -.3); b.box(.38, .05, .28, 0xefe9dc, x + .02, 1.22, -.31); }
    b.S(G.SK && G.SK.gold); b.sph(.07, GOLD, hw * .15, 1.19, -.2, 1, .7, 1); b.cyl(.012, .012, .08, 6, GOLD, hw * .15, 1.25, -.2); b.S(null);
    for (const s of [-1, 1]) { b.S(G.SK && G.SK.gold); b.cyl(.14, .2, .3, 12, GOLD, s * (hw - .1), 1.6, .62); b.sph(.16, GOLD, s * (hw - .1), 1.86, .62); b.cone(.07, .25, 8, GOLD, s * (hw - .1), 2.08, .62); b.S(null); }
  }
  MD.hdv_accueil = () => { const b = G.mb(4700); comptoir(b, 15); return b.done(); };
  MD.hdv_guichet = () => { const b = G.mb(4701); comptoir(b, 6); b.S(G.SK && G.SK.gold); for (let k = 0; k <= 16; k++) b.cyl(.012, .012, .7, 6, GOLD, -2.6 + k * 5.2 / 16, 1.8, .62); b.box(5.3, .05, .05, GOLD, 0, 2.15, .62); b.S(null); return b.done(); };
  obj('hdv_accueil', 'Grand comptoir d’accueil', [15, 2], 1.5, { fixed: 1 }); obj('hdv_guichet', 'Guichet', [6, 2], 2.2, { fixed: 1 });
  // une colonne colossale : base attique, fût cannelé de marbre, chapiteau corinthien doré (8 m, du sol au plafond)
  MD.hdv_colonne = () => { const b = G.mb(4702), sh = CH - 1.35; b.S(G.SK && G.SK.stone); b.box(.98, .32, .98, MARB2, 0, .16, 0); b.tor(.42, .07, MARB, 0, .38, 0, PI / 2, 0, 0, 0, 24); b.tor(.38, .05, MARB, 0, .5, 0, PI / 2, 0, 0, 0, 24);
    b.cyl(.33, .37, sh, 24, MARB, 0, .55 + sh / 2, 0, 0, 0, 0, 0, true); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; b.box(.04, sh - .3, .04, MARB2, Math.cos(a) * .35, .55 + sh / 2, Math.sin(a) * .35); } b.S(null);
    const y = .55 + sh; b.S(G.SK && G.SK.gold); b.tor(.35, .05, GOLD, 0, y, 0, PI / 2, 0, 0, 0, 24); b.cyl(.48, .34, .55, 20, GOLD, 0, y + .3, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.geo(new THREE.SphereGeometry(.13, 8, 6), GOLD, b.M(Math.cos(a) * .42, y + .3, Math.sin(a) * .42, 0, -a, 0, .5, 1.4, .9), 0, true); b.sph(.07, GOLD, Math.cos(a + PI / 8) * .5, y + .52, Math.sin(a + PI / 8) * .5); } b.S(null);
    b.S(G.SK && G.SK.stone); b.box(1.1, .22, 1.1, MARB, 0, y + .7, 0); b.S(null); b.S(G.SK && G.SK.gold); b.box(1.14, .05, 1.14, GOLD, 0, y + .58, 0); b.S(null); return b.done(); };
  obj('hdv_colonne', 'Colonne de marbre', [1, 1], CH, { fixed: 1 });
  // un drapeau tricolore sur sa hampe dorée
  MD.hdv_drapeau = () => { const b = G.mb(4703); b.S(G.SK && G.SK.gold); b.cyl(.18, .22, .12, 14, GOLD, 0, .06, 0); b.cyl(.03, .03, 3.4, 8, GOLD, 0, 1.75, 0); b.sph(.06, GOLD, 0, 3.47, 0); b.cone(.05, .22, 8, GOLD, 0, 3.6, 0); b.S(null);
    b.S(G.SK && G.SK.fabric); [0x1f4fa8, 0xf7f5ee, 0xd8343a].forEach((c, i) => { for (let k = 0; k < 3; k++) { const x = .05 + i * .36 + k * .12 + .06, z = Math.sin(x * 4.5) * .07; b.add(new THREE.BoxGeometry(.125, 1.0, .02), c, b.M(x, 2.75 - x * .18, z, 0, -Math.cos(x * 4.5) * .3, -.05)); } }); b.S(null);
    b.S(G.SK && G.SK.gold); b.add(new THREE.BoxGeometry(1.1, .04, .03), GOLD, b.M(.58, 2.21, .02, 0, 0, -.15)); b.cyl(.012, .012, .5, 6, GOLD, .02, 2.95, .05, 0, 0, .3); b.sph(.05, GOLD, .1, 2.7, .06, 1, 1.6, 1); b.S(null); return b.done(); };
  obj('hdv_drapeau', 'Drapeau tricolore', [1, 1], 3.7, { fixed: 1 });
  // Marianne : buste de marbre au bonnet phrygien, sur un piédestal marqué RF
  MD.hdv_marianne = () => { const b = G.mb(4704), WM = 0xf4f1ea; b.S(G.SK && G.SK.stone); b.box(.62, .14, .62, MARB2, 0, .07, 0); b.box(.5, .9, .5, MARB, 0, .58, 0); b.box(.62, .12, .62, MARB2, 0, 1.08, 0); b.S(null);
    b.S(G.SK && G.SK.gold); b.box(.06, .2, .02, GOLD, -.08, .62, .26); b.box(.1, .05, .02, GOLD, -.05, .7, .26); b.box(.06, .2, .02, GOLD, .08, .62, .26); b.box(.1, .05, .02, GOLD, .11, .66, .26); b.S(null);
    b.S(G.SK && G.SK.stone); b.sph(.28, WM, 0, 1.36, 0, 1.35, .7, .75); b.cyl(.07, .08, .16, 10, WM, 0, 1.6, .01); b.sph(.16, WM, 0, 1.8, .02, .9, 1.05, .95); b.sph(.16, WM, 0, 1.86, -.02, 1, .9, 1);
    b.add(new THREE.ConeGeometry(.13, .32, 10), WM, b.M(0, 2.0, .06, .95, 0, 0)); b.sph(.07, WM, 0, 1.7, -.13, 1.2, 1, .9); b.S(null);
    for (const [r, c] of [[.06, 0x1f4fa8], [.042, 0xf7f5ee], [.024, 0xd8343a]]) b.cyl(r, r, .015, 14, c, -.15, 1.9, .05 + (.06 - r) * .1, 0, 0, PI / 2); return b.done(); };
  obj('hdv_marianne', 'Marianne', [1, 1], 2.3, { fixed: 1 });
  // le tapis rouge, de la porte au comptoir
  MD.hdv_tapis = () => { const b = G.mb(4705); b.S(G.SK && G.SK.velvet); b.add(new THREE.BoxGeometry(4.7, .02, 7.7), 0x9a1f2a, b.M(0, .012, 0)); b.S(G.SK && G.SK.gold);
    for (const s of [-1, 1]) { b.add(new THREE.BoxGeometry(.08, .024, 7.5), GOLD, b.M(s * 2.2, .014, 0)); b.add(new THREE.BoxGeometry(4.4, .024, .08), GOLD, b.M(0, .014, s * 3.7)); }
    for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(.45, .03, 4, 20), GOLD, b.M(0, .02, -2.7 + k * 1.8, PI / 2, 0, 0), 0, true); b.S(null); return b.done(); };
  obj('hdv_tapis', 'Tapis rouge', [5, 8], .02, { walk: 1, floor: 1 });

  // =====================================================================
  // les employés de l'État civil et de l'Urbanisme
  // =====================================================================
  G.NPCLX = G.NPCLX || {};
  G.NPCLX['Monsieur Tampon'] = { gender: 'g', hair: 'raie', hairCol: 0x8a8f99, top: 'costume', topCol: 0x2f3a4a, bottom: 'pantalon', botCol: 0x22262c, shoe: 'derbies', shoes: 0x1a1a1a, eyes: 'serieux', acc: 'lunettes', ex: { moustache: 0x8a8f99 } };
  G.NPCLX['Madame Cadastre'] = { gender: 'f', hair: 'chignon', hairCol: 0x6b4426, top: 'blouse', topCol: 0xf7f2e8, bottom: 'jupe_plissee', botCol: 0x2f4a6a, shoe: 'ballerines', shoes: 0x2f4a6a, eyes: 'doux', acc: 'collier', lashes: true };
  G.NPCS.hdv_ec = { n: 'Monsieur Tampon', sp: 'commercant', col: 0x8a8f99, shirt: 0x2f3a4a, pitch: .9 };
  G.NPCS.hdv_urb = { n: 'Madame Cadastre', sp: 'commercant', col: 0x6b4426, shirt: 0xf7f2e8, pitch: 1.18 };
  const PN = s => s.replace(/\{p\}/g, G.playerName || 'toi').replace(/\{v\}/g, G.villageName || 'la vallée');
  G.npcRoles.hdv_ec = v => G.npcSay(v, [PN(G.pick(['Bonjour {p} ! Naissances, mariages, déménagements : tout passe par mon tampon. Clac !', 'État civil, bonjour ! Vous venez pour un mariage ? La Salle des Mariages est au premier étage, par le grand escalier.', 'Le registre de {v} remonte à sa fondation. Il est rangé aux Archives, au deuxième étage.']))]);
  G.npcRoles.hdv_urb = v => G.npcSay(v, [PN(G.pick(['Bonjour {p} ! Une maison, un château, un pont ? Ici, on étudie tous les plans du village.', 'La plus belle vue de {v} ? Montez au Belvédère, tout en haut, au quatrième étage !', 'Ce lustre ? Il descend sur cinq étages et compte plus de deux cents bougies. On l’allume chaque matin.']))]);

  // =====================================================================
  // en entrant : l'Hôtel de Ville est prêt (refait s'il date d'une ancienne version), ses cinq niveaux aussi
  // =====================================================================
  const CI = () => G.chateauInterior;
  function prep(o) {
    const d = o && O[o.t]; if (!d || d.enter !== 'mairie' || (G.net && G.net.visit) || !CI()) return;
    if (!o.iid) o.iid = 'b' + o.t + '_' + o.x + '_' + o.z; const iid = o.iid, im = G.interiors[iid];
    if (im && im.meta.plan && im.meta.plan.sig === SIG) { CI().ensureFloors(im); return; }
    const drop = q => { if (!q) return; if (G.ents && G.ents.removeNPCs) G.ents.removeNPCs(q); G.scene.remove(q.group); };
    drop(im); for (let f = 1; f < NF; f++) { drop(G.interiors[iid + '_f' + f]); delete G.interiors[iid + '_f' + f]; }
    const nm = CI().makePlanInterior(iid, { gen: 'mairie' }, null); nm.meta.title = 'Hôtel de Ville';
    G.interiors[iid] = nm; G.scene.add(nm.group); nm.group.visible = false; CI().ensureFloors(nm);
  }
  const oen = G.act.enterHouse; G.act.enterHouse = o => { try { prep(o); } catch (e) { console.warn('Hôtel de Ville', e); } return oen(o); };
  // la première image : du haut de l'atrium, on plonge le long du lustre jusqu'au comptoir
  const INTRO = 5.2;
  G.on('enterMap', m => { if (G._chSwap || !m || !m.meta || !m.meta.plan || m.meta.plan.gen !== 'mairie' || (m.meta.plan.fl || 0)) return; m._atrA = 1; m._intro = INTRO; });
  G.on('frame', dt => {
    const m = G.map; if (!m || !m.interior || !m.meta || !m.meta.plan || m.meta.plan.gen !== 'mairie') return; const cm = m.meta.cam; if (!cm) return;
    const A = (m.meta.plan.fl || 0) ? 0 : (m._atrA || 0), s = A * A * (3 - 2 * A); // au milieu de l'atrium : la caméra recule et lève les yeux
    let pitch = G.lerp(CAMB.pitch, .5, s), dist = G.lerp(CAMB.dist, 27, s), ty = G.lerp(CAMB.ty, 5, s), dz = G.lerp(CAMB.dz, -1.5, s);
    // en entrant : d'abord tout l'atrium, du sol au toit de verre (les cinq niveaux, le lustre entier), puis la caméra descend vers le joueur
    if (m._intro > 0) { m._intro -= Math.min(dt || 0, .1); const t = G.clamp((INTRO - 1.4 - m._intro) / (INTRO - 1.4), 0, 1), e = t * t * (3 - 2 * t); pitch = G.lerp(.15, pitch, e); dist = G.lerp(46, dist, e); ty = G.lerp(21, ty, e); dz = G.lerp(ZL - 2.5 - (G.player ? G.player.z : 41), dz, e); }
    cm.pitch = pitch; cm.dist = dist; cm.ty = ty; cm.dz = dz;
    const base = m.meta.base ? G.interiors[m.meta.base] : m; if (base && base._hdvRoof && G.camera) base._hdvRoof.visible = G.camera.position.y < base.group.position.y + ROOF - .4;
    if (base) for (let f = 0; f < NF; f++) { const F = f ? G.interiors[base.id + '_f' + f] : base; if (!F || !F.group) continue; const want = F === m, nk = F.group.children.length; if (F._hdvSh === want && F._hdvShN === nk) continue; F._hdvSh = want; F._hdvShN = nk;
      F.group.traverse(c => { if (!c.isMesh) return; if (c.userData.hdvCS == null) c.userData.hdvCS = c.castShadow; c.castShadow = want && c.userData.hdvCS; }); }
  });
})();
