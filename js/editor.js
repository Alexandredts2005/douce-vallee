'use strict';
// ===== Éditeur de carte : on choisit un terrain dans la liste (classée et expliquée), on peint les cases du village, aperçu généré en direct =====
(function () {
  const $ = G.el, E = G.editor = { layout: null, brush: 'foret', painting: false, timer: 0, hist: [] };
  G.editorLayout = G.store.get('dv_layout', null);
  const clone = L => L.map(r => r.slice());
  const isBeach = id => !!(G.ACRES[id] && G.ACRES[id].beach);
  const CATS = [['🌿 Nature', ['plaine', 'foret', 'verger', 'jardin', 'etang', 'colline', 'plateau', 'montagne']], ['💧 Eau', ['riviere', 'riviere_h', 'cascade', 'lac']],
    ['🏡 Village', ['place', 'maison', 'village', 'quartier', 'hameau', 'boutique', 'camping', 'gare', 'mairie', 'parc', 'aerodrome', 'ferme']], ['🏖️ Bord de mer (rangée du bas)', ['plage', 'plage_rochers', 'ponton', 'phare', 'port']]];
  const DESC = { plaine: 'Herbe et fleurs sauvages.', foret: 'Beaucoup d\'arbres.', verger: 'Des arbres fruitiers bien alignés.', jardin: 'Des massifs de fleurs partout.', etang: 'Une petite mare.', colline: 'Un relief avec deux niveaux.',
    plateau: 'Un terrain surélevé d\'un niveau.', montagne: 'Hautes falaises, rochers et sapins.', riviere: 'Une rivière : elle se relie toute seule aux eaux voisines.', riviere_h: 'Une rivière en hauteur (un niveau plus haut).',
    cascade: 'La rivière descend d\'un niveau en cascade.', lac: 'Un grand lac.', place: 'La place du village : fontaine, kiosque, jeux. (2 cases côte à côte pour la grande place)', maison: 'Ta maison.', village: 'Les maisons des habitants.',
    quartier: 'Une ruelle pavée et des maisons.', hameau: 'Un petit groupe de maisons de voisins.', boutique: 'La boutique de Gaston.', camping: 'Ta tente au début du mode Survie.', gare: 'La gare et le train.', mairie: 'La mairie.',
    parc: 'Un grand parc (2 × 2 cases pour le plus grand).', aerodrome: 'Une piste et l\'avion (2 cases côte à côte).', ferme: 'Des champs et une grange (2 cases côte à côte).', plage: 'Du sable au bord de la mer.', plage_rochers: 'Une plage avec des rochers.',
    ponton: 'Le ponton du capitaine (bateau pour l\'île).', phare: 'Un phare.', port: 'Un port avec des bateaux.' };
  const COLN = x => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[x] || ('A' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[x - 26]);
  const lastRow = () => E.layout.length - 1;
  // dans un village déjà construit, on change les paysages ; les parcelles avec des bâtiments sont verrouillées (on les déplace avec B)
  const WORLD_OK = new Set(['plaine', 'foret', 'verger', 'jardin', 'etang', 'colline', 'plateau', 'montagne', 'riviere', 'riviere_h', 'cascade', 'lac', 'hameau', 'quartier', 'plage', 'plage_rochers', 'phare']);
  const B = G.BORDER, A = G.ACRE;
  function lockedAcres(m) { const L = m.meta.layout, S = new Set(); for (let az = 0; az < L.length; az++) for (let ax = 0; ax < L[0].length; ax++) { const a = G.ACRES[L[az][ax]]; if (a && a.struct && a.struct !== 'hameau') S.add(ax + ',' + az); }
    for (const o of m.list) { const d = G.OBJ[o.t]; if (!d.enter && o.t !== 'maison_hab' && !d.plane && o.t !== 'montgolfiere') continue; const [w, dd] = G.fpDims(d, o.r || 0);
      for (let z = o.z; z < o.z + dd; z++) for (let x = o.x; x < o.x + w; x++) S.add(Math.floor((x - B) / A) + ',' + Math.floor((z - B) / A)); } return S; }
  // parcelles qui font partie d'un grand ensemble (un bâtiment à cheval sur deux parcelles) : on ne les échange pas seules
  function groupedAcres(m) { const S = new Set(); for (const o of m.list) { const [w, dd] = G.fpDims(G.OBJ[o.t], o.r || 0), k0 = Math.floor((o.x - B) / A) + ',' + Math.floor((o.z - B) / A), k1 = Math.floor((o.x + w - 1 - B) / A) + ',' + Math.floor((o.z + dd - 1 - B) / A); if (k0 !== k1) { S.add(k0); S.add(k1); } } return S; }
  const setTexts = () => { const w = E.world; $('ed-swap').hidden = !w; $('ed-swap').classList.toggle('on', !!E.swapMode); $('editor').classList.toggle('ed-world', w);
    $('editor').querySelector('h2').textContent = w ? '🗺️ Modifier les parcelles de ton village' : '🗺️ Éditeur de carte';
    $('editor').querySelector('.ed-steps').innerHTML = w ? '<li><b>Peins un paysage</b> sur les parcelles libres (🔒 = il y a des bâtiments).</li><li><b>✋ Déplacer une parcelle</b> : clique une parcelle (même la gare, la mairie, ta maison…) puis l\'endroit où l\'emmener : les deux s\'échangent avec tout ce qu\'il y a dessus. Les rails suivent la gare.</li><li><b>« Appliquer au village »</b> pour tout faire d\'un coup.</li>'
      : '<li><b>Choisis un terrain</b> dans la liste à gauche.</li><li><b>Clique ou glisse</b> sur les cases de la carte pour le poser.</li><li>Regarde l\'<b>aperçu</b> à droite, puis <b>« Jouer sur cette carte »</b>.</li>';
    $('ed-play').textContent = w ? '✅ Appliquer au village' : '▶ Jouer sur cette carte'; $('ed-back').textContent = w ? 'Annuler' : 'Retour';
    for (const id of ['ed-classic', 'ed-random', 'ed-clear']) $(id).hidden = w; $('ed-seed').parentNode.hidden = w; };
  E.open = (o = {}) => {
    E.world = !!o.world; G.state = 'editor'; G.ui.hideScreens(); if (E.world) $('hud').hidden = true; $('editor').hidden = false; E.hist = [];
    E.swaps = []; E.swapMode = false; E.sel = null; E.moved = new Set();
    if (E.world) { E.layout = clone(G.world.meta.layout); E.base = clone(E.layout); E.locked = lockedAcres(G.world); E.grouped = groupedAcres(G.world); if (!WORLD_OK.has(E.brush)) E.brush = 'foret'; }
    else { E.layout = clone(G.editorLayout || G.DEFAULT_LAYOUT); E.base = null; E.locked = null; $('ed-seed').value = G.store.get('dv_seed', '1234'); }
    setTexts(); E.palette(); E.grid(); E.preview();
  };
  E.close = () => { $('editor').hidden = true; if (E.world) { E.world = false; G.state = 'play'; $('hud').hidden = false; setTexts(); return; } E.save(); G.state = 'title'; G.ui.show('screen-title'); };
  E.save = () => { G.editorLayout = clone(E.layout); G.store.set('dv_layout', G.editorLayout); G.store.set('dv_seed', $('ed-seed').value); };
  // ---------- liste des terrains, par catégorie, avec le pinceau choisi expliqué en haut ----------
  E.palette = () => {
    const box = $('ed-pal'); box.innerHTML = ''; const a0 = G.ACRES[E.brush] || {};
    const cur = document.createElement('div'); cur.className = 'ed-brush'; cur.innerHTML = `Terrain choisi :<br><b>${a0.ico || ''} ${a0.n || ''}</b><br>${DESC[E.brush] || ''}`; box.appendChild(cur);
    const seen = new Set(), add = id => { const a = G.ACRES[id]; if (!a || seen.has(id) || (E.world && !WORLD_OK.has(id))) return; seen.add(id); const b = document.createElement('button'); b.type = 'button'; b.className = 'pal' + (id === E.brush ? ' on' : ''); b.title = DESC[id] || a.n;
      b.innerHTML = `<i style="background:${a.col}">${a.ico}</i>${a.n}`; b.onclick = () => { E.brush = id; G.sfx('ui'); E.palette(); }; box.appendChild(b); };
    for (const [title, ids] of CATS) { const h = document.createElement('div'); h.className = 'ed-cat'; h.textContent = title; box.appendChild(h); ids.forEach(add); }
    const rest = Object.keys(G.ACRES).filter(id => !seen.has(id)); if (rest.length) { const h = document.createElement('div'); h.className = 'ed-cat'; h.textContent = '✨ Autres'; box.appendChild(h); rest.forEach(add); }
  };
  // ---------- peindre ----------
  E.paint = (x, z, quiet) => {
    const id = E.brush, last = z === lastRow();
    if (E.world && E.locked.has(x + ',' + z)) { if (!quiet) { G.ui.toast('🔒 Il y a des bâtiments sur cette parcelle : déplace-les d\'abord (touche B devant un bâtiment).'); G.sfx('error'); } return; }
    if (last !== isBeach(id)) { if (!quiet) { G.ui.toast(last ? 'La rangée du bas touche la mer : choisis un terrain du « Bord de mer ».' : 'Les plages, pontons, phares et ports vont sur la rangée du bas, au bord de la mer.'); G.sfx('error'); } return; }
    if (E.layout[z][x] === id) return; if (!E.stroked) { push(); E.stroked = true; } E.layout[z][x] = id; G.sfx('place', .4); E.cell(x, z); E.schedule();
  };
  const push = () => { E.hist.push({ layout: clone(E.layout), base: E.base && clone(E.base), locked: E.locked && new Set(E.locked), swaps: E.swaps.slice(), moved: new Set(E.moved) }); if (E.hist.length > 60) E.hist.shift(); };
  // ---------- échanger deux parcelles (village existant) ----------
  const swapIn = (L, a, b) => { const t = L[a[1]][a[0]]; L[a[1]][a[0]] = L[b[1]][b[0]]; L[b[1]][b[0]] = t; };
  E.pickSwap = (x, z) => { const k = x + ',' + z;
    if (E.grouped.has(k)) { G.ui.toast('Cette parcelle fait partie d\'un grand ensemble (grande place, parc, aérodrome…) : elle ne se déplace pas seule.'); G.sfx('error'); return; }
    if (!E.sel) { E.sel = [x, z]; E.cell(x, z); G.sfx('ui'); $('ed-hover').textContent = 'Parcelle ' + COLN(x) + '-' + (z + 1) + ' choisie : clique maintenant l\'endroit où l\'emmener.'; return; }
    const a = E.sel; E.sel = null; E.cell(a[0], a[1]); if (a[0] === x && a[1] === z) return;
    if ((a[1] === lastRow()) !== (z === lastRow())) { G.ui.toast('Les parcelles du bord de mer ne s\'échangent qu\'entre elles.'); G.sfx('error'); return; }
    push(); const b = [x, z]; swapIn(E.layout, a, b); swapIn(E.base, a, b); const la = E.locked.has(a[0] + ',' + a[1]), lb = E.locked.has(k);
    E.locked.delete(a[0] + ',' + a[1]); E.locked.delete(k); if (la) E.locked.add(k); if (lb) E.locked.add(a[0] + ',' + a[1]); E.swaps.push([a, b]); E.moved.add(a[0] + ',' + a[1]); E.moved.add(k);
    E.cell(a[0], a[1]); E.cell(x, z); G.sfx('place'); $('ed-hover').textContent = 'Les parcelles ' + COLN(a[0]) + '-' + (a[1] + 1) + ' et ' + COLN(x) + '-' + (z + 1) + ' seront échangées en appliquant.'; E.schedule(); };
  E.cell = (x, z) => { const b = E.cells && E.cells[z] && E.cells[z][x], id = E.layout[z][x], a = G.ACRES[id] || { col: '#999', ico: '?', n: id }; if (!b) return; b.style.background = a.col; b.textContent = a.ico; b.title = COLN(x) + '-' + (z + 1) + ' · ' + a.n;
    b.classList.toggle('locked', !!(E.world && E.locked.has(x + ',' + z))); b.classList.toggle('changed', !!(E.base && E.base[z][x] !== id)); b.classList.toggle('moved', !!(E.moved && E.moved.has(x + ',' + z))); b.classList.toggle('sel', !!(E.sel && E.sel[0] === x && E.sel[1] === z)); };
  E.grid = () => {
    const g = $('ed-grid'), W = E.layout[0].length; g.style.setProperty('--cols', W); g.innerHTML = ''; E.cells = [];
    E.layout.forEach((row, z) => { E.cells[z] = []; row.forEach((id, x) => {
      const b = document.createElement('div'); b.className = 'acre' + (z === lastRow() ? ' sea-row' : ''); b.dataset.x = x; b.dataset.z = z; E.cells[z][x] = b; E.cell(x, z);
      b.addEventListener('mousedown', e => { e.preventDefault(); if (E.world && E.swapMode && e.button !== 2) { E.pickSwap(x, z); return; } if (e.button === 2) { E.brush = E.layout[z][x]; G.sfx('ui'); E.palette(); return; } E.stroked = false; E.painting = true; E.paint(x, z); });
      b.addEventListener('mouseenter', () => { const a = G.ACRES[E.layout[z][x]] || {}; $('ed-hover').textContent = `Case ${COLN(x)}-${z + 1} : ${a.ico || ''} ${a.n || ''} — ${DESC[E.layout[z][x]] || ''}`; if (E.painting) E.paint(x, z, true); });
      b.addEventListener('contextmenu', e => e.preventDefault());
      g.appendChild(b); }); });
  };
  // tactile : on peint en glissant le doigt
  const touchCell = t => { const el = document.elementFromPoint(t.clientX, t.clientY); return el && el.classList && el.classList.contains('acre') ? [+el.dataset.x, +el.dataset.z] : null; };
  $('ed-grid').addEventListener('touchstart', e => { const c = touchCell(e.touches[0]); if (!c) return; e.preventDefault(); E.stroked = false; E.paint(c[0], c[1]); }, { passive: false });
  $('ed-grid').addEventListener('touchmove', e => { const c = touchCell(e.touches[0]); if (!c) return; e.preventDefault(); E.paint(c[0], c[1], true); }, { passive: false });
  window.addEventListener('mouseup', () => E.painting = false);
  E.schedule = () => { clearTimeout(E.timer); E.timer = setTimeout(E.preview, 200); };
  // ---------- aperçu ----------
  // village existant : plan des parcelles (les parcelles modifiées entourées de jaune)
  function plan() { const L = E.layout, R = L.length, C = L[0].length, s = Math.max(4, Math.floor(480 / C)), cv = $('ed-preview'); cv.width = C * s; cv.height = (R + 1) * s; const c = cv.getContext('2d');
    c.fillStyle = '#2f86c9'; c.fillRect(0, 0, cv.width, cv.height); let n = 0;
    for (let z = 0; z < R; z++) for (let x = 0; x < C; x++) { const a = G.ACRES[L[z][x]] || { col: '#999' }; c.fillStyle = a.col; c.fillRect(x * s, z * s, s, s); if (E.locked.has(x + ',' + z)) { c.fillStyle = 'rgba(60,40,20,.28)'; c.fillRect(x * s, z * s, s, s); } }
    c.lineWidth = Math.max(1, s / 6); c.strokeStyle = '#ffe14d'; for (let z = 0; z < R; z++) for (let x = 0; x < C; x++) if (E.base[z][x] !== L[z][x]) { n++; c.strokeRect(x * s + 1, z * s + 1, s - 2, s - 2); }
    $('ed-info').innerHTML = `<b>Ton village : ${C} × ${R} parcelles</b><br>${n ? '✏️ ' + n + ' parcelle' + (n > 1 ? 's' : '') + ' modifiée' + (n > 1 ? 's' : '') + ' (en jaune)' : 'Aucune parcelle modifiée pour l\'instant.'}<br>🔒 parcelles avec des bâtiments : on ne peut pas les peindre.`; }
  E.preview = () => {
    if (E.world) return plan();
    const seed = G.hashStr($('ed-seed').value || '1') % 1e9; let m;
    try { m = G.genWorld(E.layout, seed); } catch (e) { console.error(e); $('ed-info').textContent = 'Oups, cette carte ne se génère pas : ' + e.message; return; }
    const base = G.ui.drawMapBase(m), cv = $('ed-preview'); cv.width = m.W * 2; cv.height = m.H * 2; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(base, 0, 0, cv.width, cv.height);
    const trees = [...m.list].filter(o => G.OBJ[o.t].chop >= 3).length, L = E.layout.flat(), has = id => L.includes(id) ? '✓' : '—';
    $('ed-info').innerHTML = `<b>Ton village : ${E.layout[0].length} × ${E.layout.length} cases</b> · ${trees} arbres<br>Place : ${has('place')} · Ta maison : ${has('maison')} · Boutique : ${has('boutique')} · Gare : ${has('gare')} · Camping : ${has('camping')}`;
    for (const o of m.list) m.objr.remove(o); m.group.traverse(c2 => { if (c2.isInstancedMesh) c2.dispose(); });
  };
  const click = (id, fn) => $(id).addEventListener('click', () => { G.sfx('ui'); fn(); });
  const reset = L => { push(); E.layout = L; E.grid(); E.preview(); };
  click('ed-undo', () => { if (!E.hist.length) { G.ui.toast('Rien à annuler.'); return; } const h = E.hist.pop(); E.layout = h.layout; if (h.base) E.base = h.base; if (h.locked) E.locked = h.locked; E.swaps = h.swaps; E.moved = h.moved; E.sel = null; E.grid(); E.preview(); });
  click('ed-swap', () => { E.swapMode = !E.swapMode; E.sel = null; $('ed-swap').classList.toggle('on', E.swapMode); E.grid(); $('ed-hover').textContent = E.swapMode ? '✋ Clique la parcelle à déplacer, puis l\'endroit où l\'emmener.' : 'Pinceau : clique ou glisse pour peindre un paysage.'; });
  click('ed-classic', () => reset(clone(G.DEFAULT_LAYOUT)));
  click('ed-random', () => { const s = Math.floor(Math.random() * 1e6); $('ed-seed').value = s; reset(G.randomLayout(s)); });
  click('ed-clear', () => reset(E.layout.map((r, z) => r.map(() => z === lastRow() ? 'plage' : 'plaine'))));
  click('ed-back', () => E.close());
  click('ed-play', () => {
    if (E.world) { const L = clone(E.layout); $('load-msg').textContent = 'Le village se transforme…'; $('loading').hidden = false;
      const SW = E.swaps.slice(); setTimeout(() => { let n = 0; try { for (const [a, b] of SW) { G.swapAcres(G.world, a, b); n++; } n += G.applyAcres(L); } catch (e) { console.error(e); G.ui.toast('Erreur : ' + e.message); } $('loading').hidden = true; E.close(); if (n) G.ui.toast('🗺️ ' + n + ' parcelle' + (n > 1 ? 's' : '') + ' transformée' + (n > 1 ? 's' : '') + ' !'); }, 40); return; }
    E.save(); $('editor').hidden = true; G.state = 'title'; $('btn-new').click(); $('ng-map').value = 'custom'; $('ng-seed').value = $('ed-seed').value; });
  // ---------- appliquer : les parcelles changées sont recréées (terrain, rivières, arbres, hameaux), le reste du village ne bouge pas ----------
  // échange de deux parcelles : terrain, objets, habitants, portes, icônes ; la gare emmène ses rails
  const KEEP = ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt'];
  G.swapAcres = (m, a, b) => { const M = m.meta, ax0 = B + a[0] * A, az0 = B + a[1] * A, bx0 = B + b[0] * A, bz0 = B + b[1] * A, dx = bx0 - ax0, dz = bz0 - az0;
    const inR = (x, z, x0, z0) => x >= x0 && x < x0 + A && z >= z0 && z < z0 + A, side = (x, z) => inR(x, z, ax0, az0) ? 1 : inR(x, z, bx0, bz0) ? -1 : 0;
    const t = M.train, so = t ? (t.ox != null ? t.ox : t.x0 - 2) : null, sz = t ? Math.floor(t.z) - 1 : null, st = t ? side(so + 8, sz + 4) : 0;
    for (let z = 0; z < A; z++) for (let x = 0; x < A; x++) { const i = m.idx(ax0 + x, az0 + z), j = m.idx(bx0 + x, bz0 + z); for (const k of ['lvl', 'surf', 'water', 'ramp']) { const v = m[k][i]; m[k][i] = m[k][j]; m[k][j] = v; } m.markDirty(ax0 + x, az0 + z); m.markDirty(bx0 + x, bz0 + z); }
    const mv = []; for (const o of [...m.list]) { const sd = side(o.x, o.z); if (!sd) continue; const ex = {}; for (const k of KEEP) if (o[k] != null) ex[k] = o[k]; mv.push([o.t, o.x + sd * dx, o.z + sd * dz, o.r || 0, ex]); m.removeObj(o); }
    for (const [t2, x, z, r, ex] of mv) m.addObj(t2, x, z, r, ex);
    const sh = q => { if (!q || typeof q.x !== 'number' || typeof q.z !== 'number') return; const sd = side(q.x, q.z); if (!sd) return; q.x += sd * dx; q.z += sd * dz; for (const k of ['x0', 'x1', 'sx']) if (typeof q[k] === 'number') q[k] += sd * dx; for (const k of ['z0', 'z1', 'sz']) if (typeof q[k] === 'number') q[k] += sd * dz; };
    for (const k in M) { if (['layout', 'train', 'track', 'seaZ', 'seed', 'signals'].includes(k)) continue; const v = M[k]; if (Array.isArray(v)) v.forEach(q => q && typeof q === 'object' && sh(q)); else if (k === 'homesP') { for (const id in v) sh(v[id]); } else if (v && typeof v === 'object') sh(v); }
    for (const e of G.ents.villagers) if (e.map === m) { const sd = side(e.x, e.z); if (e.fixed && e.home) sh(e.home); if (sd) { e.x += sd * dx; e.z += sd * dz; } }
    for (const id in G.interiors) { const mt = G.interiors[id].meta; if (mt && mt.door && (!mt.fromId || mt.fromId === 'world')) sh(mt.door); }
    const p = G.player, ps = G.map === m ? side(p.x, p.z) : 0; if (ps) p.teleport(p.x + ps * dx, p.z + ps * dz, p.yaw);
    swapIn(M.layout, a, b);
    if (st && G.relayStation) { const nox = so + st * dx, noz = sz + st * dz; for (const o of [...m.list]) if (['tunnel', 'signal_pn'].includes(o.t) && Math.abs(o.x - nox - 8) < 10 && Math.abs(o.z - noz - 1) < 4) m.removeObj(o); G.relayStation(m, nox, noz); } else if (t && G.relayTrack) G.relayTrack(m);
    m.flush(); G.ui.mmRev = -1; };
  G.applyAcres = L => {
    const m = G.world, M = m.meta, old = M.layout, C = old[0].length, R = old.length, seed = (M.seed == null ? 1234 : M.seed) >>> 0, ch = new Uint8Array(C * R); let n = 0;
    for (let z = 0; z < R; z++) for (let x = 0; x < C; x++) if (L[z][x] !== old[z][x]) { ch[z * C + x] = 1; n++; } if (!n) return 0;
    const gen = L.map((row, z) => row.map((id, x) => id === 'quartier' && ch[z * C + x] ? 'hameau' : id)); // pas de nouveaux habitants : ils ont déjà leur maison
    const fresh = G.genWorld(gen, seed), inCh = (x, z) => { const ax = Math.floor((x - B) / A), az = Math.floor((z - B) / A); return ax >= 0 && az >= 0 && ax < C && az < R && ch[az * C + ax] === 1; };
    const touches = (t, x0, z0, r) => { const [w, d] = G.fpDims(G.OBJ[t], r || 0); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) if (inCh(x, z)) return true; return false; };
    const inside = (t, x0, z0, r) => { const [w, d] = G.fpDims(G.OBJ[t], r || 0); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) if (!inCh(x, z)) return false; return true; };
    for (const o of [...m.list]) if (touches(o.t, o.x, o.z, o.r)) m.removeObj(o);
    for (let z = 0; z < m.H; z++) for (let x = 0; x < m.W; x++) if (inCh(x, z)) { const i = m.idx(x, z); m.lvl[i] = fresh.lvl[i]; m.surf[i] = fresh.surf[i]; m.water[i] = fresh.water[i]; m.ramp[i] = fresh.ramp[i]; m.markDirty(x, z); }
    for (const o of fresh.list) if (inside(o.t, o.x, o.z, o.r)) { const ex = {}; for (const k of ['v', 'f', 'g', 'txt', 'wt']) if (o[k] != null) ex[k] = o[k]; if (G.OBJ[o.t].enter) ex.iid = 'h' + Date.now().toString(36) + Math.floor(Math.random() * 1e4); m.addObj(o.t, o.x, o.z, o.r || 0, ex); }
    const inP = q => q && inCh(Math.floor(q.x), Math.floor(q.z)); M.quartiers = (M.quartiers || []).filter(q => !inP(q)).concat((fresh.meta.quartiers || []).filter(inP));
    M.layout = gen; m.flush(); G.ui.mmRev = -1; const p = G.player; if (G.map === m) { p.teleport(p.x, p.z, p.yaw); if (p.blocked && p.blocked(p.x, p.z, p.y, true)) p.unstick(true); }
    G.saveGame(true); return n;
  };
  $('ed-seed').addEventListener('input', () => E.schedule());
  $('ed-seed').addEventListener('keydown', e => e.stopPropagation());
  // depuis la grande carte du jeu : modifier les parcelles du village
  $('map-edit').addEventListener('click', () => { if (G.net && G.net.visit) { G.ui.toast('On ne modifie que son propre village.'); return; } G.sfx('ui'); G.ui.closeMap(); E.open({ world: true }); });
})();
