export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { keywords } = req.body;
  if (!keywords) return res.status(400).json({ error: 'Mots clés manquants' });

  try {
    const url = `https://www.boamp.fr/api/1/search/?q=${encodeURIComponent(keywords)}&rows=10&sort=dateparution%20desc`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
