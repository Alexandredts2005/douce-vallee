'use strict';
// ===== Mouvements vivants pour tous les personnages (joueur, habitants, visiteurs, aperçu de la garde-robe) :
// le bassin tourne avec les pas et le buste en sens inverse, la poitrine se soulève en respirant, le corps penche dans les virages,
// le genou se plie quand la jambe passe, les coudes se plient en courant ; cheveux longs, queues de cheval et tresses
// suivent l'élan, les virages, les sauts et le vent (ressort amorti). Rien à faire dans les animations existantes :
// tout est déduit du mouvement du personnage et de l'angle de ses jambes, après elles, à chaque image. =====
(function () {
  const LIVE = new Set(), P = new THREE.Vector3(), PI = Math.PI;
  const omc = G.makeChar; G.makeChar = o => { const C = omc(o); if (C && C.chest) LIVE.add(C); return C; };
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const kneeBase = a => a > 0 ? a * 1.1 : a < -1.05 ? -a * .96 : -a * .25, elbowBase = a => -(.16 + Math.max(0, -a) * .17 + Math.max(0, a) * .04);
  function upd(C, dt, t) {
    let s = C._mv; C.root.updateMatrixWorld(); P.setFromMatrixPosition(C.root.matrixWorld); const yaw = C.root.rotation.y;
    if (!s) s = C._mv = { p: P.clone(), vx: 0, vz: 0, vy: 0, yaw, lL: C.legL.rotation.x, lR: C.legR.rotation.x, hx: 0, hz: 0, wx: 0, wz: 0, bank: 0, ph: Math.random() * 6 };
    let vx = (P.x - s.p.x) / dt, vy = (P.y - s.p.y) / dt, vz = (P.z - s.p.z) / dt; if (vx * vx + vz * vz > 900 || Math.abs(vy) > 40) { vx = vz = vy = 0; } // téléportation
    const ax = (vx - s.vx) / dt, az = (vz - s.vz) / dt, ay = (vy - s.vy) / dt; s.vx = vx; s.vy = vy; s.vz = vz; s.p.copy(P);
    const sy = Math.sin(yaw), cy = Math.cos(yaw), vf = vx * sy + vz * cy, vs = vx * cy - vz * sy, af = ax * sy + az * cy, as = ax * cy - az * sy, spd = Math.hypot(vx, vz);
    const yr = wrap(yaw - s.yaw) / dt; s.yaw = yaw; const moving = G.clamp(spd / 3, 0, 1);
    // bassin et buste
    const lL = C.legL.rotation.x, lR = C.legR.rotation.x, swing = (lR - lL) * .5, dL = (lL - s.lL) / dt, dR = (lR - s.lR) / dt; s.lL = lL; s.lR = lR;
    C.body.rotation.y = swing * .14 * moving; C.chest.rotation.y = -swing * .26 * moving;
    const breath = Math.sin(t * 2.1 + s.ph); C.chest.rotation.x = -.014 * breath * (1 - moving * .6) + (spd > 4.5 ? .06 : 0);
    s.bank += (G.clamp(-yr * spd * .012, -.14, .14) - s.bank) * Math.min(1, 6 * dt); C.body.rotation.z = s.bank;
    // genoux qui plient quand la jambe passe vers l'avant ; coudes pliés en courant (si une pose n'impose pas déjà un angle)
    if (C.shinL && C.shinL.userData.k == null && C.shinR.userData.k == null && spd > .3) {
      C.shinL.userData.k = kneeBase(lL) + G.clamp(-dL * .1, 0, .75) * moving; C.shinR.userData.k = kneeBase(lR) + G.clamp(-dR * .1, 0, .75) * moving;
      const run = G.clamp((spd - 4) / 2.5, 0, 1); C.faL.userData.k = elbowBase(C.armL.rotation.x) - moving * .18 - run * .95; C.faR.userData.k = elbowBase(C.armR.rotation.x) - moving * .18 - run * .95;
      s.wk = [C.shinL.userData.k, C.shinR.userData.k, C.faL.userData.k, C.faR.userData.k]; }
    else if (s.wk && spd <= .3) { [C.shinL, C.shinR, C.faL, C.faR].forEach((g, i) => { if (g.userData.k === s.wk[i]) g.userData.k = null; }); s.wk = null; } // à l'arrêt, genoux et coudes reprennent leur pose naturelle
    // cheveux : ressort amorti (x : avant/arrière, z : côtés) ; ils traînent derrière en avançant, s'envolent dans les virages et en sautant
    if (C.hairB) { const lean = (C.body.rotation.x || 0) + (C.head.rotation.x || 0);
      const tx = G.clamp(-lean * .85 + vf * .055 + Math.sin(t * 1.7 + s.ph) * .025 + Math.max(0, -vy) * .02, -.35, .9), tz = G.clamp(-vs * .05 - (C.head.rotation.z || 0) * .6 + Math.sin(t * 1.3 + s.ph * 2) * .02, -.5, .5);
      s.wx += ((tx - s.hx) * 55 - s.wx * 7 + af * .35 - ay * .02) * dt; s.wz += ((tz - s.hz) * 55 - s.wz * 7 - as * .3 + yr * spd * .25) * dt;
      s.hx = G.clamp(s.hx + s.wx * dt, -.45, 1.1); s.hz = G.clamp(s.hz + s.wz * dt, -.7, .7); C.hairB.rotation.set(s.hx, 0, s.hz); }
  }
  let T = 0;
  G.on('frame', dt => { if (!dt) return; T += dt; const d = Math.min(dt, .05);
    for (const C of LIVE) { if (!C.root.parent) { if ((C._orph = (C._orph || 0) + 1) > 300) LIVE.delete(C); continue; } C._orph = 0; try { upd(C, d, T); } catch (e) { LIVE.delete(C); } } });
})();
