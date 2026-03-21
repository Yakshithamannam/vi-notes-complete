import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sessionApi, reportApi } from '../../services/api';
import { exportSessionsAsCSV } from '../../services/csvExport';
import { Session } from '../../types';
import styles from './AnalyticsDashboard.module.css';

const verdictColor: Record<string, string> = {
  likely_human: '#1a6b3c',
  uncertain: '#b07d10',
  likely_ai_assisted: '#c0602b',
  likely_ai: '#c0392b',
};

const AnalyticsDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionApi.list({ limit: 50 })
      .then(res => setSessions(res.data.sessions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute stats
  const analyzed = sessions.filter(s => s.analysisResult);
  const scores = analyzed.map(s => (s.analysisResult as any)?.authenticityScore || 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalWords = sessions.reduce((sum, s) => sum + (s.finalWordCount || 0), 0);
  const totalSessions = sessions.length;
  const humanCount = analyzed.filter(s => (s.analysisResult as any)?.verdict === 'likely_human').length;
  const flaggedCount = analyzed.filter(s => {
    const score = (s.analysisResult as any)?.authenticityScore;
    return score !== undefined && score < 50;
  }).length;

  // Score distribution for bar chart
  const distribution = [
    { label: '0-20', count: scores.filter(s => s <= 20).length, color: '#c0392b' },
    { label: '21-40', count: scores.filter(s => s > 20 && s <= 40).length, color: '#e67e22' },
    { label: '41-60', count: scores.filter(s => s > 40 && s <= 60).length, color: '#f39c12' },
    { label: '61-80', count: scores.filter(s => s > 60 && s <= 80).length, color: '#27ae60' },
    { label: '81-100', count: scores.filter(s => s > 80).length, color: '#1a6b3c' },
  ];
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  // Last 7 sessions for timeline
  const recent = [...sessions].slice(0, 7).reverse();

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div className={styles.navCenter}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <button className={styles.exportBtn} onClick={() => exportSessionsAsCSV(sessions)}>
          Export CSV
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Analytics</h1>
          <p className={styles.pageSubtitle}>Your writing stats and authenticity trends</p>
        </div>

        {/* Stat cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{totalSessions}</div>
            <div className={styles.statLabel}>Total sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{totalWords.toLocaleString()}</div>
            <div className={styles.statLabel}>Total words written</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{ color: avgScore >= 70 ? '#1a6b3c' : avgScore >= 45 ? '#b07d10' : '#c0392b' }}>
              {avgScore}
            </div>
            <div className={styles.statLabel}>Avg authenticity score</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{ color: '#1a6b3c' }}>{humanCount}</div>
            <div className={styles.statLabel}>Verified human</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{ color: '#c0392b' }}>{flaggedCount}</div>
            <div className={styles.statLabel}>Flagged sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{analyzed.length}</div>
            <div className={styles.statLabel}>Reports generated</div>
          </div>
        </div>

        {/* Score distribution chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Score distribution</h2>
          <p className={styles.chartSubtitle}>How your authenticity scores are spread</p>
          {scores.length === 0 ? (
            <div className={styles.noData}>No analyzed sessions yet — complete a session to see your distribution</div>
          ) : (
            <div className={styles.barChart}>
              {distribution.map((d, i) => (
                <div key={i} className={styles.barGroup}>
                  <div className={styles.barWrap}>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${Math.round((d.count / maxCount) * 160)}px`,
                        background: d.color,
                        minHeight: d.count > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                  <div className={styles.barCount}>{d.count}</div>
                  <div className={styles.barLabel}>{d.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions timeline */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Recent sessions</h2>
          <p className={styles.chartSubtitle}>Your last {recent.length} sessions</p>
          {recent.length === 0 ? (
            <div className={styles.noData}>No sessions yet</div>
          ) : (
            <div className={styles.timelineChart}>
              {recent.map((session, i) => {
                const score = (session.analysisResult as any)?.authenticityScore;
                const verdict = (session.analysisResult as any)?.verdict;
                return (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineBar}>
                      <div
                        className={styles.timelineFill}
                        style={{
                          width: score !== undefined ? `${score}%` : '0%',
                          background: verdict ? verdictColor[verdict] : '#e8e6e0'
                        }}
                      />
                    </div>
                    <div className={styles.timelineInfo}>
                      <span className={styles.timelineTitle}>{session.title || 'Untitled'}</span>
                      <span className={styles.timelineScore}>
                        {score !== undefined ? score : 'Not analyzed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verdict breakdown */}
        {analyzed.length > 0 && (
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Verdict breakdown</h2>
            <p className={styles.chartSubtitle}>Distribution of your authenticity verdicts</p>
            <div className={styles.verdictGrid}>
              {[
                { key: 'likely_human', label: 'Likely Human' },
                { key: 'uncertain', label: 'Uncertain' },
                { key: 'likely_ai_assisted', label: 'AI-Assisted' },
                { key: 'likely_ai', label: 'Likely AI' },
              ].map(v => {
                const count = analyzed.filter(s => (s.analysisResult as any)?.verdict === v.key).length;
                const pct = Math.round((count / analyzed.length) * 100);
                return (
                  <div key={v.key} className={styles.verdictCard}>
                    <div className={styles.verdictCount} style={{ color: verdictColor[v.key] }}>{count}</div>
                    <div className={styles.verdictLabel}>{v.label}</div>
                    <div className={styles.verdictPct}>{pct}%</div>
                    <div className={styles.verdictBar}>
                      <div
                        className={styles.verdictBarFill}
                        style={{ width: `${pct}%`, background: verdictColor[v.key] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
