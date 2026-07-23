import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, username, password, inviteCode } = req.body;

  // ── LOGIN ──
  if (action === 'login') {
    if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });
    const stored = await redis.hget('somfy_users', username.toLowerCase());
    if (!stored) return res.status(401).json({ error: 'Utilisateur inconnu' });
    const user = JSON.parse(stored);
    if (user.password !== password) return res.status(401).json({ error: 'Mot de passe incorrect' });
    return res.status(200).json({ success: true, displayName: user.displayName });
  }

  // ── INSCRIPTION ──
  if (action === 'register') {
    if (!username || !password || !inviteCode) return res.status(400).json({ error: 'Champs manquants' });
    const correctCode = process.env.PIN_CODE;
    if (inviteCode !== correctCode) return res.status(401).json({ error: 'Code d\'invitation incorrect' });
    const existing = await redis.hget('somfy_users', username.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Cet identifiant existe déjà' });
    const user = { displayName: username, password, createdAt: new Date().toISOString() };
    await redis.hset('somfy_users', { [username.toLowerCase()]: JSON.stringify(user) });
    return res.status(200).json({ success: true, displayName: username });
  }

  return res.status(400).json({ error: 'Action inconnue' });
}
