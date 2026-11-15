class_name HandFont
extends RefCounted
## The UI font: hand-lettered capitals drawn by code (art/hand/ui.hd.js, sheet "font": one
## 40x56-unit cell per character in ORDER, white, baseline at y 44). Built into a bitmap FontFile
## twice: at art scale by tools/hand_resources.gd (resources/ui/hand_font.res, used by
## resources/ui/ui_theme.tres so the editor shows the real font), and at runtime by Game at the
## window's exact scale (see Hand), so text is sharp at 1:1.
## Glyph widths are measured from the pixels. Lowercase draws as uppercase; accents fold.

const ORDER := "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?:;'-+/()=%*<>"
const SIZE := 14                  # font size in logical px = cell height (56 units / 4)
const CELL := Vector2(40, 56)     # art units
const BASELINE := 44.0            # art units from the cell top
const GAP := 3.0                  # art units between letters
const SPACE := 14.0               # art units, advance of " "

const FOLD := {
	"Á": "A", "À": "A", "Â": "A", "Ã": "A", "É": "E", "Ê": "E", "Í": "I",
	"Ó": "O", "Ô": "O", "Õ": "O", "Ú": "U", "Ç": "C",
}


static func build(r := Hand.raster()) -> FontFile:
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(Hand.DIR + "ui/font.json"))
	var img := Hand.texture("ui/font.svg", r).get_image()
	img.convert(Image.FORMAT_RGBA8)
	var cell_h := roundi(CELL.y * r)
	var sz := Vector2i(cell_h, 0)

	var font := FontFile.new()
	font.antialiasing = TextServer.FONT_ANTIALIASING_GRAY
	font.fixed_size = cell_h
	font.fixed_size_scale_mode = TextServer.FIXED_SIZE_SCALE_ENABLED
	font.set_cache_ascent(0, cell_h, BASELINE * r)
	font.set_cache_descent(0, cell_h, (CELL.y - BASELINE) * r)
	font.set_texture_image(0, sz, 0, img)

	var placed := {}
	for i in ORDER.length():
		var ch := ORDER[i]
		var f: Dictionary = data.frames["font_%d" % i].frame
		var cell := Rect2i(roundi(f.x * r), roundi(f.y * r), roundi(f.w * r), roundi(f.h * r))
		var x0 := cell.position.x
		var x1 := x0
		if ch != " ":
			var span := _ink_span(img, cell)
			x0 = span.x
			x1 = span.y
		var rect := Rect2(x0, cell.position.y, x1 - x0, cell.size.y)
		var advance := (SPACE * r) if ch == " " else rect.size.x + GAP * r
		placed[ch] = [rect, advance]

	for ch in placed:
		_glyph(font, sz, ch.unicode_at(0), placed[ch], r)
		var lower: String = ch.to_lower()
		if lower != ch:
			_glyph(font, sz, lower.unicode_at(0), placed[ch], r)
	for accented in FOLD:
		var base: String = FOLD[accented]
		_glyph(font, sz, accented.unicode_at(0), placed[base], r)
		_glyph(font, sz, accented.to_lower().unicode_at(0), placed[base], r)
	return font


## Leftmost and rightmost columns with ink inside `cell` (exclusive end).
static func _ink_span(img: Image, cell: Rect2i) -> Vector2i:
	var lo := cell.end.x
	var hi := cell.position.x
	for x in range(cell.position.x, cell.end.x):
		for y in range(cell.position.y, cell.end.y):
			if img.get_pixel(x, y).a > 0.1:
				lo = mini(lo, x)
				hi = maxi(hi, x + 1)
				break
	if hi <= lo:
		return Vector2i(cell.position.x, cell.position.x)
	return Vector2i(lo, hi)


static func _glyph(font: FontFile, sz: Vector2i, cp: int, g: Array, r: float) -> void:
	var rect: Rect2 = g[0]
	font.set_glyph_advance(0, sz.x, cp, Vector2(g[1], 0))
	font.set_glyph_offset(0, sz, cp, Vector2(0, -BASELINE * r))
	font.set_glyph_size(0, sz, cp, rect.size)
	font.set_glyph_uv_rect(0, sz, cp, rect)
	font.set_glyph_texture_idx(0, sz, cp, 0)
