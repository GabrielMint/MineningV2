class_name Hand
extends RefCounted
## Hand-drawn art: art/hand/*.hd.js -> assets/hand/<file>/*.svg (tools/hand/hd.js).
## The art is authored in "units" of 1/4 logical pixel (1920x1080 at the default 4x window).
##
## Scenes hold the imported SVGs directly (1 texel = 1 art unit) on nodes scaled by 1/UNIT, with
## offsets in art units, so the editor shows everything at its real size. At runtime the Hand*
## nodes (scripts/hand/) swap in the same art rasterized at exactly the window's scale, so one
## texel is one screen pixel at any window size. Game coordinates stay logical (480x270 view).
## Resources made from sheets (SpriteFrames, TileSets, the font) come from
## tools/hand_resources.gd at art scale and are adapted the same way.

const DIR := "res://assets/hand/"
const UNIT := 4.0                  # art units per logical pixel

static var _cache := {}


## Screen pixels per logical pixel: the integer stretch factor (4 at 1920x1080, 3 at 1440x810).
## In the editor (tool scripts) art shows at its imported scale, i.e. UNIT.
static func factor() -> float:
	if Engine.is_editor_hint():
		return UNIT
	var size := (Engine.get_main_loop() as SceneTree).root.size
	return maxf(1.0, floorf(minf(size.x / 480.0, size.y / 270.0)))


## Texels per art unit.
static func raster() -> float:
	return factor() / UNIT


## Prepare a node placed in a scene with hand art (scale 1/UNIT, offset in art units) for this
## window: rescale it so its texels land 1:1 on screen pixels.
static func adapt_node(item: Node2D) -> void:
	item.scale *= UNIT / factor()
	if "offset" in item:
		item.offset *= raster()


## An SVG under assets/hand/ (path relative to DIR) rasterized at `r` texels per art unit.
static func texture(file: String, r := raster()) -> Texture2D:
	var key := "%s@%s" % [file, r]
	if _cache.has(key):
		return _cache[key]
	var img := Image.new()
	var src := FileAccess.get_file_as_string(DIR + file) if FileAccess.file_exists(DIR + file) else ""
	if src == "" or img.load_svg_from_string(src, r) != OK:
		# No SVG source (an exported build without *.svg in its include filter): scale the import.
		img = (load(DIR + file) as Texture2D).get_image()
		img.resize(maxi(1, roundi(img.get_width() * r)), maxi(1, roundi(img.get_height() * r)), Image.INTERPOLATE_LANCZOS)
	var tex := ImageTexture.create_from_image(img)
	_cache[key] = tex
	return tex


## The window-scale version of a texture placed in a scene. Imported hand SVGs (art scale) are
## re-rasterized; anything else is returned as is.
static func art(tex: Texture2D) -> Texture2D:
	if tex == null or not tex.resource_path.begins_with(DIR) or raster() == 1.0:
		return tex
	return texture(tex.resource_path.trim_prefix(DIR))


## SpriteFrames made at art scale (resources/frames/) -> the same animations on window-scale art.
static func adapt_frames(sf: SpriteFrames) -> SpriteFrames:
	var r := raster()
	if sf == null or r == 1.0:
		return sf
	var key := "%s#%d@%s" % [sf.resource_path, sf.get_instance_id(), r]
	if _cache.has(key):
		return _cache[key]
	var out := SpriteFrames.new()
	out.remove_animation("default")
	for anim in sf.get_animation_names():
		out.add_animation(anim)
		out.set_animation_speed(anim, sf.get_animation_speed(anim))
		out.set_animation_loop(anim, sf.get_animation_loop(anim))
		for i in sf.get_frame_count(anim):
			var t := sf.get_frame_texture(anim, i)
			if t is AtlasTexture:
				var a := AtlasTexture.new()
				a.atlas = art((t as AtlasTexture).atlas)
				var g: Rect2 = (t as AtlasTexture).region
				a.region = Rect2((g.position * r).round(), (g.size * r).round())
				t = a
			else:
				t = art(t)
			out.add_frame(anim, t, sf.get_frame_duration(anim, i))
	_cache[key] = out
	return out


## A hand tile sheet TileSet made at art scale (resources/tilesets/*_hand.tres) -> window scale.
## Only the atlas geometry is rescaled; the tiles keep their atlas coords.
static func adapt_tileset(ts: TileSet) -> TileSet:
	var r := raster()
	if ts == null or r == 1.0:
		return ts
	var key := "%s@%s" % [ts.resource_path, r]
	if _cache.has(key):
		return _cache[key]
	var id := ts.get_source_id(0)
	var src := ts.get_source(id) as TileSetAtlasSource
	var cell := roundi(ts.tile_size.x * r)
	var stride := roundi((src.texture_region_size.x + src.separation.x) * r)
	var out_src := TileSetAtlasSource.new()
	out_src.texture = art(src.texture)
	out_src.texture_region_size = Vector2i(cell, cell)
	out_src.margins = Vector2i((Vector2(src.margins) * r).round())
	out_src.separation = Vector2i(stride - cell, 0)
	for i in src.get_tiles_count():
		out_src.create_tile(src.get_tile_id(i))
	var out := TileSet.new()
	out.tile_size = Vector2i(cell, cell)
	out.add_source(out_src, id)
	_cache[key] = out
	return out
