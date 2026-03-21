const mongoose = require('mongoose');

// Keystroke event - only timing metadata, never raw key content
const keystrokeEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['keydown', 'keyup', 'paste', 'delete', 'selection'],
    required: true
  },
  timestamp: { type: Number, required: true }, // ms since session start
  duration: Number,                             // keydown-to-keyup ms
  isDelete: Boolean,                            // backspace/delete
  isPaste: Boolean,
  pasteLength: Number,                          // chars pasted (not content)
  wordPosition: Number,                         // word index in document
  sentencePosition: Number,                     // sentence index
  paragraphPosition: Number                     // paragraph index
}, { _id: false });

// Pause event between keystrokes
const pauseEventSchema = new mongoose.Schema({
  startTimestamp: { type: Number, required: true },
  duration: { type: Number, required: true },   // ms
  position: Number,                             // char position in doc
  beforeParagraph: Boolean,
  beforeSentence: Boolean,
  beforeWord: Boolean
}, { _id: false });

// Typing speed sample (chars per minute at a point in time)
const speedSampleSchema = new mongoose.Schema({
  timestamp: Number,
  wpm: Number,
  cpm: Number,
  windowSizeMs: Number
}, { _id: false });

// Snapshot of text at a point in time (for replay)
const textSnapshotSchema = new mongoose.Schema({
  timestamp: Number,  // ms since session start
  charCount: Number,
  wordCount: Number,
  paragraphCount: Number,
  checksum: String    // hash of content, not the content itself
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Untitled Document',
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'analyzed', 'archived'],
    default: 'active'
  },

  // Timing
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  durationMs: Number,
  activeWritingMs: Number,  // excluding long pauses

  // Content metadata (not the text itself for privacy)
  finalWordCount: { type: Number, default: 0 },
  finalCharCount: { type: Number, default: 0 },
  finalParagraphCount: { type: Number, default: 0 },

  // Behavioral data
  keystrokes: [keystrokeEventSchema],
  pauses: [pauseEventSchema],
  speedSamples: [speedSampleSchema],
  textSnapshots: [textSnapshotSchema],

  // Aggregate behavioral stats (computed on session end)
  stats: {
    totalKeystrokes: { type: Number, default: 0 },
    totalDeletes: { type: Number, default: 0 },
    totalPastes: { type: Number, default: 0 },
    totalPasteChars: { type: Number, default: 0 },
    avgWpm: Number,
    avgCpm: Number,
    wpmVariance: Number,
    pauseCount: Number,
    avgPauseDuration: Number,
    longPauseCount: Number,       // pauses > 2s
    deleteRate: Number,           // deletes / total keystrokes
    revisionRate: Number,         // edits after initial typing
    sentencePauseAvg: Number,     // avg pause before sentences
    paragraphPauseAvg: Number,    // avg pause before paragraphs
  },

  // Analysis result (populated after analysis)
  analysisResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },

  // The final text is stored encrypted
  encryptedContent: String,
  contentIv: String,            // initialization vector for AES

  metadata: {
    userAgent: String,
    platform: String,           // 'web' | 'electron'
    editorVersion: String
  }
}, {
  timestamps: true
});

// Index for efficient user session queries
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
