'use strict';
// ===== Interface (1) : HUD, barre d'objets, vignettes 3D, invites, dialogues animalais, mini-carte =====
(function () {
  const U = G.ui = { modal: null, fading: false, hotDirty: true, hudDirty: true, mmT: 0, mmRev: -1 };
  const $ = G.el;
  U.canPlay = () => G.state === 'play' && !U.modal && !U.fading;
  U.dirtyHot = () => { U.hotDirty = true; }; U.dirtyHud = () => { U.hudDirty = true; };
  // ---------- vignettes 3D façon catalogue ----------
  const thumbs = {}; let tScene, tCam, tRT, tBuf, tCv;
  function thumbSetup() {
    tScene = new THREE.Scene(); tScene.add(new THREE.HemisphereLight(0xffffff, 0xb0a080, .75)); const d = new THREE.DirectionalLight(0xffffff, .7); d.position.set(3, 6, 5); tScene.add(d);
    tCam = new THREE.PerspectiveCamera(30, 1, .05, 100); tRT = new THREE.WebGLRenderTarget(96, 96); tBuf = new Uint8Array(96 * 96 * 4); tCv = G.cv(96, 96);
  }
  U.thumb = id => {
    const it = G.ITEMS[id]; if (!it || !it.thumb) return null; if (thumbs[it.thumb] !== undefined) return thumbs[it.thumb];
    const [kind, key] = it.thumb.split(':'); let url = null;
    try {
      if (kind === 'surf') { const c = G.cv(64, 64), x = c.getContext('2d'), cell = G.SURF[+key].cell, img = G.TEX.atlas.image; x.save(); G.rrect(x, 4, 4, 56, 56, 14); x.clip(); x.drawImage(img, (cell % 4) * 128 + 16, Math.floor(cell / 4) * 128 + 16, 96, 96, 4, 4, 56, 56); x.restore(); x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 2; G.rrect(x, 4, 4, 56, 56, 14); x.stroke(); url = c.toDataURL(); }
      else {
        if (!tScene) thumbSetup(); const R = G.renderer; let geo;
        if (kind === 'tool') geo = G.toolGeo(key); else { const d = G.OBJ[key]; geo = G.getGeo(d.model, d.v); }
        const mesh = new THREE.Mesh(geo, G.MATS); const tool = kind === 'tool';
        if (tool) mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), .8).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -.35));
        else mesh.rotation.y = -.5;
        tScene.add(mesh); geo.computeBoundingSphere(); const bs = geo.boundingSphere, c = bs.center.clone().applyQuaternion(mesh.quaternion);
        const dist = bs.radius / Math.sin(15 * Math.PI / 180) * (tool ? .86 : 1.02); tCam.position.set(c.x, c.y + dist * (tool ? .2 : .42), c.z + dist * (tool ? .98 : .9)); tCam.lookAt(c);
        const cu = G.U.curve.value, gc = G.M.glow.color.getHex(); G.U.curve.value = 0; G.M.glow.color.setHex(0xffffff);
        R.setRenderTarget(tRT); R.setClearColor(0x000000, 0); R.clear(); R.render(tScene, tCam); R.readRenderTargetPixels(tRT, 0, 0, 96, 96, tBuf); R.setRenderTarget(null);
        G.U.curve.value = cu; G.M.glow.color.setHex(gc); tScene.remove(mesh);
        const ctx = tCv.getContext('2d'), im = ctx.createImageData(96, 96); for (let y = 0; y < 96; y++) im.data.set(tBuf.subarray((95 - y) * 384, (96 - y) * 384), y * 384); ctx.putImageData(im, 0, 0); url = tCv.toDataURL();
      }
    } catch (e) { url = null; }
    thumbs[it.thumb] = url; return url;
  };
  U.icon = (id, cls = '') => { const it = G.ITEMS[id]; if (!it) return ''; const u = U.thumb(id); return u ? `<img src="${u}" alt="" class="${cls}">` : `<span class="ic ${cls}">${it.ico || '❔'}</span>`; };
  // ---------- barre d'objets ----------
  U.buildHotbar = () => {
    const hb = $('hotbar'); hb.innerHTML = '';
    for (let k = 0; k < 10; k++) { const b = document.createElement('button'); b.className = 'slot'; b.dataset.k = k; b.setAttribute('aria-label', 'Emplacement ' + (k + 1)); b.onclick = () => G.act.select(k); hb.appendChild(b); }
    U.hotDirty = true;
  };
  U.updHotbar = () => {
    if (!U.hotDirty) return; U.hotDirty = false; const cr = G.mode === 'creatif';
    [...$('hotbar').children].forEach((b, k) => {
      const id = cr ? G.inv.hot[k] : (G.inv.slots[k] && G.inv.slots[k].id), n = cr ? 0 : (G.inv.slots[k] && G.inv.slots[k].n);
      b.className = 'slot' + (k === G.sel ? ' sel' : ''); b.innerHTML = `<span class="k">${(k + 1) % 10}</span>` + (id ? U.icon(id) : '') + (n > 1 ? `<span class="n">${n}</span>` : '');
      b.title = id ? G.ITEMS[id].n : 'Vide';
    });
    const it = G.inv.held(); G.player && G.player.setTool(it && it.kind === 'tool' ? it.tool : null);
  };
  let heldT = 0; U.showHeld = () => { const it = G.inv.held(); $('held-name').textContent = it ? it.n : ''; $('held-name').style.opacity = 1; heldT = 1.6; };
  // ---------- toasts, fondu, confirmation ----------
  U.toast = (msg, ms) => { const t = document.createElement('div'); t.className = 'card toast'; t.textContent = msg; const box = $('toasts'); box.appendChild(t); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => t.remove(), ms || 2800); };
  U.fade = (cb, hold = .25) => { if (U.fading) return; U.fading = true; $('fade').classList.add('on'); setTimeout(() => { try { cb && cb(); } catch (e) { console.error(e); } setTimeout(() => { $('fade').classList.remove('on'); setTimeout(() => U.fading = false, 300); }, hold * 1000); }, 380); };
  U.confirm = (title, text, btns) => new Promise(res => {
    $('cf-title').textContent = title; $('cf-text').textContent = text; const box = $('cf-btns'); box.innerHTML = '';
    btns.forEach((b, i) => { const e = document.createElement('button'); e.className = 'btn' + (b.alt ? ' alt' : '') + (b.warn ? ' warn' : ''); e.textContent = b.t; e.onclick = () => { $('confirm').hidden = true; G.sfx('ui'); res(i); }; box.appendChild(e); });
    $('confirm').hidden = false;
  });
  // ---------- dialogues (texte machine à écrire + voix animalaise) ----------
  let dlg = null;
  U.dialog = (name, lines, o = {}) => new Promise(res => {
    dlg = { lines, k: 0, shown: 0, res, pitch: o.pitch || 1, choices: o.choices, t: 0 };
    $('dlg-name').textContent = name; $('dlg-name').style.background = o.color || ''; $('dialog').hidden = false; $('dlg-choices').innerHTML = ''; $('dlg-text').textContent = '';
    U.modal = 'dialog';
  });
  $('dialog').addEventListener('click', () => dlgNext());
  function dlgNext() {
    if (!dlg) return; const line = dlg.lines[dlg.k];
    if (dlg.shown < line.length) { dlg.shown = line.length; $('dlg-text').textContent = line; showChoices(); return; }
    if (dlg.choices && dlg.k === dlg.lines.length - 1) return;
    dlg.k++; dlg.shown = 0; if (dlg.k >= dlg.lines.length) closeDlg(-1);
  }
  function showChoices() { if (!dlg.choices || dlg.k !== dlg.lines.length - 1 || $('dlg-choices').children.length) return; dlg.choices.forEach((c, i) => { const b = document.createElement('button'); b.textContent = c; b.onclick = e => { e.stopPropagation(); closeDlg(i); }; $('dlg-choices').appendChild(b); }); }
  function closeDlg(i) { const r = dlg.res; dlg = null; $('dialog').hidden = true; U.modal = null; G.sfx('close'); r(i); }
  function updDialog(dt) {
    if (!dlg) return; const I = G.input, line = dlg.lines[dlg.k];
    if (dlg.shown < line.length) { dlg.t += dt * 38; while (dlg.t >= 1 && dlg.shown < line.length) { dlg.t -= 1; const ch = line[dlg.shown++]; if (dlg.shown % 2) G.audio.blip(ch, dlg.pitch); } $('dlg-text').textContent = line.slice(0, dlg.shown); if (dlg.shown >= line.length) showChoices(); }
    $('dlg-next').style.visibility = dlg.shown >= line.length && !(dlg.choices && dlg.k === dlg.lines.length - 1) ? 'visible' : 'hidden';
    if (I.hit('KeyE') || I.hit('Space') || I.hit('Enter') || I.hit('KeyF') || I.gpHit(0) || I.gpHit(1)) dlgNext();
    if (I.hit('Escape') && dlg) closeDlg(-1);
  }
  // ---------- invites contextuelles ----------
  const VERB = { axe: 'Couper', pick: 'Miner', shovel: 'Creuser', net: 'Filet', can: 'Arroser', sword: 'Frapper', sling: 'Tirer', rod: 'Pêcher' };
  function promptHtml() {
    const p = G.player; if (!p || !U.canPlay() || p.dead) return null;
    if (p.sit) return '<kbd>E</kbd>Se lever';
    if (p.vehicle) return '<kbd>Espace</kbd>Monter&nbsp;&nbsp; <kbd>Maj</kbd>Descendre&nbsp;&nbsp; <kbd>E</kbd>Atterrir';
    if (p.swim) return '<kbd>Espace</kbd>Sortir de l\'eau';
    if (p.emote) return '<kbd>E</kbd>Arrêter l\'émote';
    if (p.fish) return p.fish.phase === 'bite' ? '<kbd>F</kbd>Ferrer !' : '<kbd>F</kbd>Remonter la ligne';
    const out = []; const v = G.ents.villagerInFront(p); if (v) out.push(`<kbd>E</kbd>${v.shop ? 'Boutique de' : 'Parler à'} ${v.D.n}`);
    const m = G.map, [tx, tz] = p.target(), o = m.objAt(tx, tz), d = o && G.OBJ[o.t], it = G.inv.held();
    if (!v && d) {
      let e = null; if (d.shop) e = 'Entrer dans la boutique'; else if (d.enter) e = G.act.front(o) ? 'Entrer' : null; else if (d.storage) e = 'Rangement'; else if (d.wardrobe) e = 'Changer de tenue'; else if (d.balloon) e = 'Monter dans la montgolfière'; else if (d.games) e = 'Jouer';
      else if (d.light && !d.fire && (m.interior || d.toggle)) e = o.off ? 'Allumer' : 'Éteindre'; else if (d.sit) e = "S'asseoir"; else if (d.sleep) e = 'Dormir'; else if (d.craft) e = 'Fabriquer'; else if (d.cook) e = 'Cuisiner'; else if (d.read) e = 'Lire'; else if (d.mail) e = 'Courrier'; else if (d.fruit || d.shake) e = 'Secouer'; else if (d.pickFruit) e = 'Cueillir'; else if (d.pick) e = 'Ramasser'; else if (d.fountain) e = 'Faire un vœu';
      if (e) out.push(`<kbd>E</kbd>${e}`);
    } else if (!v) { const h = m.objAt(Math.floor(p.x), Math.floor(p.z)); if (h && G.OBJ[h.t].pick) out.push('<kbd>E</kbd>Ramasser'); }
    if (it) { let f = null;
      if (it.kind === 'tool') { f = VERB[it.tool]; if (it.tool === 'axe' && !(d && d.chop)) f = null; if (it.tool === 'pick' && !(d && d.mine)) f = null; }
      else if (it.food) f = 'Manger'; else if (it.kind === 'place') f = 'Poser · <kbd>R</kbd>Tourner'; else if (it.kind === 'bridge') f = 'Poser le pont'; else if (it.kind === 'surf') f = 'Peindre le sol'; else if (it.kind === 'terra') f = it.n; else if (it.id === 'cadeau') f = 'Ouvrir';
      if (f) out.push(`<kbd>F</kbd>${f}`); }
    if (d && !d.fixed && (G.mode === 'creatif' || d.take) && !['maison_hab', 'boutique', 'paillasson'].includes(o.t)) out.push('<kbd>X</kbd>' + (G.mode === 'creatif' ? 'Retirer' : 'Ranger'));
    return out.length ? out.join('&nbsp;&nbsp; ') : null;
  }
  let lastPrompt = '';
  // ---------- mini-carte ----------
  const mmBase = G.cv(16, 16);
  const SC = { 2: '#d2ab72', 3: '#c3c0b4', 4: '#a8a196', 5: '#f2dfa4', 6: '#c99158', 7: '#87593a', 8: '#f4f8ff', 9: '#c4654a', 11: '#e6e1d6', 12: '#e6e1d6', 13: '#c9554e', 15: '#c8b28a' };
  const GRASS = ['#7fca62', '#93d672', '#a6df82', '#b9e796', '#cdeeb0'];
  U.drawMapBase = m => {
    mmBase.width = m.W; mmBase.height = m.H; const c = mmBase.getContext('2d'), im = c.createImageData(m.W, m.H), D = im.data, col = new THREE.Color();
    for (let z = 0; z < m.H; z++) for (let x = 0; x < m.W; x++) {
      const i = z * m.W + x; let hex;
      if (m.water[i]) hex = m.water[i] === 2 ? '#3d8fd0' : '#5ab8ea'; else if (SC[m.surf[i]]) hex = SC[m.surf[i]]; else hex = m.surf[i] === 1 ? '#5fa94e' : GRASS[Math.min(4, m.lvl[i])];
      col.set(hex); let k = 1; if (!m.water[i] && ((x > 0 && m.lvl[i - 1] < m.lvl[i]) || (z < m.H - 1 && m.lvl[i + m.W] < m.lvl[i]))) k = .72;
      const o = m.objAt(x, z); if (o) { const d = G.OBJ[o.t]; if (d.chop >= 3) col.set(d.model === 'tree_cherry' ? '#f5a6c4' : '#3a8a42'); else if (d.enter || d.shop) col.set(d.shop ? '#ffc23d' : '#e2574c'); else if (d.mine) col.set('#9d9a93'); else if (d.onWater || d.walk) col.set('#b98a55'); }
      D[i * 4] = col.r * 255 * k; D[i * 4 + 1] = col.g * 255 * k; D[i * 4 + 2] = col.b * 255 * k; D[i * 4 + 3] = 255;
    }
    c.putImageData(im, 0, 0); return mmBase;
  };
  U.acreName = (x, z) => { const ax = Math.floor((x - G.BORDER) / G.ACRE), az = Math.floor((z - G.BORDER) / G.ACRE); if (ax < 0 || az < 0 || ax >= G.AC || az >= G.AR) return az >= G.AR ? 'Mer' : 'Lisière'; return 'ABCDEFGHIJ'[ax] + '-' + (az + 1); };
  function drawMinimap() {
    const cv = $('minimap'), c = cv.getContext('2d'), m = G.map, p = G.player, S = cv.width;
    if (m.rev !== U.mmRev && (U.mmT -= 1) < 0) { U.drawMapBase(m); U.mmRev = m.rev; U.mmT = 30; }
    c.fillStyle = m.interior ? '#5a4030' : '#3d8fd0'; c.fillRect(0, 0, S, S);
    const view = m.interior ? Math.max(m.W, m.H) + 2 : 46, sc = S / view, ox = p.x - view / 2, oz = p.z - view / 2;
    c.imageSmoothingEnabled = false; c.drawImage(mmBase, ox, oz, view, view, 0, 0, S, S);
    for (const v of G.ents.villagers) if (v.visible && v.map === m) { c.fillStyle = '#' + new THREE.Color(v.D.acc).getHexString(); c.beginPath(); c.arc((v.x - ox) * sc, (v.z - oz) * sc, 4, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); }
    const cx = (p.x - ox) * sc, cz = (p.z - oz) * sc, a = p.yaw; c.save(); c.translate(cx, cz); c.rotate(-a + Math.PI); c.fillStyle = '#ff4d4d'; c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 6); c.lineTo(0, 3); c.lineTo(-6, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
    $('mm-label').textContent = m.interior ? (m.meta.title || 'Maison') : m.kind === 'ile' ? 'Île aux palmiers' : U.acreName(p.x, p.z);
  }
  // ---------- HUD ----------
  const DAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'], MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function updHud() {
    const ck = G.clock, h = Math.floor(ck.min / 60) % 24, mi = Math.floor(ck.min % 60);
    $('clk-time').textContent = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
    const d = new Date(G.startDate || Date.now()); d.setDate(d.getDate() + ck.day - 1); $('clk-date').textContent = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' · Jour ' + ck.day;
    $('clk-ico').textContent = h >= 21 || h < 5 ? '🌙' : h < 7 ? '🌅' : h >= 18 ? '🌇' : '☀️';
    if (U.hudDirty) { U.hudDirty = false; $('coins').textContent = G.coins.toLocaleString('fr-FR'); const p = G.player, sv = G.mode === 'survie'; $('stats').hidden = !sv;
      if (sv && p) { let hs = '', fs = ''; for (let k = 0; k < 5; k++) { const v = p.hp - k * 2; hs += `<span class="${v >= 2 ? '' : v === 1 ? 'half' : 'off'}">❤️</span>`; const f = p.food - k * 2; fs += `<span class="${f >= 2 ? '' : f === 1 ? 'half' : 'off'}">🍗</span>`; } $('hearts').innerHTML = hs; $('hunger').innerHTML = fs; } }
  }
  U.update = dt => {
    updDialog(dt);
    if (G.state !== 'play') return;
    U.updHotbar(); updHud(); $('crosshair').hidden = !G.firstPerson();
    $('lockhint').hidden = !(G.mouseMode() && !document.pointerLockElement && U.canPlay() && !$('app').classList.contains('touch-on'));
    if (heldT > 0) { heldT -= dt; if (heldT <= 0) $('held-name').style.opacity = 0; }
    const ph = promptHtml(); if (ph !== lastPrompt) { lastPrompt = ph; $('prompt').hidden = !ph; if (ph) $('prompt').innerHTML = ph; }
    const p = G.player, ch = $('charge');
    if (p && p.charging && p.charge > .05) { const [sx, sy] = G.toScreen(p.x, p.y + 1.45, p.z); ch.style.display = 'block'; ch.style.left = sx + 'px'; ch.style.top = sy + 'px'; ch.firstChild.style.width = (p.charge * 100) + '%'; ch.classList.toggle('max', p.charge >= 1); }
    else ch.style.display = 'none';
    drawMinimap();
  };
})();
