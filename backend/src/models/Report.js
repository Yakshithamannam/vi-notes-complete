const mongoose = require('mongoose');

const suspiciousSegmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paste', 'uniform_speed', 'no_revisions', 'missing_keystrokes', 'statistical_anomaly']
  },
  description: String,
  severity: { type: String, enum: ['low', 'medium', 'high'] },
  wordStart: Number,
  wordEnd: Number,
  evidence: [String]
}, { _id: false });

const reportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Overall authenticity score (0-100, higher = more likely human)
  authenticityScore: { type: Number, min: 0, max: 100 },
  verdict: {
    type: String,
    enum: ['likely_human', 'uncertain', 'likely_ai', 'likely_ai_assisted']
  },
  confidence: { type: Number, min: 0, max: 100 },

  // Sub-scores
  behavioralScore: { type: Number, min: 0, max: 100 },  // from keystroke patterns
  textualScore: { type: Number, min: 0, max: 100 },     // from statistical analysis
  correlationScore: { type: Number, min: 0, max: 100 }, // behavioral-textual match

  // Behavioral analysis
  behavioral: {
    typingConsistency: Number,    // lower = more human-like variance
    pausePatternScore: Number,    // how natural pauses are
    revisionScore: Number,        // healthy revision behavior
    pasteRiskScore: Number,       // paste event risk
    speedVarianceScore: Number,   // variance in typing speed
    insights: [String]
  },

  // Textual analysis
  textual: {
    sentenceLengthVariance: Number,
    vocabularyDiversityScore: Number,
    stylisticConsistencyScore: Number,
    readabilityScore: Number,
    perplexityScore: Number,
    insights: [String]
  },

  // Suspicious segments
  suspiciousSegments: [suspiciousSegmentSchema],

  // Summary for sharing
  shareToken: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  publicSummary: String,

  generatedAt: { type: Date, default: Date.now },
  algorithmVersion: { type: String, default: '1.0.0' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
