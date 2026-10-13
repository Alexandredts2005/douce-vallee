'use strict';
// ===== Escaliers en pierre à l'ancienne, qui montent d'un niveau : court (1 case) ou long (2 cases).
// Marches en pierre de taille avec nez de marche, murets d'échiffre en moellons coiffés d'une couvertine inclinée,
// piliers de départ et d'arrivée surmontés d'une boule, socle, mousse dans les recoins. Pierre blonde (calcaire) ou grise (granit).
// On monte marche par marche (collision exacte), les murets arrêtent sur les côtés. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, PI = Math.PI, T = G.TIER, WALL = .14;
  const STYLES = [{ n: 'blonde', st: [0xdcd1b8, 0xd2c5a7, 0xc9bb9b, 0xe0d7c3], wall: 0xc8b893, cap: 0xe2d8c2, joint: 0x9b8f78 },
    { n: 'grise', st: [0xb9b6ae, 0xadaaa1, 0xa3a097, 0xc2bfb7], wall: 0x9d9a92, cap: 0xc6c3bb, joint: 0x6f6c66 }];
  const MOSS = [0x5f7d3b, 0x71904a, 0x4f6a30];
  const N = D => D === 1 ? 6 : 8; // nombre de marches
  // muret incliné (d'avant en arrière) : bas à y = 0, dessus de h0 (devant, +z) à h1 (derrière, −z), épaisseur th le long de x
  function wall(b, x, D, h0, h1, th, col) {
    const s = new THREE.Shape(); s.moveTo(D / 2, 0); s.lineTo(D / 2, h0); s.lineTo(-D / 2, h1); s.lineTo(-D / 2, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2 });
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(-PI / 2)); g.translate(x + th / 2, 0, 0); b.geo(g, col, b.M(), 0, false);
  }
  function stairs(b, D, S) {
    const n = N(D), rr = T / n, t = D / n, W = 1 - 2 * WALL, r = G.rng(91 + D * 7 + S.n.length);
    // marches : un bloc plein par marche, une dalle de dessus qui déborde un peu (nez de marche)
    b.P(G.PAT.pierre);
    for (let i = 0; i < n; i++) { const zf = D / 2 - i * t, top = (i + 1) * rr, col = S.st[Math.floor(r() * S.st.length)];
      G.rbox(b, W, top - .05, t, .015, new THREE.Color(col).multiplyScalar(.9).getHex(), 0, (top - .05) / 2, zf - t / 2); }
    b.P(0); b.jit(.05);
    for (let i = 0; i < n; i++) { const zf = D / 2 - i * t, top = (i + 1) * rr, col = S.st[Math.floor(r() * S.st.length)];
      G.rbox(b, W + .01, .055, t + .03, .018, col, 0, top - .0275, zf - t / 2 + .015); }
    b.jit(0);
    // murets d'échiffre en moellons, couvertine inclinée en pierre de taille
    const h0 = .5, h1 = T + .5, L = Math.hypot(D, h1 - h0), a = Math.atan2(h1 - h0, D);
    for (const sx of [-1, 1]) { const x = sx * (.5 - WALL / 2);
      b.P(G.PAT.moellons); wall(b, x, D, h0, h1, WALL, S.wall); b.P(0);
      b.P(G.PAT.pierre); G.rbox(b, WALL + .05, .07, L + .04, .02, S.cap, x, (h0 + h1) / 2 + .03, 0, a, 0, 0); b.P(0);
      // socle débordant au pied du muret
      b.P(G.PAT.moellons); b.box(WALL + .05, .1, D, new THREE.Color(S.wall).multiplyScalar(.85).getHex(), x + sx * .008, .05, 0); b.P(0);
      // piliers de départ et d'arrivée, chapiteau et boule
      for (const [z, y0, hh] of [[D / 2 - .1, 0, .82], [-D / 2 + .1, 0, T + .8]]) {
        b.P(G.PAT.pierre); G.rbox(b, .2, hh, .2, .02, S.wall, x, y0 + hh / 2, z); b.P(0);
        G.rbox(b, .26, .06, .26, .02, S.cap, x, y0 + hh + .03, z); G.rbox(b, .2, .03, .2, .01, S.cap, x, y0 + hh + .075, z);
        b.sph(.085, S.cap, x, y0 + hh + .17, z, 1, 1, 1, 0, 16, 12); b.cyl(.04, .055, .05, 14, S.cap, x, y0 + hh + .1, z); } }
    // mousse et petites herbes dans les recoins (contre les murets, au fond des marches)
    for (let i = 0; i < n; i++) { if (r() < .45) continue; const zb = D / 2 - (i + 1) * t + .03, top = (i + 1) * rr, sx = r() < .5 ? -1 : 1;
      b.sph(.035 + r() * .02, MOSS[Math.floor(r() * 3)], sx * (W / 2 - .03), top + .008, zb, 1.3, .35, 1, 0, 8, 6); }
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) b.sph(.04 + r() * .03, MOSS[k % 3], sx * (.5 + .02), .03, D / 2 - .15 - k * D * .3, 1, .5, 1.4, 0, 8, 6);
  }
  MD.esc_pierre = v => { const b = G.mb(930 + (v || 0)); stairs(b, v & 1 ? 2 : 1, STYLES[(v >> 1) & 1]); return b.done(); };
  // hauteur sous les pieds : la marche (exacte) ou le dessus du muret sur les côtés
  const hAt = D => (o, x, z) => {
    const d = O[o.t], [w, dd] = G.fpDims(d, o.r), dx = x - (o.x + w / 2), dz = z - (o.z + dd / 2), r = o.r & 3;
    const lx = r === 0 ? dx : r === 1 ? -dz : r === 2 ? -dx : dz, lz = r === 0 ? dz : r === 1 ? dx : r === 2 ? -dz : -dx;
    const n = N(D), f = G.clamp((D / 2 - lz) / D, 0, 1);
    if (Math.abs(lx) > .5 - WALL) return .5 + f * T + .07; // muret
    return (G.clamp(Math.floor((D / 2 - lz) / (D / n)), 0, n - 1) + 1) * T / n;
  };
  const defs = [['escalier_pierre', 'Escalier en pierre blonde (court)', 0, 1, 700, 8], ['escalier_pierre_long', 'Escalier en pierre blonde (long)', 1, 2, 1000, 14],
    ['escalier_granit', 'Escalier en pierre grise (court)', 2, 1, 700, 8], ['escalier_granit_long', 'Escalier en pierre grise (long)', 3, 2, 1000, 14]];
  for (const [id, n, v, D, sell, pierre] of defs) {
    O[id] = { id, n, model: 'esc_pierre', v, fp: [1, D], h: T + .6, walk: 1, hAt: hAt(D), cat: 'construction' };
    G.ITEMS[id] = { id, n, kind: 'place', obj: id, cat: 'construction', thumb: 'obj:' + id, sell, stack: 99, desc: 'Monte d\'un niveau. Pose-le au pied d\'une falaise, tourné vers toi (R pour le tourner).' };
    G.RECIPES.push({ id, need: { pierre } });
    if (G.SHOPLIST && !G.SHOPLIST.includes(id)) G.SHOPLIST.push(id);
  }
})();
