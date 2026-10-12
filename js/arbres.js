'use strict';
// ===== Arbres détaillés : tronc effilé avec racines, vraies branches, bouquets de feuilles ;
// et des feuilles (ou des pétales) qui tombent de temps en temps en voletant =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const OLD = {}; for (const k of ['tree_oak', 'tree_birch', 'tree_fruit', 'tree_cherry', 'tree_pine', 'tree_palm']) OLD[k] = MD[k];
  const low = () => G.settings && G.settings.quality === 'low';
  // LOD : version simplifiée (mêmes positions, mêmes couleurs, sans feuilles ni rameaux) pour les arbres lointains
  let LOD = false, RN = Math.random; const rnd = () => RN(), begin = (seed, lod) => { LOD = lod; RN = G.rng(seed); return G.mb(seed); };
  const shade = (h, k) => new THREE.Color(h).multiplyScalar(k);
  // feuille : deux moitiés pliées le long de la nervure (origine = pétiole, pointe vers +z), visible des deux côtés
  const leafGeo = (both) => { const w = .32, B = [0, 0, 0], L = [-w, .07, .45], T = [0, .03, 1], R = [w, .07, .45], p = [B, L, T, B, T, R].concat(both ? [B, T, L, B, R, T] : []).flat();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; };
  const LEAF = leafGeo(true);
  const f = new V3(), u = new V3(), r = new V3(), jv = new V3();
  // une feuille posée en P, orientée vers « dir » (retombe un peu), taille s
  function leaf(b, P, dir, s, col, droop = .35, ws = 1) {
    jv.set((rnd() - .5) * .6, (rnd() - .5) * .5, (rnd() - .5) * .6); f.copy(dir).addScaledVector(UP, -droop).add(jv).normalize();
    u.copy(UP).addScaledVector(f, -f.y); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize().applyAxisAngle(f, (rnd() - .5) * 1.3); if (LOD) return; r.crossVectors(u, f);
    const m = new THREE.Matrix4().makeBasis(r.multiplyScalar(s * ws), u.multiplyScalar(s), f.multiplyScalar(s)); m.setPosition(P[0], P[1], P[2]); b.geo(LEAF.clone(), col, m);
  }
  // morceau de bois effilé entre a et c (rayons ra → rc), arrondi
  function seg(b, a, c, ra, rc, col, sides) { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; d.divideScalar(L);
    b.geo(new THREE.CylinderGeometry(rc, ra, L, sides, 1, true), col, new THREE.Matrix4().compose(new V3((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), new THREE.Quaternion().setFromUnitVectors(UP, d), new V3(1, 1, 1)), 0, true); }
  // branche le long d'une suite de points (les morceaux se chevauchent pour ne pas laisser de trou aux coudes)
  function limb(b, pts, r0, r1, col, sides = 7) { const n = pts.length - 1; if (LOD) { if (sides < 9) return; sides = 6; }
    for (let i = 0; i < n; i++) { const ra = r0 + (r1 - r0) * i / n, rc = r0 + (r1 - r0) * (i + 1) / n, a = pts[i], c = pts[i + 1], d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
      const A = i ? [a[0] - d.x * ra * .6, a[1] - d.y * ra * .6, a[2] - d.z * ra * .6] : a, C = i < n - 1 ? [c[0] + d.x * rc * .6, c[1] + d.y * rc * .6, c[2] + d.z * rc * .6] : c; seg(b, A, C, ra, rc, col, sides); } }
  // chemin courbe : part de p0 dans la direction dir, se relève (bend > 0) ou retombe (bend < 0)
  function path(b, p0, dir, L, n, bend, wob = .1) { const out = [p0.slice()], p = new V3(p0[0], p0[1], p0[2]), d = new V3(dir[0], dir[1], dir[2]).normalize();
    for (let i = 1; i <= n; i++) { d.addScaledVector(UP, bend / n); d.x += (rnd() - .5) * wob; d.y += (rnd() - .5) * wob; d.z += (rnd() - .5) * wob; d.normalize(); p.addScaledVector(d, L / n); out.push([p.x, p.y, p.z]); } return out; }
  // bouquet de feuillage : boule sombre à l'intérieur (profondeur) + feuilles tout autour, plus claires en haut
  function cluster(b, C, R, pal, n, o = {}) { const sy = o.sy || 1;
    b.jit(.05); if (LOD) b.blob(R * 1.06, 1, shade(pal[3] || pal[2], .86), C[0], C[1], C[2], 1, sy, 1); else b.blob(R * .86, 1, shade(pal[2], o.dark || .8), C[0], C[1], C[2], 1, sy, 1); b.jit(.16);
    for (let i = 0; i < n; i++) { const th = rnd() * TAU, y = 2 * Math.pow(rnd(), o.up || .7) - 1, rr = Math.sqrt(1 - y * y), d = new V3(rr * Math.cos(th), y, rr * Math.sin(th)), k = R * (.8 + rnd() * .22);
      const c = pal[1 + Math.floor(rnd() * (pal.length - 1))]; leaf(b, [C[0] + d.x * k, C[1] + d.y * k * sy, C[2] + d.z * k], d, (o.ls || .3) * (.8 + rnd() * .4), shade(c, .82 + .3 * (y + 1) / 2), o.droop == null ? .35 : o.droop, o.ws || 1); }
    b.jit(0); }
  const roots = (b, n, rr, bark) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd() * .5, dx = Math.cos(a), dz = Math.sin(a), L = .34 + rnd() * .1; limb(b, [[dx * .05, .34, dz * .05], [dx * L * .5, .1, dz * L * .5], [dx * L, -.02, dz * L]], rr, .02, shade(bark, .92), 5); } };

  // feuillu générique : tronc, racines, branches maîtresses, rameaux, bouquets ; renvoie les bouquets (pour les fruits)
  function broadleaf(b, o) {
    b.jit(.22); roots(b, 5, o.tr * .55, o.bark);
    const tp = path(b, [0, 0, 0], [(rnd() - .5) * .2, 1, (rnd() - .5) * .2], o.th, 3, 0, .05); limb(b, tp, o.tr, o.tr * .6, o.bark, 10);
    const top = tp[3], cl = [];
    for (let i = 0; i < o.nb; i++) { const a = i / o.nb * TAU + rnd() * .7, el = o.belev + (rnd() - .5) * .35, h = .5 + rnd() * .45, s = [0, 1, 2].map(k => tp[1][k] + (top[k] - tp[1][k]) * h);
      const bp = path(b, s, [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], o.blen * (.85 + rnd() * .3), 3, o.bend || .25, .12); b.jit(.18); limb(b, bp, o.tr * .5, o.tr * .16, o.bark2 || o.bark, 6);
      const a2 = a + (rnd() < .5 ? -1 : 1) * (.6 + rnd() * .4), tw = path(b, bp[1], [Math.cos(a2), .9, Math.sin(a2)], o.blen * .45, 2, .2, .15); limb(b, tw, o.tr * .2, o.tr * .07, o.bark2 || o.bark, 5);
      cl.push([bp[3], o.cr * (.9 + rnd() * .25)], [tw[2], o.cr * (.55 + rnd() * .15)]); }
    cl.push([[top[0], top[1] + o.cr * 1.25, top[2]], o.cr * 1.15]);
    b.jit(.05); b.blob(o.cr * 1.25, 1, shade(o.pal[1], .7), top[0], top[1] + o.cr * .6, top[2], 1.1, o.sy || 1, 1);
    for (const [c, R] of cl) cluster(b, [c[0], c[1] + .12, c[2]], R, o.pal, Math.round(o.leaves * R / o.cr), o);
    return cl;
  }
  const OAKP = [0x2f6b2c, 0x4a8f3a, 0x5aa244, 0x6db452, 0x83c25c, 0x9cc85a];
  const oak = (v, lod) => { const b = begin(11, lod);
    broadleaf(b, { th: 1.75, tr: .21, bark: 0x6e4b31, nb: 5, blen: 1.05, belev: .7, cr: .6, pal: OAKP, leaves: 42, ls: .24 }); return b.done(); };
  MD.tree_oak = v => oak(v, low()); MD.tree_oak_lod = v => oak(v, true);
  const FRUITC = [0xd8282e, 0xff8a14, 0xffa07a];
  const fruit = (v, lod) => { const b = begin(13 + v % 10, lod);
    const cl = broadleaf(b, { th: 1.45, tr: .18, bark: 0x7a5236, nb: 5, blen: .95, belev: .62, cr: .56, pal: [0x2f6e2c, 0x4e9a3c, 0x60ad46, 0x78bf55, 0x90cc60], leaves: 36, ls: .23 });
    if (v < 10) { const c = FRUITC[v % 3]; for (let i = 0; i < 11; i++) { const [C, R] = cl[i % cl.length], th = rnd() * TAU, y = -.55 + rnd() * .9, rr = Math.sqrt(1 - y * y), k = R + .06, x = C[0] + rr * Math.cos(th) * k, yy = C[1] + .12 + y * k, z = C[2] + rr * Math.sin(th) * k;
      b.sph(.12, c, x, yy, z, 1, .95, 1, 0, lod ? 5 : 7, lod ? 4 : 5); if (!lod) b.cyl(.012, .012, .1, 4, 0x5a3b22, x, yy + .14, z); } }
    return b.done(); };
  MD.tree_fruit = v => fruit(v, low()); MD.tree_fruit_lod = v => fruit(v, true);
  const cherry = (v, lod) => { const b = begin(14, lod);
    const cl = broadleaf(b, { th: 1.45, tr: .19, bark: 0x4e342a, bark2: 0x5a3c2e, nb: 6, blen: 1.25, belev: .45, bend: .3, cr: .58, sy: .82, pal: [0xd77a9a, 0xffb3cc, 0xffc6d8, 0xffd9e6, 0xfff0f4, 0xff9fbf], leaves: 36, ls: .21, droop: .15, dark: 1 });
    if (v < 10 && !lod) for (let i = 0; i < 5; i++) { const [C, R] = cl[i * 2 % cl.length], x = C[0] + (rnd() - .5) * R, z = C[2] + (rnd() - .5) * R, y = C[1] - R * .75;
      b.cyl(.01, .01, .22, 4, 0x4f7a2a, x, y - .02, z, 0, 0, .25); b.cyl(.01, .01, .22, 4, 0x4f7a2a, x + .05, y - .02, z, 0, 0, -.25); b.sph(.07, 0xc8102e, x - .03, y - .14, z, 1, 1, 1, 0, 6, 4); b.sph(.07, 0xc8102e, x + .09, y - .15, z, 1, 1, 1, 0, 6, 4); }
    return b.done(); };
  MD.tree_cherry = v => cherry(v, low()); MD.tree_cherry_lod = v => cherry(v, true);
  const birch = (v, lod) => { const b = begin(12, lod);
    const cl = broadleaf(b, { th: 2.5, tr: .14, bark: 0xeeeae0, bark2: 0x8a8076, nb: 6, blen: .85, belev: 1.0, bend: .2, cr: .46, sy: 1.15, pal: [0x4f7a2e, 0x7fae45, 0x93c052, 0xa9d064, 0xc4dc78], leaves: 32, ls: .2 });
    if (!lod) for (let i = 0; i < 16; i++) { const a = rnd() * TAU, y = .25 + rnd() * 2.1, rr = .14 - y * .025; b.box(.05 + rnd() * .05, .022, .02, 0x2e2a26, Math.cos(a) * rr, y, Math.sin(a) * rr, 0, -a + Math.PI / 2, 0); }
    return b.done(); };
  MD.tree_birch = v => birch(v, low()); MD.tree_birch_lod = v => birch(v, true);
  // sapin : tronc effilé, étages de branches tombantes, pointe ; v 1 = enneigé
  const pine = (v, lod) => { const b = begin(15, lod); b.jit(.2);
    limb(b, [[0, 0, 0], [0, 2.2, 0], [0, 4.3, 0]], .2, .04, 0x6a452c, 8); roots(b, 4, .1, 0x6a452c);
    const G1 = [0x1f5a35, 0x2a6b3f, 0x347a48, 0x3f8752], T = 8;
    const frond = (y, a, L, w, droop, col) => { const d = new V3(Math.cos(a) * Math.cos(-droop), Math.sin(-droop), Math.sin(a) * Math.cos(-droop)); if (lod) return d; const z = new V3(0, 1, 0).addScaledVector(d, -d.y).normalize(), x = new V3().crossVectors(d, z);
      const m = new THREE.Matrix4().makeBasis(x.multiplyScalar(w), d.clone().multiplyScalar(L), z.multiplyScalar(w * .32)); m.setPosition(d.x * L * .5, y + d.y * L * .5, d.z * L * .5); b.geo(new THREE.ConeGeometry(1, 1, 5), col, m); return d; };
    for (let t = 0; t < T; t++) { const k = t / (T - 1), y = .85 + k * 3.2, R = .25 + 1.15 * Math.pow(1 - k, 1.1), n = Math.round(8 - k * 4), off = rnd() * TAU;
      b.jit(.05); if (lod) { b.cone(R * 1.02, .95, 7, G1[2], 0, y - .05, 0); if (v === 1) b.cone(R * .8, .3, 7, 0xf4f8ff, 0, y + .2, 0); } else b.cone(R * .62, .75, 6, shade(G1[0], .75), 0, y + .05, 0); b.jit(.2);
      for (let i = 0; i < n; i++) { const a = off + i / n * TAU + (rnd() - .5) * .3, L = R * (.9 + rnd() * .25), dr = .32 + rnd() * .15, d = frond(y + (rnd() - .5) * .1, a, L, .2 + R * .14, dr, G1[1 + Math.floor(rnd() * 3)]);
        if (t < T - 3) frond(y + .2, a + Math.PI / n, L * .7, .14 + R * .1, dr - .08, G1[1 + Math.floor(rnd() * 3)]);
        if (v === 1 && !lod) { const m = new THREE.Matrix4().compose(new V3(d.x * L * .45, y + d.y * L * .45 + .09, d.z * L * .45), new THREE.Quaternion().setFromAxisAngle(UP, -a), new V3(L * .42, .05, .12 + R * .07)); b.geo(new THREE.SphereGeometry(1, 7, 4), 0xf4f8ff, m, 0, true); } } }
    b.cone(.2, .7, 7, G1[3], 0, 4.35, 0); if (v === 1) b.cone(.16, .3, 7, 0xffffff, 0, 4.45, 0);
    b.jit(0); return b.done(); };
  MD.tree_pine = v => pine(v, low()); MD.tree_pine_lod = v => pine(v, true);
  // palmier : tronc courbe annelé, palmes en arc avec folioles, noix de coco
  MD.tree_palm_lod = v => OLD.tree_palm(v);
  MD.tree_palm = v => { if (low()) return OLD.tree_palm(v); const b = begin(16, false); b.jit(.12);
    let x = 0, y = 0, a = 0; for (let i = 0; i < 9; i++) { const h = .42, r0 = .17 - i * .008; b.cyl(r0 * .92, r0 * 1.08, h, 9, i % 2 ? 0xb08a58 : 0x9c7748, x, y + h / 2, 0, 0, 0, -a, 0, true); b.tor(r0 * 1.02, .02, 0x7d5e3a, x + Math.sin(a) * h * .02, y + .02, 0, Math.PI / 2, 0, a); x += Math.sin(a) * h; y += Math.cos(a) * h; a += .06; }
    const top = [x, y, 0]; b.blob(.2, 1, 0x7a8a3a, x, y + .02, 0);
    for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + rnd() * .3, el = .35 + (i % 3) * .18, rp = path(b, top, [Math.cos(an) * Math.cos(el), Math.sin(el), Math.sin(an) * Math.cos(el)], 1.6, 5, -1.15, .04);
      limb(b, rp, .035, .01, 0x6f8a36, 4); b.jit(.14);
      for (let j = 1; j < 5; j++) { const p0 = rp[j], p1 = rp[j + 1], dd = new V3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize(), side = new V3().crossVectors(dd, UP).normalize();
        for (let q = 0; q < 3; q++) { const t = q / 3, P = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t], s = .55 - j * .08;
          for (const sg of [-1, 1]) leaf(b, P, side.clone().multiplyScalar(sg).addScaledVector(dd, .7), s, [0x3f8f3a, 0x4fa244, 0x5cb04c][(j + q) % 3], .6, .3); } } }
    b.jit(0); if (v < 10) for (const [px, pz] of [[.12, .1], [-.1, .12], [.02, -.14]]) b.sph(.14, 0x5e4224, x + px, y - .18, pz, 1, 1, 1, 0, 9, 7);
    return b.done(); };

  // ===== feuilles qui tombent =====
  G.leafFall = true;
  const FALL = { tree_oak: [[0x5aa244, 0x6db452, 0x83c25c], [0xe8a030, 0xd9682a, 0xf2c94c, 0xb5452a, 0x83c25c]], tree_fruit: [[0x60ad46, 0x78bf55], [0xe8b030, 0xd98a2a, 0x78bf55]],
    tree_birch: [[0x93c052, 0xa9d064], [0xf2d24c, 0xe8b830, 0xf5e07a]], tree_cherry: [[0xffc6d8, 0xffe4ee, 0xff9fbf], [0xffc6d8, 0xffe4ee, 0xff9fbf]] };
  const N = 64, fl = []; let mesh = null, near = [], scanT = 0, acc = 0;
  const MM = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new V3(), S = new V3();
  const month = () => { const d = new Date(G.startDate || Date.now()); d.setDate(d.getDate() + ((G.clock && G.clock.day) || 1) - 1); return d.getMonth(); };
  function init() { const g = leafGeo(false); g.translate(0, 0, -.5); g.computeVertexNormals();
    mesh = new THREE.InstancedMesh(g, G.toon({ side: THREE.DoubleSide }), N); mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N; i++) { mesh.setColorAt(i, new THREE.Color(1, 1, 1)); fl.push({ on: false }); } mesh.count = 0; G.scene.add(mesh); }
  function spawn(o, aut) { const l = fl.find(q => !q.on); if (!l) return; const d = G.OBJ[o.t], [cx, cz] = G.map.center(o), a = Math.random() * TAU, rr = .5 + Math.random() * .9, pal = FALL[d.model][aut ? 1 : 0], petal = d.model === 'tree_cherry';
    Object.assign(l, { on: true, land: 0, t: 0, lt: 0, x: cx + Math.cos(a) * rr, z: cz + Math.sin(a) * rr, y: o.y + 1.9 + Math.random() * 1.1, vy: -(.45 + Math.random() * .3), f: 1.3 + Math.random() * 1.2, ph: Math.random() * TAU,
      amp: .5 + Math.random() * .5, spin: (Math.random() - .5) * 3, rx: 0, ry: Math.random() * TAU, rz: 0, s: petal ? .09 + Math.random() * .04 : .15 + Math.random() * .07, life: 4 + Math.random() * 4, w: false, c: new THREE.Color(pal[Math.floor(Math.random() * pal.length)]) }); }
  G.on('enterMap', () => { for (const l of fl) l.on = false; near = []; scanT = 0; });
  G.on('update', dt => { if (!mesh) init(); const m = G.map, p = G.player; if (!m || !p) return; const out = !m.interior;
    if (out && (scanT -= dt) < 0) { scanT = 2; near = []; for (const o of m.list) { const d = G.OBJ[o.t]; if (d.chop >= 3 && FALL[d.model] && Math.abs(o.x - p.x) < 20 && Math.abs(o.z - p.z) < 20) near.push(o); } }
    if (out && near.length) { const mo = month(), aut = mo >= 8 && mo <= 10; acc += dt * Math.min(.9, .15 + near.length * .03) * (aut ? 1.8 : mo === 11 || mo <= 1 ? .4 : 1); while (acc > 1) { acc -= 1; spawn(near[Math.floor(Math.random() * near.length)], aut && Math.random() < .75); } } else acc = 0;
    const t = performance.now() / 1000, wx = .35 * Math.sin(t * .05), wz = .22 * Math.cos(t * .07); let k = 0;
    for (const l of fl) { if (!l.on) continue; l.t += dt; if (l.t > 30 || !out) { l.on = false; continue; }
      if (!l.land) { l.x += (wx + Math.cos(l.t * l.f + l.ph) * l.amp) * dt; l.z += (wz + Math.sin(l.t * l.f * .7 + l.ph) * l.amp * .6) * dt; l.y += l.vy * (1 + .45 * Math.sin(l.t * l.f * 2 + l.ph)) * dt; l.ry += l.spin * dt;
        if (!m.inb(Math.floor(l.x), Math.floor(l.z))) { l.on = false; continue; }
        const w = m.isWaterAt(l.x, l.z), oo = m.objAt(Math.floor(l.x), Math.floor(l.z)), g = w ? m.waterSurf(Math.floor(l.x), Math.floor(l.z)) + .01 : (oo && G.OBJ[oo.t].chop ? m.terrainH(l.x, l.z) : m.topAt(l.x, l.z)) + .012;
        if (l.y <= g) { l.y = g; l.land = 1; l.w = w; l.rx = (Math.random() - .5) * .2; l.rz = (Math.random() - .5) * .2; } else { l.rx = Math.sin(l.t * l.f + l.ph) * .9; l.rz = Math.cos(l.t * l.f + l.ph) * .6; } }
      else { l.lt += dt; if (l.w) { l.x += wx * .3 * dt; l.z += wz * .3 * dt; l.ry += .1 * dt; } if (l.lt > l.life) { l.on = false; continue; } }
      E.set(l.rx, l.ry, l.rz, 'YXZ'); Q.setFromEuler(E); P.set(l.x, l.y, l.z); S.setScalar(l.s * (l.land && l.lt > l.life - 1 ? Math.max(0, l.life - l.lt) : 1)); MM.compose(P, Q, S); mesh.setMatrixAt(k, MM); mesh.setColorAt(k, l.c); k++; }
    mesh.count = k; mesh.visible = k > 0; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; });
})();
