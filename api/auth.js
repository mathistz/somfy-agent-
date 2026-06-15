export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { pin } = req.body;
  const correctPin = process.env.PIN_CODE;

  if (!correctPin) {
    return res.status(500).json({ message: 'PIN non configuré sur le serveur.' });
  }

  if (pin === correctPin) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Code PIN incorrect.' });
  }
}
