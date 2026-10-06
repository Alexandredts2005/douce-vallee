'use strict';
// ===== Interface (3) : casiers partagés, encyclopédie, musée, émotes, décoration, dialogues des bâtiments =====
(function () {
  const U = G.ui, $ = G.el;
  Object.assign(G.settings, Object.assign({ camMode: 'souris', fp: false, outlines: 'perso', sens: 50 }, G.store.get('dv_settings', {})));
  if (!G.settings.v3) { G.settings.v3 = 1; G.settings.camMode = matchMedia('(pointer: coarse)').matches ? 'village' : 'souris'; G.settings.outlines = 'perso'; G.store.set('dv_settings', G.settings); }
  U.open = (kind, title) => { $('panel-title').textContent = title; $('panel').hidden = false; U.modal = 'panel'; U.panelKind = kind; G.sfx('open'); $('panel-search').hidden = true; $('panel-tabs').innerHTML = ''; $('panel-foot').innerHTML = ''; $('panel-body').innerHTML = ''; };
  const btn = (box, t, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.onclick = () => { G.sfx('ui'); fn(); }; box.appendChild(b); return b; };
  const tabs = (list, cur, fn) => { const t = $('panel-tabs'); t.innerHTML = ''; list.forEach(([id, n]) => { const b = document.createElement('button'); b.className = 'tab' + (id === cur ? ' on' : ''); b.textContent = n; b.onclick = () => { G.sfx('ui'); fn(id); }; t.appendChild(b); }); };
  const slotHtml = (s, i, key) => s ? `<button class="it" data-${key}="${i}">${U.icon(s.id)}<span class="lbl">${G.ITEMS[s.id].n}</span>${s.n > 1 ? `<span class="n">×${s.n}</span>` : ''}</button>` : `<button class="it empty" data-${key}="${i}"><span class="lbl">&nbsp;</span></button>`;
  // ---------- rangement partagé ----------
  U.openStorage = () => {
    if (G.mode === 'creatif') { U.toast('En créatif, tout est dans ton catalogue (I) : pas besoin de ranger !'); return; }
    U.open('storage', 'Rangement'); const render = () => {
      $('panel-body').innerHTML = '<p class="desc" style="margin:0 0 8px;font-size:13px;color:var(--bark)"><b>SAC</b> — clique pour ranger (Maj+clic : un seul)</p><div class="grid">' + G.inv.slots.map((s, i) => slotHtml(s, i, 'i')).join('') + '</div>'
        + '<p class="desc" style="margin:14px 0 8px;font-size:13px;color:var(--bark)"><b>RANGEMENT</b> (le même dans ta maison et aux casiers de la gare) — clique pour reprendre</p><div class="grid">' + G.storage.map((s, i) => slotHtml(s, i, 's')).join('') + '</div>';
      $('panel-body').querySelectorAll('[data-i]').forEach(b => b.onclick = e => { const i = +b.dataset.i, s = G.inv.slots[i]; if (!s) return; const n = e.shiftKey ? 1 : s.n, left = G.storeAdd(s.id, n); s.n -= n - left; if (!s.n) G.inv.slots[i] = null; if (left === n) U.toast('Le rangement est plein !'); G.sfx('place', .5); U.dirtyHot(); render(); });
      $('panel-body').querySelectorAll('[data-s]').forEach(b => b.onclick = e => { const i = +b.dataset.s, s = G.storage[i]; if (!s) return; const n = e.shiftKey ? 1 : s.n, left = G.inv.add(s.id, n); s.n -= n - left; if (!s.n) G.storage[i] = null; if (left === n) U.toast('Ton sac est plein !'); G.sfx('pickup'); render(); });
      $('panel-foot').innerHTML = `<div class="desc">${G.storage.filter(Boolean).length} / ${G.storage.length} emplacements utilisés.</div>`;
    }; render();
  };
  // ---------- encyclopédie ----------
  const DEX = [['fish', '🐟 Poissons'], ['bug', '🦋 Insectes'], ['fossil', '🦴 Fossiles']];
  U.openDex = (tab = 'fish') => {
    U.open('dex', 'Encyclopédie'); const render = t => {
      tabs(DEX, t, render); const ids = Object.keys(G.ITEMS).filter(id => G.ITEMS[id].kind === t);
      $('panel-body').innerHTML = '<div class="grid">' + ids.map(id => { const it = G.ITEMS[id], c = G.dex.caught[id], d = G.dex.donated[id];
        return `<div class="it" style="cursor:default" title="${c ? it.n : '???'}">${c ? U.icon(id) : '<span class="ic" style="filter:grayscale(1) brightness(0);opacity:.25">' + (it.ico || '?') + '</span>'}<span class="lbl">${c ? it.n : '???'}</span><span class="price">${c ? it.sell + ' 🔔' : ''}</span><span style="font-size:10px;color:var(--bark);text-align:center">${c ? (G.HABITAT[id] || '') : ''}</span>${d ? '<span class="n">🏛️</span>' : ''}</div>`; }).join('') + '</div>';
      const cnt = k => { const l = Object.keys(G.ITEMS).filter(id => G.ITEMS[id].kind === k); return l.filter(id => G.dex.caught[id]).length + '/' + l.length; };
      $('panel-foot').innerHTML = `<div class="desc">Poissons ${cnt('fish')} · Insectes ${cnt('bug')} · Fossiles ${cnt('fossil')} — 🏛️ = exposé au musée (${Object.keys(G.dex.donated).length}/${G.collectibles().length})</div>`;
    }; render(tab);
  };
  // ---------- musée : dons & fossiles ----------
  U.openDonate = () => {
    U.open('donate', 'Faire un don au musée'); const render = () => {
      const cr = G.mode === 'creatif', ids = cr ? G.collectibles().filter(id => !G.dex.donated[id]) : [...new Set(G.inv.slots.filter(s => s && ['fish', 'bug', 'fossil'].includes(G.ITEMS[s.id].kind) && !G.dex.donated[s.id]).map(s => s.id))];
      $('panel-body').innerHTML = ids.length ? '<div class="grid">' + ids.map(id => `<button class="it" data-id="${id}">${U.icon(id)}<span class="lbl">${G.ITEMS[id].n}</span><span class="price">Donner</span></button>`).join('') + '</div>' : '<p class="desc">Rien de nouveau à donner. Pêche, attrape des insectes et déterre des fossiles (fais-les identifier d\'abord) !</p>';
      $('panel-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id; if (!cr) G.inv.remove(id, 1); G.dex.donated[id] = G.clock.day; G.dex.caught[id] = G.dex.caught[id] || G.clock.day; G.sfx('craft'); U.toast('Merci ! ' + G.ITEMS[id].n + ' est maintenant exposé au musée. 🏛️'); if (G.map.kind === 'musee') G.buildMuseum(G.map); render(); });
      $('panel-foot').innerHTML = `<div class="desc">Collection : ${Object.keys(G.dex.donated).length} / ${G.collectibles().length}</div>`;
    }; render();
  };
  U.identifyFossils = () => { const n = G.inv.count('fossile'); if (!n || G.mode === 'creatif') return ['Tu n\'as pas de fossile inconnu. Creuse les fissures brillantes avec une pelle !'];
    const got = []; for (let k = 0; k < n; k++) { const pool = G.FOSSILS.filter(f => !G.dex.donated[f] && !G.inv.count(f)); const f = G.pick(pool.length ? pool : G.FOSSILS); G.inv.remove('fossile', 1); G.inv.add(f, 1); G.feat.mark(f); got.push(G.ITEMS[f].n); }
    G.sfx('craft'); return ['Hou hou… voyons voir…', 'Il s\'agit de : ' + got.join(', ') + ' !', 'Tu peux me les donner pour le musée, ou les vendre chez Gaston.']; };
  // ---------- émotes ----------
  U.openEmotes = () => {
    if (!U.canPlay()) return; U.open('emotes', 'Émotes');
    const un = G.flags.emotes || ['salut', 'rire', 'surprise', 'assis'];
    $('panel-body').innerHTML = '<div class="grid">' + G.feat.EMOTES.filter(e => G.mode === 'creatif' || un.includes(e[0])).map(([id, ico, n]) => `<button class="it" data-e="${id}"><span class="ic">${ico}</span><span class="lbl">${n}</span></button>`).join('') + '</div>';
    $('panel-body').querySelectorAll('[data-e]').forEach(b => b.onclick = () => { U.closePanel(); G.feat.emote(b.dataset.e); });
    $('panel-foot').innerHTML = '<div class="desc">Raccourci : G. Bouge ou appuie sur E pour arrêter une émote.' + (G.mode === 'creatif' ? '' : ' Le Club Rire de la rue commerçante t\'en apprend d\'autres !') + '</div>';
  };
  // ---------- décoration de la pièce ----------
  const OWN = ['maison', 'villa', 'cabane', 'tente'];
  U.openDecor = (tab = 'wall') => {
    const m = G.map; if (!m.interior || !OWN.includes(m.kind)) { U.toast('Entre dans ta maison (ou ta tente) pour la décorer.'); return; }
    U.open('decor', 'Décorer la pièce'); const render = t => {
      tabs([['wall', '🧱 Papier peint'], ['floor', '🟫 Sol']], t, render);
      const list = (t === 'wall' ? G.WALLS : G.FLOORS).map(p => [p[0], p[1]]).concat((G.designs || []).map((d, k) => d && d.img ? ['design:' + k, '✏️ ' + (d.name || 'Motif ' + (k + 1))] : null).filter(Boolean));
      const cur = (m.meta.shell || {})[t];
      $('panel-body').innerHTML = '<div class="grid">' + list.map(([id, n]) => `<button class="it${cur === id ? ' sel' : ''}" data-p="${id}"><img src="${id.startsWith('design:') ? G.designs[+id.slice(7)].img : G.patURL(t, id)}" alt="" style="border-radius:10px;image-rendering:${id.startsWith('design:') ? 'pixelated' : 'auto'}"><span class="lbl">${n}</span></button>`).join('') + '</div>';
      $('panel-body').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { G.decorRoom(m, t, b.dataset.p); G.sfx('place'); render(t); });
      const f = $('panel-foot'); f.innerHTML = '<div class="desc">Crée tes propres motifs (ou importe une image) chez Mme Laine, la couturière.</div>';
      btn(f, 'Importer une image…', () => U.importImage(url => { const k = G.addDesign({ name: 'Image', img: url }); G.decorRoom(m, t, 'design:' + k); render(t); }), 'alt');
    }; render(tab);
  };
  // ---------- dialogues des bâtiments ----------
  const say = (v, lines, choices) => U.dialog(v.D.n, lines, { pitch: v.D.pitch, color: '#' + new THREE.Color(v.D.shirt || 0x4fb35f).getHexString(), choices });
  G.npcSay = say;
  G.npcTalk = v => {
    const r = v.npc, P = G.playerName;
    if (G.npcRoles[r]) return G.npcRoles[r](v);
    if (r === 'jeux') return say(v, ['Approche, approche, ' + P + ' ! Les jeux de la place, c\'est gratuit et ça rapporte des clochettes !'], ['Attrape-étoiles', 'Tir aux ballons', 'Course des anneaux', 'Non merci']).then(k => { if (k >= 0 && k < 3) G.mini.start(['etoiles', 'ballons', 'anneaux'][k]); });
    if (r === 'mairie') return say(v, ['Bonjour ' + P + ' ! Bienvenue à la mairie de ' + G.villageName + '. Je peux t\'aider ?'], ['Agrandir ma maison', 'Décorer ma maison', 'Nouvelles du village', 'Au revoir']).then(k => {
      if (k === 0) { const hi = G.interiors[G.homeId ? G.homeId() : 'home'], st = (hi && hi.meta.stage) || 1; if (st >= G.HOME_STAGES.length) return say(v, ['Ta maison est déjà la plus grande du village !']);
        const cost = G.mode === 'creatif' ? 0 : G.HOME_COST[st], [w, h] = G.HOME_STAGES[st];
        return say(v, [`On peut agrandir ta maison à ${w}×${h} cases${cost ? ' pour ' + cost.toLocaleString('fr-FR') + ' clochettes' : ', gratuitement en mode Créatif'}. On y va ?`], ['Oui !', 'Plus tard']).then(c => { if (c !== 0) return; if (G.coins < cost) return say(v, ['Oh… il te manque des clochettes. Vends des poissons et des fruits chez Gaston !']); G.coins -= cost; U.dirtyHud(); G.expandHome(); G.sfx('fanfare'); return say(v, ['C\'est fait ! Ta maison mesure maintenant ' + w + '×' + h + '. Va vite la décorer (touche H chez toi) !']); }); }
      if (k === 1) return say(v, ['Chez toi, appuie sur H : tu peux choisir le papier peint et le sol, ou utiliser tes propres motifs.', 'Les lampes s\'allument et s\'éteignent avec E, et le coffre range tes affaires.']);
      if (k === 2) { const d = Object.keys(G.dex.donated).length; return say(v, ['Nous sommes le jour ' + G.clock.day + ' à ' + G.villageName + '.', 'Le musée expose ' + d + ' pièce' + (d > 1 ? 's' : '') + '. Le Professeur Plume attend tes trouvailles !', 'Le capitaine Bigorneau t\'emmène sur l\'île depuis le ponton, au sud.']); } });
    if (r === 'musee') return say(v, ['Hou hou ! Bienvenue au musée, ' + P + '. Que puis-je pour la science ?'], ['Faire un don', 'Identifier mes fossiles', 'Encyclopédie', 'Au revoir']).then(k => { if (k === 0) U.openDonate(); if (k === 1) return say(v, U.identifyFossils()); if (k === 2) U.openDex(); });
    if (r === 'couture') return say(v, ['Bienvenue chez Mme Laine ! Envie d\'une nouvelle tenue, mon chou ?'], ['Changer de tenue', 'Atelier de motifs', 'Au revoir']).then(k => { if (k === 0) U.openWardrobe(); if (k === 1) U.openDesigns(); });
    if (r === 'gare') return say(v, ['Bienvenue à la gare de ' + G.villageName + ' ! Hi hi !'], ['Prendre le train', 'Utiliser les casiers', 'Au revoir']).then(k => { if (k === 0) return say(v, ['Le train n\'est pas encore en service… Les rails sont posés, il arrivera bientôt ! Promis !']); if (k === 1) U.openStorage(); });
    if (r === 'capitaine') { const onIsland = G.map.kind === 'ile'; return say(v, onIsland ? ['Coâ ! Alors, cette île ? On rentre au village ?'] : ['Coâ coâ ! Moi, c\'est le capitaine Bigorneau. Une petite traversée vers l\'île aux palmiers ?'], onIsland ? ['Rentrer au village', 'Rester encore'] : ['En route pour l\'île !', 'Une autre fois']).then(k => { if (k === 0) onIsland ? G.travel.home() : G.travel.island(); }); }
    if (r === 'ile') { const gift = G.flags.ileGift !== G.clock.day; G.flags.ileGift = G.clock.day; return say(v, ['Bonjour jeune voyageur… Je suis Papy Écaille, gardien de cette île.', gift ? 'Tiens, prends ce petit souvenir. Reviens demain, j\'en aurai un autre !' : 'Profite de l\'île : il y a des papillons et des poissons qu\'on ne voit nulle part ailleurs !']).then(() => { if (gift) { G.act.give(G.pick(['coco', 'coco', 'poisson_clown', 'or']), 1); G.sfx('fanfare'); } }); }
    return say(v, ['Bonjour !']);
  };
  U.importImage = cb => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif'; inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const c = G.cv(64, 64), x = c.getContext('2d'); const s = Math.min(im.width, im.height); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 64, 64); cb(c.toDataURL('image/png')); }; im.src = rd.result; }; rd.readAsDataURL(f); }; inp.click(); };
  // ---------- raccourcis supplémentaires ----------
  U.keys2 = () => { const I = G.input; if (G.state !== 'play' || U.modal) return;
    if (I.ch('v')) { G.settings.camMode = G.mouseMode() ? 'village' : 'souris'; U.saveSettings(); U.applySettings(); U.toast(G.mouseMode() ? 'Caméra 3D à la souris (clique dans le jeu)' : 'Caméra vue du village'); if (!G.mouseMode() && document.pointerLockElement) document.exitPointerLock(); }
    if (I.ch('k')) U.openDex(); if (I.ch('h')) U.openDecor(); if (I.ch('p') && G.mouseMode()) { G.settings.fp = !G.settings.fp; U.saveSettings(); U.toast(G.settings.fp ? 'Vue à la première personne' : 'Vue à la troisième personne'); } };
})();
