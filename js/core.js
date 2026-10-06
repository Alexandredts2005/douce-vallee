'use strict';
// ===== Douce Vallée — noyau : constantes, maths, bruit, matériaux courbés, textures, entrées =====
const G = window.G = {};
G.ACRE = 16; G.TIER = 1.5; G.STEP = 0.42; G.BORDER = 4; G.SEA = 10; G.AC = 7; G.AR = 6;
G.FR = [[0, 1], [1, 0], [0, -1], [-1, 0]];
G.el = id => document.getElementById(id);
// ---------- crochets pour les modules (init, frame, update, enterMap, newDay, save, load, newGame, move) ----------
G.hooks = {};
G.on = (ev, fn) => (G.hooks[ev] = G.hooks[ev] || []).push(fn);
G.emit = (ev, ...a) => { const l = G.hooks[ev]; if (!l) return; for (const f of l) { try { f(...a); } catch (e) { if (!f._err) console.error('hook ' + ev, e); f._err = e; } } };
G.npcRoles = {}; G.ROOMFILL = {}; G.ROOMNPC = {};
G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.smooth = t => t * t * (3 - 2 * t);
G.angLerp = (a, b, t) => { const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * t; };
G.rng = seed => { let s = (seed >>> 0) || 1; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
G.hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
G.hash2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
G.noise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = G.hash2(xi, yi, s), b = G.hash2(xi + 1, yi, s), c = G.hash2(xi, yi + 1, s), d = G.hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
G.fbm = (x, y, s = 0, o = 3) => { let t = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += G.noise(x * f, y * f, s + i * 17) * a; n += a; a *= .5; f *= 2; } return t / n; };
G.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
G.v3 = new THREE.Vector3(); G.v3b = new THREE.Vector3(); G.m4 = new THREE.Matrix4(); G.q = new THREE.Quaternion();

// ---------- Monde arrondi (effet "rouleau" à la ACNL) ----------
G.U = { curve: { value: 0.0042 }, cc: { value: new THREE.Vector3() }, cf: { value: new THREE.Vector2(0, -1) } };
G.CURVE = 0.0042;
const CURVE_VS = `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
vec4 cwp = modelMatrix * mvPosition;
vec2 cdv = cwp.xz - uCC.xz;
float cdd = dot(cdv, uCF);
float cdl = cdv.x * uCF.y - cdv.y * uCF.x;
cwp.y -= uCurve * (cdd * cdd + 0.3 * cdl * cdl);
mvPosition = viewMatrix * cwp;
gl_Position = projectionMatrix * mvPosition;`;
// o.cloud : ombres des nuages qui défilent ; o.outline : épaisseur de contour (coque inversée)
G.U.cloudTex = { value: null }; G.U.cloudOff = { value: new THREE.Vector2() }; G.U.cloudAmt = { value: .22 };
G.curveMat = (m, o = {}) => {
  m.onBeforeCompile = sh => {
    sh.uniforms.uCurve = G.U.curve; sh.uniforms.uCC = G.U.cc; sh.uniforms.uCF = G.U.cf;
    let vs = 'uniform float uCurve;\nuniform vec3 uCC;\nuniform vec2 uCF;\n' + (o.cloud ? 'varying vec2 vCW;\n' : '') + (o.outline ? 'uniform float uOut;\n' : '') + sh.vertexShader;
    if (o.outline) { sh.uniforms.uOut = { value: o.outline }; vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uOut;'); }
    sh.vertexShader = vs.replace('#include <project_vertex>', CURVE_VS.replace('vec2 cdv', (o.cloud ? 'vCW = cwp.xz;\n' : '') + 'vec2 cdv'));
    if (o.cloud) {
      sh.uniforms.uCloudTex = G.U.cloudTex; sh.uniforms.uCloudOff = G.U.cloudOff; sh.uniforms.uCloudAmt = G.U.cloudAmt;
      sh.fragmentShader = 'varying vec2 vCW;\nuniform sampler2D uCloudTex;\nuniform vec2 uCloudOff;\nuniform float uCloudAmt;\n' + sh.fragmentShader.replace('#include <fog_fragment>', 'gl_FragColor.rgb *= 1.0 - uCloudAmt * smoothstep(.42, .75, texture2D(uCloudTex, vCW * .016 + uCloudOff).r);\n#include <fog_fragment>');
    }
  };
  const key = 'cv' + (o.cloud ? 'c' : '') + (o.outline ? 'o' + o.outline : '');
  m.customProgramCacheKey = () => key;
  return m;
};
G.toon = (p = {}, o = { cloud: true }) => G.curveMat(new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0.05 }, p)), o);
G.outlineGeo = geo => {
  if (geo._ol) return geo._ol; const p = geo.attributes.position, src = geo.attributes.normal, n = p.count, map = new Map(), nor = new Float32Array(n * 3);
  const key = i => Math.round(p.getX(i) * 400) + ',' + Math.round(p.getY(i) * 400) + ',' + Math.round(p.getZ(i) * 400);
  for (let i = 0; i < n; i++) { const k = key(i); let a = map.get(k); if (!a) { a = [0, 0, 0]; map.set(k, a); } a[0] += src.getX(i); a[1] += src.getY(i); a[2] += src.getZ(i); }
  for (let i = 0; i < n; i++) { const a = map.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; nor[i * 3] = a[0] / l; nor[i * 3 + 1] = a[1] / l; nor[i * 3 + 2] = a[2] / l; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', p); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.boundingSphere = geo.boundingSphere; geo._ol = g; return g;
};
G.addOutline = (mesh, mat) => { const o = new THREE.Mesh(G.outlineGeo(mesh.geometry), mat || G.M.outline); o.frustumCulled = false; o.castShadow = false; mesh.add(o); return o; };
G.bendY = (x, z) => {
  const dx = x - G.U.cc.value.x, dz = z - G.U.cc.value.z, f = G.U.cf.value;
  const d = dx * f.x + dz * f.y, l = dx * f.y - dz * f.x;
  return -G.U.curve.value * (d * d + 0.3 * l * l);
};

// ---------- Textures procédurales ----------
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
G.cv = cv;
function speck(ctx, n, cols, rmin, rmax, P, r) {
  for (let i = 0; i < n; i++) {
    const x = r() * P, y = r() * P, s = rmin + r() * (rmax - rmin);
    ctx.fillStyle = cols[Math.floor(r() * cols.length)];
    for (const ox of [-P, 0, P]) for (const oy of [-P, 0, P]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, s, 0, 7); ctx.fill(); }
  }
}
function blades(ctx, n, cols, P, r) {
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * P, y = r() * P, l = 3 + r() * 4, a = -1.2 - r() * .7;
    ctx.strokeStyle = cols[Math.floor(r() * cols.length)];
    for (const ox of [-P, 0, P]) for (const oy of [-P, 0, P]) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); ctx.stroke(); }
  }
}
function rrect(ctx, x, y, w, h, rad) { ctx.beginPath(); ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad); ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath(); }
G.rrect = rrect;
const CELL_DRAW = [
  (c, P, r) => { c.fillStyle = '#86d16a'; c.fillRect(0, 0, P, P); speck(c, 40, ['#7cc860', '#93da74'], 2, 5, P, r); blades(c, 55, ['#6db954', '#5fae4a', '#9be07c'], P, r); },
  (c, P, r) => { c.fillStyle = '#6cb756'; c.fillRect(0, 0, P, P); speck(c, 40, ['#62ab4c', '#78c160'], 2, 5, P, r); blades(c, 60, ['#5a9f45', '#4f923e', '#80c766'], P, r); speck(c, 8, ['#8a6a3d', '#a07a45'], 1.5, 2.5, P, r); },
  (c, P, r) => { c.fillStyle = '#d2ab72'; c.fillRect(0, 0, P, P); speck(c, 70, ['#c39a62', '#dcb985', '#b88f5a'], 1.5, 4, P, r); speck(c, 12, ['#a88050', '#e6c999'], 2, 3.5, P, r); },
  (c, P, r) => { c.fillStyle = '#86d16a'; c.fillRect(0, 0, P, P); blades(c, 30, ['#6db954', '#9be07c'], P, r); const st = [[24, 24, 20], [70, 26, 17], [26, 70, 17], [72, 72, 21], [48, 48, 9]];
    for (const [x, y, s] of st) { c.fillStyle = '#8b8a80'; c.beginPath(); c.ellipse(x, y + 2, s, s * .82, 0, 0, 7); c.fill(); c.fillStyle = '#c9c7bc'; c.beginPath(); c.ellipse(x, y, s, s * .8, 0, 0, 7); c.fill(); c.fillStyle = '#dcdad0'; c.beginPath(); c.ellipse(x - s * .25, y - s * .25, s * .45, s * .3, 0, 0, 7); c.fill(); } },
  (c, P, r) => { c.fillStyle = '#7d766d'; c.fillRect(0, 0, P, P); const rows = 4, h = P / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) { const w = P / 3, x = i * w + (j % 2) * w / 2; const t = r(); c.fillStyle = t < .33 ? '#c8c0b2' : t < .66 ? '#bdb4a5' : '#d3ccbf'; rrect(c, x + 2, j * h + 2, w - 4, h - 4, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; rrect(c, x + 4, j * h + 3, w - 12, 5, 3); c.fill(); } },
  (c, P, r) => { c.fillStyle = '#f1dda2'; c.fillRect(0, 0, P, P); speck(c, 120, ['#e8d092', '#f8e8b8', '#dcc184'], 1, 2.2, P, r); },
  (c, P, r) => { c.fillStyle = '#c99158'; c.fillRect(0, 0, P, P); const h = P / 4;
    for (let j = 0; j < 4; j++) { c.fillStyle = j % 2 ? '#c08850' : '#d09a62'; c.fillRect(0, j * h, P, h); c.fillStyle = '#8f5d33'; c.fillRect(0, j * h, P, 2); const off = (j * 37) % P; c.fillRect(off, j * h, 2, h); c.fillRect((off + 48) % P, j * h, 2, h);
      c.fillStyle = 'rgba(120,70,30,.25)'; for (let k = 0; k < 3; k++) c.fillRect(r() * P, j * h + 6 + r() * (h - 12), 14 + r() * 20, 1.5); } },
  (c, P, r) => { c.fillStyle = '#87593a'; c.fillRect(0, 0, P, P); for (let j = 0; j < 6; j++) { c.fillStyle = '#6e4529'; c.fillRect(0, j * 16 + 10, P, 4); c.fillStyle = '#9b6a47'; c.fillRect(0, j * 16 + 2, P, 3); } speck(c, 25, ['#7a4e31', '#a4724e'], 1, 2, P, r); },
  (c, P, r) => { c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, P, P); speck(c, 50, ['#e2ebf7', '#ffffff', '#d7e3f3'], 1.5, 4, P, r); },
  (c, P, r) => { c.fillStyle = '#e6d6bd'; c.fillRect(0, 0, P, P); const h = P / 6;
    for (let j = 0; j < 6; j++) for (let i = -1; i < 4; i++) { const w = P / 3, x = i * w + (j % 2) * w / 2; c.fillStyle = r() < .5 ? '#c4654a' : '#b85a41'; c.fillRect(x + 1.5, j * h + 1.5, w - 3, h - 3); } },
  (c, P, r) => { c.fillStyle = '#a9b58f'; c.fillRect(0, 0, P, P); speck(c, 60, ['#97a57e', '#bcc6a2', '#8c9a73', '#c9c3a2'], 2, 5, P, r); },
  (c, P, r) => { c.fillStyle = '#d9d2c2'; c.fillRect(0, 0, P, P); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 2 ? '#ece6d8' : '#f3eee3'; c.fillRect(i * 48 + 2, j * 48 + 2, 44, 44); } speck(c, 20, ['#e2dccd'], 1, 3, P, r); },
  (c, P, r) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.fillStyle = (i + j) % 2 ? '#f2ede2' : '#c9b9a0'; c.fillRect(i * 24, j * 24, 24, 24); } c.strokeStyle = 'rgba(0,0,0,.08)'; c.strokeRect(0, 0, P, P); },
  (c, P, r) => { c.fillStyle = '#c9554e'; c.fillRect(0, 0, P, P); c.fillStyle = '#d96a5e'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(i * 24 + 12, j * 24 + 12, 5, 0, 7); c.fill(); } c.fillStyle = '#e9b44c'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(i * 24, j * 24, 2.5, 0, 7); c.fill(); } },
  (c, P, r) => { c.fillStyle = '#86d16a'; c.fillRect(0, 0, P, P); blades(c, 45, ['#6db954', '#9be07c'], P, r); speck(c, 14, ['#ffffff', '#ffe36b', '#ffb3d1'], 1.5, 2.5, P, r); },
  (c, P, r) => { c.fillStyle = '#c8b28a'; c.fillRect(0, 0, P, P); speck(c, 40, ['#b9a37b', '#d6c29c'], 2, 4, P, r); }
];
G.TEX = {};
G.makeTextures = () => {
  const A = cv(512, 512), ax = A.getContext('2d'), P = 96;
  CELL_DRAW.forEach((fn, i) => {
    const t = cv(P, P), tc = t.getContext('2d'), r = G.rng(1000 + i * 77);
    fn(tc, P, r);
    const cx = (i % 4) * 128, cy = Math.floor(i / 4) * 128;
    ax.save(); ax.beginPath(); ax.rect(cx, cy, 128, 128); ax.clip();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) ax.drawImage(t, cx + 16 + a * P, cy + 16 + b * P);
    ax.restore();
  });
  const at = new THREE.CanvasTexture(A); at.anisotropy = 4; G.TEX.atlas = at;
  // falaise
  const C = cv(128, 128), cc = C.getContext('2d'), r = G.rng(55);
  const bands = ['#a97d51', '#9a6f47', '#b88b5c', '#8f6640', '#a57a4f'];
  let y = 0; let bi = 0; while (y < 128) { const h = 14 + r() * 16; cc.fillStyle = bands[bi++ % bands.length]; cc.fillRect(0, y, 128, h + 1); y += h; }
  speck(cc, 40, ['#7c5838', '#c49a6c', '#8a8580', '#a6a199'], 2, 5, 128, r);
  cc.fillStyle = 'rgba(70,45,25,.35)'; for (let i = 0; i < 9; i++) { const x = r() * 128; cc.fillRect(x, 20 + r() * 60, 2, 10 + r() * 30); }
  cc.fillStyle = '#6dbf55'; cc.fillRect(0, 0, 128, 10);
  for (let x = 0; x < 128; x += 8) { const d = 6 + r() * 10; cc.beginPath(); cc.ellipse(x + 4, 9, 5, d, 0, 0, 7); cc.fill(); }
  cc.fillStyle = '#86d16a'; cc.fillRect(0, 0, 128, 5);
  const ct = new THREE.CanvasTexture(C); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.anisotropy = 4; G.TEX.cliff = ct;
  // eau
  const W = cv(128, 128), wc = W.getContext('2d'), rw = G.rng(9);
  wc.fillStyle = '#d8eef8'; wc.fillRect(0, 0, 128, 128);
  wc.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const x = rw() * 128, yy = rw() * 128, l = 10 + rw() * 22; wc.strokeStyle = rw() < .6 ? 'rgba(255,255,255,.95)' : 'rgba(170,215,240,.9)'; wc.lineWidth = 2 + rw() * 2;
    for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) { wc.beginPath(); wc.moveTo(x + ox, yy + oy); wc.quadraticCurveTo(x + ox + l / 2, yy + oy - 4, x + ox + l, yy + oy); wc.stroke(); } }
  const wt = new THREE.CanvasTexture(W); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; G.TEX.water = wt;
  // cascade
  const F = cv(64, 128), fc = F.getContext('2d'), rf = G.rng(4);
  fc.fillStyle = '#bfe6fa'; fc.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 40; i++) { const x = rf() * 64, yy = rf() * 128, l = 20 + rf() * 50; fc.fillStyle = rf() < .5 ? 'rgba(255,255,255,.9)' : 'rgba(140,200,235,.8)'; fc.fillRect(x, yy, 2 + rf() * 3, l); fc.fillRect(x, yy - 128, 2 + rf() * 3, l); }
  const ft = new THREE.CanvasTexture(F); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; G.TEX.fall = ft;
  // point doux pour particules
  const D = cv(64, 64), dc = D.getContext('2d'); const gr = dc.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  dc.fillStyle = gr; dc.fillRect(0, 0, 64, 64); G.TEX.dot = new THREE.CanvasTexture(D);
  // dégradé cartoon (3 tons) et ombres de nuages
  const tg = new THREE.DataTexture(new Uint8Array([155, 155, 155, 212, 212, 212, 255, 255, 255]), 3, 1, THREE.RGBFormat);
  tg.minFilter = tg.magFilter = THREE.NearestFilter; tg.generateMipmaps = false; tg.needsUpdate = true; G.TEX.toon = tg;
  const CL = cv(256, 256), cl = CL.getContext('2d'), rc = G.rng(21); cl.fillStyle = '#000'; cl.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) { const x = rc() * 256, y = rc() * 256, r = 18 + rc() * 34;
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { for (let k = 0; k < 4; k++) { const g2 = cl.createRadialGradient(x + ox + k * r * .5, y + oy + (k % 2) * r * .3, 0, x + ox + k * r * .5, y + oy + (k % 2) * r * .3, r); g2.addColorStop(0, 'rgba(255,255,255,.9)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); cl.fillStyle = g2; cl.fillRect(0, 0, 256, 256); } } }
  const ct2 = new THREE.CanvasTexture(CL); ct2.wrapS = ct2.wrapT = THREE.RepeatWrapping; G.TEX.clouds = ct2; G.U.cloudTex.value = ct2;
};
G.atlasUV = cell => { const cx = cell % 4, cy = Math.floor(cell / 4); const u0 = (cx * 128 + 16) / 512, u1 = (cx * 128 + 112) / 512; const v1 = 1 - (cy * 128 + 16) / 512, v0 = 1 - (cy * 128 + 112) / 512; return [u0, v0, u1, v1]; };

G.makeMaterials = () => {
  const M = G.M = {};
  M.std = G.toon({ vertexColors: true });
  M.glow = G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true }));
  M.trans = G.toon({ vertexColors: true, transparent: true, opacity: .62, depthWrite: false });
  M.ground = G.toon({ map: G.TEX.atlas, vertexColors: true });
  M.cliff = G.toon({ map: G.TEX.cliff, vertexColors: true });
  M.water = G.curveMat(new THREE.MeshStandardMaterial({ map: G.TEX.water, vertexColors: true, transparent: true, opacity: .85, roughness: 0.15, metalness: 0.6, depthWrite: false }), { cloud: true });
  M.outline = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x3a2619, side: THREE.BackSide }), { outline: .007 });
  M.outlineI = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x2f3a22, side: THREE.BackSide }), { outline: .012 });
  M.fall = G.curveMat(new THREE.MeshStandardMaterial({ map: G.TEX.fall, transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false, roughness: 0.9, metalness: 0.05 }));
  M.ghost = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: .45, depthWrite: false }));
  M.shadow = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  M.cursor = G.curveMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  M.line = new THREE.LineBasicMaterial({ color: 0xffffff });
  M.fire = G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true }));
  M.wing = G.toon({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: .92 }, {});
  M.hurt = G.toon({ vertexColors: true, color: 0xff7a7a, emissive: 0x661010 }, {});
  M.xray = G.curveMat(new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: .5, depthWrite: false, depthFunc: THREE.GreaterDepth }));
  M.cloud = G.toon({ vertexColors: true, transparent: true, opacity: .97 }, {});
  M.water.userData.base = .8;
  M.window = G.curveMat(new THREE.MeshBasicMaterial({ map: G.TEX.window }));
  G.MATS = [M.std, M.glow, M.trans, M.fire];
};

// ---------- Entrées : clavier, souris, manette ----------
const I = G.input = {
  keys: {}, pk: {}, rk: {}, chars: {}, any: false,
  mouse: { l: false, r: false, pl: false, pr: false, rclick: false, dx: 0, dy: 0, lx: 0, ly: 0, wheel: 0, cwheel: 0, rdrag: 0, x: 0, y: 0 },
  gp: { on: false, lx: 0, ly: 0, rx: 0, ry: 0, b: [], pb: [] },
  touch: { mx: 0, my: 0, active: false },
  virt: {}, pvirt: {},
  down(...c) { return c.some(k => this.keys[k] || this.virt[k]); },
  hit(...c) { return c.some(k => this.pk[k]); },
  rel(...c) { return c.some(k => this.rk[k]); },
  ch(c) { return !!this.chars[c]; },
  press(code) { if (!this.keys[code]) this.pk[code] = true; this.keys[code] = true; },
  release(code) { if (this.keys[code]) this.rk[code] = true; this.keys[code] = false; },
  endFrame() { this.pk = {}; this.rk = {}; this.chars = {}; const m = this.mouse; m.pl = m.pr = m.rclick = false; m.dx = m.dy = 0; m.lx = m.ly = 0; m.wheel = 0; m.cwheel = 0; this.gp.pb = this.gp.b.slice(); },
  gpHit(i) { return this.gp.b[i] && !this.gp.pb[i]; },
  poll() {
    let pads = []; if (!this.noPad) try { pads = navigator.getGamepads ? navigator.getGamepads() || [] : []; } catch (e) { this.noPad = true; }
    let p = null; for (const g of pads) if (g && g.connected) { p = g; break; }
    const gp = this.gp; if (!p) { gp.on = false; gp.b = []; return; }
    gp.on = true; const dz = v => Math.abs(v) < .18 ? 0 : v;
    gp.lx = dz(p.axes[0] || 0); gp.ly = dz(p.axes[1] || 0); gp.rx = dz(p.axes[2] || 0); gp.ry = dz(p.axes[3] || 0);
    gp.b = p.buttons.map(b => b.pressed);
  }
};
const NOSCROLL = new Set(['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
window.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (NOSCROLL.has(e.code)) e.preventDefault();
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')) e.preventDefault();
  if (!e.repeat) { I.press(e.code); I.chars[(e.key || '').toLowerCase()] = true; }
  I.any = true;
  if (G.audio) G.audio.init();
});
window.addEventListener('keyup', e => I.release(e.code));
window.addEventListener('blur', () => { for (const k in I.keys) I.keys[k] = false; I.mouse.l = I.mouse.r = false; });
G.bindPointer = canvas => {
  const m = I.mouse;
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('mousedown', e => {
    if (G.audio) G.audio.init();
    const locked = document.pointerLockElement === canvas;
    if (G.mouseMode && G.mouseMode() && G.state === 'play' && !locked && !G.ui.modal) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (err) { } return; }
    if (e.button === 0) { m.l = true; m.pl = true; }
    if (locked && e.button === 2) { m.rclick = true; return; }
    if (e.button === 2 || e.button === 1) { m.r = true; m.pr = true; m.rdrag = 0; }
  });
  document.addEventListener('pointerlockchange', () => { I.locked = document.pointerLockElement === canvas; if (!I.locked && G.state === 'play' && G.mouseMode && G.mouseMode() && !G.ui.modal) G.ui.pause(); });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) m.l = false;
    if (e.button === 2 || e.button === 1) { if (m.r && m.rdrag < 6 && e.button === 2) m.rclick = true; m.r = false; }
  });
  window.addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; if (document.pointerLockElement) { m.lx += e.movementX || 0; m.ly += e.movementY || 0; return; } if (m.r) { m.dx += e.movementX || 0; m.dy += e.movementY || 0; m.rdrag += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0); } });
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey || e.shiftKey) m.cwheel += Math.sign(e.deltaY); else m.wheel += e.deltaY; }, { passive: false });
};

// ---------- Stockage local sûr ----------
G.store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
G.b64 = {
  enc(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); },
  dec(str, Type = Uint8Array) { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return Type === Uint8Array ? u : new Type(u.buffer); }
};
