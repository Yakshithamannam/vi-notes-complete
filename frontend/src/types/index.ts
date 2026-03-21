// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'educator' | 'admin';
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ─── Keystroke Events ─────────────────────────────────────────────────────────
export interface KeystrokeEvent {
  type: 'keydown' | 'keyup' | 'paste' | 'delete' | 'selection';
  timestamp: number;      // ms since session start
  duration?: number;
  isDelete?: boolean;
  isPaste?: boolean;
  pasteLength?: number;
  wordPosition?: number;
  sentencePosition?: number;
  paragraphPosition?: number;
}

export interface PauseEvent {
  startTimestamp: number;
  duration: number;
  position?: number;
  beforeParagraph?: boolean;
  beforeSentence?: boolean;
  beforeWord?: boolean;
}

export interface SpeedSample {
  timestamp: number;
  wpm: number;
  cpm: number;
  windowSizeMs: number;
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface SessionStats {
  totalKeystrokes: number;
  totalDeletes: number;
  totalPastes: number;
  totalPasteChars: number;
  avgWpm: number;
  avgCpm: number;
  wpmVariance: number;
  pauseCount: number;
  avgPauseDuration: number;
  longPauseCount: number;
  deleteRate: number;
  revisionRate: number;
  sentencePauseAvg: number;
  paragraphPauseAvg: number;
}

export interface Session {
  _id: string;
  title: string;
  status: 'active' | 'completed' | 'analyzed' | 'archived';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  finalWordCount: number;
  finalCharCount: number;
  stats?: SessionStats;
  analysisResult?: Report | string;
  createdAt: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────
export interface SuspiciousSegment {
  type: 'paste' | 'uniform_speed' | 'no_revisions' | 'missing_keystrokes' | 'statistical_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high';
  wordStart: number;
  wordEnd: number;
  evidence: string[];
}

export interface BehavioralAnalysis {
  typingConsistency: number;
  pausePatternScore: number;
  revisionScore: number;
  pasteRiskScore: number;
  speedVarianceScore: number;
  insights: string[];
}

export interface TextualAnalysis {
  sentenceLengthVariance: number;
  vocabularyDiversityScore: number;
  stylisticConsistencyScore: number;
  readabilityScore: number;
  perplexityScore: number;
  insights: string[];
}

export interface Report {
  _id: string;
  sessionId: Session | string;
  authenticityScore: number;
  verdict: 'likely_human' | 'uncertain' | 'likely_ai_assisted' | 'likely_ai';
  confidence: number;
  behavioralScore: number;
  textualScore: number;
  correlationScore: number;
  behavioral: BehavioralAnalysis;
  textual: TextualAnalysis;
  suspiciousSegments: SuspiciousSegment[];
  shareToken?: string;
  isPublic: boolean;
  publicSummary?: string;
  generatedAt: string;
}

// ─── Live Editor State ────────────────────────────────────────────────────────
export interface LiveFlag {
  type: 'paste_warning' | 'speed_warning' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface EditorState {
  sessionId: string | null;
  content: string;
  wordCount: number;
  isRecording: boolean;
  sessionStartTime: number | null;
  keystrokeBuffer: KeystrokeEvent[];
  pauseBuffer: PauseEvent[];
  speedSamples: SpeedSample[];
  liveFlags: LiveFlag[];
  lastKeyTime: number | null;
}
