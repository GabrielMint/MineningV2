include("palette.px.js")
// Effects (32px scale). Pre-rotated here so Godot never rotates pixel art (no mixels).

// Mining swing: a crescent sweeping across the front of the player.
const ARC = [
  [-75, -10],   // frame 0: upper part
  [-75, 75],    // frame 1: full arc
  [20, 75],     // frame 2: tail
]
// 64x64 canvas centered on the player; each direction drawn directly at its angle.
const DIRS = { e: 0, se: 45, s: 90, sw: 135, w: 180, nw: 225, n: 270, ne: 315 }
for (const [d, deg] of Object.entries(DIRS)) {
  anim("swing_" + d, { w: 64, h: 64, frames: 3, fps: 18, loop: false }, (c) => {
    const [a0, a1] = ARC[c.frame]
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const dx = x + 0.5 - 32, dy = y + 0.5 - 32
      const r = Math.hypot(dx, dy)
      let a = Math.atan2(dy, dx) * 180 / Math.PI - deg
      a = ((a + 540) % 360) - 180
      if (a < a0 || a > a1) continue
      // the band is thicker in the middle of the sweep and tapers at the ends
      const t = 1 - Math.abs((a - (a0 + a1) / 2) / ((a1 - a0) / 2 + 0.001))
      const inner = 27 - 5 * t
      if (r >= 28 && r < 30) c.px(x, y, "w")
      else if (r >= 26 && r < 28) c.px(x, y, "z")
      else if (r >= inner && r < 26 && c.frame !== 2) c.px(x, y, "S")
    }
  })
}
sheet("fx_swing", ["swing_*"], { pad: 1 })

// Dust puff when an ore breaks (4 frames).
anim("fx_dust", { w: 32, h: 32, frames: 4, fps: 14, loop: false }, (c) => {
  const r = 5 + c.frame * 4
  const cols = [["w", "z"], ["z", "S"], ["S", "s"], ["s", "n"]][c.frame]
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [-0.7, 0.7], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7]]) {
    const cx = 16 + dx * r, cy = 17 + dy * r, rr = Math.max(1, 5 - c.frame * 1.2)
    c.circ(cx, cy, rr, cols[1]); c.circ(cx - 0.5, cy - 0.5, Math.max(0.5, rr - 1.5), cols[0])
  }
})
sheet("fx_dust", ["fx_dust"], { pad: 1 })
