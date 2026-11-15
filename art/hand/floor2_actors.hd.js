include("_lib.hd.js")
include("_rig.hd.js")   // rig(): poses drawn through bones (see the file)
// Mine floor 2 (Crystal Cave), hand-drawn: the sapphire ore node with its crack stages, the
// sapphire drop and the crystal golem. Same look as floor1_actors.hd.js: dark k ink thicker on
// the bottom-right (light from the top-left), flat Endesga fills, shadow sides hatched by hand.
// The stone here is a step darker (n base, s lit, K shadow) and the mineral is deep blue
// sapphire (b/B/C, w glints). Units: 4 per logical pixel; the miner is a 128x128 frame for scale.

const PI = Math.PI
const E = (cx, cy, rx, ry, n = 24) => ellipsePts(cx, cy, rx, ry, n)
const rad = (deg) => deg * PI / 180
// Move every point toward the polygon's centre by k units (keeps an inner fill inside its ink).
const shrink = (pts, k) => {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return pts.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy) || 1; return [x - (x - cx) / l * k, y - (y - cy) / l * k] })
}
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy])

// ---------- Shared marks ----------

// A sapphire crystal: a hexagonal prism with a pointed tip, growing from (x, y) along `deg`
// (0 = straight up, positive leans right). Three faces: lit C on the left, B in front, dark b
// on the right; a white glint runs up the lit face. `broken` (0..1) snaps the tip off and shows
// a pale fracture face. `spark` adds a four-point twinkle near the tip.
const crystal = (d, name, x, y, len, w, deg, { broken = 0, spark = 0, weight = 1.7 } = {}) => {
  d.seed("crystal:" + name)
  const a = rad(deg), U = [Math.sin(a), -Math.cos(a)], R = [Math.cos(a), Math.sin(a)]
  const P = (v, u) => [x + R[0] * v + U[0] * u, y + R[1] * v + U[1] * u]
  const h = w / 2, t = w / 6, sh = len * 0.72, tipV = w * 0.06
  let outline, faces, cap = null
  if (!broken) {
    outline = [P(-h, -3), P(-h, sh), P(tipV, len), P(h, sh), P(h, -3)]
    faces = [
      [[P(-h, -3), P(-h, sh), P(tipV, len), P(-t, sh), P(-t, -3)], "C"],
      [[P(t, -3), P(t, sh), P(tipV, len), P(h, sh), P(h, -3)], "b"],
    ]
  } else {
    // a jagged break across the prism, lower on the right
    const k = len * (1 - broken * 0.55)
    const b1 = k * 0.86, b2 = k * 0.96, b3 = k * 0.8, b4 = k * 0.88
    outline = [P(-h, -3), P(-h, b1), P(-t, b2), P(t * 0.6, b3), P(h, b4), P(h, -3)]
    faces = [
      [[P(-h, -3), P(-h, b1), P(-t, b2), P(-t, -3)], "C"],
      [[P(t, -3), P(t, b3 + 1), P(h, b4), P(h, -3)], "b"],
    ]
    cap = [P(-h, b1), P(-t, b2), P(t * 0.6, b3), P(h, b4), P(h, b4 - 4), P(t * 0.6, b3 - 5), P(-t, b2 - 4.5), P(-h, b1 - 4)]
  }
  const s = d.shape(outline, { wobble: 0.35, wave: 14 })
  d.fill(s, "B")
  for (const [pts, c] of faces) d.fill(pts, c, { wobble: 0.2 })
  const top = broken ? len * (1 - broken * 0.55) * 0.75 : sh
  d.stroke([P(-t, 1), P(-t, top)], { color: "b", width: 0.9, taper: [0.1, 0.3], wobble: 0.2 })   // facet edges
  d.stroke([P(t, 1), P(t, top)], { color: "K", width: 0.9, taper: [0.1, 0.3], wobble: 0.2 })
  if (cap) {
    d.fill(cap, "C", { wobble: 0.2 })
    d.stroke([P(-h * 0.8, (len * (1 - broken * 0.55)) * 0.86 - 1.5), P(-t * 0.3, (len * (1 - broken * 0.55)) * 0.9 - 2)], { color: "w", width: 1.3, taper: [0.3, 0.3] })
  } else {
    d.stroke([P(-h * 0.62, len * 0.12), P(-h * 0.62, len * 0.55)], { color: "w", width: Math.min(1.8, w * 0.16), taper: [0.3, 0.5] })
  }
  d.ink(s, { color: "k", weight })
  if (spark) twinkle(d, ...P(-t * 0.5, (broken ? len * 0.4 : len * 0.62)), spark)
}
// A four-point twinkle: two crossing tapered white strokes over a dark cross.
const twinkle = (d, x, y, r) => {
  d.stroke([[x - r, y], [x + r, y]], { color: "w", width: r * 0.42, taper: [0.5, 0.5], wobble: 0 })
  d.stroke([[x, y - r * 1.25], [x, y + r * 1.25]], { color: "w", width: r * 0.42, taper: [0.5, 0.5], wobble: 0 })
  d.dot(x, y, r * 0.22, "w")
}

// A crack in dark stone: a k groove with the light catching its lower-right wall.
const crack = (d, name, pts, w = 2.6) => {
  d.seed("crack:" + name)
  d.stroke(shift(pts, 1.3, 1.3), { color: "S", width: w * 0.45, taper: [0.2, 0.7], wobble: 0.4 })
  d.stroke(pts, { color: "k", width: w, taper: [0.08, 0.7], wobble: 0.5 })
}
// A chip knocked off the stone: a fresh, lighter facet with a dark rim.
const chip = (d, name, pts) => {
  d.seed("chip:" + name)
  const s = d.shape(pts, { wobble: 0.4 })
  d.fill(s, "S")
  d.fill([pts[1], pts[2], pts[3]], "s", { wobble: 0.3 })
  d.ink(s, { color: "k", weight: 1.5, lit: 0.6 })
}

// ---------- Sapphire ore node: dark stacked slabs, sapphire in the seams and on the crown ----------
// 176x152, base resting on y = 148 (bottom-center origin in the game). The slab structure of
// the iron node, a step darker; the seams are veins of deep blue and the crystals grow out of
// them (drawn over the slab above, rooted in the crevice). The crown cluster stands behind the
// top slab. Every part has its own seed, so hit1/hit2 are the same drawing with cracks, chips
// and snapped crystals added.

const slab = (d, name, { out, lit = [], dark, shade, lines = [], rim = [] }) => {
  d.seed("slab:" + name)
  const s = d.shape(fillet(out, 2.5), { wobble: 0.8, wave: 24 })
  d.fill(s, "n")
  for (const f of lit) d.fill(shrink(f, 1), "s", { wobble: 0.5 })
  d.fill(shrink(dark, 1), "K", { wobble: 0.5 })
  if (shade) d.hatch(shade, { angle: -65, spacing: 3.6, color: "K", width: 1.3, short: 0.4 })
  d.hatch(shrink(dark, 2.5), { angle: -65, spacing: 3.8, color: "k", width: 1.3, short: 0.3 })
  for (const l of lines) d.stroke(l, { color: "K", width: 1.8, taper: [0.15, 0.3], wobble: 0.5 })   // facet edges
  for (const r of rim) d.stroke(r, { color: "S", width: 2.2, taper: [0.3, 0.4], wobble: 0.5 })      // lit edges
  return s
}
// The sapphire vein between two slabs: top and bottom are point lists of the same length.
const vein = (d, name, top, bottom) => {
  d.seed("vein:" + name)
  const s = d.shape([...top, ...bottom.slice().reverse()], { wobble: 0.6, wave: 18 })
  d.fill(s, "b")
  d.fill([...shift(bottom, 0, -3.5), ...bottom.slice().reverse()], "K", { wobble: 0.4 })   // underside in shade
  const mid = top.map(([x, y], i) => [x, (y + bottom[i][1]) / 2 + 0.5])
  for (let i = 0; i < mid.length - 1; i++) {                                                // blue glints
    const [x0, y0] = mid[i], [x1, y1] = mid[i + 1]
    d.stroke([[x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2], [x0 + (x1 - x0) * 0.55, y0 + (y1 - y0) * 0.55]], { color: "B", width: 1.8, taper: [0.3, 0.3] })
    d.dot(x0 + (x1 - x0) * 0.7, y0 + (y1 - y0) * 0.7 - 0.5, 0.9, "C")
  }
  return s
}
// A crystal rooted in a crevice: the crystal, then a dark lip of rubble over its foot.
const rooted = (d, name, x, y, len, w, deg, opts) => {
  crystal(d, name, x, y, len, w, deg, opts)
  d.seed("root:" + name)
  d.stroke([[x - w * 0.75, y + 0.5], [x, y + 1.6], [x + w * 0.75, y + 0.6]], { color: "k", width: 3, taper: [0.35, 0.35], wobble: 0.3 })
}

function oreSapphire(d, stage) {
  const snap = (key, s) => (stage >= s ? 1 : 0)
  // ---- crown cluster, behind the top slab ----
  crystal(d, "crownL2", 58, 62, 18, 9, -60)
  crystal(d, "crownL", 70, 54, 30, 13, -34, { broken: snap("crownL", 2) * 0.6 })
  crystal(d, "crownTiny", 128, 58, 20, 9, 52)
  crystal(d, "crownR", 112, 50, 32, 14, 24)
  crystal(d, "crownBig", 90, 48, 45, 19, -4, { broken: snap("crownBig", 1) * 0.42 })

  // ---- bottom slab: the widest, sticks out on the left ----
  const bottom = slab(d, "bottom", {
    out: [[4, 132], [10, 118], [44, 112], [92, 114], [138, 110], [164, 112], [172, 126], [166, 146], [120, 149], [56, 150], [14, 148]],
    lit: [[[5, 131], [11, 119], [30, 115], [32, 129], [26, 147], [15, 147]]],
    dark: [[146, 113], [164, 113], [171, 126], [165, 145], [146, 148], [143, 130]],
    shade: [[104, 118], [144, 115], [142, 130], [145, 147], [100, 148]],
    lines: [[[30, 115], [32, 129], [26, 148]], [[145, 113], [143, 130], [146, 148]], [[78, 115], [82, 131], [76, 148]]],
    rim: [[[6, 128], [11, 119], [32, 114]]],
  })
  d.seed("slab:bottom:foot")                                     // dark foot where it meets the ground
  d.hatch([[32, 139], [100, 143], [143, 141], [143, 147], [64, 149], [30, 147]], { angle: -70, spacing: 3.2, color: "K", width: 1.2, short: 0.5 })
  const veinA = vein(d, "A",
    [[14, 106], [44, 102], [92, 103], [138, 98], [160, 100]],
    [[10, 118], [44, 112], [92, 114], [138, 110], [164, 112]])
  d.ink(bottom, { weight: 3 })
  d.ink(veinA, { weight: 1.8 })

  // ---- middle slab: tilted the other way, sticks out on the right ----
  const middle = slab(d, "middle", {
    out: [[16, 98], [20, 88], [30, 84], [60, 81], [100, 79], [136, 74], [152, 70], [162, 76], [164, 90], [158, 98], [110, 101], [60, 102], [22, 102]],
    lit: [[[17, 98], [21, 89], [30, 85], [34, 86], [36, 101], [22, 102]]],
    dark: [[140, 78], [153, 71], [162, 77], [163, 90], [157, 97], [140, 100], [138, 90]],
    shade: [[100, 84], [138, 80], [138, 100], [96, 101]],
    lines: [[[34, 86], [36, 101]], [[140, 78], [138, 90], [140, 100]]],
    rim: [[[18, 96], [21, 89], [30, 85], [58, 82]]],
  })
  const veinB = vein(d, "B",
    [[36, 74], [62, 70], [100, 68], [134, 62], [146, 62]],
    [[30, 84], [60, 81], [100, 79], [136, 74], [152, 70]])
  d.ink(middle, { weight: 2.8 })
  d.ink(veinB, { weight: 1.7 })
  // crystals growing out of the lower vein, over the middle slab
  rooted(d, "aL", 24, 112, 22, 10, -38, { broken: snap("aL", 2) * 0.5 })
  rooted(d, "aL2", 34, 111, 14, 8, -8)
  rooted(d, "aR", 118, 108, 24, 11, 22)
  rooted(d, "aR2", 130, 107, 14, 8, 50, { broken: snap("aR2", 1) * 0.5 })
  rooted(d, "aMid", 74, 112, 11, 7, -14)

  // ---- top slab: the crown, a ridge across its top ----
  const top = slab(d, "top", {
    out: [[38, 70], [42, 58], [56, 48], [72, 39], [90, 34], [106, 37], [122, 42], [134, 54], [140, 64], [132, 67], [100, 68], [64, 70]],
    lit: [[[41, 68], [43, 59], [56, 49], [72, 40], [80, 47], [68, 58], [56, 63], [55, 68]], [[74, 39], [90, 35], [105, 38], [120, 43], [108, 47], [82, 47]]],
    dark: [[108, 47], [121, 43], [133, 54], [139, 63], [131, 66], [119, 67], [116, 57]],
    shade: [[86, 52], [110, 50], [115, 58], [116, 67], [86, 68]],
    lines: [[[80, 47], [108, 47]], [[80, 47], [68, 58], [56, 63], [55, 68]], [[108, 47], [116, 57], [118, 67]]],
    rim: [[[40, 65], [43, 59], [56, 49], [72, 40]], [[76, 38], [89, 35]]],
  })
  d.ink(top, { weight: 2.6 })
  // crystals out of the upper vein, over the crown's foot
  rooted(d, "bL", 52, 80, 18, 9, -28)
  rooted(d, "bL2", 60, 79.5, 11, 7, 6, { broken: snap("bL2", 2) * 0.5 })
  rooted(d, "bR", 142, 71, 17, 9, 40)
  d.seed("loose")                                                 // a loose second pen line on the shadow side
  d.stroke([[170, 130], [167, 143]], { color: "k", width: 1.2, taper: [0.4, 0.4], wobble: 0.5 })

  // ---- damage ----
  if (stage >= 1) {
    chip(d, "crown", [[60, 55], [67, 49], [73, 56], [65, 61]])
    crack(d, "crown", [[97, 48], [101, 55], [94, 61], [97, 67]], 2.8)
    crack(d, "crownB", [[94, 61], [86, 64], [82, 68]], 2)
    crack(d, "chipA", [[65, 61], [63, 67]], 1.8)
  }
  if (stage >= 2) {
    chip(d, "mid", [[150, 74], [156, 71], [161, 78], [152, 82]])
    chip(d, "low", [[8, 128], [13, 120], [21, 126], [13, 134]])
    crack(d, "mid", [[84, 82], [90, 90], [84, 95], [88, 101]], 2.8)
    crack(d, "midB", [[90, 90], [102, 93], [108, 98]], 2)
    crack(d, "low", [[48, 115], [54, 127], [47, 137], [51, 147]], 2.8)
    crack(d, "lowB", [[104, 117], [110, 127], [124, 133]], 2.2)
    crack(d, "side", [[126, 49], [129, 56], [124, 64]], 2.2)
    crack(d, "chipB", [[21, 126], [30, 133]], 1.8)
  }
}

asset("f2_ore_sapphire", { w: 176, h: 152 }, (d) => oreSapphire(d, 0))
asset("f2_ore_sapphire_hit1", { w: 176, h: 152 }, (d) => oreSapphire(d, 1))
asset("f2_ore_sapphire_hit2", { w: 176, h: 152 }, (d) => oreSapphire(d, 2))

// ---------- Drop: a cut sapphire ----------
// 40x44. A brilliant seen from the front: a crown of facets over the girdle, a pointed
// pavilion below. Lit C facets on the left, dark b facets on the right.
asset("item_sapphire", { w: 40, h: 44 }, (d) => {
  d.seed("gem")
  const L = [4, 16], TL = [12, 6], TR = [28, 6], Rt = [36, 16], tip = [20, 40]
  const s = d.shape([L, TL, TR, Rt, tip], { wobble: 0.35 })
  d.fill(s, "B")
  // crown facets
  d.fill([L, TL, [15, 10], [11, 16]], "C", { wobble: 0.2 })                 // lit left bezel
  d.fill([[15, 10], [25, 10], [27, 16], [13, 16]], "B", { wobble: 0.2 })     // table
  d.fill([TL, TR, [25, 10], [15, 10]], "C", { wobble: 0.2 })                 // top star facets
  d.fill([TR, Rt, [29, 16], [25, 10]], "b", { wobble: 0.2 })                 // dark right bezel
  // pavilion facets
  d.fill([L, [11, 16], tip], "C", { wobble: 0.2 })
  d.fill([[27, 16], [36, 16], tip], "b", { wobble: 0.2 })
  d.fill([[29, 17], [35.5, 17], tip], "K", { wobble: 0.2 })
  d.hatch([[22, 18], [29, 18], [21, 36]], { angle: -60, spacing: 2.6, color: "b", width: 0.9, short: 0.3 })
  // facet edges
  d.stroke([[4.5, 16], [35.5, 16]], { color: "b", width: 1.1, taper: [0.05, 0.05] })
  for (const p of [[[11, 16], [20, 39]], [[20, 16], [20, 38]], [[27, 16], [20, 39]]]) d.stroke(p, { color: "b", width: 0.9, taper: [0.1, 0.3] })
  d.stroke([[13, 15.5], [15, 10], [25, 10], [27, 15.5]], { color: "b", width: 0.8, taper: [0.1, 0.1] })
  // glints toward the light
  d.stroke([[13, 7.5], [8, 13.5]], { color: "w", width: 1.6, taper: [0.3, 0.3] })
  d.stroke([[9, 20], [15, 30]], { color: "w", width: 1.4, taper: [0.3, 0.6] })
  d.dot(17, 12.5, 1.2, "w")
  d.ink(s, { weight: 2.2 })
})

// ---------- Crystal golem (floor 2 enemy), facing the viewer, turned slightly left ----------
// 176x152 frames, feet on y = 148, body about 164x136. A squat boulder of dark stone: big rock
// arms hanging to the ground, a small head sunk between the shoulders, glowing cyan eyes and
// sapphire shards on the shoulders and head. The far (right) arm is behind the body.
// Pose numbers: bob (body down), breath (upper body up), lift ([left, right] foot raise),
// arm ([left, right] fist down), spark (crystal twinkles 0/1), glow (eyes brighter), raise
// ([left, right] arm swung up about the shoulder, deg; needs a rigged d, see golemFrame).
function golem(d, { bob = 0, breath = 0, sway = 0, lift = [0, 0], arm = [0, 0], spark = 0, glow = 0, raise = [0, 0] } = {}) {
  const part = (name) => d.seed("golem:" + name)
  const b = bob - breath, sw = sway                                // upper-body offset
  // an arm as a bone turning about its shoulder (left arm clockwise = up and over)
  const swung = (deg, px, py, draw) => {
    if (!deg || !d.push) return draw()
    d.push(); d.rot(deg, px + sw, py + b); draw(); d.pop()
  }
  const up = (pts, dy = b) => shift(pts, sw, dy)
  const X = (x) => x + sw

  // A stone mass: n base, lit s area, dark K side hatched k, facet edge lines, lit rim.
  const stone = (name, pts, { lit, dark, shade, lines = [], rim = [], weight = 2.8, round = 8 }) => {
    part(name)
    const s = d.shape(fillet(pts, round), { wobble: 0.7, wave: 22 })
    d.fill(s, "n")
    if (lit) d.fill(shrink(lit, 1), "s", { wobble: 0.5 })
    if (shade) d.hatch(shade, { angle: -65, spacing: 3.4, color: "K", width: 1.3, short: 0.4 })
    if (dark) {
      d.fill(shrink(dark, 1), "K", { wobble: 0.5 })
      d.hatch(shrink(dark, 2.2), { angle: -65, spacing: 3.6, color: "k", width: 1.2, short: 0.3 })
    }
    for (const l of lines) d.stroke(l, { color: "K", width: 1.8, taper: [0.15, 0.3], wobble: 0.5 })
    for (const r of rim) d.stroke(r, { color: "S", width: 2.1, taper: [0.3, 0.4], wobble: 0.5 })
    return s
  }

  // ---- far arm (viewer's right), behind the body; its shoulder shards first ----
  const ar = arm[1]
  swung(-raise[1], 146, 62, () => {
  const farArm = stone("armR", up([[154, 58], [138, 54], [124, 62], [124, 84], [130, 104], [130, 122 + ar], [138, 134 + ar], [158, 134 + ar], [168, 122 + ar], [168, 98], [164, 74]]), {
    lit: up([[138, 57], [152, 60], [156, 72], [146, 82], [136, 76], [127, 64]]),
    dark: up([[158, 80], [166, 96], [166, 120 + ar], [158, 132 + ar], [150, 120 + ar], [154, 100]]),
    shade: up([[132, 96], [154, 100], [150, 120 + ar], [140, 130 + ar], [132, 120 + ar]]),
    lines: [up([[132, 106 + ar * 0.5], [146, 110 + ar], [160, 108 + ar]])],                          // the fist's knuckle line
    rim: [up([[128, 64], [138, 57], [150, 58]])],
  })
  d.ink(farArm, { weight: 2.8 })
  })
  crystal(d, "shR1", X(146), 58 + b, 22, 11, 30)
  crystal(d, "shR2", X(136), 56 + b, 16, 8, 8, { spark: spark ? 3.2 : 0 })

  // ---- legs: stumps under the body, the lifted one shorter ----
  const leg = (name, x, l) => {
    const foot = 148 - l, topY = 100 + b
    const s = stone("leg" + name, [[x - 15, topY], [x + 15, topY], [x + 17, foot - 10], [x + 19, foot - 2], [x + 6, foot], [x - 12, foot], [x - 19, foot - 3], [x - 17, foot - 12]], {
      lit: [[x - 15, topY + 2], [x - 6, topY + 2], [x - 8, foot - 12], [x - 16, foot - 10]],
      dark: [[x + 7, topY + 2], [x + 14, topY + 2], [x + 17, foot - 3], [x + 6, foot - 1], [x + 8, foot - 12]],
      lines: [[[x - 16, foot - 10], [x - 2, foot - 13], [x + 16, foot - 10]]],                   // the foot's top edge
      round: 5,
    })
    d.ink(s, { weight: 2.6 })
    part("toes" + name)
    for (const tx of [-9, 0, 9]) d.stroke([[x + tx, foot - 6], [x + tx + 0.6, foot - 1]], { color: "k", width: 1.6, taper: [0.2, 0.4], wobble: 0.3 })
  }
  leg("L", 62, lift[0])
  leg("R", 112, lift[1])

  // ---- body: one big boulder ----
  const body = stone("body", up([[36, 96], [38, 72], [52, 52], [78, 42], [110, 44], [132, 56], [142, 80], [140, 104], [126, 122], [90, 130], [56, 126], [40, 114]]), {
    round: 12,
    lit: up([[40, 92], [42, 72], [54, 55], [78, 46], [96, 46], [80, 58], [62, 72], [54, 94]]),
    dark: up([[118, 56], [134, 62], [139, 82], [137, 104], [124, 119], [114, 104], [118, 80]]),
    shade: up([[60, 104], [116, 100], [124, 118], [90, 127], [58, 122]]),
    lines: [up([[54, 94], [62, 72], [80, 58], [96, 47]]), up([[118, 58], [118, 80], [114, 104], [124, 120]])],
    rim: [up([[39, 86], [42, 72], [54, 55], [70, 47]])],
  })
  // the crystal heart: cracks spread from a socket in the chest
  for (const [name, pts] of [
    ["c1", [[78, 100], [70, 96], [64, 100], [56, 98]]],
    ["c2", [[98, 102], [106, 108], [104, 116]]],
    ["c3", [[86, 106], [84, 114], [89, 122]]],
    ["c4", [[94, 92], [100, 84], [108, 82]]],
  ]) {
    part("heart:" + name)
    d.stroke(up(shift(pts, 1.2, 1.2)), { color: "s", width: 1.1, taper: [0.2, 0.7], wobble: 0.3 })
    d.stroke(up(pts), { color: "k", width: 2.3, taper: [0.1, 0.75], wobble: 0.4 })
  }
  part("bodyInk")
  d.ink(body, { weight: 3 })
  part("socket")
  d.blob(up(E(88, 102, 13, 6, 18)), { fill: "k", ink: null, wobble: 0.4 })
  d.fill(up(E(88, 101.4, 10.5, 4, 16)), "b", { wobble: 0.3 })     // blue light deep in the socket
  crystal(d, "heartL", X(80), 103 + b, 16, 9, -26)
  crystal(d, "heartR", X(97), 103 + b, 13, 8, 30)
  crystal(d, "heartM", X(88), 104 + b, 22, 11, 2)
  part("socketLip")
  d.stroke(up([[76, 104.5], [88, 107.5], [100, 104.5]]), { color: "k", width: 3, taper: [0.3, 0.3], wobble: 0.3 })

  // ---- near arm (viewer's left): shoulder shards, then the arm ----
  const al = arm[0]
  swung(raise[0], 34, 64, () => {
  const nearArm = stone("armL", up([[22, 60], [40, 52], [54, 60], [54, 82], [46, 102], [46, 122 + al], [38, 134 + al], [16, 134 + al], [6, 122 + al], [8, 98], [12, 76]]), {
    lit: up([[14, 74], [22, 62], [40, 55], [50, 62], [36, 72], [24, 80], [12, 98]]),
    dark: up([[40, 84], [52, 82], [44, 102], [44, 122 + al], [36, 132 + al], [32, 120 + al], [38, 100]]),
    shade: up([[12, 108 + al], [34, 110 + al], [34, 128 + al], [18, 132 + al], [8, 120 + al]]),
    lines: [up([[10, 108 + al], [24, 112 + al], [44, 108 + al]]), up([[24, 80], [36, 72], [50, 62]])],
    rim: [up([[10, 96], [12, 78], [22, 63], [36, 56]])],
  })
  part("knuckles")
  for (const kx of [18, 28]) d.stroke(up([[kx, 113 + al], [kx + 1, 122 + al]]), { color: "K", width: 1.5, taper: [0.2, 0.4] })
  d.ink(nearArm, { weight: 2.8 })
  })
  crystal(d, "shL1", X(26), 60 + b, 28, 13, -32, { spark: spark ? 3.6 : 0 })
  crystal(d, "shL2", X(40), 54 + b, 22, 11, -6)
  crystal(d, "shL3", X(16), 70 + b, 14, 8, -62)

  // ---- head: shards behind it, then a small block sunk between the shoulders ----
  crystal(d, "headL", X(70), 40 + b, 20, 10, -22)
  crystal(d, "headM", X(84), 38 + b, 26, 13, 4)
  crystal(d, "headR", X(98), 42 + b, 15, 8, 34, { spark: spark ? 2.8 : 0 })
  const head = stone("head", up([[52, 58], [56, 40], [70, 32], [94, 33], [106, 44], [104, 62], [92, 72], [64, 72]]), {
    round: 7,
    lit: up([[54, 56], [57, 42], [70, 35], [90, 35], [78, 40], [62, 46], [58, 58]]),
    dark: up([[96, 44], [104, 46], [102, 62], [92, 70], [94, 58]]),
    lines: [up([[58, 58], [62, 46], [78, 40], [92, 36]])],
    rim: [up([[54, 52], [57, 42], [68, 35]])],
    weight: 2.6,
  })
  // a heavy brow over deep sockets
  part("sockets")
  for (const [ex, ey] of [[67, 55], [88, 55]]) d.fill(E(X(ex), ey + b, 8, 5.5, 16), "k", { wobble: 0.3 })
  part("brow")
  d.stroke(up([[56, 48], [68, 46.5], [78, 49], [90, 46], [102, 48]]), { color: "k", width: 3.2, taper: [0.2, 0.25], wobble: 0.4 })
  part("eyes")
  for (const [ex, ey, rx] of [[66, 55.5, 4.6], [87, 55.5, 4.2]]) {
    d.fill(E(X(ex), ey + b, rx + 1.4, 3.4, 14), "b", { wobble: 0.2 })
    d.fill(E(X(ex) - 0.3, ey + b - 0.2, rx, 2.6 + glow * 0.3, 14), "B", { wobble: 0.2 })
    d.fill(E(X(ex) - 0.6, ey + b - 0.3, rx * 0.65, 1.8 + glow * 0.3, 12), "C", { wobble: 0.15 })
    d.dot(X(ex) - 1.8, ey + b - 0.8, 0.9 + glow * 0.3, "w")
  }
  part("mouth")
  d.stroke(up([[68, 65], [74, 66.5], [79, 64.5], [86, 66]]), { color: "k", width: 2, taper: [0.25, 0.3], wobble: 0.3 })
  part("headInk")
  d.ink(head, { weight: 2.6 })
}

// Every frame goes through the rig: the 176x152 design sits at (32, 68) in a 240x220 frame (feet
// on y = 216, Godot offset y -106), room for the arms raised overhead. sx / sy: squash and
// stretch about the feet.
const GOLEM_FEET = [88, 148]
function golemFrame(d, { sx = 1, sy = 1, ...pose } = {}) {
  golem(rig(d).move(32, 68).scale(sx, sy, ...GOLEM_FEET), pose)
}
// Walk: 8 frames from one phase. A heavy stomp: the body sways over the planted foot and
// sinks (squashing) at each contact (phase 0 and PI), the arms swing against the legs.
const golemWalk = (i) => {
  const t = i / 8 * 2 * PI, c = Math.cos(t), a = Math.abs(c), m = 1 - a
  return { bob: -2 * a + 3 * m, sway: 2 * c, lift: [9 * Math.max(0, c), 9 * Math.max(0, -c)], arm: [-3 * c + m, 3 * c + m],
    raise: [4 * c, -4 * c], sx: 1 + 0.025 * m, sy: 1 - 0.03 * m }
}
// Slam: squats, heaves both arms overhead (stretched, eyes flaring), holds them up a moment (the
// tell), brings them down on the ground (squashed), straightens. enemy.gd deals the hit on the
// slam frame (4) and puffs dust.
const GOLEM_SLAM = [
  { ms: 130, sx: 1.05, sy: 0.94, bob: 4, raise: [25, 25], arm: [-2, -2] },
  { ms: 140, sx: 0.96, sy: 1.06, bob: -4, raise: [120, 120], glow: 1 },
  { ms: 110, sx: 0.94, sy: 1.08, bob: -6, raise: [150, 150], glow: 1, spark: 1, breath: 2 },
  { ms: 90, sx: 0.95, sy: 1.07, bob: -6, raise: [158, 158], glow: 1, spark: 1, breath: 2 },
  { ms: 70, sx: 1.12, sy: 0.88, bob: 6, raise: [-18, -18], arm: [6, 6], glow: 1 },
  { ms: 140, sx: 1.09, sy: 0.91, bob: 5, raise: [-14, -14], arm: [5, 5] },
  { ms: 160, sx: 1.03, sy: 0.97, bob: 2, raise: [-4, -4], arm: [2, 2] },
]
sheet("golem", { w: 240, h: 220 }, {
  golem_idle: [
    { ms: 330, draw: (d) => golemFrame(d) },
    { ms: 200, draw: (d) => golemFrame(d, { breath: 1, arm: [-0.5, -0.5], sy: 1.01 }) },
    { ms: 330, draw: (d) => golemFrame(d, { breath: 2, arm: [-1, -1], spark: 1, glow: 1, sy: 1.02, sx: 0.99 }) },
    { ms: 200, draw: (d) => golemFrame(d, { breath: 1, arm: [-0.5, -0.5], glow: 1, sy: 1.01 }) },
  ],
  golem_walk: Array.from({ length: 8 }, (_, i) => ({ ms: 80, draw: (d) => golemFrame(d, golemWalk(i)) })),
  golem_attack: GOLEM_SLAM.map(({ ms, ...pose }) => ({ ms, draw: (d) => golemFrame(d, pose) })),
})
