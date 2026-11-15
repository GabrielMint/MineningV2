class_name BaseArea
extends World
## The base (GDD §4): the entrance of the mine (scenes/base.tscn: the hand-drawn ground painting,
## props, merchant, player, the two Interactables and the HUD are all placed in the scene).
## Walk to the merchant to buy upgrades in the talent tree; walk into the mine entrance to choose
## a level and descend.

@export var talent_tree_scene: PackedScene
@export var level_select_scene: PackedScene

@onready var hud: BaseHud = $Hud
var _menu: CanvasLayer           # open overlay (talent tree / level select), if any


func _ready() -> void:
	super()
	$Entrance.used.connect(_open_level_select)
	$Shop.used.connect(_open_talent_tree)

	# Dev: open a menu right away (screenshots / testing).
	for a in OS.get_cmdline_user_args():
		if a == "--open=tree":
			_open_talent_tree()
		elif a == "--open=levels":
			_open_level_select()


# ---------- Menus ----------

func _open_talent_tree() -> void:
	_open(talent_tree_scene)


func _open_level_select() -> void:
	_open(level_select_scene)


func _open(scene: PackedScene) -> void:
	if _menu:
		return
	_menu = scene.instantiate()
	player.frozen = true
	_menu.connect("closed", _on_menu_closed)
	add_child(_menu)


func _on_menu_closed() -> void:
	_menu = null
	player.frozen = false
	hud.refresh()
