include("_lib.hd.js")
// The merchant's talent tree, hand-drawn (same look as base.hd.js: dark ink thicker on the
// bottom-right, light from the top-left, flat Endesga fills, shadow sides hatched by hand).
// Units: 4 per logical pixel. tt_background is the whole 480x270 screen (1920x1080 units).
// Node frames are 112x112 (28 logical) medallions centered at (56, 56); the 72x72 icon sits on
// the plain inner disc (radius ~33). Icons are 72x72, centered, readable at 18 logical px.

const PI = Math.PI
const E = (cx, cy, rx, ry, n = 28) => ellipsePts(cx, cy, rx, ry, n)
// Band of a ring between radii r0 < r1, from angle t0 to t1 (0 = right, PI/2 = down).
const seg = (cx, cy, r0, r1, t0, t1, n = 20) => [...arcPts(cx, cy, r1, r1, t0, t1, n), ...arcPts(cx, cy, r0, r0, t1, t0, n)]
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [dx / L, dy / L, L] }
// Local frame: x along u from a, y along v = (-uy, ux).
const frame = (a, u) => ([x, y]) => [a[0] + u[0] * x - u[1] * y, a[1] + u[1] * x + u[0] * y]
const rot = (pts, cx, cy, a) => pts.map(([x, y]) => {
  const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy
  return [cx + dx * c - dy * s, cy + dx * s + dy * c]
})
// A light line that must read on the dark disc: dark under-stroke, colored stroke on top.
const inked = (d, pts, color, width, opts = {}) => {
  d.stroke(pts, { color: "k", width: width + 2.6, taper: [0.15, 0.25], wobble: 0.4, ...opts })
  d.stroke(pts, { color, width, taper: [0.2, 0.3], wobble: 0.4, ...opts })
}
// Four-point sparkle (a glint, not a glow).
const sparkle = (d, x, y, r, color = "w") => {
  d.stroke([[x - r, y], [x + r, y]], { color, width: r * 0.42, taper: [0.5, 0.5], wobble: 0.1 })
  d.stroke([[x, y - r], [x, y + r]], { color, width: r * 0.42, taper: [0.5, 0.5], wobble: 0.1 })
}

// ---------- Tools shared by the icons ----------
// Wooden handle from a (grip) to b, width w: lit strip on the side facing the light, grain,
// optional leather wraps at the grip.
const handle = (d, a, b, w, { fill = "e", lit = "E", dark = "D", weight = 2, wraps = 0 } = {}) => {
  const [ux, uy, L] = unit(a, b), T = frame(a, [ux, uy])
  const side = uy - ux > 0 ? 1 : -1                                   // +y faces the light
  const s = d.shape(fillet([[0, -w / 2], [L, -w / 2], [L, w / 2], [0, w / 2]].map(T), w * 0.45), { wobble: 0.35, wave: 12 })
  d.fill(s, fill)
  d.fill([[2, side * w * 0.1], [L - 2, side * w * 0.1], [L - 2, side * w * 0.42], [2, side * w * 0.42]].map(T), lit, { wobble: 0.25 })
  d.fill([[1.5, -side * w * 0.18], [L - 1.5, -side * w * 0.18], [L - 1.5, -side * w * 0.5], [1.5, -side * w * 0.5]].map(T), dark, { wobble: 0.25 })
  for (let i = 0; i < Math.max(1, Math.round(L / 22)); i++) {        // grain
    const x0 = L * (0.15 + d.rng() * 0.45), x1 = x0 + L * (0.15 + d.rng() * 0.2), y = (d.rng() - 0.5) * w * 0.3
    d.stroke([[x0, y], [x1, y + (d.rng() - 0.5)]].map(T), { color: dark, width: 0.9, taper: [0.3, 0.4] })
  }
  for (let i = 0; i < wraps; i++) {                                   // leather wraps at the grip
    const x = 3 + i * 3.6
    d.stroke([[x, -w / 2 - 0.3], [x + 1.6, w / 2 + 0.3]].map(T), { color: "d", width: 1.7, taper: [0, 0], wobble: 0.2 })
  }
  d.ink(s, { weight })
  return s
}

// Pick head centered on p, u = direction from the grip to the head. The blade is a crescent of
// half length L and thickness w whose tips bend back toward the grip.
const pickHead = (d, p, u, { L, w, bend, metal = "S", lit = "z", dark = "s", hatch = "n", weight = 2.2, sharp = false }) => {
  const v = [-u[1], u[0]]
  const C = (t, off) => [p[0] + v[0] * t * L - u[0] * bend * t * t + u[0] * off, p[1] + v[1] * t * L - u[1] * bend * t * t + u[1] * off]
  const hw = (t) => w * (1 - 0.8 * t * t)
  const ts = (t0, t1, n = 14) => Array.from({ length: n + 1 }, (_, i) => t0 + (t1 - t0) * i / n)
  const sL = -(v[0] + v[1]) > 0 ? 1 : -1                              // +t runs toward the light
  const tip = (t) => C(t * 1.12, -w * 0.25)
  const outline = [tip(-1), ...ts(-1, 1).map((t) => C(t, hw(t))), tip(1), ...ts(1, -1).map((t) => C(t, -hw(t) * 0.7))]
  const s = d.shape(outline, { wobble: 0.35, wave: 10 })
  d.fill(s, metal)
  // the half away from the light is darker, its underside hatched
  d.fill([...ts(-sL * 1.02, sL * 0.05).map((t) => C(t, -hw(t) * 0.72)), ...ts(sL * 0.05, -sL * 1.02).map((t) => C(t, -hw(t) * 0.05))], dark, { wobble: 0.3 })
  d.hatch([...ts(-sL * 0.95, -sL * 0.1).map((t) => C(t, hw(t) * 0.9)), ...ts(-sL * 0.1, -sL * 0.95).map((t) => C(t, -hw(t) * 0.6))], { angle: -60, spacing: 2.6, color: hatch, width: 0.9, inset: 0.6 })
  // a lit bevel along the top edge on the light side
  d.fill([...ts(sL * 0.95, -sL * 0.15).map((t) => C(t, hw(t) * 0.85)), ...ts(-sL * 0.15, sL * 0.95).map((t) => C(t, hw(t) * 0.3))], lit, { wobble: 0.25 })
  if (sharp) {                                                         // honed edges catch the light
    d.stroke(ts(sL * 1.02, sL * 0.55, 6).map((t) => C(t, hw(t) * 0.55 - w * 0.1)), { color: "w", width: 1.6, taper: [0.1, 0.6] })
    d.stroke(ts(-sL * 1.0, -sL * 0.7, 4).map((t) => C(t, hw(t) * 0.4)), { color: "z", width: 1.2, taper: [0.1, 0.6] })
  }
  d.ink(s, { weight })
  return { s, tip }
}

const pickaxe = (d, grip, head, { L, w, bend, handleW, sharp = false, weight = 2.2, wraps = 0 }) => {
  const [ux, uy] = unit(grip, head)
  d.seed("handle")
  handle(d, grip, [head[0] + ux * (w + 2), head[1] + uy * (w + 2)], handleW, { weight: weight * 0.9, wraps })
  d.seed("head")
  return pickHead(d, head, [ux, uy], { L, w, bend, sharp, weight })
}

// ---------- Background ----------
asset("tt_background", { w: 1920, h: 1080 }, (d) => {
  const W = 1920, H = 1080, cx = W / 2, cy = H / 2
  d.fill(rectPts(-20, -20, W + 40, H + 40), "k", { wobble: 0 })

  // ---- the wall: stacked slabs of night-blue rock, the lower ones in front ----
  d.seed("slabs")
  const CW = 330, CH = 150, slabs = []
  for (let row = 0, y = -50; y < H + 140; row++, y += CH) {
    for (let x = -60 - d.rng() * CW * 0.7; x < W + 140; x += CW) {
      const sx = x + (d.rng() - 0.5) * 110, sy = y + (d.rng() - 0.5) * 40
      const rx = CW * 0.6 * (0.8 + d.rng() * 0.4), ry = CH * 0.72 * (0.85 + d.rng() * 0.3)
      const pts = []
      for (let i = 0; i < 8; i++) {
        const a = (i + d.rng() * 0.6) * 2 * PI / 8, k = 0.78 + d.rng() * 0.27
        pts.push([sx + Math.cos(a) * rx * k, sy + Math.sin(a) * ry * k])
      }
      slabs.push({ s: d.shape(fillet(pts, 24), { wobble: 5, wave: 80, step: 6 }), sx, sy, rx, ry })
    }
  }
  for (const sl of slabs) {
    d.fill(sl.s, "K")
    d.hatch(crescent(sl.sx, sl.sy, sl.rx * 0.78, sl.ry * 0.78, { shift: 0.32 }), { angle: -60, spacing: 10, color: "k", width: 2, short: 0.6, skip: 0.3, inset: 6 })
    // lit lip along the top-left edge
    const run = []
    sl.s.pts.forEach(([x, y], i) => { const [nx, ny] = sl.s.n[i]; if (-(nx + ny) * 0.7 > 0.55) run.push([x - nx * 5, y - ny * 5]) })
    if (run.length > 4 && d.rng() < 0.75 && Math.hypot((sl.sx - cx) / cx, (sl.sy - cy) / cy) < 0.95) {
      const a = Math.floor(run.length * d.rng() * 0.3), b = run.length - Math.floor(run.length * d.rng() * 0.3)
      d.stroke(run.slice(a, b).filter((_, i) => i % 2 === 0), { color: "n", width: 2.6 + d.rng() * 1.4, taper: [0.3, 0.4], wobble: 1 })
    }
    if (d.rng() < 0.45) {                                                  // a crack, branching once
      const x0 = sl.sx + (d.rng() - 0.5) * sl.rx * 0.6, y0 = sl.sy - sl.ry * 0.55
      const x1 = x0 + (d.rng() - 0.3) * 40, y1 = y0 + sl.ry * 0.5, x2 = x1 + (d.rng() - 0.5) * 50, y2 = y1 + sl.ry * 0.45
      d.stroke([[x0, y0], [x1, y1], [x2, y2]], { color: "k", width: 2.6, taper: [0.1, 0.6], wobble: 2 })
      d.stroke([[x1, y1], [x1 + 26 + d.rng() * 20, y1 + 10 + d.rng() * 16]], { color: "k", width: 1.8, taper: [0.1, 0.7], wobble: 1.5 })
    }
    d.ink(sl.s, { weight: 3.2, lit: 0.5, vary: 0.4 })
  }

  // ---- old pick marks: little bundles of parallel scrapes ----
  d.seed("scrapes")
  for (let i = 0; i < 26; i++) {
    const x = 120 + d.rng() * (W - 240), y = 90 + d.rng() * (H - 180), a = -0.9 + (d.rng() - 0.5) * 0.6, L = 14 + d.rng() * 10
    for (let k = 0; k < 3; k++) {
      const ox = x + k * 5 + d.rng() * 1.5, oy = y + k * 1.5
      d.stroke([[ox, oy], [ox + Math.cos(a) * L, oy + Math.sin(a) * L]], { color: "n", width: 1.6, taper: [0.2, 0.6], wobble: 0.5 })
    }
  }
  // tiny crystal flecks in the rock
  for (let i = 0; i < 14; i++) {
    const x = 160 + d.rng() * (W - 320), y = 120 + d.rng() * (H - 240)
    d.blob(rot([[x - 3, y + 2], [x, y - 5], [x + 3, y + 2]], x, y, (d.rng() - 0.5) * 1.2), { fill: "b", ink: "k", weight: 1.2, wobble: 0.3 })
    d.dot(x - 0.6, y - 1.2, 0.9, "B")
  }

  // ---- chalk constellations: dots joined by broken lines ----
  d.seed("stars")
  const groups = [
    [[210, 170], [290, 132], [372, 188], [455, 150], [470, 238]],
    [[1490, 120], [1572, 176], [1660, 150], [1712, 232], [1626, 286]],
    [[260, 850], [330, 790], [418, 828], [404, 918]],
    [[1540, 860], [1620, 802], [1716, 836], [1788, 772]],
    [[930, 70], [1010, 110], [1094, 84]],
    [[90, 520], [150, 470], [128, 600]],
    [[1820, 470], [1770, 560], [1840, 620]],
  ]
  for (const g of groups) {
    for (let i = 0; i + 1 < g.length; i++) {
      const [x0, y0] = g[i], [x1, y1] = g[i + 1], n = 4 + Math.floor(Math.hypot(x1 - x0, y1 - y0) / 30)
      for (let k = 0; k < n; k++) {                                          // broken chalk line
        if (d.rng() < 0.2) continue
        const t0 = (k + 0.15) / n, t1 = (k + 0.75) / n
        d.stroke([[x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0], [x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1]], { color: "n", width: 1.8, taper: [0.3, 0.3], wobble: 0.8 })
      }
    }
    g.forEach(([x, y], i) => {
      const big = i === 0 || d.rng() < 0.3
      d.dot(x, y, big ? 3.6 : 2.6, "s")
      if (big) sparkle(d, x, y, 7, "s")
      d.dot(x - 0.6, y - 0.6, big ? 1.6 : 1.1, "S")
    })
  }
  for (let i = 0; i < 90; i++) {                                              // loose chalk specks
    const x = d.rng() * W, y = d.rng() * H
    d.dot(x, y, 0.9 + d.rng() * 1.1, d.rng() < 0.75 ? "n" : "s")
  }

  // ---- vignette: bundles of hatching that thicken toward the edges, black corners ----
  d.seed("vignette")
  for (let i = 0; i < 4200; i++) {
    const x = d.rng() * W, y = d.rng() * H
    const e = Math.hypot((x - cx) / cx, (y - cy) / cy)                      // 0 center, ~1.41 corners
    const p = Math.min(1, Math.max(0, (e - 0.55) / 0.55)) ** 1.5
    if (d.rng() > p) continue
    const a = (e > 0.9 && d.rng() < 0.45 ? 30 : -60) * PI / 180 + (d.rng() - 0.5) * 0.25
    const L = 18 + d.rng() * 22, n = 3 + Math.floor(d.rng() * 4)
    const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux
    for (let k = 0; k < n; k++) {
      const o = (k - n / 2) * 6, l = L * (0.6 + d.rng() * 0.5)
      const x0 = x + vx * o - ux * l / 2, y0 = y + vy * o - uy * l / 2
      d.stroke([[x0, y0], [x0 + ux * l, y0 + uy * l]], { color: "k", width: 2 + d.rng() * 1.2, taper: [0.2, 0.45], wobble: 0.6 })
    }
  }
  // the dark closes in: lumpy shadow along the edges, deeper in the corners
  const edge = []
  for (let x = 0; x <= W; x += 60) edge.push([x, 0, 0, -1], [x, H, 0, 1])
  for (let y = 60; y < H; y += 60) edge.push([0, y, -1, 0], [W, y, 1, 0])
  for (const [x, y, nx, ny] of edge) {
    const corner = Math.min(x, W - x) < 260 && Math.min(y, H - y) < 200, r = (corner ? 70 : 34) + d.rng() * 40
    const ox = x + nx * (r * 0.55 - d.rng() * 10), oy = y + ny * (r * 0.55 - d.rng() * 10)
    d.fill(E(ox, oy, r * (ny ? 1.4 : 1), r * (nx ? 1.4 : 1), 16), "k", { wobble: 6, wave: 50, step: 5 })
  }
})

// ---------- Node frames ----------
// rim / lit / dark / hatch: rim colors; disc / discShade: the inner plate; lip: ring around it.
const NC = 56, R_OUT = 48, R_IN = 33.5
// Crescent on the rim centered on angle tm, reaching `half` radians each way; it is `k` of the
// rim's width at its middle and tapers to nothing at the ends.
const band = (c, tm, half, k, n = 24) => {
  const outer = [], inner = []
  for (let i = 0; i <= n; i++) {
    const t = tm - half + 2 * half * i / n, f = Math.cos((t - tm) / half * PI / 2) ** 0.8
    outer.push([c + (R_OUT + 1.5) * Math.cos(t), c + (R_OUT + 1.5) * Math.sin(t)])
    const r = R_OUT + 1.5 - (R_OUT + 1.5 - R_IN + 1) * k * f
    inner.push([c + r * Math.cos(t), c + r * Math.sin(t)])
  }
  return [...outer, ...inner.reverse()]
}
const medallion = (d, o) => {
  const c = NC
  if (o.halo) {                                                                       // hover: a gold selection ring outside the ink
    d.seed("halo")
    const halo = d.shape(E(c, c, R_OUT + 5, R_OUT + 5, 48), { wobble: 0.5, wave: 18 })
    d.fill(halo, "y")
    d.stroke(arcPts(c, c, R_OUT + 4, R_OUT + 4, 0.05 * PI, 0.45 * PI, 10), { color: "Y", width: 2, taper: [0.4, 0.4] })
    d.ink(halo, { weight: 1.5 })
  }
  d.seed("rim")
  const rim = d.shape(E(c, c, R_OUT, R_OUT, 48), { wobble: 0.7, wave: 18 })
  d.fill(rim, o.rim)
  d.fill(band(c, 1.25 * PI, 0.68 * PI, o.litW ?? 0.75), o.lit, { wobble: 0.5 })                // lit crescent, top-left
  d.fill(band(c, 0.27 * PI, 0.72 * PI, 0.85), o.dark, { wobble: 0.5 })                           // shade crescent, bottom-right
  d.hatch(seg(c, c, R_IN + 1, R_OUT, -0.5 * PI, -0.1 * PI), { angle: -60, spacing: 3, color: o.dark, width: 1.2, short: 0.5 })
  d.hatch(seg(c, c, R_IN + 1, R_OUT, 0.62 * PI, 0.98 * PI), { angle: -60, spacing: 3, color: o.dark, width: 1.2, short: 0.5 })
  d.hatch(seg(c, c, R_IN + 1, R_OUT, 0.05 * PI, 0.5 * PI), { angle: 30, spacing: 3.4, color: o.hatch, width: 1.1, short: 0.5 })
  d.seed("rimdetail")
  if (o.rimDetail) o.rimDetail(d, c)

  // ---- inner plate: a recess, so its shadow falls on the top-left ----
  d.seed("disc")
  if (o.lip) {
    const lip = d.shape(E(c, c, R_IN + 4.5, R_IN + 4.5, 40), { wobble: 0.4 })
    d.fill(lip, o.lip[0])
    d.fill(seg(c, c, R_IN, R_IN + 5, -0.1 * PI, 0.62 * PI), o.lip[1], { wobble: 0.3 })
    d.stroke(arcPts(c, c, R_IN + 2.8, R_IN + 2.8, 1.0 * PI, 1.45 * PI, 10), { color: o.lip[2], width: 1.5, taper: [0.3, 0.3] })
    d.ink(lip, { weight: 1.2 })
  }
  const disc = d.shape(E(c, c, R_IN, R_IN, 40), { wobble: 0.45, wave: 14 })
  d.fill(disc, o.disc)
  d.fill([...arcPts(c, c, R_IN + 1, R_IN + 1, 0.7 * PI, 1.8 * PI, 18), ...arcPts(c + 2.6, c + 2.8, R_IN - 0.6, R_IN - 0.6, 1.8 * PI, 0.7 * PI, 18)], o.discShade, { wobble: 0.3 })
  if (o.discDetail) o.discDetail(d, c)
  d.ink(disc, { weight: 1.7, lit: -0.45 })

  d.seed("ink")
  d.ink(rim, { weight: 2.8 })
  // a loose second pass of the pen on the shadow side
  d.stroke(arcPts(c, c, R_OUT + 2.6, R_OUT + 2.6, 0.08 * PI, 0.4 * PI, 12), { color: "k", width: 1.2, taper: [0.4, 0.4], wobble: 0.4 })
  if (o.front) o.front(d, c)
}
// Point on the medallion at angle t, radius r.
const at = (c, r, t) => [c + r * Math.cos(t), c + r * Math.sin(t)]
// Rivet across the rim at angle t.
const rivet = (d, c, t, r, rim, top, hi) => {
  const [x, y] = at(c, (R_OUT + R_IN) / 2 + 1, t)
  d.dot(x + 0.6, y + 0.8, r + 1.1, "k"); d.dot(x, y, r, rim); d.dot(x - r * 0.25, y - r * 0.25, r * 0.6, top)
  if (hi) d.dot(x - r * 0.4, y - r * 0.45, r * 0.28, hi)
}

asset("tt_node_locked", { w: 112, h: 112 }, (d) => medallion(d, {
  rim: "n", lit: "s", litW: 0.45, dark: "K", hatch: "k", disc: "K", discShade: "k",
  rimDetail: (d, c) => {
    for (const [t, r0, r1] of [[1.28, 34, 47], [0.18, 35, 46], [0.8, 40, 47.5]]) {                // cracks through the stone
      const [x0, y0] = at(c, r1, t * PI), [x1, y1] = at(c, (r0 + r1) / 2, t * PI + 0.08), [x2, y2] = at(c, r0, t * PI - 0.02)
      d.stroke([[x0, y0], [x1, y1], [x2, y2]], { color: "k", width: 1.6, taper: [0.1, 0.6], wobble: 0.5 })
    }
    for (const t of [1.08, 1.5, 0.42, 0.62, 1.88]) {                                                 // chisel seams: stone blocks
      d.stroke([at(c, R_IN + 1, t * PI), at(c, R_OUT - 0.5, t * PI + 0.03)], { color: "K", width: 1.4, taper: [0.1, 0.2] })
    }
    d.fill([at(c, R_OUT + 1, 1.7 * PI), at(c, R_OUT - 4, 1.74 * PI), at(c, R_OUT + 1, 1.8 * PI)], "K", { wobble: 0.3 })   // chipped edge
  },
  discDetail: (d, c) => {
    d.stroke([[c - 6, c - R_IN + 2], [c - 3, c - 22], [c - 7, c - 14]], { color: "k", width: 1.3, taper: [0.1, 0.7], wobble: 0.4 })  // hairline crack
  },
}))

asset("tt_node_open", { w: 112, h: 112 }, (d) => medallion(d, {
  rim: "e", lit: "E", dark: "D", hatch: "d", disc: "K", discShade: "k",
  rimDetail: (d, c) => {
    for (let i = 0; i < 7; i++) {                                                                     // grain around the ring
      const r = R_IN + 3 + d.rng() * 10, t0 = d.rng() * 2 * PI, len = 0.5 + d.rng() * 0.7
      d.stroke(arcPts(c, c, r, r, t0, t0 + len, 8), { color: "D", width: 1, wobble: 0.5, taper: [0.3, 0.4] })
    }
    const [kx, ky] = at(c, 41, 1.12 * PI)                                                             // a knot
    d.blob(E(kx, ky, 2.4, 1.6, 10), { fill: "D", ink: "d", weight: 0.8, wobble: 0.2 })
  },
  front: (d, c) => {
    d.seed("clamps")
    for (const t of [1.25, 1.75, 0.25, 0.75]) {                                                       // worn bronze clamps
      const a = t * PI, T = frame(at(c, R_IN - 1.5, a), [Math.cos(a), Math.sin(a)])
      const s = d.shape(fillet([[0, -4.5], [R_OUT - R_IN + 3, -4.5], [R_OUT - R_IN + 3, 4.5], [0, 4.5]].map(T), 1.6), { wobble: 0.3 })
      d.fill(s, "o")
      d.fill([[1, -3.6], [R_OUT - R_IN + 2, -3.6], [R_OUT - R_IN + 2, -0.8], [1, -0.8]].map(T), "O", { wobble: 0.2 })
      d.stroke([[2, 2.6], [R_OUT - R_IN + 1, 2.4]].map(T), { color: "d", width: 1, taper: [0.2, 0.3] })
      d.ink(s, { weight: 1.5 })
      const [nx, ny] = T([(R_OUT - R_IN) / 2 + 1.5, 0]); nail(d, nx, ny, 1.5, { rim: "d", top: "E" })
    }
  },
}))

const goldRim = (d, c, notch) => {
  for (let i = 0; i < 36; i++) {                                                                      // reeded edge
    const t = (i + 0.5) * 2 * PI / 36, l = i % 2 ? 3 : 4.5
    d.stroke([at(c, R_OUT - 0.5, t), at(c, R_OUT - l, t)], { color: notch, width: 1, taper: [0, 0.4], wobble: 0.1 })
  }
}

asset("tt_node_ready", { w: 112, h: 112 }, (d) => medallion(d, {
  rim: "Y", lit: "y", dark: "f", hatch: "o", disc: "K", discShade: "k", lip: ["f", "o", "Y"],
  rimDetail: (d, c) => goldRim(d, c, "f"),
  front: (d, c) => {
    for (const t of [1.25, 1.75, 0.25, 0.75]) rivet(d, c, t * PI, 2.6, "f", "y")
    d.stroke(arcPts(c, c, R_OUT - 4, R_OUT - 4, 1.06 * PI, 1.36 * PI, 10), { color: "w", width: 1.8, taper: [0.4, 0.5] })
  },
}))

asset("tt_node_hover", { w: 112, h: 112 }, (d) => medallion(d, {
  rim: "y", lit: "w", litW: 0.4, dark: "Y", hatch: "f", disc: "K", discShade: "k", lip: ["Y", "f", "y"],
  halo: true,
  rimDetail: (d, c) => goldRim(d, c, "Y"),
  front: (d, c) => {
    for (const t of [1.25, 1.75, 0.25, 0.75]) rivet(d, c, t * PI, 2.6, "Y", "y", "w")
    d.stroke(arcPts(c, c, R_OUT - 5, R_OUT - 5, 0.98 * PI, 1.48 * PI, 14), { color: "w", width: 3.4, taper: [0.25, 0.4] })   // white highlight
    d.stroke(arcPts(c, c, R_OUT - 5.5, R_OUT - 5.5, 1.56 * PI, 1.64 * PI, 4), { color: "w", width: 2, taper: [0.3, 0.3] })
    sparkle(d, ...at(c, R_OUT - 3, 1.24 * PI), 5.5)
  },
}))

asset("tt_node_max", { w: 112, h: 112 }, (d) => medallion(d, {
  rim: "g", lit: "G", dark: "h", hatch: "j", disc: "n", discShade: "K", lip: ["Y", "f", "y"],
  rimDetail: (d, c) => {
    d.seed("laurel")                                                                                  // two laurel sprigs
    for (const dir of [-1, 1]) {
      const r = (R_OUT + R_IN) / 2 + 2.5
      d.stroke(arcPts(c, c, r, r, PI / 2 + dir * 0.1, PI / 2 + dir * 2.5, 16), { color: "j", width: 1.4, taper: [0, 0.6] })
      for (let i = 0; i < 5; i++) {
        const t = PI / 2 + dir * (0.32 + i * 0.48), [x, y] = at(c, r + (i % 2 ? 1.6 : -1.6), t)
        const a = t + dir * PI / 2 + (i % 2 ? -0.55 : 0.55) * dir, L = 5.6 - i * 0.25
        const leaf = rot(E(x, y, L, 2.5, 14), x, y, a)
        const s = d.shape(leaf, { wobble: 0.2 })
        d.fill(s, "G")
        d.stroke(rot([[x - L * 0.6, y], [x + L * 0.6, y]], x, y, a), { color: "g", width: 0.9, taper: [0.2, 0.5] })
        d.ink(s, { color: "j", weight: 1.1 })
      }
    }
  },
  front: (d, c) => {
    for (const t of [1.5, 0.5]) rivet(d, c, t * PI, 2.8, "f", "y")
    for (const t of [1.0, 0]) rivet(d, c, t * PI, 2.2, "f", "y")
    d.stroke(arcPts(c, c, R_OUT - 4, R_OUT - 4, 1.06 * PI, 1.36 * PI, 10), { color: "y", width: 1.6, taper: [0.4, 0.5] })
  },
}))

// ---------- Icons (72x72) ----------
const ICON = { w: 72, h: 72 }

asset("tt_icon_ore_damage", ICON, (d) => {
  const { tip } = pickaxe(d, [13, 63], [45, 27], { L: 25, w: 7.5, bend: 7, handleW: 7.5, sharp: true, wraps: 3 })
  d.seed("spark")
  const [x, y] = tip(1)
  sparkle(d, 62, 13, 5, "w")
  sparkle(d, 9, 34, 3.4, "z")
})

asset("tt_icon_mine_speed", ICON, (d) => {
  d.seed("motion")                                                         // speed lines behind the fist
  for (const [y, x0, x1] of [[33, 61, 68], [42, 60, 67.5], [51, 59, 66]]) inked(d, [[x0, y], [x1, y - 1]], "z", 2.2, { taper: [0.6, 0.05] })
  inked(d, arcPts(42, 30, 24, 24, 1.2 * PI, 1.5 * PI, 8), "z", 2.4, { taper: [0.6, 0.1] })
  inked(d, arcPts(42, 30, 18, 18, 1.24 * PI, 1.42 * PI, 6), "S", 1.6, { taper: [0.6, 0.1] })

  d.seed("upper")                                                          // upper arm with a bulging biceps
  const upper = d.shape(fillet([[8, 46], [16, 36], [27, 29], [38, 31], [46, 39], [53, 50], [50, 62], [36, 65], [20, 64], [8, 61]], 6), { wobble: 0.5 })
  d.fill(upper, "P")
  d.fill(crescent(30, 50, 22, 14, { shift: 0.4, t0: -0.1 * PI, t1: 0.95 * PI }), "p", { wobble: 0.3 })
  d.hatch(crescent(30, 50, 22, 14, { shift: 0.6, t0: -0.1 * PI, t1: 0.85 * PI }), { angle: -60, spacing: 2.8, color: "D", width: 1 })
  d.stroke(arcPts(30, 42, 12, 9, 1.05 * PI, 1.55 * PI, 8), { color: "w", width: 1.8, taper: [0.3, 0.4] })   // shine on the biceps
  d.stroke([[24, 40], [30, 37], [36, 39]], { color: "p", width: 1.2, taper: [0.3, 0.3] })
  d.ink(upper, { weight: 2.4 })

  d.seed("sleeve")                                                         // rolled shirt sleeve
  const sleeve = d.shape(fillet([[2, 40], [14, 36], [17, 48], [16, 66], [3, 66]], 3), { wobble: 0.4 })
  d.fill(sleeve, "B")
  d.fill([[3, 56], [16, 55], [16, 66], [3, 66]], "b", { wobble: 0.3 })
  d.stroke([[5, 42], [6, 52]], { color: "C", width: 1.4, taper: [0.3, 0.4] })
  d.stroke([[3, 50], [16, 49]], { color: "b", width: 1.4, taper: [0.1, 0.1] })
  d.ink(sleeve, { weight: 2.2 })

  d.seed("forearm")
  const fore = d.shape(fillet([[40, 56], [42, 38], [41, 24], [56, 22], [58, 38], [56, 58]], 5), { wobble: 0.5 })
  d.fill(fore, "P")
  d.fill([[51, 26], [56, 25], [57, 40], [55, 56], [50, 56]], "p", { wobble: 0.3 })
  d.hatch([[48, 30], [56, 28], [56, 54], [48, 54]], { angle: -60, spacing: 2.8, color: "D", width: 1 })
  d.stroke([[44, 30], [45, 44]], { color: "w", width: 1.4, taper: [0.3, 0.5] })
  d.ink(fore, { weight: 2.4 })

  d.seed("fist")
  const fist = d.shape(fillet([[37, 18], [40, 8], [50, 5], [60, 8], [62, 18], [58, 26], [42, 26]], 5), { wobble: 0.4 })
  d.fill(fist, "P")
  d.fill([[55, 9], [61, 11], [61, 19], [57, 25], [52, 25]], "p", { wobble: 0.3 })
  for (const y of [11, 16, 21]) d.stroke([[38.5, y], [46, y - 0.5], [48, y + 0.8]], { color: "D", width: 1.4, taper: [0.1, 0.4] })   // curled fingers
  d.stroke([[44, 7], [50, 9], [52, 14]], { color: "w", width: 1.3, taper: [0.3, 0.5] })
  d.ink(fist, { weight: 2.2 })
})

asset("tt_icon_arc_radius", ICON, (d) => {
  d.seed("reach")                                                           // the reach: a dashed arc with arrowheads
  const cx = 8, cy = 66, R = 58, t0 = -1.38, t1 = -0.2
  const n = 5
  for (let i = 0; i < n; i++) {
    const a0 = t0 + (t1 - t0) * (i + 0.12) / n, a1 = t0 + (t1 - t0) * (i + 0.82) / n
    inked(d, arcPts(cx, cy, R, R, a0, a1, 6), "y", 2.6, { taper: [0.1, 0.1] })
  }
  const head = (t, dir) => {
    const [x, y] = [cx + R * Math.cos(t), cy + R * Math.sin(t)], tx = -Math.sin(t) * dir, ty = Math.cos(t) * dir
    const nx = Math.cos(t), ny = Math.sin(t)
    d.blob([[x + tx * 6, y + ty * 6], [x - tx * 2 + nx * 5, y - ty * 2 + ny * 5], [x - tx * 2 - nx * 5, y - ty * 2 - ny * 5]], { fill: "y", weight: 1.6, wobble: 0.2 })
  }
  head(t0, -1); head(t1, 1)
  pickaxe(d, [9, 65], [43, 31], { L: 16, w: 5.5, bend: 4, handleW: 6, wraps: 2, weight: 2 })
})

asset("tt_icon_spinning_picks", ICON, (d) => {
  const c = 36
  // three picks tumbling clockwise round a ring, each trailing a swoosh
  const R = 19
  d.seed("whirl")
  for (let i = 0; i < 3; i++) {
    const a = -PI / 2 + i * 2 * PI / 3
    inked(d, arcPts(c, c, R + 7, R + 7, a - 1.5, a - 0.35, 10), "z", 2.2, { taper: [0.8, 0.05] })
    inked(d, arcPts(c, c, R - 4, R - 4, a - 1.15, a - 0.45, 6), "S", 1.4, { taper: [0.8, 0.05] })
  }
  for (let i = 0; i < 3; i++) {
    const a = -PI / 2 + i * 2 * PI / 3, ta = a + PI / 2                         // ta: direction of travel
    const m = [c + Math.cos(a) * R, c + Math.sin(a) * R], tx = Math.cos(ta - 0.35), ty = Math.sin(ta - 0.35)
    d.seed("pick" + i)
    pickaxe(d, [m[0] - tx * 13, m[1] - ty * 13], [m[0] + tx * 9, m[1] + ty * 9], { L: 10.5, w: 4.2, bend: 3, handleW: 4.6, weight: 1.8 })
  }
})

asset("tt_icon_ore_yield", ICON, (d) => {
  d.seed("back")                                                            // the open mouth's back edge
  const mouth = d.shape(fillet([[16, 18], [26, 12], [46, 12], [56, 18], [50, 24], [22, 24]], 4), { wobble: 0.6 })
  d.fill(mouth, "e")
  d.ink(mouth, { weight: 2 })
  d.seed("ore")                                                             // ore heaped in the mouth
  const chunk = (pts, fill, lit, flecks) => {
    const s = d.shape(pts, { wobble: 0.4 })
    d.fill(s, fill)
    const [x, y] = pts[0]
    d.fill(pts.slice(0, 3).concat([[(pts[0][0] + pts[2][0]) / 2 + 1, (pts[0][1] + pts[2][1]) / 2 + 2]]), lit, { wobble: 0.3 })
    if (flecks) flecks()
    d.ink(s, { weight: 1.6 })
  }
  chunk([[20, 18], [25, 10], [33, 9], [36, 17], [30, 22], [22, 22]], "s", "S", () => { d.dot(27, 15, 1.6, "O"); d.dot(31, 18, 1.2, "o") })
  const cry = d.shape([[38, 20], [40, 3], [45, 1], [48, 6], [46, 20]], { wobble: 0.3 })            // a sapphire sticking up
  d.fill(cry, "B"); d.fill([[40, 19], [40.5, 4], [43.5, 2], [43, 19]], "C", { wobble: 0.2 }); d.fill([[46, 6], [48, 7], [46.5, 20], [45, 20]], "b", { wobble: 0.2 })
  d.ink(cry, { weight: 1.6 })
  chunk([[44, 20], [48, 13], [55, 14], [56, 21], [50, 24]], "Y", "y", () => d.dot(52, 19, 1.1, "f"))
  chunk([[30, 21], [34, 15], [41, 16], [42, 23], [35, 25]], "s", "S", () => d.dot(37, 20, 1.4, "O"))

  d.seed("sack")
  const sack = d.shape(fillet([[22, 24], [50, 24], [54, 32], [63, 42], [66, 54], [61, 64], [44, 68], [26, 68], [10, 64], [6, 53], [10, 41], [18, 32]], 9), { wobble: 0.7 })
  d.fill(sack, "E")
  d.fill(fillet([[12, 44], [20, 34], [27, 33], [22, 46], [16, 58], [10, 56]], 4), "c", { wobble: 0.4 })   // lit bulge
  d.fill(crescent(36, 50, 29, 18, { shift: 0.35, t0: -0.25 * PI, t1: 0.9 * PI }), "e", { wobble: 0.4 })
  d.hatch(crescent(36, 50, 29, 18, { shift: 0.65, t0: -0.2 * PI, t1: 0.8 * PI }), { angle: -60, spacing: 2.8, color: "D", width: 1.1 })
  for (const pts of [[[26, 36], [24, 48], [26, 60]], [[44, 36], [49, 46], [48, 58]], [[34, 38], [35, 50]]]) d.stroke(pts, { color: "e", width: 1.2, taper: [0.3, 0.5] })  // strain folds
  const patch = d.shape(fillet([[38, 46], [48, 45], [49, 55], [39, 56]], 1.2), { wobble: 0.3 })        // a stitched patch
  d.fill(patch, "e")
  for (let i = 0; i < 4; i++) d.stroke([[38.5 + i * 2.8, 44.5], [39.3 + i * 2.8, 46.5]], { color: "d", width: 1, taper: [0, 0] })
  d.ink(patch, { color: "D", weight: 1, lit: 0 })
  d.ink(sack, { weight: 2.6 })
  d.seed("rope")                                                            // rope round the neck
  const rope = d.shape(fillet([[18, 23], [54, 23], [53, 29], [19, 29]], 2.5), { wobble: 0.4 })
  d.fill(rope, "D")
  for (let x = 21; x < 52; x += 4) d.stroke([[x, 24], [x + 2.5, 28]], { color: "e", width: 1.2, taper: [0.2, 0.2] })
  d.ink(rope, { weight: 1.8 })
  d.stroke([[51, 27], [57, 34], [56, 40]], { color: "k", width: 4.6, taper: [0, 0.4] })               // loose end
  d.stroke([[51, 27], [57, 34], [56, 40]], { color: "D", width: 2.4, taper: [0, 0.5] })
})

asset("tt_icon_ore_chain", ICON, (d) => {
  d.seed("rock")
  rock(d, 36, 55, 30, 12, { body: "n", lit: "s", dark: "K", hi: "S", weight: 2.2, cracks: 0 })
  d.seed("vein")                                                            // a glowing vein branching through the rock
  const veins = [[[36, 50], [30, 56], [20, 58], [11, 55]], [[36, 50], [43, 57], [54, 58], [62, 54]], [[30, 56], [27, 63]], [[43, 57], [47, 64]]]
  for (const v of veins) d.stroke(v, { color: "k", width: 4.4, taper: [0, 0.6], wobble: 0.5 })
  for (const v of veins) d.stroke(v, { color: "B", width: 2.4, taper: [0, 0.6], wobble: 0.5 })
  for (const v of veins.slice(0, 2)) d.stroke(v.slice(0, 3), { color: "C", width: 0.9, taper: [0.2, 0.6], wobble: 0.3 })
  // crystals: a hex prism with a lit left face, a mid face, a dark right face
  const crystal = (bx, by, h, w, a) => {
    const P = (pts) => rot(pts, bx, by, a)
    d.seed("c" + bx)
    const body = P([[bx - w, by], [bx - w, by - h], [bx - w * 0.2, by - h - w * 0.9], [bx + w * 0.5, by - h - w * 0.5], [bx + w, by - h], [bx + w, by]])
    const s = d.shape(body, { wobble: 0.3, wave: 8 })
    d.fill(s, "B")
    d.fill(P([[bx - w, by], [bx - w, by - h], [bx - w * 0.2, by - h - w * 0.9], [bx - w * 0.15, by - h + 1], [bx - w * 0.2, by]]), "C", { wobble: 0.2 })
    d.fill(P([[bx + w * 0.45, by], [bx + w * 0.45, by - h + w * 0.1], [bx + w * 0.5, by - h - w * 0.5], [bx + w, by - h], [bx + w, by]]), "b", { wobble: 0.2 })
    d.stroke(P([[bx - w * 0.6, by - h * 0.85], [bx - w * 0.6, by - h * 0.35]]), { color: "w", width: Math.max(1, w * 0.22), taper: [0.3, 0.4] })
    d.ink(s, { weight: w > 6 ? 2.2 : 1.7 })
  }
  crystal(16, 54, 18, 5, -0.5)
  crystal(58, 54, 15, 4.6, 0.55)
  crystal(36, 50, 36, 8.5, 0.04)
  crystal(47, 54, 9, 3.6, 0.3)
  sparkle(d, 22, 12, 4.4, "w")
})

asset("tt_icon_gas_resist", ICON, (d) => {
  d.seed("gas")                                                             // wavy purple fumes drifting past
  const fume = (x0, y, len, amp, w) => {
    const pts = []
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([x0 + len * t, y + Math.sin(t * 2.2 * PI) * amp]) }
    d.stroke(pts, { color: "k", width: w + 2.6, taper: [0.3, 0.35], wobble: 0.3 })
    d.stroke(pts, { color: "V", width: w, taper: [0.35, 0.4], wobble: 0.3 })
  }
  fume(4, 10, 20, 2.2, 2.8); fume(7, 18.5, 13, 1.8, 2.2)
  fume(50, 56, 18, 2, 2.6); fume(55, 64, 12, 1.6, 2.1)
  d.seed("straps")                                                          // one strap round the head
  for (const pts of [[[14, 38], [8, 36], [4, 34]], [[58, 38], [64, 36], [68, 34]]]) {
    d.stroke(pts, { color: "k", width: 7, taper: [0, 0.25], wobble: 0.3 })
    d.stroke(pts, { color: "D", width: 4.2, taper: [0, 0.35], wobble: 0.3 })
  }
  d.seed("cloth")
  const mask = d.shape(fillet([[12, 30], [24, 22], [36, 17], [48, 22], [60, 30], [58, 46], [48, 58], [36, 62], [24, 58], [14, 46]], 7), { wobble: 0.6 })
  d.fill(mask, "c")
  d.fill(fillet([[46, 24], [59, 31], [57, 46], [47, 57], [38, 61], [44, 46]], 4), "E", { wobble: 0.4 })      // the shaded side
  d.hatch([[44, 26], [58, 32], [56, 46], [46, 57], [40, 58]], { angle: -60, spacing: 2.8, color: "e", width: 1 })
  for (const [y, w] of [[31, 18], [39, 20], [47, 16]]) {                                                    // pleats
    d.stroke([[36 - w, y + 1], [36, y - 1.5], [36 + w, y + 1]], { color: "e", width: 1.6, taper: [0.2, 0.2] })
    d.stroke([[36 - w + 3, y - 1.5], [34, y - 3.5]], { color: "w", width: 1.2, taper: [0.3, 0.4] })
  }
  d.stroke([[24, 23], [36, 18.5], [47, 23]], { color: "e", width: 1.2, taper: [0.2, 0.2] })                // hem stitching
  d.ink(mask, { weight: 2.6 })
  d.seed("filter")                                                          // a round filter at the mouth
  const f = d.shape(E(36, 50, 9.5, 8.5, 20), { wobble: 0.3 })
  d.fill(f, "S")
  d.fill(crescent(36, 50, 9, 8, { shift: 0.4 }), "s", { wobble: 0.2 })
  d.ink(f, { weight: 2 })
  const g = d.shape(E(36, 50, 5.4, 4.8, 16), { wobble: 0.2 })
  d.fill(g, "n")
  for (const [x, y] of [[34, 48.5], [38, 48.5], [36, 51.8], [33, 52], [39, 52]]) d.dot(x, y, 0.95, "k")
  d.ink(g, { weight: 1, lit: -0.4 })
  d.stroke(arcPts(36, 50, 7.4, 6.6, 1.05 * PI, 1.4 * PI, 6), { color: "w", width: 1.2, taper: [0.3, 0.3] })
})

asset("tt_icon_armor", ICON, (d) => {
  d.seed("shirt")                                                           // shirt showing in the neck
  d.blob([[25, 9], [47, 9], [36, 34]], { fill: "B", weight: 1.6, wobble: 0.3 })
  d.seed("vest")
  const vest = d.shape(fillet([[25, 7], [36, 32], [47, 7], [55, 8], [56, 18], [59, 28], [62, 36], [61, 64], [48, 67], [36, 68], [24, 67], [11, 64], [10, 36], [13, 28], [16, 18], [17, 8]], 3.5), { wobble: 0.5 })
  d.fill(vest, "D")
  d.fill(fillet([[18, 10], [24, 10], [32, 30], [33, 64], [24, 64], [13, 62], [13, 38], [17, 26]], 3), "e", { wobble: 0.4 })   // the lit front panel
  d.fill(fillet([[14, 40], [20, 40], [20, 62], [13, 61]], 2), "E", { wobble: 0.3 })
  d.hatch([[40, 34], [58, 36], [59, 62], [40, 64]], { angle: -60, spacing: 3, color: "d", width: 1.2 })
  // stitching along the edges (dashes)
  const dashes = (pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 4)
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.2) / n, t1 = (k + 0.65) / n
        d.stroke([[x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0], [x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1]], { color: "c", width: 1.1, taper: [0, 0] })
      }
    }
  }
  dashes([[14, 61], [24, 63.5], [33, 64.5]]); dashes([[39, 64.5], [48, 63.5], [58, 61]])
  dashes([[20, 10], [19, 20], [16, 30], [13.5, 38]]); dashes([[52, 10], [53, 20], [56, 30], [58.5, 38]])
  d.stroke([[36, 33], [36.5, 67]], { color: "d", width: 2.2, taper: [0, 0] })                        // front seam
  d.ink(vest, { weight: 2.6 })
  d.seed("pads")                                                            // thick shoulder pads
  for (const [x0, x1] of [[16, 26], [46, 56]]) d.blob(fillet([[x0, 5], [x1, 5], [x1 + (x0 < 30 ? 1 : -1), 13], [x0, 13]], 2.5), { fill: x0 < 30 ? "e" : "D", weight: 1.8, wobble: 0.3 })
  d.seed("buckles")                                                         // two straps with brass buckles
  for (const y of [42, 54]) {
    d.blob(roundRect(28, y - 2.6, 17, 5.2, 1.5), { fill: "d", weight: 1.5, wobble: 0.3 })
    d.blob(roundRect(34, y - 4, 6, 8, 1.2), { fill: "Y", weight: 1.5, wobble: 0.2 })
    d.fill(roundRect(35.6, y - 2.2, 2.8, 4.4, 0.8), "d", { wobble: 0.1 })
    d.dot(35, y - 2.8, 0.7, "y")
  }
  d.stroke([[18, 46], [23, 50]], { color: "d", width: 1.2, taper: [0.3, 0.3] })                       // a scuff
})

asset("tt_icon_enemy_damage", ICON, (d) => {
  const tilt = -0.32, P = (pts) => rot(pts, 36, 36, tilt).map(([x, y]) => [x + 1, y - 5])
  d.seed("swoosh")                                                          // the swing it came down from
  for (const [r, w] of [[34, 2.4], [28, 1.6]]) inked(d, P(arcPts(26, 60, r, r, -1.55, -0.95, 8)), "z", w, { taper: [0.7, 0.1] })
  d.seed("impact")                                                          // the blow lands: a jagged burst
  const bx = 29, by = 57, burst = []
  for (let i = 0; i < 16; i++) {
    const a = i * 2 * PI / 16 + 0.1, r = i % 2 ? 6 : 13 + (i % 4 === 0 ? 3 : 0)
    burst.push([bx + Math.cos(a) * r * 1.35, by + Math.sin(a) * r * 0.7])
  }
  d.blob(burst, { fill: "y", weight: 1.8, wobble: 0.3 })
  d.fill(burst.map(([x, y]) => [bx + (x - bx) * 0.5, by + (y - by) * 0.5 + 1]), "w", { wobble: 0.2 })
  for (const [x, y, r] of [[6, 50, 2.2], [52, 52, 1.8], [50, 64, 2.4], [9, 63, 1.6]]) d.blob(E(x, y, r * 1.2, r, 8), { fill: "s", weight: 1.1, wobble: 0.2 })   // rock chips flying
  d.seed("handle")
  handle(d, P([[67, 30]])[0], P([[30, 34]])[0], 7, { weight: 2, wraps: 3 })
  d.seed("head")                                                            // the sledge's iron block
  const head = d.shape(P(fillet([[14, 18], [36, 18], [37, 49], [13, 49]], 3)), { wobble: 0.4 })
  d.fill(head, "s")
  d.fill(P([[15, 20], [21, 20], [21, 47], [15, 47]]), "S", { wobble: 0.3 })
  d.fill(P([[30, 20], [35, 20], [35, 47], [30, 47]]), "n", { wobble: 0.3 })
  d.hatch(P([[24, 24], [34, 24], [34, 44], [24, 44]]), { angle: -60, spacing: 2.8, color: "n", width: 1 })
  for (const y of [23, 44]) d.stroke(P([[14, y], [36.5, y]]), { color: "n", width: 1.6, taper: [0, 0] })    // forged bands
  d.stroke(P([[17, 26], [17, 40]]), { color: "z", width: 1.6, taper: [0.3, 0.4] })
  d.ink(head, { weight: 2.6 })
  d.seed("faces")                                                           // the striking faces, a little wider
  for (const [y0, y1] of [[13, 19], [48, 54]]) {
    const f = d.shape(P(fillet([[11, y0], [39, y0], [39, y1], [11, y1]], 2)), { wobble: 0.3 })
    d.fill(f, "S")
    d.fill(P([[12, y0 + 1], [38, y0 + 1], [38, y0 + 2.4], [12, y0 + 2.4]]), "z", { wobble: 0.2 })
    d.fill(P([[33, y0 + 1], [38.5, y0 + 1], [38.5, y1 - 0.6], [33, y1 - 0.6]]), "s", { wobble: 0.2 })
    d.ink(f, { weight: 2.2 })
  }
})

asset("tt_icon_heal_on_kill", ICON, (d) => {
  const bubble = (x, y, r, wt) => {
    const s = d.shape(E(x, y, r, r, Math.max(16, Math.round(r * 1.6))), { wobble: Math.min(0.6, r * 0.03) })
    d.fill(s, "b")
    d.fill(crescent(x, y, r * 0.96, r * 0.96, { shift: 0.22, t0: -0.15 * PI, t1: 0.85 * PI }), "B", { wobble: 0.3 })
    d.stroke(arcPts(x, y, r * 0.86, r * 0.86, 0.05 * PI, 0.62 * PI, 10), { color: "C", width: Math.max(1, r * 0.08), taper: [0.4, 0.4] })
    return s
  }
  d.seed("small")
  for (const [x, y, r] of [[60, 14, 6.5], [63, 30, 3.6], [52, 4.8, 2.6]]) {
    const s = bubble(x, y, r)
    d.stroke(arcPts(x, y, r * 0.6, r * 0.6, 1.1 * PI, 1.45 * PI, 5), { color: "w", width: Math.max(1, r * 0.22), taper: [0.3, 0.3] })
    d.ink(s, { weight: r > 5 ? 1.6 : 1.2 })
  }
  d.seed("bubble")
  const s = bubble(32, 40, 27)
  d.seed("heart")                                                           // a small heart inside
  const hx = 33, hy = 42
  const heartPts = []
  for (let i = 0; i < 32; i++) {
    const t = i / 32 * 2 * PI
    heartPts.push([hx + 0.72 * 16 * Math.sin(t) ** 3, hy - 0.72 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))])
  }
  const heart = d.shape(heartPts, { wobble: 0.35 })
  d.fill(heart, "R")
  d.fill(crescent(hx + 1, hy + 1, 10, 9, { shift: 0.35, t0: -0.2 * PI, t1: 0.75 * PI }), "r", { wobble: 0.2 })
  d.stroke([[hx - 7, hy - 6], [hx - 9, hy - 2]], { color: "q", width: 2.2, taper: [0.3, 0.4] })
  d.dot(hx - 6, hy - 8.6, 1, "w")
  d.ink(heart, { weight: 1.9 })
  // the bubble's skin: highlights on the top-left, ink last
  d.stroke(arcPts(32, 40, 21, 21, 1.05 * PI, 1.42 * PI, 12), { color: "w", width: 3, taper: [0.3, 0.4] })
  d.dot(19, 25.5, 2, "w")
  d.ink(s, { weight: 2.4 })
})
