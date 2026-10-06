'use strict';
// ===== Génération du village à partir des acres : falaises organiques, rivières auto-reliées, cascades, plage, routes, décor =====
(function () {
  const A = G.ACRE, B = G.BORDER;
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S O  -> codes de pente 1..4
  const dirCode = (dx, dz) => dz < 0 ? 1 : dx > 0 ? 2 : dz > 0 ? 3 : 4;

  G.randomLayout = seed => {
    const r = G.rng(seed), L = [], land = ['plaine', 'plaine', 'foret', 'verger', 'plateau', 'colline', 'jardin', 'etang', 'foret', 'plaine'];
    for (let z = 0; z < G.AR; z++) { L.push([]); for (let x = 0; x < G.AC; x++) L[z].push(z === G.AR - 1 ? G.pick(['plage', 'plage', 'plage_rochers'], r) : z === 0 ? G.pick(['montagne', 'foret', 'plateau', 'colline'], r) : G.pick(land, r)); }
    let rx = 1 + Math.floor(r() * (G.AC - 2)); // rivière du nord à la mer
    for (let z = 0; z < G.AR - 1; z++) { L[z][rx] = z === 0 ? 'riviere_h' : z === 1 ? 'cascade' : 'riviere'; if (z > 1 && z < G.AR - 2 && r() < .35) { const nx = G.clamp(rx + (r() < .5 ? -1 : 1), 0, G.AC - 1); L[z][nx] = 'riviere'; rx = nx; } }
    const free = []; for (let z = 2; z < G.AR - 1; z++) for (let x = 0; x < G.AC; x++) if (!G.ACRES[L[z][x]].water) free.push([x, z]);
    for (const s of ['place', 'boutique', 'maison', 'village', 'village', 'camping']) { if (!free.length) break; const k = Math.floor(r() * free.length); const [x, z] = free.splice(k, 1)[0]; L[z][x] = s; }
    L[G.AR - 1][Math.floor(r() * G.AC)] = 'ponton';
    if (G.ACRES.gare) for (const c of [3, 2, 4, 1, 5]) if (!G.ACRES[L[0][c]].water) { L[0][c] = 'gare'; break; }
    if (G.ACRES.mairie && !G.ACRES[L[1][3]].water) L[1][3] = 'mairie';
    return L;
  };

  function acreLevel(id, lx, lz, s) {
    const d = G.ACRES[id]; if (!d) return 0;
    const n = G.noise(lx * .3, lz * .3, s) - .5, dc = Math.hypot(lx - 8, lz - 8) + n * 3;
    if (d.mountain) return dc < 3.4 ? 3 : dc < 6 ? 2 : 1;
    if (d.hill) return dc < 4.6 ? 2 : 1;
    if (d.fall) return lz < 7.5 + n * 3 ? 1 : 0;
    if (d.rocky) return (lz < 5 && (lx < 5 || lx > 11) && n > -.1) ? 1 : 0;
    return d.lvl;
  }

  G.genWorld = (layout, seed) => {
    seed = seed >>> 0; const AC = layout[0].length, AR = layout.length, W = AC * A + 2 * B, H = B + AR * A + G.SEA;
    const map = new G.GMap(W, H, { kind: 'world', id: 'world' }), r = G.rng(seed), N = W * H;
    const { lvl, surf, water, ramp } = map; const I = (x, z) => z * W + x;
    const acre = (tx, tz) => { const ax = Math.floor((tx - B) / A), az = Math.floor((tz - B) / A); return ax >= 0 && az >= 0 && ax < AC && az < AR ? layout[az][ax] : null; };
    const seaZ = B + AR * A;
    // 1. niveaux avec bords organiques
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const wx = x + (G.noise(x * .14, z * .14, seed) - .5) * 5, wz = z + (G.noise(x * .14 + 40, z * .14, seed + 1) - .5) * 5;
      let L; const i = I(x, z);
      if (z >= seaZ) L = 0;
      else if (wz < B || wx < B || wx >= W - B || x < 2 || x >= W - 2 || z < 2) L = 3;
      else { const cx = G.clamp(wx, B, W - B - .01), cz = G.clamp(wz, B, seaZ - .01), id = acre(Math.floor(cx), Math.floor(cz)); L = acreLevel(id, cx - B - Math.floor((cx - B) / A) * A, cz - B - Math.floor((cz - B) / A) * A, seed + 7); }
      lvl[i] = L; surf[i] = (L >= 3 && !(z >= seaZ)) ? 1 : 0;
    }
    for (let pass = 0; pass < 2; pass++) for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) {
      const i = I(x, z), L = lvl[i], ns = [lvl[i - 1], lvl[i + 1], lvl[i - W], lvl[i + W]]; let diff = 0; for (const v of ns) if (v !== L) diff++;
      if (diff >= 3) { const c = {}; ns.forEach(v => c[v] = (c[v] || 0) + 1); lvl[i] = +Object.keys(c).sort((a, b) => c[b] - c[a])[0]; }
    }
    // 2. surfaces par acre
    for (let z = B; z < seaZ; z++) for (let x = B; x < W - B; x++) {
      const id = acre(x, z), d = G.ACRES[id], i = I(x, z), lz = (z - B) % A; if (!d) continue;
      if (id === 'foret') surf[i] = 1; if (id === 'jardin') surf[i] = 14;
      if (d.mountain && lvl[i] >= 3) surf[i] = 8;
      if (d.beach) { const nz = lz + (G.noise(x * .25, z * .25, seed + 3) - .5) * 3; if (nz > 4.5 && lvl[i] === 0) surf[i] = 5; if (nz > 10.5 && lvl[i] === 0) { water[i] = 2; } }
    }
    for (let z = seaZ; z < H; z++) for (let x = 0; x < W; x++) { water[I(x, z)] = 2; lvl[I(x, z)] = 0; }
    // 3. rivières reliées automatiquement
    const isW = (ax, az) => { if (ax < 0 || az < 0 || ax >= AC || az >= AR) return false; return !!G.ACRES[layout[az][ax]].water; };
    const carve = (pts, hw, wt = 1) => {
      const x0 = Math.min(...pts.map(p => p[0])) - 4, x1 = Math.max(...pts.map(p => p[0])) + 4, z0 = Math.min(...pts.map(p => p[1])) - 4, z1 = Math.max(...pts.map(p => p[1])) + 4;
      for (let z = Math.max(0, Math.floor(z0)); z < Math.min(H, z1); z++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x1); x++) {
        const px = x + .5, pz = z + .5; let best = 1e9;
        for (let k = 0; k < pts.length - 1; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1; const t = G.clamp(((px - ax) * vx + (pz - az) * vz) / L2, 0, 1); best = Math.min(best, Math.hypot(px - ax - vx * t, pz - az - vz * t)); }
        if (best < hw + (G.noise(x * .3, z * .3, seed + 9) - .5) * .8) { const i = I(x, z); water[i] = water[i] === 2 ? 2 : wt; }
      }
    };
    const river = (cx, cz, ex, ez, s) => { const pts = [], mx = (cx + ex) / 2, mz = (cz + ez) / 2, px = -(ez - cz), pz = ex - cx, l = Math.hypot(px, pz) || 1, amp = (G.hash2(s, 3, seed) - .5) * 4;
      for (let k = 0; k <= 8; k++) { const t = k / 8, b = Math.sin(t * Math.PI) * amp; pts.push([cx + (ex - cx) * t + px / l * b, cz + (ez - cz) * t + pz / l * b]); } carve(pts, 1.55); };
    for (let az = 0; az < AR; az++) for (let ax = 0; ax < AC; ax++) {
      const id = layout[az][ax], d = G.ACRES[id], ox = B + ax * A, oz = B + az * A, cx = ox + 8 + (G.hash2(ax, az, seed) - .5) * 2, cz = oz + 8 + (G.hash2(az, ax, seed) - .5) * 2;
      if (d.pond) { const pts = [[cx - 1.5, cz], [cx + 1.5, cz + .5]]; carve(pts, 3); continue; }
      if (d.beach) { if (isW(ax, az - 1)) { river(ox + 8, oz, cx, cz, ax * 31 + az); river(cx, cz, cx, oz + A + 2, ax * 17); } continue; }
      if (!d.water) continue;
      if (d.lake) carve([[cx - 2, cz - 1], [cx + 2, cz + 1]], 4.5);
      let links = 0;
      if (isW(ax, az - 1)) { river(cx, cz, ox + 8, oz, ax * 7 + az * 3 + 1); links++; }
      else if (az === 0) { river(cx, cz, ox + 8, 0, ax * 5 + 2); links++; }
      if (isW(ax, az + 1) || (az + 1 < AR && G.ACRES[layout[az + 1][ax]].beach)) { river(cx, cz, ox + 8, oz + A, ax * 7 + (az + 1) * 3 + 1); links++; }
      if (isW(ax + 1, az)) { river(cx, cz, ox + A, oz + 8, (ax + 1) * 11 + az * 5); links++; }
      if (isW(ax - 1, az)) { river(cx, cz, ox, oz + 8, ax * 11 + az * 5); links++; }
      if (!links) carve([[cx - 1, cz], [cx + 1, cz]], 2.6);
    }
    // l'eau ne flotte jamais au-dessus de la berge
    const settle = () => { for (let pass = 0; pass < 3; pass++) for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      const i = I(x, z); if (!water[i]) continue;
      for (const [dx, dz] of DIRS) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue; const j = I(nx, nz); if (!water[j] && lvl[j] < lvl[i]) lvl[i] = lvl[j]; }
    } };
    settle();
    const meta = map.meta = { homes: [], fruit: G.pick(['pommier', 'oranger', 'pecher'], r) };
    // 4. structures
    const flat = (x0, z0, w, d, L = 0) => { for (let z = z0 - 1; z <= z0 + d; z++) for (let x = x0 - 1; x <= x0 + w; x++) { if (!map.inb(x, z)) continue; const i = I(x, z); lvl[i] = L; water[i] = 0; ramp[i] = 0; } };
    const put = (t, x, z, rot = 0, ex) => map.canPlace(t, x, z, rot) ? map.addObj(t, x, z, rot, ex) : null;
    let vi = 0; const targets = []; let plaza = null;
    for (let az = 0; az < AR; az++) for (let ax = 0; ax < AC; ax++) {
      const id = layout[az][ax], d = G.ACRES[id], ox = B + ax * A, oz = B + az * A;
      if (d.struct && G.STRUCT && G.STRUCT[d.struct]) { G.STRUCT[d.struct]({ map, ox, oz, ax, az, layout, put, flat, targets, meta, I, surf, lvl, water, ramp, r, A, B, W, H, seaZ, setPlaza: v => { plaza = v; } }); continue; }
      if (d.struct === 'place') {
        flat(ox + 3, oz + 3, 10, 10); for (let z = oz + 4; z < oz + 12; z++) for (let x = ox + 4; x < ox + 12; x++) surf[I(x, z)] = (x === ox + 4 || x === ox + 11 || z === oz + 4 || z === oz + 11) ? 4 : 11;
        put('fontaine', ox + 7, oz + 7); [[4, 4], [11, 4], [4, 11], [11, 11]].forEach(([x, z]) => put('lampadaire', ox + x, oz + z));
        put('banc', ox + 7, oz + 5, 0); put('banc', ox + 7, oz + 10, 2); put('tableau', ox + 7, oz + 3);
        for (let k = 0; k < 6; k++) { put('tulipe_' + ['rouge', 'jaune', 'blanche'][k % 3], ox + 5 + k % 2 * 5, oz + 6 + Math.floor(k / 2)); }
        plaza = [ox + 8, oz + 12]; meta.plaza = { x: ox + 8, z: oz + 12.5 };
        if (put('stand_jeux', ox + 12, oz + 6)) { G.npcHost(meta, 'jeux', ox + 13, oz + 8.6, 0); meta.games = { x: ox + 8, z: oz + 8 }; }
      } else if (d.struct === 'village') {
        for (const hx of [2, 10]) { if (vi >= 4) break; flat(ox + hx, oz + 3, 4, 5); const o = put('maison_hab', ox + hx, oz + 3, 0, { v: 4 + vi, vi }); if (!o) continue; put('boite_lettres', ox + hx + 3, oz + 6); put(['fleur_rose', 'fleur_jaune', 'tulipe_blanche', 'fleur_bleue'][vi], ox + hx - 1, oz + 6);
          meta.homes.push({ vi, x: ox + hx + 1.5, z: oz + 6.6 }); targets.push([ox + hx + 1, oz + 6, 4]); vi++; }
      } else if (d.struct === 'maison') {
        flat(ox + 6, oz + 4, 4, 5); put('maison', ox + 6, oz + 4, 0, { iid: 'home' }); put('boite_lettres', ox + 9, oz + 7); put('fleur_rouge', ox + 5, oz + 7); put('fleur_blanche', ox + 5, oz + 6);
        meta.home = { x: ox + 7.5, z: oz + 7.6 }; targets.push([ox + 7, oz + 7, 4]);
      } else if (d.struct === 'boutique') {
        flat(ox + 6, oz + 4, 5, 5); put('boutique', ox + 6, oz + 4); put('lampadaire', ox + 5, oz + 7); put('lampadaire', ox + 10, oz + 7);
        meta.shop = { x: ox + 8.8, z: oz + 7.6 }; targets.push([ox + 8, oz + 7, 4]);
      } else if (d.struct === 'camping') {
        flat(ox + 5, oz + 4, 7, 7); put('tente', ox + 7, oz + 5, 0, { iid: 'tent' }); put('feu_camp', ox + 7, oz + 9); put('souche', ox + 6, oz + 9); put('souche', ox + 9, oz + 9); put('etabli', ox + 10, oz + 5); put('lanterne', ox + 6, oz + 6);
        meta.tent = { x: ox + 8, z: oz + 7.6 }; targets.push([ox + 8, oz + 7, 2]);
      } else if (d.pier) {
        let sz = oz + 6; while (sz < oz + A && !water[I(ox + 7, sz)]) sz++;
        for (let k = 0; k < 7; k++) { put('ponton', ox + 7, sz + k); put('ponton', ox + 8, sz + k); } put('lanterne', ox + 6, sz - 1); targets.push([ox + 7, sz - 1, 2]);
        put('bateau', ox + 9, sz + 5); G.npcHost(meta, 'capitaine', ox + 8.6, sz + 5.5, Math.PI / 2); meta.pier = { x: ox + 8, z: sz + 4.5 };
      } else if (d.lighthouse) {
        flat(ox + 9, oz + 5, 2, 2); surf[I(ox + 9, oz + 5)] = 5; put('phare', ox + 9, oz + 5); targets.push([ox + 9, oz + 7, 2]);
      } else if (id === 'jardin') {
        for (let z = oz + 3; z < oz + 13; z += 3) for (let x = ox + 2; x < ox + 14; x++) { if (water[I(x, z)] || lvl[I(x, z)] !== d.lvl) continue; put((x % 4 < 2 ? 'tulipe_' : 'fleur_') + ['rouge', 'jaune', 'rose', 'bleue', 'violette', 'blanche', 'orange'][Math.floor(z / 3) % 7], x, z); surf[I(x, z + 1)] = 2; }
        put('banc', ox + 7, oz + 14, 2);
      }
    }
    settle();
    // 5. routes (A*) depuis la place
    if (plaza) for (const [tx, tz, s] of targets) { const path = astar(map, plaza[0], plaza[1], tx, tz); if (path) paveRoad(map, path, s, s === 4 ? 2 : 1); }
    // 6. pentes naturelles
    const cand = [];
    for (let z = B; z < seaZ; z++) for (let x = B; x < W - B; x++) {
      const i = I(x, z); if (water[i] || ramp[i] || map.occ[i] || lvl[i] >= 3) continue;
      for (const [dx, dz] of DIRS) { const ux = x + dx, uz = z + dz, bx = x - dx, bz = z - dz; if (!map.inb(ux, uz) || !map.inb(bx, bz)) continue; const u = I(ux, uz), bk = I(bx, bz);
        if (lvl[u] === lvl[i] + 1 && !water[u] && !ramp[u] && lvl[bk] === lvl[i] && !water[bk] && !map.occ[bk] && !ramp[bk]) { const sx = x + dz, sz = z + dx, ox2 = x - dz, oz2 = z - dx; if (map.inb(sx, sz) && map.inb(ox2, oz2) && lvl[I(sx, sz)] === lvl[i] && lvl[I(ox2, oz2)] === lvl[i] && lvl[I(sx + dx, sz + dz)] === lvl[u] && lvl[I(ox2 + dx, oz2 + dz)] === lvl[u]) cand.push([x, z, dx, dz]); } }
    }
    const placed = [];
    for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [cand[k], cand[j]] = [cand[j], cand[k]]; }
    for (const [x, z, dx, dz] of cand) { if (placed.length > 22) break; if (placed.some(([px, pz]) => Math.abs(px - x) + Math.abs(pz - z) < 12)) continue; const i = I(x, z), bk = I(x - dx, z - dz); if (ramp[i] || ramp[bk] || map.occ[i] || map.occ[bk]) continue; ramp[i] = dirCode(dx, dz) * 4 + 1; ramp[bk] = dirCode(dx, dz) * 4 + 2; surf[i] = surf[bk] = 2; placed.push([x, z]); }
    // 7. décor naturel
    const free = (x, z, gap = 1) => { if (!map.inb(x, z) || x < 1 || z < 1 || x >= W - 1) return false; const i = I(x, z); if (water[i] || ramp[i] || map.occ[i] || G.SURF[surf[i]].path) return false;
      for (let dz = -gap; dz <= gap; dz++) for (let dx = -gap; dx <= gap; dx++) { const o = map.objAt(x + dx, z + dz); if (o && G.OBJ[o.t].chop >= 3) return false; } return true; };
    const nat = meta.fruit;
    for (let z = 0; z < seaZ; z++) for (let x = 0; x < W; x++) {
      const i = I(x, z), id = acre(x, z), d = G.ACRES[id]; const border = !d; let p = 0;
      if (border) p = (lvl[i] >= 3) ? .5 : .1; else p = { plaine: .035, foret: .17, verger: 0, jardin: .008, plateau: .05, colline: .06, montagne: .08, riviere: .045, riviere_h: .05, cascade: .05, lac: .02, etang: .035, place: 0, village: .02, maison: .025, boutique: .015, camping: .05, plage: .03, plage_rochers: .03, ponton: .02, phare: .02 }[id] || .03;
      if (r() >= p || !free(x, z, border ? 1 : 1)) continue;
      let t; const q = r();
      if (surf[i] === 5) t = 'palmier';
      else if (surf[i] === 8 || (border && lvl[i] >= 3 && q < .25)) t = 'sapin_neige';
      else if (border || lvl[i] >= 2 || (id === 'foret' && q < .35) || (id === 'montagne')) t = q < .85 ? 'sapin' : 'chene';
      else t = q < .52 ? 'chene' : q < .64 ? 'bouleau' : q < .74 ? 'cerisier' : q < .88 ? nat : 'sapin';
      map.addObj(t, x, z, 0, { f: G.OBJ[t].fruit ? 3 : 0 });
    }
    for (let az = 0; az < AR; az++) for (let ax = 0; ax < AC; ax++) {
      const id = layout[az][ax], d = G.ACRES[id], ox = B + ax * A, oz = B + az * A, rnd = (n) => [ox + 1 + Math.floor(r() * (A - 2)), oz + 1 + Math.floor(r() * (A - 2))];
      if (id === 'verger') for (let z = 2; z < A - 1; z += 4) for (let x = 2; x < A - 1; x += 4) if (free(ox + x, oz + z)) map.addObj(G.pick([nat, nat, 'pommier', 'oranger', 'pecher', 'cerisier'], r), ox + x, oz + z, 0, { f: 3 });
      const nfl = id === 'jardin' ? 4 : d.beach ? 0 : 2 + Math.floor(r() * 3);
      for (let c = 0; c < nfl; c++) { const [cx, cz] = rnd(); const t = G.pick(['tulipe_', 'fleur_'], r) + G.pick(['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'], r); for (let k = 0; k < 6; k++) { const x = cx + Math.floor(r() * 4) - 1, z = cz + Math.floor(r() * 3) - 1; if (free(x, z, 0)) map.addObj(t, x, z); } }
      const extras = [['mauvaise_herbe', d.beach ? 0 : 3], ['buisson', id === 'foret' ? 3 : 1], ['buisson_baies', id === 'foret' || id === 'verger' ? 2 : 0], ['hortensia', id === 'jardin' || id === 'etang' ? 3 : 0], ['rocher', d.mountain || d.hill || id === 'plateau' ? 3 : d.rocky ? 4 : r() < .4 ? 1 : 0], ['champignon', id === 'foret' ? 4 : 0], ['coquillage', d.beach ? 5 : 0], ['gros_rocher', d.mountain && r() < .6 ? 1 : 0]];
      for (const [t, n] of extras) for (let k = 0; k < n; k++) { for (let tries = 0; tries < 12; tries++) { const [x, z] = rnd(); if (t === 'coquillage' && surf[I(x, z)] !== 5) continue; if (free(x, z, 0) && map.canPlace(t, x, z)) { map.addObj(t, x, z); break; } } }
    }
    for (let k = 0; k < 5; k++) for (let tries = 0; tries < 30; tries++) { const x = B + Math.floor(r() * (W - 2 * B)), z = B + Math.floor(r() * (AR * A - 8)); if (surf[I(x, z)] <= 1 && free(x, z, 0)) { map.addObj('fissure', x, z); break; } }
    meta.spawn = meta.plaza || { x: W / 2, z: H / 2 };
    meta.seaZ = seaZ; meta.layout = layout; meta.seed = seed;
    G.emit('worldgen', map, { layout, seed, I, r });
    return map;
  };

  function astar(map, sx, sz, ex, ez) {
    const W = map.W, N = W * map.H, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = [];
    const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (; ;) { const l = 2 * k + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const s = sz * W + sx, e = ez * W + ex; g[s] = 0; push(0, s);
    while (heap.length) {
      const [, i] = pop(); if (done[i]) continue; done[i] = 1; if (i === e) break;
      const x = i % W, z = (i / W) | 0;
      for (const [dx, dz] of DIRS) {
        const nx = x + dx, nz = z + dz; if (nx < G.BORDER || nz < G.BORDER || nx >= W - G.BORDER || nz >= map.H) continue; const j = nz * W + nx;
        if (map.occ[j] && j !== e) continue; const dl = Math.abs(map.lvl[j] - map.lvl[i]); if (dl > 1 || (dl && (map.water[i] || map.water[j]))) continue; if (map.water[j] === 2) continue;
        let c = G.SURF[map.surf[j]].path ? .35 : 1; if (map.water[j]) c += 7; if (dl) c += 14; if (map.ramp[j] || map.ramp[i]) c += dl ? 40 : 2;
        const ng = g[i] + c; if (ng < g[j]) { g[j] = ng; from[j] = i; push(ng + (Math.abs(nx - ex) + Math.abs(nz - ez)) * .35, j); }
      }
    }
    if (from[e] < 0 && s !== e) return null; const path = []; for (let k = e; k >= 0; k = from[k]) { path.push(k); if (k === s) break; } return path.reverse();
  }
  function paveRoad(map, path, surfId, width) {
    const W = map.W;
    for (let k = 0; k < path.length; k++) {
      const i = path[k], x = i % W, z = (i / W) | 0, nxt = path[k + 1], prv = path[k - 1];
      const j = nxt != null ? nxt : prv, jx = j % W, jz = (j / W) | 0; const dx = nxt != null ? jx - x : x - jx, dz = nxt != null ? jz - z : z - jz;
      const tiles = [[x, z]]; if (width > 1) tiles.push([x + Math.abs(dz), z + Math.abs(dx)]);
      for (const [tx, tz] of tiles) { if (!map.inb(tx, tz)) continue; const t = tz * W + tx; if (map.occ[t] && !G.OBJ[map.objAt(tx, tz).t].walk) continue;
        if (map.water[t]) { if (!map.occ[t]) map.addObj('pont', tx, tz, dx !== 0 ? 1 : 0); } else if (!map.ramp[t] || map.surf[t] === 2) map.surf[t] = surfId; }
      if (nxt != null) { // marche de niveau : pente
        const L0 = map.lvl[i], L1 = map.lvl[nxt]; if (L0 === L1) continue;
        const lowI = L0 < L1 ? i : nxt, up = L0 < L1, ddx = up ? dx : -dx, ddz = up ? dz : -dz, lx = lowI % W, lz = (lowI / W) | 0;
        for (const [ox, oz] of width > 1 ? [[0, 0], [Math.abs(ddz), Math.abs(ddx)]] : [[0, 0]]) {
          const ax = lx + ox, az = lz + oz; if (!map.inb(ax, az)) continue; const a = az * W + ax; if (map.water[a] || map.occ[a]) continue;
          const bx = ax - ddx, bz = az - ddz, b = map.inb(bx, bz) ? bz * W + bx : -1;
          if (b >= 0 && map.lvl[b] === map.lvl[a] && !map.water[b] && !map.occ[b] && !map.ramp[b]) { map.ramp[a] = dirCode(ddx, ddz) * 4 + 1; map.ramp[b] = dirCode(ddx, ddz) * 4 + 2; map.surf[b] = surfId; }
          else map.ramp[a] = dirCode(ddx, ddz) * 4 + 3;
          map.surf[a] = surfId;
        }
      }
    }
  }

  // ---------- Intérieurs ----------
  const KINDS = {
    maison: { W: 8, H: 7, floor: 6, wall: 0xf7e6c8, trim: 0xd9a066 },
    villa: { W: 10, H: 8, floor: 6, wall: 0xe8eefc, trim: 0x8aa0d8 },
    cabane: { W: 7, H: 6, floor: 6, wall: 0xc9925c, trim: 0x8a5d38 },
    tente: { W: 5, H: 5, floor: 15, wall: 0xf3a25a, trim: 0xd8742a },
    habitant: { W: 7, H: 6, floor: 12, wall: 0xfde8ef, trim: 0xf08bb0 }
  };
  G.makeInterior = (kind, id, opt = {}) => {
    const K = KINDS[kind] || KINDS.maison, m = new G.GMap(K.W, K.H, { interior: true, kind, id });
    m.surf.fill(opt.floor != null ? opt.floor : K.floor); m.meta.shell = { wall: opt.wall || K.wall, trim: K.trim, kind };
    const dx = Math.floor(K.W / 2); m.addObj('paillasson', dx, K.H - 1);
    const P = (t, x, z, r = 0) => m.canPlace(t, x, z, r) && m.addObj(t, x, z, r);
    if (kind === 'tente') { P('sac_couchage', 1, 1); P('lanterne', 3, 1); P('caisse', 3, 3); P('tapis', 1, 3); }
    else if (kind === 'cabane') { P('lit', 1, 1); P('cheminee', 3, 0); P('table', 5, 3); P('chaise', 5, 4, 2); P('tonneau', 1, 4); }
    else if (kind === 'habitant') { P('lit', 1, 1); P('canape', 3, 1); P('lampe', 5, 1); P('table', 3, 3); P('plante', 5, 3); P('etagere', 1, 4); }
    else { P('lit', 1, 1); P('lampe', 2, 1); P('armoire', 6, 0); P('tapis', 3, 2); P('table', 5, 3); P('chaise', 6, 3, 3); P('plante', 6, 5); P('tv', 4, 0); P('etagere', 1, 4); }
    G.buildShell(m); m.buildAll(); return m;
  };
  G.buildShell = m => {
    const s = m.meta.shell || { wall: 0xf7e6c8, trim: 0xd9a066 }, b = G.mb(9), W = m.W, H = m.H, h = 3;
    b.box(W + .4, h, .2, s.wall, W / 2, h / 2, -.1); b.box(.2, h, H + .2, s.wall, -.1, h / 2, H / 2); b.box(.2, h, H + .2, s.wall, W + .1, h / 2, H / 2);
    b.box(W + .4, .22, .26, s.trim, W / 2, .11, -.05); b.box(.26, .22, H, s.trim, -.05, .11, H / 2); b.box(.26, .22, H, s.trim, W + .05, .11, H / 2);
    b.box(W + .4, .12, .28, s.trim, W / 2, h - .06, -.05);
    for (let k = 0; k < Math.floor(W / 3); k++) G.windowAt(b, 1.6 + k * 3, 1.7, .02, 0, .8, .7);
    b.box(W + .6, .3, H + .6, 0x3a2a1e, W / 2, -.18, H / 2);
    if (m.shell) m.group.remove(m.shell);
    m.shell = new THREE.Mesh(b.done(), G.MATS); m.shell.receiveShadow = true; m.shell.frustumCulled = false; m.group.add(m.shell);
  };
})();
