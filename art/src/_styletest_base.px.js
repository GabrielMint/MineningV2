// Style test: the base at game resolution. Not exported (leading "_").
include("base.px.js")
include("characters.px.js")

const MAP = `
  tttttttttttttttttttt
  tttttttttttttttttttt
  ffffffvffffffffvffff
  gggggggggpppgggggggg
  gfgggggggpppggggfggg
  ggggggggpppppggggggg
  gggfgggppppppgggggfg
  ggggggppppppppgggggg
  gggggggpppppgggggggg
  ggfggggggppgggggfggg
  gggggggggppggggggggg
  gggggggggppggggggggg`

scene("styletest_base", { w: 320, h: 180, bg: "k" },
  layer("ground", tilemap(MAP, { size: 16, map: {
    t: "b_cliff_top", f: "b_cliff_face", v: "b_cliff_face_vines",
    g: "b_grass", F: "b_grass_flowers", p: "b_path", } })),
  layer("ground2", tilemap(MAP.replace(/[gptfv]/g, "."), { size: 16, map: { f: "b_grass_flowers" } })),
  layer("shadows", { shade: true },
    ellipse(80, 66, 18, 2, "k"), ellipse(166, 61, 22, 2, "k"),
    ellipse(52, 56, 5, 1, "k"), ellipse(64, 70, 7, 1, "k"), ellipse(160, 101, 5, 1, "k")),
  layer("props",
    stamp("b_mine_entrance", 136, 21),
    stamp("b_stall", 60, 33),
    stamp("merchant_idle", 72, 47, { frame: 0 }),
    stamp("b_barrel", 46, 45), stamp("b_crate", 104, 53),
    stamp("b_lamp_post", 196, 46),
    stamp("b_bush", 10, 60), stamp("b_bush", 270, 90), stamp("b_bush", 240, 40),
    stamp("miner_idle_down", 152, 86, { frame: 0 })))
