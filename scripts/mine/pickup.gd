class_name Pickup
extends Node2D
## Ore/fang drop (scenes/mine/pickup.tscn): pops out in an arc, then gets pulled into the player.

const MAGNET_RANGE := 80.0

@export var icons := {}          ## kind -> hand SVG of the dropped item

var mine: Mine
var kind := "iron"
var _ready_to_collect := false
var _magnet := false
var _speed := 30.0
var _start: Vector2
var _target: Vector2


func _ready() -> void:
	($Sprite as HandSprite).show_art(icons[kind])
	_start = position
	_target = _start + Vector2(randf_range(-30, 30), randf_range(-8, 22))
	var tw := create_tween()
	tw.tween_method(_pop_step, 0.0, 1.0, randf_range(0.3, 0.42))
	# A small second bounce where it lands, so it doesn't stop dead.
	tw.tween_property(self, "position:y", _target.y - 5.0, 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "position:y", _target.y, 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.tween_callback(_on_landed)


func _pop_step(t: float) -> void:
	position = _start.lerp(_target, t) + Vector2(0, -22.0 * sin(PI * t))


func _on_landed() -> void:
	_ready_to_collect = true


func _process(delta: float) -> void:
	if not _ready_to_collect or mine.player == null or mine.player.dead:
		return
	var to := mine.player.center() - global_position
	if _magnet or to.length() < MAGNET_RANGE:
		_magnet = true
		_speed += 800.0 * delta
		position += to.normalized() * min(_speed * delta, to.length())
		if to.length() < 9.0:
			Game.add_haul(kind, 1)
			mine.hud.bump(kind)
			queue_free()
