'use strict';
// ===== Audio synthétisé : effets, voix "animalaise", musique horaire, ambiances =====
(function () {
  const A = G.audio = { ctx: null, ok: false, vm: .45, vs: .7, inside: false };
  let noiseBuf = null;
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      const C = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
      A.master = C.createGain(); A.master.gain.value = 1; A.master.connect(C.destination);
      A.sfxG = C.createGain(); A.sfxG.gain.value = A.vs; A.sfxG.connect(A.master);
      A.musF = C.createBiquadFilter(); A.musF.type = 'lowpass'; A.musF.frequency.value = 18000; A.musF.connect(A.master);
      A.musG = C.createGain(); A.musG.gain.value = A.vm * .5; A.musG.connect(A.musF);
      A.ambG = C.createGain(); A.ambG.gain.value = A.vs * .8; A.ambG.connect(A.master);
      noiseBuf = C.createBuffer(1, C.sampleRate * 2, C.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.ok = true; startAmb(); setInterval(musicTick, 60);
    } catch (e) { A.ok = false; }
  };
  A.setVol = (m, s) => { A.vm = m; A.vs = s; if (!A.ok) return; A.musG.gain.value = m * .5; A.sfxG.gain.value = s; A.ambG.gain.value = s * .8; };
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, dur, vol, t0 = 0, dest = null, att = .005) {
    const C = A.ctx, t = C.currentTime + t0, o = C.createOscillator(), g = C.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, att, dur, vol); o.connect(g); g.connect(dest || A.sfxG); o.start(t); o.stop(t + dur + att + .05);
  }
  function noise(dur, ft, f0, f1, vol, t0 = 0, q = 1, dest = null) {
    const C = A.ctx, t = C.currentTime + t0, s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = ft; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, .004, dur, vol); s.connect(f); f.connect(g); g.connect(dest || A.sfxG); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  const arp = (notes, step, type = 'triangle', vol = .2, dur = .14) => notes.forEach((n, i) => tone(type, n, n, dur, vol, i * step));
  const S = {
    jump: () => { tone('triangle', 330, 720, .14, .22); },
    bigjump: () => { tone('triangle', 260, 1100, .28, .25); tone('sine', 1500, 2400, .2, .08, .08); },
    chargemax: () => { tone('sine', 1320, 1320, .12, .12); tone('sine', 1980, 1980, .2, .08, .05); },
    land: () => { noise(.1, 'lowpass', 500, 200, .35); tone('sine', 130, 60, .1, .25); },
    step: () => { noise(.035, 'bandpass', 1100, 900, .05, 0, 2); },
    chop: () => { tone('triangle', 240, 150, .09, .35); noise(.07, 'bandpass', 1400, 900, .3, 0, 3); },
    crack: () => { tone('sawtooth', 190, 80, .55, .09); noise(.5, 'highpass', 1500, 3000, .12); },
    thud: () => { tone('sine', 95, 38, .4, .55); noise(.35, 'lowpass', 400, 120, .5); },
    leaves: () => { noise(.45, 'highpass', 2500, 4000, .14); },
    mine: () => { tone('square', 920, 700, .05, .12); tone('triangle', 1500, 1300, .09, .14, .01); noise(.06, 'highpass', 3000, 2000, .15); },
    dig: () => { noise(.13, 'lowpass', 900, 300, .4); noise(.1, 'lowpass', 700, 250, .3, .12); },
    swing: () => { noise(.18, 'bandpass', 500, 2200, .22, 0, 1.5); },
    splash: () => { noise(.5, 'lowpass', 2200, 300, .45); tone('sine', 700, 1300, .06, .1, .05); tone('sine', 900, 1600, .05, .08, .14); },
    pickup: () => { arp([660, 990], .07, 'triangle', .18, .1); },
    coin: () => { tone('square', 1320, 1320, .07, .07); tone('square', 1760, 1760, .2, .07, .07); },
    ui: () => { tone('sine', 880, 880, .04, .12); },
    open: () => { tone('triangle', 520, 800, .1, .15); },
    close: () => { tone('triangle', 800, 500, .1, .13); },
    place: () => { tone('triangle', 300, 220, .07, .25); noise(.06, 'lowpass', 900, 400, .25); },
    error: () => { tone('square', 190, 170, .1, .1); tone('square', 160, 150, .14, .1, .12); },
    pop: () => { noise(.05, 'highpass', 2500, 4000, .3); tone('sine', 900, 250, .09, .25); },
    hit: () => { tone('square', 220, 80, .1, .14); noise(.08, 'lowpass', 1500, 500, .3); },
    hurt: () => { tone('sawtooth', 420, 150, .22, .14); },
    eat: () => { for (let i = 0; i < 3; i++) noise(.05, 'bandpass', 2400, 1800, .25, i * .11, 3); },
    catch: () => { arp([523, 659, 784, 1047], .08, 'triangle', .2, .16); },
    bite: () => { tone('sine', 320, 140, .13, .4); },
    cast: () => { noise(.15, 'bandpass', 600, 1800, .15); tone('sine', 1200, 900, .05, .12, .35); },
    water: () => { noise(.45, 'highpass', 2600, 2200, .14); },
    craft: () => { arp([784, 988, 1175, 1568], .06, 'sine', .16, .2); noise(.4, 'highpass', 5000, 7000, .05, .2); },
    door: () => { tone('square', 150, 120, .05, .08); tone('triangle', 330, 210, .16, .15, .04); },
    sleep: () => { arp([784, 659, 523, 392], .22, 'sine', .16, .4); },
    boing: () => { tone('sine', 180, 420, .12, .2); },
    fanfare: () => { arp([523, 659, 784, 659, 1047], .1, 'square', .07, .18); },
    shake: () => { noise(.35, 'highpass', 2000, 3500, .2); },
    fall: () => { tone('sine', 600, 200, .3, .12); }
  };
  G.sfx = (n, v = 1) => { if (!A.ok || !S[n]) return; try { if (v === 1) S[n](); else { const g = A.sfxG.gain.value; A.sfxG.gain.value = g * v; S[n](); A.sfxG.gain.value = g; } } catch (e) { } };
  // voix animalaise : un petit "bip" par lettre
  A.blip = (ch, pitch = 1) => {
    if (!A.ok || !/[a-zàâçéèêëîïôûùüÿœ]/i.test(ch)) return;
    const C = A.ctx, t = C.currentTime, code = ch.toLowerCase().charCodeAt(0);
    const vowel = 'aeiouyéèàùô'.includes(ch.toLowerCase());
    const o = C.createOscillator(), f = C.createBiquadFilter(), g = C.createGain();
    o.type = vowel ? 'triangle' : 'square';
    const base = 260 * pitch * (1 + (code % 7) * .045);
    o.frequency.setValueAtTime(base * (vowel ? 1.25 : 1), t); o.frequency.linearRampToValueAtTime(base * (vowel ? 1.1 : .95), t + .05);
    f.type = 'bandpass'; f.frequency.value = vowel ? 1100 + (code % 5) * 160 : 2200; f.Q.value = 2.5;
    env(g, t, .004, .055, vowel ? .22 : .1); o.connect(f); f.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + .09);
  };

  // ---------- Musique procédurale (change à chaque heure, comme au village) ----------
  const M = A.music = { hour: -1, step: 0, next: 0, pat: null, on: true };
  const PENTA = [0, 2, 4, 7, 9], ROOTS = [57, 60, 62, 55, 64, 59, 61, 56, 58, 63, 53, 65];
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  function genPattern(h) {
    const r = G.rng(h * 7919 + 13), root = ROOTS[h % 12];
    const night = h < 6 || h >= 20, morning = h >= 6 && h < 11;
    const prog = G.pick([[0, 9, 5, 7], [0, 5, 9, 7], [0, 7, 9, 5], [0, 4, 5, 7]], r);
    const mel = []; let deg = 2 + Math.floor(r() * 3);
    for (let i = 0; i < 32; i++) {
      if (i % 16 >= 8 && i < 16) { mel.push(mel[i - 8]); continue; }
      if (r() < (night ? .5 : .32)) { mel.push(null); continue; }
      deg = G.clamp(deg + Math.floor(r() * 5) - 2, 0, 9); mel.push(deg);
    }
    return { root, prog, mel, bpm: night ? 68 : morning ? 104 : 92, night, shaker: !night && r() < .7, lead: night ? 'sine' : G.pick(['triangle', 'triangle', 'square'], r) };
  }
  function pluck(type, f, t, dur, vol) {
    const C = A.ctx, o = C.createOscillator(), g = C.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.musG); o.start(t); o.stop(t + dur + .05);
  }
  function musicTick() {
    if (!A.ok || !M.on || G.state === 'editor') return;
    const C = A.ctx, h = G.clock ? Math.floor(G.clock.min / 60) % 24 : 9;
    if (h !== M.hour) { M.hour = h; M.pat = genPattern(h + (G.clock ? G.clock.day * 3 : 0)); }
    const P = M.pat, spb = 60 / P.bpm / 2;
    if (M.next < C.currentTime) M.next = C.currentTime + .05;
    while (M.next < C.currentTime + .3) {
      const s = M.step % 32, bar = Math.floor(s / 8), t = M.next, ch = P.root + P.prog[bar];
      if (s % 8 === 0) { pluck('sine', mtof(ch - 24), t, spb * 6, .22); }
      if (s % 8 === 4) { pluck('sine', mtof(ch - 17), t, spb * 3, .14); }
      const triad = [0, 4, 7].map(x => ch + x - ([9, 4].includes(P.prog[bar]) && x === 4 ? 1 : 0));
      if (P.night) { if (s % 8 === 0) triad.forEach(n => pluck('sine', mtof(n - 12), t, spb * 7, .045)); }
      else if (s % 2 === 1) pluck('triangle', mtof(triad[(s >> 1) % 3]), t, spb * 1.6, .05);
      const d = P.mel[s]; if (d != null) { const n = P.root + 12 + PENTA[d % 5] + 12 * Math.floor(d / 5); pluck(P.lead, mtof(n), t, spb * (P.night ? 3 : 1.8), P.lead === 'square' ? .035 : .09); }
      if (P.shaker && s % 2 === 1) noise(.03, 'highpass', 7000, 7000, .025, t - C.currentTime, 1, A.musG);
      M.step++; M.next += spb;
    }
  }
  A.setInside = v => { if (!A.ok || v === A.inside) return; A.inside = v; A.musF.frequency.setTargetAtTime(v ? 1600 : 18000, A.ctx.currentTime, .3); };

  // ---------- Ambiances : cascade/rivière, vagues, grillons, oiseaux ----------
  const AM = G.amb = { fallG: null, seaG: null, t: 0 };
  function loopNoise(ft, f, q, vol) {
    const C = A.ctx, s = C.createBufferSource(), fl = C.createBiquadFilter(), g = C.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = ft; fl.frequency.value = f; fl.Q.value = q; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(A.ambG); s.start(); return g;
  }
  function startAmb() { AM.fallG = loopNoise('bandpass', 900, .6, 0); AM.seaG = loopNoise('lowpass', 420, .7, 0); }
  AM.update = (dt, o) => {
    if (!A.ok) return; const C = A.ctx; AM.t += dt;
    const fv = o.inside ? 0 : G.clamp(1 - o.fall / 18, 0, 1) * .5;
    AM.fallG.gain.setTargetAtTime(fv, C.currentTime, .4);
    const sv = o.inside ? 0 : G.clamp(1 - o.sea / 22, 0, 1) * (.25 + .2 * Math.sin(AM.t * .7));
    AM.seaG.gain.setTargetAtTime(sv, C.currentTime, .4);
    if (o.inside) return;
    if (o.night > .6 && Math.random() < dt * 1.6) { const f = 4200 + Math.random() * 600; for (let i = 0; i < 3; i++) tone('sine', f, f, .03, .025, i * .06, A.ambG); }
    if (o.night < .3 && Math.random() < dt * .35) { const f = 2200 + Math.random() * 1600; tone('sine', f, f * 1.35, .08, .03, 0, A.ambG); tone('sine', f * 1.1, f * 1.5, .07, .025, .12, A.ambG); }
  };
})();
