'use strict';
// ===== Nouveaux jeux de Filou (cache-cache, concours de pêche, safari insectes, attrape-étoiles), seul ou à deux, et excursions de l'île =====
(function () {
  const $ = G.el, TAU = Math.PI * 2;
  const NAMES = { cache: 'Cache-cache', peche: 'Concours de pêche', safari: 'Safari insectes', etoiles2: 'Attrape-étoiles', cueillette: 'Cueillette tropicale', papillons: 'Safari papillons', gros: 'Pêche au gros', tresor: 'Chasse au trésor' };
  const GM = G.games2 = { a: null, invited: {} };
  const hud = show => { let el = $('mini'); if (!el) { el = document.createElement('div'); el.id = 'mini'; el.className = 'card'; el.style.cssText = 'position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);font-family:var(--f-display);font-size:20px;display:flex;gap:16px;align-items:center;padding:8px 20px;z-index:12'; $('hud').appendChild(el); } el.hidden = !show; return el; };
  const say = (v, l, c) => v ? G.npcSay(v, l, c) : G.ui.dialog('Filou', l, { pitch: 1.25, color: '#e8a23a', choices: c });
  const surv = () => G.mode === 'survie', NET = () => G.net;
  const mesh = (geo, mats) => { const m = new THREE.Mesh(geo, mats || G.MATS); m.frustumCulled = false; m.castShadow = true; G.scene.add(m); return m; };
  const center = m => m.meta.games || m.meta.plaza || m.meta.spawn || { x: G.player.x, z: G.player.z };
  // ---------- cachettes (identiques pour les deux joueurs : même graine, même village) ----------
  function hideSpots(m, cx, cz, seed, n) {
    const r = G.rng(seed), cand = [];
    for (const o of m.list) { const d = G.OBJ[o.t]; if (!(d.chop >= 1 || d.enter || d.h >= 1.5)) continue; const [ox, oz] = m.center(o), dist = Math.hypot(ox - cx, oz - cz); if (dist < 5 || dist > 30) continue; cand.push(o); }
    cand.sort((a, b) => a.x - b.x || a.z - b.z); for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const out = [], free = (x, z) => m.inb(x, z) && !m.objAt(x, z) && !m.isWaterT(x, z) && !m.ramp[m.idx(x, z)];
    for (const o of cand) { if (out.length >= n) break; const [w, dd] = G.fpDims(G.OBJ[o.t], o.r);
      for (const [x, z] of [[o.x + Math.floor(w / 2), o.z - 1], [o.x - 1, o.z], [o.x + w, o.z], [o.x + Math.floor(w / 2), o.z + dd]]) { if (!free(x, z)) continue; const sx = x + .5, sz = z + .5; if (out.some(s => Math.hypot(s.x - sx, s.z - sz) < 6)) continue; out.push({ x: sx, z: sz, yaw: Math.atan2(o.x + w / 2 - sx, o.z + dd / 2 - sz) + Math.PI }); break; } }
    return out;
  }
  function makeHider(k, s) { const D = G.VILLAGERS[k % G.VILLAGERS.length], C = G.makeChar({ sp: D.sp, col: D.col, shirt: D.acc }); C.root.position.set(s.x, G.map.topAt(s.x, s.z), s.z); C.root.rotation.y = s.yaw; C.body.position.y = -.12; C.legL.rotation.x = C.legR.rotation.x = -1.2; G.scene.add(C.root); return { C, D, s }; }
  // les vrais habitants se cachent aussi : on les rend invisibles pendant la partie
  const hideVillagers = on => { for (const v of G.ents.villagers) if (!v.fixed && v.map === G.map) { v.gameHidden = on; } };
  G.on('update', () => { if (!GM.a || GM.a.id !== 'cache') return; for (const v of G.ents.villagers) if (v.gameHidden) { v.root.visible = v.blob.visible = false; v.visible = false; } });
  // ---------- étoiles (positions tirées de la graine) ----------
  function starSpots(m, cx, cz, seed) { const r = G.rng(seed), out = [], g0 = m.topAt(cx, cz);
    for (let k = 0, tries = 0; out.length < 45 && tries < 600; tries++) { const a = r() * TAU, rr = 2 + r() * 9, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, g = m.topAt(x, z), hi = r() < .45, gold = r() < .15, y = g + .6 + (hi ? 1.1 + r() * .7 : r() * .5);
      if (m.isWaterAt(x, z) || g > 30 || Math.abs(g - g0) > 1.6) continue; out.push({ x, y, z, gold, i: k++ }); } return out; }
  // ---------- démarrer / finir ----------
  GM.start = (id, o = {}) => {
    if (GM.a || (G.mini && G.mini.active)) return G.ui.toast('Une partie est déjà en cours !'); const m = G.map; if (!m || m.interior) return;
    const c = center(m), seed = o.seed || (1 + Math.floor(Math.random() * 1e9)), dur = o.dur || ({ cache: 120, peche: 150, safari: 120, etoiles2: 50, cueillette: 120, papillons: 120, gros: 150, tresor: 150 }[id]);
    const a = GM.a = { id, map: m, seed, dur, t0: o.t0 || Date.now(), duo: !!o.duo, host: o.host || (G.session && G.session.code), hostName: o.hostName || G.playerName, score: 0, got: [], items: [], objs: [], cx: c.x, cz: c.z, isle: !!o.isle };
    if (id === 'cache') { const sp = hideSpots(m, c.x, c.z, seed, 3); a.items = sp.map((s, k) => makeHider((seed + k) % 5, s)); hideVillagers(true); if (!a.items.length) { GM.a = null; return G.ui.toast('Pas de cachette par ici…'); } }
    if (id === 'etoiles2') { a.spots = starSpots(m, c.x, c.z, seed); a.stars = new Map(); }
    if (id === 'peche' || id === 'gros') G.player.tempTool = 'canne';
    if (id === 'safari' || id === 'papillons') G.player.tempTool = 'filet';
    if (id === 'tresor') { G.player.tempTool = 'pelle'; const r = G.rng(seed); let n = 0; for (let t = 0; t < 400 && n < 3; t++) { const x = 3 + Math.floor(r() * (m.W - 6)), z = 3 + Math.floor(r() * (m.H - 6)); if (m.canPlace('tresor_sol', x, z) && Math.hypot(x - G.player.x, z - G.player.z) > 6) { a.objs.push(m.addObj('tresor_sol', x, z)); n++; } } }
    G.ui.dirtyHot(); G.sfx('fanfare'); G.ui.toast((a.duo ? '👥 ' : '') + 'C\'est parti : ' + NAMES[id] + ' !');
    if (a.duo) pushDuo(true);
  };
  const pushDuo = open => { const a = GM.a; if (!a || !a.duo || !NET()) return; NET().setGame({ id: a.id, seed: a.seed, t0: a.t0, dur: a.dur, host: a.host, hn: G.playerName, open: !!open, got: a.got.slice(-60), sc: a.score }); };
  const partners = () => { const a = GM.a, out = []; if (!a || !a.duo || !NET()) return out; for (const p of NET().peersHere()) { const g = p.pr.g; if (g && g.seed === a.seed && g.id === a.id) out.push({ n: p.pr.n || 'Ami', g }); } return out; };
  const allGot = () => { const s = new Set(GM.a.got); for (const p of partners()) for (const i of (p.g.got || [])) s.add(i); return s; };
  GM.end = (why) => {
    const a = GM.a; if (!a) return; GM.a = null; hud(false); G.player.tempTool = null; G.ui.dirtyHot(); hideVillagers(false);
    for (const h of a.items || []) G.scene.remove(h.C.root); if (a.stars) for (const s of a.stars.values()) G.scene.remove(s); for (const o of a.objs) if (o && a.map.list.has(o)) a.map.removeObj(o);
    const pts = partners(); if (a.duo && NET()) NET().setGame(null);
    let coins = 0, lines = [];
    if (a.isle) { const need = { cueillette: 6, papillons: 4, gros: 3, tresor: 3 }[a.id], left = Math.max(0, a.dur - (Date.now() - a.t0) / 1000), ok = a.score >= need, med = !ok ? null : left / a.dur > .5 ? ['or', '🥇', 2500] : left / a.dur > .25 ? ['argent', '🥈', 1500] : ['bronze', '🥉', 800];
      if (med) { coins = med[2]; G.flags.medals = (G.flags.medals || 0) + 1; lines = ['Bravo ! Excursion réussie : ' + a.score + '/' + need + '.', 'Médaille d\'' + med[0] + ' ' + med[1] + ' ! Tu gagnes ' + coins + ' clochettes. (Médailles : ' + G.flags.medals + ')']; }
      else lines = ['Le temps est écoulé… ' + a.score + '/' + need + '.', 'Ce n\'est pas grave, reviens essayer quand tu veux !']; }
    else { const k = { cache: 400, peche: 150, safari: 150, etoiles2: 25 }[a.id]; coins = a.score * k; if (a.id === 'cache' && why === 'all') coins += Math.round(Math.max(0, a.dur - (Date.now() - a.t0) / 1000)) * 10;
      const rec = G.mini.best[a.id] || 0, nb = a.score > rec; if (nb) G.mini.best[a.id] = a.score;
      lines = [why === 'all' ? 'Tout est trouvé ! Ton score : ' + a.score + '.' : 'Terminé ! Ton score : ' + a.score + '.'];
      if (pts.length) lines.push('Scores : toi ' + a.score + ' · ' + pts.map(p => p.n + ' ' + (p.g.sc || 0)).join(' · ') + (pts.every(p => a.score > (p.g.sc || 0)) ? ' — tu gagnes ! 🏆' : pts.some(p => a.score < (p.g.sc || 0)) ? ' — la prochaine fois !' : ' — égalité !'));
      lines.push((nb ? 'NOUVEAU RECORD ! ' : '') + (coins ? 'Tu gagnes ' + coins.toLocaleString('fr-FR') + ' clochettes !' : 'Retente ta chance !')); }
    if (coins) { G.coins += coins; G.ui.dirtyHud(); } G.sfx(coins ? 'fanfare' : 'catch');
    const v = G.ents.villagers.find(x => x.npc === (a.isle ? 'ile' : 'jeux') && x.map === a.map); G.ui.dialog(v ? v.D.n : a.isle ? 'Papy Écaille' : 'Filou', lines, { pitch: a.isle ? .7 : 1.25, color: a.isle ? '#3f8f45' : '#e8a23a' });
  };
  // ---------- déroulement ----------
  G.on('update', dt => {
    const a = GM.a; if (!a) { invitations(); return; } const p = G.player, el = hud(true), left = a.dur - (Date.now() - a.t0) / 1000;
    if (G.map !== a.map) return GM.end('left');
    if (a.id === 'cache') { const got = allGot(); a.items.forEach((h, k) => { if (got.has(k) && h.C.root.parent) { if (!a.got.includes(k)) { G.fx.puff(h.s.x, h.C.root.position.y + .6, h.s.z, 10, 0xffffff, .7); } G.scene.remove(h.C.root); }
        if (!got.has(k) && Math.hypot(h.s.x - p.x, h.s.z - p.z) < 1.7) { a.got.push(k); a.score++; G.sfx('pop'); G.sfx('catch'); G.popup('Trouvé·e : ' + h.D.n + ' !', h.s.x, h.C.root.position.y + 1.6, h.s.z, 'gold'); G.fx.burst(h.s.x, h.C.root.position.y + 1, h.s.z, 16, [0xffd23f, 0xffffff], 3, .6, 6); if (a.duo) pushDuo(true); }
        if (h.C.root.parent) { const t = performance.now() / 1000 + k; h.C.body.position.y = -.12 + Math.abs(Math.sin(t * 2)) * .02; h.C.head && (h.C.head.rotation.y = Math.sin(t * .9) * .4); } });
      if (a.items.every((h, k) => got.has(k))) return GM.end('all'); }
    if (a.id === 'etoiles2') { const got = allGot(); let shown = 0;
      for (const s of a.spots) { const has = a.stars.get(s.i); if (got.has(s.i)) { if (has) { G.scene.remove(has); a.stars.delete(s.i); } continue; } if (shown >= 7) { if (has) { G.scene.remove(has); a.stars.delete(s.i); } continue; } shown++;
        let me = has; if (!me) { me = mesh(G.getGeo('star', s.gold ? 1 : 0)); me.position.set(s.x, s.y, s.z); a.stars.set(s.i, me); } me.rotation.y += dt * 3; me.position.y = s.y + Math.sin(performance.now() / 300 + s.x) * .08;
        if (Math.hypot(s.x - p.x, s.y - (p.y + .55), s.z - p.z) < .85) { a.got.push(s.i); a.score += s.gold ? 3 : 1; G.sfx('coin'); G.fx.burst(s.x, s.y, s.z, 14, [0xffd23f, 0xffffff], 3, .6, 2); G.popup(s.gold ? '+3 ⭐' : '+1 ⭐', s.x, s.y + .4, s.z, 'gold'); G.scene.remove(me); a.stars.delete(s.i); if (a.duo) pushDuo(true); } } }
    const pt = partners(), goal = { cache: ' 👀 ' + a.score + '/' + (a.items ? a.items.length : 3), cueillette: ' 🍎 ' + a.score + '/6', papillons: ' 🦋 ' + a.score + '/4', gros: ' 🐟 ' + a.score + '/3', tresor: ' 💎 ' + a.score + '/3' }[a.id] || ' ⭐ ' + a.score;
    el.innerHTML = '<span>' + (a.duo ? '👥 ' : '') + NAMES[a.id] + '</span><b>⏱ ' + Math.max(0, Math.ceil(left)) + ' s</b><b>' + goal + '</b>' + (pt.length ? '<span style="font-size:15px">' + pt.map(q => esc(q.n) + ' ' + (q.g.sc || 0)).join(' · ') + '</span>' : '');
    if (left <= 0) GM.end('time');
  });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // compteurs : poissons, insectes, fruits, trésors
  const pts = (sell, a, b) => sell >= a ? 3 : sell >= b ? 2 : 1;
  const ogive = G.act.give; G.act.give = (id, n, x, y, z) => { const r = ogive(id, n, x, y, z), a = GM.a, it = G.ITEMS[id];
    if (a && it && it.kind === 'fish' && (a.id === 'peche' || a.id === 'gros')) { a.score += a.id === 'gros' ? 1 : pts(it.sell, 1000, 400); G.popup((a.id === 'gros' ? '+1' : '+' + pts(it.sell, 1000, 400)) + ' 🐟', G.player.x, G.player.y + 2, G.player.z, 'gold'); if (a.duo) pushDuo(true); if (a.id === 'gros' && a.score >= 3) setTimeout(() => GM.end('all'), 600); }
    return r; };
  const obug = G.ents.catchBug; G.ents.catchBug = b => { const a = GM.a, kind = b.kind, r = obug(b); if (a && (a.id === 'safari' || a.id === 'papillons')) { const it = G.ITEMS[kind]; a.score += a.id === 'papillons' ? 1 : pts(it ? it.sell : 0, 900, 300); if (a.duo) pushDuo(true); if (a.id === 'papillons' && a.score >= 4) setTimeout(() => GM.end('all'), 600); } return r; };
  const opick = G.act.pickUp; G.act.pickUp = o => { const a = GM.a, t = o.t, r = opick(o); if (a && a.id === 'cueillette' && t.startsWith('fruit_')) { a.score++; G.popup('+1 🍎', G.player.x, G.player.y + 2, G.player.z, 'gold'); if (a.score >= 6) setTimeout(() => GM.end('all'), 500); } return r; };
  // trésor enfoui (une croix sur le sable)
  G.MODELS.tresor_sol = v => { const b = G.mb(190); for (const a of [.7, -.7]) b.box(.62, .02, .1, 0x8a2a1a, 0, .02, 0, 0, a, 0); b.sph(.22, 0xd9c08a, 0, -.02, 0, 1, .3, 1); return b.done(); };
  G.OBJ.tresor_sol = { id: 'tresor_sol', n: 'Trésor enfoui', model: 'tresor_sol', v: 0, fp: [1, 1], h: 0, treasureX: 1 };
  const odig = G.act.dig; G.act.dig = (tx, tz, o) => { const a = GM.a; if (o && o.t === 'tresor_sol') { const m = G.map, [cx, cz] = m.center(o); m.removeObj(o); G.sfx('dig'); G.sfx('fanfare'); G.fx.burst(cx, o.y + .4, cz, 20, [0xffd23f, 0xffffff, 0xbfe6fa], 3.5, .8, 6);
      const loot = G.pick(['or', 'or', 'coquillage', 'fossile', 'cadeau']); G.act.give(loot, 1, cx, o.y, cz); if (a && a.id === 'tresor') { a.score++; if (a.objs) a.objs = a.objs.filter(q => q !== o); if (a.score >= 3) setTimeout(() => GM.end('all'), 600); } return; }
    return odig(tx, tz, o); };
  // ---------- invitations à jouer à deux ----------
  function invitations() { const net = NET(); if (!net || !net.online()) return;
    for (const p of net.peersHere()) { const g = p.pr.g; if (!g || !g.open || g.host !== p.pr.code || !NAMES[g.id] || Date.now() - g.t0 > g.dur * 1000) continue; if (GM.invited[g.seed]) continue; GM.invited[g.seed] = 1;
      G.ui.toast('👥 ' + (p.pr.n || 'Un ami') + ' t\'invite à « ' + NAMES[g.id] + ' » ! Parle à Filou pour rejoindre la partie.'); G.sfx('pop'); } }
  const openGame = () => { const net = NET(); if (!net) return null; for (const p of net.peersHere()) { const g = p.pr.g; if (g && g.open && g.host === p.pr.code && NAMES[g.id] && Date.now() - g.t0 < (g.dur - 5) * 1000) return { n: p.pr.n || 'Ami', g }; } return null; };
  // ---------- Filou ----------
  const SOLO = [['etoiles', 'Attrape-étoiles'], ['ballons', 'Tir aux ballons'], ['anneaux', 'Course des anneaux'], ['cache', 'Cache-cache'], ['peche', 'Concours de pêche'], ['safari', 'Safari insectes']];
  const DUO = [['etoiles2', 'Attrape-étoiles à deux'], ['cache', 'Cache-cache à deux'], ['peche', 'Pêche à deux']];
  G.npcRoles.jeux = v => {
    const og = openGame(), opts = [], acts = [];
    if (og) { opts.push('Rejoindre « ' + NAMES[og.g.id] + ' » de ' + og.n); acts.push(() => GM.start(og.g.id, { seed: og.g.seed, t0: og.g.t0, dur: og.g.dur, duo: true, host: og.g.host, hostName: og.n })); }
    opts.push('Jeux en solo', 'Jouer à deux', 'Non merci'); acts.push(() => solo(v), () => duo(v), () => { });
    return say(v, ['Approche, approche, ' + G.playerName + ' ! Mes jeux rapportent des clochettes ! 🔔' + (og ? ' Et ' + og.n + ' t\'attend pour jouer !' : '')], opts).then(k => { if (k >= 0 && acts[k]) return acts[k](); });
  };
  const solo = v => say(v, ['À quoi veux-tu jouer ?'], SOLO.map(x => x[1]).concat(['Retour'])).then(k => { const g = SOLO[k]; if (!g) return; if (['etoiles', 'ballons', 'anneaux'].includes(g[0])) return G.mini.start(g[0]); GM.start(g[0]); });
  const duo = v => { const net = NET(); if (!net || !net.online()) return say(v, ['Pour jouer à deux, il faut être en ligne avec un ami !', 'Invite-le dans ton village depuis la gare, ou rends-lui visite.']);
    if (!net.peersHere().length) return say(v, ['Il n\'y a personne d\'autre ici pour l\'instant…', 'Quand ton ami sera sur la place avec toi, reviens me voir !']);
    return say(v, ['Super ! Choisis le jeu, j\'envoie l\'invitation à tout le monde ici.'], DUO.map(x => x[1]).concat(['Retour'])).then(k => { const g = DUO[k]; if (g) GM.start(g[0], { duo: true }); }); };
  // ---------- Papy Écaille : excursions sur l'île ----------
  G.npcRoles.ile = v => say(v, ['Bonjour jeune voyageur… Je suis Papy Écaille, gardien de cette île.', 'Une petite excursion ? Réussis-la vite pour gagner une médaille et des clochettes !'], ['Cueillette tropicale (6 fruits)', 'Safari papillons (4 insectes)', 'Pêche au gros (3 poissons)', 'Chasse au trésor (3 trésors)', 'Un souvenir ?', 'Au revoir']).then(k => {
    const ids = ['cueillette', 'papillons', 'gros', 'tresor']; if (k >= 0 && k < 4) { const tips = ['Secoue les arbres (E) et ramasse les fruits !', 'Ton filet t\'attend : attrape 4 insectes.', 'Voilà une canne : 3 poissons de la mer !', 'Voilà une pelle : cherche les croix rouges sur l\'île et creuse !']; return say(v, [tips[k]]).then(() => GM.start(ids[k], { isle: true })); }
    if (k === 4) { const gift = G.flags.ileGift !== G.clock.day; G.flags.ileGift = G.clock.day; return say(v, [gift ? 'Tiens, prends ce petit souvenir. Reviens demain, j\'en aurai un autre !' : 'Je t\'ai déjà donné un souvenir aujourd\'hui. Profite de l\'île !']).then(() => { if (gift) { G.act.give(G.pick(['coco', 'coco', 'poisson_clown', 'or']), 1); G.sfx('fanfare'); } }); }
  });
})();
