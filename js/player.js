'use strict';
// ===== Joueur : marche, super saut chargé (2× sa taille), nage, collisions, déblocage, émotes, animations =====
(function () {
  const R = .27, GRAV = 26, WALK = 3.7, RUN = 6.4, SWIM = 2.4, SWIMR = 3.5, HOP = .45, MAXJ = 2.0, CHARGE_T = .75;
  // ---------- inventaire & rangement partagé (maison + casiers de la gare) ----------
  const stackOps = slots => ({
    add(id, n = 1) { const st = (G.ITEMS[id] && G.ITEMS[id].stack) || 99; for (const s of slots) if (s && s.id === id && s.n < st) { const k = Math.min(n, st - s.n); s.n += k; n -= k; if (!n) break; } for (let i = 0; i < slots.length && n > 0; i++) if (!slots[i]) { const k = Math.min(n, st); slots[i] = { id, n: k }; n -= k; } return n; }
  });
  G.inv = {
    slots: new Array(30).fill(null), hot: new Array(10).fill(null),
    creative() { return G.mode === 'creatif'; },
    held() { if (G.player && G.player.tempTool) return G.ITEMS[G.player.tempTool]; const id = this.creative() ? this.hot[G.sel] : (this.slots[G.sel] && this.slots[G.sel].id); return id ? G.ITEMS[id] : null; },
    count(id) { if (this.creative()) return 999; let n = 0; for (const s of this.slots) if (s && s.id === id) n += s.n; return n; },
    add(id, n = 1) { if (this.creative() || !G.ITEMS[id]) return 0; const left = stackOps(this.slots).add(id, n); G.ui && G.ui.dirtyHot(); return left; },
    remove(id, n = 1) {
      if (this.creative()) return true; if (this.count(id) < n) return false;
      for (let i = this.slots.length - 1; i >= 0 && n > 0; i--) { const s = this.slots[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) this.slots[i] = null; } }
      G.ui && G.ui.dirtyHot(); return true;
    },
    useHeld(n = 1) { if (this.creative() || (G.player && G.player.tempTool)) return true; const s = this.slots[G.sel]; if (!s || s.n < n) return false; s.n -= n; if (!s.n) this.slots[G.sel] = null; G.ui && G.ui.dirtyHot(); return true; },
    free() { return this.slots.filter(s => !s).length; }
  };
  G.storage = new Array(120).fill(null); G.storeAdd = (id, n) => stackOps(G.storage).add(id, n);
  G.sel = 0; G.coins = 0; G.placeRot = 0;
  G.mouseMode = () => G.settings && G.settings.camMode === 'souris';
  // règle de baignade (remplaçable par un module : mer avec maillot seulement, rivières interdites)
  G.canSwim = (m, x, z) => true;
  G.noSwimMsg = (m, x, z) => 'Plouf ! On ne peut pas nager ici… retour sur la berge.';
  G.firstPerson = () => G.mouseMode() && G.settings.fp;

  class Player {
    constructor(look) {
      this.look = G.normLook(look); this.build();
      this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vz = 0; this.vy = 0; this.yaw = Math.PI; this.onGround = true;
      this.charge = 0; this.charging = false; this.maxed = false; this.walkT = 0; this.blinkT = 2; this.squash = 0; this.airTop = 0; this.idleT = 0;
      this.act = null; this.sit = null; this.fish = null; this.hurtT = 0; this.inv = 0; this.safe = { x: 0, z: 0, t: 0 }; this.stepT = 0; this.lock = 0;
      this.swim = false; this.swimSurf = 0; this.vehicle = null; this.vault = null; this.emote = null; this.show = null; this.stuckT = 0; this.tryT = 0; this.tryD = 0; this.hintT = 0;
      this.hp = 10; this.food = 10; this.foodT = 0; this.starveT = 0; this.dead = false;
    }
    build() {
      const sc = this.root && this.root.parent; if (sc) { sc.remove(this.root); }
      const C = this.C = G.makeChar({ look: this.look }); this.root = C.root; this.toolId = null; this.toolMesh = null; this.xray = []; this._occ = false;
      for (const m of C.meshes) { let x; if (m.isSkinnedMesh) { x = new THREE.SkinnedMesh(m.geometry, G.M.xraySk); x.bind(m.skeleton, m.bindMatrix); } else x = new THREE.Mesh(m.geometry, G.M.xray); x.renderOrder = 12; x.frustumCulled = false; x.visible = false; m.add(x); this.xray.push(x); }
      if (!this.blob) { const sh = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); sh.frustumCulled = false; sh.renderOrder = 1; this.blob = sh; }
      if (sc) sc.add(this.root);
    }
    setLook(l) { this.look = G.normLook(l); const vis = this.root.visible; this.build(); this.root.visible = vis; G.ui && G.ui.dirtyHot(); }
    attach(scene) { scene.add(this.root); if (!this.blob.parent) scene.add(this.blob); }
    setTool(t) {
      if (t === this.toolId) return; this.toolId = t; if (this.toolMesh) this.C.hand.remove(this.toolMesh);
      this.toolMesh = t ? G.makeTool(t) : null; if (this.toolMesh) { this.toolMesh.rotation.x = -.35; this.C.hand.add(this.toolMesh); }
    }
    get map() { return G.map; }
    teleport(x, z, yaw) {
      const m = this.map; this.x = x; this.z = z; this.vx = this.vz = this.vy = 0; if (yaw != null) this.yaw = yaw;
      this.sit = null; this.fish && G.act.stopFish(); this.charging = false; this.charge = 0; this.vault = null; this.emote = null; this.stuckT = 0;
      if (m.isWaterAt(x, z) && G.canSwim(m, x, z)) { this.swim = true; this.swimSurf = m.waterSurf(Math.floor(x), Math.floor(z)); this.y = this.swimSurf - .5; this.onGround = false; }
      else { this.swim = false; this.y = m.topAt(x, z); this.onGround = true; this.safe = { x, z, t: 0 }; }
    }
    facing() { return [Math.sin(this.yaw), Math.cos(this.yaw)]; }
    target() {
      if (G.firstPerson() && G.camera) { const o = G.camera.position, d = G.v3b; G.camera.getWorldDirection(d); const m = this.map;
        for (let t = .4; t < 5.5; t += .08) { const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t; const top = m.isWaterAt(x, z) ? m.waterSurf(Math.floor(x), Math.floor(z)) : m.topAt(x, z); if (y <= top + .02) { const tx = Math.floor(x), tz = Math.floor(z); if (tx !== Math.floor(this.x) || tz !== Math.floor(this.z)) return [tx, tz]; } } }
      const [fx, fz] = this.facing(); let tx = Math.floor(this.x + fx * .85), tz = Math.floor(this.z + fz * .85);
      if (tx === Math.floor(this.x) && tz === Math.floor(this.z)) { tx = Math.floor(this.x + fx * 1.3); tz = Math.floor(this.z + fz * 1.3); }
      return [tx, tz];
    }
    blocked(x, z, feet, noV, noWater) {
      const m = this.map, lim = m.interior ? .3 : 2.6;
      if (x < lim || z < lim || x > m.W - lim || z > m.H - (m.interior ? .05 : 1.5)) return true;
      const f = this.swim ? this.swimSurf + .14 : feet;
      for (const [ox, oz] of [[-R, -R], [R, -R], [R, R], [-R, R]]) { const cx = x + ox, cz = z + oz; if (m.topAt(cx, cz) > f + G.STEP) return true; if (!noWater && (this.onGround || this.swim) && m.isWaterAt(cx, cz) && !G.canSwim(m, cx, cz)) return true; }
      if (!noV) for (const v of G.ents.villagers) if (v.map === m && v.visible && Math.hypot(v.x - x, v.z - z) < .55) return true;
      return false;
    }
    groundAt(x, z) { const m = this.map; let h = m.topAt(x, z); for (const [ox, oz] of [[-R * .7, -R * .7], [R * .7, -R * .7], [R * .7, R * .7], [-R * .7, R * .7]]) h = Math.max(h, m.topAt(x + ox, z + oz)); return h; }
    // ---------- déblocage : cherche la case libre la plus proche ----------
    unstick(force) {
      const m = this.map, tx = Math.floor(this.x), tz = Math.floor(this.z), was = this.swim; this.swim = false;
      for (let r = force ? 1 : 0; r <= 10; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = tx + dx + .5, z = tz + dz + .5; if (!m.inb(Math.floor(x), Math.floor(z)) || m.isWaterAt(x, z)) continue;
        const h = m.topAt(x, z); if (h > 40 || this.blocked(x, z, h, true)) continue;
        if (force && !this.canLeave(x, z, h)) continue;
        this.teleport(x, z); G.fx.puff(x, h + .2, z, 10, 0xffffff, .7); G.sfx('pop'); if (force) G.ui.toast('Hop ! Te voilà débloqué·e.'); return true;
      }
      this.swim = was; const s = m.interior ? { x: Math.floor(m.W / 2) + .5, z: m.H - 1.4 } : (m.meta.spawn || { x: m.W / 2, z: m.H / 2 }); this.teleport(s.x, s.z); G.ui.toast('Retour en lieu sûr.'); return false;
    }
    splashBack(m) {
      if (this.splashing) return; this.splashing = true; this.vy = 0; this.lock = .9;
      G.sfx('splash'); G.fx.burst(this.x, this.y + .3, this.z, 26, [0xffffff, 0xbfe6fa, 0x7cc7ec], 4, .8, 9); G.ui.toast(G.noSwimMsg(m, this.x, this.z));
      const done = () => { const s = this.safe; if (s && G.map === m && !m.isWaterAt(s.x, s.z)) this.teleport(s.x, s.z); else this.unstick(true); this.splashing = false; };
      if (G.ui.fading) done(); else G.ui.fade(done);
    }
    canLeave(x, z, h) { const m = this.map; let ok = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = m.topAt(x + dx, z + dz); if (t < 40 && t <= h + 1.9 && !m.isWaterAt(x + dx, z + dz)) ok++; } return ok >= 1; }
    update(dt) {
      const I = G.input, m = this.map, free = G.ui.canPlay() && !this.dead;
      if (this.vehicle) { G.feat.updVehicle(this, dt); return; }
      if (this.vault) { G.feat.updVault(this, dt); this.animate(dt, 0); this.place(); return; }
      let ix = 0, iz = 0;
      if (free) {
        if (I.down('KeyD', 'ArrowRight')) ix += 1; if (I.down('KeyA', 'ArrowLeft')) ix -= 1; if (I.down('KeyW', 'ArrowUp')) iz += 1; if (I.down('KeyS', 'ArrowDown')) iz -= 1;
        if (I.gp.on) { ix += I.gp.lx; iz -= I.gp.ly; } ix += I.touch.mx; iz -= I.touch.my;
      }
      let len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; len = 1; }
      const cy = G.cam.yaw, mx = Math.cos(cy) * ix - Math.sin(cy) * iz, mz = -Math.sin(cy) * ix - Math.cos(cy) * iz, mouse = G.mouseMode();
      const running = I.down('ShiftLeft', 'ShiftRight') || (I.gp.on && I.gp.b[7]) || len > .92 && I.touch.active;
      if (len > .3 && this.emote) this.emote = null;
      if (this.sit) { if (len > .3) G.act.standUp(); this.animate(dt, 0); this.place(); return; }
      if (this.fish && len > .3) G.act.stopFish();
      const busy = this.act || this.fish || this.lock > 0 || this.show; this.lock -= dt;
      const sp = this.swim ? (running ? SWIMR : SWIM) : (running ? RUN : WALK) * (this.charging ? .72 : 1);
      const tvx = busy ? 0 : mx * sp, tvz = busy ? 0 : mz * sp, k = this.swim ? 4 : this.onGround ? 14 : 3.2;
      this.vx += (tvx - this.vx) * Math.min(1, k * dt); this.vz += (tvz - this.vz) * Math.min(1, k * dt);
      if (mouse && !busy) this.yaw = G.cam.yaw + Math.PI;
      else if (len > .1 && !busy) this.yaw = G.angLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, 15 * dt));
      const jumpDown = free && (I.down('Space') || (I.gp.on && I.gp.b[0]));
      // ---------- nage ----------
      if (this.swim) {
        const nx = this.x + this.vx * dt, nz = this.z + this.vz * dt;
        if (!this.blocked(nx, this.z, this.y)) this.x = nx; else this.vx = 0;
        if (!this.blocked(this.x, nz, this.y)) this.z = nz; else this.vz = 0;
        if (!m.isWaterAt(this.x, this.z)) { this.swim = false; this.y = this.groundAt(this.x, this.z); this.onGround = true; this.vy = 0; G.sfx('splash', .4); G.fx.burst(this.x, this.y + .2, this.z, 8, [0xffffff, 0xbfe6fa], 2, .5, 8); }
        else {
          this.swimSurf = m.waterSurf(Math.floor(this.x), Math.floor(this.z)); const ty = this.swimSurf - .5 + Math.sin(performance.now() / 300) * .03; this.y += (ty - this.y) * Math.min(1, 6 * dt);
          if (free && I.hit('Space') || (I.gp.on && I.gpHit(0))) { this.swim = false; this.onGround = false; this.vy = Math.sqrt(2 * GRAV * 1.05); this.airTop = this.y; G.sfx('splash', .6); G.fx.burst(this.x, this.swimSurf, this.z, 12, [0xffffff, 0xbfe6fa], 2.5, .6, 8); }
          this.stepT -= dt; const hs = Math.hypot(this.vx, this.vz); if (this.stepT < 0) { this.stepT = hs > .5 ? .28 : .7; { const a = Math.random() * 6.28; G.fx.one(this.x + Math.cos(a) * .3, this.swimSurf + .04, this.z + Math.sin(a) * .3, Math.cos(a) * .4, .05, Math.sin(a) * .4, .6, 0, 0xe8f6ff, .16, 1.2); } if (hs > .5) G.sfx('step', .6); }
        }
        this.charging = false; G.emit('move', this, m); this.animate(dt, Math.hypot(this.vx, this.vz)); this.place(); return;
      }
      // ---------- saut chargé ----------
      if (jumpDown && this.onGround && !busy && !this.charging) { this.charging = true; this.charge = 0; this.maxed = false; this.emote = null; }
      if (this.charging) {
        this.charge = Math.min(1, this.charge + dt / CHARGE_T);
        if (this.charge >= 1 && !this.maxed) { this.maxed = true; G.sfx('chargemax'); G.fx.burst(this.x, this.y + .2, this.z, 10, [0xfff27a, 0xffffff], 2.2, .5, -1); }
        if (!jumpDown || !this.onGround) {
          const h = HOP + (MAXJ - HOP) * this.charge; this.vy = Math.sqrt(2 * GRAV * h); this.onGround = false; this.charging = false; this.airTop = this.y;
          if (len > .1) { const s = running ? RUN : WALK; this.vx = mx * s; this.vz = mz * s; }
          G.sfx(this.charge > .6 ? 'bigjump' : 'jump'); G.fx.puff(this.x, this.y + .05, this.z, this.charge > .6 ? 8 : 4, 0xf3ead2, .5);
          if (this.charge > .6) G.fx.burst(this.x, this.y + .1, this.z, 12, [0xffffff, 0xbfe8ff], 3, .45, 2);
          this.charge = 0;
        }
      }
      const ox = this.x, oz = this.z, nx = this.x + this.vx * dt, nz = this.z + this.vz * dt;
      if (!this.blocked(nx, this.z, this.y)) this.x = nx; else this.vx = 0;
      if (!this.blocked(this.x, nz, this.y)) this.z = nz; else this.vz = 0;
      const g = this.groundAt(this.x, this.z);
      if (this.onGround) { if (g < this.y - .35) { this.onGround = false; this.vy = 0; this.airTop = this.y; } else this.y = g; }
      if (!this.onGround) {
        this.vy = Math.max(-30, this.vy - GRAV * dt); this.y += this.vy * dt; this.airTop = Math.max(this.airTop, this.y);
        if (m.isWaterAt(this.x, this.z)) { const ws = m.waterSurf(Math.floor(this.x), Math.floor(this.z)); if (this.y <= ws - .15 && !G.canSwim(m, this.x, this.z)) { this.splashBack(m); this.animate(dt, 0); this.place(); return; } if (this.y <= ws - .15) { // plouf : on nage !
          this.swim = true; this.swimSurf = ws; this.vy = 0; G.sfx('splash'); G.fx.burst(this.x, ws + .1, this.z, 22, [0xffffff, 0xbfe6fa, 0x7cc7ec], 3.5, .8, 9);
          if (!G.flags.swam) { G.flags.swam = 1; G.ui.toast('Tu nages ! 🏊 Espace pour sauter hors de l\'eau.'); } this.animate(dt, 0); this.place(); return; } }
        if (this.y <= g && this.vy <= 0) {
          const fall = this.airTop - g; this.y = g; this.vy = 0; this.onGround = true; this.squash = .16;
          G.sfx('land', fall > 1 ? 1 : .5); G.fx.puff(this.x, g + .05, this.z, fall > 1.2 ? 9 : 4, 0xf3ead2, .55);
          if (fall > 5.2 && G.mode === 'survie') G.act.hurt(Math.floor((fall - 4.2) / 1.5), 'Aïe ! Grosse chute...');
        }
      }
      if (this.onGround && (this.safe.t = (this.safe.t || 0) + dt) > .25) this.safe = { x: this.x, z: this.z, t: 0 };
      // ---------- coincé ? ----------
      if (this.onGround && !this.splashing && (this.blocked(this.x, this.z, this.y, true, true) || (m.isWaterAt(this.x, this.z) && !G.canSwim(m, this.x, this.z)))) { this.stuckT += dt; if (this.stuckT > .3) this.unstick(false); } else this.stuckT = 0;
      if (len > .5 && !busy) { this.tryT += dt; this.tryD += Math.hypot(this.x - ox, this.z - oz); if (this.tryT > 3) { if (this.tryD < .4 && this.onGround && (this.hintT -= 3) < 0) { this.hintT = 20; G.ui.toast('Coincé·e ? Appuie sur U pour te débloquer.'); } this.tryT = 0; this.tryD = 0; } } else { this.tryT = 0; this.tryD = 0; }
      const hs = Math.hypot(this.vx, this.vz);
      if (this.onGround && hs > .5) { this.stepT -= dt * hs; if (this.stepT < 0) { this.stepT = 1.15; G.sfx('step'); if (hs > 5) G.fx.puff(this.x, this.y + .03, this.z, 1, 0xf3ead2, .35); } }
      if (m.interior && this.z > m.H - .32 && !m.meta.noExit) G.act.exitHouse();
      G.emit('move', this, m);
      this.animate(dt, hs); this.place();
    }
    place() {
      const r = this.root; r.position.set(this.x, this.y, this.z); r.rotation.y = this.yaw;
      const gy = this.groundAt(this.x, this.z), sh = this.blob; sh.position.set(this.x, gy + .03, this.z);
      const s = G.clamp(1 - (this.y - gy) * .18, .4, 1) * .75; sh.scale.set(s, 1, s); sh.visible = !this.swim && !this.map.isWaterAt(this.x, this.z) && r.visible;
    }
    animate(dt, hs) {
      const C = this.C, t = performance.now() / 1000; let legL = 0, legR = 0, armL = 0, armR = 0, armRz = 0, armLz = 0, bob = 0, sy = 1, sxz = 1, lean = 0, headY = 0, headX = 0, expr = 'normal';
      this.idleT = hs > .2 || !this.onGround || this.act ? 0 : this.idleT + dt;
      if (this.sit) { legL = legR = -1.45; armL = armR = -.3; bob = -.3; }
      else if (this.swim) { const s = Math.sin(t * 6); lean = .55; armL = -1.4 + s * .9; armR = -1.4 - s * .9; armLz = -.6; armRz = .6; legL = .4 + s * .5; legR = .4 - s * .5; bob = -.05; }
      else if (!this.onGround) { legL = -.6; legR = .3; armL = armR = -2.4; armLz = -.4; armRz = .4; sy = this.vy > 0 ? 1.12 : 1; sxz = this.vy > 0 ? .93 : 1; expr = this.vy > 4 ? 'happy' : 'normal'; }
      else if (hs > .3) { this.walkT += dt * (2.4 + hs * 1.6); const s = Math.sin(this.walkT); const amp = hs > 5 ? .95 : .7; legL = s * amp; legR = -s * amp; armL = -s * amp * .85; armR = s * amp * .85; bob = Math.abs(Math.cos(this.walkT)) * (hs > 5 ? .07 : .045); lean = hs > 5 ? .18 : .05;
        headY = Math.sin(this.walkT * .5) * .08; headX = -.03; sy = 1 + Math.abs(Math.cos(this.walkT)) * .03; if (hs > 5) expr = 'happy'; }
      else { bob = Math.sin(t * 2.2) * .012; armLz = -.06; armRz = .06; sy = 1 + Math.sin(t * 2.4) * .014; headX = Math.sin(t * .8) * .04; headY = Math.sin(t * .37) * .12;
        if (this.idleT > 9) { const k = (this.idleT - 9) % 12; if (k < 3) { headY = Math.sin(k * 2.2) * .5; } else if (k > 6 && k < 7.6) { const e = Math.sin((k - 6) / 1.6 * Math.PI); armL = armR = -2.9 * e; sy = 1 + .05 * e; expr = 'happy'; } } }
      if (this.emote) {
        const e = this.emote; e.t += dt; const p = e.t;
        if (e.id === 'salut') { armR = -2.6 + Math.sin(p * 14) * .25; armRz = .5 + Math.sin(p * 14) * .35; expr = 'happy'; }
        else if (e.id === 'danse') { const s = Math.sin(p * 9); armL = -2.4 + s * .5; armR = -2.4 - s * .5; legL = Math.max(0, s) * .5; legR = Math.max(0, -s) * .5; bob = Math.abs(s) * .08; headY = s * .25; expr = 'happy'; if (Math.floor(p * 2) !== e.k) { e.k = Math.floor(p * 2); G.popup('♪', this.x + (Math.random() - .5), this.y + 1.5, this.z); } }
        else if (e.id === 'rire') { bob = Math.abs(Math.sin(p * 18)) * .04; armL = armR = -.4; expr = 'happy'; headX = -.15; }
        else if (e.id === 'bravo') { const s = Math.sin(p * 16); armL = armR = -1.4; armLz = -.5 + s * .4; armRz = .5 - s * .4; expr = 'happy'; if (Math.floor(p * 3) !== e.k) { e.k = Math.floor(p * 3); G.sfx('chop', .25); } }
        else if (e.id === 'assis') { legL = legR = -1.5; bob = -.3; armL = armR = -.2; }
        else if (e.id === 'dodo') { legL = legR = -1.5; bob = -.3; headX = .35; expr = 'sleepy'; if (Math.floor(p) !== e.k) { e.k = Math.floor(p); G.popup('z', this.x + .3, this.y + 1.2, this.z); } }
        else if (e.id === 'surprise') { expr = 'surprised'; bob = p < .25 ? Math.sin(p / .25 * Math.PI) * .25 : 0; armL = armR = -.8; armLz = -.7; armRz = .7; }
        else if (e.id === 'triste') { expr = 'sad'; headX = .35; armL = armR = .1; }
        else if (e.id === 'clin') { expr = 'wink'; armR = -2.2; armRz = .3; }
        if (e.dur && e.t > e.dur) this.emote = null;
      }
      if (this.show) { this.show.t += dt; armL = armR = -3; armLz = -.25; armRz = .25; expr = 'happy'; if (this.show.t > this.show.dur) G.feat.endShow(this); }
      if (this.charging) { const c = this.charge; sy = 1 - .3 * c; sxz = 1 + .17 * c; armL = armR = .5 * c; legL = legR = -.25 * c; expr = this.maxed ? 'happy' : 'normal'; C.body.position.x = this.maxed ? (Math.random() - .5) * .03 : 0; }
      else C.body.position.x = 0;
      if (this.squash > 0) { this.squash -= dt; sy = Math.min(sy, 1 - this.squash * 1.2); sxz = Math.max(sxz, 1 + this.squash * .7); }
      if (this.act) { const a = this.act, p = G.clamp(a.t / a.dur, 0, 1);
        if (a.kind === 'eat') { armR = -1.9 + Math.sin(p * 18) * .3; armL = -1.6; expr = 'happy'; }
        else if (a.kind === 'place') { armR = armL = -1.1 * Math.sin(p * Math.PI); }
        else { const w = p < .45 ? -2.7 * (p / .45) : -2.7 + 3.1 * G.smooth((p - .45) / .55); armR = w; lean = p > .45 ? .25 : -.1; } }
      if (this.fish) { armR = -1.0 + (this.fish.phase === 'bite' ? Math.sin(t * 30) * .15 : 0); if (this.fish.phase === 'bite') expr = 'surprised'; }
      if (this.hurtT > 0) expr = 'sad';
      C.legL.rotation.x = legL; C.legR.rotation.x = legR; C.armL.rotation.x = armL; C.armR.rotation.x = armR; C.armL.rotation.z = armLz; C.armR.rotation.z = armRz;
      C.body.position.y = bob; C.body.scale.set(sxz, sy, sxz); C.body.rotation.x = lean; C.head.rotation.y += (headY - C.head.rotation.y) * Math.min(1, 6 * dt); C.head.rotation.x += (headX - C.head.rotation.x) * Math.min(1, 6 * dt);
      this.blinkT -= dt; if (this.blinkT < 0) this.blinkT = 2.5 + Math.random() * 3;
      if (expr === 'normal' && this.blinkT < .12) expr = 'blink';
      if (C.setExpr) C.setExpr(expr); else C.eyes.scale.y = expr === 'blink' ? .15 : 1;
      if (this.hurtT > 0) { this.hurtT -= dt; const on = Math.floor(this.hurtT * 12) % 2 === 0; for (const mm of C.meshes) mm.material = on ? (mm.isSkinnedMesh ? G.M.hurtSk : G.M.hurt) : mm.userData.mat0; this._hurtOn = true; }
      else if (this._hurtOn) { for (const mm of C.meshes) mm.material = mm.userData.mat0; this._hurtOn = false; }
    }
  }
  G.flags = {};
  G.Player = Player;
})();
