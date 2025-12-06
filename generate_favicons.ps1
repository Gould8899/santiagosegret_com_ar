<#
  generate_favicons.ps1
  --------------------------------------------------
  PowerShell helper to generate PNG and ICO favicons
  from the existing `favicon.svg` using ImageMagick.

  Usage (PowerShell):
    > .\generate_favicons.ps1

  Requirements:
    - ImageMagick (`magick` command) installed and in PATH.
      https://imagemagick.org

  The script will produce:
    - favicon-16.png
    - favicon-32.png
    - favicon-48.png
    - favicon-192.png
    - favicon.ico   (contains multiple sizes)
#>

$svg = "favicon.svg"
if (-not (Test-Path $svg)) {
  Write-Error "File '$svg' not found in current directory. Run this script from the project root where favicon.svg is located."
  exit 1
}

function Check-Command($cmd) {
  $which = Get-Command $cmd -ErrorAction SilentlyContinue
  return $which -ne $null
}

if (-not (Check-Command magick)) {
  Write-Error "ImageMagick 'magick' not found in PATH. Please install ImageMagick and ensure 'magick' is available in your PATH."
  exit 1
}

Write-Output "Generating PNG favicons from $svg..."

$sizes = @(16,32,48,192)
foreach ($s in $sizes) {
  $out = "favicon-$s.png"
  & magick convert "$svg" -background none -resize ${s}x${s} "$out"
  if ($LASTEXITCODE -ne 0) { Write-Error "magick failed for size $s"; exit 1 }
  else { Write-Output "Created $out" }
}

Write-Output "Building multi-resolution ICO (favicon.ico)..."
& magick convert favicon-16.png favicon-32.png favicon-48.png favicon-192.png favicon.ico
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create favicon.ico"; exit 1 }
Write-Output "Created favicon.ico"

Write-Output "Done. Add these files to your site root and refresh browser cache to see changes." 
