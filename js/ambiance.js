'use strict';
// ===== Ambiance : herbe en 3D qui ondule, aurores boréales, étoiles filantes (vœux), feuilles et pétales qui tombent, halos des lampes, rendu cinéma =====
(function () {
  const TAU = Math.PI * 2, A = G.amb2 = { t: 0 };
  const CURVE = 'vec2 cd = wp.xz - uCC.xz; float ca = dot(cd, uCF); float cl = cd.x * uCF.y - cd.y * uCF.x; wp.y -= uCurve * (ca * ca + .3 * cl * cl);';
  // ---------- herbe ----------
  function grassGeo() { const pos = [], col = [], base = new THREE.Color(0x3d8a35), tip = new THREE.Color(0x9adf6e), tip2 = new THREE.Color(0xc4ec8a);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI + .3, c = Math.cos(a), s = Math.sin(a), w = .055 + (k % 2) * .015, h = .32 + (k % 3) * .09, lx = Math.sin(a * 3) * .08, lz = Math.cos(a * 2) * .08, ox = Math.cos(k * 2.1) * .12, oz = Math.sin(k * 2.1) * .12;
      pos.push(ox - c * w, 0, oz - s * w, ox + c * w, 0, oz + s * w, ox + lx, h, oz + lz); const t = k === 2 ? tip2 : tip; col.push(base.r, base.g, base.b, base.r, base.g, base.b, t.r, t.g, t.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('gc', new THREE.Float32BufferAttribute(col, 3)); return g; }
  const GR = { N: 6000, cx: 1e9, cz: 1e9, map: null, t: 0 };
  G.on('init', scene => {
    const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } }]); U.uCurve = G.U.curve; U.uCC = G.U.cc; U.uCF = G.U.cf; GR.U = U;
    const mat = new THREE.ShaderMaterial({ uniforms: U, fog: true, side: THREE.DoubleSide,
      vertexShader: 'attribute vec3 gc; uniform float uT, uCurve; uniform vec3 uCC; uniform vec2 uCF; varying vec3 vC;\n#include <fog_pars_vertex>\nvoid main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); float h = position.y; float sw = sin(uT * 1.7 + wp.x * .35 + wp.z * .27) * .1 + sin(uT * 3.3 + wp.x * .9 + wp.z * .4) * .035; wp.x += sw * h * 2.2; wp.z += sw * h * 1.2; ' + CURVE + ' vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; vC = gc;\n#include <fog_vertex>\n}',
      fragmentShader: 'uniform vec3 uTint; varying vec3 vC;\n#include <fog_pars_fragment>\nvoid main(){ gl_FragColor = vec4(vC * uTint, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}' });
    const m = new THREE.InstancedMesh(grassGeo(), mat, GR.N); m.count = 0; m.frustumCulled = false; m.renderOrder = 0; scene.add(m); GR.mesh = m;
  });
  const SC = new THREE.Color(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  function buildGrass(m, px, pz) {
    const R = 17, x0 = Math.max(0, Math.floor(px) - R), x1 = Math.min(m.W - 1, Math.floor(px) + R), z0 = Math.max(0, Math.floor(pz) - R), z1 = Math.min(m.H - 1, Math.floor(pz) + R); let n = 0;
    for (let z = z0; z <= z1 && n < GR.N; z++) for (let x = x0; x <= x1 && n < GR.N; x++) {
      const i = m.idx(x, z), s = m.surf[i]; if (m.water[i] || m.ramp[i] || !(s === 0 || s === 1 || s === 14)) continue; const o = m.objAt(x, z); if (o && (G.OBJ[o.t].h > .3 || G.OBJ[o.t].enter)) continue;
      if ((x - px) * (x - px) + (z - pz) * (z - pz) > R * R) continue; const k = 3 + (G.hash2(x, z, 11) < .4 ? 1 : 0);
      for (let j = 0; j < k && n < GR.N; j++) { const rx = x + G.hash2(x, z, 20 + j), rz = z + G.hash2(z, x, 40 + j), sc = .7 + G.hash2(x + j, z, 60) * .7;
        V.set(rx, m.terrainH(rx, rz) - .02, rz); Q.setFromAxisAngle(Y, G.hash2(x, z + j, 80) * TAU); S.set(sc, sc * (s === 1 ? 1.25 : 1), sc); M4.compose(V, Q, S); GR.mesh.setMatrixAt(n++, M4); } }
    GR.mesh.count = n; GR.mesh.instanceMatrix.needsUpdate = true; GR.cx = px; GR.cz = pz; GR.map = m; GR.rev = m.rev;
  }
  // ---------- aurores ----------
  G.on('init', scene => {
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT, uA; varying vec2 vUv; float h1(float x){ return fract(sin(x * 12.9898) * 43758.5453); } float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.), f * f * (3. - 2. * f)); }\nvoid main(){ float x = vUv.x * 16.; float band = n1(x + uT * .12) * .6 + n1(x * 2.3 - uT * .2) * .4; float cur = pow(sin(vUv.x * 70. + n1(x * .5 + uT * .08) * 7.) * .5 + .5, 2.5) * .6 + .4; float y = vUv.y; float edge = smoothstep(0., .22, y) * (1. - smoothstep(.45 + band * .4, 1., y)); vec3 c = mix(vec3(.15, 1., .55), vec3(.6, .35, 1.), smoothstep(.35, .95, y)); gl_FragColor = vec4(c, edge * cur * uA * (.5 + band * .5)); }' });
    const g = new THREE.CylinderGeometry(300, 300, 150, 64, 1, true, Math.PI - 1.1, 2.2), mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -9; mesh.visible = false; scene.add(mesh); A.aurora = mesh;
    // étoiles filantes
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const lm = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
    A.star = new THREE.Line(lg, lm); A.star.frustumCulled = false; A.star.renderOrder = -8; scene.add(A.star); A.starT = 8;
    // halos des lampes
    const c = G.cv(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,170,.9)'); gr.addColorStop(.25, 'rgba(255,200,120,.35)'); gr.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); A.halos = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.visible = false; s.renderOrder = 7; scene.add(s); A.halos.push(s); }
  });
  const auroraNight = d => G.hash2(d, 7, 31) < .45;
  // ---------- éclats d'étoile (vœux) ----------
  G.MODELS.eclat = v => { const b = G.mb(250); b.add(new THREE.OctahedronGeometry(.16, 0), 0xfff3a0, b.M(0, .2, 0, 0, .4, 0, 1, 1.3, 1), 1); b.add(new THREE.OctahedronGeometry(.09, 0), 0xffd0f0, b.M(.15, .1, .08, .5, 0, .3), 1); return b.done(); };
  G.OBJ.eclat_etoile = { id: 'eclat_etoile', n: 'Éclat d\'étoile', model: 'eclat', v: 0, fp: [1, 1], h: 0, pick: 'eclat_etoile' };
  G.ITEMS.eclat_etoile = { id: 'eclat_etoile', n: 'Éclat d\'étoile', kind: 'res', ico: '⭐', sell: 400, cat: 'ressources', stack: 99, desc: 'Tombé du ciel après un vœu. Joli, et Gaston le rachète bien !' };
  G.on('newDay', () => { const w = G.flags.wishes || 0; G.flags.wishes = 0; if (!w || !G.world) return; const m = G.world, r = Math.random; let n = 0;
    for (let t = 0; t < 400 && n < Math.min(8, w * 2); t++) { const x = 3 + Math.floor(r() * (m.W - 6)), z = 3 + Math.floor(r() * (m.H - 6)), i = m.idx(x, z); if (m.surf[i] === 5 && m.canPlace('eclat_etoile', x, z)) { m.addObj('eclat_etoile', x, z); n++; } }
    if (n) setTimeout(() => G.ui.toast('✨ Des éclats d\'étoile sont tombés sur la plage cette nuit !'), 1500); });
  // ---------- boucle ----------
  const leafCol = { tree_cherry: [0xffb5cf, 0xffd0e0, 0xff9fc0], tree_oak: [0x6cc458, 0xa8d65a, 0xe8c040], tree_birch: [0xb8e07a, 0xe8d860], tree_fruit: [0x63bf55, 0x8fcf5a] };
  let trees = [], treeT = 0, haloT = 0;
  G.on('update', dt => {
    const m = G.map, p = G.player; if (!m || !p) return; A.t += dt; const out = !m.interior, sky = G.skyInfo || { n: 0, h: 12 }, n = sky.n || 0;
    // feuilles et pétales
    if (out && (treeT -= dt) < 0) { treeT = 2; trees = []; for (const o of m.list) { const d = G.OBJ[o.t]; if (d.chop >= 3 && leafCol[d.model] && Math.abs(o.x - p.x) < 22 && Math.abs(o.z - p.z) < 22) trees.push(o); } }
    if (out && trees.length && Math.random() < dt * (3 + trees.length * .08)) { const o = trees[Math.floor(Math.random() * trees.length)], d = G.OBJ[o.t], cols = leafCol[d.model], [cx, cz] = m.center(o), a = Math.random() * TAU, r = Math.random() * .9;
      G.fx.one(cx + Math.cos(a) * r, o.y + 2.0 + Math.random() * .9, cz + Math.sin(a) * r, .25 + Math.random() * .3, -.15, (Math.random() - .5) * .4, 3.5 + Math.random() * 2, .22, cols[Math.floor(Math.random() * cols.length)], .11, 0); }
    // étoile filante
    const night = out && (sky.h >= 20.5 || sky.h < 4.5); A.starT -= dt;
    if (night && A.starT < 0 && G.state === 'play') { A.starT = 7 + Math.random() * 12; const cam = G.camera.position, a = G.cam.yaw + (Math.random() - .5) * 1.4, d = 330, y = 120 + Math.random() * 90;
      A.ss = { t: 0, p: new THREE.Vector3(cam.x - Math.sin(a) * d, cam.y + y, cam.z - Math.cos(a) * d), v: new THREE.Vector3((Math.random() < .5 ? -1 : 1) * (90 + Math.random() * 60), -40 - Math.random() * 30, (Math.random() - .5) * 40) };
      A.wishUntil = performance.now() + 2200; G.ui.toast('✨ Une étoile filante ! Appuie vite sur E pour faire un vœu…'); }
    if (A.ss) { const s = A.ss; s.t += dt; const head = s.p.clone().addScaledVector(s.v, s.t), tail = s.p.clone().addScaledVector(s.v, Math.max(0, s.t - .22)); const at = A.star.geometry.attributes.position; at.setXYZ(0, head.x, head.y, head.z); at.setXYZ(1, tail.x, tail.y, tail.z); at.needsUpdate = true;
      A.star.material.opacity = Math.max(0, 1 - s.t / .9); if (s.t > .9) { A.ss = null; A.star.material.opacity = 0; } }
    if (A.wishUntil && performance.now() < A.wishUntil && G.input.hit('KeyE')) { A.wishUntil = 0; G.flags.wishes = (G.flags.wishes || 0) + 1; G.sfx('craft'); G.fx.burst(p.x, p.y + 1.6, p.z, 18, [0xfff3a0, 0xffffff, 0xd9b8ff], 2, 1, -1); G.ui.toast('🌠 Tu as fait un vœu ! (' + G.flags.wishes + ' cette nuit)'); }
    // aurores
    const showA = out && n > .55 && auroraNight(G.clock.day) && G.settings.quality !== 'low'; A.aurora.visible = showA; if (showA) { A.aurora.position.copy(G.camera.position); A.aurora.position.y += 95; A.aurora.material.uniforms.uT.value = A.t; A.aurora.material.uniforms.uA.value = Math.min(1, (n - .55) * 2.5); }
    // halos des lampes
    if ((haloT -= dt) < 0) { haloT = .4; let k = 0; if (out && n > .2) { const near = []; for (const o of m.lights) { if (o.off) continue; const [cx, cz] = m.center(o), d = Math.hypot(cx - p.x, cz - p.z); if (d < 40) near.push([d, o, cx, cz]); } near.sort((a, b) => a[0] - b[0]);
        for (const [d, o, cx, cz] of near) { if (k >= A.halos.length) break; const def = G.OBJ[o.t], s = A.halos[k++], tall = def.h > 1.5; s.position.set(cx, o.y + (o.t === 'grande_fontaine' ? 1.0 : tall ? 2.47 : def.fire ? .55 : .85), cz); const sc = (tall ? 2.2 : 1.3) * (def.fire ? 1.3 : 1); s.scale.set(sc, sc, 1); s.material.opacity = Math.min(1, n * 1.3) * (def.fire ? .9 : .75); s.visible = true; } }
      for (; k < A.halos.length; k++) A.halos[k].visible = false; }
  });
  G.on('frame', dt => {
    const m = G.map, p = G.player; if (!GR.mesh || !m || !p) return; const on = !m.interior && G.settings.quality !== 'low' && G.settings.grass !== false; GR.mesh.visible = on; if (!on) return;
    GR.U.uT.value += dt; if (GR.map !== m || Math.abs(p.x - GR.cx) > 4 || Math.abs(p.z - GR.cz) > 4 || ((GR.t -= dt) < 0 && GR.rev !== m.rev)) { GR.t = 1.5; buildGrass(m, p.x, p.z); }
    const L = G.lights, si = G.skyInfo; if (L) { const t = GR.U.uTint.value; t.copy(L.hemi.color).multiplyScalar(L.hemi.intensity * .95); SC.copy(L.sun.color).multiplyScalar(L.sun.intensity * .55); t.add(SC); t.r = G.clamp(t.r * 1.15, .34, 1.25); t.g = G.clamp(t.g * 1.15, .4, 1.25); t.b = G.clamp(t.b * 1.15, .55, 1.25); }
    GR.U.fogColor.value.copy(G.scene.fog.color); GR.U.fogNear.value = G.scene.fog.near; GR.U.fogFar.value = G.scene.fog.far;
  });
})();
