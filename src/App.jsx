import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#25485A";
const YELLOW = "#FFB71E";
const CHART_COLORS = ["#25485A","#FFB71E","#1a6b4a","#e07b00","#5a8fa3","#f0c040","#2e7d5e","#c9600a"];

const PPTX_INSTRUCTIONS = `
PRÉSENTATIONS POWERPOINT : uniquement si l'utilisateur demande explicitement une présentation, des slides ou un PowerPoint, génère le contenu dans ce format JSON exact :
PPTX_START
{"title":"Titre de la présentation","slides":[{"type":"cover","title":"Titre","subtitle":"Sous-titre"},{"type":"content","title":"Titre slide","bullets":["Point 1","Point 2","Point 3"]},{"type":"two_col","title":"Comparaison","left":{"title":"Colonne gauche","bullets":["A","B"]},"right":{"title":"Colonne droite","bullets":["C","D"]}},{"type":"closing","title":"Merci","subtitle":"Message final"}]}
PPTX_END
Types disponibles : "cover", "content", "two_col", "closing". Maximum 10 slides. Ne génère JAMAIS ce format sans demande explicite de l'utilisateur.`;

const SYSTEM_PROMPTS = {
  tertiaire: `Tu es un assistant IA expert en protection solaire dynamique tertiaire, travaillant avec les équipes de Somfy France.

Contexte Somfy Tertiaire : leader en résidentiel (75% de part de marché, ~430M€ de CA), challenger en tertiaire face à Schneider, Siemens, Varema, Nice. Produits clés : BSO, screens, volets roulants motorisés. Solution tertiaire : Animeo Suite (radio IO) et offres filaires. Compatibilité GTB/BMS prévue automne 2025. Concurrents notables : Yokis (bas coût), Bubendorf, Cherubini.

Réglementation clé : Décret BACS (automatisation obligatoire >290kW), Décret Tertiaire (-40% conso 2030), argument confort d'été et réduction des degrés-heures.

STYLE DE RÉPONSE :
- Écris de façon naturelle et fluide, comme un consultant qui parle à un collègue
- Pas de bullet points ni de listes à tirets sauf si vraiment nécessaire
- Pas de texte en gras avec des étoiles comme ça
- Des paragraphes courts et clairs
- Un ton direct, professionnel mais accessible
- Utilise toujours "protection solaire dynamique", jamais de terme anglais
- Tu peux répondre à n'importe quelle question, pas seulement sur Somfy
- Si un fichier est joint, analyse-le et réponds en te basant sur son contenu
- Utilise la recherche web pour toute question d'actualité
- Pour les appels d'offres, consulte le BOAMP et marches-publics.gouv.fr

GRAPHIQUES : quand tu as des données chiffrées comparatives, ajoute à la fin :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END
Types disponibles : bar, line, pie, multibar.
${PPTX_INSTRUCTIONS}`,

  residentiel: `Tu es un assistant IA expert en solutions résidentielles Somfy, travaillant avec les équipes de Somfy France.

Contexte Somfy Résidentiel : leader du marché avec ~75% de parts de marché en France sur la motorisation résidentielle. Somfy propose une gamme complète couvrant plusieurs univers :

PROTECTION SOLAIRE DYNAMIQUE : volets roulants motorisés, BSO résidentiels, stores intérieurs et extérieurs, pergolas bioclimatiques motorisées, screens résidentiels. Protocole io-homecontrol bidirectionnel. Concurrents : Bubendorf, Cherubini, Velux, Fakro.

SÉCURITÉ : gamme Somfy Protect — alarmes connectées, caméras, détecteurs de mouvement, sirènes, IntelliTAG, One+. Concurrents : Ajax Systems, Philips Hue Secure, Arlo, Ring, Risco.

DOMOTIQUE & CONNECTIVITÉ (Smart Home) : TaHoma switch (compatible 300+ marques), Connexoon, io-homecontrol, standard Matter, compatibilité Google Home / Alexa / Apple HomeKit. Concurrents : Nice, Delta Dore, Legrand Netatmo.

MOTORISATION PORTAILS & GARAGES : motorisations de portails coulissants et battants, portes de garage sectionnelles et basculantes, barrières levantes, interphones connectés. Concurrents : Came, BFT, Nice, Faac.

ÉNERGIE & CONFORT : pilotage intelligent du chauffage via TaHoma, volets comme isolation thermique, gestion automatique selon météo et luminosité.

Réglementation et aides : RE2020, MaPrimeRénov', CEE, BBC Rénovation, label RGE, TVA réduite 5,5%.

Cibles : installateurs, particuliers, promoteurs immobiliers, constructeurs.

STYLE DE RÉPONSE :
- Écris de façon naturelle et fluide, comme un consultant qui parle à un collègue
- Pas de bullet points ni de listes à tirets sauf si vraiment nécessaire
- Pas de texte en gras avec des étoiles comme ça
- Des paragraphes courts et clairs
- Un ton direct, professionnel mais accessible
- Utilise toujours "protection solaire dynamique", jamais de terme anglais
- Tu peux répondre à n'importe quelle question, pas seulement sur Somfy
- Si un fichier est joint, analyse-le et réponds en te basant sur son contenu
- Utilise la recherche web pour toute question d'actualité

GRAPHIQUES : quand tu as des données chiffrées comparatives, ajoute à la fin :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END
Types disponibles : bar, line, pie, multibar.
${PPTX_INSTRUCTIONS}`
};

const SECTORS = {
  tertiaire: {
    label: "Tertiaire", icon: "🏢", badge: "Décret BACS • BOAMP • GTB",
    profiles: {
      commercial: {
        label: "Commercial", icon: "🎯",
        categories: [
          { id:"prospection", label:"Prospection", icon:"🎯", desc:"Appels d'offres et projets",
            prompts:[
              { label:"AO rénovation écoles", text:"Recherche les appels d'offres publics sur le BOAMP pour la rénovation d'écoles avec volets roulants ou protection solaire dynamique en France ce mois-ci." },
              { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire dynamique ?" },
              { label:"Hôpitaux en rénovation", text:"Recherche les appels d'offres sur le BOAMP pour la rénovation d'hôpitaux ou bâtiments de santé en France." },
              { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine immobilier ?" },
            ]},
          { id:"pitch", label:"Arguments de vente", icon:"💬", desc:"Pitch par interlocuteur",
            prompts:[
              { label:"Pitch bureau d'études", text:"Rédige-moi un pitch fluide pour convaincre un bureau d'études thermique de prescrire les solutions Somfy." },
              { label:"Pitch mairie / école", text:"Comment convaincre un élu de mairie d'investir dans des protections solaires dynamiques pour ses écoles ?" },
              { label:"Pitch facility manager", text:"Quels arguments pour un facility manager sur les bénéfices concrets de la protection solaire dynamique ?" },
              { label:"Pitch promoteur tertiaire", text:"Comment convaincre un promoteur immobilier tertiaire d'intégrer Somfy dès la conception ?" },
            ]},
          { id:"concurrence", label:"Analyse concurrents", icon:"📊", desc:"Benchmark et veille",
            prompts:[
              { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire dynamique tertiaire." },
              { label:"Benchmark concurrents", text:"Compare Somfy, Schneider, Varema, Nice et Yokis sur l'automatisme de protection solaire tertiaire." },
              { label:"Parts de marché tertiaire", text:"Quelles sont les parts de marché estimées des acteurs sur l'automatisme de protection solaire tertiaire en France ?" },
              { label:"Nouveaux entrants", text:"Y a-t-il de nouveaux acteurs sur le marché de l'automatisation des protections solaires en tertiaire ?" },
            ]},
          { id:"installateurs", label:"Réseau installateurs", icon:"🔧", desc:"Formation et animation",
            prompts:[
              { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à se lancer sur la protection solaire dynamique tertiaire ?" },
              { label:"Arguments pour installateurs", text:"Comment convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
            ]},
        ]
      },
      marketing: {
        label: "Marketing", icon: "📈",
        categories: [
          { id:"veille", label:"Veille marché", icon:"📡", desc:"Tendances et actualités",
            prompts:[
              { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire dynamique tertiaire en France en 2025 ?" },
              { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire dynamique tertiaire en France ?" },
              { label:"Protocoles GTB émergents", text:"Quels protocoles GTB gagnent du terrain en France en 2025 ?" },
              { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
            ]},
          { id:"reglementation", label:"Réglementation", icon:"📋", desc:"Décrets et normes",
            prompts:[
              { label:"Décret BACS complet", text:"Explique-moi le décret BACS, ses obligations, ses seuils et son impact pour Somfy." },
              { label:"Décret tertiaire 2025", text:"Où en est l'application du décret tertiaire en 2025 et quelles sont les obligations actuelles ?" },
              { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent à la protection solaire dynamique ?" },
            ]},
          { id:"confort_ete", label:"Confort d'été", icon:"☀️", desc:"Arguments thermiques",
            prompts:[
              { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques concrets avec des BSO ou screens automatisés ?" },
              { label:"Protection solaire vs clim", text:"Compare les bénéfices d'une protection solaire dynamique face à la climatisation." },
              { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ?" },
            ]},
          { id:"communication", label:"Communication", icon:"📣", desc:"Contenu et messages",
            prompts:[
              { label:"Messages clés par segment", text:"Définis les messages clés Somfy pour les écoles, bureaux, bâtiments de santé et hôtels." },
              { label:"Arguments RSE", text:"Quels arguments RSE peut-on développer autour de la protection solaire dynamique ?" },
              { label:"Cas clients à documenter", text:"Quels cas clients Somfy devrait documenter en priorité pour crédibiliser son offre tertiaire ?" },
            ]},
        ]
      }
    }
  },
  residentiel: {
    label: "Résidentiel", icon: "🏠", badge: "Protect • TaHoma • Portails • RE2020",
    profiles: {
      commercial: {
        label: "Commercial", icon: "🎯",
        categories: [
          { id:"solaire_resi", label:"Protection solaire", icon:"🪟", desc:"Volets, stores, pergolas",
            prompts:[
              { label:"Gamme volets roulants", text:"Présente la gamme complète de volets roulants motorisés Somfy pour le résidentiel : moteurs, protocoles, compatibilités." },
              { label:"Stores et pergolas", text:"Quelle est l'offre Somfy sur les stores extérieurs et pergolas bioclimatiques pour le résidentiel ?" },
              { label:"Pitch installateur stores", text:"Comment convaincre un installateur de stores de rejoindre le réseau Somfy résidentiel ?" },
              { label:"Somfy vs Bubendorf", text:"Compare Somfy et Bubendorf sur le marché de la protection solaire dynamique résidentielle." },
            ]},
          { id:"securite_resi", label:"Sécurité", icon:"🔒", desc:"Somfy Protect & alarmes",
            prompts:[
              { label:"Gamme Somfy Protect", text:"Présente la gamme Somfy Protect : alarmes, caméras, détecteurs, sirènes. Positionnement et arguments clés." },
              { label:"Somfy vs Ajax Systems", text:"Compare Somfy Protect face à Ajax Systems sur le marché de l'alarme connectée résidentielle." },
              { label:"Somfy vs Ring Amazon", text:"Compare Somfy Protect et Ring d'Amazon sur les caméras et alarmes connectées." },
              { label:"Pitch sécurité particulier", text:"Rédige un pitch pour convaincre un particulier d'adopter Somfy Protect pour sécuriser sa maison." },
            ]},
          { id:"domotique_resi", label:"Domotique", icon:"🏠", desc:"TaHoma, connectivité, Matter",
            prompts:[
              { label:"TaHoma switch complet", text:"Présente TaHoma switch : fonctionnalités, compatibilités avec les 300+ marques, protocoles supportés." },
              { label:"io-homecontrol vs Matter", text:"Compare le protocole io-homecontrol de Somfy avec le standard Matter. Avantages et limites." },
              { label:"Somfy vs Delta Dore Tydom", text:"Compare TaHoma switch et Tydom de Delta Dore sur la domotique résidentielle." },
              { label:"Compatibilité assistants vocaux", text:"Quelles sont les compatibilités Somfy avec Google Home, Alexa et Apple HomeKit ?" },
            ]},
          { id:"portails_resi", label:"Portails & Garages", icon:"🚗", desc:"Motorisations extérieures",
            prompts:[
              { label:"Gamme portails Somfy", text:"Présente la gamme Somfy pour la motorisation des portails coulissants et battants." },
              { label:"Portes de garage Somfy", text:"Quelle est l'offre Somfy sur les portes de garage sectionnelles et basculantes ?" },
              { label:"Somfy vs Nice portails", text:"Compare Somfy et Nice sur le marché de la motorisation de portails résidentiels." },
              { label:"Pitch installateur portails", text:"Comment convaincre un installateur de portails et garages de proposer les solutions Somfy ?" },
            ]},
          { id:"aides_resi", label:"Aides & Réglementation", icon:"🌿", desc:"RE2020, MaPrimeRénov', CEE",
            prompts:[
              { label:"MaPrimeRénov' et Somfy", text:"Comment les produits Somfy s'inscrivent-ils dans le dispositif MaPrimeRénov' ?" },
              { label:"RE2020 et protection solaire", text:"Quelles sont les exigences de la RE2020 concernant la protection solaire dynamique en résidentiel ?" },
              { label:"CEE et volets motorisés", text:"Existe-t-il des CEE applicables aux volets et protections solaires dynamiques résidentielles ?" },
              { label:"TVA réduite rénovation", text:"Comment les installateurs Somfy peuvent-ils faire bénéficier leurs clients de la TVA à 5,5% ?" },
            ]},
        ]
      },
      marketing: {
        label: "Marketing", icon: "📈",
        categories: [
          { id:"tendances_resi", label:"Tendances marché", icon:"📡", desc:"Solaire, smart home & connectivité",
            prompts:[
              { label:"Marché protection solaire dynamique", text:"Quels sont les chiffres et tendances du marché du volet roulant et de la protection solaire dynamique résidentielle en France ?" },
              { label:"Marché smart home France", text:"Quelles sont les tendances du marché de la maison connectée en France en 2025 ?" },
              { label:"Marché alarme résidentielle", text:"Quels sont les chiffres et tendances du marché de l'alarme résidentielle en France ?" },
              { label:"Marché motorisation portails et garages", text:"Quels sont les chiffres du marché de la motorisation de portails et portes de garage en France ?" },
              { label:"Innovations connectivité (Matter, IoT)", text:"Comment le protocole Matter et l'IoT s'intègrent-ils dans l'écosystème smart home Somfy ?" },
            ]},
          { id:"confort_resi", label:"Arguments clients", icon:"☀️", desc:"Confort, sécurité, économies",
            prompts:[
              { label:"Économies énergie volets", text:"Quelles économies d'énergie concrètes un particulier peut-il espérer avec des volets automatisés Somfy ?" },
              { label:"Arguments sécurité maison", text:"Quels sont les arguments pour convaincre un particulier d'investir dans la sécurité connectée Somfy ?" },
              { label:"Valeur immobilière domotique", text:"La domotique et les équipements connectés Somfy augmentent-ils la valeur d'un bien immobilier ?" },
              { label:"Confort thermique été", text:"Comment la protection solaire dynamique améliore-t-elle le confort thermique d'une maison en été ?" },
            ]},
          { id:"communication_resi", label:"Communication B2C", icon:"📣", desc:"Messages grand public",
            prompts:[
              { label:"Messages clés par gamme", text:"Définis les messages clés Somfy pour chaque gamme : protection solaire, sécurité, domotique, portails." },
              { label:"Campagne réseaux sociaux", text:"Propose une stratégie de contenu pour les réseaux sociaux Somfy ciblant les particuliers en 2025." },
              { label:"Arguments vs concurrents", text:"Quels sont les arguments différenciants Somfy face à Ring, Ajax et Delta Dore pour un particulier ?" },
            ]},
          { id:"veille_resi", label:"Veille concurrentielle", icon:"🔍", desc:"Suivi concurrents",
            prompts:[
              { label:"Actualités Nice Home", text:"Quelles sont les dernières actualités et nouveautés de Nice Home Evolution ?" },
              { label:"Actualités Ajax Systems", text:"Quelles sont les dernières nouveautés d'Ajax Systems sur le marché de l'alarme ?" },
              { label:"Actualités Ring Amazon", text:"Quelles sont les dernières actualités de Ring sur le marché de la sécurité connectée ?" },
              { label:"Innovations domotique 2025", text:"Quelles sont les grandes innovations en domotique résidentielle attendues en 2025 ?" },
            ]},
        ]
      }
    }
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
        const summary = results.slice(0,8).map((r,i)=>{ const title=r.titre||r.intitule||"Sans titre"; const org=r.donnees?.identite?.denomination||r.organisme||""; const date=r.dateparution||r.date||""; const dept=r.donnees?.lieu?.departement||""; return `${i+1}. ${title}${org?` — ${org}`:""}${dept?` (${dept})`:""}${date?` — publié le ${date}`:""}`;}).join("\n");
        onSearch(`Voici ${results.length} appels d'offres trouvés sur le BOAMP pour "${keywords}" :\n\n${summary}\n\nAnalyse ces résultats : lesquels sont les plus pertinents pour Somfy ?`);
      }
    } catch { onSearch(`Recherche BOAMP pour "${keywords}" — analyse les opportunités d'appels d'offres publics français pour Somfy.`); }
    finally { setLoadingAO(false); setKeywords(""); }
  }
  return (
    <div style={{margin:"10px 0 4px",padding:"10px 12px",background:"rgba(255,183,30,0.08)",borderRadius:8,border:"1px solid rgba(255,183,30,0.25)"}}>
      <p style={{margin:"0 0 6px",fontSize:11,fontWeight:700,color:YELLOW}}>🇫🇷 BOAMP Direct</p>
      <p style={{margin:"0 0 7px",fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.4}}>Résultats officiels directement dans le chat</p>
      <div style={{display:"flex",gap:5}}>
        <input value={keywords} onChange={e=>setKeywords(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder="ex: volets roulants école" disabled={loadingAO} style={{flex:1,padding:"6px 9px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={handleSubmit} disabled={!keywords.trim()||loadingAO} style={{padding:"6px 12px",borderRadius:6,border:"none",cursor:keywords.trim()&&!loadingAO?"pointer":"default",background:keywords.trim()&&!loadingAO?YELLOW:"rgba(255,255,255,0.1)",color:keywords.trim()&&!loadingAO?NAVY:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:700}}>{loadingAO?"...":"Go"}</button>
      </div>
    </div>
  );
}

function parseMessage(content) {
  let text = content; let chart = null; let pptx = null;
  const chartMatch = text.match(/CHART_START\s*([\s\S]*?)\s*CHART_END/);
  if (chartMatch) { text = text.replace(/CHART_START\s*([\s\S]*?)\s*CHART_END/, "").trim(); try { chart = JSON.parse(chartMatch[1].trim()); } catch {} }
  const pptxMatch = text.match(/PPTX_START\s*([\s\S]*?)\s*PPTX_END/);
  if (pptxMatch) { text = text.replace(/PPTX_START\s*([\s\S]*?)\s*PPTX_END/, "").trim(); try { pptx = JSON.parse(pptxMatch[1].trim()); } catch {} }
  return { text, chart, pptx };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div style={{background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,padding:"8px 12px",fontSize:12}}>{label&&<p style={{margin:"0 0 4px",fontWeight:500}}>{label}</p>}{payload.map((p,i)=><p key={i} style={{margin:"2px 0",color:p.color}}>{p.name} : <strong>{p.value}</strong></p>)}</div>);
};

function ChartBlock({ chart }) {
  if (!chart) return null;
  const h=200; const card={marginTop:10,background:"#fff",borderRadius:10,border:"1px solid rgba(0,0,0,0.08)",padding:"12px 8px 6px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}; const title={margin:"0 0 8px",fontWeight:600,fontSize:12,color:NAVY,textAlign:"center"};
  if (chart.type==="pie") { const data=chart.labels.map((l,i)=>({name:l,value:chart.datasets[0].data[i]})); return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip content={<CustomTooltip/>}/></PieChart></ResponsiveContainer></div>; }
  const data=chart.labels.map((l,i)=>{const pt={label:l};chart.datasets.forEach(ds=>{pt[ds.label]=ds.data[i];});return pt;});
  if (chart.type==="line") return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><LineChart data={data} margin={{top:4,right:8,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="label" tick={{fontSize:10,fill:"#666"}}/><YAxis tick={{fontSize:10,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:11}}/>}{chart.datasets.map((ds,i)=><Line key={i} type="monotone" dataKey={ds.label} stroke={ds.color||CHART_COLORS[i]} strokeWidth={2} dot={{r:2}}/>)}</LineChart></ResponsiveContainer></div>;
  return <div style={card}>{chart.title&&<p style={title}>{chart.title}</p>}<ResponsiveContainer width="100%" height={h}><BarChart data={data} margin={{top:4,right:8,left:-24,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="label" tick={{fontSize:10,fill:"#666"}}/><YAxis tick={{fontSize:10,fill:"#666"}}/><Tooltip content={<CustomTooltip/>}/>{chart.datasets.length>1&&<Legend wrapperStyle={{fontSize:11}}/>}{chart.datasets.map((ds,i)=><Bar key={i} dataKey={ds.label} fill={ds.color||CHART_COLORS[i]} radius={[3,3,0,0]}/>)}</BarChart></ResponsiveContainer></div>;
}

function PPTXButton({ pptxData }) {
  const [loading, setLoading] = useState(false);
  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch('/api/pptx', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pptxData) });
      if (!res.ok) throw new Error('Erreur génération');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(pptxData.title||'presentation').replace(/[^a-zA-Z0-9\-_ ]/g,'_')}.pptx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch(err) { alert('Erreur : ' + err.message); }
    finally { setLoading(false); }
  }
  return (
    <div style={{marginTop:10,padding:"12px 16px",background:`linear-gradient(135deg,${NAVY},#1a3a47)`,borderRadius:10,border:"1px solid rgba(255,183,30,0.3)"}}>
      <p style={{margin:"0 0 4px",fontSize:12,color:YELLOW,fontWeight:700}}>📊 Présentation PowerPoint prête</p>
      <p style={{margin:"0 0 10px",fontSize:11,color:"rgba(255,255,255,0.6)"}}>{pptxData.slides?.length||0} slides — {pptxData.title}</p>
      <button onClick={handleDownload} disabled={loading} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:7,border:"none",background:loading?"rgba(255,255,255,0.1)":YELLOW,cursor:loading?"default":"pointer",fontSize:12,fontWeight:700,color:loading?"rgba(255,255,255,0.4)":NAVY,transition:"all 0.15s"}}>
        {loading?"⏳ Génération en cours...":"⬇️ Télécharger le PowerPoint"}
      </button>
    </div>
  );
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
  const {text,chart,pptx} = isLoading?{text:"...",chart:null,pptx:null}:parseMessage(msg.content);
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
        {!streaming&&pptx&&<PPTXButton pptxData={pptx}/>}
      </div>
    </div>
  );
}

function HistoryItem({ item, active, onClick, onDelete }) {
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:6,cursor:"pointer",background:active?"rgba(255,183,30,0.12)":"transparent",borderLeft:`3px solid ${active?YELLOW:"transparent"}`,marginBottom:2}}
    onMouseEnter={e=>{ if(!active)e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
    onMouseLeave={e=>{ if(!active)e.currentTarget.style.background="transparent";}}>
      <span style={{fontSize:12}}>💬</span>
      <span style={{flex:1,fontSize:11,color:active?"#fff":"rgba(255,255,255,0.55)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</span>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:13,padding:"0 2px"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6b6b"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.25)"}>✕</button>
    </div>
  );
}

function exportPDF(messages, sector, profile, title) {
  const date=new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const content=messages.map(m=>{ const {text}=parseMessage(m.content); if(m.role==="user"){const ft=m.fileName?`<div class="file-tag">📎 ${m.fileName}</div>`:"";return `<div class="message user">${ft}<div class="label">Question</div><div class="bubble user-bubble">${text}</div></div>`;} return `<div class="message agent"><div class="label">Somfy Agent</div><div class="bubble agent-bubble">${text.replace(/\n/g,"<br/>")}</div></div>`;}).join("");
  const sectorLabel=SECTORS[sector].label;
  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Somfy Agent — ${title}</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;color:#1a1a1a;background:#fff}.header{background:#FFB71E;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.ht{font-size:20px;font-weight:900;color:#25485A}.meta{text-align:right;font-size:12px;color:rgba(37,72,90,0.7)}.body{padding:0 32px 32px}.message{margin-bottom:18px}.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;color:#999}.bubble{padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.7}.user-bubble{background:#25485A;color:#fff}.agent-bubble{background:#f9f9f9;color:#1a1a1a;border:1px solid rgba(0,0,0,0.08)}.file-tag{font-size:11px;color:#25485A;margin-bottom:5px}.footer{margin-top:32px;padding:12px 32px;border-top:3px solid #FFB71E;font-size:11px;color:#999;display:flex;justify-content:space-between}</style></head><body><div class="header"><div><div class="ht">SOMFY Agent IA</div></div><div class="meta"><strong>${sectorLabel} — ${profile}</strong><br/>${date}</div></div><div class="body">${content}</div><div class="footer"><span>Somfy Agent — ${sectorLabel}</span><span>${date}</span></div><script>window.onload=()=>window.print();</script></body></html>`;
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

function Sidebar({ sector, setSector, profile, setProfile, openCat, setOpenCat, sendMessage, newConversation, profileHistory, activeId, setActiveId, deleteConv, isMobile, closeSidebar }) {
  const currentSector = SECTORS[sector];
  const currentProfile = currentSector.profiles[profile];
  function switchSector(s){ setSector(s); setProfile("commercial"); setOpenCat(SECTORS[s].profiles.commercial.categories[0].id); if(isMobile)closeSidebar(); }
  function switchProfile(p){ setProfile(p); setOpenCat(currentSector.profiles[p].categories[0].id); if(isMobile)closeSidebar(); }
  return (
    <div style={{width:isMobile?"100%":"220px",background:NAVY,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:`linear-gradient(90deg,${YELLOW},#f0a800)`,padding:"12px 16px",borderBottom:"2px solid rgba(37,72,90,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <span style={{fontSize:18,fontWeight:900,color:NAVY,letterSpacing:"-0.5px"}}>SOMFY</span>
            <span style={{fontSize:8,color:"rgba(37,72,90,0.55)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Agent IA</span>
          </div>
          <p style={{margin:"1px 0 0",fontSize:9,color:"rgba(37,72,90,0.55)"}}>Protection solaire</p>
        </div>
        {isMobile&&<button onClick={closeSidebar} style={{background:"rgba(37,72,90,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:NAVY,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
      </div>
      <div style={{padding:"10px 10px 6px"}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>Secteur</p>
        <div style={{display:"flex",gap:4}}>
          {Object.entries(SECTORS).map(([key,s])=>(
            <button key={key} onClick={()=>switchSector(key)} style={{flex:1,padding:"7px 4px",borderRadius:7,cursor:"pointer",background:sector===key?YELLOW:"rgba(255,255,255,0.07)",border:sector===key?"none":"1px solid rgba(255,255,255,0.1)",color:sector===key?NAVY:"rgba(255,255,255,0.45)",fontSize:10,fontWeight:sector===key?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
              <span style={{fontSize:14}}>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"2px 10px 8px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>Profil</p>
        <div style={{display:"flex",gap:4}}>
          {Object.entries(currentSector.profiles).map(([key,p])=>(
            <button key={key} onClick={()=>switchProfile(key)} style={{flex:1,padding:"7px 4px",borderRadius:6,cursor:"pointer",background:profile===key?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)",border:profile===key?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.08)",color:profile===key?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:profile===key?600:400,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:13}}>{p.icon}</span><span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"6px 10px 6px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>Navigation</p>
        {currentProfile.categories.map(cat=>(
          <div key={cat.id}>
            <button onClick={()=>setOpenCat(openCat===cat.id?null:cat.id)} style={{width:"100%",padding:"8px 10px",borderRadius:6,cursor:"pointer",marginBottom:2,background:openCat===cat.id?"rgba(255,183,30,0.12)":"transparent",borderLeft:`3px solid ${openCat===cat.id?YELLOW:"transparent"}`,color:openCat===cat.id?"#fff":"rgba(255,255,255,0.55)",fontSize:11,display:"flex",alignItems:"center",gap:7,textAlign:"left",transition:"all 0.15s"}}
            onMouseEnter={e=>{if(openCat!==cat.id){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderLeftColor="rgba(255,183,30,0.3)";}}}
            onMouseLeave={e=>{if(openCat!==cat.id){e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}}>
              <span style={{fontSize:13}}>{cat.icon}</span><span style={{flex:1}}>{cat.label}</span><span style={{fontSize:9,opacity:0.4}}>{openCat===cat.id?"▼":"▶"}</span>
            </button>
            {openCat===cat.id&&(
              <div style={{marginLeft:12,paddingLeft:10,borderLeft:"2px solid rgba(255,183,30,0.3)",marginBottom:4}}>
                {cat.prompts.map((p,i)=><button key={i} onClick={()=>{sendMessage(p.text);if(isMobile)closeSidebar();}} style={{width:"100%",padding:"5px 6px",borderRadius:5,cursor:"pointer",textAlign:"left",background:"transparent",border:"none",color:"rgba(255,255,255,0.45)",fontSize:11,lineHeight:1.4,display:"block",marginBottom:1}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>{p.label}</button>)}
                {cat.id==="prospection"&&sector==="tertiaire"&&profile==="commercial"&&<PlaceSearchWidget onSearch={(t)=>{sendMessage(t);if(isMobile)closeSidebar();}}/>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 10px 4px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>Historique</p>
          <button onClick={()=>{newConversation();if(isMobile)closeSidebar();}} style={{background:"rgba(255,183,30,0.12)",border:"1px solid rgba(255,183,30,0.25)",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:YELLOW,fontSize:10,fontWeight:700}}>+ Nouveau</button>
        </div>
        {profileHistory.length===0?<p style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontStyle:"italic",margin:"4px 2px"}}>Aucune conversation</p>:profileHistory.map(h=><HistoryItem key={h.id} item={h} active={activeId===h.id} onClick={()=>{setActiveId(h.id);if(isMobile)closeSidebar();}} onDelete={()=>deleteConv(h.id)}/>)}
      </div>
      <div style={{padding:"8px 10px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{background:"rgba(255,183,30,0.08)",border:"1px solid rgba(255,183,30,0.2)",borderRadius:6,padding:"6px 8px",marginBottom:6}}>
          <p style={{margin:"0 0 2px",fontSize:10,color:YELLOW,fontWeight:700}}>{currentSector.icon} Mode {currentSector.label}</p>
          <p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.35)"}}>{currentSector.badge}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:"#3dba6e"}}/><span style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>Recherche web active</span></div>
      </div>
    </div>
  );
}

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!pin.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('somfy_auth', 'true');
        onSuccess();
      } else {
        setError("Code incorrect, réessaie.");
        setPin("");
      }
    } catch {
      setError("Erreur de connexion, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100dvh",background:NAVY,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:14,padding:"36px 32px",width:300,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:26,fontWeight:900,color:NAVY,letterSpacing:"-0.5px",marginBottom:4}}>SOMFY</div>
          <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.08em"}}>Agent IA — Accès protégé</div>
        </div>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e=>setPin(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}}
          placeholder="Code PIN"
          autoFocus
          style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`2px solid ${error?"#e74c3c":pin?"#25485A":"#e0e0e0"}`,fontSize:20,textAlign:"center",letterSpacing:"6px",outline:"none",boxSizing:"border-box",marginBottom:error?8:14,transition:"border-color 0.15s"}}
        />
        {error&&<p style={{margin:"0 0 12px",fontSize:12,color:"#e74c3c",textAlign:"center"}}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!pin.trim()||loading}
          style={{width:"100%",padding:"13px",borderRadius:8,border:"none",background:pin.trim()&&!loading?YELLOW:"#eee",color:pin.trim()&&!loading?NAVY:"#aaa",fontWeight:700,fontSize:14,cursor:pin.trim()&&!loading?"pointer":"default",transition:"all 0.15s"}}
        >
          {loading?"Vérification...":"Accéder à l'agent"}
        </button>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  const [authed, setAuthed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem('somfy_auth') === 'true'
  );
  if (!authed) return <PinGate onSuccess={()=>setAuthed(true)}/>;
  return <App/>;
}

function App() {
  const [windowWidth,setWindowWidth]=useState(typeof window!=="undefined"?window.innerWidth:1024);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sector,setSector]=useState("tertiaire");
  const [profile,setProfile]=useState("commercial");
  const [openCat,setOpenCat]=useState("prospection");
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState(false);
  const [allHistories,setAllHistories]=useState({});
  const [allActiveIds,setAllActiveIds]=useState({});
  const [pendingFile,setPendingFile]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);

  const isMobile=windowWidth<768;
  const hKey=`${sector}_${profile}`;
  const history=allHistories[hKey]||[];
  const activeId=allActiveIds[hKey]||null;

  useEffect(()=>{const h=()=>setWindowWidth(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  const currentMessages=()=>{if(!activeId)return[];const conv=history.find(h=>h.id===activeId);return conv?conv.messages:[];};
  const currentTitle=()=>{if(!activeId)return"Conversation";const conv=history.find(h=>h.id===activeId);return conv?conv.title:"Conversation";};

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[allHistories,allActiveIds,sector,profile]);

  function newConversation(){setAllActiveIds(prev=>({...prev,[hKey]:null}));setPendingFile(null);}

  function updateLastMsg(convId,key,content){
    setAllHistories(prev=>({...prev,[key]:(prev[key]||[]).map(h=>h.id===convId?{...h,messages:h.messages.slice(0,-1).concat([{role:"assistant",content}])}:h)}));
  }

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
    let convId=activeId;
    const key=hKey;
    if(!convId){
      convId=Date.now().toString();
      const title=displayText.slice(0,40)+(displayText.length>40?"...":"");
      setAllHistories(prev=>({...prev,[key]:[{id:convId,title,messages:[]},...(prev[key]||[])]}));
      setAllActiveIds(prev=>({...prev,[key]:convId}));
    }
    setAllHistories(prev=>({...prev,[key]:(prev[key]||[]).map(h=>h.id===convId?{...h,messages:[...newMsgs,{role:"assistant",content:"..."}]}:h)}));
    setLoading(true);setStreaming(false);
    try{
      const msgContent=await buildMessageContent(userText,file);
      const apiMessages=[...msgs.map(m=>({role:m.role,content:m.content})),{role:"user",content:msgContent}];
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({max_tokens:1500,system:SYSTEM_PROMPTS[sector],messages:apiMessages})});
      if(!res.ok){const errText=await res.text();throw new Error(errText||"Erreur serveur");}
      const reader=res.body.getReader();const decoder=new TextDecoder();
      let fullText="";let started=false;
      while(true){
        const {done,value}=await reader.read();if(done)break;
        const chunk=decoder.decode(value);const lines=chunk.split("\n");
        for(const line of lines){
          if(line.startsWith("data: ")){const data=line.slice(6);if(data==="[DONE]")continue;
            try{const parsed=JSON.parse(data);if(parsed.type==="content_block_delta"&&parsed.delta?.type==="text_delta"){if(!started){started=true;setStreaming(true);updateLastMsg(convId,key,"");}fullText+=parsed.delta.text;updateLastMsg(convId,key,fullText);}}catch{}
          }
        }
      }
      setStreaming(false);
      if(!started)updateLastMsg(convId,key,"Je n'ai pas pu obtenir de réponse. Réessaie.");
    }catch(err){setStreaming(false);updateLastMsg(convId,key,`Erreur : ${err.message}`);}
    finally{setLoading(false);setTimeout(()=>inputRef.current?.focus(),100);}
  }

  function deleteConv(id){
    setAllHistories(prev=>({...prev,[hKey]:(prev[hKey]||[]).filter(h=>h.id!==id)}));
    if(activeId===id)setAllActiveIds(prev=>({...prev,[hKey]:null}));
  }

  const currentSector=SECTORS[sector];
  const currentProfile=currentSector.profiles[profile];
  const currentCat=currentProfile.categories.find(c=>c.id===openCat)||currentProfile.categories[0];
  const messages=currentMessages();
  const isStreaming=streaming&&messages.length>0&&messages[messages.length-1]?.role==="assistant";
  const sidebarProps={sector,setSector,profile,setProfile,openCat,setOpenCat,sendMessage,newConversation,profileHistory:history,activeId,setActiveId:(id)=>setAllActiveIds(prev=>({...prev,[hKey]:id})),deleteConv,isMobile,closeSidebar:()=>setSidebarOpen(false)};

  return (
    <div style={{display:"flex",height:isMobile?"100dvh":"640px",background:"#fafafa",borderRadius:isMobile?0:16,overflow:"hidden",boxShadow:isMobile?"none":"0 4px 24px rgba(0,0,0,0.12)",border:isMobile?"none":"1px solid rgba(0,0,0,0.06)",position:"relative",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

      {!isMobile&&<div style={{width:220,flexShrink:0,height:"100%"}}><Sidebar {...sidebarProps}/></div>}

      {isMobile&&sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40}}/>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:"85%",maxWidth:320,zIndex:50,display:"flex",flexDirection:"column",animation:"slideIn 0.25s ease"}}>
            <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            <Sidebar {...sidebarProps}/>
          </div>
        </>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
        <div style={{background:"#fff",borderBottom:`3px solid ${YELLOW}`,padding:isMobile?"10px 14px":"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{width:38,height:38,borderRadius:8,background:NAVY,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:YELLOW,fontSize:18,fontWeight:700}}>☰</span></button>}
            <span style={{fontSize:isMobile?18:20}}>{currentCat.icon}</span>
            <div style={{minWidth:0}}>
              <p style={{margin:0,fontWeight:700,fontSize:isMobile?13:14,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentCat.label}</p>
              {!isMobile&&<p style={{margin:0,fontSize:11,color:"#888"}}>{currentCat.desc}</p>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {isStreaming&&<span style={{fontSize:10,background:"#fff8e6",color:NAVY,padding:"3px 8px",borderRadius:20,border:`1px solid ${YELLOW}`,fontWeight:500}}>✍️</span>}
            {!isMobile&&<span style={{fontSize:10,background:sector==="tertiaire"?"rgba(37,72,90,0.08)":"rgba(255,183,30,0.12)",color:NAVY,padding:"3px 10px",borderRadius:20,fontWeight:600,border:`1px solid ${sector==="tertiaire"?"rgba(37,72,90,0.15)":YELLOW}`}}>{currentSector.icon} {currentSector.label}</span>}
            {messages.length>0&&!isStreaming&&<button onClick={()=>exportPDF(messages,sector,currentProfile.label,currentTitle())} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,background:NAVY,border:"none",cursor:"pointer",fontSize:11,color:YELLOW,fontWeight:700}}>↓ PDF</button>}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px 8px":"20px 22px 10px",background:dragOver?"#f0f8ff":"#fafafa",transition:"background 0.2s",position:"relative"}}>
          {dragOver&&<div style={{position:"absolute",inset:0,background:"rgba(37,72,90,0.05)",border:`2px dashed ${NAVY}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,pointerEvents:"none"}}><div style={{textAlign:"center"}}><span style={{fontSize:32,display:"block",marginBottom:8}}>☁️</span><p style={{margin:0,fontWeight:700,color:NAVY,fontSize:14}}>Déposez ici</p></div></div>}
          {messages.length===0?(
            <div>
              <p style={{margin:"0 0 4px",fontSize:isMobile?15:16,fontWeight:700,color:NAVY}}>Bonjour !</p>
              <p style={{margin:"0 0 16px",fontSize:13,color:"#888"}}>Mode {currentSector.label} — {currentProfile.label}. Choisissez une suggestion ou posez votre question.</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {currentCat.prompts.map((p,i)=>(
                  <button key={i} onClick={()=>sendMessage(p.text)} style={{padding:"11px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",background:"#fff",border:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,color:NAVY,fontWeight:500,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=YELLOW;e.currentTarget.style.boxShadow=`0 2px 8px rgba(255,183,30,0.2)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";}}>
                    <span>{p.label}</span><span style={{color:YELLOW,fontWeight:700,fontSize:15}}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ):messages.map((msg,i)=><Message key={i} msg={msg} streaming={isStreaming&&i===messages.length-1} isMobile={isMobile}/>)}
          <div ref={bottomRef}/>
        </div>

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

        <div style={{padding:isMobile?"8px 12px 12px":"10px 16px 14px",borderTop:"1px solid rgba(0,0,0,0.06)",background:"#fff"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#f5f5f5",borderRadius:10,border:`2px solid ${(input.trim()||pendingFile)?YELLOW:"rgba(0,0,0,0.1)"}`,padding:"8px 8px 8px 12px",transition:"border-color 0.15s"}}>
            <button onClick={()=>fileRef.current?.click()} style={{width:34,height:34,borderRadius:6,border:"1px solid rgba(0,0,0,0.1)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}} onMouseEnter={e=>e.currentTarget.style.borderColor=NAVY} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.1)"}>☁️</button>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={pendingFile?"Ajoutez un message...":"Posez votre question..."} rows={1} disabled={loading} style={{flex:1,resize:"none",border:"none",background:"transparent",fontSize:14,color:"#1a1a1a",lineHeight:1.5,outline:"none",maxHeight:100,overflow:"auto",fontFamily:"inherit"}}/>
            <button onClick={()=>sendMessage()} disabled={(!input.trim()&&!pendingFile)||loading} style={{width:36,height:36,borderRadius:7,border:"none",background:(input.trim()||pendingFile)&&!loading?NAVY:"#ddd",cursor:(input.trim()||pendingFile)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:(input.trim()||pendingFile)&&!loading?YELLOW:"#aaa",fontWeight:700}}>↑</button>
          </div>
          {!isMobile&&<p style={{margin:"5px 0 0",fontSize:11,color:"#bbb",textAlign:"center"}}>Entrée pour envoyer · ☁️ pour joindre un fichier</p>}
        </div>
      </div>
    </div>
  );
}
