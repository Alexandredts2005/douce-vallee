'use strict';
// ===== Mini-jeux de la place : attrape-étoiles (super saut !), tir aux ballons, course des anneaux =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  MD.star = v => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.PI / 2, r = i % 2 ? .16 : .38; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const b = G.mb(150); b.add(new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 1 }), v ? 0xff8fc0 : 0xffd23f, b.M(0, 0, -.05), 1); return b.done(); };
  MD.ring = v => { const b = G.mb(151); b.tor(.75, .09, v ? 0x4fb35f : 0xff9a3c, 0, 0, 0, 0, 0, 0, 1, 20); return b.done(); };
  MD.miniballoon = v => { const b = G.mb(152 + v); b.sph(.38, [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffd23f][v % 4], 0, 0, 0, 1, 1.15, 1, v === 3 ? 1 : 0, 12, 8); b.cone(.05, .09, 6, 0xffffff, 0, -.45, 0, Math.PI); b.cyl(.006, .006, .6, 3, 0xeeeeee, 0, -.8, 0); return b.done(); };
  const M = G.mini = { active: null, best: {} };
  const NAMES = { etoiles: 'Attrape-étoiles', ballons: 'Tir aux ballons', anneaux: 'Course des anneaux' };
  const hud = (show) => { let el = G.el('mini'); if (!el) { el = document.createElement('div'); el.id = 'mini'; el.className = 'card'; el.style.cssText = 'position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);font-family:var(--f-display);font-size:20px;display:flex;gap:16px;align-items:center;padding:8px 20px;z-index:12'; G.el('hud').appendChild(el); } el.hidden = !show; return el; };
  const mesh = (name, v) => { const m = new THREE.Mesh(G.getGeo(name, v), G.MATS); m.frustumCulled = false; m.castShadow = true; G.scene.add(m); return m; };
  M.menu = () => { const v = G.ents.villagers.find(x => x.npc === 'jeux'); if (v) G.ents.talk(v); else M.start('etoiles'); };
  M.start = id => {
    if (M.active || !G.map || G.map.interior) return; const w = G.map, c = w.meta.games || w.meta.plaza || G.player;
    const a = M.active = { id, map: w, t: id === 'anneaux' ? 70 : id === 'ballons' ? 40 : 45, score: 0, objs: [], cx: c.x, cz: c.z, spawn: 0, ring: 0 };
    if (id === 'ballons') G.player.tempTool = 'lance_pierre';
    if (id === 'anneaux') { const pts = []; for (let k = 0; k < 8; k++) { const ang = k / 8 * TAU, r = 7 + (k % 3) * 3; let x = a.cx + Math.cos(ang) * r, z = a.cz + Math.sin(ang) * r; if (w.isWaterAt(x, z) || w.topAt(x, z) > 30) { x = a.cx + Math.cos(ang) * 4; z = a.cz + Math.sin(ang) * 4; } pts.push([x, w.topAt(x, z) + (k % 3 === 2 ? 1.9 : 1.0), z, ang]); }
      pts.forEach((p, k) => { const m = mesh('ring', k === 0 ? 1 : 0); m.position.set(p[0], p[1], p[2]); m.rotation.y = p[3] + Math.PI / 2; a.objs.push({ m, x: p[0], y: p[1], z: p[2] }); }); }
    G.ui.dirtyHot(); G.sfx('fanfare'); G.ui.toast('C\'est parti : ' + NAMES[id] + ' !');
  };
  M.targets = () => M.active && M.active.id === 'ballons' ? M.active.objs.filter(o => !o.dead) : [];
  M.hit = (x, y, z) => { if (!M.active || M.active.id !== 'ballons') return false; for (const o of M.active.objs) if (!o.dead && Math.hypot(o.x - x, o.y - y, o.z - z) < .65) { o.dead = 1; G.scene.remove(o.m); M.active.score += o.gold ? 5 : 1; G.sfx('pop'); G.fx.burst(o.x, o.y, o.z, 18, [0xe8434a, 0xffd23f, 0x5b8fd6, 0xffffff], 3.5, .8, 4); G.popup(o.gold ? '+5' : '+1', o.x, o.y + .5, o.z, 'gold'); return true; } return false; };
  function spawnStar(a) { const w = a.map; for (let k = 0; k < 20; k++) { const ang = Math.random() * TAU, r = 2 + Math.random() * 8, x = a.cx + Math.cos(ang) * r, z = a.cz + Math.sin(ang) * r, g = w.topAt(x, z); if (w.isWaterAt(x, z) || g > 30 || Math.abs(g - w.topAt(a.cx, a.cz)) > 1.6) continue;
    const gold = Math.random() < .15, m = mesh('star', gold ? 1 : 0), y = g + .6 + (Math.random() < .45 ? 1.1 + Math.random() * .7 : Math.random() * .5); m.position.set(x, y, z); a.objs.push({ m, x, y, z, gold }); return; } }
  M.update = dt => {
    const a = M.active; if (!a) return; const p = G.player, el = hud(true);
    if (G.ui.canPlay()) a.t -= dt;
    if (a.id === 'etoiles') { while (a.objs.filter(o => !o.dead).length < 7) spawnStar(a);
      for (const o of a.objs) { if (o.dead) continue; o.m.rotation.y += dt * 3; o.m.position.y = o.y + Math.sin(performance.now() / 300 + o.x) * .08; if (Math.hypot(o.x - p.x, o.y - (p.y + .55), o.z - p.z) < .85) { o.dead = 1; G.scene.remove(o.m); a.score += o.gold ? 3 : 1; G.sfx('coin'); G.fx.burst(o.x, o.y, o.z, 14, [0xffd23f, 0xffffff], 3, .6, 2); G.popup(o.gold ? '+3 ⭐' : '+1 ⭐', o.x, o.y + .4, o.z, 'gold'); } } }
    if (a.id === 'ballons') { a.spawn -= dt; if (a.spawn < 0) { a.spawn = .75; const ang = Math.random() * TAU, r = 3 + Math.random() * 7, x = a.cx + Math.cos(ang) * r, z = a.cz + Math.sin(ang) * r, gold = Math.random() < .12; const m = mesh('miniballoon', gold ? 3 : Math.floor(Math.random() * 3)); const y = a.map.topAt(x, z) + .4; m.position.set(x, y, z); a.objs.push({ m, x, y, z, gold }); }
      for (const o of a.objs) { if (o.dead) continue; o.y += dt * 1.25; o.m.position.set(o.x + Math.sin(o.y * 2) * .1, o.y, o.z); if (o.y > a.map.topAt(o.x, o.z) + 9) { o.dead = 1; G.scene.remove(o.m); } } }
    if (a.id === 'anneaux') { a.objs.forEach((o, k) => { o.m.visible = k >= a.ring; o.m.rotation.z = Math.sin(performance.now() / 500 + k) * .1; o.m.scale.setScalar(k === a.ring ? 1 + Math.sin(performance.now() / 150) * .06 : .85); });
      const o = a.objs[a.ring]; if (o && Math.hypot(o.x - p.x, o.y - (p.y + .6), o.z - p.z) < 1) { a.ring++; G.sfx('coin'); G.fx.burst(o.x, o.y, o.z, 16, [0xff9a3c, 0xffffff], 3, .6, 2); if (a.objs[a.ring]) a.objs[a.ring].m.material = G.MATS; if (a.ring >= a.objs.length) { a.score = Math.ceil(a.t) * 10; a.t = 0; } } }
    el.innerHTML = `<span>${NAMES[a.id]}</span><b>⏱ ${Math.max(0, Math.ceil(a.t))} s</b><b>${a.id === 'anneaux' ? '🎯 ' + a.ring + '/' + a.objs.length : '⭐ ' + a.score}</b>`;
    if (a.t <= 0 || G.map !== a.map) M.end();
  };
  M.end = () => {
    const a = M.active; if (!a) return; M.active = null; hud(false); for (const o of a.objs) G.scene.remove(o.m); G.player.tempTool = null; G.ui.dirtyHot();
    const rec = M.best[a.id] || 0, nb = a.score > rec; if (nb) M.best[a.id] = a.score; const coins = a.score * (a.id === 'anneaux' ? 4 : 25);
    if (coins) { G.coins += coins; G.ui.dirtyHud(); } G.sfx(nb ? 'fanfare' : 'catch');
    const v = G.ents.villagers.find(x => x.npc === 'jeux');
    G.ui.dialog(v ? v.D.n : 'Filou', [a.id === 'anneaux' && a.ring < a.objs.length ? 'Temps écoulé ! Tu as franchi ' + a.ring + ' anneaux sur ' + a.objs.length + '.' : 'Terminé ! Ton score : ' + a.score + ' points !', (nb ? 'NOUVEAU RECORD ! ' : 'Record : ' + Math.max(rec, a.score) + '. ') + (coins ? 'Tu gagnes ' + coins + ' clochettes !' : 'Retente ta chance !')], { pitch: 1.25, color: '#e8a23a' });
  };
})();
