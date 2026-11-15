shader_type canvas_item;
// Palette-safe hit flash: replaces every opaque pixel with ONE palette color.
// (modulate tints would create off-palette colors; see art/STYLE_GUIDE.md)

uniform bool flash = false;
uniform vec4 flash_color : source_color = vec4(0.902, 0.831, 0.447, 1.0); // y #e6d472

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	if (flash) {
		c.rgb = flash_color.rgb;
	}
	COLOR = c;
}
