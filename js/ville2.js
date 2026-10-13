'use strict';
// ===== Le village deux fois plus grand : 11 parcelles de plus à l'est (22 × 6) avec de nouveaux quartiers —
// quartier résidentiel et ses quatre nouveaux habitants, grand parc et son étang, aérodrome (piste, hangar, biplan,
// aviateur), ferme (lavande, tournesols, grange, moulin), petit port — et les anciennes sauvegardes s'agrandissent
// toutes seules au chargement (tout ce qui existait est conservé, la nouvelle moitié est générée à côté). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, PI = Math.PI, A = G.ACRE, B = G.BORDER, PT = G.PAT, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const WIN = 0xfff0c2, IRON = 0x2b2f33;
  const P = (...a) => G.prism(...a);
  const seg = (b, a, c, r, col, n = 6, mat = 0) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, false); g.translate(0, L / 2, 0);
    b.add(g, col, new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); };

  // ---------- modèles ----------
  // hangar de l'aéro-club : voûte de tôle, grandes portes coulissantes ouvertes (6 × 5, ouverture vers +z)
  MD.hangar = v => { const b = G.mb(1101).S(G.SK.paint), R = 2.9, D = 4.7, TO = 0xb9c6b0, TD = 0x7f8d7c; // tôle peinte, pas du métal nu
    b.add(new THREE.CylinderGeometry(R, R, D, 28, 1, true, -PI / 2, PI), TO, b.M(0, 0, 0, -PI / 2, 0, 0), 0, true);
    b.add(new THREE.CylinderGeometry(R - .05, R - .05, D, 28, 1, true, -PI / 2, PI), 0x4a4f4a, b.M(0, 0, 0, -PI / 2, 0, 0, -1, 1, 1), 0, false); // dessous de la voûte
    for (let k = 0; k <= 6; k++) b.add(new THREE.TorusGeometry(R + .02, .035, 5, 28, PI), TD, b.M(0, 0, -D / 2 + k * D / 6), 0, true);
    const back = new THREE.Shape(); back.absarc(0, 0, R, 0, PI, false); b.add(new THREE.ExtrudeGeometry(back, { depth: .08, bevelEnabled: false, curveSegments: 24 }), TO, b.M(0, 0, -D / 2 - .04), 0, false);
    const fr = new THREE.Shape(); fr.moveTo(R, 0); fr.absarc(0, 0, R, 0, PI, false); fr.lineTo(-2.1, 0); fr.lineTo(-2.1, 2.45); fr.lineTo(2.1, 2.45); fr.lineTo(2.1, 0); fr.lineTo(R, 0); // pignon avec l'ouverture des portes
    b.add(new THREE.ExtrudeGeometry(fr, { depth: .08, bevelEnabled: false, curveSegments: 24 }), TO, b.M(0, 0, D / 2 - .04), 0, false);
    for (const s of [-1, 1]) { b.box(1.2, 2.45, .06, 0x7c8a7c, s * 2.55, 1.23, D / 2 + .09); for (let k = 0; k < 4; k++) b.box(.03, 2.4, .07, TD, s * (2.02 + k * .35), 1.23, D / 2 + .1); b.box(1.25, .08, .12, IRON, s * 2.55, 2.5, D / 2 + .1); }
    b.box(4.4, .1, .14, IRON, 0, 2.52, D / 2 + .08); b.box(2.6, .42, .06, 0xf7f5ee, 0, 2.86, D / 2 + .07); b.box(2.66, .05, .07, 0xd8343a, 0, 3.08, D / 2 + .075); b.box(2.66, .05, .07, 0xd8343a, 0, 2.64, D / 2 + .075);
    b.S(null); b.box(5.6, .04, 4.6, 0x8f9088, 0, .02, 0); // sol de béton
    b.box(1.6, .8, .55, 0x8a5a34, -1.9, .4, -1.9); b.box(1.7, .05, .6, 0x6b4426, -1.9, .82, -1.9); for (const s of [-1, 1]) b.box(.06, .45, .06, IRON, -1.9 + s * .5, 1.08, -2.05); // établi
    b.cyl(.28, .28, .85, 14, 0xd8343a, 2.1, .43, -1.7); b.cyl(.28, .28, .85, 14, 0x3f6fb8, 1.5, .43, -2.0); for (let k = 0; k < 3; k++) b.box(.5, .5, .5, 0xb08a5a, 2.0 - k * .3, .25 + (k === 2 ? .5 : 0), -.9 + (k === 2 ? -.15 : k * .55));
    for (const s of [-1, 1]) { b.box(.1, .9, .03, 0x8a5a34, -.6 + s * .25, 1.7, -2.3, 0, 0, s * .5); } b.sph(.08, 0xd8343a, -.6, 1.7, -2.28); // hélice de rechange au mur
    for (let k = 0; k < 3; k++) { b.cyl(.04, .04, .3, 6, IRON, -1 + k, 2.75, 0); b.sph(.12, 0xfff1c8, -1 + k, 2.55, 0, 1, .7, 1, 1); } // lampes de la voûte
    return b.done(); };
  // manche à air rayée
  MD.manche_air = v => { const b = G.mb(1102); b.cyl(.06, .08, 3.2, 8, 0xf7f5ee, 0, 1.6, 0); for (let k = 0; k < 4; k++) b.cyl(.065, .065, .25, 8, 0xd8343a, 0, .4 + k * .8, 0); b.cyl(.14, .16, .1, 10, 0x5a5f68, 0, .05, 0);
    b.add(new THREE.TorusGeometry(.2, .02, 6, 16), IRON, b.M(.05, 3.12, 0, 0, PI / 2, 0), 0, true);
    for (let k = 0; k < 5; k++) { const r0 = .2 - k * .03, r1 = .2 - (k + 1) * .03, x = .12 + k * .26; b.add(new THREE.CylinderGeometry(r1, r0, .26, 14, 1, true), k % 2 ? 0xffffff : 0xff6a1a, b.M(x, 3.12 - k * .05, 0, 0, 0, -PI / 2 - .2), 0, true); }
    return b.done(); };
  // petite tour de contrôle (2 × 2)
  MD.tour_controle = v => { const b = G.mb(1103), WL = 0xf3efe6;
    b.box(1.6, 2.6, 1.6, WL, 0, 1.3, 0); b.box(1.7, .1, 1.7, 0x3f6fb8, 0, 2.62, 0); b.box(.6, 1.2, .06, 0x5a3a22, 0, .6, .82); b.box(.5, .5, .06, WIN, .45, 1.8, .82, 0, 0, 0, 1);
    b.box(1.9, .1, 1.9, 0xd9d2c2, 0, 2.72, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.04, .45, .04, IRON, Math.cos(a) * .92, 3.0, Math.sin(a) * .92); } b.add(new THREE.TorusGeometry(.93, .025, 6, 24), IRON, b.M(0, 3.22, 0, PI / 2, 0, 0), 0, true);
    b.cyl(.62, .7, .9, 8, 0xcfe8f5, 0, 3.22, 0, 0, PI / 8, 0, 2); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + PI / 8; b.box(.04, .9, .04, 0x3f6fb8, Math.cos(a) * .66, 3.22, Math.sin(a) * .66); }
    b.cyl(.8, .72, .14, 8, 0x3f6fb8, 0, 3.73, 0, 0, PI / 8, 0); b.cyl(.03, .03, .8, 6, IRON, 0, 4.2, 0); b.sph(.07, 0xff3b30, 0, 4.62, 0, 1, 1, 1, 1);
    return b.done(); };
  // balise de bord de piste (s'allume la nuit)
  MD.balise = v => { const b = G.mb(1104); b.cyl(.05, .07, .22, 8, 0xf7f5ee, 0, .11, 0); b.sph(.07, v ? 0x9fd0ff : 0xfff1c8, 0, .26, 0, 1, 1.2, 1, 1); return b.done(); };
  // grange rouge à toit brisé (5 × 4, porte vers +z)
  MD.grange = v => { const b = G.mb(1105), RD = 0xb03a2e, WH = 0xf7f5ee, RF = 0x55504a, W = 4.8, D = 3.8, H = 2.4;
    b.P(PT.pierre).box(W + .1, .3, D + .1, 0xb8b0a0, 0, .15, 0).P(0); b.P(PT.planches).box(W, H - .3, D, RD, 0, .3 + (H - .3) / 2, 0).P(0);
    // toit brisé : pans raides en bas, pans doux en haut, pignons
    for (const s of [-1, 1]) { b.box(1.25, .1, D + .3, RF, s * 1.95, H + .45, 0, 0, 0, s * -1.0); b.box(1.5, .1, D + .3, RF, s * .75, H + 1.05, 0, 0, 0, s * -.42); }
    const gab = new THREE.Shape(); gab.moveTo(-W / 2, 0); gab.lineTo(W / 2, 0); gab.lineTo(W / 2 - .48, .82); gab.lineTo(0, 1.32); gab.lineTo(-W / 2 + .48, .82); gab.lineTo(-W / 2, 0);
    for (const z of [D / 2 - .04, -D / 2 - .04]) b.add(new THREE.ExtrudeGeometry(gab, { depth: .08, bevelEnabled: false }), RD, b.M(0, H, z), 0, false);
    // portes à croix blanches, fenêtre de fenil avec du foin, girouette
    for (const s of [-1, 1]) { const x = s * .55; b.box(1.05, 1.9, .06, RD, x, 1.25, D / 2 + .04); b.box(1.05, .07, .07, WH, x, 2.18, D / 2 + .06); b.box(1.05, .07, .07, WH, x, .32, D / 2 + .06); b.box(.07, 1.9, .07, WH, x + s * .5, 1.25, D / 2 + .06);
      b.box(.07, 2.1, .07, WH, x, 1.25, D / 2 + .065, 0, 0, s * .5); b.box(.07, 2.1, .07, WH, x, 1.25, D / 2 + .065, 0, 0, -s * .5); }
    b.box(.9, .75, .06, 0x2a1d14, 0, H + .55, D / 2 + .05); b.box(1.0, .06, .07, WH, 0, H + .95, D / 2 + .07); b.box(1.0, .06, .07, WH, 0, H + .16, D / 2 + .07); b.jit(.2); for (let k = 0; k < 5; k++) b.box(.25, .12, .2, 0xe8c56b, -.3 + k * .15, H + .25, D / 2 + .08, 0, k, .3); b.jit(0);
    b.cyl(.02, .02, .6, 6, IRON, 0, H + 1.6, 0); b.box(.5, .02, .02, IRON, 0, H + 1.6, 0); b.box(.02, .02, .5, IRON, 0, H + 1.6, 0); b.box(.28, .18, .02, 0x2a2d33, .05, H + 1.84, 0);
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { b.box(.5, .6, .05, WIN, s * (W / 2 + .02), 1.4, -.8 + k * 1.6, 0, PI / 2, 0, 1); b.box(.6, .7, .04, WH, s * (W / 2 + .01), 1.4, -.8 + k * 1.6, 0, PI / 2, 0); }
    return b.done(); };
  // botte de foin ronde
  MD.botte_foin = v => { const b = G.mb(1106 + v); b.cyl(.42, .42, .7, 18, 0xe2bd62, 0, .42, 0, 0, v ? PI / 2 : 0, PI / 2); for (const s of [-1, 1]) { const x = v ? 0 : s * .352, z = v ? s * .352 : 0; b.add(new THREE.TorusGeometry(.24, .02, 5, 18), 0xc8a048, b.M(x, .42, z, 0, v ? 0 : PI / 2, 0), 0, true); b.add(new THREE.TorusGeometry(.12, .02, 5, 14), 0xc8a048, b.M(x, .42, z, 0, v ? 0 : PI / 2, 0), 0, true); } return b.done(); };
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p);
  obj('hangar', 'Hangar de l\'aéro-club', 'hangar', { fp: [6, 5], h: 3.2, fixed: 1 });
  obj('manche_air', 'Manche à air', 'manche_air', { h: 3.2, take: 1 });
  obj('tour_controle', 'Tour de contrôle', 'tour_controle', { fp: [2, 2], h: 4.6, fixed: 1 });
  obj('balise', 'Balise de piste', 'balise', { h: 0, light: 1, take: 1, li: .5, ly: .3, ld: 3 });
  obj('grange', 'Grange', 'grange', { fp: [5, 4], h: 3.8, fixed: 1 });
  obj('botte_foin', 'Botte de foin', 'botte_foin', { h: .84, walk: 1, take: 1 });
  obj('maison_deco', 'Maison', 'house', { v: 10, fp: [3, 3], h: 3.4, fixed: 1 });
  const item = (id, n, cat, sell) => { G.ITEMS[id] = { id, n, stack: 99, sell, kind: 'place', obj: id, cat, thumb: 'obj:' + id }; };
  item('manche_air', 'Manche à air', 'mobilier', 180); item('balise', 'Balise de piste', 'mobilier', 60); item('botte_foin', 'Botte de foin', 'mobilier', 40);
  for (const id of ['manche_air', 'botte_foin']) if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);

  // ---------- nouveaux habitants et personnages ----------
  const NEWV = [
    { n: 'Capucine', sp: 'renard', col: 0xe07b39, acc: 0xb5532a, shirt: 0x5bb3d6, accent: 0xfaf7f0, neckwear: 0xffd23f, eyeCol: 0x5a3a22, eyes: 'anime', mouth: 'sourire', catch: 'youpi', pitch: 1.25, house: 13 },
    { n: 'Firmin', sp: 'mouton', col: 0xf3efe6, acc: 0x8d6fd1, shirt: 0x8d6fd1, accent: 0xfaf7f0, eyeCol: 0x4a4038, eyes: 'endormis', mouth: 'petit', catch: 'bêêh', pitch: .88, house: 17 },
    { n: 'Rosalie', sp: 'chat', col: 0x8a8aa0, acc: 0xff8fc0, shirt: 0xff8fc0, accent: 0xffe7f0, neckwear: 0x3d4f7a, eyeCol: 0x52976a, eyes: 'chat', mouth: 'chat', catch: 'mimi', pitch: 1.3, house: 21 },
    { n: 'Anatole', sp: 'chien', col: 0xb5865a, acc: 0x3f9a59, shirt: 0x3f9a59, accent: 0xf3ead2, eyeCol: 0x3a2a1a, eyes: 'rond', mouth: 'sourire', catch: 'wouf', pitch: .95, house: 25 }];
  const V0 = G.VILLAGERS.length; for (const v of NEWV) if (!G.VILLAGERS.some(x => x.n === v.n)) G.VILLAGERS.push(v);
  const VI = NEWV.map(v => G.VILLAGERS.findIndex(x => x.n === v.n)); // indices des nouveaux habitants
  G.NPCLX = Object.assign(G.NPCLX || {}, {
    'Capucine': { gender: 'f', hair: 'queue', hairCol: 0xe07b39, hat: 'renard', hatCol: 0xe07b39, top: 'robe', topCol: 0x5bb3d6, shoe: 'ballerines', shoes: 0xffd23f, eyes: 'anime', eyeCol: 0x5a3a22, tail: 'renard', tailCol: 0xe07b39, lashes: true, acc: 'echarpe', accCol: 0xffd23f },
    'Firmin': { gender: 'g', hair: 'boucles', hairCol: 0xf3efe6, top: 'pull', topCol: 0x8d6fd1, bottom: 'pantalon', botCol: 0x4a4a5a, shoe: 'bottes', shoes: 0x5a3a24, eyes: 'endormis', eyeCol: 0x4a4038, acc: 'lunettes', height: 'grand', brows: 'epais' },
    'Rosalie': { gender: 'f', hair: 'carre', hairCol: 0x8a8aa0, hat: 'oreilles', hatCol: 0x8a8aa0, top: 'chemise', topCol: 0xff8fc0, bottom: 'jupe', botCol: 0x3d4f7a, shoe: 'ballerines', shoes: 0x3d4f7a, eyes: 'chat', eyeCol: 0x52976a, tail: 'chat', tailCol: 0x8a8aa0, mouth: 'chat', lashes: true },
    'Anatole': { gender: 'g', hair: 'court', hairCol: 0xb5865a, hat: 'chien', hatCol: 0xb5865a, top: 'salopette', topCol: 0xf3ead2, botCol: 0x3f6fb8, shoe: 'baskets', shoes: 0xe8434a, eyes: 'rond', eyeCol: 0x3a2a1a, brows: 'epais' },
    'Aimé': { gender: 'g', hair: 'meche', hairCol: 0x6b4426, top: 'veste', topCol: 0x7a4a2a, bottom: 'pantalon', botCol: 0x5a4a3a, shoe: 'bottes', shoes: 0x2a1a10, eyes: 'brillants', eyeCol: 0x3b6a9f, acc: 'echarpe', accCol: 0xfaf7f0, height: 'grand', ex: { moustache: 0x6b4426 } },
    'Mathilde': { gender: 'f', hair: 'chignon', hairCol: 0xb5653a, top: 'chemise', topCol: 0x3f9a59, bottom: 'jupe_longue', botCol: 0x6b4426, shoe: 'bottes', shoes: 0x5a3a22, eyes: 'doux', eyeCol: 0x5a3a22, acc: 'echarpe', accCol: 0xd8343a, lashes: true, ex: { apron: 0xf3e2c4 } } });
  G.NPCS.pilote = { n: 'Aimé', sp: 'aviateur', col: 0x6b4426, shirt: 0x7a4a2a, neckwear: 0xfaf7f0, eyeCol: 0x3b6a9f, pitch: .92 };
  G.npcRoles.pilote = v => G.npcSay(v, ['Bienvenue à l\'aérodrome de ' + G.villageName + ' ! Je suis Aimé, chef pilote de l\'aéro-club.', 'Notre biplan t\'attend au bout de la piste : approche-toi et appuie sur E pour monter à bord.'],
    ['Comment on pilote ?', 'Une astuce de voltige ?', 'Au revoir']).then(k => {
    if (k === 0) return G.npcSay(v, ['Z pour pousser les gaz, et on roule tout droit sur la piste.', 'Passé 55 km/h, tire sur le manche avec Espace : on décolle !', 'Q et D font pencher l\'avion pour virer, Maj pour piquer. V change la vue, et le cockpit est magnifique.', 'Pour atterrir : réduis les gaz, descends doucement et pose-toi bien à plat. Ou appuie sur E, l\'avion se pose tout seul !']);
    if (k === 1) return G.npcSay(v, ['Appuie sur F en vol : fumée blanche, puis fumée arc-en-ciel !', 'Fais un grand cercle au-dessus du village… tout le monde lèvera les yeux.']); });

  // ---------- les nouvelles parcelles ----------
  Object.assign(G.ACRES, {
    quartier: { n: 'Quartier résidentiel', col: '#f2c1a8', ico: '🏘️', lvl: 0, struct: 'quartier' },
    parc: { n: 'Grand parc', col: '#79c96f', ico: '🌳', lvl: 0, struct: 'parc' },
    aerodrome: { n: 'Aérodrome', col: '#cfdc8f', ico: '🛩️', lvl: 0, struct: 'aerodrome' },
    ferme: { n: 'Ferme', col: '#e8c56b', ico: '🌻', lvl: 0, struct: 'ferme' },
    port: { n: 'Port', col: '#9fc9e8', ico: '⛵', lvl: 0, beach: 1, struct: 'port' } });
  const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
  const flower = r => (r() < .5 ? 'tulipe_' : 'fleur_') + FL[Math.floor(r() * 7)];
  // quartier : une ruelle pavée, quatre maisons avec jardin ; les nouveaux habitants d'abord, puis des voisins
  G.STRUCT.quartier = c => { const { map, ox, oz, put, flat, targets, meta, surf, I, r } = c; flat(ox + 1, oz + 2, 14, 13);
    for (let x = ox + 1; x < ox + 15; x++) for (const z of [oz + 8, oz + 9]) surf[I(x, z)] = 4;
    for (let x = ox + 1; x < ox + 15; x++) for (const z of [oz + 7, oz + 10]) surf[I(x, z)] = 11;
    meta.nvi = meta.nvi || 0;
    for (const [hx, hz, rot] of [[ox + 2, oz + 3, 0], [ox + 10, oz + 3, 0], [ox + 2, oz + 11, 2], [ox + 10, oz + 11, 2]]) {
      const vi = meta.nvi < VI.length ? VI[meta.nvi] : -1, front = rot ? hz - 1 : hz + 3; let o;
      if (vi >= 0) { o = put('maison_hab', hx, hz, rot, { v: G.VILLAGERS[vi].house, vi }); if (o) { meta.nvi++; meta.homes.push({ vi, x: hx + 1.5, z: rot ? hz - .7 : hz + 3.7 }); } }
      else o = put('maison_deco', hx, hz, rot, { v: 4 + Math.floor(r() * 24) });
      if (!o) continue;
      put('boite_lettres', rot ? hx - 1 : hx + 3, front); put(flower(r), rot ? hx + 3 : hx - 1, front); put(flower(r), hx + (rot ? 3 : -1), rot ? hz + 1 : hz + 1);
      put(G.pick(['pommier', 'cerisier', 'bouleau', 'oranger'], r), rot ? hx + 4 : hx - 2, rot ? hz + 2 : hz);
    }
    for (const lx of [ox + 1, ox + 8, ox + 14]) put('lampadaire', lx, oz + 7);
    targets.push([ox + 8, oz + 8, 4]); (meta.quartiers = meta.quartiers || []).push({ x: ox + 8, z: oz + 8.5 }); };
  // grand parc (jusqu'à 2 × 2 parcelles) : allées de gravier, étang, kiosque à musique, fontaine, jeux, pique-nique
  G.STRUCT.parc = c => { const { map, ox, oz, ax, az, layout, put, flat, targets, meta, surf, water, I, r } = c;
    if (layout[az][ax - 1] === 'parc' || (az > 0 && layout[az - 1][ax] === 'parc')) return;
    const w = layout[az][ax + 1] === 'parc' ? 2 : 1, h = az + 1 < layout.length && layout[az + 1][ax] === 'parc' ? 2 : 1, PW = w * A, PH = h * A, cx = ox + PW / 2, cz = oz + PH / 2;
    flat(ox + 1, oz + 1, PW - 2, PH - 2);
    for (let z = oz + 1; z < oz + PH - 1; z++) for (let x = ox + 1; x < ox + PW - 1; x++) surf[I(x, z)] = G.hash2(x, z, 21) < .22 ? 14 : 0;
    const path = (x, z) => { if (map.inb(x, z) && !water[I(x, z)]) surf[I(x, z)] = 15; };
    for (let x = ox + 3; x < ox + PW - 3; x++) for (const z of [oz + 3, oz + 4, oz + PH - 5, oz + PH - 4]) path(x, z);
    for (let z = oz + 3; z < oz + PH - 3; z++) for (const x of [ox + 3, ox + 4, ox + PW - 5, ox + PW - 4]) path(x, z);
    // l'étang au milieu, un chemin tout autour, et deux allées en croix qui y mènent
    const rx = Math.min(7, PW / 2 - 6), rz = Math.min(5, PH / 2 - 6);
    for (let k = -1; k <= 0; k++) { for (let z = oz + 3; z < oz + PH - 3; z++) if (Math.abs(z + .5 - cz) > rz + 1.5) path(Math.floor(cx) + k, z); for (let x = ox + 3; x < ox + PW - 3; x++) if (Math.abs(x + .5 - cx) > rx + 1.5) path(x, Math.floor(cz) + k); }
    for (let z = oz; z < oz + PH; z++) for (let x = ox; x < ox + PW; x++) { const d = Math.hypot((x + .5 - cx) / rx, (z + .5 - cz) / rz) + (G.noise(x * .3, z * .3, 5) - .5) * .25; const i = I(x, z); if (d < 1) water[i] = 1; else if (d < 1.28) surf[i] = 15; }
    put('kiosque', Math.floor(cx) + 5, oz + 6); put('grande_fontaine', ox + 5, oz + PH - 11); put('statue', Math.floor(cx), oz + 6);
    for (const [x, z] of [[ox + PW - 10, oz + PH - 9], [ox + PW - 7, oz + PH - 9]]) put('balancoire', x, z);
    for (const [x, z] of [[ox + 7, oz + 7], [ox + 10, oz + 9], [ox + 7, oz + 11]]) put('table_pique', x, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2, x = Math.floor(cx + Math.cos(a) * (rx + 3.2)), z = Math.floor(cz + Math.sin(a) * (rz + 3.2)); put('banc_parc', x, z, Math.abs(Math.cos(a)) > .7 ? (Math.cos(a) > 0 ? 3 : 1) : (Math.sin(a) > 0 ? 2 : 0)); }
    for (const [x, z] of [[ox + 3, oz + 3], [ox + PW - 4, oz + 3], [ox + 3, oz + PH - 4], [ox + PW - 4, oz + PH - 4], [Math.floor(cx) - 3, oz + 3], [Math.floor(cx) + 2, oz + PH - 4]]) put('lampadaire', x, z);
    for (let k = 0; k < 40; k++) { const x = ox + 2 + Math.floor(r() * (PW - 4)), z = oz + 2 + Math.floor(r() * (PH - 4)), i = I(x, z); if (surf[i] === 15 || water[i]) continue; put(k % 3 ? G.pick(['cerisier', 'chene', 'bouleau', 'cerisier'], r) : flower(r), x, z); }
    for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, x = Math.floor(cx + Math.cos(a) * (rx + 1.6)), z = Math.floor(cz + Math.sin(a) * (rz + 1.6)); if (!water[I(x, z)]) put(['tulipe_rouge', 'tulipe_jaune', 'iris_bleu', 'lys_blanc', 'rose_rose', 'tulipe_blanche'][k % 6], x, z); }
    meta.parc = { x: cx, z: oz + PH - 3 }; targets.push([Math.floor(cx), oz + PH - 3, 3]); };
  // aérodrome (jusqu'à 2 parcelles de large) : piste en herbe, hangar, tour, manche à air, biplan prêt au départ
  G.STRUCT.aerodrome = c => { const { map, ox, oz, ax, az, layout, put, flat, targets, meta, surf, I, r } = c;
    if (layout[az][ax - 1] === 'aerodrome') return; const w = layout[az][ax + 1] === 'aerodrome' ? 2 : 1, L = w * A;
    flat(ox + 1, oz + 2, L - 2, 13);
    for (let z = oz + 1; z < oz + 15; z++) for (let x = ox + 1; x < ox + L - 1; x++) surf[I(x, z)] = 0;
    for (let x = ox + 1; x < ox + L - 1; x++) for (let z = oz + 6; z <= oz + 9; z++) surf[I(x, z)] = (x - ox) % 4 < 2 && (z === oz + 7 || z === oz + 8) ? 11 : 15; // piste de gravier, axe en tirets
    for (const x0 of [ox + 1, ox + L - 3]) for (let x = x0; x < x0 + 2; x++) for (let z = oz + 6; z <= oz + 9; z++) surf[I(x, z)] = 11; // seuils
    put('hangar', ox + L - 11, oz + 10, 2); put('tour_controle', ox + 4, oz + 11); put('manche_air', ox + 2, oz + 12);
    for (let x = ox + 2; x < ox + L - 2; x += 4) { put('balise', x, oz + 5); put('balise', x, oz + 10, 0, { v: 1 }); }
    for (let x = ox + L - 11; x < ox + L - 5; x++) surf[I(x, oz + 9)] = 15;
    const plane = put('avion', ox + 2, oz + 6, 1); put('tonneau', ox + 8, oz + 11); put('caisse', ox + 9, oz + 11); put('banc', ox + 10, oz + 12, 2);
    G.npcHost(meta, 'pilote', ox + 7.5, oz + 12.2, PI);
    meta.aerodrome = { x: ox + L / 2, z: oz + 8, x0: ox + 1, x1: ox + L - 1, z0: oz + 1, z1: oz + 15, plane: !!plane }; targets.push([ox + 8, oz + 13, 3]); };
  // ferme (jusqu'à 2 parcelles) : rangs de lavande et de tournesols, grange, moulin, bottes de foin, épouvantail
  G.STRUCT.ferme = c => { const { map, ox, oz, ax, az, layout, put, flat, targets, meta, surf, I, r } = c;
    if (layout[az][ax - 1] === 'ferme') return; const w = layout[az][ax + 1] === 'ferme' ? 2 : 1, L = w * A;
    flat(ox + 1, oz + 2, L - 2, 12);
    const fx1 = ox + (w > 1 ? A : 11);
    for (let z = oz + 3; z < oz + 13; z++) for (let x = ox + 2; x < fx1 - 1; x++) { const row = (z - oz) % 2 === 1; surf[I(x, z)] = row ? 7 : 2; if (row) put(z < oz + 8 ? 'lavande_violette' : 'tournesol_jaune', x, z); }
    for (let x = ox + 1; x < fx1; x++) { put('cloture_bois', x, oz + 2, 0, { v: 10 }); put('cloture_bois', x, oz + 13, 0, { v: 10 }); }
    put('epouvantail', ox + 6, oz + 8); put('epouvantail', fx1 - 4, oz + 4);
    const gx = w > 1 ? ox + A + 3 : ox + 11; put('grange', gx, oz + 3); put('moulin', gx + (w > 1 ? 7 : 0), oz + (w > 1 ? 3 : 9)); put('puits', gx + 1, oz + 9);
    for (let k = 0; k < 7; k++) put('botte_foin', gx + (k % 4) * 1 + (k > 3 ? 1 : 0), oz + 11 + Math.floor(k / 4), 0, { v: k % 2 });
    for (let x = gx - 1; x < gx + 6; x++) surf[I(x, oz + 7)] = 2;
    meta.ferme = { x: gx + 2.5, z: oz + 8 }; targets.push([gx + 2, oz + 8, 2]); };
  // port : ponton qui avance dans la mer, jetée en T, barques, caisses et lanternes sur le quai
  G.STRUCT.port = c => { const { map, ox, oz, put, targets, meta, water, surf, I, r } = c;
    let sz = oz + 5; while (sz < oz + A && !water[I(ox + 7, sz)]) sz++;
    for (let z = sz - 3; z < sz; z++) for (let x = ox + 3; x < ox + 13; x++) if (!water[I(x, z)]) surf[I(x, z)] = 15; // quai
    for (let k = 0; k < 9; k++) for (const x of [ox + 7, ox + 8]) put('ponton', x, sz + k);
    for (let x = ox + 3; x < ox + 13; x++) put('ponton', x, sz + 9);
    put('bateau', ox + 9, sz + 3); put('bateau', ox + 5, sz + 5); put('bateau', ox + 9, sz + 7); put('bateau', ox + 4, sz + 10);
    for (const [t, x, z] of [['caisse', ox + 4, sz - 2], ['caisse', ox + 5, sz - 2], ['tonneau', ox + 4, sz - 1], ['lanterne', ox + 6, sz - 1], ['lanterne', ox + 9, sz - 1], ['tonneau', ox + 11, sz - 2], ['caisse', ox + 12, sz - 2]]) put(t, x, z);
    put('maison_deco', ox + 1, sz - 6, 0, { v: 8 });
    meta.port = { x: ox + 8, z: sz - 1 }; targets.push([ox + 8, sz - 2, 3]); };
  // pas de grands arbres au hasard sur la piste ni dans les allées du parc
  G.on('worldgen', map => { const a = map.meta.aerodrome; if (!a) return; for (const o of [...map.list]) if (G.OBJ[o.t].chop >= 3 && o.x >= a.x0 && o.x < a.x1 && o.z >= a.z0 && o.z < a.z1) map.removeObj(o); });

  // ---------- le plan : 11 parcelles de plus à l'est ----------
  const EAST = [
    ['foret', 'montagne', 'plateau', 'foret', 'colline', 'foret', 'riviere_h', 'montagne', 'foret', 'colline', 'montagne'],
    ['plaine', 'aerodrome', 'aerodrome', 'plaine', 'verger', 'plaine', 'cascade', 'foret', 'ferme', 'ferme', 'foret'],
    ['quartier', 'plaine', 'parc', 'parc', 'plaine', 'quartier', 'riviere', 'plaine', 'verger', 'plaine', 'plateau'],
    ['quartier', 'jardin', 'parc', 'parc', 'plaine', 'quartier', 'riviere', 'lac', 'plaine', 'foret', 'colline'],
    ['plaine', 'etang', 'plaine', 'verger', 'plaine', 'plaine', 'riviere', 'plaine', 'colline', 'plaine', 'foret'],
    ['plage', 'plage', 'port', 'plage', 'plage_rochers', 'plage', 'plage', 'plage', 'phare', 'plage', 'plage_rochers']];
  const OLDC = G.DEFAULT_LAYOUT[0].length; // 11
  const widen = L => L.map((row, z) => row.length === OLDC ? row.concat(EAST[Math.min(z, EAST.length - 1)]) : row);
  G.DEFAULT_LAYOUT.splice(0, G.DEFAULT_LAYOUT.length, ...widen(G.DEFAULT_LAYOUT)); G.AC = G.DEFAULT_LAYOUT[0].length;
  // plan au hasard : la moitié est reçoit aussi ses quartiers (sans couper les rivières)
  const orl = G.randomLayout; G.randomLayout = seed => { const L = orl(seed), r = G.rng((seed >>> 0) + 99), land = id => !G.ACRES[id].water && !G.ACRES[id].struct;
    const set = (z, x, id, w = 1, h = 1) => { for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) if (!L[z + dz] || !L[z + dz][x + dx] || !land(L[z + dz][x + dx])) return false; for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) L[z + dz][x + dx] = id; return true; };
    const tryAt = (id, w, h, zs) => { for (let t = 0; t < 40; t++) { const x = OLDC + Math.floor(r() * (G.AC - OLDC - w + 1)), z = zs[Math.floor(r() * zs.length)]; if (set(z, x, id, w, h)) return; } };
    tryAt('aerodrome', 2, 1, [1, 2]); tryAt('parc', 2, 2, [2, 3]); tryAt('ferme', 2, 1, [1, 4]); for (let k = 0; k < 4; k++) tryAt('quartier', 1, 1, [2, 3, 4]);
    for (let t = 0; t < 20; t++) { const x = OLDC + Math.floor(r() * (G.AC - OLDC)); if (G.ACRES[L[G.AR - 1][x]].beach && !G.ACRES[L[G.AR - 1][x]].pier) { L[G.AR - 1][x] = 'port'; break; } }
    return L; };

  // ---------- les anciennes sauvegardes s'agrandissent ----------
  function expand(dw) {
    const oL = dw.meta && dw.meta.layout; if (dw.kind !== 'world' || !oL || oL[0].length !== OLDC || dw.W !== OLDC * A + 2 * B) return dw;
    const seed = dw.meta.seed >>> 0, L = widen(oL), fresh = G.genWorld(L, seed), W0 = dw.W, H = dw.H, SEAM = W0 - B;
    const lvl = G.b64.dec(dw.lvl, Int8Array), surf = G.b64.dec(dw.surf), water = G.b64.dec(dw.water), ramp = G.b64.dec(dw.ramp);
    // une case est reprise de l'ancienne partie sauf si elle faisait partie de l'ancienne bordure de falaises (côté est)
    const border = (x, z) => x + (G.noise(x * .14, z * .14, seed) - .5) * 5 >= W0 - B || x >= W0 - 2;
    const keep = (x, z) => x < SEAM - 9 || (x < SEAM && !border(x, z));
    for (let z = 0; z < H; z++) for (let x = 0; x < W0; x++) if (keep(x, z)) { const i = z * W0 + x, j = z * fresh.W + x; fresh.lvl[j] = lvl[i]; fresh.surf[j] = surf[i]; fresh.water[j] = water[i]; fresh.ramp[j] = ramp[i]; }
    const touches = (t, x0, z0, rot) => { const [w, d] = G.fpDims(G.OBJ[t], rot || 0); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) if (keep(x, z)) return true; return false; };
    const inside = (t, x0, z0, rot) => { const [w, d] = G.fpDims(G.OBJ[t], rot || 0); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) if (!keep(x, z)) return false; return true; };
    for (const o of [...fresh.list]) if (touches(o.t, o.x, o.z, o.r)) fresh.removeObj(o);
    for (const e of dw.objs) { if (!G.OBJ[e.t] || !inside(e.t, e.x, e.z, e.r)) continue; const ex = Object.assign({}, e); delete ex.t; delete ex.x; delete ex.z; delete ex.r; fresh.addObj(e.t, e.x, e.z, e.r || 0, ex); }
    const fm = fresh.meta, meta = Object.assign({}, dw.meta);
    meta.layout = L; meta.seed = seed; meta.homes = (dw.meta.homes || []).concat((fm.homes || []).filter(h => h.x >= SEAM && !(dw.meta.homes || []).some(q => q.vi === h.vi)));
    meta.npcs = (dw.meta.npcs || []).concat((fm.npcs || []).filter(n => n.x >= SEAM)); meta.nvi = fm.nvi;
    for (const k of ['aerodrome', 'parc', 'ferme', 'port', 'quartiers']) if (fm[k]) meta[k] = fm[k];
    fresh.meta = meta; const out = fresh.serialize(); out.grown = 1; return out;
  }
  G.expandWorldSave = expand;
  // la grande carte montre aussi les nouveaux lieux
  G.on('init', () => { const U = G.ui, om = U.openMap; if (!om) return; U.openMap = () => { om(); const m = G.world, M = m.meta, cv = document.getElementById('bigmap'), c = cv && cv.getContext('2d'); if (!c) return; const sc = cv.width / m.W;
    c.save(); c.font = '18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const ic = (e, p) => p && c.fillText(e, p.x * sc, (p.z - 2) * sc);
    ic('🛩️', M.aerodrome); ic('🌳', M.parc); ic('🌻', M.ferme); ic('⛵', M.port); ic('🚉', M.gare); ic('🏛️', M.mairie); if (M.rueGate) ic('🏬', { x: M.rueGate.sx, z: M.rueGate.sz + 1 }); c.restore(); }; });
  G.on('init', () => { const or = G.restore; G.restore = d => { if (d && d.world) { const w = expand(d.world); if (w !== d.world) { d.world = w; d.ville2 = 1; } } const res = or(d); if (d && d.ville2) setTimeout(() => G.ui.toast('🗺️ Le village s\'est agrandi : un nouveau quartier, un grand parc, un aérodrome, une ferme et un port t\'attendent à l\'est !'), 1800); return res; }; });
})();
