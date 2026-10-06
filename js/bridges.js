'use strict';
// ===== Ponts d'une rive à l'autre : 2 cases de large, 9 styles (bois, rondins, suspendu, pierre arrondie, briques, zen, zen rouge, moderne, conte de fées) =====
(function () {
  const MD = G.MODELS, MAXL = 8, AP = .5; // AP : débord du tablier sur chaque berge
  // profil du tablier (hauteur du dessus) le long du pont : arche sur l'eau, petite rampe sur les berges
  const profile = (k, a, top) => { const h = k / 2; return z => { const az = Math.abs(z); return az <= h ? top + a * Math.cos(Math.PI * z / k) : Math.max(.02, top - (top - .02) * (az - h) / AP); }; };
  // découpe [z0,z1] en n morceaux qui suivent le profil : fn(zc, yc, longueur, pente, i)
  const along = (z0, z1, n, pf, fn) => { for (let i = 0; i < n; i++) { const a = z0 + i / n * (z1 - z0), c = a + (z1 - z0) / n, ya = pf(a), yc = pf(c); fn((a + c) / 2, (ya + yc) / 2, Math.hypot(c - a, yc - ya), Math.atan2(yc - ya, c - a), i); } };
  const sbox = (b, w, h, len, col, x, y, z, ang, mat = 0) => b.geo(new THREE.BoxGeometry(w, h, len + .012), col, b.M(x, y, z, -ang, 0, 0), mat);
  const posts = (L, step) => { const n = Math.max(1, Math.round((L - .3) / step)), out = []; for (let i = 0; i <= n; i++) out.push(-L / 2 + .15 + i * (L - .3) / n); return out; };
  // arche de pierre sous le tablier, vue de côté
  function stoneSides(b, k, L, pf, a, top, c) {
    const R = k / 2, y0 = -.45, sy = (a + top + .1) / R, ring = z => Math.abs(z) < R ? y0 + sy * Math.sqrt(R * R - z * z) : y0;
    for (const x of [-.93, .93]) {
      along(-L / 2, L / 2, 18, pf, (z, y, len, ang) => { const bot = y - .26, r = ring(z); if (bot > r + .03) b.box(.2, bot - r, len, c.wall, x, (bot + r) / 2, z); });
      b.add(new THREE.TorusGeometry(R, .11, 5, 18, Math.PI), c.ring, b.M(x, y0, 0, 0, Math.PI / 2, 0, 1, sy, 1), 0, true);
    }
  }
  const STY = {
    bois: { n: 'Pont en bois', arch: 0, top: .11, buy: 2400, build(b, k, L, pf) {
      along(-L / 2, L / 2, Math.round(L * 5), pf, (z, y, len, ang, i) => sbox(b, 2.04, .07, len - .03, i & 1 ? 0xb98250 : 0xc8925e, 0, y - .035, z, ang));
      for (const x of [-.72, .72]) b.box(.14, .14, L, 0x6b4426, x, .11 - .14, 0);
      for (let z = -k / 2 + 1; z < k / 2 - .4; z += 2) for (const x of [-.8, .8]) b.cyl(.09, .1, 1.05, 7, 0x6b4426, x, -.55, z);
      for (const x of [-.97, .97]) { for (const z of posts(L, 1)) { b.box(.11, .78, .11, 0x85552f, x, pf(z) + .37, z); b.box(.15, .05, .15, 0x6b4426, x, pf(z) + .78, z); }
        b.box(.08, .07, L - .3, 0x9a6a40, x, .11 + .72, 0); b.box(.06, .06, L - .3, 0x9a6a40, x, .11 + .42, 0); } } },
    rondins: { n: 'Pont en rondins', arch: 0, top: .13, buy: 1800, build(b, k, L, pf) {
      along(-L / 2, L / 2, Math.round(L / .22), pf, (z, y, len, ang, i) => { const c = [0x7e5230, 0x9a6a40, 0x8a5a34][i % 3]; b.geo(new THREE.CylinderGeometry(.11, .11, 2.1, 7), c, b.M(0, y - .11, z, -ang, 0, Math.PI / 2));
        for (const x of [-1.05, 1.05]) b.cyl(.095, .095, .02, 7, 0xd9b382, x, y - .11, z, 0, 0, Math.PI / 2); });
      for (const x of [-.55, .55]) b.geo(new THREE.CylinderGeometry(.13, .13, L, 7), 0x6b4426, b.M(x, -.2, 0, Math.PI / 2, 0, 0));
      const ps = k >= 3 ? [-L / 2 + .2, 0, L / 2 - .2] : [-L / 2 + .2, L / 2 - .2];
      for (const x of [-1.02, 1.02]) { for (const z of ps) { b.cyl(.07, .085, .95, 6, 0x7a5236, x, pf(z) + .4, z); b.cyl(.075, .075, .02, 6, 0xd9b382, x, pf(z) + .88, z); }
        b.box(.035, .035, L - .4, 0xd9c79a, x, .13 + .7, 0); b.box(.03, .03, L - .4, 0xd9c79a, x, .13 + .4, 0); } } },
    suspendu: { n: 'Pont suspendu', arch: -.18, top: .06, buy: 3200, build(b, k, L, pf) {
      along(-L / 2, L / 2, Math.round(L / .2), pf, (z, y, len, ang, i) => sbox(b, 1.75, .05, len * .78, i & 1 ? 0xc69c68 : 0xb88c58, 0, y - .025, z, ang));
      for (const x of [-.8, .8]) along(-L / 2, L / 2, 12, pf, (z, y, len, ang) => sbox(b, .04, .04, len, 0xd9c79a, x, y - .07, z, ang));
      const zt = L / 2 - .08, ty = 1.5, low = pf(0) + .85, rope = z => ty - (ty - low) * (1 - (z / zt) * (z / zt));
      for (const z of [-zt, zt]) { for (const x of [-1, 1]) { b.box(.14, 1.65, .14, 0x7a4b2a, x, .82, z); b.cone(.12, .18, 4, 0x5a3a22, x, 1.74, z, 0, Math.PI / 4); } b.box(2.14, .1, .12, 0x6b4426, 0, 1.58, z); }
      for (const x of [-1, 1]) { along(-zt, zt, 14, rope, (z, y, len, ang) => sbox(b, .035, .035, len, 0xe8d29a, x, y, z, ang));
        for (let i = 1; i < 10; i++) { const z = -zt + i / 10 * 2 * zt, top = rope(z), bot = pf(z); b.box(.02, top - bot, .02, 0xe8d29a, x * .9, (top + bot) / 2, z); } } } },
    pierre: { n: 'Pont de pierre arrondi', arch: .4, top: .12, buy: 5600, build(b, k, L, pf, a) {
      b.jit(.09); along(-L / 2, L / 2, 18, pf, (z, y, len, ang, i) => { sbox(b, 2.0, .26, len, i & 1 ? 0xaea594 : 0xb8af9d, 0, y - .13, z, ang);
        for (const x of [-.93, .93]) { sbox(b, .22, .4, len, 0xa39a88, x, y + .2, z, ang); sbox(b, .3, .07, len, 0xcdc4b2, x, y + .43, z, ang); } });
      stoneSides(b, k, L, pf, a, .12, { wall: 0x9a917f, ring: 0x857c6b }); b.jit(0);
      for (const z of [-L / 2 + .14, L / 2 - .14]) for (const x of [-.93, .93]) { b.box(.32, .95, .32, 0xb0a795, x, .47, z); b.box(.38, .07, .38, 0xcdc4b2, x, .97, z); b.sph(.12, 0xcdc4b2, x, 1.1, z); } } },
    brique: { n: 'Pont en briques', arch: .35, top: .12, buy: 5600, build(b, k, L, pf, a) {
      b.jit(.12); along(-L / 2, L / 2, 18, pf, (z, y, len, ang, i) => { sbox(b, 2.0, .26, len, i & 1 ? 0xb4553d : 0xa84f39, 0, y - .13, z, ang); sbox(b, 1.3, .015, len, 0xc9b9a0, 0, y - .002, z, ang);
        for (const x of [-.93, .93]) { sbox(b, .22, .4, len, 0xb95a40, x, y + .2, z, ang); sbox(b, .3, .07, len, 0xefe6d8, x, y + .43, z, ang); } });
      stoneSides(b, k, L, pf, a, .12, { wall: 0xa34a35, ring: 0x8e3f2c }); b.jit(0);
      for (const z of [-L / 2 + .14, L / 2 - .14]) for (const x of [-.93, .93]) { b.box(.32, .95, .32, 0xb95a40, x, .47, z); b.box(.38, .07, .38, 0xefe6d8, x, .97, z);
        b.cyl(.02, .02, .25, 4, 0x2a2a2a, x, 1.12, z); b.sph(.1, 0xfff1b8, x, 1.3, z, 1, 1.2, 1, 1); b.cone(.13, .12, 6, 0x2a2a2a, x, 1.47, z); } } },
    zen: { n: 'Pont zen', arch: .45, top: .1, buy: 7200, build(b, k, L, pf, a) { zenBridge(b, k, L, pf, a, { deck: [0xa87a4a, 0xb88a58], rail: 0x5a3a22, beam: 0x6b4a2e, cap: 0x3a2a1a }); } },
    rouge: { n: 'Pont zen rouge', arch: .45, top: .1, buy: 8400, build(b, k, L, pf, a) { zenBridge(b, k, L, pf, a, { deck: [0x9a5a3a, 0x8e5234], rail: 0xd8342c, beam: 0xc22e27, cap: 0x2a2a2a, giboshi: 1 }); } },
    moderne: { n: 'Pont moderne', arch: 0, top: .11, buy: 8400, build(b, k, L, pf) {
      b.box(2.06, .14, L, 0x9aa2ab, 0, .04, 0); for (let z = -L / 2 + .25; z < L / 2; z += .5) b.box(2.0, .01, .05, 0x7a828c, 0, .115, z);
      b.box(1.3, .3, L, 0x6a727c, 0, -.2, 0); if (k >= 3) b.box(.5, 1.0, .5, 0x8a929c, 0, -.75, 0);
      for (const x of [-.98, .98]) { b.box(.04, .62, L - .3, 0xbfe6fa, x, .45, 0, 0, 0, 0, 2); b.box(.07, .05, L - .2, 0xdfe3e8, x, .8, 0); b.box(.02, .02, L - .3, 0xcff4ff, x * .97, .74, 0, 0, 0, 0, 1);
        for (const z of posts(L, 1)) b.box(.05, .72, .05, 0xdfe3e8, x, .45, z); } } },
    conte: { n: 'Pont de conte de fées', arch: .3, top: .1, buy: 12000, build(b, k, L, pf) {
      along(-L / 2, L / 2, 18, pf, (z, y, len, ang) => { sbox(b, 1.95, .12, len, 0xfaf6f0, 0, y - .06, z, ang); sbox(b, 1.1, .012, len, 0xf6b8cc, 0, y - .002, z, ang); for (const x of [-.95, .95]) sbox(b, .1, .06, len, 0xf3d77a, x, y + .56, z, ang); });
      for (const x of [-.95, .95]) { for (let z = -L / 2 + .2; z < L / 2 - .1; z += .32) b.cyl(.035, .05, .52, 6, 0xffffff, x, pf(z) + .27, z);
        along(-L / 2 + .3, L / 2 - .3, Math.max(2, k * 2), pf, (z, y) => b.add(new THREE.TorusGeometry(.09, .018, 4, 10), 0xf3d77a, b.M(x, y + .36, z, 0, Math.PI / 2, 0), 0, true)); }
      for (const z of [-L / 2 + .12, L / 2 - .12]) for (const x of [-.95, .95]) { b.box(.2, .85, .2, 0xffffff, x, .42, z); b.sph(.09, 0xf3d77a, x, .92, z); b.ico(.1, 0, 0xff9fc0, x, 1.08, z); b.sph(.07, 0xfff1d0, x, 1.24, z, 1, 1, 1, 1); } } }
  };
  function zenBridge(b, k, L, pf, a, c) {
    along(-L / 2, L / 2, 22, pf, (z, y, len, ang, i) => sbox(b, 1.9, .07, len - .02, c.deck[i & 1], 0, y - .035, z, ang));
    for (const x of [-.75, .75]) along(-L / 2, L / 2, 10, pf, (z, y, len, ang) => sbox(b, .12, .16, len, c.beam, x, y - .15, z, ang));
    if (k >= 3) for (const x of [-.75, .75]) { const top = pf(0) - .2; b.box(.14, top + .9, .14, c.beam, x, (top - .9) / 2, 0); }
    for (const x of [-.95, .95]) {
      along(-L / 2 + .1, L / 2 - .1, 14, pf, (z, y, len, ang) => { sbox(b, .09, .07, len, c.rail, x, y + .66, z, ang); sbox(b, .06, .05, len, c.rail, x, y + .36, z, ang); });
      for (const z of posts(L, .7)) { const y = pf(z); b.box(.09, .7, .09, c.rail, x, y + .33, z); if (c.giboshi) { b.sph(.065, c.cap, x, y + .74, z); b.cone(.035, .09, 6, c.cap, x, y + .83, z); } else b.box(.12, .04, .12, c.cap, x, y + .7, z); }
    }
  }
  G.BRIDGE_TYPES = STY;
  const types = Object.keys(STY), archOf = (t, k) => STY[t].arch * Math.min(1, k / 3);
  for (const t of types) {
    MD['pont2_' + t] = k => { k = Math.max(1, k); const L = k + 2 * AP, a = archOf(t, k), b = G.mb(400 + k); STY[t].build(b, k, L, profile(k, a, STY[t].top), a); return b.done(); };
    for (let k = 1; k <= MAXL; k++) {
      const a = archOf(t, k), pf = profile(k, a, STY[t].top);
      G.OBJ['pont_' + t + '_' + k] = { id: 'pont_' + t + '_' + k, n: STY[t].n, model: 'pont2_' + t, v: k, fp: [2, k], h: STY[t].top, walk: 1, onWater: 1, take: 1, bridge: t, cat: 'construction',
        hAt: a ? (o, x, z, m) => { const [cx, cz] = m.center(o); return pf(G.clamp((o.r & 1) ? x - cx : z - cz, -k / 2, k / 2)); } : null };
    }
    G.ITEMS['pont_' + t] = { id: 'pont_' + t, n: STY[t].n, kind: 'bridge', bridge: t, ico: '🌉', thumb: 'obj:pont_' + t + '_3', cat: 'construction', buy: STY[t].buy, sell: Math.round(STY[t].buy / 4), stack: 9,
      desc: 'Face à une rivière : pose un pont de 2 cases de large, d\'une rive à l\'autre (jusqu\'à ' + MAXL + ' cases).' };
  }
  // l'ancien petit pont devient un vrai pont en bois
  if (G.ITEMS.pont) Object.assign(G.ITEMS.pont, G.ITEMS.pont_bois, { id: 'pont', cat: 'ancien' });
  for (const t of types) if (!G.SHOPLIST.includes('pont_' + t)) G.SHOPLIST.push('pont_' + t);
  G.RECIPES.forEach(r => { if (r.id === 'pont') { r.id = 'pont_bois'; r.need = { bois: 12 }; delete r.n; } });
  G.RECIPES.push({ id: 'pont_rondins', need: { bois: 10 } }, { id: 'pont_suspendu', need: { bois: 8, herbe: 10 } }, { id: 'pont_pierre', need: { pierre: 16, bois: 2 } }, { id: 'pont_brique', need: { pierre: 20, fer: 2 } });

  // ---------- pose : on mesure la rivière devant soi ----------
  const dom = p => { const [fx, fz] = p.facing(); return Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz)]; };
  const BR = G.bridges = {
    types, MAXL,
    measure(m, sx, sz, dx, dz) {
      if (!m.inb(sx, sz) || m.isWaterT(sx, sz) || !m.isWaterT(sx + dx, sz + dz)) return null;
      const L0 = m.lvl[m.idx(sx, sz)]; let k = 0;
      while (k <= MAXL && m.isWaterT(sx + dx * (k + 1), sz + dz * (k + 1))) { const i = m.idx(sx + dx * (k + 1), sz + dz * (k + 1)); if (m.water[i] === 2) return { err: 'Pas de pont sur la mer !' }; if (m.lvl[i] !== L0) return { err: 'L\'eau est plus basse que la berge ici.' }; k++; }
      if (k > MAXL) return { err: 'Trop large pour un pont (' + MAXL + ' cases maximum) !' };
      const lx = sx + dx * (k + 1), lz = sz + dz * (k + 1);
      if (!m.inb(lx, lz) || m.lvl[m.idx(lx, lz)] !== L0) return { err: 'L\'autre rive n\'est pas au même niveau.' };
      return { k };
    },
    // une voie : depuis (x,z), avance jusqu'à la berge (2 cases max, ou recule d'une si on part de l'eau) puis mesure la traversée
    lane(m, x, z, dx, dz) {
      let t = 0; if (m.isWaterT(x, z)) { if (!m.inb(x - dx, z - dz) || m.isWaterT(x - dx, z - dz)) return null; t = -1; }
      else while (t < 3 && m.inb(x + dx * (t + 1), z + dz * (t + 1)) && !m.isWaterT(x + dx * (t + 1), z + dz * (t + 1))) t++;
      if (t >= 3) return null; const bx = x + dx * t, bz = z + dz * t, r = this.measure(m, bx, bz, dx, dz); if (!r || r.err) return r;
      return { t, k: r.k, L: m.lvl[m.idx(bx, bz)] };
    },
    // le pont tient-il ici ? chaque case : libre, au niveau des berges, en eau douce ou en terre ferme plate
    fits(m, id, ax, az, rot, L0) {
      const [w, dd] = G.fpDims(G.OBJ[id], rot); let wet = 0;
      for (let z = az; z < az + dd; z++) for (let x = ax; x < ax + w; x++) { if (x < 2 || z < 2 || x >= m.W - 2 || z >= m.H - 2) return false; const i = m.idx(x, z);
        if (m.occ[i] || m.lvl[i] !== L0 || m.water[i] === 2 || (!m.water[i] && m.ramp[i])) return false; if (m.water[i]) wet++; }
      return wet > 0;
    },
    // pont de 2 voies : la voie A et sa voisine (côté s) ; t compté depuis (sx,sz) dans la direction (dx,dz)
    span(m, sx, sz, dx, dz, A, s, type) {
      const B = this.lane(m, sx + (dz ? s : 0), sz + (dx ? s : 0), dx, dz); if (!B || B.err || B.L !== A.L) return null;
      const t0 = Math.min(A.t, B.t) + 1, t1 = Math.max(A.t + A.k, B.t + B.k), K = t1 - t0 + 1; if (K > MAXL) return null;
      let ax, az; if (dz) { ax = Math.min(sx, sx + s); az = dz > 0 ? sz + t0 : sz - t1; } else { az = Math.min(sz, sz + s); ax = dx > 0 ? sx + t0 : sx - t1; }
      const id = 'pont_' + type + '_' + K, rot = dz ? 0 : 1; return this.fits(m, id, ax, az, rot, A.L) ? { ok: 1, id, ax, az, rot, k: K } : null;
    },
    plan(it, p, m) {
      const [dx, dz] = dom(p), sx = Math.floor(p.x), sz = Math.floor(p.z), A = this.lane(m, sx, sz, dx, dz);
      if (!A) return { err: 'Mets-toi au bord d\'une rivière, face à l\'eau, pour poser le pont.' };
      const tx = sx + dx * ((A.t || 0) + 1), tz = sz + dz * ((A.t || 0) + 1); if (A.err) return { err: A.err, tx, tz };
      const fr = dz ? p.x - sx : p.z - sz;
      for (const s of fr >= .5 ? [1, -1] : [-1, 1]) { const r = this.span(m, sx, sz, dx, dz, A, s, it.bridge); if (r) return r; }
      return { err: 'Il faut 2 voies d\'eau côte à côte, sans rien dessus, et la même hauteur de berge en face.', tx, tz };
    },
    place(it) {
      const p = G.player, m = G.map; if (m.interior) { G.sfx('error'); return G.ui.toast('Un pont dans la maison ? Essaie plutôt dehors !'); }
      const pl = this.plan(it, p, m); if (!pl.ok) { G.sfx('error'); return G.ui.toast(pl.err); }
      if (!G.inv.useHeld(1)) return; const o = m.addObj(pl.id, pl.ax, pl.az, pl.rot), [cx, cz] = m.center(o);
      G.sfx('place'); G.sfx('craft'); G.cam.shake(.06); for (let i = 0; i <= pl.k; i++) { const t = i / Math.max(1, pl.k) - .5; G.fx.puff(cx + (pl.rot ? t * pl.k : 0), o.y + .25, cz + (pl.rot ? 0 : t * pl.k), 6, 0xf3ead2, .8); }
      p.act = { kind: 'place', t: 0, dur: .3, hitAt: 1, done: true }; G.ui.toast(STY[it.bridge].n + ' posé ! (' + pl.k + ' case' + (pl.k > 1 ? 's' : '') + ' de long)');
    },
    // les petits ponts d'une case (routes générées, anciennes parties) deviennent des ponts de 2 de large
    convert(map, r = Math.random) {
      const seen = new Set(), D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; let n = 0;
      for (const o of [...map.list]) {
        if (o.t !== 'pont' || seen.has(o)) continue; const grp = [], st = [o]; seen.add(o);
        while (st.length) { const c = st.pop(); grp.push(c); for (const [dx, dz] of D4) { const q = map.objAt(c.x + dx, c.z + dz); if (q && q.t === 'pont' && !seen.has(q)) { seen.add(q); st.push(q); } } }
        const xs = grp.map(g => g.x), zs = grp.map(g => g.z), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
        const ns = grp.filter(g => !(g.r & 1)).length * 2 >= grp.length, l0 = ns ? x0 : z0, l1 = ns ? x1 : z1; if (l1 - l0 > 1) continue;
        const type = G.pick(['bois', 'pierre', 'bois', 'rondins', 'brique', 'zen'], r), [dx, dz] = ns ? [0, 1] : [1, 0];
        for (const g of grp) map.removeObj(g);
        let ok = false;
        for (const a of l1 > l0 ? [l0] : [l0, l0 - 1]) { // voies a et a+1
          const sx = ns ? a : x0 - 1, sz = ns ? z0 - 1 : a, A = this.lane(map, sx, sz, dx, dz); if (!A || A.err) continue;
          const pl = this.span(map, sx, sz, dx, dz, A, 1, type); if (pl) { map.addObj(pl.id, pl.ax, pl.az, pl.rot); ok = true; n++; break; }
        }
        if (!ok) for (const g of grp) map.addObj('pont', g.x, g.z, g.r);
      }
      map.meta.br2 = 1; return n;
    }
  };
  const ou = G.act.use; G.act.use = () => {
    const p = G.player, it = G.inv.held();
    if (it && it.kind === 'bridge' && !p.dead && !p.sit && !p.fish && !p.act && !p.charging && !p.vault && !p.vehicle && !p.show) { if (p.swim) return G.ui.toast('Impossible en nageant ! Sors de l\'eau d\'abord.'); const [tx, tz] = p.target(); G.act.lastKey = tx + ',' + tz; G.act.cd = .3; return BR.place(it); }
    return ou();
  };
  // ranger un pont rend l'objet du pont (pas question de le retirer si on est dessus)
  const ot = G.act.take; G.act.take = () => {
    const p = G.player; if (p.act || p.sit || p.fish || p.dead) return ot();
    const m = G.map, [tx, tz] = p.target(), o = m.objAt(tx, tz), d = o && G.OBJ[o.t]; if (!d || !(d.bridge || o.t === 'pont')) return ot();
    if (m.objAt(Math.floor(p.x), Math.floor(p.z)) === o) { G.sfx('error'); return G.ui.toast('Descends du pont avant de le ranger !'); }
    if (G.mode !== 'survie' || !d.bridge) return ot();
    if (G.inv.add('pont_' + d.bridge, 1) > 0) { G.ui.toast('Inventaire plein !'); return; }
    const [cx, cz] = m.center(o); m.removeObj(o); G.sfx('pickup'); G.popup('+1 ' + d.n, cx, o.y + 1.2, cz, 'green');
  };
  // aperçu fantôme du pont avant de le poser
  G.on('update', () => {
    const it = G.inv.held(), E = G.ents, p = G.player; if (!it || it.kind !== 'bridge' || !E.ghost || !G.ui.canPlay() || p.sit || G.map.interior) return;
    const m = G.map, pl = BR.plan(it, p, m);
    if (pl.ok) { const d = G.OBJ[pl.id], key = d.model + ':' + d.v, [w, dd] = G.fpDims(d, pl.rot); if (key !== E.ghostKey) { E.ghost.geometry = G.getGeo(d.model, d.v); E.ghostKey = key; }
      E.ghost.visible = true; E.ghost.position.set(pl.ax + w / 2, m.baseH(pl.ax, pl.az), pl.az + dd / 2); E.ghost.rotation.y = pl.rot * Math.PI / 2; G.M.ghost.color.setHex(0x9cff9c);
      E.cursor.visible = true; E.cursor.scale.set(w, 1, dd); E.cursor.position.set(pl.ax + w / 2, m.waterSurf(pl.ax, pl.az) + .03, pl.az + dd / 2); G.M.cursor.color.setHex(0xffffff); }
    else if (pl.tx != null && m.inb(pl.tx, pl.tz)) { E.cursor.visible = true; E.cursor.scale.set(1, 1, 1); E.cursor.position.set(pl.tx + .5, (m.isWaterT(pl.tx, pl.tz) ? m.waterSurf(pl.tx, pl.tz) : m.topAt(pl.tx + .5, pl.tz + .5)) + .03, pl.tz + .5); G.M.cursor.color.setHex(0xff8080); }
  });
  G.on('worldgen', (map, ctx) => BR.convert(map, ctx.r));
  G.on('load', () => { if (G.world && !G.world.meta.br2) BR.convert(G.world); });
})();
