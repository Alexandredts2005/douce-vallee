'use strict';
// ===== Fluidité : résolution adaptative, ombres une image sur deux, terrain hors champ non dessiné, compteur d'images =====
(function () {
  const P = G.perf = { ema: 16.7, scale: 1, last: 0, t: 0, frames: 0, fps: 60, fpsT: 0, fpsN: 0 };
  const V2 = new THREE.Vector2();
  const cap = () => { const dpr = window.devicePixelRatio || 1, q = G.settings.quality; return q === 'low' ? Math.min(dpr, 1) * .8 : q === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1.35); };
  P.apply = () => { const R = G.renderer, c = G.camera; if (!R || !c) return; const pr = Math.max(.5, cap() * P.scale); if (Math.abs(R.getPixelRatio() - pr) < .01) return;
    R.setPixelRatio(pr); R.setSize(innerWidth, innerHeight); G.U.pscale.value = R.getDrawingBufferSize(V2).y / (2 * Math.tan(c.fov * Math.PI / 360)); };
  G.on('init', () => {
    const R = G.renderer; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true;
    const os = G.setQuality; G.setQuality = (q, sh) => { os(q, sh); P.scale = 1; P.apply(); R.shadowMap.needsUpdate = true; };
    addEventListener('resize', () => setTimeout(P.apply, 50));
  });
  const lastCam = new THREE.Vector3();
  G.on('frame', dt => {
    const R = G.renderer, now = performance.now(); if (!R) return; P.frames++;
    // ombres : recalculées une image sur deux (et à chaque image quand la caméra bouge vite)
    const cp = G.camera.position, moved = cp.distanceToSquared(lastCam) > .09; lastCam.copy(cp);
    if (moved || P.frames % 2 === 0) R.shadowMap.needsUpdate = true;
    // terrain : en vue 3D (monde plat) on ne dessine pas les morceaux hors champ
    if (P.frames % 20 === 0) { const flat = G.U.curve.value === 0, m = G.map; if (m && m.terrain) for (const g of m.chunks) if (g) for (const me of g.children) me.frustumCulled = flat; }
    // résolution adaptative : on baisse un peu la netteté seulement si ça rame, et on remonte dès que possible
    if (P.last) { const d = Math.min(120, now - P.last); P.ema += (d - P.ema) * .06; P.fpsN++; P.fpsT += d; if (P.fpsT > 1000) { P.fps = Math.round(P.fpsN * 1000 / P.fpsT); P.fpsN = 0; P.fpsT = 0; } }
    P.last = now; P.t += dt;
    if (G.settings.autoRes !== false && P.t > 1.2 && document.visibilityState === 'visible' && G.state === 'play') { P.t = 0;
      if (P.ema > 22 && P.scale > .6) { P.scale = Math.max(.6, P.scale - .1); P.apply(); }
      else if (P.ema < 17.5 && P.scale < 1) { P.scale = Math.min(1, P.scale + .05); P.apply(); } }
    if (G.settings.showFps) { let el = G.el('fps'); if (!el) { el = document.createElement('div'); el.id = 'fps'; el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:40;font:600 12px Nunito,sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:3px 8px;border-radius:8px;pointer-events:none'; document.body.appendChild(el); }
      if (P.frames % 15 === 0) el.textContent = P.fps + ' i/s · ' + Math.round(R.getPixelRatio() * 100) + '% · ' + R.info.render.calls + ' appels'; }
  });
})();
