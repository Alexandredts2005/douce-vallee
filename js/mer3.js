'use strict';
// ===== La mer recule : le bord du monde, côté large, est trois fois plus loin (30 cases de mer au lieu de 10).
// On y navigue, on y pose pontons et bateaux, et on peut la combler (outil Terrain › Combler) pour bâtir dessus.
// Les anciennes parties s'agrandissent toutes seules : rien ne bouge, des rangées de mer sont ajoutées au sud. =====
(function () {
  const OLD = 10;
  // une carte du monde (déjà enregistrée) dont la mer est moins profonde que G.SEA reçoit les rangées qui manquent
  const deepen = dw => {
    const M = dw && dw.meta; if (!M || dw.kind !== 'world' || dw.interior || M.island || M.rue) return dw;
    const seaZ = M.seaZ != null ? M.seaZ : Array.isArray(M.layout) ? G.BORDER + M.layout.length * G.ACRE : null; if (seaZ == null) return dw;
    const add = seaZ + G.SEA - dw.H; if (add <= 0 || dw.H - seaZ < OLD - 1) return dw;
    const W = dw.W, H0 = dw.H, H = H0 + add, n0 = W * H0, n = W * H;
    const grow = (enc, T, fill) => { const a = G.b64.dec(enc, T), b = new T(n); b.set(a.subarray(0, n0)); if (fill) b.fill(fill, n0); return b; };
    const lvl = grow(dw.lvl, Int8Array), surf = grow(dw.surf, Uint8Array), water = grow(dw.water, Uint8Array, 2), ramp = grow(dw.ramp, Uint8Array);
    // la dernière rangée d'origine (le bord) est recopiée vers le large : la mer y était déjà partout
    for (let z = H0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x; lvl[i] = 0; surf[i] = 0; ramp[i] = 0; water[i] = 2; }
    const out = Object.assign({}, dw, { H, lvl: G.b64.enc(new Uint8Array(lvl.buffer)), surf: G.b64.enc(surf), water: G.b64.enc(water), ramp: G.b64.enc(ramp), meta: Object.assign({}, M, { seaZ }) });
    out.merLoin = 1; return out;
  };
  G.deepenSea = deepen;
  // toutes les cartes lues (sa partie, ou le village d'un ami en visite) passent par ici
  const ods = G.GMap.deserialize; G.GMap.deserialize = function (d) { return ods.call(this, deepen(d)); };
  // avant les autres agrandissements (ils reconnaissent les anciennes cartes à leur hauteur)
  G.on('init', () => { const or = G.restore; G.restore = d => { let grew = false;
    if (d && d.world) { const w = deepen(d.world); if (w !== d.world) { d.world = w; grew = true; } }
    const res = or(d);
    if (grew) { setTimeout(() => G.ui.toast('🌊 La mer a reculé : elle est trois fois plus grande ! Navigue au large, pose des pontons, ou comble-la (Terrain › Combler) pour y bâtir.', 9000), 2600); setTimeout(() => G.state === 'play' && G.saveGame(true), 5000); }
    return res; }; });
})();
