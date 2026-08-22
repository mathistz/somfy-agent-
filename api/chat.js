import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load catalogue once at startup
const __dirname = dirname(fileURLToPath(import.meta.url));
let catalogueMap = {};
try {
  const raw = readFileSync(join(__dirname, 'catalogue.json'), 'utf-8');
  const { products } = JSON.parse(raw);
  products.forEach(p => { catalogueMap[p.ref] = p; });
  console.log(`Catalogue chargé: ${Object.keys(catalogueMap).length} produits`);
} catch(e) { console.error('Catalogue load error:', e.message); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Clé API manquante' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { messages, system, max_tokens } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 2000,
        system,
        messages,
        stream: true,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ type: 'error', error: { message: err } })}\n\n`);
      res.end();
      return;
    }

    // Collect full response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    const allChunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      allChunks.push(chunk);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              fullText += parsed.delta.text;
            }
          } catch {}
        }
      }
    }

    // Find all 7-digit refs mentioned and look them up in catalogue
    // Only trigger if the response explicitly mentions "Réf" or "référence" near a 7-digit number
    const refMatches = [...(fullText.matchAll(/[Rr][ée]f\.?\s*[:.]?\s*(\d{7})/g) || [])];
    const found = [...new Set(refMatches.map(m => m[1]))].filter(r => catalogueMap[r]);

    // Stream all original chunks
    for (const chunk of allChunks) res.write(chunk);

    // If refs found, inject price block as extra SSE delta
    if (found.length > 0) {
      const lines = found.map(r => {
        const p = catalogueMap[r];
        const price = p.price_ht
          ? `${p.price_ht.toFixed(2).replace('.', ',')} € HT`
          : 'prix à confirmer';
        return `• Réf. ${r} — ${p.name || '—'} — **${price}**`;
      });
      const priceBlock =
        '\n\n---\n**📋 Prix publics HT — Catalogue Somfy 2026**\n' +
        lines.join('\n') +
        '\n*Remises commerciales Somfy Pro applicables. Mise en service non incluse.*';

      res.write(`data: ${JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: priceBlock }
      })}\n\n`);
    }

    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: { message: error.message } })}\n\n`);
    res.end();
  }
}
