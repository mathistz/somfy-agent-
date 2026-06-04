import pptxgen from 'pptxgenjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, slides } = req.body;
  if (!slides || !Array.isArray(slides)) return res.status(400).json({ error: 'Données invalides' });

  try {
    let pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    pres.title = title || 'Présentation Somfy';

    const NAVY = '25485A';
    const YELLOW = 'FFB71E';
    const WHITE = 'FFFFFF';
    const DARK = '1A1A1A';

    slides.forEach((slide, index) => {
      const sl = pres.addSlide();

      if (slide.type === 'cover') {
        sl.background = { color: NAVY };
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.12, fill:{ color:YELLOW }, line:{ color:YELLOW } });
        sl.addText('SOMFY', { x:0.6, y:0.8, w:5, h:1, fontSize:52, fontFace:'Arial', bold:true, color:YELLOW });
        sl.addText(slide.title || title || 'Présentation', { x:0.6, y:2.0, w:8.5, h:1.2, fontSize:30, fontFace:'Arial', bold:true, color:WHITE, wrap:true });
        if (slide.subtitle) sl.addText(slide.subtitle, { x:0.6, y:3.3, w:8.5, h:0.8, fontSize:18, fontFace:'Arial', color:'A8C4CF', wrap:true });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.1, w:10, h:0.525, fill:{ color:'1E3A47' }, line:{ color:'1E3A47' } });
        sl.addText('Somfy France — Protection Solaire', { x:0.5, y:5.1, w:9, h:0.525, fontSize:11, fontFace:'Arial', color:'7AAFC0', valign:'middle' });
      }

      else if (slide.type === 'content') {
        sl.background = { color:WHITE };
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.1, fill:{ color:YELLOW }, line:{ color:YELLOW } });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0.1, w:0.08, h:5.4, fill:{ color:NAVY }, line:{ color:NAVY } });
        sl.addText(slide.title || '', { x:0.3, y:0.18, w:9.3, h:0.7, fontSize:26, fontFace:'Arial', bold:true, color:NAVY });
        if (slide.bullets && slide.bullets.length > 0) {
          slide.bullets.forEach((bullet, bi) => {
            sl.addShape(pres.shapes.OVAL, { x:0.35, y:1.15+bi*0.7, w:0.12, h:0.12, fill:{ color:YELLOW }, line:{ color:YELLOW } });
            sl.addText(bullet, { x:0.6, y:1.08+bi*0.7, w:9.0, h:0.55, fontSize:16, fontFace:'Arial', color:DARK });
          });
        }
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.18, fill:{ color:NAVY }, line:{ color:NAVY } });
        sl.addText(`${index}`, { x:9.2, y:5.45, w:0.5, h:0.18, fontSize:9, fontFace:'Arial', color:YELLOW, align:'center', valign:'middle' });
      }

      else if (slide.type === 'two_col') {
        sl.background = { color:WHITE };
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.1, fill:{ color:YELLOW }, line:{ color:YELLOW } });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0.1, w:0.08, h:5.4, fill:{ color:NAVY }, line:{ color:NAVY } });
        sl.addText(slide.title || '', { x:0.3, y:0.18, w:9.3, h:0.7, fontSize:26, fontFace:'Arial', bold:true, color:NAVY });
        if (slide.left) {
          sl.addShape(pres.shapes.RECTANGLE, { x:0.3, y:1.1, w:4.4, h:4.1, fill:{ color:'EEF2F5' }, line:{ color:'D0DCE8' } });
          sl.addShape(pres.shapes.RECTANGLE, { x:0.3, y:1.1, w:4.4, h:0.08, fill:{ color:NAVY }, line:{ color:NAVY } });
          sl.addText(slide.left.title || '', { x:0.5, y:1.2, w:4.0, h:0.5, fontSize:15, fontFace:'Arial', bold:true, color:NAVY });
          if (slide.left.bullets) slide.left.bullets.forEach((b, bi) => {
            sl.addText('›  ' + b, { x:0.5, y:1.85+bi*0.58, w:4.0, h:0.52, fontSize:13, fontFace:'Arial', color:DARK });
          });
        }
        if (slide.right) {
          sl.addShape(pres.shapes.RECTANGLE, { x:5.3, y:1.1, w:4.4, h:4.1, fill:{ color:'EEF2F5' }, line:{ color:'D0DCE8' } });
          sl.addShape(pres.shapes.RECTANGLE, { x:5.3, y:1.1, w:4.4, h:0.08, fill:{ color:YELLOW }, line:{ color:YELLOW } });
          sl.addText(slide.right.title || '', { x:5.5, y:1.2, w:4.0, h:0.5, fontSize:15, fontFace:'Arial', bold:true, color:NAVY });
          if (slide.right.bullets) slide.right.bullets.forEach((b, bi) => {
            sl.addText('›  ' + b, { x:5.5, y:1.85+bi*0.58, w:4.0, h:0.52, fontSize:13, fontFace:'Arial', color:DARK });
          });
        }
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.18, fill:{ color:NAVY }, line:{ color:NAVY } });
        sl.addText(`${index}`, { x:9.2, y:5.45, w:0.5, h:0.18, fontSize:9, fontFace:'Arial', color:YELLOW, align:'center', valign:'middle' });
      }

      else if (slide.type === 'closing') {
        sl.background = { color:NAVY };
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.1, fill:{ color:YELLOW }, line:{ color:YELLOW } });
        sl.addText('SOMFY', { x:1, y:0.9, w:8, h:1.4, fontSize:64, fontFace:'Arial', bold:true, color:YELLOW, align:'center' });
        sl.addText(slide.title || 'Merci', { x:1, y:2.5, w:8, h:0.8, fontSize:26, fontFace:'Arial', bold:true, color:WHITE, align:'center' });
        if (slide.subtitle) sl.addText(slide.subtitle, { x:1, y:3.4, w:8, h:0.6, fontSize:16, fontFace:'Arial', color:'A8C4CF', align:'center' });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.1, w:10, h:0.525, fill:{ color:'1E3A47' }, line:{ color:'1E3A47' } });
        sl.addText('somfy-agent.vercel.app', { x:0.5, y:5.1, w:9, h:0.525, fontSize:11, fontFace:'Arial', color:YELLOW, valign:'middle', align:'center' });
      }
    });

    const buffer = await pres.write('nodebuffer');
    const safeTitle = (title || 'presentation').replace(/[^a-zA-Z0-9\-_\u00C0-\u024F ]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pptx"`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('PPTX error:', error);
    res.status(500).json({ error: error.message });
  }
}
