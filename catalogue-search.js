import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, 'catalogue.json'), 'utf-8');
const { products } = JSON.parse(raw);

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();
  const { ref, q } = req.method === 'GET' ? req.query : (req.body || {});

  if (ref) {
    const refs = String(ref).split(',').map(r => r.trim());
    const results = refs.map(r => products.find(p => p.ref === r) || { ref: r, error: 'non trouvé' });
    return res.json({ results });
  }
  if (q) {
    const query = String(q).toLowerCase();
    const results = products.filter(p =>
      p.ref.includes(query) || (p.name || '').toLowerCase().includes(query)
    ).slice(0, 20);
    return res.json({ results, total: results.length });
  }
  return res.json({ products, total: products.length });
}
