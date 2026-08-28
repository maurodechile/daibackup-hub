# Recetas Recharts — daibackup-hub

Bloques listos para pegar, con los tokens de `C` ya aplicados. Los primeros cuatro
son los que el hub ya usa (copialos tal cual para mantener coherencia); el resto son
variantes frecuentes escritas con las mismas convenciones.

Todos asumen que estás dentro de una página y que envolvés en `<Card>`.

## Índice

- [1. Línea multi-serie](#1-línea-multi-serie)
- [2. Área sparkline](#2-área-sparkline)
- [3. Barras agrupadas](#3-barras-agrupadas)
- [4. Donut con leyenda](#4-donut-con-leyenda)
- [5. Barras apiladas](#5-barras-apiladas)
- [6. Barras horizontales (ranking)](#6-barras-horizontales-ranking)
- [7. ComposedChart: barras + línea](#7-composedchart-barras--línea)
- [8. Gauge / anillo de score](#8-gauge--anillo-de-score)
- [9. Estado vacío](#9-estado-vacío)
- [10. Imports](#10-imports)

---

## 1. Línea multi-serie

El gráfico principal del Dashboard. La cabecera de cifras arriba del chart es parte
del patrón: da los totales sin obligar a leer el eje.

```jsx
<Card title="Total Clicks & Impresiones" action={<span style={{fontSize:12,color:C.muted}}>Última semana</span>}>
  <div style={{padding:"12px 20px 20px"}}>
    <div style={{display:"flex",gap:24,marginBottom:12}}>
      {[["Clicks",13956,C.purple],["Impresiones",27219,C.magenta]].map(([k,v])=>(
        <div key={k}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{k}</div>
          <div style={{fontSize:16,fontWeight:900,color:C.ink}}>{v.toLocaleString()}</div>
        </div>
      ))}
    </div>
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={weekData}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
        <XAxis dataKey="day" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
        <Tooltip content={<ChartTip/>}/>
        <Line type="monotone" dataKey="clicks" name="Clicks" stroke={C.purple} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey="impressions" name="Impresiones" stroke={C.magenta} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey="seo" name="SEO Score" stroke={C.blue} strokeWidth={2} dot={false} strokeDasharray="4 2"/>
      </LineChart>
    </ResponsiveContainer>
  </div>
</Card>
```

La tercera serie punteada es la convención para una métrica de referencia o de
distinta unidad. Si las escalas son muy distintas, agregá un eje derecho
(`<YAxis yAxisId="right" orientation="right" .../>` y `yAxisId` en la `<Line>`)
antes de forzar todo a un solo eje.

## 2. Área sparkline

Va dentro de una tarjeta chica, debajo del número grande. Sin ejes, sin grid, sin
tooltip: es una forma, no un gráfico para leer valores.

```jsx
<Card>
  <div style={{padding:"16px 20px"}}>
    <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Visitas Web</div>
    <div style={{fontSize:28,fontWeight:900,color:C.ink}}>3,956</div>
    <div style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:8}}>▲ 2.12% este mes</div>
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={weekData}>
        <Area type="monotone" dataKey="clicks" stroke={C.purple} fill={`${C.purple}18`} strokeWidth={2}/>
      </AreaChart>
    </ResponsiveContainer>
  </div>
</Card>
```

El color del delta lo decide el signo: `C.green` con ▲, `C.red` con ▼.

## 3. Barras agrupadas

```jsx
<Card title="Posts Publicados vs Leads Generados">
  <div style={{padding:"12px 20px 20px"}}>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={monthData} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
        <XAxis dataKey="m" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
        <Tooltip content={<ChartTip/>}/>
        <Bar dataKey="posts" name="Posts" fill={C.blue} radius={[4,4,0,0]}/>
        <Bar dataKey="leads" name="Leads" fill={C.purple} radius={[4,4,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  </div>
</Card>
```

## 4. Donut con leyenda

El hub no usa `<Legend>` de Recharts: arma la leyenda a mano abajo del gráfico
porque así puede mostrar el valor junto al nombre y controlar la tipografía.

```jsx
<Card title="Distribución Tráfico" style={{padding:20}}>
  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
    <PieChart width={140} height={140}>
      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
        {pieData.map(e=><Cell key={e.name} fill={e.color}/>)}
      </Pie>
    </PieChart>
  </div>
  <div style={{display:"flex",justifyContent:"space-around"}}>
    {pieData.map(p=>(
      <div key={p.name} style={{textAlign:"center"}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:p.color,margin:"0 auto 4px"}}/>
        <div style={{fontSize:10,color:C.muted,fontWeight:700}}>{p.name}</div>
        <div style={{fontSize:13,fontWeight:800,color:C.ink}}>{p.value}%</div>
      </div>
    ))}
  </div>
</Card>
```

Este es el único caso donde el hub usa `<PieChart width height>` fijos en vez de
`ResponsiveContainer`: la dona no debe estirarse con la columna. Si querés que sí se
adapte, envolvé en `ResponsiveContainer height={140}` y sacá `width`/`height` del
`PieChart`.

Con `<Tooltip/>` (el default), no `ChartTip`: ver la nota de tooltips en SKILL.md.

## 5. Barras apiladas

Mismo esqueleto que las agrupadas más `stackId` compartido. El `radius` sólo va en
la serie de arriba del stack, si no quedan esquinas redondeadas en el medio.

```jsx
<ResponsiveContainer width="100%" height={180}>
  <BarChart data={monthData} barCategoryGap="35%">
    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
    <XAxis dataKey="m" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <Tooltip content={<ChartTip/>}/>
    <Bar dataKey="posts" name="Posts" stackId="a" fill={C.blue}/>
    <Bar dataKey="leads" name="Leads" stackId="a" fill={C.purple} radius={[4,4,0,0]}/>
  </BarChart>
</ResponsiveContainer>
```

## 6. Barras horizontales (ranking)

Para rankings con etiquetas largas — páginas, keywords, clientes — donde el eje X
vertical no entra. `layout="vertical"` invierte los ejes: el numérico pasa a ser
`XAxis` y el categórico `YAxis`.

```jsx
<ResponsiveContainer width="100%" height={220}>
  <BarChart data={topPages} layout="vertical" barCategoryGap="30%" margin={{left:10}}>
    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
    <XAxis type="number" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <YAxis type="category" dataKey="page" width={140}
           tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <Tooltip content={<ChartTip/>}/>
    <Bar dataKey="clicks" name="Clicks" fill={C.purple} radius={[0,4,4,0]}/>
  </BarChart>
</ResponsiveContainer>
```

Ojo con tres cosas que cambian respecto del vertical: `CartesianGrid` usa
`horizontal={false}` (no `vertical`), el `radius` se corre a la derecha
`[0,4,4,0]`, y el `YAxis` necesita `width` explícito o corta las etiquetas.

## 7. ComposedChart: barras + línea

Cuando conviven un volumen y una tasa (leads y conversión, clicks y CTR). Casi
siempre necesita dos ejes.

```jsx
<ResponsiveContainer width="100%" height={200}>
  <ComposedChart data={monthData} barCategoryGap="35%">
    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
    <XAxis dataKey="m" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <YAxis yAxisId="left" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}/>
    <Tooltip content={<ChartTip/>}/>
    <Bar yAxisId="left" dataKey="posts" name="Posts" fill={C.blue} radius={[4,4,0,0]}/>
    <Line yAxisId="right" type="monotone" dataKey="leads" name="Conversión %" stroke={C.magenta} strokeWidth={2.5} dot={false}/>
  </ComposedChart>
</ResponsiveContainer>
```

`yAxisId` va en cada serie y en cada eje; si te olvidás en una, esa serie se dibuja
contra el eje izquierdo y la escala queda sin sentido.

## 8. Gauge / anillo de score

El hub ya tiene dos variantes propias (`ScoreGauge` en `AEOPage`, `Ring` en
`AuditorPage`) hechas con SVG a mano, no con Recharts. Para un score 0–100 reusá
esas antes de traer `RadialBarChart`: son más livianas y ya tienen la tipografía del
panel. El patrón es un `<circle>` de fondo más otro con `strokeDasharray` /
`strokeDashoffset` calculados sobre la circunferencia.

Color por umbral, que es la convención del hub:

```js
const scoreColor = s => s >= 80 ? C.green : s >= 50 ? C.yellow : C.red;
```

## 9. Estado vacío

Un gráfico sin datos renderiza un rectángulo vacío que parece un bug. Cuando la data
puede venir de una API o de un filtro, cortá antes:

```jsx
{!data.length ? (
  <div style={{padding:"40px 20px",textAlign:"center",fontSize:13,color:C.muted}}>
    Sin datos para este período
  </div>
) : (
  <ResponsiveContainer width="100%" height={180}> ... </ResponsiveContainer>
)}
```

Para el estado de carga usá `<Spinner/>`, que ya existe y toma `C.purple`.

## 10. Imports

Todos los componentes de Recharts se importan en el bloque único del tope de
`src/App.jsx`. Hoy están:

```jsx
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
```

Si usás `ComposedChart`, `ReferenceLine`, `RadialBarChart` o `Brush`, agregalos a
esa lista. Y al revés: `oxlint` marca como warning lo que importes y no uses —
`Legend` ya está en esa situación. No sumes más.
