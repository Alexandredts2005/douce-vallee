# Douce Vallée — architecture for module authors

A cozy 3D village game (Animal Crossing New Leaf / Hokko Life style) in plain browser JS + three.js **r128**
(loaded from cdnjs as the global `THREE`). Everything lives on the global namespace object `G`.
UI text and dialogue are **in French**. No build step, no ES modules, no npm packages, no external assets
(textures are drawn on canvas, sounds are synthesized with WebAudio). The page is published inside a
sandbox: only scripts from cdnjs are allowed, so NEVER fetch anything at runtime.

Source files (all in `js/`, loaded in this order by `index.html`):
core, audio, data, models1, models2, models3, avatar, buildings, world, worldgen, interiors2, island,
player, actions, features, entities, minigames, ui1, ui2, ui3, ui4, editor, **[new module files go here]**, game.
`game.js` boots the game at load time, so new modules must only *register* things at load time.

Read the relevant source files before coding — this doc is a map, the code is the truth.

## Conventions
- Each module is ONE new file `js/<name>.js`, wrapped in `(function () { 'use strict'; ... })();`.
- Never edit existing files. Integrate only through the hooks/registries below (or by wrapping a `G.*`
  function: `const old = G.x; G.x = (...a) => { ...; return old(...a); }`).
- Must pass `node --check js/<name>.js`. Write compact, readable code like the existing files.
- Performance matters (target 60 fps on a laptop): reuse geometries/materials, no per-frame allocations
  in hot loops, prefer `InstancedMesh`, set `frustumCulled = false` on world meshes (the world is bent in
  the vertex shader so three's culling is wrong).
- Coordinates: tile (tx,tz) covers x∈[tx,tx+1), z∈[tz,tz+1). North = −z. Height of one terrain level:
  `G.TIER = 1.5`. Player is ~1 unit tall. Rotation `r` 0..3 → yaw `r*π/2`, front dir `G.FR[r]`
  (`[[0,1],[1,0],[0,-1],[-1,0]]`, r=0 faces +z/south, toward the default camera).

## Hooks & registries (core.js)
`G.on(event, fn)` registers, game.js emits:
- `init(scene)` once after renderer/scene/lights exist (also `G.lights = {hemi, sun, amb, roomLight, lamps}`).
- `frame(dt)` every frame except in the acre editor (title screen too). `update(dt)` only while playing.
- `enterMap(map)` after the player is placed in a map (world, island, interior, or a module's map).
- `newDay(day)`, `newGame(opts)` (after the world is generated, before the player is placed),
  `save(mods)` (write your state into the `mods` object: `mods.myModule = {...}`), `load(mods)` (read it back).
- `move(player, map)` every frame after the player moved — use for zone triggers (doorways, map exits).
- `worldgen(map, ctx)` at the end of `G.genWorld` (also fires for editor previews: keep it cheap).
- Registries: `G.STRUCT[structName] = ctx => {}` (acre structure builders, see worldgen), `G.npcRoles[role] = v => Promise`
  (NPC dialogue handlers), `G.ROOMKINDS[kind] = {W,H,floor,wall,trim}` (interior defaults),
  `G.ROOMFILL[kind] = (map, P, opt) => {}` (furnish an interior; `P(type,x,z,r,extra)` places if possible),
  `G.ROOMNPC[kind] = [role, x, z]` (NPC standing in that interior).

## Rendering basics
- `G.scene`, `G.camera`, `G.renderer`. Shared uniforms `G.U` (curvature `curve`, `cc` center, `cf` forward,
  cloud shadows `cloudTex/cloudOff/cloudAmt`, particle scale `pscale`).
- `G.curveMat(material, {cloud, outline})` patches any three material so it follows the "rolling log"
  world bend (ALWAYS use it for world-space meshes). `G.toon(params, opts)` = curved MeshToonMaterial using
  the 3-step gradient `G.TEX.toon`.
- Shared materials `G.M.*` (std, glow, trans, fire, ground, cliff, water, fall, ghost, shadow, cursor,
  outline, outlineI, wing, hurt, xray, cloud, window). `G.MATS = [std, glow, trans, fire]` is the material array
  used by merged models (geometry groups pick the index: 0 normal, 1 glows at night, 2 transparent, 3 always-bright fire).
- Model builder (models1.js): `const b = G.mb(seed)`; `b.box(w,h,d,col,x,y,z,rx,ry,rz,mat)`,
  `b.cyl(rt,rb,h,seg,col,x,y,z,rx,ry,rz,mat,smooth)`, `b.cone(r,h,seg,col,x,y,z,rx,ry,rz,mat)`,
  `b.sph(r,col,x,y,z,sx,sy,sz,mat,ws,hs,smooth)`, `b.ico(r,detail,col,x,y,z,sx,sy,sz,mat,ry)`,
  `b.tor(r,t,col,x,y,z,rx,ry,rz,mat,seg)`, `b.add(geometry,col,b.M(x,y,z,rx,ry,rz,sx,sy,sz),mat,smooth)`,
  `b.jit(amount)` per-face color jitter, `b.done()` → merged BufferGeometry (vertex colors + groups).
  `G.prism(b, W, H, L, col, x, y, z, ry, mat)` (roofs), `G.windowAt(b, x, y, z, ry, w, h)`.
- Register models as `G.MODELS[name] = v => geometry`; fetch with `G.getGeo(name, v)` (cached). Origin =
  footprint center at ground level, front facing +z.
- Particles: `G.fx.burst(x,y,z,n,colors[],speed,life,gravity,size)`, `G.fx.puff(x,y,z,n,color,size)`,
  `G.fx.one(x,y,z,vx,vy,vz,life,grav,color,size,grow)`. Floating text `G.popup(text,x,y,z,cls)`.
- Sky/time: `G.clock = {min (0..1440), day}`, `G.night()` 0..1, `G.skyInfo = {h, n, inside, top, hor, light, day}`
  updated each frame.

## Maps (world.js) — class `G.GMap(W, H, {interior, kind, id})`
Arrays `lvl` (Int8 level), `surf` (surface id, see `G.SURF` in data.js: 0 grass, 1 forest grass, 2 dirt, 3 stone path,
4 cobble, 5 sand, 6 wood floor, 8 snow, 11 white slabs, 14 flowery grass…), `water` (0, 1 fresh, 2 sea), `ramp`.
Methods: `idx(x,z)`, `inb`, `topAt(x,z)` walkable height incl. solid objects, `terrainH`, `isWaterAt(x,z)`,
`isWaterT(tx,tz)`, `waterSurf(tx,tz)`, `objAt(tx,tz)`, `canPlace(type,tx,tz,r)`, `addObj(type,tx,tz,r,extra)` → o,
`removeObj(o)`, `refresh(o)` (after changing o.v/o.f/o.off), `setAnim(o, matrix4|null)`, `center(o)` → [x,z],
`markDirty(tx,tz)` + `flush()`/`buildAll()` (rebuild terrain meshes), `list` (Set of objects), `lights`, `meta`
(free-form; world meta has `plaza, home, shop, tent, pier, gare, mairie, spawn, layout, homes[], npcs[]`), `group` (THREE.Group),
`serialize()` / `G.GMap.deserialize(d)`. Objects are rendered with one `InstancedMesh` per model+variant.
Object types: `G.OBJ[id] = {id, n (French name), model, v, fp:[w,d], h (collision height), walk, sit, light, fire,
enter (interior kind), take, pick, chop, mine, storage, wardrobe, …}`. Inventory items: `G.ITEMS[id] = {id, n, kind
('tool'|'place'|'res'|'food'|'fish'|'bug'|'fossil'|'surf'|'terra'|'misc'), ico (emoji), sell, obj, cat, thumb}`.
For a placeable item use `kind:'place', obj:id, cat:'mobilier'|'construction'|'nature'|'fleurs', thumb:'obj:'+id`.
Shop prices: `G.buyPrice(id)`.

Current maps: `G.world` (village, 120×110 tiles, generated by `G.genWorld(layout, seed)` from 7×6 acres of 16×16,
border `G.BORDER=4` tiles of cliffs/forest on N/E/W, sea at the south), `G.island` (G.genIsland, island.js),
interiors in `G.interiors[id]` (created by `G.makeInterior(kind, id, opt)` in interiors2.js — opt: `{W, H, noMat, empty,
stage, wallPat, floorPat}`; `G.buildShell(map)` draws textured walls/floor/windows from `map.meta.shell {kind, wall, floor}`).
`G.map` is the current map. Switch with `G.enterMap(map, x, z, yaw)` (adds `map.group` to the scene if needed); wrap it in
`G.ui.fade(callback, holdSeconds)` for a black fade. Entering buildings: `G.act.enterHouse(o)` (uses `o.iid` and `OBJ.enter`),
leaving: walking onto the bottom doormat calls `G.act.exitHouse()` (returns to `map.meta.door` on G.world or G.island).

## World generation (worldgen.js)
`G.ACRES[id] = {n, col, ico, lvl, struct?, water?, beach?...}`; default layout `G.DEFAULT_LAYOUT` (rows top→bottom):
row0 montagne,foret,riviere_h,**gare**,colline,foret,montagne / row1 foret,plateau,cascade,**mairie**,verger,colline,foret /
row2 plaine,maison,riviere,**place,place**,plaine,etang / rows3-4 villages, camping… / row5 beaches incl. ponton (pier).
For every acre with `struct` that has `G.STRUCT[struct]`, worldgen calls it INSTEAD of the builtin code, with
`ctx = {map, ox, oz, ax, az, layout, put(type,x,z,r,extra), flat(x0,z0,w,d,L), targets, meta, I(x,z), surf, lvl, water, ramp,
r (seeded rng), A (16), B (4), W, H, seaZ, setPlaza([x,z])}`. `ox,oz` = acre top-left tile. `flat` levels and clears an area,
`put` places an object if possible, push `[tx,tz,surfId]` to `targets` to get an A* road from the plaza to that tile.
Paved tiles (path surfaces) stay free of trees. Structures run after terrain/rivers and before roads/decoration.

## Player & actions
`G.player` (player.js): `x,y,z,yaw,vx,vz,onGround,swim,vehicle,vault,sit,emote,show,look`, `teleport(x,z,yaw)`, `facing()`,
`target()` → [tx,tz], `blocked(x,z,feet)`, `unstick(force)`, `setLook(look)`, `root` (THREE.Group), `C` (rig with
`body, head, armL, armR, hand, legL, legR, setExpr(name)`). Swimming rule: `G.canSwim(map, x, z)` (default true) and
`G.noSwimMsg(map,x,z)` → message when falling into forbidden water (player is splashed back to the bank).
Vehicles: if `player.vehicle` is set, player.js calls `G.feat.updVehicle(player, dt)` (features.js montgolfière) instead of normal movement.
Look (avatar.js): `G.defaultLook()`, `G.normLook(l)`, `G.LOOKS` option lists, `G.makeChar({look})` for the player,
`G.makeChar({sp, col, shirt, apron, eyes, mouth})` for animals (sp ∈ lapin, chat, ours, canard, blaireau, mouton, hibou,
singe, grenouille, tortue, renard, chien). Top style `'maillot'` = swimsuit.
Inventory: `G.inv.add(id,n)`, `remove`, `count`, `held()`; coins `G.coins` (call `G.ui.dirtyHud()` after changing);
`G.act.give(id, n, x, y, z)` adds + shows a popup. Mode `G.mode` 'creatif' | 'survie'. Flags `G.flags` (saved).

## NPCs (entities.js)
`G.NPCS[role] = {n, sp, col, shirt, apron, pitch, eyes, mouth}`; put `{role, x, z, yaw}` into `map.meta.npcs` and call
`G.ents.spawnVillagers(map)` (worldgen-created maps get this automatically for G.world; interiors created by
`G.makeInterior` spawn their `G.ROOMNPC` NPC automatically). Talking (E key) to an NPC with role R calls `G.npcRoles[R](v)`
if registered. Use `G.npcSay(v, lines[], choices[])` → Promise<choiceIndex|-1> (typewriter dialog with animalese voice).
`G.ents.addNPC(role, map, x, z, yaw)`, `G.ents.removeNPCs(map)`, `G.ents.villagers` (all characters).

## UI helpers
`G.ui.toast(msg)`, `G.ui.dialog(name, lines, {pitch, color, choices})` → Promise, `G.ui.fade(cb, hold)`,
`G.ui.openShop(v, {list:[itemIds], title, quote, noSell})`, `G.ui.openWardrobe({sections:['visage','cheveux','haut','bas',
'chapeau','acc'], title, okLabel, onDone(look)})`, `G.ui.openStorage()`, `G.ui.openDex()`, `G.ui.open(kind, title)` +
`#panel-body/#panel-foot/#panel-tabs` for custom panels, `G.ui.closePanel()`, `G.ui.canPlay()`.
Sounds: `G.sfx(name, vol)` (names in audio.js: pickup, coin, craft, fanfare, splash, door, pop, swing, chop, thud, ...),
`G.audio.blip(char, pitch)` animalese, `G.audio.ctx/musG/sfxG/ambG` WebAudio nodes (exist after the first user gesture; check `G.audio.ok`).

## Testing
`node --check` must pass. In a browser the page exposes `G._step(dt)` to advance one frame synchronously.
