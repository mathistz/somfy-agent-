import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#25485A";
const YELLOW = "#FFB71E";
const LOGO_URL = "https://companieslogo.com/img/orig/SO.PA-fea83676.png";
const CHART_COLORS = ["#25485A","#FFB71E","#1a6b4a","#e07b00","#5a8fa3","#f0c040","#2e7d5e","#c9600a"];

const SYSTEM_PROMPT = `Tu es un assistant IA expert en protection solaire tertiaire, travaillant avec les équipes de Somfy France.

Contexte Somfy : leader en résidentiel (75% de part de marché, ~430M€ de CA), challenger en tertiaire face à Schneider, Siemens, Varema, Nice. Produits clés : BSO, screens, volets roulants motorisés. Solution tertiaire : Animeo Suite (radio IO) et offres filaires. Compatibilité GTB/BMS prévue automne 2025. Concurrents notables : Yokis (bas coût), Bubendorf, Cherubini.

Réglementation clé : Décret BACS (automatisation obligatoire >290kW), Décret Tertiaire (-40% conso 2030), argument confort d'été et réduction des degrés-heures.

STYLE DE RÉPONSE :
- Écris de façon naturelle et fluide, comme un consultant qui parle à un collègue
- Pas de bullet points ni de listes à tirets sauf si vraiment nécessaire
- Pas de texte en gras avec des étoiles comme ça
- Des paragraphes courts et clairs
- Un ton direct, professionnel mais accessible
- Tu peux répondre à n'importe quelle question, pas seulement sur Somfy
- Si un fichier est joint, analyse-le et réponds en te basant sur son contenu
- Utilise la recherche web pour toute question d'actualité
- Pour les appels d'offres, consulte systématiquement marches-publics.gouv.fr (plateforme PLACE) et boamp.fr

GRAPHIQUES : quand tu as des données chiffrées comparatives, ajoute à la fin :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END
Types disponibles : bar, line, pie, multibar.`;

const PROFILES = {
  commercial: {
    label: "Commercial", icon: "ti-briefcase",
    categories: [
      { id:"prospection", label:"Prospection", icon:"ti-target", desc:"Appels d'offres et projets",
        prompts:[
          { label:"AO rénovation écoles", text:"Recherche les appels d'offres publics sur marches-publics.gouv.fr pour la rénovation d'écoles avec volets roulants ou protection solaire en France ce mois-ci." },
          { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire ?" },
          { label:"Hôpitaux en rénovation", text:"Recherche les appels d'offres sur marches-publics.gouv.fr pour la rénovation d'hôpitaux ou bâtiments de santé en France." },
          { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine immobilier ?" },
        ]},
      { id:"pitch", label:"Arguments de vente", icon:"ti-speakerphone", desc:"Pitch par interlocuteur",
        prompts:[
          { label:"Pitch bureau d'études", text:"Rédige-moi un pitch fluide pour convaincre un bureau d'études thermique de prescrire les solutions Somfy." },
          { label:"Pitch mairie / école", text:"Comment convaincre un élu de mairie d'investir dans des protections solaires automatisées pour ses écoles ?" },
          { label:"Pitch facility manager", text:"Quels arguments pour un facility manager sur les bénéfices concrets des protections solaires automatisées ?" },
          { label:"Pitch promoteur", text:"Comment convaincre un promoteur immobilier tertiaire d'intégrer Somfy dès la conception ?" },
        ]},
      { id:"concurrence", label:"Analyse concurrents", icon:"ti-chart-bar", desc:"Benchmark et veille",
        prompts:[
          { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire tertiaire." },
          { label:"Benchmark concurrents", text:"Compare Somfy, Schneider, Varema, Nice et Yokis sur l'automatisme de protection solaire tertiaire." },
          { label:"Parts de marché tertiaire", text:"Quelles sont les parts de marché estimées des acteurs sur l'automatisme de protection solaire tertiaire en France ?" },
          { label:"Nouveaux entrants", text:"Y a-t-il de nouveaux acteurs sur le marché de l'automatisation des protections solaires en tertiaire ?" },
        ]},
      { id:"installateurs", label:"Réseau installateurs", icon:"ti-tools", desc:"Formation et animation réseau",
        prompts:[
          { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à se lancer sur la protection solaire tertiaire ?" },
          { label:"Arguments pour installateurs", text:"Comment convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
        ]},
    ]
  },
  marketing: {
    label: "Marketing", icon: "ti-chart-dots",
    categories: [
      { id:"veille", label:"Veille marché", icon:"ti-radar", desc:"Tendances et actualités",
        prompts:[
          { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire tertiaire en France en 2025 ?" },
          { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire tertiaire en France ?" },
          { label:"Protocoles GTB émergents", text:"Quels protocoles GTB gagnent du terrain en France en 2025 ?" },
          { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
        ]},
      { id:"reglementation", label:"Réglementation", icon:"ti-file-certificate", desc:"Décrets et normes",
        prompts:[
          { label:"Décret BACS complet", text:"Explique-moi le décret BACS, ses obligations, ses seuils et son impact pour Somfy." },
          { label:"Décret tertiaire 2025", text:"Où en est l'application du décret tertiaire en 2025 et quelles sont les obligations actuelles ?" },
          { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent aux protections solaires ?" },
        ]},
      { id:"confort_ete", label:"Confort d'été", icon:"ti-sun", desc:"Arguments thermiques et données",
        prompts:[
          { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques concrets avec des BSO ou screens automatisés ?" },
          { label:"Protection solaire vs clim", text:"Compare les bénéfices d'une protection solaire automatisée face à la climatisation." },
          { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ?" },
        ]},
      { id:"communication", label:"Communication", icon:"ti-messages", desc:"Contenu et messages clés",
        prompts:[
          { label:"Messages clés par segment", text:"Définis les messages clés Somfy pour les écoles, bureaux, bâtiments de santé et hôtels." },
          { label:"Arguments RSE", text:"Quels arguments RSE peut-on développer autour des protections solaires automatisées ?" },
          { label:"Cas clients à documenter", text:"Quels cas clients Somfy devrait documenter en priorité pour crédibiliser son offre tertiaire ?" },
        ]},
    ]
  }
};

function PlaceSearchWidget({ onSearch }) {
  const [keywords, setKeywords] = useState("");
  function handleSubmit() {
    if (!keywords.trim()) return;
    const url = `https://www.marches-publics.gouv.fr/?page=Entreprise.EntrepriseAdvancedSearch&searchAnnCons&keyWord=${encodeURIComponent(keywords)}&categorie=0&localisations=`;
    window.open(url, "_blank");
    onSearch(`Recherche les appels d'offres publics sur la plateforme PLACE (marches-publics.gouv.fr) pour les mots clés : "${keywords}". Trouve et résume les appels d'offres les plus pertinents pour Somfy, notamment ceux concernant la protection solaire, les volets roulants, les BSO, les stores ou la rénovation thermique de bâtiments.`);
    setKeywords("");
  }
  return (
    <div style={{ margin:"8px 0 4px", padding:"10px", background:"rgba(255,255,255,0.05)", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
        <span style={{ fontSize:14 }}>🇫🇷</span>
        <span style={{ fontSize:11, fontWeight:600, color:YELLOW, letterSpacing:"0.04em" }}>Recherche PLACE</span>
      </div>
      <p style={{ margin:"0 0 7px", fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>
        Tape des mots clés pour chercher sur marches-publics.gouv.fr
      </p>
      <div style={{ display:"flex", gap:5 }}>
        <input value={keywords} onChange={e=>setKeywords(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") handleSubmit(); }} placeholder="ex: volets roulants école"
          style={{ flex:1, padding:"6px 9px", borderRadius:6, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:11, outline:"none", fontFamily:"inherit" }}/>
        <button onClick={handleSubmit} disabled={!keywords.trim()} style={{ padding:"6px 10px", borderRadius:6, border:"none", cursor:keywords.trim()?"pointer":"default", background:keywords.trim()?YELLOW:"rgba(255,255,255,0.1)", color:keywords.trim()?NAVY:"rgba(255,255,255,0.3)", fontSize:11, fontWeight:600, flexShrink:0 }}>
          Chercher
        </button>
      </div>
    </div>
  );
}

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
    <div style={{ background:"#fff", border:`1px solid rgba(0,0,0,0.1)`, borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      {label && <p style={{ margin:"0 0 4px", fontWeight:500 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ margin:"2px 0", color:p.color }}>{p.name} : <strong>{p.value}</strong></p>)}
    </div>
  );
};

function ChartBlock({ chart }) {
  if (!chart) return null;
  const h = 220;
  const card = { marginTop:12, background:"#f5f7f9", borderRadius:10, border:`1px solid rgba(0,0,0,0.08)`, padding:"14px 10px 8px" };
  const title = { margin:"0 0 10px", fontWeight:500, fontSize:13, color:"#1a1a1a", textAlign:"center" };
  if (chart.type==="pie") {
    const data = chart.labels.map((l,i)=>({ name:l, value:chart.datasets[0].data[i] }));
    return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>{data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip content={<CustomTooltip/>}/></PieChart></ResponsiveContainer></div>;
  }
  const data = chart.labels.map((l,i)=>{ const pt={label:l}; chart.datasets.forEach(ds=>{pt[ds.label]=ds.data[i];}); return pt; });
  if (chart.type==="line") return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)"/><XAxis dataKey="label" tick={{fontSize:11,fill:"#666"}}/><YAxis tick={{fontSize:11,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:12}}/>}{chart.datasets.map((ds,i)=><Line key={i} type="monotone" dataKey={ds.label} stroke={ds.color||CHART_COLORS[i]} strokeWidth={2} dot={{r:3}}/>)}</LineChart></ResponsiveContainer></div>;
  return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><BarChart data={data} margin={{top:4,right:16,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)"/><XAxis dataKey="label" tick={{fontSize:11,fill:"#666"}}/><YAxis tick={{fontSize:11,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:12}}/>}{chart.datasets.map((ds,i)=><Bar key={i} dataKey={ds.label} fill={ds.color||CHART_COLORS[i]} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>;
}

function TypingDots() {
  return <div style={{display:"flex",gap:5,alignItems:"center",padding:"5px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:YELLOW,animation:"sb 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>)}<style>{`@keyframes sb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style></div>;
}

function Message({ msg, streaming }) {
  const isUser = msg.role==="user";
  if (isUser) return (
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16,gap:9,alignItems:"flex-start"}}>
      <div style={{maxWidth:"76%"}}>
        {msg.fileName&&<div style={{background:"#e8f0f4",borderRadius:"10px 10px 0 0",padding:"8px 14px",fontSize:12,color:NAVY,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid rgba(37,72,90,0.15)"}}><i className="ti ti-paperclip" style={{fontSize:13}}/>{msg.fileName}</div>}
        <div style={{background:NAVY,borderRadius:msg.fileName?"0 0 16px 16px":"16px 4px 16px 16px",padding:"11px 15px",fontSize:14,lineHeight:1.7,color:"#fff",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.content}</div>
      </div>
      <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"#fff8e6",border:`1px solid ${YELLOW}`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}><i className="ti ti-user" style={{fontSize:14,color:NAVY}}/></div>
    </div>
  );
  const isLoading = msg.content==="...";
  const {text,chart} = isLoading?{text:"...",chart:null}:parseMessage(msg.content);
  return (
    <div style={{display:"flex",justifyContent:"flex-start",marginBottom:16,gap:9,alignItems:"flex-start"}}>
      <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"#fff",border:`1px solid rgba(0,0,0,0.1)`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,overflow:"hidden",padding:3}}>
        <img src={LOGO_URL} alt="Somfy" style={{width:"100%",height:"auto"}}/>
      </div>
      <div style={{maxWidth:"82%",minWidth:0}}>
        <div style={{background:"#f5f7f9",border:`1px solid rgba(0,0,0,0.08)`,borderRadius:"4px 16px 16px 16px",padding:"11px 15px",fontSize:14,lineHeight:1.75,color:"#1a1a1a",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
          {isLoading?<TypingDots/>:text}
          {streaming&&<span style={{display:"inline-block",width:2,height:14,background:NAVY,marginLeft:2,animation:"blink 1s infinite"}}/>}
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>
        {!streaming&&chart&&<ChartBlock chart={chart}/>}
      </div>
    </div>
  );
}

function HistoryItem({ item, active, onClick, onDelete }) {
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:7,cursor:"pointer",background:active?"rgba(255,183,30,0.15)":"transparent",border:`1px solid ${active?"rgba(255,183,30,0.4)":"transparent"}`,marginBottom:2}}
    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="rgba(255,255,255,0.06)"; }}
    onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
      <i className="ti ti-message" style={{fontSize:12,color:"rgba(255,255,255,0.4)",flexShrink:0}}/>
      <span style={{flex:1,fontSize:11,color:active?YELLOW:"rgba(255,255,255,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</span>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:11,padding:"0 2px"}}
      onMouseEnter={e=>e.currentTarget.style.color="#ff6b6b"}
      onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}><i className="ti ti-x"/></button>
    </div>
  );
}

function exportPDF(messages, profile, title) {
  const date = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const content = messages.map(m=>{
    const {text} = parseMessage(m.content);
    if (m.role==="user") {
      const fileTag = m.fileName?`<div class="file-tag">📎 ${m.fileName}</div>`:"";
      return `<div class="message user">${fileTag}<div class="label">Question</div><div class="bubble user-bubble">${text}</div></div>`;
    }
    return `<div class="message agent"><div class="label">Somfy Agent</div><div class="bubble agent-bubble">${text.replace(/\n/g,"<br/>")}</div></div>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Somfy Agent — ${title}</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:40px;color:#1a1a1a;background:#fff}.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #25485A;margin-bottom:30px}.logo{display:flex;align-items:center;gap:12px}.logo-img{height:32px;width:auto}.logo-text p{margin:0;font-size:12px;color:#666}.meta{text-align:right;font-size:12px;color:#666}.meta strong{color:#25485A}.message{margin-bottom:20px}.label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;color:#999}.bubble{padding:14px 18px;border-radius:12px;font-size:14px;line-height:1.7}.user-bubble{background:#25485A;color:#fff}.agent-bubble{background:#f5f7f9;color:#1a1a1a;border:1px solid rgba(0,0,0,0.08)}.file-tag{font-size:12px;color:#25485A;margin-bottom:6px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#bbb;text-align:center}</style></head><body>
  <div class="header"><div class="logo"><img class="logo-img" src="${LOGO_URL}" alt="Somfy"/><div class="logo-text"><p>Protection solaire tertiaire</p></div></div><div class="meta"><strong>${profile}</strong><br/>${date}<br/>${messages.filter(m=>m.role==="user").length} échange${messages.filter(m=>m.role==="user").length>1?"s":""}</div></div>
  ${content}<div class="footer">Généré par Somfy Agent — ${date}</div>
  <script>window.onload=()=>window.print();</script></body></html>`;
  const win = window.open("","_blank");
  win.document.write(html);
  win.document.close();
}

async function readFileAsBase64(file) {
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result.split(",")[1]); r.onerror=()=>reject(new Error("Lecture impossible")); r.readAsDataURL(file); });
}
async function readFileAsText(file) {
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error("Lecture impossible")); r.readAsText(file); });
}
async function readDocxAsText(file) {
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=async(e)=>{ try{ const result=await window.mammoth.extractRawText({arrayBuffer:e.target.result}); resolve(result.value); }catch(err){ reject(err); } }; r.onerror=()=>reject(new Error("Lecture impossible")); r.readAsArrayBuffer(file); });
}
async function readXlsxAsText(file) {
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=(e)=>{ try{ const wb=window.XLSX.read(e.target.result,{type:"array"}); let text=""; wb.SheetNames.forEach(name=>{ text+=`\n[Feuille : ${name}]\n`; text+=window.XLSX.utils.sheet_to_csv(wb.Sheets[name]); }); resolve(text); }catch(err){ reject(err); } }; r.onerror=()=>reject(new Error("Lecture impossible")); r.readAsArrayBuffer(file); });
}
async function buildMessageContent(userText,file){
  if(!file) return userText;
  const ext=file.name.split(".").pop().toLowerCase();
  if(["jpg","jpeg","png","gif","webp"].includes(ext)){ const b64=await readFileAsBase64(file); const mt=ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="png"?"image/png":ext==="gif"?"image/gif":"image/webp"; return [{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:userText||"Analyse cette image."}]; }
  if(ext==="pdf"){ const b64=await readFileAsBase64(file); return [{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:userText||"Analyse ce document PDF."}]; }
  if(ext==="docx"||ext==="doc"){ const text=await readDocxAsText(file); return `[Fichier Word : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse ce document."}`; }
  if(ext==="xlsx"||ext==="xls"){ const text=await readXlsxAsText(file); return `[Fichier Excel : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse ce fichier Excel."}`; }
  const text=await readFileAsText(file); return `[Fichier : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse ce fichier."}`;
}
function getFileIcon(name){ const ext=name.split(".").pop().toLowerCase(); if(ext==="pdf") return "ti-file-type-pdf"; if(["jpg","jpeg","png","gif","webp"].includes(ext)) return "ti-photo"; if(["doc","docx"].includes(ext)) return "ti-file-type-doc"; if(["xls","xlsx","csv"].includes(ext)) return "ti-file-type-xls"; return "ti-file"; }
function getFileColor(name){ const ext=name.split(".").pop().toLowerCase(); if(ext==="pdf") return "#e74c3c"; if(["jpg","jpeg","png","gif","webp"].includes(ext)) return "#9b59b6"; if(["doc","docx"].includes(ext)) return "#2980b9"; if(["xls","xlsx","csv"].includes(ext)) return "#27ae60"; return "#666"; }

export default function App() {
  const [profile,setProfile]=useState("commercial");
  const [openCat,setOpenCat]=useState("prospection");
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState(false);
  const [histories,setHistories]=useState({commercial:[],marketing:[]});
  const [activeId,setActiveId]=useState({commercial:null,marketing:null});
  const [pendingFile,setPendingFile]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);

  const currentMessages=()=>{ const id=activeId[profile]; if(!id) return []; const conv=histories[profile].find(h=>h.id===id); return conv?conv.messages:[]; };
  const currentTitle=()=>{ const id=activeId[profile]; if(!id) return "Conversation"; const conv=histories[profile].find(h=>h.id===id); return conv?conv.title:"Conversation"; };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[histories,activeId,profile]);

  function newConversation(){ setActiveId(prev=>({...prev,[profile]:null})); setPendingFile(null); }
  function switchProfile(p){ setProfile(p); setOpenCat(PROFILES[p].categories[0].id); }

  function updateLastMsg(convId,profileKey,content){
    setHistories(prev=>({...prev,[profileKey]:prev[profileKey].map(h=>h.id===convId?{...h,messages:h.messages.slice(0,-1).concat([{role:"assistant",content}])}:h)}));
  }

  async function handleFile(file){
    if(!file) return;
    if(file.size>5*1024*1024){ alert("Fichier trop volumineux (max 5 Mo)"); return; }
    const ext=file.name.split(".").pop().toLowerCase();
    const allowed=["pdf","jpg","jpeg","png","gif","webp","doc","docx","xls","xlsx","csv","txt"];
    if(!allowed.includes(ext)){ alert("Format non supporté. Acceptés : PDF, images, Word, Excel, CSV, TXT"); return; }
    setPendingFile(file); inputRef.current?.focus();
  }

  async function sendMessage(text){
    const userText=(text||input).trim();
    if((!userText&&!pendingFile)||loading) return;
    const file=pendingFile;
    setInput(""); setPendingFile(null);
    const displayText=userText||(file?`Analyse du fichier : ${file.name}`:"");
    const msgs=currentMessages();
    const newUserMsg={role:"user",content:displayText,fileName:file?.name};
    const newMsgs=[...msgs,newUserMsg];
    let convId=activeId[profile];
    const profileKey=profile;
    if(!convId){
      convId=Date.now().toString();
      const title=displayText.slice(0,40)+(displayText.length>40?"...":"");
      setHistories(prev=>({...prev,[profileKey]:[{id:convId,title,messages:[]},...prev[profileKey]]}));
      setActiveId(prev=>({...prev,[profileKey]:convId}));
    }
    setHistories(prev=>({...prev,[profileKey]:prev[profileKey].map(h=>h.id===convId?{...h,messages:[...newMsgs,{role:"assistant",content:"..."}]}:h)}));
    setLoading(true); setStreaming(false);
    try{
      const msgContent=await buildMessageContent(userText,file);
      const apiMessages=[...msgs.map(m=>({role:m.role,content:m.content})),{role:"user",content:msgContent}];
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:1500,system:SYSTEM_PROMPT,tools:[{type:"web_search_20250305",name:"web_search"}],messages:apiMessages})});
      const reader=res.body.getReader(); const decoder=new TextDecoder();
      let fullText=""; let started=false;
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        const chunk=decoder.decode(value); const lines=chunk.split("\n");
        for(const line of lines){
          if(line.startsWith("data: ")){
            const data=line.slice(6); if(data==="[DONE]") continue;
            try{
              const parsed=JSON.parse(data);
              if(parsed.type==="content_block_delta"&&parsed.delta?.type==="text_delta"){
                if(!started){started=true;setStreaming(true);updateLastMsg(convId,profileKey,"");}
                fullText+=parsed.delta.text; updateLastMsg(convId,profileKey,fullText);
              }
            }catch{}
          }
        }
      }
      setStreaming(false);
      if(!started) updateLastMsg(convId,profileKey,"Je n'ai pas pu obtenir de réponse. Réessaie.");
    }catch(err){ setStreaming(false); updateLastMsg(convId,profileKey,`Erreur : ${err.message}`); }
    finally{ setLoading(false); setTimeout(()=>inputRef.current?.focus(),100); }
  }

  function deleteConv(id){ setHistories(prev=>({...prev,[profile]:prev[profile].filter(h=>h.id!==id)})); if(activeId[profile]===id) setActiveId(prev=>({...prev,[profile]:null})); }

  const currentProfile=PROFILES[profile];
  const currentCat=currentProfile.categories.find(c=>c.id===openCat)||currentProfile.categories[0];
  const messages=currentMessages();
  const profileHistory=histories[profile];
  const isStreaming=streaming&&messages.length>0&&messages[messages.length-1]?.role==="assistant";

  return (
    <div style={{display:"flex",height:640,background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.10)",border:`1px solid rgba(0,0,0,0.08)`}}>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      <div style={{width:220,background:NAVY,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
        <div style={{padding:"16px 14px 13px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <img src={LOGO_URL} alt="Somfy" style={{height:28,width:"auto",filter:"brightness(0) invert(1)"}}/>
        </div>
        <div style={{padding:"11px 11px 7px"}}>
          <p style={{margin:"0 0 7px 3px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Profil</p>
          <div style={{display:"flex",gap:5}}>
            {Object.entries(PROFILES).map(([key,p])=>(
              <button key={key} onClick={()=>switchProfile(key)} style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",background:profile===key?YELLOW:"rgba(255,255,255,0.07)",border:profile===key?"none":`1px solid rgba(255,255,255,0.12)`,color:profile===key?NAVY:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:profile===key?600:400,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <i className={`ti ${p.icon}`} style={{fontSize:15}}/>{p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"2px 9px 4px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <p style={{margin:"6px 3px 7px",fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Raccourcis</p>
          {currentProfile.categories.map(cat=>(
            <div key={cat.id}>
              <button onClick={()=>setOpenCat(openCat===cat.id?null:cat.id)} style={{width:"100%",padding:"7px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,background:openCat===cat.id?"rgba(255,183,30,0.18)":"transparent",border:`1px solid ${openCat===cat.id?"rgba(255,183,30,0.4)":"transparent"}`,color:openCat===cat.id?YELLOW:"rgba(255,255,255,0.7)",fontSize:12,display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
                <i className={`ti ${cat.icon}`} style={{fontSize:14,flexShrink:0}}/><span style={{flex:1}}>{cat.label}</span><i className={`ti ti-chevron-${openCat===cat.id?"down":"right"}`} style={{fontSize:11,opacity:0.5}}/>
              </button>
              {openCat===cat.id&&(
                <div style={{marginLeft:10,marginBottom:4,borderLeft:`1.5px solid rgba(255,183,30,0.25)`,paddingLeft:9}}>
                  {cat.prompts.map((p,i)=><button key={i} onClick={()=>sendMessage(p.text)} style={{width:"100%",padding:"4px 6px",borderRadius:5,cursor:"pointer",textAlign:"left",background:"transparent",border:"none",color:"rgba(255,255,255,0.5)",fontSize:11,lineHeight:1.4,display:"block",marginBottom:1}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>{p.label}</button>)}
                  {cat.id==="prospection"&&profile==="commercial"&&<PlaceSearchWidget onSearch={sendMessage}/>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 9px 4px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
            <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Historique</p>
            <button onClick={newConversation} style={{background:"rgba(255,183,30,0.15)",border:`1px solid rgba(255,183,30,0.3)`,borderRadius:5,padding:"2px 7px",cursor:"pointer",color:YELLOW,fontSize:10}}>+ Nouveau</button>
          </div>
          {profileHistory.length===0?<p style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontStyle:"italic",margin:"4px 3px"}}>Aucune conversation</p>:profileHistory.map(h=><HistoryItem key={h.id} item={h} active={activeId[profile]===h.id} onClick={()=>setActiveId(prev=>({...prev,[profile]:h.id}))} onDelete={()=>deleteConv(h.id)}/>)}
        </div>
        <div style={{padding:"8px 10px 12px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:"#3dba6e"}}/><span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Recherche web active</span></div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
        <div style={{padding:"12px 18px",borderBottom:`1px solid rgba(0,0,0,0.08)`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:NAVY,display:"flex",alignItems:"center",justifyContent:"center"}}><i className={`ti ${currentCat.icon}`} style={{fontSize:14,color:YELLOW}}/></div>
            <div><p style={{margin:0,fontWeight:500,fontSize:14,color:"#1a1a1a"}}>{currentCat.label}</p><p style={{margin:0,fontSize:11,color:"#666"}}>{currentCat.desc}</p></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {isStreaming&&<span style={{fontSize:11,color:NAVY,background:"#fff8e6",padding:"3px 10px",borderRadius:20,border:`1px solid ${YELLOW}`}}>✍️ Rédaction...</span>}
            {messages.length>0&&!isStreaming&&<button onClick={()=>exportPDF(messages,currentProfile.label,currentTitle())} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:`1px solid rgba(0,0,0,0.12)`,background:"#f5f7f9",cursor:"pointer",fontSize:11,color:NAVY,fontWeight:500}}><i className="ti ti-file-download" style={{fontSize:13}}/> PDF</button>}
            <span style={{fontSize:11,color:"#666",background:"#f5f7f9",padding:"3px 10px",borderRadius:20,border:`1px solid rgba(0,0,0,0.08)`}}>{currentProfile.label}</span>
            {messages.length>0&&<span style={{fontSize:11,color:"#999",background:"#f5f7f9",padding:"3px 10px",borderRadius:20,border:`1px solid rgba(0,0,0,0.08)`}}>{messages.filter(m=>m.role==="user").length} échange{messages.filter(m=>m.role==="user").length>1?"s":""}</span>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px 10px",background:dragOver?"#f0f8ff":"#fff",transition:"background 0.2s",position:"relative"}}>
          {dragOver&&<div style={{position:"absolute",inset:0,background:"rgba(37,72,90,0.06)",border:`2px dashed ${NAVY}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,pointerEvents:"none"}}><div style={{textAlign:"center"}}><i className="ti ti-cloud-upload" style={{fontSize:32,color:NAVY,display:"block",marginBottom:8}}/><p style={{margin:0,fontWeight:500,color:NAVY}}>Déposez votre fichier ici</p><p style={{margin:"4px 0 0",fontSize:12,color:"#666"}}>PDF, image, Word, Excel, CSV</p></div></div>}
          {messages.length===0?(
            <div style={{paddingTop:6}}>
              <p style={{margin:"0 0 5px",fontSize:15,fontWeight:500,color:"#1a1a1a"}}>Bonjour, que puis-je faire pour vous ?</p>
              <p style={{margin:"0 0 18px",fontSize:13,color:"#666"}}>Posez une question, uploadez un fichier ou choisissez une suggestion :</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {currentCat.prompts.map((p,i)=>(
                  <button key={i} onClick={()=>sendMessage(p.text)} style={{padding:"12px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",background:"#f5f7f9",border:`1px solid rgba(0,0,0,0.08)`,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:14,color:"#1a1a1a"}} onMouseEnter={e=>e.currentTarget.style.borderColor=YELLOW} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.08)"}>
                    <span>{p.label}</span><i className="ti ti-arrow-right" style={{fontSize:13,color:"#999",flexShrink:0,marginLeft:10}}/>
                  </button>
                ))}
              </div>
            </div>
          ):messages.map((msg,i)=><Message key={i} msg={msg} streaming={isStreaming&&i===messages.length-1}/>)}
          <div ref={bottomRef}/>
        </div>
        {pendingFile&&(
          <div style={{padding:"8px 16px",background:"#f0f8f4",borderTop:`1px solid rgba(0,0,0,0.06)`,display:"flex",alignItems:"center",gap:10}}>
            <i className={`ti ${getFileIcon(pendingFile.name)}`} style={{fontSize:18,color:getFileColor(pendingFile.name),flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:13,fontWeight:500,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pendingFile.name}</p>
              <p style={{margin:0,fontSize:11,color:"#666"}}>{(pendingFile.size/1024).toFixed(0)} Ko — prêt à envoyer</p>
            </div>
            <button onClick={()=>setPendingFile(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:16}}><i className="ti ti-x"/></button>
          </div>
        )}
        <div style={{padding:"10px 16px 14px",borderTop:`1px solid rgba(0,0,0,0.08)`,background:"#fff"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#f5f7f9",borderRadius:12,border:`1px solid ${(input.trim()||pendingFile)?YELLOW:"rgba(0,0,0,0.12)"}`,padding:"8px 8px 8px 14px",transition:"border-color 0.15s"}}>
            <button onClick={()=>fileRef.current?.click()} style={{width:30,height:30,borderRadius:7,border:`1px solid rgba(0,0,0,0.12)`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#666"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=NAVY;e.currentTarget.style.color=NAVY;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.12)";e.currentTarget.style.color="#666";}}>
              <i className="ti ti-cloud-upload" style={{fontSize:15}}/>
            </button>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={pendingFile?"Ajoutez un message ou envoyez directement...":"Posez votre question ou déposez un fichier..."} rows={1} disabled={loading} style={{flex:1,resize:"none",border:"none",background:"transparent",fontSize:14,color:"#1a1a1a",lineHeight:1.5,outline:"none",maxHeight:100,overflow:"auto"}}/>
            <button onClick={()=>sendMessage()} disabled={(!input.trim()&&!pendingFile)||loading} style={{width:36,height:36,borderRadius:9,border:"none",background:(input.trim()||pendingFile)&&!loading?NAVY:"#e8e8e8",cursor:(input.trim()||pendingFile)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s",flexShrink:0}}>
              <i className="ti ti-arrow-up" style={{fontSize:16,color:(input.trim()||pendingFile)&&!loading?YELLOW:"#aaa"}}/>
            </button>
          </div>
          <p style={{margin:"6px 0 0",fontSize:11,color:"#bbb",textAlign:"center"}}>Entrée pour envoyer · ☁️ pour joindre un fichier · ou glissez-déposez</p>
        </div>
      </div>
    </div>
  );
}
