// Style test: talent nodes with icons + panels. Not exported.
include("ui.px.js")
const IDS = ["ore_damage", "mine_speed", "gas_resist", "ore_yield", "enemy_damage",
             "armor", "arc_radius", "spinning_picks", "ore_chain", "heal_on_kill"]
const FRAMES = ["tt_node_open", "tt_node_ready", "tt_node_max", "tt_node_locked", "tt_node_hover"]
scene("styletest_ui", { w: 240, h: 130, bg: "K" },
  ...IDS.map((id, i) => stamp(FRAMES[i % 5], 6 + (i % 5) * 46, 6 + Math.floor(i / 5) * 46)),
  ...IDS.map((id, i) => stamp("icon_" + id, 12 + (i % 5) * 46, 12 + Math.floor(i / 5) * 46)),
  stamp("ui_panel", 6, 100), stamp("ui_button_hover", 34, 100), stamp("ui_button_disabled", 62, 100),
  stamp("ui_panel_dark", 90, 100), stamp("ui_bar_frame", 118, 104), stamp("ui_bar_fill", 120, 106))
