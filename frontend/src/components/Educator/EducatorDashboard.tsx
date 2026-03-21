import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import styles from './EducatorDashboard.module.css';

interface StudentSession {
  _id: string;
  title: string;
  status: string;
  finalWordCount: number;
  durationMs: number;
  createdAt: string;
  userId: { name: string; email: string; _id: string };
  analysisResult?: {
    authenticityScore: number;
    verdict: string;
    confidence: number;
  };
}

const verdictColor: Record<string, string> = {
  likely_human: '#1a6b3c',
  uncertain: '#b07d10',
  likely_ai_assisted: '#c0602b',
  likely_ai: '#c0392b',
};

const verdictLabel: Record<string, string> = {
  likely_human: 'Likely Human',
  uncertain: 'Uncertain',
  likely_ai_assisted: 'AI-Assisted',
  likely_ai: 'Likely AI',
};

const EducatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, analyzed: 0, flagged: 0, avgScore: 0 });

  useEffect(() => {
    if (user?.role !== 'educator' && user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    api.get('/educator/sessions')
      .then(res => {
        const data: StudentSession[] = res.data.sessions;
        setSessions(data);
        const analyzed = data.filter(s => s.analysisResult);
        const flagged = analyzed.filter(s =>
          s.analysisResult && s.analysisResult.authenticityScore < 50
        );
        const avgScore = analyzed.length
          ? Math.round(analyzed.reduce((sum, s) => sum + (s.analysisResult?.authenticityScore || 0), 0) / analyzed.length)
          : 0;
        setStats({ total: data.length, analyzed: analyzed.length, flagged: flagged.length, avgScore });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = sessions.filter(s => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'flagged' ? (s.analysisResult?.authenticityScore || 100) < 50 :
      filter === 'analyzed' ? !!s.analysisResult :
      s.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
          <span className={styles.roleBadge}>Educator</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Student submissions</h1>
          <p className={styles.pageSubtitle}>Review and verify student writing authenticity</p>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{stats.total}</div>
            <div className={styles.statLabel}>Total sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{stats.analyzed}</div>
            <div className={styles.statLabel}>Analyzed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{ color: '#c0392b' }}>{stats.flagged}</div>
            <div className={styles.statLabel}>Flagged (&lt;50 score)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{stats.avgScore}</div>
            <div className={styles.statLabel}>Avg authenticity score</div>
          </div>
        </div>

        {/* Search and filter */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by student name, email or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All sessions</option>
            <option value="analyzed">Analyzed only</option>
            <option value="flagged">Flagged (score &lt; 50)</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.empty}>Loading submissions…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No sessions found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Document</th>
                  <th>Words</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(session => {
                  const score = session.analysisResult?.authenticityScore;
                  const verdict = session.analysisResult?.verdict;
                  return (
                    <tr key={session._id} className={styles.tableRow}>
                      <td>
                        <div className={styles.studentName}>{session.userId?.name || '—'}</div>
                        <div className={styles.studentEmail}>{session.userId?.email || '—'}</div>
                      </td>
                      <td className={styles.docTitle}>{session.title || 'Untitled'}</td>
                      <td className={styles.wordCount}>{session.finalWordCount}</td>
                      <td>
                        {score !== undefined ? (
                          <span
                            className={styles.scorePill}
                            style={{ color: verdictColor[verdict || ''] || '#888', borderColor: verdictColor[verdict || ''] || '#888' }}
                          >
                            {score}
                          </span>
                        ) : <span className={styles.notAnalyzed}>—</span>}
                      </td>
                      <td>
                        {verdict ? (
                          <span
                            className={styles.verdictTag}
                            style={{ color: verdictColor[verdict], background: verdictColor[verdict] + '18' }}
                          >
                            {verdictLabel[verdict]}
                          </span>
                        ) : <span className={styles.notAnalyzed}>Not analyzed</span>}
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td>
                        {session.analysisResult && (
                          <button
                            className={styles.viewBtn}
                            onClick={() => navigate(`/reports/${(session.analysisResult as any)._id || ''}`)}
                          >
                            View report
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default EducatorDashboard;
