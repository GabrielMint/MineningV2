include("palette.px.js")
// Characters at the 32px scale, Enter the Gungeon proportions (references/): chibi with a big
// head (~half the height), stubby body, tiny legs, hard 1px "k" outline, 2-3 flat shades per part,
// dot eyes. The player is the size reference: 32x32 frame (30x30 + outline), ~22 px wide, 32 tall.
// Directions: down, up, left (right = left flipped in Godot).
// Front/back views are mirrored halves (mx); legs are separate parts so walk frames can differ.

const CHAR = { w: 30, h: 30, outline: "k", fps: 8 }

// ---------- Miner: facing down ----------
// Rows 0-6 helmet (lamp in the middle), 7-14 face, 15-24 shirt/belt/trousers, legs 25-29.
sprite("_miner_down_top", { mx: true }, `
  ..........YYYYY
  ........YYYYYYY
  .......YyyYYYff
  ......YyyYYYfyw
  ......YyYYYYfyw
  ......YYYYYYYff
  .....oooooooooo
  ......ppppppppp
  ......PPPPPPPPP
  ......PPPPkPPPP
  ......PPPPkPPPP
  ......qPPPPPPPP
  ......PPPPPPPDD
  .......pPPPPPPP
  ........ppppppp
  .......bbBBBBBB
  ......bBBBBBBBB
  .....bbBBBBBBBB
  .....bbBBBeBBBB
  .....PPBBBeBBBB
  .....PpBBBeBBBB
  .......DDDDDDDY
  .......eeeeeeee
  .......eeeeeeee
  .......Deeeeeee`)

const LEGS_FRONT = `
  ........eeeee....eeeee
  ........DDDDD....DDDDD
  ........ddddd....ddddd
  ........ddddd....ddddd
  .......dddddd....dddddd`
const LEGS_FRONT_L = `
  ........ddddd....eeeee
  ........ddddd....DDDDD
  .......dddddd....ddddd
  .................ddddd
  .................dddddd`
const LEGS_FRONT_R = `
  ........eeeee....ddddd
  ........DDDDD....ddddd
  ........ddddd....dddddd
  ........ddddd
  .......dddddd`
sprite("_legs_front", LEGS_FRONT)
sprite("_legs_front_l", LEGS_FRONT_L)
sprite("_legs_front_r", LEGS_FRONT_R)

const BLINK_DOWN = [grid(10, 9, "P\nk"), grid(19, 9, "P\nk")]
anim("miner_idle_down", CHAR, stamp("_miner_down_top", 0, 0), stamp("_legs_front", 0, 25),
  frame({ ms: 1800 }),
  frame({ ms: 140 }, ...BLINK_DOWN))
anim("miner_walk_down", CHAR, stamp("_miner_down_top", 0, 0),
  frame(stamp("_legs_front", 0, 25)),
  frame(stamp("_legs_front_l", 0, 25)),
  frame(stamp("_legs_front", 0, 25)),
  frame(stamp("_legs_front_r", 0, 25)))

// ---------- Miner: facing up (back) ----------
sprite("_miner_up_top", { mx: true }, `
  ..........YYYYY
  ........YYYYYYY
  .......YyyYYYYY
  ......YyyYYYYYY
  ......YyYYYYYYY
  ......YYYYYYYYY
  .....oooooooooo
  ......ddddddddd
  ......DDDDDDDDD
  ......DDDdDDDDD
  ......DDDDDDdDD
  ......pDDDDDDDD
  ......pDDdDDDDD
  .......DDDDDDDD
  ........ppppppp
  .......bbBBBBBB
  ......bBBBBBBBB
  .....bbBBBBBBBB
  .....bbBBBBeBBB
  .....PPBBBBBeBB
  .....PpBBBBBBeB
  .......DDDDDDDD
  .......eeeeeeee
  .......eeeeeeee
  .......Deeeeeee`)

anim("miner_idle_up", CHAR, stamp("_miner_up_top", 0, 0), stamp("_legs_front", 0, 25), frame({ ms: 1000 }))
anim("miner_walk_up", CHAR, stamp("_miner_up_top", 0, 0),
  frame(stamp("_legs_front", 0, 25)),
  frame(stamp("_legs_front_l", 0, 25)),
  frame(stamp("_legs_front", 0, 25)),
  frame(stamp("_legs_front_r", 0, 25)))

// ---------- Miner: facing left (side) ----------
sprite("_miner_left_top", `
  ..........YYYYYYYYY
  ........YYYYYYYYYYYYY
  .......YyyYYYYYYYYYYYf
  ...ffwYyyYYYYYYYYYYYYf
  ...fwyYyYYYYYYYYYYYYYf
  ....ffYYYYYYYYYYYYYYYf
  ....oooooooooooooooooo
  ......pppppppppddddddd
  ......PPPPPPPPPpDDDDDD
  ......PPkPPPPPPpDDdDDD
  ......PPkPPPPPPpDDDDDD
  .....PPPPqPPPPPpDDDDdD
  ......PDDPPPPPpDDDDDDD
  .......PPPPPPpDDDDDDD
  ........pppppppDDDDD
  ........bbBBBBBBBBBb
  .......bBBBBBBBBBBBBb
  .......bBBBbBBBBBBBBb
  .......bBBBbBBBBBeBBb
  .......bBBBbBBBBBeBBb
  .......bBBPPBBBBBeBBb
  ........DDPpDDDDYDDDD
  ........eeeeeeeeeeeee
  ........eeeeeeeeeeeee
  ........Deeeeeeeeeeed`)
sprite("_legs_side", `
  ...........eeeeeee
  ...........DDDDDDD
  ...........ddddddd
  ...........ddddddd
  .........ddddddddd`)
sprite("_legs_side_stride", `
  .........eeee..eeee
  ........DDDD....DDDD
  .......dddd......dddd
  ......dddd.......dddd
  .....ddddd.......ddddd`)

anim("miner_idle_left", CHAR, stamp("_miner_left_top", 0, 0), stamp("_legs_side", 0, 25),
  frame({ ms: 1800 }),
  frame({ ms: 140 }, grid(8, 9, "P\nk")))
anim("miner_walk_left", CHAR, stamp("_miner_left_top", 0, 0),
  frame(stamp("_legs_side", 0, 25)),
  frame(stamp("_legs_side_stride", 0, 25)),
  frame(stamp("_legs_side", 0, 25)),
  frame(stamp("_legs_side_stride", 0, 25)))

// ---------- Rat (Floor 1 enemy), facing left, ~28x14 ----------
const rat = `
  ......qq
  .....qVVq
  ....qVSSSzz
  ...SSSSSSzzSSS
  ..SkSSSSSSSSSSSS
  .SSkSSSSSSSSSSSSSs
  qSSSSSSSSSSSSSSSSss
  PqSSSSSSSSSSSSSSsss
  .sSSSSSSSSSSSSSssss....VV
  ..ssSSSSSSSSSSssssn...V..V
  ...sssssssssssssssnVVV
  ....nssssssssssnnn
  .....qq..qq....qq..qq`
anim("rat_idle_left", { outline: "k", fps: 3 }, rat,
  frame(),
  frame(grid(19, 7, ".....VV\n....V..V\n...V\n__V")))
anim("rat_walk_left", { outline: "k", fps: 10 }, rat,
  frame(),
  frame(grid(0, 12, "....qq..qq....qq..qq.")))

// ---------- Merchant (base NPC), facing down, same chibi proportions ----------
sprite("_merchant", { mx: true }, `
  ...........hhhh
  .........hhgggg
  ........hgGGggg
  ........hgGgggg
  ........hgggggg
  .....hhhhhhhhhh
  .....jjjjjjjjjj
  ......zzppppppp
  ......zPPPPPPPP
  ......zPPPkPPPP
  ......zPPPkPPPP
  ......zPPPPPPPq
  ......zzzwzzzzz
  ......zwzzzzwzz
  ......zzzzwzzzz
  .....eezzwzzzzw
  .....eeeezzzwzz
  .....eeeeEzzzzz
  .....PeeeEccccc
  .....PpeeEccccc
  ......eeeEccccc
  ......DDDDDDDDD
  ......DeeEccccc
  ......DeeEccccE
  ......DDDDDDDDD
  .........ddd...
  .........ddd...
  ........dddd...`)
anim("merchant_idle", { w: 30, h: 28, outline: "k" }, stamp("_merchant", 0, 0),
  frame({ ms: 2200 }),
  frame({ ms: 140 }, grid(10, 9, "P\nk"), grid(19, 9, "P\nk")),
  frame({ ms: 1400 }))

sheet("miner", ["miner_*"], { pad: 1 })
sheet("rat", ["rat_*"], { pad: 1 })
sheet("merchant", ["merchant_*"], { pad: 1 })
