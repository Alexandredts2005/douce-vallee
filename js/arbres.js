'use strict';
// ===== Arbres réalistes (style jeu vidéo) : troncs noueux à racines, branches, feuillage en touffes bosselées ;
// version simplifiée pour les arbres lointains (et en qualité basse), et des feuilles (ou des pétales) qui tombent en voletant =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  const low = () => G.settings && G.settings.quality === 'low';
  // LQ : on construit la version légère (loin de la caméra, ou qualité basse) : touffes moins fines, sans branches ni petits détails
  let LQ = false; const T = {};
  const both = (name, f) => { MD[name] = v => { LQ = low(); const g = f(v); LQ = false; return g; }; MD[name + '_lod'] = v => { LQ = true; const g = f(v); LQ = false; return g; }; };
  // feuille qui tombe : deux moitiés pliées le long de la nervure (origine = pétiole, pointe vers +z)
  const leafGeo = (both) => { const w = .32, B = [0, 0, 0], L = [-w, .07, .45], T = [0, .03, 1], R = [w, .07, .45], p = [B, L, T, B, T, R].concat(both ? [B, T, L, B, R, T] : []).flat();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; };

  // Les couleurs sont calculées par sommet (ombre sous le houppier, reflets au sommet, nuances), et les normales du feuillage
  // visent le centre du houppier : toutes les touffes s'éclairent comme un seul volume, à la manière des jeux récents.
  const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const hh = (x, y, z) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
    return L(L(L(hh(xi, yi, zi), hh(xi + 1, yi, zi), u), L(hh(xi, yi + 1, zi), hh(xi + 1, yi + 1, zi), u), v), L(L(hh(xi, yi, zi + 1), hh(xi + 1, yi, zi + 1), u), L(hh(xi, yi + 1, zi + 1), hh(xi + 1, yi + 1, zi + 1), u), v), w);
  }
  const fbm = (x, y, z) => vnoise(x, y, z) * .65 + vnoise(x * 2.3 + 5.2, y * 2.3, z * 2.3) * .35;
  // géométrie déjà colorée, ajoutée telle quelle (on garde ses normales)
  function raw(b, g, mat = 0) { if (g.index) g = g.toNonIndexed(); if (g.attributes.uv) g.deleteAttribute('uv'); b.parts[mat].push(g); return g; }
  function paint(g, fn) { const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), C = new THREE.Color();
    for (let i = 0; i < p.count; i++) { fn(C, p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); c[i * 3] = C.r; c[i * 3 + 1] = C.g; c[i * 3 + 2] = C.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
  const bark = {
    brun: (col, s) => (C, x, y, z) => { const a = Math.atan2(z, x), q = vnoise(Math.cos(a) * 3.2 + s, Math.sin(a) * 3.2, y * 1.6); C.set(col).multiplyScalar((.62 + .5 * G.smooth(G.clamp((q - .3) * 2.5, 0, 1))) * (.62 + .38 * Math.min(1, y / .45))); },
    bouleau: s => (C, x, y, z) => { const a = Math.atan2(z, x), q = vnoise(Math.cos(a) * 2.2 + s, Math.sin(a) * 2.2, y * 7.5), base = G.clamp(1 - y / .55 + (vnoise(a * 2, y * 4, s) - .5) * .5, 0, 1);
      C.set(q > .7 ? 0x3a3530 : 0xeeebe2).lerp(new THREE.Color(0x6e665c), base * .85).multiplyScalar(.9 + .1 * vnoise(a * 4, y * 20, 1)); },
    cerisier: (col, s) => (C, x, y, z) => { const a = Math.atan2(z, x), band = vnoise(a * .8 + s, y * 11, 0); C.set(col).multiplyScalar((band > .68 ? .62 : .95 + .15 * vnoise(Math.cos(a) * 3, Math.sin(a) * 3, y * 2)) * (.65 + .35 * Math.min(1, y / .45))); },
  };
  // tronc effilé et un peu tordu, avec l'empattement des racines
  function trunk(b, o) {
    const { h, r0, r1, seed = 1, lean = [0, 0], flare = .6, roots = 5, paintFn } = o, g = new THREE.CylinderGeometry(1, 1, 1, LQ ? 7 : 12, LQ ? 4 : 9, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), t = p.getY(i) + .5, ca = Math.cos(a), sa = Math.sin(a);
      let r = (r0 + (r1 - r0) * Math.pow(t, .75)) * (1 + flare * Math.pow(1 - t, 5) * (.5 + .5 * Math.cos(a * roots + seed))) * (.92 + .16 * vnoise(ca * 2 + seed, sa * 2, t * 4));
      p.setXYZ(i, ca * r + lean[0] * t * t + Math.sin(t * 3.1 + seed) * .025, t * h - .05, sa * r + lean[1] * t * t + Math.cos(t * 2.6 + seed) * .025); }
    g.computeVertexNormals(); raw(b, paint(g, paintFn));
    return [lean[0] + Math.sin(3.1 + seed) * .025, h - .05, lean[1] + Math.cos(2.6 + seed) * .025];
  }
  // branche : cylindre effilé d'un point à un autre
  function limb(b, a, c, ra, rb, paintFn) { if (LQ) return;
    const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(), g = new THREE.CylinderGeometry(rb, ra, L, 7, 2, true); g.translate(0, L / 2, 0);
    g.applyMatrix4(new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1))); raw(b, paint(g, paintFn));
  }
  // houppier : touffes [x, y, z, r, sx, sy, sz] ; renvoie un outil pour poser des fruits à la surface
  function foliage(b, cl, o) {
    const { pal, c, wrap = .62, amp = .22, freq = 2.3, seed = 1, tufts = 34, det, rng = G.rng(seed * 31 + 7) } = o, P = pal.map(x => new THREE.Color(x));
    let y0 = Infinity, y1 = -Infinity; for (const k of cl) { y0 = Math.min(y0, k[1] - k[3] * (k[5] || 1)); y1 = Math.max(y1, k[1] + k[3] * (k[5] || 1)); }
    const shade = (C, x, y, z, nx, ny) => { const t = G.clamp((y - y0) / (y1 - y0), 0, 1), k = G.clamp(t * .5 + (ny * .5 + .5) * .5 + (fbm(x * 2.6 + seed, y * 2.6, z * 2.6) - .5) * .55, 0, 1);
      if (k < .5) C.copy(P[0]).lerp(P[1], k * 2); else C.copy(P[1]).lerp(P[2], (k - .5) * 2); C.multiplyScalar(.88 + .24 * vnoise(x * 9 + seed, y * 9, z * 9)); };
    const disp = (i, ux, uy, uz) => 1 + amp * (fbm(ux * freq + i * 7.13 + seed, uy * freq + i, uz * freq) - .5) * 2 + amp * .5 * (vnoise(ux * freq * 3.4 + i * 3.1, uy * freq * 3.4 + seed, uz * freq * 3.4) - .5) * 2;
    const norm = (ux, uy, uz, px, py, pz) => { const cx = px - c[0], cy = (py - c[1]) * 1.15, cz = pz - c[2], l = Math.hypot(cx, cy, cz) || 1; const v = new V3(ux * (1 - wrap) + cx / l * wrap, uy * (1 - wrap) + cy / l * wrap, uz * (1 - wrap) + cz / l * wrap); return v.normalize(); };
    const surf = (i, ux, uy, uz, k = 1) => { const [x, y, z, r, sx = 1, sy = 1, sz = 1] = cl[i], fy = uy < -.2 ? .78 : 1, d = disp(i, ux, uy, uz) * k; return [x + ux * r * sx * d, y + uy * r * sy * d * fy, z + uz * r * sz * d]; };
    cl.forEach((k, i) => { const g = new THREE.IcosahedronGeometry(1, LQ ? 1 : det != null ? det : k[3] >= .45 ? 3 : 2), p = g.attributes.position, n = g.attributes.normal;
      for (let j = 0; j < p.count; j++) { const ux = p.getX(j), uy = p.getY(j), uz = p.getZ(j), q = surf(i, ux, uy, uz), v = norm(ux, uy, uz, q[0], q[1], q[2]); p.setXYZ(j, q[0], q[1], q[2]); n.setXYZ(j, v.x, v.y, v.z); }
      raw(b, paint(g, shade)); });
    // petites touffes qui dépassent : la silhouette n'est plus lisse
    const dir = (ymin = -.35) => { for (;;) { const v = new V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1); if (v.lengthSq() < 1 && v.lengthSq() > .05 && v.normalize().y > ymin) return v; } };
    for (let k = 0; k < (LQ ? 0 : tufts); k++) { const i = Math.floor(rng() * cl.length), u = dir(), q = surf(i, u.x, u.y, u.z, .98), s = cl[i][3] * (.2 + rng() * .14), g = new THREE.OctahedronGeometry(1, 0);
      g.applyMatrix4(new THREE.Matrix4().compose(new V3(q[0], q[1], q[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 3, rng() * 3, rng() * 3)), new V3(s, s * .7, s * 1.25)));
      const v = norm(u.x, u.y, u.z, q[0], q[1], q[2]), n = g.attributes.normal; for (let j = 0; j < n.count; j++) n.setXYZ(j, v.x, v.y, v.z); raw(b, paint(g, shade)); }
    // un point bien visible à la surface (hors des autres touffes), pour y accrocher un fruit
    const spot = (ymin = -.45) => { for (let t = 0; t < 60; t++) { const i = Math.floor(rng() * cl.length), u = dir(ymin), q = surf(i, u.x, u.y, u.z, 1.02);
      if (cl.every((k, j) => j === i || Math.hypot((q[0] - k[0]) / (k[4] || 1), (q[1] - k[1]) / (k[5] || 1), (q[2] - k[2]) / (k[6] || 1)) > k[3] * 1.12)) return q; } const u = dir(0); return surf(0, u.x, u.y, u.z, 1.04); };
    return { at: (i, u, k = 1) => surf(i, u.x, u.y, u.z, k), dir, rng, spot };
  }
  // petites pièces en basse définition (fruits, pétales) : b.sph et b.cyl imposent beaucoup de facettes
  const lo = (b, g, col, x, y, z, rz = 0) => { g.applyMatrix4(new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new V3(1, 1, 1))); raw(b, paint(g, C => C.set(col))); };
  T.tree_oak = v => { const b = G.mb(11), bp = bark.brun(0x7a5236, 1.3);
    const top = trunk(b, { h: 1.95, r0: .22, r1: .12, seed: 1.3, lean: [.06, -.04], flare: .75, paintFn: bp });
    for (const e of [[.62, 2.35, .28], [-.6, 2.4, .2], [.2, 2.45, -.55], [-.25, 2.55, .45], [.05, 2.9, 0]]) limb(b, [top[0] * .7, 1.3, top[2] * .7], e, .1, .04, bp);
    foliage(b, [[0, 2.78, 0, .78, 1.15, .8, 1.1], [.66, 2.36, .3, .55], [-.66, 2.42, .22, .56], [.26, 2.42, -.64, .55], [-.38, 2.46, -.54, .52], [.15, 2.3, .68, .5], [0, 3.28, .05, .52, 1, .8, 1], [.56, 2.98, -.2, .45], [-.52, 3.02, .16, .45]],
      { pal: [0x2b632b, 0x4b9638, 0x93c95a], c: [0, 2.65, 0], seed: 3 }); return b.done(); };
  T.tree_birch = v => { const b = G.mb(12), bp = bark.bouleau(2.1);
    trunk(b, { h: 3.05, r0: .13, r1: .06, seed: 2.1, lean: [.12, .03], flare: .3, roots: 4, paintFn: bp });
    for (const [a, c] of [[[.04, 1.6, 0], [.38, 2.3, .14]], [[.06, 1.85, .01], [-.36, 2.45, .1]], [[.08, 2.1, .01], [.12, 2.6, -.38]]]) limb(b, a, c, .045, .02, bp);
    foliage(b, [[.08, 2.9, 0, .48, 1, 1.35, 1], [.42, 2.45, .16, .36, 1, 1.15, 1], [-.32, 2.58, .12, .36, 1, 1.15, 1], [.14, 2.62, -.4, .36, 1, 1.1, 1], [-.1, 3.36, -.1, .36, 1, 1.1, 1], [.32, 3.18, .26, .32], [-.06, 2.2, .36, .3]],
      { pal: [0x4f8a2e, 0x8cbf45, 0xd2e57a], c: [.08, 2.8, 0], seed: 5, amp: .26, tufts: 22 }); return b.done(); };
  const FRUITC = [0xe8343a, 0xff9420, 0xffa38a];
  T.tree_fruit = v => { const b = G.mb(13 + v % 10), bp = bark.brun(0x7d5a3c, 2.7);
    const top = trunk(b, { h: 1.55, r0: .18, r1: .1, seed: 2.7, lean: [-.04, .05], flare: .6, paintFn: bp });
    for (const e of [[.52, 2.15, .3], [-.52, 2.2, .18], [.18, 2.2, -.52], [-.2, 2.3, -.42], [.02, 2.6, .05]]) limb(b, [top[0] * .8, 1.15, top[2] * .8], e, .085, .035, bp);
    const F = foliage(b, [[0, 2.42, 0, .72, 1.1, .85, 1.1], [.56, 2.2, .3, .46], [-.56, 2.25, .2, .46], [.2, 2.24, -.56, .45], [-.26, 2.3, -.46, .43], [.1, 2.15, .6, .42], [0, 2.88, 0, .45]],
      { pal: [0x2a6129, 0x4a963a, 0x8cc65c], c: [0, 2.4, 0], seed: 7 + v % 10, tufts: 24 });
    if (v < 10) { const c = FRUITC[v % 3]; for (let k = 0; k < 11; k++) { const [x, y, z] = F.spot(); lo(b, new THREE.SphereGeometry(.12, LQ ? 6 : 10, LQ ? 4 : 7), c, x, y, z); if (LQ) continue; lo(b, new THREE.SphereGeometry(.03, 5, 4), 0xfff3c8, x + .04, y + .05, z + .08); lo(b, new THREE.CylinderGeometry(.012, .012, .08, 4), 0x5a3a22, x, y + .14, z); } }
    return b.done(); };
  T.tree_cherry = v => { const b = G.mb(14), bp = bark.cerisier(0x5e3a30, 3.4);
    const top = trunk(b, { h: 1.5, r0: .2, r1: .11, seed: 3.4, lean: [.05, .02], flare: .65, paintFn: bp });
    for (const e of [[.82, 2.25, .26], [-.82, 2.3, .16], [.3, 2.3, -.68], [-.36, 2.35, -.6], [.15, 2.2, .72], [0, 2.7, 0]]) limb(b, [top[0] * .8, 1.2, top[2] * .8], e, .095, .035, bp);
    const F = foliage(b, [[0, 2.55, 0, .7, 1.4, .72, 1.28], [.8, 2.36, .26, .5, 1, .82, 1], [-.8, 2.4, .16, .5, 1, .82, 1], [.3, 2.42, -.68, .5, 1, .82, 1], [-.36, 2.45, -.62, .48, 1, .82, 1], [.15, 2.32, .74, .46, 1, .82, 1], [-.1, 2.96, .1, .48, 1, .78, 1]],
      { pal: [0xc9668e, 0xf2a2c2, 0xffe0ec], c: [0, 2.45, 0], seed: 9, tufts: 32 });
    const r = G.rng(77); for (let k = 0; k < (LQ ? 0 : 16); k++) { const a = r() * TAU, d = .45 + r() * .9; const pr = .05 + r() * .03; lo(b, new THREE.CylinderGeometry(pr, pr, .01, 7), k % 3 ? 0xffc6da : 0xfff0f5, Math.cos(a) * d, .012, Math.sin(a) * d); }
    if (v < 10) for (let k = 0; k < 7; k++) { const [x, y, z] = F.spot(-.4); lo(b, new THREE.SphereGeometry(.075, 8, 6), 0xc8102e, x, y, z); lo(b, new THREE.SphereGeometry(.075, 8, 6), 0xc8102e, x + .11, y - .03, z + .02); lo(b, new THREE.CylinderGeometry(.01, .01, .14, 4), 0x4c7a2a, x + .05, y + .1, z, .3); }
    return b.done(); };
  // sapin : étages de branches retombantes, à pointes ; neige sur le dessus des étages pour la variante enneigée
  T.tree_pine = v => { const b = G.mb(15), r = G.rng(15), snow = v === 1, G0 = new THREE.Color(0x1b4429), G1 = new THREE.Color(0x2e6a3c), G2 = new THREE.Color(0x67a457), SN = new THREE.Color(0xf4f8ff), SB = new THREE.Color(0xc9d8ea);
    trunk(b, { h: 3.4, r0: .17, r1: .05, seed: 1.7, flare: .55, paintFn: bark.brun(0x6b4630, 1.7) });
    const N = 7, pos = [], nor = [], col = [], C = new THREE.Color();
    const vert = (x, y, z, nx, ny, nz, k, sn) => { pos.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; nor.push(nx / l, ny / l, nz / l);
      if (k < .5) C.copy(G0).lerp(G1, k * 2); else C.copy(G1).lerp(G2, (k - .5) * 2); C.multiplyScalar(.88 + .24 * vnoise(x * 7, y * 7, z * 7)); if (sn > .35) C.lerp(SN, G.smooth(G.clamp((sn - .35) / .4, 0, 1))).lerp(SB, .25 * (1 - Math.min(1, sn))); col.push(C.r, C.g, C.b); };
    for (let t = 0; t < N; t++) { const f = t / (N - 1), y = .95 + f * 2.5, R = 1.02 * Math.pow(1 - f, .9) + .2, hT = .82 - f * .3, K = (LQ ? 8 : 13) - Math.round(f * (LQ ? 3 : 5)), off = r() * TAU, gk = .2 + f * .3;
      const ring = (rad, yy, jag, dy) => { const o = []; for (let i = 0; i < 2 * K; i++) { const a = off + i / (2 * K) * TAU, tip = i % 2 === 0, rr = rad * (tip ? 1 : jag) * (.92 + r() * .16); o.push([Math.cos(a) * rr, yy + (tip ? -dy : dy * .3) + (r() - .5) * .04, Math.sin(a) * rr, tip]); } return o; };
      const A = ring(R * .56, y + hT * .48, .9, .02), B = ring(R, y, .74, .1 + R * .06), ap = [0, y + hT, 0], un = [0, y + .16, 0];
      const sn = (yy, kk) => snow ? G.clamp(kk + (fbm(yy * 3, t, 0) - .5) * .4, 0, 1) : 0;
      for (let i = 0; i < 2 * K; i++) { const j = (i + 1) % (2 * K), a = A[i], c = A[j], p = B[i], q = B[j];
        vert(ap[0], ap[1], ap[2], 0, 1, 0, gk + .55, sn(ap[1], .9)); vert(c[0], c[1], c[2], c[0], R * .9, c[2], gk + .4, sn(c[1], .72)); vert(a[0], a[1], a[2], a[0], R * .9, a[2], gk + .4, sn(a[1], .72));
        vert(a[0], a[1], a[2], a[0], R * .9, a[2], gk + .4, sn(a[1], .72)); vert(c[0], c[1], c[2], c[0], R * .9, c[2], gk + .4, sn(c[1], .72)); vert(p[0], p[1], p[2], p[0], R * .45, p[2], gk + (p[3] ? .22 : .08), sn(p[1], p[3] ? .15 : .42));
        vert(c[0], c[1], c[2], c[0], R * .9, c[2], gk + .4, sn(c[1], .72)); vert(q[0], q[1], q[2], q[0], R * .45, q[2], gk + (q[3] ? .22 : .08), sn(q[1], q[3] ? .15 : .42)); vert(p[0], p[1], p[2], p[0], R * .45, p[2], gk + (p[3] ? .22 : .08), sn(p[1], p[3] ? .15 : .42));
        vert(un[0], un[1], un[2], 0, -1, 0, 0, 0); vert(p[0], p[1], p[2], p[0] * .3, -1, p[2] * .3, .05, 0); vert(q[0], q[1], q[2], q[0] * .3, -1, q[2] * .3, .05, 0); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); raw(b, g);
    return b.done(); };
  // palmier : stipe annelé et courbé, palmes arquées aux folioles en dents de scie, noix de coco
  T.tree_palm = v => { const b = G.mb(16), H = 3.15, LX = .62, cx = t => LX * t * t, g = new THREE.CylinderGeometry(1, 1, 1, LQ ? 7 : 10, LQ ? 16 : 40, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), t = p.getY(i) + .5, ring = 1 - ((t * 13) % 1), r = (.18 - .07 * t) * (1 + .13 * ring * ring) * (1 + .35 * Math.pow(1 - t, 6));
      p.setXYZ(i, cx(t) + Math.cos(a) * r, t * H - .04, Math.sin(a) * r); }
    g.computeVertexNormals(); raw(b, paint(g, (C, x, y) => { const t = y / H, ring = (t * 13) % 1; C.set(0x9c7c55).multiplyScalar((ring < .16 ? .62 : .92 + .18 * ring) * (.7 + .3 * Math.min(1, y / .4))); }));
    const tx = cx(1), ty = H - .08, r = G.rng(16); b.sph(.2, 0x7a6a3a, tx, ty, 0, 1.1, .75, 1.1, 0, 12, 8);
    const pos = [], nor = [], col = [], C = new THREE.Color(), D0 = new THREE.Color(0x2f6a2c), D1 = new THREE.Color(0x7ec04e), DD = new THREE.Color(0x9a7a45);
    const tri = (A, B, Cc, cA, cB, cC) => { const u = new V3().subVectors(B, A), w = new V3().subVectors(Cc, A), n = u.cross(w).normalize(); if (n.y < 0) { [B, Cc] = [Cc, B]; [cB, cC] = [cC, cB]; n.negate(); }
      for (const [P, c, s] of [[A, cA, 1], [B, cB, 1], [Cc, cC, 1], [A, cA, .62], [Cc, cC, .62], [B, cB, .62]]) { pos.push(P.x, P.y, P.z); const sg = s < 1 ? -1 : 1; nor.push(n.x * sg, n.y * sg, n.z * sg); col.push(c.r * s, c.g * s, c.b * s); } };
    const frond = (ang, len, lift, droop, dead) => { const S = LQ ? 6 : 12, dx = Math.cos(ang), dz = Math.sin(ang), sp = [], L = [], Rr = [], cs = [];
      for (let i = 0; i <= S; i++) { const s = i / S, d = len * s, y = ty + .05 + lift * s - droop * s * s, w = (dead ? .14 : .34) * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), .75) * (i % 2 ? .62 : 1) + .015;
        const sx = tx + dx * d, sz = dz * d, px = -dz, pz = dx; sp.push(new V3(sx, y, sz)); L.push(new V3(sx + px * w, y - w * .45, sz + pz * w)); Rr.push(new V3(sx - px * w, y - w * .45, sz - pz * w));
        cs.push(dead ? C.copy(DD).multiplyScalar(.8 + .3 * s).clone() : C.copy(D0).lerp(D1, s * .85 + .1 * hh(i, ang * 10, 3)).clone()); }
      for (let i = 0; i < S; i++) { tri(sp[i], sp[i + 1], L[i + 1], cs[i], cs[i + 1], cs[i + 1]); tri(sp[i], L[i + 1], L[i], cs[i], cs[i + 1], cs[i]); tri(sp[i], Rr[i + 1], sp[i + 1], cs[i], cs[i + 1], cs[i + 1]); tri(sp[i], Rr[i], Rr[i + 1], cs[i], cs[i], cs[i + 1]); }
      for (let i = 0; i < S; i += 3) limb(b, [sp[i].x, sp[i].y, sp[i].z], [sp[i + 1].x, sp[i + 1].y, sp[i + 1].z], .025, .018, (Cc) => Cc.set(dead ? 0x7a5a30 : 0x5f8a36)); };
    for (let i = 0; i < 13; i++) { const a = i / 13 * TAU + (r() - .5) * .3, up = i % 3 === 0; frond(a, 1.35 + r() * .3, up ? .95 : .55, up ? 1.25 : 1.5, false); }
    for (let i = 0; i < (LQ ? 0 : 2); i++) frond(i * 2.7 + 1, .9, -.1, 1.4, true);
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); raw(b, fg);
    if (v < 10) [[.05, -.24, .2], [.2, -.3, -.08], [-.16, -.28, -.1], [-.02, -.36, .02]].forEach(q => { b.sph(.15, 0x5e4126, tx + q[0], ty + q[1], q[2], 1, 1.08, 1, 0, 12, 9); b.sph(.03, 0x2e2015, tx + q[0] * 1.6, ty + q[1] - .02, q[2] * 1.6, 1, 1, 1, 0, 6, 4); });
    return b.done(); };
  for (const k in T) both(k, T[k]);
  // outils partagés (plantes de la gare, etc.)
  G.TREEKIT = { vnoise, fbm, raw, paint, bark, trunk, limb, foliage, lo };

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
