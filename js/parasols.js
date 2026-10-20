'use strict';
// ===== Parasols : le parasol de plage refait (toile rayée bombée, lambrequin festonné, piquet dans le sable) et six nouveaux :
// parasol de café rayé à pied de fonte, grand parasol carré de marché à toit aéré, parasol déporté à bras courbe,
// paillote de paille, ombrelle de jardin à dentelle, parasol japonais de papier rouge. Toiles faites de pans bombés,
// baleines visibles par-dessous, mât, embase. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, TAU = PI * 2;
  const SK = () => G.SK || {};
  // toile ronde : n pans de l'apex (hauteur top) jusqu'au bord (rayon R, drop plus bas), légèrement bombés ; cols : couleur de chaque pan
  function roundCanopy(b, n, R, top, drop, cols, o = {}) { const AS = 4, RS = 6, sag = o.sag == null ? .12 : o.sag, sk = SK();
    for (let g = 0; g < n; g++) { const a0 = g / n * TAU, a1 = (g + 1) / n * TAU, pos = [];
      const P = (u, v) => { const a = a0 + (a1 - a0) * u, r = R * v, bow = Math.sin(u * PI) * sag * v, y = top - drop * Math.pow(v, 1.5) + bow * .35, rr = r * (1 + bow * .15); return [Math.cos(a) * rr, y, Math.sin(a) * rr]; };
      for (let i = 0; i < RS; i++) for (let j = 0; j < AS; j++) { const p00 = P(j / AS, i / RS), p10 = P((j + 1) / AS, i / RS), p01 = P(j / AS, (i + 1) / RS), p11 = P((j + 1) / AS, (i + 1) / RS); pos.push(...p00, ...p01, ...p11, ...p00, ...p11, ...p10); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      b.S(sk.fabric); b.add(geo, cols[g % cols.length], b.M(), 0, true);
      const under = geo.clone(); const pa = under.attributes.position; for (let k = 0; k < pa.count; k += 3) { const x = pa.getX(k + 1), y = pa.getY(k + 1), z = pa.getZ(k + 1); pa.setXYZ(k + 1, pa.getX(k + 2), pa.getY(k + 2), pa.getZ(k + 2)); pa.setXYZ(k + 2, x, y, z); } // dessous de la toile
      for (let k = 0; k < pa.count; k++) pa.setY(k, pa.getY(k) - .008); under.computeVertexNormals(); b.add(under, cols[g % cols.length], b.M(), 0, true); b.S(null);
      if (o.ribs !== false) { const p0 = new THREE.Vector3(0, top - .02, 0), p1 = new THREE.Vector3(Math.cos(a0) * R, top - drop - .02, Math.sin(a0) * R); rib(b, p0, p1, o.ribCol || 0xf2ede2, o.ribR || .009); }
      if (o.scallop) { const am = (a0 + a1) / 2, rr = R * .99, y = top - drop; b.S(sk.fabric); const rs = R * Math.sin(PI / n) * 1.0; b.add(new THREE.CylinderGeometry(rs, rs, .006, 12, 1, false, PI / 2, PI), o.scallop === true ? cols[g % cols.length] : o.scallop, b.M(Math.cos(am) * rr, y + .005, Math.sin(am) * rr, 0, PI / 2 - am, 0, 1, Math.min(.38, .16 / rs), 1).multiply(new THREE.Matrix4().makeRotationX(-PI / 2)), 0, true); b.S(null); } } }
  const rib = (b, p, q, col, r) => { const d = q.clone().sub(p), L = d.length(); b.add(new THREE.CylinderGeometry(r, r, L, 5), col, new THREE.Matrix4().compose(p.clone().add(q).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)), 0, true); };

  // ---------- parasol de plage refait : rayé, incliné, piqué dans le sable ----------
  MD.parasol = v => { const b = G.mb(60), sk = SK(), tilt = .16, M0 = new THREE.Matrix4().makeRotationZ(tilt);
    const oa = b.add; b.add = (g, c, m, mat, sm) => oa.call(b, g, c, M0.clone().multiply(m), mat, sm); // tout le parasol penche un peu
    b.S(sk.paint); b.cyl(.025, .028, 2.2, 10, 0xf7f5ee, 0, 1.05, 0); b.S(null); b.cyl(.035, .035, .08, 10, 0xd8d2c4, 0, 1.3, 0);
    roundCanopy(b, 8, 1.15, 2.2, .42, [0x2f7fc9, 0xf7f5ee], { scallop: true });
    b.sph(.05, 0xf7f5ee, 0, 2.24, 0); b.add = oa; b.cone(.05, .2, 8, 0xc8b89a, Math.sin(-tilt) * -.1, -.05, 0, PI); return b.done(); };

  // ---------- parasol de café rayé, pied de fonte ----------
  MD.parasol_cafe = v => { const b = G.mb(3101), sk = SK(); b.S(sk.iron); b.cyl(.28, .32, .06, 24, 0x2a2d33, 0, .03, 0); b.cyl(.12, .2, .12, 20, 0x2a2d33, 0, .12, 0); b.S(null);
    b.S(sk.wood); b.cyl(.028, .03, 2.25, 12, 0x8a5a32, 0, 1.15, 0); b.S(null); b.cyl(.04, .04, .1, 12, 0xc9a24a, 0, 1.55, 0);
    roundCanopy(b, 10, 1.25, 2.3, .38, [0xc8202a, 0xf6eee0], { scallop: 0xf6eee0, ribCol: 0x8a5a32 }); b.sph(.05, 0xc9a24a, 0, 2.34, 0); return b.done(); };
  // ---------- grand parasol carré de marché, toit aéré ----------
  MD.parasol_marche = v => { const b = G.mb(3102), sk = SK(), C = 0xe8dcc0, W = 1.35, top = 2.5, drop = .5;
    b.S(sk.stone); b.box(.6, .12, .6, 0x8a8478, 0, .06, 0); b.S(sk.wood); b.cyl(.035, .04, 2.55, 12, 0xb08a5a, 0, 1.3, 0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; rib(b, new THREE.Vector3(0, top - .03, 0), new THREE.Vector3(Math.cos(a) * W * 1.38, top - drop - .03, Math.sin(a) * W * 1.38), 0xb08a5a, .014); rib(b, new THREE.Vector3(0, 1.75, 0), new THREE.Vector3(Math.cos(a) * W * .7, top - drop * .45, Math.sin(a) * W * .7), 0xb08a5a, .012); }
    b.S(sk.fabric); for (let k = 0; k < 4; k++) { const a0 = k / 4 * TAU + PI / 4, a1 = a0 + PI / 2, c0 = [Math.cos(a0) * W * 1.414, top - drop, Math.sin(a0) * W * 1.414], c1 = [Math.cos(a1) * W * 1.414, top - drop, Math.sin(a1) * W * 1.414], ap = [0, top, 0], mid = [(c0[0] + c1[0]) * .5 * .55, top - drop * .5 - .04, (c0[2] + c1[2]) * .5 * .55];
      for (const side of [1, -1]) { const geo = new THREE.BufferGeometry(), t = side > 0 ? [ap, c0, mid, mid, c0, c1, ap, mid, c1] : [ap, mid, c0, mid, c1, c0, ap, c1, mid]; geo.setAttribute('position', new THREE.Float32BufferAttribute(t.flat().map((x, i) => i % 3 === 1 && side < 0 ? x - .01 : x), 3)); geo.computeVertexNormals(); b.add(geo, C, b.M(), 0, false); }
      const am = (a0 + a1) / 2, ex = Math.cos(am) * W, ez = Math.sin(am) * W; b.box(W * 2, .14, .01, 0xd8ccb0, ex, top - drop - .06, ez, 0, PI / 2 - am, 0); } // bavolet
    b.add(new THREE.ConeGeometry(.42, .2, 4, 1), C, b.M(0, top + .2, 0, 0, PI / 4, 0), 0, false); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; b.cyl(.008, .008, .12, 6, 0xb08a5a, Math.cos(a) * .2, top + .05, Math.sin(a) * .2); } b.S(null); b.sph(.045, 0xb08a5a, 0, top + .32, 0); return b.done(); };
  // ---------- parasol déporté : mât sur le côté, bras courbe, toile carrée suspendue ----------
  MD.parasol_deporte = v => { const b = G.mb(3103), sk = SK(), C = 0x2f3a4a, AL = 0x6a7078; b.S(sk.steel);
    for (const a of [0, PI / 2]) b.box(1.0, .06, .1, 0x3a3d42, -.35, .04, 0, 0, a, 0); for (const [x, z] of [[-.8, .45], [-.8, -.45], [.1, .45], [.1, -.45]]) b.box(.32, .1, .32, 0x8a8478, x, .06, z);
    b.cyl(.045, .05, 2.6, 14, AL, -.35, 1.32, 0); const P = []; for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * PI * .55; P.push(new THREE.Vector3(-.35 + Math.sin(a) * 1.0, 2.62 + (1 - Math.cos(a)) * -.05 + Math.sin(a) * .28, 0)); }
    for (let i = 0; i < 10; i++) rib(b, P[i], P[i + 1], AL, .035); const hx = P[10].x, hy = P[10].y; b.cyl(.02, .02, .3, 8, AL, hx, hy - .15, 0); b.S(null);
    roundCanopy(b, 4, 1.45, hy - .2, .38, [C], { ribCol: AL, sag: .2 }); // pas d'éléments sous la toile côté mât
    b.cyl(.06, .06, .05, 10, 0x8a8e94, -.35, 1.2, 0); return b.done(); };
  // ---------- paillote de paille ----------
  MD.parasol_paille = v => { const b = G.mb(3104), sk = SK(); b.S(sk.wood); b.cyl(.07, .09, 2.4, 10, 0x8a6a46, 0, 1.2, 0); b.S(null);
    const r = G.rng(3104); b.S(sk.fabric); for (let L = 0; L < 4; L++) { const R = 1.3 - L * .25, y = 2.1 + L * .17, n = 22 - L * 3;
      b.add(new THREE.ConeGeometry(R, .5, 24, 1, true), L % 2 ? 0xd8b866 : 0xc9a656, b.M(0, y + .2, 0), 0, true);
      for (let i = 0; i < n * 3; i++) { const a = i / (n * 3) * TAU + r() * .05, len = .16 + r() * .14; b.add(new THREE.BoxGeometry(.035, len, .006), r() < .5 ? 0xd8b866 : 0xb89648, b.M(Math.cos(a) * R * 1.0, y - .03 - len / 2, Math.sin(a) * R * 1.0, (r() - .5) * .2, PI / 2 - a, 0), 0, false); } } // franges de paille qui pendent
    b.cone(.12, .22, 10, 0xb89648, 0, 2.95, 0); b.S(null); b.tor(.08, .02, 0x6a4a2a, 0, 2.0, 0, PI / 2, 0, 0, 0, 14); return b.done(); };
  // ---------- ombrelle de jardin à dentelle ----------
  MD.parasol_dentelle = v => { const b = G.mb(3105), sk = SK(); b.S(sk.iron); b.cyl(.22, .26, .05, 20, 0xf2eee6, 0, .025, 0); b.cyl(.025, .025, 2.2, 10, 0xf2eee6, 0, 1.12, 0); b.S(null);
    roundCanopy(b, 12, 1.1, 2.25, .32, [0xfaf7f2, 0xf3eee6], { scallop: 0xfffcf8, ribCol: 0xe8e2d6, sag: .16 });
    b.S(sk.fabric); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; b.add(new THREE.TorusGeometry(.045, .006, 4, 8, PI), 0xfffcf8, b.M(Math.cos(a) * 1.13, 1.88, Math.sin(a) * 1.13, 0, PI / 2 - a, PI), 0, true); } // dentelle du bord
    for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * TAU; b.sph(.012, 0xf2c8d8, Math.cos(a) * .6, 2.08, Math.sin(a) * .6); } b.S(null); b.sph(.045, 0xc9a24a, 0, 2.3, 0); return b.done(); };
  // ---------- parasol japonais de papier ----------
  MD.parasol_japonais = v => { const b = G.mb(3106), sk = SK(); b.S(sk.wood); b.cyl(.02, .022, 2.15, 8, 0xc8b070, 0, 1.08, 0); b.box(.05, .05, .05, 0x3a2a1a, 0, .03, 0); b.S(null);
    roundCanopy(b, 24, 1.2, 2.2, .3, [0xc8202a, 0xd02a32], { ribCol: 0xc8b070, ribR: .005, sag: .04 });
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; rib(b, new THREE.Vector3(0, 1.75, 0), new THREE.Vector3(Math.cos(a) * .45, 2.05, Math.sin(a) * .45), 0xc8b070, .004); }
    b.tor(.35, .01, 0x1d1d22, 0, 2.11, 0, PI / 2, 0, 0, 0, 28); b.cyl(.06, .08, .06, 12, 0x1d1d22, 0, 2.24, 0); return b.done(); };

  // ---------- objets ----------
  O.parasol.n = 'Parasol de plage rayé'; if (G.ITEMS.parasol) G.ITEMS.parasol.n = O.parasol.n;
  const add = (id, n, h, sell, desc) => { O[id] = { id, n, model: id, v: 0, fp: [1, 1], h, take: 1, cat: 'mobilier' }; G.ITEMS[id] = { id, n, kind: 'place', obj: id, cat: 'mobilier', thumb: 'obj:' + id, sell, stack: 9, desc }; if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id); };
  add('parasol_cafe', 'Parasol de café rayé', 2.3, 600, 'Rayé rouge et crème, festonné, sur un pied de fonte : parfait au-dessus d\'une table de bistrot.');
  add('parasol_marche', 'Grand parasol de marché', 2.5, 900, 'Toile carrée de lin, baleines de bois, petit toit aéré au sommet.');
  add('parasol_deporte', 'Parasol déporté', 2.9, 1200, 'Mât sur le côté et bras courbe : l\'ombre tombe sans pied au milieu.');
  add('parasol_paille', 'Paillote', 2.6, 700, 'Toit de paille à franges, comme sur les plages des îles.');
  add('parasol_dentelle', 'Ombrelle de jardin à dentelle', 2.2, 800, 'Blanche, festonnée et bordée de dentelle, pour un jardin romantique.');
  add('parasol_japonais', 'Parasol japonais', 2.2, 700, 'Papier rouge tendu sur vingt-quatre baleines de bambou.');
})();
