extends Node
## Global game state (autoload "Game"): bank, upgrades, level, current run, save/load.

const SAVE_PATH := "user://save.json"
const BASE_SCENE := "res://scenes/base.tscn"
const UI_THEME := "res://resources/ui/ui_theme.tres"

## The Endesga 32 palette as Colors, by the same keys as art/src/palette.px.js.
const PAL := {
	"k": Color("#181425"), "K": Color("#262b44"), "n": Color("#3a4466"), "s": Color("#5a6988"),
	"S": Color("#8b9bb4"), "z": Color("#c0cbdc"), "w": Color("#ffffff"),
	"d": Color("#3e2731"), "D": Color("#733e39"), "e": Color("#b86f50"), "E": Color("#e4a672"), "c": Color("#ead4aa"),
	"p": Color("#c28569"), "P": Color("#e8b796"),
	"r": Color("#a22633"), "R": Color("#e43b44"), "x": Color("#ff0044"), "o": Color("#be4a2f"), "O": Color("#d77643"),
	"f": Color("#f77622"), "Y": Color("#feae34"), "y": Color("#fee761"),
	"j": Color("#193c3e"), "h": Color("#265c42"), "g": Color("#3e8948"), "G": Color("#63c74d"),
	"b": Color("#124e89"), "B": Color("#0099db"), "C": Color("#2ce8f5"),
	"v": Color("#68386c"), "V": Color("#b55088"), "q": Color("#f6757a"),
}

var bank := {"iron": 0, "sapphire": 0, "fang": 0}
var bought := {}                         # talent tree node id -> true
var _talent_levels := {}                 # talent -> bought node count (cache of `bought`)
var run_haul := {"iron": 0, "sapphire": 0, "fang": 0}
var current_floor := 0
var current_level := 0
var last_run_message := ""      # shown once by the base HUD toast, then cleared
var last_run_result := ""       # same text, kept (dev bot reads it)

var ui_theme: Theme             # resources/ui/ui_theme.tres, set on the UI scenes' roots
var dev_no_save := false        # set by dev tools so they never touch the real save


func _ready() -> void:
	_setup_input()
	set_hi_res(true)
	# The theme's font is the art-scale build (for the editor); swap in one rasterized at this
	# window's scale. The theme resource is shared, so every UI scene picks it up.
	ui_theme = load(UI_THEME)
	ui_theme.default_font = HandFont.build()
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--level="):          # dev: which level a direct floor scene run uses
			current_level = int(a.substr(8)) - 1
		elif a.begins_with("--give="):           # dev: start with N of every currency (no save)
			dev_no_save = true
			for k in bank:
				bank[k] = int(a.substr(7))
		elif a == "--preset":                    # dev: a few upgrades bought (no save)
			dev_no_save = true
			grant_levels({"ore_damage": 3, "mine_speed": 2, "ore_yield": 1, "gas_resist": 1})
		elif a.begins_with("--nodes="):           # dev: buy the first N tree nodes (no save)
			dev_no_save = true
			for n in Balance.tree().slice(0, int(a.substr(8))):
				bought[n.id] = true
			_recount()
	if "--bot" in OS.get_cmdline_user_args():
		dev_no_save = true
		add_child(load("res://scripts/dev/bot.gd").new())
	elif not dev_no_save:
		load_game()
	_dev_capture()


## The game renders at full window resolution (canvas_items stretch) so the hand-drawn art and
## UI stay sharp; pixel-art scenes (floor 2) still draw crisp with nearest filtering. `false`
## goes back to the project default (480x270 rendered and scaled up). Logical coordinates are
## 480x270 either way.
func set_hi_res(on: bool) -> void:
	get_tree().root.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS if on else Window.CONTENT_SCALE_MODE_VIEWPORT


## Dev tool: `godot --path . [scene] -- --capture=out.png [--capture-delay=2]`
## saves a screenshot of the game and quits (480x270 in the mines, the window size in the
## hi-res base). Does not touch the save file.
func _dev_capture() -> void:
	var path := ""
	var delay := 1.5
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--capture="):
			path = a.substr(10)
		elif a.begins_with("--capture-delay="):
			delay = float(a.substr(16))
	if path == "":
		return
	await get_tree().create_timer(delay).timeout
	var img := get_viewport().get_texture().get_image()
	img.save_png(path)
	print("captured ", img.get_size(), " -> ", path)
	get_tree().quit()


# ---------- Progression ----------

## One level per bought talent node.
func player_level() -> int:
	return 1 + bought.size()


## A talent's level: how many of its nodes are bought (stats below stack per node).
func upgrade_level(talent: String) -> int:
	return int(_talent_levels.get(talent, 0))


func is_bought(id: String) -> bool:
	return bought.has(id)


## A node opens once its parent node is bought (the root is always open).
func is_node_open(id: String) -> bool:
	var parent: String = Balance.tree_node(id).parent
	return parent == "" or bought.has(parent)


func can_buy(id: String) -> bool:
	var n := Balance.tree_node(id)
	return not n.is_empty() and is_node_open(id) and not bought.has(id) and bank[n.currency] >= int(n.cost)


func buy(id: String) -> bool:
	if not can_buy(id):
		return false
	var n := Balance.tree_node(id)
	bank[n.currency] -= int(n.cost)
	bought[id] = true
	_recount()
	save_game()
	return true


func _recount() -> void:
	_talent_levels.clear()
	for id in bought:
		var n := Balance.tree_node(id)
		if not n.is_empty():
			_talent_levels[n.talent] = int(_talent_levels.get(n.talent, 0)) + 1


## Old saves (and dev presets) stored a level per talent: buy that many of its nodes, in order.
func grant_levels(levels: Dictionary) -> void:
	for talent in levels:
		var left := int(levels[talent])
		for n in Balance.tree():
			if left <= 0:
				break
			if n.talent == talent and not bought.has(n.id):
				bought[n.id] = true
				left -= 1
	_recount()


func is_unlocked(floor_idx: int, level_idx: int) -> bool:
	return player_level() >= int(Balance.FLOORS[floor_idx].levels[level_idx].req)


# ---------- Derived stats ----------

func stat_ore_damage() -> float: return 1.0 + upgrade_level("ore_damage")
func stat_swing_cooldown() -> float: return Balance.SWING_COOLDOWN * pow(0.92, upgrade_level("mine_speed"))
func stat_air_drain() -> float: return Balance.AIR_DRAIN * pow(0.9, upgrade_level("gas_resist"))
func stat_yield_mult() -> float: return 1.0 + 0.25 * upgrade_level("ore_yield")
func stat_enemy_damage() -> float: return 1.0 + upgrade_level("enemy_damage")
func stat_damage_taken_mult() -> float: return pow(0.88, upgrade_level("armor"))
func stat_arc_radius() -> float: return Balance.ARC_RADIUS + 6.0 * upgrade_level("arc_radius")
func stat_pick_chance() -> float: return 0.08 * upgrade_level("spinning_picks")
func stat_chain_chance() -> float: return 0.06 * upgrade_level("ore_chain")
func stat_heal_on_kill() -> float: return 3.0 * upgrade_level("heal_on_kill")


# ---------- Runs ----------

func floor_def() -> Dictionary:
	return Balance.FLOORS[current_floor]


func level_def() -> Dictionary:
	return Balance.FLOORS[current_floor].levels[current_level]


func start_run(floor_idx: int, level_idx: int) -> void:
	current_floor = floor_idx
	current_level = level_idx
	run_haul = {"iron": 0, "sapphire": 0, "fang": 0}
	get_tree().change_scene_to_file(Balance.FLOORS[floor_idx].scene)


func add_haul(kind: String, amount: int) -> void:
	run_haul[kind] += amount


func end_run(fainted: bool) -> void:
	var parts := []
	for kind in run_haul:
		var amount: int = run_haul[kind]
		if fainted:
			amount = int(floor(amount * Balance.FAINT_KEEP))
		bank[kind] += amount
		if amount > 0:
			parts.append("%d %s" % [amount, Balance.CURRENCY_NAMES[kind]])
	var got := ", ".join(parts) if parts else "NADA"
	if fainted:
		last_run_message = "VOCE DESMAIOU! PERDEU 70%%. TROUXE: %s" % got
	else:
		last_run_message = "VOLTOU EM SEGURANCA. TROUXE: %s" % got
	last_run_result = last_run_message
	save_game()
	get_tree().change_scene_to_file(BASE_SCENE)


# ---------- Juice helpers ----------

## Brief freeze on impactful hits.
func hitstop(duration: float) -> void:
	Engine.time_scale = 0.05
	await get_tree().create_timer(duration, true, false, true).timeout
	Engine.time_scale = 1.0


# ---------- Save ----------

func save_game() -> void:
	if dev_no_save:
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify({"bank": bank, "nodes": bought.keys()}))


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if data is Dictionary:
		for k in data.get("bank", {}):
			bank[k] = int(data.bank[k])
		for id in data.get("nodes", []):
			if not Balance.tree_node(id).is_empty():
				bought[id] = true
		if data.has("upgrades"):                 # save from before the per-level tree
			grant_levels(data.upgrades)
		_recount()


func reset_save() -> void:
	bank = {"iron": 0, "sapphire": 0, "fang": 0}
	bought = {}
	_recount()
	save_game()


# ---------- Input (WASD + mouse, GDD §8) ----------

func _setup_input() -> void:
	_key_action("move_up", KEY_W)
	_key_action("move_down", KEY_S)
	_key_action("move_left", KEY_A)
	_key_action("move_right", KEY_D)
	_key_action("interact", KEY_E)
	_key_action("ui_close", KEY_ESCAPE)
	if not InputMap.has_action("mine"):
		InputMap.add_action("mine")
		var mb := InputEventMouseButton.new()
		mb.button_index = MOUSE_BUTTON_LEFT
		InputMap.action_add_event("mine", mb)


func _key_action(action: String, key: Key) -> void:
	if InputMap.has_action(action):
		return
	InputMap.add_action(action)
	var ev := InputEventKey.new()
	ev.physical_keycode = key
	InputMap.action_add_event(action, ev)
