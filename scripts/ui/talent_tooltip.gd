class_name TalentTooltip
extends Control
## Details of a hovered talent node (scenes/ui/talent_tooltip.tscn): the "Info" group for open
## and bought nodes, the "Locked" group for teasers. The talent tree positions it.

@export var currency_icons := {}      ## currency -> hand SVG icon
@export var afford_color := Color(0.243137, 0.152941, 0.192157)   ## palette d
@export var cant_afford_color := Color(0.635294, 0.14902, 0.2)    ## palette r


func show_node(id: String, state: String) -> void:
	var n := Balance.tree_node(id)
	var t: Dictionary = Balance.TALENTS[n.talent]
	var locked := state == "locked"
	%Locked.visible = locked
	%Info.visible = not locked
	if not locked:
		%Name.text = t.name
		%Desc.text = t.desc
		%Total.text = "TOTAL: %d/%d" % [Game.upgrade_level(n.talent), Balance.talent_max(n.talent)]
		var bought := state == "max"
		%Bought.visible = bought
		%Cost.visible = not bought
		if not bought:
			var cost := int(n.cost)
			%CostAmount.text = str(cost)
			%CostAmount.add_theme_color_override("font_color",
				afford_color if Game.bank[n.currency] >= cost else cant_afford_color)
			(%CostIcon as HandTextureRect).show_art(currency_icons[n.currency])
	visible = true
