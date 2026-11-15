class_name PickOrbit
extends Node2D
## Talent "picaretas giratorias" (scenes/mine/pick_orbit.tscn, added under the Player): the
## pickaxe sprites in the scene circle the player for a few seconds, hitting whatever they touch.
## The sprites move but are never rotated.

const RADIUS := 40.0
const SPEED := 5.0             # radians per second
const DURATION := 4.0
const TICK := 0.25

var _picks: Array[Node2D] = []
var _angle := 0.0
var _life := DURATION
var _tick := 0.0
var _player: Player


func _ready() -> void:
	_player = get_parent() as Player
	for c in get_children():
		if c is Node2D:
			_picks.append(c)


func _physics_process(delta: float) -> void:
	_life -= delta
	if _life <= 0.0 or _player.dead:
		queue_free()
		return
	_angle += SPEED * delta
	var count := _picks.size()
	for i in count:
		var a := _angle + TAU * i / count
		_picks[i].position = (Vector2(cos(a), sin(a)) * RADIUS).round()
		# Blink out during the last half second (visibility only: palette-safe).
		_picks[i].visible = _life > 0.5 or int(_life * 16.0) % 2 == 0

	_tick -= delta
	if _tick > 0.0:
		return
	_tick = TICK
	for s in _picks:
		for t in get_tree().get_nodes_in_group("hittable"):
			var d: Vector2 = t.hit_center() - s.global_position
			if d.length() <= 10.0 + t.hit_radius():
				t.take_hit(_player, d.normalized())
