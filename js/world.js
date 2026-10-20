'use strict';
// ===== Carte en tuiles : niveaux/falaises, pentes, eau & cascades, objets instanciés (1 draw call par type) =====
(function () {
  const T = G.TIER, CH = 24, WS = -.32, BED = -.9, SEABED = -1.35;
  // paroi de falaise découpée en couches d'un niveau, comme dans Minecraft : seule la couche du dessus a son liseré d'herbe
  // (moitié haute de la texture), les couches en dessous ne montrent que la terre (moitié basse). A, B : bas de l'arête ; y0 / t : bas / haut de chaque arête
  function cliffQuad(buf, A, B, yA0, yB0, tA, tB, cb, ct, uA, uB) {
    const n = Math.max(1, Math.ceil(Math.max(tA - yA0, tB - yB0) / T - .001));
    const col = (y, y0, t) => { const k = t - y0 > 1e-4 ? G.clamp((y - y0) / (t - y0), 0, 1) : 1; return [cb[0] + (ct[0] - cb[0]) * k, cb[1] + (ct[1] - cb[1]) * k, cb[2] + (ct[2] - cb[2]) * k]; };
    for (let k = 0; k < n; k++) { const aT = tA - k * T, bT = tB - k * T, aTop = Math.max(aT, yA0), bTop = Math.max(bT, yB0), aB = Math.max(yA0, aT - T), bB = Math.max(yB0, bT - T);
      if (aTop - aB < 1e-4 && bTop - bB < 1e-4) continue; const base = k ? .006 : .506, v = (y, top) => base + G.clamp(1 - (top - y) / T, 0, 1) * .488;
      buf.quad([A[0], aB, A[2]], [B[0], bB, B[2]], [B[0], bTop, B[2]], [A[0], aTop, A[2]], col(aB, yA0, tA), col(bB, yB0, tB), col(bTop, yB0, tB), col(aTop, yA0, tA), [uA, v(aB, aT)], [uB, v(bB, bT)], [uB, v(bTop, bT)], [uA, v(aTop, aT)]); } }
  const tmp4 = [0, 0, 0, 0], nb4 = [0, 0, 0, 0], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), SV = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0);
  // ---------- tampon de géométrie ----------
  function FREE() { this.array = null; } // une fois envoyé à la carte graphique, le tableau n'est plus utile
  class Buf {
    constructor() { this.p = []; this.c = []; this.u = []; }
    tri(a, b, c, ca, cb, cc, ua, ub, uc) {
      this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.c.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
      this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
    }
    quad(a, b, c, d, ca, cb, cc, cd, ua, ub, uc, ud) { this.tri(a, b, c, ca, cb, cc, ua, ub, uc); this.tri(a, c, d, ca, cc, cd, ua, uc, ud); }
    geo() {
      if (!this.p.length) return null; const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
      g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    }
  }
  // côtés : [dx,dz, coinA, coinB, coinVoisinA, coinVoisinB]
  const SIDES = [[0, -1, 1, 0, 2, 3], [0, 1, 3, 2, 0, 1], [1, 0, 2, 1, 3, 0], [-1, 0, 0, 3, 1, 2]];
  const CX = [0, 1, 1, 0], CZ = [0, 0, 1, 1];
  // coins arrondis façon ACNL : côtés et diagonale de chaque coin, sens des arcs (dans l'ordre de tour 0→3→2→1)
  const CS = [[0, 3], [0, 2], [2, 1], [1, 3]], DG = [[-1, -1], [1, -1], [1, 1], [-1, 1]], AD = [[[0, -1], [-1, 0]], [[1, 0], [0, -1]], [[0, 1], [1, 0]], [[-1, 0], [0, 1]]], RR = .45, NA = 5, RING = [0, 3, 2, 1];
  const arcPts = k => { const cx = CX[k] ? 1 - RR : RR, cz = CZ[k] ? 1 - RR : RR, [d1, d2] = AD[k], out = []; for (let i = 0; i <= NA; i++) { const t = i / NA, x = d1[0] * (1 - t) + d2[0] * t, z = d1[1] * (1 - t) + d2[1] * t, l = Math.hypot(x, z); out.push([cx + RR * x / l, cz + RR * z / l]); } return out; };
  const ARC = [0, 1, 2, 3].map(arcPts), sh = [.92, .98, 1];
  // triangle tourné vers le haut
  const upTri = (buf, a, b, c, ca, cb, cc, ua, ub, uc) => { if ((b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) >= 0) buf.tri(a, b, c, ca, cb, cc, ua, ub, uc); else buf.tri(a, c, b, ca, cc, cb, ua, uc, ub); };

  // marches franchissables : perrons des bâtiments, ponts, scènes, kiosques et grandes constructions (pas les fontaines ni les rochers)
  G.stepOK = d => d._st != null ? d._st : (d._st = !!(d.enter || (d.walk && !d.mine && d.fp[0] * d.fp[1] >= 4) || (d.fp[0] * d.fp[1] >= 9 && !/fontaine/.test(d.id))));
  G.objKey = o => { const d = G.OBJ[o.t]; let v = o.v != null ? o.v : d.v; if ((d.fruit || d.pickFruit) && o.f === 0) v += 10; if (d.light && o.off) v += 100; return d.model + ':' + v; };
  G.fpDims = (d, r) => (r & 1) ? [d.fp[1], d.fp[0]] : [d.fp[0], d.fp[1]];
  // fleurs au sol (pas les arbustes ni les pots) : elles s'effacent devant une maison, un bâtiment ou l'avion, mais bloquent les autres objets
  const FLM = /^(flower|tulip|fl_)/;
  G.isFlowerObj = o => { const d = o && G.OBJ[o.t]; return !!d && !d.h && FLM.test(d.model); };
  G.clearsFlowers = d => !!(d.enter || d.plane || d.fp[0] * d.fp[1] >= 6);
  // un passage à niveau se pose sur la voie ferrée (il remplace le bout de rail)
  G.replaces = (d, q) => !!q && ((G.clearsFlowers(d) && G.isFlowerObj(q)) || (d.id === 'passage_niveau' && q.t === 'voie'));

  // ---------- rendu instancié des objets ----------
  // Chaque type d'objet = 1 InstancedMesh. Seuls les objets des cases visibles (et celles qui projettent une ombre dans le champ)
  // sont recopiés en tête du tampon : le reste n'est ni dessiné ni ombré. La visibilité est calculée dans perf2.js (G.cullCells).
  const CELL = 8; G.CELL = CELL;
  class ObjR {
    constructor(map) { this.map = map; this.sets = {}; this.group = new THREE.Group(); map.group.add(this.group); this.cw = Math.ceil(map.W / CELL); this.ver = -1; this.dirty = true; this.olOn = !G.settings || G.settings.outlines === 'tout'; }
    makeSet(k, cap) {
      const i = k.lastIndexOf(':'), geo = G.getGeo(k.slice(0, i), +k.slice(i + 1));
      const mesh = new THREE.InstancedMesh(geo, G.MATS, cap); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = geo.boundingSphere.radius > .45; mesh.receiveShadow = true; mesh.visible = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(mesh); const s = { k, mesh, cap, n: 0, vis: 0, lvis: 0, items: [], dirty: true }; this.outline(s);
      // les petits objets (fleurs, champignons, cailloux, buissons) ne sont plus dessinés quand ils sont trop loin pour être vus
      const rad = geo.boundingSphere.radius; s.lim = this.map.interior ? Infinity : rad < .9 ? 72 * 72 : rad < 2 ? 130 * 130 : Infinity;
      if (G.MODELS[k.slice(0, i) + '_lod']) { s.lg = G.getGeo(k.slice(0, i) + '_lod', +k.slice(i + 1)); if (G.MODELS[k.slice(0, i) + '_lod2']) s.lg2 = G.getGeo(k.slice(0, i) + '_lod2', +k.slice(i + 1)); this.lowMesh(s); } return s; // version simplifiée pour les objets lointains
    }
    lowMesh(s) { const mk = (old, g) => { if (old) { this.group.remove(old); old.dispose(); } const m = new THREE.InstancedMesh(g, G.MATS, s.cap); m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.visible = false; // au loin : hors de la zone des ombres
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(m); return m; };
      s.low = mk(s.low, s.lg); s.lvis = 0; if (s.lg2) { s.low2 = mk(s.low2, s.lg2); s.lvis2 = 0; }
    }
    outline(s) {
      if (s.om) { this.group.remove(s.om); s.om = null; } const geo = s.mesh.geometry; if (geo.boundingSphere.radius < .36 || geo.userData.noOutline) return;
      const om = new THREE.InstancedMesh(G.outlineGeo(geo), G.M.outlineI, s.cap); om.instanceMatrix = s.mesh.instanceMatrix; om.count = s.vis; om.frustumCulled = false; om.castShadow = false;
      om.visible = this.olOn && s.vis > 0; this.group.add(om); s.om = om;
    }
    setOutlines(on) { this.olOn = on; for (const k in this.sets) { const s = this.sets[k]; if (s.om) s.om.visible = on && s.vis > 0; } }
    grow(s) {
      const cap = s.cap * 2, m = new THREE.InstancedMesh(s.mesh.geometry, G.MATS, cap); m.frustumCulled = false; m.castShadow = s.mesh.castShadow; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.count = 0; m.visible = false; this.group.remove(s.mesh); s.mesh.dispose(); this.group.add(m); s.mesh = m; s.cap = cap; s.vis = 0; this.outline(s); if (s.lg) this.lowMesh(s); this.mark(s);
    }
    mark(s) { s.dirty = true; this.dirty = true; }
    cellOf(o) { const d = G.OBJ[o.t], [w, dd] = G.fpDims(d, o.r); if (w > 6 || dd > 6) return -1; return Math.floor((o.z + dd / 2) / CELL) * this.cw + Math.floor((o.x + w / 2) / CELL); }
    add(o) {
      const k = G.objKey(o); let s = this.sets[k]; if (!s) s = this.sets[k] = this.makeSet(k, 8);
      if (s.n >= s.cap) this.grow(s);
      o._k = k; o._i = s.n; o._vi = -1; s.items[s.n] = o; s.n++; o._c = this.cellOf(o); o._m = o._m || new Float32Array(16); this.mat(o, o._anim || null); this.mark(s);
    }
    remove(o) {
      const s = this.sets[o._k]; if (!s) return; const i = o._i, last = s.n - 1;
      if (i !== last) { const lo = s.items[last]; s.items[i] = lo; lo._i = i; }
      s.items[last] = null; s.n--; o._k = null; o._vi = -1; this.mark(s);
    }
    mat(o, anim) {
      const d = G.OBJ[o.t], [w, dd] = G.fpDims(d, o.r);
      // arbres : chacun tourné et dimensionné un peu différemment (seulement à l'affichage), pour des forêts sans clones
      const tree = d.chop >= 3 && d.fp[0] === 1 && d.fp[1] === 1, yaw = o.r * Math.PI / 2 + (tree ? G.hash2(o.x, o.z, 31) * Math.PI * 2 : 0), sc = tree ? SV.setScalar(.9 + G.hash2(o.x, o.z, 57) * .22) : S1;
      P.set(o.x + w / 2, o.y, o.z + dd / 2); Q.setFromAxisAngle(YA, yaw); M.compose(P, Q, sc);
      if (anim) { const A = G.m4.copy(anim); M.multiplyMatrices(G.m4b.makeTranslation(P.x, P.y, P.z), A.multiply(G.m4c.makeRotationY(yaw))); if (tree) M.scale(sc); }
      M.toArray(o._m);
    }
    write(o, anim) {
      const s = this.sets[o._k]; if (!s) return; this.mat(o, anim);
      if (s.dirty) return; if (o._vi >= 0) { s.mesh.instanceMatrix.array.set(o._m, o._vi * 16); s.mesh.instanceMatrix.needsUpdate = true; } else if (!this.V || o._c < 0 || this.V[o._c]) this.mark(s);
    }
    refresh(o) { const k = G.objKey(o); if (k !== o._k) { this.remove(o); this.add(o); } else this.write(o, o._anim || null); }
    // recopie les objets visibles en tête du tampon (V : visibilité des cases, ou null = tout)
    cull(V, ver) {
      const pl = G.player, px = pl ? pl.x : 0, pz = pl ? pl.z : 0, pk = Math.floor(px / CELL) * 4096 + Math.floor(pz / CELL), vast = this.map.lazyT(), LR = (vast ? 42 : G.LOD_DIST || 75) ** 2, LR2 = vast ? 130 * 130 : Infinity, cw = this.cw;
      const d2 = c => { const dx = (c % cw) * CELL + CELL / 2 - px, dz = Math.floor(c / cw) * CELL + CELL / 2 - pz; return dx * dx + dz * dz; };
      const all = ver !== this.ver || V !== this.V || pk !== this.pk; if (!all && !this.dirty) return; this.ver = ver; this.V = V; this.pk = pk; this.dirty = false;
      for (const k in this.sets) { const s = this.sets[k]; if (!all && !s.dirty) continue; s.dirty = false;
        const im = s.mesh.instanceMatrix, arr = im.array, low = s.low, la = low && low.instanceMatrix.array, low2 = s.low2, la2 = low2 && low2.instanceMatrix.array; let n = 0, nl = 0, nl2 = 0;
        const lim = V ? s.lim : Infinity; for (let i = 0; i < s.n; i++) { const o = s.items[i], dd = o._c >= 0 && (low || lim !== Infinity) ? d2(o._c) : 0; if ((!V || o._c < 0 || V[o._c]) && dd <= lim) {
          if (low2 && dd > LR2) { la2.set(o._m, nl2++ * 16); o._vi = -3; } else if (low && dd > LR) { la.set(o._m, nl++ * 16); o._vi = -2; } else { arr.set(o._m, n * 16); o._vi = n++; } } else o._vi = -1; }
        const upd = (m, c, was) => { if (!m || !(c || was)) return; m.count = c; m.visible = c > 0; m.instanceMatrix.updateRange.offset = 0; m.instanceMatrix.updateRange.count = c * 16; m.instanceMatrix.needsUpdate = true; };
        upd(low, nl, s.lvis); s.lvis = nl; upd(low2, nl2, s.lvis2); s.lvis2 = nl2;
        if (!n && !s.vis) continue; s.vis = n; s.mesh.count = n; s.mesh.visible = n > 0; if (s.om) { s.om.count = n; s.om.visible = this.olOn && n > 0; }
        im.updateRange.offset = 0; im.updateRange.count = n * 16; im.needsUpdate = true; }
    }
  }
  G.m4b = new THREE.Matrix4(); G.m4c = new THREE.Matrix4();
  // planchers : plateformes à balustrade, terrasses en planches, pontons, tapis… on pose dessus comme par terre
  G.isFloor = d => !!(d && (d.plat || d.floor));
  G.floorTop = o => { const d = G.OBJ[o.t]; return d.plat && G.platDeck ? G.platDeck(o) : o.y + d.h; };
  G.deckOK = d => !!d && !(d.enter || d.shop || d.chop >= 3 || d.onWater || d.up || d.ceil || d.plat || d.floor || d.stair || d.bridge || d.portal || d.fixed || d.balloon || d.grow || d.fence) && d.id !== 'pousse';
  const DKEEP = ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt'];

  class GMap {
    constructor(W, H, o = {}) {
      this.W = W; this.H = H; this.interior = !!o.interior; this.kind = o.kind || 'world'; this.id = o.id || 'world';
      const N = W * H; this.lvl = new Int8Array(N); this.surf = new Uint8Array(N); this.water = new Uint8Array(N); this.ramp = new Uint8Array(N);
      this.objs = new Array(N).fill(null); this.occ = new Int32Array(N); this.list = new Set(); this.lights = new Set();
      this.group = new THREE.Group(); this.terrain = new THREE.Group(); this.group.add(this.terrain);
      this.cw = Math.ceil(W / CH); this.chh = Math.ceil(H / CH); this.chunks = new Array(this.cw * this.chh).fill(null); this.dirty = new Set();
      this.falls = new Map(); this.objr = new ObjR(this); this.meta = {}; this.rev = 0;
      this.ceil = new Map(); // objets accrochés au plafond (lustres) : une case peut avoir un meuble au sol ET un lustre
    }
    ceilAt(tx, tz) { return this.inb(tx, tz) ? this.ceil.get(tz * this.W + tx) || null : null; }
    // objets posés en hauteur (d.up) : ils ne prennent pas la case au sol, on peut avoir un arbre ou une lampe en dessous
    upAt(tx, tz) { return this.up && this.inb(tx, tz) ? this.up.get(tz * this.W + tx) || null : null; }
    ceilH() { return this.meta.ceilH || (this.interior ? 3 : 4); }
    idx(x, z) { return z * this.W + x; }
    inb(x, z) { return x >= 0 && z >= 0 && x < this.W && z < this.H; }
    isWaterT(x, z) { return this.inb(x, z) && this.water[z * this.W + x] > 0; }
    cornerH(x, z, out = tmp4) {
      const i = z * this.W + x, L = this.lvl[i] * T;
      if (this.water[i]) { const b = L + (this.water[i] === 2 ? SEABED : BED); out[0] = out[1] = out[2] = out[3] = b; return out; }
      const r = this.ramp[i]; out[0] = out[1] = out[2] = out[3] = L; if (!r) return out;
      const dir = r >> 2, part = r & 3; let lo = L, hi = L + T; if (part === 1) lo = L + T / 2; else if (part === 2) hi = L + T / 2;
      out[0] = out[1] = out[2] = out[3] = lo;
      if (dir === 1) out[0] = out[1] = hi; else if (dir === 2) out[1] = out[2] = hi; else if (dir === 3) out[2] = out[3] = hi; else out[3] = out[0] = hi;
      return out;
    }
    terrainH(x, z) {
      const tx = Math.floor(x), tz = Math.floor(z); if (!this.inb(tx, tz)) return 50;
      const c = this.cornerH(tx, tz), fx = x - tx, fz = z - tz;
      return (c[0] + (c[1] - c[0]) * fx) * (1 - fz) + (c[3] + (c[2] - c[3]) * fx) * fz;
    }
    baseH(tx, tz) { const i = tz * this.W + tx; return this.lvl[i] * T; }
    waterSurf(tx, tz) { return this.lvl[tz * this.W + tx] * T + WS; }
    objAt(tx, tz) { if (!this.inb(tx, tz)) return null; const i = tz * this.W + tx; if (G._deckPick != null && this.dk && this.dk.size) { const q = this.deckPick(i, G._deckPick); if (q) return q; } const k = this.occ[i]; return k ? this.objs[k - 1] : null; }
    // ---------- objets posés sur un plancher (couche à part : la case garde son plancher) ----------
    deckAt(tx, tz, du) { return this.dk && this.inb(tx, tz) ? this.dk.get((du ? this.W * this.H : 0) + tz * this.W + tx) || null : null; }
    deckPick(i, py) { let best = null; for (const k of [i, i + this.W * this.H]) { const q = this.dk.get(k); if (q && q.y <= py + 1.7 && q.y >= py - 1.2 && (!best || Math.abs(q.y - py) < Math.abs(best.y - py))) best = q; } return best; }
    deckSlot(tx, tz, py) { const i = tz * this.W + tx, k = this.occ[i], g = k ? this.objs[k - 1] : null, u = this.up && this.up.get(i); let best = null;
      for (const [f, du] of [[g, 0], [u, 1]]) { if (!f || !G.isFloor(G.OBJ[f.t]) || f.falling) continue; const h = G.floorTop(f); if (py > h - 1.7 && (!best || Math.abs(h - py) < Math.abs(best.h - py))) best = { du, h }; }
      return best; }
    // null : pas de plancher visé (pose normale) — false : plancher visé mais pas la place — sinon {du, h}
    deckFit(t, tx, tz, r, py) { const d = G.OBJ[t], [w, dd] = G.fpDims(d, r); if (!this.inb(tx, tz)) return null; const s = this.deckSlot(tx, tz, py); if (!s) return null;
      for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) { if (!this.inb(x, z)) return false; const q = this.deckSlot(x, z, py); if (!q || q.du !== s.du || Math.abs(q.h - s.h) > .01 || this.deckAt(x, z, s.du)) return false; }
      return s; }
    objTop(o, x, z) { const d = G.OBJ[o.t]; if (!(d.h > 0) || o.falling) return -99; if (d.hAt) return o.y + d.hAt(o, x, z, this); if (!G.shapeTop || d.box) return o.y + d.h; const t = G.shapeTop(o, d, x, z); return t >= 0 ? o.y + t : -99; }
    // hauteur de la surface marchable (terrain + objets solides)
    topAt(x, z) {
      const tx = Math.floor(x), tz = Math.floor(z); if (!this.inb(tx, tz)) return 50;
      let h = this.terrainH(x, z); const o = this.objAt(tx, tz); this._nf = false; // _nf : le point touche un bord arrondi d'objet (racine, buisson, rocher, margelle) : on ne monte pas dessus en marchant
      if (o) { const d = G.OBJ[o.t]; if (d.h > 0 && !o.falling) { if (d.hAt) h = Math.max(h, o.y + d.hAt(o, x, z, this)); else if (!G.shapeTop || d.box) h = Math.max(h, o.y + d.h); else { const t = G.shapeTop(o, d, x, z); if (t >= 0) { const v = o.y + (d.chop >= 3 && t < 1.5 ? 4 : t); if (v > h) { h = v; this._nf = !G.shapeTop.flat && !G.stepOK(d); } } /* pas de marche sur les racines d'un arbre */ } } }
      const u = this.up && this.up.get(tz * this.W + tx); if (u && !u.falling) { const ud = G.OBJ[u.t]; if (ud.hAt) { const v = u.y + ud.hAt(u, x, z, this); if (v > h) { h = v; this._nf = false; } } } // plateforme en hauteur // forme réelle de l'objet (shape.js)
      if (this.dk && this.dk.size) { const i = tz * this.W + tx; for (const k of [i, i + this.W * this.H]) { const q = this.dk.get(k); if (!q || (G._feetY != null && G._feetY < q.y - 1.4)) continue; const v = this.objTop(q, x, z); if (v > h) { h = v; this._nf = false; } } } // posé sur un plancher (on passe dessous s'il est en hauteur)
      return h;
    }
    isWaterAt(x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!this.isWaterT(tx, tz)) return false; const o = this.objAt(tx, tz); return !(o && G.OBJ[o.t].walk); }
    canPlace(t, tx, tz, r = 0) {
      const d = G.OBJ[t]; if (!d) return false; const [w, dd] = G.fpDims(d, r); let L = null;
      const m = this.interior ? 0 : 2;
      if (d.ceil) { for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (!this.inb(x, z) || this.ceil.has(z * this.W + x)) return false; return true; }
      if (d.up) { for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (x < m || z < m || x >= this.W - m || z >= this.H - m || (this.up && this.up.has(z * this.W + x))) return false; return true; }
      if (G._deckY != null && G.deckOK(d)) { const s = this.deckFit(t, tx, tz, r, G._deckY); if (s !== null) return !!s; } // posé par le joueur sur un plancher
      for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) {
        if (x < m || z < m || x >= this.W - m || z >= this.H - m) return false;
        const i = z * this.W + x; if (this.occ[i] && !G.replaces(d, this.objs[this.occ[i] - 1])) return false;
        if (d.onWater) { if (!this.water[i]) return false; } else if ((this.water[i] && !d.plat && !(d.stair && d.model === 'esc_fer')) || this.ramp[i]) return false;
        if (L === null) L = this.lvl[i]; else if (this.lvl[i] !== L) return false;
      }
      return true;
    }
    addObj(t, tx, tz, r = 0, extra = null) {
      const d = G.OBJ[t]; if (!d) return null; const [w, dd] = G.fpDims(d, r);
      let ds = extra && extra.dk != null ? { du: extra.du ? 1 : 0, dk: +extra.dk } : null; // posé sur un plancher : sa hauteur au-dessus du sol
      if (!ds && G._deckY != null && G.deckOK(d)) { const s = this.deckFit(t, tx, tz, r, G._deckY); if (s) ds = { du: s.du, dk: Math.round((s.h - this.baseH(tx, tz)) * 1000) / 1000 }; }
      // une maison, un bâtiment ou l'avion se posent par-dessus les fleurs : elles sont enlevées
      if (!ds) for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) { const q = this.objAt(x, z); if (q && G.replaces(d, q)) this.removeObj(q); }
      const o = { t, x: tx, z: tz, r, hp: d.chop || d.mine || 0, f: (d.fruit || d.pickFruit) ? 3 : 0 };
      if (extra) Object.assign(o, extra);
      o.y = this.baseH(tx, tz) + (o.cy || 0); const own = tz * this.W + tx; // cy : posé plus haut que le terrain (la cour pavée d'un château)
      if (ds) { o.dk = ds.dk; if (ds.du) o.du = 1; else delete o.du; o.y += ds.dk; const D = this.dk || (this.dk = new Map()), b = ds.du ? this.W * this.H : 0; for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (this.inb(x, z)) D.set(b + z * this.W + x, o); }
      else if (d.up) { const U = this.up || (this.up = new Map()); for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (this.inb(x, z)) U.set(z * this.W + x, o); }
      else if (d.ceil) { o.y += this.ceilH(); o.v = Math.round(this.ceilH() * 2); for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (this.inb(x, z)) this.ceil.set(z * this.W + x, o); }
      else { for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (this.inb(x, z)) this.occ[z * this.W + x] = own + 1; this.objs[own] = o; }
      this.list.add(o); if (d.light) this.lights.add(o);
      this.objr.add(o); this.rev++; return o;
    }
    removeObj(o) {
      const d = G.OBJ[o.t], [w, dd] = G.fpDims(d, o.r);
      if (o.dk != null && this.dk) { const b = o.du ? this.W * this.H : 0; for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) if (this.dk.get(b + z * this.W + x) === o) this.dk.delete(b + z * this.W + x); }
      else if (d.up) { for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) if (this.up && this.up.get(z * this.W + x) === o) this.up.delete(z * this.W + x); }
      else if (d.ceil) { for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) if (this.ceil.get(z * this.W + x) === o) this.ceil.delete(z * this.W + x); }
      else { for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) if (this.inb(x, z) && this.occ[z * this.W + x] === o.z * this.W + o.x + 1) this.occ[z * this.W + x] = 0;
        this.objs[o.z * this.W + o.x] = null; }
      this.list.delete(o); this.lights.delete(o); this.objr.remove(o); this.rev++;
      // on enlève un plancher : ce qui était posé dessus retombe au sol (ou revient dans le sac s'il n'y a pas la place)
      if (o.dk == null && G.isFloor(d) && this.dk && this.dk.size) { const b = d.up ? this.W * this.H : 0, top = new Set();
        for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) { const q = this.inb(x, z) && this.dk.get(b + z * this.W + x); if (q) top.add(q); }
        for (const q of top) { this.removeObj(q); const ex = {}; for (const k of DKEEP) if (q[k] != null) ex[k] = q[k]; const sy = G._deckY; G._deckY = null;
          try { if (this.canPlace(q.t, q.x, q.z, q.r)) this.addObj(q.t, q.x, q.z, q.r, ex); else if (G.state === 'play' && G.map === this && G.ITEMS[q.t] && G.mode === 'survie') G.inv.add(q.t, 1); } finally { G._deckY = sy; } } }
    }
    setAnim(o, m) { o._anim = m; if (o._k) this.objr.write(o, m); }
    refresh(o) { this.objr.refresh(o); }
    center(o) { const [w, dd] = G.fpDims(G.OBJ[o.t], o.r); return [o.x + w / 2, o.z + dd / 2]; }
    markDirty(tx, tz) { this.tRev = (this.tRev || 0) + 1; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const cx = Math.floor((tx + dx) / CH), cz = Math.floor((tz + dz) / CH); if (cx >= 0 && cz >= 0 && cx < this.cw && cz < this.chh) this.dirty.add(cz * this.cw + cx); } this.rev++; }
    flush() { this.objr.cull(this.cullV || null, this.cullVer || 0); if (!this.dirty.size) return; const lz = this.lazyT(); for (const k of this.dirty) if (!lz || this.chunks[k]) this.buildChunk(k % this.cw, Math.floor(k / this.cw)); this.dirty.clear(); }
    // très grande carte : le terrain n'est construit qu'autour du joueur (ensureChunks), les morceaux lointains sont libérés
    lazyT() { return !this.interior && this.kind === 'world' && this.W * this.H > 90000; }
    buildAll() { const lz = this.lazyT(); for (let cz = 0; cz < this.chh; cz++) for (let cx = 0; cx < this.cw; cx++) if (!lz || this.chunks[cz * this.cw + cx]) this.buildChunk(cx, cz); }
    dropChunk(k) { const g = this.chunks[k]; if (!g) return; this.terrain.remove(g); g.traverse(c => c.geometry && c.geometry.dispose()); this.chunks[k] = null; for (const [kk, v] of this.falls) if (v.c === k) this.falls.delete(kk); }
    ensureChunks(x, z, R, ms, keep = R + 72) {
      if (!this.lazyT()) return 0; const t0 = performance.now(), px = x / CH, pz = z / CH, rc = R / CH, out = keep / CH; let built = 0;
      for (let k = 0; k < this.chunks.length; k++) if (this.chunks[k] && Math.hypot(k % this.cw + .5 - px, Math.floor(k / this.cw) + .5 - pz) > out) this.dropChunk(k);
      const need = []; for (let cz = Math.max(0, Math.floor(pz - rc)); cz <= Math.min(this.chh - 1, Math.floor(pz + rc)); cz++) for (let cx = Math.max(0, Math.floor(px - rc)); cx <= Math.min(this.cw - 1, Math.floor(px + rc)); cx++) {
        if (this.chunks[cz * this.cw + cx]) continue; const d = Math.hypot(cx + .5 - px, cz + .5 - pz); if (d <= rc + .75) need.push([d, cx, cz]); }
      need.sort((a, b) => a[0] - b[0]); for (const [, cx, cz] of need) { this.buildChunk(cx, cz); built++; if (performance.now() - t0 > ms) break; }
      return need.length - built;
    }
    buildChunk(cx, cz) {
      const key = cz * this.cw + cx, old = this.chunks[key];
      if (old) { this.terrain.remove(old); old.traverse(c => c.geometry && c.geometry.dispose()); }
      const tops = new Buf(), walls = new Buf(), wat = new Buf(), fal = new Buf(), W = this.W;
      const x0 = cx * CH, z0 = cz * CH, x1 = Math.min(W, x0 + CH), z1 = Math.min(this.H, z0 + CH);
      for (const [k, v] of this.falls) if (v.c === key) this.falls.delete(k);
      const c = [0, 0, 0, 0], n = [0, 0, 0, 0], col = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
      const pos = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], uv = [[0, 0], [0, 0], [0, 0], [0, 0]];
      for (let tz = z0; tz < z1; tz++) for (let tx = x0; tx < x1; tx++) {
        const i = tz * W + tx; this.cornerH(tx, tz, c); const wt = this.water[i];
        let cell = wt ? 10 : G.SURF[this.surf[i]].cell;
        if (!wt && this.surf[i] === 0 && G.hash2(tx, tz, 5) < .12) cell = 14;
        const [u0, v0, u1, v1] = G.atlasUV(cell);
        for (let k = 0; k < 4; k++) {
          const X = tx + CX[k], Z = tz + CZ[k]; pos[k][0] = X; pos[k][1] = c[k]; pos[k][2] = Z;
          let b = .9 + .14 * G.noise(X * .17, Z * .17, 3) + (wt ? 0 : this.lvl[i] * .025);
          if (wt) b *= wt === 2 ? .62 : .78; else if (this.aoCorner(X, Z, c[k])) b *= .8;
          col[k][0] = col[k][1] = col[k][2] = b; if (wt) { col[k][0] *= .85; col[k][2] *= 1.08; }
        }
        uv[0][0] = u0; uv[0][1] = v1; uv[1][0] = u1; uv[1][1] = v1; uv[2][0] = u1; uv[2][1] = v0; uv[3][0] = u0; uv[3][1] = v0;
        const lvlI = this.lvl[i], L0 = lvlI * T, cv = [false, false, false, false], nbi = (dx, dz) => { const x = tx + dx, z = tz + dz; return this.inb(x, z) ? z * W + x : -1; };
        if (!this.interior && !this.ramp[i]) for (let k = 0; k < 4; k++) { const ok = j => j >= 0 && (wt ? (!this.water[j] && !this.ramp[j] && this.lvl[j] >= lvlI) : (this.water[j] > 0 || (!this.ramp[j] && this.lvl[j] < lvlI))); const [s1, s2] = CS[k];
          cv[k] = ok(nbi(SIDES[s1][0], SIDES[s1][1])) && ok(nbi(SIDES[s2][0], SIDES[s2][1])) && ok(nbi(DG[k][0], DG[k][1])); }
        const anyCv = !wt && cv.some(x => x), cAvg = [(col[0][0] + col[1][0] + col[2][0] + col[3][0]) / 4, (col[0][1] + col[1][1] + col[2][1] + col[3][1]) / 4, (col[0][2] + col[1][2] + col[2][2] + col[3][2]) / 4], uvAt = (px, pz) => [u0 + px * (u1 - u0), v1 - pz * (v1 - v0)];
        if (!this.interior && !anyCv) tops.quad(pos[0], pos[3], pos[2], pos[1], col[0], col[3], col[2], col[1], uv[0], uv[3], uv[2], uv[1]);
        else if (anyCv) { const ring = []; for (const k of RING) { if (cv[k]) for (const p of ARC[k]) ring.push(p); else ring.push([CX[k], CZ[k]]); } const C = [tx + .5, L0, tz + .5], uc = uvAt(.5, .5);
          for (let r = 0; r < ring.length; r++) { const p = ring[r], q = ring[(r + 1) % ring.length]; upTri(tops, C, [tx + p[0], L0, tz + p[1]], [tx + q[0], L0, tz + q[1]], cAvg, cAvg, cAvg, uc, uvAt(p[0], p[1]), uvAt(q[0], q[1])); } }
        // murs / falaises
        for (const [dx, dz, a, bb, na, nb] of SIDES) {
          const nx = tx + dx, nz = tz + dz; let nA, nB; const inb = this.inb(nx, nz);
          if (inb) { this.cornerH(nx, nz, n); nA = n[na]; nB = n[nb]; } else { if (wt || this.interior) continue; nA = nB = -4; }
          const tA = c[a], tB = c[bb];
          if (tA > nA + .001 || tB > nB + .001) {
            const A = [tx + CX[a], 0, tz + CZ[a]], B = [tx + CX[bb], 0, tz + CZ[bb]];
            if (anyCv) { const ax0 = A[0], az0 = A[2]; if (cv[a]) { A[0] += (B[0] - ax0) * RR; A[2] += (B[2] - az0) * RR; } if (cv[bb]) { B[0] += (ax0 - B[0]) * RR; B[2] += (az0 - B[2]) * RR; } }
            const yA0 = Math.min(nA, tA), yB0 = Math.min(nB, tB);
            const uA = (A[0] + A[2]) * .5, uB = (B[0] + B[2]) * .5;
            const sh = wt ? .7 : 1;
            cliffQuad(walls, A, B, yA0, yB0, tA, tB, [.62 * sh, .62 * sh, .62 * sh], [sh, sh, sh], uA, uB);
          }
          // cascade : eau voisine plus basse
          if (wt && inb && this.water[nz * W + nx] && this.lvl[nz * W + nx] < this.lvl[i]) {
            const top = this.lvl[i] * T + WS, bot = this.lvl[nz * W + nx] * T + WS, o = .06;
            const A = [tx + CX[a] + dx * o, 0, tz + CZ[a] + dz * o], B = [tx + CX[bb] + dx * o, 0, tz + CZ[bb] + dz * o], uA = (A[0] + A[2]) * .5, uB = (B[0] + B[2]) * .5, w1 = [1, 1, 1];
            fal.quad([A[0], bot, A[2]], [B[0], bot, B[2]], [B[0], top + .02, B[2]], [A[0], top + .02, A[2]], w1, w1, w1, w1, [uA, bot * .5], [uB, bot * .5], [uB, top * .5], [uA, top * .5]);
            this.falls.set(i * 8 + (dx + 1) + (dz + 1) * 3, { c: key, x: tx + .5 + dx * .55, y: bot, z: tz + .5 + dz * .55, h: top - bot });
          }
        }
        const lowH = j => this.water[j] ? this.lvl[j] * T + (this.water[j] === 2 ? SEABED : BED) : this.lvl[j] * T;
        if (anyCv) for (const k of RING) { if (!cv[k]) continue; const [s1, s2] = CS[k], j1 = nbi(SIDES[s1][0], SIDES[s1][1]), j2 = nbi(SIDES[s2][0], SIDES[s2][1]), jd = nbi(DG[k][0], DG[k][1]), yb = Math.min(lowH(j1), lowH(j2)), pts = ARC[k];
          for (let r = 0; r < pts.length - 1; r++) { const p = pts[r], q = pts[r + 1], uA = (tx + p[0] + tz + p[1]) * .5, uB = (tx + q[0] + tz + q[1]) * .5; cliffQuad(walls, [tx + p[0], 0, tz + p[1]], [tx + q[0], 0, tz + q[1]], yb, yb, L0, L0, [.62, .62, .62], [1, 1, 1], uA, uB); }
          const Q = [tx + CX[k], 0, tz + CZ[k]], wj = this.water[j1] ? j1 : this.water[j2] ? j2 : this.water[jd] ? jd : -1;
          const patch = (buf, y, colr, uvf) => { for (let r = 0; r < pts.length - 1; r++) { const p = pts[r], q = pts[r + 1]; upTri(buf, [Q[0], y, Q[2]], [tx + p[0], y, tz + p[1]], [tx + q[0], y, tz + q[1]], colr, colr, colr, uvf(CX[k], CZ[k]), uvf(p[0], p[1]), uvf(q[0], q[1])); } };
          if (wj >= 0) { const bed = lowH(wj), ws = this.lvl[wj] * T + WS, cb = this.water[wj] === 2 ? [.52, .62, .7] : [.66, .7, .78], [b0, b1, b2, b3] = G.atlasUV(10); patch(tops, bed, cb, (x, z) => [b0 + x * (b2 - b0), b3 - z * (b3 - b1)]); patch(wat, ws, [.92, .98, 1], (x, z) => [(tx + x) * .3, (tz + z) * .3]); }
          else { const jj = jd >= 0 ? jd : j1, sc = G.SURF[this.surf[jj]] ? G.SURF[this.surf[jj]].cell : 0, [g0, g1, g2, g3] = G.atlasUV(sc), cc = [.8, .8, .8]; patch(tops, yb, cc, (x, z) => [g0 + x * (g2 - g0), g3 - z * (g3 - g1)]); } }
        if (wt) { // surface de l'eau
          const y = this.lvl[i] * T + WS; const wp = [], wc = [], wu = [];
          for (let k = 0; k < 4; k++) {
            const X = tx + CX[k], Z = tz + CZ[k]; wp.push([X, y, Z]); wu.push([X * .3, Z * .3]);
            const shore = this.shoreCorner(X, Z); const deep = wt === 2 ? .82 : 1;
            wc.push(shore ? [.92, .98, 1] : [.42 * deep, .74 * deep, .96 * deep]);
          }
          if (!cv.some(x => x)) wat.quad(wp[0], wp[3], wp[2], wp[1], wc[0], wc[3], wc[2], wc[1], wu[0], wu[3], wu[2], wu[1]);
          else { const ring = []; for (const k of RING) { if (cv[k]) for (const p of ARC[k]) ring.push([p[0], p[1], sh]); else ring.push([CX[k], CZ[k], wc[k]]); } const dp = wt === 2 ? .82 : 1, dc = [.42 * dp, .74 * dp, .96 * dp], C = [tx + .5, y, tz + .5];
            for (let r = 0; r < ring.length; r++) { const p = ring[r], q = ring[(r + 1) % ring.length]; upTri(wat, C, [tx + p[0], y, tz + p[1]], [tx + q[0], y, tz + q[1]], dc, p[2], q[2], [C[0] * .3, C[2] * .3], [(tx + p[0]) * .3, (tz + p[1]) * .3], [(tx + q[0]) * .3, (tz + q[1]) * .3]); }
            const bed = L0 + (wt === 2 ? SEABED : BED);
            for (const k of RING) { if (!cv[k]) continue; const [s1, s2] = CS[k], j1 = nbi(SIDES[s1][0], SIDES[s1][1]), j2 = nbi(SIDES[s2][0], SIDES[s2][1]), top = Math.max(this.lvl[j1], this.lvl[j2]) * T, pts = ARC[k], Q = [tx + CX[k], top, tz + CZ[k]];
              const sc = G.SURF[this.surf[j1]] ? G.SURF[this.surf[j1]].cell : 0, [g0, g1, g2, g3] = G.atlasUV(sc), gu = (x, z) => [g0 + x * (g2 - g0), g3 - z * (g3 - g1)], cg = [.95, .95, .95];
              for (let r = 0; r < pts.length - 1; r++) { const p = pts[r], q = pts[r + 1]; upTri(tops, Q, [tx + p[0], top, tz + p[1]], [tx + q[0], top, tz + q[1]], cg, cg, cg, gu(CX[k], CZ[k]), gu(p[0], p[1]), gu(q[0], q[1]));
                const uA = (tx + p[0] + tz + p[1]) * .5, uB = (tx + q[0] + tz + q[1]) * .5; cliffQuad(walls, [tx + q[0], 0, tz + q[1]], [tx + p[0], 0, tz + p[1]], bed, bed, top, top, [.62, .62, .62], [1, 1, 1], uB, uA); } } }
        }
      }
      const lz = this.lazyT(), g = new THREE.Group(); const add = (buf, mat, shadow) => { const geo = buf.geo(); if (!geo) return; if (lz) for (const k in geo.attributes) geo.attributes[k].onUpload(FREE); const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = shadow; m.frustumCulled = false; g.add(m); };
      add(tops, G.M.ground, true); add(walls, G.M.cliff, true); add(wat, G.M.water, false); add(fal, G.M.fall, false);
      this.chunks[key] = g; this.terrain.add(g);
    }
    aoCorner(X, Z, h) { for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = X + dx, z = Z + dz; if (!this.inb(x, z)) continue; const i = z * this.W + x; if (!this.water[i] && !this.ramp[i] && this.lvl[i] * T > h + .5) return true; } return false; }
    shoreCorner(X, Z) { for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = X + dx, z = Z + dz; if (this.inb(x, z) && !this.water[z * this.W + x]) return true; } return false; }
    serialize() {
      const objs = []; for (const o of this.list) { if (o.temp) continue; const e = { t: o.t, x: o.x, z: o.z }; if (o.r) e.r = o.r; for (const k of ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt', 'dk', 'du', 'cy']) if (o[k] != null && o[k] !== 0) e[k] = o[k]; if (G.OBJ[o.t].fruit && o.f === 0) e.f = 0; objs.push(e); }
      return { W: this.W, H: this.H, interior: this.interior, kind: this.kind, id: this.id, lvl: G.b64.enc(new Uint8Array(this.lvl.buffer)), surf: G.b64.enc(this.surf), water: G.b64.enc(this.water), ramp: G.b64.enc(this.ramp), objs, meta: this.meta };
    }
    static deserialize(d) {
      const m = new GMap(d.W, d.H, { interior: d.interior, kind: d.kind, id: d.id });
      m.lvl.set(G.b64.dec(d.lvl, Int8Array)); m.surf.set(G.b64.dec(d.surf)); m.water.set(G.b64.dec(d.water)); m.ramp.set(G.b64.dec(d.ramp)); m.meta = d.meta || {};
      for (const e of d.objs) { if (!G.OBJ[e.t]) continue; const { t, x, z, r } = e; const ex = Object.assign({}, e); delete ex.t; delete ex.x; delete ex.z; delete ex.r; m.addObj(t, x, z, r || 0, ex); }
      return m;
    }
  }
  G.GMap = GMap; G.WS = WS;
})();
