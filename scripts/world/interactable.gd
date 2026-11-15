class_name Interactable
extends Area2D
## A spot the player can use with E (scenes/common/interactable.tscn: merchant, mine entrance,
## exit ladder). Size its Shape and place its Prompt per instance (editable children). Shows the
## bobbing key prompt while the player stands inside.

signal used

var world: World
var _inside := false
var _prompt_y := 0.0
var _t := 0.0

@onready var _prompt: Node2D = $Prompt


func _ready() -> void:
	world = World.of(self)
	_prompt_y = _prompt.position.y
	_prompt.visible = false
	body_entered.connect(_on_enter)
	body_exited.connect(_on_exit)


func _on_enter(body: Node2D) -> void:
	if body is Player:
		_inside = true
		_prompt.visible = true


func _on_exit(body: Node2D) -> void:
	if body is Player:
		_inside = false
		_prompt.visible = false


func _process(delta: float) -> void:
	if _prompt.visible:
		_t += delta
		_prompt.position.y = _prompt_y - (1.0 if int(_t * 2.5) % 2 == 0 else 0.0)


func _unhandled_input(event: InputEvent) -> void:
	if _inside and not world.player.frozen and event.is_action_pressed("interact"):
		get_viewport().set_input_as_handled()
		used.emit()
