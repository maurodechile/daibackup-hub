---
name: daibackup-hub-charts
description: Construir, editar y extender gráficos Recharts, tarjetas de métricas y páginas del dashboard en el repo daibackup-hub (src/App.jsx). Usar SIEMPRE que se pida agregar o modificar un gráfico, chart, línea, barra, dona, torta, sparkline, KPI, métrica, tarjeta, panel, tabla o página nueva del hub — y también cuando se pida "mostrar estos datos", "graficar", "un panel de", "una vista de" o "agregar una sección" dentro de este proyecto, aunque no se nombre Recharts ni el archivo. Contiene las convenciones exactas de tokens de color, ejes, tooltips y navegación que el hub ya usa; sin ellas el resultado se ve fuera de lugar.
---

# DaiBackup Hub — gráficos y páginas

## Qué es este proyecto

`daibackup-hub` es el panel interno de marketing de DaiBackup: React 19 + Vite 8, con
Recharts 3.9 para toda la visualización. Lo importante y poco habitual es que
**la aplicación entera vive en un solo archivo, `src/App.jsx`** (~1600 líneas).

No hay router ni CSS modules ni Tailwind. Todo el estilo es inline vía objetos JS:
`src/index.css` sólo trae tres reglas de reset y la fuente, `src/App.css` quedó
vacío y no se importa, y el resto de lo global es un `<style>` embebido dentro de
`App()` (scrollbar y keyframes `spin`/`fadeIn`). Mantener el hub en un archivo que
se lee de arriba a abajo es lo que lo hace rápido de editar — no lo partas en
módulos, no introduzcas una librería de estilos ni un router salvo que Mauro lo pida
explícitamente.

`src/App.jsx` está organizado en bloques marcados con comentarios de sección:

```
// ── TOKENS ──────────  el objeto C con toda la paleta
   sidebarItems         menú secundario
// ── MOCK DATA ───────  weekData, monthData, pieData, tableData, updates
// ── HELPERS ─────────  callAI()
// ── SMALL COMPONENTS ─ StatusBadge, Btn, Spinner
// ── METRIC CARD ─────  MetricCard
// ── CARD WRAPPER ────  Card
// ── INPUT / TEXTAREA ─ Field
// ── TOOLTIP CUSTOM ──  ChartTip
   páginas               SEOPage, ContentPage, CalendarPage, AEOPage,
                         AEOToolkit, AuditorPage, DesignPage, OverviewPage
// ── APP SHELL ───────  export default function App()
```

Cuando agregues algo, ubicalo en el bloque que le corresponde en vez de pegarlo al
final: quien lea el archivo después espera encontrar los datos arriba y las páginas
juntas.

## Las tres reglas que no se negocian

**1. Los colores salen del objeto `C`, nunca de un hex suelto.**
`C` está al principio del archivo y define `bg, surface, border, ink, muted, faint,
purple, magenta, green, blue, orange, red, teal, yellow` más los acentos de tarjeta
`card1`–`card4` (cada uno con `bg`, `text`, `icon`). El morado→magenta es la
identidad de DaiBackup; un `#8b5cf6` improvisado rompe la coherencia visual de todo
el panel. Si necesitás un color que no está, agregalo a `C` primero y usalo desde
ahí.

Para transparencias, el hub usa sufijos hex de alfa sobre el token:
`${C.purple}18` (fondo de área), `${C.purple}12` (item activo del sidebar),
`${C.purple}44` (sombra de botón). Seguí ese patrón en vez de `rgba()`.

**2. Todo gráfico va dentro de `<Card>` y de un `ResponsiveContainer` con altura numérica.**
`Card` no trae padding propio salvo el del título, así que el contenido se envuelve
en `<div style={{padding:"12px 20px 20px"}}>`. `ResponsiveContainer` con
`width="100%"` necesita que vos le des `height` en píxeles — si le ponés `height="100%"`
dentro de un flex sin altura fija, el gráfico colapsa a 0 y se ve como si no
renderizara nada. Alturas que el hub ya usa: `180` para gráficos principales,
`100` para mini, `60` para sparklines.

**3. Los ejes se ven "limpios": sin líneas de eje ni ticks.**
Esa es la firma visual del panel. Copiá exactamente:

```jsx
<CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
<XAxis dataKey="day" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
<YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
```

## Tooltips: cuándo `ChartTip` y cuándo el default

`ChartTip` es el tooltip oscuro de la casa y recibe `label` (la categoría del eje X).
Funciona en gráficos cartesianos — línea, barra, área — y ahí siempre se usa:

```jsx
<Tooltip content={<ChartTip/>}/>
```

En `PieChart` no hay eje X, así que `label` llega vacío y el encabezado del tooltip
sale en blanco. Por eso los donuts del hub usan el `<Tooltip/>` por defecto de
Recharts. Si querés un tooltip de la casa en un pie, pasale a `ChartTip` el nombre
desde el payload en vez de `label`.

## Recetas por tipo de gráfico

Las variantes que el hub ya usa (línea multi-serie, área sparkline, barras
agrupadas, donut con leyenda) están en **`references/recetas-recharts.md`** junto a
las que todavía no existen pero se piden seguido (barras apiladas, horizontales,
ComposedChart, gauge radial, y el caso de datos vacíos). Leé ese archivo cuando
vayas a escribir un gráfico concreto — tiene los bloques listos para pegar con los
tokens ya aplicados.

Convenciones que valen para todos, y el porqué:

- `<Line>` va con `strokeWidth={2.5}` y `dot={false}`. Los puntos ensucian series
  densas; la serie de referencia o proyección se distingue con `strokeDasharray="4 2"`
  y `strokeWidth={2}`.
- `<Bar>` va con `radius={[4,4,0,0]}` y el `BarChart` con `barCategoryGap="35%"`.
  Las barras finas y redondeadas arriba son lo que hace que el panel no parezca una
  planilla.
- `<Pie>` va con `innerRadius`/`outerRadius` (siempre dona, nunca torta llena) y
  `paddingAngle={2}` o `{3}`. Los colores salen de la propia data —
  `pieData` trae un campo `color` por item — y se aplican mapeando `<Cell>`.
  Usá `key={e.name}` en vez de `key={i}`: los índices se rompen si después filtrás
  la serie.
- El orden de las series importa: la métrica principal en `C.purple`, la secundaria
  en `C.magenta`, y de ahí `C.blue`, `C.teal`, `C.orange`.

## Agregar datos

Los datos son mock y viven en el bloque `// ── MOCK DATA`. Un array de objetos
planos, una clave por serie, más la clave categórica que va al `dataKey` del `XAxis`:

```js
const uptimeData = [
  { mes: "Ene", uptime: 99.8, incidentes: 2 },
  { mes: "Feb", uptime: 99.9, incidentes: 1 },
];
```

El `dataKey` es un string y Recharts no avisa si no coincide: un `dataKey="Uptime"`
contra una clave `uptime` renderiza el gráfico vacío, sin error en consola. Cuando
un gráfico salga en blanco, revisá primero esa coincidencia (y después la altura del
contenedor).

Si los datos van a venir de una API real, dejá el array mock como fallback y cargá
con `useState` + `useEffect` dentro de la página; `useEffect` ya está importado.

## Agregar una página nueva al hub

La navegación es un `useState` con un string, no un router. Agregar una sección son
**cuatro ediciones** y olvidarse de una deja el menú inconsistente:

1. **El componente**, junto a las otras páginas, antes de `// ── APP SHELL`:
   ```jsx
   const UptimePage = () => { ... };
   ```
2. **`navMap`** dentro de `App()` — alimenta el breadcrumb:
   ```js
   uptime: { label:"Uptime & SLA", icon:"📈" },
   ```
3. **El array de nav principal** en el `<nav>` del sidebar:
   ```js
   {id:"uptime",icon:"📈",label:"Uptime & SLA"},
   ```
4. **El render condicional** al final de `<main>`:
   ```jsx
   {active==="uptime" && <UptimePage/>}
   ```

Los `id` de los tres últimos puntos tienen que ser el mismo string. Si la página
necesita mandar al usuario a otra sección (como hace `OverviewPage` con sus
acciones rápidas), recibí `setActive` por props.

`sidebarItems` es otra cosa: es el menú decorativo de "Más Secciones" y sus items no
navegan a ningún lado. No agregues ahí una página real.

## Layout

El hub arma las filas con grid inline y `gap:14`, no con flex ni con una grilla de
12 columnas:

```jsx
<div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>   // gráfico + columna lateral
<div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14}}>   // tabla + novedades
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>  // fila de KPIs
```

Y la página entera es una columna: `{display:"flex",flexDirection:"column",gap:20}`.

Las filas de KPI van con `MetricCard`, que espera `label, value, sub, icon, accent`
(un `C.card1`–`C.card4`) y opcionalmente `change` (número; el signo decide la
flecha ▲/▼). Cuatro por fila, cada una con un acento distinto.

## Antes de dar algo por terminado

```bash
npm run lint    # oxlint
npm run build   # vite build
```

`lint` arranca con **5 warnings preexistentes** en `src/App.jsx` (imports y
variables sin usar en las líneas 1, 5, 484, 724, 1333). No son tuyos y no hace
falta arreglarlos salvo que te lo pidan; lo que sí importa es no sumar warnings
nuevos. El caso más fácil de provocar: importar un componente de Recharts
—`Legend`, `ReferenceLine`— y no terminar usándolo. Importá sólo lo que vas a
renderizar.

`build` tira un warning de chunk >500 kB. Es conocido y esperable con Recharts
adentro de un bundle único; no lo persigas.

Si podés levantar el dev server (`npm run dev`) y mirar la sección que tocaste,
mejor: los gráficos con altura mal resuelta compilan perfecto y se ven vacíos.
