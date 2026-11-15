class_name TalentTree
extends CanvasLayer
## The merchant's upgrades as a big node-based talent tree (inspired by "A Game About Feeding
## A Black Hole"), scenes/ui/talent_tree.tscn. One node per talent level, instanced from
## talent_node.tscn and placed by the data (Balance.TREE_CHAINS) inside the Graph, whose
## position in the scene is where the root node starts. Buying a node reveals its children.
## Drag to pan, mouse wheel to zoom, hover for details, click to buy.

signal closed

const SCREEN := Vector2(480, 270)
const ZOOM_MIN := 0.4
const ZOOM_MAX := 1.0

@export var node_scene: PackedScene

@onready var _graph: Control = %Graph          # panned and zoomed container: links + nodes
@onready var _links: TalentLinks = %Links
@onready var _bank: BankPanel = %BankPanel
@onready var _tooltip: TalentTooltip = %Tooltip

var _nodes := {}                          # id -> TalentNode
var _dragging := false
var _zoom := 1.0
var _revealed := {}                       # ids already shown (for the reveal animation)


func _ready() -> void:
	_links.tree = self
	_tooltip.visible = false
	%Background.gui_input.connect(_on_bg_input)

	for n in Balance.tree():
		var node := node_scene.instantiate() as TalentNode
		node.id = n.id
		node.talent = n.talent
		node.position = (n.pos as Vector2) - Vector2.ONE * TalentNode.SIZE / 2.0
		node.hovered.connect(_on_hover)
		node.unhovered.connect(_on_unhover)
		node.clicked.connect(_on_click)
		_graph.add_child(node)
		_nodes[n.id] = node

	for a in OS.get_cmdline_user_args():
		if a.begins_with("--tree-zoom="):         # dev: screenshot the tree zoomed out
			_zoom = clampf(float(a.substr(12)), ZOOM_MIN, ZOOM_MAX)
	_graph.scale = Vector2.ONE * _zoom
	_refresh(false)


# ---------- State ----------

func node_visible(id: String) -> bool:
	return _nodes[id].visible


func _state_of(id: String) -> String:
	if Game.is_bought(id):
		return "max"
	if not Game.is_node_open(id):
		return "locked"
	return "ready" if Game.can_buy(id) else "open"


## Shown: bought nodes, open nodes (parent bought) and, as locked teasers, their children.
func _is_shown(n: Dictionary) -> bool:
	var parent: String = n.parent
	return parent == "" or Game.is_bought(n.id) or Game.is_node_open(n.id) or Game.is_node_open(parent)


func _refresh(animate: bool) -> void:
	_bank.refresh()
	for n in Balance.tree():
		var node: TalentNode = _nodes[n.id]
		var show := _is_shown(n)
		node.visible = show
		if show:
			node.set_state(_state_of(n.id))
			if animate and not _revealed.has(n.id):
				node.reveal()
			_revealed[n.id] = true
	_links.queue_redraw()
	_clamp_pan()


# ---------- Input ----------

func _on_click(n: TalentNode) -> void:
	if Game.buy(n.id):
		n.pop()
		_refresh(true)
		_show_tooltip(n)
	else:
		n.deny()


func _on_hover(n: TalentNode) -> void:
	_show_tooltip(n)


func _on_unhover(_n: TalentNode) -> void:
	_tooltip.visible = false


func _on_bg_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			_dragging = event.pressed
		elif event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]:
			_zoom_at(event.position, 1.15 if event.button_index == MOUSE_BUTTON_WHEEL_UP else 1.0 / 1.15)
	elif event is InputEventMouseMotion and _dragging:
		_graph.position += event.relative
		_clamp_pan()


## Zoom keeping the point under the cursor in place.
func _zoom_at(screen_pos: Vector2, factor: float) -> void:
	var z := clampf(_zoom * factor, ZOOM_MIN, ZOOM_MAX)
	var tree_pos := (screen_pos - _graph.position) / _zoom
	_zoom = z
	_graph.scale = Vector2.ONE * _zoom
	_graph.position = screen_pos - tree_pos * _zoom
	_clamp_pan()


## Keep every shown node reachable: any of them can be brought to the screen center.
func _clamp_pan() -> void:
	var lo := Vector2.INF
	var hi := -Vector2.INF
	for n in Balance.tree():
		if _nodes[n.id].visible:
			lo = lo.min(n.pos)
			hi = hi.max(n.pos)
	var c := SCREEN / 2.0
	_graph.position = _graph.position.clamp(c - hi * _zoom - Vector2(60, 40), c - lo * _zoom + Vector2(60, 40))


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_close") or event.is_action_pressed("interact"):
		get_viewport().set_input_as_handled()
		closed.emit()
		queue_free()


# ---------- Tooltip ----------

## Fill the tooltip and put it beside the node, inside the screen.
func _show_tooltip(node: TalentNode) -> void:
	_tooltip.show_node(node.id, node.state)
	var size := _tooltip.size
	var anchor := _graph.position + (Balance.tree_node(node.id).pos as Vector2) * _zoom
	var pos := anchor + Vector2(22, -16)
	if pos.x + size.x > SCREEN.x - 4:
		pos.x = anchor.x - size.x - 22
	pos.y = clampf(pos.y, 62.0, SCREEN.y - 26 - size.y)
	_tooltip.position = pos.round()
