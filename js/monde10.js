'use strict';
// ===== Un monde dix fois plus grand : au nord, à l'ouest et à l'est du village, de nouvelles terres (hautes montagnes, forêts, lacs,
// rivières qui descendent jusqu'au village ou jusqu'à la mer, hameaux reliés par des chemins, plages et phares).
// Les anciennes parties s'agrandissent : tout ce qui a été construit reste à sa place, le village se retrouve au sud, au bord de la mer. =====
(function () {
  const A = G.ACRE, B = G.BORDER, TR = 32, TCMIN = 46;
  const water = id => !!(G.ACRES[id] && G.ACRES[id].water);
  G.ACRES.hameau = { n: 'Hameau', col: '#eab89a', ico: '🏘️', lvl: 0, struct: 'hameau' };
  // hameau : une ruelle et quatre maisons de voisins (les habitants du village gardent leur maison)
  G.STRUCT.hameau = c => { const m = c.meta, k = m.nvi; m.nvi = 1e9; try { G.STRUCT.quartier(c); } finally { m.nvi = k; } };

  // ---------- le plan : le village d'origine (6 rangées) au sud, au milieu ; tout autour, des terres nouvelles ----------
  G.bigLayout = (core, seed) => {
    const R = core.length, C = core[0].length; if (R > 8) return core;
    const TC = Math.max(TCMIN, C + 24), NR = TR - R, OX = Math.floor((TC - C) / 2), r = G.rng((Math.imul(seed >>> 0, 0x9E3779B1) ^ 0x5bd1e995) >>> 0), s = (seed >>> 0) % 1000;
    const L = []; for (let z = 0; z < TR; z++) L.push(new Array(TC).fill(null));
    for (let z = 0; z < R; z++) for (let x = 0; x < C; x++) L[NR + z][OX + x] = core[z][x];
    const ok = (x, z) => x >= 0 && z >= 0 && x < TC && z < TR, free = (x, z) => ok(x, z) && L[z][x] == null, set = (x, z, id) => free(x, z) && (L[z][x] = id);
    // la gare garde une montagne dans son dos (le tunnel de la rue commerçante y est creusé)
    const gc = core[0].indexOf('gare'); if (gc >= 0) { set(OX + gc, NR - 1, 'montagne'); set(OX + gc + 1, NR - 1, 'foret'); }
    // rivières : celles du village remontent jusqu'à un lac de montagne ; deux autres descendent jusqu'à la mer, à l'ouest et à l'est
    const river = (x, z0, z1, x0, x1) => { let cx = x;
      for (let z = z1; z >= z0; z--) { set(cx, z, z === z0 ? 'lac' : 'riviere');
        if (z > z0 + 1 && z < z1 - 1 && r() < .32) { const nx = G.clamp(cx + (r() < .5 ? -1 : 1), x0, x1); if (nx !== cx && free(nx, z) && free(nx, z - 1)) { L[z][nx] = 'riviere'; cx = nx; } } } };
    for (let x = 0; x < C; x++) if (water(core[0][x])) river(OX + x, 2 + Math.floor(r() * 4), NR - 1, OX + x - 3, OX + x + 3);
    const wx = 2 + Math.floor(r() * (OX - 5)), ex = OX + C + 2 + Math.floor(r() * (TC - OX - C - 5));
    river(wx, 1 + Math.floor(r() * 3), TR - 2, 1, OX - 2); river(ex, 1 + Math.floor(r() * 3), TR - 2, OX + C + 1, TC - 2);
    // la côte continue : plages, criques rocheuses et un phare de chaque côté
    const ph = (a, b) => { for (let t = 0; t < 30; t++) { const x = a + Math.floor(r() * (b - a)); if (free(x, TR - 1) && !water(L[TR - 2][x])) { L[TR - 1][x] = 'phare'; return; } } };
    ph(1, OX - 1); ph(OX + C + 1, TC - 1);
    for (let x = 0; x < TC; x++) set(x, TR - 1, r() < .22 && !water(L[TR - 2][x]) ? 'plage_rochers' : 'plage');
    // lacs dans les vallées
    for (let k = 0, t = 0; k < 5 && t < 200; t++) { const x = 1 + Math.floor(r() * (TC - 2)), z = 7 + Math.floor(r() * (NR - 10));
      if (!free(x, z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => ok(x + dx, z + dz) && water(L[z + dz][x + dx]))) continue; L[z][x] = 'lac'; if (r() < .5) set(x + 1, z, 'lac'); k++; }
    // relief : hautes montagnes au nord, collines et plateaux, puis forêts et prairies en descendant vers le village
    const elev = (x, z) => G.noise(x * .23 + s, z * .23, 811) * .55 + G.noise(x * .61, z * .61 + s, 812) * .25 + Math.pow(Math.max(0, 1 - z / (NR * .62)), 1.4) * .6 + Math.max(0, G.noise(x * .17 + s, z * .17, 814) - .7) * 1.6;
    // hameaux (avec vergers et jardins autour), loin les uns des autres
    const hams = [];
    for (let t = 0; t < 600 && hams.length < 16; t++) { const x = 1 + Math.floor(r() * (TC - 2)), z = 3 + Math.floor(r() * (TR - 5));
      if (!free(x, z) || elev(x, z) > .74 || hams.some(h => Math.max(Math.abs(h[0] - x), Math.abs(h[1] - z)) < 5)) continue;
      if (z >= NR - 2 && x >= OX - 2 && x < OX + C + 2) continue;
      L[z][x] = 'hameau'; hams.push([x, z]); for (const [dx, dz] of [[1, 0], [-1, 0], [0, -1]]) if (r() < .55) set(x + dx, z + dz, G.pick(['verger', 'jardin', 'plaine', 'verger'], r)); }
    const LOW = ['plaine', 'plaine', 'plaine', 'foret', 'foret', 'foret', 'verger', 'jardin', 'etang', 'colline', 'plateau', 'plaine'];
    for (let z = 0; z < TR; z++) for (let x = 0; x < TC; x++) { if (L[z][x] != null) continue; const e = elev(x, z);
      L[z][x] = z === 0 ? (e > .9 || r() < .55 ? 'montagne' : 'foret') : e > .95 ? 'montagne' : e > .8 ? (G.noise(x * .4, z * .4, 813) > .5 ? 'colline' : 'plateau') : e > .68 ? 'foret' : G.pick(LOW, r); }
    return L;
  };

  // ---------- une ancienne partie (village de 6 rangées) devient un grand monde ----------
  const isOld = w => w && w.kind === 'world' && w.meta && Array.isArray(w.meta.layout) && w.meta.layout.length <= 8 && w.W === w.meta.layout[0].length * A + 2 * B && w.H === B + w.meta.layout.length * A + G.SEA;
  const XK = new Set(['x', 'x0', 'x1', 'sx', 'stop']), ZK = new Set(['z', 'z0', 'z1', 'sz', 'seaZ']);
  function grow(d) {
    const dw = d.world; if (!isOld(dw)) return false;
    const oL = dw.meta.layout, R = oL.length, C = oL[0].length, seed = (dw.meta.seed == null ? 1234 : dw.meta.seed) >>> 0;
    const L = G.bigLayout(oL, seed), TC = L[0].length, NR = L.length - R, OX = Math.floor((TC - C) / 2), dx = OX * A, dz = NR * A;
    const fresh = G.genWorld(L, seed), W0 = dw.W, H0 = dw.H, W = fresh.W, seaZ0 = B + R * A;
    const lvl = G.b64.dec(dw.lvl, Int8Array), surf = G.b64.dec(dw.surf), wat = G.b64.dec(dw.water), ramp = G.b64.dec(dw.ramp);
    // l'ancienne bordure de falaises (la même que lors de la création) disparaît, sauf derrière la gare (tunnel de la rue commerçante)
    const border = (x, z) => { if (z >= seaZ0) return false; const wx = x + (G.noise(x * .14, z * .14, seed) - .5) * 5, wz = z + (G.noise(x * .14 + 40, z * .14, seed + 1) - .5) * 5; return wz < B || wx < B || wx >= W0 - B || x < 2 || x >= W0 - 2 || z < 2; };
    const gc = oL[0].indexOf('gare'), sx0 = gc >= 0 ? B + gc * A - 1 : -99, sx1 = sx0 + A + 1;
    const K = new Uint8Array(W0 * H0); for (let z = 0; z < H0; z++) for (let x = 0; x < W0; x++) K[z * W0 + x] = (x >= sx0 && x <= sx1 && z < seaZ0) || !border(x, z) ? 1 : 0;
    const keep = (x, z) => x >= 0 && z >= 0 && x < W0 && z < H0 && K[z * W0 + x] === 1;
    for (let z = 0; z < H0; z++) for (let x = 0; x < W0; x++) if (K[z * W0 + x]) { const i = z * W0 + x, j = (z + dz) * W + x + dx; fresh.lvl[j] = lvl[i]; fresh.surf[j] = surf[i]; fresh.water[j] = wat[i]; fresh.ramp[j] = ramp[i]; }
    const cells = (t, x0, z0, rot, f) => { const [w, h] = G.fpDims(G.OBJ[t], rot || 0); for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) if (f(keep(x, z))) return true; return false; };
    for (const o of [...fresh.list]) if (cells(o.t, o.x - dx, o.z - dz, o.r, k => k)) fresh.removeObj(o);
    for (const e of dw.objs) { if (!G.OBJ[e.t] || cells(e.t, e.x, e.z, e.r, k => !k)) continue; const ex = Object.assign({}, e); delete ex.t; delete ex.x; delete ex.z; delete ex.r; fresh.addObj(e.t, e.x + dx, e.z + dz, e.r || 0, ex); }
    // toutes les positions enregistrées glissent avec le village
    const sh = v => { if (Array.isArray(v)) return v.map(sh); if (!v || typeof v !== 'object') return v; const o = {};
      for (const k in v) { const x = v[k]; o[k] = typeof x === 'number' ? (XK.has(k) ? x + dx : ZK.has(k) ? x + dz : x) : k === 'signals' && Array.isArray(x) ? x.map(p => [p[0] + dx, p[1] + dz]) : sh(x); } return o; };
    const fm = fresh.meta, meta = sh(Object.assign({}, dw.meta, { layout: null }));
    const old = p => p && keep(Math.floor(p.x - dx), Math.floor(p.z - dz));
    meta.layout = L; meta.seed = seed; meta.seaZ = fm.seaZ; meta.monde10 = 1;
    meta.homes = (meta.homes || []).concat((fm.homes || []).filter(h => !old(h) && !(meta.homes || []).some(q => q.vi === h.vi)));
    meta.npcs = (meta.npcs || []).concat((fm.npcs || []).filter(n => !old(n)));
    meta.quartiers = (meta.quartiers || []).concat((fm.quartiers || []).filter(q => !old(q)));
    fresh.meta = meta; d.world = fresh.serialize();
    const mv = p => { if (!p || (p.map && p.map !== 'world')) return; if (typeof p.x === 'number') { p.x += dx; p.z += dz; } if (p.veh) { p.veh.x += dx; p.veh.z += dz; } };
    mv(d.player); for (const r of d.residents || []) if (r) mv(r.player);
    for (const id in d.interiors || {}) { const mt = d.interiors[id] && d.interiors[id].meta; if (mt && mt.door && (!mt.fromId || mt.fromId === 'world')) { mt.door.x += dx; mt.door.z += dz; } }
    return true;
  }
  G.growWorldSave = grow;
  G.on('init', () => { const or = G.restore; G.restore = d => {
    let grown = false;
    if (d && d.world) { if (G.expandWorldSave) { const w = G.expandWorldSave(d.world); if (w !== d.world) { d.world = w; d.ville2 = 1; } } try { grown = grow(d); } catch (e) { console.error(e); } }
    const res = or(d);
    if (grown) { setTimeout(() => G.ui.toast('🗺️ Le monde est devenu immense ! Au nord, à l\'ouest et à l\'est : hautes montagnes, lacs, forêts, rivières et hameaux t\'attendent. Ouvre la carte (M) !', 9000), d.ville2 ? 9500 : 1800); setTimeout(() => G.state === 'play' && G.saveGame(true), 4000); }
    return res; }; });
  // la grande carte montre les hameaux
  G.on('init', () => { const U = G.ui, om = U.openMap; if (!om) return; U.openMap = () => { om(); const m = G.world, M = m.meta, cv = document.getElementById('bigmap'), c = cv && cv.getContext('2d'); if (!c || !M.layout || M.layout.length <= 8) return; const sc = cv.width / m.W;
    c.save(); c.font = '13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const L = M.layout;
    for (let az = 0; az < L.length; az++) for (let ax = 0; ax < L[0].length; ax++) if (L[az][ax] === 'hameau') c.fillText('🏘️', (B + ax * A + 8) * sc, (B + az * A + 8) * sc);
    c.restore(); }; });
})();
