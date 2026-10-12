'use strict';
// ===== Monuments : grande fontaine animée (l'eau coule vraiment), Hôtel de Ville colossal,
// gare monumentale façon Gare de Lyon avec son grand hall sous verrière, rayons de soleil et poussière dorée =====
(function () {
  const MD = G.MODELS, O = G.OBJ, A = G.ARCH, PT = A.PT, TAU = Math.PI * 2, PI = Math.PI, GOLD = A.GOLD;
  const rb = (...a) => G.rbox(...a);
  // ---------- outils ----------
  // T : repère d'une façade (centre c, orientation ry ; +z local = vers l'extérieur de la façade)
  const face = (cx, cy, cz, ry) => (lx, ly, lz) => [cx + lx * Math.cos(ry) + lz * Math.sin(ry), cy + ly, cz - lx * Math.sin(ry) + lz * Math.cos(ry)];
  function frustum(b, w0, d0, w1, d1, h, col, x, y, z, pat = 0) {
    const a = w0 / 2, c = d0 / 2, e = w1 / 2, f = d1 / 2, p = [], q = (A1, B1, C1, D1) => p.push(...A1, ...B1, ...C1, ...A1, ...C1, ...D1);
    q([-a, 0, c], [a, 0, c], [e, h, f], [-e, h, f]); q([a, 0, -c], [-a, 0, -c], [-e, h, -f], [e, h, -f]); q([a, 0, c], [a, 0, -c], [e, h, -f], [e, h, f]); q([-a, 0, -c], [-a, 0, c], [-e, h, f], [-e, h, -f]);
    if (e > 0 && f > 0) q([-e, h, f], [e, h, f], [e, h, -f], [-e, h, -f]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); b.P(pat); b.geo(g, col, b.M(x, y, z)); b.P(0);
  }
  const lathe = (b, pts, col, x, y, z, seg = 40, mat = 0) => b.geo(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), col, b.M(x, y, z), mat, true);
  // horloge sur une façade (repère T), aiguilles à l'heure dite
  function clock(b, T, r, hh = 10, mm = 10, rim = 0xd8cbb0) {
    const ry = T.ry; b.cyl(r + .08, r + .08, .06, 28, rim, ...T(0, 0, .03), PI / 2, ry, 0); b.cyl(r, r, .04, 28, 0xfffaf0, ...T(0, 0, .07), PI / 2, ry, 0);
    b.tor(r, .035, GOLD, ...T(0, 0, .09), 0, ry, 0, 0, 28);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(k % 3 ? .05 : .1, .025, .02, 0x222222, ...T(Math.cos(a) * r * .82, Math.sin(a) * r * .82, .1), 0, ry, a); }
    for (const [ang, L, w] of [[PI / 2 - (hh % 12 + mm / 60) / 12 * TAU, r * .5, .05], [PI / 2 - mm / 60 * TAU, r * .78, .035]]) b.box(L, w, .02, 0x1e1e1e, ...T(Math.cos(ang) * L / 2, Math.sin(ang) * L / 2, .11), 0, ry, ang);
    b.sph(.04, GOLD, ...T(0, 0, .12));
  }
  // lettres en relief (police 5 lignes)
  const FONT = { A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], E: ['111', '100', '110', '100', '111'], G: ['111', '100', '101', '101', '111'], I: ['111', '010', '010', '010', '111'], L: ['100', '100', '100', '100', '111'],
    M: ['10001', '11011', '10101', '10001', '10001'], R: ['110', '101', '110', '101', '101'], S: ['111', '100', '111', '001', '111'], T: ['111', '010', '010', '010', '010'], O: ['111', '101', '101', '101', '111'], U: ['101', '101', '101', '101', '111'], P: ['110', '101', '110', '100', '100'], N: ['1001', '1101', '1011', '1001', '1001'], C: ['111', '100', '100', '100', '111'], D: ['110', '101', '101', '101', '110'], V: ['101', '101', '101', '101', '010'], H: ['101', '101', '111', '101', '101'], "'": ['1', '1', '0', '0', '0'] };
  function sign(b, T, txt, y, px, col, z = .02) { let wT = -1; for (const ch of txt) wT += (FONT[ch] ? FONT[ch][0].length : 2) + 1; let cx = -wT * px / 2;
    for (const ch of txt) { const g = FONT[ch]; if (!g) { cx += 3 * px; continue; } g.forEach((row, r) => [...row].forEach((c, k) => { if (c === '1') b.box(px * .9, px * .9, px * .6, col, ...T(cx + (k + .5) * px, y + (4 - r) * px, z), 0, T.ry, 0); })); cx += (g[0].length + 1) * px; } }
  const F = (cx, cy, cz, ry) => { const t = face(cx, cy, cz, ry); t.ry = ry; return t; };
  function statue(b, x, y, z, col = 0xece6d8, s = 1) { b.P(PT.pierre); b.box(.32 * s, .3 * s, .32 * s, 0xd9d2c2, x, y + .15 * s, z); b.P(0); b.cyl(.08 * s, .13 * s, .5 * s, 8, col, x, y + .55 * s, z); b.sph(.085 * s, col, x, y + .9 * s, z); b.box(.34 * s, .05 * s, .06 * s, col, x, y + .74 * s, z, 0, 0, .5); b.cyl(.012 * s, .012 * s, .5 * s, 4, col, x + .14 * s, y + .9 * s, z, 0, 0, -.2); }
  function balustrade(b, x0, x1, z, y, col) { const n = Math.max(2, Math.round((x1 - x0) / .16)); b.box(x1 - x0, .06, .16, col, (x0 + x1) / 2, y + .02, z); b.box(x1 - x0 + .04, .07, .2, col, (x0 + x1) / 2, y + .38, z); for (let k = 0; k <= n; k++) b.cyl(.035, .045, .3, 6, col, x0 + k * (x1 - x0) / n, y + .2, z); }
  function epi(b, x, y, z, s = 1) { b.cyl(.025 * s, .04 * s, .3 * s, 6, GOLD, x, y + .15 * s, z); b.sph(.07 * s, GOLD, x, y + .34 * s, z, 1, 1, 1, 0, 8, 6); b.cone(.04 * s, .18 * s, 6, GOLD, x, y + .5 * s, z); }
  function flag(b, x, y, z, ry = 0, s = 1) { b.cyl(.02, .02, 1.3 * s, 5, 0xdddddd, x, y + .65 * s, z); b.sph(.035, GOLD, x, y + 1.32 * s, z); const T = face(x, y + 1.05 * s, z, ry); [0x1f3f9a, 0xffffff, 0xe1262f].forEach((c, k) => b.box(.18 * s, .36 * s, .015, c, ...T(.11 * s + k * .18 * s, 0, 0), 0, ry, 0)); }
  function lampadaire3(b, x, z, h = 1.9) { b.cyl(.13, .17, .2, 8, 0x2c3236, x, .1, z); b.cyl(.04, .06, h, 8, 0x2c3236, x, h / 2, z); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; b.box(.3, .03, .03, 0x2c3236, x + Math.cos(a) * .15, h - .05, z + Math.sin(a) * .15, 0, -a, 0); b.sph(.1, 0xfff1c8, x + Math.cos(a) * .3, h + .05, z + Math.sin(a) * .3, 1, 1, 1, 1, 10, 8); } b.sph(.11, 0xfff1c8, x, h + .2, z, 1, 1, 1, 1, 10, 8); }

  // ===================== 1. LA GRANDE FONTAINE (6×6) =====================
  const ST = 0xeee6d6, ST2 = 0xdcd2bf, BRZ = 0x5e8f7a;
  MD.grande_fontaine = v => { const b = G.mb(180);
    b.P(PT.pierre); b.cyl(3.0, 3.0, .12, 48, 0xd2c8b4, 0, .06, 0); b.P(0);
    // bassin : vasque en pierre moulurée (profil tourné), fond bleuté, pièces de monnaie
    lathe(b, [[2.98, .1], [2.98, .2], [2.93, .3], [2.9, .5], [2.96, .62], [2.98, .7], [2.93, .78], [2.74, .8], [2.69, .74], [2.68, .2], [0, .2]], ST, 0, 0, 0, 56);
    b.tor(2.9, .045, ST2, 0, .47, 0, PI / 2, 0, 0, 0, 56); b.cyl(2.66, 2.66, .02, 40, 0x7aa0b0, 0, .21, 0);
    const r = G.rng(7); for (let i = 0; i < 26; i++) { const a = r() * TAU, d = .4 + r() * 2.1; b.cyl(.055, .055, .012, 8, i % 4 ? GOLD : 0xc0c4c8, Math.cos(a) * d, .225, Math.sin(a) * d, (r() - .5) * .3, 0, (r() - .5) * .3); }
    // 8 dés sculptés sur la margelle + 4 poissons cracheurs en bronze
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.P(PT.pierre); b.box(.36, .22, .3, ST2, Math.cos(a) * 2.84, .9, Math.sin(a) * 2.84, 0, -a, 0); b.P(0); b.sph(.08, GOLD, Math.cos(a) * 2.84, 1.07, Math.sin(a) * 2.84, 1, 1, 1, 0, 8, 6); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4, c = Math.cos(a), s = Math.sin(a), x = c * 2.78, z = s * 2.78;
      b.geo(new THREE.SphereGeometry(.2, 12, 9), BRZ, b.M(x, 1.0, z, 0, -a, -.35, 1.7, .9, .95), 0, true); b.sph(.07, 0x3d6a58, x - c * .3, .92, z - s * .3, 1, .8, 1); b.cone(.16, .3, 8, BRZ, x + c * .36, 1.18, z + s * .36, 0, -a, -1.1);
      for (const k of [-1, 1]) b.sph(.035, 0x1c2a24, x - c * .18 - s * k * .12, 1.1, z - s * .18 + c * k * .12); }
    // socle central et quatre tritons tenant des conques
    b.P(PT.pierre); lathe(b, [[1.15, .2], [1.15, .45], [1.0, .55], [.95, .75], [.75, .85], [.55, .9], [0, .9]], ST2, 0, 0, 0, 24); b.P(0);
    lathe(b, [[.55, .85], [.42, 1.1], [.36, 1.6], [.4, 1.75], [.3, 1.85], [.0, 1.85]], ST, 0, 0, 0, 20);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.box(.04, .55, .04, ST2, Math.cos(a) * .4, 1.35, Math.sin(a) * .4); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, c = Math.cos(a), s = Math.sin(a), x = c * .9, z = s * .9;
      b.geo(new THREE.SphereGeometry(.17, 12, 9), BRZ, b.M(x, 1.08, z, 0, -a, 0, 1, 1.45, .9), 0, true); b.sph(.11, BRZ, x + c * .03, 1.4, z + s * .03, 1, 1.05, 1, 0, 10, 8);
      b.tor(.16, .05, BRZ, x - c * .02, .9, z - s * .02, PI / 2, 0, 0, 0, 10); b.cone(.07, .2, 6, BRZ, x - c * .2, .88, z - s * .2, 0, -a, PI / 2);
      b.geo(new THREE.CylinderGeometry(.03, .045, .32, 6), BRZ, b.M(x + c * .1, 1.32, z + s * .1, 0, -a, -.9)); b.geo(new THREE.ConeGeometry(.08, .28, 9), 0xd8c8b0, b.M(x + c * .27, 1.5, z + s * .27, 0, -a, -1.0)); }
    // vasque du milieu : godrons dessous, bord festonné
    lathe(b, [[.36, 1.85], [.6, 1.95], [1.1, 2.12], [1.5, 2.28], [1.57, 2.36], [1.52, 2.44], [1.45, 2.4], [1.0, 2.3], [0, 2.25]], ST, 0, 0, 0, 40);
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; b.geo(new THREE.SphereGeometry(.09, 8, 6), ST2, b.M(Math.cos(a) * 1.08, 2.08, Math.sin(a) * 1.08, 0, -a, .55, 3.4, .45, .7), 0, true); b.sph(.06, ST2, Math.cos(a) * 1.56, 2.33, Math.sin(a) * 1.56, 1, .7, 1, 0, 7, 5); }
    // fût supérieur avec trois angelots, petite vasque, pomme de pin dorée
    lathe(b, [[.26, 2.25], [.2, 2.5], [.16, 2.9], [.22, 3.0], [.14, 3.12], [0, 3.12]], ST, 0, 0, 0, 16);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5, c = Math.cos(a), s = Math.sin(a); b.sph(.12, BRZ, c * .3, 2.7, s * .3, 1, 1.2, 1, 0, 10, 8); b.sph(.085, BRZ, c * .33, 2.92, s * .33, 1, 1, 1, 0, 9, 7);
      for (const k of [-1, 1]) b.geo(new THREE.SphereGeometry(.08, 8, 6), 0xe8e2d4, b.M(c * .24 - s * k * .1, 2.8, s * .24 + c * k * .1, 0, -a + k * .6, 0, .3, 1, 1.2), 0, true); }
    lathe(b, [[.16, 3.1], [.4, 3.2], [.8, 3.42], [.85, 3.48], [.8, 3.54], [.74, 3.5], [0, 3.42]], ST, 0, 0, 0, 28);
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; b.sph(.045, ST2, Math.cos(a) * .84, 3.47, Math.sin(a) * .84, 1, .7, 1, 0, 6, 4); }
    b.cyl(.09, .12, .3, 10, GOLD, 0, 3.6, 0); b.sph(.15, GOLD, 0, 3.86, 0, 1, 1.35, 1, 0, 10, 8); b.cone(.06, .2, 8, GOLD, 0, 4.12, 0);
    // quatre candélabres aux angles
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = sx * 2.62, z = sz * 2.62; b.P(PT.pierre); b.box(.32, .3, .32, ST2, x, .15, z); b.P(0); lampadaire3(b, x, z, 1.75); }
    return b.done(); };
  O.grande_fontaine.h = 4;

  // ----- l'eau qui coule : nappes, jets, surfaces animées, rides, gouttelettes, bruit d'eau -----
  let fallMat = null, sprayMat = null; const fxs = new Map(); let fxT = 0;
  const uvScale = (g, su, sv, flip) => { const u = g.attributes.uv; for (let i = 0; i < u.count; i++) { const x = u.getX(i), y = u.getY(i); if (flip) u.setXY(i, y * su, (1 - x) * sv); else u.setXY(i, x * su, y * sv); } return g; };
  const waterDisc = (r, y) => { const g = new THREE.CircleGeometry(r, 40); g.rotateX(-PI / 2); g.translate(0, y, 0); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = .55; c[i * 3 + 1] = .8; c[i * 3 + 2] = .95; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return new THREE.Mesh(g, G.M.water); };
  const curtain = (r0, y0, r1, y1, mat) => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, y = y1 + (y0 - y1) * t; pts.push(new THREE.Vector2(r0 + (r1 - r0) * Math.sqrt(1 - t), y)); }
    return new THREE.Mesh(uvScale(new THREE.LatheGeometry(pts, 40), 14, 2.2), mat); };
  const jet = (p0, p1, h, mat, rad = .04) => { const a = new THREE.Vector3(...p0), c = new THREE.Vector3(...p1), m = a.clone().lerp(c, .5); m.y = Math.max(a.y, c.y) + h;
    return new THREE.Mesh(uvScale(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, c), 18, rad, 6), 1, 3, true), mat); };
  function makeFx(m, o) { const d = O[o.t], [cx, cz] = m.center(o), g = new THREE.Group(); g.position.set(cx, o.y, cz);
    if (!fallMat) { fallMat = G.curveMat(new THREE.MeshBasicMaterial({ map: G.TEX.fall, color: 0xe6f6ff, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false })); sprayMat = G.curveMat(new THREE.MeshBasicMaterial({ map: G.TEX.fall, color: 0xffffff, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false })); }
    g.add(waterDisc(2.67, .58), waterDisc(1.44, 2.38), waterDisc(.74, 3.47));
    g.add(curtain(1.58, 2.37, 1.98, .58, fallMat), curtain(.86, 3.48, 1.12, 2.38, fallMat));
    const land = [];
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4, c = Math.cos(a), s = Math.sin(a); g.add(jet([c * 2.4, .92, s * 2.4], [c * 1.75, .58, s * 1.75], .35, fallMat)); land.push([c * 1.75, .58, s * 1.75]); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, c = Math.cos(a), s = Math.sin(a); g.add(jet([c * 1.34, 1.57, s * 1.34], [c * 2.35, .58, s * 2.35], .55, fallMat, .035)); land.push([c * 2.35, .58, s * 2.35]); }
    g.add(curtain(.03, 5.05, .7, 3.48, sprayMat)); const up = new THREE.Mesh(uvScale(new THREE.CylinderGeometry(.035, .06, 1.0, 8, 1, true), 1, 3), fallMat); up.position.y = 4.6; up.rotation.x = PI; g.add(up);
    const rip = []; for (let i = 0; i < 14; i++) { const mm = G.curveMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })), me = new THREE.Mesh(new THREE.RingGeometry(.07, .1, 20), mm); me.rotation.x = -PI / 2; me.visible = false; g.add(me); rip.push({ me, t: 1 }); }
    g.traverse(c => { c.frustumCulled = false; c.renderOrder = 2; }); m.group.add(g);
    return { g, m, o, cx, cz, land, rip, rt: 0, st: 0 }; }
  function updFx(f, dt, p) { const d2 = Math.hypot(f.cx - p.x, f.cz - p.z); f.g.visible = d2 < 60; if (!f.g.visible) return;
    if (G.ents) G.ents.fallDist = Math.min(G.ents.fallDist == null ? 99 : G.ents.fallDist, Math.max(0, d2 - 2.5) * 1.2);
    // rides là où l'eau tombe
    if ((f.rt -= dt) < 0) { f.rt = .12; const R = f.rip.find(q => q.t >= 1); if (R) { const L = Math.random() < .55 ? f.land[Math.floor(Math.random() * f.land.length)] : (() => { const a = Math.random() * TAU, rr = Math.random() < .5 ? 1.98 : 1.12, y = rr > 1.5 ? .58 : 2.38; return [Math.cos(a) * rr, y, Math.sin(a) * rr]; })(); R.t = 0; R.me.position.set(L[0], L[1] + .012, L[2]); R.me.visible = true; } }
    for (const R of f.rip) { if (R.t >= 1) continue; R.t += dt / 1.3; const s = 1 + R.t * 5; R.me.scale.set(s, s, s); R.me.material.opacity = .55 * (1 - R.t); if (R.t >= 1) R.me.visible = false; }
    // gouttelettes du bouquet et éclaboussures
    if (d2 < 30 && (f.st -= dt) < 0) { f.st = .05; const y0 = f.o.y; const a = Math.random() * TAU, sp = .4 + Math.random() * .6;
      G.fx.one(f.cx, y0 + 5.0, f.cz, Math.cos(a) * sp, .8 + Math.random(), Math.sin(a) * sp, .9, 3.2, Math.random() < .5 ? 0xffffff : 0xcdeeff, .06, 0);
      const L = f.land[Math.floor(Math.random() * f.land.length)]; G.fx.one(f.cx + L[0], y0 + L[1] + .05, f.cz + L[2], (Math.random() - .5) * .8, 1 + Math.random() * .8, (Math.random() - .5) * .8, .45, 4, 0xffffff, .05, 0); }
  }
  G.on('enterMap', () => { fxT = 0; });
  G.on('update', dt => { const m = G.map, p = G.player; if (!m || !p) return;
    if ((fxT -= dt) < 0) { fxT = 1; for (const [o, f] of fxs) if (f.m !== m || !m.list.has(o)) { if (f.g.parent) f.g.parent.remove(f.g); fxs.delete(o); }
      if (!m.interior) for (const o of m.list) if (o.t === 'grande_fontaine' && !fxs.has(o)) fxs.set(o, makeFx(m, o)); }
    for (const f of fxs.values()) updFx(f, dt, p); });

  // ===================== 2. L'HÔTEL DE VILLE COLOSSAL (10×6) =====================
  const MST = 0xf1e7d2, MST2 = 0xe2d4b8, SLATE = 0x4a5464, WINM = { glass: 0x9fb9d4, frame: 0xf7f2e6, sill: MST2, lintel: MST2, lintelPat: PT.pierre, curt: 0xfff1d6, pane: 'petits' };
  const blk = (xc, zc, w, d, fh, wh) => ({ xc, zc, w, d, fh, wh });
  const wallsB = (b, H, col) => { b.P(PT.pierre); b.box(H.w, H.wh, H.d, col, H.xc, H.fh + H.wh / 2, H.zc); b.P(0); };
  const corn = (b, H, y, col, over = .12, h = .16) => { b.P(PT.pierre); b.box(H.w + over * 2, h, H.d + over * 2, col, H.xc, y, H.zc); b.P(0); };
  MD.hotel_ville = v => { const b = G.mb(200), W = A.fenetre, D = A.porte, wb = A.wb;
    b.P(PT.pierre); b.box(9.9, .5, 4.6, 0xd9cfba, 0, .25, -.6); b.P(0);
    const C = blk(0, -.7, 6.2, 3.6, .5, 4.7), AV = blk(0, -.45, 2.6, 4.1, .5, 5.3), PL = blk(-3.95, -.65, 1.9, 4.2, .5, 5.0), PR = blk(3.95, -.65, 1.9, 4.2, .5, 5.0);
    for (const H of [C, AV, PL, PR]) { wallsB(b, H, MST); corn(b, H, H.fh + 2.35, MST2, .05, .12); corn(b, H, H.fh + H.wh + .08, MST2, .14, .2); corn(b, H, H.fh + .08, MST2, .04, .16); }
    // pilastres et colonnes engagées
    for (const a of [-1.1, -.4, .4, 1.1]) { b.cyl(.11, .12, 2.1, 10, 0xf7efdc, a, AV.fh + 3.5, 1.62); b.box(.3, .1, .3, MST2, a, AV.fh + 4.6, 1.62); b.box(.28, .5, .2, 0xf7efdc, a, AV.fh + 1.2, 1.6); }
    for (const H of [PL, PR]) for (const a of [-.75, .75]) wb(b, H, 0, a, H.fh + H.wh / 2, 0, .16, H.wh, .06, 0xf7efdc);
    for (const s of [-1, 1]) for (const a of [1.5, 2.3, 3.0]) wb(b, C, 0, s * a, C.fh + C.wh / 2, 0, .12, C.wh, .05, 0xf7efdc);
    // fenêtres : rez-de-chaussée en plein cintre, étage à frontons, statues dans les niches
    const y1 = .5 + 1.15, y2 = .5 + 3.4;
    for (const s of [-1, 1]) { for (const a of [1.9, 2.65]) { W(b, C, 0, s * a, y1, Object.assign({ w: .48, h: 1.25, arch: 1 }, WINM)); W(b, C, 0, s * a, y2, Object.assign({ w: .48, h: 1.15 }, WINM)); b.P(PT.pierre); G.prism(b, .7, .22, .1, MST2, s * a, y2 + .72, 1.15); b.P(0); }
      const H = s < 0 ? PL : PR; for (const a of [-.42, .42]) { W(b, H, 0, a, y1, Object.assign({ w: .44, h: 1.25, arch: 1 }, WINM)); W(b, H, 0, a, y2, Object.assign({ w: .44, h: 1.15 }, WINM)); b.P(PT.pierre); G.prism(b, .64, .22, .1, MST2, H.xc + a, y2 + .72, H.zc + H.d / 2 + .05); b.P(0); }
      for (const f of [s < 0 ? 3 : 2]) for (const a of [-1.2, 0, 1.2]) { W(b, H, f, a, y1, Object.assign({ w: .44, h: 1.2 }, WINM)); W(b, H, f, a, y2, Object.assign({ w: .44, h: 1.1 }, WINM)); } }
    for (const a of [-.75, .75]) { W(b, AV, 0, a, y2, Object.assign({ w: .5, h: 1.3, arch: 1 }, WINM)); statue(b, a, AV.fh + .45, 1.75, 0xece6d8, .9); }
    W(b, AV, 0, 0, y2, Object.assign({ w: .56, h: 1.4, arch: 1 }, WINM));
    for (const a of [-1, 1]) for (const f of [1]) W(b, C, f, a * 2, y2, Object.assign({ w: .44, h: 1.1 }, WINM));
    // grande porte et portes latérales, balcon aux drapeaux
    D(b, AV, 0, 0, { w: .9, h: 1.7, col: 0x2f4f7a, style: 'vitre', frame: 0xf7f2e6, arch: 1, steps: 0, lamp: 2 });
    for (const a of [-.78, .78]) D(b, AV, 0, a, { w: .46, h: 1.35, col: 0x2f4f7a, style: 'vitre', frame: 0xf7f2e6, arch: 1, steps: 0, lampPos: 'none' });
    balustrade(b, -1.25, 1.25, 1.83, AV.fh + 2.43, 0xf2ead8); b.P(PT.pierre); b.box(2.7, .1, .45, MST2, 0, AV.fh + 2.4, 1.72); b.P(0);
    flag(b, -.95, AV.fh + 2.5, 1.95, 0, 1); flag(b, .95, AV.fh + 2.5, 1.95, PI, 1);
    sign(b, F(0, 0, 1.6, 0), 'HOTEL DE VILLE', AV.fh + 2.05, .055, GOLD, .03);
    // statues sur la corniche (comme à Paris)
    for (const x of [-4.6, -3.3, -2.4, -1.6, 1.6, 2.4, 3.3, 4.6]) statue(b, x, (Math.abs(x) > 3 ? PL.fh + PL.wh : C.fh + C.wh) + .18, 1.05, 0xf3ecdc, .75);
    // fronton du pavillon central avec horloge
    const yA = AV.fh + AV.wh + .18; b.P(PT.pierre); G.prism(b, 2.9, .9, .4, MST2, 0, yA, 1.42); b.P(0); clock(b, F(0, yA + .38, 1.62, 0), .3, 10, 10);
    // toits à la Mansart en ardoise, lucarnes, crêtes dorées
    const yC = C.fh + C.wh + .18; frustum(b, 6.2, 3.6, 5.4, 2.6, 1.3, SLATE, 0, yC, -.7, PT.ardoise); frustum(b, 5.4, 2.6, 4.4, .6, .55, SLATE, 0, yC + 1.3, -.7, PT.ardoise);
    for (let k = 0; k < 18; k++) b.box(.04, .14, .04, GOLD, -2.2 + k * .26, yC + 1.92, -.7);
    for (const s of [-1, 1]) for (const x of [1.95, 2.75]) { const z = .85; b.P(PT.pierre); b.box(.46, .62, .4, MST, s * x, yC + .5, z); b.P(0); b.cyl(.13, .13, .05, 12, 0x9fb9d4, s * x, yC + .52, z + .21, PI / 2, 0, 0, 1); b.tor(.15, .035, MST2, s * x, yC + .52, z + .22, 0, 0, 0, 0, 14); G.prism(b, .6, .26, .46, SLATE, s * x, yC + .8, z); epi(b, s * x, yC + 1.05, z, .6); }
    for (const H of [PL, PR]) { const yP = H.fh + H.wh + .18; frustum(b, 1.95, 4.25, .5, 2.2, 2.6, SLATE, H.xc, yP, H.zc, PT.ardoise); for (const z of [-1.0, -.3, .4]) epi(b, H.xc, yP + 2.6, H.zc + z, .9);
      for (const z of [-.9, .7]) { b.P(PT.pierre); b.box(.36, 1.9, .55, MST2, H.xc + (H.xc < 0 ? -.45 : .45), yP + .9, H.zc + z); b.P(0); }
      b.P(PT.pierre); b.box(.42, .5, .36, MST, H.xc, yP + .55, H.zc + 2.0); b.P(0); b.cyl(.1, .1, .04, 10, 0x9fb9d4, H.xc, yP + .58, H.zc + 2.19, PI / 2, 0, 0, 1); G.prism(b, .52, .24, .4, SLATE, H.xc, yP + .82, H.zc + 2.0); }
    // pavillon central : dôme carré, campanile à horloges, lanterne, drapeau
    const yD = AV.fh + AV.wh + .18; frustum(b, 2.7, 4.2, 2.1, 3.0, 1.0, SLATE, 0, yD, -.45, PT.ardoise);
    b.P(PT.pierre); b.box(1.5, 1.7, 1.5, MST, 0, yD + 1.85, -.45); b.P(0); corn(b, blk(0, -.45, 1.5, 1.5, 0, 0), yD + 2.75, MST2, .12, .16);
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, T = face(0, yD + 1.95, -.45, ry); clock(b, Object.assign((lx, ly, lz) => T(lx, ly, lz + .75), { ry }), .48, 10, 10); }
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { b.cyl(.07, .08, 1.7, 8, 0xf7efdc, sx * .78, yD + 1.85, -.45 + sz * .78); epi(b, sx * .82, yD + 2.85, -.45 + sz * .82, .7); }
    b.P(PT.pierre); b.box(1.1, .9, 1.1, MST2, 0, yD + 3.3, -.45); b.P(0); for (let k = 0; k < 4; k++) { const ry = k * PI / 2, T = face(0, yD + 3.3, -.45, ry); b.box(.32, .6, .05, 0x2c3440, ...T(0, -.02, .56), 0, ry, 0); }
    b.P(PT.ardoise); b.sph(.75, SLATE, 0, yD + 3.75, -.45, 1, 1.2, 1, 0, 16, 10); b.P(0); b.cyl(.2, .24, .5, 8, MST, 0, yD + 4.85, -.45); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.box(.05, .4, .05, MST2, Math.cos(a) * .22, yD + 4.87, -.45 + Math.sin(a) * .22); }
    b.cone(.26, .5, 8, SLATE, 0, yD + 5.35, -.45); epi(b, 0, yD + 5.6, -.45, 1.3); flag(b, 0, yD + 6.0, -.45, 0, 1.2);
    // perron monumental, rampes, candélabres, parterres
    b.P(PT.pierre); for (let k = 0; k < 5; k++) b.box(3.6 - k * .1, .1, .32, 0xe9e1cf, 0, .05 + k * .1, 2.85 - k * .26); b.P(0);
    for (const s of [-1, 1]) { b.P(PT.pierre); b.box(.32, .55, 1.4, MST2, s * 1.95, .28, 2.3); b.P(0); lampadaire3(b, s * 1.95, 2.85, 1.6); b.jit(.08); b.blob(.32, 1, 0x4a8a4f, s * 3.3, .3, 2.2, 3.2, .7, 1.1); b.jit(0); for (let k = 0; k < 9; k++) b.sph(.07, [0xffffff, 0xe8434a, 0xffd23f, 0xb583e6][k % 4], s * (2.35 + k * .24), .58, 2.2 + (k % 2) * .25, 1, 1, 1, 0, 6, 4); }
    return b.done(); };
  MD.hotel_ville_g = v => { const g = MD.hotel_ville(v); g.scale(1.4, 1.4, 1.4); g.translate(0, 0, -.2); g.computeBoundingSphere(); g.computeBoundingBox(); return g; };
  O.hotel_ville_g = { id: 'hotel_ville_g', n: 'Mairie', model: 'hotel_ville_g', v: 0, h: 11, fp: [14, 8], enter: 'mairie', fixed: 1 };
  O.hotel_ville = { id: 'hotel_ville', n: 'Mairie', model: 'hotel_ville', v: 0, h: 8, fp: [10, 6], enter: 'mairie', fixed: 1 };
  // nouveaux villages : la mairie prend toute la parcelle
  G.STRUCT.mairie = c => { const { ox, oz, put, flat, targets, meta, surf, I: ix } = c; flat(ox, oz, 16, 13);
    put('hotel_ville_g', ox + 1, oz); for (let z = oz + 8; z < oz + 12; z++) for (let x = ox + 4; x < ox + 12; x++) surf[ix(x, z)] = 11;
    put('lampadaire', ox + 3, oz + 9); put('lampadaire', ox + 12, oz + 9); ['tulipe_rouge', 'tulipe_jaune', 'tulipe_blanche', 'fleur_rose'].forEach((t, k) => { put(t, ox + 1 + k, oz + 10); put(t, ox + 11 + k, oz + 10); });
    meta.mairie = { x: ox + 8, z: oz + 8.6 }; targets.push([ox + 8, oz + 9, 4]); };
  // villages existants : la petite mairie est remplacée par l'Hôtel de Ville (même porte, même intérieur)
  function upMairie(m) { const o = [...m.list].find(q => q.t === 'mairie' || q.t === 'hotel_ville'); if (!o) return; const sm = o.t === 'mairie', x0 = o.x - (sm ? 5 : 2), z0 = o.z - (sm ? 5 : 2), L = m.lvl[(o.z + 2) * m.W + o.x + 2];
    for (let z = z0; z < z0 + 8; z++) for (let x = x0; x < x0 + 14; x++) { if (!m.inb(x, z)) return; const q = m.objAt(x, z); if (q && q !== o && (O[q.t].enter || O[q.t].shop)) return; }
    const iid = o.iid; m.removeObj(o);
    for (let z = z0; z < z0 + 8; z++) for (let x = x0; x < x0 + 14; x++) { const q = m.objAt(x, z); if (q) { if (O[q.t].take && G.ITEMS[q.t] && G.storage) { const s = G.storage.findIndex(e => !e); if (s >= 0) G.storage[s] = { id: q.t, n: 1 }; } m.removeObj(q); }
      const i = z * m.W + x; m.lvl[i] = L; m.water[i] = 0; m.ramp[i] = 0; m.markDirty(x, z); }
    m.addObj('hotel_ville_g', x0, z0, 0, iid ? { iid } : {}); }

  // ===================== 3. LA GARE MONUMENTALE (extérieur 6×3) =====================
  MD.gare = v => { const b = G.mb(190), GS = 0xeadfc8, GS2 = 0xd8cbb0, IR = 0x3c4a48, W = A.fenetre, D = A.porte, wb = A.wb;
    const HALL = blk(-.7, .05, 4.4, 2.7, .25, 3.9), WING = blk(2.3, -.15, 1.4, 2.4, .25, 2.9), TOW = blk(2.3, .8, 1.25, 1.2, .25, 6.4);
    b.P(PT.pierre); b.box(6, .25, 3, 0xcfc4ad, 0, .125, 0); b.P(0);
    for (const H of [HALL, WING, TOW]) { wallsB(b, H, GS); corn(b, H, H.fh + .08, GS2, .04, .16); corn(b, H, H.fh + H.wh + .08, GS2, .12, .2); }
    // la grande verrière en plein cintre de la façade, avec son réseau de fer
    const yS = 2.35, R = 1.5, zf = HALL.zc + HALL.d / 2, T0 = F(HALL.xc, 0, zf, 0);
    b.geo(new THREE.CylinderGeometry(R + .16, R + .16, .08, 28, 1, false, -PI / 2, PI), GS2, b.M(HALL.xc, yS, zf + .04, -PI / 2, 0, 0)); b.geo(new THREE.CylinderGeometry(R, R, .06, 28, 1, false, -PI / 2, PI), 0xbfdcf0, b.M(HALL.xc, yS, zf + .07, -PI / 2, 0, 0), 1);
    b.box(R * 2, yS - 1.65, .06, 0xbfdcf0, HALL.xc, (yS + 1.65) / 2, zf + .07, 0, 0, 0, 1);
    for (let k = 1; k < 8; k++) { const a = k / 8 * PI; b.box(R, .04, .03, IR, ...T0(Math.cos(a) * R / 2, yS + Math.sin(a) * R / 2, .11), 0, 0, a); }
    b.tor(R * .45, .025, IR, HALL.xc, yS, zf + .11, 0, 0, 0, 0, 20); b.box(R * 2, .06, .04, IR, HALL.xc, yS, zf + .11); for (const a of [-1, -.5, 0, .5, 1]) b.box(.035, yS - 1.65, .03, IR, HALL.xc + a * R * .95, (yS + 1.65) / 2, zf + .11);
    for (let k = 0; k < 13; k++) { const a = k / 12 * PI; b.P(PT.pierre); b.box(.24, .16, .14, k === 6 ? 0xf3ead6 : GS2, ...T0(Math.cos(a) * (R + .2), yS + Math.sin(a) * (R + .2), .09), 0, 0, a - PI / 2); b.P(0); }
    // trois portes vitrées sous une marquise de fer et de verre
    for (const a of [-1.05, 0, 1.05]) D(b, HALL, 0, a, { w: .62, h: 1.3, col: 0x2f5a46, style: 'vitre', frame: 0xf2ead8, steps: 0, lampPos: 'none' });
    b.box(4.0, .05, .9, 0xcfe6f5, HALL.xc, 1.78, zf + .45, -.12, 0, 0, 2); b.box(4.05, .12, .05, IR, HALL.xc, 1.74, zf + .9);
    for (let k = 0; k < 16; k++) b.sph(.04, IR, HALL.xc - 1.95 + k * .26, 1.66, zf + .9, 1, 1, 1, 0, 5, 4);
    for (const a of [-1.6, -.55, .55, 1.6]) { b.box(.04, .6, .04, IR, HALL.xc + a, 1.5, zf + .05); b.box(.04, .04, .95, IR, HALL.xc + a, 1.72, zf + .45, -.12); b.cyl(.04, .04, .14, 6, 0xfff1c8, HALL.xc + a, 1.5, zf + .75, 0, 0, 0, 1); b.cone(.07, .07, 6, IR, HALL.xc + a, 1.61, zf + .75); }
    // colonnes, statues assises, attique « GARE »
    for (const s of [-1, 1]) { const x = HALL.xc + s * 1.95; b.cyl(.13, .15, 3.4, 12, 0xf3ead6, x, .25 + 1.7, zf + .12); b.box(.36, .14, .36, GS2, x, 3.68, zf + .12); b.box(.36, .2, .36, GS2, x, .35, zf + .12); statue(b, x, 3.95, zf + .05, 0xf3ecdc, .8); }
    b.P(PT.pierre); b.box(3.0, .8, .4, GS, HALL.xc, 4.55, zf - .25); G.prism(b, 3.1, .45, .45, GS2, HALL.xc, 4.95, zf - .25); b.P(0); sign(b, F(HALL.xc, 0, zf - .05, 0), 'GARE', 4.33, .09, GOLD, .03);
    // la halle vitrée derrière (voûte vers les quais)
    const yV = HALL.fh + HALL.wh; b.geo(new THREE.CylinderGeometry(1.3, 1.3, 4.2, 22, 1, true, -PI / 2, PI), 0xcfe6f5, b.M(HALL.xc, yV, -.15, 0, 0, PI / 2, 1, 1, .75), 1);
    for (let k = 0; k <= 8; k++) b.tor(1.31, .04, IR, HALL.xc - 2.05 + k * .51, yV, -.15, 0, PI / 2, 0, 0, 16);
    // aile et beffroi à quatre horloges (comme le « Big Ben » de la Gare de Lyon)
    for (const f of [2, 1]) for (const a of [-.5, .5]) { W(b, WING, f, a, 1.3, { w: .36, h: .8, arch: 1, glass: 0x9fb9d4 }); W(b, WING, f, a, 2.45, { w: .36, h: .6, glass: 0x9fb9d4 }); }
    frustum(b, 1.5, 2.5, 1.0, 1.6, .7, 0x4d5866, WING.xc, WING.fh + WING.wh + .18, WING.zc, PT.ardoise);
    for (const y of [1.4, 2.9, 4.3]) W(b, TOW, 0, 0, y, { w: .3, h: .75, arch: 1, glass: 0x9fb9d4 });
    for (const s of [-1, 1]) wb(b, TOW, 0, s * .52, TOW.fh + TOW.wh / 2, 0, .14, TOW.wh, .06, 0xf7efdc);
    const yT = TOW.fh + TOW.wh; b.P(PT.pierre); b.box(1.45, 1.25, 1.4, GS, TOW.xc, yT + .62, TOW.zc); b.P(0); corn(b, blk(TOW.xc, TOW.zc, 1.45, 1.4, 0, 0), yT + 1.3, GS2, .1, .16);
    for (let f = 0; f < 4; f++) { const ry = f * PI / 2, T = face(TOW.xc, yT + .62, TOW.zc, ry); clock(b, Object.assign((lx, ly, lz) => T(lx, ly, lz + .72), { ry }), .5, 10, 8); }
    frustum(b, 1.5, 1.45, .25, .25, 1.6, 0x4d5866, TOW.xc, yT + 1.38, TOW.zc, PT.ardoise); epi(b, TOW.xc, yT + 2.95, TOW.zc, 1.2);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { b.cone(.08, .5, 6, 0x4d5866, TOW.xc + sx * .68, yT + 1.6, TOW.zc + sz * .65); b.sph(.04, GOLD, TOW.xc + sx * .68, yT + 1.87, TOW.zc + sz * .65); }
    lampadaire3(b, -2.75, 1.25, 1.7);
    return b.done(); };
  O.gare.h = 9;

  // ===================== 4. LE GRAND HALL DE LA GARE (intérieur 26×20) =====================
  const IRON = 0x45524f, GW = 26, GH = 20, WH = 9, RISE = 6.2, CZ = 11.2, TX = [4, 13, 22];
  G.ROOMKINDS.gare = Object.assign({}, G.ROOMKINDS.gare, { W: GW, H: GH });
  G.ROOMNPC = G.ROOMNPC || {}; G.ROOMNPC.gare = ['gare', 3, 12.45];
  G.ROOMFILL = G.ROOMFILL || {};
  G.ROOMFILL.gare = (m, P) => { m.meta.sunny = 1; m.meta.cam = { pitch: .4, dist: 16.5, ty: 2.4, fx: .6, fz: .7, dz: 1.6 };
    P('train_quai', 3, 0, 0, { v: 0 }); P('train_quai', 21, 0, 0, { v: 1 }); P('guichet', 1, 13); P('casiers', 6, 13); P('kiosque_journaux', 20, 13); P('stand_fleurs', 23, 16);
    P('piano', 8, 16); P('horloge', 13, 12); P('chariot_bagages', 10, 12); P('chariot_bagages', 16, 12);
    for (const [x, z, r] of [[7, 3, 1], [7, 7, 1], [18, 3, 3], [18, 7, 3], [11, 15, 0], [14, 15, 0]]) P('banc', x, z, r);
    for (const [x, z] of [[9, 1], [9, 5], [9, 9], [17, 1], [17, 5], [17, 9], [6, 18], [20, 18], [0, 12], [25, 12]]) P('lampadaire', x, z);
    for (const [x, z] of [[18, 16], [20, 16]]) { P('table', x, z); P('chaise', x - 1, z, 1); P('chaise', x, z + 1, 2); }
    for (const [x, z] of [[0, 19], [25, 19], [12, 18], [15, 18], [5, 15]]) P('plante', x, z); P('pot_fleurs', 11, 17); P('pot_fleurs', 16, 17); };
  // le décor du hall : quais et voies, murs à arcades, voûte de fer et de verre, tableau des départs, horloge, lumière
  const ob = G.buildShell;
  G.buildShell = m => { if (m.kind !== 'gare' || m.W < 20) return ob(m); grandShell(m); };
  let glassMat = null, shaftTex = null;
  const gradTex = () => { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.6, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 128);
    const h = x.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.3, 'rgba(0,0,0,0)'); h.addColorStop(.7, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 32, 128); return new THREE.CanvasTexture(c); };
  const textPlane = (w, h, cw, ch, draw) => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; const ctx = c.getContext('2d'), tex = new THREE.CanvasTexture(c); draw(ctx, cw, ch); tex.anisotropy = 4;
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); me.userData = { ctx, tex, cw, ch }; return me; };
  const vx = p => GW / 2 + GW / 2 * Math.cos(p), vy = (p, s = 0) => WH + (RISE - s) * Math.sin(p);
  function grandShell(m) {
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); }
    const g = new THREE.Group(), b = G.mb(400), gx = { hands: [], shafts: [] };
    const fl = (id, w, h, x, z) => { const t = G.patTex('floor', id), geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2, uv.getY(i) * h / 2); const me = new THREE.Mesh(geo, G.toon({ map: t }, {})); me.rotation.x = -PI / 2; me.position.set(x, .001, z); me.receiveShadow = true; g.add(me); };
    fl('marbre', GW, GH - CZ, GW / 2, CZ + (GH - CZ) / 2); fl('pierre', GW, CZ, GW / 2, CZ / 2);
    b.box(GW + 2, .3, GH + 1, 0x3a2a1e, GW / 2, -.16, GH / 2);
    // voies : ballast, traverses, rails, bandes de quai, heurtoirs
    for (const tx of TX) { b.jit(.18); b.box(2.2, .05, CZ - .2, 0x6a655e, tx, .026, (CZ - .2) / 2); b.jit(0); for (let z = .3; z < CZ - .4; z += .55) b.box(1.9, .05, .2, 0x5b3f2b, tx, .065, z);
      for (const s of [-.72, .72]) { b.box(.09, .1, CZ - .3, 0x8d9298, tx + s, .12, (CZ - .3) / 2); b.box(.06, .02, CZ - .3, 0xd8dde2, tx + s, .18, (CZ - .3) / 2); }
      for (const s of [-1, 1]) { b.box(.1, .012, CZ - .2, 0xffffff, tx + s * 1.18, .008, (CZ - .2) / 2); b.box(.28, .014, CZ - .2, 0xf2c94c, tx + s * 1.45, .008, (CZ - .2) / 2); }
      for (const s of [-.62, .62]) { b.box(.16, .9, .16, 0xc8342c, tx + s, .45, CZ - .1); b.cyl(.13, .13, .16, 12, 0x2a2a2a, tx + s, .72, CZ - .26, PI / 2, 0, 0); }
      b.box(1.55, .3, .22, 0xc8342c, tx, .74, CZ - .1); for (let k = 0; k < 4; k++) b.box(.16, .3, .23, 0xffffff, tx - .55 + k * .36, .74, CZ - .1); }
    // murs latéraux : arcades à pilastres, hautes fenêtres, corniches
    b.P(PT.pierre); b.box(.6, WH, GH + .6, 0xe9dcc3, -.3, WH / 2, GH / 2); b.box(.6, WH, GH + .6, 0xe9dcc3, GW + .3, WH / 2, GH / 2); b.P(0);
    for (const [x, s] of [[0, 1], [GW, -1]]) { b.P(PT.pierre); b.box(.5, .4, GH, 0xd8c9ac, x + s * .1, WH - .1, GH / 2); b.box(.4, .25, GH, 0xd8c9ac, x + s * .08, 4.4, GH / 2); b.box(.35, .5, GH, 0xcdbd9e, x + s * .1, .25, GH / 2); b.P(0);
      for (let z = 0; z <= GH; z += 2) b.box(.36, WH - .6, .42, 0xf2e8d4, x + s * .14, (WH - .6) / 2, z);
      for (let z = 1; z < GH; z += 2) { const shop = s < 0 && z > CZ && z < GH - 1, rest = s > 0 && z > CZ && z < GH - 1;
        if (!rest) { b.box(.06, 3.2, 1.25, 0xf7f2e6, x + s * .05, 6.4, z); b.geo(new THREE.CylinderGeometry(.62, .62, .06, 16, 1, false, -PI / 2, PI), 0xf7f2e6, b.M(x + s * .05, 8.0, z, -PI / 2, s * PI / 2, 0)); b.box(.04, 3.1, 1.1, 0xcfe8f8, x + s * .09, 6.4, z, 0, 0, 0, 1); b.box(.03, .04, 1.1, IRON, x + s * .12, 6.4, z); b.box(.03, 3.1, .04, IRON, x + s * .12, 6.4, z); }
        if (!shop && !rest && z < CZ) { b.box(.05, 2.6, 1.3, 0x8e6b4a, x + s * .03, 1.6, z); b.geo(new THREE.CylinderGeometry(.65, .65, .05, 16, 1, false, -PI / 2, PI), 0x8e6b4a, b.M(x + s * .03, 2.9, z, -PI / 2, s * PI / 2, 0)); } } }
    // le restaurant « Le Train Bleu » en mezzanine (mur de gauche) : balcon doré, grandes baies chaudes
    b.P(PT.pierre); b.box(1.2, .25, GH - CZ - 1.4, 0xe2d4b8, .6, 4.0, (CZ + GH - 1.4) / 2 + .3); b.P(0);
    for (let z = CZ + .9; z < GH - 1; z += .22) b.cyl(.03, .04, .5, 6, GOLD, 1.18, 4.38, z); b.box(.08, .07, GH - CZ - 1.6, GOLD, 1.18, 4.65, (CZ + GH - 1.4) / 2 + .3);
    for (let z = CZ + 1.6; z < GH - 1; z += 2) { b.box(.06, 2.4, 1.5, GOLD, .05, 5.6, z); b.box(.04, 2.2, 1.3, 0xffd9a0, .09, 5.6, z, 0, 0, 0, 1); b.geo(new THREE.CylinderGeometry(.75, .75, .06, 16, 1, false, -PI / 2, PI), GOLD, b.M(.05, 6.8, z, -PI / 2, PI / 2, 0)); b.geo(new THREE.CylinderGeometry(.65, .65, .05, 16, 1, false, -PI / 2, PI), 0xffe2b0, b.M(.09, 6.8, z, -PI / 2, PI / 2, 0), 1);
      b.sph(.2, 0xfff1c8, .7, 6.3, z, 1, 1, 1, 1, 10, 8); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.sph(.06, 0xfff1c8, .7 + Math.cos(a) * .28, 6.15, z + Math.sin(a) * .28, 1, 1, 1, 1, 6, 4); } }
    // boutiques au rez-de-chaussée (mur de droite) : vitrines chaudes, auvents rayés
    [[CZ + 1.8, 0xc8342c], [CZ + 4.2, 0x2f5fa8], [CZ + 6.4, 0x2f7a4a]].forEach(([z, c]) => { const x = GW; b.box(.1, 2.3, 2.0, 0x2f4a3e, x - .05, 1.15, z); b.box(.05, 1.6, 1.7, 0xfff0c8, x - .1, 1.1, z, 0, 0, 0, 1); b.box(.06, .3, 1.9, 0x1d2a24, x - .12, 2.15, z);
      for (let k = 0; k < 6; k++) b.box(.6, .05, .32, k % 2 ? 0xffffff : c, x - .45, 2.45 - .0, z - .8 + k * .32, 0, 0, -.35); });
    // mur du fond : trois arches sombres où les voies s'enfoncent, et la grande verrière du pignon
    b.P(PT.pierre); b.box(GW + 1.2, WH, .6, 0xe9dcc3, GW / 2, WH / 2, -.3); b.P(0);
    for (const tx of TX) { b.box(2.6, 3.0, .06, 0x15120f, tx, 1.5, .02); b.geo(new THREE.CylinderGeometry(1.3, 1.3, .06, 18, 1, false, -PI / 2, PI), 0x15120f, b.M(tx, 3.0, .02, -PI / 2, 0, 0));
      for (let k = 0; k <= 10; k++) { const a = k / 10 * PI; b.P(PT.pierre); b.box(.3, .2, .12, k === 5 ? 0xf3ead6 : 0xd8c9ac, tx + Math.cos(a) * 1.45, 3.0 + Math.sin(a) * 1.45, .06, 0, 0, a - PI / 2); b.P(0); } }
    for (let x = 1.5; x < GW; x += 2) b.box(.12, 1.4, .1, 0xd8c9ac, x, WH - 1.6, .05);
    const gp = []; for (let i = 0; i <= 28; i++) { const p = i / 28 * PI; gp.push([vx(p), vy(p)]); }
    const gl = []; for (let i = 0; i < 28; i++) { const [x0, y0] = gp[i], [x1, y1] = gp[i + 1]; gl.push(x0, WH, .05, x1, WH, .05, x1, y1, .05, x0, WH, .05, x1, y1, .05, x0, y0, .05); }
    for (let x = 1.6; x < GW; x += 1.6) { const p = Math.acos(G.clamp((x - GW / 2) / (GW / 2), -1, 1)), top = vy(p); b.box(.08, top - WH, .08, IRON, x, (top + WH) / 2, .1); }
    for (const y of [WH + 2, WH + 4]) { const half = GW / 2 * Math.sqrt(Math.max(0, 1 - ((y - WH) / RISE) ** 2)); b.box(half * 2, .08, .08, IRON, GW / 2, y, .1); }
    b.tor(2.2, .08, IRON, GW / 2, WH + 1.2, .12, 0, 0, 0, 0, 24); b.tor(1.1, .05, IRON, GW / 2, WH + 1.2, .12, 0, 0, 0, 0, 18);
    // la voûte : fermes en fer à treillis, pannes, couverture (verre au centre)
    const NS = 24, glass = [];
    for (let z = 0; z <= GH; z += 2) { for (let i = 0; i < NS; i++) { const p0 = i / NS * PI, p1 = (i + 1) / NS * PI;
        const seg = (x0, y0, x1, y1, t) => { const L = Math.hypot(x1 - x0, y1 - y0); b.box(L + .04, t, .18, IRON, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0)); };
        seg(vx(p0), vy(p0), vx(p1), vy(p1), .16); const ix0 = GW / 2 + (GW / 2 - .8) * Math.cos(p0), ix1 = GW / 2 + (GW / 2 - .8) * Math.cos(p1);
        seg(ix0, vy(p0, .8), ix1, vy(p1, .8), .1); seg(vx(p0), vy(p0), ix1, vy(p1, .8), .06); }
      for (const s of [0, PI]) { b.box(.5, .6, .5, IRON, vx(s) + (s ? .25 : -.25), WH - .2, z); } }
    for (let i = 1; i < NS; i++) { const p = i / NS * PI; b.box(.1, .1, GH, IRON, vx(p), vy(p) - .05, GH / 2); }
    for (let i = 0; i < NS; i++) { const p0 = i / NS * PI, p1 = (i + 1) / NS * PI, x0 = vx(p0), y0 = vy(p0), x1 = vx(p1), y1 = vy(p1), mid = (p0 + p1) / 2;
      if (mid > .27 * PI && mid < .73 * PI) { glass.push(x0, y0, 0, x1, y1, 0, x1, y1, GH, x0, y0, 0, x1, y1, GH, x0, y0, GH); for (let z = 1; z < GH; z += 1) b.box(Math.hypot(x1 - x0, y1 - y0), .04, .04, IRON, (x0 + x1) / 2, (y0 + y1) / 2 - .02, z, 0, 0, Math.atan2(y1 - y0, x1 - x0)); }
      else b.box(Math.hypot(x1 - x0, y1 - y0) + .02, .08, GH, 0xe6ddd0, (x0 + x1) / 2, (y0 + y1) / 2 + .05, GH / 2, 0, 0, Math.atan2(y1 - y0, x1 - x0)); }
    // drapeaux tricolores et lustres-globes suspendus
    for (const [x, z] of [[8.5, CZ + .6], [17.5, CZ + .6]]) { b.cyl(.015, .015, 5.0, 4, 0x777777, x, WH + 1.5, z); [0x1f3f9a, 0xffffff, 0xe1262f].forEach((c, k) => b.box(.5, 2.4, .02, c, x - .5 + k * .5, 8.0, z)); }
    for (const z of [CZ + 2.5, CZ + 5.5, 2, 6]) for (const x of [8.5, 13, 17.5]) { if (z < CZ && x === 13) continue; const top = WH + RISE * .95; b.cyl(.012, .012, top - 6.3, 4, 0x555555, x, (top + 6.3) / 2, z); b.cyl(.08, .14, .12, 8, GOLD, x, 6.35, z); b.sph(.3, 0xfff1c8, x, 6.0, z, 1, 1, 1, 1, 12, 10); }
    const shell = new THREE.Mesh(b.done(), G.MATS); shell.castShadow = true; shell.receiveShadow = true; g.add(shell);
    // verre (laisse passer le soleil : ne fait pas d'ombre)
    if (!glassMat) glassMat = new THREE.MeshBasicMaterial({ color: 0xe4f4ff, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false });
    for (const arr of [glass, gl]) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const me = new THREE.Mesh(geo, glassMat); me.renderOrder = 3; g.add(me); }
    // horloge suspendue (deux faces, aiguilles animées)
    const hc = new THREE.Group(); hc.position.set(GW / 2, 8.4, CZ + .2); g.add(hc); const ck = G.mb(401);
    ck.cyl(1.05, 1.05, .3, 32, GOLD, 0, 0, 0, PI / 2, 0, 0); for (const s of [1, -1]) { ck.cyl(.92, .92, .04, 32, 0xfffaf0, 0, 0, s * .16, PI / 2, 0, 0); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ck.box(k % 3 ? .08 : .16, .035, .02, 0x222222, Math.cos(a) * .76, Math.sin(a) * .76, s * .18, 0, 0, a); } }
    ck.cyl(.02, .02, 1.6, 4, 0x555555, 0, 1.85, 0); ck.sph(.12, GOLD, 0, 1.08, 0); hc.add(new THREE.Mesh(ck.done(), G.MATS));
    const handMat = new THREE.MeshBasicMaterial({ color: 0x1e1e1e });
    for (const s of [1, -1]) { const piv = new THREE.Group(); piv.position.z = s * .2; if (s < 0) piv.rotation.y = PI; hc.add(piv); const mk = (L, w) => { const p = new THREE.Group(), me = new THREE.Mesh(new THREE.BoxGeometry(L, w, .02), handMat); me.position.x = L / 2; p.add(me); piv.add(p); return p; }; gx.hands.push([mk(.45, .07), mk(.72, .045)]); }
    // tableau des départs (texte qui suit l'heure du jeu)
    const board = textPlane(7, 1.9, 1024, 278, () => {}); board.position.set(GW / 2, 5.6, CZ + .3); g.add(board); gx.board = board; gx.boardKey = -1;
    const fr = G.mb(402); fr.box(7.3, 2.15, .25, 0x1b1f24, 0, 0, -.14); fr.box(7.4, .1, .3, GOLD, 0, 1.1, -.14); for (const s of [-1, 1]) fr.cyl(.015, .015, 2.6, 4, 0x555555, s * 3, 2.4, -.14); const frm = new THREE.Mesh(fr.done(), G.MATS); frm.position.copy(board.position); g.add(frm);
    // enseignes
    const sgn = (txt, w, h, x, y, z, ry, bg, fg, font) => { const me = textPlane(w, h, 512, Math.round(512 * h / w), (c, cw, ch) => { c.fillStyle = bg; c.fillRect(0, 0, cw, ch); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, cw / 2, ch / 2 + 2); }); me.position.set(x, y, z); me.rotation.y = ry; g.add(me); };
    sgn('Le Train Bleu', 4.2, .6, .12, 7.55, CZ + 4.6, PI / 2, '#1d2f5e', '#e8c25a', 'italic bold 64px Georgia, serif');
    [['Boulangerie', CZ + 1.8], ['Presse', CZ + 4.2], ['Café', CZ + 6.4]].forEach(([t, z]) => sgn(t, 1.8, .28, GW - .16, 2.15, z, -PI / 2, '#1d2a24', '#f3e3b0', 'bold 60px Georgia, serif'));
    TX.forEach((tx, k) => sgn('Voie ' + 'ABC'[k], 1.2, .45, tx, 4.0, CZ - .05, 0, '#1d3f8a', '#ffffff', 'bold 120px Arial'));
    // rayons de soleil (additifs) et poussière dorée
    if (!shaftTex) shaftTex = gradTex();
    const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffe3a8, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const pl = new THREE.PlaneGeometry(1, 1); pl.translate(0, .5, 0);
    for (let k = 0; k < 9; k++) { const s = new THREE.Group(); for (const r of [0, PI / 2]) { const me = new THREE.Mesh(pl, shaftMat); me.rotation.y = r; s.add(me); } s.userData.top = [7 + (k % 3) * 6 + Math.random() * 1.5, 0, 2 + Math.floor(k / 3) * 6.5 + Math.random() * 2]; s.renderOrder = 4; g.add(s); gx.shafts.push(s); }
    gx.shaftMat = shaftMat;
    const N = 320, dp = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) { dp[i * 3] = 2 + Math.random() * (GW - 4); dp[i * 3 + 1] = .5 + Math.random() * 8.5; dp[i * 3 + 2] = 1 + Math.random() * (GH - 2); seed.push(Math.random() * TAU); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe9b0, size: .06, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false }));
    dust.frustumCulled = false; dust.userData.seed = seed; g.add(dust); gx.dust = dust; gx.sdT = 0;
    g.traverse(c => { if (c.isMesh) c.frustumCulled = false; });
    m.shell = g; m.group.add(g); m._gx = gx;
  }
  // mise à jour du hall : heure, tableau, rayons de soleil, poussière
  const DEST = ['Paris Gare de Lyon', 'Lyon Part-Dieu', 'Marseille St-Charles', 'Nice Ville', 'Bordeaux St-Jean', 'Genève Cornavin', 'Montpellier', 'Annecy', 'Chamonix', 'Strasbourg'];
  const SD = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function drawBoard(me, min) { const { ctx: c, tex, cw, ch } = me.userData; c.fillStyle = '#101317'; c.fillRect(0, 0, cw, ch); c.font = 'bold 34px monospace'; c.textBaseline = 'top';
    c.fillStyle = '#ffd23f'; c.fillText('DÉPARTS', 20, 12); const hh = Math.floor(min / 60) % 24, mm = Math.floor(min % 60); c.textAlign = 'right'; c.fillText(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), cw - 20, 12); c.textAlign = 'left';
    c.fillStyle = '#2a3038'; c.fillRect(0, 58, cw, 2); c.font = 'bold 30px monospace';
    for (let k = 0; k < 5; k++) { const t = (Math.floor(min / 20) + 1 + k) * 20, d = DEST[(Math.floor(min / 20) + k) % DEST.length], y = 70 + k * 41;
      c.fillStyle = k % 2 ? '#14181d' : '#101317'; c.fillRect(0, y - 4, cw, 41); c.fillStyle = '#ffd23f'; c.fillText(String(Math.floor(t / 60) % 24).padStart(2, '0') + 'h' + String(t % 60).padStart(2, '0'), 20, y);
      c.fillStyle = '#ffffff'; c.fillText(d, 150, y); c.fillStyle = '#7fd0ff'; c.fillText(k === 0 ? "À l'heure" : k === 2 ? 'Retard 5 min' : '', 640, y); c.fillStyle = '#ffd23f'; c.textAlign = 'right'; c.fillText('ABC'[k % 3], cw - 30, y); c.textAlign = 'left'; }
    tex.needsUpdate = true; }
  G.on('update', dt => { const m = G.map, gx = m && m._gx; if (!gx || !m.group.visible) return; const min = G.clock.min;
    for (const [h, mn] of gx.hands) { h.rotation.z = PI / 2 - (min / 60 % 12) / 12 * TAU; mn.rotation.z = PI / 2 - (min % 60) / 60 * TAU; }
    const key = Math.floor(min); if (key !== gx.boardKey) { gx.boardKey = key; drawBoard(gx.board, min); }
    const h = min / 60, day = h >= 5.2 && h < 19.6, a = (h - 5.2) / 14.4 * PI; SD.set(-Math.cos(a) * .8, Math.max(.18, Math.sin(a)), .45).normalize(); const dayK = 1 - G.night(), sunK = day ? Math.min(1, Math.sin(a) * 2.2) : 0;
    if ((gx.sdT -= dt) < 0) { gx.sdT = 1; const q = new THREE.Quaternion().setFromUnitVectors(UP, SD);
      for (const s of gx.shafts) { const [x, , z] = s.userData.top, top = vy(Math.acos(G.clamp((x - GW / 2) / (GW / 2), -1, 1))) - .2, L = top / SD.y; s.position.set(x - SD.x * L, 0, z - SD.z * L); s.quaternion.copy(q); s.scale.set(1.4, L, 1.4); } }
    gx.shaftMat.opacity = .16 * sunK * dayK; for (const s of gx.shafts) s.visible = sunK > .02;
    const p = gx.dust.geometry.attributes.position, sd = gx.dust.userData.seed, t = performance.now() / 1000;
    for (let i = 0; i < sd.length; i++) { let y = p.getY(i) + dt * (.04 + .03 * Math.sin(t * .5 + sd[i])); if (y > 9) y = .4; p.setXYZ(i, p.getX(i) + Math.sin(t * .3 + sd[i]) * dt * .08, y, p.getZ(i) + Math.cos(t * .27 + sd[i] * 2) * dt * .08); }
    p.needsUpdate = true; gx.dust.material.opacity = .25 + .45 * dayK; });

  // ===================== 5. LE MOBILIER DE LA GARE =====================
  const WOOD = 0x7a4e2c, DWOOD = 0x5a3820, GRN = 0x2f5a46, INK = 0x1e2226;
  MD.train_quai = v => { const b = G.mb(420 + v), BL = v ? 0xf3f5f7 : 0x1f3c7a, TR = v ? 0x2f5fa8 : 0xd9b84a, RF = v ? 0xc4cad0 : 0x8e969c, DK = 0x22262b;
    const car = (z0, z1, loco) => { const L = z1 - z0, zc = (z0 + z1) / 2;
      for (const zz of [z0 + .6, z1 - .6]) { b.box(1.25, .22, .95, DK, 0, .42, zz); for (const dz of [-.26, .26]) for (const s of [-1, 1]) { b.cyl(.2, .2, .08, 14, 0x3a3d42, s * .62, .26, zz + dz, 0, 0, PI / 2); b.cyl(.08, .08, .09, 8, 0x9aa0a6, s * .62, .26, zz + dz, 0, 0, PI / 2); } }
      rb(b, 1.64, 1.7, L - .14, .2, BL, 0, 1.45, zc); b.geo(new THREE.CylinderGeometry(.82, .82, L - .2, 20, 1, false, -PI / 2, PI), RF, b.M(0, 2.25, zc, -PI / 2, 0, 0, 1, 1, .38), 0, true);
      b.box(1.66, .09, L - .24, TR, 0, 1.0, zc); b.box(1.66, .05, L - .24, TR, 0, 2.08, zc);
      if (!loco) for (const s of [-1, 1]) { for (let zz = z0 + .75; zz < z1 - .6; zz += .62) { b.box(.03, .55, .48, 0xffe7b0, s * .825, 1.6, zz, 0, 0, 0, 1); b.box(.035, .6, .05, BL, s * .826, 1.6, zz + .27); }
        for (const zz of [z0 + .35, z1 - .35]) b.box(.03, 1.25, .42, v ? 0x9aa6b4 : 0x18306a, s * .826, 1.25, zz); } };
    car(-5.4, -1.9, 0); car(-1.8, 1.7, 0); car(1.8, 5.45, 1);
    for (const z of [-1.85, 1.75]) b.box(1.1, 1.5, .14, DK, 0, 1.4, z);
    if (!v) { rb(b, 1.5, .7, .1, .05, 0x2a3a4a, 0, 1.95, 5.42, 0, 0, 0, 2); for (const s of [-.45, .45]) b.sph(.09, 0xfff4c8, s, .95, 5.48, 1, 1, .5, 1); b.box(.5, .2, .03, GOLD, 0, 1.35, 5.47);
      for (const zz of [3.0, 4.3]) { b.box(.04, .45, .04, 0x333333, 0, 2.6, zz); b.box(.9, .03, .03, 0x333333, 0, 2.85, zz, .5); } for (const s of [-1, 1]) for (const zz of [2.4, 3.6, 4.6]) b.box(.03, .5, .7, 0x16284f, s * .826, 1.6, zz); }
    else { b.geo(new THREE.SphereGeometry(.82, 18, 12), BL, b.M(0, 1.42, 5.4, 0, 0, 0, 1, 1.02, 1.6), 0, true); b.geo(new THREE.SphereGeometry(.6, 14, 10), 0x1d2a3a, b.M(0, 1.85, 5.6, 0, 0, 0, 1.1, .45, 1.2), 2, true); b.box(1.66, .12, 3.5, TR, 0, 1.28, 3.6); for (const s of [-.4, .4]) b.sph(.07, 0xffffff, s, .98, 6.45, 1, 1, 1, 1); }
    return b.done(); };
  MD.guichet = () => { const b = G.mb(430); rb(b, 3.9, 1.05, .7, .04, WOOD, 0, .53, 0); rb(b, 4.05, .08, .84, .03, 0xe6dccb, 0, 1.09, 0);
    for (let k = 0; k < 4; k++) { rb(b, .85, .72, .03, .02, 0x8e5d36, -1.45 + k * .97, .5, .36); rb(b, .55, .4, .02, .01, DWOOD, -1.45 + k * .97, .5, .38); }
    for (let k = 0; k <= 4; k++) b.cyl(.03, .03, .95, 8, GOLD, -1.95 + k * .975, 1.6, .05); for (let k = 0; k < 4; k++) { b.box(.9, .78, .02, 0xd8eef8, -1.46 + k * .975, 1.55, .05, 0, 0, 0, 2); b.geo(new THREE.CylinderGeometry(.2, .2, .03, 12, 1, false, -PI / 2, PI), DWOOD, b.M(-1.46 + k * .975, 1.13, .06, -PI / 2, 0, 0)); }
    rb(b, 4.1, .34, .12, .03, DWOOD, 0, 2.2, .05); sign(b, F(0, 0, .11, 0), 'BILLETS', 2.12, .045, GOLD, .01); for (const x of [-1.6, 1.6]) { b.cyl(.05, .07, .1, 8, 0x2f5a46, x, 1.18, -.15); b.cyl(.012, .012, .2, 4, GOLD, x, 1.3, -.15); b.geo(new THREE.CylinderGeometry(.04, .12, .1, 10, 1, true), 0x2f7a4a, b.M(x, 1.42, -.15), 1); }
    return b.done(); };
  MD.kiosque_journaux = () => { const b = G.mb(431); b.cyl(.82, .86, 1.7, 8, GRN, 0, .85, 0, 0, PI / 8); b.cyl(.7, .7, .9, 8, 0xf3ecdc, 0, 1.15, .14, 0, PI / 8); const r = G.rng(4);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const a = -1 + k * .33; b.box(.17, .22, .02, [0xe8434a, 0x5b8fd6, 0xffd23f, 0x4fb35f, 0xffffff, 0xff8fc0][Math.floor(r() * 6)], Math.sin(a) * .88, .5 + row * .32, Math.cos(a) * .88, -.12, a, 0); }
    b.box(1.5, .06, .4, GRN, 0, 1.75, .7, -.4); b.cone(1.1, .6, 8, GRN, 0, 2.05, 0, 0, PI / 8); b.sph(.18, GRN, 0, 2.42, 0); epi(b, 0, 2.55, 0, .6); b.cyl(.88, .88, .2, 8, 0xd9b84a, 0, 1.72, 0, 0, PI / 8); return b.done(); };
  MD.piano = () => { const b = G.mb(432), BK = 0x15110f; rb(b, 1.55, 1.2, .55, .04, BK, 0, .78, -.18); rb(b, 1.6, .06, .62, .03, BK, 0, 1.4, -.18); rb(b, 1.5, .08, .32, .02, BK, 0, .76, .2);
    b.box(1.38, .03, .2, 0xfaf7f0, 0, .815, .22); for (let k = 0; k < 36; k++) if ([1, 3, 6, 8, 10].includes(k % 12)) b.box(.022, .03, .12, BK, -.68 + k * .038, .84, .18);
    for (const s of [-1, 1]) { b.box(.08, .7, .08, BK, s * .72, .35, .25); b.cyl(.025, .025, .25, 6, GOLD, s * .6, 1.55, -.1); b.sph(.03, 0xfff1c8, s * .6, 1.7, -.1, 1, 1.4, 1, 1); }
    b.box(.4, .3, .02, 0xfaf7f0, 0, 1.15, .08, -.2); rb(b, .8, .08, .32, .03, BK, 0, .48, .62); for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(.04, .45, .04, BK, s * .34, .23, .62 + t * .12); return b.done(); };
  MD.chariot_bagages = () => { const b = G.mb(433); b.box(.8, .05, .5, 0x8a9096, 0, .25, 0); for (const s of [-1, 1]) for (const t of [-1, 1]) b.cyl(.09, .09, .05, 10, 0x2a2a2a, s * .32, .09, t * .2, 0, 0, PI / 2);
    b.box(.04, .8, .5, 0x8a9096, -.4, .65, 0); b.cyl(.02, .02, .5, 6, 0x8a9096, -.4, 1.05, 0, PI / 2);
    [[.68, .38, .42, 0x8a4b2a, .45], [.55, .3, .36, 0x2f5fa8, .78], [.42, .24, .3, 0xc8342c, 1.05]].forEach(([w, h, d, c, y]) => { rb(b, w, h, d, .04, c, .05, y, 0); b.box(w + .01, .03, .05, 0x3a2a1e, .05, y, .1); b.box(.12, .04, .03, 0x3a2a1e, .05, y + h / 2 + .03, 0); }); return b.done(); };
  MD.stand_fleurs = () => { const b = G.mb(434); rb(b, 1.8, .7, .7, .04, 0x8e6b4a, 0, .45, 0); for (const s of [-1, 1]) b.cyl(.18, .18, .06, 12, 0x3a2a1e, s * .7, .18, .38, 0, 0, PI / 2);
    const r = G.rng(9); for (let k = 0; k < 6; k++) { const x = -.7 + k * .28; b.cyl(.12, .1, .24, 10, 0xa8adb4, x, .92, 0); for (let i = 0; i < 6; i++) b.sph(.07, [0xff6f91, 0xffd23f, 0xffffff, 0xe8434a, 0xb583e6, 0xff9f40][(k + i) % 6], x + (r() - .5) * .14, 1.1 + r() * .12, (r() - .5) * .14, 1, 1, 1, 0, 7, 5); }
    for (const s of [-1, 1]) b.box(.04, 1.4, .04, 0x5a3820, s * .85, 1.2, -.3); for (let k = 0; k < 7; k++) b.box(.27, .04, .8, k % 2 ? 0xffffff : 0x2f7a4a, -.81 + k * .27, 1.92, -.05, -.25); return b.done(); };
  const fx1 = (id, n, fp, h, ex = {}) => { O[id] = Object.assign({ id, n, model: id, v: 0, fp, h, fixed: 1 }, ex); };
  fx1('train_quai', 'Train', [2, 11], 2.6); fx1('guichet', 'Guichets', [4, 1], 2.3); fx1('kiosque_journaux', 'Kiosque à journaux', [2, 2], 2.6); fx1('piano', 'Piano de la gare', [2, 1], 1.5, { sit: 1 }); fx1('chariot_bagages', 'Chariot à bagages', [1, 1], 1.2); fx1('stand_fleurs', 'Fleuriste', [2, 1], 2.0);

  // ---------- mises à niveau des villages existants ----------
  G.on('load', () => { if (G.world) upMairie(G.world);
    for (const id in G.interiors) { const im = G.interiors[id]; if (im.kind === 'gare' && im.W < 20 && G.map !== im) { G.scene.remove(im.group); delete G.interiors[id]; } } });
  // ===================== 6. INTÉRIEUR DES CHÂTEAUX : immense salon, parquet en chevron, murs blancs à fleurs de lys dorées, lustres, soleil par les fenêtres =====================
  const isCh = m => { if (!m || !m.interior || !G.world) return null; for (const q of G.world.list) if (q.iid === m.id && /^chateau/.test(q.t)) return q; return null; };
  let parq = null, lys = null;
  const cnv = (n, draw) => { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  function texs() { if (parq) return;
    parq = cnv(256, (x, n) => { x.fillStyle = '#5e3a1e'; x.fillRect(0, 0, n, n); const r = G.rng(3);
      for (let j = -2; j < 10; j++) for (let i = -2; i < 10; i++) for (const d of [0, 1]) { x.save(); x.translate(i * 32 + d * 16, j * 32 + d * 16); x.rotate(d ? -PI / 4 : PI / 4);
        const l = 150 + r() * 40 | 0; x.fillStyle = 'rgb(' + l + ',' + (l * .66 | 0) + ',' + (l * .38 | 0) + ')'; x.fillRect(0, 0, 44, 11); x.strokeStyle = 'rgba(60,35,15,.6)'; x.lineWidth = 1.2; x.strokeRect(0, 0, 44, 11);
        x.strokeStyle = 'rgba(90,55,25,.25)'; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(2, 2 + k * 3 + r() * 2); x.lineTo(42, 2 + k * 3 + r() * 2); x.stroke(); } x.restore(); } });
    lys = cnv(256, (x, n) => { x.fillStyle = '#f7f3ea'; x.fillRect(0, 0, n, n); x.strokeStyle = '#d4af37'; x.lineWidth = 3; x.strokeRect(14, 14, n - 28, n - 28); x.lineWidth = 1; x.strokeRect(22, 22, n - 44, n - 44);
      x.fillStyle = '#c99a2e'; x.font = '74px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('⚜', n / 2, n / 2 + 4); x.font = '30px serif'; for (const [a, c] of [[34, 34], [n - 34, 34], [34, n - 34], [n - 34, n - 34]]) x.fillText('⚜', a, c); }); }
  function castleShell(m, o) {
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); } texs();
    const W = m.W, H = m.H, h = 5.6, arched = o.t === 'chateau_grand' && !(o.v > 0), g = new THREE.Group(), b = G.mb(450), gx = { patches: [] };
    const pl = (w, hh, tex, ru, rv, x, y, z, rx, ry) => { const geo = new THREE.PlaneGeometry(w, hh), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); const me = new THREE.Mesh(geo, G.toon({ map: tex }, {})); me.position.set(x, y, z); me.rotation.set(rx, ry, 0); me.receiveShadow = true; g.add(me); };
    pl(W, H, parq, W / 2.2, H / 2.2, W / 2, .002, H / 2, -PI / 2, 0); pl(W, h, lys, W / 2, h / 2, W / 2, h / 2, .002, 0, 0); pl(H, h, lys, H / 2, h / 2, .002, h / 2, H / 2, 0, PI / 2); pl(H, h, lys, H / 2, h / 2, W - .002, h / 2, H / 2, 0, -PI / 2);
    b.box(W + .4, h, .2, 0xece4d4, W / 2, h / 2, -.1); b.box(.2, h, H + .2, 0xece4d4, -.1, h / 2, H / 2); b.box(.2, h, H + .2, 0xece4d4, W + .1, h / 2, H / 2); b.box(W + .6, .3, H + .6, 0x3a2a1e, W / 2, -.16, H / 2);
    for (const [x, z, w, d] of [[W / 2, .04, W, .08], [.04, H / 2, .08, H], [W - .04, H / 2, .08, H]]) { b.box(w, .28, d, 0xf3eee4, x, .14, z); b.box(w + .02, .05, d + .02, GOLD, x, .3, z); b.box(w, .3, d + .04, 0xf7f2e8, x, h - .15, z); b.box(w + .02, .06, d + .06, GOLD, x, h - .32, z); b.box(w + .02, .05, d + .02, GOLD, x, 1.0, z); }
    const win = (x, z, ry) => { const T = face(x, 0, z, ry), wy = 2.35, ww = 1.25, wh = 3.4;
      b.box(ww + .3, wh + .2, .06, 0xffffff, ...T(0, wy, .03), 0, ry, 0); for (const sd of [-1, 1]) b.box(.08, wh + .3, .08, GOLD, ...T(sd * (ww / 2 + .15), wy, .06), 0, ry, 0);
      if (arched) { b.geo(new THREE.CylinderGeometry(ww / 2 + .15, ww / 2 + .15, .06, 18, 1, false, -PI / 2, PI), 0xffffff, b.M(...T(0, wy + wh / 2, .03), -PI / 2, ry, 0)); b.tor(ww / 2 + .15, .04, GOLD, ...T(0, wy + wh / 2, .07), 0, ry, 0, 0, 18); }
      else b.box(ww + .5, .22, .1, GOLD, ...T(0, wy + wh / 2 + .2, .06), 0, ry, 0);
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), G.M.window); gp.position.set(...T(0, wy, .065)); gp.rotation.y = ry; g.add(gp);
      if (arched) { const cg = new THREE.Mesh(new THREE.CircleGeometry(ww / 2, 16, 0, PI), G.M.window); cg.position.set(...T(0, wy + wh / 2, .065)); cg.rotation.y = ry; g.add(cg); }
      b.box(.05, wh, .03, 0xf4efe2, ...T(0, wy, .09), 0, ry, 0); for (let k = 1; k < 5; k++) b.box(ww, .04, .03, 0xf4efe2, ...T(0, wy - wh / 2 + k * wh / 5, .09), 0, ry, 0);
      for (const sd of [-1, 1]) { b.box(.42, wh + .4, .05, 0xb8323c, ...T(sd * (ww / 2 + .38), wy + .1, .12), 0, ry, 0); b.box(.46, .12, .07, GOLD, ...T(sd * (ww / 2 + .38), wy + wh / 2 + .3, .13), 0, ry, 0); }
      return { x, z, ry, ww, y0: wy - wh / 2, y1: wy + wh / 2 }; };
    const wins = []; for (let k = 0, n = Math.max(2, Math.floor(W / 3.6)); k < n; k++) wins.push(win((k + .5) * W / n, 0, 0));
    for (let k = 0, n = Math.max(2, Math.floor((H - 2) / 3.6)); k < n; k++) { const z = 1 + (k + .5) * (H - 2) / n; wins.push(win(0, z, PI / 2)); wins.push(win(W, z, -PI / 2)); }
    const nC = W * H >= 300 ? 3 : W * H >= 140 ? 2 : 1;
    for (let k = 0; k < nC; k++) { const x = W * (k + 1) / (nC + 1), z = H * .45, y = h - .9; b.cyl(.015, .015, 2, 4, GOLD, x, y + 1, z);
      for (const [r, yy, n] of [[.75, y - .55, 12], [.48, y - .2, 8], [.25, y + .1, 6]]) { b.tor(r, .035, GOLD, x, yy, z, PI / 2, 0, 0, 0, 24); for (let i = 0; i < n; i++) { const a = i / n * TAU, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r; b.cyl(.025, .025, .14, 6, 0xfffaf0, cx, yy + .1, cz); b.sph(.03, 0xffd27a, cx, yy + .2, cz, 1, 1.5, 1, 1, 6, 4); b.sph(.035, 0xeaf6ff, cx, yy - .12, cz, 1, 1.6, 1, 1, 6, 4); } }
      b.sph(.16, 0xeaf6ff, x, y - .85, z, 1, 1.6, 1, 1, 10, 8); b.cyl(.05, .12, .5, 10, GOLD, x, y - .4, z); }
    const sm = new THREE.Mesh(b.done(), G.MATS); sm.castShadow = true; sm.receiveShadow = true; g.add(sm);
    const pm = new THREE.MeshBasicMaterial({ color: 0xffdf9e, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (const w of wins) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3)); const me = new THREE.Mesh(geo, pm); me.renderOrder = 2; g.add(me); gx.patches.push([me, w]); }
    gx.pm = pm; gx.t = 0; g.traverse(c => { if (c.isMesh) c.frustumCulled = false; }); m.shell = g; m.group.add(g); m._cx = gx; m.meta.sunny = 1; }
  const ob2 = G.buildShell; G.buildShell = m => { const o = m.kind === 'maison' && isCh(m); if (!o) return ob2(m); castleShell(m, o); };
  // un château a toujours un immense salon (les meubles sont gardés)
  G.on('enterMap', m => { if (!isCh(m) || m.W >= 22) return; setTimeout(() => { if (G.map !== m) return; const nm = G.makeInterior('maison', m.id, { W: 22, H: 16, empty: true }); nm.meta.stage = G.HOME_STAGES.length;
    for (const q of m.list) { if (q.t === 'paillasson') continue; const ex = {}; for (const k of ['v', 'f', 'g', 'iid', 'off', 'txt']) if (q[k] != null) ex[k] = q[k]; if (nm.canPlace(q.t, q.x, q.z, q.r)) nm.addObj(q.t, q.x, q.z, q.r, ex); }
    for (const k of ['door', 'title', 'fromId']) nm.meta[k] = m.meta[k]; G.scene.remove(m.group); G.interiors[m.id] = nm; G.scene.add(nm.group); nm.group.visible = false; G.enterMap(nm, 11.5, 14.6, PI); }, 0); });
  // taches de soleil sur le parquet, selon l'heure
  const SD2 = new THREE.Vector3();
  G.on('update', dt => { const m = G.map, gx = m && m._cx; if (!gx || (gx.t -= dt) > 0) return; gx.t = .5; const h = G.clock.min / 60, day = h >= 5.2 && h < 19.6, a = (h - 5.2) / 14.4 * PI; SD2.set(-Math.cos(a) * .8, Math.max(.18, Math.sin(a)), .45).normalize();
    gx.pm.opacity = day ? .32 * Math.min(1, Math.sin(a) * 2.5) : 0;
    for (const [me, w] of gx.patches) { const p = me.geometry.attributes.position, c = Math.cos(w.ry), sn = Math.sin(w.ry), d = SD2.clone(); if (w.ry === 0) d.z = -Math.abs(d.z);
      const inward = w.ry === 0 ? -d.z : w.ry > 0 ? -d.x : d.x; me.visible = day && inward > .05; if (!me.visible) continue; const pts = [];
      for (const [lx, y] of [[-w.ww / 2, w.y0], [w.ww / 2, w.y0], [w.ww / 2, w.y1], [-w.ww / 2, w.y1]]) { const X = w.x + lx * c, Z = w.z - lx * sn, k = y / d.y; pts.push([G.clamp(X - d.x * k, 0, m.W), .012, G.clamp(Z - d.z * k, 0, m.H)]); }
      [0, 1, 2, 0, 2, 3].forEach((i, j) => p.setXYZ(j, ...pts[i])); p.needsUpdate = true; } });

  // escaliers : on monte (ou descend) tout seul en marchant dessus
  let stT = 0, stCd = 0; G.on('enterMap', () => { stCd = 1.2; stT = 0; });
  G.on('update', dt => { const m = G.map, p = G.player; if (!m || !m.interior || !p || (stCd -= dt) > 0) return; const o = m.objAt(Math.floor(p.x), Math.floor(p.z));
    if (o && o.t === 'escalier' && o.iid) { if ((stT += dt) > .25) { stT = 0; stCd = 2; G.act.interact(); } } else stT = 0; });
  // ===================== 7. INTÉRIEUR DE LA MAIRIE : grande salle de marbre, piliers immenses, bureau au centre, lustres géants =====================
  const MW = 24, MH = 18, MHT = 17;
  G.ROOMKINDS.mairie = Object.assign({}, G.ROOMKINDS.mairie, { W: MW, H: MH });
  G.ROOMNPC.mairie = ['mairie', 12, 7.55];
  MD.pilier = () => { const b = G.mb(460), MB = 0xf4efe6, MV = 0xe6ddd0;
    b.P(PT.pierre); b.box(1.0, .5, 1.0, MV, 0, .25, 0); b.P(0); lathe(b, [[.48, .5], [.48, .62], [.42, .7], [.44, .8], [.38, .9], [0, .9]], MB, 0, 0, 0, 24);
    b.cyl(.34, .38, MHT - 2.6, 24, MB, 0, .9 + (MHT - 2.6) / 2, 0, 0, 0, 0, 0, true); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; b.box(.05, MHT - 2.8, .05, MV, Math.cos(a) * .35, .9 + (MHT - 2.6) / 2, Math.sin(a) * .35); }
    const y = MHT - 1.7; b.tor(.37, .05, GOLD, 0, y, 0, PI / 2, 0, 0, 0, 24); lathe(b, [[.35, y], [.42, y + .3], [.55, y + .7], [.62, y + .8], [0, y + .8]], MB, 0, 0, 0, 24);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.geo(new THREE.SphereGeometry(.13, 8, 6), GOLD, b.M(Math.cos(a) * .5, y + .55, Math.sin(a) * .5, 0, -a, 0, .5, 1.3, .9), 0, true); b.sph(.08, GOLD, Math.cos(a) * .62, y + .72, Math.sin(a) * .62); }
    b.P(PT.pierre); b.box(1.4, .5, 1.4, MV, 0, MHT - .65, 0); b.P(0); b.box(1.5, .1, 1.5, GOLD, 0, MHT - .35, 0); return b.done(); };
  O.pilier = { id: 'pilier', n: 'Pilier', model: 'pilier', v: 0, fp: [1, 1], h: MHT, fixed: 1 };
  G.ROOMFILL.mairie = (m, P) => { m.meta.sunny = 1; m.meta.cam = { pitch: .42, dist: 20, ty: 3.2, fx: .6, fz: .7, dz: 1.8 };
    for (const x of [5, 18]) for (const z of [3, 7, 11, 15]) P('pilier', x, z);
    P('bureau', 11, 8); P('tapis', 11, 10); P('tapis', 11, 12);
    for (const [x, z] of [[8, 13], [14, 13], [8, 15], [14, 15]]) P('banc_parc', x, z); for (const [x, z] of [[1, 1], [22, 1], [1, 16], [22, 16], [9, 8], [14, 8]]) P('plante', x, z);
    P('horloge', 12, 2); P('tableau', 2, 6, 1); P('statue', 11, 3); P('statue', 13, 3); };
  let marb = null;
  function mairieShell(m) {
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); }
    if (!marb) { marb = G.patTex('floor', 'marbre'); }
    const W = m.W, H = m.H, h = MHT, g = new THREE.Group(), b = G.mb(461), gx = { patches: [] };
    const pl = (w, hh, ru, rv, x, y, z, rx, ry, col) => { const geo = new THREE.PlaneGeometry(w, hh), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); const me = new THREE.Mesh(geo, G.toon({ map: marb, color: col }, {})); me.position.set(x, y, z); me.rotation.set(rx, ry, 0); me.receiveShadow = true; g.add(me); };
    pl(W, H, W / 3, H / 3, W / 2, .002, H / 2, -PI / 2, 0, 0xffffff); pl(W, h, W / 3, h / 3, W / 2, h / 2, .002, 0, 0, 0xfff6e6); pl(H, h, H / 3, h / 3, .002, h / 2, H / 2, 0, PI / 2, 0xfff6e6); pl(H, h, H / 3, h / 3, W - .002, h / 2, H / 2, 0, -PI / 2, 0xfff6e6);
    // damier de marbre noir et blanc sous le bureau, frises dorées
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) b.box(1, .01, 1, 0x2e2a2a, 9 + i, .006, 6 + j);
    b.box(W + .6, .3, H + .6, 0x3a2a1e, W / 2, -.16, H / 2); b.box(W + .4, h, .2, 0xe9e1d4, W / 2, h / 2, -.1); b.box(.2, h, H + .2, 0xe9e1d4, -.1, h / 2, H / 2); b.box(.2, h, H + .2, 0xe9e1d4, W + .1, h / 2, H / 2);
    for (const [x, z, w, d] of [[W / 2, .05, W, .1], [.05, H / 2, .1, H], [W - .05, H / 2, .1, H]]) { b.box(w, .4, d, 0xd8cfc0, x, .2, z); b.box(w, .08, d + .02, GOLD, x, .42, z); b.box(w, .6, d + .06, 0xf3ede2, x, h - .3, z); b.box(w + .02, .1, d + .08, GOLD, x, h - .66, z); b.box(w, .3, d + .04, 0xf3ede2, x, 8.2, z); b.box(w + .02, .06, d + .06, GOLD, x, 8.0, z); }
    // hautes fenêtres sur deux niveaux, en plein cintre
    const win = (x, z, ry, wy, wh) => { const T = face(x, 0, z, ry), ww = 1.7;
      b.box(ww + .4, wh + .3, .08, 0xf7f2e8, ...T(0, wy, .04), 0, ry, 0); b.geo(new THREE.CylinderGeometry(ww / 2 + .2, ww / 2 + .2, .08, 20, 1, false, -PI / 2, PI), 0xf7f2e8, b.M(...T(0, wy + wh / 2, .04), -PI / 2, ry, 0)); b.tor(ww / 2 + .2, .06, GOLD, ...T(0, wy + wh / 2, .09), 0, ry, 0, 0, 20);
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), G.M.window); gp.position.set(...T(0, wy, .085)); gp.rotation.y = ry; g.add(gp); const cg = new THREE.Mesh(new THREE.CircleGeometry(ww / 2, 18, 0, PI), G.M.window); cg.position.set(...T(0, wy + wh / 2, .085)); cg.rotation.y = ry; g.add(cg);
      b.box(.06, wh, .04, 0xf7f2e8, ...T(0, wy, .11), 0, ry, 0); for (let k = 1; k < 6; k++) b.box(ww, .05, .04, 0xf7f2e8, ...T(0, wy - wh / 2 + k * wh / 6, .11), 0, ry, 0);
      for (const sd of [-1, 1]) b.box(.18, wh + 1.2, .14, GOLD, ...T(sd * (ww / 2 + .55), wy + .3, .08), 0, ry, 0);
      return { x, z, ry, ww, y0: wy - wh / 2, y1: wy + wh / 2 }; };
    const wins = []; for (const [wy, wh] of [[4.2, 5.4], [11.5, 4.2]]) { for (let k = 0; k < 4; k++) wins.push(win((k + .5) * W / 4, 0, 0, wy, wh)); for (let k = 0; k < 3; k++) { const z = 1.5 + (k + .5) * (H - 3) / 3; wins.push(win(0, z, PI / 2, wy, wh)); wins.push(win(W, z, -PI / 2, wy, wh)); } }
    // poutres de marbre entre les piliers (portent les lustres)
    for (const x of [5.5, 18.5]) { b.P(PT.pierre); b.box(1.1, .9, H - 2, 0xe9e1d4, x, h - .2, H / 2 - .5); b.P(0); b.box(1.2, .1, H - 2, GOLD, x, h - .7, H / 2 - .5); }
    b.P(PT.pierre); for (const z of [3.5, 7.5, 11.5, 15.5]) b.box(13, .8, 1.0, 0xe9e1d4, 12, h - .2, z); b.P(0);
    // lustres géants en cristal
    for (const [x, z] of [[12, 5.5], [12, 9.5], [12, 13.5]]) { const y = h - 6; b.cyl(.025, .025, 5.6, 4, GOLD, x, y + 3.1, z);
      for (const [r, yy, n] of [[1.6, y - 1.2, 20], [1.15, y - .55, 14], [.7, y, 10], [.35, y + .5, 6]]) { b.tor(r, .06, GOLD, x, yy, z, PI / 2, 0, 0, 0, 32);
        for (let i = 0; i < n; i++) { const a = i / n * TAU, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r; b.cyl(.04, .04, .22, 6, 0xfffaf0, cx, yy + .14, cz); b.sph(.05, 0xffd27a, cx, yy + .3, cz, 1, 1.5, 1, 1, 6, 4); for (let d = 1; d <= 3; d++) b.sph(.045, 0xeaf6ff, cx, yy - d * .14, cz, 1, 1.4, 1, 1, 6, 4); } }
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; b.cyl(.008, .008, 1.2, 3, 0xeaf6ff, x + Math.cos(a) * 1.3, y - .6, z + Math.sin(a) * 1.3, 0, 0, 0, 1); }
      b.sph(.3, 0xeaf6ff, x, y - 1.9, z, 1, 1.6, 1, 1, 12, 10); b.cyl(.1, .25, .9, 12, GOLD, x, y - 1.2, z); }
    const sm = new THREE.Mesh(b.done(), G.MATS); sm.castShadow = true; sm.receiveShadow = true; g.add(sm);
    const pm = new THREE.MeshBasicMaterial({ color: 0xffdf9e, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (const w of wins) { if (w.y0 > 8) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3)); const me = new THREE.Mesh(geo, pm); me.renderOrder = 2; g.add(me); gx.patches.push([me, w]); }
    gx.pm = pm; gx.t = 0; g.traverse(c => { if (c.isMesh) c.frustumCulled = false; }); m.shell = g; m.group.add(g); m._cx = gx; m.meta.sunny = 1; }
  const ob3 = G.buildShell; G.buildShell = m => { if (m.kind !== 'mairie' || m.W < 20) return ob3(m); mairieShell(m); };
  G.on('load', () => { for (const id in G.interiors) { const im = G.interiors[id]; if (im.kind === 'mairie' && im.W < 20 && G.map !== im) { G.scene.remove(im.group); delete G.interiors[id]; } } });

})();
