/**
 * Vi-Notes Analysis Service
 * Computes behavioral and textual authenticity scores.
 * This is the core detection engine.
 */

/**
 * Main analysis function - takes a completed session and returns a full analysis result
 */
const analyzeSession = (session, textContent = '') => {
  const behavioral = analyzeBehavioral(session);
  const textual = analyzeTextual(textContent);
  const correlation = analyzeCorrelation(session, textual);

  // Weighted composite score
  const authenticityScore = Math.round(
    behavioral.score * 0.45 +
    textual.score * 0.30 +
    correlation.score * 0.25
  );

  const verdict = getVerdict(authenticityScore);
  const confidence = computeConfidence(session, behavioral, textual);
  const suspiciousSegments = detectSuspiciousSegments(session, textContent);

  return {
    authenticityScore,
    verdict,
    confidence,
    behavioralScore: behavioral.score,
    textualScore: textual.score,
    correlationScore: correlation.score,
    behavioral: {
      typingConsistency: behavioral.typingConsistency,
      pausePatternScore: behavioral.pausePatternScore,
      revisionScore: behavioral.revisionScore,
      pasteRiskScore: behavioral.pasteRiskScore,
      speedVarianceScore: behavioral.speedVarianceScore,
      insights: behavioral.insights
    },
    textual: {
      sentenceLengthVariance: textual.sentenceLengthVariance,
      vocabularyDiversityScore: textual.vocabularyDiversityScore,
      stylisticConsistencyScore: textual.stylisticConsistencyScore,
      readabilityScore: textual.readabilityScore,
      perplexityScore: textual.perplexityScore,
      insights: textual.insights
    },
    suspiciousSegments
  };
};

/**
 * Behavioral analysis from keystroke metadata
 */
const analyzeBehavioral = (session) => {
  const { keystrokes = [], pauses = [], stats = {}, speedSamples = [] } = session;
  const insights = [];
  let score = 50; // start neutral

  // 1. Typing speed variance (higher variance = more human-like)
  const speedVarianceScore = computeSpeedVariance(speedSamples);
  if (speedVarianceScore > 70) {
    score += 15;
    insights.push('Natural typing speed variation detected — consistent with human writing patterns.');
  } else if (speedVarianceScore < 30) {
    score -= 20;
    insights.push('Unusually uniform typing speed detected — may indicate pasted or AI-generated content.');
  }

  // 2. Pause patterns
  const pausePatternScore = analyzePausePatterns(pauses);
  if (pausePatternScore > 65) {
    score += 12;
    insights.push('Pause distribution before sentences and paragraphs matches human thinking patterns.');
  } else if (pausePatternScore < 35) {
    score -= 15;
    insights.push('Atypical pause patterns detected — human writing typically shows pauses at structural boundaries.');
  }

  // 3. Revision behavior
  const revisionScore = computeRevisionScore(stats);
  if (revisionScore > 60) {
    score += 10;
    insights.push('Healthy revision behavior observed — deletions and edits correlate with idea formation.');
  } else if (revisionScore < 20) {
    score -= 18;
    insights.push('Very low revision rate — human writers typically revise during composition.');
  }

  // 4. Paste risk
  const pasteRiskScore = computePasteRisk(keystrokes, stats);
  if (pasteRiskScore > 70) {
    score -= 25;
    insights.push('Significant paste activity detected — large text blocks inserted without corresponding keystrokes.');
  } else if (pasteRiskScore < 20) {
    score += 8;
    insights.push('Minimal paste activity — content appears to have been typed progressively.');
  }

  // 5. Micro-pause analysis around punctuation
  const typingConsistency = computeTypingConsistency(keystrokes);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    typingConsistency,
    pausePatternScore,
    revisionScore,
    pasteRiskScore,
    speedVarianceScore,
    insights
  };
};

/**
 * Textual/statistical analysis of the written content
 */
const analyzeTextual = (text) => {
  if (!text || text.length < 50) {
    return {
      score: 50, sentenceLengthVariance: 50, vocabularyDiversityScore: 50,
      stylisticConsistencyScore: 50, readabilityScore: 50, perplexityScore: 50,
      insights: ['Insufficient text for full statistical analysis.']
    };
  }

  const insights = [];
  let score = 50;

  const sentences = splitSentences(text);
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Sentence length variance
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const sentenceLengthVariance = computeVariance(sentenceLengths);
  const normalizedSLV = Math.min(100, (sentenceLengthVariance / 50) * 100);

  if (normalizedSLV > 60) {
    score += 12;
    insights.push('High sentence length variation — characteristic of natural human writing style.');
  } else if (normalizedSLV < 25) {
    score -= 15;
    insights.push('Very uniform sentence lengths — AI-generated text often exhibits this regularityity.');
  }

  // Vocabulary diversity (Type-Token Ratio adjusted for length)
  const uniqueWords = new Set(words).size;
  const ttr = words.length > 0 ? uniqueWords / words.length : 0;
  const vocabularyDiversityScore = Math.round(ttr * 100);

  if (ttr > 0.55) {
    score += 8;
    insights.push('Rich vocabulary diversity detected.');
  } else if (ttr < 0.3) {
    score -= 10;
    insights.push('Lower vocabulary diversity — may indicate templated or formulaic content.');
  }

  // Stylistic consistency — look for unusual uniformity in paragraph length
  const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
  const paraVariance = computeVariance(paraLengths);
  const stylisticConsistencyScore = Math.min(100, (paraVariance / 30) * 100);

  // Perplexity proxy — look for overly predictable n-grams
  const perplexityScore = estimatePerplexityProxy(words);

  // Readability (Flesch-Kincaid approximation)
  const readabilityScore = computeReadability(sentences, words);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    sentenceLengthVariance: Math.round(normalizedSLV),
    vocabularyDiversityScore,
    stylisticConsistencyScore: Math.round(stylisticConsistencyScore),
    readabilityScore: Math.round(readabilityScore),
    perplexityScore: Math.round(perplexityScore),
    insights
  };
};

/**
 * Cross-correlation: does behavioral data match textual patterns?
 */
const analyzeCorrelation = (session, textualResult) => {
  const { keystrokes = [], stats = {} } = session;
  let score = 60;
  const insights = [];

  // If text exists but keystrokes are minimal, that's suspicious
  const keystrokeCount = keystrokes.length;
  const wordCount = session.finalWordCount || 0;

  if (wordCount > 50 && keystrokeCount < wordCount * 2) {
    score -= 30;
    insights.push('Keystroke count is disproportionately low for the amount of text — possible external content insertion.');
  }

  // Paste chars vs word count correlation
  if (stats.totalPasteChars && wordCount > 0) {
    const pasteRatio = stats.totalPasteChars / (wordCount * 5);
    if (pasteRatio > 0.6) {
      score -= 20;
      insights.push('Majority of characters appear to have been pasted, not typed.');
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { score, insights };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const computeSpeedVariance = (speedSamples) => {
  if (!speedSamples || speedSamples.length < 3) return 50;
  const wpms = speedSamples.map(s => s.wpm).filter(w => w > 0);
  return Math.min(100, (computeVariance(wpms) / 200) * 100);
};

const analyzePausePatterns = (pauses) => {
  if (!pauses || pauses.length < 2) return 50;
  const durations = pauses.map(p => p.duration);
  const variance = computeVariance(durations);
  // Human pauses are highly variable in length
  return Math.min(100, (variance / 5000000) * 100 + 30);
};

const computeRevisionScore = (stats) => {
  if (!stats || stats.totalKeystrokes === 0) return 30;
  const deleteRate = stats.deleteRate || 0;
  // Healthy human delete rate: 5-25%
  if (deleteRate >= 0.05 && deleteRate <= 0.30) return 75;
  if (deleteRate > 0.30) return 55; // very high revision, slightly suspicious
  return Math.round(deleteRate * 500); // very low = low score
};

const computePasteRisk = (keystrokes, stats) => {
  const pasteEvents = keystrokes.filter(k => k.isPaste);
  if (pasteEvents.length === 0) return 5;
  const totalPasteChars = pasteEvents.reduce((sum, e) => sum + (e.pasteLength || 0), 0);
  return Math.min(100, (totalPasteChars / 500) * 100);
};

const computeTypingConsistency = (keystrokes) => {
  if (!keystrokes || keystrokes.length < 10) return 50;
  const intervals = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const gap = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;
    if (gap > 0 && gap < 2000) intervals.push(gap);
  }
  if (intervals.length === 0) return 50;
  const variance = computeVariance(intervals);
  return Math.min(100, Math.round((variance / 100000) * 100));
};

const computeVariance = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squaredDiffs = arr.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
};

const splitSentences = (text) =>
  text.match(/[^.!?]+[.!?]+/g) || [text];

const estimatePerplexityProxy = (words) => {
  // Rough proxy: ratio of unique bigrams to total bigrams
  // Low unique bigrams = more predictable = more AI-like
  if (words.length < 10) return 50;
  const bigrams = new Set();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]}_${words[i + 1]}`);
  }
  const ratio = bigrams.size / (words.length - 1);
  return Math.min(100, Math.round(ratio * 120));
};

const computeReadability = (sentences, words) => {
  if (sentences.length === 0 || words.length === 0) return 50;
  const avgSentenceLength = words.length / sentences.length;
  // Simplified FK score proxy, returned as 0-100
  const score = 100 - Math.min(100, avgSentenceLength * 3);
  return Math.max(0, score);
};

const getVerdict = (score) => {
  if (score >= 75) return 'likely_human';
  if (score >= 55) return 'uncertain';
  if (score >= 35) return 'likely_ai_assisted';
  return 'likely_ai';
};

const computeConfidence = (session, behavioral, textual) => {
  // Confidence is higher when we have more data
  const keystrokeCount = session.keystrokes?.length || 0;
  const wordCount = session.finalWordCount || 0;
  let confidence = 40;
  if (keystrokeCount > 100) confidence += 20;
  if (keystrokeCount > 500) confidence += 15;
  if (wordCount > 100) confidence += 15;
  if (wordCount > 300) confidence += 10;
  return Math.min(95, confidence);
};

const detectSuspiciousSegments = (session, text) => {
  const segments = [];

  // Flag paste events as suspicious segments
  const pasteEvents = session.keystrokes?.filter(k => k.isPaste) || [];
  pasteEvents.forEach(event => {
    if (event.pasteLength > 50) {
      segments.push({
        type: 'paste',
        description: `Large text block pasted (${event.pasteLength} characters) at position ${event.wordPosition || 0}`,
        severity: event.pasteLength > 200 ? 'high' : 'medium',
        wordStart: event.wordPosition || 0,
        wordEnd: (event.wordPosition || 0) + Math.round(event.pasteLength / 5),
        evidence: [`Paste event detected with ${event.pasteLength} characters`]
      });
    }
  });

  return segments;
};

module.exports = { analyzeSession, analyzeBehavioral, analyzeTextual };
