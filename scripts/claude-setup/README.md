# Setup global de skills para Claude Code (Windows)

Instala las skills y herramientas en `%USERPROFILE%\.claude\skills`. **No necesita Git**: los repos se descargan como ZIP desde GitHub. Si algo ya existe, lo salta. Si un paso falla, sigue con el resto y al final imprime una tabla `herramienta | estado | nota`.

Descarga `install-skills.ps1` y ejecútalo desde la carpeta donde lo dejaste:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-skills.ps1
```

Con `-AssumeYes` acepta la única confirmación que hay (Paperclip).

| Requisito | Para qué | Si falta |
|---|---|---|
| Nada | Skills de GitHub, ECC y la nota en CLAUDE.md | — |
| CLI `claude` en el PATH | Plugin agent-skills | Queda PENDIENTE |
| Node.js (cualquier LTS) | `@playwright/cli` | Queda FALTA REQUISITO |
| Node ≥ 24.11 + pnpm ≥ 9.15 | Paperclip | Queda FALTA REQUISITO |

**Prueba:** lo ejecuté de punta a punta con PowerShell 7.4, dos veces, en un HOME aislado y con un servidor local que imita `codeload.github.com` con los mismos repos. La primera vez instala todo, incluido el plugin; la segunda sale todo `SALTADO`. El entorno de prueba era Linux, así que las junctions se reemplazaron por symlinks y la descarga real desde GitHub no se pudo probar (el proxy la bloquea). En Windows se usan junctions, que no requieren permisos de administrador.

## Estructura que deja

```
~\.claude\skills\<skill>          skills (descarga directa o junction)
~\.claude\skill-repos\<repo>      repos con skills anidadas o de referencia
~\.understand-anything-plugin     junction a la raíz del plugin (la skill lo busca ahí)
~\review\ecc                      Everything Claude Code, solo para revisión
~\review\ecc-vs-mi-claude.md      comparación nombre a nombre con tu ~\.claude
```

Claude Code solo carga skills en `~/.claude/skills/<nombre>/SKILL.md` (un nivel de profundidad). Los repos con skills en subcarpetas se descargan en `skill-repos/` y cada skill se enlaza aparte. Si los descargas tal cual en `skills/`, Claude Code no los carga.

## Qué revisé antes de ejecutar (hooks, postinstall, setup)

| Herramienta | Hallazgo | Qué hace el script |
|---|---|---|
| `skills` (vercel-labs) 1.7 | Sin postinstall, pero **clona con git** y requiere Node ≥ 22.20 | No se usa: las 4 skills (security-audit, find-skills, transitions-dev, transitions-polish) se descargan por ZIP |
| `transitions-dev add --free` | Escribe `./transitions/*.md` en el **directorio actual**, así que es por proyecto y no global | No lo ejecuta. La skill `transitions-dev` ya trae las 18 recetas gratis |
| `@playwright/cli` 0.1.22 | Sin postinstall. `install --skills -g` solo copia un SKILL.md y no descarga navegadores | Lo ejecuta |
| Understand-Anything | Es un plugin con hooks: un PostToolUse de auto-update y un SessionStart que le ordena a Claude regenerar el grafo *"sin pedir confirmación"*. `/understand` corre `pnpm install` + build la primera vez que lo usas | Enlaza solo las skills, así que **los hooks quedan inactivos** |
| img2threejs | **No tiene `npm run setup`**: `package.json` solo trae `test` y `package:check`. Los scripts son Python 3.10+ stdlib | Solo lo descarga. El harness opcional `npx github:img2threejs/img2 install` no se ejecuta |
| ui-ux-pro-max | Las skills traen sus datos y scripts dentro (Python stdlib, sin red) | Enlaza 7 skills. Ojo con los nombres genéricos: `design`, `brand`, `slides` |
| taste-skill | `skill.sh` solo imprime rutas y no instala nada | Enlaza las 13 skills |
| awesome-design-md, design.md | **No son skills**: uno es una colección de DESIGN.md y el otro una spec + CLI | Se descargan como referencia en `skill-repos/` |
| agent-skills (Addy) | `plugin.json` no registra hooks. El propio repo dice que `session-start.sh` no se usa en Claude Code. `/plugin marketplace add` desde GitHub clona con git | Lo descarga por ZIP y arma un marketplace local (`addy-agent-skills-local`) para instalarlo con `claude plugin install` |
| paperclipai | Sin postinstall. **Requiere Node ≥ 24.11** (no 20) y pnpm ≥ 9.15. `onboard --yes` crea `~/.paperclip` con Postgres embebido y no instala servicio. La telemetría se apaga con `PAPERCLIP_TELEMETRY_DISABLED=1` | Revisa los requisitos, muestra esto y pide confirmación |
| Orca | En Windows no hay instalador automático | Consulta la API de releases y te da el link del `.exe`/`.msi` |

## PASO 4: qué vale la pena copiar de Everything Claude Code

ECC trae 68 agents, 293 skills, 94 commands y rules para 22 lenguajes. Esta selección está filtrada según tu trabajo (web estática/React+Vite, ciberseguridad, marketing B2B, email). Para saber qué ya tienes, mira `~/review/ecc-vs-mi-claude.md`, que genera el script.

| Recurso ECC | Tipo | ¿Copiar? | Motivo |
|---|---|---|---|
| `seo` + `seo-specialist` | skill + agent | **Sí** | Auditoría técnica, schema y Core Web Vitals para daibackup.cl. No lo cubre nada de lo que instalas |
| `marketing-campaign` | skill | **Sí** | Campañas completas: landing, secuencias de email y ads. Sirve para captación B2B |
| `brand-voice` | skill | **Sí** | Arma un perfil de voz a partir de tus textos reales. Combina con humanizer/stop-slop |
| `security-reviewer` | agent | **Sí** | Revisión proactiva de input, auth y secretos. Complementa a `security-audit` de Cloudflare, que es más profunda pero manual |
| `silent-failure-hunter` | agent | **Sí** | Encuentra errores tragados y fallbacks malos. Corto y genérico |
| `vite-patterns` + `react-patterns` | skills | **Sí** | daibackup-hub es React + Vite |
| `rules/web` (`design-quality`, `performance`, `security`) | rules | Evaluar | Buenas, pero se cargan siempre. Copia solo `web/security.md` y `web/performance.md` |
| `verification-loop` | skill | Evaluar | Build, lint, tests y diff review antes de entregar. Se solapa con agent-skills de Addy |
| `docker-patterns` / `deployment-patterns` | skills | Evaluar | El repo tiene Dockerfile + nginx. Útil si despliegas seguido |
| `market-research` | skill | Evaluar | Competencia y dimensionamiento. Depende de herramientas de búsqueda |
| `lead-intelligence` | skill | No por ahora | Pretende reemplazar a Apollo, y tú ya tienes el MCP de Apollo conectado |
| `deep-research` | skill | No | Depende de MCPs de firecrawl/exa que no tienes |
| `frontend-slides` | skill | No | Duplicado: ya instalas la original de zarazhangrui |
| `security-review`, `tdd-workflow`, `code-reviewer`, `planner` | varios | No | Duplican skills nativas de Claude Code o de agent-skills de Addy |
| `email-ops`, `chief-of-staff` | skill + agent | No | Muy acoplados al flujo de ECC |
| `hooks/` (memory-persistence, etc.) | hooks | **No** | Ejecutan comandos en cada sesión y en cada tool call, y requieren el instalador de ECC. No calzan con tu regla de "no hooks sin revisar" |
| Rules de otros lenguajes (Go, Rust, Java, Kotlin…) y skills de nicho (DeFi, healthcare, trading) | — | No | Fuera de tu stack |

El paso **4b** del script copia las filas marcadas **Sí** (si ya existen, las salta):
- Skills en `~/.claude/skills/`: `seo`, `marketing-campaign`, `brand-voice`, `vite-patterns`, `react-patterns`
- Agents en `~/.claude/agents/`: `seo-specialist`, `security-reviewer`, `silent-failure-hunter`

Revisé los 8 antes de agregarlos: son solo Markdown, sin scripts, hooks ni comandos de instalación. `react-patterns` menciona otras skills de ECC que no se copian; esas referencias solo quedan sin destino. Los 3 agents vienen con `model: sonnet` y con un bloque "Prompt Defense Baseline" que les prohíbe generar contenido de exploits o ataques. Para revisar código sirven, pero para trabajo de pentest usa tus skills de ciberseguridad.

Las filas "Evaluar" no se copian; se copian a mano, por ejemplo: `Copy-Item ~\review\ecc\rules\web\security.md ~\.claude\rules\`.

## Después de correrlo

1. Reinicia Claude Code (cierra y vuelve a abrir `claude`).
2. Ejecuta `/skills` para ver las skills cargadas y `/plugin` para confirmar agent-skills.
3. `npx transitions-dev add --free` se corre dentro de cada proyecto donde quieras las recetas en `./transitions/`.
