'use strict';
// ===== La mer : maillot de bain obligatoire pour nager, pas de baignade dans les rivières, traversée en bateau chantée avec le capitaine =====
(function () {
  const TAU = Math.PI * 2;
  // ---------- baignade ----------
  const wtype = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); return m.inb(tx, tz) ? m.water[m.idx(tx, tz)] : 0; };
  G.canSwim = (m, x, z) => { if (G.mode === 'creatif' && G.settings.swimFree) return true; const t = wtype(m, x, z); if (t === 1) return false; return !!(G.player && G.player.look && G.player.look.top === 'maillot'); };
  G.noSwimMsg = (m, x, z) => wtype(m, x, z) === 1 ? 'Plouf ! On ne nage pas dans les rivières… Saute par-dessus (Espace) ou pêche !' : 'Brr ! Il faut un maillot de bain pour nager dans la mer. Les Sœurs Laine en vendent !';
  G.on('init', () => { const ont = G.npcTalk; G.npcTalk = v => {
    if (v.npc !== 'couture') return ont(v); const has = G.flags.maillot || G.mode === 'creatif', opts = ['Changer de tenue', 'Atelier de motifs'].concat(has ? [] : ['Maillot de bain (1 000 🔔)'], ['Au revoir']);
    return G.npcSay(v, ['Bienvenue chez les Sœurs Laine ! Envie d\'une nouvelle tenue, mon chou ?'], opts).then(k => { if (k === 0) return G.ui.openWardrobe(); if (k === 1) return G.ui.openDesigns();
      if (!has && k === 2) { if (G.coins < 1000) return G.npcSay(v, ['Oh… il te manque des clochettes, mon chou.']); G.coins -= 1000; G.ui.dirtyHud(); G.flags.maillot = 1; G.sfx('fanfare'); return G.npcSay(v, ['Et voilà un joli maillot de bain ! 🩱', 'Choisis-le dans « Haut » de ta garde-robe pour nager dans la mer.']); } }); }; });
  // ---------- traversée en bateau ----------
  const LYRICS = ['🎵 Oh hisse ! La vague nous berce, coâ ! 🎵', '🎵 Le vent souffle doux sur la mer d\'argent… 🎵', '🎵 Là-bas l\'île aux palmiers nous attend ! 🎵', '🎵 Rame, rame, petit matelot, coâ coâ ! 🎵'];
  const tone = (f, t, dur, vol, type = 'triangle') => { const A = G.audio; if (!A || !A.ok) return; const C = A.ctx, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(A.musG || A.sfxG); o.start(t); o.stop(t + dur + .05); };
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  function shanty() { const A = G.audio; if (!A || !A.ok) return; const t0 = A.ctx.currentTime + .1, spb = .26, mel = [67, 69, 71, 74, 71, 69, 67, null, 64, 67, 69, 71, 69, 67, 64, null, 67, 69, 71, 74, 76, 74, 71, null, 69, 71, 69, 67, 64, 62, 64, null];
    mel.forEach((n, i) => { const t = t0 + i * spb; if (n) tone(mtof(n), t, spb * 1.6, .07); if (i % 4 === 0) tone(mtof(43 + (i % 16 === 8 ? 5 : 0)), t, spb * 3.5, .12, 'sine'); if (i % 4 === 2) [55, 59, 62].forEach(x => tone(mtof(x + (i % 16 >= 8 ? 2 : 0)), t, spb * 1.2, .025)); }); return mel.length * spb; }
  const RIDE = 8;
  function ride(dest) {
    const p = G.player, m = G.map, pier = m.meta.pier; if (!pier || p.vehicle) return dest();
    const cap = G.ents.villagers.find(v => v.npc === 'capitaine' && v.map === m), boatObj = [...m.list].find(o => o.t === 'bateau' && Math.hypot(o.x - pier.x, o.z - pier.z) < 5);
    const x0 = boatObj ? m.center(boatObj)[0] : pier.x + 1.2, z0 = boatObj ? m.center(boatObj)[1] : pier.z + 1, saved = boatObj && { x: boatObj.x, z: boatObj.z, r: boatObj.r };
    if (boatObj) m.removeObj(boatObj);
    const mesh = new THREE.Mesh(G.getGeo('boat', 0), G.MATS); mesh.castShadow = true; mesh.frustumCulled = false; mesh.rotation.y = -Math.PI / 2; G.scene.add(mesh);
    const ws = m.waterSurf(Math.floor(x0), Math.floor(z0)); G.ui.modal = 'boat'; G.audio.music && (G.audio.music.on = false); const songT = shanty() || 8;
    p.vehicle = { boat: true, t: 0, x0, z0, ws, mesh, cap, capHome: cap && { x: cap.x, z: cap.z, yaw: cap.yaw }, saved, m, dest, lyric: -1, end: Math.min(RIDE, songT) };
    p.fish && G.act.stopFish(); p.sit = null; p.emote = null; G.sfx('splash', .5);
  }
  function endRide(p) { const v = p.vehicle; if (v.done) return; v.done = true; v.dest(); }
  function finish(p) { const v = p.vehicle; G.scene.remove(v.mesh); p.vehicle = null; if (v.cap) { v.cap.x = v.capHome.x; v.cap.z = v.capHome.z; v.cap.yaw = v.capHome.yaw; v.cap.C.body.position.y = 0; } if (v.saved && v.m.canPlace('bateau', v.saved.x, v.saved.z, v.saved.r)) v.m.addObj('bateau', v.saved.x, v.saved.z, v.saved.r);
    if (G.ui.modal === 'boat') G.ui.modal = null; G.audio.music && (G.audio.music.on = true); const C = p.C; C.legL.rotation.x = C.legR.rotation.x = 0; C.body.position.y = 0; p.blob.visible = true; }
  G.on('enterMap', () => { const p = G.player; if (p && p.vehicle && p.vehicle.boat && p.vehicle.done) finish(p); });
  G.on('update', () => { const p = G.player, v = p && p.vehicle; if (!v || !v.boat || !v.cap) return; const c = v.cap, b = v.mesh.position; c.x = b.x; c.z = b.z - .45; c.y = b.y + .12; c.root.position.set(c.x, c.y, c.z); c.root.rotation.y = 0; c.blob.visible = false; c.C.armL.rotation.x = c.C.armR.rotation.x = -1.2 + Math.sin(v.t * 4) * .5; c.C.legL.rotation.x = c.C.legR.rotation.x = -1.4; c.C.setExpr && c.C.setExpr('happy'); });
  G.on('init', () => {
    const ouv = G.feat.updVehicle; G.feat.updVehicle = (p, dt) => { const v = p.vehicle; if (!v || !v.boat) return ouv(p, dt);
      v.t += dt; const k = Math.min(1, v.t / 2), d = (v.t < 2 ? .5 * k * k * 2 : 1 + (v.t - 2)) * 1.6, x = v.x0, z = v.z0 + d, bob = Math.sin(v.t * 2.2) * .07, roll = Math.sin(v.t * 1.7) * .05;
      v.mesh.position.set(x, v.ws - .05 + bob, z); v.mesh.rotation.set(0, -Math.PI / 2, roll);
      p.x = x; p.z = z + .35; p.y = v.ws + .18 + bob; p.yaw = 0; p.vx = p.vz = p.vy = 0; p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = 0; const C = p.C; C.legL.rotation.x = C.legR.rotation.x = -1.45; C.armL.rotation.x = C.armR.rotation.x = -.3; C.body.position.y = -.25; C.setExpr && C.setExpr('happy');
      p.blob.visible = false;
      if (v.cap) { v.cap.yaw = 0; v.cap.C.armL.rotation.x = v.cap.C.armR.rotation.x = -1.2 + Math.sin(v.t * 4) * .5; v.cap.C.body.position.y = bob;
        const li = Math.floor(v.t / 2); if (li !== v.lyric && li < LYRICS.length && G.net && G.net.bubble) { v.lyric = li; G.net.bubble(v.cap.root, LYRICS[li], 2100); } }
      if (Math.random() < dt * 8) G.fx.one(x + (Math.random() - .5) * 1.2, v.ws + .05, z - 1.1, (Math.random() - .5) * .6, .5, -.4, .7, 2, 0xffffff, .14, 1);
      if (v.t > v.end) endRide(p); };
    for (const k of ['island', 'home']) { const ot = G.travel[k]; G.travel[k] = () => ride(ot); }
  });
})();
