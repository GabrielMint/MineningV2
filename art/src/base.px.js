include("palette.px.js")
include("_lib.px.js")
// The base: "A Entrada da Mina" (32px). Atlas: 0 grass, 1 grass+flowers, 2 path,
// 3 cliff top, 4-5 cliff faces.

// Grass: tufts of 2-3 blades (light tips, dark roots) on a mid green.
const tufts = (seed, n) => (c) => {
  const r = c.rng(seed)
  for (let i = 0; i < 18; i++) c.px(Math.floor(r() * 32), Math.floor(r() * 32), "h")
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(r() * 29), y = 3 + Math.floor(r() * 28)
    c.vline(x, y - 2, 2, "G"); c.px(x - 1, y - 1, "G"); c.vline(x + 1, y - 3, 3, "G")
    c.px(x, y, "h"); c.px(x + 1, y, "h")
  }
}
const flower = (c, x, y, petal, center) => {
  c.px(x, y - 1, petal); c.px(x - 1, y, petal); c.px(x + 1, y, petal); c.px(x, y + 1, petal)
  c.px(x, y, center); c.px(x, y + 2, "h")
}

sprite("b_grass", { w: 32, h: 32 }, rect(0, 0, 32, 32, "g"), tufts(4, 9))
sprite("b_grass_flowers", { w: 32, h: 32 }, rect(0, 0, 32, 32, "g"), tufts(9, 5), (c) => {
  flower(c, 7, 8, "y", "f"); flower(c, 22, 18, "w", "Y"); flower(c, 12, 25, "q", "y"); flower(c, 26, 5, "w", "Y")
})

sprite("b_path", { w: 32, h: 32 }, plainFloor(2, "E", "c", "e", "c", 2))

// ---------- More ground variants (rows 1-2 of the atlas; base_area.gd holds the weights) ----------
const grass = (name, seed, n, ...items) => sprite(name, { w: 32, h: 32 }, rect(0, 0, 32, 32, "g"), tufts(seed, n), ...items)
const path = (name, seed, ...items) => sprite(name, { w: 32, h: 32 }, plainFloor(seed, "E", "c", "e", "c", 0), ...items)

grass("b_grass_2", 15, 5)
grass("b_grass_clover", 21, 3, (c) => {                                           // clover patch
  for (const [x, y] of [[10, 12], [14, 10], [13, 15], [18, 13], [17, 18], [21, 16], [9, 17]]) {
    c.px(x, y - 1, "G"); c.px(x - 1, y, "G"); c.px(x + 1, y, "G"); c.px(x, y, "h"); c.px(x + 1, y + 1, "h")
  }
})
grass("b_grass_stone", 27, 4, (c) => {                                            // stone in the grass
  c.hline(13, 20, 10, "h"); boulder(c, 17, 17, 5, 3.5, "n", "s", "S", "z")
  c.vline(12, 17, 3, "G"); c.vline(22, 16, 3, "G")
})
grass("b_grass_tall", 33, 3, (c) => {                                             // tall clump
  for (const [x, h] of [[11, 6], [13, 8], [15, 9], [17, 7], [19, 8], [21, 5]]) {
    c.vline(x, 21 - h, h, "G"); c.vline(x + 1, 22 - h, h - 1, "h")
  }
  c.hline(11, 21, 12, "h")
})
grass("b_grass_mushroom", 39, 4, (c) => {
  mushroom(c, 13, 15, "x", "R", "r", "c", "h", "w"); mushroom(c, 19, 19, "x", "R", "r", "c", "h")
})
path("b_path_2", 45)
path("b_path_pebbles", 51, (c) => { gravel(c, 8, 15, 16, 14, "c", "E", "e"); pebble(c, 14, 15, "c", "E", "D") })
path("b_path_prints", 57, (c) => {                                                // boot prints
  bootPrint(c, 8, 4, "e"); bootPrint(c, 13, 10, "e"); bootPrint(c, 9, 17, "e"); bootPrint(c, 14, 24, "e")
})
path("b_path_leaves", 63, (c) => {                                                // blown leaves
  for (const [x, y, col] of [[9, 10, "G"], [20, 14, "g"], [13, 22, "G"], [24, 25, "Y"]]) {
    c.hline(x, y, 3, col); c.px(x + 1, y - 1, col); c.px(x + 1, y + 1, "e")
  }
})

// Cliff top: grassy ledge seen from above.
sprite("b_cliff_top", { w: 32, h: 32 }, rect(0, 0, 32, 32, "h"), (c) => {
  const r = c.rng(6)
  for (let i = 0; i < 12; i++) { const x = Math.floor(r() * 30), y = Math.floor(r() * 31); c.hline(x, y, 2, "g") }
  for (let i = 0; i < 6; i++) c.px(Math.floor(r() * 32), Math.floor(r() * 32), "j")
})

// Cliff face: grey boulders with a grassy lip and hanging grass.
sprite("b_cliff_face", { w: 32, h: 32 }, (c) => {
  c.rect(0, 0, 32, 32, "n")
  boulder(c, 8, 12, 8, 7, "n", "s", "S", "z")
  boulder(c, 24, 10, 8, 6, "n", "s", "S", "z")
  boulder(c, 15, 24, 10, 7, "n", "s", "S", "z")
  boulder(c, 29, 25, 4, 5, "n", "s", "S", "z")
  c.hline(0, 0, 32, "G"); c.hline(0, 1, 32, "g"); c.hline(0, 2, 32, "g"); c.hline(0, 3, 32, "h")
  for (const x of [4, 11, 19, 27]) { c.vline(x, 3, 3, "g"); c.px(x, 6, "h") }
  c.dither(0, 28, 32, 2, "n", "K", 0.5); c.hline(0, 30, 32, "K"); c.hline(0, 31, 32, "K")
})
sprite("b_cliff_face_vines", { base: "b_cliff_face" }, (c) => {
  for (const [x, len] of [[9, 20], [23, 13]]) {
    c.vline(x, 3, len, "g"); c.vline(x + 1, 3, len - 3, "h")
    for (let y = 6; y < 3 + len; y += 4) { c.px(x - 1, y, "G"); c.px(x + 2, y + 2, "G") }
  }
})

sheet("b_tiles", ["b_grass", "b_grass_flowers", "b_path",
                  "b_cliff_top", "b_cliff_face", "b_cliff_face_vines",
                  "b_grass_2", "b_grass_clover", "b_grass_stone",
                  "b_grass_tall", "b_grass_mushroom", "b_path_2",
                  "b_path_pebbles", "b_path_prints", "b_path_leaves"], { cols: 6, pad: 0 })

// ---------- Mine entrance (96x80) set into the cliff ----------
sprite("b_mine_entrance", { w: 96, h: 80, outline: "k" }, (c) => {
  // tunnel
  c.rect(14, 16, 68, 64, "k")
  c.rect(18, 20, 60, 10, "K"); c.dither(18, 30, 60, 8, "K", "k", 0.5)
  // rails + sleepers
  for (let y = 44; y < 80; y += 7) { c.hline(26, y, 44, "D"); c.hline(26, y + 1, 44, "d") }
  for (const x of [33, 61]) { c.vline(x, 36, 44, "S"); c.vline(x + 1, 36, 44, "s"); c.px(x, 36, "z") }
  // timber frame
  post(c, 6, 12, 10, 68); post(c, 80, 12, 10, 68)
  beam(c, 0, 4, 96, 11, [10, 85])
  // sign
  c.rect(30, 0, 36, 14, "E"); c.box(30, 0, 36, 14, "D"); c.hline(31, 1, 34, "c"); c.hline(31, 12, 34, "e")
  c.text(37, 4, "MINA", "d", { gap: 2 })
  // lantern on the left post
  c.vline(21, 18, 3, "s"); c.rect(19, 21, 5, 7, "D"); c.rect(20, 22, 3, 5, "Y"); c.px(21, 23, "y"); c.px(20, 22, "w")
})

// ---------- Merchant's stall (80x68) ----------
sprite("b_stall", { w: 80, h: 68, outline: "k" }, (c) => {
  for (const x of [4, 70]) post(c, x, 16, 6, 52)
  // striped awning with scalloped edge
  for (let x = 0; x < 80; x++) {
    const red = Math.floor(x / 10) % 2 === 0
    c.vline(x, 0, 16, red ? "R" : "c")
    c.vline(x, 12, 4, red ? "r" : "E")
    const k = x % 10
    if (k >= 2 && k <= 7) c.vline(x, 16, k >= 3 && k <= 6 ? 3 : 2, red ? "R" : "c")
  }
  c.hline(0, 0, 80, "x"); c.hline(0, 1, 80, "x")
  for (let x = 0; x < 80; x += 10) c.vline(x, 2, 14, red(x) ? "r" : "E")
  function red(x) { return Math.floor(x / 10) % 2 === 0 }
  // counter
  c.rect(0, 40, 80, 28, "e"); c.hline(0, 40, 80, "c"); c.hline(0, 41, 80, "E"); c.hline(0, 42, 80, "E")
  for (let x = 8; x < 80; x += 18) { c.vline(x, 44, 24, "D"); c.vline(x + 1, 44, 24, "d") }
  c.hline(0, 66, 80, "D"); c.hline(0, 67, 80, "d")
  // goods: ore pile, a pickaxe, a jar of crystals, a lantern
  boulder(c, 16, 36, 9, 5, "n", "s", "S", "z"); c.px(12, 34, "o"); c.px(19, 35, "w")
  c.vline(42, 24, 16, "e"); c.vline(43, 24, 16, "D")
  c.ellipse(42, 25, 9, 4, "S", true); c.rect(32, 25, 21, 6, "_"); c.vline(42, 25, 15, "e")
  c.rect(58, 28, 8, 12, "B"); c.rect(58, 26, 8, 2, "z"); c.vline(59, 29, 9, "C"); c.px(62, 32, "w")
})

// ---------- Small props ----------
sprite("b_barrel", { w: 18, h: 22, outline: "k" }, (c) => {
  c.ellipse(9, 11, 9, 11, "e"); c.rect(1, 2, 16, 18, "e")
  c.vline(3, 2, 18, "E"); c.vline(4, 2, 18, "E"); c.vline(14, 2, 18, "D"); c.vline(15, 2, 18, "D")
  for (const y of [4, 16]) { c.hline(0, y, 18, "s"); c.hline(0, y + 1, 18, "n"); c.px(3, y, "z") }
  c.ellipse(9, 1.5, 7, 1.5, "D"); c.hline(4, 1, 10, "E")
})
sprite("b_crate", { w: 20, h: 20, outline: "k" }, (c) => {
  c.rect(0, 0, 20, 20, "e"); c.box(0, 0, 20, 20, "D"); c.box(1, 1, 18, 18, "E")
  c.line(2, 2, 17, 17, "D"); c.line(2, 17, 17, 2, "D"); c.line(3, 2, 17, 16, "E")
  c.hline(1, 18, 18, "D")
  for (const [x, y] of [[2, 2], [17, 2], [2, 17], [17, 17]]) c.px(x, y, "S")
})
sprite("b_bush", { w: 34, h: 24, outline: "k" }, (c) => {
  c.ellipse(10, 14, 10, 8, "h"); c.ellipse(22, 12, 10, 10, "h"); c.ellipse(16, 17, 14, 6, "h")
  c.ellipse(9, 12, 7, 6, "g"); c.ellipse(21, 9, 7, 6, "g"); c.ellipse(16, 15, 9, 4, "g")
  for (const [x, y] of [[6, 8], [18, 4], [20, 5], [12, 12], [25, 8], [8, 9]]) { c.px(x, y, "G"); c.px(x + 1, y, "G") }
  for (const [x, y] of [[27, 14], [10, 18], [17, 9]]) { c.px(x, y, "q"); c.px(x, y + 1, "V") }
})
sprite("b_lamp_post", { w: 12, h: 40, outline: "k" }, (c) => {
  c.rect(1, 0, 10, 2, "D"); c.rect(2, 2, 8, 9, "D"); c.rect(3, 3, 6, 7, "Y"); c.rect(4, 4, 3, 4, "y"); c.px(4, 4, "w")
  c.rect(1, 11, 10, 2, "D")
  c.rect(5, 13, 3, 24, "e"); c.vline(5, 13, 24, "E"); c.vline(7, 13, 24, "D")
  c.rect(3, 36, 7, 4, "D"); c.hline(3, 36, 7, "e")
})
