'use strict';
// ===== Interface (2) : menus, inventaire, catalogue créatif, fabrication, boutique, carte, contrôles tactiles =====
(function () {
  const U = G.ui, $ = G.el;
  const SCREENS = ['screen-title', 'screen-new', 'screen-pause', 'screen-options', 'screen-controls'];
  let backTo = 'screen-title', panelKind = null, panelSel = -1, panelTab = null, shopRes = null;
  U.show = id => { SCREENS.forEach(s => $(s).hidden = s !== id); };
  U.hideScreens = () => SCREENS.forEach(s => $(s).hidden = true);
  // ---------- panneau générique ----------
  function openPanel(kind, title) { panelKind = kind; panelSel = -1; $('panel-title').textContent = title; $('panel').hidden = false; U.modal = 'panel'; G.sfx('open'); $('panel-search').hidden = kind !== 'cat'; $('panel-search').value = ''; }
  U.closePanel = () => { if ($('panel').hidden) return; $('panel').hidden = true; U.modal = null; panelKind = null; G.sfx('close'); if (shopRes) { const r = shopRes; shopRes = null; r(); } };
  $('panel-close').onclick = U.closePanel;
  $('panel').addEventListener('mousedown', e => { if (e.target === $('panel')) U.closePanel(); });
  $('panel-search').addEventListener('input', () => renderCat());
  const tabs = (list, cur, fn) => { const t = $('panel-tabs'); t.innerHTML = ''; list.forEach(([id, n]) => { const b = document.createElement('button'); b.className = 'tab' + (id === cur ? ' on' : ''); b.textContent = n; b.onclick = () => { G.sfx('ui'); fn(id); }; t.appendChild(b); }); };
  const itemBtn = (id, extra = '', cls = '') => `<button class="it ${cls}" data-id="${id}">${U.icon(id)}<span class="lbl">${G.ITEMS[id].n}</span>${extra}</button>`;
  // ---------- inventaire (survie) ----------
  U.openInv = () => { if (G.mode === 'creatif') return U.openCatalog(); openPanel('inv', 'Inventaire'); $('panel-tabs').innerHTML = ''; renderInv(); };
  function renderInv() {
    const S = G.inv.slots; let h = '<div class="grid">';
    S.forEach((s, i) => { h += s ? `<button class="it${i === panelSel ? ' sel' : ''}" data-i="${i}">${U.icon(s.id)}<span class="lbl">${G.ITEMS[s.id].n}</span>${s.n > 1 ? `<span class="n">×${s.n}</span>` : ''}${i < 10 ? '' : ''}</button>` : `<button class="it empty${i === panelSel ? ' sel' : ''}" data-i="${i}"><span class="ic" style="font-size:14px;opacity:.45">${i < 10 ? (i + 1) % 10 : ''}</span><span class="lbl">&nbsp;</span></button>`; if (i === 9) h += '</div><p style="margin:10px 2px 6px;font-size:13px;color:var(--bark);font-weight:800">SAC À DOS</p><div class="grid">'; });
    $('panel-body').innerHTML = '<p style="margin:0 2px 6px;font-size:13px;color:var(--bark);font-weight:800">BARRE D\'OBJETS (1 à 0)</p>' + h + '</div>';
    $('panel-body').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const i = +b.dataset.i; G.sfx('ui');
      if (panelSel >= 0 && panelSel !== i) { [S[panelSel], S[i]] = [S[i], S[panelSel]]; panelSel = -1; G.ui.dirtyHot(); } else panelSel = panelSel === i ? -1 : i; renderInv(); });
    const s = S[panelSel], it = s && G.ITEMS[s.id], f = $('panel-foot');
    f.innerHTML = `<div class="desc">${it ? `<b>${it.n}</b> — ${it.desc || (it.sell ? 'Se vend ' + it.sell + ' clochettes.' : '')}` : 'Clique un objet puis un autre emplacement pour les échanger.'}</div><span class="coins card" style="box-shadow:none">🔔 <b>${G.coins.toLocaleString('fr-FR')}</b></span>`;
    if (it) { if (panelSel < 10) addBtn(f, 'En main', () => { G.act.select(panelSel); U.closePanel(); }); if (it.food) addBtn(f, 'Manger', () => { const k = G.sel; G.sel = panelSel; G.act.eat(it); G.sel = k; renderInv(); }); if (it.kind === 'misc') addBtn(f, 'Ouvrir', () => { S[panelSel].n--; if (!S[panelSel].n) S[panelSel] = null; G.act.openGift(it.id); renderInv(); }); addBtn(f, 'Jeter 1', () => { S[panelSel].n--; if (!S[panelSel].n) { S[panelSel] = null; panelSel = -1; } G.ui.dirtyHot(); G.sfx('pop'); renderInv(); }, 'warn'); }
  }
  function addBtn(f, t, fn, cls = '') { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.onclick = () => { G.sfx('ui'); fn(); }; f.appendChild(b); }
  // ---------- catalogue (créatif) ----------
  U.openCatalog = () => { openPanel('cat', 'Catalogue'); panelTab = panelTab || 'nature'; renderCat(); };
  function renderCat() {
    if (panelKind !== 'cat') return; const q = $('panel-search').value.trim().toLowerCase();
    tabs(G.CATS.map(c => [c.id, c.n]), q ? null : panelTab, id => { panelTab = id; $('panel-search').value = ''; renderCat(); });
    const ids = Object.keys(G.ITEMS).filter(id => { const it = G.ITEMS[id]; if (['res', 'bug', 'fish', 'misc', 'fossil'].includes(it.kind)) return false; return q ? it.n.toLowerCase().includes(q) : it.cat === panelTab; });
    $('panel-body').innerHTML = '<div class="grid">' + ids.map(id => itemBtn(id, '', G.inv.hot[G.sel] === id ? 'sel' : '')).join('') + '</div>';
    $('panel-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { G.inv.hot[G.sel] = b.dataset.id; G.sfx('pickup'); U.dirtyHot(); U.toast(G.ITEMS[b.dataset.id].n + ' → emplacement ' + ((G.sel + 1) % 10)); renderCat(); });
    const f = $('panel-foot'); f.innerHTML = '<div class="desc">Choisis un emplacement, puis clique un objet du catalogue. Tout est illimité !</div>';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap';
    for (let k = 0; k < 10; k++) { const b = document.createElement('button'); b.className = 'slot' + (k === G.sel ? ' sel' : ''); b.style.cssText = 'width:44px;height:44px'; const id = G.inv.hot[k]; b.innerHTML = id ? U.icon(id) : `<span class="k">${(k + 1) % 10}</span>`; b.onclick = () => { G.sel = k; U.dirtyHot(); G.sfx('ui'); renderCat(); }; row.appendChild(b); }
    f.appendChild(row); addBtn(f, 'Vider', () => { G.inv.hot[G.sel] = null; U.dirtyHot(); renderCat(); }, 'alt');
  }
  // ---------- fabrication ----------
  U.openCraft = (cook = false) => { if (G.mode === 'creatif') { U.toast('En créatif, tout est déjà dans le catalogue (I).'); return; } openPanel('craft', cook ? 'Cuisine au feu de camp' : 'Fabrication'); $('panel-tabs').innerHTML = ''; renderCraft(cook); };
  const have = (id, alt) => [id].concat(alt || []).reduce((s, k) => s + G.inv.count(k), 0);
  function renderCraft(cook) {
    const list = G.RECIPES.filter(r => !cook || G.ITEMS[r.id].kind === 'food');
    $('panel-body').innerHTML = '<div class="list">' + list.map((r, i) => {
      const it = G.ITEMS[r.id], keys = Object.keys(r.need); let ok = true;
      const need = keys.map((k, j) => { const h = have(k, j === 0 ? r.alt : null), n = r.need[k]; if (h < n) ok = false; return `<span class="${h >= n ? 'ok' : 'no'}">${G.ITEMS[k].ico || ''} ${j === 0 && r.alt ? 'Poisson' : G.ITEMS[k].n} ${h}/${n}</span>`; }).join('');
      return `<div class="recipe">${U.icon(r.id)}<div class="rn">${it.n}${r.n > 1 ? ' ×' + r.n : ''}</div><div class="need">${need}</div><button class="btn" data-r="${G.RECIPES.indexOf(r)}" ${ok ? '' : 'disabled'}>Fabriquer</button></div>`;
    }).join('') + '</div>';
    $('panel-body').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { craft(G.RECIPES[+b.dataset.r]); renderCraft(cook); });
    $('panel-foot').innerHTML = '<div class="desc">Ramasse du bois (hache), de la pierre et du fer (pioche), des herbes et des coquillages pour fabriquer.</div>';
  }
  function craft(r) {
    const keys = Object.keys(r.need);
    for (const [j, k] of keys.entries()) { if (have(k, j === 0 ? r.alt : null) < r.need[k]) return; }
    keys.forEach((k, j) => { let n = r.need[k]; for (const c of [k].concat(j === 0 && r.alt ? r.alt : [])) { const t = Math.min(n, G.inv.count(c)); if (t) { G.inv.remove(c, t); n -= t; } if (!n) break; } });
    const left = G.inv.add(r.id, r.n || 1); G.sfx('craft'); U.toast('Fabriqué : ' + G.ITEMS[r.id].n + (left ? ' (inventaire plein !)' : ' ✨'));
  }
  // ---------- boutique ----------
  let shopOpt = {};
  U.openShop = (v, o = {}) => new Promise(res => { shopOpt = o; openPanel('shop', o.title || 'Boutique de Gaston'); shopRes = res; panelTab = 'buy'; renderShop(); G.audio.blip('b', .95); });
  function renderShop() {
    tabs(shopOpt.noSell ? [['buy', '🛒 Acheter']] : [['buy', '🛒 Acheter'], ['sell', '💰 Vendre']], panelTab, id => { panelTab = id; renderShop(); });
    const f = $('panel-foot');
    if (panelTab === 'buy') {
      $('panel-body').innerHTML = '<div class="grid">' + (shopOpt.list || G.SHOPLIST).map(id => itemBtn(id, `<span class="price">${G.buyPrice(id)} 🔔</span>`)).join('') + '</div>';
      $('panel-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id, p = G.buyPrice(id);
        if (G.mode === 'creatif') { U.toast('En créatif, tout est gratuit dans ton catalogue (I) !'); return; }
        if (G.coins < p) { G.sfx('error'); U.toast('Pas assez de clochettes… il en faut ' + p + '.'); return; }
        if (G.inv.add(id, 1) > 0) { U.toast('Inventaire plein !'); return; } G.coins -= p; G.sfx('coin'); U.dirtyHud(); U.toast('Merci ! Tu as acheté : ' + G.ITEMS[id].n); renderShop(); });
      f.innerHTML = `<div class="desc">${shopOpt.quote || '« Bonnaffaire ! Tout est fait main, garanti fraîcheur ! »'}</div><span class="coins card" style="box-shadow:none">🔔 <b>${G.coins.toLocaleString('fr-FR')}</b></span>`;
    } else {
      const S = G.inv.slots; const idx = S.map((s, i) => s && G.ITEMS[s.id].sell ? i : -1).filter(i => i >= 0);
      $('panel-body').innerHTML = idx.length ? '<div class="grid">' + idx.map(i => { const s = S[i], it = G.ITEMS[s.id]; return `<button class="it" data-i="${i}">${U.icon(s.id)}<span class="lbl">${it.n}</span><span class="n">×${s.n}</span><span class="price">${it.sell} 🔔</span></button>`; }).join('') + '</div>' : '<p class="desc">Rien à vendre pour l\'instant. Pêche, attrape des insectes, cueille des fruits…</p>';
      $('panel-body').querySelectorAll('[data-i]').forEach(b => b.onclick = e => { const s = S[+b.dataset.i]; if (!s) return; const n = e.shiftKey ? s.n : 1, it = G.ITEMS[s.id]; s.n -= n; if (!s.n) S[+b.dataset.i] = null; G.coins += it.sell * n; G.sfx('coin'); U.dirtyHot(); U.dirtyHud(); renderShop(); });
      f.innerHTML = `<div class="desc">Clique pour vendre 1 · Maj+clic pour tout le tas.</div><span class="coins card" style="box-shadow:none">🔔 <b>${G.coins.toLocaleString('fr-FR')}</b></span>`;
      addBtn(f, 'Tout vendre (poissons, insectes, fruits)', () => { let t = 0; S.forEach((s, i) => { if (s && ['fish', 'bug'].includes(G.ITEMS[s.id].kind) || s && ['pomme', 'orange', 'peche', 'cerise', 'coco', 'coquillage', 'fossile'].includes(s.id)) { t += G.ITEMS[s.id].sell * s.n; S[i] = null; } }); if (t) { G.coins += t; G.sfx('coin'); U.toast('+' + t + ' clochettes !'); } U.dirtyHot(); U.dirtyHud(); renderShop(); });
    }
  }
  // ---------- panneaux et courrier ----------
  U.readSign = o => { const fr = G.ITEMS[G.OBJ[G.world.meta.fruit || 'pommier'].fruit]; U.dialog(o.t === 'tableau' ? "Tableau d'affichage" : 'Panneau', o.txt ? [o.txt] : ['Bienvenue à ' + G.villageName + ' ! Jour ' + G.clock.day + '.', 'Fruit du village : ' + fr.n + ' ' + fr.ico + '. La boutique de Gaston rachète tout !', G.pick(G.LINES.tips).replace(/\{c\}/g, 'cher habitant').replace(/, cher habitant/g, '')], { color: '#a8743f' }); };
  U.readMail = o => { const m = G.world.meta; if (m.mailDay === G.clock.day) { U.toast('Pas de nouveau courrier aujourd\'hui.'); return; } m.mailDay = G.clock.day; const V = G.pick(G.VILLAGERS.slice(0, 4));
    U.dialog('Lettre de ' + V.n, ['Cher·e ' + G.playerName + ',', G.pick(['Merci d\'embellir notre village. Voici un petit quelque chose !', 'J\'ai trouvé ça en me promenant près de la cascade. Garde-le !', 'Viens me voir à la place, j\'ai plein d\'histoires à raconter !']), 'Amitiés, ' + V.n + ' (' + V.catch + ' !)'], { color: '#5b8fd6' }).then(() => G.act.openGift(Math.random() < .5 ? 'sac_pieces' : 'cadeau')); };
  // ---------- grande carte ----------
  U.openMap = () => {
    const m = G.world, cv = $('bigmap'), c = cv.getContext('2d'), base = U.drawMapBase(m); U.mmRev = -1;
    const sc = Math.min(cv.width / m.W, cv.height / m.H); cv.height = Math.round(m.H * sc); c.imageSmoothingEnabled = false; c.drawImage(base, 0, 0, m.W * sc, m.H * sc);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.font = '600 12px Fredoka, sans-serif'; c.fillStyle = 'rgba(255,255,255,.85)';
    for (let a = 0; a <= G.AC; a++) { const x = (G.BORDER + a * G.ACRE) * sc; c.beginPath(); c.moveTo(x, G.BORDER * sc); c.lineTo(x, (G.BORDER + G.AR * G.ACRE) * sc); c.stroke(); }
    for (let a = 0; a <= G.AR; a++) { const y = (G.BORDER + a * G.ACRE) * sc; c.beginPath(); c.moveTo(G.BORDER * sc, y); c.lineTo((G.BORDER + G.AC * G.ACRE) * sc, y); c.stroke(); }
    for (let az = 0; az < G.AR; az++) for (let ax = 0; ax < G.AC; ax++) c.fillText('ABCDEFG'[ax] + '-' + (az + 1), (G.BORDER + ax * G.ACRE + 1) * sc, (G.BORDER + az * G.ACRE + 2.2) * sc);
    c.font = '20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const M = m.meta, ic = (e, p) => p && c.fillText(e, p.x * sc, (p.z - 2) * sc);
    ic('🏠', M.home); ic('🛒', M.shop); ic('⛲', M.plaza); ic('⛺', M.tent); (M.homes || []).forEach(h => ic('🐾', h));
    const p = G.map === m ? G.player : { x: (G.map.meta.door || {}).x || 0, z: (G.map.meta.door || {}).z || 0 }; c.fillStyle = '#ff4d4d'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(p.x * sc, p.z * sc, 7, 0, 7); c.fill(); c.stroke(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    $('map-title').textContent = 'Carte de ' + G.villageName + ' — ' + U.acreName(p.x, p.z); $('mapfull').hidden = false; U.modal = 'map'; G.sfx('open');
  };
  U.closeMap = () => { $('mapfull').hidden = true; U.modal = null; G.sfx('close'); };
  $('map-close').onclick = U.closeMap;
  // ---------- menus ----------
  const SHIRTS = [0x4fb35f, 0x5b8fd6, 0xe8434a, 0xffc23d, 0x8d6fd1, 0xff8fc0, 0x3fb3b0, 0xf7f5ee], HATS = [0xe8434a, 0x5b8fd6, 0x4fb35f, 0xffc23d, 0x2a2d33, 0xf7f5ee, 0xff8fc0, null];
  const look = { shirt: SHIRTS[0], hat: HATS[0], mode: 'creatif' };
  function swatches(id, list, key) { const box = $(id); box.innerHTML = ''; list.forEach(c => { const b = document.createElement('button'); b.className = 'sw' + (look[key] === c ? ' on' : ''); b.style.background = c == null ? 'repeating-linear-gradient(45deg,#fff 0 4px,#eee 4px 8px)' : '#' + c.toString(16).padStart(6, '0'); b.title = c == null ? 'Sans bonnet' : ''; b.setAttribute('aria-label', c == null ? 'Sans bonnet' : 'Couleur'); b.onclick = () => { look[key] = c; G.sfx('ui'); swatches(id, list, key); }; box.appendChild(b); }); }
  document.querySelectorAll('.mode').forEach(b => b.onclick = () => { look.mode = b.dataset.mode; document.querySelectorAll('.mode').forEach(x => x.classList.toggle('on', x === b)); G.sfx('ui'); });
  const click = (id, fn) => $(id).addEventListener('click', () => { G.audio.init(); G.sfx('ui'); fn(); });
  let ngLook = G.defaultLook();
  const lookLabel = () => { const L = G.LOOKS, n = (list, v) => (list.find(x => x[0] === v) || ['', ''])[1]; $('ng-look').textContent = n(L.hair, ngLook.hair) + ' · ' + n(L.top, ngLook.top) + ' · ' + n(L.hat, ngLook.hat) + ' · yeux ' + n(L.eyes, ngLook.eyes).toLowerCase(); };
  click('btn-new', () => { $('ng-map').value = G.editorLayout ? 'custom' : 'classic'; lookLabel(); U.show('screen-new'); });
  click('ng-custom', () => U.openWardrobe({ look: ngLook, title: 'Crée ton personnage', okLabel: 'Valider ce personnage', onDone: l => { ngLook = l; lookLabel(); } }));
  click('btn-continue', () => G.loadGame());
  click('btn-editor', () => G.editor.open());
  click('btn-options', () => { backTo = 'screen-title'; U.show('screen-options'); });
  click('btn-controls', () => { backTo = 'screen-title'; U.show('screen-controls'); });
  click('ng-back', () => U.show('screen-title'));
  click('ng-go', () => { const mp = $('ng-map').value; G.startNew({ name: $('ng-name').value.trim() || 'Pomme', village: $('ng-village').value.trim() || 'Douce Vallée', mode: look.mode, look: ngLook, map: mp, seed: G.hashStr($('ng-seed').value || '1') % 1e9 }); });
  click('o-back', () => { U.saveSettings(); U.show(backTo); });
  click('c-back', () => U.show(backTo));
  click('p-resume', () => U.resume());
  click('p-save', () => { G.saveGame(); });
  click('p-map', () => { U.resume(); U.openMap(); });
  click('p-options', () => { backTo = 'screen-pause'; U.show('screen-options'); });
  click('p-controls', () => { backTo = 'screen-pause'; U.show('screen-controls'); });
  click('p-quit', async () => { const k = await U.confirm('Retour au menu', 'Veux-tu sauvegarder avant de quitter ?', [{ t: 'Sauvegarder et quitter' }, { t: 'Quitter sans sauver', warn: 1 }, { t: 'Annuler', alt: 1 }]); if (k === 2) return; if (k === 0) G.saveGame(); G.toTitle(); });
  U.pause = () => { if (G.state !== 'play') return; G.state = 'pause'; U.show('screen-pause'); G.sfx('open'); };
  U.resume = () => { G.state = 'play'; U.hideScreens(); G.sfx('close'); };
  // ---------- options ----------
  G.settings = Object.assign({ music: 45, sfx: 70, day: '20', curve: true, shadow: true, quality: 'mid', touch: 'auto' }, G.store.get('dv_settings', {}));
  U.applySettings = () => {
    const s = G.settings; $('o-music').value = s.music; $('o-sfx').value = s.sfx; $('o-day').value = s.day; $('o-curve').checked = s.curve; $('o-shadow').checked = s.shadow; $('o-quality').value = s.quality; $('o-touch').value = s.touch;
    G.audio.setVol(s.music / 100, s.sfx / 100); G.U.curve.value = s.curve && !(G.map && G.map.interior) ? G.CURVE : 0; G.setQuality && G.setQuality(s.quality, s.shadow); U.touchMode();
    if (s.camMode) { $('o-cam').value = s.camMode; $('o-fp').checked = !!s.fp; $('o-sens').value = s.sens || 50; $('o-outline').value = s.outlines || 'tout'; }
    G.setOutlines && G.M && G.setOutlines(s.outlines || 'tout');
  };
  U.saveSettings = () => G.store.set('dv_settings', G.settings);
  [['o-music', 'music', 'value', Number], ['o-sfx', 'sfx', 'value', Number], ['o-day', 'day', 'value', String], ['o-curve', 'curve', 'checked', Boolean], ['o-shadow', 'shadow', 'checked', Boolean], ['o-quality', 'quality', 'value', String], ['o-touch', 'touch', 'value', String], ['o-cam', 'camMode', 'value', String], ['o-fp', 'fp', 'checked', Boolean], ['o-sens', 'sens', 'value', Number], ['o-outline', 'outlines', 'value', String]]
    .forEach(([id, k, prop, T]) => $(id).addEventListener(prop === 'checked' ? 'change' : 'input', () => { G.settings[k] = T($(id)[prop]); U.applySettings(); U.saveSettings(); }));
  // ---------- contrôles tactiles ----------
  U.touchMode = () => { const s = G.settings.touch, auto = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; $('touch').hidden = !(G.state === 'play' || G.state === 'pause') || !(s === 'on' || (s === 'auto' && auto)); $('app').classList.toggle('touch-on', !$('touch').hidden); };
  (function touch() {
    const I = G.input, joy = $('joy'), knob = joy.firstChild; let id = null, cx = 0, cy = 0;
    joy.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; id = t.identifier; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; I.touch.active = true; G.audio.init(); }, { passive: false });
    window.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === id) { let dx = (t.clientX - cx) / 50, dy = (t.clientY - cy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } I.touch.mx = dx; I.touch.my = dy; knob.style.transform = `translate(${dx * 38}px,${dy * 38}px)`; } }, { passive: true });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; I.touch.mx = I.touch.my = 0; I.touch.active = false; knob.style.transform = ''; } };
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    const hold = (bid, code) => { const b = $(bid); b.addEventListener('touchstart', e => { e.preventDefault(); I.press(code); G.audio.init(); }, { passive: false }); b.addEventListener('touchend', e => { e.preventDefault(); I.release(code); }); b.addEventListener('mousedown', () => I.press(code)); b.addEventListener('mouseup', () => I.release(code)); };
    hold('tb-jump', 'Space'); hold('tb-use', 'KeyF'); hold('tb-act', 'KeyE'); hold('tb-take', 'KeyX');
    $('tb-inv').onclick = () => U.canPlay() ? U.openInv() : U.modal === 'panel' && U.closePanel(); $('tb-map').onclick = () => U.canPlay() ? U.openMap() : U.modal === 'map' && U.closeMap(); $('tb-pause').onclick = () => G.state === 'play' ? U.pause() : U.resume();
  })();
  // ---------- raccourcis ----------
  U.keys = () => {
    const I = G.input;
    if (!$('confirm').hidden) return;
    if (I.hit('Escape') || I.gpHit(9)) { if (U.modal === 'panel') U.closePanel(); else if (U.modal === 'map') U.closeMap(); else if (U.modal === 'dialog') { } else if (G.state === 'play') U.pause(); else if (G.state === 'pause') { if (!$('screen-pause').hidden) U.resume(); else U.show('screen-pause'); } return; }
    if (G.state !== 'play') return;
    const inv = I.ch('i') || I.hit('Tab') || I.gpHit(3);
    if (!U.modal) { if (inv) U.openInv(); else if (I.ch('c')) U.openCraft(); else if (I.ch('m')) U.openMap(); }
    else if (U.modal === 'panel' && inv && (panelKind === 'inv' || panelKind === 'cat')) U.closePanel();
    else if (U.modal === 'map' && (I.ch('m') || I.gpHit(1))) U.closeMap();
  };
})();
