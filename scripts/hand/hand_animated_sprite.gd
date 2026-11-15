class_name HandAnimatedSprite
extends AnimatedSprite2D
## An AnimatedSprite2D playing a hand-drawn sheet. In the scene: SpriteFrames from
## resources/frames/ (made at art scale by tools/hand_resources.gd; speeds and loops can be
## edited there), scale 0.25, offset in art units. At runtime the frames are swapped for the
## same animations on art rasterized at the window's scale (see Hand).


func _ready() -> void:
	var anim := animation
	var playing := is_playing() or autoplay != ""
	Hand.adapt_node(self)
	sprite_frames = Hand.adapt_frames(sprite_frames)
	if playing and sprite_frames and sprite_frames.has_animation(anim):
		play(anim)
