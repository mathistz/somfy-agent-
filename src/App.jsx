import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#25485A";
const YELLOW = "#FFB71E";
const CHART_COLORS = ["#25485A","#FFB71E","#1a6b4a","#e07b00","#5a8fa3","#f0c040","#2e7d5e","#c9600a"];

const PPTX_INSTRUCTIONS = {
  fr: `PRÉSENTATIONS POWERPOINT : uniquement si l'utilisateur demande explicitement une présentation, des slides ou un PowerPoint, génère le contenu dans ce format JSON exact :
PPTX_START
{"title":"Titre","slides":[...]}
PPTX_END

TYPES DE SLIDES DISPONIBLES (utilise-les intelligemment selon le contenu) :
- "cover" : {"type":"cover","title":"Titre principal","subtitle":"Sous-titre"}
- "content" : {"type":"content","title":"Titre","bullets":["Point 1","Point 2"]}
- "two_col" : {"type":"two_col","title":"Titre","left":{"title":"Col gauche","bullets":["A"]},"right":{"title":"Col droite","bullets":["B"]}}
- "chart" : {"type":"chart","title":"Titre","chartType":"bar","labels":["A","B","C"],"series":[{"name":"Série","values":[10,20,30]}],"note":"Source : ..."} — graphique (bar ou pie, une série pour pie)
- "table" : {"type":"table","title":"Titre","rows":[["En-tête 1","En-tête 2","En-tête 3"],["Val A","Val B","Val C"]],"colWidths":[4,2.5,2.5],"note":"..."} — 1ère ligne = en-tête
- "kpi" : {"type":"kpi","title":"Titre","kpis":[{"value":"75%","label":"Part de marché résidentiel","sub":"France 2024"},{"value":"430M€","label":"CA France","sub":""},{"value":"-40%","label":"Objectif décret tertiaire","sub":"2030"}]}
- "timeline" : {"type":"timeline","title":"Titre","steps":[{"label":"Étape 1","date":"Jan 2025","desc":"...","active":true},{"label":"Étape 2","date":"Mar 2025","desc":"...","active":false}]} — max 5 étapes
- "closing" : {"type":"closing","title":"Merci","subtitle":"Message final"}

Maximum 10 slides. Utilise chart, table et kpi dès que des données chiffrées sont pertinentes. Pour toute présentation CCTP, inclus TOUJOURS un graphique et un tableau.

DOSSIER DE RÉPONSE CCTP : si l'utilisateur demande de générer un dossier ou une présentation de réponse à partir d'un CCTP, génère AUTOMATIQUEMENT un PowerPoint structuré :
1. cover : "Réponse à l'appel d'offres — [Nom du projet]" / "Somfy Pro France"
2. content : "Compréhension du projet" — synthèse du CCTP
3. kpi : 3 chiffres clés du projet (nb ouvertures, surface estimée, délai)
4. two_col : "Deux offres Somfy" — Centralisation (gauche) vs Premium Animeo Suite (droite)
5. table : "Chiffrage estimatif" — colonnes Produit / Offre / Qté / Prix indicatif
6. chart : "Part de marché Somfy" ou économies d'énergie estimées — graphique pertinent
7. content : "Arguments réglementaires" — Décret BACS, RE2020, confort d'été
8. closing : "Merci pour votre confiance" / "Somfy Pro France"

DOCUMENTS PDF : si l'utilisateur demande un PDF, un document ou un rapport, génère-le dans ce format EXACT (surtout PAS de JSON) :
PDF_START
TITRE: Titre du document
SECTION: Titre de la première section
Contenu de la première section, sur autant de lignes que nécessaire (retours à la ligne, listes avec des tirets et guillemets autorisés).
SECTION: Titre de la deuxième section
Contenu de la deuxième section.
FOOTER: Somfy Pro France
PDF_END
Chaque section commence par "SECTION:" suivi de son titre, puis son contenu sur les lignes suivantes. Ne génère JAMAIS ce bloc sans demande explicite.`,
  en: `POWERPOINT PRESENTATIONS: only if the user explicitly asks for a presentation, slides or PowerPoint, generate content in this exact JSON format:
PPTX_START
{"title":"Title","slides":[...]}
PPTX_END

AVAILABLE SLIDE TYPES (use them intelligently based on content):
- "cover" : {"type":"cover","title":"Main title","subtitle":"Subtitle"}
- "content" : {"type":"content","title":"Title","bullets":["Point 1","Point 2"]}
- "two_col" : {"type":"two_col","title":"Title","left":{"title":"Left col","bullets":["A"]},"right":{"title":"Right col","bullets":["B"]}}
- "chart" : {"type":"chart","title":"Title","chartType":"bar","labels":["A","B","C"],"series":[{"name":"Series","values":[10,20,30]}],"note":"Source: ..."} — bar or pie chart (one series for pie)
- "table" : {"type":"table","title":"Title","rows":[["Header 1","Header 2","Header 3"],["Val A","Val B","Val C"]],"colWidths":[4,2.5,2.5],"note":"..."} — first row = header
- "kpi" : {"type":"kpi","title":"Title","kpis":[{"value":"75%","label":"Residential market share","sub":"France 2024"},{"value":"430M€","label":"Revenue France","sub":""},{"value":"-40%","label":"Tertiary Decree target","sub":"2030"}]}
- "timeline" : {"type":"timeline","title":"Title","steps":[{"label":"Step 1","date":"Jan 2025","desc":"...","active":true},{"label":"Step 2","date":"Mar 2025","desc":"...","active":false}]} — max 5 steps
- "closing" : {"type":"closing","title":"Thank you","subtitle":"Final message"}

Maximum 10 slides. Use chart, table and kpi whenever quantitative data is relevant. For any CCTP presentation, ALWAYS include at least one chart and one table.

CCTP RESPONSE DOSSIER: if the user asks to generate a response dossier from a CCTP, AUTOMATICALLY generate a structured PowerPoint:
1. cover: "Tender Response — [Project Name]" / "Somfy Pro France"
2. content: "Project Understanding" — CCTP summary
3. kpi: 3 key figures (number of openings, estimated surface, deadline)
4. two_col: "Two Somfy Offers" — Centralisation (left) vs Premium Animeo Suite (right)
5. table: "Estimated Pricing" — columns Product / Offer / Est. Qty / Indicative Price
6. chart: "Somfy Market Position" or estimated energy savings — relevant chart
7. content: "Regulatory Arguments" — BACS Decree, RE2020, summer comfort
8. closing: "Thank you for your trust" / "Somfy Pro France"

PDF DOCUMENTS: if the user asks for a PDF, document or report, generate it in this EXACT format (definitely NOT JSON):
PDF_START
TITLE: Document title
SECTION: First section title
First section content, on as many lines as needed (line breaks, bullet lists with dashes and quotes are allowed).
SECTION: Second section title
Second section content.
FOOTER: Somfy Pro France
PDF_END
Each section starts with "SECTION:" followed by its title, then its content on the following lines. NEVER generate this block without an explicit user request.`
};

const SYSTEM_PROMPTS = {
  tertiaire: {
    fr: `Tu es un assistant IA expert en protection solaire dynamique tertiaire, travaillant avec les équipes de Somfy France.

Contexte Somfy Tertiaire : leader en résidentiel (75% de part de marché, ~430M€ de CA), challenger en tertiaire face à Schneider, Siemens, Varema, Nice. Produits clés : BSO, screens, volets roulants motorisés. Solution tertiaire : Animeo Suite (radio IO) et offres filaires. Compatibilité GTB/BMS prévue automne 2025. Concurrents notables : Yokis (bas coût), Bubendorf, Cherubini.

Réglementation clé : Décret BACS (automatisation obligatoire >290kW), Décret Tertiaire (-40% conso 2030), argument confort d'été et réduction des degrés-heures.

LECTURE DE CCTP : quand un CCTP est joint, analyse-le en profondeur : type de bâtiment, nombre d'ouvertures et façades, produits demandés, contraintes techniques, délais, budget estimé. Puis présente TOUJOURS deux offres distinctes :
- Offre CENTRALISATION : solution d'entrée de gamme, conforme aux exigences minimales du CCTP, prix compétitif.
- Offre PREMIUM : solution haut de gamme avec Animeo Suite, motorisations et capteurs haut de gamme, arguments sur le ROI et la conformité réglementaire (Décret BACS, RE2020).
Pour chaque offre, indique les produits, le positionnement prix et les arguments clés. Ne propose jamais une seule offre.

STYLE : Naturel et fluide. Pas de bullet points sauf si nécessaire. Paragraphes courts. Ton direct et professionnel. Utilise toujours "protection solaire dynamique". Recherche web pour toute question d'actualité.

GRAPHIQUES :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END`,
    en: `You are an AI assistant expert in dynamic solar shading for tertiary buildings, working with Somfy France teams.

Somfy Tertiary Context: market leader in residential (75% market share), challenger in tertiary against Schneider, Siemens, Varema, Nice. Key products: BSO, screens, motorised roller shutters. Tertiary solution: Animeo Suite and wired offers. Key competitors: Yokis, Bubendorf, Cherubini.

Key regulations: BACS Decree (mandatory automation >290kW), Tertiary Decree (-40% by 2030), summer comfort and degree-hours.

CCTP READING: when a CCTP is attached, analyse it in depth: building type, openings and facades, required products, technical constraints, deadlines, estimated budget. Then ALWAYS present two distinct offers:
- CENTRALISATION offer: entry-level solution, meeting the minimum CCTP requirements, competitive pricing.
- PREMIUM offer: high-end solution with Animeo Suite, premium motorisations and sensors, ROI and regulatory compliance arguments (BACS Decree, RE2020).
For each offer, specify the products, pricing positioning and key arguments. Never propose only one offer.

STYLE: Natural and fluent. No bullet points unless necessary. Direct, professional tone. Always use "dynamic solar shading". Use web search for current topics.

CHARTS:
CHART_START
{"type":"bar","title":"Title","labels":["A","B"],"datasets":[{"label":"Series","data":[10,20],"color":"#25485A"}]}
CHART_END`
  },
  residentiel: {
    fr: `Tu es un assistant IA expert en solutions résidentielles Somfy, travaillant avec les équipes de Somfy France.

PROTECTION SOLAIRE DYNAMIQUE : volets roulants motorisés, BSO résidentiels, stores, pergolas bioclimatiques, screens. Protocole io-homecontrol. Concurrents : Bubendorf, Cherubini, Velux, Fakro.
SÉCURITÉ : Somfy Protect — alarmes, caméras, détecteurs, IntelliTAG, One+. Concurrents : Ajax, Ring, Arlo.
DOMOTIQUE : TaHoma switch (300+ marques), Connexoon, io-homecontrol, Matter, Google Home / Alexa / HomeKit. Concurrents : Nice, Delta Dore, Legrand.
PORTAILS & GARAGES : portails coulissants, battants, portes de garage, barrières. Concurrents : Came, BFT, Nice.
Réglementation : RE2020, MaPrimeRénov', CEE, label RGE, TVA 5,5%.
STYLE : Naturel, fluide, professionnel. Toujours "protection solaire dynamique". Recherche web pour l'actualité.
GRAPHIQUES :
CHART_START
{"type":"bar","title":"Titre","labels":["A","B"],"datasets":[{"label":"Série","data":[10,20],"color":"#25485A"}]}
CHART_END`,
    en: `You are an AI assistant expert in Somfy residential solutions, working with Somfy France teams.

DYNAMIC SOLAR SHADING: motorised roller shutters, residential BSO, awnings, bioclimatic pergolas, screens. io-homecontrol protocol. Competitors: Bubendorf, Cherubini, Velux, Fakro.
SECURITY: Somfy Protect — alarms, cameras, detectors. Competitors: Ajax, Ring, Arlo.
SMART HOME: TaHoma switch (300+ brands), Matter, Google Home / Alexa / HomeKit. Competitors: Nice, Delta Dore, Legrand.
GATES & GARAGES: sliding and swing gates, garage doors. Competitors: Came, BFT, Nice.
Regulations: RE2020, MaPrimeRénov', CEE, RGE label, reduced VAT 5.5%.
STYLE: Natural, fluent, professional. Use web search for current topics.
CHARTS:
CHART_START
{"type":"bar","title":"Title","labels":["A","B"],"datasets":[{"label":"Series","data":[10,20],"color":"#25485A"}]}
CHART_END`
  }
};

const SECTORS = {
  tertiaire: {
    fr: { label:"Tertiaire", badge:"Décret BACS • BOAMP • GTB" },
    en: { label:"Tertiary", badge:"BACS Decree • Public Tenders • GTB" },
    icon:"🏢",
    profiles: {
      commercial: {
        fr: { label:"Commercial", categories: [
          { id:"prospection", label:"Prospection", icon:"🎯", desc:"Appels d'offres et projets", prompts:[
            { label:"AO rénovation écoles", text:"Recherche les appels d'offres publics sur le BOAMP pour la rénovation d'écoles avec volets roulants ou protection solaire dynamique en France ce mois-ci." },
            { label:"Projets tertiaires en cours", text:"Quels sont les grands projets de rénovation tertiaire en France avec besoin potentiel en protection solaire dynamique ?" },
            { label:"Hôpitaux en rénovation", text:"Recherche les appels d'offres sur le BOAMP pour la rénovation d'hôpitaux ou bâtiments de santé en France." },
            { label:"Collectivités actives", text:"Quelles collectivités françaises ont annoncé des plans de rénovation thermique de leur patrimoine ?" },
          ]},
          { id:"cctp", label:"Lire un CCTP", icon:"📄", desc:"Analyser un cahier des charges", prompts:[
            { label:"Analyser ce CCTP", text:"Analyse ce CCTP en détail. Extrait : le type de bâtiment, le nombre d'ouvertures et de façades, les produits demandés, les contraintes techniques, les délais et le budget estimé. Propose ensuite une stratégie de réponse pour Somfy." },
            { label:"Points clés pour Somfy", text:"Dans ce CCTP, quels sont les points les plus importants pour Somfy ? Quels produits de notre gamme correspondent le mieux aux exigences techniques ?" },
            { label:"Rédiger une synthèse de réponse", text:"Sur la base de ce CCTP, rédige une synthèse de réponse professionnelle que l'équipe commerciale pourrait utiliser comme base pour construire son offre." },
            { label:"Risques et points de vigilance", text:"Dans ce CCTP, quels sont les points de vigilance ou les clauses potentiellement problématiques pour Somfy ?" },
          ]},
          { id:"dossier_reponse", label:"Dossier de réponse", icon:"📁", desc:"Générer un dossier PowerPoint", prompts:[
            { label:"Générer le dossier complet", text:"À partir de ce CCTP, génère-moi un dossier de réponse commercial complet en PowerPoint pour Somfy. Le dossier doit inclure : la compréhension du projet, la solution recommandée, les arguments réglementaires, les raisons de choisir Somfy, et une conclusion." },
            { label:"Dossier synthétique (5 slides)", text:"Génère un PowerPoint synthétique de 5 slides maximum pour répondre à cet appel d'offres avec les éléments clés de notre offre Somfy." },
            { label:"Dossier technique détaillé", text:"Génère un dossier PowerPoint technique et détaillé pour répondre à ce CCTP : spécifications produits, compatibilités GTB, argumentaire réglementaire BACS et RE2020, et plan d'installation." },
          ]},
          { id:"pitch", label:"Arguments de vente", icon:"💬", desc:"Pitch par interlocuteur", prompts:[
            { label:"Pitch bureau d'études", text:"Rédige un pitch pour convaincre un bureau d'études thermique de prescrire les solutions Somfy." },
            { label:"Pitch mairie / école", text:"Comment convaincre un élu de mairie d'investir dans des protections solaires dynamiques ?" },
            { label:"Pitch facility manager", text:"Quels arguments pour un facility manager sur les bénéfices de la protection solaire dynamique ?" },
            { label:"Pitch promoteur tertiaire", text:"Comment convaincre un promoteur tertiaire d'intégrer Somfy dès la conception ?" },
          ]},
          { id:"concurrence", label:"Analyse concurrents", icon:"📊", desc:"Benchmark et veille", prompts:[
            { label:"Yokis vs Somfy", text:"Compare l'offre Yokis face à Somfy sur la protection solaire dynamique tertiaire." },
            { label:"Benchmark concurrents", text:"Compare Somfy, Schneider, Varema, Nice et Yokis sur l'automatisme de protection solaire tertiaire." },
            { label:"Parts de marché", text:"Quelles sont les parts de marché des acteurs sur la protection solaire dynamique tertiaire en France ?" },
          ]},
          { id:"installateurs", label:"Réseau installateurs", icon:"🔧", desc:"Formation et animation", prompts:[
            { label:"Freins des installateurs", text:"Quels sont les principaux freins des installateurs à se lancer sur la protection solaire dynamique tertiaire ?" },
            { label:"Arguments pour installateurs", text:"Comment convaincre un installateur résidentiel de se lancer sur le marché tertiaire avec Somfy ?" },
          ]},
        ]},
        en: { label:"Sales", categories: [
          { id:"prospection", label:"Prospecting", icon:"🎯", desc:"Public tenders & projects", prompts:[
            { label:"School renovation tenders", text:"Search the BOAMP for public tenders for school renovation with roller shutters or dynamic solar shading in France this month." },
            { label:"Ongoing tertiary projects", text:"What are the major tertiary renovation projects in France with potential need for dynamic solar shading?" },
            { label:"Hospital renovation", text:"Search the BOAMP for tenders for hospital or healthcare building renovation in France." },
            { label:"Active local authorities", text:"Which French local authorities have announced thermal renovation plans for their building portfolio?" },
          ]},
          { id:"cctp", label:"Read a CCTP", icon:"📄", desc:"Analyse a technical specification", prompts:[
            { label:"Analyse this CCTP", text:"Analyse this CCTP in detail. Extract: building type, openings, requested products, technical constraints, deadlines and budget. Then propose a response strategy for Somfy." },
            { label:"Key points for Somfy", text:"In this CCTP, what are the most important points for Somfy? Which products best match the technical requirements?" },
            { label:"Draft a response summary", text:"Based on this CCTP, write a professional response summary for the sales team." },
            { label:"Risks and watch points", text:"In this CCTP, what are the watch points or potentially problematic clauses for Somfy?" },
          ]},
          { id:"dossier_reponse", label:"Response dossier", icon:"📁", desc:"Generate a PowerPoint dossier", prompts:[
            { label:"Generate full dossier", text:"Based on this CCTP, generate a complete commercial response dossier in PowerPoint for Somfy." },
            { label:"Concise dossier (5 slides)", text:"Generate a concise PowerPoint of maximum 5 slides to respond to this tender with key Somfy offer elements." },
            { label:"Detailed technical dossier", text:"Generate a detailed technical PowerPoint dossier: product specifications, GTB compatibility, BACS and RE2020 arguments, installation plan." },
          ]},
          { id:"pitch", label:"Sales arguments", icon:"💬", desc:"Pitch by target profile", prompts:[
            { label:"Pitch engineering firm", text:"Write a pitch to convince a thermal engineering firm to specify Somfy solutions." },
            { label:"Pitch town hall", text:"How to convince a mayor to invest in automated dynamic solar shading?" },
            { label:"Pitch facility manager", text:"What arguments for a facility manager on the benefits of dynamic solar shading?" },
            { label:"Pitch developer", text:"How to convince a tertiary developer to integrate Somfy from the design stage?" },
          ]},
          { id:"concurrence", label:"Competitor analysis", icon:"📊", desc:"Benchmarking & monitoring", prompts:[
            { label:"Yokis vs Somfy", text:"Compare Yokis and Somfy on tertiary dynamic solar shading." },
            { label:"Competitor benchmark", text:"Compare Somfy, Schneider, Varema, Nice and Yokis on tertiary solar shading automation." },
            { label:"Market shares", text:"What are the estimated market shares in tertiary dynamic solar shading in France?" },
          ]},
          { id:"installateurs", label:"Installer network", icon:"🔧", desc:"Training & network animation", prompts:[
            { label:"Installer barriers", text:"What are the main barriers for installers to enter the tertiary dynamic solar shading market?" },
            { label:"Arguments for installers", text:"How to convince a residential installer to move into the tertiary market with Somfy?" },
          ]},
        ]},
      },
      marketing: {
        fr: { label:"Marketing", categories: [
          { id:"veille", label:"Veille marché", icon:"📡", desc:"Tendances et actualités", prompts:[
            { label:"Tendances 2025", text:"Quelles sont les grandes tendances du marché de la protection solaire dynamique tertiaire en France en 2025 ?" },
            { label:"Chiffres marché France", text:"Quels sont les chiffres clés du marché de la protection solaire dynamique tertiaire en France ?" },
            { label:"Protocoles GTB émergents", text:"Quels protocoles GTB gagnent du terrain en France en 2025 ?" },
            { label:"Actualités bâtiment", text:"Quelles sont les dernières actualités du secteur bâtiment tertiaire sur l'efficacité énergétique ?" },
          ]},
          { id:"reglementation", label:"Réglementation", icon:"📋", desc:"Décrets et normes", prompts:[
            { label:"Décret BACS complet", text:"Explique-moi le décret BACS, ses obligations, ses seuils et son impact pour Somfy." },
            { label:"Décret tertiaire 2025", text:"Où en est l'application du décret tertiaire en 2025 ?" },
            { label:"Normes NF protection solaire", text:"Quelles normes NF et européennes s'appliquent à la protection solaire dynamique ?" },
          ]},
          { id:"confort_ete", label:"Confort d'été", icon:"☀️", desc:"Arguments thermiques", prompts:[
            { label:"Gains thermiques BSO", text:"Quels sont les gains thermiques concrets avec des BSO ou screens automatisés ?" },
            { label:"Protection solaire vs clim", text:"Compare les bénéfices d'une protection solaire dynamique face à la climatisation." },
            { label:"Projections chaleur 2050", text:"Quelles sont les projections de chaleur pour les villes françaises d'ici 2050 ?" },
          ]},
          { id:"communication", label:"Communication", icon:"📣", desc:"Contenu et messages", prompts:[
            { label:"Messages clés par segment", text:"Définis les messages clés Somfy pour les écoles, bureaux, bâtiments de santé et hôtels." },
            { label:"Arguments RSE", text:"Quels arguments RSE peut-on développer autour de la protection solaire dynamique ?" },
            { label:"Cas clients à documenter", text:"Quels cas clients Somfy devrait documenter en priorité pour crédibiliser son offre tertiaire ?" },
          ]},
        ]},
        en: { label:"Marketing", categories: [
          { id:"veille", label:"Market watch", icon:"📡", desc:"Trends & news", prompts:[
            { label:"2025 trends", text:"What are the major trends in the tertiary dynamic solar shading market in France in 2025?" },
            { label:"Market figures France", text:"What are the key figures for the tertiary dynamic solar shading market in France?" },
            { label:"Emerging GTB protocols", text:"Which GTB protocols are gaining ground in France in 2025?" },
            { label:"Building sector news", text:"What are the latest news in the tertiary building sector on energy efficiency?" },
          ]},
          { id:"reglementation", label:"Regulations", icon:"📋", desc:"Decrees & standards", prompts:[
            { label:"BACS Decree overview", text:"Explain the BACS Decree, its obligations, thresholds and impact for Somfy." },
            { label:"Tertiary Decree 2025", text:"Where does the application of the Tertiary Decree stand in 2025?" },
            { label:"NF solar shading standards", text:"What NF and European standards apply to dynamic solar shading?" },
          ]},
          { id:"confort_ete", label:"Summer comfort", icon:"☀️", desc:"Thermal arguments", prompts:[
            { label:"BSO thermal gains", text:"What are the concrete thermal gains with automated BSO or screens?" },
            { label:"Solar shading vs air con", text:"Compare the benefits of dynamic solar shading versus air conditioning." },
            { label:"Heat projections 2050", text:"What are the heat projections for French cities by 2050?" },
          ]},
          { id:"communication", label:"Communication", icon:"📣", desc:"Content & key messages", prompts:[
            { label:"Key messages by segment", text:"Define Somfy's key messages for schools, offices, healthcare buildings and hotels." },
            { label:"CSR arguments", text:"What CSR arguments can be developed around dynamic solar shading?" },
            { label:"Case studies to document", text:"Which client cases should Somfy document as a priority?" },
          ]},
        ]},
      }
    }
  },
  residentiel: {
    fr: { label:"Résidentiel", badge:"Protect • TaHoma • Portails • RE2020" },
    en: { label:"Residential", badge:"Protect • TaHoma • Gates • RE2020" },
    icon:"🏠",
    profiles: {
      commercial: {
        fr: { label:"Commercial", categories: [
          { id:"solaire_resi", label:"Protection solaire", icon:"🪟", desc:"Volets, stores, pergolas", prompts:[
            { label:"Gamme volets roulants", text:"Présente la gamme complète de volets roulants motorisés Somfy pour le résidentiel." },
            { label:"Stores et pergolas", text:"Quelle est l'offre Somfy sur les stores extérieurs et pergolas bioclimatiques ?" },
            { label:"Pitch installateur stores", text:"Comment convaincre un installateur de stores de rejoindre le réseau Somfy résidentiel ?" },
            { label:"Somfy vs Bubendorf", text:"Compare Somfy et Bubendorf sur le marché de la protection solaire dynamique résidentielle." },
          ]},
          { id:"securite_resi", label:"Sécurité", icon:"🔒", desc:"Somfy Protect & alarmes", prompts:[
            { label:"Gamme Somfy Protect", text:"Présente la gamme Somfy Protect : alarmes, caméras, détecteurs, sirènes." },
            { label:"Somfy vs Ajax", text:"Compare Somfy Protect face à Ajax Systems sur le marché de l'alarme connectée." },
            { label:"Somfy vs Ring", text:"Compare Somfy Protect et Ring d'Amazon sur les caméras et alarmes connectées." },
            { label:"Pitch sécurité particulier", text:"Rédige un pitch pour convaincre un particulier d'adopter Somfy Protect." },
          ]},
          { id:"domotique_resi", label:"Domotique", icon:"🏠", desc:"TaHoma, connectivité, Matter", prompts:[
            { label:"TaHoma switch complet", text:"Présente TaHoma switch : fonctionnalités, compatibilités, protocoles supportés." },
            { label:"io-homecontrol vs Matter", text:"Compare le protocole io-homecontrol de Somfy avec le standard Matter." },
            { label:"Somfy vs Delta Dore", text:"Compare TaHoma switch et Tydom de Delta Dore sur la domotique résidentielle." },
            { label:"Compatibilité assistants vocaux", text:"Quelles sont les compatibilités Somfy avec Google Home, Alexa et Apple HomeKit ?" },
          ]},
          { id:"portails_resi", label:"Portails & Garages", icon:"🚗", desc:"Motorisations extérieures", prompts:[
            { label:"Gamme portails Somfy", text:"Présente la gamme Somfy pour la motorisation des portails coulissants et battants." },
            { label:"Portes de garage Somfy", text:"Quelle est l'offre Somfy sur les portes de garage sectionnelles et basculantes ?" },
            { label:"Somfy vs Nice portails", text:"Compare Somfy et Nice sur le marché de la motorisation de portails résidentiels." },
            { label:"Pitch installateur portails", text:"Comment convaincre un installateur de portails de proposer les solutions Somfy ?" },
          ]},
          { id:"aides_resi", label:"Aides & Réglementation", icon:"🌿", desc:"RE2020, MaPrimeRénov'", prompts:[
            { label:"MaPrimeRénov' et Somfy", text:"Comment les produits Somfy s'inscrivent-ils dans le dispositif MaPrimeRénov' ?" },
            { label:"RE2020 et protection solaire", text:"Quelles sont les exigences de la RE2020 sur la protection solaire dynamique en résidentiel ?" },
            { label:"CEE et volets motorisés", text:"Existe-t-il des CEE applicables aux volets et protections solaires dynamiques résidentielles ?" },
            { label:"TVA réduite rénovation", text:"Comment les installateurs Somfy peuvent-ils faire bénéficier leurs clients de la TVA à 5,5% ?" },
          ]},
        ]},
        en: { label:"Sales", categories: [
          { id:"solaire_resi", label:"Solar shading", icon:"🪟", desc:"Shutters, awnings, pergolas", prompts:[
            { label:"Roller shutter range", text:"Present the complete range of Somfy motorised roller shutters for residential use." },
            { label:"Awnings and pergolas", text:"What is Somfy's offer on external awnings and bioclimatic pergolas?" },
            { label:"Somfy vs Bubendorf", text:"Compare Somfy and Bubendorf on the residential dynamic solar shading market." },
            { label:"Pitch installer", text:"How to convince a shutter installer to join the Somfy residential network?" },
          ]},
          { id:"securite_resi", label:"Security", icon:"🔒", desc:"Somfy Protect & alarms", prompts:[
            { label:"Somfy Protect range", text:"Present the Somfy Protect range: alarms, cameras, detectors, sirens." },
            { label:"Somfy vs Ajax", text:"Compare Somfy Protect and Ajax Systems on the connected alarm market." },
            { label:"Somfy vs Ring", text:"Compare Somfy Protect and Amazon Ring on connected cameras and alarms." },
            { label:"Pitch homeowner", text:"Write a pitch to convince a homeowner to adopt Somfy Protect." },
          ]},
          { id:"domotique_resi", label:"Smart home", icon:"🏠", desc:"TaHoma, connectivity, Matter", prompts:[
            { label:"TaHoma switch overview", text:"Present TaHoma switch: features, compatibilities, supported protocols." },
            { label:"io-homecontrol vs Matter", text:"Compare Somfy's io-homecontrol protocol with the Matter standard." },
            { label:"Somfy vs Delta Dore", text:"Compare TaHoma switch and Delta Dore Tydom on residential smart home." },
            { label:"Voice assistant compatibility", text:"What are Somfy's compatibilities with Google Home, Alexa and Apple HomeKit?" },
          ]},
          { id:"portails_resi", label:"Gates & Garages", icon:"🚗", desc:"Outdoor motorisation", prompts:[
            { label:"Somfy gate range", text:"Present the Somfy range for sliding and swing gate motorisation." },
            { label:"Somfy garage doors", text:"What is Somfy's offer on sectional and tilt-up garage doors?" },
            { label:"Somfy vs Nice", text:"Compare Somfy and Nice on the residential gate motorisation market." },
            { label:"Pitch installer", text:"How to convince a gate installer to offer Somfy solutions?" },
          ]},
          { id:"aides_resi", label:"Grants & Regulations", icon:"🌿", desc:"RE2020, MaPrimeRénov'", prompts:[
            { label:"MaPrimeRénov' and Somfy", text:"How do Somfy products fit into the MaPrimeRénov' grant scheme?" },
            { label:"RE2020 and solar shading", text:"What are the RE2020 requirements for dynamic solar shading in residential buildings?" },
            { label:"CEE and motorised shutters", text:"Are there CEE grants applicable to residential dynamic solar shading products?" },
            { label:"Reduced VAT renovation", text:"How can Somfy installers help their clients benefit from the 5.5% reduced VAT?" },
          ]},
        ]},
      },
      marketing: {
        fr: { label:"Marketing", categories: [
          { id:"tendances_resi", label:"Tendances marché", icon:"📡", desc:"Solaire, smart home & connectivité", prompts:[
            { label:"Marché protection solaire dynamique", text:"Quels sont les chiffres et tendances du marché du volet roulant et de la protection solaire dynamique résidentielle en France ?" },
            { label:"Marché smart home France", text:"Quelles sont les tendances du marché de la maison connectée en France en 2025 ?" },
            { label:"Marché alarme résidentielle", text:"Quels sont les chiffres du marché de l'alarme résidentielle en France ?" },
            { label:"Marché portails et garages", text:"Quels sont les chiffres du marché de la motorisation de portails et portes de garage en France ?" },
            { label:"Innovations connectivité", text:"Comment le protocole Matter et l'IoT s'intègrent-ils dans l'écosystème smart home Somfy ?" },
          ]},
          { id:"confort_resi", label:"Arguments clients", icon:"☀️", desc:"Confort, sécurité, économies", prompts:[
            { label:"Économies énergie volets", text:"Quelles économies d'énergie un particulier peut-il espérer avec des volets automatisés Somfy ?" },
            { label:"Arguments sécurité maison", text:"Quels sont les arguments pour convaincre un particulier d'investir dans la sécurité connectée Somfy ?" },
            { label:"Valeur immobilière domotique", text:"La domotique et les équipements connectés Somfy augmentent-ils la valeur d'un bien immobilier ?" },
            { label:"Confort thermique été", text:"Comment la protection solaire dynamique améliore-t-elle le confort thermique d'une maison en été ?" },
          ]},
          { id:"communication_resi", label:"Communication B2C", icon:"📣", desc:"Messages grand public", prompts:[
            { label:"Messages clés par gamme", text:"Définis les messages clés Somfy pour chaque gamme : protection solaire, sécurité, domotique, portails." },
            { label:"Campagne réseaux sociaux", text:"Propose une stratégie de contenu pour les réseaux sociaux Somfy ciblant les particuliers en 2025." },
            { label:"Arguments vs concurrents", text:"Quels sont les arguments différenciants Somfy face à Ring, Ajax et Delta Dore pour un particulier ?" },
          ]},
          { id:"veille_resi", label:"Veille concurrentielle", icon:"🔍", desc:"Suivi concurrents", prompts:[
            { label:"Actualités Nice Home", text:"Quelles sont les dernières actualités et nouveautés de Nice Home Evolution ?" },
            { label:"Actualités Ajax Systems", text:"Quelles sont les dernières nouveautés d'Ajax Systems ?" },
            { label:"Actualités Ring Amazon", text:"Quelles sont les dernières actualités de Ring sur la sécurité connectée ?" },
            { label:"Innovations domotique 2025", text:"Quelles sont les grandes innovations en domotique résidentielle attendues en 2025 ?" },
          ]},
        ]},
        en: { label:"Marketing", categories: [
          { id:"tendances_resi", label:"Market trends", icon:"📡", desc:"Solar, smart home & connectivity", prompts:[
            { label:"Dynamic solar shading market", text:"What are the figures and trends for the residential dynamic solar shading market in France?" },
            { label:"Smart home market France", text:"What are the trends in the connected home market in France in 2025?" },
            { label:"Residential alarm market", text:"What are the figures for the residential alarm market in France?" },
            { label:"Gates & garages market", text:"What are the figures for the gate and garage door motorisation market in France?" },
            { label:"Connectivity innovations", text:"How are the Matter protocol and IoT integrating into the Somfy smart home ecosystem?" },
          ]},
          { id:"confort_resi", label:"Customer arguments", icon:"☀️", desc:"Comfort, security, savings", prompts:[
            { label:"Energy savings shutters", text:"What energy savings can a homeowner expect with Somfy automated shutters?" },
            { label:"Home security arguments", text:"What are the arguments to convince a homeowner to invest in Somfy connected security?" },
            { label:"Smart home property value", text:"Do Somfy connected home products increase the value of a property?" },
            { label:"Summer thermal comfort", text:"How does dynamic solar shading improve thermal comfort in a home during summer?" },
          ]},
          { id:"communication_resi", label:"B2C communication", icon:"📣", desc:"Consumer messaging", prompts:[
            { label:"Key messages by range", text:"Define Somfy's key messages for each range: solar shading, security, smart home, gates." },
            { label:"Social media campaign", text:"Propose a content strategy for Somfy's social media targeting homeowners in 2025." },
            { label:"Arguments vs competitors", text:"What are Somfy's differentiating arguments against Ring, Ajax and Delta Dore?" },
          ]},
          { id:"veille_resi", label:"Competitive watch", icon:"🔍", desc:"Competitor monitoring", prompts:[
            { label:"Nice Home updates", text:"What are the latest news and innovations from Nice Home Evolution?" },
            { label:"Ajax Systems updates", text:"What are the latest innovations from Ajax Systems?" },
            { label:"Ring Amazon updates", text:"What are the latest news from Ring on connected security?" },
            { label:"Smart home innovations 2025", text:"What are the major smart home innovations expected in 2025?" },
          ]},
        ]},
      }
    }
  }
};

const UI = {
  fr: {
    sector:"Secteur", profile:"Profil", nav:"Navigation", history:"Historique",
    newConv:"+ Nouveau", noConv:"Aucune conversation", webActive:"Recherche web active",
    boampTitle:"🇫🇷 BOAMP Direct", boampSub:"Résultats officiels directement dans le chat",
    boampPlaceholder:"ex: volets roulants école", boampBtn:"Go",
    hello:"Bonjour", helloSub:"Choisissez une suggestion ou posez votre question.",
    inputPlaceholder:"Posez votre question...", inputPlaceholderFile:"Ajoutez un message...",
    inputHint:"Entrée pour envoyer · ☁️ pour joindre un fichier",
    pdfBtn:"↓ PDF", sendBtn:"↑",
    noAnswer:"Je n'ai pas pu obtenir de réponse. Réessaie.",
    dropHere:"Déposez ici", modeLabel:"Mode",
    cctpHint:"💡 Upload un PDF de CCTP via ☁️ puis clique sur une suggestion",
    dossierHint:"💡 Upload ton CCTP via ☁️ — l'agent génère un PowerPoint complet à télécharger",
    logout:"Déconnexion",
  },
  en: {
    sector:"Sector", profile:"Profile", nav:"Navigation", history:"History",
    newConv:"+ New", noConv:"No conversation yet", webActive:"Web search active",
    boampTitle:"🇫🇷 BOAMP Direct", boampSub:"Official French tenders directly in chat",
    boampPlaceholder:"e.g. roller shutters school", boampBtn:"Go",
    hello:"Hello", helloSub:"Choose a suggestion or ask your question.",
    inputPlaceholder:"Ask your question...", inputPlaceholderFile:"Add a message...",
    inputHint:"Enter to send · ☁️ to attach a file",
    pdfBtn:"↓ PDF", sendBtn:"↑",
    noAnswer:"I couldn't get a response. Please try again.",
    dropHere:"Drop here", modeLabel:"Mode",
    cctpHint:"💡 Upload a CCTP PDF via ☁️ then click a suggestion",
    dossierHint:"💡 Upload your CCTP via ☁️ — the agent generates a complete PowerPoint to download",
    logout:"Log out",
  }
};

function PlaceSearchWidget({ onSearch, lang }) {
  const [keywords, setKeywords] = useState("");
  const [loadingAO, setLoadingAO] = useState(false);
  const t = UI[lang];
  async function handleSubmit() {
    if (!keywords.trim()) return;
    setLoadingAO(true);
    try {
      const res = await fetch("/api/boamp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({keywords:keywords.trim()}) });
      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) {
        onSearch(lang==="fr"?`J'ai recherché "${keywords}" sur le BOAMP mais aucun résultat. Suggère d'autres mots clés.`:`I searched "${keywords}" on BOAMP but found no results. Suggest other keywords.`);
      } else {
        const summary = results.slice(0,8).map((r,i)=>{ const title=r.titre||r.intitule||"Sans titre"; const org=r.donnees?.identite?.denomination||""; const date=r.dateparution||""; const dept=r.donnees?.lieu?.departement||""; return `${i+1}. ${title}${org?` — ${org}`:""}${dept?` (${dept})`:""}${date?` — ${date}`:""}`;}).join("\n");
        onSearch(lang==="fr"?`Voici ${results.length} AO trouvés sur le BOAMP pour "${keywords}" :\n\n${summary}\n\nAnalyse ces résultats pour Somfy.`:`Here are ${results.length} tenders found on BOAMP for "${keywords}":\n\n${summary}\n\nAnalyse these results for Somfy.`);
      }
    } catch { onSearch(lang==="fr"?`Recherche BOAMP pour "${keywords}".`:`BOAMP search for "${keywords}".`); }
    finally { setLoadingAO(false); setKeywords(""); }
  }
  return (
    <div style={{margin:"10px 0 4px",padding:"10px 12px",background:"rgba(255,183,30,0.08)",borderRadius:8,border:"1px solid rgba(255,183,30,0.25)"}}>
      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:YELLOW}}>{t.boampTitle}</p>
      <p style={{margin:"0 0 7px",fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.4}}>{t.boampSub}</p>
      <div style={{display:"flex",gap:5}}>
        <input value={keywords} onChange={e=>setKeywords(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder={t.boampPlaceholder} disabled={loadingAO} style={{flex:1,padding:"6px 9px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={handleSubmit} disabled={!keywords.trim()||loadingAO} style={{padding:"6px 12px",borderRadius:6,border:"none",cursor:keywords.trim()&&!loadingAO?"pointer":"default",background:keywords.trim()&&!loadingAO?YELLOW:"rgba(255,255,255,0.1)",color:keywords.trim()&&!loadingAO?NAVY:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:700}}>{loadingAO?"...":t.boampBtn}</button>
      </div>
    </div>
  );
}

function parseMessage(content) {
  let text = content; let chart = null; let pptx = null; let pdf = null;
  const chartMatch = text.match(/CHART_START\s*([\s\S]*?)\s*CHART_END/);
  if (chartMatch) { text = text.replace(/CHART_START\s*([\s\S]*?)\s*CHART_END/, "").trim(); try { chart = JSON.parse(chartMatch[1].trim()); } catch {} }
  const pptxMatch = text.match(/PPTX_START\s*([\s\S]*?)\s*PPTX_END/);
  if (pptxMatch) { text = text.replace(/PPTX_START\s*([\s\S]*?)\s*PPTX_END/, "").trim(); try { pptx = JSON.parse(pptxMatch[1].trim()); } catch {} }
  const pdfMatch = text.match(/PDF_START\s*([\s\S]*?)\s*PDF_END/);
  if (pdfMatch) { text = text.replace(/PDF_START\s*([\s\S]*?)\s*PDF_END/, "").trim(); pdf = parsePdfBlock(pdfMatch[1]); }
  return { text, chart, pptx, pdf };
}

function parsePdfBlock(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^\s*```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
  // Compatibilité : si l'ancien format JSON est encore émis, on tente de le lire.
  if (cleaned.startsWith("{")) { try { return JSON.parse(cleaned); } catch {} }
  const lines = cleaned.split(/\r?\n/);
  let title = "Document", footer = "Somfy Pro France";
  const sections = []; let cur = null;
  for (const line of lines) {
    const t = line.trim();
    if (/^(TITRE|TITLE)\s*:/i.test(t)) { title = t.replace(/^(TITRE|TITLE)\s*:/i, "").trim(); }
    else if (/^SECTION\s*:/i.test(t)) { if (cur) sections.push(cur); cur = { title: t.replace(/^SECTION\s*:/i, "").trim(), content: "" }; }
    else if (/^(FOOTER|PIED)\s*:/i.test(t)) { if (cur) { sections.push(cur); cur = null; } footer = t.replace(/^(FOOTER|PIED)\s*:/i, "").trim(); }
    else if (cur) { cur.content += (cur.content ? "\n" : "") + line; }
  }
  if (cur) sections.push(cur);
  if (!sections.length) return null;
  return { title, sections, footer };
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

function PDFButton({ pdfData }) {
  const [loading, setLoading] = useState(false);
  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch('/api/pdf', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pdfData) });
      if (!res.ok) throw new Error('Erreur génération PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(pdfData.title||'document').replace(/[^a-zA-Z0-9\-_ ]/g,'_')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch(err) { alert('Erreur : ' + err.message); }
    finally { setLoading(false); }
  }
  return (
    <div style={{marginTop:10,padding:"12px 16px",background:"linear-gradient(135deg,#1a3a47,#25485A)",borderRadius:10,border:"1px solid rgba(255,183,30,0.3)"}}>
      <p style={{margin:"0 0 4px",fontSize:12,color:YELLOW,fontWeight:700}}>📄 Document PDF prêt</p>
      <p style={{margin:"0 0 10px",fontSize:11,color:"rgba(255,255,255,0.6)"}}>{pdfData.sections?.length||0} sections — {pdfData.title}</p>
      <button onClick={handleDownload} disabled={loading} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:7,border:"none",background:loading?"rgba(255,255,255,0.1)":YELLOW,cursor:loading?"default":"pointer",fontSize:12,fontWeight:700,color:loading?"rgba(255,255,255,0.4)":NAVY}}>
        {loading?"⏳ Génération en cours...":"⬇️ Télécharger le PDF"}
      </button>
    </div>
  );
}

function PPTXButton({ pptxData }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

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

  async function handleSendEmail() {
    if (!emailTo.trim()) return;
    setSending(true); setEmailError("");
    try {
      const pptxRes = await fetch('/api/pptx', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pptxData) });
      if (!pptxRes.ok) throw new Error('Erreur génération PowerPoint');
      const blob = await pptxRes.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const fileName = `${(pptxData.title||'Dossier_Somfy').replace(/[^a-zA-Z0-9\-_ ]/g,'_')}.pptx`;
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: `Dossier de réponse Somfy — ${pptxData.title || 'Appel d\'offres'}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#FFB71E;padding:20px 30px"><h1 style="margin:0;color:#25485A;font-size:24px">SOMFY</h1><p style="margin:4px 0 0;color:#25485A;font-size:12px">Agent IA — Protection Solaire Dynamique</p></div><div style="padding:30px;background:#f9f9f9"><p>Bonjour,</p><p>Veuillez trouver ci-joint notre dossier de réponse à votre appel d'offres.</p><p><strong>Document joint :</strong> ${fileName}</p><p>Cordialement,<br/><strong>Équipe Somfy Pro France</strong></p></div></div>`,
          attachmentName: fileName,
          attachmentBase64: base64,
        })
      });
      const emailData = await emailRes.json();
      if (emailData.success) { setEmailSent(true); setShowEmailForm(false); setEmailTo(""); }
      else { setEmailError(emailData.error || "Erreur d'envoi"); }
    } catch(err) { setEmailError(err.message); }
    finally { setSending(false); }
  }

  return (
    <div style={{marginTop:10,padding:"12px 16px",background:`linear-gradient(135deg,${NAVY},#1a3a47)`,borderRadius:10,border:"1px solid rgba(255,183,30,0.3)"}}>
      <p style={{margin:"0 0 4px",fontSize:12,color:YELLOW,fontWeight:700}}>📊 Dossier PowerPoint prêt</p>
      <p style={{margin:"0 0 10px",fontSize:11,color:"rgba(255,255,255,0.6)"}}>{pptxData.slides?.length||0} slides — {pptxData.title}</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={handleDownload} disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:7,border:"none",background:loading?"rgba(255,255,255,0.1)":YELLOW,cursor:loading?"default":"pointer",fontSize:12,fontWeight:700,color:loading?"rgba(255,255,255,0.4)":NAVY}}>
          {loading?"⏳ Génération...":"⬇️ Télécharger"}
        </button>
        <button onClick={()=>{setShowEmailForm(!showEmailForm);setEmailSent(false);setEmailError("");}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:7,border:"1px solid rgba(255,183,30,0.4)",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:YELLOW}}>
          📧 Envoyer par email
        </button>
      </div>
      {emailSent&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(29,158,117,0.2)",borderRadius:6,border:"1px solid rgba(29,158,117,0.4)"}}><p style={{margin:0,fontSize:12,color:"#3dba6e",fontWeight:600}}>✅ Email envoyé !</p></div>}
      {showEmailForm&&(
        <div style={{marginTop:10,padding:"12px",background:"rgba(255,255,255,0.06)",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)"}}>
          <p style={{margin:"0 0 8px",fontSize:11,color:"rgba(255,255,255,0.7)"}}>Adresse email du destinataire :</p>
          <div style={{display:"flex",gap:8}}>
            <input value={emailTo} onChange={e=>setEmailTo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSendEmail();}} placeholder="ex: loris.andre@somfy.com"
              style={{flex:1,padding:"8px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:12,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={handleSendEmail} disabled={!emailTo.trim()||sending} style={{padding:"8px 14px",borderRadius:6,border:"none",background:emailTo.trim()&&!sending?YELLOW:"rgba(255,255,255,0.1)",color:emailTo.trim()&&!sending?NAVY:"rgba(255,255,255,0.3)",fontSize:12,fontWeight:700,cursor:emailTo.trim()&&!sending?"pointer":"default"}}>
              {sending?"⏳":"Envoyer"}
            </button>
          </div>
          {emailError&&<p style={{margin:"8px 0 0",fontSize:11,color:"#ff6b6b"}}>{emailError}</p>}
        </div>
      )}
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
  const {text,chart,pptx,pdf} = isLoading?{text:"...",chart:null,pptx:null,pdf:null}:parseMessage(msg.content);
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
        {!streaming&&pdf&&<PDFButton pdfData={pdf}/>}
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

function exportPDF(messages, sector, profileKey, lang, title, displayName) {
  const date = new Date().toLocaleDateString(lang==="fr"?"fr-FR":"en-GB",{day:"2-digit",month:"long",year:"numeric"});
  const content = messages.map(m=>{ const {text}=parseMessage(m.content); if(m.role==="user"){const ft=m.fileName?`<div class="file-tag">📎 ${m.fileName}</div>`:"";return `<div class="message user">${ft}<div class="label">Question</div><div class="bubble user-bubble">${text}</div></div>`;} return `<div class="message agent"><div class="label">Somfy Agent</div><div class="bubble agent-bubble">${text.replace(/\n/g,"<br/>")}</div></div>`;}).join("");
  const sLabel = SECTORS[sector][lang].label;
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;color:#1a1a1a}.header{background:#FFB71E;padding:16px 32px;display:flex;justify-content:space-between;margin-bottom:28px}.ht{font-size:20px;font-weight:900;color:#25485A}.meta{text-align:right;font-size:12px;color:rgba(37,72,90,0.7)}.body{padding:0 32px 32px}.message{margin-bottom:18px}.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;color:#999}.bubble{padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.7}.user-bubble{background:#25485A;color:#fff}.agent-bubble{background:#f9f9f9;border:1px solid rgba(0,0,0,0.08)}.file-tag{font-size:11px;color:#25485A;margin-bottom:5px}.footer{margin-top:32px;padding:12px 32px;border-top:3px solid #FFB71E;font-size:11px;color:#999;display:flex;justify-content:space-between}</style></head><body><div class="header"><div class="ht">SOMFY Agent IA</div><div class="meta"><strong>${sLabel} — ${displayName}</strong><br/>${date}</div></div><div class="body">${content}</div><div class="footer"><span>Somfy Agent — ${displayName}</span><span>${date}</span></div><script>window.onload=()=>window.print();</script></body></html>`;
  const win=window.open("","_blank");win.document.write(html);win.document.close();
}

async function readFileAsBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(",")[1]);r.onerror=()=>reject(new Error("Error"));r.readAsDataURL(file);});}
async function readFileAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Error"));r.readAsText(file);});}
async function readDocxAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=async(e)=>{try{const res=await window.mammoth.extractRawText({arrayBuffer:e.target.result});resolve(res.value);}catch(err){reject(err);}};r.onerror=()=>reject(new Error("Error"));r.readAsArrayBuffer(file);});}
async function readXlsxAsText(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=(e)=>{try{const wb=window.XLSX.read(e.target.result,{type:"array"});let text="";wb.SheetNames.forEach(name=>{text+=`\n[${name}]\n`;text+=window.XLSX.utils.sheet_to_csv(wb.Sheets[name]);});resolve(text);}catch(err){reject(err);}};r.onerror=()=>reject(new Error("Error"));r.readAsArrayBuffer(file);});}
async function buildMessageContent(userText,file){
  if(!file) return userText;
  const ext=file.name.split(".").pop().toLowerCase();
  if(["jpg","jpeg","png","gif","webp"].includes(ext)){const b64=await readFileAsBase64(file);const mt=ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="png"?"image/png":"image/webp";return [{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:userText||"Analyse cette image."}];}
  if(ext==="pdf"){const b64=await readFileAsBase64(file);return [{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:userText||"Analyse ce document en détail."}];}
  if(ext==="docx"||ext==="doc"){const text=await readDocxAsText(file);return `[Word: ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;}
  if(ext==="xlsx"||ext==="xls"){const text=await readXlsxAsText(file);return `[Excel: ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;}
  const text=await readFileAsText(file);return `[File: ${file.name}]\n\n${text}\n\n---\n${userText||"Analyse."}`;
}
function getFileIcon(name){const ext=name.split(".").pop().toLowerCase();if(ext==="pdf")return "📄";if(["jpg","jpeg","png","gif","webp"].includes(ext))return "🖼️";if(["doc","docx"].includes(ext))return "📝";if(["xls","xlsx","csv"].includes(ext))return "📊";return "📁";}

function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) { setError("Remplis tous les champs."); return; }
    if (mode === "register" && !inviteCode.trim()) { setError("Le code d'invitation est requis."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:mode, username:username.trim(), password, inviteCode:inviteCode.trim() }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('somfy_user', JSON.stringify({ username:username.trim().toLowerCase(), displayName:data.displayName })); onSuccess({ username:username.trim().toLowerCase(), displayName:data.displayName }); }
      else { setError(data.error || "Erreur inconnue"); }
    } catch { setError("Erreur de connexion. Réessaie."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100dvh",background:NAVY,fontFamily:"'Inter',system-ui,sans-serif",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:16,padding:"36px 32px",width:"100%",maxWidth:360,boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:28,fontWeight:900,color:NAVY,letterSpacing:"-0.5px"}}>SOMFY</div>
          <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>Agent IA — Protection Solaire</div>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:24,background:"#f5f5f5",padding:4,borderRadius:8}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"8px",borderRadius:6,border:"none",cursor:"pointer",background:mode===m?"#fff":"transparent",color:mode===m?NAVY:"#888",fontWeight:mode===m?700:400,fontSize:13,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
              {m==="login"?"Se connecter":"Créer un compte"}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Identifiant (ex: mathis.taramasz)"
            style={{padding:"12px 14px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor=NAVY} onBlur={e=>e.target.style.borderColor="#e0e0e0"}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder="Mot de passe"
            style={{padding:"12px 14px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor=NAVY} onBlur={e=>e.target.style.borderColor="#e0e0e0"}/>
          {mode==="register"&&(
            <div>
              <input value={inviteCode} onChange={e=>setInviteCode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder="Code d'invitation"
                style={{width:"100%",padding:"12px 14px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",letterSpacing:"4px",textAlign:"center"}}
                onFocus={e=>e.target.style.borderColor=NAVY} onBlur={e=>e.target.style.borderColor="#e0e0e0"}/>
              <p style={{margin:"6px 0 0",fontSize:11,color:"#aaa",textAlign:"center"}}>Demande le code à Mathis</p>
            </div>
          )}
        </div>
        {error&&<p style={{margin:"12px 0 0",fontSize:12,color:"#e74c3c",textAlign:"center"}}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:"100%",padding:"13px",borderRadius:8,border:"none",background:loading?"#eee":YELLOW,color:loading?"#aaa":NAVY,fontWeight:700,fontSize:14,cursor:loading?"default":"pointer",marginTop:16}}>
          {loading?"...":(mode==="login"?"Accéder à l'agent":"Créer mon compte")}
        </button>
        <div style={{marginTop:16,padding:"12px",background:"#f8f8f8",borderRadius:8,fontSize:11,color:"#888",textAlign:"center",lineHeight:1.6}}>
          {mode==="login"?"Première connexion ? Crée ton compte ci-dessus.":"Ton espace est personnel — tes conversations sont sauvegardées."}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ lang, setLang, sector, setSector, profile, setProfile, openCat, setOpenCat, sendMessage, newConversation, profileHistory, activeId, setActiveId, deleteConv, isMobile, closeSidebar, displayName, onLogout }) {
  const t = UI[lang];
  const currentSector = SECTORS[sector];
  const currentProfileData = currentSector.profiles[profile][lang];
  function switchSector(s){ setSector(s); setProfile("commercial"); setOpenCat(SECTORS[s].profiles.commercial[lang].categories[0].id); if(isMobile)closeSidebar(); }
  function switchProfile(p){ setProfile(p); setOpenCat(currentSector.profiles[p][lang].categories[0].id); if(isMobile)closeSidebar(); }
  return (
    <div style={{width:isMobile?"100%":"240px",background:NAVY,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:`linear-gradient(90deg,${YELLOW},#f0a800)`,padding:"12px 16px",borderBottom:"2px solid rgba(37,72,90,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <span style={{fontSize:18,fontWeight:900,color:NAVY,letterSpacing:"-0.5px"}}>SOMFY</span>
            <span style={{fontSize:8,color:"rgba(37,72,90,0.55)",fontWeight:700,textTransform:"uppercase"}}>Agent IA</span>
          </div>
          <p style={{margin:"1px 0 0",fontSize:9,color:"rgba(37,72,90,0.7)",fontWeight:600}}>{displayName}</p>
        </div>
        {isMobile&&<button onClick={closeSidebar} style={{background:"rgba(37,72,90,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:NAVY,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
      </div>
      <div style={{padding:"8px 10px 4px",flexShrink:0}}>
        <div style={{display:"flex",gap:4}}>
          {["fr","en"].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:"6px 4px",borderRadius:6,cursor:"pointer",background:lang===l?YELLOW:"rgba(255,255,255,0.07)",border:lang===l?"none":"1px solid rgba(255,255,255,0.1)",color:lang===l?NAVY:"rgba(255,255,255,0.5)",fontSize:13,fontWeight:lang===l?700:400,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              {l==="fr"?"🇫🇷 FR":"🇬🇧 EN"}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"4px 10px 6px",flexShrink:0}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.sector}</p>
        <div style={{display:"flex",gap:4}}>
          {Object.entries(SECTORS).map(([key,s])=>(
            <button key={key} onClick={()=>switchSector(key)} style={{flex:1,padding:"7px 4px",borderRadius:7,cursor:"pointer",background:sector===key?YELLOW:"rgba(255,255,255,0.07)",border:sector===key?"none":"1px solid rgba(255,255,255,0.1)",color:sector===key?NAVY:"rgba(255,255,255,0.45)",fontSize:10,fontWeight:sector===key?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
              <span style={{fontSize:14}}>{s.icon}</span><span>{s[lang].label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"2px 10px 8px",borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.profile}</p>
        <div style={{display:"flex",gap:4}}>
          {Object.keys(currentSector.profiles).map(key=>(
            <button key={key} onClick={()=>switchProfile(key)} style={{flex:1,padding:"7px 4px",borderRadius:6,cursor:"pointer",background:profile===key?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)",border:profile===key?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.08)",color:profile===key?"#fff":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:profile===key?600:400,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:13}}>{key==="commercial"?"🎯":"📈"}</span>
              <span>{currentSector.profiles[key][lang].label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"6px 10px 6px",borderBottom:"1px solid rgba(255,255,255,0.06)",overflowY:"auto",flex:"0 1 auto",minHeight:0}}>
        <p style={{margin:"0 0 5px 2px",fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,flexShrink:0}}>{t.nav}</p>
        {currentProfileData.categories.map(cat=>(
          <div key={cat.id}>
            <button onClick={()=>setOpenCat(openCat===cat.id?null:cat.id)} style={{width:"100%",padding:"8px 10px",borderRadius:6,cursor:"pointer",marginBottom:2,background:openCat===cat.id?"rgba(255,183,30,0.12)":"transparent",borderLeft:`3px solid ${openCat===cat.id?YELLOW:"transparent"}`,color:openCat===cat.id?"#fff":"rgba(255,255,255,0.55)",fontSize:11,display:"flex",alignItems:"center",gap:7,textAlign:"left",transition:"all 0.15s"}}
            onMouseEnter={e=>{if(openCat!==cat.id){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderLeftColor="rgba(255,183,30,0.3)";}}}
            onMouseLeave={e=>{if(openCat!==cat.id){e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}}>
              <span style={{fontSize:13}}>{cat.icon}</span><span style={{flex:1}}>{cat.label}</span>
              <span style={{fontSize:9,opacity:0.4}}>{openCat===cat.id?"▼":"▶"}</span>
            </button>
            {openCat===cat.id&&(
              <div style={{marginLeft:12,paddingLeft:10,borderLeft:"2px solid rgba(255,183,30,0.3)",marginBottom:4}}>
                {cat.id==="cctp"&&<p style={{margin:"4px 0 8px",fontSize:10,color:"rgba(255,183,30,0.7)",lineHeight:1.4}}>{t.cctpHint}</p>}
                {cat.id==="dossier_reponse"&&<p style={{margin:"4px 0 8px",fontSize:10,color:"rgba(255,183,30,0.7)",lineHeight:1.4}}>{t.dossierHint}</p>}
                {cat.prompts.map((p,i)=><button key={i} onClick={()=>{sendMessage(p.text);if(isMobile)closeSidebar();}} style={{width:"100%",padding:"5px 6px",borderRadius:5,cursor:"pointer",textAlign:"left",background:"transparent",border:"none",color:"rgba(255,255,255,0.45)",fontSize:11,lineHeight:1.4,display:"block",marginBottom:1}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>{p.label}</button>)}
                {cat.id==="prospection"&&sector==="tertiaire"&&profile==="commercial"&&<PlaceSearchWidget lang={lang} onSearch={(txt)=>{sendMessage(txt);if(isMobile)closeSidebar();}}/>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 10px 4px",minHeight:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{t.history}</p>
          <button onClick={()=>{newConversation();if(isMobile)closeSidebar();}} style={{background:"rgba(255,183,30,0.12)",border:"1px solid rgba(255,183,30,0.25)",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:YELLOW,fontSize:10,fontWeight:700}}>{t.newConv}</button>
        </div>
        {profileHistory.length===0?<p style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontStyle:"italic",margin:"4px 2px"}}>{t.noConv}</p>:profileHistory.map(h=><HistoryItem key={h.id} item={h} active={activeId===h.id} onClick={()=>{setActiveId(h.id);if(isMobile)closeSidebar();}} onDelete={()=>deleteConv(h.id)}/>)}
      </div>
      <div style={{padding:"8px 10px 10px",borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
        <div style={{background:"rgba(255,183,30,0.08)",border:"1px solid rgba(255,183,30,0.2)",borderRadius:6,padding:"6px 8px",marginBottom:6}}>
          <p style={{margin:"0 0 2px",fontSize:10,color:YELLOW,fontWeight:700}}>{currentSector.icon} {t.modeLabel} {currentSector[lang].label}</p>
          <p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.35)"}}>{currentSector[lang].badge}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:"#3dba6e"}}/><span style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>{t.webActive}</span></div>
          <button onClick={onLogout} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:"rgba(255,255,255,0.25)",padding:"2px 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#ff6b6b"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.25)"}>{t.logout}</button>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  const [user, setUser] = useState(()=>{
    try { const s=localStorage.getItem('somfy_user'); return s?JSON.parse(s):null; } catch { return null; }
  });
  function handleLogout() { localStorage.removeItem('somfy_user'); setUser(null); }
  if (!user) return <AuthScreen onSuccess={setUser}/>;
  return <App user={user} onLogout={handleLogout}/>;
}

function App({ user, onLogout }) {
  const [windowWidth,setWindowWidth]=useState(typeof window!=="undefined"?window.innerWidth:1024);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [lang,setLang]=useState("fr");
  const [sector,setSector]=useState("tertiaire");
  const [profile,setProfile]=useState("commercial");
  const [openCat,setOpenCat]=useState("prospection");
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState(false);
  const [allHistories,setAllHistories]=useState(()=>{
    try { const s=localStorage.getItem(`somfy_histories_${user.username}`); return s?JSON.parse(s):{}; } catch { return {}; }
  });
  const [allActiveIds,setAllActiveIds]=useState({});
  const [pendingFile,setPendingFile]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);

  const isMobile=windowWidth<768;
  const hKey=`${lang}_${sector}_${profile}`;
  const history=allHistories[hKey]||[];
  const activeId=allActiveIds[hKey]||null;
  const t=UI[lang];

  useEffect(()=>{const h=()=>setWindowWidth(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  useEffect(()=>{
    try { localStorage.setItem(`somfy_histories_${user.username}`, JSON.stringify(allHistories)); } catch {}
  },[allHistories,user.username]);
  useEffect(()=>{
    const cats=SECTORS[sector].profiles[profile][lang].categories;
    if(!cats.find(c=>c.id===openCat)) setOpenCat(cats[0].id);
  },[lang,sector,profile]);

  const currentMessages=()=>{if(!activeId)return[];const conv=history.find(h=>h.id===activeId);return conv?conv.messages:[];};
  const currentTitle=()=>{if(!activeId)return"Conversation";const conv=history.find(h=>h.id===activeId);return conv?conv.title:"Conversation";};

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[allHistories,allActiveIds,sector,profile,lang]);

  function newConversation(){setAllActiveIds(prev=>({...prev,[hKey]:null}));setPendingFile(null);}
  function updateLastMsg(convId,key,content){setAllHistories(prev=>({...prev,[key]:(prev[key]||[]).map(h=>h.id===convId?{...h,messages:h.messages.slice(0,-1).concat([{role:"assistant",content}])}:h)}));}

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
    const displayText=userText||(file?`Analyse: ${file.name}`:"");
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
      const systemPrompt=SYSTEM_PROMPTS[sector][lang]+"\n\n"+PPTX_INSTRUCTIONS[lang];
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({max_tokens:2000,system:systemPrompt,messages:apiMessages})});
      if(!res.ok){const errText=await res.text();throw new Error(errText||"Erreur serveur");}
      const reader=res.body.getReader();const decoder=new TextDecoder();
      let fullText="";let started=false;let streamError="";
      while(true){
        const {done,value}=await reader.read();if(done)break;
        const chunk=decoder.decode(value);const lines=chunk.split("\n");
        for(const line of lines){
          if(line.startsWith("data: ")){const data=line.slice(6);if(data==="[DONE]")continue;
            try{const parsed=JSON.parse(data);
              if(parsed.type==="content_block_delta"&&parsed.delta?.type==="text_delta"){if(!started){started=true;setStreaming(true);updateLastMsg(convId,key,"");}fullText+=parsed.delta.text;updateLastMsg(convId,key,fullText);}
              else if(parsed.type==="error"){streamError=parsed.error?.message||"Erreur inconnue de l'API";}
            }catch{}
          }
        }
      }
      setStreaming(false);
      if(!started){
        if(streamError)updateLastMsg(convId,key,`⚠️ ${streamError}`);
        else updateLastMsg(convId,key,t.noAnswer+" (le serveur a interrompu la connexion — document probablement trop lourd ou analyse trop longue).");
      }
    }catch(err){setStreaming(false);updateLastMsg(convId,key,`Erreur : ${err.message}`);}
    finally{setLoading(false);setTimeout(()=>inputRef.current?.focus(),100);}
  }

  function deleteConv(id){
    setAllHistories(prev=>({...prev,[hKey]:(prev[hKey]||[]).filter(h=>h.id!==id)}));
    if(activeId===id)setAllActiveIds(prev=>({...prev,[hKey]:null}));
  }

  const currentSectorData=SECTORS[sector];
  const currentProfileData=currentSectorData.profiles[profile][lang];
  const currentCat=currentProfileData.categories.find(c=>c.id===openCat)||currentProfileData.categories[0];
  const messages=currentMessages();
  const isStreaming=streaming&&messages.length>0&&messages[messages.length-1]?.role==="assistant";
  const sidebarProps={lang,setLang,sector,setSector,profile,setProfile,openCat,setOpenCat,sendMessage,newConversation,profileHistory:history,activeId,setActiveId:(id)=>setAllActiveIds(prev=>({...prev,[hKey]:id})),deleteConv,isMobile,closeSidebar:()=>setSidebarOpen(false),displayName:user.displayName,onLogout};

  return (
    <div style={{display:"flex",height:"100dvh",background:"#fafafa",position:"relative",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

      {!isMobile&&<div style={{width:240,flexShrink:0,height:"100%"}}><Sidebar {...sidebarProps}/></div>}

      {isMobile&&sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40}}/>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:"85%",maxWidth:320,zIndex:50,display:"flex",flexDirection:"column",animation:"slideIn 0.25s ease"}}>
            <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            <Sidebar {...sidebarProps}/>
          </div>
        </>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
        <div style={{background:"#fff",borderBottom:`3px solid ${YELLOW}`,padding:isMobile?"10px 14px":"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexShrink:0}}>
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
            {!isMobile&&<span style={{fontSize:10,background:"rgba(37,72,90,0.08)",color:NAVY,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{currentSectorData.icon} {currentSectorData[lang].label}</span>}
            {messages.length>0&&!isStreaming&&<button onClick={()=>exportPDF(messages,sector,profile,lang,currentTitle(),user.displayName)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,background:NAVY,border:"none",cursor:"pointer",fontSize:11,color:YELLOW,fontWeight:700}}>{t.pdfBtn}</button>}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px 8px":"20px 22px 10px",background:dragOver?"#f0f8ff":"#fafafa",transition:"background 0.2s",position:"relative"}}>
          {dragOver&&<div style={{position:"absolute",inset:0,background:"rgba(37,72,90,0.05)",border:`2px dashed ${NAVY}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,pointerEvents:"none"}}><div style={{textAlign:"center"}}><span style={{fontSize:32,display:"block",marginBottom:8}}>☁️</span><p style={{margin:0,fontWeight:700,color:NAVY,fontSize:14}}>{t.dropHere}</p></div></div>}
          {messages.length===0?(
            <div>
              <p style={{margin:"0 0 4px",fontSize:isMobile?15:16,fontWeight:700,color:NAVY}}>{t.hello} {user.displayName} !</p>
              <p style={{margin:"0 0 16px",fontSize:13,color:"#888"}}>{t.helloSub}</p>
              {(openCat==="cctp"||openCat==="dossier_reponse")&&(
                <div style={{marginBottom:16,padding:"12px 14px",background:"#fff8e6",borderRadius:8,border:`1px solid ${YELLOW}`,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{openCat==="dossier_reponse"?"📁":"📄"}</span>
                  <p style={{margin:0,fontSize:13,color:NAVY,lineHeight:1.5}}>
                    {openCat==="dossier_reponse"
                      ?(lang==="fr"?"Upload ton CCTP via ☁️ — l'agent génère automatiquement un dossier PowerPoint complet.":"Upload your CCTP via ☁️ — the agent automatically generates a complete PowerPoint dossier.")
                      :(lang==="fr"?"Upload ton PDF de CCTP via le bouton ☁️ en bas, puis clique sur une suggestion.":"Upload your CCTP PDF using the ☁️ button below, then click a suggestion.")}
                  </p>
                </div>
              )}
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
          <div style={{padding:"7px 14px",background:"#fff8e6",borderTop:`1px solid ${YELLOW}`,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{fontSize:18}}>{getFileIcon(pendingFile.name)}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:12,fontWeight:600,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pendingFile.name}</p>
              <p style={{margin:0,fontSize:10,color:"#888"}}>{(pendingFile.size/1024).toFixed(0)} Ko</p>
            </div>
            <button onClick={()=>setPendingFile(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:18}}>✕</button>
          </div>
        )}

        <div style={{padding:isMobile?"8px 12px 12px":"10px 16px 14px",borderTop:"1px solid rgba(0,0,0,0.06)",background:"#fff",flexShrink:0}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#f5f5f5",borderRadius:10,border:`2px solid ${(input.trim()||pendingFile)?YELLOW:"rgba(0,0,0,0.1)"}`,padding:"8px 8px 8px 12px",transition:"border-color 0.15s"}}>
            <button onClick={()=>fileRef.current?.click()} style={{width:34,height:34,borderRadius:6,border:"1px solid rgba(0,0,0,0.1)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}} onMouseEnter={e=>e.currentTarget.style.borderColor=NAVY} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,0,0,0.1)"}>☁️
</button>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={pendingFile?t.inputPlaceholderFile:t.inputPlaceholder} rows={1} disabled={loading} style={{flex:1,resize:"none",border:"none",background:"transparent",fontSize:14,color:"#1a1a1a",lineHeight:1.5,outline:"none",maxHeight:100,overflow:"auto",fontFamily:"inherit"}}/>
            <button onClick={()=>sendMessage()} disabled={(!input.trim()&&!pendingFile)||loading} style={{width:36,height:36,borderRadius:7,border:"none",background:(input.trim()||pendingFile)&&!loading?NAVY:"#ddd",cursor:(input.trim()||pendingFile)&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:(input.trim()||pendingFile)&&!loading?YELLOW:"#aaa",fontWeight:700}}>{t.sendBtn}</button>
          </div>
          {!isMobile&&<p style={{margin:"5px 0 0",fontSize:11,color:"#bbb",textAlign:"center"}}>{t.inputHint}</p>}
        </div>
      </div>
    </div>
  );
}
