import pptxgen from 'pptxgenjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, slides } = req.body;
  if (!slides || !Array.isArray(slides)) return res.status(400).json({ error: 'Données invalides' });

  try {
    let pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    pres.title = title || 'Présentation Somfy';

    const NAVY  = '25485A';
    const YELLOW= 'FFB71E';
    const WHITE = 'FFFFFF';
    const DARK  = '1A1A1A';
    const LIGHT = 'EEF2F5';
    const GREY  = 'D0DCE8';
    const NAVY2 = '1E3A47';
    const BLUE  = 'A8C4CF';

    // ── helpers ────────────────────────────────────────────────
    function addHeader(sl, slideTitle) {
      sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.1,  fill:{color:YELLOW}, line:{color:YELLOW} });
      sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0.1,w:0.08,h:5.4, fill:{color:NAVY},  line:{color:NAVY}   });
      if (slideTitle) sl.addText(slideTitle, { x:0.3, y:0.18, w:9.3, h:0.7, fontSize:24, fontFace:'Arial', bold:true, color:NAVY, wrap:true });
    }
    function addFooter(sl, idx) {
      sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.18, fill:{color:NAVY}, line:{color:NAVY} });
      sl.addText('Somfy Pro France  —  Protection Solaire Dynamique', { x:0.3, y:5.45, w:8.5, h:0.18, fontSize:8, fontFace:'Arial', color:BLUE, valign:'middle' });
      sl.addText(`${idx}`, { x:9.2, y:5.45, w:0.5, h:0.18, fontSize:9, fontFace:'Arial', color:YELLOW, align:'center', valign:'middle' });
    }

    slides.forEach((slide, index) => {
      const sl = pres.addSlide();

      // ── COVER ──────────────────────────────────────────────
      if (slide.type === 'cover') {
        sl.background = { color: NAVY };
        // Top yellow bar
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.12, fill:{color:YELLOW}, line:{color:YELLOW} });
        // Yellow accent left
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0.12, w:0.35, h:5.38, fill:{color:YELLOW}, line:{color:YELLOW} });
        // SOMFY logo text
        sl.addText('SOMFY', { x:0.6, y:0.7, w:5, h:1.1, fontSize:56, fontFace:'Arial', bold:true, color:YELLOW });
        // Main title
        sl.addText(slide.title || title || 'Présentation', { x:0.6, y:1.9, w:8.5, h:1.4, fontSize:28, fontFace:'Arial', bold:true, color:WHITE, wrap:true });
        // Subtitle
        if (slide.subtitle) sl.addText(slide.subtitle, { x:0.6, y:3.35, w:8.5, h:0.7, fontSize:16, fontFace:'Arial', color:BLUE, wrap:true });
        // Date
        const date = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
        sl.addText(date, { x:0.6, y:4.1, w:5, h:0.4, fontSize:11, fontFace:'Arial', color:'7AAFC0' });
        // Footer band
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.1, w:10, h:0.525, fill:{color:NAVY2}, line:{color:NAVY2} });
        sl.addText('Somfy France  —  Protection Solaire Dynamique', { x:0.5, y:5.1, w:9, h:0.525, fontSize:11, fontFace:'Arial', color:'7AAFC0', valign:'middle' });
      }

      // ── CONTENT (bullets) ──────────────────────────────────
      else if (slide.type === 'content') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        const bullets = slide.bullets || [];
        bullets.forEach((bullet, bi) => {
          sl.addShape(pres.shapes.RECTANGLE, { x:0.35, y:1.2+bi*0.68, w:0.08, h:0.38, fill:{color:YELLOW}, line:{color:YELLOW} });
          sl.addText(bullet, { x:0.58, y:1.18+bi*0.68, w:9.0, h:0.55, fontSize:15, fontFace:'Arial', color:DARK, wrap:true });
        });
        addFooter(sl, index);
      }

      // ── TWO_COL ────────────────────────────────────────────
      else if (slide.type === 'two_col') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        // Left card
        if (slide.left) {
          sl.addShape(pres.shapes.RECTANGLE, { x:0.3, y:1.05, w:4.5, h:4.2, fill:{color:LIGHT}, line:{color:GREY} });
          sl.addShape(pres.shapes.RECTANGLE, { x:0.3, y:1.05, w:4.5, h:0.45, fill:{color:NAVY}, line:{color:NAVY} });
          sl.addText(slide.left.title || '', { x:0.45, y:1.07, w:4.2, h:0.42, fontSize:13, fontFace:'Arial', bold:true, color:WHITE, valign:'middle' });
          (slide.left.bullets||[]).forEach((b, bi) => {
            sl.addShape(pres.shapes.OVAL, { x:0.42, y:1.66+bi*0.58, w:0.1, h:0.1, fill:{color:NAVY}, line:{color:NAVY} });
            sl.addText(b, { x:0.6, y:1.6+bi*0.58, w:4.1, h:0.52, fontSize:12, fontFace:'Arial', color:DARK, wrap:true });
          });
        }
        // Right card
        if (slide.right) {
          sl.addShape(pres.shapes.RECTANGLE, { x:5.2, y:1.05, w:4.5, h:4.2, fill:{color:LIGHT}, line:{color:GREY} });
          sl.addShape(pres.shapes.RECTANGLE, { x:5.2, y:1.05, w:4.5, h:0.45, fill:{color:YELLOW}, line:{color:YELLOW} });
          sl.addText(slide.right.title || '', { x:5.35, y:1.07, w:4.2, h:0.42, fontSize:13, fontFace:'Arial', bold:true, color:NAVY, valign:'middle' });
          (slide.right.bullets||[]).forEach((b, bi) => {
            sl.addShape(pres.shapes.OVAL, { x:5.32, y:1.66+bi*0.58, w:0.1, h:0.1, fill:{color:YELLOW}, line:{color:YELLOW} });
            sl.addText(b, { x:5.5, y:1.6+bi*0.58, w:4.1, h:0.52, fontSize:12, fontFace:'Arial', color:DARK, wrap:true });
          });
        }
        addFooter(sl, index);
      }

      // ── CHART (graphique à barres ou camembert) ────────────
      else if (slide.type === 'chart') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        const chartData = (slide.series || []).map(s => ({
          name: s.name,
          labels: slide.labels || [],
          values: s.values || []
        }));
        if (chartData.length > 0) {
          const isPie = slide.chartType === 'pie';
          const chartType = isPie ? pres.charts.PIE : pres.charts.BAR;
          const opts = {
            x: 0.5, y: 1.1, w: 9, h: 4.1,
            chartColors: ['25485A','FFB71E','1a6b4a','e07b00','5a8fa3','f0c040'],
            showValue: true,
            dataLabelFontSize: 11,
            dataLabelColor: WHITE,
            showLegend: true,
            legendPos: 'b',
            legendFontSize: 11,
            valAxisLabelFontSize: 11,
            catAxisLabelFontSize: 11,
            valAxisMaxVal: slide.maxVal || undefined,
          };
          if (!isPie) {
            opts.barDir = 'col';
            opts.barGrouping = 'clustered';
          }
          sl.addChart(chartType, chartData, opts);
        }
        if (slide.note) sl.addText(slide.note, { x:0.5, y:5.1, w:9, h:0.3, fontSize:9, fontFace:'Arial', color:'888888', italic:true });
        addFooter(sl, index);
      }

      // ── TABLE (chiffrage / comparatif) ────────────────────
      else if (slide.type === 'table') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        const rows = slide.rows || [];
        if (rows.length > 0) {
          // First row = header
          const tableRows = rows.map((row, ri) => {
            return row.map(cell => ({
              text: String(cell),
              options: ri === 0
                ? { bold:true, color:WHITE, fill:{color:NAVY}, align:'center', fontSize:12, valign:'middle' }
                : { color:DARK, fill:{color: ri%2===0 ? LIGHT : WHITE}, fontSize:11, valign:'middle' }
            }));
          });
          const colCount = rows[0].length;
          const colW = slide.colWidths || Array(colCount).fill(9/colCount);
          sl.addTable(tableRows, {
            x: 0.3, y: 1.05, w: 9.4,
            colW,
            rowH: 0.45,
            border: { type:'solid', color:GREY, pt:1 },
            autoPage: false,
          });
        }
        if (slide.note) sl.addText(slide.note, { x:0.5, y:5.1, w:9, h:0.3, fontSize:9, fontFace:'Arial', color:'888888', italic:true });
        addFooter(sl, index);
      }

      // ── KPI (3 chiffres clés côte à côte) ────────────────
      else if (slide.type === 'kpi') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        const kpis = (slide.kpis || []).slice(0, 3);
        const positions = [0.4, 3.5, 6.6];
        kpis.forEach((kpi, ki) => {
          const x = positions[ki];
          sl.addShape(pres.shapes.RECTANGLE, { x, y:1.15, w:2.9, h:3.8, fill:{color:LIGHT}, line:{color:GREY} });
          sl.addShape(pres.shapes.RECTANGLE, { x, y:1.15, w:2.9, h:0.08, fill:{color:ki===1?YELLOW:NAVY}, line:{color:ki===1?YELLOW:NAVY} });
          sl.addText(kpi.value || '', { x, y:1.7, w:2.9, h:1.2, fontSize:42, fontFace:'Arial', bold:true, color:ki===1?YELLOW:NAVY, align:'center' });
          sl.addText(kpi.label || '', { x, y:2.9, w:2.9, h:0.5, fontSize:13, fontFace:'Arial', bold:true, color:NAVY, align:'center', wrap:true });
          if (kpi.sub) sl.addText(kpi.sub, { x, y:3.45, w:2.9, h:0.6, fontSize:10, fontFace:'Arial', color:'888888', align:'center', wrap:true });
        });
        addFooter(sl, index);
      }

      // ── TIMELINE (étapes horizontales) ───────────────────
      else if (slide.type === 'timeline') {
        sl.background = { color: WHITE };
        addHeader(sl, slide.title);
        const steps = (slide.steps || []).slice(0, 5);
        const n = steps.length;
        const gap = 9.2 / n;
        // Horizontal line
        sl.addShape(pres.shapes.RECTANGLE, { x:0.4, y:2.7, w:9.0, h:0.05, fill:{color:GREY}, line:{color:GREY} });
        steps.forEach((step, si) => {
          const cx = 0.4 + gap * si + gap/2;
          const isActive = step.active;
          // Circle
          sl.addShape(pres.shapes.OVAL, { x:cx-0.22, y:2.47, w:0.44, h:0.44, fill:{color:isActive?YELLOW:LIGHT}, line:{color:isActive?YELLOW:NAVY} });
          if (isActive) sl.addText('✓', { x:cx-0.22, y:2.47, w:0.44, h:0.44, fontSize:14, fontFace:'Arial', bold:true, color:NAVY, align:'center', valign:'middle' });
          // Step number
          if (!isActive) sl.addText(`${si+1}`, { x:cx-0.22, y:2.47, w:0.44, h:0.44, fontSize:12, fontFace:'Arial', bold:true, color:NAVY, align:'center', valign:'middle' });
          // Label above
          sl.addText(step.label || '', { x:cx-1, y:1.55, w:2.0, h:0.8, fontSize:11, fontFace:'Arial', bold:true, color:NAVY, align:'center', wrap:true });
          // Date below
          if (step.date) sl.addText(step.date, { x:cx-1, y:3.1, w:2.0, h:0.4, fontSize:10, fontFace:'Arial', color:'888888', align:'center' });
          // Description
          if (step.desc) sl.addText(step.desc, { x:cx-1, y:3.55, w:2.0, h:0.9, fontSize:9, fontFace:'Arial', color:DARK, align:'center', wrap:true });
        });
        addFooter(sl, index);
      }

      // ── CLOSING ────────────────────────────────────────────
      else if (slide.type === 'closing') {
        sl.background = { color: NAVY };
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.12, fill:{color:YELLOW}, line:{color:YELLOW} });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:0.12, w:0.35, h:5.38, fill:{color:YELLOW}, line:{color:YELLOW} });
        sl.addText('SOMFY', { x:1, y:0.8, w:8, h:1.3, fontSize:64, fontFace:'Arial', bold:true, color:YELLOW, align:'center' });
        sl.addText(slide.title || 'Merci', { x:1, y:2.3, w:8, h:0.8, fontSize:26, fontFace:'Arial', bold:true, color:WHITE, align:'center' });
        if (slide.subtitle) sl.addText(slide.subtitle, { x:1, y:3.15, w:8, h:0.6, fontSize:16, fontFace:'Arial', color:BLUE, align:'center', wrap:true });
        sl.addShape(pres.shapes.RECTANGLE, { x:3.5, y:4.0, w:3, h:0.04, fill:{color:YELLOW}, line:{color:YELLOW} });
        sl.addText('somfy-agent.vercel.app', { x:1, y:4.2, w:8, h:0.4, fontSize:12, fontFace:'Arial', color:BLUE, align:'center' });
        sl.addShape(pres.shapes.RECTANGLE, { x:0, y:5.1, w:10, h:0.525, fill:{color:NAVY2}, line:{color:NAVY2} });
        sl.addText('Somfy France  —  Protection Solaire Dynamique', { x:0.5, y:5.1, w:9, h:0.525, fontSize:11, fontFace:'Arial', color:'7AAFC0', valign:'middle', align:'center' });
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
