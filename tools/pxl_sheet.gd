class_name PxlSheet
extends RefCounted
## Builds SpriteFrames from a pxl/Aseprite-style sheet JSON (TexturePacker hash + meta.frameTags).
## Each frame tag becomes one animation. Tags prefixed with the sheet name are shortened:
## in miner.json, "miner_walk_down" becomes "walk_down".
##
##   $AnimatedSprite2D.sprite_frames = PxlSheet.load_frames("res://assets/characters/miner.json")
##   swing.sprite_frames = PxlSheet.load_frames("res://assets/fx/fx_swing.json", 18.0, false)


static func load_frames(json_path: String, fps: float = 8.0, loop: bool = true) -> SpriteFrames:
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(json_path))
	assert(data != null, "PxlSheet: could not parse %s" % json_path)

	var image_name: String = data.meta.image
	var texture: Texture2D = load(json_path.get_base_dir().path_join(image_name))
	var prefix := image_name.get_basename() + "_"

	var regions: Array[AtlasTexture] = []
	var durations: Array[float] = []
	for key in data.frames:
		var f: Dictionary = data.frames[key]
		var atlas := AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(f.frame.x, f.frame.y, f.frame.w, f.frame.h)
		regions.append(atlas)
		durations.append(f.get("duration", 1000.0 / fps))

	var tags: Array = data.meta.get("frameTags", [])
	if tags.is_empty():
		tags = [{"name": "default", "from": 0, "to": regions.size() - 1}]

	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for tag in tags:
		var anim: String = tag.name
		if anim.begins_with(prefix):
			anim = anim.substr(prefix.length())
		frames.add_animation(anim)
		frames.set_animation_loop(anim, loop)
		frames.set_animation_speed(anim, fps)
		for i in range(int(tag.from), int(tag.to) + 1):
			# Relative duration: 1.0 = one frame at `fps`; per-frame ms from the JSON is preserved.
			frames.add_frame(anim, regions[i], durations[i] / (1000.0 / fps))
	return frames
