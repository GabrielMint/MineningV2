class_name Hud
extends CanvasLayer
## In-run HUD (scenes/ui/hud.tscn): air bar (toxic gas timer), run haul counters, floor name.
## The layout lives in the scene; this fills the texts, clips the air bar and bumps counters.

@export var currency_icons := {}      ## currency -> hand SVG icon (the ore counter shows this floor's)

var player: Player

@onready var _fill_clip: Control = %FillClip
@onready var _bar_w: float = _fill_clip.size.x
var _counts := {}               # kind -> Label
var _base_y := {}               # kind -> the label's resting y
var _blink := 0.0


func _ready() -> void:
	var fdef := Game.floor_def()
	(%OreIcon as HandTextureRect).show_art(currency_icons[fdef.ore])
	_counts = {fdef.ore: %OreCount, "fang": %FangCount}
	for kind in _counts:
		_base_y[kind] = _counts[kind].position.y
	%Title.text = "%s  %d-%d" % [fdef.name, Game.current_floor + 1, Game.current_level + 1]


func _process(delta: float) -> void:
	if player == null:
		return
	var ratio: float = clamp(player.air / Balance.MAX_AIR, 0.0, 1.0)
	_fill_clip.size.x = _bar_w * ratio
	# Low air: the bar blinks.
	if ratio < 0.25 and not player.dead:
		_blink += delta
		_fill_clip.visible = int(_blink * 6.0) % 2 == 0
	else:
		_fill_clip.visible = true
	for kind in _counts:
		_counts[kind].text = str(Game.run_haul[kind])


## Counter pop when something is collected.
func bump(kind: String) -> void:
	if not _counts.has(kind):
		return
	var l: Label = _counts[kind]
	l.add_theme_color_override("font_color", Game.PAL.f)
	l.position.y = _base_y[kind] - 3
	var tw := create_tween()
	tw.tween_property(l, "position:y", _base_y[kind], 0.15).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
	tw.tween_callback(l.remove_theme_color_override.bind("font_color"))
