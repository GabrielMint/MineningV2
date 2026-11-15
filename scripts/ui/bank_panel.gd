class_name BankPanel
extends Control
## The parchment panel at the top-left showing the player level and the bank
## (scenes/ui/bank_panel.tscn; used by the base HUD and the talent tree).

@onready var _level: Label = %Level
@onready var _amounts := {"iron": %IronAmount, "sapphire": %SapphireAmount, "fang": %FangAmount}


func _ready() -> void:
	refresh()


func refresh() -> void:
	_level.text = "NIVEL %d" % Game.player_level()
	for kind in _amounts:
		_amounts[kind].text = str(Game.bank[kind])
