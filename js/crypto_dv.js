'use strict';
// ===== Cryptographie de Douce Vallée — sans aucune dépendance, identique partout (navigateur, appli Windows, fichier local) =====
// • SHA-256 et HMAC-SHA256 (normes FIPS 180-4 et RFC 2104)
// • PBKDF2-HMAC-SHA256 (RFC 8018) : un mot de passe est « étiré » sur des centaines de milliers de tours, pour qu'on ne puisse pas
//   essayer des mots de passe en masse ; utilise la version native du navigateur quand elle existe (même résultat, plus rapide)
// • ChaCha20 (RFC 8439) + HMAC-SHA256 : chiffrement authentifié — illisible sans la clé, et toute donnée trafiquée est refusée
// • comparaison à temps constant (on ne trahit rien par le temps de réponse)
(function () {
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], W = new Uint32Array(64);
  // une compression SHA-256 : état H (8 mots) ← bloc de 16 mots
  function compress(H, B) {
    for (let i = 0; i < 16; i++) W[i] = B[i];
    for (let i = 16; i < 64; i++) { const a = W[i - 15], b = W[i - 2]; W[i] = (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) + W[i - 7] + (((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10)) + W[i - 16] | 0; }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) { const t1 = h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[i] + W[i] | 0,
        t2 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
      h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b; b = a; a = t1 + t2 | 0; }
    H[0] = H[0] + a | 0; H[1] = H[1] + b | 0; H[2] = H[2] + c | 0; H[3] = H[3] + d | 0; H[4] = H[4] + e | 0; H[5] = H[5] + f | 0; H[6] = H[6] + g | 0; H[7] = H[7] + h | 0; }
  function sha256(u8, init, preLen) { const H = new Uint32Array(init || IV), n = u8.length, total = n + (preLen || 0), nb = ((n + 9 + 63) >> 6), B = new Uint32Array(16);
    for (let k = 0; k < nb; k++) { B.fill(0); for (let i = 0; i < 64; i++) { const j = k * 64 + i; let v = 0; if (j < n) v = u8[j]; else if (j === n) v = 0x80; B[i >> 2] |= v << (24 - (i & 3) * 8); }
      if (k === nb - 1) { B[14] = Math.floor(total * 8 / 4294967296); B[15] = (total * 8) >>> 0; } compress(H, B); }
    return words2bytes(H); }
  const words2bytes = H => { const o = new Uint8Array(32); for (let i = 0; i < 8; i++) { o[i * 4] = H[i] >>> 24; o[i * 4 + 1] = H[i] >>> 16; o[i * 4 + 2] = H[i] >>> 8; o[i * 4 + 3] = H[i]; } return o; };
  const utf8 = s => new TextEncoder().encode(String(s));
  const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
  // HMAC : états intérieur et extérieur précalculés (deux compressions par tour de PBKDF2)
  function hmacKeyStates(key) { if (key.length > 64) key = sha256(key); const ip = new Uint8Array(64), op = new Uint8Array(64); for (let i = 0; i < 64; i++) { const k = key[i] || 0; ip[i] = k ^ 0x36; op[i] = k ^ 0x5c; }
    const bw = u => { const B = new Uint32Array(16); for (let i = 0; i < 64; i++) B[i >> 2] |= u[i] << (24 - (i & 3) * 8); return B; }, I = new Uint32Array(IV), O = new Uint32Array(IV); compress(I, bw(ip)); compress(O, bw(op)); return { I, O }; }
  function hmac(key, msg) { const st = hmacKeyStates(key), inner = sha256(msg, st.I, 64); return sha256(inner, st.O, 64); }
  function pbkdf2(pass, salt, iters, len) { const st = hmacKeyStates(pass), out = new Uint8Array(len), B = new Uint32Array(16), H = new Uint32Array(8), U = new Uint32Array(8), T = new Uint32Array(8);
    for (let blk = 1, off = 0; off < len; blk++, off += 32) {
      const u1 = sha256(sha256(cat(salt, new Uint8Array([blk >>> 24, blk >>> 16, blk >>> 8, blk])), st.I, 64), st.O, 64);
      for (let i = 0; i < 8; i++) { U[i] = (u1[i * 4] << 24) | (u1[i * 4 + 1] << 16) | (u1[i * 4 + 2] << 8) | u1[i * 4 + 3]; T[i] = U[i]; }
      for (let it = 1; it < iters; it++) { // un bloc de 32 octets + rembourrage, longueur totale 96 octets
        for (let i = 0; i < 8; i++) B[i] = U[i]; B[8] = 0x80000000; for (let i = 9; i < 15; i++) B[i] = 0; B[15] = 768;
        H.set(st.I); compress(H, B); for (let i = 0; i < 8; i++) B[i] = H[i]; H.set(st.O); compress(H, B);
        for (let i = 0; i < 8; i++) { U[i] = H[i]; T[i] ^= H[i]; } }
      const tb = words2bytes(T); out.set(tb.subarray(0, Math.min(32, len - off)), off); }
    return out; }
  // version asynchrone : la fonction native du navigateur si elle existe (contexte sécurisé), sinon la nôtre
  async function pbkdf2Async(pass, salt, iters, len) {
    try { const S = window.crypto && crypto.subtle; if (S && window.isSecureContext) { const k = await S.importKey('raw', pass, 'PBKDF2', false, ['deriveBits']); return new Uint8Array(await S.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters }, k, len * 8)); } } catch (e) { }
    return pbkdf2(pass, salt, iters, len); }
  // ---------- ChaCha20 ----------
  function chacha20(key, nonce, data) { const st = new Uint32Array(16), x = new Uint32Array(16), out = new Uint8Array(data.length), ks = new Uint8Array(64), kv = new DataView(ks.buffer), K8 = new DataView(key.buffer, key.byteOffset, 32), N8 = new DataView(nonce.buffer, nonce.byteOffset, 12);
    st[0] = 0x61707865; st[1] = 0x3320646e; st[2] = 0x79622d32; st[3] = 0x6b206574; for (let i = 0; i < 8; i++) st[4 + i] = K8.getUint32(i * 4, true); st[13] = N8.getUint32(0, true); st[14] = N8.getUint32(4, true); st[15] = N8.getUint32(8, true);
    const QR = (a, b, c, d) => { x[a] += x[b]; x[d] ^= x[a]; x[d] = (x[d] << 16) | (x[d] >>> 16); x[c] += x[d]; x[b] ^= x[c]; x[b] = (x[b] << 12) | (x[b] >>> 20); x[a] += x[b]; x[d] ^= x[a]; x[d] = (x[d] << 8) | (x[d] >>> 24); x[c] += x[d]; x[b] ^= x[c]; x[b] = (x[b] << 7) | (x[b] >>> 25); };
    for (let off = 0, ctr = 1; off < data.length; off += 64, ctr++) { st[12] = ctr; x.set(st); for (let i = 0; i < 10; i++) { QR(0, 4, 8, 12); QR(1, 5, 9, 13); QR(2, 6, 10, 14); QR(3, 7, 11, 15); QR(0, 5, 10, 15); QR(1, 6, 11, 12); QR(2, 7, 8, 13); QR(3, 4, 9, 14); }
      for (let i = 0; i < 16; i++) kv.setUint32(i * 4, (x[i] + st[i]) >>> 0, true); const m = Math.min(64, data.length - off); for (let i = 0; i < m; i++) out[off + i] = data[off + i] ^ ks[i]; }
    return out; }
  const rand = n => { const u = new Uint8Array(n); crypto.getRandomValues(u); return u; };
  const ctEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
  const ctEqStr = (a, b) => { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0); return d === 0; };
  // chiffrement authentifié : clé de chiffrement et clé d'authentification séparées, dérivées de la clé maîtresse
  function seal(master, plain) { const ek = hmac(master, utf8('dv-enc')), mk = hmac(master, utf8('dv-mac')), n = rand(12), c = chacha20(ek, n, plain), t = hmac(mk, cat(n, c)); return { n, c, t }; }
  function open(master, n, c, t) { const ek = hmac(master, utf8('dv-enc')), mk = hmac(master, utf8('dv-mac')); if (!ctEq(hmac(mk, cat(n, c)), t)) return null; return chacha20(ek, n, c); }
  const hex = u => Array.from(u, b => (b < 16 ? '0' : '') + b.toString(16)).join(''), unhex = s => { const o = new Uint8Array(s.length >> 1); for (let i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
  G.DVC = { sha256, hmac, pbkdf2, pbkdf2Async, chacha20, seal, open, rand, ctEq, ctEqStr, hex, unhex, utf8, cat };
})();
