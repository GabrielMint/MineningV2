class_name LevelSelect
extends CanvasLayer
## Opened at the mine entrance (scenes/ui/level_select.tscn): pick an unlocked floor/level and
## descend. One row (floor_row.tscn) per Balance.FLOORS entry, one button per level.

signal closed

@export var row_scene: PackedScene
@export var button_scene: PackedScene


func _ready() -> void:
	for f in Balance.FLOORS.size():
		var row := row_scene.instantiate()
		%Rows.add_child(row)
		row.get_node("Name").text = "ANDAR %d: %s" % [f + 1, Balance.FLOORS[f].name]
		for l in Balance.FLOORS[f].levels.size():
			var b := button_scene.instantiate() as UiButton
			row.get_node("Buttons").add_child(b)
			var open := Game.is_unlocked(f, l)
			b.enabled = open
			b.label.text = "NIVEL %d" % (l + 1) if open else "NV %d" % int(Balance.FLOORS[f].levels[l].req)
			b.pressed.connect(_on_pick.bind(f, l, b))


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_close") or event.is_action_pressed("interact"):
		get_viewport().set_input_as_handled()
		close()


func close() -> void:
	closed.emit()
	queue_free()


func _on_pick(f: int, l: int, b: UiButton) -> void:
	if Game.is_unlocked(f, l):
		Game.start_run(f, l)
	else:
		b.deny()
