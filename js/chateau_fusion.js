'use strict';
// ===== Châteaux qui s'assemblent : des châteaux du même style, tournés pareil, posés côte à côte sans case vide entre eux
// (en largeur comme en profondeur) ne font plus qu'UN château, plus grand, plus haut et plus richement décoré à chaque ajout, sans limite :
// 2 → grand château, 4 → château royal avec cour d'honneur, 8 → palais royal, 16 → palais impérial, 32 → palais légendaire…
// Le grand château est un seul modèle posé sur le château du coin ; les autres châteaux du groupe sont cachés mais restent là
// (on peut en retirer un : le groupe se redécoupe). Un groupe en L ou en escalier est découpé en rectangles, le plus grand d'abord.
// Collisions à la forme du grand château ; la grande porte, au milieu de la façade, mène au château principal, dont le salon s'agrandit. =====
(function () {
  const MD = G.MODELS, O = G.OBJ, A = G.ARCH, PT = A.PT, TAU = Math.PI * 2, PI = Math.PI;
  const { onW, fenetre, porte, GLASS, GOLD, IRONC } = A;
  const TH = .36, MAXH = 39; // terrasse (on y monte d'un pas) ; collisions plafonnées (au-delà de 40, le joueur n'est plus montré à travers les murs)
  const RY = [0, PI, PI / 2, -PI / 2], NR = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const CAST = ['chateau_cat0', 'chateau_cat1', 'chateau_cat2', 'chateau_grand'], HIDE = 'chxl_vide:0';
  const PAL = [
    { wall: 0xf0e4c8, trim: 0xe6d8b8, pil: 0xf7efdc, base: 0xd9cfba, step: 0xe9e1cf, roof: 0x4a5464, door: 0x2f4f7a, ds: 'vitre', wp: PT.pierre, frame: 0xf7f2e6, curt: 0xfff1d6, ww: .44, arch: 1, pane: 'petits', fl: [0xffffff, 0xe8434a, 0xffd23f], flag: [0x2f4f7a, 0xffffff] },
    { wall: 0xf4eedd, trim: 0xe5dcc5, pil: 0xf9f4e6, base: 0xcfc6b2, step: 0xe5dcc5, roof: 0x3d4450, door: 0x6b4426, ds: 'planches', wp: PT.pierre, frame: 0xf7f2e6, curt: 0xf9edd6, ww: .52, arch: 0, pane: null, fl: [0xff8fc0, 0xffffff, 0xb583e6], flag: [0x3b5fa8, 0xf2d14c] },
    { wall: 0xc0614a, trim: 0xeee6d4, pil: 0xeee6d4, base: 0xd2c9b6, step: 0xeee6d4, roof: 0x3f4552, door: 0x3f5f45, ds: 'panneaux', wp: PT.brique, frame: 0xffffff, curt: 0xfff1d6, ww: .48, arch: 0, pane: 'petits', quoins: 1, fl: [0xe8434a, 0xffffff, 0xffd23f], flag: [0xb8323c, 0xf2d14c] }];
  const RANKS = ['Château', 'Grand château', 'Château royal', 'Palais royal', 'Palais impérial', 'Palais légendaire', 'Palais des merveilles'], SUF = [' à la française', ' de la Loire', ' Louis XIII'];
  G.chateauName = (st, n) => RANKS[Math.min(RANKS.length - 1, Math.floor(Math.log2(n)))] + SUF[st];

  // ---------- outils de dessin ----------
  const blk = (xc, zc, w, d, fh, wh) => ({ xc, zc, w, d, fh, wh });
  const bx = (b, w, h, d, col, x, y, z, ry = 0, mat = 0) => b.add(new THREE.BoxGeometry(w, h, d), col, b.M(x, y, z, 0, ry, 0), mat); // boîte simple (12 triangles) pour les pièces répétées
  function frustum(b, w0, d0, w1, d1, h, col, x, y, z, pat = 0) { // tronc de pyramide : toits à la Mansart, en pavillon, à croupes
    const a = w0 / 2, c = d0 / 2, e = w1 / 2, f = d1 / 2, p = [];
    const q = (A1, B1, C1, D1) => { p.push(...A1, ...B1, ...C1, ...A1, ...C1, ...D1); };
    q([-a, 0, c], [a, 0, c], [e, h, f], [-e, h, f]); q([a, 0, -c], [-a, 0, -c], [-e, h, -f], [e, h, -f]);
    q([a, 0, c], [a, 0, -c], [e, h, -f], [e, h, f]); q([-a, 0, -c], [-a, 0, c], [-e, h, f], [-e, h, -f]);
    if (e > 0 && f > 0) q([-e, h, f], [e, h, f], [e, h, -f], [-e, h, -f]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    b.P(pat); b.geo(g, col, b.M(x, y, z)); b.P(0);
  }
  const dot = (b, r, col, x, y, z, det = 0) => b.add(new THREE.IcosahedronGeometry(r, det), col, b.M(x, y, z)); // petite boule à facettes (fleurs, fruits, boules dorées)
  function epi(b, x, y, z, s = 1) { b.cyl(.025 * s, .04 * s, .3 * s, 6, GOLD, x, y + .15 * s, z); dot(b, .07 * s, GOLD, x, y + .34 * s, z, 1); b.cone(.04 * s, .18 * s, 6, GOLD, x, y + .5 * s, z); }
  function flag(C, x, y, z, s) { const b = C.b, [c1, c2] = C.S.flag; b.cyl(.02 * s, .025 * s, 1.1 * s, 6, IRONC, x, y + .55 * s, z); bx(b, .7 * s, .4 * s, .03 * s, c1, x + .36 * s, y + .88 * s, z); bx(b, .7 * s, .1 * s, .035 * s, c2, x + .36 * s, y + .88 * s, z); dot(b, .05 * s, GOLD, x, y + 1.13 * s, z); }
  function vase(b, x, y, z, s, col) { b.cyl(.06 * s, .1 * s, .06 * s, 8, col, x, y + .03 * s, z); dot(b, .13 * s, col, x, y + .2 * s, z, 1); b.cyl(.12 * s, .08 * s, .06 * s, 10, col, x, y + .33 * s, z); }
  function statueG(b, x, y, z, s, col = 0xece6d8) { b.P(PT.pierre); bx(b, .36 * s, .5 * s, .36 * s, 0xd9d2c2, x, y + .25 * s, z); b.P(0); b.cyl(.09 * s, .14 * s, .5 * s, 8, col, x, y + .75 * s, z); dot(b, .09 * s, col, x, y + 1.08 * s, z, 1); b.add(new THREE.BoxGeometry(.36 * s, .06 * s, .06 * s), col, b.M(x, y + .9 * s, z, 0, 0, .5)); }
  function statue(C, x, z, s) { statueG(C.b, x, 0, z, s); C.rect(x - .2 * s, z - .2 * s, x + .2 * s, z + .2 * s, 1.2 * s); }
  function topiaire(C, x, z, s) { const b = C.b; b.cyl(.2 * s, .16 * s, .3 * s, 8, 0xd9d2c2, x, .15 * s, z); b.cone(.24 * s, .9 * s, 10, 0x2f6b3a, x, .75 * s, z); dot(b, .1 * s, 0x2f6b3a, x, 1.25 * s, z, 1); C.circ(x, z, .22 * s, 1.3 * s); }
  function crest(C, x0, z0, x1, z1, y) { const b = C.b, L = Math.hypot(x1 - x0, z1 - z0), n = Math.min(30, Math.floor(L / C.u)); if (L < .1) return;
    bx(b, Math.abs(x1 - x0) + .06, .06, Math.abs(z1 - z0) + .06, GOLD, (x0 + x1) / 2, y + .03, (z0 + z1) / 2);
    for (let k = 0; k <= n; k++) { const t = n ? k / n : .5; b.cone(.05 * C.u, .22 * C.u, 6, GOLD, x0 + (x1 - x0) * t, y + .15 * C.u, z0 + (z1 - z0) * t); } }
  function chimney(C, x, z, y0, y1, col, cap, along) { const b = C.b, u = C.u, w = .36 * u, d = .7 * u; b.P(C.st === 2 ? PT.brique : PT.pierre); bx(b, along ? d : w, y1 - y0, along ? w : d, col, x, (y0 + y1) / 2, z); bx(b, (along ? d : w) + .08 * u, .1 * u, (along ? w : d) + .08 * u, cap, x, y1 + .05 * u, z); b.P(0);
    for (const k of [-.18, .18]) b.cyl(.05 * u, .06 * u, .16 * u, 6, 0xc0603c, x + (along ? k * u : 0), y1 + .18 * u, z + (along ? 0 : k * u)); }

  // ---------- plan : où vont les corps de logis, les pavillons, les ailes, la cour ----------
  function plan(cols, rows) {
    const Wl = cols * 9, Dl = rows * 7, n = cols * rows, lvl = n === 1 ? 0 : Math.max(1, Math.floor(Math.log2(n))), kind = cols >= 2 && rows >= 2 ? 'U' : rows === 1 ? 'X' : 'Z';
    let u = Math.pow(n, .25); u = Math.min(u, kind === 'X' ? Dl / 6.2 : kind === 'Z' ? (Wl - .7) / 7.5 : Math.min((Wl - .7) / 8.8, (Dl - .5) / 6.8)); // échelle : tout grandit, dans la limite du terrain
    const nf = 2 + Math.floor(Math.log2(n) / 2), pdx = .3 * u, bd = 3 * u, X0 = -Wl / 2, X1 = Wl / 2, Z0 = -Dl / 2, Z1 = Dl / 2;
    const P = { Wl, Dl, n, lvl, kind, u, nf, X0, X1, Z0, Z1, B: [], T: [], ter: [], D: null };
    const add = (x0, x1, z0, z1, k, nfB, door = -1) => { if (x1 - x0 < .05 || z1 - z0 < .05) return null; const B = { x0, x1, z0, z1, k, nf: nfB, door }; P.B.push(B); if (door >= 0) P.D = B; return B; };
    // barre le long de x (symétrique autour de 0) : pavillons aux bouts, avant-corps au milieu, pavillons intermédiaires si c'est long
    const barX = (xa, xb, zb0, zb1, pwE, nfB, pz0, pz1) => {
      const aw = Math.min(2.6 * u * (1 + .06 * lvl), (xb - xa) * .28), span = xb - pwE - aw / 2, k = Math.max(0, Math.floor(span / (8.5 * u))), cuts = [[xa, xa + pwE, 'pav'], [xb - pwE, xb, 'pav'], [-aw / 2, aw / 2, 'centre']];
      for (let i = 1; i <= k; i++) { const c = aw / 2 + span * i / (k + 1); cuts.push([c - .75 * u, c + .75 * u, 'pav2'], [-c - .75 * u, -c + .75 * u, 'pav2']); }
      cuts.sort((a, b) => a[0] - b[0]); let x = xa; const out = {};
      for (const [c0, c1, kk] of cuts) { if (c0 > x + .05) add(x, c0, zb0, zb1, 'corps', nfB);
        const B = kk === 'pav' ? add(c0, c1, pz0, pz1, 'pav', nfB) : kk === 'pav2' ? add(c0, c1, zb0 - pdx * .5, zb1 + pdx * .5, 'pav2', nfB) : add(c0, c1, zb0 - pdx * .5, zb1 + pdx * 1.4, 'centre', nfB + (n > 1 ? 1 : 0), 0);
        if (kk === 'pav') out[c0 < 0 ? 'L' : 'R'] = B; x = Math.max(x, c1); }
      if (xb > x + .05) add(x, xb, zb0, zb1, 'corps', nfB); return out; };
    // barre le long de z, de za (fond) à zb (devant) : au bout devant, un pavillon ou l'avant-corps à la porte
    const barZ = (x0, x1, za, zb, nfB, front) => { const pwF = front ? 1.7 * u : 0, len = zb - pwF - za, k = Math.max(0, Math.floor(len / (8.5 * u))); let z = za;
      for (let i = 1; i <= k; i++) { const c = za + len * i / (k + 1); add(x0, x1, z, c - .75 * u, 'corps', nfB); add(x0 - pdx * .5, x1 + pdx * .5, c - .75 * u, c + .75 * u, 'pav2', nfB); z = c + .75 * u; }
      add(x0, x1, z, zb - pwF, 'corps', nfB); return front ? add(x0 - pdx, x1 + pdx, zb - pwF, zb, 'pav', nfB) : null; };
    const cl = (x0, z0, x1, z1) => P.ter.push([Math.max(X0 + .1, x0), Math.max(Z0 + .1, z0), Math.min(X1 - .1, x1), Math.min(Z1 - .1, z1)]);
    if (kind === 'X') { // une seule rangée : longue façade
      const xa = X0 + .35, xb = X1 - .35, zf = Z1 - 1.6 * u, zb1 = zf - pdx, zb0 = zb1 - bd, E = barX(xa, xb, zb0, zb1, 1.7 * u, nf, zb0 - pdx, zb1 + pdx);
      cl(xa - .4 * u, zb0 - pdx - .4 * u, xb + .4 * u, zf + .4 * u); P.zT = Math.min(Z1 - .1, zf + .4 * u);
      for (const B of [E.L, E.R]) for (const z of [B.z0, B.z1]) P.T.push({ x: B.x0 < 0 ? B.x0 : B.x1, z, B });
    } else if (kind === 'Z') { // une seule colonne : le château en façade, une longue aile en arrière (en T)
      const xa = X0 + .35, xb = X1 - .35, zf = Z1 - 1.6 * u, zb1 = zf - pdx, zb0 = zb1 - bd, E = barX(xa, xb, zb0, zb1, 1.7 * u, nf, zb0 - pdx, zb1 + pdx);
      const hw = Math.min(1.3 * u, (Wl - .7) * .2), zk = Z0 + u, Bk = add(-hw - pdx, hw + pdx, zk, zk + 1.7 * u, 'pav', nf); barZ(-hw, hw, zk + 1.7 * u, zb0 - pdx * .5, nf, null);
      cl(xa - .4 * u, zb0 - pdx - .4 * u, xb + .4 * u, zf + .4 * u); cl(-hw - pdx - .4 * u, zk - .4 * u, hw + pdx + .4 * u, zb0 - pdx - .4 * u); P.zT = Math.min(Z1 - .1, zf + .4 * u);
      for (const B of [E.L, E.R]) for (const z of [B.z0, B.z1]) P.T.push({ x: B.x0 < 0 ? B.x0 : B.x1, z, B }); for (const x of [Bk.x0, Bk.x1]) P.T.push({ x, z: Bk.z0, B: Bk });
    } else { // cour d'honneur : corps de logis au fond, deux ailes vers l'avant, grille ou châtelet devant
      const bx0 = X0 + .35, bx1 = X1 - .35, ww = 2.2 * u, zb0 = Z0 + u + pdx, zb1 = zb0 + bd, zf = Z1 - .6, pwE = ww + 2 * pdx, nw = nf >= 3 ? nf - 1 : nf;
      const E = barX(bx0, bx1, zb0, zb1, pwE, nf, zb0 - pdx, zb1 + pdx);
      const WL = barZ(bx0 + pdx, bx0 + pdx + ww, zb1 + pdx, zf, nw, 'pav'), WR = barZ(bx1 - pdx - ww, bx1 - pdx, zb1 + pdx, zf, nw, 'pav');
      const zt = zb1 + pdx + .4 * u; cl(X0, zb0 - pdx - .4 * u, X1, zt); cl(X0, zt, bx0 + pwE + .4 * u, zf + .3); cl(bx1 - pwE - .4 * u, zt, X1, zf + .3);
      P.zT = zt; P.court = [bx0 + pwE + .4 * u, zt, bx1 - pwE - .4 * u, Z1 - .45]; P.gate = { z: Z1 - .45, x0: bx0 + pwE, x1: bx1 - pwE };
      P.T.push({ x: bx0, z: zb0 - pdx, B: E.L }, { x: bx1, z: zb0 - pdx, B: E.R }, { x: bx0, z: zf, B: WL }, { x: bx0 + pwE, z: zf, B: WL }, { x: bx1 - pwE, z: zf, B: WR }, { x: bx1, z: zf, B: WR });
      // très grande cour : deux ailes intérieures découpent une cour royale au milieu (à la Versailles)
      const cw = P.court[2] - P.court[0], cd = P.court[3] - zt; if (cw > 18 * u && cd > 12 * u) { const w2 = 2 * u, xi = cw / 4, z2 = zt + .45 * cd, nw2 = Math.max(2, nw - 1);
        for (const s of [-1, 1]) { const Bp = barZ(s * xi - w2 / 2, s * xi + w2 / 2, zb1, z2, nw2, 'pav'); P.T.push({ x: Bp.x0, z: z2, B: Bp }, { x: Bp.x1, z: z2, B: Bp }); cl(s * xi - w2 / 2 - pdx - .4 * u, zt, s * xi + w2 / 2 + pdx + .4 * u, z2 + .4 * u); }
        P.inner = { xi: xi - w2 / 2 - pdx - .4 * u, z: z2 + .4 * u, xo: xi + w2 / 2 + pdx + .4 * u }; }
    }
    return P;
  }

  // ---------- contexte d'un château : plan, hauteurs, tours, espacement des fenêtres (sans rien dessiner) ----------
  function ctx(st, cols, rows) {
    const P = plan(cols, rows), S = PAL[st], { u, lvl } = P, FH = 1.8 * u, C = Object.assign({ S, st, FH, rs: [], cs: [], nwin: 0 }, P);
    for (const B of P.B) { B.wh = B.nf * FH + (B.k === 'pav' ? .25 * u : B.k === 'centre' ? .3 * u : 0); B.top = TH + B.wh; B.H = blk((B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2, B.x1 - B.x0, B.z1 - B.z0, TH, B.wh); }
    C.tw = st !== 1 ? [] : P.T.map(t => { const r = Math.min(.85 * u * (1 + .04 * lvl), 1.6 * u); return { x: G.clamp(t.x, P.X0 + r + .05, P.X1 - r - .05), z: G.clamp(t.z, P.Z0 + r + .05, P.Z1 - r - .05), r, h: t.B.top + .9 * u * (1 + .05 * lvl) }; });
    // un point est-il caché par un autre bâtiment (ou une tour) ?
    C.free = (B, x, z) => { for (const Q of C.B) if (Q !== B && x > Q.x0 - .01 && x < Q.x1 + .01 && z > Q.z0 - .01 && z < Q.z1 + .01) return false; for (const T of C.tw) if (Math.hypot(x - T.x, z - T.z) < T.r + .15) return false; return true; };
    let est = 0; for (const B of P.B) est += 2 * (B.H.w + B.H.d) * B.nf; C.sp = Math.max(.85 * u, est / 1100); C.lite = est / C.sp > 520; // pas plus de ~1100 fenêtres
    C.rich = est / C.sp < 420 ? 2 : est / C.sp < 900 ? 1 : 0; // fenêtres ouvragées : tous les étages, l'étage noble et le rez-de-chaussée, ou aucun
    return C;
  }
  // travées d'une façade : [{ a, door, k }] ; une fenêtre cachée par un autre bâtiment ou par une tour est sautée
  function bays(C, B, f) {
    const u = C.u, H = B.H, ww = C.S.ww * u, L = f < 2 ? H.w : H.d, out = []; if (L < ww + .4 * u) return out;
    let nb = Math.max(1, Math.floor((L - .35 * u) / (B.k === 'centre' ? Math.min(C.sp, (L - .35 * u) / 3) : C.sp))); if (B.door === f && nb % 2 === 0) nb = Math.max(1, nb - 1);
    for (let k = 0; k < nb; k++) { const a = -L / 2 + (k + .5) * L / nb; let ok = true; for (const da of [-ww / 2, 0, ww / 2]) { const p = onW(H, f, a + da, 0, .12); if (!C.free(B, p[0], p[2])) { ok = false; break; } }
      if (ok) out.push({ a, door: B.door === f && k === (nb - 1) / 2, k }); }
    return out;
  }
  // ---------- le grand château ----------
  function build(st, cols, rows) {
    const C = ctx(st, cols, rows), b = C.b = G.mb(700 + st * 31 + cols * 7 + rows * 3), { u, S } = C, D = C.D;
    C.rect = (x0, z0, x1, z1, h) => C.rs.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), h]);
    C.circ = (x, z, r, h) => C.cs.push([x, z, r, h]);
    C.zP = Math.min(C.Z1 - .9, Math.max(C.zT, D.z1 + .6 * u)); // devant la porte, la terrasse avance jusqu'au perron (place pour la colonnade)
    if (C.zP > C.zT + .05) C.ter.push([D.x0 - .2 * u, C.zT, D.x1 + .2 * u, C.zP]);
    for (const [x0, z0, x1, z1] of C.ter) { b.P(PT.pierre); b.box(x1 - x0, TH, z1 - z0, S.base, (x0 + x1) / 2, TH / 2, (z0 + z1) / 2); b.P(0); C.rect(x0, z0, x1, z1, TH); }
    for (const B of C.B) block(C, B);
    for (const B of C.B) (st === 0 ? roofC : st === 1 ? roofL : roofT)(C, B);
    for (const T of C.tw) tower(C, T);
    porte(b, D.H, 0, 0, { w: .8 * u, h: 1.55 * u, col: S.door, style: S.ds, frame: S.frame, arch: st < 2 ? 1 : 0, imposte: st === 2 ? 1 : 0, fronton: st === 2 ? S.trim : null, steps: 0, lamp: 2 });
    gardens(C);
    const geo = b.done(); return { geo, mask: mask(C), door: { z: D.z1, hw: Math.max(1.1, .55 * u) }, P: C };
  }
  // le plan et les fenêtres du rez-de-chaussée, pour dessiner l'intérieur exactement comme l'extérieur
  function layout(st, cols, rows) { const C = ctx(st, cols, rows), wins = []; for (const B of C.B) for (let f = 0; f < 4; f++) for (const w of bays(C, B, f)) wins.push({ B, f, a: w.a, door: w.door, k: w.k });
    return { C, wins, door: { z: C.D.z1, hw: Math.max(1.1, .55 * C.u) } }; }
  // fenêtres classiques ouvragées : clé de voûte à mascaron et impostes au rez-de-chaussée, frontons alternés (triangle, arc) et balcons
  // en fer forgé à l'étage noble, allèges moulurées, crossettes aux étages
  function decoWin(C, B, f, a, y, w, h, fl, k) {
    const { b, u, S } = C, H = B.H, ry = RY[f], at = (da, dy, out) => onW(H, f, a + da, y + dy, out);
    b.P(PT.pierre);
    if (fl === 0 && S.arch) { const top = h / 2 + w / 2 + .07; let p = at(0, top - .06 * u, .05); bx(b, .15 * u, .26 * u, .12, S.pil, p[0], p[1], p[2], ry); b.P(0); dot(b, .045 * u, S.trim, ...at(0, top - .1 * u, .12), 1); b.P(PT.pierre);
      for (const s of [-1, 1]) { p = at(s * (w / 2 + .07), h / 2, .03); bx(b, .13 * u, .07 * u, .08, S.pil, p[0], p[1], p[2], ry); } }
    else if (fl === 1) { const top = h / 2 + .14, pw = w + .32 * u; let p = at(0, top, .06); bx(b, pw, .05 * u, .14, S.trim, p[0], p[1], p[2], ry); p = at(0, top + .025 * u, .06);
      if (k % 2 === 0) G.prism(b, pw + .04, .2 * u, .13, S.trim, p[0], p[1], p[2], ry); else b.add(new THREE.CylinderGeometry(pw / 2, pw / 2, .13, 14, 1, false, -PI / 2, PI), S.trim, b.M(p[0], p[1], p[2], -PI / 2, ry, 0, 1, 1, .42));
      if (B.k === 'pav' || B.k === 'pav2') { b.P(0); const yb = -h / 2 - .05 * u; p = at(0, yb, .14); b.P(PT.pierre); bx(b, w + .3 * u, .05 * u, .26 * u, S.step, p[0], p[1], p[2], ry); b.P(0); // balcon en fer forgé
        const rc = C.lvl >= 4 ? GOLD : IRONC, R = w + .26 * u; p = at(0, yb + .33 * u, .25 * u); bx(b, f < 2 ? R : .03 * u, .03 * u, f < 2 ? .03 * u : R, rc, p[0], p[1], p[2]);
        for (let i = 0, n = 7; i <= n; i++) { p = at(-R / 2 + i * R / n, yb + .17 * u, .25 * u); bx(b, .022 * u, .3 * u, .022 * u, IRONC, p[0], p[1], p[2]); }
        p = at(0, yb + .16 * u, .25 * u); dot(b, .05 * u, rc, p[0], p[1], p[2]); b.P(PT.pierre); }
      else if (B.k === 'corps') { const p2 = at(0, -h / 2 - .2 * u, .03); bx(b, w * .92, .22 * u, .035, S.pil, p2[0], p2[1], p2[2], ry); } }
    else if (fl >= 2) for (const s of [-1, 1]) { const p = at(s * (w / 2 + .07), h / 2 + .05, .04); bx(b, .09 * u, .09 * u, .07, S.trim, p[0], p[1], p[2], ry); }
    b.P(0);
  }
  // ---------- murs, bandeaux, chaînes d'angle, fenêtres ----------
  function block(C, B) {
    const { b, u, S, FH } = C, H = B.H;
    b.P(S.wp); b.box(H.w, H.wh, H.d, S.wall, H.xc, TH + H.wh / 2, H.zc); b.P(0);
    b.P(PT.pierre); bx(b, H.w + .05, .3 * u, H.d + .05, S.base, H.xc, TH + .15 * u, H.zc);
    for (let f = 1; f < B.nf; f++) bx(b, H.w + .07, .09 * u, H.d + .07, S.trim, H.xc, TH + f * FH, H.zc);
    bx(b, H.w + .22 * u, .16 * u, H.d + .22 * u, S.trim, H.xc, B.top + .08 * u, H.zc); b.P(0);
    C.rect(B.x0, B.z0, B.x1, B.z1, B.top);
    if (S.quoins) { const n = Math.floor((H.wh - .2 * u) / (.4 * u)); b.P(PT.pierre); // chaînes d'angle en pierre (Louis XIII)
      for (let f = 0; f < 4; f++) { const L = f < 2 ? H.w : H.d; for (const s of [-1, 1]) { const p = onW(H, f, s * (L / 2 - .05), 0, .25); if (!C.free(B, p[0], p[2])) continue;
        for (let k = 0; k < n; k++) { const wide = (k % 2 ? .34 : .2) * u; A.wb(b, H, f, s * (L / 2 - wide / 2 + .02), TH + .2 * u + k * .4 * u, 0, wide, .34 * u, .035, S.trim); } } } b.P(0); }
    if (C.st === 0 && B.k !== 'corps') for (const f of [0, 1]) for (const a of B.k === 'centre' ? [-.44, -.17, .17, .44] : [-.4, .4]) A.wb(b, H, f, a * H.w, TH + H.wh / 2, 0, .15 * u, H.wh - .3 * u, .05, S.pil); // pilastres
    const ww = S.ww * u;
    for (let f = 0; f < 4; f++) for (const { a, door, k } of bays(C, B, f))
      for (let fl = 0; fl < B.nf; fl++) { if (door && fl === 0) continue; const gr = fl === 0, y = TH + fl * FH + .95 * u, h = (gr ? 1.15 : 1.0) * u * (C.st === 1 ? .92 : 1);
        fenetre(b, H, f, a, y, { w: ww, h, glass: 0x9fb9d4, frame: S.frame, sill: S.trim, lintel: S.trim, lintelPat: PT.pierre, curt: C.lite ? null : S.curt, pane: S.pane, arch: gr && S.arch ? 1 : 0 }); C.nwin++;
        if (C.st === 0 && (C.rich === 2 || (C.rich === 1 && fl < 2))) decoWin(C, B, f, a, y, ww, h, fl, k); }
    if (C.st === 0 && B.k === 'centre' && B.nf >= 2) { const y = TH + FH + .3 * u, z = H.zc + H.d / 2, w = H.w * .55; b.P(PT.pierre); bx(b, w, .07 * u, .3 * u, S.step, H.xc, y, z + .15 * u); b.P(0); // balcon de l'étage noble
      bx(b, w, .04 * u, .04 * u, C.lvl >= 4 ? GOLD : IRONC, H.xc, y + .36 * u, z + .28 * u); for (let k = 0, n = Math.round(w / (.12 * u)); k <= n; k++) bx(b, .025 * u, .32 * u, .025 * u, IRONC, H.xc - w / 2 + k * w / n, y + .2 * u, z + .28 * u); }
  }
  // lucarnes régulièrement sur les longs pans du toit
  function dormers(C, B, y, fn) {
    const H = B.H, long = H.w >= H.d, L = long ? H.w : H.d, n = Math.floor((L - 1.2 * C.u) / (2 * C.sp)); if (n < 1) return;
    for (const f of long ? [0, 1] : [2, 3]) for (let k = 0; k < n; k++) { const a = -L / 2 + .6 * C.u + (k + .5) * (L - 1.2 * C.u) / n, p = onW(H, f, a, 0, .3); if (C.free(B, p[0], p[2])) fn(C, B, f, a, y); }
  }
  // ---------- 1. classique : toits à la Mansart, œils-de-bœuf, pavillons pointus, dôme ----------
  function dormerC(C, B, f, a, y) { const { b, u, S } = C, ry = RY[f], N = NR[f], p = onW(B.H, f, a, y + .45 * u, -.1 * u);
    b.P(PT.pierre); bx(b, .5 * u, .62 * u, .45 * u, S.wall, p[0], p[1], p[2], ry); b.P(0); const q = [p[0] + N[0] * .23 * u, p[1] + .05 * u, p[2] + N[1] * .23 * u];
    b.cyl(.13 * u, .13 * u, .05, 12, GLASS, q[0], q[1], q[2], PI / 2, ry, 0, 1); b.add(new THREE.TorusGeometry(.15 * u, .035 * u, 5, 14), S.trim, b.M(q[0], q[1], q[2], 0, ry, 0), 0, true);
    b.P(PT.ardoise); G.prism(b, .62 * u, .25 * u, .5 * u, S.roof, p[0], p[1] + .31 * u, p[2], ry); b.P(0); }
  function roofC(C, B) {
    const { b, u, S, nf, lvl } = C, H = B.H, y = B.top + .16 * u, k = 1 + .1 * (nf - 2), long = H.w >= H.d;
    if (B.k === 'centre') return domeC(C, B, y);
    if (B.k !== 'corps') { const hh = (B.k === 'pav' ? .55 : .42) * Math.max(H.w, H.d) * k, tw = long ? .38 * H.w : .14 * H.w, td = long ? .14 * H.d : .38 * H.d;
      frustum(b, H.w + .2 * u, H.d + .2 * u, tw, td, hh, S.roof, H.xc, y, H.zc, PT.ardoise);
      const e = long ? [[H.xc - tw / 2, H.zc], [H.xc + tw / 2, H.zc]] : [[H.xc, H.zc - td / 2], [H.xc, H.zc + td / 2]]; for (const [x, z] of e) epi(b, x, y + hh, z, u * (1 + .1 * lvl));
      if (lvl >= 3) crest(C, e[0][0], e[0][1], e[1][0], e[1][1], y + hh); if (B.k === 'pav' && lvl >= 5) flag(C, H.xc, y + hh + .5 * u, H.zc, u); return; }
    const t1 = u * k, t2 = .6 * u * k, i1 = .4 * u, W1 = H.w - 2 * i1, D1 = H.d - 2 * i1, W2 = Math.max(.3 * u, W1 - (long ? 1.2 : 1.7) * u), D2 = Math.max(.3 * u, D1 - (long ? 1.7 : 1.2) * u);
    frustum(b, H.w + .1 * u, H.d + .1 * u, W1, D1, t1, S.roof, H.xc, y, H.zc, PT.ardoise); frustum(b, W1, D1, W2, D2, t2, S.roof, H.xc, y + t1, H.zc, PT.ardoise);
    dormers(C, B, y, dormerC);
    if (lvl >= 3) crest(C, H.xc - (long ? W2 / 2 : 0), H.zc - (long ? 0 : D2 / 2), H.xc + (long ? W2 / 2 : 0), H.zc + (long ? 0 : D2 / 2), y + t1 + t2);
    // cheminées vers l'arrière, balustrade (et statues) sur la corniche de la façade
    const L = long ? H.w : H.d, nc = Math.max(1, Math.round(L / (4.5 * u)));
    for (let i = 0; i < nc; i++) { const t = (i + .5) / nc - .5, x = long ? H.xc + t * (L - 1.4 * u) : H.xc - H.w * .22, z = long ? H.zc - H.d * .22 : H.zc + t * (L - 1.4 * u); chimney(C, x, z, y, y + t1 + t2 + .7 * u, S.trim, S.wall, !long); }
    if (lvl >= 2) for (const f of long ? [0] : [2, 3]) { const Lf = (f < 2 ? H.w : H.d) - .6 * u, p0 = onW(H, f, -Lf / 2, y, .05), p1 = onW(H, f, Lf / 2, y, .05), n = Math.round(Lf / (.2 * u)), cx = (p0[0] + p1[0]) / 2, cz = (p0[2] + p1[2]) / 2;
      if (!C.free(B, cx + NR[f][0] * .2, cz + NR[f][1] * .2)) continue;
      const rail = (h, t, yy) => f < 2 ? bx(b, Lf, h, t, S.trim, cx, yy, cz) : bx(b, t, h, Lf, S.trim, cx, yy, cz);
      rail(.05 * u, .16 * u, y + .02); rail(.07 * u, .2 * u, y + .38 * u); for (let i = 0; i <= n; i++) { const t = i / n; bx(b, .05 * u, .3 * u, .05 * u, S.trim, p0[0] + (p1[0] - p0[0]) * t, y + .19 * u, p0[2] + (p1[2] - p0[2]) * t); }
      if (lvl >= 3) for (let i = 1, ns = Math.floor(Lf / (2.2 * u)); i < ns; i++) { const t = i / ns; statueG(b, p0[0] + (p1[0] - p0[0]) * t, y + .4 * u, p0[2] + (p1[2] - p0[2]) * t, .5 * u); } }
  }
  function domeC(C, B, y) {
    const { b, u, S, lvl } = C, H = B.H, R = .46 * Math.min(H.w, H.d * .9), s = R / 1.15, fz = H.zc + H.d / 2;
    // colonnade colossale (palais) puis fronton à horloge
    let pz = fz - .15 * u;
    if (lvl >= 3) { const cz = fz + .45 * u, xs = [-.44, -.17, .17, .44].map(t => H.xc + t * H.w), cr = .13 * u * (1 + .04 * lvl);
      for (const x of xs) { b.P(PT.pierre); bx(b, cr * 2.6, .25 * u, cr * 2.6, S.trim, x, TH + .12 * u, cz); b.P(0); b.cyl(cr, cr * 1.1, B.wh - .4 * u, 14, S.pil, x, TH + .2 * u + (B.wh - .4 * u) / 2, cz, 0, 0, 0, 0, true); bx(b, cr * 2.8, .22 * u, cr * 2.8, lvl >= 4 ? GOLD : S.trim, x, B.top - .1 * u, cz); C.circ(x, cz, cr * 1.2, B.top); }
      b.P(PT.pierre); bx(b, H.w * .98, .3 * u, .9 * u, S.trim, H.xc, B.top + .15 * u, fz + .3 * u); b.P(0); pz = fz + .5 * u; }
    const yA = y - .02, pw = H.w + .2 * u; b.P(PT.pierre); G.prism(b, pw, .75 * u * (1 + .05 * lvl), .35 * u, S.trim, H.xc, yA, pz); b.P(0);
    const cy = yA + .3 * u, cr = .22 * u; b.cyl(cr, cr, .05, 16, 0xffffff, H.xc, cy, pz + .19 * u, PI / 2, 0, 0); b.add(new THREE.TorusGeometry(cr + .01 * u, .035 * u, 5, 18), GOLD, b.M(H.xc, cy, pz + .21 * u), 0, true);
    bx(b, .02 * u, .16 * u, .02, 0x222222, H.xc, cy + .05 * u, pz + .22 * u); bx(b, .12 * u, .02 * u, .02, 0x222222, H.xc + .05 * u, cy, pz + .22 * u);
    if (lvl >= 4) epi(b, H.xc, yA + .75 * u * (1 + .05 * lvl), pz, u * 1.2);
    // dôme : tambour, coupole (plus haute à chaque niveau), lanterne, épi doré, couronne
    b.P(PT.pierre); bx(b, H.w - .1 * u, .55 * s, H.d - .3 * u, S.wall, H.xc, y + .27 * s, H.zc); b.P(0);
    frustum(b, H.w + .2 * u, H.d + .2 * u, Math.max(.4, H.w - .4 * s), Math.max(.4, H.d - 1.0 * s), .55 * s, S.roof, H.xc, y + .55 * s, H.zc, PT.ardoise);
    let yd = y + 1.1 * s;
    if (lvl >= 3) { const dh = (.8 + .45 * (lvl - 3)) * s, rr = R * .92; b.P(PT.pierre); b.cyl(rr, rr * 1.03, dh, 24, S.wall, H.xc, yd - .1 * s + dh / 2, H.zc); b.P(0);
      b.cyl(rr + .08 * s, rr + .08 * s, .1 * s, 24, S.trim, H.xc, yd - .1 * s + dh, H.zc);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a), ry = PI / 2 - a;
        if (k % 2) bx(b, .28 * s, dh * .55, .05, GLASS, H.xc + ca * (rr + .01), yd - .1 * s + dh * .5, H.zc + sa * (rr + .01), ry, 1);
        else bx(b, .1 * s, dh * .9, .1 * s, S.pil, H.xc + ca * (rr + .03), yd - .1 * s + dh * .5, H.zc + sa * (rr + .03), ry); }
      yd += dh; }
    const sy = .95 + .08 * Math.min(4, Math.max(0, lvl - 2)); b.P(PT.ardoise); b.sph(R, S.roof, H.xc, yd, H.zc, 1, sy, 1, 0, 24, 14); b.P(0);
    if (lvl >= 4) for (let k = 0; k < 8; k++) b.add(new THREE.TorusGeometry(R + .02, .035 * s, 4, 16, PI), GOLD, b.M(H.xc, yd, H.zc, 0, k * PI / 8, 0, 1, sy, 1), 0, true);
    const yl = yd + R * sy; b.cyl(.28 * s, .3 * s, .55 * s, 8, S.wall, H.xc, yl + .2 * s, H.zc); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bx(b, .07 * s, .4 * s, .07 * s, S.trim, H.xc + Math.cos(a) * .3 * s, yl + .22 * s, H.zc + Math.sin(a) * .3 * s); }
    b.cone(.34 * s, .45 * s, 8, lvl >= 4 ? GOLD : S.roof, H.xc, yl + .7 * s, H.zc); epi(b, H.xc, yl + .9 * s, H.zc, s * 1.2);
    if (lvl >= 5) { b.tor(.3 * s, .05 * s, GOLD, H.xc, yl + .5 * s, H.zc, PI / 2, 0, 0, 0, 18); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; dot(b, .06 * s, GOLD, H.xc + Math.cos(a) * .3 * s, yl + .6 * s, H.zc + Math.sin(a) * .3 * s); } flag(C, H.xc, yl + 1.45 * s, H.zc, s); }
  }
  // ---------- 2. Loire : toits très pentus, lucarnes à pinacles, tours rondes, lanterne de Chambord ----------
  function dormerL(C, B, f, a, y) { const { b, u, S } = C, ry = RY[f], N = NR[f], p = onW(B.H, f, a, y + .25 * u, -.12 * u), T = f < 2 ? [1, 0] : [0, 1];
    b.P(PT.pierre); bx(b, f < 2 ? .75 * u : .5 * u, 1.05 * u, f < 2 ? .5 * u : .75 * u, S.wall, p[0], p[1] + .52 * u, p[2]); b.P(0);
    fenetre(b, blk(p[0], p[2], f < 2 ? .75 * u : .5 * u, f < 2 ? .5 * u : .75 * u, 0, 0), f, 0, p[1] + .5 * u, { w: .4 * u, h: .6 * u, frame: S.frame, glass: 0x9fb9d4 });
    b.P(PT.pierre); G.prism(b, .85 * u, .55 * u, .5 * u, S.trim, p[0], p[1] + 1.05 * u, p[2], ry); b.P(0);
    for (const s2 of [-1, 1]) { const x = p[0] + T[0] * s2 * .38 * u + N[0] * .2 * u, z = p[2] + T[1] * s2 * .38 * u + N[1] * .2 * u; bx(b, .1 * u, .3 * u, .1 * u, S.trim, x, p[1] + 1.2 * u, z); b.cone(.07 * u, .3 * u, 6, S.trim, x, p[1] + 1.5 * u, z); }
    b.cone(.08 * u, .35 * u, 6, S.trim, p[0], p[1] + 1.75 * u, p[2]); }
  function roofL(C, B) {
    const { b, u, S, lvl } = C, H = B.H, y = B.top + .14 * u, long = H.w >= H.d, sh = Math.min(H.w, H.d), lg = Math.max(H.w, H.d);
    if (B.k === 'centre') return gableL(C, B, y);
    if (B.k !== 'corps') { const hh = .95 * lg * (B.k === 'pav' ? 1 : .8), t = Math.max(.15 * u, .25 * (lg - sh)); frustum(b, H.w + .3 * u, H.d + .3 * u, long ? t : .15 * u, long ? .15 * u : t, hh, S.roof, H.xc, y, H.zc, PT.ardoise); epi(b, H.xc, y + hh, H.zc, u * 1.1); return; }
    const hh = .8 * sh, tl = Math.max(.2 * u, lg + .3 * u - .4 * sh * 1.25); frustum(b, H.w + .3 * u, H.d + .3 * u, long ? tl : .2 * u, long ? .2 * u : tl, hh, S.roof, H.xc, y, H.zc, PT.ardoise);
    bx(b, long ? tl : .1 * u, .06 * u, long ? .1 * u : tl, GOLD, H.xc, y + hh + .02, H.zc); if (lvl >= 3) crest(C, H.xc - (long ? tl / 2 : 0), H.zc - (long ? 0 : tl / 2), H.xc + (long ? tl / 2 : 0), H.zc + (long ? 0 : tl / 2), y + hh);
    dormers(C, B, y, dormerL);
    const nc = Math.max(1, Math.round(lg / (4 * u))); for (let i = 0; i < nc; i++) { const t = (i + .5) / nc - .5, x = long ? H.xc + t * (tl - .4 * u) : H.xc, z = long ? H.zc : H.zc + t * (tl - .4 * u); chimney(C, x + (long ? 0 : -.6 * u), z + (long ? -.6 * u : 0), y + .4 * u, y + hh + .6 * u * (1 + .1 * lvl), S.trim, S.wall, !long); }
  }
  function gableL(C, B, y) { // avant-corps à haut pignon, lanterne de Chambord au-dessus des toits
    const { b, u, S, lvl } = C, H = B.H, g = 1 + .06 * lvl, yA = B.top;
    b.P(PT.pierre); G.prism(b, H.w + .1 * u, 1.3 * u * g * H.w / (1.75 * u), H.d + .06 * u, S.wall, H.xc, yA, H.zc); b.P(0);
    b.P(PT.ardoise); G.prism(b, H.w + .35 * u, 1.45 * u * g * H.w / (1.75 * u), H.d - .25 * u, S.roof, H.xc, yA + .02, H.zc - .15 * u); b.P(0);
    fenetre(b, blk(H.xc, H.zc, H.w, H.d + .06 * u, 0, 0), 0, 0, yA + .45 * u * g, { w: .38 * u * g, h: .5 * u * g, arch: 1, frame: S.frame, glass: 0x9fb9d4 }); epi(b, H.xc, yA + 1.3 * u * g * H.w / (1.75 * u), H.zc + H.d / 2, u * 1.2);
    if (lvl < 2) return; const s = u * (1 + .12 * lvl), x = H.xc, z = H.zc - H.d * .15, y0 = yA + 1.1 * u * g * H.w / (1.75 * u), r1 = .7 * s, h1 = 1.6 * s;
    b.P(PT.pierre); b.cyl(r1, r1 * 1.04, h1, 18, S.wall, x, y0 + h1 / 2, z); b.cyl(r1 + .12 * s, r1 + .12 * s, .14 * s, 18, S.trim, x, y0 + h1, z); b.P(0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a), ry = PI / 2 - a; bx(b, .12 * s, h1, .12 * s, S.trim, x + ca * (r1 + .02), y0 + h1 / 2, z + sa * (r1 + .02), ry); const a2 = a + TAU / 16;
      bx(b, .34 * s, .8 * s, .05, GLASS, x + Math.cos(a2) * (r1 + .01), y0 + h1 * .55, z + Math.sin(a2) * (r1 + .01), PI / 2 - a2, 1); }
    const r2 = .45 * s, y2 = y0 + h1 + .07 * s; b.P(PT.pierre); b.cyl(r2, r2, s, 12, S.wall, x, y2 + .5 * s, z); b.P(0); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; bx(b, .2 * s, .5 * s, .05, GLASS, x + Math.cos(a) * (r2 + .01), y2 + .5 * s, z + Math.sin(a) * (r2 + .01), PI / 2 - a, 1); }
    b.P(PT.ardoise); b.cone(r2 + .12 * s, 1.3 * s, 12, S.roof, x, y2 + s + .65 * s, z); b.P(0); b.cyl(.15 * s, .15 * s, .45 * s, 8, S.wall, x, y2 + 2.1 * s, z); b.cone(.2 * s, .4 * s, 8, lvl >= 4 ? GOLD : S.roof, x, y2 + 2.5 * s, z); epi(b, x, y2 + 2.7 * s, z, s);
    if (lvl >= 3) flag(C, x, y2 + 3.2 * s, z, s * .8);
  }
  function tower(C, T) {
    const { b, u, S, lvl, FH } = C, { x, z, r, h } = T, n = Math.min(18, 12 + 2 * lvl);
    b.P(PT.pierre); b.cyl(r, r + .05 * u, h, 18, S.wall, x, h / 2, z); b.cyl(r + .12 * u, r + .02 * u, .3 * u, 18, S.trim, x, h + .1 * u, z); b.P(0);
    for (let k = 0; k < n; k++) { const a = k / n * TAU; bx(b, .1 * u, .18 * u, .1 * u, S.trim, x + Math.cos(a) * (r + .06 * u), h - .12 * u, z + Math.sin(a) * (r + .06 * u), PI / 2 - a); }
    const ch = 3 * r * (1 + .04 * lvl); b.P(PT.ardoise); b.cone(r + .18 * u, ch, 18, S.roof, x, h + .25 * u + ch / 2, z); b.P(0); epi(b, x, h + .25 * u + ch - .05, z, u * 1.1);
    if (lvl >= 3) flag(C, x, h + .25 * u + ch + .4 * u, z, u * .9);
    const l = Math.hypot(x, z) || 1, dx = x / l, dz = z / l, ry = Math.atan2(dx, dz);
    for (let f = 0; (f + 1) * FH < h - .5 * u; f++) { const y = TH + (f + .55) * FH, px = x + dx * r * .93, pz = z + dz * r * .93; bx(b, .34 * u, .6 * u, .06, S.trim, px, y, pz, ry); bx(b, .26 * u, .52 * u, .05, GLASS, px + dx * .02, y, pz + dz * .02, ry, 1); }
    C.circ(x, z, r + .05 * u, h);
  }
  // ---------- 3. Louis XIII : hauts toits à croupes séparés, lucarnes de pierre, campaniles, cheminées de brique ----------
  function dormerT(C, B, f, a, y) { const { b, u, S } = C, ry = RY[f], p = onW(B.H, f, a, y + .25 * u, -.1 * u);
    b.P(PT.pierre); bx(b, f < 2 ? .6 * u : .45 * u, .8 * u, f < 2 ? .45 * u : .6 * u, S.trim, p[0], p[1] + .4 * u, p[2]); b.P(0);
    fenetre(b, blk(p[0], p[2], f < 2 ? .6 * u : .45 * u, f < 2 ? .45 * u : .6 * u, 0, 0), f, 0, p[1] + .4 * u, { w: .32 * u, h: .45 * u, frame: S.frame, glass: 0x9fb9d4 });
    b.P(PT.pierre); b.add(new THREE.CylinderGeometry(.34 * u, .34 * u, .45 * u, 12, 1, false, -PI / 2, PI), S.trim, b.M(p[0], p[1] + .8 * u, p[2], -PI / 2, ry, 0)); b.P(0); }
  function campanile(C, x, y, z, s) { const { b, S, lvl } = C; b.cyl(.36 * s, .36 * s, .7 * s, 8, S.trim, x, y + .35 * s, z); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bx(b, .08 * s, .5 * s, .08 * s, S.wall, x + Math.cos(a) * .36 * s, y + .35 * s, z + Math.sin(a) * .36 * s); }
    b.P(PT.ardoise); b.sph(.42 * s, lvl >= 4 ? GOLD : S.roof, x, y + .8 * s, z, 1, .9, 1, 0, 14, 10); b.P(0); epi(b, x, y + 1.15 * s, z, s); if (lvl >= 3) flag(C, x, y + 1.6 * s, z, s * .7); }
  function roofT(C, B) {
    const { b, u, S, lvl } = C, H = B.H, y = B.top + .14 * u, long = H.w >= H.d, sh = Math.min(H.w, H.d), lg = Math.max(H.w, H.d);
    if (B.k === 'corps' || B.k === 'centre') { const hh = .67 * sh * (B.k === 'centre' ? 1.2 : 1), tl = Math.max(.3 * u, lg + .3 * u - .47 * sh);
      frustum(b, H.w + .3 * u, H.d + .3 * u, long ? tl : .3 * u, long ? .3 * u : tl, hh, S.roof, H.xc, y, H.zc, PT.ardoise); bx(b, long ? tl : .08 * u, .05 * u, long ? .08 * u : tl, GOLD, H.xc, y + hh + .02, H.zc);
      if (lvl >= 3) crest(C, H.xc - (long ? tl / 2 : 0), H.zc - (long ? 0 : tl / 2), H.xc + (long ? tl / 2 : 0), H.zc + (long ? 0 : tl / 2), y + hh);
      dormers(C, B, y, dormerT);
      if (B.k === 'centre') campanile(C, H.xc, y + hh - .05, H.zc, u * (1 + .15 * lvl));
      else { const nc = Math.max(1, Math.round(lg / (5 * u))); for (let i = 0; i < nc; i++) { const t = (i + .5) / nc - .5, x = long ? H.xc + t * (tl - .3 * u) : H.xc - H.w * .3, z = long ? H.zc - H.d * .3 : H.zc + t * (tl - .3 * u); chimney(C, x, z, y, y + hh + .3 * u, S.wall, S.trim, !long); } }
      return; }
    const hh = .69 * lg * (B.k === 'pav' ? 1 : .8), tw = long ? .5 * H.w : .2 * H.w, td = long ? .2 * H.d : .5 * H.d;
    frustum(b, H.w + .3 * u, H.d + .3 * u, tw, td, hh, S.roof, H.xc, y, H.zc, PT.ardoise);
    const e = long ? [[H.xc - tw / 2, H.zc], [H.xc + tw / 2, H.zc]] : [[H.xc, H.zc - td / 2], [H.xc, H.zc + td / 2]]; for (const [x, z] of e) epi(b, x, y + hh, z, u); if (lvl >= 3) crest(C, e[0][0], e[0][1], e[1][0], e[1][1], y + hh);
    if (B.k === 'pav') { chimney(C, long ? (H.xc < 0 ? B.x0 + .6 * u : B.x1 - .6 * u) : H.xc, long ? H.zc : B.z0 + .6 * u, y, y + hh + .2 * u, S.wall, S.trim, long); // haute cheminée de brique au bout du pavillon
      if (lvl >= 3 && C.kind !== 'Z') campanile(C, e[1][0], y + hh - .05, e[1][1], u * (.7 + .1 * lvl)); }
  }
  // ---------- jardins : perron, statues, ifs, parterres, fontaine, grille ou châtelet ----------
  function gardens(C) {
    const { b, u, S, kind } = C, s = Math.min(2.2, .8 + .25 * u), zT = C.zT, zP = C.zP, pw = Math.max(1.6, 1.1 * u);
    for (let k = 0; k < 2; k++) { const h = (2 - k) * .12, w = pw + (k + 1) * .3; b.P(PT.pierre); bx(b, w, h, .34, S.step, 0, h / 2, zP + .17 + k * .34); b.P(0); C.rect(-w / 2, zP + k * .34, w / 2, zP + (k + 1) * .34, h); }
    const bed = (x, z, w, d) => { b.jit(.06); b.blob(.3, 1, 0x4a8a4f, x, .3, z, w / .3 / 2, .7, d / .3 / 2); b.jit(0); for (let k = 0; k < 6; k++) dot(b, .06, S.fl[k % 3], x - w * .4 + k * w * .16, .55, z + (k % 2 - .5) * d * .3); C.rect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, .55); };
    if (kind !== 'U') { // jardin de devant
      for (const sx of [-1, 1]) statue(C, sx * (pw / 2 + .65), Math.min(C.Z1 - .3, zP + .4), s * .9);
      const zr = C.Z1 - .45; if (zr > zT + .45) { const xm = C.Wl / 2 - .5; let i = 0; for (let x = pw / 2 + 1.0; x < xm && i < 30; x += 1.6 * s, i++) for (const sx of [-1, 1]) { topiaire(C, sx * x, zr, s * .9); if (i % 2 === 0 && x + .8 * s < xm) bed(sx * (x + .8 * s), zr - .05, 1.0 * s, .5); } }
    } else court(C, s, pw);
    // derrière : ifs taillés en rang
    const zb = C.Z0 + .45; if (C.ter.every(t => t[1] > zb + .25)) { const xm = C.Wl / 2 - .5; let i = 0; for (let x = 0; x < xm && i < 40; x += 2.2 * s, i++) for (const sx of x ? [-1, 1] : [1]) topiaire(C, sx * x, zb, s * .85); }
  }
  function court(C, s, pw) {
    const { b, u, S, lvl } = C, [x0, z0, x1, z1] = C.court, cw = x1 - x0, cd = z1 - z0, aw = Math.max(2.0, 1.2 * u);
    b.P(PT.pierre); bx(b, cw, .03, cd, 0xd8d0bf, (x0 + x1) / 2, .015, (z0 + z1) / 2); bx(b, aw, .035, cd - .7, 0xe8e1d0, 0, .02, (z0 + z1) / 2 + .35); b.P(0);
    // fontaine au milieu de la cour (devant les ailes intérieures s'il y en a)
    const I = C.inner, R = G.clamp(Math.min(cw, cd) * .12, 1.0, 3.2 * u), fz = Math.max(z0 + .7 + (cd - .7) * .5, I ? I.z + R + .8 : 0), og = lvl >= 3 && cw > 9 * u;
    if (cd > 4) { b.P(PT.pierre); b.cyl(R, R + .05, .5, 28, S.trim, 0, .25, fz); b.P(0); b.cyl(R - .12, R - .12, .06, 28, 0x7ec8e8, 0, .45, fz, 0, 0, 0, 2); b.cyl(R * .18, R * .24, .9 + .1 * lvl, 12, S.trim, 0, .45 + (.9 + .1 * lvl) / 2, fz);
      const yb = 1.45 + .1 * lvl; b.cyl(R * .42, R * .2, .2, 18, S.trim, 0, yb, fz); b.cyl(R * .38, R * .38, .04, 18, 0x7ec8e8, 0, yb + .1, fz, 0, 0, 0, 2); b.cyl(.05 * s, .12 * s, .9 * s, 8, 0xcfeffa, 0, yb + .55 * s, fz, 0, 0, 0, 2);
      if (lvl >= 3) statueG(b, 0, yb + .1, fz, .7 * s, GOLD); C.circ(0, fz, R + .05, .6); }
    // parterres de buis en broderie, de part et d'autre de l'allée
    const xe = x1 - (og ? 1.5 : .5), full = [[aw / 2 + .6, xe]], zs = Math.max(z0 + .9, C.zP + .3), zones = cd > 4 ? [[zs, fz - R - .8, I ? [[aw / 2 + .6, I.xi - .4], [I.xo + .4, xe]] : full], [fz + R + .8, z1 - .7, full]] : [[zs, z1 - .7, full]];
    for (const [az, bz, xs] of zones) for (const [ax0, bx0] of xs) for (const sx of [-1, 1]) { const ax = sx > 0 ? ax0 : -bx0, bx2 = sx > 0 ? bx0 : -ax0, w = bx2 - ax, d = bz - az; if (w < 1.2 || d < 1.0) continue; const nx = G.clamp(Math.round(w / (5 * u)), 1, 4), nz = G.clamp(Math.round(d / (5 * u)), 1, 4);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const ex0 = ax + i * w / nx + (i ? .45 : 0), ex1 = ax + (i + 1) * w / nx - (i < nx - 1 ? .45 : 0), ez0 = az + j * d / nz + (j ? .45 : 0), ez1 = az + (j + 1) * d / nz - (j < nz - 1 ? .45 : 0); parterre(C, ex0, ez0, ex1, ez1, s); } }
    // statues et lanternes le long de l'allée
    if (lvl >= 2) for (let z = Math.max(z0 + 2.2, C.zP + 1.2), i = 0; z < z1 - 1.2 && i < 16; z += 3.5 * u, i++) { if (cd > 4 && Math.abs(z - fz) < R + 1) continue; for (const sx of [-1, 1]) { if (i % 2 === 0 || lvl < 3) statue(C, sx * (aw / 2 + .35), z, s * .8);
      else { b.cyl(.04 * s, .06 * s, 1.5 * s, 6, IRONC, sx * (aw / 2 + .35), .75 * s, z); b.box(.2 * s, .28 * s, .2 * s, 0xffe2a0, sx * (aw / 2 + .35), 1.62 * s, z, 0, 0, 0, 1); b.cone(.17 * s, .14 * s, 6, IRONC, sx * (aw / 2 + .35), 1.84 * s, z); C.circ(sx * (aw / 2 + .35), z, .1, 1.5 * s); } } }
    // orangers en caisse le long des ailes
    if (og) for (const sx of [-1, 1]) for (let z = z0 + 1.4, i = 0; z < z1 - 1.2 && i < 30; z += 2.4 * s, i++) { const x = sx * (x1 - .7);
      bx(b, .5 * s, .5 * s, .5 * s, 0x3f6b4a, x, .25 * s, z); bx(b, .56 * s, .06 * s, .56 * s, 0xf3eee4, x, .5 * s, z); b.cyl(.04 * s, .05 * s, .5 * s, 6, 0x6b4a2e, x, .75 * s, z);
      b.jit(.08); b.blob(.38 * s, 1, 0x3f8a3a, x, 1.25 * s, z); b.jit(0); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + i; dot(b, .06 * s, 0xff9a1f, x + Math.cos(a) * .3 * s, 1.2 * s + (k % 2) * .15 * s, z + Math.sin(a) * .3 * s); } C.circ(x, z, .3 * s, 1.6 * s); }
    if (lvl >= 5) for (const sx of [-1, 1]) { const x = sx * (aw / 2 + 1.2), z = z1 - 1.0, h = 2.4 * s; // obélisques à l'entrée
      b.P(PT.pierre); bx(b, .7 * s, .5 * s, .7 * s, S.trim, x, .25 * s, z); b.P(0); b.add(new THREE.CylinderGeometry(.08 * s, .3 * s, h, 4), 0xd9cfb8, b.M(x, .5 * s + h / 2, z, 0, PI / 4, 0)); b.add(new THREE.ConeGeometry(.11 * s, .25 * s, 4), GOLD, b.M(x, .5 * s + h + .12 * s, z, 0, PI / 4, 0)); C.rect(x - .35 * s, z - .35 * s, x + .35 * s, z + .35 * s, h); }
    closure(C, s);
  }
  function parterre(C, x0, z0, x1, z1, s) {
    const b = C.b, w = x1 - x0, d = z1 - z0, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, HG = 0x2f6b3a, t = .18, h = .4, fl = C.S.fl;
    bx(b, w, .05, d, 0x5f9e48, xc, .03, zc); for (const [ww, dd, x, z] of [[w, t, xc, z0 + t / 2], [w, t, xc, z1 - t / 2], [t, d, x0 + t / 2, zc], [t, d, x1 - t / 2, zc]]) bx(b, ww, h, dd, HG, x, h / 2, z);
    // broderie de buis : croix (petits parterres) ou diagonales et rond central (grands), fleurs en rangs le long des bordures
    if (w > 2.6 && d > 2.6) { const L = Math.hypot(w, d) * .62, a = Math.atan2(d, w); for (const s2 of [-1, 1]) b.add(new THREE.BoxGeometry(L, h * .7, t * .8), HG, b.M(xc, h * .35, zc, 0, s2 * a, 0));
      const rr = Math.min(w, d) * .2; b.cyl(rr, rr, h * .7, 18, HG, xc, h * .35, zc); b.cyl(rr - .15, rr - .15, h * .72, 18, 0x6a4a32, xc, h * .36, zc); b.cone(.2 * s, .9 * s, 10, HG, xc, h + .45 * s, zc);
      for (let k = 0, n = Math.min(12, Math.round(rr * 6)); k < n; k++) { const an = k / n * TAU; dot(b, .08, fl[k % 3], xc + Math.cos(an) * (rr - .3), h * .75, zc + Math.sin(an) * (rr - .3)); } }
    else if (w > 1.6 && d > 1.6) { bx(b, w * .6, h * .8, t, HG, xc, h * .4, zc); bx(b, t, h * .8, d * .6, HG, xc, h * .4, zc); }
    const W2 = w - .8, D2 = d - .8, per = 2 * (W2 + D2), n = Math.min(72, Math.floor(per / .32)); for (let k = 0; k < n; k++) { let q = (k + .5) / n * per, x, z;
      if (q < W2) { x = x0 + .4 + q; z = z0 + .4; } else if ((q -= W2) < D2) { x = x1 - .4; z = z0 + .4 + q; } else if ((q -= D2) < W2) { x = x1 - .4 - q; z = z1 - .4; } else { x = x0 + .4; z = z1 - .4 - (q - W2); }
      dot(b, .075, fl[k % 3], x, .13, z); }
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) b.cone(.16 * s, .7 * s, 8, HG, x + (x < xc ? .15 : -.15), .35 * s + h, z + (z < zc ? .15 : -.15));
    C.rect(x0, z0, x1, z1, .45);
  }
  function closure(C, s) { // la cour se ferme devant : grille dorée, châtelet à deux tours ou mur de brique, avec une grande entrée au milieu
    const { b, u, S, lvl, st } = C, G0 = C.gate, z = G0.z, gw = Math.max(2.6, 1.3 * u), ph = 2.2 + .3 * u, xs = [[G0.x0, -gw / 2 - .4 * u], [gw / 2 + .4 * u, G0.x1]];
    if (st === 0) { for (const [a, c] of xs) { const L = c - a; if (L < .2) continue; b.P(PT.pierre); bx(b, L, .35, .3, S.trim, (a + c) / 2, .175, z); b.P(0); const n = Math.max(2, Math.round(L / .28));
        bx(b, L, .05, .05, IRONC, (a + c) / 2, 1.2 + .1 * u, z); bx(b, L, .05, .05, IRONC, (a + c) / 2, .5, z); for (let k = 0; k <= n; k++) { const x = a + k * L / n; bx(b, .04, 1.25 + .1 * u, .04, IRONC, x, .35 + (1.25 + .1 * u) / 2, z); if (k % 2 === 0) b.cone(.04, .14, 6, GOLD, x, 1.67 + .1 * u, z); }
        C.rect(a, z - .15, c, z + .15, 1.8); }
      for (const sx of [-1, 1]) { const x = sx * (gw / 2 + .2 * u); b.P(PT.pierre); bx(b, .4 * u + .2, ph, .4 * u + .2, S.trim, x, ph / 2, z); bx(b, .5 * u + .25, .14, .5 * u + .25, S.pil, x, ph + .07, z); b.P(0); if (lvl >= 3) statueG(b, x, ph + .14, z, .7 * s, lvl >= 4 ? GOLD : 0xece6d8); else vase(b, x, ph + .14, z, s, S.pil); C.rect(x - .2 * u - .1, z - .2 * u - .1, x + .2 * u + .1, z + .2 * u + .1, ph);
        for (let k = 0; k < 6; k++) bx(b, .03, 1.3, .03, GOLD, x - sx * (.2 * u + .15) - sx * k * .12, 1.0, z - .1 - k * .1); }
    } else if (st === 1) { for (const [a, c] of xs) { const L = c - a; if (L < .2) continue; b.P(PT.pierre); bx(b, L, 1.1, .4, S.wall, (a + c) / 2, .55, z); b.P(0); for (let k = 0, n = Math.floor(L / (.5 * u)); k < n; k++) bx(b, .25 * u, .25, .44, S.trim, a + (k + .5) * L / n, 1.22, z); C.rect(a, z - .2, c, z + .2, 1.3); }
      const r = .6 * u, th = 3.2 * u; for (const sx of [-1, 1]) { const x = sx * (gw / 2 + r * .7); b.P(PT.pierre); b.cyl(r, r + .04 * u, th, 16, S.wall, x, th / 2, z); b.P(0); b.P(PT.ardoise); b.cone(r + .12 * u, 2.4 * r, 16, S.roof, x, th + 1.2 * r, z); b.P(0); epi(b, x, th + 2.4 * r - .05, z, u); if (lvl >= 3) flag(C, x, th + 2.4 * r + .3 * u, z, u * .8); C.circ(x, z, r + .04 * u, th); }
      const y0 = Math.max(2.6, 2.1 * u), bw = gw + .2 * u; b.P(PT.pierre); bx(b, bw, 1.0 * u, .9 * u, S.wall, 0, y0 + .5 * u, z); b.P(0); b.P(PT.ardoise); G.prism(b, bw + .2 * u, .9 * u, 1.1 * u, S.roof, 0, y0 + 1.0 * u, z, PI / 2); b.P(0);
      fenetre(b, blk(0, z, bw, .9 * u, 0, 0), 0, 0, y0 + .5 * u, { w: .4 * u, h: .5 * u, frame: S.frame, glass: 0x9fb9d4 }); b.add(new THREE.TorusGeometry(gw / 2, .12 * u, 6, 18, PI), S.trim, b.M(0, y0 - gw / 2 + .1, z + .45 * u), 0, true);
    } else { for (const [a, c] of xs) { const L = c - a; if (L < .2) continue; b.P(PT.brique); bx(b, L, 1.2, .35, S.wall, (a + c) / 2, .6, z); b.P(0); b.P(PT.pierre); bx(b, L + .04, .1, .45, S.trim, (a + c) / 2, 1.25, z); b.P(0); C.rect(a, z - .2, c, z + .2, 1.3); }
      for (const sx of [-1, 1]) { const x = sx * (gw / 2 + .25 * u); b.P(PT.brique); bx(b, .5 * u + .1, ph, .5 * u + .1, S.wall, x, ph / 2, z); b.P(0); b.P(PT.pierre); bx(b, .6 * u + .15, .16, .6 * u + .15, S.trim, x, ph + .08, z); b.P(0); vase(b, x, ph + .16, z, s, lvl >= 4 ? GOLD : S.trim); C.rect(x - .25 * u - .05, z - .25 * u - .05, x + .25 * u + .05, z + .25 * u + .05, ph);
        for (let k = 0; k < 6; k++) bx(b, .03, 1.4, .03, IRONC, x - sx * (.25 * u + .15) - sx * k * .12, 1.0, z - .1 - k * .1); }
    }
  }
  // ---------- carte des hauteurs pour les collisions (8 × 8 par case), à partir des volumes posés ----------
  function mask(C) {
    const S = 8, W = Math.ceil(C.Wl * S), D = Math.ceil(C.Dl * S), H = new Float32Array(W * D).fill(-1), hx = C.Wl / 2, hz = C.Dl / 2;
    const put = (i, j, h) => { const k = j * W + i; if (h > H[k]) H[k] = h; };
    for (const [x0, z0, x1, z1, h0] of C.rs) { const h = Math.min(MAXH, h0); let i0 = Math.ceil((x0 + hx) * S - .5), i1 = Math.floor((x1 + hx) * S - .5), j0 = Math.ceil((z0 + hz) * S - .5), j1 = Math.floor((z1 + hz) * S - .5);
      if (i1 < i0) i0 = i1 = Math.floor(((x0 + x1) / 2 + hx) * S); if (j1 < j0) j0 = j1 = Math.floor(((z0 + z1) / 2 + hz) * S);
      for (let j = Math.max(0, j0); j <= Math.min(D - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(W - 1, i1); i++) put(i, j, h); }
    for (const [x, z, r, h0] of C.cs) { const h = Math.min(MAXH, h0); for (let j = Math.max(0, Math.floor((z - r + hz) * S)); j <= Math.min(D - 1, Math.floor((z + r + hz) * S)); j++) for (let i = Math.max(0, Math.floor((x - r + hx) * S)); i <= Math.min(W - 1, Math.floor((x + r + hx) * S)); i++)
      if (Math.hypot((i + .5) / S - hx - x, (j + .5) / S - hz - z) <= r) put(i, j, h); }
    return { S, W, D, H, hx, hz };
  }

  // ---------- modèles : un par forme de groupe (et par sens), libérés quand plus personne ne s'en sert ----------
  const BUILT = {}, REF = {}, VER = {};
  MD.chxl_vide = () => { const b = G.mb(1); bx(b, .01, .01, .01, 0xffffff, 0, -3, 0); const g = b.done(); g.userData.noOutline = true; return g; };
  const toL = (r, dx, dz) => r === 0 ? [dx, dz] : r === 1 ? [-dz, dx] : r === 2 ? [-dx, -dz] : [dz, -dx]; // monde → repère du château (façade vers +z)
  const toW = (r, lx, lz) => r === 0 ? [lx, lz] : r === 1 ? [lz, -lx] : r === 2 ? [-lx, -lz] : [-lz, lx];
  function model(st, cols, rows, r, off) {
    const base = 'chxl_' + st + '_' + cols + '_' + rows + '_' + r, name = base + '_' + (VER[base] || 0);
    if (!MD[name]) MD[name] = () => { const R = build(st, cols, rows); R.geo.translate(off[0], 0, off[1]); if (R.geo.attributes.position.count > 400000) R.geo.userData.noOutline = true; BUILT[name] = R; return R.geo; };
    return name;
  }
  function release(name) {
    const R = BUILT[name]; if (R) { const g = R.geo; g.dispose(); if (g._ol) { g._ol.dispose(); g._ol = null; } for (const k in g.attributes) { const a = g.attributes[k]; g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(a.itemSize * 3), a.itemSize)); } g.groups = []; delete BUILT[name]; }
    const base = name.slice(0, name.lastIndexOf('_')); VER[base] = (VER[base] || 0) + 1; delete MD[name];
  }
  function dropSet(m, key) { const R = m.objr, s = R.sets[key]; if (!s || s.n) return; for (const me of [s.mesh, s.om, s.low, s.low2]) if (me) { R.group.remove(me); me.dispose(); } delete R.sets[key]; }

  // ---------- groupes : châteaux identiques qui se touchent, découpés en rectangles (le plus grand d'abord) ----------
  const styleOf = o => (o.v != null ? o.v : O[o.t].v || 0) % 3; // le style dessiné (« Repeindre la façade » peut le changer)
  const isC = o => !!o && CAST.includes(o.t) && o.dk == null && !o.temp;
  // occ[i * gd + j] : rectangles pleins, du plus grand au plus petit (2 châteaux au moins) ; à surface égale, le plus large de façade (keep),
  // toujours le même découpage quel que soit l'ordre de pose : chez soi, après rechargement et chez les visiteurs
  function rects(occ, gw, gd, keep) {
    const out = [], down = new Int32Array(gw * gd);
    for (;;) { for (let i = 0; i < gw; i++) for (let j = gd - 1; j >= 0; j--) down[i * gd + j] = occ[i * gd + j] ? 1 + (j + 1 < gd ? down[i * gd + j + 1] : 0) : 0;
      let top = 0, cand = []; for (let j0 = 0; j0 < gd; j0++) for (let i0 = 0; i0 < gw; i0++) { let h = Infinity; for (let i1 = i0; i1 < gw; i1++) { h = Math.min(h, down[i1 * gd + j0]); if (!h) break; const a = (i1 - i0 + 1) * h; if (a > top) { top = a; cand = []; } if (a === top && cand.length < 64) cand.push([i0, j0, i1 - i0 + 1, h]); } }
      if (top < 2) return out; let best = cand[0], bk = -1; if (cand.length > 1) for (const c of cand) { const k = keep(c); if (k > bk) { bk = k; best = c; } }
      out.push(best); for (let i = best[0]; i < best[0] + best[2]; i++) for (let j = best[1]; j < best[1] + best[3]; j++) occ[i * gd + j] = 0; }
  }
  function regroup(m) {
    const cs = []; for (const o of m._cgSet || []) if (isC(o) && m.list.has(o)) { cs.push(o); o._sig = sig(o); } m._cgList = cs;
    const at = new Map(); for (const o of cs) at.set(o.x * 65536 + o.z, o);
    const kOf = o => styleOf(o) * 4 + (o.r & 3) + '|' + o.y, seen = new Set(), next = new Map(), groups = [];
    for (const o of cs) { if (seen.has(o)) continue; const k = kOf(o), [w, d] = G.fpDims(O[o.t], o.r), comp = [o]; seen.add(o);
      for (let i = 0; i < comp.length; i++) { const q = comp[i]; for (const [dx, dz] of [[w, 0], [-w, 0], [0, d], [0, -d]]) { const p = at.get((q.x + dx) * 65536 + q.z + dz); if (p && !seen.has(p) && kOf(p) === k) { seen.add(p); comp.push(p); } } }
      if (comp.length < 2) continue;
      let x0 = Infinity, z0 = Infinity, gw = 0, gd = 0; for (const q of comp) { x0 = Math.min(x0, q.x); z0 = Math.min(z0, q.z); }
      for (const q of comp) { gw = Math.max(gw, (q.x - x0) / w + 1); gd = Math.max(gd, (q.z - z0) / d + 1); }
      const occ = new Uint8Array(gw * gd), cell = new Array(gw * gd); for (const q of comp) { const c = (q.x - x0) / w * gd + (q.z - z0) / d; occ[c] = 1; cell[c] = q; }
      const r = o.r & 3, st = styleOf(o);
      for (const [i0, j0, rw, rh] of rects(occ, gw, gd, c => r & 1 ? c[3] : c[2])) {
        const members = []; for (let i = i0; i < i0 + rw; i++) for (let j = j0; j < j0 + rh; j++) members.push(cell[i * gd + j]);
        const anchor = cell[i0 * gd + j0], cols = r & 1 ? rh : rw, rows = r & 1 ? rw : rh, cx = anchor.x + rw * w / 2, cz = anchor.z + rh * d / 2, off = toL(r, cx - (anchor.x + w / 2), cz - (anchor.z + d / 2));
        const g = { name: model(st, cols, rows, r, off), st, r, cols, rows, n: members.length, cx, cz, members, anchor }; groups.push(g);
        for (const q of members) next.set(q, g); }
    }
    const names = new Set(groups.map(g => g.name)), old = m._cgNames || new Set(); let fresh = null;
    for (const o of cs) { const g = next.get(o) || null, key = g ? (o === g.anchor ? g.name + ':0' : HIDE) : null;
      if (g && g.n > (o._grp ? o._grp.n : 1) && (!fresh || g.n > fresh.n)) fresh = g; // le château a grandi
      o._grp = g; if ((o._cg || null) !== key) { o._cg = key || undefined; if (zero(o._anim)) o._anim = null; if (o._k) m.objr.refresh(o); } }
    for (const nm of names) if (!old.has(nm)) REF[nm] = (REF[nm] || 0) + 1;
    for (const nm of old) if (!names.has(nm)) { dropSet(m, nm + ':0'); if (--REF[nm] <= 0) { delete REF[nm]; release(nm); } }
    m._cgNames = names;
    if (fresh && m._cgInit && m === G.map && G.state === 'play') { // fanfare !
      const [W2, D2] = [fresh.cols * 9, fresh.rows * 7]; G.sfx('fanfare'); G.ui.toast('🏰 ' + fresh.n + ' châteaux s\'assemblent : ' + G.chateauName(fresh.st, fresh.n) + ' (' + fresh.cols + ' × ' + fresh.rows + ') !', 5000);
      for (let k = 0; k < Math.min(24, 4 + fresh.n * 2); k++) { const [dx, dz] = toW(fresh.r, (Math.random() - .5) * W2, (Math.random() - .5) * D2); G.fx.puff(fresh.cx + dx, fresh.anchor.y + 1 + Math.random() * 4, fresh.cz + dz, 22, 0xf3ead2, 1.6); }
      G.fx.burst(fresh.cx, fresh.anchor.y + 6, fresh.cz, 40, [0xffd23f, 0xffffff, 0xff8fc0, 0x7ec8e8], 5, 1.6, 3); }
    m._cgInit = true;
  }
  // le château du coin dessine tout le groupe, les autres sont cachés
  const okey = G.objKey; G.objKey = o => o._cg || okey(o);
  const dirty = new Set(), GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj, oref = GP.refresh, sig = o => styleOf(o) + '|' + (o.r & 3);
  GP.addObj = function (t, tx, tz, r, ex) { const o = oadd.call(this, t, tx, tz, r, ex); if (o && CAST.includes(t)) { (this._cgSet || (this._cgSet = new Set())).add(o); dirty.add(this); } return o; };
  GP.removeObj = function (o) { const res = orem.call(this, o); if (o && CAST.includes(o.t)) { if (this._cgSet) this._cgSet.delete(o); dirty.add(this); o._cg = undefined; } return res; };
  // un château déjà retiré ne revient pas (la caméra le « rafraîchit » parfois après coup) ; « Repeindre la façade » change le style → on regroupe
  GP.refresh = function (o) { if (o && CAST.includes(o.t)) { if (!this.list.has(o)) return; if (o._sig !== sig(o)) dirty.add(this); } return oref.call(this, o); };
  // la caméra n'est jamais bloquée : le grand château s'efface seulement s'il cache vraiment le joueur (d'après sa forme)
  const Z = new THREE.Matrix4().makeScale(0, 0, 0), zero = a => !!a && a.elements[0] === 0 && a.elements[5] === 0 && a.elements[10] === 0;
  function camHide(m) {
    const p = G.player, cp = G.camera && G.camera.position, on = p && cp && !m.interior && G.state === 'play', ty = p ? p.y + 1 : 0;
    for (const o of m._cgList) { const g = o._grp; if (!g || g.anchor !== o || !o._k) continue; let hide = false; const [px, pz] = on ? toL(g.r, p.x - g.cx, p.z - g.cz) : [0, 0];
      // dans la cour ou sur la terrasse, le château reste là (on voit le joueur en transparence) ; une grille ou un muret ne cachent rien
      if (on && !(Math.abs(px) < g.cols * 4.5 && Math.abs(pz) < g.rows * 3.5)) for (let i = 1; i <= 18 && !hide; i++) { const t = i / 18, x = p.x + (cp.x - p.x) * t, y = ty + (cp.y - ty) * t, z = p.z + (cp.z - p.z) * t, [lx, lz] = toL(g.r, x - g.cx, z - g.cz);
        if (Math.abs(lx) < g.cols * 4.5 && Math.abs(lz) < g.rows * 3.5) { const h = hAt(o, x, z); if (h > 2.5 && o.y + h > y - .3) hide = true; } }
      if (hide && o._anim !== Z) { o._anim = Z; m.objr.refresh(o); } else if (!hide && zero(o._anim)) { o._anim = null; m.objr.refresh(o); } }
  }
  let qT = 0;
  G.on('frame', () => {
    if (dirty.size) for (const m of [...dirty]) { dirty.delete(m); regroup(m); }
    const m = G.map, p = G.player; if (!m || !p || !m._cgList) return; camHide(m);
    // cartes de collision des châteaux seuls, préparées tranquillement à l'approche (shape.js laisse les objets à hAt)
    if ((qT = (qT + 1) % 30)) return;
    for (const o of m._cgList) if (!o._grp && o._k && Math.abs(o.x + 4.5 - p.x) < 30 && Math.abs(o.z + 4.5 - p.z) < 30) G.shapeMask(O[o.t], o._k);
  });
  // collisions : la carte du grand château, ou la forme du château seul
  const hAt = (o, x, z) => {
    const g = o._grp; if (!g) return G.shapeTop(o, O[o.t], x, z);
    let R = BUILT[g.name]; if (!R && MD[g.name]) { G.getGeo(g.name, 0); R = BUILT[g.name]; } if (!R) return O[o.t].h;
    const M = R.mask, [lx, lz] = toL(g.r, x - g.cx, z - g.cz), qx = Math.floor((lx + M.hx) * M.S), qz = Math.floor((lz + M.hz) * M.S);
    return qx < 0 || qz < 0 || qx >= M.W || qz >= M.D ? -1 : M.H[qz * M.W + qx];
  };
  for (const id of CAST) if (O[id]) O[id].hAt = hAt;

  // ---------- la grande porte : au milieu de la façade, elle mène au château principal du groupe ----------
  const doorOf = g => (BUILT[g.name] || { door: { z: g.rows * 3.5 - 1, hw: 1.1 } }).door;
  const furn = q => { const v = G.net && G.net.visit, im = q.iid && (v ? (v.interiors && v.interiors[q.iid]) || (v.homes && v.homes[q.iid]) : G.interiors[q.iid]); return !im ? -1 : im.list ? im.list.size : (im.objs || []).length; };
  const mainOf = g => { const D = doorOf(g); let best = null, bs = -Infinity; // le château du joueur, sinon le plus meublé, sinon le plus près de la porte
    for (const q of g.members) { const [lx, lz] = toL(g.r, q.x + (q.r & 1 ? 3.5 : 4.5) - g.cx, q.z + (q.r & 1 ? 4.5 : 3.5) - g.cz), f = furn(q), sc = (q.t === 'chateau_grand' ? 1e7 : 0) + (f >= 0 ? 1e4 + f * 10 : 0) - Math.hypot(lx, lz - D.z); if (sc > bs) { bs = sc; best = q; } }
    return best; };
  G.chateauGroup = o => o && o._grp ? { n: o._grp.n, cols: o._grp.cols, rows: o._grp.rows, name: G.chateauName(o._grp.st, o._grp.n), main: mainOf(o._grp) } : null;
  // un château classique seul est dessiné par le même générateur (cols = rows = 1) : même porte, même plan que l'intérieur
  let soloL = null; const soloLayout = () => soloL || (soloL = layout(0, 1, 1));
  const solo = o => { if (!o || o._grp || !CAST.includes(o.t) || styleOf(o) !== 0) return null; const [cx, cz] = G.map.center(o); return { cx, cz, r: o.r & 3, cols: 1, rows: 1, st: 0, n: 1, members: [o], single: true }; };
  const doorG = g => g.single ? soloLayout().door : doorOf(g);
  // le château et son plan : celui de son groupe s'il est assemblé, sinon lui seul (pour l'intérieur)
  G.chateauInfo = o => { if (!o || !CAST.includes(o.t)) return null; const g = o._grp || solo(o); if (!g) return { st: styleOf(o), cols: 1, rows: 1, r: o.r & 3, n: 1, single: true, main: o };
    return { st: g.st, cols: g.cols, rows: g.rows, r: g.r, n: g.n, single: !!g.single, main: g.single ? o : mainOf(g), cx: g.cx, cz: g.cz, door: doorG(g) }; };
  const ofront = G.act.front; G.act.front = o => { const g = o && (o._grp || solo(o)); if (!g) return ofront(o); const p = G.player, D = doorG(g), [lx, lz] = toL(g.r, p.x - g.cx, p.z - g.cz); return Math.abs(lx) < D.hw && lz > D.z - .5 && lz < D.z + 2.6; };
  const oenter = G.act.enterHouse; G.act.enterHouse = o => {
    const g = o && (o._grp || solo(o)); if (!g) return oenter(o); const q = g.single ? o : mainOf(g), res = oenter(q), key = q.iid || ('b' + q.t + '_' + q.x + '_' + q.z), v = G.net && G.net.visit;
    const im = (v && v.interiors && v.interiors[key]) || G.interiors[key]; if (im) { const D = doorG(g), [dx, dz] = toW(g.r, 0, D.z + 1.1); im.meta.door = { x: g.cx + dx, z: g.cz + dz, yaw: g.r * PI / 2 }; im.meta.title = G.chateauName(g.st, g.n); }
    return res;
  };
  // le château classique seul : même dessin ultra détaillé que les châteaux assemblés
  const och = MD.chateau2; MD.chateau2 = v => v % 3 === 0 ? build(0, 1, 1).geo : och(v);
  // le salon du château principal grandit avec le château (les meubles sont gardés) ; les châteaux à plan de pièces (chateau_interieur.js) ont leur propre intérieur
  G.on('enterMap', m => {
    if (!m || !m.interior || m.isVisit || m.meta.plan) return; let g = null; for (const w of [G.world, G.island]) if (w && w._cgList) for (const o of w._cgList) if (o._grp && o.iid === m.id && mainOf(o._grp) === o) g = o._grp; if (!g) return;
    const W = Math.min(40, 22 + 4 * (g.cols - 1)), H = Math.min(28, 16 + 3 * (g.rows - 1)); if (m.W >= W && m.H >= H) return;
    setTimeout(() => { if (G.map !== m) return; const nm = G.makeInterior('maison', m.id, { W: Math.max(W, m.W), H: Math.max(H, m.H), empty: true }); nm.meta.stage = G.HOME_STAGES.length;
      for (const q of m.list) { if (q.t === 'paillasson') continue; const ex = {}; for (const k of ['v', 'f', 'g', 'iid', 'off', 'txt']) if (q[k] != null) ex[k] = q[k]; if (nm.canPlace(q.t, q.x, q.z, q.r)) nm.addObj(q.t, q.x, q.z, q.r, ex); }
      for (const k of ['door', 'title', 'fromId']) nm.meta[k] = m.meta[k]; G.scene.remove(m.group); G.interiors[m.id] = nm; G.scene.add(nm.group); nm.group.visible = false; G.enterMap(nm, Math.floor(nm.W / 2) + .5, nm.H - 1.4, PI); }, 0);
  });
  // aimant : un château posé (ou déplacé avec B) près d'un château identique se cale pile à côté de lui, aligné et sans case vide, pour qu'ils s'assemblent.
  // Posé à l'init, après tous les modules : c'est le dernier mot sur la case où va le château (fantôme et pose).
  G.on('init', () => { const oan = G.act.anchor; G.act.anchor = (d, r, tx, tz) => {
    const base = oan(d, r, tx, tz), m = G.map, p = G.player; if (!d || !CAST.includes(d.id) || !m || !m._cgList || !p) return base;
    const mv = G.move && G.move.c && G.move.c.t === d.id ? G.move.c.ex : null, st = ((mv && mv.v != null ? mv.v : d.v) || 0) % 3, [w, dd] = G.fpDims(d, r), [x0, z0] = base, sv = G._deckY; let best = null, bd = 5;
    G._deckY = p.y; try { for (const q of m._cgList) { if ((q.r & 3) !== (r & 3) || styleOf(q) !== st || Math.abs(q.x - x0) > w + 6 || Math.abs(q.z - z0) > dd + 6) continue;
      for (const [cx, cz] of [[q.x + w, q.z], [q.x - w, q.z], [q.x, q.z + dd], [q.x, q.z - dd]]) { const dist = Math.max(Math.abs(cx - x0), Math.abs(cz - z0)); if (dist >= bd || !m.inb(cx, cz) || m.baseH(cx, cz) !== q.y) continue;
        if (m.canPlace(d.id, cx, cz, r) && !G.act.occupiedByMe(d, r, cx, cz)) { best = [cx, cz]; bd = dist; } } } } finally { G._deckY = sv; }
    return best || base; }; });
  for (let k = 0; k < 3; k++) { const it = G.ITEMS['chateau_cat' + k]; if (it) it.desc = 'Pose plusieurs fois ce même château côte à côte, sans case vide entre eux, en largeur comme en profondeur : ils s\'assemblent en un seul château, toujours plus grand, plus haut et plus beau !'; }
  G.chateauFusion = { build, plan, regroup, layout, toL, toW, onW, RY, NR };
})();
