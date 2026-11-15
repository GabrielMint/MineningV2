class_name Flash
extends RefCounted
## Flashes a CanvasItem for a moment. The item needs its own flash material in its scene: a
## ShaderMaterial with shaders/flash.gdshader, "Local to Scene" on so instances don't share it.

## color: a palette key ("y" default, "R" for damage, "S" for metal).
static func hit(item: CanvasItem, duration: float = 0.06, color: String = "y") -> void:
	var mat := item.material as ShaderMaterial
	if mat == null:
		return
	mat.set_shader_parameter("flash_color", Game.PAL[color])
	mat.set_shader_parameter("flash", true)
	await item.get_tree().create_timer(duration, true, false, true).timeout
	if is_instance_valid(item):
		mat.set_shader_parameter("flash", false)
