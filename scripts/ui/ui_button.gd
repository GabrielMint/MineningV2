class_name UiButton
extends Control
## Hand-drawn 9-slice wooden button (scenes/ui/ui_button.tscn: a HandPanel "Body" holding the
## Label) with fast juice (GDD §7: tweens on buttons): it hops on hover, sinks on press, pops on
## success and shakes when refused.

signal pressed

@export var normal_texture: Texture2D
@export var hover_texture: Texture2D
@export var disabled_texture: Texture2D
@export var disabled_text_color := Color(0.752941, 0.796078, 0.862745)   ## palette z

@export var enabled := true:
	set(v):
		enabled = v
		if is_node_ready():
			_refresh()

@onready var label: Label = %Label
@onready var _body: HandPanel = $Body

var _hover := false
var _down := false
var _tween: Tween


func _ready() -> void:
	mouse_entered.connect(_on_enter)
	mouse_exited.connect(_on_exit)
	_refresh()


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_down = true
			_move_to(1)
		elif _down:
			_down = false
			_move_to(-1 if _hover else 0)
			if _hover:
				pressed.emit()
		accept_event()


func _on_enter() -> void:
	_hover = true
	_refresh()
	_move_to(-1.5)


func _on_exit() -> void:
	_hover = false
	_down = false
	_refresh()
	_move_to(0)


func _refresh() -> void:
	_body.texture = disabled_texture if not enabled else (hover_texture if _hover else normal_texture)
	if enabled:
		label.remove_theme_color_override("font_color")
	else:
		label.add_theme_color_override("font_color", disabled_text_color)


func _move_to(y: float, duration: float = 0.06) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_method(_set_offset, _body.position.y, y, duration)


func _set_offset(y: float) -> void:
	_body.position.y = y


## Successful action: quick hop up and settle.
func pop() -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_method(_set_offset, 0.0, -4.0, 0.06).set_ease(Tween.EASE_OUT)
	_tween.tween_method(_set_offset, -4.0, -1.5 if _hover else 0.0, 0.18).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)


## Refused (can't afford / locked): short horizontal shake.
func deny() -> void:
	var tw := create_tween()
	for x in [-2.0, 2.0, -1.0, 1.0, 0.0]:
		tw.tween_callback(_set_x.bind(x))
		tw.tween_interval(0.03)


func _set_x(x: float) -> void:
	_body.position.x = x
