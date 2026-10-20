// Serveur Douce Vallée : sert le jeu ET permet de jouer en ligne, en privé.
// Chaque village a sa salle, dont le nom est une empreinte du code ami : le code lui-même n'arrive jamais ici,
// les villages sont stockés chiffrés, et il n'existe aucune liste. Sans le code ami, on ne trouve rien.
// Sur ton PC :  node serve.js [dossier] [port]   puis ouvrir http://localhost:5180 (ou http://IP-du-PC:5180 pour les amis)
// Sur Render :  « node serve.js » — Render fournit le port (PORT). Les villages sont gardés en mémoire (ou dans /data si un disque est monté).
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), zlib = require('zlib');
const VER = '9.1';
const root = path.resolve(process.argv[2] || __dirname), PORT = +(process.env.PORT || process.argv[3] || 5180), ON_RENDER = !!process.env.RENDER;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const DATA = path.join(fs.existsSync('/data') ? '/data' : root, 'douce-vallee-serveur.json');
// la ville commune (façon serveur Minecraft) : une seule ville pour tous les joueurs, gardée ici — sa carte de départ, puis chaque construction
const COMMUNE = 't' + 'c0'.repeat(20), CMAX = 120000;
let towns = {}, commune = { base: null, bseq: 0, seq: 0, ops: [] }, accts = {}; try { const d = JSON.parse(fs.readFileSync(DATA, 'utf8')); if (d.v === 2 || d.v === 3) { towns = d.towns || {}; if (d.commune && d.commune.base) commune = d.commune; accts = d.accts || {}; } } catch (e) { } // l'ancien format (codes en clair) est oublié
// écriture atomique (fichier temporaire puis renommage) : une coupure en pleine écriture ne corrompt jamais les données
let saveT = null; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { const tmp = DATA + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ v: 3, towns, commune, accts }), { mode: 0o600 }); fs.renameSync(tmp, DATA); } catch (e) { console.error('écriture impossible', e.message); } }, 1500); };
// le « poivre » : un secret propre au serveur (variable DV_PEPPER, sinon un fichier créé une fois), mêlé à chaque empreinte de mot de passe.
// Même si quelqu'un volait le fichier des comptes, sans ce secret il ne pourrait rien essayer.
const PEPPER = (() => { const e = process.env.DV_PEPPER; if (e && e.length >= 32) return Buffer.from(e); const kf = DATA + '.key'; try { const k = fs.readFileSync(kf); if (k.length >= 32) return k; } catch (x) { }
  const k = crypto.randomBytes(48); try { fs.writeFileSync(kf, k, { mode: 0o600 }); } catch (x) { } return k; })();
// le jeu ouvert depuis le fichier (ou un autre site) peut aussi joindre ce serveur
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()', 'Cross-Origin-Opener-Policy': 'same-origin' };
if (ON_RENDER) SEC['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'; // toujours en https sur Render
const ipOf = req => String((req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim().slice(0, 64);
const isLocal = req => { const a = (req.socket && req.socket.remoteAddress) || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'; };

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  for (const k in CORS) res.setHeader(k, CORS[k]); for (const k in SEC) res.setHeader(k, SEC[k]);
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  if (p === '/api/ping') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true, server: 'douce-vallee', v: 2, ver: VER })); }
  // captures d'écran des tests : seulement depuis ce PC, jamais sur Render
  if (req.method === 'POST' && p === '/shot') { if (ON_RENDER || !isLocal(req)) { res.writeHead(403); return res.end(); }
    let b = ''; req.on('data', c => { b += c; if (b.length > 2e7) req.destroy(); }); req.on('end', () => { const name = (req.url.split('?')[1] || 'shot').replace(/[^a-z0-9_-]/gi, '').slice(0, 40); try { fs.writeFileSync(path.join(process.env.SHOTDIR || root, name + '.jpg'), Buffer.from(String(b).split(',')[1] || '', 'base64')); } catch (e) { } res.end('ok'); }); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  const f = path.join(root, p), rel = path.relative(root, f);
  // rien en dehors du dossier du jeu, aucun fichier caché (.git…), ni les données du serveur, ni le code du serveur
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some(s => s.startsWith('.')) || path.basename(f).startsWith('douce-vallee-serveur') || rel === 'serve.js' || rel === 'package.json') { res.writeHead(403); return res.end(); }
  // fichiers du jeu : compressés (gzip, environ 5 fois plus légers) et gardés en mémoire ; le navigateur les garde aussi et ne les retélécharge que s'ils ont changé
  fs.stat(f, (se, st) => { if (se || !st.isFile()) { res.writeHead(404); return res.end('404'); }
    const tag = 'W/"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"', ext = path.extname(f), zip = /^\.(js|html|css|json|svg|txt)$/.test(ext) && /gzip/.test(req.headers['accept-encoding'] || '');
    if (req.headers['if-none-match'] === tag) { res.writeHead(304, { ETag: tag, 'Cache-Control': 'no-cache' }); return res.end(); }
    const c = FCACHE.get(f); if (c && c.tag === tag && (!zip || c.gz)) return sendFile(res, req, f, p, c, zip);
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    if (p === '/index.html' && !/^\s*<!doctype/i.test(data.slice(0, 64).toString())) data = Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8">'), data]);
    const ent = { tag, data, gz: zip ? zlib.gzipSync(data, { level: 9 }) : null }; if (data.length < 8e6) FCACHE.set(f, ent); sendFile(res, req, f, p, ent, zip);
  }); });
});
const FCACHE = new Map();
function sendFile(res, req, f, p, ent, zip) { const h = { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ETag: ent.tag, Vary: 'Accept-Encoding' };
  const body = zip && ent.gz ? ent.gz : ent.data; if (zip && ent.gz) h['Content-Encoding'] = 'gzip'; h['Content-Length'] = body.length; res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body); }

// ---------- WebSocket minimal (aucune dépendance) ----------
const clients = new Map(); let N = 0;
const frame = str => { const d = Buffer.from(str), n = d.length; let h; if (n < 126) h = Buffer.from([0x81, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); } else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); } return Buffer.concat([h, d]); };
const send = (c, obj) => { try { c.sock.write(frame(JSON.stringify(obj))); } catch (e) { } };
// envoi aux seuls joueurs d'une même salle (= d'un même village)
const inRoom = (room, obj, except) => { if (!room) return; const fr = frame(JSON.stringify(obj)); for (const c of clients.values()) if (c !== except && c.room === room) try { c.sock.write(fr); } catch (e) { } };
const okRoom = r => typeof r === 'string' && /^t[0-9a-f]{40}$/.test(r), okH = h => typeof h === 'string' && /^[0-9a-f]{40}$/.test(h);
function leave(c) { if (c.room) inRoom(c.room, { t: 'left', id: c.id }, c); c.room = null; c.pres = null; }
function readFrame(c) {
  const b = c.buf; if (b.length < 2) return null; const op = b[0] & 15, fin = !!(b[0] & 128), masked = !!(b[1] & 128); let len = b[1] & 127, off = 2;
  if (len === 126) { if (b.length < 4) return null; len = b.readUInt16BE(2); off = 4; } else if (len === 127) { if (b.length < 10) return null; len = Number(b.readBigUInt64BE(2)); off = 10; }
  if (len > 8 * 1024 * 1024) { c.sock.destroy(); return null; }
  const mk = masked ? 4 : 0; if (b.length < off + mk + len) return null; let data = Buffer.from(b.slice(off + mk, off + mk + len));
  if (masked) { const m = b.slice(off, off + 4); for (let i = 0; i < data.length; i++) data[i] ^= m[i & 3]; }
  c.buf = b.slice(off + mk + len); return { op, fin, data };
}
// ===================== COMPTES EN LIGNE (sessions qui tournent sur le serveur) =====================
// Le mot de passe ne quitte JAMAIS l'ordinateur du joueur : son jeu en tire, par PBKDF2 (150 000 tours), une « preuve » (k) et une clé de
// chiffrement (que le serveur ne voit pas). Ici, la preuve n'est jamais gardée telle quelle : on garde scrypt(HMAC(poivre, preuve), sel)
// — lent, gourmand en mémoire, salé, poivré. La sauvegarde arrive déjà chiffrée : le serveur ne peut pas la lire.
// Contre les essais en masse : 5 erreurs bloquent le compte (15 min, puis de plus en plus longtemps), et chaque adresse est limitée.
const HEX64 = /^[0-9a-f]{64}$/, HEX32 = /^[0-9a-f]{32}$/, SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const tokens = new Map(), hits = new Map(); let busy = 0; const waitQ = [];
const hit = (key, max, win) => { const now = Date.now(), l = (hits.get(key) || []).filter(t => now - t < win); l.push(now); hits.set(key, l); return l.length <= max; };
function scryptHash(k, salt) { return new Promise((ok, ko) => { const run = () => { busy++; crypto.scrypt(crypto.createHmac('sha256', PEPPER).update(k).digest(), salt, 32, SCRYPT, (e, h) => { busy--; if (waitQ.length) waitQ.shift()(); e ? ko(e) : ok(h); }); };
  if (busy < 2) run(); else if (waitQ.length < 60) waitQ.push(run); else ko(new Error('occupé')); }); }
const newToken = a => { const t = crypto.randomBytes(32).toString('hex'); tokens.set(crypto.createHash('sha256').update(t).digest('hex'), { a, exp: Date.now() + 12 * 3600 * 1000 }); return t; };
const tokAcct = t => { if (typeof t !== 'string' || !HEX64.test(t)) return null; const e = tokens.get(crypto.createHash('sha256').update(t).digest('hex')); return e && e.exp > Date.now() && accts[e.a] ? e.a : null; };
const okBlob = b => b && typeof b === 'object' && b.v === 3 && typeof b.n === 'string' && typeof b.d === 'string' && typeof b.t === 'string' && b.n.length < 40 && b.t.length < 80 && b.d.length < 8e6;
async function account(c, m) { const reply = d => send(c, { t: 'res', rid: m.rid, data: d });
  if (m.t === 'asalt') { // le sel du mot de passe de ce compte (il ne change pas quand on change de code ami)
    if (!hit('salt:' + c.ip, 60, 10 * 60000)) return reply({ err: 'trop' }); if (!HEX64.test(m.a || '')) return reply({ err: 'format' }); const A = accts[m.a]; return reply(A ? { ok: 1, ps: A.ps } : { ok: 1, none: 1 }); }
  if (m.t === 'alog') { // se connecter (ou créer le compte la première fois)
    if (!hit('ip:' + c.ip, 30, 10 * 60000)) return reply({ err: 'trop' }); if (!HEX64.test(m.a || '') || !HEX64.test(m.k || '')) return reply({ err: 'format' });
    const A = accts[m.a], now = Date.now(), k = Buffer.from(m.k, 'hex');
    if (!A) { if (!m.c) return reply({ err: 'inconnu' }); if (!HEX32.test(m.ps || '')) return reply({ err: 'format' }); if (Object.keys(accts).length >= 20000) return reply({ err: 'plein' });
      const salt = crypto.randomBytes(16); let h; try { h = await scryptHash(k, salt); } catch (e) { return reply({ err: 'occupe' }); } if (accts[m.a]) return reply({ err: 'deja' });
      accts[m.a] = { ps: m.ps, s: salt.toString('hex'), h: h.toString('hex'), at: 0, seen: now, fails: 0, locks: 0, lock: 0, b: null }; persist(); return reply({ ok: 1, tok: newToken(m.a), at: 0, nouveau: 1 }); }
    if (A.lock > now) return reply({ err: 'bloque', s: Math.ceil((A.lock - now) / 1000) });
    let h; try { h = await scryptHash(k, Buffer.from(A.s, 'hex')); } catch (e) { return reply({ err: 'occupe' }); }
    if (!crypto.timingSafeEqual(h, Buffer.from(A.h, 'hex'))) { A.fails = (A.fails || 0) + 1; if (A.fails >= 5) { A.locks = (A.locks || 0) + 1; A.lock = now + Math.min(24 * 3600e3, 15 * 60e3 * Math.pow(2, A.locks - 1)); A.fails = 0; } persist(); return reply({ err: 'mdp' }); }
    A.fails = 0; A.locks = 0; A.lock = 0; A.seen = now; persist(); return reply({ ok: 1, tok: newToken(m.a), at: A.at || 0 }); }
  const a = tokAcct(m.tok); if (!a) return reply({ err: 'jeton' }); const A = accts[a];
  if (m.t === 'asav') { if (!okBlob(m.b) || !Number.isFinite(m.at)) return reply({ err: 'format' }); if (!hit('sav:' + a, 30, 60000)) return reply({ err: 'trop' }); A.b = { v: 3, z: m.b.z ? 1 : 0, n: m.b.n, d: m.b.d, t: m.b.t }; A.at = m.at; A.seen = Date.now(); persist(); return reply({ ok: 1 }); }
  if (m.t === 'aget') return reply({ ok: 1, b: A.b, at: A.at || 0 });
  if (m.t === 'aren') { if (!HEX64.test(m.a2 || '') || accts[m.a2]) return reply({ err: 'format' }); accts[m.a2] = A; delete accts[a]; for (const e of tokens.values()) if (e.a === a) e.a = m.a2; persist(); return reply({ ok: 1 }); } // nouveau code ami
  if (m.t === 'adel') { delete accts[a]; for (const [h, e] of tokens) if (e.a === a) tokens.delete(h); persist(); return reply({ ok: 1 }); }
}
function onMessage(c, txt) {
  let m; try { m = JSON.parse(txt); } catch (e) { return; } if (!m || typeof m !== 'object') return;
  if (m.t === 'asalt' || m.t === 'alog' || m.t === 'asav' || m.t === 'aget' || m.t === 'aren' || m.t === 'adel') { account(c, m).catch(() => send(c, { t: 'res', rid: m.rid, data: { err: 'serveur' } })); return; }
  if (m.t === 'join') { const r = okRoom(m.room) ? m.room : null; if (r === c.room) return; leave(c); c.room = r; if (r) for (const o of clients.values()) if (o !== c && o.room === r && o.pres) send(c, { t: 'pres', id: o.id, d: o.pres }); }
  else if (m.t === 'pres') { if (!c.room || JSON.stringify(m.d || null).length > 8000) return; c.pres = m.d;
    // même page reconnectée : l'ancienne connexion (fantôme) est fermée, pour ne pas voir le joueur en double
    const pid = m.d && m.d.pid; if (pid) for (const o of clients.values()) if (o !== c && o.pres && o.pres.pid === pid) { leave(o); try { o.sock.destroy(); } catch (e) { } clients.delete(o.id); }
    inRoom(c.room, { t: 'pres', id: c.id, d: m.d }, c); }
  // publier : seul le premier qui a publié ce village (son « propriétaire ») peut le remplacer ou le retirer
  // le village est gardé tel quel, avec son format (v3 : chiffré ET signé — sans sa signature « t », plus personne ne pourrait l'ouvrir)
  else if (m.t === 'pub') { const t = towns[m.h], r = m.rec, v3 = !!(r && r.v === 3), ok = okH(m.h) && okH(m.ow) && r && typeof r.d === 'string' && typeof r.n === 'string' && r.d.length < 3e6 && r.n.length < 40 && (!v3 || (typeof r.t === 'string' && r.t.length < 80)) && (t ? t.ow === m.ow : Object.keys(towns).length < 5000);
    if (ok) { towns[m.h] = { ow: m.ow, rec: v3 ? { v: 3, z: r.z ? 1 : 0, n: r.n, d: r.d, t: r.t } : { v: 2, z: r.z ? 1 : 0, n: r.n, d: r.d }, at: Date.now() }; persist(); } send(c, { t: 'res', rid: m.rid, data: !!ok }); }
  else if (m.t === 'unpub') { const t = towns[m.h], ok = okH(m.h) && t && t.ow === m.ow; if (ok) { delete towns[m.h]; persist(); } send(c, { t: 'res', rid: m.rid, data: !!ok }); }
  else if (m.t === 'get') send(c, { t: 'res', rid: m.rid, data: okH(m.h) && towns[m.h] ? towns[m.h].rec : null });
  // ---------- la ville commune : on lit la ville (carte de départ + constructions), on la crée, on construit ----------
  else if (m.t === 'cget') { const from = typeof m.from === 'number' && m.from >= commune.bseq && m.from <= commune.seq ? m.from : null;
    send(c, { t: 'res', rid: m.rid, data: { has: !!commune.base, base: from == null ? commune.base : null, bseq: commune.bseq, seq: commune.seq, ops: commune.ops.filter(e => e.s > (from == null ? commune.bseq : from)) } }); }
  else if (m.t === 'cbase') { const r = m.rec, ok = !!(r && typeof r === 'object' && r.kind === 'world' && typeof r.lvl === 'string' && Array.isArray(r.objs) && r.W > 16 && r.W < 1300 && r.H > 16 && r.H < 1000 && JSON.stringify(r).length < 7e6
      && (!commune.base || (m.seq === commune.seq && commune.ops.length > 3000))); // créée une seule fois ; ensuite seulement « tassée » quand les constructions s'accumulent
    if (ok) { commune.base = r; commune.bseq = commune.seq; commune.ops = []; persist(); } send(c, { t: 'res', rid: m.rid, data: ok }); }
  else if (m.t === 'cop') { if (!commune.base || !Array.isArray(m.ops) || commune.ops.length >= CMAX) return; const now = Date.now(); c.cw = c.cw && now - c.cw.t < 1000 ? c.cw : { t: now, n: 0 };
    const out = []; for (const o of m.ops.slice(0, 40)) { if (++c.cw.n > 80) break; // 80 changements par seconde au plus par joueur
      if (!o || typeof o !== 'object' || !['a', 'r', 't'].includes(o.k) || !Number.isInteger(o.x) || !Number.isInteger(o.z) || JSON.stringify(o).length > 400 || (o.k !== 't' && (typeof o.t !== 'string' || o.t.length > 40))) continue;
      const e = { s: ++commune.seq, o }; commune.ops.push(e); out.push(e); }
    if (out.length) { inRoom(COMMUNE, { t: 'cop', l: out }); persist(); } }
}
server.on('upgrade', (req, sock) => {
  if (req.url.split('?')[0] !== '/ws') return sock.destroy(); const key = req.headers['sec-websocket-key']; if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n'); sock.setNoDelay(true);
  const ip = ipOf(req); let same = 0; for (const o of clients.values()) if (o.ip === ip) same++; if (same >= 16) return sock.destroy(); // 16 connexions au plus par adresse
  const c = { id: ++N, sock, ip, buf: Buffer.alloc(0), parts: [], pres: null, room: null, last: Date.now(), win: Date.now(), msgs: 0 }; clients.set(c.id, c);
  sock.on('data', d => { c.last = Date.now(); c.buf = Buffer.concat([c.buf, d]); let f;
    while ((f = readFrame(c))) { if (f.op === 8) { try { sock.end(Buffer.from([0x88, 0])); } catch (e) { } return; }
      if (f.op === 9) { try { sock.write(Buffer.concat([Buffer.from([0x8a, f.data.length]), f.data])); } catch (e) { } continue; }
      if (f.op === 1 || f.op === 0) { const now = Date.now(); if (now - c.win > 10000) { c.win = now; c.msgs = 0; } if (++c.msgs > 600) { try { sock.destroy(); } catch (e) { } return; } // un déluge de messages : coupé
        c.parts.push(f.data); if (f.fin) { const txt = Buffer.concat(c.parts).toString(); c.parts = []; onMessage(c, txt); } } } });
  const bye = () => { if (!clients.has(c.id)) return; leave(c); clients.delete(c.id); };
  sock.on('close', bye); sock.on('end', bye); sock.on('error', bye);
});
// connexions muettes depuis 90 s (onglet fermé brutalement, réseau coupé) : on les ferme, et le joueur disparaît chez les autres
setInterval(() => { const lim = Date.now() - 90000; for (const c of [...clients.values()]) if (c.last < lim) { leave(c); try { c.sock.destroy(); } catch (e) { } clients.delete(c.id); } }, 10000);
// les villages qui ne sont plus publiés depuis 7 jours sont oubliés (leurs propriétaires les republient en jouant)
setInterval(() => { const lim = Date.now() - 7 * 24 * 3600 * 1000; let n = 0; for (const h in towns) if (towns[h].at < lim) { delete towns[h]; n++; } if (n) persist(); }, 3600 * 1000);
// jetons expirés et compteurs d'essais anciens : nettoyés ; comptes abandonnés depuis 1 an : oubliés
setInterval(() => { const now = Date.now(); for (const [h, e] of tokens) if (e.exp < now) tokens.delete(h); for (const [k, l] of hits) if (!l.length || now - l[l.length - 1] > 3600e3) hits.delete(k); let n = 0; for (const a in accts) if (now - (accts[a].seen || 0) > 365 * 24 * 3600e3) { delete accts[a]; n++; } if (n) persist(); }, 10 * 60 * 1000);
// en ligne 24 h/24 : sur Render (offre gratuite), le serveur s'endort après 15 min sans visite ; il se rend donc visite toutes les 10 min
// par son adresse publique (un réveil extérieur tourne aussi sur GitHub : .github/workflows/reveil.yml)
if (ON_RENDER && process.env.RENDER_EXTERNAL_URL) setInterval(() => { try { require('https').get(process.env.RENDER_EXTERNAL_URL + '/api/ping', r => r.resume()).on('error', () => { }); } catch (e) { } }, 10 * 60 * 1000);
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🌿 Douce Vallée ' + VER + ' — serveur prêt !\n  Sur ce PC :              http://localhost:' + PORT);
  if (!ON_RENDER) for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log('  Amis sur le même Wi-Fi : http://' + a.address + ':' + PORT);
  if (process.env.RENDER_EXTERNAL_URL) console.log('  🌍 Adresse mondiale (Render) : ' + process.env.RENDER_EXTERNAL_URL);
  console.log('  🔒 Villages privés : on n\'entre chez quelqu\'un qu\'avec son code ami. Comptes en ligne : mots de passe jamais envoyés, empreintes scrypt salées et poivrées.');
  if (!ON_RENDER) console.log('  (Ferme cette fenêtre pour arrêter le serveur.)\n');
});
