'use strict';
// ===== Mobilier intérieur redessiné (formes arrondies, vraies proportions) et petit avion =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2, PI = Math.PI;
  const OAK = 0xc99a68, LOAK = 0xe2bf8f, WAL = 0x8a5a36, DK = 0x5e3b22, CREAM = 0xf6f0e4, GOLD = 0xd9b04a, INK = 0x26292f;
  // boîte aux arêtes arrondies (rayon r) : extrusion biseautée d'un rectangle à coins ronds
  const rbox = G.rbox = (b, w, h, d, r, col, x, y, z, rx = 0, ry = 0, rz = 0, mat = 0) => {
    r = Math.max(.002, Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002));
    const iw = w / 2 - r, ih = h / 2 - r, c = Math.min(iw, ih) * .4, s = new THREE.Shape();
    s.moveTo(-iw + c, -ih); s.lineTo(iw - c, -ih); s.quadraticCurveTo(iw, -ih, iw, -ih + c); s.lineTo(iw, ih - c); s.quadraticCurveTo(iw, ih, iw - c, ih);
    s.lineTo(-iw + c, ih); s.quadraticCurveTo(-iw, ih, -iw, ih - c); s.lineTo(-iw, -ih + c); s.quadraticCurveTo(-iw, -ih, -iw + c, -ih);
    const dd = Math.max(.001, d - 2 * r), g = new THREE.ExtrudeGeometry(s, { depth: dd, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, curveSegments: 2 });
    g.translate(0, 0, -dd / 2); return b.geo(g, col, b.M(x, y, z, rx, ry, rz), mat);
  };
  const flame = (b, x, y, z, s = 1) => { b.cone(.13 * s, .38 * s, 7, 0xff8a1f, x, y + .19 * s, z, 0, 0, 0, 3); b.cone(.08 * s, .26 * s, 7, 0xffe14a, x, y + .15 * s, z + .02, 0, .5, 0, 3); };
  const knob = (b, x, y, z) => b.sph(.022, GOLD, x, y, z, 1, 1, .7);
  const feet = (b, w, d, h, col, r = .03) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(r, r * .75, h, 8, col, sx * w / 2, h / 2, sz * d / 2); };

  // lit : cadre en noyer, tête de lit capitonnée, couette, oreillers moelleux
  MD.bed = v => { const b = G.mb(71);
    feet(b, .86, 1.8, .14, DK, .035); rbox(b, .98, .2, 1.9, .05, WAL, 0, .22, 0);
    rbox(b, 1.02, 1.0, .1, .05, WAL, 0, .55, -.94); rbox(b, .84, .56, .06, .05, 0xd9c7ad, 0, .7, -.88);
    for (const x of [-.25, 0, .25]) for (const y of [.55, .8]) b.sph(.022, 0xb9a585, x, y, -.85);
    rbox(b, 1.02, .5, .08, .04, WAL, 0, .3, .94);
    rbox(b, .92, .2, 1.78, .08, CREAM, 0, .41, -.01);
    rbox(b, .97, .13, 1.2, .07, 0x7f9fd8, 0, .53, .28); rbox(b, .98, .08, .26, .04, 0xffffff, 0, .58, -.3); rbox(b, .99, .135, .14, .04, 0xf2c46b, 0, .535, .66);
    for (const x of [-.22, .22]) b.sph(.21, 0xffffff, x, .62, -.67, 1, .32, .62, 0, 14, 10);
    return b.done(); };
  // chaise : pieds fuselés, assise coussin, dossier à barreaux
  MD.chair = v => { const b = G.mb(41);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(.026, .02, .44, 8, WAL, sx * .19, .22, sz * .18);
    rbox(b, .5, .06, .47, .025, OAK, 0, .46, 0); rbox(b, .42, .06, .4, .03, 0xd77a61, 0, .51, .02);
    for (const sx of [-1, 1]) b.cyl(.024, .024, .56, 8, WAL, sx * .19, .74, -.2);
    for (const y of [.66, .8]) rbox(b, .38, .05, .025, .012, OAK, 0, y, -.2);
    rbox(b, .48, .1, .05, .025, WAL, 0, .98, -.2);
    return b.done(); };
  // table : plateau épais arrondi, ceinture, pieds tournés, petit bouquet
  MD.table = v => { const b = G.mb(42);
    rbox(b, .96, .06, .96, .03, LOAK, 0, .75, 0); rbox(b, .8, .09, .8, .02, OAK, 0, .67, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * .38, z = sz * .38; b.cyl(.04, .028, .62, 10, WAL, x, .31, z); b.sph(.05, WAL, x, .5, z, 1, .7, 1); b.sph(.045, WAL, x, .12, z, 1, .6, 1); }
    rbox(b, .6, .012, .6, .006, 0xf3ece0, 0, .785, 0);
    b.cyl(.045, .06, .14, 10, 0x6c9ad6, 0, .86, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.sph(.045, [0xff8fc0, 0xffd23f, 0xffffff][i % 3], Math.cos(a) * .05, .97 + (i % 2) * .03, Math.sin(a) * .05); }
    return b.done(); };
  // canapé : socle, gros coussins, accoudoirs ronds, coussins déco
  MD.sofa = v => { const b = G.mb(76), c = [0x7fa58a, 0xc96f5a, 0x5f7fb5, 0xd8c3a5][v % 4], l = new THREE.Color(c).lerp(new THREE.Color(0xffffff), .18).getHex();
    feet(b, 1.7, .66, .1, DK, .03);
    rbox(b, 1.86, .26, .8, .07, c, 0, .23, 0); rbox(b, 1.86, .6, .18, .08, c, 0, .55, -.32);
    for (const x of [-.41, .41]) { rbox(b, .8, .15, .62, .07, l, x, .43, .07); rbox(b, .8, .4, .16, .08, l, x, .7, -.22, -.18); }
    for (const sx of [-1, 1]) { rbox(b, .18, .42, .8, .08, c, sx * .87, .4, 0); b.cyl(.1, .1, .8, 14, c, sx * .87, .62, 0, PI / 2, 0, 0, 0, true); }
    b.sph(.17, 0xf2c46b, -.58, .62, -.05, 1, 1, .4, 0, 12, 8); b.sph(.15, 0xffffff, .6, .61, -.05, 1, 1, .4, 0, 12, 8);
    return b.done(); };
  // armoire : corniche, portes à panneaux moulurés, socle
  MD.wardrobe = v => { const b = G.mb(75);
    rbox(b, .96, .12, .6, .03, WAL, 0, .06, 0); rbox(b, .92, 1.78, .55, .03, OAK, 0, 1.0, 0);
    rbox(b, 1.0, .08, .64, .03, WAL, 0, 1.92, 0); rbox(b, .94, .06, .58, .02, OAK, 0, 1.97, 0);
    for (const sx of [-1, 1]) { const x = sx * .22; rbox(b, .42, 1.64, .03, .012, LOAK, x, 1.0, .285); rbox(b, .3, .62, .02, .01, OAK, x, 1.36, .3); rbox(b, .3, .62, .02, .01, OAK, x, .62, .3); knob(b, sx * .045, 1.0, .31); }
    return b.done(); };
  // table de chevet + lampe (abat-jour lumineux)
  MD.lamp_table = v => { const b = G.mb(77);
    feet(b, .4, .32, .1, DK, .025); rbox(b, .5, .44, .42, .03, OAK, 0, .32, 0); rbox(b, .54, .04, .46, .02, WAL, 0, .56, 0);
    rbox(b, .42, .15, .02, .01, LOAK, 0, .42, .21); knob(b, 0, .42, .225); rbox(b, .42, .15, .02, .01, LOAK, 0, .24, .21); knob(b, 0, .24, .225);
    rbox(b, .16, .035, .12, .008, 0x5b8fd6, .15, .6, .06);
    b.sph(.085, 0xe8e2d6, -.05, .65, -.03, 1, 1.15, 1, 0, 14, 10); b.cyl(.012, .012, .16, 6, GOLD, -.05, .78, -.03);
    b.cyl(.1, .16, .2, 16, 0xfff0c2, -.05, .9, -.03, 0, 0, 0, 1);
    return b.done(); };
  // plante : pot en terre cuite, feuilles larges qui retombent
  MD.plant_pot = v => { const b = G.mb(78);
    b.cyl(.2, .15, .32, 16, 0xc9714f, 0, .16, 0); b.tor(.2, .03, 0xb5603f, 0, .32, 0, PI / 2, 0, 0, 0, 16); b.cyl(.18, .18, .02, 14, 0x5a3d2b, 0, .31, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + (i % 2) * .3, t = .25 + (i % 3) * .2, L = .28 + (i % 3) * .1, ry = PI / 2 - a, ox = Math.cos(a), oz = Math.sin(a);
      const tx = Math.sin(t) * ox * L, ty = .32 + Math.cos(t) * L, tz = Math.sin(t) * oz * L;
      b.cyl(.012, .015, L, 5, 0x4a8a3c, tx / 2, .32 + (ty - .32) / 2, tz / 2, t, ry, 0);
      b.geo(new THREE.SphereGeometry(.12, 10, 6), i % 3 ? 0x4fa84a : 0x3d8f43, b.M(tx + ox * .1, ty + .02, tz + oz * .1, .35 + t * .6, ry, 0, .75, .14, 1.35), 0, true); }
    return b.done(); };
  // cheminée : briques, manteau en chêne, foyer voûté, bûches et feu, cadre doré
  MD.fireplace = v => { const b = G.mb(80), P = G.PAT ? G.PAT.brique : 0;
    b.P(P); b.box(1.8, 1.25, .55, 0xc87a5d, 0, .625, -.02); b.box(1.05, .55, .42, 0xc87a5d, 0, 1.6, -.08); b.P(0);
    rbox(b, 2.0, .1, .7, .04, WAL, 0, 1.3, 0); rbox(b, 2.0, .1, .42, .03, 0x9a958c, 0, .05, .3);
    b.box(.84, .6, .05, 0x1f1612, 0, .42, .255); b.cyl(.42, .42, .05, 18, 0x1f1612, 0, .72, .255, PI / 2);
    for (let k = 0; k <= 8; k++) { const a = PI * k / 8; rbox(b, .1, .14, .07, .015, k === 4 ? 0xe8e0d0 : 0xd2c9b8, Math.cos(a) * .48, .72 + Math.sin(a) * .48, .27, 0, 0, a - PI / 2); }
    for (const s of [-1, 1]) rbox(b, .1, .6, .07, .015, 0xd2c9b8, s * .48, .42, .27);
    for (const s of [-1, 1]) b.cyl(.055, .055, .62, 8, DK, 0, .18, .12, 0, s * .45, PI / 2);
    flame(b, 0, .2, .14, 1.15); flame(b, .18, .18, .12, .7); flame(b, -.16, .18, .13, .8);
    rbox(b, .5, .38, .04, .02, GOLD, 0, 1.6, .14); rbox(b, .42, .3, .02, .01, 0x8fc0a0, 0, 1.6, .16);
    for (const s of [-1, 1]) { b.cyl(.05, .07, .05, 10, GOLD, s * .75, 1.38, .1); b.cyl(.025, .025, .22, 8, CREAM, s * .75, 1.52, .1); }
    return b.done(); };
  // télévision : meuble TV à tiroirs, écran plat sur pied (écran lumineux)
  MD.tv = v => { const b = G.mb(81);
    feet(b, .82, .34, .08, DK, .025); rbox(b, .94, .36, .44, .03, OAK, 0, .26, 0);
    for (const sx of [-1, 1]) { rbox(b, .42, .26, .02, .01, LOAK, sx * .22, .26, .22); knob(b, sx * .22, .3, .235); }
    rbox(b, .26, .02, .14, .01, INK, 0, .45, -.04); b.box(.05, .08, .03, INK, 0, .49, -.06);
    rbox(b, .88, .52, .05, .02, INK, 0, .79, -.05); b.box(.82, .46, .01, 0x8fd0ff, 0, .79, -.022, 0, 0, 0, 1);
    return b.done(); };
  // bibliothèque : montants, étagères, livres variés (certains penchés), petite plante
  MD.shelf = v => { const b = G.mb(74), r = G.rng(3);
    for (const sx of [-1, 1]) rbox(b, .05, 1.8, .38, .015, WAL, sx * .43, .9, 0);
    b.box(.84, 1.76, .02, DK, 0, .9, -.18); rbox(b, .96, .05, .42, .02, WAL, 0, 1.82, 0);
    for (let i = 0; i < 4; i++) rbox(b, .84, .04, .36, .012, OAK, 0, .05 + i * .43, 0);
    for (let s = 0; s < 3; s++) { let x = -.38; const y0 = .07 + s * .43; while (x < .3) { const w = .05 + r() * .05, h = .24 + r() * .1, c = [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffc23d, 0x8d6fd1, 0xf3ece0, 0x3c5a7a][Math.floor(r() * 7)];
        if (r() < .12 && x > -.3) { rbox(b, w, h, .26, .01, c, x + h * .3, y0 + w * .5 + h * .4, 0, 0, 0, -1.1); x += h * .75; } else { rbox(b, w, h, .26, .01, c, x + w / 2, y0 + h / 2, 0); x += w + .006; } }
      if (s === 1) { b.cyl(.06, .05, .1, 10, 0xc9714f, .34, y0 + .05, 0); b.blob(.08, 1, 0x4fa84a, .34, y0 + .16, 0); } }
    b.cyl(.07, .05, .16, 10, 0x6c9ad6, -.25, 1.37, 0); b.sph(.06, 0xffd23f, .2, 1.36, 0);
    return b.done(); };
  // tapis rond : bordure, frise de motifs, médaillon central, franges
  MD.rug = v => { const b = G.mb(73);
    b.cyl(.95, .95, .02, 40, 0xb5523b, 0, .01, 0); b.cyl(.86, .86, .024, 40, 0xf3e6c8, 0, .012, 0); b.cyl(.62, .62, .028, 40, 0x6c8cd6, 0, .014, 0);
    b.cyl(.5, .5, .032, 40, 0xf3e6c8, 0, .016, 0); b.cyl(.22, .22, .036, 24, 0xd77a61, 0, .018, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.cyl(.05, .05, .03, 10, i % 2 ? 0xf2c46b : 0xb5523b, Math.cos(a) * .74, .016, Math.sin(a) * .74); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.sph(.06, 0xf2c46b, Math.cos(a) * .36, .02, Math.sin(a) * .36, 1, .25, 1); }
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; b.box(.025, .008, .08, 0xf3e6c8, Math.cos(a) * .98, .005, Math.sin(a) * .98, 0, -a + PI / 2, 0); }
    return b.done(); };

  // ===== petit avion (v 1 : sans hélice, pour le vol où l'hélice tourne à part) =====
  const RED = 0xe0453a, WH = 0xf7f5ee;
  MD.avion = v => { const b = G.mb(340);
    b.sph(.42, WH, 0, .85, 0, 1, 1, 3.1, 0, 18, 12);
    b.cyl(.36, .4, .16, 18, RED, 0, .85, 1.0, PI / 2, 0, 0, 0, true); b.cyl(.3, .2, .5, 16, RED, 0, .85, -1.0, PI / 2, 0, 0, 0, true);
    b.sph(.3, 0x9fd8ff, 0, 1.13, .3, .95, .75, 1.6, 2, 14, 10);
    for (const s of [-1, 1]) for (const z of [-.2, -.55]) b.sph(.09, 0x9fd8ff, s * .39, .95, z, .3, 1, 1.3, 2);
    rbox(b, 2.9, .08, .62, .04, RED, 0, 1.2, .15); for (const s of [-1, 1]) { rbox(b, .5, .085, .6, .04, WH, s * 1.15, 1.205, .15); b.cyl(.02, .02, .56, 6, 0x9a9a9a, s * .7, .98, .18, 0, 0, s * .75); }
    rbox(b, 1.15, .05, .34, .025, RED, 0, .93, -1.25); rbox(b, .06, .55, .46, .03, RED, 0, 1.18, -1.22, -.25);
    for (const s of [-1, 1]) { b.cyl(.14, .14, .08, 14, INK, s * .45, .14, .5, 0, 0, PI / 2); b.cyl(.06, .06, .09, 10, 0xd8d8d8, s * .45, .14, .5, 0, 0, PI / 2); b.box(.04, .34, .06, 0x9a9a9a, s * .3, .3, .5, 0, 0, s * .6); }
    b.sph(.06, INK, 0, .1, -1.25); b.box(.03, .2, .04, 0x9a9a9a, 0, .2, -1.2);
    b.cone(.13, .26, 12, RED, 0, .85, 1.32, PI / 2);
    if (v !== 1) for (const a of [0, PI / 2]) b.box(.07, .95, .02, INK, 0, .85, 1.34, 0, 0, a);
    return b.done(); };
  MD.helice = () => { const b = G.mb(341); for (const a of [0, PI / 2]) rbox(b, .08, .95, .025, .012, INK, 0, 0, 0, 0, 0, a); return b.done(); };
  G.OBJ.avion = { id: 'avion', n: 'Petit avion', model: 'avion', v: 0, h: 1.3, fp: [3, 3], balloon: 1, plane: 1, take: 1, cat: 'construction' };
  G.ITEMS.avion = { id: 'avion', n: 'Petit avion', stack: 1, sell: 2500, kind: 'place', obj: 'avion', cat: 'construction', thumb: 'obj:avion' };
  if (G.SHOPLIST) G.SHOPLIST.push('avion');

  const F = G.feat, ob = F.board, ou = F.updVehicle;
  F.board = o => { if (!G.OBJ[o.t].plane) return ob(o);
    const p = G.player, m = G.map; if (m.interior) return; const [cx, cz] = m.center(o);
    const mesh = new THREE.Mesh(G.getGeo('avion', 1), G.MATS); mesh.castShadow = true; mesh.frustumCulled = false; mesh.rotation.order = 'YXZ'; G.scene.add(mesh);
    const prop = new THREE.Mesh(G.getGeo('helice'), G.MATS); prop.position.set(0, .85, 1.36); mesh.add(prop);
    const sh = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); sh.frustumCulled = false; G.scene.add(sh);
    p.vehicle = { plane: 1, o: { t: o.t, r: o.r }, x: cx, z: cz, y: o.y, alt: 0, talt: 8, mesh, prop, sh, t: 0, landing: false, h: [0, PI / 2, PI, -PI / 2][o.r || 0], spd: 0, bank: 0 };
    m.removeObj(o); G.sfx('fanfare'); G.ui.toast('Avion ! ZQD pour piloter · S freiner (surplace) · Espace monter · Maj descendre · E atterrir');
  };
  F.updVehicle = (p, dt) => { const v = p.vehicle; if (!v.plane) return ou(p, dt);
    const I = G.input, m = G.map, free = G.ui.canPlay(); v.t += dt;
    let ix = 0, iz = 0; if (free && !v.landing) { if (I.down('KeyD', 'ArrowRight')) ix += 1; if (I.down('KeyA', 'ArrowLeft')) ix -= 1; if (I.down('KeyW', 'ArrowUp')) iz += 1; if (I.down('KeyS', 'ArrowDown')) iz -= 1; if (I.gp.on) { ix += I.gp.lx; iz -= I.gp.ly; } ix += I.touch.mx; iz -= I.touch.my; }
    // S / flèche bas : freine jusqu'au surplace (l'avion reste en l'air)
    const brake = free && !v.landing && v.alt > .6 && iz < -.3; if (brake) iz = 0;
    const cy = G.cam.yaw, mx = Math.cos(cy) * ix - Math.sin(cy) * iz, mz = -Math.sin(cy) * ix - Math.cos(cy) * iz, mag = Math.min(1, Math.hypot(mx, mz));
    // l'avion avance toujours : il tourne doucement vers la direction voulue
    let turn = 0; if (mag > .15) { let d = Math.atan2(mx, mz) - v.h; d = Math.atan2(Math.sin(d), Math.cos(d)); turn = G.clamp(d * 2, -1.6, 1.6); v.h += turn * dt; }
    const air = v.alt > .6, tsp = v.landing ? (air ? 4 : 0) : brake ? 0 : (mag > .15 ? 10 : 6.5);
    v.spd += (tsp - v.spd) * Math.min(1, (v.landing && !air ? 1.6 : .7) * dt);
    v.x = G.clamp(v.x + Math.sin(v.h) * v.spd * dt, 4, m.W - 4); v.z = G.clamp(v.z + Math.cos(v.h) * v.spd * dt, 4, m.H - 4);
    if (free && !v.landing) { if (I.down('Space')) v.talt = Math.min(26, v.talt + dt * 5); if (I.down('ShiftLeft', 'ShiftRight')) v.talt = Math.max(4, v.talt - dt * 5); }
    if (free && I.hit('KeyE') && !v.landing) { v.landing = true; G.ui.toast('Atterrissage…'); }
    const ground = Math.max(m.topAt(v.x, v.z), m.isWaterAt(v.x, v.z) ? m.waterSurf(Math.floor(v.x), Math.floor(v.z)) : -9);
    if (v.landing) v.talt = 0; const climb = (v.talt - v.alt) * Math.min(1, (v.spd > 3 || v.landing || v.alt > .6 ? .7 : .05) * dt); v.alt += climb;
    v.y += (ground + v.alt - v.y) * Math.min(1, 3 * dt);
    if (v.landing && v.y - ground < .1 && v.spd < .4) { const tx = Math.floor(v.x - 1.5), tz = Math.floor(v.z - 1.5);
      if (m.canPlace(v.o.t, tx, tz, v.o.r) && !m.isWaterAt(v.x, v.z)) { G.scene.remove(v.mesh); G.scene.remove(v.sh); m.addObj(v.o.t, tx, tz, v.o.r); p.vehicle = null; p.teleport(tx + 1.5, tz + 3.4, 0); G.sfx('land'); G.fx.puff(tx + 1.5, ground + .1, tz + 1.5, 14, 0xf3ead2, 1); return; }
      for (let r = 1; r < 40; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = tx + dx, z = tz + dz; if (m.canPlace(v.o.t, x, z, v.o.r) && !m.isWaterAt(x + 1.5, z + 1.5)) { v.x = x + 1.5; v.z = z + 1.5; v.y = m.topAt(v.x, v.z) + .05; G.ui.toast('Pas de place ici : l’avion se pose un peu plus loin.'); return; } }
      v.landing = false; v.talt = 6; G.sfx('error'); G.ui.toast('Aucun terrain libre de 3×3 à proximité.'); }
    v.bank += (-turn * .45 - v.bank) * Math.min(1, 3 * dt);
    v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.set(G.clamp(-climb / Math.max(dt, .001) * .05, -.35, .35), v.h, air ? v.bank : 0); v.prop.rotation.z += dt * (8 + v.spd * 3);
    v.sh.position.set(v.x, ground + .04, v.z); const s = G.clamp(3.2 - v.alt * .07, 1.2, 3.2); v.sh.scale.set(s, 1, s); v.sh.visible = !m.isWaterAt(v.x, v.z);
    p.x = v.x + Math.sin(v.h) * .2; p.z = v.z + Math.cos(v.h) * .2; p.y = v.y + .62; p.yaw = v.h; p.onGround = true; p.swim = false;
    if (air && Math.random() < dt * 6) G.fx.one(v.x - Math.sin(v.h) * 1.6, v.y + .9, v.z - Math.cos(v.h) * 1.6, 0, .2, 0, .7, 0, 0xffffff, .25, 1);
    p.animate(dt, 0); p.C.armL.rotation.x = p.C.armR.rotation.x = -.9; p.place(); p.blob.visible = false;
  };
})();
