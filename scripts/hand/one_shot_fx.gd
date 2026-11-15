class_name OneShotFx
extends HandAnimatedSprite
## A hand-drawn effect that plays one animation and frees itself (swing arc, dust puff).
## Autoplay in the scene, or call play() after adding it.


func _ready() -> void:
	super()
	animation_finished.connect(queue_free)
