import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#25485A";
const YELLOW = "#FFB71E";
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
- Pour les appels d'offres, consulte le BOAMP et marches-publics.gouv.fr

GRAPHIQUES : quand tu as des données chiffrées comparatives, ajoute à la fin :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END
Types disponibles : bar, line, pie, multibar.`;

const PROFILES = {
  commercial: {
    label: "Commercial", icon: "🎯",
    categories: [
      { id:"prospection", label:"Prospection", icon:"🎯", desc:"Appels d'offres et projets",
        prompts:[
          { label:"AO rénovation écoles", text:"Recherche les appels d'offres publics sur le BOAMP pour la rénovation d'écoles avec volets roulants ou protection solaire en France ce mois-ci." },
          { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire ?" },
          { label:"Hôpitaux en rénovation", text:"Recherche les appels d'offres sur le BOAMP pour la rénovation d'hôpitaux ou bâtiments de santé en France." },
          { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine immobilier ?" },
        ]},
      { id:"pitch", label:"Arguments de vente", icon:"💬", desc:"Pitch par interlocuteur",
        prompts:[
          { label:"Pitch bureau d'études", text:"Rédige-moi un pitch fluide pour convaincre un bureau d'études thermique de prescrire les solutions Somfy." },
          { label:"Pitch mairie / école", text:"Comment convaincre un élu de mairie d'investir dans des protections solaires automatisées pour ses écoles ?" },
          { label:"Pitch facility manager", text:"Quels arguments pour un facility manager sur les bénéfices concrets des protections solaires automatisées ?" },
          { label:"Pitch promoteur", text:"Comment convaincre un promoteur immobilier tertiaire d'intégrer Somfy dès la conception ?" },
        ]},
      { id:"concurrence", label:"Analyse concurrents", icon:"📊", desc:"Benchmark et veille",
        prompts:[
          { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire tertiaire." },
          { label:"Benchmark concurrents", text:"Compare Somfy, Schneider, Varema, Nice et Yokis sur l'automatisme de protection solaire tertiaire." },
          { label:"Parts de marché tertiaire", text:"Quelles sont les parts de marché estimées des acteurs sur l'automatisme de protection solaire tertiaire en France ?" },
          { label:"Nouveaux entrants", text:"Y a-t-il de nouveaux acteurs sur le marché de l'automatisation des protections solaires en tertiaire ?" },
        ]},
      { id:"installateurs", label:"Réseau installateurs", icon:"🔧", desc:"Formation et animation réseau",
        prompts:[
          { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à se lancer sur la protection solaire tertiaire ?" },
          { label:"Arguments pour installateurs", text:"Comment convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
        ]},
    ]
  },
  marketing: {
    label: "Marketing", icon: "📈",
    categories: [
      { id:"veille", label:"Veille marché", icon:"📡", desc:"Tendances et actualités",
        prompts:[
          { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire tertiaire en France en 2025 ?" },
          { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire tertiaire en France ?" },
          { label:"Protocoles GTB émergents", text:"Quels protocoles GTB gagnent du terrain en France en 2025 ?" },
          { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
        ]},
      { id:"reglementation", label:"Réglementation", icon:"📋", desc:"Décrets et normes",
        prompts:[
          { label:"Décret BACS complet", text:"Explique-moi le décret BACS, ses obligations, ses seuils et son impact pour Somfy." },
          { label:"Décret tertiaire 2025", text:"Où en est l'application du décret tertiaire en 2025 et quelles sont les obligations actuelles ?" },
          { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent aux protections solaires ?" },
        ]},
      { id:"confort_ete", label:"Confort d'été", icon:"☀️", desc:"Arguments thermiques et données",
        prompts:[
          { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques concrets avec des BSO ou screens automatisés ?" },
          { label:"Protection solaire vs clim", text:"Compare les bénéfices d'une protection solaire automatisée face à la climatisation." },
          { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ?" },
        ]},
      { id:"communication", label:"Communication", icon:"📣", desc:"Contenu et messages clés",
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
  const [loadingAO, setLoadingAO] = useState(false);
  async function handleSubmit() {
    if (!keywords.trim()) return;
    setLoadingAO(true);
    try {
      const res = await fetch("/api/boamp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({keywords:keywords.trim()}) });
      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) {
        onSearch(`J'ai recherché "${keywords}" sur le BOAMP mais aucun appel d'offres n'a été trouvé. Suggère d'autres mots clés pertinents pour Somfy.`);
      } else {
        const summary = results.slice(0,8).map((r,i)=>{
          const title=r.titre||r.intitule||"Sans titre";
          const org=r.donnees?.identite?.denomination||r.organisme||"";
          const date=r.dateparution||r.date||"";
          const dept=r.donnees?.lieu?.departement||"";
          return `${i+1}. ${title}${org?` — ${org}`:""}${dept?` (${dept})`:""}${date?` — publié le ${date}`:""}`;
        }).join("\n");
        onSearch(`Voici ${results.length} appels d'offres trouvés sur le BOAMP pour "${keywords}" :\n\n${summary}\n\nAnalyse ces résultats : lesquels sont les plus pertinents pour Somfy ?`);
      }
    } catch {
      onSearch(`Recherche BOAMP pour "${keywords}" — analyse les opportunités d'appels d'offres publics français pour Somfy.`);
    } finally { setLoadingAO(false); setKeywords(""); }
  }
  return (
    <div style={{margin:"10px 0 4px",padding:"10px 12px",background:"rgba(255,183,30,0.08)",borderRadius:8,border:"1px solid rgba(255,183,30,0.25)"}}>
      <p style={{margin:"0 0 6px",fontSize:11,fontWeight:700,color:YELLOW}}>🇫🇷 BOAMP Direct</p>
      <p style={{margin:"0 0 7px",fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.4}}>Résultats officiels directement dans le chat</p>
      <div style={{display:"flex",gap:5}}>
        <input value={keywords} onChange={e=>setKeywords(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder="ex: volets roulants école" disabled={loadingAO}
          style={{flex:1,padding:"6px 9px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={handleSubmit} disabled={!keywords.trim()||loadingAO} style={{padding:"6px 12px",borderRadius:6,border:"none",cursor:keywords.trim()&&!loadingAO?"pointer":"default",background:keywords.trim()&&!loadingAO?YELLOW:"rgba(255,255,255,0.1)",color:keywords.trim()&&!loadingAO?NAVY:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:700}}>
          {loadingAO?"...":"Go"}
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
    <div style={{background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,padding:"8px 12px",fontSize:12}}>
      {label&&<p style={{margin:"0 0 4px",fontWeight:500}}>{label}</p>}
      {payload.map((p,i)=><p key={i} style={{margin:"2px 0",color:p.color}}>{p.name} : <strong>{p.value}</strong></p>)}
    </div>
  );
};

function ChartBlock({ chart }) {
  if (!chart) return null;
  const h=200;
  const card={marginTop:10,background:"#fff",borderRadius:10,border:"1px solid rgba(0,0,0,0.08)",padding:"12px 8px 6px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"};
  const title={margin:"0 0 8px",fontWeight:600,fontSize:12,color:NAVY,textAlign:"center"};
  if (chart.type==="pie") {
    const data=chart.labels.map((l,i)=>({name:l,value:chart.datasets[0].data[i]}));
    return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip content={<CustomTooltip/>}/></PieChart></ResponsiveContainer></div>;
  }
  const data=chart.labels.map((l,i)=>{const pt={label:l};chart.datasets.forEach(ds=>{pt[ds.label]=ds.data[i];});return pt;});
  if (chart.type==="line") return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:4,right:8,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="label" tick={{fontSize:10,fill:"#666"}}/><YAxis tick={{fontSize:10,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:11}}/>}{chart.datasets.map((ds,i)=><Line key={i} type="monotone" dataKey={ds.label} stroke={ds.color||CHART_COLORS[i]} strokeWidth={2} dot={{r:2}}/>)}</LineChart></ResponsiveContainer></div>;
  return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><BarChart data={data} margin={{top:4,right:8,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="label" tick={{fontSize:10,fill:"#666"}}/><YAxis tick={{fontSize:10,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:11}}/>}{chart.datasets.map((ds,i)=><Bar key={i} dataKey={ds.label} fill={ds.color||CHART_COLORS[i]} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>;
}

function TypingDots() {
  return <div style={{display:"flex",gap:5,alignItems:"center",padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:YELLOW,animation:"sb 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>)}<style>{`@keyframes sb{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style></div>;
}

function Message({ msg, streaming, isMobile }) {
  const isUser = msg.role==="user";
  if (isUser) return (
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14,gap:8,alignItems:"flex-start"}}>
      <div style={{maxWidth:isMobile?"88%":"74%"}}>
        {msg.fileName&&<div style={{background:"#e8f0f4",borderRadius:"8px 8px 0 0",padding:"6px 12px",fontSize:11,color:NAVY,display:"flex",alignItems:"center",gap:5}}><span>📎</span>{msg.fileName}</div>}
        <div style={{background:NAVY,borderRadius:msg.fileName?"0 0 14px 14px":"14px 2px 14px 14px",padding:"10px 14px",fontSize:isMobile?13:14,lineHeight:1.7,color:"#fff",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.content}</div>
      </div>
      {!isMobile&&<div style={{width:30,height:30,borderRadius:7,background:"#e8f0f4",border:`2px solid ${YELLOW}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,fontSize:13}}>👤</div>}
    </div>
  );
  const isLoading = msg.content==="...";
  const {text,chart} = isLoading?{text:"...",chart:null}:parseMessage(msg.content);
  return (
    <div style={{display:"flex",justifyContent:"flex-start",marginBottom:14,gap:8,alignItems:"flex-start"}}>
      <div style={{width:30,height:30,borderRadius:7,background:YELLOW,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,fontWeight:900,fontSize:12,color:NAVY}}>S</div>
      <div style={{maxWidth:isMobile?"88%":"80%",minWidth:0}}>
        <div style={{background:"#fff",border:"1px solid rgba(37,72,90,0.1)",borderRadius:"2px 14px 14px 14px",padding:"10px 14px",fontSize:isMobile?13:14,lineHeight:1.75,color:"#1a1a1a",whiteSpace:"pre-wrap",wordBreak:"break-word",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
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
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:active?"rgba(255,183,30,0.12)":"transparent",borderLeft:`3px solid ${active?YELLOW:"transparent"}`,marginBottom:2}}
    onMouseEnter={e=>{ if(!active)e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
    onMouseLeave={e=>{ if(!active)e.currentTarget.style.background="transparent";}}>
      <span style={{fontSize:12}}>💬</span>
      <span style={{flex:1,fontSize:11,color:active?"#fff":"rgba(255,255,255,0.55)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</span>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:13,padding:"0 2px"}}
      onMouseEnter={e=>e.currentTarget.style.color="#ff6b6b"}
      onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.25)"}>✕</button>
    </div>
  );
}

function exportPDF(messages, profile, title) {
  const date=new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const content=messages.map(m=>{
    const {text}=parseMessage(m.content);
    if(m.role==="user"){const ft=m.fileName?`<div class="file-tag">📎 ${m.fileName}</div>`:"";return `<div class="message user">${ft}<div class="label">Question</div><div class="bubble user-bubble">${text}</div></div>`;}
    return `<div class="message agent"><div class="label">Somfy Agent</div><div class="bubble agent-bubble">${text.replace(/\n/g,"<br/>")}</div></div>`;
  }).join("");
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Somfy Agent — ${title}</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;color:#1a1a1a;background:#fff}.header{background:#FFB71E;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.ht{font-size:20px;font-weight:900;color:#25485A}.meta{text-align:right;font-size:12px;color:rgba(37,72,90,0.7)}.body{padding:0 32px 32px}.message{margin-bottom:18px}.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;color:#999}.bubble{padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.7}.user-bubble{background:#25485A;color:#fff}.agent-bubble{background:#f9f9f9;color:#1a1a1a;border:1px solid rgba(0,0,0,0.08)}.file-tag{font-size:11px;color:#25485A;margin-bottom:5px}.footer{margin-top:32px;padding:12px 32px;border-top:3px solid #FFB71E;font-size:11px;color:#999;display:flex;justify-content:space-between}</style></head><body>
  <div class="header"><div><div class="ht">SOMFY Agent IA</div></div><div class="meta"><strong>${profile}</strong> · ${date} · ${messages.filter(m=>m.role==="user").length} échange${messages.filter(m=>m.role==="user").length>1?"s":""}</div></div>
  <div class="body">${content}</div>
  <div class="footer"><span>Somfy Agent — Protection solaire tertiaire</span><span>${date}</span></div>
  <script>window.onload=()=>window.print();</script></body></html>`;
  const win=window.open("","_blank");win.document.write(html);win.document.close();
}

async function readFileAsBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(",")[1]);r.onerror=()=>reject(new Error("Erreur"));r.readAsDataURL(file);});}
async function readFileAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Erreur"));r.readAsText(file);});}
async function readDocxAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=async(e)=>{try{const res=await window.mammoth.extractRawText({arrayBuffer:e.target.result});resolve(res.value);}catch(err){reject(err);}};r.onerror=()=>reject(new Error("Erreur"));r.readAsArrayBuffer(file);});}
async function readXlsxAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=(e)=>{try{const wb=window.XLSX.read(e.target.result,{type:"array"});let text="";wb.SheetNames.forEach(name=>{text+=`\n[Feuille : ${name}]\n`;text+=window.XLSX.utils.sheet_to_csv(wb.Sheets[name]);});resolve(text);}catch(err){reject(err);}};r.onerror=()=>reject(new Error("Erreur"));r.readAsArrayBuffer(file);});}
async function buildMessageContent(userText,file){
  if(!file) return userText;
  const ext=file.name.split(".").pop().toLowerCase();
  if(["jpg","jpeg","png","gif","webp"].includes(ext)){const b64=await readFileAsBase64(file);const mt=ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="png"?"image/png":ext==="gif"?"image/gif":"image/webp";return [{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:userText||"Analyse cette image."}];}
  if(ext==="pdf"){const b64=await readFileAsBase64(file);return [{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:userText||"Analyse ce PDF."}];}
  if(ext==="docx"||ext==="doc"){const text=await readDocxAsText(file);return `[Word : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;}
  if(ext==="xlsx"||ext==="xls"){const text=await readXlsxAsText(file);return `[Excel : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;}
  const text=await readFileAsText(file);return `[Fichier : ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;
}
function getFileIcon(name){const ext=name.split(".").pop().toLowerCase();if(ext==="pdf")return "📄";if(["jpg","jpeg","png","gif","webp"].includes(ext))return "🖼️";if(["doc","docx"].includes(ext))return "📝";if(["xls","xlsx","csv"].includes(ext))return "📊";return "📁";}

function Sidebar({ profile, setProfile, openCat, setOpenCat, currentProfile, sendMessage, newConversation, profileHistory, activeId, setActiveId, deleteConv, isMobile, closeSidebar }) {
  function switchProfile(p){ setProfile(p); setOpenCat(PROFILES[p].categories[0].id); if(isMobile) closeSidebar(); }
  return (
    <div style={{width:isMobile?"100%":"220px",background:NAVY,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Bandeau SOMFY */}
      <div style={{background:`linear-gradient(90deg,${YELLOW},#f0a800)`,padding:"13px 16px",borderBottom:"2px solid rgba(37,72,90,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <span style={{fontSize:19,fontWeight:900,color:NAVY,letterSpacing:"-0.5px"}}>SOMFY</span>
            <span style={{fontSize:9,color:"rgba(37,72,90,0.55)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Agent IA</span>
          </div>
          <p style={{margin:"1px 0 0",fontSize:10,color:"rgba(37,72,90,0.55)"}}>Protection solaire tertiaire</p>
        </div>
        {isMobile&&<button onClick={closeSidebar} style={{background:"rgba(37,72,90,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:NAVY,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
      </div>

      {/* Profil */}
      <div style={{padding:"12px 12px 8px"}}>
        <div style={{display:"flex",gap:4}}>
          {Object.entries(PROFILES).map(([key,p])=>(
            <button key={key} onClick={()=>switchProfile(key)} style={{flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",background:profile===key?YELLOW:"rgba(255,255,255,0.07)",border:profile===key?"none":"1px solid rgba(255,255,255,0.1)",color:profile===key?NAVY:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:profile===key?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:16}}>{p.icon}</span>{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catégories */}
      <div style={{padding:"0 10px 8px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <p style={{margin:"4px 2px 8px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Navigation</p>
        {currentProfile.categories.map(cat=>(
          <div key={cat.id}>
            <button onClick={()=>setOpenCat(openCat===cat.id?null:cat.id)} style={{width:"100%",padding:"9px 10px",borderRadius:6,cursor:"pointer",marginBottom:2,background:openCat===cat.id?"rgba(255,183,30,0.12)":"transparent",borderLeft:`3px solid ${openCat===cat.id?YELLOW:"transparent"}`,color:openCat===cat.id?"#fff":"rgba(255,255,255,0.55)",fontSize:13,display:"flex",alignItems:"center",gap:8,textAlign:"left"}}>
              <span style={{fontSize:15}}>{cat.icon}</span><span style={{flex:1}}>{cat.label}</span><span style={{fontSize:10,opacity:0.4}}>{openCat===cat.id?"▼":"▶"}</span>
            </button>
            {openCat===cat.id&&(
              <div style={{marginLeft:12,paddingLeft:10,borderLeft:"2px solid rgba(255,183,30,0.3)",marginBottom:4}}>
                {cat.prompts.map((p,i)=><button key={i} onClick={()=>{sendMessage(p.text);if(isMobile)closeSidebar();}} style={{width:"100%",padding:"6px 6px",borderRadius:5,cursor:"pointer",textAlign:"left",background:"transparent",border:"none",color:"rgba(255,255,255,0.45)",fontSize:12,lineHeight:1.4,display:"block",marginBottom:1}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>{p.label}</button>)}
                {cat.id==="prospection"&&profile==="commercial"&&<PlaceSearchWidget onSearch={(t)=>{sendMessage(t);if(isMobile)closeSidebar();}}/>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Historique */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 10px 4px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Historique</p>
          <button onClick={()=>{newConversation();if(isMobile)closeSidebar();}} style={{background:"rgba(255,183,30,0.12)",border:"1px solid rgba(255,183,30,0.25)",borderRadius:5,padding:"3px 8px",cursor:"pointer",color:YELLOW,fontSize:10,fontWeight:700}}>+ Nouveau</button>
        </div>
        {profileHistory.length===0?<p style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontStyle:"italic",margin:"4px 2px"}}>Aucune conversation</p>:profileHistory.map(h=><HistoryItem key={h.id} item={h} active={activeId[profile]===h.id} onClick={()=>{setActiveId(prev=>({...prev,[profile]:h.id}));if(isMobile)closeSidebar();}} onDelete={()=>deleteConv(h.id)}/>)}
      </div>

      <div style={{padding:"8px 12px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:"#3dba6e"}}/><span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Recherche web active</span></div>
      </div>
    </div>
  );
}

export default function App() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const isMobile = windowWidth < 768;

  useEffect(()=>{
    const handleResize=()=>setWindowWidth(window.innerWidth);
    window.addEventListener("resize",handleResize);
    return ()=>window.removeEventListener("resize",handleResize);
  },[]);

  const currentMessages=()=>{const id=activeId[profile];if(!id)return[];const conv=histories[profile].find(h=>h.id===id);return conv?conv.messages:[];};
  const currentTitle=()=>{const id=activeId[profile];if(!id)return "Conversation";const conv=histories[profile].find(h=>h.id===id);return conv?conv.title:"Conversation";};

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[histories,activeId,profile]);

  function newConversation(){setActiveId(prev=>({...prev,[profile]:null}));setPendingFile(null);}
  function updateLastMsg(convId,profileKey,content){setHistories(prev=>({...prev,[profileKey]:prev[profileKey].map(h=>h.id===convId?{...h,messages:h.messages.slice(0,-1).concat([{role:"assistant",content}])}:h)}));}

  async function handleFile(file){
    if(!file)return;
    if(file.size>5*1024*1024){alert("Max 5 Mo");return;}
    const ext=file.name.split(".").pop().toLowerCase();
    if(!["pdf","jpg","jpeg","png","gif","webp","doc","docx","xls","xlsx","csv","txt"].includes(ext)){alert("Format non supporté");return;}
    setPendingFile(file);inputRef.current?.focus();
  }

  async function sendMessage(text){
    const userText=(text||input).trim();
    if((!userText&&!pendingFile)||loading)return;
    const file=pendingFile;
    setInput("");setPendingFile(null);
    const displayText=userText||(file?`Analyse : ${file.name}`:"");
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
    setLoading(true);setStreaming(false);
    try{
      const msgContent=await buildMessageContent(userText,file);
      const apiMessages=[...msgs.map(m=>({role:m.role,content:m.content})),{role:"user",content:msgContent}];
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:1500,system:SYSTEM_PROMPT,tools:[{type:"web_search_20250305",name:"web_search"}],messages:apiMessages})});
      const reader=res.body.getReader();const decoder=new TextDecoder();
      let fullText="";let started=false;
      while(true){
        const {done,value}=await reader.read();if(done)break;
        const chunk=decoder.decode(value);const lines=chunk.split("\n");
        for(const line of lines){
          if(line.startsWith("data: ")){const data=line.slice(6);if(data==="[DONE]")continue;
            try{const parsed=JSON.parse(data);if(parsed.type==="content_block_delta"&&parsed.delta?.type==="text_delta"){if(!started){started=true;setStreaming(true);updateLastMsg(convId,profileKey,"");}fullText+=parsed.delta.text;updateLastMsg(convId,profileKey,fullText);}}catch{}
          }
        }
      }
      setStreaming(false);
      if(!started)updateLastMsg(convId,profileKey,"Je n'ai pas pu obtenir de réponse. Réessaie.");
    }catch(err){setStreaming(false);updateLastMsg(convId,profileKey,`Erreur : ${err.message}`);}
    finally{setLoading(false);setTimeout(()=>inputRef.current?.focus(),100);}
  }

  function deleteConv(id){setHistories(prev=>({...prev,[profile]:prev[profile].filter(h=>h.id!==id)}));if(activeId[profile]===id)setActiveId(prev=>({...prev,[profile]:null}));}

  const currentProfile=PROFILES[profile];
  const currentCat=currentProfile.categories.find(c=>c.id===openCat)||currentProfile.categories[0];
  const messages=currentMessages();
  const profileHistory=histories[profile];
  const isStreaming=streaming&&messages.length>0&&messages[messages.length-1]?.role==="assistant";

  const sidebarProps = {
    profile, setProfile, openCat, setOpenCat, currentProfile, sendMessage,
    newConversation, profileHistory, activeId, setActiveId, deleteConv,
    isMobile, closeSidebar: ()=>setSidebarOpen(false)
  };

  return (
    <div style={{display:"flex",height:isMobile?"100dvh":"640px",background:"#fafafa",borderRadius:isMobile?0:16,overflow:"hidden",boxShadow:isMobile?"none":"0 4px 24px rgba(0,0,0,0.12)",border:isMobile?"none":"1px solid rgba(0,0,0,0.06)",position:"relative",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

      {/* Sidebar desktop — fixe */}
      {!isMobile&&(
        <div style={{width:220,flexShrink:0,height:"100%"}}>
          <Sidebar {...sidebarProps}/>
        </div>
      )}

      {/* Sidebar mobile — overlay coulissant */}
      {isMobile&&sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40}}/>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:"85%",maxWidth:320,zIndex:50,display:"flex",flexDirection:"column",animation:"slideIn 0.25s ease"}}>
            <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            <Sidebar {...sidebarProps}/>
          </div>
        </>
      )}

      {/* Zone principale */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>

        {/* Header */}
        <div style={{background:"#fff",borderBottom:`3px solid ${YELLOW}`,padding:isMobile?"10px 14px":"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            {isMobile&&(
              <button onClick={()=>setSidebarOpen(true)} style={{width:38,height:38,borderRadius:8,background:NAVY,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:YELLOW,fontSize:18,fontWeight:700}}>☰</span>
              </button>
            )}
            <span style={{fontSize:isMobile?18:20}}>{currentCat.icon}</span>
            <div style={{minWidth:0}}>
              <p style={{margin:0,fontWeight:700,fontSize:isMobile?13:14,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentCat.label}</p>
              {!isMobile&&<p style={{margin:0,fontSize:11,color:"#888"}}>{currentCat.desc}</p>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {isStreaming&&<span style={{fontSize:10,background:"#fff8e6",color:NAVY,padding:"3px 8px",borderRadius:20,border:`1px solid ${YELLOW}`,fontWeight:500}}>✍️</span>}
            {messages.length>0&&!isStreaming&&(
              <button onClick={()=>exportPDF(messages,currentProfile.label,currentTitle())} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,background:NAVY,border:"none",cursor:"pointer",fontSize:11,color:YELLOW,fontWeight:700}}>
                ↓ PDF
              </button>
            )}
            {!isMobile&&<span style={{fontSize:11,background:"rgba(37,72,90,0.08)",color:NAVY,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{currentProfile.label}</span>}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px 8px":"20px 22px 10px",background:dragOver?"#f0f8ff":"#fafafa",transition:"background 0.2s",position:"relative"}}>
          {dragOver&&<div style={{position:"absolute",inset:0,background:"rgba(37,72,90,0.05)",border:`2px dashed ${NAVY}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,pointerEvents:"none"}}><div style={{textAlign:"center"}}><span style={{fontSize:32,display:"block",marginBottom:8}}>☁️</span><p style={{margin:0,fontWeight:700,color:NAVY,fontSize:14}}>Déposez ici</p></div></div>}
          {messages.length===0?(
            <div>
              <p style={{margin:"0 0 4px",fontSize:isMobile?15:16,fontWeight:700,color:NAVY}}>Bonjour !</p>
              <p style={{margin:"0 0 16px",fontSize:13,color:"#888"}}>Choisissez une suggestion ou posez votre question.</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {currentCat.prompts.map((p,i)=>(
                  <button key={i} onClick={()=>sendMessage(p.text)} style={{padding:"11px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",background:"#fff",border:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:NAVY,fontWeight:500,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=YELLOW}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.08)"}>
                    <span>{p.label}</span><span style={{color:YELLOW,fontWeight:700,fontSize:15}}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ):messages.map((msg,i)=><Message key={i} msg={msg} streaming={isStreaming&&i===messages.length-1} isMobile={isMobile}/>)}
          <div ref={bottomRef}/>
        </div>

        {/* Fichier en attente */}
        {pendingFile&&(
          <div style={{padding:"7px 14px",background:"#fff8e6",borderTop:`1px solid ${YELLOW}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{getFileIcon(pendingFile.name)}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:12,fontWeight:600,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pendingFile.name}</p>
              <p style={{margin:0,fontSize:10,color:"#888"}}>{(pendingFile.size/1024).toFixed(0)} Ko</p>
            </div>
            <button onClick={()=>setPendingFile(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
          </div>
        )}

        {/* Input */}
        <div style={{padding:isMobile?"8px 12px 12px":"10px 16px 14px",borderTop:"1px solid rgba(0,0,0,0.06)",background:"#fff"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#f5f5f5",borderRadius:10,border:`2px solid ${(input.trim()||pendingFile)?YELLOW:"rgba(0,0,0,0.1)"}`,padding:"8px 8px 8px 12px",transition:"border-color 0.15s"}}>
            <button onClick={()=>fileRef.current?.click()} style={{width:34,height:34,borderRadius:6,border:"1px solid rgba(0,0,0,0.1)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=NAVY}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.1)"}>
              ☁️
            </button>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={pendingFile?"Ajoutez un message...":"Posez votre question..."} rows={1} disabled={loading} style={{flex:1,resize:"none",border:"none",background:"transparent",fontSize:isMobile?14:14,color:"#1a1a1a",lineHeight:1.5,outline:"none",maxHeight:100,overflow:"auto",fontFamily:"inherit"}}/>
            <button onClick={()=>sendMessage()} disabled={(!input.trim()&&!pendingFile)||loading} style={{width:36,height:36,borderRadius:7,border:"none",background:(input.trim()||pendingFile)&&!loading?NAVY:"#ddd",cursor:(input.trim()||pendingFile)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:(input.trim()||pendingFile)&&!loading?YELLOW:"#aaa",fontWeight:700}}>
              ↑
            </button>
          </div>
          {!isMobile&&<p style={{margin:"5px 0 0",fontSize:11,color:"#bbb",textAlign:"center"}}>Entrée pour envoyer · ☁️ pour joindre un fichier</p>}
        </div>
      </div>
    </div>
  );
}
