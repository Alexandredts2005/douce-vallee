'use strict';
// ===== Éditeur d'acres : peindre la carte acre par acre, aperçu généré en direct =====
(function () {
  const $ = G.el, E = G.editor = { layout: null, brush: 'plaine', painting: false, timer: 0 };
  G.editorLayout = G.store.get('dv_layout', null);
  const clone = L => L.map(r => r.slice());
  const isBeach = id => !!G.ACRES[id].beach;
  E.open = () => {
    G.state = 'editor'; G.ui.hideScreens(); $('editor').hidden = false; E.layout = clone(G.editorLayout || G.DEFAULT_LAYOUT);
    $('ed-seed').value = G.store.get('dv_seed', '1234'); E.palette(); E.grid(); E.preview();
  };
  E.close = () => { E.save(); $('editor').hidden = true; G.state = 'title'; G.ui.show('screen-title'); };
  E.save = () => { G.editorLayout = clone(E.layout); G.store.set('dv_layout', G.editorLayout); G.store.set('dv_seed', $('ed-seed').value); };
  E.palette = () => {
    const box = $('ed-pal'); box.innerHTML = '';
    for (const id in G.ACRES) { const a = G.ACRES[id], b = document.createElement('button'); b.className = 'pal' + (id === E.brush ? ' on' : ''); b.innerHTML = `<i style="background:${a.col}">${a.ico}</i>${a.n}`; b.onclick = () => { E.brush = id; G.sfx('ui'); E.palette(); }; box.appendChild(b); }
  };
  E.paint = (x, z) => {
    const id = E.brush, last = z === G.AR - 1;
    if (last !== isBeach(id)) { G.ui.toast(last ? 'La rangée du bas touche la mer : choisis une acre de plage.' : 'Les plages vont sur la rangée du bas.'); G.sfx('error'); return; }
    if (E.layout[z][x] === id) return; E.layout[z][x] = id; G.sfx('place', .5); E.grid(); E.schedule();
  };
  E.grid = () => {
    const g = $('ed-grid'); g.style.gridTemplateColumns = `repeat(${G.AC},1fr)`; g.innerHTML = '';
    E.layout.forEach((row, z) => row.forEach((id, x) => {
      const a = G.ACRES[id], b = document.createElement('button'); b.className = 'acre'; b.style.background = a.col; b.innerHTML = `${a.ico}<small>${'ABCDEFG'[x]}-${z + 1}<br>${a.n}</small>`; b.title = a.n;
      b.addEventListener('mousedown', e => { if (e.button === 2) { E.brush = id; E.palette(); return; } E.painting = true; E.paint(x, z); });
      b.addEventListener('mouseenter', () => { if (E.painting) E.paint(x, z); });
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('touchstart', e => { e.preventDefault(); E.paint(x, z); }, { passive: false });
      g.appendChild(b);
    }));
  };
  window.addEventListener('mouseup', () => E.painting = false);
  E.schedule = () => { clearTimeout(E.timer); E.timer = setTimeout(E.preview, 160); };
  E.preview = () => {
    const seed = G.hashStr($('ed-seed').value || '1') % 1e9; let m;
    try { m = G.genWorld(E.layout, seed); } catch (e) { console.error(e); $('ed-info').textContent = 'Oups, cette carte ne se génère pas : ' + e.message; return; }
    const base = G.ui.drawMapBase(m), cv = $('ed-preview'); cv.width = m.W * 2; cv.height = m.H * 2; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(base, 0, 0, cv.width, cv.height);
    let falls = 0; for (let i = 0; i < m.W * m.H; i++) if (m.water[i] === 1) { const x = i % m.W, z = (i / m.W) | 0; for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const j = (z + dz) * m.W + x + dx; if (m.inb(x + dx, z + dz) && m.water[j] && m.lvl[j] < m.lvl[i]) { falls++; break; } } }
    const trees = [...m.list].filter(o => G.OBJ[o.t].chop >= 3).length, L = E.layout.flat(), cnt = id => L.filter(x => x === id).length;
    $('ed-info').innerHTML = `<b>${m.W}×${m.H} cases</b> · ${trees} arbres · ${falls ? 'cascades ✓' : 'pas de cascade'}<br>Habitants : ${Math.min(4, cnt('village') * 2)} · Boutique : ${cnt('boutique') ? '✓' : '—'} · Ta maison : ${cnt('maison') ? '✓' : '—'} · Camping : ${cnt('camping') ? '✓' : '—'} · Place : ${cnt('place') ? '✓' : '—'}`;
    for (const o of m.list) m.objr.remove(o); m.group.traverse(c2 => { if (c2.isInstancedMesh) c2.dispose(); });
  };
  const click = (id, fn) => $(id).addEventListener('click', () => { G.sfx('ui'); fn(); });
  click('ed-classic', () => { E.layout = clone(G.DEFAULT_LAYOUT); E.grid(); E.preview(); });
  click('ed-random', () => { const s = Math.floor(Math.random() * 1e6); $('ed-seed').value = s; E.layout = G.randomLayout(s); E.grid(); E.preview(); });
  click('ed-clear', () => { E.layout = E.layout.map((r, z) => r.map(() => z === G.AR - 1 ? 'plage' : 'plaine')); E.grid(); E.preview(); });
  click('ed-back', () => E.close());
  click('ed-play', () => { E.save(); $('editor').hidden = true; G.state = 'title'; $('btn-new').click(); $('ng-map').value = 'custom'; $('ng-seed').value = $('ed-seed').value; });
  $('ed-seed').addEventListener('input', () => E.schedule());
})();
