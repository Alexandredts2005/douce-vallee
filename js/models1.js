'use strict';
// ===== Modèles low-poly fusionnés (1 géométrie par type, couleurs par sommet) — partie 1 : outil + nature =====
(function () {
  const TAU = Math.PI * 2;
  class MB {
    constructor(seed = 1) { this.parts = [[], [], [], [], []]; this.r = G.rng(seed); this.j = 0; this.pat = 0; }
    // motif procédural (briques, pierre, tuiles…) pour les pièces suivantes : 0 = aucun
    P(id = 0) { this.pat = id; return this; }
    jit(a) { this.j = a; return this; }
    M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
    }
    add(geo, col, m, mat = 0, smooth = false) {
      let g = geo.index ? geo.toNonIndexed() : geo;
      g.deleteAttribute('uv'); if (g.attributes.uv2) g.deleteAttribute('uv2');
      g.applyMatrix4(m); if (!smooth) g.computeVertexNormals();
      const n = g.attributes.position.count, c = new Float32Array(n * 3), C = new THREE.Color(col);
      for (let i = 0; i < n; i += 3) {
        const k = this.j ? 1 + (this.r() - .5) * this.j : 1;
        for (let v = 0; v < 3 && i + v < n; v++) { c[(i + v) * 3] = C.r * k; c[(i + v) * 3 + 1] = C.g * k; c[(i + v) * 3 + 2] = C.b * k; }
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      if (this.pat && mat === 0) { g.userData.pat = this.pat; mat = 4; }
      this.parts[mat].push(g); return this;
    }
    box(w, h, d, col, x, y, z, rx, ry, rz, mat = 0) { return this.add(new THREE.BoxGeometry(w, h, d), col, this.M(x, y, z, rx, ry, rz), mat); }
    cyl(rt, rb, h, seg, col, x, y, z, rx, ry, rz, mat = 0, smooth = false) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), col, this.M(x, y, z, rx, ry, rz), mat, smooth); }
    cone(r, h, seg, col, x, y, z, rx, ry, rz, mat = 0) { return this.add(new THREE.ConeGeometry(r, h, seg), col, this.M(x, y, z, rx, ry, rz), mat); }
    sph(r, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0, ws = 10, hs = 8, smooth = true) { return this.add(new THREE.SphereGeometry(r, ws, hs), col, this.M(x, y, z, 0, 0, 0, sx, sy, sz), mat, smooth); }
    ico(r, det, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0, ry = 0) { return this.add(new THREE.IcosahedronGeometry(r, det), col, this.M(x, y, z, 0, ry, 0, sx, sy, sz), mat); }
    tor(r, t, col, x, y, z, rx = 0, ry = 0, rz = 0, mat = 0, seg = 12) { return this.add(new THREE.TorusGeometry(r, t, 6, seg), col, this.M(x, y, z, rx, ry, rz), mat, true); }
    geo(g, col, m, mat = 0, smooth = false) { return this.add(g, col, m, mat, smooth); }
    blob(r, det, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0) { return this.add(new THREE.IcosahedronGeometry(r, det), col, this.M(x, y, z, 0, 0, 0, sx, sy, sz), mat, true); }
    done() {
      const geos = [], groups = []; let start = 0;
      let anyPat = false; for (let m = 0; m < 5; m++) { let cnt = 0; for (const g of this.parts[m]) { geos.push(g); cnt += g.attributes.position.count; if (g.userData.pat) anyPat = true; } if (cnt) { groups.push([start, cnt, m]); start += cnt; } }
      const N = start, pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), col = new Float32Array(N * 3), pat = anyPat ? new Float32Array(N) : null; let o = 0;
      for (const g of geos) { const n = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); if (pat && g.userData.pat) pat.fill(g.userData.pat, o, o + n); o += n; }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); if (pat) out.setAttribute('pat', new THREE.BufferAttribute(pat, 1));
      groups.forEach(([s, c, m]) => out.addGroup(s, c, m)); out.computeBoundingSphere(); out.computeBoundingBox();
      return out;
    }
  }
  G.MB = MB; G.mb = s => new MB(s);
  G.MODELS = {};
  const cache = {};
  G.getGeo = (name, v = 0) => {
    const k = name + ':' + v; if (cache[k]) return cache[k];
    if (v >= 100) { const g = G.getGeo(name, v - 100).clone(); g.groups = g.groups.map(gr => ({ start: gr.start, count: gr.count, materialIndex: gr.materialIndex === 1 || gr.materialIndex === 3 ? 0 : gr.materialIndex })); return cache[k] = g; } // lampe éteinte
    const f = G.MODELS[name]; cache[k] = f ? f(v) : G.MODELS._missing(); return cache[k];
  };
  const MD = G.MODELS;
  MD._missing = () => G.mb().box(.6, .6, .6, 0xff00ff, 0, .3, 0).done();

  // ---------- Arbres ----------
  const trunk = (b, h = 1.5, col = 0x8a5a3b, r = .17) => { b.cyl(r * .85, r * 1.25, h, 7, col, 0, h / 2, 0); b.cone(r * 2, .3, 7, col, 0, .12, 0); };
  function canopy(b, cols, s = 1) {
    b.jit(.05);
    b.blob(1.05 * s, 1, cols[0], 0, 2.35, 0, 1, .92, 1);
    b.blob(.72 * s, 1, cols[1], .62 * s, 2.0, .22, 1, .9, 1);
    b.blob(.74 * s, 1, cols[1], -.6 * s, 2.05, -.12, 1, .9, 1);
    b.blob(.78 * s, 1, cols[2], .05, 2.95, -.05, 1, .85, 1);
    b.blob(.55 * s, 1, cols[2], .1, 2.2, .72 * s, 1, .9, 1);
    b.jit(0);
  }
  MD.tree_oak = v => { const b = G.mb(11); trunk(b); canopy(b, [0x58b54a, 0x4aa443, 0x6cc458]); return b.done(); };
  MD.tree_birch = v => {
    const b = G.mb(12); b.cyl(.13, .17, 1.9, 7, 0xf2efe6, 0, .95, 0);
    for (let i = 0; i < 5; i++) b.box(.1, .04, .03, 0x3a3530, (i % 2 ? .06 : -.05), .35 + i * .3, .15, 0, 0, i % 2 ? .3 : -.3);
    b.jit(.05); b.blob(.85, 1, 0xa3d46a, 0, 2.5, 0, 1, 1.15, 1); b.blob(.6, 1, 0x8cc35a, .45, 2.15, .2); b.blob(.6, 1, 0xb8e07a, -.4, 2.9, -.05); return b.done();
  };
  const FRUITC = [0xe8343a, 0xff9420, 0xffa38a];
  MD.tree_fruit = v => {
    const b = G.mb(13 + v % 10); trunk(b); canopy(b, [0x4fae46, 0x45a03f, 0x63bf55], .97);
    if (v < 10) { const c = FRUITC[v % 3]; [[.55, 2.2, .75], [-.5, 2.5, .72], [.1, 1.95, .95], [.85, 2.6, .2], [-.8, 2.0, .3], [.2, 3.05, .6]].forEach(p => b.sph(.13, c, p[0], p[1], p[2], 1, 1, 1, 0, 6, 4)); }
    return b.done();
  };
  MD.tree_cherry = v => {
    const b = G.mb(14); trunk(b, 1.5, 0x6e4733); canopy(b, [0xffb5cf, 0xff9fc0, 0xffd0e0]);
    if (v < 10) [[.5, 2.2, .78], [-.45, 2.4, .75], [.2, 2.9, .65]].forEach(p => { b.sph(.08, 0xd81b3a, p[0], p[1], p[2], 1, 1, 1, 0, 5, 4); b.sph(.08, 0xd81b3a, p[0] + .12, p[1] - .04, p[2], 1, 1, 1, 0, 5, 4); });
    return b.done();
  };
  MD.tree_pine = v => {
    const b = G.mb(15); b.cyl(.15, .2, .9, 6, 0x7a4e30, 0, .45, 0); b.jit(.1);
    const g = [0x2f7d4a, 0x37895a, 0x43976a];
    b.cone(1.15, 1.5, 7, g[0], 0, 1.5, 0); b.cone(.9, 1.3, 7, g[1], 0, 2.4, 0, 0, .3); b.cone(.62, 1.1, 7, g[2], 0, 3.25, 0, 0, .6);
    if (v === 1) { b.cone(.8, .5, 7, 0xf4f8ff, 0, 2.95, 0, 0, .3); b.cone(.55, .45, 7, 0xffffff, 0, 3.6, 0, 0, .6); b.cone(1.0, .45, 7, 0xeef4ff, 0, 2.05, 0); }
    return b.done();
  };
  MD.tree_palm = v => {
    const b = G.mb(16); let x = 0, y = 0, a = 0;
    for (let i = 0; i < 6; i++) { const h = .55; b.cyl(.13 - i * .008, .16 - i * .008, h, 7, i % 2 ? 0xb8925e : 0xa8814f, x, y + h / 2, 0, 0, 0, -a); x += Math.sin(a) * h; y += Math.cos(a) * h; a += .07; }
    b.jit(.1);
    for (let i = 0; i < 7; i++) { const ang = i / 7 * TAU; const lf = new THREE.ConeGeometry(.22, 1.6, 4); b.geo(lf, i % 2 ? 0x3f9e4a : 0x52b35a, b.M(x + Math.cos(ang) * .65, y - .15, Math.sin(ang) * .65, 0, -ang, 0).multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2 - .45)).multiply(new THREE.Matrix4().makeScale(1, 1, .25))); }
    b.jit(0);
    if (v < 10) [[0, -.25, .2], [.18, -.3, -.1], [-.16, -.28, -.08]].forEach(p => b.sph(.15, 0x6b4a2a, x + p[0], y + p[1], p[2], 1, 1, 1, 0, 8, 6));
    return b.done();
  };
  MD.bush = v => {
    const b = G.mb(17 + v); b.jit(.06);
    const c = v === 2 ? [0x4f9a4a, 0x5aa853] : [0x4a9e45, 0x58ae50];
    b.blob(.48, 1, c[0], 0, .42, 0, 1.1, .85, 1); b.blob(.36, 1, c[1], .3, .38, .12); b.blob(.34, 1, c[1], -.3, .36, .05); b.blob(.3, 1, c[0], .02, .7, -.05);
    b.jit(0);
    if (v === 1) [[.25, .55, .35], [-.2, .62, .33], [.05, .8, .25], [.38, .38, .25], [-.38, .35, .2]].forEach(p => b.sph(.07, 0x5b55d6, p[0], p[1], p[2], 1, 1, 1, 0, 6, 5));
    if (v === 2) [[.2, .6, .3, 0x9aa8ff], [-.25, .58, .28, 0xf6a3d0], [.0, .86, .1, 0xb7c1ff], [.38, .4, .15, 0xf6a3d0], [-.4, .4, .1, 0x9aa8ff]].forEach(p => b.blob(.16, 1, p[3], p[0], p[1], p[2]));
    if (v === 3) [[.22, .58, .32], [-.28, .55, .28], [.02, .85, .14], [.4, .4, .18], [-.42, .38, .12], [.12, .3, .42]].forEach((p, i) => { const c = [0xe8434a, 0xff6f9a, 0xff9a3c][i % 3]; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.sph(.06, c, p[0] + Math.cos(a) * .07, p[1] + Math.sin(a) * .07, p[2] + .03, 1, 1, .5, 0, 6, 4); } b.sph(.03, 0xffe27a, p[0], p[1], p[2] + .07); });
    return b.done();
  };
  MD.stump = v => { const b = G.mb(); b.cyl(.3, .36, .36, 8, 0x8a5a3b, 0, .18, 0); b.cyl(.26, .26, .02, 8, 0xd9b382, 0, .37, 0); b.cyl(.13, .13, .025, 8, 0xc29a68, 0, .375, 0); b.cone(.2, .2, 5, 0x7a4e30, .28, .08, .1, 0, 0, -1.2); return b.done(); };
  MD.sapling = v => { const b = G.mb(18); b.cyl(.04, .05, .55, 5, 0x8a5a3b, 0, .27, 0); b.jit(.1); b.ico(.2, 0, 0x6cc458, 0, .62, 0); b.ico(.14, 0, 0x58b54a, .14, .48, .05); b.ico(.13, 0, 0x58b54a, -.12, .5, -.04); return b.done(); };
  MD.rock = v => { const b = G.mb(19); b.jit(.12); b.ico(.5, 0, 0x9d9a93, 0, .3, 0, 1.1, .78, 1, 0, .4); b.ico(.28, 0, 0xb3b0a8, .3, .22, .25, 1, .8, 1, 0, 1.2); b.ico(.2, 0, 0x8a877f, -.32, .14, .2); return b.done(); };
  MD.rock_big = v => { const b = G.mb(20); b.jit(.12); b.ico(1.05, 0, 0x9a978f, 0, .8, 0, 1, .8, .95, 0, .3); b.ico(.6, 0, 0xaba8a0, .7, .45, .45, 1, .8, 1, 0, 1); b.ico(.55, 0, 0x8c8981, -.65, .4, .5); b.ico(.45, 1, 0x6aa84f, -.1, 1.45, .1, 1.3, .35, 1.2); return b.done(); };
  MD.weed = v => { const b = G.mb(21); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.cone(.07, .42, 4, i % 2 ? 0x7fae3a : 0x96c24a, Math.cos(a) * .12, .2, Math.sin(a) * .12, Math.sin(a) * .35, 0, -Math.cos(a) * .35); } return b.done(); };
  MD.mushroom = v => {
    const b = G.mb(); b.cyl(.06, .08, .22, 6, 0xf4ecdc, 0, .11, 0); b.sph(.17, 0xe5413b, 0, .22, 0, 1, .65, 1, 0, 8, 4, false);
    [[.08, .3, .06], [-.07, .29, .08], [0, .33, -.07], [.1, .26, -.06]].forEach(p => b.sph(.03, 0xffffff, p[0], p[1], p[2], 1, .6, 1, 0, 4, 3));
    b.cyl(.04, .05, .14, 5, 0xf4ecdc, .18, .07, .1); b.sph(.1, 0xe5413b, .18, .14, .1, 1, .6, 1, 0, 6, 4, false); return b.done();
  };
  MD.shell = v => { const b = G.mb(); b.sph(.16, 0xffd8c8, 0, .05, 0, 1, .45, 1.1, 0, 10, 6, false); for (let i = -2; i <= 2; i++) b.box(.02, .05, .3, 0xf0b6a0, i * .055, .09, 0, 0, i * .25, 0); return b.done(); };
  MD.crack = v => {
    const b = G.mb(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (i % 2) * .3; const l = i % 2 ? .28 : .4; b.box(.05, .02, l, 0x4a3420, Math.cos(a) * l / 2, .015, Math.sin(a) * l / 2, 0, -a + Math.PI / 2, 0); }
    b.box(.06, .06, .06, 0xfff6a0, .1, .18, .05, .6, .6, 0, 1); b.box(.04, .04, .04, 0xfff6a0, -.12, .25, -.04, .6, .2, .5, 1); return b.done();
  };
  MD.hole = v => { const b = G.mb(); b.cyl(.42, .44, .03, 10, 0x9b7448, 0, .01, 0); b.cyl(.34, .34, .035, 10, 0x2e2015, 0, .02, 0); return b.done(); };
  MD.present = v => { const b = G.mb(); b.box(.42, .34, .42, 0xe85d6f, 0, .17, 0); b.box(.44, .36, .1, 0xffd23f, 0, .17, 0); b.box(.1, .36, .44, 0xffd23f, 0, .17, 0); b.tor(.07, .03, 0xffd23f, -.06, .38, 0, 0, Math.PI / 2, .6); b.tor(.07, .03, 0xffd23f, .06, .38, 0, 0, Math.PI / 2, -.6); return b.done(); };
  MD.moneybag = v => { const b = G.mb(); b.sph(.24, 0xe8d29a, 0, .22, 0, 1, .9, 1); b.cyl(.08, .12, .1, 8, 0xd9be7c, 0, .46, 0); b.cyl(.1, .1, .03, 8, 0x9b5a2a, 0, .41, 0); b.box(.12, .12, .02, 0xffc23d, 0, .24, .235, 0, 0, .78); return b.done(); };
  MD.goo = v => { const b = G.mb(); b.sph(.18, 0x6fe36a, 0, .1, 0, 1.2, .6, 1.1, 2); b.sph(.08, 0x9dff98, .08, .13, .08, 1, 1, 1, 2); return b.done(); };
  MD.tulip = v => {
    const b = G.mb(22 + v), c = G.FLOWCOL[v % 7];
    [[-.08, 0], [.1, .08]].forEach(([dx, dz], i) => {
      const h = .38 + i * .08; b.cyl(.015, .02, h, 4, 0x4c9a3a, dx, h / 2, dz);
      b.cyl(.085, .055, .15, 6, c, dx, h + .05, dz); b.cone(.05, .07, 6, c, dx, h + .15, dz, Math.PI, 0, 0);
    });
    b.cone(.07, .3, 4, 0x5aae46, -.1, .14, .06, .3, 0, .3); b.cone(.07, .28, 4, 0x5aae46, .12, .13, -.04, -.3, 0, -.3); return b.done();
  };
  MD.flower = v => {
    const b = G.mb(30 + v), c = G.FLOWCOL[v % 7];
    [[0, 0, .34], [-.15, .1, .26], [.15, .08, .28]].forEach(([dx, dz, h], k) => {
      b.cyl(.012, .018, h, 3, 0x4c9a3a, dx, h / 2, dz);
      b.cyl(.11, .1, .025, 5, c, dx, h + .02, dz, .25, k * .7, 0);
      b.cyl(.04, .04, .03, 5, v === 1 ? 0xff9f1a : 0xffd84a, dx, h + .04, dz + .01, .25, 0, 0);
    });
    b.cone(.08, .2, 4, 0x5aae46, 0, .08, .12, .5, 0, 0); return b.done();
  };
  MD.fruit = v => { const b = G.mb(); const c = [0xe8343a, 0xff9420, 0xffa38a, 0xd81b3a, 0x6b4a2a][v];
    if (v === 3) { b.sph(.09, c, -.06, .09, 0); b.sph(.09, c, .07, .09, .03); b.cyl(.01, .01, .16, 3, 0x4c7a2a, 0, .2, 0, 0, 0, .4); }
    else { b.sph(v === 4 ? .17 : .14, c, 0, v === 4 ? .17 : .14, 0); b.cyl(.012, .012, .08, 3, 0x6b4a2a, 0, .3, 0); if (v < 3) b.sph(.05, 0x5aae46, .05, .3, 0, 1.4, .4, .8); }
    return b.done(); };
})();
