export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, username, password, inviteCode } = req.body;
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    return res.status(500).json({ error: 'Base de données non configurée' });
  }

  async function redisGet(key) {
    const r = await fetch(`${redisUrl}/hget/somfy_users/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    const data = await r.json();
    return data.result;
  }

  async function redisSet(key, value) {
    await fetch(`${redisUrl}/hset/somfy_users/${key}/${encodeURIComponent(value)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` }
    });
  }

  if (action === 'login') {
    if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });
    const stored = await redisGet(username.toLowerCase());
    if (!stored) return res.status(401).json({ error: 'Utilisateur inconnu' });
    const user = JSON.parse(stored);
    if (user.password !== password) return res.status(401).json({ error: 'Mot de passe incorrect' });
    return res.status(200).json({ success: true, displayName: user.displayName });
  }

  if (action === 'register') {
    if (!username || !password || !inviteCode) return res.status(400).json({ error: 'Champs manquants' });
    if (inviteCode !== process.env.PIN_CODE) return res.status(401).json({ error: 'Code d\'invitation incorrect' });
    const existing = await redisGet(username.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Cet identifiant existe déjà' });
    const user = { displayName: username, password, createdAt: new Date().toISOString() };
    await redisSet(username.toLowerCase(), JSON.stringify(user));
    return res.status(200).json({ success: true, displayName: username });
  }

  return res.status(400).json({ error: 'Action inconnue' });
}
