'use strict';
// ===== Intérieurs v2 : papiers peints & sols texturés, fenêtres « vivantes », magasins, mairie, musée, gare, agrandissement =====
(function () {
  const TAU = Math.PI * 2;
  // ---------- motifs de murs et de sols (dessinés, raccordables) ----------
  const S = 128;
  const dots = (x, n, col, r, rnd) => { x.fillStyle = col; for (let i = 0; i < n; i++) { const px = rnd() * S, py = rnd() * S; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.beginPath(); x.arc(px + ox, py + oy, r, 0, TAU); x.fill(); } } };
  const grid = (x, n, f) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) f(i * S / n, j * S / n, S / n, i, j); };
  G.WALLS = [
    ['creme', 'Crème', x => { x.fillStyle = '#f7e6c8'; x.fillRect(0, 0, S, S); x.fillStyle = 'rgba(200,160,110,.18)'; for (let i = 0; i < 8; i++) x.fillRect(i * 16, 0, 2, S); }],
    ['rose', 'Rayures roses', x => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffd3e1' : '#ffeaf1'; x.fillRect(i * 16, 0, 16, S); } }],
    ['menthe', 'Menthe fleurie', (x, r) => { x.fillStyle = '#d8f1e2'; x.fillRect(0, 0, S, S); dots(x, 12, '#ffffff', 5, r); dots(x, 12, '#ff9fbf', 2.5, r); }],
    ['pois', 'Pois soleil', x => { x.fillStyle = '#fff1bd'; x.fillRect(0, 0, S, S); x.fillStyle = '#ffffff'; grid(x, 4, (a, b, s, i, j) => { x.beginPath(); x.arc(a + s / 2 + (j % 2) * s / 2, b + s / 2, 7, 0, TAU); x.fill(); }); }],
    ['lambris', 'Lambris', x => { for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#c99158' : '#d4a06a'; x.fillRect(i * S / 6, 0, S / 6, S); x.fillStyle = '#8f5d33'; x.fillRect(i * S / 6, 0, 2, S); } }],
    ['briques', 'Briques', x => { x.fillStyle = '#e8d9c0'; x.fillRect(0, 0, S, S); grid(x, 8, (a, b, s, i, j) => { x.fillStyle = (i + j) % 3 ? '#c4654a' : '#b85a41'; x.fillRect(a + (j % 2) * s / 2 + 1, b + 1, s - 2, s / 2 - 2); x.fillRect(a + (j % 2) * s / 2 + 1, b + s / 2 + 1, s - 2, s / 2 - 2); }); }],
    ['etoiles', 'Nuit étoilée', (x, r) => { x.fillStyle = '#26305e'; x.fillRect(0, 0, S, S); dots(x, 30, '#ffe27a', 1.6, r); dots(x, 6, '#ffffff', 3, r); }],
    ['nuages', 'Ciel', x => { x.fillStyle = '#bfe6fa'; x.fillRect(0, 0, S, S); x.fillStyle = '#ffffff'; for (const [a, b] of [[30, 30], [95, 85], [60, 110]]) for (const [dx, dy, rr] of [[0, 0, 12], [12, -5, 10], [24, 0, 11], [12, 5, 10]]) { x.beginPath(); x.arc(a + dx, b + dy, rr, 0, TAU); x.fill(); } }],
    ['damier', 'Damier pastel', x => grid(x, 4, (a, b, s, i, j) => { x.fillStyle = (i + j) % 2 ? '#e7e0ff' : '#fff6e0'; x.fillRect(a, b, s, s); })],
    ['jungle', 'Jungle', (x, r) => { x.fillStyle = '#9fd18a'; x.fillRect(0, 0, S, S); for (let i = 0; i < 14; i++) { const px = r() * S, py = r() * S, a = r() * TAU; x.fillStyle = i % 2 ? '#4f9a46' : '#6cb756'; x.save(); x.translate(px, py); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 16, 6, 0, 0, TAU); x.fill(); x.restore(); } }],
    ['carreaux', 'Carreaux bleus', x => grid(x, 4, (a, b, s, i, j) => { x.fillStyle = '#ffffff'; x.fillRect(a, b, s, s); x.fillStyle = '#5b8fd6'; x.beginPath(); x.moveTo(a + s / 2, b + 3); x.lineTo(a + s - 3, b + s / 2); x.lineTo(a + s / 2, b + s - 3); x.lineTo(a + 3, b + s / 2); x.fill(); })],
    ['coeurs', 'Petits cœurs', x => { x.fillStyle = '#ffe3ea'; x.fillRect(0, 0, S, S); x.fillStyle = '#ff7f9f'; grid(x, 4, (a, b, s, i, j) => { const cx = a + s / 2 + (j % 2) * s / 2, cy = b + s / 2; x.beginPath(); x.arc(cx - 4, cy - 2, 4.5, 0, TAU); x.arc(cx + 4, cy - 2, 4.5, 0, TAU); x.fill(); x.beginPath(); x.moveTo(cx - 8.5, cy); x.lineTo(cx, cy + 9); x.lineTo(cx + 8.5, cy); x.fill(); }); }],
    ['fleurs_cottage', 'Fleurs de cottage', (x,r) => { x.fillStyle='#f8eee0';x.fillRect(0,0,S,S);x.strokeStyle='#9bb486';x.lineWidth=2;for(let i=0;i<7;i++){let px=r()*S,py=r()*S;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px-12,py+18,px+5,py+34);x.stroke();for(let k=0;k<3;k++){x.fillStyle=k%2?'#e9a4b8':'#f3c979';x.beginPath();x.ellipse(px+(k%2?8:-8),py+k*11,5,8,k*.5,0,TAU);x.fill();}}}],
    ['sauge', 'Rayures sauge', x => { x.fillStyle='#f6f2e8';x.fillRect(0,0,S,S);for(let i=0;i<8;i++){x.fillStyle=i%2?'#c8d8c2':'#e4ebd9';x.fillRect(i*16,0,8,S);}x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,8,S,3); }],
    ['vichy_rose', 'Vichy rose', x => grid(x,8,(a,b,s,i,j)=>{x.fillStyle=(i+j)%2?'#fff7f4':'#f3c9d1';x.fillRect(a,b,s,s);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(a,b,s/2,s/2);})],
    ['lambris_ivoire', 'Lambris ivoire', x => {x.fillStyle='#f5ead6';x.fillRect(0,0,S,S);for(let y=0;y<S;y+=24){x.fillStyle='#e8d8bf';x.fillRect(0,y,S,2);x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,y+3,S,2);for(let xx=(y/24%2)*32;xx<S;xx+=64){x.fillStyle='rgba(180,145,105,.22)';x.fillRect(xx,y+5,1,18);}}}],
    ['feuillage_doux', 'Feuillage doux', (x,r) => {x.fillStyle='#e6f0df';x.fillRect(0,0,S,S);for(let i=0;i<20;i++){const px=r()*S,py=r()*S,a=r()*TAU;x.save();x.translate(px,py);x.rotate(a);x.fillStyle=i%3?'#b6d0a7':'#c6a9bc';x.beginPath();x.ellipse(0,0,12,5,0,0,TAU);x.fill();x.strokeStyle='rgba(92,133,83,.55)';x.beginPath();x.moveTo(-10,0);x.lineTo(10,0);x.stroke();x.restore();}}],
    ['nuits_lilas', 'Crépuscule lilas', (x,r) => {x.fillStyle='#c6c5e8';x.fillRect(0,0,S,S);dots(x,24,'#fff1c6',1.4,r);x.fillStyle='rgba(255,255,255,.65)';for(const [a,b] of [[25,25],[92,76],[52,112]]){x.beginPath();x.arc(a,b,13,0,TAU);x.arc(a+12,b-5,10,0,TAU);x.arc(a+24,b,12,0,TAU);x.fill();}}],
    ['coquillages', 'Coquillages', (x,r) => {x.fillStyle='#f3dfc5';x.fillRect(0,0,S,S);for(let i=0;i<14;i++){const px=r()*S,py=r()*S;x.fillStyle=i%2?'#e6a9a2':'#d7b991';x.beginPath();x.ellipse(px,py,8,5,r()*TAU,0,TAU);x.fill();x.strokeStyle='rgba(255,255,255,.6)';for(let k=-2;k<=2;k++){x.beginPath();x.arc(px,py,3+k*1.2,.2,Math.PI-.2);x.stroke();}}}],
    ['bibliotheque', 'Bibliothèque', x => {x.fillStyle='#e9dfd0';x.fillRect(0,0,S,S);for(let y=8;y<S;y+=32){x.fillStyle='#b78b65';x.fillRect(0,y,S,3);for(let xx=5;xx<S;xx+=13){x.fillStyle=['#d97572','#718bb7','#88a878','#dfbd75'][Math.floor((xx+y)/13)%4];x.fillRect(xx,y-15,8,15);}}}],
    ['toile_bleue', 'Toile de Jouy bleue', (x,r) => {x.fillStyle='#f7f3e9';x.fillRect(0,0,S,S);x.strokeStyle='#7894b4';x.lineWidth=1.5;for(let i=0;i<10;i++){const px=r()*S,py=r()*S;x.beginPath();x.ellipse(px,py,9,13,r()*TAU,0,TAU);x.stroke();x.beginPath();x.arc(px,py-4,3,0,TAU);x.stroke();x.beginPath();x.moveTo(px,py+4);x.quadraticCurveTo(px-7,py+8,px-3,py+13);x.moveTo(px,py+4);x.quadraticCurveTo(px+7,py+8,px+3,py+13);x.stroke();}}],
    ['briques_creme', 'Briques crème', x => {x.fillStyle='#eee5d7';x.fillRect(0,0,S,S);for(let y=0;y<S;y+=20){x.fillStyle=y%40?'#dfd2bf':'#e4d8c8';x.fillRect(0,y,S,18);x.fillStyle='#f8f3eb';for(let xx=(y%40?16:0);xx<S;xx+=32)x.fillRect(xx,y,2,18);x.fillRect(0,y+18,S,2);}}]
  ];
  G.FLOORS = [
    ['parquet', 'Parquet', x => { for (let j = 0; j < 4; j++) { x.fillStyle = j % 2 ? '#c08850' : '#d09a62'; x.fillRect(0, j * 32, S, 32); x.fillStyle = '#8f5d33'; x.fillRect(0, j * 32, S, 2); x.fillRect((j * 45) % S, j * 32, 2, 32); x.fillRect((j * 45 + 64) % S, j * 32, 2, 32); } }],
    ['parquet_fonce', 'Parquet foncé', x => { for (let j = 0; j < 4; j++) { x.fillStyle = j % 2 ? '#7a4b2a' : '#8a5634'; x.fillRect(0, j * 32, S, 32); x.fillStyle = '#4f2f1a'; x.fillRect(0, j * 32, S, 2); x.fillRect((j * 45) % S, j * 32, 2, 32); } }],
    ['carrelage', 'Carrelage', x => grid(x, 4, (a, b, s, i, j) => { x.fillStyle = (i + j) % 2 ? '#f2ede2' : '#c9b9a0'; x.fillRect(a, b, s, s); })],
    ['moquette', 'Moquette rouge', (x, r) => { x.fillStyle = '#c9554e'; x.fillRect(0, 0, S, S); dots(x, 40, '#d96a5e', 3, r); x.strokeStyle = '#e9b44c'; x.lineWidth = 3; x.strokeRect(8, 8, S - 16, S - 16); }],
    ['marbre', 'Marbre', (x, r) => { x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(150,150,160,.45)'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); let px = r() * S, py = 0; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - .5) * 30; py += S / 8; x.lineTo(px, py); } x.stroke(); } x.strokeStyle = 'rgba(0,0,0,.08)'; x.strokeRect(0, 0, S, S); }],
    ['herbe', 'Gazon', (x, r) => { x.fillStyle = '#86d16a'; x.fillRect(0, 0, S, S); dots(x, 60, '#6db954', 2, r); dots(x, 10, '#ffffff', 1.5, r); }],
    ['sable', 'Sable', (x, r) => { x.fillStyle = '#f1dda2'; x.fillRect(0, 0, S, S); dots(x, 90, '#e2c98a', 1.4, r); }],
    ['pierre', 'Dalles de pierre', x => grid(x, 2, (a, b, s, i, j) => { x.fillStyle = (i + j) % 2 ? '#bdb6a6' : '#cfc8b8'; x.fillRect(a + 2, b + 2, s - 4, s - 4); })],
    ['tatami', 'Tatami', x => { x.fillStyle = '#d9cf8a'; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(120,110,50,.25)'; for (let i = 0; i < S; i += 4) { x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); } x.fillStyle = '#3f6a3a'; x.fillRect(0, 0, S, 5); x.fillRect(0, 64, S, 5); }],
    ['damier_noir', 'Damier noir et blanc', x => grid(x, 4, (a, b, s, i, j) => { x.fillStyle = (i + j) % 2 ? '#2a2d33' : '#f7f5ee'; x.fillRect(a, b, s, s); })],
    ['bois_clair', 'Bois clair', x => { for (let j = 0; j < 8; j++) { x.fillStyle = j % 2 ? '#e8c99a' : '#f0d6ac'; x.fillRect(0, j * 16, S, 16); x.fillStyle = 'rgba(150,100,50,.3)'; x.fillRect(0, j * 16, S, 1); } }],
    ['nuages_sol', 'Nuages', G => 0],
    ['bois_chene', 'Chêne blond', x => {for(let j=0;j<8;j++){x.fillStyle=j%2?'#d6b17a':'#e6c996';x.fillRect(0,j*16,S,16);x.strokeStyle='rgba(129,86,48,.28)';x.beginPath();x.moveTo(0,j*16+2);x.lineTo(S,j*16+2);x.stroke();for(let i=0;i<3;i++){x.fillStyle='rgba(128,82,43,.12)';x.beginPath();x.ellipse(18+i*43,(j*16)+8,12,1.4,0,0,TAU);x.fill();}}}],
    ['chevrons', 'Parquet chevrons', x => {x.fillStyle='#c9915e';x.fillRect(0,0,S,S);x.strokeStyle='#885d3d';x.lineWidth=2;for(let y=-S;y<S*2;y+=32){x.beginPath();x.moveTo(0,y+16);x.lineTo(32,y);x.lineTo(64,y+16);x.lineTo(96,y);x.lineTo(128,y+16);x.stroke();x.beginPath();x.moveTo(32,y);x.lineTo(32,y+16);x.moveTo(96,y);x.lineTo(96,y+16);x.stroke();}}],
    ['noyer', 'Noyer satiné', x => {x.fillStyle='#775039';x.fillRect(0,0,S,S);for(let y=0;y<S;y+=24){x.fillStyle=y%48?'#886043':'#96704d';x.fillRect(0,y,S,23);x.strokeStyle='rgba(45,27,18,.45)';x.beginPath();x.moveTo(0,y+1);x.lineTo(S,y+1);x.stroke();for(let xx=(y%48?20:0);xx<S;xx+=40)x.fillRect(xx,y,1,23);}}],
    ['terre_cuite', 'Terre cuite', x => grid(x,4,(a,b,s,i,j)=>{x.fillStyle=(i+j)%2?'#d18a68':'#bd7258';x.fillRect(a+2,b+2,s-4,s-4);x.fillStyle='rgba(255,235,215,.3)';x.fillRect(a+4,b+4,s-8,2);})],
    ['pierre_miel', 'Pierre miel', x => grid(x,3,(a,b,s,i,j)=>{x.fillStyle=['#d8c7a8','#c8b48f','#e2d4b8'][(i+j*2)%3];x.fillRect(a+1,b+1,s-2,s-2);x.strokeStyle='rgba(121,98,68,.3)';x.strokeRect(a+1,b+1,s-2,s-2);})],
    ['terrazzo_rose', 'Terrazzo poudré', (x,r) => {x.fillStyle='#f4eae3';x.fillRect(0,0,S,S);for(let i=0;i<95;i++){x.fillStyle=['#d99b91','#cfb87c','#9bb89e','#c7b8d3'][i%4];x.beginPath();x.ellipse(r()*S,r()*S,1+r()*2,1+r()*1.5,r()*TAU,0,TAU);x.fill();}}],
    ['carreaux_menthe', 'Carreaux menthe', x => grid(x,4,(a,b,s,i,j)=>{x.fillStyle=(i+j)%2?'#f4f0df':'#c6ded0';x.fillRect(a+2,b+2,s-4,s-4);x.strokeStyle='rgba(255,255,255,.8)';x.strokeRect(a+6,b+6,s-12,s-12);})],
    ['bambou', 'Lattes de bambou', x => {x.fillStyle='#d4d59b';x.fillRect(0,0,S,S);for(let i=0;i<8;i++){x.fillStyle=i%2?'#b8bf7e':'#c8ce8e';x.fillRect(i*16,0,14,S);x.fillStyle='rgba(77,103,55,.3)';x.fillRect(i*16,0,2,S);for(let y=25;y<S;y+=36)x.fillRect(i*16,y,14,2);}}],
    ['lin_sauge', 'Lin sauge', (x,r) => {x.fillStyle='#d9e4d6';x.fillRect(0,0,S,S);for(let i=0;i<100;i++){x.fillStyle=i%2?'rgba(255,255,255,.2)':'rgba(100,125,93,.08)';x.fillRect(r()*S,r()*S,1+r()*2,1);}}],
    ['dalles_ivoire', 'Dalles ivoire', x => grid(x,2,(a,b,s,i,j)=>{x.fillStyle=(i+j)%2?'#eee8dc':'#e3dacb';x.fillRect(a+2,b+2,s-4,s-4);x.strokeStyle='rgba(255,255,255,.65)';x.strokeRect(a+4,b+4,s-8,s-8);})],
    ['tapis_fleuri', 'Tapis jardin', x => {x.fillStyle='#c9828f';x.fillRect(0,0,S,S);x.strokeStyle='#f2dca9';x.lineWidth=3;x.strokeRect(7,7,S-14,S-14);x.fillStyle='#f2dca9';for(const [a,b] of [[32,32],[96,32],[32,96],[96,96]]){x.beginPath();for(let i=0;i<8;i++){const q=i*TAU/8;x.ellipse(a+Math.cos(q)*7,b+Math.sin(q)*7,4,6,q,0,TAU);}x.fill();x.beginPath();x.arc(a,b,3,0,TAU);x.fill();}}]
  ];
  G.FLOORS[G.FLOORS.length - 1][2] = G.WALLS.find(w => w[0] === 'nuages')[2];
  const texCache = {};
  G.patTex = (kind, id) => {
    if (typeof id === 'string' && id.startsWith('design:')) { const t = G.designTex(+id.slice(7)); if (t) return t; id = kind === 'wall' ? 'creme' : 'parquet'; }
    const k = kind + ':' + id; if (texCache[k]) return texCache[k];
    const list = kind === 'wall' ? G.WALLS : G.FLOORS, e = list.find(p => p[0] === id) || list[0], c = G.cv(S, S), x = c.getContext('2d'); e[2](x, G.rng(G.hashStr(e[0])));
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return texCache[k] = t;
  };
  G.patURL = (kind, id) => { const t = G.patTex(kind, id); return t.image && t.image.toDataURL ? t.image.toDataURL() : ''; };
  // ---------- vue par la fenêtre (ciel en direct) ----------
  const WC = G.cv(64, 64), wx = WC.getContext('2d');
  G.TEX.window = new THREE.CanvasTexture(WC);
  G.drawWindowView = (top, hor, n, h) => {
    const g = wx.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(1, '#' + hor.getHexString()); wx.fillStyle = g; wx.fillRect(0, 0, 64, 64);
    if (n > .5) { wx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) wx.fillRect((i * 37) % 64, (i * 23) % 34, 1, 1); wx.fillStyle = '#f4f1ff'; wx.beginPath(); wx.arc(46, 14, 5, 0, TAU); wx.fill(); }
    else { const sx = 8 + G.clamp((h - 6) / 12, 0, 1) * 48; wx.fillStyle = '#fff3b0'; wx.beginPath(); wx.arc(sx, 14 + Math.abs(sx - 32) * .3, 5, 0, TAU); wx.fill(); wx.fillStyle = 'rgba(255,255,255,.9)'; for (const [a, b] of [[(h * 3) % 70 - 6, 20], [(h * 3 + 35) % 70 - 6, 30]]) { wx.beginPath(); wx.ellipse(a, b, 8, 3.5, 0, 0, TAU); wx.fill(); } }
    const dark = n * .55; wx.fillStyle = `rgb(${110 - dark * 80},${180 - dark * 120},${95 - dark * 60})`; wx.beginPath(); wx.ellipse(18, 64, 30, 16, 0, 0, TAU); wx.fill(); wx.beginPath(); wx.ellipse(54, 66, 26, 14, 0, 0, TAU); wx.fill();
    wx.fillStyle = `rgb(${60 - dark * 40},${120 - dark * 80},${60 - dark * 40})`; for (const tx of [10, 26, 50]) { wx.beginPath(); wx.moveTo(tx - 5, 54); wx.lineTo(tx, 40); wx.lineTo(tx + 5, 54); wx.fill(); }
    G.TEX.window.needsUpdate = true;
  };
  // ---------- coque de pièce texturée ----------
  const matCache = {};
  const patMat = (kind, id) => { const k = kind + ':' + id; if (!matCache[k] || (id + '').startsWith('design:')) matCache[k] = G.toon({ map: G.patTex(kind, id) }, {}); return matCache[k]; };
  const plane = (w, h, ru, rv) => { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); return g; };
  G.buildShell = m => {
    const s = m.meta.shell || (m.meta.shell = {}), W = m.W, H = m.H, h = 3, K = KINDS[s.kind] || KINDS.maison;
    const wall = s.wall || K.wall, floor = s.floor || K.floor;
    if (m.shell) { m.group.remove(m.shell); m.shell.traverse(c => c.geometry && c.geometry.dispose()); }
    const g = new THREE.Group(), wm = patMat('wall', wall), fm = patMat('floor', floor);
    const add = (geo, mat, x, y, z, ry = 0, rx = 0) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.rotation.set(rx, ry, 0); me.receiveShadow = true; me.frustumCulled = false; g.add(me); return me; };
    add(plane(W, H, W / 2, H / 2), fm, W / 2, .001, H / 2, 0, -Math.PI / 2);
    add(plane(W, h, W / 2, h / 2), wm, W / 2, h / 2, .001); add(plane(H, h, H / 2, h / 2), wm, .001, h / 2, H / 2, Math.PI / 2); add(plane(H, h, H / 2, h / 2), wm, W - .001, h / 2, H / 2, -Math.PI / 2);
    const b = G.mb(9), trim = K.trim;
    b.box(W + .4, h, .2, 0xe8dcc8, W / 2, h / 2, -.1); b.box(.2, h, H + .2, 0xe8dcc8, -.1, h / 2, H / 2); b.box(.2, h, H + .2, 0xe8dcc8, W + .1, h / 2, H / 2);
    b.box(W, .2, .06, trim, W / 2, .1, .03); b.box(.06, .2, H, trim, .03, .1, H / 2); b.box(.06, .2, H, trim, W - .03, .1, H / 2); b.box(W + .4, .12, .26, trim, W / 2, h - .06, -.03);
    b.box(W + .6, .3, H + .6, 0x3a2a1e, W / 2, -.16, H / 2);
    const wins = []; const nW = Math.max(1, Math.floor(W / 4)); for (let k = 0; k < nW; k++) wins.push([(k + .5) * W / nW, 0]); if (H >= 8) { wins.push([0, H * .45, 1]); wins.push([W, H * .45, -1]); }
    for (const [wx2, wz, side] of wins) {
      if (!side) { b.box(1.02, .9, .08, 0xf7f5ee, wx2, 1.75, .04); b.box(1.12, .08, .16, trim, wx2, 1.28, .08); const pane = add(new THREE.PlaneGeometry(.86, .74), G.M.window, wx2, 1.75, .09); pane.renderOrder = 1; b.box(.04, .74, .09, 0xf7f5ee, wx2, 1.75, .09); b.box(.86, .04, .09, 0xf7f5ee, wx2, 1.75, .09); }
      else { const x = side > 0 ? .04 : W - .04; b.box(.08, .9, 1.02, 0xf7f5ee, x, 1.75, wz); add(new THREE.PlaneGeometry(.86, .74), G.M.window, side > 0 ? .09 : W - .09, 1.75, wz, side > 0 ? Math.PI / 2 : -Math.PI / 2); }
    }
    const sm = new THREE.Mesh(b.done(), G.MATS); sm.receiveShadow = true; sm.frustumCulled = false; g.add(sm);
    m.shell = g; m.group.add(g);
  };
  // ---------- types de pièces ----------
  const KINDS = G.ROOMKINDS = {
    maison: { W: 8, H: 7, floor: 'bois_chene', wall: 'fleurs_cottage', trim: 0xd9a066 }, villa: { W: 10, H: 8, floor: 'chevrons', wall: 'toile_bleue', trim: 0x8aa0d8 },
    cabane: { W: 7, H: 6, floor: 'parquet_fonce', wall: 'lambris', trim: 0x8a5d38 }, tente: { W: 5, H: 5, floor: 'tatami', wall: 'rose', trim: 0xd8742a },
    habitant: { W: 7, H: 6, floor: 'carrelage', wall: 'menthe', trim: 0xf08bb0 }, boutique: { W: 10, H: 8, floor: 'bois_clair', wall: 'pois', trim: 0x4fb35f },
    mairie: { W: 10, H: 8, floor: 'marbre', wall: 'creme', trim: 0x5b8fd6 }, musee: { W: 15, H: 11, floor: 'marbre', wall: 'damier', trim: 0x8a6a46 },
    couturiere: { W: 9, H: 7, floor: 'moquette', wall: 'coeurs', trim: 0xe86f9c }, gare: { W: 10, H: 6, floor: 'pierre', wall: 'briques', trim: 0x3f7a58 },
    hutte: { W: 7, H: 6, floor: 'sable', wall: 'jungle', trim: 0xb8945a }
  };
  G.HOME_STAGES = [[8, 7], [10, 8], [12, 9], [14, 10]]; G.HOME_COST = [0, 15000, 40000, 90000];
  const NPCAT = { boutique: ['shop', 5, 1.3], mairie: ['mairie', 5, 1.4], couturiere: ['couture', 4.5, 1.4], gare: ['gare', 5, 1.4], hutte: ['ile', 3.5, 2.5], musee: ['musee', 12.5, 8.6] };
  G.makeInterior = (kind, id, opt = {}) => {
    const K = KINDS[kind] || KINDS.maison; let [W, H] = [K.W, K.H];
    if (opt.W) { W = opt.W; H = opt.H; } else if (kind === 'maison' && opt.stage) [W, H] = G.HOME_STAGES[opt.stage - 1];
    const m = new G.GMap(W, H, { interior: true, kind, id }); m.surf.fill(6);
    m.meta.shell = { kind, wall: opt.wallPat || (opt.wall && typeof opt.wall === 'string' ? opt.wall : null), floor: opt.floorPat || null }; if (kind === 'maison') m.meta.stage = opt.stage || 1;
    if (opt.noMat) m.meta.noExit = 1; else m.addObj('paillasson', Math.floor(W / 2), H - 1);
    const P = (t, x, z, r = 0, ex) => m.canPlace(t, x, z, r) && m.addObj(t, x, z, r, ex);
    if (opt.empty) { }
    else if (G.ROOMFILL[kind]) G.ROOMFILL[kind](m, P, opt);
    else if (kind === 'tente') { P('sac_couchage', 1, 1); P('lanterne', 3, 1); P('coffre', 3, 3); P('tapis', 1, 3); }
    else if (kind === 'cabane') { P('lit', 1, 1); P('cheminee', 3, 0); P('table', 5, 3); P('chaise', 5, 4, 2); P('tonneau', 1, 4); P('coffre', 6, 1); }
    else if (kind === 'habitant') { P('lit_fleuri', 0, 0); P('commode_fleurie', 2, 0); P('lampe_arc', 5, 0); P('fauteuil_nuage', 4, 1); P('table_basse', 4, 2); P('bibliotheque', 0, 3); P('plante', 6, 4); }
    else if (kind === 'boutique') { P('comptoir', 4, 2); P('rayon', 0, 0); P('rayon', 8, 0); P('rayon', 0, 4, 1); P('rayon', 9, 4, 1); P('tonneau', 2, 5); P('caisse', 7, 5); P('plante', 1, 6); P('lampe', 2, 0); }
    else if (kind === 'mairie') { P('bureau', 4, 2); P('plante', 1, 1); P('plante', 8, 1); P('tableau', 1, 4); P('banc_parc', 6, 5); P('horloge', 8, 4); P('tapis', 4, 4); P('lampe', 2, 2); }
    else if (kind === 'couturiere') { P('comptoir', 3, 2); for (let i = 0; i < 3; i++) P('mannequin', 1 + i * 3, 0, 0, { v: i }); P('miroir', 8, 3); P('mannequin', 0, 4, 0, { v: 3 }); P('pot_fleurs', 8, 5); }
    else if (kind === 'gare') { P('comptoir', 3, 2); P('casiers', 8, 0); P('banc', 1, 4); P('banc', 6, 4); P('horloge', 0, 0); P('plante', 9, 4); P('lampe', 2, 1); }
    else if (kind === 'hutte') { P('lit', 1, 1); P('table', 4, 3); P('plante', 5, 0); P('coffre_tresor', 1, 4); P('lanterne', 5, 4); }
    else if (kind === 'musee') { P('bureau', 11, 9); museumSlots().forEach(([x, z]) => P('vitrine', x, z)); P('plante', 0, 9); P('plante', 14, 0); }
    else { P('lit_fleuri', 0, 0); P('commode_fleurie', 2, 0); P('piano_droit', 5, 0); P('canape', 3, 1); P('table_basse', 3, 2); P('fauteuil_nuage', 6, 2); P('bibliotheque', 0, 3); P('tapis', 4, 3); P('lampe_arc', 7, 3); P('miroir', 2, 4); P('coffre', 0, 5); P('meuble_tv', 5, 5); P('plante', 7, 5); }
    const n = G.ROOMNPC[kind] || NPCAT[kind]; if (n) { m.meta.npcs = [{ role: n[0], x: n[1], z: n[2], yaw: 0 }]; G.ents.spawnVillagers(m); }
    G.buildShell(m); m.buildAll(); if (kind === 'musee') G.buildMuseum(m); return m;
  };
  // ---------- agrandir la maison ----------
  G.expandHome = () => {
    const iid = G.homeId ? G.homeId() : 'home', old = G.interiors[iid] || G.makeInterior('maison', iid), st = old.meta.stage || 1;
    if (st >= G.HOME_STAGES.length) return false;
    const nm = G.makeInterior('maison', iid, { stage: st + 1, wallPat: old.meta.shell.wall, floorPat: old.meta.shell.floor });
    for (const o of [...nm.list]) if (o.t !== 'paillasson') nm.removeObj(o);
    for (const o of old.list) { if (o.t === 'paillasson') continue; const ex = {}; for (const k of ['v', 'f', 'g', 'iid', 'off', 'txt']) if (o[k] != null) ex[k] = o[k]; if (nm.canPlace(o.t, o.x, o.z, o.r)) nm.addObj(o.t, o.x, o.z, o.r, ex); }
    nm.meta.door = old.meta.door; nm.meta.title = old.meta.title; G.scene.remove(old.group); G.interiors[iid] = nm; G.scene.add(nm.group); nm.group.visible = false;
    if (G.map === old) G.enterMap(nm, Math.floor(nm.W / 2) + .5, nm.H - 1.4, Math.PI); return true;
  };
  G.decorRoom = (m, kind, id) => { m.meta.shell = m.meta.shell || {}; m.meta.shell[kind] = id; G.buildShell(m); };
  // ---------- musée : collection exposée ----------
  G.collectibles = () => Object.keys(G.ITEMS).filter(id => ['fish', 'bug', 'fossil'].includes(G.ITEMS[id].kind));
  function museumSlots() { const n = G.collectibles().length, out = []; for (let k = 0; k < n; k++) out.push([1 + (k % 7) * 2, 1 + Math.floor(k / 7) * 2]); return out; }
  const label = (txt, ico, url, on) => {
    const c = G.cv(128, 160), x = c.getContext('2d'), t = new THREE.CanvasTexture(c);
    const draw = im => { x.clearRect(0, 0, 128, 160); x.fillStyle = on ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)'; x.beginPath(); x.arc(64, 60, 54, 0, TAU); x.fill();
      if (on && im) x.drawImage(im, 18, 14, 92, 92); else { x.font = on ? '64px sans-serif' : 'bold 60px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#8a7a6a'; x.fillText(on ? ico : '?', 64, 64); }
      x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; x.fillStyle = on ? '#3d2b1d' : '#9a8a7a'; x.fillText(on ? txt : '???', 64, 140); t.needsUpdate = true; };
    if (on && url) { const im = new Image(); im.onload = () => draw(im); im.src = url; } draw(null); return t;
  };
  G.buildMuseum = m => {
    if (m.museum) m.group.remove(m.museum); const g = new THREE.Group(), ids = G.collectibles(), slots = museumSlots();
    ids.forEach((id, k) => { const it = G.ITEMS[id], on = !!G.dex.donated[id], [x, z] = slots[k];
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(it.n, it.ico, on ? G.ui.thumb(id) : null, on), transparent: true })); sp.scale.set(.85, 1.06, 1); sp.position.set(x + .5, 1.65, z + .5); g.add(sp); });
    m.museum = g; m.group.add(g);
  };
})();
