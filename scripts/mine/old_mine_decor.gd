extends Node
## Decorator of floor 1, A Antiga Mina (the Decorator node in scenes/mine/floor1.tscn): timber
## supports against the north wall, skeletons, loose rocks, pebbles and cave moss. Mine calls
## `decorate` after generating the room.

@export var support_scene: PackedScene     ## top-left origin, stands against the north wall
@export var skeleton_scene: PackedScene
@export var rock_scene: PackedScene
@export var moss_scene: PackedScene
@export var pebbles_scene: PackedScene


func decorate(mine: Mine) -> void:
	var rng := mine.rng
	var used_x: Array[int] = [mine.spawn_cell.x]
	for i in 30:
		if used_x.size() > 3:
			break
		var x := rng.randi_range(2, Mine.W - 5)
		if mine.grid[1][x] == 0 or mine.grid[2][x] == 1 or mine.grid[2][x + 1] == 1 or mine.grid[2][x + 2] == 1:
			continue
		var too_close := false
		for ux in used_x:
			if abs(x - ux) < 4:
				too_close = true
		if too_close:
			continue
		used_x.append(x)
		mine.place(support_scene, Vector2(x * Mine.TILE - 8, 1 * Mine.TILE + 2), mine.decor)
	for i in 3:
		var c = mine.random_floor_cell(4)
		if c != null:
			mine.occupied[c] = true
			mine.place(skeleton_scene, mine.cell_center(c), mine.decor)
	for i in 10:
		var c = mine.random_floor_cell(2)
		if c != null:
			mine.place(rock_scene, mine.cell_center(c) + Vector2(rng.randi_range(-9, 9), rng.randi_range(-9, 9)), mine.decor)
	# Loose pebbles and cave moss, placed off the grid so the tiles don't read as squares.
	for i in 18:
		var c = mine.random_floor_cell(1)
		if c != null:
			var at: Vector2 = mine.cell_center(c) + Vector2(rng.randi_range(-16, 16), rng.randi_range(-16, 16))
			mine.place(moss_scene if rng.randf() < 0.4 else pebbles_scene, at, mine.decor)
