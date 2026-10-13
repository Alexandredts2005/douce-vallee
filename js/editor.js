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
  E.open = () => {
    G.state = 'editor'; G.ui.hideScreens(); $('editor').hidden = false; E.layout = clone(G.editorLayout || G.DEFAULT_LAYOUT); E.hist = [];
    $('ed-seed').value = G.store.get('dv_seed', '1234'); E.palette(); E.grid(); E.preview();
  };
  E.close = () => { E.save(); $('editor').hidden = true; G.state = 'title'; G.ui.show('screen-title'); };
  E.save = () => { G.editorLayout = clone(E.layout); G.store.set('dv_layout', G.editorLayout); G.store.set('dv_seed', $('ed-seed').value); };
  // ---------- liste des terrains, par catégorie, avec le pinceau choisi expliqué en haut ----------
  E.palette = () => {
    const box = $('ed-pal'); box.innerHTML = ''; const a0 = G.ACRES[E.brush] || {};
    const cur = document.createElement('div'); cur.className = 'ed-brush'; cur.innerHTML = `Terrain choisi :<br><b>${a0.ico || ''} ${a0.n || ''}</b><br>${DESC[E.brush] || ''}`; box.appendChild(cur);
    const seen = new Set(), add = id => { const a = G.ACRES[id]; if (!a || seen.has(id)) return; seen.add(id); const b = document.createElement('button'); b.type = 'button'; b.className = 'pal' + (id === E.brush ? ' on' : ''); b.title = DESC[id] || a.n;
      b.innerHTML = `<i style="background:${a.col}">${a.ico}</i>${a.n}`; b.onclick = () => { E.brush = id; G.sfx('ui'); E.palette(); }; box.appendChild(b); };
    for (const [title, ids] of CATS) { const h = document.createElement('div'); h.className = 'ed-cat'; h.textContent = title; box.appendChild(h); ids.forEach(add); }
    const rest = Object.keys(G.ACRES).filter(id => !seen.has(id)); if (rest.length) { const h = document.createElement('div'); h.className = 'ed-cat'; h.textContent = '✨ Autres'; box.appendChild(h); rest.forEach(add); }
  };
  // ---------- peindre ----------
  E.paint = (x, z, quiet) => {
    const id = E.brush, last = z === lastRow();
    if (last !== isBeach(id)) { if (!quiet) { G.ui.toast(last ? 'La rangée du bas touche la mer : choisis un terrain du « Bord de mer ».' : 'Les plages, pontons, phares et ports vont sur la rangée du bas, au bord de la mer.'); G.sfx('error'); } return; }
    if (E.layout[z][x] === id) return; if (!E.stroked) { push(); E.stroked = true; } E.layout[z][x] = id; G.sfx('place', .4); E.cell(x, z); E.schedule();
  };
  const push = () => { E.hist.push(clone(E.layout)); if (E.hist.length > 60) E.hist.shift(); };
  E.cell = (x, z) => { const b = E.cells && E.cells[z] && E.cells[z][x], id = E.layout[z][x], a = G.ACRES[id] || { col: '#999', ico: '?', n: id }; if (!b) return; b.style.background = a.col; b.textContent = a.ico; b.title = COLN(x) + '-' + (z + 1) + ' · ' + a.n; };
  E.grid = () => {
    const g = $('ed-grid'), W = E.layout[0].length; g.style.setProperty('--cols', W); g.innerHTML = ''; E.cells = [];
    E.layout.forEach((row, z) => { E.cells[z] = []; row.forEach((id, x) => {
      const b = document.createElement('div'); b.className = 'acre' + (z === lastRow() ? ' sea-row' : ''); b.dataset.x = x; b.dataset.z = z; E.cells[z][x] = b; E.cell(x, z);
      b.addEventListener('mousedown', e => { e.preventDefault(); if (e.button === 2) { E.brush = E.layout[z][x]; G.sfx('ui'); E.palette(); return; } E.stroked = false; E.painting = true; E.paint(x, z); });
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
  E.preview = () => {
    const seed = G.hashStr($('ed-seed').value || '1') % 1e9; let m;
    try { m = G.genWorld(E.layout, seed); } catch (e) { console.error(e); $('ed-info').textContent = 'Oups, cette carte ne se génère pas : ' + e.message; return; }
    const base = G.ui.drawMapBase(m), cv = $('ed-preview'); cv.width = m.W * 2; cv.height = m.H * 2; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(base, 0, 0, cv.width, cv.height);
    const trees = [...m.list].filter(o => G.OBJ[o.t].chop >= 3).length, L = E.layout.flat(), has = id => L.includes(id) ? '✓' : '—';
    $('ed-info').innerHTML = `<b>Ton village : ${E.layout[0].length} × ${E.layout.length} cases</b> · ${trees} arbres<br>Place : ${has('place')} · Ta maison : ${has('maison')} · Boutique : ${has('boutique')} · Gare : ${has('gare')} · Camping : ${has('camping')}`;
    for (const o of m.list) m.objr.remove(o); m.group.traverse(c2 => { if (c2.isInstancedMesh) c2.dispose(); });
  };
  const click = (id, fn) => $(id).addEventListener('click', () => { G.sfx('ui'); fn(); });
  const reset = L => { push(); E.layout = L; E.grid(); E.preview(); };
  click('ed-undo', () => { if (!E.hist.length) { G.ui.toast('Rien à annuler.'); return; } E.layout = E.hist.pop(); E.grid(); E.preview(); });
  click('ed-classic', () => reset(clone(G.DEFAULT_LAYOUT)));
  click('ed-random', () => { const s = Math.floor(Math.random() * 1e6); $('ed-seed').value = s; reset(G.randomLayout(s)); });
  click('ed-clear', () => reset(E.layout.map((r, z) => r.map(() => z === lastRow() ? 'plage' : 'plaine'))));
  click('ed-back', () => E.close());
  click('ed-play', () => { E.save(); $('editor').hidden = true; G.state = 'title'; $('btn-new').click(); $('ng-map').value = 'custom'; $('ng-seed').value = $('ed-seed').value; });
  $('ed-seed').addEventListener('input', () => E.schedule());
  $('ed-seed').addEventListener('keydown', e => e.stopPropagation());
})();
