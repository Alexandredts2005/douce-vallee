'use strict';
// ===== Modèles — partie 3 : personnages articulés, outils, slimes, insectes, ballons, nuages =====
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat || G.MATS); m.castShadow = true; m.frustumCulled = false; return m; };
  G.meshOf = mesh;
  // ---------- Personnage (joueur ou habitant) ----------
  G.makeChar = (o = {}) => {
    const sp = o.sp || 'humain', skin = o.skin || 0xffd9b8, fur = o.col || skin, shirt = o.shirt || 0x4fb35f, pants = o.pants || 0x3d5a8a;
    const head0 = sp === 'humain' ? skin : fur;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const P = { root, body };
    // torse
    let b = G.mb(5); b.cyl(.17, .21, .34, 10, shirt, 0, .45, 0, 0, 0, 0, 0, true); b.sph(.17, shirt, 0, .6, 0, 1, .45, 1);
    if (o.apron) b.box(.3, .26, .02, o.apron, 0, .42, .2);
    if (sp !== 'humain') b.sph(.09, fur, 0, .32, -.18);
    if (sp === 'chat') b.cyl(.03, .04, .35, 5, fur, 0, .4, -.32, 1.1);
    body.add(mesh(b.done()));
    // tête
    const head = new THREE.Group(); head.position.set(0, .8, 0); body.add(head); P.head = head;
    b = G.mb(6); b.sph(.25, head0, 0, 0, 0, 1.05, .95, 1, 0, 14, 10);
    if (sp === 'humain') { // cheveux + bonnet
      b.sph(.26, o.hair || 0x6b3f22, 0, .04, -.03, 1.06, .9, 1.02, 0, 12, 8);
      if (o.hat != null) { b.sph(.27, o.hat, 0, .09, 0, 1.04, .7, 1.04, 0, 12, 8); b.cyl(.28, .28, .07, 14, 0xffffff, 0, .04, 0, -.08, 0, 0, 0, true); b.sph(.07, 0xffffff, 0, .3, -.04); }
    }
    if (sp === 'lapin') { for (const s of [-1, 1]) { b.sph(.07, fur, s * .1, .32, -.02, 1, 3, .7); b.sph(.04, 0xff9fbf, s * .1, .32, .03, 1, 2.6, .4); } }
    if (sp === 'chat') { for (const s of [-1, 1]) b.cone(.09, .16, 4, fur, s * .14, .24, 0, 0, 0, -s * .35); }
    if (sp === 'ours') { for (const s of [-1, 1]) b.sph(.08, fur, s * .17, .2, -.02, 1, 1, .7); b.sph(.1, 0xe8c9a0, 0, -.07, .2, 1.2, .8, .8); b.sph(.035, 0x2a1d14, 0, -.03, .28); }
    if (sp === 'canard') { b.sph(.11, 0xffa62b, 0, -.06, .23, 1.3, .45, 1); b.cone(.04, .12, 4, 0xffd23f, 0, .27, 0); }
    if (sp === 'blaireau') { b.sph(.08, 0xfaf7f0, 0, .1, .17, .8, 1.6, .8); for (const s of [-1, 1]) b.sph(.06, fur, s * .19, .17, -.02, 1, 1, .6); b.sph(.03, 0x2a1d14, 0, -.04, .26); }
    if (sp === 'chat' || sp === 'lapin') b.sph(.025, 0xff7f9f, 0, -.04, .245);
    for (const s of [-1, 1]) b.sph(.045, 0xff9a9a, s * .15, -.07, .19, 1, .6, .4); // joues
    head.add(mesh(b.done()));
    const eyes = new THREE.Group(); head.add(eyes); P.eyes = eyes;
    b = G.mb(7); for (const s of [-1, 1]) { b.sph(.04, 0x2a1d14, s * .085, .02, .225, .8, 1.25, .5); b.sph(.013, 0xffffff, s * .085 + .012, .045, .245); }
    eyes.add(mesh(b.done()));
    // bras
    const arm = (side) => {
      const g = new THREE.Group(); g.position.set(side * .21, .58, 0); body.add(g);
      const bb = G.mb(8); bb.cyl(.055, .06, .26, 6, shirt, 0, -.1, 0, 0, 0, 0, 0, true); bb.sph(.06, sp === 'humain' ? skin : fur, 0, -.25, 0);
      g.add(mesh(bb.done())); const hand = new THREE.Group(); hand.position.set(0, -.25, .02); g.add(hand); return [g, hand];
    };
    [P.armL] = arm(-1); [P.armR, P.hand] = arm(1);
    const leg = side => { const g = new THREE.Group(); g.position.set(side * .09, .3, 0); body.add(g); const bb = G.mb(9); bb.cyl(.065, .06, .22, 6, pants, 0, -.1, 0, 0, 0, 0, 0, true); bb.sph(.075, o.shoes || 0x6b4a32, 0, -.25, .03, 1, .6, 1.3); g.add(mesh(bb.done())); return g; };
    P.legL = leg(-1); P.legR = leg(1);
    P.meshes = []; root.traverse(c => { if (c.isMesh) P.meshes.push(c); });
    return P;
  };
  // ---------- Outils tenus en main (poignée à l'origine, outil vers +z) ----------
  const TOOLS = {
    axe: b => { b.cyl(.025, .03, .6, 5, 0x9a6a40, 0, 0, .25, Math.PI / 2); b.box(.04, .2, .16, 0xb8bec8, 0, .06, .52); b.box(.045, .22, .03, 0xe8edf4, 0, .06, .61); },
    pick: b => { b.cyl(.025, .03, .6, 5, 0x9a6a40, 0, 0, .25, Math.PI / 2); b.cone(.04, .28, 5, 0x9aa2ad, 0, .14, .54); b.cone(.04, .28, 5, 0x9aa2ad, 0, -.14, .54, Math.PI); },
    shovel: b => { b.cyl(.025, .03, .7, 5, 0x9a6a40, 0, 0, .3, Math.PI / 2); b.box(.2, .03, .24, 0xb8bec8, 0, 0, .72); b.box(.12, .04, .05, 0x7a4e30, 0, 0, -.06); },
    net: b => { b.cyl(.02, .025, .8, 5, 0xd9b382, 0, 0, .35, Math.PI / 2); b.tor(.17, .015, 0xe8e8e8, 0, 0, .9, 0, Math.PI / 2, 0); b.sph(.16, 0xffffff, 0, 0, .9, .3, 1, 1, 2); },
    rod: b => { b.cyl(.012, .025, 1.1, 5, 0x6b4a32, 0, .1, .5, Math.PI / 2 - .25); b.cyl(.04, .04, .04, 8, 0x8f9aa6, .04, 0, .1, 0, 0, Math.PI / 2); },
    can: b => { b.cyl(.1, .12, .2, 8, 0x5aa0d8, 0, -.05, .2); b.cyl(.02, .035, .28, 5, 0x5aa0d8, 0, .02, .4, -1); b.tor(.07, .015, 0x4a86b8, 0, .08, .18, 0, Math.PI / 2, 0); },
    sword: b => { b.cyl(.025, .025, .14, 5, 0x6b4a32, 0, 0, .02, Math.PI / 2); b.box(.2, .04, .04, 0xd9b84a, 0, 0, .1); b.box(.05, .012, .62, 0xe8edf4, 0, 0, .43); b.cone(.025, .07, 4, 0xe8edf4, 0, 0, .77, Math.PI / 2); },
    sling: b => { b.cyl(.02, .025, .22, 5, 0x9a6a40, 0, 0, .1, Math.PI / 2); b.cyl(.018, .02, .14, 5, 0x9a6a40, .05, 0, .27, Math.PI / 2, 0, -.5); b.cyl(.018, .02, .14, 5, 0x9a6a40, -.05, 0, .27, Math.PI / 2, 0, .5); b.box(.14, .01, .02, 0xe8434a, 0, 0, .33); }
  };
  G.toolGeo = t => { const b = G.mb(3); (TOOLS[t] || TOOLS.axe)(b); return b.done(); };
  MD['tool'] = v => G.toolGeo(v);
  G.makeTool = t => mesh(G.toolGeo(t));
  // ---------- Slime ----------
  MD.slime = v => { const b = G.mb(4); const c = [0x6fe36a, 0x6cc8ff, 0xc58cff][v % 3]; b.sph(.4, c, 0, .32, 0, 1.15, .85, 1.1, 0, 14, 10); b.sph(.12, 0xffffff, -.15, .55, .2, 1, .6, .5);
    for (const s of [-1, 1]) { b.sph(.06, 0x1a2a1a, s * .13, .38, .36, .8, 1.2, .5); b.sph(.02, 0xffffff, s * .13 + .02, .41, .39); } b.sph(.04, 0x1a2a1a, 0, .26, .4, 1.6, .5, .5); return b.done(); };
  // ---------- Insectes ----------
  const BUGC = { papillon: [0xfaf7f0, 0x222222], papillon_bleu: [0x3c7dff, 0x1a1a40], coccinelle: [0xe8343a, 0x111111], libellule: [0xbfe6fa, 0x2f8a6a], luciole: [0x8a7a3a, 0x3a3020], scarabee: [0x3a2a1a, 0x1a120a] };
  G.makeBug = kind => {
    const [wc, bc] = BUGC[kind] || BUGC.papillon, root = new THREE.Group();
    let b = G.mb(2); b.cyl(.02, .02, .16, 4, bc, 0, 0, 0, Math.PI / 2);
    if (kind === 'coccinelle' || kind === 'scarabee') { b.sph(.07, wc, 0, .02, 0, 1, .6, 1.2); b.sph(.035, 0x111111, 0, .01, .08); if (kind === 'coccinelle') [[.03, .05, .02], [-.03, .05, -.03], [.02, .05, -.05]].forEach(p => b.sph(.015, 0x111111, p[0], p[1], p[2])); else b.cone(.015, .08, 4, bc, 0, .04, .1, -1); }
    if (kind === 'luciole') b.sph(.04, 0xfff27a, 0, 0, -.07, 1, 1, 1.3, 3);
    root.add(mesh(b.done()));
    const wing = s => { const g = new THREE.Group(); root.add(g); const bb = G.mb(1); const wg = kind === 'libellule' ? [.2, .05] : [.12, .1];
      bb.add(new THREE.CircleGeometry(1, 8), wc, bb.M(s * wg[0] * .9, 0, 0, -Math.PI / 2, 0, 0, wg[0], wg[1], 1), kind === 'libellule' ? 2 : 0);
      if (kind === 'papillon' || kind === 'papillon_bleu') bb.add(new THREE.CircleGeometry(1, 8), wc, bb.M(s * .07, 0, -.08, -Math.PI / 2, 0, 0, .07, .06, 1));
      const m = new THREE.Mesh(bb.done(), G.M.wing); m.frustumCulled = false; g.add(m); return g; };
    const P = { root, wl: wing(-1), wr: wing(1), kind };
    root.traverse(c => { if (c.isMesh) c.castShadow = false; });
    return P;
  };
  // ---------- Ballon-cadeau ----------
  G.makeBalloon = () => {
    const g = new THREE.Group(), b = G.mb(1), c = G.pick([0xe8434a, 0xffc23d, 0x5b8fd6, 0xff8fc0, 0x4fb35f]);
    b.sph(.45, c, 0, 1.6, 0, 1, 1.15, 1, 0, 14, 10); b.cone(.06, .1, 6, c, 0, 1.06, 0, Math.PI); b.cyl(.008, .008, .9, 3, 0xeeeeee, 0, .6, 0);
    b.box(.42, .34, .42, 0xe85d6f, 0, 0, 0); b.box(.44, .36, .1, 0xffd23f, 0, 0, 0); b.box(.1, .36, .44, 0xffd23f, 0, 0, 0);
    const m = mesh(b.done()); g.add(m); return g;
  };
  // ---------- Nuages ----------
  MD.cloud = v => {
    const b = G.mb(200 + v), r = G.rng(300 + v); const n = 4 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const x = (i - n / 2) * 1.6 + r(), s = 1.4 + r() * 1.6; b.ico(s, 1, i % 2 ? 0xffffff : 0xf4f7ff, x, r() * .8, (r() - .5) * 2, 1, .7, 1); }
    b.ico(2.2, 1, 0xffffff, 0, .9, 0, 1.4, .7, 1); return b.done();
  };
  MD.bobber = v => { const b = G.mb(); b.sph(.08, 0xe8343a, 0, .04, 0, 1, 1, 1, 0, 8, 6); b.sph(.081, 0xffffff, 0, .1, 0, 1, .45, 1, 0, 8, 4); return b.done(); };
  MD.pebble = v => { const b = G.mb(); b.ico(.07, 0, 0x9d9a93, 0, 0, 0); return b.done(); };
  MD.blob = v => { const g = new THREE.CircleGeometry(.5, 16); g.rotateX(-Math.PI / 2); return g; };
})();
