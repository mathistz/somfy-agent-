import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const S = {
  navy:      "#25485A",
  yellow:    "#FFB71E",
  yellowBg:  "#fff8e6",
  bg:        "#ffffff",
  bgSoft:    "#f5f7f9",
  text:      "#1a1a1a",
  textSub:   "#666666",
  textMuted: "#999999",
  border:    "rgba(0,0,0,0.09)",
  borderMd:  "rgba(0,0,0,0.14)",
  green:     "#3dba6e",
};
const CHART_COLORS = ["#25485A","#FFB71E","#1a6b4a","#e07b00","#5a8fa3","#f0c040","#2e7d5e","#c9600a"];

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

## GRAPHIQUES
Quand ta réponse contient des données chiffrées comparatives, génère un graphique à la fin :

CHART_START
{"type":"bar","title":"Titre","labels":["A","B","C"],"datasets":[{"label":"Série","data":[10,20,30],"color":"#25485A"}]}
CHART_END

Types : "bar", "line", "pie", "multibar". Texte d'abord, graphique ensuite.`;

const PROFILES = {
  commercial: {
    label: "Commercial", icon: "ti-briefcase",
    categories: [
      { id:"prospection", label:"Prospection", icon:"ti-target", desc:"Appels d'offres et projets",
        prompts:[
          { label:"AO rénovation écoles", text:"Quels sont les appels d'offres publics pour la rénovation d'écoles en France ce mois-ci ?" },
          { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire ?" },
          { label:"Hôpitaux en rénovation", text:"Y a-t-il des appels d'offres pour la rénovation d'hôpitaux en France actuellement ?" },
          { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine ?" },
        ]},
      { id:"pitch", label:"Arguments de vente", icon:"ti-speakerphone", desc:"Pitch par interlocuteur",
        prompts:[
          { label:"Pitch bureau d'études", text:"Donne-moi un pitch pour convaincre un bureau d'études thermique de prescrire les solutions Somfy." },
          { label:"Pitch mairie / école", text:"Quels arguments pour convaincre un élu de mairie d'investir dans des protections solaires Somfy ?" },
          { label:"Pitch facility manager", text:"Arguments pour un facility manager sur les bénéfices des protections solaires automatisées." },
          { label:"Pitch promoteur", text:"Comment convaincre un promoteur immobilier tertiaire d'intégrer Somfy dès la conception ?" },
        ]},
      { id:"concurrence", label:"Analyse concurrents", icon:"ti-chart-bar", desc:"Benchmark et veille",
        prompts:[
          { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire tertiaire. Génère un graphique." },
          { label:"Benchmark concurrents", text:"Compare Somfy, Schneider, Varema, Nice, Yokis sur l'automatisme tertiaire. Génère un graphique." },
          { label:"Parts de marché tertiaire", text:"Quelles sont les parts de marché des acteurs sur l'automatisme de protection solaire tertiaire en France ? Génère un camembert." },
          { label:"Nouveaux entrants", text:"Y a-t-il de nouveaux acteurs sur le marché de l'automatisation des protections solaires en tertiaire ?" },
        ]},
      { id:"installateurs", label:"Réseau installateurs", icon:"ti-tools", desc:"Formation et animation réseau",
        prompts:[
          { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à proposer des solutions de protection solaire en tertiaire ?" },
          { label:"Arguments pour installateurs", text:"Quels arguments pour convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
        ]},
    ]
  },
  marketing: {
    label: "Marketing", icon: "ti-chart-dots",
    categories: [
      { id:"veille", label:"Veille marché", icon:"ti-radar", desc:"Tendances et actualités",
        prompts:[
          { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire tertiaire en France en 2025 ?" },
          { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire tertiaire en France ? Génère un graphique." },
          { label:"Protocoles GTB émergents", text:"Quels protocoles GTB gagnent du terrain en France en 2025 ? Compare leur adoption." },
          { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
        ]},
      { id:"reglementation", label:"Réglementation", icon:"ti-file-certificate", desc:"Décrets et normes",
        prompts:[
          { label:"Décret BACS complet", text:"Résumé du décret BACS : obligations, seuils par année, impact pour Somfy. Génère un graphique." },
          { label:"Décret tertiaire 2025", text:"État du décret tertiaire en 2025 : obligations et calendrier. Génère un graphique." },
          { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent aux protections solaires ?" },
        ]},
      { id:"confort_ete", label:"Confort d'été", icon:"ti-sun", desc:"Arguments thermiques et données",
        prompts:[
          { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques avec des BSO ou screens automatisés ? Génère un graphique comparatif." },
          { label:"Protection solaire vs clim", text:"Compare les coûts et bénéfices d'une protection solaire automatisée vs la climatisation. Génère un graphique." },
          { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ? Génère un graphique." },
        ]},
      { id:"communication", label:"Communication", icon:"ti-messages", desc:"Contenu et messages clés",
        prompts:[
          { label:"Messages clés par segment", text:"Définis les messages clés Somfy pour chaque segment : écoles, bureaux, santé, hôtels." },
          { label:"Arguments RSE", text:"Quels arguments RSE autour des protections solaires automatisées ?" },
          { label:"Cas clients à documenter", text:"Quels cas clients Somfy devrait documenter en priorité pour crédibiliser son offre tertiaire ?" },
        ]},
    ]
  }
};

function parseMessage(content) {
  const match = content.match(/CHART_START\s*([\s\S]*?)\s*CHART_END/);
  if (!match) return { text: content, chart: null };
  const text = content.replace(/CHART_START\s*([\s\S]*?)\s*CHART_END/, "").trim();
  try { return { text, chart: JSON.parse(match[1].trim()) }; }
  catch { return { text: content, chart: null }; }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`0.5px solid rgba(0,0,0,0.14)`, borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      {label && <p style={{ margin:"0 0 4px", fontWeight:500 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ margin:"2px 0", color:p.color }}>{p.name} : <strong>{p.value}</strong></p>)}
    </div>
  );
};

function ChartBlock({ chart }) {
  if (!chart) return null;
  const h = 220;
  const card = { marginTop:12, background:"#f5f7f9", borderRadius:10, border:`0.5px solid rgba(0,0,0,0.09)`, padding:"14px 10px 8px" };
  const title = { margin:"0 0 10px", fontWeight:500, fontSize:13, color:"#1a1a1a", textAlign:"center" };
  if (chart.type==="pie") {
    const data = chart.labels.map((l,i)=>({ name:l, value:chart.datasets[0].data[i] }));
    return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>{data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip content={<CustomTooltip/>}/></PieChart></ResponsiveContainer></div>;
  }
  const data = chart.labels.map((l,i)=>{ const pt={label:l}; chart.datasets.forEach(ds=>{pt[ds.label]=ds.data[i];}); return pt; });
  if (chart.type==="line") return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.09)"/><XAxis dataKey="label" tick={{fontSize:11,fill:"#666"}}/><YAxis tick={{fontSize:11,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:12}}/>}{chart.datasets.map((ds,i)=><Line key={i} type="monotone" dataKey={ds.label} stroke={ds.color||CHART_COLORS[i]} strokeWidth={2} dot={{r:3}}/>)}</LineChart></ResponsiveContainer></div>;
  return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><BarChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.09)"/><XAxis dataKey="label" tick={{fontSize:11,fill:"#666"}}/><YAxis tick={{fontSize:11,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:12}}/>}{chart.datasets.map((ds,i)=><Bar key={i} dataKey={ds.label} fill={ds.color||CHART_COLORS[i]} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>;
}

function TypingDots() {
  return <div style={{display:"flex",gap:5,alignItems:"center",padding:"5px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#FFB71E",animation:"sb 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>)}<style>{`@keyframes sb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style></div>;
}

function Message({ msg }) {
  const isUser = msg.role==="user";
  if (isUser) return <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14,gap:9,alignItems:"flex-start"}}><div style={{maxWidth:"76%",background:"#25485A",borderRadius:"16px 4px 16px 16px",padding:"10px 14px",fontSize:14,lineHeight:1.65,color:"#fff",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.content}</div><div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"#fff8e6",border:`0.5px solid #FFB71E`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}><i className="ti ti-user" style={{fontSize:14,color:"#25485A"}}/></div></div>;
  const {text,chart} = msg.content==="..."?{text:"...",chart:null}:parseMessage(msg.content);
  return <div style={{display:"flex",justifyContent:"flex-start",marginBottom:14,gap:9,alignItems:"flex-start"}}><div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"#25485A",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}><i className="ti ti-sparkles" style={{fontSize:14,color:"#FFB71E"}}/></div><div style={{maxWidth:"82%",minWidth:0}}><div style={{background:"#f5f7f9",border:`0.5px solid rgba(0,0,0,0.09)`,borderRadius:"4px 16px 16px 16px",padding:"10px 14px",fontSize:14,lineHeight:1.65,color:"#1a1a1a",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.content==="..."?<TypingDots/>:text}</div>{chart&&<ChartBlock chart={chart}/>}</div></div>;
}

export default function App() {
  const [messages,setMessages] = useState([]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const [profile,setProfile] = useState("commercial");
  const [openCat,setOpenCat] = useState("prospection");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  async function sendMessage(text) {
    const userText = (text||input).trim();
    if (!userText||loading) return;
    setInput("");
    const newMessages = [...messages,{role:"user",content:userText}];
    setMessages([...newMessages,{role:"assistant",content:"..."}]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          system:SYSTEM_PROMPT,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:newMessages.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(typeof data.error==="object"?JSON.stringify(data.error):data.error);
      const reply = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n")||"Pas de réponse.";
      setMessages(prev=>[...prev.slice(0,-1),{role:"assistant",content:reply}]);
    } catch(err) {
      setMessages(prev=>[...prev.slice(0,-1),{role:"assistant",content:`Erreur : ${err.message}`}]);
    } finally {
      setLoading(false);
      setTimeout(()=>inputRef.current?.focus(),100);
    }
  }

  const currentProfile = PROFILES[profile];
  const currentCat = currentProfile.categories.find(c=>c.id===openCat)||currentProfile.categories[0];

  return (
    <div style={{display:"flex",height:640,background:"#ffffff",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.10)",border:`0.5px solid rgba(0,0,0,0.09)`}}>
      <div style={{width:214,background:"#25485A",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
        <div style={{padding:"16px 14px 13px",borderBottom:"0.5px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:7,background:"#FFB71E",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-sun" style={{fontSize:16,color:"#25485A"}}/>
            </div>
            <div>
              <p style={{margin:0,fontWeight:600,fontSize:14,color:"#fff"}}>Somfy Agent</p>
              <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.4)"}}>Protection solaire tertiaire</p>
            </div>
          </div>
        </div>
        <div style={{padding:"11px 11px 7px"}}>
          <p style={{margin:"0 0 7px 3px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Profil</p>
          <div style={{display:"flex",gap:5}}>
            {Object.entries(PROFILES).map(([key,p])=>(
              <button key={key} onClick={()=>{setProfile(key);setOpenCat(PROFILES[key].categories[0].id);}} style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",background:profile===key?"#FFB71E":"rgba(255,255,255,0.07)",border:profile===key?"none":`0.5px solid rgba(255,255,255,0.12)`,color:profile===key?"#25485A":"rgba(255,255,255,0.6)",fontSize:12,fontWeight:profile===key?600:400,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <i className={`ti ${p.icon}`} style={{fontSize:15}}/>{p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"2px 9px 8px"}}>
          <p style={{margin:"8px 3px 7px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Catégories</p>
          {currentProfile.categories.map(cat=>(
            <div key={cat.id}>
              <button onClick={()=>setOpenCat(openCat===cat.id?null:cat.id)} style={{width:"100%",padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,background:openCat===cat.id?"rgba(255,183,30,0.18)":"transparent",border:`0.5px solid ${openCat===cat.id?"rgba(255,183,30,0.4)":"transparent"}`,color:openCat===cat.id?"#FFB71E":"rgba(255,255,255,0.7)",fontSize:13,display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
                <i className={`ti ${cat.icon}`} style={{fontSize:15,flexShrink:0}}/><span style={{flex:1}}>{cat.label}</span><i className={`ti ti-chevron-${openCat===cat.id?"down":"right"}`} style={{fontSize:11,opacity:0.5}}/>
              </button>
              {openCat===cat.id&&<div style={{marginLeft:10,marginBottom:5,borderLeft:`1.5px solid rgba(255,183,30,0.25)`,paddingLeft:9}}>{cat.prompts.map((p,i)=><button key={i} onClick={()=>sendMessage(p.text)} style={{width:"100%",padding:"5px 6px",borderRadius:5,cursor:"pointer",textAlign:"left",background:"transparent",border:"none",color:"rgba(255,255,255,0.5)",fontSize:12,lineHeight:1.45,display:"block",marginBottom:1}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>{p.label}</button>)}</div>}
            </div>
          ))}
        </div>
        <div style={{padding:"8px 10px 12px",borderTop:"0.5px solid rgba(255,255,255,0.08)"}}>
          <button onClick={()=>setMessages([])} style={{width:"100%",padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:9,background:"rgba(255,183,30,0.12)",border:`0.5px solid rgba(255,183,30,0.3)`,color:"#FFB71E",fontSize:12,display:"flex",alignItems:"center",gap:7}}>
            <i className="ti ti-plus" style={{fontSize:13}}/>Nouvelle discussion
          </button>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#3dba6e"}}/>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Recherche web active</span>
          </div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{padding:"12px 18px",borderBottom:`0.5px solid rgba(0,0,0,0.09)`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#ffffff"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:"#25485A",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className={`ti ${currentCat.icon}`} style={{fontSize:14,color:"#FFB71E"}}/>
            </div>
            <div>
              <p style={{margin:0,fontWeight:500,fontSize:14,color:"#1a1a1a"}}>{currentCat.label}</p>
              <p style={{margin:0,fontSize:11,color:"#666666"}}>{currentCat.desc}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{display:"flex",alignItems:"center",gap:5,background:"#f5f7f9",padding:"3px 10px",borderRadius:20,border:`0.5px solid rgba(0,0,0,0.09)`}}>
              <i className="ti ti-chart-bar" style={{fontSize:11,color:"#FFB71E"}}/>
              <span style={{fontSize:11,color:"#666666"}}>Graphiques activés</span>
            </div>
            {messages.length>0&&<span style={{fontSize:11,color:"#999999",background:"#f5f7f9",padding:"3px 10px",borderRadius:20,border:`0.5px solid rgba(0,0,0,0.09)`}}>{messages.filter(m=>m.role==="user").length} question{messages.filter(m=>m.role==="user").length>1?"s":""}</span>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px 10px",background:"#ffffff"}}>
          {messages.length===0?(
            <div style={{paddingTop:6}}>
              <p style={{margin:"0 0 14px",fontSize:13,color:"#666666"}}>Suggestions pour <strong style={{color:"#1a1a1a"}}>{currentCat.label}</strong> :</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {currentCat.prompts.map((p,i)=>(
                  <button key={i} onClick={()=>sendMessage(p.text)} style={{padding:"12px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",background:"#f5f7f9",border:`0.5px solid rgba(0,0,0,0.09)`,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:14,color:"#1a1a1a"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#FFB71E"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.09)"}>
                    <span>{p.label}</span><i className="ti ti-arrow-right" style={{fontSize:13,color:"#999999",flexShrink:0,marginLeft:10}}/>
                  </button>
                ))}
              </div>
            </div>
          ):messages.map((msg,i)=><Message key={i} msg={msg}/>)}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 16px 14px",borderTop:`0.5px solid rgba(0,0,0,0.09)`,background:"#ffffff"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#f5f7f9",borderRadius:12,border:`0.5px solid ${input.trim()?"#FFB71E":"rgba(0,0,0,0.14)"}`,padding:"8px 8px 8px 14px",transition:"border-color 0.15s"}}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Posez votre question..." rows={1} disabled={loading} style={{flex:1,resize:"none",border:"none",background:"transparent",fontSize:14,color:"#1a1a1a",lineHeight:1.5,outline:"none",maxHeight:100,overflow:"auto"}}/>
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:36,height:36,borderRadius:9,border:"none",background:input.trim()&&!loading?"#25485A":"#e8e8e8",cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s",flexShrink:0}}>
              <i className="ti ti-arrow-up" style={{fontSize:16,color:input.trim()&&!loading?"#FFB71E":"#aaa"}}/>
            </button>
          </div>
          <p style={{margin:"6px 0 0",fontSize:11,color:"#999999",textAlign:"center"}}>Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
        </div>
      </div>
    </div>
  );
}
