# Somfy Agent — Guide de déploiement

Agent IA spécialisé pour les équipes Somfy France sur la protection solaire tertiaire.

---

## Déploiement en 5 étapes

### Étape 1 — Crée un compte GitHub
1. Va sur **github.com** et crée un compte gratuit
2. Clique sur **"New repository"** (bouton vert)
3. Nomme-le `somfy-agent`, coche "Public", clique **Create repository**

### Étape 2 — Upload les fichiers
1. Dans ton nouveau repo GitHub, clique **"uploading an existing file"**
2. Glisse-dépose tous les fichiers du projet (en respectant les dossiers `src/` et `api/`)
3. Clique **"Commit changes"**

### Étape 3 — Crée un compte Vercel
1. Va sur **vercel.com** et crée un compte gratuit (connecte-toi avec GitHub)
2. Clique **"Add New Project"**
3. Sélectionne ton repo `somfy-agent`
4. Clique **Deploy** (Vercel détecte automatiquement Vite)

### Étape 4 — Ajoute ta clé API Anthropic
1. Va sur **console.anthropic.com** → crée un compte → **API Keys** → **Create Key**
2. Copie la clé (commence par `sk-ant-...`)
3. Dans Vercel : **Settings** → **Environment Variables**
4. Ajoute : `ANTHROPIC_API_KEY` = ta clé
5. Clique **Redeploy** pour appliquer

### Étape 5 — Partage l'URL
Vercel te donne une URL du type `somfy-agent-xxx.vercel.app`.
Partage-la à tes maîtres de stage — aucune installation requise, ça marche dans le navigateur.

---

## Modifier l'agent après déploiement

1. Modifie les fichiers sur GitHub directement (bouton crayon)
2. Vercel redéploie automatiquement en moins d'une minute

### Modifications fréquentes

**Ajouter une question raccourci** → `src/App.jsx`, section `PROFILES`, dans le tableau `prompts`

**Modifier le comportement de l'agent** → `src/App.jsx`, constante `SYSTEM_PROMPT`

**Changer les couleurs** → `src/App.jsx`, objet `S` en haut du fichier

---

## Structure du projet

```
somfy-agent/
├── api/
│   └── chat.js          ← Proxy sécurisé vers l'API Anthropic (clé cachée côté serveur)
├── src/
│   ├── App.jsx          ← Interface complète de l'agent
│   ├── main.jsx         ← Point d'entrée React
│   └── index.css        ← Styles globaux
├── index.html           ← HTML de base
├── package.json         ← Dépendances
├── vite.config.js       ← Config Vite
├── vercel.json          ← Config Vercel
└── .env.example         ← Modèle pour la clé API
```

---

## Coût estimé

- GitHub : gratuit
- Vercel : gratuit (jusqu'à 100 000 requêtes/mois)
- API Anthropic : ~0,003€ par question posée → environ **3-5€/mois** pour un usage équipe

---

*Développé dans le cadre d'un stage Somfy France — 2026*
