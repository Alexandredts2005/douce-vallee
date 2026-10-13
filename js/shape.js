'use strict';
// ===== Collisions à la forme des objets : la place prise correspond au dessin, pas à une boîte carrée.
// Pour chaque modèle, une petite carte de hauteurs (4×4 par case) est calculée à partir de ses triangles :
// on passe autour d'une fontaine ronde, sous les branches d'un arbre, sous un avant-toit, entre deux poteaux,
// on monte sur une marche ou un porche, mais un mur, un tronc ou une table bloquent. =====
(function () {
  const S = 8, BODY = 1.15, FLOOR = .04; // sous-cases par case ; hauteur du corps ; en dessous : simple décor au sol
  const cache = new Map();
  function build(d, key) {
    const i = key.lastIndexOf(':'), geo = G.getGeo(key.slice(0, i), +key.slice(i + 1)), fw = d.fp[0], fd = d.fp[1], W = fw * S, D = fd * S, N = W * D;
    const top = new Float32Array(N).fill(-1), side = new Float32Array(N).fill(-1), ups = new Array(N), downs = new Array(N);
    const pos = geo.attributes.position, idx = geo.index, n = idx ? idx.count : pos.count, V = k => idx ? idx.getX(k) : k, hx = fw / 2, hz = fd / 2, cap = d.h;
    const each = (ax, az, bx, bz, cx, cz, fn, edges) => {
      if (edges) for (const [x0, z0, x1, z1] of [[ax, az, bx, bz], [bx, bz, cx, cz], [cx, cz, ax, az]]) { const L = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2) + 1; for (let k = 0; k <= L; k++) { const f = k / L, qx = Math.floor(x0 + (x1 - x0) * f), qz = Math.floor(z0 + (z1 - z0) * f); if (qx >= 0 && qz >= 0 && qx < W && qz < D) fn(qz * W + qx); } }
      const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax); if (Math.abs(area) < .25) return;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(W - 1, Math.floor(Math.max(ax, bx, cx))), z0 = Math.max(0, Math.floor(Math.min(az, bz, cz))), z1 = Math.min(D - 1, Math.floor(Math.max(az, bz, cz)));
      for (let qz = z0; qz <= z1; qz++) for (let qx = x0; qx <= x1; qx++) { const px = qx + .5, pz = qz + .5;
        const w0 = (bx - px) * (cz - pz) - (bz - pz) * (cx - px), w1 = (cx - px) * (az - pz) - (cz - pz) * (ax - px), w2 = (ax - px) * (bz - pz) - (az - pz) * (bx - px);
        if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) fn(qz * W + qx); }
    };
    for (let t = 0; t + 2 < n; t += 3) {
      const a = V(t), b = V(t + 1), c = V(t + 2), ax3 = pos.getX(a), ay = pos.getY(a), az3 = pos.getZ(a), bx3 = pos.getX(b), by = pos.getY(b), bz3 = pos.getZ(b), cx3 = pos.getX(c), cy = pos.getY(c), cz3 = pos.getZ(c);
      const ymin = Math.min(ay, by, cy), ymax = Math.max(ay, by, cy); if (ymax <= FLOOR) continue;
      const ux = bx3 - ax3, uy = by - ay, uz = bz3 - az3, vx = cx3 - ax3, vy = cy - ay, vz = cz3 - az3, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1;
      const ax = (ax3 + hx) * S, az = (az3 + hz) * S, bx = (bx3 + hx) * S, bz = (bz3 + hz) * S, cx = (cx3 + hx) * S, cz = (cz3 + hz) * S, yt = Math.min(ymax, cap);
      if (Math.abs(ny / nl) > .7 && ymax - ymin < .06) { // face plate : dessus (vers le haut) ou dessous (vers le bas) d'un volume
        const y = (ay + by + cy) / 3, list = ny > 0 ? ups : downs; each(ax, az, bx, bz, cx, cz, k => { (list[k] || (list[k] = [])).push(y); if (yt > top[k]) top[k] = yt; }, false);
      } else { const low = ymin < BODY; each(ax, az, bx, bz, cx, cz, k => { if (yt > top[k]) top[k] = yt; if (low && yt > side[k]) side[k] = yt; }, true); }
    }
    const H = new Float32Array(N), F = new Uint8Array(N); // F : dessus plat (marche, plancher) sur lequel on peut monter
    for (let k = 0; k < N; k++) {
      let h = side[k] >= BODY ? top[k] : side[k]; const U = ups[k], Dn = downs[k];
      if (U) for (const y of U) if (y > FLOOR && y < BODY && y > h) h = y; // marche, plancher, dessus d'un meuble bas
      if (Dn) for (const yb of Dn) { if (yb >= BODY) continue; let yu = Infinity; if (U) for (const y of U) if (y > yb + .002 && y < yu) yu = y; const m = yu === Infinity || yu >= BODY ? top[k] : yu; if (m > h) h = m; } // un volume posé : plein jusqu'à son dessus
      H[k] = h; F[k] = U && U.some(y => Math.abs(y - h) < .03) ? 1 : 0;
    }
    const mk = { W, D, H, F, hx, hz }; cache.set(key, mk); return mk;
  }
  G.shapeMask = (d, key) => cache.get(key) || build(d, key);
  // hauteur du dessus de l'objet en (x, z), ou -1 si l'endroit est libre
  G.shapeTop = (o, d, x, z) => {
    const key = o._k || G.objKey(o), mk = cache.get(key) || build(d, key), [w, dd] = G.fpDims(d, o.r), dx = x - (o.x + w / 2), dz = z - (o.z + dd / 2);
    const r = o.r & 3, lx = r === 0 ? dx : r === 1 ? -dz : r === 2 ? -dx : dz, lz = r === 0 ? dz : r === 1 ? dx : r === 2 ? -dz : -dx;
    const qx = Math.floor((lx + mk.hx) * S), qz = Math.floor((lz + mk.hz) * S); G.shapeTop.flat = 1; if (qx < 0 || qz < 0 || qx >= mk.W || qz >= mk.D) return -1;
    G.shapeTop.flat = mk.F[qz * mk.W + qx]; return mk.H[qz * mk.W + qx];
  };
  // préparation tranquille des cartes des objets proches, pour éviter tout à-coup
  let qT = 0;
  G.on('frame', () => { const m = G.map, p = G.player; if (!m || !p || (qT = (qT + 1) % 20)) return; const x0 = Math.floor(p.x) - 12, z0 = Math.floor(p.z) - 12; let n = 0;
    for (let z = z0; z < z0 + 24 && n < 3; z++) for (let x = x0; x < x0 + 24 && n < 3; x++) { const o = m.objAt(x, z); if (!o) continue; const d = G.OBJ[o.t]; if (!(d.h > 0) || d.hAt) continue; const key = o._k || G.objKey(o); if (!cache.has(key)) { build(d, key); n++; } } });
})();
