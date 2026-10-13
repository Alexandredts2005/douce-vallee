'use strict';
// ===== Un monde plus grand (taille au choix à la création : village seul, ×3, ×5 ou ×10) : au nord, à l'ouest et à l'est du village, de nouvelles terres (hautes montagnes, forêts, lacs,
// rivières qui descendent jusqu'au village ou jusqu'à la mer, hameaux reliés par des chemins, plages et phares).
// Les anciennes parties s'agrandissent : tout ce qui a été construit reste à sa place, le village se retrouve au sud, au bord de la mer. =====
(function () {
  const A = G.ACRE, B = G.BORDER;
  // tailles au choix à la création : largeur totale minimale, colonnes ajoutées autour du village, nombre total de rangées
  const SIZES = G.WORLD_SIZES = { petit: null, moyen: { tc: 30, ex: 8, tr: 14 }, grand: { tc: 34, ex: 12, tr: 22 }, immense: { tc: 46, ex: 24, tr: 32 } };
  const water = id => !!(G.ACRES[id] && G.ACRES[id].water);
  G.ACRES.hameau = { n: 'Hameau', col: '#eab89a', ico: '🏘️', lvl: 0, struct: 'hameau' };
  // hameau : une ruelle et quatre maisons de voisins (les habitants du village gardent leur maison)
  G.STRUCT.hameau = c => { const m = c.meta, k = m.nvi; m.nvi = 1e9; try { G.STRUCT.quartier(c); } finally { m.nvi = k; } };

  // ---------- le plan : le village d'origine (6 rangées) au sud, au milieu ; tout autour, des terres nouvelles ----------
  G.bigLayout = (core, seed, size = 'grand') => {
    const R = core.length, C = core[0].length, SZ = SIZES[size] === undefined ? SIZES.grand : SIZES[size]; if (R > 8 || !SZ) return core;
    const TR = SZ.tr, TC = Math.max(SZ.tc, C + SZ.ex), NR = TR - R, K = TC * TR / (46 * 32), OX = Math.floor((TC - C) / 2), r = G.rng((Math.imul(seed >>> 0, 0x9E3779B1) ^ 0x5bd1e995) >>> 0), s = (seed >>> 0) % 1000;
    const L = []; for (let z = 0; z < TR; z++) L.push(new Array(TC).fill(null));
    for (let z = 0; z < R; z++) for (let x = 0; x < C; x++) L[NR + z][OX + x] = core[z][x];
    const ok = (x, z) => x >= 0 && z >= 0 && x < TC && z < TR, free = (x, z) => ok(x, z) && L[z][x] == null, set = (x, z, id) => free(x, z) && (L[z][x] = id);
    // la gare garde une montagne dans son dos (le tunnel de la rue commerçante y est creusé)
    const gc = core[0].indexOf('gare'); if (gc >= 0) { set(OX + gc, NR - 1, 'montagne'); set(OX + gc + 1, NR - 1, 'foret'); }
    // rivières : celles du village remontent jusqu'à un lac de montagne ; deux autres descendent jusqu'à la mer, à l'ouest et à l'est
    const river = (x, z0, z1, x0, x1) => { let cx = x;
      for (let z = z1; z >= z0; z--) { set(cx, z, z === z0 ? 'lac' : 'riviere');
        if (z > z0 + 1 && z < z1 - 1 && r() < .32) { const nx = G.clamp(cx + (r() < .5 ? -1 : 1), x0, x1); if (nx !== cx && free(nx, z) && free(nx, z - 1)) { L[z][nx] = 'riviere'; cx = nx; } } } };
    for (let x = 0; x < C; x++) if (water(core[0][x])) river(OX + x, Math.min(NR - 2, 1 + Math.floor(r() * Math.max(1, NR * .22))), NR - 1, OX + x - 3, OX + x + 3);
    const wx = 1 + Math.floor(r() * Math.max(1, OX - 3)), ex = OX + C + 1 + Math.floor(r() * Math.max(1, TC - OX - C - 3));
    river(wx, 1 + Math.floor(r() * 3), TR - 2, 1, OX - 2); river(ex, 1 + Math.floor(r() * 3), TR - 2, OX + C + 1, TC - 2);
    // la côte continue : plages, criques rocheuses et un phare de chaque côté
    const ph = (a, b) => { for (let t = 0; t < 30; t++) { const x = a + Math.floor(r() * (b - a)); if (free(x, TR - 1) && !water(L[TR - 2][x])) { L[TR - 1][x] = 'phare'; return; } } };
    ph(1, OX - 1); ph(OX + C + 1, TC - 1);
    for (let x = 0; x < TC; x++) set(x, TR - 1, r() < .22 && !water(L[TR - 2][x]) ? 'plage_rochers' : 'plage');
    // lacs dans les vallées
    for (let k = 0, t = 0; k < Math.max(1, Math.round(5 * K)) && t < 200; t++) { const x = 1 + Math.floor(r() * (TC - 2)), z = 2 + Math.floor(r() * Math.max(1, NR - 4));
      if (!free(x, z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => ok(x + dx, z + dz) && water(L[z + dz][x + dx]))) continue; L[z][x] = 'lac'; if (r() < .5) set(x + 1, z, 'lac'); k++; }
    // relief : hautes montagnes au nord, collines et plateaux, puis forêts et prairies en descendant vers le village
    const elev = (x, z) => G.noise(x * .23 + s, z * .23, 811) * .55 + G.noise(x * .61, z * .61 + s, 812) * .25 + Math.pow(Math.max(0, 1 - z / (NR * .62)), 1.4) * .6 + Math.max(0, G.noise(x * .17 + s, z * .17, 814) - .7) * 1.6;
    // hameaux (avec vergers et jardins autour), loin les uns des autres
    const hams = [];
    for (let t = 0; t < 600 && hams.length < Math.max(2, Math.round(16 * K)); t++) { const x = 1 + Math.floor(r() * (TC - 2)), z = 3 + Math.floor(r() * (TR - 5));
      if (!free(x, z) || elev(x, z) > .74 || hams.some(h => Math.max(Math.abs(h[0] - x), Math.abs(h[1] - z)) < 5)) continue;
      if (z >= NR - 2 && x >= OX - 2 && x < OX + C + 2) continue;
      L[z][x] = 'hameau'; hams.push([x, z]); for (const [dx, dz] of [[1, 0], [-1, 0], [0, -1]]) if (r() < .55) set(x + dx, z + dz, G.pick(['verger', 'jardin', 'plaine', 'verger'], r)); }
    const LOW = ['plaine', 'plaine', 'plaine', 'foret', 'foret', 'foret', 'verger', 'jardin', 'etang', 'colline', 'plateau', 'plaine'];
    for (let z = 0; z < TR; z++) for (let x = 0; x < TC; x++) { if (L[z][x] != null) continue; const e = elev(x, z);
      L[z][x] = z === 0 ? (e > .9 || r() < .55 ? 'montagne' : 'foret') : e > .95 ? 'montagne' : e > .8 ? (G.noise(x * .4, z * .4, 813) > .5 ? 'colline' : 'plateau') : e > .68 ? 'foret' : G.pick(LOW, r); }
    return L;
  };

  // ---------- toutes les positions enregistrées glissent avec le village ----------
  const XK = new Set(['x', 'x0', 'x1', 'sx', 'stop']), ZK = new Set(['z', 'z0', 'z1', 'sz', 'seaZ']);
  const shiftMeta = (v, dx, dz) => { if (Array.isArray(v)) return v.map(q => shiftMeta(q, dx, dz)); if (!v || typeof v !== 'object') return v; const o = {};
    for (const k in v) { const x = v[k]; o[k] = typeof x === 'number' ? (XK.has(k) ? x + dx : ZK.has(k) ? x + dz : x) : k === 'signals' && Array.isArray(x) ? x.map(p => [p[0] + dx, p[1] + dz]) : shiftMeta(x, dx, dz); } return o; };
  // joueur, autres habitants de la partie, portes des maisons ; ce qui tombe hors de la carte revient au point de départ
  const moveSave = (d, dx, dz, ok, home) => {
    const mv = p => { if (!p || (p.map && p.map !== 'world')) return; if (typeof p.x === 'number') { p.x += dx; p.z += dz; if (ok && !ok(p.x, p.z)) { p.x = home.x; p.z = home.z; } }
      if (p.veh) { p.veh.x += dx; p.veh.z += dz; if (ok && !ok(p.veh.x, p.veh.z)) { p.veh.x = home.x; p.veh.z = home.z; } } };
    mv(d.player); for (const r of d.residents || []) if (r) mv(r.player);
    for (const id in d.interiors || {}) { const mt = d.interiors[id] && d.interiors[id].meta; if (mt && mt.door && (!mt.fromId || mt.fromId === 'world')) { mt.door.x += dx; mt.door.z += dz; } }
  };

  // ---------- une ancienne partie (village de 6 rangées) devient un grand monde ----------
  const isOld = w => w && w.kind === 'world' && w.meta && !w.meta.taille && Array.isArray(w.meta.layout) && w.meta.layout.length <= 8 && w.W === w.meta.layout[0].length * A + 2 * B && w.H === B + w.meta.layout.length * A + G.SEA;
  function grow(d) {
    const dw = d.world; if (!isOld(dw)) return false;
    const oL = dw.meta.layout, R = oL.length, C = oL[0].length, seed = (dw.meta.seed == null ? 1234 : dw.meta.seed) >>> 0;
    const L = G.bigLayout(oL, seed, 'grand'), TC = L[0].length, NR = L.length - R, OX = Math.floor((TC - C) / 2), dx = OX * A, dz = NR * A;
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
    const fm = fresh.meta, meta = shiftMeta(Object.assign({}, dw.meta, { layout: null }), dx, dz);
    const old = p => p && keep(Math.floor(p.x - dx), Math.floor(p.z - dz));
    meta.layout = L; meta.seed = seed; meta.seaZ = fm.seaZ; meta.monde10 = 1; meta.taille = 'grand';
    meta.homes = (meta.homes || []).concat((fm.homes || []).filter(h => !old(h) && !(meta.homes || []).some(q => q.vi === h.vi)));
    meta.npcs = (meta.npcs || []).concat((fm.npcs || []).filter(n => !old(n)));
    meta.quartiers = (meta.quartiers || []).concat((fm.quartiers || []).filter(q => !old(q)));
    fresh.meta = meta; d.world = fresh.serialize(); moveSave(d, dx, dz);
    return true;
  }
  G.growWorldSave = grow;

  // ---------- un monde déjà agrandi 10 fois est réduit de moitié (environ 5 fois l'ancien village) : on garde le village et ses alentours ----------
  function shrink(d) {
    const dw = d.world, M = dw && dw.meta; if (!M || dw.kind !== 'world' || M.taille || !Array.isArray(M.layout) || M.layout.length !== 32 || M.layout[0].length !== 46 || dw.W !== 46 * A + 2 * B || dw.H !== B + 32 * A + G.SEA) return false;
    const SZ = SIZES.grand, TCn = SZ.tc, TRn = SZ.tr, ax0 = (46 - TCn) / 2, az0 = 32 - TRn, ox = ax0 * A, oz = az0 * A, seed = (M.seed == null ? 1234 : M.seed) >>> 0, r = G.rng(seed + 5);
    const W0 = dw.W, W = TCn * A + 2 * B, H = B + TRn * A + G.SEA, seaZ = B + TRn * A, m = new G.GMap(W, H, { kind: 'world', id: 'world' });
    const lvl = G.b64.dec(dw.lvl, Int8Array), surf = G.b64.dec(dw.surf), wat = G.b64.dec(dw.water), ramp = G.b64.dec(dw.ramp);
    // nouvelle bordure de falaises tout autour, comme à la création d'un monde
    const BD = new Uint8Array(W * H);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x, j = (z + oz) * W0 + x + ox;
      if (z < seaZ) { const wx = x + (G.noise(x * .14, z * .14, seed) - .5) * 5, wz = z + (G.noise(x * .14 + 40, z * .14, seed + 1) - .5) * 5; BD[i] = wz < B || wx < B || wx >= W - B || x < 2 || x >= W - 2 || z < 2 ? 1 : 0; }
      if (BD[i]) { m.lvl[i] = 3; m.surf[i] = 1; m.water[i] = 0; m.ramp[i] = 0; } else { m.lvl[i] = lvl[j]; m.surf[i] = surf[j]; m.water[i] = wat[j]; m.ramp[i] = ramp[j]; } }
    for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) { const i = z * W + x; if (m.ramp[i] && (BD[i - 1] || BD[i + 1] || BD[i - W] || BD[i + W])) m.ramp[i] = 0; }
    const inB = (x, z) => x >= 0 && z >= 0 && x < W && z < H && !BD[z * W + x];
    const fits = (t, x0, z0, rot) => { const [w, h] = G.fpDims(G.OBJ[t], rot || 0); for (let z = z0; z < z0 + h; z++) for (let x = x0; x < x0 + w; x++) if (!inB(x, z)) return false; return true; };
    const lost = [];
    for (const e of dw.objs) { const D = G.OBJ[e.t]; if (!D) continue; const x = e.x - ox, z = e.z - oz, ex = Object.assign({}, e); delete ex.t; delete ex.x; delete ex.z; delete ex.r;
      if (fits(e.t, x, z, e.r)) m.addObj(e.t, x, z, e.r || 0, ex); else if (D.plane || e.t === 'montgolfiere' || /^home/.test(e.iid || '')) lost.push([e.t, ex]); }
    for (let z = 0; z < seaZ; z++) for (let x = 0; x < W; x++) if (BD[z * W + x] && r() < .3 && m.canPlace('sapin', x, z)) m.addObj(r() < .3 ? 'sapin_neige' : 'sapin', x, z);
    const meta = shiftMeta(Object.assign({}, M, { layout: null }), -ox, -oz), ins = p => p && p.x >= B && p.z >= B && p.x < W - B && p.z < seaZ + 2;
    for (const k of ['homes', 'npcs', 'quartiers', 'respawn']) if (Array.isArray(meta[k])) meta[k] = meta[k].filter(ins);
    meta.layout = M.layout.slice(az0).map(row => row.slice(ax0, ax0 + TCn)); meta.seaZ = seaZ; meta.taille = 'grand';
    // l'avion, la montgolfière ou une maison habitée restés au loin reviennent près de l'aérodrome (ou de la place)
    const home = meta.aerodrome || meta.spawn || { x: W / 2, z: seaZ / 2 };
    for (const [t, ex] of lost) { let done = false; for (let rr = 0; rr < 40 && !done; rr++) for (let a = 0; a < 16 && !done; a++) { const x = Math.round(home.x + Math.cos(a / 16 * 6.283) * rr), z = Math.round(home.z + Math.sin(a / 16 * 6.283) * rr); if (m.canPlace(t, x, z, 0)) { m.addObj(t, x, z, 0, ex); done = true; } } }
    m.meta = meta; d.world = m.serialize(); moveSave(d, -ox, -oz, (x, z) => inB(Math.floor(x), Math.floor(z)), meta.spawn || home);
    return true;
  }
  G.shrinkWorldSave = shrink;
  G.on('init', () => { const or = G.restore; G.restore = d => {
    let grown = false, shrunk = false;
    if (d && d.world) { if (G.expandWorldSave) { const w = G.expandWorldSave(d.world); if (w !== d.world) { d.world = w; d.ville2 = 1; } } try { grown = grow(d); if (!grown) shrunk = shrink(d); } catch (e) { console.error(e); } }
    const res = or(d);
    if (grown || shrunk) { setTimeout(() => G.ui.toast(grown ? '🗺️ Le monde s\'est agrandi ! Au nord, à l\'ouest et à l\'est : montagnes, lacs, forêts, rivières et hameaux t\'attendent. Ouvre la carte (M) !' : '🗺️ Le monde a été réduit de moitié : le village et ses alentours sont toujours là.', 9000), d.ville2 ? 9500 : 1800); setTimeout(() => G.state === 'play' && G.saveGame(true), 4000); }
    return res; }; });
  // la grande carte montre les hameaux
  G.on('init', () => { const U = G.ui, om = U.openMap; if (!om) return; U.openMap = () => { om(); const m = G.world, M = m.meta, cv = document.getElementById('bigmap'), c = cv && cv.getContext('2d'); if (!c || !M.layout || M.layout.length <= 8) return; const sc = cv.width / m.W;
    c.save(); c.font = '13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const L = M.layout;
    for (let az = 0; az < L.length; az++) for (let ax = 0; ax < L[0].length; ax++) if (L[az][ax] === 'hameau') c.fillText('🏘️', (B + ax * A + 8) * sc, (B + az * A + 8) * sc);
    c.restore(); }; });
})();
