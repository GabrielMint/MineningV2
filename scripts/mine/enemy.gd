class_name Enemy
extends CharacterBody2D
## Rats (floor 1) and crystal golems (floor 2), scenes/mine/<type>.tscn: wander, chase when
## close, and attack with a telegraph (the attack animation's wind-up) that hits on its hit
## frame, so the player can step away. Kept weak on purpose (GDD: enemies are a small
## inconvenience). Numbers (hp, speed, damage, ranges) live in Balance.ENEMIES[type].

const CHASE_RANGE := 150.0
const ACCEL := 500.0          # px/s²: enemies ease into turns and stops instead of snapping

@export var type := "rat"                ## Balance.ENEMIES key
@export var walk_anim := "walk_left"     ## sprite animations (sprites face left)
@export var idle_anim := "idle_left"
@export var attack_anim := "attack_left" ## played once per attack
@export var hit_frame := 2               ## frame of attack_anim where the blow lands
@export var hit_dust := false            ## puff dust where the blow lands (golem slam)

var mine: Mine
var cfg: Dictionary
var hp: float

@onready var sprite: AnimatedSprite2D = $Sprite

var _wander_dir := Vector2.ZERO
var _wander_t := 0.0
var _attack_cd := 0.0
var _knock := Vector2.ZERO
var _move := Vector2.ZERO     # own movement, eased toward the desired velocity
var _attacking := false


func _ready() -> void:
	add_to_group("hittable")
	cfg = Balance.ENEMIES[type]
	hp = round(float(cfg.hp) * float(Game.level_def().hp_mult))
	sprite.play(idle_anim)
	# Out of step with each other: a pack doesn't breathe in unison.
	sprite.set_frame_and_progress(randi() % sprite.sprite_frames.get_frame_count(idle_anim), randf())
	_wander_t = randf_range(0.2, 1.5)
	sprite.frame_changed.connect(_on_frame_changed)
	sprite.animation_finished.connect(_on_animation_finished)


func _physics_process(delta: float) -> void:
	var p := mine.player
	var to := p.global_position - global_position
	var dir := Vector2.ZERO
	if _attacking:
		pass                       # planted while winding up and striking
	elif not p.dead and to.length() < CHASE_RANGE:
		dir = to.normalized()
	else:
		_wander_t -= delta
		if _wander_t <= 0.0:
			_wander_t = randf_range(0.8, 2.0)
			_wander_dir = Vector2.ZERO if randf() < 0.35 else Vector2.from_angle(randf() * TAU)
		dir = _wander_dir * 0.6

	_move = _move.move_toward(dir * float(cfg.speed), ACCEL * delta)
	velocity = _move + _knock
	_knock = _knock.move_toward(Vector2.ZERO, 650.0 * delta)
	move_and_slide()

	_attack_cd -= delta
	if not _attacking and not p.dead and to.length() < float(cfg.attack_range) and _attack_cd <= 0.0:
		_start_attack(to)
	if _attacking:
		return

	var moving := _move.length() > 6.0
	var anim := walk_anim if moving else idle_anim
	if sprite.animation != anim:
		sprite.play(anim)
	# Steps follow the speed (slow wander vs. chase); knockback doesn't make them run.
	sprite.speed_scale = clampf(_move.length() / float(cfg.speed), 0.55, 1.15) if moving else 1.0
	# Turn only on a clear sideways move, so walking straight up/down doesn't flicker.
	if abs(_move.x) > 12.0:
		sprite.flip_h = _move.x > 0     # sprites face left


func _start_attack(to: Vector2) -> void:
	_attacking = true
	_move = Vector2.ZERO
	if absf(to.x) > 2.0:
		sprite.flip_h = to.x > 0          # face the player (sprites face left)
	sprite.speed_scale = 1.0
	sprite.play(attack_anim)


func _on_frame_changed() -> void:
	if not _attacking or sprite.animation != attack_anim or sprite.frame != hit_frame:
		return
	var p := mine.player
	var to := p.global_position - global_position
	if float(cfg.lunge) > 0.0:
		_knock = to.normalized() * float(cfg.lunge)
	if hit_dust:
		mine.spawn_dust(global_position + Vector2(0, -4))
		mine.shake(2)
	if not p.dead and to.length() < float(cfg.hit_reach):
		p.take_damage(float(cfg.damage))


func _on_animation_finished() -> void:
	if sprite.animation == attack_anim:
		_attacking = false
		_attack_cd = float(cfg.cooldown)
		sprite.play(idle_anim)


func hit_center() -> Vector2:
	return global_position + Vector2(0, -8)


func hit_radius() -> float:
	return float(cfg.radius)


func take_hit(_from: Node, dir: Vector2) -> void:
	hp -= Game.stat_enemy_damage()
	Flash.hit(sprite, 0.06, "w")
	_knock = dir * 270.0
	if hp <= 0.0:
		_die()


func _die() -> void:
	remove_from_group("hittable")
	mine.spawn_pickup("fang", global_position + Vector2(0, -6))
	mine.spawn_dust(hit_center())
	mine.player.heal(Game.stat_heal_on_kill())
	mine.shake(2)
	Game.hitstop(0.04)
	queue_free()
