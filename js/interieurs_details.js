'use strict';
// ===== Revue des intérieurs : les finitions.
// 1. Le tapis rond des maisons, de la tente, de la mairie et des boutiques était devenu… un tapis volant (le véhicule porte le même nom) :
//    dans les intérieurs, il redevient un vrai tapis de sol (aussi dans les anciennes parties).
// 2. Les maisons des habitants, les boutiques et les échoppes un peu vides reçoivent leurs finitions : un tapis au milieu,
//    des plantes dans les coins libres, une suspension au plafond quand il n'y en a pas. Ta maison et ce que tu as posé ne bougent pas. =====
(function () {
  // ---------- 1. le tapis rond ----------
  const rug = m => { if (!m || !m.interior) return; for (const o of [...m.list]) { if (o.t !== 'tapis') continue; const { x, z } = o; m.removeObj(o);
    if (m.canPlace('tapis_rond', x, z)) m.addObj('tapis_rond', x, z); else if (m.canPlace('tapis_rond', x, z - 1)) m.addObj('tapis_rond', x, z - 1); else if (m.canPlace('tapis_rond', x - 1, z)) m.addObj('tapis_rond', x - 1, z); else m.addObj('tapis', x, z, o.r || 0); } };
  const ods = G.GMap.deserialize; G.GMap.deserialize = function (d) { const m = ods.call(this, d); try { rug(m); } catch (e) { console.error(e); } return m; };

  // ---------- 2. les finitions des pièces un peu vides ----------
  const SKIP = new Set(['maison', 'villa', 'tente', 'cabane', 'hutte', 'gare', 'musee', 'mairie']); // chez toi, et les grands monuments (déjà composés)
  function finish(m) {
    if (!m || !m.interior || m.isVisit || m.meta.det || SKIP.has(m.kind) || m.meta.plan || /^home|_e\d|_a\d/.test(m.id || '')) return; m.meta.det = 1;
    const W = m.W, H = m.H, door = Math.floor(W / 2), P = (t, x, z, r = 0) => m.canPlace(t, x, z, r) && m.addObj(t, x, z, r);
    const free = (x, z) => !(Math.abs(x - door) <= 1 && z >= H - 2); // l'entrée reste dégagée
    // un tapis au milieu de la pièce
    if (![...m.list].some(o => /^tapis|hdv_tapis/.test(o.t))) { const cx = Math.floor(W / 2) - 1, cz = Math.floor(H / 2) - 1;
      for (const [dx, dz] of [[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) if (free(cx + dx, cz + dz + 1) && P('tapis_rond', cx + dx, cz + dz)) break; }
    // des plantes dans les coins encore libres (trois au plus)
    let n = [...m.list].filter(o => o.t === 'plante' || o.t === 'pot_fleurs').length;
    for (const [x, z] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1], [0, Math.floor(H / 2)], [W - 1, Math.floor(H / 2)]]) { if (n >= 3) break; if (!free(x, z)) continue; if (P(n % 2 ? 'pot_fleurs' : 'plante', x, z)) n++; }
    // une suspension au plafond
    if (!m.ceil.size) { const L = G.pick(['lustre_globe', 'lustre_tulipes', 'lustre_lanterne'].filter(id => G.OBJ[id])); if (L) for (const [x, z] of [[Math.floor(W / 2), Math.floor(H / 2)], [Math.floor(W / 2) - 1, Math.floor(H / 2)], [Math.floor(W / 2), Math.floor(H / 2) - 1]]) if (m.canPlace(L, x, z)) { m.addObj(L, x, z); break; } }
  }
  const omi = G.makeInterior; G.makeInterior = (kind, id, opt = {}) => { const m = omi(kind, id, opt); if (!opt.empty) try { finish(m); } catch (e) { console.error(e); } return m; };
  G.on('load', () => { for (const id in G.interiors) try { finish(G.interiors[id]); } catch (e) { console.error(e); } });
  G.finishInterior = finish;
})();
