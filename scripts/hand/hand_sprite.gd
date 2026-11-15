class_name HandSprite
extends Sprite2D
## A Sprite2D showing hand-drawn art. In the scene: an imported SVG from assets/hand/, scale
## 0.25 (1/Hand.UNIT), offset in art units. At runtime it swaps in the art rasterized at the
## window's scale (see Hand), so it stays sharp at any window size.


func _ready() -> void:
	Hand.adapt_node(self)
	texture = Hand.art(texture)


## Show another hand-drawn texture (an imported SVG), e.g. an ore's crack stage.
func show_art(tex: Texture2D) -> void:
	texture = Hand.art(tex)
