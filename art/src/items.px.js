include("palette.px.js")
// Items and small shared sprites (32px scale).

// Enemy drop (every enemy drops this): a curved fang.
sprite("item_fang", { w: 8, h: 11, outline: "k" }, (c) => {
  c.poly([0, 0, 8, 0, 6, 6, 3, 11, 2, 6], "z")
  c.poly([0, 0, 4, 0, 3, 10, 2, 6], "w")
  c.hline(0, 1, 8, "S")
})
sprite("ui_icon_fang", { w: 11, h: 14, outline: "k" }, (c) => {
  c.poly([0, 0, 11, 0, 8, 8, 4, 14, 2, 8], "z")
  c.poly([0, 0, 5, 0, 4, 12, 2, 8], "w")
  c.hline(0, 2, 11, "S"); c.px(7, 4, "S")
})

// Spinning pickaxe (upgrade): orbits the player, drawn upright, never rotated.
sprite("fx_pick", { w: 15, h: 12, outline: "k" }, (c) => {
  c.ellipse(7, 5, 7, 4, "S", true); c.ellipse(7, 6, 7, 4, "s", true); c.rect(0, 6, 15, 7, "_")
  c.rect(6, 1, 3, 3, "S"); c.px(6, 1, "z"); c.px(0, 5, "z")
  c.vline(7, 3, 9, "e"); c.vline(8, 3, 9, "D")
})

// Cast-shadow masks (pure white). Godot colors them with the floor's dark shade.
sprite("shadow_s", { w: 18, h: 5 }, ellipse(8.5, 2, 9, 2.5, "w"))
sprite("shadow_m", { w: 26, h: 7 }, ellipse(12.5, 3, 13, 3.5, "w"))
sprite("shadow_l", { w: 40, h: 9 }, ellipse(19.5, 4, 20, 4.5, "w"))
