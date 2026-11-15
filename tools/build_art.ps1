# Exports every pxl art file in art/src into assets/<file name>/ and every hand-drawn file in
# art/hand into assets/hand/<file name>/ for Godot.
# Usage:  powershell -File tools/build_art.ps1                 (all files)
#         powershell -File tools/build_art.ps1 floor1          (only files named floor1)
#         powershell -File tools/build_art.ps1 base -Hand      (only art/hand/base.hd.js)
#         powershell -File tools/build_art.ps1 base -Pixel     (only art/src/base.px.js)
# Files starting with "_" (style tests, mockups) and palette.px.js are skipped.
# Each output folder is wiped first, so it always matches the source exactly.
param([string]$Only = "", [switch]$Hand, [switch]$Pixel)
$doPixel = -not $Hand -or $Pixel
$doHand  = -not $Pixel -or $Hand

$root = Split-Path -Parent $PSScriptRoot
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) { $node = "node" }
$pxl  = Join-Path $env:USERPROFILE ".claude\skills\pxl-pixel-art\bin\pxl.js"

Get-ChildItem (Join-Path $root "art\src") -Filter *.px.js |
  Where-Object { $doPixel -and $_.Name -ne "palette.px.js" -and -not $_.Name.StartsWith("_") -and ($Only -eq "" -or $_.Name -eq "$Only.px.js") } |
  ForEach-Object {
    $name = $_.Name -replace '\.px\.js$', ''
    $out  = Join-Path $root "assets\$name"
    Write-Host "== $name -> assets\$name"
    # Keep Godot's .import files so resource UIDs stay stable; remove everything else.
    if (Test-Path $out) { Get-ChildItem $out -Recurse -File | Where-Object { $_.Extension -ne ".import" } | Remove-Item -Force }
    & $node $pxl build $_.FullName --out $out --no-preview
    # Animations ship inside sheets (PNG + JSON with tags); drop the per-anim strips and GIFs.
    $anims = Join-Path $out "anims"
    if (Test-Path $anims) { Remove-Item $anims -Recurse -Force }
    Get-ChildItem $out -Recurse -Filter *.gif | Remove-Item -Force
    # Drop .import files whose source no longer exists.
    Get-ChildItem $out -Recurse -Filter *.import | Where-Object { -not (Test-Path ($_.FullName -replace '\.import$', '')) } | Remove-Item -Force
  }

# Hand-drawn art (art/hand/*.hd.js, built with the HandDrawn tool) -> assets/hand/<file>/ as SVG (+ sheet JSON).
$hd = Join-Path $env:USERPROFILE "Documents\Projects\Tools\HandDrawn\bin\hd.js"
if (-not (Test-Path $hd)) { Write-Error "HandDrawn not found at $hd"; exit 1 }
Get-ChildItem (Join-Path $root "art\hand") -Filter *.hd.js |
  Where-Object { $doHand -and -not $_.Name.StartsWith("_") -and ($Only -eq "" -or $_.Name -eq "$Only.hd.js") } |
  ForEach-Object {
    $name = $_.Name -replace '\.hd\.js$', ''
    $out  = Join-Path $root "assets\hand\$name"
    Write-Host "== hand/$name -> assets\hand\$name"
    if (Test-Path $out) { Get-ChildItem $out -Recurse -File | Where-Object { $_.Extension -ne ".import" } | Remove-Item -Force }
    & $node $hd build $_.FullName --out $out
    Get-ChildItem $out -Recurse -Filter *.import | Where-Object { -not (Test-Path ($_.FullName -replace '\.import$', '')) } | Remove-Item -Force
  }

# Editor resources made from the hand sheets (resources/frames, resources/tilesets/*_hand.tres,
# resources/ui/hand_font.res): import the new SVGs, then rebuild them (tools/hand_resources.gd).
if ($doHand) {
  $godot = "C:\Users\Gabriel Mint\Downloads\Godot\Godot_v4.7.2-stable_win64_console.exe"
  if (Test-Path $godot) {
    Write-Host "== hand resources"
    & $godot --headless --path $root --import | Out-Null
    & $godot --headless --path $root --script res://tools/hand_resources.gd
  } else {
    Write-Warning "Godot not found at ${godot}: run tools/hand_resources.gd yourself (see its header)."
  }
}
