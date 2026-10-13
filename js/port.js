'use strict';
// ===== Le port du village : devant la place, une vraie jetée en T avec des bateaux amarrés. On prend la barre (E) :
// le voilier du capitaine emmène sur l'île, les autres bateaux vont où l'on veut sur la mer (même au large),
// et des barques attendent au bord des rivières et des lacs pour s'y promener. =====
(function () {
  const PI = Math.PI, O = G.OBJ;
  // 0 voilier, 1 pointu, 2 canot Riva, 3 chalutier, 4 barque
  const SPEC = [{ n: 'le voilier', max: 6, acc: 2.2, turn: 1.3, L: 1.1, seat: .32 }, { n: 'le pointu', max: 6.5, acc: 2.6, turn: 1.5, L: .95, seat: .3 }, { n: 'le canot', max: 9.5, acc: 4, turn: 1.7, L: 1.05, seat: .3 },
    { n: 'le chalutier', max: 5, acc: 1.8, turn: 1.1, L: 1.2, seat: .42 }, { n: 'la barque', max: 3.2, acc: 1.8, turn: 1.9, L: .85, seat: .14 }];
  const vOf = o => ((o.v || 0) % 5 + 5) % 5;
  O.bateau.balloon = 1; O.bateau.vessel = 1; // « E » devant un bateau : on monte à bord
  // ---------- l'eau sous la coque (au-delà de la carte, la mer continue au sud) ----------
  const LIM = 170;
  function waterAt(m, x, z) {
    const tx = Math.floor(x), tz = Math.floor(z), sea = m.meta.seaZ || m.H - G.SEA;
    if (!m.inb(tx, tz)) return z >= sea && x > -LIM && x < m.W + LIM && z < m.H + LIM ? 2 : 0;
    const i = m.idx(tx, tz); if (!m.water[i]) return 0; const o = m.occ[i] ? m.objs[m.occ[i] - 1] : null; if (o && o.t !== 'pont') return 0; return m.water[i];
  }
  const surfAt = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); return m.inb(tx, tz) && m.water[m.idx(tx, tz)] ? m.waterSurf(tx, tz) : G.WS; };
  const okHull = (v, x, z, h) => { const fx = Math.cos(h), fz = -Math.sin(h), L = SPEC[v.v].L; for (const k of [-1, 0, 1]) { const w = waterAt(v.m, x + fx * L * k, z + fz * L * k); if (!w || (v.v !== 4 && w !== 2)) return false; } return true; };
  // ---------- monter à bord ----------
  function board(o) {
    const p = G.player, m = G.map, v = vOf(o), [cx, cz] = m.center(o), P = m.meta.pier;
    // le voilier amarré près du capitaine : c'est la traversée vers l'île (ou le retour au village)
    if (v === 0 && P && Math.hypot(cx - P.x, cz - P.z) < 6 && G.ents.villagers.some(c => c.npc === 'capitaine' && c.map === m)) return (m.meta.island || m.kind === 'ile') ? G.travel.home() : G.travel.island();
    if (v !== 4 && m.water[m.idx(Math.floor(cx), Math.floor(cz))] !== 2) { G.ui.toast('Ce bateau ne navigue qu\'en mer.'); return; }
    m.removeObj(o); const mesh = new THREE.Mesh(G.getGeo('boat', v), G.MATS); mesh.castShadow = true; mesh.frustumCulled = false; G.scene.add(mesh);
    p.fish && G.act.stopFish(); p.sit = null; p.emote = null; p.swim = false;
    p.vehicle = { boat2: 1, o: { t: 'bateau', r: o.r || 0 }, v, m, mesh, x: cx, z: cz, h: (o.r || 0) * PI / 2, spd: 0, ws: surfAt(m, cx, cz), t: 0, wake: 0 };
    G.sfx('splash', .4); G.ui.toast('⛵ Tu prends ' + SPEC[v].n + ' ! Avance, recule et tourne comme pour marcher · E pour accoster près d\'une rive ou d\'un ponton.', 7000);
  }
  // ---------- accoster : le bateau est amarré là, on descend sur la terre la plus proche ----------
  function dock(p, v) {
    const m = v.m; if (Math.abs(v.spd) > 1.5) { G.ui.toast('Ralentis (S) avant d\'accoster.'); return; }
    let land = null, bd = 1e9; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const tx = Math.floor(v.x) + dx, tz = Math.floor(v.z) + dz; if (!m.inb(tx, tz)) continue; const i = m.idx(tx, tz);
      if (m.water[i] && !(m.occ[i] && G.OBJ[m.objs[m.occ[i] - 1].t].walk)) continue; if (m.occ[i] && !G.OBJ[m.objs[m.occ[i] - 1].t].walk) continue; const d = Math.hypot(tx + .5 - v.x, tz + .5 - v.z); if (d < bd) { bd = d; land = [tx + .5, tz + .5]; } }
    if (!land || bd > 3.2) { G.ui.toast('Approche-toi d\'une rive ou d\'un ponton pour descendre.'); return; }
    const r = ((Math.round(v.h / (PI / 2)) % 4) + 4) % 4, [w, d] = G.fpDims(O.bateau, r); let spot = null;
    for (let k = 0; k < 9 && !spot; k++) { const ox = Math.round(v.x - w / 2) + [0, 1, -1, 0, 0, 1, -1, 1, -1][k], oz = Math.round(v.z - d / 2) + [0, 0, 0, 1, -1, 1, 1, -1, -1][k]; if (m.canPlace('bateau', ox, oz, r)) spot = [ox, oz]; }
    if (!spot) { G.ui.toast('Pas assez de place pour amarrer le bateau ici.'); return; }
    m.addObj('bateau', spot[0], spot[1], r, { v: v.v }); G.scene.remove(v.mesh); p.vehicle = null; G.clearPose && G.clearPose(p.C);
    p.teleport(land[0], land[1], Math.atan2(land[0] - v.x, land[1] - v.z)); p.root.visible = true; G.sfx('place', .6);
  }
  // ---------- piloter ----------
  G.on('init', () => {
    const F = G.feat, ob = F.board; F.board = o => O[o.t] && O[o.t].vessel ? board(o) : ob(o);
    const ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (!v || !v.boat2) return ou(p, dt);
      const I = G.input, S = SPEC[v.v], free = G.ui.canPlay(); dt = Math.min(dt, .05); v.t += dt; let gas = 0, steer = 0;
      if (free) { if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1; if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1;
        if (I.gp && I.gp.on) { steer += I.gp.lx; gas -= I.gp.ly; } if (I.touch) { steer += I.touch.mx; gas -= I.touch.my; }
        steer = G.clamp(steer, -1, 1); gas = G.clamp(gas, -1, 1); if (I.hit('KeyE')) { dock(p, v); if (!p.vehicle) return; } }
      const target = gas > 0 ? S.max * gas : gas < 0 ? S.max * .35 * gas : 0; v.spd += G.clamp(target - v.spd, -S.acc * 1.6 * dt, S.acc * dt);
      v.h -= steer * S.turn * dt * G.clamp(Math.abs(v.spd) / 2, .3, 1) * (v.spd < -.1 ? -1 : 1);
      const nx = v.x + Math.cos(v.h) * v.spd * dt, nz = v.z - Math.sin(v.h) * v.spd * dt;
      if (okHull(v, nx, nz, v.h)) { v.x = nx; v.z = nz; } else { if (Math.abs(v.spd) > 2) G.cam.shake && G.cam.shake(.2); v.spd *= -.25; }
      v.ws += (surfAt(v.m, v.x, v.z) - v.ws) * Math.min(1, 6 * dt);
      const bob = Math.sin(v.t * 2.1) * .05, roll = Math.sin(v.t * 1.6) * .04 + steer * G.clamp(v.spd / S.max, -1, 1) * .08, pitch = -G.clamp(v.spd / S.max, -1, 1) * .05;
      v.mesh.position.set(v.x, v.ws - .05 + bob, v.z); v.mesh.rotation.set(roll, v.h, pitch, 'YXZ');
      // le joueur assis à la barre (ou aux rames)
      const fx = Math.cos(v.h), fz = -Math.sin(v.h), back = v.v === 4 ? .05 : .4;
      p.x = v.x - fx * back; p.z = v.z - fz * back; p.yaw = Math.atan2(fx, fz); p.vx = p.vz = p.vy = 0; p.onGround = true;
      p.animate(dt, 0); const C = p.C, q = G.sitPose ? G.sitPose(0, 'banquette') : { bob: -.3 }; if (G.applyPose) G.applyPose(C, q);
      if (v.v === 4) { const k = Math.abs(v.spd) > .2 ? Math.sin(v.t * 5.5) : 0; C.armL.rotation.x = C.armR.rotation.x = -1.05 + k * .45; C.body.rotation.x = .1 + k * .12; } else { C.armL.rotation.x = C.armR.rotation.x = -1.0; C.armR.rotation.z = .15; C.armL.rotation.z = -.15; }
      p.y = v.mesh.position.y + S.seat + .04 - (q.bob + .64); p.place(); p.blob.visible = false;
      if (!G.mouseMode()) G.cam.tyaw = Math.atan2(-fx, -fz);
      if (Math.abs(v.spd) > .8 && (v.wake -= dt) < 0) { v.wake = .05; G.fx.one(v.x - fx * S.L * 1.1 + (Math.random() - .5) * .5, v.ws + .05, v.z - fz * S.L * 1.1 + (Math.random() - .5) * .5, (Math.random() - .5) * .5, .4, (Math.random() - .5) * .5, .6, 2, 0xffffff, .13, 1); }
    };
  });
  // ---------- un vrai port devant la place : jetée en T, bateaux amarrés, lanternes, caisses ----------
  function bigPort(m) {
    const P = m.meta.pier; if (!P || m.meta.port2 || m.meta.island || m.interior) return; m.meta.port2 = 1;
    const jx = Math.floor(P.x) - 1, sz = Math.round(P.z - 4.5), tz = sz + 7, put = (t, x, z, r = 0, ex) => m.canPlace(t, x, z, r) ? m.addObj(t, x, z, r, ex) : null;
    for (let z = sz + 2; z < tz; z++) for (const x of [jx, jx + 1]) put('ponton', x, z);
    for (let z = tz; z < tz + 2; z++) for (let x = jx - 7; x <= jx + 8; x++) put('ponton', x, z);
    for (const [x, v] of [[jx - 7, 2], [jx - 4, 1], [jx + 3, 3], [jx + 6, 2]]) put('bateau', x, tz + 3, 0, { v });
    for (const x of [jx - 7, jx + 8]) put('lanterne', x, tz); put('caisse', jx - 3, tz); put('tonneau', jx - 2, tz); put('caisse', jx + 4, tz + 1); put('tonneau', jx + 5, tz);
    put('panneau', jx - 1, sz - 2, 0, { txt: 'Port : E devant un bateau pour prendre la barre. Le voilier du capitaine va sur l\'île !' });
    m.flush && m.flush();
  }
  // ---------- des barques au bord des rivières et des lacs ----------
  function barques(m) {
    if (m.meta.barques || m.interior || !m.meta.layout) return; m.meta.barques = 1;
    const c = m.meta.plaza || m.meta.spawn || { x: m.W / 2, z: m.H / 2 }, n = Math.max(3, Math.round(3 * m.W * m.H / 40000)), cand = [];
    for (let z = 4; z < m.H - 4; z += 2) for (let x = 4; x < m.W - 4; x += 2) { const i = m.idx(x, z); if (m.water[i] !== 1) continue; let shore = false;
      for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const j = m.idx(x + dx, z + dz); if (!m.water[j]) shore = true; } if (shore) cand.push([Math.hypot(x - c.x, z - c.z), x, z]); }
    cand.sort((a, b) => a[0] - b[0]); const done = [];
    for (const [, x, z] of cand) { if (done.length >= n) break; if (done.some(([a, b]) => Math.hypot(a - x, b - z) < 35)) continue;
      for (const r of [0, 1]) if (m.canPlace('bateau', x, z, r)) { m.addObj('bateau', x, z, r, { v: 4 }); done.push([x, z]); break; } }
  }
  G.on('worldgen', m => { bigPort(m); barques(m); });
  G.on('load', () => { const m = G.world; if (!m) return; bigPort(m); barques(m); m.flush(); });
})();
