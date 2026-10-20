'use strict';
// ===== Les événements de la place du village : le « mât des fêtes » (sur la place) annonce le programme et lance les fêtes.
// 🗝️ Chasse au trésor : huit trésors enterrés autour de la place, une pelle, le « chaud ou froid » et un chrono.
// 🎈 Fête des montgolfières : des ballons de toutes les couleurs amarrés sur la place et d'autres qui passent dans le ciel ;
//    on monte dans un ballon et on part pour un grand vol au-dessus du village (la mairie, la gare, le port…) avant de revenir se poser.
// 🎆 Feu d'artifice : fusées, bouquets, pluie d'or et grand final au-dessus de la fontaine (plus beau la nuit !).
// Certains jours, les fêtes arrivent toutes seules (montgolfières un jour sur trois, feu d'artifice le samedi soir). =====
(function () {
  const O = G.OBJ, MD = G.MODELS, TAU = Math.PI * 2, PI = Math.PI;
  const EV = G.events = { hunt: null, balloons: null, fw: null, flight: null, grp: null, told: {} };
  const surv = () => G.mode === 'survie';
  const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const dayName = d => DAYS[((d - 1) % 7 + 7) % 7];
  const prog = d => d % 3 === 0 ? 'balloons' : d % 3 === 1 ? 'hunt' : 'market', fwDay = d => d % 7 === 6;
  const PROG = { balloons: '🎈 Fête des montgolfières (de 9 h à 18 h)', hunt: '🗝️ Chasse au trésor (quand tu veux, au mât des fêtes)', market: '🎪 Jeux de la place et concert de Dédé au kiosque le soir' };

  // ---------- le mât des fêtes ----------
  MD.mat_fetes = v => { const b = G.mb(9431), RED = 0xc8343c, GOLD = 0xd9b04a, CREAM = 0xf4ecd8, GREEN = 0x2f6b4a, ST = 0xd8cfbd;
    b.cyl(.62, .7, .22, 10, ST, 0, .11, 0); b.cyl(.52, .56, .16, 10, 0xc9bfa9, 0, .3, 0);
    b.cyl(.36, .4, 2.3, 18, GREEN, 0, 1.53, 0); for (const y of [.42, 2.66]) b.cyl(.43, .43, .1, 18, GOLD, 0, y, 0);
    // les affiches tout autour de la colonne
    const POST = [0xe8434a, 0x3b78d8, 0xffc23d, 0x9b59d0, 0x3fa34d, 0xff8a3c];
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.add(new THREE.PlaneGeometry(.34, .62), CREAM, b.M(Math.sin(a) * .375, 1.45, Math.cos(a) * .375, 0, a, 0));
      b.add(new THREE.PlaneGeometry(.28, .3), POST[k], b.M(Math.sin(a) * .38, 1.56, Math.cos(a) * .38, 0, a, 0));
      b.add(new THREE.CircleGeometry(.07, 10), 0xffffff, b.M(Math.sin(a) * .385, 1.6, Math.cos(a) * .385, 0, a, 0));
      b.add(new THREE.PlaneGeometry(.24, .04), 0x3d2b1d, b.M(Math.sin(a) * .385, 1.3, Math.cos(a) * .385, 0, a, 0)); b.add(new THREE.PlaneGeometry(.18, .03), 0x3d2b1d, b.M(Math.sin(a) * .385, 1.24, Math.cos(a) * .385, 0, a, 0)); }
    // dôme rayé, épi doré et drapeau
    for (let k = 0; k < 12; k++) b.add(new THREE.SphereGeometry(.5, 3, 6, k / 12 * TAU, TAU / 12, 0, PI / 2), k % 2 ? RED : CREAM, b.M(0, 2.72, 0));
    b.cyl(.04, .05, 1.1, 8, GOLD, 0, 3.6, 0); b.sph(.08, GOLD, 0, 4.18, 0);
    b.add(new THREE.PlaneGeometry(.55, .32), RED, b.M(.3, 3.95, 0), 2); b.add(new THREE.PlaneGeometry(.3, .08), 0xffffff, b.M(.3, 3.95, .005), 2);
    // guirlandes de fanions qui descendent du dôme
    const FL = [0xe8434a, 0xffd23f, 0x3b78d8, 0x3fa34d, 0xff8fc0, 0xffffff];
    for (let s = 0; s < 4; s++) { const a = s / 4 * TAU + PI / 4; for (let k = 1; k <= 6; k++) { const t = k / 7, r = .5 + t * .9, y = 2.72 - t * 1.25 - Math.sin(t * PI) * .18;
      b.add(new THREE.ConeGeometry(.07, .16, 3), FL[(k + s) % 6], b.M(Math.sin(a) * r, y - .08, Math.cos(a) * r, PI, a, 0)); } }
    return b.done(); };
  O.mat_fetes = { id: 'mat_fetes', n: 'Mât des fêtes', model: 'mat_fetes', v: 0, fp: [1, 1], h: 4.2, fixed: 1, events: 1 };
  // petite butte de terre fraîchement retournée : un trésor est enterré dessous
  MD.tresor_cache = v => { const b = G.mb(9432); b.sph(.42, 0x8a6440, 0, -.02, 0, 1, .28, 1); b.sph(.2, 0x6f4f30, .12, .06, -.05, 1, .5, 1); for (const [x, z] of [[-.25, .2], [.28, .18], [-.1, -.3]]) b.sph(.05, 0xa8a196, x, .04, z); b.box(.08, .02, .08, 0xffe27a, -.18, .1, -.08, 0, .6, 0, 1); return b.done(); };
  O.tresor_cache = { id: 'tresor_cache', n: 'Terre retournée', model: 'tresor_cache', v: 0, fp: [1, 1], h: 0, walk: 1 };

  // le mât trouve sa place sur la place (dans les parties nouvelles comme dans les anciennes)
  function plant(m) { if (!m || m.interior || m.kind !== 'world') return; const P = m.meta.plaza; if (!P) return;
    if (m.meta.matFetes && [...m.list].some(o => o.t === 'mat_fetes')) return;
    const cx = Math.floor(P.x), cz = Math.floor(P.z) - 1;
    for (let r = 2; r < 16; r++) for (let k = 0; k < r * 8; k++) { const a = k / (r * 8) * TAU, x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r * .7);
      if (!m.inb(x, z) || m.water[m.idx(x, z)] || m.ramp[m.idx(x, z)] || !m.canPlace('mat_fetes', x, z)) continue;
      let ok = true; for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1; dx++) { const q = m.objAt(x + dx, z + dz); if (q && (dx || dz) && G.OBJ[q.t].h > .4) { ok = false; break; } } if (!ok) continue;
      m.addObj('mat_fetes', x, z, 0); m.meta.matFetes = { x: x + .5, z: z + .5 }; return; } }
  G.on('worldgen', plant); G.on('load', () => plant(G.world));

  // ---------- petits outils ----------
  const grp = () => { if (!EV.grp) { EV.grp = new THREE.Group(); G.scene.add(EV.grp); } if (EV.grp.parent !== G.scene) G.scene.add(EV.grp); return EV.grp; };
  const mesh = (name, v) => { const m = new THREE.Mesh(G.getGeo(name, v | 0), G.MATS); m.castShadow = true; m.frustumCulled = false; grp().add(m); return m; };
  const center = () => { const m = G.world, P = m && (m.meta.matFetes || m.meta.plaza || m.meta.spawn); return P ? { x: P.x, z: P.z } : { x: G.player.x, z: G.player.z }; };
  const ground = (m, x, z) => m.inb(Math.floor(x), Math.floor(z)) ? Math.max(m.topAt(x, z), m.isWaterAt(x, z) ? m.waterSurf(Math.floor(x), Math.floor(z)) : -9) : 0;
  const hud = () => { let el = G.el('ev-hud'); if (!el) { el = document.createElement('div'); el.id = 'ev-hud'; el.className = 'card'; el.style.cssText = 'position:absolute;left:50%;top:calc(116px + env(safe-area-inset-top,0px));transform:translateX(-50%);font-family:var(--f-display);font-size:19px;display:flex;gap:14px;align-items:center;padding:7px 18px;z-index:12;white-space:nowrap'; G.el('hud').appendChild(el); } return el; };
  const hideHud = () => { const el = G.el('ev-hud'); if (el) el.hidden = true; };
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const say = (lines, choices) => G.ui.dialog('Mât des fêtes', lines, { color: '#c8343c', pitch: 1.1, choices });

  // ---------- 🗝️ chasse au trésor ----------
  const HUNT_N = 8, HUNT_T = 600;
  function startHunt() {
    const m = G.world, c = center(); stopHunt(true); const list = [];
    for (let t = 0; t < 4000 && list.length < HUNT_N; t++) { const a = Math.random() * TAU, d = 10 + Math.sqrt(Math.random()) * 55, x = Math.floor(c.x + Math.cos(a) * d), z = Math.floor(c.z + Math.sin(a) * d);
      if (!m.inb(x, z) || x < 4 || z < 4 || m.water[m.idx(x, z)] || m.ramp[m.idx(x, z)] || !m.canPlace('tresor_cache', x, z) || G.SURF[m.surf[m.idx(x, z)]].path) continue;
      if (list.some(q => Math.hypot(q.x - x, q.z - z) < 9)) continue; const o = m.addObj('tresor_cache', x, z, 0, { temp: 1 }); if (o) list.push(o); }
    if (!list.length) { G.ui.toast('Pas de place pour cacher les trésors…'); return; }
    EV.hunt = { list, n: list.length, found: 0, t0: performance.now(), loot: 0 }; G.gear.give('pelle'); G.sfx('fanfare');
    G.ui.toast('🗝️ ' + list.length + ' trésors sont enterrés autour de la place ! Suis le « chaud ou froid », cherche la terre retournée et creuse (F) !', 7000);
  }
  function stopHunt(silent) { const h = EV.hunt; if (!h) return; for (const o of h.list) if (G.world.list.has(o)) G.world.removeObj(o); EV.hunt = null; hideHud(); if (!silent) { G.gear.drop(); } }
  function huntTick() {
    const h = EV.hunt; if (!h) return; const p = G.player, m = G.world, left = HUNT_T - (performance.now() - h.t0) / 1000;
    if (left <= 0) { const n = h.found; stopHunt(); G.sfx('error'); say(['⏱ Le temps est écoulé !', n ? 'Tu as trouvé ' + n + ' trésor' + (n > 1 ? 's' : '') + ' sur ' + h.n + '. Bravo !' : 'Aucun trésor cette fois… Retente ta chance !']); return; }
    let best = null; for (const o of h.list) { const d = Math.hypot(o.x + .5 - p.x, o.z + .5 - p.z); if (!best || d < best[0]) best = [d, o]; }
    const far = G.map !== m, d = best ? best[0] : 99, hot = far ? '🏠 Sors pour chercher !' : d < 2.5 ? '🔥 Brûlant !' : d < 7 ? '♨️ Chaud' : d < 15 ? '🌤️ Tiède' : d < 30 ? '❄️ Froid' : '🧊 Glacé';
    const el = hud(); el.hidden = false; el.innerHTML = `<span>🗝️ Chasse au trésor</span><span>💎 ${h.found}/${h.n}</span><span style="color:${d < 7 ? '#d9481e' : d < 15 ? '#c98a1a' : '#3b78d8'}">${hot}</span><span>⏱ ${mmss(left)}</span>`;
    // de petites étincelles dorées trahissent le trésor tout proche
    if (!far && best && d < 6 && Math.random() < .15) { const o = best[1]; G.fx.one(o.x + .5 + (Math.random() - .5) * .6, o.y + .15, o.z + .5 + (Math.random() - .5) * .6, 0, .9, 0, .7, -.2, 0xffe27a, .14, 1); }
  }
  const odig = G.act.dig; G.act.dig = (tx, tz, o) => {
    if (o && o.t === 'tresor_cache') { const m = G.map, h = EV.hunt, x = o.x + .5, z = o.z + .5, y = o.y; m.removeObj(o); G.sfx('dig'); G.sfx('fanfare');
      G.fx.burst(x, y + .4, z, 26, [0xffd23f, 0xffffff, 0xffe9a8], 3.5, .9, 6); const loot = G.pick(['or', 'or', 'fossile', 'cadeau', 'coquillage']); G.act.give(loot, 1, x, y, z); if (surv()) G.act.coins(300 + Math.floor(Math.random() * 500), [x, y, z]);
      if (h) { h.list = h.list.filter(q => q !== o); h.found++; G.popup('💎 ' + h.found + '/' + h.n, x, y + 1.4, z, 'gold');
        if (!h.list.length) { const s = (performance.now() - h.t0) / 1000; EV.hunt = null; hideHud(); G.gear.drop(); finale(true); if (surv()) G.act.coins(5000, [x, y, z]); G.act.give('cadeau', 1, x, y, z);
          setTimeout(() => say(['🏆 Tous les trésors sont à toi !', 'Ton temps : ' + mmss(s) + '.' + (G.flags.huntBest ? ' Ton record : ' + mmss(G.flags.huntBest) + '.' : ''), (!G.flags.huntBest || s < G.flags.huntBest) ? 'C\'est un nouveau record ! 🎉' : 'Bravo, chasseur·se de trésors !']).then(() => { if (!G.flags.huntBest || s < G.flags.huntBest) G.flags.huntBest = Math.round(s); }), 900); } }
      return; }
    return odig(tx, tz, o); };

  // ---------- 🎈 fête des montgolfières ----------
  function startBalloons(auto) {
    if (EV.balloons) return; const m = G.world, c = center(), list = [], sky = [];
    for (let k = 0; k < 7; k++) { let best = null; for (let t = 0; t < 60; t++) { const a = k / 7 * TAU + (Math.random() - .5) * .5, d = 7 + Math.random() * 6, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d * .8, tx = Math.floor(x), tz = Math.floor(z);
        if (!m.inb(tx, tz) || m.isWaterAt(x, z)) continue; const o = m.objAt(tx, tz), dd = o && G.OBJ[o.t]; if (dd && dd.h > 1.4) continue; if (list.some(q => Math.hypot(q.x - x, q.z - z) < 4.2)) continue; best = { x, z }; break; }
      if (!best) continue; const b = { x: best.x, z: best.z, g: ground(m, best.x, best.z), ph: Math.random() * TAU, mesh: mesh('montgolfiere', k % 4) };
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 4), new THREE.MeshLambertMaterial({ color: 0x8a6a48 })); rope.frustumCulled = false; grp().add(rope); b.rope = rope;
      const peg = mesh('crate'); peg.scale.setScalar(.45); peg.position.set(b.x + .9, b.g, b.z + .9); b.peg = peg; list.push(b); }
    // d'autres ballons glissent dans le ciel au-dessus du village
    for (let k = 0; k < 9; k++) sky.push({ mesh: mesh('montgolfiere', k % 4), a: Math.random() * TAU, r: 30 + Math.random() * 90, h: 28 + Math.random() * 40, w: (.012 + Math.random() * .02) * (Math.random() < .5 ? -1 : 1), s: 1 + Math.random() * .6 });
    for (const s of sky) s.mesh.scale.setScalar(s.s);
    EV.balloons = { list, sky, auto: !!auto, day: G.clock.day }; G.sfx('fanfare');
    G.ui.toast('🎈 C\'est la fête des montgolfières sur la place ! Approche-toi d\'un ballon et appuie sur E pour un grand vol au-dessus du village.', 7000);
  }
  function stopBalloons() { const B = EV.balloons; if (!B) return; for (const b of B.list) { grp().remove(b.mesh); grp().remove(b.rope); grp().remove(b.peg); b.rope.geometry.dispose(); } for (const s of B.sky) grp().remove(s.mesh); EV.balloons = null; }
  function balloonsTick(dt) {
    const B = EV.balloons; if (!B) return; const t = performance.now() / 1000;
    for (const b of B.list) { const y = b.g + 2.2 + Math.sin(t * .8 + b.ph) * .35; b.mesh.position.set(b.x, y, b.z); b.mesh.rotation.set(Math.sin(t * .6 + b.ph) * .05, t * .05 + b.ph, Math.cos(t * .5 + b.ph) * .05);
      const ax = b.x + .9, az = b.z + .9, len = Math.hypot(ax - b.x, y + .2 - b.g, az - b.z); b.rope.position.set((ax + b.x) / 2, (b.g + y + .2) / 2, (az + b.z) / 2); b.rope.scale.set(1, len, 1); b.rope.lookAt(ax, b.g, az); b.rope.rotateX(PI / 2);
      b.mesh.visible = b.rope.visible = !(EV.flight && EV.flight.b === b);
      if (Math.random() < dt * 1.5) G.fx.one(b.x, y + 1.7, b.z, (Math.random() - .5) * .2, 1, (Math.random() - .5) * .2, .4, -.4, Math.random() < .5 ? 0xffb347 : 0xffe14a, .18, 1); }
    const c = center(); for (const s of B.sky) { s.a += s.w * dt; const x = c.x + Math.cos(s.a) * s.r, z = c.z + Math.sin(s.a) * s.r * .8; s.mesh.position.set(x, s.h + Math.sin(t * .3 + s.r) * 2, z); s.mesh.rotation.y = t * .03 + s.r; }
  }
  const nearBalloon = () => { const B = EV.balloons, p = G.player; if (!B || G.map !== G.world || p.vehicle) return null; let best = null; for (const b of B.list) { const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < 2.6 && (!best || d < best[0])) best = [d, b]; } return best && best[1]; };

  // le grand vol : on survole les lieux du village, puis le ballon revient se poser à sa place
  function fly(b) {
    const p = G.player, m = G.world, c = { x: b.x, z: b.z }, M = m.meta, spots = [];
    for (const k of ['mairie', 'gare', 'port', 'parc', 'aerodrome', 'ferme', 'fountain', 'home', 'kiosque']) { const q = M[k]; if (q && q.x != null && Math.hypot(q.x - c.x, q.z - c.z) < 170 && Math.hypot(q.x - c.x, q.z - c.z) > 14) spots.push({ x: q.x, z: q.z }); }
    for (const o of m.list) if ((o.t === 'phare' || /^chateau/.test(o.t)) && spots.length < 12) { const [x, z] = m.center(o); if (Math.hypot(x - c.x, z - c.z) < 170) spots.push({ x, z }); }
    while (spots.length < 5) { const a = spots.length / 5 * TAU + .4; spots.push({ x: c.x + Math.cos(a) * 60, z: c.z + Math.sin(a) * 50 }); }
    spots.sort((u, v) => Math.atan2(u.z - c.z, u.x - c.x) - Math.atan2(v.z - c.z, v.x - c.x));
    const path = spots.slice(0, 9).map(q => ({ x: G.clamp(q.x, -60, m.W + 60), z: G.clamp(q.z, -60, m.H + 60) })); path.push({ x: c.x, z: c.z });
    const sh = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); sh.frustumCulled = false; grp().add(sh);
    const ms = mesh('montgolfiere', b.mesh ? (EV.balloons.list.indexOf(b) % 4) : 0);
    p.vehicle = { fest: 1, o: { t: 'montgolfiere', r: 0 }, mesh: ms, sh, x: b.x, z: b.z, y: b.g + 2.2, alt: 2.2, talt: 30, t: 0, h: 0, wi: 0, path, b, landing: false, home: c };
    EV.flight = p.vehicle; G.sfx('fanfare'); G.ui.toast('🎈 En route pour le grand vol ! Tourne la caméra pour admirer le village · E pour rentrer plus tôt.', 6000);
  }
  function flightTick(p, dt) {
    const v = p.vehicle, m = G.map, I = G.input; v.t += dt; const T = v.landing ? v.home : v.path[v.wi];
    if (G.ui.canPlay() && I.hit('KeyE') && !v.landing) { v.landing = true; v.wi = v.path.length - 1; G.ui.toast('On rentre se poser sur la place…'); }
    const dx = T.x - v.x, dz = T.z - v.z, d = Math.hypot(dx, dz);
    if (!v.landing && d < 5) { v.wi++; if (v.wi >= v.path.length) { v.landing = true; } }
    const want = Math.atan2(dx, dz); let dh = want - v.h; while (dh > PI) dh -= TAU; while (dh < -PI) dh += TAU; v.h += dh * Math.min(1, dt * .9);
    const sp = v.landing ? Math.min(6, d * .6) : 7.5; v.x += Math.sin(v.h) * sp * dt; v.z += Math.cos(v.h) * sp * dt;
    const g = ground(m, v.x, v.z); v.talt = v.landing ? (d < 3 ? 0 : 14) : 30 + Math.sin(v.t * .2) * 6;
    v.alt += (v.talt - v.alt) * Math.min(1, (v.landing && d < 3 ? .9 : .5) * dt); v.y += (g + v.alt - v.y) * Math.min(1, 2 * dt);
    if (v.landing && d < 3 && v.y - g < .4 + 2.2) { endFlight(p); return; }
    const sway = Math.sin(v.t * .9) * .04; v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.set(sway, v.t * .05, -sway);
    v.sh.position.set(v.x, g + .04, v.z); const s = G.clamp(2.6 - v.alt * .06, 1, 2.6); v.sh.scale.set(s, 1, s); v.sh.visible = !m.isWaterAt(v.x, v.z);
    p.x = v.x; p.z = v.z; p.y = v.y + .3; p.onGround = true; p.swim = false; if (G.mouseMode && G.mouseMode()) p.yaw = G.cam.yaw + PI;
    if (Math.random() < dt * 8) { G.fx.one(v.x, v.y + 1.6, v.z, (Math.random() - .5) * .3, 1.4, (Math.random() - .5) * .3, .5, -.5, Math.random() < .5 ? 0xffb347 : 0xffe14a, .22, 1); if (Math.random() < .04) G.sfx('swing', .3); }
    p.animate(dt, 0); p.C.armL.rotation.x = p.C.armR.rotation.x = -.7; p.place(); p.blob.visible = false;
  }
  function endFlight(p) { const v = p.vehicle; grp().remove(v.mesh); grp().remove(v.sh); p.vehicle = null; EV.flight = null; const h = v.home; p.teleport(h.x + 1.6, h.z + 1.6, 0); G.sfx('land'); G.fx.puff(h.x, ground(G.world, h.x, h.z) + .1, h.z, 12, 0xf3ead2, .9);
    G.ui.toast(G.pick(['Quel vol ! Le village est magnifique vu d\'en haut. 🎈', 'Atterrissage en douceur. Encore un tour ?', 'Bienvenue sur la terre ferme ! 🎈'])); }

  // ---------- 🎆 feu d'artifice ----------
  const FWC = [[0xff4d4d, 0xffd0d0], [0xffd23f, 0xfff4b0], [0x4da6ff, 0xd0e8ff], [0x5ad65a, 0xd8ffd0], [0xc77dff, 0xf0d8ff], [0xff9a3c, 0xffe0b8], [0xffffff, 0xffe27a]];
  function boom(vol) { const A = G.audio; if (!A || !A.ok || !A.ctx) return; try { const C = A.ctx, t = C.currentTime, n = C.sampleRate * .6, buf = C.createBuffer(1, n, C.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); const s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(); s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 600 + Math.random() * 500; g.gain.value = vol || .25; s.connect(f); f.connect(g); g.connect(A.sfxG); s.start(t); } catch (e) { } }
  function whistle() { const A = G.audio; if (!A || !A.ok || !A.ctx) return; try { const C = A.ctx, t = C.currentTime, o = C.createOscillator(), g = C.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(700, t + 1.1); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.025, t + .1); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2); o.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + 1.3); } catch (e) { } }
  function rocket(c, big) { const m = G.world, a = Math.random() * TAU, r = Math.random() * 6, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, g = ground(m, c.x, c.z);
    EV.fw.rk.push({ x, z, y: g + .5, vy: 22 + Math.random() * 6, top: g + 24 + Math.random() * 16, col: FWC[Math.floor(Math.random() * FWC.length)], kind: big ? 'big' : G.pick(['pivoine', 'pivoine', 'saule', 'anneau', 'etoile', 'palmier']) }); whistle(); }
  function explode(k) { const n = k.kind === 'big' ? 140 : k.kind === 'saule' ? 90 : 70, [c1, c2] = k.col, sp = k.kind === 'big' ? 14 : 10;
    for (let i = 0; i < n; i++) { let vx, vy, vz; if (k.kind === 'anneau') { const a = i / n * TAU; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp * .3; vz = Math.sin(a) * sp; }
      else { const u = Math.random() * 2 - 1, a = Math.random() * TAU, s = Math.sqrt(1 - u * u), q = k.kind === 'etoile' ? (i % 5 === 0 ? 1 : .55) : .8 + Math.random() * .2; vx = Math.cos(a) * s * sp * q; vy = u * sp * q; vz = Math.sin(a) * s * sp * q; }
      const life = k.kind === 'saule' ? 2.6 : k.kind === 'palmier' ? 1.9 : 1.4 + Math.random() * .4; G.fx.one(k.x, k.y, k.z, vx, vy + (k.kind === 'palmier' ? 3 : 0), vz, life, k.kind === 'saule' ? 5 : 3, i % 3 ? c1 : c2, k.kind === 'big' ? .55 : .42, k.kind === 'saule' ? .3 : 0); }
    boom(k.kind === 'big' ? .4 : .22); }
  function startFireworks(auto) { if (EV.fw) return; EV.fw = { t: 0, next: 0, rk: [], dur: 75, auto: !!auto }; const h = G.clock.min / 60;
    G.ui.toast(h >= 20 || h < 5 ? '🎆 Le feu d\'artifice commence au-dessus de la place ! Lève les yeux…' : '🎆 Feu d\'artifice sur la place ! (C\'est encore plus beau la nuit.)', 6000); }
  function finale(small) { if (!EV.fw) EV.fw = { t: 0, next: 0, rk: [], dur: small ? 6 : 75, auto: true, quiet: 1 }; else EV.fw.dur = Math.max(EV.fw.dur, EV.fw.t + 6); for (let k = 0; k < (small ? 4 : 8); k++) setTimeout(() => EV.fw && rocket(center(), k === 3), k * 250); }
  function fwTick(dt) {
    const F = EV.fw; if (!F) return; F.t += dt; const c = center();
    if (F.t < F.dur - 6 && F.t >= F.next) { const fin = F.t > F.dur - 14; rocket(c, fin && Math.random() < .3); if (fin) rocket(c); F.next = F.t + (fin ? .25 : .5 + Math.random() * .9); }
    for (const k of F.rk.slice()) { k.y += k.vy * dt; k.vy = Math.max(4, k.vy - 9 * dt); G.fx.one(k.x, k.y, k.z, (Math.random() - .5) * .3, -1, (Math.random() - .5) * .3, .45, 2, 0xffe2a0, .16, 0); if (k.y >= k.top) { explode(k); F.rk.splice(F.rk.indexOf(k), 1); } }
    if (F.t > F.dur && !F.rk.length) { EV.fw = null; if (!F.quiet) G.ui.toast('🎆 Quel spectacle ! Merci d\'être venu·e.'); }
  }

  // ---------- le menu du mât ----------
  EV.menu = async () => {
    const d = G.clock.day, today = prog(d), busy = EV.hunt || EV.balloons || EV.fw;
    const head = ['Bienvenue sur la place de ' + G.villageName + ' ! Aujourd\'hui, ' + dayName(d) + ' : ' + PROG[today] + (fwDay(d) ? ', et feu d\'artifice à 21 h !' : '.')];
    const ch = [EV.hunt ? '🗝️ Abandonner la chasse au trésor' : '🗝️ Chasse au trésor', EV.balloons ? '🎈 Ranger les montgolfières' : '🎈 Fête des montgolfières', EV.fw ? '🎆 (le feu d\'artifice est en cours)' : '🎆 Feu d\'artifice', '📅 Le programme de la semaine', 'Au revoir'];
    const k = await say(head.concat(busy ? [] : ['Que veux-tu lancer ?']), ch);
    if (k === 0) { if (EV.hunt) { stopHunt(); G.ui.toast('Chasse au trésor abandonnée.'); } else { const ok = await say(['🗝️ Huit trésors sont enterrés autour de la place, sous de petites buttes de terre retournée.', 'Je te prête une pelle. Le « chaud ou froid » en haut de l\'écran te guide ; les étincelles dorées trahissent un trésor tout proche.', 'Tu as 10 minutes. Prêt·e ?'], ['C\'est parti !', 'Plus tard']); if (ok === 0) startHunt(); } }
    else if (k === 1) { if (EV.balloons) stopBalloons(); else startBalloons(false); }
    else if (k === 2) { if (!EV.fw) startFireworks(false); }
    else if (k === 3) { const L = []; for (let i = 0; i < 7; i++) { const dd = d + i; L.push((i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : dayName(dd).replace(/^./, c => c.toUpperCase())) + ' : ' + PROG[prog(dd)] + (fwDay(dd) ? ' · 🎆 feu d\'artifice à 21 h' : '')); } await say(L); }
  };
  const oint = G.act.interact; G.act.interact = () => {
    const p = G.player, m = G.map; if (p && !p.act && !p.sit && !p.fish && !p.swim && !p.vehicle && !G.ents.villagerInFront(p)) {
      const b = nearBalloon(); if (b) return fly(b);
      const [tx, tz] = p.target(), o = m.objAt(tx, tz); if (o && o.t === 'mat_fetes') return EV.menu(); }
    return oint(); };
  const ouse = G.act.useful; G.act.useful = o => (o && G.OBJ[o.t].events) || ouse(o);

  // ---------- le vol prend la main sur le véhicule ----------
  G.on('init', () => { const F = G.feat, ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (v && v.fest) return flightTick(p, dt); return ou(p, dt); }; });

  // ---------- le calendrier et la vie des fêtes ----------
  G.on('update', dt => {
    const m = G.world, p = G.player; if (!m || !p || G.state !== 'play' && G.state !== 'pause') return; dt = Math.min(dt || 0, .1);
    if (EV.grp) EV.grp.visible = G.map === m;
    const d = G.clock.day, h = G.clock.min / 60;
    if (G.state === 'play') {
      // les montgolfières arrivent toutes seules un jour sur trois, et repartent le soir
      if (prog(d) === 'balloons' && h >= 9 && h < 18 && !EV.balloons && EV.told['b' + d] == null && G.map === m) { EV.told['b' + d] = 1; startBalloons(true); }
      if (EV.balloons && EV.balloons.auto && (h >= 18 || h < 9 || EV.balloons.day !== d) && !EV.flight) stopBalloons();
      if (fwDay(d) && h >= 21 && h < 22 && !EV.fw && EV.told['f' + d] == null && G.map === m) { EV.told['f' + d] = 1; startFireworks(true); }
      if (prog(d) === 'hunt' && EV.told['h' + d] == null && G.map === m) { const c = center(); if (Math.hypot(p.x - c.x, p.z - c.z) < 30) { EV.told['h' + d] = 1; G.ui.toast('🗝️ Aujourd\'hui, c\'est chasse au trésor ! Va voir le mât des fêtes sur la place.', 6000); } }
    }
    huntTick(); balloonsTick(dt); fwTick(dt);
    // l'invitation à monter dans un ballon
    const b = nearBalloon(), el = G.el('ev-tip'); if (b && G.ui.canPlay()) { let t = el; if (!t) { t = document.createElement('div'); t.id = 'ev-tip'; t.className = 'card'; t.style.cssText = 'position:absolute;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font:700 15px Nunito,sans-serif;padding:6px 14px;z-index:12'; G.el('hud').appendChild(t); t.innerHTML = '<kbd>E</kbd> 🎈 Monter pour un grand vol au-dessus du village'; } t.hidden = false; } else if (el) el.hidden = true;
  });
  const reset = () => { stopHunt(true); stopBalloons(); EV.fw = null; EV.told = {}; if (EV.flight) EV.flight = null; hideHud(); };
  G.on('newGame', reset); G.on('load', reset);
  EV.startHunt = startHunt; EV.startBalloons = startBalloons; EV.startFireworks = startFireworks; EV.stopAll = reset;
})();
