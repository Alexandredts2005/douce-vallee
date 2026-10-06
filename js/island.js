'use strict';
// ===== L'île aux palmiers : générée chaque jour, rejointe en bateau depuis le ponton =====
(function () {
  G.OBJ.hibiscus = { id: 'hibiscus', n: 'Hibiscus', model: 'bush', v: 3, fp: [1, 1], h: .9, chop: 1, drop: 'herbe' };
  G.ITEMS.hibiscus = { id: 'hibiscus', n: 'Hibiscus', kind: 'place', obj: 'hibiscus', cat: 'nature', thumb: 'obj:hibiscus', sell: 120, stack: 99 };
  G.genIsland = seed => {
    const W = 60, H = 56, m = new G.GMap(W, H, { kind: 'ile', id: 'ile' }), r = G.rng(seed), I = (x, z) => z * W + x, cx = W / 2, cz = H / 2 - 2;
    m.water.fill(2); m.lvl.fill(0); m.surf.fill(5);
    const hx = cx + 3, hz = cz - 4;
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const i = I(x, z), d = Math.hypot(x - cx, (z - cz) * 1.08) + (G.noise(x * .18, z * .18, seed) - .5) * 6;
      if (d < 17.5) { m.water[i] = 0; m.surf[i] = d > 13.5 ? 5 : (G.hash2(x, z, seed) < .1 ? 14 : 0); }
      if (!m.water[i] && Math.hypot(x - hx, z - hz) + (G.noise(x * .3, z * .3, seed + 2) - .5) * 2.5 < 5.4) m.lvl[i] = 1;
    }
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - (cx + 6), z - (cz + 3.5)); if (d < 2.8) { m.water[I(x, z)] = 1; m.lvl[I(x, z)] = 0; } }
    for (let z = Math.floor(hz - 1); z <= Math.floor(cz + 2); z++) for (const x of [Math.floor(cx + 6), Math.floor(cx + 7)]) { if (m.lvl[I(x, z)] === 1 || z <= cz + 1) { m.water[I(x, z)] = 1; } }
    for (let pass = 0; pass < 3; pass++) for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) { const i = I(x, z); if (!m.water[i]) continue; for (const j of [i - 1, i + 1, i - W, i + W]) if (!m.water[j] && m.lvl[j] < m.lvl[i]) m.lvl[i] = m.lvl[j]; }
    let dz = Math.floor(cz + 12); while (dz < H - 1 && !m.water[I(Math.floor(cx), dz)]) dz++;
    const put = (t, x, z, rot = 0, ex) => m.canPlace(t, x, z, rot) ? m.addObj(t, x, z, rot, ex) : null;
    for (let k = 0; k < 6; k++) { put('ponton', Math.floor(cx), dz + k); put('ponton', Math.floor(cx) + 1, dz + k); }
    put('bateau', Math.floor(cx) + 2, dz + 4); put('lanterne', Math.floor(cx) - 1, dz - 1);
    m.meta = { island: true, spawn: { x: cx + .5, z: dz + 3.5 }, seaZ: H, npcs: [{ role: 'capitaine', x: cx + 1.6, z: dz + 4.5, yaw: Math.PI / 2 }], homes: [], pier: { x: cx + .5, z: dz + 3 } };
    for (let z = dz - 3; z < dz; z++) for (const x of [Math.floor(cx), Math.floor(cx) + 1]) if (!m.water[I(x, z)]) m.surf[I(x, z)] = 3;
    put('hutte', Math.floor(cx - 9), Math.floor(cz - 2), 0, { iid: 'ile_hutte' }); m.meta.hut = { x: cx - 7.5, z: cz + 1.6 };
    const free = (x, z) => m.inb(x, z) && !m.water[I(x, z)] && !m.occ[I(x, z)] && !m.ramp[I(x, z)] && m.surf[I(x, z)] !== 3;
    for (let z = 2; z < H - 2; z++) for (let x = 2; x < W - 2; x++) {
      if (!free(x, z) || r() > (m.surf[I(x, z)] === 5 ? .07 : .09)) continue; let ok = true; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const o = m.objAt(x + a, z + b); if (o && G.OBJ[o.t].chop >= 3) ok = false; } if (!ok) continue;
      m.addObj(m.surf[I(x, z)] === 5 ? 'palmier' : G.pick(['palmier', 'palmier', 'oranger', 'pecher', 'chene'], r), x, z, 0, { f: 3 });
    }
    const scatter = (t, n, cond) => { for (let k = 0; k < n; k++) for (let tries = 0; tries < 30; tries++) { const x = 2 + Math.floor(r() * (W - 4)), z = 2 + Math.floor(r() * (H - 4)); if (free(x, z) && cond(I(x, z)) && m.canPlace(t, x, z)) { m.addObj(t, x, z); break; } } };
    scatter('coquillage', 10, i => m.surf[i] === 5); scatter('fruit_coco', 6, i => m.surf[i] === 5); scatter('hortensia', 5, i => m.surf[i] !== 5); scatter('rocher', 4, () => true); scatter('fissure', 2, i => m.surf[i] !== 5);
    for (const c of ['rouge', 'rose', 'orange', 'jaune']) scatter('fleur_' + c, 4, i => m.surf[i] !== 5);
    scatter('hibiscus', 9, i => m.surf[i] !== 5); scatter('gros_rocher', 3, i => m.surf[i] === 5); scatter('rocher', 5, i => m.surf[i] === 5); scatter('palmier', 8, i => m.surf[i] === 5); scatter('buisson_baies', 3, i => m.surf[i] !== 5); scatter('coquillage', 6, i => m.surf[i] === 5);
    return m;
  };
  G.travel = {
    island() {
      G.sfx('fanfare'); G.ui.toast('⛵ En route vers l\'île aux palmiers…');
      G.ui.fade(() => {
        if (!G.island || G.island.day !== G.clock.day) { if (G.island) { G.scene.remove(G.island.group); G.ents.removeNPCs(G.island); } G.island = G.genIsland(G.clock.day * 977 + 13); G.island.day = G.clock.day; G.scene.add(G.island.group); G.island.buildAll(); G.ents.spawnVillagers(G.island); }
        const s = G.island.meta.spawn; G.enterMap(G.island, s.x, s.z, Math.PI); G.ui.toast('Bienvenue sur l\'île ! 🌴 Insectes et poissons rares t\'y attendent.');
      }, 1.6);
    },
    home() {
      G.sfx('fanfare'); G.ui.fade(() => { const p = G.world.meta.pier || G.world.meta.spawn; G.enterMap(G.world, p.x, p.z - 2.5, 0); G.ui.toast('De retour au village !'); }, 1.6);
    }
  };
})();
