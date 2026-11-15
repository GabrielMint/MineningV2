// Minening palette: Endesga 32 (docs/GDD.md §7) and NOTHING else.
// Every art file starts with: include("palette.px.js")
// use() replaces pxl's default palette, so no stray default color can sneak in.
// Don't use hex colors, glow() color mode or lighting() in art files: they leave the palette.

use([
  "#be4a2f", "#d77643", "#ead4aa", "#e4a672", "#b86f50", "#733e39", "#3e2731", "#a22633",
  "#e43b44", "#f77622", "#feae34", "#fee761", "#63c74d", "#3e8948", "#265c42", "#193c3e",
  "#124e89", "#0099db", "#2ce8f5", "#ffffff", "#c0cbdc", "#8b9bb4", "#5a6988", "#3a4466",
  "#262b44", "#181425", "#ff0044", "#68386c", "#b55088", "#f6757a", "#e8b796", "#c28569",
])

// Mnemonic keys.
pal({
  // cool greys / stone (dark -> light)
  k: "#181425", K: "#262b44", n: "#3a4466", s: "#5a6988", S: "#8b9bb4", z: "#c0cbdc", w: "#ffffff",
  // earth / wood (dark -> light)
  d: "#3e2731", D: "#733e39", e: "#b86f50", E: "#e4a672", c: "#ead4aa",
  // skin
  p: "#c28569", P: "#e8b796",
  // reds / fire
  r: "#a22633", R: "#e43b44", x: "#ff0044", o: "#be4a2f", O: "#d77643", f: "#f77622", Y: "#feae34", y: "#fee761",
  // greens (dark -> light)
  j: "#193c3e", h: "#265c42", g: "#3e8948", G: "#63c74d",
  // blues (dark -> light)
  b: "#124e89", B: "#0099db", C: "#2ce8f5",
  // purples / pinks
  v: "#68386c", V: "#b55088", q: "#f6757a",
})

// Light ramps, dark -> light. shade()/light() and selout follow these.
ramps(
  "kKnsSzw",  // stone, metal, cool shadows
  "kdDeEc",   // earth, wood, leather
  "dDpP",     // skin
  "kjhgG",    // foliage, moss
  "kKbBC",    // water, sapphire, crystal
  "drRx",     // red
  "doOfYy",   // rust, fire, gold, light
  "dvVq",     // purple, toxic gas
)
