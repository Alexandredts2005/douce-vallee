'use strict';
// ===== Ambiance (l'herbe 3D est dans herbe.js) : aurores boréales, étoiles filantes (vœux), feuilles et pétales qui tombent, halos des lampes, rendu cinéma =====
(function () {
  const TAU = Math.PI * 2, A = G.amb2 = { t: 0 };
  const CURVE = 'vec2 cd = wp.xz - uCC.xz; float ca = dot(cd, uCF); float cl = cd.x * uCF.y - cd.y * uCF.x; wp.y -= uCurve * (ca * ca + .3 * cl * cl);';
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
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
    const c = G.cv(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,170,.45)'); gr.addColorStop(.25, 'rgba(255,200,120,.16)'); gr.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); A.halos = []; for (let i = 0; i < 96; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.visible = false; s.renderOrder = 7; scene.add(s); A.halos.push(s); }
    // rendu cinéma (contraste doux, hautes lumières maîtrisées)
    if (G.settings.cine === true) { G.renderer.toneMapping = THREE.ACESFilmicToneMapping; G.renderer.toneMappingExposure = 1.35; }
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
    if (!G.leafFall && out && trees.length && Math.random() < dt * (3 + trees.length * .08)) { const o = trees[Math.floor(Math.random() * trees.length)], d = G.OBJ[o.t], cols = leafCol[d.model], [cx, cz] = m.center(o), a = Math.random() * TAU, r = Math.random() * .9;
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
    if ((haloT -= dt) < 0) { haloT = .4; let k = 0; if (out && n > .2) { const near = []; for (const o of m.lights) { if (o.off) continue; const [cx, cz] = m.center(o), d = Math.hypot(cx - p.x, cz - p.z); if (d < 170) near.push([d, o, cx, cz]); } near.sort((a, b) => a[0] - b[0]);
        for (const [d, o, cx, cz] of near) { if (k >= A.halos.length) break; const def = G.OBJ[o.t], s = A.halos[k++], tall = def.h > 1.5; s.position.set(cx, o.y + (o.t === 'grande_fontaine' ? 1.0 : tall ? 2.47 : def.fire ? .55 : .85), cz); const sc = (tall ? 2.2 : 1.3) * (def.fire ? 1.3 : 1); s.scale.set(sc, sc, 1); s.material.opacity = Math.min(1, n * 1.3) * (def.fire ? .9 : .75); s.visible = true; } }
      for (; k < A.halos.length; k++) A.halos[k].visible = false; }
  });
  const LP = { t: 0 };
  G.on('init', scene => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(.35, 'rgba(255,190,120,.55)'); g.addColorStop(1, 'rgba(255,170,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    LP.mat = G.curveMat(new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    LP.mesh = new THREE.InstancedMesh(geo, LP.mat, 800); LP.mesh.count = 0; LP.mesh.frustumCulled = false; LP.mesh.renderOrder = 1; scene.add(LP.mesh); });
  G.on('frame', dt => { const m = G.map; if (!LP.mesh || !m) return; const n = G.night ? G.night() : 0, on = !m.interior && n > .15; LP.mesh.visible = on; if (!on) return; LP.mat.opacity = Math.min(1, (n - .15) * 2) * .65;
    if ((LP.t -= dt) > 0 && LP.map === m && LP.rev === m.rev) return; LP.t = 1; LP.map = m; LP.rev = m.rev; let k = 0;
    for (const o of m.lights) { if (o.off || k >= 800) continue; const d = G.OBJ[o.t], [cx, cz] = m.center(o), r = d.h > 1.5 ? 7.5 : d.fire ? 5 : 3.8; V.set(cx, (o.dk != null ? o.y : m.terrainH(cx, cz)) + .05, cz); Q.identity(); S.set(r, 1, r); M4.compose(V, Q, S); LP.mesh.setMatrixAt(k++, M4); }
    LP.mesh.count = k; LP.mesh.instanceMatrix.needsUpdate = true; });
})();
