'use strict';
// ===== Jeu en ligne PRIVÉ : on n'entre dans un village qu'avec son code ami. =====
// Le code n'est jamais envoyé : la salle en direct, la place dans la base de données et la clé de chiffrement en sont des empreintes.
// Sans le code, impossible de trouver un village, de le lire, ou de voir qui s'y promène. Aucune liste publique.
// Deux façons d'être en ligne : sur claude.ai (salles privées + base de données de l'artefact) ou avec le petit serveur de ton PC (node serve.js).
(function () {
  const $ = G.el, TAU = Math.PI * 2;
  const NET = G.net = { mode: 'solo', peers: new Map(), av: new Map(), visit: null, ops: [], seq: 0, ses: Math.random().toString(36).slice(2, 8), req: new Map(), rid: 0, lastPres: '', presT: 0, pubT: 30, pubRev: -1, said: null, curRoom: null, nroom: null };
  const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g, '').slice(0, n);
  const LK = ['skin', 'hair', 'hairCol', 'eyes', 'eyeCol', 'mouth', 'top', 'topCol', 'bottom', 'botCol', 'shoes', 'hat', 'hatCol', 'acc', 'blush', 'freckles', 'gender', 'lashes', 'brows', 'nose', 'eyeSize', 'height', 'shoe', 'socks', 'bag', 'bagCol', 'cheek', 'ahoge', 'accCol'];
  const packLook = l => { const o = {}; for (const k of LK) if (l && l[k] !== undefined) o[k] = l[k]; return o; };
  const unpackLook = o => { const l = {}; if (o && typeof o === 'object') for (const k of LK) { const v = o[k]; if (typeof v === 'number' && isFinite(v) || typeof v === 'boolean' || (typeof v === 'string' && v.length < 24)) l[k] = v; } l.design = -1; return G.normLook(l); };
  const CODE_RE = /^DV-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  // ---------- empreintes du code ami (le code lui-même ne quitte jamais l'ordinateur) ----------
  const IDC = new Map();
  const ids = code => { code = String(code || '').toUpperCase(); let r = IDC.get(code); if (!r) { const h = s => G.sha256(s); r = { room: 't' + h('dv-room:' + code).slice(0, 40), doc: h('dv-doc:' + code).slice(0, 40), id: h('dv-id:' + code).slice(0, 16), key: h('dv-key:' + code) }; IDC.set(code, r); } return r; };
  const myCode = () => G.session && G.session.code;
  const townCode = () => NET.visit ? NET.visit.code : myCode();
  NET.me = () => myCode() ? ids(myCode()).id : null;
  NET.townId = () => townCode() ? ids(townCode()).id : null;
  const mapKey = m => !m ? '' : (m === G.world || m.visit) ? 'world' : m.id;
  NET.online = () => NET.mode !== 'solo';
  NET.closed = () => { const s = G.session, rec = s && G.sessions && G.sessions.get(s.sid); return !!(rec && rec.closed); };
  // ---------- chiffrement ChaCha20 (marche partout, même sans https) ----------
  function chacha(keyHex, nonce, data) {
    const st = new Uint32Array(16), x = new Uint32Array(16), out = new Uint8Array(data.length), ks = new Uint8Array(64), kv = new DataView(ks.buffer), nv = new DataView(nonce.buffer, nonce.byteOffset, 12);
    st[0] = 0x61707865; st[1] = 0x3320646e; st[2] = 0x79622d32; st[3] = 0x6b206574; for (let i = 0; i < 8; i++) st[4 + i] = parseInt(keyHex.substr(i * 8, 8), 16);
    st[13] = nv.getUint32(0, true); st[14] = nv.getUint32(4, true); st[15] = nv.getUint32(8, true);
    const QR = (a, b, c, d) => { x[a] += x[b]; x[d] ^= x[a]; x[d] = (x[d] << 16) | (x[d] >>> 16); x[c] += x[d]; x[b] ^= x[c]; x[b] = (x[b] << 12) | (x[b] >>> 20); x[a] += x[b]; x[d] ^= x[a]; x[d] = (x[d] << 8) | (x[d] >>> 24); x[c] += x[d]; x[b] ^= x[c]; x[b] = (x[b] << 7) | (x[b] >>> 25); };
    for (let off = 0, ctr = 1; off < data.length; off += 64, ctr++) { st[12] = ctr; x.set(st);
      for (let i = 0; i < 10; i++) { QR(0, 4, 8, 12); QR(1, 5, 9, 13); QR(2, 6, 10, 14); QR(3, 7, 11, 15); QR(0, 5, 10, 15); QR(1, 6, 11, 12); QR(2, 7, 8, 13); QR(3, 4, 9, 14); }
      for (let i = 0; i < 16; i++) kv.setUint32(i * 4, (x[i] + st[i]) >>> 0, true);
      const m = Math.min(64, data.length - off); for (let i = 0; i < m; i++) out[off + i] = data[off + i] ^ ks[i]; }
    return out;
  }
  const pipe = async (u8, S) => { const s = new S('deflate'), w = s.writable.getWriter(); w.write(u8); w.close(); return new Uint8Array(await new Response(s.readable).arrayBuffer()); };
  async function seal(code, obj) {
    let u8 = new TextEncoder().encode('DV2:' + JSON.stringify(obj)), z = 0;
    if (typeof CompressionStream !== 'undefined') { const c = await pipe(u8, CompressionStream).catch(() => null); if (c && c.length < u8.length) { u8 = c; z = 1; } }
    const nonce = new Uint8Array(12); crypto.getRandomValues(nonce); return { v: 2, z, n: G.b64.enc(nonce), d: G.b64.enc(chacha(ids(code).key, nonce, u8)) };
  }
  async function unseal(code, rec) {
    if (!rec || rec.v !== 2 || typeof rec.d !== 'string' || typeof rec.n !== 'string') throw new Error('format');
    let u8 = chacha(ids(code).key, G.b64.dec(rec.n), G.b64.dec(rec.d)); if (rec.z) { if (typeof DecompressionStream === 'undefined') throw new Error('navigateur'); u8 = await pipe(u8, DecompressionStream); }
    const s = new TextDecoder().decode(u8); if (!s.startsWith('DV2:')) throw new Error('code'); return JSON.parse(s.slice(4));
  }
  NET.seal = seal; NET.unseal = unseal;
  // ---------- transports ----------
  async function bootClaude() {
    if (!window.claude || typeof window.claude.use !== 'function') return false;
    const safe = p => Promise.resolve(p).catch(() => null), [room, db, user] = await Promise.all([safe(claude.use('room')), safe(claude.use('db')), safe(claude.use('user'))]);
    if (!room && !db) return false; NET.room = room; NET.db = db; NET.user = user; NET.uid = user ? await safe(user.id()) : null; NET.mode = 'claude';
    // le salon commun ne sert qu'en secours, si les salles privées sont indisponibles : on n'y garde que les joueurs de notre salle
    if (room) room.onPeers(ch => { if (!NET.nroom && NET.curRoom) setPeers(ch.peers, true); }, () => {});
    return true;
  }
  // ---------- serveur distant (Render.com ou autre) ----------
  // L'URL du serveur distant est stockée dans localStorage sous la clé 'dv_server_url'.
  NET.remoteUrl = null;
  function detectRemoteUrl() {
    // Si on est déjà sur un hôte non-local, c'est notre serveur Render
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && !location.hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./)) {
      return location.origin;
    }
    try { return localStorage.getItem('dv_server_url') || null; } catch (e) { return null; }
  }
  async function pingUrl(base) {
    try {
      const r = await fetch(base + '/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) return false;
      const j = await r.json();
      return j && j.server === 'douce-vallee';
    } catch (e) { return false; }
  }
  async function bootServer() {
    if (location.protocol === 'file:') return false;
    // 1. Essayer le serveur local
    const localOk = await pingUrl(location.origin);
    if (localOk) { NET.mode = 'server'; NET.serverBase = location.origin; connectWS(location.origin); return true; }
    // 2. Essayer le serveur distant configuré
    const remote = detectRemoteUrl();
    if (remote && remote !== location.origin) {
      const remoteOk = await pingUrl(remote);
      if (remoteOk) { NET.mode = 'server'; NET.serverBase = remote; NET.remoteUrl = remote; connectWS(remote); return true; }
    }
    return false;
  }
  function connectWS(base) {
    const b = base || NET.serverBase || location.origin;
    const wsUrl = b.replace(/^http/, 'ws') + '/ws';
    let ws; try { ws = new WebSocket(wsUrl); } catch (e) { return; } NET.ws = ws;
    ws.onopen = () => { NET.wsOk = true; NET.lastPres = ''; NET.curRoom = null; if (NET.remoteUrl) console.log('🌍 Connecté au serveur mondial : ' + b); };
    ws.onclose = () => { NET.wsOk = false; NET.curRoom = null; NET.peers.clear(); onPeers(); setTimeout(() => connectWS(b), 3000); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.t === 'pres' && m.id != null) { NET.peers.set(m.id, { id: m.id, pr: m.d || {} }); onPeers(); }
      else if (m.t === 'left') { NET.peers.delete(m.id); onPeers(); }
      else if (m.t === 'res') { const cb = NET.req.get(m.rid); if (cb) { NET.req.delete(m.rid); cb(m.data); } } };
  }
  const wsReq = (msg, ms = 15000) => new Promise(res => { if (!NET.wsOk) return res(null); const rid = ++NET.rid; msg.rid = rid; NET.req.set(rid, res); NET.ws.send(JSON.stringify(msg)); setTimeout(() => { if (NET.req.has(rid)) { NET.req.delete(rid); res(null); } }, ms); });
  // Configurer l'URL du serveur distant depuis le menu
  NET.setRemoteServer = async url => {
    url = (url || '').trim().replace(/\/$/, '');
    if (!url) { try { localStorage.removeItem('dv_server_url'); } catch (e) { } NET.remoteUrl = null; G.ui.toast('URL du serveur supprimée.'); return; }
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    G.ui.toast('Connexion à ' + url + '…');
    const ok = await pingUrl(url);
    if (!ok) { G.ui.toast('❌ Serveur inaccessible. Vérifie l\'URL.'); return; }
    try { localStorage.setItem('dv_server_url', url); } catch (e) { }
    NET.remoteUrl = url; NET.serverBase = url;
    if (NET.ws) try { NET.ws.close(); } catch (e) { }
    NET.mode = 'server'; connectWS(url);
    G.ui.toast('🌍 Connecté à ' + url + ' !');
  };
  function setPeers(list, lobby) {
    NET.peers.clear();
    for (const p of list) { if (p.sameTab || p.kind !== 'viewer') continue; const pr = p.presence || {}; if (lobby && pr.at !== NET.curRoom) continue; NET.peers.set(p.peer, { id: p.peer, by: p.by, pr }); }
    onPeers();
  }
  // ---------- salle privée du village où l'on se trouve ----------
  async function switchRoom(name) {
    if (NET.roomBusy || name === NET.curRoom) return; NET.roomBusy = true;
    try {
      const old = NET.nroom; NET.nroom = null; if (NET.unsubR) { try { NET.unsubR(); } catch (e) { } NET.unsubR = null; }
      if (old) await old.leave().catch(() => { });
      NET.curRoom = name; NET.peers.clear(); onPeers(); NET.lastPres = '';
      if (NET.mode === 'claude' && NET.room) {
        if (name && !NET.noNamed) { try { const r = await NET.room.join(name); if (NET.curRoom !== name) { r.leave().catch(() => { }); return; } NET.nroom = r; NET.unsubR = r.onPeers(ch => { if (NET.nroom === r) setPeers(ch.peers, false); }, () => { }); } catch (e) { if (e && e.code === 'not_permitted') NET.noNamed = true; } }
        NET.room.presence(OFF).catch(() => { }); if (!NET.nroom && name) setPeers(NET.room.peers ? NET.room.peers() : [], true);
      } else if (NET.mode === 'server' && NET.wsOk) NET.ws.send(JSON.stringify({ t: 'join', room: name }));
    } finally { NET.roomBusy = false; }
  }
  // ---------- ma présence (visible seulement dans la salle du village) ----------
  const OFF = { v: 2, idle: 1, n: null, vil: null, home: null, vis: null, at: null, m: null, x: null, z: null, y: null, r: null, a: null, lk: null, em: null, say: null, g: null, ops: null };
  function myPresence() {
    const p = G.player, m = G.map, s = G.session; if (!p || !m || G.state === 'title' || G.state === 'loading' || !s || !NET.curRoom) return OFF;
    const hs = Math.hypot(p.vx, p.vz), a = p.swim ? 3 : p.vehicle ? 8 : !p.onGround ? 4 : p.sit ? 5 : p.fish ? 6 : p.emote ? 7 : hs > 4.6 ? 2 : hs > .3 ? 1 : 0;
    return { v: 2, idle: null, n: clean(G.playerName, 16), vil: clean(G.villageName, 24), home: NET.me(), vis: NET.visit ? 1 : null, at: NET.nroom ? null : NET.curRoom, m: mapKey(m), x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, y: Math.round(p.y * 100) / 100, r: Math.round(p.yaw * 100) / 100, a, lk: NET.lk || (NET.lk = packLook(p.look)),
      em: p.emote ? p.emote.id : null, say: NET.said && Date.now() - NET.said.t < 15000 ? NET.said : null, g: NET.game || null, ops: !NET.visit && NET.ops.length ? { ses: NET.ses, l: NET.ops } : null };
  }
  function sendPresence(force) {
    const pr = myPresence(), s = JSON.stringify(pr); if (!force && s === NET.lastPres) return; NET.lastPres = s;
    if (NET.mode === 'claude') { const r = NET.nroom || (NET.curRoom ? NET.room : null); if (r) r.presence(pr).catch(() => { }); }
    else if (NET.mode === 'server' && NET.wsOk && NET.curRoom) NET.ws.send(JSON.stringify({ t: 'pres', d: pr }));
  }
  NET.setGame = g => { NET.game = g || null; sendPresence(); };
  // ---------- publication du village (chiffré avec le code ami) ----------
  const ownerTag = (sid, code) => G.sha256('dv-own:' + sid + ':' + code).slice(0, 40);
  NET.publish = async () => {
    const s = G.session; if (!s || !s.code || !G.world || NET.visit || !NET.online() || NET.pubBusy) return; const I = ids(s.code);
    NET.pubBusy = true; NET.pubRev = G.world.rev; NET.pubClosed = NET.closed();
    try {
      if (NET.pubClosed) { await unpublish(s.code, s.sid); return; }
      const homes = {}; for (const r of s.residents || []) { const h = r && r.home && G.interiors[r.home]; if (h) homes[r.home] = h.serialize(); }
      const snap = { v: 2, vil: clean(G.villageName, 24), who: (s.residents || []).filter(Boolean).map(r => clean(r.name, 16)), ses: NET.ses, seq: NET.seq, at: Date.now(), day: G.clock.day, world: G.world.serialize(), homes };
      let rec = await seal(s.code, snap); if (rec.d.length > 240000) { snap.homes = {}; rec = await seal(s.code, snap); }
      if (rec.d.length > 240000) { if (!NET.bigWarn) { NET.bigWarn = 1; G.ui.toast('Ton village est trop grand pour être publié en ligne.'); } return; }
      if (NET.mode === 'claude' && NET.db && NET.uid) {
        const idx = NET.db.doc('towns/' + NET.uid), cur = await idx.get(), d = cur.exists ? cur.data() : {};
        // ancien format (codes en clair) : effacé
        if (Array.isArray(d.list)) for (const t of d.list) if (t && typeof t.sid === 'string') await NET.db.doc('towns/' + NET.uid + '/s/' + t.sid).delete().catch(() => { });
        await NET.db.doc('towns/' + NET.uid + '/s/' + I.doc).set(rec);
        const k = (Array.isArray(d.k) ? d.k : []).filter(x => x !== I.doc).concat([I.doc]).slice(-8);
        if (Array.isArray(d.list) || JSON.stringify(k) !== JSON.stringify(d.k)) await idx.set({ v: 2, k });
      } else if (NET.mode === 'server') await wsReq({ t: 'pub', h: I.doc, ow: ownerTag(s.sid, s.code), rec }, 30000);
    } catch (e) { if (!NET.pubWarn) { NET.pubWarn = 1; console.warn('publication du village impossible', e); } }
    finally { NET.pubBusy = false; }
  };
  async function unpublish(code, sid) {
    const I = ids(code);
    try {
      if (NET.mode === 'claude' && NET.db && NET.uid) { await NET.db.doc('towns/' + NET.uid + '/s/' + I.doc).delete().catch(() => { }); const idx = NET.db.doc('towns/' + NET.uid), cur = await idx.get(); if (cur.exists) { const d = cur.data(), k = (Array.isArray(d.k) ? d.k : []).filter(x => x !== I.doc); if (k.length !== (d.k || []).length) await idx.set({ v: 2, k }); } }
      else if (NET.mode === 'server') await wsReq({ t: 'unpub', h: I.doc, ow: ownerTag(sid, code) });
    } catch (e) { }
  }
  NET.unpublish = unpublish;
  // ---------- trouver un village : uniquement avec son code ----------
  NET.findTown = async code => {
    code = clean(code, 16).toUpperCase().replace(/\s/g, ''); if (!CODE_RE.test(code)) return { err: 'Un code ami ressemble à DV-ABCD-1234.' };
    const I = ids(code);
    try {
      if (NET.mode === 'claude' && NET.db) { const q = await NET.db.collection('towns').where('k', 'array-contains', I.doc).limit(5).get(); let best = null;
        for (const d of q.docs) { const sn = await NET.db.doc('towns/' + d.id + '/s/' + I.doc).get(); if (!sn.exists) continue; try { const snap = await unseal(code, sn.data()); if (!best || (snap.at || 0) > (best.at || 0)) best = snap; } catch (e) { } }
        return best ? { snap: best, code } : { err: 'Aucun village ouvert avec ce code… Vérifie le code : ton ami doit avoir ouvert le jeu, et ses portes, au moins une fois.' }; }
      if (NET.mode === 'server') { const r = await wsReq({ t: 'get', h: I.doc }); if (!r) return { err: 'Aucun village ouvert avec ce code sur ce serveur.' }; try { return { snap: await unseal(code, r), code }; } catch (e) { return { err: e.message === 'navigateur' ? 'Ton navigateur est trop ancien pour ouvrir ce village.' : 'Ce village est illisible.' }; } }
    } catch (e) { return { err: 'Connexion impossible pour le moment.' }; }
    return { err: 'Tu joues hors ligne : ouvre le jeu depuis son lien claude.ai, ou lance le serveur sur ton PC.' };
  };
  // ---------- les modifications de l'hôte suivent en direct chez ses visiteurs ----------
  const GP = G.GMap.prototype, oadd = GP.addObj, orem = GP.removeObj;
  const rec = op => { NET.seq++; op.s = NET.seq; NET.ops.push(op); if (NET.ops.length > 24) NET.ops.shift(); };
  GP.addObj = function (t, tx, tz, r, extra) { const o = oadd.call(this, t, tx, tz, r, extra); if (o && this === G.world && G.state === 'play' && !NET.applying && NET.online()) rec({ k: 'a', t, x: tx, z: tz, r: o.r || 0, v: o.v != null ? o.v : undefined }); return o; };
  GP.removeObj = function (o) { orem.call(this, o); if (this === G.world && G.state === 'play' && !NET.applying && NET.online()) rec({ k: 'r', t: o.t, x: o.x, z: o.z }); };
  function applyOps(pr) {
    const v = NET.visit; if (!v || !pr.ops || !Array.isArray(pr.ops.l)) return; const ses = pr.ops.ses; if (v.opsSes !== ses) { v.opsSes = ses; v.lastSeq = ses === v.ses ? v.seq : 0; }
    const m = v.map; NET.applying = true;
    try { for (const op of pr.ops.l) { if (!op || typeof op.s !== 'number' || op.s <= v.lastSeq || !G.OBJ[op.t] || !m.inb(op.x | 0, op.z | 0)) continue; v.lastSeq = op.s;
      if (op.k === 'r') { const o = m.objAt(op.x, op.z); if (o && o.t === op.t && o.x === op.x && o.z === op.z) m.removeObj(o); }
      else if (op.k === 'a' && !m.objAt(op.x, op.z)) { const ex = {}; if (typeof op.v === 'number') ex.v = op.v; m.addObj(op.t, op.x, op.z, (op.r | 0) & 3, ex); } } }
    finally { NET.applying = false; }
  }
  // ---------- avatars des autres joueurs ----------
  const tagTex = (txt, sub, bg) => { const c = G.cv(256, sub ? 96 : 64), x = c.getContext('2d'); x.font = 'bold 30px Fredoka, Nunito, sans-serif'; const w = Math.min(248, Math.max(x.measureText(txt).width, sub ? 60 : 0) + 30);
    x.fillStyle = bg || 'rgba(255,250,240,.92)'; G.rrect(x, (256 - w) / 2, 6, w, 48, 22); x.fill(); x.fillStyle = '#5a3a22'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 31);
    if (sub) { x.font = 'bold 20px Nunito, sans-serif'; x.fillStyle = '#ffffff'; x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 4; x.strokeText(sub, 128, 76); x.fillText(sub, 128, 76); } const t = new THREE.CanvasTexture(c); return t; };
  const bubbleTex = txt => { const c = G.cv(512, 160), x = c.getContext('2d'); x.font = 'bold 30px Nunito, sans-serif'; const words = txt.split(' '), lines = ['']; for (const w of words) { const t = (lines[lines.length - 1] + ' ' + w).trim(); if (x.measureText(t).width > 440 && lines[lines.length - 1]) { if (lines.length === 3) break; lines.push(w); } else lines[lines.length - 1] = t; }
    const w = Math.min(500, Math.max(...lines.map(l => x.measureText(l).width)) + 40), h = 22 + lines.length * 38; x.fillStyle = '#ffffff'; G.rrect(x, (512 - w) / 2, 4, w, h, 24); x.fill(); x.beginPath(); x.moveTo(236, h + 2); x.lineTo(256, h + 26); x.lineTo(276, h + 2); x.fill();
    x.fillStyle = '#3d2b1d'; x.textAlign = 'center'; x.textBaseline = 'middle'; lines.forEach((l, i) => x.fillText(l, 256, 26 + i * 38)); return new THREE.CanvasTexture(c); };
  const sprite = (tex, w, h, y) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(w, h, 1); s.position.y = y; s.renderOrder = 6; return s; };
  NET.bubble = (root, txt, keep) => { if (root._bub) { root.remove(root._bub); root._bub.material.map.dispose(); } const b = sprite(bubbleTex(txt), 2.3, .72, 2.15); root.add(b); root._bub = b; root._bubT = performance.now() + (keep || 6500); };
  function avatar(id, pr) {
    let a = NET.av.get(id); const lk = JSON.stringify(pr.lk || {});
    if (!a) { a = { id, x: pr.x, z: pr.z, y: pr.y, r: pr.r || 0, walkT: 0 }; NET.av.set(id, a); const b = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); b.frustumCulled = false; b.renderOrder = 1; G.scene.add(b); a.blob = b; }
    if (a.lk !== lk) { if (a.C) G.scene.remove(a.C.root); a.C = G.makeChar({ look: unpackLook(pr.lk) }); G.scene.add(a.C.root); a.lk = lk; a.tagFor = null; }
    const label = clean(pr.n, 16) || 'Joueur', sub = pr.vis ? '✈ ' + clean(pr.vil, 20) : '';
    if (a.tagFor !== label + sub) { if (a.tag) { a.C.root.remove(a.tag); a.tag.material.map.dispose(); } a.tag = sprite(tagTex(label, sub), 1.3, sub ? .49 : .33, 1.62 + (sub ? .08 : 0)); a.C.root.add(a.tag); a.tagFor = label + sub; }
    if (pr.say && pr.say.t !== a.sayT && typeof pr.say.txt === 'string') { a.sayT = pr.say.t; NET.bubble(a.C.root, clean(pr.say.txt, 90)); chatLog(label, clean(pr.say.txt, 90)); G.sfx('pop', .6); }
    return a;
  }
  function dropAvatar(id) { const a = NET.av.get(id); if (!a) return; if (a.C) G.scene.remove(a.C.root); if (a.blob) G.scene.remove(a.blob); NET.av.delete(id); }
  const isHost = pr => !!(NET.visit && pr && pr.home === ids(NET.visit.code).id && !pr.vis);
  function onPeers() {
    for (const id of [...NET.av.keys()]) if (!NET.peers.has(id)) dropAvatar(id);
    for (const p of NET.peers.values()) if (isHost(p.pr)) applyOps(p.pr);
    updBadge();
  }
  const live = pr => pr && pr.v === 2 && !pr.idle;
  NET.peersHere = () => { const out = [], mk = mapKey(G.map); for (const p of NET.peers.values()) if (live(p.pr) && p.pr.m === mk) out.push(p); return out; };
  G.on('frame', dt => {
    const mk = mapKey(G.map), play = G.state === 'play' || G.state === 'pause', now = performance.now();
    for (const p of NET.peers.values()) { const pr = p.pr; let a = NET.av.get(p.id);
      const here = play && live(pr) && pr.m === mk && typeof pr.x === 'number' && typeof pr.z === 'number';
      if (!here) { if (a) { a.C && (a.C.root.visible = false); a.blob.visible = false; } continue; }
      a = avatar(p.id, pr); const C = a.C, k = Math.min(1, dt * 9), tx = pr.x, tz = pr.z, d = Math.hypot(tx - a.x, tz - a.z);
      if (d > 8) { a.x = tx; a.z = tz; } else { a.x += (tx - a.x) * k; a.z += (tz - a.z) * k; } a.y += ((typeof pr.y === 'number' ? pr.y : G.map.topAt(a.x, a.z)) - a.y) * Math.min(1, dt * 12); a.r = G.angLerp(a.r, pr.r || 0, Math.min(1, dt * 10));
      C.root.visible = true; C.root.position.set(a.x, a.y, a.z); C.root.rotation.y = a.r; a.blob.visible = pr.a !== 3; a.blob.position.set(a.x, G.map.topAt(a.x, a.z) + .03, a.z); a.blob.scale.set(.75, 1, .75);
      const moving = pr.a === 1 || pr.a === 2, t = now / 1000; let lL = 0, lR = 0, aL = 0, aR = 0, bob = 0, lean = 0;
      if (moving) { a.walkT += dt * (pr.a === 2 ? 12 : 8); const s = Math.sin(a.walkT), amp = pr.a === 2 ? .95 : .7; lL = s * amp; lR = -s * amp; aL = -s * amp * .85; aR = s * amp * .85; bob = Math.abs(Math.cos(a.walkT)) * .05; lean = pr.a === 2 ? .18 : .05; }
      else if (pr.a === 4) { lL = -.6; lR = .3; aL = aR = -2.4; } else if (pr.a === 5) { lL = lR = -1.45; bob = -.3; } else if (pr.a === 3) { const s = Math.sin(t * 6); aL = -1.4 + s * .9; aR = -1.4 - s * .9; bob = -.05; lean = .55; }
      else if (pr.a === 7) { const e = pr.em; if (e === 'salut') { aR = -2.6 + Math.sin(t * 14) * .25; } else if (e === 'danse') { const s = Math.sin(t * 9); aL = -2.4 + s * .5; aR = -2.4 - s * .5; bob = Math.abs(s) * .08; } else if (e === 'bravo') { aL = aR = -1.4; } else if (e === 'assis' || e === 'dodo') { lL = lR = -1.5; bob = -.3; } else if (e === 'rire') bob = Math.abs(Math.sin(t * 18)) * .04; }
      else bob = Math.sin(t * 2.2 + a.x) * .012;
      C.legL.rotation.x = lL; C.legR.rotation.x = lR; C.armL.rotation.x = aL; C.armR.rotation.x = aR; C.body.position.y = bob; C.body.rotation.x = lean;
      if (C.setExpr) C.setExpr(pr.a === 7 && ['rire', 'danse', 'bravo', 'salut'].includes(pr.em) ? 'happy' : (t + a.x) % 3.4 < .12 ? 'blink' : 'normal');
      if (C.root._bub && now > C.root._bubT) { C.root.remove(C.root._bub); C.root._bub = null; } }
    const pr = G.player && G.player.root; if (pr && pr._bub && now > pr._bubT) { pr.remove(pr._bub); pr._bub = null; }
  });
  G.on('update', dt => {
    if (!NET.online()) return;
    const want = G.session && townCode() ? ids(townCode()).room : null; if (want !== NET.curRoom && !NET.roomBusy) switchRoom(want);
    NET.presT -= dt; if (NET.presT < 0) { NET.presT = .085; sendPresence(); }
    if (G.state === 'play' && !NET.visit && G.session && (NET.pubT -= dt) < 0) { NET.pubT = 20; if (G.world.rev !== NET.pubRev || NET.pubClosed !== NET.closed()) NET.publish(); }
  });
  // à l'écran titre, on quitte la salle du village
  G.on('frame', () => { if (NET.online() && G.state === 'title' && NET.curRoom && !NET.roomBusy) { sendPresence(true); switchRoom(null); } });
  G.on('newGame', () => { NET.lk = null; NET.ops = []; NET.pubT = 4; NET.pubRev = -1; });
  G.on('load', () => { NET.lk = null; NET.ops = []; NET.pubT = 6; NET.pubRev = -1; if (NET.visit) leaveVisit(true); });
  G.on('init', () => { const osl = G.player.setLook.bind(G.player); G.player.setLook = l => { osl(l); NET.lk = null; }; });
  // ---------- discussion ----------
  const chatBox = document.createElement('div'); chatBox.id = 'chatlog'; chatBox.style.cssText = 'position:absolute;left:12px;bottom:calc(96px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:4px;max-width:min(380px,70vw);pointer-events:none;z-index:13';
  const chatIn = document.createElement('div'); chatIn.className = 'card'; chatIn.hidden = true; chatIn.style.cssText = 'position:absolute;left:50%;bottom:calc(110px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:30;display:flex;gap:8px;align-items:center;padding:8px 10px;width:min(520px,92vw)';
  chatIn.innerHTML = '<span style="font-size:20px">💬</span><input id="chat-txt" type="text" maxlength="90" placeholder="Écris un message… (Entrée pour envoyer)" style="flex:1;border:none;border-radius:12px;padding:9px 12px;font:700 15px Nunito,sans-serif;background:#fff;color:#3d2b1d"><button class="btn" id="chat-send" style="padding:7px 14px">Envoyer</button>';
  const badge = document.createElement('button'); badge.id = 'net-badge'; badge.className = 'card'; badge.hidden = true; badge.style.cssText = 'margin-top:6px;border:none;font:700 14px Nunito,sans-serif;color:#3d2b1d;cursor:pointer;padding:6px 12px;pointer-events:auto';
  const homeBtn = document.createElement('button'); homeBtn.className = 'btn'; homeBtn.hidden = true; homeBtn.style.cssText = 'margin-top:6px;padding:6px 12px;font-size:14px;pointer-events:auto'; homeBtn.textContent = '🏠 Rentrer chez moi';
  G.on('init', () => { const h = $('hud'), tr = $('hud-tr') || h; h.appendChild(chatBox); tr.appendChild(badge); tr.appendChild(homeBtn); document.body.appendChild(chatIn); });
  function chatLog(who, txt) { const d = document.createElement('div'); d.className = 'card'; d.style.cssText = 'padding:5px 10px;font:700 13px Nunito,sans-serif;color:#3d2b1d;opacity:.95'; const b = document.createElement('b'); b.textContent = who + ' : '; d.appendChild(b); d.appendChild(document.createTextNode(txt)); chatBox.appendChild(d); while (chatBox.children.length > 5) chatBox.firstChild.remove(); setTimeout(() => d.remove(), 12000); }
  const openChat = () => { if (G.ui.modal || G.state !== 'play') return; chatIn.hidden = false; G.ui.modal = 'chat'; const t = $('chat-txt'); t.value = ''; setTimeout(() => t.focus(), 30); };
  const closeChat = () => { chatIn.hidden = true; if (G.ui.modal === 'chat') G.ui.modal = null; $('chat-txt').blur(); };
  const sendChat = () => { const txt = clean($('chat-txt').value.trim(), 90); closeChat(); if (!txt) return; NET.said = { t: Date.now(), txt }; NET.bubble(G.player.root, txt); chatLog(G.playerName, txt); sendPresence(true); if (!NET.online()) G.ui.toast('Tu es hors ligne : personne ne t\'entend… sauf les papillons.'); };
  document.addEventListener('keydown', e => { if (e.target && e.target.id === 'chat-txt') { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); sendChat(); } if (e.key === 'Escape') { e.preventDefault(); closeChat(); } return; }
    if (e.key === 'Enter' && NET.online() && G.state === 'play' && !G.ui.modal && !(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) { e.preventDefault(); openChat(); } }, true);
  chatIn.addEventListener('click', e => { if (e.target && e.target.id === 'chat-send') sendChat(); });
  // ---------- badge « en ligne » et joueurs du village ----------
  function updBadge() { if (!NET.online()) { badge.hidden = true; return; } const n = [...NET.peers.values()].filter(p => live(p.pr)).length; badge.hidden = G.state !== 'play' && G.state !== 'pause';
    badge.textContent = (NET.mode === 'server' && !NET.wsOk ? '🔌 Connexion…' : '🔒 En ligne') + ' · ' + (n + 1) + ' joueur' + (n ? 's' : '') + ' ici'; }
  G.on('frame', () => { if ((NET.bT = (NET.bT || 0) - 1) < 0) { NET.bT = 30; updBadge(); homeBtn.hidden = !NET.visit || G.state !== 'play'; } });
  badge.onclick = () => openPlayers();
  homeBtn.onclick = () => NET.goHome();
  function openPlayers() {
    G.ui.open('players', NET.visit ? '🔒 Joueurs à ' + NET.visit.vil : '🔒 Joueurs dans ton village'); const body = $('panel-body'), list = [...NET.peers.values()].filter(p => live(p.pr));
    body.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px"></div>'; const box = body.firstChild;
    const row = (name, where) => { const d = document.createElement('div'); d.className = 'ss-card'; d.style.cursor = 'default'; const t = document.createElement('div'); const b = document.createElement('b'); b.textContent = name; const s = document.createElement('small'); s.textContent = where; t.appendChild(b); t.appendChild(s); d.appendChild(t); box.appendChild(d); };
    row(G.playerName + ' (toi)', NET.visit ? 'En visite à ' + NET.visit.vil : 'Chez toi à ' + G.villageName);
    for (const p of list) { const pr = p.pr; row(clean(pr.n, 16) || 'Joueur', isHost(pr) ? 'Habitant·e de ce village' : pr.vis ? 'En visite · vient de ' + clean(pr.vil, 24) : 'Habitant·e de ' + clean(pr.vil, 24)); }
    if (!list.length) { const d = document.createElement('p'); d.style.cssText = 'margin:4px;color:var(--bark);font-weight:700'; d.textContent = 'Personne d\'autre ici pour l\'instant. Donne ton code ami à tes amis : c\'est la seule façon d\'entrer dans ton village.'; box.appendChild(d); }
    const f = $('panel-foot'); f.innerHTML = '<div class="desc">🔒 Villages privés : on ne voit que les joueurs du village où l\'on est. Entrée : discuter.</div>';
  }
  // ---------- visiter un village (code ami obligatoire) ----------
  NET.askVisit = () => {
    G.ui.open('visit', '🚂 Visiter un ami'); const body = $('panel-body');
    body.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px"><label class="fld" style="font-weight:800;color:var(--bark)">CODE AMI DE TON AMI<input id="vs-code" type="text" maxlength="12" placeholder="DV-ABCD-1234" autocomplete="off" spellcheck="false" style="border:none;border-radius:14px;padding:10px 14px;font:700 18px Fredoka,sans-serif;letter-spacing:1px;text-transform:uppercase;background:#fff;color:#3d2b1d"></label><div id="vs-err" class="err"></div>'
      + '<p style="margin:0;color:var(--bark);font-weight:700;font-size:14px">🔒 Les villages sont privés : il n\'y a aucune liste. Seul le code ami permet de trouver un village et d\'y entrer.</p></div>';
    const f = $('panel-foot'); f.innerHTML = '<div class="desc">Ton code ami : <b>' + (myCode() || '—') + '</b> — ne le donne qu\'à tes amis.</div>'; const go = document.createElement('button'); go.className = 'btn'; go.textContent = 'Prendre le train'; f.appendChild(go);
    const inp = $('vs-code'); inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go.click(); }); setTimeout(() => inp.focus(), 50);
    go.onclick = async () => { const c = inp.value.trim().toUpperCase().replace(/\s/g, ''); if (c === myCode()) { $('vs-err').textContent = 'C\'est ton propre code !'; return; } go.disabled = true; $('vs-err').textContent = 'Recherche du village…'; const ok = await NET.visitTown(c, true); go.disabled = false; if (ok && ok.err && $('vs-err')) $('vs-err').textContent = ok.err; };
    if (!NET.online()) $('vs-err').textContent = 'Tu joues hors ligne : ouvre le jeu depuis son lien claude.ai partagé, ou lance « Serveur Douce Vallée » sur ton PC.';
  };
  NET.visitTown = async (code, fromPanel) => {
    code = clean(code, 16).toUpperCase().replace(/\s/g, '');
    if (NET.visit && NET.visit.code === code) { G.ui.toast('Tu es déjà ici !'); return {}; }
    const r = await NET.findTown(code); if (!r || r.err) { if (!fromPanel) G.ui.toast(r ? r.err : 'Village introuvable.'); return r || { err: 'Village introuvable.' }; }
    const sn = r.snap, w = sn && sn.world; if (!w || !(w.W > 16 && w.W < 260 && w.H > 16 && w.H < 260)) return { err: 'Ce village est illisible.' };
    let m; try { m = G.GMap.deserialize(w); } catch (e) { return { err: 'Ce village est illisible.' }; }
    G.ui.closePanel && G.ui.modal === 'panel' && G.ui.closePanel();
    m.id = 'world'; m.kind = 'world'; m.visit = true; G.scene.add(m.group); m.buildAll(); m.group.visible = false;
    if (m.meta.rueGate && G.mapLabel) G.mapLabel(m, '🏬 Rue commerçante', m.meta.rueGate.sx, 3.25, 2.25, 1.1);
    const old = NET.visit; if (old) cleanupVisit(old);
    NET.visit = { code, vil: clean(sn.vil, 24) || 'Village', map: m, homes: sn.homes && typeof sn.homes === 'object' ? sn.homes : {}, interiors: {}, ses: sn.ses, seq: sn.seq || 0, lastSeq: sn.seq || 0, opsSes: sn.ses };
    G.ents.spawnVillagers(m); trainSfx();
    G.ui.fade(() => { const g = m.meta.gare || m.meta.spawn; G.enterMap(m, g.x, (g.z || 0) + .4, 0); G.train && G.train.start(0); G.ui.toast('🚂 Bienvenue à ' + NET.visit.vil + ' ! Rentre quand tu veux avec 🏠 ou par la gare.'); sendPresence(true); }, 1.6);
    return {};
  };
  function cleanupVisit(v) { for (const im of [v.map, ...Object.values(v.interiors)]) { G.scene.remove(im.group); for (const a of G.ents.villagers.slice()) if (a.map === im) { G.scene.remove(a.root); G.scene.remove(a.blob); G.ents.villagers.splice(G.ents.villagers.indexOf(a), 1); } } }
  function leaveVisit(silent) { const v = NET.visit; if (!v) return; cleanupVisit(v); NET.visit = null; if (!silent) sendPresence(true); }
  NET.goHome = () => { if (!NET.visit) return; trainSfx(); G.ui.fade(() => { const g = G.world.meta.gare || G.world.meta.spawn; G.enterMap(G.world, g.x, (g.z || 0) + .4, 0); leaveVisit(); G.train && G.train.start(0); G.ui.toast('🏠 De retour à ' + G.villageName + ' !'); }, 1.6); };
  function trainSfx() { const A = G.audio; if (!A || !A.ok) return; try { const C = A.ctx, t = C.currentTime; for (let i = 0; i < 2; i++) for (const f of [740, 932]) { const o = C.createOscillator(), g = C.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .6); g.gain.linearRampToValueAtTime(.05, t + i * .6 + .04); g.gain.exponentialRampToValueAtTime(.0001, t + i * .6 + .5); o.connect(g); g.connect(A.sfxG); o.start(t + i * .6); o.stop(t + i * .6 + .6); } } catch (e) { } }
  // entrer dans les maisons du village visité (maisons des habitants publiées, boutiques générées)
  const oenter = G.act.enterHouse; G.act.enterHouse = o => {
    const v = NET.visit, cur = G.map; if (!v || !cur.visit) return oenter(o); const d = G.OBJ[o.t], h = G.clock.min / 60; if (d.enter === 'habitant' && (h >= 22 || h < 6)) return G.ui.toast('Chut… tout le monde dort.');
    const key = o.iid || ('b' + o.x + '_' + o.z); let im = v.interiors[key];
    if (!im) { const src = o.iid && v.homes[o.iid]; try { if (src) { im = G.GMap.deserialize(src); G.buildShell(im); im.buildAll(); G.ents.spawnVillagers(im); } else im = G.makeInterior(d.enter, key, {}); } catch (e) { return G.ui.toast('Cette porte est fermée.'); }
      im.isVisit = true; G.scene.add(im.group); im.group.visible = false; v.interiors[key] = im; }
    const [cx, cz] = cur.center(o), F = G.FR[o.r]; im.meta.door = { x: cx + F[0] * (d.fp[1] / 2 + .7), z: cz + F[1] * (d.fp[1] / 2 + .7), yaw: o.r * Math.PI / 2 }; im.meta.title = (o.iid && v.homes[o.iid] ? 'Chez un habitant de ' + v.vil : d.n); im.meta.fromId = 'world';
    if (d.enter === 'musee') G.buildMuseum(im); G.sfx('door'); G.ui.fade(() => G.enterMap(im, Math.floor(im.W / 2) + .5, im.H - 1.4, Math.PI));
  };
  const oexit = G.act.exitHouse; G.act.exitHouse = () => { const im = G.map, v = NET.visit; if (!v || !im.isVisit || G.ui.fading || G.act._exiting) return oexit(); G.act._exiting = true; const b = im.meta.door; G.sfx('door'); G.ui.fade(() => { G.enterMap(v.map, b.x, b.z, b.yaw); G.act._exiting = false; }); };
  const osleep = G.act.sleep; G.act.sleep = () => { if (G.map && G.map.isVisit) return G.ui.toast('Ce n\'est pas ton lit ! Rentre chez toi pour dormir.'); return osleep(); };
  G.on('init', () => {
    const lk = G.isLockedMap; G.isLockedMap = m => lk(m) || !!(m && (m.visit || m.isVisit));
    // pendant une visite, la sauvegarde nous range à la gare de notre propre village
    const os = G.serialize; G.serialize = () => { const out = os(); if (NET.visit && out.player) { const g = G.world.meta.gare || G.world.meta.spawn; out.player = Object.assign({}, out.player, { map: 'world', x: g.x, z: (g.z || 0) + .4, veh: null }); if (out.residents && out.residents[out.rid]) out.residents[out.rid].player = out.player; } return out; };
    const ott = G.toTitle; G.toTitle = () => { if (NET.visit) { const g = G.world.meta.gare || G.world.meta.spawn; G.enterMap(G.world, g.x, (g.z || 0) + .4, 0); leaveVisit(); } ott(); };
  });
  // ---------- portes du village : ouvertes (avec le code) ou fermées ----------
  NET.setClosed = closed => { const s = G.session, rec = s && G.sessions.get(s.sid); if (!rec) return; rec.closed = closed ? 1 : 0; G.sessions.put(rec); NET.pubT = 0; if (closed && NET.online()) unpublish(s.code, s.sid); };
  // ---------- nouveau code ami (l'ancien ne marche plus) ----------
  NET.newCode = rec => { const old = rec.code; rec.code = G.sessions.newCode(); G.sessions.put(rec); if (G.session && G.session.sid === rec.sid) G.session.code = rec.code; if (NET.online() && old) unpublish(old, rec.sid); NET.pubRev = -1; NET.pubT = 2; return rec.code; };
  // Pablo et le capitaine connaissent les visites
  // Dialogue pour configurer le serveur mondial
  NET.askServerUrl = () => {
    const cur = NET.remoteUrl || (() => { try { return localStorage.getItem('dv_server_url'); } catch(e) { return ''; } })() || '';
    G.ui.open('server-cfg', '🌍 Serveur mondial');
    const body = G.el('panel-body');
    const serverStatus = NET.mode === 'server' ? (NET.remoteUrl ? '🌍 Connecté à ' + NET.remoteUrl : '💻 Serveur local (' + location.hostname + ')') : (NET.mode === 'claude' ? '☁️ Mode claude.ai' : '📴 Hors ligne');
    body.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<p style="margin:0;color:var(--bark);font-weight:700">État : ' + serverStatus + '</p>'
      + '<label class="fld" style="font-weight:800;color:var(--bark)">URL DU SERVEUR RENDER (ex: https://douce-vallee.onrender.com)<input id="srv-url" type="url" maxlength="120" placeholder="https://votre-app.onrender.com" autocomplete="off" spellcheck="false" style="border:none;border-radius:14px;padding:10px 14px;font:700 15px Nunito,sans-serif;background:#fff;color:#3d2b1d" value="' + (NET.remoteUrl || '') + '"></label>'
      + '<p style="margin:0;color:var(--bark);font-size:13px;font-weight:700">💡 Déploie serve.js sur <b>Render.com</b> (gratuit) pour jouer depuis n\'importe où dans le monde, même en Afrique ! Ton PC n\'a pas besoin d\'être allumé.</p>'
      + '<div id="srv-err" class="err"></div></div>';
    const f = G.el('panel-foot');
    f.innerHTML = '';
    const go = document.createElement('button'); go.className = 'btn'; go.textContent = '🌍 Connecter';
    const clear = document.createElement('button'); clear.className = 'btn alt'; clear.textContent = 'Supprimer l\'URL';
    f.appendChild(clear); f.appendChild(go);
    const inp = G.el('srv-url');
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go.click(); });
    go.onclick = async () => { go.disabled = true; await NET.setRemoteServer(inp.value); go.disabled = false; G.ui.closePanel && G.ui.closePanel(); };
    clear.onclick = async () => { await NET.setRemoteServer(''); G.ui.closePanel && G.ui.closePanel(); };
    setTimeout(() => inp.focus(), 50);
  };
  G.npcRoles.gare = v => {
    if (NET.visit && G.map.visit) return G.npcSay(v, ['Bienvenue à ' + NET.visit.vil + ' ! Tu es venu·e en visite, hi hi !'], ['Rentrer chez moi', 'Rester encore']).then(k => { if (k === 0) NET.goHome(); });
    const closed = NET.closed();
    const serverInfo = NET.mode === 'server' && NET.remoteUrl ? ' (🌍 Serveur mondial actif)' : NET.mode === 'solo' ? ' (📴 Hors ligne — configure un serveur mondial !)' : '';
    return G.npcSay(v, ['Bienvenue à la gare de ' + G.villageName + ' ! Hi hi !' + serverInfo, 'Ton code ami : ' + (myCode() || '—') + '. Ne le donne qu\'à tes amis : sans lui, personne ne peut entrer.' + (closed ? ' (Tes portes sont fermées en ce moment.)' : '')],
      ['Visiter un ami', closed ? 'Ouvrir mon village aux amis' : 'Fermer mon village', 'Attendre le prochain train', 'Utiliser les casiers', '🌍 Serveur mondial (Render)', 'Au revoir']).then(k => {
      if (k === 0) return NET.askVisit();
      if (k === 1) { NET.setClosed(!closed); return G.npcSay(v, closed ? ['C\'est ouvert ! Tes amis peuvent venir avec ton code ami.'] : ['C\'est fermé. Plus personne ne peut venir, même avec ton code. Reviens me voir pour rouvrir !']); }
      if (k === 2) { const ok = G.train && G.train.start(4); return G.npcSay(v, ok ? ['Le train arrive dans un instant ! Sors vite sur le quai, hi hi !'] : ['Un train est déjà en gare !']); }
      if (k === 3) G.ui.openStorage();
      if (k === 4) NET.askServerUrl();
    });
  };
  G.on('init', () => { const ont = G.npcTalk; G.npcTalk = v => { if (NET.visit && v.npc === 'capitaine') return G.npcSay(v, ['Coâ ! Mon bateau n\'emmène que les habitants de ce village. Reviens avec ton propre capitaine !']); return ont(v); }; });
  // ---------- démarrage ----------
  G.on('init', async () => { const ok = await bootClaude() || await bootServer(); if (ok) { NET.presT = 0; updBadge(); console.log('Douce Vallée : jeu en ligne actif (' + NET.mode + ')'); } });
})();
