include("palette.px.js")
include("_lib.px.js")
// Floor 1 — The Old Mine, 32px tiles. Atlas row 0: 0-2 floors, 3 wall top, 4-5 wall faces.
// Rows 1-2: more floor variants (mine.gd F1_FLOORS holds the weights). Keep the order stable.

// ---------- Floor ----------
// Dark, low-contrast dirt (Enter the Gungeon look) so the outlined sprites pop. Most cells are
// quiet; the detail tiles each tell one small story of the old mine.
const F1 = ["D", "e", "d", "E"]                  // base, light, dark, highlight
const f1 = (name, seed, ...items) => sprite(name, { w: 32, h: 32 }, plainFloor(seed, ...F1, 0), ...items)

sprite("f1_floor_dirt", { w: 32, h: 32 }, plainFloor(3, ...F1))
f1("f1_floor_dirt2", 11, (c) => {                                                 // a dry crack
  c.line(4, 9, 10, 14, "d"); c.line(10, 14, 17, 15, "d"); c.line(17, 15, 21, 21, "d")
  c.line(10, 14, 9, 19, "d"); c.px(11, 15, "e"); c.px(18, 16, "e"); c.px(13, 15, "k")
})
f1("f1_floor_wet", 7,                                                             // seep puddle
  ellipse(16, 18, 10, 6, "d"), ellipse(16, 18, 9, 5, "b"), ellipse(15, 17, 6, 3, "B"),
  hline(10, 15, 4, "C"), hline(11, 16, 2, "w"), hline(20, 21, 2, "C"), px(5, 10, "b"), px(27, 26, "b"))
sprite("f1_floor_dirt3", { w: 32, h: 32 }, plainFloor(23, ...F1))
f1("f1_floor_gravel", 31, (c) => { gravel(c, 4, 13, 15, 16, "E", "e", "d"); pebble(c, 12, 14, "E", "e", "d") })
f1("f1_floor_flagstone", 37, (c) => {                                             // buried slab
  const slab = [7, 13, 19, 10, 25, 14, 23, 21, 11, 22, 6, 18]
  c.poly(slab.map((v) => v + 1), "d"); c.poly(slab, "s")
  c.line(7, 13, 19, 10, "S"); c.line(6, 18, 7, 13, "S"); c.px(9, 13, "z")
  c.line(23, 21, 11, 21, "n"); c.line(24, 14, 23, 20, "n"); c.line(15, 12, 17, 17, "n")
})
f1("f1_floor_prints", 41, (c) => {                                                // miners walked here
  bootPrint(c, 6, 23, "d"); bootPrint(c, 11, 18, "d"); bootPrint(c, 16, 14, "d")
  bootPrint(c, 21, 9, "d"); bootPrint(c, 26, 4, "d")
})
f1("f1_floor_plank", 43, (c) => {                                                 // fallen board
  c.hline(6, 20, 21, "d")
  c.rect(5, 15, 21, 5, "e"); c.hline(5, 15, 21, "E"); c.hline(5, 19, 21, "D")
  c.px(25, 15, "_"); c.px(25, 16, "d"); c.px(24, 15, "D")                         // split end
  c.hline(9, 17, 3, "D"); c.hline(17, 18, 3, "D")                                 // grain
  c.px(7, 17, "z"); c.px(7, 18, "s"); c.px(22, 17, "z"); c.px(22, 18, "s")         // nails
})
f1("f1_floor_mushrooms", 47, (c) => {
  mushroom(c, 12, 14, "f", "O", "o", "c", "d", "c")
  mushroom(c, 17, 17, "f", "O", "o", "c", "d")
  mushroom(c, 9, 19, "f", "O", "o", "c", "d")
})
f1("f1_floor_roots", 53, (c) => {                                                 // root from above
  const pts = [[3, 8], [9, 11], [15, 10], [21, 14], [27, 13]]
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = pts[i], [x, y] = pts[i + 1]
    c.line(a, b + 1, x, y + 1, "d"); c.line(a, b, x, y, "e")
  }
  c.line(15, 10, 17, 17, "e"); c.line(16, 10, 18, 17, "d"); c.px(9, 11, "E"); c.px(21, 14, "E")
})
f1("f1_floor_coal", 59, (c) => {                                                  // spilled coal
  boulder(c, 12, 15, 3, 2.5, "k", "K", "n", "s")
  boulder(c, 18, 18, 2.5, 2, "k", "K", "n", "s")
  boulder(c, 10, 20, 2, 1.5, "k", "K", "n", "s")
  c.px(20, 13, "K"); c.px(15, 22, "K"); c.px(23, 20, "k")
})
f1("f1_floor_bone", 61, (c) => {                                                  // old bone
  c.hline(10, 19, 14, "d")
  c.hline(11, 16, 11, "z"); c.hline(11, 17, 11, "z"); c.hline(11, 18, 11, "S")
  for (const x of [8, 22]) { c.rect(x, 15, 3, 2, "z"); c.rect(x, 17, 3, 2, "S") }
  c.px(8, 15, "w"); c.px(9, 15, "w"); c.px(12, 16, "w"); c.px(13, 16, "w")
})
sprite("f1_floor_dirt4", { w: 32, h: 32 }, plainFloor(67, ...F1, 2))

// ---------- Walls ----------
sprite("f1_wall_top", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "k")
  c.hline(4, 8, 7, "d"); c.hline(10, 9, 3, "d")
  c.hline(18, 22, 6, "d"); c.px(17, 23, "d")
  c.px(26, 5, "d"); c.px(27, 5, "d"); c.px(6, 26, "d"); c.px(23, 13, "d")
})

// Front face: stacked boulders with lit caps, mortar shadows, lit lip, dark foot.
sprite("f1_wall_face", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "d")
  boulder(c, 7, 10, 7, 7, "d", "D", "e", "E")
  boulder(c, 22, 8, 9, 6, "d", "D", "e", "E")
  boulder(c, 13, 23, 9, 7, "d", "D", "e", "E")
  boulder(c, 28, 22, 5, 6, "d", "D", "e", "E")
  c.hline(0, 0, 32, "E"); c.hline(0, 1, 32, "e"); c.hline(0, 2, 32, "D")
  c.dither(0, 28, 32, 2, "d", "k", 0.5); c.hline(0, 30, 32, "k"); c.hline(0, 31, 32, "k")
})

// Water seeping down the rock.
sprite("f1_wall_face_wet", { base: "f1_wall_face" },
  vline(14, 2, 28, "b"), vline(15, 2, 27, "B"), vline(16, 5, 22, "b"),
  vline(15, 6, 3, "C"), vline(14, 15, 2, "C"), px(16, 22, "C"), px(15, 28, "w"))

sheet("f1_tiles", ["f1_floor_dirt", "f1_floor_dirt2", "f1_floor_wet",
                   "f1_wall_top", "f1_wall_face", "f1_wall_face_wet",
                   "f1_floor_dirt3", "f1_floor_gravel", "f1_floor_flagstone",
                   "f1_floor_prints", "f1_floor_plank", "f1_floor_mushrooms",
                   "f1_floor_roots", "f1_floor_coal", "f1_floor_bone", "f1_floor_dirt4"], { cols: 6, pad: 0 })

// ---------- Ore: iron (grey boulder with silver flecks and rust) ----------
// Node size (references/dont_starve_mining_reference): a bit bigger than the miner, 44x38 with
// the outline. Three stacked angular slabs; ore veins run along the seams between them.
sprite("f1_ore_iron", { w: 42, h: 36, outline: "k" }, oreRock("n", "s", "S", "z", (c) => {
  // silvery iron veins in the seams, rust where water reached them
  c.line(4, 28, 33, 25, "z"); c.line(5, 29, 30, 26, "S")
  c.line(6, 19, 31, 16, "z"); c.line(7, 20, 28, 17, "S")
  for (const [x, y] of [[7, 28], [18, 27], [28, 25], [10, 19], [22, 17]]) { c.px(x, y, "w"); c.px(x + 1, y, "w") }
  for (const [x, y] of [[13, 28], [25, 26], [16, 18]]) { c.px(x, y, "O"); c.px(x + 1, y + 1, "o") }
}))
sprite("f1_ore_iron_hit1", { base: "f1_ore_iron" }, line(16, 4, 19, 11, "k"), line(19, 11, 23, 13, "k"))
sprite("f1_ore_iron_hit2", { base: "f1_ore_iron_hit1" },
  line(23, 13, 27, 22, "k"), line(19, 11, 12, 18, "k"), line(31, 7, 34, 12, "k"), line(9, 25, 13, 32, "k"))

sprite("item_iron", { w: 11, h: 9, outline: "k" }, (c) => {
  c.ellipse(5, 4.5, 5, 4, "s"); c.ellipse(4.5, 4, 4, 3, "S")
  c.px(3, 2, "w"); c.px(4, 2, "z"); c.px(6, 5, "o"); c.px(7, 3, "z"); c.hline(2, 8, 6, "n")
})

// ---------- Props ----------
sprite("f1_ladder", { w: 18, h: 34, outline: "k" }, (c) => {
  for (const x of [0, 14]) { c.rect(x, 0, 4, 34, "e"); c.vline(x, 0, 34, "E"); c.vline(x + 3, 0, 34, "D") }
  for (let y = 4; y < 34; y += 7) { c.hline(4, y, 10, "E"); c.hline(4, y + 1, 10, "e"); c.hline(4, y + 2, 10, "D") }
})

// Old timber support: grained posts, nailed lintel; right post snapped, lintel cracked.
sprite("f1_support", { w: 64, h: 44, outline: "k" }, (c) => {
  post(c, 4, 7, 8, 37)
  post(c, 51, 16, 8, 28)
  c.poly([51, 16, 59, 16, 59, 13, 56, 17, 53, 13], "e")          // jagged break
  beam(c, 0, 2, 64, 8, [7, 55])
  c.line(38, 10, 62, 15, "D"); c.line(38, 9, 50, 11, "d")         // sagging crack
})

sprite("f1_skeleton", { w: 36, h: 15, outline: "k" }, (c) => {
  // skull
  c.ellipse(5, 5, 5, 4.5, "z"); c.ellipse(4.5, 4.5, 4, 3.5, "w")
  c.rect(2, 4, 2, 2, "k"); c.rect(6, 4, 2, 2, "k"); c.px(5, 7, "S")
  c.hline(2, 9, 6, "S"); c.px(3, 10, "z"); c.px(5, 10, "z"); c.px(7, 10, "z")
  // spine + ribs
  c.hline(10, 6, 20, "z"); c.hline(10, 7, 20, "S")
  for (let x = 12; x < 26; x += 3) { c.vline(x, 2, 4, "w"); c.vline(x, 8, 4, "z"); c.px(x, 12, "S") }
  // leg bones
  c.line(29, 7, 34, 12, "z"); c.line(30, 7, 35, 12, "S"); c.line(29, 8, 31, 13, "z")
})

sprite("f1_rock_small", { w: 11, h: 8, outline: "k" }, (c) => boulder(c, 5, 4.5, 5, 3.5, "n", "s", "S", "z"))
