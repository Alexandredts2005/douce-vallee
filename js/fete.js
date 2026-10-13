'use strict';
// ===== La fête à deux : 68 mini-jeux en 3D sur la place, en direct. Quand un joueur lance un jeu, tous ceux qui sont
// dans le village entrent dans la partie et sont amenés sur la place : même graine, même horloge, mêmes objets,
// chacun reçoit son matériel. Ce qui est pris, éclaté ou peint par l'un disparaît ou se colore chez l'autre. =====
(function () {
  const TAU = Math.PI * 2, MD = G.MODELS, NET = () => G.net, $ = G.el;
  const P = G.fete = { a: null, invited: {}, best: {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- modèles ----------
  const COL = [0xe8434a, 0x3b78d8, 0x3fa34d, 0xffd23f, 0x9b59d0, 0xff9a3c, 0x45c7c1, 0xff8fc0];
  const cv = v => COL[(v | 0) % 8];
  MD.fj_gem = v => { const b = G.mb(1900 + v); b.add(new THREE.OctahedronGeometry(.3, 0), cv(v), b.M(0, 0, 0, 0, 0, 0, 1, 1.4, 1), 1); return b.done(); };
  MD.fj_coin = v => { const b = G.mb(1910 + v); b.cyl(.3, .3, .07, 20, 0xf5c242, 0, 0, 0, Math.PI / 2); b.cyl(.21, .21, .08, 20, 0xffe17a, 0, 0, 0, Math.PI / 2, 0, 0, 1); return b.done(); };
  MD.fj_heart = v => { const b = G.mb(1920 + v), c = v ? 0xff8fc0 : 0xe8434a; b.sph(.17, c, -.12, .08, 0, 1, 1, .8, 1); b.sph(.17, c, .12, .08, 0, 1, 1, .8, 1); b.cone(.3, .36, 14, c, 0, -.16, 0, Math.PI, 0, 0, 1); return b.done(); };
  MD.fj_fruit = v => { const b = G.mb(1930 + v), c = [0xd8342c, 0xf08a24, 0x9fc63a, 0xf5a07a, 0x7d3f98, 0xffd23f][v % 6]; b.sph(.24, c, 0, 0, 0, 1, v === 2 ? 1.25 : .95, 1); b.cyl(.02, .02, .14, 6, 0x6b4a2e, 0, .26, 0); b.sph(.07, 0x4f9d4c, .07, .27, 0, 1.6, .4, .8); return b.done(); };
  MD.fj_mush = v => { const b = G.mb(1940 + v); b.cyl(.08, .1, .22, 10, 0xf3ead2, 0, .11, 0); b.sph(.2, v ? 0x9a6a3a : 0xd8342c, 0, .24, 0, 1, .6, 1); if (!v) for (const [x, z] of [[.08, .06], [-.09, .05], [0, -.1]]) b.sph(.035, 0xffffff, x, .33, z); return b.done(); };
  MD.fj_flake = v => { const b = G.mb(1950); for (let i = 0; i < 3; i++) b.box(.6, .05, .05, 0xdff4ff, 0, 0, 0, 0, 0, i * Math.PI / 3, 1); b.sph(.07, 0xffffff, 0, 0, 0, 1, 1, 1, 1); return b.done(); };
  MD.fj_candy = v => { const b = G.mb(1960 + v), c = cv(v); b.sph(.16, c, 0, 0, 0, 1.3, 1, 1); b.cone(.12, .18, 10, c, .27, 0, 0, 0, 0, Math.PI / 2); b.cone(.12, .18, 10, c, -.27, 0, 0, 0, 0, -Math.PI / 2); b.sph(.05, 0xffffff, .05, .1, .1); return b.done(); };
  MD.fj_egg = v => { const b = G.mb(1970 + v), c = [0xffd1dc, 0xbfe6fa, 0xd5f5c8, 0xfff0a8, 0xe3d0ff][v % 5]; b.sph(.2, c, 0, .26, 0, 1, 1.32, 1); b.cyl(.2, .2, .06, 16, 0xffffff, 0, .26, 0); return b.done(); };
  MD.fj_bug = v => { const b = G.mb(1980); b.sph(.1, 0xfff27a, 0, 0, 0, 1, 1, 1, 1); b.sph(.12, 0xffffff, .1, .06, 0, 1, .2, .6, 2); b.sph(.12, 0xffffff, -.1, .06, 0, 1, .2, .6, 2); return b.done(); };
  MD.fj_bell = v => { const b = G.mb(1990); b.cyl(.1, .28, .38, 16, 0xf5c242, 0, 0, 0); b.sph(.1, 0xf5c242, 0, .2, 0); b.sph(.06, 0xb58a1a, 0, -.2, 0); b.tor(.06, .02, 0xb58a1a, 0, .32, 0); return b.done(); };
  MD.fj_leaf = v => { const b = G.mb(2000 + v), c = [0xe8812a, 0xd8342c, 0xe0b400, 0x9a6a3a][v % 4]; b.sph(.22, c, 0, 0, 0, 1, .12, .62); b.box(.36, .02, .02, 0x6b4a2e, 0, .02, 0); return b.done(); };
  MD.fj_bubble = v => { const b = G.mb(2010); b.sph(.36, 0xcfefff, 0, 0, 0, 1, 1, 1, 2, 16, 12); b.sph(.07, 0xffffff, -.14, .16, .2, 1, 1, 1, 1); return b.done(); };
  MD.fj_lantern = v => { const b = G.mb(2020 + v), c = [0xff8a3c, 0xe8434a, 0xffd23f, 0xff8fc0][v % 4]; b.cyl(.24, .2, .5, 14, c, 0, 0, 0, 0, 0, 0, 1); b.cyl(.15, .15, .05, 12, 0x6b4a2e, 0, .27, 0); b.cyl(.13, .13, .05, 12, 0x6b4a2e, 0, -.27, 0); return b.done(); };
  MD.fj_disc = v => { const b = G.mb(2030); b.cyl(.3, .22, .08, 18, 0xff7a2a, 0, 0, 0); b.cyl(.16, .16, .09, 14, 0xffd23f, 0, 0, 0); return b.done(); };
  MD.fj_duck = v => { const b = G.mb(2040 + v), c = v ? 0xf5c242 : 0xffe36a; b.sph(.26, c, 0, .2, 0, 1.3, .85, 1); b.sph(.16, c, .2, .45, 0); b.cone(.07, .14, 8, 0xff8a3c, .38, .44, 0, 0, 0, -Math.PI / 2); b.sph(.03, 0x222222, .28, .5, .1); b.sph(.03, 0x222222, .28, .5, -.1); b.box(.5, .06, .3, 0x5b8fd6, 0, -.02, 0); return b.done(); };
  MD.fj_bottle = v => { const b = G.mb(2050 + v), c = [0x3fa34d, 0x9a6a3a, 0x3b78d8][v % 3]; b.cyl(.12, .12, .36, 12, c, 0, .18, 0, 0, 0, 0, 2); b.cyl(.05, .1, .14, 10, c, 0, .43, 0, 0, 0, 0, 2); b.cyl(.055, .055, .05, 8, 0xd9b382, 0, .52, 0); return b.done(); };
  MD.fj_can = v => { const b = G.mb(2060 + v); b.cyl(.15, .15, .34, 14, cv(v), 0, .17, 0); b.cyl(.15, .15, .02, 14, 0xd9d9d9, 0, .35, 0); b.cyl(.152, .152, .08, 14, 0xffffff, 0, .17, 0); return b.done(); };
  MD.fj_brick = v => { const b = G.mb(2070 + v); b.box(.8, .38, .38, v >= 8 ? 0xffd23f : cv(v), 0, 0, 0, 0, 0, 0, v >= 8 ? 1 : 0); return b.done(); };
  MD.fj_pinata = v => { const b = G.mb(2090 + v); b.sph(.36, cv(v), 0, 0, 0, 1, 1, 1); for (let i = 0; i < 5; i++) { const an = i / 5 * TAU; b.cone(.12, .32, 8, cv(v + i + 1), Math.cos(an) * .4, Math.sin(an) * .4, 0, 0, 0, an - Math.PI / 2); } b.cyl(.01, .01, .8, 4, 0xeeeeee, 0, .7, 0); return b.done(); };
  MD.fj_ghost = v => { const b = G.mb(2100); b.sph(.3, 0xf7f7ff, 0, .32, 0, 1, 1.1, 1, 2); b.cyl(.3, .36, .32, 14, 0xf7f7ff, 0, .06, 0, 0, 0, 0, 2); b.sph(.05, 0x222233, .1, .4, .26); b.sph(.05, 0x222233, -.1, .4, .26); return b.done(); };
  MD.fj_mole = v => { const b = G.mb(2110 + v); b.sph(.24, v ? 0xf5c242 : 0x7a5236, 0, .2, 0, 1, 1.15, 1); b.sph(.06, 0xff8fc0, 0, .26, .23); b.sph(.035, 0x111111, .09, .36, .18); b.sph(.035, 0x111111, -.09, .36, .18); return b.done(); };
  MD.fj_hole = v => { const b = G.mb(2120); b.cyl(.42, .42, .02, 18, 0x2b1d12, 0, .01, 0); b.tor(.44, .08, 0x8a5a3b, 0, .03, 0, Math.PI / 2); return b.done(); };
  MD.fj_frog = v => { const b = G.mb(2130 + v); b.sph(.22, v ? 0xf5c242 : 0x4fb35f, 0, .16, 0, 1.15, .8, 1); b.sph(.07, 0xffffff, .1, .32, .1); b.sph(.07, 0xffffff, -.1, .32, .1); b.sph(.035, 0x111111, .1, .34, .16); b.sph(.035, 0x111111, -.1, .34, .16); return b.done(); };
  MD.fj_hen = v => { const b = G.mb(2140 + v); b.sph(.24, v ? 0xf5c242 : 0xfafafa, 0, .26, 0, 1.2, 1, 1); b.sph(.13, v ? 0xf5c242 : 0xfafafa, 0, .48, .2); b.cone(.04, .1, 6, 0xffb02e, 0, .47, .34, Math.PI / 2); b.box(.04, .1, .12, 0xe8434a, 0, .62, .2); b.cyl(.02, .02, .16, 4, 0xffb02e, .08, .06, 0); b.cyl(.02, .02, .16, 4, 0xffb02e, -.08, .06, 0); return b.done(); };
  MD.fj_pumpkin = v => { const b = G.mb(2150 + v); for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; b.sph(.17, v ? 0xffd23f : 0xf08a24, Math.cos(an) * .11, .2, Math.sin(an) * .11, .9, 1, .9); } b.cyl(.03, .04, .12, 6, 0x5a7a2a, 0, .4, 0); return b.done(); };
  MD.fj_meteor = v => { const b = G.mb(2160); b.sph(.42, 0x5a4a44, 0, 0, 0, 1, .9, 1.05); b.sph(.3, 0xff7a2a, .12, .1, .1, 1, 1, 1, 1); return b.done(); };
  MD.fj_coco = v => { const b = G.mb(2170); b.sph(.3, 0x7a5236, 0, 0, 0, 1, 1.08, 1); b.sph(.04, 0x2b1d12, .08, .24, .12); b.sph(.04, 0x2b1d12, -.08, .24, .12); return b.done(); };
  MD.fj_snow = v => { const b = G.mb(2180); b.sph(.32, 0xf4f8ff, 0, 0, 0); return b.done(); };
  MD.fj_barrel = v => { const b = G.mb(2190 + v); b.cyl(.42, .42, 1.1, 16, v ? 0x8a5a3b : 0xb07a48, 0, 0, 0, 0, 0, Math.PI / 2); for (const x of [-.38, 0, .38]) b.cyl(.44, .44, .07, 16, 0x555555, x, 0, 0, 0, 0, Math.PI / 2); return b.done(); };
  MD.fj_bomb = v => { const b = G.mb(2200); b.sph(.3, 0x2b2b33, 0, 0, 0); b.cyl(.08, .08, .1, 8, 0x555555, 0, .3, 0); b.cyl(.015, .015, .2, 4, 0xd9b382, .05, .42, 0, 0, 0, -.4); b.sph(.07, 0xffb02e, .1, .52, 0, 1, 1, 1, 1); return b.done(); };
  MD.fj_crown = v => { const b = G.mb(2210); b.cyl(.28, .26, .2, 16, 0xf5c242, 0, 0, 0); for (let i = 0; i < 5; i++) { const an = i / 5 * TAU; b.cone(.07, .2, 6, 0xf5c242, Math.cos(an) * .26, .18, Math.sin(an) * .26); b.sph(.04, cv(i), Math.cos(an) * .28, .02, Math.sin(an) * .28, 1, 1, 1, 1); } return b.done(); };
  MD.fj_flag = v => { const b = G.mb(2220 + v); b.cyl(.04, .05, 1.8, 6, 0xeeeeee, 0, .9, 0); b.box(.6, .4, .03, v ? 0x4fb35f : 0xe8434a, .3, 1.55, 0, 0, 0, 0, v ? 1 : 0); b.cyl(.2, .24, .08, 10, 0x777777, 0, .04, 0); return b.done(); };
  MD.fj_beacon = v => { const b = G.mb(2230 + v), c = v ? 0x4fb35f : 0xff9a3c; b.cyl(.55, .7, .25, 16, 0x8a8a8a, 0, .12, 0); b.cyl(.35, .35, 4, 14, c, 0, 2.2, 0, 0, 0, 0, 2); b.sph(.3, c, 0, 4.3, 0, 1, 1, 1, 1); return b.done(); };
  MD.fj_zone = v => { const b = G.mb(2240 + v), c = v === 7 ? 0x9a9a9a : cv(v); b.cyl(1, 1, .02, 32, c, 0, 0, 0, 0, 0, 0, 2); b.tor(1, .05, c, 0, .03, 0, Math.PI / 2, 0, 0, v === 7 ? 0 : 1, 40); return b.done(); };
  MD.fj_pad = v => { const b = G.mb(2250 + v), on = v >= 8; b.cyl(.9, .95, .1, 24, cv(v % 8), 0, .05, 0, 0, 0, 0, on ? 1 : 0); b.tor(.92, .05, on ? 0xffffff : 0x5a4a3a, 0, .1, 0, Math.PI / 2, 0, 0, on ? 1 : 0, 32); return b.done(); };
  MD.fj_tile = v => { const b = G.mb(2270 + v); b.box(.94, .04, .94, cv(v % 8), 0, 0, 0, 0, 0, 0, v >= 8 ? 1 : 0); return b.done(); };
  MD.fj_flower = v => { const b = G.mb(2290 + v); b.cyl(.025, .025, .34, 5, 0x4f9d4c, 0, .17, 0); for (let i = 0; i < 5; i++) { const an = i / 5 * TAU; b.sph(.09, cv(v), Math.cos(an) * .1, .36, Math.sin(an) * .1, 1, .4, 1); } b.sph(.06, 0xffd23f, 0, .38, 0); return b.done(); };
  MD.fj_beam = v => { const b = G.mb(2300 + v); for (let i = 0; i < 6; i++) b.cyl(.13, .13, 1 / 6, 10, i % 2 ? 0xffffff : (v ? 0x3b78d8 : 0xe8434a), (i + .5) / 6, 0, 0, 0, 0, Math.PI / 2); return b.done(); };
  MD.fj_warn = v => { const b = G.mb(2310); b.cyl(1, 1, .02, 24, 0xff4040, 0, 0, 0, 0, 0, 0, 2); b.tor(1, .06, 0xff4040, 0, .02, 0, Math.PI / 2, 0, 0, 1, 32); return b.done(); };
  MD.fj_wave = v => { const b = G.mb(2320); b.tor(1, .07, 0x9fdcff, 0, 0, 0, Math.PI / 2, 0, 0, 1, 48); return b.done(); };
  MD.fj_cloud = v => { const b = G.mb(2330); for (const [x, y, z, r] of [[0, 0, 0, .9], [.8, -.1, .2, .7], [-.8, -.1, -.1, .75], [.2, .3, -.5, .6], [-.3, .2, .6, .6]]) b.sph(r, 0x8a93a3, x, y, z, 1, .7, 1); return b.done(); };
  MD.fj_target = v => { const b = G.mb(2340); [[3, 0xffffff], [2.2, 0xe8434a], [1.3, 0xffffff], [.55, 0xe8434a]].forEach(([r, c], i) => b.cyl(r, r, .03, 32, c, 0, .015 + i * .012, 0)); return b.done(); };
  MD.fj_hoop = v => { const b = G.mb(2350); b.box(1.6, 1.1, .08, 0xffffff, 0, .45, -.55); b.tor(.5, .045, 0xff7a2a, 0, 0, 0, Math.PI / 2, 0, 0, 1, 24); return b.done(); };
  MD.fj_basket = v => { const b = G.mb(2360 + v); b.cyl(.55, .42, .5, 16, 0xc89157, 0, .25, 0); b.tor(.55, .05, 0x8a5a3b, 0, .5, 0, Math.PI / 2); b.cyl(.6, .6, .04, 16, cv(v), 0, .02, 0, 0, 0, 0, 1); return b.done(); };
  MD.fj_wall = v => { const b = G.mb(2370); b.box(10, .9, .5, 0xc9b79a, 0, .45, 0); b.box(10.2, .1, .6, 0xe6dccb, 0, .95, 0); return b.done(); };
  MD.fj_crate = v => { const b = G.mb(2380); b.box(1.2, .7, .8, 0xb07a48, 0, .35, 0); b.box(1.24, .06, .84, 0x8a5a3b, 0, .7, 0); return b.done(); };
  MD.fj_chair = v => { const b = G.mb(2390); b.box(.5, .06, .5, 0xe8434a, 0, .45, 0, 0, 0, 0, 1); b.box(.5, .5, .06, 0xe8434a, 0, .72, -.22, 0, 0, 0, 1); for (const [x, z] of [[.2, .2], [-.2, .2], [.2, -.2], [-.2, -.2]]) b.cyl(.03, .03, .45, 5, 0xffffff, x, .22, z); return b.done(); };

  // ---------- petits outils ----------
  const mk = (name, v, sh = true) => { const m = new THREE.Mesh(G.getGeo(name, v | 0), G.MATS); m.frustumCulled = false; m.castShadow = sh; G.scene.add(m); return m; };
  const rm = m => { if (m) G.scene.remove(m); };
  const tex = (txt, o = {}) => { const c = document.createElement('canvas'), W = o.W || 512, H = o.H || 128; c.width = W; c.height = H; const x = c.getContext('2d'), r = 26;
    x.fillStyle = o.bg || 'rgba(255,248,230,.94)'; x.beginPath(); x.moveTo(r, 0); x.arcTo(W, 0, W, H, r); x.arcTo(W, H, 0, H, r); x.arcTo(0, H, 0, 0, r); x.arcTo(0, 0, W, 0, r); x.fill();
    let fs = o.fs || 60; const font = () => '600 ' + fs + 'px Fredoka, "Trebuchet MS", sans-serif'; x.font = font(); while (x.measureText(txt).width > W - 28 && fs > 18) { fs -= 3; x.font = font(); }
    x.fillStyle = o.col || '#3d2b1d'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, H / 2 + 3); return new THREE.CanvasTexture(c); };
  const sprite = (txt, w, h, o) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(txt, o), transparent: true, depthWrite: false })); s.scale.set(w, h, 1); s.renderOrder = 6; G.scene.add(s); return s; };
  const setText = (s, txt, o) => { s.material.map.dispose(); s.material.map = tex(txt, o); s.material.needsUpdate = true; };
  const unsprite = s => { G.scene.remove(s); s.material.map.dispose(); s.material.dispose(); };
  const tone = (f, d = .22, type = 'triangle', vol = .07) => { const A = G.audio; if (!A || !A.ok || !A.ctx || !A.sfxG) return; try { const C = A.ctx, t = C.currentTime, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + d + .05); } catch (e) { } };
  const NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  const myId = () => G.net && G.net.me ? G.net.me() : null;
  const here = () => { const net = NET(); return net && net.online() ? net.peersHere() : []; };
  // l'aire de jeu : le coin le plus dégagé autour du point des jeux de la place (pas de fontaine, d'arbre ou de banc au milieu)
  const center = m => { const c = m.meta.games || m.meta.plaza || m.meta.spawn || { x: G.player.x, z: G.player.z }, key = m.rev + ':' + c.x + ':' + c.z; if (m._arena && m._arena.key === key) return m._arena; const R = 9; let best = null;
    for (let dz = -24; dz <= 24; dz += 2) for (let dx = -24; dx <= 24; dx += 2) { const x = Math.floor(c.x) + dx, z = Math.floor(c.z) + dz; if (!m.inb(x, z)) continue; const b0 = m.baseH(x, z); let free = 0, tot = 0, pav = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { if (i * i + j * j > R * R) continue; tot++; const tx = x + i, tz = z + j; if (!m.inb(tx, tz) || m.water[m.idx(tx, tz)] || m.baseH(tx, tz) !== b0) continue; const o = m.objAt(tx, tz), d = o && G.OBJ[o.t]; if (d && d.h > .35 && !d.walk) continue; free++; const sf = G.SURF[m.surf[m.idx(tx, tz)]]; if (sf && sf.path) pav++; }
      for (let j = -R - 3; j <= R + 3; j += 2) for (let i = -R - 3; i <= R + 3; i += 2) { const o = m.objAt(x + i, z + j), d = o && G.OBJ[o.t]; if (d && d.chop >= 3 && i * i + j * j < (R + 3) * (R + 3)) free -= 6; } // les arbres tout autour cachent la vue
      const s = free / tot + pav / tot * .25 - Math.hypot(dx, dz) * .004; if (!best || s > best.s) best = { s, x: x + .5, z: z + .5 }; }
    return m._arena = { key, x: best ? best.x : c.x, z: best ? best.z : c.z }; };
  const okAt = (a, x, z, tol = 1.3) => { const m = a.map; if (!m.inb(Math.floor(x), Math.floor(z)) || m.isWaterAt(x, z)) return false; return Math.abs(m.topAt(x, z) - a.g0) < tol; };
  // une place tirée de la graine : identique chez tout le monde (même village, mêmes objets)
  function spot(a, k, o = {}) { const R = G.rng(((a.seed + (o.salt || 0) * 1013904223) >>> 0) + k * 7919), rad = o.R || a.R, min = o.min != null ? o.min : 1.5;
    for (let t = 0; t < 12; t++) { const ang = R() * TAU, d = min + Math.sqrt(R()) * (rad - min), x = a.cx + Math.cos(ang) * d, z = a.cz + Math.sin(ang) * d; if (okAt(a, x, z, o.tol)) return { x, z, g: a.map.topAt(x, z), R, ang, d }; }
    return { x: a.cx, z: a.cz, g: a.g0, R, ang: 0, d: 0 }; }
  // calendrier : l'objet k naît à un moment précis et vit un temps précis (les premiers sont là dès le départ)
  function alive(sp, el) { const out = [], f = sp.first || 0, fl = sp.firstLife || sp.life || 1e9; if (el < 0) return out;
    for (let k = 0; k < f; k++) if (el < fl) out.push([k, el]);
    if (sp.every) { const L = sp.life, lo = Math.max(f, Math.floor(f - 1 + (el - L) / sp.every) + 1), hi = Math.floor(f - 1 + el / sp.every); for (let k = lo; k <= hi; k++) { const age = el - (k - f + 1) * sp.every; if (age >= 0 && age < L) out.push([k, age]); } }
    return out; }
  function sync(a, list, got, make, move, live = a.live) { const seen = new Set();
    for (const [k, age] of list) { if (got.has(k)) continue; seen.add(k); let it = live.get(k); if (!it) { it = make(k); it.k = k; live.set(k, it); } it.age = age; move(it, age); }
    for (const [k, it] of live) if (!seen.has(k)) { kill(it); live.delete(k); } }
  const kill = it => { rm(it.m); rm(it.m2); };
  const padUnder = (pads, r = .95) => { const p = G.player; for (let i = 0; i < pads.length; i++) if (Math.hypot(pads[i].x - p.x, pads[i].z - p.z) < r) return i; return -1; };
  // on prend / on éclate un objet : il disparaît aussi chez les autres
  function take(a, it, pts) { a.got.push(it.k); a.score += pts != null ? pts : it.pts; kill(it); a.live.delete(it.k); G.sfx(a.g.kind === 'shoot' ? 'pop' : 'coin', .8); G.fx.burst(it.x, it.y, it.z, 14, it.burst || [0xffd23f, 0xffffff], 3, .6, 3); G.popup('+' + (pts != null ? pts : it.pts), it.x, it.y + .5, it.z, 'gold'); push(); }
  function hurt(a, fx, fz, n = 30) { const p = G.player; if (a.stun > 0) return; a.stun = 1.1; a.score = Math.max(0, a.score - n); G.sfx('hurt'); G.cam.shake(.22); G.popup('-' + n, p.x, p.y + 2, p.z, ''); const dx = p.x - fx, dz = p.z - fz, l = Math.hypot(dx, dz) || 1; p.vy = 5.5; p.onGround = false; p.vx = dx / l * 5; p.vz = dz / l * 5; push(); }

  // ---------- les familles de jeux ----------
  const K = {};
  // ramasser (en touchant) ou tirer (au lance-pierre) des objets qui apparaissent, tombent, montent, tournent…
  function makeItem(a, k) { const g = a.g; let s;
    if (g.layout) s = Object.assign({ R: G.rng(a.seed + k * 7919) }, g.layout(a, k)); else s = spot(a, k, { salt: 1, R: g.R, min: g.min });
    const R = s.R, gold = R() < (g.gold || 0), v = g.v ? g.v(R, k) : 0;
    const it = { x: s.x, z: s.z, x0: s.x, z0: s.z, g: s.g != null ? s.g : a.g0, y: s.y, h: s.y != null ? s.y - a.g0 : (R() < (g.hi || 0) ? 1.55 + R() * .45 : (g.h0 != null ? g.h0 : .75)), gold, pts: (g.pts || 1) * (gold ? 3 : 1),
      a0: s.ang || 0, d: Math.max(2.5, s.d || 4), w: (R() < .5 ? -1 : 1) * (.3 + R() * .35), vs: g.vs ? g.vs[0] + R() * (g.vs[1] - g.vs[0]) : 1, ph: R() * TAU, burst: g.burst };
    const an = R() * TAU; it.dx = Math.cos(an); it.dz = Math.sin(an); if (g.motion === 'arc' || g.motion === 'drift') { it.x0 = a.cx - it.dx * (g.motion === 'arc' ? 0 : 9); it.z0 = a.cz - it.dz * (g.motion === 'arc' ? 0 : 9); }
    it.m = mk(g.model, gold && g.goldV != null ? g.goldV : v); if (gold && g.goldV == null) it.m.scale.setScalar(1.4); if (g.motion === 'rail') { it.lane = k % 3; it.dir = it.lane % 2 ? -1 : 1; }
    return it; }
  function moveItem(a, it, age, dt) { const g = a.g, t = performance.now() / 1000;
    switch (g.motion) {
      case 'fall': it.y = Math.max(it.g + .35, it.g + 11 - age * it.vs * 6); break;
      case 'sky': it.y = Math.max(it.g + .3, it.g + 10 - age * it.vs); it.x = it.x0 + Math.sin(age * 1.6 + it.ph) * .8; break;
      case 'rise': it.y = it.g + .4 + age * it.vs; break;
      case 'orbit': { const an = it.a0 + age * it.w; it.x = a.cx + Math.cos(an) * it.d; it.z = a.cz + Math.sin(an) * it.d; it.y = a.g0 + it.h + Math.sin(age * 2 + it.ph) * .15; break; }
      case 'drift': it.x = it.x0 + it.dx * age * it.vs * 2.2; it.z = it.z0 + it.dz * age * it.vs * 2.2; it.y = a.g0 + it.h + Math.sin(age * 2 + it.ph) * .2; break;
      case 'hop': it.x = it.x0 + it.dx * age * .8; it.z = it.z0 + it.dz * age * .8; it.y = a.g0 + .3 + Math.abs(Math.sin(age * 3.2 + it.ph)) * 1.3; break;
      case 'swing': it.x = it.x0 + Math.sin(age * 1.4 + it.ph) * 1.3; it.z = it.z0 + Math.cos(age * 1.1 + it.ph) * .6; it.y = a.g0 + 3 + Math.sin(age * 2.8 + it.ph) * .25; break;
      case 'arc': { const u = age / g.spawn.life; it.x = it.x0 + it.dx * (u - .5) * 22; it.z = it.z0 + it.dz * (u - .5) * 22; it.y = a.g0 + 1 + Math.sin(u * Math.PI) * 5.5; break; }
      case 'rail': { const L = 17; it.x = a.cx + it.dir * (age * 2.4 - L / 2); it.z = a.cz - 6.5 - it.lane * .4; it.y = a.g0 + 1 + it.lane * .85 + Math.abs(Math.sin(age * 5)) * .06; it.m.rotation.y = it.dir > 0 ? 0 : Math.PI; break; }
      default: it.y = it.g + it.h + (g.bob === 0 ? 0 : Math.sin(t * 2.2 + it.ph) * .1);
    }
    if (g.spin !== 0 && g.motion !== 'rail') it.m.rotation.y = age * (g.spin || 1.6) + it.ph;
    it.m.position.set(it.x, it.y, it.z);
    if (g.near) it.m.visible = Math.hypot(it.x - G.player.x, it.z - G.player.z) < g.near; }
  K.collect = {
    tick(a, dt, el) { const g = a.g, p = G.player; sync(a, alive(g.spawn, el), a.U, k => makeItem(a, k), (it, age) => moveItem(a, it, age, dt));
      if (g.kind === 'collect') for (const it of [...a.live.values()]) if (Math.hypot(it.x - p.x, it.y - (p.y + .6), it.z - p.z) < (g.pick || .95) && (!g.near || it.m.visible)) take(a, it);
      if (g.spawn.first && !g.spawn.every && a.U.size >= g.spawn.first) a.done = 'all';
      a.msg = g.tip; } };
  K.shoot = { tick: K.collect.tick, targets: a => [...a.live.values()].filter(it => it.y != null),
    hit(a, x, y, z) { for (const it of a.live.values()) if (it.y != null && Math.hypot(it.x - x, it.y - y, it.z - z) < (a.g.hitR || .7)) { take(a, it); return true; } return false; } };
  // course : des anneaux, des fanions ou des balises à passer dans l'ordre ; chacun fait sa course, on voit l'avance de l'autre
  K.race = {
    init(a) { const g = a.g; a.cps = g.course(a); a.cp = 0; a.cpm = a.cps.map((c, i) => { const m = mk(c.model, i === 0 ? 1 : 0, c.model !== 'ring'); m.position.set(c.x, c.my != null ? c.my : c.y, c.z); if (c.ry != null) m.rotation.y = c.ry; a.st.push(m); return m; }); },
    tick(a, dt, el) { const p = G.player, now = performance.now();
      a.cpm.forEach((m, i) => { m.visible = i >= a.cp && i < a.cp + 4; const s = i === a.cp ? 1 + Math.sin(now / 150) * .07 : .85; m.scale.setScalar(s); });
      const c = a.cps[a.cp];
      if (c && Math.hypot(c.x - p.x, c.y - (p.y + .6), c.z - p.z) < (c.r || 1.1)) { a.cp++; a.score += 10; tone(NOTES[a.cp % 8]); G.fx.burst(c.x, c.y, c.z, 16, [0xff9a3c, 0xffffff, 0x4fb35f], 3, .6, 2);
        const nx = a.cps[a.cp]; if (nx) a.cpm[a.cp].geometry = G.getGeo(nx.model, 1);
        if (a.cp >= a.cps.length) { a.score += Math.max(0, Math.ceil(a.dur - el)) * 5; G.sfx('fanfare'); a.done = 'all'; } push(); }
      a.msg = c ? (a.g.tip || 'Passe dans le vert !') + ' — ' + a.cp + '/' + a.cps.length : ''; } };
  // zones : rester dans la lumière (ou fuir le nuage)
  K.zone = {
    init(a) { a.zm = []; for (let i = 0; i < (a.g.zones || 1); i++) { const m = mk('fj_zone', a.g.zc != null ? a.g.zc : 3, false); a.zm.push(m); a.st.push(m); } if (a.g.cloud) { a.cl = mk('fj_cloud', 0); a.st.push(a.cl); } },
    tick(a, dt, el) { const zs = a.g.zone(a, el), p = G.player; let inside = false;
      zs.forEach((z, i) => { const m = a.zm[i], gy = a.map.topAt(z.x, z.z) + .04, v = z.on === false ? 7 : (a.g.zc != null ? a.g.zc : 3); m.position.set(z.x, gy, z.z); m.scale.set(z.r, 1, z.r); if (m.userData.v !== v) { m.geometry = G.getGeo('fj_zone', v); m.userData.v = v; }
        if (z.on !== false && Math.hypot(p.x - z.x, p.z - z.z) < z.r) inside = true; });
      if (a.cl) { const z = zs[0]; a.cl.position.set(z.x, a.g0 + 4.6 + Math.sin(el * 2) * .1, z.z); a.cl.scale.setScalar(z.r * .9); if (Math.random() < dt * 8) G.fx.burst(z.x + (Math.random() - .5) * z.r * 1.4, a.g0 + 4, z.z + (Math.random() - .5) * z.r * 1.4, 2, [0x9fdcff], 1, .6, -6); }
      const others = a.pt.some(q => zs.some(z => z.on !== false && Math.hypot(q.pr.x - z.x, q.pr.z - z.z) < z.r));
      if (a.g.mode === 'out') { const inArena = Math.hypot(p.x - a.cx, p.z - a.cz) < a.R + 2; if (inside) a.score = Math.max(0, a.score - dt * 15); else if (inArena) a.score += dt * 10; a.msg = inside ? '☔ Sors du nuage !' : inArena ? 'Reste au sec, mais sur la place !' : 'Reviens sur la place !'; }
      else if (a.g.mode === 'alone') { if (inside && !others) a.score += dt * 10; a.msg = inside ? (others ? '⚔️ Pousse-toi : il faut être seul·e dans le cercle !' : '👑 Tu marques !') : 'Va dans le cercle !'; }
      else { if (inside) a.score += dt * 10; a.msg = inside ? '✨ Tu marques !' : 'Va dans le cercle lumineux !'; } } };
  // esquive : ce qui tombe, roule, tourne ou s'étend ; on marque tant qu'on n'est pas touché
  const HZ = {
    rain(a, H, el, p, air) { sync(a, alive({ every: H.every, life: 1.75 }, el).map(([k, age]) => [H.id * 1e5 + k, age]), a.none, k => { const s = spot(a, k, { salt: 20 + H.id, R: a.R + 1, min: 0 }); const it = { x: s.x, z: s.z, g: s.g, w: mk('fj_warn', 0, false), m: mk(H.model, 0) }; it.m2 = it.w; return it; }, (it, age) => {
      const r = H.r || 1.1; if (age < 1.15) { it.w.visible = true; it.w.position.set(it.x, it.g + .03, it.z); it.w.scale.set(r * Math.min(1, age / .9), 1, r * Math.min(1, age / .9)); it.m.visible = false; }
      else { it.w.visible = age < 1.42; const u = Math.min(1, (age - 1.15) / .27); it.m.visible = true; it.m.position.set(it.x, it.g + .35 + (1 - u) * 11, it.z); it.m.rotation.x += .2;
        if (u >= 1 && !it.hit) { it.hit = true; if (Math.hypot(p.x - it.x, p.z - it.z) < 9) { G.fx.burst(it.x, it.g + .3, it.z, 10, H.burst || [0x8a7a6a, 0xff7a2a], 3, .5, 4); G.sfx('thud', .5); } if (Math.hypot(p.x - it.x, p.z - it.z) < r && air < 1.6) hurt(a, it.x, it.z); } } }, H.live); },
    roll(a, H, el, p, air) { const L = 2 * (a.R + 3) / H.sp; sync(a, alive({ every: H.every, life: L }, el).map(([k, age]) => [H.id * 1e5 + k, age]), a.none, k => { const R = G.rng(a.seed + k * 7919 + H.id * 31), an = R() * TAU, sx = a.cx + Math.cos(an) * (a.R + 3), sz = a.cz + Math.sin(an) * (a.R + 3), off = (R() - .5) * 6, tx = a.cx - Math.sin(an) * off, tz = a.cz + Math.cos(an) * off, l = Math.hypot(tx - sx, tz - sz); const m = mk(H.model, 0); m.rotation.order = 'YXZ'; return { sx, sz, dx: (tx - sx) / l, dz: (tz - sz) / l, m }; }, (it, age) => {
      it.x = it.sx + it.dx * age * H.sp; it.z = it.sz + it.dz * age * H.sp; const gy = a.map.topAt(it.x, it.z); it.y = gy + H.rad; it.m.position.set(it.x, it.y, it.z); it.m.rotation.y = Math.atan2(it.dx, it.dz); it.m.rotation.x = age * H.sp / H.rad;
      if (!it.hit && Math.hypot(p.x - it.x, p.z - it.z) < H.rad + .35 && p.y - gy < H.rad * 1.15) { it.hit = true; hurt(a, it.x, it.z); } }, H.live); },
    beam(a, H, el, p, air) { if (!H.m) { H.m = mk('fj_beam', H.v || 0); a.st.push(H.m); } const an = H.dir * (H.w0 * el + H.acc * el * el / 2) + (H.ph || 0); H.m.position.set(a.cx, a.g0 + .35, a.cz); H.m.scale.set(a.R + 1, 1, 1); H.m.rotation.y = -an;
      const dx = p.x - a.cx, dz = p.z - a.cz, d = Math.hypot(dx, dz), along = dx * Math.cos(an) + dz * Math.sin(an), across = Math.abs(-dx * Math.sin(an) + dz * Math.cos(an));
      if (d > .4 && d < a.R + 1 && along > 0 && across < .42 && air < .55) hurt(a, a.cx, a.cz, 20); },
    wave(a, H, el, p, air) { sync(a, alive({ every: H.every, life: (a.R + 1) / H.sp }, el).map(([k, age]) => [H.id * 1e5 + k, age]), a.none, k => ({ m: mk('fj_wave', 0, false) }), (it, age) => { const r = age * H.sp + .3; it.m.position.set(a.cx, a.g0 + .2, a.cz); it.m.scale.set(r, 1, r);
      const d = Math.hypot(p.x - a.cx, p.z - a.cz); if (!it.hit && Math.abs(d - r) < .42 && air < .5) { it.hit = true; hurt(a, a.cx, a.cz, 20); } }, H.live); } };
  K.dodge = { init(a) { a.stun = 0; a.none = new Set(); a.g.haz.forEach((H, i) => { H.id = i + 1; H.m = null; H.live = new Map(); }); },
    end(a) { for (const H of a.g.haz) { for (const it of H.live.values()) kill(it); H.live.clear(); } },
    tick(a, dt, el) { const p = G.player, air = p.y - a.map.topAt(p.x, p.z); if (a.stun > 0) a.stun -= dt; else a.score += dt * 10;
      for (const H of a.g.haz) HZ[H.t](a, H, el, p, air); a.msg = a.stun > 0 ? '💫 Aïe !' : a.g.tip; } };
  // chat, patate chaude, couronne, drapeau : qui « l'a » se déduit des passes de chacun (à deux)
  K.tag = {
    init(a) { a.mark = mk(a.g.model, a.g.mv || 0); a.st.push(a.mark); a.mp = null; if (a.g.mode === 'bomb') { const R = G.rng(a.seed + 99); a.boom = []; for (let t = 10 + R() * 4; t < a.dur - 1; t += 10 + R() * 5) a.boom.push(t); a.bi = 0; } },
    tick(a, dt, el) { const q = a.pt[0], p = G.player; if (!q) { a.mark.visible = false; a.msg = 'En attente de ton ami… (il faut être deux)'; return; }
      const ev = a.got.concat(Array.isArray(q.g.got) ? q.g.got : []).sort((x, y) => x - y), n = ev.length, last = n ? ev[n - 1] / 10 : -9;
      const iHold = (n % 2 === 0) === (a.me === 0), tx = iHold ? p.x : q.pr.x, ty = (iHold ? p.y : q.pr.y) + 2.5, tz = iHold ? p.z : q.pr.z;
      if (!a.mp) a.mp = { x: tx, y: ty, z: tz }; const k = Math.min(1, dt * 12); a.mp.x += (tx - a.mp.x) * k; a.mp.y += (ty - a.mp.y) * k; a.mp.z += (tz - a.mp.z) * k;
      a.mark.visible = true; a.mark.position.set(a.mp.x, a.mp.y + Math.sin(el * 4) * .08, a.mp.z); a.mark.rotation.y += dt * 2;
      if (iHold && el - last > 1.6 && Math.hypot(q.pr.x - p.x, q.pr.z - p.z) < 1.35 && Math.abs(q.pr.y - p.y) < 1.5) { a.got.push(Math.round(el * 10)); G.sfx('pop'); G.fx.burst(q.pr.x, q.pr.y + 1, q.pr.z, 16, [0xffd23f, 0xffffff], 3, .6, 3); push(); }
      const mode = a.g.mode, good = mode === 'keep';
      if (mode === 'bomb') { const nx = a.boom[a.bi]; if (nx != null && el >= nx) { a.bi++; if (iHold) { a.score = Math.max(0, a.score - 60); G.sfx('thud'); G.cam.shake(.4); G.fx.burst(p.x, p.y + 1, p.z, 40, [0xff7a2a, 0xffd23f, 0x333333], 6, 1, 4); G.popup('💥 -60', p.x, p.y + 2, p.z, ''); } else { a.score += 40; G.popup('+40', p.x, p.y + 2, p.z, 'gold'); G.fx.burst(q.pr.x, q.pr.y + 1, q.pr.z, 40, [0xff7a2a, 0xffd23f, 0x333333], 6, 1, 4); G.sfx('thud', .6); } push(); }
        const left = nx != null ? nx - el : 99; a.mark.scale.setScalar(1 + (left < 3 ? Math.abs(Math.sin(el * (12 - left * 3))) * .35 : 0)); a.msg = iHold ? '💣 Tu as la bombe ! Touche ' + esc(q.n) + ' pour la passer !' : '🏃 Fuis ! ' + esc(q.n) + ' a la bombe…'; }
      else { if (iHold === good) a.score += dt * 10; a.msg = mode === 'chat' ? (iHold ? '🐱 C\'est toi le chat ! Touche ' + esc(q.n) + ' !' : '🏃 Fuis le chat !') : (iHold ? a.g.ico + ' Tu l\'as ! Garde-le, ne te fais pas toucher !' : a.g.ico + ' Touche ' + esc(q.n) + ' pour le lui prendre !'); } } };
  // peinture : chaque case marchée prend ta couleur (si personne ne l'a déjà)
  K.paint = {
    init(a) { a.N = 2 * a.R + 1; a.ox = Math.floor(a.cx) - a.R; a.oz = Math.floor(a.cz) - a.R; a.tiles = new Map(); a.mine = new Set(); },
    tick(a, dt, el) { const p = G.player, ix = Math.floor(p.x) - a.ox, iz = Math.floor(p.z) - a.oz;
      if (ix >= 0 && iz >= 0 && ix < a.N && iz < a.N && Math.hypot(ix - a.R, iz - a.R) <= a.R) { const id = iz * a.N + ix; if (!a.U.has(id)) { a.got.push(id); a.mine.add(id); a.U.add(id); a.score += 1; tone(NOTES[id % 8], .12, 'sine', .04); push(); } }
      for (const id of a.U) if (!a.tiles.has(id)) { const x = a.ox + id % a.N + .5, z = a.oz + Math.floor(id / a.N) + .5, own = a.mine.has(id) ? a.me : 1 - a.me, m = mk(a.g.model, a.g.cols[own], false); m.position.set(x, a.map.topAt(x, z) + .03, z); if (a.g.model === 'fj_flower') m.rotation.y = id; a.tiles.set(id, m); a.st.push(m); G.fx.puff(x, a.map.topAt(x, z) + .1, z, 3, 0xffffff, .3); }
      a.msg = a.g.tip + ' — ' + a.mine.size + ' cases'; } };
  // réflexes : quelque chose surgit à un endroit précis ; le premier qui le touche gagne
  K.whack = {
    init(a) { a.holes = a.g.holes(a); if (a.g.holeModel) for (const h of a.holes) { const m = mk(a.g.holeModel, h.v || 0, false); m.position.set(h.x, h.g + .02, h.z); a.st.push(m); } a.mus = 0; },
    tick(a, dt, el) { const g = a.g, p = G.player, L = g.spawn.life;
      sync(a, alive(g.spawn, el), a.U, k => { const R = G.rng(a.seed + k * 7919 + 77), h = a.holes[Math.floor(R() * a.holes.length)], gold = R() < (g.gold || 0), an = R() * TAU; const it = { x: h.x, z: h.z, x0: h.x, z0: h.z, g: h.g, gold, pts: (g.pts || 10) * (gold ? 3 : 1), ph: R() * TAU, dx: Math.cos(an), dz: Math.sin(an), hv: h.v || 0 }; it.m = mk(g.model, g.model === 'fj_pad' ? (h.v || 0) + 8 : gold ? 1 : 0, g.model !== 'fj_pad'); if (g.pop) tone(NOTES[(k * 3) % 8], .1, 'square', .025); return it; }, (it, age) => {
        const up = Math.max(.01, Math.min(1, age / .18, (L - age) / .18));
        if (g.roam) { it.x = it.x0 + it.dx * age * 1.4 + Math.sin(age * 3 + it.ph) * .3; it.z = it.z0 + it.dz * age * 1.4; it.y = a.map.topAt(it.x, it.z) + Math.abs(Math.sin(age * 6)) * .15; it.m.rotation.y = Math.atan2(it.dx, it.dz); }
        else if (g.float) { it.y = it.g + .5 + Math.sin(age * 2 + it.ph) * .15; it.m.scale.setScalar(up); it.m.rotation.y = age; }
        else if (g.model === 'fj_pad') { it.y = it.g + .04; }
        else it.y = it.g - .45 + up * .5;
        it.m.position.set(it.x, it.y, it.z); });
      for (const it of [...a.live.values()]) if (Math.hypot(it.x - p.x, it.z - p.z) < (g.pick || 1.0) && Math.abs(it.g - p.y) < 1.5) take(a, it);
      if (g.music) { const inGap = !a.live.size; if (inGap && (a.mus -= dt) < 0) { a.mus = .32; a.note = ((a.note || 0) + 1) % 8; tone(NOTES[[0, 2, 4, 2, 5, 4, 2, 0][a.note]], .25, 'square', .03); } }
      a.msg = g.tip; } };
  // mémoire (Simon) : les dalles s'allument dans l'ordre, puis chacun marche dessus dans le même ordre
  K.simon = {
    init(a) { const n = a.g.n; a.pads = []; for (let i = 0; i < n; i++) { const an = i / n * TAU + .4, x = a.cx + Math.cos(an) * 3.4, z = a.cz + Math.sin(an) * 3.4, m = mk('fj_pad', i, false); m.position.set(x, a.map.topAt(x, z) + .02, z); a.pads.push({ x, z, m, v: -1 }); a.st.push(m); }
      const R = G.rng(a.seed + 5); a.seq = []; for (let i = 0; i < 60; i++) a.seq.push(Math.floor(R() * n));
      a.rounds = []; const sp = a.g.slow ? 1 : .75; for (let t = 0, r = 1; t < a.dur; r++) { const sh = r * sp + .3, inp = 3.5 + r * 1.1; a.rounds.push({ r, t0: t + 1.4, t1: t + 1.4 + sh, t2: t + 1.4 + sh + inp, sp }); t += 1.4 + sh + inp; }
      a.ri = 0; a.pos = 0; a.on = -1; a.flash = 0; },
    tick(a, dt, el) { const rd = a.rounds.find(r => el < r.t2); if (!rd) return; const n = a.g.n, lit = new Array(n).fill(false);
      if (rd.r !== a.ri) { a.ri = rd.r; a.pos = 0; a.fail = false; a.ok = false; }
      if (el < rd.t0) a.msg = '🧠 Manche ' + rd.r + ' : regarde bien les dalles…';
      else if (el < rd.t1) { const i = Math.floor((el - rd.t0) / rd.sp), f = el - rd.t0 - i * rd.sp; if (i < rd.r && f < rd.sp * .72) { lit[a.seq[i]] = true; if (a.shown !== rd.r * 100 + i) { a.shown = rd.r * 100 + i; tone(NOTES[a.seq[i]], .3); } } a.msg = '👀 Retiens l\'ordre (' + rd.r + ')'; }
      else { const pad = padUnder(a.pads); if (pad !== a.on) { a.on = pad; if (pad >= 0 && !a.fail && !a.ok) { if (pad === a.seq[a.pos]) { a.pos++; tone(NOTES[pad], .2); a.flash = .3; a.fp = pad; if (a.pos >= rd.r) { a.ok = true; a.score += 10 * rd.r; G.sfx('coin'); G.popup('+' + 10 * rd.r, G.player.x, G.player.y + 2, G.player.z, 'gold'); push(); } } else { a.fail = true; G.sfx('error'); } } }
        a.msg = a.ok ? '✔ Bravo ! Prépare-toi pour la suivante…' : a.fail ? '✘ Raté… attends la manche suivante' : '👣 À toi : marche sur les dalles dans l\'ordre (' + a.pos + '/' + rd.r + ')'; }
      if (a.flash > 0) { a.flash -= dt; lit[a.fp] = true; }
      a.pads.forEach((pd, i) => { const v = lit[i] ? i + 8 : i; if (pd.v !== v) { pd.v = v; pd.m.geometry = G.getGeo('fj_pad', v); } }); } };
  // quiz : la question s'affiche, on court sur la dalle de la bonne réponse avant la fin du compte à rebours
  const LET = ['A', 'B', 'C'];
  K.quiz = {
    init(a) { const n = a.g.opts || 3; a.qp = []; for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 3.6, x = a.cx + off, z = a.cz - 3.2, gy = a.map.topAt(x, z), v = a.g.padV ? a.g.padV[i] : i, m = mk('fj_pad', v, false); m.position.set(x, gy + .02, z); const s = sprite('…', 2.8, .7); s.position.set(x, gy + 1.5, z); a.qp.push({ x, z, m, s, v }); a.st.push(m); a.sp.push(s); }
      a.board = sprite('', 7, 1.2, { W: 1024, H: 176, fs: 70 }); a.board.position.set(a.cx, a.g0 + 3.8, a.cz - 4.4); a.sp.push(a.board); a.qi = -1; if (a.g.bank) { const R = G.rng(a.seed + 3); a.perm = a.g.bank.map((q, i) => i); for (let i = a.perm.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a.perm[i], a.perm[j]] = [a.perm[j], a.perm[i]]; } } },
    tick(a, dt, el) { const T = 11, qi = Math.floor(el / T), ph = el - qi * T;
      if (qi !== a.qi) { a.qi = qi; a.Q = a.g.ask(G.rng(a.seed + qi * 104729), qi, a); a.done1 = false; setText(a.board, a.Q.big || a.Q.q, { W: 1024, H: 176, fs: 70, col: a.Q.col }); a.qp.forEach((pd, i) => { setText(pd.s, (a.qp.length > 2 ? LET[i] + ' : ' : '') + a.Q.o[i]); pd.m.geometry = G.getGeo('fj_pad', pd.v); }); tone(NOTES[4], .15); }
      if (ph < 8.5) a.msg = '❓ ' + esc(a.Q.q) + ' — ' + Math.ceil(8.5 - ph) + ' s';
      else if (!a.done1) { a.done1 = true; const on = padUnder(a.qp, 1.3), ok = on === a.Q.c; a.qp[a.Q.c].m.geometry = G.getGeo('fj_pad', a.qp[a.Q.c].v + 8);
        if (ok) { a.score += 10; G.sfx('coin'); G.popup('+10 ✔', G.player.x, G.player.y + 2, G.player.z, 'gold'); push(); } else G.sfx('error'); a.res = (ok ? '✔ Bonne réponse ! ' : '✘ C\'était : ') + esc(a.Q.o[a.Q.c]); }
      if (ph >= 8.5) a.msg = a.res; } };
  // duel : on se lance des boules au lance-pierre
  K.duel = {
    init(a) { a.seen = 0; },
    tick(a, dt, el) { const q = a.pt[0]; if (!q) { a.msg = 'En attente de ton ami… (il faut être deux)'; return; } const th = Array.isArray(q.g.got) ? q.g.got.length : 0;
      if (th > a.seen) { a.seen = th; const p = G.player; G.fx.burst(p.x, p.y + 1, p.z, 22, a.g.splash, 4, .8, 3); G.sfx('splash'); G.cam.shake(.15); G.popup('Touché·e !', p.x, p.y + 2.2, p.z, ''); }
      a.msg = '🎯 Vise ' + esc(q.n) + ' avec F, et bouge pour esquiver !'; },
    targets: a => a.pt.map(q => ({ x: q.pr.x, y: q.pr.y + .3, z: q.pr.z })),
    hit(a, x, y, z) { for (const q of a.pt) if (Math.hypot(q.pr.x - x, q.pr.y + .9 - y, q.pr.z - z) < .95) { a.got.push(a.got.length + 1); a.score += 10; G.fx.burst(x, y, z, 22, a.g.splash, 4, .8, 3); G.sfx('splash'); G.popup('+10', x, y + 1, z, 'gold'); push(); return true; } return false; } };
  // 1, 2, 3… soleil ! : avancer vers le gardien quand il ne regarde pas
  K.statue = {
    start: (a, i) => ({ x: a.cx + (i ? 1.6 : -1.6), z: a.cz + 8 }),
    init(a) { const D = G.VILLAGERS[a.seed % G.VILLAGERS.length]; a.gd = G.makeChar({ n: D.n, pitch: D.pitch, sp: D.sp, col: D.col, shirt: D.shirt || D.acc }); const gz = a.cz - 9; a.gd.root.position.set(a.cx, a.map.topAt(a.cx, gz), gz); G.scene.add(a.gd.root); a.gz = gz;
      const R = G.rng(a.seed + 11); a.cyc = []; for (let t = 0; t < a.dur;) { const gr = 2.2 + R() * 2.6; a.cyc.push([t, t + gr, t + gr + .5, t + gr + .5 + 2.2]); t += gr + 2.7; } a.lp = null; a.prog = 0; },
    end(a) { G.scene.remove(a.gd.root); },
    tick(a, dt, el) { const p = G.player, c = a.cyc.find(c => el < c[3]) || a.cyc[a.cyc.length - 1], ph = el < c[1] ? 0 : el < c[2] ? 1 : 2;
      a.gd.root.rotation.y += ((ph === 2 ? 0 : Math.PI) - a.gd.root.rotation.y) * Math.min(1, dt * 10);
      if (ph === 1 && a.ph !== 1) tone(NOTES[7], .3, 'square', .05);
      const sp = a.lp ? Math.hypot(p.x - a.lp.x, p.z - a.lp.z) / Math.max(dt, .001) : 0; a.lp = { x: p.x, z: p.z };
      if (ph === 2 && el - c[2] > .35 && sp > .9) { G.sfx('error'); G.popup('👀 Vu·e !', p.x, p.y + 2, p.z, ''); const s = K.statue.start(a, a.me); p.x = s.x; p.z = s.z; p.y = a.map.topAt(s.x, s.z); p.vx = p.vz = 0; a.lp = null; }
      a.ph = ph; a.prog = Math.max(a.prog, Math.round((a.cz + 8 - p.z) * 5)); a.score = Math.max(a.score, a.prog);
      if (Math.hypot(p.x - a.cx, p.z - a.gz) < 1.7) { a.score = 100 + Math.max(0, Math.ceil(a.dur - el)) * 3; G.sfx('fanfare'); a.done = 'all'; push(); }
      a.msg = ph === 0 ? '🟢 Avance !' : ph === 1 ? '🟠 Soleil…' : '🔴 Ne bouge plus !'; } };
  // chaud ou froid : un trésor invisible, le même pour tout le monde
  K.hot = {
    init(a) { a.spark = mk('star', 1); a.st.push(a.spark); },
    tick(a, dt, el) { const idx = a.U.size, s = spot(a, idx, { salt: 9, R: a.g.R2 || 15, min: 4 }), p = G.player, d = Math.hypot(p.x - s.x, p.z - s.z);
      if (a.lastIdx !== idx) { if (a.lastIdx != null && !a.got.includes(a.lastIdx)) G.ui.toast('💎 Trouvé par ton ami ! Nouveau trésor…'); a.lastIdx = idx; }
      a.spark.visible = d < 3; a.spark.position.set(s.x, s.g + .5 + Math.sin(el * 3) * .1, s.z); a.spark.rotation.y += dt * 3;
      if (d < 1.15) { a.got.push(idx); a.score += 50; G.sfx('fanfare'); G.fx.burst(s.x, s.g + .5, s.z, 30, [0xffd23f, 0xffffff, 0x9fdcff], 4, .9, 5); G.popup('+50 💎', s.x, s.g + 1.5, s.z, 'gold'); push(); }
      a.msg = d < 2 ? '🔥🔥 Brûlant !' : d < 4 ? '🔥 Chaud' : d < 7 ? '🌤 Tiède' : d < 11 ? '❄️ Froid' : '🧊 Glacé'; } };
  // tir de précision : la cible au sol ou le panier qui bouge ; on vise avec son orientation
  K.aim = {
    init(a) { a.tg = mk(a.g.model, 0, false); a.st.push(a.tg); },
    tick(a, dt, el) { if (a.g.hoop) { a.tx = a.cx + Math.sin(el * .8) * 4; a.ty = a.g0 + 3; a.tz = a.cz - 7; } else { a.tx = a.cx; a.tz = a.cz - 8; a.ty = a.map.topAt(a.tx, a.tz); } a.tg.position.set(a.tx, a.ty, a.tz); a.msg = a.g.tip; },
    targets(a) { const p = G.player, [fx, fz] = p.facing(), dx = a.tx - p.x, dz = a.tz - p.z, d = Math.hypot(dx, dz) || 1, cr = (fx * dz - fz * dx) / d; return [{ x: a.tx - dz / d * cr * d * .9, y: a.ty - (a.g.hoop ? 0 : .8), z: a.tz + dx / d * cr * d * .9 }]; },
    hit(a, x, y, z) { if (a.g.hoop) { if (Math.hypot(x - a.tx, y - a.ty, z - a.tz) < .7) { a.score += 20; a.got.push(a.got.length); G.sfx('coin'); G.fx.burst(a.tx, a.ty, a.tz, 18, [0xff7a2a, 0xffffff], 3, .6, 3); G.popup('+20 🏀', a.tx, a.ty + .6, a.tz, 'gold'); push(); return true; } return false; }
      if (y > a.map.topAt(x, z) + .35) return false; const d = Math.hypot(x - a.tx, z - a.tz); if (d > 3.2) return false; const pts = d < .55 ? 50 : d < 1.3 ? 30 : d < 2.2 ? 15 : 5; a.score += pts; a.got.push(a.got.length); G.sfx(pts >= 30 ? 'coin' : 'pop'); G.fx.burst(x, y + .2, z, 12, [0xffffff, 0xe8434a], 2.5, .5, 3); G.popup('+' + pts, x, y + 1, z, 'gold'); push(); return true; } };
  // récolte au panier : on ramasse (3 au plus) puis on rapporte à son panier
  K.carry = {
    init(a) { a.carry = 0; a.bk = [0, 1].map(i => { const x = a.cx + (i ? 3.5 : -3.5), z = a.cz + 2.5, m = mk('fj_basket', i, false); m.position.set(x, a.map.topAt(x, z), z); a.st.push(m); return { x, z }; }); },
    tick(a, dt, el) { const g = a.g, p = G.player; sync(a, alive(g.spawn, el), a.U, k => makeItem(a, k), (it, age) => moveItem(a, it, age, dt));
      if (a.carry < 3) for (const it of [...a.live.values()]) if (Math.hypot(it.x - p.x, it.y - (p.y + .6), it.z - p.z) < .95) { a.got.push(it.k); kill(it); a.live.delete(it.k); a.carry++; G.sfx('pickup'); push(); if (a.carry >= 3) break; }
      const b = a.bk[a.me]; if (a.carry && Math.hypot(p.x - b.x, p.z - b.z) < 1.3) { a.score += a.carry * 10; G.sfx('coin'); G.popup('+' + a.carry * 10, b.x, a.g0 + 1.5, b.z, 'gold'); G.fx.burst(b.x, a.g0 + .8, b.z, 16, [0xffd23f, 0x4fb35f], 3, .6, 3); a.carry = 0; push(); }
      a.msg = '🧺 ' + a.carry + '/3 — ' + (a.carry >= 3 ? 'Rapporte à ton panier (' + (a.me ? 'droite' : 'gauche') + ') !' : 'Ramasse, puis rapporte à ton panier !'); } };

  // ---------- parcours, zones, trous, questions ----------
  const ringsC = (n, fn) => a => { const out = []; for (let k = 0; k < n; k++) { const c = fn(a, k); if (!okAt(a, c.x, c.z, 2)) { c.x = a.cx + (c.x - a.cx) * .5; c.z = a.cz + (c.z - a.cz) * .5; } const gy = a.map.topAt(c.x, c.z); out.push(Object.assign({ model: 'ring', y: gy + (c.hy != null ? c.hy : 1) }, c, { y: gy + (c.hy != null ? c.hy : 1) })); } return out; };
  const flagsC = (n, fn, model = 'fj_flag', r = 1.4) => a => { const out = []; for (let k = 0; k < n; k++) { const c = fn(a, k); const gy = a.map.topAt(c.x, c.z); out.push({ x: c.x, z: c.z, y: gy + .6, my: gy, model, r }); } return out; };
  const farSpot = (a, k, n, d0, d1) => { const R = G.rng(a.seed + k * 31), an = (k + R() * .6) / n * TAU; for (let d = d1; d >= d0; d -= 1.5) { const x = a.cx + Math.cos(an) * d, z = a.cz + Math.sin(an) * d; if (okAt(a, x, z, 3)) return { x, z }; } return { x: a.cx + Math.cos(an) * d0 * .5, z: a.cz + Math.sin(an) * d0 * .5 }; };
  const ringHoles = (n, r) => a => { const out = []; for (let i = 0; i < n; i++) { const an = i / n * TAU, x = a.cx + Math.cos(an) * r, z = a.cz + Math.sin(an) * r; out.push({ x, z, g: a.map.topAt(x, z), v: i }); } return out; };
  const gridHoles = a => { const out = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const x = a.cx + i * 2.6, z = a.cz + j * 2.6; out.push({ x, z, g: a.map.topAt(x, z) }); } return out; };
  const spotHoles = n => a => { const out = []; for (let i = 0; i < n; i++) { const s = spot(a, i, { salt: 7, min: 2 }); out.push({ x: s.x, z: s.z, g: s.g }); } return out; };
  const shuffle3 = (R, good, bad) => { const o = [good, ...bad], c = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; [c[i], c[j]] = [c[j], c[i]]; } return { o, c: c.indexOf(0) }; };
  const bankAsk = (R, qi, a) => { const B = a.g.bank, q = B[a.perm[qi % B.length]], s = shuffle3(R, q[1], [q[2], q[3]]); return { q: q[0], o: s.o, c: s.c }; };
  const CULTURE = [['Quelle est la capitale de l\'Italie ?', 'Rome', 'Milan', 'Venise'], ['Combien de côtés a un hexagone ?', '6', '5', '8'], ['Quelle planète est la plus proche du Soleil ?', 'Mercure', 'Vénus', 'Mars'], ['Quel est le plus grand océan ?', 'Pacifique', 'Atlantique', 'Indien'], ['Qui a peint la Joconde ?', 'Léonard de Vinci', 'Picasso', 'Van Gogh'], ['Quelle est la capitale de l\'Espagne ?', 'Madrid', 'Barcelone', 'Séville'], ['Combien de minutes dans une heure ?', '60', '100', '30'], ['Quel instrument a 88 touches ?', 'Le piano', 'La guitare', 'Le violon'], ['Quelle couleur donnent le bleu et le jaune ?', 'Vert', 'Violet', 'Orange'], ['Combien de joueurs par équipe sur un terrain de foot ?', '11', '9', '15'], ['Quel est le plus long fleuve de France ?', 'La Loire', 'La Seine', 'Le Rhône'], ['Quelle est la capitale du Japon ?', 'Tokyo', 'Kyoto', 'Osaka'], ['Combien font 12 douzaines ?', '144', '120', '132'], ['Quel métal est liquide à température ambiante ?', 'Le mercure', 'Le fer', 'Le plomb'], ['Combien de cordes a une guitare classique ?', '6', '4', '8'], ['Quel pays a la forme d\'une botte ?', 'Italie', 'Grèce', 'Portugal'], ['Quelle est la capitale du Canada ?', 'Ottawa', 'Toronto', 'Montréal'], ['Quelle langue parle-t-on au Brésil ?', 'Portugais', 'Espagnol', 'Italien'], ['Quel est le plus haut sommet des Alpes ?', 'Le mont Blanc', 'Le Cervin', 'La Meije'], ['Combien de lettres compte l\'alphabet ?', '26', '24', '28'], ['Qui a écrit « Les Misérables » ?', 'Victor Hugo', 'Molière', 'Jules Verne'], ['Quelle est la capitale de l\'Allemagne ?', 'Berlin', 'Munich', 'Hambourg'], ['Combien de planètes compte le système solaire ?', '8', '9', '7'], ['Quel est le symbole chimique de l\'or ?', 'Au', 'Or', 'Ag'], ['Combien de secondes dans une minute ?', '60', '100', '30'], ['Quel est le plus grand pays du monde ?', 'La Russie', 'La Chine', 'Le Canada'], ['Dans quel pays se trouvent les pyramides de Gizeh ?', 'Égypte', 'Mexique', 'Pérou'], ['Combien d\'années dans un siècle ?', '100', '1000', '10']];
  const ANIMAUX = [['Combien de pattes a une araignée ?', '8', '6', '10'], ['Quel est le plus grand animal du monde ?', 'La baleine bleue', 'L\'éléphant', 'La girafe'], ['Que mange surtout le panda ?', 'Du bambou', 'Du poisson', 'Des fruits'], ['Comment s\'appelle le petit de la vache ?', 'Le veau', 'Le poulain', 'L\'agneau'], ['Combien de pattes a un insecte ?', '6', '8', '4'], ['Quel oiseau ne vole pas ?', 'L\'autruche', 'L\'aigle', 'Le moineau'], ['Où vit le poisson-clown ?', 'Dans une anémone', 'Dans un terrier', 'Dans un nid'], ['Quel est l\'animal terrestre le plus rapide ?', 'Le guépard', 'Le lion', 'Le cheval'], ['Comment s\'appelle le petit du cheval ?', 'Le poulain', 'Le chaton', 'Le faon'], ['Quel arbre donne des glands ?', 'Le chêne', 'Le sapin', 'Le bouleau'], ['La chenille devient…', 'Un papillon', 'Une abeille', 'Une libellule'], ['Combien de bosses a un dromadaire ?', '1', '2', '3'], ['Le têtard devient…', 'Une grenouille', 'Un poisson', 'Un lézard'], ['Que fabriquent les abeilles ?', 'Du miel', 'Du lait', 'De la soie'], ['Quel animal porte sa maison sur le dos ?', 'L\'escargot', 'La fourmi', 'La souris'], ['Quel mammifère sait vraiment voler ?', 'La chauve-souris', 'L\'écureuil', 'Le hérisson'], ['Combien de bras a une pieuvre ?', '8', '6', '10'], ['Quelle fleur se tourne vers le soleil ?', 'Le tournesol', 'La rose', 'La tulipe'], ['Où vit le koala ?', 'En Australie', 'En Afrique', 'En Amérique'], ['Quel animal change de couleur ?', 'Le caméléon', 'Le crocodile', 'Le hibou'], ['Que mange la vache ?', 'De l\'herbe', 'De la viande', 'Du poisson'], ['Quel oiseau est le symbole de la France ?', 'Le coq', 'L\'aigle', 'Le pigeon'], ['Comment s\'appelle la maison des abeilles ?', 'La ruche', 'Le terrier', 'La niche'], ['Quel animal hiberne tout l\'hiver ?', 'La marmotte', 'Le renard', 'Le cerf'], ['Les dauphins sont des…', 'Mammifères', 'Poissons', 'Reptiles']];
  const VF = [['Le Soleil est une étoile.', 1], ['Les dauphins sont des poissons.', 0], ['L\'eau gèle à 0 °C.', 1], ['Paris est la capitale de la Belgique.', 0], ['Une araignée a 8 pattes.', 1], ['La Lune produit sa propre lumière.', 0], ['Le chocolat vient de la fève de cacao.', 1], ['Un triangle a 4 côtés.', 0], ['La baleine est un mammifère.', 1], ['Le Mont-Saint-Michel est en Bretagne.', 0], ['La tomate est un fruit.', 1], ['Le Sahara est un désert.', 1], ['Il y a 12 mois dans une année.', 1], ['La Terre tourne autour du Soleil.', 1], ['Les chats ont 9 vies.', 0], ['100 centimètres font un mètre.', 1], ['L\'Everest est le plus haut sommet du monde.', 1], ['Le serpent a des pattes.', 0], ['Le vert est une couleur primaire en peinture.', 0], ['Une heure dure 100 minutes.', 0], ['Le kangourou vit en Australie.', 1], ['Le soleil se lève à l\'ouest.', 0], ['Les pingouins vivent dans le désert.', 0], ['Le cœur est un muscle.', 1]];
  const CNAMES = [['ROUGE', '#e8434a'], ['BLEU', '#3b78d8'], ['VERT', '#3fa34d'], ['JAUNE', '#d9a800'], ['VIOLET', '#9b59d0'], ['ORANGE', '#f08a24'], ['ROSE', '#f06aa8']];
  const ASK = {
    calc: R => { const t = R(); let q, r; if (t < .4) { const x = 5 + Math.floor(R() * 55), y = 5 + Math.floor(R() * 40); q = x + ' + ' + y; r = x + y; } else if (t < .7) { const x = 20 + Math.floor(R() * 70), y = 3 + Math.floor(R() * (x - 3)); q = x + ' − ' + y; r = x - y; } else { const x = 2 + Math.floor(R() * 11), y = 2 + Math.floor(R() * 11); q = x + ' × ' + y; r = x * y; }
      const bad = []; while (bad.length < 2) { const w = r + (R() < .5 ? -1 : 1) * (1 + Math.floor(R() * 10)); if (w >= 0 && w !== r && !bad.includes(w)) bad.push(w); } const s = shuffle3(R, String(r), bad.map(String)); return { q: q + ' = ?', big: q + ' = ?', o: s.o, c: s.c }; },
    vf: (R, qi, a) => { const q = VF[a.perm[qi % VF.length]]; return { q: q[0], o: ['Vrai', 'Faux'], c: q[1] ? 0 : 1 }; },
    stroop: R => { const w = Math.floor(R() * CNAMES.length); let c = Math.floor(R() * CNAMES.length); if (c === w) c = (c + 1 + Math.floor(R() * (CNAMES.length - 1))) % CNAMES.length; let x = Math.floor(R() * CNAMES.length); while (x === w || x === c) x = (x + 1) % CNAMES.length;
      const s = shuffle3(R, CNAMES[c][0], [CNAMES[w][0], CNAMES[x][0]]); return { q: 'De quelle COULEUR est écrit le mot ?', big: CNAMES[w][0], col: CNAMES[c][1], o: s.o, c: s.c }; } };

  // ---------- le catalogue ----------
  const GAMES = [], BY = {};
  const def = (cat, id, n, ico, kind, d, o) => { const g = Object.assign({ id: 'f_' + id, cat, n, ico, kind, desc: d, dur: 60, coin: 10 }, o); GAMES.push(g); BY[g.id] = g; };
  const CATS = { ramasse: '🧺 Ramassage', tir: '🎯 Tir', course: '🏁 Courses', zone: '✨ Zones', esquive: '💫 Esquive', poursuite: '🏃 Poursuites', peinture: '🎨 Peinture', reflexe: '⚡ Réflexes', memoire: '🧠 Mémoire', quiz: '❓ Quiz', duel: '⚔️ Duels', divers: '🎪 Divers' };
  // ramassage
  def('ramasse', 'etoiles', 'Pluie d\'étoiles', '⭐', 'collect', 'Attrape les étoiles, même celles en hauteur (saute !).', { model: 'star', v: R => R() < .15 ? 1 : 0, spawn: { first: 8, every: .9, life: 9 }, hi: .45, gold: .1, coin: 25, tip: '⭐ Attrape les étoiles (saute pour les hautes) !' });
  def('ramasse', 'pieces', 'Ruée vers l\'or', '🪙', 'collect', 'Des pièces partout sur la place : le plus riche gagne.', { model: 'fj_coin', spawn: { first: 12, every: .6, life: 8 }, gold: .12, coin: 20, tip: '🪙 Ramasse un max de pièces !' });
  def('ramasse', 'gemmes', 'Chasse aux gemmes', '💎', 'collect', 'Les gemmes tournent autour de la place.', { model: 'fj_gem', v: R => Math.floor(R() * 8), motion: 'orbit', spawn: { first: 10, every: 1, life: 11 }, gold: .1, hi: .3, coin: 25, tip: '💎 Les gemmes tournent : coupe-leur la route !' });
  def('ramasse', 'coeurs', 'Cœurs volants', '💖', 'collect', 'Des cœurs traversent la place en flottant.', { model: 'fj_heart', v: R => R() < .3 ? 1 : 0, motion: 'drift', spawn: { first: 4, every: .55, life: 8.5 }, vs: [.7, 1.2], coin: 20, tip: '💖 Attrape les cœurs qui passent !' });
  def('ramasse', 'fruits', 'Pluie de fruits', '🍎', 'collect', 'Les fruits tombent du ciel : sois dessous !', { model: 'fj_fruit', v: R => Math.floor(R() * 6), motion: 'fall', spawn: { every: .45, life: 6 }, vs: [1, 1.5], gold: .08, coin: 20, tip: '🍎 Les fruits tombent : attrape-les !' });
  def('ramasse', 'champis', 'Cueillette de champignons', '🍄', 'collect', 'Les champignons poussent un peu partout, vite !', { model: 'fj_mush', v: R => R() < .3 ? 1 : 0, h0: 0, bob: 0, spin: 0, R: 12, spawn: { first: 10, every: .7, life: 7 }, gold: .1, coin: 20, tip: '🍄 Cueille les champignons avant qu\'ils disparaissent !' });
  def('ramasse', 'flocons', 'Flocons magiques', '❄️', 'collect', 'Les flocons descendent doucement en zigzag.', { model: 'fj_flake', motion: 'sky', spawn: { every: .5, life: 11 }, vs: [.9, 1.4], hi: 0, coin: 20, tip: '❄️ Attrape les flocons avant qu\'ils fondent !' });
  def('ramasse', 'bonbons', 'Pluie de bonbons', '🍬', 'collect', 'Ça tombe vite et de partout !', { model: 'fj_candy', v: R => Math.floor(R() * 8), motion: 'fall', spawn: { every: .3, life: 4.5 }, vs: [1.3, 1.8], gold: .06, coin: 15, tip: '🍬 Les bonbons tombent vite !' });
  def('ramasse', 'oeufs', 'Œufs cachés', '🥚', 'collect', 'Les œufs ne se voient que de près : fouille la place !', { model: 'fj_egg', v: R => Math.floor(R() * 5), h0: 0, bob: 0, spin: 0, R: 15, near: 4.5, spawn: { first: 24, firstLife: 1e9 }, gold: .15, coin: 30, tip: '🥚 Les œufs ne se voient que de près !' });
  def('ramasse', 'lucioles', 'Lucioles', '✨', 'collect', 'Les lucioles sautillent partout, attrape-les !', { model: 'fj_bug', motion: 'hop', spawn: { first: 6, every: .7, life: 7 }, coin: 25, tip: '✨ Les lucioles sautillent : attrape-les !' });
  def('ramasse', 'cloches', 'Cloches envolées', '🔔', 'collect', 'Les cloches s\'envolent : attrape-les avant qu\'elles soient trop haut.', { model: 'fj_bell', motion: 'rise', spawn: { every: .6, life: 3.5 }, vs: [.5, .8], gold: .1, coin: 25, tip: '🔔 Vite, avant qu\'elles s\'envolent !' });
  def('ramasse', 'feuilles', 'Feuilles d\'automne', '🍂', 'collect', 'Les feuilles virevoltent jusqu\'au sol.', { model: 'fj_leaf', v: R => Math.floor(R() * 4), motion: 'sky', spawn: { every: .4, life: 10 }, vs: [1, 1.6], coin: 15, tip: '🍂 Attrape les feuilles qui tombent !' });
  def('ramasse', 'bulles_c', 'Bulles de savon', '🫧', 'collect', 'Crève les bulles en les touchant.', { model: 'fj_bubble', motion: 'rise', spawn: { every: .45, life: 4 }, vs: [.35, .6], pick: 1.1, burst: [0xcfefff, 0xffffff], coin: 15, tip: '🫧 Touche les bulles pour les crever !' });
  def('ramasse', 'citrouilles', 'Récolte de citrouilles', '🎃', 'collect', 'Les citrouilles apparaissent et disparaissent.', { model: 'fj_pumpkin', v: R => R() < .15 ? 1 : 0, h0: 0, bob: 0, spin: 0, R: 11, spawn: { first: 6, every: .8, life: 5 }, coin: 20, tip: '🎃 Ramasse les citrouilles !' });
  // tir
  def('tir', 'ballons', 'Tir aux ballons', '🎈', 'shoot', 'Éclate les ballons qui montent (F pour tirer).', { model: 'miniballoon', v: R => Math.floor(R() * 3), goldV: 3, motion: 'rise', spawn: { every: .7, life: 7 }, vs: [1.1, 1.4], gold: .12, gear: 'lance_pierre', coin: 25, spin: 0, burst: [0xe8434a, 0xffd23f, 0x5b8fd6], tip: '🎈 F pour tirer sur les ballons !' });
  def('tir', 'lanternes', 'Lanternes volantes', '🏮', 'shoot', 'Des lanternes s\'élèvent doucement.', { model: 'fj_lantern', v: R => Math.floor(R() * 4), motion: 'rise', spawn: { every: .8, life: 9 }, vs: [.6, .9], gear: 'lance_pierre', coin: 25, tip: '🏮 Touche les lanternes avant qu\'elles s\'envolent !' });
  def('tir', 'pigeons', 'Ball-trap', '🥏', 'shoot', 'Les disques traversent le ciel en cloche.', { model: 'fj_disc', motion: 'arc', spawn: { every: 1.1, life: 3.2 }, gear: 'lance_pierre', hitR: .85, coin: 35, tip: '🥏 Tire sur les disques en plein vol !' });
  def('tir', 'canards', 'Stand des canards', '🦆', 'shoot', 'Les canards défilent sur trois rangées.', { model: 'fj_duck', v: R => R() < .15 ? 1 : 0, motion: 'rail', spawn: { every: .55, life: 7 }, gear: 'lance_pierre', spin: 0, coin: 20, tip: '🦆 Vise les canards qui défilent !' });
  def('tir', 'briques', 'Casse-briques', '🧱', 'shoot', 'Un grand mur de briques à démolir ensemble : les dorées valent triple.', { model: 'fj_brick', motion: 'static', bob: 0, spin: 0, gear: 'lance_pierre', hitR: .55, spawn: { first: 45, firstLife: 1e9 }, layout: (a, k) => { const c = k % 9, r = Math.floor(k / 9), R = G.rng(a.seed + k * 7919); return { x: a.cx + (c - 4) * .84 + (r % 2 ? .2 : 0), z: a.cz - 7, y: a.g0 + .3 + r * .42, g: a.g0, R }; }, v: (R, k) => Math.floor(k / 9), gold: .12, goldV: 8, coin: 15, tip: '🧱 Démolis le mur brique par brique !' });
  def('tir', 'boites', 'Chamboule-tout', '🥫', 'shoot', 'Trois pyramides de boîtes sur des caisses.', { model: 'fj_can', v: (R, k) => k % 8, motion: 'static', bob: 0, spin: 0, gear: 'lance_pierre', hitR: .45, spawn: { first: 18, firstLife: 1e9 }, layout: (a, k) => { const p = Math.floor(k / 6), i = k % 6, row = i < 3 ? 0 : i < 5 ? 1 : 2, col = row === 0 ? i : row === 1 ? i - 3 : 0, an = -Math.PI / 2 + (p - 1) * .6, bx = a.cx + Math.cos(an) * 7, bz = a.cz + Math.sin(an) * 7; return { x: bx + (col - (2 - row) / 2) * .34, z: bz, y: a.g0 + .7 + row * .35, g: a.g0 }; }, decor: a => [0, 1, 2].map(p => { const an = -Math.PI / 2 + (p - 1) * .6, m = mk('fj_crate', 0); m.position.set(a.cx + Math.cos(an) * 7, a.g0, a.cz + Math.sin(an) * 7); return m; }), coin: 20, tip: '🥫 Fais tomber toutes les boîtes !' });
  def('tir', 'bouteilles', 'Bouteilles sur le muret', '🍾', 'shoot', 'Une rangée de bouteilles sur un muret.', { model: 'fj_bottle', v: R => Math.floor(R() * 3), motion: 'static', bob: 0, spin: 0, gear: 'lance_pierre', hitR: .45, spawn: { first: 16, firstLife: 1e9 }, layout: (a, k) => ({ x: a.cx - 4.5 + (k % 16) * .6, z: a.cz - 7, y: a.g0 + 1, g: a.g0 }), decor: a => { const m = mk('fj_wall', 0); m.position.set(a.cx, a.g0, a.cz - 7); return [m]; }, coin: 20, tip: '🍾 Fais tomber les bouteilles !' });
  def('tir', 'bulles', 'Tir aux bulles', '🔵', 'shoot', 'Les bulles tournent en cercle autour de la place.', { model: 'fj_bubble', motion: 'orbit', spawn: { first: 8, every: .8, life: 10 }, hi: .5, gear: 'lance_pierre', hitR: .8, burst: [0xcfefff, 0xffffff], coin: 20, tip: '🔵 Les bulles tournent : anticipe !' });
  def('tir', 'pinatas', 'Piñatas', '🪅', 'shoot', 'Des piñatas se balancent en hauteur.', { model: 'fj_pinata', v: R => Math.floor(R() * 8), motion: 'swing', spawn: { first: 3, every: 2, life: 9 }, gear: 'lance_pierre', hitR: .85, pts: 3, coin: 15, tip: '🪅 Tire sur les piñatas qui se balancent !' });
  def('tir', 'etoiles_f', 'Étoiles filantes', '🌠', 'shoot', 'Des étoiles traversent le ciel à toute vitesse.', { model: 'star', v: R => R() < .2 ? 1 : 0, motion: 'arc', spawn: { every: .9, life: 2.6 }, gear: 'lance_pierre', hitR: .85, gold: .15, coin: 35, tip: '🌠 Touche les étoiles filantes !' });
  // courses
  def('course', 'anneaux', 'Course d\'anneaux', '⭕', 'race', 'Passe dans les anneaux dans l\'ordre, le plus vite possible.', { dur: 70, coin: 5, course: ringsC(10, (a, k) => { const an = k / 10 * TAU, r = 6 + (k % 3) * 3; return { x: a.cx + Math.cos(an) * r, z: a.cz + Math.sin(an) * r, hy: k % 3 === 2 ? 1.9 : 1, ry: an + Math.PI / 2 }; }), tip: '⭕ Passe dans l\'anneau vert' });
  def('course', 'slalom', 'Slalom', '🚩', 'race', 'Contourne les fanions en zigzag, aller-retour.', { dur: 60, coin: 5, course: flagsC(16, (a, k) => { const R = G.rng(a.seed), an = R() * TAU, i = k < 8 ? k : 15 - k, t = -12 + i * 3.4, off = (i % 2 ? 2.6 : -2.6) * (k < 8 ? 1 : -1); return { x: a.cx + Math.cos(an) * t - Math.sin(an) * off, z: a.cz + Math.sin(an) * t + Math.cos(an) * off }; }), tip: '🚩 Touche le fanion vert' });
  def('course', 'tour', 'Tour du village', '🗺️', 'race', 'Huit balises tout autour du village : la grande course !', { dur: 150, coin: 4, course: flagsC(8, (a, k) => farSpot(a, k, 8, 14, 34), 'fj_beacon', 2.2), tip: '🗺️ Cours à la balise verte (regarde la carte !)' });
  def('course', 'spirale', 'La spirale', '🌀', 'race', 'Des anneaux en spirale qui se resserrent.', { dur: 60, coin: 5, course: ringsC(14, (a, k) => { const an = k * .75, r = 12 - k * .72; return { x: a.cx + Math.cos(an) * r, z: a.cz + Math.sin(an) * r, hy: k % 2 ? 1.6 : 1, ry: an + Math.PI / 2 }; }), tip: '🌀 Suis la spirale' });
  def('course', 'celeste', 'Anneaux célestes', '🪐', 'race', 'Des anneaux en hauteur : il faut sauter pour passer.', { dur: 70, coin: 6, course: ringsC(10, (a, k) => { const s = spot(a, k, { salt: 13, R: 11, min: 3 }); return { x: s.x, z: s.z, hy: 1.7 + (k % 2) * .25, ry: s.ang }; }), tip: '🪐 Saute dans l\'anneau vert' });
  def('course', 'relais', 'Course de relais', '🏃', 'race', 'Une balise, retour au centre, une autre balise…', { dur: 90, coin: 5, course: flagsC(8, (a, k) => k % 2 ? { x: a.cx, z: a.cz } : farSpot(a, k, 8, 10, 17), 'fj_beacon', 1.8), tip: '🏃 Balise verte, puis retour au centre' });
  // zones
  def('zone', 'roi', 'Roi de la colline', '👑', 'zone', 'Le cercle saute d\'un endroit à l\'autre : on ne marque que seul dedans.', { mode: 'alone', zone: (a, el) => { const s = spot(a, Math.floor(el / 6), { salt: 3, R: a.R - 2 }); return [{ x: s.x, z: s.z, r: 2.2 }]; }, coin: 2 });
  def('zone', 'projecteur', 'Sous le projecteur', '🔦', 'zone', 'Suis le rond de lumière qui se balade.', { mode: 'in', zone: (a, el) => { const R = G.rng(a.seed + 4), p1 = R() * TAU, p2 = R() * TAU; return [{ x: a.cx + Math.sin(el * .45 + p1) * a.R * .65, z: a.cz + Math.sin(el * .33 + p2) * a.R * .65, r: 2 }]; }, coin: 2 });
  def('zone', 'retrecit', 'Le cercle qui rétrécit', '🎯', 'zone', 'Le cercle devient de plus en plus petit…', { mode: 'alone', zone: (a, el) => [{ x: a.cx + Math.sin(el * .15) * 3, z: a.cz + Math.cos(el * .11) * 3, r: Math.max(.9, 5.5 - 4.6 * el / a.dur) }], zc: 0, coin: 2 });
  def('zone', 'soleil', 'Rayons de soleil', '🌞', 'zone', 'Trois cercles, un seul s\'allume à la fois.', { mode: 'in', zones: 3, zone: (a, el) => { const lit = Math.floor(G.rng(a.seed + 31 * Math.floor(el / 2.6))() * 3); return [0, 1, 2].map(i => { const s = spot(a, i, { salt: 5, R: a.R - 1, min: 3 }); return { x: s.x, z: s.z, r: 1.8, on: i === lit }; }); }, coin: 2 });
  def('zone', 'nuage', 'Fuis le nuage', '🌧️', 'zone', 'Un nuage de pluie te poursuit : reste au sec sur la place.', { mode: 'out', cloud: 1, zc: 1, zone: (a, el) => [{ x: a.cx + Math.sin(el * .7) * a.R * .6, z: a.cz + Math.sin(el * .53 + 1) * a.R * .6, r: 3 }], coin: 2 });
  // esquive
  def('esquive', 'meteores', 'Pluie de météores', '☄️', 'dodge', 'Des météores tombent là où le sol devient rouge.', { haz: [{ t: 'rain', model: 'fj_meteor', every: .45 }], coin: 2, tip: '☄️ Évite les ronds rouges !' });
  def('esquive', 'cocos', 'Noix de coco', '🥥', 'dodge', 'Ça tombe des cocotiers… de plus en plus vite.', { haz: [{ t: 'rain', model: 'fj_coco', every: .3, r: .9, burst: [0x7a5236, 0xffffff] }], coin: 2, tip: '🥥 Attention à ta tête !' });
  def('esquive', 'avalanche', 'Avalanche', '☃️', 'dodge', 'Des boules de neige géantes roulent : saute par-dessus !', { haz: [{ t: 'roll', model: 'fj_snow', every: .9, sp: 6, rad: .32 }], coin: 2, tip: '☃️ Saute par-dessus les boules !' });
  def('esquive', 'tonneaux', 'Tonneaux fous', '🛢️', 'dodge', 'Des tonneaux dévalent la place de tous les côtés.', { haz: [{ t: 'roll', model: 'fj_barrel', every: 1.1, sp: 5, rad: .42 }], coin: 2, tip: '🛢️ Saute ou écarte-toi !' });
  def('esquive', 'corde', 'Corde à sauter', '🪢', 'dodge', 'La barre tourne de plus en plus vite : saute au bon moment.', { haz: [{ t: 'beam', w0: 1.3, acc: .02, dir: 1 }], coin: 2, tip: '🪢 Saute quand la barre arrive !' });
  def('esquive', 'double', 'Double corde', '➰', 'dodge', 'Deux barres qui tournent en sens inverse !', { haz: [{ t: 'beam', w0: 1.1, acc: .012, dir: 1 }, { t: 'beam', w0: .9, acc: .01, dir: -1, ph: Math.PI, v: 1 }], coin: 2, tip: '➰ Deux barres : regarde bien !' });
  def('esquive', 'ondes', 'Ondes de choc', '🌊', 'dodge', 'Des anneaux d\'énergie partent du centre : saute au-dessus.', { haz: [{ t: 'wave', every: 2.2, sp: 4 }], coin: 2, tip: '🌊 Saute au-dessus des ondes !' });
  def('esquive', 'tempete', 'La tempête', '🌪️', 'dodge', 'Météores ET tonneaux en même temps !', { haz: [{ t: 'rain', model: 'fj_meteor', every: .7 }, { t: 'roll', model: 'fj_barrel', every: 1.6, sp: 5, rad: .42 }], coin: 3, tip: '🌪️ Survis à la tempête !' });
  def('esquive', 'grele', 'Grêle et ondes', '🌨️', 'dodge', 'Boules de neige du ciel et ondes au sol.', { haz: [{ t: 'rain', model: 'fj_snow', every: .55, r: .9, burst: [0xffffff, 0xdff4ff] }, { t: 'wave', every: 3, sp: 3.5 }], coin: 3, tip: '🌨️ Regarde en l\'air ET par terre !' });
  // poursuites (à deux)
  def('poursuite', 'chat', 'Chat perché', '🐱', 'tag', 'Le chat doit toucher l\'autre. On marque quand on n\'est PAS le chat.', { two: 1, mode: 'chat', model: 'fj_gem', mv: 0, coin: 2 });
  def('poursuite', 'patate', 'Patate chaude', '💣', 'tag', 'Passe la bombe en touchant l\'autre avant qu\'elle explose !', { two: 1, mode: 'bomb', model: 'fj_bomb', coin: 3 });
  def('poursuite', 'couronne', 'La couronne', '👑', 'tag', 'Garde la couronne le plus longtemps : un contact et elle change de tête.', { two: 1, mode: 'keep', model: 'fj_crown', coin: 2 });
  def('poursuite', 'drapeau', 'Le drapeau', '🚩', 'tag', 'Celui qui a le drapeau marque. Touche-le pour le voler !', { two: 1, mode: 'keep', model: 'fj_flag', mv: 1, coin: 2 });
  // peinture
  def('peinture', 'peinture', 'Bataille de peinture', '🎨', 'paint', 'Chaque case où tu marches prend ta couleur.', { R: 7, model: 'fj_tile', cols: [0, 1], coin: 6, tip: '🎨 Marche partout pour peindre !' });
  def('peinture', 'dalles', 'Dalles lumineuses', '💡', 'paint', 'Allume le plus de dalles possible.', { R: 7, model: 'fj_tile', cols: [11, 14], coin: 6, tip: '💡 Allume les dalles en marchant dessus' });
  def('peinture', 'jardin', 'Jardin express', '🌷', 'paint', 'Des fleurs poussent sous tes pas.', { R: 7, model: 'fj_flower', cols: [7, 4], coin: 6, tip: '🌷 Fais pousser ton jardin !' });
  // réflexes
  def('reflexe', 'taupes', 'Tape-taupes', '🐹', 'whack', 'Les taupes sortent des trous : cours dessus la première !', { holes: gridHoles, holeModel: 'fj_hole', model: 'fj_mole', spawn: { every: .85, life: 1.9 }, gold: .12, pop: 1, coin: 6, tip: '🐹 Cours sur la taupe avant l\'autre !' });
  def('reflexe', 'grenouilles', 'Grenouilles sauteuses', '🐸', 'whack', 'Les grenouilles surgissent autour du bassin.', { holes: ringHoles(10, 4.5), holeModel: 'fj_hole', model: 'fj_frog', spawn: { every: .75, life: 1.8 }, gold: .12, pop: 1, coin: 6, tip: '🐸 Attrape les grenouilles !' });
  def('reflexe', 'fantomes', 'Chasse aux fantômes', '👻', 'whack', 'Les fantômes apparaissent n\'importe où sur la place.', { holes: spotHoles(14), model: 'fj_ghost', float: 1, spawn: { every: .9, life: 2.6 }, coin: 6, tip: '👻 Touche les fantômes !' });
  def('reflexe', 'poules', 'Attrape les poules', '🐔', 'whack', 'Les poules s\'échappent en courant : rattrape-les !', { holes: spotHoles(10), model: 'fj_hen', roam: 1, spawn: { every: 1, life: 5 }, gold: .1, pick: 1.1, coin: 6, tip: '🐔 Rattrape les poules !' });
  def('reflexe', 'chaises', 'Chaises musicales', '🪑', 'whack', 'Quand la musique s\'arrête, une chaise apparaît : sois le premier !', { holes: spotHoles(12), model: 'fj_chair', music: 1, spawn: { every: 6, life: 2.6 }, pts: 50, pick: 1.1, coin: 2, tip: '🎵 Quand la musique s\'arrête : à la chaise !' });
  def('reflexe', 'reflexe', 'Dalles réflexe', '⚡', 'whack', 'Une dalle s\'allume : le premier dessus marque.', { holes: ringHoles(8, 4), holeModel: 'fj_pad', model: 'fj_pad', spawn: { every: 1, life: 1.4 }, pts: 10, pop: 1, coin: 6, tip: '⚡ Saute sur la dalle allumée !' });
  // mémoire
  def('memoire', 'simon', 'Simon 4 couleurs', '🟥', 'simon', 'Les dalles s\'allument : refais l\'ordre en marchant dessus.', { n: 4, dur: 90, coin: 4 });
  def('memoire', 'simon6', 'Simon 6 couleurs', '🌈', 'simon', 'La même chose… avec six dalles !', { n: 6, dur: 90, coin: 5 });
  def('memoire', 'melodie', 'La mélodie', '🎵', 'simon', 'Retiens la mélodie et rejoue-la avec tes pieds.', { n: 5, slow: 1, dur: 90, coin: 4 });
  // quiz
  def('quiz', 'calcul', 'Calcul mental', '🧮', 'quiz', 'Cours sur la dalle de la bonne réponse.', { dur: 66, ask: ASK.calc, coin: 15 });
  def('quiz', 'culture', 'Quiz culture', '📚', 'quiz', 'Questions de culture générale.', { dur: 66, bank: CULTURE, ask: bankAsk, coin: 15 });
  def('quiz', 'animaux', 'Quiz nature', '🦊', 'quiz', 'Animaux, plantes et nature.', { dur: 66, bank: ANIMAUX, ask: bankAsk, coin: 15 });
  def('quiz', 'vraifaux', 'Vrai ou faux', '✅', 'quiz', 'Vrai à gauche, faux à droite !', { dur: 66, opts: 2, padV: [2, 0], bank: VF, ask: ASK.vf, coin: 15 });
  def('quiz', 'couleurs', 'Couleurs piégées', '🖍️', 'quiz', 'Donne la couleur de l\'encre, pas le mot écrit !', { dur: 66, ask: ASK.stroop, coin: 15 });
  // duels (à deux)
  def('duel', 'neige', 'Bataille de boules de neige', '⛄', 'duel', 'Vise l\'autre au lance-pierre, esquive ses tirs !', { two: 1, gear: 'lance_pierre', splash: [0xffffff, 0xdff4ff], coin: 8 });
  def('duel', 'eau', 'Ballons d\'eau', '💦', 'duel', 'Arrose l\'autre avant d\'être trempé !', { two: 1, gear: 'lance_pierre', splash: [0x5b8fd6, 0x9fdcff, 0xffffff], coin: 8 });
  // divers
  def('divers', 'statues', '1, 2, 3… Soleil !', '🗿', 'statue', 'Avance quand le gardien ne regarde pas, fige-toi quand il se retourne.', { dur: 90, coin: 4 });
  def('divers', 'chaudfroid', 'Chaud ou froid', '🔥', 'hot', 'Un trésor invisible : suis les indices « chaud / froid ».', { dur: 90, R2: 15, coin: 4 });
  def('divers', 'cible', 'Tir sur cible', '🎯', 'aim', 'Vise le centre de la cible au sol : tourne-toi bien face à elle.', { gear: 'lance_pierre', model: 'fj_target', coin: 4, tip: '🎯 Bien en face de la cible, puis F !' });
  def('divers', 'panier', 'Panier mobile', '🏀', 'aim', 'Le panier se déplace : vise-le au lance-pierre.', { gear: 'lance_pierre', model: 'fj_hoop', hoop: 1, coin: 6, tip: '🏀 Vise le panier qui bouge !' });
  def('divers', 'recolte', 'Récolte au panier', '🧺', 'carry', 'Ramasse 3 fruits au plus, puis rapporte-les à ton panier.', { model: 'fj_fruit', v: R => Math.floor(R() * 6), h0: .35, spin: 0, R: 11, spawn: { first: 8, every: .8, life: 12 }, coin: 8 });
  def('divers', 'oeufs_p', 'Chasse aux œufs de Pâques', '🐣', 'carry', 'Des œufs partout : rapporte-les à ton nid-panier.', { model: 'fj_egg', v: R => Math.floor(R() * 5), h0: 0, bob: 0, spin: 0, R: 12, spawn: { first: 14, every: 1.2, life: 15 }, coin: 8 });
  P.GAMES = GAMES;

  // ---------- partie : démarrer, partager, finir ----------
  const hudEl = () => { let el = $('mini'); if (!el) { el = document.createElement('div'); el.id = 'mini'; el.className = 'card'; el.style.cssText = 'position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);font-family:var(--f-display);font-size:20px;display:flex;gap:16px;align-items:center;padding:8px 20px;z-index:12'; $('hud').appendChild(el); } el.style.flexWrap = 'wrap'; el.style.justifyContent = 'center'; el.style.maxWidth = 'min(92vw,720px)'; return el; };
  const push = () => { const a = P.a, net = NET(); if (!a || !net || !net.setGame) return; a.pushT = .5; a.pushed = Math.floor(a.score); net.setGame({ id: a.id, seed: a.seed, t0: a.t0, dur: a.dur, host: a.host, hn: a.hn, open: true, got: a.got.slice(-300), sc: Math.floor(a.score) }); };
  const partners = () => { const a = P.a, out = [], net = NET(); if (!a || !net || !net.online()) return out; for (const p of net.peersHere()) { const g = p.pr.g; if (g && g.id === a.id && g.seed === a.seed) out.push({ n: p.pr.n || 'Ami', g, pr: p.pr }); } return out; };
  function placeAt(a, x, z) { const p = G.player; if (p.vehicle) return; if (p.sit) G.act.standUp(); for (let r = 0; r < 6; r += .5) for (let t = 0; t < 8; t++) { const xx = x + Math.cos(t / 8 * TAU) * r, zz = z + Math.sin(t / 8 * TAU) * r; if (okAt(a, xx, zz, .6)) { p.x = xx; p.z = zz; p.y = a.map.topAt(xx, zz); p.vx = p.vz = p.vy = 0; p.yaw = Math.atan2(a.cx - xx, a.cz - zz); G.fx.puff(xx, p.y + .1, zz, 10, 0xffffff, .7); return; } } }
  P.start = (id, o = {}) => {
    const g = BY[id]; if (!g) return;
    if (P.a || (G.games2 && G.games2.a) || (G.mini && G.mini.active)) return G.ui.toast('Une partie est déjà en cours !');
    const m = G.map; if (!m || m.interior) return G.ui.toast('Les jeux se jouent dehors, sur la place !');
    const peers = here(); if (g.two && !o.joined && !peers.length) return G.ui.toast('👥 Il faut être deux pour « ' + g.n + ' » : invite un ami !');
    const c = center(m), seed = o.seed || (1 + Math.floor(Math.random() * 1e9));
    const a = P.a = { g, id, map: m, seed, t0: o.t0 || Date.now() + 3500, dur: g.dur, host: o.host || myId(), hn: o.hostName || G.playerName, me: o.joined ? 1 : 0, score: 0, got: [], live: new Map(), st: [], sp: [], cx: c.x, cz: c.z, R: g.R || 9, g0: m.topAt(c.x, c.z), np: o.joined ? 1 : 0, pushT: 0, pushed: 0, pt: [], U: new Set() };
    try { if (K[g.kind].init) K[g.kind].init(a); if (g.decor) a.st.push(...g.decor(a)); } catch (e) { console.error(e); }
    const s = K[g.kind].start ? K[g.kind].start(a, a.me) : { x: a.cx + (a.me ? 2.4 : -2.4), z: a.cz + 3.4 }; placeAt(a, s.x, s.z);
    if (g.gear) G.gear.give(g.gear);
    G.ui.dirtyHot(); G.sfx('fanfare'); G.ui.toast(o.joined ? '👥 ' + a.hn + ' a lancé « ' + g.n + ' » : tu joues aussi !' : (peers.length ? '👥 ' : '') + g.ico + ' ' + g.n + ' : prêts ?', 4000);
    push();
  };
  P.end = (why, quiet) => {
    const a = P.a; if (!a) return; P.a = null; const pt = a.pt || [];
    for (const it of a.live.values()) kill(it); for (const m of a.st) rm(m); for (const s of a.sp) unsprite(s); try { if (K[a.g.kind].end) K[a.g.kind].end(a); } catch (e) { }
    const el = $('mini'); if (el) el.hidden = true; G.gear.drop(); G.ui.dirtyHot();
    const net = NET(), sc = Math.floor(a.score); if (net && net.setGame) { net.setGame({ id: a.id, seed: a.seed, t0: a.t0, dur: a.dur, host: a.host, hn: a.hn, open: false, got: a.got.slice(-300), sc }); setTimeout(() => { if (!P.a && net.game && net.game.seed === a.seed) net.setGame(null); }, 9000); }
    if (quiet) return; if (why === 'left') return G.ui.toast('Tu as quitté la place : « ' + a.g.n + ' » est fini pour toi.');
    const rec = P.best[a.id] || 0, nb = sc > rec; if (nb) P.best[a.id] = sc; const coins = sc * a.g.coin;
    const lines = [(why === 'all' ? 'Bravo, c\'est fini ! ' : 'Temps écoulé ! ') + 'Ton score : ' + sc + '.'];
    if (pt.length) { const best = Math.max(...pt.map(q => q.g.sc | 0)); lines.push('Scores : toi ' + sc + ' · ' + pt.map(q => q.n + ' ' + (q.g.sc | 0)).join(' · ') + (sc > best ? ' — tu gagnes ! 🏆' : sc < best ? ' — la revanche ?' : ' — égalité !')); }
    lines.push((nb ? 'NOUVEAU RECORD ! ' : '') + (coins ? 'Tu gagnes ' + coins.toLocaleString('fr-FR') + ' clochettes !' : 'Retente ta chance !'));
    if (coins) { G.coins += coins; G.ui.dirtyHud(); } G.sfx(coins ? 'fanfare' : 'catch');
    const v = G.ents.villagers.find(x => x.npc === 'jeux' && x.map === a.map); G.ui.dialog(v ? v.D.n : 'Filou', lines, { pitch: 1.25, color: '#e8a23a' });
  };
  G.on('update', dt => {
    const a = P.a; if (!a) return autoJoin();
    if (G.map !== a.map || G.state !== 'play') return P.end('left');
    const el = (Date.now() - a.t0) / 1000, left = a.dur - el; a.pt = partners(); a.U = new Set(a.got); for (const q of a.pt) if (Array.isArray(q.g.got)) for (const i of q.g.got) a.U.add(i);
    if (a.pt.length > a.np) { G.ui.toast('👥 ' + a.pt.map(q => q.n).join(', ') + ' joue avec toi !'); G.sfx('pop'); } a.np = Math.max(a.np, a.pt.length);
    if (el < 0) { const n = Math.ceil(-el); if (a.cd !== n) { a.cd = n; tone(n > 1 ? 440 : 660, .18, 'square', .05); } a.msg = a.g.desc; return hud(a, el, '⏳ ' + n); }
    if (!a.go) { a.go = true; tone(880, .4, 'square', .06); G.ui.toast(a.g.ico + ' Partez !'); }
    try { K[a.g.kind].tick(a, dt, el); } catch (e) { console.error(e); return P.end('time'); }
    if ((a.pushT -= dt) < 0 && Math.floor(a.score) !== a.pushed) push();
    hud(a, el);
    if (left <= 0 || a.done) P.end(a.done || 'time');
  });
  function hud(a, el, big) { const e = hudEl(); e.hidden = false; const sc = a.pt.map(q => esc(q.n) + ' ' + (q.g.sc | 0)).join(' · ');
    e.innerHTML = '<span>' + a.g.ico + ' ' + esc(a.g.n) + '</span><b>' + (big || '⏱ ' + Math.max(0, Math.ceil(a.dur - el)) + ' s') + '</b><b>⭐ ' + Math.floor(a.score) + '</b>' + (sc ? '<span style="font-size:15px">👥 ' + sc + '</span>' : '') + (a.msg ? '<div style="flex-basis:100%;text-align:center;font-size:15px;opacity:.85;margin-top:-6px">' + a.msg + '</div>' : ''); }
  // ---------- quand un ami lance un jeu : on y entre tout de suite ----------
  function autoJoin() { const net = NET(); if (!net || !net.online() || G.state !== 'play' || (G.games2 && G.games2.a) || (G.mini && G.mini.active) || !G.map || G.map.interior) return;
    for (const p of net.peersHere()) { const g = p.pr.g; if (!g || !g.open || !BY[g.id] || g.host !== p.pr.home || P.invited[g.seed] || Date.now() - g.t0 > (BY[g.id].dur - 6) * 1000) continue;
      if (!G.ui.canPlay()) return; P.invited[g.seed] = 1; G.sfx('pop'); P.start(g.id, { seed: g.seed, t0: g.t0, host: g.host, hostName: p.pr.n || 'Ton ami', joined: true }); return; } }
  G.on('newGame', () => P.end('x', true)); G.on('load', () => P.end('x', true));
  // le lance-pierre vise et touche aussi les cibles de la fête
  const otg = G.mini.targets; G.mini.targets = () => { const a = P.a; if (a && a.go && K[a.g.kind].targets) return K[a.g.kind].targets(a); return otg(); };
  const ohit = G.mini.hit; G.mini.hit = (x, y, z) => { const a = P.a; if (a && a.go && K[a.g.kind].hit) return K[a.g.kind].hit(a, x, y, z); return ohit(x, y, z); };

  // ---------- le menu : la salle des jeux ----------
  const css = document.createElement('style'); css.textContent = `#fete{position:fixed;inset:0;z-index:60;background:rgba(40,30,20,.45);display:flex;align-items:center;justify-content:center;padding:12px}
#fete .fbox{background:#fff8e6;border-radius:24px;box-shadow:0 6px 0 #e3cfa3,0 18px 40px rgba(0,0,0,.3);width:min(980px,100%);max-height:calc(100vh - 24px);display:flex;flex-direction:column;overflow:hidden;font-family:var(--f-display)}
#fete header{padding:14px 18px 6px;display:flex;align-items:center;gap:10px}#fete h2{margin:0;font-size:24px;flex:1;color:#5a3d22}#fete .x{border:none;background:#f3e6c4;border-radius:12px;font-size:20px;width:40px;height:40px}
#fete .who{padding:0 18px 8px;font-family:var(--f-body);color:#7a5a3a;font-size:14px}#fete .cats{display:flex;gap:6px;flex-wrap:wrap;padding:0 18px 10px}
#fete .cats button{border:none;border-radius:999px;padding:6px 12px;background:#f3e6c4;color:#5a3d22;font-size:14px}#fete .cats button.on{background:#e8a23a;color:#fff}
#fete .grid{overflow:auto;padding:4px 18px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
#fete .card2{border:none;text-align:left;background:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 3px 0 #ead9b4;display:block;min-height:136px;position:relative;font-family:var(--f-display)}#fete .card2>*{display:block;margin-top:3px}#fete .card2 small{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
#fete .card2:hover{transform:translateY(-2px);box-shadow:0 5px 0 #e8a23a}#fete .card2 .i{font-size:28px}#fete .card2 b{font-size:16px;color:#4a3320}#fete .card2 small{font-family:var(--f-body);font-size:12px;color:#7a6a55;line-height:1.25}
#fete .card2 .two{position:absolute;top:8px;right:10px;font-size:12px;background:#ffe2a8;border-radius:8px;padding:2px 6px}#fete .card2[data-off]{opacity:.45}#fete .card2{cursor:pointer}
@media (max-width:520px){#fete .grid{grid-template-columns:repeat(2,1fr);padding:4px 10px 12px}#fete header,#fete .who,#fete .cats{padding-left:10px;padding-right:10px}#fete h2{font-size:19px}}`; document.head.appendChild(css);
  let cat = 'tous';
  P.menu = () => { if (P.a) return G.ui.toast('Une partie est déjà en cours !'); const el = document.createElement('div'); el.id = 'fete'; document.body.appendChild(el); G.ui.modal = 'fete';
    const peers = here(), names = peers.map(p => esc(p.pr.n || 'ton ami')).join(', ');
    const close = () => { el.remove(); if (G.ui.modal === 'fete') G.ui.modal = null; document.removeEventListener('keydown', key, true); }, key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', key, true);
    const draw = () => { el.innerHTML = '<div class="fbox"><header><h2>🎪 La fête à deux — ' + GAMES.length + ' jeux</h2><button class="x" aria-label="Fermer">✕</button></header><div class="who">' + (peers.length ? '👥 Avec ' + names + ' : quand tu lances un jeu, tout le monde ici entre dans la partie et arrive sur la place.' : '🙂 Personne d\'autre ici pour l\'instant : tu joues seul·e (les jeux 👥 demandent un ami).') + '</div>'
      + '<div class="cats">' + [['tous', 'Tous']].concat(Object.entries(CATS)).map(([k, n]) => '<button data-c="' + k + '" class="' + (k === cat ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div class="grid">'
      + GAMES.filter(g => cat === 'tous' || g.cat === cat).map(g => '<div class="card2" role="button" tabindex="0" data-g="' + g.id + '"' + (g.two && !peers.length ? ' data-off="1"' : '') + '><span class="i">' + g.ico + '</span><b>' + esc(g.n) + '</b><small>' + esc(g.desc) + '</small>' + (g.two ? '<span class="two">👥 à deux</span>' : '') + '</div>').join('') + '</div></div>';
      el.querySelector('.x').onclick = close; el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; draw(); G.sfx('ui'); });
      el.querySelectorAll('[data-g]').forEach(b => { b.onclick = () => { if (b.dataset.off) return G.ui.toast('👥 Il faut être deux pour ce jeu : invite un ami !'); close(); P.start(b.dataset.g); }; b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.onclick(); } }; }); };
    el.onclick = e => { if (e.target === el) close(); }; draw(); G.sfx('open'); };
})();
