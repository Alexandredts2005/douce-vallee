'use strict';
// ===== Fluidité PC : on ne dessine que ce que la caméra voit (et les ombres qui y tombent), habitants lointains masqués,
// détection de la carte graphique (conseil si le navigateur utilise la puce intégrée), limite d'images par seconde =====
(function () {
  const CELL = G.CELL || 8, T = G.TIER;
  const FR = new THREE.Frustum(), PM = new THREE.Matrix4(), BX = new THREE.Box3(), SD = new THREE.Vector3();
  const C = G.cull = { on: true, vis: 0, total: 0, ms: 0 };
  // hauteurs min/max par case (terrain, plus la place des objets hauts)
  function cellY(m) {
    if (m._cy && m._cyRev === (m.tRev || 0)) return m._cy;
    const cw = Math.ceil(m.W / CELL), ch = Math.ceil(m.H / CELL), Y = new Float32Array(cw * ch * 2);
    for (let cz = 0; cz < ch; cz++) for (let cx = 0; cx < cw; cx++) { let lo = 99, hi = -99;
      for (let z = cz * CELL; z < Math.min(m.H, cz * CELL + CELL); z++) for (let x = cx * CELL; x < Math.min(m.W, cx * CELL + CELL); x++) { const l = m.lvl[z * m.W + x]; if (l < lo) lo = l; if (l > hi) hi = l; }
      const k = (cz * cw + cx) * 2; Y[k] = lo * T - 2; Y[k + 1] = hi * T + 9.5; }
    m._cy = Y; m._cyRev = m.tRev || 0; m._cw = cw; m._ch = ch; return Y;
  }
  // une case est visible si sa boîte (descendue par l'arrondi du monde, élargie vers l'ombre portée) touche le champ de la caméra
  function computeV(m) {
    const cam = G.camera; cam.updateMatrixWorld(); PM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); FR.setFromProjectionMatrix(PM);
    const Y = cellY(m), cw = m._cw, ch = m._ch, n = cw * ch, V = m.cullV && m.cullV.length === n ? m.cullV : (m.cullV = new Uint8Array(n));
    const cu = G.U.curve.value, cc = G.U.cc.value, cf = G.U.cf.value, cp = cam.position, sun = G.lights && G.lights.sun;
    let ox = 0, oz = 0; if (sun && sun.castShadow && sun.intensity > .05) { SD.copy(sun.position).sub(sun.target.position).normalize(); const h = Math.hypot(SD.x, SD.z) || 1, L = Math.min(24, 9 * h / Math.max(.15, SD.y)); ox = -SD.x / h * L; oz = -SD.z / h * L; }
    const drop = (x, z) => { const dx = x - cc.x, dz = z - cc.z, d = dx * cf.x + dz * cf.y, l = dx * cf.y - dz * cf.x; return cu * (d * d + .3 * l * l); };
    let changed = false, vis = 0;
    for (let cz = 0; cz < ch; cz++) for (let cx = 0; cx < cw; cx++) {
      const k = cz * cw + cx, x0 = cx * CELL - 3, x1 = cx * CELL + CELL + 3, z0 = cz * CELL - 3, z1 = cz * CELL + CELL + 3; let y0 = Y[k * 2], y1 = Y[k * 2 + 1];
      if (cu) { const dmax = Math.max(drop(x0, z0), drop(x1, z0), drop(x0, z1), drop(x1, z1)), dmin = Math.max(0, drop(Math.min(x1, Math.max(x0, cc.x)), Math.min(z1, Math.max(z0, cc.z))) - .5); y0 -= dmax; y1 -= dmin; }
      BX.min.set(x0 + Math.min(0, ox), y0, z0 + Math.min(0, oz)); BX.max.set(x1 + Math.max(0, ox), y1, z1 + Math.max(0, oz));
      let v = FR.intersectsBox(BX);
      if (v && !cu) { const dx = Math.max(x0 - cp.x, 0, cp.x - x1), dz = Math.max(z0 - cp.z, 0, cp.z - z1); if (dx * dx + dz * dz > 130 * 130) v = false; }
      const b = v ? 1 : 0; if (V[k] !== b) { V[k] = b; changed = true; } vis += b;
    }
    if (changed || m.cullVer == null) m.cullVer = (m.cullVer || 0) + 1; C.vis = vis; C.total = n; return V;
  }
  function applyChunks(m, V) { const cw = m._cw, ch = m._ch, R = 24 / CELL;
    for (let kz = 0; kz < m.chh; kz++) for (let kx = 0; kx < m.cw; kx++) { const g = m.chunks[kz * m.cw + kx]; if (!g) continue; let v = false;
      for (let cz = kz * R; cz < Math.min(ch, kz * R + R) && !v; cz++) for (let cx = kx * R; cx < Math.min(cw, kx * R + R); cx++) if (V[cz * cw + cx]) { v = true; break; }
      g.visible = v; } }
  function showAll(m) { if (m.cullV) { m.cullV = null; m.cullVer = (m.cullVer || 0) + 1; } for (const g of m.chunks) if (g) g.visible = true; m.objr.cull(null, m.cullVer || 0); }
  G.on('frame', () => {
    const m = G.map; if (!m || !G.camera) return; const t0 = performance.now();
    if (!C.on || m.interior || G.state === 'editor') { showAll(m); return; }
    const V = computeV(m); m.objr.cull(V, m.cullVer); applyChunks(m, V);
    // habitants hors champ : ni dessinés, ni ombrés
    const cw = m._cw; for (const v of G.ents.villagers) { if (v.map !== m || !v.root.visible) continue; const cx = Math.floor(v.x / CELL), cz = Math.floor(v.z / CELL); if (cx >= 0 && cz >= 0 && cx < cw && cz < m._ch && !V[cz * cw + cx]) { v.root.visible = false; if (v.blob) v.blob.visible = false; } }
    C.ms = C.ms * .9 + (performance.now() - t0) * .1;
  });
  // ---------- carte graphique ----------
  function gpuInfo() {
    let raw = ''; try { const gl = G.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); raw = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (x) { }
    const mm = raw.match(/ANGLE \(([^,]+),\s*(.+?)\s*(\(0x|Direct3D|OpenGL|Vulkan|Metal|,|\)$)/), name = (mm ? mm[2] : raw).trim() || 'inconnue';
    let tier = 'mid', kind = 'inconnue';
    if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(raw)) { tier = 'low'; kind = 'logiciel'; }
    else if (/nvidia|geforce|rtx|gtx|quadro|radeon\s*(rx|pro|r9|vii)|\brx\s*\d{3,4}|arc\s*a\d|apple m\d\s*(pro|max|ultra)/i.test(raw)) { tier = 'high'; kind = 'dédiée'; }
    else if (/intel|uhd|iris|radeon\(tm\)|radeon graphics|vega\s*\d|adreno|mali|powervr|apple/i.test(raw)) { tier = 'mid'; kind = 'intégrée'; }
    return { raw, name, tier, kind };
  }
  G.on('init', () => {
    const gi = G.gpu = gpuInfo(), s = G.settings;
    // premier lancement (ou première fois avec cette version) : qualité choisie selon la carte graphique
    if (!s.gpuChecked) { s.gpuChecked = 1; if (gi.tier === 'high' && s.quality !== 'low') s.quality = 'high'; if (gi.tier === 'low') { s.quality = 'low'; s.shadow = false; } G.ui.saveSettings && G.ui.saveSettings(); G.ui.applySettings && G.ui.applySettings(); }
    // conseils affichés une seule fois
    if (gi.kind === 'intégrée' && !G.store.get('dv_tip_gpu')) setTimeout(() => { G.store.set('dv_tip_gpu', 1); G.ui.toast('⚡ Ton navigateur utilise la puce graphique intégrée. Si ton PC a une carte NVIDIA ou AMD, regarde « Fluidité » dans les Options.', 9000); }, 2500);
    if (gi.kind === 'logiciel' && !G.store.get('dv_tip_soft')) setTimeout(() => { G.store.set('dv_tip_soft', 1); G.ui.toast('⚠️ L\'accélération graphique de ton navigateur est désactivée : le jeu sera lent. Active-la dans ses paramètres.', 9000); }, 2500);
    buildOptions(gi);
  });
  // ---------- limite d'images par seconde (économise la batterie, image plus régulière) ----------
  let gateLast = 0;
  G.frameGate = now => { const cap = +(G.settings.fpsCap || 0); if (!cap) return true; const iv = 1000 / cap; if (now - gateLast < iv - 1.5) return false; gateLast = now - gateLast > iv * 2 ? now : gateLast + iv; return true; };
  // ---------- options « Fluidité » ----------
  function buildOptions(gi) {
    const scr = G.el('screen-options'), form = scr && scr.querySelector('.form'), back = G.el('o-back'); if (!form || G.el('o-fps')) return;
    const row = back.parentNode, mk = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
    const tip = gi.kind === 'intégrée' ? '<br>💡 Ton navigateur utilise la puce <b>intégrée</b>. Si ton PC a une carte NVIDIA/AMD : <b>Paramètres Windows › Système › Écran › Graphiques</b>, choisis ton navigateur, puis <b>Hautes performances</b>, et relance-le.'
      : gi.kind === 'logiciel' ? '<br>⚠️ Accélération graphique désactivée : active « Utiliser l\'accélération graphique » dans les paramètres du navigateur.' : gi.kind === 'dédiée' ? ' ✅' : '';
    const sec = mk(`<div id="o-perf" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:6px 0 0;font-family:var(--f-display);color:var(--bark)">⚡ Fluidité</h3>
      <div class="opt">Images par seconde max<select id="o-fps"><option value="0">Illimité (écran)</option><option value="144">144</option><option value="120">120</option><option value="60">60</option><option value="30">30 (économie)</option></select></div>
      <div class="opt">Résolution automatique (baisse un peu si ça rame)<input type="checkbox" id="o-autores"></div>
      <div class="opt">Herbe en 3D<input type="checkbox" id="o-grass"></div>
      <div class="opt">Afficher les images par seconde<input type="checkbox" id="o-showfps"></div>
      <div style="font-size:13px;font-weight:700;color:var(--bark);line-height:1.35">Carte graphique : ${String(gi.name).replace(/[<>&]/g, '')}${tip}</div></div>`);
    form.insertBefore(sec, row);
    const s = G.settings, $ = G.el;
    $('o-fps').value = String(s.fpsCap || 0); $('o-autores').checked = s.autoRes !== false; $('o-grass').checked = s.grass !== false; $('o-showfps').checked = !!s.showFps;
    $('o-fps').onchange = () => { s.fpsCap = +$('o-fps').value; G.ui.saveSettings(); };
    $('o-autores').onchange = () => { s.autoRes = $('o-autores').checked; if (!s.autoRes && G.perf) { G.perf.scale = 1; G.perf.apply(); } G.ui.saveSettings(); };
    $('o-grass').onchange = () => { s.grass = $('o-grass').checked; G.ui.saveSettings(); };
    $('o-showfps').onchange = () => { s.showFps = $('o-showfps').checked; const el = $('fps'); if (el && !s.showFps) el.remove(); G.ui.saveSettings(); };
  }
})();
