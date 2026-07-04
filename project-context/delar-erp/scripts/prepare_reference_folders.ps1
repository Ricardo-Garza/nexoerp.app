$ErrorActionPreference = "Stop"
$base = Join-Path (Get-Location) "project-context\delar-erp\reference"
@(
  "alpha-proposal",
  "odoo-screenshots",
  "catalog-images",
  "source-text",
  "videos",
  "video-contact-sheets"
) | ForEach-Object {
  New-Item -ItemType Directory -Path (Join-Path $base $_) -Force | Out-Null
}
Write-Host "Carpetas preparadas en $base"
Write-Host "Copia los 3 MP4 originales a reference\videos y conserva sus nombres."
