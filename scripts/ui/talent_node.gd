class_name TalentNode
extends Control
## One node of the talent tree = one level of a talent (scenes/ui/talent_node.tscn): hand-drawn
## medallion by state with the talent's icon. The tree instances one per Balance.tree() entry.

signal hovered(node: TalentNode)
signal unhovered(node: TalentNode)
signal clicked(node: TalentNode)

const SIZE := 28.0               # logical px (112 art units)

@export var frames := {}          ## frame state (locked, open, ready, max, hover) -> hand SVG
@export var icons := {}           ## talent id -> hand SVG icon

var id: String
var talent: String
var state := "open"               # locked | open | ready | max (bought)
var _hover := false
var _tween: Tween

@onready var _body: Control = $Body
@onready var _frame: HandTextureRect = $Body/Frame
@onready var _icon: HandTextureRect = $Body/Icon


func _ready() -> void:
	_icon.show_art(icons[talent])
	mouse_entered.connect(_on_enter)
	mouse_exited.connect(_on_exit)


func set_state(s: String) -> void:
	state = s
	_icon.visible = s != "locked"
	_refresh_frame()


func _refresh_frame() -> void:
	var frame_name := "hover" if _hover and state in ["open", "ready"] else state
	_frame.show_art(frames[frame_name])


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		accept_event()
		clicked.emit(self)


func _on_enter() -> void:
	_hover = true
	_refresh_frame()
	_hop(-2.0)
	hovered.emit(self)


func _on_exit() -> void:
	_hover = false
	_refresh_frame()
	_hop(0.0)
	unhovered.emit(self)


func _hop(y: float, duration := 0.06) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_body, "position:y", y, duration)


## Bought: flash, jump and settle.
func pop() -> void:
	Flash.hit(_frame, 0.08, "w")
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_body, "position:y", -8.0, 0.07).set_ease(Tween.EASE_OUT)
	_tween.tween_property(_body, "position:y", -2.0 if _hover else 0.0, 0.24).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)


## Refused: short horizontal shake.
func deny() -> void:
	var tw := create_tween()
	for x in [-2.0, 2.0, -1.0, 1.0, 0.0]:
		tw.tween_callback(func(): _body.position.x = x)
		tw.tween_interval(0.03)


## Newly revealed: drop in from above.
func reveal() -> void:
	_body.position.y = -14.0
	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_body, "position:y", 0.0, 0.3).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
