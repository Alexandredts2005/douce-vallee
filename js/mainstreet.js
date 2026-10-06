'use strict';
// ===== Gare façon ACNL (en haut au centre), train entre deux tunnels, passage à niveau, tunnel vers la rue commerçante (carte à part) =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, T = G.TIER;
  // ---------- modèles ----------
  // tunnel : v = largeur*10 + niveau de la falaise (le modèle descend du haut de la falaise jusqu'au sol)
  MD.tunnel = v => {
    const w = Math.floor(v / 10) || 3, lv = v % 10 || 2, y0 = -lv * T, b = G.mb(170 + v), ow = w === 3 ? 2.3 : 1.9, oh = w === 3 ? 2.55 : 2.35, z = .5, hr = oh - ow / 2;
    b.jit(.08); b.box(ow + 1.7, oh + .8, .06, 0xa39a88, 0, y0 + (oh + .8) / 2, z + .005); b.jit(0);
    b.box(ow, hr, .04, 0x0b0907, 0, y0 + hr / 2, z + .03); b.geo(new THREE.CircleGeometry(ow / 2, 18, 0, Math.PI), 0x0b0907, b.M(0, y0 + hr, z + .03));
    b.jit(.1); for (const s of [-1, 1]) b.box(.42, hr + .1, .5, 0x9a917f, s * (ow / 2 + .21), y0 + (hr + .1) / 2, z + .1);
    b.add(new THREE.TorusGeometry(ow / 2 + .21, .23, 5, 18, Math.PI), 0x8f8776, b.M(0, y0 + hr, z + .1)); b.jit(0);
    b.box(.36, .42, .52, 0xcdc4b2, 0, y0 + oh + .22, z + .12); b.box(ow + 1.2, .16, .4, 0xb0a795, 0, y0 + oh + .55, z + .1);
    return b.done();
  };
  MD.signal_pn = v => {
    const b = G.mb(175), DK = 0x2a2d33; b.cyl(.15, .19, .16, 8, 0x3f444c, 0, .08, 0);
    for (let i = 0; i < 6; i++) b.cyl(.055, .055, .3, 8, i % 2 ? 0xf7f5ee : DK, 0, .31 + i * .3, 0);
    for (const a of [.72, -.72]) { b.box(.95, .13, .04, 0xffffff, 0, 2.1, .07, 0, 0, a); b.box(.9, .05, .045, 0xe8343a, 0, 2.1, .075, 0, 0, a); }
    b.box(.78, .08, .08, DK, 0, 1.52, .05);
    for (const s of [-1, 1]) { const lit = (v === 1 && s < 0) || (v === 2 && s > 0); b.cyl(.14, .14, .08, 14, DK, s * .32, 1.52, .09, Math.PI / 2); b.cyl(.105, .105, .03, 14, lit ? 0xff3a22 : 0x5a1a1a, s * .32, 1.52, .14, Math.PI / 2, 0, 0, lit ? 1 : 0); b.box(.28, .05, .16, DK, s * .32, 1.67, .13); }
    b.cyl(.07, .12, .13, 8, DK, 0, 2.36, .02); return b.done();
  };
  MD.train = v => {
    const b = G.mb(176), BL = 0x2f6fb8, CR = 0xf7f0dc, DK = 0x2a2d33, RD = 0xd8342c, WI = 0xfff0c2;
    const bogie = x0 => { for (const dx of [-.5, .5]) for (const s of [-1, 1]) { b.cyl(.25, .25, .1, 12, DK, x0 + dx, .3, s * .6, Math.PI / 2); b.cyl(.08, .08, .12, 8, RD, x0 + dx, .3, s * .62, Math.PI / 2); } b.box(1.5, .12, 1.02, DK, x0, .45, 0); };
    b.box(3.2, .3, 1.35, DK, 3.2, .62, 0); b.cyl(.58, .58, 2.0, 14, BL, 3.75, 1.2, 0, 0, 0, Math.PI / 2, 0, true);
    for (const x of [3.0, 3.75, 4.5]) b.add(new THREE.TorusGeometry(.585, .035, 4, 18), 0xd9b84a, b.M(x, 1.2, 0, 0, Math.PI / 2, 0), 0, true);
    b.cyl(.6, .6, .1, 14, DK, 4.78, 1.2, 0, 0, 0, Math.PI / 2); b.sph(.13, WI, 4.86, 1.36, 0, 1, 1, 1, 1);
    b.cyl(.15, .2, .55, 10, DK, 4.25, 2.0, 0); b.cyl(.25, .17, .18, 10, DK, 4.25, 2.33, 0); b.sph(.2, 0xd9b84a, 3.35, 1.78, 0, 1, .8, 1);
    b.box(1.2, 1.4, 1.42, BL, 2.2, 1.45, 0); b.box(1.38, .12, 1.62, CR, 2.2, 2.2, 0); b.box(1.22, .12, 1.44, CR, 2.2, .86, 0);
    for (const s of [-1, 1]) b.box(.5, .45, .05, WI, 2.25, 1.62, s * .72, 0, 0, 0, 1); b.box(.05, .42, .7, WI, 1.59, 1.62, 0, 0, 0, 0, 1);
    b.geo(new THREE.ConeGeometry(.55, .5, 4), RD, b.M(4.98, .5, 0, 0, 0, -Math.PI / 2, 1, 1, 1.5));
    for (const x of [2.1, 3.1, 4.1]) for (const s of [-1, 1]) { b.cyl(.32, .32, .1, 14, RD, x, .36, s * .66, Math.PI / 2); b.cyl(.1, .1, .12, 8, DK, x, .36, s * .68, Math.PI / 2); }
    const car = x0 => { b.box(2.9, .55, 1.45, BL, x0, .95, 0); b.box(2.9, .8, 1.45, CR, x0, 1.62, 0); b.box(2.98, .1, 1.5, BL, x0, 1.24, 0);
      b.geo(new THREE.CylinderGeometry(.78, .78, 2.98, 14, 1, false, 0, Math.PI), 0x3a3f48, b.M(x0, 2.02, 0, 0, 0, Math.PI / 2, .3, 1, 1));
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) b.box(.44, .4, .04, WI, x0 - 1.0 + i * .66, 1.66, s * .73, 0, 0, 0, 1);
      for (const dx of [-.95, .95]) bogie(x0 + dx); };
    car(0); car(-3.2); b.box(.4, .1, .12, DK, 1.6, .72, 0); b.box(.4, .1, .12, DK, -1.6, .72, 0);
    return b.done();
  };
  O.tunnel = { id: 'tunnel', n: 'Tunnel', model: 'tunnel', v: 32, fp: [3, 1], h: 0 };
  O.tunnel2 = { id: 'tunnel2', n: 'Tunnel', model: 'tunnel', v: 23, fp: [2, 1], h: 0 };
  O.signal_pn = { id: 'signal_pn', n: 'Passage à niveau', model: 'signal_pn', v: 0, fp: [1, 1], h: 2.2 };
  // ---------- étiquettes (noms des boutiques) ----------
  const labelTex = txt => { const c = G.cv(512, 128), x = c.getContext('2d'); let fs = 50; x.font = 'bold 50px Fredoka, Nunito, sans-serif'; while (fs > 26 && x.measureText(txt).width > 436) { fs -= 2; x.font = 'bold ' + fs + 'px Fredoka, Nunito, sans-serif'; } const w = Math.min(500, x.measureText(txt).width + 64);
    x.fillStyle = 'rgba(255,250,240,.95)'; G.rrect(x, (512 - w) / 2, 16, w, 94, 34); x.fill(); x.lineWidth = 6; x.strokeStyle = '#a8743f'; x.stroke();
    x.fillStyle = '#5a3a22'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, 64); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  G.mapLabel = (m, txt, x, y, z, s = 1) => { if (!m.labels) { m.labels = new THREE.Group(); m.group.add(m.labels); }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(txt), transparent: true, depthWrite: false })); sp.scale.set(2.5 * s, .625 * s, 1); sp.position.set(x, y, z); sp.renderOrder = 4; m.labels.add(sp); return sp; };
  // ---------- la gare et ses abords (nouveau monde ou ancienne partie) ----------
  function station(map, ox, oz, retro) {
    const W = map.W, I = (x, z) => z * W + x, { lvl, surf, water, ramp } = map;
    const setT = (x, z, L, s) => { if (!map.inb(x, z)) return; const i = I(x, z), o = map.objAt(x, z); if (o && retro) map.removeObj(o); lvl[i] = L; water[i] = 0; ramp[i] = 0; if (s != null) surf[i] = s; if (retro) map.markDirty(x, z); };
    for (let x = ox; x < ox + 16; x++) setT(x, oz, 1, 1);
    for (const x0 of [ox, ox + 14]) for (let x = x0; x < x0 + 2; x++) for (let z = oz; z <= oz + 2; z++) setT(x, z, 2, 1);
    for (let z = 2; z <= oz; z++) for (const x of [ox + 11, ox + 12]) setT(x, z, 0, 4);
    for (let z = oz + 2; z <= oz + 5; z++) for (const x of [ox + 11, ox + 12]) { const o = map.objAt(x, z); if (o && !G.OBJ[o.t].walk && o.t !== 'gare') map.removeObj(o); if (!map.objAt(x, z)) { surf[I(x, z)] = 11; if (retro) map.markDirty(x, z); } }
    const add = (t, x, z, r = 0, ex) => map.canPlace(t, x, z, r) ? map.addObj(t, x, z, r, ex) : null;
    for (const x of [ox + 11, ox + 12]) { const o = map.objAt(x, 1); if (o) map.removeObj(o); }
    map.addObj('tunnel', ox + 1, oz, 1, { v: 32 }); map.addObj('tunnel', ox + 14, oz, 3, { v: 32 }); map.addObj('tunnel2', ox + 11, 1, 0, { v: 23 });
    for (let x = ox + 2; x < ox + 14; x++) { if (!map.objAt(x, oz + 1)) add('rails', x, oz + 1, 1); if (!map.objAt(x, oz + 2)) { surf[I(x, oz + 2)] = 11; if (retro) map.markDirty(x, oz + 2); } }
    add('signal_pn', ox + 10, oz + 2); add('signal_pn', ox + 13, oz + 2);
    map.meta.rueGate = { x0: ox + 11, x1: ox + 13, z: 3.3, sx: ox + 12, sz: 4.4 };
    const g = [...map.list].find(o => o.t === 'gare'); map.meta.train = { x0: ox + 2, x1: ox + 14, z: oz + 1.5, stop: g ? g.x + 3 : ox + 6, y: 0 };
    map.meta.signals = [[ox + 10, oz + 2], [ox + 13, oz + 2]];
    if (!retro) {
      add('gare', ox + 3, oz + 3);
      for (let z = oz + 6; z <= oz + 8; z++) for (let x = ox + 1; x <= ox + 14; x++) surf[I(x, z)] = 11;
      add('banc', ox + 3, oz + 2, 2); add('banc', ox + 6, oz + 2, 2); add('horloge', ox + 9, oz + 2);
      add('lampadaire', ox + 2, oz + 6); add('lampadaire', ox + 9, oz + 6); add('lampadaire', ox + 13, oz + 6);
      add('montgolfiere', ox + 12, oz + 8); add('panneau', ox + 13, oz + 4, 0, { txt: 'Rue commerçante ↑ : traverse les rails et passe par le tunnel !' });
      ['tulipe_rouge', 'tulipe_jaune', 'tulipe_blanche', 'tulipe_rose'].forEach((t, k) => { add(t, ox + 1 + k, oz + 9); add(t, ox + 10 + k, oz + 9); });
      map.meta.gare = { x: ox + 6, z: oz + 6.6 };
    }
  }
  G.STRUCT.gare = c => { station(c.map, c.ox, c.oz, false); c.targets.push([c.ox + 6, c.oz + 6, 4]); };
  const labelGate = m => { const g = m.meta.rueGate; if (g && !m._gateLbl) { m._gateLbl = G.mapLabel(m, '🏬 Rue commerçante', g.sx, 3.25, 2.25, 1.1); } };
  G.on('worldgen', map => labelGate(map));
  G.on('load', () => { const m = G.world; if (m.meta.gare && !m.meta.rueGate) { const g = [...m.list].find(o => o.t === 'gare'); if (g) { station(m, g.x - 5, g.z - 3, true); m.flush(); } } labelGate(m); R.reset(); const s = loadRue; loadRue = null; if (s) R.go(s.x, s.z, s.yaw, true); });
  G.on('newGame', () => R.reset());
  // ---------- le train ----------
  const TR = G.train = { st: null, slot: -1, planes: [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)], blink: 0, chug: 0, bell: 0 };
  const LEN = 9.6;
  const snd = (type, f0, f1, dur, vol, t0 = 0) => { const A = G.audio; if (!A || !A.ok || vol < .002) return; try { const C = A.ctx, t = C.currentTime + t0, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.linearRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + dur + .05); } catch (e) { } };
  const near = k => { const m = TR.m || G.world, t = m.meta.train, p = G.player; return t && G.map === m ? k * G.clamp(1 - Math.hypot(p.x - TR.st.x, p.z - t.z) / 45, 0, 1) : 0; };
  const whistle = k => { snd('triangle', 740, 760, .5, .07 * k); snd('triangle', 932, 950, .5, .055 * k); snd('triangle', 740, 700, .85, .07 * k, .6); snd('triangle', 932, 880, .85, .055 * k, .6); };
  G.on('init', scene => {
    G.renderer.localClippingEnabled = true; const pl = TR.planes;
    const mats = [G.toon({ vertexColors: true, clippingPlanes: pl }), G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true, clippingPlanes: pl })), G.toon({ vertexColors: true, transparent: true, opacity: .62, depthWrite: false, clippingPlanes: pl }), G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true, clippingPlanes: pl }))];
    const m = new THREE.Mesh(G.getGeo('train', 0), mats); m.castShadow = true; m.frustumCulled = false; m.visible = false;
    TR.ol = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x3a2619, side: THREE.BackSide, clippingPlanes: pl }), { outline: .016 }); G.addOutline(m, TR.ol); TR.glow = mats[1];
    scene.add(m); TR.mesh = m;
  });
  // le train roule dans le village affiché (le sien, ou celui qu'on visite)
  const trainMap = () => G.map && !G.map.interior && G.map.meta && G.map.meta.train ? G.map : G.world;
  TR.start = (wait = 0) => { const m = trainMap(), t = m && m.meta.train; if (!t || TR.st) return false; TR.m = m; TR.st = { x: t.x0 - LEN / 2 - 1.5, v: 8, ph: 'in', t: 0, wait }; return true; };
  const setSignals = v => { const m = TR.m || G.world; for (const [x, z] of m.meta.signals || []) { const o = m.objAt(x, z); if (o && o.t === 'signal_pn' && (o.v || 0) !== v) { o.v = v; m.refresh(o); } } };
  G.on('update', dt => {
    if (TR.st && TR.m && TR.m !== trainMap() && TR.m !== G.world) { TR.st = null; TR.blinkOn = false; }
    const m = TR.st ? (TR.m || G.world) : trainMap(); if (!m || !TR.mesh) return; const t = m.meta.train; if (!t) { TR.mesh.visible = false; return; }
    const h = G.clock.min / 60, slot = Math.floor(G.clock.min / 120);
    if (TR.slot < 0) TR.slot = slot; if (slot !== TR.slot) { TR.slot = slot; if (h >= 6 && h < 23.5) TR.start(); }
    const s = TR.st; if (!s) { TR.mesh.visible = false; if (TR.blinkOn) { TR.blinkOn = false; setSignals(0); } return; }
    if (s.wait > 0) { s.wait -= dt; TR.mesh.visible = false; return; }
    if (s.t === 0 && s.ph === 'in' && !s.whistled) { s.whistled = 1; whistle(near(1)); }
    if (s.ph === 'in') { const d = t.stop - s.x; s.v = Math.min(9, Math.sqrt(Math.max(0, 2 * 3.2 * d)) + .25); s.x += s.v * dt; if (d <= .04) { s.x = t.stop; s.v = 0; s.ph = 'stop'; s.t = 0; } }
    else if (s.ph === 'stop') { s.t += dt; if (s.t > 6) { s.ph = 'out'; whistle(near(1)); } }
    else { s.v = Math.min(9, s.v + 3 * dt); s.x += s.v * dt; if (s.x - LEN / 2 > t.x1 + 1) { TR.st = null; TR.mesh.visible = false; setSignals(0); TR.blinkOn = false; return; } }
    TR.planes[0].constant = -t.x0; TR.planes[1].constant = t.x1;
    TR.mesh.position.set(s.x, m.baseH(Math.floor(t.x0 + 1), Math.floor(t.z)) + .1, t.z); TR.mesh.visible = G.map === m; TR.glow.color.copy(G.M.glow.color); TR.ol.visible = G.M.outline.visible;
    TR.blink -= dt; if (TR.blink < 0) { TR.blink = .45; TR.blinkOn = true; TR.side = TR.side === 1 ? 2 : 1; setSignals(TR.side); snd('square', 1480, 1480, .1, .045 * near(1)); snd('sine', 2960, 2960, .08, .02 * near(1)); }
    if (s.v > .3) { TR.chug -= dt * s.v; if (TR.chug < 0) { TR.chug = 1.1; snd('sawtooth', 95, 55, .09, .05 * near(1)); } }
    const p = G.player; if (G.map === m && !p.vehicle && Math.abs(p.z - t.z) < .7 && Math.abs(p.x - s.x) < LEN / 2 + .8) { p.z = t.z + 1.25; p.y = m.topAt(p.x, p.z); p.vz = 2; if ((TR.warn = (TR.warn || 0) - dt) < 0) { TR.warn = 3; G.ui.toast('Attention au train ! 🚂'); G.sfx('hurt'); } }
  });
  // Pablo, au guichet : on peut attendre le prochain train
  G.npcRoles.gare = v => G.npcSay(v, ['Bienvenue à la gare de ' + G.villageName + ' ! Hi hi !'], ['Attendre le prochain train', 'Utiliser les casiers', 'Au revoir']).then(k => {
    if (k === 0) { const ok = TR.start(4); return G.npcSay(v, ok ? ['Le train arrive dans un instant ! Sors vite sur le quai pour le voir passer, hi hi !'] : ['Un train est déjà en gare ! Dépêche-toi !']); }
    if (k === 1) G.ui.openStorage(); });
  // ---------- la rue commerçante (carte à part) ----------
  // une seule longue rangée de vitrines face au sud, comme la rue du village d'ACNL
  const SHOPS = [['musee', 5, 'rue_musee', 'Musée'], ['cafe', 11, 'rue_cafe', 'Café Le Perchoir'], ['boutique', 16, 'rue_boutique', 'Supérette Gaston'], ['couturiere', 22, 'rue_couture', 'Sœurs Laine'], ['salon', 27, 'rue_salon', 'Salon Frisette'],
    ['chausseur', 32, 'rue_chausseur', 'Chausseur Lacet'], ['jardinerie', 37, 'rue_jardin', 'Jardinerie Feuillu'], ['agence', 43, 'rue_agence', 'Agence Nid Douillet'], ['club', 48, 'rue_club', 'Club Rire']];
  const RW = 56, RH = 24, RX = 27; // largeur, hauteur, entrée (cases RX et RX+1)
  G.genRue = () => {
    const W = RW, H = RH, m = new G.GMap(W, H, { kind: 'rue', id: 'rue' }), I = (x, z) => z * W + x, r = G.rng(4242);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = I(x, z); if (x < 3 || x >= W - 3 || z < 4 || z >= H - 3) { m.lvl[i] = 3; m.surf[i] = 1; } else m.surf[i] = G.hash2(x, z, 7) < .1 ? 14 : 0; }
    for (let z = H - 3; z < H - 1; z++) for (const x of [RX, RX + 1]) { m.lvl[I(x, z)] = 0; m.surf[I(x, z)] = 3; }
    for (let x = 3; x < W - 3; x++) { for (const z of [8, 9, 13, 14]) m.surf[I(x, z)] = 11; for (const z of [10, 11, 12]) m.surf[I(x, z)] = 4; }
    for (let z = 15; z < H - 3; z++) for (const x of [RX, RX + 1]) m.surf[I(x, z)] = 3;
    const put = (t, x, z, rot = 0, ex) => m.canPlace(t, x, z, rot) ? m.addObj(t, x, z, rot, ex) : null;
    const labels = [];
    for (const [t, x, iid, name] of SHOPS) { const o = put(t, x, 5, 0, { iid }); if (o) labels.push([name, m.center(o)[0]]); }
    m.addObj('tunnel2', RX, H - 1, 2, { v: 23 });
    for (const x of [9, 14, 20, 25, 30, 35, 41, 46, 51]) put('lampadaire', x, 9);
    for (const x of [4, 10, 16, 22, 33, 39, 45, 51]) put('lampadaire', x, 13);
    for (const x of [9, 30, 41]) put('banc_parc', x, 8); for (const x of [14, 25, 46]) put('pot_fleurs', x, 8);
    put('parasol', 15, 9); put('table', 10, 9); put('chaise', 11, 9, 3); put('horloge', 26, 13);
    for (const x of [6, 18, 35, 47]) put('banc_parc', x, 14, 2);
    for (const [x, z] of [[RX - 1, 15], [RX + 2, 15], [RX - 1, 19], [RX + 2, 19]]) put('lanterne_pierre', x, z);
    put('fontaine', 12, 16); put('fontaine', 42, 16); put('statue', 21, 17); put('statue', 34, 17);
    for (const [x, t] of [[4, 'cerisier'], [8, 'chene'], [16, 'cerisier'], [24, 'bouleau'], [31, 'bouleau'], [38, 'cerisier'], [47, 'chene'], [51, 'cerisier']]) put(t, x, 18 + (x % 2));
    const FL = ['rouge', 'jaune', 'blanche', 'rose', 'bleue', 'violette', 'orange'];
    for (const cx of [5, 9, 18, 23, 31, 36, 45, 49]) for (let k = 0; k < 6; k++) put((k % 2 ? 'tulipe_' : 'fleur_') + FL[(cx + k) % 7], cx + (k % 3), 16 + Math.floor(k / 3));
    for (let x = 2; x < W - 2; x++) for (const z of [2, 3]) if (r() < .4) put(r() < .6 ? 'sapin' : 'chene', x, z);
    for (let z = 4; z < H - 2; z++) for (const x of [2, W - 3]) if (r() < .35) put(r() < .6 ? 'sapin' : 'chene', x, z);
    for (let x = 2; x < W - 2; x++) if (Math.abs(x - RX - .5) > 3 && r() < .35) put(r() < .5 ? 'sapin' : 'chene', x, H - 2);
    m.meta = { rue: true, spawn: { x: RX + 1, z: H - 3.2 }, exitZ: H - 2.35, seaZ: H + 1000, plaza: { x: RX + 1, z: 11 }, homes: [{ vi: 0, x: 17, z: 10 }, { vi: 2, x: 38, z: 10 }], title: 'Rue commerçante' };
    for (const [n, x] of labels) G.mapLabel(m, n, x, 3.4, 8.05, .95);
    G.mapLabel(m, '⛲ ' + G.villageName + ' · Rue commerçante', RX + 1, 5.35, H - 1.55, 1.25);
    return m;
  };
  let loadRue = null;
  const R = G.rue = {
    get() { if (!G.rueMap) { const m = G.rueMap = G.genRue(); G.scene.add(m.group); m.buildAll(); m.group.visible = false; G.ents.spawnVillagers(m); m.objr.setOutlines(G.settings.outlines === 'tout' && G.settings.quality !== 'low'); } return G.rueMap; },
    reset() { if (G.rueMap) { G.scene.remove(G.rueMap.group); G.ents.removeNPCs(G.rueMap); for (const v of G.ents.villagers.slice()) if (v.map === G.rueMap) { G.scene.remove(v.root); G.scene.remove(v.blob); G.ents.villagers.splice(G.ents.villagers.indexOf(v), 1); } } G.rueMap = null; },
    go(x, z, yaw, instant) { const m = R.get(), s = m.meta.spawn, f = () => { G.enterMap(m, x != null ? x : s.x, z != null ? z : s.z, yaw != null ? yaw : Math.PI); if (!G.flags.rue) { G.flags.rue = 1; G.ui.toast('Bienvenue dans la rue commerçante ! 🏬 Neuf boutiques t\'attendent.'); } };
      if (instant) return f(); G.sfx('door'); G.ui.fade(f, .45); },
    back() { const g = G.world.meta.rueGate || G.world.meta.gare || G.world.meta.spawn; G.sfx('door'); G.ui.fade(() => G.enterMap(G.world, g.sx || g.x, g.sz || g.z, 0), .45); }
  };
  G.on('move', (p, m) => {
    if (G.ui.fading || p.vehicle || G.state !== 'play') return;
    if (m === G.world) { const g = m.meta.rueGate; if (g && p.z < g.z && p.x >= g.x0 && p.x < g.x1) R.go(); }
    else if (m === G.rueMap && p.z > m.meta.exitZ && Math.abs(p.x - (m.meta.exitX != null ? m.meta.exitX : RX + 1)) < 1.4) R.back();
  });
  const oex = G.act.exitHouse; G.act.exitHouse = () => {
    const im = G.map; if (G.ui.fading) return; if (!im.interior || im.meta.fromId !== 'rue' || G.act._exiting) return oex();
    G.act._exiting = true; const b = im.meta.door, to = R.get(); G.sfx('door'); G.ui.fade(() => { G.enterMap(to, b.x, b.z, b.yaw); G.act._exiting = false; });
  };
  G.on('save', mods => { if (G.map && G.map === G.rueMap) { const p = G.player; mods.rue = { x: p.x, z: p.z, yaw: p.yaw }; } });
  // G.restore et G.setOutlines n'existent qu'une fois game.js chargé
  G.on('init', () => {
    const oload = G.restore; G.restore = d => { loadRue = d.mods && d.mods.rue || null; TR.blinkOn = true; TR.st = null; return oload(d); };
    const oso = G.setOutlines; G.setOutlines = mode => { oso(mode); if (G.rueMap) G.rueMap.objr.setOutlines(mode === 'tout' && G.settings.quality !== 'low'); };
  });
  G.on('frame', () => { if (G.map && G.map === G.rueMap && G.state === 'play') { const l = G.el('mm-label'); if (l && l.textContent !== 'Rue commerçante') l.textContent = 'Rue commerçante'; } });
})();
