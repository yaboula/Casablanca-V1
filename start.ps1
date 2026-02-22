<#
.SYNOPSIS
  NEXUS - Arranca (o reinicia) todos los servidores del proyecto.

  Servicios gestionados:
    Docker: nexus_postgres, nexus_redis, nexus_backend  (docker-compose)
    Frontend: Next.js en http://localhost:3600

.USAGE
  .\start.ps1              # arrancar/reiniciar todo
  .\start.ps1 -BackendOnly # solo Docker
  .\start.ps1 -FrontOnly   # solo Next.js
  .\start.ps1 -Stop        # parar todo
#>

param(
  [switch]$BackendOnly,
  [switch]$FrontOnly,
  [switch]$Stop
)

$ErrorActionPreference = "Continue"

# ---- Rutas ---------------------------------------------------
$ROOT       = $PSScriptRoot
$DOCKER_DIR = Join-Path $ROOT "backend\docker"
$FRONT_LOG  = Join-Path $ROOT ".nexus-front.log"
$PID_FILE   = Join-Path $ROOT ".nexus-front.pid"

# ---- Helpers de color ----------------------------------------
function Write-Step  { param($msg) Write-Host "`n  >> $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Write-Title { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# ---- Banner --------------------------------------------------
Write-Host ""
Write-Host "  ======================================" -ForegroundColor Magenta
Write-Host "     NEXUS  --  Dev Server Manager      " -ForegroundColor Magenta
Write-Host "  ======================================" -ForegroundColor Magenta

# ==============================================================
#  PARAR TODO
# ==============================================================
function Stop-All {
  Write-Title "Parando servicios"

  # Frontend
  if (Test-Path $PID_FILE) {
    $savedPid = (Get-Content $PID_FILE -Raw).Trim()
    if ($savedPid -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
      Write-Step "Deteniendo Next.js (PID $savedPid)..."
      Stop-Process -Id $savedPid -Force
      Write-Ok "Next.js detenido."
    }
    Remove-Item $PID_FILE -Force
  } else {
    $proc = Get-NetTCPConnection -LocalPort 3600 -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
    if ($proc) {
      Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
      Write-Ok "Next.js (puerto 3600) detenido."
    } else {
      Write-Warn "Next.js no estaba corriendo."
    }
  }

  # Docker
  Write-Step "Deteniendo contenedores Docker..."
  Push-Location $DOCKER_DIR
  docker compose down 2>$null | Out-Null
  Pop-Location
  Write-Ok "Contenedores detenidos."
  Write-Host ""
}

# ==============================================================
#  BACKEND (Docker)
# ==============================================================
function Start-Backend {
  Write-Title "BACKEND (Docker)"

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker no encontrado en el PATH."
    exit 1
  }

  Push-Location $DOCKER_DIR

  $containers  = @("nexus_postgres","nexus_redis","nexus_backend")
  $allRunning  = $true
  $anyExists   = $false

  foreach ($c in $containers) {
    $status = docker inspect --format "{{.State.Status}}" $c 2>$null
    if ($status) {
      $anyExists = $true
      Write-Host "  $c : $status" -ForegroundColor Gray
      if ($status -ne "running") { $allRunning = $false }
    } else {
      $allRunning = $false
    }
  }

  if ($allRunning) {
    Write-Step "Todos corriendo. Reiniciando..."
    docker compose restart 2>$null | Out-Null
    Write-Ok "Contenedores reiniciados."
  } elseif ($anyExists) {
    Write-Step "Algunos detenidos. Levantando..."
    docker compose up -d 2>$null | Out-Null
    Write-Ok "Contenedores levantados."
  } else {
    Write-Step "Primera vez: construyendo e iniciando..."
    docker compose up -d --build 2>$null | Out-Null
    Write-Ok "Contenedores construidos e iniciados."
  }

  # Health check
  Write-Step "Esperando health checks (max 60s)..."
  $timeout = 60
  $elapsed = 0
  $healthy = $false

  while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 3
    $elapsed += 3

    $pgStatus = docker inspect --format "{{.State.Health.Status}}" nexus_postgres 2>$null
    $rdStatus = docker inspect --format "{{.State.Health.Status}}" nexus_redis    2>$null
    $beState  = docker inspect --format "{{.State.Status}}"         nexus_backend  2>$null

    Write-Host "  ${elapsed}s - postgres:$pgStatus  redis:$rdStatus  backend:$beState" -ForegroundColor DarkGray

    if ($pgStatus -eq "healthy" -and $rdStatus -eq "healthy" -and $beState -eq "running") {
      $healthy = $true
      break
    }
  }

  Pop-Location

  if ($healthy) {
    Write-Ok "Backend listo en http://localhost:3900/api/v1"
  } else {
    Write-Warn "Health check tardo mas de ${timeout}s. Revisa: docker logs nexus_backend"
  }
}

# ==============================================================
#  FRONTEND (Next.js)
# ==============================================================
function Start-Frontend {
  Write-Title "FRONTEND (Next.js)"

  $existing = Get-NetTCPConnection -LocalPort 3600 -State Listen -ErrorAction SilentlyContinue |
              Select-Object -First 1
  if ($existing) {
    Write-Warn "Puerto 3600 ocupado (PID $($existing.OwningProcess)). Matando proceso anterior..."
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Ok "Proceso anterior eliminado."
  }

  if (Test-Path $PID_FILE) { Remove-Item $PID_FILE -Force }

  Write-Step "Iniciando Next.js en background..."

  $proc = Start-Process `
    -FilePath     "cmd.exe" `
    -ArgumentList "/c","npm","run","dev" `
    -WorkingDirectory $ROOT `
    -RedirectStandardOutput $FRONT_LOG `
    -RedirectStandardError  "$FRONT_LOG.err" `
    -PassThru `
    -WindowStyle  Hidden

  "$($proc.Id)" | Out-File $PID_FILE -Encoding ASCII

  Write-Step "Esperando a que Next.js levante en :3600 (max 45s)..."
  $timeout = 45
  $elapsed = 0
  $ready   = $false

  while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    if (Get-NetTCPConnection -LocalPort 3600 -State Listen -ErrorAction SilentlyContinue) {
      $ready = $true
      break
    }
  }

  if ($ready) {
    Write-Ok "Frontend listo en http://localhost:3600"
    Write-Host "  Log: $FRONT_LOG" -ForegroundColor DarkGray
    Write-Host "  PID: $($proc.Id)  (en .nexus-front.pid)" -ForegroundColor DarkGray
  } else {
    Write-Warn "Next.js no levanto en ${timeout}s. Revisa: $FRONT_LOG"
  }
}

# ==============================================================
#  MAIN
# ==============================================================
if ($Stop) {
  Stop-All
  exit 0
}

if (-not $FrontOnly)   { Start-Backend  }
if (-not $BackendOnly) { Start-Frontend }

# Resumen
$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.PrefixOrigin -eq 'Dhcp' } |
            Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  --------------------------------------" -ForegroundColor DarkGray
Write-Host "  Backend  ->  http://localhost:3900/api/v1" -ForegroundColor White
Write-Host "  Frontend ->  http://localhost:3600"        -ForegroundColor White
Write-Host "  API docs ->  http://localhost:3900/api"    -ForegroundColor White
if ($localIP) {
  Write-Host "  Red local -> http://${localIP}:3600"     -ForegroundColor Yellow
}
Write-Host "  --------------------------------------" -ForegroundColor DarkGray
Write-Host "  Para parar todo: .\start.ps1 -Stop"    -ForegroundColor DarkGray
Write-Host ""
