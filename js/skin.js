'use strict';
// ===== Personnages fusionnés : toutes les pièces d'un personnage deviennent UN maillage articulé (squelette rigide).
// Les groupes corps / tête / bras / jambes servent d'os : les animations existantes marchent telles quelles,
// mais il n'y a plus que 3 ou 4 appels de dessin par personnage au lieu d'une vingtaine (contours et ombres compris). =====
(function () {
  const M4 = new THREE.Matrix4(), INV = new THREE.Matrix4(), NM = new THREE.Matrix3(), V = new THREE.Vector3();
  let SK = null;
  // versions « squelette » des matériaux partagés (créées une fois)
  function skMats() {
    if (SK) return SK; const M = G.M;
    const std = G.toon({ vertexColors: true, skinning: true }), glow = G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true, skinning: true }));
    const trans = G.toon({ vertexColors: true, transparent: true, opacity: .62, depthWrite: false, skinning: true }), fire = G.curveMat(new THREE.MeshBasicMaterial({ vertexColors: true, skinning: true }));
    SK = { mats: [std, glow, trans, fire, std],
      outline: G.curveMat(new THREE.MeshBasicMaterial({ color: 0x3a2619, side: THREE.BackSide, skinning: true }), { outline: .016 }),
      xray: G.curveMat(new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: .5, depthWrite: false, depthFunc: THREE.GreaterDepth, skinning: true })),
      hurt: G.toon({ vertexColors: true, color: 0xff7a7a, emissive: 0x661010, skinning: true }, {}) };
    G.M.outlineSk = SK.outline; G.M.xraySk = SK.xray; G.M.hurtSk = SK.hurt; return SK;
  }
  G.on('frame', () => { if (!SK) return; SK.outline.visible = G.M.outline.visible; SK.mats[1].color.copy(G.M.glow.color); });
  function skinify(P) {
    const S = skMats(), root = P.root; root.updateMatrixWorld(true); INV.copy(root.matrixWorld).invert();
    const parts = [], bones = [], bix = new Map(), drop = [];
    root.traverse(o => { if (!o.isMesh || o.isSkinnedMesh) return; if (o.material === G.M.outline) return; const p = o.parent; if (!bix.has(p)) { bix.set(p, bones.length); bones.push(p); } parts.push(o); });
    if (!parts.length) return P;
    // matériaux du maillage fusionné
    const mats = [], mIdx = new Map(), slot = m => { let k = mIdx.get(m); if (k === undefined) { k = mats.length; mats.push(m); mIdx.set(m, k); } return k; };
    const chunks = []; let total = 0, olTotal = 0;
    for (const o of parts) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); const n = g.attributes.position.count, rel = M4.multiplyMatrices(INV, o.matrixWorld).clone(), b = bix.get(o.parent);
      const ranges = []; if (Array.isArray(o.material)) { const grs = g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }]; for (const gr of grs) ranges.push([gr.start, Math.min(n, gr.start + gr.count), slot(S.mats[gr.materialIndex] || S.mats[0])]); }
      else { const m = o.material; m.skinning = true; m.needsUpdate = true; ranges.push([0, n, slot(m)]); }
      const ol = o.children.find(c => c.isMesh && c.material === G.M.outline);
      chunks.push({ g, n, rel, b, ranges, ol: ol ? ol.geometry : null }); total += n; if (ol) olTotal += ol.geometry.attributes.position.count; drop.push(o); }
    // une géométrie, triée par matériau (un groupe = un appel de dessin)
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3).fill(1), uv = new Float32Array(total * 2), si = new Float32Array(total * 4), sw = new Float32Array(total * 4);
    const geo = new THREE.BufferGeometry(); let w = 0;
    for (let s = 0; s < mats.length; s++) { const start = w;
      for (const c of chunks) { NM.getNormalMatrix(c.rel); const A = c.g.attributes;
        for (const [a, e, k] of c.ranges) { if (k !== s) continue;
          for (let i = a; i < e; i++, w++) { V.fromBufferAttribute(A.position, i).applyMatrix4(c.rel); pos[w * 3] = V.x; pos[w * 3 + 1] = V.y; pos[w * 3 + 2] = V.z;
            if (A.normal) { V.fromBufferAttribute(A.normal, i).applyMatrix3(NM).normalize(); nor[w * 3] = V.x; nor[w * 3 + 1] = V.y; nor[w * 3 + 2] = V.z; }
            if (A.color) { col[w * 3] = A.color.getX(i); col[w * 3 + 1] = A.color.getY(i); col[w * 3 + 2] = A.color.getZ(i); }
            if (A.uv) { uv[w * 2] = A.uv.getX(i); uv[w * 2 + 1] = A.uv.getY(i); }
            si[w * 4] = c.b; sw[w * 4] = 1; } } }
      if (w > start) geo.addGroup(start, w - start, s); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); geo.computeBoundingSphere();
    for (const o of drop) o.parent.remove(o);
    const skel = new THREE.Skeleton(bones), mesh = new THREE.SkinnedMesh(geo, mats); mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false; root.add(mesh); mesh.bind(skel); mesh.userData.mat0 = mats;
    // contour (coque inversée) commun à tout le personnage
    if (olTotal) { const op = new Float32Array(olTotal * 3), on = new Float32Array(olTotal * 3), oi = new Float32Array(olTotal * 4), ow = new Float32Array(olTotal * 4); let q = 0;
      for (const c of chunks) { if (!c.ol) continue; NM.getNormalMatrix(c.rel); const A = c.ol.attributes;
        for (let i = 0; i < A.position.count; i++, q++) { V.fromBufferAttribute(A.position, i).applyMatrix4(c.rel); op[q * 3] = V.x; op[q * 3 + 1] = V.y; op[q * 3 + 2] = V.z; V.fromBufferAttribute(A.normal, i).applyMatrix3(NM).normalize(); on[q * 3] = V.x; on[q * 3 + 1] = V.y; on[q * 3 + 2] = V.z; oi[q * 4] = c.b; ow[q * 4] = 1; } }
      const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.BufferAttribute(op, 3)); og.setAttribute('normal', new THREE.BufferAttribute(on, 3)); og.setAttribute('skinIndex', new THREE.BufferAttribute(oi, 4)); og.setAttribute('skinWeight', new THREE.BufferAttribute(ow, 4)); og.computeBoundingSphere();
      const om = new THREE.SkinnedMesh(og, S.outline); om.frustumCulled = false; om.castShadow = false; mesh.add(om); om.bind(skel, mesh.bindMatrix); P.outlineMesh = om; }
    P.skinned = mesh; P.meshes = [mesh]; P.faceMesh = null; return P;
  }
  G.skinify = skinify;
  const omc = G.makeChar; G.makeChar = o => { const P = omc(o); try { skinify(P); } catch (e) { console.warn('personnage non fusionné', e); } return P; };
})();
