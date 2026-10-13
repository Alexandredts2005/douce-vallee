'use strict';
// ===== Le personnage s'intègre aux meubles et aux véhicules : la hauteur réelle de l'assise est lue dans le modèle 3D,
// les cuisses se posent sur le siège, les pieds touchent le sol (ou pendent sur un tabouret), les mains reposent sur les cuisses,
// le dos s'appuie au dossier ; on s'allonge dans un transat ; on fait face à la table du pique-nique. =====
(function () {
  const PI = Math.PI, TH = .29, SHIN = .35, HIPY = .64;
  // ---------- dessus de l'assise : surface tournée vers le haut la plus haute (sous 0,8) à l'aplomb du point ----------
  const cache = {};
  G.seatTop = (o, wx, wz) => {
    const d = G.OBJ[o.t], m = G.map, [cx, cz] = m.center(o), f = (o.r || 0) * PI / 2, dx = wx - cx, dz = wz - cz;
    const lx = dx * Math.cos(f) - dz * Math.sin(f), lz = dx * Math.sin(f) + dz * Math.cos(f), key = d.model + ':' + (o.v != null ? o.v : d.v) + ':' + Math.round(lx * 20) + ':' + Math.round(lz * 20);
    if (cache[key] != null) return cache[key];
    const g = G.getGeo(d.model, o.v != null ? o.v : d.v || 0), P = g.attributes.position.array, n = P.length / 9; let best = -1;
    for (let t = 0; t < n; t++) { const i = t * 9, ax = P[i], ay = P[i + 1], az = P[i + 2], bx = P[i + 3], by = P[i + 4], bz = P[i + 5], qx = P[i + 6], qy = P[i + 7], qz = P[i + 8];
      if (Math.min(ay, by, qy) > .8) continue; const den = (bz - qz) * (ax - qx) + (qx - bx) * (az - qz); if (Math.abs(den) < 1e-9) continue;
      const u = ((bz - qz) * (lx - qx) + (qx - bx) * (lz - qz)) / den, v = ((qz - az) * (lx - qx) + (ax - qx) * (lz - qz)) / den, w = 1 - u - v; if (u < 0 || v < 0 || w < 0) continue;
      const y = u * ay + v * by + w * qy; if (y > .8 || y <= best) continue;
      const nx = (by - ay) * (qz - az) - (bz - az) * (qy - ay), ny = (bz - az) * (qx - ax) - (bx - ax) * (qz - az), nz = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax); if (Math.abs(ny) < .55 * Math.hypot(nx, ny, nz)) continue;
      best = y; }
    return cache[key] = best > .12 ? best : Math.min(d.h, .5);
  };
  // ---------- pose assise : H = hauteur des hanches au-dessus du sol, sc = taille du personnage ----------
  G.sitPose = (H, kind, sc = 1) => {
    if (kind === 'transat') return { bob: -.33, lean: -1.02, thigh: -.5, shin: .3, arm: .05, fore: -.35, armZ: .12 };
    if (kind === 'pilote') return { bob: -.3, lean: -.08, thigh: -1.45, shin: .75, arm: -.6, fore: -.6, armZ: .05 };
    if (kind === 'banquette') return { bob: -.3, lean: -.04, thigh: -1.45, shin: 1.25, arm: -.3, fore: -.85, armZ: .04 };
    const th = G.clamp(Math.asin(G.clamp((H - SHIN * sc) / (TH * sc), -.3, .98)), -.3, .8);
    return { bob: -.3, lean: -.05, thigh: -(PI / 2 - th), shin: PI / 2 - th - .14, arm: -.32, fore: -.82, armZ: .05 };
  };
  // pose appliquée à n'importe quel personnage (passagers, capitaine…) ; clearPose pour la retirer
  G.applyPose = (C, q) => { C.legL.rotation.x = C.legR.rotation.x = q.thigh; C.armL.rotation.x = C.armR.rotation.x = q.arm; C.armL.rotation.z = -(q.armZ || 0); C.armR.rotation.z = q.armZ || 0;
    C.body.position.y = q.bob; C.body.rotation.x = q.lean || 0; if (C.shinL) { C.shinL.userData.k = C.shinR.userData.k = q.shin; C.faL.userData.k = C.faR.userData.k = q.fore; } };
  G.clearPose = C => { for (const g of [C.shinL, C.shinR, C.faL, C.faR]) if (g) g.userData.k = null; C.body.position.y = 0; C.body.rotation.x = 0; };
  // ---------- s'asseoir ----------
  const os = G.act.sitOn;
  G.act.sitOn = o => {
    os(o); const p = G.player; if (!p.sit || p.sit.o !== o) return;
    const d = G.OBJ[o.t], m = G.map, F = G.FR[o.r || 0], [cx, cz] = m.center(o), sc = p.root.scale.y || 1, kind = d.model === 'deckchair' ? 'transat' : 'chaise';
    let fx = F[0], fz = F[1];
    if (o.t === 'table_pique') { const side = Math.sign((p.x - cx) * F[0] + (p.z - cz) * F[1]) || 1; fx = -F[0] * side; fz = -F[1] * side; p.yaw = Math.atan2(fx, fz); } // on fait face à la table
    if (kind === 'transat') { p.x -= fx * .12; p.z -= fz * .12; } else { p.x -= fx * .08; p.z -= fz * .08; } // les hanches au fond du siège
    const top = G.seatTop(o, p.x, p.z), H = (kind === 'transat' ? Math.min(top, .3) : top) + .045, q = G.sitPose(H, kind, sc);
    // le buste bascule autour du bassin du personnage : on garde les hanches sur l'assise (hauteur et recul)
    const lean = q.lean || 0, back = HIPY * Math.sin(-lean) * sc; p.x += fx * back; p.z += fz * back;
    p.sit.pose = q; p.y = o.y + H - (q.bob + HIPY * Math.cos(lean)) * sc;
  };
})();
