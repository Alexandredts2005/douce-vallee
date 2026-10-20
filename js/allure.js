'use strict';
// ===== Allure réaliste du joueur : un vrai cycle de marche et de course, calqué sur la biomécanique humaine.
// • Chaque jambe suit son cycle : attaque du talon, appui (le genou amortit), poussée, puis la jambe repasse devant genou plié.
// • La foulée avance avec la distance parcourue (les pieds ne glissent plus), sa longueur grandit avec la vitesse ;
//   la marche se change en course sans à-coup (en courant, il y a un temps de vol, le talon remonte haut derrière).
// • Le bassin monte et descend selon la longueur réelle des jambes (le pied d'appui reste au sol), se balance sur la jambe d'appui,
//   tourne avec les pas ; le buste tourne en sens inverse ; les bras balancent à l'opposé des jambes, coudes pliés en courant.
// • La tête reste stable et regarde où l'on va ; le corps se penche en accélérant et dans les virages.
// • Au repos : respiration, report du poids d'une jambe sur l'autre, regards autour de soi.
// • Saut : on s'accroupit pour prendre l'élan, on décolle en poussant, on tend les jambes pour se recevoir, on amortit en pliant
//   les genoux (plus de personnage qui s'écrase comme un dessin animé).
// • Toutes les articulations passent d'une position à l'autre en douceur : aucun mouvement brusque. =====
(function () {
  const PI = Math.PI, TAU = PI * 2, clamp = G.clamp, TH = .29, SHN = .35, HIP = .64;
  const sm = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }, mix = (a, b, t) => a + (b - a) * t;
  // courbe cyclique à clés [phase, valeur], interpolée en douceur
  const curve = K => p => { p -= Math.floor(p); let i = K.length - 1; while (i > 0 && K[i][0] > p) i--; const a = K[i], b = K[(i + 1) % K.length], p1 = i + 1 < K.length ? b[0] : 1 + b[0], t = (p - a[0]) / (p1 - a[0]); return a[1] + (b[1] - a[1]) * (.5 - .5 * Math.cos(clamp(t, 0, 1) * PI)); };
  // phase 0 = le talon touche le sol ; cuisse < 0 = vers l'avant ; genou > 0 = plié
  const WALK = { hip: curve([[0, -.4], [.13, -.3], [.5, .27], [.62, .3], [.78, -.12], [.9, -.44]]), knee: curve([[0, .04], [.12, .26], [.38, .07], [.55, .2], [.66, .72], [.74, .92], [.86, .42], [.96, .03]]), stance: .62 };
  const RUN = { hip: curve([[0, -.48], [.36, .5], [.48, .42], [.68, -.5], [.84, -.72], [.95, -.55]]), knee: curve([[0, .32], [.14, .62], [.36, .32], [.52, 1.45], [.64, 1.95], [.8, 1.15], [.94, .38]]), stance: .38 };
  const reach = (h, k) => TH * Math.cos(h) + SHN * Math.cos(h + k); // hauteur verticale de la hanche au pied
  const stride = v => .85 + .27 * v; // longueur d'un cycle complet (deux pas), en mètres

  function state(p) { return p._al || (p._al = { ph: 0, j: {}, look: 0, lookT: 2, lookY: 0, lookX: 0, land: 0, wasG: true, vyMin: 0, ax: 0, lastV: 0, yaw: p.yaw, turn: 0, step: [0, 0] }); }
  // les articulations : on part de la position actuelle (un véhicule ou une pose a pu les placer) et on va vers la cible en douceur
  function drive(C, T, dt, rate) {
    const k = 1 - Math.exp(-rate * dt), go = (cur, tgt) => cur + (tgt - cur) * k;
    C.legL.rotation.x = go(C.legL.rotation.x, T.hipL); C.legR.rotation.x = go(C.legR.rotation.x, T.hipR);
    C.armL.rotation.x = go(C.armL.rotation.x, T.armL); C.armR.rotation.x = go(C.armR.rotation.x, T.armR);
    C.armL.rotation.z = go(C.armL.rotation.z, T.armLz); C.armR.rotation.z = go(C.armR.rotation.z, T.armRz);
    if (C.shinL) { const kv = (g, t) => { const c = g.userData.k != null ? g.userData.k : g.rotation.x; g.userData.k = go(c, t); }; kv(C.shinL, T.kneeL); kv(C.shinR, T.kneeR); kv(C.faL, T.elbL); kv(C.faR, T.elbR); }
    C.body.position.y = go(C.body.position.y, T.bob); C.body.position.x = go(C.body.position.x, T.px);
    C.body.rotation.x = go(C.body.rotation.x, T.bodyX); C.body.rotation.y = go(C.body.rotation.y, T.pelvY); C.body.rotation.z = go(C.body.rotation.z, T.roll);
    if (C.chest) { C.chest.rotation.x = go(C.chest.rotation.x, T.lean); C.chest.rotation.y = go(C.chest.rotation.y, T.chestY); }
    C.head.rotation.x = go(C.head.rotation.x, T.headX); C.head.rotation.y = go(C.head.rotation.y, T.headY); C.head.rotation.z = go(C.head.rotation.z, T.headZ || 0);
    C.body.scale.set(1, 1, 1);
  }

  // ---------- marche, course et repos : partagés par le joueur, les autres joueurs en ligne et les habitants ----------
  function loco(s, T, hs, dt, t) {
    const wMove = sm(.08, .9, hs), wRun = sm(3.9, 5.7, hs), amp = clamp(hs / 2.6, .3, 1);
    s.ph += hs * dt / stride(hs); const pL = s.ph, pR = s.ph + .5;
    const G1 = (g, p) => mix(WALK[g](p), RUN[g](p), wRun);
    const hipL = G1('hip', pL) * amp, hipR = G1('hip', pR) * amp, kneeL = G1('knee', pL) * amp, kneeR = G1('knee', pR) * amp;
    // bras : à l'opposé des jambes, avec un léger retard ; coudes pliés en courant
    const armL = -mix(.95, 1.05, wRun) * G1('hip', pL - .04) * amp - .05 - wRun * .15, armR = -mix(.95, 1.05, wRun) * G1('hip', pR - .04) * amp - .05 - wRun * .15;
    const elb = a => -(mix(.22, 1.3, wRun) + Math.max(0, -a) * mix(.3, .35, wRun));
    // repos : respiration, report du poids, regards
    const w = Math.sin(t * TAU / 7.5), wl = Math.max(0, w), wr = Math.max(0, -w);
    const idle = { hipL: -.05 * wl + .02, hipR: -.05 * wr + .02, kneeL: .05 + .17 * wl, kneeR: .05 + .17 * wr, px: .016 * w, roll: .025 * w };
    T.hipL = mix(idle.hipL, hipL, wMove); T.hipR = mix(idle.hipR, hipR, wMove); T.kneeL = mix(idle.kneeL, kneeL, wMove); T.kneeR = mix(idle.kneeR, kneeR, wMove);
    T.armL = mix(.03 + .015 * Math.sin(t * 2.1), armL, wMove); T.armR = mix(.03 + .015 * Math.sin(t * 2.1 + .3), armR, wMove);
    T.armLz = -mix(.075 + .012 * Math.sin(t * 2.1), .1, wMove); T.armRz = mix(.075 + .012 * Math.sin(t * 2.1), .1, wMove);
    T.elbL = mix(-.14, elb(armL), wMove); T.elbR = mix(-.14, elb(armR), wMove);
    // bassin : il tourne avec les pas, se déporte sur la jambe d'appui ; le buste tourne en sens inverse
    T.pelvY = (hipR - hipL) * .5 * .2 * wMove; T.chestY = -(hipR - hipL) * .5 * .42 * wMove;
    T.px = mix(idle.px, -.013 * Math.cos(TAU * (pL - .3)) * (1 - wRun), wMove); T.roll = mix(idle.roll, 0, wMove) + clamp(-s.turn * hs * .011, -.13, .13);
    T.lean = mix(-.012 * Math.sin(t * 2.1), mix(.05, .17, wRun) + clamp(s.ax * .012, -.08, .12), wMove);
    // la tête reste droite et regarde dans le virage ; au repos elle regarde autour
    if ((s.lookT -= dt) < 0) { s.lookT = 2.5 + Math.random() * 4.5; const far = Math.random() < .35; s.lookY = (Math.random() - .5) * (far ? 1.2 : .45); s.lookX = (Math.random() - .3) * .16; }
    T.headY = mix(s.lookY, clamp(s.turn * .12, -.4, .4), wMove) - T.chestY * .8 - T.pelvY; T.headX = mix(s.lookX + .015 * Math.sin(t * 2.1), -.04, wMove) - T.lean * .8; T.headZ = -T.roll * .6;
    return { wMove, wRun, pL, pR };
  }
  const settle = (T, s, o) => { // le pied d'appui reste au sol ; en courant, le bassin est le plus bas au milieu de l'appui, le plus haut pendant le vol
    const geo = Math.min(0, Math.max(reach(T.hipL, T.kneeL), reach(T.hipR, T.kneeR)) - HIP), runB = -.06 + .035 * (.5 - .5 * Math.cos(TAU * 2 * (o.pL - .19)));
    T.bob = mix(geo, Math.min(geo + .02, runB), o.wRun * o.wMove * (1 - (o.crouch || 0))); };
  G.on('init', () => { const PP = G.Player.prototype;
    PP.animate = function (dt, hs) {
      const C = this.C; if (!C) return; C._gait = true; const s = state(this), t = performance.now() / 1000; dt = Math.min(dt || 0, .05); if (!dt) return;
      const T = { hipL: 0, hipR: 0, kneeL: .05, kneeR: .05, armL: .03, armR: .03, armLz: -.07, armRz: .07, elbL: -.14, elbR: -.14, bob: 0, px: 0, bodyX: 0, pelvY: 0, roll: 0, lean: 0, chestY: 0, headX: 0, headY: 0, headZ: 0 };
      let expr = 'normal', rate = 22, ground = false;
      this.idleT = hs > .2 || !this.onGround || this.act ? 0 : this.idleT + dt;
      // virages et accélération (pour se pencher)
      let dy = this.yaw - s.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); s.turn = mix(s.turn, dy / dt, 1 - Math.exp(-8 * dt)); s.yaw = this.yaw;
      s.ax = mix(s.ax, (hs - s.lastV) / dt, 1 - Math.exp(-6 * dt)); s.lastV = hs;
      if (this.sit) { const q = this.sit.pose || (G.sitPose ? G.sitPose(.5) : { thigh: -1.45, arm: -.3, bob: -.3, lean: 0, shin: 1.4, fore: -.6 });
        T.hipL = T.hipR = q.thigh; T.armL = T.armR = q.arm; T.armLz = -(q.armZ || 0); T.armRz = q.armZ || 0; T.bob = q.bob; T.bodyX = q.lean || 0; T.kneeL = T.kneeR = q.shin != null ? q.shin : 1.4; T.elbL = T.elbR = q.fore != null ? q.fore : -.6;
        T.headX = Math.sin(t * .6) * .05; T.headY = Math.sin(t * .27) * .25; T.lean = -.012 * Math.sin(t * 2.1); rate = 12; }
      else if (this.swim) { // brasse : les bras tirent, les jambes poussent
        const c = (t * .95) % 1, pull = curve([[0, 0], [.35, 1], [.55, .2], [1, 0]])(c), kick = curve([[0, .2], [.3, 0], [.5, 1], [.75, .1]])(c);
        T.bodyX = .5; T.armL = T.armR = -2.6 + pull * 1.4; T.armLz = -.25 - pull * .9; T.armRz = .25 + pull * .9; T.elbL = T.elbR = -.2 - pull * .7;
        T.hipL = T.hipR = .25 - kick * .55; T.kneeL = T.kneeR = .2 + kick * 1.3; T.bob = -.05; T.headX = -.35; rate = 14; }
      else if (!this.onGround) { // en l'air
        const up = sm(-3, 3, this.vy), big = this.airBig ? 1 : 0, lead = s.lead || 0, A = lead ? 'R' : 'L', B = lead ? 'L' : 'R';
        T['hip' + A] = mix(-.15, -.8, up); T['knee' + A] = mix(.35, 1.15, up); T['hip' + B] = mix(-.05, .3, up); T['knee' + B] = mix(.45, .6, up);
        T.armL = T.armR = mix(-.55, big ? -2.3 : -1.1, up); T.armLz = -mix(.55, .22, up); T.armRz = mix(.55, .22, up); T.elbL = T.elbR = -mix(.35, .5, up);
        T.lean = mix(.05, .12, up); T.headX = mix(.12, -.12, up); s.vyMin = Math.min(s.vyMin, this.vy); expr = this.vy > 4 ? 'happy' : 'normal'; rate = 12; }
      else { ground = true;
        // ---------- marche et course ----------
        const { wMove, wRun, pL, pR } = loco(s, T, hs, dt, t);
        // accroupi pour sauter (charge) ou après s'être reçu (amorti)
        const c = this.charging ? this.charge : 0, L = s.land;
        if (c > 0) { T.hipL = mix(T.hipL, -.62, c); T.hipR = mix(T.hipR, -.62, c); T.kneeL = mix(T.kneeL, 1.25, c); T.kneeR = mix(T.kneeR, 1.25, c); T.lean += .38 * c; T.headX -= .3 * c; T.armL = T.armR = mix(T.armL, .7, c); T.elbL = T.elbR = -.35; expr = this.maxed ? 'happy' : 'normal';
          C.body.position.x = this.maxed ? (Math.random() - .5) * .012 : C.body.position.x; }
        if (L > .01) { T.hipL += -.45 * L; T.hipR += -.45 * L; T.kneeL += .95 * L; T.kneeR += .95 * L; T.lean += .28 * L; T.armL += -.4 * L; T.armR += -.4 * L; T.armLz -= .22 * L; T.armRz += .22 * L; T.headX -= .2 * L; }
        settle(T, s, { wMove, wRun, pL, crouch: sm(0, .3, c + L) });
        // les pas : un son à chaque attaque du talon
        if (wMove > .35) for (const [i, p] of [[0, pL], [1, pR]]) { const f = p - Math.floor(p); if (s.step[i] > .8 && f < .2) { G.sfx('step', .55 + wRun * .35); if (wRun > .5) G.fx.puff(this.x, this.y + .03, this.z, 1, 0xf3ead2, .3); } s.step[i] = f; }
        if (!this.charging && this.idleT > 9) { const k = (this.idleT - 9) % 14; if (k > 6 && k < 7.8) { const e = Math.sin((k - 6) / 1.8 * PI); T.armL = T.armR = -2.8 * e; T.armLz = -.25 * e; T.armRz = .25 * e; T.elbL = T.elbR = -.3; T.lean -= .1 * e; T.headX -= .25 * e; expr = 'happy'; } }
      }
      // décollage / réception
      if (!this.onGround && s.wasG) { s.lead = Math.sin(TAU * s.ph) > 0 ? 1 : 0; s.vyMin = 0; this.airBig = this.vy > 7; }
      if (this.onGround && !s.wasG) { s.land = Math.max(s.land, clamp(-s.vyMin / 13, .22, 1)); }
      s.wasG = this.onGround; s.land *= Math.exp(-dt * 4.2); if (this.squash > 0) this.squash -= dt;
      // ---------- émotes, gestes, outils (par-dessus) ----------
      if (this.emote) { const e = this.emote; e.t += dt; const p = e.t; rate = 30;
        if (e.id === 'salut') { T.armR = -2.6 + Math.sin(p * 9) * .15; T.armRz = .45 + Math.sin(p * 9) * .3; T.elbR = -.5 - Math.sin(p * 9) * .3; T.headZ = .08; expr = 'happy'; }
        else if (e.id === 'danse') { const d = Math.sin(p * 7); T.armL = -2.2 + d * .45; T.armR = -2.2 - d * .45; T.elbL = T.elbR = -.6; T.hipL = Math.max(0, d) * -.35; T.hipR = Math.max(0, -d) * -.35; T.kneeL = .2 + Math.max(0, d) * .6; T.kneeR = .2 + Math.max(0, -d) * .6; T.px = d * .04; T.roll = d * .06; T.headY = d * .2; T.bob = -.03 - Math.abs(d) * .03; expr = 'happy'; if (Math.floor(p * 2) !== e.k) { e.k = Math.floor(p * 2); G.popup('♪', this.x + (Math.random() - .5), this.y + 1.5, this.z); } }
        else if (e.id === 'rire') { T.bob += -Math.abs(Math.sin(p * 14)) * .015; T.lean += .12; T.armL = T.armR = -.5; T.elbL = T.elbR = -1.1; expr = 'happy'; T.headX = -.2 + Math.sin(p * 14) * .05; }
        else if (e.id === 'bravo') { const b = Math.sin(p * 14); T.armL = T.armR = -1.25; T.elbL = T.elbR = -1.2; T.armLz = -.35 + b * .25; T.armRz = .35 - b * .25; expr = 'happy'; if (Math.floor(p * 2.3) !== e.k) { e.k = Math.floor(p * 2.3); G.sfx('chop', .25); } }
        else if (e.id === 'assis') { T.hipL = T.hipR = -1.5; T.kneeL = T.kneeR = 1.4; T.bob = -.33; T.armL = T.armR = -.25; T.elbL = T.elbR = -.5; T.lean = .1; rate = 10; }
        else if (e.id === 'dodo') { T.hipL = T.hipR = -1.5; T.kneeL = T.kneeR = 1.4; T.bob = -.33; T.headX = .4; T.lean = .2; expr = 'sleepy'; rate = 8; if (Math.floor(p) !== e.k) { e.k = Math.floor(p); G.popup('z', this.x + .3, this.y + 1.2, this.z); } }
        else if (e.id === 'surprise') { expr = 'surprised'; T.bob = p < .3 ? Math.sin(p / .3 * PI) * .06 : 0; T.armL = T.armR = -.9; T.armLz = -.55; T.armRz = .55; T.elbL = T.elbR = -1.3; T.lean = -.1; T.headX = -.1; }
        else if (e.id === 'triste') { expr = 'sad'; T.headX = .38; T.lean = .12; T.armL = T.armR = .08; T.armLz = -.03; T.armRz = .03; rate = 8; }
        else if (e.id === 'clin') { expr = 'wink'; T.armR = -1.4; T.armRz = .25; T.elbR = -1.6; T.headZ = .12; }
        if (e.dur && e.t > e.dur) this.emote = null; }
      if (this.show) { this.show.t += dt; T.armL = T.armR = -2.9; T.armLz = -.2; T.armRz = .2; T.elbL = T.elbR = -.25; T.lean -= .08; T.headX = -.25; expr = 'happy'; if (this.show.t > this.show.dur) G.feat.endShow(this); }
      if (this.act) { const a = this.act, p = clamp(a.t / a.dur, 0, 1); rate = 30;
        if (a.kind === 'eat') { T.armR = -1.7 + Math.sin(p * 14) * .15; T.elbR = -1.8; T.armL = -.9; T.elbL = -1.3; T.headX = .08; expr = 'happy'; }
        else if (a.kind === 'place') { const e = Math.sin(p * PI); T.armR = T.armL = -1.0 * e; T.elbL = T.elbR = -.4; T.lean += .35 * e; T.kneeL += .35 * e; T.kneeR += .35 * e; T.hipL += -.25 * e; T.hipR += -.25 * e; T.headX += .2 * e; if (ground) T.bob = Math.min(0, Math.max(reach(T.hipL, T.kneeL), reach(T.hipR, T.kneeR)) - HIP); }
        else { // coup d'outil : on arme derrière la tête, puis on frappe en se penchant
          const back = p < .42 ? G.smooth(p / .42) : 1 - G.smooth((p - .42) / .2), hit = p < .42 ? 0 : G.smooth((p - .42) / .3);
          T.armR = -2.75 * back + .35 * hit; T.elbR = -.9 * back - .2; T.armL = -1.2 * back - .5 * hit; T.elbL = -.8; T.lean += -.12 * back + .3 * hit; T.chestY += .25 * back - .15 * hit; T.kneeL += .25 * hit; T.kneeR += .25 * hit;
          if (ground) T.bob = Math.min(0, Math.max(reach(T.hipL, T.kneeL), reach(T.hipR, T.kneeR)) - HIP); rate = 40; } }
      if (this.fish) { T.armR = -1.0 + (this.fish.phase === 'bite' ? Math.sin(t * 30) * .12 : 0); T.elbR = -.6; T.armL = -.8; T.elbL = -1.0; if (this.fish.phase === 'bite') expr = 'surprised'; }
      if (this.hurtT > 0) expr = 'sad';
      drive(C, T, dt, rate);
      // expressions, clignements, flash quand on a mal
      this.blinkT -= dt; if (this.blinkT < 0) this.blinkT = 2.5 + Math.random() * 3;
      if (expr === 'normal' && this.blinkT < .12) expr = 'blink';
      if (C.setExpr) C.setExpr(expr); else C.eyes.scale.y = expr === 'blink' ? .15 : 1;
      if (this.hurtT > 0) { this.hurtT -= dt; const on = Math.floor(this.hurtT * 12) % 2 === 0; for (const mm of C.meshes) mm.material = on ? (mm.isSkinnedMesh ? G.M.hurtSk : G.M.hurt) : mm.userData.mat0; this._hurtOn = true; }
      else if (this._hurtOn) { for (const mm of C.meshes) mm.material = mm.userData.mat0; this._hurtOn = false; }
    };
    // le personnage tourne un peu moins sec (on voit le corps pivoter)
    PP.gaitSteps = true;
  });
  // ---------- la même allure pour les autres : joueurs en ligne et habitants ----------
  // o : { hs (vitesse), air, vy, yaw, wave (coucou), talk (parle), sit, swim }
  function pose(C, o, dt) {
    if (!C || !C.legL) return; dt = Math.min(dt || 0, .05); if (!dt) return; C._gait = true; const s = C._al || (C._al = { ph: Math.random(), turn: 0, ax: 0, lastV: 0, yaw: o.yaw || 0, lookT: Math.random() * 3, lookY: 0, lookX: 0, vyMin: 0, wasG: true, land: 0 }), t = performance.now() / 1000 + (s.off || (s.off = Math.random() * 50));
    const T = { hipL: 0, hipR: 0, kneeL: .05, kneeR: .05, armL: .03, armR: .03, armLz: -.07, armRz: .07, elbL: -.14, elbR: -.14, bob: 0, px: 0, bodyX: 0, pelvY: 0, roll: 0, lean: 0, chestY: 0, headX: 0, headY: 0, headZ: 0 };
    const hs = o.hs || 0; let dy = (o.yaw || 0) - s.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); s.turn = mix(s.turn, dy / dt, 1 - Math.exp(-8 * dt)); s.yaw = o.yaw || 0; s.ax = mix(s.ax, (hs - s.lastV) / dt, 1 - Math.exp(-6 * dt)); s.lastV = hs;
    let rate = 18;
    if (o.sit) { T.hipL = T.hipR = -1.5; T.kneeL = T.kneeR = 1.4; T.bob = -.33; T.armL = T.armR = -.3; T.elbL = T.elbR = -.6; T.headY = Math.sin(t * .27) * .25; rate = 12; }
    else if (o.swim) { const c = (t * .95) % 1, pull = Math.max(0, Math.sin(c * TAU)), kick = Math.max(0, Math.sin(c * TAU + 2)); T.bodyX = .5; T.armL = T.armR = -2.6 + pull * 1.4; T.armLz = -.25 - pull * .9; T.armRz = .25 + pull * .9; T.hipL = T.hipR = .25 - kick * .55; T.kneeL = T.kneeR = .2 + kick * 1.3; T.bob = -.05; T.headX = -.35; }
    else if (o.air) { const up = sm(-3, 3, o.vy || 0); T.hipL = mix(-.15, -.8, up); T.kneeL = mix(.35, 1.15, up); T.hipR = mix(-.05, .3, up); T.kneeR = mix(.45, .6, up); T.armL = T.armR = mix(-.55, -1.1, up); T.armLz = -mix(.55, .22, up); T.armRz = mix(.55, .22, up); T.elbL = T.elbR = -.4; s.vyMin = Math.min(s.vyMin, o.vy || 0); rate = 12; }
    else { const r = loco(s, T, hs, dt, t); if (s.land > .01) { const L = s.land; T.hipL += -.45 * L; T.hipR += -.45 * L; T.kneeL += .95 * L; T.kneeR += .95 * L; T.lean += .28 * L; } settle(T, s, Object.assign(r, { crouch: sm(0, .3, s.land) })); }
    if (!o.air && !s.wasG) s.land = clamp(-s.vyMin / 13, .2, 1); if (o.air && s.wasG) s.vyMin = 0; s.wasG = !o.air; s.land *= Math.exp(-dt * 4.2);
    if (o.wave) { T.armR = -2.6 + Math.sin(t * 9) * .15; T.armRz = .45 + Math.sin(t * 9) * .3; T.elbR = -.5 - Math.sin(t * 9) * .3; T.headZ = .08; rate = 26; }
    if (o.talk) { const g = Math.sin(t * 3.1), h = Math.sin(t * 2.3 + 1); T.armL = -.35 + g * .25; T.elbL = -1.1 + h * .3; T.armR = mix(T.armR, -.3 - h * .2, o.wave ? 0 : 1); if (!o.wave) T.elbR = -1.0 - g * .25; T.headX += Math.sin(t * 4.2) * .04; T.headZ += Math.sin(t * 1.7) * .05; }
    drive(C, T, dt, rate);
  }
  G.gait = { WALK, RUN, curve, reach, stride, pose };
})();
