class_name HandTextureRect
extends TextureRect
## A UI image of hand-drawn art (icons, bar, talent medallions). In the scene: an imported SVG,
## expand mode "ignore size", stretch "scale", size in logical px (art size / 4). At runtime it
## swaps in the art rasterized at the window's scale so it draws 1:1 on screen.


func _ready() -> void:
	texture = Hand.art(texture)


## Show another hand-drawn texture (an imported SVG).
func show_art(tex: Texture2D) -> void:
	texture = Hand.art(tex)
