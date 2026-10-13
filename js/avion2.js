'use strict';
// ===== L'avion, en grand : un biplan d'école détaillé (moteur en étoile, mâts et haubans, gouvernes qui bougent,
// roues qui tournent, feux de position), un vrai pilotage (gaz, roulis, tangage, décrochage, roulage, décollage et
// atterrissage sur les roues), caméra de poursuite / cockpit / vue d'ensemble, tableau de bord, bruit du moteur,
// fumée de voltige. Remplace le petit avion « jouet » de mobilier.js (même objet, mêmes sauvegardes). =====
(function () {
  const MD = G.MODELS, F = G.feat, TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3, UP = new V3(0, 1, 0);
  const RED = 0xc8372d, CRM = 0xf3e7c9, ALU = 0xc9ced6, NAVY = 0x2b3442, TIRE = 0x1d1f22, WOOD = 0x8a5a34, GLASS = 0xcfe8f5, DARK = 0x2a2d33, RIB = 0xe4d6b2;
  const AXY = .22, AXZ = .78, TG = .22, UY = 1.62; // essieu (hauteur, position) ; assiette au sol (cabré) ; aile haute
  const SC = .85; // l'avion, un peu plus petit qu'avant (garé comme en vol)
  const groundOff = th => AXY * Math.cos(th) + AXZ * Math.sin(th) - AXY; // de combien l'essieu remonte quand l'avion se cabre
  const seg = (b, a, c, r, col, n = 6, mat = 0) => { const d = new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), L = d.length(); if (L < 1e-4) return; const g = new THREE.CylinderGeometry(r, r, L, n, 1, false); g.translate(0, L / 2, 0);
    b.add(g, col, new THREE.Matrix4().compose(new V3(a[0], a[1], a[2]), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1)), mat, true); };
  // fuselage : sections [z, largeur, hauteur, centre, arrondi] reliées en un tube lisse, peint sommet par sommet
  function loft(b, secs, n, paint) {
    const ring = ([z, w, h, cy, e]) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a); out.push([Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * w / 2, cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * h / 2, z]); } return out; };
    const R = secs.map(ring), P = [], idx = []; for (const r of R) for (const p of r) P.push(p);
    for (let k = 0; k + 1 < R.length; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = k * n + i, b2 = k * n + j, c = (k + 1) * n + j, d = (k + 1) * n + i; idx.push(a, b2, c, a, c, d); }
    const cap = (k, front) => { const ci = P.length; P.push([0, secs[k][3], secs[k][0]]); for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (front) idx.push(ci, k * n + i, k * n + j); else idx.push(ci, k * n + j, k * n + i); } };
    cap(0, false); cap(R.length - 1, true);
    const g = new THREE.BufferGeometry(), pos = new Float32Array(P.length * 3), col = new Float32Array(P.length * 3), C = new THREE.Color();
    P.forEach((p, i) => { pos.set(p, i * 3); paint(C, p[0], p[1], p[2]); col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); b.parts[0].push(g.toNonIndexed());
  }
  const fusPaint = (C, x, y, z) => { if (z > 1.04) C.set(ALU); else if (z > .62 && y > 1.24) C.set(DARK); else C.set(y > .93 ? RED : CRM); };
  // pièces mobiles (à part pour le vol, intégrées pour l'avion garé)
  const aileron = (b, x, y, z) => { b.box(.9, .04, .2, CRM, x, y, z - .1); b.box(.9, .045, .03, RED, x, y, z - .19); };
  const elevator = (b, x, y, z) => { b.box(1.24, .035, .2, CRM, x, y, z - .1); for (const s of [-1, 1]) b.box(.12, .04, .2, RED, x + s * .56, y, z - .1); };
  const rudder = (b, x, z) => { const c = [0x2f4f9a, 0xf7f5ee, 0xd8343a]; for (let i = 0; i < 3; i++) b.box(.04, .58, .075, c[i], x, 1.25, z - .04 - i * .075); b.sph(.12, c[2], x, 1.52, z - .13, .32, .45, .95, 0, 12, 8); };
  const wheel = (b, x, y, z) => { b.tor(.16, .06, TIRE, x, y, z, 0, PI / 2, 0, 0, 24); b.cyl(.11, .11, .09, 16, RED, x, y, z, 0, 0, PI / 2); b.cyl(.04, .04, .11, 10, ALU, x, y, z, 0, 0, PI / 2); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; b.box(.012, .02, .02, ALU, x + Math.sign(x || 1) * .05, y + Math.cos(a) * .07, z + Math.sin(a) * .07); } };
  const prop = (b, x, y, z) => { b.sph(.11, RED, x, y, z + .06, 1, 1, 1.55, 0, 14, 10); b.cyl(.12, .12, .05, 16, ALU, x, y, z - .03, PI / 2);
    for (const s of [-1, 1]) { b.box(.11, .74, .03, WOOD, x, y + s * .42, z, 0, s * .28, 0); b.box(.1, .09, .032, 0xffd23f, x, y + s * .77, z, 0, s * .28, 0); } };
  function airframe(b, full) {
    loft(b, [[-1.9, .05, .1, 1.0, 2], [-1.65, .16, .26, .99, 2.2], [-1.2, .32, .46, .97, 2.5], [-.6, .5, .64, .96, 2.8], [-.1, .62, .74, .95, 3], [.45, .68, .78, .95, 3], [1.03, .7, .78, .95, 3], [1.05, .7, .78, .95, 3], [1.2, .68, .74, .95, 2.6], [1.3, .6, .64, .95, 2.2]], 28, fusPaint);
    // postes de pilotage (élève devant, pilote derrière) : ouverture, bourrelet de cuir, pare-brise ; carénage de nuque
    for (const [z, s] of [[-.15, 1], [.45, .9]]) { b.sph(.3, 0x17120e, 0, 1.318, z, .78 * s, .1, 1.05 * s, 0, 16, 8); b.add(new THREE.TorusGeometry(.245 * s, .035, 8, 22), 0x5a3a24, b.M(0, 1.335, z, PI / 2, 0, 0, 1, 1.32, 1), 0, true);
      b.box(.36 * s, .17, .012, GLASS, 0, 1.43, z + .36 * s, -.45, 0, 0, 2); b.box(.38 * s, .025, .03, NAVY, 0, 1.51, z + .32 * s, -.45); }
    b.sph(.2, RED, 0, 1.27, -.62, .75, .55, 2.0, 0, 16, 10);
    // moteur en étoile, anneau de capot, échappements
    b.cyl(.22, .22, .06, 20, 0x4a4f58, 0, .95, 1.31, PI / 2); b.cyl(.15, .17, .16, 16, 0x5a5f68, 0, .95, 1.4, PI / 2);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + PI / 2, c = Math.cos(a), s = Math.sin(a);
      seg(b, [c * .13, .95 + s * .13, 1.4], [c * .34, .95 + s * .34, 1.4], .052, 0x3a3f46, 10);
      for (let k = 0; k < 4; k++) { const r = .18 + k * .04; b.add(new THREE.CylinderGeometry(.075, .075, .012, 12), 0x666c74, b.M(c * r, .95 + s * r, 1.4, 0, 0, a - PI / 2)); }
      b.sph(.056, ALU, c * .36, .95 + s * .36, 1.4, 1, 1, 1, 0, 10, 8); seg(b, [c * .2, .95 + s * .2, 1.46], [c * .33, .95 + s * .33, 1.43], .01, 0x8a8f96, 4); }
    b.add(new THREE.TorusGeometry(.41, .06, 10, 34), ALU, b.M(0, .95, 1.42, 0, 0, 0, 1, 1, 1.9), 0, true);
    for (const s of [-1, 1]) seg(b, [s * .22, .76, 1.34], [s * .31, .58, .95], .03, 0x4a3a30, 8);
    // aile basse (dièdre), aile haute décalée vers l'avant, saumons rouges, nervures entoilées, réservoir
    for (const s of [-1, 1]) { const rz = s * .04, cx = s * 1.18, y = .67;
      b.box(1.76, .055, .64, CRM, cx, y, .55, 0, 0, rz); b.cyl(.03, .03, 1.76, 10, CRM, cx, y, .87, 0, 0, PI / 2 + rz);
      b.sph(.33, RED, s * 2.06, y + .88 * .04, .56, .26, .085, 1.0, 0, 16, 8);
      for (let k = 0; k < 5; k++) { const x = s * (.5 + k * .34); b.box(.02, .012, .64, RIB, x, y + .03 + (Math.abs(x) - 1.18) * .04, .55, 0, 0, rz); } }
    b.box(2.1, .06, .7, CRM, 0, UY, .73); b.cyl(.032, .032, 4.0, 12, CRM, 0, UY, 1.08, 0, 0, PI / 2); b.box(.62, .1, .44, ALU, 0, UY + .07, .78);
    for (const s of [-1, 1]) { b.box(.9, .06, .5, CRM, s * 1.5, UY, .83); b.sph(.36, RED, s * 2.0, UY, .73, .3, .085, 1.0, 0, 16, 8); if (full) aileron(b, s * 1.5, UY, .58);
      b.sph(.04, s > 0 ? 0xff3b30 : 0x38e07b, s * 2.1, UY, .74, 1, 1, 1, 1, 10, 8); } // feux de position : rouge à gauche, vert à droite
    for (let k = -5; k <= 5; k++) if (k) { const x = k * .36, out = Math.abs(x) > 1.05; b.box(.02, .012, out ? .5 : .7, RIB, x, UY + .034, out ? .83 : .73); }
    // mâts de cabane, mâts interplans en N, haubans croisés
    for (const s of [-1, 1]) { for (const z of [.55, .95]) seg(b, [s * .2, 1.3, z], [s * .32, UY - .03, z + .04], .022, NAVY, 8);
      const ly = .67 + (1.4 - 1.18) * .04; seg(b, [s * 1.4, ly, .8], [s * 1.45, UY - .03, .98], .028, NAVY, 8); seg(b, [s * 1.4, ly, .32], [s * 1.45, UY - .03, .5], .028, NAVY, 8); seg(b, [s * 1.4, ly, .8], [s * 1.45, UY - .03, .5], .02, NAVY, 8);
      seg(b, [s * .3, .68, .6], [s * 1.42, UY - .04, .74], .006, 0x3a3d42, 4); seg(b, [s * .3, 1.28, .6], [s * 1.42, ly + .02, .6], .006, 0x3a3d42, 4); }
    // empennage : plan fixe aux bouts arrondis, dérive extrudée et sa fleur, plan mobile et gouverne de direction
    b.box(1.3, .045, .3, CRM, 0, 1.0, -1.6); for (const s of [-1, 1]) b.sph(.3, RED, s * .66, 1.0, -1.62, .18, .075, .58, 0, 14, 8);
    const fin = new THREE.Shape(); fin.moveTo(1.34, 1.0); fin.lineTo(1.76, 1.0); fin.lineTo(1.76, 1.54); fin.quadraticCurveTo(1.7, 1.62, 1.58, 1.5); fin.lineTo(1.34, 1.0);
    b.add(new THREE.ExtrudeGeometry(fin, { depth: .045, bevelEnabled: false, curveSegments: 6 }), CRM, b.M(-.0225, 0, 0, 0, PI / 2, 0), 0, false);
    for (const s of [-1, 1]) { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; b.sph(.034, 0xffd23f, s * .03, 1.24 + Math.sin(a) * .045, -1.58 + Math.cos(a) * .045, .4, 1, 1, 0, 8, 6); } b.sph(.024, 0xe8743a, s * .036, 1.24, -1.58, .4, 1, 1, 0, 8, 6); }
    b.sph(.035, 0xffffff, 0, 1.56, -1.98, 1, 1, 1, 1, 8, 6);
    if (full) { elevator(b, 0, 1.0, -1.75); rudder(b, 0, -1.76); }
    // train d'atterrissage : jambes en V, essieu, roues ; roulette de queue sur ressort
    for (const s of [-1, 1]) { seg(b, [s * .15, .6, .5], [s * .55, AXY, AXZ], .025, NAVY, 8); seg(b, [s * .15, .6, 1.02], [s * .55, AXY, AXZ], .025, NAVY, 8); if (full) wheel(b, s * .62, AXY, AXZ); }
    seg(b, [-.55, AXY, AXZ], [.55, AXY, AXZ], .02, NAVY, 8); seg(b, [0, .9, -1.55], [0, .66, -1.72], .02, NAVY, 6); b.tor(.06, .025, TIRE, 0, .65, -1.74, 0, PI / 2, 0, 0, 14);
    // petits détails : tube de Pitot, marchepied, poignée
    seg(b, [1.75, UY - .03, .95], [1.75, UY - .03, 1.25], .008, ALU, 4); b.box(.12, .02, .1, NAVY, .38, .75, -.05); seg(b, [.32, .8, -.05], [.38, .75, -.05], .012, NAVY, 4);
    if (full) prop(b, 0, .95, 1.53);
  }
  MD.avion = v => { const b = G.mb(345); airframe(b, v !== 1); const g = b.done(); if (v !== 1) { g.applyMatrix4(new THREE.Matrix4().makeRotationX(-TG)); g.translate(0, -groundOff(TG), 0); g.scale(SC, SC, SC); } return g; };
  MD.avion_helice = () => { const b = G.mb(346); prop(b, 0, 0, 0); return b.done(); };
  MD.avion_aileron = () => { const b = G.mb(347); aileron(b, 0, 0, 0); return b.done(); };
  MD.avion_profondeur = () => { const b = G.mb(348); elevator(b, 0, 0, 0); return b.done(); };
  MD.avion_direction = () => { const b = G.mb(349); rudder(b, 0, 0); return b.done(); };
  MD.avion_roue = () => { const b = G.mb(350); wheel(b, 0, 0, 0); return b.done(); };
  Object.assign(G.OBJ.avion, { n: 'Biplan', h: 1.75 }); G.ITEMS.avion.n = 'Biplan';

  // ---------- son du moteur : vrombissement + souffle du vent ----------
  const ENG = { g: null };
  ENG.start = () => { const A = G.audio; if (!A || !A.ok || ENG.g) return; try {
    const C = A.ctx, g = C.createGain(), lp = C.createBiquadFilter(), o1 = C.createOscillator(), o2 = C.createOscillator(), o2g = C.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o2g.gain.value = .35; lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 1.6; g.gain.value = 0;
    o1.connect(lp); o2.connect(o2g); o2g.connect(lp); lp.connect(g); g.connect(A.sfxG);
    const nb = C.createBuffer(1, C.sampleRate, C.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = C.createBufferSource(), nf = C.createBiquadFilter(), ng = C.createGain(); ns.buffer = nb; ns.loop = true; nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = .6; ng.gain.value = 0; ns.connect(nf); nf.connect(ng); ng.connect(A.sfxG);
    o1.start(); o2.start(); ns.start(); Object.assign(ENG, { g, lp, o1, o2, ns, ng, nf }); } catch (e) { ENG.g = null; } };
  ENG.set = (rpm, spd, dt) => { if (!ENG.g) return; const t = G.audio.ctx.currentTime, f = 34 + rpm * 58 + Math.sin(t * 7) * .6 * rpm;
    ENG.o1.frequency.setTargetAtTime(f, t, .08); ENG.o2.frequency.setTargetAtTime(f * 2.01, t, .08); ENG.lp.frequency.setTargetAtTime(280 + rpm * 900, t, .1);
    ENG.g.gain.setTargetAtTime(.035 + rpm * .075, t, .12); ENG.ng.gain.setTargetAtTime(Math.min(.09, spd * spd * .00018), t, .2); ENG.nf.frequency.setTargetAtTime(500 + spd * 40, t, .2); };
  ENG.stop = () => { if (!ENG.g) return; const t = G.audio.ctx.currentTime, e = ENG; e.g.gain.setTargetAtTime(0, t, .15); e.ng.gain.setTargetAtTime(0, t, .15); setTimeout(() => { try { e.o1.stop(); e.o2.stop(); e.ns.stop(); e.g.disconnect(); e.ng.disconnect(); } catch (x) { } }, 900); ENG.g = null; };

  // ---------- tableau de bord ----------
  const HUD = { el: null };
  HUD.make = () => { if (HUD.el) return; const st = document.createElement('style');
    st.textContent = '#avion-hud{position:absolute;left:14px;bottom:calc(92px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:6px;pointer-events:none;font-family:var(--f-display);color:var(--ink);z-index:5}' +
      '#avion-hud .ah-g{display:flex;gap:8px}#avion-hud .ah-c{background:rgba(255,247,223,.92);border-radius:16px;box-shadow:0 3px 0 var(--paper-d),0 6px 14px var(--shade);padding:6px 12px;min-width:86px;text-align:center}' +
      '#avion-hud .ah-l{font-size:11px;letter-spacing:.06em;color:var(--bark);opacity:.85}#avion-hud .ah-v{font-size:22px;line-height:1.1}#avion-hud .ah-u{font-size:12px;opacity:.7;margin-left:3px}' +
      '#avion-hud .ah-bar{height:8px;border-radius:5px;background:#e9dcbc;margin-top:4px;overflow:hidden}#avion-hud .ah-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--leaf),var(--sun),var(--berry));border-radius:5px}' +
      '#avion-hud .ah-warn{background:var(--berry);color:#fff;border-radius:12px;padding:3px 10px;font-size:14px;align-self:flex-start;animation:ahb .5s steps(2) infinite}@keyframes ahb{50%{opacity:.35}}' +
      '#avion-hud .ah-k{font-family:var(--f-body);font-size:12px;background:rgba(255,247,223,.85);border-radius:12px;padding:4px 10px;line-height:1.5}#avion-hud .ah-k b{font-family:var(--f-display);display:inline-block;min-width:18px;padding:0 5px;border-radius:6px;background:var(--leaf);color:#fff;margin:0 2px}';
    document.head.appendChild(st); const el = HUD.el = document.createElement('div'); el.id = 'avion-hud'; el.hidden = true;
    el.innerHTML = '<div class="ah-warn" hidden>DÉCROCHAGE !</div><div class="ah-g"><div class="ah-c"><div class="ah-l">VITESSE</div><div class="ah-v"><span data-k="spd">0</span><span class="ah-u">km/h</span></div></div>' +
      '<div class="ah-c"><div class="ah-l">ALTITUDE</div><div class="ah-v"><span data-k="alt">0</span><span class="ah-u">m</span></div></div><div class="ah-c"><div class="ah-l">CAP</div><div class="ah-v" data-k="cap">N</div></div>' +
      '<div class="ah-c" style="min-width:110px"><div class="ah-l">GAZ <span data-k="thr">0</span> %</div><div class="ah-bar"><i data-k="bar" style="width:0%"></i></div></div></div>' +
      '<div class="ah-k"><b>Z</b><b>S</b> gaz · <b>Q</b><b>D</b> virer · <b>Espace</b> cabrer · <b>Maj</b> piquer · <b>V</b> vue · <b>F</b> fumée · <b>E</b> <span data-k="e">atterrir</span></div>';
    (document.getElementById('hud') || document.body).appendChild(el); HUD.q = {}; for (const n of el.querySelectorAll('[data-k]')) HUD.q[n.dataset.k] = n; HUD.warn = el.querySelector('.ah-warn'); };
  HUD.show = on => { HUD.make(); HUD.el.hidden = !on; };
  const CAPS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']; // le nord est vers -z, l'est vers +x
  HUD.upd = v => { if (!HUD.el || HUD.el.hidden || (HUD.t = (HUD.t || 0) + 1) % 4) return; const q = HUD.q, gy = v.gy != null ? v.gy : 0;
    q.spd.textContent = Math.round(v.spd * 6.3); q.alt.textContent = Math.max(0, Math.round((v.y - gy) * 2)); q.thr.textContent = Math.round(v.thr * 100); q.bar.style.width = Math.round(v.thr * 100) + '%';
    const a = ((Math.atan2(Math.sin(v.h), -Math.cos(v.h)) % TAU) + TAU) % TAU; q.cap.textContent = CAPS[Math.round(a / (TAU / 8)) % 8]; q.e.textContent = v.ground ? (v.spd < 2.5 ? 'se garer' : 'ralentir') : 'atterrir';
    HUD.warn.hidden = !(v.stall && !v.ground); };

  // ---------- caméras : poursuite, cockpit, vue d'ensemble (V) ----------
  const TMP = new V3(), TMP2 = new V3(), QY = new THREE.Quaternion().setFromAxisAngle(UP, PI), QX = new THREE.Quaternion(), QR = new THREE.Quaternion();
  const setFov = (cam, f) => { if (Math.abs(cam.fov - f) < .05) return; cam.fov = f; cam.updateProjectionMatrix(); G.U.pscale.value = G.renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(f * PI / 360)); };
  function camFn(camera, C, dt, mouse) { const p = G.player, v = p.vehicle, R = v.mesh;
    if (v.view === 2) { p.root.visible = true; setFov(camera, v.fov0); return false; } // vue d'ensemble : la caméra habituelle des véhicules
    if (v.view === 1) { // cockpit : on regarde par-dessus le capot, l'horizon penche avec l'avion
      R.updateMatrixWorld(); const eye = R.localToWorld(TMP.set(0, 1.8, -.34)); camera.position.copy(eye); // l'œil passe juste au-dessus de l'aile haute : on voit l'horizon et le capot
      camera.quaternion.copy(R.quaternion).multiply(QY).multiply(QX.setFromAxisAngle(TMP2.set(1, 0, 0), -.13)); camera.updateMatrixWorld();
      G.U.curve.value = 0; C.cx = eye.x; C.cy = eye.y; C.cz = eye.z; C.yaw = v.h + PI; p.root.visible = false; setFov(camera, v.fov0 + 12); return true; }
    // poursuite : derrière l'avion, un peu au-dessus ; à la souris, on vise avec la caméra
    p.root.visible = true; const k = 1 - Math.exp(-dt * (mouse ? 6 : 2.6));
    if (mouse) C.yaw = G.angLerp(C.yaw, C.tyaw, k); else { C.yaw = G.angLerp(C.yaw, v.h + PI, k); C.tyaw = C.yaw; }
    const dist = 7.2 + v.spd * .14, pitch = mouse ? G.clamp(C.mp * .7, -.15, .8) + .12 : (v.cp = (v.cp == null ? .4 : v.cp) + ((v.ground ? .42 : .22) - (v.cp == null ? .4 : v.cp)) * Math.min(1, 1.5 * dt)), fx = Math.sin(v.h), fz = Math.cos(v.h);
    const tx = v.x + fx * 1.6, ty = v.y + 1.35, tz = v.z + fz * 1.6, kk = Math.min(1, 9 * dt);
    if (!C.cx) { C.cx = tx; C.cy = ty; C.cz = tz; } C.cx += (tx - C.cx) * kk; C.cy += (ty - C.cy) * kk; C.cz += (tz - C.cz) * kk;
    const hd = Math.cos(pitch) * dist; camera.position.set(C.cx + Math.sin(C.yaw) * hd, C.cy + Math.sin(pitch) * dist, C.cz + Math.cos(C.yaw) * hd);
    const m = G.map, gh = m.terrainH(camera.position.x, camera.position.z); if (gh < 40 && camera.position.y < gh + 1.1) camera.position.y = gh + 1.1;
    TMP.set(C.cx - camera.position.x, C.cy - camera.position.y, C.cz - camera.position.z).normalize(); camera.up.copy(UP).applyQuaternion(QR.setFromAxisAngle(TMP, -v.bank * .28));
    camera.lookAt(C.cx, C.cy, C.cz); camera.up.copy(UP);
    G.U.curve.value *= .55; setFov(camera, v.fov0 + G.clamp((v.spd - 8) * .35, 0, 7)); return true; }

  // ---------- monter à bord ----------
  const DISC = G.curveMat(new THREE.MeshBasicMaterial({ color: 0x4a3a28, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }));
  const BEACON = G.curveMat(new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  const SEAT = new V3();
  const ob = F.board; F.board = o => { if (!G.OBJ[o.t].plane) return ob(o);
    const p = G.player, m = G.map; if (m.interior) return; const [cx, cz] = m.center(o);
    const root = new THREE.Group(); root.rotation.order = 'YXZ'; root.scale.setScalar(SC); G.scene.add(root);
    const mk = (geo, x, y, z, mat = G.MATS) => { const me = new THREE.Mesh(geo, mat); me.castShadow = true; me.frustumCulled = false; me.position.set(x, y, z); root.add(me); return me; };
    const parts = { body: mk(G.getGeo('avion', 1), 0, 0, 0), prop: mk(G.getGeo('avion_helice'), 0, .95, 1.53), disc: mk(new THREE.CircleGeometry(.82, 40), 0, .95, 1.56, DISC),
      ail: [mk(G.getGeo('avion_aileron'), 1.5, UY, .58), mk(G.getGeo('avion_aileron'), -1.5, UY, .58)], elev: mk(G.getGeo('avion_profondeur'), 0, 1.0, -1.75), rud: mk(G.getGeo('avion_direction'), 0, 0, -1.76),
      wheels: [mk(G.getGeo('avion_roue'), .62, AXY, AXZ), mk(G.getGeo('avion_roue'), -.62, AXY, AXZ)], beacon: mk(new THREE.SphereGeometry(.05, 10, 8), 0, 1.66, -1.9, BEACON) };
    parts.disc.castShadow = parts.beacon.castShadow = false; parts.disc.visible = false;
    const sh = new THREE.Mesh(G.getGeo('blob'), G.M.shadow); sh.frustumCulled = false; G.scene.add(sh);
    const gy = m.terrainH(cx, cz);
    p.vehicle = { plane: 1, plane2: 1, o: { t: o.t, r: o.r }, x: cx, z: cz, y: gy, gy, h: [0, PI / 2, PI, -PI / 2][o.r || 0], spd: 0, thr: 0, pitch: TG, bank: 0, vy: 0, off: groundOff(TG), ground: true, mesh: root, sh, parts,
      t: 0, view: 0, smoke: 0, rpm: 0, camFn, fov0: G.camera.fov, warnT: 0 };
    m.removeObj(o); G.sfx('fanfare'); ENG.start(); HUD.show(true); G.cam.cx = 0;
    G.ui.toast('Aux commandes du biplan ! Z pour mettre les gaz, puis Espace pour décoller ✈️');
  };
  // se garer : l'avion redevient un objet posé, le joueur descend à côté
  function park(p, v, L) { const m = G.map, r = (((Math.round(v.h / (PI / 2)) % 4) + 4) % 4);
    if (!L) { const sx = Math.floor(v.x - 1.5), sz = Math.floor(v.z - 1.5); for (let rr = 0; rr < 12 && !L; rr++) for (let dz = -rr; dz <= rr && !L; dz++) for (let dx = -rr; dx <= rr && !L; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== rr) continue; const x = sx + dx, z = sz + dz; if (m.canPlace(v.o.t, x, z, r) && !m.isWaterAt(x + 1.5, z + 1.5)) L = { tx: x, tz: z, x: x + 1.5, z: z + 1.5 }; } }
    if (!L) { G.sfx('error'); G.ui.toast('Pas de place pour garer l\'avion ici : roule jusqu\'à un terrain dégagé de 3×3.'); return; }
    leave(p, v); m.addObj(v.o.t, L.tx, L.tz, r); const sx2 = L.x + Math.cos(v.h) * 2.3, sz2 = L.z - Math.sin(v.h) * 2.3; p.teleport(sx2, sz2, v.h); if (p.blocked(p.x, p.z, p.y, true)) p.unstick(true);
    G.sfx('land'); G.fx.puff(L.x, m.topAt(L.x, L.z) + .1, L.z, 12, 0xf3ead2, .9); G.ui.toast('Avion garé. 🛬'); }
  function leave(p, v) { G.scene.remove(v.mesh); G.scene.remove(v.sh); p.vehicle = null; ENG.stop(); HUD.show(false); setFov(G.camera, v.fov0); p.root.visible = true; p.root.rotation.set(0, p.yaw, 0); G.cam.cx = 0; }
  // E en vol : descente en spirale vers le terrain libre le plus proche, arrondi, toucher des roues
  function autoLand(v) { const m = G.map, sx = Math.floor(v.x + Math.sin(v.h) * 6 - 1.5), sz = Math.floor(v.z + Math.cos(v.h) * 6 - 1.5); let L = null;
    for (let r = 0; r < 40 && !L; r++) for (let dz = -r; dz <= r && !L; dz++) for (let dx = -r; dx <= r && !L; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = sx + dx, z = sz + dz; if (m.canPlace(v.o.t, x, z, v.o.r) && !m.isWaterAt(x + 1.5, z + 1.5)) L = { tx: x, tz: z, x: x + 1.5, z: z + 1.5 }; }
    if (!L) { G.sfx('error'); G.ui.toast('Aucun terrain libre de 3×3 par ici.'); return; }
    L.r = Math.max(4, Math.hypot(v.x - L.x, v.z - L.z)); L.a = Math.atan2(v.z - L.z, v.x - L.x); L.y0 = v.y; L.r0 = L.r; v.auto = L; G.ui.toast('Atterrissage automatique… 🛬'); }

  // ---------- vol ----------
  const GRAV = 6, STALL = 6.0, VR = 7.6, THR = 9.5, DRAG = .018, RAINBOW = [0xff5a5a, 0xffa53a, 0xffe14a, 0x5fd16b, 0x5bb3ff, 0xb583e6];
  const groundY = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); return m.isWaterT(tx, tz) ? m.waterSurf(tx, tz) : m.terrainH(x, z); };
  const ou = F.updVehicle; F.updVehicle = (p, dt) => { const v = p.vehicle; if (!v || !v.plane2) return ou(p, dt);
    const I = G.input, m = G.map, free = G.ui.canPlay(), P = v.parts, mouse = G.mouseMode(); dt = Math.min(dt, .05); v.t += dt; v.warnT = Math.max(0, v.warnT - dt);
    let steer = 0, pull = 0, gas = 0;
    if (free && !v.auto) {
      if (I.down('KeyD', 'ArrowRight')) steer += 1; if (I.down('KeyA', 'ArrowLeft')) steer -= 1; if (I.down('KeyW', 'ArrowUp')) gas += 1; if (I.down('KeyS', 'ArrowDown')) gas -= 1;
      if (I.down('Space')) pull += 1; if (I.down('ShiftLeft', 'ShiftRight', 'KeyC', 'ControlLeft')) pull -= 1;
      if (I.gp.on) { steer += I.gp.lx; pull -= I.gp.ly; if (I.gp.b[0] || I.gp.b[7]) gas += 1; if (I.gp.b[1] || I.gp.b[6]) gas -= 1; }
      steer += I.touch.mx; pull -= I.touch.my;
      if (mouse && !v.ground) { let d = (v.h - (G.cam.tyaw + PI)) % TAU; d = Math.atan2(Math.sin(d), Math.cos(d)); steer += G.clamp(d * 2.4, -1, 1); pull += G.clamp((.3 - G.cam.mp) * 2.2, -1, 1); }
      steer = G.clamp(steer, -1, 1); pull = G.clamp(pull, -1, 1); gas = G.clamp(gas, -1, 1);
      if (I.hit('KeyV')) { v.view = (v.view + 1) % 3; G.sfx('ui'); G.ui.toast(['Vue de poursuite', 'Vue du cockpit', 'Vue d\'ensemble'][v.view]); }
      if (I.hit('KeyF')) { v.smoke = (v.smoke + 1) % 3; G.sfx('ui'); G.ui.toast(['Fumée coupée', 'Fumée blanche ☁️', 'Fumée arc-en-ciel 🌈'][v.smoke]); }
      if (I.hit('KeyE')) { if (v.ground) { if (v.spd < 2.5) { park(p, v); if (!p.vehicle) return; } else G.ui.toast('Ralentis (S) avant de te garer.'); } else autoLand(v); }
    }
    v.thr = G.clamp(v.thr + gas * dt * 1.1, 0, 1);
    // le bord du monde : l'avion fait demi-tour tout seul
    const W = m.W, H = m.H, mg = 16; if (!v.ground && !v.auto && (v.x < mg || v.z < mg || v.x > W - mg || v.z > H - mg)) { let d = (v.h - Math.atan2(W / 2 - v.x, H / 2 - v.z)) % TAU; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > .35) steer = d > 0 ? 1 : -1; else steer = G.clamp(d * 3, -1, 1); pull = Math.max(pull, 0); if ((v.edgeT = (v.edgeT || 0) - dt) < 0) { v.edgeT = 6; G.ui.toast('↩️ Demi-tour : c\'est le bout du monde !'); } }
    if (v.y > 40) pull = Math.min(pull, -.4);
    const gy = v.gy = groundY(m, v.x, v.z), water = m.isWaterT(Math.floor(v.x), Math.floor(v.z));
    if (v.auto) { // atterrissage automatique en spirale
      const L = v.auto, h0 = v.h; L.a += dt * Math.min(2.4, 9 / Math.max(L.r, 2)); L.r = Math.max(0, L.r - dt * Math.max(1.1, L.r * .3)); const nx = L.x + Math.cos(L.a) * L.r, nz = L.z + Math.sin(L.a) * L.r, k = L.r / L.r0;
      if (Math.hypot(nx - v.x, nz - v.z) > .002) v.h = Math.atan2(nx - v.x, nz - v.z); let dh = (v.h - h0) % TAU; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      v.x = nx; v.z = nz; const lg = m.terrainH(L.x, L.z); v.y = lg + (L.y0 - lg) * k * k; v.spd = 4 + 6 * k; v.thr += (.25 - v.thr) * Math.min(1, 2 * dt);
      v.bank += (G.clamp(-dh / Math.max(dt, .001) * .35, -.6, .6) * (k > .08 ? 1 : 0) - v.bank) * Math.min(1, 3 * dt); v.pitch += ((k < .15 ? TG : -.08) - v.pitch) * Math.min(1, 2 * dt);
      v.ground = k < .05; v.off += ((v.ground ? groundOff(v.pitch) : 0) - v.off) * Math.min(1, 4 * dt);
      if (L.r <= .02) { v.ground = true; G.sfx('land'); park(p, v, L); if (!p.vehicle) return; v.auto = null; } }
    else if (v.ground) { // roulage, course au décollage
      const brake = gas < 0 && v.thr < .02 ? 1 : 0, fr = .45 + brake * 5;
      v.spd += (v.thr * THR - DRAG * v.spd * v.spd) * dt; v.spd = Math.max(0, v.spd - fr * dt);
      v.h -= steer * (Math.min(v.spd, 6) * .3 + .9) * dt;
      v.bank += (0 - v.bank) * Math.min(1, 6 * dt);
      const tail = G.clamp((v.spd - 4) / 5, 0, 1), base = TG * (1 - tail);
      v.pitch += ((pull > 0 && v.spd > VR ? .2 : base) - v.pitch) * Math.min(1, 3 * dt); v.off += (groundOff(v.pitch) - v.off) * Math.min(1, 8 * dt);
      const nx = v.x + Math.sin(v.h) * v.spd * dt, nz = v.z + Math.cos(v.h) * v.spd * dt, px = nx + Math.sin(v.h) * 1.4, pz = nz + Math.cos(v.h) * 1.4, top = m.topAt(px, pz);
      if (nx < 3 || nz < 3 || nx > W - 3 || nz > H - 3 || top > gy + .45 || m.isWaterT(Math.floor(px), Math.floor(pz))) { if (v.spd > 1.5) { G.sfx('thud'); G.cam.shake(.12); } v.spd = 0; }
      else { v.x = nx; v.z = nz; if (groundY(m, nx, nz) < gy - .5) { v.ground = false; v.vy = 0; } } // on roule au bord d'une falaise : on plonge
      if (v.ground) { v.y = gy; v.vy = 0; }
      if (pull > 0 && v.spd > VR && v.pitch > .12) { v.ground = false; v.vy = 1.6; G.sfx('swing', .5); G.ui.toast('Décollage ! 🛫'); }
      v.stall = false; }
    else { // en l'air
      v.bank += (steer * .95 - v.bank) * Math.min(1, 5 * dt);
      v.stall = v.spd < STALL; const tp = pull * .48;
      v.pitch += ((v.stall ? Math.min(tp, -.28) : tp) - v.pitch) * Math.min(1, 3.4 * dt);
      v.h -= (GRAV * Math.tan(v.bank) / Math.max(v.spd, 5) * 2.1 + steer * .45) * dt; // virage serré + palonnier : plus maniable
      v.spd = Math.max(0, v.spd + (v.thr * THR - DRAG * v.spd * v.spd - GRAV * Math.sin(v.pitch)) * dt);
      const lift = Math.min(1, v.spd / STALL), vyT = v.spd * Math.sin(v.pitch) - (1 - lift) * 5.5 - Math.abs(v.bank) * .35;
      v.vy += (vyT - v.vy) * Math.min(1, 2.5 * dt); v.off += (0 - v.off) * Math.min(1, 3 * dt);
      const hs = v.spd * Math.cos(v.pitch); v.x = G.clamp(v.x + Math.sin(v.h) * hs * dt, 3, W - 3); v.z = G.clamp(v.z + Math.cos(v.h) * hs * dt, 3, H - 3); v.y += v.vy * dt;
      // obstacles (arbres, toits, falaises) : on rebondit au-dessus
      const top = m.topAt(v.x, v.z); if (top < 40 && v.y < top - .1 && top > gy + .4) { v.y = top + .25; v.vy = Math.max(v.vy, 2.2); v.spd *= .9; G.cam.shake(.15); if (v.warnT <= 0) { v.warnT = 4; G.sfx('thud'); G.ui.toast('Attention aux obstacles ! 🌳'); } }
      if (v.y <= gy) { // contact avec le sol ou l'eau
        if (water) { v.y = gy + .05; v.vy = Math.abs(v.vy) * .4 + 1.8; v.spd *= .8; G.sfx('splash'); G.fx.burst && G.fx.burst(v.x, gy + .2, v.z, 14, [0xffffff, 0xbfe6fa], 3, .8, 6); G.ui.toast('Plouf ! Ce n\'est pas un hydravion : remonte !'); }
        else if (v.vy < -3.4 || Math.abs(v.bank) > .55) { v.y = gy; v.vy = Math.min(3, -v.vy * .35); v.bank *= .3; G.sfx('thud'); G.cam.shake(.3); G.fx.puff(v.x, gy + .1, v.z, 12, 0xd9c9a8, .9); G.ui.toast('Atterrissage un peu musclé ! 😅'); }
        else { v.y = gy; v.vy = 0; v.ground = true; v.bank = 0; G.sfx('land'); G.fx.puff(v.x, gy + .1, v.z, 8, 0xe8dcc0, .7); if (v.spd > 3) G.ui.toast('Joli atterrissage ! S pour freiner, E pour te garer.'); } } }
    // pose de l'appareil et des gouvernes
    v.mesh.position.set(v.x, v.y - v.off * SC, v.z); v.mesh.rotation.set(-v.pitch, v.h, v.bank);
    P.ail[0].rotation.x = -steer * .35; P.ail[1].rotation.x = steer * .35; P.elev.rotation.x = pull * .35; P.rud.rotation.y = steer * .3;
    v.rpm += ((v.thr < .02 ? .14 : .22 + .78 * v.thr) - v.rpm) * Math.min(1, 2.5 * dt); P.prop.rotation.z += dt * (6 + v.rpm * 75); P.disc.visible = v.rpm > .42; DISC.opacity = .08 + v.rpm * .14;
    if (v.ground) for (const w of P.wheels) w.rotation.x += v.spd * dt / AXY;
    P.beacon.visible = (v.t % 1.3) < .16;
    // ombre douce, pilote assis
    v.sh.position.set(v.x, gy + .04, v.z); const s = G.clamp(3.6 - (v.y - gy) * .07, 1.4, 3.6); v.sh.scale.set(s * SC, 1, s * 1.1 * SC); v.sh.visible = !water && (v.y - gy) > .15;
    v.mesh.updateMatrixWorld(); const st = v.mesh.localToWorld(SEAT.set(0, .36, -.15)); p.x = st.x; p.z = st.z; p.y = st.y; p.yaw = v.h; p.onGround = true; p.swim = false;
    p.animate(dt, 0); const C = p.C; C.legL.rotation.x = C.legR.rotation.x = -1.45; C.body.position.y = -.3; C.armR.rotation.x = -.75 + steer * .1; C.armL.rotation.x = -.55 - gas * .15; C.armR.rotation.z = .12 - steer * .15;
    p.place(); p.root.quaternion.copy(v.mesh.quaternion); p.blob.visible = false;
    // fumées : voltige (F), échappement, poussière au roulage
    if (v.smoke && !v.ground && (v.smT = (v.smT || 0) - dt) < 0) { v.smT = .014; const tl = v.mesh.localToWorld(TMP.set((Math.random() - .5) * .1, .98 + (Math.random() - .5) * .1, -2.05 - Math.random() * .2)); G.fx.one(tl.x, tl.y, tl.z, (Math.random() - .5) * .3, .06, (Math.random() - .5) * .3, 4.5, -.015, v.smoke === 1 ? 0xffffff : RAINBOW[Math.floor(v.t * 2.5) % 6], .45, 2.6); }
    if ((v.exT = (v.exT || 0) - dt) < 0) { v.exT = .22 - v.rpm * .14; for (const sx of [-1, 1]) { const e = v.mesh.localToWorld(TMP.set(sx * .31, .58, .93)); G.fx.one(e.x, e.y, e.z, 0, .2, 0, .35, -.2, 0xb5b0aa, .09, 1.6); } }
    if (v.ground && v.spd > 3 && !water && Math.random() < dt * 10) G.fx.puff(v.x - Math.sin(v.h) * 1.2, gy + .05, v.z - Math.cos(v.h) * 1.2, 1, 0xd9c9a8, .45);
    ENG.set(v.rpm, v.spd, dt); HUD.upd(v);
  };
  // le menu titre, une téléportation… : plus d'avion, plus de bruit ni de tableau de bord
  G.on('frame', () => { const p = G.player, v = p && p.vehicle; if (HUD.el && !HUD.el.hidden && !(v && v.plane2)) { HUD.show(false); ENG.stop(); if (G.camera && G.camera.userData.fov0) setFov(G.camera, G.camera.userData.fov0); } if (v && v.plane2) G.camera.userData.fov0 = v.fov0; });
})();
