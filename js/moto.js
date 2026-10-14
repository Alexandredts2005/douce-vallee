'use strict';
// ===== La moto : on la pose (catalogue en créatif, fabriquée à l'établi en survie), W pour monter et descendre (la touche W
// d'un clavier AZERTY), 3 vitesses au choix pendant la conduite (touches 1, 2, 3), on roule partout sur la terre ferme. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2;
  const COLS = [0xd8342c, 0x2f6fb8, 0x2f8f55, 0x1d1d22], CHROME = 0xcfd5da, DK = 0x1b1c20, TYRE = 0x18181a;
  const GEARS = [{ n: '🐢 Balade', max: 5 }, { n: '🛵 Normale', max: 9.5 }, { n: '🔥 Rapide', max: 15 }];
  // ---------- modèle : une moto classique (réservoir rond, selle, moteur à ailettes, échappement chromé, phare) ----------
  function roue(b, x) { b.add(new THREE.TorusGeometry(.255, .075, 10, 28), TYRE, b.M(x, .33, 0), 0, true); b.cyl(.19, .19, .045, 24, CHROME, x, .33, 0, PI / 2); b.cyl(.06, .06, .13, 12, DK, x, .33, 0, PI / 2);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.geo(new THREE.BoxGeometry(.012, .19, .012), CHROME, b.M(x + Math.cos(a) * .1, .33 + Math.sin(a) * .1, 0, 0, 0, a - PI / 2)); } }
  function corps(b, v) {
    const C = COLS[(v || 0) % 4];
    b.sph(.2, C, .12, .82, 0, 1.55, .78, .95, 0, 18, 12); b.box(.34, .02, .2, 0xf3ead6, .12, .9, 0); b.cyl(.04, .04, .03, 10, CHROME, .2, .98, 0); // réservoir, filet, bouchon
    b.box(.52, .09, .27, DK, -.32, .78, 0); b.box(.5, .05, .24, 0x2b2b30, -.33, .835, 0); b.box(.14, .1, .25, DK, -.6, .8, 0); // selle
    b.box(.34, .3, .24, 0x8b9096, .02, .45, 0); for (let k = 0; k < 5; k++) b.geo(new THREE.BoxGeometry(.3, .02, .3), 0xa9aeb4, b.M(.02, .36 + k * .055, 0)); b.cyl(.09, .09, .26, 14, 0x777c82, -.12, .42, 0, PI / 2); // moteur à ailettes
    b.geo(new THREE.CylinderGeometry(.045, .045, 1.05, 12), CHROME, b.M(-.33, .34, .17, 0, 0, PI / 2 - .06)); b.cyl(.055, .04, .2, 12, CHROME, -.9, .38, .17, 0, 0, PI / 2 - .12); // échappement
    for (const s of [-1, 1]) b.geo(new THREE.CylinderGeometry(.028, .028, .72, 8), CHROME, b.M(.61, .63, s * .09, 0, 0, -.33)); b.cyl(.045, .045, .2, 10, DK, .52, .95, 0, PI / 2); // fourche, colonne
    b.cyl(.016, .016, .66, 8, CHROME, .48, 1.03, 0, PI / 2); for (const s of [-1, 1]) { b.cyl(.026, .026, .11, 8, DK, .48, 1.03, s * .32, PI / 2); b.cyl(.008, .008, .14, 5, CHROME, .5, 1.1, s * .26); b.sph(.035, CHROME, .5, 1.18, s * .27, 1, 1, .4, 0, 8, 6); }
    b.cyl(.085, .075, .1, 16, CHROME, .66, .86, 0, 0, 0, PI / 2); b.cyl(.068, .068, .02, 16, 0xfff4c8, .715, .86, 0, 0, 0, PI / 2, 1); // phare
    b.box(.06, .05, .1, 0xff3a2a, -.78, .66, 0, 0, 0, 0, 1); b.box(.3, .03, .16, C, -.66, .7, 0, 0, 0, -.25); b.box(.32, .03, .14, C, .68, .64, 0, 0, 0, .35); // feu arrière, garde-boue
    for (const s of [-1, 1]) { b.box(.1, .02, .04, CHROME, .18, .3, s * .17); b.box(.1, .02, .04, CHROME, -.38, .44, s * .16); } b.box(.4, .04, .05, DK, -.42, .48, .14, 0, 0, .55); // repose-pieds, bras arrière
  }
  MD.moto = v => { const b = G.mb(870 + (v || 0)); corps(b, v); roue(b, .68); roue(b, -.68); return b.done(); };
  MD.moto_corps = v => { const b = G.mb(870 + (v || 0)); corps(b, v); return b.done(); };
  MD.moto_roue = () => { const b = G.mb(879); roue(b, 0); const g = b.done(); g.translate(0, -.33, 0); return g; };
  O.moto = { id: 'moto', n: 'Moto', model: 'moto', v: 0, fp: [2, 1], h: .9, take: 1, cat: 'construction', balloon: 1, moto: 1 };
  G.ITEMS.moto = { id: 'moto', n: 'Moto', stack: 1, sell: 1800, kind: 'place', obj: 'moto', cat: 'construction', thumb: 'obj:moto' };
  G.RECIPES.push({ id: 'moto', need: { fer: 12, bois: 4, pierre: 6 } });
  // ---------- son du moteur ----------
  const ENG = { on: false, start() { const A = G.audio; if (!A || !A.ok || ENG.on) return; const c = A.ctx; ENG.o = c.createOscillator(); ENG.o2 = c.createOscillator(); ENG.f = c.createBiquadFilter(); ENG.g = c.createGain();
      ENG.o.type = 'sawtooth'; ENG.o2.type = 'square'; ENG.f.type = 'lowpass'; ENG.f.frequency.value = 520; ENG.g.gain.value = 0; ENG.o.connect(ENG.f); ENG.o2.connect(ENG.f); ENG.f.connect(ENG.g); ENG.g.connect(A.sfxG); ENG.o.start(); ENG.o2.start(); ENG.on = true; },
    set(rpm, vol) { if (!ENG.on) return; const t = G.audio.ctx.currentTime; ENG.o.frequency.setTargetAtTime(38 + rpm * 70, t, .08); ENG.o2.frequency.setTargetAtTime(19 + rpm * 35, t, .08); ENG.g.gain.setTargetAtTime(vol, t, .1); },
    stop() { if (!ENG.on) return; try { ENG.g.gain.value = 0; ENG.o.stop(); ENG.o2.stop(); } catch (e) { } ENG.on = false; } };
  // ---------- petit tableau de bord ----------
  const hud = document.createElement('div'); hud.id = 'moto-hud'; hud.hidden = true;
  hud.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:40;background:rgba(30,26,22,.78);color:#fff;font:700 14px Nunito,sans-serif;padding:8px 14px;border-radius:16px;text-align:center;pointer-events:none;line-height:1.5';
  document.body.appendChild(hud);
  const hudUpd = v => { if (hud.hidden || (v.hudT = (v.hudT || 0) + 1) % 5) return; hud.innerHTML = `🏍️ <b>${Math.round(Math.abs(v.spd) * 7)} km/h</b> · vitesse <b>${v.gear + 1}</b> ${GEARS[v.gear].n}<br><span style="font-size:12px;opacity:.85">1 2 3 : vitesses · W : ranger · E : garer</span>`; };
  // ---------- monter / descendre ----------
  const nearMoto = () => { const m = G.map, p = G.player, [tx, tz] = p.target(); let o = m.objAt(tx, tz); if (o && o.t === 'moto') return o; let best = null, bd = 2.6;
    for (const q of m.list) if (q.t === 'moto') { const [cx, cz] = m.center(q), d = Math.hypot(cx - p.x, cz - p.z); if (d < bd) { bd = d; best = q; } } return best; };
  // on enfourche une moto en (x, z), tournée vers h ; pop : elle sort de la poche avec une petite animation
  function ride(x, z, h, v, pop) {
    const m = G.map, p = G.player;
    const grp = new THREE.Group(), body = new THREE.Mesh(G.getGeo('moto_corps', v), G.MATS), w1 = new THREE.Mesh(G.getGeo('moto_roue', 0), G.MATS), w2 = new THREE.Mesh(G.getGeo('moto_roue', 0), G.MATS);
    for (const k of [body, w1, w2]) { k.castShadow = true; k.frustumCulled = false; grp.add(k); } w1.position.set(.68, .33, 0); w2.position.set(-.68, .33, 0); grp.rotation.order = 'YXZ'; G.scene.add(grp);
    p.fish && G.act.stopFish(); p.emote = null; p.root.rotation.order = 'YXZ'; G.motoColor = v;
    p.vehicle = { moto: 1, o: { t: 'moto', r: 0, v }, v, x, z, y: m.topAt(x, z), vy: 0, h, spd: 0, gear: G.motoGear || 1, mesh: grp, w1, w2, t: 0, lean: 0, camFn, anim: pop ? { k: 'in', t: 0 } : null };
    if (pop) { grp.scale.setScalar(.01); G.sfx('pop'); G.fx.burst(x, m.topAt(x, z) + .5, z, 16, [0xffffff, 0xf3ead2, 0xffe08a], 2.6, .55, 6); }
    ENG.start(); hud.hidden = false; G.sfx('place', .6); G.ui.toast('🏍️ En route ! Avance, freine et tourne comme pour marcher · 1, 2, 3 : vitesses · W : ranger la moto · E : la garer ici.', 6000);
  }
  function mount(o) { const m = G.map, p = G.player; if (p.vehicle || p.swim || p.sit) return; const [cx, cz] = m.center(o), r = o.r || 0, v = o.v || 0; m.removeObj(o); ride(cx, cz, r * PI / 2 + PI / 2, v, false); if (p.vehicle) p.vehicle.fromObj = 1; }
  // W : la moto sort de la poche (créatif : toujours ; survie : s'il y en a une dans l'inventaire), sinon on prend celle garée à côté
  function deploy() {
    const p = G.player, m = G.map; if (p.vehicle || p.swim || p.sit || p.dead || !p.onGround) return; const near = nearMoto(), have = G.inv.count('moto') >= 1, nd = near ? Math.hypot(m.center(near)[0] - p.x, m.center(near)[1] - p.z) : 99;
    if (near && (nd < 1.6 || !have)) return mount(near);
    if (!have) { G.ui.toast('Il te faut une moto : fabrique-la à l\'établi (C).'); G.sfx('error'); return; }
    if (G.mode !== 'creatif') G.inv.remove('moto', 1);
    ride(p.x, p.z, p.yaw, G.motoColor || 0, true);
  }
  // W en roulant : arrêt net, la moto se replie et retourne dans l'inventaire
  function stow() { const p = G.player, v = p.vehicle; if (!v || !v.moto || v.anim) return; if (v.fromObj && G.net && G.net.visit) return dismount(); /* la moto d'un ami : on la regare, on ne l'emporte pas */ v.spd = 0; v.anim = { k: 'out', t: 0 }; G.sfx('pickup'); ENG.set(.2, .01); }
  function stowDone(p, v) {
    G.fx.burst(v.x, v.y + .5, v.z, 14, [0xffffff, 0xf3ead2], 2.2, .5, 6); leave(p, v); p.teleport(v.x, v.z, v.h); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true);
    if (G.mode !== 'creatif' && G.inv.add('moto', 1) > 0) { const m = G.map; if (m.canPlace('moto', Math.round(v.x - 1), Math.round(v.z - .5), 0)) m.addObj('moto', Math.round(v.x - 1), Math.round(v.z - .5), 0, { v: v.v }); G.ui.toast('Inventaire plein : la moto est garée ici.'); }
    else G.ui.toast(G.mode === 'creatif' ? '🏍️ Moto rangée.' : '🏍️ Moto rangée dans ton inventaire.');
  }
  function dismount() {
    const p = G.player, v = p.vehicle, m = G.map; if (!v || !v.moto) return; if (Math.abs(v.spd) > 3) { G.ui.toast('Ralentis avant de descendre.'); return; }
    if (G.net && G.net.visit && !v.fromObj) return stow(); // chez un ami : sa propre moto retourne dans la poche
    const r = ((Math.round((v.h - PI / 2) / (PI / 2)) % 4) + 4) % 4, [w, d] = G.fpDims(O.moto, r); let spot = null;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const ax = Math.round(v.x - w / 2) + dx, az = Math.round(v.z - d / 2) + dz; if (m.canPlace('moto', ax, az, r)) { spot = [ax, az]; break; } }
    if (!spot) { G.ui.toast('Pas de place pour garer la moto ici.'); G.sfx('error'); return; }
    m.addObj('moto', spot[0], spot[1], r, { v: v.v }); leave(p, v); const sx = v.x + Math.cos(v.h) * .9, sz = v.z - Math.sin(v.h) * .9; p.teleport(sx, sz, v.h); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true); G.sfx('place', .5);
  }
  let lastToggle = 0;
  function leave(p, v) { lastToggle = performance.now(); G.scene.remove(v.mesh); p.vehicle = null; ENG.stop(); hud.hidden = true; G.clearPose && G.clearPose(p.C); if (p.toolMesh) p.toolMesh.visible = true; p.root.rotation.set(0, p.yaw, 0); p.root.rotation.order = 'XYZ'; p.blob.visible = true; G.cam.cx = 0; }
  G.motoLeave = () => { const p = G.player; if (p && p.vehicle && p.vehicle.moto) leave(p, p.vehicle); };
  // ---------- ce qui arrête vraiment la moto : falaises, bâtiments, troncs d'arbres, gros rochers, habitants (pas les fleurs ni l'herbe) ----------
  const small = (o, d) => d.walk || G.isFlowerObj(o) || (d.pick && !d.enter) || (!d.enter && !d.chop && (d.h || 0) < .55);
  // hauteur du sol roulable (pont, ponton compris) ; null = pas de sol (eau)
  function ground(m, x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return null; const o = m.objAt(tx, tz), d = o && O[o.t];
    if (d && d.walk) return m.topAt(x, z); if (m.isWaterAt(x, z)) return null; return m.terrainH(x, z); }
  // le sommet de ce qui se dresse en (x, z) (terrain ou objet), pour savoir si on bute ou si on peut sauter par-dessus
  function obstacle(m, x, z) { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return 99; const o = m.objAt(tx, tz), d = o && O[o.t]; let top = m.terrainH(x, z);
    if (o && !small(o, d)) { const fp = G.fpDims(d, o.r || 0); if (d.chop >= 3 || (fp[0] * fp[1] === 1 && !d.enter)) { if (Math.hypot(x - tx - .5, z - tz - .5) < .34) top = Math.max(top, o.y + Math.min(d.h || 3, 4)); } else top = Math.max(top, m.topAt(x, z)); }
    for (const e of G.ents.villagers) if (e.map === m && e.visible && Math.hypot(e.x - x, e.z - z) < .42) top = Math.max(top, e.y + 3);
    return top; }
  // la moto (deux roues et le milieu, un peu de largeur) tient-elle en (x, z) à la hauteur y ?
  function fits(m, x, z, h, y, air) { const fx = Math.sin(h), fz = Math.cos(h), lim = y + (air ? .15 : .62);
    for (const [a, b] of [[.78, 0], [0, 0], [-.6, 0], [.4, .2], [.4, -.2], [-.3, .2], [-.3, -.2]]) { const px = x + fx * a + fz * b, pz = z + fz * a - fx * b; if (obstacle(m, px, pz) > lim || (!air && ground(m, px, pz) === null)) return false; } return true; }
  // ---------- caméra de poursuite ----------
  function camFn(camera, C, dt, mouse) { const v = G.player.vehicle, k = 1 - Math.exp(-dt * (mouse ? 7 : 3)); if (mouse) C.yaw = G.angLerp(C.yaw, C.tyaw, k); else { C.yaw = G.angLerp(C.yaw, v.h + PI, k); C.tyaw = C.yaw; }
    const dist = 5 + Math.abs(v.spd) * .16, pitch = mouse ? G.clamp(C.mp, .05, 1.1) : .36, tx = v.x, ty = v.y + 1.05, tz = v.z, kk = Math.min(1, 10 * dt);
    if (!C.cx) { C.cx = tx; C.cy = ty; C.cz = tz; } C.cx += (tx - C.cx) * kk; C.cy += (ty - C.cy) * kk; C.cz += (tz - C.cz) * kk;
    const hd = Math.cos(pitch) * dist; camera.position.set(C.cx + Math.sin(C.yaw) * hd, C.cy + Math.sin(pitch) * dist, C.cz + Math.cos(C.yaw) * hd);
    const gh = G.map.terrainH(camera.position.x, camera.position.z); if (gh < 40 && camera.position.y < gh + .9) camera.position.y = gh + .9; camera.lookAt(C.cx, C.cy, C.cz); return true; }
  // ---------- conduite ----------
  G.on('init', () => {
    const F = G.feat, ob = F.board; F.board = o => O[o.t] && O[o.t].moto ? mount(o) : ob(o);
    const ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (!v || !v.moto) return ou(p, dt);
      const I = G.input, m = G.map, free = G.ui.canPlay(); dt = Math.min(dt, .05); v.t += dt; let gas = 0, steer = 0;
      if (free) { if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1; if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1;
        if (I.gp && I.gp.on) { steer += I.gp.lx; gas -= I.gp.ly; if (I.gp.b[7]) gas += 1; if (I.gp.b[6]) gas -= 1; } if (I.touch) { steer += I.touch.mx; gas -= I.touch.my; }
        steer = G.clamp(steer, -1, 1); gas = G.clamp(gas, -1, 1);
        for (let g = 0; g < 3; g++) if (I.hit('Digit' + (g + 1), 'Numpad' + (g + 1)) && v.gear !== g) { v.gear = g; G.motoGear = g; G.sfx('ui'); G.ui.toast('Vitesse ' + (g + 1) + ' : ' + GEARS[g].n); }
        if (I.hit('KeyZ') || G.input.chars.moto) { G.input.chars.moto = false; stow(); } if (I.hit('KeyE')) { dismount(); if (!p.vehicle) return; } }
      // animation : la moto se déplie en sortant de la poche, se replie quand on la range
      if (v.anim) { const a = v.anim, D = a.k === 'in' ? .45 : .35; a.t += dt; const u = Math.min(1, a.t / D), b = u - 1, s = a.k === 'in' ? 1 + 2.70158 * b * b * b + 1.70158 * b * b : 1 - u * u;
        v.mesh.scale.setScalar(Math.max(.01, s)); gas = 0; steer = 0; if (a.k === 'out') v.spd = 0;
        if (u >= 1) { if (a.k === 'in') { v.anim = null; v.mesh.scale.setScalar(1); } else { stowDone(p, v); return; } } }
      const max = GEARS[v.gear].max, target = gas > 0 ? max * gas : gas < 0 ? (v.spd > .5 ? 0 : -2.5) : 0, acc = gas < 0 && v.spd > .5 ? 14 : 3 + v.gear * 1.6;
      if (!v.air) v.spd += G.clamp(target - v.spd, -acc * dt * (gas ? 1 : .7), acc * dt);
      v.h -= steer * 2.3 * G.clamp(Math.abs(v.spd) / 3, .25, 1) / (1 + Math.abs(v.spd) * .05) * dt * (v.spd < -.1 ? -1 : 1);
      const dir = v.spd >= 0 ? 1 : -1, aspd = Math.abs(v.spd);
      // on s'écarte doucement de ce qui arrive devant
      if (!v.air && aspd > 1.5) { const L = 1.3 + aspd * .16, ahead = a => { const hx = Math.sin(v.h + a) * dir, hz = Math.cos(v.h + a) * dir; return obstacle(m, v.x + hx * L, v.z + hz * L) > v.y + 1.7 || obstacle(m, v.x + hx * L * .55, v.z + hz * L * .55) > v.y + 1.7; };
        if (ahead(0)) { for (const a of [.3, .55, .8]) { const l = !ahead(a), r = !ahead(-a); if (l || r) { const sg = l && r ? (steer >= 0 ? -1 : 1) : l ? 1 : -1; v.h += sg * Math.min(1.8 * dt * (1 + aspd * .05), .06); break; } } } }
      const fx = Math.sin(v.h), fz = Math.cos(v.h), nx = v.x + fx * v.spd * dt, nz = v.z + fz * v.spd * dt;
      if (fits(m, nx, nz, v.h, v.y, v.air)) { v.x = nx; v.z = nz; }
      else if (!v.air && aspd > 1) {
        const la = (1.0 + aspd * dt) * dir, tx = v.x + fx * la, tz = v.z + fz * la, wet = ground(m, tx, tz) === null, top = obstacle(m, tx, tz);
        let jumped = false;
        if (wet) { for (let d = 1.2; d <= 7; d += .3) { const gx = v.x + fx * d * dir, gz = v.z + fz * d * dir, g = ground(m, gx, gz); if (g === null) continue; const D = d + .95, cx = v.x + fx * D * dir, cz = v.z + fz * D * dir, cg = ground(m, cx, cz); if (g <= v.y + .7 && cg !== null && fits(m, cx, cz, v.h, Math.max(g, cg), false)) { v.vy = Math.sqrt(2 * 22 * (.8 + D * .07)); v.jspd = Math.max(aspd, (D + .3) / (2 * v.vy / 22)) * dir; jumped = true; } break; } } // l'eau : on saute jusqu'à l'autre rive
        else if (top <= v.y + 1.7) { // un petit obstacle : on saute par-dessus, seulement si on peut retomber de l'autre côté
          const lx = v.x + fx * (la + 1.1 * dir), lz = v.z + fz * (la + 1.1 * dir), lg = ground(m, lx, lz);
          if (lg !== null && lg <= top + .2 && fits(m, lx, lz, v.h, lg, false)) { v.vy = Math.sqrt(2 * 22 * (top - v.y + .55)); v.jspd = Math.max(aspd, 3) * dir; jumped = true; } }
        if (jumped) { v.air = true; v.spd = v.jspd; G.sfx('jump', .5); G.fx.puff(v.x, v.y + .1, v.z, 6, 0xf3ead2, .6); }
        else { // un mur, une maison, un arbre : on glisse le long, ou de face on tourne vers le côté le plus libre
          const ax = fits(m, nx, v.z, v.h, v.y, false), az = fits(m, v.x, nz, v.h, v.y, false), cx = Math.abs(fx), cz = Math.abs(fz), alongX = ax && cx > .25 && (!az || cz <= .25 || cx >= cz);
          if (alongX || (az && cz > .25)) { if (alongX) v.x = nx; else v.z = nz; v.spd *= Math.pow(.55, dt); v.h = G.angLerp(v.h, alongX ? Math.atan2(Math.sign(fx) * dir, 0) : Math.atan2(0, Math.sign(fz) * dir), Math.min(1, 2.5 * dt)); }
          else { const side = a => fits(m, v.x + Math.sin(v.h + a) * .7 * dir, v.z + Math.cos(v.h + a) * .7 * dir, v.h + a, v.y, false), sg = steer ? -Math.sign(steer) : side(1.1) ? 1 : side(-1.1) ? -1 : 1;
            v.h += sg * 2.4 * dt; if (aspd > 6) { G.cam.shake && G.cam.shake(.2); G.sfx('hurt', .3); } v.spd *= Math.pow(.2, dt); } } }
      else if (!v.air) v.spd *= .5;
      p.x = v.x; p.z = v.z; p.y = v.y;
      const gy = ground(m, v.x, v.z);
      if (v.air || gy === null || gy < v.y - .08) { v.air = true; v.vy -= 22 * dt; v.y += v.vy * dt;
        if (gy !== null && v.y <= gy && v.vy <= 0) { v.y = gy; v.vy = 0; v.air = false; G.sfx('land', .5); G.fx.puff(v.x, gy + .05, v.z, 5, 0xf3ead2, .5); }
        else if (gy === null && v.vy < 0 && v.y < (m.waterSurf ? m.waterSurf(Math.floor(v.x), Math.floor(v.z)) : 0) + .1) { // tombée à l'eau : retour sur la rive
          const s0 = v.safe || { x: v.x, z: v.z, y: 0 }; v.x = s0.x; v.z = s0.z; v.y = s0.y; v.vy = 0; v.spd = 0; v.air = false; G.sfx('splash', .6); } }
      else { v.vy = 0; v.y = gy; if ((v.safeT = (v.safeT || 0) + dt) > .3) { v.safeT = 0; v.safe = { x: v.x, z: v.z, y: v.y }; } }
      v.lean += (-steer * G.clamp(Math.abs(v.spd) / 8, 0, 1) * .38 - v.lean) * Math.min(1, 6 * dt);
      const M = v.mesh; M.position.set(v.x, v.y, v.z); M.rotation.set(-v.lean, v.h - PI / 2, 0); const spin = v.spd * dt / .33; v.w1.rotation.z -= spin; v.w2.rotation.z -= spin;
      // le pilote : assis, pieds sur les repose-pieds, mains au guidon, il se penche dans les virages
      p.yaw = v.h; p.vx = p.vz = p.vy = 0; p.onGround = true; p.swim = false; p.animate(dt, 0); const C = p.C;
      if (G.applyPose) G.applyPose(C, { bob: -.3, lean: .18, thigh: -1.15, shin: .95, arm: -1.15, fore: -.35, armZ: .16 }); C.armL.rotation.z = -.16 - steer * .08; C.armR.rotation.z = .16 - steer * .08;
      p.y = v.y + .82 - (-.3 + .64 * Math.cos(.18)); p.place(); p.root.position.set(v.x - fx * .36, p.y, v.z - fz * .36); if (p.toolMesh) p.toolMesh.visible = false; p.root.rotation.set(0, v.h, -v.lean, 'YXZ'); p.blob.visible = false;
      if (Math.abs(v.spd) > .5 && (v.puff = (v.puff || 0) - dt) < 0) { v.puff = .12; G.fx.one(v.x - fx * .95, v.y + .38, v.z - fz * .95, -fx * .4, .3, -fz * .4, 2.2, -.02, 0xd9d9d9, .1, .8); }
      ENG.set(.35 + Math.abs(v.spd) / GEARS[v.gear].max * (1 + v.gear * .5), .025 + Math.min(.05, Math.abs(v.spd) * .004)); hudUpd(v); };
    const og = G.toTitle; G.toTitle = () => { G.motoLeave(); return og(); };
    // bouton tactile 🏍️
    const tk = document.getElementById('tb-take'); if (tk && !document.getElementById('tb-moto')) { const b = tk.cloneNode(false); b.id = 'tb-moto'; b.textContent = '🏍️'; b.title = 'Moto : monter / descendre'; b.style.right = '290px';
      b.addEventListener('pointerdown', e => { e.preventDefault(); const p = G.player; if (p.vehicle && p.vehicle.moto) G.input.chars.moto = true; else deploy(); }); tk.parentNode.appendChild(b); }
  });
  // W (touche W d'un clavier AZERTY = code KeyZ) : monter sur la moto la plus proche
  G.motoDeploy = deploy;
  G.on('update', () => { const p = G.player, I = G.input; if (!p || p.vehicle || G.state !== 'play' || G.ui.modal || !I.hit('KeyZ') || performance.now() - lastToggle < 300) return; if (G.map.interior) return;
    if (G.garage) return G.garage.open(); deploy(); });
})();
