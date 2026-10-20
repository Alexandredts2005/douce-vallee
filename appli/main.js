'use strict';
// ===== Douce Vallée — l'appli Windows (Electron) =====
// • toujours la carte graphique la plus puissante (RTX / Radeon) ; résolution native, pas de ralentissement en arrière-plan
// • le jeu est servi depuis l'appli elle-même (protocole dv://, contexte sécurisé) : il marche hors ligne, et en ligne il rejoint
//   le serveur Douce Vallée (sessions en ligne, villages des amis, ville commune)
// • fenêtre verrouillée : pas de navigation vers d'autres sites, pas d'accès aux fichiers, aucune permission (caméra, micro…)
const { app, BrowserWindow, protocol, shell, Menu, session } = require('electron');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const JEU = app.isPackaged ? path.join(process.resourcesPath, 'jeu') : path.join(__dirname, 'jeu');

// ---------- 1. Windows : préférence « Hautes performances » pour cette appli ----------
// (exactement le réglage de Paramètres › Système › Écran › Graphiques, pour ce seul programme). Windows le lit au démarrage
// du processus : la toute première fois, l'appli l'enregistre puis se relance aussitôt sur la carte graphique dédiée.
function gpuPref() { if (process.platform !== 'win32' || !app.isPackaged) return false; const key = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences', exe = process.execPath;
  try { if (/GpuPreference=2/.test(execFileSync('reg', ['query', key, '/v', exe], { encoding: 'utf8', windowsHide: true }))) return false; } catch (e) { }
  try { execFileSync('reg', ['add', key, '/v', exe, '/t', 'REG_SZ', '/d', 'GpuPreference=2;', '/f'], { windowsHide: true }); return true; } catch (e) { return false; } }
if (gpuPref() && !process.argv.includes('--dv-relance')) { app.relaunch({ args: process.argv.slice(1).concat(['--dv-relance']) }); app.exit(0); }

// ---------- 2. Chromium : adaptateur haute performance, tout le rendu sur la carte graphique, aucun bridage ----------
for (const s of ['force_high_performance_gpu', 'ignore-gpu-blocklist', 'enable-gpu-rasterization', 'enable-zero-copy', 'disable-background-timer-throttling', 'disable-renderer-backgrounding', 'disable-backgrounding-occluded-windows']) app.commandLine.appendSwitch(s);

// ---------- 3. le jeu servi par l'appli (dv://jeu/…) ----------
protocol.registerSchemesAsPrivileged([{ scheme: 'dv', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
function serve(req) { let p; try { p = decodeURIComponent(new URL(req.url).pathname); } catch (e) { return new Response('', { status: 400 }); } if (p === '/' || !p) p = '/index.html';
  const f = path.normalize(path.join(JEU, p)); if (!f.startsWith(JEU + path.sep)) return new Response('', { status: 403 }); // rien en dehors du dossier du jeu
  try { return new Response(fs.readFileSync(f), { headers: { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' } }); }
  catch (e) { return new Response('404', { status: 404 }); } }

function createWindow() {
  const win = new BrowserWindow({ width: 1600, height: 900, minWidth: 960, minHeight: 600, backgroundColor: '#8fd3f4', title: 'Douce Vallée', icon: path.join(__dirname, 'icone.png'), autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, backgroundThrottling: false, spellcheck: false, devTools: !app.isPackaged } });
  const test = process.env.DV_AUTOTEST === '1'; // auto-test : fenêtre cachée, rapport dans la console, puis fermeture
  if (!test) win.once('ready-to-show', () => { win.maximize(); win.show(); });
  else { const errs = []; win.webContents.on('console-message', (e, lvl, msg) => { if (lvl >= 3) errs.push(msg); });
    win.webContents.once('did-finish-load', () => setTimeout(async () => { let r = null; try { r = await win.webContents.executeJavaScript("JSON.stringify({ jeu: typeof G === 'object', rendu: !!(G && G.renderer), gpu: G && G.gpu && G.gpu.raw, appli: !!window.DV_DESKTOP, sur: window.isSecureContext, subtle: !!(crypto && crypto.subtle), reseau: G.net && G.net.mode, resolution: G.renderer && G.renderer.getPixelRatio(), qualite: G.settings && G.settings.quality, autoRes: G.settings && G.settings.autoRes })"); } catch (e) { r = 'erreur ' + e.message; }
      console.log('AUTOTEST ' + r); console.log('ERREURS ' + JSON.stringify(errs.slice(0, 10))); app.exit(0); }, 12000)); }
  win.loadURL('dv://jeu/index.html');
  // liens vers l'extérieur : ouverts dans le navigateur, jamais dans l'appli ; aucune autre navigation
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('dv://jeu/')) e.preventDefault(); });
  win.webContents.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
}
Menu.setApplicationMenu(null);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => {
    protocol.handle('dv', serve);
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'fullscreen' || perm === 'clipboard-sanitized-write'));
    session.defaultSession.setPermissionCheckHandler((wc, perm) => perm === 'fullscreen' || perm === 'clipboard-sanitized-write');
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
