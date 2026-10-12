'use strict';
// ===== Carte deux fois plus grande (14 × 6 parcelles) et arches en pierre =====
(function () {
  const add = [['foret', 'colline', 'montagne', 'foret', 'plateau', 'colline', 'montagne'], ['plaine', 'verger', 'foret', 'etang', 'plaine', 'foret', 'colline'], ['jardin', 'plaine', 'verger', 'plaine', 'etang', 'plaine', 'foret'],
    ['plaine', 'foret', 'plaine', 'jardin', 'plaine', 'verger', 'plaine'], ['etang', 'plaine', 'colline', 'plaine', 'foret', 'plaine', 'plateau'], ['plage', 'plage', 'plage_rochers', 'plage', 'plage', 'plage', 'plage']];
  G.DEFAULT_LAYOUT.forEach((r, z) => r.push(...add[z].filter(a => G.ACRES[a]).concat(add[z].filter(a => !G.ACRES[a]).map(() => 'plaine'))));
  G.AC = G.DEFAULT_LAYOUT[0].length;
  G.MODELS.arche = v => { const b = G.mb(330), S = 0xcfc6b2, P = G.PAT ? G.PAT.pierre : 0; b.P(P);
    for (const s of [-1, 1]) { b.box(.5, 2.2, .6, S, s * 1.1, 1.1, 0); b.box(.62, .14, .7, 0xbdb4a2, s * 1.1, .07, 0); }
    for (let k = 0; k <= 10; k++) { const a = Math.PI * k / 10, x = Math.cos(a) * 1.1, y = 2.2 + Math.sin(a) * 1.1; b.box(.42, .3, .6, S, x, y, 0, 0, 0, a - Math.PI / 2); }
    b.box(.32, .4, .62, 0xe6ddc8, 0, 3.32, 0); b.P(0); b.jit(.1); b.blob(.18, 1, 0x4fa847, -1.1, 2.5, .3, 1, 1.4, .5); b.jit(0); return b.done(); };
  G.OBJ.arche_pierre = { id: 'arche_pierre', n: 'Arche en pierre', model: 'arche', v: 0, h: 3.5, fp: [3, 1], take: 1, cat: 'construction' };
  G.ITEMS.arche_pierre = { id: 'arche_pierre', n: 'Arche en pierre', stack: 9, sell: 200, kind: 'place', obj: 'arche_pierre', cat: 'construction', thumb: 'obj:arche_pierre' };
})();
