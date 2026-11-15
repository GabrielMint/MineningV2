class_name OreNode
extends StaticBody2D
## A mineable ore node (scenes/mine/ore_<kind>.tscn). Shows crack stages as it loses HP; drops
## ore when broken. HP comes from the floor (Balance.FLOORS ore_hp x level hp_mult).

@export var kind := "iron"                     ## currency it drops (Game.bank key)
@export var stages: Array[Texture2D] = []      ## hand SVGs: intact, cracked, almost broken

var mine: Mine
var cell: Vector2i
var hp: float
var max_hp: float

@onready var sprite: HandSprite = $Sprite

var _jolt: Tween


func _ready() -> void:
	add_to_group("hittable")
	max_hp = round(float(Game.floor_def().ore_hp) * float(Game.level_def().hp_mult))
	hp = max_hp


func hit_center() -> Vector2:
	return global_position + Vector2(0, -18)


func hit_radius() -> float:
	return 20.0


func take_hit(_from: Node, dir: Vector2) -> void:
	hp -= Game.stat_ore_damage()
	Flash.hit(sprite, 0.06, "w")
	# Knocked in the hit direction, springs back past the rest spot, settles (position only).
	if _jolt:
		_jolt.kill()
	_jolt = create_tween()
	_jolt.tween_property(sprite, "position", dir * 2.0, 0.03).set_ease(Tween.EASE_OUT)
	_jolt.tween_property(sprite, "position", -dir * 0.75, 0.06).set_trans(Tween.TRANS_SINE)
	_jolt.tween_property(sprite, "position", Vector2.ZERO, 0.08).set_trans(Tween.TRANS_SINE)
	var ratio := hp / max_hp
	sprite.show_art(stages[0] if ratio > 0.66 else (stages[1] if ratio > 0.33 else stages[2]))
	if hp <= 0:
		_break()


func _break() -> void:
	remove_from_group("hittable")
	var amount := Balance.ORE_DROPS * float(Game.level_def().yield) * Game.stat_yield_mult()
	var n := int(floor(amount)) + (1 if randf() < amount - floor(amount) else 0)
	for i in n:
		mine.spawn_pickup(kind, global_position + Vector2(0, -8))
	mine.free_cell(cell)
	mine.spawn_dust(global_position + Vector2(0, -18))
	if randf() < Game.stat_chain_chance():
		mine.spawn_ore_near(cell)
	mine.shake(2)
	Game.hitstop(0.035)
	queue_free()
