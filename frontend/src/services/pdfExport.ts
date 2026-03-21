import { Report, Session } from '../types';

const verdictLabel: Record<string, string> = {
  likely_human: 'Likely Human',
  uncertain: 'Uncertain',
  likely_ai_assisted: 'AI-Assisted',
  likely_ai: 'Likely AI',
};

const scoreColor = (score: number) => {
  if (score >= 70) return '#1a6b3c';
  if (score >= 45) return '#b07d10';
  return '#c0392b';
};

export const exportReportAsPDF = (report: Report, session: Session) => {
  const color = scoreColor(report.authenticityScore);
  const verdict = verdictLabel[report.verdict] || report.verdict;
  const date = new Date(report.generatedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Vi-Notes Authenticity Report — ${session.title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 24px; margin-bottom: 32px; }
        .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .brand span { color: #1a6b3c; }
        .meta { text-align: right; font-family: sans-serif; font-size: 12px; color: #888; line-height: 1.8; }
        .hero { display: flex; align-items: center; gap: 32px; background: #f7f6f2; border-radius: 12px; padding: 28px; margin-bottom: 32px; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: ${color}; flex-shrink: 0; }
        .verdict-badge { display: inline-block; background: ${color}22; color: ${color}; font-family: sans-serif; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .doc-title { font-size: 20px; font-weight: 400; margin-bottom: 8px; }
        .hero-meta { font-family: sans-serif; font-size: 12px; color: #888; }
        h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e8e6e0; font-family: sans-serif; }
        .section { margin-bottom: 32px; }
        .scores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .score-card { background: #f7f6f2; border-radius: 8px; padding: 16px; text-align: center; }
        .score-val { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .score-lbl { font-family: sans-serif; font-size: 11px; color: #888; }
        .bar-row { margin-bottom: 10px; }
        .bar-label { display: flex; justify-content: space-between; font-family: sans-serif; font-size: 12px; margin-bottom: 4px; }
        .bar-bg { height: 6px; background: #e8e6e0; border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; }
        .insight { padding: 8px 12px; background: #f7f6f2; border-radius: 6px; font-family: sans-serif; font-size: 12px; color: #444; margin-bottom: 6px; line-height: 1.5; }
        .flag { padding: 10px 14px; border-left: 3px solid #c0392b; background: #fff5f5; border-radius: 0 6px 6px 0; margin-bottom: 8px; }
        .flag-type { font-family: sans-serif; font-size: 11px; font-weight: 700; color: #c0392b; text-transform: uppercase; margin-bottom: 4px; }
        .flag-desc { font-family: sans-serif; font-size: 12px; color: #555; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .stat-cell { background: #f7f6f2; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-val { font-size: 22px; font-weight: 700; color: #1a1a1a; }
        .stat-lbl { font-family: sans-serif; font-size: 11px; color: #888; margin-top: 2px; }
        .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e8e6e0; font-family: sans-serif; font-size: 11px; color: #bbb; text-align: center; line-height: 1.8; }
        @media print { body { padding: 24px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand"><span>Ψ</span> Vi-Notes</div>
        <div class="meta">
          <div>Authenticity Report</div>
          <div>Generated: ${date}</div>
          <div>Algorithm v${report.algorithmVersion || '1.0.0'}</div>
        </div>
      </div>

      <div class="hero">
        <div class="score-circle">${report.authenticityScore}</div>
        <div>
          <div class="verdict-badge">${verdict}</div>
          <div class="doc-title">${session.title || 'Untitled Document'}</div>
          <div class="hero-meta">
            Confidence: ${report.confidence}% &nbsp;·&nbsp;
            Words: ${session.finalWordCount} &nbsp;·&nbsp;
            Duration: ${Math.round((session.durationMs || 0) / 60000)} min
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Score breakdown</h2>
        <div class="scores-grid">
          <div class="score-card">
            <div class="score-val" style="color:${scoreColor(report.behavioralScore)}">${report.behavioralScore}</div>
            <div class="score-lbl">Behavioral</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:${scoreColor(report.textualScore)}">${report.textualScore}</div>
            <div class="score-lbl">Textual</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:${scoreColor(report.correlationScore)}">${report.correlationScore}</div>
            <div class="score-lbl">Correlation</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Behavioral analysis</h2>
        ${[
          { label: 'Speed variance', value: report.behavioral.speedVarianceScore },
          { label: 'Pause patterns', value: report.behavioral.pausePatternScore },
          { label: 'Revision behavior', value: report.behavioral.revisionScore },
          { label: 'Paste risk (inverted)', value: 100 - report.behavioral.pasteRiskScore },
        ].map(b => `
          <div class="bar-row">
            <div class="bar-label"><span>${b.label}</span><span>${b.value}</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${b.value}%;background:${scoreColor(b.value)}"></div></div>
          </div>
        `).join('')}
        ${report.behavioral.insights.map(i => `<div class="insight">→ ${i}</div>`).join('')}
      </div>

      <div class="section">
        <h2>Textual analysis</h2>
        ${[
          { label: 'Sentence length variance', value: report.textual.sentenceLengthVariance },
          { label: 'Vocabulary diversity', value: report.textual.vocabularyDiversityScore },
          { label: 'Stylistic consistency', value: report.textual.stylisticConsistencyScore },
          { label: 'Readability', value: report.textual.readabilityScore },
        ].map(t => `
          <div class="bar-row">
            <div class="bar-label"><span>${t.label}</span><span>${t.value}</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${t.value}%;background:${scoreColor(t.value)}"></div></div>
          </div>
        `).join('')}
        ${report.textual.insights.map(i => `<div class="insight">→ ${i}</div>`).join('')}
      </div>

      ${report.suspiciousSegments?.length > 0 ? `
      <div class="section">
        <h2>Flagged patterns</h2>
        ${report.suspiciousSegments.map(s => `
          <div class="flag">
            <div class="flag-type">${s.type.replace(/_/g, ' ')} — ${s.severity}</div>
            <div class="flag-desc">${s.description}</div>
          </div>
        `).join('')}
      </div>` : ''}

      <div class="footer">
        This report was generated by Vi-Notes — Authenticity Verification Platform<br/>
        Built by Vicharanashala · Mentored by Jinal Gupta<br/>
        Report ID: ${report._id}
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to export PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
};
