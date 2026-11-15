include("palette.px.js")
include("_lib.px.js")
// UI (32px scale): warm wood frames around cream parchment. 24x24 9-slice sources, 8px margins.

// [outer, frame, bevel-light, frame-dark, inner-shadow, fill]
const PARCHMENT = ["D", "e", "E", "D", "E", "c"]
const HOVER = ["o", "f", "y", "O", "E", "c"]
const DISABLED = ["n", "s", "S", "n", "S", "z"]
const DARK = ["D", "e", "E", "D", "d", "d"]
const panel = (w, h, [outer, frame, lit, frameDark, inner, fill]) => (c) => {
  c.rect(2, 0, w - 4, h, "k"); c.rect(0, 2, w, h - 4, "k"); c.rect(1, 1, w - 2, h - 2, "k")
  c.rect(2, 1, w - 4, h - 2, outer); c.rect(1, 2, w - 2, h - 4, outer)
  c.rect(2, 2, w - 4, h - 4, frame)
  c.hline(3, 2, w - 6, lit); c.vline(2, 3, h - 6, lit); c.hline(3, 3, w - 6, lit)
  c.hline(3, h - 3, w - 6, frameDark); c.vline(w - 3, 3, h - 6, frameDark)
  c.rect(5, 5, w - 10, h - 10, outer)
  c.rect(6, 6, w - 12, h - 12, inner)
  c.rect(7, 7, w - 13, h - 13, fill)
  for (const [x, y] of [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]]) c.px(x, y, "S")   // nails
}

sprite("ui_panel", { w: 24, h: 24 }, panel(24, 24, PARCHMENT))
sprite("ui_panel_dark", { w: 24, h: 24 }, panel(24, 24, DARK))
sprite("ui_button", { w: 24, h: 24 }, panel(24, 24, PARCHMENT))
sprite("ui_button_hover", { w: 24, h: 24 }, panel(24, 24, HOVER))
sprite("ui_button_disabled", { w: 24, h: 24 }, panel(24, 24, DISABLED))

// Air bar (oxygen against the toxic gas): frame + fill.
sprite("ui_bar_frame", { w: 124, h: 14 }, (c) => {
  c.rect(1, 0, 122, 14, "k"); c.rect(0, 1, 124, 12, "k")
  c.rect(1, 1, 122, 12, "D"); c.hline(2, 1, 120, "e"); c.rect(2, 2, 120, 10, "d")
})
sprite("ui_bar_fill", { w: 120, h: 10 }, (c) => {
  c.rect(0, 0, 120, 10, "B"); c.hline(0, 1, 120, "C"); c.hline(0, 2, 120, "C")
  c.hline(0, 8, 120, "b"); c.hline(0, 9, 120, "b")
  for (let x = 6; x < 120; x += 14) { c.px(x, 4, "C"); c.px(x + 1, 5, "C") }   // bubbles
})

sprite("ui_icon_iron", { w: 16, h: 12, selout: "k" }, (c) => {
  boulder(c, 8, 6.5, 8, 5.5, "n", "s", "S", "z")
  c.px(5, 4, "w"); c.px(10, 7, "w"); c.px(11, 7, "z"); c.px(7, 8, "o"); c.px(8, 8, "O")
})

// "E" key hint bubble shown over interactables (15x15, 5x7 glyph).
sprite("ui_key_e", { w: 15, h: 15 }, (c) => {
  c.rect(2, 0, 11, 15, "k"); c.rect(0, 2, 15, 11, "k"); c.rect(1, 1, 13, 13, "k")
  c.rect(2, 1, 11, 12, "c"); c.rect(1, 2, 13, 10, "c"); c.hline(2, 12, 11, "E"); c.hline(2, 13, 11, "e")
}, grid(5, 3, "#####\n#....\n#....\n####.\n#....\n#....\n#####".replace(/#/g, "d")))

// ---------- Talent tree ----------
// Round node frames (40x40); the 28x28 icon sits at (6,6).
const node = (ring, ringLit, ringDark, fill) => (c) => {
  c.circ(19.5, 19.5, 19.5, "k")
  c.circ(19.5, 19.5, 18.5, ringDark)
  c.circ(19, 19, 17.5, ring)
  c.circ(18.5, 18.5, 16.5, ringLit)
  c.circ(19.5, 19.5, 15.5, ring)
  c.circ(19.5, 19.5, 14.5, "k")
  c.circ(19.5, 19.5, 13.5, fill)
}
sprite("tt_node_locked", { w: 40, h: 40 }, node("n", "s", "K", "K"))
sprite("tt_node_open", { w: 40, h: 40 }, node("e", "E", "D", "d"))
sprite("tt_node_ready", { w: 40, h: 40 }, node("f", "y", "o", "d"))
sprite("tt_node_max", { w: 40, h: 40 }, node("g", "G", "h", "d"))
sprite("tt_node_hover", { w: 40, h: 40 }, node("z", "w", "S", "d"))

// ---------- Upgrade icons (26x26 + soft outline = 28x28) ----------
const ICON = { w: 26, h: 26, selout: "k" }
// Pickaxe head: a curved iron bar with a socket; ox/oy offset, width in px.
const pickHead = (c, ox, oy, w = 24) => {
  const cx = ox + w / 2
  c.ellipse(cx, oy + 9, w / 2, 7, "S", true); c.ellipse(cx, oy + 10, w / 2, 7, "S", true)
  c.ellipse(cx, oy + 11, w / 2, 7, "s", true)
  c.rect(ox - 1, oy + 10, w + 2, 10, "_")
  c.px(ox, oy + 9, "z"); c.px(ox + 1, oy + 7, "z"); c.px(ox + w, oy + 9, "n")
  c.rect(cx - 3, oy + 1, 6, 5, "S"); c.hline(cx - 3, oy + 1, 6, "z"); c.vline(cx + 2, oy + 2, 4, "s")
}
const handle = (c, x, y0, y1) => {
  c.rect(x, y0, 3, y1 - y0, "e"); c.vline(x, y0, y1 - y0, "E"); c.vline(x + 2, y0, y1 - y0, "D")
  for (let y = y0 + 3; y < y1 - 1; y += 5) c.px(x + 1, y, "D")
}

sprite("icon_ore_damage", ICON, (c) => {
  pickHead(c, 1, 0); handle(c, 12, 5, 26)
  c.px(2, 6, "w"); c.px(3, 5, "w")                                 // sharp glint
})
sprite("icon_mine_speed", ICON, (c) => {
  pickHead(c, 3, 0, 22); handle(c, 13, 5, 26)
  for (const [y, len, col] of [[14, 8, "y"], [18, 10, "Y"], [22, 7, "y"]]) { c.hline(0, y, len, col); c.hline(0, y + 1, len - 2, "f") }
})
sprite("icon_gas_resist", ICON, (c) => {
  // purple gas puffs behind a cloth mask with two filters
  c.circ(5, 5, 4, "v"); c.circ(20, 4, 4, "v"); c.circ(4, 4, 2, "V"); c.circ(19, 3, 2, "V")
  c.ellipse(13, 15, 12, 9, "E"); c.ellipse(12, 14, 10, 7, "c")
  c.hline(0, 11, 26, "D"); c.hline(0, 12, 26, "e")
  for (const x of [8, 18]) { c.circ(x, 17, 4, "n"); c.circ(x, 17, 3, "s"); c.circ(x - 1, 16, 1.5, "S"); c.px(x, 17, "k") }
})
sprite("icon_ore_yield", ICON, (c) => {
  c.ellipse(13, 17, 12, 9, "D"); c.ellipse(13, 16.5, 11, 8, "e"); c.ellipse(10, 14, 6, 5, "E")
  c.rect(9, 5, 8, 5, "e"); c.vline(9, 5, 5, "E"); c.hline(8, 9, 10, "D"); c.hline(8, 10, 10, "o")
  boulder(c, 13, 4, 6, 4, "n", "s", "S", "z"); c.px(11, 3, "w"); c.px(15, 5, "o")
  c.px(6, 18, "c"); c.px(7, 17, "c")
})
sprite("icon_enemy_damage", ICON, (c) => {
  c.line(4, 21, 22, 3, "S", 3); c.line(5, 20, 22, 3, "z"); c.line(6, 21, 23, 4, "s")
  c.px(23, 2, "w"); c.px(22, 2, "w")
  c.line(1, 16, 9, 24, "Y", 2); c.line(1, 16, 9, 24, "y")                 // guard
  c.line(1, 24, 4, 21, "D", 3); c.px(0, 25, "Y")                          // grip + pommel
})
sprite("icon_armor", ICON, (c) => {           // leather shield with iron rim and boss
  c.poly([1, 1, 25, 1, 25, 13, 13, 26, 1, 13], "s")
  c.poly([3, 3, 23, 3, 23, 13, 13, 24, 3, 13], "e")
  c.poly([3, 3, 13, 3, 13, 24, 3, 13], "E")
  c.vline(13, 3, 21, "D"); c.hline(3, 11, 21, "D")
  c.circ(13, 11, 3, "S"); c.circ(12.5, 10.5, 1.5, "z")
  c.hline(2, 1, 22, "z")
})
sprite("icon_arc_radius", ICON, (c) => {
  c.ellipse(13, 14, 12.5, 12.5, "y", true); c.ellipse(13, 14, 11.5, 11.5, "Y", true); c.rect(0, 14, 26, 12, "_")
  pickHead(c, 5, 6, 16); handle(c, 12, 10, 26)
})
sprite("icon_spinning_picks", ICON, (c) => {
  c.ellipse(13, 13, 11, 11, "f", true); c.ellipse(13, 13, 10, 10, "Y", true)
  for (const [x, y] of [[9, 0], [0, 14], [17, 14]]) {
    c.hline(x, y + 1, 9, "S"); c.hline(x + 1, y, 7, "z"); c.px(x, y + 2, "s"); c.px(x + 8, y + 2, "n")
    c.rect(x + 4, y + 2, 2, 7, "e"); c.vline(x + 5, y + 2, 7, "D")
  }
})
sprite("icon_ore_chain", ICON, (c) => {
  c.line(7, 19, 13, 7, "Y", 2); c.line(13, 7, 19, 19, "Y", 2); c.line(7, 19, 19, 19, "y", 2)
  for (const [x, y] of [[7, 19], [19, 19], [13, 7]]) {
    boulder(c, x, y, 6, 5, "n", "s", "S", "z"); c.px(x - 2, y - 1, "w"); c.px(x + 2, y + 1, "o")
  }
})
sprite("icon_heal_on_kill", ICON, (c) => {
  c.circ(13, 13, 12, "b"); c.circ(12.5, 12.5, 11, "B"); c.circ(11, 11, 7, "B")
  c.ellipse(8, 7, 3, 2, "C"); c.px(6, 6, "w"); c.px(7, 6, "w")
  c.rect(11, 6, 4, 14, "w"); c.rect(6, 11, 14, 4, "w"); c.vline(14, 7, 13, "z"); c.hline(7, 14, 13, "z")
})
