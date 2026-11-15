# Minening

Top-down pixel-art mining game, Godot 4.7 (GDScript). The user writes in Portuguese or English; answer in the language they used.

**The design source of truth is [docs/GDD.md](docs/GDD.md)** (Portuguese), including the direction revisions in §7. Read it before designing mechanics or art. The prototype covers the base (mine entrance) and mine floors 1 (Old Mine) and 2 (Crystal Cave).

## Scenes for structure, code for behaviour (hard rule)

The user tweaks things by hand in the Godot editor, so everything must be visible and editable there.

- **Structure lives in scenes (`.tscn`), never in code.** Every game object — player, enemies, ores, pickups, props, maps/rooms, the base, HUD, menus, panels, buttons, the talent tree — is a scene whose node tree defines it: a `Sprite2D`/`AnimatedSprite2D` for the sprite, an `AnimationPlayer` for animations, `CollisionShape2D`, `Area2D`, `Timer`, `Control` layouts, child scenes for sub-parts, etc. Set node properties (positions, sizes, textures, layouts, theme overrides) in the scene, not in `_ready()`.
- **Code is only behaviour**: input and movement, actions and attacks, AI, what happens in a map, what an item does to the player or an enemy, state changes, signals, game rules. Scripts reach their nodes with `@onready var x = $Path` / `%UniqueName` and tunables with `@export`; they do not `.new()` + `add_child()` the object's own parts.
- **Only exception: procedural or data-driven content.** Code may decide *where/how many* things appear (e.g. `mine.gd` placing randomized ore nodes, enemies, decor and floor tiles; the talent tree placing one node per `Balance.tree()` entry; the level select making one row per `Balance.FLOORS` floor). It still instances a prebuilt scene (an `@export var x_scene: PackedScene` set in the scene, then `instantiate()`) or paints a `TileMapLayer` from a `.tres` TileSet — it never assembles the object's node tree itself. The only nodes still made with `.new()` are the mine's generated wall colliders (`World.add_blocker`). Runtime-only things that cannot exist in the editor (e.g. textures rasterized by `Hand` at the window scale) are assigned in code to nodes that already exist in the scene.
- Scene-specific choices (which ore, enemy, decor, textures, colors, which scene to open) are `@export`s set in the scene, not paths or constants in code. Numbers that tune the game (HP, speeds, costs) stay in `Balance`.
- Signal wiring and state changes (texts, visibility, tweens) are behaviour and may be in code.

## Art pipeline

```
art/src/*.px.js  --(pxl)-->  assets/<file>/  --(Godot import)-->  game
	   ^                          |
	   |                  hand edits in Aseprite (art/aseprite/*.aseprite)
	   +-- PixelLab / references (art/reference/) feed in via pxl `trace` or image()
```

- **Read `art/STYLE_GUIDE.md` before making any art.** Enter the Gungeon-like look (reference images in `references/`), sizes, palette, light direction and tag names live there.
- Art is written with the **pxl** skill (`pxl-pixel-art`). PXL = `& "C:\Program Files\nodejs\node.exe" "C:\Users\Gabriel Mint\.claude\skills\pxl-pixel-art\bin\pxl.js"`.
- Every art file starts with `include("palette.px.js")`. **Only the Endesga 32 colors are allowed**: no hex colors in art files, no `glow()` color mode, no `lighting()` (they create new colors). Sprites use the hard outline `outline: "k"` (tiles have none).
- No runtime scaling/rotation of sprites in Godot (mixels). Pre-draw rotations; tween position instead of scale.
- No `modulate` tints on art, alpha fades, CanvasModulate or Light2D (off-palette colors). Hit flashes use a palette-swap shader. Exception: pure-white masks (font, `shadow_*`) colored with an exact palette color. See "Effects in Godot" in the style guide.
- **Scale: 32px.** Tiles and the player are 32×32, viewport 480×270 (see the style guide for every size). Shared drawing helpers (`ground`, `boulder`, `oreRock`, `post`, `beam`, `pebble`) live in `art/src/_lib.px.js`; include it after the palette.
- Art files: `characters` (miner, rat, merchant), `base` (base tiles, mine entrance, stall, props), `floor1`, `floor2` (tiles, ore + crack stages, drops, props, golem), `fx` (8-direction swing, dust), `items` (fang, spinning pick, shadow masks), `ui` (panels, buttons, air bar, talent node frames, upgrade icons `icon_<id>`). Style tests start with `_`.

### Hand-drawn art (the whole game)
The base, the UI, the talent tree and both mine floors are **hand-drawn vector art written as code**, not pixel art. Files: `art/hand/base.hd.js` (ground painting, props, shadow masks), `characters.hd.js` (miner + merchant sheets), `ui.hd.js` (panels, buttons, air bar, currency icons, key prompt, the hand-lettered `font` sheet), `talents.hd.js` (tree backdrop, node frames, `tt_icon_<talent>`), `floor1.hd.js` (`f1_tiles` sheet, edge pieces, props, decals), `floor1_actors.hd.js` (ore stages, drops, rat sheet, swing/dust FX and orbiting pick shared by every floor), `floor2.hd.js` (`f2_tiles`, edges, crystal clusters, decals), `floor2_actors.hd.js` (sapphire ore stages, sapphire drop, golem sheet). Each floor's scene (`scenes/mine/floor<n>.tscn`) picks its art; every hand tile sheet uses frames 0-12 floors, 13 wall top, 14-16 wall faces, with weights in `mine.gd` `FLOORS["<tiles>"]`. Characters and enemies are animated through `art/hand/_rig.hd.js` (`rig(d)`: a transform stack so body parts move, rotate and squash like Spine bones, baked into frames; motion principles referenced from Cult of the Lamb): miner frames 192×176 (idle/walk/strike in 5 views, pickaxe carried and swung), rat 192×80 and golem 240×220 (idle/walk/attack). Enemy attacks hit on the scene's `hit_frame`; one-shot animations have `loop` off in their `.tres`. They are built with the shared **HandDrawn** tool (`HD = & "C:\Program Files\nodejs\node.exe" "C:\Users\Gabriel Mint\Documents\Projects\Tools\HandDrawn\bin\hd.js"`; its README documents the API and the shape kit, `art/hand/_lib.hd.js` only includes the palette) → SVG. The pixel rules above (Endesga-only output, no scaling) apply to the mines; the base uses Endesga keys but anti-aliased edges. See "Base: hand-drawn, by code" in the style guide. The `hand-artist` agent (user-level) makes and iterates these assets.
- Preview: `HD build art/hand/<file>.hd.js --out art/out/hand/<file> --png 1 --preview 2`, then look at `art/out/hand/<file>/_preview/<name>.png`.
- `tools/build_art.ps1` exports `art/hand/*.hd.js` to `assets/hand/<file>/` too, then reimports and reruns `tools/hand_resources.gd`; `build_art.ps1 base -Hand` exports only the hand-drawn base (both art folders have a `base` file).
- **Hand art in scenes.** Scenes use the imported SVGs directly (1 texel = 1 art unit): nodes scaled `0.25` (1/`Hand.UNIT`), offsets in art units, `texture_filter` Linear on the scene root. At runtime the `scripts/hand/` node scripts swap in the same art rasterized at the window's exact scale (`Hand`, `scripts/world/hand.gd`), so it stays sharp at any window size. Use them for every hand-art node:
  - `HandSprite` (Sprite2D; `show_art(tex)` to change texture), `HandShadow` (shadow mask colored by its World's `shadow_key`), `HandAnimatedSprite` (AnimatedSprite2D), `OneShotFx` (plays once and frees itself), `HandTileLayer` (TileMapLayer), `HandTextureRect` (UI image; size in logical px), `HandPanel` (`@tool` MarginContainer that draws a 9-slice and sizes to its children; `patch_margin` in art units).
  - Sheets become editor resources through `tools/hand_resources.gd` (`godot --headless --path . --script res://tools/hand_resources.gd`): `resources/frames/<sheet>.tres` (SpriteFrames; speeds and loops edited there are kept on rebuild), `resources/tilesets/<f1|f2>_hand.tres`, and `resources/ui/hand_font.res`, the font of `resources/ui/ui_theme.tres`. Rerun it when a sheet changes.
- The whole game runs in `canvas_items` stretch at full resolution (`Game.set_hi_res(true)` at startup); logical coordinates stay 480×270. Screenshots come out at the window size.
- UI scenes set `resources/ui/ui_theme.tres` on their root; `Game` replaces its font at startup with `HandFont` built at the window's scale. Labels take palette colors as theme overrides in the scene.
- No longer used by the game: the pixel art in `art/src/` (base, characters, UI, floors, FX), the pixel tilesets and `PxlSheet`. The pixel code paths are gone; a new floor needs hand art.

### Iterating (previews stay out of Godot)
```
PXL build art/src/<file>.px.js --out art/out/<file> --only <name>
```
Look at `art/out/<file>/_preview/<name>.png`, use `PXL ascii` for exact pixels, run `PXL lint` before calling a sprite done.
`art/` has a `.gdignore`, so nothing in it is imported by Godot.

### Exporting to Godot
```
powershell -File tools/build_art.ps1 [<file>]
```
Writes `assets/<file>/` (PNG sprites, sheets + JSON) without previews. **Never edit `assets/` by hand** — it is regenerated. After adding new PNGs, run a headless `--import` before running scenes (scripts that preload unimported PNGs fail).

### Hand edits in Aseprite
When a sprite needs manual work, it "graduates":
1. Open the PNG from `assets/` in Aseprite and save it as `art/aseprite/<name>.aseprite`.
2. Remove (or rename with a leading `_`) the pxl version so the build no longer overwrites it.
3. Export from Aseprite into `assets/aseprite/<name>.png` (+ JSON with tags for animations, "Hash" format).

### Using sheets in Godot
Hand sheets become `resources/frames/*.tres` (see above): each frame tag becomes an animation, with the sheet-name prefix stripped (`miner_walk_down` → `walk_down`). Right-facing = left animation with `flip_h = true`. (`tools/pxl_sheet.gd`, `PxlSheet.load_frames`, does the same for pxl/Aseprite JSON; unused by the game now.)

The mine's TileSets are `resources/tilesets/f1_hand.tres` and `f2_hand.tres` (generated; 128-unit cells, frame i = atlas (i, 0), no collision: `Mine` adds merged wall colliders). Floor weights live in `mine.gd` `FLOORS`, placed by `World.pick_floor` (detail tiles never repeat a neighbor). The old pixel TileSets (`b_`, `f1_`, `f2_tileset.tres`) are unused. Keep the sheet order in the art files stable.

## Code layout (prototype)
- `scripts/autoload/game.gd` — autoload `Game`: bank, talent tree purchases (`bought`, `is_node_open`, `can_buy`, `buy`), player level, run haul, save (`user://save.json`), palette `Game.PAL` (Endesga keys), UI theme with the hand font, input actions (WASD, mouse, E interact, Esc close). A run ends only by pressing E at the exit ladder by the spawn (`Mine.exit_spot`, an `Interactable`) or by fainting. The miner always faces the mouse.
- `scripts/data/balance.gd` — **every tunable number**: talents (`TALENTS`) and the talent tree (`TREE_CHAINS`: one node per talent level, chains grown from a parent node by angle/bend; node ids `<talent>_<n>`; costs on a curve by depth, `COST_BASE`), floors/levels (each floor's `scene`, unlock level, ore/enemy counts, multipliers), enemy numbers, player stats. `Game.bought` holds bought node ids; a talent's level = its bought nodes; player level = 1 + nodes bought. Old saves (`upgrades` levels) migrate through `Game.grant_levels`.
- `scripts/world/` — `world.gd` (shared base for walkable places: `World.of(node)`, camera limits, shake, `shadow_key`, `place`, procedural blockers), `base_area.gd` (opens the menus), `hand.gd` (adapts hand art to the window scale), `base_hud.gd`, `interactable.gd` (E-to-use areas).
- `scripts/mine/` — `mine.gd` (room generation, spawns), `old_mine_decor.gd` / `crystal_cave_decor.gd` (a floor's `Decorator` node), `player.gd` (free movement, 4-direction sprite, aimed swing, air), `ore_node.gd`, `enemy.gd`, `pickup.gd`, `pick_orbit.gd`, `hud.gd`.
- `scripts/ui/` — `talent_tree.gd` + `talent_node.gd` + `talent_links.gd` + `talent_tooltip.gd` (node tree, pan, wheel zoom, tooltip), `bank_panel.gd` (level + bank panel), `level_select.gd`, `ui_button.gd`, `hand_font.gd` (hand-lettered font, uppercase; accents fold).
- `scripts/hand/` — the hand-art node scripts (see "Hand art in scenes").
- `scripts/fx/flash.gd` + `shaders/flash.gdshader` — palette-safe hit flash; the flashing node needs a local-to-scene flash `ShaderMaterial` in its scene.
- Scenes (structure; see the hard rule):
  - `scenes/base.tscn` (main scene: ground, blockers, props, merchant, player, Entrance/Shop interactables, HUD), `scenes/base/` (`merchant.tscn`, `props/*.tscn`).
  - `scenes/player/player.tscn`; `scenes/common/interactable.tscn` (instances size their Shape and move their Prompt via editable children); `scenes/fx/` (`swing`, `dust`).
  - `scenes/mine/mine.tscn` (abstract room: Ground, Blockers, Decor with the ladder, Entities with the Player, Exit + ExitSpot, Hud) inherited by `floor1.tscn` / `floor2.tscn` (floor index, shadow color, ore/enemy/edge scenes, TileSet, `Decorator`); actors `ore_iron`, `ore_sapphire`, `rat`, `golem`, `pickup`, `pick_orbit`; `decor/*.tscn`.
  - `scenes/ui/` — `hud`, `base_hud`, `bank_panel`, `level_select` + `floor_row` + `ui_button`, `talent_tree` + `talent_node` + `talent_tooltip`.

## Dev tools (never touch the real save)
- Bot run: `<godot_console> --headless --path . res://scenes/mine/floor1.tscn -- --bot [--bot-time=15] [--bot-faint] [--level=1]` (`floor2.tscn` for floor 2) — plays a run, prints haul/air, walks back to the exit ladder and presses E (or faints), prints the result.
- Screenshot: `<godot> --path . [scene] -- --capture=out.png [--capture-delay=2]`. Combine with `--bot` (action shots), `--give=N` (N of each currency), `--preset` (some talent levels bought), `--nodes=N` (the first N tree nodes bought), `--open=tree|levels` (open a base menu), `--tree-zoom=0.4` (talent tree zoomed out). Saves the frame (window size) and quits. The bot walks straight at targets, so it can get stuck behind pillars — rerun if a run collects nothing.
- Godot 4.7.2 is at `C:\Users\Gabriel Mint\Downloads\Godot\Godot_v4.7.2-stable_win64[_console].exe`.

## Godot settings already applied
Viewport 480×270 (GDD revision), window 1920×1080 (×4), stretch `viewport` + integer scale, nearest texture filter, 2D pixel snap. Don't change these without asking. (The base switches to `canvas_items` stretch at runtime; see "Hand-drawn base art".)

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the project root, created when needed. See `docs/agents/domain.md`.
