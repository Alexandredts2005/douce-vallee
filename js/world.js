'use strict';
// ===== Carte en tuiles : niveaux/falaises, pentes, eau & cascades, objets instanciés (1 draw call par type) =====
(function () {
  const T = G.TIER, CH = 24, WS = -.32, BED = -.9, SEABED = -1.35;
  const tmp4 = [0, 0, 0, 0], nb4 = [0, 0, 0, 0], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), YA = new THREE.Vector3(0, 1, 0);
  // ---------- tampon de géométrie ----------
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

  G.objKey = o => { const d = G.OBJ[o.t]; let v = o.v != null ? o.v : d.v; if ((d.fruit || d.pickFruit) && o.f === 0) v += 10; if (d.light && o.off) v += 100; return d.model + ':' + v; };
  G.fpDims = (d, r) => (r & 1) ? [d.fp[1], d.fp[0]] : [d.fp[0], d.fp[1]];

  // ---------- rendu instancié des objets ----------
  // Chaque type d'objet = 1 InstancedMesh. Seuls les objets des cases visibles (et celles qui projettent une ombre dans le champ)
  // sont recopiés en tête du tampon : le reste n'est ni dessiné ni ombré. La visibilité est calculée dans perf2.js (G.cullCells).
  const CELL = 8; G.CELL = CELL;
  class ObjR {
    constructor(map) { this.map = map; this.sets = {}; this.group = new THREE.Group(); map.group.add(this.group); this.cw = Math.ceil(map.W / CELL); this.ver = -1; this.dirty = true; this.olOn = !G.settings || G.settings.outlines === 'tout'; }
    makeSet(k, cap) {
      const i = k.lastIndexOf(':'), geo = G.getGeo(k.slice(0, i), +k.slice(i + 1));
      const mesh = new THREE.InstancedMesh(geo, G.MATS, cap); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = geo.boundingSphere.radius > .45; mesh.receiveShadow = true; mesh.visible = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(mesh); const s = { k, mesh, cap, n: 0, vis: 0, items: [], dirty: true }; this.outline(s); return s;
    }
    outline(s) {
      if (s.om) { this.group.remove(s.om); s.om = null; } const geo = s.mesh.geometry; if (geo.boundingSphere.radius < .36) return;
      const om = new THREE.InstancedMesh(G.outlineGeo(geo), G.M.outlineI, s.cap); om.instanceMatrix = s.mesh.instanceMatrix; om.count = s.vis; om.frustumCulled = false; om.castShadow = false;
      om.visible = this.olOn && s.vis > 0; this.group.add(om); s.om = om;
    }
    setOutlines(on) { this.olOn = on; for (const k in this.sets) { const s = this.sets[k]; if (s.om) s.om.visible = on && s.vis > 0; } }
    grow(s) {
      const cap = s.cap * 2, m = new THREE.InstancedMesh(s.mesh.geometry, G.MATS, cap); m.frustumCulled = false; m.castShadow = s.mesh.castShadow; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.count = 0; m.visible = false; this.group.remove(s.mesh); s.mesh.dispose(); this.group.add(m); s.mesh = m; s.cap = cap; s.vis = 0; this.outline(s); this.mark(s);
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
      P.set(o.x + w / 2, o.y, o.z + dd / 2); Q.setFromAxisAngle(YA, o.r * Math.PI / 2); M.compose(P, Q, S1);
      if (anim) { const A = G.m4.copy(anim); M.multiplyMatrices(G.m4b.makeTranslation(P.x, P.y, P.z), A.multiply(G.m4c.makeRotationY(o.r * Math.PI / 2))); }
      M.toArray(o._m);
    }
    write(o, anim) {
      const s = this.sets[o._k]; if (!s) return; this.mat(o, anim);
      if (s.dirty) return; if (o._vi >= 0) { s.mesh.instanceMatrix.array.set(o._m, o._vi * 16); s.mesh.instanceMatrix.needsUpdate = true; } else if (!this.V || o._c < 0 || this.V[o._c]) this.mark(s);
    }
    refresh(o) { const k = G.objKey(o); if (k !== o._k) { this.remove(o); this.add(o); } else this.write(o, o._anim || null); }
    // recopie les objets visibles en tête du tampon (V : visibilité des cases, ou null = tout)
    cull(V, ver) {
      const all = ver !== this.ver || V !== this.V; if (!all && !this.dirty) return; this.ver = ver; this.V = V; this.dirty = false;
      for (const k in this.sets) { const s = this.sets[k]; if (!all && !s.dirty) continue; s.dirty = false;
        const im = s.mesh.instanceMatrix, arr = im.array; let n = 0;
        for (let i = 0; i < s.n; i++) { const o = s.items[i]; if (!V || o._c < 0 || V[o._c]) { arr.set(o._m, n * 16); o._vi = n++; } else o._vi = -1; }
        if (!n && !s.vis) continue; s.vis = n; s.mesh.count = n; s.mesh.visible = n > 0; if (s.om) { s.om.count = n; s.om.visible = this.olOn && n > 0; }
        im.updateRange.offset = 0; im.updateRange.count = n * 16; im.needsUpdate = true; }
    }
  }
  G.m4b = new THREE.Matrix4(); G.m4c = new THREE.Matrix4();

  class GMap {
    constructor(W, H, o = {}) {
      this.W = W; this.H = H; this.interior = !!o.interior; this.kind = o.kind || 'world'; this.id = o.id || 'world';
      const N = W * H; this.lvl = new Int8Array(N); this.surf = new Uint8Array(N); this.water = new Uint8Array(N); this.ramp = new Uint8Array(N);
      this.objs = new Array(N).fill(null); this.occ = new Int32Array(N); this.list = new Set(); this.lights = new Set();
      this.group = new THREE.Group(); this.terrain = new THREE.Group(); this.group.add(this.terrain);
      this.cw = Math.ceil(W / CH); this.chh = Math.ceil(H / CH); this.chunks = new Array(this.cw * this.chh).fill(null); this.dirty = new Set();
      this.falls = new Map(); this.objr = new ObjR(this); this.meta = {}; this.rev = 0;
    }
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
    objAt(tx, tz) { if (!this.inb(tx, tz)) return null; const k = this.occ[tz * this.W + tx]; return k ? this.objs[k - 1] : null; }
    // hauteur de la surface marchable (terrain + objets solides)
    topAt(x, z) {
      const tx = Math.floor(x), tz = Math.floor(z); if (!this.inb(tx, tz)) return 50;
      let h = this.terrainH(x, z); const o = this.objAt(tx, tz);
      if (o) { const d = G.OBJ[o.t]; if (d.h > 0 && !o.falling) h = Math.max(h, o.y + (d.hAt ? d.hAt(o, x, z, this) : d.h)); }
      return h;
    }
    isWaterAt(x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!this.isWaterT(tx, tz)) return false; const o = this.objAt(tx, tz); return !(o && G.OBJ[o.t].walk); }
    canPlace(t, tx, tz, r = 0) {
      const d = G.OBJ[t]; if (!d) return false; const [w, dd] = G.fpDims(d, r); let L = null;
      const m = this.interior ? 0 : 2;
      for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) {
        if (x < m || z < m || x >= this.W - m || z >= this.H - m) return false;
        const i = z * this.W + x; if (this.occ[i]) return false;
        if (d.onWater) { if (!this.water[i]) return false; } else if (this.water[i] || this.ramp[i]) return false;
        if (L === null) L = this.lvl[i]; else if (this.lvl[i] !== L) return false;
      }
      return true;
    }
    addObj(t, tx, tz, r = 0, extra = null) {
      const d = G.OBJ[t]; if (!d) return null; const [w, dd] = G.fpDims(d, r);
      const o = { t, x: tx, z: tz, r, hp: d.chop || d.mine || 0, f: (d.fruit || d.pickFruit) ? 3 : 0 };
      if (extra) Object.assign(o, extra);
      o.y = this.baseH(tx, tz); const own = tz * this.W + tx;
      for (let z = tz; z < tz + dd; z++) for (let x = tx; x < tx + w; x++) if (this.inb(x, z)) this.occ[z * this.W + x] = own + 1;
      this.objs[own] = o; this.list.add(o); if (d.light) this.lights.add(o);
      this.objr.add(o); this.rev++; return o;
    }
    removeObj(o) {
      const d = G.OBJ[o.t], [w, dd] = G.fpDims(d, o.r);
      for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) if (this.inb(x, z) && this.occ[z * this.W + x] === o.z * this.W + o.x + 1) this.occ[z * this.W + x] = 0;
      this.objs[o.z * this.W + o.x] = null; this.list.delete(o); this.lights.delete(o); this.objr.remove(o); this.rev++;
    }
    setAnim(o, m) { o._anim = m; if (o._k) this.objr.write(o, m); }
    refresh(o) { this.objr.refresh(o); }
    center(o) { const [w, dd] = G.fpDims(G.OBJ[o.t], o.r); return [o.x + w / 2, o.z + dd / 2]; }
    markDirty(tx, tz) { this.tRev = (this.tRev || 0) + 1; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const cx = Math.floor((tx + dx) / CH), cz = Math.floor((tz + dz) / CH); if (cx >= 0 && cz >= 0 && cx < this.cw && cz < this.chh) this.dirty.add(cz * this.cw + cx); } this.rev++; }
    flush() { this.objr.cull(this.cullV || null, this.cullVer || 0); if (!this.dirty.size) return; for (const k of this.dirty) this.buildChunk(k % this.cw, Math.floor(k / this.cw)); this.dirty.clear(); }
    buildAll() { for (let cz = 0; cz < this.chh; cz++) for (let cx = 0; cx < this.cw; cx++) this.buildChunk(cx, cz); }
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
        if (!this.interior) tops.quad(pos[0], pos[3], pos[2], pos[1], col[0], col[3], col[2], col[1], uv[0], uv[3], uv[2], uv[1]);
        // murs / falaises
        for (const [dx, dz, a, bb, na, nb] of SIDES) {
          const nx = tx + dx, nz = tz + dz; let nA, nB; const inb = this.inb(nx, nz);
          if (inb) { this.cornerH(nx, nz, n); nA = n[na]; nB = n[nb]; } else { if (wt || this.interior) continue; nA = nB = -4; }
          const tA = c[a], tB = c[bb];
          if (tA > nA + .001 || tB > nB + .001) {
            const A = [tx + CX[a], 0, tz + CZ[a]], B = [tx + CX[bb], 0, tz + CZ[bb]];
            const yA0 = Math.min(nA, tA), yB0 = Math.min(nB, tB);
            const uA = (A[0] + A[2]) * .5, uB = (B[0] + B[2]) * .5;
            const sh = wt ? .7 : 1;
            walls.quad([A[0], yA0, A[2]], [B[0], yB0, B[2]], [B[0], tB, B[2]], [A[0], tA, A[2]], [.62 * sh, .62 * sh, .62 * sh], [.62 * sh, .62 * sh, .62 * sh], [sh, sh, sh], [sh, sh, sh], [uA, yA0 / T], [uB, yB0 / T], [uB, tB / T], [uA, tA / T]);
          }
          // cascade : eau voisine plus basse
          if (wt && inb && this.water[nz * W + nx] && this.lvl[nz * W + nx] < this.lvl[i]) {
            const top = this.lvl[i] * T + WS, bot = this.lvl[nz * W + nx] * T + WS, o = .06;
            const A = [tx + CX[a] + dx * o, 0, tz + CZ[a] + dz * o], B = [tx + CX[bb] + dx * o, 0, tz + CZ[bb] + dz * o], uA = (A[0] + A[2]) * .5, uB = (B[0] + B[2]) * .5, w1 = [1, 1, 1];
            fal.quad([A[0], bot, A[2]], [B[0], bot, B[2]], [B[0], top + .02, B[2]], [A[0], top + .02, A[2]], w1, w1, w1, w1, [uA, bot * .5], [uB, bot * .5], [uB, top * .5], [uA, top * .5]);
            this.falls.set(i * 8 + (dx + 1) + (dz + 1) * 3, { c: key, x: tx + .5 + dx * .55, y: bot, z: tz + .5 + dz * .55, h: top - bot });
          }
        }
        if (wt) { // surface de l'eau
          const y = this.lvl[i] * T + WS; const wp = [], wc = [], wu = [];
          for (let k = 0; k < 4; k++) {
            const X = tx + CX[k], Z = tz + CZ[k]; wp.push([X, y, Z]); wu.push([X * .3, Z * .3]);
            const shore = this.shoreCorner(X, Z); const deep = wt === 2 ? .82 : 1;
            wc.push(shore ? [.92, .98, 1] : [.42 * deep, .74 * deep, .96 * deep]);
          }
          wat.quad(wp[0], wp[3], wp[2], wp[1], wc[0], wc[3], wc[2], wc[1], wu[0], wu[3], wu[2], wu[1]);
        }
      }
      const g = new THREE.Group(); const add = (buf, mat, shadow) => { const geo = buf.geo(); if (!geo) return; const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = shadow; m.frustumCulled = false; g.add(m); };
      add(tops, G.M.ground, true); add(walls, G.M.cliff, true); add(wat, G.M.water, false); add(fal, G.M.fall, false);
      this.chunks[key] = g; this.terrain.add(g);
    }
    aoCorner(X, Z, h) { for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = X + dx, z = Z + dz; if (!this.inb(x, z)) continue; const i = z * this.W + x; if (!this.water[i] && !this.ramp[i] && this.lvl[i] * T > h + .5) return true; } return false; }
    shoreCorner(X, Z) { for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = X + dx, z = Z + dz; if (this.inb(x, z) && !this.water[z * this.W + x]) return true; } return false; }
    serialize() {
      const objs = []; for (const o of this.list) { if (o.temp) continue; const e = { t: o.t, x: o.x, z: o.z }; if (o.r) e.r = o.r; for (const k of ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt']) if (o[k] != null && o[k] !== 0) e[k] = o[k]; if (G.OBJ[o.t].fruit && o.f === 0) e.f = 0; objs.push(e); }
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
