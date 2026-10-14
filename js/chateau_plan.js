'use strict';
// ===== Plan du château (touche H dans un château classique à la française) : l'architecte, c'est toi =====
// Le plan montre toutes les pièces vues d'en haut : leur vrai parquet ou marbre, la couleur des murs, les fenêtres de la façade, les arches,
// la porte d'entrée, les meubles et les lustres. Pièces : nom, peinture à moulures ou papier peint, sol, rideaux, appliques, meubler ou ranger.
// Murs : monter une cloison (une pièce devient deux) ou en abattre une. Arches et portes : grandes arches ouvertes, doubles portes, passages.
// Fenêtres : porte-fenêtre cintrée, porte-fenêtre, fenêtre à allège, œil-de-bœuf. Rideaux : velours, damas, soie, lin, voilage.
// Lustres : un modèle par pièce (en Survie, ceux de ton sac). Meubles : choisir, tourner (R ou clic droit), poser ; un clic reprend un meuble.
// Tout se redessine aussitôt dans le château, en 3D, derrière le plan. =====
(function () {
  const U = G.ui, $ = G.el, O = G.OBJ, PI = Math.PI, CI = () => G.chateauInterior, CP = () => G.CHPLAN;
  const VOID = 0, WALL = 1, FLOOR = 2, OPEN = 3, DOOR = 4, NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], KEEP = ['v', 'f', 'g', 'iid', 'txt', 'vi', 'wt', 'off'];
  const TOOLS = [['piece', '🏛️ Pièces'], ['mur', '🧱 Murs'], ['arche', '⛩️ Arches et portes'], ['fen', '🪟 Fenêtres'], ['rideau', '🎀 Rideaux'], ['lustre', '💡 Lustres'], ['meuble', '🪑 Meubles']];
  const TIPS = { piece: 'Clique une pièce pour changer son nom, ses murs, son sol, ses rideaux…', mur: 'Glisse sur le parquet pour monter une cloison, sur une cloison pour l\'abattre.',
    arche: 'Glisse sur un mur entre deux pièces pour l\'ouvrir (« Mur plein » pour refermer).', fen: 'Clique une fenêtre, ou une pièce pour toutes ses fenêtres.',
    rideau: 'Clique une fenêtre, ou une pièce pour toutes ses fenêtres.', lustre: 'Clique une pièce pour y accrocher ce lustre.', meuble: 'Clique pour poser ; clique un meuble pour le reprendre (R ou clic droit : tourner).' };
  const KICO = { salon: '⚜', galerie: '🪞', manger: '🍽️', biblio: '📚', chambre: '🛏️', musique: '🎼', reine: '👑', cabinet: '✒️', anti: '🏛️', vestibule: '🚪', bal: '💃', chapelle: '⛪', billard: '🎱', boudoir: '🌸', jeux: '🃏', gardes: '🛡️' };
  // petits dessins des styles de fenêtre
  const WICO = { cintree: '<path d="M3 27V10a7 7 0 0 1 14 0v17z"/><path d="M10 4v23M3 14h14M3 20.5h14" fill="none"/>', pf: '<path d="M3 27V3h14v24z"/><path d="M10 3v24M3 11h14M3 19h14" fill="none"/>',
    fen: '<path d="M3 20V3h14v17z"/><path d="M10 3v17M3 11.5h14M1.5 22.5h17" fill="none"/>', oeil: '<circle cx="10" cy="11" r="7"/><path d="M10 4v14M3 11h14" fill="none"/>' };
  const wico = id => `<svg viewBox="0 0 20 28" width="15" height="21" style="flex:none"><g fill="#cfe6f7" stroke="#6b4a32" stroke-width="1.4">${WICO[id]}</g></svg>`;
  // catalogue des meubles d'intérieur (mode Créatif), rangés par famille
  const NOT = /^(torche|feu_camp|boite_lettres|panneau|fontaine|puits|parasol|transat|etabli|epouvantail|bonhomme_neige|balancoire|moulin|phare|ponton|planches|montgolfiere|scene_club|table_pique|table_jardin|table_rondins|chaise_jardin|chaise_bistrot|banc_parc|banc_fer|banc_pierre|banc_rondin|banc_bambou|colonne_morris|fontaine_wallace|etal_|manche_air|balise|botte_foin|lanterne_pierre|arche_pierre|lampadaire|sac_couchage|rayon_chaussures|paillasson)/;
  const FAM = [['salon', '🛋️ Salon', /canape|fauteuil|bergere|club|trone|cheminee|piano|paravent|horloge|tapis|table_basse|table_marbre|table_verre/], ['table', '🍽️ Tables et chaises', /^table|chaise|tabouret|banc/],
    ['chambre', '🛏️ Chambre', /^lit|commode|armoire|coffre|miroir|mannequin/], ['bureau', '📚 Bureau', /biblio|bureau|etagere|boule|maquette|aquarium|percolateur|tv|globe/], ['lampe', '💡 Lampes', /lamp|lantern/],
    ['art', '🖼️ Art', /tableau|statue/], ['plante', '🪴 Plantes', /^pl_\d|plante|pot_fleurs/], ['autre', '✨ Autres', /./]];
  let st = null, rbT = 0, rq = 0, wasOpen = false, hDown = false, catC = null; const imgs = {}, avg = {}, urls = {};
  const cre = () => G.mode !== 'survie', ro = () => !!(st && st.m.isVisit);
  const floorArea = () => { const pd = CI().planData(st.m); let n = 0; for (let i = 0; i < pd.T.length; i++) if (pd.T[i] === FLOOR) n++; return n; }; // surface des pièces (cases)
  const col = c => '#' + new THREE.Color(c).getHexString();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nm = t => (G.ITEMS[t] && G.ITEMS[t].n) || t;
  const isOpen = () => !$('panel').hidden && !!$('pl-cv');
  const purl = (k, id) => urls[k + id] || (urls[k + id] = id.startsWith('design:') ? ((G.designs || [])[+id.slice(7)] || {}).img || '' : G.patURL(k, id));
  // ce qu'on reprend revient dans le sac (ou au rangement s'il est plein) ; en Créatif, il n'y a rien à rendre
  const giveBack = t => { if (cre() || !G.ITEMS[t]) return; if (G.inv.add(t, 1) > 0 && G.storeAdd) G.storeAdd(t, 1); };
  const css = document.createElement('style'); css.textContent = `
#panel.plan-open{background:rgba(30,22,12,.1)}
#panel.plan-open .panel{width:min(1200px,100%)}
#pl-wrap{flex:1 1 560px;min-width:260px;overflow:auto;max-height:64vh;border-radius:18px;background:#e9dcbf;box-shadow:inset 0 0 0 2px #c4a46a,inset 0 0 22px rgba(110,75,30,.25);padding:8px}
#pl-cv{display:block;margin:auto;cursor:crosshair;border-radius:6px}
#pl-side{flex:1 1 260px;min-width:220px;max-height:64vh;overflow:auto;font-size:14px;color:var(--bark);padding-right:4px}
#pl-side h4{margin:2px 0 8px;font-size:15px;color:var(--ink)}
#pl-side p{margin:0 0 10px;line-height:1.38}
.pl-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.pl-chip{border:none;background:#fff;border-radius:12px;padding:5px 9px;display:flex;align-items:center;gap:6px;cursor:pointer;box-shadow:0 2px 0 var(--paper-d);font:700 13px var(--f-body,system-ui);color:var(--ink);text-align:left}
.pl-chip.sq{padding:3px}
.pl-chip.on{background:#fff3c4;box-shadow:0 0 0 2px #d9b04a,0 2px 0 #b8955a}
.pl-chip:disabled{opacity:.6;cursor:default}
.pl-chip img{width:30px;height:30px;object-fit:contain}
.pl-sw{display:inline-block;width:30px;height:30px;border-radius:9px;background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.pl-in{width:100%;box-sizing:border-box;border:none;border-radius:12px;padding:8px 12px;font:700 15px var(--f-body,system-ui);background:#fff;box-shadow:inset 0 2px 0 var(--paper-d);margin-bottom:12px;color:var(--ink)}
#pl-side .grid{grid-template-columns:repeat(auto-fill,minmax(74px,1fr))}
`; document.head.appendChild(css);

  // ---------- ouvrir ----------
  const odec = U.openDecor; U.openDecor = tab => { const m = G.map; if (m && m.interior && m.meta && m.meta.plan) return openPlan(); return odec(tab); };
  function openPlan(tool) {
    const m = G.map; if (!m || !m.meta || !m.meta.plan) return;
    if (!st || st.m !== m) st = { m, tool: 'piece', sel: 0, opType: 'a', winSt: 'cintree', curt: 'rouge', lus: 'lustre_cristal', item: null, carry: null, rot: 0, zoom: 1, fam: 'salon', q: '', hover: null };
    if (tool) st.tool = tool;
    const pd = CI().planData(m), p = G.player; if (!pd.pl.rooms.some(r => r.id === st.sel) && p) { const tx = Math.floor(p.x), tz = Math.floor(p.z); st.sel = m.inb(tx, tz) ? pd.R[tz * pd.W + tx] || 0 : 0; }
    U.open('plan', '📐 Plan du château'); render();
  }
  function render() {
    if (!st) return; const t = $('panel-tabs'); t.innerHTML = '';
    for (const [id, n] of TOOLS) { const b = document.createElement('button'); b.className = 'tab' + (id === st.tool ? ' on' : ''); b.textContent = n; b.onclick = () => { G.sfx('ui'); st.tool = id; render(); }; t.appendChild(b); }
    $('panel-body').innerHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start"><div id="pl-wrap"><canvas id="pl-cv"></canvas></div><div id="pl-side"></div></div>';
    const f = $('panel-foot'); f.innerHTML = '<div class="desc" id="pl-tip"></div>';
    const btn = (txt, fn, title) => { const b = document.createElement('button'); b.className = 'btn alt'; b.textContent = txt; b.title = title; b.onclick = () => { G.sfx('ui'); fn(); }; f.appendChild(b); return b; };
    btn('－', () => zoom(1 / 1.25), 'Dézoomer'); btn('＋', () => zoom(1.25), 'Zoomer');
    if (!ro()) btn('↩ Plan d\'origine', resetPlan, 'Revenir au plan qui suit l\'extérieur du château');
    $('pl-cv').style.touchAction = st.tool === 'mur' || st.tool === 'arche' ? 'none' : 'pan-x pan-y';
    side(); hook(); draw(); tip();
  }
  const zoom = k => { st.zoom = G.clamp(st.zoom * k, .6, 4); draw(); };
  const tip = s => { const e = $('pl-tip'); if (e) e.textContent = s || (ro() ? 'Tu visites ce château : tu peux regarder le plan, pas le changer.' : TIPS[st.tool]); };
  const later = (ms = 140) => { clearTimeout(rbT); rbT = setTimeout(() => { if (st && st.m.meta.plan) CI().rebuild(st.m); }, ms); };
  const redraw = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; draw(); }); };

  // ---------- dessin du plan ----------
  const cellSize = () => { const pd = CI().planData(st.m), wrap = $('pl-wrap'), ww = ((wrap && wrap.clientWidth) || 600) - 18, wh = innerHeight * .64 - 18; return G.clamp(Math.min(ww / pd.W, wh / pd.H), 4, 34) * st.zoom; };
  function floorPat(c, id, cs) {
    let im = null; try { const t = G.patTex('floor', id); im = t && t.image; } catch (e) { } if (!im || !im.width) return '#d9c9a8';
    const p = c.createPattern(im, 'repeat'); try { p.setTransform(new DOMMatrix().scale(cs * 2 / im.width)); } catch (e) { } return p;
  }
  function wallCol(id) {
    const P = CP().PAINTS; if (P[id]) return col(P[id][0]); if (avg[id]) return avg[id]; let r = '#e9dcc4';
    try { const t = G.patTex('wall', id), c = G.cv(8, 8), x = c.getContext('2d'); x.drawImage(t.image, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let a = 0, b = 0, g = 0; for (let i = 0; i < 256; i += 4) { a += d[i]; g += d[i + 1]; b += d[i + 2]; } r = `rgb(${a >> 6},${g >> 6},${b >> 6})`; } catch (e) { }
    return avg[id] = r;
  }
  function icon(t) { if (!G.ITEMS[t]) return null; if (imgs[t] !== undefined) return imgs[t]; const u = U.thumb && U.thumb(t); if (!u) return imgs[t] = null; const im = new Image(); im.onload = () => { if (isOpen()) redraw(); }; im.src = u; return imgs[t] = im; }
  const rr = (c, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  // cases d'une fenêtre : sur le mur de façade, ou la case de parquet juste devant
  function winCells(w, inner) { const a = Math.floor(w.u - w.w / 2), b = Math.floor(w.u + w.w / 2 - 1e-3), out = []; for (let s = a; s <= b; s++) out.push(w.nz ? [s, w.z + (inner ? w.nz : 0)] : [w.x + (inner ? w.nx : 0), s]); return out; }
  function winAt(x, z, inner) { const pl = st.m.meta.plan; for (const w of pl.wins) { if (!w.r) continue; for (const [a, b] of winCells(w, false)) if (a === x && b === z) return w; if (inner) for (const [a, b] of winCells(w, true)) if (a === x && b === z) return w; } return null; }
  // une ouverture tient debout : du parquet de part et d'autre, du mur sur les deux autres côtés
  const okOpen = (ti, x, z) => { const f = NB4.map(([dx, dz]) => ti(x + dx, z + dz) === FLOOR); return (f[0] && f[1] && !f[2] && !f[3]) || (f[2] && f[3] && !f[0] && !f[1]); };
  // les ouvertures (arches, portes, passages, entrée) : suites de cases le long du mur
  function openRuns(pd) {
    const { W, H, T, pl } = pd, ti = (x, z) => x < 0 || z < 0 || x >= W || z >= H ? VOID : T[z * W + x], seen = new Uint8Array(W * H), runs = [];
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x, t = T[i]; if ((t !== OPEN && t !== DOOR) || seen[i]) continue;
      const alongX = t === DOOR || ti(x, z - 1) === FLOOR || ti(x, z + 1) === FLOOR, cells = []; let a = x, b = z;
      while (ti(a, b) === t && !seen[b * W + a]) { seen[b * W + a] = 1; cells.push([a, b]); if (alongX) a++; else b++; }
      // côté pièce de l'entrée (les vantaux s'ouvrent vers l'intérieur)
      const inward = alongX ? (ti(x, z - 1) === FLOOR ? -1 : 1) : (ti(x - 1, z) === FLOOR ? -1 : 1);
      runs.push({ t, alongX, cells, inward, type: t === DOOR ? 'd' : (pl.ops[x + ',' + z] || 'a') }); }
    return runs;
  }
  // quart de cercle d'un vantail : de sa position fermée à sa position ouverte
  function swing(c, hx, hz, r, cdx, cdz, odx, odz) { const ac = Math.atan2(cdz, cdx), ao = Math.atan2(odz, odx), d = ((ao - ac) % (2 * PI) + 2 * PI) % (2 * PI); c.beginPath(); if (Math.abs(d - PI / 2) < .01) c.arc(hx, hz, r, ac, ao); else c.arc(hx, hz, r, ao, ac); c.stroke(); }
  function draw() {
    const cv = $('pl-cv'); if (!cv || !st) return; const m = st.m, pd = CI().planData(m), { W, H, T, R, pl } = pd, cs = cellSize(), K = CP(); st.cs = cs;
    cv.width = Math.round(W * cs); cv.height = Math.round(H * cs); const c = cv.getContext('2d');
    const ti = (x, z) => x < 0 || z < 0 || x >= W || z >= H ? VOID : T[z * W + x], rooms = new Map(pl.rooms.map(r => [r.id, r]));
    const roomAt = (x, z) => { const t = ti(x, z); if (t === FLOOR) return rooms.get(R[z * W + x]); if (t === OPEN || t === DOOR) for (const [dx, dz] of NB4) if (ti(x + dx, z + dz) === FLOOR) return rooms.get(R[(z + dz) * W + x + dx]); return null; };
    // le dehors : du parchemin, et l'ombre portée du château
    c.fillStyle = '#ebdfc3'; c.fillRect(0, 0, cv.width, cv.height);
    c.save(); c.shadowColor = 'rgba(70,45,15,.35)'; c.shadowBlur = cs * 1.2; c.shadowOffsetX = cs * .25; c.shadowOffsetY = cs * .35; const all = new Path2D();
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (T[z * W + x] !== VOID) all.rect(x * cs, z * cs, cs + .6, cs + .6); c.fillStyle = '#3a2b1d'; c.fill(all); c.restore();
    // les sols : le vrai motif de chaque pièce (point de Hongrie, bâtons rompus, damier de marbre…)
    const fl = new Map(); for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const t = T[z * W + x]; if (t !== FLOOR && t !== OPEN && t !== DOOR) continue; const rm = roomAt(x, z), k = rm ? rm.floor : '';
      (fl.get(k) || fl.set(k, new Path2D()).get(k)).rect(x * cs, z * cs, cs + .6, cs + .6); }
    for (const [k, p] of fl) { c.fillStyle = k ? floorPat(c, k, cs) : '#d9c9a8'; c.fill(p); }
    // pièce choisie, pièce survolée
    const hl = (id, fill) => { if (!id) return; const p = new Path2D(); for (let i = 0; i < W * H; i++) if (R[i] === id && T[i] === FLOOR) { const x = i % W; p.rect(x * cs, (i - x) / W * cs, cs + .6, cs + .6); } c.fillStyle = fill; c.fill(p); };
    if (st.tool === 'piece') hl(st.sel, 'rgba(255,214,110,.34)');
    if (st.hover && st.hoverRoom && !st.hoverWin && ['piece', 'fen', 'rideau', 'lustre'].includes(st.tool)) hl(st.hoverRoom, 'rgba(255,255,255,.24)');
    // les murs : à l'encre, la façade plus foncée ; un liseré de la couleur des murs de chaque pièce
    const pw = new Path2D(), pe = new Path2D(); for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (T[z * W + x] !== WALL) continue; (NB4.some(([dx, dz]) => ti(x + dx, z + dz) === VOID) ? pe : pw).rect(x * cs, z * cs, cs + .6, cs + .6); }
    c.fillStyle = '#5a4430'; c.fill(pw); c.fillStyle = '#33251a'; c.fill(pe);
    const lis = new Map(), sw = Math.max(1.5, cs * .17);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (T[z * W + x] !== FLOOR) continue; const rm = rooms.get(R[z * W + x]); if (!rm) continue; const k = wallCol(rm.wall); let p = lis.get(k); if (!p) lis.set(k, p = new Path2D());
      if (ti(x, z - 1) === WALL) p.rect(x * cs, z * cs, cs + .6, sw); if (ti(x, z + 1) === WALL) p.rect(x * cs, (z + 1) * cs - sw, cs + .6, sw); if (ti(x - 1, z) === WALL) p.rect(x * cs, z * cs, sw, cs + .6); if (ti(x + 1, z) === WALL) p.rect((x + 1) * cs - sw, z * cs, sw, cs + .6); }
    for (const [k, p] of lis) { c.fillStyle = k; c.fill(p); }
    // arches, doubles portes, passages, porte d'entrée
    for (const r of openRuns(pd)) { const a = r.cells[0], b = r.cells[r.cells.length - 1], x0 = a[0] * cs, z0 = a[1] * cs, x1 = (b[0] + 1) * cs, z1 = (b[1] + 1) * cs, L = r.alongX ? x1 - x0 : z1 - z0, mid = r.alongX ? z0 + cs / 2 : x0 + cs / 2;
      const P = (u, v) => r.alongX ? [x0 + u, mid + v] : [mid + v, z0 + u], jam = Math.max(2, cs * .3);
      c.fillStyle = r.type === 'd' ? '#8a2f3a' : '#c9a24a'; if (r.alongX) { c.fillRect(x0 - jam / 2, z0, jam, cs); c.fillRect(x1 - jam / 2, z0, jam, cs); } else { c.fillRect(x0, z0 - jam / 2, cs, jam); c.fillRect(x0, z1 - jam / 2, cs, jam); }
      c.lineWidth = Math.max(1.2, cs * .09);
      if (r.type === 'a') { c.strokeStyle = '#b8892a'; c.setLineDash([cs * .32, cs * .2]); c.beginPath(); c.moveTo(...P(0, 0)); c.lineTo(...P(L, 0)); c.stroke(); c.setLineDash([]); c.fillStyle = '#d9b04a'; const [kx, kz] = P(L / 2, 0); c.beginPath(); c.arc(kx, kz, Math.max(2, cs * .17), 0, 7); c.fill(); }
      else if (r.type === 'p' || r.type === 'd') { const s = r.type === 'd' ? r.inward : 1, h = L / 2, ax = r.alongX ? 1 : 0, az = r.alongX ? 0 : 1, ox = r.alongX ? 0 : s, oz = r.alongX ? s : 0;
        c.strokeStyle = r.type === 'd' ? '#8a2f3a' : '#7a5530'; c.beginPath(); for (const [u, k] of [[0, 1], [L, -1]]) { const [hx, hz] = P(u, 0); c.moveTo(hx, hz); c.lineTo(hx + ox * h, hz + oz * h); void k; } c.stroke();
        c.setLineDash([cs * .12, cs * .12]); for (const [u, k] of [[0, 1], [L, -1]]) { const [hx, hz] = P(u, 0); swing(c, hx, hz, h, ax * k, az * k, ox, oz); } c.setLineDash([]); }
      else { c.strokeStyle = '#8a6a40'; c.setLineDash([cs * .14, cs * .14]); c.beginPath(); c.moveTo(...P(0, -cs * .38)); c.lineTo(...P(L, -cs * .38)); c.moveTo(...P(0, cs * .38)); c.lineTo(...P(L, cs * .38)); c.stroke(); c.setLineDash([]); }
      if (r.type === 'd') { const [fx, fz] = P(L / 2, -r.inward * cs * 1.3); c.font = `800 ${Math.max(10, cs * 1.15)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#8a2f3a'; c.fillText('⚜', fx, fz); } }
    // fenêtres de la façade : appui de pierre, vitrage, et la couleur des rideaux côté pièce
    for (const w of pl.wins) { if (!w.r) continue; const rm = rooms.get(w.r), cu = K.CURT[w.c || (rm && rm.curt)] || K.CURT.rouge, a = (w.u - w.w / 2) * cs, b = (w.u + w.w / 2) * cs;
      const on = st.hoverWin === w || ((st.tool === 'fen' || st.tool === 'rideau') && st.hoverRoom === w.r && !st.hoverWin), hz = !!w.nz, e0 = hz ? w.z * cs : w.x * cs, inS = hz ? (w.nz < 0 ? 0 : 1) : (w.nx < 0 ? 0 : 1);
      const R4 = (u0, u1, v0, v1) => hz ? [u0, e0 + v0, u1 - u0, v1 - v0] : [e0 + v0, u0, v1 - v0, u1 - u0];
      c.fillStyle = '#f2e8d2'; c.fillRect(...R4(a, b, 0, cs)); c.fillStyle = w.st === 'oeil' ? '#d9ecf7' : '#a9d3f0'; c.fillRect(...R4(a, b, cs * .36, cs * .64));
      c.strokeStyle = '#4a6a86'; c.lineWidth = 1; c.beginPath(); for (const v of [cs * .36, cs * .64]) { const q = R4(a, b, v, v); c.moveTo(q[0], q[1]); c.lineTo(q[0] + (hz ? q[2] : 0), q[1] + (hz ? 0 : q[3])); } c.stroke();
      if (w.st === 'oeil') { const [cx2, cz2] = hz ? [(a + b) / 2, e0 + cs / 2] : [e0 + cs / 2, (a + b) / 2]; c.beginPath(); c.arc(cx2, cz2, cs * .32, 0, 7); c.stroke(); }
      if (w.st === 'cintree') { c.fillStyle = '#d9b04a'; const [cx2, cz2] = hz ? [(a + b) / 2, e0 + (inS ? cs : 0)] : [e0 + (inS ? cs : 0), (a + b) / 2]; c.beginPath(); c.arc(cx2, cz2, Math.max(1.5, cs * .13), 0, 7); c.fill(); }
      if (w.st === 'fen') { c.fillStyle = '#8a7356'; c.fillRect(...R4(a, b, inS ? cs * .86 : 0, inS ? cs : cs * .14)); }
      if (cu[0]) { c.fillStyle = col(cu[0]); const v0 = inS ? cs : -cs * .3, v1 = inS ? cs * 1.3 : 0, ct = Math.max(2, cs * .28); c.fillRect(...R4(a - ct * .3, a + ct, v0, v1)); c.fillRect(...R4(b - ct, b + ct * .3, v0, v1)); }
      if (on) { c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeRect(...R4(a - 1, b + 1, -1, cs + 1)); } }
    // meubles (avec leur image), puis lustres
    for (const o of m.list) { const d = O[o.t]; if (!d || d.ceil || o.t === 'paillasson') continue; const [fw, fd] = G.fpDims(d, o.r || 0), x = o.x * cs, z = o.z * cs, w = fw * cs, h = fd * cs, hv = st.tool === 'meuble' && st.hoverObj === o;
      rr(c, x + 1.5, z + 1.5, w - 3, h - 3, Math.min(7, cs * .28)); c.fillStyle = hv ? 'rgba(255,236,190,.92)' : 'rgba(255,251,242,.74)'; c.fill(); c.strokeStyle = hv ? '#d9b04a' : 'rgba(95,65,35,.5)'; c.lineWidth = hv ? 2.5 : 1; c.stroke();
      const im = icon(o.t); if (im && im.complete && im.naturalWidth) { const s = Math.min(w, h) * .94; c.drawImage(im, x + (w - s) / 2, z + (h - s) / 2, s, s); } }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const o of m.list) { const d = O[o.t]; if (!d || !d.ceil) continue; const x = (o.x + .5) * cs, z = (o.z + .5) * cs, g = c.createRadialGradient(x, z, 0, x, z, cs * 1.4); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)');
      c.fillStyle = g; c.fillRect(x - cs * 1.4, z - cs * 1.4, cs * 2.8, cs * 2.8); c.font = `${Math.max(10, cs * .95)}px system-ui,sans-serif`; c.fillStyle = '#b8862a'; c.fillText('✦', x, z); }
    // noms des pièces, au milieu de leur parquet
    const acc = new Map(); for (let i = 0; i < W * H; i++) if (T[i] === FLOOR && R[i]) { const x = i % W, q = acc.get(R[i]) || acc.set(R[i], [0, 0, 0]).get(R[i]); q[0] += x; q[1] += (i - x) / W; q[2]++; }
    c.lineJoin = 'round';
    for (const [id, [sx, sz, n]] of acc) { const rm = rooms.get(id); if (!rm) continue; const fs = G.clamp(Math.sqrt(n) * cs * .1, 10, 19); c.font = `800 ${fs}px system-ui,sans-serif`;
      // le nom reste dans le plan, même pour une pièce étroite au bord
      const tw = c.measureText(rm.n).width, cx = G.clamp((sx / n + .5) * cs, tw / 2 + 3, cv.width - tw / 2 - 3), cz = G.clamp((sz / n + .5) * cs, fs * 1.4, cv.height - fs);
      c.lineWidth = 4; c.strokeStyle = 'rgba(255,250,238,.9)'; c.strokeText(rm.n, cx, cz + fs * .45); c.fillStyle = '#4a3020'; c.fillText(rm.n, cx, cz + fs * .45);
      c.font = `${fs * 1.05}px system-ui,sans-serif`; c.strokeText(KICO[rm.k] || '⚜', cx, cz - fs * .62); c.fillText(KICO[rm.k] || '⚜', cx, cz - fs * .62); }
    // toi, et où tu regardes
    const p = G.player; if (p && G.map === m) { const x = p.x * cs, z = p.z * cs, r = Math.max(4, cs * .32), y = p.yaw; c.fillStyle = '#e8434b'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, z, r, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + Math.sin(y) * r * 1.9, z + Math.cos(y) * r * 1.9); c.lineTo(x + Math.sin(y + 2.4) * r * .9, z + Math.cos(y + 2.4) * r * .9); c.lineTo(x + Math.sin(y - 2.4) * r * .9, z + Math.cos(y - 2.4) * r * .9); c.fill(); }
    // sous la souris : ce que l'outil va faire
    const hv = st.hover; if (hv && !ro()) { const [x, z] = hv, t = ti(x, z), ext = NB4.some(([dx, dz]) => ti(x + dx, z + dz) === VOID); let w = 1, dd = 1, colr = null;
      if (st.tool === 'meuble' && st.item && !st.hoverObj) { const ob = G.ITEMS[st.item] && G.ITEMS[st.item].obj; if (ob && O[ob]) { [w, dd] = G.fpDims(O[ob], st.rot); colr = m.canPlace(ob, x, z, st.rot) ? '#4fc76a' : '#e05555';
          const im = icon(st.item); c.globalAlpha = .55; if (im && im.complete && im.naturalWidth) { const s = Math.min(w, dd) * cs * .94; c.drawImage(im, x * cs + (w * cs - s) / 2, z * cs + (dd * cs - s) / 2, s, s); } c.globalAlpha = 1;
          c.fillStyle = '#fff'; c.save(); c.translate((x + w / 2) * cs, (z + dd / 2) * cs); c.rotate([0, -PI / 2, PI, PI / 2][st.rot]); const e = (st.rot & 1 ? w : dd) * cs * .5; c.beginPath(); c.moveTo(0, e + 2); c.lineTo(-5, e - 5); c.lineTo(5, e - 5); c.fill(); c.restore(); } }
      else if (st.tool === 'mur') colr = t === FLOOR ? '#4fc76a' : t === WALL && !ext ? '#e05555' : null;
      else if (st.tool === 'arche') colr = t === OPEN ? (st.opType === 'mur' ? '#e05555' : '#f0c040') : t === WALL && !ext && st.opType !== 'mur' && okOpen(ti, x, z) ? '#f0c040' : null;
      if (colr) { c.strokeStyle = colr; c.lineWidth = 2.5; c.strokeRect(x * cs + 1.5, z * cs + 1.5, w * cs - 3, dd * cs - 3); } }
  }

  // ---------- la souris (ou le doigt) sur le plan ----------
  function hook() {
    const cv = $('pl-cv'); if (!cv) return; let drag = null;
    const cell = e => { const r = cv.getBoundingClientRect(); if (!r.width || !st.cs) return null; const x = Math.floor((e.clientX - r.left) * cv.width / r.width / st.cs), z = Math.floor((e.clientY - r.top) * cv.height / r.height / st.cs), pd = CI().planData(st.m); return x >= 0 && z >= 0 && x < pd.W && z < pd.H ? [x, z] : null; };
    // les cases entre deux positions de la souris (la cloison reste continue même si on glisse vite)
    const line = (a, b) => { const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])), out = []; for (let k = 1; k <= n; k++) out.push([Math.round(a[0] + (b[0] - a[0]) * k / n), Math.round(a[1] + (b[1] - a[1]) * k / n)]); return out; };
    cv.oncontextmenu = e => { e.preventDefault(); if (st.tool === 'meuble') rotate(); };
    cv.onpointerdown = e => { if (e.button === 2) return; const c = cell(e); if (!c) return; try { cv.setPointerCapture(e.pointerId); } catch (x) { } drag = { first: true, last: c }; act(c, drag); drag.first = false; after(drag, false); hover(c); draw(); };
    cv.onpointermove = e => { const c = cell(e); hover(c); if (drag && c && (c[0] !== drag.last[0] || c[1] !== drag.last[1])) { if (st.tool === 'mur' || st.tool === 'arche') for (const q of line(drag.last, c)) act(q, drag); drag.last = c; } redraw(); };
    const up = () => { if (drag) after(drag, true); drag = null; draw(); };
    cv.onpointerup = up; cv.onpointercancel = up;
    cv.onpointerleave = () => { if (drag) return; st.hover = st.hoverWin = st.hoverObj = null; st.hoverRoom = 0; tip(); redraw(); };
  }
  function hover(c) {
    st.hover = c; st.hoverWin = st.hoverObj = null; st.hoverRoom = 0; if (!c) return tip(); const m = st.m, pd = CI().planData(m), [x, z] = c, i = z * pd.W + x, t = pd.T[i], K = CP();
    st.hoverWin = st.tool === 'fen' || st.tool === 'rideau' || st.tool === 'piece' ? winAt(x, z, st.tool !== 'piece') : null; st.hoverRoom = t === FLOOR ? pd.R[i] : 0;
    if (st.tool === 'meuble') { const o = m.objAt(x, z); st.hoverObj = o && o.t !== 'paillasson' ? o : null; }
    const rm = pd.pl.rooms.find(q => q.id === st.hoverRoom), w = st.hoverWin;
    if (w) { const r2 = pd.pl.rooms.find(q => q.id === w.r); return tip('🪟 ' + K.WSTY[w.st] + ' · ' + (K.CURT[w.c || (r2 && r2.curt)] || K.CURT.rouge)[1] + (r2 ? ' — ' + r2.n : '')); }
    if (st.hoverObj) return tip('🪑 ' + nm(st.hoverObj.t) + (ro() ? '' : ' — clique pour le reprendre'));
    if (t === OPEN) return tip('⛩️ ' + K.OPS[pd.pl.ops[x + ',' + z] || 'a']); if (t === DOOR) return tip('⚜ Porte d\'entrée du château');
    if (t === WALL) return tip(NB4.some(([dx, dz]) => { const a = x + dx, b = z + dz; return a < 0 || b < 0 || a >= pd.W || b >= pd.H || pd.T[b * pd.W + a] === VOID; }) ? '🧱 Mur de façade' : '🧱 Cloison');
    tip(rm ? (KICO[rm.k] || '⚜') + ' ' + rm.n : '');
  }
  const rotate = () => { st.rot = (st.rot + 1) % 4; G.sfx('ui', .6); if (st.tool === 'meuble') side(); redraw(); };
  // une case du plan change : on garde le plan à jour tout de suite (collisions, sauvegarde)
  function setT(pd, i, v) { pd.T[i] = v; pd.bl[i] = v === FLOOR || v === OPEN || v === DOOR ? 0 : 1; pd.pl.T = G.b64.enc(pd.T); }
  // une arche entière (toutes ses cases) prend le même style
  function setRun(pd, x, z, type) {
    const { W, H, T, pl } = pd, ti = (a, b) => a < 0 || b < 0 || a >= W || b >= H ? VOID : T[b * W + a], alongX = ti(x, z - 1) === FLOOR && ti(x, z + 1) === FLOOR; let ch = false;
    const set = (a, b) => { const k = a + ',' + b, old = pl.ops[k] || 'a'; if (old === type) return; if (type === 'a') delete pl.ops[k]; else pl.ops[k] = type; ch = true; };
    for (const s of [1, -1]) for (let k = s > 0 ? 0 : -1; ; k += s) { const a = alongX ? x + k : x, b = alongX ? z : z + k; if (ti(a, b) !== OPEN) break; set(a, b); }
    return ch;
  }
  // après des murs montés ou abattus : une arche qui ne tient plus debout disparaît (bouchée, ou ouverte en grand)
  function fixOpens(pd) {
    const { W, H, T, pl } = pd, ti = (a, b) => a < 0 || b < 0 || a >= W || b >= H ? VOID : T[b * W + a]; let ch = true, any = false;
    while (ch) { ch = false; for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { const i = z * W + x; if (T[i] !== OPEN || okOpen(ti, x, z)) continue;
      const nf = NB4.filter(([dx, dz]) => ti(x + dx, z + dz) === FLOOR).length; T[i] = nf >= 3 ? FLOOR : WALL; pd.bl[i] = T[i] === FLOOR ? 0 : 1; delete pl.ops[x + ',' + z]; ch = any = true; } }
    if (any) pl.T = G.b64.enc(T);
  }
  // pourquoi on ne peut pas monter une cloison sur cette case
  function blockWhy(m, pd, x, z) {
    if (m.objAt(x, z) || (m.upAt && m.upAt(x, z))) return 'Un meuble est ici : déplace-le d\'abord (outil Meubles).';
    const p = G.player; if (p && G.map === m && Math.abs(p.x - (x + .5)) < .95 && Math.abs(p.z - (z + .5)) < .95) return 'Tu es là ! Une cloison ne se monte pas sur toi.';
    const d = pd.pl.door; if (d && z === d.z - 1 && x >= d.x0 && x <= d.x1) return 'Garde l\'entrée libre.';
    for (const w of pd.pl.wins) if (w.r) for (const [a, b] of winCells(w, true)) if (a === x && b === z) return 'Une fenêtre est là : la cloison la boucherait.';
    return null;
  }
  // ---------- ce que fait l'outil sur une case ----------
  function act([x, z], drag) {
    if (ro()) { if (drag.first) U.toast('Tu visites ce château : tu peux regarder le plan, pas le changer.'); return; }
    const m = st.m, pd = CI().planData(m), { W, H, T, R, pl } = pd, i = z * W + x, t = T[i], K = CP();
    const ti = (a, b) => a < 0 || b < 0 || a >= W || b >= H ? VOID : T[b * W + a], ext = (a, b) => NB4.some(([dx, dz]) => ti(a + dx, b + dz) === VOID);
    const say = s => { if (!drag.said) { drag.said = 1; U.toast(s); G.sfx('error'); } };
    const roomHere = t === FLOOR ? pl.rooms.find(q => q.id === R[i]) : null;
    switch (st.tool) {
      case 'piece': if (drag.first) { const w = winAt(x, z, false); st.sel = roomHere ? roomHere.id : w ? w.r : 0; side(); } return;
      case 'mur': {
        if (drag.first) drag.mode = t === FLOOR ? 'add' : t === WALL && !ext(x, z) ? 'del' : null;
        if (!drag.mode) { if (drag.first) say(t === WALL ? 'Les murs de façade ne bougent pas : leurs fenêtres sont celles de l\'extérieur.' : t === OPEN ? 'C\'est une arche : referme-la avec l\'outil Arches (« Mur plein »).' : t === DOOR ? 'C\'est la porte d\'entrée du château.' : 'Ici, c\'est dehors.'); return; }
        if (drag.mode === 'add' && t === FLOOR) { const why = blockWhy(m, pd, x, z); if (why) return say(why); const lu = m.ceilAt(x, z); if (lu) { m.removeObj(lu); giveBack(lu.t); }
          setT(pd, i, WALL); drag.walls = true; G.sfx('place', .3); }
        else if (drag.mode === 'del' && t === WALL && !ext(x, z)) { setT(pd, i, FLOOR); drag.walls = true; G.sfx('dig', .3); }
        return; }
      case 'arche': {
        if (st.opType === 'mur') { if (t === OPEN) { delete pl.ops[x + ',' + z]; setT(pd, i, WALL); drag.walls = true; G.sfx('place', .3); } else if (drag.first) say('Clique (ou glisse) sur une arche pour la refermer.'); return; }
        if (t === WALL && !ext(x, z) && okOpen(ti, x, z)) { setT(pd, i, OPEN); drag.walls = true; G.sfx('dig', .3); setRun(pd, x, z, st.opType); }
        else if (t === OPEN) { if (setRun(pd, x, z, st.opType)) { drag.deco = true; G.sfx('ui'); } }
        else if (drag.first) say(t === WALL && ext(x, z) ? 'On ne perce pas la façade : ses fenêtres suivent l\'extérieur du château.' : t === WALL ? 'Une arche se perce dans une cloison d\'une case, entre deux pièces.' : 'Clique sur une cloison entre deux pièces.');
        return; }
      case 'fen': { if (!drag.first) return; const w = winAt(x, z, true);
        if (w) { if (w.st !== st.winSt) { w.st = st.winSt; drag.deco = true; G.sfx('ui'); } return; }
        if (!roomHere) return; const ws = pl.wins.filter(q => q.r === roomHere.id); if (!ws.length) return say('Cette pièce n\'a pas de fenêtre sur la façade.');
        for (const q of ws) q.st = st.winSt; drag.deco = true; G.sfx('ui'); U.toast(roomHere.n + ' : ' + ws.length + ' × ' + K.WSTY[st.winSt]); return; }
      case 'rideau': { if (!drag.first) return; const w = winAt(x, z, true);
        if (w) { w.c = st.curt; drag.deco = true; G.sfx('ui'); return; }
        if (!roomHere) return; roomHere.curt = st.curt; for (const q of pl.wins) if (q.r === roomHere.id) q.c = ''; drag.deco = true; G.sfx('ui'); U.toast(roomHere.n + ' : ' + K.CURT[st.curt][1]); return; }
      case 'lustre': { if (!drag.first) return; if (!roomHere) return say('Clique dans une pièce.'); hang(m, roomHere); drag.deco = true; return; }
      case 'meuble': { if (!drag.first) return; const o = m.objAt(x, z);
        if (o && o.t === 'paillasson') return say('Le paillasson reste devant la porte.');
        if (o) { if (O[o.t].enter) return say('On ne déplace pas ça d\'ici.'); m.removeObj(o); giveBack(o.t); const ex = {}; for (const k of KEEP) if (o[k] != null) ex[k] = o[k]; st.carry = { t: o.t, ex };
          if (G.ITEMS[o.t]) { st.item = o.t; st.rot = o.r || 0; } G.sfx('pickup'); U.toast(nm(o.t) + ' : clique où le reposer (R pour tourner).'); side(); return; }
        if (!st.item) return say('Choisis d\'abord un meuble dans la liste, à droite.');
        const it = G.ITEMS[st.item], ob = it && it.obj; if (!ob || !O[ob]) return;
        if (!m.canPlace(ob, x, z, st.rot)) return say('Pas la place ici : il faut du parquet libre.');
        if (!cre() && !G.inv.remove(st.item, 1)) { st.item = null; side(); return say('Tu n\'en as plus dans ton sac.'); }
        m.addObj(ob, x, z, st.rot, st.carry && st.carry.t === ob ? st.carry.ex : null); st.carry = null; G.sfx('place');
        if (!cre() && G.inv.count(st.item) < 1) st.item = null; side(); return; }
    }
  }
  // après un clic ou à la fin d'un glissé : pièces renumérotées si les murs ont bougé, puis le château se redessine
  function after(drag, end) {
    if (drag.deco) { drag.deco = false; later(); side(); }
    if (!end || !drag.walls) return; drag.walls = false; const m = st.m; let pd = CI().planData(m); const keep = st.sel ? pd.R.indexOf(st.sel) : -1;
    fixOpens(pd); CI().renumber(m); pd = CI().planData(m); st.sel = keep >= 0 && pd.T[keep] === FLOOR ? pd.R[keep] : 0;
    clearTimeout(rbT); CI().rebuild(m); side();
  }
  // accrocher les lustres d'une pièce : offerts en Créatif ; en Survie, ceux de ton sac (les anciens y retournent)
  function hang(m, rm) {
    const pd = CI().planData(m), here = t => { let n = 0; for (const o of m.list) if (O[o.t].ceil && pd.R[o.z * pd.W + o.x] === rm.id && (!t || o.t === t)) n++; return n; }, count = () => here();
    // en Survie, sans ce lustre dans le sac (ni déjà dans la pièce), on ne touche à rien
    if (!cre() && st.lus && !G.inv.count(st.lus) && !here(st.lus)) { G.sfx('error'); return U.toast('Il te faut un « ' + nm(st.lus) + ' » dans ton sac (il se vend en boutique).'); }
    rm.lus = st.lus;
    if (cre()) CI().lustres(m, rm.id, true);
    else { const pool = {}; CI().lustres(m, rm.id, true, t => { pool[t] = (pool[t] || 0) + 1; }, t => { if (pool[t] > 0) { pool[t]--; return true; } return G.inv.remove(t, 1); }); for (const t in pool) for (let k = 0; k < pool[t]; k++) giveBack(t); }
    const n = count(); G.sfx(n || !st.lus ? 'place' : 'error');
    U.toast(!st.lus ? rm.n + ' : sans lustre' : n ? rm.n + ' : ' + (n > 1 ? n + ' × ' : '') + nm(st.lus) : 'Il te faut ce lustre dans ton sac (il se vend en boutique).');
    st.sel = rm.id; side();
  }
  // revenir au plan d'origine (celui qui suit l'extérieur), en gardant les meubles
  function resetPlan() {
    const m = st.m; U.closePanel();
    U.dialog('Plan du château', ['Revenir au plan d\'origine, celui qui suit l\'extérieur du château ?', 'Les cloisons, les arches et le décor des pièces redeviennent ceux du début. Tes meubles sont gardés, reposés au plus près.'], { choices: ['Oui, revenir', 'Non'] }).then(k => {
      if (G.map !== m) return;
      if (k === 0) { const sg = String(m.meta.plan.sig || '0|1|1').split('|'), info = { cols: +sg[1] || 1, rows: +sg[2] || 1 };
        const objs = [...m.list].filter(o => o.t !== 'paillasson').map(o => { const ex = {}; for (const q of KEEP) if (o[q] != null) ex[q] = o[q]; return [o.t, o.x, o.z, o.r || 0, ex]; });
        for (const o of [...m.list]) m.removeObj(o); m.meta.plan = CI().genPlan(info); m._pd = null; const pl = m.meta.plan;
        if (pl.door) m.addObj('paillasson', pl.door.x0 + 1, pl.door.z - 1);
        for (const [t, x, z, r, ex] of objs) if (!CI().relocate(m, t, x, z, r, ex)) giveBack(t);
        if (cre()) CI().lustres(m); CI().rebuild(m); if (pl.door && G.player) G.player.teleport(pl.door.sx, pl.door.sz, PI); st = null; G.sfx('craft'); }
      openPlan(); });
  }

  // ---------- les réglages, à droite du plan ----------
  function catalogue() {
    if (catC) return catC; catC = {}; for (const [k] of FAM) catC[k] = [];
    for (const id in G.ITEMS) { const it = G.ITEMS[id], d = it && O[it.obj]; if (!d || it.kind !== 'place' || d.enter || d.ceil || d.onWater || d.up || d.fixed || d.shop || Math.max(...d.fp) > 3) continue;
      if (!['mobilier', 'assises', 'fleurs', 'construction'].includes(it.cat) || NOT.test(id)) continue; if ((it.cat === 'fleurs' && !/^pl_\d/.test(id)) || (it.cat === 'construction' && id !== 'tapis')) continue;
      for (const [k, , re] of FAM) if (re.test(id)) { catC[k].push(id); break; } }
    return catC;
  }
  function side() {
    const el = $('pl-side'); if (!el || !st) return; const m = st.m, pd = CI().planData(m), pl = pd.pl, K = CP(), dis = ro() ? ' disabled' : '';
    const chip = (k, v, on, inner, title, sq) => `<button class="pl-chip${sq ? ' sq' : ''}${on ? ' on' : ''}" data-k="${k}" data-v="${esc(v)}" title="${esc(title || '')}"${dis}>${inner}</button>`;
    const swc = bg => `<span class="pl-sw" style="background:${bg};background-size:cover"></span>`, row = s => `<div class="pl-row">${s}</div>`;
    let h = '';
    if (st.tool === 'piece') { const rm = pl.rooms.find(q => q.id === st.sel);
      if (!rm) h = `<h4>🏛️ ${pl.rooms.length} pièces · ${pl.wins.length} fenêtres · ${Math.round(floorArea() * 1.64).toLocaleString('fr-FR')} m²</h4><p style="margin:-4px 0 6px;opacity:.8">Les pièces ont la surface du château de pierre (sans les jardins) : plus le château est grand, plus il a de pièces.</p><p>Clique une pièce sur le plan (ou ici) pour la décorer : son nom, ses murs, son sol, ses rideaux, ses appliques.</p>` + row(pl.rooms.map(r => chip('sel', r.id, false, (KICO[r.k] || '⚜') + ' ' + esc(r.n), r.n)).join(''));
      else { h = `<h4>${KICO[rm.k] || '⚜'} Pièce</h4><input class="pl-in" id="pl-name" maxlength="32" value="${esc(rm.n)}"${dis}>`;
        h += '<h4>Murs : peinture et moulures</h4>' + row(Object.entries(K.PAINTS).map(([id, [cc, n]]) => chip('wall', id, rm.wall === id, swc(col(cc)), n, 1)).join(''));
        const des = (G.designs || []).map((d, k) => d && d.img ? ['design:' + k, '✏️ ' + (d.name || 'Motif ' + (k + 1))] : null).filter(Boolean);
        h += '<h4>Murs : papiers peints</h4>' + row(G.WALLS.filter(w => !K.PAINTS[w[0]]).map(w => [w[0], w[1]]).concat(des).map(([id, n]) => chip('wall', id, rm.wall === id, swc(`url(${purl('wall', id)})`), n, 1)).join(''));
        h += '<h4>Sol</h4>' + row(G.FLOORS.map(f => [f[0], f[1]]).concat(des).map(([id, n]) => chip('floor', id, rm.floor === id, swc(`url(${purl('floor', id)})`), n, 1)).join(''));
        h += '<h4>Rideaux des fenêtres</h4>' + row(Object.entries(K.CURT).map(([id, [cc, n]]) => chip('rcurt', id, rm.curt === id, swc(cc ? col(cc) : 'repeating-linear-gradient(45deg,#fff 0 4px,#ddd 4px 8px)'), n, 1)).join(''));
        h += `<label style="display:flex;gap:8px;align-items:center;margin:0 0 12px;font-weight:700"><input type="checkbox" id="pl-app"${rm.app ? ' checked' : ''}${dis}> Appliques dorées aux murs</label>`;
        h += `<p>💡 ${rm.lus ? esc(nm(rm.lus)) : 'Sans lustre'} · <a href="#" id="pl-golus" style="color:var(--bark);font-weight:800">changer</a></p>`;
        if (!ro()) h += row((cre() ? '<button class="btn" id="pl-fill" style="font-size:14px;padding:7px 12px">🪑 Meubler la pièce</button>' : '') + '<button class="btn alt" id="pl-clear" style="font-size:14px;padding:7px 12px">🧹 Ranger les meubles</button>')
          + (cre() ? '' : '<p style="font-size:13px">En Survie, la pièce se meuble avec tes meubles (onglet 🪑 Meubles) ; ceux qu\'on range vont au rangement.</p>');
        h += '<p style="margin-top:4px">' + pl.rooms.filter(r => r.id !== rm.id).map(r => `<a href="#" data-sel="${r.id}" style="color:var(--bark);margin-right:10px;white-space:nowrap">${KICO[r.k] || '⚜'} ${esc(r.n)}</a>`).join(' ') + '</p>'; } }
    else if (st.tool === 'mur') h = '<h4>🧱 Murs et cloisons</h4><p>Glisse sur le parquet pour monter une cloison : une grande pièce devient deux pièces, et chacune garde son décor.</p><p>Glisse sur une cloison pour l\'abattre : deux pièces n\'en font plus qu\'une.</p><p style="font-size:13px">🟩 monter · 🟥 abattre. Les murs de façade ne bougent pas : leurs fenêtres sont celles de l\'extérieur du château.</p>';
    else if (st.tool === 'arche') h = '<h4>⛩️ Entre deux pièces</h4>' + row([['a', '◠', K.OPS.a], ['p', '🚪', K.OPS.p], ['o', '▭', K.OPS.o], ['mur', '▮', 'Mur plein']].map(([id, ic, n]) => chip('op', id, st.opType === id, `<b style="font-size:16px">${ic}</b> ${n}`, n)).join(''))
      + '<p>Glisse sur une cloison pour l\'ouvrir : plus tu glisses, plus l\'arche est large. Clique une arche pour lui donner ce style.</p><p style="font-size:13px">Les grandes arches ouvertes font l\'enfilade des pièces, comme à Versailles.</p>';
    else if (st.tool === 'fen') h = '<h4>🪟 Style des fenêtres</h4>' + row(Object.entries(K.WSTY).map(([id, n]) => chip('wst', id, st.winSt === id, wico(id) + n, n)).join('')) + '<p>Clique une fenêtre (sur la façade, ou juste devant), ou clique dans une pièce pour changer toutes ses fenêtres.</p>';
    else if (st.tool === 'rideau') h = '<h4>🎀 Rideaux</h4>' + row(Object.entries(K.CURT).map(([id, [cc, n]]) => chip('curt', id, st.curt === id, swc(cc ? col(cc) : 'repeating-linear-gradient(45deg,#fff 0 4px,#ddd 4px 8px)') + n, n)).join('')) + '<p>Clique une fenêtre pour elle seule, ou dans une pièce pour toutes ses fenêtres.</p>';
    else if (st.tool === 'lustre') { const ids = [...new Set(K.LUS.concat(Object.keys(G.ITEMS).filter(id => G.ITEMS[id].cat === 'lustres')))].filter(id => O[id]);
      h = '<h4>💡 Lustres</h4>' + row(ids.map(id => chip('lus', id, st.lus === id, (U.icon(id) || '') + esc(nm(id)) + (cre() ? '' : ` <span style="opacity:.7">×${G.inv.count(id)}</span>`), nm(id))).join('') + chip('lus', '', st.lus === '', '✖ Sans lustre', 'Sans lustre'))
        + '<p>Clique dans une pièce : ses lustres sont remplacés, en ligne au plafond (un tous les sept ou huit pas).</p>' + (cre() ? '' : '<p style="font-size:13px">En Survie, ce sont ceux de ton sac ; les anciens y retournent.</p>'); }
    else if (st.tool === 'meuble') { const C = cre(), q = st.q.trim().toLowerCase();
      let ids; if (C) { const cat = catalogue(); ids = q ? [].concat(...Object.values(cat)) : cat[st.fam] || []; }
      else ids = [...new Set(G.inv.slots.filter(s => s && G.ITEMS[s.id] && G.ITEMS[s.id].kind === 'place' && O[G.ITEMS[s.id].obj] && !O[G.ITEMS[s.id].obj].enter && !O[G.ITEMS[s.id].obj].ceil).map(s => s.id))];
      if (q) ids = ids.filter(id => nm(id).toLowerCase().includes(q));
      h = '<h4>🪑 Meubles</h4>' + `<div class="pl-row" style="align-items:center"><button class="btn alt" id="pl-rot" style="font-size:14px;padding:6px 12px">↻ Tourner (R)</button><span style="font-weight:700">${st.item ? esc(nm(st.item)) + ' · ' : ''}${['face au sud', 'face à l\'est', 'face au nord', 'face à l\'ouest'][st.rot]}</span></div>`
        + `<input class="pl-in" id="pl-q" placeholder="Rechercher un meuble…" value="${esc(st.q)}">`
        + (C && !q ? row(FAM.filter(([k]) => catalogue()[k].length).map(([k, n]) => chip('fam', k, st.fam === k, n, n)).join('')) : '')
        + (ids.length ? `<div class="grid">${ids.map(id => `<button class="it${st.item === id ? ' sel' : ''}" data-it="${id}" title="${esc(nm(id))}">${U.icon(id)}<span class="lbl">${esc(nm(id))}</span>${C ? '' : `<span class="n">×${G.inv.count(id)}</span>`}</button>`).join('')}</div>`
          : `<p>${C ? 'Aucun meuble ne porte ce nom.' : 'Ton sac ne contient aucun meuble : il y en a plein en boutique !'}</p>`); }
    el.innerHTML = h; wire(el);
  }
  function wire(el) {
    const m = st.m, pd = CI().planData(m), pl = pd.pl, room = () => pl.rooms.find(q => q.id === st.sel);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { G.sfx('ui'); const k = b.dataset.k, v = b.dataset.v, rm = room();
      if (k === 'sel') st.sel = +v; else if (k === 'op') st.opType = v; else if (k === 'wst') st.winSt = v; else if (k === 'curt') st.curt = v; else if (k === 'lus') st.lus = v; else if (k === 'fam') st.fam = v;
      else if (rm && !ro()) { if (k === 'wall') rm.wall = v; else if (k === 'floor') rm.floor = v; else if (k === 'rcurt') { rm.curt = v; for (const q of pl.wins) if (q.r === rm.id) q.c = ''; } later(); }
      side(); draw(); });
    el.querySelectorAll('[data-sel]').forEach(a => a.onclick = e => { e.preventDefault(); G.sfx('ui'); st.sel = +a.dataset.sel; side(); draw(); });
    el.querySelectorAll('[data-it]').forEach(b => b.onclick = () => { G.sfx('ui'); st.item = b.dataset.it; st.carry = null; side(); draw(); });
    const n = $('pl-name'); if (n) n.oninput = () => { const rm = room(); if (rm && !ro() && n.value.trim()) { rm.n = n.value.trim().slice(0, 32); draw(); } };
    const ap = $('pl-app'); if (ap) ap.onchange = () => { const rm = room(); if (rm && !ro()) { rm.app = ap.checked ? 1 : 0; later(); } };
    const gl = $('pl-golus'); if (gl) gl.onclick = e => { e.preventDefault(); const rm = room(); if (rm && rm.lus) st.lus = rm.lus; st.tool = 'lustre'; G.sfx('ui'); render(); };
    const fi = $('pl-fill'); if (fi) fi.onclick = () => { const n0 = m.list.size; CI().furnish(m, st.sel); const k = m.list.size - n0; G.sfx(k ? 'craft' : 'error'); U.toast(k ? k + ' meuble' + (k > 1 ? 's' : '') + ' en place !' : 'Il y a déjà des meubles : range-les d\'abord.'); draw(); };
    const cl = $('pl-clear'); if (cl) cl.onclick = () => { const k = CI().clearRoom(m, st.sel); G.sfx(k ? 'pickup' : 'error'); U.toast(k ? k + ' meuble' + (k > 1 ? 's' : '') + (cre() ? ' enlevé' + (k > 1 ? 's' : '') : ' mis au rangement') : 'La pièce est déjà vide.'); draw(); };
    const rt = $('pl-rot'); if (rt) rt.onclick = rotate;
    const q = $('pl-q'); if (q) q.oninput = () => { st.q = q.value; const pos = q.selectionStart; side(); const q2 = $('pl-q'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) { } } };
  }

  // ---------- clavier ----------
  addEventListener('keydown', e => { if (!st || !isOpen()) return; const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; const k = (e.key || '').toLowerCase();
    if (k === 'r' && st.tool === 'meuble') { rotate(); e.preventDefault(); } if (k === 'h' && !e.repeat) hDown = true; });
  addEventListener('keyup', e => { if ((e.key || '').toLowerCase() !== 'h') return; if (hDown && isOpen()) { U.closePanel(); if (G.input && G.input.chars) G.input.chars.h = false; } hDown = false; }); // (sans rouvrir le plan aussitôt)
  G.on('frame', () => { const on = isOpen(); if (on === wasOpen) return; wasOpen = on; $('panel').classList.toggle('plan-open', on); });
  G.on('enterMap', m => { if (st && st.m !== m) st = null; });
  G.openChateauPlan = openPlan;
})();
