'use strict';
// ===== Mobilier des châteaux à la française : cheminée de marbre à trumeau doré, console dorée à glace, lit à baldaquin, fauteuils Louis XV,
// guéridon, buste sur gaine, harpe, clavecin peint, billard, globe terrestre, vases de porcelaine, torchères, statue antique,
// et le mur de pierre de taille des vestibules. Tout est au catalogue du mobilier (et dans le plan du château, touche H). =====
(function () {
  const MD = G.MODELS, O = G.OBJ, I = G.ITEMS, PI = Math.PI, TAU = PI * 2, SK = () => G.SK || {};
  const GD = 0xd9b04a, MW = 0xf1ede6, VEL = [0x8a2f3a, 0x2f4a8a, 0x2f5a3f, 0xc9a23a], GLASS = 0xd5e2ea;
  const bx = (b, w, h, d, col, x, y, z, rx = 0, ry = 0, rz = 0, mat = 0) => b.add(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, rx, ry, rz), mat);
  const lt = (c, k = .3) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex(), dk = (c, k = .75) => new THREE.Color(c).multiplyScalar(k).getHex();
  const lathe = (b, pts, seg, col, x, y, z, mat = 0) => b.add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg), col, b.M(x, y, z), mat);
  const item = (id, n, model, p = {}) => { O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0, take: 1, cat: 'mobilier' }, p); I[id] = { id, n, kind: 'place', obj: id, cat: 'mobilier', thumb: 'obj:' + id, buy: p.buy || 6000, sell: p.sell || Math.round((p.buy || 6000) / 8), stack: O[id].fp[0] * O[id].fp[1] > 2 ? 1 : 99 }; if (G.SHOPLIST) G.SHOPLIST.push(id); };
  // pied galbé (cabriole) : courbe en S du genou au sabot
  const cabriole = (b, x, y, z, h, ox, oz, r, col) => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, y, z), new THREE.Vector3(x + ox * .7, y - h * .22, z + oz * .7), new THREE.Vector3(x - ox * .15, y - h * .7, z - oz * .15), new THREE.Vector3(x + ox * .25, y - h, z + oz * .25)]);
    b.add(new THREE.TubeGeometry(c, 10, r, 6), col, b.M(), 0, true); b.add(new THREE.SphereGeometry(r * 1.4, 8, 6), col, b.M(x + ox * .25, y - h + r * .6, z + oz * .25)); };
  const flame = (b, x, y, z, s = 1) => { b.add(new THREE.SphereGeometry(.022 * s, 6, 5), 0xffd27a, b.M(x, y, z, 0, 0, 0, 1, 1.8, 1), 1); };
  const candle = (b, x, y, z, s = 1) => { b.add(new THREE.CylinderGeometry(.013 * s, .013 * s, .13 * s, 6), 0xfff8ec, b.M(x, y + .065 * s, z)); flame(b, x, y + .16 * s, z, s); };

  // ---------- mur de pierre de taille (vestibules, chapelle, salle des gardes) ----------
  if (G.WALLS && !G.WALLS.find(w => w[0] === 'pierre_taille')) G.WALLS.push(['pierre_taille', 'Pierre de taille', (x, r) => { const S = x.canvas.width;
    x.fillStyle = '#e6dcc6'; x.fillRect(0, 0, S, S); const rows = 6, rh = S / rows;
    for (let j = 0; j < rows; j++) { const off = j % 2 ? S / 4 : 0; for (let i = -1; i < 3; i++) { const x0 = i * S / 2 + off, c = 222 + Math.floor((r() - .5) * 18); x.fillStyle = `rgb(${c + 6},${c - 2},${c - 22})`; x.fillRect(x0 + 2, j * rh + 2, S / 2 - 4, rh - 4);
      x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(x0 + 3, j * rh + 3, S / 2 - 6, 2); x.fillStyle = 'rgba(90,70,40,.12)'; for (let k = 0; k < 14; k++) x.fillRect(x0 + 4 + r() * (S / 2 - 10), j * rh + 4 + r() * (rh - 8), 2, 1); } }
    x.strokeStyle = 'rgba(150,130,100,.55)'; x.lineWidth = 2; for (let j = 0; j <= rows; j++) { x.beginPath(); x.moveTo(0, j * rh); x.lineTo(S, j * rh); x.stroke(); } }]);

  // ---------- cheminée de marbre, trumeau à glace doré, garniture (pendule et candélabres), feu ----------
  MD.cheminee_marbre = v => { const b = G.mb(5101 + v), M = [MW, 0xd3c6bc, 0xa04c3e][v % 3], MV = dk(M, .88);
    b.S(SK().stone); bx(b, 2.0, .04, .72, lt(M, .2), 0, .02, -.12);
    for (const s of [-1, 1]) { b.box(.26, .92, .3, M, s * .79, .5, -.33); bx(b, .32, .1, .36, MV, s * .79, .05, -.32); b.add(new THREE.TorusGeometry(.1, .04, 6, 12, PI * 1.5), M, b.M(s * .79, .84, -.18, 0, PI / 2, 0), 0, true); }
    b.box(1.84, .28, .3, M, 0, 1.08, -.35); bx(b, 2.06, .07, .46, M, 0, 1.26, -.28); bx(b, 1.98, .04, .42, MV, 0, 1.21, -.28); b.S(null);
    bx(b, 1.32, .86, .04, 0x18120d, 0, .47, -.46); for (const s of [-1, 1]) bx(b, .04, .86, .32, 0x241a12, s * .64, .47, -.32);
    b.add(new THREE.CircleGeometry(.24, 16), 0x3a3430, b.M(0, .55, -.435)); // plaque de fonte au soleil
    for (const s of [-1, 1]) { b.cyl(.025, .03, .24, 8, GD, s * .38, .15, -.04); b.add(new THREE.SphereGeometry(.05, 10, 8), GD, b.M(s * .38, .3, -.04)); bx(b, .04, .04, .42, 0x2a2420, s * .38, .09, -.25); }
    for (const [x, ry] of [[-.14, .3], [.13, -.25]]) b.add(new THREE.CylinderGeometry(.07, .07, .72, 8), 0x6b4226, b.M(x, .17, -.26, 0, ry, PI / 2));
    b.cone(.14, .44, 6, 0xff8a1f, -.08, .42, -.26, 0, 0, 0, 3); b.cone(.1, .34, 6, 0xffb03a, .14, .37, -.23, 0, .4, 0, 3); b.cone(.07, .26, 6, 0xffe14a, 0, .34, -.2, 0, .9, 0, 3);
    b.S(SK().gold); b.add(new THREE.TorusGeometry(.08, .018, 4, 14), GD, b.M(0, 1.08, -.19, 0, 0, 0, 1.35, 1, 1)); b.add(new THREE.SphereGeometry(.05, 10, 8), GD, b.M(0, 1.08, -.19, 0, 0, 0, 1, 1, .6));
    for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(.22, .014, 4, 12, PI), GD, b.M(s * .46, 1.17, -.19, 0, 0, PI));
    bx(b, .28, .3, .15, GD, 0, 1.45, -.34); b.add(new THREE.SphereGeometry(.06, 10, 8), GD, b.M(0, 1.64, -.34)); b.S(null); b.cyl(.085, .085, .02, 16, 0xfaf6ea, 0, 1.47, -.262, PI / 2, 0, 0);
    for (const s of [-1, 1]) { b.S(SK().gold); b.cyl(.025, .055, .32, 8, GD, s * .76, 1.46, -.33); b.add(new THREE.TorusGeometry(.1, .012, 4, 10, PI), GD, b.M(s * .76, 1.62, -.33, 0, 0, PI)); b.S(null); for (const dx of [-.1, 0, .1]) candle(b, s * .76 + dx, dx ? 1.62 : 1.66, -.33); }
    b.S(SK().gold); bx(b, 1.68, 2.15, .06, GD, 0, 2.46, -.47); b.S(null); bx(b, 1.48, 1.94, .02, GLASS, 0, 2.43, -.435, 0, 0, 0, 2);
    b.S(SK().gold); for (const y of [1.62, 3.36]) bx(b, 1.56, .05, .03, GD, 0, y, -.42); b.add(new THREE.CircleGeometry(.36, 16, 0, PI), GD, b.M(0, 3.53, -.445));
    for (let k = 1; k < 8; k++) { const a = k / 8 * PI; bx(b, .02, .32, .02, GD, Math.cos(a) * .18, 3.53 + Math.sin(a) * .18, -.43, 0, 0, a - PI / 2); } b.S(null);
    return b.done(); };
  // ---------- console dorée à plateau de marbre, glace au-dessus, garniture ----------
  MD.console_doree = v => { const b = G.mb(5102 + v), top = [0xd9d0c6, 0x9a4a3c, 0x3e5b4a][v % 3];
    b.S(SK().stone); bx(b, 1.72, .06, .52, top, 0, .87, -.2); b.S(null);
    b.S(SK().gold); bx(b, 1.6, .15, .05, GD, 0, .76, .04); for (const s of [-1, 1]) bx(b, .05, .15, .44, GD, s * .78, .76, -.18);
    b.add(new THREE.TorusGeometry(.07, .016, 4, 14), GD, b.M(0, .74, .07, 0, 0, 0, 1.4, 1, 1)); for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(.12, .012, 4, 10, PI), GD, b.M(s * .36, .72, .07, 0, 0, PI));
    for (const s of [-1, 1]) for (const z of [-.38, .02]) cabriole(b, s * .72, .7, z, .7, s * .05, z > -.2 ? .06 : 0, .03, GD);
    bx(b, 1.4, .03, .03, GD, 0, .18, -.17, 0, .3, 0); bx(b, 1.4, .03, .03, GD, 0, .18, -.17, 0, -.3, 0); b.add(new THREE.SphereGeometry(.06, 10, 8), GD, b.M(0, .22, -.17));
    bx(b, 1.32, 1.86, .05, GD, 0, 2.02, -.47); b.S(null); bx(b, 1.16, 1.68, .02, GLASS, 0, 2.0, -.44, 0, 0, 0, 2); b.S(SK().gold); b.add(new THREE.CircleGeometry(.24, 14, 0, PI), GD, b.M(0, 2.95, -.45)); b.S(null);
    lathe(b, [[0, 0], [.07, 0], [.06, .05], [.12, .14], [.13, .24], [.08, .34], [.06, .38], [.08, .42], [0, .42]], 14, 0xf3f1ec, 0, .9, -.2); for (const y of [1.06, 1.18]) b.add(new THREE.TorusGeometry(.125, .018, 4, 14), 0x2f4f9a, b.M(0, y, -.2, PI / 2, 0, 0));
    for (const s of [-1, 1]) { b.S(SK().gold); b.cyl(.02, .045, .3, 8, GD, s * .62, 1.05, -.24); b.S(null); candle(b, s * .62, 1.2, -.24, 1.1); }
    return b.done(); };
  // ---------- lit à baldaquin : colonnes dorées, ciel de lit, lambrequin festonné, rideaux, panaches ----------
  MD.lit_baldaquin = v => { const b = G.mb(5103 + v), C1 = VEL[v % 4], C2 = lt(C1, .25), CR = 0xf6f0e6, H = 2.75;
    b.S(SK().gold); b.box(1.9, .32, 1.92, 0xc9a24a, 0, .22, .02); b.S(null);
    b.box(1.82, .2, 1.84, CR, 0, .47, .02); b.S(SK().velvet); b.box(1.88, .12, 1.36, C1, 0, .58, .3); bx(b, 1.9, .2, .04, C1, 0, .5, .97); for (const s of [-1, 1]) bx(b, .04, .2, 1.36, C1, s * .945, .5, .3); b.S(null);
    b.S(SK().gold); bx(b, 1.9, .03, .05, GD, 0, .41, .99); b.S(null);
    for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(.24, 14, 10), CR, b.M(s * .44, .62, -.6, 0, 0, 0, 1.2, .55, .9)); b.add(new THREE.CylinderGeometry(.11, .11, 1.6, 12), C2, b.M(0, .62, -.38, 0, 0, PI / 2), 0, true);
    // tête de lit capitonnée, cintrée, sculptée
    b.S(SK().velvet); b.box(1.6, 1.0, .1, C2, 0, 1.02, -.9); b.add(new THREE.CylinderGeometry(.8, .8, .1, 20, 1, false, -PI / 2, PI), C2, b.M(0, 1.52, -.9, PI / 2, 0, 0, 1, 1, .45)); b.S(null);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.add(new THREE.SphereGeometry(.018, 6, 4), GD, b.M(-.54 + i * .36, .74 + j * .26, -.84));
    b.S(SK().gold); b.add(new THREE.TorusGeometry(.8, .035, 4, 20, PI), GD, b.M(0, 1.52, -.86, 0, 0, 0, 1, .45, 1)); b.add(new THREE.SphereGeometry(.08, 10, 8), GD, b.M(0, 1.9, -.86));
    // colonnes, ciel de lit, panaches
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * .9, z = sz * .9 + .02; b.cyl(.04, .05, H, 10, GD, x, H / 2, z); for (const y of [.5, 1.1, 1.7, 2.3]) b.add(new THREE.TorusGeometry(.05, .018, 4, 10), GD, b.M(x, y, z, PI / 2, 0, 0)); b.add(new THREE.SphereGeometry(.07, 10, 8), GD, b.M(x, H + .12, z)); b.cone(.04, .2, 8, GD, x, H + .28, z); }
    for (const [w2, d2, x2, z2] of [[1.96, .07, 0, 1.0], [1.96, .07, 0, -.96], [.07, 1.96, -.98, .02], [.07, 1.96, .98, .02]]) bx(b, w2, .08, d2, GD, x2, H + .01, z2); b.S(null); b.S(SK().velvet); bx(b, 1.9, .05, 1.9, C1, 0, H + .02, .02); b.S(null);
    b.S(SK().velvet); bx(b, 1.88, .03, 1.88, C1, 0, H - .03, .02); for (const [w, d, x, z] of [[1.96, .03, 0, .98], [1.96, .03, 0, -.94], [.03, 1.94, -.98, .02], [.03, 1.94, .98, .02]]) bx(b, w, .34, d, C1, x, H - .2, z);
    for (let k = 0; k < 7; k++) { const x = -.84 + k * .28; b.add(new THREE.CylinderGeometry(.14, .14, .03, 12, 1, false, 0, PI), C1, b.M(x, H - .37, .98, PI / 2, 0, PI)); } // festons
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * .82, z = sz * .82 + .02; b.add(new THREE.CylinderGeometry(.06, .14, H - .5, 10), C2, b.M(x, (H - .5) / 2 + .25, z), 0, true); b.add(new THREE.TorusGeometry(.09, .018, 4, 10), GD, b.M(x, 1.15, z, PI / 2, 0, 0)); }
    b.S(null); b.S(SK().gold); bx(b, 1.96, .035, .04, GD, 0, H - .38, 1.0); b.S(null);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(.06, 8, 6), 0xfaf6ee, b.M(sx * .9 + (k - 1) * .05, H + .38 + k * .04, sz * .9 + .02, 0, 0, (k - 1) * .4, .7, 1.6, .7)); // plumes
    return b.done(); };
  // ---------- fauteuil Louis XV : bois doré sculpté, velours, dossier en médaillon ----------
  MD.fauteuil_louis = v => { const b = G.mb(5104 + v), C1 = VEL[v % 4];
    b.S(SK().gold); bx(b, .7, .08, .64, GD, 0, .4, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cabriole(b, sx * .3, .38, sz * .27, .38, sx * .03, sz * .03, .03, GD);
    b.add(new THREE.TorusGeometry(.27, .03, 5, 18), GD, b.M(0, .9, -.27, -.1, 0, 0, .95, 1.2, 1)); b.add(new THREE.SphereGeometry(.04, 8, 6), GD, b.M(0, 1.24, -.3));
    for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * .31, .45, .27), new THREE.Vector3(s * .33, .64, .12), new THREE.Vector3(s * .31, .66, -.12), new THREE.Vector3(s * .28, .78, -.25)]); b.add(new THREE.TubeGeometry(c, 8, .025, 6), GD, b.M(), 0, true); }
    b.S(SK().velvet); b.add(new THREE.SphereGeometry(.32, 16, 10), C1, b.M(0, .49, .01, 0, 0, 0, 1.0, .25, .95)); b.add(new THREE.SphereGeometry(.25, 16, 12), C1, b.M(0, .9, -.27, -.1, 0, 0, .95, 1.18, .22));
    for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(.05, 8, 6), C1, b.M(s * .32, .66, -.02, 0, 0, 0, .9, .6, 2.2)); b.S(null);
    return b.done(); };
  // ---------- guéridon : plateau de marbre rond, piètement tripode doré, bouquet ----------
  MD.gueridon = v => { const b = G.mb(5105 + v), top = [0xd9d0c6, 0x9a4a3c][v % 2];
    b.S(SK().stone); b.cyl(.34, .34, .05, 20, top, 0, .74, 0); b.S(null); b.S(SK().gold); b.add(new THREE.TorusGeometry(.34, .018, 4, 20), GD, b.M(0, .74, 0, PI / 2, 0, 0)); b.cyl(.03, .05, .5, 10, GD, 0, .45, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cabriole(b, Math.cos(a) * .06, .3, Math.sin(a) * .06, .3, Math.cos(a) * .2, Math.sin(a) * .2, .025, GD); } b.S(null);
    lathe(b, [[0, 0], [.06, 0], [.05, .04], [.09, .12], [.07, .2], [.05, .22], [0, .22]], 12, 0xf3f1ec, 0, .77, 0); b.jit(.1); b.add(new THREE.IcosahedronGeometry(.13, 1), 0x4f8a43, b.M(0, 1.08, 0, 0, 0, 0, 1, .8, 1)); b.jit(0);
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; b.add(new THREE.IcosahedronGeometry(.045, 0), [0xf2a0b8, 0xffffff, 0xe8434a][k % 3], b.M(Math.cos(a) * .1, 1.1 + (k % 3) * .03, Math.sin(a) * .1)); }
    return b.done(); };
  // ---------- buste de marbre sur sa gaine ----------
  MD.buste = v => { const b = G.mb(5106 + v), M = MW, P2 = [0x8a4038, 0x3e5b4a, 0xd3c6bc][v % 3];
    b.S(SK().stone); bx(b, .4, .08, .4, P2, 0, .04, 0); lathe(b, [[.17, 0], [.13, .1], [.15, .9], [.18, .96], [.2, 1.02], [0, 1.02]], 4, P2, 0, .08, 0); bx(b, .44, .06, .44, P2, 0, 1.13, 0); b.S(null);
    b.S(SK().ceramic); b.add(new THREE.CylinderGeometry(.1, .14, .1, 12), M, b.M(0, 1.21, 0)); b.add(new THREE.SphereGeometry(.2, 16, 10), M, b.M(0, 1.38, 0, 0, 0, 0, 1.25, .62, .7)); b.add(new THREE.CylinderGeometry(.05, .06, .1, 10), M, b.M(0, 1.5, 0));
    b.add(new THREE.SphereGeometry(.1, 14, 12), M, b.M(0, 1.63, .01, 0, 0, 0, .92, 1.08, 1)); b.add(new THREE.SphereGeometry(.03, 8, 6), M, b.M(0, 1.62, .1));
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(.05, 8, 6), M, b.M(s * .1, 1.7 - k * .08, -.03, 0, 0, 0, .8, 1, 1)); // perruque bouclée
    b.add(new THREE.SphereGeometry(.105, 12, 8), M, b.M(0, 1.69, -.02, 0, 0, 0, 1, .7, 1)); b.add(new THREE.BoxGeometry(.3, .04, .02), M, b.M(0, 1.36, .12, 0, 0, .5)); b.S(null);
    return b.done(); };
  // ---------- harpe dorée ----------
  MD.harpe = v => { const b = G.mb(5107 + v); b.S(SK().gold);
    bx(b, .34, .12, .3, GD, 0, .06, 0); for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(.04, 8, 6), GD, b.M(s * .13, .02, .1));
    b.cyl(.035, .045, 1.55, 10, GD, -.12, .9, 0, 0, 0, .08); b.add(new THREE.SphereGeometry(.07, 10, 8), GD, b.M(-.06, 1.7, 0)); b.cone(.05, .14, 8, GD, -.06, 1.8, 0);
    const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(-.06, 1.66, 0), new THREE.Vector3(.12, 1.58, 0), new THREE.Vector3(.3, 1.42, 0), new THREE.Vector3(.42, 1.3, 0)]); b.add(new THREE.TubeGeometry(neck, 10, .035, 6), GD, b.M(), 0, true); b.S(null);
    b.S(SK().wood); b.add(new THREE.BoxGeometry(.12, 1.25, .2), 0x9a6a3a, b.M(.24, .72, 0, 0, 0, -.3)); b.S(null);
    for (let k = 0; k < 10; k++) { const t = .04 + k / 10 * .9, x = .06 + .36 * t, y0 = .16 + 1.14 * t, y1 = 1.57 - .27 * t; if (y1 - y0 < .06) continue; b.add(new THREE.CylinderGeometry(.004, .004, y1 - y0, 3), 0xf7f2e2, b.M(x, (y0 + y1) / 2, 0)); }
    return b.done(); };
  // ---------- clavecin peint et doré, couvercle ouvert sur un paysage ----------
  MD.clavecin = v => { const b = G.mb(5108 + v), C1 = [0x3e5b4a, 0x8a2f3a, 0x2f4a8a][v % 3];
    b.S(SK().paint); bx(b, 1.8, .26, .9, C1, 0, .86, -.05); bx(b, .7, .26, .5, C1, .55, .86, -.62, 0, .45, 0); b.S(null); b.S(SK().gold); bx(b, 1.84, .03, .94, GD, 0, .99, -.05); bx(b, 1.82, .03, .04, GD, 0, .74, .41); b.S(null);
    for (let i = 0; i < 24; i++) bx(b, .06, .03, .2, i % 7 === 2 || i % 7 === 6 ? 0xf6f0df : (i % 2 ? 0x221d1a : 0xf6f0df), -.75 + i * .065, .9, .32);
    b.S(SK().paint); bx(b, 1.78, .02, .88, C1, 0, 1.38, -.42, -.85, 0, 0); b.S(null); bx(b, 1.6, .012, .72, 0xbfd6e2, 0, 1.38, -.405, -.85, 0, 0); bx(b, 1.5, .013, .25, 0x6f9a5a, 0, 1.16, -.24, -.85, 0, 0);
    b.S(SK().gold); for (const sx of [-1, 1]) for (const z of [-.38, .3]) cabriole(b, sx * .78, .74, z, .74, sx * .04, z > 0 ? .05 : -.04, .03, GD); bx(b, .02, .6, .02, GD, -.2, 1.15, -.18, -.4, 0, 0); b.S(null);
    return b.done(); };
  // ---------- billard : drap vert, bandes, poches, billes et queues ----------
  MD.billard = v => { const b = G.mb(5109 + v), W = [0x6b4226, 0x4a2c18][v % 2];
    b.S(SK().wood); b.box(2.7, .22, 1.6, W, 0, .72, 0); for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) lathe(b, [[.09, 0], [.06, .1], [.1, .25], [.07, .45], [.11, .55], [.1, .62], [0, .62]], 10, W, sx * 1.15, 0, sz * .62); b.S(null);
    b.S(SK().fabric); bx(b, 2.44, .04, 1.34, 0x2f7a46, 0, .84, 0); for (const [w, d, x, z] of [[2.44, .1, 0, .7], [2.44, .1, 0, -.7], [.1, 1.34, 1.25, 0], [.1, 1.34, -1.25, 0]]) bx(b, w, .07, d, 0x2a6a3e, x, .875, z); b.S(null);
    b.S(SK().gold); for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(.025, 6, 4), GD, b.M(-1.0 + k * .4, .89, .79)); b.S(null);
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) b.cyl(.065, .065, .02, 12, 0x111111, sx * 1.22, .868, sz * .66);
    for (const [x, z, c] of [[.5, .1, 0xf7f3e6], [.62, -.18, 0xd13a2f], [-.6, .05, 0xf2c94a]]) b.add(new THREE.SphereGeometry(.05, 12, 10), c, b.M(x, .91, z));
    for (const [z, ry] of [[-.3, .08], [.3, -.05]]) b.add(new THREE.CylinderGeometry(.012, .022, 1.45, 8), 0xc8a06a, b.M(-.1, .89, z, 0, ry, PI / 2));
    return b.done(); };
  // ---------- globe terrestre sur son pied ----------
  MD.globe_terrestre = v => { const b = G.mb(5110 + v); b.S(SK().wood);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; b.add(new THREE.CylinderGeometry(.025, .02, .78, 8), 0x7a4e2a, b.M(Math.cos(a) * .18, .39, Math.sin(a) * .18, Math.sin(a) * .2, 0, -Math.cos(a) * .2)); }
    b.add(new THREE.TorusGeometry(.3, .03, 4, 20), 0x8a5a30, b.M(0, .74, 0, PI / 2, 0, 0)); b.S(null);
    b.add(new THREE.SphereGeometry(.26, 18, 14), 0x6f93b4, b.M(0, .86, 0)); for (let k = 0; k < 9; k++) { const a = k * 2.4, e = Math.sin(k * 1.7) * .9; b.add(new THREE.SphereGeometry(.08 + (k % 3) * .02, 8, 6), 0xd9c08a, b.M(Math.cos(a) * Math.cos(e) * .245, .86 + Math.sin(e) * .245, Math.sin(a) * Math.cos(e) * .245, 0, -a, 0, .55, .5, .2)); }
    b.S(SK().gold); b.add(new THREE.TorusGeometry(.3, .012, 4, 24), GD, b.M(0, .86, 0, 0, 0, .41)); b.S(null);
    return b.done(); };
  // ---------- grand vase de porcelaine bleu et blanc sur socle doré ----------
  MD.vase_chine = v => { const b = G.mb(5111 + v), B = [0x2f4f9a, 0x8a2f3a][v % 2];
    b.S(SK().gold); b.cyl(.2, .24, .1, 12, GD, 0, .05, 0); b.S(null); b.S(SK().ceramic);
    lathe(b, [[0, 0], [.17, 0], [.15, .05], [.22, .25], [.28, .5], [.27, .72], [.18, .92], [.11, 1.02], [.12, 1.12], [.16, 1.18], [0, 1.18]], 18, 0xf3f1ec, 0, .1, 0);
    for (const [y, r] of [[.38, .255], [.62, .285], [.88, .2]]) b.add(new THREE.TorusGeometry(r, .02, 4, 18), B, b.M(0, y, 0, PI / 2, 0, 0));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.add(new THREE.SphereGeometry(.05, 8, 6), B, b.M(Math.cos(a) * .27, .55 + (k % 2) * .08, Math.sin(a) * .27, 0, -a, 0, .3, 1, 1)); }
    b.add(new THREE.SphereGeometry(.07, 10, 8), B, b.M(0, 1.3, 0)); b.S(null);
    return b.done(); };
  // ---------- torchère dorée à bougies ----------
  MD.torchere = v => { const b = G.mb(5112 + v); b.S(SK().gold);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; cabriole(b, Math.cos(a) * .05, .32, Math.sin(a) * .05, .32, Math.cos(a) * .16, Math.sin(a) * .16, .025, GD); }
    lathe(b, [[.05, 0], [.035, .2], [.06, .4], [.03, .7], [.05, 1.0], [.03, 1.3], [.07, 1.45], [0, 1.45]], 10, GD, 0, .3, 0);
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; b.add(new THREE.TorusGeometry(.12, .012, 4, 8, PI / 2), GD, b.M(Math.cos(a) * .12, 1.78, Math.sin(a) * .12, 0, -a, PI)); b.cyl(.025, .02, .04, 8, GD, Math.cos(a) * .24, 1.79, Math.sin(a) * .24); }
    b.S(null); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; candle(b, Math.cos(a) * .24, 1.81, Math.sin(a) * .24, 1.1); } candle(b, 0, 1.78, 0, 1.2);
    return b.done(); };
  // ---------- statue antique de marbre sur piédestal ----------
  MD.statue_antique = v => { const b = G.mb(5113 + v), M = v % 2 ? 0xe9e4da : MW, P2 = 0xd8cfc2; b.S(SK().stone);
    bx(b, .5, .1, .5, P2, 0, .05, 0); bx(b, .4, .5, .4, lt(P2, .3), 0, .35, 0); bx(b, .48, .08, .48, P2, 0, .64, 0); b.S(null); b.S(SK().ceramic);
    const y0 = .68, s = 1.05; b.add(new THREE.CylinderGeometry(.15 * s, .16 * s, .05, 12), M, b.M(0, y0 + .025, 0));
    b.add(new THREE.CylinderGeometry(.08 * s, .14 * s, .5 * s, 12), M, b.M(0, y0 + .3 * s, 0, 0, 0, .05)); b.add(new THREE.CylinderGeometry(.1 * s, .08 * s, .28 * s, 12), M, b.M(-.01, y0 + .67 * s, 0, 0, 0, -.06));
    b.add(new THREE.SphereGeometry(.07 * s, 12, 8), M, b.M(0, y0 + .81 * s, 0, 0, 0, 0, 1.75, .6, 1)); b.add(new THREE.SphereGeometry(.06 * s, 12, 10), M, b.M(0, y0 + .93 * s, 0, 0, 0, .1, .95, 1.08, 1));
    b.add(new THREE.CylinderGeometry(.022 * s, .026 * s, .3 * s, 8), M, b.M(-.12 * s, y0 + .66 * s, 0, 0, 0, .12)); b.add(new THREE.CylinderGeometry(.022 * s, .026 * s, .3 * s, 8), M, b.M(.13 * s, y0 + .95 * s, .02, 0, 0, -.5));
    b.add(new THREE.TorusGeometry(.05 * s, .011, 4, 10), M, b.M(.2 * s, y0 + 1.12 * s, .03)); b.add(new THREE.BoxGeometry(.24 * s, .05 * s, .03 * s), M, b.M(0, y0 + .64 * s, .07, 0, 0, .7)); b.S(null);
    return b.done(); };

  // ---------- autel de chapelle : marbre, devant d'autel doré, nappe, crucifix et chandeliers, retable peint ----------
  MD.autel = v => { const b = G.mb(5114 + v); b.S(SK().stone); b.box(1.9, .9, .7, 0xece6dc, 0, .47, -.1); bx(b, 2.0, .06, .8, 0xd8cfc2, 0, .95, -.1); bx(b, 1.6, .26, .3, 0xe2dbd0, 0, 1.11, -.35); b.S(null);
    b.S(SK().gold); bx(b, 1.3, .55, .03, GD, 0, .5, .26); b.add(new THREE.TorusGeometry(.14, .02, 4, 16), GD, b.M(0, .52, .28)); b.S(null);
    b.S(SK().fabric); bx(b, 1.94, .02, .74, 0xfbf8f1, 0, .99, -.1); bx(b, 1.94, .18, .02, 0xfbf8f1, 0, .9, .27); b.S(null);
    b.S(SK().gold); bx(b, .04, .5, .04, GD, 0, 1.5, -.36); bx(b, .26, .04, .04, GD, 0, 1.62, -.36); b.add(new THREE.SphereGeometry(.05, 8, 6), GD, b.M(0, 1.26, -.36));
    for (const s of [-1, 1]) { lathe(b, [[.06, 0], [.03, .05], [.04, .2], [.025, .34], [.05, .38], [0, .38]], 8, GD, s * .5, 1.24, -.36); } b.S(null); for (const s of [-1, 1]) candle(b, s * .5, 1.62, -.36, 1.4);
    b.S(SK().gold); bx(b, 1.5, 1.6, .06, GD, 0, 2.45, -.47); b.S(null); bx(b, 1.32, 1.42, .02, 0x6f8fbf, 0, 2.45, -.435); b.add(new THREE.CircleGeometry(.3, 18), 0xfff1c4, b.M(0, 2.7, -.42), 1); bx(b, .5, .7, .02, 0xd9b48a, 0, 2.25, -.42);
    b.S(SK().gold); b.add(new THREE.CircleGeometry(.4, 14, 0, PI), GD, b.M(0, 3.25, -.45)); b.S(null);
    return b.done(); };
  // ---------- armure sur son socle (salle des gardes) ----------
  MD.armure = v => { const b = G.mb(5115 + v), ST = 0xc9ced6; b.S(SK().wood); bx(b, .5, .1, .5, 0x5a3a20, 0, .05, 0); b.S(null); b.S(SK().steel);
    for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(.06, .05, .5, 10), ST, b.M(s * .1, .37, 0)); b.add(new THREE.CylinderGeometry(.07, .06, .4, 10), ST, b.M(s * .1, .8, 0)); b.add(new THREE.SphereGeometry(.07, 10, 8), ST, b.M(s * .1, .6, .02)); }
    b.add(new THREE.CylinderGeometry(.19, .15, .45, 12), ST, b.M(0, 1.2, 0)); b.add(new THREE.SphereGeometry(.2, 12, 10), ST, b.M(0, 1.36, 0, 0, 0, 0, 1, .5, .8));
    for (const s of [-1, 1]) { b.add(new THREE.SphereGeometry(.1, 10, 8), ST, b.M(s * .22, 1.4, 0)); b.add(new THREE.CylinderGeometry(.05, .045, .55, 10), ST, b.M(s * .25, 1.1, .03, 0, 0, s * .1)); }
    b.add(new THREE.SphereGeometry(.12, 14, 12), ST, b.M(0, 1.6, 0)); bx(b, .2, .03, .05, 0x2a2a2e, 0, 1.6, .11); b.add(new THREE.ConeGeometry(.04, .14, 8), 0xb02a2a, b.M(0, 1.76, 0));
    b.cyl(.015, .015, 2.0, 6, 0x6b4a2e, .3, 1.0, .1); b.add(new THREE.ConeGeometry(.04, .2, 4), ST, b.M(.3, 2.08, .1)); bx(b, .2, .14, .02, ST, .36, 1.88, .1); b.S(null);
    return b.done(); };

  // ---------- tapis de la Savonnerie : fond, bordures, rinceaux, médaillon central, écoinçons fleuris, franges ----------
  MD.tapis_savonnerie = v => { const b = G.mb(5116 + v), PAL2 = [[0x7a2a2e, 0xe9d9b0, 0x2f4a6a, 0xc9a23a], [0x2f4a6a, 0xeadfc4, 0x8a3a3a, 0xc9a23a], [0xe8dcc0, 0x6b3a2a, 0x3f6a4a, 0xb9893a]][v % 3], [F, C2, C3, Or] = PAL2, W = 2.9, D = 1.9, y = .012;
    b.S(SK().fabric); bx(b, W, .016, D, C2, 0, y / 2, 0); bx(b, W - .2, .018, D - .2, F, 0, y / 2 + .002, 0); bx(b, W - .36, .02, D - .36, C3, 0, y / 2 + .003, 0); bx(b, W - .44, .021, D - .44, F, 0, y / 2 + .004, 0);
    for (let k = 0; k < 18; k++) { const t = (k + .5) / 18; for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(.035, .035, .022, 8), Or, b.M(-W / 2 + .1 + t * (W - .2), y + .002, s * (D / 2 - .1))); }
    for (let k = 0; k < 12; k++) { const t = (k + .5) / 12; for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(.035, .035, .022, 8), Or, b.M(s * (W / 2 - .1), y + .002, -D / 2 + .1 + t * (D - .2))); }
    b.add(new THREE.CylinderGeometry(.48, .48, .024, 28), C2, b.M(0, y + .004, 0, 0, 0, 0, 1.25, 1, 1)); b.add(new THREE.CylinderGeometry(.36, .36, .026, 24), C3, b.M(0, y + .006, 0, 0, 0, 0, 1.25, 1, 1)); b.add(new THREE.CylinderGeometry(.18, .18, .028, 16), Or, b.M(0, y + .008, 0));
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; b.add(new THREE.SphereGeometry(.07, 8, 4), k % 2 ? Or : C2, b.M(Math.cos(a) * .66, y + .004, Math.sin(a) * .46, 0, -a, 0, 1.6, .15, .7)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * (W / 2 - .45), z = sz * (D / 2 - .45); b.add(new THREE.CylinderGeometry(.16, .16, .024, 16), C2, b.M(x, y + .004, z)); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; b.add(new THREE.SphereGeometry(.05, 6, 4), [0xd9576a, 0xf2c94a, 0xffffff][k % 3], b.M(x + Math.cos(a) * .09, y + .008, z + Math.sin(a) * .09, 0, 0, 0, 1, .2, 1)); } }
    for (const s of [-1, 1]) for (let k = 0; k < 22; k++) bx(b, .012, .006, .08, 0xf2ead6, -W / 2 + .07 + k * (W - .14) / 21, .003, s * (D / 2 + .04));
    b.S(null); return b.done(); };
  item('tapis_savonnerie', 'Tapis de la Savonnerie', 'tapis_savonnerie', { h: .02, fp: [3, 2], walk: 1, floor: 1, buy: 9000 });
  item('autel', 'Autel de chapelle', 'autel', { h: 1.0, fp: [2, 1], buy: 14000 });
  item('armure', 'Armure', 'armure', { h: 1.8, buy: 11000 });
  item('cheminee_marbre', 'Cheminée de marbre à trumeau', 'cheminee_marbre', { h: 1.3, fp: [2, 1], light: 1, fire: 1, buy: 18000 });
  item('console_doree', 'Console dorée à glace', 'console_doree', { h: .92, fp: [2, 1], buy: 12000 });
  item('lit_baldaquin', 'Lit à baldaquin', 'lit_baldaquin', { h: .65, fp: [2, 2], sleep: 1, buy: 24000 });
  item('fauteuil_louis', 'Fauteuil Louis XV', 'fauteuil_louis', { h: .55, sit: 1, buy: 7000 });
  item('gueridon', 'Guéridon de marbre', 'gueridon', { h: .78, buy: 4500 });
  item('buste', 'Buste sur gaine', 'buste', { h: 1.8, buy: 9000 });
  item('harpe', 'Harpe dorée', 'harpe', { h: 1.8, buy: 9500 });
  item('clavecin', 'Clavecin peint', 'clavecin', { h: 1.0, fp: [2, 1], buy: 16000 });
  item('billard', 'Billard', 'billard', { h: .92, fp: [3, 2], buy: 15000 });
  item('globe_terrestre', 'Globe terrestre', 'globe_terrestre', { h: 1.1, buy: 5000 });
  item('vase_chine', 'Grand vase de porcelaine', 'vase_chine', { h: 1.3, buy: 6000 });
  item('torchere', 'Torchère dorée', 'torchere', { h: 1.95, light: 1, buy: 5500 });
  item('statue_antique', 'Statue antique', 'statue_antique', { h: 1.9, buy: 12000 });
})();
