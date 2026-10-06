'use strict';
// ===== Architecture détaillée : motifs procéduraux (briques, pierre, bardage, tuiles, ardoises…) et vraies maisons =====
// Les motifs sont calculés dans le shader à partir de la position des sommets : aucun texte de plus, aucun appel de dessin en plus.
(function () {
  const MD = G.MODELS, TAU = Math.PI * 2;
  const PT = G.PAT = { brique: 1, pierre: 2, bardage: 3, tuiles: 4, bardeaux: 5, planches: 6, crepi: 7, ardoise: 8, moellons: 9, rondins: 10, carrelage: 11 };
  // ---------- matériau à motifs ----------
  const PAT_FS = `
varying float vPat; varying vec3 vOP; varying vec3 vON;
float dvH(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float dvN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(dvH(i), dvH(i + vec2(1., 0.)), f.x), mix(dvH(i + vec2(0., 1.)), dvH(i + vec2(1., 1.)), f.x), f.y); }
float dvJ(vec2 f, vec2 w, vec2 fw) { vec2 a = smoothstep(w - fw, w + fw, f) * (1. - smoothstep(1. - w - fw, 1. - w + fw, f)); return a.x * a.y; }
float dvE(float f, float w, float fw) { return smoothstep(0., w + fw, min(f, 1. - f)); }
vec3 dvPat(vec3 c) {
  float id = floor(vPat + .5);
  vec3 n = normalize(vON); vec2 uv;
  if (abs(n.y) > .97) uv = vOP.xz;
  else { vec3 u = normalize(vec3(0., 1., 0.) - n * n.y); vec3 l = normalize(cross(u, n)); uv = vec2(dot(vOP, l), dot(vOP, u)); }
  vec3 o = c, avg = c; float fade = 0.;
  if (id < 1.5) { // briques
    vec2 q = uv / vec2(.25, .1); q.x += mod(floor(q.y), 2.) * .5; vec2 f = fract(q), fw = fwidth(q);
    vec3 mo = mix(c, vec3(.9, .87, .82), .72); float r = dvH(floor(q));
    vec3 br = c * (.84 + .3 * r) * (1. - .1 * smoothstep(.55, 1., f.y));
    o = mix(mo, br, dvJ(f, vec2(.035, .09), fw)); avg = mix(mo, c, .82); fade = max(fw.x, fw.y);
  } else if (id < 2.5) { // pierre de taille
    vec2 q = uv / vec2(.42, .21); q.x += dvH(vec2(floor(q.y), 7.)); vec2 f = fract(q), fw = fwidth(q);
    float r = dvH(floor(q) + 3.);
    vec3 st = c * (.86 + .26 * r) * (1. + .1 * smoothstep(.7, .95, f.y));
    o = mix(c * .66, st, dvJ(f, vec2(.022, .045), fw)); avg = c * .95; fade = max(fw.x, fw.y);
  } else if (id < 3.5) { // bardage à clins
    float y = uv.y / .12, f = fract(y), fw = fwidth(y);
    o = c * mix(.72, 1.03, smoothstep(0., .2 + fw, f)) * (.97 + .05 * dvN(vec2(uv.x * 2.5, floor(y) * 5.3)));
    avg = c * .96; fade = fw;
  } else if (id < 4.5) { // tuiles en écailles
    vec2 q = uv / vec2(.2, .15); q.x += mod(floor(q.y), 2.) * .5; vec2 f = fract(q), fw = fwidth(q);
    float x = f.x * 2. - 1., e = .34 * (1. - sqrt(max(0., 1. - x * x))), r = dvH(floor(q) + 11.);
    o = c * (.88 + .22 * r) * mix(.6, 1.05, smoothstep(e, e + .22 + fw.y, f.y)) * mix(.78, 1., smoothstep(0., .07 + fw.x, 1. - abs(x)));
    avg = c * .9; fade = max(fw.x, fw.y);
  } else if (id < 5.5) { // bardeaux
    vec2 q = uv / vec2(.16, .13); q.x += dvH(vec2(floor(q.y), 19.)) * .9; vec2 f = fract(q), fw = fwidth(q); float r = dvH(floor(q) + 5.);
    o = c * (.8 + .34 * r) * mix(.64, 1.03, smoothstep(0., .18 + fw.y, f.y)) * mix(.72, 1., dvE(f.x, .05, fw.x));
    avg = c * .92; fade = max(fw.x, fw.y);
  } else if (id < 6.5) { // planches verticales
    float x = uv.x / .13, f = fract(x), fw = fwidth(x); float r = dvH(vec2(floor(x), 2.));
    o = c * (.88 + .2 * r) * mix(.6, 1., dvE(f, .07, fw)) * (.95 + .08 * dvN(vec2(floor(x) * 3.1, uv.y * 3.)));
    avg = c * .92; fade = fw;
  } else if (id < 7.5) { // crépi
    vec2 fw = fwidth(uv * 31.);
    o = c * (.95 + .07 * dvN(uv * 9.) + .035 * dvN(uv * 31.)); avg = c; fade = max(fw.x, fw.y) * .45;
  } else if (id < 8.5) { // ardoises
    vec2 q = uv / vec2(.17, .095); q.x += mod(floor(q.y), 2.) * .5; vec2 f = fract(q), fw = fwidth(q); float r = dvH(floor(q) + 23.);
    o = c * (.82 + .3 * r) * mix(.6, 1.04, smoothstep(0., .2 + fw.y, f.y)) * mix(.75, 1., dvE(f.x, .04, fw.x));
    avg = c * .9; fade = max(fw.x, fw.y);
  } else if (id < 9.5) { // moellons (pierres irrégulières)
    vec2 p = uv * 4.2, i = floor(p), f = fract(p); float d1 = 8., d2 = 8.; vec2 c1 = vec2(0.);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 pt = vec2(dvH(i + g), dvH(i + g + 17.)); vec2 rr = g + pt * .8 + .1 - f; float d = dot(rr, rr); if (d < d1) { d2 = d1; d1 = d; c1 = i + g; } else if (d < d2) d2 = d; }
    float e = sqrt(d2) - sqrt(d1); vec2 fw = fwidth(p);
    o = mix(c * .55, c * (.78 + .4 * dvH(c1 + 9.)), smoothstep(.06, .14 + fw.x * 2., e)); avg = c * .86; fade = max(fw.x, fw.y) * 1.4;
  } else if (id < 10.5) { // rondins
    float y = uv.y / .21, f = fract(y), fw = fwidth(y);
    o = c * (.6 + .48 * sin(f * 3.14159)) * (.94 + .1 * dvN(vec2(uv.x * 4., floor(y) * 3.7))); avg = c * .9; fade = fw;
  } else { // carrelage
    vec2 q = uv / .3, f = fract(q), fw = fwidth(q); float r = dvH(floor(q) + 31.);
    o = mix(mix(c, vec3(.93), .6), c * (.92 + .14 * r), dvJ(f, vec2(.03), fw)); avg = c; fade = max(fw.x, fw.y);
  }
  o = mix(o, avg, smoothstep(.35, .8, fade));
  return o * mix(.8, 1., smoothstep(0., .45, vOP.y));
}
`;
  function patMat() {
    const m = G.toon({ vertexColors: true }); const base = m.onBeforeCompile; m.extensions = { derivatives: true };
    m.onBeforeCompile = sh => { base(sh);
      sh.vertexShader = 'attribute float pat;\nvarying float vPat;\nvarying vec3 vOP;\nvarying vec3 vON;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPat = pat; vOP = position; vON = normal;');
      sh.fragmentShader = PAT_FS + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = dvPat(diffuseColor.rgb);'); };
    m.customProgramCacheKey = () => 'cvc-pat'; return m;
  }
  const omm = G.makeMaterials; G.makeMaterials = () => { omm(); G.M.pat = patMat(); G.MATS.push(G.M.pat); };

  // ---------- outils d'architecture ----------
  const GLASS = 0xe6f2ff, GOLD = 0xe8c25a, IRONC = 0x3a3f47, STONEC = 0xbdb6a8, ZINC = 0xa8adb4;
  const dark = (c, k = .75) => new THREE.Color(c).multiplyScalar(k).getHex();
  const light = (c, k = .2) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex();
  const P = (...a) => G.prism(...a), lum = c => { const C = new THREE.Color(c); return .3 * C.r + .59 * C.g + .11 * C.b; };
  const ROT = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
  // position sur un mur : face 0 avant (+z), 1 arrière, 2 droite (+x), 3 gauche (−x) ; a = abscisse vue de dehors, out = distance devant le mur
  function onW(H, f, a, y, out) { const hw = H.w / 2, hd = H.d / 2;
    return f === 0 ? [a, y, H.zc + hd + out] : f === 1 ? [-a, y, H.zc - hd - out] : f === 2 ? [hw + out, y, H.zc - a] : [-hw - out, y, H.zc + a]; }
  function wb(b, H, f, a, y, out, w, h, t, col, mat = 0) { const p = onW(H, f, a, y, out + t / 2); if (f < 2) b.box(w, h, t, col, p[0], p[1], p[2], 0, 0, 0, mat); else b.box(t, h, w, col, p[0], p[1], p[2], 0, 0, 0, mat); }
  function ws(b, H, f, a, y, out, r, col, mat = 0) { const p = onW(H, f, a, y, out); b.sph(r, col, p[0], p[1], p[2], 1, 1, 1, mat, 8, 6); }
  function half(b, H, f, a, y, out, r, t, col, mat = 0) { const p = onW(H, f, a, y, out + t / 2); b.add(new THREE.CylinderGeometry(r, r, t, 14, 1, false, -Math.PI / 2, Math.PI), col, b.M(p[0], p[1], p[2], -Math.PI / 2, ROT[f], 0), mat); }
  function disc(b, H, f, a, y, out, r, t, col, mat = 0) { const p = onW(H, f, a, y, out + t / 2); b.add(new THREE.CylinderGeometry(r, r, t, 16), col, b.M(p[0], p[1], p[2], Math.PI / 2, ROT[f], 0), mat); }
  function ring(b, H, f, a, y, out, r, t, col) { const p = onW(H, f, a, y, out); b.add(new THREE.TorusGeometry(r, t, 5, 18), col, b.M(p[0], p[1], p[2], 0, ROT[f], 0), 0, true); }
  // poutre de colombage (ang : inclinaison dans le plan du mur)
  function beam(b, H, f, a, y, len, ang, col) { const p = onW(H, f, a, y, .02); if (f < 2) b.box(.07, len, .04, col, p[0], p[1], p[2], 0, 0, f === 0 ? ang : -ang); else b.box(.04, len, .07, col, p[0], p[1], p[2], f === 2 ? -ang : ang, 0, 0); }
  // ---------- fenêtre détaillée ----------
  function fenetre(b, H, f, a, y, o = {}) {
    const w = o.w || .5, h = o.h || .6, F = o.frame || 0xf7f5ee;
    if (o.arch) { half(b, H, f, a, y + h / 2, 0, w / 2 + .07, .04, F); half(b, H, f, a, y + h / 2, .02, w / 2, .03, GLASS, 1); }
    wb(b, H, f, a, y, 0, w + .14, h + .14, .04, F);
    wb(b, H, f, a, y, .02, w, h, .03, GLASS, 1);
    if (o.curt != null) { for (const s of [-1, 1]) wb(b, H, f, a + s * w * .37, y - h * .04, .05, w * .22, h * .9, .012, o.curt); wb(b, H, f, a, y + h * .42, .052, w + .02, h * .14, .014, o.curt); }
    wb(b, H, f, a, y, .055, .032, h, .022, F);
    if (o.pane === 'petits') { for (const k of [-1, 0, 1]) wb(b, H, f, a, y + k * h / 3.2, .055, w, .026, .022, F); } else if (o.pane !== 'grand') wb(b, H, f, a, y + h * .12, .055, w, .032, .022, F);
    wb(b, H, f, a, y - h / 2 - .07, 0, w + .26, .065, .11, o.sill != null ? o.sill : F);
    if (o.lintel != null) { b.P(o.lintelPat || 0); wb(b, H, f, a, y + h / 2 + .1, 0, w + .24, .1, .05, o.lintel); b.P(0); }
    if (o.shut != null) for (const s of [-1, 1]) { const sx = a + s * (w / 2 + .04 + w * .18), sd = dark(o.shut, .76);
      wb(b, H, f, sx, y, .012, w * .36, h + .06, .035, o.shut);
      if (o.heart) ws(b, H, f, sx, y + h * .25, .05, .045, sd); else for (let k = 0; k < 6; k++) wb(b, H, f, sx, y - h / 2 + .07 + k * (h - .08) / 5.5, .047, w * .3, .022, .016, sd);
      wb(b, H, f, sx - s * w * .16, y + h * .3, .047, .05, .025, .02, IRONC); wb(b, H, f, sx - s * w * .16, y - h * .3, .047, .05, .025, .02, IRONC); }
    if (o.fleurs) { wb(b, H, f, a, y - h / 2 - .18, .03, w + .16, .14, .16, o.boxCol || 0x8a5a34); const cols = Array.isArray(o.fleurs) ? o.fleurs : [0xff6f91, 0xffd23f, 0xffffff, 0xe8434a, 0xb583e6];
      const q = onW(H, f, a, y - h / 2 - .1, .11); b.sph(.075, 0x4f9a46, q[0], q[1], q[2], f < 2 ? (w + .1) / .15 : 1, .55, f < 2 ? 1 : (w + .1) / .15, 0, 8, 5);
      for (let i = 0; i < 5; i++) { const p = onW(H, f, a - w / 2 + .02 + i * (w + .06) / 4, y - h / 2 - .05, .12); b.sph(.055, cols[(i + Math.round(a * 7)) % cols.length], p[0], p[1], p[2], 1, .8, 1, 0, 7, 5); } }
  }
  // ---------- porte d'entrée, marches, lanterne, auvent ----------
  function porte(b, H, f, a, o = {}) {
    const w = o.w || .62, h = o.h || 1.25, y0 = H.fh, col = o.col || 0x85552f, F = o.frame || 0xf7f5ee, yc = y0 + h / 2, pd = dark(col, .8), pl = light(col, .14);
    wb(b, H, f, a, yc + .03, 0, w + .18, h + .1, .05, F);
    wb(b, H, f, a, yc, .03, w, h, .04, col);
    if (o.style === 'vitre') { wb(b, H, f, a, yc + h * .2, .07, w * .62, h * .34, .015, GLASS, 1); wb(b, H, f, a, yc + h * .2, .085, .025, h * .34, .01, F); wb(b, H, f, a, yc + h * .2, .085, w * .62, .025, .01, F); for (const s of [-1, 1]) wb(b, H, f, a + s * w * .2, yc - h * .24, .07, w * .3, h * .34, .014, pl); }
    else if (o.style === 'planches') { for (let k = -2; k <= 2; k++) wb(b, H, f, a + k * w / 5, yc, .07, .014, h * .96, .008, pd); for (const yy of [-.32, .32]) wb(b, H, f, a, yc + yy * h, .075, w * .96, .055, .012, IRONC); wb(b, H, f, a, yc + h * .3, .072, w * .32, h * .14, .01, GLASS, 1); }
    else { for (const s of [-1, 1]) for (const t of [-1, 1]) wb(b, H, f, a + s * w * .21, yc + t * h * .22 + .04, .07, w * .3, h * .34, .014, pl); }
    ws(b, H, f, a + w * .33, yc - .02, .1, .035, GOLD); wb(b, H, f, a + w * .33, yc - .02, .07, .05, .14, .012, GOLD); wb(b, H, f, a, y0 + .07, .07, w * .9, .1, .01, GOLD);
    if (o.arch) { half(b, H, f, a, y0 + h + .03, 0, w / 2 + .09, .05, F); half(b, H, f, a, y0 + h + .03, .025, w / 2 - .02, .03, GLASS, 1); }
    else if (o.imposte) { wb(b, H, f, a, y0 + h + .2, 0, w + .18, .22, .05, F); wb(b, H, f, a, y0 + h + .2, .03, w - .04, .14, .03, GLASS, 1); }
    const st = o.steps == null ? 1 : o.steps; b.P(PT.pierre); for (let i = 0; i < st; i++) { const sh = (H.fh + .02) / st; wb(b, H, f, a, sh * (i + .5), 0, w + .5 - i * .12, sh, .36 - i * .14, o.stepCol || STONEC); } b.P(0);
    wb(b, H, f, a, .012, .38, w + .06, .022, .3, 0x9b5a2a); wb(b, H, f, a, .016, .43, w - .1, .024, .2, 0xc07a3a);
    if (o.lamp && o.lampPos === 'top') { const p = onW(H, f, a, y0 + h + .27, .14); wb(b, H, f, a, y0 + h + .36, 0, .1, .05, .16, IRONC); b.cyl(.065, .055, .04, 6, IRONC, p[0], p[1] - .09, p[2]); b.cyl(.045, .045, .13, 6, 0xffe2a0, p[0], p[1], p[2], 0, 0, 0, 1); b.cone(.08, .08, 6, IRONC, p[0], p[1] + .11, p[2]); }
    else if (o.lamp && o.lampPos !== 'none') for (const s of o.lamp === 2 ? [-1, 1] : [1]) { const lx = a - s * (w / 2 + .17); wb(b, H, f, lx, y0 + h * .86, 0, .05, .1, .1, IRONC); const p = onW(H, f, lx, y0 + h * .78, .13);
      b.cyl(.065, .055, .04, 6, IRONC, p[0], p[1] - .09, p[2]); b.cyl(.045, .045, .13, 6, 0xffe2a0, p[0], p[1], p[2], 0, 0, 0, 1); for (let k = 0; k < 3; k++) { const an = k / 3 * TAU; b.box(.012, .14, .012, IRONC, p[0] + Math.cos(an) * .05, p[1], p[2] + Math.sin(an) * .05); } b.cone(.08, .08, 6, IRONC, p[0], p[1] + .11, p[2]); }
    if (o.fronton != null) { b.P(PT.pierre); for (const s of [-1, 1]) wb(b, H, f, a + s * (w / 2 + .1), y0 + (h + .3) / 2, 0, .12, h + .3, .07, o.fronton); wb(b, H, f, a, y0 + h + .38, 0, w + .5, .09, .12, o.fronton); b.P(0); }
    if (o.auvent != null && f === 0) { const p = onW(H, 0, a, y0 + h + (o.imposte ? .36 : .12), .3); b.P(o.auventPat || 0); P(b, w + .6, .24, .6, o.auvent, p[0], p[1], p[2], 0); b.P(0); for (const s of [-1, 1]) b.box(.04, .28, .04, F, a + s * (w / 2 + .18), p[1] - .08, p[2] + .05, -.65); }
    if (o.num) { wb(b, H, f, a, y0 + h * .91, .07, .14, .07, .012, 0x2f5f9a); wb(b, H, f, a, y0 + h * .91, .082, .1, .035, .006, 0xffffff); }
  }
  // ---------- toit à deux pans (faîtage le long de x) ----------
  function toitX(b, H, o) {
    const yT = H.fh + H.wh, ov = o.over == null ? .24 : o.over, og = o.og == null ? .2 : o.og, tn = o.pitch || .9, t = .1, an = Math.atan(tn), cs = Math.cos(an), sn = Math.sin(an);
    const hw = H.w / 2 + og, hd = H.d / 2 + ov, yR = yT + H.d / 2 * tn, yE = yT - ov * tn, sl = hd / cs, my = (yR + yE) / 2, rc = o.col, fas = o.fascia != null ? o.fascia : 0xf7f5ee;
    b.P(o.wallPat || 0); P(b, H.d + .002, yR - yT, H.w - .01, o.wall, 0, yT, H.zc, Math.PI / 2); b.P(0);
    b.P(o.pat || 0); for (const s of [1, -1]) b.box(hw * 2, t, sl, rc, 0, my + cs * t / 2, H.zc + s * (hd / 2 + sn * t / 2), s * an); b.P(0);
    b.cyl(.075, .075, hw * 2 + .04, 8, dark(rc, .8), 0, yR + t / cs - .015, H.zc, 0, 0, Math.PI / 2);
    for (const s of [1, -1]) { const zf = H.zc + s * (hd + sn * t + .015); b.box(hw * 2 + .02, cs * t + .07, .035, fas, 0, yE + cs * t / 2 - .02, zf);
      if (o.gutter !== false) { b.cyl(.05, .05, hw * 2, 8, ZINC, 0, yE - .05, zf + s * .04, 0, 0, Math.PI / 2);
        for (const x of [H.w / 2 - .14, -(H.w / 2 - .14)]) { if (s < 0 && x < 0) continue; const z1 = zf + s * .04, z2 = H.zc + s * (H.d / 2 + .05), y1 = yE - .07, y2 = y1 - .22, len = Math.hypot(z1 - z2, y1 - y2);
          b.cyl(.028, .028, len, 6, ZINC, x, (y1 + y2) / 2, (z1 + z2) / 2, s * Math.atan2(Math.abs(z1 - z2), y1 - y2), 0, 0); b.cyl(.03, .03, y2 - .05, 6, ZINC, x, (y2 + .05) / 2, z2); b.cyl(.04, .03, .08, 6, ZINC, x, .06, z2 + s * .03, s * .9, 0, 0); } } }
    for (const sx of [1, -1]) for (const s of [1, -1]) b.box(.05, .13, sl + .02, fas, sx * (hw + .015), my + cs * t / 2, H.zc + s * (hd / 2 + sn * t / 2), s * an);
    if (o.genoise) for (let k = 0; k < Math.round(H.w / .14); k++) for (const s of [1, -1]) b.cyl(.045, .045, .1, 6, dark(rc, .9), -H.w / 2 + .07 + k * .14, yT - .05, H.zc + s * (H.d / 2 + .05), Math.PI / 2, 0, 0);
    return { yT, yR, yE, tn, t, cs, hd, hw, top: yR + t / cs, roofY: z => yR + t / cs - Math.abs(z - H.zc) * tn };
  }
  // ---------- toit à deux pans, pignon sur la façade (faîtage le long de z) ----------
  function toitZ(b, H, o) {
    const yT = H.fh + H.wh, ov = o.over == null ? .26 : o.over, og = o.og == null ? .24 : o.og, tn = o.pitch || .85, t = .1, an = Math.atan(tn), cs = Math.cos(an), sn = Math.sin(an);
    const hw = H.w / 2 + ov, hd = H.d / 2 + og, yR = yT + H.w / 2 * tn, yE = yT - ov * tn, sl = hw / cs, my = (yR + yE) / 2, rc = o.col, fas = o.fascia != null ? o.fascia : 0xf7f5ee;
    b.P(o.wallPat || 0); P(b, H.w + .002, yR - yT, H.d - .01, o.wall, 0, yT, H.zc, 0); b.P(0);
    b.P(o.pat || 0); for (const s of [1, -1]) b.box(sl, t, hd * 2, rc, s * (hw / 2 + sn * t / 2), my + cs * t / 2, H.zc, 0, 0, -s * an); b.P(0);
    b.cyl(.075, .075, hd * 2 + .04, 8, dark(rc, .8), 0, yR + t / cs - .015, H.zc, Math.PI / 2, 0, 0);
    for (const s of [1, -1]) { const xf = s * (hw + sn * t + .015); b.box(.035, cs * t + .07, hd * 2 + .02, fas, xf, yE + cs * t / 2 - .02, H.zc);
      if (o.gutter !== false) { b.cyl(.05, .05, hd * 2, 8, ZINC, xf + s * .04, yE - .05, H.zc, Math.PI / 2, 0, 0); const z = H.zc + H.d / 2 - .14, x1 = xf + s * .04, x2 = s * (H.w / 2 + .05), y1 = yE - .07, y2 = y1 - .22, len = Math.hypot(x1 - x2, y1 - y2);
        b.cyl(.028, .028, len, 6, ZINC, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, -s * Math.atan2(Math.abs(x1 - x2), y1 - y2)); b.cyl(.03, .03, y2 - .05, 6, ZINC, x2, (y2 + .05) / 2, z); } }
    for (const sz of [1, -1]) for (const s of [1, -1]) b.box(sl + .02, .13, .05, fas, s * (hw / 2 + sn * t / 2), my + cs * t / 2, H.zc + sz * (hd + .015), 0, 0, -s * an);
    return { yT, yR, yE, tn, t, cs, hw, hd, top: yR + t / cs };
  }
  function cheminee(b, x, z, y0, y1, col = 0xb85a41) { b.P(PT.brique); b.box(.38, y1 - y0, .38, col, x, (y0 + y1) / 2, z); b.P(0); b.P(PT.pierre); b.box(.46, .08, .46, STONEC, x, y1 + .04, z); b.P(0); for (const dx of [-.08, .08]) b.cyl(.055, .065, .16, 8, 0xc0603c, x + dx, y1 + .16, z); }
  function lucarne(b, H, R, x, o) {
    const dw = o.w || .7, zf = H.zc + H.d / 2 - .1, depth = zf - H.zc, y0 = R.roofY(zf) - .12, dh = .72, yTop = y0 + dh;
    b.P(o.wallPat || 0); b.box(dw, dh, depth, o.wall, x, y0 + dh / 2, H.zc + depth / 2); b.P(0);
    b.P(o.pat || 0); P(b, dw + .22, .34, depth + .14, o.col, x, yTop - .02, H.zc + depth / 2 + .07, 0); b.P(0);
    const D = { w: dw, d: depth * 2, zc: H.zc, fh: 0, wh: 0 }; fenetre(b, D, 0, x, y0 + dh * .46, { w: dw * .55, h: dh * .52, frame: o.frame, pane: 'petits', sill: o.frame });
    b.box(dw + .04, .05, .04, o.frame || 0xf7f5ee, x, yTop - .01, zf + .03);
  }
  function quoins(b, H, faces, col) { b.P(PT.pierre); const n = Math.floor(H.wh / .2); for (const f of faces) for (const s of [-1, 1]) for (let k = 0; k < n; k++) { const y = H.fh + .1 + k * .2, wide = k % 2 ? .34 : .2, fw = f < 2 ? H.w : H.d; wb(b, H, f, s * (fw / 2 - wide / 2 + .02), y, 0, wide, .17, .035, col); } b.P(0); }
  function corners(b, H, col) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.09, H.wh, .09, col, sx * (H.w / 2 + .01), H.fh + H.wh / 2, H.zc + sz * (H.d / 2 + .01)); }
  function bush(b, x, z, s, col, fl) { b.jit(.08); b.blob(.24 * s, 1, col, x, .2 * s, z, 1.15, .8, 1); b.blob(.17 * s, 1, light(col, .1), x + .14 * s, .26 * s, z + .05, 1, .8, 1); b.jit(0); if (fl) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.sph(.04, fl, x + Math.cos(a) * .2 * s, .32 * s + (i % 2) * .05, z + Math.sin(a) * .15 * s, 1, 1, 1, 0, 6, 4); } }

  // ---------- les 8 styles de maisons ----------
  const STY = G.HOUSE_STYLES = [
    { n: 'Cottage en briques', wall: 0xb85a41, wp: PT.brique, base: 0xa9a297, roof: 0x59606e, rp: PT.ardoise, trim: 0xf7f5ee, door: 0x2f6b45, ds: 'vitre', curt: 0xfff1d6, pane: 'petits', lintel: 0xd9d2c2, quoin: 0xd9d2c2, fleurs: 1, dormer: 1, lamp: 1, auvent: 0x59606e },
    { n: 'Maison bleue à clins', wall: 0x8fbfe8, wp: PT.bardage, base: 0xb9b5aa, roof: 0x3f4f6e, rp: PT.bardeaux, trim: 0xffffff, door: 0xd9544d, ds: 'panneaux', shut: 0x2f5f9a, curt: 0xffffff, corners: 1, porch: 1, lamp: 2 },
    { n: 'Mas provençal rose', wall: 0xf2c4b4, wp: PT.crepi, base: 0xc8b9a0, roof: 0xd0703c, rp: PT.tuiles, pitch: .55, trim: 0xf3e6d0, door: 0x9a8ad8, ds: 'planches', shut: 0xa596de, curt: 0xfff6e0, fleurs: [0xb583e6, 0xffffff, 0xff8fc0], genoise: 1, arch: 1, lamp: 1 },
    { n: 'Chaumière en pierre', wall: 0xc2b8a5, wp: PT.moellons, base: 0x8f8b82, roof: 0x4f8a4a, rp: PT.bardeaux, pitch: 1.05, trim: 0x6b4a32, frame: 0xf3ead8, door: 0x6b4a32, ds: 'planches', shut: 0x3f8f45, curt: 0xf6e6c8, lintel: 0x8a6a48, ivy: 1, bigChim: 1, lamp: 1 },
    { n: 'Maison normande', wall: 0xfaf1dc, wp: PT.crepi, base: 0xa9a29a, roof: 0xc0503c, rp: PT.tuiles, pitch: 1.15, trim: 0x5a3a24, frame: 0xffffff, door: 0x5a3a24, ds: 'panneaux', curt: 0xffffff, colombage: 0x5a3a24, fleurs: [0xe8434a, 0xff6f91, 0xffffff], dormer: 1, lamp: 1 },
    { n: 'Chalet de montagne', wall: 0xa86f42, wp: PT.rondins, base: 0x8f8b82, roof: 0x5a3f2c, rp: PT.bardeaux, Z: 1, pitch: .7, trim: 0x6b4426, frame: 0xf3e6c8, door: 0x6b4426, ds: 'planches', shut: 0xd9443a, heart: 1, curt: 0xffe6e6, fleurs: [0xe8434a, 0xffffff], balcon: 1, lamp: 1, fh: .34 },
    { n: 'Maison de plage', wall: 0xfdfcf7, wp: PT.bardage, base: 0xd8d0bf, roof: 0x3fa3a8, rp: PT.ardoise, Z: 1, pitch: .8, trim: 0x3fb3b0, frame: 0xffffff, door: 0x2f7fb8, ds: 'vitre', shut: 0x3fb3b0, curt: 0xdff6ff, corners: 1, porch: 2, oeil: 1, lamp: 1 },
    { n: 'Maison de ville', wall: 0xf3d58a, wp: PT.crepi, base: 0xb9b3a6, roof: 0x4a4f5c, rp: PT.ardoise, pitch: 1.1, trim: 0xf7f5ee, door: 0x2f4f7a, ds: 'panneaux', shut: 0x2f6b45, curt: 0xfff8e8, lintel: 0xece4d4, quoin: 0xece4d4, dormer: 2, imposte: 1, fronton: 0xece4d4, lamp: 2 }
  ];
  function maison(b, s, o = {}) {
    const fl = o.floors || 1, H = { w: o.w || 2.8, d: o.d || 2.2, zc: o.zc != null ? o.zc : (s.porch ? -.2 : -.08), fh: s.fh || .2, wh: (o.fh1 || 1.85) + (fl - 1) * 1.55 };
    const FR = s.frame || s.trim, win = (f, a, y, ex) => fenetre(b, H, f, a, y, Object.assign({ w: .48, h: .6, frame: FR, shut: s.shut, curt: s.curt, pane: s.pane, lintel: s.lintel, lintelPat: s.lintel != null ? PT.pierre : 0, heart: s.heart, arch: s.arch && f === 0, sill: s.lintel != null ? s.lintel : FR }, ex || {}));
    // soubassement
    b.P(PT.pierre); b.box(H.w + .1, H.fh, H.d + .1, s.base, 0, H.fh / 2, H.zc); b.P(0);
    // murs
    b.P(s.wp); b.box(H.w, H.wh, H.d, s.wall, 0, H.fh + H.wh / 2, H.zc); b.P(0);
    if (s.quoin != null) quoins(b, H, [0, 2, 3], s.quoin);
    if (s.corners) corners(b, H, s.trim);
    if (fl > 1) for (const f of [0, 1, 2, 3]) wb(b, H, f, 0, H.fh + 1.85, 0, (f < 2 ? H.w : H.d) + .04, .08, .05, s.trim);
    // colombages
    if (s.colombage != null) { const c = s.colombage, y0 = H.fh, y1 = H.fh + H.wh, ym = H.fh + .6, lo = ym - y0, up = y1 - ym;
      for (const f of [0, 2, 3]) { const fw = f < 2 ? H.w : H.d; for (const y of [y0 + .04, ym, y1 - .04]) wb(b, H, f, 0, y, .015, fw + .02, .07, .04, c);
        for (const a of [-fw / 2 + .04, fw / 2 - .04].concat(f === 0 ? [-.45, .45] : [])) wb(b, H, f, a, (y0 + y1) / 2, .015, .07, H.wh, .04, c);
        for (const [a, sg] of f === 0 ? [[-.84, 1], [.84, -1]] : [[-.55, 1], [.55, -1]]) beam(b, H, f, a, (y0 + ym) / 2, Math.hypot(lo, .5), sg * Math.atan2(.5, lo), c);
        if (f > 0) for (const [a, sg] of [[-.75, -1], [.75, 1]]) beam(b, H, f, a, (ym + y1) / 2, Math.hypot(up, .36), sg * Math.atan2(.36, up), c); } }
    // toit
    const R = s.Z ? toitZ(b, H, { col: s.roof, pat: s.rp, wall: s.wall, wallPat: s.wp, pitch: s.pitch, fascia: s.trim, over: .12 }) : toitX(b, H, { col: s.roof, pat: s.rp, wall: s.wall, wallPat: s.wp, pitch: s.pitch, fascia: s.trim, genoise: s.genoise, og: .1 });
    // porche à colonnes (avant de la porte, pour que le toit du porche passe au-dessus)
    if (s.porch) { const zf = H.zc + H.d / 2, pd = s.porch === 2 ? .62 : .58, py = H.fh + 1.42;
      b.P(PT.planches); b.box(H.w + .1, .08, pd, 0xc9a16e, 0, H.fh - .04, zf + pd / 2); b.P(0);
      b.P(PT.pierre); b.box(H.w + .1, H.fh - .08, pd, s.base, 0, (H.fh - .08) / 2, zf + pd / 2); b.box(.9, H.fh / 2, .16, STONEC, 0, H.fh / 4, zf + pd + .08); b.P(0);
      for (const x of [-H.w / 2 + .1, H.w / 2 - .1].concat(s.porch === 2 ? [-.55, .55] : [])) { b.cyl(.055, .06, py - H.fh, 8, s.trim, x, (py + H.fh) / 2, zf + pd - .08); b.box(.15, .06, .15, s.trim, x, H.fh + .03, zf + pd - .08); b.box(.14, .06, .14, s.trim, x, py - .03, zf + pd - .08); }
      b.P(s.rp); b.box(H.w + .2, .07, pd + .16, s.roof, 0, py + .1, zf + pd / 2 + .02, .22); b.P(0); b.box(H.w + .2, .1, .04, s.trim, 0, py + .02, zf + pd + .1);
      if (s.porch === 2) for (const sx of [-1, 1]) { b.box(.72, .05, .04, s.trim, sx * .95, H.fh + .45, zf + pd - .08); for (let k = 0; k < 4; k++) b.box(.035, .42, .035, s.trim, sx * (.7 + k * .17), H.fh + .24, zf + pd - .08); } }
    // porte et fenêtres
    porte(b, H, 0, 0, { w: .58, col: s.door, style: s.ds, frame: FR, lamp: s.lamp, lampPos: s.shut != null || s.fronton != null ? (s.imposte || s.arch || s.porch ? 'none' : 'top') : 'side', auvent: s.porch ? null : s.auvent, auventPat: s.rp, imposte: s.imposte, fronton: s.fronton, arch: s.arch, num: 1, steps: s.porch ? 0 : 1 });
    const y1 = H.fh + 1.05, WX = o.wx || [-.95, .95]; for (const x of WX) win(0, x, y1, { fleurs: s.fleurs });
    for (let k = 1; k < fl; k++) { const y = H.fh + 1.85 + (k - 1) * 1.55 + .78; for (const x of WX) win(0, x, y, { fleurs: s.fleurs }); win(0, 0, y, { w: .42 }); }
    win(2, 0, y1, { w: .46 }); win(3, 0, y1, { w: .46 }); win(1, -.6, y1, { w: .46, shut: null }); win(1, .6, y1, { w: .46, shut: null });
    if (fl > 1) { win(2, 0, y1 + 1.55, { w: .46 }); win(3, 0, y1 + 1.55, { w: .46 }); }
    // balcon du chalet sous le pignon
    if (s.balcon) { const zf = H.zc + H.d / 2, by = R.yT + .02; b.P(PT.planches); b.box(1.5, .07, .42, 0x8a5a34, 0, by, zf + .21); b.P(0); for (let k = 0; k <= 8; k++) b.box(.07, .36, .03, 0x6b4426, -.72 + k * .18, by + .2, zf + .4); b.box(1.56, .05, .06, 0x6b4426, 0, by + .4, zf + .4); for (const sx of [-1, 1]) { b.box(.05, .36, .4, 0x6b4426, sx * .76, by + .2, zf + .2); b.box(.06, .3, .06, 0x6b4426, sx * .7, by - .17, zf + .3, .6); }
      fenetre(b, H, 0, 0, by + .42, { w: .42, h: .5, frame: FR, curt: s.curt, pane: 'petits', shut: s.shut, heart: 1 }); }
    if (s.oeil) { const y = R.yT + (R.yR - R.yT) * .42; disc(b, H, 0, 0, y, .01, .19, .03, GLASS, 1); ring(b, H, 0, 0, y, .045, .2, .035, FR); wb(b, H, 0, 0, y, .05, .025, .38, .02, FR); wb(b, H, 0, 0, y, .05, .38, .025, .02, FR); }
    if (s.Z && s.colombage == null && !s.balcon && !s.oeil) fenetre(b, H, 0, 0, R.yT + .32, { w: .36, h: .34, frame: FR, pane: 'petits' });
    // lucarnes
    if (s.dormer && !s.Z) { const xs = s.dormer === 2 ? [-.7, .7] : [0]; for (const x of xs) lucarne(b, H, R, x, { w: .66, col: s.roof, pat: s.rp, wall: s.colombage != null ? s.wall : s.trim, wallPat: s.colombage != null ? PT.crepi : 0, frame: FR }); }
    // cheminée
    if (s.bigChim) { b.P(PT.moellons); b.box(.5, R.top - H.fh + .45, .5, s.base, H.w / 2 - .15, (R.top + H.fh + .45) / 2 - .02, H.zc - .35); b.P(0); b.P(PT.pierre); b.box(.58, .08, .58, STONEC, H.w / 2 - .15, R.top + .47, H.zc - .35); b.P(0); }
    else if (s.Z) cheminee(b, -H.w / 2 + .45, H.zc - .5, R.yT, R.top + .35);
    else cheminee(b, H.w / 2 - .45, H.zc - .45, R.yT + .2, R.top + .38);
    // lierre, massifs, petits détails
    if (s.ivy) { b.jit(.1); for (let i = 0; i < 11; i++) { const yy = H.fh + .15 + (i % 6) * .3, zz = H.zc + H.d / 2 - .15 - (i % 4) * .22 - (i > 5 ? .3 : 0); b.blob(.14, 1, i % 2 ? 0x3f8f45 : 0x4fa847, -H.w / 2 - .03, yy, zz, .45, 1, 1.3); } b.jit(0); }
    const zb = H.zc + H.d / 2 + .32; if (!s.porch) { bush(b, -1.32, zb - .05, .9, 0x4fa847, s.fleurs ? (Array.isArray(s.fleurs) ? s.fleurs[0] : 0xff8fc0) : null); bush(b, 1.32, zb - .05, .85, 0x58b54a, 0xffd23f); }
  }
  // ---------- modèles ----------
  MD.house = v => { const b = G.mb(90 + v); maison(b, STY[v % STY.length]); return b.done(); };
  const ROOFS6 = [0xc0503c, 0x3f5f9a, 0xe0789f, 0x4f8a4a, 0xe08a3a, 0x7a5fb8];
  const ETAGE = [
    { wall: 0xf6ead2, wp: PT.crepi, base: 0xa9a29a, rp: PT.tuiles, trim: 0xf7f5ee, door: 0x2f6b45, ds: 'vitre', shut: 0x2f6b45, curt: 0xfff1d6, lintel: 0xd9d2c2, quoin: 0xd9d2c2, fleurs: 1, lamp: 2, auvent: 1, imposte: 1 },
    { wall: 0x9cc4e6, wp: PT.bardage, base: 0xb9b5aa, rp: PT.ardoise, trim: 0xffffff, door: 0xd9544d, ds: 'panneaux', shut: 0x2f5f9a, curt: 0xffffff, corners: 1, lamp: 2, auvent: 1 },
    { wall: 0xf6d3c8, wp: PT.crepi, base: 0xc8b9a0, rp: PT.tuiles, pitch: .7, trim: 0xf3e6d0, door: 0x9a8ad8, ds: 'planches', shut: 0xa596de, curt: 0xfff6e0, fleurs: [0xb583e6, 0xffffff, 0xff8fc0], genoise: 1, lamp: 1, auvent: 1 },
    { wall: 0xc2b8a5, wp: PT.moellons, base: 0x8f8b82, rp: PT.bardeaux, trim: 0x6b4a32, frame: 0xf3ead8, door: 0x6b4a32, ds: 'planches', shut: 0x3f8f45, curt: 0xf6e6c8, lintel: 0x8a6a48, lamp: 1, auvent: 1 },
    { wall: 0xb85a41, wp: PT.brique, base: 0xa9a297, rp: PT.tuiles, trim: 0xf7f5ee, door: 0x2f4f7a, ds: 'vitre', curt: 0xfff1d6, pane: 'petits', lintel: 0xd9d2c2, quoin: 0xd9d2c2, fleurs: 1, lamp: 2, auvent: 1, imposte: 1 },
    { wall: 0xfdfcf7, wp: PT.crepi, base: 0xb9b3a6, rp: PT.ardoise, trim: 0xece4d4, door: 0x5a3f8a, ds: 'panneaux', shut: 0x7a5fb8, curt: 0xfff8e8, quoin: 0xece4d4, lintel: 0xece4d4, lamp: 2, auvent: 1, imposte: 1 }];
  MD.house2 = v => { const b = G.mb(220 + v), k = v % 6, s = Object.assign({ roof: ROOFS6[k] }, ETAGE[k]); s.auvent = null; s.dormer = 0;
    maison(b, s, { floors: 2, fh1: 1.85 });
    const zf = -.08 + 1.1, by = .2 + 1.85; b.P(PT.pierre); b.box(1.5, .08, .4, 0xd9d2c2, 0, by + .02, zf + .2); b.P(0); for (let i = 0; i <= 9; i++) b.box(.03, .34, .03, 0x2a2d33, -.72 + i * .16, by + .22, zf + .38); b.box(1.5, .04, .05, 0x2a2d33, 0, by + .4, zf + .38); for (const sx of [-1, 1]) b.box(.03, .34, .38, 0x2a2d33, sx * .74, by + .22, zf + .2);
    return b.done(); };
  // ---------- château ----------
  MD.chateau = v => { const b = G.mb(230 + v), S1 = 0xd6cfbf, S2 = 0xc2baa9, roof = ROOFS6[v % 6], W = 0x5a3f2c;
    b.P(PT.pierre); b.box(3.1, .22, 2.7, 0xa9a297, 0, .11, -.05); b.box(2.5, 3.3, 2.0, S1, 0, 1.85, -.25); b.P(0);
    b.P(PT.pierre); for (let i = 0; i < 6; i++) b.box(.3, .32, .3, S2, -1.05 + i * .42, 3.66, .7); for (let i = 0; i < 5; i++) b.box(.3, .32, .3, S2, -1.05 + i * .52, 3.66, -1.2); b.box(2.6, .1, 2.1, S2, 0, 3.47, -.25); b.P(0);
    for (const s of [-1, 1]) { const tx = s * 1.3, tz = .55;
      b.P(PT.pierre); b.cyl(.58, .62, 4.3, 16, S1, tx, 2.25, tz); b.cyl(.68, .66, .18, 16, S2, tx, 4.46, tz); b.P(0);
      b.P(PT.pierre); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.box(.2, .28, .2, S2, tx + Math.cos(a) * .6, 4.68, tz + Math.sin(a) * .6, 0, -a, 0); } b.P(0);
      b.P(PT.ardoise); b.cone(.74, 1.6, 16, roof, tx, 5.55, tz); b.P(0); b.sph(.07, GOLD, tx, 6.38, tz); b.cyl(.015, .015, .6, 4, W, tx, 6.65, tz); b.box(.34, .22, .02, roof, tx + .18, 6.82, tz); b.box(.34, .05, .021, 0xffffff, tx + .18, 6.82, tz);
      for (const y of [1.55, 2.75, 3.75]) { const z = tz + .6; b.box(.24, .44, .05, S2, tx, y, z - .02); b.box(.16, .36, .04, GLASS, tx, y, z + .005, 0, 0, 0, 1); b.add(new THREE.CylinderGeometry(.08, .08, .04, 10, 1, false, -Math.PI / 2, Math.PI), GLASS, b.M(tx, y + .18, z + .005, -Math.PI / 2, 0, 0), 1); }
      for (const y of [.9, 2.1, 3.3]) b.box(.05, .26, .04, 0x2a2420, tx + s * .55, y, tz + .1, 0, s * .5, 0);
      b.cyl(.04, .04, .14, 6, IRONC, tx - s * .55, 1.55, tz + .4); b.sph(.07, 0xffb347, tx - s * .55, 1.66, tz + .42, 1, 1.3, 1, 3); }
    // portail : arc, herse, portes cloutées
    b.P(PT.pierre); b.box(1.25, 1.95, .16, S2, 0, 1.17, .78); b.P(0); b.box(.95, 1.5, .12, W, 0, .95, .86); b.add(new THREE.CylinderGeometry(.475, .475, .12, 16, 1, false, -Math.PI / 2, Math.PI), W, b.M(0, 1.7, .86, -Math.PI / 2, 0, 0));
    b.P(PT.pierre); b.add(new THREE.TorusGeometry(.53, .08, 5, 18, Math.PI), S2, b.M(0, 1.7, .9), 0, true); b.P(0);
    b.P(PT.planches); b.box(.9, 1.45, .02, 0x7a5236, 0, .95, .925); b.P(0); for (const y of [.5, 1.0, 1.45]) b.box(.92, .05, .02, IRONC, 0, y, .94); for (let i = 0; i < 6; i++) b.sph(.025, IRONC, -.35 + i * .14, .75, .95);
    for (const s of [-1, 1]) { b.sph(.05, GOLD, s * .14, 1.0, .96); b.cyl(.04, .04, .16, 6, IRONC, s * .78, 1.45, .92); b.sph(.07, 0xffb347, s * .78, 1.57, .94, 1, 1.3, 1, 3); }
    for (const x of [-.62, .62]) { b.box(.4, .66, .05, S2, x, 2.6, .76); b.box(.3, .56, .04, GLASS, x, 2.6, .79, 0, 0, 0, 1); b.add(new THREE.CylinderGeometry(.15, .15, .04, 10, 1, false, -Math.PI / 2, Math.PI), GLASS, b.M(x, 2.88, .79, -Math.PI / 2, 0, 0), 1); b.box(.3, .03, .05, S2, x, 2.6, .81); b.box(.03, .56, .05, S2, x, 2.6, .81); b.box(.46, .06, .14, S2, x, 2.24, .82); }
    // bannière, blason, drapeau
    b.box(.5, .95, .03, roof, 0, 2.55, .77); b.cone(.25, .3, 3, roof, 0, 1.96, .77, Math.PI, Math.PI / 6, 0); b.sph(.11, GOLD, 0, 2.72, .8); b.box(.5, .05, .04, GOLD, 0, 3.0, .79);
    b.cyl(.015, .015, 1.1, 4, W, 0, 4.4, -.25); b.box(.5, .3, .02, GOLD, .26, 4.82, -.25);
    // massifs et lierre
    b.jit(.1); for (const x of [-.85, .85]) { b.blob(.26, 1, 0x4fa847, x, .3, 1.15, 1.2, .8, 1); for (let i = 0; i < 4; i++) b.sph(.045, [0xe8434a, 0xffffff, 0xffd23f, 0xff8fc0][i], x - .15 + i * .1, .5, 1.25, 1, 1, 1, 0, 6, 4); } for (let i = 0; i < 6; i++) b.blob(.12, 1, i % 2 ? 0x3f8f45 : 0x4fa847, -1.2 + (i % 2) * .1, .5 + i * .35, .78, 1.2, 1, .4); b.jit(0);
    return b.done(); };
  // ---------- grande maison (villa) et cabane ----------
  MD.villa = v => { const b = G.mb(99); maison(b, Object.assign({}, STY[7], { roof: 0x4a5a8f, wall: 0xfaf4e6, door: 0x5a3f8a, dormer: 2 }), { w: 3.6, d: 2.3, wx: [-1.2, 1.2] }); return b.done(); };
  const ocabin = MD.cabin; MD.cabin = v => { const g = ocabin(v); return g; };
  // ---------- motifs sur les bâtiments existants ----------
  // la façade paramétrique de la rue (rue2.js) reçoit des motifs : murs, soubassement, toits
  const ofac = G.facade; if (ofac) G.facade = (b, o) => {
    const wp = o.wallPat != null ? o.wallPat : PT.crepi, bp = o.basePat != null ? o.basePat : o.baseJit ? PT.brique : o.base != null && lum(o.base) > .7 ? PT.pierre : PT.planches, rp = o.roofPat != null ? o.roofPat : (o.roof === 'mansarde' ? PT.ardoise : o.roof === 'plat' ? 0 : PT.tuiles);
    const ob = b.box, wall = o.wall, base = o.base, roofCol = o.roofCol; let n = 0;
    b.box = function (w, h, d, col, x, y, z, rx, ry, rz, mat) { n++;
      const pat = col === wall && h > .9 ? wp : base != null && col === base && h > .9 ? bp : roofCol != null && col === roofCol && (h > .6 || d > 1.2) ? rp : 0;
      if (pat && !b.pat) { b.P(pat); ob.call(this, w, h, d, col, x, y, z, rx, ry, rz, mat); b.P(0); return this; } return ob.call(this, w, h, d, col, x, y, z, rx, ry, rz, mat); };
    const og = b.geo; b.geo = function (g, col, m, mat, smooth) { if (!b.pat && roofCol != null && col === roofCol) { b.P(rp); og.call(this, g, col, m, mat, smooth); b.P(0); return this; } if (!b.pat && col === wall) { b.P(wp); og.call(this, g, col, m, mat, smooth); b.P(0); return this; } return og.call(this, g, col, m, mat, smooth); };
    try { return ofac(b, o); } finally { b.box = ob; b.geo = og; } };
})();
