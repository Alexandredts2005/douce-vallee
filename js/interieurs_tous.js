'use strict';
// ===== Toutes les maisons se visitent : les maisons du village (chacune son décor et son habitant), la grange, le moulin,
// le hangar de l'aéro-club ; et dans la rue commerçante, chaque immeuble (appartements parisiens et leurs résidents),
// chaque échoppe (épicerie, boulangerie, fleuriste, librairie, fromagerie, poissonnerie, antiquaire, café — avec leur
// marchand), l'église, les Grands Magasins et le marché couvert. Chaque bâtiment a son intérieur à lui : papier peint,
// parquet et mobilier choisis d'après sa place, et toujours les mêmes quand on revient. =====
(function () {
  const O = G.OBJ, K = G.ROOMKINDS, F = G.ROOMFILL, N = G.ROOMNPC;
  const say = (v, l, c) => G.npcSay(v, l, c), PN = () => G.playerName || 'toi', pick = (r, a) => a[Math.floor(r() * a.length)];
  const has = id => !!(G.ITEMS[id] || O[id]);
  // ---------- les bâtiments qui s'ouvrent ----------
  const OPEN = { maison_deco: 'logis', immeuble: 'appart', rue_fond: 'appart', rue_angle: 'appart', rue_echoppe: 'echoppe', grange: 'grange_i', moulin: 'moulin_i', hangar: 'hangar_i', rue_eglise: 'eglise', rue_magasins: 'magasins', halle_rue: 'halle' };
  for (const t in OPEN) if (O[t]) O[t].enter = OPEN[t];
  const VARIANTS = { logis: 8, appart: 6, echoppe: 8 };
  const omk = G.makeInterior; G.makeInterior = (kind, id, opt = {}) => { const n = VARIANTS[kind]; if (n) kind = kind + '_' + (G.hashStr(String(id)) % n); return omk(kind, id, opt); };

  // ---------- les habitants ----------
  const NEIGH = [['Ondine', 'loutre', 0x8a6a4a, 0x5ab0d8], ['Basile', 'blaireau', 0x8a8a8a, 0x6a8a3a], ['Hortense', 'hibou', 0xb08a5a, 0xd86a8a], ['Pacha', 'alpaga', 0xf2e6d2, 0xe8a03a],
    ['Axel', 'axolotl', 0xf6a8c0, 0x3a7ad8], ['Coco', 'caniche', 0xf6f2ea, 0xd84a6a], ['Mimosa', 'mouffette', 0x2a2a2e, 0xf2c83a], ['Lento', 'paresseux', 0x9a7a5a, 0x5ab88a],
    ['Minette', 'chat', 0xe8a060, 0x8a5ad8], ['Rusé', 'renard', 0xe2702a, 0x2a6ad8], ['Lilou', 'chien', 0xd8b07a, 0xe85a5a], ['Gustave', 'singe', 0x8a5a3a, 0xf2e6c8], ['Perle', 'mouton', 0xfaf6ee, 0x9a6ad8], ['Tortilla', 'tortue', 0x8aa05a, 0xe8c83a]];
  const HELLO = ['Oh, {p} ! Quelle bonne surprise, entre donc !', 'Bienvenue chez moi, {p} ! Fais comme chez toi.', 'Tiens, {p} ! Tu tombes bien, je venais de faire du thé.', 'Coucou {p} ! Tu aimes ma déco ? J\'ai tout choisi moi-même.', 'Ah, {p}, essuie bien tes pieds sur le paillasson, hein !'];
  const CHAT = ['Le soir, j\'adore regarder les lampadaires s\'allumer un par un.', 'Tu as vu les canetons sur l\'étang ? Ils suivent leur maman en file indienne !', 'Il paraît qu\'un poisson énorme saute parfois hors de l\'eau…', 'J\'ai planté des tulipes devant chez moi. Viens les voir au printemps !', 'Si tu caresses un chien, il te suit partout. Trop mignon.',
    'On dit qu\'il y a une tour Eiffel quelque part dans la vallée. Tu l\'as déjà vue ?', 'Ce que j\'aime ici ? Le calme… et les croissants de la boulangerie.', 'Approche doucement des lapins, sinon ils filent !', 'La nuit, les hérissons sortent faire leur promenade.', 'Mon rêve : survoler la vallée en deltaplane !'];
  const PNx = s => s.replace(/\{p\}/g, PN());
  NEIGH.forEach(([n, sp, col, shirt], i) => { const role = 'voisin_' + i; G.NPCS[role] = { n, sp, col, shirt, neckwear: shirt, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'rond', pitch: .9 + (i % 5) * .1 };
    G.npcRoles[role] = v => say(v, [PNx(G.pick(HELLO))], ['Bavarder', 'Visiter', 'Au revoir']).then(k => { if (k === 0) return say(v, [G.pick(CHAT)]); if (k === 1) return say(v, ['Regarde partout, je t\'en prie ! Mais ne touche pas à mes ' + G.pick(['plantes', 'livres', 'tableaux', 'coussins']) + ', hein.']); }); });

  // ---------- outils d'aménagement ----------
  const LUSTRES = ['lustre_cristal', 'lustre_tulipes', 'lustre_globe', 'lustre_bougies', 'lustre_lanterne', 'lustre_murano', 'lustre_anneaux'];
  const ARTS = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 'tableau_art_' + i);
  const ok = (P, t, x, z, r = 0, ex) => has(t) && P(t, x, z, r, ex);

  // =====================================================================
  // MAISONS DU VILLAGE (logis_0 … logis_7)
  // =====================================================================
  const LOGIS = [['fleurs_cottage', 'bois_chene', 0xd9a066], ['sauge', 'chevrons', 0x7a9a6a], ['vichy_rose', 'terrazzo_rose', 0xe88aa8], ['lambris', 'parquet_fonce', 0x8a5d38],
    ['toile_bleue', 'dalles_ivoire', 0x5a7ab8], ['feuillage_doux', 'noyer', 0x6a8a4a], ['coquillages', 'carreaux_menthe', 0x5ab0b0], ['nuits_lilas', 'moquette', 0x8a6ad8]];
  LOGIS.forEach(([wall, floor, trim], v) => { const kind = 'logis_' + v; K[kind] = { W: 9, H: 7, floor, wall, trim }; N[kind] = ['voisin_' + (v * 3 % NEIGH.length), 6.5, 5.3];
    F[kind] = (m, P) => { const r = G.rng(901 + v);
      ok(P, pick(r, ['lit_fleuri', 'lit_baldaquin', 'lit_fleuri']), 0, 0); ok(P, 'commode_fleurie', 2, 0); ok(P, pick(r, ['armoire', 'etagere', 'bibliotheque']), 0, 2, 1);
      ok(P, pick(r, ['cheminee', 'cheminee_marbre', 'cheminee']), 4, 0); ok(P, pick(r, ARTS), 3, 0); ok(P, 'plante', 6, 0); ok(P, pick(r, ['bibliotheque', 'piano_droit', 'horloge']), 7, 0);
      ok(P, 'tapis_rond', 3, 2); ok(P, pick(r, ['canape', 'canape_lin', 'canape_chesterfield', 'canape_velours']), 3, 4, 2); ok(P, 'table_basse', 4, 3); ok(P, pick(r, ['fauteuil_nuage', 'fauteuil_louis']), 2, 3, 1);
      ok(P, pick(r, ['table_nappe', 'table_ferme', 'table_noyer', 'table_blanche']), 7, 3); const ch = pick(r, ['chaise_paillee', 'chaise_scandi', 'chaise_bistrot', 'chaise_rotin']); ok(P, ch, 8, 3, 3); ok(P, ch, 7, 2, 0);
      ok(P, 'lampe_arc', 8, 5); ok(P, pick(r, ['plante', 'pot_fleurs', 'aquarium']), 0, 5); ok(P, 'miroir', 1, 5); ok(P, pick(r, LUSTRES), 4, 3); ok(P, pick(r, LUSTRES), 1, 1); }; });

  // =====================================================================
  // APPARTEMENTS PARISIENS (appart_0 … appart_5)
  // =====================================================================
  const APPART = [['creme', 'chevrons', 0xb89a6a], ['toile_bleue', 'chevrons', 0x5a7ab8], ['lambris_ivoire', 'noyer', 0xc8b088], ['bibliotheque', 'parquet_fonce', 0x6a4426], ['briques_creme', 'bois_clair', 0xa8784a], ['damier', 'marbre', 0x8a6a46]];
  APPART.forEach(([wall, floor, trim], v) => { const kind = 'appart_' + v; K[kind] = { W: 10, H: 7, floor, wall, trim }; N[kind] = ['voisin_' + ((v * 5 + 2) % NEIGH.length), 2.5, 4.5];
    F[kind] = (m, P) => { const r = G.rng(931 + v);
      ok(P, pick(r, ['cheminee_marbre', 'cheminee']), 4, 0); ok(P, 'miroir', 4, 1); ok(P, pick(r, ['console_doree', 'bureau_ecritoire', 'piano_droit']), 0, 0); ok(P, pick(r, ['clavecin', 'piano_droit', 'billard']), 7, 0);
      ok(P, 'bibliotheque', 0, 2, 1); ok(P, 'bibliotheque', 0, 3, 1); ok(P, pick(r, ['harpe', 'globe_terrestre', 'buste', 'vase_chine']), 9, 3); ok(P, pick(r, ARTS), 2, 0); ok(P, pick(r, ARTS), 6, 0);
      ok(P, pick(r, ['tapis_savonnerie', 'tapis_rond']), 3, 3); ok(P, pick(r, ['canape_velours', 'canape_chesterfield', 'canape_lin']), 4, 5, 2); ok(P, 'gueridon', 4, 3); ok(P, 'fauteuil_louis', 2, 3, 1); ok(P, 'fauteuil_louis', 6, 3, 3);
      ok(P, pick(r, ['lit_baldaquin', 'lit_fleuri']), 8, 4); ok(P, 'commode_fleurie', 7, 5); ok(P, 'plante', 9, 1); ok(P, pick(r, ['vase_chine', 'statue_antique', 'plante']), 1, 5);
      ok(P, pick(r, ['lustre_cristal', 'lustre_versailles', 'lustre_murano']), 4, 3); ok(P, pick(r, LUSTRES), 8, 2); }; });

  // =====================================================================
  // ÉCHOPPES DE LA RUE (echoppe_0 … echoppe_7) et leurs marchands
  // =====================================================================
  const food = re => () => Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'nourriture' && re.test(id));
  const cat = (c, n) => () => Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === c).slice(0, n);
  const ECH = [
    { n: 'Épicerie Fine', wall: 'carreaux', floor: 'terre_cuite', trim: 0x4fb35f, who: ['Marius', 'blaireau', 0x8a8a8a, 0x4fb35f], hi: 'Bienvenue à l\'épicerie ! Tout est frais du matin.', sells: food(/pomme|poire|orange|peche|cerise|banane|fraise|carotte|tomate|noix|miel|confiture|olive|raisin|citron|patate|pomme_de_terre/),
      fill: P => { ok(P, 'comptoir', 3, 1); for (const [x, z, r] of [[0, 0, 0], [0, 2, 1], [7, 0, 0], [7, 2, 3]]) ok(P, 'rayon', x, z, r); ok(P, 'etal_fruits', 1, 3, 0); ok(P, 'etal_legumes', 5, 3, 0); ok(P, 'tonneau', 0, 4); ok(P, 'caisse', 7, 4); ok(P, 'caisse', 6, 4); } },
    { n: 'Boulangerie du Coin', wall: 'creme', floor: 'damier_noir', trim: 0xd9a066, who: ['Brioche', 'mouton', 0xfaf6ee, 0xd9a066], hi: 'Ça sent bon, hein ? Le pain sort tout juste du four !', sells: food(/pain|croissant|brioche|baguette|gateau|tarte|biscuit|cookie|chouquette|madeleine|eclair|macaron|crepe|pain_au/),
      fill: P => { ok(P, 'comptoir', 3, 1); ok(P, 'etal_pains', 0, 0); ok(P, 'etal_pains', 6, 0); ok(P, 'percolateur', 5, 1); ok(P, 'table_marbre', 1, 3); ok(P, 'chaise_bistrot', 0, 3, 1); ok(P, 'chaise_bistrot', 2, 3, 3); ok(P, 'table_marbre', 6, 3); ok(P, 'chaise_bistrot', 7, 3, 3); ok(P, 'plante', 0, 5); } },
    { n: 'Fleuriste Pétale', wall: 'feuillage_doux', floor: 'terre_cuite', trim: 0xe88aa8, who: ['Capucine', 'alpaga', 0xf2e6d2, 0xe88aa8], hi: 'Bonjour ! Des fleurs pour égayer ta maison ?', sells: cat('fleurs', 40),
      fill: P => { ok(P, 'comptoir', 3, 1); ok(P, 'etal_fleurs', 0, 0); ok(P, 'etal_fleurs', 6, 0); for (let i = 0; i < 8; i++) ok(P, 'pl_' + (i * 2 + 1), i < 4 ? 0 : 7, 1 + (i % 4)); ok(P, 'pot_fleurs', 2, 4); ok(P, 'pot_fleurs', 5, 4); ok(P, 'parasol_dentelle', 3, 4); } },
    { n: 'Librairie des Vallons', wall: 'bibliotheque', floor: 'parquet_fonce', trim: 0x6a4426, who: ['Hibou Savant', 'hibou', 0xb08a5a, 0x3a5a8a], hi: 'Chut… Bienvenue à la librairie. Un bon livre, peut-être ?', sells: () => ['bibliotheque', 'bureau_ecritoire', 'globe_terrestre', 'maquette', 'etagere', 'lampe', 'fauteuil_louis'].filter(has),
      fill: P => { for (let i = 0; i < 4; i++) { ok(P, 'bibliotheque', 1 + i * 2, 0); } ok(P, 'bibliotheque', 0, 2, 1); ok(P, 'bibliotheque', 7, 2, 3); ok(P, 'bureau', 3, 2); ok(P, 'globe_terrestre', 6, 4); ok(P, 'fauteuil_louis', 1, 4, 1); ok(P, 'tapis_rond', 2, 3); ok(P, 'lampe', 0, 5); } },
    { n: 'Fromagerie Tomme', wall: 'lambris_ivoire', floor: 'pierre', trim: 0xe8c83a, who: ['Gruyère', 'mouffette', 0x3a3a3e, 0xe8c83a], hi: 'Bienvenue ! Goûte-moi ce comté de 24 mois…', sells: food(/fromage|lait|beurre|yaourt|creme|oeuf|comte|camembert|brie/),
      fill: P => { ok(P, 'comptoir', 3, 1); ok(P, 'etal_fromages', 0, 0); ok(P, 'etal_fromages', 6, 0); ok(P, 'tonneau', 0, 3); ok(P, 'tonneau', 7, 3); ok(P, 'caisse', 0, 4); ok(P, 'table_ferme', 5, 4); } },
    { n: 'Poissonnerie de la Criée', wall: 'coquillages', floor: 'carreaux_menthe', trim: 0x3a8ad8, who: ['Capitaine Brice', 'loutre', 0x8a6a4a, 0x3a5a8a], hi: 'Arrivage du jour ! Tout frais pêché, moussaillon !', sells: () => Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'poissons'),
      fill: P => { ok(P, 'comptoir', 3, 1); ok(P, 'etal_poissons', 0, 0); ok(P, 'etal_poissons', 6, 0); ok(P, 'aquarium', 0, 3); ok(P, 'aquarium', 6, 3); ok(P, 'caisse', 7, 5); } },
    { n: 'Antiquités du Grenier', wall: 'damier', floor: 'noyer', trim: 0x8a6a46, who: ['Monsieur Pendule', 'paresseux', 0x9a7a5a, 0x8a3a3a], hi: 'Ah… un connaisseur. Chaque objet ici a une histoire…', sells: () => ['vase_chine', 'buste', 'statue_antique', 'horloge', 'harpe', 'armure', 'globe_terrestre', 'gueridon', 'console_doree', 'clavecin', 'coffre', ...ARTS, ...LUSTRES].filter(has),
      fill: P => { ok(P, 'horloge', 0, 0); ok(P, 'armure', 1, 0); ok(P, 'vase_chine', 2, 0); ok(P, 'buste', 5, 0); ok(P, 'statue_antique', 7, 0); ok(P, 'clavecin', 0, 2, 1); ok(P, 'coffre', 7, 2); ok(P, 'globe_terrestre', 7, 4); ok(P, 'gueridon', 4, 3); ok(P, 'harpe', 0, 4); ok(P, ARTS[2], 3, 0); ok(P, 'comptoir', 4, 1); ok(P, 'lustre_bougies', 4, 3); } },
    { n: 'Café des Amis', wall: 'briques_creme', floor: 'damier_noir', trim: 0x3a5a3a, who: ['Pistou', 'chat', 0xe8a060, 0x3a5a3a], hi: 'Salut {p} ! Un petit noir, comme d\'hab ?', sells: food(/cafe|the|chocolat|jus|limonade|croissant|gateau|tarte|biscuit|sirop/),
      fill: P => { ok(P, 'comptoir', 3, 1); ok(P, 'percolateur', 5, 1); for (const [x, z] of [[1, 3], [6, 3]]) { ok(P, 'table_marbre', x, z); ok(P, 'chaise_bistrot', x - 1, z, 1); ok(P, 'chaise_bistrot', x + 1, z, 3); } ok(P, 'piano_droit', 0, 0); ok(P, 'plante', 7, 0); ok(P, 'lustre_globe', 3, 3); } } ];
  ECH.forEach((E, v) => { const kind = 'echoppe_' + v, role = 'marchand_' + v; K[kind] = { W: 8, H: 6, floor: E.floor, wall: E.wall, trim: E.trim }; N[kind] = [role, 4.5, .6];
    F[kind] = (m, P) => E.fill(P);
    const [n, sp, col, shirt] = E.who; G.NPCS[role] = { n, sp, col, shirt, neckwear: shirt, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'rond', pitch: 1 };
    G.npcRoles[role] = v2 => say(v2, [PNx(E.hi)], ['Acheter', 'Bavarder', 'Au revoir']).then(k => { if (k === 0) { const L = E.sells().filter(id => G.ITEMS[id]); if (!L.length) return say(v2, ['Oh… je suis en rupture de stock. Repasse demain !']); return G.ui.openShop(v2, { list: L.slice(0, 48), title: E.n, quote: '« ' + E.hi.replace(/\{p\}/g, PN()) + ' »', noSell: true }); } if (k === 1) return say(v2, [G.pick(CHAT)]); }); });

  // =====================================================================
  // GRANDS BÂTIMENTS
  // =====================================================================
  // ----- l'église -----
  K.eglise = { W: 12, H: 15, floor: 'dalles_ivoire', wall: 'briques_creme', trim: 0x8a6a46 };
  F.eglise = (m, P) => { ok(P, 'autel', 5, 1); ok(P, 'statue', 2, 0); ok(P, 'statue', 9, 0); ok(P, 'torchere', 4, 1); ok(P, 'torchere', 7, 1); ok(P, 'piano_droit', 0, 3, 1); ok(P, 'vase_chine', 3, 1); ok(P, 'vase_chine', 8, 1);
    for (let z = 4; z <= 12; z += 2) { ok(P, 'banc', 2, z, 2); ok(P, 'banc', 8, z, 2); } ok(P, 'tapis_savonnerie', 5, 6); for (const [x, z] of [[3, 3], [8, 3], [3, 8], [8, 8], [5, 11]]) ok(P, 'lustre_bougies', x, z); ok(P, 'plante', 0, 13); ok(P, 'plante', 11, 13); };
  N.eglise = ['cure', 5.5, 2.6]; G.NPCS.cure = { n: 'Frère Tilleul', sp: 'hibou', col: 0x9a7a5a, shirt: 0x2a2a2e, neckwear: 0xf6f2ea, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'doux', pitch: .8 };
  G.npcRoles.cure = v => say(v, ['Paix et douceur, ' + PN() + '. L\'église est ouverte à tous, à toute heure.'], ['Écouter les cloches', 'Au revoir']).then(k => { if (k === 0) { [0, 400, 800, 1200].forEach((t, i) => setTimeout(() => G.sfx && G.sfx(i % 2 ? 'door' : 'craft', .7), t)); return say(v, ['Ding… dong… Ces cloches sonnent depuis plus de cent ans !']); } });
  // ----- les Grands Magasins -----
  K.magasins = { W: 14, H: 10, floor: 'marbre', wall: 'creme', trim: 0xd9b84a };
  F.magasins = (m, P) => { for (let i = 0; i < 4; i++) ok(P, 'mannequin', 1 + i * 3, 0, 0, { v: i }); ok(P, 'comptoir', 6, 2); ok(P, 'rayon_chaussures', 0, 3, 1); ok(P, 'rayon_chaussures', 12, 3, 3);
    for (const [x, z] of [[2, 5], [5, 5], [8, 5], [11, 5]]) ok(P, 'vitrine', x, z); ok(P, 'miroir', 13, 1); ok(P, 'banc_coussins', 6, 7); for (const [x, z] of [[3, 3], [10, 3], [6, 6]]) ok(P, 'lustre_cristal', x, z); ok(P, 'plante', 0, 8); ok(P, 'plante', 13, 8); ok(P, 'rayon', 0, 1); ok(P, 'rayon', 13, 6); };
  N.magasins = ['vendeuse', 7, 1.4]; G.NPCS.vendeuse = { n: 'Mademoiselle Chic', sp: 'caniche', col: 0xf6f2ea, shirt: 0x2a2a2e, neckwear: 0xd84a6a, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'anime', pitch: 1.3 };
  G.npcRoles.vendeuse = v => say(v, ['Bienvenue aux Grands Magasins, ' + PN() + ' ! Tout le chic de la vallée sous un même toit.'], ['Changer de tenue', 'Meubles chics', 'Au revoir']).then(k => {
    if (k === 0) return G.ui.openWardrobe && setTimeout(() => G.ui.openWardrobe({ sections: ['haut', 'bas', 'chapeau', 'acc'], title: 'Grands Magasins', okLabel: 'Valider', onDone: look => { G.player.setLook(look); G.sfx('fanfare'); G.ui.toast('Très chic ! ✨'); } }), 60);
    if (k === 1) return G.ui.openShop(v, { list: ['canape_velours', 'canape_chesterfield', 'fauteuil_louis', 'lit_baldaquin', 'console_doree', 'gueridon', 'miroir', 'tapis_savonnerie', ...LUSTRES].filter(has), title: 'Grands Magasins — maison', quote: '« Le luxe, c\'est le confort. »', noSell: true }); });
  // ----- le marché couvert -----
  K.halle = { W: 16, H: 8, floor: 'pierre', wall: 'briques', trim: 0x3f7a58 };
  F.halle = (m, P) => { const E = ['etal_fruits', 'etal_legumes', 'etal_fleurs', 'etal_fromages', 'etal_poissons', 'etal_pains']; for (let i = 0; i < 5; i++) { ok(P, E[i % 6], 1 + i * 3, 1); ok(P, E[(i + 3) % 6], 1 + i * 3, 4, 2); }
    for (let i = 0; i < 4; i++) { ok(P, i % 2 ? 'caisse' : 'tonneau', 3 + i * 3, 2); } for (const x of [3, 8, 13]) ok(P, 'lustre_industriel', x, 3); ok(P, 'lanterne', 0, 6); ok(P, 'lanterne', 15, 6); };
  N.halle = ['marchande_halle', 7.5, 2.8]; G.NPCS.marchande_halle = { n: 'Mamie Radis', sp: 'tortue', col: 0x8aa05a, shirt: 0xd86a3a, neckwear: 0xf2c83a, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'doux', pitch: .85 };
  G.npcRoles.marchande_halle = v => say(v, ['Approchez, approchez ! Les plus beaux produits du marché, mon petit ' + PN() + ' !'], ['Acheter', 'Au revoir']).then(k => { if (k === 0) { const L = Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'nourriture').slice(0, 48); return G.ui.openShop(v, { list: L, title: 'Marché couvert', quote: '« Du producteur à ton panier ! »', noSell: true }); } });
  // ----- la grange, le moulin, le hangar -----
  K.grange_i = { W: 12, H: 9, floor: 'parquet_fonce', wall: 'lambris', trim: 0x8a5d38 };
  F.grange_i = (m, P) => { for (const [x, z] of [[0, 0], [1, 0], [0, 1], [10, 0], [11, 0], [11, 1], [11, 2], [0, 6], [1, 7], [0, 7]]) ok(P, 'botte_foin', x, z); ok(P, 'etabli', 4, 0); ok(P, 'tonneau', 3, 0); ok(P, 'tonneau', 7, 0); ok(P, 'caisse', 8, 0);
    ok(P, 'epouvantail', 11, 4); ok(P, 'table_ferme', 5, 4); ok(P, 'chaise_paillee', 4, 4, 1); ok(P, 'chaise_paillee', 6, 4, 3); ok(P, 'lanterne', 2, 4); ok(P, 'lanterne', 9, 4); ok(P, 'lustre_lanterne', 5, 3); };
  K.moulin_i = { W: 7, H: 7, floor: 'parquet_fonce', wall: 'lambris', trim: 0x8a5d38 };
  F.moulin_i = (m, P) => { for (const [x, z] of [[0, 0], [1, 0], [0, 1], [6, 0], [6, 1]]) ok(P, 'caisse', x, z); ok(P, 'tonneau', 5, 0); ok(P, 'etabli', 2, 0); ok(P, 'table_ferme', 3, 3); ok(P, 'chaise_paillee', 2, 3, 1); ok(P, 'lanterne', 6, 4); ok(P, 'botte_foin', 0, 4); ok(P, 'horloge', 0, 3, 1); };
  N.moulin_i = ['meunier', 4.5, 1.6]; G.NPCS.meunier = { n: 'Maître Farine', sp: 'blaireau', col: 0xe8e2d6, shirt: 0x8a6a46, neckwear: 0xf6f2ea, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'rond', pitch: .8 };
  G.npcRoles.meunier = v => say(v, ['Le vent est bon aujourd\'hui, ' + PN() + ' ! Les ailes tournent, la meule écrase le blé…'], ['Acheter de la farine et du pain', 'Au revoir']).then(k => { if (k === 0) { const L = Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'nourriture' && /pain|farine|ble|brioche|crepe|gateau|biscuit/.test(id)); return G.ui.openShop(v, { list: L.length ? L : Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'nourriture').slice(0, 12), title: 'Le moulin', quote: '« Pas de bon pain sans bonne farine. »', noSell: true }); } });
  K.hangar_i = { W: 13, H: 10, floor: 'pierre', wall: 'briques', trim: 0x3a5a8a };
  F.hangar_i = (m, P) => { ok(P, 'maquette', 6, 3); ok(P, 'etabli', 0, 0); ok(P, 'etabli', 10, 0); ok(P, 'caisse', 3, 0); ok(P, 'caisse', 4, 0); ok(P, 'tonneau', 8, 0); ok(P, 'casiers', 12, 3, 3); ok(P, 'bureau', 1, 6); ok(P, 'chaise_club', 1, 7, 2);
    ok(P, 'globe_terrestre', 11, 7); ok(P, 'horloge', 0, 3, 1); ok(P, 'manche_air', 12, 8); for (const x of [3, 9]) ok(P, 'lustre_industriel', x, 4); ok(P, 'tableau', 5, 0); };
  N.hangar_i = ['mecano', 7.5, 2]; G.NPCS.mecano = { n: 'Hélice', sp: 'renard', col: 0xe2702a, shirt: 0x3a5a8a, neckwear: 0xd84a4a, accent: 0xfaf6ee, eyeCol: 0x3a2a22, eyes: 'anime', pitch: 1.1 };
  G.npcRoles.mecano = v => say(v, ['Salut ' + PN() + ' ! Ici on bichonne les avions de l\'aéro-club. Tu voles, toi ?'], ['Le deltaplane', 'Au revoir']).then(k => { if (k === 0) return say(v, ['Le deltaplane, c\'est le vol le plus pur ! Lance-toi depuis une falaise, et cherche les ascendances : là où tournent les petites étincelles dorées, l\'air monte !', 'Tu en trouveras dans ton garage de poche (W) ou au magasin.']); });

  // les intérieurs déjà créés gardent leur décor ; si une ancienne partie n'avait pas de type pour ces bâtiments, rien ne change
  // le nom de l'échoppe s'affiche (au lieu de « Boutique de la rue »)
  G.on('init', () => { const oe = G.act.enterHouse; G.act.enterHouse = o => { const r = oe(o), im = o && o.iid && G.interiors[o.iid], k = im && im.meta.shell && im.meta.shell.kind; if (k && /^echoppe_d+$/.test(k)) im.meta.title = ECH[+k.split('_')[1]].n; return r; }; });
})();
