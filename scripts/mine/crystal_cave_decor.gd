extends Node
## Decorator of floor 2, Caverna de Cristal (the Decorator node in scenes/mine/floor2.tscn):
## standing crystal clusters (solid, y-sorted), loose rocks, shards and glittering dust. Mine
## calls `decorate` after generating the room.

@export var cluster_scene: PackedScene     ## bottom-center origin, has its own collider
@export var rock_scene: PackedScene
@export var glow_scene: PackedScene
@export var shards_scene: PackedScene


func decorate(mine: Mine) -> void:
	var rng := mine.rng
	for i in 5:
		var c = mine.random_floor_cell(4)
		if c == null:
			continue
		mine.occupied[c] = true
		mine.place(cluster_scene, mine.cell_center(c) + Vector2(rng.randi_range(-6, 6), 10), mine.entities)
	for i in 8:
		var c = mine.random_floor_cell(2)
		if c != null:
			mine.place(rock_scene, mine.cell_center(c) + Vector2(rng.randi_range(-9, 9), rng.randi_range(-9, 9)), mine.decor)
	for i in 18:
		var c = mine.random_floor_cell(1)
		if c != null:
			var at: Vector2 = mine.cell_center(c) + Vector2(rng.randi_range(-16, 16), rng.randi_range(-16, 16))
			mine.place(glow_scene if rng.randf() < 0.4 else shards_scene, at, mine.decor)
