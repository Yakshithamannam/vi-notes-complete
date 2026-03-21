import { Session } from '../types';

export const exportSessionsAsCSV = (sessions: Session[]) => {
  const headers = [
    'Title',
    'Status',
    'Word Count',
    'Duration (mins)',
    'Authenticity Score',
    'Verdict',
    'Date Created',
    'Total Keystrokes',
    'Total Pastes',
    'Avg WPM',
    'Delete Rate (%)',
  ];

  const rows = sessions.map(session => {
    const report = session.analysisResult as any;
    const stats = session.stats;
    return [
      `"${session.title || 'Untitled'}"`,
      session.status,
      session.finalWordCount || 0,
      session.durationMs ? Math.round(session.durationMs / 60000) : 0,
      report?.authenticityScore || '',
      report?.verdict?.replace(/_/g, ' ') || 'not analyzed',
      new Date(session.createdAt).toLocaleDateString('en-IN'),
      stats?.totalKeystrokes || 0,
      stats?.totalPastes || 0,
      stats?.avgWpm || 0,
      stats?.deleteRate ? Math.round(stats.deleteRate * 100) : 0,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vi-notes-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
