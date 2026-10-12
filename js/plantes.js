'use strict';
// ===== Plantes : 10 arbres de plus, 20 plantes en pot (intérieur), 40 arbustes et buissons fleuris (extérieur) =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  const add = (id, n, model, v, o, cat) => { G.OBJ[id] = Object.assign({ id, n, model, v, take: 1, cat }, o); G.ITEMS[id] = { id, n, stack: 9, sell: 120, kind: 'place', obj: id, cat, thumb: 'obj:' + id }; if (G.SHOPLIST) G.SHOPLIST.push(id); };
  // plante générique : forme f, couleurs feuilles c1/c2, fleurs fl, taille s, en pot p
  function plant(b, f, c1, c2, fl, s, p, r) {
    let y = 0; if (p) { b.cyl(.2 * s + .05, .15 * s + .04, .3, 14, p, 0, .15, 0); b.tor(.2 * s + .05, .025, p, 0, .3, 0, Math.PI / 2, 0, 0, 0, 14); b.cyl(.19 * s + .04, .19 * s + .04, .02, 12, 0x5a3d2b, 0, .29, 0); y = .3; }
    b.jit(.12); const n = 7 + Math.floor(r() * 5);
    if (f === 'rosette') for (let i = 0; i < n * 2; i++) { const a = i * 2.4, t = .3 + (i % 4) * .2; b.cone(.05 * s, .55 * s, 5, i % 3 ? c1 : c2, Math.cos(a) * .08 * s, y + .22 * s, Math.sin(a) * .08 * s, Math.sin(a) * t, 0, -Math.cos(a) * t); }
    else if (f === 'cactus') { b.cyl(.12 * s, .14 * s, .8 * s, 10, c1, 0, y + .4 * s, 0); b.sph(.12 * s, c1, 0, y + .8 * s, 0); for (const sd of [-1, 1]) { b.cyl(.06 * s, .06 * s, .3 * s, 8, c2, sd * .16 * s, y + .5 * s, 0); b.cyl(.06 * s, .06 * s, .25 * s, 8, c2, sd * .22 * s, y + .7 * s, 0); } if (fl) b.sph(.05 * s, fl, 0, y + .93 * s, 0); }
    else if (f === 'fern') for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, t = .7 + (i % 3) * .2; b.geo(new THREE.SphereGeometry(.1, 8, 5), i % 2 ? c1 : c2, b.M(Math.cos(a) * .22 * s, y + .25 * s, Math.sin(a) * .22 * s, t, Math.PI / 2 - a, 0, .45 * s, .12 * s, 3.2 * s), 0, true); }
    else if (f === 'palm') { b.cyl(.03 * s, .05 * s, .7 * s, 6, 0x8a6a46, 0, y + .35 * s, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; b.geo(new THREE.SphereGeometry(.1, 8, 5), i % 2 ? c1 : c2, b.M(Math.cos(a) * .25 * s, y + .68 * s, Math.sin(a) * .25 * s, .5, Math.PI / 2 - a, 0, .5 * s, .1 * s, 3.4 * s), 0, true); } }
    else { const tr = f === 'tree' || f === 'arbre', h = tr ? (f === 'arbre' ? 1.8 : .7) * s : .1, cr = (f === 'arbre' ? .9 : f === 'tree' ? .32 : f === 'haie' ? .45 : .38) * s;
      if (tr) b.cyl(.03 * s * (f === 'arbre' ? 4 : 1), .05 * s * (f === 'arbre' ? 4 : 1), h, 7, 0x6b4a2c, 0, y + h / 2, 0);
      for (let i = 0; i < n; i++) { const a = r() * TAU, d = r() * cr * .6; b.blob(cr * (.5 + r() * .35), 1, r() < .5 ? c1 : c2, Math.cos(a) * d, y + h + cr * (.6 + r() * .5) * (f === 'haie' ? .7 : 1), Math.sin(a) * d, 1, f === 'haie' ? .75 : 1, 1); }
      if (fl) for (let i = 0; i < n * 3; i++) { const a = r() * TAU, e = r() * 1.2, rr = cr * .95; b.sph(.04 * s + .02, Array.isArray(fl) ? fl[i % fl.length] : fl, Math.cos(a) * Math.cos(e) * rr, y + h + cr * .9 + Math.sin(e) * rr * .8, Math.sin(a) * Math.cos(e) * rr, 1, 1, 1, 0, 6, 4); } }
    b.jit(0); }
  const PL = []; MD.plante2 = v => { const q = PL[v], b = G.mb(600 + v); plant(b, ...q, G.rng(v + 9)); return b.done(); };
  const T = (n, f, c1, c2, fl, s, p, cat, extra) => { PL.push([f, c1, c2, fl, s, p]); const v = PL.length - 1; add('pl_' + v, n, 'plante2', v, Object.assign({ h: p ? .4 + .6 * s : 1.2 * s, fp: [1, 1] }, extra), cat); };
  const POT = 0xc9714f, POTB = 0xf3ece0, POTN = 0x3a3d42, G1 = 0x4fa84a, G2 = 0x3d8f43, G3 = 0x7fbf5a;
  // 20 plantes en pot (intérieur)
  [['Aloe vera', 'rosette', 0x7fae8a, 0x9cc8a8, 0, 1, POT], ['Figuier en pot', 'tree', G2, G1, 0x6b3a5a, 1.3, POTB], ['Ficus', 'tree', 0x2f7a3a, G1, 0, 1.4, POTN], ['Olivier en pot', 'tree', 0x8fa67a, 0xa9bd92, 0x3a3a2a, 1.2, POT],
   ['Citronnier en pot', 'tree', G2, G1, 0xffe14a, 1.2, POTB], ['Oranger nain', 'tree', G2, G3, 0xff9420, 1.1, POT], ['Cactus', 'cactus', 0x4f9a5a, 0x5fae68, 0xff6f91, 1, POT], ['Cactus fleuri', 'cactus', 0x3f8a4a, 0x4f9a5a, 0xffd23f, .8, POTB],
   ['Fougère', 'fern', G1, G3, 0, 1, POTB], ['Fougère de Boston', 'fern', G2, G1, 0, 1.3, POTN], ['Palmier d\'intérieur', 'palm', G1, G2, 0, 1.3, POTB], ['Monstera', 'palm', 0x2f7a3a, 0x3d8f43, 0, 1.1, POT],
   ['Orchidée', 'bush', G2, G1, [0xff9fd8, 0xffffff], .6, POTB], ['Bonsaï', 'tree', 0x3d7a3a, 0x5a9a4a, 0, .8, 0x3a5a6a], ['Lavande en pot', 'bush', 0x8aa67a, 0x9cbf8a, 0x9b7ad8, .8, POT], ['Géranium', 'bush', G1, G3, 0xe8434a, .8, POTB],
   ['Basilic', 'bush', 0x5fbf4a, 0x7fd05a, 0, .6, POT], ['Succulente', 'rosette', 0x8fbfa0, 0xb0d8bc, 0xffb3c6, .6, POTB], ['Sansevieria', 'rosette', 0x3f7a3a, 0xc8d86a, 0, 1.3, POTN], ['Camélia en pot', 'bush', G2, G1, 0xff6f91, 1, POTN]]
    .forEach(q => T(q[0], q[1], q[2], q[3], q[4], q[5], q[6], 'mobilier'));
  // 40 arbustes et buissons fleuris (extérieur)
  const FL = [['Rosier', 0xe8434a], ['Rosier blanc', 0xffffff], ['Rosier jaune', 0xffd23f], ['Lilas', 0xb583e6], ['Hibiscus rose', 0xff6f91], ['Laurier-rose', 0xff9fc0], ['Bougainvillier', 0xd23f8f], ['Azalée', 0xff7aa8], ['Rhododendron', 0xc86ad8], ['Forsythia', 0xffe14a],
    ['Genêt', 0xfff04a], ['Hortensia bleu', 0x6f9fe8], ['Hortensia rose', 0xff9fc8], ['Camélia', 0xe8434a], ['Magnolia', 0xfff0f4], ['Lavande', 0x9b7ad8], ['Romarin', 0x8fb4ff], ['Jasmin', 0xffffff], ['Glycine', 0xb59bf0], ['Pivoine', 0xff8fb0],
    ['Seringat', 0xfffaf0], ['Spirée', 0xffffff], ['Weigelia', 0xff7a9a], ['Abélia', 0xffe0ea], ['Fuchsia', [0xd2387a, 0x7a3ad2]], ['Buddleia', 0x8a5ad8], ['Millepertuis', 0xffd23f], ['Potentille', 0xffe14a], ['Céanothe', 0x5a7ae8], ['Escallonia', 0xff5a8a]];
  FL.forEach(([n, c], i) => T(n, 'bush', i % 2 ? G1 : G2, i % 3 ? G3 : G2, c, .9 + (i % 4) * .15, 0, 'fleurs'));
  [['Buis', 'haie', 0x3d7a3a, 0x4f8a4a, 0, 1], ['Houx', 'bush', 0x2f6a3a, 0x3d7a3a, 0xd8202a, 1], ['Laurier', 'bush', 0x3f7a3a, G2, 0, 1.2], ['Troène', 'haie', G1, G2, 0, 1.1], ['Fusain doré', 'bush', 0xb8c84a, 0x8aa83a, 0, 1],
   ['Agave', 'rosette', 0x7fae9a, 0x9cc8b0, 0, 1.6], ['Yucca', 'rosette', 0x5f9a5a, 0x7fb06a, 0xfff6e0, 1.8], ['Bambou', 'palm', G3, G1, 0, 2], ['Palmier nain', 'palm', G1, G2, 0, 1.8], ['Fougère arborescente', 'fern', G2, G1, 0, 2.2]]
    .forEach(q => T(q[0], q[1], q[2], q[3], q[4], q[5], 0, 'fleurs'));
  // 10 arbres de plus (ils poussent quand on les plante)
  [['Figuier', 0x3d8f43, 0x4fa84a, 0x6b3a5a], ['Olivier', 0x8fa67a, 0xa9bd92, 0x3a3a2a], ['Citronnier', 0x3d8f43, 0x63bf55, 0xffe14a], ['Saule pleureur', 0x7fbf5a, 0x9ccf6a, 0], ['Érable rouge', 0xc8402a, 0xe86a3a, 0],
   ['Érable doré', 0xe8b030, 0xf2d24c, 0], ['Jacaranda', 0x8a7ad8, 0xa98ae8, [0xb59bf0, 0x8a6ad8]], ['Magnolia arbre', 0x4fa84a, 0x3d8f43, 0xfff0f4], ['Prunier en fleurs', 0xffd0e8, 0xffffff, 0xff9fc0], ['Tilleul', 0x63bf55, 0x7fcf6a, 0xfff6a0]]
    .forEach(q => T(q[0], 'arbre', q[1], q[2], q[3], 1.3, 0, 'fleurs', { h: 4, chop: 3, grow: 1, shadow: 1.1 }));
})();
