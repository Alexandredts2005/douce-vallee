'use strict';
// ===== Ta maison en grand : hauteur sous plafond immense (6,5 à 7,2), parquet en point de Hongrie verni (ou bâtons rompus,
// damier de marbre…), murs à moulures façon haussmannien, corniche à denticules, hautes portes-fenêtres par lesquelles
// le soleil entre VRAIMENT (ombres des petits bois sur le parquet, rayons de lumière et poussière dorée), rideaux de velours
// et voilages, appliques dorées, tableaux, lustres en cristal accrochés au plafond qui éclairent la pièce. =====
(function () {
  const PI = Math.PI, TAU = PI * 2, GOLD = 0xd9b04a, O = G.OBJ;
  const SK = () => G.SK || {};
  // pièces plus grandes dès le départ
  G.HOME_STAGES = [[10, 8], [12, 10], [14, 11], [16, 12]]; if (G.ROOMKINDS && G.ROOMKINDS.maison) Object.assign(G.ROOMKINDS.maison, { W: 10, H: 8 });
  // ---------- nouveaux sols et peintures (menu « Décorer la pièce », touche H) ----------
  const S = 128, FLOORS = { chevrons_chene: 1, batons_rompus: 2, damier_marbre: 3, chevrons_noyer: 4, batons_noyer: 5 };
  const drawChev = (x, dark) => { x.fillStyle = dark ? '#6a4228' : '#b98552'; x.fillRect(0, 0, S, S); for (let c = 0; c < 2; c++) for (let k = -4; k < 12; k++) for (const sd of [-1, 1]) { const x0 = c * 64 + 32, y0 = k * 16; x.fillStyle = (k + c + (sd > 0 ? 1 : 0)) % 3 ? (dark ? '#7a4f30' : '#c99460') : (dark ? '#5e3a22' : '#a87444');
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + sd * 32, y0 + 32); x.lineTo(x0 + sd * 32, y0 + 46); x.lineTo(x0, y0 + 14); x.fill(); x.strokeStyle = 'rgba(40,20,10,.5)'; x.stroke(); } };
  const drawBat = (x, dark) => { x.fillStyle = dark ? '#6a4228' : '#b98552'; x.fillRect(0, 0, S, S); for (let i = -2; i < 10; i++) for (let j = -2; j < 10; j++) { const hz = (i + j) % 2 === 0; x.fillStyle = (i * 3 + j) % 4 ? (dark ? '#7a4f30' : '#c99460') : (dark ? '#5e3a22' : '#a87444'); const px = i * 16 - j * 16, py = j * 16 + i * 0;
      x.save(); x.translate(px + 64, py); x.rotate(PI / 4); x.fillRect(0, 0, hz ? 40 : 10, hz ? 10 : 40); x.strokeStyle = 'rgba(40,20,10,.5)'; x.strokeRect(0, 0, hz ? 40 : 10, hz ? 10 : 40); x.restore(); } };
  G.FLOORS.unshift(['chevrons_chene', 'Point de Hongrie (chêne)', x => drawChev(x, false)], ['batons_rompus', 'Bâtons rompus (chêne)', x => drawBat(x, false)], ['chevrons_noyer', 'Point de Hongrie (noyer)', x => drawChev(x, true)], ['batons_noyer', 'Bâtons rompus (noyer)', x => drawBat(x, true)],
    ['damier_marbre', 'Damier de marbre', x => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { x.fillStyle = (i + j) % 2 ? '#1e1e22' : '#eeece8'; x.fillRect(i * 64, j * 64, 64, 64); } x.strokeStyle = 'rgba(150,150,160,.5)'; x.beginPath(); x.moveTo(5, 20); x.lineTo(60, 50); x.lineTo(120, 30); x.stroke(); }]);
  const PAINTS = { peinture_lin: [0xf1ebe0, 'Peinture lin & moulures'], peinture_ivoire: [0xf7f3ea, 'Blanc ivoire & moulures'], peinture_sauge: [0xc9d4c2, 'Vert sauge & moulures'], peinture_bleu: [0xbfcad6, 'Bleu gris & moulures'], peinture_rose: [0xead2cf, 'Rose poudré & moulures'], peinture_empire: [0x3f5a4a, 'Vert Empire & moulures'], peinture_nuit: [0x2c3548, 'Bleu nuit & moulures'] };
  for (const k in PAINTS) G.WALLS.unshift([k, PAINTS[k][1], x => { const c = '#' + PAINTS[k][0].toString(16).padStart(6, '0'); x.fillStyle = c; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.strokeRect(16, 12, 96, 64); x.strokeRect(16, 92, 96, 26); x.strokeStyle = 'rgba(0,0,0,.12)'; x.strokeRect(19, 15, 90, 58); }]);
  // ---------- quelles pièces ? ----------
  const special = m => { const w = G.outsideOf(m); if (!w) return false; for (const q of w.list) if (q.iid === m.id && (/^chateau/.test(q.t) || (O[q.t] && O[q.t].floors))) return true; return false; };
  const isGrand = m => m && m.interior && m.kind === 'maison' && !/_e\d|_a\d/.test(m.id) && !(m.W >= 22) && !special(m);
  G.isGrandHome = isGrand;
  // ---------- outils de géométrie ----------
  const plane = (w, h, mat, ru = 1, rv = 1) => { const g = new THREE.PlaneGeometry(w, h); if (ru !== 1 || rv !== 1) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); } const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.castShadow = true; me.frustumCulled = false; return me; };
  // repère d'un mur : origine au coin gauche vu de l'intérieur, axe le long du mur, normale vers l'intérieur
  const WALLS = m => { const W = m.W, H = m.H; return [
    { id: 'n', L: W, at: (u, y, o = 0) => [u, y, o], ry: 0 },
    { id: 'w', L: H, at: (u, y, o = 0) => [o, y, H - u], ry: PI / 2 },
    { id: 'e', L: H, at: (u, y, o = 0) => [W - o, y, u], ry: -PI / 2 },
    { id: 's', L: W, at: (u, y, o = 0) => [W - u, y, H - o], ry: PI } ]; };
  const matCache = {};
  const paintMat = col => matCache['p' + col] || (matCache['p' + col] = G.premiumMat({ color: col }, { cloud: false, rough: .78 }));
  const floorMat = kind => matCache['f' + kind] || (matCache['f' + kind] = G.premiumMat({ color: 0xffffff }, { cloud: false, floor: kind, bump: 1 }));
  const shadowOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  // ---------- la coque ----------
  function grandShell(m) {
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); }
    const sh = m.meta.shell || (m.meta.shell = {}), W = m.W, H = m.H, CH = m.meta.ceilH = W * H >= 150 ? 7.2 : 6.5, g = new THREE.Group(), sk = SK();
    const wallId = sh.wall || 'peinture_lin', floorId = sh.floor || 'chevrons_chene', paint = PAINTS[wallId] ? PAINTS[wallId][0] : null;
    const wallCol = paint != null ? paint : 0xf1ebe0, trim = paint != null ? new THREE.Color(paint).lerp(new THREE.Color(0xffffff), paint < 0x808080 ? .12 : .35).getHex() : 0xf7f3ea;
    const dk = new THREE.Color(wallCol).getHSL({}).l < .4;
    sh.envTop = 0xf3efe8; sh.envHor = new THREE.Color(wallCol).lerp(new THREE.Color(0xd9b48a), .35).getHex();
    // sol
    const fm = FLOORS[floorId] ? floorMat(FLOORS[floorId]) : G.premiumMat({ map: G.patTex('floor', floorId) }, { cloud: false, rough: .5 });
    const fl = plane(W, H, fm, W / 2, H / 2); fl.rotation.x = -PI / 2; fl.position.set(W / 2, .002, H / 2); fl.castShadow = false; g.add(fl);
    // ouvertures : portes-fenêtres (mur du fond, côtés, devant) et porte d'entrée
    const wm = paint != null ? paintMat(wallCol) : G.premiumMat({ map: G.patTex('wall', wallId) }, { cloud: false, rough: .85 });
    const holes = {}, WY0 = .1, WY1 = Math.min(CH - 1.6, 4.4), WW = 1.5, DW = 2.1, DH = 3.4;
    for (const w of WALLS(m)) { const n = w.id === 'n' || w.id === 's' ? Math.max(2, Math.floor(w.L / 3.6)) : Math.max(1, Math.floor(w.L / 4.2)), list = [];
      for (let k = 0; k < n; k++) { let u = (k + .5) * w.L / n; if (w.id === 's') { const c = W / 2; if (Math.abs(u - c) < 2.4) continue; } list.push({ u, w: WW, y0: WY0, y1: WY1, win: 1 }); }
      if (w.id === 's') list.push({ u: W - (Math.floor(W / 2) + .5), w: DW, y0: 0, y1: DH, door: 1 });
      holes[w.id] = list.sort((a, b) => a.u - b.u); }
    const front = new THREE.Group(), frontSh = new THREE.Group();
    const b = G.mb(950), bf = G.mb(951); // moulures (intérieur), et celles du mur de devant
    for (const w of WALLS(m)) {
      const hs = holes[w.id], tgt = w.id === 's' ? front : g, B = w.id === 's' ? bf : b;
      const piece = (u0, u1, y0, y1) => { if (u1 - u0 < .005 || y1 - y0 < .005) return; const me = plane(u1 - u0, y1 - y0, wm, (u1 - u0) / 2, (y1 - y0) / 2); me.position.set(...w.at((u0 + u1) / 2, (y0 + y1) / 2, .001)); me.rotation.y = w.ry; tgt.add(me);
        if (w.id === 's') { const s2 = new THREE.Mesh(me.geometry, shadowOnly); s2.position.copy(me.position); s2.rotation.copy(me.rotation); s2.castShadow = true; frontSh.add(s2); } };
      let u = 0; for (const h of hs) { piece(u, h.u - h.w / 2, 0, CH); piece(h.u - h.w / 2, h.u + h.w / 2, 0, h.y0); piece(h.u - h.w / 2, h.u + h.w / 2, h.y1, CH); u = h.u + h.w / 2; } piece(u, w.L, 0, CH);
      // plinthes, cimaise, corniche à denticules, frise, panneaux moulurés
      const R = (u0, u1, y, hh, d, col, s) => { if (u1 - u0 < .01) return; B.S(s); B.box(u1 - u0, hh, d, col, ...w.at((u0 + u1) / 2, y, d / 2), 0, w.ry, 0); B.S(null); };
      const segs = []; u = 0; for (const h of hs) { segs.push([u, h.u - h.w / 2 - .12]); u = h.u + h.w / 2 + .12; } segs.push([u, w.L]);
      for (const [u0, u1] of segs) { R(u0, u1, .14, .28, .035, trim, sk.paint); R(u0, u1, 1.05, .07, .045, trim, sk.paint); R(u0, u1, .29, .02, .04, trim, sk.paint);
        const pw = u1 - u0; if (pw < .5) continue; const np = Math.max(1, Math.round(pw / 1.6)), gap = .14;
        for (let k = 0; k < np; k++) { const a = u0 + gap + k * (pw - gap) / np, c = u0 + (k + 1) * (pw - gap) / np; // panneaux bas et hauts
          for (const [y0, y1] of [[.42, .9], [1.3, CH - 1.25]]) { if (y1 - y0 < .3) continue; R(a, c, y0, .028, .022, trim, sk.paint); R(a, c, y1, .028, .022, trim, sk.paint); B.S(sk.paint); B.box(.028, y1 - y0, .022, trim, ...w.at(a, (y0 + y1) / 2, .011), 0, w.ry, 0); B.box(.028, y1 - y0, .022, trim, ...w.at(c, (y0 + y1) / 2, .011), 0, w.ry, 0); B.S(null);
            if (y0 > 1) { B.S(sk.gold); const iy0 = y0 + .07, iy1 = y1 - .07; B.box(c - a - .14, .008, .01, GOLD, ...w.at((a + c) / 2, iy0, .012), 0, w.ry, 0); B.box(c - a - .14, .008, .01, GOLD, ...w.at((a + c) / 2, iy1, .012), 0, w.ry, 0); B.box(.008, iy1 - iy0, .01, GOLD, ...w.at(a + .07, (iy0 + iy1) / 2, .012), 0, w.ry, 0); B.box(.008, iy1 - iy0, .01, GOLD, ...w.at(c - .07, (iy0 + iy1) / 2, .012), 0, w.ry, 0); B.S(null); } } } }
      R(0, w.L, CH - .12, .24, .2, trim, sk.paint); R(0, w.L, CH - .3, .12, .13, trim, sk.paint); R(0, w.L, CH - .4, .06, .08, trim, sk.paint); R(0, w.L, CH - .95, .05, .05, trim, sk.paint);
      B.S(sk.paint); for (let k = 0; k < Math.floor(w.L / .16); k++) B.box(.05, .05, .05, trim, ...w.at(.08 + k * .16, CH - .5, .07), 0, w.ry, 0); B.S(null);
      // ébrasements, encadrements, petits bois, vitres (vue dehors), rideaux de velours, voilages
      for (const h of hs) { const c = h.u, x0 = c - h.w / 2, x1 = c + h.w / 2;
        B.S(sk.paint); for (const s of [-1, 1]) B.box(.06, h.y1 - h.y0 + .06, .32, trim, ...w.at(c + s * (h.w / 2 + .03), (h.y0 + h.y1) / 2, -.12), 0, w.ry, 0); B.box(h.w + .12, .06, .32, trim, ...w.at(c, h.y1 + .03, -.12), 0, w.ry, 0);
        for (const s of [-1, 1]) B.box(.12, h.y1 - h.y0 + .2, .05, trim, ...w.at(c + s * (h.w / 2 + .08), (h.y0 + h.y1) / 2 + .05, .02), 0, w.ry, 0); B.box(h.w + .4, .14, .06, trim, ...w.at(c, h.y1 + .1, .025), 0, w.ry, 0);
        if (h.door) { // porte d'entrée à deux battants, imposte vitrée
          for (const s of [-1, 1]) { const lx = c + s * h.w / 4; B.S(sk.paint); B.box(h.w / 2 - .03, h.y1 - .5, .06, 0xf7f3ea, ...w.at(lx, (h.y1 - .5) / 2, -.03), 0, w.ry, 0); for (const yy of [.8, 2.0]) B.box(h.w / 2 - .26, yy < 1 ? .9 : 1.0, .03, 0xece6da, ...w.at(lx, yy, .0), 0, w.ry, 0); B.S(sk.gold); B.sph(.04, GOLD, ...w.at(c + s * .12, 1.15, .02)); B.S(null); }
          B.S(sk.paint); B.box(h.w, .06, .07, trim, ...w.at(c, h.y1 - .5, -.03), 0, w.ry, 0); B.S(null); continue; }
        // petits bois de la porte-fenêtre (ils font de belles ombres sur le parquet)
        B.S(sk.paint); B.box(.05, h.y1 - h.y0, .06, 0xf7f3ea, ...w.at(c, (h.y0 + h.y1) / 2, -.2), 0, w.ry, 0); const tr = h.y1 - .7; B.box(h.w, .06, .06, 0xf7f3ea, ...w.at(c, tr, -.2), 0, w.ry, 0);
        for (let k = 1; k < 4; k++) B.box(h.w, .03, .05, 0xf7f3ea, ...w.at(c, h.y0 + k * (tr - h.y0) / 4, -.2), 0, w.ry, 0); for (const s of [-1, 1]) B.box(.025, tr - h.y0, .05, 0xf7f3ea, ...w.at(c + s * h.w / 4, (h.y0 + tr) / 2, -.2), 0, w.ry, 0);
        B.box(h.w, .05, .06, 0xf7f3ea, ...w.at(c, h.y0 + .02, -.2), 0, w.ry, 0); B.S(sk.gold); B.box(.025, .2, .03, GOLD, ...w.at(c - .06, 1.2, -.16), 0, w.ry, 0); B.S(null);
        if (w.id !== 's') { const pane = new THREE.Mesh(new THREE.PlaneGeometry(h.w, h.y1 - h.y0), G.M.windowTall || G.M.window); pane.position.set(...w.at(c, (h.y0 + h.y1) / 2, -.26)); pane.rotation.y = w.ry; pane.castShadow = false; pane.frustumCulled = false; g.add(pane); }
        // rideaux (de côté, ils ne cachent pas la lumière) et cantonnière
        const curt = dk ? 0xd9c9a8 : 0x8a2f3a, cy = (h.y1 + .2 + 0) / 2 + .1, chh = h.y1 + .6;
        B.S(sk.velvet); for (const s of [-1, 1]) { const cx = c + s * (h.w / 2 + .32); for (let k = 0; k < 4; k++) B.box(.12, chh, .07 + (k % 2) * .03, k % 2 ? new THREE.Color(curt).multiplyScalar(.82).getHex() : curt, ...w.at(cx - s * .14 + s * k * .08, chh / 2, .14), 0, w.ry, 0);
          B.S(sk.gold); B.add(new THREE.TorusGeometry(.11, .015, 6, 14), GOLD, B.M(...w.at(cx, 1.1, .2), PI / 2, w.ry, 0), 0, true); B.S(sk.velvet); }
        B.box(h.w + 1.1, .38, .1, curt, ...w.at(c, chh - .1, .18), 0, w.ry, 0); B.S(sk.gold); B.box(h.w + 1.12, .04, .11, GOLD, ...w.at(c, chh - .3, .19), 0, w.ry, 0); for (let k = 0; k < 9; k++) B.sph(.025, GOLD, ...w.at(c - (h.w + 1) / 2 + k * (h.w + 1) / 8, chh - .34, .2));
        B.S(null); }
      // appliques dorées (lumière douce) et tableaux entre les fenêtres
      if (w.id !== 's') for (const [u0, u1] of segs) { const pw = u1 - u0; if (pw < 1.3) continue; const c = (u0 + u1) / 2;
        B.S(sk.gold); for (const s of pw > 2.4 ? [-1, 1] : [0]) { const ax = c + s * Math.min(.9, pw * .3); B.box(.09, .2, .04, GOLD, ...w.at(ax, 2.55, .03), 0, w.ry, 0); for (const t of [-1, 1]) { B.add(new THREE.TorusGeometry(.09, .012, 5, 10, PI), GOLD, B.M(...w.at(ax + t * .09, 2.5, .1), 0, w.ry + (t > 0 ? 0 : PI), PI / 2), 0, true); B.cyl(.024, .02, .03, 8, GOLD, ...w.at(ax + t * .18, 2.5, .12)); B.S(sk.ceramic); B.cyl(.012, .012, .1, 8, 0xfff8ec, ...w.at(ax + t * .18, 2.57, .12)); B.S(null); B.sph(.02, 0xffd27a, ...w.at(ax + t * .18, 2.64, .12), 1, 1.5, 1, 1, 8, 6); B.S(sk.gold); } }
        if (pw > 1.8) { B.S(sk.gold); const fw = Math.min(1.3, pw * .45), fh = fw * .78, fy = Math.min(CH - 2, 4.0); B.box(fw + .14, fh + .14, .05, GOLD, ...w.at(c, fy, .03), 0, w.ry, 0); B.S(null);
          const art = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), artMat((w.id.charCodeAt(0) + Math.round(c * 7)) % 5)); art.position.set(...w.at(c, fy, .062)); art.rotation.y = w.ry; art.frustumCulled = false; tgt.add(art); }
        B.S(null); }
    }
    // plafond (vu d'en dessous seulement), rosaces, encadrement ; dessus des murs ; enveloppe extérieure sombre
    const ceil = plane(W, H, paintMat(0xf6f2ea)); ceil.rotation.x = PI / 2; ceil.position.set(W / 2, CH, H / 2); g.add(ceil);
    b.S(sk.paint); for (const [x, z, w2, d2] of [[W / 2, .8, W - 1.2, .06], [W / 2, H - .8, W - 1.2, .06], [.8, H / 2, .06, H - 1.6], [W - .8, H / 2, .06, H - 1.6]]) b.box(w2, .05, d2, 0xf7f3ea, x, CH - .025, z); b.S(null);
    for (const [x, z, w2, d2] of [[W / 2, -.12, W + .48, .24], [W / 2, H + .12, W + .48, .24], [-.12, H / 2, .24, H], [W + .12, H / 2, .24, H]]) b.box(w2, .06, d2, 0x2a1e16, x, CH + .03, z); // dessus des murs (pas de mur plein dehors : le soleil passe par les fenêtres)
    b.box(W + .6, .3, H + .6, 0x3a2a1e, W / 2, -.16, H / 2);
    const sm = new THREE.Mesh(b.done(), G.MATS); sm.receiveShadow = true; sm.castShadow = true; sm.frustumCulled = false; g.add(sm);
    const fmesh = new THREE.Mesh(bf.done(), G.MATS); fmesh.receiveShadow = true; fmesh.castShadow = true; fmesh.frustumCulled = false; front.add(fmesh);
    // ombre du mur de devant même quand on ne le voit pas (le soleil passe par ses fenêtres)
    const fshadow = new THREE.Mesh(fmesh.geometry, shadowOnly); fshadow.castShadow = true; fshadow.frustumCulled = false; frontSh.add(fshadow);
    g.add(front); g.add(frontSh); g.traverse(c => { if (c.isMesh) c.frustumCulled = false; });
    m.shell = g; m.group.add(g); m._fw = front; m._gl = { holes, CH, beams: [], t: 0 };
    m.meta.sunny = 1; m.meta.bright = 1; delete m._cx;
    m.meta.cam = { pitch: .6, dist: Math.max(11, W * 1.15), ty: 1.2, fx: .5, fz: .5, dz: .6 };
    // lustres de départ, au plafond
    if (!m.meta.lustres && O.lustre_cristal) { m.meta.lustres = 1; const spots = W * H <= 90 ? [['lustre_versailles', W / 2, H / 2]] : W >= H ? [['lustre_cristal', W / 3, H / 2], ['lustre_cristal', W * 2 / 3, H / 2]] : [['lustre_cristal', W / 2, H / 3], ['lustre_cristal', W / 2, H * 2 / 3]];
      for (const [t, x, z] of spots) { const tx = Math.floor(x), tz = Math.floor(z); if (m.canPlace(t, tx, tz)) m.addObj(t, tx, tz); } }
    for (const o of m.list) if (O[o.t].ceil && o.v !== Math.round(CH * 2)) { o.y = m.baseH(o.x, o.z) + CH; o.v = Math.round(CH * 2); m.refresh(o); } // hauteur sous plafond changée
  }
  // tableaux de maître (paysages peints à la main… par le jeu)
  const arts = [];
  function artMat(k) { if (arts[k]) return arts[k]; const c = G.cv(256, 200), x = c.getContext('2d'), r = G.rng(50 + k);
    const skies = [['#9fc7e8', '#f3d9b0'], ['#f2a37a', '#ffe2b0'], ['#6f86b8', '#d8c7e8'], ['#bfe0f0', '#f8f0d8'], ['#2c3858', '#7a6a98']], [t, h] = skies[k];
    let g = x.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, t); g.addColorStop(1, h); x.fillStyle = g; x.fillRect(0, 0, 256, 200);
    for (let i = 0; i < 3; i++) { x.fillStyle = ['#6f8f5a', '#5a7a48', '#48663a'][i]; x.beginPath(); x.moveTo(0, 200); for (let px = 0; px <= 256; px += 16) x.lineTo(px, 110 + i * 22 + Math.sin(px * .03 + i * 2 + k) * 14 + r() * 6); x.lineTo(256, 200); x.fill(); }
    if (k === 1 || k === 3) { x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(190, 60, 18, 0, TAU); x.fill(); } if (k === 4) { x.fillStyle = '#f4f1ff'; for (let i = 0; i < 30; i++) x.fillRect(r() * 256, r() * 90, 1.5, 1.5); }
    for (let i = 0; i < 6; i++) { const px = 20 + r() * 220, py = 125 + r() * 40; x.fillStyle = '#3f5a32'; x.beginPath(); x.ellipse(px, py, 10, 16, 0, 0, TAU); x.fill(); x.fillStyle = '#5a3a22'; x.fillRect(px - 1.5, py + 12, 3, 8); }
    x.globalAlpha = .08; for (let i = 0; i < 800; i++) { x.fillStyle = r() < .5 ? '#000' : '#fff'; x.fillRect(r() * 256, r() * 200, 2, 1); } x.globalAlpha = 1;
    const t2 = new THREE.CanvasTexture(c); t2.anisotropy = 4; return arts[k] = G.premiumMat({ map: t2 }, { cloud: false, rough: .55 }); }
  // ---------- branchement sur la construction des pièces ----------
  const ob = G.buildShell;
  G.buildShell = m => { if (!isGrand(m)) { if (m.interior && !m.meta.ceilH) m.meta.ceilH = m.kind === 'mairie' && m.W >= 20 ? 17 : (m.kind === 'maison' && m.W >= 22) ? 5.6 : 3; return ob(m); } grandShell(m); };
  // mobilier d'une nouvelle grande maison : salon, salle à manger, coin nuit
  const odef = G.ROOMFILL.maison;
  G.ROOMFILL.maison = (m, P, opt) => { if (/_e\d|_a\d/.test(m.id) || m.W < 10) { if (odef) return odef(m, P, opt); for (const [t, x, z] of [['lit_fleuri', 0, 0], ['commode_fleurie', 2, 0], ['piano_droit', 5, 0], ['canape', 3, 1], ['table_basse', 3, 2], ['fauteuil_nuage', 6, 2], ['bibliotheque', 0, 3], ['tapis_rond', 4, 3], ['lampe_arc', 7, 3], ['miroir', 2, 4], ['coffre', 0, 5], ['meuble_tv', 5, 5], ['plante', 7, 5]]) P(t, x, z); return; }
    const W = m.W, H = m.H, cx = Math.floor(W / 2), cz = Math.floor(H / 2);
    // coin nuit à gauche, bibliothèque et piano contre le mur du fond
    P('lit', 0, 1); P('lampe', 1, 1); P('armoire', 0, 4, 1); P('bibliotheque', 2, 0); P('piano_droit', W - 3, 0); P('plante', W - 1, 0); P('plante', 0, 0);
    // salle à manger sous le lustre : table en noyer fusionnée, chaises Louis XV
    const tx = cx - 1, tz = cz; for (let i = 0; i < 3; i++) P('table_noyer', tx + i, tz); for (let i = 0; i < 3; i++) { P('chaise_louis', tx + i, tz - 1, 0); P('chaise_louis', tx + i, tz + 1, 2); }
    // salon à droite : canapé Chesterfield, fauteuil club, table basse, lampadaire ; tapis et fauteuil à gauche
    P('canape_chesterfield', W - 3, H - 2, 2); P('table_basse', W - 3, H - 3); P('chaise_club', W - 1, H - 3, 3); P('lampe_arc', W - 1, H - 2); P('tapis_rond', 1, H - 3); P('chaise_club', 3, H - 2, 3);
    const o = m.objAt(tx, tz); if (o && G.mergeFurniture) { const save = G.ui.toast, sfx = G.sfx; G.ui.toast = () => { }; G.sfx = () => { }; try { G.mergeFurniture(m, o); } finally { G.ui.toast = save; G.sfx = sfx; } }
  };
  // ---------- soleil par les fenêtres : rayons de lumière et poussière dorée ----------
  const SD = new THREE.Vector3(); let beamMat = null;
  const beamTex = () => { const c = G.cv(64, 128), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 128); return new THREE.CanvasTexture(c); };
  G.on('update', dt => {
    const m = G.map, gl = m && m._gl, L = G.lights; if (!gl || !L) return;
    // caméra libre : elle reste sous le plafond
    const cp = G.camera.position; if (G.mouseMode && G.mouseMode() && cp.y > gl.CH - .25 && cp.z < m.H) cp.y = gl.CH - .25;
    if ((gl.t -= dt) > 0) return; gl.t = .25;
    if (!beamMat) beamMat = new THREE.MeshBasicMaterial({ map: beamTex(), color: 0xffe6b0, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    SD.copy(L.sun.position).sub(L.sun.target.position).normalize(); const day = L.sun.intensity > .4 && SD.y > .1, k = Math.min(1, (L.sun.intensity - .4) * 2);
    beamMat.opacity = .055 * k; beamMat.color.copy(L.sun.color).lerp(new THREE.Color(0xffe6b0), .4);
    if (!gl.beamG) { gl.beamG = new THREE.Group(); m.shell.add(gl.beamG); }
    const W = m.W, H = m.H, list = []; const inward = { s: [0, 0, -1], w: [1, 0, 0], e: [-1, 0, 0], n: [0, 0, 1] };
    if (day) for (const w of WALLS(m)) { const n = inward[w.id]; if (-(SD.x * n[0] + SD.z * n[2]) <= .05) continue; for (const h of gl.holes[w.id]) if (h.win) list.push([w, h]); }
    while (gl.beams.length < list.length) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 6 * 3), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(4 * 6 * 2), 2)); const me = new THREE.Mesh(geo, beamMat); me.frustumCulled = false; me.renderOrder = 3; gl.beamG.add(me); gl.beams.push(me); }
    gl.beams.forEach((me, i) => { const e = list[i]; me.visible = !!e; if (!e) return; const [w, h] = e, P = [], pos = me.geometry.attributes.position, uv = me.geometry.attributes.uv;
      for (const [u, y] of [[h.u - h.w / 2, h.y0], [h.u + h.w / 2, h.y0], [h.u + h.w / 2, h.y1 - .7], [h.u - h.w / 2, h.y1 - .7]]) { const a = w.at(u, y, 0), t = a[1] / Math.max(.12, SD.y); P.push([a, [G.clamp(a[0] - SD.x * t, -1, W + 1), .02, G.clamp(a[2] - SD.z * t, -1, H + 1)]]); }
      let q = 0; for (let s = 0; s < 4; s++) { const [a0, b0] = P[s], [a1, b1] = P[(s + 1) % 4]; for (const [p, v] of [[a0, 0], [a1, 0], [b1, 1], [a0, 0], [b1, 1], [b0, 1]]) { pos.setXYZ(q, p[0], p[1], p[2]); uv.setXY(q, .5, 1 - v); q++; } }
      pos.needsUpdate = true; uv.needsUpdate = true; me.geometry.computeBoundingSphere(); });
    // poussière dorée qui danse dans les rayons
    if (list.length && G.state === 'play') for (let i = 0; i < 2; i++) { const [w, h] = list[Math.floor(Math.random() * list.length)], a = w.at(h.u + (Math.random() - .5) * h.w, h.y0 + Math.random() * (h.y1 - h.y0 - .7), 0), t = Math.random() * a[1] / Math.max(.12, SD.y);
      G.fx.one(a[0] - SD.x * t, a[1] - SD.y * t, a[2] - SD.z * t, (Math.random() - .5) * .05, .02, (Math.random() - .5) * .05, 3 + Math.random() * 2, -.01, 0xfff1c4, .035, 0); }
  });
  // les anciennes maisons (sauvegardes) reçoivent la nouvelle coque en entrant
  G.on('enterMap', m => { if (isGrand(m) && !m._gl) { G.buildShell(m); m.buildAll(); } });
})();
