class_name Player
extends CharacterBody2D
## The miner (scenes/player/player.tscn): free WASD movement (sprite shows 4 directions),
## mouse-aimed arc swing, air (toxic gas) as the run timer in the mine.

const DIRS8 := ["e", "se", "s", "sw", "w", "nw", "n", "ne"]
## Sprite view for each of DIRS8 (the sheet faces left; the right-facing ones are flipped).
const VIEWS8 := ["left", "downleft", "down", "downleft", "left", "upleft", "up", "upleft"]
const FLIP8 := [true, true, false, false, false, false, false, true]
const FACING_STICK := 8.0      # degrees past a sector's edge before the facing changes

@export var swing_scene: PackedScene          ## one-shot arc effect, animations swing_<dir8>
@export var pick_orbit_scene: PackedScene     ## talent "picaretas giratorias"

var world: World
var air := Balance.MAX_AIR
var dead := false
var frozen := false            # true while a menu is open
var aim_override = null        # dev bot: aim here instead of at the mouse

@onready var sprite: AnimatedSprite2D = $Sprite
@onready var camera: Camera2D = $Camera

var _facing := 2               # index into DIRS8 (starts facing down)
var _cooldown := 0.0
var _invuln := 0.0
var _picks: Node2D
var _strike := 0.0             # seconds left of the strike pose (body reacts to a swing)
var _lunge: Tween


func _ready() -> void:
	world = World.of(self)


func set_camera_limits(r: Rect2i) -> void:
	camera.limit_left = r.position.x
	camera.limit_top = r.position.y
	camera.limit_right = r.end.x
	camera.limit_bottom = r.end.y


func _physics_process(delta: float) -> void:
	if dead:
		return
	var input := Vector2.ZERO
	if not frozen:
		# Free movement: any direction, analog-friendly. The sprite shows 8 directions.
		input = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	# Ease in and out of movement instead of snapping to full speed.
	var rate := Balance.MOVE_ACCEL if input != Vector2.ZERO else Balance.MOVE_DECEL
	velocity = velocity.move_toward(input * Balance.MOVE_SPEED, rate * delta)
	move_and_slide()

	if world.drains_air:
		air -= Game.stat_air_drain() * delta
		if air <= 0.0:
			_faint()
			return

	_cooldown -= delta
	_strike -= delta
	if not frozen and Input.is_action_pressed("mine") and _cooldown <= 0.0:
		_swing()

	if _invuln > 0.0:
		_invuln -= delta
		sprite.visible = int(_invuln * 12.0) % 2 == 0 or _invuln <= 0.0

	# The miner always faces the mouse (the aim); walking plays the walk cycle in that direction.
	if not frozen:
		var look := _aim_target() - center()
		if look.length() > 4.0:
			_facing = _facing_from(look, _facing)
	_animate(velocity.length() > 10.0)


## Where the player aims: the mouse, or the dev bot's target.
func _aim_target() -> Vector2:
	return aim_override if aim_override != null else get_global_mouse_position()


## 8-way facing (DIRS8 index) for v. With `current`, keeps it until v is clearly past the
## sector's edge (hysteresis), so aiming along a boundary doesn't flicker between two views.
func _facing_from(v: Vector2, current := -1) -> int:
	var sector := PI / 4.0
	if current >= 0 and absf(angle_difference(current * sector, v.angle())) <= sector / 2.0 + deg_to_rad(FACING_STICK):
		return current
	return posmod(int(round(v.angle() / sector)), 8)


func _animate(moving: bool) -> void:
	var dir: String = VIEWS8[_facing]
	sprite.flip_h = FLIP8[_facing]
	if _strike > 0.0:
		var strike := "strike_" + dir
		if sprite.animation != strike:
			sprite.play(strike)   # turning mid-strike: same pose, other direction
		sprite.speed_scale = 1.0
		return
	var anim := ("walk_" if moving else "idle_") + dir
	if sprite.animation != anim:
		var was_walking := String(sprite.animation).begins_with("walk_")
		var f := sprite.frame
		var p := sprite.frame_progress
		sprite.play(anim)
		# Turning while walking keeps the step cycle going instead of restarting it.
		if moving and was_walking:
			sprite.set_frame_and_progress(f, p)
	# Steps follow the actual speed (easing in/out, slowed by walls).
	sprite.speed_scale = clampf(velocity.length() / Balance.MOVE_SPEED, 0.5, 1.2) if moving else 1.0


func center() -> Vector2:
	return global_position + Vector2(0, -13)


# ---------- Mining (GDD §4: arc in front of the player, aimed at the mouse) ----------

func _swing() -> void:
	_cooldown = Game.stat_swing_cooldown()
	var origin := center()
	var aim := _aim_target() - origin
	if aim == Vector2.ZERO:
		aim = Vector2.DOWN
	var ang := aim.angle()
	_facing = _facing_from(aim)
	_strike = _strike_length()
	_lean(aim.normalized())

	# Pre-drawn arc in the nearest of 8 directions (never rotated at runtime).
	# Same direction as the body's strike pose (_facing).
	var fx := world.place(swing_scene, origin.round(), world) as AnimatedSprite2D
	fx.play("swing_" + DIRS8[_facing])

	var reach := Game.stat_arc_radius()
	var half := deg_to_rad(Balance.ARC_HALF_ANGLE)
	var hit_any := false
	for t in get_tree().get_nodes_in_group("hittable"):
		var d: Vector2 = t.hit_center() - origin
		if d.length() <= reach + t.hit_radius() and abs(angle_difference(ang, d.angle())) <= half:
			t.take_hit(self, d.normalized())
			hit_any = true
	if hit_any:
		world.shake(1)

	if world.drains_air and _picks == null and randf() < Game.stat_pick_chance():
		_picks = pick_orbit_scene.instantiate()
		_picks.tree_exited.connect(_on_picks_gone)
		add_child(_picks)


## Length of the strike pose (one play of strike_<dir>), capped by the swing cooldown.
func _strike_length() -> float:
	var sf := sprite.sprite_frames
	var t := 0.0
	if sf and sf.has_animation("strike_down"):
		for i in sf.get_frame_count("strike_down"):
			t += sf.get_frame_duration("strike_down", i) / sf.get_animation_speed("strike_down")
	return minf(t, _cooldown * 0.9)


## The body leans into the swing and settles back (position only, never scale).
func _lean(dir: Vector2) -> void:
	if _lunge:
		_lunge.kill()
	sprite.position = Vector2.ZERO
	_lunge = create_tween()
	_lunge.tween_property(sprite, "position", dir * Balance.STRIKE_LUNGE, 0.05).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_lunge.tween_property(sprite, "position", Vector2.ZERO, 0.14).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)


func _on_picks_gone() -> void:
	_picks = null


# ---------- Air / damage ----------

func take_damage(amount: float) -> void:
	if _invuln > 0.0 or dead:
		return
	air -= amount * Game.stat_damage_taken_mult()
	_invuln = 0.7
	Flash.hit(sprite, 0.08, "R")
	world.shake(3)
	Game.hitstop(0.05)
	if air <= 0.0:
		_faint()


func heal(amount: float) -> void:
	air = min(Balance.MAX_AIR, air + amount)


func _faint() -> void:
	if dead:
		return
	dead = true
	air = 0.0
	sprite.visible = true
	sprite.play("idle_down")
	sprite.stop()
	world.shake(4)
	await get_tree().create_timer(1.0).timeout
	Game.end_run(true)
