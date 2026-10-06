#!/usr/bin/env bash
# Instalador global de skills/herramientas para Claude Code (macOS / Linux).
# Reglas:
#   - Si una skill/repo ya existe, se salta.
#   - No ejecuta hooks, postinstall ni setups de terceros sin mostrar qué hacen y pedir confirmación.
#   - Si algo falla, sigue con lo demás y al final imprime una tabla herramienta | estado | nota.
# Uso:  bash install-skills.sh            (interactivo)
#       ASSUME_YES=1 bash install-skills.sh   (acepta todas las confirmaciones)
# Compatible con bash 3.2 (macOS por defecto).

set -u

CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
REPOS_DIR="$CLAUDE_DIR/skill-repos"   # repos con varias skills anidadas: se clonan aquí y se enlazan a skills/
REVIEW_DIR="$HOME/review"
ASSUME_YES="${ASSUME_YES:-0}"

mkdir -p "$SKILLS_DIR" "$REPOS_DIR"

# ---------- utilidades ----------
RESULTS=""
record() { RESULTS="${RESULTS}$1|$2|$3"$'\n'; printf '  -> [%s] %s — %s\n' "$2" "$1" "$3"; }
section() { printf '\n==== %s ====\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

confirm() {  # confirm "pregunta"
  [ "$ASSUME_YES" = "1" ] && return 0
  printf '%s [s/N] ' "$1"
  read -r ans </dev/tty || return 1
  case "$ans" in s|S|si|SI|y|Y|yes) return 0 ;; *) return 1 ;; esac
}

# version_ge "22.22.0" "22.20.0" -> true si $1 >= $2
version_ge() {
  [ "$(printf '%s\n%s\n' "$2" "$1" | sort -t. -k1,1n -k2,2n -k3,3n | head -1)" = "$2" ]
}

case "$(uname -s)" in
  Darwin) OS=mac ;;
  Linux)  OS=linux ;;
  *)      OS=other ;;
esac

NODE_VER=""; have node && NODE_VER="$(node -v | sed 's/^v//')"
PNPM_VER=""; have pnpm && PNPM_VER="$(pnpm -v 2>/dev/null)"

section "Entorno"
echo "SO: $OS ($(uname -sr))"
echo "node: ${NODE_VER:-no instalado} | npm: $(npm -v 2>/dev/null || echo no) | pnpm: ${PNPM_VER:-no} | git: $(git --version 2>/dev/null | awk '{print $3}')"
have git || { echo "ERROR: git es obligatorio."; exit 1; }

# ---------- PASO 1: skills vía CLI ----------
section "PASO 1 — Skills vía CLI"

skills_cli_ok=0
if [ -n "$NODE_VER" ] && version_ge "$NODE_VER" "22.20.0"; then skills_cli_ok=1; fi

skills_add() {  # skills_add <nombre-skill> <fuente> [args extra]
  local name="$1" src="$2"; shift 2
  if [ -e "$SKILLS_DIR/$name" ]; then record "$name" "SALTADO" "ya existe en $SKILLS_DIR/$name"; return; fi
  if [ "$skills_cli_ok" != 1 ]; then record "$name" "FALLÓ" "npx skills requiere Node >= 22.20 (tienes ${NODE_VER:-ninguno})"; return; fi
  if npx -y skills add "$src" "$@" -g -a claude-code -y; then
    if [ -e "$SKILLS_DIR/$name" ]; then record "$name" "OK" "vía npx skills"; else record "$name" "REVISAR" "el CLI terminó pero no aparece $SKILLS_DIR/$name"; fi
  else
    record "$name" "FALLÓ" "npx skills add devolvió error"
  fi
}

skills_add security-audit     https://github.com/cloudflare/security-audit-skill --skill security-audit
skills_add find-skills        vercel-labs/skills --skill find-skills
skills_add transitions-dev    Jakubantalik/transitions.dev --skill transitions-dev
skills_add transitions-polish Jakubantalik/transitions.dev --skill transitions-polish

# `npx transitions-dev add --free` escribe ./transitions/*.md en el directorio ACTUAL (es por proyecto, no global).
# La skill transitions-dev ya trae las 18 recetas gratis como referencia, así que aquí no se ejecuta.
record "transitions-dev add --free" "OMITIDO" "es por proyecto: córrelo dentro de cada repo (crea ./transitions/)"

if [ -e "$SKILLS_DIR/playwright-cli" ]; then
  record "@playwright/cli" "SALTADO" "skill playwright-cli ya existe"
else
  if ! have playwright-cli; then
    # El paquete no tiene postinstall (solo script 'test'); dependencias: playwright y playwright-core.
    npm i -g @playwright/cli || record "@playwright/cli" "FALLÓ" "npm i -g falló (¿permisos? usa un prefix de usuario o nvm)"
  fi
  if have playwright-cli; then
    # 'install --skills -g' solo copia SKILL.md a ~/.claude/skills/playwright-cli (no descarga navegadores).
    if (cd "$HOME" && playwright-cli install --skills -g); then
      record "@playwright/cli" "OK" "CLI global + skill playwright-cli"
    else
      record "@playwright/cli" "FALLÓ" "playwright-cli install --skills -g devolvió error"
    fi
  fi
fi

# ---------- PASO 2: skills vía git clone ----------
section "PASO 2 — Skills vía git clone --depth 1"

clone_root_skill() {  # repo con SKILL.md en la raíz -> se clona directo en skills/<nombre>
  local url="$1" name="$2"
  if [ -e "$SKILLS_DIR/$name" ]; then record "$name" "SALTADO" "ya existe"; return; fi
  if git clone -q --depth 1 "$url" "$SKILLS_DIR/$name"; then
    record "$name" "OK" "clonado en skills/$name"
  else
    record "$name" "FALLÓ" "git clone falló"
  fi
}

clone_nested() {  # repo con skills en subcarpetas -> clon en skill-repos/ + symlink de cada skill a skills/
  local url="$1" repo="$2" subdir="$3"
  local dest="$REPOS_DIR/$repo"
  if [ ! -d "$dest" ]; then
    git clone -q --depth 1 "$url" "$dest" || { record "$repo" "FALLÓ" "git clone falló"; return 1; }
  fi
  local linked="" skipped=""
  for d in "$dest/$subdir"/*/; do
    [ -f "$d/SKILL.md" ] || continue
    local s; s="$(basename "$d")"
    if [ -e "$SKILLS_DIR/$s" ]; then skipped="$skipped $s"; continue; fi
    ln -s "${d%/}" "$SKILLS_DIR/$s" && linked="$linked $s"
  done
  if [ -n "$linked" ]; then record "$repo" "OK" "enlazadas:${linked}${skipped:+ | ya existían:$skipped}"
  else record "$repo" "SALTADO" "todas sus skills ya existían:${skipped:- (ninguna encontrada)}"; fi
}

clone_reference() {  # repo que NO es una skill -> se deja en skill-repos/ como referencia
  local url="$1" repo="$2" note="$3"
  if [ -d "$REPOS_DIR/$repo" ]; then record "$repo" "SALTADO" "ya existe en skill-repos/"; return; fi
  if git clone -q --depth 1 "$url" "$REPOS_DIR/$repo"; then record "$repo" "OK (referencia)" "$note"
  else record "$repo" "FALLÓ" "git clone falló"; fi
}

# Understand-Anything es un plugin (skills + agents + hooks). Se enlazan solo las skills: sus hooks
# (PostToolUse auto-update y un SessionStart que ordena regenerar el grafo "sin pedir confirmación")
# NO quedan activos. Ojo: /understand ejecuta `pnpm install` + build dentro del repo la primera vez.
clone_nested https://github.com/Egonex-AI/Understand-Anything understand-anything understand-anything-plugin/skills
# La skill busca la raíz del plugin en ~/.understand-anything-plugin (entre otras rutas).
if [ -d "$REPOS_DIR/understand-anything/understand-anything-plugin" ] && [ ! -e "$HOME/.understand-anything-plugin" ]; then
  ln -s "$REPOS_DIR/understand-anything/understand-anything-plugin" "$HOME/.understand-anything-plugin"
fi

clone_root_skill https://github.com/zarazhangrui/frontend-slides frontend-slides
clone_nested     https://github.com/cathrynlavery/diagram-design diagram-design skills
clone_root_skill https://github.com/blader/humanizer humanizer
clone_root_skill https://github.com/hardikpandya/stop-slop stop-slop

clone_reference https://github.com/VoltAgent/awesome-design-md awesome-design-md \
  "no es skill: colección de DESIGN.md de marcas para copiar a proyectos"
clone_reference https://github.com/google-labs-code/design.md design.md \
  "no es skill: spec + CLI → npx @google/design.md lint DESIGN.md"

# ui-ux-pro-max trae sus skills autocontenidas (data/ + scripts/ en Python stdlib) en .claude/skills/
clone_nested https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ui-ux-pro-max-skill .claude/skills
clone_nested https://github.com/Leonxlnx/taste-skill taste-skill skills

# img2threejs: NO tiene `npm run setup` (package.json solo define 'test' y 'package:check').
# Sus scripts son Python 3.10+ stdlib. El harness opcional `npx github:img2threejs/img2 install` NO se ejecuta.
clone_root_skill https://github.com/hoainho/img2threejs img2threejs

# ---------- PASO 3: plugin agent-skills (Addy Osmani) ----------
section "PASO 3 — Plugin addyosmani/agent-skills"
# El plugin.json no registra hooks (hooks/session-start.sh existe pero el propio repo dice que NO se cablea en Claude Code).
if have claude; then
  if claude plugin list 2>/dev/null | grep -q 'agent-skills'; then
    record "agent-skills (plugin)" "SALTADO" "ya instalado"
  elif claude plugin marketplace add addyosmani/agent-skills && claude plugin install agent-skills@addy-agent-skills; then
    record "agent-skills (plugin)" "OK" "marketplace addy-agent-skills"
  else
    record "agent-skills (plugin)" "FALLÓ" "hazlo a mano: /plugin marketplace add addyosmani/agent-skills  y  /plugin install agent-skills@addy-agent-skills"
  fi
else
  record "agent-skills (plugin)" "PENDIENTE" "CLI 'claude' no está en PATH; dentro de Claude Code: /plugin marketplace add addyosmani/agent-skills → /plugin install agent-skills@addy-agent-skills"
fi

# ---------- PASO 4: Everything Claude Code (solo revisión) ----------
section "PASO 4 — Everything Claude Code (solo revisión, NO se instala)"
mkdir -p "$REVIEW_DIR"
if [ -d "$REVIEW_DIR/ecc" ]; then
  record "everything-claude-code" "SALTADO" "ya clonado en ~/review/ecc"
elif git clone -q --depth 1 https://github.com/affaan-m/everything-claude-code "$REVIEW_DIR/ecc"; then
  record "everything-claude-code" "OK (revisión)" "clonado en ~/review/ecc — no se copió nada"
else
  record "everything-claude-code" "FALLÓ" "git clone falló"
fi
if [ -d "$REVIEW_DIR/ecc" ]; then
  REPORT="$REVIEW_DIR/ecc-vs-mi-claude.md"
  {
    echo "# ECC vs ~/.claude ($(date +%F))"
    echo
    for kind in agents skills rules; do
      echo "## $kind"
      echo
      echo "| nombre | ¿lo tengo? |"
      echo "|---|---|"
      for p in "$REVIEW_DIR/ecc/$kind"/*; do
        n="$(basename "$p" .md)"
        [ "$n" = "README" ] && continue
        if [ -e "$CLAUDE_DIR/$kind/$n" ] || [ -e "$CLAUDE_DIR/$kind/$n.md" ]; then echo "| $n | sí |"; else echo "| $n | no |"; fi
      done
      echo
    done
  } > "$REPORT"
  echo "  Comparación nombre a nombre: $REPORT (la recomendación curada está en el README de este script)"
fi

# ---------- PASO 4b: copiar lo recomendado de ECC ----------
section "PASO 4b — Copiar skills/agents recomendados de ECC"
# Revisados: son solo Markdown, sin scripts, hooks ni comandos de instalación.
ECC_SKILLS="seo marketing-campaign brand-voice vite-patterns react-patterns"
ECC_AGENTS="seo-specialist security-reviewer silent-failure-hunter"
if [ -d "$REVIEW_DIR/ecc" ]; then
  mkdir -p "$CLAUDE_DIR/agents"
  for s in $ECC_SKILLS; do
    if [ -e "$SKILLS_DIR/$s" ]; then record "ecc skill: $s" "SALTADO" "ya existe"
    elif cp -R "$REVIEW_DIR/ecc/skills/$s" "$SKILLS_DIR/$s"; then record "ecc skill: $s" "OK" "copiada a skills/$s"
    else record "ecc skill: $s" "FALLÓ" "no se pudo copiar"; fi
  done
  for a in $ECC_AGENTS; do
    if [ -e "$CLAUDE_DIR/agents/$a.md" ]; then record "ecc agent: $a" "SALTADO" "ya existe"
    elif cp "$REVIEW_DIR/ecc/agents/$a.md" "$CLAUDE_DIR/agents/$a.md"; then record "ecc agent: $a" "OK" "copiado a agents/$a.md"
    else record "ecc agent: $a" "FALLÓ" "no se pudo copiar"; fi
  done
else
  record "ecc (copia)" "FALLÓ" "no está ~/review/ecc"
fi

# ---------- PASO 5: Paperclip ----------
section "PASO 5 — Paperclip"
# Requisitos reales del paquete paperclipai publicado: Node >= 24.11 (no 20) y pnpm >= 9.15.
if [ -z "$NODE_VER" ] || ! version_ge "$NODE_VER" "24.11.0"; then
  record "paperclip" "FALTA REQUISITO" "paperclipai requiere Node >= 24.11 (tienes ${NODE_VER:-ninguno})"
elif [ -z "$PNPM_VER" ] || ! version_ge "$PNPM_VER" "9.15.0"; then
  record "paperclip" "FALTA REQUISITO" "requiere pnpm >= 9.15 (tienes ${PNPM_VER:-ninguno}) → corepack enable && corepack prepare pnpm@latest --activate"
elif [ -d "$HOME/.paperclip" ]; then
  record "paperclip" "SALTADO" "~/.paperclip ya existe (onboard previo)"
else
  cat <<'EOF'
  `paperclipai onboard --yes` hace lo siguiente:
   - Descarga paperclipai desde npm (sin postinstall) y corre el asistente de primera configuración con valores por defecto.
   - Crea ~/.paperclip/ (config.json, secretos locales y datos).
   - Usa PostgreSQL embebido (binario @embedded-postgres para tu SO) con su data dir dentro de ~/.paperclip.
   - NO instala servicio de fondo (eso solo con --install-service).
   - PAPERCLIP_TELEMETRY_DISABLED=1 desactiva el envío de telemetría.
EOF
  if confirm "  ¿Ejecutar 'PAPERCLIP_TELEMETRY_DISABLED=1 npx paperclipai onboard --yes'?"; then
    if PAPERCLIP_TELEMETRY_DISABLED=1 npx -y paperclipai onboard --yes; then record "paperclip" "OK" "onboard completado, telemetría desactivada"
    else record "paperclip" "FALLÓ" "onboard devolvió error"; fi
  else
    record "paperclip" "OMITIDO" "no confirmado por el usuario"
  fi
fi

# ---------- PASO 6: Orca ----------
section "PASO 6 — Orca"
if [ "$OS" = mac ]; then
  if [ -d "/Applications/Orca.app" ] || (have brew && brew list --cask orca >/dev/null 2>&1); then
    record "orca" "SALTADO" "ya instalado"
  elif have brew; then
    if brew install --cask stablyai/orca/orca; then record "orca" "OK" "brew cask"; else record "orca" "FALLÓ" "brew install falló"; fi
  else
    record "orca" "FALLÓ" "Homebrew no instalado"
  fi
else
  record "orca" "MANUAL" "descarga desde https://github.com/stablyai/orca/releases/latest"
fi

# ---------- PASO 7: nota de librerías UI en CLAUDE.md ----------
section "PASO 7 — Nota de librerías UI en ~/.claude/CLAUDE.md"
MARK="## Librerías UI (no instalar globalmente)"
if [ -f "$CLAUDE_DIR/CLAUDE.md" ] && grep -qF "$MARK" "$CLAUDE_DIR/CLAUDE.md"; then
  record "CLAUDE.md (librerías UI)" "SALTADO" "la nota ya existe"
else
  cat >> "$CLAUDE_DIR/CLAUDE.md" <<'EOF'

## Librerías UI (no instalar globalmente)
- Uiverse (uiverse.io): componentes HTML/CSS/Tailwind copy-paste. Usar en sitios estáticos (daibackup.cl, Palletsa).
- Animate UI: en proyectos Next.js con shadcn → `npx shadcn@latest add @animate-ui/<componente>`
- Vengeance UI (vengenceui.com / github.com/Ashutoshx7/VengenceUI): componentes React animados, copiar desde el sitio.
- Uilora: premium, no instalar sin aprobación.
EOF
  record "CLAUDE.md (librerías UI)" "OK" "nota agregada"
fi

# ---------- Resumen ----------
section "Resumen"
{
  echo "HERRAMIENTA|ESTADO|NOTA"
  printf '%s' "$RESULTS"
} | column -t -s '|' 2>/dev/null || { echo "HERRAMIENTA|ESTADO|NOTA"; printf '%s' "$RESULTS"; }

section "Skills en ~/.claude/skills"
ls -1 "$SKILLS_DIR"
echo
echo "Reinicia Claude Code (cierra y vuelve a abrir 'claude') y ejecuta /skills para ver las skills cargadas."
