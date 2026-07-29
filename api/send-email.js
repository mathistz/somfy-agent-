export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, subject, html, attachmentName, attachmentBase64 } = req.body;

  if (!to || !subject) return res.status(400).json({ error: 'Champs manquants' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé Resend manquante' });

  const body = {
    from: 'Somfy Agent IA <onboarding@resend.dev>',
    to: [to],
    subject,
    html: html || `<p>${subject}</p>`,
  };

  if (attachmentName && attachmentBase64) {
    body.attachments = [{
      filename: attachmentName,
      content: attachmentBase64,
    }];
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur Resend' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
