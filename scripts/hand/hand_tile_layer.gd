class_name HandTileLayer
extends TileMapLayer
## A TileMapLayer using a hand tile sheet. In the scene: a TileSet from resources/tilesets/
## (*_hand.tres, made at art scale by tools/hand_resources.gd: 128-unit cells) and scale 0.25,
## so cells are 32 logical px. At runtime the TileSet is swapped for window-scale art.


func _ready() -> void:
	Hand.adapt_node(self)
	tile_set = Hand.adapt_tileset(tile_set)
