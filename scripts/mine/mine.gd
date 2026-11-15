class_name Mine
extends World
## One mine level. The scene (scenes/mine/mine.tscn, inherited by one scene per floor) holds the
## structure: the Ground tile layer, Decor with the exit ladder, Entities with the Player, the
## Exit spot and the HUD. This script generates the room procedurally: the wall layout, floor
## tiles, rocky edges, ores and enemies, each placed piece instanced from a scene. A floor scene
## adds its own decor through a "Decorator" child node with a `decorate(mine)` method
## (old_mine_decor.gd, crystal_cave_decor.gd).

const W := 30
const H := 20
## Floor tile weights per hand tile sheet (Balance.FLOORS "tiles"): [atlas, weight], the 3 plain
## tiles first. Every sheet: frames 0-12 floors, 13 wall top, 14-16 wall faces (plain + 2 variants).
const FLOORS := {
	# art/hand/floor1.hd.js, sheet f1_tiles: frame i = atlas (i, 0).
	"f1": [
		[Vector2i(0, 0), 24], [Vector2i(1, 0), 24], [Vector2i(2, 0), 16],   # quiet dirt
		[Vector2i(3, 0), 5], [Vector2i(4, 0), 2], [Vector2i(5, 0), 6],       # crack, puddle, gravel
		[Vector2i(6, 0), 3], [Vector2i(7, 0), 3], [Vector2i(8, 0), 2],       # slab, prints, plank
		[Vector2i(9, 0), 2], [Vector2i(10, 0), 3], [Vector2i(11, 0), 3],     # mushrooms, root, coal
		[Vector2i(12, 0), 1],                                                # bone
	],
	# art/hand/floor2.hd.js, sheet f2_tiles.
	"f2": [
		[Vector2i(0, 0), 24], [Vector2i(1, 0), 24], [Vector2i(2, 0), 16],   # quiet stone
		[Vector2i(3, 0), 5], [Vector2i(4, 0), 3], [Vector2i(5, 0), 5],       # seam, shard, cracked
		[Vector2i(6, 0), 6], [Vector2i(7, 0), 3], [Vector2i(8, 0), 4],       # gravel, sprouts, dust
		[Vector2i(9, 0), 2], [Vector2i(10, 0), 3], [Vector2i(11, 0), 1],     # pool, fissure, geode
		[Vector2i(12, 0), 3],                                                # crust
	],
}
const WALL_TOP := Vector2i(13, 0)
const FACES := [Vector2i(14, 0), Vector2i(15, 0), Vector2i(16, 0)]

@export var floor_index := 0              ## Balance.FLOORS entry this scene plays
@export var ore_scene: PackedScene
@export var enemy_scene: PackedScene
@export var pickup_scene: PackedScene
@export var dust_scene: PackedScene        ## one-shot puff when an ore breaks
@export var edge_left: PackedScene         ## rocky rims where floor meets wall (top-left origin)
@export var edge_right: PackedScene
@export var edge_bottom: PackedScene

var grid: Array = []            # grid[y][x]: 0 floor, 1 wall
var occupied := {}              # Vector2i -> true (ores, decor that blocks spawns)
var ore_cells := {}             # Vector2i -> true (cells holding an ore node)
var spawn_cell := Vector2i.ZERO # the player's cell in the scene; pillars keep away from it
var rng := RandomNumberGenerator.new()
var exit_spot: Vector2          # where to stand to use the exit ladder (E); the ExitSpot marker

@onready var ground: TileMapLayer = $Ground
@onready var hud: Hud = $Hud

var _ending := false


func _enter_tree() -> void:
	# Before any child is ready: the HUD and actors read the floor/level definition.
	Game.current_floor = floor_index
	map_size = Vector2i(W * TILE, H * TILE)


func _ready() -> void:
	super()
	rng.randomize()
	spawn_cell = world_to_cell(player.position)
	exit_spot = $ExitSpot.global_position
	$Exit.used.connect(return_to_base)
	hud.player = player

	_generate()
	_paint_tiles()
	_edges()
	occupied[Vector2i(spawn_cell.x, 2)] = true     # the ladder's foot
	var decorator := get_node_or_null("Decorator")
	if decorator:
		decorator.decorate(self)

	var lvl := Game.level_def()
	for i in int(lvl.ores):
		var c = random_ore_cell(4)
		if c != null:
			spawn_ore(c)
	for i in int(lvl.enemies):
		var c = random_floor_cell(9)
		if c != null:
			spawn_enemy(c)


func return_to_base() -> void:
	if _ending or player.dead:
		return
	_ending = true
	Game.end_run(false)


# ---------- Generation ----------

func _generate() -> void:
	grid.clear()
	for y in H:
		var row := []
		for x in W:
			row.append(1 if (x == 0 or x == W - 1 or y < 2 or y == H - 1) else 0)
		grid.append(row)
	# Rock pillars, kept away from the spawn area.
	for i in rng.randi_range(6, 10):
		var w := rng.randi_range(2, 4)
		var h := rng.randi_range(2, 3)
		var x := rng.randi_range(3, W - 3 - w)
		var y := rng.randi_range(5, H - 3 - h)
		if Rect2i(x - 3, y - 3, w + 6, h + 6).has_point(spawn_cell):
			continue
		for yy in range(y, y + h):
			for xx in range(x, x + w):
				grid[yy][xx] = 1


## Tiles from the floor's sheet; walls blocked by merged rectangles (the hand TileSet has no
## collision).
func _paint_tiles() -> void:
	var table: Array = FLOORS[Game.floor_def().tiles]
	for y in H:
		var run_start := -1
		for x in W + 1:
			var wall: bool = x < W and grid[y][x] == 1
			if x < W:
				var atlas: Vector2i
				if wall:
					var face: bool = y + 1 < H and grid[y + 1][x] == 0
					var r := rng.randf()
					atlas = (FACES[1] if r < 0.12 else (FACES[2] if r < 0.22 else FACES[0])) if face else WALL_TOP
				else:
					atlas = pick_floor(ground, Vector2i(x, y), table, 3, rng)
				ground.set_cell(Vector2i(x, y), 0, atlas)
			if wall and run_start < 0:
				run_start = x
			elif not wall and run_start >= 0:
				add_blocker(Rect2(run_start * TILE, y * TILE, (x - run_start) * TILE, TILE))
				run_start = -1


func _edges() -> void:
	for y in range(1, H - 1):
		for x in range(1, W - 1):
			if grid[y][x] == 1:
				continue
			var p := Vector2(x * TILE, y * TILE)
			if grid[y][x - 1] == 1:
				place(edge_left, p, decor)
			if grid[y][x + 1] == 1:
				place(edge_right, p + Vector2(TILE - 8, 0), decor)
			if grid[y + 1][x] == 1:
				place(edge_bottom, p + Vector2(0, TILE - 8), decor)


# ---------- Helpers ----------

func cell_center(c: Vector2i) -> Vector2:
	return Vector2(c.x * TILE + TILE / 2, c.y * TILE + TILE / 2)


func world_to_cell(p: Vector2) -> Vector2i:
	return Vector2i(int(p.x) / TILE, int(p.y) / TILE)


func is_free_floor(c: Vector2i) -> bool:
	return c.x > 0 and c.y > 1 and c.x < W - 1 and c.y < H - 1 and grid[c.y][c.x] == 0 and not occupied.has(c)


## Random free floor cell at least `min_dist` cells from the spawn, or null.
func random_floor_cell(min_dist: int):
	for i in 300:
		var c := Vector2i(rng.randi_range(1, W - 2), rng.randi_range(2, H - 2))
		if is_free_floor(c) and c.distance_to(spawn_cell) >= min_dist:
			return c
	return null


## Ore nodes are wider than a cell (44 px), so they never touch another node's 8 neighbors.
func ore_fits(c: Vector2i) -> bool:
	if not is_free_floor(c):
		return false
	for dy in range(-1, 2):
		for dx in range(-1, 2):
			if ore_cells.has(c + Vector2i(dx, dy)):
				return false
	return true


## Like random_floor_cell, for an ore node (see ore_fits).
func random_ore_cell(min_dist: int):
	for i in 300:
		var c := Vector2i(rng.randi_range(1, W - 2), rng.randi_range(2, H - 2))
		if ore_fits(c) and c.distance_to(spawn_cell) >= min_dist:
			return c
	return null


func spawn_ore(c: Vector2i) -> void:
	var ore := ore_scene.instantiate() as OreNode
	ore.mine = self
	ore.cell = c
	ore.position = cell_center(c) + Vector2(0, 10)
	occupied[c] = true
	ore_cells[c] = true
	entities.add_child(ore)


## Upgrade "veio rico": a broken node may spawn a fresh one nearby.
func spawn_ore_near(c: Vector2i) -> void:
	var dirs := [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1), Vector2i(1, 1), Vector2i(-1, -1), Vector2i(1, -1), Vector2i(-1, 1)]
	dirs.shuffle()
	for d in dirs:
		var n: Vector2i = c + d
		if ore_fits(n) and n.distance_to(world_to_cell(player.global_position)) > 1:
			spawn_ore(n)
			return


func free_cell(c: Vector2i) -> void:
	occupied.erase(c)
	ore_cells.erase(c)


func spawn_enemy(c: Vector2i) -> void:
	var e := enemy_scene.instantiate() as Enemy
	e.mine = self
	e.position = cell_center(c)
	entities.add_child(e)


func spawn_pickup(kind: String, at: Vector2) -> void:
	var p := pickup_scene.instantiate() as Pickup
	p.mine = self
	p.kind = kind
	p.position = at
	entities.add_child(p)


## One-shot dust puff (ore breaking).
func spawn_dust(at: Vector2) -> void:
	place(dust_scene, at.round(), self)
