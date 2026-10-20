'use strict';
// ===== Oiseaux : moineaux, mésanges, rouges-gorges, merles et pigeons sautillent et picorent autour du joueur ; quand on approche,
// ils s'envolent en battant des ailes, planent, puis se reposent un peu plus loin. Des mouettes tournent au-dessus de l'eau.
// Chaque oiseau est modelé (corps fuselé, tête, bec, œil brillant, queue en éventail, pattes) et ses deux ailes sont articulées.
// Le jour seulement ; la nuit, ils dorment. =====
(function () {
  const PI = Math.PI, TAU = PI * 2, SP = {
    moineau: { body: 0x9a7350, belly: 0xd8c8a8, head: 0x8a6a4a, cap: 0x6a5a4a, wing: 0x7a5a3c, wing2: 0x4a3a2a, beak: 0x4a3a30, s: .2, w: 1 },
    mesange: { body: 0x7aa04a, belly: 0xf2d43a, head: 0xf6f6f2, cap: 0x3a6ad8, wing: 0x4a7ad8, wing2: 0x2a3a6a, beak: 0x2a2a2a, s: .18, w: 1 },
    rouge_gorge: { body: 0x8a7050, belly: 0xf08a3a, head: 0x8a7050, cap: 0x7a6040, wing: 0x7a6044, wing2: 0x5a4632, beak: 0x2a2a2a, s: .2, w: 1, face: 0xf08a3a },
    merle: { body: 0x1d1d22, belly: 0x26262c, head: 0x1d1d22, cap: 0x1d1d22, wing: 0x18181c, wing2: 0x101014, beak: 0xffa21a, s: .26, w: 1, ring: 0xffa21a },
    pigeon: { body: 0x9aa0ae, belly: 0xb0b4c0, head: 0x7a8292, cap: 0x7a8292, wing: 0xa8adba, wing2: 0x4a4e5a, beak: 0x3a3a3a, s: .32, w: 1, neck: 0x5a9a8a },
    mouette: { body: 0xf6f6f4, belly: 0xffffff, head: 0xffffff, cap: 0xffffff, wing: 0xb8c0cc, wing2: 0x2a2a2e, beak: 0xf2c41a, s: .42, w: 1.6 } };
  const KINDS = ['moineau', 'moineau', 'mesange', 'rouge_gorge', 'merle', 'pigeon', 'moineau', 'mesange'];
  // ---------- modèles : corps (sans les ailes) et une aile droite (l'aile gauche est la même, retournée) ----------
  const geo = {}, wgeo = {};
  function bodyGeo(k) { if (geo[k]) return geo[k]; const c = SP[k], b = G.mb(3300 + Object.keys(SP).indexOf(k)), sk = G.SK || {};
    b.S(sk.fabric); b.sph(.5, c.body, 0, .5, 0, .62, .55, 1, 0, 14, 10); b.sph(.42, c.belly, 0, .4, .08, .55, .48, .82, 0, 12, 8); // corps fuselé, ventre
    b.sph(.3, c.head, 0, .82, .44, 1, 1, 1, 0, 14, 10); b.sph(.31, c.cap, 0, .9, .4, .96, .55, .95, 0, 12, 6); // tête, calotte
    if (c.face) b.sph(.26, c.face, 0, .72, .58, .9, .8, .55, 0, 12, 8); if (c.neck) b.sph(.32, c.neck, 0, .66, .3, .95, .55, .8, 0, 12, 8);
    for (const s of [-1, 1]) { b.S(null); b.sph(.055, 0x0a0a0a, s * .2, .88, .6, 1, 1, .7, 0, 8, 6); b.sph(.018, 0xffffff, s * .21, .9, .64, 1, 1, 1, 0, 6, 4); if (c.ring) b.tor(.06, .012, c.ring, s * .2, .88, .6, 0, s * PI / 2, 0, 0, 10); } // yeux brillants
    b.S(null); b.cone(.09, .3, 8, c.beak, 0, .8, .82, PI / 2, 0, 0); // bec
    b.S(sk.fabric); for (let i = -2; i <= 2; i++) b.add(new THREE.SphereGeometry(1, 8, 4), i % 2 ? c.wing2 : c.wing, b.M(i * .06, .52, -.62, -.25, i * .12, 0, .07, .03, .3), 0, true); // queue en éventail
    b.S(null); for (const s of [-1, 1]) { b.cyl(.025, .02, .22, 5, 0xc89a6a, s * .14, .1, .05); b.box(.04, .015, .16, 0xc89a6a, s * .14, .005, .1); } // pattes
    const g = b.done(); g.scale(c.s, c.s, c.s); g.computeBoundingSphere(); return geo[k] = g; }
  function wingGeo(k) { if (wgeo[k]) return wgeo[k]; const c = SP[k], b = G.mb(3320), sk = G.SK || {}, w = c.w; b.S(sk.fabric);
    b.add(new THREE.SphereGeometry(1, 10, 6), c.wing, b.M(.32 * w, 0, 0, 0, 0, 0, .34 * w, .05, .26), 0, true); // aile, l'épaule à l'origine (côté +x)
    for (let i = 0; i < 5; i++) b.add(new THREE.SphereGeometry(1, 6, 4), i % 2 ? c.wing2 : c.wing, b.M((.45 + i * .07) * w, -.01, -.12 - i * .02, 0, -.2 - i * .12, 0, .1 * w, .025, .2), 0, true); // rémiges
    b.S(null); const g = b.done(); g.scale(c.s, c.s, c.s); g.computeBoundingSphere(); return wgeo[k] = g; }

  // ---------- un oiseau ----------
  function make(k) { const g = new THREE.Group(), body = new THREE.Mesh(bodyGeo(k), G.MATS), c = SP[k], wings = [];
    body.castShadow = true; g.add(body);
    for (const s of [1, -1]) { const piv = new THREE.Group(), m = new THREE.Mesh(wingGeo(k), G.MATS); m.castShadow = true; if (s < 0) m.scale.x = -1; piv.position.set(s * .2 * c.s, .62 * c.s, .05 * c.s); piv.add(m); g.add(piv); wings.push(piv); }
    return { k, g, body, wings, c, st: 'ground', t: 0, ph: Math.random() * TAU, x: 0, y: 0, z: 0, yaw: 0, hop: 0, peck: 0, flap: 0 }; }
  let birds = [], scene = null, live = false;
  const R = Math.random, N = 14, GULLS = 4;
  G.on('init', sc => { scene = sc; });
  const okGround = (m, x, z) => { const tx = Math.floor(x), tz = Math.floor(z); if (!m.inb(tx, tz)) return false; const i = m.idx(tx, tz); if (m.water[i]) return false; const o = m.objAt(tx, tz); return !o || G.OBJ[o.t].walk || !(G.OBJ[o.t].h > .3); };
  function landSpot(m, p, near) { for (let t = 0; t < 20; t++) { const a = R() * TAU, d = near ? 4 + R() * 10 : 10 + R() * 22, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (okGround(m, x, z)) return [x, z]; } return null; }
  function place(m, p, b) { const s = landSpot(m, p, false); if (!s) return false; b.x = s[0]; b.z = s[1]; b.y = m.topAt(b.x, b.z); b.st = 'ground'; b.t = 2 + R() * 4; b.yaw = R() * TAU; return true; }
  function takeOff(m, p, b, flee) { const s = landSpot(m, p, true) || landSpot(m, p, false); if (!s) return; const ax = flee ? b.x - p.x : 0, az = flee ? b.z - p.z : 0, L = Math.hypot(ax, az) || 1;
    let tx = s[0], tz = s[1]; if (flee) { tx = b.x + ax / L * (8 + R() * 8) + (R() - .5) * 6; tz = b.z + az / L * (8 + R() * 8) + (R() - .5) * 6; if (!okGround(m, tx, tz)) { tx = s[0]; tz = s[1]; } }
    b.st = 'fly'; b.f = { x0: b.x, y0: b.y, z0: b.z, x1: tx, z1: tz, y1: m.topAt(tx, tz), u: 0, L: Math.hypot(tx - b.x, tz - b.z), h: 2.5 + R() * 4 }; b.f.dur = Math.max(1.2, b.f.L / (4.5 + R() * 2)); }
  function seaPoint(m, p) { for (let t = 0; t < 30; t++) { const a = R() * TAU, d = 10 + R() * 40, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, tx = Math.floor(x), tz = Math.floor(z); if (m.inb(tx, tz) && m.water[m.idx(tx, tz)]) return [x, z, m.waterSurf(tx, tz)]; } return null; }

  G.on('frame', dt => { const m = G.map, p = G.player; dt = Math.min(dt || 0, .1); if (!scene || !m || !p) return;
    const day = G.night ? G.night() < .5 : true, on = day && !m.interior && G.state === 'play' && G.settings.quality !== 'low';
    if (!on) { if (live) { for (const b of birds) scene.remove(b.g); birds = []; live = false; } return; }
    if (!live) { live = true; for (let i = 0; i < N; i++) { const b = make(KINDS[i % KINDS.length]); if (place(m, p, b)) { scene.add(b.g); birds.push(b); } }
      const sp = seaPoint(m, p); if (sp) for (let i = 0; i < GULLS; i++) { const b = make('mouette'); b.st = 'soar'; b.cx = sp[0] + (R() - .5) * 10; b.cz = sp[1] + (R() - .5) * 10; b.y = sp[2] + 5 + R() * 5; b.r = 5 + R() * 8; b.a = R() * TAU; b.sp = (.25 + R() * .2) * (R() < .5 ? 1 : -1); scene.add(b.g); birds.push(b); } }
    for (const b of birds) { b.ph += dt; const g = b.g, W = b.wings;
      if (b.st === 'soar') { b.a += b.sp * dt; if (Math.hypot(b.cx - p.x, b.cz - p.z) > 90) { const sp = seaPoint(m, p); if (sp) { b.cx = sp[0]; b.cz = sp[1]; b.y = sp[2] + 5 + R() * 5; } }
        b.x = b.cx + Math.cos(b.a) * b.r; b.z = b.cz + Math.sin(b.a) * b.r; const yy = b.y + Math.sin(b.ph * .7) * .6; g.position.set(b.x, yy, b.z); g.rotation.set(0, -b.a + (b.sp > 0 ? PI : 0), b.sp > 0 ? -.35 : .35, 'YXZ');
        const flap = Math.sin(b.ph * .5) > .6 ? Math.sin(b.ph * 9) * .7 : .12 + Math.sin(b.ph * 1.3) * .05; W[0].rotation.z = flap; W[1].rotation.z = -flap; continue; }
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (b.st === 'ground') { b.t -= dt; b.y = m.topAt(b.x, b.z);
        if (d < 3.2 || (G.player.vx * G.player.vx + G.player.vz * G.player.vz > 30 && d < 6)) { takeOff(m, p, b, true); G.sfx && G.sfx('swing', .15); } // on approche : envol
        else if (d > 45) { if (!place(m, p, b)) b.st = 'gone'; }
        else { if (b.hop > 0) { b.hop -= dt; const u = 1 - b.hop / .28; b.x += Math.sin(b.yaw) * dt * .9; b.z += Math.cos(b.yaw) * dt * .9; if (!okGround(m, b.x, b.z)) { b.x -= Math.sin(b.yaw) * dt * .9; b.z -= Math.cos(b.yaw) * dt * .9; } b.jy = Math.sin(u * PI) * .07; } else b.jy = 0;
          if (b.peck > 0) b.peck -= dt; if (b.t < 0) { const r = R(); b.t = .4 + R() * 1.6; if (r < .45) { b.hop = .28; b.yaw += (R() - .5) * 1.4; } else if (r < .8) b.peck = .5; else b.yaw += (R() - .5) * 2.5; if (R() < .04) takeOff(m, p, b, false); } }
        const pk = b.peck > 0 ? Math.sin((.5 - b.peck) / .5 * PI * 3) * .5 + .4 : 0;
        g.position.set(b.x, b.y + (b.jy || 0), b.z); g.rotation.set(pk * .6, b.yaw, 0, 'YXZ'); const fold = .05 + Math.sin(b.ph * 2) * .02; W[0].rotation.set(0, -.15, fold); W[1].rotation.set(0, .15, -fold); continue; }
      if (b.st === 'fly') { const f = b.f; f.u += dt / f.dur; const u = Math.min(1, f.u), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        b.x = f.x0 + (f.x1 - f.x0) * e; b.z = f.z0 + (f.z1 - f.z0) * e; b.y = f.y0 + (f.y1 - f.y0) * e + Math.sin(u * PI) * f.h;
        const yaw = Math.atan2(f.x1 - f.x0, f.z1 - f.z0), climb = Math.cos(u * PI) * .35; g.position.set(b.x, b.y, b.z); g.rotation.set(-climb, yaw, 0, 'YXZ');
        const glide = u > .35 && u < .7 && Math.sin(b.ph * 2.2) > .2, a = glide ? .25 + Math.sin(b.ph * 3) * .05 : Math.sin(b.ph * 26) * 1.05 + .2; W[0].rotation.set(0, 0, a); W[1].rotation.set(0, 0, -a); // battements, petits vols planés
        if (u >= 1) { b.st = 'ground'; b.yaw = yaw; b.t = 1 + R() * 2; b.y = m.topAt(b.x, b.z); } continue; }
      if (b.st === 'gone' && place(m, p, b)) b.g.visible = true; } });
})();
