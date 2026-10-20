'use strict';
// ===== Phares en trois tailles et éolienne de ferme en bois :
// - petit phare de port (5 cases de haut, blanc à lanterne verte), phare rayé rouge et blanc (7,5 cases), grand phare de granit (10 cases) :
//   soubassement de pierre, tour effilée, hublots en spirale, porte, galerie à consoles et garde-corps, lanterne vitrée à montants,
//   dôme, boule d'aération, girouette ; dans la lanterne, l'optique de Fresnel tourne, et la nuit deux faisceaux balaient la mer
//   (éclat quand un faisceau passe vers la caméra) ;
// - éolienne de ferme américaine en bois (8 cases de haut) : pylône à quatre pieds, entretoises en croix, échelle, plate-forme,
//   roue à 18 pales qui tourne au vent, gouvernail, tige de pompe qui monte et descend, pompe et abreuvoir au pied. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2;
  const SK = () => G.SK || {}, PAT = () => G.PAT || {};
  const Y = new THREE.Vector3(0, 1, 0);
  // pièce de bois (ou de fer) de section w × d, d'un point à un autre
  const beam = (b, p, q, w, d, col) => { const a = new THREE.Vector3(...p), c = new THREE.Vector3(...q), v = c.clone().sub(a), L = v.length(); if (L < 1e-4) return;
    b.add(new THREE.BoxGeometry(w, L, d), col, new THREE.Matrix4().compose(a.add(c).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, v.normalize()), new THREE.Vector3(1, 1, 1)), 0, false); };
  const rod = (b, p, q, r, col, n = 8) => { const a = new THREE.Vector3(...p), c = new THREE.Vector3(...q), v = c.clone().sub(a), L = v.length(); if (L < 1e-4) return;
    b.add(new THREE.CylinderGeometry(r, r, L, n), col, new THREE.Matrix4().compose(a.add(c).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, v.normalize()), new THREE.Vector3(1, 1, 1)), 0, true); };

  // ===================== PHARES =====================
  // H : hauteur ; pl : soubassement (rayon, hauteur, carré ?) ; r0 / r1 : rayon de la tour en bas / en haut ; top : haut de la tour
  const PH = [
    { n: 'Petit phare de port', H: 5, fp: 2, plR: .9, plH: .35, sq: 1, r0: .72, r1: .5, top: 3.3, drum: .16, glass: .62, band: () => 0xf4f1ea, trim: 0x2f7a4a, roof: 0x2f7a4a, per: 6, beam: 18 },
    { n: 'Phare', H: 7.5, fp: 2, plR: .96, plH: .4, sq: 0, r0: .82, r1: .55, top: 5.5, drum: .2, glass: .8, band: t => Math.floor(t * 6) % 2 ? 0xd83a30 : 0xf6f3ec, trim: 0x2a2d33, roof: 0xc8302a, per: 9, beam: 27 },
    { n: 'Grand phare', H: 10, fp: 3, plR: 1.42, plH: .6, sq: 0, r0: 1.12, r1: .74, top: 7.55, drum: .26, glass: 1.0, band: t => t < .14 ? -1 : t > .9 ? 0x23262b : 0xf3f0e8, trim: 0x23262b, roof: 0x3f7a66, per: 12, beam: 36 }];
  PH.forEach(p => { p.gal = p.top; p.yL = p.top + .1 + p.drum + p.glass / 2; p.Rl = p.r1 * .7; });
  const rAt = (p, y) => { const t = G.clamp((y - p.plH) / (p.top - p.plH), 0, 1); return p.r1 + (p.r0 - p.r1) * Math.pow(1 - t, 1.25); };
  MD.phare3 = v => { const p = PH[v] || PH[1], b = G.mb(2600 + v), sk = SK(), PT = PAT(), STONE = 0xb4ada0, WIN = 0x2c3c4c;
    // soubassement de pierre, marches devant la porte (vers +z)
    b.P(PT.moellons || PT.pierre || 0); if (p.sq) b.box(p.plR * 2, p.plH, p.plR * 2, STONE, 0, p.plH / 2, 0); else b.add(new THREE.CylinderGeometry(p.plR, p.plR + .04, p.plH, 8), STONE, b.M(0, p.plH / 2, 0, 0, PI / 8, 0)); b.P(0);
    b.S(sk.stone); b.box(p.sq ? p.plR * 2 + .06 : p.plR * 1.6, .06, p.sq ? p.plR * 2 + .06 : p.plR * 1.6, light(STONE), 0, p.plH + .03, 0, 0, p.sq ? 0 : PI / 8, 0); b.S(null);
    for (let k = 0; k < 3; k++) b.box(.62 - k * .06, p.plH / 3, .18, STONE, 0, (k + .5) * p.plH / 3, p.plR + .05 - k * .14 + (p.sq ? 0 : -.04));
    // la tour : anneaux du bas vers le haut, couleur selon la hauteur (-1 : granit)
    const NS = 24; for (let i = 0; i < NS; i++) { const y0 = p.plH + (p.top - p.plH) * i / NS, y1 = p.plH + (p.top - p.plH) * (i + 1) / NS, c = p.band((i + .5) / NS), granite = c === -1;
      if (granite) b.P(PT.moellons || PT.pierre || 0); else b.S(sk.paint); b.add(new THREE.CylinderGeometry(rAt(p, y1), rAt(p, y0), y1 - y0 + .002, 40, 1, true), granite ? STONE : c, b.M(0, (y0 + y1) / 2, 0), 0, true); b.P(0); b.S(null); }
    // porte en plein cintre avec encadrement, imposte
    const zr = rAt(p, p.plH + .5) + .015, dh = Math.min(1.05, p.H * .13);
    b.box(.46, dh, .06, 0x5a3a22, 0, p.plH + dh / 2, zr); b.add(new THREE.CylinderGeometry(.23, .23, .06, 16, 1, false, PI / 2, PI), 0x5a3a22, b.M(0, p.plH + dh, zr, PI / 2, 0, 0));
    for (const s of [-1, 1]) b.box(.07, dh + .1, .08, 0xe8e2d4, s * .27, p.plH + dh / 2, zr + .01); b.tor(.27, .035, 0xe8e2d4, 0, p.plH + dh, zr + .01, 0, 0, 0, 0, 16);
    b.sph(.025, 0xd9b84a, .14, p.plH + dh * .5, zr + .05, 1, 1, 1, 0, 8, 6);
    // hublots en spirale le long de l'escalier intérieur
    for (let y = p.plH + dh + .7, k = 0; y < p.top - .55; y += .95, k++) { const a = PI / 2 + k * 1.85, r = rAt(p, y), ry = PI / 2 - a, x = Math.cos(a) * r, z = Math.sin(a) * r;
      b.box(.22, .36, .05, 0xf0ece2, x, y, z, 0, ry, 0); b.box(.15, .28, .04, WIN, x + Math.cos(a) * .02, y, z + Math.sin(a) * .02, 0, ry, 0); b.box(.26, .04, .08, 0xf0ece2, x + Math.cos(a) * .02, y - .2, z + Math.sin(a) * .02, 0, ry, 0); }
    // galerie : corniche à consoles, plancher, garde-corps
    const G0 = p.gal, RG = p.r1 + .3;
    b.S(sk.stone); b.cyl(p.r1 + .08, p.r1, .14, 36, 0xe8e2d4, 0, G0 - .07, 0); b.S(null);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.box(.08, .2, .26, 0xe8e2d4, Math.cos(a) * (p.r1 + .12), G0 - .12, Math.sin(a) * (p.r1 + .12), 0, PI / 2 - a, 0); }
    b.S(sk.iron); b.cyl(RG, RG - .02, .08, 40, p.trim, 0, G0 + .04, 0);
    const nb = Math.round(RG * 26); for (let i = 0; i < nb; i++) { const a = i / nb * TAU; b.box(.022, .46, .022, p.trim, Math.cos(a) * (RG - .03), G0 + .31, Math.sin(a) * (RG - .03)); }
    b.tor(RG - .03, .022, p.trim, 0, G0 + .55, 0, PI / 2, 0, 0, 0, 48); b.tor(RG - .03, .012, p.trim, 0, G0 + .3, 0, PI / 2, 0, 0, 0, 48);
    // lanterne : soubassement, vitrage à montants et croisillons, dôme, boule d'aération, paratonnerre et girouette
    const L0 = G0 + .08, Rl = p.Rl, gy0 = L0 + p.drum, gy1 = gy0 + p.glass;
    b.cyl(Rl + .02, Rl + .05, p.drum, 24, p.trim, 0, L0 + p.drum / 2, 0); b.cyl(.06, .1, .2, 12, 0x3a3d42, 0, gy0 + .1, 0); // socle de l'optique
    b.S(sk.glass); b.add(new THREE.CylinderGeometry(Rl, Rl, p.glass, 24, 1, true), 0xeaf6ff, b.M(0, (gy0 + gy1) / 2, 0), 2, true); b.S(sk.iron);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, a2 = (i + 1) / 10 * TAU; b.box(.03, p.glass, .03, p.trim, Math.cos(a) * Rl, (gy0 + gy1) / 2, Math.sin(a) * Rl);
      rod(b, [Math.cos(a) * Rl, gy0, Math.sin(a) * Rl], [Math.cos(a2) * Rl, gy1, Math.sin(a2) * Rl], .008, p.trim, 4); }
    b.tor(Rl, .025, p.trim, 0, gy1, 0, PI / 2, 0, 0, 0, 32); b.cyl(Rl + .08, Rl + .02, .07, 28, p.trim, 0, gy1 + .04, 0);
    b.S(sk.paint); b.add(new THREE.SphereGeometry(Rl + .04, 28, 10, 0, TAU, 0, PI / 2), p.roof, b.M(0, gy1 + .07, 0, 0, 0, 0, 1, .78, 1), 0, true);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; b.add(new THREE.TorusGeometry(Rl + .045, .012, 4, 10, PI / 2), dark(p.roof, .8), b.M(0, gy1 + .07, 0, 0, -a, 0, 1, .78, 1), 0, true); }
    const ty = gy1 + .07 + (Rl + .04) * .78; b.S(sk.iron); b.cyl(.05, .07, .12, 12, p.trim, 0, ty + .04, 0); b.sph(.11, p.trim, 0, ty + .18, 0); b.cyl(.012, .012, Math.max(.3, p.H - ty - .33), 6, p.trim, 0, (ty + .26 + p.H - .06) / 2, 0);
    const vy = p.H - .2; b.box(.36, .03, .02, p.trim, 0, vy, 0); b.cone(.04, .08, 4, p.trim, .2, vy, 0, 0, 0, -PI / 2); b.box(.06, .1, .01, p.trim, -.17, vy, 0);
    b.S(sk.gold); b.sph(.035, 0xd9b84a, 0, p.H - .04, 0); for (const [a, l] of [[0, 'N'], [PI / 2, 'E']]) b.box(.26, .012, .012, 0xd9b84a, 0, vy - .1, 0, 0, a, 0); b.S(null);
    return b.done(); };
  const C3 = c => new THREE.Color(c), light = (c, k = .3) => C3(c).lerp(C3(0xffffff), k).getHex(), dark = (c, k = .7) => C3(c).multiplyScalar(k).getHex();
  // l'optique de Fresnel (elle tourne) : anneaux de verre doré, deux lentilles en œil-de-bœuf, lampe au centre
  MD.phare3_optic = v => { const p = PH[v] || PH[1], b = G.mb(2610 + v), s = p.Rl / .4, sk = SK();
    b.S(sk.gold); b.cyl(.2 * s, .2 * s, .02, 16, 0xc9a24a, 0, -.27 * s, 0); b.cyl(.2 * s, .2 * s, .02, 16, 0xc9a24a, 0, .27 * s, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.box(.015, .54 * s, .015, 0xc9a24a, Math.cos(a) * .2 * s, 0, Math.sin(a) * .2 * s); } b.S(null);
    for (let j = -3; j <= 3; j++) b.tor(.18 * s * (1 - Math.abs(j) * .06), .016 * s, 0xfff1c0, 0, j * .075 * s, 0, PI / 2, 0, 0, 1, 24);
    for (const sx of [-1, 1]) { b.add(new THREE.SphereGeometry(1, 16, 10), 0xfffbe6, b.M(sx * .19 * s, 0, 0, 0, PI / 2, 0, .13 * s, .13 * s, .035 * s), 1, true); for (const R of [.07, .11]) b.tor(R * s, .008 * s, 0xffe9a8, sx * .2 * s, 0, 0, 0, PI / 2, 0, 1, 18); }
    b.sph(.07 * s, 0xffffff, 0, 0, 0, 1, 1, 1, 1); return b.done(); };
  // les faisceaux : cônes ouverts, du blanc chaud au noir (mélange additif : le noir ne se voit pas), un par côté
  const beamGeo = []; const BEAM = len => { if (beamGeo[len]) return beamGeo[len]; const R = len * .075, out = [];
    for (const sg of [1, -1]) { const g = new THREE.CylinderGeometry(.12, R, len, 24, 6, true); g.translate(0, -len / 2, 0); g.rotateZ(sg * PI / 2); g.rotateZ(-sg * .035); // pointe un peu vers l'horizon
      const P = g.attributes.position, col = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const t = Math.min(1, Math.abs(P.getX(i)) / len), k = Math.pow(1 - t, 1.7) * (.55 + .45 * (1 - t)); col[i * 3] = k; col[i * 3 + 1] = k * .93; col[i * 3 + 2] = k * .72; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.push(g); } return beamGeo[len] = out; };
  let beamMat = null, haloMat = null; const mats = () => { if (beamMat) return; beamMat = G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(.18, 'rgba(255,236,170,.75)'); gr.addColorStop(.5, 'rgba(255,214,120,.18)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); haloMat = G.curveMat(new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); };

  // ===================== ÉOLIENNE DE FERME EN BOIS =====================
  const WD = 0xb08a5a, WD2 = 0x9c7a50, WDL = 0xc9ab80, IRON = 0x34322f, RED = 0xb8322a, HEAD = 6.9; // hauteur de l'axe de la roue
  const leg = (sx, sz, y) => { const t = y / 6.3; return [sx * (.86 - .56 * t), y, sz * (.86 - .56 * t)]; };
  MD.eolienne_ferme = v => { const b = G.mb(2620), sk = SK();
    // socles de béton, quatre pieds, ceintures et croix de Saint-André sur chaque face
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.3, .2, .3, 0xa8a49a, sx * .86, .1, sz * .86);
    b.S(sk.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) beam(b, leg(sx, sz, .18), leg(sx, sz, 6.32), .11, .11, WD);
    const LV = [.55, 1.95, 3.3, 4.6, 5.75, 6.3];
    for (const [ax, bx, az, bz] of [[-1, 1, 1, 1], [-1, 1, -1, -1], [1, 1, -1, 1], [-1, -1, -1, 1]]) {
      LV.forEach(y => beam(b, leg(ax, az, y), leg(bx, bz, y), .06, .1, WD2));
      for (let i = 0; i < LV.length - 1; i++) { beam(b, leg(ax, az, LV[i]), leg(bx, bz, LV[i + 1]), .04, .08, WDL); beam(b, leg(bx, bz, LV[i]), leg(ax, az, LV[i + 1]), .04, .08, WDL); } }
    // boulons des croisements
    b.S(sk.iron); for (const y of LV) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = leg(sx, sz, y); b.sph(.022, IRON, p[0] * 1.07, y, p[2] * 1.07, 1, 1, 1, 0, 6, 4); }
    // échelle sur la face avant (+z), jusqu'à la plate-forme
    b.S(sk.wood); for (const x of [-.16, .16]) beam(b, [x, 0, leg(1, 1, 0)[2] + .1], [x, 6.4, leg(1, 1, 6.4)[2] + .1], .045, .05, WD2);
    for (let y = .3; y < 6.3; y += .3) { const z = leg(1, 1, y)[2] + .1; b.box(.36, .035, .035, WDL, 0, y, z); }
    // plate-forme de planches et son garde-corps
    for (let i = 0; i < 7; i++) b.box(1.3, .04, .17, i % 2 ? WD : WDL, 0, 6.36, -.54 + i * .18);
    for (const sx of [-1, 1]) b.box(.08, .1, 1.3, WD2, sx * .55, 6.29, 0);
    for (const [x, z] of [[-.62, -.62], [.62, -.62], [-.62, .62], [.62, .62]]) b.box(.05, .55, .05, WD2, x, 6.66, z);
    for (const [x, z, w, d] of [[0, -.62, 1.28, .04], [-.62, 0, .04, 1.28], [.62, 0, .04, 1.28]]) { b.box(w, .04, d, WD2, x, 6.92, z); b.box(w, .03, d, WDL, x, 6.66, z); }
    // tête : plaque tournante, carter, arbre vers la roue, queue et gouvernail rouge à liseré blanc
    b.S(sk.iron); b.cyl(.2, .22, .12, 16, IRON, 0, 6.45, 0); b.S(sk.paint); b.box(.3, .32, .52, RED, 0, 6.7, .02); b.box(.34, .05, .56, dark(RED, .7), 0, 6.88, .02);
    b.S(sk.iron); rod(b, [0, HEAD, 0], [0, HEAD, .5], .045, IRON, 10); b.cyl(.06, .06, .14, 12, IRON, 0, 6.62, -.18, PI / 2, 0, 0);
    b.S(sk.wood); for (const sx of [-1, 1]) beam(b, [sx * .08, 6.75, -.2], [sx * .03, HEAD, -1.75], .05, .07, WD); beam(b, [0, 6.62, -.25], [0, 6.82, -1.75], .04, .06, WD2);
    b.S(sk.paint); b.box(.04, .62, 1.0, RED, 0, HEAD + .05, -2.15); for (const [y, h] of [[HEAD + .35, .04], [HEAD - .25, .04]]) b.box(.05, h, 1.02, 0xf2eee4, 0, y, -2.15); for (const z of [-1.65, -2.65]) b.box(.05, .64, .04, 0xf2eee4, 0, HEAD + .05, z);
    b.box(.05, .05, .6, 0xf2eee4, 0, HEAD + .05, -2.15);
    // tige de pompe : fourreau sous la plate-forme ; au pied, la pompe et l'abreuvoir
    b.S(sk.iron); b.cyl(.04, .04, .3, 10, IRON, 0, 6.2, 0); b.cyl(.06, .06, 1.1, 12, 0x4a4844, 0, .55, 0); b.cyl(.08, .08, .08, 12, 0x4a4844, 0, 1.1, 0);
    rod(b, [0, .85, 0], [.38, .78, 0], .028, 0x4a4844, 8); b.cyl(.035, .03, .08, 10, 0x4a4844, .4, .74, 0); rod(b, [-.05, 1.05, 0], [-.42, 1.25, 0], .016, IRON, 6);
    b.S(sk.wood); b.box(.9, .36, .42, WD2, .55, .18, -.05); b.box(.82, .02, .34, 0x3a2a1a, .55, .06, -.05); b.S(null); b.box(.82, .02, .34, 0x6aa8c8, .55, .3, -.05, 0, 0, 0, 2);
    return b.done(); };
  // la roue (elle tourne) : moyeu, deux couronnes, rayons et 18 pales vrillées en bois
  MD.eolienne_roue = v => { const b = G.mb(2621), sk = SK();
    b.S(sk.iron); b.cyl(.11, .11, .16, 16, IRON, 0, 0, 0, PI / 2, 0, 0); b.cyl(.05, .07, .1, 12, IRON, 0, 0, .12, PI / 2, 0, 0);
    for (const R of [.5, 1.0]) b.tor(R, .016, IRON, 0, 0, -.02, 0, 0, 0, 0, 48);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; rod(b, [Math.cos(a) * .09, Math.sin(a) * .09, 0], [Math.cos(a) * 1.0, Math.sin(a) * 1.0, -.02], .012, IRON, 5); }
    b.S(sk.wood); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, m = new THREE.Matrix4().makeRotationZ(a - PI / 2).multiply(new THREE.Matrix4().makeRotationY(.5)); m.setPosition(Math.cos(a) * .77, Math.sin(a) * .77, 0);
      b.add(new THREE.BoxGeometry(.15, .56, .018), i % 2 ? WDL : 0xd8c09a, m, 0, false); }
    b.S(null); return b.done(); };
  MD.eolienne_tige = v => { const b = G.mb(2622); b.S(SK().iron); b.cyl(.016, .016, 5.0, 8, IRON, 0, 3.6, 0); b.S(null); return b.done(); };

  // ===================== objets =====================
  const add = (id, n, model, v, o, sell, desc) => { O[id] = Object.assign({ id, n, model, v, take: 1, cat: 'construction' }, o);
    G.ITEMS[id] = Object.assign(G.ITEMS[id] || {}, { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 1, desc }); if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  PH.forEach((p, v) => add(v === 1 ? 'phare' : v === 0 ? 'phare_petit' : 'phare_grand', p.n, 'phare3', v, { h: p.H, fp: [p.fp, p.fp], light: 1, ly: p.yL, ld: 10 + v * 5, li: 1.5, lighthouse: 1 }, 2000 + v * 1500,
    'Un phare de ' + String(p.H).replace('.', ',') + ' cases de haut : la nuit, sa lumière tourne et ses faisceaux balaient les environs.'));
  add('eolienne_ferme', 'Éolienne de ferme en bois', 'eolienne_ferme', 0, { h: 8, fp: [2, 2] }, 2500, 'Huit cases de haut : sa roue à pales de bois tourne au vent et fait monter l\'eau dans l\'abreuvoir.');

  // ===================== animation : ce qui tourne est un petit groupe posé sur l'objet =====================
  const ANIM = new Set(['phare', 'phare_petit', 'phare_grand', 'eolienne_ferme']);
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  GP.addObj = function (t, tx, tz, r, extra) { const o = oadd.call(this, t, tx, tz, r, extra); if (o && ANIM.has(t)) (this._anx || (this._anx = new Set())).add(o); return o; };
  GP.removeObj = function (o) { if (o && this._anx && this._anx.delete(o) && o._ax) { o._ax.parent && o._ax.parent.remove(o._ax); o._ax = null; } return orem.call(this, o); };
  const mesh = (name, v, sh) => { const m = new THREE.Mesh(G.getGeo(name, v), G.MATS); m.castShadow = !!sh; m.receiveShadow = true; return m; };
  function make(m, o) { const d = O[o.t], g = new THREE.Group(); g.userData.t = o.t;
    if (d.lighthouse) { mats(); const p = PH[d.v], spin = new THREE.Group(); spin.position.y = p.yL; spin.add(mesh('phare3_optic', d.v));
      const bg = new THREE.Group(); for (const geo of BEAM(p.beam)) { const me = new THREE.Mesh(geo, beamMat); me.renderOrder = 6; me.frustumCulled = false; bg.add(me); } spin.add(bg);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloMat); halo.renderOrder = 7; halo.position.y = p.yL; halo.frustumCulled = false; g.add(spin, halo); Object.assign(g.userData, { spin, bg, halo, p }); }
    else { const yaw = new THREE.Group(), wheel = mesh('eolienne_roue', 0, true), tige = mesh('eolienne_tige', 0); wheel.position.set(0, HEAD, .58); yaw.add(wheel, tige); g.add(yaw); Object.assign(g.userData, { yaw, wheel, tige }); }
    m.group.add(g); return g; }
  const CP = new THREE.Vector3(); let t0 = 0;
  G.on('frame', dt => { const m = G.map, A = m && m._anx, cam = G.camera; if (!A || !A.size || !cam) return; t0 += Math.min(dt || 0, .1); const n = G.night ? G.night() : 0, out = !m.interior;
    if (beamMat) { beamMat.opacity = .55 * Math.min(1, n * 1.4); haloMat.opacity = Math.min(1, n * 1.4); }
    cam.getWorldPosition(CP);
    for (const o of A) { const [cx, cz] = m.center(o), far = Math.hypot(cx - CP.x, cz - CP.z) > 260; if (far) { if (o._ax) o._ax.visible = false; continue; }
      const g = o._ax || (o._ax = make(m, o)), U = g.userData, d = O[o.t]; g.visible = !o._anim; g.position.set(cx, o.y, cz); const yaw = (o.r || 0) * PI / 2, ph = G.hash2 ? G.hash2(o.x, o.z, 77) * TAU : 0;
      if (U.spin) { const a = yaw + ph + t0 * TAU / U.p.per; U.spin.rotation.y = a; const lit = out && !o.off && n > .02; U.bg.visible = lit; U.halo.visible = lit;
        if (lit) { const dx = CP.x - cx, dz = CP.z - cz, L = Math.hypot(dx, dz) || 1, c = Math.abs((dx * Math.cos(a) - dz * Math.sin(a)) / L), fl = Math.pow(c, 14), s = U.p.Rl * (2.2 + 5 * fl) * (1 + Math.min(1, L / 120));
          U.halo.quaternion.copy(cam.quaternion); U.halo.scale.set(s, s, s); } }
      else { U.yaw.rotation.y = yaw + Math.sin(t0 * .05 + ph) * .12; const w = t0 * (1.6 + .5 * Math.sin(t0 * .13 + ph)) + ph; U.wheel.rotation.z = -w; U.tige.position.y = Math.sin(w * .4) * .06; } } });

  // ===================== à la création du monde : une éolienne près de chaque grange =====================
  G.on('worldgen', map => { for (const o of [...map.list]) { if (o.t !== 'grange') continue; const [w, dd] = G.fpDims(O.grange, o.r);
    for (const [x, z] of [[o.x + w + 1, o.z], [o.x - 3, o.z], [o.x, o.z + dd + 1], [o.x + w + 1, o.z + dd - 2], [o.x, o.z - 3]]) if (map.canPlace('eolienne_ferme', x, z)) { map.addObj('eolienne_ferme', x, z, 0); break; } } });
})();
