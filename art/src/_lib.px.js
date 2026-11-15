// Shared drawing helpers for the 32px art (included by the art files; defines no assets).

// Pebble 3x2: lit top-left, body, shadow below-right.
globalThis.pebble = (c, x, y, hi, body, dark) => {
  c.px(x, y, hi); c.px(x + 1, y, body); c.px(x + 2, y, body)
  c.px(x, y + 1, body); c.px(x + 1, y + 1, body); c.px(x + 2, y + 1, dark)
  c.hline(x + 1, y + 2, 2, dark)
}

// Textured ground tile (32x32): base color, pebbles, grains, a few highlights.
globalThis.ground = (seed, base, light, dark, hi, opts = {}) => (c) => {
  const { pebbles = 7, grains = 14, sparks = 6 } = opts
  c.rect(0, 0, 32, 32, base)
  const r = c.rng(seed)
  for (let i = 0; i < grains; i++) {
    const x = Math.floor(r() * 31), y = Math.floor(r() * 32)
    c.px(x, y, dark); if (r() < 0.5) c.px(x + 1, y, dark)
  }
  for (let i = 0; i < sparks; i++) c.px(Math.floor(r() * 32), Math.floor(r() * 32), light)
  for (let i = 0; i < pebbles; i++) pebble(c, Math.floor(r() * 29), Math.floor(r() * 29), hi, light, dark)
}

// ---------- Floor detail helpers (each mark has a cause: gravel, prints, roots, ...) ----------

// Sparse specks, grouped in two loose clumps (grit gathers in dips) rather than spread evenly.
globalThis.specks = (c, seed, n, col) => {
  const r = c.rng(seed)
  const clumps = [[4 + r() * 24, 4 + r() * 24], [4 + r() * 24, 4 + r() * 24]]
  for (let i = 0; i < n; i++) {
    const [cx, cy] = clumps[i % 2]
    const x = Math.round(cx + (r() + r() - 1) * 7), y = Math.round(cy + (r() + r() - 1) * 6)
    if (x < 1 || y < 1 || x > 30 || y > 30) continue
    c.px(x, y, col); if (r() < 0.35) c.px(x + 1, y, col)
  }
}

// Quiet floor: base color, sparse grains, a couple of lit grains, at most one pebble.
// Most cells use one of these, so the detail tiles stand out instead of blending into noise.
globalThis.plainFloor = (seed, base, light, dark, hi, pebbles = 1) => (c) => {
  c.rect(0, 0, 32, 32, base)
  specks(c, seed, 9, dark); specks(c, seed + 50, 3, light)
  const r = c.rng(seed + 99)
  for (let i = 0; i < pebbles; i++) pebble(c, 3 + Math.floor(r() * 25), 3 + Math.floor(r() * 25), hi, light, dark)
}

// Gravel heap around (cx, cy): bigger pebbles near the middle, single grains at the rim.
globalThis.gravel = (c, seed, cx, cy, n, hi, body, dark) => {
  const r = c.rng(seed)
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = (i / n) * 8 + r() * 2
    const x = Math.round(cx + Math.cos(a) * d * 1.3), y = Math.round(cy + Math.sin(a) * d)
    if (i < n / 2) pebble(c, x, y, hi, body, dark)
    else { c.px(x, y, body); c.px(x + 1, y, dark) }
  }
}

// Boot print (sole + heel), pressed into the ground.
globalThis.bootPrint = (c, x, y, col) => {
  c.rect(x, y, 2, 3, col); c.px(x + 2, y + 1, col); c.rect(x, y + 4, 2, 2, col)
}

// Small mushroom: cap lit top-left, dark underside, pale stem, shadow to the right.
globalThis.mushroom = (c, x, y, lit, cap, under, stem, shadow, spot) => {
  c.hline(x, y - 1, 2, cap); c.hline(x - 1, y, 4, cap); c.px(x - 1, y, lit); c.px(x, y - 1, lit)
  if (spot) c.px(x + 1, y, spot)
  c.hline(x - 1, y + 1, 4, under)
  c.vline(x, y + 2, 2, stem); c.px(x + 1, y + 2, shadow); c.hline(x + 1, y + 3, 2, shadow)
}

// Little upright crystal: lit left face, dark right face, white tip glint, dark foot.
globalThis.sprout = (c, x, base, h, foot) => {
  c.vline(x, base - h + 1, h, "C"); c.vline(x + 1, base - h, h + 1, "B"); c.vline(x + 2, base - h + 2, h - 1, "b")
  c.px(x + 1, base - h, "w"); c.hline(x, base + 1, 4, foot)
}

// Boulder with a dark rim, body, lit cap toward the top-left and a specular pixel.
globalThis.boulder = (c, cx, cy, rx, ry, rim, body, lit, hi) => {
  c.ellipse(cx, cy, rx, ry, rim)
  c.ellipse(cx - 0.5, cy - 0.5, rx - 1.2, ry - 1.2, body)
  c.ellipse(cx - 1.5, cy - 2, Math.max(1, rx - 3), Math.max(1, ry - 3), lit)
  c.px(Math.round(cx - rx * 0.55), Math.round(cy - ry * 0.6), hi)
  c.px(Math.round(cx - rx * 0.55) + 1, Math.round(cy - ry * 0.6), hi)
}

// Ore node rock, 42x36 (before outline): three stacked angular slabs, Don't Starve style.
// Light from the top-left: lit top cap and left facets, rim-colored right faces and seams.
// Each slab: front face (body), lit top ledge, rim-colored right face; the slab above casts a
// shadow line on the ledge below it. `veins(c)` draws the ore last, on the visible ledges
// (middle ledge ~y 16-20, bottom ledge ~y 26-30).
globalThis.oreRock = (rim, body, lit, hi, veins) => (c) => {
  const slab = (front, ledge, right, facet) => {
    c.poly(front, body); c.poly(ledge, lit); c.poly(facet, lit); c.poly(right, rim)
  }
  // bottom slab: the widest, sticks out on the left
  slab([0, 36, 0, 27, 4, 23, 38, 21, 42, 26, 41, 36],
       [0, 27, 4, 23, 38, 21, 40, 24, 30, 28, 6, 30, 0, 31],
       [34, 28, 40, 24, 42, 26, 41, 36, 35, 36],
       [0, 31, 4, 30, 3, 36, 0, 36])
  c.line(4, 26, 35, 24, rim)
  // middle slab: sticks out on the right
  slab([4, 25, 3, 17, 7, 13, 35, 11, 39, 15, 39, 22, 35, 23],
       [3, 17, 7, 13, 35, 11, 37, 14, 28, 18, 8, 20, 3, 21],
       [32, 17, 37, 14, 39, 15, 39, 22, 34, 23],
       [3, 21, 6, 20, 5, 25, 4, 25])
  c.line(8, 16, 33, 14, rim)
  // top slab: jagged crown
  slab([8, 15, 9, 7, 15, 3, 19, 0, 24, 2, 30, 1, 34, 7, 33, 13],
       [9, 7, 15, 3, 19, 0, 24, 2, 30, 1, 32, 4, 20, 6, 12, 9, 9, 11],
       [29, 7, 32, 4, 34, 7, 33, 13, 30, 14],
       [9, 11, 11, 10, 10, 15, 8, 15])
  veins(c)
  c.hline(1, 35, 40, rim)                                       // contact shadow
  for (const [x, y] of [[15, 3], [16, 3], [19, 1], [5, 23], [6, 23], [8, 13], [1, 28]]) c.px(x, y, hi)
}

// Wooden post: lit left edge, dark right edge, grain marks.
globalThis.post = (c, x, top, w, h) => {
  c.rect(x, top, w, h, "e"); c.vline(x, top, h, "E"); c.vline(x + 1, top, h, "E")
  c.vline(x + w - 1, top, h, "D"); c.vline(x + w - 2, top, h, "D")
  for (let y = top + 3; y < top + h - 2; y += 6) { c.px(x + 2, y, "D"); c.px(x + 3, y + 1, "D") }
}
// Wooden beam: lit top, dark bottom, grain and nails at given xs.
globalThis.beam = (c, x, y, w, h, nails = []) => {
  c.rect(x, y, w, h, "e"); c.hline(x, y, w, "c"); c.hline(x, y + 1, w, "E")
  c.hline(x, y + h - 1, w, "D"); c.hline(x, y + h - 2, w, "D")
  for (let i = x + 4; i < x + w - 3; i += 9) { c.px(i, y + 3, "D"); c.px(i + 1, y + 3, "D") }
  for (const nx of nails) { c.px(nx, y + 2, "z"); c.px(nx, y + 3, "s") }
}
