'use strict';
// ===== Interface (4) : garde-robe / création du personnage avec aperçu 3D, atelier de motifs (pixel art + import) =====
(function () {
  const U = G.ui, $ = G.el, L = G.LOOKS, hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);
  G.designs = new Array(8).fill(null);
  G.addDesign = d => { let k = G.designs.findIndex(x => !x); if (k < 0) k = 7; G.designs[k] = d; return k; };
  // ---------- aperçu 3D ----------
  let pv = null;
  function preview(look) {
    if (!pv) { const c = document.createElement('canvas'); c.width = 280; c.height = 340; c.style.cssText = 'width:100%;max-width:280px;height:auto;aspect-ratio:28/34;border-radius:22px;background:linear-gradient(#bfe7f7,#e8f6d8);display:block;cursor:grab';
      const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(280, 340, false);
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff5e6, 0xc8b89a, 1.0)); const d = new THREE.DirectionalLight(0xffeedd, 1.4); d.position.set(2, 4, 3); sc.add(d);
      const cam = new THREE.PerspectiveCamera(30, 280 / 340, .1, 50); cam.position.set(0, .82, 3.1); cam.lookAt(0, .55, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .04, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.05 })); disc.position.y = -.02; sc.add(disc);
      pv = { c, r, sc, cam, rot: .4, root: null, drag: null };
      c.addEventListener('pointerdown', e => { pv.drag = e.clientX; c.setPointerCapture(e.pointerId); }); c.addEventListener('pointermove', e => { if (pv.drag != null) { pv.rot += (e.clientX - pv.drag) * .015; pv.drag = e.clientX; } }); c.addEventListener('pointerup', () => pv.drag = null);
    }
    if (pv.root) pv.sc.remove(pv.root); const C = G.makeChar({ look }); pv.root = C.root; pv.C = C; pv.sc.add(C.root); draw(); return pv.c;
  }
  function draw() {
    pv.root.rotation.y = pv.rot; const t = performance.now() / 1000; pv.C.armL.rotation.z = -.08 - Math.sin(t * 2) * .05; pv.C.armR.rotation.z = .08 + Math.sin(t * 2) * .05;
    pv.C.setExpr && pv.C.setExpr(t % 3.5 < .12 ? 'blink' : (t % 9 > 7.5 ? 'happy' : 'normal'));
    const cu = G.U.curve.value, ca = G.U.cloudAmt.value; G.U.curve.value = 0; G.U.cloudAmt.value = 0; pv.r.render(pv.sc, pv.cam); G.U.curve.value = cu; G.U.cloudAmt.value = ca;
  }
  function loop() {
    if (!pv || $('panel').hidden || U.panelKind !== 'wardrobe') return; requestAnimationFrame(loop);
    if (pv.drag == null) pv.rot += .008; draw();
  }
  // ---------- garde-robe ----------
  const SECTIONS = [['corps', '🧍 Corps'], ['visage', '😊 Visage'], ['cheveux', '💇 Cheveux'], ['haut', '👕 Haut'], ['bas', '👖 Bas & chaussures'], ['chapeau', '🎩 Chapeau'], ['acc', '👓 Accessoires']];
  U.openWardrobe = (o = {}) => {
    const look = Object.assign({}, G.normLook(o.look || (G.player && G.player.look))), SECS = o.sections ? SECTIONS.filter(s => o.sections.includes(s[0])) : SECTIONS; let sec = SECS[0][0];
    const TOPS = L.top.filter(t => t[0] !== 'maillot' || G.mode === 'creatif' || G.flags.maillot || G.state !== 'play');
    U.open('wardrobe', o.title || 'Garde-robe'); requestAnimationFrame(loop);
    const body = $('panel-body');
    const sw = (key, list, labelFn) => `<div class="swatches">${list.map(c => `<button class="sw${look[key] === c ? ' on' : ''}" data-k="${key}" data-c="${c}" style="background-color:${hex(c)}" aria-label="Couleur"></button>`).join('')}</div>`;
    const opts = (key, list) => `<div class="tabs" style="padding:0">${list.map(([id, n]) => `<button class="tab${look[key] === id ? ' on' : ''}" data-k="${key}" data-v="${id}">${n}</button>`).join('')}</div>`;
    const fld = (t, h) => `<div class="fld" style="gap:6px;margin-bottom:10px">${t}${h}</div>`;
    const render = () => {
      tabs(); const parts = {
        corps: fld('TU ES', opts('gender', [['f', '👧 Une fille'], ['g', '👦 Un garçon']])) + fld('TAILLE', opts('height', L.height)) + fld('TEINT', sw('skin', L.skin)),
        visage: fld('YEUX', opts('eyes', L.eyes)) + fld('TAILLE DES YEUX', opts('eyeSize', L.eyeSize)) + fld('COULEUR DES YEUX', sw('eyeCol', L.eyeCols)) + fld('CILS', opts('lashes', [[false, 'Discrets'], [true, 'Longs cils']])) + fld('SOURCILS', opts('brows', L.brows)) + fld('NEZ', opts('nose', L.nose)) + fld('BOUCHE', opts('mouth', L.mouth)) + fld('JOUES', opts('cheek', L.cheek)) + fld('TACHES DE ROUSSEUR', opts('freckles', [[false, 'Non'], [true, 'Oui']])),
        cheveux: fld('COIFFURE', opts('hair', L.hair)) + fld('COULEUR', sw('hairCol', L.hairCols)),
        haut: fld('STYLE', opts('top', TOPS)) + fld('COULEUR', sw('topCol', L.colors)) + fld('MOTIF PERSONNALISÉ', `<div class="tabs" style="padding:0"><button class="tab${look.design < 0 ? ' on' : ''}" data-k="design" data-v="-1">Aucun</button>${G.designs.map((d, k) => d && d.img ? `<button class="tab${look.design === k ? ' on' : ''}" data-k="design" data-v="${k}" style="display:flex;gap:6px;align-items:center"><img src="${d.img}" style="width:22px;height:22px;image-rendering:pixelated;border-radius:5px" alt="">${d.name || 'Motif ' + (k + 1)}</button>` : '').join('')}<button class="tab" id="wd-designs">✏️ Créer un motif…</button></div>`),
        bas: fld('STYLE', opts('bottom', L.bottom)) + fld('COULEUR', sw('botCol', L.colors)) + fld('CHAUSSURES', opts('shoe', L.shoe)) + fld('COULEUR DES CHAUSSURES', sw('shoes', L.colors)),
        chapeau: fld('CHAPEAU', opts('hat', L.hat)) + fld('COULEUR', sw('hatCol', L.colors)),
        acc: fld('ACCESSOIRE', opts('acc', L.acc)) + fld('COULEUR (écharpe, sac)', sw('accCol', L.colors))
      };
      body.innerHTML = `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div id="wd-prev" style="flex:0 0 auto;width:min(280px,100%)"></div><div style="flex:1;min-width:240px">${parts[sec]}</div></div>`;
      $('wd-prev').appendChild(preview(look));
      body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; let v = b.dataset.v !== undefined ? b.dataset.v : +b.dataset.c; if (v === 'true') v = true; else if (v === 'false') v = false; else if (k === 'design') v = +v; look[k] = v; G.sfx('ui'); render(); });
      const dz = $('wd-designs'); if (dz) dz.onclick = () => U.openDesigns({ back: () => U.openWardrobe(Object.assign({}, o, { look })) });
    };
    const tabs = () => { const t = $('panel-tabs'); t.innerHTML = ''; SECS.forEach(([id, n]) => { const b = document.createElement('button'); b.className = 'tab' + (id === sec ? ' on' : ''); b.textContent = n; b.onclick = () => { sec = id; G.sfx('ui'); render(); }; t.appendChild(b); }); };
    const f = $('panel-foot'); f.innerHTML = '<div class="desc">Glisse sur l\'aperçu pour faire tourner ton personnage.</div>';
    const b1 = document.createElement('button'); b1.className = 'btn alt'; b1.textContent = '🎲 Au hasard'; b1.onclick = () => { const p = a => a[Math.floor(Math.random() * a.length)]; Object.assign(look, { skin: p(L.skin), hair: p(L.hair)[0], hairCol: p(L.hairCols), eyes: p(L.eyes)[0], eyeCol: p(L.eyeCols), mouth: p(L.mouth)[0], top: p(L.top)[0], topCol: p(L.colors), bottom: p(L.bottom)[0], botCol: p(L.colors), shoes: p(L.colors), hat: p(L.hat)[0], hatCol: p(L.colors), acc: Math.random() < .7 ? 'aucun' : p(L.acc)[0], accCol: p(L.colors), blush: Math.random() < .8, freckles: Math.random() < .2, brows: p(L.brows)[0], nose: p(L.nose)[0], eyeSize: p(L.eyeSize)[0], cheek: p(L.cheek)[0], shoe: p(L.shoe)[0], lashes: Math.random() < .5 }); G.sfx('boing'); render(); }; f.appendChild(b1);
    const b2 = document.createElement('button'); b2.className = 'btn'; b2.textContent = o.okLabel || 'Mettre cette tenue'; b2.onclick = () => { G.sfx('craft'); if (o.onDone) o.onDone(look); else { G.player.setLook(look); U.toast('Nouvelle tenue ! ✨'); } U.closePanel(); }; f.appendChild(b2);
    render();
  };
  // ---------- atelier de motifs (32×32) ----------
  const PAL = ['#ffffff', '#2a2d33', '#e8434a', '#ff8fc0', '#ff9a3c', '#ffd23f', '#4fb35f', '#2f8a45', '#3fb3b0', '#5b8fd6', '#2f4f9a', '#8d6fd1', '#b07a48', '#6b4a32', '#f3e6c8', '#9a9a9a'];
  U.openDesigns = (o = {}) => {
    let slot = Math.max(0, G.designs.findIndex(d => !d)); if (slot < 0) slot = 0; let color = '#e8434a', tool = 'crayon', sym = false, dirty = false;
    const N = 32, cv = G.cv(N, N), cx = cv.getContext('2d'); const load = () => { cx.clearRect(0, 0, N, N); const d = G.designs[slot]; if (d && d.img) { const im = new Image(); im.onload = () => { cx.clearRect(0, 0, N, N); cx.imageSmoothingEnabled = false; cx.drawImage(im, 0, 0, N, N); draw(); }; im.src = d.img; } else { cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, N, N); } };
    U.open('designs', 'Atelier de motifs');
    const body = $('panel-body');
    body.innerHTML = `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
      <canvas id="ds-c" width="320" height="320" style="width:min(320px,100%);aspect-ratio:1;image-rendering:pixelated;border-radius:16px;box-shadow:0 3px 0 var(--paper-d);background:#fff;touch-action:none;cursor:crosshair"></canvas>
      <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:10px">
        <div class="fld">EMPLACEMENT<div class="tabs" style="padding:0" id="ds-slots"></div></div>
        <div class="fld">NOM<input type="text" id="ds-name" class="search" maxlength="16" style="width:100%"></div>
        <div class="fld">COULEUR<div class="swatches" id="ds-pal"></div><input type="color" id="ds-color" value="#e8434a" style="width:60px;height:34px;border:none;background:none"></div>
        <div class="fld">OUTIL<div class="tabs" style="padding:0" id="ds-tools"></div></div>
      </div></div>`;
    const big = $('ds-c'), bx = big.getContext('2d');
    const draw = () => { bx.imageSmoothingEnabled = false; bx.clearRect(0, 0, 320, 320); bx.drawImage(cv, 0, 0, 320, 320); bx.strokeStyle = 'rgba(0,0,0,.07)'; for (let i = 0; i <= N; i++) { bx.beginPath(); bx.moveTo(i * 10, 0); bx.lineTo(i * 10, 320); bx.stroke(); bx.beginPath(); bx.moveTo(0, i * 10); bx.lineTo(320, i * 10); bx.stroke(); } if (sym) { bx.strokeStyle = 'rgba(232,67,74,.5)'; bx.beginPath(); bx.moveTo(160, 0); bx.lineTo(160, 320); bx.stroke(); } };
    const px = (x, y) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (tool === 'gomme') { cx.fillStyle = '#ffffff'; cx.fillRect(x, y, 1, 1); } else { cx.fillStyle = color; cx.fillRect(x, y, 1, 1); } };
    const fill = (x, y) => { const id = cx.getImageData(0, 0, N, N), D = id.data, at = (i, j) => (j * N + i) * 4, t = at(x, y), tc = [D[t], D[t + 1], D[t + 2]], c = new THREE.Color(color), nc = [c.r * 255 | 0, c.g * 255 | 0, c.b * 255 | 0]; if (tc.every((v, i) => Math.abs(v - nc[i]) < 2)) return;
      const st = [[x, y]]; while (st.length) { const [i, j] = st.pop(); if (i < 0 || j < 0 || i >= N || j >= N) continue; const k = at(i, j); if (Math.abs(D[k] - tc[0]) > 8 || Math.abs(D[k + 1] - tc[1]) > 8 || Math.abs(D[k + 2] - tc[2]) > 8) continue; D[k] = nc[0]; D[k + 1] = nc[1]; D[k + 2] = nc[2]; D[k + 3] = 255; st.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); } cx.putImageData(id, 0, 0); };
    const at = e => { const r = big.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * N), Math.floor((e.clientY - r.top) / r.height * N)]; };
    let down = false; const paint = e => { const [x, y] = at(e); if (tool === 'pipette') { const d = cx.getImageData(x, y, 1, 1).data; color = '#' + new THREE.Color(d[0] / 255, d[1] / 255, d[2] / 255).getHexString(); $('ds-color').value = color; tool = 'crayon'; ui(); return; } if (tool === 'remplir') { fill(x, y); if (sym) fill(N - 1 - x, y); } else { px(x, y); if (sym) px(N - 1 - x, y); } dirty = true; draw(); };
    big.addEventListener('pointerdown', e => { down = true; big.setPointerCapture(e.pointerId); paint(e); }); big.addEventListener('pointermove', e => { if (down && (tool === 'crayon' || tool === 'gomme')) paint(e); }); big.addEventListener('pointerup', () => down = false);
    const save = () => { G.designs[slot] = { name: $('ds-name').value.trim() || 'Motif ' + (slot + 1), img: cv.toDataURL('image/png') }; dirty = false; if (G.designs[slot]._tex) G.designs[slot]._tex = null; };
    const ui = () => {
      $('ds-slots').innerHTML = G.designs.map((d, k) => `<button class="tab${k === slot ? ' on' : ''}" data-s="${k}" style="display:flex;align-items:center;gap:4px">${d && d.img ? `<img src="${d.img}" style="width:20px;height:20px;image-rendering:pixelated;border-radius:4px" alt="">` : ''}${k + 1}</button>`).join('');
      $('ds-slots').querySelectorAll('[data-s]').forEach(b => b.onclick = () => { if (dirty) save(); slot = +b.dataset.s; $('ds-name').value = (G.designs[slot] && G.designs[slot].name) || ''; load(); ui(); });
      $('ds-pal').innerHTML = PAL.map(c => `<button class="sw${c === color ? ' on' : ''}" data-c="${c}" style="background:${c}" aria-label="Couleur"></button>`).join(''); $('ds-pal').querySelectorAll('[data-c]').forEach(b => b.onclick = () => { color = b.dataset.c; $('ds-color').value = color; if (tool === 'gomme' || tool === 'pipette') tool = 'crayon'; ui(); });
      $('ds-tools').innerHTML = [['crayon', '✏️ Crayon'], ['gomme', '🧽 Gomme'], ['remplir', '🪣 Remplir'], ['pipette', '💧 Pipette'], ['sym', (sym ? '✅' : '⬜') + ' Symétrie']].map(([id, n]) => `<button class="tab${tool === id ? ' on' : ''}" data-t="${id}">${n}</button>`).join('');
      $('ds-tools').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (b.dataset.t === 'sym') sym = !sym; else tool = b.dataset.t; G.sfx('ui'); ui(); draw(); });
    };
    $('ds-color').addEventListener('input', e => { color = e.target.value; ui(); });
    $('ds-name').value = (G.designs[slot] && G.designs[slot].name) || '';
    const f = $('panel-foot'); f.innerHTML = '';
    const B = (t, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.onclick = () => { G.sfx('ui'); fn(); }; f.appendChild(b); };
    B('🗑️ Effacer', () => { cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, N, N); dirty = true; draw(); }, 'alt');
    B('🖼️ Importer une image', () => U.importImage(url => { const im = new Image(); im.onload = () => { cx.imageSmoothingEnabled = true; cx.drawImage(im, 0, 0, N, N); dirty = true; draw(); }; im.src = url; }), 'alt');
    B('💾 Enregistrer', () => { save(); ui(); U.toast('Motif enregistré !'); });
    B('👕 Porter sur mon haut', () => { save(); const l = Object.assign({}, G.player.look, { design: slot }); G.player.setLook(l); U.toast('Tu portes ton motif ! ✨'); });
    if (G.map && G.map.interior && ['maison', 'villa', 'cabane', 'tente'].includes(G.map.kind)) { B('🧱 Papier peint', () => { save(); G.decorRoom(G.map, 'wall', 'design:' + slot); U.toast('Papier peint posé !'); }); B('🟫 Sol', () => { save(); G.decorRoom(G.map, 'floor', 'design:' + slot); U.toast('Sol posé !'); }); }
    if (o.back) B('↩️ Retour', () => { if (dirty) save(); o.back(); }, 'alt');
    load(); ui(); draw();
  };
})();
