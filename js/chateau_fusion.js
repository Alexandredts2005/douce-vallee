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
  function crest(C, x0, z0, x1, z1, y) { const b = C.b, L = Math.hypot(x1 - x0, z1 - z0), n = Math.min(30, Math.floor(L / C.u)); if (L < .1) return;
    bx(b, Math.abs(x1 - x0) + .06, .06, Math.abs(z1 - z0) + .06, GOLD, (x0 + x1) / 2, y + .03, (z0 + z1) / 2);
    for (let k = 0; k <= n; k++) { const t = n ? k / n : .5; b.cone(.05 * C.u, .22 * C.u, 6, GOLD, x0 + (x1 - x0) * t, y + .15 * C.u, z0 + (z1 - z0) * t); } }
  function chimney(C, x, z, y0, y1, col, cap, along) { const b = C.b, u = C.u, w = .36 * u, d = .7 * u; b.P(C.st === 2 ? PT.brique : PT.pierre); bx(b, along ? d : w, y1 - y0, along ? w : d, col, x, (y0 + y1) / 2, z); bx(b, (along ? d : w) + .08 * u, .1 * u, (along ? w : d) + .08 * u, cap, x, y1 + .05 * u, z); b.P(0);
    for (const k of [-.18, .18]) b.cyl(.05 * u, .06 * u, .16 * u, 6, 0xc0603c, x + (along ? k * u : 0), y1 + .18 * u, z + (along ? 0 : k * u)); }

  // ---------- plan : où vont les corps de logis, les pavillons, les ailes, la cour ----------
  function plan(cols, rows, st = 0) {
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
    if (kind === 'X') { // une seule rangée : longue façade, reculée au fond du terrain pour laisser devant une vraie cour d'honneur
      const xa = X0 + .35, xb = X1 - .35, zf = Math.min(Z1 - 1.6 * u, Z0 + (st === 1 ? .9 * u : .28) + .4 * u + 2 * pdx + bd), zb1 = zf - pdx, zb0 = zb1 - bd, E = barX(xa, xb, zb0, zb1, 1.7 * u, nf, zb0 - pdx, zb1 + pdx);
      cl(xa - .4 * u, zb0 - pdx - .4 * u, xb + .4 * u, zf + .4 * u); P.zT = Math.min(Z1 - .1, zf + .4 * u);
      for (const B of [E.L, E.R]) for (const z of [B.z0, B.z1]) P.T.push({ x: B.x0 < 0 ? B.x0 : B.x1, z, B });
    } else if (kind === 'Z') { // une seule colonne : le château en façade, une longue aile en arrière (en T)
      const xa = X0 + .35, xb = X1 - .35, zf = Z1 - 1.6 * u, zb1 = zf - pdx, zb0 = zb1 - bd, E = barX(xa, xb, zb0, zb1, 1.7 * u, nf, zb0 - pdx, zb1 + pdx);
      const hw = Math.min(1.3 * u, (Wl - .7) * .2), zk = Z0 + u, Bk = add(-hw - pdx, hw + pdx, zk, zk + 1.7 * u, 'pav', nf); barZ(-hw, hw, zk + 1.7 * u, zb0 - pdx * .5, nf, null);
      cl(xa - .4 * u, zb0 - pdx - .4 * u, xb + .4 * u, zf + .4 * u); cl(-hw - pdx - .4 * u, zk - .4 * u, hw + pdx + .4 * u, zb0 - pdx - .4 * u); P.zT = Math.min(Z1 - .1, zf + .4 * u);
      P.side = [hw + pdx + .4 * u + .08, Z0 + .22, X1 - .2, zb0 - pdx - .4 * u - .06]; // jardins de part et d'autre de l'aile
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
    const P = plan(cols, rows, st), S = PAL[st], { u, lvl } = P, FH = 1.8 * u, C = Object.assign({ S, st, FH, rs: [], cs: [], nwin: 0 }, P);
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
    if (C.kind === 'U') { C.zP = Math.min(C.Z1 - .9, Math.max(C.zT, D.z1 + .6 * u)); if (C.zP > C.zT + .05) C.ter.push([D.x0 - .2 * u, C.zT, D.x1 + .2 * u, C.zP]); } // devant la porte, la terrasse avance jusqu'au perron
    else { C.ew = (D.x1 - D.x0) / 2 + .2 * u; C.zP = Math.min(C.Z1 - 1.6, Math.max(C.zT, D.z1 + .25 * u) + .72); C.ter.push([-C.ew, C.zT - .05, C.ew, C.zP]); } // perron à deux rampes
    for (const [x0, z0, x1, z1] of C.ter) { b.P(PT.pierre); b.box(x1 - x0, TH, z1 - z0, S.base, (x0 + x1) / 2, TH / 2, (z0 + z1) / 2); b.P(0); C.rect(x0, z0, x1, z1, TH); }
    for (const B of C.B) block(C, B);
    for (const B of C.B) (st === 0 ? roofC : st === 1 ? roofL : roofT)(C, B);
    for (const T of C.tw) tower(C, T);
    const n0 = C.b.parts.map(p => p.length); grandDoor(C, D);
    gardens(C); for (let m = 0; m < C.b.parts.length; m++) for (let i = n0[m]; i < C.b.parts[m].length; i++) { const g = C.b.parts[m][i]; if (g.userData.sk === G.SK.gold) g.userData.sk = G.SK.ceramic; }
    const geo = b.done(); return { geo, mask: mask(C), door: { z: D.z1, hw: Math.max(1.1, .55 * u) }, P: C, fx: { door: C.doorFx, gates: C.gates || [], founts: C.founts || [] } };
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
  // ---------- jardins à la française : gazon tondu à bandes, allées de gravier ratissé, buis taillés, broderies, bassins, grilles dorées ----------
  const LAWN = 0x72b04a, GRAV = 0xdccdab, BUIS = 0x3d6e31, IF = 0x2b5a2a, SOIL = 0x5e4532, BRIQ = 0xb35f45, MARB = 0xf4f1ea, IRONK = 0x1c2320, WAT = 0x7cc6de, BRONZE = 0x5a7763, OAK = 0x6b4423;
  // ---------- la grande porte : encadrement de pierre à colonnes ioniques, imposte en éventail dorée, lanternes ; les deux vantaux de chêne sculpté sont vivants ----------
  function grandDoor(C, D) {
    const { b, u, S, st } = C, H = D.H, w = .92 * u, hL = 1.36 * u, rr = w / 2, y0 = TH, zf = H.zc + H.d / 2, yA = y0 + hL, yTop = yA + rr, cr = .075 * u, cx = w / 2 + .21 * u, out = .2 * u, yE = yTop + .06 * u, eh = .2 * u, zc = zf + out * .55;
    // fond sombre du vestibule (on le voit quand les vantaux s'ouvrent) et ébrasement de pierre
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, hL); sh.absarc(0, hL, rr, 0, PI, false); sh.lineTo(-w / 2, 0);
    b.add(new THREE.ShapeGeometry(sh, 10), 0x2e2318, b.M(0, y0, zf + .004));
    b.P(PT.pierre); for (const sx of [-1, 1]) bx(b, .07 * u, hL, out, S.trim, sx * (w / 2 + .035 * u), y0 + hL / 2, zf + out / 2); b.P(0);
    // imposte : vitrage en demi-cercle, rayons et rosace dorés, traverse de chêne
    b.add(new THREE.CircleGeometry(rr - .02, 20, 0, PI), 0x9fb9d4, b.M(0, yA, zf + .02), 1);
    for (let k = 1; k < 8; k++) { const a = k / 8 * PI; b.add(new THREE.BoxGeometry(.016 * u, rr - .04, .02), GOLD, b.M(Math.cos(a) * (rr - .04) / 2, yA + Math.sin(a) * (rr - .04) / 2, zf + .035, 0, 0, a - PI / 2)); }
    b.add(new THREE.TorusGeometry(rr * .52, .012 * u, 4, 14, PI), GOLD, b.M(0, yA, zf + .035)); b.add(new THREE.CircleGeometry(rr * .2, 12, 0, PI), GOLD, b.M(0, yA, zf + .04));
    b.add(new THREE.TorusGeometry(rr - .02, .024 * u, 4, 18, PI), 0xf7f2e6, b.M(0, yA, zf + .03));
    bx(b, w + .04, .07 * u, .09, OAK, 0, yA - .03 * u, zf + .045);
    // archivolte moulurée, clé à mascaron doré
    b.P(PT.pierre); b.add(new THREE.TorusGeometry(rr + .075 * u, .065 * u, 5, 20, PI), S.trim, b.M(0, yA, zf + out * .5), 0, true);
    bx(b, .2 * u, .3 * u, out + .05, S.pil, 0, yTop + .05 * u, zf + out / 2); b.P(0); dot(b, .06 * u, GOLD, 0, yTop + .04 * u, zf + out + .05, 1);
    // colonnes ioniques sur piédestaux, entablement (il porte le balcon de l'étage noble), lanternes sur consoles
    for (const sx of [-1, 1]) { const x = sx * cx;
      b.P(PT.pierre); bx(b, cr * 3.3, .34 * u, cr * 3.3, S.trim, x, y0 + .17 * u, zc); bx(b, cr * 3.7, .06 * u, cr * 3.7, S.pil, x, y0 + .37 * u, zc); b.P(0);
      b.add(new THREE.CylinderGeometry(cr, cr * 1.12, yE - y0 - .5 * u, 16), S.pil, b.M(x, (y0 + .4 * u + yE - .1 * u) / 2, zc), 0, true);
      b.add(new THREE.TorusGeometry(cr * 1.15, .016 * u, 4, 14), S.trim, b.M(x, y0 + .42 * u, zc, PI / 2, 0, 0));
      b.P(PT.pierre); bx(b, cr * 3.1, .07 * u, cr * 3.1, S.trim, x, yE - .07 * u, zc); b.P(0);
      for (const s2 of [-1, 1]) b.add(new THREE.TorusGeometry(.032 * u, .011 * u, 4, 10), C.lvl >= 2 ? GOLD : S.trim, b.M(x + s2 * cr * 1.15, yE - .14 * u, zc + cr * .9));
      const lx = sx * (cx + .36 * u), lz = zf + .22 * u; bx(b, .04 * u, .14 * u, .22 * u, IRONK, lx, y0 + 1.15 * u, zf + .1 * u);
      b.add(new THREE.CylinderGeometry(.07 * u, .05 * u, .05 * u, 6), IRONK, b.M(lx, y0 + 1.02 * u, lz)); b.add(new THREE.CylinderGeometry(.05 * u, .05 * u, .16 * u, 6), 0xffe2a0, b.M(lx, y0 + 1.12 * u, lz), 1);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; bx(b, .011 * u, .17 * u, .011 * u, IRONK, lx + Math.cos(a) * .055 * u, y0 + 1.12 * u, lz + Math.sin(a) * .055 * u); }
      b.add(new THREE.ConeGeometry(.085 * u, .1 * u, 6), IRONK, b.M(lx, y0 + 1.25 * u, lz)); dot(b, .022 * u, GOLD, lx, y0 + 1.31 * u, lz);
      C.rect(x - cr * 1.7, zf, x + cr * 1.7, zf + out + .1, yE); }
    b.P(PT.pierre); bx(b, 2 * cx + cr * 4, eh * .45, out + .14, S.trim, 0, yE + eh * .22, zc); bx(b, 2 * cx + cr * 4.8, eh * .3, out + .22, S.pil, 0, yE + eh * .6, zc); b.P(0);
    if (C.lvl >= 2) bx(b, 2 * cx + cr * 4.2, .02 * u, .02, GOLD, 0, yE + eh * .3, zc + out / 2 + .08);
    if (!(st === 0 && D.nf >= 2)) { // sans balcon au-dessus : fronton cintré et cartouche aux armes
      b.P(PT.pierre); b.add(new THREE.CylinderGeometry(cx + .12 * u, cx + .12 * u, out + .12, 20, 1, false, -PI / 2, PI), S.trim, b.M(0, yE + eh * .76, zc, PI / 2, 0, 0, 1, 1, .42)); b.P(0);
      b.add(new THREE.SphereGeometry(.12 * u, 12, 8), C.lvl >= 2 ? GOLD : S.pil, b.M(0, yE + eh + .1 * u, zf + out + .03, 0, 0, 0, .8, 1, .3)); }
    C.doorFx = { x: 0, y: y0, z: zf + .02, w, h: hL - .035 * u };
  }
  const lawn = (C, x0, z0, x1, z1) => { if (x1 - x0 < .08 || z1 - z0 < .08) return; C.b.P(PT.gazon); bx(C.b, x1 - x0, .11, z1 - z0, LAWN, (x0 + x1) / 2, 0, (z0 + z1) / 2); C.b.P(0); };
  const gravel = (C, x0, z0, x1, z1, col = GRAV, y = .03) => { if (x1 - x0 < .08 || z1 - z0 < .08) return; C.b.P(PT.gravier); bx(C.b, x1 - x0, y * 2, z1 - z0, col, (x0 + x1) / 2, 0, (z0 + z1) / 2); C.b.P(0); };
  const hedge = (C, x0, z0, x1, z1, h, col = BUIS, coll = true) => { if (x1 - x0 < .02 || z1 - z0 < .02) return; C.b.P(PT.buis); bx(C.b, x1 - x0, h, z1 - z0, col, (x0 + x1) / 2, h / 2, (z0 + z1) / 2); C.b.P(0); if (coll) C.rect(x0, z0, x1, z1, h); };
  const frame = (C, x0, z0, x1, z1, t, h, col = BUIS, coll = false) => { hedge(C, x0, z0, x1, z0 + t, h, col, coll); hedge(C, x0, z1 - t, x1, z1, h, col, coll); hedge(C, x0, z0 + t, x0 + t, z1 - t, h, col, coll); hedge(C, x1 - t, z0 + t, x1, z1 - t, h, col, coll); };
  // arc de buis couché au sol (broderie) : un point à l'angle a est en (cx + r cos a, cz + r sin a)
  const arcB = (C, cx, cz, r, a0, sw, t = .05, h = 1.5, col = BUIS) => { if (r < .03 || sw < .05) return; C.b.P(PT.buis); C.b.add(new THREE.TorusGeometry(r, t, 4, Math.max(5, Math.round(sw * Math.sqrt(r) * 6)), sw), col, C.b.M(cx, t * h * .6, cz, PI / 2, -a0, 0, 1, 1, h)); C.b.P(0); };
  // le même arc vu dans un miroir (quart de parterre sx, sz)
  const mA = (sx, sz, a0, sw) => sx > 0 ? (sz > 0 ? a0 : -(a0 + sw)) : (sz > 0 ? PI - (a0 + sw) : a0 + PI);
  const disc = (C, x, z, r, y, col, pat = PT.gravier, seg = 28) => { C.b.P(pat); C.b.add(new THREE.CylinderGeometry(r, r, y * 2, seg), col, C.b.M(x, 0, z)); C.b.P(0); };
  const lathe = (b, pts, seg, col, x, y, z, mat = 0) => b.add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg), col, b.M(x, y, z), mat);
  // vase Médicis (pierre ou bronze doré), garni de fleurs si on veut
  function urne(b, x, y, z, s, col, fl) {
    lathe(b, [[0, 0], [.13, 0], [.13, .05], [.08, .07], [.06, .12], [.07, .16], [.13, .2], [.17, .28], [.18, .36], [.2, .4], [.23, .43], [.21, .45], [0, .45]].map(p => [p[0] * s, p[1] * s]), 12, col, x, y, z);
    for (const sx of [-1, 1]) b.add(new THREE.TorusGeometry(.06 * s, .012 * s, 4, 8, PI), col, b.M(x + sx * .19 * s, y + .3 * s, z, 0, 0, sx > 0 ? -PI / 2 : PI / 2));
    if (fl) { b.jit(.1); b.add(new THREE.IcosahedronGeometry(.17 * s, 1), 0x3f7a35, b.M(x, y + .5 * s, z, 0, 0, 0, 1, .55, 1)); b.jit(0); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; dot(b, .045 * s, fl[k % fl.length], x + Math.cos(a) * .13 * s, y + .55 * s + (k % 2) * .03 * s, z + Math.sin(a) * .13 * s); } }
  }
  // pot à feu : urne de pierre couronnée de flammes dorées
  function potFeu(b, x, y, z, s, col) { urne(b, x, y, z, s * .9, col); b.S(G.SK.gold); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; b.add(new THREE.SphereGeometry(.05 * s, 8, 6), GOLD, b.M(x + Math.cos(a) * .07 * s, y + .52 * s, z + Math.sin(a) * .07 * s, Math.sin(a) * .3, 0, -Math.cos(a) * .3, 1, 2.4, 1)); } b.add(new THREE.SphereGeometry(.07 * s, 10, 8), GOLD, b.M(x, y + .56 * s, z, 0, 0, 0, 1, 2.6, 1)); b.add(new THREE.ConeGeometry(.03 * s, .14 * s, 8), GOLD, b.M(x, y + .8 * s, z)); b.S(null); }
  // caisse de Versailles (bois peint, montants à boules dorées)
  function caisse(b, x, z, s) { const w = .5 * s; bx(b, w, w * .9, w, 0xf0ece0, x, w * .45, z); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { bx(b, .06 * s, w * .98, .06 * s, 0x2f4f3c, x + dx * w / 2, w * .49, z + dz * w / 2); dot(b, .045 * s, GOLD, x + dx * w / 2, w + .03 * s, z + dz * w / 2, 1); } bx(b, w + .02, .04 * s, w + .02, 0x2f4f3c, x, w * .9, z); }
  // ifs et buis taillés : cône, boule sur tige en caisse, pièce montée (trois boules)
  function ifCone(C, x, z, s, coll = true) { const b = C.b; b.P(PT.buis); b.add(new THREE.ConeGeometry(.26 * s, 1.05 * s, 12), IF, b.M(x, .55 * s, z)); b.add(new THREE.CylinderGeometry(.27 * s, .27 * s, .1 * s, 12), IF, b.M(x, .06 * s, z)); b.P(0); if (coll) C.circ(x, z, .24 * s, 1.1 * s); }
  function boule(C, x, z, s, coll = true) { const b = C.b; caisse(b, x, z, s * .7); b.cyl(.025 * s, .03 * s, .5 * s, 6, 0x5b4128, x, .55 * s, z); b.P(PT.buis); b.add(new THREE.IcosahedronGeometry(.24 * s, 2), BUIS, b.M(x, .95 * s, z)); b.P(0); if (coll) C.circ(x, z, .2 * s, 1.15 * s); }
  function monte(C, x, z, s, coll = true) { const b = C.b; b.P(PT.buis); for (const [r, y] of [[.25, .25], [.19, .63], [.13, .93]]) b.add(new THREE.IcosahedronGeometry(r * s, 2), IF, b.M(x, y * s, z)); b.P(0); if (coll) C.circ(x, z, .24 * s, 1.05 * s); }
  // oranger en caisse
  function oranger(C, x, z, s, i = 0) { const b = C.b; caisse(b, x, z, s); b.cyl(.035 * s, .05 * s, .55 * s, 6, 0x6b4a2e, x, .72 * s, z); b.jit(.08); b.add(new THREE.IcosahedronGeometry(.38 * s, 2), 0x3f8a3a, b.M(x, 1.22 * s, z)); b.jit(0);
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + i; dot(b, .055 * s, 0xff9a1f, x + Math.cos(a) * .3 * s, 1.15 * s + (k % 3) * .1 * s, z + Math.sin(a) * .3 * s); } C.circ(x, z, .3 * s, 1.6 * s); }
  // statue de marbre (ou de bronze doré) sur un piédestal mouluré, tournée vers ry
  function statueG(b, x, y, z, s, col = 0xf1ede4, ry = 0, ped = true) {
    let y0 = y; if (ped) { b.P(PT.pierre); bx(b, .46 * s, .1 * s, .46 * s, 0xe3dccd, x, y + .05 * s, z); bx(b, .36 * s, .46 * s, .36 * s, 0xe9e3d6, x, y + .33 * s, z); bx(b, .44 * s, .08 * s, .44 * s, 0xe3dccd, x, y + .6 * s, z); b.P(0); y0 = y + .64 * s; }
    const c = Math.cos(ry), sn = Math.sin(ry), L = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c], g = col === GOLD ? GOLD : col;
    b.add(new THREE.CylinderGeometry(.15 * s, .16 * s, .05 * s, 10), g, b.M(x, y0 + .025 * s, z));
    b.add(new THREE.CylinderGeometry(.08 * s, .135 * s, .48 * s, 10), g, b.M(x, y0 + .29 * s, z, 0, ry, .05)); // drapé jusqu'aux pieds
    let p = L(-.012 * s, 0); b.add(new THREE.CylinderGeometry(.1 * s, .078 * s, .27 * s, 10), g, b.M(p[0], y0 + .65 * s, p[1], 0, ry, -.06)); // buste
    b.add(new THREE.SphereGeometry(.07 * s, 10, 6), g, b.M(x, y0 + .79 * s, z, 0, ry, 0, 1.75, .6, 1)); // épaules
    b.add(new THREE.CylinderGeometry(.026 * s, .03 * s, .06 * s, 8), g, b.M(x, y0 + .84 * s, z));
    b.add(new THREE.SphereGeometry(.058 * s, 10, 8), g, b.M(x, y0 + .91 * s, z, 0, ry, .1, .95, 1.08, 1)); // tête, un peu penchée
    p = L(-.03 * s, -.01 * s); b.add(new THREE.SphereGeometry(.03 * s, 8, 6), g, b.M(p[0], y0 + .94 * s, p[1])); // chignon
    p = L(-.12 * s, 0); b.add(new THREE.CylinderGeometry(.022 * s, .026 * s, .3 * s, 7), g, b.M(p[0], y0 + .64 * s, p[1], 0, ry, .12)); // bras le long du corps
    p = L(.13 * s, .02 * s); b.add(new THREE.CylinderGeometry(.022 * s, .026 * s, .28 * s, 7), g, b.M(p[0], y0 + .93 * s, p[1], 0, ry, -.5)); // bras levé
    p = L(.2 * s, .03 * s); b.add(new THREE.TorusGeometry(.05 * s, .011 * s, 4, 10), col === GOLD ? GOLD : 0xe9e1cc, b.M(p[0], y0 + 1.09 * s, p[1], 0, ry, 0)); // couronne de lauriers brandie
    p = L(0, .07 * s); b.add(new THREE.BoxGeometry(.24 * s, .05 * s, .03 * s), g, b.M(p[0], y0 + .62 * s, p[1], 0, ry, .7)); // écharpe du drapé
  }
  function statue(C, x, z, s, ry = 0, gold = false) { statueG(C.b, x, 0, z, s, gold ? GOLD : 0xf1ede4, ry); C.rect(x - .23 * s, z - .23 * s, x + .23 * s, z + .23 * s, 1.2 * s); }
  // banc de pierre
  function banc(C, x, z, s, along) { const b = C.b, w = .9 * s, d = .3 * s; b.P(PT.pierre); for (const k of [-1, 1]) bx(b, along ? .12 * s : d * .8, .3 * s, along ? d * .8 : .12 * s, 0xe3dccd, x + (along ? k * w * .36 : 0), .15 * s, z + (along ? 0 : k * w * .36)); bx(b, along ? w : d, .06 * s, along ? d : w, 0xece6d8, x, .33 * s, z); b.P(0); C.rect(x - (along ? w : d) / 2, z - (along ? d : w) / 2, x + (along ? w : d) / 2, z + (along ? d : w) / 2, .36 * s); }
  // lanterne sur un candélabre de fonte
  function candelabre(C, x, z, s) { const b = C.b; b.cyl(.06 * s, .09 * s, .2 * s, 8, IRONK, x, .1 * s, z); b.cyl(.025 * s, .035 * s, 1.55 * s, 8, IRONK, x, .95 * s, z); b.add(new THREE.TorusGeometry(.05 * s, .01 * s, 4, 10), GOLD, b.M(x, 1.5 * s, z, PI / 2, 0, 0));
    b.cyl(.055 * s, .07 * s, .26 * s, 6, 0xffe2a0, x, 1.85 * s, z, 0, 0, 0, 1); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + PI / 4; bx(b, .012 * s, .28 * s, .012 * s, IRONK, x + Math.cos(a) * .07 * s, 1.85 * s, z + Math.sin(a) * .07 * s); }
    b.cone(.1 * s, .12 * s, 6, IRONK, x, 2.05 * s, z); dot(b, .025 * s, GOLD, x, 2.13 * s, z); C.circ(x, z, .08, 1.9 * s); }

  // ---------- parterre de broderie : cadre de buis, plate-bande fleurie, rinceaux de buis sur brique pilée, médaillon de marbre blanc ----------
  function broderie(C, x0, z0, x1, z1, s) {
    const b = C.b, w = x1 - x0, d = z1 - z0, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, fl = C.S.fl; C.rect(x0, z0, x1, z1, .46);
    if (w < 1.1 || d < 1.1) { lawn(C, x0, z0, x1, z1); frame(C, x0, z0, x1, z1, .1, .2); if (w > .6 && d > .6) ifCone(C, xc, zc, .55 * s, false); return; }
    const t = Math.min(.16, .07 + Math.min(w, d) * .03), pb = Math.min(w, d) > 2.1 ? .34 : 0;
    frame(C, x0, z0, x1, z1, t, .27);
    let ix0 = x0 + t, ix1 = x1 - t, iz0 = z0 + t, iz1 = z1 - t;
    if (pb) { // plate-bande : terre, fleurs sur deux rangs, petits ifs en cône aux angles
      for (const [a, c, e, f] of [[ix0, iz0, ix1, iz0 + pb], [ix0, iz1 - pb, ix1, iz1], [ix0, iz0 + pb, ix0 + pb, iz1 - pb], [ix1 - pb, iz0 + pb, ix1, iz1 - pb]]) bx(b, e - a, .13, f - c, SOIL, (a + e) / 2, 0, (c + f) / 2);
      const W2 = ix1 - ix0 - pb, D2 = iz1 - iz0 - pb, per = 2 * (W2 + D2), n = Math.min(110, Math.floor(per / .18));
      for (let k = 0; k < n; k++) { let q = (k + .5) / n * per, x, z; const h0 = pb / 2;
        if (q < W2) { x = ix0 + h0 + q; z = iz0 + h0; } else if ((q -= W2) < D2) { x = ix1 - h0; z = iz0 + h0 + q; } else if ((q -= D2) < W2) { x = ix1 - h0 - q; z = iz1 - h0; } else { x = ix0 + h0; z = iz1 - h0 - (q - W2); }
        dot(b, .062, k % 4 === 3 ? 0x3f7a35 : fl[k % 3], x + (k % 2 - .5) * .09, .14 + (k % 3) * .02, z + ((k >> 1) % 2 - .5) * .09); }
      for (const [x, z] of [[ix0 + pb / 2, iz0 + pb / 2], [ix1 - pb / 2, iz0 + pb / 2], [ix0 + pb / 2, iz1 - pb / 2], [ix1 - pb / 2, iz1 - pb / 2]]) ifCone(C, x, z, .5 * s, false);
      ix0 += pb; ix1 -= pb; iz0 += pb; iz1 -= pb; frame(C, ix0, iz0, ix1, iz1, .07, .17); ix0 += .07; ix1 -= .07; iz0 += .07; iz1 -= .07; }
    const iw = ix1 - ix0, id = iz1 - iz0, ax = iw >= id, Lg = ax ? iw : id, Sh = ax ? id : iw;
    if (Sh < .8) { lawn(C, ix0, iz0, ix1, iz1); for (let k = 0, n = Math.max(1, Math.round(Lg / 1.2)); k < n; k++) monte(C, ax ? ix0 + (k + .5) * iw / n : xc, ax ? zc : iz0 + (k + .5) * id / n, .42 * s, false); return; }
    gravel(C, ix0, iz0, ix1, iz1, BRIQ, .062);
    const k = Math.max(1, Math.round(Lg / Sh)), cl = Lg / k, tb = G.clamp(.03 + Sh * .022, .045, .09);
    for (let i = 0; i < k; i++) { const cx = ax ? ix0 + (i + .5) * cl : xc, cz = ax ? zc : iz0 + (i + .5) * cl; motif(C, cx, cz, (ax ? cl : iw) / 2, (ax ? id : cl) / 2, tb, s, i);
      if (i > 0) { b.P(PT.buis); dot(b, tb * 2, BUIS, ax ? ix0 + i * cl : xc, tb * 1.4, ax ? zc : iz0 + i * cl, 1); b.P(0); } }
  }
  // un motif de broderie (cellule hx × hz) : médaillon de marbre cerclé de buis, quatre volutes en C enroulées, rinceaux sur les côtés, fleurs
  function motif(C, cx, cz, hx, hz, tb, s, i) {
    const b = C.b, m = Math.min(hx, hz), rr = m * .33, fl = C.S.fl;
    disc(C, cx, cz, rr, .072, MARB); arcB(C, cx, cz, rr, 0, TAU, tb); arcB(C, cx, cz, rr * .52, 0, TAU, tb * .8);
    if (m > 1.2 && C.lvl >= 3) urne(b, cx, .07, cz, .8 * s, GOLD, fl); else if (m > .7) monte(C, cx, cz, Math.min(.5, m * .32) * s, false);
    else for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; dot(b, .05, fl[k % 3], cx + Math.cos(a) * rr * .3, .12, cz + Math.sin(a) * rr * .3); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const qx = cx + sx * hx * .6, qz = cz + sz * hz * .58, r1 = m * .25, A = (a0, sw) => mA(sx, sz, a0, sw), e0 = -PI * .44, sw = PI * 1.4, e1 = e0 + sw;
      arcB(C, qx, qz, r1, A(e0, sw), sw, tb); // la volute, ouverte vers le médaillon
      for (const [e, a1] of [[e0, e0 + PI * .15], [e1, e1 - PI * 1.75]]) { const rc = r1 * .4, px = qx + sx * (r1 - rc) * Math.cos(e), pz = qz + sz * (r1 - rc) * Math.sin(e); arcB(C, px, pz, rc, A(a1, PI * 1.6), PI * 1.6, tb * .8); } // enroulements
      b.P(PT.buis); dot(b, tb * 1.7, BUIS, cx + sx * hx * .9, tb * 1.3, cz + sz * hz * .9, 1); b.P(0); // boule dans l'angle
      for (let k = 0; k < 3; k++) dot(b, .055, fl[(k + i) % 3], qx + sx * (k - 1) * r1 * .3, .12, qz + sz * (1 - Math.abs(k - 1)) * r1 * .2); }
    // rinceaux : un demi-cercle au milieu de chaque côté, tourné vers le médaillon
    arcB(C, cx + hx * .92, cz, hz * .3, PI / 2, PI, tb * .85); arcB(C, cx - hx * .92, cz, hz * .3, -PI / 2, PI, tb * .85);
    arcB(C, cx, cz + hz * .92, hx * .3, PI, PI, tb * .85); arcB(C, cx, cz - hz * .92, hx * .3, 0, PI, tb * .85);
  }
  // ---------- fontaine majestueuse : bassin à margelle moulurée, socle à dauphins, deux vasques festonnées, groupe doré, jets ----------
  function fontaine(C, x, z, R, grand) {
    const b = C.b, lvl = C.lvl, st = 0xece5d5, sr = G.clamp(R * .42, .42, 1.9), gold = grand || lvl >= 3, metal = gold ? GOLD : BRONZE, S2 = k => k * sr;
    const prof = [[R + .17, 0], [R + .17, .07], [R + .09, .12], [R + .07, .37], [R + .12, .41], [R + .12, .49], [R + .04, .55], [R - .07, .53], [R - .14, .45], [R - .14, .12]];
    b.P(PT.pierre); lathe(b, prof, Math.min(72, 28 + Math.round(R * 12)), st, x, 0, z); b.P(0);
    b.add(new THREE.CylinderGeometry(R - .13, R - .13, .03, 40), 0x2a4d56, b.M(x, .13, z));
    b.add(new THREE.CylinderGeometry(R - .135, R - .135, .02, 48), WAT, b.M(x, .4, z), 2);
    const big = R > 1.05, F = { x, z, R, wy: .41, sr, dol: [], gold };
    // socle octogonal sortant de l'eau
    b.P(PT.pierre); b.add(new THREE.CylinderGeometry(S2(.44), S2(.52), .62, 8), st, b.M(x, .31, z)); b.add(new THREE.CylinderGeometry(S2(.56), S2(.56), .08, 8), st, b.M(x, .64, z)); b.P(0);
    const yS = .68;
    if (big) for (let k = 0; k < 4; k++) { // quatre dauphins qui crachent l'eau dans le bassin
      const a = k * PI / 2 + PI / 4, ca = Math.cos(a), sa = Math.sin(a), rc = S2(.5), r = S2(.2), yc = yS + r + .02;
      b.add(new THREE.TorusGeometry(r, S2(.07), 6, 12, PI * 1.12), metal, b.M(x + ca * rc, yc, z + sa * rc, 0, -a, -PI * .56), 0, true);
      const hx = x + ca * (rc + S2(.04)), hz = z + sa * (rc + S2(.04)), hy = yc - r * .95;
      b.add(new THREE.SphereGeometry(S2(.09), 10, 8), metal, b.M(hx, hy, hz, 0, -a, 0, 1.25, .9, 1));
      b.add(new THREE.ConeGeometry(S2(.05), S2(.14), 8), metal, b.M(hx + ca * S2(.1), hy - S2(.03), hz + sa * S2(.1), 0, -a, -PI / 2 - .5));
      for (const s2 of [-1, 1]) b.add(new THREE.ConeGeometry(S2(.06), S2(.18), 6), metal, b.M(x + ca * (rc - S2(.02)) - sa * s2 * S2(.06), yc + r * 1.05 + S2(.06), z + sa * (rc - S2(.02)) + ca * s2 * S2(.06), 0, -a, s2 * .7));
      F.dol.push([hx + ca * S2(.17), hy - S2(.07), hz + sa * S2(.17), ca, sa]); }
    // balustre, vasque basse festonnée, balustre, vasque haute
    b.P(PT.pierre); lathe(b, [[S2(.22), 0], [S2(.22), S2(.08)], [S2(.12), S2(.16)], [S2(.1), S2(.3)], [S2(.17), S2(.5)], [S2(.17), S2(.62)], [S2(.09), S2(.8)], [S2(.13), S2(.9)], [S2(.2), S2(.98)], [0, S2(.98)]], 14, st, x, yS, z); b.P(0);
    const v1 = yS + S2(1.2), r1 = S2(big ? .98 : .8);
    b.P(PT.pierre); lathe(b, [[0, -S2(.3)], [S2(.24), -S2(.3)], [S2(.32), -S2(.22)], r1 > 0 ? [r1 * .62, -S2(.14)] : [0, 0], [r1 * .9, -S2(.04)], [r1, S2(.04)], [r1 * 1.02, S2(.08)], [r1 * .94, S2(.08)], [r1 * .9, S2(.03)], [0, S2(.03)]], 36, st, x, v1, z); b.P(0);
    b.add(new THREE.CylinderGeometry(r1 * .9, r1 * .9, .02, 32), WAT, b.M(x, v1 + S2(.05), z), 2);
    for (let k = 0, n = big ? 16 : 10; k < n; k++) { const a = k / n * TAU; b.add(new THREE.SphereGeometry(S2(.06), 6, 4), gold && k % 2 ? GOLD : st, b.M(x + Math.cos(a) * r1 * 1.01, v1 + S2(.02), z + Math.sin(a) * r1 * 1.01, 0, -a, 0, .6, 1, 1.3)); }
    F.v1 = v1 + S2(.06); F.r1 = r1;
    let yTop = v1 + S2(.08);
    if (big || gold) { b.P(PT.pierre); lathe(b, [[S2(.14), 0], [S2(.08), S2(.12)], [S2(.11), S2(.3)], [S2(.07), S2(.5)], [S2(.12), S2(.58)], [0, S2(.58)]], 12, st, x, yTop, z); b.P(0);
      const v2 = yTop + S2(.66), r2 = S2(.52);
      b.P(PT.pierre); lathe(b, [[0, -S2(.16)], [S2(.14), -S2(.16)], [r2 * .7, -S2(.07)], [r2, S2(.03)], [r2 * 1.03, S2(.07)], [r2 * .93, S2(.07)], [0, S2(.03)]], 28, st, x, v2, z); b.P(0);
      b.add(new THREE.CylinderGeometry(r2 * .9, r2 * .9, .02, 24), WAT, b.M(x, v2 + S2(.045), z), 2);
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; b.add(new THREE.SphereGeometry(S2(.045), 6, 4), gold ? GOLD : st, b.M(x + Math.cos(a) * r2, v2 + S2(.03), z + Math.sin(a) * r2)); }
      F.v2 = v2 + S2(.05); F.r2 = r2; yTop = v2 + S2(.07); }
    // couronnement : groupe doré (grandes fontaines) ou pomme de pin, d'où jaillit le jet
    if (gold) { statueG(b, x, yTop, z, S2(.62), GOLD, PI / 4, false); F.top = yTop + S2(.62) * 1.12; }
    else { b.add(new THREE.ConeGeometry(S2(.09), S2(.3), 10), metal, b.M(x, yTop + S2(.15), z)); dot(b, S2(.07), metal, x, yTop + S2(.05), z, 1); F.top = yTop + S2(.32); }
    // nappes d'eau translucides (l'eau qui court sur le bord des vasques ; elles ondulent quand on est tout près)
    b.add(new THREE.CylinderGeometry(r1 * 1.03, r1 * 1.16, F.v1 - .41, 32, 1, true), 0xe2f4fa, b.M(x, (F.v1 + .41) / 2, z), 2);
    if (F.v2) b.add(new THREE.CylinderGeometry(F.r2 * 1.04, F.r2 * 1.18, F.v2 - F.v1, 24, 1, true), 0xe2f4fa, b.M(x, (F.v2 + F.v1) / 2, z), 2);
    b.add(new THREE.CylinderGeometry(S2(.025), S2(.05), S2(.9), 8, 1, true), 0xeef8fc, b.M(x, F.top + S2(.45), z), 2);
    (C.founts || (C.founts = [])).push(F); C.circ(x, z, R + .17, .56);
  }

  // ---------- ferronnerie : grille droite sur mur bahut, piliers à bossages, portail à couronnement doré ----------
  function grille(C, ax, az, bx2, bz, h) {
    const b = C.b, L = Math.hypot(bx2 - ax, bz - az); if (L < .3) return; const ux = (bx2 - ax) / L, uz = (bz - az) / L, alongX = Math.abs(ux) > .5, ry = alongX ? 0 : PI / 2, P = t => [ax + ux * t, az + uz * t];
    const yb = .34, top = yb + h, S = C.S, BX = (len, hh, th, col, t, y) => { const p = P(t); if (alongX) bx(b, len, hh, th, col, p[0], y, p[1]); else bx(b, th, hh, len, col, p[0], y, p[1]); };
    b.P(PT.pierre); BX(L, yb, .3, S.trim, L / 2, yb / 2); BX(L + .04, .05, .36, S.pil, L / 2, yb + .02); b.P(0);
    BX(L, .035, .04, IRONK, L / 2, yb + .1); BX(L, .03, .04, IRONK, L / 2, yb + .3); BX(L, .035, .04, IRONK, L / 2, top - .15); BX(L, .025, .035, IRONK, L / 2, top - .3);
    const n = Math.max(2, Math.round(L / .12));
    for (let k = 0; k <= n; k++) { const t = k * L / n, p = P(t); bx(b, .022, h, .022, IRONK, p[0], yb + h / 2, p[1]);
      if (k % 2 === 0) { b.add(new THREE.ConeGeometry(.032, .11, 6), GOLD, b.M(p[0], top + .05, p[1])); dot(b, .024, GOLD, p[0], top - .02, p[1]); } else b.add(new THREE.ConeGeometry(.02, .07, 5), GOLD, b.M(p[0], top + .03, p[1]));
      if (k < n) { const q = P(t + L / n / 2); for (const sg of [-1, 1]) b.add(new THREE.TorusGeometry(.042, .008, 3, 7, PI * 1.4), IRONK, b.M(q[0], yb + .2 + sg * .045, q[1], 0, ry, sg > 0 ? -PI * .2 : PI * .8)); // frise de volutes
        if (k % 2 === 0) b.add(new THREE.TorusGeometry(.04, .007, 3, 8), GOLD, b.M(q[0], top - .225, q[1], 0, ry, 0)); } } // anneaux dorés en haut
    const np = Math.max(1, Math.round(L / 2.4)); for (let k = 0; k <= np; k++) { const p = P(k * L / np); bx(b, .07, h + .08, .07, IRONK, p[0], yb + (h + .08) / 2, p[1]); dot(b, .055, GOLD, p[0], top + .14, p[1], 1); b.add(new THREE.ConeGeometry(.03, .1, 6), GOLD, b.M(p[0], top + .23, p[1])); }
    if (alongX) C.rect(Math.min(ax, bx2), az - .17, Math.max(ax, bx2), az + .17, 1.9); else C.rect(ax - .17, Math.min(az, bz), ax + .17, Math.max(az, bz), 1.9);
  }
  // pilier de pierre à bossages, corniche, et son couronnement (pot à feu, statue, vase)
  function pilier(C, x, z, s, ph, top) {
    const b = C.b, S = C.S, w = .44 * s; b.P(C.st === 2 ? PT.brique : PT.pierre);
    if (C.st === 2) bx(b, w, ph - .3, w, S.wall, x, (ph - .3) / 2 + .2, z);
    b.P(PT.pierre); bx(b, w + .16, .22, w + .16, S.base, x, .11, z);
    if (C.st !== 2) for (let y = .22, k = 0; y < ph - .34; k++) { const hh = Math.min(.24 * s, ph - .34 - y); bx(b, w + (k % 2 ? 0 : .05), hh - .015, w + (k % 2 ? 0 : .05), k % 2 ? S.trim : S.pil, x, y + hh / 2, z); y += hh; }
    else for (let y = .22, k = 0; y < ph - .34; k++, y += .3) bx(b, w + .03, .1, w + .03, S.trim, x, y + .05, z);
    bx(b, w + .12, .1, w + .12, S.trim, x, ph - .26, z); bx(b, w + .24, .12, w + .24, S.pil, x, ph - .15, z); bx(b, w + .16, .08, w + .16, S.trim, x, ph - .05, z); b.P(0);
    if (top === 'feu') potFeu(b, x, ph, z, 1.1 * s, S.pil); else if (top === 'statue') statueG(b, x, ph, z, .8 * s, C.lvl >= 4 ? GOLD : 0xf1ede4, 0, false); else urne(b, x, ph, z, s, C.lvl >= 4 ? GOLD : S.pil, C.S.fl);
    C.rect(x - w / 2 - .08, z - w / 2 - .08, x + w / 2 + .08, z + w / 2 + .08, ph);
  }
  // le portail : ses deux vantaux sont vivants (ils s'ouvrent quand on approche) ; ici, le seuil et le couronnement en arc, doré, avec soleil ou couronne
  function portail(C, xc, z, w, ph, s) {
    const b = C.b, lvl = C.lvl, ya = ph + .02, ra = w / 2 + .12;
    b.P(PT.pierre); bx(b, w + .1, .06, .46, C.S.trim, xc, .03, z); b.P(0);
    bx(b, w + .3, .06, .06, IRONK, xc, ya, z); bx(b, w + .3, .04, .05, IRONK, xc, ya + .16, z);
    for (let k = 0; k <= 8; k++) { const x = xc - w / 2 - .15 + k * (w + .3) / 8; bx(b, .02, .16, .02, IRONK, x, ya + .08, z); }
    b.add(new THREE.TorusGeometry(ra, .03, 4, 26, PI), IRONK, b.M(xc, ya + .16, z, 0, 0, 0, 1, .58, 1));
    b.add(new THREE.TorusGeometry(ra * .78, .022, 4, 22, PI), GOLD, b.M(xc, ya + .16, z, 0, 0, 0, 1, .55, 1));
    for (let k = 1; k < 8; k++) { const a = k / 8 * PI, ca = Math.cos(a), sa = Math.sin(a); b.add(new THREE.BoxGeometry(.018, ra * .58 * .9, .018), IRONK, b.M(xc + ca * ra * .45, ya + .16 + sa * ra * .58 * .45, z, 0, 0, a - PI / 2)); }
    for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) b.add(new THREE.TorusGeometry(.09 + k * .05, .012, 3, 9, PI * 1.5), k ? GOLD : IRONK, b.M(xc + sg * (ra * .55 + k * .1), ya + .32 + k * .08, z, 0, 0, sg > 0 ? PI * .1 : PI * .4));
    const yc = ya + .16 + ra * .58 + .08;
    if (lvl >= 1) { // soleil doré (le Roi-Soleil) ou couronne fleurdelisée
      b.add(new THREE.CylinderGeometry(.13 * s, .13 * s, .03, 18), GOLD, b.M(xc, yc + .1 * s, z, PI / 2, 0, 0));
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.add(new THREE.ConeGeometry(.026 * s, (k % 2 ? .13 : .2) * s, 4), GOLD, b.M(xc + Math.cos(a) * .2 * s, yc + .1 * s + Math.sin(a) * .2 * s, z, 0, 0, a - PI / 2)); } }
    if (lvl >= 2) { const y2 = yc + .36 * s; b.add(new THREE.TorusGeometry(.1 * s, .02 * s, 4, 14), GOLD, b.M(xc, y2, z, PI / 2, 0, 0, 1, 1, 1)); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; dot(b, .028 * s, GOLD, xc + Math.cos(a) * .1 * s, y2 + .07 * s, z + Math.sin(a) * .1 * s * .3); } b.add(new THREE.ConeGeometry(.025 * s, .12 * s, 4), GOLD, b.M(xc, y2 + .14 * s, z)); }
    (C.gates || (C.gates = [])).push({ x: xc, z, w, h: ph - .12, s });
  }
  // une entrée complète : grilles de part et d'autre, deux grands piliers, le portail
  function entree(C, xa, xb, z, gw, s) {
    const { u, lvl } = C, ph = 1.45 + .3 * u + .12 * lvl, hg = .95 + .1 * u, pw = .44 * s;
    grille(C, xa, z, -gw / 2 - pw / 2 - .04, z, hg); grille(C, gw / 2 + pw / 2 + .04, z, xb, z, hg);
    for (const sx of [-1, 1]) pilier(C, sx * (gw / 2 + pw / 2), z, s, ph, lvl >= 3 ? 'statue' : 'feu');
    portail(C, 0, z, gw, ph - .1, s);
  }
  // le perron : deux larges marches de pierre, joues à volutes surmontées de vases
  function perron(C, pw) {
    const { b, S } = C, zP = C.zP;
    for (let k = 0; k < 2; k++) { const h = (2 - k) * .12, w = pw + (k + 1) * .3; b.P(PT.pierre); bx(b, w, h, .34, S.step, 0, h / 2, zP + .17 + k * .34); b.P(0); C.rect(-w / 2, zP + k * .34, w / 2, zP + (k + 1) * .34, h); }
    for (const sx of [-1, 1]) { const x = sx * (pw / 2 + .45); b.P(PT.pierre); bx(b, .24, .44, .62, S.trim, x, .22, zP + .31); bx(b, .3, .06, .68, S.pil, x, .47, zP + .31); b.P(0); urne(b, x, .5, zP + .38, .7, S.pil, S.fl); C.rect(x - .15, zP, x + .15, zP + .68, .9); }
  }
  // ---------- les jardins selon la forme du château ----------
  function gardens(C) {
    const s = Math.min(2.2, .8 + .25 * C.u); C.founts = []; C.gates = [];
    if (C.kind === 'U') court(C, s); else { frontCourt(C, s); if (C.kind === 'Z') sideGardens(C, s); }
    backGarden(C, s);
  }
  // fontaine adossée au perron : bassin en demi-lune, stèle à bossages, mascaron de lion doré qui crache l'eau, coquille et vase
  function wallFountain(C, x, z, R, s) {
    const b = C.b, st = 0xece5d5, S = C.S, prof = [[R + .14, 0], [R + .14, .07], [R + .08, .11], [R + .06, .33], [R + .1, .37], [R + .1, .45], [R + .03, .5], [R - .06, .48], [R - .12, .41], [R - .12, .1]];
    b.P(PT.pierre); b.add(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 26, -PI / 2, PI), st, b.M(x, 0, z)); b.P(0);
    b.add(new THREE.CircleGeometry(R - .12, 26, PI, PI), 0x2a4d56, b.M(x, .1, z, -PI / 2, 0, 0)); b.add(new THREE.CircleGeometry(R - .12, 26, PI, PI), WAT, b.M(x, .38, z, -PI / 2, 0, 0), 2);
    const sw = Math.min(1.25, R * 1.5), sh = 1.45 * Math.min(1.2, s);
    b.P(PT.pierre); bx(b, sw, sh, .26, S.trim, x, sh / 2, z - .13); bx(b, sw + .12, .1, .34, S.pil, x, sh + .05, z - .13); bx(b, sw * .7, .5, .06, S.pil, x, sh * .6, z + .02); b.P(0);
    for (const sx of [-1, 1]) { b.P(PT.pierre); bx(b, .14, sh - .1, .32, S.pil, x + sx * (sw / 2 - .07), (sh - .1) / 2, z - .11); b.P(0); }
    // coquille en éventail et vase couronné
    b.add(new THREE.CircleGeometry(sw * .32, 14, 0, PI), S.pil, b.M(x, sh * .82, z + .03)); for (let k = 1; k < 7; k++) { const a = k / 7 * PI; b.add(new THREE.BoxGeometry(.02, sw * .3, .03), GOLD, b.M(x + Math.cos(a) * sw * .15, sh * .82 + Math.sin(a) * sw * .15, z + .045, 0, 0, a - PI / 2)); }
    urne(b, x, sh + .1, z - .13, .85 * Math.min(1.2, s), C.lvl >= 3 ? GOLD : S.pil, S.fl);
    // mascaron : tête de lion dorée, crinière
    const my = sh * .52; b.S(G.SK.gold); b.add(new THREE.TorusGeometry(.13, .05, 6, 14), GOLD, b.M(x, my, z + .05)); b.add(new THREE.SphereGeometry(.11, 12, 10), GOLD, b.M(x, my, z + .09, 0, 0, 0, 1, 1.05, .8));
    b.add(new THREE.SphereGeometry(.05, 8, 6), GOLD, b.M(x, my - .05, z + .17)); b.S(null);
    // petite vasque sous le mascaron
    b.P(PT.pierre); b.add(new THREE.LatheGeometry([[0, -.12], [.1, -.12], [.22, -.03], [.25, .02], [.22, .03], [0, .03]].map(p => new THREE.Vector2(p[0], p[1])), 14, -PI / 2, PI), st, b.M(x, my - .38, z + .02)); b.P(0);
    (C.founts || (C.founts = [])).push({ x, z, R, wy: .39, sr: .55, dol: [[x, my - .06, z + .2, 0, 1]], half: true, top: 0 });
    C.rect(x - R - .14, z - .26, x + R + .14, z + R + .14, .5); C.rect(x - sw / 2, z - .26, x + sw / 2, z, sh);
  }
  // cour d'honneur devant un château en ligne (ou en T) : perron à deux rampes et fontaine adossée, gravier ratissé, pelouses bordées de buis, statues, grille dorée et portail
  function frontCourt(C, s) {
    const { b, u, S, lvl } = C, zT = C.zT, zP = C.zP, ew = C.ew, xa = C.X0 + .2, xb = C.X1 - .2, zR = C.Z1 - .24, gw = G.clamp(1.15 * u, 1.6, 2.6);
    // perron : deux rampes de deux marches qui descendent de chaque côté, balustrade devant
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const h = (2 - k) * .12, xk = ew + k * .34; b.P(PT.pierre); bx(b, .34, h, zP - zT + .05, S.step, sx * (xk + .17), h / 2, (zT + zP) / 2); b.P(0); C.rect(sx > 0 ? xk : -xk - .34, zT, sx > 0 ? xk + .34 : -xk, zP, h); }
    const Rw = G.clamp(zR - zP - .55, .55, .9);
    for (const sx of [-1, 1]) { const xa2 = Rw + .18, xb2 = ew - .05, L = xb2 - xa2; if (L < .25) continue; const n = Math.max(2, Math.round(L / .16)); b.P(PT.pierre);
      bx(b, L, .05, .14, S.trim, sx * (xa2 + L / 2), TH + .03, zP - .08); bx(b, L + .04, .06, .18, S.pil, sx * (xa2 + L / 2), TH + .38, zP - .08); b.P(0);
      for (let k = 0; k <= n; k++) lathe(b, [[.035, 0], [.045, .05], [.028, .14], [.045, .24], [.03, .3], [0, .3]], 8, S.pil, sx * (xa2 + k * L / n), TH + .05, zP - .08); C.rect(sx > 0 ? xa2 : -xb2, zP - .16, sx > 0 ? xb2 : -xa2, zP, TH + .42); }
    for (const sx of [-1, 1]) { b.P(PT.pierre); bx(b, .24, .5, .24, S.trim, sx * (ew - .12), TH + .25, zP - .12); b.P(0); urne(b, sx * (ew - .12), TH + .5, zP - .12, .75, lvl >= 3 ? GOLD : S.pil, S.fl); }
    wallFountain(C, 0, zP, Rw, s);
    // sol : gravier au pied de la terrasse et dans la cour, pelouses de part et d'autre
    const cw = ew + .7 + .2; gravel(C, xa, zT, xb, Math.min(zR, zT + .62)); gravel(C, -cw - .16, zT, cw + .16, zR + .2);
    for (const sx of [-1, 1]) { const x0 = sx > 0 ? cw + .16 : xa + .12, x1 = sx > 0 ? xb - .12 : -cw - .16, z0 = zT + .62, z1 = zR - .26; if (x1 - x0 < .6 || z1 - z0 < .35) continue;
      gravel(C, x0 - .16, z1, x1 + .16, zR + .2); gravel(C, sx > 0 ? x1 : x0 - .16, z0 - .12, sx > 0 ? x1 + .16 : x0, z1);
      const ww = x1 - x0, dd = z1 - z0;
      if (ww > 3.2 && dd > 1.15) { lawn(C, x0, z0, x1, z1); frame(C, x0, z0, x1, z1, .1, .22); const R = Math.min(.85, dd * .4, ww * .16), xm = (x0 + x1) / 2;
        gravel(C, xm - R - .25, z0 + .1, xm + R + .25, z1 - .1); fontaine(C, xm, (z0 + z1) / 2, R, false);
        for (const k of [-1, 1]) { const xs = xm + k * (R + .25 + (ww / 2 - R - .25) / 2); if (Math.abs(xs - xm) < ww / 2 - .35) (lvl >= 2 ? statue : ifCone)(C, xs, (z0 + z1) / 2, .75 * s, 0, lvl >= 4); } }
      else if (dd > 1.6 && ww > 1.6) broderie(C, x0, z0, x1, z1, s);
      else { lawn(C, x0, z0, x1, z1); frame(C, x0, z0, x1, z1, .1, .22);
        const n = Math.max(1, Math.floor(ww / 1.4)); for (let i = 0; i < n; i++) { const x = x0 + (i + .5) * ww / n; if (dd > .7) (i % 2 ? boule : ifCone)(C, x, (z0 + z1) / 2, (dd > 1.1 ? .75 : .55) * s); } }
      for (let x = x0 + .12, k = 0; x < x1 - .1 && k < 80; x += .19, k++) dot(b, .058, S.fl[k % 3], x, .13, z1 - .08 + (k % 2) * .05); }
    for (const sx of [-1, 1]) statue(C, sx * (cw - .25), Math.min(zR - .45, zP + .5), .85 * s, sx > 0 ? -PI / 2 : PI / 2, lvl >= 4);
    entree(C, xa, xb, zR, gw, s);
    for (const sx of [-1, 1]) grille(C, sx > 0 ? xb : xa, zR, sx > 0 ? xb : xa, zT + .1, .95 + .1 * u);
  }
  // jardins de part et d'autre de l'aile d'un château en T : tapis vert, bassins, ifs taillés
  function sideGardens(C, s) {
    const A = C.side; if (!A) return; const [ax0, az0, ax1, az1] = A;
    for (const sx of [-1, 1]) { const x0 = sx > 0 ? ax0 : -ax1, x1 = sx > 0 ? ax1 : -ax0, w = x1 - x0, d = az1 - az0; if (w < 1 || d < 1.5) continue;
      gravel(C, x0, az0, x1, az1); const n = Math.max(1, Math.round(d / 4.2)), seg = d / n;
      for (let i = 0; i < n; i++) { const z0 = az0 + i * seg + .2, z1 = az0 + (i + 1) * seg - .2, zm = (z0 + z1) / 2, X0 = x0 + .3, X1 = x1 - .3;
        if (w > 2.2 && seg > 2.6) { lawn(C, X0, z0, X1, z1); frame(C, X0, z0, X1, z1, .1, .22); const R = Math.min(.9, (X1 - X0) * .3, (z1 - z0) * .3); gravel(C, (X0 + X1) / 2 - R - .25, zm - R - .25, (X0 + X1) / 2 + R + .25, zm + R + .25); fontaine(C, (X0 + X1) / 2, zm, R, false);
          for (const k of [-1, 1]) ifCone(C, (X0 + X1) / 2, zm + k * (R + .25 + (seg / 2 - R - .45) / 2), .7 * s); }
        else broderie(C, X0, z0, X1, z1, s); }
      for (let z = az0 + .3, k = 0; z < az1 - .2 && k < 40; z += 1.6, k++) (k % 2 ? boule : ifCone)(C, sx > 0 ? x1 - .15 : x0 + .15, z, .7 * s); }
  }
  // derrière le château : une bande de gazon tondu et une rangée d'ifs taillés
  function backGarden(C, s) {
    let zb = C.Z0 + .2, ze = Infinity; for (const t of C.ter) ze = Math.min(ze, t[1]); if (C.kind === 'Z' && C.side) return; if (ze - zb < .45) return;
    lawn(C, C.X0 + .2, zb, C.X1 - .2, ze - .02); const xm = C.Wl / 2 - .6; let i = 0;
    if (ze - zb > .7) for (let x = 0; x < xm && i < 40; x += 2.2 * s, i++) for (const sx of x ? [-1, 1] : [1]) (i % 2 ? boule : ifCone)(C, sx * x, (zb + ze) / 2, .72 * s);
  }
  // ---------- cour d'honneur des grands châteaux (ailes en U) : un vrai jardin à la française ----------
  function court(C, s) {
    const { b, u, S, lvl } = C, [x0, z0, x1, z1] = C.court, cw = x1 - x0, cd = z1 - z0, pw = Math.max(1.6, 1.1 * u), I = C.inner;
    perron(C, pw); gravel(C, x0, z0, x1, z1 + .1);
    const zs = Math.max(z0 + .3, C.zP + .9, I ? I.z + .4 : -1e9), zg = z1 - .95, aw = G.clamp(.9 + .4 * u, 1.4, 3.4), gw = G.clamp(1.3 * u, 2.0, 3.2);
    const R = G.clamp(Math.min((zg - zs) * .29, cw * .12), .8, 3.6 * Math.sqrt(u)), fz = I ? Math.max((zs + zg) / 2, I.z + R + 1) : (zs + zg) / 2, hasF = zg - zs > 2.4 && cw > 3.5;
    if (hasF) { disc(C, 0, fz, R + .75, .046, GRAV); fontaine(C, 0, fz, R, lvl >= 3); }
    // parterres : quatre carreaux autour du bassin si la cour est profonde, sinon un long parterre de chaque côté
    const pz0 = fz - R - .7, pz1 = fz + R + .7, quads = hasF && pz0 - zs > 1.5 && zg - pz1 > 1.5, xe = x1 - (lvl >= 2 && cw > 11 ? 1.25 : .55);
    const zones = !hasF ? [[aw / 2 + .2, xe, zs, zg]] : quads ? [[aw / 2 + .2, xe, zs, pz0], [aw / 2 + .2, xe, pz1, zg], [R + .95, xe, pz0 + .45, pz1 - .45]] : [[Math.max(aw / 2 + .2, R + .75), xe, zs, zg]];
    zones.forEach(([ax, bxe, az, bz], zi) => {
      const w = bxe - ax, d = bz - az; if (w < .9 || d < .9) return; const side = zi === 2;
      const nx = G.clamp(Math.round(w / (side ? 6 : 4.2)), 1, 4), nz = G.clamp(Math.round(d / 4.2), 1, 4);
      for (const sx of [-1, 1]) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const ex0 = ax + i * w / nx + (i ? .25 : 0), ex1 = ax + (i + 1) * w / nx - (i < nx - 1 ? .25 : 0), ez0 = az + j * d / nz + (j ? .25 : 0), ez1 = az + (j + 1) * d / nz - (j < nz - 1 ? .25 : 0);
        const X0 = sx > 0 ? ex0 : -ex1, X1 = sx > 0 ? ex1 : -ex0;
        if (side) { lawn(C, X0, ez0, X1, ez1); frame(C, X0, ez0, X1, ez1, .1, .22); if (ex1 - ex0 > 1.2 && ez1 - ez0 > 1.2) (lvl >= 3 ? statue : ifCone)(C, (X0 + X1) / 2, (ez0 + ez1) / 2, .8 * s, 0, lvl >= 4); }
        else broderie(C, X0, ez0, X1, ez1, s); } });
    // ifs en cône aux angles des carreaux le long de l'allée, statues et candélabres le long de l'allée
    for (let z = zs + 1.0, i = 0; z < zg - .6 && i < 18; z += 2.6 * Math.max(1, u * .7), i++) { if (hasF && Math.abs(z - fz) < R + 1.1) continue;
      for (const sx of [-1, 1]) { const x = sx * (aw / 2 + .45); if (i % 3 === 1) { if (lvl >= 2) candelabre(C, x, z, s * .85); else ifCone(C, x, z, .75 * s); } else if (i % 3 === 0) statue(C, x, z, .85 * s, sx > 0 ? -PI / 2 : PI / 2, lvl >= 4); else boule(C, x, z, .8 * s); } }
    // orangers en caisse le long des ailes, bancs de pierre
    if (lvl >= 2 && cw > 11) for (const sx of [-1, 1]) for (let z = z0 + 1.2, i = 0; z < z1 - 1.1 && i < 30; z += 2.2 * s, i++) { const x = sx * (x1 - .45); if (i % 3 === 2) banc(C, x, z, s, false); else oranger(C, x, z, .8 * s, i); }
    else for (const sx of [-1, 1]) for (let z = z0 + .9, i = 0; z < z1 - .9 && i < 20; z += 1.7, i++) (i % 2 ? boule : ifCone)(C, sx * (x1 - .4), z, .7 * s);
    if (lvl >= 5) for (const sx of [-1, 1]) { const x = sx * (aw / 2 + 1.3), z = z1 - 1.1, h = 2.4 * s; // obélisques à l'entrée
      b.P(PT.pierre); bx(b, .7 * s, .5 * s, .7 * s, S.trim, x, .25 * s, z); b.P(0); b.add(new THREE.CylinderGeometry(.08 * s, .3 * s, h, 4), 0xd9cfb8, b.M(x, .5 * s + h / 2, z, 0, PI / 4, 0)); b.add(new THREE.ConeGeometry(.11 * s, .25 * s, 4), GOLD, b.M(x, .5 * s + h + .12 * s, z, 0, PI / 4, 0)); C.rect(x - .35 * s, z - .35 * s, x + .35 * s, z + .35 * s, h); }
    closure(C, s, gw);
  }
  function closure(C, s, gw) { // la cour se ferme devant : grille dorée, châtelet à deux tours ou mur de brique, avec le grand portail au milieu
    const { b, u, S, lvl, st } = C, G0 = C.gate, z = G0.z, ph = 2.2 + .3 * u;
    if (st === 0) { entree(C, G0.x0, G0.x1, z, gw, s); return; }
    const pw = .44 * s, xs = [[G0.x0, -gw / 2 - pw - .1], [gw / 2 + pw + .1, G0.x1]];
    if (st === 1) { for (const [a, c] of xs) { const L = c - a; if (L < .2) continue; b.P(PT.pierre); bx(b, L, 1.1, .4, S.wall, (a + c) / 2, .55, z); b.P(0); for (let k = 0, n = Math.floor(L / (.5 * u)); k < n; k++) bx(b, .25 * u, .25, .44, S.trim, a + (k + .5) * L / n, 1.22, z); C.rect(a, z - .2, c, z + .2, 1.3); }
      const r = .6 * u, th = 3.2 * u; for (const sx of [-1, 1]) { const x = sx * (gw / 2 + r * .7 + .1); b.P(PT.pierre); b.cyl(r, r + .04 * u, th, 16, S.wall, x, th / 2, z); b.P(0); b.P(PT.ardoise); b.cone(r + .12 * u, 2.4 * r, 16, S.roof, x, th + 1.2 * r, z); b.P(0); epi(b, x, th + 2.4 * r - .05, z, u); if (lvl >= 3) flag(C, x, th + 2.4 * r + .3 * u, z, u * .8); C.circ(x, z, r + .04 * u, th); }
      const y0 = Math.max(2.6, 2.1 * u), bw = gw + .2 * u; b.P(PT.pierre); bx(b, bw, 1.0 * u, .9 * u, S.wall, 0, y0 + .5 * u, z); b.P(0); b.P(PT.ardoise); G.prism(b, bw + .2 * u, .9 * u, 1.1 * u, S.roof, 0, y0 + 1.0 * u, z, PI / 2); b.P(0);
      fenetre(b, blk(0, z, bw, .9 * u, 0, 0), 0, 0, y0 + .5 * u, { w: .4 * u, h: .5 * u, frame: S.frame, glass: 0x9fb9d4 }); b.add(new THREE.TorusGeometry(gw / 2, .12 * u, 6, 18, PI), S.trim, b.M(0, y0 - gw / 2 + .1, z + .45 * u), 0, true);
      (C.gates || (C.gates = [])).push({ x: 0, z, w: gw, h: Math.min(y0 - .2, 2.2), s });
    } else { for (const [a, c] of xs) { const L = c - a; if (L < .2) continue; b.P(PT.brique); bx(b, L, 1.2, .35, S.wall, (a + c) / 2, .6, z); b.P(0); b.P(PT.pierre); bx(b, L + .04, .1, .45, S.trim, (a + c) / 2, 1.25, z); b.P(0); C.rect(a, z - .2, c, z + .2, 1.3); }
      for (const sx of [-1, 1]) pilier(C, sx * (gw / 2 + pw / 2), z, s, ph, 'urne');
      portail(C, 0, z, gw, ph - .1, s); }
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
  let SOLO = null; const soloBuilt = () => SOLO || (G.getGeo('chateau2', 0), SOLO);
  const och = MD.chateau2; MD.chateau2 = v => v % 3 === 0 ? (SOLO = build(0, 1, 1)).geo : och(v);
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
  // ---------- le château vivant : les vantaux de la grande porte et du portail s'ouvrent quand on approche, l'eau des fontaines coule vraiment ----------
  const LEAF = {}, V3 = THREE.Vector3; let fallM = null, sprayM = null;
  // un vantail de chêne (charnière en x = 0, il s'étend vers +x) : panneaux moulurés en relief, cartouche, heurtoir et poignée dorés
  function doorLeaf(lw, h) { const k = 'd' + lw.toFixed(2) + '|' + h.toFixed(2); if (LEAF[k]) return LEAF[k];
    const b = G.mb(77), t = .075, q = Math.min(1.25, lw / .46), MO = 0x7d512c, FI = 0x744a27; b.S(G.SK.wood);
    bx(b, lw - .012, h, t, OAK, lw / 2, h / 2, 0);
    for (const fz of [1, -1]) { const zf = fz * (t / 2 + .012), zr = fz * (t / 2 + .026), zs = fz * (t / 2 + .036);
      for (const [y0, y1] of [[.08 * h, .3 * h], [.36 * h, .82 * h], [.87 * h, .97 * h]]) { const x0 = .065 * q, x1 = lw - .065 * q, cx = (x0 + x1) / 2, ww = x1 - x0, hh = y1 - y0, cy = (y0 + y1) / 2;
        for (const s of [-1, 1]) { bx(b, ww + .03, .03, .03, MO, cx, cy + s * hh / 2, zf); bx(b, .03, hh, .03, MO, cx + s * ww / 2, cy, zf); }
        bx(b, ww - .06, hh - .06, .028, FI, cx, cy, zr); if (hh > .2) bx(b, ww - .16 * q, hh - .16 * q, .02, MO, cx, cy, zs); } }
    b.S(G.SK.ceramic); const zg = t / 2 + .05;
    b.add(new THREE.TorusGeometry(.065 * q, .011, 4, 16), GOLD, b.M(lw / 2, .59 * h, zg, 0, 0, 0, .75, 1.25, 1)); dot(b, .028 * q, GOLD, lw / 2, .59 * h, zg, 1);
    for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(.04 * q, .008, 3, 8, PI), GOLD, b.M(lw / 2 + s * .07 * q, .59 * h + s * .12 * q, zg, 0, 0, s > 0 ? 0 : PI));
    dot(b, .034, GOLD, lw * .5, .47 * h, zg, 1); b.add(new THREE.TorusGeometry(.045, .009, 4, 12), GOLD, b.M(lw * .5, .43 * h, zg + .01)); // heurtoir
    bx(b, .022, .22, .022, GOLD, lw - .07 * q, .5 * h, zg - .01); dot(b, .02, GOLD, lw - .07 * q, .5 * h + .12, zg - .01);
    for (const y of [.15 * h, .85 * h]) bx(b, .1, .03, .012, GOLD, .06, y, zg - .02); // pentures
    b.S(null); return LEAF[k] = b.done(); }
  // un vantail de grille (charnière en x = 0, battant en x = lw, plus haut) : barreaux à lances dorées, volutes, médaillon
  function gateLeaf(lw, h) { const k = 'g' + lw.toFixed(2) + '|' + h.toFixed(2); if (LEAF[k]) return LEAF[k];
    const b = G.mb(78), n = Math.max(4, Math.round(lw / .1)), top = x => h + .36 * Math.sin(x / lw * PI / 2);
    bx(b, .055, h + .02, .055, IRONK, .028, h / 2, 0); bx(b, .055, top(lw) + .04, .055, IRONK, lw - .028, (top(lw) + .04) / 2, 0);
    for (const y of [.06, .5, .56, h * .64]) bx(b, lw, .035, .045, IRONK, lw / 2, y, 0);
    for (let i = 1; i < n; i++) { const x = i * lw / n, hh = top(x); bx(b, .022, hh, .022, IRONK, x, hh / 2, 0); b.add(new THREE.ConeGeometry(.034, .12, 6), GOLD, b.M(x, hh + .05, 0)); dot(b, .02, GOLD, x, hh - .03, 0); }
    for (let i = 0; i < n; i++) { const x0 = i * lw / n, x1 = (i + 1) * lw / n, y0 = top(x0) - .1, y1 = top(x1) - .1; b.add(new THREE.BoxGeometry(Math.hypot(x1 - x0, y1 - y0) + .01, .03, .035), IRONK, b.M((x0 + x1) / 2, (y0 + y1) / 2, 0, 0, 0, Math.atan2(y1 - y0, x1 - x0))); }
    for (let i = 0; i < n; i += 2) { const x = (i + 1) * lw / n; for (const sg of [-1, 1]) b.add(new THREE.TorusGeometry(.068, .011, 3, 9, PI * 1.4), (i / 2) % 2 ? GOLD : IRONK, b.M(x, .28 + sg * .075, 0, 0, 0, sg > 0 ? -PI * .2 : PI * .8)); }
    b.add(new THREE.TorusGeometry(.15, .018, 4, 18), GOLD, b.M(lw * .55, h * .38, 0, 0, 0, 0, .8, 1.18, 1)); b.add(new THREE.TorusGeometry(.08, .012, 4, 14), GOLD, b.M(lw * .55, h * .38, 0, 0, 0, 0, .8, 1.18, 1)); dot(b, .045, GOLD, lw * .55, h * .38, 0, 1);
    for (let i = 1; i < 4; i++) dot(b, .028, GOLD, i * lw / 4, h * .64, 0, 1);
    for (const P of b.parts) for (const g of P) if (g.userData.sk === G.SK.gold) g.userData.sk = G.SK.ceramic;
    return LEAF[k] = b.done(); }
  // eau vivante (même principe que la grande fontaine de la place)
  const uvS = (g, su, sv) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv); return g; };
  const wDisc = (r, y, half) => { const g = half ? new THREE.CircleGeometry(r, 24, PI, PI) : new THREE.CircleGeometry(r, 40); g.rotateX(-PI / 2); g.translate(0, y, 0); const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = .55; c[i * 3 + 1] = .8; c[i * 3 + 2] = .95; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return new THREE.Mesh(g, G.M.water); };
  const curt = (r0, y0, r1, y1, mat) => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(r0 + (r1 - r0) * Math.sqrt(t), y0 + (y1 - y0) * t)); } return new THREE.Mesh(uvS(new THREE.LatheGeometry(pts, 36), 12, 2), mat); };
  const jetM = (p0, p1, h, rad, mat) => { const a = new V3(...p0), c = new V3(...p1), m2 = a.clone().lerp(c, .5); m2.y = Math.max(a.y, c.y) + h; return new THREE.Mesh(uvS(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m2, c), 16, rad, 6), 1, 3), mat); };
  function fountFx(F) {
    if (!fallM) { fallM = G.curveMat(new THREE.MeshBasicMaterial({ map: G.TEX.fall, color: 0xe6f6ff, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); sprayM = G.curveMat(new THREE.MeshBasicMaterial({ map: G.TEX.fall, color: 0xffffff, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false })); }
    const g = new THREE.Group(), land = []; g.position.set(F.x, 0, F.z);
    g.add(wDisc(F.R - .14, F.wy + .012, F.half)); if (F.r1) { g.add(wDisc(F.r1 * .9, F.v1 + .008)); g.add(curt(F.r1 * 1.03, F.v1, F.r1 * 1.22, F.wy, fallM)); } if (F.v2) { g.add(wDisc(F.r2 * .9, F.v2 + .008)); g.add(curt(F.r2 * 1.04, F.v2, F.r2 * 1.24, F.v1, fallM)); }
    for (const [x, y, z, ca, sa] of F.dol) { const e = [x - F.x + ca * F.R * .4, F.wy, z - F.z + sa * F.R * .4]; g.add(jetM([x - F.x, y, z - F.z], e, .22 * F.sr, .028 * F.sr + .012, fallM)); land.push(e); }
    const sr = F.sr; if (F.top) { const yb = F.v2 || F.v1, rb = F.r2 || F.r1; g.add(curt(.02, F.top + .95 * sr, rb * .75, yb + .02, sprayM));
      const up = new THREE.Mesh(uvS(new THREE.CylinderGeometry(.025 * sr + .01, .045 * sr + .01, .9 * sr, 8, 1, true), 1, 3), fallM); up.position.y = F.top + .45 * sr; up.rotation.x = PI; g.add(up);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; land.push([Math.cos(a) * F.r1 * 1.2, F.wy, Math.sin(a) * F.r1 * 1.2]); } }
    const rip = []; for (let i = 0; i < 10; i++) { const me = new THREE.Mesh(new THREE.RingGeometry(.07, .1, 20), G.curveMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }))); me.rotation.x = -PI / 2; me.visible = false; g.add(me); rip.push({ me, t: 1 }); }
    g.traverse(c => { c.frustumCulled = false; c.renderOrder = 2; });
    return { g, F, land, rip, rt: 0, st: 0 }; }
  const LV = new Map(); // château dessiné (ancre d'un groupe ou château classique seul) → ses vantaux et son eau
  function liveOf(m, o) {
    const g = o._grp; if (g) { if (g.anchor !== o) return null; const R = BUILT[g.name]; return R && R.fx ? { fx: R.fx, cx: g.cx, cz: g.cz, r: g.r, sig: g.name } : null; }
    if (!CAST.includes(o.t) || styleOf(o) !== 0) return null; const R = soloBuilt(); if (!R || !R.fx) return null; const [cx, cz] = m.center(o); return { fx: R.fx, cx, cz, r: o.r & 3, sig: 'solo' };
  }
  function makeLive(m, o, I) {
    const root = new THREE.Group(); root.position.set(I.cx, o.y, I.cz); root.rotation.y = I.r * PI / 2; const L = { m, o, sig: I.sig, root, leaves: [], founts: [], cx: I.cx, cz: I.cz, r: I.r };
    const hinge = (geo, x, y, z, mir, kind, dx, dz, w) => { const piv = new THREE.Group(); piv.position.set(x, y, z); const me = new THREE.Mesh(geo, G.MATS); me.castShadow = true; me.receiveShadow = true; me.frustumCulled = false; if (mir) me.scale.x = -1; piv.add(me); root.add(piv); L.leaves.push({ piv, mir, kind, dx, dz, w, a: 0 }); };
    const D = I.fx.door; if (D) { const lw = D.w / 2, geo = doorLeaf(lw, D.h); hinge(geo, D.x - lw, D.y, D.z, false, 'd', D.x, D.z, D.w); hinge(geo, D.x + lw, D.y, D.z, true, 'd', D.x, D.z, D.w); }
    for (const Gt of I.fx.gates) { const lw = Gt.w / 2 - .01, h = Math.max(.9, Gt.h - .42), geo = gateLeaf(lw, h); hinge(geo, Gt.x - Gt.w / 2 + .005, .06, Gt.z, false, 'g', Gt.x, Gt.z, Gt.w); hinge(geo, Gt.x + Gt.w / 2 - .005, .06, Gt.z, true, 'g', Gt.x, Gt.z, Gt.w); }
    for (const F of I.fx.founts) { const f = fountFx(F); f.g.visible = false; root.add(f.g); L.founts.push(f); }
    root.traverse(c => { c.frustumCulled = false; }); m.group.add(root); return L;
  }
  const leafGeos = () => new Set(Object.values(LEAF));
  function dropLive(L) { if (L.root.parent) L.root.parent.remove(L.root); const keep = leafGeos(); L.root.traverse(c => { if (c.isMesh && !keep.has(c.geometry)) c.geometry.dispose(); }); }
  let lvT = 0;
  G.on('frame', dt => {
    const m = G.map, p = G.player; if (!m || !p || !dt) return; dt = Math.min(dt, .1);
    if ((lvT -= dt) < 0) { lvT = .5; // qui doit vivre (et qui ne le doit plus)
      const want = new Set(); if (!m.interior && m._cgList) for (const o of m._cgList) { if (!o._k || !m.list.has(o)) continue; const I = liveOf(m, o); if (!I) continue; if (Math.abs(I.cx - p.x) > 110 || Math.abs(I.cz - p.z) > 110) continue; want.add(o); const L = LV.get(o);
        if (!L || L.m !== m || L.sig !== I.sig || L.cx !== I.cx || L.cz !== I.cz || L.r !== I.r) { if (L) dropLive(L); LV.set(o, makeLive(m, o, I)); } }
      for (const [o, L] of LV) if (!want.has(o) && (L.m === m || !L.m.list.has(o))) { dropLive(L); LV.delete(o); } }
    for (const L of LV.values()) { const o = L.o, vis = L.m === m && !zero(o._anim); L.root.visible = vis; if (!vis) continue;
      L.root.position.y = o.y; const [lx, lz] = toL(L.r, p.x - L.cx, p.z - L.cz), py = p.y - o.y;
      for (const lf of L.leaves) { // on approche (devant ou derrière) : les vantaux s'ouvrent vers l'intérieur
        const near = Math.abs(lx - lf.dx) < lf.w / 2 + 1.3 && lz > lf.dz - (lf.kind === 'g' ? 2.6 : .8) && lz < lf.dz + 2.7 && py < 3, want = near ? (lf.kind === 'g' ? 1.55 : 1.75) : 0, a0 = lf.a;
        lf.a += G.clamp(want - lf.a, -dt * 1.5, dt * 1.5); if (a0 === 0 && lf.a > 0 && lf.mir) G.sfx(lf.kind === 'd' ? 'door' : 'open'); else if (a0 > 0 && lf.a === 0 && lf.mir) G.sfx('close');
        lf.piv.rotation.y = lf.mir ? -lf.a : lf.a; }
      for (const f of L.founts) { const F = f.F, [wx, wz] = toW(L.r, F.x, F.z), d2 = Math.hypot(L.cx + wx - p.x, L.cz + wz - p.z); f.g.visible = d2 < 48; if (!f.g.visible) continue;
        if (G.ents) G.ents.fallDist = Math.min(G.ents.fallDist == null ? 99 : G.ents.fallDist, Math.max(0, d2 - F.R) * 1.4 + 2);
        if ((f.rt -= dt) < 0) { f.rt = .14; const R2 = f.rip.find(q => q.t >= 1); if (R2) { const Lp = f.land[Math.floor(Math.random() * f.land.length)]; R2.t = 0; R2.me.position.set(Lp[0] + (Math.random() - .5) * .1, Lp[1] + .015, Lp[2] + (Math.random() - .5) * .1); R2.me.visible = true; } }
        for (const R2 of f.rip) { if (R2.t >= 1) continue; R2.t += dt / 1.3; const sc = 1 + R2.t * 4 * Math.min(1.5, F.sr); R2.me.scale.set(sc, sc, sc); R2.me.material.opacity = .5 * (1 - R2.t); if (R2.t >= 1) R2.me.visible = false; }
        if (F.top && d2 < 26 && (f.st -= dt) < 0) { f.st = .06; const a = Math.random() * TAU, sp = (.3 + Math.random() * .5) * F.sr, vx = Math.cos(a) * sp, vz = Math.sin(a) * sp;
          G.fx.one(L.cx + wx, o.y + F.top + .9 * F.sr, L.cz + wz, vx, .7 + Math.random() * .8, vz, .9, 3.2, Math.random() < .5 ? 0xffffff : 0xcdeeff, .05, 0);
          const Lp = f.land[Math.floor(Math.random() * f.land.length)], [ex, ez] = toW(L.r, Lp[0], Lp[2]); G.fx.one(L.cx + wx + ex, o.y + Lp[1] + .05, L.cz + wz + ez, (Math.random() - .5) * .6, .8 + Math.random() * .6, (Math.random() - .5) * .6, .4, 4, 0xffffff, .045, 0); } } }
  });
  G.on('enterMap', () => { lvT = 0; });
  G.chateauFusion = { build, plan, regroup, layout, toL, toW, onW, RY, NR, live: LV };
})();
