export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pin } = req.body;
  const correctPin = process.env.PIN_CODE;

  if (!correctPin) {
    return res.status(500).json({ error: 'PIN non configuré sur le serveur' });
  }

  if (pin === correctPin) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, error: 'Code incorrect' });
}
