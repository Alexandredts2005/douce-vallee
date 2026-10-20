'use strict';
// ===== La carte (M) › « ⛰️ Hauteur » : le relief en couleurs, du niveau 0 (vert) au niveau 10 (neige), et un pinceau pour le peindre.
// On choisit un niveau, la taille du pinceau, on zoome, puis on clique ou on glisse sur la carte : le terrain monte ou descend aussitôt en 3D.
// Les maisons et les constructions ne bougent pas (leurs cases sont protégées) ; arbres, fleurs et rochers suivent le terrain. =====
(function () {
  const MAXL = 10;
  const COL = ['#3aa346', '#76c34b', '#b5d64a', '#e6c65a', '#cdb4f4', '#ae8ce8', '#9069da', '#7550c6', '#5d3aa8', '#9a91aa', '#f7f5ff'];
  const NOM = ['prairie', 'colline basse', 'colline', 'plateau', 'haut plateau', 'montagne basse', 'montagne', 'haute montagne', 'sommet', 'crête rocheuse', 'neiges éternelles'];
  const RGB = COL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const NAT = /^(mauvaise_herbe|rocher|buisson|champignon|coquillage|fissure|souche|fleur_|tulipe_|herbe)/;
  const st = { on: false, lv: 2, br: 5, zoom: 1, cx: 0, cz: 0, undo: [], drag: null, hover: null };
  const $ = id => document.getElementById(id);
  let off = null, offC = null, offI = null, offMap = null, offRev = -1;

  // ---------- l'image du relief (une case = un pixel) ----------
  const nature = o => { const d = o && G.OBJ[o.t]; return !!d && !d.enter && !d.shop && !d.fixed && (d.chop || d.mine || NAT.test(o.t) || G.isFlowerObj(o)) && d.fp[0] * d.fp[1] <= 4; };
  function px(m, x, z) {
    const i = z * m.W + x; let c;
    if (m.water[i]) c = m.water[i] === 2 ? [52, 128, 196] : [86, 176, 228];
    else c = RGB[G.clamp(m.lvl[i], 0, MAXL)];
    let k = 1; if (!m.water[i] && ((x > 0 && m.lvl[i - 1] < m.lvl[i]) || (z < m.H - 1 && m.lvl[i + m.W] < m.lvl[i]))) k = .74;
    const o = m.objAt(x, z); if (o && !nature(o)) { const d = G.OBJ[o.t]; if (d.enter || d.shop || d.fp[0] * d.fp[1] >= 4) c = [Math.round(c[0] * .45 + 120), Math.round(c[1] * .45 + 60), Math.round(c[2] * .45 + 50)]; }
    if (m.ramp[i]) k *= 1.1;
    const j = i * 4, D = offI.data; D[j] = Math.min(255, c[0] * k); D[j + 1] = Math.min(255, c[1] * k); D[j + 2] = Math.min(255, c[2] * k); D[j + 3] = 255;
  }
  function drawOff(m) {
    if (!off) off = document.createElement('canvas');
    if (off.width !== m.W || off.height !== m.H || offMap !== m) { off.width = m.W; off.height = m.H; offC = off.getContext('2d'); offI = offC.createImageData(m.W, m.H); offMap = m; offRev = -1; }
    if (offRev === m.rev) return; for (let z = 0; z < m.H; z++) for (let x = 0; x < m.W; x++) px(m, x, z); offC.putImageData(offI, 0, 0); offRev = m.rev;
  }
  const touchPx = (m, list) => { for (const [x, z] of list) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (m.inb(x + dx, z + dz)) px(m, x + dx, z + dz); offC.putImageData(offI, 0, 0); offRev = m.rev; };

  // ---------- vue : toute la carte, ou zoomée autour d'un point ----------
  function view(m, cv) {
    const sc0 = Math.min(cv.width / m.W, 660 / m.H), sc = sc0 * st.zoom, vw = cv.width / sc, vh = cv.height / sc;
    const x0 = st.zoom === 1 ? 0 : G.clamp(st.cx - vw / 2, 0, Math.max(0, m.W - vw)), z0 = st.zoom === 1 ? 0 : G.clamp(st.cz - vh / 2, 0, Math.max(0, m.H - vh));
    return { sc, x0, z0, vw, vh };
  }
  function render() {
    const m = G.world, cv = $('bigmap'); if (!m || !cv) return; const c = cv.getContext('2d');
    if (st.zoom === 1) cv.height = Math.round(m.H * Math.min(cv.width / m.W, 660 / m.H)); else cv.height = 660;
    drawOff(m); const V = view(m, cv);
    c.fillStyle = '#2f73ad'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = false;
    c.drawImage(off, V.x0, V.z0, V.vw, V.vh, 0, 0, V.vw * V.sc, V.vh * V.sc);
    // quadrillage des parcelles
    const LY = m.meta.layout, AC = LY ? LY[0].length : G.AC, AR = LY ? LY.length : G.AR, X = x => (x - V.x0) * V.sc, Z = z => (z - V.z0) * V.sc;
    c.strokeStyle = G.ACRE * V.sc >= 30 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.13)'; c.lineWidth = 1;
    for (let a = 0; a <= AC; a++) { const x = X(G.BORDER + a * G.ACRE); c.beginPath(); c.moveTo(x, Z(G.BORDER)); c.lineTo(x, Z(G.BORDER + AR * G.ACRE)); c.stroke(); }
    for (let a = 0; a <= AR; a++) { const y = Z(G.BORDER + a * G.ACRE); c.beginPath(); c.moveTo(X(G.BORDER), y); c.lineTo(X(G.BORDER + AC * G.ACRE), y); c.stroke(); }
    // toi
    const p = G.map === m ? G.player : { x: (G.map.meta.door || {}).x || 0, z: (G.map.meta.door || {}).z || 0 };
    c.fillStyle = '#ff4d4d'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(X(p.x), Z(p.z), 7, 0, 7); c.fill(); c.stroke();
    // le pinceau sous la souris
    if (st.hover) { const r = st.br / 2; c.strokeStyle = COL[st.lv]; c.lineWidth = 3; c.beginPath(); c.arc(X(st.hover[0] + .5), Z(st.hover[1] + .5), Math.max(4, r * V.sc), 0, 7); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.stroke(); }
    info();
  }
  function info() {
    const el = $('mh-info'); if (!el) return; const m = G.world, h = st.hover;
    if (!h || !m.inb(h[0], h[1])) { el.textContent = 'Clique ou glisse sur la carte pour peindre le relief.'; return; }
    const i = m.idx(h[0], h[1]); el.textContent = G.ui.acreName(h[0], h[1]) + ' · ' + (m.water[i] ? (m.water[i] === 2 ? 'mer' : 'eau') + ' (niveau ' + m.lvl[i] + ')' : 'niveau ' + m.lvl[i] + ' — ' + NOM[G.clamp(m.lvl[i], 0, MAXL)]);
  }

  // ---------- le pinceau ----------
  function paint(m, tx, tz, stroke) {
    const r = st.br / 2, R = Math.ceil(r), changed = [], redo = new Set();
    for (let z = tz - R; z <= tz + R; z++) for (let x = tx - R; x <= tx + R; x++) {
      if (st.br > 1 && Math.hypot(x - tx, z - tz) > r) continue;
      if (x < 3 || z < 3 || x >= m.W - 3 || z >= m.H - 3) continue; const i = m.idx(x, z);
      if (m.water[i] || (m.lvl[i] === st.lv && !m.ramp[i])) continue;
      const o = m.objAt(x, z); if (o && !nature(o)) continue; if (o) redo.add(o);
      if (!stroke.seen.has(i)) { stroke.seen.add(i); stroke.list.push([i, m.lvl[i], m.ramp[i], m.surf[i]]); }
      m.lvl[i] = st.lv; m.ramp[i] = 0; if (st.lv >= 9 && m.surf[i] <= 1) m.surf[i] = 8; else if (st.lv < 9 && m.surf[i] === 8) m.surf[i] = 0; // la neige sur les sommets m.markDirty(x, z); changed.push([x, z]);
    }
    for (const o of redo) reseat(m, o);
    if (changed.length) { touchPx(m, changed); stroke.n += changed.length; }
    return changed.length;
  }
  // un arbre, une fleur ou un rocher se repose à la nouvelle hauteur du terrain
  function reseat(m, o) { if (!m.list.has(o)) return; const ex = {}; for (const k of ['v', 'f', 'g', 'iid', 'txt', 'cy']) if (o[k] != null) ex[k] = o[k]; const { t, x, z, r } = o; m.removeObj(o); m.addObj(t, x, z, r || 0, ex); }
  function lift() { const p = G.player, m = G.world; if (G.map !== m || !p) return; const g = p.groundAt ? p.groundAt(p.x, p.z) : m.topAt(p.x, p.z); if (p.y < g) p.y = g; }
  function undo() {
    const s = st.undo.pop(), m = G.world; if (!s) { G.sfx('error'); return; } const ch = [];
    for (let k = s.list.length - 1; k >= 0; k--) { const [i, l, r, f] = s.list[k], x = i % m.W, z = Math.floor(i / m.W); m.lvl[i] = l; m.ramp[i] = r; m.surf[i] = f; m.markDirty(x, z); ch.push([x, z]); }
    for (const [x, z] of ch) { const o = m.objAt(x, z); if (o && nature(o) && o.x === x && o.z === z) reseat(m, o); }
    touchPx(m, ch); lift(); G.sfx('dig'); render(); updUndo();
  }
  const updUndo = () => { const b = $('mh-undo'); if (b) b.disabled = !st.undo.length; };

  // ---------- la barre d'outils ----------
  function bar() {
    if ($('map-haut')) return; const cv = $('bigmap'), box = document.createElement('div'); box.id = 'map-haut';
    box.innerHTML = `<style>
      #map-haut{margin:8px 0 2px;color:var(--bark);font:700 13px Nunito,sans-serif}
      #map-haut .mh-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
      #map-haut .mh-tab{padding:6px 14px;font-size:15px}
      #map-haut .mh-tab.on{background:var(--leaf);color:#fff;box-shadow:0 4px 0 var(--leaf-d)}
      #map-haut .mh-lv{width:34px;height:34px;border-radius:10px;border:3px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.18);font:800 13px Nunito,sans-serif;color:#1d2a1a;cursor:pointer;padding:0}
      #map-haut .mh-lv.on{border-color:#3d2b1d;transform:scale(1.15)}
      #map-haut .mh-sm{padding:4px 10px;font-size:13px;border-radius:12px}
      #map-haut .mh-sm.on{background:#3d2b1d;color:#fff}
      #map-haut #mh-info{font-weight:600;opacity:.85}
      #map-haut[data-on="0"] .mh-tools{display:none}
      #bigmap.mh-paint{cursor:crosshair;touch-action:none}
    </style>
    <div class="mh-row"><button class="btn alt mh-tab" data-tab="0" type="button">🗺️ Carte</button><button class="btn alt mh-tab" data-tab="1" type="button">⛰️ Hauteur</button></div>
    <div class="mh-tools">
      <div class="mh-row"><span>Niveau :</span>${COL.map((c, k) => `<button class="mh-lv" data-lv="${k}" type="button" style="background:${c};color:${k >= 6 && k <= 8 ? '#fff' : '#1d2a1a'}" title="Niveau ${k} — ${NOM[k]}">${k}</button>`).join('')}</div>
      <div class="mh-row"><span>Pinceau :</span>${[1, 3, 5, 9, 15].map(b => `<button class="btn alt mh-sm" data-br="${b}" type="button">${b}</button>`).join('')}
        <span style="margin-left:8px">Zoom :</span>${[1, 2, 4, 8].map(z => `<button class="btn alt mh-sm" data-zm="${z}" type="button">×${z}</button>`).join('')}
        <button class="btn alt mh-sm" id="mh-undo" type="button" style="margin-left:8px">↩️ Annuler</button></div>
      <div class="mh-row"><span id="mh-info"></span></div>
    </div>`;
    cv.insertAdjacentElement('afterend', box);
    box.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { setOn(b.dataset.tab === '1'); G.sfx('ui'); });
    box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { st.lv = +b.dataset.lv; G.sfx('ui'); sync(); render(); });
    box.querySelectorAll('[data-br]').forEach(b => b.onclick = () => { st.br = +b.dataset.br; G.sfx('ui'); sync(); });
    box.querySelectorAll('[data-zm]').forEach(b => b.onclick = () => { const p = G.map === G.world ? G.player : null; if (st.zoom === 1 || +b.dataset.zm === 1) { st.cx = p ? p.x : G.world.W / 2; st.cz = p ? p.z : G.world.H / 2; } st.zoom = +b.dataset.zm; G.sfx('ui'); sync(); render(); });
    $('mh-undo').onclick = undo;
    // peindre à la souris (ou au doigt) ; clic droit ou molette : se déplacer dans la carte zoomée
    const cell = e => { const m = G.world, r = cv.getBoundingClientRect(), V = view(m, cv), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height; return [Math.floor(V.x0 + x / V.sc), Math.floor(V.z0 + y / V.sc)]; };
    cv.addEventListener('pointerdown', e => { if (!st.on) return; e.preventDefault(); const m = G.world, c = cell(e);
      if (e.button === 2 || e.button === 1 || e.shiftKey) { st.drag = { pan: 1, c, cx: st.cx, cz: st.cz, sx: e.clientX, sy: e.clientY }; cv.setPointerCapture(e.pointerId); return; }
      if (G.net && G.net.visit) { G.ui.toast('On ne modifie que son propre village.'); return; }
      st.drag = { list: [], seen: new Set(), n: 0 }; cv.setPointerCapture(e.pointerId); if (paint(m, c[0], c[1], st.drag)) G.sfx('dig', .5); st.hover = c; render(); });
    cv.addEventListener('pointermove', e => { if (!st.on) return; const m = G.world, c = cell(e); st.hover = c;
      if (st.drag && st.drag.pan) { const V = view(m, cv), r = cv.getBoundingClientRect(); st.cx = st.drag.cx - (e.clientX - st.drag.sx) * cv.width / r.width / V.sc; st.cz = st.drag.cz - (e.clientY - st.drag.sy) * cv.height / r.height / V.sc; }
      else if (st.drag) { const L = st.drag.last || c, n = Math.max(Math.abs(c[0] - L[0]), Math.abs(c[1] - L[1])); for (let k = 1; k <= n; k++) paint(m, Math.round(L[0] + (c[0] - L[0]) * k / n), Math.round(L[1] + (c[1] - L[1]) * k / n), st.drag); st.drag.last = c; }
      render(); });
    const end = () => { const d = st.drag; st.drag = null; if (!d || d.pan) return; if (d.list.length) { st.undo.push(d); if (st.undo.length > 30) st.undo.shift(); lift(); G.sfx('place', .4); } updUndo(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', () => { if (st.on && !st.drag) { st.hover = null; render(); } });
    cv.addEventListener('contextmenu', e => { if (st.on) e.preventDefault(); });
    cv.addEventListener('wheel', e => { if (!st.on) return; e.preventDefault(); const zs = [1, 2, 4, 8], k = zs.indexOf(st.zoom), nk = G.clamp(k + (e.deltaY < 0 ? 1 : -1), 0, 3); if (nk === k) return; const c = cell(e); if (st.zoom === 1) { st.cx = c[0]; st.cz = c[1]; } else { st.cx = (st.cx + c[0]) / 2; st.cz = (st.cz + c[1]) / 2; } st.zoom = zs[nk]; sync(); render(); }, { passive: false });
  }
  function sync() {
    const box = $('map-haut'); if (!box) return; box.dataset.on = st.on ? '1' : '0';
    box.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', (b.dataset.tab === '1') === st.on));
    box.querySelectorAll('[data-lv]').forEach(b => b.classList.toggle('on', +b.dataset.lv === st.lv));
    box.querySelectorAll('[data-br]').forEach(b => b.classList.toggle('on', +b.dataset.br === st.br));
    box.querySelectorAll('[data-zm]').forEach(b => b.classList.toggle('on', +b.dataset.zm === st.zoom));
    $('bigmap').classList.toggle('mh-paint', st.on); document.querySelectorAll('#mapfull .map-legend').forEach(l => l.style.display = st.on ? 'none' : ''); updUndo();
  }
  function setOn(on) { st.on = on; if (!on) { st.zoom = 1; st.hover = null; } sync(); G.ui.openMap(); }

  G.on('init', () => { const U = G.ui, om = U.openMap; if (!om) return;
    U.openMap = () => { bar(); if (G.map && G.map.interior && st.on) { /* on peint quand même le village, vu de la carte */ } om(); sync(); if (st.on) render(); };
    const cm = U.closeMap; U.closeMap = () => { st.drag = null; lift(); cm(); };
    $('map-close').onclick = U.closeMap; });
  G.mapHeight = { st, render, COL, NOM };
})();
