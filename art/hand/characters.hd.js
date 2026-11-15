include("_lib.hd.js")
include("_rig.hd.js")   // rig(): parts as bones (see the file)
// Hand-drawn characters for the base (see base.hd.js for the look). Miner frames are 192x176 (the
// 128-unit design at (32, 40), feet on y = 164: room for the pickaxe and the lean). Chibi proportions:
// the head (helmet + face) is about half the height. Directions: down, up, left and the 3/4
// views downleft / upleft (the right-facing ones = these flipped in Godot). Every part reseeds its randomness, so it wobbles the same in every frame.

const PI = Math.PI
const E = (cx, cy, rx, ry, n = 28) => ellipsePts(cx, cy, rx, ry, n)
const INK = 2.6

// ---------- Pickaxe ----------
// The orbiting pick's shape (floor1_actors fx_pick) with the grip at the origin and the shaft
// pointing up; drawn at grip (x, y) with the shaft toward deg (0 = right, 90 = down).
const PICK_S = 1
function pickaxe(R, { x, y, deg }) {
  const t = (deg + 90) * PI / 180, c = Math.cos(t), sn = Math.sin(t)
  const T = (pts) => pts.map(([px, py]) => {
    const lx = (px - 30) * PICK_S, ly = (py - 45) * PICK_S
    return [x + lx * c - ly * sn, y + lx * sn + ly * c]
  })
  R.seed("pick:handle")
  const hp = T([[30, 10], [30.6, 28], [31, 47]])
  R.stroke(hp, { color: "k", width: 7.5, taper: [0, 0], wobble: 0.4 })
  R.stroke(hp, { color: "e", width: 4.6, taper: [0, 0], wobble: 0.3 })
  R.stroke(T([[28.8, 18], [29.2, 30], [29.6, 42]]), { color: "E", width: 1.3, taper: [0.2, 0.3] })
  R.seed("pick:head")
  const head = R.shape(T([...arcPts(30, 24, 27, 19, 1.06 * PI, 1.94 * PI, 20), [56.5, 19], ...arcPts(30, 25, 24, 12, 1.92 * PI, 1.08 * PI, 18), [3.5, 19]]), { wobble: 0.5 })
  R.fill(head, "S")
  R.fill(T([...arcPts(30, 24, 25, 17, 1.12 * PI, 1.55 * PI, 10), ...arcPts(30, 23, 22, 12, 1.5 * PI, 1.12 * PI, 8)]), "z", { wobble: 0.3 })
  R.stroke(T(arcPts(28, 22, 22, 15, 1.2 * PI, 1.42 * PI, 6)), { color: "w", width: 1.5, taper: [0.3, 0.3] })
  R.ink(head, { weight: 2 })
  R.seed("pick:collar")
  R.blob(T(roundRect(25.5, 8, 10, 9, 2)), { fill: "n", weight: 1.5, wobble: 0.2 })
}

// ---------- Miner ----------
// Frames are 192x176; the 128-unit design sits at (OX, OY), feet on y = 164 (Godot offset y -76).
// Views: down, downleft, left, upleft, up (right-facing = flipped in Godot).
// Bones and their pose numbers (all optional):
//   body   bob (up, px), squash (+ wider/shorter, - taller), lean (deg, + = top to the right),
//          shift (x, px); pivots at the hips
//   head   headDx, headDy, headTilt (deg, about the neck): lag behind the body
//   hat    hatDy, hatTilt: lag behind the head
//   arms   [a0, a1] (deg from hanging; + = hand toward screen left / forward in the side view).
//          Front views: a0 = screen-left arm, a1 = screen-right. Side view: a0 = near, a1 = far.
//   feet   [[dx, dy, lift], [dx, dy, lift]], same order as the arms (legs follow the hips)
//   pick   { arm, deg, front }: a pickaxe in that hand, deg relative to the arm, in front of
//          the body or behind it.
//   blink
const OX = 32, OY = 40
const SHOULDERS = {
  down: [[36, 70], [92, 70]], downleft: [[38, 70], [92, 70]], up: [[35, 70], [93, 70]],
  upleft: [[36, 70], [90, 70]], left: [[65, 70], [74, 70]],
}

function miner(d, view, pose = {}) {
  const p = {
    bob: 0, squash: 0, lean: 0, shift: 0, headDx: 0, headDy: 0, headTilt: 0, hatDy: 0, hatTilt: 0,
    arms: [0, 0], feet: [[0, 0, 0], [0, 0, 0]], pick: null, blink: false, ...pose,
  }
  const R = rig(d).move(OX, OY)
  const part = (name) => R.seed(view + ":" + name)
  const side = view === "left"
  const front = view === "down" || view === "downleft"
  const quarter = view === "downleft" || view === "upleft"
  const SH = SHOULDERS[view]

  // ---- bones ----
  const body = () => R.move(p.shift, -p.bob).rot(p.lean, 64, 112).scale(1 + p.squash, 1 - p.squash, 64, 104)
  const head = () => { body(); R.move(p.headDx, p.headDy).rot(p.headTilt, 64, 70) }
  const hat = () => { head(); R.move(0, p.hatDy).rot(p.hatTilt, 64, 44) }
  const armBone = (i) => { body(); R.rot(p.arms[i], SH[i][0], SH[i][1]) }
  const inBone = (bone, draw) => { R.push(); bone(); draw(); R.pop() }

  // ---- limbs ----
  const arm = (i, fill = "B") => inBone(() => armBone(i), () => {
    const [x, y] = SH[i]
    part("arm" + i)
    R.blob(E(x, y + 7, 8, 11), { fill, weight: 2.2, wobble: 0.4 })
    part("hand" + i)
    R.blob(E(x, y + 20, 6.5, 6.5, 16), { fill: "P", weight: 2, wobble: 0.3 })
  })
  const pick = (withHand) => p.pick && inBone(() => armBone(p.pick.arm), () => {
    const [x, y] = SH[p.pick.arm]
    pickaxe(R, { x, y: y + 20, deg: p.pick.deg })
    if (withHand) { part("griphand"); R.blob(E(x, y + 20, 6.5, 6.5, 16), { fill: "P", weight: 2, wobble: 0.3 }) }
  })
  // A leg runs from the hip (on the moving body) to the boot (on the ground), so the body's
  // bounce and squash stretch it instead of sliding it.
  const leg = (i, hipX, footX, footY, { fill = "e", hw = 11, bootDx = 0, brx = 12, bry = 7 } = {}) => {
    const [dx, dy, lift] = p.feet[i]
    R.push(); body(); const [hx, hy] = R.at(hipX, 95); R.pop()
    const H = [hx - OX, hy - OY], fx = footX + dx, fy = footY + dy - lift
    const A = [fx, fy - 4]
    const len = Math.hypot(A[0] - H[0], A[1] - H[1]) || 1
    const nx = -(A[1] - H[1]) / len, ny = (A[0] - H[0]) / len
    part("leg" + i)
    R.blob(fillet([[H[0] + nx * hw, H[1] + ny * hw], [A[0] + nx * (hw - 1), A[1] + ny * (hw - 1)],
      [A[0] - nx * (hw - 1), A[1] - ny * (hw - 1)], [H[0] - nx * hw, H[1] - ny * hw]], 5), { fill, weight: 2 })
    part("boot" + i)
    const boot = R.shape(E(fx + bootDx, fy, brx, bry), { wobble: 0.5 })
    R.fill(boot, "d"); R.fill(E(fx + bootDx - 3, fy - 2, brx * 0.5, 2.6), "D", { wobble: 0.3 }); R.ink(boot, { weight: 2.2 })
  }

  if (p.pick && !p.pick.front) pick(false)

  if (side) {
    // ---- legs: the far one first; then the far arm, behind the body ----
    leg(1, 70, 70, 118, { fill: "D", hw: 9, bootDx: -3, brx: 13, bry: 6.5 })
    leg(0, 56, 56, 118, { hw: 9, bootDx: -3, brx: 13, bry: 6.5 })
    arm(1, "b")
    inBone(body, () => {
      part("body")
      const torso = R.shape(roundRect(42, 64, 46, 38, 14), { wobble: 0.6 })
      R.fill(torso, "B")
      R.hatch(crescent(65, 83, 22, 18, { shift: 0.3 }), { angle: -65, spacing: 3.4, color: "b", width: 1.3 })
      R.stroke([[60, 66], [59, 82], [58, 96]], { color: "k", width: 6.5, taper: [0, 0] })
      R.stroke([[60, 66], [59, 82], [58, 96]], { color: "e", width: 4, taper: [0, 0] })
      R.ink(torso, { weight: INK })
      part("belt")
      R.blob(roundRect(42, 94, 46, 7, 3), { fill: "D", weight: 1.8, wobble: 0.3 })
      R.blob(roundRect(42, 93, 9, 9, 2), { fill: "Y", ink: "d", weight: 1.2, wobble: 0.2 })
    })
    arm(0)
    // ---- head: face on the left, hair at the back, ear in between ----
    inBone(head, () => {
      part("head")
      const hd = R.shape(E(62, 48, 32, 25), { wobble: 0.6 })
      R.fill(hd, "P")
      R.fill([...arcPts(62, 48, 32, 25, -0.45 * PI, 0.62 * PI, 16), [70, 70], [72, 50], [74, 30]], "D", { wobble: 0.6 })
      R.hatch(crescent(62, 48, 30, 23, { shift: 0.25, t0: 0, t1: 0.75 * PI }), { angle: -60, spacing: 3.2, color: "d", width: 1.1 })
      R.ink(hd, { weight: INK })
      part("ear")
      R.blob(E(74, 52, 5, 6, 14), { fill: "P", weight: 1.8, wobble: 0.3 })
      part("nose")
      R.blob(E(29, 56, 5, 4.5, 14), { fill: "P", weight: 2, wobble: 0.3 })
      part("face")
      if (p.blink) R.stroke([[38, 51], [46, 51]], { color: "k", width: 2.4, taper: [0.2, 0.2] })
      else { R.blob(E(42, 50, 3.4, 5, 14), { fill: "k", ink: null, wobble: 0.2 }); R.dot(41, 48, 1.3, "w") }
      R.dot(50, 59, 4, "q")
      R.stroke([[36, 64], [41, 65]], { color: "d", width: 2, taper: [0.3, 0.3] })
    })
    // ---- helmet: dome, slanted brim, lamp at the front ----
    inBone(hat, () => {
      part("helmet")
      const dome = R.shape([...arcPts(62, 37, 39, 32, PI, 2 * PI, 24), [101, 40], [23, 40]], { wobble: 0.6 })
      R.fill(dome, "Y")
      R.hatch([...arcPts(62, 37, 36, 29, -0.42 * PI, 0, 10), [82, 39]], { angle: -60, spacing: 3.4, color: "f", width: 1.4 })
      R.stroke(arcPts(58, 34, 28, 22, 1.12 * PI, 1.42 * PI, 10), { color: "y", width: 3, taper: [0.3, 0.3] })
      R.ink(dome, { weight: INK })
      R.blob([[14, 40], [104, 35], [104, 42], [14, 47]], { fill: "o", weight: 2.2, wobble: 0.4 })
      R.stroke([[18, 41], [100, 37]], { color: "f", width: 1.6, taper: [0.1, 0.3] })
      part("lamp")
      R.blob(roundRect(22, 15, 16, 17, 4), { fill: "S", weight: 2.2, wobble: 0.3 })
      R.blob(E(23, 23.5, 3, 6, 14), { fill: "y", ink: "d", weight: 1, wobble: 0.2 })
      R.dot(22.5, 21, 1.2, "w")
    })
    if (p.pick && p.pick.front) pick(true)
    return
  }

  // ---- front, back and 3/4 views ----
  // downleft: the near ear on the right, the nose on the left contour; upleft: a sliver of
  // cheek, the ear on the left, the lamp peeking out at the helmet's edge.
  const fx = view === "downleft" ? -10 : 0                         // the face's shift
  const hx = view === "upleft" ? 7 : 0                             // the hair parting's shift
  const lx = quarter ? (front ? -2 : 2) : 0
  leg(0, 50 + lx, 50 + lx, 117, { bootDx: view === "downleft" ? -3 : 0 })
  leg(1, 78 + lx, 78 + lx, 117, { bootDx: view === "downleft" ? -3 : 0 })
  // the far arm is half hidden behind the turned body
  if (view === "downleft") arm(0, "b")
  if (view === "upleft") arm(1, "b")
  inBone(body, () => {
    part("body")
    const torso = R.shape(roundRect(36, 64, 56, 38, 14), { wobble: 0.6 })
    R.fill(torso, "B")
    R.hatch(crescent(64, 83, 27, 18, { shift: 0.3 }), { angle: -65, spacing: 3.4, color: "b", width: 1.3 })
    const sx = view === "downleft" ? -5 : view === "upleft" ? 4 : 0
    const straps = front ? [[[48 + sx, 66], [50 + sx, 96]], [[80 + sx, 66], [78 + sx, 96]]] : [[[46 + sx, 66], [76 + sx, 96]], [[82 + sx, 66], [52 + sx, 96]]]
    for (const pts of straps) {
      R.stroke(pts, { color: "k", width: 6.5, taper: [0, 0] }); R.stroke(pts, { color: "e", width: 4, taper: [0, 0] })
    }
    R.ink(torso, { weight: INK })
    part("belt")
    R.blob(roundRect(38, 94, 52, 7, 3), { fill: "D", weight: 1.8, wobble: 0.3 })
    if (front) R.blob(roundRect(59.5 + sx, 93, 9, 9, 2), { fill: "Y", ink: "d", weight: 1.2, wobble: 0.2 })
  })
  if (view !== "downleft") arm(0)
  if (view !== "upleft") arm(1)
  // ---- head ----
  inBone(head, () => {
    if (view === "up") for (const [name, x] of [["l", 31], ["r", 97]]) { part("ear" + name); R.blob(E(x, 52, 5, 6.5, 14), { fill: "P", weight: 1.8, wobble: 0.3 }) }
    if (view === "downleft") { part("earr"); R.blob(E(95, 52, 5, 6.5, 14), { fill: "P", weight: 1.8, wobble: 0.3 }) }
    part("head")
    const hd = R.shape(E(64, 48, 33, 25), { wobble: 0.6 })
    R.fill(hd, front ? "P" : "D")
    if (view === "upleft") R.fill([...arcPts(64, 48, 33, 25, 0.6 * PI, 1.12 * PI, 12), [44, 60], [52, 70]], "P", { wobble: 0.4 })
    R.hatch(crescent(64, 48, 31, 23, { shift: 0.25 }), { angle: -60, spacing: 3.2, color: front ? "p" : "d", width: 1.2 })
    if (!front) for (const x of [50, 62, 74]) R.stroke([[x + hx, 40], [x + 2 + hx, 56], [x - 1 + hx, 66]], { color: "d", width: 1.4, taper: [0.2, 0.5] })
    R.ink(hd, { weight: INK })
    if (view === "upleft") { part("earl"); R.blob(E(36, 54, 5, 6.5, 14), { fill: "P", weight: 1.8, wobble: 0.3 }) }
    if (front) {
      part("face")
      for (const x of [52 + fx, 76 + fx]) {
        if (p.blink) R.stroke([[x - 4, 51], [x + 4, 51]], { color: "k", width: 2.4, taper: [0.2, 0.2] })
        else { R.blob(E(x, 50, 3.6, 5, 14), { fill: "k", ink: null, wobble: 0.2 }); R.dot(x - 1.2, 47.8, 1.3, "w") }
      }
      R.dot(quarter ? 37 : 43, 59, 4.2, "q"); R.dot(85 + fx, 59, 4.2, "q")
      R.stroke([[59 + fx, 62], [64 + fx, 64.5], [69 + fx, 62]], { color: "d", width: 2.2, taper: [0.25, 0.25] })
      if (quarter) { part("nose"); R.blob(E(34, 56, 4.5, 4, 14), { fill: "P", weight: 2, wobble: 0.3 }) }
    }
  })
  // ---- helmet ----
  inBone(hat, () => {
    if (view === "upleft") { part("lamp"); R.blob(roundRect(18, 16, 14, 16, 4), { fill: "S", weight: 2.2, wobble: 0.3 }) }
    part("helmet")
    const dome = R.shape([...arcPts(64, 37, 40, 32, PI, 2 * PI, 24), [104, 40], [24, 40]], { wobble: 0.6 })
    R.fill(dome, "Y")
    R.hatch([...arcPts(64, 37, 37, 29, -0.42 * PI, 0, 10), [84, 39]], { angle: -60, spacing: 3.4, color: "f", width: 1.4 })
    R.stroke(arcPts(60, 34, 29, 22, 1.12 * PI, 1.42 * PI, 10), { color: "y", width: 3, taper: [0.3, 0.3] })
    R.ink(dome, { weight: INK })
    part("brim")
    R.blob([...arcPts(64, 32, 45, 8, 0, PI, 16), ...arcPts(64, 37, 47, 9, PI, 0, 16)], { fill: "o", weight: 2.2, wobble: 0.4 })
    R.stroke(arcPts(64, 33, 42, 8, 0.15 * PI, 0.85 * PI, 12), { color: "f", width: 1.6, taper: [0.2, 0.2] })
    if (front) {
      const lampX = 64 + fx * 1.3
      part("lamp")
      R.blob(E(lampX, 22, quarter ? 8.5 : 10, 9, 20), { fill: "S", weight: 2.2, wobble: 0.3 })
      R.blob(E(lampX, 22, quarter ? 5.5 : 6.5, 6, 18), { fill: "y", ink: "d", weight: 1, wobble: 0.2 })
      R.dot(lampX - 2, 20, 1.6, "w")
    } else {
      part("strap")
      R.stroke(arcPts(64 + hx * 0.6, 30, 38, 10, 0.1 * PI, 0.9 * PI, 12), { color: "o", width: 3, taper: [0.1, 0.1] })
    }
  })
  if (p.pick && p.pick.front) pick(true)
}

// ---------- Miner animation ----------
// Every cycle is sampled from one continuous phase t, so all the in-betweens exist; each bone
// follows the one it hangs from a little late (overlap), which is what makes it read as rigged.
const SIDE = (v) => v === "left"
// Where the pickaxe rides between swings: in the hand at the side, blade up and out (side
// view: in the far hand, blade up behind the back). [arm, angle at rest]
const CARRY = { down: [1, -62], downleft: [1, -64], up: [1, -62], upleft: [1, -60], left: [1, -58] }
// The direction a foot steps forward in each view (x, y)
const FORWARD = { down: [0, 4], up: [0, -4], left: [-9, 0], downleft: [-4, 3], upleft: [-4, -3] }

function walkPose(view, i, n) {
  const t = i / n * 2 * PI, c = Math.cos(t), s = Math.sin(t)
  const bounce = -Math.cos(2 * t)                       // -1 at the two contacts, +1 passing
  const [fwX, fwY] = FORWARD[view]
  const lift = (k) => 7 * Math.max(0, k * s)
  const ca = Math.cos(t - 0.35)                         // the arms trail the legs a little
  const pose = {
    bob: 1 + 2.4 * bounce,
    squash: 0.055 * Math.cos(2 * t - 0.55),             // squashes just after each contact, stretches passing
    headDy: 1.9 * Math.sin(2 * t),                      // the head lags the body's bounce
    hatDy: 1.5 * Math.sin(2 * t - 0.9),                 // the helmet lags the head
    feet: [[-c * fwX, -c * fwY, lift(1)], [c * fwX, c * fwY, lift(-1)]],
  }
  const [pickArm, rest] = CARRY[view]
  if (SIDE(view)) {
    pose.lean = -5 + 1.5 * Math.cos(2 * t)              // into the walk, most at the push-off
    pose.headTilt = 2.2 * Math.sin(2 * t - 0.6)
    pose.hatTilt = -1.6 * Math.sin(2 * t - 1.2)
    pose.arms = [30 * ca, -18 * ca]                      // near arm swings wide, far arm (with the pick) less
  } else {
    const rock = Math.sin(t - 0.3)
    pose.lean = 2.6 * rock                               // rocks over the planted foot
    pose.shift = 1.6 * rock
    pose.headTilt = -2.2 * Math.sin(t - 0.9)            // the head counters the rock, late
    pose.hatTilt = -1.8 * Math.sin(t - 1.5)
    const a = view === "downleft" || view === "upleft" ? 12 : 9
    pose.arms = [4 + a * ca, -4 + a * ca]
  }
  // the pick drags behind its hand, then catches up (secondary motion)
  pose.pick = { arm: pickArm, deg: rest + 9 * Math.sin(t - 1.3) * (SIDE(view) ? 1 : 0.7), front: false }
  return pose
}

function idlePose(view, i, n) {
  const t = i / n * 2 * PI, s = Math.sin(t)
  const [pickArm, rest] = CARRY[view]
  const breath = Math.sin(t - 0.5)
  return {
    bob: 0.9 * s,
    squash: -0.025 * s,                                  // stretches a touch breathing in
    headDy: 0.8 * Math.sin(t - 0.8),
    hatDy: 0.7 * Math.sin(t - 1.5),
    headTilt: SIDE(view) ? 0.8 * Math.sin(t - 1) : 0,
    arms: SIDE(view) ? [2 * breath, -1.5 * breath] : [3 + 2 * breath, -3 - 2 * breath],
    pick: { arm: pickArm, deg: rest + 2.5 * Math.sin(t - 1.4), front: false },
  }
}

const WALK_N = 12, WALK_MS = 50
const walk = (view) => Array.from({ length: WALK_N }, (_, i) => ({ ms: WALK_MS, draw: (d) => miner(d, view, walkPose(view, i, WALK_N)) }))
const IDLE_N = 8, IDLE_MS = 300
const idle = (view, blinks) => {
  const frames = Array.from({ length: IDLE_N }, (_, i) => ({ ms: IDLE_MS, draw: (d) => miner(d, view, idlePose(view, i, IDLE_N)) }))
  if (blinks) frames.splice(1, 0, { ms: 130, draw: (d) => miner(d, view, { ...idlePose(view, 0, IDLE_N), blink: true }) })
  return frames
}

// Strike: anticipation, wind-up (stretched, pick high), hit (squashed, leaning in, pick thrown
// toward the facing), follow-through, settle. Played once per swing (player.gd); the arc FX
// carries the sweep. Each key: body numbers, the swinging arm's angle and the pick's angle on
// screen (turned into the arm-relative angle here) and whether it's in front of the body.
const STRIKE_BODY = [
  { ms: 55, bob: -1, squash: 0.05, headDy: 1, hatDy: 0.5 },
  { ms: 50, bob: 2.5, squash: -0.07, headDy: -1.2, hatDy: -2 },
  { ms: 50, bob: -3, squash: 0.11, headDy: 2.2, hatDy: 2.5 },
  { ms: 60, bob: -2, squash: 0.06, headDy: 2.6, hatDy: 3.2 },
  { ms: 75, bob: 0, squash: 0.01, headDy: 0.6, hatDy: 1.2 },
]
const STRIKE = {      // per frame: [lean, other arm, swing arm, pick on screen (deg), in front]
  down: { arm: 1, keys: [[3, 10, -110, -80, false], [5, 20, -160, -70, false], [-4, -10, 35, 168, true], [-5, -12, 50, 150, true], [-1, 2, -20, -40, false]] },
  downleft: { arm: 1, keys: [[4, 10, -110, -82, false], [6, 18, -160, -72, false], [-6, -10, 40, 172, true], [-7, -12, 55, 158, true], [-2, 2, -20, -45, false]] },
  left: { arm: 0, keys: [[4, -10, -100, -45, false], [7, -14, -130, -40, false], [-7, 12, 75, 185, true], [-8, 14, 90, 160, true], [-3, 4, 30, 110, true]] },
  upleft: { arm: 1, keys: [[-3, -6, -110, -80, true], [-4, -10, -160, -70, true], [4, 8, -190, -120, false], [5, 10, -175, -140, false], [1, 2, -30, -60, false]] },
  up: { arm: 1, keys: [[-2, -6, -110, -80, true], [-3, -10, -160, -70, true], [2, 6, -185, -95, false], [3, 8, -170, -110, false], [0, 2, -30, -60, false]] },
}
const strike = (view) => {
  const { arm, keys } = STRIKE[view]
  return keys.map(([lean, other, swing, deg, front], i) => {
    const { ms, ...b } = STRIKE_BODY[i]
    const arms = arm === 0 ? [swing, other] : [other, swing]
    return { ms, draw: (d) => miner(d, view, { ...b, lean, arms, pick: { arm, deg: deg - swing - lean, front } }) }
  })
}

const VIEWS = ["down", "downleft", "left", "upleft", "up"]
sheet("miner", { w: 192, h: 176 }, Object.fromEntries(VIEWS.flatMap((v) => [
  ["miner_idle_" + v, idle(v, v === "down" || v === "downleft" || v === "left")],
  ["miner_walk_" + v, walk(v)],
  ["miner_strike_" + v, strike(v)],
])))

// ---------- Merchant: old prospector with a bucket hat and a big beard ----------
function merchant(d, { blink = false, bob = 0 } = {}) {
  const part = (name) => d.seed("merchant:" + name)
  const b = -bob
  for (const [name, x] of [["l", 52], ["r", 76]]) {
    part("boot" + name)
    d.blob(E(x, 119, 11, 6), { fill: "d", weight: 2.2, wobble: 0.4 })
  }
  part("body")
  const body = d.shape(roundRect(34, 70 + b, 60, 50 - b, 16), { wobble: 0.6 })
  d.fill(body, "e")
  d.hatch(crescent(64, 95, 28, 24, { shift: 0.3 }), { angle: -65, spacing: 3.4, color: "D", width: 1.3 })
  d.ink(body, { weight: INK })
  part("apron")
  const apron = d.shape(roundRect(44, 86 + b, 40, 32 - b, 8), { wobble: 0.5 })
  d.fill(apron, "c")
  d.fill(rectPts(72, 88 + b, 10, 28 - b), "E", { wobble: 0.3 })
  d.stroke([[52, 104 + b], [64, 105 + b], [76, 104 + b]], { color: "E", width: 1.6, taper: [0.1, 0.1] })
  d.ink(apron, { color: "d", weight: 1.8 })
  for (const [name, x] of [["l", 30], ["r", 98]]) {
    part("arm" + name)
    d.blob(E(x, 88 + b, 8.5, 12), { fill: "e", weight: 2.2, wobble: 0.4 })
    d.blob(E(x, 103 + b, 6.5, 6.5, 16), { fill: "P", weight: 2, wobble: 0.3 })
  }
  part("face")
  const face = d.shape(E(64, 52 + b, 28, 22), { wobble: 0.5 })
  d.fill(face, "P")
  d.ink(face, { weight: INK })
  part("beard")
  const beardPts = Array.from({ length: 36 }, (_, i) => {
    const t = i / 36 * PI, r = 1 + 0.08 * Math.abs(Math.sin(t * 7))
    return [64 + Math.cos(t) * 30 * r, 58 + b + Math.sin(t) * 44 * r]
  })
  const beard = d.shape([[34, 56 + b], ...beardPts.reverse(), [94, 56 + b]].reverse(), { wobble: 0.8 })
  d.fill(beard, "z")
  d.hatch(crescent(66, 74 + b, 26, 26, { shift: 0.35 }), { angle: -60, spacing: 3.6, color: "S", width: 1.2 })
  for (const [x, y] of [[50, 72], [62, 82], [74, 74], [58, 94], [70, 90]]) d.stroke([[x, y + b], [x + 2, y + 7 + b], [x, y + 12 + b]], { color: "w", width: 1.8, taper: [0.2, 0.5] })
  d.ink(beard, { weight: INK })
  for (const [name, x, dir] of [["ml", 55, -1], ["mr", 73, 1]]) {
    part(name)
    d.blob([[64, 58 + b], [x + dir * 12, 60 + b], [x + dir * 14, 66 + b], [x, 64 + b]], { fill: "w", ink: "S", weight: 1.4, wobble: 0.4 })
  }
  part("nose")
  d.blob(E(64, 57 + b, 6, 5, 16), { fill: "P", weight: 2, wobble: 0.3 }); d.dot(62, 55.5 + b, 1.4, "q")
  part("eyes")
  for (const x of [51, 77]) {
    if (blink) d.stroke([[x - 3.5, 50 + b], [x + 3.5, 50 + b]], { color: "k", width: 2.2, taper: [0.2, 0.2] })
    else { d.dot(x, 50 + b, 2.9, "k"); d.dot(x - 0.8, 49 + b, 0.9, "w") }
    d.stroke([[x - 6, 44 + b], [x, 42 + b], [x + 6, 44 + b]], { color: "k", width: 4.6, taper: [0.3, 0.3] })
    d.stroke([[x - 6, 44 + b], [x, 42 + b], [x + 6, 44 + b]], { color: "z", width: 2.8, taper: [0.3, 0.3] })
  }
  // ---- bucket hat with a leaf in the band ----
  part("hat")
  d.blob(E(64, 32 + b, 44, 8, 32), { fill: "h", weight: 2.4, wobble: 0.5 })
  const crown = d.shape([...arcPts(64, 32 + b, 30, 27, PI, 2 * PI, 20), [94, 34 + b], [34, 34 + b]], { wobble: 0.6 })
  d.fill(crown, "g")
  d.fill(E(56, 18 + b, 14, 8, 16), "G", { wobble: 0.6 })
  d.hatch([...arcPts(64, 32 + b, 27, 25, -0.42 * PI, 0, 10), [80, 33 + b]], { angle: -60, spacing: 3.4, color: "h", width: 1.3 })
  d.fill([[34, 27 + b], [94, 27 + b], [94, 34 + b], [34, 34 + b]], "h", { wobble: 0.4 })
  d.ink(crown, { weight: INK })
  d.blob([[80, 28 + b], [92, 16 + b], [96, 20 + b], [86, 30 + b]], { fill: "G", ink: "j", weight: 1.4, wobble: 0.3 })
}

sheet("merchant", { w: 128, h: 128 }, {
  merchant_idle: [
    { ms: 2200, draw: (d) => merchant(d) },
    { ms: 140, draw: (d) => merchant(d, { blink: true }) },
    { ms: 300, draw: (d) => merchant(d, { bob: 1 }) },
    { ms: 700, draw: (d) => merchant(d, { bob: 2 }) },
    { ms: 300, draw: (d) => merchant(d, { bob: 1 }) },
    { ms: 1200, draw: (d) => merchant(d) },
  ],
})
