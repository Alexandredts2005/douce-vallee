'use strict';
// ===== Modèles low-poly fusionnés (1 géométrie par type, couleurs par sommet) — partie 1 : outil + nature =====
(function () {
  const TAU = Math.PI * 2;
  function roundedBox(w, h, d) {
    const half = [w / 2, h / 2, d / 2], r = Math.min(.12, Math.min(w, h, d) * .32), core = half.map(v => Math.max(0, v - r));
    const coords = half.map(v => {
      const q = [-v, -v + r * .5, -v + r, v - r, v - r * .5, v].sort((a, b) => a - b), out = [];
      for (const n of q) if (!out.length || n - out[out.length - 1] > 1e-5) out.push(n);
      return out;
    });
    const pos = [], nor = [], point = raw => {
      const c = raw.map((v, i) => Math.max(-core[i], Math.min(core[i], v))), dv = raw.map((v, i) => v - c[i]), len = Math.hypot(...dv) || 1;
      return { p: c.map((v, i) => v + dv[i] / len * r), n: dv.map(v => v / len) };
    };
    const tri = (a, b, c) => {
      const ab = b.p.map((v, i) => v - a.p[i]), ac = c.p.map((v, i) => v - a.p[i]), cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]], nn = a.n.map((v, i) => v + b.n[i] + c.n[i]);
      if (cross.reduce((s, v, i) => s + v * nn[i], 0) < 0) [b, c] = [c, b];
      for (const v of [a, b, c]) { pos.push(...v.p); nor.push(...v.n); }
    };
    for (let axis = 0; axis < 3; axis++) for (const side of [-1, 1]) {
      const u = (axis + 1) % 3, v = (axis + 2) % 3, grid = [];
      for (const a of coords[u]) { const row = []; for (const c of coords[v]) { const raw = [0, 0, 0]; raw[axis] = side * half[axis]; raw[u] = a; raw[v] = c; row.push(point(raw)); } grid.push(row); }
      for (let i = 0; i < grid.length - 1; i++) for (let j = 0; j < grid[i].length - 1; j++) { const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], e = grid[i][j + 1]; tri(a, b, c); tri(a, c, e); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
  }
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
    // les pièces très fines (lattes, croisillons, barreaux) n'ont pas besoin d'arrondi : 12 triangles au lieu de 300
    box(w, h, d, col, x, y, z, rx, ry, rz, mat = 0) { const thin = Math.min(w, h, d) < .06; return this.add(thin ? new THREE.BoxGeometry(w, h, d) : roundedBox(w, h, d), col, this.M(x, y, z, rx, ry, rz), mat, !thin); }
    cyl(rt, rb, h, seg, col, x, y, z, rx, ry, rz, mat = 0, smooth = false) { return this.add(new THREE.CylinderGeometry(rt, rb, h, Math.max(12, seg)), col, this.M(x, y, z, rx, ry, rz), mat, smooth); }
    cone(r, h, seg, col, x, y, z, rx, ry, rz, mat = 0) { return this.add(new THREE.ConeGeometry(r, h, Math.max(10, seg)), col, this.M(x, y, z, rx, ry, rz), mat); }
    sph(r, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0, ws = 10, hs = 8, smooth = true) { return this.add(new THREE.SphereGeometry(r, Math.max(14, ws), Math.max(10, hs)), col, this.M(x, y, z, 0, 0, 0, sx, sy, sz), mat, smooth); }
    ico(r, det, col, x, y, z, sx = 1, sy = 1, sz = 1, mat = 0, ry = 0) { const n = det > 0 ? 18 : 14; return this.add(new THREE.SphereGeometry(r, n, Math.round(n * .7)), col, this.M(x, y, z, 0, ry, 0, sx, sy, sz), mat, true); }
    tor(r, t, col, x, y, z, rx = 0, ry = 0, rz = 0, mat = 0, seg = 12) { return this.add(new THREE.TorusGeometry(r, t, 10, Math.max(18, seg)), col, this.M(x, y, z, rx, ry, rz), mat, true); }
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
  // feuilles : petites feuilles aplaties posées à la surface d'une boule de feuillage
  const leaves = (b, cols, cx, cy, cz, R, n, sy = 1) => { for (let i = 0; i < n; i++) { const th = b.r() * TAU, ph = Math.acos(1 - b.r() * 1.75), d = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
    b.geo(new THREE.IcosahedronGeometry(.15, 0), cols[i % cols.length], b.M(cx + d[0] * R * .97, cy + d[1] * R * .97 * sy, cz + d[2] * R * .97, ph, Math.PI / 2 - th, 0, .9, .32, 1.45)); } };
  function canopy(b, cols, s = 1) {
    b.jit(.05);
    b.blob(1.05 * s, 2, cols[0], 0, 2.35, 0, 1, .92, 1);
    b.blob(.72 * s, 1, cols[1], .62 * s, 2.0, .22, 1, .9, 1);
    b.blob(.74 * s, 1, cols[1], -.6 * s, 2.05, -.12, 1, .9, 1);
    b.blob(.78 * s, 2, cols[2], .05, 2.95, -.05, 1, .85, 1);
    b.blob(.55 * s, 1, cols[2], .1, 2.2, .72 * s, 1, .9, 1);
    b.jit(.12); leaves(b, cols, 0, 2.35, 0, 1.05 * s, 12, .92); leaves(b, [cols[2], cols[0]], .05, 2.95, -.05, .78 * s, 8, .85); b.jit(0);
  }
  MD.tree_oak = v => { const b = G.mb(11); trunk(b); canopy(b, [0x58b54a, 0x4aa443, 0x6cc458]); return b.done(); };
  MD.tree_birch = v => {
    const b = G.mb(12); b.cyl(.13, .17, 1.9, 12, 0xf2efe6, 0, .95, 0,0,0,0,0,true);
    for (let i = 0; i < 5; i++) b.box(.1, .04, .03, 0x3a3530, (i % 2 ? .06 : -.05), .35 + i * .3, .15, 0, 0, i % 2 ? .3 : -.3);
    b.jit(.05); b.blob(.85, 2, 0xa3d46a, 0, 2.5, 0, 1, 1.15, 1); b.blob(.6, 1, 0x8cc35a, .45, 2.15, .2); b.blob(.6, 2, 0xb8e07a, -.4, 2.9, -.05); b.jit(.12); leaves(b, [0xa3d46a, 0xb8e07a, 0x8cc35a], 0, 2.5, 0, .85, 14, 1.15); b.jit(0); return b.done();
  };
  const FRUITC = [0xe8343a, 0xff9420, 0xffa38a];
  MD.tree_fruit = v => {
    const b = G.mb(13 + v % 10); trunk(b); canopy(b, [0x4fae46, 0x45a03f, 0x63bf55], .97);
    if (v < 10) { const c = FRUITC[v % 3]; [[.55, 2.2, .75], [-.5, 2.5, .72], [.1, 1.95, .95], [.85, 2.6, .2], [-.8, 2.0, .3], [.2, 3.05, .6], [-.2, 2.7, -.72], [.64, 2.82, -.38]].forEach(p => { b.sph(.13, c, p[0], p[1], p[2], 1, 1, 1, 0, 6, 4); b.sph(.035, 0xffe7a0, p[0] - .04, p[1] + .04, p[2] + .11, 1, 1, .45, 1, 5, 3); }); }
    return b.done();
  };
  MD.tree_cherry = v => {
    const b = G.mb(14); trunk(b, 1.5, 0x6e4733); canopy(b, [0xffb5cf, 0xff9fc0, 0xffd0e0]);
    if (v < 10) [[.5, 2.2, .78], [-.45, 2.4, .75], [.2, 2.9, .65]].forEach(p => { b.sph(.08, 0xd81b3a, p[0], p[1], p[2], 1, 1, 1, 0, 5, 4); b.sph(.08, 0xd81b3a, p[0] + .12, p[1] - .04, p[2], 1, 1, 1, 0, 5, 4); });
    return b.done();
  };
  MD.tree_pine = v => {
    const b = G.mb(15); b.cyl(.15, .2, .9, 12, 0x7a4e30, 0, .45, 0); b.jit(.035);
    const g = [0x2f7d4a, 0x37895a, 0x43976a];
    [[.67,1.45,g[0],1.45,.82,1.12],[.55,2.17,g[1],1.28,.9,1],[.43,2.84,g[2],1.12,.9,.92],[.3,3.38,g[1],1,.92,.88]].forEach(([r,y,c,sx,sy,sz])=>b.sph(r,c,0,y,0,sx,sy,sz,0,16,11));
    for(let i=0;i<12;i++){const a=i*2.399,y=1.12+(i%4)*.55,r=.45+(i%3)*.09;b.sph(.13,g[i%3],Math.cos(a)*r,y,Math.sin(a)*r*.82,1,.44,.7,0,12,8);}
    if (v === 1) for(const [y,r] of [[1.72,.52],[2.48,.4],[3.08,.3]]) b.sph(r,0xf4f8ff,0,y,.02,1.3,.28,1.02,0,16,10);
    return b.done();
  };
  MD.tree_palm = v => {
    const b = G.mb(16); let x = 0, y = 0, a = 0;
    for (let i = 0; i < 6; i++) { const h = .55; b.cyl(.13 - i * .008, .16 - i * .008, h, 7, i % 2 ? 0xb8925e : 0xa8814f, x, y + h / 2, 0, 0, 0, -a); x += Math.sin(a) * h; y += Math.cos(a) * h; a += .07; }
    b.jit(.1);
    for(let i=0;i<9;i++){const ang=i/9*TAU,len=.75+(i%3)*.1,lx=x+Math.cos(ang)*len*.42,lz=Math.sin(ang)*len*.42,col=i%2?0x3f9e4a:0x52b35a;b.cyl(.018,.027,len,10,col,lx,y-.15,lz,Math.cos(ang)*.82,0,-Math.sin(ang)*.82,0,true);for(let j=0;j<5;j++){const t=(j+1)/6,px=x+Math.cos(ang)*len*t*.78,pz=Math.sin(ang)*len*t*.78,py=y-.1-.18*Math.sin(t*Math.PI),side=j%2?1:-1;b.sph(.14,col,px-Math.sin(ang)*side*.09,py,pz+Math.cos(ang)*side*.09,1.45,.34,.68,0,12,8);}}
    b.jit(0);
    if (v < 10) [[0, -.25, .2], [.18, -.3, -.1], [-.16, -.28, -.08]].forEach(p => b.sph(.15, 0x6b4a2a, x + p[0], y + p[1], p[2], 1, 1, 1, 0, 8, 6));
    return b.done();
  };
  MD.bush = v => {
    const b = G.mb(17 + v); b.jit(.035);
    const c = v === 2 ? [0x4f9a4a, 0x5aa853] : [0x4a9e45, 0x58ae50];
    [[.34,0,.36,.02,1.25,.9,1],[.3,.3,.3,.08,1.06,.92,.95],[.29,-.3,.3,.04,1.06,.92,.95],[.26,.06,.59,-.04,1.15,.95,.98],[.24,.48,.43,-.03,1,.9,.9],[.24,-.47,.4,.05,1,.92,.95]].forEach(([r,x,y,z,sx,sy,sz],i)=>b.sph(r,c[i%2],x,y,z,sx,sy,sz,0,16,10));
    b.jit(0);
    if (v === 1) [[.25, .55, .35], [-.2, .62, .33], [.05, .8, .25], [.38, .38, .25], [-.38, .35, .2]].forEach(p => b.sph(.07, 0x5b55d6, p[0], p[1], p[2], 1, 1, 1, 0, 6, 5));
    if (v === 2) [[.2, .6, .3, 0x9aa8ff], [-.25, .58, .28, 0xf6a3d0], [.0, .86, .1, 0xb7c1ff], [.38, .4, .15, 0xf6a3d0], [-.4, .4, .1, 0x9aa8ff], [.18,.94,-.08,0xe9b4dc]].forEach(p => { b.blob(.16, 1, p[3], p[0], p[1], p[2]); b.sph(.035, 0xffe27a, p[0], p[1], p[2] + .13, 1, 1, .5, 1, 5, 3); });
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
    const b=G.mb(22+v),c=G.FLOWCOL[v%7];
    [[-.08,0,.43],[.12,.06,.36]].forEach(([dx,dz,h])=>{b.cyl(.018,.025,h,12,0x4c9a3a,dx,h/2,dz,0,0,0,0,true);b.sph(.105,c,dx,h+.055,dz,1,.72,.88,0,16,11);for(let k=0;k<5;k++){const a=k*TAU/5;b.sph(.084,c,dx+Math.cos(a)*.075,h+.1+Math.sin(a)*.025,dz+Math.sin(a)*.075,1,.9,.85,0,14,10);}});
    b.sph(.19,0x5aae46,-.09,.17,.08,1.35,.34,.58,0,14,9);b.sph(.19,0x5aae46,.12,.2,-.06,1.35,.34,.58,0,14,9);return b.done();
  };
  MD.flower = v => {
    const b = G.mb(30 + v), c = G.FLOWCOL[v % 7];
    [[0,0,.34],[-.19,.1,.29],[.18,.08,.31],[.04,-.17,.25]].forEach(([dx,dz,h])=>{b.cyl(.014,.02,h,12,0x4c9a3a,dx,h/2,dz,0,0,0,0,true);for(let j=0;j<5;j++){const a=j*TAU/5;b.sph(.09,c,dx+Math.cos(a)*.075,h+.02,dz+Math.sin(a)*.075,1,.72,.82,0,14,10);}b.sph(.043,v===1?0xff9f1a:0xffd84a,dx,h+.06,dz+.025,1,1,.72,1,12,8);});
    b.sph(.18,0x5aae46,-.1,.12,.08,1.3,.34,.55,0,14,9);b.sph(.18,0x5aae46,.12,.14,-.08,1.3,.34,.55,0,14,9);return b.done();
  };
  MD.fruit = v => { const b = G.mb(); const c = [0xe8343a, 0xff9420, 0xffa38a, 0xd81b3a, 0x6b4a2a][v];
    if (v === 3) { b.sph(.09, c, -.06, .09, 0); b.sph(.09, c, .07, .09, .03); b.cyl(.01, .01, .16, 3, 0x4c7a2a, 0, .2, 0, 0, 0, .4); }
    else { b.sph(v === 4 ? .17 : .14, c, 0, v === 4 ? .17 : .14, 0); b.cyl(.012, .012, .08, 3, 0x6b4a2a, 0, .3, 0); if (v < 3) b.sph(.05, 0x5aae46, .05, .3, 0, 1.4, .4, .8); }
    return b.done(); };
})();
