// Outils de test (non publiés) : captures d'écran et banc d'essai des modèles
window.__shot = async (name) => { G.renderer.render(G.scene, G.camera); const c = G.renderer.domElement; const url = c.toDataURL('image/jpeg', .85); const r = await fetch('/shot?' + name, { method: 'POST', body: url }); return r.status; };
window.__viewer = async (model, v, name, opts = {}) => {
  const R = G.renderer, sc = new THREE.Scene(); sc.background = new THREE.Color(opts.night ? 0x1b2152 : 0xa6dbff);
  sc.add(new THREE.HemisphereLight(0xd8ecff, 0x8f9a6a, opts.night ? .3 : .7)); const d = new THREE.DirectionalLight(0xfff8ec, opts.night ? .25 : .95); d.position.set(-4, 7, 6); d.castShadow = true; const S = opts.span || 6; d.shadow.camera.left = d.shadow.camera.bottom = -S; d.shadow.camera.right = d.shadow.camera.top = S; d.shadow.mapSize.set(2048, 2048); d.shadow.bias = -.0006; sc.add(d); sc.add(new THREE.AmbientLight(0xffffff, .12));
  const gg = new THREE.PlaneGeometry(40, 40); const cols = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < cols.length; i += 3) { cols[i] = .45; cols[i + 1] = .75; cols[i + 2] = .38; } gg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const g = new THREE.Mesh(gg, G.M.std); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; sc.add(g);
  const m = new THREE.Mesh(G.getGeo(model, v), G.MATS); m.castShadow = m.receiveShadow = true; sc.add(m);
  const cam = new THREE.PerspectiveCamera(opts.fov || 35, R.domElement.width / R.domElement.height, .1, 200);
  const dist = opts.dist || 7.5, yaw = opts.yaw != null ? opts.yaw : .45, pitch = opts.pitch != null ? opts.pitch : .32, ty = opts.ty || 1.6;
  cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, ty, 0);
  const cu = G.U.curve.value; G.U.curve.value = 0; const gc = G.M.glow.color.clone(); if (opts.night) G.M.glow.color.setRGB(1.08, .98, .78);
  if (opts.lamp) { const pl = new THREE.PointLight(0xffc27a, 1.5, 8, 1.3); pl.position.set(0, 2, 2.5); sc.add(pl); }
  R.shadowMap.needsUpdate = true; R.render(sc, cam); const url = R.domElement.toDataURL('image/jpeg', .88); G.U.curve.value = cu; G.M.glow.color.copy(gc);
  await fetch('/shot?' + name, { method: 'POST', body: url }); return 'ok';
};
window.__gpu = async (n = 20) => { const R = G.renderer, gl = R.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); if (!ext) return -1; const qs = []; for (let i = 0; i < n; i++) { const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); R.shadowMap.needsUpdate = true; R.render(G.scene, G.camera); gl.endQuery(ext.TIME_ELAPSED_EXT); qs.push(q); }
  await new Promise(r => setTimeout(r, 120)); const ts = []; for (const q of qs) { let tries = 0; while (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && tries++ < 50) await new Promise(r => setTimeout(r, 10)); ts.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(q); } ts.sort((a, b) => a - b); return +ts[ts.length >> 1].toFixed(3); };
window.__cpu = (n = 30) => { const R = G.renderer, a = []; for (let i = 0; i < n; i++) { const t0 = performance.now(); R.shadowMap.needsUpdate = true; R.render(G.scene, G.camera); a.push(performance.now() - t0); } a.sort((x, y) => x - y); return { ms: +a[a.length >> 1].toFixed(2), calls: R.info.render.calls, tris: Math.round(R.info.render.triangles) }; };
window.__newGame = async () => { G.startNew({ mode: 'creatif', name: 'Perfo', village: 'Banc', map: 'default', seed: 1234, look: G.defaultLook() }); await new Promise(r => setTimeout(r, 2500)); return G.state; };
'tests ok';
