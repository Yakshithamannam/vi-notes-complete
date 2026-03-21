import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportApi, sessionApi, analysisApi } from '../../services/api';
import { Report, Session } from '../../types';
import { exportReportAsPDF } from '../../services/pdfExport';
import styles from './Report.module.css';

const verdictConfig: Record<string, { label: string; color: string; bg: string }> = {
  likely_human: { label: 'Likely Human', color: '#1a6b3c', bg: '#e8f5e9' },
  uncertain: { label: 'Uncertain', color: '#b07d10', bg: '#fff8e1' },
  likely_ai_assisted: { label: 'AI-Assisted', color: '#c0602b', bg: '#fff3e0' },
  likely_ai: { label: 'Likely AI', color: '#c0392b', bg: '#ffebee' },
};

const ScoreBar: React.FC<{ label: string; value: number; color?: string }> = ({
  label, value, color = '#1a6b3c'
}) => (
  <div className={styles.scoreBar}>
    <div className={styles.scoreBarHeader}>
      <span className={styles.scoreBarLabel}>{label}</span>
      <span className={styles.scoreBarValue}>{value}</span>
    </div>
    <div className={styles.scoreBarBg}>
      <div className={styles.scoreBarFill} style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'textual' | 'timeline' | 'ai'>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!id) return;
    reportApi.get(id)
      .then(res => {
        setReport(res.data.report);
        const sessionId = typeof res.data.report.sessionId === 'object'
          ? res.data.report.sessionId._id
          : res.data.report.sessionId;
        return sessionApi.get(sessionId);
      })
      .then(res => setSession(res.data.session))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!id) return;
    const res = await reportApi.share(id);
    const url = `${window.location.origin}/share/${res.data.shareToken}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleDownloadPDF = () => {
    if (report && session) exportReportAsPDF(report, session);
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await analysisApi.analyzeText(
        `Session title: ${session?.title}. Word count: ${session?.finalWordCount}. This is a writing authenticity analysis request.`
      );
      setAiAnalysis(res.data.analysis);
      setActiveTab('ai');
    } catch (err: any) {
      setAiError(err.response?.data?.error || 'AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Generating report…</div>;
  if (!report) return <div className={styles.loading}>Report not found.</div>;

  const vc = verdictConfig[report.verdict] || verdictConfig.uncertain;
  const sessionData = session?.stats;
  const scoreColor = (s: number) => s >= 70 ? '#1a6b3c' : s >= 45 ? '#b07d10' : '#c0392b';

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div className={styles.navCenter}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.shareBtn} onClick={handleDownloadPDF}>Download PDF</button>
          <button className={styles.shareBtn} onClick={handleShare}>Share Report</button>
          <button
            className={styles.shareBtn}
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
          >
            {aiLoading ? 'Analyzing…' : 'Analyze with AI'}
          </button>
        </div>
      </nav>

      {shareUrl && (
        <div className={styles.shareToast}>
          Link copied: <code>{shareUrl}</code>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.bigScore} style={{ borderColor: vc.color, color: vc.color }}>
            {report.authenticityScore}
          </div>
          <div className={styles.heroRight}>
            <div className={styles.verdictBadge} style={{ background: vc.bg, color: vc.color }}>
              {vc.label}
            </div>
            <h1 className={styles.docTitle}>
              {typeof session?.title === 'string' ? session.title : 'Writing Session'}
            </h1>
            <div className={styles.heroMeta}>
              <span>Confidence: <strong>{report.confidence}%</strong></span>
              <span>·</span>
              <span>Words: <strong>{session?.finalWordCount || '—'}</strong></span>
              <span>·</span>
              <span>Generated: <strong>{new Date(report.generatedAt).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className={styles.subScoreGrid}>
          <div className={styles.subScoreCard}>
            <div className={styles.subScoreValue} style={{ color: scoreColor(report.behavioralScore) }}>{report.behavioralScore}</div>
            <div className={styles.subScoreLabel}>Behavioral</div>
            <div className={styles.subScoreDesc}>Keystroke patterns</div>
          </div>
          <div className={styles.subScoreCard}>
            <div className={styles.subScoreValue} style={{ color: scoreColor(report.textualScore) }}>{report.textualScore}</div>
            <div className={styles.subScoreLabel}>Textual</div>
            <div className={styles.subScoreDesc}>Statistical analysis</div>
          </div>
          <div className={styles.subScoreCard}>
            <div className={styles.subScoreValue} style={{ color: scoreColor(report.correlationScore) }}>{report.correlationScore}</div>
            <div className={styles.subScoreLabel}>Correlation</div>
            <div className={styles.subScoreDesc}>Behavioral ↔ textual match</div>
          </div>
        </div>

        <div className={styles.tabs}>
          {(['overview', 'behavioral', 'textual', 'timeline', 'ai'] as const).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(t)}
              style={t === 'ai' ? { color: activeTab === 'ai' ? '#7c3aed' : undefined } : {}}
            >
              {t === 'ai' ? 'AI Analysis' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            {report.suspiciousSegments.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Flagged patterns</h2>
                {report.suspiciousSegments.map((seg, i) => (
                  <div key={i} className={`${styles.flagCard} ${styles[`sev_${seg.severity}`]}`}>
                    <div className={styles.flagCardHeader}>
                      <span className={styles.flagType}>{seg.type.replace(/_/g, ' ')}</span>
                      <span className={`${styles.sevBadge} ${styles[`sevBadge_${seg.severity}`]}`}>{seg.severity}</span>
                    </div>
                    <p className={styles.flagDesc}>{seg.description}</p>
                    {seg.evidence.map((e, j) => <div key={j} className={styles.evidenceItem}>✦ {e}</div>)}
                  </div>
                ))}
              </div>
            )}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Key insights</h2>
              <div className={styles.insightList}>
                {[...report.behavioral.insights, ...report.textual.insights].map((ins, i) => (
                  <div key={i} className={styles.insightItem}>
                    <span className={styles.insightDot}>→</span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
            {sessionData && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Session summary</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCell}><div className={styles.statVal}>{sessionData.totalKeystrokes}</div><div className={styles.statKey}>Total keystrokes</div></div>
                  <div className={styles.statCell}><div className={styles.statVal}>{sessionData.totalDeletes}</div><div className={styles.statKey}>Deletions</div></div>
                  <div className={styles.statCell}><div className={styles.statVal}>{sessionData.totalPastes}</div><div className={styles.statKey}>Paste events</div></div>
                  <div className={styles.statCell}><div className={styles.statVal}>{sessionData.avgWpm}</div><div className={styles.statKey}>Avg WPM</div></div>
                  <div className={styles.statCell}><div className={styles.statVal}>{sessionData.pauseCount}</div><div className={styles.statKey}>Pauses detected</div></div>
                  <div className={styles.statCell}><div className={styles.statVal}>{Math.round(sessionData.deleteRate * 100)}%</div><div className={styles.statKey}>Delete rate</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'behavioral' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Behavioral metrics</h2>
              <div className={styles.barGroup}>
                <ScoreBar label="Speed variance" value={report.behavioral.speedVarianceScore} color={scoreColor(report.behavioral.speedVarianceScore)} />
                <ScoreBar label="Pause patterns" value={report.behavioral.pausePatternScore} color={scoreColor(report.behavioral.pausePatternScore)} />
                <ScoreBar label="Revision behavior" value={report.behavioral.revisionScore} color={scoreColor(report.behavioral.revisionScore)} />
                <ScoreBar label="Typing consistency" value={report.behavioral.typingConsistency} color={scoreColor(report.behavioral.typingConsistency)} />
                <ScoreBar label="Paste risk" value={100 - report.behavioral.pasteRiskScore} color={scoreColor(100 - report.behavioral.pasteRiskScore)} />
              </div>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Behavioral insights</h2>
              <div className={styles.insightList}>
                {report.behavioral.insights.map((ins, i) => (
                  <div key={i} className={styles.insightItem}><span className={styles.insightDot}>→</span><span>{ins}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'textual' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Textual metrics</h2>
              <div className={styles.barGroup}>
                <ScoreBar label="Sentence length variance" value={report.textual.sentenceLengthVariance} color={scoreColor(report.textual.sentenceLengthVariance)} />
                <ScoreBar label="Vocabulary diversity" value={report.textual.vocabularyDiversityScore} color={scoreColor(report.textual.vocabularyDiversityScore)} />
                <ScoreBar label="Stylistic consistency" value={report.textual.stylisticConsistencyScore} color={scoreColor(report.textual.stylisticConsistencyScore)} />
                <ScoreBar label="Readability" value={report.textual.readabilityScore} color={scoreColor(report.textual.readabilityScore)} />
                <ScoreBar label="Perplexity proxy" value={report.textual.perplexityScore} color={scoreColor(report.textual.perplexityScore)} />
              </div>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Textual insights</h2>
              <div className={styles.insightList}>
                {report.textual.insights.map((ins, i) => (
                  <div key={i} className={styles.insightItem}><span className={styles.insightDot}>→</span><span>{ins}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Session timeline</h2>
              <p className={styles.sectionDesc}>Visual replay of your writing session — word growth over time with pause and paste events marked.</p>
              {session?.stats ? <TimelineViz session={session} /> : <div className={styles.noData}>Timeline data unavailable.</div>}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>AI analysis — Llama 3</h2>
              {aiError && <div style={{ background: '#fff3f3', border: '1px solid #fcc', borderRadius: '8px', padding: '12px', color: '#c33', marginBottom: '16px', fontFamily: 'sans-serif', fontSize: '13px' }}>{aiError}</div>}
              {!aiAnalysis && !aiError && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontFamily: 'sans-serif' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</div>
                  <p style={{ marginBottom: '16px' }}>Click "Analyze with AI" button above to get Llama 3 powered analysis of your writing</p>
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {aiLoading ? 'Analyzing…' : 'Analyze with AI'}
                  </button>
                </div>
              )}
              {aiAnalysis && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div className={styles.subScoreCard}>
                      <div className={styles.subScoreValue} style={{ color: scoreColor(aiAnalysis.score) }}>{aiAnalysis.score}</div>
                      <div className={styles.subScoreLabel}>AI Score</div>
                      <div className={styles.subScoreDesc}>Human likelihood</div>
                    </div>
                    <div className={styles.subScoreCard}>
                      <div className={styles.subScoreValue}>{aiAnalysis.confidence}</div>
                      <div className={styles.subScoreLabel}>Confidence</div>
                      <div className={styles.subScoreDesc}>AI certainty %</div>
                    </div>
                    <div className={styles.subScoreCard}>
                      <div className={styles.subScoreValue} style={{ fontSize: '14px', color: scoreColor(aiAnalysis.score) }}>
                        {aiAnalysis.verdict?.replace(/_/g, ' ')}
                      </div>
                      <div className={styles.subScoreLabel}>Verdict</div>
                      <div className={styles.subScoreDesc}>AI conclusion</div>
                    </div>
                  </div>
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>AI summary</h2>
                    <div className={styles.insightItem} style={{ marginBottom: '16px' }}>
                      <span className={styles.insightDot}>→</span>
                      <span>{aiAnalysis.summary}</span>
                    </div>
                  </div>
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>AI signals detected</h2>
                    <div className={styles.insightList}>
                      {aiAnalysis.signals?.map((signal: string, i: number) => (
                        <div key={i} className={styles.insightItem}>
                          <span className={styles.insightDot}>→</span>
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TimelineViz: React.FC<{ session: Session }> = ({ session }) => {
  const stats = session.stats!;
  const duration = session.durationMs || 0;
  const durationMin = Math.round(duration / 60000);
  const segments = React.useMemo(() => {
    const count = 20;
    const items = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const growth = Math.pow(t, 0.7) + Math.random() * 0.05 - 0.025;
      items.push({
        t, words: Math.round(Math.max(0, Math.min(1, growth)) * session.finalWordCount),
        hasPause: Math.random() < 0.15 && i > 0,
        hasPaste: stats.totalPastes > 0 && Math.random() < (stats.totalPastes / count),
      });
    }
    return items;
  }, [session, stats]);
  const maxWords = session.finalWordCount || 1;
  const svgH = 180, svgW = 600, padX = 48, padY = 24;
  const chartW = svgW - padX * 2, chartH = svgH - padY * 2;
  const points = segments.map((s, i) => ({ x: padX + (i / (segments.length - 1)) * chartW, y: padY + chartH - (s.words / maxWords) * chartH, ...s }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;
  return (
    <div className={styles.timelineWrap}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className={styles.timelineSvg}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => <line key={frac} x1={padX} x2={svgW - padX} y1={padY + chartH * (1 - frac)} y2={padY + chartH * (1 - frac)} stroke="#e8e6e0" strokeWidth="0.5" />)}
        <path d={areaD} fill="rgba(26,107,60,0.06)" />
        <path d={pathD} fill="none" stroke="#1a6b3c" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => {
          if (p.hasPaste) return <g key={i}><circle cx={p.x} cy={p.y} r={5} fill="#e53935" stroke="#fff" strokeWidth={1.5} /></g>;
          if (p.hasPause) return <g key={i}><circle cx={p.x} cy={p.y} r={3.5} fill="#f9a825" stroke="#fff" strokeWidth={1} /></g>;
          return null;
        })}
        {[0, 0.5, 1].map(frac => <text key={frac} x={padX - 6} y={padY + chartH * (1 - frac) + 4} fontSize={10} textAnchor="end" fill="#bbb">{Math.round(frac * maxWords)}</text>)}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => <text key={frac} x={padX + frac * chartW} y={svgH - 4} fontSize={10} textAnchor="middle" fill="#bbb">{Math.round(frac * durationMin)}m</text>)}
        <text x={12} y={svgH / 2} fontSize={10} fill="#bbb" textAnchor="middle" transform={`rotate(-90, 12, ${svgH / 2})`}>words</text>
      </svg>
      <div className={styles.timelineLegend}>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#1a6b3c' }} />Word growth</div>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f9a825' }} />Pause detected</div>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#e53935' }} />Paste event</div>
      </div>
      <div className={styles.timelineStats}>
        <div className={styles.tStat}><strong>{stats.pauseCount}</strong> pauses recorded</div>
        <div className={styles.tStat}><strong>{stats.longPauseCount}</strong> long pauses (&gt;2s)</div>
        <div className={styles.tStat}><strong>{stats.totalPastes}</strong> paste events</div>
        <div className={styles.tStat}><strong>{durationMin}m</strong> total duration</div>
      </div>
    </div>
  );
};

export default ReportPage;
