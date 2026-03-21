/**
 * Compute aggregate stats from raw session data.
 * Called when a session is marked complete.
 */
const computeSessionStats = (session) => {
  const { keystrokes = [], pauses = [], speedSamples = [] } = session;

  const totalKeystrokes = keystrokes.length;
  const totalDeletes = keystrokes.filter(k => k.isDelete).length;
  const pasteEvents = keystrokes.filter(k => k.isPaste);
  const totalPastes = pasteEvents.length;
  const totalPasteChars = pasteEvents.reduce((sum, e) => sum + (e.pasteLength || 0), 0);

  const wpms = speedSamples.map(s => s.wpm).filter(w => w > 0);
  const avgWpm = wpms.length > 0 ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0;
  const cpms = speedSamples.map(s => s.cpm).filter(c => c > 0);
  const avgCpm = cpms.length > 0 ? Math.round(cpms.reduce((a, b) => a + b, 0) / cpms.length) : 0;

  // WPM variance
  const wpmVariance = wpms.length > 1
    ? Math.round(wpms.reduce((sum, w) => sum + Math.pow(w - avgWpm, 2), 0) / wpms.length)
    : 0;

  const pauseCount = pauses.length;
  const avgPauseDuration = pauseCount > 0
    ? Math.round(pauses.reduce((sum, p) => sum + p.duration, 0) / pauseCount)
    : 0;
  const longPauseCount = pauses.filter(p => p.duration > 2000).length;

  const deleteRate = totalKeystrokes > 0 ? totalDeletes / totalKeystrokes : 0;

  const sentencePauses = pauses.filter(p => p.beforeSentence);
  const sentencePauseAvg = sentencePauses.length > 0
    ? Math.round(sentencePauses.reduce((sum, p) => sum + p.duration, 0) / sentencePauses.length)
    : 0;

  const paragraphPauses = pauses.filter(p => p.beforeParagraph);
  const paragraphPauseAvg = paragraphPauses.length > 0
    ? Math.round(paragraphPauses.reduce((sum, p) => sum + p.duration, 0) / paragraphPauses.length)
    : 0;

  return {
    totalKeystrokes,
    totalDeletes,
    totalPastes,
    totalPasteChars,
    avgWpm,
    avgCpm,
    wpmVariance,
    pauseCount,
    avgPauseDuration,
    longPauseCount,
    deleteRate: Math.round(deleteRate * 1000) / 1000,
    revisionRate: Math.round(deleteRate * 1000) / 1000,
    sentencePauseAvg,
    paragraphPauseAvg
  };
};

module.exports = { computeSessionStats };
