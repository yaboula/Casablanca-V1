# E2E backend startup script
Set-Location $PSScriptRoot

$env:DOTENV_CONFIG_PATH = Join-Path $PSScriptRoot ".env.e2e.backend"
node -r dotenv/config "$PSScriptRoot\dist\main.js"
