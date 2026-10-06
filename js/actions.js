'use strict';
// ===== Actions du joueur : outils, poser/retirer, terrain, pêche, s'asseoir, entrer, dormir, manger =====
(function () {
  const T = G.TIER;
  const A = G.act = { lastKey: '', cd: 0 };
  const P = () => G.player, Mp = () => G.map;
  const surv = () => G.mode === 'survie';
  function give(id, n = 1, x, y, z) {
    const it = G.ITEMS[id]; if (!it) return;
    if (surv()) { const left = G.inv.add(id, n); if (left > 0) G.ui.toast('Inventaire plein ! ' + it.n + ' perdu·e.'); }
    const p = P(); G.popup('+' + n + ' ' + (it.ico || '') + ' ' + it.n, x != null ? x : p.x, (y != null ? y : p.y) + 1.4, z != null ? z : p.z, 'green');
  }
  A.give = give;
  const dom = () => { const [fx, fz] = P().facing(); return Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz)]; };
  A.anchor = (d, r, tx, tz) => { const [w, dd] = G.fpDims(d, r), [dx, dz] = dom(); let ax = tx - Math.floor((w - 1) / 2), az = tz - Math.floor((dd - 1) / 2); if (dz > 0) az = tz; if (dz < 0) az = tz - dd + 1; if (dx > 0) ax = tx; if (dx < 0) ax = tx - w + 1; return [ax, az]; };
  function swing(fn, dur = .42) { const p = P(); p.act = { kind: 'swing', t: 0, dur, hitAt: .55, fn, done: false }; G.sfx('swing', .6); }

  A.update = dt => {
    const p = P(), I = G.input; if (!p) return;
    if (p.act) { p.act.t += dt; if (!p.act.done && p.act.t >= p.act.dur * (p.act.hitAt || .5)) { p.act.done = true; p.act.fn && p.act.fn(); } if (p.act && p.act.t >= p.act.dur) p.act = null; }
    if (p.fish) A.fishUpdate(dt);
    if (p.inv > 0) p.inv -= dt;
    A.cd -= dt;
    if (!G.ui.canPlay() || p.dead) return;
    for (let k = 0; k < 10; k++) if (I.hit('Digit' + ((k + 1) % 10)) || I.hit('Numpad' + ((k + 1) % 10))) A.select(k);
    if (I.mouse.cwheel) A.select((G.sel + I.mouse.cwheel + 10) % 10);
    if (I.gp.on) { if (I.gpHit(4)) A.select((G.sel + 9) % 10); if (I.gpHit(5)) A.select((G.sel + 1) % 10); }
    if (I.hit('KeyF') || I.mouse.pl || I.gpHit(2)) { A.lastKey = ''; A.use(); }
    else if (I.down('KeyF') || I.mouse.l) A.hold();
    if (I.hit('KeyE') || I.gpHit(1)) A.interact();
    if (I.hit('KeyX') || I.mouse.rclick) A.take();
    if (I.ch('r')) { G.placeRot = (G.placeRot + 1) % 4; G.ui.toast('Rotation : ' + ['face', 'droite', 'dos', 'gauche'][G.placeRot]); G.sfx('ui'); }
    if (I.ch('u')) p.unstick(true);
    if (I.ch('g') && G.ui.openEmotes) G.ui.openEmotes();
  };
  A.select = k => { if (k === G.sel) return; G.sel = k; G.ui.dirtyHot(); G.ui.showHeld(); G.sfx('ui'); if (P().fish) A.stopFish(); };
  A.hold = () => {
    const it = G.inv.held(); if (!it || !['place', 'surf', 'terra'].includes(it.kind) || A.cd > 0 || P().act) return;
    const [tx, tz] = P().target(), key = tx + ',' + tz; if (key === A.lastKey) return; A.use();
  };
  A.use = () => {
    const p = P(); if (p.dead) return; if (p.sit) return A.standUp(); if (p.fish) return A.reel(); if (p.act || p.charging || p.vault || p.vehicle || p.show) return;
    if (p.swim) { G.ui.toast('Impossible en nageant ! Sors de l\'eau d\'abord.'); return; }
    if (p.emote) p.emote = null;
    const it = G.inv.held(), [tx, tz] = p.target(); A.lastKey = tx + ',' + tz; A.cd = .12;
    if (!it) return;
    if (it.kind === 'tool') return A.tool(it.tool, tx, tz);
    if (it.food) return A.eat(it);
    if (it.kind === 'place') return A.placeObj(it, tx, tz);
    if (it.kind === 'surf') return A.paint(it, tx, tz);
    if (it.kind === 'terra') return A.terra(it.terra, tx, tz);
    if (it.id === 'cadeau' || it.id === 'sac_pieces') { G.inv.useHeld(1); A.openGift(it.id); }
  };
  // ---------- outils ----------
  A.tool = (t, tx, tz) => {
    const m = Mp(), p = P(), [fx, fz] = p.facing();
    if (t === 'rod') return A.cast();
    if (t === 'pole') return G.feat.vault();
    if (t === 'sling') { p.act = { kind: 'swing', t: 0, dur: .3, hitAt: .4, fn: () => G.ents.shoot(p) }; return; }
    swing(() => {
      const o = m.objAt(tx, tz), d = o && G.OBJ[o.t];
      if (t === 'axe') { if (d && d.chop && !o.falling) A.chop(o); else if (d) { G.anim.shake(m, o, .2); G.sfx('chop', .5); } }
      else if (t === 'pick') { if (d && d.mine) A.mine(o); else if (d) G.sfx('mine', .4); }
      else if (t === 'shovel') A.dig(tx, tz, o);
      else if (t === 'net') { const b = G.ents.bugNear(p.x + fx * .9, p.y + .6, p.z + fz * .9, 1.25); if (b) G.ents.catchBug(b); }
      else if (t === 'can') { const c = [tx + .5, m.topAt(tx + .5, tz + .5), tz + .5]; G.fx.burst(c[0], c[1] + .5, c[2], 14, [0x9fd9ff, 0xffffff], 1.5, .6, 8); G.sfx('water'); if (d && d.water) { o.wt = G.clock.day; if (o.t === 'pousse') o.g = (o.g || 0) + .5; G.fx.burst(c[0], c[1] + .4, c[2], 8, [0xfff27a], 1, .8, -1); } }
      else if (t === 'sword') { G.ents.hitSlimes(p.x + fx * .9, p.z + fz * .9, 1.3, 2, fx, fz); if (d && (o.t === 'mauvaise_herbe' || o.t === 'buisson')) { if (o.t === 'mauvaise_herbe') { m.removeObj(o); give('herbe', 1, tx + .5, o.y, tz + .5); } else A.chop(o); } }
    });
  };
  A.chop = o => {
    const m = Mp(), d = G.OBJ[o.t], [cx, cz] = m.center(o), p = P(); o.hp = (o.hp || d.chop) - 1;
    G.sfx('chop'); G.fx.burst(cx, o.y + .9, cz, 9, [0xd9b382, 0x8a5a3b, 0xf1d6a8], 3, .5, 9); G.cam.shake(.08);
    if (o.hp > 0) { G.anim.shake(m, o, .35); return; }
    if (d.chop >= 3) {
      const [fx, fz] = p.facing(); G.sfx('crack');
      G.anim.fallTree(m, o, fx, fz, () => {
        const f = d.fruit ? o.f : 0; m.removeObj(o); m.addObj('souche', o.x, o.z);
        if (surv()) { give('bois', 3 + (Math.random() < .35 ? 1 : 0), cx, o.y, cz); if (f) give(d.fruit, f, cx, o.y + .4, cz); }
      });
    } else { m.removeObj(o); G.fx.puff(cx, o.y + .4, cz, 10, 0x58b54a, .7); G.sfx('leaves'); if (d.drop && surv()) give(d.drop, 2, cx, o.y, cz); if (o.t === 'buisson_baies' && o.f && surv()) give('baies', o.f, cx, o.y, cz); }
  };
  A.mine = o => {
    const m = Mp(), d = G.OBJ[o.t], [cx, cz] = m.center(o); o.hp = (o.hp || d.mine) - 1;
    G.sfx('mine'); G.fx.burst(cx, o.y + .5, cz, 10, [0xfff27a, 0xb3b0a8, 0x8a877f], 3.5, .4, 10); G.anim.shake(m, o, .15); G.cam.shake(.05);
    if (surv()) { const q = Math.random(); give(q < .06 ? 'or' : q < .32 ? 'fer' : 'pierre', 1, cx, o.y, cz); }
    if (o.hp <= 0) { m.removeObj(o); G.fx.puff(cx, o.y + .4, cz, 12, 0xb3b0a8, .8); G.sfx('thud'); (m.meta.respawn = m.meta.respawn || []).push({ t: o.t, x: o.x, z: o.z, day: G.clock.day + 1 }); }
  };
  A.dig = (tx, tz, o) => {
    const m = Mp(), d = o && G.OBJ[o.t], c = [tx + .5, m.topAt(tx + .5, tz + .5), tz + .5];
    const dirt = () => { G.sfx('dig'); G.fx.burst(c[0], c[1] + .2, c[2], 10, [0x8a6440, 0xb08a5c], 2.5, .5, 10); };
    if (o) {
      if (o.t === 'trou') { m.removeObj(o); dirt(); return; }
      if (o.t === 'fissure') { m.removeObj(o); dirt(); G.sfx('fanfare'); if (Math.random() < .7) { give('fossile', 1, c[0], c[1], c[2]); G.feat.showOff('fossile'); G.ui.toast('Tu as déterré un fossile ! 🦴 Fais-le identifier au musée.'); } else { A.coins(400 + Math.floor(Math.random() * 600), c); } return; }
      if (d.dig) { m.removeObj(o); dirt(); if (surv()) give(d.dig, 1, c[0], c[1], c[2]); return; }
      if (d.pick && !d.take && o.t !== 'cadeau') { m.removeObj(o); dirt(); if (surv()) give(d.pick, 1, c[0], c[1], c[2]); return; }
      G.ui.toast('Impossible de creuser ici.'); G.sfx('error'); return;
    }
    if (!m.inb(tx, tz) || m.isWaterT(tx, tz) || m.ramp[m.idx(tx, tz)] || G.SURF[m.surf[m.idx(tx, tz)]].path && m.surf[m.idx(tx, tz)] !== 2) { G.ui.toast('Le sol est trop dur ici.'); G.sfx('error'); return; }
    if (m.interior) { G.ui.toast('Pas dans la maison !'); return; }
    m.addObj('trou', tx, tz); dirt();
  };
  A.coins = (n, c) => { G.coins += n; G.sfx('coin'); const p = P(); G.popup('+' + n + ' 🔔', c ? c[0] : p.x, (c ? c[1] : p.y) + 1.3, c ? c[2] : p.z, 'gold'); G.ui.dirtyHud(); };
  A.openGift = id => {
    if (id === 'sac_pieces') return A.coins(100 + Math.floor(Math.random() * 400));
    const pool = Object.values(G.ITEMS).filter(i => i.kind === 'place' && i.cat === 'mobilier'); const g = G.pick(pool);
    G.sfx('fanfare'); give(g.id, 1); G.ui.toast('Dans le cadeau : ' + g.n + ' !'); if (Math.random() < .5) A.coins(100 + Math.floor(Math.random() * 300));
  };
  // ---------- pêche ----------
  A.cast = () => {
    const p = P(), m = Mp(), [fx, fz] = p.facing(); let spot = null;
    for (const d of [1.6, 2.4, 3.2, 1.1]) { const x = p.x + fx * d, z = p.z + fz * d; if (m.isWaterAt(x, z)) { spot = [x, z]; break; } }
    if (!spot) { G.ui.toast("Mets-toi face à l'eau pour pêcher."); G.sfx('error'); return; }
    const tx = Math.floor(spot[0]), tz = Math.floor(spot[1]), wt = m.water[m.idx(tx, tz)];
    let kind = wt === 2 ? 'sea' : 'river'; const L = m.meta.layout; if (L && wt === 1) { const ax = Math.floor((tx - G.BORDER) / G.ACRE), az = Math.floor((tz - G.BORDER) / G.ACRE); const id = L[az] && L[az][ax]; if (id === 'etang' || id === 'lac') kind = 'pond'; }
    p.fish = { phase: 'wait', x: spot[0], z: spot[1], y: m.waterSurf(tx, tz), t: 0, bite: 1.6 + Math.random() * 4, kind };
    G.sfx('cast'); G.ents.showBobber(true);
  };
  A.fishUpdate = dt => G.feat.fishTick(P().fish, dt);
  A.reel = () => G.feat.reel();
  A.stopFish = () => { const p = P(); if (p && p.fish && p.fish.fish && p.fish.fish.st !== 'flee') p.fish.fish.st = 'swim'; if (p) p.fish = null; G.ents.showBobber(false); };
  // ---------- manger ----------
  A.eat = it => {
    const p = P();
    if (surv()) { if (p.food >= 10 && p.hp >= 10) { G.ui.toast("Tu n'as pas faim."); return; } G.inv.useHeld(1); p.food = Math.min(10, p.food + it.food); p.hp = Math.min(10, p.hp + Math.ceil(it.food / 2)); G.ui.dirtyHud(); }
    p.act = { kind: 'eat', t: 0, dur: .6, hitAt: .9, fn: null, done: false }; G.sfx('eat');
    G.fx.burst(p.x, p.y + .8, p.z, 6, [0xffe0b0, 0xe8c090], 1.2, .4, 6); G.popup('Miam ! ' + it.ico, p.x, p.y + 1.5, p.z, 'gold');
  };
  // ---------- poser / peindre / terrain ----------
  A.placeObj = (it, tx, tz) => {
    const m = Mp(), d = G.OBJ[it.obj], r = G.placeRot, [ax, az] = A.anchor(d, r, tx, tz);
    if (m.interior && (d.enter || d.chop >= 3 || d.onWater)) { G.ui.toast("Ça ne rentre pas dans la maison !"); G.sfx('error'); return; }
    if (!m.canPlace(it.obj, ax, az, r) || A.occupiedByMe(d, r, ax, az)) { G.ui.toast(d.onWater ? 'Un pont se pose sur l\'eau.' : 'Pas de place ici.'); G.sfx('error'); return; }
    if (!G.inv.useHeld(1)) return;
    const ex = {}; if (d.enter) ex.iid = 'h' + Date.now().toString(36); if (d.fruit || d.pickFruit) ex.f = 3; if (it.obj === 'pousse') ex.g = 0;
    const o = m.addObj(it.obj, ax, az, r, ex); const [cx, cz] = m.center(o);
    G.sfx('place'); G.fx.puff(cx, o.y + .1, cz, 6, 0xf3ead2, .6); P().act = { kind: 'place', t: 0, dur: .25, hitAt: 1, done: true };
    if (o.t === 'pousse' || d.chop >= 3) G.anim.grow(m, o);
  };
  A.occupiedByMe = (d, r, ax, az) => { const p = P(), [w, dd] = G.fpDims(d, r); if (d.walk) return false; return p.x + .25 > ax && p.x - .25 < ax + w && p.z + .25 > az && p.z - .25 < az + dd; };
  A.paint = (it, tx, tz) => {
    const m = Mp(); if (!m.inb(tx, tz) || m.isWaterT(tx, tz)) { G.sfx('error'); return; }
    const i = m.idx(tx, tz); if (m.surf[i] === it.surf) return; if (!G.inv.useHeld(1)) return;
    m.surf[i] = it.surf; m.markDirty(tx, tz); G.sfx('place', .5); G.fx.puff(tx + .5, m.topAt(tx + .5, tz + .5) + .05, tz + .5, 3, 0xf3ead2, .4);
  };
  A.terra = (op, tx, tz) => {
    const m = Mp(), p = P(); if (m.interior) { G.ui.toast('Le terrain se modifie dehors.'); return; }
    if (!m.inb(tx, tz) || tx < 2 || tz < 2 || tx >= m.W - 2 || tz >= m.H - 2) return;
    const i = m.idx(tx, tz), o = m.objAt(tx, tz);
    if (o && !(op === 'fill' && G.OBJ[o.t].onWater)) { G.ui.toast("Enlève d'abord ce qui est posé ici (X)."); G.sfx('error'); return; }
    if (o) m.removeObj(o);
    const [dx, dz] = dom(); let ok = true;
    if (op === 'up') { if (m.lvl[i] >= 4) ok = false; else { m.lvl[i]++; m.ramp[i] = 0; } }
    else if (op === 'down') { if (m.lvl[i] <= 0) ok = false; else { m.lvl[i]--; m.ramp[i] = 0; } }
    else if (op === 'water') { if (m.water[i]) ok = false; else { m.water[i] = 1; m.ramp[i] = 0; } }
    else if (op === 'fill') { if (!m.water[i]) ok = false; else { m.water[i] = 0; m.surf[i] = 0; } }
    else if (op === 'flat') { if (!m.ramp[i]) ok = false; else m.ramp[i] = 0; }
    else if (op === 'cascade') { if (m.lvl[i] >= 4) ok = false; else { m.lvl[i]++; m.water[i] = 1; m.ramp[i] = 0; G.ui.toast('Cascade ! L\'eau tombe vers l\'eau plus basse à côté.'); } }
    else if (op === 'ramp') {
      const ux = tx + dx, uz = tz + dz; if (!m.inb(ux, uz) || m.water[i]) ok = false;
      else { const u = m.idx(ux, uz); if (m.lvl[u] !== m.lvl[i] + 1) { G.ui.toast('Il faut une falaise d\'un niveau juste devant la case.'); ok = false; }
        else { const code = (dz < 0 ? 1 : dx > 0 ? 2 : dz > 0 ? 3 : 4) * 4, bx = tx - dx, bz = tz - dz, b = m.inb(bx, bz) ? m.idx(bx, bz) : -1;
          if (b >= 0 && m.lvl[b] === m.lvl[i] && !m.water[b] && !m.occ[b]) { m.ramp[i] = code + 1; m.ramp[b] = code + 2; m.markDirty(bx, bz); } else m.ramp[i] = code + 3; } }
    }
    if (!ok) { G.sfx('error'); return; }
    m.markDirty(tx, tz); G.sfx('dig'); G.fx.puff(tx + .5, m.topAt(tx + .5, tz + .5) + .1, tz + .5, 8, 0xc9a26b, .7); G.cam.shake(.04);
    if (Math.floor(p.x) === tx && Math.floor(p.z) === tz) p.y = Math.max(p.y, p.groundAt(p.x, p.z));
  };
  // ---------- interagir (E) ----------
  A.interact = () => {
    const p = P(); if (p.dead || p.vehicle || p.vault || p.show) return; if (p.sit) return A.standUp(); if (p.fish) return A.reel(); if (p.act || p.charging) return;
    if (p.emote) { p.emote = null; return; }
    const v = G.ents.villagerInFront(p); if (v) return G.ents.talk(v);
    if (p.swim) return;
    const m = Mp(), [tx, tz] = p.target(); let o = m.objAt(tx, tz);
    const here = m.objAt(Math.floor(p.x), Math.floor(p.z)); if ((!o || !A.useful(o)) && here && G.OBJ[here.t].pick) o = here;
    if (!o) return; const d = G.OBJ[o.t];
    if (d.shop) { if (A.front(o)) return G.ui.openShop(); }
    if (d.enter) { if (A.front(o)) return A.enterHouse(o); G.ui.toast("La porte est de l'autre côté."); return; }
    if (d.sit) return A.sitOn(o);
    if (d.storage) return G.ui.openStorage();
    if (d.wardrobe) return G.ui.openWardrobe();
    if (d.balloon) return G.feat.board(o);
    if (d.games) return G.mini.menu();
    if (d.light && !d.fire && (m.interior || d.toggle)) { o.off = !o.off; m.refresh(o); G.sfx('ui'); G.lampRefresh && G.lampRefresh(); return; }
    if (d.sleep) return A.sleep();
    if (d.craft) return G.ui.openCraft();
    if (d.cook) return G.ui.openCraft(true);
    if (d.read) return G.ui.readSign(o);
    if (d.mail) return G.ui.readMail(o);
    if (d.fruit || d.shake) return A.shakeTree(o);
    if (d.pickFruit) { if (o.f > 0) { give('baies', o.f); o.f = 0; m.refresh(o); G.sfx('pickup'); } else G.ui.toast('Plus de baies pour aujourd\'hui.'); return; }
    if (d.pick) return A.pickUp(o);
    if (d.fountain) { G.ui.toast('Tu fais un vœu… 🌟'); G.sfx('craft'); }
  };
  A.useful = o => { const d = G.OBJ[o.t]; return d.shop || d.enter || d.sit || d.sleep || d.craft || d.cook || d.read || d.mail || d.fruit || d.shake || d.pickFruit || d.pick || d.fountain || d.storage || d.wardrobe || d.balloon || d.games || (d.light && !d.fire && (G.map.interior || d.toggle)); };
  A.front = o => { const m = Mp(), p = P(), d = G.OBJ[o.t], [cx, cz] = m.center(o), F = G.FR[o.r], depth = d.fp[1]; return (p.x - cx) * F[0] + (p.z - cz) * F[1] > depth / 2 - .25; };
  A.pickUp = o => {
    const m = Mp(), d = G.OBJ[o.t], [cx, cz] = m.center(o); m.removeObj(o); G.sfx('pickup');
    if (d.pick === 'cadeau' || d.pick === 'sac_pieces') return A.openGift(d.pick);
    if (surv()) give(d.pick, 1, cx, o.y, cz); else G.popup(G.ITEMS[d.pick].ico + ' ' + G.ITEMS[d.pick].n, cx, o.y + 1, cz);
  };
  A.shakeTree = o => {
    const m = Mp(), d = G.OBJ[o.t], [cx, cz] = m.center(o); G.anim.shake(m, o, .6, 1.4); G.sfx('shake'); G.fx.burst(cx, o.y + 2.4, cz, 14, [0x58b54a, 0x6cc458, 0x4aa443], 2, 1.2, 3);
    const spots = []; for (const [dx, dz] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const x = o.x + dx, z = o.z + dz; if (m.canPlace('fruit_pomme', x, z)) spots.push([x, z]); }
    if (d.fruit && o.f > 0) { const n = Math.min(o.f, spots.length); for (let k = 0; k < n; k++) { const s = spots[k], fo = m.addObj('fruit_' + d.fruit, s[0], s[1]); G.anim.drop(m, fo); } o.f = 0; m.refresh(o); G.sfx('pickup'); return; }
    if (d.shake === 'coins' && o.sh !== G.clock.day && spots.length) { o.sh = G.clock.day; if (Math.random() < .2) { const fo = m.addObj('sac_pieces', spots[0][0], spots[0][1]); G.anim.drop(m, fo); G.sfx('coin'); } }
  };
  A.sitOn = o => {
    const m = Mp(), p = P(), d = G.OBJ[o.t], [cx, cz] = m.center(o), F = G.FR[o.r]; let sx = cx, sz = cz;
    if (d.fp[0] === 2) { const ax = F[1] !== 0 ? 1 : 0, az = 1 - ax; const s1 = [cx + ax * .45, cz + az * .45], s2 = [cx - ax * .45, cz - az * .45]; [sx, sz] = Math.hypot(p.x - s1[0], p.z - s1[1]) < Math.hypot(p.x - s2[0], p.z - s2[1]) ? s1 : s2; }
    if (o.t === 'table_pique') { const side = (p.z - cz) * F[1] + (p.x - cx) * F[0] > 0 ? 1 : -1; sx += F[0] * .52 * side; sz += F[1] * .52 * side; }
    p.sit = { o, px: p.x, pz: p.z }; p.x = sx; p.z = sz; p.y = o.y + Math.min(d.h, .5) - .3; p.vx = p.vz = p.vy = 0;
    if (o.t !== 'souche') p.yaw = o.r * Math.PI / 2; G.sfx('place', .5);
  };
  A.standUp = () => { const p = P(); if (!p.sit) return; const s = p.sit; p.sit = null; p.x = s.px; p.z = s.pz; p.y = p.groundAt(p.x, p.z); p.onGround = true; };
  A.enterHouse = o => {
    const d = G.OBJ[o.t], h = G.clock.min / 60;
    if (d.enter === 'habitant' && (h >= 22 || h < 6)) { G.ui.toast('Chut… ' + (G.VILLAGERS[o.vi] || {}).n + ' dort.'); return; }
    if (!o.iid) o.iid = 'h' + Date.now().toString(36);
    let im = G.interiors[o.iid];
    if (!im) { const V = G.VILLAGERS[o.vi]; im = G.interiors[o.iid] = G.makeInterior(d.enter, o.iid, V ? { wall: new THREE.Color(V.acc).lerp(new THREE.Color(0xffffff), .75).getHex() } : {}); }
    const [cx, cz] = Mp().center(o), F = G.FR[o.r], dd = G.fpDims(d, o.r)[o.r & 1 ? 0 : 1];
    im.meta.door = { x: cx + F[0] * (d.fp[1] / 2 + .7), z: cz + F[1] * (d.fp[1] / 2 + .7), yaw: o.r * Math.PI / 2 };
    im.meta.title = d.enter === 'habitant' ? 'Chez ' + (G.VILLAGERS[o.vi] || {}).n : d.n; im.meta.fromId = Mp().id;
    if (d.enter === 'musee') G.buildMuseum(im);
    G.sfx('door'); G.ui.fade(() => G.enterMap(im, Math.floor(im.W / 2) + .5, im.H - 1.4, Math.PI));
  };
  A.exitHouse = () => { const im = Mp(); if (!im.interior || A._exiting || G.ui.fading) return; A._exiting = true; const b = im.meta.door, to = im.meta.fromId === 'ile' && G.island ? G.island : G.world; G.sfx('door'); G.ui.fade(() => { G.enterMap(to, b.x, b.z, b.yaw); A._exiting = false; }); };
  A.sleep = () => {
    const h = G.clock.min / 60; if (surv() && h >= 6 && h < 19) { G.ui.toast("Tu n'as pas sommeil. Reviens après 19 h."); return; }
    G.sfx('sleep'); G.ui.fade(() => { if (G.clock.min >= 6 * 60) G.newDay(); G.clock.min = 6 * 60; const p = P(); p.hp = 10; p.food = Math.max(p.food, 5); G.saveGame(true); G.ui.toast('Bonjour ! ☀️ Jour ' + G.clock.day + ' — partie sauvegardée.'); }, 1.4);
  };
  A.take = () => {
    const p = P(); if (p.act || p.sit || p.fish || p.dead) return; const m = Mp(), [tx, tz] = p.target(), o = m.objAt(tx, tz); if (!o) return; const d = G.OBJ[o.t], [cx, cz] = m.center(o);
    if (o.t === 'maison_hab' || o.t === 'boutique' || o.t === 'paillasson') { G.ui.toast('Ça ne se déplace pas !'); G.sfx('error'); return; }
    if (o.falling) return;
    if (!surv()) { m.removeObj(o); G.fx.puff(cx, o.y + .3, cz, 10, 0xffffff, .7); G.sfx('pop'); return; }
    if (d.take) { if (G.inv.add(o.t, 1) > 0) { G.ui.toast('Inventaire plein !'); return; } m.removeObj(o); G.sfx('pickup'); G.popup('+1 ' + d.n, cx, o.y + 1.2, cz, 'green'); return; }
    if (d.pick) return A.pickUp(o);
    G.ui.toast(d.chop ? 'Il faut une hache pour ça.' : d.mine ? 'Il faut une pioche pour ça.' : d.dig ? 'Il faut une pelle pour ça.' : 'Impossible de ranger ça.'); G.sfx('error');
  };
  A.hurt = (n, msg) => {
    const p = P(); if (!surv() || p.inv > 0 || p.dead || n <= 0) return; p.hp -= n; p.hurtT = .6; p.inv = 1; G.sfx('hurt'); G.cam.shake(.15); G.ui.dirtyHud(); if (msg) G.ui.toast(msg);
    if (p.hp <= 0) { p.dead = true; G.ui.toast('Tu t\'es évanoui·e… tu te réveilles au camping.'); G.ui.fade(() => { const s = G.world.meta.tent || G.world.meta.spawn; G.enterMap(G.world, s.x, s.z, 0); p.hp = 6; p.food = Math.max(p.food, 4); p.dead = false; G.coins = Math.floor(G.coins * .9); G.ui.dirtyHud(); }, 1.2); }
  };
})();
