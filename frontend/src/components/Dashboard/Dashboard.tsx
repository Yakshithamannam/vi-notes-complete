import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sessionApi, reportApi } from '../../services/api';
import { Session, Report } from '../../types';
import DarkModeToggle from '../DarkMode/DarkModeToggle';
import NotificationBell from '../Notifications/NotificationBell';
import SessionSearch, { FilterState } from '../Search/SessionSearch';
import styles from './Dashboard.module.css';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDuration = (ms?: number) => {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const scoreColor = (score?: number) => {
  if (score === undefined) return '#aaa';
  if (score >= 70) return '#1a6b3c';
  if (score >= 45) return '#b07d10';
  return '#c0392b';
};

const verdictLabel: Record<string, string> = {
  likely_human: 'Likely Human',
  uncertain: 'Uncertain',
  likely_ai_assisted: 'AI-Assisted',
  likely_ai: 'Likely AI',
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filtered, setFiltered] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionApi.list({ limit: 50 })
      .then(res => {
        setSessions(res.data.sessions);
        setFiltered(res.data.sessions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (filters: FilterState) => {
    let result = [...sessions];

    if (filters.search) {
      result = result.filter(s =>
        s.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status);
    }

    if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === 'words') {
      result.sort((a, b) => (b.finalWordCount || 0) - (a.finalWordCount || 0));
    } else if (filters.sortBy === 'score') {
      result.sort((a, b) => {
        const scoreA = (a.analysisResult as any)?.authenticityScore || 0;
        const scoreB = (b.analysisResult as any)?.authenticityScore || 0;
        return scoreB - scoreA;
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    setFiltered(result);
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await sessionApi.delete(id);
    setSessions(prev => prev.filter(s => s._id !== id));
    setFiltered(prev => prev.filter(s => s._id !== id));
  };

  const analyzSession = async (id: string) => {
    const res = await reportApi.generate(id);
    navigate(`/reports/${res.data.report._id}`);
  };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navBrand} onClick={() => navigate('/dashboard')}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <div className={styles.navRight}>
          <button className={styles.navLink} onClick={() => navigate('/analytics')}>Analytics</button>
          <button className={styles.navLink} onClick={() => navigate('/profile')}>Profile</button>
          <DarkModeToggle />
          <NotificationBell />
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Sessions</h1>
            <p className={styles.pageSubtitle}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className={styles.newBtn} onClick={() => navigate('/editor')}>
            + New Session
          </button>
        </div>

        <SessionSearch onFilterChange={handleFilterChange} />

        {loading ? (
          <div className={styles.empty}>Loading sessions…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✎</div>
            <h3>No sessions yet</h3>
            <p>Start a writing session to generate your first authenticity report.</p>
            <button className={styles.newBtn} onClick={() => navigate('/editor')}>
              Start writing
            </button>
          </div>
        ) : (
          <div className={styles.sessionGrid}>
            {filtered.map(session => {
              const report = session.analysisResult as Report | undefined;
              const score = report?.authenticityScore;
              const verdict = report?.verdict;

              return (
                <div key={session._id} className={styles.sessionCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      {session.title || 'Untitled Document'}
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status_${session.status}`]}`}>
                      {session.status}
                    </span>
                  </div>

                  <div className={styles.cardMeta}>
                    <span>{formatDate(session.createdAt)}</span>
                    <span>·</span>
                    <span>{session.finalWordCount} words</span>
                    <span>·</span>
                    <span>{formatDuration(session.durationMs)}</span>
                  </div>

                  {score !== undefined && verdict && (
                    <div className={styles.scoreRow}>
                      <div
                        className={styles.scoreCircle}
                        style={{ borderColor: scoreColor(score), color: scoreColor(score) }}
                      >
                        {score}
                      </div>
                      <div>
                        <div className={styles.verdictLabel} style={{ color: scoreColor(score) }}>
                          {verdictLabel[verdict]}
                        </div>
                        <div className={styles.verdictSub}>authenticity score</div>
                      </div>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    {session.status === 'completed' && (
                      <button className={styles.actionBtn} onClick={() => analyzSession(session._id)}>
                        Analyze
                      </button>
                    )}
                    {session.status === 'analyzed' && report && (
                      <button
                        className={styles.actionBtnPrimary}
                        onClick={() => navigate(`/reports/${(report as Report)._id}`)}
                      >
                        View Report
                      </button>
                    )}
                    <button className={styles.deleteBtn} onClick={() => deleteSession(session._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
