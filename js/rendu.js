'use strict';
// ===== Rendu premium « ultra réaliste » =====
// 1. Tous les matériaux passent en lumière physique (PBR) : couleurs converties en espace linéaire, soleil, ciel et lampes
//    calculés comme dans la réalité, reflets du ciel selon la rugosité, métaux (or, fer forgé, zinc), verre, feuillage translucide
//    qui ondule au vent, sol qui brille sous la pluie. Chaque pièce de modèle reçoit sa matière (G.surfKind) d'après sa couleur et son modèle.
// 2. Eau réaliste : vagues, reflets du ciel, éclat du soleil, écume des berges, transparence selon l'angle.
// 3. Ciel atmosphérique : dégradé, halo et disque du soleil, lune, voile de cirrus qui dérive.
// 4. Post-traitement HDR : occlusion ambiante (SSAO), halo lumineux (bloom), profondeur de champ, brume lointaine,
//    étalonnage filmique doux (couleurs fidèles, hautes lumières maîtrisées), vignettage. Options › Rendu.
(function () {
  const U = G.U, PI = Math.PI;
  // ---------- uniformes partagés ----------
  const SU = G.SU = {
    uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(.3, .8, .4) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uNight: { value: 0 },
    uSkyTop: { value: new THREE.Color(0x4aa3ee) }, uSkyHor: { value: new THREE.Color(0xaee0ff) }, uSkyGnd: { value: new THREE.Color(0x8f9a6a) },
    uSunK: { value: 1.55 }, uAmbK: { value: 1.25 }, uEnvK: { value: .85 }, uSpecK: { value: 1 }, uPointK: { value: 3.2 }, uGlowK: { value: .15 }, uFireK: { value: 2.2 },
    uWet: { value: 0 }, uWind: { value: 1 }, uBumpK: { value: 1 }, uWarmK: { value: 0 }, uVox: { value: 0 },
    uMoonPh: { value: PI }, uMoonK: { value: 1 }, uStarRot: { value: 0 } // phase de la lune (0 nouvelle, π pleine), part éclairée, rotation du ciel étoilé
  };
  // ---------- matières ----------
  const SK = G.SK = { gold: 1, iron: 2, steel: 3, glass: 4, leaf: 5, petal: 6, wood: 7, paint: 8, fabric: 9, skin: 10, hair: 11, stone: 12, ceramic: 13, plastic: 14, velvet: 15, gem: 16, bark: 17 };
  const GOLDS = new Set([0xd9b04a, 0xe8c25a, 0xd9b84a, 0xe8c27a, 0xc9a23a, 0xd4af37, 0xe0b84c, 0xd8b04a, 0xc8a040]);
  const GLASS = new Set([0xe6f2ff, 0x9fd8ff, 0x9fb9d4, 0xeaf6ff, 0xe8f0ff, 0xdff6ff, 0xe4f4ff, 0xd8f3e0, 0xcfe8ff, 0x9fd9ff, 0xbfe6fa]);
  const FOLIAGE = /^(tree_|bush|hedge|sapling|plante2|fence2_haie|arbre|weed|grass|haie|pl_)/, FLOWER = /^(tulip|flower|fl_|fleur)/;
  const hsl = { h: 0, s: 0, l: 0 }, TC = new THREE.Color();
  G.surfKind = (col, mat) => {
    if (mat === 4 || mat === 1 || mat === 3) return 0;
    const c = typeof col === 'number' ? col : TC.set(col).getHex();
    if (mat === 2 || GLASS.has(c)) return SK.glass;
    if (GOLDS.has(c)) return SK.gold;
    TC.setHex(c).getHSL(hsl); const h = hsl.h * 360, s = hsl.s, l = hsl.l, ctx = G._mdl || '';
    if (FOLIAGE.test(ctx)) { if ((h > 55 && h < 175 && s > .15) || (ctx === 'tree_cherry' && (h > 290 || h < 20) && l > .6)) return SK.leaf; if (h > 10 && h < 45 && l < .55) return SK.bark; }
    if (FLOWER.test(ctx)) return h > 60 && h < 170 && s > .2 && l < .6 ? SK.leaf : SK.petal;
    if (s < .14 && l < .27) return SK.iron;
    if (s < .16 && l > .5 && l < .84 && (c & 255) >= (c >> 16 & 255)) return SK.steel;
    if (h >= 12 && h <= 42 && s > .22 && s < .8 && l > .15 && l < .62) return SK.wood;
    if (l > .9 && s < .3) return SK.paint;
    return 0;
  };
  // ---------- morceaux de shader communs ----------
  const FRAG_DECL = `
uniform vec3 uSkyTop, uSkyHor, uSkyGnd, uSunDir, uSunCol; uniform float uSunK, uAmbK, uEnvK, uSpecK, uPointK, uWet, uTime, uGlowK, uBumpK, uWarmK, uVox;
uniform sampler2D uCloudTex; uniform vec2 uCloudOff; uniform float uCloudAmt;
uniform sampler2D uBio; uniform vec4 uBioSz;
varying vec3 vWP; varying float vSk;
vec3 s2l(vec3 c) { return pow(max(c, vec3(0.)), vec3(2.2)); }
vec3 l2s(vec3 c) { return pow(max(c, vec3(0.)), vec3(1. / 2.2)); }
float gCloud = 1., gRough = .82, gMetal = 0., gTransl = 0., gSheen = 0., gShadow = 1., gIsSun = 0., gLum = 0., gUp = 0.;
float prH(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float prN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(prH(i), prH(i + vec2(1., 0.)), f.x), mix(prH(i + vec2(0., 1.)), prH(i + vec2(1., 1.)), f.x), f.y); }
// ciel analytique (espace monde) flouté selon la rugosité : reflets sans texture, valables dans tous les rendus
vec3 skyRad(vec3 d, float r) {
  vec3 top = s2l(uSkyTop), hor = s2l(uSkyHor), gnd = s2l(uSkyGnd) * .5;
  float y = d.y; vec3 c = y > 0. ? mix(hor, top, pow(min(1., y * 1.6), .7)) : mix(hor * .85, gnd, min(1., -y * 3.));
  vec3 avg = (top * .45 + hor * .45 + gnd * .1); c = mix(c, avg, r * r);
  return c * uEnvK;
}
vec3 prBump(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy) {
  vec3 sX = dFdx(surf_pos), sY = dFdy(surf_pos), R1 = cross(sY, surf_norm), R2 = cross(surf_norm, sX);
  float det = dot(sX, R1) * (gl_FrontFacing ? 1. : -1.);
  vec3 grad = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(det) * surf_norm - grad);
}
// parquets et sols de luxe calculés au pixel près : 1/4 point de Hongrie (chêne/noyer), 2/5 bâtons rompus (chêne/noyer), 3 damier de marbre
vec4 parquetCol(vec2 p, float kind) {
  float id = 0., along = 0., across = 0., groove = 1.;
  if (kind > 2.5 && kind < 3.5) {
    vec2 c = floor(p / .8), f = fract(p / .8); float chk = mod(c.x + c.y, 2.);
    float v = prN(p * 2.3 + c * 7.) * .6 + prN(p * 7.) * .4, vein = smoothstep(.12, 0., abs(sin((p.x * .8 + p.y * .5 + v * 1.6) * 5.)));
    vec3 col = chk > .5 ? mix(vec3(.94, .93, .91), vec3(.7, .7, .73), vein * .55) : mix(vec3(.11, .11, .12), vec3(.42, .42, .45), vein * .6);
    groove = smoothstep(0., .012, f.x) * smoothstep(1., .988, f.x) * smoothstep(0., .012, f.y) * smoothstep(1., .988, f.y);
    return vec4(col * mix(.7, 1., groove), groove);
  }
  if (kind < 1.5 || kind > 3.5 && kind < 4.5) { // point de Hongrie : lames coupées en biais, en V
    float a = .5, pw = .2, col = floor(p.x / (2. * a)), xl = p.x - col * 2. * a - a, side = step(0., xl), ax = abs(xl);
    float s = p.y + ax * 1.0, k = floor(s / pw); across = fract(s / pw); along = ax / a; id = col * 131. + side * 17. + k;
    float fw = fwidth(s / pw) * 1.5 + .03; groove = smoothstep(0., fw, across) * smoothstep(1., 1. - fw, across) * smoothstep(0., .015 + fwidth(ax), ax) * smoothstep(a, a - .012 - fwidth(ax), ax);
  } else { // bâtons rompus : lames rectangulaires croisées à 90°
    vec2 q = p / .15, c = floor(q); float d = c.x - c.y, bnd = floor(d / 8.); vec2 qq = q - vec2(4., -4.) * bnd, cc = c - vec2(4., -4.) * bnd; float dd = d - 8. * bnd;
    if (dd < 4.) { float n = cc.y; along = (qq.x - n) / 4.; across = qq.y - n; id = n * 2. + bnd * 977.; }
    else { float n = cc.x - 4.; along = (qq.y - (n - 3.)) / 4.; across = qq.x - (n + 4.); id = n * 2. + 1. + bnd * 977.; }
    vec2 fq = fwidth(q) * 1.5 + .04; groove = smoothstep(0., fq.y, across) * smoothstep(1., 1. - fq.y, across) * smoothstep(0., fq.x * .3, along) * smoothstep(1., 1. - fq.x * .3, along);
  }
  float r = prH(vec2(id, 3.7)), r2 = prH(vec2(id, 9.1));
  vec3 base = kind > 3.5 ? mix(vec3(.38, .25, .16), vec3(.5, .34, .22), r) : mix(vec3(.6, .44, .29), vec3(.74, .57, .39), r);
  float g = prN(vec2(along * 7. + r * 20., across * 2.2 + r2 * 10.)) * .6 + prN(vec2(along * 26., across * 7.)) * .4;
  float lines = smoothstep(.6, .95, abs(sin((across * 2.4 + g * 2.4 + r * 3.) * 6.283)));
  base *= .86 + .22 * g; base = mix(base, base * .74, lines * .4);
  if (prH(vec2(id, 1.3)) > .9) base *= .9 + .1 * smoothstep(.2, .6, abs(along - .5)); // nœuds
  return vec4(base * mix(.55, 1., groove), groove);
}
void surfProps(float k) {
  if (k < .5) return;
  if (k < 1.5) { gRough = .26; gMetal = 1.; }
  else if (k < 2.5) { gRough = .42; gMetal = .7; }
  else if (k < 3.5) { gRough = .24; gMetal = .9; }
  else if (k < 4.5) { gRough = .04; }
  else if (k < 5.5) { gRough = .6; gTransl = .85; }
  else if (k < 6.5) { gRough = .5; gTransl = 1.; gSheen = .25; }
  else if (k < 7.5) { gRough = .52; }
  else if (k < 8.5) { gRough = .38; }
  else if (k < 9.5) { gRough = .95; gSheen = .45; }
  else if (k < 10.5) { gRough = .48; gTransl = .32; gSheen = .12; }
  else if (k < 11.5) { gRough = .34; gSheen = .3; }
  else if (k < 12.5) { gRough = .9; }
  else if (k < 13.5) { gRough = .14; }
  else if (k < 14.5) { gRough = .3; }
  else if (k < 15.5) { gRough = .92; gSheen = 1.; }
  else if (k < 16.5) { gRough = .03; }
  else { gRough = .95; }
}
`;
  const LIGHTS_PREMIUM = `
void RE_Direct_Premium( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
  float nl = dot( geometry.normal, directLight.direction ), dotNL = saturate( nl );
  vec3 col = directLight.color * PI;
  vec3 lit = col * mix( 1., gShadow, gIsSun );
  reflectedLight.directSpecular += lit * dotNL * BRDF_Specular_GGX( directLight, geometry.viewDir, geometry.normal, material.specularColor, material.specularRoughness ) * uSpecK;
  reflectedLight.directDiffuse += lit * dotNL * BRDF_Diffuse_Lambert( material.diffuseColor );
  if ( gTransl > 0. ) { // la lumière traverse les feuilles, les pétales et la peau, même un peu à l'ombre
    float back = saturate( -nl ) * .55 + pow( saturate( dot( geometry.viewDir, -directLight.direction ) ), 4. ) * .9;
    reflectedLight.directDiffuse += col * mix( 1., .3 + .7 * gShadow, gIsSun ) * back * gTransl * BRDF_Diffuse_Lambert( material.diffuseColor ) * vec3( 1., .92, .72 );
  }
}
#undef RE_Direct
#define RE_Direct RE_Direct_Premium
`;
  const LIGHTS_BEGIN = `
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	gIsSun = 0.;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointDirectLightIrradiance( pointLight, geometry, directLight );
		directLight.color = s2l( pointLight.color ) * ( dot( directLight.color, vec3( 1. ) ) / max( dot( pointLight.color, vec3( 1. ) ), 1e-5 ) ) * uPointK;
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	gIsSun = 1.;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );
		directLight.color = s2l( directionalLight.color ) * uSunK * gCloud;
		gShadow = 1.;
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		gShadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
	gIsSun = 0.;
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
		}
		#pragma unroll_loop_end
	#endif
	irradiance = s2l( irradiance / PI ) * PI * uAmbK * ( .8 + .2 * gCloud );
	irradiance += getLightProbeIrradiance( lightProbe, geometry );
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif
`;
  // ---------- matériau premium (remplace G.toon partout) ----------
  // o : { cloud, outline, bump, ground, pat, rough, metal, glow }
  function premium(p = {}, o = { cloud: true }) {
    p = Object.assign({}, p); delete p.gradientMap; if (p.shininess != null) delete p.shininess; if (p.specular != null) delete p.specular;
    const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: o.rough != null ? o.rough : .82, metalness: o.metal || 0 }, p));
    const flags = (o.bump ? 'b' : '') + (o.ground ? 'g' : '') + (o.pat ? 'p' : '') + (o.glow ? 'w' : '') + (o.outline ? 'o' + o.outline : '') + (o.rough != null ? 'r' + o.rough : '') + (o.floor ? 'f' + o.floor : '') + (o.vox ? 'v' + o.vox : '');
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uCurve: U.curve, uCC: U.cc, uCF: U.cf, uCloudTex: U.cloudTex, uCloudOff: U.cloudOff, uCloudAmt: U.cloudAmt }, SU);
      if (o.outline) sh.uniforms.uOut = { value: o.outline };
      let vs = 'uniform float uCurve, uTime, uWind;\nuniform vec3 uCC;\nuniform vec2 uCF;\nattribute float sk;\nvarying vec3 vWP;\nvarying float vSk;\n' + (o.outline ? 'uniform float uOut;\n' : '') + sh.vertexShader;
      vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
vSk = sk;
if ( sk > 4.5 && sk < 6.5 ) { // le feuillage et les fleurs ondulent au vent
  #ifdef USE_INSTANCING
  vec4 w0 = modelMatrix * instanceMatrix * vec4( position, 1. );
  #else
  vec4 w0 = modelMatrix * vec4( position, 1. );
  #endif
  float hg = sk < 5.5 ? smoothstep( .7, 3.2, position.y ) : smoothstep( .04, .55, position.y );
  float ph = uTime * 1.55 + w0.x * .35 + w0.z * .27;
  float sw = ( sin( ph ) * .6 + sin( ph * 2.3 + 1.7 ) * .28 + sin( ph * 5.1 + w0.y * 3. ) * .12 ) * hg * uWind * ( sk < 5.5 ? .075 : .03 );
  transformed.x += sw; transformed.z += sw * .6; transformed.y += abs( sw ) * .15;
}` + (o.outline ? '\ntransformed += normalize(normal) * uOut;' : ''));
      vs = vs.replace('#include <project_vertex>', `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
vec4 cwp = modelMatrix * mvPosition;
vWP = cwp.xyz;
vec2 cdv = cwp.xz - uCC.xz; float cdd = dot( cdv, uCF ); float cdl = cdv.x * uCF.y - cdv.y * uCF.x;
cwp.y -= uCurve * ( cdd * cdd + 0.3 * cdl * cdl );
mvPosition = viewMatrix * cwp;
gl_Position = projectionMatrix * mvPosition;`);
      sh.vertexShader = vs;
      let fs = FRAG_DECL + sh.fragmentShader;
      fs = fs.replace('#include <lights_physical_pars_fragment>', '#include <lights_physical_pars_fragment>\n' + LIGHTS_PREMIUM);
      fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\n gLum = dot( texelColor.rgb, vec3( .3, .59, .11 ) );\n#endif');
      // couleur → linéaire, matière de la pièce, humidité
      fs = fs.replace('#include <color_fragment>', `#include <color_fragment>
${o.pat ? 'gLum = dot( diffuseColor.rgb, vec3( .3, .59, .11 ) );' : ''}
${o.floor ? `vec4 pq = parquetCol( vWP.xz, ${o.floor.toFixed(1)} ); diffuseColor.rgb = pq.rgb; gLum = pq.a * .6;` : ''}
diffuseColor.rgb = s2l( diffuseColor.rgb );
gCloud = 1. - uCloudAmt * smoothstep( .42, .75, texture2D( uCloudTex, vWP.xz * .016 + uCloudOff ).r );
gRough = ${(o.rough != null ? o.rough : .82).toFixed(3)}; gMetal = ${(o.metal || 0).toFixed(3)};
surfProps( vSk );
${o.floor ? `gRough = ${o.floor === 3 ? '.12 + .06 * ( 1. - pq.a )' : '.2 + .1 * prH( floor( vWP.xz * 3. ) ) + .4 * ( 1. - pq.a )'};` : ''}
${o.pat ? `{ float pid = floor( vPat + .5 ); gRough = pid < 1.5 ? .85 : pid < 2.5 ? .8 : pid < 3.5 ? .55 : pid < 4.5 ? .62 : pid < 5.5 ? .75 : pid < 6.5 ? .7 : pid < 7.5 ? .93 : pid < 8.5 ? .42 : pid < 9.5 ? .9 : pid < 10.5 ? .8 : pid < 11.5 ? .22 : pid < 12.5 ? .93 : pid < 13.5 ? .96 : pid < 14.5 ? .74 : pid < 15.5 ? .9 : .38; if ( pid > 11.5 && pid < 12.5 ) gSheen = .3; }` : ''}
${o.ground ? `{ vec2 ce = floor( vUv * 4. ); float cell = ce.x + ( 3. - ce.y ) * 4.;
  gRough = cell < .5 ? .9 : cell < 1.5 ? .92 : cell < 2.5 ? .95 : cell < 3.5 ? .7 : cell < 4.5 ? .55 : cell < 5.5 ? .97 : cell < 6.5 ? .42 : cell < 7.5 ? .97 : cell < 8.5 ? .5 : cell < 9.5 ? .75 : cell < 10.5 ? .45 : cell < 11.5 ? .5 : cell < 12.5 ? .28 : cell < 13.5 ? .97 : cell < 14.5 ? .9 : .85;
  if ( cell < 1.5 || ( cell > 13.5 && cell < 14.5 ) ) { gSheen = .35; diffuseColor.rgb *= vec3( .6, .72, .46 );
    if ( uBioSz.z > .5 ) { vec4 bo = texture2D( uBio, vWP.xz * uBioSz.xy ); float nn = prN( vWP.xz * .7 ) * .55 + prN( vWP.xz * 2.9 ) * .45;
      diffuseColor.rgb *= mix( vec3( 1. ), vec3( .62, .82, .55 ), bo.r ); diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * vec3( 1.75, 1.15, .5 ), bo.g ); diffuseColor.rgb *= ( .7 + .26 * nn ) * ( 1. - bo.b * .12 ); } }
  if ( uWet > 0. && ( ( cell > 2.5 && cell < 4.5 ) || ( cell > 8.5 && cell < 9.5 ) || ( cell > 10.5 && cell < 12.5 ) || ( cell > 14.5 ) ) ) { // flaques sur les chemins
    float pd = smoothstep( .58, .66, prN( vWP.xz * .55 ) * .7 + prN( vWP.xz * 1.7 ) * .3 ) * uWet; gRough = mix( gRough, .02, pd ); diffuseColor.rgb *= 1. - .45 * pd; } }` : ''}
`);
      fs = fs.replace('#include <roughnessmap_fragment>', 'float roughnessFactor = gRough;\n#ifdef USE_ROUGHNESSMAP\n vec4 texelRoughness = texture2D( roughnessMap, vUv ); roughnessFactor *= texelRoughness.g;\n#endif');
      fs = fs.replace('#include <metalnessmap_fragment>', 'float metalnessFactor = gMetal;');
      fs = fs.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
${o.bump ? 'normal = prBump( -vViewPosition, normal, vec2( dFdx( gLum ), dFdy( gLum ) ) * .018 * uBumpK );' : ''}
{ vec3 nW = inverseTransformDirection( normal, viewMatrix ); gUp = saturate( nW.y );
  if ( uVox > 0. ) { // style cubique : chaque face reçoit une texture de pixels de 1/16 de bloc, variée bloc par bloc
    vec3 an = abs( nW ); bool tp = an.y > max( an.x, an.z ); vec2 fuv = tp ? vWP.xz : ( an.x > an.z ? vWP.zy : vWP.xy );
    ${o.vox === 2 ? 'if ( !tp ) fuv.y /= .75;' : ''}
    float fw = max( fwidth( fuv.x ), fwidth( fuv.y ) ) * 16., near = 1. - smoothstep( .5, 1.6, fw ), mid = 1. - smoothstep( 1., 3.2, fw );
    float leaf = step( 4.5, vSk ) * step( vSk, 6.5 ), px = prH( floor( fuv * 16. + .002 ) ), px2 = prH( floor( fuv * 8. + .002 ) + 7.31 ), bk = prH( floor( fuv + .002 ) + 19.7 );
    float tx = ( px - .5 ) * ( .26 + leaf * .3 ) * near + ( px2 - .5 ) * .15 * mid + ( bk - .5 ) * .1;
    ${o.vox ? 'vec2 fe = fract( fuv + .002 ); float ed = min( min( fe.x, 1. - fe.x ), min( fe.y, 1. - fe.y ) ); tx -= ( 1. - smoothstep( .0, .035 + fw * .02, ed ) ) * .32 * mid;' : ''}
    diffuseColor.rgb *= max( 0., 1. + tx * uVox ); }
  if ( uWet > 0. ) { float w = uWet * smoothstep( .45, .9, gUp ) * ( 1. - step( 3.5, vSk ) * step( vSk, 4.5 ) ); diffuseColor.rgb *= 1. - .32 * w; gRough = mix( gRough, gRough * .3 + .04, w ); roughnessFactor = gRough; } }`);
      fs = fs.replace('#include <lights_fragment_begin>', LIGHTS_BEGIN);
      fs = fs.replace('#include <lights_fragment_maps>', `#if defined( RE_IndirectSpecular )
	radiance += skyRad( inverseTransformDirection( reflect( -geometry.viewDir, geometry.normal ), viewMatrix ), material.specularRoughness ) * ( .55 + .45 * gCloud );
#endif`);
      // velours / tissu / herbe : lisière éclairée ; verre : plus opaque de biais
      fs = fs.replace('#include <aomap_fragment>', `#include <aomap_fragment>
{ float nv = saturate( dot( geometry.normal, geometry.viewDir ) );
  if ( gSheen > 0. ) reflectedLight.indirectDiffuse += material.diffuseColor * irradiance * RECIPROCAL_PI * gSheen * pow( 1. - nv, 3. ) * 1.4;
  if ( vSk > 3.5 && vSk < 4.5 ) diffuseColor.a = mix( diffuseColor.a, 1., pow( 1. - nv, 4. ) * .75 ); }
${o.glow ? '{ vec3 ec = vColor; ec = mix( ec, vec3( .66, .52, .33 ), smoothstep( .01, .1, ec.b - ec.r ) * ( 1. - smoothstep( .3, .45, max( ec.r, max( ec.g, ec.b ) ) - min( ec.r, min( ec.g, ec.b ) ) ) ) * uWarmK ); totalEmissiveRadiance += s2l( ec ) * uGlowK; } // vitres : la nuit, une lumière blanc très chaud comme les lampadaires' : ''}`);
      fs = fs.replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = l2s( gl_FragColor.rgb );');
      sh.fragmentShader = fs;
    };
    m.customProgramCacheKey = () => 'pr' + flags;
    return m;
  }
  G.premiumMat = premium;
  G.toon = (p = {}, o = { cloud: true }) => premium(p, o);
  // ---------- eau ----------
  const WATER_VS = `uniform float uCurve; uniform vec3 uCC; uniform vec2 uCF; varying vec3 vWP; varying vec3 vCol; varying vec3 vVD;
#include <fog_pars_vertex>
void main() {
  vec4 cwp = modelMatrix * vec4( position, 1. ); vWP = cwp.xyz;
  #ifdef USE_COLOR
  vCol = color;
  #else
  vCol = vec3( .55, .8, .95 );
  #endif
  vec2 cdv = cwp.xz - uCC.xz; float cdd = dot( cdv, uCF ); float cdl = cdv.x * uCF.y - cdv.y * uCF.x; cwp.y -= uCurve * ( cdd * cdd + 0.3 * cdl * cdl );
  vVD = cameraPosition - cwp.xyz;
  vec4 mvPosition = viewMatrix * cwp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const WATER_FS = `uniform float uTime, uSunK, uCloudAmt, uNight, opacity, uWet; uniform vec3 uSunDir, uSunCol, uSkyTop, uSkyHor, uSkyGnd; uniform sampler2D uCloudTex, uRipple; uniform vec2 uCloudOff;
varying vec3 vWP; varying vec3 vCol; varying vec3 vVD;
#include <fog_pars_fragment>
vec3 s2l( vec3 c ) { return pow( max( c, vec3( 0. ) ), vec3( 2.2 ) ); }
float wh( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
float wn( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3. - 2. * f ); return mix( mix( wh( i ), wh( i + vec2( 1., 0. ) ), f.x ), mix( wh( i + vec2( 0., 1. ) ), wh( i + vec2( 1., 1. ) ), f.x ), f.y ); }
vec2 wave( vec2 p, vec2 d, float k, float sp, float a, float t ) { float ph = dot( p, d ) * k + t * sp; return d * cos( ph ) * k * a; }
void main() {
  float t = uTime; vec2 p = vWP.xz;
  vec2 g = wave( p, vec2( .8, .6 ), 1.1, 1.3, .045, t ) + wave( p, vec2( -.55, .83 ), 1.9, 1.9, .028, t ) + wave( p, vec2( .97, -.24 ), 3.3, 2.6, .014, t ) + wave( p, vec2( -.3, -.95 ), 5.4, 3.4, .007, t );
  g += ( vec2( wn( p * 2.3 + t * .35 ), wn( p * 2.3 + 17. - t * .3 ) ) - .5 ) * .09;
  vec3 n = normalize( vec3( -g.x, 1., -g.y ) );
  vec3 V = normalize( vVD );
  float nv = max( dot( n, V ), 0. ), fres = .02 + .98 * pow( 1. - nv, 5. );
  vec3 R = reflect( -V, n ); R.y = abs( R.y );
  vec3 top = s2l( uSkyTop ), hor = s2l( uSkyHor ), sky = mix( hor, top, pow( min( 1., R.y * 1.5 ), .65 ) );
  float cl = 1. - uCloudAmt * smoothstep( .42, .75, texture2D( uCloudTex, vWP.xz * .016 + uCloudOff ).r );
  float br = ( vCol.r + vCol.g + vCol.b ) / 3., shore = smoothstep( .8, .95, br ), deep = smoothstep( .72, .5, br );
  vec3 amb = mix( hor, top, .5 ) * .55 + s2l( uSunCol ) * uSunK * max( uSunDir.y, 0. ) * .35 * cl;
  vec3 body = mix( mix( s2l( vec3( .12, .42, .5 ) ), s2l( vec3( .3, .7, .72 ) ), shore ), s2l( vec3( .06, .24, .36 ) ), deep ) * amb;
  float sd = max( dot( R, uSunDir ), 0. );
  vec3 col = mix( body, sky, fres ) + s2l( uSunCol ) * uSunK * ( pow( sd, 700. ) * 40. + pow( sd, 70. ) * .5 ) * cl * ( 1. - uWet * .6 );
  float rip = texture2D( uRipple, p * .3 + vec2( t * .02, t * .013 ) ).r;
  float foam = shore * smoothstep( .45, .8, wn( p * 3.1 + vec2( t * .45, -t * .3 ) ) * .55 + rip * .5 ) + smoothstep( .9, 1., rip ) * .18 * ( 1. - deep );
  col = mix( col, amb * 1.35 + vec3( .02 ), clamp( foam, 0., 1. ) * .75 );
  if ( uWet > 0. ) col += amb * .25 * uWet * smoothstep( .75, .98, wn( p * 9. + t * 5. ) ); // gouttes de pluie
  float a = clamp( mix( .6, .96, fres ) + foam * .35 + shore * .08 + deep * .12, 0., 1. ) * opacity / .8;
  gl_FragColor = vec4( pow( col, vec3( 1. / 2.2 ) ), a );
  #include <fog_fragment>
}`;
  function waterMat() {
    const uni = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { opacity: { value: .8 } }]);
    Object.assign(uni, { uCurve: U.curve, uCC: U.cc, uCF: U.cf, uCloudTex: U.cloudTex, uCloudOff: U.cloudOff, uCloudAmt: U.cloudAmt, uRipple: { value: G.TEX.water } }, SU);
    const m = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: WATER_VS, fragmentShader: WATER_FS, vertexColors: true, transparent: true, depthWrite: false, fog: true });
    m.userData.base = .8;
    Object.defineProperty(m, 'opacity', { get() { return this.uniforms.opacity.value; }, set(v) { if (this.uniforms) this.uniforms.opacity.value = v; } });
    return m;
  }
  // ---------- matériaux du jeu ----------
  const omm = G.makeMaterials;
  G.makeMaterials = () => {
    omm(); const M = G.M;
    M.ground = premium({ map: G.TEX.atlas, vertexColors: true }, { cloud: true, ground: true, bump: 1, vox: 1 });
    M.cliff = premium({ map: G.TEX.cliff, vertexColors: true }, { cloud: true, bump: 1, rough: .9, vox: 2 });
    M.glow = premium({ vertexColors: true }, { cloud: true, glow: true, rough: .1 }); G.MATS[1] = M.glow;
    M.water = waterMat();
    const fireMat = M.fire, ofb = fireMat.onBeforeCompile; fireMat.onBeforeCompile = sh => { ofb(sh); sh.uniforms.uFireK = SU.uFireK; sh.fragmentShader = 'uniform float uFireK;\n' + sh.fragmentShader.replace('#include <fog_fragment>', 'gl_FragColor.rgb *= uFireK;\n#include <fog_fragment>'); };
    fireMat.customProgramCacheKey = () => 'cv-fire';
    for (const t of [G.TEX.atlas, G.TEX.cliff]) { t.anisotropy = 8; t.needsUpdate = true; }
  };

  // ---------- ciel atmosphérique ----------
  const SKY_FS = `uniform vec3 top, hor, uSunDir, uSunCol; uniform float uNight, uTime, uMoonPh, uMoonK, uStarRot; varying vec3 vP;
float sh( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
float sn( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3. - 2. * f ); return mix( mix( sh( i ), sh( i + vec2( 1., 0. ) ), f.x ), mix( sh( i + vec2( 0., 1. ) ), sh( i + vec2( 1., 1. ) ), f.x ), f.y ); }
float fbm( vec2 p ) { float a = .5, s = 0.; for ( int i = 0; i < 5; i ++ ) { s += sn( p ) * a; p = p * 2.03 + vec2( 1.7, 9.2 ); a *= .5; } return s; }
vec3 rotA( vec3 v, vec3 k, float a ) { float c = cos( a ), s = sin( a ); return v * c + cross( k, v ) * s + k * dot( k, v ) * ( 1. - c ); }
float mare( vec2 p, vec2 c, vec2 r ) { vec2 q = ( p - c ) / r; return smoothstep( 1., .3, dot( q, q ) ); }
// la lune vue de la Terre : ses mers aux vraies places (Océan des Tempêtes, mers des Pluies, de la Sérénité, de la Tranquillité, des Crises…),
// ses cratères rayonnants (Tycho, Copernic, Kepler, Aristarque), sa phase, la lumière cendrée sur la partie sombre
vec3 moon( vec3 d, vec3 md ) {
  const float R = .032; if ( dot( d, md ) < .998 ) return vec3( 0. );
  vec3 rt = normalize( cross( md, vec3( 0., 1., 0. ) ) ), up = cross( rt, md );
  vec2 p = vec2( dot( d, rt ), dot( d, up ) ) / R; float r = length( p ); if ( r > 1. ) return vec3( 0. );
  vec3 n = vec3( p, sqrt( max( 0., 1. - r * r ) ) );
  vec2 q = p + ( vec2( fbm( p * 3. + 11. ), fbm( p * 3. + 27. ) ) - .5 ) * .22;
  float m = mare( q, vec2( -.58, .1 ), vec2( .3, .52 ) ); m = max( m, mare( q, vec2( -.3, .48 ), vec2( .27, .22 ) ) ); m = max( m, mare( q, vec2( .17, .43 ), vec2( .15, .14 ) ) );
  m = max( m, mare( q, vec2( .36, .13 ), vec2( .2, .17 ) ) ); m = max( m, mare( q, vec2( .7, .3 ), vec2( .1, .12 ) ) ); m = max( m, mare( q, vec2( .58, -.1 ), vec2( .11, .17 ) ) );
  m = max( m, mare( q, vec2( .34, -.27 ), vec2( .08, .09 ) ) ); m = max( m, mare( q, vec2( -.17, -.35 ), vec2( .18, .14 ) ) ); m = max( m, mare( q, vec2( -.5, -.4 ), vec2( .09, .09 ) ) );
  m = max( m, mare( q, vec2( .02, .76 ), vec2( .42, .07 ) ) ); m = max( m, mare( q, vec2( -.1, .17 ), vec2( .12, .1 ) ) );
  float alb = mix( 1., .5, m * ( .7 + .4 * fbm( p * 7. ) ) ) * ( .84 + .3 * fbm( p * 16. + 3. ) );
  alb *= .92 + .16 * smoothstep( .4, .75, fbm( p * 30. + 7. ) ); // petits cratères
  vec2 ty = p - vec2( -.1, -.68 ); float tl = length( ty ), ta = atan( ty.y, ty.x );
  alb += .5 * exp( -tl * tl * 900. ) + pow( sn( vec2( ta * 7.6, 1.5 ) ), 5. ) * exp( -tl * 2.4 ) * .45 * smoothstep( .03, .1, tl ); // Tycho et ses rayons
  alb += .35 * exp( -dot( p - vec2( -.31, .19 ), p - vec2( -.31, .19 ) ) * 1300. ) + .25 * exp( -dot( p - vec2( -.6, .14 ), p - vec2( -.6, .14 ) ) * 1600. ) + .45 * exp( -dot( p - vec2( -.72, .38 ), p - vec2( -.72, .38 ) ) * 2500. );
  vec3 L = vec3( sin( uMoonPh ), 0., -cos( uMoonPh ) );
  float mu0 = dot( n, L ), mu = max( n.z, .04 ), lit = smoothstep( -.03, .05, mu0 ), ls = min( 1.2, max( mu0, 0. ) / ( max( mu0, 0. ) + mu ) * 2. ); // réflexion lunaire (Lommel-Seeliger) : pleine lune toute plate
  vec3 col = vec3( 1.04, 1., .9 ) * alb * ls * lit * .78 + vec3( .05, .07, .11 ) * alb * ( 1. - lit ) * ( 1. - uMoonK ) * smoothstep( .004, .04, uMoonK ) * .7; // lumière cendrée
  return col * smoothstep( 1., .965, r );
}
// la Voie lactée : une bande laiteuse et granuleuse coupée par le grand rift sombre, plus dense vers le centre de la galaxie ; elle tourne avec les étoiles
vec3 milky( vec3 d ) {
  vec3 dc = rotA( d, vec3( 0., .719, -.695 ), -uStarRot ), gn = normalize( vec3( .45, .35, .82 ) ), gc = normalize( cross( gn, vec3( 0., 1., 0. ) ) ), gb = cross( gn, gc );
  float v = dot( dc, gn ); vec2 g = vec2( dot( dc, gc ), dot( dc, gb ) );
  float band = exp( -v * v / .04 ), bulge = exp( -( 1. - g.x ) * 4. ) * exp( -v * v / .025 );
  vec2 w = g * 7. + vec2( v * 5., -v * 4. );
  float cl = fbm( w ), grain = fbm( w * 4.3 + 5. ), rift = smoothstep( .48, .7, fbm( w * 1.3 + vec2( 9., 2. ) ) ) * exp( -v * v / .006 );
  return vec3( .88, .86, .92 ) * ( band * ( .3 + .9 * cl ) * ( .75 + .5 * grain ) + bulge * 1.3 ) * ( 1. - .85 * rift );
}
void main() {
  vec3 d = normalize( vP ); float h = d.y;
  vec3 c = h > 0. ? mix( hor, top, pow( min( 1., h * 1.7 ), .75 ) ) : mix( hor, hor * .8, min( 1., -h * 4. ) );
  c = mix( c, top * vec3( .72, .86, 1.04 ), smoothstep( .15, .85, h ) * .55 ); // bleu profond au zénith
  c = mix( c, hor * 1.06 + vec3( .02 ), exp( -abs( h ) * 16. ) * .45 ); // brume de l'horizon
  float sd = max( dot( d, uSunDir ), 0. ), day = 1. - uNight;
  vec3 sunC = uSunCol;
  c += sunC * ( pow( sd, 5. ) * .16 + pow( sd, 40. ) * .32 + pow( sd, 400. ) * .7 ) * mix( .35, 1., day ); // halo
  c = mix( c, vec3( 1.6, 1.5, 1.3 ) * mix( vec3( 1. ), sunC, .35 ), smoothstep( .99955, .99975, sd ) * day * step( 0., h + .02 ) ); // disque du soleil
  if ( uNight > .01 ) { // la nuit, uSunDir est la direction de la lune
    float nn = uNight * uNight; c += milky( d ) * nn * .16 * ( 1. - .6 * uMoonK ) * smoothstep( .02, .4, h );
    c += vec3( .75, .8, .95 ) * ( pow( sd, 1200. ) * .12 + pow( sd, 120. ) * .05 ) * uMoonK * uNight; // auréole autour de la lune
    c += moon( d, uSunDir ) * uNight; }
  if ( h > 0. ) { // voile de cirrus
    vec2 uv = d.xz / ( h + .18 ) * .9 + vec2( uTime * .006, uTime * .0025 );
    float n = fbm( uv * 1.6 ), w = fbm( uv * 5. + 3.1 );
    float cl = smoothstep( .52, .82, n * .75 + w * .35 ) * smoothstep( 0., .22, h ) * .55;
    vec3 cc = mix( hor * 1.1, vec3( 1. ), .55 ) * mix( .35, 1., day ) + sunC * pow( sd, 6. ) * .45;
    c = mix( c, cc, cl );
  }
  gl_FragColor = vec4( c, 1. );
}`;
  function upgradeSky() {
    const s = G.skyMesh; if (!s || s.userData.premium) return; s.userData.premium = true; const m = s.material;
    Object.assign(m.uniforms, { uSunDir: SU.uSunDir, uSunCol: SU.uSunCol, uNight: SU.uNight, uTime: SU.uTime, uMoonPh: SU.uMoonPh, uMoonK: SU.uMoonK, uStarRot: SU.uStarRot }); m.fragmentShader = SKY_FS; m.needsUpdate = true;
    for (const x of [G.sunMesh, G.moonMesh]) if (x) x.material.visible = false;
    upgradeStars();
  }
  // ---------- ciel étoilé : 2600 étoiles de toutes grandeurs et couleurs (bleues, blanches, jaunes, orangées, rouges), plus nombreuses
  // le long de la Voie lactée ; elles scintillent (fort près de l'horizon), s'éteignent dans la brume du bas du ciel, pâlissent
  // autour de la lune et quand elle est pleine, passent derrière son disque, et tournent lentement autour de l'étoile Polaire ----------
  const POLE = new THREE.Vector3(0, .719, -.695);
  const STAR_VS = `attribute float aSize, aBright, aPh; attribute vec3 aCol; uniform float uOp, uTime, uPx, uMoonK; uniform vec3 uSunDir; varying vec3 vC; varying float vA;
void main() {
  vec3 wd = normalize( mat3( modelMatrix ) * position ); float el = wd.y, mc = dot( wd, uSunDir );
  float tw = 1. + ( sin( uTime * ( 2. + aPh * 3. ) + aPh * 40. ) + sin( uTime * ( 5. + aPh * 4. ) + aPh * 17. ) ) * .5 * mix( .5, .14, clamp( el * 2.5, 0., 1. ) );
  float vis = smoothstep( 0., .25, el ) * ( 1. - smoothstep( .99945, .99955, mc ) ) * ( 1. - .9 * uMoonK * exp( -( 1. - mc ) * 40. ) );
  vA = uOp * aBright * max( tw, 0. ) * vis * mix( 1., smoothstep( .12, .5, aBright ), uMoonK * .45 );
  vC = mix( aCol, aCol * vec3( 1., .8, .6 ), 1. - smoothstep( 0., .3, el ) ); // rougies près de l'horizon
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. ); gl_PointSize = aSize * uPx * ( .8 + .2 * tw ); }`;
  const STAR_FS = `varying vec3 vC; varying float vA; void main() { vec2 q = gl_PointCoord * 2. - 1.; float r2 = dot( q, q ); if ( r2 > 1. ) discard; gl_FragColor = vec4( vC * 1.8, ( exp( -r2 * 3. ) + exp( -r2 * 12. ) ) * vA ); }`;
  function upgradeStars() {
    const st = G.stars; if (!st) return; const r = G.rng(1789), N = 2600, pos = [], col = [], size = [], bri = [], ph = [];
    const gn = new THREE.Vector3(.45, .35, .82).normalize(), v = new THREE.Vector3(), u1 = new THREE.Vector3(), u2 = new THREE.Vector3(); u1.crossVectors(gn, new THREE.Vector3(0, 1, 0)).normalize(); u2.crossVectors(gn, u1);
    const COL = [[.68, .78, 1], [.82, .88, 1], [.97, .97, 1], [1, .95, .82], [1, .84, .64], [1, .72, .55]], CW = [.08, .17, .35, .22, .13, .05];
    for (let i = 0; i < N; i++) {
      if (i % 3 === 0) { const a = r() * PI * 2, g = (r() + r() + r() - 1.5) * .14; v.copy(u1).multiplyScalar(Math.cos(a)).addScaledVector(u2, Math.sin(a)).addScaledVector(gn, g).normalize(); } // le long de la Voie lactée
      else { const z = r() * 2 - 1, a = r() * PI * 2, s = Math.sqrt(1 - z * z); v.set(s * Math.cos(a), z, s * Math.sin(a)); }
      pos.push(v.x * 400, v.y * 400, v.z * 400);
      const b = Math.pow(r(), 5), big = i < 14; size.push(big ? 5 + r() * 1.5 : 1.8 + b * 3.6); bri.push(big ? 1 : .3 + .7 * Math.pow(b, .4)); ph.push(r());
      let w = r(), k = 0; while (k < CW.length - 1 && (w -= CW[k]) > 0) k++; col.push(...COL[k]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1)); g.setAttribute('aBright', new THREE.Float32BufferAttribute(bri, 1)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uOp: { value: 0 }, uPx: { value: 1 }, uTime: SU.uTime, uMoonK: SU.uMoonK, uSunDir: SU.uSunDir } });
    Object.defineProperty(m, 'opacity', { get() { return this.uniforms.uOp.value; }, set(x) { if (this.uniforms) this.uniforms.uOp.value = x; } });
    st.geometry.dispose(); st.material.dispose(); st.geometry = g; st.material = m;
  }
  // âge de la lune : le vrai si l'heure du jeu suit l'heure réelle, sinon un cycle de 29,5 jours de jeu (on commence près de la pleine lune)
  const SYN = 29.530589;
  G.moonAge = () => { const c = G.clock || {}; return G.settings && G.settings.day === 'real' ? ((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 % SYN + SYN) % SYN : ((c.day || 0) + (c.min || 0) / 1440 + 14) % SYN; };

  // ---------- mise à jour des uniformes ----------
  const SD = new THREE.Vector3(), C1 = new THREE.Color(), C2 = new THREE.Color();
  let wetT = 0, voxT = -1;
  G.on('init', () => {
    const R = G.renderer; R.toneMapping = THREE.NoToneMapping; R.shadowMap.type = THREE.PCFSoftShadowMap;
    upgradeSky(); setupPost(R); buildOptions();
  });
  G.on('frame', dt => {
    SU.uTime.value += dt; const L = G.lights, si = G.skyInfo, m = G.map; if (!L || !si) return; const inside = !!(m && m.interior), n = si.n || 0;
    SD.copy(L.sun.position).sub(L.sun.target.position).normalize(); SU.uSunDir.value.copy(SD);
    SU.uSunCol.value.copy(L.sun.color).multiplyScalar(Math.min(1.2, L.sun.intensity * 1.05)); SU.uNight.value = n;
    const ph = G.moonAge() / SYN * PI * 2; SU.uMoonPh.value = ph; SU.uMoonK.value = .5 - .5 * Math.cos(ph);
    SU.uStarRot.value = si.h / 24 * PI * 2; if (G.stars && G.stars.material.uniforms) { G.stars.quaternion.setFromAxisAngle(POLE, SU.uStarRot.value); G.stars.material.uniforms.uPx.value = G.renderer.getPixelRatio(); }
    if (inside) { // reflets d'une pièce : plafond clair, murs, sol
      const sh = m.meta && m.meta.shell; SU.uSkyTop.value.setRGB(.82, .78, .72); SU.uSkyHor.value.setRGB(.74, .66, .56); SU.uSkyGnd.value.setRGB(.42, .32, .24);
      if (sh && sh.envTop) { SU.uSkyTop.value.setHex(sh.envTop); SU.uSkyHor.value.setHex(sh.envHor); }
    } else { SU.uSkyTop.value.copy(si.top); SU.uSkyHor.value.copy(si.hor); SU.uSkyGnd.value.copy(L.hemi.groundColor); }
    // calibrage : jour, nuit, intérieur
    const day = 1 - n; SU.uSunK.value = inside ? 1.35 : 1.5 + .15 * day; SU.uAmbK.value = inside ? (m.meta.sunny ? .85 : 1.3) : 1.15 + .25 * n; SU.uEnvK.value = inside ? .5 : .8;
    SU.uPointK.value = inside ? 3.4 : 3.4; SU.uGlowK.value = inside ? .9 : G.lerp(.12, 2.6, Math.min(1, n * 1.3)); SU.uWarmK.value = inside ? 0 : Math.min(1, n * 1.5);
    SU.uWet.value += ((G.weather && G.weather.wet ? G.weather.wet : 0) - SU.uWet.value) * Math.min(1, dt * .25); wetT += dt;
    SU.uWind.value = G.weather && G.weather.wind != null ? G.weather.wind : 1;
    const vx = G.settings && G.settings.style === 'cubique' ? 1 : 0; // réaliste par défaut ; le style cubique est une option if (voxT !== vx) { voxT = vx; SU.uVox.value = vx; for (const t of [G.TEX.atlas, G.TEX.cliff]) if (t) { t.magFilter = vx ? THREE.NearestFilter : THREE.LinearFilter; t.needsUpdate = true; } }
  });

  // =====================================================================
  // ======================= POST-TRAITEMENT HDR ==========================
  // =====================================================================
  const PP = G.post = { ok: false, fail: false, w: 0, h: 0, msaa: false, hdr: false, focus: 12 };
  const QVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4( position.xy, 0., 1. ); }';
  let qScene, qCam, quad, rtScene, rtAO, rtAO2, rtB = [], rtD0, rtD1, rtS, mShaft, mAO, mBlur, mPre, mDown, mUp, mDofDown, mComp, KER;
  const V2 = new THREE.Vector2(), V3 = new THREE.Vector3(), M4 = new THREE.Matrix4();
  const sm = (fs, u) => new THREE.ShaderMaterial({ vertexShader: QVS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
  const AO_FS = `#include <packing>
uniform sampler2D tDepth; uniform vec2 uTexel, uTanFov; uniform float uNear, uFar, uRadius, uPower; uniform mat4 uProj; uniform vec3 uKer[ 12 ]; varying vec2 vUv;
float vZ( vec2 uv ) { return perspectiveDepthToViewZ( texture2D( tDepth, uv ).x, uNear, uFar ); }
vec3 vP( vec2 uv, float z ) { return vec3( ( uv * 2. - 1. ) * uTanFov * -z, z ); }
void main() {
  float d = texture2D( tDepth, vUv ).x; if ( d >= .99999 ) { gl_FragColor = vec4( 1., 1e4, 0., 1. ); return; }
  float z = perspectiveDepthToViewZ( d, uNear, uFar ); vec3 P = vP( vUv, z );
  vec2 dx = vec2( uTexel.x, 0. ), dy = vec2( 0., uTexel.y );
  vec3 pr = vP( vUv + dx, vZ( vUv + dx ) ), pl = vP( vUv - dx, vZ( vUv - dx ) ), pu = vP( vUv + dy, vZ( vUv + dy ) ), pd = vP( vUv - dy, vZ( vUv - dy ) );
  vec3 ddx = abs( pr.z - P.z ) < abs( P.z - pl.z ) ? pr - P : P - pl, ddy = abs( pu.z - P.z ) < abs( P.z - pd.z ) ? pu - P : P - pd;
  vec3 N = normalize( cross( ddx, ddy ) );
  float rnd = fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) * 6.2832;
  vec3 rv = vec3( cos( rnd ), sin( rnd ), 0. ), T = normalize( rv - N * dot( rv, N ) ), B = cross( N, T ); mat3 TBN = mat3( T, B, N );
  float rad = uRadius * clamp( -z / 12., .6, 2.2 ), occ = 0.;
  for ( int i = 0; i < 12; i ++ ) {
    vec3 S = P + TBN * uKer[ i ] * rad; vec4 c = uProj * vec4( S, 1. ); vec2 suv = c.xy / c.w * .5 + .5;
    float sz = vZ( suv ); float rc = smoothstep( 0., 1., rad / abs( P.z - sz ) );
    occ += ( sz >= S.z + .025 * rad ? 1. : 0. ) * rc;
  }
  gl_FragColor = vec4( pow( clamp( 1. - occ / 12., 0., 1. ), uPower ), -z, 0., 1. );
}`;
  const BLUR_FS = `uniform sampler2D tAO; uniform vec2 uDir; varying vec2 vUv;
void main() { vec2 c = texture2D( tAO, vUv ).rg; float s = c.r, w = 1.;
  for ( int i = -4; i <= 4; i ++ ) { if ( i == 0 ) continue; vec2 q = texture2D( tAO, vUv + uDir * float( i ) ).rg; float wi = exp( -abs( q.g - c.g ) / ( c.g * .04 + .05 ) ) * ( 1. - abs( float( i ) ) / 5.5 ); s += q.r * wi; w += wi; }
  gl_FragColor = vec4( s / w, c.g, 0., 1. ); }`;
  const PRE_FS = `uniform sampler2D tScene; uniform vec2 uTexel; uniform float uTh, uKnee; varying vec2 vUv;
void main() { vec3 c = ( texture2D( tScene, vUv + uTexel * vec2( -.5, -.5 ) ).rgb + texture2D( tScene, vUv + uTexel * vec2( .5, -.5 ) ).rgb + texture2D( tScene, vUv + uTexel * vec2( -.5, .5 ) ).rgb + texture2D( tScene, vUv + uTexel * vec2( .5, .5 ) ).rgb ) * .25;
  c = pow( max( c, vec3( 0. ) ), vec3( 2.2 ) ); float br = max( c.r, max( c.g, c.b ) ); float so = clamp( br - uTh + uKnee, 0., 2. * uKnee ); so = so * so / ( 4. * uKnee + 1e-4 );
  gl_FragColor = vec4( min( c * max( so, br - uTh ) / max( br, 1e-4 ), vec3( 30. ) ), 1. ); }`;
  const DOWN_FS = `uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() { vec3 s = texture2D( tSrc, vUv ).rgb * 4. + texture2D( tSrc, vUv - uTexel ).rgb + texture2D( tSrc, vUv + uTexel ).rgb + texture2D( tSrc, vUv + vec2( uTexel.x, -uTexel.y ) ).rgb + texture2D( tSrc, vUv - vec2( uTexel.x, -uTexel.y ) ).rgb; gl_FragColor = vec4( s / 8., 1. ); }`;
  const UP_FS = `uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uK; varying vec2 vUv;
void main() { vec2 t = uTexel; vec3 s = texture2D( tSrc, vUv + vec2( -t.x * 2., 0. ) ).rgb + texture2D( tSrc, vUv + vec2( -t.x, t.y ) ).rgb * 2. + texture2D( tSrc, vUv + vec2( 0., t.y * 2. ) ).rgb + texture2D( tSrc, vUv + t ).rgb * 2.
  + texture2D( tSrc, vUv + vec2( t.x * 2., 0. ) ).rgb + texture2D( tSrc, vUv + vec2( t.x, -t.y ) ).rgb * 2. + texture2D( tSrc, vUv + vec2( 0., -t.y * 2. ) ).rgb + texture2D( tSrc, vUv - t ).rgb * 2.; gl_FragColor = vec4( s / 12. * uK, 1. ); }`;
  const DOFDOWN_FS = `uniform sampler2D tScene; uniform vec2 uTexel; varying vec2 vUv;
void main() { vec3 s = vec3( 0. ); for ( int y = -1; y <= 2; y ++ ) for ( int x = -1; x <= 2; x ++ ) s += pow( max( texture2D( tScene, vUv + uTexel * ( vec2( x, y ) - .5 ) ).rgb, vec3( 0. ) ), vec3( 2.2 ) ); gl_FragColor = vec4( s / 16., 1. ); }`;
  const SHAFT_FS = `uniform sampler2D tDepth, tScene; uniform vec2 uSun; varying vec2 vUv;
void main() { vec2 d = ( uSun - vUv ) / 32.; vec2 uv = vUv; float s = 0., w = 1., ws = 0.;
  for ( int i = 0; i < 32; i ++ ) { vec2 q = clamp( uv, vec2( .001 ), vec2( .999 ) ); float sky = step( .99999, texture2D( tDepth, q ).x ); vec3 c = texture2D( tScene, q ).rgb; s += sky * max( dot( c, vec3( .3, .59, .11 ) ) - .5, 0. ) * w; ws += w; w *= .955; uv += d; }
  float fall = 1. - smoothstep( 0., .85, length( ( vUv - uSun ) * vec2( 1.6, 1. ) ) ); gl_FragColor = vec4( vec3( s / ws * fall * 3. ), 1. ); }`;
  const COMP_FS = `#include <packing>
uniform sampler2D tScene, tDepth, tAO, tBloom, tBlur, tShaft; uniform vec2 uTexel, uTanFov; uniform vec3 uHazeCol, uTint, uSunHaze, uSunDirW, uShaftCol; uniform mat3 uCamRot; uniform float uCamY, uShaftK, uSharp, uSplit;
uniform float uNear, uFar, uAOk, uBloomK, uExposure, uDof, uFocus, uFocusR, uFarBlur, uHaze, uHazeStart, uSat, uVig, uTime, uHasAO, uHasBloom, uHasDof, uContrast; varying vec2 vUv;
vec3 neutral( vec3 c ) { // tonemapper « PBR Neutral » (Khronos) : couleurs fidèles, hautes lumières adoucies
  float x = min( c.r, min( c.g, c.b ) ), off = x < .08 ? x - 6.25 * x * x : .04; c -= off; float pk = max( c.r, max( c.g, c.b ) ); if ( pk < .76 ) return c;
  float d = .24, np = 1. - d * d / ( pk + d - .76 ); c *= np / pk; float g = 1. - 1. / ( .15 * ( pk - np ) + 1. ); return mix( c, vec3( np ), g ); }
void main() {
  vec3 col = texture2D( tScene, vUv ).rgb; float d = texture2D( tDepth, vUv ).x; bool sky = d >= .99999;
  float vz = sky ? 1e4 : -perspectiveDepthToViewZ( d, uNear, uFar );
  if ( uSharp > 0. && !sky ) { vec3 nb = texture2D( tScene, vUv + vec2( uTexel.x, 0. ) ).rgb + texture2D( tScene, vUv - vec2( uTexel.x, 0. ) ).rgb + texture2D( tScene, vUv + vec2( 0., uTexel.y ) ).rgb + texture2D( tScene, vUv - vec2( 0., uTexel.y ) ).rgb; col = max( col + ( col - nb * .25 ) * uSharp, vec3( 0. ) ); } // netteté douce
  vec3 lin = pow( max( col, vec3( 0. ) ), vec3( 2.2 ) );
  if ( uHasDof > .5 ) { float coc = clamp( ( abs( vz - uFocus ) - uFocusR ) / ( uFocusR * 1.6 ), 0., 1. ); coc = max( coc, smoothstep( uFarBlur, uFarBlur * 2.4, vz ) ); if ( sky ) coc = smoothstep( uFarBlur * .5, uFarBlur, 400. ); lin = mix( lin, texture2D( tBlur, vUv ).rgb, coc * uDof ); }
  if ( uHasAO > .5 && !sky ) { float ao = texture2D( tAO, vUv ).r; lin *= mix( 1., ao, uAOk ); }
  if ( uHaze > 0. && !sky ) { // brume atmosphérique : plus dense en bas, éclairée par le soleil quand on regarde vers lui
    vec3 vd = vec3( ( vUv * 2. - 1. ) * uTanFov, -1. ); float dl = vz * length( vd ); vec3 wd = normalize( uCamRot * vd );
    float hy = max( 0., uCamY + wd.y * dl ), hf = mix( 1., exp( -hy * .03 ), .65 ), sa = pow( max( dot( wd, uSunDirW ), 0. ), 5. );
    lin = mix( lin, mix( uHazeCol, uSunHaze, sa * .75 ), ( 1. - exp( -max( 0., dl - uHazeStart ) * uHaze * hf ) ) ); }
  if ( uHasBloom > .5 ) lin += texture2D( tBloom, vUv ).rgb * uBloomK;
  if ( uShaftK > 0. ) lin += texture2D( tShaft, vUv ).r * uShaftCol * uShaftK;
  vec3 tm = neutral( lin * uExposure * uTint );
  { float lm = dot( tm, vec3( .2126, .7152, .0722 ) ); tm *= mix( vec3( 1. ), mix( vec3( .965, .995, 1.05 ), vec3( 1.045, 1., .94 ), smoothstep( .08, .65, lm ) ), uSplit ); } // ombres froides, lumières chaudes
  float l = dot( tm, vec3( .2126, .7152, .0722 ) ); tm = max( mix( vec3( l ), tm, uSat ), 0. );
  vec3 o = pow( tm, vec3( 1. / 2.2 ) ); o = mix( o, o * o * ( 3. - 2. * o ), uContrast );
  vec2 q = vUv - .5; o *= 1. - uVig * smoothstep( .2, .9, dot( q, q ) * 2.4 );
  o += ( fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) + uTime ) * 43758.5453 ) - .5 ) / 255.;
  gl_FragColor = vec4( o, 1. ); }`;
  function makeRT(w, h, o = {}) { const rt = new THREE.WebGLRenderTarget(w, h, Object.assign({ type: PP.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false }, o)); rt.texture.generateMipmaps = false; return rt; }
  function setupPost(R) {
    try {
      const gl = R.getContext(), w2 = R.capabilities.isWebGL2; PP.hdr = w2 && !!gl.getExtension('EXT_color_buffer_float'); PP.msaa = w2 && PP.hdr;
      qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qScene = new THREE.Scene(); quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; qScene.add(quad);
      KER = []; const r = G.rng(91); for (let i = 0; i < 12; i++) { const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * .85 + .15).normalize(); const s = i / 12; v.multiplyScalar(.15 + .85 * s * s); KER.push(v); }
      mAO = sm(AO_FS, { tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uTanFov: { value: new THREE.Vector2() }, uNear: { value: .1 }, uFar: { value: 900 }, uRadius: { value: .55 }, uPower: { value: 1.6 }, uProj: { value: new THREE.Matrix4() }, uKer: { value: KER } });
      mBlur = sm(BLUR_FS, { tAO: { value: null }, uDir: { value: new THREE.Vector2() } });
      mPre = sm(PRE_FS, { tScene: { value: null }, uTexel: { value: new THREE.Vector2() }, uTh: { value: 1 }, uKnee: { value: .5 } });
      mDown = sm(DOWN_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
      mUp = sm(UP_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uK: { value: 1 } }); mUp.blending = THREE.AdditiveBlending; mUp.transparent = true;
      mShaft = sm(SHAFT_FS, { tDepth: { value: null }, tScene: { value: null }, uSun: { value: new THREE.Vector2() } });
      mDofDown = sm(DOFDOWN_FS, { tScene: { value: null }, uTexel: { value: new THREE.Vector2() } });
      mComp = sm(COMP_FS, { tScene: { value: null }, tDepth: { value: null }, tAO: { value: null }, tBloom: { value: null }, tBlur: { value: null }, uTexel: { value: new THREE.Vector2() }, uHazeCol: { value: new THREE.Vector3() }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uNear: { value: .1 }, uFar: { value: 900 }, uAOk: { value: .7 }, uBloomK: { value: .3 }, uExposure: { value: 1 }, uDof: { value: 1 }, uFocus: { value: 12 }, uFocusR: { value: 6 }, uFarBlur: { value: 90 }, uHaze: { value: 0 }, uHazeStart: { value: 30 },
        uSat: { value: 1.06 }, uVig: { value: .22 }, tShaft: { value: null }, uTanFov: { value: new THREE.Vector2() }, uSunHaze: { value: new THREE.Vector3() }, uSunDirW: { value: new THREE.Vector3() }, uShaftCol: { value: new THREE.Vector3() }, uCamRot: { value: new THREE.Matrix3() }, uCamY: { value: 0 }, uShaftK: { value: 0 }, uSharp: { value: .22 }, uSplit: { value: 1 }, uTime: { value: 0 }, uHasAO: { value: 1 }, uHasBloom: { value: 1 }, uHasDof: { value: 1 }, uContrast: { value: .1 } });
      PP.ok = true;
    } catch (e) { console.warn('post-traitement indisponible', e); PP.ok = false; }
  }
  function ensure(w, h) {
    if (PP.w === w && PP.h === h && rtScene) return; PP.w = w; PP.h = h;
    for (const rt of [rtScene, rtAO, rtAO2, rtD0, rtD1, rtS, ...rtB]) if (rt) rt.dispose(); rtB = [];
    const o = { type: PP.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false };
    rtScene = PP.msaa && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(w, h, o) : new THREE.WebGLRenderTarget(w, h, o); if (rtScene.isWebGLMultisampleRenderTarget) rtScene.samples = 4;
    rtScene.texture.generateMipmaps = false; rtScene.depthTexture = new THREE.DepthTexture(w, h); rtScene.depthTexture.type = THREE.UnsignedIntType;
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1); rtAO = makeRT(hw, hh); rtAO2 = makeRT(hw, hh);
    let bw = hw, bh = hh; for (let i = 0; i < 5; i++) { rtB.push(makeRT(Math.max(1, bw), Math.max(1, bh))); bw >>= 1; bh >>= 1; }
    rtD0 = makeRT(Math.max(1, w >> 2), Math.max(1, h >> 2)); rtD1 = makeRT(Math.max(1, w >> 2), Math.max(1, h >> 2)); rtS = makeRT(Math.max(1, w >> 2), Math.max(1, h >> 2));
  }
  function pass(R, mat, target, clear = true) { quad.material = mat; R.setRenderTarget(target); const ac = R.autoClear; R.autoClear = clear; R.render(qScene, qCam); R.autoClear = ac; }
  PP.use = () => PP.ok && !PP.fail && G.settings && G.settings.post !== false && G.settings.quality !== 'low';
  function composed(R, sc, cam) {
    R.getDrawingBufferSize(V2); const w = V2.x, h = V2.y; ensure(w, h);
    const S = G.settings, m = G.map, inside = !!(m && m.interior), mouse = (G.mouseMode && G.mouseMode()) || !!(G.player && G.player.vehicle && G.player.vehicle.plane2), useAO = S.ao !== false && S.quality !== 'mid', useBloom = S.bloom !== false, useDof = S.dof !== false;
    R.info.autoReset = false; R.info.reset();
    R.setRenderTarget(rtScene); R.render(sc, cam);
    const tanY = Math.tan(cam.fov * PI / 360), tanX = tanY * cam.aspect;
    if (useAO) { const u = mAO.uniforms; u.tDepth.value = rtScene.depthTexture; u.uTexel.value.set(1 / w, 1 / h); u.uTanFov.value.set(tanX, tanY); u.uNear.value = cam.near; u.uFar.value = cam.far; u.uProj.value.copy(cam.projectionMatrix); u.uRadius.value = inside ? .42 : .55; u.uPower.value = inside ? 1.8 : 1.5;
      pass(R, mAO, rtAO); mBlur.uniforms.tAO.value = rtAO.texture; mBlur.uniforms.uDir.value.set(1 / rtAO.width, 0); pass(R, mBlur, rtAO2); mBlur.uniforms.tAO.value = rtAO2.texture; mBlur.uniforms.uDir.value.set(0, 1 / rtAO.height); pass(R, mBlur, rtAO); }
    if (useBloom) { const n = G.night ? G.night() : 0; mPre.uniforms.tScene.value = rtScene.texture; mPre.uniforms.uTexel.value.set(1 / w, 1 / h); mPre.uniforms.uTh.value = inside ? .95 : G.lerp(1.15, .75, n); mPre.uniforms.uKnee.value = .6; pass(R, mPre, rtB[0]);
      for (let i = 1; i < rtB.length; i++) { mDown.uniforms.tSrc.value = rtB[i - 1].texture; mDown.uniforms.uTexel.value.set(1 / rtB[i - 1].width, 1 / rtB[i - 1].height); pass(R, mDown, rtB[i]); }
      for (let i = rtB.length - 2; i >= 0; i--) { mUp.uniforms.tSrc.value = rtB[i + 1].texture; mUp.uniforms.uTexel.value.set(1 / rtB[i + 1].width, 1 / rtB[i + 1].height); mUp.uniforms.uK.value = 1; pass(R, mUp, rtB[i], false); } }
    if (useDof) { mDofDown.uniforms.tScene.value = rtScene.texture; mDofDown.uniforms.uTexel.value.set(1 / w, 1 / h); pass(R, mDofDown, rtD0);
      mDown.uniforms.tSrc.value = rtD0.texture; mDown.uniforms.uTexel.value.set(1.5 / rtD0.width, 1.5 / rtD0.height); pass(R, mDown, rtD1); mDown.uniforms.tSrc.value = rtD1.texture; mDown.uniforms.uTexel.value.set(2.5 / rtD0.width, 2.5 / rtD0.height); pass(R, mDown, rtD0); }
    // ----- composition finale -----
    const u = mComp.uniforms, n = G.night ? G.night() : 0, p = G.player;
    u.tScene.value = rtScene.texture; u.tDepth.value = rtScene.depthTexture; u.tAO.value = rtAO.texture; u.tBloom.value = rtB[0].texture; u.tBlur.value = rtD0.texture; u.uTexel.value.set(1 / w, 1 / h);
    u.uNear.value = cam.near; u.uFar.value = cam.far; u.uHasAO.value = useAO ? 1 : 0; u.uHasBloom.value = useBloom ? 1 : 0; u.uHasDof.value = useDof ? 1 : 0;
    u.uAOk.value = inside ? .85 : .72; u.uBloomK.value = inside ? .2 : G.lerp(.22, .5, n); u.uExposure.value = (inside ? (m.meta.sunny ? .8 : .9) : G.lerp(.82, 1.3, n)) * (PP.expo || 1);
    const vox = S.style === 'cubique'; u.uSat.value = (inside ? 1.05 : 1.07) * (vox ? 1.13 : 1); u.uVig.value = vox ? .27 : .2; u.uTime.value = (u.uTime.value + .618) % 7; u.uContrast.value = vox ? .19 : .1;
    if (vox && !inside) u.uTint.value.set(1.035 - n * .07, 1.0, .955 + n * .1); else u.uTint.value.set(1, 1, 1); // soleil doré le jour, nuits bleutées
    // mise au point : sur le personnage (vue du village) ; seulement le lointain en vue souris
    let focus = 12; if (p) { V3.set(p.x, p.y + 1, p.z).applyMatrix4(cam.matrixWorldInverse); focus = Math.max(1, -V3.z); } PP.focus += (focus - PP.focus) * .2;
    u.uFocus.value = PP.focus; u.uFocusR.value = mouse ? 60 : Math.max(5, PP.focus * .55); u.uFarBlur.value = mouse ? 110 : Math.max(40, PP.focus * 3.2); u.uDof.value = mouse ? .55 : (G.state === 'title' ? .8 : .9);
    // rayons de soleil (vers le soleil, au-dessus de l'horizon, de jour) et brume éclairée
    const sd = SU.uSunDir.value, sCol = SU.uSunCol.value; cam.getWorldDirection(V3); const facing = V3.dot(sd); V3.copy(cam.position).addScaledVector(sd, 600).project(cam);
    const shaftK = (vox ? 1.6 : 1) * (!inside && S.shafts !== false && (S.quality !== 'mid' || vox) && sd.y > -.03 && facing > .05 && Math.abs(V3.x) < 1.8 && Math.abs(V3.y) < 1.8 ? Math.pow(facing, 1.5) * (1 - n) * (.35 + .5 * (1 - Math.min(1, sd.y * 1.6))) : 0);
    if (shaftK > .01) { mShaft.uniforms.tDepth.value = rtScene.depthTexture; mShaft.uniforms.tScene.value = rtScene.texture; mShaft.uniforms.uSun.value.set((V3.x + 1) / 2, (V3.y + 1) / 2); pass(R, mShaft, rtS); }
    u.tShaft.value = rtS.texture; u.uShaftK.value = shaftK; u.uShaftCol.value.set(Math.pow(sCol.r, 2.2), Math.pow(sCol.g, 2.2), Math.pow(sCol.b, 2.2)).multiplyScalar(1.6);
    u.uTanFov.value.set(tanX, tanY); u.uCamRot.value.setFromMatrix4(cam.matrixWorld); u.uCamY.value = cam.position.y; u.uSunDirW.value.copy(sd); u.uSunHaze.value.set(Math.pow(sCol.r, 2.2), Math.pow(sCol.g, 2.2) * .92, Math.pow(sCol.b, 2.2) * .75).multiplyScalar(1.15 * (1 - n * .8));
    u.uSharp.value = S.quality === 'low' ? 0 : .22; u.uSplit.value = inside ? .5 : 1;
    const si = G.skyInfo; if (si && !inside) { C1.copy(si.hor); u.uHazeCol.value.set(Math.pow(C1.r, 2.2), Math.pow(C1.g, 2.2), Math.pow(C1.b, 2.2)).multiplyScalar(.9); u.uHaze.value = mouse ? .0045 : .0022; u.uHazeStart.value = mouse ? 35 : 45; } else u.uHaze.value = 0;
    pass(R, mComp, null);
    R.info.autoReset = true;
  }
  G.renderFrame = () => {
    const R = G.renderer, sc = G.scene, cam = G.camera;
    if (!PP.use()) { R.render(sc, cam); return; }
    try { composed(R, sc, cam); } catch (e) { console.error('post-traitement désactivé', e); PP.fail = true; R.info.autoReset = true; R.setRenderTarget(null); R.render(sc, cam); }
  };

  // ---------- options « Rendu » ----------
  function buildOptions() {
    const scr = G.el('screen-options'), form = scr && scr.querySelector('.form'), back = G.el('o-back'); if (!form || G.el('o-post')) return;
    const row = back.parentNode, d = document.createElement('div');
    d.innerHTML = `<div id="o-rendu" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:6px 0 0;font-family:var(--f-display);color:var(--bark)">✨ Graphismes</h3>
      <div class="opt">Style graphique<select id="o-style"><option value="realiste">Réaliste (textures détaillées)</option><option value="cubique">Cubique (façon Minecraft)</option></select></div>
      <div class="opt">Effets cinéma (HDR, bloom, étalonnage)<input type="checkbox" id="o-post"></div>
      <div class="opt">Occlusion ambiante (ombres de contact)<input type="checkbox" id="o-ao"></div>
      <div class="opt">Profondeur de champ (effet miniature)<input type="checkbox" id="o-dof"></div>
      <div class="opt">Halo des lumières (bloom)<input type="checkbox" id="o-bloom"></div></div>`;
    form.insertBefore(d.firstChild, row);
    const s = G.settings, $ = G.el;
    $('o-style').onchange = () => { s.style = $('o-style').value; G.ui.saveSettings && G.ui.saveSettings(); };
    const sync = () => { $('o-style').value = s.style === 'cubique' ? 'cubique' : 'realiste'; $('o-post').checked = s.post !== false; $('o-ao').checked = s.ao !== false; $('o-dof').checked = s.dof !== false; $('o-bloom').checked = s.bloom !== false; };
    for (const [id, k] of [['o-post', 'post'], ['o-ao', 'ao'], ['o-dof', 'dof'], ['o-bloom', 'bloom']]) $(id).onchange = () => { s[k] = $(id).checked; if (k === 'post') PP.fail = false; G.ui.saveSettings && G.ui.saveSettings(); };
    sync(); const os = G.ui.show; if (os) G.ui.show = id => { if (id === 'screen-options') sync(); return os(id); };
  }
})();
