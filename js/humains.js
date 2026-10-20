'use strict';
// ===== Vrais humains : proportions réalistes façon animé (environ 5,5 têtes, 1,33 de haut), visage dessiné en haute définition
// (yeux animés, cils, sourcils, nez, bouche, joues, expressions), coiffures en mèches, vêtements qui suivent le corps,
// coudes et genoux qui plient tout seuls. Les habitants et commerçants deviennent aussi des humains : chacun a son
// apparence, et un détail rappelle son ancienne espèce (oreilles de chat, de lapin, de renard, queue…). =====
(function () {
  const TAU = Math.PI * 2, PI = Math.PI;
  const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6), C3 = c => new THREE.Color(c);
  const dark = (c, k = .78) => C3(c).multiplyScalar(k).getHex(), light = (c, k = .3) => C3(c).lerp(C3(0xffffff), k).getHex();
  const S = () => G.SK || {};
  // ---------- nouvelles options d'apparence ----------
  const LK = G.LOOKS;
  LK.hat.push(['renard', 'Oreilles de renard'], ['ours', 'Oreilles d\'ours'], ['chien', 'Oreilles de chien'], ['capitaine', 'Casquette de capitaine'], ['haut_forme', 'Haut-de-forme'], ['serre_tete', 'Serre-tête']);
  LK.acc.push(['noeud_pap', 'Nœud papillon'], ['cravate', 'Cravate'], ['collier', 'Collier de perles']);
  LK.hair.splice(LK.hair.length - 1, 0, ['long_lisse', 'Long lisse'], ['queue_haute', 'Queue haute'], ['decoiffe', 'Décoiffé'], ['garconne', 'Coupe garçonne']);
  LK.hairCols.push(0x3a2a20, 0xc8a070, 0x8a8f99);
  // 3e case : « g » réservé aux garçons, « f » aux filles (la garde-robe ne montre que ce qui va avec le genre choisi)
  const tag = (list, g, ids) => { for (const e of list) if (ids.includes(e[0])) e[2] = g; };
  tag(LK.hair, 'f', ['carre', 'long', 'queue', 'couettes', 'chignon', 'tresses', 'frange', 'ondule', 'macarons', 'mi_long', 'long_lisse', 'queue_haute']);
  LK.hair.splice(LK.hair.length - 1, 0, ['degrade', 'Dégradé', 'g'], ['banane', 'Banane', 'g'], ['raie', 'Raie sur le côté', 'g'], ['brosse', 'En brosse', 'g'], ['mulet', 'Mulet', 'g'],
    ['chignon_h', 'Chignon d\'homme', 'g'], ['long_h', 'Mi-long d\'homme', 'g'], ['boucles_h', 'Boucles courtes', 'g'], ['queue_basse', 'Queue basse', 'f'], ['tresse_cote', 'Tresse sur le côté', 'f']);
  LK.hair.splice(LK.hair.length - 1, 0, ['rase', 'Tondu ras', 'g'], ['bol', 'Coupe au bol'], ['plaque', 'Plaqué en arrière', 'g'], ['ebouriffe', 'Ébouriffé', 'g'], ['ondule_h', 'Ondulé mi-court', 'g'], ['dreads', 'Dreadlocks'],
    ['pixie', 'Coupe pixie', 'f'], ['carre_ondule', 'Carré ondulé', 'f'], ['longues_boucles', 'Longues boucles', 'f'], ['chignon_bas', 'Chignon bas', 'f'], ['demi_queue', 'Demi-queue', 'f'], ['tresse_couronne', 'Tresse couronne', 'f'],
    ['queue_tressee', 'Queue tressée', 'f'], ['frange_rideau', 'Frange rideau', 'f']);
  LK.eyes.push(['fins', 'Fins', 'g'], ['percants', 'Perçants', 'g'], ['serieux', 'Sérieux', 'g'], ['calmes', 'Calmes', 'g']); tag(LK.eyes, 'f', ['coeurs', 'etoiles']);
  LK.beard = [['aucune', 'Aucune'], ['trois_jours', 'Barbe de 3 jours'], ['moustache', 'Moustache'], ['bouc', 'Bouc'], ['barbe_courte', 'Barbe courte'], ['barbe', 'Grande barbe'], ['collier', 'Collier'], ['favoris', 'Favoris']];
  LK.body = [['mince', 'Mince'], ['normal', 'Normal'], ['athletique', 'Athlétique'], ['costaud', 'Costaud']];
  LK.top.push(['costume', 'Costume', 'g'], ['polo', 'Polo', 'g'], ['chemise_ouverte', 'Chemise ouverte', 'g'], ['blouson', 'Blouson', 'g'], ['sweat', 'Sweat'], ['gilet', 'Gilet et chemise', 'g'],
    ['blouse', 'Blouse', 'f'], ['cardigan', 'Cardigan', 'f'], ['robe_ete', 'Robe d\'été', 'f'], ['robe_longue', 'Robe longue', 'f'], ['crop', 'Top court', 'f']); tag(LK.top, 'f', ['robe']);
  LK.bottom.push(['jean', 'Jean'], ['chino', 'Chino', 'g'], ['jogging', 'Jogging'], ['cargo', 'Short cargo', 'g'], ['jupe_plissee', 'Jupe plissée', 'f'], ['legging', 'Legging', 'f']); tag(LK.bottom, 'f', ['jupe', 'jupe_longue']);
  LK.shoe.push(['derbies', 'Chaussures de ville']); tag(LK.shoe, 'f', ['ballerines']);
  { const odl = G.defaultLook; G.defaultLook = () => Object.assign(odl(), { body: 'normal', beard: 'aucune' }); }
  // ---------- proportions (pivots) ----------
  const HIP = .64, SH = 1.03, NECK = 1.1, HX = .066, SX = .132, UA = .22, FA = .2, TH = .29;
  G.HUMAN = { height: 1.33, hip: HIP, shoulder: SH, neck: NECK };
  G.on('init', () => Object.assign(G.CH, { eye: 1.2, eyeSit: .92, eyeSwim: .85, mouse: 1.28, vil: 1.08 }));
  // tête : ellipsoïde (rayons), centre au-dessus du pivot du cou
  const HRX = .086, HRY = .1, HRZ = .094, HC = new THREE.Vector3(0, .1, .004);
  function headPt(x, y, z, k = 1) { // point de la sphère unité → point de la tête (mâchoire affinée, menton, crâne arrondi)
    let px = x * HRX * k, py = y * HRY * k, pz = z * HRZ * k;
    if (y < .15) { const t = (.15 - y) / 1.15; px *= 1 - .36 * t * t; pz *= 1 - .14 * t * t; if (z > 0) pz += .014 * t * t * z * k; py -= .008 * t; }
    if (z < 0 && y > -.3) pz *= 1 + .07 * (1 - Math.abs(y));
    return [px + HC.x, py + HC.y, pz + HC.z];
  }
  function headGeo(k, ps, pl, ts, tl, ws, hs) { const g = new THREE.SphereGeometry(1, ws, hs, ps, pl, ts, tl), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const q = headPt(p.getX(i), p.getY(i), p.getZ(i), k); p.setXYZ(i, q[0], q[1], q[2]); } g.computeVertexNormals(); return g; }
  const dirAt = (th, ph) => [-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)];
  const hp = (th, ph, k) => { const d = dirAt(th, ph); return new THREE.Vector3(...headPt(d[0], d[1], d[2], k)); };
  // ---------- géométries ----------
  // surface lisse passant par des anneaux elliptiques : [y, rx, rz, dz]
  function loft(b, rings, col, o = {}) {
    const n = o.seg || 18, pos = [], idx = [];
    for (const [y, rx, rz, dz = 0] of rings) for (let j = 0; j < n; j++) { const a = j / n * TAU; pos.push(Math.sin(a) * rx, y, Math.cos(a) * rz + dz); }
    const dn = rings[rings.length - 1][0] < rings[0][0], tri = (a, q, c) => dn ? idx.push(a, c, q) : idx.push(a, q, c); // anneaux qui descendent : on retourne les faces
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * n + j, q = i * n + (j + 1) % n; tri(a, q, a + n); tri(q, q + n, a + n); }
    if (o.capB != null) { const ci = pos.length / 3, r0 = rings[0]; pos.push(0, r0[0] - (dn ? -o.capB : o.capB), r0[3] || 0); for (let j = 0; j < n; j++) tri(ci, (j + 1) % n, j); }
    if (o.capT != null) { const ci = pos.length / 3, rl = rings[rings.length - 1], bs = (rings.length - 1) * n; pos.push(0, rl[0] + (dn ? -o.capT : o.capT), rl[3] || 0); for (let j = 0; j < n; j++) tri(ci, bs + j, bs + (j + 1) % n); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, col, b.M(o.x || 0, o.y || 0, o.z || 0, o.rx || 0, o.ry || 0, o.rz || 0), 0, true);
  }
  // mèche : tube effilé et aplati le long d'une courbe (Bézier ou Catmull-Rom)
  const OUT = new THREE.Vector3(), TB = new THREE.Vector3();
  function strand(b, col, pts, r0, r1 = .002, flat = .5, segs = 8, sides = 6) {
    const cv = pts.length === 3 ? new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2]) : new THREE.CatmullRomCurve3(pts), pos = [], idx = [];
    for (let i = 0; i <= segs; i++) { const t = i / segs, P = cv.getPoint(t), T = cv.getTangent(t).normalize();
      OUT.copy(P).sub(HC); OUT.addScaledVector(T, -OUT.dot(T)); if (OUT.lengthSq() < 1e-8) OUT.set(0, 0, 1); OUT.normalize(); TB.crossVectors(T, OUT).normalize();
      const r = r1 + (r0 - r1) * Math.pow(1 - t, .8);
      for (let j = 0; j < sides; j++) { const a = j / sides * TAU, ca = Math.cos(a) * flat * r, sa = Math.sin(a) * r; pos.push(P.x + OUT.x * ca + TB.x * sa, P.y + OUT.y * ca + TB.y * sa, P.z + OUT.z * ca + TB.z * sa); } }
    for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, q = i * sides + (j + 1) % sides; idx.push(a, q, a + sides, q, q + sides, a + sides); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); b.add(g, col, b.M(), 0, true);
  }
  // calotte de cheveux suivant la forme du crâne, coupée à la ligne d'implantation
  function hairCap(b, col, k, front = .95, side = 1.6, back = 2.2) {
    const ws = 34, hs = 24, pos = [], idx = [], keep = [];
    const hl = ph => { const f = (Math.sin(ph) + 1) / 2; return f > .5 ? side + (front - side) * Math.pow((f - .5) * 2, 1.3) : back + (side - back) * Math.pow(f * 2, .9); };
    for (let i = 0; i <= hs; i++) { const th = i / hs * PI; for (let j = 0; j <= ws; j++) { const ph = j / ws * TAU, d = dirAt(th, ph); pos.push(...headPt(d[0], d[1], d[2], k)); keep.push(th <= hl(ph) + .05); } }
    const W = ws + 1; for (let i = 0; i < hs; i++) for (let j = 0; j < ws; j++) { const a = i * W + j + 1, bq = i * W + j, c = (i + 1) * W + j, d = (i + 1) * W + j + 1; if (keep[a] && keep[bq] && keep[c] && keep[d]) idx.push(a, bq, d, bq, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); b.add(g, col, b.M(), 0, true);
    return hl;
  }
  // ---------- visage (texture 256 × 256 posée sur l'avant de la tête) ----------
  const FPS = PI / 2 - .95, FPL = 1.9, FTS = .75, FTL = 2.0; // zone couverte : φ (gauche → droite), θ (front → menton)
  const fx = ph => (ph - FPS) / FPL * 256, fy = th => (th - FTS) / FTL * 256;
  const EY = fy(Math.acos(-.02)), EX = 41, BY = fy(Math.acos(.27)), NY = fy(Math.acos(-.3)), MY = fy(Math.acos(-.52)), CY = fy(Math.acos(-.22));
  function eye(x, cx, cy, s, o, ex) { // s = −1 : œil de gauche à l'écran, +1 : de droite
    const k = o.eyeSize === 'petits' ? .86 : o.eyeSize === 'grands' ? 1.14 : 1, w = 26 * k, h = 19 * k, ink = '#24150f', col = o.eyeCol != null ? o.eyeCol : 0x3a2a1a, st = o.eyes || 'rond', male = st === 'fins' || st === 'percants' || st === 'serieux' || st === 'calmes';
    x.lineCap = 'round'; x.lineJoin = 'round';
    const lash = (lw = 4.2) => { x.strokeStyle = ink; x.lineWidth = lw; };
    if (ex === 'blink' || (ex === 'wink' && s > 0)) { lash(4); x.beginPath(); x.moveTo(cx - w * .95, cy + 1); x.quadraticCurveTo(cx, cy + h * .62, cx + w * .95, cy + 1); x.stroke(); x.lineWidth = 2.6; x.beginPath(); x.moveTo(cx + s * w * .9, cy + 1); x.lineTo(cx + s * w * 1.18, cy - 3); x.stroke(); return; }
    if (ex === 'happy') { lash(4.4); x.beginPath(); x.moveTo(cx - w * .9, cy + h * .35); x.quadraticCurveTo(cx, cy - h * .75, cx + w * .9, cy + h * .35); x.stroke(); return; }
    const sq = ex === 'surprised' ? 1.15 : 1, sleepy = ex === 'sleepy' || st === 'endormis', sad = ex === 'sad';
    let top = -h * sq * (sleepy ? .35 : st === 'doux' ? .82 : 1) * (male ? (st === 'serieux' ? .58 : st === 'calmes' ? .66 : st === 'fins' ? .7 : .78) : 1), bot = h * .78 * sq * (male ? .82 : 1); const ic = cx - s * w, oc = cx + s * w; // coin intérieur / extérieur
    const shape = () => { x.beginPath(); x.moveTo(ic, cy + 1.5 + (sad ? -3 : 0)); x.bezierCurveTo(ic + s * w * .25, cy + top * (sad ? .7 : 1.05), cx + s * w * .35, cy + top * 1.08, oc, cy + top * .18 - (st === 'chat' ? 3 : st === 'percants' ? 5 : 1));
      x.bezierCurveTo(oc - s * w * .1, cy + bot * .7, cx + s * w * .2, cy + bot, cx - s * w * .45, cy + bot * .88); x.quadraticCurveTo(ic + s * 2, cy + bot * .55, ic, cy + 1.5 + (sad ? -3 : 0)); x.closePath(); };
    x.save(); shape(); x.fillStyle = '#fbf8f4'; x.fill(); x.clip();
    // ombre de la paupière sur le blanc
    let g = x.createLinearGradient(0, cy + top, 0, cy + top + 8); g.addColorStop(0, 'rgba(120,80,70,.35)'); g.addColorStop(1, 'rgba(120,80,70,0)'); x.fillStyle = g; x.fillRect(cx - w * 1.2, cy + top, w * 2.4, 10);
    if (st === 'points') { x.fillStyle = ink; x.beginPath(); x.ellipse(cx, cy + 2, 5 * k, 6 * k, 0, 0, TAU); x.fill(); x.restore(); lash(3.4); x.beginPath(); x.moveTo(ic, cy + 1); x.quadraticCurveTo(cx, cy + top * 1.1, oc, cy + top * .2); x.stroke(); return; }
    const ir = w * (ex === 'surprised' ? .5 : male ? .55 : .62), iry = h * .98 * (ex === 'surprised' ? .78 : 1), iy = cy + top * .05 + 2;
    const C = C3(col), cs = hex(col), cd = '#' + C.clone().multiplyScalar(.45).getHexString(), cl = '#' + C.clone().lerp(C3(0xffffff), .35).getHexString();
    g = x.createLinearGradient(0, iy - iry, 0, iy + iry); g.addColorStop(0, cd); g.addColorStop(.42, cs); g.addColorStop(.85, cl); g.addColorStop(1, st === 'brillants' ? '#ffffff' : cl);
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, iy, ir, iry, 0, 0, TAU); x.fill();
    x.strokeStyle = cd; x.lineWidth = 1.6; x.stroke();
    // fibres de l'iris, anneau sombre au bord et ombre de la paupière (regard vivant)
    x.save(); x.beginPath(); x.ellipse(cx, iy, ir, iry, 0, 0, TAU); x.clip(); x.lineWidth = .7; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; x.strokeStyle = i % 2 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.14)'; x.beginPath(); x.moveTo(cx + Math.cos(a) * ir * .38, iy + Math.sin(a) * iry * .4); x.lineTo(cx + Math.cos(a) * ir * .95, iy + Math.sin(a) * iry * .95); x.stroke(); }
    let gl = x.createLinearGradient(0, iy - iry, 0, iy - iry * .2); gl.addColorStop(0, 'rgba(20,10,10,.45)'); gl.addColorStop(1, 'rgba(20,10,10,0)'); x.fillStyle = gl; x.fillRect(cx - ir, iy - iry, ir * 2, iry * .8); x.restore();
    x.strokeStyle = 'rgba(15,8,6,.55)'; x.lineWidth = 1.1; x.beginPath(); x.ellipse(cx, iy, ir * .98, iry * .98, 0, 0, TAU); x.stroke();
    // pupille
    x.fillStyle = ink; x.beginPath();
    if (st === 'chat') x.ellipse(cx, iy, ir * .18, iry * .72, 0, 0, TAU);
    else if (st === 'coeurs') { const hh = ir * .55; x.moveTo(cx, iy + hh * .9); x.bezierCurveTo(cx - hh * 1.6, iy - hh * .3, cx - hh * .6, iy - hh * 1.3, cx, iy - hh * .35); x.bezierCurveTo(cx + hh * .6, iy - hh * 1.3, cx + hh * 1.6, iy - hh * .3, cx, iy + hh * .9); x.fillStyle = '#e8305a'; }
    else x.ellipse(cx, iy - 1, ir * .42, iry * .5, 0, 0, TAU);
    x.fill();
    // reflets
    x.fillStyle = 'rgba(255,255,255,.95)';
    if (st === 'etoiles') { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - PI / 2, r = (i % 2 ? 2.2 : 5.6) * k; x.lineTo(cx - ir * .3 + Math.cos(a) * r, iy - iry * .35 + Math.sin(a) * r); } x.fill(); }
    else { x.beginPath(); x.ellipse(cx - ir * .32, iy - iry * .36, ir * .3, iry * .26, -.3, 0, TAU); x.fill(); }
    x.beginPath(); x.arc(cx + ir * .34, iy + iry * .34, 2.2 * k, 0, TAU); x.fill();
    if (st === 'brillants' || st === 'anime') { x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(cx + ir * .05, iy - iry * .55, 1.6 * k, 0, TAU); x.fill(); }
    x.restore();
    // trait de cils supérieur (épais vers l'extérieur), petite virgule au coin
    x.strokeStyle = ink; x.lineWidth = male ? 4.6 : 3.8; x.beginPath(); x.moveTo(ic, cy + 1.5 + (sad ? -3 : 0)); x.bezierCurveTo(ic + s * w * .25, cy + top * (sad ? .7 : 1.05), cx + s * w * .35, cy + top * 1.08, oc, cy + top * .18 - (st === 'chat' ? 3 : st === 'percants' ? 5 : 1)); x.stroke();
    if (!male) { x.lineWidth = 2.6; x.beginPath(); x.moveTo(oc - s * 2, cy + top * .2); x.lineTo(oc + s * 5, cy + top * .55 - 2); x.stroke(); }
    if (o.lashes) { x.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const t = .55 + i * .16, px = cx + s * w * (t - .2), py = cy + top * (1.02 - t * .5); x.beginPath(); x.moveTo(px, py); x.lineTo(px + s * 4, py - 4.5); x.stroke(); } }
    // paupière inférieure légère, pli de la paupière
    x.strokeStyle = 'rgba(60,35,30,.45)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(oc - s * w * .15, cy + bot * .62); x.quadraticCurveTo(cx + s * w * .2, cy + bot * 1.02, cx - s * w * .35, cy + bot * .9); x.stroke();
    if (!sleepy) { x.strokeStyle = 'rgba(90,50,40,.35)'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(cx - s * w * .4, cy + top * 1.32); x.quadraticCurveTo(cx + s * w * .3, cy + top * 1.42, oc + s * 1, cy + top * .7); x.stroke(); }
  }
  function drawFace(o, ex, hd) {
    const c = G.cv(hd ? 512 : 256, hd ? 512 : 256), x = c.getContext('2d'); if (hd) x.scale(2, 2); const cheek = o.cheek || (o.blush === false ? 'aucune' : 'rose');
    // joues
    if (cheek === 'rose') for (const s of [-1, 1]) { const gx = 128 + s * 60, g = x.createRadialGradient(gx, CY, 0, gx, CY, 20); g.addColorStop(0, 'rgba(255,120,130,.42)'); g.addColorStop(1, 'rgba(255,120,130,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(gx, CY, 22, 13, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(240,90,110,.4)'; x.lineWidth = 1.4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(gx - 8 + i * 6, CY + 4); x.lineTo(gx - 4 + i * 6, CY - 4); x.stroke(); } }
    if (cheek === 'coeurs') for (const s of [-1, 1]) { const hx = 128 + s * 60, hy = CY; x.fillStyle = 'rgba(255,90,130,.75)'; x.beginPath(); x.moveTo(hx, hy + 6); x.bezierCurveTo(hx - 10, hy, hx - 5, hy - 7, hx, hy - 2); x.bezierCurveTo(hx + 5, hy - 7, hx + 10, hy, hx, hy + 6); x.fill(); }
    if (cheek === 'etoiles') for (const s of [-1, 1]) { x.fillStyle = 'rgba(255,200,60,.85)'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - PI / 2, r = i % 2 ? 2.6 : 6.5; x.lineTo(128 + s * 60 + Math.cos(a) * r, CY + Math.sin(a) * r); } x.fill(); }
    if (o.freckles) { x.fillStyle = 'rgba(150,90,55,.55)'; for (const [dx, dy] of [[-56, -2], [-48, 3], [-62, 5], [-52, 8], [56, -2], [48, 3], [62, 5], [52, 8], [-6, -10], [6, -10]]) { x.beginPath(); x.arc(128 + dx, CY + dy, 1.5, 0, TAU); x.fill(); } }
    if (o.beard && o.beard !== 'aucune' && o.beard !== 'moustache' && o.beard !== 'favoris') { // ombre de barbe, opaque (le visage est découpé au seuil de transparence)
      const sk0 = C3(o.skin || 0xffdcc4), hc = C3(o.hairCol != null ? o.hairCol : 0x3a2a1a), r = G.rng(77), base = sk0.clone().lerp(hc, .09), dot = sk0.clone().lerp(hc, .32);
      x.fillStyle = hex(base.getHex()); x.beginPath(); x.ellipse(128, MY + 30, 68, 30, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(128, MY - 8, 21, 6, 0, 0, TAU); x.fill();
      x.fillStyle = hex(dot.getHex()); for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()), px = 128 + Math.cos(a) * d * 66, py = MY + 30 + Math.sin(a) * d * 28; if (py < MY + 4) continue; x.fillRect(px, py, 1, 1); } for (let i = 0; i < 40; i++) x.fillRect(128 + (r() - .5) * 40, MY - 8 + (r() - .5) * 10, 1, 1); }
    // yeux
    for (const s of [-1, 1]) eye(x, 128 + s * EX, EY, s, o, ex);
    // sourcils
    const bw = o.brows || 'normaux';
    if (bw !== 'aucun') { x.strokeStyle = hex(C3(o.hairCol != null ? o.hairCol : 0x5a3a22).multiplyScalar(.62).getHex()); x.lineCap = 'round'; x.lineWidth = bw === 'epais' ? 5 : bw === 'fins' ? 2 : 3.2;
      for (const s of [-1, 1]) { const cx = 128 + s * EX, t = ex === 'sad' ? 5 : bw === 'fronces' ? -4 : 0, up = (ex === 'surprised' ? -6 : 0) + (bw === 'joyeux' ? -3 : 0);
        x.beginPath(); x.moveTo(cx - s * 19, BY + 3 + up - t * .8); x.quadraticCurveTo(cx + s * 2, BY - 5 + up - (bw === 'joyeux' ? 3 : 0), cx + s * 22, BY + 4 + up + t * .4); x.stroke(); } }
    // nez : petite ombre et reflet, à la façon des animés
    x.strokeStyle = 'rgba(150,80,60,.5)'; x.lineWidth = 1.8; x.lineCap = 'round'; x.beginPath(); x.moveTo(131, NY - 9); x.quadraticCurveTo(133, NY - 2, 129, NY + 1); x.stroke();
    if (o.nose === 'rond' || o.nose === 'bouton') { x.fillStyle = 'rgba(200,110,90,.28)'; x.beginPath(); x.ellipse(128, NY, o.nose === 'rond' ? 6 : 4, 3.5, 0, 0, TAU); x.fill(); }
    if (o.nose === 'point') { x.fillStyle = 'rgba(120,60,40,.55)'; x.beginPath(); x.arc(128, NY, 1.6, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(126.5, NY - 5, 1.4, 0, TAU); x.fill();
    // bouche
    const m = ex === 'happy' ? 'ouvert' : ex === 'surprised' ? 'o' : ex === 'sad' ? 'triste' : (o.mouth || 'sourire'), cx = 128, cy = MY;
    x.strokeStyle = '#8a3a30'; x.lineWidth = 2.4; x.lineCap = 'round';
    if (m === 'chat') { x.beginPath(); x.arc(cx - 4, cy - 1, 4, .15, PI - .15); x.arc(cx + 4, cy - 1, 4, .15, PI - .15); x.stroke(); }
    else if (m === 'ouvert') { x.fillStyle = '#9b3238'; x.beginPath(); x.moveTo(cx - 9, cy - 2); x.quadraticCurveTo(cx, cy - 4, cx + 9, cy - 2); x.quadraticCurveTo(cx + 4, cy + 11, cx, cy + 11); x.quadraticCurveTo(cx - 4, cy + 11, cx - 9, cy - 2); x.fill(); x.fillStyle = '#ff8f9a'; x.beginPath(); x.ellipse(cx, cy + 7, 4.5, 3, 0, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(cx - 6, cy - 2.5, 12, 2.2); }
    else if (m === 'o') { x.fillStyle = '#9b3238'; x.beginPath(); x.ellipse(cx, cy + 2, 4, 5, 0, 0, TAU); x.fill(); }
    else if (m === 'petit') { x.beginPath(); x.moveTo(cx - 4, cy); x.quadraticCurveTo(cx, cy + 2.4, cx + 4, cy); x.stroke(); }
    else if (m === 'triste') { x.beginPath(); x.moveTo(cx - 7, cy + 3); x.quadraticCurveTo(cx, cy - 3, cx + 7, cy + 3); x.stroke(); }
    else if (m === 'bisou') { x.lineWidth = 2.2; x.beginPath(); x.arc(cx + 1, cy - 2.5, 2.8, -1.4, 1.4); x.stroke(); x.beginPath(); x.arc(cx + 1, cy + 2.5, 2.8, -1.4, 1.4); x.stroke(); }
    else { x.beginPath(); x.moveTo(cx - 8, cy - 1); x.quadraticCurveTo(cx, cy + 5, cx + 8, cy - 1); x.stroke();
      if (m === 'langue') { x.fillStyle = '#ff8f9a'; x.beginPath(); x.ellipse(cx + 2, cy + 4, 3, 2.6, 0, 0, TAU); x.fill(); }
      if (m === 'dent') { x.fillStyle = '#ffffff'; x.fillRect(cx - 5, cy + 1, 3.6, 3); } }
    return c;
  }
  // ---------- coiffures ----------
  const BIG = new Set(['herisse', 'crete', 'afro', 'chignon', 'macarons', 'queue_haute', 'decoiffe', 'banane', 'chignon_h', 'ebouriffe', 'dreads', 'longues_boucles', 'tresse_couronne']);
  function hair(b, st, col, hatOn, hd, skinC) {
    const B2 = hd || b; // mèches qui bougent (os des cheveux)
    if (st === 'chauve') { b.S(S().hair); for (const s of [-1, 1]) b.sph(.035, col, s * .078, .07, -.04, .5, 1.1, 1.3); b.S(null); return; } // couronne de cheveux des messieurs chauves
    if (hatOn && BIG.has(st)) st = 'court';
    b.S(S().hair); b.jit(.05);
    const vol = st === 'afro' ? 1.32 : st === 'boucles' ? 1.12 : st === 'decoiffe' || st === 'herisse' ? 1.08 : 1.055;
    const front = st === 'crete' ? .3 : st === 'garconne' || st === 'court' ? 1.0 : .95;
    const CAPS = { brosse: [1.025, 1.05, 1.72, 2.2], degrade: [1.07, .95, 1.2, 1.45], banane: [1.07, .98, 1.2, 1.45], raie: [1.06, .98, 1.65, 2.2], mulet: [1.05, 1.0, 1.6, 2.25], chignon_h: [1.035, .92, 1.62, 2.1],
      long_h: [1.055, .95, 1.62, 2.25], boucles_h: [1.09, 1.0, 1.6, 2.15], queue_basse: [1.055, .95, 1.62, 2.25], tresse_cote: [1.055, .95, 1.62, 2.25],
      rase: [1.012, 1.0, 1.72, 2.15], bol: [1.07, 1.0, 1.75, 2.15], plaque: [1.035, .88, 1.68, 2.2], pixie: [1.05, .98, 1.65, 2.1], dreads: [1.06, .95, 1.62, 2.2], ebouriffe: [1.06, .98, 1.65, 2.15] }, cp = CAPS[st];
    if (cp) hairCap(b, col, cp[0], cp[1], cp[2], cp[3]); else hairCap(b, col, vol, front, st === 'crete' ? .3 : 1.62, st === 'crete' ? .4 : 2.25);
    if (st === 'degrade' || st === 'banane') hairCap(b, C3(col).lerp(C3(skinC || 0xffdcc4), .42).getHex(), 1.012, 1.0, 1.85, 2.25); // côtés rasés en dégradé
    const lk = (th0, ph0, th1, ph1, len, r = .02, bulge = 1.13, k0 = 1.04, flat = .5, twist = 0, bb = b) => { // mèche du crâne vers le bas
      const p0 = hp(th0, ph0, k0), p2 = hp(th1, ph1, 1.06); p2.y -= len; const p1 = hp((th0 + th1) / 2, (ph0 + ph1) / 2 + twist, bulge); p1.y -= len * .25; strand(bb, col, [p0, p1, p2], r, .002, flat); };
    const fringe = (n, len, spread = .62, blunt = false) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1) * 2 - 1, ph = PI / 2 + t * spread, l = blunt ? len : len * (.8 + .35 * ((i * 7) % 3) / 2);
        lk(.62 + Math.abs(t) * .22, ph, 1.12 + Math.abs(t) * .1 + (blunt ? 0 : .04), ph + t * .12, l, .024 + (blunt ? .004 : 0), 1.16, 1.05, .42); } };
    const sides = (len, thEnd = 2.1) => { for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = PI / 2 + s * (.98 + i * .22); lk(1.0, ph, thEnd, ph + s * .08, len * (1 - i * .15), .026, 1.12, 1.04, .5, 0, len >= .07 ? B2 : b); } };
    const back = (n, len, spread = 1.55, r = .032, curl = 0) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1) * 2 - 1, ph = -PI / 2 + t * spread;
        const p0 = hp(1.2, ph, 1.04), p1 = hp(2.0, ph, 1.22), p2 = hp(2.35, ph, 1.12); p2.y -= len; p1.y -= len * .35; p1.z -= curl; strand(len >= .04 ? B2 : b, col, [p0, p1, p2], r, .003, .55, 9); } };
    if (st === 'court' || st === 'garconne') { fringe(st === 'garconne' ? 6 : 5, .02, .6); sides(.005, 1.75); back(5, .0, 1.4, .03); }
    else if (st === 'decoiffe') { fringe(6, .03, .7); for (let i = 0; i < 9; i++) { const ph = i / 9 * TAU, p0 = hp(.5, ph, 1.04), p2 = hp(.9 + (i % 3) * .2, ph + .3, 1.22); strand(b, col, [p0, p0.clone().lerp(p2, .5).multiplyScalar(1.04), p2], .026); } back(5, .02, 1.5); }
    else if (st === 'herisse') { for (let i = 0; i < 12; i++) { const ph = i / 12 * TAU, th = .45 + (i % 2) * .35, p0 = hp(th, ph, 1.02), dir = p0.clone().sub(HC).normalize(), p2 = p0.clone().addScaledVector(dir, .06).add(new THREE.Vector3(0, .03, 0)); strand(b, col, [p0, p0.clone().lerp(p2, .5), p2], .028, .002, .6); } fringe(5, .015, .55); }
    else if (st === 'crete') { for (let i = 0; i < 7; i++) { const th = .25 + i * .26, p0 = hp(th, PI / 2 - .0, 1.02), p0b = hp(th, -PI / 2, 1.02); const P = i < 4 ? p0 : p0b, d = P.clone().sub(HC).normalize(); const p2 = P.clone().addScaledVector(d, .09 - Math.abs(i - 3) * .012); strand(b, col, [P, P.clone().lerp(p2, .5), p2], .028, .003, .35); } }
    else if (st === 'carre') { fringe(7, .03, .7, true); sides(.07, 2.35); back(9, .055, 1.75, .036); }
    else if (st === 'frange') { fringe(9, .035, .75, true); sides(.04, 2.2); back(8, .03, 1.6); }
    else if (st === 'meche') { const p0 = hp(.6, PI / 2 + .55, 1.05), p2 = hp(1.25, PI / 2 - .45, 1.07); p2.y -= .01; strand(b, col, [p0, hp(.85, PI / 2, 1.2), p2], .045, .003, .45, 10); fringe(3, .01, .35); sides(.01, 1.8); back(6, .01, 1.5); }
    else if (st === 'mi_long') { fringe(7, .03, .66); sides(.12, 2.3); back(10, .14, 1.8, .036); }
    else if (st === 'long' || st === 'long_lisse' || st === 'ondule') { fringe(st === 'long_lisse' ? 2 : 7, .035, st === 'long_lisse' ? .25 : .66); if (st === 'long_lisse') { for (const s of [-1, 1]) lk(.55, PI / 2 + s * .2, 1.25, PI / 2 + s * .75, .04, .03, 1.16); } sides(.3, 2.4);
      for (let i = 0; i < 12; i++) { const t = i / 11 * 2 - 1, ph = -PI / 2 + t * 1.75, p0 = hp(1.15, ph, 1.04), p1 = hp(2.05, ph, 1.24); p1.y -= .1; const p2 = hp(2.45, ph, 1.1); p2.y -= .36; p2.z -= .05;
        if (st === 'ondule') { const pa = p1.clone(), pb = p2.clone().lerp(p1, .45); pb.x += (i % 2 ? .02 : -.02); strand(B2, col, [p0, pa, pb, p2], .036, .004, .5, 14); } else strand(B2, col, [p0, p1, p2], .036, .004, .5, 10); } }
    else if (st === 'queue' || st === 'queue_haute') { fringe(6, .03, .62); sides(.08, 2.25); back(5, .0, 1.3); const hi = st === 'queue_haute', tie = hp(hi ? .95 : 1.75, -PI / 2, 1.06);
      b.S(null); b.tor(.018, .008, 0xe85d8a, tie.x, tie.y, tie.z, hi ? .9 : .3, 0, 0, 0, 14); b.S(S().hair);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, o = new THREE.Vector3(Math.cos(a) * .012, Math.sin(a) * .012, 0); const p0 = tie.clone().add(o), p1 = tie.clone().add(new THREE.Vector3(o.x * 3, hi ? .02 : -.06, -.09)), p2 = tie.clone().add(new THREE.Vector3(o.x * 2, hi ? -.26 : -.3, -.06 - (hi ? .05 : 0))); strand(B2, col, [p0, p1, p2], .028, .003, .7, 10); } }
    else if (st === 'couettes') { fringe(6, .03, .62); sides(.05, 2.2); back(6, .02, 1.5); for (const s of [-1, 1]) { const tie = hp(1.6, PI / 2 + s * 1.75, 1.08); b.S(null); b.sph(.016, 0xff6f9a, tie.x, tie.y, tie.z); b.S(S().hair);
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, o = new THREE.Vector3(0, Math.cos(a) * .01, Math.sin(a) * .01); strand(B2, col, [tie.clone().add(o), tie.clone().add(new THREE.Vector3(s * .06, -.04, -.02)).add(o), tie.clone().add(new THREE.Vector3(s * .05, -.24, -.03))], .026, .003, .7, 9); } } }
    else if (st === 'tresses') { fringe(6, .03, .62); sides(.02, 2.0); back(7, .03, 1.6); for (const s of [-1, 1]) { const st0 = hp(1.95, PI / 2 + s * 1.95, 1.06); for (let i = 0; i < 8; i++) B2.sph(.022 - i * .0012, col, st0.x + s * .005 * i, st0.y - .03 - i * .033, st0.z + .02 + i * .005, 1, 1.15, .9); b.S(null); b.tor(.012, .006, 0xff6f9a, st0.x + s * .04, st0.y - .3, st0.z + .06, PI / 2, 0, 0, 0, 12); b.S(S().hair); } }
    else if (st === 'chignon') { fringe(5, .02, .6); sides(.05, 2.1); back(6, .0, 1.4); const t = hp(.45, -PI / 2, 1.1); b.sph(.045, col, t.x, t.y + .02, t.z - .01, 1, .9, 1); b.S(null); b.tor(.04, .009, 0xffc23d, t.x, t.y, t.z, PI / 2 - .4, 0, 0, 0, 16); b.S(S().hair); }
    else if (st === 'macarons') { fringe(6, .03, .62); back(6, .02, 1.5); for (const s of [-1, 1]) { const t = hp(1.5, PI / 2 + s * 1.65, 1.1); b.add(new THREE.TorusGeometry(.03, .016, 8, 18), col, b.M(t.x + s * .01, t.y, t.z, 0, s * 1.3, 0), 0, true); b.sph(.022, col, t.x + s * .015, t.y, t.z); } }
    else if (st === 'brosse') { for (let i = 0; i < 14; i++) { const ph = PI / 2 + (i / 13 - .5) * 1.1; lk(.78, ph, .95, ph, 0, .012, 1.07, 1.04, .45); } }
    else if (st === 'degrade') { for (let i = 0; i < 9; i++) { const ph = PI / 2 + (i / 8 - .5) * 1.0; strand(b, col, [hp(.88, ph, 1.05), hp(.55, ph, 1.14), hp(.22, PI / 2 + (ph - PI / 2) * .6, 1.09)], .028, .004, .45, 8); } }
    else if (st === 'banane') { for (let i = 0; i < 9; i++) { const t = i / 8 - .5, ph = PI / 2 + t * 1.0; strand(b, col, [hp(.94, ph, 1.05), hp(.66, ph, 1.42 - Math.abs(t) * .3), hp(.3, ph - t * .3, 1.2), hp(.05, ph * .2, 1.1)], .042, .006, .55, 12); } }
    else if (st === 'raie') { const pr = PI / 2 + .42; for (let i = 0; i < 10; i++) { const t = i / 9; strand(b, col, [hp(.28 + t * .55, pr, 1.05), hp(.55 + t * .45, pr - .5, 1.12), hp(.85 + t * .45, pr - 1.05 - t * .2, 1.06)], .03, .004, .45, 9); }
      for (let i = 0; i < 4; i++) { const t = i / 3; strand(b, col, [hp(.35 + t * .5, pr, 1.05), hp(.6 + t * .45, pr + .3, 1.1), hp(.95 + t * .4, pr + .55, 1.06)], .028, .004, .45, 8); } sides(.005, 1.7); back(5, 0, 1.4, .03); }
    else if (st === 'mulet') { fringe(5, .015, .55); sides(.01, 1.75); back(9, .17, 1.4, .034, .02); }
    else if (st === 'chignon_h') { for (let i = 0; i < 10; i++) { const ph = PI / 2 + (i / 9 - .5) * 1.4; strand(b, col, [hp(.88, ph, 1.04), hp(.35, ph, 1.1), hp(.62, -PI / 2 + (ph - PI / 2) * .4, 1.07)], .026, .004, .45, 9); }
      const t = hp(.62, -PI / 2, 1.1); b.sph(.038, col, t.x, t.y + .01, t.z - .015, 1, .85, 1); b.S(null); b.tor(.03, .007, dark(col, .6), t.x, t.y - .005, t.z, PI / 2 - .6, 0, 0, 0, 14); b.S(S().hair); }
    else if (st === 'long_h') { for (const s2 of [-1, 1]) for (let i = 0; i < 5; i++) { const t = i / 4, ph = PI / 2 + s2 * (1.05 + t * .45), p2 = hp(2.1, ph + s2 * .1, 1.12); p2.y -= .1; strand(B2, col, [hp(.18 + t * .08, PI / 2 + s2 * (.05 + t * .5), 1.05), hp(1.1, ph, 1.2), p2], .032, .004, .5, 10); } back(10, .16, 1.75, .035); }
    else if (st === 'boucles_h') { for (let i = 0; i < 34; i++) { const th = .25 + (i % 6) * .22, ph = i * 2.39, p = hp(th, ph, 1.12); if (th > 1.3 && Math.sin(ph) > .45) continue; b.sph(.02, col, p.x, p.y, p.z, 1, 1, 1, 0, 9, 7); } }
    else if (st === 'queue_basse') { fringe(5, .03, .6); sides(.06, 2.2); back(5, 0, 1.3); const tie = hp(2.0, -PI / 2, 1.06); b.S(null); b.tor(.02, .007, 0x3a2a1a, tie.x, tie.y, tie.z, .2, 0, 0, 0, 14); b.S(S().hair);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, o = new THREE.Vector3(Math.cos(a) * .012, Math.sin(a) * .012, 0); strand(B2, col, [tie.clone().add(o), tie.clone().add(new THREE.Vector3(o.x * 2.5, -.08, -.05)), tie.clone().add(new THREE.Vector3(o.x * 1.6, -.32, -.03))], .03, .004, .7, 10); } }
    else if (st === 'tresse_cote') { fringe(6, .03, .62); sides(.04, 2.1); back(6, .02, 1.5); const st0 = hp(1.9, PI / 2 + 1.7, 1.08); for (let i = 0; i < 11; i++) B2.sph(.024 - i * .0012, col, st0.x + .012 * Math.sin(i), st0.y - .02 - i * .032, st0.z + .045 + i * .006, 1, 1.15, .9);
      B2.S(null); B2.tor(.013, .006, 0xe8434a, st0.x, st0.y - .37, st0.z + .11, PI / 2, 0, 0, 0, 12); B2.S(S().hair); }
    else if (st === 'afro') { for (let i = 0; i < 26; i++) { const th = .2 + (i % 5) * .38, ph = i * 2.4, p = hp(th, ph, 1.3); b.sph(.038, col, p.x, p.y, p.z, 1, 1, 1, 0, 12, 9); } }
    else if (st === 'boucles') { fringe(5, .02, .6); for (let i = 0; i < 30; i++) { const th = .5 + (i % 6) * .3, ph = i * 2.39 + (th > 1.6 ? 0 : 0), p = hp(th, ph, 1.13); if (th > 1.5 && Math.sin(ph) > .5) continue; b.sph(.024, col, p.x, p.y, p.z, 1, 1, 1, 0, 10, 8); } back(7, .06, 1.6, .03, .02); }
    // ---------- 14 coiffures de plus ----------
    else if (st === 'rase') { } // tondu ras : la calotte seule, au plus près du crâne
    else if (st === 'bol') { fringe(10, .034, .85, true); sides(.04, 2.05); back(9, .03, 1.75, .034); }
    else if (st === 'plaque') { for (let i = 0; i < 11; i++) { const ph = PI / 2 + (i / 10 - .5) * 1.5; strand(b, col, [hp(.95, ph, 1.04), hp(.35, ph, 1.1), hp(1.45, -PI / 2 + (ph - PI / 2) * .55, 1.08)], .028, .006, .42, 10); } back(7, .03, 1.5, .03); }
    else if (st === 'ebouriffe') { fringe(5, .02, .6); for (let i = 0; i < 16; i++) { const ph = i * 2.4, th = .2 + (i % 4) * .22, p0 = hp(th, ph, 1.03), d = p0.clone().sub(HC).normalize(), p2 = p0.clone().addScaledVector(d, .04 + (i % 3) * .012).add(new THREE.Vector3(Math.sin(i) * .015, .012, Math.cos(i * 1.7) * .015));
      strand(b, col, [p0, p0.clone().lerp(p2, .5).addScaledVector(d, .01), p2], .022, .002, .55); } sides(.01, 1.8); back(5, .02, 1.4); }
    else if (st === 'ondule_h') { fringe(6, .03, .66); sides(.07, 2.2); for (let i = 0; i < 9; i++) { const t = i / 8 * 2 - 1, ph = -PI / 2 + t * 1.6, p0 = hp(1.2, ph, 1.05), p1 = hp(1.9, ph + .1, 1.2), p2 = hp(2.2, ph - .08, 1.15); p2.y -= .06;
        strand(B2, col, [p0, p1, p1.clone().lerp(p2, .5).add(new THREE.Vector3(i % 2 ? .012 : -.012, 0, .01)), p2], .032, .004, .5, 12); }
      for (let i = 0; i < 6; i++) { const ph = PI / 2 + (i / 5 - .5) * 1.2; strand(b, col, [hp(.85, ph, 1.05), hp(.45, ph + .2, 1.16), hp(.2, ph + .5, 1.1)], .03, .005, .45, 9); } }
    else if (st === 'dreads') { fringe(4, .02, .5); for (let i = 0; i < 24; i++) { const ph = i / 24 * TAU, th = .85 + (i % 3) * .25; if (Math.sin(ph) > .55 && th < 1.4) continue; const p0 = hp(th, ph, 1.05), p1 = hp(th + .55, ph, 1.2), p2 = hp(th + .8, ph, 1.15); p2.y -= .14 + (i % 4) * .03; p1.y -= .03;
      strand(B2, col, [p0, p1, p2], .019, .014, .95, 9, 5); } }
    else if (st === 'pixie') { for (let i = 0; i < 8; i++) { const t = i / 7; strand(b, col, [hp(.2 + t * .3, PI / 2 + 1.2 - t * .4, 1.06), hp(.55 + t * .2, PI / 2 + .3, 1.16), hp(1.0 + t * .12, PI / 2 - .35 - t * .25, 1.07)], .028, .004, .45, 9); } sides(.02, 1.85); back(6, .015, 1.5, .03); }
    else if (st === 'carre_ondule') { fringe(7, .03, .7); sides(.09, 2.35); for (let i = 0; i < 10; i++) { const t = i / 9 * 2 - 1, ph = -PI / 2 + t * 1.75, p0 = hp(1.2, ph, 1.04), p1 = hp(1.95, ph, 1.22), p2 = hp(2.3, ph, 1.12); p2.y -= .07; const pm = p1.clone().lerp(p2, .5); pm.x += i % 2 ? .014 : -.014;
      strand(B2, col, [p0, p1, pm, p2], .036, .006, .5, 12); } }
    else if (st === 'longues_boucles') { fringe(6, .03, .62); sides(.08, 2.2); for (let i = 0; i < 11; i++) { const t = i / 10 * 2 - 1, ph = -PI / 2 + t * 1.9, s0 = hp(1.7, ph, 1.12);
      for (let k = 0; k < 8; k++) { const a = k * 1.3 + i; B2.sph(.026 - k * .0012, col, s0.x + Math.cos(a) * .012 + s0.x * k * .03, s0.y - k * .036, s0.z + Math.sin(a) * .012 + s0.z * k * .02, 1, 1, 1, 0, 9, 7); } } }
    else if (st === 'chignon_bas') { fringe(5, .025, .6); sides(.05, 2.15); back(7, 0, 1.45, .032); const t = hp(2.0, -PI / 2, 1.14); b.sph(.05, col, t.x, t.y - .01, t.z - .02, 1.1, .85, .9);
      for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(.03 + k * .006, .01, 6, 16, PI * 1.4), col, b.M(t.x, t.y - .01, t.z - .035, 0, 0, k * 1.6), 0, true); }
    else if (st === 'demi_queue') { fringe(6, .033, .66); sides(.28, 2.4); for (let i = 0; i < 10; i++) { const t = i / 9 * 2 - 1, ph = -PI / 2 + t * 1.7, p0 = hp(1.2, ph, 1.04), p1 = hp(2.05, ph, 1.24); p1.y -= .1; const p2 = hp(2.45, ph, 1.1); p2.y -= .32; p2.z -= .05; strand(B2, col, [p0, p1, p2], .035, .004, .5, 10); }
      const tie = hp(.95, -PI / 2, 1.1); b.S(null); b.tor(.016, .007, 0x5a7ae8, tie.x, tie.y, tie.z, .8, 0, 0, 0, 12); b.S(S().hair);
      for (let i = 0; i < 5; i++) { const o = new THREE.Vector3((i - 2) * .008, 0, 0); strand(B2, col, [tie.clone().add(o), tie.clone().add(new THREE.Vector3(o.x * 2, -.03, -.06)), tie.clone().add(new THREE.Vector3(o.x, -.14, -.07))], .022, .003, .6, 9); } }
    else if (st === 'tresse_couronne') { fringe(5, .025, .55); sides(.03, 1.95); back(6, .01, 1.5); for (let i = 0; i <= 20; i++) { const ph = PI / 2 + 1.25 + i / 20 * (TAU - 2.5), p = hp(.95 - Math.sin(i / 20 * PI) * .25, ph, 1.13); b.sph(.024, col, p.x, p.y, p.z, 1.1, .85, 1, 0, 9, 7); } }
    else if (st === 'queue_tressee') { fringe(6, .03, .62); sides(.06, 2.2); back(5, 0, 1.3); const tie = hp(1.55, -PI / 2, 1.08); b.S(null); b.tor(.018, .008, 0xe8434a, tie.x, tie.y, tie.z, .4, 0, 0, 0, 12); b.S(S().hair);
      for (let i = 0; i < 12; i++) B2.sph(.024 - i * .0011, col, tie.x + (i % 2 ? .01 : -.01), tie.y - .03 - i * .03, tie.z - .045 - i * .004, 1, 1.15, .9, 0, 9, 7); B2.S(null); B2.tor(.011, .005, 0xe8434a, tie.x, tie.y - .39, tie.z - .09, PI / 2, 0, 0, 0, 10); B2.S(S().hair); }
    else if (st === 'frange_rideau') { for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const t = i / 3; strand(b, col, [hp(.35 + t * .1, PI / 2 + s * .08, 1.06), hp(.95, PI / 2 + s * (.3 + t * .25), 1.2), hp(1.5, PI / 2 + s * (.75 + t * .2), 1.1)], .03, .004, .45, 10); }
      sides(.3, 2.4); for (let i = 0; i < 12; i++) { const t = i / 11 * 2 - 1, ph = -PI / 2 + t * 1.75, p0 = hp(1.15, ph, 1.04), p1 = hp(2.05, ph, 1.24); p1.y -= .1; const p2 = hp(2.45, ph, 1.1); p2.y -= .36; p2.z -= .05; strand(B2, col, [p0, p1, p2], .036, .004, .5, 10); } }
    b.jit(0); b.S(null);
  }
  // ---------- chapeaux ----------
  function hat(b, st, col, hairCol) {
    const T = hp(0, 0, 1.12); // sommet du crâne
    const cap = (k, front, sideTh, backTh, c, rx = 0) => { b.S(S().fabric); hairCap(b, c, k, front, sideTh, backTh); b.S(null); };
    if (st === 'bonnet') { cap(1.12, .85, 1.25, 1.55, col); const r = hp(1.2, 0, 1.13); b.add(new THREE.TorusGeometry(1, .14, 8, 28), 0xffffff, b.M(0, HC.y + .03, HC.z - .006, PI / 2 - .32, 0, 0, HRX * 1.1, HRZ * 1.13, .12), 0, true); b.sph(.032, 0xffffff, 0, T.y + .03, T.z - .03); }
    else if (st === 'casquette') { cap(1.1, .95, 1.3, 1.6, col); b.add(new THREE.CylinderGeometry(.08, .08, .01, 18, 1, false, -PI / 2, PI), dark(col, .9), b.M(0, HC.y + .052, HC.z + HRZ * .82, .2, 0, 0, 1, 1, 1.15), 0, true); b.sph(.012, col, 0, T.y + .003, T.z); }
    else if (st === 'capitaine') { cap(1.11, .95, 1.25, 1.55, 0xf7f5ee); b.cyl(.094, .088, .05, 22, 0x1d2333, 0, HC.y + .05, HC.z, 0, 0, 0, 0, true); b.add(new THREE.CylinderGeometry(.075, .075, .01, 18, 1, false, -PI / 2, PI), 0x14161c, b.M(0, HC.y + .032, HC.z + HRZ * .8, .2, 0, 0, 1, 1, 1.1), 0, true); b.sph(.014, 0xd9b04a, 0, HC.y + .055, HC.z + HRZ * 1.05, 1.4, 1, .5); }
    else if (st === 'beret') { b.S(S().fabric); b.sph(.105, col, -.015, T.y - .012, T.z - .005, 1.05, .32, 1.02); b.cyl(.004, .006, .018, 6, col, -.01, T.y + .02, T.z); b.S(null); }
    else if (st === 'chapeau') { b.cyl(.2, .2, .008, 30, 0xe6c879, 0, HC.y + .075, HC.z, -.06, 0, 0, 0, true); b.cyl(.1, .105, .085, 24, 0xe6c879, 0, HC.y + .115, HC.z - .005, -.06, 0, 0, 0, true); b.cyl(.106, .106, .022, 24, col, 0, HC.y + .088, HC.z - .004, -.06, 0, 0, 0, true); }
    else if (st === 'haut_forme') { b.cyl(.15, .15, .008, 30, 0x1d1d22, 0, HC.y + .085, HC.z, 0, 0, 0, 0, true); b.cyl(.085, .09, .17, 24, 0x1d1d22, 0, HC.y + .17, HC.z, 0, 0, 0, 0, true); b.cyl(.091, .091, .025, 24, col, 0, HC.y + .1, HC.z, 0, 0, 0, 0, true); }
    else if (st === 'sorciere') { b.cyl(.2, .2, .008, 30, col, 0, HC.y + .08, HC.z, -.05, 0, 0, 0, true); b.cone(.095, .28, 20, col, 0, HC.y + .22, HC.z - .03, -.28, 0, 0); b.cyl(.098, .098, .025, 24, 0xd9b84a, 0, HC.y + .095, HC.z, -.05, 0, 0, 0, true); }
    else if (st === 'bandana') { cap(1.1, .9, 1.4, 1.7, col); const k = hp(1.45, -PI / 2, 1.1); b.cone(.02, .05, 6, col, k.x, k.y - .02, k.z - .01, PI + .3, 0, 0); for (let i = 0; i < 6; i++) { const p = hp(.6 + (i % 3) * .3, i * 1.05, 1.11); b.sph(.006, 0xffffff, p.x, p.y, p.z); } }
    else if (st === 'casque') { b.add(new THREE.TorusGeometry(.105, .008, 6, 24, PI), col, b.M(0, HC.y + .01, HC.z, -.1, 0, 0, 1, 1.12, 1), 0, true); for (const s of [-1, 1]) { b.cyl(.032, .032, .022, 16, col, s * .095, HC.y, HC.z, 0, 0, PI / 2); b.cyl(.026, .026, .024, 16, 0x2a2d33, s * .1, HC.y, HC.z, 0, 0, PI / 2); } }
    else if (st === 'noeud') { const p = hp(.6, PI / 2 + .9, 1.1); b.S(S().fabric); b.cone(.02, .04, 4, col, p.x - .02, p.y, p.z, 0, 0, PI / 2 + .3); b.cone(.02, .04, 4, col, p.x + .02, p.y, p.z, 0, 0, -PI / 2 - .3); b.sph(.01, col, p.x, p.y, p.z); b.S(null); }
    else if (st === 'serre_tete') { b.add(new THREE.TorusGeometry(.1, .006, 6, 24, PI), col, b.M(0, HC.y + .02, HC.z + .01, -.3, 0, 0, 1, 1.12, 1), 0, true); }
    else if (st === 'couronne') { b.S(S().gold); b.cyl(.06, .06, .04, 18, 0xffd23f, 0, T.y + .01, T.z, -.1, 0, 0, 0, true); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.cone(.012, .03, 4, 0xffd23f, Math.cos(a) * .056, T.y + .043, T.z + Math.sin(a) * .056); } b.S(null); b.sph(.008, 0xe8434a, 0, T.y + .012, T.z + .06); }
    else if (st === 'fleur') { const p = hp(.7, PI / 2 + .95, 1.1); b.S(S().petal); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.sph(.014, col, p.x + Math.cos(a) * .014, p.y + Math.sin(a) * .014, p.z, 1, 1, .5); } b.S(null); b.sph(.008, 0xffe27a, p.x, p.y, p.z + .005); }
    else if (st === 'feuille') { b.cyl(.003, .003, .03, 4, 0x6b4a2a, 0, T.y + .015, T.z); b.S(S().leaf); b.sph(.024, 0x58b54a, .018, T.y + .035, T.z, 1.6, .35, .9); b.S(null); }
    else if (st === 'oreilles' || st === 'renard' || st === 'chien' || st === 'ours' || st === 'lapin') {
      const ear = col, inner = st === 'renard' ? 0xfaf7f0 : 0xffb3c6;
      b.add(new THREE.TorusGeometry(.1, .005, 6, 24, PI), dark(hairCol, .8), b.M(0, HC.y + .012, HC.z + .005, -.25, 0, 0, 1, 1.14, 1), 0, true);
      for (const s of [-1, 1]) { const p = hp(.5, PI / 2 + s * 1.15, 1.1);
        if (st === 'lapin') { b.sph(.016, ear, p.x, p.y + .07, p.z - .01, 1, 4.2, .6); b.sph(.009, inner, p.x, p.y + .07, p.z - .004, 1, 3.6, .3); }
        else if (st === 'ours') { b.sph(.022, ear, p.x * 1.05, p.y + .012, p.z, 1, 1, .6); b.sph(.012, inner, p.x * 1.05, p.y + .012, p.z + .008, 1, 1, .4); }
        else if (st === 'chien') { b.sph(.02, ear, p.x * 1.18, p.y - .03, p.z - .01, .55, 1.6, 1); }
        else { const h = st === 'renard' ? .06 : .045; b.cone(.024, h, 4, ear, p.x, p.y + h * .45, p.z, -.15, 0, -s * .35); b.cone(.012, h * .6, 4, inner, p.x, p.y + h * .4, p.z + .008, -.15, 0, -s * .35); } } }
  }
  // ---------- peau articulée : des tubes d'anneaux, chaque anneau partagé entre deux os → plis doux aux épaules, coudes, poignets, hanches, genoux ----------
  const smo = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let SKM = null, SKO = null;
  const skMat = () => SKM || (SKM = G.toon({ vertexColors: true, skinning: true }));
  const skOut = () => SKO || (SKO = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x4a3426, side: THREE.BackSide, skinning: true }), { outline: .0042 }));
  G.on('frame', () => { if (SKO && G.M && G.M.outline) SKO.visible = G.M.outline.visible; });
  function skinB() {
    const pos = [], nor = [], col = [], skA = [], si = [], sw = [], idx = [], CC = new THREE.Color();
    // anneau : { c:[x,y,z], u, v (axes de la section), a, b (demi-axes), e (arrondi), col, sk (matière), w:[[os, poids], …] }
    function tube(rings, n, o = {}) {
      const P = [], R = [], I = [], Wv = [], Cv = [];
      rings.forEach(r => { const e = r.e || 2; for (let j = 0; j < n; j++) { const t = j / n * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t), pc = Math.sign(c) * Math.pow(Math.abs(c), 2 / e), ps = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e), rf = r.rf ? r.rf(c, sn) : 1;
        P.push(r.c[0] + (r.u[0] * pc * r.a + r.v[0] * ps * r.b) * rf, r.c[1] + (r.u[1] * pc * r.a + r.v[1] * ps * r.b) * rf, r.c[2] + (r.u[2] * pc * r.a + r.v[2] * ps * r.b) * rf); R.push(r); Wv.push(r.wf ? r.wf(c, sn) : r.w); Cv.push(r.cf ? r.cf(c, sn) : r.col); } });
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * n + j, q = i * n + (j + 1) % n; I.push(a, q, a + n, q, q + n, a + n); }
      const cap = (k, len, top) => { const r = rings[k], r2 = rings[k === 0 ? 1 : k - 1], d = [r.c[0] - r2.c[0], r.c[1] - r2.c[1], r.c[2] - r2.c[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, ci = P.length / 3;
        P.push(r.c[0] + d[0] / l * len, r.c[1] + d[1] / l * len, r.c[2] + d[2] / l * len); R.push(r); Wv.push(r.wf ? r.wf(0, 0) : r.w); Cv.push(r.col); for (let j = 0; j < n; j++) { const a = k * n + j, q = k * n + (j + 1) % n; if (top) I.push(ci, q, a); else I.push(ci, a, q); } };
      if (o.cap0 != null) cap(0, o.cap0, true); if (o.cap1 != null) cap(rings.length - 1, o.cap1, false);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
      const mi = Math.floor(rings.length / 2), r0 = rings[mi], k0 = mi * n, N0 = g.attributes.normal; // les normales doivent sortir du tube
      if (N0.getX(k0) * (P[k0 * 3] - r0.c[0]) + N0.getY(k0) * (P[k0 * 3 + 1] - r0.c[1]) + N0.getZ(k0) * (P[k0 * 3 + 2] - r0.c[2]) < 0) { for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(I); g.computeVertexNormals(); }
      if (o.flip) { for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(I); g.computeVertexNormals(); } // doublure : faces tournées vers l'intérieur
      const base = pos.length / 3, NN = g.attributes.normal;
      for (let i = 0; i < P.length / 3; i++) { const r = R[i]; pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nor.push(NN.getX(i), NN.getY(i), NN.getZ(i)); CC.set(Cv[i]); col.push(CC.r, CC.g, CC.b); skA.push(r.sk || 0);
        const w = (Wv[i] || [[0, 1]]).slice(0, 4), tot = w.reduce((t, q) => t + q[1], 0) || 1; for (let k = 0; k < 4; k++) { si.push(w[k] ? w[k][0] : 0); sw.push(w[k] ? w[k][1] / tot : 0); } }
      for (const q of I) idx.push(q + base);
    }
    // géométrie quelconque (mèches de cheveux…) : couleurs reprises, poids donnés par wfn(x, y, z) ; dy décale (repère de la tête → du corps)
    function geo(g, skv, wfn, dy = 0) { const p = g.attributes.position, nn = g.attributes.normal, cc = g.attributes.color, base = pos.length / 3;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + dy, z = p.getZ(i); pos.push(x, y, z); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i)); col.push(cc ? cc.getX(i) : 1, cc ? cc.getY(i) : 1, cc ? cc.getZ(i) : 1); skA.push(skv || 0);
        const w = wfn(x, y, z).slice(0, 4), tot = w.reduce((t, q) => t + q[1], 0) || 1; for (let k = 0; k < 4; k++) { si.push(w[k] ? w[k][0] : 0); sw.push(w[k] ? w[k][1] / tot : 0); } }
      if (g.index) for (let k = 0; k < g.index.count; k++) idx.push(g.index.getX(k) + base); else for (let k = 0; k < p.count; k++) idx.push(base + k); }
    function finish(Pc, bones) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('sk', new THREE.Float32BufferAttribute(skA, 1));
      g.setAttribute('skinIndex', new THREE.Float32BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.setIndex(idx); g.computeBoundingSphere();
      const mesh = new THREE.SkinnedMesh(g, skMat()); mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false; Pc.root.add(mesh);
      Pc._bind = true; Pc.root.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones)); Pc._bind = false; Pc.root.updateMatrixWorld(true);
      const om = new THREE.SkinnedMesh(g, skOut()); om.frustumCulled = false; om.castShadow = false; mesh.add(om); om.bind(mesh.skeleton, mesh.bindMatrix);
      mesh.userData.mat0 = mesh.material; Pc.bodySk = mesh; Pc.bodyOl = om; return mesh;
    }
    return { tube, geo, finish };
  }
  // ---------- assemblage d'un humain ----------
  const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  function build(L, ex = {}) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const CHY = .8, chest = new THREE.Group(); chest.position.set(0, CHY, 0); body.add(chest); // os du buste, pivot à la taille
    root.scale.setScalar(L.height === 'petit' ? .9 : L.height === 'grand' ? 1.07 : 1);
    const P = { root, body, chest, look: L, meshes: [], faces: {}, sp: 'humain' }, sk = S();
    const add = (parent, geo, ol = true, mat) => { const m = new THREE.Mesh(geo, mat || G.MATS); m.castShadow = true; m.frustumCulled = false; m.userData.mat0 = m.material; parent.add(m); P.meshes.push(m); if (ol) G.addOutline(m, G.M.outline); return m; };
    const fem = L.gender === 'f', masc = L.gender === 'g';
    const top = L.top || 'tshirt', swim = top === 'maillot', skin = L.skin, tc = L.topCol, bc = swim ? tc : L.botCol;
    const DRS = { robe: [.46, 1.75], robe_ete: [.5, 1.8], robe_longue: [.12, 1.42] }, dress = !!DRS[top], coat = top === 'manteau', kimono = top === 'kimono', bottom = swim || dress || kimono ? 'none' : (L.bottom || 'short');
    const longSleeve = ['pull', 'veste', 'hoodie', 'chemise', 'manteau', 'marin', 'kimono', 'costume', 'chemise_ouverte', 'blouson', 'sweat', 'gilet', 'cardigan'].includes(top), bareArms = swim || top === 'debardeur' || dress, openNeck = swim || top === 'debardeur' || dress;
    const pants = ['pantalon', 'jean', 'chino', 'jogging', 'legging'].includes(bottom) || top === 'salopette', skirt = bottom === 'jupe' || bottom === 'jupe_longue' || bottom === 'jupe_plissee';
    const SHIRT = 0xf7f5ef, TEE = 0xf1eee6;
    const shoeCol = L.shoes, shoe = swim ? 'nu' : (L.shoe || 'baskets');
    // ----- torse -----
    const TR = [[.585, .07, .06, -.004], [.62, .104, .079, -.008], [.66, .118, .085, -.012], [.71, .117, .084, -.012], [.76, .104, .077, -.006], [.80, .094, .07, 0], [.85, .101, .074, .004], [.9, .112, .082, .01], [.95, .118, .083, .01], [.995, .126, .076, .004], [1.028, .13, .068, -.002], [1.052, .108, .058, -.006], [1.074, .05, .044, -.006]];
    for (const r of TR) { if (fem) { if (r[0] < .76) r[1] += .011; if (r[0] > .78 && r[0] < .83) r[1] -= .009; if (r[0] > .98) r[1] -= .013; if (r[0] > .87 && r[0] < .96) { r[2] += .014; r[3] += .006; } } if (masc) { if (r[0] < .74) r[1] -= .006; if (r[0] > .78 && r[0] < .86) r[1] += .007; if (r[0] > .96) r[1] += .014; if (r[0] > .87 && r[0] < .96) r[3] += .004; } }
    const BODY = L.body || 'normal', BK = { mince: { arm: .88, leg: .9, sh: -.006 }, athletique: { arm: 1.13, leg: 1.07, sh: .01 }, costaud: { arm: 1.12, leg: 1.1, sh: .012 } }[BODY] || { arm: 1, leg: 1, sh: 0 };
    for (const r of TR) { const y = r[0];
      if (BODY === 'mince') { r[1] *= .92; r[2] *= .92; }
      else if (BODY === 'athletique') { if (y >= .9) r[1] += masc ? .016 : .01; if (y > .85 && y < .98) { r[2] += .008; r[3] += .004; } if (y > .75 && y < .84) r[1] -= .005; }
      else if (BODY === 'costaud') { const bell = y > .7 && y < .95 ? Math.sin(PI * (y - .7) / .25) : 0; r[1] += .02 * bell + (y > .95 ? .012 : 0); r[2] += .03 * bell; r[3] += .014 * bell; } }
    const ringAt = y => { for (let i = 0; i < TR.length - 1; i++) { const a = TR[i], c = TR[i + 1]; if (y >= a[0] && y <= c[0]) { const t = (y - a[0]) / (c[0] - a[0]); return [y, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t, a[3] + (c[3] - a[3]) * t]; } } return TR[y < TR[0][0] ? 0 : TR.length - 1].slice(); };
    const seg = (y0, y1) => { const o = [ringAt(y0)]; for (const r of TR) if (r[0] > y0 + 1e-4 && r[0] < y1 - 1e-4) o.push(r); o.push(ringAt(y1)); return o; };
    let b = G.mb(501); const WAIST = .795;
    b.S(sk.fabric);
    // ===== corps lisse : une seule peau articulée (torse, cou, bras, mains, jambes, pieds) =====
    const SB = skinB(), sF = sk.fabric || 9, sS = sk.skin || 10, sP = sk.plastic || 14, neckTop = openNeck ? .99 : 9;
    const torsoCol = (y, c, sn) => { if (y > neckTop) return skin; if (bottom !== 'none' && y < WAIST) return bc; const xa = Math.abs(c);
      if (top === 'chemise_ouverte' && sn > .5 && xa < .09 + (y - .8) * .25) return TEE;
      if (top === 'costume' && y > .9 && sn > .6 && xa < (y - .9) * 1.4) return SHIRT;
      if (top === 'gilet' && y > .92 && sn > .6 && xa < (y - .92) * 1.3) return SHIRT;
      if (top === 'cardigan' && sn > .6 && xa < .07) return TEE;
      if (top === 'crop' && y < .86) return skin; return tc; };
    { const T = TR, rows = []; for (let i = 0; i < T.length - 1; i++) for (let k = 0; k < 3; k++) { const t = k / 3, a = T[Math.max(0, i - 1)], p = T[i], q = T[i + 1], d = T[Math.min(T.length - 1, i + 2)];
        const cr = j => .5 * (2 * p[j] + (-a[j] + q[j]) * t + (2 * a[j] - 5 * p[j] + 4 * q[j] - d[j]) * t * t + (-a[j] + 3 * p[j] - 3 * q[j] + d[j]) * t * t * t); rows.push([cr(0), cr(1), cr(2), cr(3) || 0]); }
      rows.push(T[T.length - 1].slice()); const bnd = []; if (bottom !== 'none') bnd.push(WAIST); if (openNeck) bnd.push(.99);
      let list = rows.filter(r => !bnd.some(y => Math.abs(r[0] - y) < .005)); for (const y of bnd) { const r = ringAt(y); list.push([y - 1e-4, r[1], r[2], r[3]], [y + 1e-4, r[1], r[2], r[3]]); } list.sort((p, q) => p[0] - q[0]);
      SB.tube(list.map(r => ({ c: [0, r[0], r[3]], u: [1, 0, 0], v: [0, 0, 1], a: r[1], b: r[2], e: 2.25, col: torsoCol(r[0], 0, 0), cf: (c, sn) => torsoCol(r[0], c, sn), sk: r[0] > neckTop ? sS : sF, w: [[0, 1 - smo(.74, .88, r[0])], [12, smo(.74, .88, r[0])]] })), 30, { cap0: .02, cap1: .004 }); }
    SB.tube([[1.0, .046, .042, -.004], [1.05, .042, .039, -.003], [1.09, .039, .036, -.001], [1.12, .037, .035, 0], [1.165, .036, .034, 0]].map(([y, a, bb, dz]) => ({ c: [0, y, dz], u: [1, 0, 0], v: [0, 0, 1], a, b: bb, col: skin, sk: sS, w: [[12, 1 - smo(1.08, 1.14, y)], [1, smo(1.08, 1.14, y)]] })), 18);
    // ceinture, ourlet, détails du haut
    const band = (y, col, k = 1.035, t = .1) => { const r = ringAt(y); b.add(new THREE.TorusGeometry(1, t, 6, 26), col, b.M(0, y, r[3], PI / 2, 0, 0, r[1] * k, r[2] * k, .1), 0, true); };
    if ((pants && bottom !== 'jogging' && bottom !== 'legging') || bottom === 'short' || bottom === 'bermuda' || bottom === 'cargo') { band(WAIST - .006, dark(bc, .7), 1.04, .09); b.S(sk.gold); b.box(.026, .02, .008, 0xd9b04a, 0, WAIST - .006, ringAt(WAIST)[2] + .006); b.S(sk.fabric); }
    if (['pull', 'hoodie', 'sweat', 'blouson', 'cardigan'].includes(top)) band(WAIST + .012, dark(tc, .85), 1.05, .12);
    if (['tshirt', 'pull', 'marin', 'hoodie', 'sweat', 'crop', 'blouse'].includes(top)) band(1.066, dark(tc, .9), 1.02, .14);
    if (bottom === 'jogging') { band(WAIST - .006, dark(bc, .8), 1.04, .12); for (const s2 of [-1, 1]) b.cyl(.003, .003, .06, 4, 0xffffff, s2 * .018, WAIST - .04, ringAt(WAIST)[2] + .008); }
    const zN = y => ringAt(y)[2] + ringAt(y)[3] + .004; // avant du torse à la hauteur y
    if (top === 'costume') { const tie = L.acc === 'cravate' ? null : (L.accCol != null && L.acc === 'aucun' ? 0x8e1f2a : 0x8e1f2a);
      for (const s2 of [-1, 1]) { b.box(.035, .2, .008, dark(tc, .82), s2 * .042, .97, zN(.97) + .002, 0, 0, -s2 * .32); b.box(.03, .06, .006, dark(tc, .82), s2 * .05, 1.05, zN(1.04), .5, 0, s2 * .5); }
      for (let i = 0; i < 2; i++) b.sph(.007, 0x2a2d33, 0, .83 + i * .05, zN(.85) + .004); b.box(.03, .012, .004, SHIRT, -.06, .93, zN(.93) + .002);
      if (tie) { b.box(.02, .018, .01, tie, 0, 1.05, zN(1.05)); b.add(new THREE.CylinderGeometry(.016, .003, .15, 4), tie, b.M(0, .965, zN(.96) + .004, 0, PI / 4, 0, 1, 1, .4)); } }
    if (top === 'gilet') { for (const s2 of [-1, 1]) b.box(.012, .14, .006, dark(tc, .8), s2 * .03, .99, zN(.99), 0, 0, -s2 * .35); for (let i = 0; i < 4; i++) b.sph(.006, 0xd9b04a, 0, .82 + i * .035, zN(.84) + .004);
      b.box(.02, .018, .01, 0x2a2d33, 0, 1.05, zN(1.05)); b.add(new THREE.CylinderGeometry(.015, .003, .12, 4), 0x2a2d33, b.M(0, .98, zN(.98) + .004, 0, PI / 4, 0, 1, 1, .4)); }
    if (top === 'polo') { for (const s2 of [-1, 1]) b.box(.045, .03, .01, tc, s2 * .03, 1.06, zN(1.06) - .004, .9, 0, s2 * .5); b.box(.022, .07, .005, dark(tc, .9), 0, 1.02, zN(1.02)); for (let i = 0; i < 2; i++) b.sph(.005, 0xf7f5ee, 0, 1.0 + i * .03, zN(1.0) + .004); }
    if (top === 'blouson') { b.add(new THREE.TorusGeometry(.06, .016, 6, 20), dark(tc, .85), b.M(0, 1.07, -.004, PI / 2, 0, 0, 1, 1.1, 1), 0, true); b.box(.006, .26, .006, 0xc9ced6, 0, .93, zN(.93) + .002); for (const s2 of [-1, 1]) b.box(.06, .006, .006, dark(tc, .7), s2 * .06, .9, zN(.9) + .002); }
    if (top === 'cardigan') for (const s2 of [-1, 1]) for (let i = 0; i < 5; i++) b.sph(.005, 0xf3e6c8, s2 * .015, .82 + i * .045, zN(.84 + i * .045) + .003);
    if (top === 'blouse') for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * 2.4; b.sph(.008, light(tc, .45), Math.sin(a) * .07, 1.055 - Math.cos(a) * .015, Math.cos(a) * .052 + .004, 1, .7, 1); }
    if (top === 'chemise_ouverte') for (const s2 of [-1, 1]) b.box(.04, .05, .008, tc, s2 * .045, 1.04, zN(1.04), .5, 0, s2 * .55);
    if (top === 'marin') for (const y of [.83, .87, .91, .95, .99]) band(y, tc === 0x2f4f9a ? 0xffffff : 0x2f4f9a, 1.012, .05);
    if (top === 'chemise' || top === 'veste' || top === 'manteau') { const zf = ringAt(.93)[2] + ringAt(.93)[3]; b.box(.024, .26, .006, top === 'veste' ? 0xfaf7f0 : light(tc, .15), 0, .93, zf); for (let i = 0; i < 4; i++) b.sph(.006, top === 'manteau' ? 0xd9b04a : 0xf7f5ee, 0, .84 + i * .055, zf + .006);
      for (const s of [-1, 1]) b.box(.04, .05, .008, top === 'veste' ? dark(tc, .8) : 0xffffff, s * .03, 1.045, .046, .55, 0, s * .6); }
    if (top === 'veste' || top === 'manteau') for (const s of [-1, 1]) b.box(.03, .2, .006, dark(tc, .82), s * .045, .96, ringAt(.96)[2] + .004, 0, 0, -s * .18);
    if (top === 'hoodie') { b.sph(.085, tc, 0, 1.045, -.07, 1.2, .75, .8); for (const s of [-1, 1]) b.cyl(.003, .003, .07, 4, 0xffffff, s * .026, .99, ringAt(.99)[2] + .004); b.box(.12, .06, .01, dark(tc, .88), 0, .85, ringAt(.85)[2] + .004); }
    if (top === 'salopette') { const zf = ringAt(.88)[2] + .004; b.box(.13, .15, .008, bc, 0, .87, zf); for (const s of [-1, 1]) { b.box(.022, .26, .006, bc, s * .05, .97, .012, -.35, 0, 0); b.sph(.008, 0xd9b04a, s * .05, .935, zf + .005); } }
    if (top === 'debardeur' || dress) for (const s2 of [-1, 1]) b.box(.018, .1, .03, tc, s2 * .07, 1.035, 0);
    if (kimono) { const zf = ringAt(.95)[2] + .003; for (const s of [-1, 1]) b.box(.026, .22, .006, light(tc, .4), s * .02, .95, zf, 0, 0, s * .45); band(.81, dark(tc, .55), 1.06, .3); }
    // jupes, robes, manteaux longs
    const flare = (y0, y1, c, wid = 1.6, inf = .8, pleats = 0) => { const r0 = ringAt(y0), N = 10, rings = [];
      for (let i = 0; i <= N; i++) { const f = i / N, y = y0 + (y1 - y0) * f, ww = 1 + (wid - 1) * Math.pow(f, .85), Lk = inf * smo(0, .55, f);
        rings.push({ c: [0, y, r0[3] - .012 * f], u: [1, 0, 0], v: [0, 0, 1], a: r0[1] * 1.035 * ww + .028 * f, b: r0[2] * 1.035 * ww + .028 * f, e: 2.1, col: c, sk: sF,
          rf: pleats ? (cc, sn) => 1 + pleats * Math.pow(Math.abs(Math.sin(Math.atan2(sn, cc) * 9)), .6) * f : null,
          wf: cc => { const wl = G.clamp(.5 - cc * .9, 0, 1); return [[0, 1 - Lk], [8, Lk * wl], [10, Lk * (1 - wl)]].filter(q => q[1] > 1e-4); } }); }
      SB.tube(rings, 32, {}); SB.tube(rings.map(r => Object.assign({}, r, { a: r.a * .975, b: r.b * .975, col: dark(c, .55) })), 32, { flip: 1 }); };
    if (dress) flare(.8, DRS[top][0], tc, DRS[top][1], top === 'robe_longue' ? .55 : .75); else if (kimono) flare(.8, .12, tc, 1.28, .55); else if (coat) flare(.8, .44, tc, 1.5, .8);
    if (bottom === 'jupe') flare(.795, .52, bc, 1.7, .8); if (bottom === 'jupe_longue') flare(.795, .14, bc, 1.6, .58); if (bottom === 'jupe_plissee') flare(.795, .5, bc, 1.55, .8, .05);
    // tablier, foulard, cravate, nœud papillon, collier, écharpe, sac, ailes
    if (ex.apron != null) { const zf = ringAt(.8)[2] + .008; b.box(.17, .3, .008, ex.apron, 0, .74, zf + .01); b.box(.12, .12, .008, ex.apron, 0, .93, ringAt(.93)[2] + .008); b.box(.08, .05, .004, dark(ex.apron, .85), 0, .7, zf + .016); b.box(.2, .012, .006, dark(ex.apron, .85), 0, .8, zf + .006); }
    const acc = L.acc || 'aucun', ac = L.accCol != null ? L.accCol : 0xe8434a, zc = ringAt(1.04)[2] + .004;
    if (acc === 'echarpe') { b.add(new THREE.TorusGeometry(.055, .02, 8, 20), ac, b.M(0, 1.075, -.002, PI / 2, 0, 0, 1, 1.1, 1), 0, true); b.box(.04, .14, .016, ac, .04, 1.0, zc + .01, .08, 0, .1); b.box(.04, .012, .017, dark(ac), .04, .935, zc + .016, .08, 0, .1); }
    if (acc === 'cravate') { b.box(.02, .018, .01, ac, 0, 1.05, zc); b.add(new THREE.CylinderGeometry(.015, .002, .16, 4), ac, b.M(0, .955, zc + .002, 0, PI / 4, 0, 1, 1, .4)); }
    if (acc === 'noeud_pap') { for (const s of [-1, 1]) b.cone(.014, .03, 4, ac, s * .016, 1.052, zc + .006, 0, 0, s * PI / 2); b.sph(.007, ac, 0, 1.052, zc + .008); }
    if (acc === 'collier') for (let i = 0; i < 15; i++) { const a = (i / 14 - .5) * 2.2; b.sph(.0055, 0xf7f3ea, Math.sin(a) * .058, 1.05 - Math.cos(a) * .028 + .028, Math.cos(a) * .046); }
    if (acc === 'sac') { b.box(.15, .18, .07, ac, 0, .9, -.13); b.box(.12, .06, .02, dark(ac), 0, .86, -.17); for (const s of [-1, 1]) b.box(.015, .2, .012, 0x6b4a32, s * .06, .93, .072, -.1, 0, 0); }
    if (acc === 'ailes') { b.S(sk.petal); for (const s of [-1, 1]) { b.add(new THREE.SphereGeometry(.13, 12, 8), 0xf3f7ff, b.M(s * .1, .97, -.12, 0, s * .6, s * .5, .3, 1.05, .1), 2, true); } b.S(null); }
    if (ex.tail) { const tc2 = ex.tailCol || 0xf08a3c; if (ex.tail === 'renard') { loft(b, [[0, .02, .02], [.08, .045, .045], [.18, .05, .05], [.27, .03, .03]], tc2, { rx: -2.3, y: .7, z: -.07, capT: .02, capB: .01 }); b.sph(.03, 0xfaf7f0, 0, .7 + .27 * Math.cos(-2.3), -.07 + .27 * Math.sin(-2.3), 1, 1, 1); }
      else loft(b, [[0, .012, .012], [.15, .011, .011], [.27, .009, .009]], tc2, { rx: -2.0, y: .7, z: -.07, capT: .01 }); }
    // cou
    b.S(null); { const tg = b.done(); tg.translate(0, -CHY, 0); add(chest, tg); }
    // ----- tête -----
    const head = new THREE.Group(); head.position.set(0, NECK - CHY, 0); chest.add(head); P.head = head;
    const hairB = new THREE.Group(); hairB.position.set(0, HC.y + .03, -.06); head.add(hairB); P.hairB = hairB;
    b = G.mb(502); b.S(sk.skin);
    b.add(headGeo(1, 0, TAU, 0, PI, 32, 24), skin, b.M(), 0, true);
    for (const s of [-1, 1]) { b.sph(.016, skin, s * .085, .092, -.004, .45, 1.25, .8); b.sph(.01, dark(skin, .9), s * .087, .096, .0, .3, .8, .5); }
    b.sph(.006, skin, 0, .072, HRZ - .003, .75, 1.1, .6); // nez
    if (acc === 'boucles') { b.S(sk.gold); for (const s of [-1, 1]) { b.sph(.006, 0xffd23f, s * .088, .072, .002); b.add(new THREE.TorusGeometry(.009, .0028, 5, 12), 0xffd23f, b.M(s * .089, .058, .002, 0, PI / 2, 0), 0, true); } }
    b.S(null); add(head, b.done());
    // visage
    const fl = Object.assign({}, L);
    P.faceHD = !!HD; P.faceMat = G.toon({ map: tex(drawFace(fl, 'normal', P.faceHD)), transparent: true, alphaTest: .4, polygonOffset: true, polygonOffsetFactor: -2 }, {});
    P.faces.normal = P.faceMat.map; P.faceOpts = fl;
    const fm = new THREE.Mesh(headGeo(1.003, FPS, FPL, FTS, FTL, 30, 26), P.faceMat); fm.frustumCulled = false; fm.userData.sk = sk.skin; head.add(fm); P.faceMesh = fm;
    P.eyes = new THREE.Object3D(); head.add(P.eyes);
    P.setExpr = e => { if (P.expr === e) return; P.expr = e; if (!P.faces[e]) P.faces[e] = tex(drawFace(P.faceOpts, e, P.faceHD)); P.faceMat.map = P.faces[e]; };
    // cheveux, chapeau, accessoires du visage
    const hatSt = L.hat || 'aucun', covers = ['bonnet', 'casquette', 'bandana', 'beret', 'capitaine', 'haut_forme', 'chapeau', 'sorciere'].includes(hatSt);
    b = G.mb(503); const hd = G.mb(505); hd.S(sk.hair); hd.jit(.05); hair(b, L.hair || 'court', L.hairCol, covers, hd, L.skin); add(head, b.done(), false);
    // mèches longues : avec la peau articulée, accrochées à l'os des cheveux (plus elles s'éloignent du crâne, plus elles bougent)
    for (const g of hd.parts[0]) SB.geo(g, sk.hair, (x, y, z) => { const w = smo(.1, .17, Math.hypot(x - HC.x, y - NECK - HC.y, z - HC.z)); return [[1, 1 - w], [13, w]].filter(q => q[1] > 1e-4); }, NECK);
    b = G.mb(504);
    if (hatSt !== 'aucun') hat(b, hatSt, L.hatCol != null ? L.hatCol : 0xe8434a, L.hairCol);
    if (acc === 'lunettes' || acc === 'soleil') { b.S(sk.iron); for (const s of [-1, 1]) { const p = hp(PI / 2 - .05, PI / 2 + s * .36, 1.04); b.add(new THREE.TorusGeometry(.019, .0028, 6, 18), 0x2a2d33, b.M(p.x, p.y, p.z + .008, 0, s * .3, 0), 0, true); if (acc === 'soleil') b.cyl(.018, .018, .003, 14, 0x15171c, p.x, p.y, p.z + .008, PI / 2, s * .3, 0); b.box(.004, .004, .09, 0x2a2d33, s * .084, p.y + .004, .05); } b.box(.016, .004, .004, 0x2a2d33, 0, hp(PI / 2 - .06, PI / 2, 1.05).y + .004, HRZ + .016); b.S(null); }
    if (acc === 'etoile') { const p = hp(.85, PI / 2 + .85, 1.08); b.S(sk.gold); b.sph(.014, 0xffd23f, p.x, p.y, p.z, 1, 1, .4); b.S(null); }
    if (acc === 'pansement') { const p = hp(1.75, PI / 2 + .5, 1.01); b.box(.03, .011, .004, 0xf3d1a8, p.x, p.y, p.z, 0, .4, -.4); }
    if (acc === 'moustache' || ex.moustache) { const p = hp(1.92, PI / 2, 1.03); b.S(sk.hair); for (const s of [-1, 1]) b.sph(.016, ex.moustache || L.hairCol || 0x3a2a1a, p.x + s * .014, p.y + .004, p.z, 1.3, .45, .55); b.S(null); }
    const BEARD = L.beard && L.beard !== 'aucune' ? L.beard : ex.beard ? 'barbe' : null, bcol = ex.beard && (!L.beard || L.beard === 'aucune') ? ex.beard : dark(L.hairCol != null ? L.hairCol : 0x3a2a1a, .92);
    if (BEARD && BEARD !== 'trois_jours') { b.S(sk.hair); b.jit(.08);
      // calotte de barbe qui suit la mâchoire, avec un trou pour la bouche
      const patch = (k, th0, th1, ph0, ph1, hole) => { const NT = 12, NP = 20, pos = [], idx = []; for (let i = 0; i <= NT; i++) for (let j = 0; j <= NP; j++) { const th = th0 + (th1 - th0) * i / NT, ph = ph0 + (ph1 - ph0) * j / NP, d = dirAt(th, ph); pos.push(...headPt(d[0], d[1], d[2], k * (1 + .01 * Math.sin(i * 2.3 + j * 1.7)))); }
        for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) { const thc = th0 + (th1 - th0) * (i + .5) / NT, phc = ph0 + (ph1 - ph0) * (j + .5) / NP; if (hole && thc > 1.97 && thc < 2.32 && Math.abs(phc - PI / 2) < .42) continue; const a = i * (NP + 1) + j; idx.push(a, a + NP + 1, a + 1, a + 1, a + NP + 1, a + NP + 2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        const n0 = g.attributes.normal, m0 = Math.floor(pos.length / 6); if (n0.getX(m0) * (pos[m0 * 3] - HC.x) + n0.getY(m0) * (pos[m0 * 3 + 1] - HC.y) + n0.getZ(m0) * (pos[m0 * 3 + 2] - HC.z) < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
        b.add(g, bcol, b.M(), 0, true); };
      const moust = (big) => { for (const s2 of [-1, 1]) strand(b, bcol, [hp(1.94, PI / 2, 1.035), hp(1.97, PI / 2 + s2 * .24, 1.06), hp(big ? 2.1 : 2.04, PI / 2 + s2 * (big ? .5 : .4), 1.03)], big ? .014 : .011, .004, .55, 7); };
      if (BEARD === 'barbe') { patch(1.075, 1.9, 2.98, PI / 2 - 1.42, PI / 2 + 1.42, true); moust(true); }
      else if (BEARD === 'barbe_courte') { patch(1.035, 1.96, 2.95, PI / 2 - 1.38, PI / 2 + 1.38, true); moust(false); }
      else if (BEARD === 'bouc') { patch(1.04, 2.27, 2.92, PI / 2 - .38, PI / 2 + .38, false); moust(false); }
      else if (BEARD === 'collier') patch(1.03, 2.45, 2.98, PI / 2 - 1.4, PI / 2 + 1.4, false);
      else if (BEARD === 'favoris') for (const s2 of [-1, 1]) patch(1.025, 1.45, 2.05, PI / 2 + s2 * 1.18 - .12, PI / 2 + s2 * 1.18 + .12, false);
      else if (BEARD === 'moustache') moust(true);
      b.jit(0); b.S(null); }
    if (b.parts.some(p => p.length)) add(head, b.done(), false);
    // ----- bras : épaule ronde, biceps, coude, avant-bras, poignet, main à cinq doigts (une seule peau) -----
    const autoBend = (g, f) => { g.updateMatrix = function () { if (P._bind) this.rotation.x = 0; else if (this.userData.k != null) this.rotation.x = this.userData.k; else f(this); THREE.Object3D.prototype.updateMatrix.call(this); }; };
    const lerpT = (T, y, j) => { for (let i = 0; i < T.length - 1; i++) if (y <= T[i][0] && y >= T[i + 1][0]) { const t = (T[i][0] - y) / (T[i][0] - T[i + 1][0]); return T[i][j] + (T[i + 1][j] - T[i][j]) * t; } return y > T[0][0] ? T[0][j] : T[T.length - 1][j]; };
    // anneaux d'un membre (du haut vers le bas) avec un ourlet de vêtement à la hauteur « cover » : tissu au-dessus, peau en dessous
    const limb = (T, k, cover, lip, loose) => { let L = T.map(r => [r[0], r[1] * k, r[2] * k, r[3] || 0, 0]);
      if (cover > T[T.length - 1][0] && cover < T[0][0]) { L = L.filter(r => Math.abs(r[0] - cover) > .012); const c2 = cover + .013;
        L.push([c2, lerpT(T, c2, 1) * k + lip * .55, lerpT(T, c2, 2) * k + lip * .55, lerpT(T, c2, 3) || 0, 1], [cover + 1e-4, lerpT(T, cover, 1) * k + lip, lerpT(T, cover, 2) * k + lip, lerpT(T, cover, 3) || 0, 1], [cover - 1e-4, lerpT(T, cover, 1) * k, lerpT(T, cover, 2) * k, lerpT(T, cover, 3) || 0, 0]); L.sort((p, q) => q[0] - p[0]); }
      return L.map(r => { const cl = r[0] > cover; return { y: r[0], a: r[1] + (cl && !r[4] ? loose : 0), b: r[2] + (cl && !r[4] ? loose : 0), dz: r[3], cl }; }); };
    const arm = s => {
      const ax = s * ((masc ? SX + .006 : fem ? SX - .01 : SX) + BK.sh), g = new THREE.Group(); g.position.set(ax, SH - CHY, 0); chest.add(g);
      const fa = new THREE.Group(); fa.position.set(0, -UA, 0); g.add(fa);
      autoBend(fa, o => { const a = o.parent.rotation.x; o.rotation.x = -(.16 + Math.max(0, -a) * .17 + Math.max(0, a) * .04); });
      const hand = new THREE.Group(); hand.position.set(0, -FA, .004); fa.add(hand);
      const [bA, bF, bH] = s < 0 ? [2, 3, 4] : [5, 6, 7], yE = SH - UA, yW = yE - FA, k = (fem ? .9 : masc ? 1.08 : 1) * BK.arm;
      const cover = bareArms ? SH + 1 : longSleeve ? yW + .02 : top === 'blouse' ? SH - .085 : SH - .1, slv = top === 'gilet' ? SHIRT : tc, puff = top === 'blouse';
      const wts = y => { const wb = y > SH - .03 ? .5 * smo(SH - .03, SH + .03, y) : 0, wf = smo(yE + .028, yE - .028, y), wh = smo(yW + .008, yW - .012, y);
        return [[12, wb], [bA, (1 - wb) * (1 - wf)], [bF, (1 - wb) * wf * (1 - wh)], [bH, (1 - wb) * wf * wh]].filter(q => q[1] > 1e-4); };
      const T = [[SH + .032, .006, .006], [SH + .027, .022, .023], [SH + .017, .033, .035], [SH + .003, .04, .042], [SH - .025, .043, .044], [SH - .07, .043, .044], [SH - .13, .041, .042], [yE + .035, .034, .036], [yE, .031, .033], [yE - .035, .033, .034], [yE - .08, .031, .031], [yE - .14, .025, .026], [yW + .012, .0205, .022], [yW - .004, .02, .0215]];
      SB.tube(limb(T, k, cover, puff ? .016 : .007, puff ? .013 : .004).map(r => ({ c: [ax, r.y, r.dz], u: [1, 0, 0], v: [0, 0, 1], a: r.a, b: r.b, col: r.cl ? slv : skin, sk: r.cl ? sF : sS, w: wts(r.y) })), 18, { cap0: .002 });
      // main : paume, quatre doigts un peu repliés vers la cuisse, pouce vers l'avant
      const hz = .004, sH = [[bH, 1]];
      SB.tube([[yW + .004, .0125, .021], [yW - .012, .0128, .024], [yW - .035, .0124, .0265], [yW - .055, .0118, .026], [yW - .064, .0102, .022]].map(([y, a2, b2]) => ({ c: [ax - s * .001, y, hz], u: [1, 0, 0], v: [0, 0, 1], a: a2, b: b2, col: skin, sk: sS, w: sH })), 14, { cap1: .003 });
      [[.0165, .043, .0062], [.0055, .049, .0059], [-.0055, .046, .0055], [-.016, .037, .0049]].forEach(([dz, L, rr]) => { const y0 = yW - .056;
        SB.tube([0, .33, .66, 1].map(t => ({ c: [ax - s * (.0015 + .014 * t * t), y0 - L * t * (1 - .1 * t), hz + dz * (1 + .12 * t)], u: [1, 0, 0], v: [0, 0, 1], a: rr * (1 - .25 * t), b: rr * (1 - .18 * t), col: skin, sk: sS, w: sH })), 8, { cap1: rr * .8 }); });
      SB.tube([0, .4, .75, 1].map(t => ({ c: [ax - s * (.004 + .011 * t), yW - .014 - .037 * t, hz + .021 + .015 * t], u: [1, 0, 0], v: [0, 0, 1], a: .0072 * (1 - .25 * t), b: .008 * (1 - .25 * t), col: skin, sk: sS, w: sH })), 8, { cap1: .005 });
      if (kimono) { const bb = G.mb(511); bb.S(sk.fabric); loft(bb, [[.02, .036, .036], [-.1, .05, .055, .01], [-.17, .07, .075, .02]], tc); add(fa, bb.done()); }
      return { g, fa, hand };
    };
    const AL = arm(-1), AR = arm(1); P.armL = AL.g; P.armR = AR.g; P.hand = AR.hand; P.faL = AL.fa; P.faR = AR.fa;
    // ----- jambes : cuisse, genou, mollet, cheville ; chaussures modelées dont la semelle touche le sol -----
    const leg = s => {
      const lx = s * (fem ? HX + .006 : HX), g = new THREE.Group(); g.position.set(lx, HIP, 0); body.add(g);
      const shin = new THREE.Group(); shin.position.set(0, -TH, 0); g.add(shin);
      autoBend(shin, o => { const a = o.parent.rotation.x; o.rotation.x = a > 0 ? a * 1.1 : a < -1.05 ? -a * .96 : -a * .25; });
      const [bL, bS] = s < 0 ? [8, 9] : [10, 11], yK = HIP - TH, yA = .085, k = (fem ? .97 : masc ? 1.04 : 1) * BK.leg, SW = [[bS, 1]];
      const shortY = bottom === 'short' ? HIP - .1 : bottom === 'bermuda' ? HIP - .24 : bottom === 'cargo' ? HIP - .21 : null, cover = pants ? yA + .014 : shortY != null ? shortY : HIP + 1;
      const wts = y => { const wb = y > HIP - .02 ? .55 * smo(HIP - .02, HIP + .07, y) : 0, ws = smo(yK + .03, yK - .035, y); return [[0, wb], [bL, (1 - wb) * (1 - ws)], [bS, (1 - wb) * ws]].filter(q => q[1] > 1e-4); };
      const T = [[HIP + .07, .036, .036, 0], [HIP + .035, .054, .058, -.004], [HIP - .03, .062, .066, -.006], [HIP - .1, .062, .064, -.004], [HIP - .18, .056, .058, -.002], [yK + .035, .047, .048, .002], [yK, .045, .047, .005], [yK - .03, .046, .048, -.003], [yK - .08, .049, .053, -.012], [yK - .14, .044, .047, -.009], [yK - .2, .034, .036, -.003], [yA + .02, .028, .03, 0], [yA, .027, .029, 0]];
      const tight = bottom === 'legging', lipL = tight ? .002 : pants ? (bottom === 'jean' ? .009 : .007) : .009, looseL = tight ? .001 : bottom === 'chino' ? .003 : pants ? .006 : .004;
      const seam = bottom === 'jean' ? light(bc, .28) : bottom === 'jogging' ? 0xffffff : null;
      SB.tube(limb(T, k, cover, lipL, looseL).map(r => ({ c: [lx, r.y, r.dz], u: [1, 0, 0], v: [0, 0, 1], a: r.a, b: r.b, col: r.cl ? bc : skin, cf: r.cl && seam != null ? c => (c * s > (bottom === 'jogging' ? .9 : .975) ? seam : bc) : null, sk: r.cl ? sF : sS, w: wts(r.y) })), 18, { cap1: .012 });
      if (bottom === 'cargo') { const bb = G.mb(524); bb.S(sk.fabric); bb.box(.03, .08, .07, dark(bc, .9), s * .07, -.13, 0); bb.box(.032, .018, .072, dark(bc, .78), s * .07, -.085, 0); add(g, bb.done(), false); }
      if (bottom === 'jean') { const bb = G.mb(525); bb.S(sk.fabric); bb.box(.05, .055, .006, dark(bc, .85), 0, .05, -.06); add(g, bb.done(), false); }
      // pied ou chaussure : section arrondie le long de z (talon → orteils)
      const foot = (prof, colFn, skv, n = 16) => SB.tube(prof.map(([z, y, a2, b2]) => ({ c: [lx + s * .003, y, z], u: [1, 0, 0], v: [0, 1, 0], a: a2, b: b2, e: 2.5, col: colFn(z, y), sk: skv, w: SW })), n, { cap0: .01, cap1: .01 });
      const sc = shoeCol, dk = dark(sc, .55);
      const bare = [[-.045, .036, .025, .034], [-.02, .034, .029, .034], [.02, .028, .032, .026], [.06, .019, .033, .017], [.09, .013, .03, .011], [.104, .012, .025, .009]];
      if (shoe === 'nu' || shoe === 'sandales' || shoe === 'ballerines') foot(bare, () => skin, sS);
      if (shoe === 'sandales') { foot([[-.052, .007, .03, .007], [0, .007, .036, .007], [.06, .007, .037, .007], [.112, .008, .028, .008]], () => sc, sP, 12); const bb = G.mb(523); bb.S(sk.plastic);
        for (const z of [-.005, .05]) bb.box(.07, .012, .014, sc, lx * 0 + s * .003, .026 - yK + (z > 0 ? -.006 : 0), z, 0, 0, 0); add(shin, bb.done(), false); }
      else if (shoe === 'ballerines') { foot([[-.05, .028, .029, .03], [-.02, .026, .033, .028], [.03, .02, .036, .02], [.07, .015, .036, .015], [.1, .013, .031, .012], [.112, .012, .024, .01]], () => sc, sP); foot([[-.054, .005, .031, .006], [.06, .005, .038, .006], [.115, .006, .025, .006]], () => dk, sP, 12); }
      else if (shoe !== 'nu') { // baskets, bottes : empeigne galbée, semelle qui déborde un peu, bout renforcé
        const white = shoe === 'baskets' ? 0xf7f5ee : null;
        foot([[-.052, .042, .03, .04], [-.035, .046, .035, .046], [-.005, .045, .037, .045], [.03, .038, .039, .036], [.065, .029, .038, .027], [.095, .023, .033, .021], [.112, .021, .025, .017]], (z, y) => white && z > .085 ? white : sc, sP);
        foot([[-.058, .009, .032, .01], [-.02, .009, .038, .01], [.06, .009, .041, .01], [.11, .01, .03, .011], [.121, .011, .02, .01]], () => white || dk, sP, 14);
        if (shoe === 'bottes') SB.tube([[.22, .042, .044], [.17, .04, .042], [.11, .038, .041], [.06, .036, .04]].map(([y, a2, b2]) => ({ c: [lx, y, -.006], u: [1, 0, 0], v: [0, 0, 1], a: a2, b: b2, col: sc, sk: sP, w: SW })), 16, { cap1: .01 });
        if (shoe === 'derbies') { const bb = G.mb(526); bb.S(sk.fabric); for (let i = 0; i < 3; i++) bb.box(.026, .004, .005, dark(sc, .5), s * .003, .058 - i * .007 - yK, .01 + i * .014, -.55, 0, 0); add(shin, bb.done(), false); }
        if (shoe === 'baskets') { const bb = G.mb(522); bb.S(sk.fabric); for (let i = 0; i < 4; i++) bb.box(.032, .004, .006, 0xffffff, s * .003, .062 - i * .007 - yK, .006 + i * .016, -.55, 0, 0); bb.box(.006, .03, .018, 0xffffff, s * (.003 + .037), .04 - yK, -.03); bb.box(.006, .03, .018, 0xffffff, s * (.003 - .037), .04 - yK, -.03); add(shin, bb.done(), false); } }
      return { g, shin };
    };
    const LL = leg(-1), LR = leg(1); P.legL = LL.g; P.legR = LR.g; P.shinL = LL.shin; P.shinR = LR.shin;
    SB.finish(P, [body, P.head, AL.g, AL.fa, AL.hand, AR.g, AR.fa, AR.hand, LL.g, LL.shin, LR.g, LR.shin, chest, hairB]);
    // le personnage s'écrase beaucoup moins qu'avant quand il saute (réalisme)
    body.updateMatrix = function () { const s = this.scale, x = s.x, y = s.y, z = s.z; s.set(1 + (x - 1) * .3, 1 + (y - 1) * .3, 1 + (z - 1) * .3); THREE.Object3D.prototype.updateMatrix.call(this); s.set(x, y, z); };
    return P;
  }
  // ---------- les habitants deviennent humains ----------
  const SKINS = [0xffe2cf, 0xffd6bd, 0xf6c7a2, 0xe8b48a, 0xc98c62, 0x9a6444, 0x7a4b30];
  const NPCL = {
    'Bibi': { gender: 'f', hair: 'couettes', hairCol: 0xf2b8c8, hat: 'lapin', hatCol: 0xfff0f4, top: 'robe', topCol: 0xffb9ca, shoe: 'ballerines', shoes: 0xff7fa8, eyes: 'doux', eyeCol: 0x6a3e57, height: 'petit', lashes: true, acc: 'aucun' },
    'Moka': { gender: 'f', hair: 'mi_long', hairCol: 0xc98a52, hat: 'oreilles', hatCol: 0xc98a52, top: 'marin', topCol: 0x79b9a2, bottom: 'pantalon', botCol: 0x3d4a5a, shoe: 'baskets', shoes: 0xe8434a, eyes: 'chat', eyeCol: 0x52976a, tail: 'chat', tailCol: 0xc98a52, mouth: 'chat' },
    'Pépin': { gender: 'g', hair: 'court', hairCol: 0x6b4426, hat: 'ours', hatCol: 0x7a5236, top: 'chemise', topCol: 0x7290b8, bottom: 'pantalon', botCol: 0x4a5a7a, shoe: 'bottes', shoes: 0x5a3a24, eyes: 'rond', eyeCol: 0x443126, height: 'grand', brows: 'epais' },
    'Lulu': { gender: 'f', hair: 'queue_haute', hairCol: 0xffe08a, hat: 'casquette', hatCol: 0xffc23d, top: 'tshirt', topCol: 0x5b8fd6, bottom: 'short', botCol: 0xfaf7f0, shoe: 'baskets', shoes: 0xffa62b, eyes: 'brillants', eyeCol: 0x3b6a9f, acc: 'echarpe', accCol: 0xe8434a },
    'Gaston': { gender: 'g', hair: 'meche', hairCol: 0x8b8f99, top: 'chemise', topCol: 0x4fb35f, bottom: 'pantalon', botCol: 0x5a4a3a, shoe: 'bottes', shoes: 0x5a3a24, eyes: 'doux', eyeCol: 0x413c36, height: 'grand', brows: 'epais', ex: { apron: 0x2f8a45, moustache: 0x6a6e78 } },
    'Marguerite': { gender: 'f', hair: 'chignon', hairCol: 0xf2cf86, hat: 'chien', hatCol: 0xf2cf86, top: 'veste', topCol: 0x5b8fd6, bottom: 'jupe', botCol: 0x3d5a8a, shoe: 'ballerines', shoes: 0x2f4f7a, eyes: 'anime', eyeCol: 0x546d9b, acc: 'echarpe', accCol: 0xff8fc0, lashes: true },
    'Professeur Plume': { gender: 'g', hair: 'chauve', hairCol: 0xe8e4dc, top: 'veste', topCol: 0x6b4a32, bottom: 'pantalon', botCol: 0x4a3a2a, shoe: 'bottes', shoes: 0x3a2a1a, eyes: 'doux', eyeCol: 0xb98735, acc: 'lunettes', height: 'grand', brows: 'epais', ex: { moustache: 0xe8e4dc } },
    'Mme Laine': { gender: 'f', hair: 'boucles', hairCol: 0xfbf3e6, top: 'robe', topCol: 0xff8fc0, shoe: 'ballerines', shoes: 0x6c8cff, eyes: 'doux', eyeCol: 0x76546b, acc: 'collier', lashes: true },
    'Pablo': { gender: 'g', hair: 'court', hairCol: 0x5a3a22, hat: 'casquette', hatCol: 0x2f4f9a, top: 'veste', topCol: 0x2f4f9a, bottom: 'pantalon', botCol: 0x22304f, shoe: 'bottes', shoes: 0x1a1a1a, eyes: 'rond', eyeCol: 0x332419, acc: 'noeud_pap', accCol: 0xe8434a },
    'Capitaine Bigorneau': { gender: 'g', hair: 'court', hairCol: 0xb8bcc2, hat: 'capitaine', top: 'pull', topCol: 0xfaf7f0, bottom: 'pantalon', botCol: 0x1d2a4a, shoe: 'bottes', shoes: 0x1a1a1a, eyes: 'brillants', eyeCol: 0x314b30, height: 'grand', acc: 'echarpe', accCol: 0xe8434a, ex: { beard: 0xd8dce2 } },
    'Papy Écaille': { gender: 'g', hair: 'chauve', hairCol: 0xf2f0ea, top: 'pull', topCol: 0xff9a3c, bottom: 'pantalon', botCol: 0x7a6a50, shoe: 'sandales', shoes: 0x8a6a46, eyes: 'endormis', eyeCol: 0x596c42, acc: 'lunettes', height: 'petit', ex: { moustache: 0xf2f0ea } },
    'Filou': { gender: 'g', hair: 'herisse', hairCol: 0xf08a3c, hat: 'renard', hatCol: 0xf08a3c, top: 'hoodie', topCol: 0xffd23f, bottom: 'short', botCol: 0x3d5a8a, shoe: 'baskets', shoes: 0x5b8fd6, eyes: 'anime', eyeCol: 0x563a2b, mouth: 'dent', tail: 'renard', tailCol: 0xf08a3c },
    'Madame Étoile': { gender: 'f', hair: 'ondule', hairCol: 0x4a3a6e, hat: 'sorciere', hatCol: 0x5b3a8c, top: 'robe', topCol: 0x8a3fbf, shoe: 'ballerines', shoes: 0x2a1a3a, eyes: 'doux', eyeCol: 0xbba8ff, acc: 'boucles', lashes: true },
    'Rounard': { gender: 'g', hair: 'meche', hairCol: 0x4a7aa8, hat: 'renard', hatCol: 0x5a8fb8, top: 'veste', topCol: 0xe8a23a, bottom: 'pantalon', botCol: 0x3a4f78, shoe: 'bottes', shoes: 0x2a2d33, eyes: 'anime', eyeCol: 0x6788ba, mouth: 'chat', acc: 'echarpe', accCol: 0x3a4f78, tail: 'renard', tailCol: 0x5a8fb8 },
    'Dédé': { gender: 'g', hair: 'decoiffe', hairCol: 0xf2efe6, hat: 'chien', hatCol: 0xf2efe6, top: 'tshirt', topCol: 0x2a2d33, bottom: 'pantalon', botCol: 0x3d4a5a, shoe: 'baskets', shoes: 0xe8434a, eyes: 'endormis', eyeCol: 0x40352f, acc: 'echarpe', accCol: 0xe8434a },
    'Céleste': { gender: 'f', hair: 'chignon', hairCol: 0xf3b6d0, top: 'robe', topCol: 0x8d6fd1, shoe: 'ballerines', shoes: 0x5b3a8c, eyes: 'doux', eyeCol: 0x9270bf, acc: 'lunettes', lashes: true },
    'Mélo': { gender: 'f', hair: 'boucles', hairCol: 0xf3e6c8, top: 'pull', topCol: 0xe8a23a, bottom: 'jupe_longue', botCol: 0x8a6a46, shoe: 'bottes', shoes: 0x6b4426, eyes: 'doux', eyeCol: 0x655449, acc: 'echarpe', accCol: 0x4fb35f, ex: { apron: 0x6b4426 } },
    'Robusto': { gender: 'g', hair: 'garconne', hairCol: 0x6a7080, top: 'chemise', topCol: 0x6b4426, bottom: 'pantalon', botCol: 0x2a2d33, shoe: 'bottes', shoes: 0x1a1a1a, eyes: 'doux', eyeCol: 0x44352b, acc: 'noeud_pap', accCol: 0xe8a23a, ex: { apron: 0xf7f5ee, moustache: 0x3a3a42 } },
    'Frisette': { gender: 'f', hair: 'afro', hairCol: 0xffb3cc, top: 'robe', topCol: 0xb06ab3, shoe: 'ballerines', shoes: 0xffd23f, eyes: 'doux', eyeCol: 0x735779, acc: 'boucles', lashes: true },
    'Lacet': { gender: 'g', hair: 'meche', hairCol: 0x2a2630, top: 'chemise', topCol: 0xe8a23a, bottom: 'pantalon', botCol: 0x2a2d33, shoe: 'bottes', shoes: 0x7a4a2a, eyes: 'rond', eyeCol: 0x423d4d, acc: 'cravate', accCol: 0x2a2d33 },
    'Feuillu': { gender: 'g', hair: 'decoiffe', hairCol: 0x8a6a4a, hat: 'chapeau', hatCol: 0x4fb35f, top: 'salopette', topCol: 0xf3ead2, botCol: 0x4f8a4f, shoe: 'bottes', shoes: 0x3a5a3a, eyes: 'endormis', eyeCol: 0x514638 },
    'Léon': { gender: 'g', hair: 'court', hairCol: 0x6b4426, top: 'veste', topCol: 0x3d4f7a, bottom: 'pantalon', botCol: 0x2f3a58, shoe: 'bottes', shoes: 0x1a1a1a, eyes: 'rond', eyeCol: 0x49372d, acc: 'cravate', accCol: 0xffd23f },
    'Dr Rigolo': { gender: 'g', hair: 'crete', hairCol: 0xff8fb8, top: 'veste', topCol: 0x5b3f8f, bottom: 'pantalon', botCol: 0x2a2d33, shoe: 'baskets', shoes: 0x6fbfda, eyes: 'anime', eyeCol: 0x6b416d, acc: 'soleil' },
  };
  const SPECIES = { lapin: { hat: 'lapin' }, chat: { hat: 'oreilles', tail: 'chat' }, renard: { hat: 'renard', tail: 'renard' }, chien: { hat: 'chien' }, ours: { hat: 'ours' }, mouton: { hair: 'boucles' }, caniche: { hair: 'afro' }, alpaga: { hair: 'boucles' }, hibou: { acc: 'lunettes' }, tortue: { hair: 'chauve', acc: 'lunettes' } };
  G.npcLook = o => {
    const key = o.n || JSON.stringify([o.sp, o.col, o.shirt]), r = G.rng(G.hashStr(key)), pick = a => a[Math.floor(r() * a.length)];
    const base = NPCL[o.n] || (G.NPCLX && G.NPCLX[o.n]) || {}, sp = SPECIES[o.sp] || {}, fem = base.gender ? base.gender === 'f' : (o.pitch || 1) >= 1.12;
    const furL = C3(o.col || 0x8a6a46).getHSL({}).l;
    const L = G.normLook(Object.assign({
      gender: fem ? 'f' : 'g', skin: pick(SKINS), hair: sp.hair || pick(fem ? ['long', 'queue', 'carre', 'ondule', 'chignon', 'mi_long', 'couettes', 'long_lisse'] : ['court', 'meche', 'garconne', 'decoiffe', 'herisse']),
      hairCol: furL > .85 ? 0xf5e6c0 : o.col || 0x6b4426, eyes: o.eyes || pick(['rond', 'doux', 'anime', 'brillants']), eyeCol: o.eyeCol || 0x3a2a1a, mouth: o.mouth || 'sourire',
      top: fem ? pick(['robe', 'chemise', 'pull', 'tshirt']) : pick(['chemise', 'tshirt', 'pull', 'veste']), topCol: o.shirt || 0x4fb35f, bottom: fem ? pick(['jupe', 'pantalon', 'jupe_longue']) : 'pantalon', botCol: o.pants || dark(o.shirt || 0x4fb35f, .45),
      shoe: fem ? pick(['ballerines', 'baskets']) : pick(['bottes', 'baskets']), shoes: dark(o.col || 0x6b4426, .6), hat: sp.hat || 'aucun', hatCol: o.col || 0x8a6a46, acc: o.neckwear ? 'echarpe' : sp.acc || 'aucun', accCol: o.neckwear || 0xe8434a,
      height: (o.pitch || 1) < .85 ? 'grand' : (o.pitch || 1) > 1.3 ? 'petit' : 'moyen', lashes: fem, brows: 'normaux', cheek: 'rose'
    }, base));
    const ex = Object.assign({ apron: o.apron != null ? o.apron : null, tail: base.tail || sp.tail, tailCol: base.tailCol || o.col }, base.ex || {});
    if (ex.apron == null) delete ex.apron;
    return { L, ex };
  };
  let HD = false; // visage en haute définition (joueur)
  G.makeChar = (o = {}) => {
    const sp = o.sp || 'humain';
    if (sp === 'humain') { HD = !!o.hd; try { return build(G.normLook(o.look || o)); } finally { HD = false; } }
    const { L, ex } = G.npcLook(o); return build(L, ex);
  };
  G.drawFaceCanvas = drawFace;
})();
