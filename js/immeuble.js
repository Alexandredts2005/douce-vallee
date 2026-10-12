'use strict';
// ===== Immeubles (2 à 5 étages, mêmes styles que les maisons) : escalier entre les étages, 4 appartements par étage,
// un habitant de plus par appartement. On peut aussi choisir sa maison principale parmi ses bâtiments. =====
(function () {
  const MD = G.MODELS, O = G.OBJ;
  MD.immeuble2 = v => { const b = G.mb(300 + v), st = G.HOUSE_STYLES[v % 10], fl = Math.floor(v / 10);
    G.ARCH.maison(b, Object.assign({}, st, { porch: 0, dormer: 0, balcon: 0, auvent: null }), { floors: fl, w: 3.6, d: 2.3, wx: [-1.25, 1.25] }); return b.done(); };
  for (let f = 2; f <= 5; f++) { const id = 'immeuble' + f, n = 'Immeuble ' + f + ' étages';
    O[id] = { id, n, model: 'immeuble2', v: f * 10 + 7, h: 2 + f * 1.55, fp: [4, 3], enter: 'maison', floors: f, take: 1, cat: 'construction' };
    G.ITEMS[id] = { id, n, stack: 1, sell: 300, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id }; }
  const mk = (id, o) => { const m = G.makeInterior('maison', id, o); m.group.visible = false; G.scene.add(m.group); G.interiors[id] = m; return m; };
  // première visite : on construit les étages, l'escalier et les appartements (avec leurs habitants)
  G.on('enterMap', m => {
    if (!m.interior || m.meta.immOk || !G.world) return; const o = [...G.world.list].find(q => q.iid === m.id && O[q.t].floors); if (!o) return; m.meta.immOk = 1;
    let prev = m, vi = 0;
    for (let f = 0; f < O[o.t].floors; f++) {
      const fm = f ? mk(m.id + '_e' + f, { W: m.W, H: m.H, noMat: true, empty: true }) : m; fm.meta.title = f ? 'Étage ' + f : 'Rez-de-chaussée'; fm.meta.fromId = 'world'; fm.meta.door = m.meta.door;
      if (f) { const c = (mm, x, z) => { const q = mm.objAt(x, z); if (q && q.t !== 'paillasson') mm.removeObj(q); }, ux = f > 1 ? 2 : 0; c(prev, ux, 0); c(prev, ux + 1, 0); prev.addObj('escalier', ux, 0, 0, { iid: fm.id, v: 0 }); fm.addObj('escalier', 0, 0, 0, { iid: prev.id, v: 1 }); }
      [[0, 2, 1], [0, 4, 1], [fm.W - 1, 2, 3], [fm.W - 1, 4, 3]].forEach(([x, z, r], k) => { if (z >= fm.H - 1) return; for (const [qx, qz] of [[x, z], [x + (r === 1 ? 1 : -1), z]]) { const q = fm.objAt(qx, qz); if (q && q.t !== 'escalier' && q.t !== 'porte_int') { if (G.ITEMS[q.t] && G.storage) { const sl = G.storage.findIndex(e => !e); if (sl >= 0) G.storage[sl] = { id: q.t, n: 1 }; } fm.removeObj(q); } } if (fm.objAt(x, z)) return; const aid = fm.id + '_a' + k, am = mk(aid, { W: 7, H: 6 });
        am.meta.title = 'Appartement ' + (f * 4 + k + 1); am.meta.fromId = 'world'; am.meta.door = m.meta.door; fm.addObj('porte_int', x, z, r, { iid: aid }); am.addObj('porte_int', r === 1 ? 6 : 0, 3, r === 1 ? 3 : 1, { iid: fm.id });
        am.meta.homes = [{ vi: (vi++ + G.hashStr(m.id)) % G.VILLAGERS.length, x: 3.5, z: 2.5 }]; G.ents.spawnVillagers(am); });
      prev = fm; }
  });
  // réparation des immeubles déjà construits : chaque étage du milieu garde aussi son escalier qui descend
  G.on('enterMap', m => { const k = m.interior && /^(.*)_e(d+)$/.exec(m.id); if (!k) return; const n = +k[2], down = n > 1 ? k[1] + '_e' + (n - 1) : k[1];
    if ([...m.list].some(q => q.t === 'escalier' && q.iid === down)) return; const up = m.objAt(0, 0); if (up && up.t === 'escalier') { const id = up.iid; m.removeObj(up); for (const x of [2, 3]) { const q = m.objAt(x, 0); if (q) m.removeObj(q); } m.addObj('escalier', 2, 0, 0, { iid: id, v: 0 }); }
    m.addObj('escalier', 0, 0, 0, { iid: down, v: 1 }); });
  // en posant un immeuble, on choisit son style (les mêmes que les maisons)
  const IST = [[7, 'Immeuble de ville'], [0, 'Immeuble en briques'], [4, 'Immeuble normand'], [2, 'Immeuble provençal'], [1, 'Immeuble à clins'], [8, 'Immeuble scandinave']];
  const op = G.act.placeObj; G.act.placeObj = (it, tx, tz) => { const m = G.map, n0 = m.list.size; op(it, tx, tz); const d = O[it.obj]; if (!d || !d.floors || m.list.size === n0) return;
    let o = null; for (const q of m.list) o = q; if (!o || o.t !== it.obj) return;
    G.ui.dialog('Architecte', ['Quel style pour ton immeuble ?'], { choices: IST.map(x => x[1]) }).then(c => { if (c == null || c < 0 || !IST[c]) return; o.v = d.floors * 10 + IST[c][0]; m.refresh(o); G.sfx('craft'); G.saveGame(true); }); };
  // agence : choisir sa maison principale parmi ses maisons, immeubles et châteaux posés
  G.on('init', () => { const ag = G.npcRoles.agence; G.npcRoles.agence = v => G.npcSay(v, ['Tu veux habiter ailleurs ?'], ['Changer de maison principale', 'Autre chose…']).then(k => {
    if (k !== 0) return ag(v); const home = [...G.world.list].find(q => q.iid === G.homeId()), l = [...G.world.list].filter(q => q !== home && O[q.t].enter === 'maison' && /^(maison|immeuble|chateau)/.test(q.t)).slice(0, 8);
    if (!home || !l.length) return G.npcSay(v, ['Pose d\'abord une autre maison, un immeuble ou un château (catalogue, onglet construction) !']);
    return G.npcSay(v, ['Laquelle ?'], l.map(q => O[q.t].n + ' (' + q.x + ', ' + q.z + ')')).then(c => { const q = l[c]; if (!q) return; const t = q.iid; q.iid = home.iid; home.iid = t; G.saveGame(true); G.sfx('fanfare'); return G.npcSay(v, ['C\'est fait ! Ta maison principale, avec tout ton intérieur, est maintenant là-bas.']); }); }); });
})();
