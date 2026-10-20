'use strict';
// ===== Oiseaux : moineaux, mésanges, rouges-gorges, merles et pigeons autour du joueur ; mouettes au-dessus de la mer.
// Chaque oiseau est modelé (corps fuselé, ventre, tête mobile, calotte, bec, yeux brillants, queue en éventail, pattes) et ses ailes
// sont articulées en deux parties, le bras et la main : au sol elles sont repliées le long du dos ; en vol elles battent pour de vrai
// (la main se replie à la remontée, s'ouvre à la descente), s'étalent pour planer, freinent à l'atterrissage.
// Au sol : petits sauts, picorage, coups de tête pour regarder autour, lissage des plumes, queue qui frétille, gazouillis ;
// le pigeon marche en hochant la tête. Si l'on approche : envol en vol bondissant (battements, ailes fermées, battements…),
// puis atterrissage un peu plus loin. Les mouettes planent en cercles en s'inclinant dans le virage, battent des ailes de temps
// en temps, se posent sur l'eau ou sur la plage, crient, et repartent. Le jour seulement : la nuit, ils dorment. =====
(function () {
  const PI = Math.PI, TAU = PI * 2, R = Math.random, SK = () => G.SK || {};
  const SP = {
    moineau: { body: 0x9a7350, belly: 0xd8c8a8, head: 0x8a6a4a, cap: 0x6a5a4a, wing: 0x7a5a3c, wing2: 0x4a3a2a, beak: 0x4a3a30, s: .2, w: 1, hz: 11, hop: 1 },
    mesange: { body: 0x7aa04a, belly: 0xf2d43a, head: 0xf6f6f2, cap: 0x3a6ad8, wing: 0x4a7ad8, wing2: 0x2a3a6a, beak: 0x2a2a2a, s: .18, w: 1, hz: 12, hop: 1 },
    rouge_gorge: { body: 0x8a7050, belly: 0xf08a3a, head: 0x8a7050, cap: 0x7a6040, wing: 0x7a6044, wing2: 0x5a4632, beak: 0x2a2a2a, s: .2, w: 1, face: 0xf08a3a, hz: 11, hop: 1 },
    merle: { body: 0x1d1d22, belly: 0x26262c, head: 0x1d1d22, cap: 0x1d1d22, wing: 0x18181c, wing2: 0x101014, beak: 0xffa21a, s: .26, w: 1, ring: 0xffa21a, hz: 9, hop: 1 },
    pigeon: { body: 0x9aa0ae, belly: 0xb0b4c0, head: 0x7a8292, cap: 0x7a8292, wing: 0xa8adba, wing2: 0x4a4e5a, beak: 0x3a3a3a, s: .32, w: 1.05, neck: 0x5a9a8a, hz: 6, walk: 1 },
    mouette: { body: 0xf6f6f4, belly: 0xffffff, head: 0xffffff, cap: 0xffffff, wing: 0xb8c0cc, wing2: 0x2a2a2e, beak: 0xf2c41a, s: .42, w: 1.7, hz: 3.2, walk: 1, gull: 1 } };
  const KINDS = ['moineau', 'moineau', 'mesange', 'rouge_gorge', 'merle', 'pigeon', 'moineau', 'mesange', 'pigeon', 'rouge_gorge'];
  const ell = (b, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, ws = 14, hs = 10) => b.add(new THREE.SphereGeometry(1, ws, hs), col, b.M(x, y, z, rx, ry, rz, sx, sy, sz), 0, true);
  const tube = (b, p, q, r1, r2, col) => { const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]), L = d.length(); d.normalize(); b.add(new THREE.CylinderGeometry(r2, r1, L, 6, 1), col, new THREE.Matrix4().compose(new THREE.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), new THREE.Vector3(1, 1, 1)), 0, true); };
  // ---------- modèles (tout est à l'échelle de l'oiseau : s) ----------
  const NECK = [0, .7, .3], SHO = [.2, .64, .08], cache = {};
  const geo = (k, part, f) => { const key = k + ':' + part; if (cache[key]) return cache[key]; const c = SP[k], b = G.mb(3300 + Object.keys(SP).indexOf(k) * 7 + part.length); f(b, c); const g = b.done(); g.scale(c.s, c.s, c.s); g.computeBoundingSphere(); return cache[key] = g; };
  const bodyGeo = k => geo(k, 'body', (b, c) => { const sk = SK(); b.S(sk.fabric);
    ell(b, c.body, 0, .5, 0, .31, .275, .5); ell(b, c.belly, 0, .42, .08, .27, .23, .4); ell(b, c.body, 0, .58, -.18, .26, .2, .3); // corps fuselé, ventre, dos
    if (c.neck) ell(b, c.neck, 0, .66, .28, .2, .18, .2); // reflets du cou du pigeon
    for (let i = -2; i <= 2; i++) ell(b, i % 2 ? c.wing2 : c.wing, i * .06, .5, -.62, .07, .03, .3, -.25 + (c.gull ? .1 : 0), i * .12, 0); // queue en éventail
    b.S(null); });
  const headGeo = k => geo(k, 'head', (b, c) => { const sk = SK(); b.S(sk.fabric); const hc = [0, .12, .14];
    ell(b, c.head, hc[0], hc[1], hc[2], .3 * (c.gull ? .9 : 1), .29, .31); ell(b, c.cap, 0, .23, .15, .28, .15, .28); if (c.face) ell(b, c.face, 0, .02, .28, .26, .24, .17);
    if (c.gull) ell(b, 0xe8e8ee, 0, .06, .02, .22, .2, .2); b.S(null);
    for (const s of [-1, 1]) { b.S(SK().ceramic); ell(b, 0x0a0a0a, s * .19, .16, .3, .055, .055, .04); b.S(null); ell(b, 0xffffff, s * .2, .19, .33, .018, .018, .012); if (c.ring) b.tor(.06, .012, c.ring, s * .19, .16, .3, 0, s * PI / 2, 0, 0, 10); } // yeux brillants
    b.cone(c.gull ? .07 : .085, c.gull ? .38 : .28, 8, c.beak, 0, .08, .55, PI / 2, 0, 0); if (c.gull) ell(b, 0xd83a2a, 0, .03, .6, .025, .03, .03); }); // bec (tache rouge de la mouette)
  const legGeo = k => geo(k, 'legs', (b, c) => { const col = c.gull ? 0xe8b06a : c.beak === 0xffa21a ? 0x6a5a4a : 0xc89a6a;
    for (const s of [-1, 1]) { tube(b, [s * .12, .3, .04], [s * .14, 0, .06], .03, .022, col); for (const a of [-.45, 0, .45]) tube(b, [s * .14, .005, .06], [s * .14 + Math.sin(a) * .16, .005, .06 + Math.cos(a) * .16], .02, .012, col); tube(b, [s * .14, .005, .06], [s * .14, .005, -.06], .018, .01, col); } });
  // aile droite en deux parties ; le pivot de l'épaule est à l'origine, l'aile s'étend vers +x
  const armGeo = k => geo(k, 'arm', (b, c) => { const w = c.w; b.S(SK().fabric); ell(b, c.wing, .21 * w, 0, -.06, .23 * w, .05, .24); ell(b, c.wing, .12 * w, .01, .04, .13 * w, .045, .14); b.S(null); });
  const handGeo = k => geo(k, 'hand', (b, c) => { const w = c.w; b.S(SK().fabric); ell(b, c.wing, .1 * w, 0, -.06, .13 * w, .04, .19);
    for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(1, 8, 4), i > 2 || c.gull ? c.wing2 : c.wing, b.M((.16 + i * .065) * w, -.008, -.12 - i * .025, 0, -.15 - i * .13, 0, .1 * w, .022, .22), 0, true); // rémiges
    b.S(null); });
  const ARM = .42; // longueur du bras (fraction de l'envergure)
  function make(k) { const c = SP[k], s = c.s, g = new THREE.Group(), mk = (geo) => { const me = new THREE.Mesh(geo, G.MATS); me.castShadow = true; return me; };
    const body = mk(bodyGeo(k)); g.add(body); const head = new THREE.Group(); head.position.set(NECK[0] * s, NECK[1] * s, NECK[2] * s); head.add(mk(headGeo(k))); g.add(head);
    const legs = mk(legGeo(k)); g.add(legs); const wings = [];
    for (const sd of [1, -1]) { const sh = new THREE.Group(); sh.position.set(sd * SHO[0] * s, SHO[1] * s, SHO[2] * s); sh.rotation.order = 'YZX';
      const arm = mk(armGeo(k)); if (sd < 0) arm.scale.x = -1; sh.add(arm); const wr = new THREE.Group(); wr.position.set(sd * ARM * c.w * s, 0, -.02 * s); wr.rotation.order = 'YZX';
      const hand = mk(handGeo(k)); if (sd < 0) hand.scale.x = -1; wr.add(hand); sh.add(wr); g.add(sh); wings.push({ sh, wr, sd }); }
    g.rotation.order = 'YXZ';
    return { k, c, g, body, head, legs, wings, st: 'ground', t: 0, ph: R() * TAU, fl: 0, x: 0, y: 0, z: 0, yaw: R() * TAU - PI, hop: 0, peck: 0, look: 0, lookT: 0, open: 0, beat: 0, sing: 3 + R() * 10 }; }
  // ---------- poses des ailes : 0 = repliées le long du dos, 1 = ouvertes ----------
  // repliées : le bras part en arrière le long du flanc, la main se range dessus ; ouvertes : battement (phase φ) ou vol plané
  function wingPose(b, open, flap, phi, glideUp) { const o = G.clamp(open, 0, 1);
    for (const W of b.wings) { const sd = W.sd;
      let ay = 1.42 * (1 - o), az = -.12 * (1 - o), hy = .12 * (1 - o), hz = 0; // repliées
      if (o > 0) { const sn = Math.sin(phi), up = Math.max(0, Math.cos(phi)); // la remontée : la main se replie vers l'arrière
        const fz = flap * (.15 + .85 * sn), gz = (glideUp || .08);
        az += o * (flap > 0 ? fz : gz); ay += o * (flap > 0 ? .18 * up * flap : 0); hz += o * (flap > 0 ? flap * .45 * Math.sin(phi - .7) : -.05); hy += o * (flap > 0 ? .6 * up * flap : .08); }
      W.sh.rotation.set(0, sd * ay, sd * az); W.wr.rotation.set(0, sd * hy, sd * hz); } }
  // ---------- sons ----------
  function chirp(k, d) { const A = G.audio; if (!A || !A.ok || !A.ctx || !A.sfxG || d > 20) return; try { const C = A.ctx, t0 = C.currentTime, vol = .025 * (1 - d / 20);
      const n = k === 'mouette' ? 3 : k === 'pigeon' ? 2 : 2 + Math.floor(R() * 3);
      for (let i = 0; i < n; i++) { const o = C.createOscillator(), gn = C.createGain(), t = t0 + i * (k === 'mouette' ? .28 : k === 'pigeon' ? .35 : .09);
        let f0 = 2800 + R() * 1500, f1 = f0 * (1.15 + R() * .3), du = .06; if (k === 'merle') { f0 = 1800 + R() * 900; f1 = f0 * 1.3; du = .12; } if (k === 'pigeon') { f0 = 260; f1 = 220; du = .3; o.type = 'sine'; } if (k === 'mouette') { f0 = 1400; f1 = 900 - i * 120; du = .24; o.type = 'sawtooth'; }
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + du); gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(k === 'mouette' ? vol * .6 : vol, t + .01); gn.gain.exponentialRampToValueAtTime(.0001, t + du);
        let out = o; if (k === 'mouette') { const fl = C.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 1600; fl.Q.value = 2; o.connect(fl); out = fl; } out.connect(gn); gn.connect(A.sfxG); o.start(t); o.stop(t + du + .02); } } catch (e) { } }

  let birds = [], scene = null, live = false;
  const N = 14, GULLS = 5;
  G.on('init', sc => { scene = sc; });
  const wrapA = y => { y %= TAU; if (y > PI) y -= TAU; if (y < -PI) y += TAU; return y; };
  const okGround = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return false; const i = m.idx(tx, tz); if (m.water[i]) return false; const o = m.objAt(tx, tz); return !o || G.OBJ[o.t].walk || !(G.OBJ[o.t].h > .3); };
  const isWater = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); return m.inb(tx, tz) && !!m.water[m.idx(tx, tz)]; };
  function landSpot(m, p, near) { for (let t = 0; t < 20; t++) { const a = R() * TAU, d = near ? 4 + R() * 10 : 10 + R() * 22, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (okGround(m, x, z)) return [x, z]; } return null; }
  function place(m, p, b) { const s = landSpot(m, p, false); if (!s) return false; b.x = s[0]; b.z = s[1]; b.y = m.topAt(b.x, b.z); b.st = 'ground'; b.t = 2 + R() * 4; b.yaw = R() * TAU - PI; b.open = 0; return true; }
  // vol d'un point à un autre (arc), en battant des ailes ; les petits passereaux volent en bonds
  function flyTo(b, tx, tz, ty, h) { b.st = 'fly'; b.f = { x0: b.x, y0: b.y, z0: b.z, x1: tx, z1: tz, y1: ty, u: 0, L: Math.hypot(tx - b.x, tz - b.z), h }; b.f.dur = Math.max(1.1, b.f.L / (b.c.gull ? 6 : 5 + R() * 2)); }
  function takeOff(m, p, b, flee) { let s = landSpot(m, p, true) || landSpot(m, p, false); if (!s) return;
    if (flee) { const ax = b.x - p.x, az = b.z - p.z, L = Math.hypot(ax, az) || 1, tx = b.x + ax / L * (8 + R() * 8) + (R() - .5) * 6, tz = b.z + az / L * (8 + R() * 8) + (R() - .5) * 6; if (okGround(m, tx, tz)) s = [tx, tz]; }
    flyTo(b, s[0], s[1], m.topAt(s[0], s[1]), 2 + R() * 4); }
  function seaPoint(m, p) { for (let t = 0; t < 30; t++) { const a = R() * TAU, d = 10 + R() * 40, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, tx = Math.floor(x), tz = Math.floor(z); if (m.inb(tx, tz) && m.water[m.idx(tx, tz)]) return [x, z, m.waterSurf(tx, tz)]; } return null; }
  function shorePoint(m, x0, z0) { for (let t = 0; t < 30; t++) { const a = R() * TAU, d = 2 + R() * 14, x = x0 + Math.cos(a) * d, z = z0 + Math.sin(a) * d; if (okGround(m, x, z) && (isWater(m, x + 1.5, z) || isWater(m, x - 1.5, z) || isWater(m, x, z + 1.5) || isWater(m, x, z - 1.5))) return [x, z]; } return null; }
  function soar(b, m, p) { const sp = seaPoint(m, p); if (!sp) return false; b.st = 'soar'; b.cx = sp[0] + (R() - .5) * 10; b.cz = sp[1] + (R() - .5) * 10; b.ws = sp[2]; b.alt = 5 + R() * 6; b.r = 5 + R() * 8; b.a = R() * TAU; b.dir = R() < .5 ? 1 : -1; b.av = (.3 + R() * .2) * 6 / b.r; b.t = 10 + R() * 20; b.open = 1; return true; }
  // la mouette posée s'envole et monte rejoindre son cercle
  function gullUp(b, m, p) { const x = b.x, y = b.y, z = b.z; if (!soar(b, m, p)) return; b.x = x; b.y = y; b.z = z; const tx = b.cx + Math.cos(b.a) * b.r, tz = b.cz + Math.sin(b.a) * b.r; b.open = 0; flyTo(b, tx, tz, b.ws + b.alt, 1); b.f.toSoar = 1; b.f.dur = Math.max(2, b.f.dur); }

  G.on('frame', dt => { const m = G.map, p = G.player; dt = Math.min(dt || 0, .1); if (!scene || !m || !p) return;
    const day = G.night ? G.night() < .5 : true, on = day && !m.interior && G.state === 'play' && G.settings.quality !== 'low';
    if (!on) { if (live) { for (const b of birds) scene.remove(b.g); birds = []; live = false; } return; }
    if (!live) { live = true; for (let i = 0; i < N; i++) { const b = make(KINDS[i % KINDS.length]); if (place(m, p, b)) { scene.add(b.g); birds.push(b); } }
      for (let i = 0; i < GULLS; i++) { const b = make('mouette'); if (soar(b, m, p)) { b.x = b.cx; b.z = b.cz; b.y = b.ws + b.alt; scene.add(b.g); birds.push(b); } } }
    for (const b of birds) { b.ph += dt; const g = b.g, c = b.c, d = Math.hypot(b.x - p.x, b.z - p.z), runP = (p.vx * p.vx + p.vz * p.vz) > 30;
      // ----- la mouette plane en cercle, dans le sens de sa course, penchée vers l'intérieur du virage -----
      if (b.st === 'soar') { b.a += b.dir * b.av * dt; b.t -= dt;
        if (Math.hypot(b.cx - p.x, b.cz - p.z) > 90) soar(b, m, p);
        const nx = b.cx + Math.cos(b.a) * b.r, nz = b.cz + Math.sin(b.a) * b.r, vx = -Math.sin(b.a) * b.dir, vz = Math.cos(b.a) * b.dir; b.yaw = Math.atan2(vx, vz); b.x = nx; b.z = nz;
        const yy = b.ws + b.alt + Math.sin(b.ph * .6) * .5; b.y = yy;
        b.fl = (b.fl || 0) - dt; if (b.fl < -3 - R() * 4) b.fl = 1.2 + R(); const flapping = b.fl > 0; b.beat += dt * TAU * c.hz * (flapping ? 1 : 0);
        g.position.set(b.x, b.y, b.z); g.rotation.set(flapping ? -.05 : .03, b.yaw, b.dir * .3, 'YXZ'); // inclinée vers le centre du cercle
        wingPose(b, 1, flapping ? .8 : 0, b.beat, .1 + Math.sin(b.ph * 1.1) * .03); b.legs.visible = false; b.head.rotation.set(.1, -b.dir * .25, 0);
        if ((b.sing -= dt) < 0) { b.sing = 6 + R() * 12; chirp('mouette', d); }
        if (b.t < 0) { const onWater = R() < .55, s = onWater ? [b.cx + (R() - .5) * 8, b.cz + (R() - .5) * 8] : shorePoint(m, b.cx, b.cz);
          if (s && (onWater ? isWater(m, s[0], s[1]) : true)) { const ty = onWater ? m.waterSurf(Math.floor(s[0]), Math.floor(s[1])) - .05 : m.topAt(s[0], s[1]); flyTo(b, s[0], s[1], ty, 1.5); b.f.water = onWater; } else b.t = 6; }
        continue; }
      // ----- au sol (ou sur l'eau pour la mouette) -----
      if (b.st === 'ground' || b.st === 'float') { b.t -= dt; const fl = b.st === 'float';
        b.y = fl ? m.waterSurf(Math.floor(b.x), Math.floor(b.z)) - .05 + Math.sin(b.ph * 1.8 + b.x) * .015 : m.topAt(b.x, b.z);
        b.open = Math.max(0, b.open - dt * 3); // les ailes se replient
        if (d < (c.gull ? 4.5 : 3.2) || (runP && d < 6)) { if (c.gull) gullUp(b, m, p); else takeOff(m, p, b, true); G.sfx && G.sfx('swing', .12); continue; }
        if (!c.gull && d > 45) { if (!place(m, p, b)) b.st = 'gone'; continue; }
        // marcher / sautiller
        let jy = 0; if (b.hop > 0) { b.hop -= dt; const dur = c.hop ? .26 : .5, u = 1 - b.hop / dur, sp = c.hop ? .9 : .45, nx = b.x + Math.sin(b.yaw) * dt * sp, nz = b.z + Math.cos(b.yaw) * dt * sp;
          if (fl ? isWater(m, nx, nz) : okGround(m, nx, nz)) { b.x = nx; b.z = nz; } else b.hop = 0; jy = c.hop ? Math.sin(u * PI) * .07 * (c.s / .2) : 0; b.step = (b.step || 0) + dt * 9; }
        if (b.peck > 0) b.peck -= dt;
        if (b.t < 0) { const r = R(); b.t = .35 + R() * 1.4;
          if (r < .4 && !fl) { b.hop = c.hop ? .26 : .5 + R() * .6; b.yaw = wrapA(b.yaw + (R() - .5) * 1.2); }
          else if (r < .7 && !fl) b.peck = .6; else if (r < .85) { b.look = (R() - .5) * 2.2; } else if (r < .92) b.preen = 1.2; else b.yaw = wrapA(b.yaw + (R() - .5) * 2.2);
          if (c.gull && R() < .06) { gullUp(b, m, p); continue; } if (!c.gull && R() < .03) takeOff(m, p, b, false); }
        if ((b.sing -= dt) < 0) { b.sing = 4 + R() * 9; chirp(b.k, d); b.look = (R() - .5) * 1.6; }
        if (b.preen > 0) b.preen -= dt;
        // poses : picorer, hocher la tête (pigeon qui marche), regarder par à-coups, se lisser les plumes, la queue qui frétille
        const pk = b.peck > 0 ? Math.max(0, Math.sin((.6 - b.peck) / .6 * PI * 3)) : 0, bob = c.walk && b.hop > 0 ? Math.sin(b.step) * .12 : 0;
        g.position.set(b.x, b.y + jy, b.z); g.rotation.set(pk * .35, b.yaw, 0, 'YXZ');
        const hy = b.preen > 0 ? 2.2 * Math.sin(Math.min(1, b.preen) * PI) : b.look; b.head.rotation.set(pk * 1.2 + (b.preen > 0 ? .5 : 0), hy, 0); b.head.position.z = (NECK[2] + bob) * c.s;
        b.body.rotation.x = Math.sin(b.ph * 7) * .015; b.legs.visible = !fl; wingPose(b, b.open, 0, 0); continue; }
      // ----- en vol -----
      if (b.st === 'fly') { const f = b.f; f.u += dt / f.dur; const u = Math.min(1, f.u), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const px = b.x, pz = b.z; b.x = f.x0 + (f.x1 - f.x0) * e; b.z = f.z0 + (f.z1 - f.z0) * e; b.y = f.y0 + (f.y1 - f.y0) * e + Math.sin(u * PI) * f.h;
        const vx = b.x - px, vz = b.z - pz; if (vx * vx + vz * vz > 1e-8) b.yaw = Math.atan2(vx, vz); // le bec dans le sens du vol
        const climb = Math.cos(u * PI) * .35; g.position.set(b.x, b.y, b.z); g.rotation.set(-climb * (u < .85 ? 1 : -1.6), b.yaw, 0, 'YXZ');
        b.open = Math.min(1, b.open + dt * 8);
        // petits oiseaux : vol bondissant (battements puis ailes fermées) ; pigeon et mouette : battements et courts planés ; à l'arrivée, ailes déployées pour freiner
        let flap = 1, open = b.open; const landing = u > .82;
        if (landing) { flap = .6; } else if (c.hop) { const cyc = (b.ph * 2.2) % 1; if (cyc > .62 && u > .2) { open = .15; flap = 0; } } else if (u > .3 && u < .7 && Math.sin(b.ph * 1.7) > .3) flap = 0;
        b.beat += dt * TAU * c.hz * (landing ? 1.3 : 1) * (flap > 0 ? 1 : 0); wingPose(b, open, flap, b.beat, .14); b.legs.visible = landing; b.head.rotation.set(0, 0, 0); b.head.position.z = NECK[2] * c.s;
        if (u >= 1 && f.toSoar) { b.st = 'soar'; b.t = 10 + R() * 20; continue; }
        if (u >= 1) { b.st = f.water ? 'float' : 'ground'; b.t = c.gull ? 4 + R() * 8 : 1 + R() * 2; b.y = f.y1; } continue; }
      if (b.st === 'gone' && place(m, p, b)) b.g.visible = true; } });
})();
