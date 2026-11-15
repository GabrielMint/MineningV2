@tool
class_name HandPanel
extends MarginContainer
## A hand-drawn 9-slice panel (ui_panel, ui_panel_dark, ui_button...) that lays out its children
## like any MarginContainer, so a box around a Label grows with its text. The patch is drawn at
## texel scale: the imported SVG in the editor, the art rasterized at the window's scale at
## runtime (one texel = one screen pixel). Set the margins in the theme overrides.

## Imported hand SVG under assets/hand/ui/.
@export var texture: Texture2D:
	set(v):
		texture = v
		_tex = null
		queue_redraw()
## Size of the unstretched border, in art units (4 units = 1 logical px).
@export var patch_margin := 40.0:
	set(v):
		patch_margin = v
		queue_redraw()

var _tex: Texture2D


func _draw() -> void:
	if texture == null:
		return
	if _tex == null:
		_tex = texture if Engine.is_editor_hint() else Hand.art(texture)
	var f := Hand.UNIT if Engine.is_editor_hint() else Hand.factor()
	var m := roundf(patch_margin * f / Hand.UNIT)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE / f)
	RenderingServer.canvas_item_add_nine_patch(get_canvas_item(), Rect2(Vector2.ZERO, size * f), Rect2(),
		_tex.get_rid(), Vector2(m, m), Vector2(m, m),
		RenderingServer.NINE_PATCH_STRETCH, RenderingServer.NINE_PATCH_STRETCH, true)
	draw_set_transform(Vector2.ZERO)
