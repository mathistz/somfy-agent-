import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── Couleurs Somfy ───────────────────────────────────────────
const S = {
  navy:      "#25485A",
  navyHover: "#2e5a70",
  yellow:    "#FFB71E",
  yellowBg:  "#fff8e6",
  // UI light theme
  bg:        "#ffffff",
  bgSoft:    "#f5f7f9",
  bgPage:    "#f0f2f5",
  text:      "#1a1a1a",
  textSub:   "#666666",
  textMuted: "#999999",
  border:    "rgba(0,0,0,0.09)",
  borderMd:  "rgba(0,0,0,0.14)",
  green:     "#3dba6e",
};
const CHART_COLORS = ["#25485A","#FFB71E","#1a6b4a","#e07b00","#5a8fa3","#f0c040","#2e7d5e","#c9600a"];

// ─── Prompt système ───────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un agent IA spécialisé assistant les équipes commerciales et marketing de Somfy France, leader de la motorisation résidentielle et challenger sur le marché de la protection solaire tertiaire.

## Contexte Somfy
- CA Somfy France : ~430 M€, dont 70-80% en résidentiel
- Leader incontesté en résidentiel (75% de part de marché)
- Challenger en tertiaire face à Schneider, Siemens, Varema, Nice
- Produits clés : moteurs de volets roulants, BSO, screens extérieurs/intérieurs
- Solution tertiaire : Animeo Suite (radio IO, premium) + offres filaires
- Lacune actuelle : compatibilité GTB/BMS prévue automne 2025

## Marché tertiaire
- Décret BACS : automatisation obligatoire (>290 kW depuis 2025, seuil baisse chaque année)
- Décret Tertiaire : -40% conso 2030, -50% 2040, -60% 2050
- Argument clé : confort d'été / réduction degrés-heures (DH) et température opérative maximale

## Segments prioritaires
- Écoles (interdiction clim post-COVID), bureaux rénovation, hôtels, bâtiments de santé
- Collectivités locales avec gros patrimoine immobilier

## Concurrents
- Schneider Electric, Siemens : généralistes bâtiment full-package GTB
- Varema, Nice : spécialistes protection solaire
- Yokis : récepteurs bas coût sur moteurs existants
- Bubendorf, Cherubini : motoristes concurrents

## GRAPHIQUES — règle importante
Quand ta réponse contient des données chiffrées comparatives ou des évolutions temporelles, génère un graphique en ajoutant ce bloc EXACTEMENT à la fin de ta réponse :

CHART_START
{"type":"bar","title":"Titre","labels":["A","B","C"],"datasets":[{"label":"Série","data":[10,20,30],"color":"#25485A"}]}
CHART_END

Types : "bar" (barres), "line" (courbes), "pie" (camembert), "multibar" (barres groupées avec plusieurs datasets).
Génère un graphique uniquement si les données sont significatives. Texte d'abord, graphique ensuite.`;

// ─── Données sidebar ──────────────────────────────────────────
const PROFILES = {
  commercial: {
    label: "Commercial", icon: "ti-briefcase",
    categories: [
      { id:"prospection", label:"Prospection", icon:"ti-target", desc:"Appels d'offres et projets",
        prompts:[
          { label:"AO rénovation écoles", text:"Quels sont les appels d'offres publics pour la rénovation d'écoles en France ce mois-ci ?" },
          { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire ?" },
          { label:"Hôpitaux en rénovation", text:"Y a-t-il des appels d'offres pour la rénovation d'hôpitaux ou bâtiments de santé en France actuellement ?" },
          { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine immobilier ?" },
        ]},
      { id:"pitch", label:"Arguments de vente", icon:"ti-speakerphone", desc:"Pitch par interlocuteur",
        prompts:[
          { label:"Pitch bureau d'études", text:"Donne-moi un pitch pour convaincre un bureau d'études thermique de prescrire les solutions Somfy. Inclus des données chiffrées sur les gains thermiques." },
          { label:"Pitch mairie / école", text:"Quels arguments pour convaincre un élu de mairie d'investir dans des protections solaires automatisées Somfy pour ses écoles ?" },
          { label:"Pitch facility manager", text:"Arguments pour un facility manager sur les bénéfices des protections solaires automatisées. Montre les économies avec des chiffres." },
          { label:"Pitch promoteur", text:"Comment convaincre un promoteur immobilier tertiaire d'intégrer Somfy dès la phase de conception ?" },
        ]},
      { id:"concurrence", label:"Analyse concurrents", icon:"ti-chart-bar", desc:"Benchmark et veille",
        prompts:[
          { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire tertiaire. Génère un graphique comparatif." },
          { label:"Benchmark concurrents", text:"Compare le positionnement des principaux acteurs : Somfy, Schneider, Varema, Nice, Yokis sur l'automatisme tertiaire. Génère un graphique." },
          { label:"Parts de marché tertiaire", text:"Quelles sont les parts de marché estimées des acteurs sur l'automatisme de protection solaire tertiaire en France ? Génère un camembert." },
          { label:"Nouveaux entrants", text:"Y a-t-il de nouveaux acteurs ou startups sur le marché de l'automatisation des protections solaires en tertiaire ?" },
        ]},
      { id:"installateurs", label:"Réseau installateurs", icon:"ti-tools", desc:"Formation et animation réseau",
        prompts:[
          { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à proposer des solutions de protection solaire automatisée en tertiaire ?" },
          { label:"Arguments pour installateurs", text:"Quels arguments pour convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
        ]},
    ]
  },
  marketing: {
    label: "Marketing", icon: "ti-chart-dots",
    categories: [
      { id:"veille", label:"Veille marché", icon:"ti-radar", desc:"Tendances et actualités",
        prompts:[
          { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire tertiaire en France en 2025 ? Génère un graphique si tu as des données chiffrées." },
          { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire tertiaire en France ? Taille, croissance, segments. Génère un graphique." },
          { label:"Protocoles GTB émergents", text:"Quels protocoles GTB (Bacnet, KNX, Matter, Zigbee...) gagnent du terrain en France en 2025 ? Compare leur adoption." },
          { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
        ]},
      { id:"reglementation", label:"Réglementation", icon:"ti-file-certificate", desc:"Décrets et normes",
        prompts:[
          { label:"Décret BACS complet", text:"Fais un résumé du décret BACS : obligations, seuils par année, impact pour Somfy. Génère un graphique des seuils dans le temps." },
          { label:"Décret tertiaire 2025", text:"État du décret tertiaire en 2025 : obligations actuelles, calendrier des réductions. Génère un graphique de l'évolution des objectifs." },
          { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent aux protections solaires (EN 14501, EN 17037...) ?" },
        ]},
      { id:"confort_ete", label:"Confort d'été", icon:"ti-sun", desc:"Arguments thermiques et données",
        prompts:[
          { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques typiques avec des BSO ou screens automatisés ? Génère un graphique comparatif des températures avec et sans protection." },
          { label:"Protection solaire vs clim", text:"Compare les coûts et bénéfices d'une protection solaire automatisée vs la climatisation. Génère un graphique comparatif." },
          { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ? Génère un graphique." },
        ]},
      { id:"communication", label:"Communication", icon:"ti-messages", desc:"Contenu et messages clés",
        prompts:[
          { label:"Messages clés par segment", text:"Définis les messages clés de communication Somfy pour chaque segment : écoles, bureaux, santé, hôtels." },
          { label:"Arguments RSE", text:"Quels arguments RSE peut-on développer autour des protections solaires automatisées ?" },
          { label:"Cas clients à documenter", text:"Quels types de cas clients Somfy devrait documenter en priorité pour crédibiliser son offre tertiaire ?" },
        ]},
    ]
  }
};

// ─── Parsing graphique ────────────────────────────────────────
function parseMessage(content) {
  const match = content.match(/CHART_START\s*([\s\S]*?)\s*CHART_END/);
  if (!match) return { text: content, chart: null };
  const text = content.replace(/CHART_START\s*([\s\S]*?)\s*CHART_END/, "").trim();
  try { return { text, chart: JSON.parse(match[1].trim()) }; }
  catch { return { text: content, chart: null }; }
}

// ─── Tooltip graphique ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`0.5px solid ${S.borderMd}`, borderRadius:8, padding:"8px 12px", fontSize:12, boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
      {label && <p style={{ margin:"0 0 4px", fontWeight:500, color:S.text }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ margin:"2px 0", color:p.color || S.navy }}>{p.name} : <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Composant graphique ──────────────────────────────────────
function ChartBlock({ chart }) {
  if (!chart) return null;
  const h = 220;
  const cardStyle = { marginTop:12, background:S.bgSoft, borderRadius:10, border:`0.5px solid ${S.border}`, padding:"14px 10px 8px" };
  const titleStyle = { margin:"0 0 10px", fontWeight:500, fontSize:13, color:S.text, textAlign:"center" };

  if (chart.type === "pie") {
    const data = chart.labels.map((l,i) => ({ name:l, value:chart.datasets[0].data[i] }));
    return (
      <div style={cardStyle}>
        {chart.title && <p style={titleStyle}>{chart.title}</p>}
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value"
              label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
              {data.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (chart.type === "line") {
    const data = chart.labels.map((l,i) => {
      const pt = { label:l };
      chart.datasets.forEach(ds => { pt[ds.label] = ds.data[i]; });
      return pt;
    });
    return (
      <div style={cardStyle}>
        {chart.title && <p style={titleStyle}>{chart.title}</p>}
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
            <XAxis dataKey="label" tick={{fontSize:11,fill:S.textSub}} />
            <YAxis tick={{fontSize:11,fill:S.textSub}} />
            <Tooltip content={<CustomTooltip />} />
            {chart.datasets.length>1 && <Legend wrapperStyle={{fontSize:12}} />}
            {chart.datasets.map((ds,i) => (
              <Line key={i} type="monotone" dataKey={ds.label} stroke={ds.color||CHART_COLORS[i]} strokeWidth={2} dot={{r:3}} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  // bar / multibar
  const data = chart.labels.map((l,i) => {
    const pt = { label:l };
    chart.datasets.forEach(ds => { pt[ds.label] = ds.data[i]; });
    return pt;
  });
  return (
    <div style={cardStyle}>
      {chart.title && <p style={titleStyle}>{chart.title}</p>}
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
          <XAxis dataKey="label" tick={{fontSize:11,fill:S.textSub}} />
          <YAxis tick={{fontSize:11,fill:S.textSub}} />
          <Tooltip content={<CustomTooltip />} />
          {chart.datasets.length>1 && <Legend wrapperStyle={{fontSize:12}} />}
          {chart.datasets.map((ds,i) => (
            <Bar key={i} dataKey={ds.label} fill={ds.color||CHART_COLORS[i]} radius={[3,3,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Indicateur de frappe ─────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center", padding:"5px 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:S.yellow,
          animation:"sb 1.2s ease-in-out infinite", animationDelay:`${i*0.2}s` }} />
      ))}
      <style>{`@keyframes sb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

// ─── Bulle de message ─────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14, gap:9, alignItems:"flex-start" }}>
        <div style={{ maxWidth:"76%", background:S.navy, borderRadius:"16px 4px 16px 16px",
          padding:"10px 14px", fontSize:14, lineHeight:1.65, color:"#fff", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {msg.content}
        </div>
        <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:S.yellowBg, border:`0.5px solid ${S.yellow}`,
          display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
          <i className="ti ti-user" style={{ fontSize:14, color:S.navy }} />
        </div>
      </div>
    );
  }
  const { text, chart } = msg.content === "..." ? { text:"...", chart:null } : parseMessage(msg.content);
  return (
    <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:14, gap:9, alignItems:"flex-start" }}>
      <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
        background:S.navy, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 }}>
        <i className="ti ti-sparkles" style={{ fontSize:14, color:S.yellow }} />
      </div>
      <div style={{ maxWidth:"82%", minWidth:0 }}>
        <div style={{ background:S.bgSoft, border:`0.5px solid ${S.border}`,
          borderRadius:"4px 16px 16px 16px", padding:"10px 14px",
          fontSize:14, lineHeight:1.65, color:S.text, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {msg.content === "..." ? <TypingDots /> : text}
        </div>
        {chart && <ChartBlock chart={chart} />}
      </div>
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────
export default function App() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [profile, setProfile]     = useState("commercial");
  const [openCat, setOpenCat]     = useState("prospection");
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    const newMessages = [...messages, { role:"user", content:userText }];
    setMessages([...newMessages, { role:"assistant", content:"..." }]);
    setLoading(true);
    try {
      // Appel vers notre proxy serverless (api/chat.js) — la clé API reste côté serveur
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          system: SYSTEM_PROMPT,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages: newMessages.map(m => ({ role:m.role, content:m.content }))
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const reply = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n") || "Pas de réponse.";
      setMessages(prev => [...prev.slice(0,-1), { role:"assistant", content:reply }]);
    } catch(err) {
      setMessages(prev => [...prev.slice(0,-1), { role:"assistant", content:`Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const currentProfile = PROFILES[profile];
  const currentCat = currentProfile.categories.find(c=>c.id===openCat) || currentProfile.categories[0];

  return (
    <div style={{ display:"flex", height:640, background:S.bg, borderRadius:16,
      overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.10)", border:`0.5px solid ${S.border}` }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div style={{ width:214, background:S.navy, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

        {/* Logo */}
        <div style={{ padding:"16px 14px 13px", borderBottom:"0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:S.yellow,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="ti ti-sun" style={{ fontSize:16, color:S.navy }} />
            </div>
            <div>
              <p style={{ margin:0, fontWeight:600, fontSize:14, color:"#fff", letterSpacing:"0.01em" }}>Somfy Agent</p>
              <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.4)" }}>Protection solaire tertiaire</p>
            </div>
          </div>
        </div>

        {/* Sélecteur de profil */}
        <div style={{ padding:"11px 11px 7px" }}>
          <p style={{ margin:"0 0 7px 3px", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Profil</p>
          <div style={{ display:"flex", gap:5 }}>
            {Object.entries(PROFILES).map(([key,p]) => (
              <button key={key} onClick={() => { setProfile(key); setOpenCat(PROFILES[key].categories[0].id); }} style={{
                flex:1, padding:"8px 4px", borderRadius:8, cursor:"pointer",
                background: profile===key ? S.yellow : "rgba(255,255,255,0.07)",
                border: profile===key ? "none" : `0.5px solid rgba(255,255,255,0.12)`,
                color: profile===key ? S.navy : "rgba(255,255,255,0.6)",
                fontSize:12, fontWeight: profile===key ? 600 : 400,
                display:"flex", flexDirection:"column", alignItems:"center", gap:4
              }}>
                <i className={`ti ${p.icon}`} style={{ fontSize:15 }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories accordéon */}
        <div style={{ flex:1, overflowY:"auto", padding:"2px 9px 8px" }}>
          <p style={{ margin:"8px 3px 7px", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Catégories</p>
          {currentProfile.categories.map(cat => (
            <div key={cat.id}>
              <button onClick={() => setOpenCat(openCat===cat.id ? null : cat.id)} style={{
                width:"100%", padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:2,
                background: openCat===cat.id ? "rgba(255,183,30,0.18)" : "transparent",
                border:`0.5px solid ${openCat===cat.id ? "rgba(255,183,30,0.4)" : "transparent"}`,
                color: openCat===cat.id ? S.yellow : "rgba(255,255,255,0.7)",
                fontSize:13, display:"flex", alignItems:"center", gap:8, textAlign:"left"
              }}>
                <i className={`ti ${cat.icon}`} style={{ fontSize:15, flexShrink:0 }} />
                <span style={{ flex:1 }}>{cat.label}</span>
                <i className={`ti ti-chevron-${openCat===cat.id?"down":"right"}`} style={{ fontSize:11, opacity:0.5 }} />
              </button>
              {openCat===cat.id && (
                <div style={{ marginLeft:10, marginBottom:5, borderLeft:`1.5px solid rgba(255,183,30,0.25)`, paddingLeft:9 }}>
                  {cat.prompts.map((p,i) => (
                    <button key={i} onClick={() => sendMessage(p.text)} style={{
                      width:"100%", padding:"5px 6px", borderRadius:5, cursor:"pointer", textAlign:"left",
                      background:"transparent", border:"none",
                      color:"rgba(255,255,255,0.5)", fontSize:12, lineHeight:1.45, display:"block", marginBottom:1,
                      transition:"color 0.12s"
                    }}
                    onMouseEnter={e=>e.currentTarget.style.color="#fff"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bas de sidebar */}
        <div style={{ padding:"8px 10px 12px", borderTop:"0.5px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setMessages([])} style={{
            width:"100%", padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:9,
            background:"rgba(255,183,30,0.12)", border:`0.5px solid rgba(255,183,30,0.3)`,
            color:S.yellow, fontSize:12, display:"flex", alignItems:"center", gap:7
          }}>
            <i className="ti ti-plus" style={{ fontSize:13 }} />
            Nouvelle discussion
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:S.green }} />
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Recherche web active</span>
          </div>
        </div>
      </div>

      {/* ── Zone principale ──────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Header */}
        <div style={{ padding:"12px 18px", borderBottom:`0.5px solid ${S.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between", background:S.bg }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:S.navy,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className={`ti ${currentCat.icon}`} style={{ fontSize:14, color:S.yellow }} />
            </div>
            <div>
              <p style={{ margin:0, fontWeight:500, fontSize:14, color:S.text }}>{currentCat.label}</p>
              <p style={{ margin:0, fontSize:11, color:S.textSub }}>{currentCat.desc}</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5,
              background:S.bgSoft, padding:"3px 10px", borderRadius:20, border:`0.5px solid ${S.border}` }}>
              <i className="ti ti-chart-bar" style={{ fontSize:11, color:S.yellow }} />
              <span style={{ fontSize:11, color:S.textSub }}>Graphiques activés</span>
            </div>
            {messages.length>0 && (
              <span style={{ fontSize:11, color:S.textMuted, background:S.bgSoft,
                padding:"3px 10px", borderRadius:20, border:`0.5px solid ${S.border}` }}>
                {messages.filter(m=>m.role==="user").length} question{messages.filter(m=>m.role==="user").length>1?"s":""}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"18px 20px 10px", background:S.bg }}>
          {messages.length===0 ? (
            <div style={{ paddingTop:6 }}>
              <p style={{ margin:"0 0 14px", fontSize:13, color:S.textSub }}>
                Suggestions pour <strong style={{color:S.text}}>{currentCat.label}</strong> :
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {currentCat.prompts.map((p,i) => (
                  <button key={i} onClick={() => sendMessage(p.text)} style={{
                    padding:"12px 16px", borderRadius:10, cursor:"pointer", textAlign:"left",
                    background:S.bgSoft, border:`0.5px solid ${S.border}`,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    fontSize:14, color:S.text, transition:"border-color 0.15s"
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=S.yellow}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
                    <span>{p.label}</span>
                    <i className="ti ti-arrow-right" style={{ fontSize:13, color:S.textMuted, flexShrink:0, marginLeft:10 }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg,i) => <Message key={i} msg={msg} />)
          )}
          <div ref={bottomRef} />
        </div>

        {/* Saisie */}
        <div style={{ padding:"10px 16px 14px", borderTop:`0.5px solid ${S.border}`, background:S.bg }}>
          <div style={{
            display:"flex", gap:8, alignItems:"flex-end",
            background:S.bgSoft, borderRadius:12,
            border:`0.5px solid ${input.trim() ? S.yellow : S.borderMd}`,
            padding:"8px 8px 8px 14px", transition:"border-color 0.15s"
          }}>
            <textarea ref={inputRef} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
              placeholder="Posez votre question..." rows={1} disabled={loading}
              style={{ flex:1, resize:"none", border:"none", background:"transparent",
                fontSize:14, color:S.text, lineHeight:1.5, outline:"none", maxHeight:100, overflow:"auto" }}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{
              width:36, height:36, borderRadius:9, border:"none",
              background: input.trim()&&!loading ? S.navy : "#e8e8e8",
              cursor: input.trim()&&!loading ? "pointer" : "default",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"background 0.15s", flexShrink:0
            }}>
              <i className="ti ti-arrow-up" style={{ fontSize:16,
                color: input.trim()&&!loading ? S.yellow : "#aaa" }} />
            </button>
          </div>
          <p style={{ margin:"6px 0 0", fontSize:11, color:S.textMuted, textAlign:"center" }}>
            Entrée pour envoyer · Shift+Entrée pour saut de ligne
          </p>
        </div>
      </div>
    </div>
  );
}
