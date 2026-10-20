'use strict';
// Prépare le dossier « jeu » de l'appli : copie du jeu, three.js et les polices embarqués (le jeu marche hors ligne), icône.
// Lancé automatiquement par « npm run exe » (ou « npm start »).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const SRC = path.join(__dirname, '..'), OUT = path.join(__dirname, 'jeu'), VEND = path.join(OUT, 'vendor');
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@600;700;800&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.name.startsWith('.')) continue; const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };
async function get(url, bin) { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(url + ' → ' + r.status); return bin ? Buffer.from(await r.arrayBuffer()) : await r.text(); }

// ---------- icône (PNG 512 × 512 dessiné ici : ciel, soleil, collines et un arbre) ----------
function iconPng(N) { const S = 512 / N, px = Buffer.alloc(N * N * 4), mix = (a, b, t) => a + (b - a) * t, sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const put = (i, c, a) => { px[i] = mix(px[i], c[0], a); px[i + 1] = mix(px[i + 1], c[1], a); px[i + 2] = mix(px[i + 2], c[2], a); px[i + 3] = Math.max(px[i + 3], a * 255); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4, u = (x + .5) / N, v = (y + .5) / N, X = u * 512, Y = v * 512;
    const r = 90, dx = Math.max(0, Math.abs(X - 256) - (256 - r)), dy = Math.max(0, Math.abs(Y - 256) - (256 - r)), inside = 1 - sm(r - 1.5 * S, r + 1.5 * S, Math.hypot(dx, dy)); if (inside <= 0) continue; // carré arrondi
    put(i, [mix(120, 190, v), mix(200, 232, v), mix(245, 250, v)], inside); // ciel
    const sd = Math.hypot(u - .72, v - .28); put(i, [255, 226, 120], (1 - sm(.085, .095, sd)) * inside); put(i, [255, 240, 190], (1 - sm(.09, .16, sd)) * .25 * inside); // soleil
    const h1 = .70 + Math.sin(u * 5.2 + .6) * .045, h2 = .78 + Math.sin(u * 4 + 2.2) * .05; put(i, [110, 196, 92], sm(h1 - .003, h1 + .003, v) * inside); put(i, [78, 168, 70], sm(h2 - .003, h2 + .003, v) * inside); // collines
    const tx = Math.abs(u - .38); put(i, [128, 86, 52], (1 - sm(.025, .03, tx)) * sm(.5, .505, v) * (1 - sm(.74, .745, v)) * inside); // tronc
    for (const [cx, cy, cr, c] of [[.38, .42, .16, [72, 170, 76]], [.29, .5, .1, [86, 184, 84]], [.47, .5, .1, [86, 184, 84]], [.36, .36, .09, [108, 200, 100]]]) put(i, c, (1 - sm(cr - .004, cr + .004, Math.hypot(u - cx, v - cy))) * inside); } // feuillage
  const raw = Buffer.alloc(N * (N * 4 + 1)); for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }), crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(N, 0); ih.writeUInt32BE(N, 4); ih[8] = 8; ih[9] = 6; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]); }
// fichier .ico de Windows : plusieurs tailles, chacune enregistrée en PNG
function icon(dir) { fs.writeFileSync(path.join(dir, 'icone.png'), iconPng(512)); const sizes = [256, 128, 64, 48, 32, 16], imgs = sizes.map(iconPng), head = Buffer.alloc(6 + 16 * sizes.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = head.length; sizes.forEach((n, k) => { const e = 6 + 16 * k; head[e] = n >= 256 ? 0 : n; head[e + 1] = n >= 256 ? 0 : n; head[e + 2] = 0; head[e + 3] = 0; head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(imgs[k].length, e + 8); head.writeUInt32LE(off, e + 12); off += imgs[k].length; });
  fs.writeFileSync(path.join(dir, 'icone.ico'), Buffer.concat([head, ...imgs])); }

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(VEND, { recursive: true });
  copyDir(path.join(SRC, 'js'), path.join(OUT, 'js'));
  // three.js et polices embarqués
  const cache = path.join(__dirname, '.cache'); fs.mkdirSync(path.join(cache, 'polices'), { recursive: true });
  const three = path.join(cache, 'three.min.js'); if (!fs.existsSync(three)) fs.writeFileSync(three, await get(THREE_URL, true)); fs.copyFileSync(three, path.join(VEND, 'three.min.js'));
  const cssF = path.join(cache, 'polices.css'); let css = fs.existsSync(cssF) ? fs.readFileSync(cssF, 'utf8') : null;
  if (!css) { css = await get(FONTS_URL); let k = 0; for (const m of [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)]) { const name = 'p' + (k++) + '.woff2'; fs.writeFileSync(path.join(cache, 'polices', name), await get(m[1], true)); css = css.split(m[1]).join('polices/' + name); } fs.writeFileSync(cssF, css); }
  fs.writeFileSync(path.join(VEND, 'polices.css'), css); copyDir(path.join(cache, 'polices'), path.join(VEND, 'polices'));
  // la page du jeu pointe vers les copies locales
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  html = html.split(THREE_URL).join('vendor/three.min.js').replace(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/, '<link rel="stylesheet" href="vendor/polices.css">').replace(/<link[^>]+rel="preconnect"[^>]*>/g, '');
  if (!html.includes('vendor/three.min.js')) throw new Error('three.js introuvable dans index.html');
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  icon(__dirname);
  console.log('✅ Dossier du jeu prêt :', OUT);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
