include("_lib.hd.js")
// The hand-drawn UI kit: 9-slice frames, buttons, the air bar, currency icons, the E keycap and
// the font. Units: 4 per logical game pixel (the game is 480x270 logical, shown at 1920x1080).
// Look (as art/hand/base.hd.js): dark ink thicker on the bottom-right, light from the top-left,
// flat Endesga fills, hand hatching on the shadow side.
//
// 9-slice rule: Godot STRETCHES everything between the corner squares. Along a top/bottom edge
// only horizontal features (bands, long grain lines) are kept; along a left/right edge only
// vertical ones; nails, seams and hatching live in the corners; the centers are one flat color.

const PI = Math.PI

// ---------- Font: hand-lettered capitals as strokes ----------
// Centerlines in a box with the top at 0 and the baseline at H. Glyph origin: (GX, GY), so the
// ink (stroke width PEN) runs from y = 12 to y = 44 and starts at x = 4 in a 40x56 frame.
const H = 27, PEN = 5, GX = 6.5, GY = 14.5
const arc = (cx, cy, rx, ry, a0, a1, n = 18) => arcPts(cx, cy, rx, ry, a0 * PI, a1 * PI, n)
const mirror = (g, w) => ({ s: g.s.map((p) => p.map(([x, y]) => [w - x, y])), dots: (g.dots || []).map(([x, y]) => [w - x, y]) })
const comma = (x, y) => [[x + 1.6, y - 1], [x + 1.4, y + 3], [x - 1.2, y + 8.5]]

const G = {
  A: { s: [[[0, H], [10, 0], [20, H]], [[4.2, 17.5], [15.8, 17.5]]] },
  B: { s: [[[0, 13.5], [0, 0], [8, 0], ...arc(8, 6.75, 6.5, 6.75, -0.5, 0.5, 12), [0, 13.5]], [[0, 13.5], [9, 13.5], ...arc(9, 20.25, 7.5, 6.75, -0.5, 0.5, 12), [0, H], [0, 13.5]]] },
  C: { s: [arc(10, 13.5, 10, 13.5, -0.27, -1.73, 24)] },
  D: { s: [[[0, 0], [0, H], [6, H], ...arc(6, 13.5, 11, 13.5, 0.5, -0.5, 18), [0, 0]]] },
  E: { s: [[[14, 0], [0, 0], [0, H], [14.5, H]], [[0, 13.2], [11, 13.2]]] },
  F: { s: [[[14, 0], [0, 0], [0, H]], [[0, 13.2], [11, 13.2]]] },
  G: { s: [[...arc(10, 13.5, 10, 13.5, -0.27, -2, 24), [20, 23], [20, 15], [11.5, 15]]] },
  H: { s: [[[0, 0], [0, H]], [[17, 0], [17, H]], [[0, 13.5], [17, 13.5]]] },
  I: { s: [[[0, 0], [0, H]]] },
  J: { s: [[[12, 0], [12, 18.5], ...arc(6, 18.5, 6, 8.5, 0, 0.95, 12)]] },
  K: { s: [[[0, 0], [0, H]], [[15.5, 0], [0, 15.5]], [[5, 10.5], [16.5, H]]] },
  L: { s: [[[0, 0], [0, H], [13.5, H]]] },
  M: { s: [[[0, H], [1, 0], [11.5, 17], [22, 0], [23, H]]] },
  N: { s: [[[0, H], [0, 0], [17, H], [17, 0]]] },
  O: { s: [arc(10.5, 13.5, 10.5, 13.5, -0.6, 1.5, 30)] },
  P: { s: [[[0, H], [0, 0], [8, 0], ...arc(8, 7, 7, 7, -0.5, 0.5, 12), [0, 14]]] },
  Q: { s: [arc(10.5, 13.5, 10.5, 13.5, -0.6, 1.5, 30), [[12.5, 19], [21, 28.5]]] },
  R: { s: [[[0, H], [0, 0], [8, 0], ...arc(8, 7, 7, 7, -0.5, 0.5, 12), [0, 14]], [[7, 14], [16, H]]] },
  S: { s: [[...arc(8, 7, 7, 7, -0.12, -1.5, 14), ...arc(8, 20.5, 8, 6.5, -0.5, 0.88, 16).slice(1)]] },
  T: { s: [[[0, 0], [18, 0]], [[9, 0], [9, H]]] },
  U: { s: [[[0, 0], [0, 18], ...arc(8.5, 18, 8.5, 9, 1, 0, 14), [17, 0]]] },
  V: { s: [[[0, 0], [10, H], [20, 0]]] },
  W: { s: [[[0, 0], [6, H], [13, 7], [20, H], [26, 0]]] },
  X: { s: [[[0, 0], [17, H]], [[17, 0], [0, H]]] },
  Y: { s: [[[0, 0], [9, 13.5]], [[18, 0], [9, 13.5], [9, H]]] },
  Z: { s: [[[0, 0], [16, 0], [0, H], [17, H]]] },
  0: { s: [arc(8, 13.5, 8, 13.5, -0.6, 1.5, 28)] },
  1: { s: [[[0, 6], [7, 0], [7, H]]] },
  2: { s: [[...arc(8, 7.5, 7.5, 7.5, -0.95, 0.22, 14), [0, H], [16, H]]] },
  3: { s: [arc(7.5, 7, 7, 7, -0.9, 0.5, 14), arc(7.5, 20.25, 8, 6.75, -0.5, 0.9, 14)] },
  4: { s: [[[11, H], [11, 0], [0, 18], [16, 18]]] },
  5: { s: [[[14, 0], [2, 0], [1.6, 12], ...arc(7.5, 18.5, 8, 8.5, -0.72, 0.85, 16)]] },
  6: { s: [arc(8.5, 13.5, 8.5, 13.5, -0.3, -1.12, 12), arc(8, 19.5, 7.5, 7.5, 1, 3.1, 22)] },
  7: { s: [[[0, 0], [15, 0], [5, H]]] },
  8: { s: [arc(8, 6.75, 6.5, 6.75, 0.5, 2.6, 20), arc(8, 20, 8, 7, -0.5, 1.6, 22)] },
  9: { s: [arc(7.5, 7.5, 7.5, 7.5, 0, 2.1, 22), arc(6.5, 13.5, 8.5, 13.5, -0.1, 0.68, 12)] },
  " ": { s: [] },
  ".": { s: [], dots: [[0.5, 24.5]] },
  ",": { s: [comma(0.5, 24.5)], dots: [[0.5, 24.5]] },
  "!": { s: [[[1, 0], [0.6, 17]]], dots: [[0.6, 24.5]], taper: [0.04, 0.45] },
  "?": { s: [[...arc(7, 7, 7, 7, -0.95, 0.3, 14), [7, 15], [7, 17.5]]], dots: [[7, 24.5]] },
  ":": { s: [], dots: [[0.5, 9], [0.5, 24.5]] },
  ";": { s: [comma(0.5, 24.5)], dots: [[0.5, 9], [0.5, 24.5]] },
  "'": { s: [[[1, 0], [0.4, 8]]], taper: [0.04, 0.55] },
  "-": { s: [[[0, 14], [11, 14]]] },
  "+": { s: [[[0, 14], [14, 14]], [[7, 7], [7, 21]]] },
  "/": { s: [[[13, 0], [0, H]]] },
  "(": { s: [arc(9.5, 13.5, 9.5, 15, -0.62, -1.38, 14)] },
  "=": { s: [[[0, 9.5], [14, 9.5]], [[0, 18.5], [14, 18.5]]] },
  "%": { s: [[[18, 0], [2, H]], arc(4.2, 5.5, 4.2, 5.5, -0.6, 1.5, 16), arc(16, 21.5, 4.2, 5.5, -0.6, 1.5, 16)], pen: 4.2 },
  "*": { s: [[[7, 2], [7, 18]], [[0, 6], [14, 14]], [[0, 14], [14, 6]]], pen: 4.4 },
  "<": { s: [[[13, 5], [0, 14], [13, 23]]] },
}
G[")"] = mirror(G["("], 9.5 - 9.5 * Math.cos(0.38 * PI))
G[">"] = mirror(G["<"], 13)
const FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?:;'-+/()=%*<>"

// One glyph at (x, y) (top-left of its centerline box), scale s. Sharp corners get a round dab
// of the pen so joins stay full, like a brush pausing at a turn.
const glyph = (d, ch, x, y, s = 1, color = "w", pen = PEN) => {
  const g = G[ch]
  if (!g) throw new Error(`no glyph for '${ch}'`)
  const P = ([gx, gy]) => [x + gx * s, y + gy * s], w = (g.pen || pen) * s
  for (const seg of g.s) {
    const pts = seg.map(P)
    d.stroke(pts, { color, width: w, taper: g.taper || [0.05, 0.07], wobble: 0.45 * s, vary: 0.14, step: 1.2 })
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]]
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0])
      const turn = Math.abs(Math.atan2(Math.sin(t2 - t1), Math.cos(t2 - t1)))
      if (turn > 0.7) d.dot(b[0], b[1], w * 0.47, color)
    }
  }
  for (const p of g.dots || []) {
    const [cx, cy] = P(p), r = w * 0.62
    d.fill(ellipsePts(cx, cy, r, r * 1.05, 12), color, { wobble: 0.3 * s })
  }
}

sheet("font", { w: 40, h: 56 }, {
  font: [...FONT_CHARS].map((ch) => ({ draw: (d) => { d.seed("glyph" + ch); glyph(d, ch, GX, GY) } })),
})

// ---------- Parchment panel: 9-slice, margin 40 ----------
// A mitred wooden frame (band 6..34) around flat parchment. Each frame side is its own board:
// lit bevel on the outer top/left, shade on the outer bottom/right, grain along the board.
asset("ui_panel", { w: 160, h: 160 }, (d) => {
  const O = 6, I = 34, F = 160 - O, J = 160 - I                     // outer and inner frame edges
  d.seed("frame")
  const outer = d.shape(roundRect(O, O, F - O, F - O, 5), { wobble: 0.7, wave: 20 })
  d.fill(outer, "e")
  // bevels, cut along the mitres
  d.fill([[O + 1, O + 1], [F - 1, O + 1], [F - 8, O + 8], [O + 8, O + 8]], "E", { wobble: 0.3 })      // top lit
  d.fill([[O + 1, O + 1], [O + 8, O + 8], [O + 8, F - 8], [O + 1, F - 1]], "E", { wobble: 0.3 })      // left lit
  d.fill([[F - 1, O + 1], [F - 1, F - 1], [F - 8, F - 8], [F - 8, O + 8]], "D", { wobble: 0.3 })      // right shade
  d.fill([[O + 1, F - 1], [F - 1, F - 1], [F - 8, F - 8], [O + 8, F - 8]], "D", { wobble: 0.3 })      // bottom shade
  // grain: long lines along each board (they survive stretching)
  d.seed("grain")
  for (const [k, c] of [[22, "D"], [28.5, "D"]]) {
    d.stroke([[k + 3, k], [80, k + 0.6], [160 - k - 3, k]], { color: c, width: 1.1, taper: [0.1, 0.1], wobble: 0.5 })            // top
    d.stroke([[k, k + 3], [k + 0.6, 80], [k, 160 - k - 3]], { color: c, width: 1.1, taper: [0.1, 0.1], wobble: 0.5 })            // left
  }
  for (const k of [131, 138]) {
    d.stroke([[160 - k + 3, k], [80, k - 0.5], [k - 3, k]], { color: "D", width: 1.2, taper: [0.1, 0.1], wobble: 0.5 })          // bottom
    d.stroke([[k, 160 - k + 3], [k - 0.5, 80], [k, k - 3]], { color: "D", width: 1.2, taper: [0.1, 0.1], wobble: 0.5 })          // right
  }
  // shadow side, hatched only inside the bottom-right corner square
  d.hatch([[F - 2, J + 2], [F - 2, F - 2], [J + 6, F - 2]], { angle: -60, spacing: 3.4, color: "d", width: 1.1, skip: 0.15 })
  // mitre seams and one nail per corner
  d.seed("seams")
  for (const [a, b] of [[[O, O], [I, I]], [[F, O], [J, I]], [[O, F], [I, J]], [[F, F], [J, J]]])
    d.stroke([a, b], { color: "d", width: 1.5, taper: [0.15, 0.1], wobble: 0.3 })
  for (const [x, y] of [[20, 20], [140, 20], [20, 140], [140, 140]]) nail(d, x, y, 2.4)
  // parchment, with the frame's shadow along its top and left edges
  d.seed("parchment")
  const sheetShape = d.shape(rectPts(I, I, J - I, J - I), { wobble: 0.5, wave: 24 })
  d.fill(sheetShape, "c")
  d.fill([[I - 1, I - 1], [J + 1, I - 1], [J + 1, I + 3.5], [I + 3.5, I + 3.5], [I + 3.5, J + 1], [I - 1, J + 1]], "E", { wobble: 0.3 })
  d.ink(sheetShape, { weight: 1.8, lit: -0.35 })
  d.ink(outer, { weight: 2.6 })
})

// ---------- Dark plaque: 9-slice, margin 24 ----------
asset("ui_panel_dark", { w: 96, h: 96 }, (d) => {
  const O = 3, I = 11, F = 96 - O, J = 96 - I
  d.seed("plate")
  const plate = d.shape(roundRect(O, O, F - O, F - O, 6), { wobble: 0.5, wave: 18 })
  d.fill(plate, "n")
  d.fill([[O + 1, O + 1], [F - 1, O + 1], [F - 4, O + 4], [O + 4, O + 4]], "s", { wobble: 0.25 })      // lit top edge
  d.fill([[O + 1, O + 1], [O + 4, O + 4], [O + 4, F - 4], [O + 1, F - 1]], "s", { wobble: 0.25 })      // lit left edge
  d.fill([[F - 1, O + 1], [F - 1, F - 1], [F - 4, F - 4], [F - 4, O + 4]], "K", { wobble: 0.25 })      // shade right
  d.fill([[O + 1, F - 1], [F - 1, F - 1], [F - 4, F - 4], [O + 4, F - 4]], "K", { wobble: 0.25 })      // shade bottom
  d.hatch([[F - 2, J], [F - 2, F - 2], [J, F - 2]], { angle: -60, spacing: 3, color: "k", width: 1, skip: 0.1 })
  for (const [x, y] of [[O + 4.5, O + 4.5], [F - 4.5, O + 4.5], [O + 4.5, F - 4.5], [F - 4.5, F - 4.5]]) nail(d, x, y, 1.7, { top: "S" })
  // the sunk face: flat K, its rim darker toward the light (a recess)
  const face = d.shape(rectPts(I, I, J - I, J - I), { wobble: 0.35, wave: 20 })
  d.fill(face, "K")
  d.ink(face, { weight: 1.2, lit: -0.4 })
  d.ink(plate, { weight: 2.1 })
})

// ---------- Plank buttons: 9-slice, margin 32 ----------
// A board (face 4..82) standing on its own thickness (the lip, 82..92). Every state uses the same
// seeds, so only the colors change between normal, hover and disabled.
const button = (d, c) => {
  d.seed("board")
  const board = d.shape(roundRect(4, 4, 120, 88, 9), { wobble: 0.6, wave: 20 })
  d.fill(board, c.lip)
  const face = d.shape(roundRect(4, 4, 120, 78, 9), { wobble: 0.4, wave: 24 })
  d.fill(face, c.face)
  d.fill([[5.5, 5.5], [122.5, 5.5], [116, 12.5], [5.5, 12.5]], c.lit, { wobble: 0.3 })                              // lit top edge
  d.fill([[5.5, 5.5], [11.5, 11.5], [11.5, 81.5], [5.5, 81.5]], c.lit, { wobble: 0.3 })                                 // lit left edge
  d.fill([[11.5, 74.5], [116, 74.5], [122.5, 81.5], [5.5, 81.5]], c.shade, { wobble: 0.3 })                           // shade low edge
  d.fill([[116, 12.5], [122.5, 5.5], [122.5, 81.5], [116, 74.5]], c.shade, { wobble: 0.3 })                         // shade right edge
  d.seed("grain")
  for (const [y, x0, x1] of [[20, 18, 112], [26, 30, 104], [67, 16, 110]])
    d.stroke([[x0, y], [64, y + 0.7], [x1, y - 0.3]], { color: c.grain, width: 1.1, taper: [0.15, 0.15], wobble: 0.5 })
  d.hatch([[124, 70], [124, 92], [98, 92]], { angle: -62, spacing: 3.2, color: c.hatch, width: 1.1, skip: 0.15 })
  d.stroke([[10, 84], [64, 85.5], [118, 84]], { color: c.hatch, width: 1, taper: [0.2, 0.2], wobble: 0.4 })   // lip seam
  for (const [x, y] of [[16, 16], [112, 16], [16, 70], [112, 70]]) nail(d, x, y, 2.1, { rim: c.nailRim, top: c.nailTop })
  d.ink(face, { color: c.seam, weight: 1.2, lit: 0.2 })
  d.ink(board, { color: c.ink, weight: c.weight })
}
asset("ui_button", { w: 128, h: 96 }, (d) => button(d, { face: "e", lit: "E", shade: "D", lip: "D", grain: "D", hatch: "d", seam: "d", ink: "k", weight: 2.6, nailRim: "k", nailTop: "z" }))
asset("ui_button_hover", { w: 128, h: 96 }, (d) => button(d, { face: "E", lit: "c", shade: "e", lip: "D", grain: "e", hatch: "d", seam: "d", ink: "k", weight: 2.6, nailRim: "k", nailTop: "w" }))
asset("ui_button_disabled", { w: 128, h: 96 }, (d) => button(d, { face: "s", lit: "s", shade: "n", lip: "n", grain: "n", hatch: "K", seam: "K", ink: "K", weight: 2.2, nailRim: "K", nailTop: "s" }))

// ---------- Air bar ----------
// Iron casing; its window (8,8)-(488,48) is dark K. The game draws ui_bar_fill over the window.
asset("ui_bar_frame", { w: 496, h: 56 }, (d) => {
  d.seed("casing")
  const casing = d.shape(roundRect(1.5, 1.5, 493, 53, 6), { wobble: 0.5, wave: 30 })
  d.fill(casing, "s")
  d.fill([[3, 2.8], [493, 2.8], [493, 5.5], [3, 5.5]], "S", { wobble: 0.2 })                         // lit top
  d.fill([[2.8, 3], [5.5, 3], [5.5, 53], [2.8, 53]], "S", { wobble: 0.2 })                           // lit left
  d.fill([[3, 50.5], [493, 50.5], [493, 53.2], [3, 53.2]], "n", { wobble: 0.2 })                     // shade bottom
  d.fill([[490.5, 3], [493.2, 3], [493.2, 53], [490.5, 53]], "n", { wobble: 0.2 })                   // shade right
  d.seed("window")
  d.fill(rectPts(6.5, 6.5, 483, 43), "K", { wobble: 0.2 })
  d.fill([[6.5, 6.5], [489.5, 6.5], [489.5, 11], [11, 11], [11, 49.5], [6.5, 49.5]], "k", { wobble: 0.3 })   // recess shadow
  d.hatch(rectPts(11, 11, 70, 30), { angle: -60, spacing: 4, color: "k", width: 1, skip: 0.4, short: 0.6 })
  const win = d.shape(rectPts(8, 8, 480, 40), { wobble: 0.3, wave: 30 })
  d.ink(win, { weight: 1.3, lit: -0.4 })
  d.seed("rivets")
  for (const x of [4.2, 491.8]) for (const y of [14, 42]) nail(d, x, y, 1.5, { top: "z" })
  for (let x = 68; x < 470; x += 60) { nail(d, x, 4.2, 1.4, { top: "z" }); nail(d, x + 30, 51.8, 1.4, { rim: "k", top: "S" }) }
  d.ink(casing, { weight: 1.9 })
})

// The air: light blue with a lit surface, a deeper bottom and a few bubbles. Flat rectangle ends.
asset("ui_bar_fill", { w: 480, h: 40 }, (d) => {
  d.seed("air")
  d.fill(rectPts(-4, -4, 488, 48), "B", { wobble: 0 })
  const surf = [[-4, -4], [484, -4]]
  for (let x = 484; x >= -4; x -= 8) surf.push([x, 12 + 1.6 * Math.sin(x / 23) + 0.8 * Math.sin(x / 7.3)])
  d.fill(surf, "C", { wobble: 0.3 })
  const deep = [[-4, 44], [484, 44]]
  for (let x = 484; x >= -4; x -= 8) deep.push([x, 31 + 1.4 * Math.sin(x / 31 + 1) + 0.6 * Math.sin(x / 9)])
  d.fill(deep, "b", { wobble: 0.3 })
  // shine along the top, broken into dashes
  for (let x = 6; x < 474; ) {
    const L = 22 + d.rng() * 46
    d.stroke([[x, 4.5 + d.rng()], [Math.min(x + L, 478), 4.5 + d.rng()]], { color: "w", width: 2.2, taper: [0.25, 0.35], wobble: 0.4 })
    x += L + 12 + d.rng() * 26
  }
  // hatching in the deep band
  d.hatch(rectPts(-2, 30, 484, 12), { angle: -62, spacing: 6, color: "K", width: 0.9, skip: 0.6, short: 0.7, inset: 1.5 })
  // bubbles
  d.seed("bubbles")
  for (let i = 0; i < 16; i++) {
    const x = 14 + i * 29 + (d.rng() - 0.5) * 16, y = 13 + d.rng() * 17, r = 2 + d.rng() * 3.2
    if (r > 3.6) {
      d.stroke(arcPts(x, y, r, r, -0.2 * PI, 1.6 * PI, 16), { color: "w", width: 1.3, taper: [0.2, 0.3], wobble: 0.2 })
      d.dot(x - r * 0.35, y - r * 0.35, 0.9, "w")
    } else d.blob(ellipsePts(x, y, r * 0.7, r * 0.7, 10), { fill: "C", ink: "w", weight: 0.9, wobble: 0.2 })
  }
})

// ---------- Currency icons (56x56) ----------
asset("icon_iron", { w: 56, h: 56 }, (d) => {
  d.seed("chunk")
  const chunk = d.shape(fillet([[8, 31], [15, 15], [29, 9], [43, 13], [49, 27], [45, 42], [30, 48], [14, 44]], 3), { wobble: 0.7 })
  d.fill(chunk, "s")
  d.fill([[13, 28], [17, 17], [29, 12], [40, 15], [33, 24], [20, 29]], "S", { wobble: 0.5 })      // lit top facet
  d.fill([[34, 25], [42, 16], [47, 28], [43, 40], [32, 45], [30, 34]], "n", { wobble: 0.5 })      // shade facet
  d.hatch([[36, 27], [45, 25], [44, 40], [32, 44], [32, 34]], { angle: -62, spacing: 3, color: "K", width: 1.1 })
  d.stroke([[20, 29], [33, 24], [42, 16]], { color: "n", width: 1.2, taper: [0.1, 0.2] })          // facet edges
  d.stroke([[33, 24], [30, 34], [32, 45]], { color: "K", width: 1.2, taper: [0.1, 0.2] })
  d.stroke([[17, 17], [27, 12.5]], { color: "z", width: 1.6, taper: [0.3, 0.4] })                  // lit rim
  d.seed("flecks")
  for (const [x, y, s] of [[22, 20, 3.6], [15, 34, 3], [26, 37, 2.6], [39, 21, 2.2]]) {          // silver veins
    d.fill([[x - s, y + 0.4], [x - s * 0.2, y - s * 0.7], [x + s, y - 0.2], [x + s * 0.1, y + s * 0.7]], "z", { wobble: 0.2 })
    d.stroke([[x - s * 0.6, y], [x + s * 0.2, y - s * 0.4]], { color: "w", width: 1.3, taper: [0.2, 0.3], wobble: 0.1 })
    d.stroke([[x - s * 0.1, y + s * 0.8], [x + s * 1.05, y + 0.1]], { color: "n", width: 0.9, taper: [0.2, 0.2], wobble: 0.1 })
  }
  for (const [x, y, r] of [[23, 29, 2.2], [40, 34, 1.8], [12, 27, 1.3], [33, 41, 1.4]]) {           // rust stains
    d.fill(ellipsePts(x, y, r * 1.4, r, 9), "o", { wobble: 0.35 })
    d.dot(x - r * 0.35, y - r * 0.3, r * 0.5, "O")
  }
  d.ink(chunk, { weight: 2.4 })
})

asset("icon_sapphire", { w: 56, h: 56 }, (d) => {
  d.seed("gem")
  const T = 14, M = 24, B = 50                                    // table, girdle, point
  const gem = d.shape([[17, T], [39, T], [50, M], [28, B], [6, M]], { wobble: 0.4, step: 1.5 })
  d.fill(gem, "B")
  d.fill([[17, T], [23, T], [19, M], [6, M]], "C", { wobble: 0.2 })        // crown, left (lit)
  d.fill([[23, T], [33, T], [36, M], [19, M]], "C", { wobble: 0.2 })        // table
  d.fill([[33, T], [39, T], [50, M], [36, M]], "b", { wobble: 0.2 })        // crown, right
  d.fill([[6, M], [19, M], [28, B]], "B", { wobble: 0.2 })                  // pavilion, left
  d.fill([[19, M], [36, M], [28, B]], "b", { wobble: 0.2 })                 // pavilion, middle
  d.fill([[36, M], [50, M], [28, B]], "K", { wobble: 0.2 })                 // pavilion, right (shade)
  d.hatch([[37, M + 1], [48, M + 1], [30, B - 3]], { angle: -55, spacing: 2.8, color: "k", width: 1 })
  for (const seg of [[[23, T], [19, M], [28, B]], [[33, T], [36, M], [28, B]], [[6, M], [50, M]]])
    d.stroke(seg, { color: "K", width: 1.1, taper: [0.05, 0.05], wobble: 0.2 })
  d.stroke([[19, 18], [24, 16]], { color: "w", width: 2, taper: [0.3, 0.3] })                       // glints
  d.stroke([[13, 27], [20, 37]], { color: "w", width: 1.6, taper: [0.2, 0.5] })
  d.dot(30, 18.5, 1.2, "w")
  d.ink(gem, { weight: 2.4 })
})

asset("icon_fang", { w: 56, h: 56 }, (d) => {
  d.seed("fang")
  // a curved tooth along a bent centerline: wide root on top, tip curling down-left
  const P0 = [31, 9], P1 = [45, 36], P2 = [9, 50]
  const at = (t) => {
    const u = 1 - t, p = [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]]
    const tx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), ty = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), L = Math.hypot(tx, ty)
    return { p, n: [ty / L, -tx / L], hw: 10.5 * Math.pow(Math.max(0, 1 - t), 0.75) + 0.4 }   // n: toward the outer (right) side
  }
  const band = (k0, k1, t0 = 0, t1 = 1, N = 20) => {                                          // between two offsets (-1 inner .. 1 outer)
    const a = [], b = []
    for (let i = 0; i <= N; i++) {
      const t = t0 + (t1 - t0) * i / N, { p, n, hw } = at(t)
      a.push([p[0] + n[0] * hw * k0, p[1] + n[1] * hw * k0]); b.push([p[0] + n[0] * hw * k1, p[1] + n[1] * hw * k1])
    }
    return [...a, ...b.reverse()]
  }
  const fang = d.shape(band(-1, 1), { wobble: 0.5 })
  d.fill(fang, "w")
  d.fill(band(0.25, 1.1, 0.1, 1), "z", { wobble: 0.3 })                                       // shadow side (outer curve)
  d.hatch(band(0.45, 0.95, 0.3, 0.85, 12), { angle: -35, spacing: 2.8, color: "S", width: 1 })
  d.fill(band(-0.98, 0.98, 0.005, 0.13, 6), "c", { wobble: 0.2 })                               // root
  const g0 = at(0.13)
  d.stroke([-0.85, 0, 0.85].map((k) => [g0.p[0] + g0.n[0] * g0.hw * k, g0.p[1] + g0.n[1] * g0.hw * k + 0.4 * (1 - Math.abs(k))]), { color: "E", width: 1.4, taper: [0.15, 0.15], wobble: 0.3 })
  const ridge = []
  for (let i = 0; i <= 8; i++) { const { p, n, hw } = at(0.2 + 0.55 * i / 8); ridge.push([p[0] - n[0] * hw * 0.45, p[1] - n[1] * hw * 0.45]) }
  d.stroke(ridge, { color: "z", width: 1.2, taper: [0.3, 0.6], wobble: 0.2 })                 // enamel ridge on the lit side
  d.ink(fang, { weight: 2.4 })
})

// ---------- E keycap (64x64) ----------
asset("ui_key_e", { w: 64, h: 64 }, (d) => {
  d.seed("cap")
  const cap = d.shape(roundRect(5, 5, 54, 54, 10), { wobble: 0.5 })
  d.fill(cap, "S")
  d.fill([[8, 46], [56, 46], [56, 56], [8, 56]], "s", { wobble: 0.3 })                                // front skirt in shade
  d.fill([[50, 10], [56, 12], [56, 52], [50, 48]], "s", { wobble: 0.3 })                               // right skirt
  d.hatch([[50, 40], [56, 40], [56, 56], [42, 56]], { angle: -60, spacing: 3, color: "n", width: 1 })
  const top = d.shape(roundRect(11, 8, 39, 38, 7), { wobble: 0.4 })
  d.fill(top, "z")
  d.fill([[13, 10.5], [47, 10.5], [47, 14], [13, 14]], "w", { wobble: 0.3 })                          // lit edge
  d.fill([[13, 10.5], [16, 10.5], [16, 42], [13, 42]], "w", { wobble: 0.3 })
  d.ink(top, { color: "n", weight: 1.3, lit: 0.3 })
  d.seed("letter")
  glyph(d, "E", 25.2, 16.5, 0.78, "k", 5.2)
  d.ink(cap, { weight: 2.6 })
})
