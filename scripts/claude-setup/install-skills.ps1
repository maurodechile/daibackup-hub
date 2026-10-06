# Instalador global de skills/herramientas para Claude Code (Windows / PowerShell 5.1+ o 7+).
# Mismas reglas que install-skills.sh:
#   - Si una skill/repo ya existe, se salta.
#   - No ejecuta hooks, postinstall ni setups de terceros sin mostrar qué hacen y pedir confirmación.
#   - Si algo falla, sigue y al final imprime la tabla herramienta | estado | nota.
# Uso:  powershell -ExecutionPolicy Bypass -File .\install-skills.ps1
#       powershell -ExecutionPolicy Bypass -File .\install-skills.ps1 -AssumeYes
param([switch]$AssumeYes)

$ErrorActionPreference = 'Continue'
$ClaudeDir = Join-Path $HOME '.claude'
$SkillsDir = Join-Path $ClaudeDir 'skills'
$ReposDir  = Join-Path $ClaudeDir 'skill-repos'
$ReviewDir = Join-Path $HOME 'review'
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

$NodeVer = if (Have node) { Get-Ver (node -v) } else { $null }
$PnpmVer = if (Have pnpm) { Get-Ver (pnpm -v) } else { $null }

Section 'Entorno'
Write-Host "SO: Windows ($([System.Environment]::OSVersion.VersionString))"
Write-Host "node: $NodeVer | pnpm: $PnpmVer | git: $(if (Have git) { (git --version) } else { 'no' })"
if (-not (Have git)) { Write-Host 'ERROR: git es obligatorio (winget install Git.Git).'; exit 1 }

# ---------- PASO 1 ----------
Section 'PASO 1 — Skills vía CLI'
$SkillsCliOk = $NodeVer -and ($NodeVer -ge [version]'22.20.0')

function Skills-Add($name, $src, [string[]]$extra) {
  if (Test-Path (Join-Path $SkillsDir $name)) { Record $name 'SALTADO' 'ya existe'; return }
  if (-not $SkillsCliOk) { Record $name 'FALLÓ' "npx skills requiere Node >= 22.20 (tienes $NodeVer)"; return }
  & npx -y skills add $src @extra -g -a claude-code -y
  if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $SkillsDir $name))) { Record $name 'OK' 'vía npx skills' }
  elseif ($LASTEXITCODE -eq 0) { Record $name 'REVISAR' "el CLI terminó pero no aparece skills\$name" }
  else { Record $name 'FALLÓ' 'npx skills add devolvió error' }
}

Skills-Add 'security-audit'     'https://github.com/cloudflare/security-audit-skill' @('--skill','security-audit')
Skills-Add 'find-skills'        'vercel-labs/skills'           @('--skill','find-skills')
Skills-Add 'transitions-dev'    'Jakubantalik/transitions.dev' @('--skill','transitions-dev')
Skills-Add 'transitions-polish' 'Jakubantalik/transitions.dev' @('--skill','transitions-polish')

# `npx transitions-dev add --free` escribe .\transitions\*.md en el directorio actual: es por proyecto.
Record 'transitions-dev add --free' 'OMITIDO' 'es por proyecto: córrelo dentro de cada repo (crea .\transitions\)'

if (Test-Path (Join-Path $SkillsDir 'playwright-cli')) {
  Record '@playwright/cli' 'SALTADO' 'skill playwright-cli ya existe'
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
Section 'PASO 2 — Skills vía git clone --depth 1'

function Clone-RootSkill($url, $name) {
  $dest = Join-Path $SkillsDir $name
  if (Test-Path $dest) { Record $name 'SALTADO' 'ya existe'; return }
  git clone -q --depth 1 $url $dest
  if ($LASTEXITCODE -eq 0) { Record $name 'OK' "clonado en skills\$name" } else { Record $name 'FALLÓ' 'git clone falló' }
}

# Repos con skills anidadas: clon en skill-repos\ + junction por skill (las junctions no requieren admin).
function Clone-Nested($url, $repo, $subdir) {
  $dest = Join-Path $ReposDir $repo
  if (-not (Test-Path $dest)) {
    git clone -q --depth 1 $url $dest
    if ($LASTEXITCODE -ne 0) { Record $repo 'FALLÓ' 'git clone falló'; return }
  }
  $linked = @(); $skipped = @()
  Get-ChildItem -Directory (Join-Path $dest $subdir) | Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') } | ForEach-Object {
    $target = Join-Path $SkillsDir $_.Name
    if (Test-Path $target) { $skipped += $_.Name }
    else { New-Item -ItemType Junction -Path $target -Target $_.FullName | Out-Null; $linked += $_.Name }
  }
  if ($linked.Count) { Record $repo 'OK' ("enlazadas: " + ($linked -join ' ') + $(if ($skipped.Count) { " | ya existían: " + ($skipped -join ' ') })) }
  else { Record $repo 'SALTADO' ("todas sus skills ya existían: " + ($skipped -join ' ')) }
}

function Clone-Reference($url, $repo, $note) {
  $dest = Join-Path $ReposDir $repo
  if (Test-Path $dest) { Record $repo 'SALTADO' 'ya existe en skill-repos\'; return }
  git clone -q --depth 1 $url $dest
  if ($LASTEXITCODE -eq 0) { Record $repo 'OK (referencia)' $note } else { Record $repo 'FALLÓ' 'git clone falló' }
}

# Understand-Anything: solo se enlazan las skills; sus hooks de plugin NO quedan activos.
# /understand corre `pnpm install` + build dentro del repo la primera vez que se usa.
Clone-Nested    'https://github.com/Egonex-AI/Understand-Anything' 'understand-anything' 'understand-anything-plugin\skills'
# La skill busca la raíz del plugin en ~\.understand-anything-plugin (entre otras rutas).
$UaRoot = Join-Path $ReposDir 'understand-anything\understand-anything-plugin'
$UaLink = Join-Path $HOME '.understand-anything-plugin'
if ((Test-Path $UaRoot) -and -not (Test-Path $UaLink)) { New-Item -ItemType Junction -Path $UaLink -Target $UaRoot | Out-Null }
Clone-RootSkill 'https://github.com/zarazhangrui/frontend-slides' 'frontend-slides'
Clone-Nested    'https://github.com/cathrynlavery/diagram-design' 'diagram-design' 'skills'
Clone-RootSkill 'https://github.com/blader/humanizer' 'humanizer'
Clone-RootSkill 'https://github.com/hardikpandya/stop-slop' 'stop-slop'
Clone-Reference 'https://github.com/VoltAgent/awesome-design-md' 'awesome-design-md' 'no es skill: colección de DESIGN.md de marcas'
Clone-Reference 'https://github.com/google-labs-code/design.md' 'design.md' 'no es skill: spec + CLI → npx @google/design.md lint DESIGN.md'
Clone-Nested    'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill' 'ui-ux-pro-max-skill' '.claude\skills'
Clone-Nested    'https://github.com/Leonxlnx/taste-skill' 'taste-skill' 'skills'
# img2threejs no tiene `npm run setup`; scripts en Python 3.10+ stdlib.
Clone-RootSkill 'https://github.com/hoainho/img2threejs' 'img2threejs'

# ---------- PASO 3 ----------
Section 'PASO 3 — Plugin addyosmani/agent-skills'
if (Have claude) {
  if ((claude plugin list 2>$null) -match 'agent-skills') { Record 'agent-skills (plugin)' 'SALTADO' 'ya instalado' }
  else {
    claude plugin marketplace add addyosmani/agent-skills
    if ($LASTEXITCODE -eq 0) { claude plugin install agent-skills@addy-agent-skills }
    if ($LASTEXITCODE -eq 0) { Record 'agent-skills (plugin)' 'OK' 'marketplace addy-agent-skills' }
    else { Record 'agent-skills (plugin)' 'FALLÓ' 'hazlo a mano: /plugin marketplace add addyosmani/agent-skills → /plugin install agent-skills@addy-agent-skills' }
  }
} else {
  Record 'agent-skills (plugin)' 'PENDIENTE' "CLI 'claude' no está en PATH; usa /plugin marketplace add addyosmani/agent-skills dentro de Claude Code"
}

# ---------- PASO 4 ----------
Section 'PASO 4 — Everything Claude Code (solo revisión)'
New-Item -ItemType Directory -Force -Path $ReviewDir | Out-Null
$Ecc = Join-Path $ReviewDir 'ecc'
if (Test-Path $Ecc) { Record 'everything-claude-code' 'SALTADO' 'ya clonado en ~\review\ecc' }
else {
  git clone -q --depth 1 https://github.com/affaan-m/everything-claude-code $Ecc
  if ($LASTEXITCODE -eq 0) { Record 'everything-claude-code' 'OK (revisión)' 'clonado en ~\review\ecc — no se copió nada' }
  else { Record 'everything-claude-code' 'FALLÓ' 'git clone falló' }
}
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
Section 'PASO 6 — Orca (Windows: solo link, no se instala)'
try {
  $rel = Invoke-RestMethod -UseBasicParsing 'https://api.github.com/repos/stablyai/orca/releases/latest' -Headers @{ 'User-Agent' = 'install-skills' }
  $exe = $rel.assets | Where-Object { $_.name -match '\.(exe|msi)$' } | Select-Object -First 1
  if ($exe) { Record 'orca' 'LINK' "$($rel.tag_name): $($exe.browser_download_url)" }
  else { Record 'orca' 'LINK' "$($rel.tag_name) sin .exe/.msi → $($rel.html_url)" }
} catch {
  Record 'orca' 'LINK' 'https://github.com/stablyai/orca/releases/latest (no se pudo consultar la API)'
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
$Results | Format-Table -AutoSize -Wrap
Section 'Skills en ~\.claude\skills'
Get-ChildItem -Name $SkillsDir
Write-Host "`nReinicia Claude Code (cierra y vuelve a abrir 'claude') y ejecuta /skills para ver las skills cargadas."
