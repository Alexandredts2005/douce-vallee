'use strict';
// ===== Avatar chibi façon animé : visage dessiné (expressions), coiffures, tenues, chapeaux, accessoires, espèces animales =====
(function () {
  const TAU = Math.PI * 2, hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);
  G.LOOKS = {
    skin: [0xffe6d2, 0xffd6b8, 0xf3bf95, 0xdda274, 0xb47a52, 0x82553a],
    hair: [['court', 'Court'], ['carre', 'Carré'], ['long', 'Long'], ['queue', 'Queue de cheval'], ['couettes', 'Couettes'], ['herisse', 'Hérissé'], ['boucles', 'Bouclé'], ['chignon', 'Chignon'], ['meche', 'Mèche'], ['afro', 'Afro'], ['tresses', 'Tresses'], ['frange', 'Frange'], ['ondule', 'Ondulé long'], ['macarons', 'Macarons'], ['crete', 'Crête'], ['mi_long', 'Mi-long'], ['chauve', 'Aucun']],
    eyes: [['rond', 'Ronds'], ['anime', 'Manga'], ['etoiles', 'Étoilés'], ['brillants', 'Brillants'], ['chat', 'Félins'], ['doux', 'Doux'], ['endormis', 'Endormis'], ['coeurs', 'Cœurs'], ['points', 'Points']],
    mouth: [['sourire', 'Sourire'], ['chat', 'Chat ω'], ['ouvert', 'Rieur'], ['petit', 'Petit'], ['langue', 'Langue'], ['dent', 'Petite dent'], ['bisou', 'Bisou']],
    top: [['tshirt', 'T-shirt'], ['pull', 'Pull'], ['hoodie', 'Sweat à capuche'], ['chemise', 'Chemise'], ['marin', 'Marinière'], ['debardeur', 'Débardeur'], ['manteau', 'Manteau'], ['robe', 'Robe'], ['salopette', 'Salopette'], ['veste', 'Veste'], ['kimono', 'Kimono'], ['maillot', 'Maillot de bain']],
    bottom: [['short', 'Short'], ['bermuda', 'Bermuda'], ['pantalon', 'Pantalon'], ['jupe', 'Jupe'], ['jupe_longue', 'Jupe longue']],
    hat: [['aucun', 'Aucun'], ['bonnet', 'Bonnet'], ['casquette', 'Casquette'], ['beret', 'Béret'], ['chapeau', 'Chapeau de paille'], ['sorciere', 'Chapeau de sorcière'], ['bandana', 'Bandana'], ['casque', 'Casque audio'], ['noeud', 'Nœud'], ['couronne', 'Couronne'], ['fleur', 'Fleur'], ['feuille', 'Feuille'], ['oreilles', 'Oreilles de chat'], ['lapin', 'Oreilles de lapin']],
    acc: [['aucun', 'Aucun'], ['lunettes', 'Lunettes'], ['soleil', 'Lunettes de soleil'], ['etoile', 'Barrette étoile'], ['boucles', 'Boucles d\'oreilles'], ['pansement', 'Pansement'], ['moustache', 'Moustache'], ['echarpe', 'Écharpe'], ['sac', 'Sac à dos'], ['ailes', 'Petites ailes']],
    brows: [['normaux', 'Normaux'], ['epais', 'Épais'], ['fins', 'Fins'], ['joyeux', 'Joyeux'], ['fronces', 'Décidés'], ['aucun', 'Aucun']],
    nose: [['aucun', 'Aucun'], ['point', 'Point'], ['bouton', 'Bouton'], ['rond', 'Rond']],
    eyeSize: [['petits', 'Petits'], ['normaux', 'Normaux'], ['grands', 'Grands']],
    cheek: [['rose', 'Rosées'], ['coeurs', 'Cœurs'], ['etoiles', 'Étoiles'], ['aucune', 'Aucune']],
    height: [['petit', 'Petite taille'], ['moyen', 'Taille moyenne'], ['grand', 'Grande taille']],
    shoe: [['baskets', 'Baskets'], ['bottes', 'Bottes'], ['sandales', 'Sandales'], ['ballerines', 'Ballerines']],
    colors: [0xe8434a, 0xff8fc0, 0xffc23d, 0xffe27a, 0x4fb35f, 0x3fb3b0, 0x5b8fd6, 0x2f4f9a, 0x8d6fd1, 0x6b4a32, 0xb07a48, 0xf7f5ee, 0x9a9a9a, 0x2a2d33, 0xff9a3c, 0xbfe6fa],
    hairCols: [0x2a1d14, 0x6b3f22, 0xa8693a, 0xe8c27a, 0xf5ead2, 0xd9544d, 0xff8fc0, 0x6c8cff, 0x4fb35f, 0xa46be0, 0x9a9a9a, 0xffffff],
    eyeCols: [0x3a2a1a, 0x4a7fd1, 0x3fa060, 0x8d6fd1, 0xd9544d, 0x9a6a46, 0x3fb3b0, 0xe8a23a]
  };
  G.defaultLook = () => ({ skin: 0xffdcc4, hair: 'court', hairCol: 0x6b3f22, eyes: 'rond', eyeCol: 0x3a2a1a, mouth: 'sourire', blush: true, freckles: false, top: 'tshirt', topCol: 0x4fb35f, design: -1, bottom: 'short', botCol: 0x3d5a8a, shoes: 0x6b4a32, hat: 'bonnet', hatCol: 0xe8434a, acc: 'aucun',
    brows: 'normaux', nose: 'aucun', eyeSize: 'normaux', cheek: 'rose', height: 'moyen', shoe: 'baskets', accCol: 0xe8434a });
  G.normLook = l => { const d = G.defaultLook(); if (!l) return d; if (l.shirt !== undefined && l.topCol === undefined) { d.topCol = l.shirt; if (l.hat === null) d.hat = 'aucun'; else if (typeof l.hat === 'number') d.hatCol = l.hat; return d; } return Object.assign(d, l); };

  // ---------- visage (texture 128×128 posée sur l'avant de la tête) ----------
  function eyeShape(x, cx, cy, side, o, expr) {
    const ink = '#2a1b12', col = hex(o.eyeCol || 0x3a2a1a), sz = o.eyeSize === 'petits' ? .82 : o.eyeSize === 'grands' ? 1.2 : 1; x.lineCap = 'round'; x.lineJoin = 'round';
    const lashes = () => { if (!o.lashes) return; x.strokeStyle = ink; x.lineWidth = 2.4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + side * (6.5 + i * 1.4) * sz, cy - (8.5 - i * 2.6) * sz); x.lineTo(cx + side * (11 + i * 1.9) * sz, cy - (12 - i * 3.2) * sz); x.stroke(); } };
    if (expr === 'blink' || expr === 'sleepy' || (expr === 'wink' && side > 0)) { x.strokeStyle = ink; x.lineWidth = 3.4; x.beginPath(); if (expr === 'sleepy') { x.moveTo(cx - 8 * sz, cy + 2); x.lineTo(cx + 8 * sz, cy + 2); } else x.arc(cx, cy - 3, 8 * sz, .18 * Math.PI, .82 * Math.PI); x.stroke(); if (o.lashes) { x.lineWidth = 2; x.beginPath(); x.moveTo(cx + side * 7 * sz, cy + 1); x.lineTo(cx + side * 10.5 * sz, cy - 1.5); x.stroke(); } return; }
    if (expr === 'happy') { x.strokeStyle = ink; x.lineWidth = 3.6; x.beginPath(); x.arc(cx, cy + 5, 8 * sz, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke(); lashes(); return; }
    const k = (expr === 'surprised' ? 1.18 : 1) * sz, st = o.eyes || 'rond';
    const ell = (rx, ry, fill, dx = 0, dy = 0) => { x.fillStyle = fill; x.beginPath(); x.ellipse(cx + dx * sz, cy + dy * sz, rx * k, ry * k, 0, 0, TAU); x.fill(); };
    if (st === 'points') { ell(3.8, 4.2, ink); return lashes(); }
    if (st === 'rond') { ell(7, 9, ink); ell(2.6, 2.6, '#fff', 2.4 * side, -3); ell(1.2, 1.2, '#fff', -2, 3.2); return lashes(); }
    if (st === 'chat') { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, cy, 9 * k, 7.5 * k, side * .18, 0, TAU); x.fill(); ell(6, 7, col); ell(1.7, 5.6, ink); ell(1.8, 1.8, '#fff', 2, -3); x.strokeStyle = ink; x.lineWidth = 2.6; x.beginPath(); x.ellipse(cx, cy, 9 * k, 7.5 * k, side * .18, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); return lashes(); }
    if (st === 'doux' || st === 'endormis') { const top = st === 'endormis' ? 1 : -2; x.save(); x.beginPath(); x.rect(cx - 12 * sz, cy + top, 24 * sz, 16 * sz); x.clip(); ell(8, 9, '#fff'); ell(6.5, 8, col); ell(3.3, 4.4, ink); ell(1.8, 1.8, '#fff', 2.2, 1); x.restore(); x.strokeStyle = ink; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 9 * sz, cy + top + 1); x.quadraticCurveTo(cx, cy + top - 3, cx + 9 * sz, cy + top + 1); x.stroke(); return lashes(); }
    if (st === 'coeurs') { ell(8.6, 10.5, '#fff'); x.fillStyle = col; const h = 6.2 * k; x.beginPath(); x.moveTo(cx, cy + h * .9); x.bezierCurveTo(cx - h * 1.6, cy - h * .2, cx - h * .6, cy - h * 1.3, cx, cy - h * .35); x.bezierCurveTo(cx + h * .6, cy - h * 1.3, cx + h * 1.6, cy - h * .2, cx, cy + h * .9); x.fill(); ell(1.8, 1.8, '#fff', -2 * side, -3); x.strokeStyle = ink; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, 9 * sz, 11 * sz, 0, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); return lashes(); }
    // manga / étoilés / brillants
    ell(8.6, 11.5, '#fff'); const g = x.createLinearGradient(0, cy - 10 * k, 0, cy + 10 * k); g.addColorStop(0, '#1d140e'); g.addColorStop(.45, col); g.addColorStop(1, st === 'brillants' ? '#ffffff' : col);
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy + 1, 7 * k, 10 * k, 0, 0, TAU); x.fill(); ell(3.2, 4.6, ink, 0, 1.5);
    if (st === 'etoiles') { x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = (i % 2 ? 1.4 : 3.6) * sz; x.lineTo(cx + 2 * side + Math.cos(a) * r, cy - 3.5 + Math.sin(a) * r); } x.fill(); }
    else { ell(2.8, 3.4, '#fff', 2.6 * side, -4); if (st === 'brillants') { ell(1.6, 1.6, '#fff', -2.8 * side, -5.5); ell(1.2, 1.2, '#fffbd0', 3 * side, 4.5); } }
    ell(1.3, 1.3, '#fff', -2.4 * side, 5);
    x.strokeStyle = ink; x.lineWidth = 3.4; x.beginPath(); x.ellipse(cx, cy, 9 * k, 12 * k, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.moveTo(cx + 7.5 * side * k, cy - 7 * k); x.lineTo(cx + 11 * side * k, cy - 10 * k); x.stroke(); lashes();
  }
  function mouthShape(x, o, expr) {
    const m = expr === 'happy' ? 'ouvert' : expr === 'surprised' ? 'o' : expr === 'sad' ? 'triste' : (o.mouth || 'sourire'), cx = 64, cy = 92;
    x.strokeStyle = '#5a2a1e'; x.lineWidth = 2.6; x.lineCap = 'round';
    const tongue = () => { x.fillStyle = '#ff8f9a'; x.beginPath(); x.ellipse(cx, cy + 4.5, 3.4, 2.4, 0, 0, TAU); x.fill(); };
    if (m === 'chat') { x.beginPath(); x.arc(cx - 3.4, cy, 3.4, .1, Math.PI - .1); x.arc(cx + 3.4, cy, 3.4, .1, Math.PI - .1); x.stroke(); }
    else if (m === 'ouvert') { x.fillStyle = '#9b3b3b'; x.beginPath(); x.moveTo(cx - 7, cy - 1); x.quadraticCurveTo(cx, cy + 12, cx + 7, cy - 1); x.closePath(); x.fill(); tongue(); }
    else if (m === 'o') { x.fillStyle = '#9b3b3b'; x.beginPath(); x.ellipse(cx, cy + 1, 3.6, 4.6, 0, 0, TAU); x.fill(); }
    else if (m === 'petit') { x.beginPath(); x.arc(cx, cy - 1, 3, .25 * Math.PI, .75 * Math.PI); x.stroke(); }
    else if (m === 'triste') { x.beginPath(); x.arc(cx, cy + 6, 5, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke(); }
    else if (m === 'bisou') { x.lineWidth = 2.4; x.beginPath(); x.arc(cx + 1, cy - 2, 2.6, -1.4, 1.4); x.stroke(); x.beginPath(); x.arc(cx + 1, cy + 3, 2.6, -1.4, 1.4); x.stroke(); }
    else { x.beginPath(); x.arc(cx, cy - 3, 6, .2 * Math.PI, .8 * Math.PI); x.stroke(); if (m === 'langue') { x.fillStyle = '#ff8f9a'; x.beginPath(); x.ellipse(cx + 2, cy + 3.5, 2.8, 2.6, 0, 0, TAU); x.fill(); } if (m === 'dent') { x.fillStyle = '#ffffff'; x.fillRect(cx - 4.5, cy + 1.2, 3.4, 3.2); x.strokeStyle = 'rgba(90,42,30,.4)'; x.lineWidth = 1; x.strokeRect(cx - 4.5, cy + 1.2, 3.4, 3.2); } }
  }
  function drawFace(o, expr) {
    const c = G.cv(128, 128), x = c.getContext('2d'), sp = o.sp || 'humain', cheek = o.cheek || (o.blush === false ? 'aucune' : 'rose');
    if (cheek === 'rose') { x.fillStyle = 'rgba(255,110,130,.42)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(64 + s * 34, 84, 9.5, 5.5, 0, 0, TAU); x.fill(); } }
    if (cheek === 'coeurs') { x.fillStyle = 'rgba(255,95,135,.75)'; for (const s of [-1, 1]) { const hx = 64 + s * 34, hy = 82; x.beginPath(); x.moveTo(hx, hy + 5); x.bezierCurveTo(hx - 8, hy, hx - 4, hy - 6, hx, hy - 2); x.bezierCurveTo(hx + 4, hy - 6, hx + 8, hy, hx, hy + 5); x.fill(); } }
    if (cheek === 'etoiles') { x.fillStyle = 'rgba(255,200,60,.85)'; for (const s of [-1, 1]) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 2.4 : 6; x.lineTo(64 + s * 34 + Math.cos(a) * r, 83 + Math.sin(a) * r); } x.fill(); } }
    if (o.freckles) { x.fillStyle = 'rgba(150,90,50,.6)'; for (const [dx, dy] of [[-30, 78], [-25, 82], [-35, 83], [30, 78], [25, 82], [35, 83]]) { x.beginPath(); x.arc(64 + dx, dy, 1.3, 0, TAU); x.fill(); } }
    if (sp !== 'grenouille') { const ring = sp === 'hibou'; for (const s of [-1, 1]) { if (ring) { x.fillStyle = '#ffd35a'; x.beginPath(); x.arc(64 + s * 22, 63, 14, 0, TAU); x.fill(); } eyeShape(x, 64 + s * 22, 64, s, o, expr); } }
    const bw = o.brows || 'normaux';
    if ((sp === 'humain' || o.brows) && bw !== 'aucun') { x.strokeStyle = hex(new THREE.Color(o.hairCol || 0x6b3f22).multiplyScalar(.7).getHex()); x.lineWidth = bw === 'epais' ? 4.6 : bw === 'fins' ? 1.6 : 2.6; x.lineCap = 'round';
      for (const s of [-1, 1]) { const t = expr === 'sad' ? s * 3 : bw === 'fronces' ? -s * 3.5 : 0, up = (expr === 'surprised' ? -4 : 0) + (bw === 'joyeux' ? -3 : 0); x.beginPath(); x.moveTo(64 + s * 15, 47 + up - t); x.quadraticCurveTo(64 + s * 22, (bw === 'joyeux' ? 40 : 43) + up, 64 + s * 29, 47 + up + t); x.stroke(); } }
    if (sp === 'humain' && o.nose && o.nose !== 'aucun') { if (o.nose === 'point') { x.fillStyle = 'rgba(120,60,40,.55)'; x.beginPath(); x.arc(64, 78, 1.6, 0, TAU); x.fill(); } else { const big = o.nose === 'rond'; x.fillStyle = big ? 'rgba(200,110,90,.35)' : 'rgba(170,90,70,.3)'; x.beginPath(); x.ellipse(64, 78, big ? 5 : 3.2, big ? 3.8 : 2.4, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(62.6, 76.8, big ? 1.4 : 1, 0, TAU); x.fill(); } }
    if (['chat', 'lapin', 'renard'].includes(sp)) { x.fillStyle = sp === 'renard' ? '#2a1b12' : '#ff7f9f'; x.beginPath(); x.moveTo(60, 79); x.lineTo(68, 79); x.lineTo(64, 84); x.closePath(); x.fill(); }
    if (['ours', 'chien', 'blaireau', 'singe'].includes(sp)) { x.fillStyle = '#2a1b12'; x.beginPath(); x.ellipse(64, 80, 5.5, 4, 0, 0, TAU); x.fill(); }
    if (sp === 'chat' || sp === 'renard') { x.strokeStyle = 'rgba(60,40,30,.7)'; x.lineWidth = 1.5; for (const s of [-1, 1]) for (const d of [-3, 2]) { x.beginPath(); x.moveTo(64 + s * 12, 86 + d * .6); x.lineTo(64 + s * 26, 84 + d * 1.5); x.stroke(); } }
    if (!['canard', 'hibou'].includes(sp)) mouthShape(x, o, expr);
    return c;
  }
  // ---------- pièces : cheveux, chapeaux, accessoires ----------
  const cap = (b, r, thetaLen, col, x, y, z, rx, sx = 1, sy = 1, sz = 1) => b.add(new THREE.SphereGeometry(r, 16, 10, 0, TAU, 0, thetaLen), col, b.M(x, y, z, rx, 0, 0, sx, sy, sz), 0, true);
  function hairOn(b, st, col) {
    if (st === 'chauve') return;
    cap(b, .318, 1.42, col, 0, .015, -.012, -.32, 1.07, .98, 1.04);
    if (st !== 'meche' && st !== 'herisse') for (let i = -2; i <= 2; i++) b.sph(.075, col, i * .085, .16 - Math.abs(i) * .012, .245 - Math.abs(i) * .02, 1.2, .8, .6, 0, 8, 6);
    if (st === 'carre') { for (const s of [-1, 1]) b.sph(.2, col, s * .25, -.07, -.02, .5, 1.15, .95); b.sph(.27, col, 0, -.03, -.13, 1.08, 1, .7); }
    if (st === 'long') { b.sph(.28, col, 0, -.22, -.13, 1.12, 1.7, .62); for (const s of [-1, 1]) b.sph(.12, col, s * .25, -.2, .02, .7, 1.8, .7); }
    if (st === 'queue') { b.sph(.12, col, 0, .1, -.32); b.sph(.11, col, 0, -.13, -.37, 1, 2.1, 1); b.tor(.07, .025, 0xff8fc0, 0, .04, -.33, Math.PI / 2.4); }
    if (st === 'couettes') for (const s of [-1, 1]) { b.sph(.13, col, s * .31, -.05, -.08, .9, 1.25, .9); b.tor(.06, .022, 0xff8fc0, s * .27, .07, -.06, 0, 0, s * .9); }
    if (st === 'herisse') for (let i = 0; i < 8; i++) { const a = -1.4 + i * .4; b.cone(.08, .26, 5, col, Math.sin(a) * .22, .23 + Math.cos(i) * .03, Math.cos(a) * .12 - .02, -.35 + Math.cos(a) * .2, 0, -Math.sin(a) * .6); }
    if (st === 'boucles') for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; b.sph(.1, col, Math.cos(a) * .27, .1 + Math.sin(i * 1.7) * .08, Math.sin(a) * .22 - .05, 1, 1, 1, 0, 7, 5); }
    if (st === 'chignon') { b.sph(.13, col, 0, .31, -.06); b.tor(.085, .025, 0xffc23d, 0, .23, -.05, Math.PI / 2); }
    if (st === 'meche') { b.sph(.2, col, -.07, .14, .2, 1.3, .55, .5); b.sph(.12, col, .14, .12, .22, 1, .5, .5); }
    if (st === 'afro') { b.sph(.36, col, 0, .17, -.13, 1.14, .95, .95); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; if (Math.sin(a) > .3) continue; b.sph(.12, col, Math.cos(a) * .34, .15 + Math.sin(i * 2.1) * .09, Math.sin(a) * .26 - .1, 1, 1, 1, 0, 7, 5); } for (let i = 0; i < 5; i++) b.sph(.1, col, -.2 + i * .1, .33, -.02, 1, .8, 1, 0, 7, 5); }
    if (st === 'tresses') { b.sph(.27, col, 0, -.05, -.13, 1.05, .9, .7); for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) b.sph(.068 - i * .007, col, s * (.24 + i * .008), -.1 - i * .1, -.05, 1, 1.15, 1, 0, 7, 5); b.tor(.04, .016, 0xff8fc0, s * .25, -.47, -.05, Math.PI / 2); } }
    if (st === 'frange') { for (let i = -3; i <= 3; i++) b.box(.085, .15, .06, col, i * .075, .12, .265 - Math.abs(i) * .022, -.25); b.sph(.27, col, 0, -.08, -.13, 1.08, 1.05, .7); }
    if (st === 'ondule') { b.sph(.28, col, 0, -.2, -.15, 1.1, 1.6, .65); for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; b.sph(.13, col, s * (.23 + (i >> 1) * .02), -.06 - (i >> 1) * .15, -.08 - (i >> 1) * .03, 1, 1.1, .8, 0, 8, 6); } }
    if (st === 'macarons') for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(.085, .048, 6, 14), col, b.M(s * .27, .03, -.04, 0, s * 1.2, 0), 0, true); b.sph(.065, col, s * .28, .03, -.04); }
    if (st === 'crete') for (let i = 0; i < 6; i++) b.cone(.06, .24 - Math.abs(i - 2.5) * .025, 4, col, 0, .33, .17 - i * .08, -.55 + i * .2, 0, 0);
    if (st === 'mi_long') { b.sph(.27, col, 0, -.1, -.12, 1.1, 1.25, .7); for (const s of [-1, 1]) b.sph(.12, col, s * .26, -.12, .02, .7, 1.4, .7); }
  }
  function hatOn(b, st, col) {
    if (st === 'bonnet') { cap(b, .335, 1.18, col, 0, .03, 0, -.22, 1.05, 1, 1.03); b.add(new THREE.TorusGeometry(.3, .045, 6, 16), 0xffffff, b.M(0, .1, .02, Math.PI / 2 - .22, 0, 0, 1.05, 1.03, 1), 0, true); b.sph(.075, 0xffffff, 0, .36, -.08); }
    if (st === 'casquette') { cap(b, .325, 1.3, col, 0, .03, 0, -.12, 1.05, .95, 1.03); b.add(new THREE.CylinderGeometry(.2, .2, .025, 14, 1, false, 0, Math.PI), col, b.M(0, .13, .2, .05, Math.PI / 2, 0, 1.1, 1, 1.2), 0, true); }
    if (st === 'chapeau') { b.cyl(.5, .5, .025, 18, 0xe9cf7f, 0, .17, 0, -.12, 0, 0, 0, true); b.cyl(.25, .28, .17, 14, 0xe9cf7f, 0, .26, -.02, -.12, 0, 0, 0, true); b.cyl(.285, .285, .045, 14, col, 0, .2, -.015, -.12, 0, 0, 0, true); }
    if (st === 'noeud') { b.cone(.07, .15, 4, col, .16, .27, .05, 0, 0, Math.PI / 2 + .3); b.cone(.07, .15, 4, col, .32, .21, .05, 0, 0, -Math.PI / 2 + .3); b.sph(.045, col, .24, .24, .05); }
    if (st === 'couronne') { b.cyl(.17, .17, .09, 10, 0xffd23f, 0, .31, -.02, -.15, 0, 0, 0, true); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.cone(.035, .09, 4, 0xffd23f, Math.cos(a) * .15, .39, Math.sin(a) * .15 - .02); } b.sph(.03, 0xe8434a, 0, .31, .15); }
    if (st === 'fleur') { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.sph(.045, col, .2 + Math.cos(a) * .045, .22 + Math.sin(a) * .045, .14, 1, 1, .5, 0, 6, 5); } b.sph(.03, 0xffe27a, .2, .22, .16); }
    if (st === 'feuille') { b.cyl(.012, .012, .1, 4, 0x6b4a2a, 0, .33, 0); b.sph(.09, 0x58b54a, .07, .4, 0, 1.6, .35, .9); }
    if (st === 'oreilles') for (const s of [-1, 1]) { b.cone(.085, .17, 4, col, s * .18, .3, -.02, 0, 0, -s * .4); b.cone(.045, .1, 4, 0xff9fbf, s * .18, .29, .015, 0, 0, -s * .4); }
    if (st === 'beret') { b.sph(.3, col, -.04, .27, -.02, 1.15, .3, 1.1); b.cyl(.012, .02, .06, 5, col, -.02, .37, -.02); }
    if (st === 'sorciere') { b.cyl(.5, .5, .025, 18, col, 0, .2, 0, -.1, 0, 0, 0, true); b.cone(.24, .62, 14, col, 0, .5, -.05, -.25, 0, 0); b.cyl(.245, .245, .06, 14, 0xd9b84a, 0, .24, -.02, -.1, 0, 0, 0, true); }
    if (st === 'bandana') { cap(b, .325, 1.0, col, 0, .03, 0, -.3, 1.05, 1, 1.03); b.cone(.07, .15, 4, col, .02, -.02, -.31, Math.PI / 2 + .4, 0, 0); for (let i = 0; i < 6; i++) b.sph(.018, 0xffffff, -.2 + i * .08, .2 - Math.abs(i - 2.5) * .02, .25 - Math.abs(i - 2.5) * .03); }
    if (st === 'casque') { b.add(new THREE.TorusGeometry(.33, .025, 6, 18, Math.PI), col, b.M(0, .02, 0, 0, Math.PI / 2, 0), 0, true); for (const s of [-1, 1]) { b.cyl(.09, .09, .07, 12, col, s * .32, 0, 0, 0, 0, Math.PI / 2); b.cyl(.07, .07, .075, 12, 0x2a2d33, s * .345, 0, 0, 0, 0, Math.PI / 2); } }
    if (st === 'lapin') for (const s of [-1, 1]) { b.sph(.07, col, s * .12, .42, -.04, 1, 3.2, .7); b.sph(.04, 0xff9fbf, s * .12, .42, .005, 1, 2.8, .4); }
  }
  function accOn(b, st) {
    if (st === 'lunettes' || st === 'soleil') { for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(.068, .012, 5, 14), 0x2a2d33, b.M(s * .1, .015, .29, 0, 0, 0), 0, true); if (st === 'soleil') b.cyl(.064, .064, .008, 12, 0x1a1c22, s * .1, .015, .292, Math.PI / 2); } b.box(.06, .012, .012, 0x2a2d33, 0, .02, .3); }
    if (st === 'etoile') { b.sph(.05, 0xffd23f, -.2, .2, .17, 1, 1, .45, 0, 6, 4); b.sph(.03, 0xfff3b0, -.2, .2, .19); }
    if (st === 'boucles') for (const s of [-1, 1]) { b.sph(.03, 0xffd23f, s * .315, -.09, .02); b.add(new THREE.TorusGeometry(.035, .011, 4, 10), 0xffd23f, b.M(s * .315, -.14, .02), 0, true); }
    if (st === 'pansement') { b.box(.11, .038, .012, 0xf3d1a8, .15, -.03, .285, 0, .45, -.5); b.box(.032, .032, .014, 0xe8b88a, .15, -.03, .287, 0, .45, -.5); }
    if (st === 'moustache') for (const s of [-1, 1]) b.sph(.052, 0x3a2a1a, s * .046, -.085, .29, 1.4, .55, .5);
  }
  function speciesOn(b, sp, fur, acc) {
    const dark = new THREE.Color(fur).multiplyScalar(.8).getHex(), light = new THREE.Color(fur).lerp(new THREE.Color(0xffffff), .5).getHex();
    if (sp === 'lapin') for (const s of [-1, 1]) { b.sph(.075, fur, s * .11, .34, -.02, 1, 3, .7); b.sph(.045, 0xff9fbf, s * .11, .34, .025, 1, 2.6, .4); }
    if (sp === 'chat') for (const s of [-1, 1]) { b.cone(.1, .17, 4, fur, s * .16, .26, 0, 0, 0, -s * .35); b.cone(.05, .1, 4, 0xff9fbf, s * .16, .25, .03, 0, 0, -s * .35); }
    if (sp === 'ours') { for (const s of [-1, 1]) b.sph(.085, fur, s * .19, .22, -.02, 1, 1, .7); b.sph(.11, light, 0, -.08, .21, 1.25, .8, .8); }
    if (sp === 'canard') { b.sph(.12, 0xffa62b, 0, -.06, .24, 1.35, .45, 1); b.cone(.04, .12, 4, 0xffd23f, 0, .3, 0); }
    if (sp === 'blaireau') { b.sph(.085, 0xfaf7f0, 0, .1, .17, .8, 1.6, .8); for (const s of [-1, 1]) b.sph(.06, fur, s * .2, .17, -.02, 1, 1, .6); }
    if (sp === 'mouton') { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.sph(.1, 0xfaf7f0, Math.cos(a) * .26, .14 + Math.sin(a * 2) * .05, Math.sin(a) * .2 - .06, 1, 1, 1, 0, 7, 5); } for (const s of [-1, 1]) b.sph(.07, dark, s * .3, .02, 0, 1.6, .6, .8); }
    if (sp === 'hibou') { for (const s of [-1, 1]) b.cone(.06, .16, 4, dark, s * .17, .3, 0, 0, 0, -s * .3); b.cone(.04, .09, 4, 0xffb22b, 0, -.06, .3, Math.PI / 2 + .3); }
    if (sp === 'singe') { for (const s of [-1, 1]) { b.sph(.1, fur, s * .3, .03, -.02, .5, 1, 1); b.sph(.06, light, s * .31, .03, .01, .4, .8, .8); } b.sph(.2, light, 0, -.05, .14, 1.2, .9, .6); }
    if (sp === 'grenouille') for (const s of [-1, 1]) { b.sph(.1, fur, s * .13, .26, .1); b.sph(.065, 0xffffff, s * .13, .28, .17); b.sph(.035, 0x1a1a1a, s * .13, .28, .22); }
    if (sp === 'tortue') { b.sph(.05, light, 0, -.07, .28, 1.4, .5, .5); }
    if (sp === 'renard') { for (const s of [-1, 1]) { b.cone(.1, .2, 4, fur, s * .16, .28, 0, 0, 0, -s * .35); b.cone(.04, .07, 4, 0x2a1b12, s * .2, .37, 0, 0, 0, -s * .35); } b.sph(.13, 0xfaf7f0, 0, -.1, .19, 1.2, .7, .8); }
    if (sp === 'chien') { for (const s of [-1, 1]) b.sph(.09, dark, s * .29, -.02, -.02, .55, 1.4, .9); b.sph(.12, light, 0, -.09, .2, 1.2, .75, .8); }
    if (sp === 'pigeon') { b.cone(.055, .15, 6, 0xe8a33a, 0, -.05, .32, Math.PI / 2); b.sph(.05, 0xf3efe6, 0, .01, .27, 1.2, .7, .6); for (const k of [-1, 0, 1]) b.cone(.035, .14, 4, dark, k * .05, .32, -.04 - Math.abs(k) * .03, -.3, 0, -k * .3); b.add(new THREE.TorusGeometry(.25, .045, 6, 16), 0x6fbf9a, b.M(0, -.24, 0, Math.PI / 2, 0, 0), 0, true); }
    if (sp === 'caniche') { b.sph(.16, light, 0, .3, -.03, 1, .8, 1); b.sph(.09, light, .1, .37, .02); b.sph(.09, light, -.1, .36, .04); for (const s of [-1, 1]) { b.sph(.11, light, s * .3, -.04, -.02, .7, 1.25, .9); b.sph(.08, light, s * .32, -.17, 0, .8, .8, .8); } b.sph(.1, light, 0, -.1, .2, 1.1, .7, .8); b.sph(.035, 0x2a1d14, 0, -.06, .29); }
    if (sp === 'mouffette') { b.sph(.07, 0xfaf7f0, 0, .2, .07, .7, 2.4, .7); for (const s of [-1, 1]) b.sph(.065, fur, s * .19, .24, -.02, 1, 1, .6); b.sph(.1, light, 0, -.1, .2, 1.1, .7, .8); b.sph(.035, 0x2a1d14, 0, -.06, .29); }
    if (sp === 'paresseux') { for (const s of [-1, 1]) b.sph(.055, dark, s * .22, .2, -.02, 1, 1, .6); b.sph(.13, light, 0, -.09, .19, 1.25, .75, .75); b.sph(.04, 0x3a2a1a, 0, -.05, .29); b.sph(.24, dark, 0, .2, -.06, 1.1, .45, 1); }
    if (sp === 'loutre') { for (const s of [-1, 1]) b.sph(.06, fur, s * .23, .19, -.02, 1, 1, .6); b.sph(.12, light, 0, -.1, .2, 1.3, .7, .75); b.sph(.038, 0x2a1d14, 0, -.06, .29); }
    if (sp === 'alpaga') { for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; b.sph(.09, light, Math.cos(a) * .12, .3 + Math.sin(a * 2) * .03, Math.sin(a) * .1 - .02, 1, 1, 1, 0, 7, 5); } b.sph(.11, light, 0, .36, 0); for (const s of [-1, 1]) b.cone(.05, .2, 5, fur, s * .2, .32, -.03, 0, 0, -s * .5); b.sph(.12, light, 0, -.1, .19, 1.15, .78, .8); b.sph(.03, 0x2a1d14, 0, -.05, .29, 1.3, .8, .6); }
    if (sp === 'axolotl') { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.cone(.04, .2, 5, 0xff6f9a, s * (.29 + k * .02), .14 - k * .1, -.02, 0, 0, -s * (1.0 + k * .35)); b.sph(.03, 0xff6f9a, 0, -.12, .29, 2.2, .5, .5); }
  }
  // ---------- assemblage ----------
  const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  G.designTex = k => { const d = (G.designs || [])[k]; if (!d || !d.img) return null; if (d._tex && d._src === d.img) return d._tex; const im = new Image(); const t = new THREE.Texture(im); im.onload = () => { t.needsUpdate = true; }; im.src = d.img; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; d._tex = t; d._src = d.img; return t; };
  G.makeChar = (o = {}) => {
    const sp = o.sp || 'humain', human = sp === 'humain', L = human ? G.normLook(o.look || o) : null;
    const top = human ? L.top : (o.top || 'tshirt'), swim = top === 'maillot';
    const skin = human ? L.skin : (o.col || 0xd9b38c), topCol = human ? L.topCol : (o.shirt || 0x4fb35f), botCol = swim ? topCol : human ? L.botCol : (o.pants || 0x5a4a3a);
    const bottom = swim ? 'short' : human ? L.bottom : 'short', shoes = swim ? skin : human ? L.shoes : new THREE.Color(skin).multiplyScalar(.75).getHex(), shoe = human && !swim ? (L.shoe || 'baskets') : 'nu';
    const acc = human ? L.acc : 'aucun', accCol = human && L.accCol != null ? L.accCol : 0xe8434a, dark = c => new THREE.Color(c).multiplyScalar(.78).getHex();
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(.93 * (human ? (L.height === 'petit' ? .9 : L.height === 'grand' ? 1.08 : 1) : 1));
    const P = { root, body, look: L, meshes: [], faces: {}, sp };
    const add = (parent, geo, mat, outline = true) => { const m = new THREE.Mesh(geo, mat || G.MATS); m.castShadow = true; m.frustumCulled = false; m.userData.mat0 = m.material; parent.add(m); P.meshes.push(m); if (outline) G.addOutline(m, G.M.outline); return m; };
    // torse (texture de motif possible)
    const dz = human && L.design >= 0 ? G.designTex(L.design) : null, robe = top === 'robe' || top === 'kimono' || top === 'manteau', longSkirt = bottom === 'jupe_longue' && !robe;
    const torsoMat = G.toon({ color: dz ? 0xffffff : topCol, map: dz }, {});
    const tg = robe ? new THREE.CylinderGeometry(.15, top === 'manteau' ? .23 : .27, .44, 16) : new THREE.CylinderGeometry(.15, .19, .32, 16);
    tg.translate(0, robe ? .35 : .41, 0); add(body, tg, torsoMat);
    let b = G.mb(5); b.sph(.155, topCol, 0, robe ? .56 : .57, 0, 1, .45, 1, 0, 12, 8);
    if (!robe && bottom !== 'jupe' && !longSkirt) b.cyl(.19, .18, .08, 14, botCol, 0, .27, 0, 0, 0, 0, 0, true);
    if (bottom === 'jupe' && !robe) b.cyl(.19, .27, .17, 14, botCol, 0, .22, 0, 0, 0, 0, 0, true);
    if (longSkirt) b.cyl(.19, .29, .34, 16, botCol, 0, .14, 0, 0, 0, 0, 0, true);
    if (top === 'salopette') { b.box(.2, .17, .02, botCol, 0, .38, .175); for (const s of [-1, 1]) b.box(.04, .2, .02, botCol, s * .08, .48, .16, -.15); b.cyl(.195, .19, .1, 14, botCol, 0, .3, 0, 0, 0, 0, 0, true); }
    if (top === 'veste') { b.box(.08, .27, .02, 0xfaf7f0, 0, .42, .176); }
    if (top === 'kimono') b.cyl(.2, .2, .06, 14, new THREE.Color(topCol).multiplyScalar(.6).getHex(), 0, .4, 0, 0, 0, 0, 0, true);
    if (top === 'hoodie') { b.sph(.17, topCol, 0, .6, -.14, 1.15, .8, .7); for (const s of [-1, 1]) b.cyl(.008, .008, .12, 4, 0xffffff, s * .05, .5, .168); b.box(.17, .07, .02, dark(topCol), 0, .33, .187); }
    if (top === 'chemise') { for (const s of [-1, 1]) b.box(.075, .045, .02, 0xffffff, s * .045, .555, .14, .4, 0, s * .5); for (let i = 0; i < 3; i++) b.sph(.013, 0xffffff, 0, .5 - i * .07, .168 + i * .006); }
    if (top === 'marin') for (const y of [.33, .41, .49]) b.add(new THREE.TorusGeometry(.19 - (y - .25) * .125, .012, 4, 22), topCol === 0x2f4f9a ? 0xffffff : 0x2f4f9a, b.M(0, y, 0, Math.PI / 2, 0, 0), 0, true);
    if (top === 'manteau') { for (let i = 0; i < 3; i++) b.sph(.018, 0xd9b84a, .035, .5 - i * .1, .18 + i * .016); b.box(.025, .4, .02, dark(topCol), 0, .36, .19); for (const s of [-1, 1]) b.box(.06, .05, .02, dark(topCol), s * .1, .3, .2); }
    if (acc === 'echarpe') { b.add(new THREE.TorusGeometry(.13, .046, 6, 16), accCol, b.M(0, .6, 0, Math.PI / 2, 0, 0), 0, true); b.box(.07, .22, .04, accCol, .07, .49, .15, .1, 0, .12); b.box(.07, .02, .041, dark(accCol), .07, .4, .16, .1, 0, .12); }
    if (acc === 'sac') { b.box(.26, .3, .13, accCol, 0, .42, -.21); b.box(.2, .1, .04, dark(accCol), 0, .36, -.285); for (const s of [-1, 1]) b.box(.03, .32, .03, 0x6b4a32, s * .1, .45, .14, .12, 0, 0); }
    if (acc === 'ailes') for (const s of [-1, 1]) { b.add(new THREE.SphereGeometry(.19, 10, 8), 0xf3f7ff, b.M(s * .17, .56, -.2, 0, s * .6, s * .45, .3, 1.05, .12), 2, true); b.add(new THREE.SphereGeometry(.12, 8, 6), 0xffe0f0, b.M(s * .15, .38, -.19, 0, s * .6, -s * .3, .3, 1, .12), 2, true); }
    if (sp === 'chat' || sp === 'singe') b.cyl(.025, .035, .36, 5, skin, 0, .36, -.3, 1.1);
    if (sp === 'renard') b.cone(.09, .35, 6, skin, 0, .3, -.3, -1.2);
    if (sp === 'tortue') b.sph(.24, 0x6f9a52, 0, .42, -.12, 1, 1.05, .7);
    if (o.apron) b.box(.3, .26, .02, o.apron, 0, .4, .2);
    add(body, b.done());
    // tête (un peu plus grosse : mignon)
    const head = new THREE.Group(); head.position.set(0, .87, 0); head.scale.setScalar(1.07); body.add(head); P.head = head;
    b = G.mb(6); b.sph(.3, skin, 0, 0, 0, 1.06, .97, 1, 0, 18, 14);
    if (human) { for (const s of [-1, 1]) b.sph(.06, skin, s * .31, -.03, 0, .6, 1, 1); hairOn(b, ['casquette', 'bonnet', 'bandana', 'beret'].includes(L.hat) ? (['herisse', 'crete', 'afro'].includes(L.hair) ? 'court' : L.hair) : L.hair, L.hairCol); hatOn(b, L.hat, L.hatCol); accOn(b, L.acc); }
    else speciesOn(b, sp, skin, o.acc);
    add(head, b.done());
    const fl = Object.assign({ sp }, human ? L : { eyes: o.eyes || 'rond', eyeCol: 0x2a1b12, mouth: o.mouth || 'sourire', blush: true });
    P.faceMat = G.toon({ map: tex(drawFace(fl, 'normal')), transparent: true, alphaTest: .35, polygonOffset: true, polygonOffsetFactor: -3 }, {});
    P.faces.normal = P.faceMat.map; P.faceOpts = fl;
    const fg = new THREE.SphereGeometry(.302, 22, 16, Math.PI / 2 - .95, 1.9, Math.PI / 2 - .78, 1.3); fg.scale(1.06, .97, 1);
    const fm = new THREE.Mesh(fg, P.faceMat); fm.frustumCulled = false; head.add(fm); P.faceMesh = fm;
    P.eyes = new THREE.Object3D(); head.add(P.eyes);
    P.setExpr = e => { if (P.expr === e) return; P.expr = e; if (!P.faces[e]) P.faces[e] = tex(drawFace(P.faceOpts, e)); P.faceMat.map = P.faces[e]; };
    // bras et jambes
    const longSleeve = ['pull', 'veste', 'kimono', 'hoodie', 'chemise', 'manteau'].includes(top), bare = swim || top === 'debardeur';
    const arm = side => {
      const g = new THREE.Group(); g.position.set(side * .2, .53, 0); body.add(g);
      const bb = G.mb(8); bb.cyl(top === 'kimono' ? .08 : .058, .062, .13, 8, bare ? skin : topCol, 0, -.05, 0, 0, 0, 0, 0, true); bb.cyl(.05, .052, .11, 8, longSleeve ? topCol : skin, 0, -.16, 0, 0, 0, 0, 0, true); bb.sph(.058, skin, 0, -.24, 0, 1, 1, 1, 0, 10, 8);
      add(g, bb.done()); const hand = new THREE.Group(); hand.position.set(0, -.24, .02); g.add(hand); return [g, hand];
    };
    [P.armL] = arm(-1); [P.armR, P.hand] = arm(1);
    const leg = side => {
      const g = new THREE.Group(); g.position.set(side * .085, .28, 0); body.add(g); const bb = G.mb(9), pants = !robe && (bottom === 'pantalon'), up = !robe && ['short', 'bermuda', 'pantalon'].includes(bottom) ? botCol : skin;
      bb.cyl(.062, .058, .1, 8, up, 0, -.04, 0, 0, 0, 0, 0, true); bb.cyl(.055, .052, .1, 8, pants ? botCol : skin, 0, -.13, 0, 0, 0, 0, 0, true);
      if (!robe && bottom === 'bermuda') bb.cyl(.059, .057, .05, 8, botCol, 0, -.105, 0, 0, 0, 0, 0, true);
      if (shoe === 'bottes') { bb.cyl(.061, .063, .12, 8, shoes, 0, -.17, 0, 0, 0, 0, 0, true); bb.sph(.075, shoes, 0, -.22, .025, 1, .62, 1.3, 0, 10, 8); }
      else if (shoe === 'sandales') { bb.sph(.066, skin, 0, -.215, .025, 1, .55, 1.25, 0, 10, 8); bb.box(.11, .022, .18, shoes, 0, -.255, .025); bb.box(.1, .016, .03, shoes, 0, -.213, .065); }
      else if (shoe === 'ballerines') { bb.sph(.068, shoes, 0, -.225, .028, 1, .5, 1.25, 0, 10, 8); bb.sph(.022, 0xffffff, 0, -.205, .1); }
      else { bb.sph(.075, shoes, 0, -.22, .025, 1, .62, 1.3, 0, 10, 8); if (shoe === 'baskets') bb.box(.12, .022, .19, 0xffffff, 0, -.258, .03); }
      add(g, bb.done()); return g;
    };
    P.legL = leg(-1); P.legR = leg(1);
    return P;
  };
  G.drawFaceCanvas = drawFace;
})();
