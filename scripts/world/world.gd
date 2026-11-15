class_name World
extends Node2D
## Shared base for walkable places (the mine floors and the base). The scene holds the structure:
## Blockers (static colliders), Decor (flat art under everything), Entities (y-sorted; holds the
## Player) and the HUD. This script: camera limits, camera shake, the shadow color HandShadow
## nodes read, colliders and floor tiles for procedural maps.

const TILE := 32

@export var map_size := Vector2i.ZERO        ## in pixels; camera limits
@export var shadow_key := "h"                ## Game.PAL key of cast shadows (HandShadow) here
@export var drains_air := false              ## the toxic gas only exists in the mine

@onready var player: Player = $Entities/Player
@onready var entities: Node2D = $Entities
@onready var decor: Node2D = $Decor
@onready var blockers: Node2D = $Blockers

var _shake := 0.0


## The World a node is placed in (its nearest World ancestor), or null.
static func of(node: Node) -> World:
	while node and not node is World:
		node = node.get_parent()
	return node as World


func _ready() -> void:
	RenderingServer.set_default_clear_color(Game.PAL.k)
	player.set_camera_limits(Rect2i(Vector2i.ZERO, map_size))


func _process(delta: float) -> void:
	if player and player.camera:
		if _shake > 0.0:
			player.camera.offset = Vector2(round(randf_range(-_shake, _shake)), round(randf_range(-_shake, _shake)))
			_shake = max(0.0, _shake - delta * 18.0)
		else:
			player.camera.offset = Vector2.ZERO


func shake(amount: float) -> void:
	_shake = max(_shake, amount)


## Solid rectangle collider under Blockers, for procedural maps (the mine's generated walls).
## Fixed colliders are StaticBody2D nodes in the scene instead.
func add_blocker(rect: Rect2) -> void:
	var body := StaticBody2D.new()
	var shape := CollisionShape2D.new()
	var r := RectangleShape2D.new()
	r.size = rect.size
	shape.shape = r
	body.position = rect.get_center()
	body.add_child(shape)
	blockers.add_child(body)


## Instance a scene (a prop, decal, edge piece...) at `pos` under `parent`.
func place(scene: PackedScene, pos: Vector2, parent: Node) -> Node2D:
	var n := scene.instantiate() as Node2D
	n.position = pos
	parent.add_child(n)
	return n


## Weighted pick of a floor tile from `table` ([[atlas: Vector2i, weight: float], ...]).
## Detail tiles (every entry after the first `plain` ones) never repeat a neighbor in
## `layer` to the left or above, so the same story doesn't show up twice in a row.
func pick_floor(layer: TileMapLayer, cell: Vector2i, table: Array, plain: int, rng: RandomNumberGenerator) -> Vector2i:
	var total := 0.0
	for e in table:
		total += float(e[1])
	var near := [layer.get_cell_atlas_coords(cell + Vector2i.LEFT), layer.get_cell_atlas_coords(cell + Vector2i.UP),
		layer.get_cell_atlas_coords(cell + Vector2i(-1, -1)), layer.get_cell_atlas_coords(cell + Vector2i(1, -1))]
	for attempt in 4:
		var r := rng.randf() * total
		for i in table.size():
			r -= float(table[i][1])
			if r <= 0.0:
				if i < plain or not near.has(table[i][0]):
					return table[i][0]
				break
	return table[0][0]
