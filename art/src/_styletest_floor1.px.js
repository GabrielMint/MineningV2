// Style test: one 320x180 screen of Floor 1 at game resolution. Not exported to Godot (leading "_").
include("floor1.px.js")
include("characters.px.js")

const MAP = `
  TTTTTTTTTTTTTTTTTTTT
  TTTTTTTTTTTTTTTTTTTT
  FFFFFWFFFFFFFFFWFFFF
  ddddswddddddddswdddd
  dddddddddsdddddddddd
  ddsdddddddddTTTddddd
  ddddddddddddTTTdddsd
  dddddddsddddFFFddddd
  dddddddddddddddddddd
  ddsddddddddsdddddsdd
  dddddddddddddddddddd
  ddddddsddddddddddddd`

const ORES = [[30, 72], [140, 62], [250, 112], [214, 150], [60, 150]]
const ROCKS = [[44, 104], [272, 70], [180, 156], [118, 84]]
const MINER = [152, 100]
const RATS = [[232, 78, {}], [92, 150, { flip: "x" }]]

scene("styletest_floor1", { w: 320, h: 180, bg: "k" },
  layer("ground", tilemap(MAP, {
    size: 16,
    map: { T: "f1_wall_top", F: "f1_wall_face", W: "f1_wall_face_wet",
           d: "f1_floor_dirt", s: "f1_floor_dirt2", w: "f1_floor_wet" },
  })),

  // Soft contact shadows (in-palette: steps the floor one shade darker).
  layer("shadows", { shade: true },
    ...ORES.map(([x, y]) => ellipse(x + 8, y + 11, 7, 2, "k")),
    ellipse(MINER[0] + 8, MINER[1] + 15, 6, 1, "k"),
    ...RATS.map(([x, y]) => ellipse(x + 8, y + 9, 6, 1, "k")),
    ellipse(79, 49, 15, 1, "k")),

  layer("props",
    stamp("f1_support", 64, 31),
    stamp("f1_skeleton", 100, 122),
    ...ROCKS.map(([x, y]) => stamp("f1_rock_small", x, y)),
    ...ORES.map(([x, y]) => stamp("f1_ore_iron", x, y))),

  layer("actors",
    stamp("miner_idle_down", ...MINER),
    ...RATS.map(([x, y, o]) => stamp("rat_idle_left", x, y, o, { frame: 0 }))))
