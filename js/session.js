'use strict';
// ===== Sessions : connexion avec mot de passe, code ami, jusqu'à 4 habitants par village (chacun sa maison), garçon ou fille =====
(function () {
  const $ = G.el, TAU = Math.PI * 2;
  // ---------- SHA-256 (fonctionne partout, même en fichier local) ----------
  function sha256(str) {
    const ascii = unescape(encodeURIComponent(str)), rr = (v, a) => (v >>> a) | (v << (32 - a)), mw = 4294967296; let msg = ascii + '\x80';
    const H = [], K = [], comp = {}; let pc = 0; for (let c = 2; pc < 64; c++) { if (!comp[c]) { for (let i = 0; i < 313; i += c) comp[i] = c; H[pc] = (Math.pow(c, .5) * mw) | 0; K[pc++] = (Math.pow(c, 1 / 3) * mw) | 0; } }
    let hash = H.slice(0, 8); const words = [], bl = ascii.length * 8; while (msg.length % 64 - 56) msg += '\x00';
    for (let i = 0; i < msg.length; i++) words[i >> 2] |= msg.charCodeAt(i) << ((3 - i) % 4) * 8;
    words[words.length] = (bl / mw) | 0; words[words.length] = bl;
    for (let j = 0; j < words.length;) { const w = words.slice(j, j += 16), old = hash; hash = hash.slice(0, 8);
      for (let i = 0; i < 64; i++) { const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + K[i] + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0; }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0; }
    let out = ''; for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; out += (b < 16 ? '0' : '') + b.toString(16); } return out;
  }
  G.sha256 = sha256;
  const hashPass = (pw, salt) => { let h = salt + ':' + pw; for (let i = 0; i < 400; i++) h = sha256(h + salt); return h; };
  const rnd = n => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = new Uint32Array(n); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : r.forEach((_, i) => r[i] = Math.random() * 4e9); for (let i = 0; i < n; i++) s += A[r[i] % A.length]; return s; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // ---------- registre des sessions (navigateur) ----------
  const REG = 'dv_sessions';
  const S = G.sessions = {
    list() { return (G.store.get(REG, { list: [] }).list || []).filter(x => x && x.sid); },
    save(list) { G.store.set(REG, { v: 1, list }); },
    get(sid) { return S.list().find(x => x.sid === sid) || null; },
    put(rec) { const l = S.list(), i = l.findIndex(x => x.sid === rec.sid); if (i >= 0) l[i] = rec; else l.push(rec); S.save(l); },
    del(sid) { S.save(S.list().filter(x => x.sid !== sid)); G.store.del('dv_s_' + sid); },
    newCode: () => 'DV-' + rnd(4) + '-' + rnd(4),
    check(rec, pw) { return !rec.hash || hashPass(pw, rec.salt) === rec.hash; }
  };
  G.homeId = () => (G.session && G.session.home) || 'home';
  // une ancienne partie devient une session (sans mot de passe tant qu'on n'en choisit pas)
  function migrate() { if (S.list().length) return; const d = G.store.get('dv_save'); if (!d || !d.world) return; const sid = 'S' + rnd(8);
    G.store.set('dv_s_' + sid, d); S.put({ sid, code: S.newCode(), village: d.village || 'Douce Vallée', salt: rnd(12), hash: null, mode: d.mode, residents: [{ name: d.name || 'Pomme', gender: (d.look && d.look.gender) || 'f', look: d.look, home: 'home' }], at: Date.now() }); }
  // ---------- habitants ----------
  const FIELDS = ['name', 'look', 'coins', 'sel', 'player', 'inv', 'hot', 'storage', 'flags', 'best'];
  const START = { survie: [['hache', 1], ['pelle', 1], ['filet', 1], ['canne', 1], ['epee', 1], ['pomme', 4]], creatif: ['hache', 'pelle', 'canne', 'filet', 'chene', 'lampadaire', 'banc', 'maison', 'sol_paves', 't_monter'] };
  const newResident = (d, info, k) => { const surv = d.mode === 'survie', inv = new Array(30).fill(null), hot = new Array(10).fill(null);
    if (surv) START.survie.forEach(([id, n], i) => inv[i] = { id, n }); else START.creatif.forEach((id, i) => hot[i] = id);
    return { name: info.name, gender: info.gender, look: info.look, home: k ? 'home' + (k + 1) : 'home', coins: surv ? 300 : 5000, sel: 0, inv, hot, storage: new Array(120).fill(null), flags: {}, best: {}, player: null }; };
  const genderLook = (look, g) => { const d = G.defaultLook(), same = JSON.stringify(Object.assign({}, look, { gender: undefined })) === JSON.stringify(Object.assign({}, d, { gender: undefined }));
    const l = Object.assign({}, look, { gender: g }); if (same) Object.assign(l, g === 'f' ? { hair: 'couettes', hairCol: 0xa8693a, top: 'robe', topCol: 0xff8fc0, bottom: 'jupe', hat: 'noeud', hatCol: 0xe8434a, lashes: true } : { hair: 'herisse', hairCol: 0x6b3f22, top: 'tshirt', topCol: 0x5b8fd6, bottom: 'short', hat: 'casquette', hatCol: 0xe8434a, lashes: false }); else if (l.lashes === undefined) l.lashes = g === 'f'; return l; };
  G.genderLook = genderLook;
  // une maison pour chaque nouvel habitant, près de la première
  function placeHome(iid, k) {
    const m = G.world, have = [...m.list].find(o => o.iid === iid); if (have) return { x: have.x + 1.5, z: have.z + 3.6 };
    const h0 = [...m.list].find(o => o.iid === 'home'), c = h0 ? { x: h0.x, z: h0.z } : { x: Math.floor(m.meta.spawn.x), z: Math.floor(m.meta.spawn.z) };
    const small = o => { const d = G.OBJ[o.t]; return d.pick || (!d.h && !d.enter) || o.t.startsWith('tulipe') || o.t.startsWith('fleur') || o.t === 'mauvaise_herbe' || o.t === 'rocher'; };
    const ok = (x, z) => { const L = m.inb(x, z) ? m.lvl[m.idx(x, z)] : -1; if (L < 0) return false;
      for (let zz = z - 1; zz <= z + 4; zz++) for (let xx = x - 1; xx <= x + 3; xx++) { if (!m.inb(xx, zz) || xx < 3 || zz < 3 || xx > m.W - 4) return false; const i = m.idx(xx, zz); if (m.water[i] || m.ramp[i] || m.lvl[i] !== L || (zz < z + 3 && G.SURF[m.surf[i]].path)) return false; const o = m.objAt(xx, zz); if (o && !small(o)) return false; }
      return true; };
    for (let r = 4; r < 44; r += 1) for (let a = 0; a < 28; a++) { const ang = a / 28 * TAU + k * 1.7, x = Math.round(c.x + Math.cos(ang) * r), z = Math.round(c.z + Math.sin(ang) * r * .8);
      if (!ok(x, z)) continue;
      for (let zz = z - 1; zz <= z + 4; zz++) for (let xx = x - 1; xx <= x + 3; xx++) { const o = m.objAt(xx, zz); if (o) m.removeObj(o); }
      m.addObj('maison', x, z, 0, { iid, v: (k + 1) % 4 }); if (m.canPlace('boite_lettres', x + 3, z + 2)) m.addObj('boite_lettres', x + 3, z + 2);
      for (let xx = x; xx < x + 3; xx++) { const i = m.idx(xx, z + 3); if (!G.SURF[m.surf[i]].path) { m.surf[i] = 3; m.markDirty(xx, z + 3); } }
      (m.meta.homesP = m.meta.homesP || {})[iid] = { x: x + 1.5, z: z + 3.6 }; return m.meta.homesP[iid]; }
    return null;
  }
  // ---------- sauvegarde : un habitant actif, les autres gardés dans la partie ----------
  G.on('init', () => {
    const os = G.serialize; G.serialize = () => { const out = os(), s = G.session; if (!s) return out;
      const res = (s.residents = s.residents || []), r = res[s.rid] = Object.assign(res[s.rid] || {}, { gender: s.gender, home: s.home }); for (const k of FIELDS) r[k] = out[k];
      out.residents = res.map(x => x ? JSON.parse(JSON.stringify(x)) : null); out.rid = s.rid; out.session = { sid: s.sid, code: s.code }; return out; };
    const or = G.restore; G.restore = d => { const s = G.session; let fresh = null;
      if (s) { if (!Array.isArray(d.residents) || !d.residents.length) d.residents = [Object.assign({ gender: (d.look && d.look.gender) || 'f', home: 'home' }, ...FIELDS.map(k => ({ [k]: d[k] })))];
        let r = d.residents[s.rid]; if (!r) { r = d.residents[s.rid] = newResident(d, s.pending || { name: 'Habitant', gender: 'f', look: G.defaultLook() }, s.rid); fresh = r; }
        for (const k of FIELDS) if (r[k] !== undefined && r[k] !== null) d[k] = r[k]; if (!r.player) d.player = { x: 0, z: 0, yaw: 0, hp: 10, food: 10, map: 'world' };
        d.flags = r.flags || {}; d.best = r.best || {}; d.storage = r.storage || new Array(120).fill(null); s.home = r.home || 'home'; s.gender = r.gender || 'f'; s.residents = d.residents; s.pending = null; }
      const res = or(d);
      if (s) { const at = placeHome(s.home, s.rid); if (fresh && at) { G.enterMap(G.world, at.x, at.z, 0); setTimeout(() => G.ui.toast('Bienvenue chez toi, ' + G.playerName + ' ! 🏠 Ta maison t\'attend.'), 900); G.saveGame(true); } syncRecord(); }
      return res; };
    const ost = G.startNew; G.startNew = o => {
      if (!S.creating) return ost(o);
      const pw = $('ng-pass').value, pw2 = $('ng-pass2').value, err = $('ng-err');
      if (pw.length < 3) { err.textContent = 'Choisis un mot de passe d\'au moins 3 caractères.'; G.sfx('error'); return; }
      if (pw !== pw2) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; G.sfx('error'); return; }
      err.textContent = ''; const g = S.gender || 'f', sid = 'S' + rnd(8), salt = rnd(12), rec = { sid, code: S.newCode(), village: o.village, salt, hash: hashPass(pw, salt), mode: o.mode, residents: [], at: Date.now() };
      o.look = genderLook(o.look, g); rec.residents.push({ name: o.name, gender: g, look: o.look, home: 'home' }); S.put(rec); S.creating = false;
      G.saveKey = 'dv_s_' + sid; G.session = { sid, code: rec.code, village: rec.village, rid: 0, home: 'home', gender: g, residents: [] };
      return ost(o);
    };
    const ott = G.toTitle; G.toTitle = () => { ott(); refreshTitle(); };
  });
  G.on('newGame', () => { const s = G.session; if (s) { s.residents = [{ name: G.playerName, gender: s.gender, look: G.player.look, home: 'home' }]; syncRecord(); } });
  // garde le registre (noms, apparences) à jour pour l'écran de connexion
  function syncRecord() { const s = G.session; if (!s) return; const rec = S.get(s.sid); if (!rec) return; rec.village = G.villageName; rec.mode = G.mode; rec.at = Date.now();
    rec.residents = (s.residents || []).map((r, i) => r && { name: i === s.rid ? G.playerName : r.name, gender: i === s.rid ? s.gender : r.gender, look: i === s.rid ? G.player.look : r.look, home: r.home || (i ? 'home' + (i + 1) : 'home') }); S.put(rec); }
  G.on('save', () => syncRecord());
  // ---------- portraits des habitants ----------
  const portraits = {}; let pScene, pCam, pRT, pBuf, pCv;
  function portrait(look) {
    const key = JSON.stringify(look || {}); if (portraits[key]) return portraits[key]; const R = G.renderer; if (!R) return '';
    if (!pScene) { pScene = new THREE.Scene(); pScene.add(new THREE.HemisphereLight(0xfff5e6, 0xd9c9a8, 1.0)); const d = new THREE.DirectionalLight(0xffeedd, 1.2); d.position.set(2, 3, 4); pScene.add(d); pCam = new THREE.PerspectiveCamera(26, 1, .05, 50); pRT = new THREE.WebGLRenderTarget(128, 128); pBuf = new Uint8Array(128 * 128 * 4); pCv = G.cv(128, 128); }
    try { const C = G.makeChar({ look: G.normLook(look) }); pScene.add(C.root); C.root.rotation.y = -.35; pCam.position.set(0, 1.0, 2.7); pCam.lookAt(0, .82, 0);
      const cu = G.U.curve.value; G.U.curve.value = 0; R.setRenderTarget(pRT); R.setClearColor(0x000000, 0); R.clear(); R.render(pScene, pCam); R.readRenderTargetPixels(pRT, 0, 0, 128, 128, pBuf); R.setRenderTarget(null); G.U.curve.value = cu; pScene.remove(C.root);
      const x = pCv.getContext('2d'), im = x.createImageData(128, 128); for (let y = 0; y < 128; y++) im.data.set(pBuf.subarray((127 - y) * 512, (128 - y) * 512), y * 512); x.putImageData(im, 0, 0); return portraits[key] = pCv.toDataURL(); } catch (e) { return ''; }
  }
  G.portrait = portrait;
  // ---------- écrans ----------
  const css = document.createElement('style'); css.textContent = `
  .form input[type=password]{border:none;border-radius:14px;padding:10px 14px;font-family:var(--f-body);font-size:16px;font-weight:700;background:#fff;color:var(--ink);box-shadow:inset 0 2px 0 rgba(0,0,0,.06)}
  .ss-list{display:flex;flex-direction:column;gap:10px;max-height:min(52vh,440px);overflow:auto;padding:4px}
  .ss-card{display:flex;align-items:center;gap:12px;background:#fff;border-radius:20px;padding:10px 14px;box-shadow:0 4px 0 var(--paper-d);border:none;text-align:left;font-family:var(--f-body);color:var(--ink);cursor:pointer}
  .ss-card:hover{background:#f6ffef} .ss-card b{font-family:var(--f-display);font-size:20px;font-weight:600;color:var(--bark)} .ss-card small{display:block;color:var(--bark);font-size:13px}
  .ss-card .faces{display:flex;margin-left:auto} .ss-card .faces img{width:44px;height:44px;margin-left:-10px;border-radius:50%;background:#fff7df;box-shadow:0 0 0 3px #fff}
  .ss-empty{color:var(--bark);text-align:center;padding:18px;font-weight:700}
  .rs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} @media (max-width:640px){.rs-grid{grid-template-columns:repeat(2,1fr)}}
  .rs-slot{border:none;background:#fff;border-radius:22px;padding:10px 6px 12px;box-shadow:0 4px 0 var(--paper-d);display:flex;flex-direction:column;align-items:center;gap:4px;font-family:var(--f-body);color:var(--ink);cursor:pointer;min-height:170px}
  .rs-slot:hover{background:#f6ffef;transform:translateY(-2px)} .rs-slot img{width:104px;height:104px} .rs-slot b{font-family:var(--f-display);font-size:18px;font-weight:600;color:var(--bark)} .rs-slot small{font-size:12px;color:var(--bark)}
  .rs-slot.new{background:#f6ecd0;justify-content:center;font-family:var(--f-display);font-size:18px;color:var(--bark)} .rs-slot.new span{font-size:40px}
  .code-chip{display:inline-block;background:#fff;border-radius:12px;padding:4px 10px;font-family:var(--f-display);letter-spacing:1px;color:var(--leaf-d);box-shadow:0 3px 0 var(--paper-d)}
  .err{color:#c0392b;font-weight:800;min-height:18px;font-size:14px} .gsel{display:flex;gap:8px} .gsel button{flex:1}
  .rs-prev{display:flex;justify-content:center} .rs-prev img{width:150px;height:150px;background:#fff;border-radius:24px;box-shadow:0 4px 0 var(--paper-d)}`;
  document.head.appendChild(css);
  const mk = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  const host = $('screen-new').parentNode;
  host.appendChild(mk(`<div id="screen-sessions" class="screen dim" hidden><div class="form"><h2>🌿 Choisis ta session</h2><p style="margin:0;color:var(--bark);font-weight:700">Chaque session est un village protégé par un mot de passe, avec jusqu'à 4 habitants.</p><div id="ss-list" class="ss-list"></div>
    <div class="row" style="justify-content:space-between"><button class="btn alt" id="ss-back">Retour</button><button class="btn" id="ss-new">＋ Nouvelle session</button></div></div></div>`));
  host.appendChild(mk(`<div id="screen-login" class="screen dim" hidden><div class="form" style="width:min(460px,100%)"><h2 id="lg-title">Connexion</h2><p id="lg-sub" style="margin:0;color:var(--bark);font-weight:700"></p>
    <label class="fld">MOT DE PASSE<input type="password" id="lg-pass" maxlength="40" autocomplete="current-password"></label><label class="fld" id="lg-new-wrap" hidden>CONFIRME LE NOUVEAU MOT DE PASSE<input type="password" id="lg-pass2" maxlength="40" autocomplete="new-password"></label><div id="lg-err" class="err"></div>
    <div class="row" style="justify-content:flex-end"><button class="btn alt" id="lg-back">Retour</button><button class="btn" id="lg-go">Se connecter</button></div></div></div>`));
  host.appendChild(mk(`<div id="screen-residents" class="screen dim" hidden><div class="form" style="width:min(760px,100%)"><h2 id="rs-title">Qui joue ?</h2><p style="margin:0;color:var(--bark);font-weight:700">Code ami du village : <span class="code-chip" id="rs-code"></span> <button class="btn alt" id="rs-copy" style="padding:4px 10px;font-size:13px">Copier</button></p>
    <div id="rs-list" class="rs-grid"></div><div class="row" style="justify-content:space-between"><button class="btn alt" id="rs-back">Changer de session</button><button class="btn warn" id="rs-del">Supprimer cette session</button></div></div></div>`));
  host.appendChild(mk(`<div id="screen-resnew" class="screen dim" hidden><div class="form" style="width:min(560px,100%)"><h2>🏡 Nouvel habitant</h2>
    <div class="row"><label>TON NOM<input type="text" id="rn-name" maxlength="14" value=""></label><div class="fld">TU ES<div class="gsel"><button class="tab on" id="rn-f" type="button">👧 Une fille</button><button class="tab" id="rn-g" type="button">👦 Un garçon</button></div></div></div>
    <div class="rs-prev"><img id="rn-prev" alt="Aperçu du personnage"></div><button class="btn alt" id="rn-custom" type="button">🎨 Personnaliser de A à Z</button><div id="rn-err" class="err"></div>
    <div class="row" style="justify-content:flex-end"><button class="btn alt" id="rn-back">Retour</button><button class="btn" id="rn-go">Emménager !</button></div></div></div>`));
  // champs ajoutés au formulaire de nouvelle partie
  const ngForm = $('screen-new').querySelector('.form'), goRow = $('ng-go').parentNode;
  ngForm.insertBefore(mk(`<div class="row" id="ng-sess"><label>MOT DE PASSE DE LA SESSION<input type="password" id="ng-pass" maxlength="40" autocomplete="new-password"></label><label>CONFIRME LE MOT DE PASSE<input type="password" id="ng-pass2" maxlength="40" autocomplete="new-password"></label></div>`), goRow);
  ngForm.insertBefore(mk(`<div class="row" id="ng-gender-row"><div class="fld">TU ES<div class="gsel"><button class="tab on" id="ng-f" type="button">👧 Une fille</button><button class="tab" id="ng-g" type="button">👦 Un garçon</button></div></div><div id="ng-err" class="err" style="flex:1;align-self:end"></div></div>`), goRow);
  const setG = (g, a, b) => { S.gender = g; $(a).classList.toggle('on', g === 'f'); $(b).classList.toggle('on', g === 'g'); };
  $('ng-f').onclick = () => { setG('f', 'ng-f', 'ng-g'); G.sfx('ui'); }; $('ng-g').onclick = () => { setG('g', 'ng-f', 'ng-g'); G.sfx('ui'); };
  // écran titre : « Jouer » remplace « Nouvelle partie / Continuer »
  const tb = $('btn-new').parentNode, play = mk(`<button class="mbtn main" id="btn-play"><span class="e">🌿</span>Jouer</button>`), cont = mk(`<button class="mbtn main" id="btn-cont2" hidden><span class="e">▶️</span><span id="btn-cont2-t">Continuer</span></button>`);
  tb.insertBefore(cont, $('btn-continue')); tb.insertBefore(play, $('btn-continue')); $('btn-new').style.setProperty('display', 'none', 'important'); $('btn-continue').style.setProperty('display', 'none', 'important');
  const SCR = ['screen-sessions', 'screen-login', 'screen-residents', 'screen-resnew'];
  const oshow = G.ui.show, ohide = G.ui.hideScreens;
  G.ui.show = id => { oshow(SCR.includes(id) ? '__none' : id); SCR.forEach(s => $(s).hidden = s !== id); }; G.ui.hideScreens = () => { ohide(); SCR.forEach(s => $(s).hidden = true); };
  const UI = { rec: null, newLook: null, newG: 'f' };
  function refreshTitle() { const s = G.session, rec = s && S.get(s.sid); cont.hidden = !rec; if (rec) $('btn-cont2-t').textContent = 'Continuer · ' + rec.village; }
  function showSessions() {
    migrate(); const l = S.list().sort((a, b) => (b.at || 0) - (a.at || 0)), box = $('ss-list'); box.innerHTML = '';
    if (!l.length) box.innerHTML = '<div class="ss-empty">Aucune session pour l\'instant. Crée ton premier village !</div>';
    for (const rec of l) { const b = document.createElement('button'); b.className = 'ss-card';
      b.innerHTML = `<div><b>${esc(rec.village)}</b><small>${(rec.residents || []).filter(Boolean).map(r => esc(r.name)).join(' · ') || 'Aucun habitant'} — ${rec.mode === 'survie' ? 'Survie' : 'Créatif'}${rec.hash ? ' · 🔒' : ''}</small><small>Code ami : ${esc(rec.code)}</small></div><div class="faces">${(rec.residents || []).filter(Boolean).map(r => `<img src="${portrait(r.look)}" alt="">`).join('')}</div>`;
      b.onclick = () => { G.sfx('ui'); UI.rec = rec; showLogin(); }; box.appendChild(b); }
    G.ui.show('screen-sessions');
  }
  function showLogin() { const rec = UI.rec; $('lg-title').textContent = '🔒 ' + rec.village; $('lg-pass').value = ''; $('lg-pass2').value = ''; $('lg-err').textContent = '';
    const noPw = !rec.hash; $('lg-new-wrap').hidden = !noPw; $('lg-sub').textContent = noPw ? 'Cette ancienne partie n\'a pas encore de mot de passe : choisis-en un pour la protéger.' : 'Entre le mot de passe de la session.'; $('lg-go').textContent = noPw ? 'Protéger et entrer' : 'Se connecter';
    G.ui.show('screen-login'); setTimeout(() => $('lg-pass').focus(), 50); }
  function doLogin() { const rec = UI.rec, pw = $('lg-pass').value;
    if (!rec.hash) { if (pw.length < 3) return fail('lg-err', 'Au moins 3 caractères, s\'il te plaît.'); if (pw !== $('lg-pass2').value) return fail('lg-err', 'Les deux mots de passe ne sont pas identiques.'); rec.salt = rnd(12); rec.hash = hashPass(pw, rec.salt); S.put(rec); }
    else if (!S.check(rec, pw)) { $('lg-pass').value = ''; return fail('lg-err', 'Mot de passe incorrect.'); }
    G.sfx('craft'); UI.logged = rec.sid; showResidents(); }
  const fail = (id, msg) => { $(id).textContent = msg; G.sfx('error'); };
  function showResidents() { const rec = UI.rec = S.get(UI.rec.sid) || UI.rec; $('rs-title').textContent = 'Qui joue à ' + rec.village + ' ?'; $('rs-code').textContent = rec.code; const box = $('rs-list'); box.innerHTML = '';
    for (let k = 0; k < 4; k++) { const r = (rec.residents || [])[k], b = document.createElement('button');
      if (r) { b.className = 'rs-slot'; b.innerHTML = `<img src="${portrait(r.look)}" alt=""><b>${esc(r.name)}</b><small>${r.gender === 'g' ? '👦 Habitant' : '👧 Habitante'}</small>`; b.onclick = () => enter(rec, k); }
      else { b.className = 'rs-slot new'; b.innerHTML = '<span>＋</span>Nouvel habitant'; b.onclick = () => showNewResident(k); }
      box.appendChild(b); }
    G.ui.show('screen-residents'); }
  function enter(rec, k, pending) { G.sfx('craft'); const r = (rec.residents || [])[k];
    G.saveKey = 'dv_s_' + rec.sid; G.session = { sid: rec.sid, code: rec.code, village: rec.village, rid: k, home: (r && r.home) || (k ? 'home' + (k + 1) : 'home'), gender: (r && r.gender) || (pending && pending.gender) || 'f', pending: pending || null };
    if (!G.store.get(G.saveKey)) { G.ui.toast('Sauvegarde introuvable pour cette session.'); return; } G.loadGame(); }
  function showNewResident(k) { UI.slot = k; UI.newG = 'f'; UI.newLook = genderLook(G.defaultLook(), 'f'); $('rn-name').value = ''; $('rn-err').textContent = ''; setG2('f'); G.ui.show('screen-resnew'); setTimeout(() => $('rn-name').focus(), 50); }
  const setG2 = g => { UI.newG = g; $('rn-f').classList.toggle('on', g === 'f'); $('rn-g').classList.toggle('on', g === 'g'); UI.newLook = genderLook(Object.assign({}, UI.newLook, { gender: g, lashes: undefined }), g); $('rn-prev').src = portrait(UI.newLook); };
  $('rn-f').onclick = () => { setG2('f'); G.sfx('ui'); }; $('rn-g').onclick = () => { setG2('g'); G.sfx('ui'); };
  $('rn-custom').onclick = () => G.ui.openWardrobe({ look: Object.assign({}, UI.newLook, { gender: UI.newG }), title: 'Crée ton habitant', okLabel: 'Valider', onDone: l => { UI.newLook = l; UI.newG = l.gender === 'g' ? 'g' : 'f'; $('rn-f').classList.toggle('on', UI.newG === 'f'); $('rn-g').classList.toggle('on', UI.newG === 'g'); $('rn-prev').src = portrait(UI.newLook); } });
  $('rn-go').onclick = () => { const name = $('rn-name').value.trim(); if (!name) return fail('rn-err', 'Choisis un nom pour ton habitant.'); const rec = UI.rec;
    if ((rec.residents || []).some(r => r && r.name.toLowerCase() === name.toLowerCase())) return fail('rn-err', 'Un habitant porte déjà ce nom.');
    rec.residents = rec.residents || []; rec.residents[UI.slot] = { name, gender: UI.newG, look: UI.newLook, home: UI.slot ? 'home' + (UI.slot + 1) : 'home' }; S.put(rec); enter(rec, UI.slot, { name, gender: UI.newG, look: UI.newLook }); };
  $('rn-back').onclick = () => showResidents();
  play.onclick = () => { G.sfx('ui'); showSessions(); };
  cont.onclick = () => { const s = G.session, rec = s && S.get(s.sid); if (!rec) return showSessions(); G.sfx('ui'); UI.rec = rec; showResidents(); };
  $('ss-back').onclick = () => G.ui.show('screen-title');
  $('ss-new').onclick = () => { S.creating = true; setG('f', 'ng-f', 'ng-g'); $('ng-pass').value = ''; $('ng-pass2').value = ''; $('ng-err').textContent = ''; $('screen-new').querySelector('h2').textContent = 'Nouvelle session'; $('btn-new').click(); };
  $('ng-back').addEventListener('click', () => { S.creating = false; });
  $('lg-back').onclick = () => showSessions(); $('lg-go').onclick = doLogin;
  for (const id of ['lg-pass', 'lg-pass2']) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } e.stopPropagation(); });
  for (const id of ['rn-name', 'ng-pass', 'ng-pass2']) $(id).addEventListener('keydown', e => e.stopPropagation());
  $('rs-back').onclick = () => showSessions();
  $('rs-copy').onclick = () => { const t = $('rs-code').textContent; try { navigator.clipboard.writeText(t); G.ui.toast('Code ami copié : ' + t); } catch (e) { G.ui.toast(t); } };
  $('rs-del').onclick = async () => { const rec = UI.rec; const k = await G.ui.confirm('Supprimer « ' + rec.village + ' » ?', 'Le village et ses habitants seront effacés de ce navigateur. C\'est définitif !', [{ t: 'Supprimer', warn: 1 }, { t: 'Annuler', alt: 1 }]); if (k !== 0) return; S.del(rec.sid); if (G.session && G.session.sid === rec.sid) { G.session = null; G.saveKey = null; } refreshTitle(); showSessions(); };
  // ---------- menu pause : code ami et changement d'habitant ----------
  const pm = $('p-resume').parentNode, chip = mk(`<p id="p-code" style="margin:0;text-align:center;color:#fff;font-weight:800;text-shadow:0 2px 0 rgba(0,0,0,.25)"></p>`), sw = mk(`<button class="mbtn" id="p-switch"><span class="e">👥</span>Changer d'habitant</button>`);
  pm.insertBefore(chip, $('p-resume')); pm.insertBefore(sw, $('p-quit'));
  sw.onclick = () => { if (!G.session) return; G.saveGame(true); const rec = S.get(G.session.sid); G.toTitle(); if (rec) { UI.rec = rec; showResidents(); } };
  const opause = G.ui.pause; G.ui.pause = () => { opause(); const s = G.session; chip.textContent = s ? (G.villageName + ' · ' + G.playerName + ' · Code ami ' + s.code) : ''; sw.hidden = !s; };
  G.on('init', () => { migrate(); refreshTitle(); });
})();
