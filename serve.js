// Serveur Douce Vallée : sert le jeu ET permet de jouer en ligne, en privé.
// Chaque village a sa salle, dont le nom est une empreinte du code ami : le code lui-même n'arrive jamais ici,
// les villages sont stockés chiffrés, et il n'existe aucune liste. Sans le code ami, on ne trouve rien.
// Sur ton PC :  node serve.js [dossier] [port]   puis ouvrir http://localhost:5180 (ou http://IP-du-PC:5180 pour les amis)
// Sur Render :  « node serve.js » — Render fournit le port (PORT). Les villages sont gardés en mémoire (ou dans /data si un disque est monté).
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const VER = '8.2';
const root = path.resolve(process.argv[2] || __dirname), PORT = +(process.env.PORT || process.argv[3] || 5180), ON_RENDER = !!process.env.RENDER;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const DATA = path.join(fs.existsSync('/data') ? '/data' : root, 'douce-vallee-serveur.json');
let towns = {}; try { const d = JSON.parse(fs.readFileSync(DATA, 'utf8')); if (d.v === 2) towns = d.towns || {}; } catch (e) { } // l'ancien format (codes en clair) est oublié
let saveT = null; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.writeFileSync(DATA, JSON.stringify({ v: 2, towns })); } catch (e) { console.error('écriture impossible', e.message); } }, 1500); };
// le jeu ouvert depuis le fichier (ou un autre site) peut aussi joindre ce serveur
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const isLocal = req => { const a = (req.socket && req.socket.remoteAddress) || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'; };

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  for (const k in CORS) res.setHeader(k, CORS[k]);
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
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    if (p === '/index.html' && !/^\s*<!doctype/i.test(data.slice(0, 64).toString())) data = Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8">'), data]);
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : data);
  });
});

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
function onMessage(c, txt) {
  let m; try { m = JSON.parse(txt); } catch (e) { return; } if (!m || typeof m !== 'object') return;
  if (m.t === 'join') { const r = okRoom(m.room) ? m.room : null; if (r === c.room) return; leave(c); c.room = r; if (r) for (const o of clients.values()) if (o !== c && o.room === r && o.pres) send(c, { t: 'pres', id: o.id, d: o.pres }); }
  else if (m.t === 'pres') { if (!c.room || JSON.stringify(m.d || null).length > 8000) return; c.pres = m.d;
    // même page reconnectée : l'ancienne connexion (fantôme) est fermée, pour ne pas voir le joueur en double
    const pid = m.d && m.d.pid; if (pid) for (const o of clients.values()) if (o !== c && o.pres && o.pres.pid === pid) { leave(o); try { o.sock.destroy(); } catch (e) { } clients.delete(o.id); }
    inRoom(c.room, { t: 'pres', id: c.id, d: m.d }, c); }
  // publier : seul le premier qui a publié ce village (son « propriétaire ») peut le remplacer ou le retirer
  else if (m.t === 'pub') { const t = towns[m.h], ok = okH(m.h) && okH(m.ow) && m.rec && typeof m.rec.d === 'string' && typeof m.rec.n === 'string' && m.rec.d.length < 3e6 && (t ? t.ow === m.ow : Object.keys(towns).length < 5000);
    if (ok) { towns[m.h] = { ow: m.ow, rec: { v: 2, z: m.rec.z ? 1 : 0, n: m.rec.n, d: m.rec.d }, at: Date.now() }; persist(); } send(c, { t: 'res', rid: m.rid, data: !!ok }); }
  else if (m.t === 'unpub') { const t = towns[m.h], ok = okH(m.h) && t && t.ow === m.ow; if (ok) { delete towns[m.h]; persist(); } send(c, { t: 'res', rid: m.rid, data: !!ok }); }
  else if (m.t === 'get') send(c, { t: 'res', rid: m.rid, data: okH(m.h) && towns[m.h] ? towns[m.h].rec : null });
}
server.on('upgrade', (req, sock) => {
  if (req.url.split('?')[0] !== '/ws') return sock.destroy(); const key = req.headers['sec-websocket-key']; if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n'); sock.setNoDelay(true);
  const c = { id: ++N, sock, buf: Buffer.alloc(0), parts: [], pres: null, room: null, last: Date.now() }; clients.set(c.id, c);
  sock.on('data', d => { c.last = Date.now(); c.buf = Buffer.concat([c.buf, d]); let f;
    while ((f = readFrame(c))) { if (f.op === 8) { try { sock.end(Buffer.from([0x88, 0])); } catch (e) { } return; }
      if (f.op === 9) { try { sock.write(Buffer.concat([Buffer.from([0x8a, f.data.length]), f.data])); } catch (e) { } continue; }
      if (f.op === 1 || f.op === 0) { c.parts.push(f.data); if (f.fin) { const txt = Buffer.concat(c.parts).toString(); c.parts = []; onMessage(c, txt); } } } });
  const bye = () => { if (!clients.has(c.id)) return; leave(c); clients.delete(c.id); };
  sock.on('close', bye); sock.on('end', bye); sock.on('error', bye);
});
// connexions muettes depuis 90 s (onglet fermé brutalement, réseau coupé) : on les ferme, et le joueur disparaît chez les autres
setInterval(() => { const lim = Date.now() - 90000; for (const c of [...clients.values()]) if (c.last < lim) { leave(c); try { c.sock.destroy(); } catch (e) { } clients.delete(c.id); } }, 10000);
// les villages qui ne sont plus publiés depuis 7 jours sont oubliés (leurs propriétaires les republient en jouant)
setInterval(() => { const lim = Date.now() - 7 * 24 * 3600 * 1000; let n = 0; for (const h in towns) if (towns[h].at < lim) { delete towns[h]; n++; } if (n) persist(); }, 3600 * 1000);
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🌿 Douce Vallée ' + VER + ' — serveur prêt !\n  Sur ce PC :              http://localhost:' + PORT);
  if (!ON_RENDER) for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log('  Amis sur le même Wi-Fi : http://' + a.address + ':' + PORT);
  if (process.env.RENDER_EXTERNAL_URL) console.log('  🌍 Adresse mondiale (Render) : ' + process.env.RENDER_EXTERNAL_URL);
  console.log('  🔒 Villages privés : on n\'entre chez quelqu\'un qu\'avec son code ami.');
  if (!ON_RENDER) console.log('  (Ferme cette fenêtre pour arrêter le serveur.)\n');
});
