// Serveur Douce Vallée : sert le jeu ET permet de jouer en ligne (salon en temps réel + villages publiés).
// Lancer localement :  node serve.js [dossier] [port]   puis ouvrir http://localhost:5180
// Déploiement Render :  PORT est fourni automatiquement par Render. Les données sont en mémoire (ou dans /data si disque monté).
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const root = path.resolve(process.argv[2] || __dirname);
// Render fournit PORT via variable d'environnement ; fallback 5180 pour usage local
const PORT = +(process.env.PORT || process.argv[3] || 5180);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ico': 'image/x-icon' };
// Persistance : utilise /data (disque Render monté) si disponible, sinon le dossier local
const DATA_DIR = fs.existsSync('/data') ? '/data' : root;
const DATA = path.join(DATA_DIR, 'douce-vallee-serveur.json');
let towns = {}; try { towns = JSON.parse(fs.readFileSync(DATA, 'utf8')).towns || {}; console.log('Données chargées : ' + Object.keys(towns).length + ' villages.'); } catch (e) { }
let saveT = null;
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.writeFileSync(DATA, JSON.stringify({ towns })); } catch (e) { console.error('écriture impossible', e.message); } }, 1500); };

// ---------- Sécurité : CORS pour permettre accès depuis n'importe où ----------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  // Headers CORS sur toutes les réponses
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p === '/api/ping') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true, server: 'douce-vallee', players: clients.size, v: 2 })); }
  if (req.method === 'POST' && p === '/shot') { let b = ''; req.on('data', c => b += c); req.on('end', () => { const name = (req.url.split('?')[1] || 'shot').replace(/[^a-z0-9_-]/gi, ''); try { fs.writeFileSync(path.join(process.env.SHOTDIR || root, name + '.jpg'), Buffer.from(b.split(',')[1], 'base64')); } catch (e) { } res.end('ok'); }); return; }
  const f = path.join(root, p); if (!f.startsWith(root) || path.basename(f).startsWith('douce-vallee-serveur')) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, data) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    if (p === '/index.html' && !/^\s*<!doctype/i.test(data.slice(0, 64).toString())) data = Buffer.concat([Buffer.from('<!doctype html><html><head><meta charset="utf-8">'), data]);
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  });
});

// ---------- WebSocket minimal (aucune dépendance npm) ----------
const clients = new Map(); let N = 0;
const frame = str => { const d = Buffer.from(str), n = d.length; let h; if (n < 126) h = Buffer.from([0x81, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); } else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); } return Buffer.concat([h, d]); };
const send = (c, obj) => { try { c.sock.write(frame(JSON.stringify(obj))); } catch (e) { } };
const bcast = (obj, except) => { const fr = frame(JSON.stringify(obj)); for (const c of clients.values()) if (c !== except) try { c.sock.write(fr); } catch (e) { } };
const bcastRoom = (room, obj, except) => { const fr = frame(JSON.stringify(obj)); for (const c of clients.values()) if (c !== except && c.room === room) try { c.sock.write(fr); } catch (e) { } };

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
  // Présence : broadcast à la salle du client
  if (m.t === 'pres') {
    c.pres = m.d;
    // Broadcast uniquement aux clients dans la même salle
    const fr = frame(JSON.stringify({ t: 'pres', id: c.id, d: m.d }));
    for (const o of clients.values()) if (o !== c && o.room === c.room) try { o.sock.write(fr); } catch (e) { }
  }
  // Rejoindre une salle (code ami hashé)
  else if (m.t === 'join') {
    const oldRoom = c.room;
    c.room = typeof m.room === 'string' ? m.room : null;
    // Annoncer la sortie de l'ancienne salle
    if (oldRoom && oldRoom !== c.room) bcastRoom(oldRoom, { t: 'left', id: c.id });
    // Envoyer les présences de la nouvelle salle
    if (c.room) for (const o of clients.values()) if (o !== c && o.room === c.room && o.pres) send(c, { t: 'pres', id: o.id, d: o.pres });
  }
  // Publier un village
  else if (m.t === 'pub' && typeof m.h === 'string' && /^[a-f0-9]{40}$/.test(m.h) && m.rec) {
    towns[m.h] = { ow: m.ow || null, rec: m.rec, at: Date.now() }; persist(); send(c, { t: 'res', rid: m.rid, data: true });
  }
  // Dépublier un village
  else if (m.t === 'unpub' && typeof m.h === 'string' && towns[m.h]) {
    if (!towns[m.h].ow || towns[m.h].ow === m.ow) { delete towns[m.h]; persist(); }
    send(c, { t: 'res', rid: m.rid, data: true });
  }
  // Récupérer un village
  else if (m.t === 'get') send(c, { t: 'res', rid: m.rid, data: towns[m.h] ? towns[m.h].rec : null });
  // Lister les villages (admin seulement — désactivé en production)
  else if (m.t === 'list') send(c, { t: 'res', rid: m.rid, data: [] });
}

server.on('upgrade', (req, sock) => {
  if (req.url.split('?')[0] !== '/ws') return sock.destroy(); const key = req.headers['sec-websocket-key']; if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n'); sock.setNoDelay(true);
  const c = { id: ++N, sock, buf: Buffer.alloc(0), parts: [], pres: null, room: null }; clients.set(c.id, c);
  sock.on('data', d => { c.buf = Buffer.concat([c.buf, d]); let f;
    while ((f = readFrame(c))) { if (f.op === 8) { try { sock.end(Buffer.from([0x88, 0])); } catch (e) { } return; }
      if (f.op === 9) { try { sock.write(Buffer.concat([Buffer.from([0x8a, f.data.length]), f.data])); } catch (e) { } continue; }
      if (f.op === 1 || f.op === 0) { c.parts.push(f.data); if (f.fin) { const txt = Buffer.concat(c.parts).toString(); c.parts = []; onMessage(c, txt); } } } });
  const bye = () => {
    if (!clients.has(c.id)) return; clients.delete(c.id);
    // Prévenir seulement la salle du client
    if (c.room) bcastRoom(c.room, { t: 'left', id: c.id });
    else bcast({ t: 'left', id: c.id });
  };
  sock.on('close', bye); sock.on('end', bye); sock.on('error', bye);
});

// Nettoyage des villages trop vieux (> 7 jours) pour ne pas remplir la mémoire
setInterval(() => {
  const limit = Date.now() - 7 * 24 * 3600 * 1000;
  let removed = 0;
  for (const [h, t] of Object.entries(towns)) { if (t.at && t.at < limit) { delete towns[h]; removed++; } }
  if (removed) { persist(); console.log('Nettoyage : ' + removed + ' villages expirés supprimés.'); }
}, 3600 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🌿 Douce Vallée — serveur prêt !');
  console.log('  Sur ce PC :              http://localhost:' + PORT);
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log('  Amis sur le même Wi-Fi : http://' + a.address + ':' + PORT);
  if (process.env.RENDER_EXTERNAL_URL) console.log('  🌍 URL mondiale (Render) : ' + process.env.RENDER_EXTERNAL_URL);
  console.log('  (Ferme cette fenêtre pour arrêter le serveur.)\n');
});
