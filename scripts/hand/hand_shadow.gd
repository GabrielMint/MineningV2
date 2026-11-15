class_name HandShadow
extends HandSprite
## Cast shadow under a standing object: a white ellipse mask (assets/hand/base/shadow_*.svg)
## colored with the shadow color of the World it stands in (World.shadow_key, an exact palette
## color; see "white masks" in the style guide). Place it before the object's sprite.


func _ready() -> void:
	super()
	var world := World.of(self)
	if world:
		self_modulate = Game.PAL[world.shadow_key]
