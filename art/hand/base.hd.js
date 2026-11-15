include("_lib.hd.js")
// The base, hand-drawn (style test, see docs/GDD.md §7). Units are screen pixels at 1920x1080,
// 4x the game's logical pixels: the pixel barrel is 20x24 logical, so this one is ~80x100.
// Look: heavy dark ink that thickens on the bottom-right (light from the top-left), flat fills,
// shadow sides hatched by hand, a little wobble on every line.

const PI = Math.PI
const S = 4                                                  // logical px -> screen px
const L = (pts) => pts.map(([x, y]) => [x * S, y * S])

// ---------- Ground: one painting for the whole 640x416 map ----------
// The path in logical pixels: from the mine entrance down into a worn clearing, on to the
// bottom of the map, with a branch curving left past the stall. Clockwise from the entrance.
// base_area.gd only needs the cliff line (y = 96).
const PATH = [
  [288, 92], [352, 92], [350, 120], [356, 150], [366, 176], [394, 186], [428, 192], [452, 206],
  [462, 230], [457, 256], [438, 276], [406, 288], [372, 293], [357, 306], [352, 336], [359, 372],
  [354, 424], [290, 424], [285, 380], [292, 340], [287, 307], [268, 294], [232, 290], [204, 280],
  [188, 260], [184, 236], [190, 212], [160, 201], [120, 197], [86, 195], [62, 189], [52, 176],
  [58, 163], [78, 158], [112, 161], [152, 164], [200, 166], [240, 170], [268, 166], [284, 150],
  [289, 120],
]
const FACE_TOP = 64 * S, FACE_BOT = 96 * S                   // the cliff face (row 2 of the old tiles)

const flower = (d, x, y, petal) => {
  d.stroke([[x, y + 2], [x + 1, y + 7]], { color: "h", width: 1.4, taper: [0, 0.5] })
  for (let i = 0; i < 5; i++) { const a = i * 2 * PI / 5 + 0.3; d.dot(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.2, 2.1, petal) }
  d.dot(x, y, 1.5, "Y")
}

asset("ground", { w: 640 * S, h: 416 * S }, (d) => {
  const W = 640 * S, H = 416 * S
  const grassy = noise2(11, 260), sunny = noise2(5, 140), stony = noise2(23, 90)
  d.fill(rectPts(0, 0, W, H), "g", { wobble: 0 })

  // ---- lush patches: darker grass where the noise dips; blades blend their edges ----
  d.seed("patches")
  const patches = []
  for (let y = FACE_BOT + 40; y < H + 60; y += 110) {
    for (let x = -40; x < W + 60; x += 120) {
      const px = x + (d.rng() - 0.5) * 80, py = y + (d.rng() - 0.5) * 70
      if (grassy(px, py) > -0.4) continue
      const s = d.shape(ellipsePts(px, py, 40 + d.rng() * 50, 24 + d.rng() * 24, 24), { wobble: 9, wave: 50, step: 6 })
      d.fill(s, "h")
      patches.push(s)
    }
  }
  for (const s of patches) {                                                       // fringe of blades
    for (let i = 0; i < s.pts.length; i += 2) {
      const [x, y] = s.pts[i], [nx, ny] = s.n[i]
      if (ny < -0.2) tuft(d, x - nx * 2, y - ny * 2, { n: 2 + Math.floor(d.rng() * 2), h: 8 + d.rng() * 7, color: "h", width: 2.2, spread: 0.6 })
      else if (d.rng() < 0.6) tuft(d, x - nx * 3, y - ny * 3, { n: 2, h: 7 + d.rng() * 5, color: "g", width: 1.8, spread: 0.6 })
    }
  }
  const inPatch = (x, y) => patches.some((s) => inside([x, y], s.pts))

  // ---- path ----
  d.seed("path")
  const outline = fillet(L(PATH), 40)
  const path = d.shape(outline, { wobble: 8, wave: 90, step: 5 })
  d.fill(path, "e")
  const inner = d.offset(d.shape(outline, { wobble: 9, wave: 50, step: 5 }), -10)
  d.fill(inner, "E")
  const onPath = (x, y) => inside([x, y], inner.pts)
  const onGrass = (x, y) => y > FACE_BOT + 14 && !inside([x, y], path.pts)
  // cart ruts down the main path, worn away in places
  for (const rx of [308 * S, 332 * S]) {
    for (let y = FACE_BOT + 20; y < H; ) {
      const len = 60 + d.rng() * 120
      d.stroke([[rx + (d.rng() - 0.5) * 4, y], [rx + (d.rng() - 0.5) * 6, y + len / 2], [rx + (d.rng() - 0.5) * 4, y + len]], { color: "e", width: 2.4, wobble: 1, taper: [0.15, 0.15] })
      y += len + 20 + d.rng() * 50
    }
  }
  // scuffs and pebbles, gathered where the path is stony
  for (let i = 0; i < 3000; i++) {
    const x = d.rng() * W, y = d.rng() * H
    if (!onPath(x, y) || stony(x, y) < -0.25 || d.rng() < 0.5) continue
    if (d.rng() < 0.35) {
      const a = (d.rng() - 0.5) * 0.8, l = 6 + d.rng() * 8
      d.stroke([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "e", width: 1.5, taper: [0.3, 0.4] })
    } else {
      const r = 2 + d.rng() * 3
      d.blob(ellipsePts(x, y, r * 1.3, r, 10), { fill: d.rng() < 0.6 ? "c" : "e", ink: "D", weight: 1, wobble: 0.3 })
    }
  }

  // ---- grass: tufts gathered in lush patches, lighter blades where the sun falls ----
  d.seed("grass")
  for (let i = 0; i < 3200; i++) {
    const x = d.rng() * W, y = d.rng() * H
    const lush = grassy(x, y) * 0.5 + 0.5
    if (!onGrass(x, y) || d.rng() > 0.25 + 0.75 * (1 - lush)) continue
    const dark = inPatch(x, y)
    const color = dark ? (d.rng() < 0.7 ? "g" : "j") : (sunny(x, y) > 0.25 ? "G" : "h")
    tuft(d, x, y, { n: 3 + Math.floor(d.rng() * 3), h: 10 + d.rng() * 9, color, width: 1.9 })
  }
  // grass creeping over the path edge
  for (let i = 0; i < path.pts.length; i += 4) {
    const [x, y] = path.pts[i], [nx, ny] = path.n[i]
    if (y < FACE_BOT + 8 || d.rng() < 0.3) continue
    const out = 2 + d.rng() * 5
    tuft(d, x + nx * out, y + ny * out, { n: 3, h: 9 + d.rng() * 5, color: "h", width: 1.8 })
    if (d.rng() < 0.4) tuft(d, x - nx * 4, y - ny * 4, { n: 2, h: 7 + d.rng() * 4, color: "g", width: 1.6 })
  }
  for (let i = 0; i < 160; i++) {                                                  // flowers
    const x = d.rng() * W, y = d.rng() * H
    if (!onGrass(x, y) || sunny(x, y) < 0.15) continue
    flower(d, x, y, ["w", "y", "q", "w"][Math.floor(d.rng() * 4)])
  }
  for (let i = 0; i < 40; i++) {                                                   // stones
    const x = d.rng() * W, y = d.rng() * H
    if (!onGrass(x, y) || stony(x, y) < 0.3) continue
    rock(d, x, y, 5 + d.rng() * 5, 3.5 + d.rng() * 3, { weight: 1.4, cracks: 0 })
  }

  // ---- cliff: turf plateau on top, a face of stacked boulders, contact shadow at the foot ----
  d.seed("cliff")
  d.fill([[0, FACE_BOT - 6], [W, FACE_BOT - 6], [W, FACE_BOT + 16], [0, FACE_BOT + 16]], "h", { wobble: 4, wave: 50 })
  d.fill(rectPts(-4, FACE_TOP - 24, W + 8, FACE_BOT - FACE_TOP + 22), "n", { wobble: 0 })
  for (let x = 0; x < W; x += 30) {                                                // deep crevices
    d.stroke([[x + d.rng() * 20, FACE_TOP + 10], [x + d.rng() * 20, FACE_BOT - 6]], { color: "K", width: 6 + d.rng() * 6, taper: [0.1, 0.1], wobble: 3 })
  }
  // three rows of boulders of very different sizes; the lower rows are nearer and bigger
  for (const [row, y0, rmin, rmax] of [[0, FACE_TOP + 18, 20, 46], [1, FACE_TOP + 56, 26, 58], [2, FACE_TOP + 98, 30, 70]]) {
    for (let x = -60 + row * 23; x < W + 60; ) {
      const big = d.rng() < 0.15, rx = big ? rmax * 1.25 : rmin + d.rng() * (rmax - rmin)
      const ry = rx * (0.55 + d.rng() * 0.25)
      rock(d, x + rx, y0 + (d.rng() - 0.5) * 18 - (big ? ry * 0.2 : 0), rx, ry, { weight: 2 + row * 0.35, cracks: row })
      x += rx * (1.3 + d.rng() * 0.6)
    }
  }
  for (let i = 0; i < 14; i++) {                                                   // fallen rocks at the foot
    const x = d.rng() * W
    if (Math.abs(x - 320 * S) < 200) continue
    rock(d, x, FACE_BOT + 4 + d.rng() * 10, 8 + d.rng() * 12, 6 + d.rng() * 6, { weight: 1.8, cracks: 0 })
  }
  // turf plateau with an overhanging, scalloped lip
  const lip = [[-4, -4], [W + 4, -4]]
  for (let x = W + 4; x > -4; x -= 22) lip.push([x, FACE_TOP + 2 + Math.sin(x * 0.011) * 10 + Math.sin(x * 0.05) * 4 + d.rng() * 8])
  lip.push([-4, FACE_TOP + 8])
  const turf = d.shape(lip, { wobble: 1.5, wave: 30 })
  d.fill(turf, "h")
  for (let i = 0; i < 700; i++) {
    const x = d.rng() * W, y = d.rng() * (FACE_TOP - 16)
    if (d.rng() > 0.3 + 0.6 * (grassy(x, y) * 0.5 + 0.5)) continue
    tuft(d, x, y, { n: 3 + Math.floor(d.rng() * 2), h: 10 + d.rng() * 6, color: sunny(x, y) > 0.2 ? "G" : "g", width: 1.8 })
  }
  const edge = lip.slice(2)
  d.stroke(edge, { color: "k", width: 3, taper: [0, 0], wobble: 1.2, vary: 0.4 })
  for (let i = 0; i < edge.length - 1; i++) {                                     // grass hanging over the rocks
    const [x0, y0] = edge[i], [x1, y1] = edge[i + 1]
    for (let k = 0; k < 2; k++) {
      const t = d.rng(), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - 2
      tuft(d, x, y, { n: 3, h: 10 + d.rng() * 9, color: d.rng() < 0.6 ? "h" : "g", width: 2, dir: -1, spread: 0.7 })
    }
  }
  for (let i = 0; i < 9; i++) {                                                    // vines
    const x = 120 + d.rng() * (W - 240), len = 40 + d.rng() * 70, sway = (d.rng() - 0.5) * 14
    if (Math.abs(x - 320 * S) < 220) continue                                     // keep the entrance clear
    const pts = [[x, FACE_TOP + 4], [x + sway, FACE_TOP + 4 + len * 0.5], [x - sway * 0.4, FACE_TOP + 4 + len]]
    d.stroke(pts, { color: "h", width: 2.6, taper: [0, 0.4], wobble: 1.2 })
    for (let k = 1; k <= 4; k++) {
      const [lx, ly] = [x + sway * Math.sin(k * 0.7), FACE_TOP + 4 + len * k / 5], side = k % 2 ? 1 : -1
      d.blob(ellipsePts(lx + side * 4, ly, 4, 2.4, 10), { fill: "g", ink: "h", weight: 1, wobble: 0.3 })
    }
  }
})

asset("barrel", { w: 84, h: 104 }, (d) => {
  const top = 13, bottom = 88, mid = (top + bottom) / 2, half = (bottom - top) / 2
  const B = cylinder({ cx: 42, top, bottom, hw: (y) => 34 - 4 * ((y - mid) / half) ** 2 })

  // ---- staves ----
  const body = d.shape(B.silhouette(), { wobble: 0.8 })
  d.fill(body, "e")
  d.fill(B.strip(0.64 * PI, 0.79 * PI, top, bottom - 2), "E", { wobble: 0.6 })     // lit stave
  d.fill(B.strip(0.02 * PI, 0.26 * PI), "D", { wobble: 0.6 })                       // shadow side
  d.hatch(B.strip(0.2 * PI, 0.46 * PI, top + 4, bottom - 2), { angle: -72, spacing: 3.2, color: "D", width: 1.3 })
  d.hatch(B.band(81, bottom - 1, 0, 0.3 * PI, 0.75 * PI), { angle: -72, spacing: 3.6, color: "D", width: 1.1, short: 0.6 }) // dirt at the foot
  for (const y of [29, 77]) d.fill(B.band(y, y + 2.6, 0, 0.03 * PI, 0.97 * PI), "D", { wobble: 0.4 })     // hoop shadows
  for (let i = 1; i <= 5; i++) {                                                      // stave joints, uneven
    const t = (i + (d.rng() - 0.5) * 0.35) * PI / 6
    d.stroke(B.meridian(t, top + 3, bottom - 1 - d.rng() * 3), { color: "d", width: i < 3 ? 1.7 : 1.3, taper: [0.06, 0.14] })
  }
  for (const [t, y0, y1] of [[0.73, 40, 50], [0.56, 56, 68], [0.9, 48, 63], [0.4, 37, 47], [0.62, 32, 40], [0.86, 80, 86]]) {
    d.stroke(B.meridian(t * PI, y0, y1), { color: "D", width: 1.1, wobble: 0.9 })   // grain
  }
  // a knot, with the grain bending around it
  const [kx, ky] = B.at(0.72 * PI, 57)
  d.stroke([[kx - 1, ky - 9], [kx - 3.5, ky - 2], [kx - 3, ky + 3], [kx - 1, ky + 8]], { color: "D", width: 1 })
  d.stroke([[kx + 2, ky - 8], [kx + 3.8, ky - 1], [kx + 3.2, ky + 3], [kx + 1.5, ky + 9]], { color: "D", width: 1 })
  d.blob(ellipsePts(kx, ky, 2, 1.4, 12), { fill: "D", ink: "d", weight: 0.9, wobble: 0.3 })
  d.ink(body, { weight: 2.8 })
  // a loose second pass of the pen on the shadow side
  d.stroke(B.meridian(0, 40, 66).map(([x, y]) => [x + 4.6, y]), { color: "k", width: 1.1, taper: [0.4, 0.4], wobble: 0.5 })

  // ---- iron hoops ----
  for (const [y0, y1] of [[22, 29], [70, 77]]) {
    const hoop = d.shape(B.band(y0, y1, 1.6), { wobble: 0.4 })
    d.fill(hoop, "s")
    d.fill(B.band(y0 + 0.4, y1 - 0.4, 1.6, 0, 0.3 * PI), "n", { wobble: 0.3 })       // shadow end
    d.stroke(B.ring(y0 + 1.8, 0.56 * PI, 0.93 * PI, 1.6), { color: "z", width: 1.3, taper: [0.3, 0.3] })
    for (const t of [0.8, 0.52, 0.27]) {                                              // rivets
      const [x, y] = B.at(t * PI, (y0 + y1) / 2, 1.6)
      d.dot(x + 0.4, y + 0.5, 1.3, "k"); d.dot(x, y, 0.9, "z")
    }
    d.ink(hoop, { weight: 1.7 })
  }

  // ---- top: stave ends around a recessed lid ----
  const rim = d.shape(B.cap(1), { wobble: 0.6 })
  d.fill(rim, "E")
  const lid = d.shape(B.cap(0.8, 0.7), { wobble: 0.5 })
  d.fill(lid, "e")
  // the rim's top-left inner wall shades the far side of the lid
  const lx = 42, ly = top + 0.7, rx = 24, ry = 24 * 0.34
  d.fill([...arcPts(lx, ly, rx, ry, 0.92 * PI, 1.96 * PI, 20), ...arcPts(lx + 2, ly + 2.2, rx - 1, ry - 0.6, 1.96 * PI, 0.92 * PI, 20)], "D", { wobble: 0.3 })
  for (const dy of [-2.8, 2.6]) {                                                     // lid planks
    const w = rx * Math.sqrt(1 - (dy / ry) ** 2) - 1.5
    d.stroke([[lx - w, ly + dy], [lx + w, ly + dy + 0.4]], { color: "D", width: 1.2, taper: [0.1, 0.1] })
  }
  for (let i = 0; i < 12; i++) {                                                      // stave ends
    const t = (i + 0.5) * PI / 6
    d.stroke([B.capAt(t, 1, 0), B.capAt(t, 0.82, 0.7)], { color: "e", width: 1.1, wobble: 0.2, taper: [0, 0.2] })
  }
  d.ink(lid, { color: "d", weight: 1.1, lit: -0.4 })
  d.ink(rim, { weight: 2.3 })
})

// ---------- Mine entrance (96x80 logical) set into the cliff ----------
// Hand lettering: strokes in a 10x14 box.
const GLYPHS = {
  M: [[[0, 14], [0, 0], [5, 8], [10, 0], [10, 14]]],
  I: [[[5, 0], [5, 14]], [[2, 0], [8, 0]], [[2, 14], [8, 14]]],
  N: [[[0, 14], [0, 0], [10, 14], [10, 0]]],
  A: [[[0, 14], [5, 0], [10, 14]], [[2.4, 8.6], [7.6, 8.6]]],
}
const letters = (d, text, x, y, s, color) => {
  for (const ch of text) {
    for (const seg of GLYPHS[ch]) d.stroke(seg.map(([gx, gy]) => [x + gx * s, y + gy * s]), { color, width: s * 1.5, taper: [0.04, 0.04], wobble: 0.4, vary: 0.15 })
    x += 14 * s
  }
}

asset("mine_entrance", { w: 384, h: 320 }, (d) => {
  // ---- the tunnel: dark, a second timber frame deeper in, rails running into the dark ----
  d.seed("tunnel")
  d.fill(roundRect(52, 56, 280, 274, 8), "k", { wobble: 1 })
  d.fill([[64, 330], [320, 330], [238, 168], [146, 168]], "K", { wobble: 2 })             // floor in daylight
  for (const x of [128, 240]) plank(d, x, 112, 16, 70, { fill: "D", lit: "e", dark: "d", grain: "d", ink: "k", weight: 1.4, knots: 0 })
  plank(d, 120, 100, 144, 16, { vertical: false, fill: "D", lit: "e", dark: "d", grain: "d", ink: "k", weight: 1.4, knots: 0 })
  for (let i = 0; i < 8; i++) {                                                            // sleepers
    const t = i / 7, y = 178 + 142 * t ** 1.4, half = 46 + 70 * t, h = 4 + 8 * t
    plank(d, 192 - half, y - h / 2, half * 2, h, { vertical: false, fill: "D", lit: "e", dark: "d", grain: "d", weight: 1 + t, knots: 0, wobble: 0.4 })
  }
  for (const [x0, x1] of [[122, 166], [262, 218]]) {                                       // rails
    d.stroke([[x0, 330], [x1, 172]], { color: "k", width: 9, taper: [0, 0.8], wobble: 0.4 })
    d.stroke([[x0, 330], [x1, 174]], { color: "s", width: 5, taper: [0, 0.8], wobble: 0.4 })
    d.stroke([[x0 - 1, 330], [x1 - 0.5, 176]], { color: "z", width: 1.6, taper: [0, 0.8], wobble: 0.3 })
  }
  d.hatch([[56, 60], [120, 60], [100, 330], [56, 330]], { angle: -75, spacing: 4, color: "K", width: 1.4, short: 0.5 })

  // ---- timber frame ----
  d.seed("frame")
  plank(d, 22, 44, 40, 280, { weight: 2.6 })
  plank(d, 322, 44, 40, 280, { weight: 2.6 })
  for (const [a, b, c] of [[[60, 58], [110, 58], [60, 108]], [[324, 58], [274, 58], [324, 108]]]) {   // corner braces
    const s = d.shape([a, b, c], { wobble: 0.6 })
    d.fill(s, "e"); d.stroke([[(a[0] + b[0]) / 2, a[1] + 6], [(a[0] + c[0]) / 2 + 2, (a[1] + c[1]) / 2]], { color: "D", width: 1.2 })
    d.ink(s, { weight: 2 })
  }
  plank(d, 6, 18, 372, 44, { vertical: false, weight: 2.8, knots: 2 })
  for (const x of [30, 52, 332, 354]) nail(d, x, 40)

  // ---- sign ----
  d.seed("sign")
  plank(d, 122, 6, 140, 50, { vertical: false, fill: "E", lit: "c", dark: "e", grain: "e", weight: 2.4, knots: 0 })
  letters(d, "MINA", 140, 17, 2, "d")
  for (const [x, y] of [[130, 14], [254, 14], [130, 48], [254, 48]]) nail(d, x, y, 1.5)

  // ---- lantern hanging from the left post ----
  d.seed("lantern")
  d.stroke([[60, 76], [78, 76], [78, 88]], { color: "k", width: 2.4, taper: [0, 0], wobble: 0.3 })
  d.blob([[68, 88], [88, 88], [84, 96], [72, 96]], { fill: "D", weight: 1.6, wobble: 0.3 })
  d.blob(roundRect(68, 96, 20, 24, 2), { fill: "Y", weight: 1.8, wobble: 0.3 })
  d.blob(ellipsePts(78, 109, 4, 6, 12), { fill: "y", ink: null, wobble: 0.4 })
  d.stroke([[72, 99], [72, 108]], { color: "w", width: 1.8, taper: [0.2, 0.4] })
  d.stroke([[78, 97], [78, 119]], { color: "D", width: 1.6, taper: [0, 0] })
  d.blob(roundRect(66, 119, 24, 5, 2), { fill: "D", weight: 1.6, wobble: 0.3 })
})

// ---------- Merchant's stall (80x68 logical) ----------
asset("stall", { w: 320, h: 272 }, (d) => {
  d.seed("posts")
  plank(d, 18, 40, 22, 150, { weight: 2.2 })
  plank(d, 280, 40, 22, 150, { weight: 2.2 })

  // ---- striped awning with a scalloped valance ----
  d.seed("awning")
  const top = (x) => 12 + 6 * Math.sin(PI * x / 320)
  const stripes = 8, sw = 304 / stripes, x0 = 8
  const outline = [[x0, top(x0)], [x0 + stripes * sw, top(x0 + stripes * sw)]]
  for (let i = stripes - 1; i >= 0; i--) {
    const a = x0 + i * sw
    outline.push(...arcPts(a + sw / 2, 72, sw / 2, 16, 0, PI, 10))
  }
  const awning = d.shape(outline, { wobble: 1 })
  for (let i = 0; i < stripes; i++) {
    const a = x0 + i * sw, red = i % 2 === 0
    d.fill([[a, top(a) - 2], [a + sw, top(a + sw) - 2], [a + sw, 72], ...arcPts(a + sw / 2, 72, sw / 2, 16, 0, PI, 10), [a, 72]], red ? "R" : "c", { wobble: 0.4 })
    d.fill([[a, 60], [a + sw, 60], [a + sw, 72], ...arcPts(a + sw / 2, 72, sw / 2, 16, 0, PI, 10), [a, 72]], red ? "r" : "E", { wobble: 0.4 })
    d.stroke([[a + 6, top(a) + 6], [a + sw * 0.5, top(a + sw * 0.5) + 4]], { color: red ? "x" : "w", width: 2, taper: [0.3, 0.5] })
    if (i > 0) d.stroke([[a, top(a)], [a, 74]], { color: "k", width: 1.4, taper: [0, 0.2] })
  }
  d.hatch([[x0 + sw * 6, 20], [x0 + stripes * sw, 20], [x0 + stripes * sw, 70], [x0 + sw * 6, 70]], { angle: -70, spacing: 4, color: "k", width: 1, skip: 0.2 })
  d.ink(awning, { weight: 2.6 })

  // ---- counter ----
  d.seed("counter")
  const front = d.shape(rectPts(10, 170, 300, 98), { wobble: 0.8 })
  d.fill(front, "e")
  d.fill(rectPts(12, 172, 16, 94), "E", { wobble: 0.4 })
  d.fill(rectPts(262, 172, 46, 94), "D", { wobble: 0.4 })
  d.hatch(rectPts(200, 176, 70, 88), { angle: -72, spacing: 4, color: "D", width: 1.2 })
  for (const x of [60, 110, 160, 210, 260]) d.stroke([[x, 174], [x + (d.rng() - 0.5) * 2, 266]], { color: "d", width: 1.6, taper: [0.04, 0.08] })
  for (let i = 0; i < 6; i++) {
    const x = 20 + d.rng() * 270, y = 182 + d.rng() * 60
    d.stroke([[x, y], [x + 1, y + 14 + d.rng() * 10]], { color: "D", width: 1, wobble: 0.8 })
  }
  d.fill(rectPts(10, 254, 300, 14), "D", { wobble: 0.5 })
  d.ink(front, { weight: 2.6 })
  const board = plank(d, 4, 150, 312, 24, { vertical: false, fill: "c", lit: "c", dark: "E", grain: "E", weight: 2.4, knots: 0 })

  // ---- goods on the counter: iron ore, a pickaxe, a jar of sapphires ----
  d.seed("goods")
  for (const [x, y, rx, ry] of [[52, 150, 20, 14], [84, 152, 18, 12], [68, 136, 16, 12]]) {
    rock(d, x, y, rx, ry, { weight: 1.8, cracks: 0 })
    for (let i = 0; i < 3; i++) d.dot(x + (d.rng() - 0.5) * rx, y + (d.rng() - 0.5) * ry * 0.8, 1.6, d.rng() < 0.3 ? "O" : "w")
  }
  d.stroke([[150, 158], [196, 104]], { color: "k", width: 9, taper: [0, 0], wobble: 0.4 })
  d.stroke([[150, 158], [196, 104]], { color: "e", width: 5, taper: [0, 0], wobble: 0.4 })
  d.stroke([[152, 154], [190, 110]], { color: "E", width: 1.6, taper: [0.2, 0.2] })
  d.blob([[166, 92], [184, 96], [200, 100], [218, 112], [226, 128], [214, 118], [198, 110], [190, 112], [178, 104], [162, 102], [148, 110], [154, 98]], { fill: "S", weight: 2, wobble: 0.4 })
  d.stroke([[160, 98], [186, 98], [204, 106]], { color: "z", width: 1.8, taper: [0.2, 0.4] })
  const jar = d.shape(roundRect(226, 104, 44, 56, 10), { wobble: 0.6 })
  d.fill(jar, "b")
  for (const [x, h, w] of [[234, 30, 10], [244, 40, 12], [256, 26, 9]]) {
    d.blob([[x, 158], [x + w / 2, 158 - h], [x + w, 158]], { fill: "B", ink: "K", weight: 1.2, wobble: 0.3 })
    d.stroke([[x + 1.5, 156], [x + w / 2, 160 - h]], { color: "C", width: 1.6, taper: [0.1, 0.4] })
  }
  d.stroke([[232, 116], [232, 148]], { color: "w", width: 2.4, taper: [0.3, 0.3] })
  d.ink(jar, { weight: 2 })
  d.blob(roundRect(230, 96, 36, 10, 3), { fill: "S", weight: 1.8, wobble: 0.4 })
  void board
})

// ---------- Small props ----------
asset("crate", { w: 88, h: 88 }, (d) => {
  d.seed("crate")
  const box = d.shape(rectPts(6, 8, 76, 76), { wobble: 0.6 })
  d.fill(box, "D")
  plank(d, 6, 8, 76, 24, { vertical: false, fill: "E", lit: "c", dark: "e", grain: "e", weight: 1.8, knots: 0 })
  for (const y of [32, 50, 68]) plank(d, 6, y, 76, 16, { vertical: false, weight: 1.6, knots: d.rng() < 0.4 ? 1 : 0 })
  const brace = d.shape([[10, 80], [20, 80], [78, 36], [78, 30], [68, 32], [10, 74]], { wobble: 0.5 })
  d.fill(brace, "E"); d.stroke([[20, 74], [70, 38]], { color: "e", width: 1.2 }); d.ink(brace, { weight: 1.6 })
  d.hatch([[60, 34], [80, 34], [80, 82], [60, 82]], { angle: -72, spacing: 3.6, color: "d", width: 1.1, skip: 0.2 })
  for (const [x, y] of [[12, 38], [76, 38], [12, 78], [76, 78], [12, 14], [76, 14]]) nail(d, x, y, 1.4)
  d.ink(box, { weight: 2.6 })
})

asset("lamp_post", { w: 48, h: 160 }, (d) => {
  d.seed("lamp")
  plank(d, 19, 52, 10, 96, { weight: 1.8, knots: 0 })
  plank(d, 12, 140, 24, 16, { vertical: false, fill: "D", lit: "e", dark: "d", grain: "d", weight: 2, knots: 0 })
  d.blob(roundRect(14, 46, 20, 8, 2), { fill: "D", weight: 1.6, wobble: 0.3 })                 // bracket
  d.blob(roundRect(10, 16, 28, 32, 3), { fill: "D", weight: 2, wobble: 0.4 })                  // lantern frame
  d.blob(roundRect(14, 20, 20, 24, 2), { fill: "Y", ink: "d", weight: 1, wobble: 0.3 })
  d.blob(ellipsePts(24, 33, 4.5, 7, 12), { fill: "y", ink: null, wobble: 0.4 })
  d.stroke([[17, 23], [17, 34]], { color: "w", width: 2, taper: [0.2, 0.4] })
  d.stroke([[24, 21], [24, 43]], { color: "D", width: 1.8, taper: [0, 0] })
  d.blob([[8, 16], [40, 16], [32, 6], [16, 6]], { fill: "D", weight: 2, wobble: 0.4 })            // cap
  d.dot(24, 4, 3, "k"); d.dot(23.5, 3.5, 1.6, "e")
})

asset("bush", { w: 136, h: 96 }, (d) => {
  const clump = (cx, cy, r, berries) => {
    d.seed("clump" + cx)
    const ph = d.rng() * 6
    const pts = Array.from({ length: 40 }, (_, i) => {
      const t = i / 40 * 2 * PI, k = r * (0.9 + 0.14 * Math.abs(Math.sin(t * 5 + ph)))
      return [cx + Math.cos(t) * k, cy + Math.sin(t) * k * 0.8]
    })
    const s = d.shape(pts, { wobble: 0.8 })
    d.fill(s, "h")
    d.fill(ellipsePts(cx - r * 0.18, cy - r * 0.22, r * 0.62, r * 0.46, 20), "g", { wobble: 1.5 })
    d.hatch(crescent(cx, cy, r * 0.85, r * 0.68, { shift: 0.35 }), { angle: -60, spacing: 3.4, color: "j", width: 1.2 })
    for (let i = 0; i < 5; i++) {                                                           // lit leaves
      const a = PI * (1.05 + d.rng() * 0.45), lx = cx + Math.cos(a) * r * 0.45, ly = cy + Math.sin(a) * r * 0.36
      d.stroke([[lx, ly], [lx + 3, ly - 3], [lx + 7, ly - 2]], { color: "G", width: 2.6, taper: [0.3, 0.6] })
    }
    for (let i = 0; i < 4; i++) {                                                           // leaf veins in the shade
      const lx = cx + (d.rng() - 0.3) * r, ly = cy + (d.rng() - 0.2) * r * 0.5
      d.stroke([[lx, ly], [lx + 4, ly + 2], [lx + 7, ly + 1]], { color: "j", width: 1.2, taper: [0.2, 0.6] })
    }
    if (berries) for (const [bx, by] of berries) { d.dot(bx + 0.6, by + 0.8, 3.2, "k"); d.dot(bx, by, 2.6, "q"); d.dot(bx - 0.8, by - 0.8, 0.9, "w") }
    d.ink(s, { weight: 2.2 })
  }
  clump(68, 34, 28)
  clump(36, 54, 28, [[30, 48], [42, 60]])
  clump(100, 52, 30, [[108, 46]])
  clump(68, 66, 32, [[58, 70], [80, 62], [70, 78]])
})

// ---------- Stone well (40x52 logical) ----------
// A ring of mortared stones under a capstone rim, two posts holding a little plank roof (the
// ridge runs front to back, so the gable faces the viewer), a crank axle with the rope wound on
// it and a bucket hanging over the shaft. Back to front: wall, rim and shaft, axle, bucket,
// posts, crank, roof. Origin bottom-center like the other props.
asset("well", { w: 160, h: 208 }, (d) => {
  const cx = 80, K = 0.34
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
  const along = (f, t0, t1, n) => Array.from({ length: n + 1 }, (_, i) => f(t0 + (t1 - t0) * i / n))

  // ---- stone wall: three courses of uneven, staggered stones set in dark mortar ----
  d.seed("wall")
  const WT = 142, WB = 178
  const W = cylinder({ cx, top: WT, bottom: WB, hw: (y) => 64 + 2 * (y - WT) / (WB - WT) })
  const wall = d.shape(W.silhouette(), { wobble: 0.8 })
  d.fill(wall, "n")
  for (const [y0, y1] of [[WT + 2, 154.5], [154.5, 166.5], [166.5, WB + 1]]) {
    for (let t = -(0.04 + d.rng() * 0.12) * PI; t < PI; ) {
      const span = (0.15 + d.rng() * 0.1) * PI
      const a = Math.max(t + 0.025, 0), b = Math.min(t + span - 0.025, PI)
      t += span
      if (b - a < 0.04) continue
      const [ja, jb, ka, kb] = [0, 0, 0, 0].map(() => (d.rng() - 0.5) * 1.6)                  // uneven, slightly skewed stones
      const ed = (y, p, q) => (u) => W.at(u, y + p + (q - p) * (u - a) / (b - a))
      const pts = fillet([...along(ed(y0 + 1.2, ja, jb), a, b, 5), ...along(ed(y1 - 1.2, ka, kb), b, a, 5)], 2.4 + d.rng() * 1.4)
      const s = d.shape(pts, { wobble: 0.8, wave: 12 })
      const mid = (a + b) / 2, lit = mid > 0.66 * PI, w = b - a
      d.fill(s, lit ? "S" : "s")
      if (mid < 0.36 * PI) d.hatch(pts, { angle: -68, spacing: 3.2, color: "n", width: 1.1, inset: 1.8 })
      d.stroke(along((u) => W.at(u, y0 + 3.2), b - w * 0.12, b - w * 0.6, 4), { color: lit ? "z" : "S", width: 1.5, taper: [0.3, 0.5] })  // lit upper edge
      d.stroke(along((u) => W.at(u, y1 - 3.4), a + w * 0.1, b - w * 0.3, 4), { color: lit ? "s" : "n", width: 1.6, taper: [0.4, 0.3] })  // shaded lower edge
      if (d.rng() < 0.22) {                                                                    // a crack
        const u = a + w * (0.3 + d.rng() * 0.4)
        d.stroke([W.at(u, y0 + 2), W.at(u - 0.04, (y0 + y1) / 2), W.at(u - 0.01, y1 - 3)], { color: "n", width: 1.1, taper: [0.1, 0.5] })
      }
      d.ink(s, { color: "K", weight: 1.1 })
    }
  }
  d.hatch(W.band(WB - 6, WB + 1, 0, 0.12 * PI, 0.86 * PI), { angle: -72, spacing: 3.6, color: "n", width: 1.1, short: 0.6 })  // dirt at the foot
  d.fill(W.band(WT, WT + 4, 0.5), "n", { wobble: 0.4 })                                       // shadow under the rim
  d.ink(wall, { weight: 2.8 })
  d.stroke(W.meridian(0, 150, 176).map(([x, y]) => [x + 4.2, y]), { color: "k", width: 1.1, taper: [0.4, 0.4], wobble: 0.5 })
  d.seed("tufts")
  for (const t of [0.03, 0.09, 0.2, 0.76, 0.9, 0.97]) {                                       // grass against the foot
    const [x, y] = W.at(t * PI, WB)
    tuft(d, x, y + 1.5, { n: 3, h: 8 + d.rng() * 5, color: d.rng() < 0.5 ? "h" : "g", width: 1.8 })
  }

  // ---- rim: a ring of capstones around the shaft ----
  d.seed("rim")
  const CT = 132, CB = 142, OX = 67, HX = 47, HY = HX * K
  const rim = d.shape(cylinder({ cx, top: CT, bottom: CB, hw: () => OX }).silhouette(), { wobble: 0.7 })
  d.fill(rim, "n")
  // the shaft: the far inside wall (stone near the top, dark below), water far down
  const sq = (u) => Math.sqrt(Math.max(0, 1 - u * u))
  const holeBot = (x) => CT + HY * sq((x - cx) / HX)
  const far = (dy, t0 = PI, t1 = 2 * PI) => along((t) => {
    const x = cx + HX * Math.cos(t)
    return [x, Math.min(CT + HY * Math.sin(t) + dy, holeBot(x))]
  }, t0, t1, 24)
  d.fill(ellipsePts(cx, CT, HX, HY, 40), "k", { wobble: 0.4 })
  d.fill([...far(0), ...far(12).reverse()], "K", { wobble: 0.3 })
  d.fill([...far(0), ...far(4.5).reverse()], "n", { wobble: 0.3 })
  for (const dy of [4.5, 8.8]) d.stroke(far(dy, 1.1 * PI, 1.9 * PI), { color: "k", width: 1, taper: [0.2, 0.2] })   // course joints
  for (const [t, dy] of [[1.22, 0], [1.4, 0], [1.6, 0], [1.78, 0], [1.31, 4.5], [1.5, 4.5], [1.69, 4.5]]) {
    const x = cx + HX * Math.cos(t * PI), y = CT + HY * Math.sin(t * PI) + dy
    d.stroke([[x, y + 0.8], [x + 0.3, y + 4.2]], { color: "k", width: 1, taper: [0.1, 0.1] })
  }
  const hW = 25, u0 = sq(hW / (2 * HY))                                                          // water level, far down the shaft
  d.fill([...along((u) => [cx + HX * u, CT + hW - HY * sq(u)], -u0, u0, 16), ...along((u) => [cx + HX * u, holeBot(cx + HX * u)], u0, -u0, 16)], "b", { wobble: 0.3 })
  d.stroke(arcPts(cx + 2, CT + 12.5, 8, 1.8, 1.05 * PI, 1.95 * PI, 10), { color: "B", width: 1.2, taper: [0.3, 0.3] })   // ripple under the dripping bucket
  d.stroke(arcPts(cx + 2, CT + 12.5, 8, 1.8, 0.15 * PI, 0.85 * PI, 10), { color: "B", width: 1, taper: [0.3, 0.3] })
  d.stroke([[cx - 22, CT + 12.6], [cx - 15, CT + 12]], { color: "C", width: 1.3, taper: [0.3, 0.3] })

  // capstones: the top face lit, the front face plain on the left and hatched on the right
  const g = 1.1
  const inner = (t) => [cx + (HX + g) * Math.cos(t), CT + (HX + g) * K * Math.sin(t)]
  const outer = (y) => (t) => [cx + (OX - g) * Math.cos(t), y + (OX - g) * K * Math.sin(t)]
  const outerEdge = (t0, t1) => {             // t0 > t1: along the rim's foot where it faces us, its top where it faces away
    const ts = [t0]
    for (let k = Math.floor(t0 / PI); k * PI > t1; k--) if (k * PI < t0) ts.push(k * PI)
    ts.push(t1)
    const out = []
    for (let i = 0; i < ts.length - 1; i++) {
      const front = Math.sin((ts[i] + ts[i + 1]) / 2) > 0
      out.push(...along(outer(front ? CB - g : CT), ts[i], ts[i + 1], Math.max(2, Math.ceil((ts[i] - ts[i + 1]) / 0.08))))
    }
    return out
  }
  const stones = []
  for (let t = (-0.5 + d.rng() * 0.1) * PI, end = t + 2 * PI; t < end - 0.01; ) {
    let span = (0.12 + d.rng() * 0.07) * PI
    if (end - t - span < 0.09 * PI) span = end - t
    stones.push([t, t + span])
    t += span
  }
  const faces = ([a, b]) => along(Math.sin, a, b, 12).some((v) => v > 0.03)
  for (const [a0, b0] of [...stones.filter((s) => !faces(s)), ...stones.filter(faces)]) {
    const a = a0 + 0.02, b = b0 - 0.02, n = Math.max(3, Math.ceil((b - a) / 0.08))
    const inn = along(inner, a, b, n)
    const s = d.shape(fillet([...inn, ...outerEdge(b, a)], 2), { wobble: 0.5, wave: 12 })
    d.fill(s, "s")
    d.fill(fillet([...inn, ...along(outer(CT), b, a, n)], 2), "S", { wobble: 0.3 })
    const fa = Math.max(a, 0), fb = Math.min(b, PI)
    if (fb > fa + 0.02) {
      const mid = (fa + fb) / 2, fw = fb - fa
      if (mid < 0.36 * PI) d.hatch([...along(outer(CT + 1), fa, fb, 6), ...along(outer(CB - g), fb, fa, 6)], { angle: -68, spacing: 3, color: "n", width: 1, inset: 1 })
      if (mid > 0.6 * PI) d.stroke(along(outer(CT + 1.6), fb - fw * 0.1, fa + fw * 0.35, 5), { color: "z", width: 1.4, taper: [0.3, 0.5] })
    }
    if (d.rng() < 0.3) {                                                                         // a chip across the top
      const u = a + (b - a) * (0.3 + d.rng() * 0.4)
      d.stroke([lerp(inner(u), outer(CT)(u), 0.2), lerp(inner(u + 0.03), outer(CT)(u + 0.03), 0.75)], { color: "s", width: 1.1, taper: [0.2, 0.4] })
    }
    d.ink(s, { color: "K", weight: 1.1 })
  }
  for (const x of [29, 139]) d.fill(ellipsePts(x, 135.5, 7, 2, 14), "s", { wobble: 0.3 })     // where the posts stand
  d.ink(rim, { weight: 2.6 })

  // ---- crank axle through the posts, the rope wound on it ----
  d.seed("axle")
  const AY = 83
  const axle = d.shape(roundRect(13, AY - 5, 134, 10, 4.5), { wobble: 0.5 })
  d.fill(axle, "e")
  d.fill(rectPts(14, AY - 4, 132, 2.6), "E", { wobble: 0.3 })
  d.fill(rectPts(14, AY + 1.6, 132, 2.6), "D", { wobble: 0.3 })
  for (const [x0, x1] of [[36, 58], [102, 122]]) d.stroke([[x0, AY - 0.6], [(x0 + x1) / 2, AY + 0.4], [x1, AY - 0.2]], { color: "D", width: 1.1, wobble: 0.6 })
  d.ink(axle, { weight: 1.8 })
  d.blob(ellipsePts(14.5, AY, 2.6, 4.6, 14), { fill: "E", ink: "k", weight: 1.3, wobble: 0.2 })  // end grain of the stub
  d.seed("coil")
  const coil = d.shape(roundRect(64, AY - 7.5, 32, 15, 5), { wobble: 0.5 })
  d.fill(coil, "E")
  d.fill(rectPts(65, AY + 2.5, 30, 4), "e", { wobble: 0.3 })
  for (let x = 67; x < 93; x += 4.2) {
    d.stroke([[x + 2.5, AY - 7], [x - 1.5, AY + 7]], { color: "D", width: 1.2, taper: [0.15, 0.15] })  // turns
    d.stroke([[x + 1.8, AY - 5.5], [x + 0.8, AY - 3]], { color: "c", width: 1.2, taper: [0.3, 0.5] })
  }
  d.ink(coil, { weight: 1.6 })

  // ---- bucket hanging over the shaft ----
  d.seed("bucket")
  const BT = 108, BBo = 124
  const Bk = cylinder({ cx, top: BT, bottom: BBo, hw: (y) => 12.5 - 2.5 * (y - BT) / (BBo - BT) })
  const pail = d.shape(Bk.silhouette(), { wobble: 0.5 })
  d.fill(pail, "e")
  d.fill(Bk.strip(0.66 * PI, 0.86 * PI, BT, BBo - 1), "E", { wobble: 0.3 })
  d.fill(Bk.strip(0.02 * PI, 0.28 * PI), "D", { wobble: 0.3 })
  for (const t of [0.36, 0.56, 0.78]) d.stroke(Bk.meridian(t * PI, BT + 2, BBo - 1), { color: "d", width: 1, taper: [0.1, 0.1] })
  for (const [y0, y1] of [[111, 113.6], [119.5, 122]]) {
    const hoop = d.shape(Bk.band(y0, y1, 0.8), { wobble: 0.3 })
    d.fill(hoop, "s")
    d.fill(Bk.band(y0 + 0.3, y1 - 0.3, 0.8, 0, 0.3 * PI), "n", { wobble: 0.2 })
    d.ink(hoop, { weight: 1.1 })
  }
  d.ink(pail, { weight: 1.8 })
  const brim = d.shape(Bk.cap(1), { wobble: 0.4 })
  d.fill(brim, "E")
  d.fill(Bk.cap(0.8, 0.5), "d", { wobble: 0.3 })
  d.fill(Bk.cap(0.62, 1.4), "b", { wobble: 0.2 })                                               // water in it
  d.stroke([[cx - 5, BT + 1.2], [cx - 1, BT + 0.8]], { color: "B", width: 1, taper: [0.3, 0.3] })
  d.ink(brim, { weight: 1.5 })
  d.seed("bail")
  const bail = [[67.6, BT + 2], [70, BT - 5], [80, BT - 7.5], [90, BT - 5], [92.4, BT + 2]]
  d.stroke(bail, { color: "k", width: 3.2, taper: [0, 0], wobble: 0.3 })
  d.stroke(bail, { color: "s", width: 1.4, taper: [0, 0], wobble: 0.3 })
  nail(d, 67.8, BT + 2.4, 1.3); nail(d, 92.2, BT + 2.4, 1.3)
  d.seed("rope")
  const rope = [[80, AY + 7], [80.6, 93], [80, 101]]
  d.stroke(rope, { color: "k", width: 4.4, taper: [0, 0], wobble: 0.3 })
  d.stroke(rope, { color: "E", width: 2.2, taper: [0, 0], wobble: 0.3 })
  for (const y of [92, 96]) d.stroke([[79.2, y], [81, y + 1.6]], { color: "D", width: 0.9, taper: [0, 0] })
  d.blob(ellipsePts(80, 101, 2.6, 2.2, 12), { fill: "E", weight: 1.2, wobble: 0.2 })          // knot on the bail

  // ---- posts standing on the rim ----
  d.seed("posts")
  plank(d, 19, 60, 12, 75, { weight: 2, knots: 1 })
  plank(d, 129, 60, 12, 75, { weight: 2, knots: 0 })
  d.hatch(rectPts(133, 66, 6, 66), { angle: -72, spacing: 3.2, color: "D", width: 1, skip: 0.15 })

  // ---- crank on the right ----
  d.seed("crank")
  const arm = [[146, AY], [146.6, AY + 8], [147, AY + 15]]
  d.stroke(arm, { color: "k", width: 5, taper: [0, 0], wobble: 0.3 })
  d.stroke(arm, { color: "s", width: 2.6, taper: [0, 0], wobble: 0.3 })
  d.dot(146.2, AY + 0.4, 3.4, "k"); d.dot(145.8, AY, 2, "S")
  const grip = [[146, AY + 15.5], [151, AY + 16], [155.5, AY + 16.6]]
  d.stroke(grip, { color: "k", width: 6.4, taper: [0, 0], wobble: 0.3 })
  d.stroke(grip, { color: "D", width: 3.8, taper: [0, 0], wobble: 0.3 })
  d.stroke([[148, AY + 14.8], [154, AY + 15.4]], { color: "e", width: 1.2, taper: [0.2, 0.3] })

  // ---- roof: two plank slopes meeting at a ridge that runs front to back ----
  d.seed("roof")
  const RB = 6, RF = 30, EB = 50, EF = 74, FAS = 6           // ridge back/front y, eave back/front y, edge thickness
  const board = (p0, p1, p2, p3, c) => {                    // corners: back-ridge, front-ridge, front-eave, back-eave
    const s = d.shape(fillet([p0, p1, p2, p3], 2), { wobble: 0.8, wave: 20 })
    d.fill(s, c.fill)
    d.fill([p0, lerp(p0, p1, 0.26), lerp(p3, p2, 0.26), p3], c.lit, { wobble: 0.3 })
    d.fill([lerp(p0, p1, 0.72), p1, p2, lerp(p3, p2, 0.72)], c.dark, { wobble: 0.3 })
    if (c.hatch) d.hatch([p0, p1, p2, p3], { angle: -70, spacing: 3.4, color: c.hatch, width: 1, skip: 0.15, inset: 2 })
    if (d.rng() < 0.4) {                                                                        // a knot
      const [kx, ky] = lerp(lerp(p0, p1, 0.5), lerp(p3, p2, 0.5), 0.3 + d.rng() * 0.4)
      d.blob(ellipsePts(kx, ky, 2.3, 1.4, 10), { fill: c.dark, ink: c.grain === "e" ? "D" : "d", weight: 0.8, wobble: 0.2 })
    }
    for (let i = 0; i < 2; i++) {                                                               // grain along the board
      const f = 0.35 + d.rng() * 0.3, v0 = 0.1 + d.rng() * 0.4, v1 = Math.min(v0 + 0.25 + d.rng() * 0.3, 0.94)
      const q0 = lerp(p0, p1, f), q1 = lerp(p3, p2, f), m = lerp(q0, q1, (v0 + v1) / 2)
      d.stroke([lerp(q0, q1, v0), [m[0], m[1] + (d.rng() - 0.5) * 2], lerp(q0, q1, v1)], { color: c.grain, width: 1.1, wobble: 0.6 })
    }
    for (const v of [0.08, 0.84]) nail(d, ...lerp(lerp(p0, p1, 0.5), lerp(p3, p2, 0.5), v), 1.2)
    d.ink(s, { weight: 2 })
  }
  const slope = (xe, c) => {
    const cuts = [0, 0.33 + (d.rng() - 0.5) * 0.08, 0.67 + (d.rng() - 0.5) * 0.08, 1]
    const cutsE = cuts.map((f, i) => (i % 3 ? f + (d.rng() - 0.5) * 0.07 : f))                  // boards a little tapered
    const len = Math.hypot(xe - cx, EB - RB), ux = (xe - cx) / len, uy = (EB - RB) / len
    const ridge = (f) => [cx, RB + (RF - RB) * f], eave = (f, o) => [xe + ux * o, EB + (EF - EB) * f + uy * o]
    for (let i = 0; i < 3; i++) {
      const o = (d.rng() - 0.5) * 4                                                              // board ends not quite in line
      const p0 = ridge(cuts[i]), p1 = ridge(cuts[i + 1]), p2 = eave(cutsE[i + 1], o), p3 = eave(cutsE[i], o)
      if (i === 2) {                                                                             // the front board shows its edge
        const edge = d.shape([p1, p2, [p2[0], p2[1] + FAS], [p1[0], p1[1] + FAS]], { wobble: 0.4 })
        d.fill(edge, c.edge)
        d.stroke([lerp(p1, p2, 0.12).map((v, k) => v + k * FAS * 0.55), lerp(p1, p2, 0.6).map((v, k) => v + k * FAS * 0.45)], { color: c.edgeGrain, width: 1, wobble: 0.5 })
        d.ink(edge, { weight: 1.8 })
      }
      board(p0, p1, p2, p3, c)
    }
  }
  slope(5, { fill: "E", lit: "c", dark: "e", grain: "e", edge: "e", edgeGrain: "D" })
  slope(155, { fill: "e", lit: "E", dark: "D", grain: "D", hatch: "D", edge: "D", edgeGrain: "d" })
  d.seed("ridge")
  d.blob(roundRect(cx - 6, RF - 1, 12, 7, 1.5), { fill: "D", weight: 1.6, wobble: 0.3 })          // end grain at the front
  plank(d, cx - 6, RB - 3, 12, RF - RB + 2, { fill: "E", lit: "c", dark: "e", grain: "e", weight: 1.8, knots: 0 })
  nail(d, cx, RB + 3, 1.2); nail(d, cx, RF - 5, 1.2)
})

// Cast-shadow masks (white; Godot colors them with the ground's shadow color).
asset("shadow_s", { w: 76, h: 22 }, (d) => d.fill(ellipsePts(38, 11, 34, 8, 32), "w", { wobble: 1 }))
asset("shadow_m", { w: 104, h: 28 }, (d) => d.fill(ellipsePts(52, 14, 48, 11, 36), "w", { wobble: 1.2 }))
asset("shadow_l", { w: 168, h: 40 }, (d) => d.fill(ellipsePts(84, 20, 78, 16, 40), "w", { wobble: 1.6 }))
