'use strict';
// ===== Données : sols, objets du monde, objets d'inventaire, recettes, boutique, acres, habitants =====
G.SURF = [
  { n: 'Herbe', cell: 0 }, { n: 'Herbe de forêt', cell: 1 }, { n: 'Chemin de terre', cell: 2, path: 1 }, { n: 'Chemin de pierre', cell: 3, path: 1 },
  { n: 'Route pavée', cell: 4, path: 1 }, { n: 'Sable', cell: 5 }, { n: 'Parquet', cell: 6, path: 1 }, { n: 'Terre labourée', cell: 7 },
  { n: 'Neige', cell: 8 }, { n: 'Briques', cell: 9, path: 1 }, { n: 'Lit de rivière', cell: 10 }, { n: 'Dalles blanches', cell: 11, path: 1 },
  { n: 'Carrelage', cell: 12, path: 1 }, { n: 'Tapis', cell: 13, path: 1 }, { n: 'Herbe fleurie', cell: 14 }, { n: 'Gravier', cell: 15, path: 1 }
];

// ---------- Objets posés dans le monde ----------
// h : hauteur de collision (0 = traversable), walk : on peut marcher dessus, fp : [largeur, profondeur]
const O = G.OBJ = {};
function obj(id, n, model, p = {}) { O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p); }
// arbres & nature
obj('chene', 'Chêne', 'tree_oak', { h: 5, chop: 3, shake: 'coins', grow: 1, shadow: 1.1 });
obj('pommier', 'Pommier', 'tree_fruit', { v: 0, h: 5, chop: 3, fruit: 'pomme', grow: 1, shadow: 1.1 });
obj('oranger', 'Oranger', 'tree_fruit', { v: 1, h: 5, chop: 3, fruit: 'orange', grow: 1, shadow: 1.1 });
obj('pecher', 'Pêcher', 'tree_fruit', { v: 2, h: 5, chop: 3, fruit: 'peche', grow: 1, shadow: 1.1 });
obj('cerisier', 'Cerisier en fleurs', 'tree_cherry', { h: 5, chop: 3, fruit: 'cerise', grow: 1, shadow: 1.1 });
obj('sapin', 'Sapin', 'tree_pine', { h: 6, chop: 4, shake: 'coins', shadow: 1 });
obj('sapin_neige', 'Sapin enneigé', 'tree_pine', { v: 1, h: 6, chop: 4, shadow: 1 });
obj('palmier', 'Palmier', 'tree_palm', { h: 5, chop: 3, fruit: 'coco', shadow: .9 });
obj('bouleau', 'Bouleau', 'tree_birch', { h: 5, chop: 3, shake: 'coins', shadow: 1 });
obj('buisson', 'Buisson', 'bush', { h: .9, chop: 1, drop: 'herbe' });
obj('buisson_baies', 'Buisson à baies', 'bush', { v: 1, h: .9, chop: 1, pickFruit: 'baies', drop: 'herbe' });
obj('hortensia', 'Hortensia', 'bush', { v: 2, h: .9, chop: 1, drop: 'herbe' });
obj('souche', 'Souche', 'stump', { h: .38, walk: 1, sit: 1, dig: 'bois' });
obj('pousse', 'Jeune arbre', 'sapling', { grow: 1, dig: 'pousse', water: 1 });
obj('rocher', 'Rocher', 'rock', { h: .8, walk: 1, mine: 4 });
obj('gros_rocher', 'Gros rocher', 'rock_big', { fp: [2, 2], h: 1.7, walk: 1, mine: 8 });
obj('mauvaise_herbe', 'Mauvaise herbe', 'weed', { pick: 'herbe' });
obj('champignon', 'Champignon', 'mushroom', { pick: 'champignon' });
obj('coquillage', 'Coquillage', 'shell', { pick: 'coquillage' });
obj('fissure', 'Fissure brillante', 'crack', { dig: 'fossile' });
obj('trou', 'Trou', 'hole', { fill: 1 });
obj('cadeau', 'Cadeau', 'present', { pick: 'cadeau' });
obj('sac_pieces', 'Sac de clochettes', 'moneybag', { pick: 'sac_pieces' });
obj('gelee_sol', 'Gelée', 'goo', { pick: 'gelee' });
const FLOW = [['rouge', 0xe8434a], ['jaune', 0xffd23f], ['blanche', 0xfaf7f0], ['rose', 0xff8fc0], ['bleue', 0x6c8cff], ['violette', 0xa46be0], ['orange', 0xff9a3c]];
FLOW.forEach(([c], i) => {
  obj('tulipe_' + c, 'Tulipe ' + c, 'tulip', { v: i, pick: 'tulipe_' + c, water: 1 });
  obj('fleur_' + c, 'Pensée ' + c, 'flower', { v: i, pick: 'fleur_' + c, water: 1 });
});
G.FLOWCOL = FLOW.map(f => f[1]);
['pomme', 'orange', 'peche', 'cerise', 'coco'].forEach((f, i) => obj('fruit_' + f, 'Fruit', 'fruit', { v: i, pick: f }));
// mobilier extérieur
const F = (id, n, model, p) => obj(id, n, model, Object.assign({ take: 1, cat: 'mobilier' }, p));
F('banc', 'Banc en bois', 'bench', { h: .5, walk: 1, sit: 1, fp: [2, 1] });
F('banc_parc', 'Banc de parc', 'bench', { v: 1, h: .5, walk: 1, sit: 1, fp: [2, 1] });
F('chaise', 'Chaise', 'chair', { h: .5, walk: 1, sit: 1 });
F('table', 'Table en bois', 'table', { h: .78, walk: 1 });
F('table_pique', 'Table de pique-nique', 'picnic', { h: .75, walk: 1, fp: [2, 1] });
F('lampadaire', 'Lampadaire', 'lamp_post', { h: 2.6, light: 1 });
F('lanterne', 'Lanterne', 'lantern', { h: .65, light: 1 });
F('lanterne_pierre', 'Lanterne de pierre', 'stone_lantern', { h: 1.2, light: 1 });
F('torche', 'Torche', 'torch', { h: 1.1, light: 1, fire: 1 });
F('feu_camp', 'Feu de camp', 'campfire', { h: .3, light: 1, fire: 1, cook: 1 });
F('cloture_bois', 'Clôture en bois', 'fence', { v: 0, h: .9 });
F('cloture_blanche', 'Clôture blanche', 'fence', { v: 1, h: .9 });
F('haie', 'Haie taillée', 'hedge', { h: 1.05 });
F('tonneau', 'Tonneau', 'barrel', { h: .95, walk: 1 });
F('caisse', 'Caisse', 'crate', { h: .8, walk: 1 });
F('boite_lettres', 'Boîte aux lettres', 'mailbox', { h: 1.2, mail: 1 });
F('panneau', 'Panneau', 'sign', { h: 1.2, read: 1 });
F('tableau', "Tableau d'affichage", 'board', { h: 1.7, read: 1, fp: [2, 1] });
F('fontaine', 'Fontaine', 'fountain', { h: 1.1, fp: [2, 2], fountain: 1 });
F('puits', 'Puits', 'well', { h: 1.5 });
F('statue', 'Statue', 'statue', { h: 2.2 });
F('pot_fleurs', 'Pot de fleurs', 'flowerpot', { h: .6 });
F('parasol', 'Parasol de plage', 'parasol', { h: 2.2 });
F('transat', 'Transat', 'deckchair', { h: .4, sit: 1 });
F('etabli', 'Établi', 'workbench', { h: .9, craft: 1, fp: [2, 1] });
F('epouvantail', 'Épouvantail', 'scarecrow', { h: 1.6 });
F('bonhomme_neige', 'Bonhomme de neige', 'snowman', { h: 1.4 });
F('balancoire', 'Balançoire', 'swing', { h: 2, fp: [2, 1] });
F('moulin', 'Moulin', 'windmill', { h: 5, fp: [3, 3] });
F('phare', 'Phare', 'lighthouse', { h: 6, fp: [2, 2], light: 1 });
F('pont', 'Pont en bois', 'bridge', { h: .12, walk: 1, onWater: 1 });
F('ponton', 'Ponton', 'pier', { h: .12, walk: 1, onWater: 1 });
F('planches', 'Terrasse en planches', 'planks', { h: .1, walk: 1 });
F('lit', 'Lit douillet', 'bed', { h: .55, sleep: 1, fp: [1, 2] });
F('sac_couchage', 'Sac de couchage', 'sleepbag', { h: .1, walk: 1, sleep: 1, fp: [1, 2] });
F('tapis', 'Tapis rond', 'rug', { h: .02, walk: 1, fp: [2, 2] });
F('etagere', 'Étagère', 'shelf', { h: 1.8 });
F('armoire', 'Armoire', 'wardrobe', { h: 2 });
F('canape', 'Canapé', 'sofa', { h: .55, sit: 1, fp: [2, 1] });
F('lampe', 'Lampe de chevet', 'lamp_table', { h: .9, light: 1 });
F('plante', 'Plante verte', 'plant_pot', { h: 1 });
F('paillasson', 'Paillasson', 'doormat', { h: .02, walk: 1, exit: 1, take: 0 });
F('cheminee', 'Cheminée', 'fireplace', { h: 1.8, fp: [2, 1], light: 1, fire: 1 });
F('tv', 'Télévision', 'tv', { h: 1 });
// constructions (on peut entrer)
const B = (id, n, model, p) => obj(id, n, model, Object.assign({ take: 1, cat: 'construction' }, p));
B('tente', 'Tente', 'tent', { h: 1.9, fp: [2, 2], enter: 'tente' });
B('cabane', 'Cabane en rondins', 'cabin', { h: 3, fp: [3, 3], enter: 'cabane' });
B('maison', 'Maison', 'house', { v: 0, h: 3.4, fp: [3, 3], enter: 'maison' });
B('maison_bleue', 'Maison bleue', 'house', { v: 1, h: 3.4, fp: [3, 3], enter: 'maison' });
B('maison_rose', 'Maison rose', 'house', { v: 2, h: 3.4, fp: [3, 3], enter: 'maison' });
B('maison_verte', 'Maison verte', 'house', { v: 3, h: 3.4, fp: [3, 3], enter: 'maison' });
B('villa', 'Grande maison', 'villa', { h: 4, fp: [4, 3], enter: 'villa' });
B('maison_hab', "Maison d'habitant", 'house', { v: 4, h: 3.4, fp: [3, 3], enter: 'habitant', take: 0 });
B('boutique', 'Boutique', 'shop', { h: 3.6, fp: [4, 3], shop: 1, take: 0 });

// ---------- Objets d'inventaire ----------
const IT = G.ITEMS = {};
function item(id, n, p) { IT[id] = Object.assign({ id, n, stack: 99, sell: 0 }, p); }
// outils
const T = (id, n, tool, ico, sell, p) => item(id, n, Object.assign({ kind: 'tool', tool, ico, stack: 1, sell, cat: 'outils', thumb: 'tool:' + tool }, p));
T('hache', 'Hache', 'axe', '🪓', 200, { desc: 'Coupe les arbres (3 coups) et les buissons.' });
T('pioche', 'Pioche', 'pick', '⛏️', 200, { desc: 'Casse les rochers : pierre, fer, or.' });
T('pelle', 'Pelle', 'shovel', '🥄', 200, { desc: 'Creuse des trous, déterre souches, fossiles et pousses.' });
T('filet', 'Filet', 'net', '🥅', 200, { desc: 'Attrape papillons, coccinelles, libellules et lucioles.' });
T('canne', 'Canne à pêche', 'rod', '🎣', 200, { desc: "Lance devant l'eau, puis appuie quand le flotteur plonge !" });
T('arrosoir', 'Arrosoir', 'can', '🚿', 200, { desc: 'Arrose fleurs et pousses : elles poussent plus vite.' });
T('epee', 'Épée', 'sword', '🗡️', 300, { desc: 'Taille les buissons et les mauvaises herbes d\'un coup.' });
T('lance_pierre', 'Lance-pierre', 'sling', '🏹', 300, { desc: 'Tire sur les ballons-cadeaux qui passent dans le ciel.' });
// ressources
const R = (id, n, ico, sell, p) => item(id, n, Object.assign({ kind: 'res', ico, sell, cat: 'ressources' }, p));
R('bois', 'Bois', '🪵', 20); R('pierre', 'Pierre', '🪨', 15); R('fer', 'Pépite de fer', '🔩', 60); R('or', "Pépite d'or", '🥇', 600);
R('herbe', 'Herbes', '🌾', 5); R('gelee', 'Gelée de slime', '🟢', 80); R('coquillage', 'Coquillage', '🐚', 60); R('fossile', 'Fossile', '🦴', 800);
item('cadeau', 'Cadeau', { kind: 'misc', ico: '🎁', sell: 0 });
item('sac_pieces', 'Sac de clochettes', { kind: 'misc', ico: '💰', sell: 0 });
// nourriture
const FD = (id, n, ico, food, sell, p) => item(id, n, Object.assign({ kind: 'food', ico, food, sell, cat: 'nourriture' }, p));
FD('pomme', 'Pomme', '🍎', 2, 100); FD('orange', 'Orange', '🍊', 2, 100); FD('peche', 'Pêche', '🍑', 2, 100); FD('cerise', 'Cerises', '🍒', 1, 100);
FD('coco', 'Noix de coco', '🥥', 3, 250); FD('baies', 'Baies', '🍇', 1, 40); FD('champignon', 'Champignon', '🍄', 1, 120);
FD('poisson_grille', 'Poisson grillé', '🍢', 5, 300); FD('tarte', 'Tarte aux pommes', '🥧', 7, 600); FD('soupe', 'Soupe aux champignons', '🍲', 6, 500);
// insectes & poissons
const BUG = (id, n, ico, sell, p) => item(id, n, Object.assign({ kind: 'bug', ico, sell, cat: 'insectes' }, p));
BUG('papillon', 'Papillon blanc', '🦋', 160); BUG('papillon_bleu', 'Morpho bleu', '🦋', 1200); BUG('coccinelle', 'Coccinelle', '🐞', 200);
BUG('libellule', 'Libellule', '🪰', 300); BUG('luciole', 'Luciole', '✨', 400); BUG('scarabee', 'Scarabée', '🪲', 900);
const FI = (id, n, ico, sell, food, p) => item(id, n, Object.assign({ kind: 'fish', ico, sell, food, cat: 'poissons' }, p));
FI('carpe', 'Carpe', '🐟', 300, 2); FI('truite', 'Truite', '🐟', 500, 2); FI('poisson_chat', 'Poisson-chat', '🐡', 800, 2); FI('saumon', 'Saumon', '🍣', 1500, 3);
FI('carassin', 'Carassin', '🐠', 160, 1); FI('poisson_rouge', 'Poisson rouge', '🐠', 1300, 1); FI('grenouille', 'Grenouille', '🐸', 400, 1);
FI('sardine', 'Sardine', '🐟', 200, 2); FI('bar', 'Bar', '🐟', 400, 2); FI('daurade', 'Daurade', '🐠', 1000, 3); FI('calamar', 'Calamar', '🦑', 500, 2); FI('requin', 'Requin', '🦈', 8000, 4);
G.FISH = {
  river: [['carpe', 30], ['truite', 25], ['poisson_chat', 12], ['saumon', 5], ['grenouille', 10]],
  pond: [['carassin', 35], ['poisson_rouge', 8], ['grenouille', 20], ['carpe', 15]],
  sea: [['sardine', 30], ['bar', 25], ['daurade', 10], ['calamar', 12], ['requin', 2]]
};
// objets plaçables : un objet d'inventaire par objet du monde
for (const id in O) {
  const o = O[id]; if (IT[id]) continue;
  if (['trou', 'fissure', 'cadeau', 'sac_pieces', 'gelee_sol', 'coquillage', 'champignon', 'mauvaise_herbe', 'paillasson', 'maison_hab', 'boutique'].includes(id) || id.startsWith('fruit_')) continue;
  let cat = o.cat || 'nature';
  item(id, o.n, { kind: 'place', obj: id, cat, thumb: 'obj:' + id, sell: o.chop || o.mine ? 0 : 150, stack: o.fp[0] * o.fp[1] > 2 ? 1 : 99 });
}
['tulipe', 'fleur'].forEach(k => FLOW.forEach(([c]) => { IT[k + '_' + c].sell = 80; IT[k + '_' + c].cat = 'fleurs'; }));
IT.pousse.sell = 100; IT.pousse.n = 'Pousse d\'arbre'; IT.pousse.desc = 'Plante-la : elle deviendra un chêne.';
// sols et terrain (créatif + quelques-uns en survie)
const SU = (id, n, surf, ico) => item(id, n, { kind: 'surf', surf, ico, cat: 'sols', thumb: 'surf:' + surf, sell: 10, desc: 'Peint le sol devant toi.' });
SU('sol_herbe', 'Herbe', 0, '🟩'); SU('sol_foret', 'Herbe de forêt', 1); SU('sol_fleuri', 'Herbe fleurie', 14); SU('sol_terre', 'Chemin de terre', 2); SU('sol_pierre', 'Chemin de pierre', 3);
SU('sol_paves', 'Route pavée', 4); SU('sol_sable', 'Sable', 5); SU('sol_parquet', 'Parquet', 6); SU('sol_labour', 'Terre labourée', 7);
SU('sol_neige', 'Neige', 8); SU('sol_briques', 'Briques', 9); SU('sol_dalles', 'Dalles blanches', 11); SU('sol_carrelage', 'Carrelage', 12); SU('sol_tapis', 'Tapis rouge', 13); SU('sol_gravier', 'Gravier', 15);
const TE = (id, n, terra, ico, desc) => item(id, n, { kind: 'terra', terra, ico, cat: 'terrain', desc, stack: 1 });
TE('t_monter', 'Élever le terrain', 'up', '⛰️', "Monte la case devant toi d'un niveau (falaise).");
TE('t_baisser', 'Abaisser le terrain', 'down', '🕳️', "Descend la case devant toi d'un niveau.");
TE('t_eau', "Creuser de l'eau", 'water', '💧', 'Crée une rivière ou un étang.');
TE('t_combler', "Combler l'eau", 'fill', '🧱', "Remplit l'eau avec de la terre.");
TE('t_pente', 'Pente', 'ramp', '📐', 'Crée une pente qui monte dans la direction où tu regardes.');
TE('t_cascade', 'Cascade', 'cascade', '🌊', "Élève la case en eau : une cascade se forme vers l'eau plus basse.");
TE('t_lisser', 'Aplanir', 'flat', '🟫', 'Retire une pente et remet le sol à plat.');

// ---------- Catalogue créatif (façon catalogue du village) ----------
G.CATS = [
  { id: 'nature', n: '🌳 Nature' }, { id: 'fleurs', n: '🌷 Fleurs' }, { id: 'mobilier', n: '🪑 Mobilier' }, { id: 'construction', n: '🏠 Bâtiments' },
  { id: 'sols', n: '🛤️ Sols & chemins' }, { id: 'terrain', n: '⛰️ Terrain' }, { id: 'outils', n: '🪓 Outils' }, { id: 'nourriture', n: '🍎 Nourriture' }
];

// ---------- Fabrication (survie) ----------
G.RECIPES = [
  { id: 'pioche', need: { bois: 4, pierre: 3 } }, { id: 'arrosoir', need: { fer: 2, pierre: 2 } }, { id: 'lance_pierre', need: { bois: 5, herbe: 3 } },
  { id: 'epee', need: { bois: 2, fer: 3 } }, { id: 'hache', need: { bois: 3, pierre: 2 } }, { id: 'filet', need: { bois: 3, herbe: 5 } },
  { id: 'canne', need: { bois: 4, herbe: 3 } }, { id: 'pelle', need: { bois: 3, fer: 1 } },
  { id: 'poisson_grille', need: { carpe: 1, bois: 1 }, alt: ['truite', 'sardine', 'bar', 'carassin'] }, { id: 'tarte', need: { pomme: 3, baies: 2 } }, { id: 'soupe', need: { champignon: 3 } },
  { id: 'feu_camp', need: { bois: 4, pierre: 3 } }, { id: 'torche', need: { bois: 2, herbe: 2 } }, { id: 'lanterne', need: { fer: 2, bois: 1 } },
  { id: 'lampadaire', need: { fer: 4, pierre: 2 } }, { id: 'banc', need: { bois: 6 } }, { id: 'chaise', need: { bois: 4 } }, { id: 'table', need: { bois: 7 } },
  { id: 'cloture_bois', need: { bois: 2 }, n: 4 }, { id: 'caisse', need: { bois: 5 } }, { id: 'tonneau', need: { bois: 6 } }, { id: 'planches', need: { bois: 2 }, n: 4 },
  { id: 'pont', need: { bois: 4 }, n: 2 }, { id: 'sol_pierre', need: { pierre: 1 }, n: 4 }, { id: 'sol_paves', need: { pierre: 2 }, n: 4 }, { id: 'sol_terre', need: { herbe: 1 }, n: 4 },
  { id: 'etabli', need: { bois: 10, pierre: 4 } }, { id: 'boite_lettres', need: { bois: 3, fer: 1 } }, { id: 'pot_fleurs', need: { pierre: 3 } },
  { id: 'lit', need: { bois: 10, herbe: 6 } }, { id: 'tente', need: { bois: 8, herbe: 10 } }, { id: 'cabane', need: { bois: 40, pierre: 15 } },
  { id: 'maison', need: { bois: 60, pierre: 40, fer: 10 } }, { id: 'statue', need: { pierre: 20, or: 1 } }
];
G.SHOPLIST = ['pousse', 'pommier', 'cerisier', 'tulipe_rouge', 'tulipe_jaune', 'fleur_bleue', 'fleur_rose', 'banc', 'lampadaire', 'lanterne', 'parasol', 'transat', 'cloture_blanche',
  'pot_fleurs', 'fontaine', 'tapis', 'canape', 'lampe', 'plante', 'tv', 'pioche', 'arrosoir', 'lance_pierre', 'epee', 'sol_dalles', 'sol_briques'];
G.buyPrice = id => { const i = IT[id]; return i.buy || Math.max(100, Math.round((i.sell || 80) * 3.2 / 10) * 10); };

// ---------- Acres (éditeur) ----------
G.ACRES = {
  plaine: { n: 'Prairie', col: '#8ed36f', ico: '🌼', lvl: 0 },
  foret: { n: 'Forêt', col: '#3f8f45', ico: '🌲', lvl: 0 },
  verger: { n: 'Verger', col: '#a6d65a', ico: '🍎', lvl: 0 },
  jardin: { n: 'Jardin fleuri', col: '#f0a1c4', ico: '🌷', lvl: 0 },
  riviere: { n: 'Rivière', col: '#4aa8e0', ico: '〰️', lvl: 0, water: 1 },
  riviere_h: { n: 'Rivière en hauteur', col: '#3b8ccc', ico: '🏞️', lvl: 1, water: 1 },
  cascade: { n: 'Cascade', col: '#77c6f0', ico: '🌊', lvl: 0, water: 1, fall: 1 },
  lac: { n: 'Lac', col: '#2f86c9', ico: '💧', lvl: 0, water: 1, lake: 1 },
  etang: { n: 'Étang', col: '#6bbbe6', ico: '🐸', lvl: 0, pond: 1 },
  plateau: { n: 'Plateau', col: '#b9a46b', ico: '🟫', lvl: 1 },
  colline: { n: 'Colline', col: '#c7b179', ico: '⛰️', lvl: 1, hill: 1 },
  montagne: { n: 'Montagne', col: '#8f8c86', ico: '🏔️', lvl: 1, mountain: 1 },
  place: { n: 'Place du village', col: '#d9cbb0', ico: '⛲', lvl: 0, struct: 'place' },
  village: { n: 'Quartier des habitants', col: '#f3c98b', ico: '🏡', lvl: 0, struct: 'village' },
  maison: { n: 'Ta maison', col: '#ff9f80', ico: '🏠', lvl: 0, struct: 'maison' },
  boutique: { n: 'Boutique', col: '#ffd86b', ico: '🛒', lvl: 0, struct: 'boutique' },
  camping: { n: 'Camping', col: '#9bc77a', ico: '⛺', lvl: 0, struct: 'camping' },
  plage: { n: 'Plage', col: '#f5e2a6', ico: '🏖️', lvl: 0, beach: 1 },
  plage_rochers: { n: 'Plage rocheuse', col: '#d8c79a', ico: '🪨', lvl: 0, beach: 1, rocky: 1 },
  ponton: { n: 'Ponton', col: '#e8c27c', ico: '⚓', lvl: 0, beach: 1, pier: 1 },
  phare: { n: 'Phare', col: '#f3e9d2', ico: '🗼', lvl: 0, beach: 1, lighthouse: 1 }
};
G.DEFAULT_LAYOUT = [
  ['montagne', 'foret', 'riviere_h', 'plateau', 'colline', 'foret', 'montagne'],
  ['foret', 'plateau', 'cascade', 'plaine', 'verger', 'colline', 'foret'],
  ['plaine', 'maison', 'riviere', 'place', 'boutique', 'plaine', 'etang'],
  ['verger', 'jardin', 'riviere', 'village', 'plaine', 'camping', 'foret'],
  ['plaine', 'etang', 'riviere', 'village', 'plaine', 'plaine', 'plateau'],
  ['plage', 'plage', 'plage', 'ponton', 'plage', 'plage_rochers', 'phare']
];

// ---------- Habitants ----------
G.VILLAGERS = [
  { n: 'Bibi', sp: 'lapin', col: 0xf4d9e4, acc: 0xff7fa8, catch: 'carotte', pitch: 1.35, house: 2 },
  { n: 'Moka', sp: 'chat', col: 0xe0a46a, acc: 0x7a4b2a, catch: 'miaou', pitch: 1.15, house: 1 },
  { n: 'Pépin', sp: 'ours', col: 0x9a6a46, acc: 0x5a3a24, catch: 'grrnon', pitch: .8, house: 3 },
  { n: 'Lulu', sp: 'canard', col: 0xfff3c4, acc: 0xffa62b, catch: 'coin coin', pitch: 1.25, house: 0 },
  { n: 'Gaston', sp: 'blaireau', col: 0x8b8f99, acc: 0xfaf7f0, catch: 'bonnaffaire', pitch: .95, shop: 1 }
];
G.LINES = {
  hello: ['Oh, salut {p} ! Belle journée à {v}, {c} !', 'Coucou {p} ! Tu sens ce petit vent ? J\'adore, {c} !', '{p} ! Justement je pensais à toi, {c}.', 'Hé {p}, tu as vu les nuages ce matin ? On dirait de la barbe à papa, {c} !'],
  morning: ['Bonjour {p} ! Le matin, je fais toujours trois tours de la place, {c}.', 'Tu es bien matinal·e, {p} ! Moi aussi, {c} !'],
  evening: ['Le coucher de soleil est magnifique ce soir, {c}...', 'Bientôt l\'heure de rentrer à la maison, {c}.'],
  night: ['Tu ne dors pas, {p} ? Regarde le ciel, il y a parfois des étoiles filantes, {c} !', 'Les lucioles sortent près de l\'eau la nuit, {c}. Avec un filet...'],
  tips: ['Si tu maintiens Espace longtemps, tu sautes deux fois plus haut que toi ! Pratique pour grimper les falaises, {c}.',
    'Secoue les arbres avec E : parfois il tombe des fruits... ou des clochettes, {c} !', 'Les ballons qui volent transportent des cadeaux. Un coup de lance-pierre et hop, {c} !',
    'Les fissures brillantes au sol cachent des fossiles. Il te faut une pelle, {c}.', 'Gaston achète tout ce que tu trouves à la boutique, {c}.',
    'Quand le flotteur plonge, appuie vite sur F pour ferrer le poisson, {c} !', 'Le vieux pont traverse la rivière. Sinon... un super saut, {c} ?'],
  random: ['J\'ai rêvé que je volais au-dessus de la cascade, {c}.', 'Ma maison a besoin d\'un nouveau tapis, {c}.', 'Tu crois que les poissons dorment, {c} ?',
    'Je collectionne les coquillages. J\'en ai déjà 37, {c} !', 'Quelqu\'un a planté un cerisier près de la place. C\'est tellement joli, {c}.', 'Les montagnes au nord sont pleines de rochers. Avec une pioche...'],
  gift: ['Tiens, {p}, j\'ai ça en trop. C\'est pour toi, {c} !', 'Cadeau ! Ne me remercie pas, {c} !']
};
