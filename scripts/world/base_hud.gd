class_name BaseHud
extends CanvasLayer
## Base HUD (scenes/ui/base_hud.tscn): bank + player level, the hint, and a toast with the last
## run's result that slides in from the top and leaves after a while.

@onready var _bank: BankPanel = %BankPanel
@onready var _toast: Control = %Toast


func _ready() -> void:
	_toast.visible = false
	if Game.last_run_message != "":
		_show_toast(Game.last_run_message)
		Game.last_run_message = ""
	refresh()


func refresh() -> void:
	_bank.refresh()


func _show_toast(text: String) -> void:
	%ToastLabel.text = text
	_toast.visible = true
	var hidden_y := _toast.position.y
	var tw := create_tween()
	tw.tween_property(_toast, "position:y", 60.0, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(4.0)
	tw.tween_property(_toast, "position:y", hidden_y, 0.2)
