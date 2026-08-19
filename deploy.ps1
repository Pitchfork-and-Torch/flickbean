# Deploy Flickbean to Cloudflare Pages (flickbean.jonbailey.xyz)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Project = "flickbean-jonbailey"

Push-Location $Root
try {
  Write-Host "[DEPLOY] Regenerating OG card..."
  py -3 scripts\generate_og.py
  Write-Host "[DEPLOY] Building (cloudflare_pages)..."
  $env:NITRO_PRESET = "cloudflare_pages"
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $dist = $null
  foreach ($c in @("dist", ".output/public", ".vercel/output/static")) {
    if (Test-Path (Join-Path $Root $c)) { $dist = $c; break }
  }
  if (-not $dist) { throw "No build output dir found" }
  Write-Host "[DEPLOY] Output=$dist project=$Project"
  npx --yes wrangler pages deploy $dist --project-name=$Project --commit-dirty=true
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Site:    https://flickbean.jonbailey.xyz/"
Write-Host "Preview: https://$Project.pages.dev/"
