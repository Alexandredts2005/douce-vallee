'use strict';
// ===== Herbe vivante et variée : prairie, gazon ras au bord des chemins, herbes hautes sauvages à épis, plaques sèches et dorées,
// herbe grasse au bord de l'eau, sous-bois sombre, fleurs des champs. Une « carte des milieux » (texture RGBA par carte) décide
// de l'herbe ET teinte le sol dessous (rendu.js). Les touffes ne sont construites qu'autour de la caméra, s'éclaircissent au loin
// (fondu de densité, sans saut), ondulent par rafales et s'écartent sous les pas. =====
(function () {
  const TAU = Math.PI * 2, CS = 16, sm = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // ---------- carte des milieux : R herbe grasse, G sèche, B sauvage (haute), A fleurie ----------
  const BIO = G.bio = { map: null, trev: -1, tex: null, data: null, dP: null, noise: null, t: 0 };
  if (G.SU) { G.SU.uBio = { value: null }; G.SU.uBioSz = { value: new THREE.Vector4(1, 1, 0, 0) }; }
  function dist(m, src) { const W = m.W, H = m.H, D = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) D[i] = src(i) ? 0 : 99;
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x; let d = D[i]; if (x > 0) d = Math.min(d, D[i - 1] + 1); if (z > 0) { d = Math.min(d, D[i - W] + 1); if (x > 0) d = Math.min(d, D[i - W - 1] + 1.414); if (x < W - 1) d = Math.min(d, D[i - W + 1] + 1.414); } D[i] = d; }
    for (let z = H - 1; z >= 0; z--) for (let x = W - 1; x >= 0; x--) { const i = z * W + x; let d = D[i]; if (x < W - 1) d = Math.min(d, D[i + 1] + 1); if (z < H - 1) { d = Math.min(d, D[i + W] + 1); if (x < W - 1) d = Math.min(d, D[i + W + 1] + 1.414); if (x > 0) d = Math.min(d, D[i + W - 1] + 1.414); } D[i] = d; }
    return D; }
  function noiseOf(m) { if (BIO.noise && BIO.noise.m === m) return BIO.noise; const W = m.W, H = m.H, s = ((m.meta && m.meta.seed) || 7) % 997, n = { m, a: new Float32Array(W * H * 4) };
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const k = (z * W + x) * 4;
      n.a[k] = G.fbm(x * .045, z * .045, 101 + s, 3); n.a[k + 1] = G.fbm(x * .08 + 7, z * .08, 202 + s, 3); n.a[k + 2] = G.fbm(x * .06, z * .06 + 3, 303 + s, 3); n.a[k + 3] = G.fbm(x * .11, z * .11, 404 + s, 2); }
    return BIO.noise = n; }
  function buildBio(m) {
    const W = m.W, H = m.H, N = W * H, SF = G.SURF, nz = noiseOf(m).a;
    const dW = dist(m, i => m.water[i] > 0), dP = dist(m, i => { const s = SF[m.surf[i]]; return !!(s && s.path); }), dS = dist(m, i => m.surf[i] === 5 && !m.water[i]);
    const data = BIO.map === m && BIO.data && BIO.data.length === N * 4 ? BIO.data : new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) { const s = m.surf[i], k = i * 4, n1 = nz[k], n2 = nz[k + 1], n3 = nz[k + 2], n4 = nz[k + 3], lawn = 1 - sm(1.2, 3.5, dP[i]);
      const lush = Math.min(1, Math.max(1 - sm(.8, 6, dW[i]), s === 1 ? .75 : 0, sm(.58, .76, n1) * .85));
      const dry = Math.min(1, sm(.55, .72, n2) * (1 - lush * .85) + (1 - sm(1, 4, dS[i])) * .55 + Math.max(0, m.lvl[i] - 2) * .1);
      let wild = sm(.5, .66, n3) * (1 - lawn) * (1 - sm(.6, 1, dry)), fl = s === 14 ? .9 : sm(.6, .76, n4) * .6 * (1 - lawn * .7);
      if (s === 1) { wild *= .4; fl *= .25; }
      data[k] = lush * 255; data[k + 1] = dry * 255; data[k + 2] = wild * 255; data[k + 3] = fl * 255; }
    BIO.data = data; BIO.dP = dP;
    if (!BIO.tex || BIO.tex.image.width !== W || BIO.tex.image.height !== H) { if (BIO.tex) BIO.tex.dispose(); BIO.tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); BIO.tex.magFilter = BIO.tex.minFilter = THREE.LinearFilter; }
    BIO.tex.image.data = data; BIO.tex.needsUpdate = true; BIO.map = m; BIO.trev = m.tRev || 0;
    if (G.SU) { G.SU.uBio.value = BIO.tex; G.SU.uBioSz.value.set(1 / W, 1 / H, 1, 0); }
  }
  G.bioAt = (x, z) => { const m = G.map; if (!BIO.data || BIO.map !== m) return [0, 0, 0, 0]; const tx = G.clamp(Math.floor(x), 0, m.W - 1), tz = G.clamp(Math.floor(z), 0, m.H - 1), k = (tz * m.W + tx) * 4, d = BIO.data; return [d[k] / 255, d[k + 1] / 255, d[k + 2] / 255, d[k + 3] / 255]; };

  // ---------- touffe : 6 brins + 1 fleur des champs (forme calculée dans le shader) ----------
  // position = (racine x, t le long du brin, racine z) ; aB = (angle, largeur signée, hasard, fleur)
  function tuftGeo() { const pos = [], ab = [], idx = []; let v = 0; const r = G.rng(97);
    for (let k = 0; k < 7; k++) { const fl = k === 6, a = k / 6 * TAU + r() * .9, rad = fl ? .04 : .04 + r() * .26, rx = Math.cos(a + 1.3) * rad, rz = Math.sin(a + 1.3) * rad, rnd = r();
      const L = fl ? [[0, .25], [.8, .25], [.87, 4], [.95, 3.4], [1, .3]] : [[0, 1], [.38, .82], [.72, .5], [1, 0]], base = v;
      for (const [t, w] of L) { if (w === 0) { pos.push(rx, t, rz); ab.push(a, 0, rnd, fl ? 1 : 0); v++; } else for (const s of [-1, 1]) { pos.push(rx, t, rz); ab.push(a, s * w, rnd, fl ? 1 : 0); v++; } }
      for (let l = 0; l < L.length - 1; l++) { const a0 = base + l * 2, n = L[l + 1][1] === 0; if (n) idx.push(a0, a0 + 1, a0 + 2); else idx.push(a0, a0 + 1, a0 + 3, a0, a0 + 3, a0 + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setIndex(idx); return g; }

  const VS = `#include <packing>
attribute vec4 aB, iP, iA, iB; uniform float uT, uCurve, uWind, uR0, uR1; uniform vec3 uCC, uFoc, uPl; uniform vec2 uCF;
varying vec3 vC; varying float vH, vSh, vFl; varying vec3 vWP, vVD;
#if NUM_DIR_LIGHT_SHADOWS > 0
uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ]; uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
#endif
#include <fog_pars_vertex>
float h1( float n ) { return fract( sin( n ) * 43758.5453 ); }
void main() {
  float t = position.y, sw = aB.y, br = aB.z, lush = iB.x, dry = iB.y, wild = iB.z, flw = iB.w;
  float dist = length( iP.xz - uFoc.xz ), far = smoothstep( uR0, uR1, dist ), dens = 1. - far * .8;
  float keep = smoothstep( dens + .02, dens - .07, iP.w ) * ( 1. - smoothstep( uR1 + 3., uR1 + 12., dist ) ), comp = 1. + far * .4;
  float isFl = aB.w * step( h1( iA.w * 91.7 ), flw );
  float hgt = iA.y * ( .3 + .42 * wild + .08 * lush - .08 * dry ) * ( .62 + .76 * br ) * comp;
  if ( aB.w > .5 ) hgt = iA.y * ( .3 + .22 * wild + .06 * br ) * comp * isFl;
  hgt *= keep;
  float wdt = iA.z * ( .03 + .012 * lush + .006 * dry ) * ( aB.w > .5 ? .5 : 1. ) * comp;
  float ang = aB.x + iA.x; vec2 dir = vec2( cos( ang ), sin( ang ) ), perp = vec2( -dir.y, dir.x );
  float lean = ( .2 + .5 * br ) * ( 1. + wild * .5 ) * ( aB.w > .5 ? .3 : 1. );
  vec3 root = vec3( iP.x + position.x, iP.y, iP.z + position.z ), p = root; float tt = t * t;
  float gust = sin( uT * .8 + root.x * .06 + root.z * .045 ) * .5 + .5;
  float w = ( sin( uT * 2.1 + root.x * .6 + root.z * .45 + br * 3. ) * .3 + sin( uT * 4.7 + root.x * 1.3 + root.z * .2 ) * .1 + gust * gust * .75 ) * uWind;
  vec2 pd = root.xz - uPl.xz; float pdl = length( pd ), push = ( 1. - smoothstep( .1, .7, pdl ) ) * ( 1. - step( 1.2, abs( root.y - uPl.y ) ) );
  p.y += hgt * t * ( 1. - .3 * tt * lean - .5 * push * t );
  p.xz += dir * hgt * lean * tt * .65 + perp * sw * wdt;
  p.xz += vec2( .8, .45 ) * w * hgt * tt * .55 + ( pdl > .001 ? pd / pdl : vec2( 0. ) ) * push * hgt * tt * .8;
  vec4 wp = modelMatrix * vec4( p, 1. ); vWP = wp.xyz; vH = t;
  vec3 base = mix( vec3( .07, .17, .035 ), vec3( .04, .13, .025 ), lush ), tip = mix( vec3( .2, .47, .085 ), vec3( .11, .36, .05 ), lush );
  tip = mix( tip, vec3( .52, .45, .16 ), dry * .9 ); base = mix( base, vec3( .14, .12, .04 ), dry * .6 );
  tip *= .82 + .36 * h1( br * 17.3 + iA.w ); tip.r += ( h1( iA.w * 3.1 + br ) - .5 ) * .05 * ( 1. + dry );
  vec3 col = mix( base, tip, pow( t, .75 ) );
  if ( aB.w < .5 && wild > .3 && br > .55 && t > .8 ) col = mix( col, vec3( .52, .44, .22 ) * ( .8 + .4 * h1( iA.w ) ), wild * .85 );
  vFl = 0.;
  if ( aB.w > .5 && t > .82 ) { float c = h1( iA.w * 13.1 ); vec3 fc = c < .3 ? vec3( .95, .93, .85 ) : c < .5 ? vec3( .98, .78, .08 ) : c < .65 ? vec3( .55, .25, .85 ) : c < .8 ? vec3( .95, .45, .65 ) : c < .9 ? vec3( .25, .4, .95 ) : vec3( .9, .1, .05 ); col = fc * mix( .7, 1., h1( iA.w * 7.7 ) ); vFl = 1.; }
  vC = col;
  vSh = 1.;
  #if NUM_DIR_LIGHT_SHADOWS > 0
  { vec4 sc = directionalShadowMatrix[ 0 ] * wp; vec3 c = sc.xyz / sc.w; if ( c.x > 0. && c.x < 1. && c.y > 0. && c.y < 1. && c.z < 1. ) { float s = 0.; for ( int i = 0; i < 4; i ++ ) { vec2 o = vec2( i == 0 || i == 3 ? -.0006 : .0006, i < 2 ? -.0006 : .0006 ); s += step( c.z - .0025, unpackRGBAToDepth( texture2D( directionalShadowMap[ 0 ], c.xy + o ) ) ); } vSh = s * .25; } }
  #endif
  vVD = cameraPosition - wp.xyz;
  vec2 cd = wp.xz - uCC.xz; float ca = dot( cd, uCF ), cl = cd.x * uCF.y - cd.y * uCF.x; wp.y -= uCurve * ( ca * ca + .3 * cl * cl );
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const FS = `uniform vec3 uSunL, uAmbL, uSunDir; uniform sampler2D uCloudTex; uniform vec2 uCloudOff; uniform float uCloudAmt, uWet;
varying vec3 vC; varying float vH, vSh, vFl; varying vec3 vWP, vVD;
#include <fog_pars_fragment>
void main() {
  vec3 alb = vC * mix( .55, 1., pow( vH, .7 ) ) * ( 1. - uWet * .22 );
  float cl = 1. - uCloudAmt * smoothstep( .42, .75, texture2D( uCloudTex, vWP.xz * .016 + uCloudOff ).r );
  vec3 sun = uSunL * cl * vSh, V = normalize( vVD );
  vec3 c = alb * ( sun * ( .3 + .7 * max( uSunDir.y, 0. ) ) * mix( .5, 1., vH ) + uAmbL * mix( .45, 1., vH ) );
  c += alb * sun * ( pow( max( dot( -V, uSunDir ), 0. ), 4. ) * 1.5 + .1 ) * vH * ( 1. - vFl * .7 );
  c += sun * pow( vH, 3. ) * .02 * ( 1. + uWet * 3. ) * ( 1. - vFl );
  gl_FragColor = vec4( pow( max( c, vec3( 0. ) ), vec3( 1. / 2.2 ) ), 1. );
  #include <fog_fragment>
}`;
  const GR = G.grass = { ch: new Map(), q: [], map: null, rev: -1, t: 0, R0: 26, R1: 60 };
  G.on('init', scene => {
    const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, THREE.UniformsLib.lights, { uT: { value: 0 }, uR0: { value: 26 }, uR1: { value: 60 }, uFoc: { value: new THREE.Vector3() }, uPl: { value: new THREE.Vector3(0, -99, 0) }, uSunL: { value: new THREE.Vector3() }, uAmbL: { value: new THREE.Vector3() } }]);
    U.uCurve = G.U.curve; U.uCC = G.U.cc; U.uCF = G.U.cf; U.uCloudTex = G.U.cloudTex; U.uCloudOff = G.U.cloudOff; U.uCloudAmt = G.U.cloudAmt;
    if (G.SU) { U.uSunDir = G.SU.uSunDir; U.uWind = G.SU.uWind; U.uWet = G.SU.uWet; } else { U.uSunDir = { value: new THREE.Vector3(0, 1, 0) }; U.uWind = { value: 1 }; U.uWet = { value: 0 }; }
    GR.U = U; GR.mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, fog: true, lights: true, side: THREE.DoubleSide });
    GR.base = tuftGeo(); GR.group = new THREE.Group(); scene.add(GR.group);
  });
  function drop(key) { const c = GR.ch.get(key); if (!c) return; if (c.mesh) { GR.group.remove(c.mesh); c.mesh.geometry.dispose(); } GR.ch.delete(key); }
  function dropAll() { for (const k of [...GR.ch.keys()]) drop(k); GR.q = []; }
  function build(m, kx, kz) {
    const x0 = kx * CS, z0 = kz * CS, x1 = Math.min(m.W, x0 + CS), z1 = Math.min(m.H, z0 + CS), D = BIO.data, dP = BIO.dP, items = [];
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      const i = z * m.W + x, s = m.surf[i]; if (m.water[i] || m.ramp[i] || !(s === 0 || s === 1 || s === 14)) continue; const o = m.objAt(x, z); if (o && (G.OBJ[o.t].h > .3 || G.OBJ[o.t].enter)) continue;
      const lush = D[i * 4] / 255, dry = D[i * 4 + 1] / 255, wild = D[i * 4 + 2] / 255, fl = D[i * 4 + 3] / 255, lawn = 1 - sm(1.2, 3.5, dP[i]);
      const k = 4 + (lush > .5 ? 1 : 0) - (dry > .65 ? 1 : 0) + (G.hash2(x, z, 11) < .4 ? 1 : 0) - (s === 1 ? 1 : 0);
      for (let j = 0; j < k; j++) { const rx = x + G.hash2(x, z, 20 + j), rz = z + G.hash2(z, x, 40 + j), h = (q) => G.hash2(x * 7 + j, z * 3 + q, 60);
        items.push([rx, m.terrainH(rx, rz) - .02, rz, h(1), h(2) * TAU, (.75 + .5 * h(3)) * (1 - lawn * .35), .8 + .4 * h(4), h(5) * 100,
          G.clamp(lush + (h(6) - .5) * .15, 0, 1), G.clamp(dry + (h(7) - .5) * .15, 0, 1), wild, fl]); } }
    items.sort((a, b) => a[3] - b[3]);
    const n = items.length, A = [new Float32Array(Math.max(1, n) * 4), new Float32Array(Math.max(1, n) * 4), new Float32Array(Math.max(1, n) * 4)];
    items.forEach((it, q) => { for (let c = 0; c < 12; c++) A[c >> 2][q * 4 + (c & 3)] = it[c]; });
    const key = kz * 4096 + kx; drop(key); if (!n) { GR.ch.set(key, { mesh: null, n: 0, kx, kz, rev: m.rev }); return; }
    const g = new THREE.InstancedBufferGeometry(); g.index = GR.base.index; g.setAttribute('position', GR.base.attributes.position); g.setAttribute('aB', GR.base.attributes.aB);
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(A[0], 4)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(A[1], 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(A[2], 4)); g.instanceCount = n;
    const mesh = new THREE.Mesh(g, GR.mat); mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; GR.group.add(mesh);
    GR.ch.set(key, { mesh, n, kx, kz, rev: m.rev });
  }
  G.on('frame', dt => {
    const m = G.map, p = G.player; if (!GR.mat || !m || !p) return;
    const on = !m.interior && G.settings.quality !== 'low' && G.settings.grass !== false; GR.group.visible = on; if (!on) return;
    if (GR.map !== m) { dropAll(); GR.map = m; buildBio(m); GR.rev = m.rev; }
    if ((BIO.t -= dt) < 0 && (m.tRev || 0) !== BIO.trev) { BIO.t = 2; buildBio(m); for (const c of GR.ch.values()) c.rev = -1; }
    const mouse = G.mouseMode && G.mouseMode(), fx = G.cam.cx || p.x, fz = G.cam.cz || p.z, R1 = mouse ? 68 : 58, R0 = mouse ? 30 : 24, RB = R1 + 14;
    const U = GR.U; U.uT.value += dt; U.uR0.value = R0; U.uR1.value = R1; U.uFoc.value.set(fx, 0, fz); U.uPl.value.set(p.x, p.y, p.z);
    // blocs à (re)construire : les plus proches d'abord, quelques-uns par image
    if (m.rev !== GR.rev) { GR.rev = m.rev; const px = Math.floor(p.x / CS), pz = Math.floor(p.z / CS); for (const c of GR.ch.values()) if (Math.abs(c.kx - px) <= 1 && Math.abs(c.kz - pz) <= 1) c.rev = -1; }
    if ((GR.t -= dt) < 0) { GR.t = .25; const k0x = Math.floor((fx - RB) / CS), k1x = Math.floor((fx + RB) / CS), k0z = Math.floor((fz - RB) / CS), k1z = Math.floor((fz + RB) / CS), q = [];
      for (let kz = Math.max(0, k0z); kz <= Math.min(Math.ceil(m.H / CS) - 1, k1z); kz++) for (let kx = Math.max(0, k0x); kx <= Math.min(Math.ceil(m.W / CS) - 1, k1x); kx++) {
        const d = Math.hypot((kx + .5) * CS - fx, (kz + .5) * CS - fz); if (d > RB + CS * .7) continue; const c = GR.ch.get(kz * 4096 + kx); if (!c || c.rev === -1) q.push([d, kx, kz]); }
      q.sort((a, b) => a[0] - b[0]); GR.q = q;
      for (const [key, c] of GR.ch) if (Math.hypot((c.kx + .5) * CS - fx, (c.kz + .5) * CS - fz) > RB + 30) drop(key); }
    for (let i = 0; i < 3 && GR.q.length; i++) { const [, kx, kz] = GR.q.shift(); build(m, kx, kz); }
    // dessin : blocs dans le champ (cases de perf2.js), nombre de touffes selon la distance (elles sont triées par rang)
    const CV = m.cullV, cw8 = m._cw, ch8 = m._ch, R8 = CS / 8;
    for (const c of GR.ch.values()) { if (!c.mesh) continue; let v = true;
      if (CV && cw8) { v = false; for (let cz = c.kz * R8; cz < Math.min(ch8, c.kz * R8 + R8) && !v; cz++) for (let cx = c.kx * R8; cx < Math.min(cw8, c.kx * R8 + R8); cx++) if (CV[cz * cw8 + cx]) { v = true; break; } }
      const nx = G.clamp(fx, c.kx * CS, c.kx * CS + CS), nz = G.clamp(fz, c.kz * CS, c.kz * CS + CS), d = Math.hypot(nx - fx, nz - fz);
      if (d > R1 + 12) v = false; c.mesh.visible = v; if (v) { const dens = 1 - sm(R0, R1, d) * .8; c.mesh.geometry.instanceCount = Math.max(1, Math.min(c.n, Math.ceil(c.n * Math.min(1, dens + .03)))); } }
    const L = G.lights; if (L) { const lin = (c, k) => Math.pow(Math.max(0, c * k), 2.2), SK2 = G.SU ? G.SU.uSunK.value : 1.5, AK = G.SU ? G.SU.uAmbK.value : 1.2, sc = L.sun.color, hc = L.hemi.color, ai = L.amb.intensity;
      U.uSunL.value.set(lin(sc.r, L.sun.intensity), lin(sc.g, L.sun.intensity), lin(sc.b, L.sun.intensity)).multiplyScalar(SK2);
      U.uAmbL.value.set(Math.pow(hc.r * L.hemi.intensity + ai, 2.2), Math.pow(hc.g * L.hemi.intensity + ai, 2.2), Math.pow(hc.b * L.hemi.intensity + ai, 2.2)).multiplyScalar(AK); }
    U.fogColor.value.copy(G.scene.fog.color); U.fogNear.value = G.scene.fog.near; U.fogFar.value = G.scene.fog.far;
  });
  G.on('enterMap', m => { if (!m.interior && BIO.map !== m) buildBio(m); });
})();
