'use strict';
// ===== Poser par-dessus la nature : quand le joueur pose un objet (un château, une maison, un banc, une clôture…),
// les arbres, buissons, arbustes fleuris, fleurs, mauvaises herbes, rochers, coquillages, champignons, fruits tombés,
// souches, pousses et trous à fossiles qui se trouvent dessous sont écrasés tout seuls (petit nuage de feuilles).
// Seulement pendant que le joueur pose (G._deckY est rempli par poser.js et par le fantôme de placement) :
// la création du monde, la repousse et les objets qui tombent du ciel ne touchent à rien. Cadeaux et sacs de clochettes ne sont jamais écrasés. =====
(function () {
  const O = G.OBJ, KEEP = new Set(['cadeau', 'sac_pieces', 'tresor_sol']);
  const NAT = /^(mauvaise_herbe|champignon|coquillage|fissure|souche|pousse|fruit_|gelee_sol|eclat_etoile|buisson|hortensia|hibiscus|lavande|rocher|gros_rocher)/;
  G.isNature = o => { const d = o && O[o.t]; if (!d || KEEP.has(o.t) || d.enter || d.shop || d.fixed || o.dk != null) return false;
    return !!(d.chop || d.mine || G.isFlowerObj(o) || NAT.test(o.t) || (d.model === 'plante2' && d.cat === 'fleurs')); }; // plante2 « fleurs » : arbustes et arbres d'extérieur (pas les plantes en pot)
  const orep = G.replaces; G.replaces = (d, q) => orep(d, q) || (G._deckY != null && !!d && !d.ceil && !d.up && G.isNature(q));
  // un petit nuage de feuilles ou de poussière là où la nature a été écrasée
  const opl = G.act.placeObj; G.act.placeObj = (it, tx, tz) => {
    const m = G.map, d = it && O[it.obj]; if (!m || !d || d.ceil || d.up) return opl(it, tx, tz);
    const [ax, az] = G.act.anchor(d, G.placeRot, tx, tz), [w, dd] = G.fpDims(d, G.placeRot), under = new Set();
    for (let z = az; z < az + dd; z++) for (let x = ax; x < ax + w; x++) { const q = m.objAt(x, z); if (q && G.isNature(q)) under.add(q); }
    const res = opl(it, tx, tz); let n = 0;
    for (const q of under) if (!m.list.has(q)) { const [cx, cz] = m.center(q), qd = O[q.t], green = qd.chop || qd.model === 'plante2' || G.isFlowerObj(q); G.fx.puff(cx, q.y + (qd.chop >= 3 ? 1.5 : .3), cz, qd.chop >= 3 ? 10 : 4, green ? 0x6cc458 : 0xd9cfb8, qd.chop >= 3 ? 1.1 : .6); n++; }
    if (n) G.sfx('chop', Math.min(1, .3 + n * .05));
    return res;
  };
})();
