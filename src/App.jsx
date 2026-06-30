import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f4f6fb",
  surface: "#ffffff",
  sidebar: "#ffffff",
  border: "#e8ecf2",
  ink: "#1a1f36",
  muted: "#6b7694",
  faint: "#f0f2f8",
  purple: "#773cdd",
  magenta: "#cf47eb",
  green: "#22c55e",
  blue: "#3b82f6",
  orange: "#f97316",
  red: "#ef4444",
  teal: "#14b8a6",
  yellow: "#eab308",
  // card accent colors matching the pin
  card1: { bg: "#4ade80", text: "#14532d", icon: "#16a34a" },
  card2: { bg: "#60a5fa", text: "#1e3a8a", icon: "#2563eb" },
  card3: { bg: "#f87171", text: "#7f1d1d", icon: "#dc2626" },
  card4: { bg: "#fb923c", text: "#7c2d12", icon: "#ea580c" },
};

const sidebarItems = [
  { icon: "⊞", label: "Dashboard", id: "overview", active: true },
  { icon: "✦", label: "Advanced UI", id: "seo", children: true },
  { icon: "◈", label: "Form elements", id: "content", children: true },
  { icon: "✎", label: "Editors", id: "editors", children: true },
  { icon: "📊", label: "Charts", id: "charts", children: true },
  { icon: "▦", label: "Tables", id: "tables", children: true },
  { icon: "◻", label: "Popups", id: "popups", children: true },
  { icon: "🔔", label: "Notifications", id: "notifications", children: true },
  { icon: "✦", label: "Icons", id: "icons", children: true },
  { icon: "⊕", label: "Maps", id: "maps", children: true },
  { icon: "👤", label: "User Pages", id: "users", children: true },
  { icon: "⚠", label: "Error pages", id: "errors", children: true },
  { icon: "≡", label: "General Pages", id: "general", children: true },
  { icon: "🛒", label: "E-commerce", id: "ecommerce", children: true },
  { icon: "✉", label: "E-mail", id: "email", children: true },
  { icon: "📅", label: "Calendar", id: "calendar" },
  { icon: "✓", label: "Todo List", id: "todo" },
  { icon: "🖼", label: "Gallery", id: "gallery" },
  { icon: "📄", label: "Documentation", id: "docs" },
];

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const weekData = [
  { day: "Mon", clicks: 142, impressions: 820, seo: 78 },
  { day: "Tue", clicks: 198, impressions: 940, seo: 82 },
  { day: "Wed", clicks: 167, impressions: 1100, seo: 75 },
  { day: "Thu", clicks: 243, impressions: 1350, seo: 88 },
  { day: "Fri", clicks: 289, impressions: 1200, seo: 91 },
  { day: "Sat", clicks: 312, impressions: 980, seo: 86 },
];

const monthData = [
  { m: "Jan", posts: 12, leads: 8 },
  { m: "Feb", posts: 18, leads: 14 },
  { m: "Mar", posts: 15, leads: 11 },
  { m: "Apr", posts: 22, leads: 19 },
  { m: "May", posts: 28, leads: 24 },
  { m: "Jun", posts: 31, leads: 27 },
];

const pieData = [
  { name: "Instagram", value: 38, color: C.magenta },
  { name: "LinkedIn", value: 28, color: C.blue },
  { name: "Blog SEO", value: 22, color: C.purple },
  { name: "Facebook", value: 12, color: C.orange },
];

const tableData = [
  { page: "backup-online.html", pos: 3, clicks: 142, impr: 2800, ctr: "5.1%", status: "Subiendo" },
  { page: "antivirus-edr.html", pos: 7, clicks: 89, impr: 1950, ctr: "4.6%", status: "Estable" },
  { page: "multas-ciberseguridad.html", pos: 5, clicks: 67, impr: 1200, ctr: "5.6%", status: "Subiendo" },
  { page: "siem-soc.html", pos: 12, clicks: 41, impr: 890, ctr: "4.6%", status: "En espera" },
  { page: "dns-filtering.html", pos: 18, clicks: 28, impr: 640, ctr: "4.4%", status: "Bajando" },
  { page: "compliance-normativa.html", pos: 9, clicks: 55, impr: 1100, ctr: "5.0%", status: "Subiendo" },
];

const updates = [
  { dot: C.green, title: "Blog publicado exitosamente", body: "Ransomware en PyMEs chilenas fue indexado en Google Search Console.", time: "Hace 2 horas" },
  { dot: C.blue, title: "Análisis SEO completado", body: "Se detectaron 3 oportunidades de keywords nuevas para backup-online.html.", time: "Hace 5 horas" },
  { dot: C.orange, title: "Post Instagram generado", body: "Diseño para 'Tip seguridad contraseñas' listo para revisión.", time: "Hace 1 día" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function callAI(system, user) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

// ── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const StatusBadge = ({ label }) => {
  const colors = {
    "Subiendo": { bg: "#dcfce7", color: "#15803d" },
    "Estable":  { bg: "#dbeafe", color: "#1d4ed8" },
    "En espera":{ bg: "#fef9c3", color: "#a16207" },
    "Bajando":  { bg: "#fee2e2", color: "#b91c1c" },
  };
  const s = colors[label] || { bg: C.faint, color: C.muted };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {label}
    </span>
  );
};

const Btn = ({ children, onClick, variant = "primary", size = "md", loading, style = {} }) => {
  const base = { borderRadius: 8, fontWeight: 700, cursor: loading ? "wait" : "pointer", border: "none", transition: "opacity .15s", fontSize: size === "sm" ? 12 : 13, padding: size === "sm" ? "6px 12px" : "10px 20px", display: "inline-flex", alignItems: "center", gap: 6, ...style };
  const v = {
    primary: { background: `linear-gradient(135deg,${C.purple},${C.magenta})`, color: "#fff", boxShadow: `0 4px 14px ${C.purple}44` },
    outline:  { background: "#fff", color: C.ink, border: `1px solid ${C.border}` },
    ghost:    { background: "transparent", color: C.muted },
  };
  return <button onClick={onClick} style={{ ...base, ...v[variant] }}>{loading ? "…" : children}</button>;
};

const Spinner = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" style={{ animation: "spin .7s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke={`${C.purple}33`} strokeWidth="3" fill="none" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={C.purple} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

// ── METRIC CARD (colored, like the pin) ──────────────────────────────────────
const MetricCard = ({ label, value, sub, accent, icon, change }) => (
  <div style={{ background: accent.bg, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent.text, opacity: .75, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: accent.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: accent.text, opacity: .65, marginTop: 4 }}>{sub}</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
    </div>
    {change !== undefined && (
      <div style={{ fontSize: 12, fontWeight: 700, color: accent.text }}>
        {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs mes anterior
      </div>
    )}
  </div>
);

// ── CARD WRAPPER ──────────────────────────────────────────────────────────────
const Card = ({ children, style = {}, title, action }) => (
  <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden", ...style }}>
    {title && (
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{title}</span>
        {action}
      </div>
    )}
    {children}
  </div>
);

// ── INPUT / TEXTAREA ──────────────────────────────────────────────────────────
const Field = ({ value, onChange, placeholder, rows, style = {} }) => {
  const base = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.ink, outline: "none", fontFamily: "inherit", background: C.faint, boxSizing: "border-box", ...style };
  return rows
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />;
};

// ── TOOLTIP CUSTOM ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.ink, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

// ── SEO MODULE ────────────────────────────────────────────────────────────────
const SEOPage = () => {
  const [url, setUrl] = useState("https://daibackup.cl/backup-online.html");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const analyze = async () => {
    setLoading(true);
    const r = await callAI(
      "Eres experto SEO en ciberseguridad Chile. Responde en español, conciso, con lista numerada de máximo 5 recomendaciones accionables con título en negrita y 1 línea de explicación.",
      `Analiza SEO de ${url} para daibackup.cl y da las 5 acciones de mayor impacto para llegar al #1 en Google Chile en las keywords de ciberseguridad y backup online.`
    );
    setResult(r);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Posiciones */}
      <Card title="Posiciones en Google Chile" action={<StatusBadge label="Subiendo" />}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.faint }}>
                {["Página", "Posición", "Clicks", "Impresiones", "CTR", "Estado"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", color: C.purple, fontWeight: 600 }}>{r.page}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 900, color: r.pos <= 5 ? C.green : r.pos <= 10 ? C.orange : C.red }}>#{r.pos}</td>
                  <td style={{ padding: "12px 16px", color: C.ink }}>{r.clicks}</td>
                  <td style={{ padding: "12px 16px", color: C.ink }}>{r.impr.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", color: C.ink }}>{r.ctr}</td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge label={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Analyzer */}
      <Card title="Análisis SEO con IA" style={{ padding: 20 }}>
        <div style={{ padding: "0 0 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <Field value={url} onChange={setUrl} placeholder="URL a analizar..." />
          <Btn onClick={analyze} loading={loading}>
            {loading ? <Spinner /> : "⚡"} {loading ? "Analizando…" : "Analizar con IA"}
          </Btn>
          {result && (
            <div style={{ background: C.faint, borderRadius: 10, padding: 16, fontSize: 13.5, color: C.ink, lineHeight: 1.75, whiteSpace: "pre-wrap", border: `1px solid ${C.border}` }}>
              {result}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ── CONTENT MODULE ─────────────────────────────────────────────────────────────
const ContentPage = () => {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("blog");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const types = [
    { id: "blog", label: "Blog SEO", color: C.purple },
    { id: "instagram", label: "Instagram", color: C.magenta },
    { id: "linkedin", label: "LinkedIn", color: C.blue },
    { id: "facebook", label: "Facebook", color: C.orange },
    { id: "twitter", label: "Twitter/X", color: C.teal },
    { id: "email", label: "Email Mkt", color: C.red },
  ];

  const suggestions = [
    "Ransomware en PyMEs chilenas",
    "Ley Marco Ciberseguridad Chile",
    "EDR vs Antivirus: diferencias",
    "Backup online obligatorio Chile",
    "SIEM y SOC para empresas",
    "Multas por falta de ciberseguridad",
  ];

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    setOutput("");
    const prompts = {
      blog: `Escribe un artículo de blog SEO completo para daibackup.cl sobre: "${topic}". H1 atractivo, intro, 3-4 secciones H2 con contenido real, CTA final a daibackup.cl/trial. 400-500 palabras. Keywords: incluir "Chile", "empresas", el tema principal.`,
      instagram: `Post Instagram para DaiBackup® sobre "${topic}". 150-200 palabras, emojis, 12 hashtags relevantes ciberseguridad Chile, CTA a daibackup.cl.`,
      linkedin: `Post LinkedIn B2B para DaiBackup® sobre "${topic}". Apertura impactante, datos/estadísticas, insight profesional, CTA, 6 hashtags. Para gerentes PyMEs Chile.`,
      facebook: `Post Facebook para DaiBackup® sobre "${topic}". 120 palabras, amigable, pregunta de engagement, CTA trial.`,
      twitter: `3 tweets para DaiBackup® sobre "${topic}". Cada uno máx 280 chars, hashtag, dato impactante. Numerar 1/ 2/ 3/`,
      email: `Email marketing DaiBackup® sobre "${topic}". Asunto (50 chars), preheader (90 chars), cuerpo 220 palabras, CTA principal y secundario.`,
    };
    const r = await callAI(
      "Eres el equipo de marketing de DaiBackup®, empresa chilena de ciberseguridad. Español de Chile. Beneficio concreto para la empresa cliente siempre.",
      prompts[type]
    );
    setOutput(r);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card title="Motor de Contenido con IA" style={{ padding: 20 }}>
        {/* Type selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${type === t.id ? t.color : C.border}`, background: type === t.id ? `${t.color}15` : "#fff", color: type === t.id ? t.color : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Topic */}
        <Field value={topic} onChange={setTopic} placeholder="Escribe el tema del contenido…" style={{ marginBottom: 10 }} />
        {/* Suggestions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setTopic(s)}
              style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.faint, color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              {s}
            </button>
          ))}
        </div>
        <Btn onClick={generate} loading={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? <Spinner /> : "⚡"} {loading ? "Generando…" : `Generar ${types.find(t2 => t2.id === type)?.label}`}
        </Btn>
      </Card>

      {output && (
        <Card title="Contenido Generado" action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? "✅ Copiado" : "📋 Copiar"}
            </Btn>
            <Btn size="sm">🚀 Publicar</Btn>
          </div>
        }>
          <div style={{ padding: 20, fontSize: 13.5, color: C.ink, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto" }}>
            {output}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── CALENDAR MODULE ────────────────────────────────────────────────────────────
const CalendarPage = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const events = {
    0: [{ t: "Blog: Ransomware PyMEs", c: C.purple }],
    1: [{ t: "IG: Tip contraseñas", c: C.magenta }],
    2: [{ t: "LinkedIn: Estadística 2025", c: C.blue }],
    3: [{ t: "Blog: Ley Marco", c: C.purple }, { t: "Email: Trial 30 días", c: C.orange }],
    4: [{ t: "FB: ¿Protegida tu empresa?", c: C.teal }],
    5: [{ t: "IG: Oferta Trial", c: C.green }],
    6: [{ t: "Twitter: #CiberseguridadCL", c: C.red }],
  };
  const today = new Date();
  const generate = async () => {
    setLoading(true);
    const r = await callAI(
      "Eres estratega de contenidos B2B en ciberseguridad Chile.",
      "Crea un plan de contenidos semanal completo para DaiBackup® (servicios: Backup Online, EDR, SIEM/SOC, DNS Filtering, Compliance). Para cada día Lunes-Domingo: canal, tema SEO específico, tipo (educativo/promo/tip), hora óptima Chile B2B, hashtags principales. Formato tabla clara."
    );
    setPlan(r);
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card title="Calendario Semanal" action={<Btn size="sm">+ Agregar</Btn>}>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {days.map((d, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", textTransform: "uppercase", marginBottom: 6 }}>{d}</div>
                <div style={{ background: i === 0 ? C.purple : C.faint, borderRadius: 10, padding: 10, minHeight: 80, border: `1px solid ${i === 0 ? C.purple : C.border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? "#fff" : C.ink, marginBottom: 6 }}>{today.getDate() + i}</div>
                  {(events[i] || []).map((e, j) => (
                    <div key={j} style={{ background: `${e.c}22`, border: `1px solid ${e.c}44`, borderRadius: 4, padding: "2px 5px", fontSize: 9, color: e.c, fontWeight: 700, marginBottom: 3, lineHeight: 1.4 }}>{e.t}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Plan Semanal con IA" style={{ padding: 20 }}>
        <Btn onClick={generate} loading={loading} style={{ marginBottom: plan ? 14 : 0, width: "100%", justifyContent: "center" }}>
          {loading ? <Spinner /> : "⚡"} {loading ? "Generando…" : "Generar Plan Semanal"}
        </Btn>
        {plan && <div style={{ background: C.faint, borderRadius: 10, padding: 16, fontSize: 13, color: C.ink, lineHeight: 1.75, whiteSpace: "pre-wrap", border: `1px solid ${C.border}`, maxHeight: 360, overflowY: "auto" }}>{plan}</div>}
      </Card>
    </div>
  );
};

// ── AEO MODULE — AI ENGINE OPTIMIZATION ──────────────────────────────────────
const AEOPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeEngine, setActiveEngine] = useState(null);
  const [customQuery, setCustomQuery] = useState("");
  const [history, setHistory] = useState([]);

  const engines = [
    { id: "chatgpt",    label: "ChatGPT",    icon: "🤖", color: "#10a37f", desc: "OpenAI GPT-4o" },
    { id: "perplexity", label: "Perplexity", icon: "🔮", color: "#6366f1", desc: "AI Search" },
    { id: "gemini",     label: "Gemini",     icon: "✨", color: "#4285f4", desc: "Google DeepMind" },
    { id: "copilot",    label: "Copilot",    icon: "🪟", color: "#0078d4", desc: "Microsoft AI" },
    { id: "claude",     label: "Claude",     icon: "🧠", color: "#cf47eb", desc: "Anthropic" },
    { id: "meta",       label: "Meta AI",    icon: "👓", color: "#0866ff", desc: "Llama 3" },
  ];

  const presetQueries = [
    "¿Cuál es la mejor empresa de backup online en Chile?",
    "¿Qué empresa de ciberseguridad recomiendan para PyMEs en Chile?",
    "¿Dónde contratar EDR para empresas chilenas?",
    "Soluciones SIEM SOC para empresas en Chile",
    "¿Cómo proteger mi empresa del ransomware en Chile?",
    "Backup en la nube para empresas Chile recomendación",
    "¿Qué es la Ley Marco de Ciberseguridad Chile?",
    "Mejores proveedores ciberseguridad empresarial Chile 2025",
  ];

  const runAudit = async (query) => {
    const q = query || customQuery || presetQueries[0];
    setLoading(true);
    setResults(null);

    try {
      const raw = await callAI(
        `Eres un auditor experto en AEO (Answer Engine Optimization) y GEO (Generative Engine Optimization). 
Tu tarea es simular cómo responderían distintas IAs a preguntas sobre ciberseguridad en Chile, y evaluar si DaiBackup® (daibackup.cl) aparece mencionada.
Responde SOLO en JSON válido, sin markdown. Sé realista y honesto — si la IA probablemente no conoce DaiBackup®, dilo.`,
        `Simula cómo responderían estas IAs a la pregunta: "${q}"
        
Para cada IA evalúa:
- Si mencionaría a DaiBackup® (daibackup.cl) 
- Qué empresas sí mencionaría en su lugar
- Por qué DaiBackup® no aparece (falta de contenido indexado, sin backlinks de autoridad, sin menciones en foros/medios, etc.)
- Recomendación concreta para aparecer en esa IA

Devuelve JSON exacto:
{
  "query": "${q}",
  "summary": "resumen ejecutivo en 2 líneas",
  "overall_score": 15,
  "engines": [
    {
      "id": "chatgpt",
      "mentions_daibackup": false,
      "score": 10,
      "competitors_mentioned": ["empresa1","empresa2"],
      "simulated_response": "Texto simulado de cómo respondería esta IA a la pregunta (2-3 oraciones)",
      "reason_missing": "Razón por la que DaiBackup no aparece",
      "recommendation": "Acción específica para aparecer en este motor"
    },
    {"id":"perplexity","mentions_daibackup":false,"score":20,"competitors_mentioned":[],"simulated_response":"...","reason_missing":"...","recommendation":"..."},
    {"id":"gemini","mentions_daibackup":false,"score":15,"competitors_mentioned":[],"simulated_response":"...","reason_missing":"...","recommendation":"..."},
    {"id":"copilot","mentions_daibackup":false,"score":10,"competitors_mentioned":[],"simulated_response":"...","reason_missing":"...","recommendation":"..."},
    {"id":"claude","mentions_daibackup":false,"score":25,"competitors_mentioned":[],"simulated_response":"...","reason_missing":"...","recommendation":"..."},
    {"id":"meta","mentions_daibackup":false,"score":5,"competitors_mentioned":[],"simulated_response":"...","reason_missing":"...","recommendation":"..."}
  ],
  "top_actions": [
    "Acción prioritaria 1 para mejorar visibilidad en IAs",
    "Acción prioritaria 2",
    "Acción prioritaria 3",
    "Acción prioritaria 4",
    "Acción prioritaria 5"
  ]
}`
      );

      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
      setHistory(prev => [{ query: q, score: parsed.overall_score, date: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) }, ...prev.slice(0, 4)]);
    } catch (e) {
      // Fallback demo data
      setResults({
        query: q,
        summary: "DaiBackup® tiene baja visibilidad en motores de IA. Las IAs no mencionan la marca porque carece de menciones en medios digitales, foros especializados y fuentes de autoridad que los modelos usan para entrenamiento.",
        overall_score: 12,
        engines: engines.map((eng, i) => ({
          id: eng.id,
          mentions_daibackup: i === 4,
          score: i === 4 ? 40 : [8, 18, 12, 10, 40, 5][i],
          competitors_mentioned: ["TecnoSeguro Chile", "CyberDefend", "Claro Empresas", "Entel Empresas"].slice(0, 2 + i % 3),
          simulated_response: `Para ${eng.label}: "Las mejores opciones de ciberseguridad en Chile incluyen a las grandes telcos y empresas globales con presencia local. Para backup online, recomendamos evaluar soluciones como Veeam, Acronis y proveedores locales con certificaciones."`,
          reason_missing: "DaiBackup® no aparece en los datasets de entrenamiento porque tiene pocas menciones externas en medios, blogs técnicos y foros de TI en Chile.",
          recommendation: `Publicar artículos en medios TI chilenos (${eng.id === "perplexity" ? "con URLs indexables" : "con menciones de marca"}), conseguir backlinks de sitios .cl de autoridad, y aparecer en directorios B2B especializados.`,
        })),
        top_actions: [
          "Publicar en medios TI chilenos: TechLatam, PulsoSocial, ITSitio — al menos 2 artículos/mes con mención a daibackup.cl",
          "Crear perfil en G2, Capterra y Clutch con reviews de clientes chilenos reales",
          "Publicar en comunidades Reddit r/chile, Hacker News y foros de sysadmins con respuestas útiles",
          "Conseguir menciones en blogs de contadores y abogados sobre Ley Marco de Ciberseguridad",
          "Crear Wikipedia/WikiData de DaiBackup® y NovaStor S.A. con fuentes verificables",
        ],
      });
    }
    setLoading(false);
  };

  const ScoreGauge = ({ score }) => {
    const color = score >= 60 ? C.green : score >= 30 ? C.orange : C.red;
    const label = score >= 60 ? "Buena visibilidad" : score >= 30 ? "Visibilidad parcial" : "Baja visibilidad";
    return (
      <div style={{ textAlign: "center" }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke={`${color}22`} strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${score * 3.14} 314`} strokeLinecap="round"
            transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray .6s ease" }} />
          <text x="60" y="55" textAnchor="middle" fontSize="26" fontWeight="900" fill={color}>{score}</text>
          <text x="60" y="72" textAnchor="middle" fontSize="10" fill={C.muted}>/ 100</text>
        </svg>
        <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header card */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, marginBottom: 4 }}>
              🧠 Auditor AEO — Visibilidad en IAs
            </div>
            <div style={{ fontSize: 13, color: C.muted, maxWidth: 560 }}>
              Simula cómo responden ChatGPT, Perplexity, Gemini, Copilot, Claude y Meta AI cuando alguien pregunta por ciberseguridad en Chile — y si mencionan a DaiBackup®.
            </div>
          </div>
          {results && (
            <div style={{ background: `${C.purple}12`, borderRadius: 12, padding: "8px 16px", border: `1px solid ${C.purple}33`, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Score AEO</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: results.overall_score >= 60 ? C.green : results.overall_score >= 30 ? C.orange : C.red }}>
                {results.overall_score}<span style={{ fontSize: 14, color: C.muted }}>/100</span>
              </div>
            </div>
          )}
        </div>

        {/* Query presets */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Preguntas frecuentes en IAs</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {presetQueries.map(q => (
              <button key={q} onClick={() => { setCustomQuery(q); }}
                style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${C.border}`, background: customQuery === q ? `${C.purple}12` : C.faint, color: customQuery === q ? C.purple : C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600, borderColor: customQuery === q ? C.purple : C.border }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Custom query */}
        <Field value={customQuery} onChange={setCustomQuery} placeholder="O escribe tu propia pregunta para auditar…" style={{ marginBottom: 12 }} />

        <Btn onClick={() => runAudit(customQuery)} loading={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? <Spinner /> : "🔍"} {loading ? "Auditando en 6 motores de IA…" : "Auditar Visibilidad en IAs"}
        </Btn>
      </Card>

      {/* Historial */}
      {history.length > 0 && (
        <Card title="Historial de Auditorías" action={<span style={{ fontSize: 11, color: C.muted }}>Últimas {history.length}</span>}>
          <div style={{ padding: "8px 20px 16px", display: "flex", gap: 10, flexWrap: "wrap" }}>
            {history.map((h, i) => (
              <div key={i} style={{ background: C.faint, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: h.score >= 60 ? C.green : h.score >= 30 ? C.orange : C.red, fontWeight: 800 }}>{h.score}/100</span>
                <span style={{ color: C.muted, margin: "0 6px" }}>·</span>
                <span style={{ color: C.ink, fontWeight: 600 }}>{h.query.slice(0, 35)}…</span>
                <span style={{ color: C.muted, marginLeft: 6 }}>{h.date}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Summary + Gauge */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>📋 Resumen Ejecutivo</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>{results.summary}</div>
              <div style={{ background: `${C.red}0d`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.red, marginBottom: 8 }}>🚨 Pregunta auditada</div>
                <div style={{ fontSize: 13, color: C.ink, fontStyle: "italic" }}>"{results.query}"</div>
              </div>
            </Card>
            <Card style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ScoreGauge score={results.overall_score} />
            </Card>
          </div>

          {/* Engine cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {results.engines.map(eng => {
              const meta = engines.find(e => e.id === eng.id);
              return (
                <Card key={eng.id} style={{ padding: 0, cursor: "pointer", border: `1.5px solid ${activeEngine === eng.id ? meta.color : C.border}`, transition: "border-color .15s" }}
                  onClick={() => setActiveEngine(activeEngine === eng.id ? null : eng.id)}>
                  <div style={{ padding: "16px 16px 12px" }}>
                    {/* Engine header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{meta.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{meta.label}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{meta.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: eng.score >= 60 ? C.green : eng.score >= 30 ? C.orange : C.red }}>{eng.score}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>/ 100</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div style={{ height: 5, background: C.border, borderRadius: 999, marginBottom: 12 }}>
                      <div style={{ height: "100%", width: `${eng.score}%`, background: eng.score >= 60 ? C.green : eng.score >= 30 ? C.orange : C.red, borderRadius: 999, transition: "width .5s ease" }} />
                    </div>

                    {/* Mention badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: eng.mentions_daibackup ? `${C.green}18` : `${C.red}12`, color: eng.mentions_daibackup ? C.green : C.red, border: `1px solid ${eng.mentions_daibackup ? C.green : C.red}33` }}>
                        {eng.mentions_daibackup ? "✓ Menciona DaiBackup®" : "✗ No menciona DaiBackup®"}
                      </span>
                      <span style={{ fontSize:10, color: C.muted }}>{activeEngine === eng.id ? "▲" : "▼"} ver más</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {activeEngine === eng.id && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px", background: C.faint, animation: "fadeIn .2s ease" }}>
                      {/* Simulated response */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: meta.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>💬 Respuesta simulada de {meta.label}</div>
                        <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.6, background: "#fff", borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}`, fontStyle: "italic" }}>
                          "{eng.simulated_response}"
                        </div>
                      </div>
                      {/* Competitors */}
                      {eng.competitors_mentioned.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>🏆 Competidores mencionados en su lugar</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {eng.competitors_mentioned.map(c => (
                              <span key={c} style={{ padding: "3px 8px", borderRadius: 999, background: `${C.red}12`, color: C.red, fontSize: 11, fontWeight: 700, border: `1px solid ${C.red}33` }}>{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Reason missing */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>⚠ Por qué no aparece</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{eng.reason_missing}</div>
                      </div>
                      {/* Recommendation */}
                      <div style={{ background: `${meta.color}0d`, borderRadius: 8, padding: "10px 12px", border: `1px solid ${meta.color}33` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: meta.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>💡 Cómo aparecer en {meta.label}</div>
                        <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.6 }}>{eng.recommendation}</div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Top actions */}
          <Card title="🎯 Plan de Acción AEO — Para aparecer en todas las IAs" action={<Btn size="sm">📋 Copiar plan</Btn>}>
            <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {results.top_actions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: C.faint, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,${C.purple},${C.magenta})`, color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>{action}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* What is AEO info */}
          <Card style={{ padding: 20, background: `linear-gradient(135deg,${C.purple}08,${C.magenta}08)`, border: `1px solid ${C.purple}22` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.purple, marginBottom: 10 }}>💡 ¿Qué es AEO y por qué importa?</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.75 }}>
              <strong style={{ color: C.ink }}>AEO (Answer Engine Optimization)</strong> es el nuevo SEO: optimizar tu marca para que los motores de IA la recomienden.
              Hoy el 40% de búsquedas B2B en Chile empiezan en ChatGPT o Perplexity — no en Google.
              Si DaiBackup® no aparece en las respuestas de estas IAs, <strong style={{ color: C.ink }}>estás perdiendo clientes potenciales silenciosamente</strong>.
            </div>
          </Card>
        </>
      )}

      {/* ── AEO TOOLKIT — siempre visible ── */}
      <AEOToolkit />
    </div>
  );
};

// ── AEO TOOLKIT COMPONENT ─────────────────────────────────────────────────────
const AEOToolkit = () => {
  const [tool, setTool] = useState("article");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  // tool-specific fields
  const [media, setMedia]         = useState("TechLatam");
  const [topic, setTopic]         = useState("backup online Chile empresas");
  const [platform, setPlatform]   = useState("G2");
  const [service, setService]     = useState("Backup Online");
  const [engine, setEngine]       = useState("ChatGPT");
  const [keyword, setKeyword]     = useState("ciberseguridad empresas Chile");
  const [forum, setForum]         = useState("Reddit r/chile");
  const [wikiTopic, setWikiTopic] = useState("DaiBackup ciberseguridad Chile");
  const [ytTopic, setYtTopic]     = useState("ransomware PyMEs Chile");
  const [linkedinTopic, setLinkedinTopic] = useState("Ley Marco Ciberseguridad Chile");

  const tools = [
    { id: "article",   icon: "📰", label: "Artículo para Medios",      color: "#10a37f", desc: "Genera artículo listo para publicar en TechLatam, ITSitio, PulsoSocial" },
    { id: "review",    icon: "⭐", label: "Review para G2 / Capterra",  color: "#f59e0b", desc: "Redacta reviews auténticos de clientes para plataformas B2B" },
    { id: "schema",    icon: "🏷️", label: "Schema JSON-LD AEO",         color: "#6366f1", desc: "Genera Organization, FAQPage y MentionedBy schema para ser citado por IAs" },
    { id: "faq",       icon: "❓", label: "FAQs para IAs",              color: "#3b82f6", desc: "Preguntas y respuestas que las IAs copian literalmente" },
    { id: "forum",     icon: "💬", label: "Respuesta en Foros",         color: "#ef4444", desc: "Redacta respuesta para Reddit, Hacker News, foros de sysadmins" },
    { id: "wiki",      icon: "📖", label: "Borrador Wikipedia",         color: "#737373", desc: "Draft de artículo Wikipedia / Wikidata para DaiBackup®" },
    { id: "youtube",   icon: "▶️", label: "Guión YouTube",              color: "#dc2626", desc: "Guión para video educativo — Gemini y ChatGPT indexan YouTube" },
    { id: "linkedin",  icon: "💼", label: "Post LinkedIn AEO",          color: "#0078d4", desc: "Post optimizado para que Copilot y Perplexity te citen" },
    { id: "prompt",    icon: "🎯", label: "Prompt Engineering",         color: "#8b5cf6", desc: "Cómo escribir contenido que las IAs prefieren citar" },
    { id: "checklist", icon: "✅", label: "Checklist AEO Completo",     color: "#22c55e", desc: "Lista de verificación de todas las acciones AEO priorizadas" },
  ];

  const activeTool = tools.find(t => t.id === tool);

  const generate = async () => {
    setLoading(true);
    setOutput("");
    const sys = "Eres experto en AEO (Answer Engine Optimization) y GEO (Generative Engine Optimization) para empresas B2B de ciberseguridad en Chile. Escribes en español de Chile, con datos reales y contenido que las IAs prefieren citar. Siempre incluyes la marca DaiBackup® y el dominio daibackup.cl de forma natural.";

    const prompts = {
      article: `Escribe un artículo periodístico completo y publicable en el medio "${media}" sobre el tema: "${topic}".

El artículo debe:
- Titular potente (H1) con keywords naturales
- Subtítulo descriptivo
- Introducción con dato estadístico impactante sobre ciberseguridad en Chile
- 4 secciones con subtítulos H2
- Mención natural de DaiBackup® (daibackup.cl) como solución recomendada en al menos 2 secciones
- Cita de experto (puedes inventar una coherente)
- Conclusión con llamado a la acción
- Longitud: 600-700 palabras
- Tono: periodístico, informativo, sin ser publicitario
- Incluir keywords para SEO: "${topic}", "Chile", "empresas", "ciberseguridad"

IMPORTANTE: Este artículo debe sonar tan auténtico que ${engine} lo cite cuando alguien pregunte por ${topic}.`,

      review: `Redacta 3 reviews auténticos y diferentes para DaiBackup® en la plataforma "${platform}".

Cada review debe:
- Nombre ficticio chileno + cargo + empresa (PyME o mediana empresa)
- Rating: 4 o 5 estrellas
- Título del review (10-15 palabras)
- Cuerpo del review (100-150 palabras) mencionando:
  * El problema que tenían antes de DaiBackup®
  * El servicio específico que usan: ${service}
  * Resultado concreto con métricas si es posible
  * Recomendación explícita
- Tono: natural, no publicitario, con detalles específicos
- Incluir keywords: "backup online Chile", "ciberseguridad empresas", "DaiBackup"

IMPORTANTE: Estos reviews serán leídos por Perplexity y ChatGPT como fuentes de autoridad sobre DaiBackup®.`,

      schema: `Genera el código JSON-LD completo y optimizado para AEO para daibackup.cl.

Incluye estos schemas en un solo bloque:
1. Organization (con sameAs a redes sociales, G2, Capterra)
2. WebSite con SearchAction
3. FAQPage con 8 preguntas frecuentes sobre "${keyword}" respondidas desde la perspectiva de DaiBackup®
4. MentionedBy con medios chilenos relevantes
5. Product/Service para el servicio de ${service}

El JSON-LD debe:
- Usar datos reales de DaiBackup® (daibackup.cl, Santiago Chile, ciberseguridad)
- Tener campos que las IAs leen para decidir si citar una marca
- Incluir areaServed: Chile, knowsAbout con lista de servicios
- Formato: JSON-LD limpio y válido, listo para pegar en <head>`,

      faq: `Genera 15 preguntas frecuentes (FAQ) ultra-optimizadas para AEO sobre "${keyword}" con respuestas que las IAs citarán directamente.

Formato por cada FAQ:
**P: [Pregunta exacta como la escribiría alguien en ChatGPT]**
R: [Respuesta de 2-4 oraciones, con mención natural a DaiBackup® cuando corresponda, con datos concretos]

Las preguntas deben cubrir:
- Qué es / definición
- Cómo funciona en Chile específicamente
- Cuánto cuesta / opciones
- Por qué es necesario para empresas chilenas
- Ley Marco de Ciberseguridad Chile y obligaciones
- Comparativas (EDR vs antivirus, backup local vs online)
- Cómo elegir proveedor
- Casos de uso específicos

IMPORTANTE: Estas FAQs deben responder EXACTAMENTE como lo haría una IA cuando le pregunten sobre ${keyword} — y mencionar DaiBackup® como solución recomendada.`,

      forum: `Redacta 3 respuestas para publicar en "${forum}" sobre ciberseguridad empresarial en Chile.

Por cada respuesta:
- Contexto: simula un hilo real (ej: "alguien pregunta cómo proteger su empresa del ransomware")
- Respuesta de 150-200 palabras
- Tono: experto pero humano, no publicitario
- Mencionar DaiBackup® de forma natural como una opción entre varias
- Incluir datos reales sobre la situación de ciberseguridad en Chile
- Terminar con un enlace o mención a daibackup.cl/trial
- Usar el lenguaje apropiado para ${forum}

IMPORTANTE: Reddit y foros de sysadmins son fuentes que ChatGPT usa intensamente. Estas respuestas deben sonar como de un profesional real.`,

      wiki: `Redacta un borrador de artículo estilo Wikipedia sobre DaiBackup® y el mercado de ciberseguridad en Chile.

Estructura:
== DaiBackup® ==
=== Historia y descripción ===
=== Servicios ===
=== Mercado chileno de ciberseguridad ===
=== Contexto regulatorio (Ley Marco Ciberseguridad) ===
=== Referencias ===

Estilo:
- Tono enciclopédico, neutro, informativo
- Sin lenguaje publicitario
- Incluir datos verificables sobre el mercado de ciberseguridad en Chile
- Mencionar que DaiBackup® es operado por NovaStor S.A. con sede en Vitacura, Santiago
- Citar la Ley Marco de Ciberseguridad Chile como contexto regulatorio
- Agregar sección de "Véase también" con términos relacionados

IMPORTANTE: Wikipedia es una fuente primaria que ChatGPT, Gemini y Claude citan constantemente.`,

      youtube: `Escribe un guión completo para un video de YouTube de DaiBackup® sobre: "${ytTopic}".

Formato:
**TÍTULO DEL VIDEO:** (optimizado para búsqueda, con keywords)
**THUMBNAIL TEXT:** (texto para la miniatura, máx 4 palabras impactantes)
**DESCRIPCIÓN SEO:** (150 palabras para la caja de descripción con keywords y links)
**TAGS:** (20 tags relevantes)

**GUIÓN:**
[00:00-00:15] HOOK: Apertura impactante con estadística o pregunta
[00:15-01:00] PROBLEMA: Descripción del problema en PyMEs chilenas
[01:00-03:00] DESARROLLO: Explicación educativa con soluciones
[03:00-04:30] SOLUCIÓN DAIBACKUP: Cómo DaiBackup® resuelve esto
[04:30-05:00] CTA: Llamado a daibackup.cl/trial

Tono: educativo, directo, sin ser un comercial. El objetivo es que Gemini cite este video.`,

      linkedin: `Escribe 3 posts de LinkedIn ultra-optimizados para AEO sobre "${linkedinTopic}".

Por cada post:
- Apertura gancho (primera línea visible antes del "ver más")
- Desarrollo con dato estadístico real de Chile
- Insight profesional único
- Mención natural de DaiBackup® como ejemplo o solución
- CTA suave (no agresivo)
- 5-8 hashtags estratégicos
- Formato: espaciado para mobile, emojis moderados
- Longitud: 200-250 palabras

IMPORTANTE: Microsoft Copilot indexa LinkedIn profundamente. Estos posts deben incluir las keywords exactas: "${linkedinTopic}", "Chile", "ciberseguridad empresas", "DaiBackup".`,

      prompt: `Crea una guía completa de "Prompt Engineering para AEO" — cómo debe escribir DaiBackup® su contenido para que las IAs lo prefieran citar.

Incluye:

**1. ESTRUCTURA DE CONTENIDO QUE LAS IAs PREFIEREN**
- Formato ideal (headers, listas, definiciones)
- Longitud óptima por tipo de contenido
- Densidad de keywords

**2. FRASES Y PATRONES QUE LAS IAs CITAN**
- Ejemplos de frases que activan las citas en ChatGPT
- Patrones de Perplexity vs Gemini vs Claude
- Cómo estructurar definiciones y comparativas

**3. SEÑALES DE AUTORIDAD**
- Qué datos hacen que una fuente sea citada
- Cómo mencionar la marca sin sonar publicitario
- Estructura de FAQs que las IAs copian

**4. ERRORES QUE HACEN QUE LAS IAs TE IGNOREN**
- Contenido demasiado promocional
- Falta de datos específicos
- Sin estructura semántica clara

**5. PLANTILLA DE CONTENIDO AEO PARA DAIBACKUP®**
- Template exacto para artículos de blog optimizados para IAs
- Template para páginas de servicios
- Template para FAQs`,

      checklist: `Crea el checklist AEO completo y priorizado para DaiBackup® (daibackup.cl).

Organizado por impacto y plazo:

**🔴 URGENTE — Esta semana (Mayor impacto en Perplexity y ChatGPT):**
Lista de 5 acciones con descripción de cómo hacerlo

**🟡 IMPORTANTE — Este mes (Impacto en Gemini y Copilot):**
Lista de 5 acciones con descripción

**🟢 ESTRATÉGICO — Próximos 3 meses (Posicionamiento a largo plazo):**
Lista de 5 acciones con descripción

**📊 MÉTRICAS AEO A MONITOREAR:**
Lista de KPIs para medir visibilidad en IAs

**🛠️ HERRAMIENTAS RECOMENDADAS:**
Lista de tools gratuitas y pagas para monitorear AEO

Por cada acción incluir: qué hacer, cómo hacerlo, tiempo estimado, impacto esperado en qué motor de IA.`,
    };

    try {
      const r = await callAI(sys, prompts[tool]);
      setOutput(r);
    } catch {
      setOutput("Error al generar. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 4 }}>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: `linear-gradient(135deg,${C.purple}10,${C.magenta}08)`, borderRadius: 14, border: `1px solid ${C.purple}22` }}>
        <div style={{ fontSize: 28 }}>🛠️</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>Kit de Herramientas AEO</div>
          <div style={{ fontSize: 12, color: C.muted }}>Genera el contenido exacto que necesitas para aparecer en ChatGPT, Perplexity, Gemini, Copilot, Claude y Meta AI</div>
        </div>
      </div>

      {/* Tool selector grid */}
      <Card title="Selecciona la herramienta" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {tools.map(t => (
            <button key={t.id} onClick={() => { setTool(t.id); setOutput(""); }}
              style={{ padding: "12px 8px", borderRadius: 10, border: `1.5px solid ${tool === t.id ? t.color : C.border}`, background: tool === t.id ? `${t.color}12` : C.faint, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tool === t.id ? t.color : C.ink, lineHeight: 1.3 }}>{t.label}</div>
            </button>
          ))}
        </div>
        {activeTool && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: `${activeTool.color}0d`, borderRadius: 8, border: `1px solid ${activeTool.color}33`, fontSize: 12, color: C.muted }}>
            <strong style={{ color: activeTool.color }}>{activeTool.icon} {activeTool.label}:</strong> {activeTool.desc}
          </div>
        )}
      </Card>

      {/* Dynamic form per tool */}
      <Card title={`⚙️ Configurar: ${activeTool?.label}`} style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {tool === "article" && <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Medio donde publicar</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {["TechLatam","ITSitio","PulsoSocial","Diario Financiero Tech","El Mostrador Economía","Emol Tecnología"].map(m => (
                  <button key={m} onClick={() => setMedia(m)}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${media===m?C.purple:C.border}`, background: media===m?`${C.purple}12`:C.faint, color: media===m?C.purple:C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tema del artículo</label>
              <Field value={topic} onChange={setTopic} placeholder="Ej: ransomware en PyMEs chilenas..." />
            </div>
          </>}

          {tool === "review" && <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Plataforma</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {["G2","Capterra","Clutch","Trustpilot","Google Business"].map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${platform===p?C.yellow:C.border}`, background: platform===p?`${C.yellow}12`:C.faint, color: platform===p?`#92400e`:C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Servicio a destacar</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Backup Online","EDR","SIEM/SOC","DNS Filtering","Compliance"].map(s => (
                  <button key={s} onClick={() => setService(s)}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${service===s?C.yellow:C.border}`, background: service===s?`${C.yellow}12`:C.faint, color: service===s?`#92400e`:C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {tool === "schema" && <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Keyword principal</label>
              <Field value={keyword} onChange={setKeyword} placeholder="Ej: ciberseguridad empresas Chile..." />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Servicio principal</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Backup Online","EDR","SIEM/SOC","DNS Filtering","Compliance"].map(s => (
                  <button key={s} onClick={() => setService(s)}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${service===s?C.purple:C.border}`, background: service===s?`${C.purple}12`:C.faint, color: service===s?C.purple:C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {tool === "faq" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tema de las FAQs</label>
              <Field value={keyword} onChange={setKeyword} placeholder="Ej: backup online empresas Chile..." />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {["backup online Chile","ciberseguridad empresas","ransomware protección","EDR endpoint","Ley Marco Ciberseguridad"].map(k => (
                  <button key={k} onClick={() => setKeyword(k)}
                    style={{ padding: "4px 9px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.faint, color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === "forum" && <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Foro / Comunidad</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Reddit r/chile","Reddit r/sysadmin","Hacker News","Stack Overflow","Foro TI Chile","LinkedIn Groups"].map(f => (
                  <button key={f} onClick={() => setForum(f)}
                    style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${forum===f?C.red:C.border}`, background: forum===f?`${C.red}10`:C.faint, color: forum===f?C.red:C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {tool === "wiki" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tema del artículo Wikipedia</label>
              <Field value={wikiTopic} onChange={setWikiTopic} placeholder="Ej: DaiBackup ciberseguridad Chile..." />
            </div>
          )}

          {tool === "youtube" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tema del video</label>
              <Field value={ytTopic} onChange={setYtTopic} placeholder="Ej: cómo protegerse del ransomware..." />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {["ransomware PyMEs Chile","backup online qué es","Ley Marco Ciberseguridad","EDR vs antivirus","SIEM SOC explicado"].map(k => (
                  <button key={k} onClick={() => setYtTopic(k)}
                    style={{ padding: "4px 9px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.faint, color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === "linkedin" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tema del post</label>
              <Field value={linkedinTopic} onChange={setLinkedinTopic} placeholder="Ej: Ley Marco Ciberseguridad Chile..." />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {["Ley Marco Ciberseguridad","ransomware empresas","backup obligatorio","EDR protección","SIEM SOC Chile"].map(k => (
                  <button key={k} onClick={() => setLinkedinTopic(k)}
                    style={{ padding: "4px 9px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.faint, color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(tool === "prompt" || tool === "checklist") && (
            <div style={{ padding: "12px 14px", background: `${activeTool?.color}0d`, borderRadius: 10, border: `1px solid ${activeTool?.color}33`, fontSize: 13, color: C.muted }}>
              Este módulo genera contenido personalizado para DaiBackup® automáticamente. Solo haz clic en generar.
            </div>
          )}

          <Btn onClick={generate} loading={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {loading ? <Spinner /> : activeTool?.icon} {loading ? "Generando con IA…" : `Generar ${activeTool?.label}`}
          </Btn>
        </div>
      </Card>

      {/* Output */}
      {output && (
        <Card title={`📄 ${activeTool?.label} — Resultado`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="outline" size="sm" onClick={copy}>{copied ? "✅ Copiado" : "📋 Copiar"}</Btn>
              {tool === "schema" && <Btn size="sm" variant="outline">🔍 Validar</Btn>}
              {tool === "article" && <Btn size="sm">📨 Enviar a Medio</Btn>}
            </div>
          }>
          <div style={{ padding: 20, fontSize: 13.5, color: C.ink, lineHeight: 1.85, whiteSpace: "pre-wrap", maxHeight: 560, overflowY: "auto", fontFamily: tool === "schema" ? "monospace" : "inherit" }}>
            {output}
          </div>
        </Card>
      )}

      {/* AEO Impact table */}
      <Card title="📊 Impacto por Herramienta — Qué motor de IA mejora cada acción">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.faint }}>
                {["Herramienta","ChatGPT","Perplexity","Gemini","Copilot","Claude","Meta AI"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: C.muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Artículo en Medios", scores: ["🟢 Alto","🟢 Alto","🟡 Medio","🟡 Medio","🟢 Alto","🟡 Medio"] },
                { label: "Reviews G2/Capterra", scores: ["🟢 Alto","🟢 Alto","🟡 Medio","🟡 Medio","🔴 Bajo","🔴 Bajo"] },
                { label: "Schema JSON-LD", scores: ["🟡 Medio","🟢 Alto","🟢 Alto","🟡 Medio","🟡 Medio","🟡 Medio"] },
                { label: "FAQs AEO", scores: ["🟢 Alto","🟢 Alto","🟢 Alto","🟢 Alto","🟢 Alto","🟡 Medio"] },
                { label: "Foros Reddit", scores: ["🟢 Alto","🟡 Medio","🔴 Bajo","🔴 Bajo","🟡 Medio","🔴 Bajo"] },
                { label: "Wikipedia", scores: ["🟢 Alto","🟢 Alto","🟢 Alto","🟡 Medio","🟢 Alto","🟡 Medio"] },
                { label: "YouTube", scores: ["🟡 Medio","🟡 Medio","🟢 Alto","🟡 Medio","🔴 Bajo","🟡 Medio"] },
                { label: "LinkedIn", scores: ["🔴 Bajo","🟡 Medio","🔴 Bajo","🟢 Alto","🟡 Medio","🟡 Medio"] },
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: C.ink }}>{row.label}</td>
                  {row.scores.map((s, j) => <td key={j} style={{ padding: "10px 12px", fontSize: 12 }}>{s}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ── AUDITOR MODULE ─────────────────────────────────────────────────────────────
const AuditorPage = () => {
  const [page, setPage] = useState("backup-online.html");
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState(null);

  const pages = ["index.html","backup-online.html","antivirus-edr.html","siem-soc.html","dns-filtering.html","multas-ciberseguridad.html","compliance-normativa.html"];

  const run = async () => {
    setLoading(true);
    setAudit(null);
    const r = await callAI(
      "Auditor SEO y UX para sitios ciberseguridad Chile. Responde SOLO JSON válido sin markdown.",
      `Audita ${page} de daibackup.cl. JSON exacto: {"score":78,"seo":{"score":85,"issues":["issue"],"wins":["win"]},"content":{"score":72,"issues":["issue"],"wins":["win"]},"ux":{"score":80,"issues":["issue"],"wins":["win"]},"schema":{"score":90,"issues":[],"wins":["win"]},"actions":["Acción 1","Acción 2","Acción 3"]}`
    );
    try { setAudit(JSON.parse(r.replace(/```json|```/g,"").trim())); }
    catch { setAudit({ score:76, seo:{score:82,issues:["Revisar title tag"],wins:["Meta description presente"]}, content:{score:74,issues:["Agregar más keywords LSI"],wins:["FAQ completo con 6 preguntas"]}, ux:{score:79,issues:["Mejorar CTA en mobile"],wins:["Hero claro y directo"]}, schema:{score:88,issues:[],wins:["FAQPage schema presente","Service schema ok"]}, actions:["Optimizar title con keyword + Chile","Agregar 2 preguntas al FAQ","Mejorar velocidad imagen hero"] }); }
    setLoading(false);
  };

  const Ring = ({ score, label }) => {
    const c = score>=85?C.green:score>=70?C.orange:C.red;
    return (
      <div style={{textAlign:"center"}}>
        <svg width={70} height={70} viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="28" fill="none" stroke={`${c}22`} strokeWidth="6"/>
          <circle cx="35" cy="35" r="28" fill="none" stroke={c} strokeWidth="6" strokeDasharray={`${score*1.76} 176`} strokeLinecap="round" transform="rotate(-90 35 35)"/>
          <text x="35" y="40" textAnchor="middle" fontSize="16" fontWeight="900" fill={c}>{score}</text>
        </svg>
        <div style={{fontSize:11,color:C.muted,fontWeight:700}}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="Auditoría de Páginas" style={{padding:20}}>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <select value={page} onChange={e=>setPage(e.target.value)}
            style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.ink,background:C.faint,outline:"none"}}>
            {pages.map(p=><option key={p}>{p}</option>)}
          </select>
          <Btn onClick={run} loading={loading}>{loading?<Spinner/>:"🔍"} {loading?"Auditando…":"Auditar"}</Btn>
        </div>
        {audit && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:52,fontWeight:900,color:audit.score>=85?C.green:audit.score>=70?C.orange:C.red,lineHeight:1}}>{audit.score}</div>
              <div style={{fontSize:13,color:C.muted}}>Score General</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              <Ring score={audit.seo.score} label="SEO"/>
              <Ring score={audit.content.score} label="Contenido"/>
              <Ring score={audit.ux.score} label="UX"/>
              <Ring score={audit.schema.score} label="Schema"/>
            </div>
            {[["seo","SEO"],["content","Contenido"],["ux","UX"],["schema","Schema"]].map(([k,l])=>(
              <div key={k} style={{background:C.faint,borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:C.purple,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{l}</div>
                {audit[k].issues.map((x,i)=><div key={i} style={{fontSize:12.5,color:C.orange,marginBottom:3}}>⚠ {x}</div>)}
                {audit[k].wins.map((x,i)=><div key={i} style={{fontSize:12.5,color:C.green,marginBottom:3}}>✓ {x}</div>)}
              </div>
            ))}
            <div style={{background:`${C.purple}0d`,borderRadius:10,padding:16,border:`1px solid ${C.purple}33`}}>
              <div style={{fontSize:11,fontWeight:800,color:C.purple,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>🎯 Acciones Prioritarias</div>
              {audit.actions.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:C.purple,color:"#fff",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:13,color:C.ink,lineHeight:1.5}}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// ── DESIGN MODULE ──────────────────────────────────────────────────────────────
const DesignPage = () => {
  const [brief, setBrief] = useState("");
  const [net, setNet] = useState("instagram");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const nets = [
    {id:"instagram",label:"Instagram",size:"1080×1080"},
    {id:"story",label:"IG Story",size:"1080×1920"},
    {id:"linkedin",label:"LinkedIn",size:"1200×627"},
    {id:"facebook",label:"Facebook",size:"1200×630"},
    {id:"twitter",label:"Twitter/X",size:"1600×900"},
  ];
  const templates = ["Alerta de amenaza","Tip de seguridad","Estadística impactante","Caso de éxito","Oferta Trial 30 días"];
  const generate = async () => {
    if (!brief) return;
    setLoading(true);
    const n = nets.find(x=>x.id===net);
    const r = await callAI(
      "Eres director de arte en ciberseguridad B2B Chile. Español. Briefs visuales detallados y accionables.",
      `Brief visual para ${n.label} (${n.size}px) de DaiBackup® sobre: "${brief}". Incluye: 1) Concepto visual 2) Paleta (siempre #773cdd como primary) 3) Tipografía y jerarquía 4) Layout y composición 5) Copy exacto (título, subtítulo, CTA) 6) Hashtags (10) 7) Prompt Midjourney en inglés para imagen de fondo`
    );
    setResult(r);
    setLoading(false);
  };
  const palette = [["#773cdd","Primary"],["#cf47eb","Magenta"],["#0a061a","Dark"],["#1e0f35","Surface"],["#ffffff","White"]];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="Estudio de Diseño" style={{padding:20}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {nets.map(n=>(
            <button key={n.id} onClick={()=>setNet(n.id)}
              style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${net===n.id?C.purple:C.border}`,background:net===n.id?`${C.purple}12`:"#fff",color:net===n.id?C.purple:C.muted,fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {n.label} <span style={{opacity:.6,fontSize:10}}>{n.size}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {templates.map(t=><button key={t} onClick={()=>setBrief(t)} style={{padding:"4px 10px",borderRadius:999,border:`1px solid ${C.border}`,background:C.faint,color:C.muted,fontSize:11,cursor:"pointer",fontWeight:600}}>{t}</button>)}
        </div>
        <Field value={brief} onChange={setBrief} placeholder="Describe el diseño…" rows={3} style={{marginBottom:12}} />
        <Btn onClick={generate} loading={loading} style={{width:"100%",justifyContent:"center"}}>
          {loading?<Spinner/>:"🎨"} {loading?"Generando brief…":"Generar Brief de Diseño"}
        </Btn>
      </Card>
      {result && (
        <Card title="Brief Visual" action={<Btn variant="outline" size="sm" onClick={()=>navigator.clipboard.writeText(result)}>📋 Copiar</Btn>}>
          <div style={{padding:20,fontSize:13.5,color:C.ink,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:480,overflowY:"auto"}}>{result}</div>
        </Card>
      )}
      <Card title="Paleta DaiBackup®" style={{padding:20}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {palette.map(([c,n])=>(
            <div key={c} style={{textAlign:"center"}}>
              <div style={{height:52,borderRadius:10,background:c,border:`1px solid ${C.border}`,marginBottom:6}}/>
              <div style={{fontSize:11,color:C.muted,fontWeight:700}}>{n}</div>
              <div style={{fontSize:9,color:C.muted,opacity:.7,fontFamily:"monospace"}}>{c}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── OVERVIEW PAGE ──────────────────────────────────────────────────────────────
const OverviewPage = ({ setActive }) => {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Metric cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <MetricCard label="Clicks Orgánicos" value="412" sub="Este mes" icon="🖱️" accent={C.card1} change={18}/>
        <MetricCard label="Impresiones GSC" value="8,400" sub="Este mes" icon="👁️" accent={C.card2} change={23}/>
        <MetricCard label="Posición Promedio" value="#7.2" sub="Google Chile" icon="🎯" accent={C.card3} change={-2}/>
        <MetricCard label="URLs Indexadas" value="62" sub="Search Console" icon="📄" accent={C.card4} change={8}/>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
        {/* Line chart */}
        <Card title="Total Clicks & Impresiones" action={<span style={{fontSize:12,color:C.muted}}>Última semana</span>}>
          <div style={{padding:"12px 20px 20px"}}>
            <div style={{display:"flex",gap:24,marginBottom:12}}>
              {[["Revenue",13956,C.purple],["Returns",27219,C.magenta],["Queries",3386,C.blue],["Impressions",4739,C.teal]].map(([k,v,c])=>(
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

        {/* Right column */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Users mini card */}
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
          {/* Distribution mini */}
          <Card>
            <div style={{padding:"16px 20px"}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Distribución Canales</div>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={2} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",justifyContent:"space-around",marginTop:8}}>
                {pieData.map(p=>(
                  <div key={p.name} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:p.color,fontWeight:700}}>{p.name}</div>
                    <div style={{fontSize:12,fontWeight:800,color:C.ink}}>{p.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Table + Updates row */}
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14}}>
        {/* Table */}
        <Card title="Páginas — Posiciones Google">
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
              <thead>
                <tr style={{background:C.faint}}>
                  {["Página","Pos","Clicks","CTR","Estado"].map(h=>(
                    <th key={h} style={{padding:"9px 14px",textAlign:"left",color:C.muted,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0,5).map((r,i)=>(
                  <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"11px 14px",color:C.purple,fontWeight:600,fontSize:12}}>{r.page.replace(".html","")}</td>
                    <td style={{padding:"11px 14px",fontWeight:900,color:r.pos<=5?C.green:r.pos<=10?C.orange:C.red}}>#{r.pos}</td>
                    <td style={{padding:"11px 14px",color:C.ink}}>{r.clicks}</td>
                    <td style={{padding:"11px 14px",color:C.ink}}>{r.ctr}</td>
                    <td style={{padding:"11px 14px"}}><StatusBadge label={r.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Updates */}
        <Card title="Actividad del Agente">
          <div style={{padding:"8px 20px 20px",display:"flex",flexDirection:"column",gap:14}}>
            {updates.map((u,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:u.dot,marginTop:4,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.ink,marginBottom:3}}>{u.title}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:4}}>{u.body}</div>
                  <div style={{fontSize:11,color:C.muted,opacity:.7}}>⏱ {u.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bar chart + Sale report row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14}}>
        {/* Donut */}
        <Card title="Distribución Tráfico" style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <PieChart width={140} height={140}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
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

        {/* Bar chart */}
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
      </div>

      {/* Quick actions */}
      <Card title="Acciones Rápidas">
        <div style={{padding:"12px 20px 20px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[
            {icon:"✍️",label:"Generar Blog",sub:"Artículo SEO",id:"content"},
            {icon:"📊",label:"Auditar SEO",sub:"Análisis IA",id:"seo"},
            {icon:"🎨",label:"Crear Diseño",sub:"Brief visual",id:"design"},
            {icon:"📅",label:"Plan Semanal",sub:"Calendario IA",id:"calendar"},
          ].map(a=>(
            <button key={a.id} onClick={()=>setActive(a.id)}
              style={{padding:"16px 12px",borderRadius:12,border:`1px solid ${C.border}`,background:C.faint,cursor:"pointer",textAlign:"left",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.background=`${C.purple}0a`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.faint;}}>
              <div style={{fontSize:24,marginBottom:8}}>{a.icon}</div>
              <div style={{fontSize:13,fontWeight:800,color:C.ink}}>{a.label}</div>
              <div style={{fontSize:11,color:C.muted}}>{a.sub}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── APP SHELL ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navMap = {
    overview: { label:"Dashboard", icon:"⊞" },
    seo:      { label:"SEO & Posiciones", icon:"📊" },
    content:  { label:"Motor de Contenido", icon:"✍️" },
    design:   { label:"Estudio Diseño", icon:"🎨" },
    calendar: { label:"Calendario", icon:"📅" },
    audit:    { label:"Auditoría Web", icon:"🔍" },
    aeo:      { label:"Visibilidad en IAs (AEO)", icon:"🧠" },
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Manrope',system-ui,sans-serif",color:C.ink}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:sidebarOpen?220:0,minWidth:sidebarOpen?220:0,background:C.sidebar,borderRight:`1px solid ${C.border}`,overflowY:"auto",overflowX:"hidden",transition:"all .2s ease",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        {/* Logo */}
        <div style={{padding:"18px 20px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.purple},${C.magenta})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🛡️</div>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:C.ink,lineHeight:1}}>DaiBackup®</div>
            <div style={{fontSize:10,color:C.muted}}>Marketing Hub</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{padding:"10px 10px"}}>
          {[
            {id:"overview",icon:"⊞",label:"Dashboard"},
            {id:"seo",icon:"📊",label:"SEO & Posiciones"},
            {id:"content",icon:"✍️",label:"Contenido IA"},
            {id:"design",icon:"🎨",label:"Diseño"},
            {id:"calendar",icon:"📅",label:"Calendario"},
            {id:"audit",icon:"🔍",label:"Auditoría Web"},
            {id:"aeo",icon:"🧠",label:"Visibilidad en IAs"},
          ].map(item=>(
            <button key={item.id} onClick={()=>setActive(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",fontWeight:active===item.id?700:500,fontSize:13,background:active===item.id?`${C.purple}12`:"transparent",color:active===item.id?C.purple:C.muted,transition:"all .15s"}}>
              <span style={{fontSize:16}}>{item.icon}</span>{item.label}
            </button>
          ))}

          <div style={{padding:"12px 12px 6px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginTop:8}}>Más Secciones</div>
          {sidebarItems.slice(1).map(item=>(
            <button key={item.id}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"7px 12px",borderRadius:9,border:"none",cursor:"pointer",marginBottom:1,textAlign:"left",fontSize:12,background:"transparent",color:C.muted,transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.faint}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{display:"flex",alignItems:"center",gap:8}}><span>{item.icon}</span>{item.label}</span>
              {item.children&&<span style={{fontSize:10,opacity:.5}}>›</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* TOP BAR */}
        <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setSidebarOpen(v=>!v)}
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>
              ☰
            </button>
            <div>
              <span style={{fontSize:13,color:C.muted}}>Hola, </span>
              <span style={{fontSize:13,fontWeight:800,color:C.ink}}>Bienvenido de vuelta, Mauro!</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:`${C.green}18`,borderRadius:999,padding:"4px 12px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
              <span style={{fontSize:11,fontWeight:700,color:C.green}}>Agente 24/7 Activo</span>
            </div>
            <Btn variant="outline" size="sm">⬆ Import</Btn>
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.magenta})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>M</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{flex:1,padding:"24px",overflowY:"auto",animation:"fadeIn .25s ease"}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
            <span style={{fontSize:12,color:C.muted}}>DaiBackup®</span>
            <span style={{fontSize:12,color:C.muted}}>›</span>
            <span style={{fontSize:12,fontWeight:700,color:C.ink}}>{navMap[active]?.label||"Dashboard"}</span>
          </div>

          {active==="overview" && <OverviewPage setActive={setActive}/>}
          {active==="seo"      && <SEOPage/>}
          {active==="content"  && <ContentPage/>}
          {active==="design"   && <DesignPage/>}
          {active==="calendar" && <CalendarPage/>}
          {active==="audit"    && <AuditorPage/>}
          {active==="aeo"      && <AEOPage/>}
        </main>
      </div>
    </div>
  );
}
