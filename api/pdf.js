import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, sections, footer } = req.body;

  const NAVY = '#25485A';
  const YELLOW = '#FFB71E';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${(title||'document').replace(/[^a-zA-Z0-9\-_ ]/g,'_')}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(NAVY);
  doc.fontSize(28).fillColor(YELLOW).font('Helvetica-Bold').text('SOMFY', 50, 20);
  doc.fontSize(10).fillColor('#A8C4CF').font('Helvetica').text('Agent IA — Protection Solaire Dynamique', 50, 54);

  // Yellow line
  doc.rect(0, 80, doc.page.width, 4).fill(YELLOW);

  // Title
  doc.moveDown(2);
  doc.fontSize(20).fillColor(NAVY).font('Helvetica-Bold').text(title || 'Document', 50, 110);
  doc.rect(50, 136, 80, 3).fill(YELLOW);
  doc.moveDown(1.5);

  // Date
  const date = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  doc.fontSize(10).fillColor('#888888').font('Helvetica').text(date, 50, 145);
  doc.moveDown(2);

  // Sections
  let y = 175;
  for (const section of (sections || [])) {
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 50;
    }

    if (section.title) {
      doc.fontSize(14).fillColor(NAVY).font('Helvetica-Bold').text(section.title, 50, y);
      y += 22;
      doc.rect(50, y, doc.page.width - 100, 1.5).fill(YELLOW);
      y += 12;
    }

    if (section.content) {
      doc.fontSize(11).fillColor('#2D3748').font('Helvetica')
        .text(section.content, 50, y, { width: doc.page.width - 100, lineGap: 4 });
      y = doc.y + 20;
    }
  }

  // Footer
  const footerY = doc.page.height - 50;
  doc.rect(0, footerY - 10, doc.page.width, 1).fill('#E2E8F0');
  doc.fontSize(9).fillColor('#888888').font('Helvetica')
    .text(footer || `Somfy Agent IA — ${date}`, 50, footerY, { align: 'center', width: doc.page.width - 100 });

  doc.end();
}
