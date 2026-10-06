'use strict';
// ===== Maison qui grandit : pièces à gauche et à droite, étage (maison à étage), puis château ! =====
(function () {
  const MD = G.MODELS, O = G.OBJ, TAU = Math.PI * 2, WIN = 0xfff0c2, P = (...a) => G.prism(...a);
  const ROOFS = [0xd9544d, 0x4a7fd1, 0xf08bb0, 0x55a85a, 0xf29a3a, 0x8d6fd1];
  // ---------- extérieurs ----------
  MD.house2 = v => { const b = G.mb(220 + v), roof = ROOFS[v % ROOFS.length], o = G.facade(b, { w: 3, floors: 2, wall: [0xfaf1dc, 0xf2f2ea, 0xfff4f6, 0xf3f7e8][v % 4], base: 0xe8dcc8, trim: 0xffffff, roof: 'pignon', roofCol: roof, shutters: roof, flowers: 1, balcony: 1, chimney: 1, oeil: 1 });
    b.box(.78, 1.36, .06, 0xf7f5ee, 0, .86, o.fz + .02); b.box(.66, 1.26, .08, 0x85552f, 0, .81, o.fz + .03); b.sph(.04, 0xffd23f, .2, .8, o.fz + .09); b.box(1.0, .07, .5, 0xd9d2c2, 0, .05, o.fz + .28);
    for (const x of [-.95, .95]) { b.box(.5, .6, .06, WIN, x, 1.08, o.fz + .03, 0, 0, 0, 1); b.box(.6, .7, .05, 0xffffff, x, 1.08, o.fz + .02); for (const s of [-1, 1]) b.box(.16, .62, .04, roof, x + s * .36, 1.08, o.fz + .04); }
    b.jit(.12); b.ico(.26, 1, 0x4fa847, -1.32, .26, o.fz + .55, 1, .8, 1); b.ico(.24, 1, 0x58b54a, 1.32, .24, o.fz + .55, 1, .8, 1); b.jit(0); return b.done(); };
  MD.chateau = v => { const b = G.mb(230 + v), S1 = 0xd9d2c2, S2 = 0xc4bcae, roof = ROOFS[v % ROOFS.length];
    b.box(3.1, .2, 2.7, 0xb9a58a, 0, .1, -.05);
    b.jit(.06); b.box(2.5, 3.3, 2.0, S1, 0, 1.85, -.25); for (let i = 0; i < 6; i++) b.box(.3, .32, .3, S2, -1.05 + i * .42, 3.66, .7); for (let i = 0; i < 5; i++) b.box(.3, .32, .3, S2, -1.05 + i * .52, 3.66, -1.2); b.jit(0);
    for (const s of [-1, 1]) { b.cyl(.58, .62, 4.3, 14, S1, s * 1.3, 2.25, .55); b.cyl(.66, .66, .16, 14, S2, s * 1.3, 4.45, .55); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.box(.18, .26, .18, S2, s * 1.3 + Math.cos(a) * .58, 4.65, .55 + Math.sin(a) * .58, 0, -a, 0); }
      b.cone(.72, 1.5, 14, roof, s * 1.3, 5.45, .55); b.cyl(.015, .015, .6, 4, 0x6b4426, s * 1.3, 6.5, .55); b.box(.32, .2, .02, roof, s * 1.3 + .17, 6.68, .55);
      for (const y of [1.6, 2.8]) { b.box(.2, .42, .06, WIN, s * 1.3, y, 1.15, 0, 0, 0, 1); b.add(new THREE.CylinderGeometry(.1, .1, .06, 10, 1, false, -Math.PI / 2, Math.PI), WIN, b.M(s * 1.3, y + .21, 1.15, -Math.PI / 2, 0, 0), 1); } }
    b.box(.95, 1.5, .12, 0x6b4426, 0, .95, .76); b.add(new THREE.CylinderGeometry(.475, .475, .12, 16, 1, false, -Math.PI / 2, Math.PI), 0x6b4426, b.M(0, 1.7, .76, -Math.PI / 2, 0, 0)); b.add(new THREE.TorusGeometry(.52, .07, 5, 18, Math.PI), S2, b.M(0, 1.7, .8), 0, true);
    for (const s of [-1, 1]) { b.box(.07, 1.5, .14, S2, s * .55, .95, .8); b.sph(.05, 0xffd23f, s * .14, 1.0, .84); }
    for (const x of [-.6, .6]) { b.box(.36, .62, .06, WIN, x, 2.6, .76, 0, 0, 0, 1); b.add(new THREE.CylinderGeometry(.18, .18, .06, 10, 1, false, -Math.PI / 2, Math.PI), WIN, b.M(x, 2.91, .76, -Math.PI / 2, 0, 0), 1); }
    b.box(.5, .9, .03, roof, 0, 2.55, .77); b.cone(.25, .3, 3, roof, 0, 1.98, .77, Math.PI, Math.PI / 6, 0); b.sph(.1, 0xffd23f, 0, 2.7, .79);
    b.cyl(.015, .015, 1.1, 4, 0x6b4426, 0, 4.4, -.25); b.box(.5, .3, .02, 0xffd23f, .26, 4.82, -.25);
    return b.done(); };
  MD.porte_int = v => { const b = G.mb(240); b.box(1.0, 2.15, .12, 0xf7f5ee, 0, 1.07, -.44); b.box(.82, 1.95, .14, 0x85552f, 0, .98, -.43); b.sph(.045, 0xffd23f, .28, .95, -.35); b.box(.95, .03, .5, 0xc9a26b, 0, .015, -.15); return b.done(); };
  MD.escalier = v => { const b = G.mb(241);
    if (v === 1) { b.box(1.9, .03, .9, 0x2a1a12, 0, .015, -.02); for (let i = 0; i < 4; i++) b.box(.42, .035, .82, 0x8a5a34, -.68 + i * .45, .025, -.02); b.box(1.98, .06, .06, 0x6b4426, 0, .82, .44); for (let k = 0; k < 7; k++) b.box(.05, .82, .05, 0x6b4426, -.96 + k * .32, .41, .44); return b.done(); }
    for (let i = 0; i < 6; i++) b.box(.32, .3 * (i + 1), .86, i % 2 ? 0xc08850 : 0xb07a48, -.8 + i * .32, .15 * (i + 1), -.04);
    for (let k = 0; k < 6; k++) b.box(.05, .7, .05, 0x6b4426, -.8 + k * .32, .3 * (k + 1) + .35, .4); b.box(2.0, .06, .06, 0x6b4426, -.05, 1.38, .4, 0, 0, .74);
    return b.done(); };
  MD.trone = v => { const b = G.mb(242); b.box(.8, .5, .7, 0xc0283a, 0, .25, 0); b.box(.86, .08, .76, 0xd9b84a, 0, .52, 0); b.box(.8, 1.3, .14, 0xc0283a, 0, 1.0, -.3); b.box(.86, .08, .2, 0xd9b84a, 0, 1.66, -.3); for (const s of [-1, 1]) { b.box(.1, .45, .6, 0xd9b84a, s * .42, .72, 0); b.sph(.07, 0xd9b84a, s * .42, 1.75, -.3); } b.sph(.09, 0xd9b84a, 0, 1.8, -.3); return b.done(); };
  const obj = (id, n, model, p) => O[id] = Object.assign({ id, n, model, v: 0, fp: [1, 1], h: 0 }, p);
  obj('maison_etage', 'Maison à étage', 'house2', { h: 4.6, fp: [3, 3], enter: 'maison', take: 0 });
  obj('chateau', 'Château', 'chateau', { h: 5.4, fp: [3, 3], enter: 'maison', take: 0 });
  obj('porte_int', 'Porte', 'porte_int', { h: 0, walk: 1, portal: 1, enter: 'portal', fixed: 1 });
  obj('escalier', 'Escalier', 'escalier', { h: 0, walk: 1, portal: 1, enter: 'portal', fixed: 1, fp: [2, 1] });
  obj('trone', 'Trône', 'trone', { h: .55, sit: 1, take: 1, cat: 'mobilier' });
  G.ITEMS.trone = { id: 'trone', n: 'Trône', kind: 'place', obj: 'trone', cat: 'mobilier', thumb: 'obj:trone', sell: 2500, buy: 20000, stack: 9 };
  // ---------- pièces reliées ----------
  const homeObj = () => G.world && [...G.world.list].find(o => o.iid === G.homeId());
  const mainRoom = () => { const id = G.homeId(); return G.interiors[id] || (G.interiors[id] = (() => { const m = G.makeInterior('maison', id); m.group.visible = false; G.scene.add(m.group); return m; })()); };
  function clearAt(m, x, z, w = 1, d = 1) { for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) { const o = m.objAt(xx, zz); if (o && o.t !== 'paillasson') m.removeObj(o); } }
  function addRoom(kind) { // kind : g (gauche), d (droite), h (étage)
    const main = mainRoom(), id = main.id + '_' + kind; if (G.interiors[id]) return G.interiors[id];
    const W = kind === 'h' ? main.W : 8, H = kind === 'h' ? main.H : 7, room = G.makeInterior('maison', id, { W, H, noMat: true, empty: true, wallPat: main.meta.shell.wall, floorPat: main.meta.shell.floor });
    room.meta.title = kind === 'h' ? 'Étage' : kind === 'g' ? 'Pièce de gauche' : 'Pièce de droite'; room.meta.fromId = 'world'; room.meta.door = main.meta.door;
    if (kind === 'h') { clearAt(main, 0, 0, 2, 1); main.addObj('escalier', 0, 0, 0, { iid: id, v: 0 }); room.addObj('escalier', 0, 0, 0, { iid: main.id, v: 1 }); }
    else { const z = Math.floor(main.H / 2), x = kind === 'g' ? 0 : main.W - 1; clearAt(main, x, z); main.addObj('porte_int', x, z, kind === 'g' ? 1 : 3, { iid: id }); const bx = kind === 'g' ? W - 1 : 0, bz = Math.floor(H / 2); room.addObj('porte_int', bx, bz, kind === 'g' ? 3 : 1, { iid: main.id }); }
    if (room.canPlace('lampe', W - 2, 0)) room.addObj('lampe', W - 2, 0); room.group.visible = false; G.scene.add(room.group); G.interiors[id] = room; return room;
  }
  // passer d'une pièce à l'autre : E devant une porte ou l'escalier
  const oint = G.act.interact; G.act.interact = () => {
    const p = G.player, m = G.map; if (m && m.interior && !p.act && !p.sit && !G.ents.villagerInFront(p)) { const [tx, tz] = p.target(); let o = m.objAt(tx, tz); const here = m.objAt(Math.floor(p.x), Math.floor(p.z)); if (!(o && G.OBJ[o.t].portal) && here && G.OBJ[here.t].portal) o = here;
      if (o && G.OBJ[o.t].portal && o.iid) { const to = G.interiors[o.iid] || (G.net && G.net.visit && G.net.visit.interiors[o.iid]); if (!to) return G.ui.toast('Cette porte est fermée.');
        const back = [...to.list].find(q => G.OBJ[q.t].portal && q.iid === m.id), F = back ? G.FR[back.r] : [0, 1]; let x = to.W / 2, z = to.H / 2;
        if (back) { const [cx, cz] = to.center(back); x = cx + F[0] * (back.t === 'escalier' ? 0 : 1.1); z = cz + F[1] * 1.15; }
        G.sfx('door'); G.ui.fade(() => G.enterMap(to, x, z, Math.atan2(F[0], F[1]))); return; } }
    return oint();
  };
  // ---------- l'extérieur suit les travaux ----------
  function setExterior(t) { const o = homeObj(); if (!o || o.t === t) return; const m = G.world, ex = { iid: o.iid, v: o.v || 0 }, x = o.x, z = o.z, r = o.r; m.removeObj(o); m.addObj(t, x, z, r, ex); const [cx, cz] = m.center({ t, x, z, r }); G.fx.puff(cx, 1, cz, 30, 0xf3ead2, 1.2); }
  // ---------- l'agence (et la mairie) : toutes les étapes ----------
  const say = (v, l, c) => G.npcSay(v, l, c), surv = () => G.mode === 'survie';
  G.homeUpgrade = v => {
    const main = mainRoom(), st = main.meta.stage || 1, ext = main.meta.ext = main.meta.ext || {};
    let step = null;
    if (st < G.HOME_STAGES.length) { const [w, h] = G.HOME_STAGES[st]; step = { txt: 'agrandir la pièce principale à ' + w + '×' + h + ' cases', cost: G.HOME_COST[st], go: () => { G.expandHome(); return 'Travaux terminés ! Ta pièce principale mesure maintenant ' + w + '×' + h + '.'; } }; }
    else if (!ext.g) step = { txt: 'ajouter une pièce à gauche (une porte dans le mur de gauche)', cost: 120000, go: () => { addRoom('g'); ext.g = 1; return 'Une nouvelle pièce t\'attend derrière la porte de gauche !'; } };
    else if (!ext.d) step = { txt: 'ajouter une pièce à droite', cost: 150000, go: () => { addRoom('d'); ext.d = 1; return 'Et voilà une pièce de plus, à droite !'; } };
    else if (!ext.h) step = { txt: 'construire un ÉTAGE (ta maison devient une maison à étage)', cost: 200000, go: () => { addRoom('h'); ext.h = 1; setExterior('maison_etage'); return 'Ta maison a maintenant un étage ! Prends l\'escalier dans le coin.'; } };
    else if (!ext.castle) step = { txt: 'transformer ta maison en CHÂTEAU 🏰', cost: 350000, go: () => { ext.castle = 1; setExterior('chateau'); G.decorRoom(main, 'wall', 'briques'); G.decorRoom(main, 'floor', 'moquette'); const tx = Math.floor(main.W / 2) - 1; if (main.canPlace('trone', tx + 1, 1)) main.addObj('trone', tx + 1, 1); return 'Votre Majesté ! Ta maison est devenue un CHÂTEAU, avec un trône rien que pour toi !'; } };
    if (!step) return say(v, ['Tu possèdes déjà le plus beau château du pays ! Je n\'ai plus rien à construire… à part peut-être un jardin ? Les clôtures se posent comme tu veux !']);
    const cost = surv() ? step.cost : 0;
    return say(v, ['Prochaine étape : ' + step.txt + (cost ? ', pour ' + cost.toLocaleString('fr-FR') + ' clochettes.' : ', gratuitement en mode Créatif.'), 'On signe ?'], ['Oui !', 'Plus tard']).then(k => { if (k !== 0) return;
      if (cost && G.coins < cost) return say(v, ['Il te manque ' + (cost - G.coins).toLocaleString('fr-FR') + ' clochettes… Reviens quand tu les auras !']);
      if (cost) { G.coins -= cost; G.ui.dirtyHud(); G.sfx('coin'); } const msg = step.go(); G.sfx('fanfare'); G.saveGame(true); return say(v, [msg]); });
  };
  const oag = G.npcRoles.agence; G.npcRoles.agence = v => say(v, ['Bonjour ' + G.playerName + ' ! Léon, de l\'Agence Nid Douillet. On parle de ta maison ?'], ['Agrandir ma maison', 'Repeindre la façade', 'Au revoir']).then(k => { if (k === 0) return G.homeUpgrade(v); if (k === 1 && oag) { return repaint(v); } });
  function repaint(v) { const o = homeObj(); if (!o) return say(v, ['Je ne trouve pas ta maison sur le plan !']);
    const styles = o.t === 'maison' && G.HOUSE_STYLES; return say(v, [(styles ? 'Quel style pour ta maison ?' : 'Quelle couleur de toit ?') + (surv() ? ' C\'est 2 000 clochettes.' : '')], styles ? G.HOUSE_STYLES.map(x => x.n) : ['Rouge', 'Bleu', 'Rose', 'Vert', 'Orange', 'Violet']).then(c => { if (c < 0) return; if (surv() && G.coins < 2000) return say(v, ['Il te manque quelques clochettes…']); if (surv()) { G.coins -= 2000; G.ui.dirtyHud(); } o.v = c; G.world.refresh(o); G.sfx('craft'); return say(v, ['C\'est fait ! Superbe !']); }); }
  G.on('init', () => { const ont = G.npcTalk; G.npcTalk = v => { if (v.npc === 'mairie') return say(v, ['Bonjour ' + G.playerName + ' ! Bienvenue à la mairie de ' + G.villageName + '. Je peux t\'aider ?'], ['Agrandir ma maison', 'Nouvelles du village', 'Au revoir']).then(k => { if (k === 0) return G.homeUpgrade(v); if (k === 1) { const d = Object.keys(G.dex.donated).length; return say(v, ['Nous sommes le jour ' + G.clock.day + ' à ' + G.villageName + '.', 'Le musée expose ' + d + ' pièce' + (d > 1 ? 's' : '') + '. La rue commerçante est au nord, derrière la gare !']); } }); return ont(v); }; });
})();
