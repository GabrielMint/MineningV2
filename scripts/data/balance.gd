class_name Balance
extends RefCounted
## All tunable numbers for the prototype live here.

## Talents (GDD §9). Each level of a talent is its own node in the merchant's talent tree;
## a talent's level is how many of its nodes are bought, and its effect stacks per node.
const TALENTS := {
	"ore_damage": {"name": "PICARETA AFIADA", "desc": "+1 DANO EM MINERIOS", "currency": "iron"},
	"mine_speed": {"name": "BRACOS FORTES", "desc": "GOLPES 8% MAIS RAPIDOS", "currency": "iron"},
	"arc_radius": {"name": "CABO LONGO", "desc": "+6 DE ALCANCE", "currency": "iron"},
	"spinning_picks": {"name": "PICARETAS GIRATORIAS", "desc": "+8% CHANCE POR GOLPE", "currency": "sapphire"},
	"ore_yield": {"name": "SACOLA MAIOR", "desc": "+25% MINERIO POR NO", "currency": "iron"},
	"ore_chain": {"name": "VEIO RICO", "desc": "+6% CHANCE DE NOVO NO", "currency": "sapphire"},
	"gas_resist": {"name": "MASCARA DE PANO", "desc": "-10% PERDA DE AR", "currency": "iron"},
	"armor": {"name": "COURO GROSSO", "desc": "-12% DANO RECEBIDO", "currency": "fang"},
	"enemy_damage": {"name": "GOLPE PESADO", "desc": "+1 DANO EM INIMIGOS", "currency": "fang"},
	"heal_on_kill": {"name": "FOLEGO", "desc": "+3 AR POR INIMIGO", "currency": "fang"},
}

## The tree, as chains of nodes. [talent, nodes, parent node id ("" = the root), angle, bend]:
## a chain grows from its parent in direction `angle` (degrees, 0 = right, 90 = down), turning
## `bend` degrees per node. Node ids are "<talent>_<n>", n counting on across a talent's chains.
## Regions: mining up, wealth right, survival left, combat down.
const TREE_CHAINS := [
	["ore_damage", 6, "", -90, 0],
	["ore_yield", 6, "ore_damage_1", 0, 3],
	["gas_resist", 6, "ore_damage_1", 180, 4],
	["enemy_damage", 5, "ore_damage_1", 90, 0],
	# mining
	["mine_speed", 6, "ore_damage_3", -150, 7],
	["arc_radius", 5, "mine_speed_6", -100, 9],
	["ore_damage", 7, "ore_damage_6", -90, -3],
	["mine_speed", 6, "ore_damage_10", -25, -7],
	["arc_radius", 5, "ore_damage_13", -135, 6],
	["spinning_picks", 5, "arc_radius_5", -175, 8],
	["spinning_picks", 5, "arc_radius_10", -150, -8],
	["ore_damage", 7, "mine_speed_12", -70, 8],
	# wealth
	["ore_chain", 5, "ore_yield_4", -75, 8],
	["ore_yield", 6, "ore_yield_6", 25, -6],
	["ore_chain", 5, "ore_yield_10", -70, 10],
	# survival
	["armor", 5, "gas_resist_3", 135, -7],
	["gas_resist", 6, "gas_resist_6", 200, 7],
	["armor", 5, "gas_resist_10", 160, -6],
	# combat
	["heal_on_kill", 5, "enemy_damage_3", 20, -8],
	["enemy_damage", 5, "enemy_damage_5", 105, -6],
	["heal_on_kill", 5, "enemy_damage_8", 145, 7],
]
const NODE_SPACING := 36.0

## Curved costs: a node's price grows with its depth d on the path from the root, where nodes
## paid in the same currency count 1 and the others OTHER_WEIGHT:
## cost = base * (1 + 0.3 d)^2 * 1.04^d. Cheap first steps, a steady climb in the middle, a
## steep late game (iron: d 1 = 11, d 10 = 142, d 20 = 644, deepest ~820; sapphire 7..75;
## fang 2..55). Players gain one level per node, which also gates the mine floors.
const COST_BASE := {"iron": 6.0, "sapphire": 3.0, "fang": 1.5}
const OTHER_WEIGHT := 0.35

static var _nodes: Array[Dictionary] = []
static var _by_id := {}


## Every tree node: {id, talent, index, parent, pos, depth, cost, currency}, parents first.
static func tree() -> Array[Dictionary]:
	if _nodes.is_empty():
		_build_tree()
	return _nodes


static func tree_node(id: String) -> Dictionary:
	if _nodes.is_empty():
		_build_tree()
	return _by_id.get(id, {})


static func _build_tree() -> void:
	var counts := {}
	for chain in TREE_CHAINS:
		var talent: String = chain[0]
		var currency: String = TALENTS[talent].currency
		var parent: String = chain[2]
		var angle: float = chain[3]
		for i in int(chain[1]):
			var n := int(counts.get(talent, 0)) + 1
			counts[talent] = n
			var id := "%s_%d" % [talent, n]
			var pos := Vector2.ZERO
			var depth := 0.0
			if parent != "":
				var p: Dictionary = _by_id[parent]
				pos = (p.pos + Vector2.from_angle(deg_to_rad(angle)) * NODE_SPACING).round()
				depth = _currency_depth(parent, currency)
				angle += float(chain[4])
			var cost := int(round(COST_BASE[currency] * pow(1.0 + 0.3 * depth, 2.0) * pow(1.04, depth)))
			var node := {"id": id, "talent": talent, "index": n, "parent": parent, "pos": pos,
				"depth": depth, "cost": cost, "currency": currency}
			_nodes.append(node)
			_by_id[id] = node
			parent = id


## Depth for costs: the nodes on the path from the root up to and including `id`, those paid
## in `currency` counting 1 and the others OTHER_WEIGHT.
static func _currency_depth(id: String, currency: String) -> float:
	var d := 0.0
	while id != "":
		var n: Dictionary = _by_id[id]
		d += 1.0 if n.currency == currency else OTHER_WEIGHT
		id = n.parent
	return d


static func talent_max(talent: String) -> int:
	var m := 0
	for n in tree():
		if n.talent == talent:
			m += 1
	return m

const CURRENCY_NAMES := {"iron": "FERRO", "sapphire": "SAFIRA", "fang": "PRESA"}

## Mine floors (GDD §4/§6). Prototype: 2 floors x 3 levels.
## req = player level needed. Multipliers scale node HP, enemy HP and ore dropped.
## scene: the floor's mine scene (its art, ore, enemy and decor are set there); tiles: the
## floor-tile weights in Mine.FLOORS; ore: the currency its nodes drop (HUD counter).
const FLOORS: Array[Dictionary] = [
	{
		"name": "A ANTIGA MINA", "scene": "res://scenes/mine/floor1.tscn", "ore": "iron", "ore_hp": 4, "tiles": "f1",
		"levels": [
			{"req": 1, "ores": 14, "enemies": 3, "hp_mult": 1.0, "yield": 1.0},
			{"req": 5, "ores": 18, "enemies": 5, "hp_mult": 1.6, "yield": 1.6},
			{"req": 10, "ores": 22, "enemies": 7, "hp_mult": 2.4, "yield": 2.4},
		],
	},
	{
		"name": "CAVERNA DE CRISTAL", "scene": "res://scenes/mine/floor2.tscn", "ore": "sapphire", "ore_hp": 10, "tiles": "f2",
		"levels": [
			{"req": 15, "ores": 14, "enemies": 4, "hp_mult": 1.0, "yield": 1.0},
			{"req": 20, "ores": 18, "enemies": 6, "hp_mult": 1.6, "yield": 1.6},
			{"req": 25, "ores": 22, "enemies": 8, "hp_mult": 2.4, "yield": 2.4},
		],
	},
]

## Enemy numbers by Enemy.type (scenes/mine/rat.tscn, golem.tscn hold the art and collider).
## radius: hit and bite reach.
## Attacks are telegraphed: within attack_range the enemy stops and plays its attack; on the
## hit frame it lunges (px/s) and hits if the player is still within hit_reach (px, feet to feet).
const ENEMIES := {
	"rat": {"hp": 3, "speed": 76.0, "damage": 8.0, "radius": 11.0,
		"attack_range": 28.0, "hit_reach": 26.0, "lunge": 150.0, "cooldown": 0.8},
	"golem": {"hp": 9, "speed": 44.0, "damage": 14.0, "radius": 16.0,
		"attack_range": 34.0, "hit_reach": 36.0, "lunge": 0.0, "cooldown": 1.3},
}

## Player
const MAX_AIR := 100.0
const AIR_DRAIN := 2.0          # per second -> 50 s base run
const MOVE_SPEED := 130.0
const MOVE_ACCEL := 1300.0      # px/s² — reaches full speed in ~0.1 s
const MOVE_DECEL := 1700.0      # px/s² — stops in ~0.08 s
const STRIKE_LUNGE := 2.5       # px the sprite leans toward the aim on a swing
const SWING_COOLDOWN := 0.5
const ARC_RADIUS := 36.0
const ARC_HALF_ANGLE := 80.0    # degrees each side of the aim
const ORE_DROPS := 2.0          # base drops per node
const FAINT_KEEP := 0.3         # fainting keeps 30% of the run (loses 70%)
