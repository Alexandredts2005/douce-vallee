'use strict';
// ===== La Grand-Rue s'agrandit : trente nouvelles boutiques tout le long de la partie est, des deux côtés de la rue.
// Chacune a sa devanture de bois peint (vitrines profondes et éclairées, garnies de ses produits), son store festonné,
// son enseigne en potence, ses étages à balcons et son toit à la Mansart ; à l'intérieur, son décor, son commerçant,
// sa conversation et sa marchandise (dont soixante-dix gourmandises nouvelles). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, I = G.ITEMS, PI = Math.PI, TAU = PI * 2, PT = G.PAT;
  const GOLD = 0xd9b84a, IRON = 0x24282c, WIN = 0xfff0c2, GLASS = 0xbfd6e6, CREAM = 0xf6f1e6;
  const C3 = c => new THREE.Color(c), dark = (c, k = .72) => C3(c).multiplyScalar(k).getHex(), light = (c, k = .35) => C3(c).lerp(C3(0xffffff), k).getHex();
  // pièces à arêtes vives (légères : il y en a beaucoup)
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0) => b.geo(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, 0, ry, 0), mat);
  const sp = (b, r, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0) => b.add(new THREE.SphereGeometry(r, 8, 6), col, b.M(x, y, z, 0, 0, 0, sx, sy, sz), mat, true);
  const cy = (b, rt, rb, h, col, x, y, z, rx = 0, rz = 0, mat = 0, n = 10) => b.add(new THREE.CylinderGeometry(rt, rb, h, n), col, b.M(x, y, z, rx, 0, rz), mat);
  const cn = (b, r, h, col, x, y, z, rx = 0, rz = 0, mat = 0, n = 8) => b.add(new THREE.ConeGeometry(r, h, n), col, b.M(x, y, z, rx, 0, rz), mat);
  const to = (b, r, t, col, x, y, z, rx = 0, ry = 0, rz = 0, arc = TAU) => b.add(new THREE.TorusGeometry(r, t, 4, 12, arc), col, b.M(x, y, z, rx, ry, rz), 0, true);
  const pk = (a, i) => a[((i % a.length) + a.length) % a.length];
  const row = (x0, x1, step, f) => { let i = 0; for (let x = x0 + step * .55; x < x1 - step * .4; x += step, i++) f(x, i); };

  // =====================================================================
  // 1. Les gourmandises
  // =====================================================================
  const FD = (id, n, ico, food, sell, hp) => { if (!I[id]) I[id] = Object.assign({ id, n, kind: 'food', ico, food, sell, cat: 'nourriture', stack: 99 }, hp ? { hp } : {}); };
  // boulangerie, pâtisserie, chocolaterie
  FD('baguette', 'Baguette', '🥖', 3, 60); FD('croissant', 'Croissant', '🥐', 3, 70); FD('pain_chocolat', 'Pain au chocolat', '🥐', 3, 80); FD('brioche', 'Brioche', '🍞', 4, 90);
  FD('pain_campagne', 'Pain de campagne', '🍞', 5, 110); FD('chausson', 'Chausson aux pommes', '🥐', 3, 90);
  FD('eclair', 'Éclair au chocolat', '🧁', 3, 120); FD('macaron', 'Boîte de macarons', '🍬', 2, 140); FD('mille_feuille', 'Mille-feuille', '🍰', 4, 160); FD('fraisier', 'Fraisier', '🎂', 6, 260);
  FD('madeleine', 'Madeleines', '🧁', 2, 70); FD('tarte_citron', 'Tarte au citron', '🥧', 5, 220); FD('paris_brest', 'Paris-Brest', '🍩', 4, 200);
  FD('tablette_chocolat', 'Tablette de chocolat', '🍫', 3, 120); FD('truffes', 'Truffes au chocolat', '🍫', 3, 180); FD('chocolat_chaud', 'Chocolat chaud', '☕', 4, 110); FD('oeuf_chocolat', 'Œuf en chocolat', '🥚', 3, 150);
  // fromagerie, primeur
  FD('camembert', 'Camembert', '🧀', 4, 130); FD('comte', 'Comté', '🧀', 5, 170); FD('chevre', 'Fromage de chèvre', '🧀', 3, 120); FD('roquefort', 'Roquefort', '🧀', 4, 160); FD('plateau_fromages', 'Plateau de fromages', '🧀', 8, 400);
  FD('fraise', 'Fraises', '🍓', 1, 60); FD('raisin', 'Grappe de raisin', '🍇', 2, 80); FD('poire', 'Poire', '🍐', 2, 90); FD('banane', 'Banane', '🍌', 2, 80); FD('citron', 'Citron', '🍋', 1, 60);
  FD('pasteque', 'Pastèque', '🍉', 4, 180); FD('melon', 'Melon', '🍈', 3, 150); FD('ananas', 'Ananas', '🍍', 3, 200); FD('carotte', 'Carottes', '🥕', 1, 40); FD('tomate', 'Tomates', '🍅', 1, 50);
  FD('salade', 'Salade', '🥬', 1, 50); FD('pomme_de_terre', 'Pommes de terre', '🥔', 2, 40); FD('potiron', 'Potiron', '🎃', 4, 160); FD('mais', 'Épi de maïs', '🌽', 2, 60); FD('avocat', 'Avocat', '🥑', 2, 110);
  // glacier, crêperie, salon de thé, torréfacteur
  FD('glace_vanille', 'Glace à la vanille', '🍦', 2, 80); FD('glace_fraise', 'Glace à la fraise', '🍨', 2, 80); FD('sorbet_citron', 'Sorbet au citron', '🍧', 2, 80); FD('coupe_glacee', 'Coupe glacée', '🍨', 4, 190); FD('milkshake', 'Milk-shake', '🥤', 3, 120);
  FD('crepe_sucre', 'Crêpe au sucre', '🥞', 3, 70); FD('crepe_choco', 'Crêpe au chocolat', '🥞', 4, 100); FD('galette', 'Galette complète', '🥞', 6, 160); FD('jus_pomme', 'Jus de pomme', '🧃', 2, 60);
  FD('the', 'Thé parfumé', '🍵', 2, 70); FD('tisane', 'Tisane des Alpes', '🌿', 2, 90); FD('scones', 'Scones', '🥯', 3, 90);
  FD('expresso', 'Expresso', '☕', 1, 60); FD('cappuccino', 'Cappuccino', '☕', 2, 90); FD('cafe_creme', 'Café crème', '☕', 2, 80);
  // traiteur, épicerie, confiserie, poissonnerie, pharmacie
  FD('quiche', 'Quiche lorraine', '🥧', 5, 200); FD('croque_monsieur', 'Croque-monsieur', '🥪', 4, 150); FD('jambon_beurre', 'Jambon-beurre', '🥪', 4, 140); FD('salade_nicoise', 'Salade niçoise', '🥗', 4, 170);
  FD('ratatouille', 'Ratatouille', '🍲', 5, 190); FD('gratin', 'Gratin dauphinois', '🥘', 6, 230); FD('poulet_roti', 'Poulet rôti', '🍗', 7, 320); FD('pizza', 'Pizza', '🍕', 5, 210);
  FD('miel', 'Pot de miel', '🍯', 3, 150); FD('confiture', 'Confiture de fraises', '🍓', 3, 130); FD('jus_orange', 'Jus d’orange', '🧃', 2, 60); FD('limonade', 'Limonade', '🥤', 2, 60); FD('biscuits', 'Biscuits au beurre', '🍪', 2, 70); FD('noix', 'Noix', '🌰', 1, 50);
  FD('sucette', 'Sucette', '🍭', 1, 40); FD('bonbons', 'Sachet de bonbons', '🍬', 1, 60); FD('guimauve', 'Guimauves', '🍡', 1, 60); FD('nougat', 'Nougat', '🍬', 2, 90); FD('barbe_papa', 'Barbe à papa', '🍭', 1, 70);
  FD('plateau_mer', 'Plateau de fruits de mer', '🦞', 8, 420); FD('huitres', 'Huîtres', '🦪', 4, 260); FD('crevettes', 'Crevettes', '🦐', 2, 120); FD('saumon', 'Pavé de saumon', '🐟', 5, 220); FD('crabe', 'Crabe', '🦀', 4, 200);
  FD('sirop', 'Sirop qui requinque', '🧪', 1, 150, 6); FD('vitamines', 'Vitamines', '💊', 1, 120, 4); FD('pastilles', 'Pastilles au miel', '🍬', 1, 60, 2);

  // =====================================================================
  // 2. Les vitrines : ce qu'on voit derrière le verre (étagère du bas à la hauteur y, étagère du haut à y + .44)
  // =====================================================================
  const FRUIT = [0xd8343a, 0xffa64d, 0x8cc04a, 0xf3d93f, 0xd8343a, 0x7a3f8a];
  const GOODS = {
    pain: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .26, (x, i) => { if (i % 2) to(b, .065, .03, 0xe0a050, x, y + .03, z, -PI / 2, 0, 0, PI); else { sp(b, .1, 0xc68a48, x, y + .06, z, 1, .62, 1); bx(b, .12, .012, .02, 0x9a6a34, x, y + .12, z); } });
      for (const dz of [-.06, .06]) cy(b, .035, .035, (x1 - x0) * .8, 0xd39a52, (x0 + x1) / 2, y + .48, zu + dz, 0, PI / 2); },
    gateau: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, (x, i) => { cy(b, .12, .12, .14, pk([0xf2b8c8, 0xf7efe0, 0x6b3f2a, 0xf3d36b], i), x, y + .07, z); cy(b, .121, .121, .03, 0xffffff, x, y + .155, z); sp(b, .028, 0xd8343a, x, y + .19, z); });
      row(x0, x1, .09, (x, i) => { for (let k = 0; k < 2; k++) sp(b, .035, pk([0xf2a0c8, 0xb8e0a8, 0xf3d36b, 0xc8b0f0, 0x8a5a3a], i + k), x, y + .47 + k * .045, zu, 1, .55, 1); }); },
    choco: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .26, (x, i) => { bx(b, .2, .12, .16, pk([0x5a3420, 0x3a2216, 0x7a4a2a], i), x, y + .06, z); bx(b, .21, .02, .165, GOLD, x, y + .1, z); sp(b, .022, GOLD, x, y + .13, z); });
      row(x0, x1, .3, x => { cy(b, .08, .1, .08, 0xc9a23a, x, y + .48, zu); sp(b, .085, 0x5a3420, x, y + .56, zu, 1, .5, 1); }); },
    fromage: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, x => { cy(b, .13, .13, .11, 0xf3d36b, x, y + .055, z); cy(b, .133, .133, .02, 0xe0b040, x, y + .11, z); });
      row(x0, x1, .26, x => { G.prism(b, .18, .11, .12, 0xf7e08a, x - .04, y + .44, zu); cy(b, .05, .05, .05, 0xfbf8ee, x + .08, y + .465, zu); }); },
    glace: (b, x0, x1, y, z, zu = z) => { bx(b, x1 - x0 - .08, .14, .3, 0xeef6fa, (x0 + x1) / 2, y + .07, z); row(x0, x1, .17, (x, i) => cy(b, .065, .065, .04, pk([0xfff3d6, 0xf2a0c8, 0xb8e0a8, 0x8a5a3a, 0xfff1a0], i), x, y + .15, z));
      row(x0, x1, .2, (x, i) => { cn(b, .05, .17, 0xd9a35f, x, y + .53, zu, PI); sp(b, .06, pk([0xfff3d6, 0xf2a0c8, 0xb8e0a8, 0x8a5a3a], i), x, y + .63, zu); sp(b, .05, pk([0xf2a0c8, 0xfff1a0, 0x8a5a3a], i), x, y + .7, zu); }); },
    crepe: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .32, x => { for (let k = 0; k < 5; k++) cy(b, .12, .12, .018, k % 2 ? 0xe8b870 : 0xdca25a, x, y + .012 + k * .02, z); sp(b, .03, 0xd8343a, x, y + .13, z); });
      row(x0, x1, .18, (x, i) => { cy(b, .045, .045, .13, i % 2 ? 0xe8b05a : 0xc0283a, x, y + .505, zu); cy(b, .048, .048, .025, i % 2 ? 0xf7f5ee : 0xd8343a, x, y + .58, zu); }); },
    the: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .34, (x, i) => { const c = pk([0xf7f5ee, 0x5b8fd6, 0xf2a0c8], i); sp(b, .1, c, x, y + .08, z, 1, .8, 1); cn(b, .02, .12, c, x + .11, y + .1, z, 0, -1.1, 0, 5); sp(b, .022, GOLD, x, y + .17, z); to(b, .05, .012, c, x - .1, y + .09, z); });
      row(x0, x1, .2, x => { cy(b, .065, .065, .01, 0xffffff, x, y + .445, zu); cy(b, .045, .035, .055, 0xffffff, x, y + .475, zu); }); },
    epicerie: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .16, (x, i) => { cy(b, .055, .055, .15, pk([0xd8343a, 0xffa64d, 0x7a3f8a, 0xf3d36b, 0x5aa04a], i), x, y + .075, z); cy(b, .057, .057, .025, i % 2 ? 0xd8343a : 0xf7f5ee, x, y + .16, z); });
      row(x0, x1, .14, (x, i) => { const c = pk([0x2f6b45, 0x8a2f3a, 0xe8c25a], i); cy(b, .03, .045, .26, c, x, y + .57, zu); cy(b, .015, .015, .08, c, x, y + .74, zu); }); },
    bonbon: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, (x, i) => { for (let k = 0; k < 6; k++) sp(b, .032, pk([0xff6b8a, 0x6bd0ff, 0xffd23f, 0x7fd36b, 0xc58aff], k + i), x + (k % 3 - 1) * .045, y + .04 + Math.floor(k / 3) * .06, z); cy(b, .1, .1, .24, 0xeaf4f8, x, y + .12, z, 0, 0, 2); sp(b, .03, 0xd8343a, x, y + .27, z); });
      row(x0, x1, .16, (x, i) => { cy(b, .006, .006, .22, 0xffffff, x, y + .55, zu); cy(b, .07, .07, .02, pk([0xff6b8a, 0x6bd0ff, 0xffd23f, 0xc58aff], i), x, y + .69, zu, PI / 2); to(b, .04, .008, 0xffffff, x, y + .69, zu + .012); }); },
    poisson: (b, x0, x1, y, z, zu = z) => { bx(b, x1 - x0 - .08, .06, .32, 0xeef6fa, (x0 + x1) / 2, y + .03, z); row(x0, x1, .22, (x, i) => { sp(b, .05, pk([0x8fa4b4, 0xe0a8a0, 0x9aa8b8], i), x, y + .09, z, 2.4, .55, .8); cn(b, .035, .06, 0x8fa4b4, x - .14, y + .09, z, 0, -PI / 2); sp(b, .022, 0xf3e36b, x + .06, y + .08, z + .1); });
      row(x0, x1, .22, (x, i) => { sp(b, .06, i % 2 ? 0xd8543a : 0xf3d9c0, x, y + .47, zu, 1, .45, 1); }); },
    pharma: (b, x0, x1, y, z, zu = z, sh) => { row(x0, x1, .15, (x, i) => { cy(b, .045, .045, .14, pk([0x2f8a5a, 0xe8f0ea, 0x8ab0d0, 0xc0283a], i), x, y + .07, z); cy(b, .03, .03, .04, 0xf7f5ee, x, y + .16, z); });
      row(x0, x1, .2, (x, i) => bx(b, .14, .1, .08, i % 2 ? 0xffffff : 0xd8efe0, x, y + .49, zu)); if (!sh) { const xm = (x0 + x1) / 2; bx(b, .24, .07, .03, 0x2fbf6a, xm, y + .95, zu, 0, 1); bx(b, .07, .24, .03, 0x2fbf6a, xm, y + .95, zu, 0, 1); } },
    primeur: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, (x, i) => { bx(b, .26, .1, .22, 0xc8a06a, x, y + .05, z); for (let k = 0; k < 5; k++) sp(b, .045, pk(FRUIT, i), x - .08 + (k % 3) * .08, y + .12 + Math.floor(k / 3) * .04, z + (k < 3 ? -.04 : .04)); });
      row(x0, x1, .3, (x, i) => { for (const [dx, dy, dz] of [[-.05, 0, -.03], [.05, 0, -.03], [0, 0, .05], [0, .07, 0]]) sp(b, .045, pk(FRUIT, i + 2), x + dx, y + .485 + dy, zu + dz); }); },
    traiteur: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, (x, i) => { cy(b, .11, .11, .02, 0xffffff, x, y + .01, z); cy(b, .09, .09, .04, pk([0xe8c25a, 0xd8543a, 0x6aa04a, 0xf0d08a], i), x, y + .04, z); sp(b, .02, 0x3f8f45, x + .03, y + .07, z); });
      row(x0, x1, .26, x => { bx(b, .2, .08, .1, 0xc8784a, x, y + .48, zu); bx(b, .2, .02, .1, 0xf0d0a0, x, y + .53, zu); }); },
    cafe: (b, x0, x1, y, z, zu = z) => { row(x0, x1, .3, x => { sp(b, .1, 0xc8a878, x, y + .13, z, 1, 1.4, .9); sp(b, .075, 0x4a2a16, x, y + .26, z, 1, .35, 1); });
      row(x0, x1, .18, (x, i) => { cy(b, .05, .05, .12, pk([0xc0283a, 0x2f4a8a, 0xd9b84a, 0x2f6b45], i), x, y + .5, zu); cy(b, .052, .052, .02, GOLD, x, y + .57, zu); }); },
    livre: (b, x0, x1, y, z, zu = z) => { for (let x = x0 + .08; x < x1 - .06; x += .07) { const h = .2 + ((Math.round(x * 31) % 4 + 4) % 4) * .03; bx(b, .05, h, .16, pk([0x8a2f3a, 0x2f4a8a, 0x2f6b45, 0xc9a23a, 0x6b4226], Math.round(x * 17)), x, y + h / 2, z); }
      const xm = (x0 + x1) / 2; cy(b, .05, .07, .03, GOLD, xm, y + .455, zu); cy(b, .01, .01, .08, GOLD, xm, y + .5, zu); sp(b, .1, 0x6f93b4, xm, y + .6, zu); to(b, .11, .01, GOLD, xm, y + .6, zu, 0, 0, .4); },
    antique: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; b.add(new THREE.LatheGeometry([[0, 0], [.08, 0], [.07, .04], [.12, .14], [.1, .26], [.06, .3], [0, .3]].map(p => new THREE.Vector2(p[0], p[1])), 10), 0x2f4f9a, b.M(x0 + .18, y, z));
      bx(b, .16, .55, .12, 0x6b4226, xm, y + .275, z); cy(b, .05, .05, .01, 0xf7f5ee, xm, y + .45, z + .065, PI / 2); sp(b, .03, GOLD, xm, y + .6, z); bx(b, .24, .14, .16, 0x7a4a2a, x1 - .2, y + .07, z); bx(b, .26, .02, .18, GOLD, x1 - .2, y + .15, z); },
    lustre: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; cy(b, .006, .006, .3, GOLD, xm, y + 1.1, z); to(b, .14, .014, GOLD, xm, y + .95, z, PI / 2);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, px = xm + Math.cos(a) * .14, pz = z + Math.sin(a) * .07; cy(b, .011, .011, .06, 0xfff8ec, px, y + .99, pz); sp(b, .016, 0xffd27a, px, y + 1.04, pz, 1, 1.5, 1, 1); }
      for (const x of [x0 + .12, x1 - .12]) { cy(b, .02, .05, .3, GOLD, x, y + .15, z); cn(b, .09, .1, 0xf3e2c4, x, y + .36, z); sp(b, .03, 0xffe2a0, x, y + .33, z, 1, 1, 1, 1); } },
    meuble: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; bx(b, .26, .03, .2, 0x8a5a34, xm, y + .22, z); for (const dx of [-.11, .11]) bx(b, .02, .22, .02, 0x6b4226, xm + dx, y + .11, z);
      for (const [x, c] of [[x0 + .16, 0xc0283a], [x1 - .16, 0x2f4a8a]]) { bx(b, .18, .05, .18, c, x, y + .14, z); bx(b, .18, .2, .04, c, x, y + .26, z - .08); for (const dx of [-.07, .07]) bx(b, .02, .12, .02, 0x6b4226, x + dx, y + .06, z + .06); } },
    tapis: (b, x0, x1, y, z) => { row(x0, x1, .2, (x, i) => cy(b, .07, .07, .5, pk([0x8a2f3a, 0x2f4a6a, 0xc9a23a, 0x3f6a4a], i), x, y + .25, z + .05)); bx(b, x1 - x0 - .16, .6, .02, 0x7a2a2e, (x0 + x1) / 2, y + .8, z - .12); bx(b, x1 - x0 - .32, .44, .025, 0xe9d9b0, (x0 + x1) / 2, y + .8, z - .12); },
    outil: (b, x0, x1, y, z) => { bx(b, x1 - x0 - .08, .7, .02, 0xc8a06a, (x0 + x1) / 2, y + .6, z - .12); row(x0, x1, .2, x => { bx(b, .02, .26, .02, 0x8a5a34, x, y + .62, z - .1); bx(b, .1, .05, .04, 0x8f969e, x, y + .76, z - .1); });
      row(x0, x1, .24, (x, i) => { cy(b, .07, .07, .12, pk([0xd8343a, 0x2f6fb8, 0xf3d36b], i), x, y + .06, z + .04); cy(b, .072, .072, .015, 0xc0c4c8, x, y + .125, z + .04); }); },
    fleur: (b, x0, x1, y, z) => { row(x0, x1, .26, (x, i) => { cy(b, .08, .06, .14, pk([0xc8784a, 0x8f969e, 0xf3ead2], i), x, y + .07, z); sp(b, .07, 0x3f7a35, x, y + .2, z, 1, .6, 1);
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; sp(b, .042, pk([0xff6b8a, 0xffd23f, 0xffffff, 0xc58aff, 0xff9a4d], k + i), x + Math.cos(a) * .06, y + .26 + (k % 2) * .05, z + Math.sin(a) * .04); } }); },
    chapeau: (b, x0, x1, y, z) => { row(x0, x1, .32, (x, k) => { cy(b, .015, .03, .3, 0x6b4226, x, y + .15, z); const yh = y + .34;
      if (k % 3 === 0) { cy(b, .14, .14, .015, IRON, x, yh, z); cy(b, .08, .08, .16, IRON, x, yh + .08, z); cy(b, .081, .081, .025, 0xc0283a, x, yh + .03, z); }
      else if (k % 3 === 1) { cy(b, .15, .15, .012, 0xe8d9a8, x, yh, z); cy(b, .085, .085, .07, 0xe8d9a8, x, yh + .04, z); cy(b, .086, .086, .02, 0x2f4a8a, x, yh + .02, z); }
      else { sp(b, .1, 0x2f4a6a, x, yh + .02, z, 1.2, .35, 1.2); sp(b, .015, IRON, x, yh + .06, z); } }); },
    bijou: (b, x0, x1, y, z) => { row(x0, x1, .32, (x, i) => { cy(b, .05, .1, .26, 0x2a2030, x, y + .13, z); sp(b, .07, 0x2a2030, x, y + .3, z, 1.3, .7, .8);
      to(b, .07, .008, GOLD, x, y + .24, z + .05, -.3); sp(b, .02, pk([0xd8343a, 0x2f8a5a, 0x5b8fd6], i), x, y + .17, z + .07); }); },
    jouet: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; sp(b, .11, 0xc68a48, x0 + .18, y + .11, z); sp(b, .075, 0xc68a48, x0 + .18, y + .27, z); for (const s of [-1, 1]) sp(b, .03, 0xc68a48, x0 + .18 + s * .055, y + .34, z);
      sp(b, .09, 0xd8343a, xm, y + .09, z); bx(b, .02, .09, .18, 0xffffff, xm, y + .09, z); bx(b, .26, .1, .12, 0x2f6fb8, x1 - .2, y + .1, z); for (const dx of [-.08, .08]) cy(b, .04, .04, .13, IRON, x1 - .2 + dx, y + .04, z, PI / 2);
      b.add(new THREE.ConeGeometry(.12, .2, 4), 0xffd23f, b.M(xm, y + .75, z - .05, PI / 2, 0, PI / 4)); cy(b, .003, .003, .3, 0xffffff, xm, y + .95, z - .05); },
    musique: (b, x0, x1, y, z) => { sp(b, .09, 0x8a4a22, x0 + .2, y + .22, z, .8, 1.1, .35); sp(b, .07, 0x8a4a22, x0 + .2, y + .38, z, .7, .8, .35); bx(b, .03, .3, .02, IRON, x0 + .2, y + .52, z + .02);
      to(b, .08, .015, GOLD, x1 - .22, y + .2, z); cn(b, .06, .14, GOLD, x1 - .13, y + .26, z, 0, -PI / 2); cy(b, .1, .1, .12, 0xd8343a, (x0 + x1) / 2, y + .06, z); cy(b, .102, .102, .015, 0xf7f5ee, (x0 + x1) / 2, y + .125, z); },
    mode: (b, x0, x1, y, z) => { row(x0, x1, .4, (x, i) => { const c = pk([0xc0283a, 0x2f4a8a, 0xf2a0b8, 0x2f6b45], i); cy(b, .08, .1, .02, 0x6b4226, x, y + .01, z); cy(b, .012, .012, .42, 0x6b4226, x, y + .22, z);
      cn(b, .16, .34, c, x, y + .57, z); sp(b, .085, c, x, y + .8, z, 1, 1.25, .7); cy(b, .02, .02, .06, 0xe8d9c8, x, y + .93, z); sp(b, .03, 0x6b4226, x, y + .98, z); }); },
    barbier: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; cy(b, .15, .15, .02, 0xdfe6ea, xm, y + .7, z - .12, PI / 2); to(b, .155, .015, GOLD, xm, y + .7, z - .11);
      cy(b, .08, .06, .06, 0xf7f5ee, x0 + .18, y + .03, z); sp(b, .06, 0xffffff, x0 + .18, y + .08, z, 1, .5, 1); cy(b, .02, .025, .1, 0x6b4226, x0 + .3, y + .05, z); sp(b, .035, 0xe8d9c8, x0 + .3, y + .12, z, 1, 1.3, 1);
      row(xm, x1, .1, (x, i) => cy(b, .03, .035, .16, pk([0x2f6b45, 0x8a5a34, 0x5b8fd6], i), x, y + .08, z)); },
    garage: (b, x0, x1, y, z) => { const xb = x0 + .3; for (const dx of [-.17, .17]) { to(b, .13, .014, IRON, xb + dx, y + .14, z); cy(b, .02, .02, .02, 0xc0c4c8, xb + dx, y + .14, z, PI / 2); }
      bx(b, .3, .02, .02, 0xd8343a, xb, y + .3, z); b.add(new THREE.BoxGeometry(.02, .26, .02), 0xd8343a, b.M(xb - .05, y + .2, z, 0, 0, -.7)); b.add(new THREE.BoxGeometry(.02, .2, .02), 0xd8343a, b.M(xb + .13, y + .22, z, 0, 0, .3)); bx(b, .08, .02, .04, IRON, xb - .12, y + .33, z); bx(b, .02, .02, .14, IRON, xb + .15, y + .34, z);
      for (let k = 0; k < 3; k++) to(b, .1, .035, 0x2a2a2a, x1 - .16, y + .035 + k * .07, z, PI / 2); },
    jardin: (b, x0, x1, y, z) => { const xm = (x0 + x1) / 2; cy(b, .008, .008, .7, 0xf7f5ee, xm, y + .35, z); cn(b, .3, .12, 0xd8343a, xm, y + .72, z, 0, 0, 0, 12); cn(b, .302, .06, 0xffffff, xm, y + .7, z, 0, 0, 0, 12);
      bx(b, .14, .02, .14, 0xf7f5ee, xm - .2, y + .12, z + .05); bx(b, .14, .14, .02, 0xf7f5ee, xm - .2, y + .2, z - .02); for (const dx of [-.06, .06]) bx(b, .015, .12, .015, 0xf7f5ee, xm - .2 + dx, y + .06, z + .1);
      cy(b, .07, .05, .1, 0xc8784a, x1 - .12, y + .05, z); sp(b, .08, 0x4f9a45, x1 - .12, y + .16, z); },
    noel: (b, x0, x1, y, z) => { const xt = x0 + .22; cy(b, .03, .03, .08, 0x6b4226, xt, y + .04, z); for (let k = 0; k < 3; k++) cn(b, .2 - k * .05, .24, 0x2f6b3a, xt, y + .2 + k * .14, z);
      for (let k = 0; k < 8; k++) { const a = k * 2.2, h = .14 + (k % 4) * .1, r = .17 - (k % 4) * .035; sp(b, .022, pk([0xd8343a, GOLD, 0x5b8fd6, 0xffffff], k), xt + Math.cos(a) * r, y + h, z + Math.sin(a) * r * .6); }
      cn(b, .04, .07, 0xffd23f, xt, y + .6, z, 0, 0, 1); row(xt + .15, x1, .16, (x, i) => { const c = pk([0xd8343a, 0x2f6b3a, 0x5b8fd6, GOLD], i), s = .1 + (i % 2) * .03; bx(b, s, s, s, c, x, y + s / 2, z); bx(b, s + .005, s + .005, .02, light(c, .7), x, y + s / 2, z); bx(b, .02, s + .005, s + .005, light(c, .7), x, y + s / 2, z); }); }
  };
  const GK = ['pain', 'gateau', 'choco', 'fromage', 'glace', 'crepe', 'the', 'epicerie', 'bonbon', 'poisson', 'pharma', 'primeur', 'traiteur', 'cafe', 'livre'], UPS = new Set(GK); // marchandises sur deux étagères
  const EMB = { pain: 0xd39a52, gateau: 0xf2b8c8, choco: 0x5a3420, fromage: 0xf3d36b, glace: 0xfff3d6, crepe: 0xe8b870, the: 0x5b8fd6, epicerie: 0xd8343a, bonbon: 0xff6b8a, poisson: 0x6fa8d0, antique: 0x2f4f9a,
    lustre: GOLD, meuble: 0x8a5a34, tapis: 0x8a2f3a, outil: 0x8f969e, fleur: 0xff6b8a, chapeau: IRON, bijou: GOLD, jouet: 0xd8343a, musique: GOLD, livre: 0x2f4a8a, primeur: 0xd8343a, traiteur: 0xe8c25a, cafe: 0x6b4226,
    mode: 0xc0283a, barbier: 0xd8343a, garage: 0x2a2a2a, jardin: 0x4f9a45, noel: 0xd8343a };

  // =====================================================================
  // 3. La devanture (largeur 3 ou 4 cases, façade vers +z) — nf : étages au-dessus de la boutique
  // =====================================================================
  function devanture(b, o, nf) {
    const w = o.w, W = w - .06, D = 2.6, z0 = -.15, fz = z0 + D / 2, zb = z0 - D / 2, g = 2.35, FH = 1.55, y0 = .14, yg = y0 + g, top = yg + nf * FH;
    const fr = o.front, sg = o.sign || dark(fr, .5), wall = o.wall, roof = o.roof || 0x55607a, tr = light(wall, .3), pat = o.brick ? PT.brique : PT.pierre;
    const fdz = fz + .1, cav = fz - .5, pw = .15, dw = .8, wy0 = y0 + .45, wy1 = y0 + 1.75;
    // socle ; rez-de-chaussée en retrait (la vitrine a de la profondeur) ; étages
    bx(b, W + .12, y0, D + .2, 0xb9a58a, 0, y0 / 2, z0);
    b.P(pat); bx(b, W, g, cav - zb, wall, 0, y0 + g / 2, (zb + cav) / 2); bx(b, W, top - yg, D, wall, 0, (yg + top) / 2, z0); b.P(0);
    // l'intérieur de la vitrine : fond crème, plancher
    bx(b, W - .1, g - .06, .02, 0xf1e2c4, 0, y0 + g / 2, cav + .012); bx(b, W - .1, .02, fdz - cav, 0x9a6a3a, 0, y0 + .01, (cav + fdz) / 2);
    // chaînes d'angle et bandeaux de pierre aux étages
    b.P(PT.pierre); for (const s of [-1, 1]) bx(b, .16, top - yg, .06, tr, s * (W / 2 - .08), (yg + top) / 2, fz + .03);
    for (let i = 0; i < nf; i++) bx(b, W + .1, .08, .14, tr, 0, yg + i * FH + .02, fz + .04); b.P(0);
    // le bâti de bois peint : pilastres à chapiteau, soubassements à panneaux, imposte, bandeau d'enseigne bordé d'or, corniche
    for (const x of [-W / 2 + pw / 2, -dw / 2 - pw / 2, dw / 2 + pw / 2, W / 2 - pw / 2]) { bx(b, pw, g - .1, .14, light(fr, .12), x, y0 + (g - .1) / 2, fdz); bx(b, pw + .06, .1, .18, light(fr, .25), x, y0 + .05, fdz); bx(b, pw + .06, .08, .18, light(fr, .25), x, wy1 + .04, fdz); }
    bx(b, W, yg - wy1, .08, fr, 0, (wy1 + yg) / 2, fdz - .02); bx(b, W - .1, .36, .05, sg, 0, yg - .3, fdz + .045);
    bx(b, W - .2, .022, .06, GOLD, 0, yg - .14, fdz + .06); bx(b, W - .2, .022, .06, GOLD, 0, yg - .46, fdz + .06); bx(b, W + .14, .1, .26, light(fr, .2), 0, yg - .03, fdz + .05);
    for (const s of [-1, 1]) { const a = s * (dw / 2 + pw), c = s * (W / 2 - pw), xm = (a + c) / 2, ww = Math.abs(c - a);
      bx(b, ww, wy0 - y0, .08, dark(fr, .9), xm, (y0 + wy0) / 2, fdz - .02); bx(b, ww - .12, wy0 - y0 - .14, .03, light(fr, .1), xm, (y0 + wy0) / 2, fdz + .03);
      bx(b, ww, .05, .34, 0xc9b38a, xm, wy0 - .025, fdz - .17); // la tablette
      if (UPS.has(o.goods)) bx(b, ww - .04, .02, .3, 0xe8dcc8, xm, wy0 + .43, fdz - .2);
      (GOODS[o.goods] || GOODS.epicerie)(b, xm - ww / 2 + .02, xm + ww / 2 - .02, wy0, fdz - .22);
      bx(b, ww - .1, .03, .03, 0xfff3d0, xm, wy1 - .04, fdz - .08, 0, 1); // la réglette lumineuse
      for (const [dx, dy] of [[-.18, .1], [-.08, .1], [.2, -.25]]) b.geo(new THREE.BoxGeometry(.035, (wy1 - wy0) * .45, .004), 0xffffff, b.M(xm + dx * ww, (wy0 + wy1) / 2 + dy, fdz + .025, 0, 0, -.55), 2); // reflets sur la vitre (le verre lui-même reste invisible : on voit bien la marchandise)
      bx(b, .035, wy1 - wy0, .04, light(fr, .15), xm, (wy0 + wy1) / 2, fdz + .03); bx(b, ww, .035, .04, light(fr, .15), xm, wy1 - .32, fdz + .03); }
    // la porte vitrée : montants, panneau bas, vitre, poignée dorée, pancarte « ouvert », seuil
    for (const s of [-1, 1]) bx(b, .1, wy1 - y0, .06, dark(fr, .85), s * (dw / 2 - .05), (y0 + wy1) / 2, fdz - .02);
    bx(b, dw - .2, .55, .06, dark(fr, .85), 0, y0 + .275, fdz - .02); bx(b, dw - .32, .38, .02, light(fr, .1), 0, y0 + .275, fdz + .015); bx(b, dw - .2, .1, .06, dark(fr, .85), 0, wy1 - .05, fdz - .02);
    bx(b, dw - .2, wy1 - .1 - (y0 + .55), .012, GLASS, 0, (wy1 - .1 + y0 + .55) / 2, fdz - .02, 0, 2);
    sp(b, .032, GOLD, dw / 2 - .14, y0 + .95, fdz + .03); bx(b, .22, .1, .012, 0xf7f5ee, 0, y0 + 1.28, fdz); bx(b, .16, .03, .014, 0xd8343a, 0, y0 + 1.28, fdz + .002);
    bx(b, dw + .2, .06, .35, 0xd9d2c2, 0, y0 + .03, fdz + .2);
    // le store rayé, festonné, sur ses deux bras de fer
    const an = o.awn || [fr, 0xf7f5ee], nA = Math.max(8, Math.round(W / .26)), sw = W / nA; b.S(G.SK ? G.SK.fabric : null); // (de la toile : ni or ni bois, quelle que soit la couleur)
    for (let i = 0; i < nA; i++) { const c = i % 2 ? an[1] : an[0], x = -W / 2 + (i + .5) * sw; b.geo(new THREE.BoxGeometry(sw + .004, .03, .5), c, b.M(x, wy1 - .016, fdz + .275, .35, 0, 0));
      b.add(new THREE.CylinderGeometry(sw / 2, sw / 2, .015, 8, 1, false, -PI / 2, PI), c, b.M(x, wy1 - .1, fdz + .515, PI / 2, 0, 0)); } b.S(null);
    for (const s of [-1, 1]) b.geo(new THREE.BoxGeometry(.016, .016, .5), IRON, b.M(s * (W / 2 - .05), wy1 - .04, fdz + .27, .35, 0, 0));
    // l'enseigne en potence, au coin (la pharmacie a sa croix verte lumineuse)
    const ex = W / 2 - .14, ey = yg + .27; bx(b, .04, .04, .55, IRON, ex, ey + .23, fdz + .3); to(b, .1, .012, IRON, ex, ey + .13, fdz + .12, 0, PI / 2, 0, PI / 2);
    if (o.goods === 'pharma') { bx(b, .05, .14, .4, 0x2fbf6a, ex, ey, fdz + .42, 0, 1); bx(b, .05, .4, .14, 0x2fbf6a, ex, ey, fdz + .42, 0, 1); }
    else { bx(b, .035, .4, .4, sg, ex, ey, fdz + .42); bx(b, .04, .42, .02, GOLD, ex, ey, fdz + .215); bx(b, .04, .42, .02, GOLD, ex, ey, fdz + .625); bx(b, .04, .02, .42, GOLD, ex, ey + .2, fdz + .42); bx(b, .04, .02, .42, GOLD, ex, ey - .2, fdz + .42);
      for (const s of [-1, 1]) sp(b, .1, EMB[o.goods] || GOLD, ex + s * .03, ey, fdz + .42, .3, 1, 1); }
    if (o.pole) { const px = -W / 2 + pw / 2; cy(b, .055, .055, .7, 0xffffff, px, y0 + 1.25, fdz + .15); for (let k = 0; k < 5; k++) { to(b, .056, .012, 0xd8343a, px, y0 + .98 + k * .13, fdz + .15, PI / 2 + .35); to(b, .056, .012, 0x2f4a8a, px, y0 + 1.04 + k * .13, fdz + .15, PI / 2 + .35); }
      sp(b, .06, GOLD, px, y0 + 1.62, fdz + .15); cy(b, .07, .07, .05, GOLD, px, y0 + .88, fdz + .15); }
    // les étages : fenêtres à la française, persiennes, garde-corps de fer forgé, jardinières fleuries
    const nW = w >= 4 ? 3 : 2;
    for (let f = 0; f < nf; f++) { const y = yg + f * FH + FH * .52;
      for (let k = 0; k < nW; k++) { const x = -W / 2 + (k + .5) * W / nW;
        bx(b, .56, .98, .05, CREAM, x, y, fz + .02); bx(b, .46, .88, .04, WIN, x, y, fz + .035, 0, 1); bx(b, .03, .88, .05, CREAM, x, y, fz + .05); bx(b, .46, .03, .05, CREAM, x, y + .15, fz + .05);
        b.P(PT.pierre); bx(b, .66, .07, .1, tr, x, y + .52, fz + .05); b.P(0);
        if (o.shut != null) for (const s of [-1, 1]) { bx(b, .19, .94, .035, o.shut, x + s * .39, y, fz + .04); for (let l = 0; l < 5; l++) bx(b, .17, .015, .045, dark(o.shut, .8), x + s * .39, y - .36 + l * .18, fz + .045); }
        bx(b, .6, .03, .03, IRON, x, y - .2, fz + .2); for (let l = 0; l <= 6; l++) bx(b, .014, .26, .014, IRON, x - .3 + l * .1, y - .33, fz + .2); bx(b, .62, .04, .22, tr, x, y - .47, fz + .1);
        if (f === 0) { bx(b, .46, .1, .1, 0x8a5a34, x, y - .41, fz + .13); for (let l = 0; l < 4; l++) sp(b, .045, pk([0xff6b8a, 0xffd23f, 0xffffff, 0xd8343a, 0xc58aff], l + k + w), x - .16 + l * .107, y - .33, fz + .14); } }
      // à l'arrière aussi (on le voit de la rue d'en face)
      for (let k = 0; k < nW; k++) { const x = -W / 2 + (k + .5) * W / nW; bx(b, .5, .9, .04, CREAM, x, y, zb - .02); bx(b, .4, .8, .03, WIN, x, y, zb - .035, 0, 1); bx(b, .03, .8, .04, CREAM, x, y, zb - .04); } }
    bx(b, .55, 1.5, .04, dark(fr, .8), -W / 4, y0 + .75, zb - .02); bx(b, .5, .7, .04, CREAM, W / 4, y0 + 1.2, zb - .02); bx(b, .4, .6, .03, WIN, W / 4, y0 + 1.2, zb - .035, 0, 1);
    // le toit à la Mansart : brisis d'ardoise, terrasson, lucarnes, souche de cheminée
    b.P(PT.pierre); bx(b, W + .14, .14, D + .16, tr, 0, top + .05, z0); b.P(0);
    const yR = top + .12, mg = new THREE.CylinderGeometry(.5, .7, 1, 4, 1); mg.rotateY(PI / 4);
    b.P(PT.ardoise); b.add(mg, roof, b.M(0, yR + .55, z0, 0, 0, 0, (W + .1) / .99, 1.1, (D + .1) / .99)); G.prism(b, (D + .1) * .714, .32, (W + .1) * .714, roof, 0, yR + 1.1, z0, PI / 2); b.P(0);
    for (const s of [-1, 1]) { const x = s * W / 4; bx(b, .42, .5, .45, tr, x, yR + .42, fz - .12); bx(b, .28, .34, .03, WIN, x, yR + .42, fz + .11, 0, 1); bx(b, .02, .34, .035, CREAM, x, yR + .42, fz + .115); G.prism(b, .52, .2, .5, roof, x, yR + .67, fz - .12); }
    const cc = o.brick ? 0xb5553d : tr; bx(b, .3, .8, .4, cc, W / 2 - .4, yR + 1.0, z0 - .55); bx(b, .36, .06, .46, 0xd9d2c2, W / 2 - .4, yR + 1.42, z0 - .55); for (const dx of [-.06, .06]) cy(b, .04, .04, .14, 0xc8784a, W / 2 - .4 + dx, yR + 1.52, z0 - .55);
  }

  // ---------- le mobilier des boutiques : présentoir à deux étages et rayonnage mural, garnis des produits de la maison ----------
  MD.rb_etal = v => { const k = GK[v % GK.length], b = G.mb(4380 + v), wood = 0x7a4a2a;
    bx(b, 1.94, .8, .58, wood, 0, .4, 0); bx(b, 1.76, .56, .02, light(wood, .2), 0, .42, .3); bx(b, 1.96, .05, .05, GOLD, 0, .76, .3);
    bx(b, 2.0, .05, .64, 0xf3eee6, 0, .845, 0); for (const x of [-.93, .93]) cy(b, .014, .014, .44, 0xc9ccd2, x, 1.09, -.14); bx(b, 1.94, .02, .26, 0xf3eee6, 0, 1.3, -.14);
    GOODS[k](b, -.92, .92, .87, .1, -.14, 1); return b.done(); };
  MD.rb_rayon = v => { const k = GK[v % GK.length], b = G.mb(4360 + v), wood = 0x8a5a34;
    bx(b, 1.96, 1.95, .04, light(wood, .15), 0, .975, -.46); for (const x of [-.97, .97]) bx(b, .05, 1.95, .4, wood, x, .975, -.28); bx(b, 2.02, .08, .44, wood, 0, 1.97, -.27);
    for (const y of [.1, .54, .98, 1.42]) bx(b, 1.9, .03, .38, wood, 0, y - .015, -.27);
    GOODS[k](b, -.92, .92, .1, -.25, -.25, 1); GOODS[k](b, -.92, .92, .98, -.25, -.25, 1); return b.done(); };
  O.rb_etal = { id: 'rb_etal', n: 'Présentoir', model: 'rb_etal', v: 0, fp: [2, 1], h: 1.6 };
  O.rb_rayon = { id: 'rb_rayon', n: 'Rayonnage', model: 'rb_rayon', v: 0, fp: [2, 1], h: 2 };

  // =====================================================================
  // 4. Les trente boutiques
  // =====================================================================
  // k : identifiant · n : nom · lab : étiquette · w : largeur · goods : vitrine · front/sign/awn/wall/shut/roof/brick/pole : façade · R : intérieur [L, P, sol, mur, boiseries]
  // fill(P, X) : meubles (le comptoir est posé tout seul au fond, au milieu ; X.etal / X.rayon : présentoir et rayonnage garnis des produits de la boutique) · who : commerçant [nom, apparence] · hi : bonjours · chat : bavardages
  // q : devise · sells : marchandise · buys : rachète aussi · style : garde-robe [rubriques, prix, titre, bravo]
  const cat = (c, ...more) => () => Object.values(I).filter(i => i.cat === c).map(i => i.id).concat(more);
  const SHOPS = [
    // ---------- côté nord, entre les deux rues transversales : les commerces de bouche ----------
    { k: 'boulangerie', n: 'Boulangerie Au Fournil Doré', lab: '🥖 Boulangerie', w: 4, goods: 'pain', front: 0x7a2f2a, awn: [0xc0392b, 0xf7f0dc], wall: 0xf0e4c8, shut: 0x6f8fa8,
      R: [9, 7, 'terre_cuite', 'briques_creme', 0x7a2f2a], fill: (P, X) => { P('etal_pains', 0, 1, 1); P('etal_pains', 0, 4, 1); P('etal_pains', 8, 1, 3); P('etal_pains', 8, 4, 3); X.rayon(1, 0); X.rayon(6, 0); P('table_bistrot', 2, 5); P('chaise_bistrot', 1, 5, 1); P('table_bistrot', 6, 5); P('chaise_bistrot', 7, 5, 3); P('lustre_lanterne', 4, 4); },
      who: ['Monsieur Mie', { gender: 'g', hair: 'court', hairCol: 0xf2efe6, hat: 'chapeau', hatCol: 0xffffff, top: 'chemise', topCol: 0xffffff, bottom: 'pantalon', botCol: 0x3a3a42, shoe: 'derbies', shoes: 0x2a2a2a, eyes: 'doux', ex: { apron: 0xffffff, moustache: 0xf2efe6 } }],
      hi: ['Bonjour {p} ! Le pain sort à peine du four, tout chaud, tout croustillant !', 'Ah, {p} ! Une baguette bien cuite comme d’habitude ?'],
      chat: ['Je me lève à trois heures du matin pour pétrir. Le secret, c’est le temps… et l’amour.', 'Une baguette, ça se choisit à l’oreille : quand on la presse, elle doit chanter !', 'Les croissants du dimanche partent en dix minutes. Viens tôt !'],
      q: '« Une baguette bien cuite, et la journée commence bien ! »', sells: ['baguette', 'croissant', 'pain_chocolat', 'brioche', 'pain_campagne', 'chausson', 'madeleine', 'tarte'] },
    { k: 'patisserie', n: 'Pâtisserie Douceurs de la Vallée', lab: '🍰 Pâtisserie', w: 3, goods: 'gateau', front: 0xf2a0b8, sign: 0x8a3a5a, awn: [0xf2a0b8, 0xffffff], wall: 0xfaf1e6, shut: 0xf2a0b8,
      R: [8, 7, 'damier_marbre', 'peinture_rose', 0xc06a8a], fill: (P, X) => { X.rayon(0, 0); X.rayon(6, 0); X.etal(0, 2); X.etal(6, 2); P('table_bistrot', 1, 5); P('chaise_bistrot', 0, 5, 1); P('chaise_bistrot', 2, 5, 3); P('table_bistrot', 6, 5); P('chaise_bistrot', 5, 5, 1); P('chaise_bistrot', 7, 5, 3); P('lustre_tulipes', 4, 4); },
      who: ['Mademoiselle Praline', { gender: 'f', hair: 'chignon', hairCol: 0x8a4a2a, top: 'robe', topCol: 0xf2a0b8, shoe: 'ballerines', shoes: 0xffffff, eyes: 'doux', acc: 'noeud_pap', accCol: 0xffffff, lashes: true, ex: { apron: 0xffffff } }],
      hi: ['Bienvenue chez Douceurs, {p} ! Éclairs, macarons, mille-feuilles… tout est fait ce matin !', 'Oh, {p} ! Je viens de sortir un fraisier… il est sublime !'],
      chat: ['Un mille-feuille, c’est des centaines de couches de pâte. Je les ai comptées une fois !', 'Mon rêve ? Une pièce montée aussi haute que le château.', 'Le Paris-Brest a la forme d’une roue de vélo, à cause d’une course cycliste !'],
      q: '« La vie est trop courte pour se priver d’un éclair ! »', sells: ['eclair', 'macaron', 'mille_feuille', 'fraisier', 'tarte_citron', 'paris_brest', 'madeleine', 'tarte'] },
    { k: 'chocolaterie', n: 'Chocolaterie Cacao & Cie', lab: '🍫 Chocolaterie', w: 3, goods: 'choco', front: 0x4a2a1a, awn: [0x6b3f2a, 0xe8c25a], wall: 0xead9c2, shut: 0x6b3f2a,
      R: [8, 7, 'chevrons_noyer', 'lambris', 0x6b3f2a], fill: (P, X) => { P('tapis_savonnerie', 3, 3); X.rayon(0, 0); X.rayon(6, 0); X.rayon(0, 1, 1); X.rayon(7, 1, 3); X.etal(1, 5); X.etal(6, 5); P('gueridon', 1, 6); P('fauteuil_louis', 0, 6, 1); P('lampe', 7, 6); P('lustre_bougies', 4, 4); },
      who: ['Monsieur Cabosse', { gender: 'g', hair: 'meche', hairCol: 0x3a2216, top: 'veste', topCol: 0x6b3f2a, bottom: 'pantalon', botCol: 0x2a1a12, shoe: 'derbies', shoes: 0x2a1a12, eyes: 'rond', acc: 'noeud_pap', accCol: 0xe8c25a, ex: { moustache: 0x3a2216 } }],
      hi: ['Ah, {p} ! Goûte-moi ces truffes… un pur délice de cacao des îles.', 'Bienvenue, {p}. Ici, le chocolat est une affaire sérieuse.'],
      chat: ['Le cacao pousse dans des cabosses, sur des arbres. D’où mon nom !', 'Un bon chocolat doit faire « crac » quand on le casse.', 'Les œufs en chocolat, je les peins à la main, un par un.'],
      q: '« Le chocolat, c’est du bonheur qu’on peut croquer. »', sells: ['tablette_chocolat', 'truffes', 'oeuf_chocolat', 'chocolat_chaud', 'pain_chocolat', 'eclair'] },
    { k: 'fromagerie', n: 'Fromagerie La Meule', lab: '🧀 Fromagerie', w: 4, goods: 'fromage', front: 0x3f6a3a, awn: [0x3f6a3a, 0xf3e6c0], wall: 0xf3ead6, shut: 0x3f6a3a,
      R: [9, 7, 'pierre', 'lambris', 0x3f6a3a], fill: (P, X) => { P('etal_fromages', 0, 1, 1); P('etal_fromages', 0, 4, 1); P('etal_fromages', 8, 1, 3); P('etal_fromages', 8, 4, 3); X.rayon(1, 0); X.rayon(6, 0); P('tonneau', 1, 6); P('caisse', 2, 6); P('tonneau', 7, 6); P('lustre_lanterne', 4, 4); },
      who: ['Madame Tomme', { gender: 'f', hair: 'boucles', hairCol: 0xc0a080, top: 'chemise', topCol: 0x3f6a3a, bottom: 'jupe_longue', botCol: 0x6b4426, shoe: 'bottes', shoes: 0x5a3a24, eyes: 'doux', lashes: true, ex: { apron: 0xf3e6c0 } }],
      hi: ['Bonjour {p} ! Camembert bien fait, comté de dix-huit mois, petit chèvre frais… Qu’est-ce qui te ferait plaisir ?', 'Ça sent bon, hein {p} ? C’est le comté qui chante !'],
      chat: ['Il y a plus de mille fromages en France. J’en ai goûté… presque tous.', 'Le comté vieillit des mois dans des caves fraîches, comme une vieille chanson.', 'Un plateau de fromages, c’est trois laits : vache, chèvre, brebis !'],
      q: '« Un repas sans fromage, c’est une journée sans soleil. »', sells: ['camembert', 'comte', 'chevre', 'roquefort', 'plateau_fromages', 'baguette'] },
    { k: 'primeur', n: 'Primeur Le Verger', lab: '🍎 Primeur', w: 3, goods: 'primeur', front: 0xc0602a, sign: 0x5a2a10, awn: [0xd8343a, 0xfff8ee], wall: 0xf3ead6, shut: 0x4a7a2a,
      R: [9, 7, 'terre_cuite', 'briques', 0x4a7a2a], fill: (P, X) => { P('etal_fruits', 0, 1, 1); P('etal_legumes', 0, 4, 1); P('etal_fruits', 8, 1, 3); P('etal_legumes', 8, 4, 3); X.rayon(1, 0); X.rayon(6, 0); P('caisse', 2, 5); P('caisse', 6, 5); P('lustre_industriel', 4, 4); },
      who: ['Madame Reinette', { gender: 'f', hair: 'queue_basse', hairCol: 0xb5653a, hat: 'chapeau', hatCol: 0xe8d9a8, top: 'chemise', topCol: 0xd8343a, bottom: 'jean', botCol: 0x3d5a8a, shoe: 'bottes', shoes: 0x3a5a3a, eyes: 'brillants', lashes: true, ex: { apron: 0x4a7a2a } }],
      hi: ['Bonjour {p} ! Tout vient des vergers de la vallée, cueilli ce matin !', 'Des fraises, {p} ? Elles sont sucrées comme des bonbons aujourd’hui !'],
      chat: ['Une pomme par jour… et le docteur Camomille s’ennuie !', 'Les tomates, c’est des fruits. Mais chut, ne le dis pas aux légumes.', 'Si tu as des fruits de ton verger, l’épicerie fine te les rachète.'],
      q: '« Ce qui est de saison est toujours meilleur. »', sells: ['pomme', 'orange', 'peche', 'cerise', 'coco', 'fraise', 'raisin', 'poire', 'banane', 'citron', 'pasteque', 'melon', 'ananas', 'carotte', 'tomate', 'salade', 'pomme_de_terre', 'potiron', 'mais', 'avocat', 'champignon'] },
    { k: 'glacier', n: 'Glacier Givré', lab: '🍦 Glacier', w: 3, goods: 'glace', front: 0x5fb8c8, sign: 0x2f6f80, awn: [0x5fb8c8, 0xfff3d6], wall: 0xf6f1e6, shut: 0x5fb8c8,
      R: [8, 7, 'carreaux_menthe', 'vichy_rose', 0x5fb8c8], fill: (P, X) => { X.etal(0, 1); X.etal(6, 1); P('table_bistrot', 1, 4); P('chaise_bistrot', 0, 4, 1); P('chaise_bistrot', 2, 4, 3); P('table_bistrot', 6, 4); P('chaise_bistrot', 5, 4, 1); P('chaise_bistrot', 7, 4, 3); P('plante', 0, 6); P('plante', 7, 6); P('lustre_globe', 4, 3); },
      who: ['Sorbet', { gender: 'g', hair: 'herisse', hairCol: 0xf5f0e0, top: 'tshirt', topCol: 0x5fb8c8, bottom: 'short', botCol: 0xffffff, shoe: 'baskets', shoes: 0xffffff, eyes: 'anime', mouth: 'dent' }],
      hi: ['Yo {p} ! Une petite glace ? Vanille, fraise, citron… ou la grande coupe du chef ?', 'Salut {p} ! Il fait chaud, non ? Enfin… ici il fait toujours frais !'],
      chat: ['Le secret d’un bon sorbet : des fruits bien mûrs et beaucoup de patience.', 'Ma coupe glacée a trois boules, de la chantilly et une cerise. Le paradis !', 'Une fois, j’ai fait une glace au fromage. Madame Tomme a adoré. Personne d’autre.'],
      q: '« Une glace par jour, ça éloigne les soucis ! »', sells: ['glace_vanille', 'glace_fraise', 'sorbet_citron', 'coupe_glacee', 'milkshake', 'limonade'] },
    { k: 'creperie', n: 'Crêperie Ty Breizh', lab: '🥞 Crêperie', w: 3, goods: 'crepe', front: 0x2f4a8a, awn: [0x2f4a8a, 0xffffff], wall: 0xf3eee4, shut: 0x2f4a8a,
      R: [8, 7, 'bois_chene', 'toile_bleue', 0x2f4a8a], fill: (P, X) => { P('cheminee', 0, 0); X.rayon(6, 0); P('table', 1, 4); P('chaise', 0, 4, 1); P('chaise', 2, 4, 3); P('table', 6, 4); P('chaise', 5, 4, 1); P('chaise', 7, 4, 3); P('plante', 0, 6); P('lampe', 7, 6); P('lustre_lanterne', 4, 4); },
      who: ['Maïwenn', { gender: 'f', hair: 'couettes', hairCol: 0xc08a4a, top: 'marin', topCol: 0xf7f5ee, bottom: 'jupe', botCol: 0x1d2a4a, shoe: 'ballerines', shoes: 0x2f4a8a, eyes: 'brillants', lashes: true, ex: { apron: 0x2f4a8a } }],
      hi: ['Demat {p} ! Une crêpe au sucre, au chocolat, ou une bonne galette complète ?', 'Ah, {p} ! La crêpière est bien chaude, assieds-toi !'],
      chat: ['« Demat », ça veut dire bonjour en breton. Kenavo, ça veut dire au revoir !', 'Pour retourner une crêpe en l’air, il faut un coup de poignet… et un peu de chance.', 'La galette, c’est au sarrasin. La crêpe, au froment. Ne les confonds jamais !'],
      q: '« Ici, la crêpe se mange chaude, avec le sourire ! »', sells: ['crepe_sucre', 'crepe_choco', 'galette', 'jus_pomme', 'jus_orange', 'limonade'] },
    { k: 'salon_the', n: 'Salon de thé La Théière', lab: '🍵 Salon de thé', w: 4, goods: 'the', front: 0x7a9a7a, sign: 0x3f5a4a, awn: [0x7a9a7a, 0xf6f1e6], wall: 0xf6efe2, shut: 0x7a9a7a,
      R: [9, 7, 'batons_rompus', 'peinture_sauge', 0x6a8a6a], fill: (P, X) => { X.rayon(0, 0); X.rayon(7, 0); P('percolateur', 7, 1); P('gueridon', 1, 4); P('fauteuil_louis', 0, 4, 1); P('fauteuil_louis', 2, 4, 3); P('gueridon', 7, 4); P('fauteuil_louis', 6, 4, 1); P('fauteuil_louis', 8, 4, 3); P('plante', 0, 6); P('plante', 8, 6); P('lustre_cristal', 4, 4); },
      who: ['Lady Earl', { gender: 'f', hair: 'chignon', hairCol: 0xd8d0c8, hat: 'chapeau', hatCol: 0x7a9a7a, top: 'robe_longue', topCol: 0xf6efe2, shoe: 'ballerines', shoes: 0x7a9a7a, eyes: 'doux', acc: 'collier', lashes: true }],
      hi: ['Bonjour {p}. Un thé ? J’ai du jasmin, du darjeeling et une tisane des Alpes divine.', 'Oh, {p}, quelle joie. Installez-vous, l’eau frémit.'],
      chat: ['Le thé ne doit jamais bouillir : il frémit, comme un secret qu’on garde.', 'Un scone se mange avec la confiture d’abord, puis la crème. Ou l’inverse. On en débat depuis cent ans.', 'À cinq heures précises, je sonne la petite cloche. C’est l’heure du thé !'],
      q: '« L’heure du thé est l’heure la plus douce de la journée. »', sells: ['the', 'tisane', 'chocolat_chaud', 'scones', 'madeleine', 'macaron'] },
    { k: 'traiteur', n: 'Traiteur Le Bon Plat', lab: '🥧 Traiteur', w: 3, goods: 'traiteur', front: 0xe8dcc0, sign: 0x8a3a2a, awn: [0x8a3a2a, 0xf3e2c4], wall: 0xf3eadb, shut: 0x8a3a2a,
      R: [9, 7, 'dalles_ivoire', 'carreaux', 0x8a3a2a], fill: (P, X) => { X.rayon(0, 0); X.rayon(7, 0); X.etal(0, 2); X.etal(7, 2); P('table_nappe', 1, 5); P('chaise_velours', 0, 5, 1); P('table_nappe', 7, 5); P('chaise_velours', 8, 5, 3); P('lustre_tulipes', 4, 4); },
      who: ['Chef Gratin', { gender: 'g', hair: 'raie', hairCol: 0x5a3a22, hat: 'chapeau', hatCol: 0xffffff, top: 'chemise', topCol: 0xffffff, bottom: 'pantalon', botCol: 0x2a2a2a, shoe: 'derbies', shoes: 0x1a1a1a, eyes: 'percants', acc: 'echarpe', accCol: 0xd8343a, ex: { apron: 0xffffff, moustache: 0x5a3a22 } }],
      hi: ['Bonjour {p} ! Quiche, gratin, poulet rôti : des petits plats comme à la maison.', 'Ah, {p} ! Tu tombes bien, le gratin sort du four !'],
      chat: ['Un bon gratin dauphinois, c’est des pommes de terre, de la crème… et c’est tout !', 'La ratatouille se mijote doucement. La cuisine, ça ne se presse pas.', 'Le poulet rôti du dimanche, c’est sacré dans la vallée.'],
      q: '« La bonne cuisine, c’est celle qu’on partage. »', sells: ['quiche', 'croque_monsieur', 'jambon_beurre', 'salade_nicoise', 'ratatouille', 'gratin', 'poulet_roti', 'pizza', 'soupe'] },
    { k: 'torrefacteur', n: 'Brûlerie Grain d’Or', lab: '☕ Torréfacteur', w: 3, goods: 'cafe', front: 0x5a3a22, sign: 0x2a1a10, awn: [0x5a3a22, 0xe8c27a], wall: 0xeee2cc, shut: 0x5a3a22, brick: 1,
      R: [8, 7, 'chevrons_chene', 'briques', 0x5a3a22], fill: (P, X) => { X.rayon(0, 0); X.rayon(6, 0); P('percolateur', 6, 1); P('tonneau', 0, 1); P('tonneau', 0, 2); P('tonneau', 7, 3); P('table_bistrot', 1, 5); P('tabouret', 2, 5); P('table_bistrot', 6, 5); P('tabouret', 5, 5); P('plante', 7, 6); P('lustre_industriel', 4, 4); },
      who: ['Monsieur Arabica', { gender: 'g', hair: 'chignon_h', hairCol: 0x2a1a10, top: 'gilet', topCol: 0x5a3a22, bottom: 'chino', botCol: 0x8a6a46, shoe: 'derbies', shoes: 0x5a3a22, eyes: 'calmes', ex: { beard: 0x2a1a10, apron: 0xc8a878 } }],
      hi: ['Bienvenue à la Brûlerie, {p}. Sens-moi ça… du café torréfié ce matin même.', 'Salut {p}. Un expresso bien serré pour bien commencer ?'],
      chat: ['Le grain de café est vert, au début. C’est la torréfaction qui le rend brun et parfumé.', 'Robusto, au Perchoir, achète tout son café chez moi. Roucou, comme il dit.', 'Un cappuccino, c’est un tiers de café, un tiers de lait, un tiers de mousse.'],
      q: '« Un bon café, c’est un petit voyage dans une tasse. »', sells: ['expresso', 'cappuccino', 'cafe_creme', 'chocolat_chaud', 'the', 'biscuits'] },
    { k: 'confiserie', n: 'Confiserie Sucre d’Orge', lab: '🍭 Confiserie', w: 3, goods: 'bonbon', front: 0xd85a8a, sign: 0x8a2a5a, awn: [0xd85a8a, 0xffffff], wall: 0xfff0f4, shut: 0x6bd0ff,
      R: [8, 7, 'damier_noir', 'coeurs', 0xd85a8a], fill: (P, X) => { P('tapis_savonnerie', 3, 3); X.rayon(0, 0); X.rayon(6, 0); X.rayon(0, 1, 1); X.rayon(7, 1, 3); X.etal(0, 4); X.etal(6, 4); P('pot_fleurs', 0, 6); P('plante', 7, 6); P('lustre_murano', 4, 4); },
      who: ['Berlingot', { gender: 'g', hair: 'decoiffe', hairCol: 0xff8fb8, top: 'salopette', topCol: 0xffffff, botCol: 0xd85a8a, shoe: 'baskets', shoes: 0x6bd0ff, eyes: 'anime', mouth: 'dent' }],
      hi: ['Hiii {p} ! Sucettes, guimauves, bonbons qui piquent… prends-en plein les poches !', 'Coucou {p} ! J’ai inventé un nouveau bonbon… il change de goût trois fois !'],
      chat: ['La barbe à papa, c’est du sucre qui fait de la gymnastique.', 'Le berlingot, c’est un bonbon en forme de pyramide. Comme moi, mais en plus petit.', 'Le nougat, c’est du miel, des amandes et beaucoup de muscles pour le couper !'],
      q: '« Un bonbon, c’est un petit sourire qui fond dans la bouche ! »', sells: ['sucette', 'bonbons', 'guimauve', 'nougat', 'barbe_papa', 'macaron', 'tablette_chocolat'] },
    // ---------- côté nord, après la seconde rue transversale ----------
    { k: 'epicerie', n: 'Épicerie fine Le Panier Gourmand', lab: '🍯 Épicerie fine', w: 3, goods: 'epicerie', front: 0x8a6a2a, sign: 0x4a3a12, awn: [0xe8a23a, 0xf7f0dc], wall: 0xf0e6d0, shut: 0x8a6a2a,
      R: [10, 7, 'parquet_fonce', 'creme', 0x8a6a2a], fill: (P, X) => { P('etal_fruits', 0, 1, 1); P('etal_legumes', 0, 4, 1); X.rayon(9, 1, 3); X.rayon(9, 4, 3); X.rayon(1, 0); X.rayon(7, 0); P('tonneau', 1, 6); P('caisse', 2, 6); P('caisse', 8, 6); P('lustre_lanterne', 5, 4); },
      who: ['Monsieur Bocal', { gender: 'g', hair: 'chauve', hairCol: 0xe0d8c8, top: 'chemise', topCol: 0xf7f0dc, bottom: 'pantalon', botCol: 0x5a4a2a, shoe: 'derbies', shoes: 0x3a2a1a, eyes: 'rond', acc: 'lunettes', ex: { apron: 0x8a6a2a, moustache: 0x8a7a6a } }],
      hi: ['Bienvenue au Panier Gourmand, {p} ! Miel de la vallée, confitures maison… et je rachète tes récoltes !', 'Bonjour {p} ! Tu as des fruits ou des poissons à vendre ? Je suis preneur !'],
      chat: ['Mon miel vient des ruches du verger. Les abeilles adorent les cerisiers en fleurs.', 'Une bonne confiture, c’est autant de fruits que de sucre. Et un peu de patience.', 'Je rachète tout ce que la vallée produit : fruits, poissons, coquillages…'],
      q: '« Ce qui est bon vient de la terre, et de la patience. »', buys: true, sells: ['miel', 'confiture', 'biscuits', 'noix', 'jus_orange', 'jus_pomme', 'limonade', 'pomme', 'orange', 'peche', 'cerise', 'coco'] },
    { k: 'poissonnerie', n: 'Poissonnerie La Marée', lab: '🐟 Poissonnerie', w: 3, goods: 'poisson', front: 0x2f6f9a, awn: [0x2f6f9a, 0xffffff], wall: 0xeef2f4, shut: 0x2f6f9a,
      R: [8, 7, 'carrelage', 'coquillages', 0x2f6f9a], fill: P => { P('etal_poissons', 0, 1, 1); P('etal_poissons', 0, 4, 1); P('etal_poissons', 7, 1, 3); P('etal_poissons', 7, 4, 3); P('aquarium', 1, 6); P('tonneau', 6, 6); P('caisse', 7, 6); P('lustre_industriel', 4, 4); },
      who: ['Capitaine Merlu', { gender: 'g', hair: 'court', hairCol: 0x8a8a8a, hat: 'capitaine', top: 'pull', topCol: 0x2f6f9a, bottom: 'pantalon', botCol: 0x1d2a4a, shoe: 'bottes', shoes: 0xf3d36b, eyes: 'brillants', ex: { apron: 0xf7f5ee, beard: 0x8a8a8a } }],
      hi: ['Ohé {p} ! Arrivage du matin ! Et si tu as pêché quelque chose, je te le rachète au bon prix.', 'Ah, moussaillon {p} ! La marée a été bonne aujourd’hui !'],
      chat: ['Un poisson frais a l’œil brillant et sent la mer, pas le poisson !', 'J’ai navigué sur les sept mers. Maintenant je navigue entre mes étals.', 'Les huîtres, c’est meilleur les mois en « r ». Septembre, octobre…'],
      q: '« Le poisson, c’est frais du matin ou c’est rien ! »', buys: true, sells: ['plateau_mer', 'huitres', 'crevettes', 'saumon', 'crabe', 'poisson_grille', 'citron'] },
    { k: 'fleuriste', n: 'Fleuriste Pétales', lab: '💐 Fleuriste', w: 3, goods: 'fleur', front: 0x7a5a9a, sign: 0x4a2f6a, awn: [0x7a5a9a, 0xf7f0dc], wall: 0xf6f1e6, shut: 0x5a8a4a,
      R: [8, 7, 'terre_cuite', 'feuillage_doux', 0x5a8a4a], fill: P => { P('pot_fleurs', 0, 0); P('pot_fleurs', 1, 0); P('pot_fleurs', 6, 0); P('pot_fleurs', 7, 0); P('plante', 0, 2); P('plante', 7, 2); P('stand_fleurs', 0, 4, 1); P('etal_fleurs', 7, 4, 3); P('pot_fleurs', 2, 6); P('pot_fleurs', 6, 6); P('lustre_tulipes', 4, 4); },
      who: ['Pervenche', { gender: 'f', hair: 'long', hairCol: 0xf3b6d0, hat: 'fleur', hatCol: 0xff6b8a, top: 'robe_ete', topCol: 0x5a8a4a, shoe: 'ballerines', shoes: 0xf3b6d0, eyes: 'doux', lashes: true, ex: { apron: 0xf7f0dc } }],
      hi: ['Bonjour {p} ! Tulipes, roses, hortensias, plantes vertes… un bouquet pour quelqu’un de spécial ?', 'Oh, {p} ! Sens ces roses… elles sont arrivées ce matin.'],
      chat: ['Le langage des fleurs : la rose rouge dit « je t’aime », la jaune dit « on reste amis ».', 'Si tu plantes deux fleurs côte à côte, il peut en pousser une nouvelle couleur !', 'Les tulipes continuent de grandir dans le vase. Elles sont têtues.'],
      q: '« Une fleur, c’est un sourire qui pousse. »', sells: cat('fleurs', 'pot_fleurs', 'plante', 'hortensia', 'hibiscus') },
    { k: 'pharmacie', n: 'Pharmacie La Croix Verte', lab: '⚕️ Pharmacie', w: 3, goods: 'pharma', front: 0x2f8a5a, sign: 0x1a4a30, awn: [0x2f8a5a, 0xffffff], wall: 0xf6f6f2, shut: 0x2f8a5a,
      R: [8, 7, 'carrelage', 'menthe', 0x2f8a5a], fill: (P, X) => { X.rayon(0, 0); X.rayon(6, 0); X.rayon(0, 1, 1); X.rayon(7, 1, 3); P('casiers', 1, 6); P('banc', 5, 6); P('plante', 7, 4); P('lustre_globe', 4, 4); },
      who: ['Docteur Camomille', { gender: 'f', hair: 'queue', hairCol: 0x6b4426, top: 'blouse', topCol: 0xffffff, bottom: 'pantalon', botCol: 0x2f8a5a, shoe: 'baskets', shoes: 0xffffff, eyes: 'doux', acc: 'lunettes', lashes: true }],
      hi: ['Bonjour {p} ! Une petite fatigue ? Mon sirop vous remet sur pied en un clin d’œil.', 'Ah, {p}. Bien dormi ? Bien mangé ? Bien arrosé tes fleurs ?'],
      chat: ['En mode Survie, le sirop redonne beaucoup de vie. Gardez-en toujours un sur vous !', 'La camomille calme, la menthe réveille, le miel adoucit la gorge.', 'Le meilleur médicament ? Une promenade au bord de la mer.'],
      q: '« Prenez soin de vous : vous êtes précieux. »', sells: ['sirop', 'vitamines', 'pastilles', 'tisane', 'miel', 'jus_orange'] },
    // ---------- côté sud : la maison, la mode, les loisirs ----------
    { k: 'antiquaire', n: 'Antiquaire Le Grenier du Roi', lab: '🏺 Antiquaire', w: 4, goods: 'antique', front: 0x5a2420, sign: 0x2a100e, awn: [0x5a2420, 0xd9b84a], wall: 0xe6dcc8, shut: 0x2f3a4a,
      R: [10, 8, 'chevrons_chene', 'peinture_empire', 0xc9a23a], fill: P => { P('tapis_savonnerie', 4, 3); P('armure', 0, 0); P('cheminee_marbre', 1, 0); P('miroir', 8, 0); P('horloge', 9, 0); P('vase_chine', 0, 2); P('buste', 9, 2); P('gueridon', 2, 4); P('fauteuil_louis', 1, 4, 1); P('globe_terrestre', 8, 4); P('console_doree', 7, 6); P('coffre', 1, 7); P('statue_antique', 9, 7); P('lustre_versailles', 5, 4); },
      who: ['Monsieur Chiné', { gender: 'g', hair: 'meche', hairCol: 0xb8bcc2, top: 'costume', topCol: 0x4a3a5a, bottom: 'pantalon', botCol: 0x2a2030, shoe: 'derbies', shoes: 0x1a1a1a, eyes: 'endormis', acc: 'lunettes', ex: { moustache: 0xb8bcc2 } }],
      hi: ['Bienvenue au Grenier du Roi, {p}. Chaque pièce a appartenu à un château… ou presque.', 'Ah, {p}. Vous avez l’œil, je le sens. Regardez cette console dorée…'],
      chat: ['Ce lit à baldaquin aurait servi à une marquise. Elle ronflait, paraît-il.', 'Un vrai meuble ancien a des petits trous de vers. Ça prouve qu’il a vécu.', 'Tout ce que je vends ira à merveille dans un château à la française.'],
      q: '« Le temps donne aux belles choses une âme. »', sells: ['cheminee_marbre', 'console_doree', 'lit_baldaquin', 'fauteuil_louis', 'gueridon', 'buste', 'statue_antique', 'vase_chine', 'globe_terrestre', 'billard', 'harpe', 'clavecin', 'armure', 'autel', 'trone', 'horloge', 'coffre', 'miroir', 'boule_cristal', 'tapis_savonnerie', 'tableau_art_0', 'tableau_art_1', 'tableau_art_2', 'tableau_art_3'] },
    { k: 'luminaires', n: 'Lumière & Lustres', lab: '💡 Luminaires', w: 4, goods: 'lustre', front: 0x1f2a3a, awn: [0x1f2a3a, 0xe9c46a], wall: 0xf0e8d8, shut: 0x1f2a3a,
      R: [9, 7, 'damier_marbre', 'nuits_lilas', 0xe9c46a], fill: P => { P('lampe', 0, 0); P('lampe', 8, 0); P('torchere', 0, 3); P('lampe_arc', 8, 3); P('lampe_arc', 0, 6); P('torchere', 8, 6); P('lustre_cristal', 2, 2); P('lustre_versailles', 6, 2); P('lustre_murano', 2, 5); P('lustre_tulipes', 6, 5); P('lustre_globe', 4, 4); P('lustre_cascade', 4, 2); },
      who: ['Madame Lueur', { gender: 'f', hair: 'ondule', hairCol: 0xf3d36b, top: 'robe', topCol: 0x1f2a3a, shoe: 'ballerines', shoes: 0xe9c46a, eyes: 'brillants', acc: 'boucles', lashes: true }],
      hi: ['Bonsoir {p}… enfin, bonjour ! Ici il fait toujours un peu soir : c’est plus joli pour les lustres.', 'Entrez, {p}, entrez dans la lumière !'],
      chat: ['Un lustre de cristal, c’est des centaines de petits arcs-en-ciel.', 'Le lustre Versailles a cent bougies. Enfin, cent petites ampoules, rassurez-vous.', 'Un château sans lustres, c’est un château qui s’ennuie.'],
      q: '« Une maison sans lumière, c’est un jardin sans fleurs. »', sells: cat('lustres', 'lampe', 'lampe_arc', 'lampadaire', 'lanterne', 'lanterne_pierre', 'torchere', 'guirlande_guinguette', 'guirlande_lampions', 'guirlande_etoiles') },
    { k: 'ameublement', n: 'Ameublement Maison Douce', lab: '🛋️ Ameublement', w: 4, goods: 'meuble', front: 0x6b4426, sign: 0x3a2416, awn: [0x6b4426, 0xf3e2c4], wall: 0xf3ebdc, shut: 0x6b4426,
      R: [10, 8, 'bois_clair', 'lambris_ivoire', 0x6b4426], fill: P => { P('bibliotheque', 0, 0); P('commode_fleurie', 1, 0); P('armoire', 9, 0); P('canape_velours', 1, 3); P('table_basse', 1, 4); P('fauteuil_nuage', 3, 4, 3); P('lit_fleuri', 7, 4); P('table_noyer', 8, 2); P('chaise_louis', 7, 2, 1); P('lampe_arc', 0, 7); P('plante', 9, 7); P('lustre_globe', 5, 4); },
      who: ['Monsieur Rabot', { gender: 'g', hair: 'garconne', hairCol: 0x6b4426, top: 'chemise', topCol: 0xf3e2c4, bottom: 'chino', botCol: 0x4a3a2a, shoe: 'derbies', shoes: 0x3a2a1a, eyes: 'doux', acc: 'cravate', accCol: 0x6b4426, ex: { beard: 0x6b4426 } }],
      hi: ['Bonjour {p} ! Canapés moelleux, tables en noyer, lits fleuris : tout pour une maison douce.', 'Ah, {p} ! Assieds-toi sur ce canapé… tu ne voudras plus te relever !'],
      chat: ['Un bon meuble se transmet de génération en génération.', 'Mets deux tables côte à côte chez toi : elles se rejoignent en une grande table !', 'Le noyer, c’est le plus beau des bois. Doux et solide à la fois.'],
      q: '« Un bon meuble, c’est pour la vie. »', sells: cat('assises', 'armoire', 'bibliotheque', 'commode_fleurie', 'lit', 'lit_fleuri', 'bureau', 'bureau_ecritoire', 'etagere', 'meuble_tv', 'tv', 'paravent', 'fauteuil_nuage', 'coffre', 'miroir', 'plante') },
    { k: 'tapissier', n: 'Papiers & Parquets', lab: '🧶 Sols & Tapis', w: 3, goods: 'tapis', front: 0x8a2f3a, sign: 0x4a1a1e, awn: [0x8a2f3a, 0xe9d9b0], wall: 0xf3ead6, shut: 0x8a2f3a,
      R: [8, 7, 'chevrons', 'fleurs_cottage', 0x8a2f3a], fill: P => { P('tapis_savonnerie', 0, 3); P('tapis_savonnerie', 5, 3); P('rayon', 0, 0); P('rayon', 6, 0); P('pot_fleurs', 0, 6); P('plante', 7, 6); P('lustre_tulipes', 4, 4); },
      who: ['Madame Lé', { gender: 'f', hair: 'carre', hairCol: 0x2a2630, top: 'cardigan', topCol: 0x8a2f3a, bottom: 'jupe_plissee', botCol: 0x2a2630, shoe: 'ballerines', shoes: 0x2a2630, eyes: 'anime', acc: 'lunettes', lashes: true }],
      hi: ['Bonjour {p} ! Parquets, dallages, tapis de la Savonnerie… on refait ton sol ?', 'Ah, {p} ! Regarde ce tapis : chaque fleur est nouée à la main.'],
      chat: ['La Savonnerie, c’était la manufacture des tapis du roi. Rien que ça !', 'Le parquet en chevrons, c’est le plus chic. Le point de Hongrie aussi.', 'Un beau tapis réchauffe une pièce en hiver et la décore toute l’année.'],
      q: '« Un beau sol, et toute la pièce change d’allure. »', sells: cat('sols', 'tapis', 'tapis_savonnerie') },
    { k: 'quincaillerie', n: 'Quincaillerie Le Clou d’Or', lab: '🔨 Quincaillerie', w: 4, goods: 'outil', front: 0x4a5a6a, sign: 0x2a3440, awn: [0xd88a2a, 0x2a3440], wall: 0xe8e0d0, shut: 0x4a5a6a, brick: 1,
      R: [10, 7, 'pierre', 'briques', 0xd88a2a], fill: P => { P('rayon', 0, 0); P('rayon', 2, 0); P('rayon', 7, 0); P('etabli', 0, 4, 1); P('rayon', 9, 3, 3); P('tonneau', 9, 0); P('lanterne', 0, 2); P('tonneau', 1, 6); P('caisse', 8, 6); P('caisse', 9, 6); P('lustre_industriel', 5, 4); },
      who: ['Monsieur Boulon', { gender: 'g', hair: 'decoiffe', hairCol: 0x8a5a34, hat: 'casquette', hatCol: 0xd88a2a, top: 'salopette', topCol: 0xf3ead2, botCol: 0x3d5a8a, shoe: 'bottes', shoes: 0x3a3a3a, eyes: 'rond', ex: { beard: 0x8a5a34 } }],
      hi: ['Salut {p} ! Outils, clôtures, escaliers, ponts, ferronnerie : tout pour construire !', 'Ah, {p} ! Il te manque un clou ? J’en ai trois millions.'],
      chat: ['Un pont de pierre sur la rivière, et ton île change de visage.', 'Les escaliers de fer forgé, c’est parfait pour monter sur les toits.', 'Un bon outil, ça s’entretient : un coup de chiffon après chaque usage !'],
      q: '« Un bon outil, c’est la moitié du travail. »', sells: () => Object.values(I).filter(i => i.cat === 'outils' || i.cat === 'clotures').map(i => i.id).concat(['escalier_pierre', 'escalier_pierre_long', 'escalier_granit', 'escalier_granit_long', 'plateforme_fer', 'plateforme_fer_susp', 'escalier_fer', 'escalier_fer_long', 'pont_bois', 'pont_rondins', 'pont_pierre', 'pont_brique', 'pont_suspendu', 'pont_zen', 'pont_rouge', 'pont_moderne', 'pont_conte', 'etabli', 'planches', 'tonneau', 'caisse', 'boite_lettres', 'panneau']) },
    { k: 'chapellerie', n: 'Chapellerie Le Haut-de-Forme', lab: '🎩 Chapellerie', w: 3, goods: 'chapeau', front: 0x6f7680, sign: 0x2a2030, awn: [0x2a2030, 0xe9e4da], wall: 0xece4d6, shut: 0x2a2030, style: [['chapeau'], 250, 'Chapellerie Le Haut-de-Forme', 'Quelle allure ! 🎩'],
      R: [8, 7, 'moquette', 'peinture_nuit', 0xc9a23a], fill: P => { P('mannequin', 0, 0, 0, { v: 0 }); P('mannequin', 1, 0, 0, { v: 1 }); P('mannequin', 6, 0, 0, { v: 2 }); P('mannequin', 7, 0, 0, { v: 3 }); P('miroir', 0, 4, 1); P('miroir', 7, 4, 3); P('fauteuil_louis', 1, 5, 1); P('pot_fleurs', 7, 6); P('plante', 0, 6); P('lustre_cristal', 4, 4); },
      who: ['Monsieur Feutre', { gender: 'g', hair: 'court', hairCol: 0x2a2630, hat: 'haut_forme', hatCol: 0x2a2030, top: 'costume', topCol: 0x2a2030, bottom: 'pantalon', botCol: 0x15101a, shoe: 'derbies', shoes: 0x1a1a1a, eyes: 'rond', acc: 'noeud_pap', accCol: 0xc9a23a, ex: { moustache: 0x2a2630 } }],
      hi: ['Bonjour {p}. Un haut-de-forme, un canotier, un béret… La tête mérite ce qu’il y a de mieux.', 'Ah, {p} ! Votre tête me dit qu’elle a besoin d’un nouveau chapeau.'],
      chat: ['Un gentleman soulève son chapeau pour dire bonjour. Essayez, c’est charmant.', 'Le béret se porte un peu penché. Jamais tout droit, malheureux !', 'Mon haut-de-forme a cent ans. Il était à mon grand-père.'], q: '' },
    { k: 'bijouterie', n: 'Bijouterie-Optique Éclat', lab: '💍 Bijouterie', w: 3, goods: 'bijou', front: 0x1f3a5a, sign: 0x10203a, awn: [0x1f3a5a, 0xe9c46a], wall: 0xf3eee4, shut: 0x1f3a5a, style: [['acc'], 300, 'Bijouterie-Optique Éclat', 'Ça brille ! ✨'],
      R: [8, 7, 'marbre', 'peinture_bleu', 0xe9c46a], fill: P => { P('tapis_savonnerie', 3, 3); P('vitrine', 0, 3); P('vitrine', 1, 3); P('vitrine', 6, 3); P('vitrine', 7, 3); P('miroir', 0, 0); P('buste', 7, 0); P('plante', 0, 6); P('plante', 7, 6); P('lustre_cristal', 4, 5); },
      who: ['Madame Carat', { gender: 'f', hair: 'carre', hairCol: 0xe8e0d0, top: 'robe', topCol: 0x1f3a5a, shoe: 'ballerines', shoes: 0xe9c46a, eyes: 'brillants', acc: 'collier', lashes: true }],
      hi: ['Bienvenue chez Éclat, {p}. Lunettes, colliers, nœuds papillon… de quoi briller de mille feux.', 'Oh, {p} ! Ces lunettes vous iraient à ravir.'],
      chat: ['Les perles naissent dans les huîtres. Le Capitaine Merlu en a trouvé une, une fois !', 'De bonnes lunettes, et le monde devient tout de suite plus net… et plus joli.', 'Un nœud papillon bien noué, c’est la classe absolue.'], q: '' },
    { k: 'mode', n: 'Mode Le Chic Parisien', lab: '👗 Mode', w: 4, goods: 'mode', front: 0x1a1a1a, sign: 0x0a0a0a, awn: [0x1a1a1a, 0xffffff], wall: 0xf6f2ea, shut: 0x1a1a1a, style: [['haut', 'bas'], 300, 'Mode Le Chic Parisien', 'Trop chic ! 👗'],
      R: [9, 7, 'parquet', 'peinture_ivoire', 0x1a1a1a], fill: P => { P('mannequin', 0, 0, 0, { v: 0 }); P('mannequin', 1, 0, 0, { v: 1 }); P('mannequin', 7, 0, 0, { v: 2 }); P('mannequin', 8, 0, 0, { v: 3 }); P('rayon_chaussures', 0, 3, 1); P('miroir', 8, 3, 3); P('paravent', 7, 5); P('fauteuil_nuage', 1, 6); P('lustre_globe', 4, 4); },
      who: ['Mademoiselle Chiffon', { gender: 'f', hair: 'long_lisse', hairCol: 0x1a1a1a, top: 'cardigan', topCol: 0xf6f2ea, bottom: 'jupe_plissee', botCol: 0x1a1a1a, shoe: 'ballerines', shoes: 0x1a1a1a, eyes: 'percants', acc: 'collier', lashes: true }],
      hi: ['Bonjour {p} ! La nouvelle collection est arrivée. On essaie ?', 'Oh là là, {p}… il faut absolument qu’on parle de ta tenue.'],
      chat: ['La petite robe noire va avec tout. C’est la règle numéro un.', 'La mode se démode, le style jamais.', 'La cabine d’essayage est derrière le paravent. Prends ton temps !'], q: '' },
    { k: 'barbier', n: 'Barbier Le Blaireau', lab: '💈 Barbier', w: 3, goods: 'barbier', front: 0x2a3a2a, sign: 0x15201a, awn: [0xd8343a, 0xffffff], wall: 0xece6da, shut: 0x2a3a2a, pole: 1, style: [['cheveux', 'visage'], 250, 'Barbier Le Blaireau', 'Impeccable ! 💈'],
      R: [8, 7, 'damier_noir', 'carreaux', 0x2a3a2a], fill: P => { P('miroir', 0, 0); P('miroir', 7, 0); P('fauteuil_coif', 0, 1, 2); P('fauteuil_coif', 7, 1, 2); P('plante', 0, 3); P('percolateur', 7, 3); P('banc', 1, 6); P('plante', 7, 6); P('lustre_industriel', 4, 4); },
      who: ['Monsieur Blaireau', { gender: 'g', hair: 'banane', hairCol: 0x1a1a1a, top: 'chemise', topCol: 0xffffff, bottom: 'pantalon', botCol: 0x2a2a2a, shoe: 'derbies', shoes: 0x1a1a1a, eyes: 'fins', acc: 'noeud_pap', accCol: 0xd8343a, ex: { beard: 0x1a1a1a, apron: 0x2a3a2a } }],
      hi: ['Bonjour {p} ! Une coupe, une barbe bien taillée ? Installe-toi dans le fauteuil.', 'Ah, {p} ! Ça pousse, ça pousse… il est temps de passer chez le barbier !'],
      chat: ['Le poteau rouge et bleu devant la boutique, c’est le signe des barbiers depuis toujours.', 'Une moustache, ça se brosse tous les matins. Comme un petit chat.', 'Le blaireau, c’est le pinceau pour la mousse à raser. D’où le nom !'], q: '' },
    { k: 'jouets', n: 'Jouets Le Coffre Enchanté', lab: '🧸 Jouets', w: 4, goods: 'jouet', front: 0xd8343a, sign: 0x8a1a1e, awn: [0xffd23f, 0xd8343a], wall: 0xfff4e0, shut: 0x2f6fb8,
      R: [10, 7, 'nuages_sol', 'etoiles', 0xd8343a], fill: P => { P('maquette', 0, 0, 0, { v: 0 }); P('rayon', 1, 0); P('rayon', 7, 0); P('maquette', 9, 0, 0, { v: 1 }); P('aquarium', 0, 3, 1); P('scene_club', 7, 4); P('cheval', 1, 6); P('skate', 3, 5); P('plante', 9, 6); P('lustre_globe', 5, 4); },
      who: ['Gribouille', { gender: 'g', hair: 'herisse', hairCol: 0xf08a3c, top: 'hoodie', topCol: 0xffd23f, bottom: 'short', botCol: 0x2f6fb8, shoe: 'baskets', shoes: 0xd8343a, eyes: 'anime', mouth: 'dent' }],
      hi: ['Wouhou, {p} ! Skates, petites voitures, cheval à bascule… on s’amuse !', 'Salut {p} ! Tu veux voir mon nouveau tour de skate ? Non ? Bon, tu veux acheter un jouet alors !'],
      chat: ['Le meilleur jouet du monde ? Un carton vide. Mais chut, ça ne se vend pas.', 'La balançoire, c’est pour le jardin. Les grands aussi ont le droit !', 'Une petite scène chez toi, et tu peux faire des spectacles pour tes voisins.'],
      q: '« Grandir, oui, mais jamais trop ! »', sells: ['skate', 'cheval', 'balancoire', 'aquarium', 'maquette', 'scene_club', 'bonhomme_neige', 'manche_air', 'boule_cristal', 'guirlande_fanions', 'piquet_guirlande'] },
    { k: 'garage', n: 'Garage Vroum', lab: '🚲 Garage', w: 4, goods: 'garage', front: 0x2f4a6a, sign: 0x1a2a3a, awn: [0xd8343a, 0xf3f3f3], wall: 0xe8e6e0, shut: 0x2f4a6a, brick: 1,
      R: [10, 7, 'pierre', 'briques', 0xd8343a], fill: P => { P('etabli', 0, 0); P('tonneau', 9, 0); P('caisse', 8, 0); P('voiturette', 0, 3); P('moto', 8, 3); P('velo', 8, 5); P('tonneau', 0, 6); P('lustre_industriel', 5, 4); },
      who: ['Monsieur Piston', { gender: 'g', hair: 'brosse', hairCol: 0x3a2a20, hat: 'casquette', hatCol: 0x2f4a6a, top: 'salopette', topCol: 0xf3f3f3, botCol: 0x2f4a6a, shoe: 'bottes', shoes: 0x2a2a2a, eyes: 'percants', ex: { moustache: 0x3a2a20 } }],
      hi: ['Salut {p} ! Vélo, moto, voiturette, hélico… tout ce qui roule, vole ou flotte !', 'Ah, {p} ! Le moteur ronronne ? Sinon, je m’en occupe.'],
      chat: ['Le vélo, c’est le meilleur moyen de visiter la vallée. Et ça ne pollue pas !', 'Avec le jet-ski, fais attention aux dauphins. Ils adorent faire la course.', 'Une montgolfière, c’est lent, mais quelle vue sur ton village !'],
      q: '« Ça roule, ma poule ! »', sells: ['velo', 'moto', 'voiturette', 'skate', 'cheval', 'jetski', 'helico', 'avion', 'montgolfiere'] },
    { k: 'musique', n: 'Musique Do Ré Mi', lab: '🎻 Musique', w: 4, goods: 'musique', front: 0x5b3f8f, sign: 0x2f1f4f, awn: [0x5b3f8f, 0xffd23f], wall: 0xf3eee8, shut: 0x5b3f8f,
      R: [9, 7, 'chevrons_noyer', 'peinture_empire', 0x5b3f8f], fill: P => { P('piano_droit', 0, 0); P('harpe', 8, 0); P('clavecin', 0, 4, 1); P('tabouret', 1, 4); P('scene_club', 6, 4); P('lampe', 8, 3); P('plante', 0, 6); P('lustre_bougies', 4, 4); },
      who: ['Madame Croche', { gender: 'f', hair: 'ondule', hairCol: 0x4a3a6e, top: 'robe_longue', topCol: 0x5b3f8f, shoe: 'ballerines', shoes: 0x2a1a3a, eyes: 'doux', acc: 'echarpe', accCol: 0xffd23f, lashes: true }],
      hi: ['Do, ré, mi… bonjour {p} ! Un piano, une harpe ? La musique adoucit les mœurs.', 'Chut… écoute, {p}. Ce clavecin a trois cents ans de musique dans le ventre.'],
      chat: ['Une croche, c’est une note qui court. Une ronde, une note qui se promène.', 'Pose un piano chez toi et joue-en : tes voisins viendront t’écouter.', 'La harpe a 47 cordes. Je les accorde chaque matin, en chantant.'],
      q: '« Là où les mots s’arrêtent, la musique commence. »', sells: ['piano_droit', 'harpe', 'clavecin', 'scene_club', 'tabouret', 'boule_cristal'] },
    { k: 'librairie', n: 'Librairie Au Fil des Pages', lab: '📚 Librairie', w: 4, goods: 'livre', front: 0x2f4a3a, sign: 0x1a2a20, awn: [0x2f4a3a, 0xf3e6c0], wall: 0xefe6d4, shut: 0x2f4a3a,
      R: [10, 7, 'parquet', 'bibliotheque', 0x2f4a3a], fill: P => { for (const x of [0, 1, 2, 7, 8, 9]) P('bibliotheque', x, 0); for (const z of [2, 3]) { P('bibliotheque', 0, z); P('bibliotheque', 9, z); } P('bureau_ecritoire', 6, 3); P('fauteuil_louis', 2, 5, 1); P('gueridon', 3, 5); P('globe_terrestre', 8, 5); P('lampe_arc', 9, 6); P('lustre_bougies', 5, 4); },
      who: ['Monsieur Marque-Page', { gender: 'g', hair: 'chauve', hairCol: 0xd8dce2, top: 'pull', topCol: 0x2f4a3a, bottom: 'pantalon', botCol: 0x4a3a2a, shoe: 'derbies', shoes: 0x3a2a1a, eyes: 'endormis', acc: 'lunettes', ex: { beard: 0xd8dce2 } }],
      hi: ['Chut… bonjour {p}. Des livres, des globes, des bureaux d’écrivain : prends ton temps.', 'Ah, {p}. Je lisais une histoire de pirates… elle finit bien, je crois.'],
      chat: ['Un livre est une porte. On l’ouvre, et on part ailleurs.', 'Le Professeur Plume vient ici chaque semaine. Il lit tout sur les fossiles.', 'Le globe terrestre de la vitrine tourne. Pose ton doigt au hasard… et rêve.'],
      q: '« Un livre est un jardin qu’on emporte dans sa poche. »', sells: ['bibliotheque', 'bureau_ecritoire', 'bureau', 'globe_terrestre', 'lampe', 'lampe_arc', 'horloge', 'boule_cristal', 'tableau', 'tableau_art_4', 'tableau_art_5', 'tableau_art_6', 'tableau_art_7'] },
    { k: 'terrasse', n: 'Jardin & Terrasse', lab: '⛱️ Jardin & Terrasse', w: 4, goods: 'jardin', front: 0xb8643a, sign: 0x5a2a14, awn: [0x4f7a5a, 0xf3f0e6], wall: 0xf3eee2, shut: 0x4f7a5a,
      R: [9, 7, 'terre_cuite', 'jungle', 0x4f7a5a], fill: P => { P('statue', 0, 0); P('pot_fleurs', 1, 0); P('pot_fleurs', 7, 0); P('fontaine', 7, 4); P('parasol', 1, 3); P('table_jardin', 1, 4); P('chaise_jardin', 0, 4, 1); P('chaise_jardin', 2, 4, 3); P('transat', 8, 2); P('banc_parc', 5, 6); P('lanterne_pierre', 8, 6); P('plante', 0, 6); P('lustre_lanterne', 4, 3); },
      who: ['Madame Glycine', { gender: 'f', hair: 'tresse_cote', hairCol: 0xa07ac0, hat: 'chapeau', hatCol: 0xf3e2c4, top: 'chemise', topCol: 0x4f7a5a, bottom: 'jean', botCol: 0x3d5a8a, shoe: 'bottes', shoes: 0x3a5a3a, eyes: 'doux', lashes: true, ex: { apron: 0xc8a06a } }],
      hi: ['Bonjour {p} ! Parasols, salons de jardin, fontaines : le dehors aussi mérite d’être beau.', 'Ah, {p} ! Il fait beau, non ? Parfait pour un transat.'],
      chat: ['Une fontaine dans le jardin, et les oiseaux viennent chanter.', 'Les lanternes de pierre, le soir, c’est magique au bord de l’eau.', 'Mets un banc sous un cerisier. Au printemps, c’est le plus bel endroit du monde.'],
      q: '« Un jardin, c’est un salon à ciel ouvert. »', sells: ['parasol', 'transat', 'table_jardin', 'chaise_jardin', 'chaise_rotin', 'table_pique', 'banc_parc', 'banc_pierre', 'banc_blanc', 'banc_bambou', 'banc_rondin', 'banc_coussins', 'banc_fer', 'fontaine', 'puits', 'statue', 'lanterne_pierre', 'balancoire', 'epouvantail', 'moulin', 'feu_camp', 'guirlande_guinguette', 'guirlande_fanions', 'piquet_guirlande', 'pot_fleurs'] },
    { k: 'noel', n: 'Au Petit Noël', lab: '🎄 Boutique de Noël', w: 4, goods: 'noel', front: 0x1f4a2a, sign: 0x8a1a1e, awn: [0xd8343a, 0xffffff], wall: 0xf6f0e4, shut: 0xd8343a,
      R: [8, 7, 'parquet_fonce', 'peinture_empire', 0xd8343a], fill: P => { P('sapin_boutique', 0, 3); P('cheminee', 6, 0); P('bonhomme_neige', 7, 4); P('guirlande_noel', 0, 0); P('coffre', 0, 6); P('coffre', 7, 6); P('tapis_savonnerie', 3, 4); P('lustre_bougies', 4, 4); },
      who: ['Papy Houx', { gender: 'g', hair: 'chauve', hairCol: 0xffffff, hat: 'bonnet', hatCol: 0xd8343a, top: 'pull', topCol: 0xd8343a, bottom: 'pantalon', botCol: 0x2f5a2a, shoe: 'bottes', shoes: 0x1a1a1a, eyes: 'doux', acc: 'lunettes', ex: { beard: 0xffffff } }],
      hi: ['Ho ho… bonjour {p} ! Ici, c’est Noël toute l’année !', 'Ah, {p} ! Tu sens le pain d’épices ? C’est la cheminée.'],
      chat: ['Un sapin, des guirlandes, un bonhomme de neige : et ton village scintille !', 'Le secret d’un bon bonhomme de neige : une carotte bien droite.', 'Je ne suis pas le Père Noël. Je suis son cousin. Enfin… peut-être.'],
      q: '« Noël, c’est quand on le décide ! »', sells: ['sapin', 'sapin_neige', 'bonhomme_neige', 'guirlande_noel', 'guirlande_etoiles', 'guirlande_lampions', 'lanterne', 'lustre_bougies', 'cheminee', 'chocolat_chaud', 'oeuf_chocolat'] }
  ];

  // un sapin décoré pour la boutique de Noël (boules, petites lumières, étoile)
  MD.sapin_boutique = v => { const b = G.mb(4390); cy(b, .26, .3, .3, 0xc0283a, 0, .15, 0); cy(b, .06, .06, .3, 0x6b4226, 0, .4, 0);
    for (let k = 0; k < 4; k++) cn(b, .5 - k * .1, .6, 0x2f6b3a, 0, .75 + k * .38, 0, 0, 0, 0, 10);
    for (let k = 0; k < 22; k++) { const t = k / 22, a = k * 2.4, r = .46 * (1 - t) + .06, y = .6 + t * 1.5; sp(b, .045, pk([0xd8343a, GOLD, 0x5b8fd6, 0xffffff, 0xc58aff], k), Math.cos(a) * r, y, Math.sin(a) * r, 1, 1, 1, k % 3 ? 0 : 1); }
    cn(b, .1, .16, 0xffd23f, 0, 2.28, 0, 0, 0, 1, 5); cn(b, .1, .16, 0xffd23f, 0, 2.28, 0, PI, 0, 1, 5); return b.done(); };
  O.sapin_boutique = { id: 'sapin_boutique', n: 'Sapin de Noël', model: 'sapin_boutique', v: 0, fp: [1, 1], h: 2.4, light: 1, li: .5, ly: 1.6, ld: 3 };

  // =====================================================================
  // 5. Tout brancher : bâtiment, modèle, intérieur, meubles, commerçant
  // =====================================================================
  const say = (v, l, c) => G.npcSay(v, l, c), surv = () => G.mode === 'survie', later = f => setTimeout(f, 60);
  const pay = (n, v, ok) => { if (!surv() || !n) return ok(); if (G.coins < n) return say(v, ['Oh… il te manque ' + (n - G.coins).toLocaleString('fr-FR') + ' clochettes. Reviens quand tu les auras !']); G.coins -= n; G.ui.dirtyHud(); G.sfx('coin'); return ok(); };
  const price = n => surv() ? ' (' + n.toLocaleString('fr-FR') + ' 🔔)' : '';
  const PN = s => s.replace(/\{p\}/g, G.playerName || 'toi');
  G.NPCLX = G.NPCLX || {};
  SHOPS.forEach((S, i) => {
    const id = 'rb_' + S.k, [RW, RH, floor, wall, trim] = S.R;
    MD[id] = v => { const b = G.mb(4400 + i * 2 + (v === 1 ? 1 : 0)); devanture(b, S, v === 1 ? 1 : 2); return b.done(); };
    O[id] = { id, n: S.n, model: id, v: 0, fp: [S.w, 3], h: 6.8, enter: id, fixed: 1 };
    G.ROOMKINDS[id] = { W: RW, H: RH, floor, wall, trim };
    const gi = Math.max(0, GK.indexOf(S.goods)); // (le présentoir et le rayonnage montrent la marchandise de la boutique)
    G.ROOMFILL[id] = (m, P) => { const X = { etal: (x, z, r = 0) => P('rb_etal', x, z, r, { v: gi }), rayon: (x, z, r = 0) => P('rb_rayon', x, z, r, { v: gi }) };
      P('comptoir', Math.floor(m.W / 2) - 1, 1); S.fill(P, X); };
    G.ROOMNPC[id] = [id, Math.floor(RW / 2) + .5, .6];
    G.NPCS[id] = { n: S.who[0], sp: 'commercant', col: S.who[1].hairCol, shirt: S.who[1].topCol, pitch: S.who[1].gender === 'f' ? 1.2 : .95 };
    G.NPCLX[S.who[0]] = S.who[1];
    G.npcRoles[id] = v => {
      const hello = [PN(G.pick(S.hi))], talk = () => say(v, [PN(G.pick(S.chat))]);
      if (S.style) { const [secs, cost, title, done] = S.style;
        return say(v, hello, ['Essayer' + price(cost), 'Bavarder', 'Au revoir']).then(k => { if (k === 1) return talk(); if (k !== 0) return;
          G.ui.openWardrobe({ sections: secs, title, okLabel: 'Valider' + price(cost), onDone: look => later(() => pay(cost, v, () => { G.player.setLook(look); G.sfx('fanfare'); G.ui.toast(done); })) }); }); }
      const list = () => (typeof S.sells === 'function' ? S.sells() : S.sells).filter((id, j, a) => I[id] && a.indexOf(id) === j);
      const ch = S.buys ? ['Acheter', 'Vendre', 'Bavarder', 'Au revoir'] : ['Acheter', 'Bavarder', 'Au revoir'];
      return say(v, hello, ch).then(k => { const c = ch[k];
        if (c === 'Acheter') return G.ui.openShop(v, { list: list(), title: S.n, quote: S.q, noSell: true });
        if (c === 'Vendre') return G.ui.openShop(v, { list: [], title: S.n + ' — je rachète', quote: S.q });
        if (c === 'Bavarder') return talk(); });
    };
  });

  // =====================================================================
  // 6. Dans la Grand-Rue : la partie est, des deux côtés
  // =====================================================================
  const BY = {}; SHOPS.forEach(S => { BY[S.k] = S; });
  const NORTH_A = ['boulangerie', 'patisserie', 'chocolaterie', 'fromagerie', 'primeur', 'glacier', 'creperie', 'salon_the', 'traiteur', 'torrefacteur', 'confiserie']; // x 64 → 100
  const NORTH_B = ['epicerie', 'poissonnerie', 'fleuriste', 'pharmacie']; // x 104 → 116
  const SOUTH = ['antiquaire', 'luminaires', 'ameublement', 'tapissier', 'quincaillerie', 'chapellerie', 'bijouterie', 'mode', 'barbier', 'jouets', 'garage', 'musique', 'librairie', 'terrasse', 'noel']; // x 60 → 116
  const DECOR = new Set(['rue_angle', 'rue_fond', 'immeuble', 'rue_echoppe']);
  const og = G.genRue; G.genRue = () => {
    const m = og(); if (!m || !m.meta || !m.meta.ville4 || m.W !== 120) return m;
    const OZ = 22, clear = (x0, x1, z0, z1) => { for (const o of [...m.list]) { const d = O[o.t]; if (!d || !DECOR.has(o.t)) continue; const [w, dd] = G.fpDims(d, o.r); if (o.x < x1 && o.x + w > x0 && o.z < z1 && o.z + dd > z0) m.removeObj(o); } };
    const lane = (keys, x, x1, z, rot, ch) => { for (const k of keys) { const S = BY[k]; if (x + S.w > x1) break; m.addObj('rb_' + k, x, z, rot, { iid: 'rue_' + k, ch, v: rot ? 1 : 0 });
      G.mapLabel(m, S.lab, x + S.w / 2, 2.3, rot ? z - .2 : z + 3.2, .8); x += S.w; } return x; };
    // côté nord (façades vers la rue) : 64 → 100 et 104 → 116 ; au bout, derrière les Grands Magasins, un immeuble d'angle
    clear(64, 100, OZ + 3, OZ + 6); clear(104, 120, OZ + 3, OZ + 6);
    lane(NORTH_A, 64, 100, OZ + 3, 0, 7.4); lane(NORTH_B, 104, 116, OZ + 3, 0, 7.4); m.addObj('rue_angle', 116, OZ + 3, 0, { v: 2, ch: 6.4 });
    // côté sud (façades vers la rue ; la caméra survole leurs toits) : 60 → 116, puis l'immeuble d'angle
    clear(60, 120, OZ + 16, OZ + 19); lane(SOUTH, 60, 116, OZ + 16, 2, 5.7); m.addObj('rue_angle', 116, OZ + 16, 2, { v: 3, ch: 6.4 });
    return m;
  };
  G.rueBoutiques = SHOPS;
})();
