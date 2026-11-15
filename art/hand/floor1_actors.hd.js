include("_lib.hd.js")
include("_rig.hd.js")   // rig(): poses drawn through bones (see the file)
// Mine floor 1 (Old Mine), hand-drawn: the iron ore node with its crack stages, the drops, the
// cave rat, the mining swing, the dust puff and the orbiting pickaxe. Same look as base.hd.js and
// characters.hd.js: dark k ink thicker on the bottom-right (light from the top-left), flat
// Endesga fills, shadow sides hatched by hand. Units: 4 per logical pixel; the miner is a
// 128x128 frame for scale.

const PI = Math.PI
const E = (cx, cy, rx, ry, n = 24) => ellipsePts(cx, cy, rx, ry, n)
const rad = (deg) => deg * PI / 180
// Move every point toward the polygon's centre by k units (keeps an inner fill inside its ink).
const shrink = (pts, k) => {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return pts.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy) || 1; return [x - (x - cx) / l * k, y - (y - cy) / l * k] })
}
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy])

// ---------- Iron ore node: three stacked stone slabs, iron in the seams ----------
// 176x152, base resting on y = 148 (bottom-center origin in the game). Angular, tilted slabs
// (references/dont_starve_mining_reference): each has a lit left facet, a front face and a dark
// right face; the iron is a pale mineral band squeezed between them. Every part has its own
// seed, so hit1/hit2 are the same drawing with cracks and chips added on top.

// One slab, without its ink (the caller inks it after the seam that rests on it).
const slab = (d, name, { out, lit = [], dark, shade, lines = [], rim = [] }) => {
  d.seed("slab:" + name)
  const s = d.shape(fillet(out, 2.5), { wobble: 0.8, wave: 24 })
  d.fill(s, "s")
  for (const f of lit) d.fill(shrink(f, 1), "S", { wobble: 0.5 })
  d.fill(shrink(dark, 1), "n", { wobble: 0.5 })
  if (shade) d.hatch(shade, { angle: -65, spacing: 3.6, color: "n", width: 1.3, short: 0.4 })
  d.hatch(shrink(dark, 2.5), { angle: -65, spacing: 3.8, color: "K", width: 1.3, short: 0.3 })
  for (const l of lines) d.stroke(l, { color: "n", width: 1.8, taper: [0.15, 0.3], wobble: 0.5 })   // facet edges
  for (const r of rim) d.stroke(r, { color: "z", width: 2.2, taper: [0.3, 0.4], wobble: 0.5 })      // lit edges
  return s
}

// A faceted iron crystal: pale face, white facet toward the light, grey facet away from it.
const crystal = (d, name, x, y, r) => {
  d.seed("crystal:" + name)
  const pts = [[x - r, y + r * 0.1], [x - r * 0.25, y - r], [x + r, y - r * 0.3], [x + r * 0.3, y + r * 0.85]]
  const s = d.shape(pts, { wobble: 0.3 })
  d.fill(s, "z")
  d.fill([[x - r * 0.8, y], [x - r * 0.2, y - r * 0.8], [x + r * 0.05, y - r * 0.1]], "w", { wobble: 0.2 })
  d.fill([[x + r * 0.05, y - r * 0.1], [x + r * 0.85, y - r * 0.25], [x + r * 0.25, y + r * 0.7]], "S", { wobble: 0.2 })
  d.ink(s, { color: "K", weight: 1.2 })
}
// Rust where water seeped out of the seam: a fleck and a drip running down the stone below.
const rust = (d, name, x, y, drip) => {
  d.seed("rust:" + name)
  d.stroke([[x, y + 1], [x + 0.6, y + drip * 0.6], [x + 0.2, y + drip]], { color: "o", width: 1.7, taper: [0.1, 0.8], wobble: 0.3 })
  d.blob(E(x, y, 2.6, 1.8, 10), { fill: "O", ink: "o", weight: 0.9, wobble: 0.3 })
}
// The iron band between two slabs: top and bottom are point lists of the same length.
const seam = (d, name, top, bottom, { crystals = [], rusts = [] } = {}) => {
  d.seed("seam:" + name)
  const s = d.shape([...top, ...bottom.slice().reverse()], { wobble: 0.6, wave: 18 })
  d.fill(s, "z")
  d.fill([...shift(bottom, 0, -3.5), ...bottom.slice().reverse()], "S", { wobble: 0.4 })   // underside in shade
  const mid = top.map(([x, y], i) => [x, (y + bottom[i][1]) / 2 + 1.5])
  for (let i = 0; i < mid.length - 1; i++) {                                                // silver glints
    const [x0, y0] = mid[i], [x1, y1] = mid[i + 1]
    d.stroke([[x0 + (x1 - x0) * 0.25, y0 + (y1 - y0) * 0.25], [x0 + (x1 - x0) * 0.6, y0 + (y1 - y0) * 0.6]], { color: "w", width: 1.8, taper: [0.3, 0.3] })
  }
  for (const [x, y, r] of crystals) crystal(d, name + x, x, y, r)
  for (const [x, y, l] of rusts) rust(d, name + x, x, y, l)
  return s
}

// A crack: dark groove with the light catching its lower-right wall.
const crack = (d, name, pts, w = 2.6) => {
  d.seed("crack:" + name)
  d.stroke(shift(pts, 1.3, 1.3), { color: "z", width: w * 0.5, taper: [0.2, 0.7], wobble: 0.4 })
  d.stroke(pts, { color: "k", width: w, taper: [0.08, 0.7], wobble: 0.5 })
}
// A chip knocked off: a fresh lighter facet with a dark rim.
const chip = (d, name, pts) => {
  d.seed("chip:" + name)
  const s = d.shape(pts, { wobble: 0.4 })
  d.fill(s, "z")
  d.fill([pts[1], pts[2], pts[3]], "S", { wobble: 0.3 })
  d.ink(s, { color: "k", weight: 1.5, lit: 0.6 })
}

function oreIron(d, stage) {
  // ---- bottom slab: the widest, sticks out on the left ----
  const bottom = slab(d, "bottom", {
    out: [[4, 130], [9, 116], [40, 110], [96, 112], [140, 108], [164, 110], [172, 124], [166, 146], [120, 149], [56, 150], [14, 148]],
    lit: [[[5, 129], [10, 117], [28, 113], [30, 127], [25, 147], [15, 147]]],
    dark: [[146, 112], [164, 111], [171, 124], [165, 145], [146, 148], [143, 128]],
    shade: [[104, 116], [144, 113], [142, 128], [145, 147], [100, 148]],
    lines: [[[28, 113], [30, 127], [25, 148]], [[145, 111], [143, 128], [146, 148]], [[72, 113], [76, 130], [70, 148]]],
    rim: [[[6, 126], [10, 117], [30, 112]]],
  })
  d.seed("slab:bottom:foot")                                     // dark foot where it meets the ground
  d.hatch([[30, 138], [100, 142], [143, 140], [143, 147], [64, 149], [28, 147]], { angle: -70, spacing: 3.2, color: "n", width: 1.2, short: 0.5 })
  const seamA = seam(d, "A",
    [[14, 104], [42, 100], [96, 101], [140, 96], [160, 98]],
    [[9, 116], [40, 110], [96, 112], [140, 108], [164, 110]],
    { crystals: [[19, 109, 4.4], [27.5, 106.5, 2.6], [86, 108, 4.8], [95, 106.5, 3], [150, 103, 3.4]], rusts: [[60, 107.5, 6], [126, 104, 5]] })
  d.ink(bottom, { weight: 3 })
  d.ink(seamA, { weight: 1.8 })

  // ---- middle slab: tilted the other way, sticks out on the right ----
  const middle = slab(d, "middle", {
    out: [[16, 96], [20, 86], [30, 82], [60, 79], [100, 77], [136, 72], [152, 68], [162, 74], [164, 88], [158, 96], [110, 99], [60, 100], [22, 100]],
    lit: [[[17, 96], [21, 87], [30, 83], [34, 84], [36, 99], [22, 100]]],
    dark: [[140, 76], [153, 69], [162, 75], [163, 88], [157, 95], [140, 98], [138, 88]],
    shade: [[100, 82], [138, 78], [138, 98], [96, 99]],
    lines: [[[34, 84], [36, 99]], [[140, 76], [138, 88], [140, 98]]],
    rim: [[[18, 94], [21, 87], [30, 83], [58, 80]]],
  })
  const seamB = seam(d, "B",
    [[36, 72], [62, 68], [100, 66], [134, 60], [146, 60]],
    [[30, 82], [60, 79], [100, 77], [136, 72], [152, 68]],
    { crystals: [[50, 74.5, 3.8], [108, 71, 4.4], [116.5, 69.5, 2.6]], rusts: [[80, 73, 5]] })
  d.ink(middle, { weight: 2.8 })
  d.ink(seamB, { weight: 1.7 })

  // ---- top slab: a crown leaning right, a ridge across its top ----
  const top = slab(d, "top", {
    out: [[38, 68], [42, 52], [58, 32], [76, 14], [94, 5], [106, 16], [124, 20], [136, 40], [140, 56], [132, 62], [100, 65], [64, 67]],
    lit: [[[41, 66], [43, 53], [58, 33], [76, 15], [84, 30], [70, 52], [56, 60], [55, 66]], [[78, 14], [94, 6], [105, 17], [122, 21], [110, 30], [86, 30]]],
    dark: [[110, 30], [123, 21], [135, 40], [139, 56], [131, 61], [119, 63], [118, 50]],
    shade: [[90, 40], [112, 34], [117, 52], [117, 63], [88, 65]],
    lines: [[[84, 30], [110, 30]], [[84, 30], [70, 52], [56, 60], [55, 66]], [[110, 30], [118, 50], [119, 63]]],
    rim: [[[40, 62], [43, 53], [58, 33], [76, 15]], [[80, 12], [93, 6]]],
  })
  d.ink(top, { weight: 2.6 })
  d.seed("loose")                                                 // a loose second pen line on the shadow side
  d.stroke([[170, 128], [167, 142]], { color: "k", width: 1.2, taper: [0.4, 0.4], wobble: 0.5 })

  // ---- damage ----
  if (stage >= 1) {
    chip(d, "crown", [[60, 36], [70, 26], [75, 35], [66, 42]])
    crack(d, "crown", [[96, 31], [101, 41], [94, 51], [98, 61]], 2.8)
    crack(d, "crownB", [[94, 51], [85, 57], [82, 63]], 2)
    crack(d, "chipA", [[66, 42], [64, 50]], 1.8)
  }
  if (stage >= 2) {
    chip(d, "mid", [[148, 72], [155, 68], [160, 76], [151, 80]])
    chip(d, "low", [[8, 126], [13, 118], [21, 124], [13, 132]])
    crack(d, "mid", [[66, 81], [72, 89], [66, 94], [70, 99]], 2.8)
    crack(d, "midB", [[72, 89], [84, 92], [90, 97]], 2)
    crack(d, "low", [[44, 113], [50, 125], [43, 136], [47, 147]], 2.8)
    crack(d, "lowB", [[112, 115], [118, 125], [130, 131]], 2.2)
    crack(d, "side", [[126, 26], [129, 40], [124, 54]], 2.2)
    crack(d, "chipB", [[21, 124], [30, 131]], 1.8)
  }
}

asset("f1_ore_iron", { w: 176, h: 152 }, (d) => oreIron(d, 0))
asset("f1_ore_iron_hit1", { w: 176, h: 152 }, (d) => oreIron(d, 1))
asset("f1_ore_iron_hit2", { w: 176, h: 152 }, (d) => oreIron(d, 2))

// ---------- Drops ----------
// A broken-off chunk of the node: grey stone with a band of iron across it.
asset("item_iron", { w: 44, h: 36 }, (d) => {
  d.seed("chunk")
  const s = d.shape(fillet([[4, 22], [8, 11], [18, 5], [30, 4], [39, 12], [41, 24], [34, 31], [16, 33], [6, 30]], 2), { wobble: 0.5 })
  d.fill(s, "s")
  d.fill(shrink([[6, 21], [9, 12], [18, 7], [26, 7], [21, 16], [10, 22]], 0.6), "S", { wobble: 0.3 })
  d.fill(shrink([[32, 12], [39, 13], [40, 24], [34, 30], [30, 21]], 0.6), "n", { wobble: 0.3 })
  d.hatch([[20, 26], [30, 23], [33, 30], [18, 32]], { angle: -65, spacing: 2.8, color: "n", width: 1, short: 0.3 })
  d.stroke([[26, 7], [21, 16], [10, 22]], { color: "n", width: 1.2, taper: [0.2, 0.3] })
  d.stroke([[7, 19], [10, 11], [18, 6.5]], { color: "z", width: 1.5, taper: [0.3, 0.3] })
  d.seed("chunk:band")
  const band = [[6, 27], [19, 19], [36, 15], [38, 19], [22, 24], [8, 31]]
  d.blob(band, { fill: "z", ink: "K", weight: 1, wobble: 0.3 })
  d.stroke([[12, 26], [20, 21.5]], { color: "w", width: 1.4, taper: [0.3, 0.3] })
  crystal(d, "chunkA", 26, 19.5, 3.4)
  rust(d, "chunk", 14, 28, 4)
  d.seed("chunk:ink")
  d.ink(s, { weight: 2.2 })
})

// A rat fang: a white hook, root at the top, tip curling down to the left.
asset("item_fang", { w: 32, h: 44 }, (d) => {
  d.seed("fang")
  const s = d.shape([[5, 7], [16, 3.5], [27, 6], [28, 14], [25, 25], [17, 35], [6, 41], [11, 32], [13, 23], [11, 14]], { wobble: 0.5 })
  d.fill(s, "w")
  d.fill([[20, 10], [27, 10], [27, 15], [24, 25], [16, 34], [8, 39.5], [15, 30], [20, 20]], "z", { wobble: 0.3 })   // shadow side
  d.hatch([[21, 13], [26, 13], [23, 23], [16, 31], [18, 22]], { angle: -55, spacing: 2.5, color: "S", width: 0.9, short: 0.3 })
  d.fill([[5.5, 7], [16, 4], [26.5, 6.5], [27, 10.5], [16, 9], [7, 12]], "c", { wobble: 0.3 })                   // the root
  d.stroke([[7.5, 12], [16, 9.5], [26.5, 11]], { color: "E", width: 1.3, taper: [0.2, 0.2] })
  d.stroke([[13, 15], [15, 23], [13, 31]], { color: "w", width: 1.8, taper: [0.3, 0.6] })
  d.ink(s, { weight: 2.2 })
})

// ---------- Cave rat (floor 1 enemy), facing left ----------
// Designed in 128x72, feet on y = 68; drawn into 192x80 frames (see ratFrame). Pose numbers:
// bob (body up), step (-1..1, which legs are forward), lift ([A, B] paw raise), breath (back
// swells), tail (tip sway), jaw (0 shut .. 1 wide open).
function rat(d, { bob = 0, step = 0, lift = [0, 0], breath = 0, tail = 0, jaw = 0 } = {}) {
  const part = (name) => d.seed("rat:" + name)
  const b = -bob
  // legs: A = near front + far back, B = near back + far front (diagonal pairs move together)
  const leg = (name, x, dx, up, far) => {
    part("leg" + name)
    const fx = x + dx, top = 54 + b
    d.blob(roundRect(fx - 4.5, top, 9, 66 - up - top, 4), { fill: far ? "n" : "s", weight: 1.8, wobble: 0.3 })
    d.blob(E(fx - 2.5, 66.5 - up, 6, 3, 12), { fill: far ? "V" : "q", weight: 1.6, wobble: 0.3 })
  }
  const dA = -7 * step, dB = 7 * step

  // ---- tail, behind everything: a thick inked curve, pink, ringed ----
  part("tail")
  const tp = [[100, 54 + b], [112, 60 + b * 0.5], [121, 55], [124 + tail * 0.5, 45], [120 + tail, 36 + Math.abs(tail) * 0.3]]
  d.stroke(tp, { color: "k", width: 8, taper: [0, 0.85], wobble: 0.5 })
  d.stroke(shift(tp, -0.3, -0.3), { color: "q", width: 5, taper: [0, 0.9], wobble: 0.4 })
  d.stroke(shift(tp.slice(1), 1, 0.8), { color: "V", width: 1.6, taper: [0.2, 0.9], wobble: 0.4 })

  // ---- far legs and far ear ----
  leg("farBack", 100, dA, lift[0], true)
  leg("farFront", 54, dB, lift[1], true)
  part("earFar")
  d.blob(E(52, 22 + b, 8, 10, 16), { fill: "V", weight: 2, wobble: 0.4 })

  // ---- body: a pear, the hump at the back ----
  part("body")
  const bodyPts = fillet([[42, 38], [54, 29], [76, 24], [96, 26], [108, 37], [111, 51], [104, 61], [80, 64], [56, 63], [42, 57], [38, 48]], 14)
    .map(([x, y]) => [x, y + b - (y < 46 ? breath * (46 - y) / 22 : 0)])
  const body = d.shape(bodyPts, { wobble: 0.7 })
  d.fill(body, "s")
  d.fill(E(70, 35 + b - breath * 0.6, 26, 8, 20), "S", { wobble: 0.6 })                       // lit back
  d.hatch(crescent(76, 46 + b, 33, 17, { shift: 0.35, t0: -0.15 * PI, t1: 0.8 * PI }), { angle: -60, spacing: 2.8, color: "v", width: 1.5 })
  for (const [x, y] of [[60, 31], [74, 28], [88, 30], [66, 40], [82, 37]]) {                      // fur strokes
    d.stroke([[x, y + b], [x + 4, y + 2 + b], [x + 7, y + 1.5 + b]], { color: "z", width: 1.3, taper: [0.2, 0.6] })
  }
  d.stroke([[48, 58 + b], [64, 61 + b], [84, 61 + b]], { color: "n", width: 1.4, taper: [0.3, 0.3] })   // belly fold
  d.ink(body, { weight: 2.6 })
  part("haunch")
  const haunch = d.shape(E(92, 51 + b, 13, 10, 18), { wobble: 0.4 })
  d.fill(haunch, "s")
  d.hatch(crescent(92, 51 + b, 12, 9, { shift: 0.4 }), { angle: -60, spacing: 3.2, color: "v", width: 1.1 })
  d.stroke(arcPts(90, 49 + b, 9, 6, 1.1 * PI, 1.5 * PI, 8), { color: "S", width: 1.6, taper: [0.3, 0.3] })
  d.ink(haunch, { weight: 1.8, lit: 0.6 })

  // ---- near legs ----
  leg("nearBack", 94, dB, lift[1], false)
  leg("nearFront", 46, dA, lift[0], false)

  // ---- head: pointed snout to the left ----
  part("head")
  const head = d.shape(fillet([[52, 30], [56, 44], [52, 56], [38, 60], [22, 57], [9, 51], [6, 46], [14, 40], [28, 31], [40, 27]], 8)
    .map(([x, y]) => [x, y + b]), { wobble: 0.6 })
  d.fill(head, "s")
  d.fill(E(33, 39.5 + b, 12, 4.5, 16), "S", { wobble: 0.4 })
  d.hatch(crescent(34, 46 + b, 20, 12, { shift: 0.4, t0: -0.1 * PI, t1: 0.75 * PI }), { angle: -60, spacing: 3.2, color: "v", width: 1.2 })
  d.stroke([[16, 42 + b], [26, 36 + b], [36, 33 + b]], { color: "z", width: 1.4, taper: [0.3, 0.4] })
  d.ink(head, { weight: 2.6 })
  if (jaw > 0) {
    // open mouth: a dark wedge under the snout and the lower jaw swung down from the hinge
    const j = jaw * 9
    part("mouth")
    d.blob([[33, 52 + b], [9, 50 + b], [12, 55 + j + b], [30, 59 + b]], { fill: "k", ink: null, wobble: 0.3 })
    d.fill([[29, 56 + b], [16, 55 + j * 0.8 + b], [24, 59 + j * 0.5 + b]], "q", { wobble: 0.3 })
    part("jaw")
    d.blob([[34, 56 + b], [12, 55 + j + b], [13, 60 + j + b], [26, 62 + j * 0.6 + b], [36, 61 + b]], { fill: "s", weight: 1.8, wobble: 0.3 })
    d.blob([[15, 55.5 + j + b], [19, 55.5 + j + b], [17, 51 + j + b]], { fill: "w", weight: 1.1, wobble: 0.2 })
  }
  part("tooth")
  d.blob([[15, 54.5 + b], [21, 55.5 + b], [20, 61 + b], [16, 60.5 + b]], { fill: "w", weight: 1.3, wobble: 0.2 })
  part("nose")
  d.blob(E(7.5, 47 + b, 3.4, 3, 12), { fill: "q", weight: 1.5, wobble: 0.2 })
  d.dot(6.8, 46 + b, 0.9, "w")
  part("eye")
  d.blob(E(28, 42 + b, 3.4, 3.9, 14), { fill: "k", ink: null, wobble: 0.2 })
  d.dot(27, 40.6 + b, 1.3, "w")
  part("whiskers")
  for (const [dy, len] of [[-3, 11], [0, 13], [3.5, 10]]) {
    d.stroke([[14, 48 + b], [14 - len * 0.5, 47 + dy * 0.6 + b], [14 - len, 46 + dy * 1.5 + b]], { color: "k", width: 1, taper: [0.1, 0.8], wobble: 0.3 })
  }
  part("earNear")
  const ear = d.shape(E(42, 25 + b, 9, 11, 18), { wobble: 0.4 })
  d.fill(ear, "q")
  d.fill(E(43, 26.5 + b, 5, 7, 14), "V", { wobble: 0.3 })
  d.stroke(arcPts(41, 25 + b, 6.5, 8.5, 1.05 * PI, 1.45 * PI, 6), { color: "w", width: 1.3, taper: [0.3, 0.3] })
  d.ink(ear, { weight: 2 })
}

// Every frame goes through the rig: the 128x72 design sits at (32, 8) in a 192x80 frame (feet on
// y = 76, Godot offset y -36), which leaves room for the bite's lunge. Body numbers: dx (forward =
// -), sx / sy (stretch about the hind feet), tilt (deg; + = head up).
const RAT_HIND = [104, 68]
function ratFrame(d, { dx = 0, sx = 1, sy = 1, tilt = 0, ...pose } = {}) {
  const R = rig(d).move(32 + dx, 8).rot(tilt, ...RAT_HIND).scale(sx, sy, ...RAT_HIND)
  rat(R, pose)
}
// Walk: 8 frames from one phase (the diagonal leg pairs swap at 0 and PI, the body rises between,
// squashing a touch at each contact).
const ratWalk = (i) => {
  const t = i / 8 * 2 * PI, c = Math.cos(t), s = Math.sin(t)
  return { step: c, tail: c, bob: 2 * Math.abs(s), lift: s > 0 ? [0, 4 * s] : [-4 * s, 0], sy: 1 - 0.03 * Math.cos(2 * t), sx: 1 + 0.02 * Math.cos(2 * t) }
}
// Bite: rears back (anticipation), lunges stretched with the jaw open, snaps shut, settles.
// enemy.gd deals the bite on the "hit_frame" of this animation (frame 2, the snap).
const RAT_BITE = [
  { ms: 120, dx: 6, sx: 0.94, sy: 1.04, tilt: 7, jaw: 0.35, breath: 1.2, tail: 3 },
  { ms: 50, dx: -10, sx: 1.12, sy: 0.93, tilt: -3, jaw: 1, step: 1, lift: [0, 3], tail: -2 },
  { ms: 80, dx: -14, sx: 1.08, sy: 0.96, tilt: -5, jaw: 0, step: 1, tail: -3 },
  { ms: 90, dx: -8, sx: 1.02, sy: 0.99, tilt: -1, jaw: 0, step: 0.3, tail: -1 },
  { ms: 110, dx: -2, sx: 1, sy: 1, tilt: 1, jaw: 0, tail: 1 },
]
sheet("rat", { w: 192, h: 80 }, {
  rat_idle_left: [
    { ms: 280, draw: (d) => ratFrame(d) },
    { ms: 160, draw: (d) => ratFrame(d, { breath: 0.8, tail: -1.5, sy: 1.01 }) },
    { ms: 280, draw: (d) => ratFrame(d, { breath: 1.6, tail: -3, sy: 1.02 }) },
    { ms: 160, draw: (d) => ratFrame(d, { breath: 0.8, tail: -1.5, sy: 1.01 }) },
  ],
  rat_walk_left: Array.from({ length: 8 }, (_, i) => ({ ms: 50, draw: (d) => ratFrame(d, ratWalk(i)) })),
  rat_attack_left: RAT_BITE.map(({ ms, ...pose }) => ({ ms, draw: (d) => ratFrame(d, pose) })),
})

// ---------- Mining swing: a pale crescent sweeping -75..+75 degrees around the aim ----------
// 256x256 centred on the player (128, 128). One function of the aim angle draws all 8.
const SWING = [
  { a0: -75, a1: -30, peak: 0.74, T: 18, rim: true },    // 0: the blade appears
  { a0: -75, a1: 20, peak: 0.72, T: 26, rim: true },     // 1: sweeping
  { a0: -75, a1: 75, peak: 0.66, T: 30, rim: true },     // 2: the full arc
  { a0: -20, a1: 75, peak: 0.68, T: 22, rim: true },     // 3: the back end thins away
  { a0: 15, a1: 75, peak: 0.7, T: 13, rim: false, tail: true },  // 4: the fading tail
]
const SWING_MS = [30, 30, 45, 40, 50]
const CX = 128, CY = 128, R = 112
function swing(d, deg, f) {
  const { a0, a1, peak, T, rim, tail } = SWING[f]
  const p = Math.log(0.5) / Math.log(peak)                       // thickest at u = peak
  const N = 48
  // crescent between the outer radius and an inner edge that swells toward the leading end
  const band = (k, from = 0, to = 1) => {
    const outer = [], inner = []
    for (let i = 0; i <= N; i++) {
      const u = from + (to - from) * i / N, a = rad(deg + a0 + (a1 - a0) * u)
      const t = T * Math.sin(PI * Math.pow(u, p)), r = R + 3 * Math.sin(PI * u)
      outer.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r])
      inner.push([CX + Math.cos(a) * (r - t * k), CY + Math.sin(a) * (r - t * k)])
    }
    return [...outer, ...inner.reverse()]
  }
  const arc = (r, u0, u1) => {
    const out = []
    for (let i = 0; i <= 16; i++) { const a = rad(deg + a0 + (a1 - a0) * (u0 + (u1 - u0) * i / 16)); out.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]) }
    return out
  }
  // speed lines inside the crescent, trailing behind the blade
  d.seed("swing:lines:" + f)
  const lines = tail ? [[R - 20, 0.15, 0.7], [R - 30, 0.35, 0.8]] : [[R - T - 8, 0.15, 0.62], [R - T - 18, 0.3, 0.72], [R + 7, 0.25, 0.55]]
  for (const [r, u0, u1] of lines) d.stroke(arc(r, u0, u1), { color: tail ? "S" : "z", width: 2.2, taper: [0.7, 0.15], wobble: 0.6 })

  if (tail) {
    // the tail breaks into fading pieces
    for (const [name, from, to, k] of [["a", 0.08, 0.42, 0.7], ["b", 0.5, 0.78, 0.9], ["c", 0.84, 0.98, 0.6]]) {
      d.seed("swing:tail:" + name)
      d.fill(d.shape(band(k, from, to), { wobble: 0.8, wave: 24 }), "S")
      d.seed("swing:tail2:" + name)
      d.stroke(arc(R + 1, from + 0.03, to - 0.02), { color: "z", width: 2.4, taper: [0.5, 0.5], wobble: 0.5 })
    }
    return
  }
  d.seed("swing:body:" + f)
  const s = d.shape(band(1), { wobble: 1, wave: 26 })
  d.fill(s, "S")
  d.seed("swing:mid:" + f)
  d.fill(d.shape(band(0.62, 0.04, 1), { wobble: 0.8, wave: 22 }), "z")
  d.seed("swing:rim:" + f)
  if (rim) d.fill(d.shape(band(0.24, 0.12, 0.99), { wobble: 0.5, wave: 20 }), "w")
  d.seed("swing:ink:" + f)
  d.ink(s, { weight: 1.7, lit: 0.3 })
}
const DIRS = [["e", 0], ["se", 45], ["s", 90], ["sw", 135], ["w", 180], ["nw", 225], ["n", 270], ["ne", 315]]
sheet("fx_swing", { w: 256, h: 256 }, Object.fromEntries(DIRS.map(([name, deg]) =>
  ["swing_" + name, SWING.map((_, f) => ({ ms: SWING_MS[f], draw: (d) => swing(d, deg, f) }))])))

// ---------- Dust puff: a small cloud bursting out and thinning (ore breaks, rat dies) ----------
// 128x128, centred on (64, 64). A ring of overlapping puffs (plus a core while it is dense)
// grows and breaks up; the last frame is a few small puffs without ink, fading into the floor.
// Grit flies out along fixed directions.
const DUST = [
  { dist: 11, r: 12, core: 14, ink: 1.9, base: "c", grit: 26, keep: [0, 1, 2, 3, 4, 5, 6] },
  { dist: 23, r: 15, core: 13, ink: 1.8, base: "c", grit: 40, keep: [0, 1, 2, 3, 4, 5, 6] },
  { dist: 32, r: 13, core: 0, ink: 1.4, base: "c", grit: 52, keep: [0, 1, 3, 4, 6] },
  { dist: 38, r: 8, core: 0, ink: 0, base: "E", grit: 0, keep: [0, 3, 4, 6] },
]
const puffPts = (cx, cy, rr, i) => Array.from({ length: 22 }, (_, j) => {
  const t = j / 22 * 2 * PI, bump = 1 + 0.1 * Math.abs(Math.sin(t * 3 + i))
  return [cx + Math.cos(t) * rr * bump, cy + Math.sin(t) * rr * 0.85 * bump]
})
function dust(d, f) {
  const { dist, r, core, ink, base, grit, keep } = DUST[f]
  const N = 7, ang = (i) => i / N * 2 * PI + 0.3
  const shapes = []
  for (const i of keep) {
    d.seed("dust:" + f + ":" + i)
    const a = ang(i), l = dist * (0.9 + 0.25 * ((i * 5) % 3) / 2)
    const cx = 64 + Math.cos(a) * l, cy = 66 + Math.sin(a) * l * 0.85, rr = r * (0.8 + 0.4 * ((i * 3) % 4) / 3)
    shapes.push({ s: d.shape(puffPts(cx, cy, rr, i), { wobble: 0.6 }), cx, cy, rr })
  }
  if (core) { d.seed("dust:core:" + f); shapes.push({ s: d.shape(puffPts(64, 64, core, 9), { wobble: 0.6 }), cx: 64, cy: 64, rr: core }) }
  // one merged outline: an ink copy pushed toward the shadow under all the fills
  if (ink) for (const { s } of shapes) d.fill(shift(d.offset(s, ink).pts, 0.6, 0.7), "k", { wobble: 0 })
  for (const { s } of shapes) d.fill(s, base)
  shapes.forEach(({ cx, cy, rr }, i) => {
    d.seed("dust:shade:" + f + ":" + i)
    d.hatch(crescent(cx, cy, rr * 0.9, rr * 0.76, { shift: 0.4 }), { angle: -60, spacing: f === 2 ? 2.4 : 3, color: base === "c" ? "E" : "e", width: 1.1, short: 0.4 })
    if (base === "c") d.stroke(arcPts(cx - rr * 0.2, cy - rr * 0.2, rr * 0.55, rr * 0.45, 1.1 * PI, 1.5 * PI, 6), { color: "w", width: 1.8, taper: [0.3, 0.3] })
  })
  if (core) {                                                     // a curl in the middle of the cloud
    d.seed("dust:curl:" + f)
    d.stroke(arcPts(66, 66, core * 0.5, core * 0.42, -0.2 * PI, 1.3 * PI, 12), { color: "E", width: 1.8, taper: [0.2, 0.6] })
  }
  for (let i = 0; i < 5 && grit; i++) {                           // grit flying out with the puff
    d.seed("dust:grit:" + i)
    const a = i / 5 * 2 * PI + 0.9, l = grit + (i % 3) * 4, pr = 2.4 - f * 0.4
    d.blob(E(64 + Math.cos(a) * l, 64 + Math.sin(a) * l * 0.85, pr * 1.2, pr, 8), { fill: i % 2 ? "s" : "e", weight: 1, wobble: 0.2 })
  }
}
sheet("fx_dust", { w: 128, h: 128 }, {
  fx_dust: [0, 1, 2, 3].map((f) => ({ ms: 70, draw: (d) => dust(d, f) })),
})

// ---------- Orbiting pickaxe (upgrade), drawn upright ----------
asset("fx_pick", { w: 60, h: 48 }, (d) => {
  d.seed("pick:handle")
  const hp = [[30, 12], [30.6, 28], [31, 45]]
  d.stroke(hp, { color: "k", width: 8, taper: [0, 0], wobble: 0.4 })
  d.stroke(hp, { color: "e", width: 5, taper: [0, 0], wobble: 0.3 })
  d.stroke([[28.8, 18], [29.2, 30], [29.6, 42]], { color: "E", width: 1.4, taper: [0.2, 0.3] })
  d.stroke([[31.6, 34], [32, 43]], { color: "D", width: 1.2, taper: [0.2, 0.3] })
  d.seed("pick:head")
  const head = d.shape([...arcPts(30, 24, 27, 19, 1.06 * PI, 1.94 * PI, 20), [56.5, 19], ...arcPts(30, 25, 24, 12, 1.92 * PI, 1.08 * PI, 18), [3.5, 19]], { wobble: 0.5 })
  d.fill(head, "S")
  d.fill([...arcPts(30, 24, 25, 17, 1.12 * PI, 1.55 * PI, 10), ...arcPts(30, 23, 22, 12, 1.5 * PI, 1.12 * PI, 8)], "z", { wobble: 0.3 })
  d.hatch([...arcPts(30, 24, 26, 18, 1.6 * PI, 1.9 * PI, 8), ...arcPts(30, 25, 25, 13, 1.9 * PI, 1.6 * PI, 8)], { angle: -60, spacing: 2.8, color: "s", width: 1, short: 0.3 })
  d.stroke(arcPts(28, 22, 22, 15, 1.2 * PI, 1.42 * PI, 6), { color: "w", width: 1.6, taper: [0.3, 0.3] })
  d.ink(head, { weight: 2.2 })
  d.seed("pick:collar")
  d.blob(roundRect(25.5, 8, 10, 9, 2), { fill: "n", weight: 1.6, wobble: 0.2 })
  nail(d, 30.5, 12.5, 1.6)
})
