// Included by the character/actor files; defines no assets (the leading "_" keeps build_art.ps1
// from exporting it). Exposes rig() as a global.
//
// rig(d) wraps a Drawing in a transform stack (baked skeletal animation): every point, stroke
// width, ink weight, dot and hatch angle goes through the current transform, so a part (torso,
// head, arm, jaw) moves, turns and squashes like a bone while its drawing code keeps the
// coordinates it was designed in. Frames stay pre-drawn (no runtime rotation or scaling in
// Godot), but they move like a Spine rig. R has the Drawing calls (shape, fill, ink, blob,
// stroke, hatch, dot, seed, offset) plus:
//   R.push() / R.pop()            save / restore the transform
//   R.move(dx, dy)                translate
//   R.rot(deg, px, py)            rotate about (px, py); + = clockwise on screen
//   R.scale(sx, sy, px, py)       scale about (px, py) (squash and stretch)
//   R.at(x, y)                    where (x, y) lands now (to attach one part to another)
// Each call composes onto the current transform, so a bone inherits its parent's motion.
globalThis.rig = function rig(d) {
  let M = [1, 0, 0, 1, 0, 0]               // x' = a x + c y + e, y' = b x + d y + f
  const stack = []
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]
  const at = (x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]
  const P = (pts) => pts.map(([x, y]) => at(x, y))
  const k = () => Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]))
  const turn = () => Math.atan2(M[1], M[0]) * 180 / Math.PI
  const W = (o, key, def) => ({ ...o, [key]: (o && o[key] != null ? o[key] : def) * k() })
  const about = (px, py, T) => { M = mul(mul(mul(M, [1, 0, 0, 1, px, py]), T), [1, 0, 0, 1, -px, -py]) }
  const R = {
    at,
    push() { stack.push(M); return R },
    pop() { M = stack.pop(); return R },
    move(dx, dy) { M = mul(M, [1, 0, 0, 1, dx, dy]); return R },
    rot(deg, px = 0, py = 0) {
      const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a)
      about(px, py, [c, s, -s, c, 0, 0]); return R
    },
    scale(sx, sy, px = 0, py = 0) { about(px, py, [sx, 0, 0, sy, 0, 0]); return R },
    seed: (key) => d.seed(key),
    rng: () => d.rng(),
    offset: (s, n) => d.offset(s, n * k()),
    shape: (pts, o) => d.shape(P(pts), o),
    fill: (s, c, o) => d.fill(Array.isArray(s) ? P(s) : s, c, o),
    ink: (s, o) => d.ink(s, W(o, "weight", 2.4)),
    blob: (pts, o) => d.blob(P(pts), W(o, "weight", 2.4)),
    stroke: (pts, o) => d.stroke(P(pts), W(o, "width", 2)),
    hatch: (pts, o = {}) => d.hatch(P(pts), { ...o, angle: (o.angle != null ? o.angle : -60) + turn() }),
    dot: (x, y, r, c) => { const [X, Y] = at(x, y); d.dot(X, Y, r * k(), c) },
  }
  return R
}
