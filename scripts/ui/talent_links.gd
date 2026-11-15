class_name TalentLinks
extends Control
## Draws the links between talent nodes as inked hand lines: a slight, stable curve per link,
## a dark under-stroke and a colored stroke on top (warm when the parent is bought).

var tree: TalentTree


func _draw() -> void:
	if tree == null:
		return
	for n in Balance.tree():
		var parent: String = n.parent
		if parent == "" or not tree.node_visible(n.id):
			continue
		var a: Vector2 = Balance.tree_node(parent).pos
		var b: Vector2 = n.pos
		var pts := _curve(a, b, n.id)
		var color: Color = Game.PAL.n
		if Game.is_bought(n.id):
			color = Game.PAL.Y
		elif Game.is_bought(parent):
			color = Game.PAL.E
		draw_polyline(pts, Game.PAL.k, 4.0, true)
		draw_polyline(pts, color, 1.8, true)


## A quadratic curve from a to b bowed sideways by a small amount fixed per link.
func _curve(a: Vector2, b: Vector2, key: String) -> PackedVector2Array:
	var bow := (float(absi(hash(key)) % 1000) / 1000.0 - 0.5) * 6.0
	var mid := (a + b) / 2.0 + (b - a).orthogonal().normalized() * bow
	var pts := PackedVector2Array()
	for i in 9:
		var t := i / 8.0
		pts.append(a.lerp(mid, t).lerp(mid.lerp(b, t), t))
	return pts
