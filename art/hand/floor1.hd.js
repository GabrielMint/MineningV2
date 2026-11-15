include("_lib.hd.js")
// Mine floor 1, "A Antiga Mina" (the Old Mine), hand-drawn: tiles, edge decals and props.
// Units: 4 per logical pixel, so one 32x32 cell is 128x128. Light from the top-left: lit areas
// and thin ink toward it, hatching and heavy ink on the bottom-right.
// - Floor tiles are flat `D` dirt with no rim; every mark stays >= 10 units from the edges and
//   uses low-contrast keys (e/E/d), so any arrangement tiles seamlessly.
// - Wall faces share the same edge profile: a lit lip pinned at y = 10 along the top, a dark
//   crevice at both sides, a black foot pinned at y = 116 along the bottom.
// - Sheet frames are not clipped: anything drawn outside 0..128 would bleed into the 4-unit pad,
//   so full-tile fills overshoot by 2 at most and every other mark stays inside.

const PI = Math.PI
const T = 128                                                   // one cell
const R = (d, a, b) => a + d.rng() * (b - a)
const rot = (pts, cx, cy, a) => {
  const c = Math.cos(a), s = Math.sin(a)
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])
}

// A wobbly line across the tile, pinned to y0 at both edges (and beyond), so neighbors line up.
const profile = (d, y0, amp, n = 6) => {
  const ks = [0, ...Array.from({ length: n - 1 }, () => (d.rng() - 0.5) * 2 * amp), 0]
  return (x) => {
    const t = Math.min(Math.max(x / T, 0), 1) * n, i = Math.min(Math.floor(t), n - 1), f = t - i, s = f * f * (3 - 2 * f)
    return y0 + ks[i] * (1 - s) + ks[i + 1] * s
  }
}
const along = (f, x0, x1, step = 4) => {
  const out = [], n = Math.max(1, Math.round(Math.abs(x1 - x0) / step))
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; out.push([x, f(x)]) }
  return out
}

// Random points in a box, kept apart from each other.
const scatter = (d, n, x0, y0, x1, y1, gap, avoid = []) => {
  const pts = [...avoid]
  for (let tries = 0; tries < n * 40 && pts.length < n + avoid.length; tries++) {
    const p = [R(d, x0, x1), R(d, y0, y1)]
    if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > gap)) pts.push(p)
  }
  return pts.slice(avoid.length)
}

// The longest stretch of a closed shape's outline whose normal faces the bottom-right (away from
// the light): where a recess shows its lit inner wall.
const litRun = (s, k) => {
  const n = s.pts.length, ok = (i) => (s.n[i % n][0] + s.n[i % n][1]) / Math.SQRT2 > k
  let start = 0
  while (start < n && ok(start)) start++                                              // begin the scan outside a run
  let best = [], run = []
  for (let j = start; j < start + n; j++) {
    if (ok(j)) run.push(s.pts[j % n])
    else { if (run.length > best.length) best = run; run = [] }
  }
  if (run.length > best.length) best = run
  return best.length > 2 ? best : s.pts.slice(0, 3)
}

// ---------- small marks ----------
// A pebble half sunk in the dirt: body, lit cap, thin dark ink.
const pebble = (d, x, y, r, { fill = "e", lit = "E", ink = "d", weight = 0.9 } = {}) => {
  const s = d.shape(ellipsePts(x, y, r * R(d, 1.1, 1.45), r, 10), { wobble: r * 0.12 + 0.15, wave: 8 })
  d.fill(s, fill)
  if (r > 2.4 && lit) d.fill(ellipsePts(x - r * 0.3, y - r * 0.35, r * 0.5, r * 0.32, 8), lit, { wobble: 0.15 })
  d.ink(s, { color: ink, weight })
  return s
}
const scuff = (d, x, y) => {                                     // a drag mark in the dirt
  const a = R(d, -0.5, 0.5), l = R(d, 6, 13)
  d.stroke([[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + R(d, -0.8, 0.8)], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "d", width: R(d, 1.2, 1.7), taper: [0.3, 0.4], wobble: 0.3 })
}
const grit = (d, x, y) => d.dot(x, y, R(d, 0.8, 1.3), d.rng() < 0.7 ? "e" : "d")

// Plain dirt: a few pebbles, scuffs and grit, spread evenly so no tile stands out.
const dirt = (d, { pebbles = 4, scuffs = 2, grits = 5, avoid = [] } = {}) => {
  d.fill(rectPts(-2, -2, T + 4, T + 4), "D", { wobble: 0 })
  const spots = scatter(d, pebbles + scuffs + grits, 14, 14, T - 14, T - 14, 16, avoid)
  spots.forEach(([x, y], i) => {
    if (i < pebbles) {
      pebble(d, x, y, R(d, 1.8, 3.6), { fill: d.rng() < 0.75 ? "e" : "E", lit: d.rng() < 0.6 ? "E" : null })
      if (d.rng() < 0.5) pebble(d, x + R(d, 4, 6), y + R(d, 1, 3), R(d, 1.2, 1.8), { lit: null, weight: 0.8 })
    } else if (i < pebbles + scuffs) scuff(d, x, y)
    else { grit(d, x, y); if (d.rng() < 0.5) grit(d, x + R(d, 2, 4), y + R(d, -2, 2)) }
  })
}

// ---------- wood ----------
// A board from a to b (center line), w wide. Ends "cut" or "broken" (splintered). The side
// facing the light gets a lit strip, the other a dark one; grain runs along it.
const board = (d, a, b, w, { fill = "e", lit = "E", dark = "D", grain = "D", ink = "k", weight = 2, endA = "cut", endB = "cut", knots = 0, wobble = 0.6, fresh = "E" } = {}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L
  let nx = -uy, ny = ux
  if (nx * -1 + ny * -1 < 0) { nx = -nx; ny = -ny }                 // +t = the lit side
  const P = (s, t) => [a[0] + ux * s + nx * t, a[1] + uy * s + ny * t]
  const h = w / 2
  const jag = (s0, dir, t0, t1) => {                                // splintered end, from t0 to t1
    const pts = [], n = 5
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, deep = i % 2 ? R(d, 5, 11) : R(d, 0, 3)
      pts.push(P(s0 - dir * deep, t))
    }
    return pts
  }
  const jA = endA === "broken" ? 11 : 0, jB = endB === "broken" ? 11 : 0
  const outline = [
    ...(endA === "broken" ? jag(0, -1, -h, h) : [P(0, -h), P(0, h)]),
    ...(endB === "broken" ? jag(L, 1, h, -h) : [P(L, h), P(L, -h)]),
  ]
  const s = d.shape(fillet(outline, 1.4, 3), { wobble, wave: 22 })
  d.fill(s, fill)
  d.fill([P(jA + 1.5, h - 0.8), P(L - jB - 1.5, h - 0.8), P(L - jB - 1.5, h - Math.max(1.8, w * 0.22)), P(jA + 1.5, h - Math.max(1.8, w * 0.22))], lit, { wobble: 0.4 })
  d.fill([P(jA + 1.5, -h + 0.8), P(L - jB - 1.5, -h + 0.8), P(L - jB - 1.5, -h + w * 0.27), P(jA + 1.5, -h + w * 0.27)], dark, { wobble: 0.4 })
  for (let i = 0; i < Math.max(1, Math.round(L / 34)); i++) {      // grain
    const t = R(d, -w * 0.2, w * 0.18), s0 = jA + R(d, 2, L * 0.5), s1 = Math.min(s0 + L * R(d, 0.2, 0.45), L - jB - 2)
    if (s1 - s0 < 6) continue
    const m = P((s0 + s1) / 2, t + R(d, -1.2, 1.2))
    d.stroke([P(s0, t), m, P(s1, t)], { color: grain, width: 1.1, wobble: 0.7 })
  }
  for (let i = 0; i < knots; i++) {
    const [kx, ky] = P(R(d, L * 0.3, L * 0.7), R(d, -w * 0.15, w * 0.1))
    d.blob(rot(ellipsePts(kx, ky, 2.6, 1.6, 10), kx, ky, Math.atan2(uy, ux)), { fill: dark, ink: "d", weight: 0.8, wobble: 0.2 })
  }
  for (const [end, s0, dir] of [[endA, 0, 1], [endB, L, -1]]) {     // fresh fibers at a break
    if (end !== "broken") continue
    for (let i = 0; i < 3; i++) {
      const t = R(d, -h * 0.6, h * 0.6), q = s0 + dir * R(d, 7, 10)
      d.stroke([P(q, t), P(q + dir * R(d, 6, 10), t + R(d, -0.6, 0.6))], { color: fresh, width: 1.1, taper: [0.5, 0.2], wobble: 0.3 })
    }
  }
  d.ink(s, { color: ink, weight })
  return { s, P, L }
}

// ---------- floor detail tiles ----------
const crackTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 0, grits: 3, avoid: [[64, 64], [44, 48], [84, 80], [60, 40], [74, 92]] })
  d.seed("crack")
  const main = [[30, 38], [44, 50], [52, 49], [62, 62], [74, 70], [80, 82], [94, 92]]
  const branches = [[[52, 49], [56, 38], [62, 32]], [[74, 70], [86, 66], [96, 68]], [[62, 62], [56, 74], [58, 84]]]
  d.stroke(main.map(([x, y]) => [x + 1.4, y + 1.6]), { color: "e", width: 1.4, taper: [0.2, 0.3], wobble: 0.6 })   // lit far wall
  for (const b of branches) d.stroke(b.map(([x, y]) => [x + 1.2, y + 1.4]), { color: "e", width: 1, taper: [0.1, 0.5] })
  d.stroke(main, { color: "d", width: 3.6, taper: [0.15, 0.25], wobble: 0.7 })
  for (const b of branches) d.stroke(b, { color: "d", width: 2.2, taper: [0.05, 0.7], wobble: 0.5 })
  for (const [x, y, r] of [[46, 58, 2], [70, 60, 1.6], [86, 88, 1.8]]) pebble(d, x, y, r, { lit: null })              // chips knocked loose
}

const puddleTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 2, avoid: [[64, 64], [40, 64], [88, 64], [64, 50], [64, 78]] })
  d.seed("puddle")
  d.fill(ellipsePts(64, 65, 40, 24, 32), "d", { wobble: 3, wave: 40 })                  // damp dirt around it
  const s = d.shape(ellipsePts(64, 64, 32, 18, 36), { wobble: 2.2, wave: 34 })
  d.fill(s, "b")
  d.fill([...arcPts(64, 64, 32, 18, 0.95 * PI, 1.75 * PI, 14), ...arcPts(67, 68, 30, 17, 1.75 * PI, 0.95 * PI, 14)], "K", { wobble: 0.6 })   // the bank shades the far side
  for (const [x, y, l] of [[60, 72, 12], [76, 66, 8], [48, 70, 6]]) d.stroke([[x, y], [x + l, y - 0.6]], { color: "B", width: 1.6, taper: [0.3, 0.4] })
  d.stroke(arcPts(78, 60, 6, 2, 0.1 * PI, 0.9 * PI, 8), { color: "B", width: 1, taper: [0.3, 0.3] })                  // a drip ring
  d.stroke(arcPts(78, 60, 6, 2, 1.1 * PI, 1.9 * PI, 8), { color: "B", width: 0.9, taper: [0.3, 0.3] })
  d.dot(84, 69, 1.3, "C"); d.dot(56, 74, 0.9, "C")
  d.ink(s, { color: "d", weight: 1.8, lit: -0.5 })                                      // a recess: heavier toward the light
  d.stroke(arcPts(64, 64, 34, 20, 0.05 * PI, 0.6 * PI, 12), { color: "e", width: 1.2, taper: [0.3, 0.3] })   // lit near bank
  for (const [x, y, r] of [[30, 58, 2.2], [97, 72, 2.6], [92, 52, 1.6]]) pebble(d, x, y, r)
}

const gravelTile = (d) => {
  dirt(d, { pebbles: 1, scuffs: 1, grits: 2, avoid: [[64, 64], [44, 60], [84, 66], [64, 50], [64, 80]] })
  d.seed("gravel")
  const stones = []
  for (let i = 0; i < 60 && stones.length < 22; i++) {
    const a = d.rng() * 2 * PI, k = Math.sqrt(d.rng())
    const x = 64 + Math.cos(a) * k * 34, y = 64 + Math.sin(a) * k * 22
    const r = R(d, 1.6, 4.8) * (1.2 - k * 0.5)
    if (stones.every(([qx, qy, qr]) => Math.hypot(x - qx, y - qy) > (r + qr) * 0.9)) stones.push([x, y, r])
  }
  d.hatch(ellipsePts(66, 68, 34, 20, 24), { angle: -60, spacing: 3.6, color: "d", width: 1.1, skip: 0.35, short: 0.7 })   // grit packed between them
  stones.sort((p, q) => p[1] - q[1])
  for (const [x, y, r] of stones) pebble(d, x, y, r, { fill: d.rng() < 0.12 ? "s" : d.rng() < 0.3 ? "E" : "e", lit: d.rng() < 0.7 ? "E" : null, weight: 1 })
}

const slabTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 2, avoid: [[64, 64], [40, 52], [88, 52], [44, 80], [86, 82]] })
  d.seed("slab")
  const outline = fillet([[30, 40], [70, 34], [100, 42], [98, 88], [56, 94], [28, 84]], 7)
  const s = d.shape(outline, { wobble: 1.2, wave: 30 })
  d.fill(s, "e")
  d.fill(fillet([[32, 42], [70, 36], [98, 44], [96, 50], [70, 43], [37, 49], [34, 82], [30, 80]], 3), "E", { wobble: 0.6 })   // lit top-left bevel
  d.hatch([[60, 64], [98, 56], [97, 88], [56, 94]], { angle: -62, spacing: 3.4, color: "D", width: 1.1, inset: 2 })
  d.stroke([[52, 44], [56, 58], [50, 70]], { color: "D", width: 1.4, taper: [0.1, 0.5] })                     // cracks
  d.stroke([[56, 58], [70, 62]], { color: "D", width: 1.1, taper: [0.1, 0.6] })
  d.stroke([[88, 50], [80, 60]], { color: "D", width: 1, taper: [0.2, 0.5] })
  d.stroke([[54, 45], [57, 57]], { color: "c", width: 0.9, taper: [0.4, 0.4] })                                 // lit lip of the crack
  d.ink(s, { color: "d", weight: 1.8 })
  // dirt drifted over its lower-right edge: the slab is half buried
  const drift = d.shape([[106, 62], [96, 70], [86, 82], [70, 88], [52, 92], [44, 100], [60, 106], [92, 102], [110, 90]], { wobble: 2.4, wave: 24 })
  d.fill(drift, "D")
  d.stroke(drift.pts.slice(0, Math.floor(drift.pts.length * 0.45)), { color: "d", width: 1.4, taper: [0.2, 0.2], wobble: 0.4 })
  for (const [x, y, r] of [[92, 80, 1.8], [74, 90, 2.2], [58, 96, 1.4]]) pebble(d, x, y, r, { lit: null })
}

// A boot print pressed into the dirt: one sole outline (wide toe, narrow waist, heel), the tread
// and the heel's edge pressed deeper, the inner wall on the bottom-right catching the light.
const bootPrint = (d, x, y, a, right) => {
  const m = right ? 1 : -1                                                              // left/right boot: the waist curves inward
  const local = [
    ...arcPts(7, 0, 7.5, 6.2, -0.5 * PI, 0.5 * PI, 10),                                 // toe
    [0, 4.8 + m * 0.6], [-5, 4.2 + m * 0.6],                                           // waist, near side
    ...arcPts(-10, 0, 5, 5, 0.5 * PI, 1.5 * PI, 8),                                     // heel
    [-5, -4.2 + m * 0.6], [0, -4.8 + m * 0.6],
  ]
  const pts = rot(local.map(([u, v]) => [x + u, y + v]), x, y, a)
  const s = d.shape(pts, { wobble: 0.35 })
  d.fill(s, "d")
  const P = (u, v) => rot([[x + u, y + v]], x, y, a)[0]
  for (const u of [3, 6.5, 10]) d.stroke([P(u, -4.2), P(u + 0.6, 4.2)], { color: "D", width: 1.1, taper: [0.25, 0.25], wobble: 0.2 })   // tread
  d.stroke([P(-5.6, -3.6), P(-5.8, 3.6)], { color: "D", width: 1, taper: [0.2, 0.2], wobble: 0.2 })                                   // heel edge
  d.stroke(litRun(s, 0.5).map(([px, py]) => [px - 1.1, py - 1.1]), { color: "e", width: 1, taper: [0.3, 0.3], wobble: 0.2 })   // inner wall facing the light
}
const printsTile = (d) => {
  dirt(d, { pebbles: 3, scuffs: 0, grits: 3, avoid: [[32, 98], [52, 76], [76, 54], [98, 32], [64, 64]] })
  d.seed("prints")
  const a = -0.78                                                                       // walking up and to the right
  for (let i = 0; i < 4; i++) {
    const t = i / 3, x = 30 + 68 * t, y = 100 - 68 * t, side = i % 2 ? 1 : -1
    bootPrint(d, x + Math.cos(a + PI / 2) * 7 * side, y + Math.sin(a + PI / 2) * 7 * side, a + R(d, -0.08, 0.08), side > 0)
  }
}

const plankTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 3, avoid: [[64, 66], [36, 72], [92, 60], [50, 70], [78, 62]] })
  d.seed("plank")
  const { P } = board(d, [24, 76], [100, 58], 17, { ink: "d", weight: 1.7, endB: "broken", knots: 1 })
  nail(d, ...P(7, 0), 1.5, { rim: "d", top: "S" })
  const [nx, ny] = P(40, -2)                                                             // a bent nail sticking out
  d.stroke([[nx, ny], [nx + 2, ny - 4], [nx + 6, ny - 5]], { color: "d", width: 2.2, taper: [0, 0.2], wobble: 0.2 })
  d.stroke([[nx, ny], [nx + 2, ny - 4], [nx + 6, ny - 5]], { color: "s", width: 1, taper: [0, 0.3], wobble: 0.2 })
  for (const [x, y, l, a] of [[96, 74, 12, 0.3], [104, 70, 8, -0.5]]) {                 // splinters that came off
    d.stroke([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "d", width: 3.2, taper: [0.1, 0.6] })
    d.stroke([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "E", width: 1.4, taper: [0.1, 0.6] })
  }
}

const mushroom = (d, x, y, r) => {                                                      // (x, y) = foot of the stem
  d.seed("mush" + x)
  const stem = d.shape(roundRect(x - r * 0.32, y - r * 1.25, r * 0.64, r * 1.25, r * 0.25), { wobble: 0.3 })
  d.fill(stem, "c")
  d.stroke([[x + r * 0.18, y - r * 1.1], [x + r * 0.18, y - 1]], { color: "E", width: Math.max(0.9, r * 0.2), taper: [0.2, 0.2] })
  const iw = Math.min(1.2, 0.45 + r * 0.09)                                             // small ones get finer ink
  d.ink(stem, { color: "d", weight: iw * 0.85 })
  const cap = d.shape([...arcPts(x, y - r * 1.2, r, r * 0.75, PI, 2 * PI, 14), ...arcPts(x, y - r * 1.2, r, r * 0.28, 0, PI, 8)], { wobble: 0.35 })
  d.fill(cap, "E")
  d.fill(arcPts(x, y - r * 1.2, r * 0.95, r * 0.24, 0.05 * PI, 0.95 * PI, 8).concat(arcPts(x, y - r * 1.3, r * 0.9, r * 0.2, 0.95 * PI, 0.05 * PI, 8)), "e", { wobble: 0.2 })   // gills under the rim
  d.fill(ellipsePts(x - r * 0.35, y - r * 1.55, r * 0.32, r * 0.18, 8), "c", { wobble: 0.15 })
  d.ink(cap, { color: "d", weight: iw })
}
const mushroomsTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 2, avoid: [[62, 64], [44, 72], [80, 70], [62, 50]] })
  d.seed("mushrooms")
  d.fill(ellipsePts(64, 75, 20, 6, 20), "d", { wobble: 1.6, wave: 20 })                 // damp rot under them
  d.stroke([[42, 76], [58, 73], [82, 75]], { color: "e", width: 1.2, taper: [0.3, 0.3], wobble: 0.8 })
  for (const [x, y, r] of [[50, 74, 6], [64, 70, 9], [77, 76, 5.5], [57, 80, 3.6], [86, 72, 3]]) mushroom(d, x, y, r)
}

const rootTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 3, avoid: [[30, 40], [50, 58], [72, 66], [96, 86], [62, 52]] })
  d.seed("root")
  const segs = [[[22, 32], [32, 40], [44, 50], [54, 58]], [[66, 62], [78, 66], [88, 76], [100, 92]]]  // dives under between them
  for (const seg of segs) {
    d.stroke(seg, { color: "d", width: 8.4, taper: [0.12, 0.12], wobble: 0.8 })
    d.stroke(seg, { color: "e", width: 5.2, taper: [0.16, 0.16], wobble: 0.8 })
    d.stroke(seg.map(([x, y]) => [x - 0.6, y - 1.6]), { color: "E", width: 1.3, taper: [0.3, 0.3], wobble: 0.5 })
    for (const [x, y] of [seg[0], seg[seg.length - 1]]) {                                 // dirt heaped where it dives
      d.fill(ellipsePts(x, y + 1, 6, 4, 12), "D", { wobble: 0.8 })
      d.stroke(arcPts(x, y + 1, 6, 4, 1.05 * PI, 1.95 * PI, 8), { color: "e", width: 1, taper: [0.3, 0.3] })
      d.stroke(arcPts(x, y + 1, 6.4, 4.4, 0.05 * PI, 0.95 * PI, 8), { color: "d", width: 1.4, taper: [0.2, 0.2] })
    }
  }
  for (const [x, y, dx, dy] of [[38, 46, -6, 9], [80, 68, 9, -6], [90, 78, -8, 6], [48, 54, 8, -7]]) {      // rootlets
    d.stroke([[x, y], [x + dx * 0.6, y + dy * 0.5], [x + dx, y + dy]], { color: "d", width: 2.2, taper: [0, 0.8], wobble: 0.4 })
  }
}

const coalTile = (d) => {
  dirt(d, { pebbles: 2, scuffs: 1, grits: 2, avoid: [[64, 64], [42, 62], [86, 66], [64, 50], [64, 80]] })
  d.seed("coal")
  for (const [x, y, rx, ry] of [[60, 66, 18, 9], [80, 72, 11, 6], [44, 66, 8, 5]]) d.fill(ellipsePts(x, y, rx, ry, 18), "d", { wobble: 2, wave: 16 })   // black dust
  d.hatch(ellipsePts(64, 68, 34, 18, 24), { angle: -60, spacing: 3.4, color: "d", width: 1.1, skip: 0.4, short: 0.7 })
  for (let i = 0; i < 9; i++) d.dot(R(d, 34, 94), R(d, 52, 82), R(d, 0.7, 1.2), "K")
  const lumps = [[52, 60, 8], [68, 56, 6], [74, 68, 9], [58, 74, 6.5], [88, 64, 4.5], [42, 70, 4], [80, 80, 3.6], [36, 58, 3]]
  lumps.sort((p, q) => p[1] - q[1])
  for (const [x, y, r] of lumps) {
    const n = 6, ph = d.rng() * PI
    const pts = Array.from({ length: n }, (_, i) => { const a = ph + i * 2 * PI / n + R(d, -0.25, 0.25), k = r * R(d, 0.8, 1.1); return [x + Math.cos(a) * k * 1.15, y + Math.sin(a) * k * 0.85] })
    const s = d.shape(fillet(pts, r * 0.18, 2), { wobble: 0.3 })
    d.fill(s, "K")
    d.fill([[x - r * 0.75, y - r * 0.1], [x - r * 0.3, y - r * 0.65], [x + r * 0.35, y - r * 0.6], [x, y - r * 0.1]], "n", { wobble: 0.2 })   // lit facet
    if (r > 4) d.stroke([[x - r * 0.4, y - r * 0.45], [x, y - r * 0.5]], { color: "S", width: 1, taper: [0.3, 0.3] })
    d.ink(s, { color: "k", weight: r > 5 ? 1.4 : 1.1 })
  }
}

const boneTile = (d) => {
  dirt(d, { pebbles: 3, scuffs: 1, grits: 3, avoid: [[64, 64], [42, 72], [86, 56], [64, 76]] })
  d.seed("bone")
  const a = [42, 74], b = [88, 56], ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1])
  const knobs = [[a[0] - uy * 3.6, a[1] + ux * 3.6, 5], [a[0] + uy * 3.6, a[1] - ux * 3.6, 4.6], [b[0] - uy * 3.4, b[1] + ux * 3.4, 4.6], [b[0] + uy * 3.6, b[1] - ux * 3.6, 5.2]]
  const shaft = [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1], b]
  d.stroke(shaft, { color: "d", width: 10, taper: [0, 0], wobble: 0.4 })               // ink first, then the fills
  for (const [x, y, r] of knobs) d.dot(x + 0.3, y + 0.4, r + 1.6, "d")
  d.stroke(shaft, { color: "c", width: 6.6, taper: [0, 0], wobble: 0.4 })
  for (const [x, y, r] of knobs) d.dot(x, y, r, "c")
  d.stroke(shaft.map(([x, y]) => [x - uy * -2, y + ux * -2].map((v, k) => v + (k ? 1.6 : 0.3))), { color: "E", width: 1.6, taper: [0.15, 0.15] })   // shade along the lower side
  for (const [x, y, r] of [knobs[0], knobs[3]]) d.stroke(arcPts(x, y, r * 0.7, r * 0.7, 0.05 * PI, 0.7 * PI, 6), { color: "E", width: 1.2, taper: [0.3, 0.3] })
  d.stroke([[60, 66], [66, 64.4]], { color: "E", width: 0.9, taper: [0.3, 0.3] })      // a hairline crack
  d.fill(ellipsePts(48, 79, 6, 3, 10), "D", { wobble: 0.6 })                          // one end still in the dirt
  d.stroke(arcPts(48, 79, 6, 3, 0.1 * PI, 0.9 * PI, 6), { color: "d", width: 1.1, taper: [0.2, 0.2] })
}

// ---------- walls ----------
const wallTop = (d) => {
  d.fill(rectPts(-2, -2, T + 4, T + 4), "k", { wobble: 0 })
  for (const [x, y, l, a] of [[30, 34, 18, 0.4], [76, 88, 20, -0.3]]) {                  // two old cracks in the rock mass, barely there
    const p = [[x, y], [x + Math.cos(a) * l * 0.5 + R(d, -2, 2), y + Math.sin(a) * l * 0.5 + R(d, -2, 2)], [x + Math.cos(a) * l, y + Math.sin(a) * l]]
    d.stroke(p, { color: "K", width: 1.4, taper: [0.2, 0.5], wobble: 0.8 })
    d.stroke([p[1], [p[1][0] + R(d, -5, 5), p[1][1] + R(d, 3, 6)]], { color: "K", width: 0.9, taper: [0.1, 0.7] })
  }
}

const LIP = 10, FOOT = 116
const ROWS = [[28, 12, 20, 1.9, 0], [58, 15, 25, 2.2, 1], [92, 18, 30, 2.5, 1]]   // y, rx range, ink weight, cracks
const boulder = (d, x, y, rx, weight, cracks) => {
  const ry = rx * R(d, 0.62, 0.8), dark = d.rng() < 0.28
  rock(d, x, y + R(d, -4, 4), rx, ry, dark
    ? { body: "D", lit: "e", dark: "d", hi: "E", weight, cracks }
    : { body: "e", lit: "E", dark: "D", hi: "c", weight, cracks })
}
const wallFace = (d, key) => {
  d.seed(key)
  d.fill(rectPts(-2, -2, T + 4, T + 4), "d", { wobble: 0 })
  for (let x = 14; x < 116; x += R(d, 18, 28)) {                                       // deep crevices behind the stones
    d.stroke([[x, LIP + 6], [x + R(d, -6, 6), 64], [x + R(d, -6, 6), FOOT - 4]], { color: "k", width: R(d, 3, 6), taper: [0.1, 0.1], wobble: 2 })
  }
  // three courses of boulders, the lower ones nearer and bigger; packed up to the side
  // crevices but never across the tile edge
  ROWS.forEach(([y, rmin, rmax, weight, cracks], row) => {
    d.seed(key + row)
    let x = 6 + R(d, 0, 4)
    for (;;) {
      let rx = R(d, rmin, rmax)
      if (x + 2 * rx > 122) { rx = (122 - x) / 2; if (rx < 5) break }                 // a small stone fills the last gap
      boulder(d, x + rx, y, rx, weight, cracks)
      x += 2 * rx * R(d, 0.8, 0.95)
    }
  })
  // the dark foot where the wall meets the floor, its shadow creeping up the lowest stones
  d.hatch([[2, FOOT - 16], [126, FOOT - 16], [126, FOOT], [2, FOOT]], { angle: -62, spacing: 3.2, color: "k", width: 1.3, short: 0.6, skip: 0.15 })
  const foot = profile(d, FOOT, 3)
  d.fill([...along(foot, -2, T + 2), [T + 2, T + 2], [-2, T + 2]], "k", { wobble: 0 })
  for (let i = 0; i < 4; i++) {                                                        // rubble fallen at the foot
    const x = 18 + i * 28 + R(d, -6, 6)
    pebble(d, x, R(d, 120, 122), R(d, 2.2, 3.6), { fill: d.rng() < 0.5 ? "D" : "e", lit: "E", ink: "k", weight: 1.1 })
  }
  // a dark crevice down both side edges: only the edge column itself must match between tiles,
  // so its inner edge wanders differently on every face and reads as one more gap between stones
  for (const [x0, dir] of [[-2, 1], [T + 2, -1]]) {
    const inner = profile(d, 4.5, 2.6, 7)
    const pts = [[x0, -2], [x0, T + 2]]
    for (let y = T + 2; y >= -2; y -= 3) pts.push([x0 + dir * (2 + inner(y) + R(d, -0.6, 0.6)), y])
    d.fill(pts, "k", { wobble: 0 })
  }
  // the lit lip along the top, where the face turns into the wall top
  const lip = profile(d, LIP, 2.4)
  d.fill([[-2, -2], [T + 2, -2], ...along(lip, T + 2, -2)], "e", { wobble: 0 })
  d.fill([[-2, -2], [T + 2, -2], ...along((x) => lip(x) * 0.45, T + 2, -2)], "E", { wobble: 0 })
  for (let x = 10; x < 118; x += R(d, 14, 26)) d.stroke([[x, lip(x) - 1], [x + R(d, 4, 8), lip(x) - 3]], { color: "D", width: 1.1, taper: [0.2, 0.6] })   // chips in the lip
  d.stroke(along((x) => lip(x) + 0.6, -2, T + 2, 3), { color: "k", width: 3, taper: [0, 0], wobble: 0.2, vary: 0.3 })
}

const wetFace = (d) => {
  wallFace(d, "face_wet")
  d.seed("seep")
  for (const [x0, len, w] of [[58, 104, 3], [86, 52, 2.2]]) {                           // water trickling down from under the lip
    const path = [[x0, LIP + 2]]
    for (let y = LIP + 2 + 12; y < LIP + 2 + len; y += 12) path.push([x0 + R(d, -3, 3) + (y - LIP) * 0.04, y])
    const wet = [...path.map(([x, y]) => [x - w - 4, y]), ...path.slice().reverse().map(([x, y]) => [x + w + 5, y])]
    d.hatch(wet, { angle: -62, spacing: 2.6, color: "D", width: 1.2, inset: 0.5, short: 0.4 })  // darkened wet stone
    d.stroke(path, { color: "K", width: w + 2.4, taper: [0.05, 0.2], wobble: 0.6 })
    d.stroke(path, { color: "b", width: w, taper: [0.05, 0.25], wobble: 0.6 })
    d.stroke(path.slice(0, -1).map(([x, y]) => [x - w * 0.25, y]), { color: "B", width: 0.9, taper: [0.2, 0.3], wobble: 0.4 })
    const [ex, ey] = path[path.length - 1]
    d.dot(ex + 0.5, ey + 5, 1.4, "b"); d.dot(ex + 0.2, ey + 4.6, 0.6, "C")             // a drop about to fall
  }
  const pool = d.shape(ellipsePts(62, 121, 13, 3.4, 18), { wobble: 0.6 })               // seep pool at the foot
  d.fill(pool, "b")
  d.stroke([[56, 120.4], [64, 120]], { color: "B", width: 1, taper: [0.3, 0.3] })
  d.ink(pool, { color: "k", weight: 1.2, lit: -0.4 })
  for (const [x, y] of [[57, 30], [61, 72], [89, 34]]) d.dot(x, y, 0.9, "C")           // glints
}

const rootsFace = (d) => {
  wallFace(d, "face_roots")
  d.seed("hanging")
  for (const [x0, len, w, sway] of [[26, 70, 5, 6], [50, 42, 3.4, -5], [84, 92, 5.6, -8], [104, 54, 3.6, 5]]) {
    const pts = [[x0, LIP - 4], [x0 + sway * 0.6, LIP + len * 0.35], [x0 + sway, LIP + len * 0.7], [x0 + sway * 0.4, LIP + len]]
    d.stroke(pts, { color: "k", width: w + 3, taper: [0, 0.75], wobble: 0.9 })
    d.stroke(pts, { color: "D", width: w, taper: [0, 0.8], wobble: 0.9 })
    d.stroke(pts.slice(0, 3).map(([x, y]) => [x - w * 0.22, y]), { color: "e", width: Math.max(1, w * 0.3), taper: [0.1, 0.6], wobble: 0.5 })
    for (let k = 1; k <= 2; k++) {                                                     // side rootlets
      const [bx, by] = pts[k], dir = k % 2 ? 1 : -1
      const tip = [bx + dir * R(d, 7, 12), by + R(d, 8, 16)]
      d.stroke([[bx, by], [(bx + tip[0]) / 2 + dir * 2, (by + tip[1]) / 2 - 2], tip], { color: "k", width: 2.4, taper: [0, 0.8], wobble: 0.4 })
      d.stroke([[bx, by], [(bx + tip[0]) / 2 + dir * 2, (by + tip[1]) / 2 - 2], tip], { color: "D", width: 1, taper: [0, 0.8], wobble: 0.4 })
    }
  }
}

// ---------- the tile sheet ----------
const quiet = (key) => (d) => dirt(d, { pebbles: key === "c" ? 3 : 4, scuffs: 2, grits: key === "b" ? 6 : 4 })
const FRAMES = [
  ["floor_a", quiet("a")], ["floor_b", quiet("b")], ["floor_c", quiet("c")],
  ["crack", crackTile], ["puddle", puddleTile], ["gravel", gravelTile], ["flagstone", slabTile],
  ["boot_prints", printsTile], ["fallen_plank", plankTile], ["mushrooms", mushroomsTile],
  ["root", rootTile], ["spilled_coal", coalTile], ["old_bone", boneTile],
  ["wall_top", wallTop], ["wall_face", (d) => wallFace(d, "face")], ["wall_face_wet", wetFace], ["wall_face_roots", rootsFace],
]
sheet("f1_tiles", { w: T, h: T }, { f1_tiles: FRAMES.map(([name, fn]) => ({ draw: (d) => { d.seed("f1:" + name); fn(d) } })) })

// ---------- edge decals (drawn over floor cells next to walls) ----------
// Wall on the left: the light comes over it, so a band of shadow and rubble hugs the edge.
// Wall on the right: its side faces the light, so only a thin contact line and lit rubble.
const edgeSide = (d, left) => {
  const W = 32, X = (x) => (left ? x : W - x)
  const wide = left ? 10 : 4.5
  const band = (x) => wide + Math.sin(x * 0.07 + 1) * (left ? 2.4 : 1.2) * Math.sin(PI * x / T)      // pinned at both ends
  d.fill([[X(-2), -2], [X(-2), T + 2], ...along(band, T + 2, -2).map(([y, w]) => [X(w), y])], "d", { wobble: 0 })
  if (left) d.hatch([[8, 6], [17, 6], [16, 122], [8, 122]], { angle: -62, spacing: 3.4, color: "d", width: 1.2, short: 0.7, skip: 0.2 })
  const rocks = left ? [[24, 6, 4.4], [50, 3.6, 2.8], [78, 7, 5], [104, 4, 3]] : [[30, 4.6, 3.4], [60, 3, 2.4], [94, 5.4, 4]]
  for (const [y, x, r] of rocks) {
    pebble(d, X(x + r * 0.6), y, r, { fill: d.rng() < 0.6 ? "e" : "D", lit: "E", ink: "k", weight: 1.3 })
    if (d.rng() < 0.6) pebble(d, X(x + r * 1.6 + 3), y + r + 2, r * 0.45, { lit: null, ink: "d", weight: 0.8 })
  }
}
asset("f1_edge_left", { w: 32, h: T }, (d) => { d.seed("edge_left"); edgeSide(d, true) })
asset("f1_edge_right", { w: 32, h: T }, (d) => { d.seed("edge_right"); edgeSide(d, false) })

// Wall below: the dirt ends in a rocky ledge lip along the bottom edge.
asset("f1_edge_bottom", { w: T, h: 32 }, (d) => {
  d.seed("edge_bottom")
  const top = profile(d, 20, 2.5), drop = profile(d, 28, 1.5)
  d.fill([...along(top, -2, T + 2), [T + 2, 34], [-2, 34]], "d", { wobble: 0 })        // the dirt darkens toward the drop
  d.stroke(along((x) => top(x) + 0.5, -2, T + 2, 4), { color: "e", width: 1, taper: [0, 0], wobble: 0.3, vary: 0.5 })   // the lit crest of the lip
  for (let x = 14; x < 116; x += R(d, 16, 26)) scuff(d, x, top(x) - R(d, 3, 6))          // crumbs worn loose near the edge
  for (let x = 8; x < 118; ) {                                                         // stones set in the lip
    const rx = R(d, 6, 11), cx = x + rx
    if (cx + rx > 120) break
    pebble(d, cx, drop(cx) - R(d, 4, 5.5), rx * 0.62, { fill: d.rng() < 0.65 ? "e" : "D", lit: "E", ink: "k", weight: 1.3 })
    x += rx * 2 * R(d, 0.9, 1.25)
  }
  d.fill([...along(drop, -2, T + 2), [T + 2, 34], [-2, 34]], "k", { wobble: 0 })      // the edge of the drop
})

// ---------- props ----------
// The exit: a ladder leaning on the north wall (feet at y = 132, top past the wall's lip).
asset("f1_ladder", { w: 72, h: 136 }, (d) => {
  d.seed("rungs")
  const railX = (side, y) => (side < 0 ? 12 + (132 - y) * 0.035 : 60 - (132 - y) * 0.035)
  const rungs = [114, 92, 70, 48, 26]
  rungs.forEach((y, i) => {
    const broken = i === 3
    const r = board(d, [railX(-1, y) - 2, y], [railX(1, y + 1) + 2, y + 1], 8, { fill: "e", weight: 1.7, endB: broken ? "broken" : "cut", wobble: 0.4 })
    if (broken) d.stroke([r.P(r.L - 8, 3), r.P(r.L - 3, -3)], { color: "k", width: 1, taper: [0.2, 0.2] })
  })
  d.seed("rails")
  for (const side of [-1, 1]) {
    board(d, [railX(side, 4), 4], [railX(side, 132), 132], 10, { weight: 2.2, knots: side < 0 ? 1 : 0, wobble: 0.6 })
    const [x, y] = [railX(side, 4), 4.5]
    d.blob(ellipsePts(x, y + 1, 4.2, 2, 10), { fill: "E", ink: "k", weight: 1, wobble: 0.2 })       // end grain on top
  }
  d.seed("lashing")
  rungs.forEach((y, i) => {
    for (const side of [-1, 1]) {
      const x = railX(side, y)
      if (i % 2 === 0) nail(d, x, y + 0.5, 1.4)
      else for (const dy of [-2.6, 0, 2.6]) {                                          // rope lashings on every other rung
        d.stroke([[x - 5, y + dy - 1], [x + 5, y + dy + 1]], { color: "k", width: 2.6, taper: [0, 0], wobble: 0.2 })
        d.stroke([[x - 4.4, y + dy - 0.9], [x + 4.4, y + dy + 0.9]], { color: "E", width: 1.3, taper: [0.1, 0.1], wobble: 0.2 })
      }
    }
  })
})

// Old timber frame: two posts and a lintel. The right post snapped: its top still hangs from the
// lintel, the stump stands below; the lintel sags and has cracked through near that end.
asset("f1_support", { w: 256, h: 176 }, (d) => {
  d.seed("left_post")
  board(d, [40, 40], [40, 172], 30, { weight: 2.6, knots: 1 })
  d.hatch([[46, 46], [54, 46], [54, 168], [46, 168]], { angle: -72, spacing: 3.4, color: "D", width: 1.1, skip: 0.2 })
  d.seed("stump")
  board(d, [216, 172], [216, 118], 30, { weight: 2.6, endB: "broken" })
  d.hatch([[222, 128], [230, 128], [230, 168], [222, 168]], { angle: -72, spacing: 3.4, color: "D", width: 1.1, skip: 0.2 })
  d.seed("hanging")
  board(d, [218, 44], [214, 98], 28, { weight: 2.4, endB: "broken" })
  d.seed("chunk")                                                                       // the piece that broke out, at the stump's foot
  board(d, [168, 168], [196, 160], 10, { weight: 1.8, endA: "broken", endB: "broken", wobble: 0.4 })
  d.seed("brace")
  const br = d.shape([[55, 54], [96, 54], [55, 96]], { wobble: 0.6 })
  d.fill(br, "e")
  d.fill([[58, 57], [86, 57], [58, 64]], "E", { wobble: 0.3 })
  d.stroke([[62, 80], [78, 64]], { color: "D", width: 1.2 })
  d.ink(br, { weight: 2 })
  // lintel: two lengths meeting at the crack, the right one sagging
  d.seed("lintel")
  const crackX = 160
  const left = board(d, [12, 38], [crackX + 2, 40], 26, { weight: 2.6, knots: 1, endB: "broken" })
  const right = board(d, [crackX - 4, 40], [246, 47], 26, { weight: 2.6, endA: "broken" })
  d.stroke([[crackX - 4, 28], [crackX + 1, 37], [crackX - 3, 44], [crackX + 2, 52]], { color: "k", width: 2.6, taper: [0.1, 0.3], wobble: 0.4 })
  d.stroke([[120, 34], [134, 37], [146, 34]], { color: "D", width: 1.2, taper: [0.2, 0.4] })                    // a split running along the grain
  void left; void right
  d.seed("nails")
  for (const [x, y] of [[30, 46], [50, 46], [204, 56], [226, 56], [214, 92], [62, 60], [88, 57], [60, 88]]) nail(d, x, y, 1.6)
  d.stroke([[234, 56], [240, 61], [242, 68]], { color: "k", width: 2.4, taper: [0, 0.2], wobble: 0.2 })          // a bent spike, pulled loose
  d.stroke([[234, 56], [240, 61], [242, 68]], { color: "s", width: 1, taper: [0, 0.3], wobble: 0.2 })
})

// An old miner's skeleton, seen from above, head to the left, his dented helmet by the skull.
asset("f1_skeleton", { w: 144, h: 60 }, (d) => {
  const B = []                                                                         // bones: [path, width]
  const bone = (path, w) => B.push([path, w])
  const knobs = []                                                                     // joints: [x, y, r]
  d.seed("limbs")
  bone([[44, 18], [56, 10], [68, 8]], 4.4); bone([[68, 8], [80, 7], [91, 11]], 3.4)                 // upper arm
  bone([[44, 42], [56, 50], [68, 52]], 4.4); bone([[68, 52], [80, 50], [92, 43]], 3.4)              // lower arm, hand on the hip
  bone([[96, 24], [108, 20], [120, 18]], 5.2); bone([[120, 18], [130, 17], [137, 14]], 4.2)          // legs
  bone([[96, 36], [108, 40], [119, 44]], 5.2); bone([[119, 44], [128, 47], [135, 51]], 4.2)
  bone([[44, 30], [96, 30]], 3.6)                                                       // spine
  knobs.push([68, 8, 3.2], [68, 52, 3.2], [120, 18, 3.8], [119, 44, 3.8], [44, 18, 4], [44, 42, 4])
  // ink pass then fill pass, so overlapping bones read as one drawing
  for (const [p, w] of B) d.stroke(p, { color: "k", width: w + 3, taper: [0, 0], wobble: 0.4 })
  for (const [x, y, r] of knobs) d.dot(x + 0.3, y + 0.4, r + 1.5, "k")
  d.seed("limbs_fill")
  for (const [p, w] of B) {
    d.stroke(p, { color: "c", width: w, taper: [0, 0], wobble: 0.4 })
    d.stroke(p.map(([x, y]) => [x + 0.4, y + w * 0.28]), { color: "E", width: w * 0.32, taper: [0.15, 0.15], wobble: 0.2 })
  }
  for (const [x, y, r] of knobs) { d.dot(x, y, r, "c"); d.dot(x - r * 0.3, y - r * 0.3, r * 0.35, "w") }
  d.seed("hands")
  for (const [x, y] of [[94, 12], [97, 9], [96, 15], [94, 41], [97, 38]]) { d.dot(x + 0.3, y + 0.3, 2.1, "k"); d.dot(x, y, 1.3, "c") }
  for (const [x, y] of [[139, 12], [141, 16], [137, 53], [140, 50]]) { d.dot(x + 0.3, y + 0.3, 2.3, "k"); d.dot(x, y, 1.5, "c") }
  // vertebrae along the spine
  for (let x = 74; x < 94; x += 5) d.blob(ellipsePts(x, 30, 2.2, 2.8, 10), { fill: "c", ink: "k", weight: 1, wobble: 0.2 })
  // ribcage: ribs curving around from the spine
  d.seed("ribs")
  const ribs = []
  for (let i = 0; i < 4; i++) {
    const x = 50 + i * 6, l = 16 - i * 1.6
    for (const s of [-1, 1]) ribs.push([[x, 30 + s * 2], [x + 2, 30 + s * l * 0.7], [x + 7, 30 + s * l], [x + 11, 30 + s * l * 0.85]])
  }
  for (const r of ribs) d.stroke(r, { color: "k", width: 5, taper: [0, 0.3], wobble: 0.3 })
  for (const r of ribs) d.stroke(r, { color: "c", width: 2.4, taper: [0, 0.4], wobble: 0.3 })
  d.blob(roundRect(48, 28, 20, 4, 2), { fill: "c", ink: "k", weight: 1.1, wobble: 0.3 })     // breastbone
  // pelvis
  d.seed("pelvis")
  for (const s of [-1, 1]) {                                                           // hip wings flaring toward the ribs
    const wing = d.shape(rot(ellipsePts(95, 30 + s * 9, 5.5, 9, 18), 95, 30 + s * 9, s * 0.55), { wobble: 0.4 })
    d.fill(wing, "c")
    d.stroke(rot(arcPts(95, 30 + s * 9, 3.5, 7, -0.3 * PI, 0.4 * PI, 6), 95, 30 + s * 9, s * 0.55), { color: "E", width: 1.2, taper: [0.3, 0.3] })
    d.ink(wing, { weight: 1.5 })
    d.blob(rot(ellipsePts(103, 30 + s * 6, 2.6, 1.8, 10), 103, 30 + s * 6, s * 0.4), { fill: "c", weight: 1.2, wobble: 0.2 })   // sockets of the hips
  }
  d.blob([[90, 26.5], [101, 28], [104, 30], [101, 32], [90, 33.5]], { fill: "c", weight: 1.3, wobble: 0.3 })   // sacrum
  d.dot(96, 30, 0.9, "E")
  // helmet, knocked off and dented
  d.seed("helmet")
  const brim = d.shape(ellipsePts(15, 16, 13, 10, 28), { wobble: 0.6 })                   // brim, seen from above
  d.fill(brim, "o")
  d.hatch(crescent(15, 16, 12, 9, { shift: 0.3 }), { angle: -60, spacing: 2.8, color: "r", width: 1 })
  d.ink(brim, { weight: 1.8 })
  const dome = d.shape(ellipsePts(14, 15, 8.5, 7, 22).map(([x, y]) => (x > 18 && y < 13 ? [x - 1.6, y + 1.4] : [x, y])), { wobble: 0.5 })
  d.fill(dome, "O")
  d.fill(ellipsePts(11.5, 12.5, 4, 2.8, 12), "f", { wobble: 0.3 })                          // lit crown
  d.dot(10.5, 11.8, 1.1, "y")
  d.stroke([[18, 10.5], [20, 14]], { color: "o", width: 1.3, taper: [0.2, 0.3] })             // the dent
  d.ink(dome, { weight: 1.5 })
  d.blob(ellipsePts(7, 21, 3.6, 2.8, 12), { fill: "s", weight: 1.2, wobble: 0.3 })            // its lamp, dead
  d.dot(6.2, 20.4, 1.2, "S")
  // skull, face up
  d.seed("skull")
  const sk = d.shape([...arcPts(30, 30, 13, 12, 0.6 * PI, 1.4 * PI, 14), ...arcPts(32, 30, 11, 10, 1.4 * PI, 2.6 * PI, 14)], { wobble: 0.5 })
  d.fill(sk, "c")
  d.fill(ellipsePts(25, 25, 4, 2.6, 12), "w", { wobble: 0.3 })
  d.hatch(crescent(31, 31, 11, 10, { shift: 0.4, t0: -0.1 * PI, t1: 0.7 * PI }), { angle: -60, spacing: 2.6, color: "E", width: 1 })
  for (const s of [-1, 1]) d.blob(ellipsePts(35, 30 + s * 5, 3.4, 3, 12), { fill: "k", ink: null, wobble: 0.3 })   // eye sockets
  d.blob([[40, 29], [43, 27.5], [43, 32.5]], { fill: "k", ink: null, wobble: 0.2 })            // nose
  d.ink(sk, { weight: 2 })
  for (const y of [25, 28, 31, 34]) d.stroke([[44, y], [46.5, y + 0.3]], { color: "k", width: 1.4, taper: [0, 0.3] })   // teeth
})

asset("f1_rock_small", { w: 44, h: 32 }, (d) => {
  d.seed("rock")
  rock(d, 21, 17, 17, 11, { body: "e", lit: "E", dark: "D", hi: "c", weight: 2.2, cracks: 1 })
  pebble(d, 38, 27, 2.6, { ink: "k", weight: 1.1 })
})

// Floor decals: low contrast, thin dark ink, they sit on the dirt like the tile details.
asset("f1_decal_pebbles", { w: 64, h: 40 }, (d) => {
  d.seed("pebbles")
  const ps = [[22, 18, 4.4, "e"], [36, 14, 3, "E"], [44, 24, 5, "e"], [16, 28, 2.6, "s"], [30, 28, 3.4, "e"], [52, 15, 2.2, "e"], [26, 10, 1.8, "E"], [48, 32, 2, "e"]]
  ps.sort((p, q) => p[1] - q[1])
  for (const [x, y, r, c] of ps) pebble(d, x, y, r, { fill: c, lit: c === "E" ? "c" : c === "s" ? "S" : "E", weight: 1 })
  for (const [x, y] of [[12, 20], [40, 34], [56, 22]]) d.dot(x, y, 1, "e")
})

asset("f1_decal_moss", { w: 64, h: 40 }, (d) => {
  // soft cushions of moss, back to front, each with a lit top and a hatched shadow side
  const cushion = (cx, cy, r) => {
    d.seed("moss" + cx)
    const ph = d.rng() * 6
    const s = d.shape(Array.from({ length: 30 }, (_, i) => {
      const t = i / 30 * 2 * PI, k = r * (0.9 + 0.14 * Math.abs(Math.sin(t * 4 + ph)))
      return [cx + Math.cos(t) * k, cy + Math.sin(t) * k * 0.7]
    }), { wobble: 0.5, wave: 10 })
    d.fill(s, "h")
    d.fill(ellipsePts(cx - r * 0.2, cy - r * 0.2, r * 0.58, r * 0.34, 14), "g", { wobble: 0.5 })
    d.hatch(crescent(cx, cy, r * 0.85, r * 0.6, { shift: 0.4 }), { angle: -60, spacing: 2.6, color: "j", width: 0.9 })
    for (let i = 0; i < 3; i++) d.dot(cx + R(d, -0.6, 0.3) * r, cy + R(d, -0.5, 0.1) * r * 0.7, R(d, 0.6, 0.9), "G")   // moss heads catching the light
    d.ink(s, { color: "j", weight: 1.1 })
  }
  for (const [cx, cy, r] of [[34, 16, 9], [20, 22, 8], [46, 23, 9.5], [31, 27, 10]]) cushion(cx, cy, r)
  d.seed("moss_fringe")
  for (const [x, y] of [[10, 24], [56, 22], [18, 31], [46, 32], [36, 9], [26, 12]]) tuft(d, x, y, { n: 3, h: 4.5 + d.rng() * 2, color: d.rng() < 0.3 ? "G" : "g", width: 1.2 })
  for (const [x, y, r] of [[42, 26, 4.2], [48, 28, 3]]) mushroom(d, x, y, r)
})
