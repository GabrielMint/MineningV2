extends Node
## Dev bot: plays a mine run by itself to smoke-test the gameplay loop.
##   godot --headless --path . res://scenes/mine/floor1.tscn -- --bot [--bot-time=15] [--bot-faint]
## (floor2.tscn for the second floor; --level=N picks the level).
## Never saves. Prints progress, returns to base (or faints), prints the result and quits.

var _t := 0.0
var _log_t := 0.0
var _run_time := 15.0
var _faint := false
var _done := false
var _at_exit := 0                # physics frames spent standing at the exit ladder


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--bot-time="):
			_run_time = float(a.substr(11))
		elif a == "--bot-faint":
			_faint = true


func _physics_process(delta: float) -> void:
	var scene := get_tree().current_scene
	if scene is Mine:
		_drive(scene as Mine, delta)
	elif scene != null and scene.name == "Base" and _done:
		print("BOT result: ", Game.last_run_result)
		print("BOT bank: ", Game.bank, "  level: ", Game.player_level())
		get_tree().quit()


func _drive(mine: Mine, delta: float) -> void:
	var p := mine.player
	if p == null or p.dead or _done:
		return
	_t += delta
	_log_t += delta
	if _faint:
		p.air -= 40.0 * delta          # drain fast to test the faint path

	var best: Node2D = null
	var best_d := INF
	for t in get_tree().get_nodes_in_group("hittable"):
		var d: float = (t.hit_center() - p.center()).length()
		if d < best_d:
			best_d = d
			best = t
	if best and _t < _run_time:
		var to: Vector2 = best.hit_center() - p.center()
		if to.length() > 26.0:
			p.global_position += to.normalized() * min(260.0 * delta, to.length() - 22.0)
		p.aim_override = best.hit_center()
		Input.action_press("mine")

	if _log_t >= 3.0:
		_log_t = 0.0
		var ores := 0
		var enemies := 0
		for t in get_tree().get_nodes_in_group("hittable"):
			if t is OreNode:
				ores += 1
			elif t is Enemy:
				enemies += 1
		print("BOT t=%.0f air=%.0f haul=%s ores_left=%d enemies_left=%d dist=%.0f pos=%s" % [_t, p.air, Game.run_haul, ores, enemies, best_d, p.global_position.round()])

	if _t >= _run_time and not _faint:
		_leave(mine, p, delta)
	elif _faint and p.air <= 0.0:
		_done = true
		Input.action_release("mine")


## Time's up: walk back to the exit ladder and press E there, like a player would.
func _leave(mine: Mine, p: Player, delta: float) -> void:
	Input.action_release("mine")
	var to := mine.exit_spot - p.global_position
	if to.length() > 2.0:
		p.global_position += to.normalized() * min(260.0 * delta, to.length())
		return
	_at_exit += 1
	if _at_exit == 3:                      # let the exit area notice the player first
		var ev := InputEventAction.new()
		ev.action = "interact"
		ev.pressed = true
		Input.parse_input_event(ev)
		_done = true
