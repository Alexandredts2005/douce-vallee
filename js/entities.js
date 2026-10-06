'use strict';
// ===== Entités : particules, animations d'objets (chute d'arbre !), habitants, insectes, slimes, ballons, projectiles =====
(function () {
  const TAU = Math.PI * 2;
  // ---------- particules (shader léger, alpha et taille par particule, monde arrondi) ----------
  const PVS = `attribute float psize; attribute float palpha; attribute vec3 pcol; uniform float uScale, uCurve; uniform vec3 uCC; uniform vec2 uCF; varying vec3 vC; varying float vA;
  void main(){ vC=pcol; vA=palpha; vec4 wp=modelMatrix*vec4(position,1.); vec2 d=wp.xz-uCC.xz; float a=dot(d,uCF); float l=d.x*uCF.y-d.y*uCF.x; wp.y-=uCurve*(a*a+.3*l*l); vec4 mv=viewMatrix*wp; gl_Position=projectionMatrix*mv; gl_PointSize=psize*uScale/max(.1,-mv.z); }`;
  const PFS = `uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t=texture2D(map,gl_PointCoord); float a=t.a*vA; if(a<.02) discard; gl_FragColor=vec4(vC,a); }`;
  class PS {
    constructor(N, scene) {
      this.N = N; this.i = 0; const g = new THREE.BufferGeometry();
      this.pos = new Float32Array(N * 3).fill(-999); this.col = new Float32Array(N * 3); this.sz = new Float32Array(N); this.al = new Float32Array(N);
      this.vel = new Float32Array(N * 3); this.life = new Float32Array(N); this.max = new Float32Array(N); this.grav = new Float32Array(N); this.s0 = new Float32Array(N); this.grow = new Float32Array(N);
      g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('pcol', new THREE.BufferAttribute(this.col, 3)); g.setAttribute('psize', new THREE.BufferAttribute(this.sz, 1)); g.setAttribute('palpha', new THREE.BufferAttribute(this.al, 1));
      this.mat = new THREE.ShaderMaterial({ vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, uniforms: { map: { value: G.TEX.dot }, uScale: G.U.pscale, uCurve: G.U.curve, uCC: G.U.cc, uCF: G.U.cf } });
      this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 5; scene.add(this.pts); this.g = g;
    }
    spawn(x, y, z, vx, vy, vz, life, grav, col, size, grow = 0) {
      const i = this.i = (this.i + 1) % this.N, c = new THREE.Color(col);
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b; this.life[i] = this.max[i] = life; this.grav[i] = grav; this.s0[i] = size; this.grow[i] = grow;
    }
    update(dt) {
      const P = this.pos, V = this.vel;
      for (let i = 0; i < this.N; i++) {
        if (this.life[i] <= 0) { if (this.al[i] > 0) { this.al[i] = 0; P[i * 3 + 1] = -999; } continue; }
        this.life[i] -= dt; const k = this.life[i] / this.max[i];
        V[i * 3 + 1] -= this.grav[i] * dt; const dr = 1 - Math.min(1, 1.6 * dt); V[i * 3] *= dr; V[i * 3 + 2] *= dr;
        P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
        this.al[i] = Math.min(1, k * 2.2); this.sz[i] = this.s0[i] * (1 + this.grow[i] * (1 - k));
      }
      for (const a of ['position', 'pcol', 'psize', 'palpha']) this.g.attributes[a].needsUpdate = true;
    }
  }
  G.U.pscale = { value: 400 };
  G.fx = {
    init(scene) { this.a = new PS(900, scene); },
    burst(x, y, z, n, cols, spd = 2, life = .6, grav = 9, size = .12) { if (!this.a) return; for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = spd * (.4 + Math.random() * .6); this.a.spawn(x, y, z, Math.cos(a) * s, spd * (.5 + Math.random()) * .9, Math.sin(a) * s, life * (.6 + Math.random() * .6), grav, cols[k % cols.length], size * (.7 + Math.random() * .6)); } },
    puff(x, y, z, n, col, size = .5) { if (!this.a) return; for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = .4 + Math.random() * .8; this.a.spawn(x + Math.cos(a) * .15, y, z + Math.sin(a) * .15, Math.cos(a) * s, .3 + Math.random() * .6, Math.sin(a) * s, .5 + Math.random() * .4, -.3, col, size, 1.4); } },
    one(x, y, z, vx, vy, vz, life, grav, col, size, grow) { this.a && this.a.spawn(x, y, z, vx, vy, vz, life, grav, col, size, grow); },
    update(dt) { this.a && this.a.update(dt); }
  };
  // ---------- textes flottants ----------
  const pops = []; G.popup = (txt, x, y, z, cls = '') => { const el = document.createElement('div'); el.className = 'pop ' + cls; el.textContent = txt; G.el('popups').appendChild(el); pops.push({ el, x, y, z, t: 0 }); };
  const PV = new THREE.Vector3();
  G.toScreen = (x, y, z) => { PV.set(x, y + G.bendY(x, z), z).project(G.camera); return [(PV.x + 1) / 2 * innerWidth, (1 - PV.y) / 2 * innerHeight, PV.z < 1]; };
  function updPops(dt) { for (let k = pops.length - 1; k >= 0; k--) { const p = pops[k]; p.t += dt; p.y += dt * .9; const [sx, sy, ok] = G.toScreen(p.x, p.y, p.z); p.el.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${Math.min(1, p.t * 6)})`; p.el.style.left = '0'; p.el.style.top = '0'; p.el.style.opacity = ok ? Math.min(1, 2.2 - p.t * 1.6) : 0; if (p.t > 1.35) { p.el.remove(); pops.splice(k, 1); } } }
  // ---------- animations d'objets instanciés ----------
  const anims = [], AX = new THREE.Vector3(), Q = new THREE.Quaternion(), MM = new THREE.Matrix4(), SC = new THREE.Vector3(), ZERO = new THREE.Vector3();
  G.anim = {
    shake(map, o, dur = .4, amp = 1) { if (o.falling) return; for (const a of anims) if (a.o === o && a.type === 'shake') { a.t = 0; a.dur = dur; a.amp = amp; return; } anims.push({ type: 'shake', map, o, t: 0, dur, amp }); },
    fallTree(map, o, fx, fz, done) { o.falling = true; for (let k = anims.length - 1; k >= 0; k--) if (anims[k].o === o) anims.splice(k, 1); anims.push({ type: 'fall', map, o, fx, fz, ang: 0, w: .5, t: 0, landed: 0, done, bounced: 0 }); },
    grow(map, o) { anims.push({ type: 'grow', map, o, t: 0, dur: .5 }); },
    drop(map, o) { anims.push({ type: 'drop', map, o, t: 0, dur: .55, x: (Math.random() - .5) * .3 }); },
    update(dt) {
      for (let k = anims.length - 1; k >= 0; k--) {
        const a = anims[k], o = a.o; a.t += dt; if (!a.map.list.has(o)) { anims.splice(k, 1); continue; }
        if (a.type === 'shake') { const e = 1 - a.t / a.dur; if (e <= 0) { a.map.setAnim(o, null); anims.splice(k, 1); continue; } MM.makeRotationZ(Math.sin(a.t * 42) * .07 * a.amp * e); MM.multiply(G.m4c.makeRotationX(Math.cos(a.t * 37) * .04 * a.amp * e)); a.map.setAnim(o, MM.clone()); }
        else if (a.type === 'fall') {
          if (a.landed === 0) { a.w += (5.5 * Math.sin(a.ang + .12)) * dt; a.ang += a.w * dt; if (a.ang >= 1.5) { a.ang = 1.5; if (a.bounced < 2) { a.w = -a.w * (a.bounced ? .12 : .25); a.bounced++; if (a.bounced === 1) this.thud(a); } else { a.landed = a.t; } } }
          let s = 1; if (a.landed) { const e = (a.t - a.landed - .35) / .45; if (e > 0) s = Math.max(0, 1 - e); if (e >= 1) { anims.splice(k, 1); const [cx, cz] = a.map.center(o); G.fx.puff(cx + a.fx * 2, o.y + .3, cz + a.fz * 2, 14, 0xf3ead2, .8); a.done && a.done(); continue; } }
          AX.set(a.fz, 0, -a.fx).normalize(); Q.setFromAxisAngle(AX, a.ang); SC.set(s, s, s); MM.compose(ZERO, Q, SC); a.map.setAnim(o, MM.clone());
        }
        else if (a.type === 'grow') { const p = Math.min(1, a.t / a.dur), s = .2 + .8 * (1 - Math.pow(1 - p, 3)) + Math.sin(p * Math.PI) * .12; SC.set(s, s, s); MM.compose(ZERO, Q.identity(), SC); a.map.setAnim(o, p >= 1 ? null : MM.clone()); if (p >= 1) anims.splice(k, 1); }
        else if (a.type === 'drop') { const p = Math.min(1, a.t / a.dur), y = p < .7 ? 2.2 * (1 - (p / .7) * (p / .7)) : Math.sin((p - .7) / .3 * Math.PI) * .25; MM.makeTranslation(a.x * (1 - p), y, 0); a.map.setAnim(o, p >= 1 ? null : MM.clone()); if (p >= 1) { anims.splice(k, 1); G.sfx('place', .4); } }
      }
    },
    thud(a) { const [cx, cz] = a.map.center(a.o), tx = cx + a.fx * 2.6, tz = cz + a.fz * 2.6; G.sfx('thud'); G.sfx('leaves'); G.cam.shake(.25); G.fx.burst(tx, a.o.y + .6, tz, 26, [0x58b54a, 0x6cc458, 0x4aa443, 0xffffff], 3.5, 1, 6); G.fx.puff(tx, a.o.y + .2, tz, 10, 0xf3ead2, .9); }
  };
  // ---------- entités ----------
  const E = G.ents = { villagers: [], bugs: [], slimes: [], balloons: [], shots: [], spawnT: 3, balloonT: 40, slimeT: 5, fallSpots: [], fallRev: -1, fireT: 0 };
  let scene;
  E.init = sc => {
    scene = sc;
    E.bobber = new THREE.Mesh(G.getGeo('bobber'), G.MATS); E.bobber.visible = false; E.bobber.frustumCulled = false; scene.add(E.bobber);
    E.lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    E.line = new THREE.Line(E.lineGeo, G.curveMat(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 }))); E.line.frustumCulled = false; E.line.visible = false; scene.add(E.line);
    const cg = new THREE.BufferGeometry(); const s = .5, t = .06, quads = [[-s, -s, s, -s + t], [-s, s - t, s, s], [-s, -s, -s + t, s], [s - t, -s, s, s]], p = [];
    for (const [x0, z0, x1, z1] of quads) p.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x0, 0, z0, x1, 0, z1, x1, 0, z0);
    cg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); cg.computeVertexNormals();
    E.cursor = new THREE.Mesh(cg, G.M.cursor); E.cursor.frustumCulled = false; E.cursor.renderOrder = 3; scene.add(E.cursor);
    E.ghost = new THREE.Mesh(G.getGeo('rock'), G.M.ghost); E.ghost.frustumCulled = false; E.ghost.visible = false; scene.add(E.ghost); E.ghostKey = '';
  };
  E.clear = () => { for (const l of [E.villagers, E.bugs, E.slimes, E.balloons, E.shots]) { for (const e of l) { scene.remove(e.root || e.mesh); if (e.blob) scene.remove(e.blob); } l.length = 0; } };
  const blob = () => { const b = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); b.frustumCulled = false; scene.add(b); return b; };
  // ----- habitants -----
  E.spawnVillagers = map => {
    for (const h of map.meta.homes || []) {
      const D = G.VILLAGERS[h.vi]; if (!D) continue; const C = G.makeChar({ sp: D.sp, col: D.col, shirt: D.acc, pants: 0x5a4a3a });
      const v = { D, C, root: C.root, x: h.x, z: h.z + .4, y: 0, yaw: 0, home: h, st: 'idle', t: 1 + Math.random() * 3, walkT: 0, map, visible: true, blob: blob(), gift: -1 };
      scene.add(v.root); E.villagers.push(v);
    }
    for (const n of map.meta.npcs || []) E.addNPC(n.role, map, n.x, n.z, n.yaw || 0);
  };
  // personnages fixes : commerçants, guichetier, capitaine… (role → G.NPCS[role])
  E.addNPC = (role, map, x, z, yaw = 0) => {
    const D = G.NPCS[role]; if (!D) return null; const C = G.makeChar({ sp: D.sp, col: D.col, shirt: D.shirt, apron: D.apron, eyes: D.eyes, mouth: D.mouth });
    const v = { D, C, root: C.root, x, z, y: 0, yaw, home: { x, z, yaw }, st: 'npc', t: 0, walkT: 0, map, visible: true, blob: blob(), npc: role, shop: role === 'shop' ? 1 : 0, fixed: 1 };
    scene.add(v.root); E.villagers.push(v); return v;
  };
  E.removeNPCs = map => { for (const v of E.villagers.slice()) if (v.map === map && v.fixed) { scene.remove(v.root); scene.remove(v.blob); E.villagers.splice(E.villagers.indexOf(v), 1); } };
  const walkable = (m, x, z, y) => { const h = m.topAt(x, z); return !m.isWaterAt(x, z) && Math.abs(h - y) < .3 && x > 3 && z > 3 && x < m.W - 3 && z < m.H - 3 && !m.objAt(Math.floor(x), Math.floor(z))?.t?.startsWith('maison'); };
  E.villagerInFront = p => { const [fx, fz] = p.facing(); let best = null, bd = 9; for (const v of E.villagers) { if (!v.visible || v.map !== G.map) continue; const dx = v.x - p.x, dz = v.z - p.z, d = Math.hypot(dx, dz); if (d < (v.fixed ? 2.8 : 1.9) && d < bd && (dx * fx + dz * fz) / (d || 1) > .45) { bd = d; best = v; } } return best; };
  E.talk = v => {
    if (v.shop) { v.talking = true; G.ui.openShop(v).then(() => v.talking = false); return; }
    if (v.npc) { v.talking = true; G.sfx('open'); Promise.resolve(G.npcTalk(v)).then(() => v.talking = false); return; }
    const L = G.LINES, h = G.clock.min / 60, fill = s => s.replace(/\{p\}/g, G.playerName).replace(/\{v\}/g, G.villageName).replace(/\{c\}/g, v.D.catch);
    const lines = [fill(G.pick(h < 11 && h >= 5 ? L.morning.concat(L.hello) : h >= 18 && h < 21 ? L.evening : h >= 21 || h < 5 ? L.night : L.hello))];
    lines.push(fill(G.pick(Math.random() < .5 ? L.tips : L.random)));
    let gift = null; if (v.gift !== G.clock.day && Math.random() < .4) { v.gift = G.clock.day; gift = G.pick(Object.values(G.ITEMS).filter(i => i.kind === 'place' && (i.cat === 'mobilier' || i.cat === 'fleurs'))); lines.push(fill(G.pick(L.gift))); }
    v.talking = true; G.sfx('open');
    G.ui.dialog(v.D.n, lines, { pitch: v.D.pitch, color: '#' + new THREE.Color(v.D.acc).getHexString() }).then(() => { v.talking = false; if (gift) { G.act.give(gift.id, 1); G.sfx('fanfare'); G.ui.toast(v.D.n + ' t\'offre : ' + gift.n + ' !'); } });
  };
  function updVillager(v, dt) {
    const m = v.map, h = G.clock.min / 60, night = (h >= 22 || h < 6) && !v.fixed, p = G.player;
    v.visible = !night && G.map === m; v.root.visible = v.blob.visible = v.visible; if (!v.visible) { if (night) { v.x = v.home.x; v.z = v.home.z + .4; } return; }
    let hs = 0;
    if (v.talking) { const t = Math.atan2(p.x - v.x, p.z - v.z); v.yaw = G.angLerp(v.yaw, t, Math.min(1, 8 * dt)); }
    else if (v.fixed) { const near = Math.hypot(p.x - v.x, p.z - v.z) < 6; v.yaw = G.angLerp(v.yaw, near ? Math.atan2(p.x - v.x, p.z - v.z) : (v.home.yaw || 0), Math.min(1, 2 * dt)); }
    else if (v.st === 'idle') { v.t -= dt; if (v.t < 0) { const a = Math.random() * TAU, r = 2 + Math.random() * 6; v.tx = v.home.x + Math.cos(a) * r; v.tz = v.home.z + 2 + Math.sin(a) * r; v.st = 'walk'; v.t = 6; } }
    else { const dx = v.tx - v.x, dz = v.tz - v.z, d = Math.hypot(dx, dz); v.t -= dt;
      if (d < .3 || v.t < 0) { v.st = 'idle'; v.t = 2 + Math.random() * 5; }
      else { const s = 1.5, nx = v.x + dx / d * s * dt, nz = v.z + dz / d * s * dt; if (walkable(m, nx, nz, v.y) && Math.hypot(nx - p.x, nz - p.z) > .6) { v.x = nx; v.z = nz; hs = s; v.yaw = G.angLerp(v.yaw, Math.atan2(dx, dz), Math.min(1, 6 * dt)); } else { v.st = 'idle'; v.t = 1 + Math.random() * 2; } } }
    v.y = m.topAt(v.x, v.z); v.root.position.set(v.x, v.y, v.z); v.root.rotation.y = v.yaw; v.blob.position.set(v.x, v.y + .03, v.z); v.blob.scale.set(.7, 1, .7);
    const C = v.C, tn = performance.now() / 1000, dp = Math.hypot(p.x - v.x, p.z - v.z);
    // coucou quand on s'approche, petits sauts de joie au repos (kawaii !)
    if (!v.fixed && !v.talking && dp < 3.2 && G.map === m) { if (!v.greeted) { v.greeted = 1; v.waveT = 1.4; v.st = 'idle'; v.t = 2; } v.yaw = G.angLerp(v.yaw, Math.atan2(p.x - v.x, p.z - v.z), Math.min(1, 5 * dt)); } else if (dp > 6) v.greeted = 0;
    if (!hs && !v.talking && !(v.hopT > 0) && Math.random() < dt * .08) v.hopT = .5; if (v.hopT > 0) v.hopT -= dt; if (v.waveT > 0) v.waveT -= dt;
    if (hs) { v.walkT += dt * 7; const s = Math.sin(v.walkT); C.legL.rotation.x = s * .7; C.legR.rotation.x = -s * .7; C.armL.rotation.x = -s * .5; C.armR.rotation.x = s * .5; C.armR.rotation.z = 0; C.body.position.y = Math.abs(Math.cos(v.walkT)) * .04; C.head.rotation.y = Math.sin(v.walkT * .5) * .08; }
    else { C.legL.rotation.x = C.legR.rotation.x = 0; C.armL.rotation.x = v.talking ? -.4 + Math.sin(tn * 6.2) * .3 : 0; C.armR.rotation.x = v.waveT > 0 ? -2.6 + Math.sin(tn * 14) * .25 : C.armL.rotation.x; C.armR.rotation.z = v.waveT > 0 ? .5 + Math.sin(tn * 14) * .3 : 0;
      C.body.position.y = v.hopT > 0 ? Math.sin((1 - v.hopT / .5) * Math.PI) * .16 : Math.sin(tn * 2) * .012; C.body.scale.y = 1 + Math.sin(tn * 2.4 + v.home.x) * .015; C.head.rotation.y = Math.sin(tn * .4 + v.home.x) * .15; }
    if (C.setExpr) C.setExpr(v.talking ? ((tn / .7 | 0) % 3 === 0 ? 'happy' : 'normal') : v.waveT > 0 || v.hopT > 0 ? 'happy' : ((tn + v.home.x) % 3.7 < .12 ? 'blink' : 'normal')); else C.eyes.scale.y = (tn + v.home.x) % 3.7 < .12 ? .15 : 1;
  }
  // ----- insectes -----
  function spawnBug(p, night) {
    const m = G.map, a = Math.random() * TAU, r = 8 + Math.random() * 14, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    if (!m.inb(Math.floor(x), Math.floor(z)) || m.isWaterAt(x, z)) return; const nearW = m.isWaterT(Math.floor(x) + 2, Math.floor(z)) || m.isWaterT(Math.floor(x) - 2, Math.floor(z)) || m.isWaterT(Math.floor(x), Math.floor(z) + 2);
    let kind = night ? (Math.random() < .8 ? 'luciole' : 'scarabee') : nearW && Math.random() < .5 ? 'libellule' : Math.random() < .12 ? 'coccinelle' : Math.random() < .07 ? 'papillon_bleu' : 'papillon';
    if (m.kind === 'ile' && !night && Math.random() < .3) kind = Math.random() < .5 ? 'ornithoptere' : 'papillon_bleu';
    const B = G.makeBug(kind), y = m.topAt(x, z) + (kind === 'coccinelle' ? .25 : .7 + Math.random() * .8);
    const b = { B, root: B.root, kind, x, y, z, bx: x, bz: z, by: y, t: Math.random() * 10, flee: 0 }; b.root.position.set(x, y, z); scene.add(b.root); E.bugs.push(b);
  }
  function updBug(b, dt, p) {
    b.t += dt; const fast = b.kind === 'libellule'; const sp = fast ? 1.6 : .8;
    const ph = Math.hypot(p.vx, p.vz), d = Math.hypot(b.x - p.x, b.z - p.z);
    if (d < 2.6 && ph > 4.2) b.flee = 2;
    if (b.flee > 0) { b.flee -= dt; const dx = b.x - p.x, dz = b.z - p.z, l = Math.hypot(dx, dz) || 1; b.x += dx / l * 4 * dt; b.z += dz / l * 4 * dt; b.y += dt * 1.2; }
    else { b.x = b.bx + Math.sin(b.t * sp) * 1.4 + Math.sin(b.t * 2.3) * .3; b.z = b.bz + Math.cos(b.t * sp * .8) * 1.2; b.y = b.by + Math.sin(b.t * 3) * .18; }
    b.root.position.set(b.x, b.y, b.z); b.root.rotation.y = b.t * sp + Math.PI / 2;
    const fl = b.kind === 'coccinelle' || b.kind === 'scarabee' ? .3 : 1.1; const w = Math.sin(b.t * (fast ? 40 : 16)) * fl; b.B.wl.rotation.z = w; b.B.wr.rotation.z = -w;
    if (b.kind === 'luciole') b.root.children[0].scale.setScalar(.8 + Math.sin(b.t * 4) * .3);
  }
  E.bugNear = (x, y, z, r) => { let best = null, bd = r; for (const b of E.bugs) { const d = Math.hypot(b.x - x, b.z - z) + Math.abs(b.y - y) * .4; if (d < bd) { bd = d; best = b; } } return best; };
  E.catchBug = b => { scene.remove(b.root); E.bugs.splice(E.bugs.indexOf(b), 1); G.sfx('catch'); const it = G.ITEMS[b.kind]; G.act.give(b.kind, 1, b.x, b.y - 1, b.z); G.feat.mark(b.kind); G.feat.showOff(b.kind); G.ui.toast('Tu as attrapé : ' + it.n + ' ! ' + it.ico); };
  // ----- slimes (survie, la nuit) -----
  function spawnSlime(p) {
    const m = G.world, a = Math.random() * TAU, r = 13 + Math.random() * 9, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, tx = Math.floor(x), tz = Math.floor(z);
    if (!m.inb(tx, tz) || tx < 4 || tz < 4 || tx > m.W - 4 || m.isWaterAt(x, z) || m.objAt(tx, tz)) return;
    for (const l of m.lights) { const [cx, cz] = m.center(l); if (Math.hypot(cx - x, cz - z) < 7) return; }
    const v = Math.floor(Math.random() * 3), mesh = new THREE.Mesh(G.getGeo('slime', v), G.MATS); mesh.castShadow = true; mesh.frustumCulled = false; scene.add(mesh);
    const s = { mesh, x, z, y: m.topAt(x, z), vy: 0, vx: 0, vz: 0, hp: 3, hop: Math.random(), flash: 0, melt: 0, blob: blob() }; E.slimes.push(s); G.sfx('boing', .4);
  }
  function killSlime(s, drop = true) { scene.remove(s.mesh); scene.remove(s.blob); E.slimes.splice(E.slimes.indexOf(s), 1); G.fx.puff(s.x, s.y + .3, s.z, 12, 0x9dff98, .7); G.fx.burst(s.x, s.y + .4, s.z, 12, [0x6fe36a, 0xffffff], 3, .6, 8);
    if (drop) { const m = G.world, tx = Math.floor(s.x), tz = Math.floor(s.z); if (m.canPlace('gelee_sol', tx, tz)) m.addObj('gelee_sol', tx, tz); else G.act.give('gelee', 1, s.x, s.y, s.z); } }
  E.hitSlimes = (x, z, r, dmg, fx, fz) => { let hit = false; for (const s of E.slimes.slice()) if (Math.hypot(s.x - x, s.z - z) < r) { hit = true; s.hp -= dmg; s.flash = .2; s.vx = fx * 7; s.vz = fz * 7; s.vy = 5; G.sfx('hit'); G.cam.shake(.06); G.fx.burst(s.x, s.y + .4, s.z, 8, [0xffffff, 0x9dff98], 2.5, .4, 8); if (s.hp <= 0) killSlime(s); } return hit; };
  function updSlime(s, dt, p) {
    const m = G.world, h = G.clock.min / 60;
    if (h >= 5.5 && h < 19.5) { s.melt += dt; if (s.melt > 1.2) { killSlime(s, false); return; } }
    const dx = p.x - s.x, dz = p.z - s.z, d = Math.hypot(dx, dz), onG = s.y <= m.topAt(s.x, s.z) + .01;
    if (onG) { s.vx *= .8; s.vz *= .8; s.hop -= dt; if (s.hop < 0 && G.map === m) { s.hop = .8 + Math.random() * .5; s.vy = 5.5; const chase = d < 15 && G.map === m; const a = chase ? Math.atan2(dx, dz) : Math.random() * TAU; s.vx = Math.sin(a) * 2.8; s.vz = Math.cos(a) * 2.8; } }
    s.vy -= 20 * dt; const nx = s.x + s.vx * dt, nz = s.z + s.vz * dt;
    if (!m.isWaterAt(nx, nz) && m.topAt(nx, nz) < s.y + .5) { s.x = nx; s.z = nz; } else { s.vx = -s.vx * .3; s.vz = -s.vz * .3; }
    s.y += s.vy * dt; const g = m.topAt(s.x, s.z); if (s.y < g) { s.y = g; s.vy = 0; }
    const sq = onG ? 1 - Math.max(0, s.hop - .6) * .5 : 1.15, mt = 1 - s.melt / 1.2; s.mesh.position.set(s.x, s.y, s.z); s.mesh.scale.set((2 - sq) * mt, sq * mt, (2 - sq) * mt); s.mesh.rotation.y = Math.atan2(dx, dz);
    s.blob.position.set(s.x, g + .03, s.z); s.blob.scale.setScalar(.9 * mt);
    if (s.flash > 0) { s.flash -= dt; s.mesh.material = G.M.hurt; } else s.mesh.material = G.MATS;
    if (G.map === m && d < .8 && Math.abs(p.y - s.y) < 1) { G.act.hurt(1, 'Un slime t\'a touché !'); const l = d || 1; p.vx = dx / l * 6; p.vz = dz / l * 6; }
    if (d > 45) killSlime(s, false);
  }
  // ----- ballons-cadeaux & projectiles -----
  function spawnBalloon(p) { const g = G.makeBalloon(), b = { root: g, x: p.x - 28, z: p.z - 4 + Math.random() * 10, y: Math.max(p.y, 0) + 6.5, t: 0, falling: false, vy: 0 }; g.position.set(b.x, b.y, b.z); scene.add(g); E.balloons.push(b); }
  E.shoot = p => {
    const [fx, fz] = p.facing(), sx = p.x + fx * .3, sy = p.y + .8, sz = p.z + fz * .3; let vx = fx * 14, vy = 4, vz = fz * 14;
    let tgt = null, bd = 24; for (const o of G.mini.targets()) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd && ((o.x - p.x) * fx + (o.z - p.z) * fz) > -2) { bd = d; tgt = [o.x, o.y + 1.25 * d / 20, o.z]; } }
    if (!tgt) for (const b of E.balloons) { if (b.falling) continue; const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < bd && ((b.x - p.x) * fx + (b.z - p.z) * fz) > -4) { bd = d; tgt = [b.x + 2.6 * d / 20, b.y + 1.6, b.z]; } }
    if (!tgt) for (const s of E.slimes) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < 11 && ((s.x - p.x) * fx + (s.z - p.z) * fz) / d > .5) { tgt = [s.x, s.y + .3, s.z]; break; } }
    if (tgt) { const dx = tgt[0] - sx, dy = tgt[1] - sy, dz = tgt[2] - sz, l = Math.hypot(dx, dy, dz), sp = 20; vx = dx / l * sp; vy = dy / l * sp + 9 * (l / sp) * .5; vz = dz / l * sp; }
    const mesh = new THREE.Mesh(G.getGeo('pebble'), G.MATS); mesh.frustumCulled = false; scene.add(mesh); E.shots.push({ mesh, x: sx, y: sy, z: sz, vx, vy, vz, life: 2 }); G.sfx('boing', .6);
  };
  function updShot(s, dt) {
    s.vy -= 9 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.life -= dt; s.mesh.position.set(s.x, s.y, s.z);
    let dead = s.life < 0 || s.y < G.map.topAt(s.x, s.z);
    if (G.mini.hit(s.x, s.y, s.z)) dead = true;
    for (const b of E.balloons) if (!b.falling && Math.hypot(b.x - s.x, b.y + 1.6 - s.y, b.z - s.z) < 1) { b.falling = true; b.root.children[0].visible = false; popBalloon(b); dead = true; }
    for (const sl of E.slimes) if (Math.hypot(sl.x - s.x, sl.y + .3 - s.y, sl.z - s.z) < .6) { E.hitSlimes(sl.x, sl.z, .1, 1, s.vx / 20, s.vz / 20); dead = true; break; }
    if (dead) { scene.remove(s.mesh); E.shots.splice(E.shots.indexOf(s), 1); G.fx.burst(s.x, s.y, s.z, 4, [0xb3b0a8], 1.5, .3, 8); }
  }
  function popBalloon(b) {
    G.sfx('pop'); G.fx.burst(b.x, b.y + 1.6, b.z, 24, [0xe8434a, 0xffd23f, 0x5b8fd6, 0xff8fc0, 0xffffff], 4, 1, 4);
    const box = new THREE.Mesh(G.getGeo('present'), G.MATS); box.frustumCulled = false; box.position.set(b.x, b.y, b.z); scene.add(box); b.box = box; scene.remove(b.root);
  }
  function updBalloon(b, dt, p) {
    if (b.falling) { if (!b.box) return; b.vy -= 12 * dt; b.y += b.vy * dt; b.box.position.set(b.x, b.y, b.z); b.box.rotation.y += dt * 3; const g = G.world.topAt(b.x, b.z);
      if (b.y <= g) { scene.remove(b.box); E.balloons.splice(E.balloons.indexOf(b), 1); const m = G.world; let tx = Math.floor(b.x), tz = Math.floor(b.z), ok = false;
        for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) if (m.canPlace('cadeau', tx + dx, tz + dz)) { m.addObj('cadeau', tx + dx, tz + dz); ok = true; break; }
        if (!ok) G.act.openGift('cadeau'); G.sfx('place'); G.fx.puff(b.x, g + .1, b.z, 8, 0xf3ead2); } return; }
    b.t += dt; b.x += 2.6 * dt; b.root.position.set(b.x, b.y + Math.sin(b.t * 1.5) * .35, b.z); b.root.rotation.z = Math.sin(b.t * 1.2) * .08;
    if (b.x > p.x + 42) { scene.remove(b.root); E.balloons.splice(E.balloons.indexOf(b), 1); }
  }
  E.showBobber = on => { E.bobber.visible = on; E.line.visible = on; };
  // ----- curseur de case & fantôme de placement -----
  function updCursor(p) {
    const it = G.inv.held(), m = G.map, show = it && G.ui.canPlay() && !p.sit && ['tool', 'place', 'surf', 'terra'].includes(it.kind) && it.tool !== 'rod' && it.tool !== 'sling';
    E.cursor.visible = !!show; E.ghost.visible = false; if (!show) return;
    const [tx, tz] = p.target(); let ok = true, cx = tx + .5, cz = tz + .5;
    if (it.kind === 'place') {
      const d = G.OBJ[it.obj], r = G.placeRot, [ax, az] = G.act.anchor(d, r, tx, tz), [w, dd] = G.fpDims(d, r); ok = m.canPlace(it.obj, ax, az, r) && !G.act.occupiedByMe(d, r, ax, az);
      const key = d.model + ':' + d.v; if (key !== E.ghostKey) { E.ghost.geometry = G.getGeo(d.model, d.v); E.ghostKey = key; }
      cx = ax + w / 2; cz = az + dd / 2; E.ghost.visible = true; E.ghost.position.set(cx, m.inb(ax, az) ? m.baseH(ax, az) : 0, cz); E.ghost.rotation.y = r * Math.PI / 2;
      E.cursor.scale.set(w, 1, dd);
    } else E.cursor.scale.set(1, 1, 1);
    G.M.ghost.color.setHex(ok ? 0x9cff9c : 0xff8080); G.M.cursor.color.setHex(ok ? 0xffffff : 0xff8080);
    E.cursor.position.set(cx, m.inb(tx, tz) ? Math.max(m.topAt(tx + .5, tz + .5), m.isWaterT(tx, tz) ? m.waterSurf(tx, tz) : -9) + .03 : 0, cz);
    E.cursor.rotation.y = 0;
  }
  // ----- boucle -----
  const HV = new THREE.Vector3();
  E.update = dt => {
    const p = G.player; if (!p) return; const h = G.clock.min / 60, night = h >= 19.5 || h < 5.5, m = G.map;
    for (const v of E.villagers) updVillager(v, dt);
    // insectes
    E.spawnT -= dt; if (E.spawnT < 0 && !m.interior) { E.spawnT = .8; if (E.bugs.length < (night ? 10 : 8)) spawnBug(p, night); }
    for (let k = E.bugs.length - 1; k >= 0; k--) { const b = E.bugs[k]; if (m.interior || Math.hypot(b.x - p.x, b.z - p.z) > 34 || (b.kind === 'luciole') !== night && b.kind !== 'scarabee') { scene.remove(b.root); E.bugs.splice(k, 1); continue; } updBug(b, dt, p); }
    // slimes
    if (!(G.settings && G.settings.slimes)) { for (const s of E.slimes.slice()) killSlime(s, false); }
    else if (G.mode === 'survie') { E.slimeT -= dt; if (night && h > 20 || h < 5) { if (E.slimeT < 0 && m === G.world) { E.slimeT = 5 + Math.random() * 7; if (E.slimes.length < 6) spawnSlime(p); } } }
    for (const s of E.slimes.slice()) updSlime(s, dt, p);
    E.slimes.forEach(s => s.mesh.visible = s.blob.visible = m === G.world);
    // ballons de jour
    E.balloonT -= dt; if (E.balloonT < 0 && h > 7 && h < 18 && m === G.world) { E.balloonT = 60 + Math.random() * 90; spawnBalloon(p); }
    for (const b of E.balloons.slice()) updBalloon(b, dt, p);
    E.balloons.forEach(b => { b.root.visible = m === G.world; if (b.box) b.box.visible = m === G.world; });
    for (const s of E.shots.slice()) updShot(s, dt);
    // pêche
    if (p.fish) { const f = p.fish, bt = performance.now() / 1000; E.bobber.position.set(f.x, f.y + Math.sin(bt * 3) * .03 - (f.dip || 0) * .16, f.z); p.C.hand.updateWorldMatrix(true, false); HV.set(0, .3, 1.05).applyMatrix4(p.C.hand.matrixWorld);
      const a = E.lineGeo.attributes.position; a.setXYZ(0, HV.x, HV.y, HV.z); a.setXYZ(1, f.x, f.y + .1, f.z); a.needsUpdate = true; }
    // écume des cascades & flammes
    if (E.fallRev !== m.rev) { E.fallRev = m.rev; E.fallSpots = [...m.falls.values()]; }
    let near = 99; for (const f of E.fallSpots) { const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < near) near = d; if (d < 26 && Math.random() < dt * 5) G.fx.one(f.x + (Math.random() - .5) * .8, f.y + .1, f.z + (Math.random() - .5) * .8, (Math.random() - .5) * 1.2, .8 + Math.random(), (Math.random() - .5) * 1.2, .8, 1.5, 0xffffff, .38, 1); }
    E.fallDist = near;
    E.fireT -= dt; if (E.fireT < 0) { E.fireT = .12; for (const l of m.lights) { const d = G.OBJ[l.t]; if (!d.fire) continue; const [cx, cz] = m.center(l); if (Math.hypot(cx - p.x, cz - p.z) > 22) continue; const top = l.t === 'torche' ? 1.3 : l.t === 'cheminee' ? .6 : .5;
      G.fx.one(cx + (Math.random() - .5) * .2, l.y + top, cz + (Math.random() - .5) * .2, (Math.random() - .5) * .3, 1.2 + Math.random(), (Math.random() - .5) * .3, .7, -.5, Math.random() < .5 ? 0xffb347 : 0xffe14a, .1, 0);
      if (Math.random() < .35 && l.t !== 'cheminee') G.fx.one(cx, l.y + top + .4, cz, (Math.random() - .5) * .2, .7, (Math.random() - .5) * .2, 1.6, -.1, 0x9a9a9a, .35, 2); } }
    updCursor(p); G.anim.update(dt); G.fx.update(dt); updPops(dt); G.feat.updFish(dt); if (G.mini) G.mini.update(dt);
  };
})();
