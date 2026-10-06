# Instalador global de skills/herramientas para Claude Code (Windows / PowerShell 5.1+ o 7+).
# No necesita Git: los repos se descargan como ZIP desde GitHub.
# Reglas:
#   - Si una skill/repo ya existe, se salta.
#   - No ejecuta hooks, postinstall ni setups de terceros sin mostrar qué hacen y pedir confirmación.
#   - Todo lo que instala software (Node.js, pnpm, CLI de Claude, Paperclip, Orca) pide autorización antes.
#   - Si algo falla, sigue y al final imprime la tabla herramienta | estado | nota.
# Uso:  powershell -ExecutionPolicy Bypass -File .\install-skills.ps1
#       powershell -ExecutionPolicy Bypass -File .\install-skills.ps1 -AssumeYes
param([switch]$AssumeYes)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'   # la barra de progreso hace lentísimas las descargas en PS 5.1
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

$ClaudeDir = Join-Path $HOME '.claude'
$SkillsDir = Join-Path $ClaudeDir 'skills'
$ReposDir  = Join-Path $ClaudeDir 'skill-repos'
$ReviewDir = Join-Path $HOME 'review'
$ZipBase   = if ($env:SKILLS_ZIP_BASE) { $env:SKILLS_ZIP_BASE } else { 'https://codeload.github.com' }
New-Item -ItemType Directory -Force -Path $SkillsDir, $ReposDir | Out-Null

$Results = New-Object System.Collections.Generic.List[object]
function Record($tool, $status, $note) {
  $Results.Add([pscustomobject]@{ Herramienta = $tool; Estado = $status; Nota = $note })
  Write-Host "  -> [$status] $tool — $note"
}
function Section($t) { Write-Host "`n==== $t ====" }
function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Confirm-Step($q) {
  if ($AssumeYes) { return $true }
  $a = Read-Host "$q [s/N]"
  return $a -match '^(s|si|y|yes)$'
}
function Get-Ver($s) { try { [version](($s -replace '^v','') -replace '[^0-9.].*$','') } catch { $null } }

# Descarga github.com/<owner>/<repo> (rama por defecto) como ZIP y lo deja en $dest. Devuelve $true/$false.
function Get-RepoZip($owner, $repo, $dest) {
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("skill-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp 'repo.zip'
    Invoke-WebRequest -UseBasicParsing -Uri "$ZipBase/$owner/$repo/zip/HEAD" -OutFile $zip -ErrorAction Stop
    Expand-Archive -Path $zip -DestinationPath (Join-Path $tmp 'x') -Force -ErrorAction Stop
    $top = Get-ChildItem -Directory (Join-Path $tmp 'x') | Select-Object -First 1   # GitHub mete todo en <repo>-<rama>\
    New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
    Move-Item -Path $top.FullName -Destination $dest -ErrorAction Stop
    return $true
  } catch {
    Write-Host "     error descargando $owner/$repo : $($_.Exception.Message)"
    return $false
  } finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  }
}

$NodeVer = if (Have node) { Get-Ver (node -v) } else { $null }
$PnpmVer = if (Have pnpm) { Get-Ver (pnpm -v) } else { $null }

Section 'Entorno'
Write-Host "SO: Windows ($([System.Environment]::OSVersion.VersionString)) | PowerShell $($PSVersionTable.PSVersion)"
Write-Host "node: $(if ($NodeVer) { $NodeVer } else { 'no instalado' }) | pnpm: $(if ($PnpmVer) { $PnpmVer } else { 'no' }) | claude: $(if (Have claude) { 'sí' } else { 'no está en PATH' })"

# ---------- PASO 0: requisitos (cada instalación pide autorización) ----------
Section 'PASO 0 — Requisitos'
function Update-SessionPath {
  # winget actualiza el PATH del sistema, pero no el de esta consola
  $env:Path = (@([Environment]::GetEnvironmentVariable('Path','Machine'), [Environment]::GetEnvironmentVariable('Path','User'), $env:Path) | Where-Object { $_ }) -join ';'
}

# Node.js: Paperclip pide >= 24.11; con eso también alcanza para @playwright/cli.
if (-not $NodeVer -or $NodeVer -lt [version]'24.11.0') {
  $what = if ($NodeVer) { "actualizar Node.js $NodeVer a la versión LTS actual" } else { 'instalar Node.js LTS' }
  Write-Host "  Node.js $(if ($NodeVer) { $NodeVer } else { 'no está instalado' }). Se necesita >= 24.11 para Paperclip (y cualquier versión para @playwright/cli)."
  Write-Host "  Comando: winget install --id OpenJS.NodeJS.LTS -e  (instalador oficial de nodejs.org vía winget)"
  if (-not (Have winget)) {
    Record 'Node.js' 'FALTA REQUISITO' 'winget no está disponible; instala Node LTS desde https://nodejs.org'
  } elseif (Confirm-Step "  ¿Autorizas ${what}?") {
    if ($NodeVer) { winget upgrade --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements }
    else          { winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements }
    Update-SessionPath
    $NodeVer = if (Have node) { Get-Ver (node -v) } else { $null }
    if ($NodeVer -and $NodeVer -ge [version]'24.11.0') { Record 'Node.js' 'OK' "versión $NodeVer" }
    elseif ($NodeVer) { Record 'Node.js' 'REVISAR' "quedó en $NodeVer; abre una consola nueva y vuelve a correr el script" }
    else { Record 'Node.js' 'FALLÓ' 'winget terminó pero node no aparece; abre una consola nueva y vuelve a correr el script' }
  } else {
    Record 'Node.js' 'OMITIDO' 'no autorizado'
  }
} else {
  Record 'Node.js' 'SALTADO' "versión $NodeVer ya cumple"
}

# pnpm (Paperclip pide >= 9.15)
if ($NodeVer -and (-not $PnpmVer -or $PnpmVer -lt [version]'9.15.0')) {
  Write-Host "  pnpm $(if ($PnpmVer) { $PnpmVer } else { 'no está instalado' }). Paperclip pide >= 9.15. Comando: npm i -g pnpm@latest"
  if (Confirm-Step '  ¿Autorizas instalar/actualizar pnpm?') {
    npm i -g pnpm@latest
    $PnpmVer = if (Have pnpm) { Get-Ver (pnpm -v) } else { $null }
    if ($PnpmVer) { Record 'pnpm' 'OK' "versión $PnpmVer" } else { Record 'pnpm' 'FALLÓ' 'npm i -g pnpm falló' }
  } else { Record 'pnpm' 'OMITIDO' 'no autorizado' }
} elseif ($PnpmVer) { Record 'pnpm' 'SALTADO' "versión $PnpmVer ya cumple" }

# CLI de Claude Code (para instalar el plugin agent-skills)
if (-not (Have claude) -and $NodeVer) {
  Write-Host "  La CLI 'claude' no está en el PATH (se usa para instalar el plugin). Comando: npm i -g @anthropic-ai/claude-code"
  if (Confirm-Step "  ¿Autorizas instalar la CLI de Claude Code?") {
    npm i -g '@anthropic-ai/claude-code'
    if (Have claude) { Record 'claude CLI' 'OK' 'instalada' } else { Record 'claude CLI' 'FALLÓ' 'npm i -g @anthropic-ai/claude-code falló' }
  } else { Record 'claude CLI' 'OMITIDO' 'no autorizado' }
}

# Skill con SKILL.md en la raíz del repo -> se descarga directo en skills\<nombre>
function Install-RootSkill($owner, $repo, $name) {
  $dest = Join-Path $SkillsDir $name
  if (Test-Path $dest) { Record $name 'SALTADO' 'ya existe'; return }
  if (Get-RepoZip $owner $repo $dest) { Record $name 'OK' "descargado en skills\$name" } else { Record $name 'FALLÓ' 'no se pudo descargar' }
}

# Repo con skills en subcarpetas -> se descarga en skill-repos\<repo> y cada skill se enlaza con una junction
# (las junctions no requieren admin). $only limita a ciertas skills.
function Install-Nested($owner, $repo, $subdir, [string[]]$only, $label) {
  if (-not $label) { $label = $repo }
  $dest = Join-Path $ReposDir $repo
  if (-not (Test-Path $dest)) {
    if (-not (Get-RepoZip $owner $repo $dest)) { Record $label 'FALLÓ' 'no se pudo descargar'; return }
  }
  $linked = @(); $skipped = @()
  Get-ChildItem -Directory (Join-Path $dest $subdir) |
    Where-Object { (Test-Path (Join-Path $_.FullName 'SKILL.md')) -and (-not $only -or $only -contains $_.Name) } |
    ForEach-Object {
      $target = Join-Path $SkillsDir $_.Name
      if (Test-Path $target) { $skipped += $_.Name }
      else { New-Item -ItemType Junction -Path $target -Target $_.FullName | Out-Null; $linked += $_.Name }
    }
  if ($linked.Count) { Record $label 'OK' ("enlazadas: " + ($linked -join ' ') + $(if ($skipped.Count) { " | ya existían: " + ($skipped -join ' ') })) }
  else { Record $label 'SALTADO' ("ya existían: " + ($skipped -join ' ')) }
}

function Install-Reference($owner, $repo, $note) {
  $dest = Join-Path $ReposDir $repo
  if (Test-Path $dest) { Record $repo 'SALTADO' 'ya existe en skill-repos\'; return }
  if (Get-RepoZip $owner $repo $dest) { Record $repo 'OK (referencia)' $note } else { Record $repo 'FALLÓ' 'no se pudo descargar' }
}

# ---------- PASO 1 ----------
Section 'PASO 1 — Skills (antes vía npx skills; ese CLI usa git, así que se descargan por ZIP)'
Install-Nested 'cloudflare'   'security-audit-skill' 'skills' @('security-audit') 'security-audit'
Install-Nested 'vercel-labs'  'skills'               'skills' @('find-skills')    'find-skills'
Install-Nested 'Jakubantalik' 'transitions.dev'      'skills' @('transitions-dev','transitions-polish') 'transitions-dev'

# `npx transitions-dev add --free` escribe .\transitions\*.md en el directorio actual: es por proyecto.
Record 'transitions-dev add --free' 'OMITIDO' 'es por proyecto: córrelo dentro de cada repo (crea .\transitions\)'

if (Test-Path (Join-Path $SkillsDir 'playwright-cli')) {
  Record '@playwright/cli' 'SALTADO' 'skill playwright-cli ya existe'
} elseif (-not $NodeVer) {
  Record '@playwright/cli' 'FALTA REQUISITO' 'requiere Node.js (no se instaló en el PASO 0)'
} else {
  if (-not (Have playwright-cli)) { npm i -g '@playwright/cli' }   # sin postinstall
  if (Have playwright-cli) {
    Push-Location $HOME
    playwright-cli install --skills -g     # solo copia SKILL.md, no descarga navegadores
    if ($LASTEXITCODE -eq 0) { Record '@playwright/cli' 'OK' 'CLI global + skill playwright-cli' }
    else { Record '@playwright/cli' 'FALLÓ' 'playwright-cli install --skills -g devolvió error' }
    Pop-Location
  } else { Record '@playwright/cli' 'FALLÓ' 'npm i -g @playwright/cli falló' }
}

# ---------- PASO 2 ----------
Section 'PASO 2 — Skills de GitHub (descarga ZIP)'

# Understand-Anything: solo se enlazan las skills; sus hooks de plugin NO quedan activos.
# /understand corre `pnpm install` + build dentro del repo la primera vez que se usa.
Install-Nested 'Egonex-AI' 'Understand-Anything' 'understand-anything-plugin\skills' $null 'understand-anything'
# La skill busca la raíz del plugin en ~\.understand-anything-plugin (entre otras rutas).
$UaRoot = Join-Path $ReposDir 'Understand-Anything\understand-anything-plugin'
$UaLink = Join-Path $HOME '.understand-anything-plugin'
if ((Test-Path $UaRoot) -and -not (Test-Path $UaLink)) { New-Item -ItemType Junction -Path $UaLink -Target $UaRoot | Out-Null }

Install-RootSkill 'zarazhangrui'   'frontend-slides' 'frontend-slides'
Install-Nested    'cathrynlavery'  'diagram-design'  'skills'
Install-RootSkill 'blader'         'humanizer'       'humanizer'
Install-RootSkill 'hardikpandya'   'stop-slop'       'stop-slop'
Install-Reference 'VoltAgent'         'awesome-design-md' 'no es skill: colección de DESIGN.md de marcas'
Install-Reference 'google-labs-code'  'design.md'         'no es skill: spec + CLI → npx @google/design.md lint DESIGN.md'
Install-Nested    'nextlevelbuilder'  'ui-ux-pro-max-skill' '.claude\skills'
Install-Nested    'Leonxlnx'          'taste-skill'         'skills'
# img2threejs no tiene `npm run setup`; scripts en Python 3.10+ stdlib.
Install-RootSkill 'hoainho' 'img2threejs' 'img2threejs'

# ---------- PASO 3 ----------
Section 'PASO 3 — Plugin addyosmani/agent-skills'
# `/plugin marketplace add addyosmani/agent-skills` clona con git. Sin git se arma un marketplace local
# con el repo descargado por ZIP. El plugin no registra hooks.
$AddyMk   = Join-Path $ReposDir 'addy-agent-skills-local'
$AddyRepo = Join-Path $AddyMk 'agent-skills'
if (-not (Have claude)) {
  Record 'agent-skills (plugin)' 'PENDIENTE' "CLI 'claude' no está en PATH"
} elseif ((claude plugin list 2>$null) -match 'agent-skills') {
  Record 'agent-skills (plugin)' 'SALTADO' 'ya instalado'
} else {
  $ok = (Test-Path $AddyRepo) -or (Get-RepoZip 'addyosmani' 'agent-skills' $AddyRepo)
  if (-not $ok) { Record 'agent-skills (plugin)' 'FALLÓ' 'no se pudo descargar' }
  else {
    New-Item -ItemType Directory -Force -Path (Join-Path $AddyMk '.claude-plugin') | Out-Null
    @'
{
  "name": "addy-agent-skills-local",
  "owner": { "name": "Addy Osmani" },
  "plugins": [ { "name": "agent-skills", "source": "./agent-skills", "description": "Production-grade engineering skills (descargado por ZIP)" } ]
}
'@ | Set-Content -Encoding UTF8 (Join-Path $AddyMk '.claude-plugin\marketplace.json')
    claude plugin marketplace add $AddyMk
    if ($LASTEXITCODE -eq 0) { claude plugin install agent-skills@addy-agent-skills-local }
    if ($LASTEXITCODE -eq 0) { Record 'agent-skills (plugin)' 'OK' 'marketplace local addy-agent-skills-local' }
    else { Record 'agent-skills (plugin)' 'FALLÓ' "claude plugin devolvió error (marketplace en $AddyMk)" }
  }
}

# ---------- PASO 4 ----------
Section 'PASO 4 — Everything Claude Code (solo revisión)'
New-Item -ItemType Directory -Force -Path $ReviewDir | Out-Null
$Ecc = Join-Path $ReviewDir 'ecc'
if (Test-Path $Ecc) { Record 'everything-claude-code' 'SALTADO' 'ya está en ~\review\ecc' }
elseif (Get-RepoZip 'affaan-m' 'everything-claude-code' $Ecc) { Record 'everything-claude-code' 'OK (revisión)' 'descargado en ~\review\ecc' }
else { Record 'everything-claude-code' 'FALLÓ' 'no se pudo descargar' }
if (Test-Path $Ecc) {
  $lines = @("# ECC vs ~/.claude ($(Get-Date -Format yyyy-MM-dd))", '')
  foreach ($kind in 'agents','skills','rules') {
    $lines += "## $kind", '', '| nombre | ¿lo tengo? |', '|---|---|'
    Get-ChildItem (Join-Path $Ecc $kind) | Where-Object { $_.BaseName -ne 'README' } | ForEach-Object {
      $n = $_.BaseName
      $has = (Test-Path (Join-Path $ClaudeDir "$kind\$n")) -or (Test-Path (Join-Path $ClaudeDir "$kind\$n.md"))
      $lines += "| $n | $(if ($has) { 'sí' } else { 'no' }) |"
    }
    $lines += ''
  }
  $lines | Set-Content -Encoding UTF8 (Join-Path $ReviewDir 'ecc-vs-mi-claude.md')
}

# ---------- PASO 4b ----------
Section 'PASO 4b — Copiar skills/agents recomendados de ECC'
# Revisados: son solo Markdown, sin scripts, hooks ni comandos de instalación.
$EccSkills = 'seo','marketing-campaign','brand-voice','vite-patterns','react-patterns'
$EccAgents = 'seo-specialist','security-reviewer','silent-failure-hunter'
if (Test-Path $Ecc) {
  $AgentsDir = Join-Path $ClaudeDir 'agents'
  New-Item -ItemType Directory -Force -Path $AgentsDir | Out-Null
  foreach ($s in $EccSkills) {
    $dest = Join-Path $SkillsDir $s
    if (Test-Path $dest) { Record "ecc skill: $s" 'SALTADO' 'ya existe' }
    else {
      try { Copy-Item -Recurse -ErrorAction Stop (Join-Path $Ecc "skills\$s") $dest; Record "ecc skill: $s" 'OK' "copiada a skills\$s" }
      catch { Record "ecc skill: $s" 'FALLÓ' 'no se pudo copiar' }
    }
  }
  foreach ($a in $EccAgents) {
    $dest = Join-Path $AgentsDir "$a.md"
    if (Test-Path $dest) { Record "ecc agent: $a" 'SALTADO' 'ya existe' }
    else {
      try { Copy-Item -ErrorAction Stop (Join-Path $Ecc "agents\$a.md") $dest; Record "ecc agent: $a" 'OK' "copiado a agents\$a.md" }
      catch { Record "ecc agent: $a" 'FALLÓ' 'no se pudo copiar' }
    }
  }
} else { Record 'ecc (copia)' 'FALLÓ' 'no está ~\review\ecc' }

# ---------- PASO 5 ----------
Section 'PASO 5 — Paperclip'
if (-not $NodeVer -or $NodeVer -lt [version]'24.11.0') {
  Record 'paperclip' 'FALTA REQUISITO' "paperclipai requiere Node >= 24.11 (tienes $NodeVer)"
} elseif (-not $PnpmVer -or $PnpmVer -lt [version]'9.15.0') {
  Record 'paperclip' 'FALTA REQUISITO' "requiere pnpm >= 9.15 (tienes $PnpmVer) → corepack enable; corepack prepare pnpm@latest --activate"
} elseif (Test-Path (Join-Path $HOME '.paperclip')) {
  Record 'paperclip' 'SALTADO' '~\.paperclip ya existe'
} else {
  Write-Host @'
  `paperclipai onboard --yes` hace lo siguiente:
   - Descarga paperclipai desde npm (sin postinstall) y corre el asistente con valores por defecto.
   - Crea ~\.paperclip\ (config.json, secretos locales y datos).
   - Usa PostgreSQL embebido (binario @embedded-postgres/windows-x64) con data dir en ~\.paperclip.
   - NO instala servicio de fondo (solo con --install-service).
   - PAPERCLIP_TELEMETRY_DISABLED=1 desactiva la telemetría.
'@
  if (Confirm-Step "  ¿Ejecutar 'npx paperclipai onboard --yes' con telemetría desactivada?") {
    $env:PAPERCLIP_TELEMETRY_DISABLED = '1'
    npx -y paperclipai onboard --yes
    if ($LASTEXITCODE -eq 0) { Record 'paperclip' 'OK' 'onboard completado, telemetría desactivada' } else { Record 'paperclip' 'FALLÓ' 'onboard devolvió error' }
  } else { Record 'paperclip' 'OMITIDO' 'no confirmado por el usuario' }
}

# ---------- PASO 6 ----------
Section 'PASO 6 — Orca'
$OrcaUrl = $null
try {
  $rel = Invoke-RestMethod -UseBasicParsing 'https://api.github.com/repos/stablyai/orca/releases/latest' -Headers @{ 'User-Agent' = 'install-skills' }
  $exe = $rel.assets | Where-Object { $_.name -match '\.(exe|msi)$' } | Select-Object -First 1
  if ($exe) { $OrcaUrl = $exe.browser_download_url; Write-Host "  Instalador $($rel.tag_name): $OrcaUrl" }
  else { Record 'orca' 'LINK' "$($rel.tag_name) sin .exe/.msi → $($rel.html_url)" }
} catch {
  Record 'orca' 'LINK' 'https://github.com/stablyai/orca/releases/latest (no se pudo consultar la API)'
}
if ($OrcaUrl) {
  if (Confirm-Step '  ¿Autorizas descargar y ejecutar el instalador de Orca?') {
    $OrcaFile = Join-Path ([IO.Path]::GetTempPath()) (Split-Path $OrcaUrl -Leaf)
    try {
      Invoke-WebRequest -UseBasicParsing -Uri $OrcaUrl -OutFile $OrcaFile -ErrorAction Stop
      Start-Process -FilePath $OrcaFile -Wait
      Record 'orca' 'OK' "instalador ejecutado ($OrcaFile)"
    } catch { Record 'orca' 'FALLÓ' "no se pudo descargar/ejecutar: $OrcaUrl" }
  } else { Record 'orca' 'LINK' $OrcaUrl }
}

# ---------- PASO 7 ----------
Section 'PASO 7 — Nota de librerías UI en ~\.claude\CLAUDE.md'
$ClaudeMd = Join-Path $ClaudeDir 'CLAUDE.md'
$Mark = '## Librerías UI (no instalar globalmente)'
if ((Test-Path $ClaudeMd) -and (Select-String -Path $ClaudeMd -SimpleMatch $Mark -Quiet)) {
  Record 'CLAUDE.md (librerías UI)' 'SALTADO' 'la nota ya existe'
} else {
  Add-Content -Encoding UTF8 -Path $ClaudeMd -Value @"

$Mark
- Uiverse (uiverse.io): componentes HTML/CSS/Tailwind copy-paste. Usar en sitios estáticos (daibackup.cl, Palletsa).
- Animate UI: en proyectos Next.js con shadcn → ``npx shadcn@latest add @animate-ui/<componente>``
- Vengeance UI (vengenceui.com / github.com/Ashutoshx7/VengenceUI): componentes React animados, copiar desde el sitio.
- Uilora: premium, no instalar sin aprobación.
"@
  Record 'CLAUDE.md (librerías UI)' 'OK' 'nota agregada'
}

# ---------- Resumen ----------
Section 'Resumen'
$Results | Format-Table -AutoSize -Wrap | Out-String -Width 250 | Write-Host
Section 'Skills en ~\.claude\skills'
Get-ChildItem -Name $SkillsDir
Write-Host "`nReinicia Claude Code (cierra y vuelve a abrir 'claude') y ejecuta /skills para ver las skills cargadas."
