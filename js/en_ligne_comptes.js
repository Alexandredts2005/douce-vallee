'use strict';
// ===== Sessions en ligne : ta session (village, habitants, maisons, inventaires) est gardée sur le serveur et tu la retrouves sur
// n'importe quel PC — navigateur ou appli Windows — avec son code ami et son mot de passe.
// Sécurité : le mot de passe ne quitte jamais ton ordinateur. Le jeu en tire, par PBKDF2 (150 000 tours, sel propre au compte),
// une preuve (que le serveur re-hache avec scrypt, sel et poivre) et une clé de chiffrement qui ne part jamais : la sauvegarde
// arrive au serveur déjà chiffrée et authentifiée (ChaCha20 + HMAC). Même le serveur ne peut pas la lire. =====
(function () {
  const D = G.DVC, u8 = s => D.utf8(s), $ = G.el, S = () => G.sessions;
  const C = G.cloud = { tok: null, acct: null, enc: null, sid: null, pushing: false, dirty: false, lastPush: 0 };
  const ERR = { mdp: 'Mot de passe incorrect.', bloque: 'Trop d\'essais : cette session en ligne est bloquée un moment. Réessaie plus tard.', trop: 'Trop d\'essais depuis ta connexion : réessaie dans quelques minutes.',
    inconnu: 'Aucune session en ligne avec ce code.', occupe: 'Le serveur est très occupé : réessaie dans un instant.', jeton: 'Connexion expirée : reconnecte-toi.', plein: 'Le serveur est plein pour le moment.', format: 'Réponse inattendue du serveur.', serveur: 'Erreur du serveur.' };
  const ready = () => { const n = G.net; return !!(n && n.mode === 'server' && n.wsOk && n.wsReq); };
  async function waitReady(ms = 25000) { const t0 = Date.now(); while (!ready() && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 400)); return ready(); }
  const req = (m, ms) => G.net.wsReq(m, ms || 45000);
  // ---------- clés : l'identifiant du compte vient du code ami, la preuve et la clé de chiffrement du mot de passe ----------
  const acctOf = async code => D.hex(await D.pbkdf2Async(u8('dv-acct-v1:' + String(code).toUpperCase()), u8('douce-vallee'), 60000, 32));
  async function keysOf(pw, psHex) { const dk = await D.pbkdf2Async(u8(pw), D.cat(D.unhex(psHex), u8('dv-pass-v1')), 150000, 64); return { auth: D.hex(dk.subarray(0, 32)), enc: dk.slice(32, 64) }; }
  async function connect(code, pw, create) { if (!await waitReady()) return { err: 'horsligne' };
    const acct = await acctOf(code), sr = await req({ t: 'asalt', a: acct }); if (!sr || sr.err) return { err: (sr && sr.err) || 'horsligne' };
    if (sr.none && !create) return { err: 'inconnu' }; const ps = sr.none ? D.hex(D.rand(16)) : sr.ps, k = await keysOf(pw, ps);
    const r = await req({ t: 'alog', a: acct, k: k.auth, c: sr.none ? 1 : 0, ps }); if (!r || r.err) return { err: (r && r.err) || 'horsligne', s: r && r.s };
    return { acct, tok: r.tok, at: r.at || 0, enc: k.enc, nouveau: !!r.nouveau }; }
  // ---------- emballage : compressé puis chiffré et authentifié ----------
  const pipe = async (u, T) => { const s = new T('deflate'), w = s.writable.getWriter(); w.write(u); w.close(); return new Uint8Array(await new Response(s.readable).arrayBuffer()); };
  async function pack(enc, obj) { let u = u8(JSON.stringify(obj)), z = 0; if (typeof CompressionStream !== 'undefined') { try { const c = await pipe(u, CompressionStream); if (c.length < u.length) { u = c; z = 1; } } catch (e) { } }
    const s = D.seal(enc, u); return { v: 3, z, n: G.b64.enc(s.n), d: G.b64.enc(s.c), t: G.b64.enc(s.t) }; }
  async function unpack(enc, b) { let u = D.open(enc, G.b64.dec(b.n), G.b64.dec(b.d), G.b64.dec(b.t)); if (!u) throw new Error('illisible'); if (b.z) u = await pipe(u, DecompressionStream); return JSON.parse(new TextDecoder().decode(u)); }
  const cleanRec = rec => { const o = {}; for (const k of ['sid', 'code', 'village', 'mode', 'residents', 'closed', 'amis', 'at']) if (rec[k] !== undefined) o[k] = rec[k]; return o; };
  // ---------- après la connexion à une session (ou sa création) : on la met en ligne, ou on récupère la version plus récente ----------
  C.login = async (rec, pw, create) => { try { if (!rec || !rec.code || !pw) return; C.tok = null; C.sid = rec.sid;
      const r = await connect(rec.code, pw, create); if (r.err) { if (r.err === 'mdp') G.ui.toast('☁️ Ce code ami existe déjà en ligne avec un autre mot de passe : cette session reste sur ce PC.', 6000); return; }
      if (C.sid !== rec.sid) return; Object.assign(C, { tok: r.tok, acct: r.acct, enc: r.enc, code: rec.code });
      const local = S().get(rec.sid) || rec;
      if (r.at > (local.cloudAt || 0) + 2000) { // joué ailleurs depuis : on récupère
        const g = await req({ t: 'aget', tok: C.tok }); if (g && g.ok && g.b) { const pk = await unpack(C.enc, g.b); if (pk && pk.save) {
          if (G.state === 'play' && G.session && G.session.sid === rec.sid) { G.ui.toast('☁️ Une sauvegarde plus récente de ce village existe en ligne : reviens au titre et reconnecte-toi pour la récupérer.', 7000); return; }
          G.store.set('dv_s_' + rec.sid, pk.save); const nr = Object.assign(S().get(rec.sid) || rec, cleanRec(pk.rec || {}), { cloudAt: r.at }); S().put(nr); G.ui.toast('☁️ Sauvegarde en ligne récupérée (jouée sur un autre PC).', 4500); return; } } }
      if (r.nouveau || r.at < (local.at || 0)) C.dirty = true, push(); } catch (e) { console.warn('session en ligne', e); } };
  // envoi de la sauvegarde (après chaque sauvegarde du jeu, au plus toutes les 20 s)
  async function push(force) { if (!C.tok || !C.enc || C.pushing || !C.dirty) return; if (!force && Date.now() - C.lastPush < 20000) { setTimeout(() => push(), 20500 - (Date.now() - C.lastPush)); return; }
    const rec = C.sid && S().get(C.sid), save = rec && G.store.get('dv_s_' + C.sid); if (!rec || !save || !ready()) return; C.pushing = true; C.dirty = false;
    try { const at = Date.now(), b = await pack(C.enc, { rec: cleanRec(rec), save }); const r = await req({ t: 'asav', tok: C.tok, b, at }, 90000);
      if (r && r.ok) { C.lastPush = at; const nr = S().get(C.sid); if (nr) { nr.cloudAt = at; S().put(nr); } } else { C.dirty = true; if (r && r.err === 'jeton') C.tok = null; } }
    catch (e) { C.dirty = true; } finally { C.pushing = false; } }
  C.push = push;
  G.on('init', () => {
    const osv = G.saveGame; G.saveGame = (...a) => { const r = osv(...a); if (C.tok && G.session && G.session.sid === C.sid) { C.dirty = true; setTimeout(() => push(), 3000); } return r; };
    // nouveau code ami : le compte en ligne suit (le mot de passe ne change pas)
    const nc = G.net && G.net.newCode; if (nc) G.net.newCode = rec => { const old = rec.code, c = nc(rec); if (C.tok && C.sid === rec.sid && c !== old) acctOf(c).then(a2 => req({ t: 'aren', tok: C.tok, a2 })).then(r => { if (r && r.ok) C.code = c; }).catch(() => { }); return c; };
    buildUI(); });
  // supprimer une session : aussi en ligne (le mot de passe vient d'être vérifié)
  C.forget = async (rec, pw) => { try { const r = await connect(rec.code, pw, false); if (r.tok) await req({ t: 'adel', tok: r.tok }); if (C.sid === rec.sid) Object.assign(C, { tok: null, enc: null, sid: null }); } catch (e) { } };
  // ---------- écran « Retrouver une session en ligne » ----------
  function buildUI() { const host = $('screen-sessions'); if (!host || $('screen-cloud')) return; const mk = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
    host.parentNode.appendChild(mk(`<div id="screen-cloud" class="screen dim" hidden><div class="form" style="width:min(560px,100%)"><h2>☁️ Retrouver une session en ligne</h2>
      <p style="margin:0;color:var(--bark);font-weight:700">Entre le code ami du village et le mot de passe de la session : elle revient sur ce PC, avec ses habitants et toutes ses constructions.</p>
      <div class="row"><label>CODE AMI<input type="text" id="cl-code" maxlength="12" placeholder="DV-ABCD-1234" autocomplete="off" spellcheck="false"></label><label>MOT DE PASSE<input type="password" id="cl-pass" maxlength="64" autocomplete="current-password"></label></div>
      <p style="margin:0;color:var(--bark);font-size:13px;font-weight:700">🔒 Ton mot de passe ne quitte jamais cet ordinateur : il sert seulement à ouvrir ta sauvegarde, chiffrée.</p>
      <div id="cl-err" class="err"></div><div class="row" style="justify-content:flex-end"><button class="btn alt" id="cl-back">Retour</button><button class="btn" id="cl-go">Retrouver</button></div></div></div>`));
    const nb = $('ss-new'); if (nb) { const b = mk(`<button class="btn alt" id="ss-cloud">☁️ Retrouver une session en ligne</button>`); nb.parentNode.insertBefore(b, nb); b.onclick = () => { G.sfx('ui'); $('cl-code').value = ''; $('cl-pass').value = ''; $('cl-err').textContent = ''; G.ui.show('screen-cloud'); setTimeout(() => $('cl-code').focus(), 50); }; }
    const os = G.ui.show, oh = G.ui.hideScreens; G.ui.show = id => { os(id === 'screen-cloud' ? '__none' : id); $('screen-cloud').hidden = id !== 'screen-cloud'; }; G.ui.hideScreens = () => { oh(); $('screen-cloud').hidden = true; };
    $('cl-back').onclick = () => { G.sfx('ui'); G.sessionsUI ? G.sessionsUI.showSessions() : G.ui.show('screen-title'); };
    for (const id of ['cl-code', 'cl-pass']) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } e.stopPropagation(); });
    $('cl-go').onclick = go;
    async function go() { const code = $('cl-code').value.trim().toUpperCase().replace(/\s/g, ''), pw = $('cl-pass').value, err = $('cl-err'), btn = $('cl-go');
      if (!/^DV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { err.textContent = 'Un code ami ressemble à DV-ABCD-1234.'; G.sfx('error'); return; } if (!pw) { err.textContent = 'Entre le mot de passe.'; G.sfx('error'); return; }
      btn.disabled = true; err.textContent = '⏳ Connexion sécurisée…';
      try { const r = await connect(code, pw, false); if (r.err) { err.textContent = r.err === 'horsligne' ? 'Pas de connexion au serveur Douce Vallée pour le moment.' : (ERR[r.err] || 'Connexion impossible.') + (r.s ? ' (encore ' + Math.ceil(r.s / 60) + ' min)' : ''); G.sfx('error'); return; }
        const g = await req({ t: 'aget', tok: r.tok }, 90000); if (!g || !g.ok || !g.b) { err.textContent = 'Cette session en ligne est vide.'; G.sfx('error'); return; }
        const pk = await unpack(r.enc, g.b); if (!pk || !pk.save || !pk.rec || !pk.rec.sid) throw new Error('illisible');
        const sid = pk.rec.sid, salt = D.hex(D.rand(8)), old = S().get(sid), rec = Object.assign({}, old || {}, cleanRec(pk.rec), { salt, hash: S().hashPass(pw, salt), kdf: 2, cloudAt: r.at, code }); // le mot de passe protège aussi la copie locale
        G.store.set('dv_s_' + sid, pk.save); S().put(rec); Object.assign(C, { tok: r.tok, acct: r.acct, enc: r.enc, sid, code });
        err.textContent = ''; G.sfx('fanfare'); G.ui.toast('☁️ « ' + (rec.village || 'Ton village') + ' » est revenu sur ce PC !', 4500); if (G.sessionsUI) G.sessionsUI.showSessions(); }
      catch (e) { err.textContent = 'Impossible d\'ouvrir cette sauvegarde (mot de passe ou données invalides).'; G.sfx('error'); }
      finally { btn.disabled = false; } } }
})();
