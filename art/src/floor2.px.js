include("palette.px.js")
include("_lib.px.js")
// Floor 2 — Crystal Cave, 32px. Pale blue-grey floor, deep blue crystal walls.

// Atlas row 0: 0-2 floors, 3 wall top, 4-5 wall faces. Rows 1-2: more floor variants
// (mine.gd F2_FLOORS holds the weights). Keep the order stable.
// Dark, low-contrast stone (Enter the Gungeon look) so the outlined sprites pop.
const F2 = ["n", "s", "K", "S"]                  // base, light, dark, highlight
const f2 = (name, seed, ...items) => sprite(name, { w: 32, h: 32 }, plainFloor(seed, ...F2, 0), ...items)
// Engraved seam: dark groove, its far (lower) wall catches the top-left light.
const seam = (c, x0, y0, x1, y1) => { c.line(x0, y0 + 1, x1, y1 + 1, "s"); c.line(x0, y0, x1, y1, "K") }

sprite("f2_floor", { w: 32, h: 32 }, plainFloor(5, ...F2))
f2("f2_floor_alt", 13, (c) => { seam(c, 4, 20, 10, 25); seam(c, 10, 25, 15, 25) })
sprite("f2_floor_shard", { w: 32, h: 32 }, plainFloor(21, ...F2, 0),
  ellipse(16, 22, 7, 2, "K"),
  poly([12, 22, 14, 12, 16, 22], "B"), poly([15, 22, 18, 9, 21, 22], "B"),
  vline(14, 13, 8, "C"), vline(18, 10, 11, "C"), px(18, 9, "w"), vline(20, 15, 7, "b"))

sprite("f2_wall_top", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "k")
  c.hline(5, 10, 6, "K"); c.hline(19, 21, 7, "K"); c.px(26, 6, "b"); c.px(9, 25, "b"); c.px(22, 12, "K")
})

// Crystal wall face: blue crystal columns with cyan edges and white glints.
const crystal = (c, x, top, w, h) => {
  c.rect(x, top, w, h, "B")
  c.vline(x, top, h, "C"); c.vline(x + 1, top, h, "C")
  c.vline(x + w - 1, top, h, "b"); c.vline(x + w - 2, top, h, "b")
  c.poly([x, top, x + w, top, x + w / 2, top - 6], "B")
  c.line(x, top, x + w / 2, top - 6, "C")
  c.px(Math.floor(x + w / 2), top - 5, "w")
}
sprite("f2_wall_face", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "K")
  c.hline(0, 0, 32, "s"); c.hline(0, 1, 32, "n")
  crystal(c, 2, 12, 8, 17)
  crystal(c, 12, 8, 10, 21)
  crystal(c, 24, 15, 6, 14)
  c.px(15, 12, "w"); c.px(16, 13, "z")
  c.dither(0, 28, 32, 2, "K", "k", 0.5); c.hline(0, 30, 32, "k"); c.hline(0, 31, 32, "k")
})
sprite("f2_wall_face_crystal", { base: "f2_wall_face" },
  poly([6, 2, 12, 2, 9, 12], "C"), poly([8, 2, 12, 2, 9, 12], "B"), px(8, 4, "w"))

sprite("f2_floor_2", { w: 32, h: 32 }, plainFloor(29, ...F2))
f2("f2_floor_seams", 33, (c) => {                                                 // cracked bedrock
  seam(c, 2, 9, 13, 14); seam(c, 13, 14, 27, 10); seam(c, 13, 14, 15, 27)
})
f2("f2_floor_gravel", 37, (c) => { gravel(c, 6, 15, 16, 16, "S", "s", "K"); pebble(c, 14, 15, "S", "s", "K") })
f2("f2_floor_sprouts", 41, (c) => {                                               // young crystals
  sprout(c, 11, 19, 5, "K"); sprout(c, 16, 17, 7, "K"); sprout(c, 20, 21, 3, "K")
})
f2("f2_floor_dust", 43, (c) => {                                                  // crystal dust
  for (const [x, y] of [[9, 12], [13, 10], [12, 15], [17, 13], [15, 18], [20, 16], [23, 12], [19, 21]]) c.px(x, y, "B")
  for (const [x, y] of [[14, 13], [18, 17]]) { c.px(x, y, "C"); c.px(x + 1, y, "b") }
  c.px(16, 15, "w")
})
f2("f2_floor_pool", 47, (c) => {                                                  // still water
  c.ellipse(16, 17, 10, 6, "K"); c.ellipse(16, 17, 9, 5, "b"); c.ellipse(15, 16, 6, 3, "B")
  c.hline(10, 14, 4, "C"); c.hline(11, 15, 2, "w"); c.hline(20, 20, 2, "C")
})
f2("f2_floor_fissure", 53, (c) => {                                               // glowing crack
  const pts = [[3, 7], [10, 13], [17, 14], [22, 20], [28, 23]]
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = pts[i], [x, y] = pts[i + 1]
    c.line(a, b + 1, x, y + 1, "b"); c.line(a, b, x, y, "k")
  }
  c.px(11, 14, "B"); c.px(18, 15, "B"); c.px(23, 21, "C")
})
f2("f2_floor_geode", 59, (c) => {                                                 // half-buried geode
  c.ellipse(17, 18, 7, 5, "K")
  boulder(c, 16, 17, 6, 4.5, "K", "s", "S", "z")
  c.ellipse(16, 17, 3.5, 2.5, "b"); c.ellipse(16.5, 17.5, 2.5, 1.5, "B")
  c.px(15, 16, "C"); c.px(16, 16, "w"); c.px(18, 18, "C")
})
sprite("f2_floor_3", { w: 32, h: 32 }, plainFloor(61, ...F2, 2))

sheet("f2_tiles", ["f2_floor", "f2_floor_alt", "f2_floor_shard",
                   "f2_wall_top", "f2_wall_face", "f2_wall_face_crystal",
                   "f2_floor_2", "f2_floor_seams", "f2_floor_gravel",
                   "f2_floor_sprouts", "f2_floor_dust", "f2_floor_pool",
                   "f2_floor_fissure", "f2_floor_geode", "f2_floor_3"], { cols: 6, pad: 0 })

// ---------- Ore: sapphire (crystals growing out of dark rock) ----------
// Same slab rock as the iron node (44x38 with outline), dark blue stone with sapphire crystals
// growing out of the seams and the crown.
sprite("f2_ore_sapphire", { w: 42, h: 36, outline: "k" }, oreRock("n", "s", "S", "z", (c) => {
  const shard = (x, base, h, w) => {
    c.poly([x, base, x + w / 2, base - h, x + w, base], "B")
    c.poly([x, base, x + w / 2, base - h, x + w / 2, base], "C")
    c.line(x + w / 2, base - h, x + w, base, "b")
    c.px(Math.round(x + w / 2) - 1, base - h + 2, "w")
  }
  shard(13, 9, 9, 7); shard(19, 8, 8, 6)                     // crown
  shard(5, 19, 7, 6); shard(24, 17, 8, 7); shard(30, 16, 5, 5) // middle seam
  shard(9, 29, 6, 5); shard(15, 28, 9, 7); shard(33, 26, 5, 5) // bottom seam
}))
sprite("f2_ore_sapphire_hit1", { base: "f2_ore_sapphire" }, line(26, 4, 25, 13, "k"), line(25, 13, 29, 15, "k"))
sprite("f2_ore_sapphire_hit2", { base: "f2_ore_sapphire_hit1" },
  line(29, 15, 33, 23, "k"), line(9, 15, 13, 20, "k"), line(5, 26, 8, 33, "k"))

sprite("item_sapphire", { w: 9, h: 10, outline: "k" }, (c) => {
  c.poly([4.5, 0, 9, 4, 4.5, 10, 0, 4], "B"); c.poly([4.5, 0, 4.5, 10, 0, 4], "C")
  c.px(3, 3, "w"); c.hline(1, 4, 7, "b")
})
sprite("ui_icon_sapphire", { w: 14, h: 14, outline: "k" }, (c) => {
  c.poly([7, 0, 14, 5, 7, 14, 0, 5], "B"); c.poly([7, 0, 7, 14, 0, 5], "C")
  c.hline(1, 5, 12, "b"); c.px(4, 3, "w"); c.px(5, 3, "w"); c.px(4, 4, "w")
})

// ---------- Crystal golem (Floor 2 enemy), ~40x34, 2-frame walk ----------
anim("golem_walk", { w: 40, h: 34, frames: 2, fps: 4, outline: "k" }, (c) => {
  const step = c.frame === 0 ? 0 : 1
  // legs
  c.rect(10, 26 - step, 7, 8 + step, "n"); c.rect(11, 26 - step, 4, 6, "s")
  c.rect(23, 26 - (1 - step), 7, 8 + (1 - step), "n"); c.rect(24, 26 - (1 - step), 4, 6, "s")
  // body
  boulder(c, 20, 18, 15, 11, "K", "n", "s", "S")
  // arms
  boulder(c, 4, 20, 4, 6, "K", "n", "s", "S"); boulder(c, 36, 20, 4, 6, "K", "n", "s", "S")
  // face
  c.rect(12, 14, 5, 3, "C"); c.rect(23, 14, 5, 3, "C"); c.px(13, 14, "w"); c.px(24, 14, "w")
  c.hline(16, 20, 8, "K")
  // crystals on the shoulders and head
  const shard = (x, base, h, w) => {
    c.poly([x, base, x + w / 2, base - h, x + w, base], "B")
    c.line(x, base, x + w / 2, base - h, "C"); c.px(Math.round(x + w / 2), base - h + 1, "w")
  }
  shard(6, 10, 9, 6); shard(16, 8, 8, 7); shard(28, 10, 10, 6)
})
sheet("golem", ["golem_*"], { pad: 1 })
