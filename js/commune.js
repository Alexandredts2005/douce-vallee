'use strict';
// ===== La ville commune, façon serveur Minecraft : une seule ville pour tous les joueurs, gardée par le serveur Douce Vallée.
// On y va par la gare (Pablo) ou par le menu Pause. Tout le monde y construit en même temps : ce que l'un pose, retire ou modèle
// apparaît aussitôt chez les autres, et reste là même quand plus personne n'est connecté. On s'y voit, on discute (Entrée).
// Ce qu'un joueur a posé ne peut être retiré que par lui. On garde son sac, ses clochettes et sa maison : on rentre chez soi quand on veut. =====
(function () {
  const NET = G.net, ROOM = 't' + 'c0'.repeat(20), SEED = 20261020;
  const C = G.commune = { map: null, seq: 0, bseq: 0, q: [], applying: false, owner: new Map(), interiors: {}, busy: false, sh: null };
  const myId = () => (NET.me && NET.me()) || NET.ses;
  const okServer = () => NET.mode === 'server' && NET.wsOk;
  const key = (x, z) => x + ',' + z;
  const inCommune = () => !!C.map && (G.map === C.map || !!(G.map && G.map.comm));

  // ---------- appliquer les constructions venues du serveur ----------
  function applyOne(m, o) {
    if (!o || typeof o !== 'object') return; const x = o.x | 0, z = o.z | 0; if (!m.inb(x, z)) return;
    if (o.k === 't') { if (x < 2 || z < 2 || x >= m.W - 2 || z >= m.H - 2) return; const i = m.idx(x, z);
      m.lvl[i] = Math.max(0, Math.min(10, o.l | 0)); m.water[i] = Math.max(0, Math.min(2, o.w | 0)); m.ramp[i] = Math.max(0, Math.min(255, o.p | 0)); if (G.SURF[o.f | 0]) m.surf[i] = o.f | 0;
      if (C.sh) { C.sh.l[i] = m.lvl[i]; C.sh.w[i] = m.water[i]; C.sh.p[i] = m.ramp[i]; C.sh.f[i] = m.surf[i]; } m.markDirty(x, z); return; }
    if (!G.OBJ[o.t]) return; const dk = typeof o.dk === 'number' && o.dk > 0 && o.dk < 40 ? o.dk : null, du = o.du ? 1 : 0;
    if (o.k === 'r') { const q = dk != null ? m.deckAt(x, z, du) : m.objAt(x, z); if (q && q.t === o.t && q.x === x && q.z === z) m.removeObj(q); C.owner.delete(key(x, z)); }
    else if (o.k === 'a' && !(dk != null ? m.deckAt(x, z, du) : m.objAt(x, z))) { const ex = {}; if (typeof o.v === 'number') ex.v = o.v; if (typeof o.cy === 'number' && o.cy > 0 && o.cy < 20) ex.cy = o.cy; if (dk != null) { ex.dk = dk; if (du) ex.du = 1; }
      if (m.addObj(o.t, x, z, (o.r | 0) & 3, ex) && typeof o.by === 'string') C.owner.set(key(x, z), { by: o.by.slice(0, 40), n: String(o.n || 'un joueur').slice(0, 16) }); }
  }
  function apply(list) { const m = C.map; if (!m || !Array.isArray(list)) return; C.applying = true;
    try { for (const e of list) { if (!e || typeof e.s !== 'number' || e.s <= C.seq) continue; C.seq = e.s; if (e.o && e.o.pid === NET.ses && C.mine.has(e.o.q)) { C.mine.delete(e.o.q); continue; } applyOne(m, e.o); } }
    finally { C.applying = false; } }
  C.mine = new Set();
  NET.onCommune = msg => { if (!C.map || !Array.isArray(msg.l)) return; const first = msg.l[0]; if (first && first.s > C.seq + 1) { resync(); return; } apply(msg.l); };
  async function resync() { if (!C.map || C.syncing || !okServer()) return; C.syncing = true;
    try { const r = await NET.wsReq({ t: 'cget', from: C.seq }, 60000); if (!r || !C.map) return; if (r.base && r.bseq > C.seq) { G.ui.toast('🌍 La ville commune a été rangée : retour à la gare pour la recharger…'); await leave(true); join(); return; } C.bseq = r.bseq; apply(r.ops); }
    finally { C.syncing = false; } }

  // ---------- envoyer mes constructions ----------
  let qid = 0, flushT = null;
  const push = op => { op.pid = NET.ses; op.q = ++qid; C.mine.add(op.q); C.q.push(op); if (!flushT) flushT = setTimeout(flush, 120); };
  function flush() { flushT = null; if (!C.q.length) return; if (!okServer()) { flushT = setTimeout(flush, 1500); return; } NET.wsSend({ t: 'cop', ops: C.q.splice(0, 40) }); if (C.q.length) flushT = setTimeout(flush, 250); }
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj, omd = GP.markDirty;
  const live = m => m === C.map && !C.applying && G.state === 'play';
  GP.addObj = function (t, x, z, r, ex) { const o = oadd.call(this, t, x, z, r, ex); if (o && live(this)) { push({ k: 'a', t, x, z, r: o.r || 0, v: o.v != null ? o.v : undefined, dk: o.dk, du: o.du, cy: o.cy || undefined, by: myId(), n: String(G.playerName || '').slice(0, 16) }); C.owner.set(key(x, z), { by: myId(), n: G.playerName }); } return o; };
  GP.removeObj = function (o) { orem.call(this, o); if (live(this)) { push({ k: 'r', t: o.t, x: o.x, z: o.z, dk: o.dk, du: o.du }); C.owner.delete(key(o.x, o.z)); } };
  GP.markDirty = function (x, z) { omd.call(this, x, z); if (!live(this) || !this.inb(x, z) || !C.sh) return; const i = this.idx(x, z), S = C.sh;
    if (S.l[i] === this.lvl[i] && S.w[i] === this.water[i] && S.p[i] === this.ramp[i] && S.f[i] === this.surf[i]) return; // rien n'a changé sur cette case
    S.l[i] = this.lvl[i]; S.w[i] = this.water[i]; S.p[i] = this.ramp[i]; S.f[i] = this.surf[i]; push({ k: 't', x, z, l: this.lvl[i], w: this.water[i], p: this.ramp[i], f: this.surf[i] }); };

  // ---------- rejoindre / quitter ----------
  async function join() {
    if (C.map) { G.ui.toast('Tu es déjà dans la ville commune !'); return; }
    if (NET.visit) { G.ui.toast('Rentre d\'abord chez toi, puis prends le train pour la ville commune.'); return; }
    if (!okServer()) { G.ui.toast(NET.mode === 'claude' ? '🌍 La ville commune vit sur le serveur Douce Vallée : ouvre le jeu sur douce-vallee.onrender.com.' : '🌍 Pas de connexion au serveur pour l\'instant… (il se réveille parfois en une minute) Réessaie bientôt !', 7000); return; }
    if (C.busy) return; C.busy = true; G.ui.toast('🌍 En route pour la ville commune…', 4000);
    try {
      let r = await NET.wsReq({ t: 'cget' }, 90000); if (!r) throw new Error('réseau');
      if (!r.has) { // la toute première fois : la carte de départ est créée ici, puis gardée par le serveur pour tout le monde
        const m0 = G.genWorld(G.DEFAULT_LAYOUT, SEED), rec = m0.serialize(); rec.owners = []; await NET.wsReq({ t: 'cbase', rec, seq: 0 }, 90000);
        r = await NET.wsReq({ t: 'cget' }, 90000); if (!r || !r.has) throw new Error('création'); }
      const m = G.GMap.deserialize(r.base); m.id = 'commune'; m.commune = true; m.meta.title = 'Ville commune';
      C.map = m; C.bseq = C.seq = r.bseq; C.owner.clear(); C.mine.clear(); C.q.length = 0;
      for (const w of Array.isArray(r.base.owners) ? r.base.owners : []) if (Array.isArray(w)) C.owner.set(key(w[0], w[1]), { by: String(w[2]), n: String(w[3] || 'un joueur') });
      C.sh = { l: Int8Array.from(m.lvl), w: Uint8Array.from(m.water), p: Uint8Array.from(m.ramp), f: Uint8Array.from(m.surf) };
      apply(r.ops);
      G.scene.add(m.group); m.buildAll(); m.group.visible = false; G.ents.spawnVillagers(m);
      NET.forceRoom = ROOM; trainSfx();
      G.ui.fade(() => { const g = m.meta.gare || m.meta.spawn; G.enterMap(m, g.x, (g.z || 0) + .4, 0); G.train && G.train.start && G.train.start(0);
        G.ui.toast('🌍 Bienvenue dans la ville commune ! Tous les joueurs y construisent ensemble, en direct. Entrée : discuter · 🏠 : rentrer chez toi.', 9000); }, 1.6);
    } catch (e) { console.error(e); G.ui.toast('La ville commune ne répond pas pour le moment. Réessaie dans un instant.'); }
    finally { C.busy = false; }
  }
  async function leave(silent) {
    if (!C.map) return; flush(); const m = C.map, go = () => { const g = G.world.meta.gare || G.world.meta.spawn; G.enterMap(G.world, g.x, (g.z || 0) + .4, 0); drop(m); if (!silent) G.ui.toast('🏠 De retour à ' + G.villageName + ' !'); };
    if (silent) return go(); trainSfx(); G.ui.fade(go, 1.6); }
  function drop(m) { for (const im of [m, ...Object.values(C.interiors)]) { G.scene.remove(im.group); for (const a of G.ents.villagers.slice()) if (a.map === im) { G.scene.remove(a.root); G.scene.remove(a.blob); G.ents.villagers.splice(G.ents.villagers.indexOf(a), 1); } }
    C.interiors = {}; C.map = null; C.sh = null; NET.forceRoom = null; }
  C.join = join; C.leave = leave;
  function trainSfx() { const A = G.audio; if (!A || !A.ok) return; try { const X = A.ctx, t = X.currentTime; for (let i = 0; i < 2; i++) for (const f of [660, 880]) { const o = X.createOscillator(), g = X.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .6); g.gain.linearRampToValueAtTime(.05, t + i * .6 + .04); g.gain.exponentialRampToValueAtTime(.0001, t + i * .6 + .5); o.connect(g); g.connect(A.sfxG); o.start(t + i * .6); o.stop(t + i * .6 + .6); } } catch (e) { } }

  // ---------- la ville se range d'elle-même : quand les constructions s'accumulent, un joueur envoie la ville entière au serveur ----------
  let packT = 90;
  G.on('update', dt => { if (!C.map || G.state !== 'play') return; packT -= dt || 0; if (packT > 0) return; packT = 60 + Math.random() * 120;
    if (C.seq - C.bseq < 4000 || C.q.length || C.syncing || !okServer()) { resync(); return; }
    const rec = C.map.serialize(); rec.owners = [...C.owner].slice(0, 60000).map(([k, v]) => { const [x, z] = k.split(','); return [+x, +z, v.by, v.n]; });
    NET.wsReq({ t: 'cbase', rec, seq: C.seq }, 90000).then(ok => { if (ok) C.bseq = C.seq; }); });

  // ---------- dans la ville commune ----------
  G.on('init', () => {
    const A = G.act;
    // ce qu'un autre joueur a posé : lui seul peut le retirer
    const ot = A.take; A.take = () => { if (G.map === C.map) { const [tx, tz] = G.player.target(), o = C.map.objAt(tx, tz), w = o && C.owner.get(key(o.x, o.z));
      if (w && w.by !== myId()) { G.sfx('error'); return G.ui.toast('C\'est à ' + w.n + ' : seule cette personne peut le retirer.'); } } return ot(); };
    // les maisons et boutiques de la ville commune (leurs pièces restent chez chacun)
    const oe = A.enterHouse; A.enterHouse = o => { if (G.map !== C.map) return oe(o); const d = G.OBJ[o.t], k = o.iid || ('b' + o.t + '_' + o.x + '_' + o.z); let im = C.interiors[k];
      if (!im) { try { im = G.makeInterior(d.enter, 'com_' + k, {}); } catch (e) { return G.ui.toast('Cette porte est fermée.'); } im.comm = true; G.scene.add(im.group); im.group.visible = false; C.interiors[k] = im; }
      const [cx, cz] = C.map.center(o), F = G.FR[o.r]; im.meta.door = { x: cx + F[0] * (d.fp[1] / 2 + .7), z: cz + F[1] * (d.fp[1] / 2 + .7), yaw: o.r * Math.PI / 2 }; im.meta.title = d.n; im.meta.fromId = 'commune';
      if (d.enter === 'musee' && G.buildMuseum) G.buildMuseum(im); G.sfx('door'); G.ui.fade(() => G.enterMap(im, Math.floor(im.W / 2) + .5, im.H - 1.4, Math.PI)); };
    const ox = A.exitHouse; A.exitHouse = () => { const im = G.map; if (!im || !im.comm || !C.map || G.ui.fading || A._exiting) return ox(); A._exiting = true; const b = im.meta.door; G.sfx('door'); G.ui.fade(() => { G.enterMap(C.map, b.x, b.z, b.yaw); A._exiting = false; }); };
    const osl = A.sleep; A.sleep = () => inCommune() ? G.ui.toast('Rentre chez toi pour dormir !') : osl();
    if (G.travel && G.travel.island) { const oi = G.travel.island; G.travel.island = (...a) => inCommune() ? G.ui.toast('Le bateau pour l\'île part de ton village.') : oi(...a); }
    // la sauvegarde nous range à la gare de notre propre village
    const os = G.serialize; G.serialize = () => { const out = os(); if (inCommune() && out.player) { const g = G.world.meta.gare || G.world.meta.spawn; out.player = Object.assign({}, out.player, { map: 'world', x: g.x, z: (g.z || 0) + .4, veh: null }); if (out.residents && out.residents[out.rid]) out.residents[out.rid].player = out.player; } return out; };
    const ott = G.toTitle; G.toTitle = () => { if (C.map) leave(true); ott(); };
    // Pablo, à la gare de la ville commune
    const og = G.npcRoles.gare; G.npcRoles.gare = v => { if (G.map !== C.map) return og(v);
      return G.npcSay(v, ['Bienvenue à la gare de la ville commune ! Ici, tous les joueurs construisent ensemble, hi hi !', 'Ce que tu poses reste pour tout le monde. Ce qu\'un autre a posé, seul lui peut le retirer.'], ['🏠 Rentrer chez moi', 'Rester encore']).then(k => { if (k === 0) leave(); }); };
    // le bouton du menu Pause
    const pm = document.getElementById('p-map'); if (pm) { const b = document.createElement('button'); b.className = 'mbtn'; b.id = 'p-commune'; b.innerHTML = '<span class="e">🌍</span><span class="t">Ville commune</span>'; pm.insertAdjacentElement('afterend', b);
      b.addEventListener('click', () => { G.audio.init && G.audio.init(); G.sfx('ui'); G.ui.resume(); C.map ? leave() : join(); }); }
    // le bouton « rentrer chez moi » en haut à droite
    const hb = document.createElement('button'); hb.className = 'btn'; hb.hidden = true; hb.style.cssText = 'margin-top:6px;padding:6px 12px;font-size:14px;pointer-events:auto'; hb.textContent = '🏠 Quitter la ville commune'; hb.onclick = () => leave();
    (document.getElementById('hud-tr') || document.getElementById('hud')).appendChild(hb); C.btn = hb;
  });
  G.on('frame', () => { if (C.btn && (C.bt = (C.bt || 0) + 1) % 20 === 0) { C.btn.hidden = !(C.map && G.state === 'play'); const pb = document.getElementById('p-commune'); if (pb) pb.lastChild.textContent = C.map ? 'Quitter la ville commune' : 'Ville commune'; } });
  const reset = () => { if (C.map) drop(C.map); };
  G.on('newGame', reset); G.on('load', reset);
})();
