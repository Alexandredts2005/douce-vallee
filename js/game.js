'use strict';
// ===== Boucle de jeu : rendu, caméra façon village, cycle jour/nuit, nuages, lampes, intérieurs, sauvegarde =====
(function () {
  const $ = G.el, T = G.TIER;
  let renderer, scene, camera, hemi, sun, amb, sky, skyMat, stars, sunM, moonM, clouds = [], seaG = null, lamps = [], roomLight, lampT = 0, autoT = 0;
  G.clock = { min: 8 * 60, day: 1 }; G.interiors = {}; G.state = 'loading'; G.playerName = 'Pomme'; G.villageName = 'Douce Vallée'; G.mode = 'creatif';
  G.cam = { yaw: 0, tyaw: 0, dist: 13, tdist: 13, pitch: .72, boost: 0, sh: 0, orbit: 0, shake(a) { this.sh = Math.max(this.sh, a); } };
  // ---------- ciel : dégradé, soleil, lune, étoiles ----------
  const SKY = [ // heure, haut, horizon, lumière, intensité, ciel hémi, sol hémi, intensité hémi
    [0, 0x0a1030, 0x1c2550, 0x7c8cd6, .36, 0x34407a, 0x1c2438, .45], [4.6, 0x0f1840, 0x2a3164, 0x8a92d0, .36, 0x3a4680, 0x1e2638, .48],
    [5.6, 0x3b4c8e, 0xf5a07e, 0xffb088, .75, 0x9aa0d0, 0x6a5a50, .75], [7, 0x5fb0f0, 0xffdcb4, 0xfff0d8, 1.25, 0xcfe6ff, 0x8a8a60, .85],
    [9, 0x4aa3ee, 0xa6dbff, 0xffffff, 1.45, 0xd8ecff, 0x8f9a6a, .95], [16, 0x4aa3ee, 0xaee0ff, 0xfff8ec, 1.4, 0xd8ecff, 0x8f9a6a, .95],
    [18, 0x6d8fd2, 0xffc890, 0xffcf96, 1.15, 0xe0d0d8, 0x8a7a60, .85], [19.3, 0x4b4a92, 0xff8f72, 0xff9a70, .85, 0xb090b8, 0x5a4a50, .75],
    [20.5, 0x1b2152, 0x4d3b72, 0x9a90d8, .45, 0x4a4a88, 0x262838, .55], [22, 0x0a1030, 0x1c2550, 0x7c8cd6, .36, 0x34407a, 0x1c2438, .45], [24, 0x0a1030, 0x1c2550, 0x7c8cd6, .36, 0x34407a, 0x1c2438, .45]];
  const cA = new THREE.Color(), cB = new THREE.Color(), cTop = new THREE.Color(), cHor = new THREE.Color(), cLight = new THREE.Color(), cHs = new THREE.Color(), cHg = new THREE.Color();
  function skyAt(h) { let k = 0; while (k < SKY.length - 2 && SKY[k + 1][0] <= h) k++; const a = SKY[k], b = SKY[k + 1], t = G.smooth(G.clamp((h - a[0]) / (b[0] - a[0]), 0, 1));
    const mix = (out, i) => out.set(a[i]).lerp(cB.set(b[i]), t); mix(cTop, 1); mix(cHor, 2); mix(cLight, 3); mix(cHs, 5); mix(cHg, 6); return [G.lerp(a[4], b[4], t), G.lerp(a[7], b[7], t)]; }
  G.night = () => { const h = G.clock.min / 60; return h >= 21 || h < 4.5 ? 1 : h < 6.5 ? 1 - (h - 4.5) / 2 : h > 18.5 ? (h - 18.5) / 2.5 : 0; };
  function makeSky() {
    skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top,hor; varying vec3 vP; void main(){ float h=vP.y; vec3 c=h>0.?mix(hor,top,pow(min(1.,h*1.7),.75)):mix(hor,hor*.8,min(1.,-h*4.)); gl_FragColor=vec4(c,1.); }' });
    sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 12), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    const sp = []; const r = G.rng(77); for (let i = 0; i < 700; i++) { const a = r() * Math.PI * 2, e = Math.asin(.08 + r() * .92); sp.push(Math.cos(a) * Math.cos(e) * 400, Math.sin(e) * 400, Math.sin(a) * Math.cos(e) * 400); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); stars.frustumCulled = false; scene.add(stars);
    sunM = new THREE.Mesh(new THREE.CircleGeometry(16, 24), new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false, transparent: true, opacity: .95 })); moonM = new THREE.Mesh(new THREE.CircleGeometry(10, 24), new THREE.MeshBasicMaterial({ color: 0xf4f1ff, fog: false, transparent: true }));
    [sunM, moonM].forEach(m => { m.frustumCulled = false; scene.add(m); });
  }
  // ---------- nuages, mer et horizon ----------
  function makeClouds() { const r = G.rng(5); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(G.getGeo('cloud', i % 6), G.M.cloud); m.frustumCulled = false; m.userData = { s: .5 + r() * .7 }; const s = .8 + r() * .9; m.scale.set(s, s * .8, s); clouds.push(m); scene.add(m); } }
  function placeClouds(m) { const r = G.rng(9); clouds.forEach(c => c.position.set(-30 + r() * (m.W + 60), 22 + r() * 10, -40 + r() * (m.H + 30))); }
  function makeSea(m) {
    if (seaG) { scene.remove(seaG); seaG.traverse(c => c.geometry && c.geometry.dispose()); }
    seaG = new THREE.Group(); seaG.userData.map = m; const W = m.W, H = m.H, sz = m.meta.seaZ || H - G.SEA, L = 3 * T, F = 420;
    const quad = (pts, y, mat, col, uvs) => { const g = new THREE.BufferGeometry(), p = [], c = [], u = []; for (const [x0, z0, x1, z1] of pts) { const v = [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]; for (const [x, z] of v) { p.push(x, y, z); c.push(col[0], col[1], col[2]); u.push(x * .3, z * .3); } }
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.computeVertexNormals(); const me = new THREE.Mesh(g, mat); me.frustumCulled = false; me.receiveShadow = true; seaG.add(me); };
    const isl = m.meta.island, seaR = isl ? [[-F, -F, W + F, 0], [-F, H, W + F, H + F], [-F, 0, 0, H], [W, 0, W + F, H]] : [[-F, H, W + F, H + F], [-F, sz, 0, H], [W, sz, W + F, H]];
    quad(seaR, G.WS, G.M.water, [.34, .6, .82]); quad(seaR, -1.8, G.M.std, [.16, .36, .48]);
    if (!isl) quad([[-F, -F, 0, sz], [W, -F, W + F, sz], [0, -F, W, 0]], L, G.M.std, [.3, .58, .3]);
    scene.add(seaG);
  }
  // ---------- lampes (pool fixe pour éviter les recompilations) ----------
  function makeLamps() { for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffc27a, 0, 11, 1.3); scene.add(l); lamps.push(l); } roomLight = new THREE.PointLight(0xffe2b0, 0, 16, 1.2); scene.add(roomLight); }
  function updLamps(dt, n) {
    lampT -= dt; const m = G.map, p = G.player; if (!m || !p) return;
    if (lampT < 0) { lampT = .5; const near = [];
      let lit = 0; for (const o of m.lights) { if (o.off) continue; lit++; const [cx, cz] = m.center(o), d = Math.hypot(cx - p.x, cz - p.z); if (d < 32) near.push([d, o, cx, cz]); }
      near.sort((a, b) => a[0] - b[0]); lamps.forEach((l, i) => { const e = near[i]; l.userData.o = e ? e[1] : null; if (e) l.position.set(e[2], e[1].y + (G.OBJ[e[1].t].h > 1.5 ? 2.3 : .9), e[3]); });
      roomLight.intensity = m.interior ? .4 + Math.min(1.2, lit * .3) : 0; }
    const on = m.interior ? 1.0 : n; lamps.forEach(l => { const o = l.userData.o; l.intensity = o ? on * (G.OBJ[o.t].fire ? 1.3 + Math.sin(performance.now() / 90 + l.id) * .15 : 1.5) : 0; });
  }
  G.lampRefresh = () => { lampT = 0; };
  G.setOutlines = mode => { if (mode === 'tout' && G.settings.quality === 'low') mode = 'perso'; G.M.outline.visible = mode !== 'aucun'; G.M.outlineI.visible = mode === 'tout'; for (const mp of [G.world, G.island, ...Object.values(G.interiors)]) if (mp) mp.objr.setOutlines(mode === 'tout'); };
  // ---------- rendu ----------
  G.setQuality = (q, shadow) => {
    if (!renderer) return; const dpr = window.devicePixelRatio || 1; renderer.setPixelRatio(q === 'low' ? Math.min(dpr, 1) * .8 : q === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1.4));
    const sm = q === 'high' ? 2048 : 1024; sun.castShadow = !!shadow && q !== 'low';
    if (sun.shadow.mapSize.x !== sm) { sun.shadow.mapSize.set(sm, sm); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    resize();
  };
  function resize() { if (!renderer) return; renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); G.U.pscale.value = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(camera.fov * Math.PI / 360)); }
  function init() {
    renderer = G.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    $('gl').appendChild(renderer.domElement); G.bindPointer(renderer.domElement);
    scene = G.scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xcdeeff, 45, 125);
    camera = G.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 900);
    G.makeTextures(); G.makeMaterials();
    hemi = new THREE.HemisphereLight(0xfff5e6, 0x8f9a6a, .85); scene.add(hemi); amb = new THREE.AmbientLight(0xffffff, .2); scene.add(amb);
    sun = new THREE.DirectionalLight(0xffeedd, 1.4); sun.castShadow = true; const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 140; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; sun.shadow.mapSize.set(1024, 1024); scene.add(sun); scene.add(sun.target);
    makeSky(); makeClouds(); makeLamps(); G.fx.init(scene); G.ents.init(scene);
    G.player = new G.Player({}); G.player.attach(scene); G.ui.buildHotbar();
    addEventListener('resize', resize); G.ui.applySettings(); resize();
    G.lights = { hemi, sun, amb, roomLight, lamps }; G.emit('init', scene);
  }
  // ---------- monde ----------
  function setWorld(m) {
    if (G.world) scene.remove(G.world.group); for (const id in G.interiors) scene.remove(G.interiors[id].group);
    G.interiors = {}; G.world = m; scene.add(m.group); m.buildAll(); G.ents.clear(); G.ents.spawnVillagers(m); makeSea(m); placeClouds(m); G.map = m; m.group.visible = true; G.ui.mmRev = -1;
  }
  G.enterMap = (m, x, z, yaw) => {
    if (G.map && G.map !== m) { G.map.group.visible = false; G.feat.clearFish(); }
    if (!m.group.parent) scene.add(m.group); m.group.visible = true; const outdoorChange = !m.interior && seaG && seaG.userData.map !== m; G.map = m;
    const inside = m.interior; sky.visible = stars.visible = sunM.visible = moonM.visible = !inside; if (outdoorChange) makeSea(m); seaG && (seaG.visible = !inside); clouds.forEach(c => c.visible = !inside);
    scene.background = inside ? new THREE.Color(0x24170f) : null; scene.fog.near = inside ? 200 : 45; scene.fog.far = inside ? 400 : 125;
    G.audio.setInside(inside); roomLight.intensity = inside ? .8 : 0; if (inside) roomLight.position.set(m.W / 2, 2.7, m.H / 2);
    G.player.teleport(x, z, yaw); G.cam.cx = 0; if (!G.mouseMode()) G.cam.yaw = G.cam.tyaw = 0; else G.cam.tyaw = G.cam.yaw = (yaw || 0) + Math.PI; G.ui.mmRev = -1; lampT = 0;
    if (inside) G.ui.toast(m.meta.title || 'Maison');
    G.emit('enterMap', m);
    if (inside && ['maison', 'villa', 'cabane', 'tente'].includes(m.kind) && !G.flags.decorHint) { G.flags.decorHint = 1; setTimeout(() => G.ui.toast('Astuce : appuie sur H pour changer le papier peint et le sol.'), 1500); }
  };
  // ---------- caméra ----------
  const TGT = new THREE.Vector3();
  function updCamera(dt) {
    const C = G.cam, I = G.input, p = G.player, m = G.map; if (!m) return;
    const playing = G.state === 'play' || G.state === 'pause', mouse = G.mouseMode() && playing, fp = mouse && G.settings.fp && !p.vehicle, sens = (G.settings.sens || 50) / 50 * .0026;
    if (C.mp == null) C.mp = .35;
    if (G.state === 'play' && G.ui.canPlay()) {
      if (mouse) { C.tyaw -= I.mouse.lx * sens; C.mp = G.clamp(C.mp + I.mouse.ly * sens, fp ? -1.3 : -.2, fp ? 1.35 : 1.2); if (I.mouse.wheel) C.mdist = G.clamp((C.mdist || 5.5) + I.mouse.wheel * .006, 3, 11);
        if (I.gp.on) { C.tyaw -= I.gp.rx * dt * 2.6; C.mp = G.clamp(C.mp + I.gp.ry * dt * 1.6, -1.2, 1.2); } }
      else { if (I.mouse.wheel) C.tdist = G.clamp(C.tdist + I.mouse.wheel * .012, 7, 26);
        if (I.mouse.r) C.tyaw -= I.mouse.dx * .006; if (I.ch('j')) C.tyaw += Math.PI / 4; if (I.ch('l')) C.tyaw -= Math.PI / 4;        if (I.gp.on) { C.tyaw -= I.gp.rx * dt * 2.2; C.tdist = G.clamp(C.tdist + I.gp.ry * dt * 10, 7, 26); } }
    }
    G.U.curve.value = !m.interior && G.settings.curve && !mouse ? G.CURVE : 0;
    let tx, ty, tz, dist = C.dist, pitch = C.pitch, k = Math.min(1, 8 * dt);
    if (G.state === 'title' || G.state === 'loading') { C.orbit += dt * .05; const s = m.meta.plaza || { x: m.W / 2, z: m.H / 2 }; tx = s.x; tz = s.z - 4; ty = 1; C.yaw = C.orbit; dist = 24; pitch = .5; }
    else if (fp) { // vue à la première personne (style Minecraft)
      C.yaw = C.tyaw; const ey = p.y + (p.swim ? .5 : p.sit ? .62 : .84);
      camera.position.set(p.x, ey, p.z); camera.lookAt(p.x - Math.sin(C.yaw) * Math.cos(C.mp), ey - Math.sin(C.mp), p.z - Math.cos(C.yaw) * Math.cos(C.mp));
      C.cx = p.x; C.cy = ey; C.cz = p.z; p.root.visible = false; finishCam(C, p, m, dt); return;
    }
    else if (mouse) { C.yaw = C.tyaw; tx = p.x; ty = p.y + 1.05; tz = p.z; dist = p.vehicle ? 16 : (C.mdist || 5.5); pitch = C.mp; k = 1; }
    else if (m.interior) { tx = G.lerp(m.W / 2, p.x, .35); tz = G.lerp(m.H / 2, p.z, .35) + .5; ty = .6; C.yaw = 0; dist = Math.max(9, m.W * 1.15); pitch = .9; C.tyaw = 0; }
    else if (p.vehicle) { C.yaw += (C.tyaw - C.yaw) * Math.min(1, 6 * dt); tx = p.x; ty = p.y + .5; tz = p.z; dist = 24; pitch = .78; }
    else { C.yaw += (C.tyaw - C.yaw) * Math.min(1, 6 * dt); C.dist += (C.tdist - C.dist) * Math.min(1, 6 * dt); tx = p.x; ty = p.y + .9; tz = p.z; dist = C.dist;
      const hd = Math.cos(pitch) * dist; let need = pitch; for (const t of [.12, .25, .4, .55, .7]) { const sx = tx + Math.sin(C.yaw) * hd * t, sz = tz + Math.cos(C.yaw) * hd * t, h = m.terrainH(sx, sz); if (h < 40) need = Math.max(need, Math.atan2(h + .9 - ty + .4, hd * t)); }
      C.boost += (Math.min(1.25, need) - pitch - C.boost) * Math.min(1, 3 * dt); pitch += Math.max(0, C.boost); }
    if (playing && !p.root.visible && G.state !== 'title') p.root.visible = true;
    TGT.set(tx, ty, tz); if (!C.cx) { C.cx = tx; C.cy = ty; C.cz = tz; }
    C.cx += (tx - C.cx) * k; C.cy += (ty - C.cy) * (k === 1 ? 1 : Math.min(1, 5 * dt)); C.cz += (tz - C.cz) * k;
    const hd = Math.cos(pitch) * dist; camera.position.set(C.cx + Math.sin(C.yaw) * hd, C.cy + Math.sin(pitch) * dist, C.cz + Math.cos(C.yaw) * hd);
    if (mouse) { // la caméra se rapproche quand un bâtiment ou une falaise la cache
      const cp = camera.position, occ = (x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return 50; let h = m.terrainH(x, z); const o = m.objAt(tx, tz); if (o) { const d = G.OBJ[o.t]; if (d.enter || d.shop || (d.h >= 2 && d.fp[0] * d.fp[1] >= 4 && !d.chop)) h = Math.max(h, o.y + d.h); } return h; };
      let k = 1; for (let i = 1; i <= 12; i++) { const t = i / 12, x = C.cx + (cp.x - C.cx) * t, y = C.cy + (cp.y - C.cy) * t, z = C.cz + (cp.z - C.cz) * t, h = occ(x, z); if (h < 40 && h > y - .2) { k = Math.max(.12, (i - 1) / 12 - .03); break; } }
      C.occK = k < (C.occK || 1) ? k : Math.min(k, (C.occK || 1) + dt * 1.5); if (C.occK < 1) cp.set(C.cx + (cp.x - C.cx) * C.occK, C.cy + (cp.y - C.cy) * C.occK, C.cz + (cp.z - C.cz) * C.occK);
      const ch = m.topAt(cp.x, cp.z); if (ch < 40 && cp.y < ch + .35) cp.y = ch + .35; }
    camera.lookAt(C.cx, C.cy, C.cz);
    finishCam(C, p, m, dt);
  }
  function finishCam(C, p, m, dt) {
    if (C.sh > 0) { C.sh = Math.max(0, C.sh - dt * .8); camera.position.x += (Math.random() - .5) * C.sh; camera.position.y += (Math.random() - .5) * C.sh; }
    G.U.cc.value.set(C.cx, C.cy, C.cz); G.U.cf.value.set(-Math.sin(C.yaw), -Math.cos(C.yaw));
    if (p && p.xray) { let occ = false; if (G.state === 'play' && !p.swim && !G.firstPerson()) { const py = p.y + .5, cp = camera.position, lx = Math.cos(C.yaw), lz = -Math.sin(C.yaw);
        for (const t of [.06, .12, .19, .26, .34, .44, .55]) for (const o of [0, -.75, .75]) { const sx = p.x + (cp.x - p.x) * t + lx * o, sz = p.z + (cp.z - p.z) * t + lz * o, th = m.topAt(sx, sz); if (th < 40 && th > py + (cp.y - py) * t) { occ = true; break; } } }
      if (occ !== p._occ) { p._occ = occ; p.xray.forEach(x => x.visible = occ); } }
    sky.position.copy(camera.position); stars.position.copy(camera.position);
  }
  // ---------- jour / nuit ----------
  function updClock(dt) {
    const s = G.settings.day;
    if (s === 'real') { const d = new Date(), mm = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; if (mm < G.clock.min - 600) G.newDay(); G.clock.min = mm; }
    else { G.clock.min += dt * 1440 / (Number(s) * 60); if (G.clock.min >= 1440) { G.clock.min -= 1440; G.newDay(); } }
  }
  const SD = new THREE.Vector3();
  function updSky() {
    const h = G.clock.min / 60, [li, hi] = skyAt(h), n = G.night(), m = G.map, inside = m && m.interior;
    skyMat.uniforms.top.value.copy(cTop); skyMat.uniforms.hor.value.copy(cHor); scene.fog.color.copy(cHor);
    const dayK = 1 - n; hemi.color.copy(cHs); hemi.groundColor.copy(cHg); hemi.intensity = inside ? .6 + .4 * dayK : hi; amb.intensity = inside ? .3 + .2 * dayK : .1 + n * .08;
    G.skyInfo = { h, n, inside, top: cTop, hor: cHor, light: cLight, day: h >= 5.2 && h < 19.6 };
    const day = h >= 5.2 && h < 19.6, a = day ? (h - 5.2) / 14.4 * Math.PI : ((h >= 19.6 ? h - 19.6 : h + 4.4) / 9.6) * Math.PI;
    SD.set(-Math.cos(a) * .8, Math.max(.18, Math.sin(a)), .45).normalize();
    sun.color.copy(cLight); sun.intensity = inside ? 0 : li; const c = G.cam;
    sun.position.set(c.cx + SD.x * 60, c.cy + SD.y * 60, c.cz + SD.z * 60); sun.target.position.set(c.cx, c.cy, c.cz);
    const sp = camera.position; sunM.position.set(sp.x - Math.cos(day ? a : a + Math.PI) * 330, sp.y + Math.sin(day ? a : -1) * 260, sp.z - 260); sunM.lookAt(sp); sunM.visible = !inside && day;
    moonM.position.set(sp.x + Math.cos(a) * 300, sp.y + Math.sin(!day ? a : -1) * 230 + 20, sp.z - 280); moonM.lookAt(sp); moonM.visible = !inside && !day;
    stars.material.opacity = inside ? 0 : n * .9;
    G.M.glow.color.setRGB(G.lerp(.62, 1.08, inside ? 1 : n), G.lerp(.7, .98, inside ? 1 : n), G.lerp(.78, .78, n));
    G.M.cloud.color.setRGB(1, 1, 1).lerp(cA.set(0x3c4470), n * .75).lerp(cB.set(0xffb090), Math.max(0, 1 - Math.abs(h - 19) * 1.2) * .5 + Math.max(0, 1 - Math.abs(h - 6) * 1.2) * .4);
    G.U.cloudAmt.value = inside ? 0 : .24 * (1 - n);
    G._wt = (G._wt || 0) - 1; if (G._wt < 0) { G._wt = 90; G.drawWindowView(cTop, cHor, n, h); }
  }
  // ---------- jour suivant : fruits, rochers, pousses, fossiles ----------
  G.newDay = () => {
    G.clock.day++; const m = G.world, r = Math.random;
    for (const o of [...m.list]) { const d = G.OBJ[o.t];
      if ((d.fruit || d.pickFruit) && o.f === 0) { o.f = 3; m.refresh(o); }
      if (o.t === 'pousse') { o.g = (o.g || 0) + 1 + (o.wt === G.clock.day - 1 ? 1 : 0); if (o.g >= 2) { const { x, z } = o; m.removeObj(o); m.addObj(o.ft || 'chene', x, z, 0, { f: 3 }); } } }
    m.meta.respawn = (m.meta.respawn || []).filter(e => { if (e.day > G.clock.day) return true; if (m.canPlace(e.t, e.x, e.z)) m.addObj(e.t, e.x, e.z); return false; });
    const rnd = () => [G.BORDER + Math.floor(r() * (m.W - 2 * G.BORDER)), G.BORDER + Math.floor(r() * (G.AR * G.ACRE))];
    for (let k = 0; k < 3; k++) for (let t = 0; t < 20; t++) { const [x, z] = rnd(); const i = m.idx(x, z); if (m.surf[i] <= 1 && m.canPlace('fissure', x, z)) { m.addObj('fissure', x, z); break; } }
    for (let k = 0; k < 4; k++) for (let t = 0; t < 20; t++) { const [x, z] = rnd(); const i = m.idx(x, z); if (m.surf[i] === 5 && m.canPlace('coquillage', x, z)) { m.addObj('coquillage', x, z); break; } }
    for (let k = 0; k < 3; k++) for (let t = 0; t < 20; t++) { const [x, z] = rnd(); const i = m.idx(x, z); if (m.surf[i] === 0 && m.canPlace('mauvaise_herbe', x, z)) { m.addObj('mauvaise_herbe', x, z); break; } }
    G.emit('newDay', G.clock.day);
  };
  // ---------- survie : faim et santé ----------
  function survival(dt) {
    if (G.mode !== 'survie') return; const p = G.player; if (p.dead) return;
    p.foodT += dt; if (p.foodT > 48) { p.foodT = 0; if (p.food > 0) { p.food--; G.ui.dirtyHud(); if (p.food === 2) G.ui.toast('Ton ventre gargouille… mange un fruit (F).'); } }
    if (p.food === 0) { p.starveT += dt; if (p.starveT > 12) { p.starveT = 0; p.inv = 0; G.act.hurt(1, 'Tu as trop faim !'); } }
    else if (p.food >= 7 && p.hp < 10) { p.starveT += dt; if (p.starveT > 18) { p.starveT = 0; p.hp++; G.ui.dirtyHud(); } }
  }
  // ---------- nouvelle partie / sauvegarde ----------
  const START = { survie: [['hache', 1], ['pelle', 1], ['filet', 1], ['canne', 1], ['epee', 1], ['pomme', 4]], creatif: ['hache', 'pelle', 'canne', 'filet', 'chene', 'lampadaire', 'banc', 'maison', 'sol_paves', 't_monter'] };
  function loading(msg, fn) { $('load-msg').textContent = msg; $('loading').hidden = false; setTimeout(() => { try { fn(); } catch (e) { console.error(e); G.ui.toast('Erreur : ' + e.message); } $('loading').hidden = true; }, 40); }
  function startPlay() { G.state = 'play'; G.ui.hideScreens(); $('hud').hidden = false; G.player.root.visible = G.player.blob.visible = true; G.ui.dirtyHot(); G.ui.dirtyHud(); G.ui.touchMode(); $('editor').hidden = true; }
  G.startNew = o => loading('Plantation des arbres…', () => {
    G.mode = o.mode; G.playerName = o.name; G.villageName = o.village; G.startDate = Date.now(); G.clock = { min: 8 * 60, day: 1 }; G.coins = o.mode === 'survie' ? 300 : 5000; G.sel = 0; G.placeRot = 0;
    const layout = o.map === 'random' ? G.randomLayout(o.seed) : o.map === 'custom' && G.editorLayout ? G.editorLayout : G.DEFAULT_LAYOUT;
    setWorld(G.genWorld(layout, o.seed));
    G.inv.slots = new Array(30).fill(null); G.inv.hot = new Array(10).fill(null);
    if (o.mode === 'survie') START.survie.forEach(([id, n], i) => G.inv.slots[i] = { id, n }); else START.creatif.forEach((id, i) => G.inv.hot[i] = id);
    G.dex = { caught: {}, donated: {} }; G.storage = new Array(120).fill(null); G.flags = {}; G.mini.best = {}; if (G.island) { scene.remove(G.island.group); G.island = null; }
    const p = G.player; p.look = G.normLook(o.look); p.vehicle = null; p.swim = false; p.build(); p.attach(scene); p.hp = 10; p.food = 10; p.dead = false;
    G.emit('newGame', o);
    const s = o.mode === 'survie' ? (G.world.meta.tent || G.world.meta.spawn) : (G.world.meta.spawn);
    G.enterMap(G.world, s.x, s.z, 0); startPlay(); G.saveGame(true);
    const gl = o.mode === 'survie' ? ['Bienvenue à ' + G.villageName + ', ' + G.playerName + ' ! Moi c\'est Gaston, bonnaffaire !', 'Tu commences au camping avec quelques outils. Coupe du bois, pêche, cueille… et fabrique avec C.', 'Tout se vend contre des clochettes 🔔 chez Gaston. La nuit, guette les étoiles filantes au-dessus du village !', 'Maintiens Espace pour charger un super saut : jusqu\'à deux fois ta taille !']
      : ['Bienvenue à ' + G.villageName + ', ' + G.playerName + ' ! Moi c\'est Gaston, bonnaffaire !', 'En mode Créatif, tout est gratuit : ouvre le catalogue avec I. Arbres, lampes, bancs, maisons, tentes, sols…', 'Dans l\'onglet Terrain : élève des falaises, creuse des rivières, crée des cascades et des pentes.', 'Maintiens Espace pour charger un super saut : jusqu\'à deux fois ta taille !'];
    gl.push('Visite la mairie, le musée et la couturière au nord de la place, la gare tout en haut, et le ponton au sud pour partir sur l\'île. Tu peux même nager !');
    setTimeout(() => G.ui.dialog('Gaston', gl, { pitch: .95, color: '#2f8a45' }), 600);
  });
  G.serialize = () => { const p = G.player; const ints = {}; for (const id in G.interiors) ints[id] = G.interiors[id].serialize();
    const veh = p.vehicle ? { x: p.vehicle.x, z: p.vehicle.z } : null, onIsle = G.map.kind === 'ile' || (G.map.meta.fromId === 'ile');
    const out = { v: 2, mode: G.mode, name: G.playerName, village: G.villageName, startDate: G.startDate, clock: G.clock, coins: G.coins, look: p.look, sel: G.sel,
      player: { x: p.x, z: p.z, yaw: p.yaw, hp: p.hp, food: p.food, map: onIsle ? 'ile' : G.map.id, veh }, inv: G.inv.slots, hot: G.inv.hot, world: G.world.serialize(), interiors: ints,
      dex: G.dex, storage: G.storage, designs: G.designs.map(x => x && { name: x.name, img: x.img }), flags: G.flags, best: G.mini.best, mods: {} };
    G.emit('save', out.mods); return out; };
  G.saveGame = silent => { if (!G.world || G.state === 'title' && !silent) return; try { const ok = G.store.set(G.saveKey || 'dv_save', G.serialize()); if (!silent) G.ui.toast(ok ? 'Partie sauvegardée ! 💾' : 'Sauvegarde impossible dans ce navigateur.'); $('btn-continue').hidden = !ok; } catch (e) { if (!silent) G.ui.toast('Sauvegarde impossible : ' + e.message); } };
  G.restore = d => {
    G.mode = d.mode; G.playerName = d.name; G.villageName = d.village; G.startDate = d.startDate; G.clock = d.clock; G.coins = d.coins; G.sel = d.sel || 0;
    G.dex = d.dex || { caught: {}, donated: {} }; G.storage = d.storage || new Array(120).fill(null); G.flags = d.flags || {}; G.mini.best = d.best || {};
    G.designs = (d.designs || new Array(8).fill(null)).map(x => x && { name: x.name, img: x.img }); while (G.designs.length < 8) G.designs.push(null);
    if (G.island) { scene.remove(G.island.group); G.island = null; }
    setWorld(G.GMap.deserialize(d.world));
    for (const id in d.interiors || {}) { const im = G.GMap.deserialize(d.interiors[id]); G.buildShell(im); im.buildAll(); im.group.visible = false; scene.add(im.group); G.interiors[id] = im; G.ents.spawnVillagers(im); }
    G.inv.slots = d.inv || new Array(30).fill(null); G.inv.hot = d.hot || new Array(10).fill(null);
    const p = G.player; p.look = G.normLook(d.look); p.vehicle = null; p.build(); p.attach(scene); p.hp = d.player.hp; p.food = d.player.food; p.dead = false;
    const im = G.interiors[d.player.map];
    if (d.player.map === 'ile') { const pr = G.world.meta.pier || G.world.meta.spawn; G.enterMap(G.world, pr.x, pr.z - 2.5, 0); }
    else if (im) G.enterMap(im, d.player.x, d.player.z, d.player.yaw); else G.enterMap(G.world, d.player.x, d.player.z, d.player.yaw);
    if (d.player.veh) { const tx = Math.floor(d.player.veh.x - 1), tz = Math.floor(d.player.veh.z - 1); for (const [ox, oz] of [[0, 0], [2, 0], [0, 2], [-2, 0], [0, -2], [3, 3]]) if (G.world.canPlace('montgolfiere', tx + ox, tz + oz)) { G.world.addObj('montgolfiere', tx + ox, tz + oz); break; } }
    G.emit('load', d.mods || {});
    startPlay(); G.ui.toast('Bon retour à ' + G.villageName + ', ' + G.playerName + ' !');
  };
  G.loadGame = () => { const d = G.store.get(G.saveKey || 'dv_save'); if (!d) { G.ui.toast('Aucune sauvegarde trouvée.'); return; } loading('Retour au village…', () => G.restore(d)); };
  G.toTitle = () => { const p = G.player; if (p.vehicle) { scene.remove(p.vehicle.mesh); scene.remove(p.vehicle.sh); p.vehicle = null; } if (G.mini.active) G.mini.end(); G.ui.modal = null; $('dialog').hidden = true;
    if (G.map && G.map !== G.world) G.enterMap(G.world, G.world.meta.spawn.x, G.world.meta.spawn.z, 0); G.state = 'title'; $('hud').hidden = true; G.ui.touchMode(); G.player.root.visible = G.player.blob.visible = false; G.ui.show('screen-title'); $('btn-continue').hidden = !G.store.get(G.saveKey || 'dv_save'); };
  // ---------- boucle ----------
  let last = performance.now(), wt = 0;
  function frame(now) { requestAnimationFrame(frame); if (G.frameGate && !G.frameGate(now)) return; const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt); }
  G._step = step;
  function step(dt) {
    wt += dt;
    try {
      G.input.poll(); G.ui.keys(); G.ui.keys2();
      if (document.pointerLockElement && (G.ui.modal || G.state !== 'play')) document.exitPointerLock();
      G.U.cloudOff.value.set(wt * .0045, wt * .0018);
      if (G.state === 'play') { updClock(dt); G.player.update(dt); G.act.update(dt); G.ents.update(dt); survival(dt); G.emit('update', dt); autoT += dt; if (autoT > 120) { autoT = 0; G.saveGame(true); } }
      else if (G.state === 'title') { G.clock.min = (G.clock.min + dt * .6) % 1440; G.ents.update(dt); }
      G.ui.update(dt); if (G.map) G.map.flush();
      updCamera(dt); updSky(); updLamps(dt, G.night());
      if (G.state !== 'editor') G.emit('frame', dt);
      G.TEX.water.offset.set(wt * .02, wt * .013); G.TEX.fall.offset.y = wt * 1.3;
      for (const c of clouds) { c.position.x += dt * c.userData.s; if (G.world && c.position.x > G.world.W + 40) c.position.x = -40; }
      const p = G.player, m = G.map; G.amb.update(dt, { fall: G.ents.fallDist || 99, sea: m && !m.interior ? Math.max(0, (m.meta.seaZ || 999) - 4 - p.z) : 99, night: G.night(), inside: !!(m && m.interior) });
      if (G.state !== 'editor') renderer.render(scene, camera);
    } catch (e) { if (!G._err) console.error(e); G._err = e; }
    G.input.endFrame();
  }
  // ---------- démarrage ----------
  function start(hotData) {
    init();
    const d = hotData && hotData.save;
    setWorld(G.genWorld(G.DEFAULT_LAYOUT, 1234)); G.clock.min = 8.5 * 60; G.player.teleport(G.world.meta.spawn.x, G.world.meta.spawn.z, 0); G.player.root.visible = G.player.blob.visible = false;
    $('loading').hidden = true; G.state = 'title'; G.ui.show('screen-title'); $('btn-continue').hidden = !G.store.get(G.saveKey || 'dv_save');
    requestAnimationFrame(frame);
    if (d) setTimeout(() => G.restore(d), 50);
  }
  window.claude?.hot?.snapshot?.(() => ({ save: G.state === 'play' || G.state === 'pause' ? G.serialize() : null }));
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
