include("_lib.hd.js")
// Mine floor 2, "Caverna de Cristal" (the Crystal Cave), hand-drawn: tiles, edge decals and props.
// Units: 4 per logical pixel, so one 32x32 cell is 128x128. Light from the top-left: lit facets
// and thin ink toward it, hatching and heavy ink on the bottom-right.
// - Floor tiles are flat `n` stone with no rim; every mark stays >= 10 units from the edges and
//   uses low-contrast keys (s/S/K, a little b), so any arrangement tiles seamlessly.
// - Wall faces share floor 1's edge profile: a lit lip pinned at y = 10 along the top, a dark
//   crevice at both sides, a black foot pinned at y = 116 along the bottom.
// - Crystals are prisms: a lit left face (B), a deep blue middle face (b), a hatched shadow
//   face, cyan (C) on the lit edge and the tip, a white glint, then the `k` ink.
// - Sheet frames are not clipped: full-tile fills overshoot by 2 at most, every other mark
//   stays inside the cell.

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

// The longest stretch of a closed shape's outline whose normal faces the bottom-right.
const litRun = (s, k) => {
  const n = s.pts.length, ok = (i) => (s.n[i % n][0] + s.n[i % n][1]) / Math.SQRT2 > k
  let start = 0
  while (start < n && ok(start)) start++
  let best = [], run = []
  for (let j = start; j < start + n; j++) {
    if (ok(j)) run.push(s.pts[j % n])
    else { if (run.length > best.length) best = run; run = [] }
  }
  if (run.length > best.length) best = run
  return best.length > 2 ? best : s.pts.slice(0, 3)
}

// ---------- small marks ----------
// A stone half sunk in the floor: body, lit cap, thin dark ink.
const pebble = (d, x, y, r, { fill = "s", lit = "S", ink = "K", weight = 0.9 } = {}) => {
  const s = d.shape(ellipsePts(x, y, r * R(d, 1.1, 1.45), r, 10), { wobble: r * 0.12 + 0.15, wave: 8 })
  d.fill(s, fill)
  if (r > 2.4 && lit) d.fill(ellipsePts(x - r * 0.3, y - r * 0.35, r * 0.5, r * 0.32, 8), lit, { wobble: 0.15 })
  d.ink(s, { color: ink, weight })
  return s
}
// A hairline crack in the bedrock, running toward the middle of the tile (so it never nears an edge).
const hairline = (d, x, y) => {
  const a = Math.atan2(64 - y, 64 - x) + R(d, -0.9, 0.9), l = R(d, 6, 11)
  const m = [x + Math.cos(a) * l * 0.5 + R(d, -1.4, 1.4), y + Math.sin(a) * l * 0.5 + R(d, -1.4, 1.4)]
  d.stroke([[x, y], m, [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "K", width: R(d, 1.2, 1.6), taper: [0.3, 0.4], wobble: 0.3 })
  if (d.rng() < 0.45) d.stroke([m, [m[0] + R(d, -4, 4), m[1] + R(d, 2, 4)]], { color: "K", width: 0.9, taper: [0.1, 0.7], wobble: 0.2 })
}
const grit = (d, x, y) => { const k = d.rng(); d.dot(x, y, R(d, 0.8, 1.3), k < 0.55 ? "K" : k < 0.88 ? "s" : "b") }

// Plain cave floor: a few stones, hairline cracks and grit, spread evenly so no tile stands out.
const stone = (d, { pebbles = 4, cracks = 2, grits = 5, avoid = [] } = {}) => {
  d.fill(rectPts(-2, -2, T + 4, T + 4), "n", { wobble: 0 })
  const spots = scatter(d, pebbles + cracks + grits, 16, 16, T - 16, T - 16, 16, avoid)
  spots.forEach(([x, y], i) => {
    if (i < pebbles) {
      pebble(d, x, y, R(d, 1.8, 3.4), { fill: d.rng() < 0.75 ? "s" : "K", lit: d.rng() < 0.6 ? "S" : null })
      if (d.rng() < 0.5) pebble(d, x + R(d, 4, 6), y + R(d, 1, 3), R(d, 1.2, 1.8), { lit: null, weight: 0.8 })
    } else if (i < pebbles + cracks) hairline(d, x, y)
    else { grit(d, x, y); if (d.rng() < 0.5) grit(d, x + R(d, 2, 4), y + R(d, -2, 2)) }
  })
}

// ---------- crystals ----------
const TONES = {
  front: { lit: "B", mid: "b", dark: "b", hatch: "K", line: "K", tip: "C", tipMid: "B", edge: "C", glint: "w" },
  back: { lit: "b", mid: "K", dark: "K", hatch: "k", line: "k", tip: "B", tipMid: "b", edge: "B", glint: null },
}
// A crystal prism standing at (x, base), hw half wide, its tip at y = top before the tilt
// (positive tilt leans right). Three faces split at A and B, two facets at the tip.
const crystal = (d, x, base, hw, top, { tilt = 0, tone = "front", weight = 2, tipK = 1.25, glint = true } = {}) => {
  const t = TONES[tone], h = base - top, tip = Math.min(hw * tipK, h * 0.5)
  const P = (u, y) => rot([[x + u, y]], x, base, tilt)[0]
  const L = -hw, Rr = hw, A = -hw * R(d, 0.38, 0.5), B = hw * R(d, 0.28, 0.4), ax = hw * R(d, -0.2, 0.05)
  const yL = top + tip * R(d, 0.8, 0.95), yA = top + tip * 0.42, yB = top + tip * 0.5, yR = top + tip * R(d, 0.95, 1.1)
  const s = d.shape([P(L, base), P(L, yL), P(ax, top), P(Rr, yR), P(Rr, base)], { wobble: Math.min(0.55, hw * 0.04 + 0.2), wave: 18, step: 1.5 })
  d.fill(s, t.mid)
  d.fill([P(L, base), P(L, yL), P(A, yA), P(A, base)], t.lit, { wobble: 0.2 })                 // lit face
  d.fill([P(B, base), P(B, yB), P(Rr, yR), P(Rr, base)], t.dark, { wobble: 0.2 })              // shadow face
  d.fill([P(L, yL), P(ax, top), P(A, yA)], t.tip, { wobble: 0.15 })                            // tip facets
  d.fill([P(A, yA), P(ax, top), P(B, yB)], t.tipMid, { wobble: 0.15 })
  if (hw > 4) d.hatch([P(B + 0.6, base), P(B + 0.6, yB + 2), P(Rr, yR + 2), P(Rr, base)], { angle: -62, spacing: Math.max(2.4, hw * 0.2), color: t.hatch, width: Math.min(1.1, 0.6 + hw * 0.04), skip: 0.25, short: 0.5, inset: 0.8 })
  const lw = Math.min(1.1, 0.5 + hw * 0.05)
  d.stroke([P(A, yA), P(A + R(d, -0.4, 0.4), (yA + base) / 2), P(A, base)], { color: t.line, width: lw, taper: [0.1, 0.1], wobble: 0.3 })   // face edges
  d.stroke([P(B, yB), P(B + R(d, -0.4, 0.4), (yB + base) / 2), P(B, base)], { color: t.line, width: lw, taper: [0.1, 0.1], wobble: 0.3 })
  d.stroke([P(ax, top + 0.6), P(B, yB)], { color: t.line, width: lw * 0.8, taper: [0.3, 0.1], wobble: 0.15 })
  d.stroke([P(L + Math.max(0.9, hw * 0.12), yL + 1), P(L + Math.max(0.9, hw * 0.12), yL + (base - yL) * R(d, 0.45, 0.7))], { color: t.edge, width: Math.max(0.9, hw * 0.12), taper: [0.15, 0.6], wobble: 0.2 })   // the lit edge
  if (hw > 7) for (let i = 0; i < 2; i++) {                                                     // a flaw inside the mid face
    const y0 = top + tip + R(d, 0.2, 0.6) * (base - top - tip)
    d.stroke([P(A + 1.2, y0), P((A + B) / 2, y0 - R(d, 2, 5)), P(B - 1.5, y0 - R(d, 4, 8))], { color: tone === "front" ? "B" : "b", width: 0.8, taper: [0.3, 0.4], wobble: 0.2 })
  }
  if (glint && t.glint) {
    const [gx, gy] = P((L + A) / 2, yL + Math.min(5, h * 0.12))
    d.dot(gx, gy, Math.max(0.7, Math.min(1.5, hw * 0.12)), t.glint)
    if (hw > 6) d.stroke([P(ax - hw * 0.12, top + tip * 0.25), P((ax + A) / 2, top + tip * 0.55)], { color: t.glint, width: 0.9, taper: [0.3, 0.3] })
  }
  d.ink(s, { color: "k", weight })
  return { s, P }
}
// A loose chip of crystal lying flat: a little faceted lump.
const chip = (d, x, y, r, { weight = Math.min(0.9, 0.45 + r * 0.12) } = {}) => {
  const a0 = d.rng() * PI, n = 5
  const pts = Array.from({ length: n }, (_, i) => { const a = a0 + i * 2 * PI / n + R(d, -0.3, 0.3), k = r * R(d, 0.8, 1.15); return [x + Math.cos(a) * k * 1.2, y + Math.sin(a) * k * 0.85] })
  const s = d.shape(pts, { wobble: 0.12, step: 0.8 })
  const small = r < 2.3                                                                          // tiny ones: no dark facet, softer ink, or they turn to black specks
  d.fill(s, "B")
  if (!small) d.fill([[x - r * 0.05, y - r * 0.05], ...litRun(s, 0.15)], "b", { wobble: 0 })   // the facet turned away from the light
  d.dot(x - r * 0.4, y - r * 0.3, Math.max(0.45, Math.min(0.9, r * 0.25)), small ? "C" : "w")
  d.ink(s, { color: small ? "K" : "k", weight: small ? Math.min(weight, 0.6) : weight, lit: 0.3 })
}
// A four-point sparkle of light on a crystal speck.
const sparkle = (d, x, y, r, color = "C") => {
  d.stroke([[x - r, y], [x + r, y]], { color, width: Math.max(0.8, r * 0.3), taper: [0.45, 0.45], wobble: 0.05 })
  d.stroke([[x, y - r], [x, y + r]], { color, width: Math.max(0.8, r * 0.3), taper: [0.45, 0.45], wobble: 0.05 })
  d.dot(x, y, Math.max(0.6, r * 0.22), "w")
}
// Rubble heaped around crystal feet so they grow out of the floor instead of standing on it.
// Drawn after the crystals: a dark heap of grit over their flat bases, a few stones on it.
const collar = (d, x, y, rx, ry) => {
  d.fill([...arcPts(x, y - ry * 0.2, rx, ry * 0.9, PI, 2 * PI, 12), ...arcPts(x + 1, y, rx + 1, ry * 1.3, 0, PI, 12)], "K", { wobble: 0.5, wave: 10 })
  const n = Math.max(2, Math.round(rx / 3.5))
  for (let i = 0; i < n; i++) {
    const px = x - rx * 0.75 + (rx * 1.5) * (i + R(d, 0.1, 0.9)) / n
    pebble(d, px, y + R(d, -0.4, 1), R(d, 1.1, 1.8), { fill: d.rng() < 0.7 ? "s" : "S", lit: null, ink: "K", weight: 0.7 })
  }
}

// ---------- floor detail tiles ----------
// Engraved seam: two layers of bedrock meet in a smooth groove; its far (lower) wall catches the light.
const groove = (d, pts, w) => {
  d.stroke(pts.map(([x, y]) => [x + 0.8, y + w * 0.5]), { color: "s", width: 1.2, taper: [0.2, 0.25], wobble: 0.3 })
  d.stroke(pts, { color: "K", width: w, taper: [0.12, 0.18], wobble: 0.4 })
  d.stroke(pts.map(([x, y]) => [x, y - w * 0.12]), { color: "k", width: w * 0.35, taper: [0.25, 0.3], wobble: 0.3 })
}
const seamTile = (d) => {
  stone(d, { pebbles: 3, cracks: 1, grits: 4, avoid: [[28, 50], [48, 62], [70, 68], [96, 76], [64, 78], [82, 88], [40, 58], [110, 82]] })
  d.seed("seam")
  d.hatch([[30, 58], [64, 70], [100, 80], [96, 88], [62, 78], [28, 64]], { angle: -62, spacing: 3.6, color: "K", width: 1, skip: 0.35, short: 0.6 })   // the lower layer, a shade darker
  groove(d, [[16, 46], [32, 52], [46, 60], [62, 64], [76, 70], [92, 74], [110, 82]], 3.6)
  groove(d, [[46, 60], [56, 70], [66, 76], [80, 86], [90, 96]], 2.2)                             // a thinner layer pinching out
  for (const [x, y] of [[46, 59], [92, 73]]) d.fill([[x - 3, y - 1.5], [x + 1, y - 4], [x + 4, y - 1]], "K", { wobble: 0.2 })   // chipped lips
  d.stroke([[64, 67.5], [69, 69]], { color: "S", width: 0.9, taper: [0.3, 0.3] })
}

const shardTile = (d) => {
  stone(d, { pebbles: 3, cracks: 1, grits: 3, avoid: [[64, 64], [58, 80], [72, 52], [48, 66], [80, 72]] })
  d.seed("shard")
  for (const [a, l] of [[0.2, 16], [2.6, 12], [-2.4, 10]]) {                                      // the floor split where it struck
    const p = [[64, 80], [64 + Math.cos(a) * l * 0.5 + 1, 80 + Math.sin(a) * l * 0.4], [64 + Math.cos(a) * l, 80 + Math.sin(a) * l * 0.6]]
    d.stroke(p, { color: "K", width: 1.8, taper: [0.1, 0.7], wobble: 0.3 })
  }
  crystal(d, 52, 82, 3.4, 66, { tilt: -0.5, weight: 1.1 })
  crystal(d, 64, 82, 6.5, 40, { tilt: 0.32, weight: 1.4 })
  collar(d, 61, 82, 12, 3.4)
  chip(d, 80, 86, 2)
  chip(d, 46, 88, 1.5, { weight: 0.8 })
}

const bedrockTile = (d) => {
  stone(d, { pebbles: 2, cracks: 0, grits: 3, avoid: [[64, 64], [44, 48], [84, 80], [60, 40], [74, 92]] })
  d.seed("bedrock")
  const main = [[28, 36], [42, 46], [50, 46], [60, 60], [72, 66], [80, 80], [96, 90]]
  const branches = [[[50, 46], [54, 34], [62, 28]], [[72, 66], [86, 62], [98, 66]], [[60, 60], [52, 72], [56, 84]], [[80, 80], [72, 92]]]
  d.stroke(main.map(([x, y]) => [x + 1.4, y + 1.8]), { color: "s", width: 1.3, taper: [0.2, 0.3], wobble: 0.6 })   // lit far wall
  for (const b of branches) d.stroke(b.map(([x, y]) => [x + 1.2, y + 1.4]), { color: "s", width: 1, taper: [0.1, 0.5] })
  d.stroke(main, { color: "K", width: 5, taper: [0.15, 0.25], wobble: 0.7 })
  d.stroke(main, { color: "k", width: 2.2, taper: [0.2, 0.3], wobble: 0.5 })
  for (const b of branches) { d.stroke(b, { color: "K", width: 2.8, taper: [0.05, 0.7], wobble: 0.5 }); d.stroke(b, { color: "k", width: 1.1, taper: [0.1, 0.7], wobble: 0.4 }) }
  for (const [x, y, r] of [[46, 56, 2], [70, 56, 1.6], [88, 88, 1.8], [64, 72, 1.4]]) pebble(d, x, y, r, { lit: null })   // chips knocked loose
}

const gravelTile = (d) => {
  stone(d, { pebbles: 1, cracks: 1, grits: 2, avoid: [[64, 64], [44, 60], [84, 66], [64, 50], [64, 80]] })
  d.seed("gravel")
  const stones = []
  for (let i = 0; i < 60 && stones.length < 22; i++) {
    const a = d.rng() * 2 * PI, k = Math.sqrt(d.rng())
    const x = 64 + Math.cos(a) * k * 34, y = 64 + Math.sin(a) * k * 22
    const r = R(d, 1.6, 4.8) * (1.2 - k * 0.5)
    if (stones.every(([qx, qy, qr]) => Math.hypot(x - qx, y - qy) > (r + qr) * 0.9)) stones.push([x, y, r])
  }
  d.hatch(ellipsePts(66, 68, 34, 20, 24), { angle: -60, spacing: 3.6, color: "K", width: 1.1, skip: 0.35, short: 0.7 })   // grit packed between them
  stones.sort((p, q) => p[1] - q[1])
  stones.forEach(([x, y, r], i) => {
    if (i % 7 === 3) chip(d, x, y, r * 0.7, { weight: 0.8 })                                       // crystal chips in the scree
    else pebble(d, x, y, r, { fill: d.rng() < 0.18 ? "K" : d.rng() < 0.3 ? "S" : "s", lit: d.rng() < 0.7 ? "S" : null, ink: "k", weight: 0.9 })
  })
}

const sproutsTile = (d) => {
  stone(d, { pebbles: 2, cracks: 1, grits: 3, avoid: [[62, 64], [44, 72], [80, 70], [62, 50], [92, 76]] })
  d.seed("sprouts")
  d.stroke([[30, 82], [46, 78], [60, 80], [76, 76], [96, 80]], { color: "K", width: 3, taper: [0.2, 0.2], wobble: 0.6 })   // the seam they grow from
  const ss = [[44, 79, 3, 66, -0.42], [54, 80, 5, 52, -0.16], [65, 79, 6.5, 38, 0.06], [75, 77, 4, 58, 0.34], [85, 79, 2.8, 68, 0.6], [60, 81, 2.4, 72, -0.7]]
  for (const [x, b, hw, top, tilt] of ss) crystal(d, x, b, hw, top, { tilt, weight: hw > 4 ? 1.4 : 1.1 })
  collar(d, 52, 81, 10, 3); collar(d, 75, 79, 11, 3.2)
  chip(d, 36, 88, 1.6, { weight: 0.8 }); chip(d, 92, 88, 1.9, { weight: 0.8 })
}

const dustTile = (d) => {
  stone(d, { pebbles: 3, cracks: 1, grits: 2, avoid: [[64, 64], [44, 56], [84, 70], [60, 80], [76, 48]] })
  d.seed("dust")
  for (let i = 0; i < 46; i++) {                                                                   // dust settled in a loose patch
    const a = d.rng() * 2 * PI, k = Math.pow(d.rng(), 0.7)
    const x = 64 + Math.cos(a) * k * 32, y = 66 + Math.sin(a) * k * 22, c = d.rng()
    d.dot(x, y, R(d, 0.6, 1.25) * (1.2 - k * 0.5), c < 0.6 ? "b" : c < 0.9 ? "B" : "C")
  }
  for (const [x, y, r] of [[54, 62, 2.2], [74, 70, 1.8], [66, 54, 1.5]]) chip(d, x, y, r, { weight: 0.8 })
  for (const [x, y, r] of [[48, 70, 3.6], [70, 60, 4.6], [84, 74, 3], [60, 78, 2.6]]) sparkle(d, x, y, r)
}

const poolTile = (d) => {
  stone(d, { pebbles: 2, cracks: 1, grits: 2, avoid: [[64, 64], [40, 64], [88, 64], [64, 50], [64, 78], [42, 46]] })
  d.seed("pool")
  d.fill(ellipsePts(64, 65, 40, 24, 32), "K", { wobble: 3, wave: 40 })                             // wet stone around it
  const s = d.shape(ellipsePts(64, 64, 32, 18, 36), { wobble: 2.2, wave: 34 })
  d.fill(s, "b")
  d.fill([...arcPts(64, 64, 32, 18, 0.95 * PI, 1.75 * PI, 14), ...arcPts(67, 68, 30, 17, 1.75 * PI, 0.95 * PI, 14)], "K", { wobble: 0.6 })   // the bank shades the far side
  for (const [x, n] of [[45, 4], [52, 3]]) for (let i = 0; i < n; i++) {                        // the bank crystals, mirrored in broken dashes
    const y = 54 + i * 3.2, l = 5 - i * 1.1
    d.stroke([[x - l / 2 + R(d, -0.5, 0.5), y], [x + l / 2, y + 0.2]], { color: "B", width: 1.1, taper: [0.3, 0.3], wobble: 0.1 })
  }
  for (const [x, y, l] of [[60, 72, 12], [76, 66, 8], [50, 70, 6]]) d.stroke([[x, y], [x + l, y - 0.6]], { color: "B", width: 1.5, taper: [0.3, 0.4] })
  d.stroke(arcPts(80, 61, 6, 2, 0.1 * PI, 0.9 * PI, 8), { color: "B", width: 1, taper: [0.3, 0.3] })   // a drip ring
  d.stroke(arcPts(80, 61, 6, 2, 1.1 * PI, 1.9 * PI, 8), { color: "B", width: 0.9, taper: [0.3, 0.3] })
  d.dot(86, 70, 1.3, "C"); d.dot(58, 75, 0.9, "C"); d.dot(70, 74, 0.7, "w")
  d.ink(s, { color: "k", weight: 1.8, lit: -0.5 })                                                // a recess: heavier toward the light
  d.stroke(arcPts(64, 64, 34, 20, 0.05 * PI, 0.6 * PI, 12), { color: "s", width: 1.2, taper: [0.3, 0.3] })   // lit near bank
  crystal(d, 46, 50, 3, 36, { tilt: -0.2, weight: 1.1 })                                            // small crystals on the far bank
  crystal(d, 52, 50, 2.2, 40, { tilt: 0.15, weight: 1 })
  collar(d, 48, 50, 7, 2.2)
  for (const [x, y, r] of [[97, 72, 2.4], [92, 52, 1.6], [34, 74, 1.8]]) pebble(d, x, y, r)
}

const fissureTile = (d) => {
  stone(d, { pebbles: 2, cracks: 0, grits: 3, avoid: [[64, 64], [36, 42], [84, 82], [50, 52], [96, 94], [78, 58]] })
  d.seed("fissure")
  const main = [[22, 34], [32, 42], [42, 44], [50, 56], [62, 60], [70, 72], [80, 76], [88, 88], [102, 96]]
  const branch = [[62, 60], [72, 54], [84, 56]]
  d.stroke(main, { color: "b", width: 11, taper: [0.25, 0.3], wobble: 1.2 })                      // its glow on the stone
  d.stroke(branch, { color: "b", width: 7, taper: [0.05, 0.6], wobble: 1 })
  d.stroke(main, { color: "k", width: 4.4, taper: [0.15, 0.22], wobble: 0.6 })
  d.stroke(branch, { color: "k", width: 2.6, taper: [0.05, 0.7], wobble: 0.4 })
  d.stroke(main.slice(1, -1), { color: "B", width: 1.8, taper: [0.2, 0.25], wobble: 0.4 })        // the light inside
  d.stroke(branch.slice(0, 2), { color: "B", width: 1, taper: [0.1, 0.8], wobble: 0.3 })
  for (const seg of [[[46, 49], [51, 57]], [[68, 67], [72, 73]]]) d.stroke(seg, { color: "C", width: 1.1, taper: [0.3, 0.3], wobble: 0.2 })
  for (let i = 0; i < 9; i++) {                                                                   // motes drifting up out of it
    const p = main[1 + Math.floor(d.rng() * (main.length - 2))]
    d.dot(p[0] + R(d, -9, 9), p[1] + R(d, -9, 3), R(d, 0.6, 1.1), d.rng() < 0.7 ? "B" : "C")
  }
  sparkle(d, 58, 50, 3)
}

const geodeTile = (d) => {
  stone(d, { pebbles: 2, cracks: 1, grits: 2, avoid: [[64, 64], [40, 64], [88, 70], [64, 48], [70, 84]] })
  d.seed("geode")
  rock(d, 63, 64, 25, 17, { body: "s", lit: "S", dark: "n", hi: "z", ink: "k", weight: 1.8, cracks: 0 })
  // split open: an irregular hollow, its far wall in shadow, crystals crowding the near (lit) wall
  const cx = 61, cy = 60, hx = 14, hy = 7
  const hollow = Array.from({ length: 11 }, (_, i) => { const a = i / 11 * 2 * PI, k = R(d, 0.8, 1.08); return [cx + Math.cos(a) * hx * k, cy + Math.sin(a) * hy * k] })
  d.fill(fillet(hollow.map(([x, y]) => [cx + (x - cx) * 1.2, cy + (y - cy) * 1.3]), 2), "S", { wobble: 0.6 })   // the pale rind
  const hs = d.shape(fillet(hollow, 1.5), { wobble: 0.4 })
  d.fill(hs, "b")
  // packed with a jumble of little crystal faces: each a lit facet and a dark one
  for (const [x, y] of scatter(d, 12, cx - hx * 0.8, cy - hy * 0.6, cx + hx * 0.8, cy + hy * 0.7, 3.2)) {
    if (((x - cx) / hx) ** 2 + ((y - cy) / hy) ** 2 > 0.62) continue
    const s = R(d, 1.8, 3), a = R(d, -0.5, 0.5)
    const tri = rot([[x - s, y + s * 0.5], [x - s * 0.1, y - s * 0.9], [x + s, y + s * 0.4]], x, y, a)
    d.fill(tri, "B", { wobble: 0.1 })
    d.fill([tri[1], tri[2], [x + s * 0.1, y + s * 0.5]], "b", { wobble: 0.05 })
    d.stroke([tri[0], tri[1]], { color: "C", width: 0.7, taper: [0.2, 0.3], wobble: 0.05 })
  }
  d.fill([...arcPts(cx, cy, hx - 0.3, hy - 0.3, 0.95 * PI, 1.8 * PI, 10), ...arcPts(cx + 1.8, cy + 2, hx - 1.6, hy - 1.8, 1.8 * PI, 0.95 * PI, 10)], "K", { wobble: 0.3 })   // shadow under the far rim
  d.dot(cx + 3, cy + 1, 0.9, "w"); d.dot(cx - 5, cy + 2.6, 0.6, "C")
  d.ink(hs, { color: "k", weight: 1.1, lit: -0.5 })
  // floor stone drifted over its lower-right side: the geode is half buried
  const drift = d.shape([[92, 58], [86, 68], [76, 78], [60, 82], [44, 82], [40, 90], [62, 94], [90, 88], [100, 72]], { wobble: 2, wave: 24 })
  d.fill(drift, "n")
  d.stroke(drift.pts.slice(0, Math.floor(drift.pts.length * 0.38)), { color: "K", width: 1.4, taper: [0.2, 0.2], wobble: 0.4 })
  for (const [x, y, r] of [[84, 78, 1.8], [68, 86, 2.2], [52, 88, 1.4]]) pebble(d, x, y, r, { lit: null })
}

const crustTile = (d) => {
  stone(d, { pebbles: 2, cracks: 1, grits: 2, avoid: [[64, 64], [44, 60], [84, 66], [60, 50], [66, 80]] })
  d.seed("crust")
  const pts = Array.from({ length: 13 }, (_, i) => { const a = i / 13 * 2 * PI, k = R(d, 0.72, 1.05); return [64 + Math.cos(a) * 32 * k, 64 + Math.sin(a) * 21 * k] })
  const s = d.shape(fillet(pts, 5), { wobble: 1.6, wave: 22 })
  d.stroke(litRun(s, 0.3).map(([x, y]) => [x + 0.9, y + 1.2]), { color: "K", width: 1.6, taper: [0.2, 0.2], wobble: 0.4 })   // the crust stands a little proud
  d.fill(s, "s")
  for (const [x, y, rx, ry] of [[52, 56, 12, 6], [70, 62, 9, 5], [60, 74, 7, 3.6]]) d.fill(ellipsePts(x, y, rx, ry, 14), "S", { wobble: 1.1, wave: 12 })   // frost grown thicker
  for (let i = 0; i < s.pts.length; i += 5) {                                                     // needles growing out of its rim
    const [x, y] = s.pts[i], [nx, ny] = s.n[i], l = R(d, 2.2, 4.4)
    d.stroke([[x - nx, y - ny], [x + nx * l + R(d, -1, 1), y + ny * l + R(d, -1, 1)]], { color: "s", width: 1.1, taper: [0.05, 0.85], wobble: 0.1 })
  }
  for (const [x, y] of scatter(d, 9, 42, 50, 86, 78, 7)) {                                         // little frost stars
    const a = d.rng() * PI
    for (let k = 0; k < 3; k++) { const b = a + k * PI / 3, l = R(d, 1.8, 3); d.stroke([[x - Math.cos(b) * l, y - Math.sin(b) * l], [x + Math.cos(b) * l, y + Math.sin(b) * l]], { color: d.rng() < 0.5 ? "z" : "S", width: 0.8, taper: [0.4, 0.4], wobble: 0.05 }) }
  }
  d.stroke([[46, 52], [56, 50], [64, 52]], { color: "z", width: 1, taper: [0.3, 0.3], wobble: 0.3 })   // lit crest
  for (const [x, y, r] of [[30, 82, 3.2], [100, 48, 2.6], [96, 84, 2], [36, 42, 1.8]]) {           // stray flakes
    d.fill(ellipsePts(x, y, r * 1.3, r, 9), "s", { wobble: 0.4 })
    d.dot(x - r * 0.3, y - r * 0.3, r * 0.4, "S")
  }
}

// ---------- walls ----------
const wallTop = (d) => {
  d.fill(rectPts(-2, -2, T + 4, T + 4), "k", { wobble: 0 })
  for (const [x, y, l, a] of [[28, 36, 18, 0.4], [78, 86, 20, -0.3]]) {                           // two old cracks in the rock mass, barely there
    const p = [[x, y], [x + Math.cos(a) * l * 0.5 + R(d, -2, 2), y + Math.sin(a) * l * 0.5 + R(d, -2, 2)], [x + Math.cos(a) * l, y + Math.sin(a) * l]]
    d.stroke(p, { color: "K", width: 1.4, taper: [0.2, 0.5], wobble: 0.8 })
    d.stroke([p[1], [p[1][0] + R(d, -5, 5), p[1][1] + R(d, 3, 6)]], { color: "K", width: 0.9, taper: [0.1, 0.7] })
  }
  for (const [x, y] of [[96, 30], [36, 92], [60, 58]]) { d.dot(x, y, 1.1, "K"); d.dot(x - 0.3, y - 0.3, 0.6, "b") }   // crystal seeds deep in the rock
}

const LIP = 10, FOOT = 116
const BACK_ROWS = [[32, 13, 19, 1.6], [70, 14, 21, 1.8], [100, 15, 24, 2]]                          // y, rx range, ink weight
const wallFace = (d, key, { back = [], front = [], extra = null } = {}) => {
  d.seed(key)
  d.fill(rectPts(-2, -2, T + 4, T + 4), "K", { wobble: 0 })
  for (let x = 14; x < 116; x += R(d, 18, 28)) {                                                  // deep crevices in the dark rock
    d.stroke([[x, LIP + 6], [x + R(d, -6, 6), 64], [x + R(d, -6, 6), FOOT - 4]], { color: "k", width: R(d, 3, 6), taper: [0.1, 0.1], wobble: 2 })
  }
  BACK_ROWS.forEach(([y, rmin, rmax, weight], row) => {                                            // dark rock the crystals grow through
    d.seed(key + row)
    let x = 6 + R(d, 0, 4)
    for (;;) {
      let rx = R(d, rmin, rmax)
      if (x + 2 * rx > 122) { rx = (122 - x) / 2; if (rx < 5) break }
      rock(d, x + rx, y + R(d, -4, 4), rx, rx * R(d, 0.62, 0.8), { body: "n", lit: "s", dark: "K", hi: "S", ink: "k", weight, cracks: 1 })
      x += 2 * rx * R(d, 0.8, 0.95)
    }
  })
  d.seed(key + "crystals")
  for (const [x, top, hw, tilt] of back) crystal(d, x, FOOT + 2, hw, top, { tilt, tone: "back", weight: 1.8 })
  for (const [x, top, hw, tilt, opts] of front) crystal(d, x, FOOT + 2, hw, top, { tilt, weight: hw > 14 ? 2.4 : 2, ...(opts || {}) })
  if (extra) { d.seed(key + "extra"); extra(d) }
  d.seed(key + "foot")
  // the dark foot where the wall meets the floor, its shadow creeping up the crystals
  d.hatch([[2, FOOT - 16], [126, FOOT - 16], [126, FOOT], [2, FOOT]], { angle: -62, spacing: 3.2, color: "k", width: 1.3, short: 0.6, skip: 0.15 })
  const foot = profile(d, FOOT, 3)
  d.fill([...along(foot, -2, T + 2), [T + 2, T + 2], [-2, T + 2]], "k", { wobble: 0 })
  for (let i = 0; i < 4; i++) {                                                                   // rubble and chips fallen at the foot
    const x = 18 + i * 28 + R(d, -6, 6)
    if (i % 2) chip(d, x, R(d, 120, 122), R(d, 2, 2.8), { weight: 1 })
    else pebble(d, x, R(d, 120, 122), R(d, 2.2, 3.4), { fill: d.rng() < 0.5 ? "n" : "s", lit: "S", ink: "k", weight: 1.1 })
  }
  // a dark crevice down both side edges: only the edge column itself must match between tiles
  for (const [x0, dir] of [[-2, 1], [T + 2, -1]]) {
    const inner = profile(d, 4.5, 2.6, 7)
    const pts = [[x0, -2], [x0, T + 2]]
    for (let y = T + 2; y >= -2; y -= 3) pts.push([x0 + dir * (2 + inner(y) + R(d, -0.6, 0.6)), y])
    d.fill(pts, "k", { wobble: 0 })
  }
  // the lit lip along the top, where the face turns into the wall top
  const lip = profile(d, LIP, 2.4)
  d.fill([[-2, -2], [T + 2, -2], ...along(lip, T + 2, -2)], "s", { wobble: 0 })
  d.fill([[-2, -2], [T + 2, -2], ...along((x) => lip(x) * 0.45, T + 2, -2)], "S", { wobble: 0 })
  for (let x = 10; x < 118; x += R(d, 14, 26)) d.stroke([[x, lip(x) - 1], [x + R(d, 4, 8), lip(x) - 3]], { color: "n", width: 1.1, taper: [0.2, 0.6] })   // chips in the lip
  d.stroke(along((x) => lip(x) + 0.6, -2, T + 2, 3), { color: "k", width: 3, taper: [0, 0], wobble: 0.2, vary: 0.3 })
}

const plainFace = (d) => wallFace(d, "face", {
  back: [[20, 40, 7, -0.08], [48, 30, 8, 0.06], [80, 34, 8, -0.05], [104, 46, 7, -0.04]],
  front: [[30, 52, 11, -0.07], [62, 24, 13, 0.03], [95, 46, 11, 0.08]],
})

const bigFace = (d) => wallFace(d, "face_big", {
  back: [[22, 44, 7, -0.1], [104, 38, 8, 0.05]],
  front: [[64, 16, 27, 0.02, { tipK: 0.95 }], [22, 74, 8, -0.12], [105, 68, 9, 0.1], [86, 92, 5, 0.3]],
})

// A crystal split by a crack; the light inside leaks out and drips down the rock to a glowing pool.
const crackedFace = (d) => wallFace(d, "face_cracked", {
  back: [[20, 36, 8, -0.08], [102, 30, 8, 0.05]],
  front: [[48, 26, 16, -0.04], [102, 50, 11, 0.07], [18, 70, 7, -0.1]],
  extra: (d) => {
    const crack = [[42, 34], [48, 44], [44, 52], [54, 60], [58, 70], [66, 74]]
    d.stroke(crack, { color: "B", width: 5, taper: [0.2, 0.1], wobble: 0.5 })                       // light shining through the crystal
    d.stroke(crack, { color: "k", width: 2.4, taper: [0.25, 0.1], wobble: 0.5 })
    d.stroke(crack.slice(1), { color: "C", width: 0.9, taper: [0.2, 0.2], wobble: 0.3 })
    d.stroke([[48, 44], [56, 42], [60, 46]], { color: "k", width: 1.2, taper: [0.1, 0.7], wobble: 0.3 })
    d.stroke([[54, 60], [46, 66]], { color: "k", width: 1, taper: [0.1, 0.7], wobble: 0.3 })
    const path = [[66, 74]]                                                                       // the drip, running down the rock
    for (let y = 84; y < 112; y += 9) path.push([71 + R(d, -1.5, 1.5) + (y - 74) * 0.03, y])
    d.stroke(path, { color: "k", width: 5.4, taper: [0.05, 0.2], wobble: 0.5 })
    d.stroke(path, { color: "B", width: 3, taper: [0.05, 0.25], wobble: 0.5 })
    d.stroke(path.slice(0, -1).map(([x, y]) => [x - 0.6, y]), { color: "C", width: 1, taper: [0.2, 0.3], wobble: 0.3 })
    const [ex, ey] = path[path.length - 1]
    d.dot(ex + 0.4, ey + 4, 1.5, "B"); d.dot(ex + 0.1, ey + 3.6, 0.7, "C")                         // a drop about to fall
    for (const [x, y] of [[38, 30], [60, 54], [76, 82], [64, 96]]) d.dot(x, y, 0.8, "C")           // motes
  },
})
// The glowing pool at the foot goes over the foot shadow, so it is drawn after the wall.
const crackedFaceWithPool = (d) => {
  crackedFace(d)
  d.seed("drip_pool")
  const pool = d.shape(ellipsePts(73, 121, 12, 3.2, 18), { wobble: 0.5 })
  d.fill(pool, "b")
  d.fill(ellipsePts(72, 120.6, 7, 1.6, 12), "B", { wobble: 0.3 })
  d.stroke([[68, 120.3], [74, 120]], { color: "C", width: 0.9, taper: [0.3, 0.3] })
  d.ink(pool, { color: "k", weight: 1.1, lit: -0.4 })
}

// ---------- the tile sheet ----------
const quiet = (key) => (d) => stone(d, { pebbles: key === "c" ? 3 : 4, cracks: 2, grits: key === "b" ? 6 : 4 })
const FRAMES = [
  ["stone_a", quiet("a")], ["stone_b", quiet("b")], ["stone_c", quiet("c")],
  ["seam", seamTile], ["shard", shardTile], ["bedrock", bedrockTile], ["gravel", gravelTile],
  ["sprouts", sproutsTile], ["dust", dustTile], ["pool", poolTile], ["fissure", fissureTile],
  ["geode", geodeTile], ["crust", crustTile],
  ["wall_top", wallTop], ["wall_face", plainFace], ["wall_face_big", bigFace], ["wall_face_cracked", crackedFaceWithPool],
]
sheet("f2_tiles", { w: T, h: T }, { f2_tiles: FRAMES.map(([name, fn]) => ({ draw: (d) => { d.seed("f2:" + name); fn(d) } })) })

// ---------- edge decals (drawn over floor cells next to walls) ----------
// Wall on the left: the light comes over it, so a band of shadow and rubble hugs the edge.
// Wall on the right: its side faces the light, so only a thin contact line and lit rubble.
const edgeSide = (d, left) => {
  const W = 32, X = (x) => (left ? x : W - x)
  const wide = left ? 10 : 4.5
  const band = (x) => wide + Math.sin(x * 0.07 + 1) * (left ? 2.4 : 1.2) * Math.sin(PI * x / T)   // pinned at both ends
  d.fill([[X(-2), -2], [X(-2), T + 2], ...along(band, T + 2, -2).map(([y, w]) => [X(w), y])], "K", { wobble: 0 })
  if (left) d.hatch([[8, 6], [17, 6], [16, 122], [8, 122]], { angle: -62, spacing: 3.4, color: "K", width: 1.2, short: 0.7, skip: 0.2 })
  const rocks = left ? [[24, 6, 4.4], [50, 3.6, 2.8], [78, 7, 5], [104, 4, 3]] : [[30, 4.6, 3.4], [60, 3, 2.4], [94, 5.4, 4]]
  rocks.forEach(([y, x, r], i) => {
    pebble(d, X(x + r * 0.6), y, r, { fill: d.rng() < 0.6 ? "s" : "n", lit: "S", ink: "k", weight: 1.3 })
    if (i === 1) chip(d, X(x + r * 1.6 + 4), y + r + 3, 1.8, { weight: 0.9 })                       // a crystal chip fallen with them
    else if (d.rng() < 0.6) pebble(d, X(x + r * 1.6 + 3), y + r + 2, r * 0.45, { lit: null, ink: "K", weight: 0.8 })
  })
}
asset("f2_edge_left", { w: 32, h: T }, (d) => { d.seed("edge_left"); edgeSide(d, true) })
asset("f2_edge_right", { w: 32, h: T }, (d) => { d.seed("edge_right"); edgeSide(d, false) })

// Wall below: the floor ends in a rocky ledge lip along the bottom edge.
asset("f2_edge_bottom", { w: T, h: 32 }, (d) => {
  d.seed("edge_bottom")
  const top = profile(d, 20, 2.5), drop = profile(d, 28, 1.5)
  d.fill([...along(top, -2, T + 2), [T + 2, 34], [-2, 34]], "K", { wobble: 0 })                   // the stone darkens toward the drop
  d.stroke(along((x) => top(x) + 0.5, -2, T + 2, 4), { color: "s", width: 1, taper: [0, 0], wobble: 0.3, vary: 0.5 })   // the lit crest of the lip
  for (let x = 14; x < 116; x += R(d, 16, 26)) {                                                   // hairline cracks worn near the edge
    const y = top(x) - R(d, 3, 6), l = R(d, 6, 11), a = R(d, -0.4, 0.4)
    d.stroke([[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + R(d, -0.8, 0.8)], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { color: "K", width: R(d, 1.1, 1.5), taper: [0.3, 0.4], wobble: 0.3 })
  }
  for (let x = 8; x < 118;) {                                                                      // stones set in the lip
    const rx = R(d, 6, 11), cx = x + rx
    if (cx + rx > 120) break
    pebble(d, cx, drop(cx) - R(d, 4, 5.5), rx * 0.62, { fill: d.rng() < 0.65 ? "s" : "n", lit: "S", ink: "k", weight: 1.3 })
    x += rx * 2 * R(d, 0.9, 1.25)
  }
  d.fill([...along(drop, -2, T + 2), [T + 2, 34], [-2, 34]], "k", { wobble: 0 })                  // the edge of the drop
})

// ---------- props ----------
// A standing cluster of crystals growing out of a dark rock (origin: bottom center, feet at y = 124).
asset("f2_crystal_cluster", { w: 112, h: 128 }, (d) => {
  d.seed("back")
  crystal(d, 36, 104, 8, 36, { tilt: -0.28, tone: "back", weight: 1.8 })
  crystal(d, 78, 104, 9, 28, { tilt: 0.24, tone: "back", weight: 1.8 })
  d.seed("rock")
  rock(d, 56, 108, 42, 15, { body: "n", lit: "s", dark: "K", hi: "S", ink: "k", weight: 2.4, cracks: 2 })
  d.seed("main")
  crystal(d, 36, 114, 11, 54, { tilt: -0.3, weight: 2.2 })
  crystal(d, 77, 114, 12, 42, { tilt: 0.26, weight: 2.2 })
  crystal(d, 55, 112, 16, 6, { tilt: -0.03, weight: 2.6, tipK: 1.1 })
  d.seed("small")
  crystal(d, 20, 118, 5.5, 90, { tilt: -0.6, weight: 1.5 })
  crystal(d, 93, 118, 6, 88, { tilt: 0.55, weight: 1.5 })
  crystal(d, 64, 120, 5, 94, { tilt: 0.18, weight: 1.5 })
  d.seed("front_rocks")
  rock(d, 34, 117, 15, 7, { body: "s", lit: "S", dark: "n", hi: "z", ink: "k", weight: 2, cracks: 0 })
  rock(d, 80, 118, 17, 7, { body: "n", lit: "s", dark: "K", hi: "S", ink: "k", weight: 2, cracks: 1 })
  chip(d, 54, 122, 2.4, { weight: 1 })
  chip(d, 101, 121, 1.8, { weight: 0.9 })
  pebble(d, 12, 121, 2.4, { fill: "s", ink: "k", weight: 1 })
})

asset("f2_rock_small", { w: 44, h: 32 }, (d) => {
  d.seed("rock")
  rock(d, 21, 17, 17, 11, { body: "s", lit: "S", dark: "n", hi: "z", ink: "k", weight: 2.2, cracks: 1 })
  pebble(d, 38, 27, 2.6, { fill: "s", ink: "k", weight: 1.1 })
  d.seed("rock_chip")
  chip(d, 7, 27, 1.6, { weight: 0.8 })
})

// Floor decals: low contrast, thin ink, they sit on the stone like the tile details.
asset("f2_decal_shards", { w: 64, h: 40 }, (d) => {
  d.seed("shards")
  const cs = [[22, 18, 3.6], [36, 13, 2.4], [44, 24, 4.2], [16, 28, 2], [30, 28, 2.8], [52, 15, 1.8], [26, 9, 1.5], [49, 32, 1.6], [10, 18, 1.3]]
  cs.sort((p, q) => p[1] - q[1])
  for (const [x, y, r] of cs) chip(d, x, y, r, { weight: r > 3 ? 1.1 : 0.9 })
  // one long splinter lying flat
  const sp = d.shape([[30, 20], [41, 17.5], [44, 19], [33, 22.5]], { wobble: 0.15, step: 1 })
  d.fill(sp, "B"); d.fill([[31, 20], [41, 17.8], [42, 18.6], [32, 20.8]], "C", { wobble: 0.1 })
  d.ink(sp, { color: "k", weight: 1 })
  for (const [x, y, c] of [[12, 24, "b"], [40, 34, "b"], [57, 22, "B"], [20, 34, "b"], [58, 30, "b"]]) d.dot(x, y, 0.9, c)
  sparkle(d, 45, 21, 2.6)
})

asset("f2_decal_glow", { w: 64, h: 40 }, (d) => {
  d.seed("glow")
  for (let i = 0; i < 58; i++) {                                                                   // dust, thickest in the middle
    const a = d.rng() * 2 * PI, k = Math.pow(d.rng(), 0.75)
    const x = 32 + Math.cos(a) * k * 27, y = 20 + Math.sin(a) * k * 15, c = d.rng()
    d.dot(x, y, R(d, 0.6, 1.3) * (1.25 - k * 0.5), c < 0.55 ? "b" : c < 0.88 ? "B" : "C")
  }
  for (const [x, y, r] of [[26, 18, 1.7], [40, 22, 1.4]]) chip(d, x, y, r, { weight: 0.8 })
  for (const [x, y, r] of [[20, 22, 3.4], [34, 14, 4.4], [46, 25, 3], [30, 28, 2.4], [52, 15, 2.2]]) sparkle(d, x, y, r)
})
