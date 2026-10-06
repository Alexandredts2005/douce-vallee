'use strict';
// ===== Mécaniques : ombres de poissons & pêche, perche, montgolfière, émotes, « objet brandi », encyclopédie =====
(function () {
  const F = G.feat = { fishes: [], spawnT: 0 };
  G.dex = { caught: {}, donated: {} };
  F.mark = id => { if (!G.dex.caught[id]) { G.dex.caught[id] = G.clock.day; G.ui.toast('Nouveau dans l\'encyclopédie : ' + G.ITEMS[id].n + ' !'); } };
  // ---------- perche (outil) ----------
  const oldTool = G.toolGeo;
  G.toolGeo = t => { if (t !== 'pole') return oldTool(t); const b = G.mb(3); b.cyl(.022, .026, 1.7, 6, 0xc9a26b, 0, 0, .55, Math.PI / 2 - .15); b.cyl(.03, .03, .08, 6, 0xe8434a, 0, .02, -.05, Math.PI / 2); return b.done(); };
  const dom = p => { const [fx, fz] = p.facing(); return Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz)]; };
  F.vault = () => {
    const p = G.player, m = G.map; if (m.interior) return G.ui.toast('Pas besoin de perche à l\'intérieur !');
    const [dx, dz] = dom(p), sx = Math.floor(p.x), sz = Math.floor(p.z); let water = 0;
    for (let k = 1; k <= 6; k++) {
      const tx = sx + dx * k, tz = sz + dz * k; if (!m.inb(tx, tz)) break;
      if (m.isWaterAt(tx + .5, tz + .5)) { water++; continue; } if (!water) break;
      const h = m.topAt(tx + .5, tz + .5); if (h - p.y > .6 || p.blocked(tx + .5, tz + .5, h, true)) { G.sfx('error'); return G.ui.toast("L'autre rive est trop haute !"); }
      p.vault = { x0: p.x, z0: p.z, y0: p.y, x1: tx + .5, z1: tz + .5, y1: h, t: 0, dur: .5 + .1 * k, k }; p.yaw = Math.atan2(dx, dz); G.sfx('bigjump'); return;
    }
    G.sfx('error'); G.ui.toast(water ? 'Trop large pour sauter, même avec la perche !' : 'Mets-toi face à une rivière pour utiliser la perche.');
  };
  F.updVault = (p, dt) => {
    const v = p.vault; v.t += dt; const e = Math.min(1, v.t / v.dur);
    p.x = G.lerp(v.x0, v.x1, e); p.z = G.lerp(v.z0, v.z1, e); p.y = G.lerp(v.y0, v.y1, e) + Math.sin(e * Math.PI) * (1.5 + v.k * .25);
    p.C.armR.rotation.x = p.C.armL.rotation.x = -1.2 - e * 1.2;
    if (e >= 1) { p.vault = null; p.onGround = true; p.vy = 0; p.squash = .16; G.sfx('land'); G.fx.puff(p.x, p.y + .05, p.z, 8, 0xf3ead2, .55); }
  };
  // ---------- montgolfière ----------
  F.board = o => {
    const p = G.player, m = G.map; if (m.interior) return; const [cx, cz] = m.center(o);
    const mesh = new THREE.Mesh(G.getGeo('montgolfiere'), G.MATS); mesh.castShadow = true; mesh.frustumCulled = false; G.scene.add(mesh);
    const sh = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); sh.frustumCulled = false; G.scene.add(sh);
    p.vehicle = { o: { t: o.t, r: o.r }, x: cx, z: cz, y: o.y, alt: 0, talt: 6, mesh, sh, t: 0, landing: false, vx: 0, vz: 0 };
    m.removeObj(o); G.sfx('fanfare'); G.ui.toast('Montgolfière ! ZQSD pour voler · Espace monter · Maj descendre · E atterrir');
  };
  F.updVehicle = (p, dt) => {
    const v = p.vehicle, I = G.input, m = G.map, free = G.ui.canPlay(); v.t += dt;
    let ix = 0, iz = 0; if (free && !v.landing) { if (I.down('KeyD', 'ArrowRight')) ix += 1; if (I.down('KeyA', 'ArrowLeft')) ix -= 1; if (I.down('KeyW', 'ArrowUp')) iz += 1; if (I.down('KeyS', 'ArrowDown')) iz -= 1; if (I.gp.on) { ix += I.gp.lx; iz -= I.gp.ly; } ix += I.touch.mx; iz -= I.touch.my; }
    const cy = G.cam.yaw, mx = Math.cos(cy) * ix - Math.sin(cy) * iz, mz = -Math.sin(cy) * ix - Math.cos(cy) * iz;
    v.vx += (mx * 5 - v.vx) * Math.min(1, 1.5 * dt); v.vz += (mz * 5 - v.vz) * Math.min(1, 1.5 * dt);
    v.x = G.clamp(v.x + v.vx * dt, 4, m.W - 4); v.z = G.clamp(v.z + v.vz * dt, 4, m.H - 4);
    if (free && !v.landing) { if (I.down('Space')) v.talt = Math.min(20, v.talt + dt * 4); if (I.down('ShiftLeft', 'ShiftRight')) v.talt = Math.max(3, v.talt - dt * 4); }
    if (free && I.hit('KeyE') && !v.landing) { v.landing = true; G.ui.toast('Atterrissage…'); }
    const tx = Math.floor(v.x - 1), tz = Math.floor(v.z - 1), ground = Math.max(m.topAt(v.x, v.z), m.isWaterAt(v.x, v.z) ? m.waterSurf(Math.floor(v.x), Math.floor(v.z)) : -9);
    if (v.landing) { v.talt = 0; v.vx *= .9; v.vz *= .9; }
    v.alt += (v.talt - v.alt) * Math.min(1, (v.landing ? 1.2 : .8) * dt); v.y += (ground + v.alt - v.y) * Math.min(1, 2 * dt);
    if (v.landing && v.y - ground < .08) {
      if (m.canPlace(v.o.t, tx, tz, v.o.r) && !m.isWaterAt(v.x, v.z)) { G.scene.remove(v.mesh); G.scene.remove(v.sh); m.addObj(v.o.t, tx, tz, v.o.r); p.vehicle = null; p.teleport(tx + 1, tz + 2.7, 0); G.sfx('land'); G.fx.puff(tx + 1, ground + .1, tz + 1, 12, 0xf3ead2, .9); return; }
      v.landing = false; v.talt = 4; G.sfx('error'); G.ui.toast('Il faut un terrain plat et libre de 2×2 pour atterrir.');
    }
    const sway = Math.sin(v.t * .9) * .04; v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.set(sway, v.t * .05, -sway);
    v.sh.position.set(v.x, ground + .04, v.z); const s = G.clamp(2.6 - v.alt * .06, 1.2, 2.6); v.sh.scale.set(s, 1, s); v.sh.visible = !m.isWaterAt(v.x, v.z);
    p.x = v.x; p.z = v.z; p.y = v.y + .3; p.yaw = G.mouseMode() ? G.cam.yaw + Math.PI : p.yaw; p.onGround = true; p.swim = false;
    if (v.talt > v.alt + .2 && Math.random() < dt * 12) { G.fx.one(v.x, v.y + 1.6, v.z, (Math.random() - .5) * .3, 1.4, (Math.random() - .5) * .3, .5, -.5, Math.random() < .5 ? 0xffb347 : 0xffe14a, .22, 1); if (Math.random() < .05) G.sfx('swing', .35); }
    p.animate(dt, 0); p.C.armL.rotation.x = p.C.armR.rotation.x = -.7; p.place(); p.blob.visible = false;
  };
  // ---------- émotes ----------
  F.EMOTES = [['salut', '👋', 'Saluer', 1.8], ['danse', '💃', 'Danser', 4], ['rire', '😄', 'Rire', 2], ['bravo', '👏', 'Applaudir', 1.8], ['surprise', '😮', 'Surprise', 1.2], ['triste', '😢', 'Triste', 2.5], ['clin', '😉', "Clin d'œil", 1.2], ['assis', '🧘', 'Assis par terre', 0], ['dodo', '😴', 'Faire la sieste', 0]];
  F.emote = id => { const p = G.player; if (!p || p.swim || p.vehicle || p.sit || p.vault) return; const e = F.EMOTES.find(x => x[0] === id); if (!e) return; p.emote = { id, t: 0, dur: e[3], k: -1 }; G.sfx(id === 'surprise' ? 'boing' : id === 'triste' ? 'fall' : 'pickup', .6); };
  // ---------- brandir l'objet attrapé (pose de victoire) ----------
  F.showOff = id => {
    const p = G.player, it = G.ITEMS[id]; if (!p || !it || p.swim || p.vehicle) return; F.endShow(p);
    const c = G.cv(128, 128), x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill();
    const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.scale.set(.75, .75, .75); sp.position.set(0, 1.62, 0); sp.renderOrder = 20; p.root.add(sp);
    const url = G.ui.thumb(id); if (url) { const im = new Image(); im.onload = () => { x.drawImage(im, 16, 16, 96, 96); tex.needsUpdate = true; }; im.src = url; } else { x.font = '72px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(it.ico || '❔', 64, 70); tex.needsUpdate = true; }
    p.show = { t: 0, dur: 1.5, sp }; G.sfx('fanfare');
  };
  F.endShow = p => { if (p && p.show) { p.root.remove(p.show.sp); p.show.sp.material.map.dispose(); p.show = null; } };
  // ---------- ombres de poissons ----------
  const SIZE = { carpe: .55, truite: .55, poisson_chat: .75, saumon: .8, carassin: .32, poisson_rouge: .3, grenouille: .3, sardine: .34, bar: .55, daurade: .6, calamar: .55, requin: 1.2, poisson_lune: .9, poisson_clown: .3, espadon: 1 };
  F.SIZE = SIZE;
  F.waterKind = (m, tx, tz) => {
    const w = m.water[m.idx(tx, tz)]; if (w === 2) return m.kind === 'ile' ? 'ile' : 'sea'; const L = m.meta.layout;
    if (L) { const ax = Math.floor((tx - G.BORDER) / G.ACRE), az = Math.floor((tz - G.BORDER) / G.ACRE), id = L[az] && L[az][ax]; if (id === 'etang' || id === 'lac') return 'pond'; }
    return m.kind === 'ile' ? 'pond' : 'river';
  };
  const pickSpecies = kind => { const list = G.FISH[kind] || G.FISH.river, tot = list.reduce((s, x) => s + x[1], 0); let q = Math.random() * tot; for (const [k, w] of list) { q -= w; if (q <= 0) return k; } return list[0][0]; };
  let shMat = null;
  function spawnFish(p, m) {
    for (let tries = 0; tries < 10; tries++) {
      const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 16, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, tx = Math.floor(x), tz = Math.floor(z);
      if (!m.inb(tx, tz) || !m.isWaterAt(x, z)) continue; let n = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (m.isWaterT(tx + dx, tz + dz)) n++; if (n < 2) continue;
      const kind = pickSpecies(F.waterKind(m, tx, tz)), s = SIZE[kind] || .5;
      if (!shMat) shMat = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x0d2633, transparent: true, opacity: .42, depthWrite: false }));
      const mesh = new THREE.Mesh(G.getGeo('blob'), shMat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.scale.set(s * .55, 1, s); G.scene.add(mesh);
      let fin = null; if (kind === 'requin') { fin = new THREE.Mesh(G.getGeo('fin'), G.MATS); fin.frustumCulled = false; G.scene.add(fin); }
      F.fishes.push({ kind, s, x: tx + .5, z: tz + .5, gx: tx + .5, gz: tz + .5, mesh, fin, t: Math.random() * 9, st: 'swim', m, yaw: 0, nib: 0 }); return;
    }
  }
  function killFish(f) { G.scene.remove(f.mesh); if (f.fin) G.scene.remove(f.fin); F.fishes.splice(F.fishes.indexOf(f), 1); }
  F.clearFish = () => F.fishes.slice().forEach(killFish);
  F.updFish = dt => {
    const p = G.player, m = G.map; if (!p) return;
    if (m.interior) { if (F.fishes.length) F.clearFish(); return; }
    F.spawnT -= dt; if (F.spawnT < 0) { F.spawnT = .6; if (F.fishes.length < 8) spawnFish(p, m); }
    const run = Math.hypot(p.vx, p.vz) > 4.5;
    for (const f of F.fishes.slice()) {
      if (f.m !== m || Math.hypot(f.x - p.x, f.z - p.z) > 30) { killFish(f); continue; }
      f.t += dt; let sp = .6;
      if (f.st === 'flee') { sp = 4; f.fade = (f.fade || 1) - dt; if (f.fade <= 0) { killFish(f); continue; } }
      else if (run && Math.hypot(f.x - p.x, f.z - p.z) < 3.2 && !p.fish) { f.st = 'flee'; const a = Math.atan2(f.x - p.x, f.z - p.z); f.gx = f.x + Math.sin(a) * 6; f.gz = f.z + Math.cos(a) * 6; }
      else if (f.st === 'swim' && Math.hypot(f.gx - f.x, f.gz - f.z) < .2) { const tx = Math.floor(f.x + (Math.random() - .5) * 6), tz = Math.floor(f.z + (Math.random() - .5) * 6); if (m.isWaterAt(tx + .5, tz + .5)) { f.gx = tx + .5; f.gz = tz + .5; } }
      else if (f.st === 'notice') { sp = .9; }
      const dx = f.gx - f.x, dz = f.gz - f.z, d = Math.hypot(dx, dz);
      if (d > .05 && f.st !== 'bite' && f.st !== 'nibble') { const nx = f.x + dx / d * sp * dt, nz = f.z + dz / d * sp * dt; if (m.isWaterAt(nx, nz) || f.st === 'flee') { f.x = nx; f.z = nz; } else { f.gx = f.x; f.gz = f.z; } f.yaw = Math.atan2(dx, dz); }
      const ws = m.isWaterT(Math.floor(f.x), Math.floor(f.z)) ? m.waterSurf(Math.floor(f.x), Math.floor(f.z)) : G.WS;
      f.mesh.position.set(f.x, ws + .015, f.z); f.mesh.rotation.y = f.yaw + Math.sin(f.t * 5) * .15; f.mesh.material.opacity = .42 * (f.fade == null ? 1 : Math.max(0, f.fade));
      if (f.fin) { f.fin.position.set(f.x, ws, f.z); f.fin.rotation.y = f.yaw; }
    }
  };
  // ---------- pêche liée aux ombres ----------
  F.fishTick = (fi, dt) => {
    fi.t += dt; const m = G.map, B = G.ents.bobber;
    if (fi.phase === 'wait') {
      if (!fi.fish) { let best = null, bd = 4.2; for (const f of F.fishes) { if (f.st !== 'swim' || f.m !== m) continue; const d = Math.hypot(f.x - fi.x, f.z - fi.z); if (d < bd) { bd = d; best = f; } } if (best && Math.random() < dt * 2) { fi.fish = best; best.st = 'notice'; } }
      if (fi.fish) { const f = fi.fish, a = Math.atan2(fi.x - f.x, fi.z - f.z); f.gx = fi.x - Math.sin(a) * (.25 + f.s * .4); f.gz = fi.z - Math.cos(a) * (.25 + f.s * .4); if (Math.hypot(f.gx - f.x, f.gz - f.z) < .15) { f.st = 'nibble'; fi.phase = 'nibble'; fi.nibs = 1 + Math.floor(Math.random() * 3); fi.nt = .7 + Math.random() * .6; } }
      if (fi.t > 9 && !fi.fish) { G.ui.toast("Rien ne mord… lance près d'une ombre de poisson."); G.act.stopFish(); }
    } else if (fi.phase === 'nibble') {
      fi.nt -= dt; if (fi.nt < 0) { if (fi.nibs-- > 0) { fi.dip = .22; fi.nt = .6 + Math.random() * .8; G.sfx('step', .8); G.fx.burst(fi.x, fi.y + .05, fi.z, 3, [0xffffff], .8, .3, 4); } else { fi.phase = 'bite'; fi.bt = fi.t; fi.dip = 1; G.sfx('bite'); G.fx.burst(fi.x, fi.y + .05, fi.z, 12, [0xffffff, 0xbfe6fa], 1.8, .5, 6); G.ui.toast('Ça mord ! Vite, F !'); } }
    } else if (fi.phase === 'bite' && fi.t - fi.bt > .95) { G.ui.toast("Le poisson s'est échappé…"); if (fi.fish) fi.fish.st = 'flee'; G.act.stopFish(); }
    fi.dip = Math.max(0, (fi.dip || 0) - dt * 3);
  };
  F.reel = () => {
    const p = G.player, fi = p.fish; if (!fi) return;
    if (fi.phase === 'bite' && fi.fish) {
      const id = fi.fish.kind, f = fi.fish; G.scene.remove(f.mesh); if (f.fin) G.scene.remove(f.fin); F.fishes.splice(F.fishes.indexOf(f), 1);
      G.sfx('catch'); G.fx.burst(fi.x, fi.y + .2, fi.z, 16, [0xffffff, 0xbfe6fa], 3, .6, 8); G.act.give(id, 1); F.mark(id); F.showOff(id);
      G.ui.toast('Tu as pêché : ' + G.ITEMS[id].n + ' ! ' + G.ITEMS[id].ico); if (id === 'requin') G.cam.shake(.2);
    } else if (fi.phase === 'nibble') { G.ui.toast('Trop tôt ! Le poisson a eu peur.'); if (fi.fish) fi.fish.st = 'flee'; }
    G.act.stopFish();
  };
})();
