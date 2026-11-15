extends SceneTree
## Builds the editor resources made from hand-drawn sheets (assets/hand/**/*.json), at art scale
## (1 texel = 1 art unit, the imported SVGs), so scenes can show them in the editor:
##   resources/frames/<sheet>.tres        SpriteFrames (one animation per frame tag)
##   resources/tilesets/<tiles>_hand.tres TileSets of the floor tile sheets (frame i = atlas (i, 0))
##   resources/ui/hand_font.res           the hand-lettered UI font (see HandFont)
## Rerun after rebuilding the art (tools/build_art.ps1 does it):
##   godot --headless --path . --script res://tools/hand_resources.gd
## Animation speeds and loops already set on an existing SpriteFrames are kept, so they can be
## tuned in the editor.

## sheet -> [default fps, loop]
const SHEETS := {
	"characters/miner.json": [8.0, true],
	"characters/merchant.json": [8.0, true],
	"floor1_actors/rat.json": [8.0, true],
	"floor2_actors/golem.json": [8.0, true],
	"floor1_actors/fx_swing.json": [18.0, false],
	"floor1_actors/fx_dust.json": [14.0, false],
}
const TILES := ["floor1/f1_tiles.json", "floor2/f2_tiles.json"]
const TILE_UNITS := 128


func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("res://resources/frames")
	DirAccess.make_dir_recursive_absolute("res://resources/ui")
	for file in SHEETS:
		var path := "res://resources/frames/%s.tres" % file.get_file().get_basename()
		_save(_frames(file, SHEETS[file][0], SHEETS[file][1], path), path)
	for file in TILES:
		_save(_tileset(file), "res://resources/tilesets/%s_hand.tres" % file.get_file().get_basename().trim_suffix("_tiles"))
	_save(HandFont.build(1.0), "res://resources/ui/hand_font.res")
	quit()


func _save(res: Resource, path: String) -> void:
	var err := ResourceSaver.save(res, path)
	print("%s %s" % ["wrote" if err == OK else "FAILED (%d)" % err, path])


func _sheet(file: String) -> Dictionary:
	return JSON.parse_string(FileAccess.get_file_as_string(Hand.DIR + file))


## Tags "<image>_<anim>" become animations "<anim>"; frame durations come from the sheet.
func _frames(file: String, fps: float, loop: bool, path: String) -> SpriteFrames:
	var old: SpriteFrames = null
	if ResourceLoader.exists(path):
		old = ResourceLoader.load(path, "", ResourceLoader.CACHE_MODE_IGNORE)
	var data := _sheet(file)
	var image: String = data.meta.image
	var tex: Texture2D = load(Hand.DIR + file.get_base_dir().path_join(image))
	var prefix := image.get_basename() + "_"
	var regions: Array[AtlasTexture] = []
	var durations: Array[float] = []
	for key in data.frames:
		var f: Dictionary = data.frames[key].frame
		var a := AtlasTexture.new()
		a.atlas = tex
		a.region = Rect2(f.x, f.y, f.w, f.h)
		regions.append(a)
		durations.append(float(data.frames[key].get("duration", 1000.0 / fps)))
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	for tag in data.meta.frameTags:
		var anim: String = tag.name
		if anim.begins_with(prefix):
			anim = anim.substr(prefix.length())
		var speed := fps
		var looped := loop
		if old and old.has_animation(anim):
			speed = old.get_animation_speed(anim)
			looped = old.get_animation_loop(anim)
		sf.add_animation(anim)
		sf.set_animation_speed(anim, speed)
		sf.set_animation_loop(anim, looped)
		for i in range(int(tag.from), int(tag.to) + 1):
			sf.add_frame(anim, regions[i], durations[i] / (1000.0 / speed))
	return sf


## Every frame of the sheet is a tile: frame i -> atlas coords (i, 0), 128-unit cells.
func _tileset(file: String) -> TileSet:
	var data := _sheet(file)
	var frames: Array = data.frames.values()
	var first: Dictionary = frames[0].frame
	var stride := int(frames[1].frame.x) - int(first.x) if frames.size() > 1 else TILE_UNITS
	var src := TileSetAtlasSource.new()
	src.texture = load(Hand.DIR + file.get_base_dir().path_join(data.meta.image))
	src.texture_region_size = Vector2i(TILE_UNITS, TILE_UNITS)
	src.margins = Vector2i(int(first.x), int(first.y))
	src.separation = Vector2i(stride - TILE_UNITS, 0)
	for i in frames.size():
		src.create_tile(Vector2i(i, 0))
	var ts := TileSet.new()
	ts.tile_size = Vector2i(TILE_UNITS, TILE_UNITS)
	ts.add_source(src, 0)
	return ts
