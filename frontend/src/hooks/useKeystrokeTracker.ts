import { useRef, useCallback, useEffect } from 'react';
import { KeystrokeEvent, PauseEvent, SpeedSample } from '../types';
import { sessionApi } from '../services/api';

const BATCH_INTERVAL_MS = 3000;   // send keystrokes every 3s
const PAUSE_THRESHOLD_MS = 800;   // gap > 800ms = a pause
const SPEED_WINDOW_MS = 10000;    // 10s rolling window for WPM

interface UseKeystrokeTrackerOptions {
  sessionId: string | null;
  onFlag?: (flag: { type: string; severity: string; message: string }) => void;
}

export const useKeystrokeTracker = ({ sessionId, onFlag }: UseKeystrokeTrackerOptions) => {
  const sessionStartRef = useRef<number | null>(null);
  const keystrokeBufferRef = useRef<KeystrokeEvent[]>([]);
  const pauseBufferRef = useRef<PauseEvent[]>([]);
  const speedSamplesRef = useRef<SpeedSample[]>([]);
  const lastKeyTimeRef = useRef<number | null>(null);
  const recentKeysRef = useRef<number[]>([]); // timestamps for WPM window
  const pauseStartRef = useRef<number | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getRelativeTime = () =>
    sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;

  // Compute word position from content
  const getWordPosition = (content: string, cursorPos: number) =>
    content.slice(0, cursorPos).split(/\s+/).length - 1;

  const getSentencePosition = (content: string, cursorPos: number) =>
    (content.slice(0, cursorPos).match(/[.!?]+/g) || []).length;

  const getParagraphPosition = (content: string, cursorPos: number) =>
    (content.slice(0, cursorPos).match(/\n\n/g) || []).length;

  // Compute WPM over rolling window
  const computeCurrentWpm = useCallback(() => {
    const now = Date.now();
    const windowStart = now - SPEED_WINDOW_MS;
    recentKeysRef.current = recentKeysRef.current.filter(t => t > windowStart);
    const keysInWindow = recentKeysRef.current.length;
    const wpm = Math.round((keysInWindow / 5) * (60000 / SPEED_WINDOW_MS));
    const cpm = Math.round(keysInWindow * (60000 / SPEED_WINDOW_MS));
    return { wpm, cpm };
  }, []);

  // Flush buffers to backend
  const flushBuffers = useCallback(async () => {
    if (!sessionId) return;

    if (keystrokeBufferRef.current.length > 0) {
      const batch = [...keystrokeBufferRef.current];
      keystrokeBufferRef.current = [];
      try {
        await sessionApi.appendKeystrokes(sessionId, batch);
      } catch (e) {
        // Re-queue on failure
        keystrokeBufferRef.current = [...batch, ...keystrokeBufferRef.current];
      }
    }

    if (pauseBufferRef.current.length > 0) {
      const batch = [...pauseBufferRef.current];
      pauseBufferRef.current = [];
      try {
        await sessionApi.appendPauses(sessionId, batch);
      } catch (e) {
        pauseBufferRef.current = [...batch, ...pauseBufferRef.current];
      }
    }
  }, [sessionId]);

  const startTracking = useCallback(() => {
    sessionStartRef.current = Date.now();
    keystrokeBufferRef.current = [];
    pauseBufferRef.current = [];
    speedSamplesRef.current = [];
    recentKeysRef.current = [];
    lastKeyTimeRef.current = null;

    flushIntervalRef.current = setInterval(flushBuffers, BATCH_INTERVAL_MS);
  }, [flushBuffers]);

  const stopTracking = useCallback(async () => {
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }
    // Close any open pause
    if (pauseStartRef.current !== null && lastKeyTimeRef.current !== null) {
      const duration = Date.now() - pauseStartRef.current;
      pauseBufferRef.current.push({
        startTimestamp: getRelativeTime() - duration,
        duration,
      });
      pauseStartRef.current = null;
    }
    await flushBuffers();
    return speedSamplesRef.current;
  }, [flushBuffers]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    content: string,
    cursorPos: number
  ) => {
    if (!sessionStartRef.current) return;

    const now = Date.now();
    const relTs = getRelativeTime();
    const isDelete = e.key === 'Backspace' || e.key === 'Delete';

    // Pause detection
    if (lastKeyTimeRef.current !== null) {
      const gap = now - lastKeyTimeRef.current;
      if (gap > PAUSE_THRESHOLD_MS) {
        if (pauseStartRef.current === null) pauseStartRef.current = lastKeyTimeRef.current;
        const beforeSentence = e.key === ' ' && content.slice(cursorPos - 2, cursorPos).match(/[.!?]\s?/) != null;
        const beforeParagraph = e.key === 'Enter';
        pauseBufferRef.current.push({
          startTimestamp: relTs - gap,
          duration: gap,
          position: cursorPos,
          beforeParagraph,
          beforeSentence,
          beforeWord: e.key === ' '
        });
        pauseStartRef.current = null;
      }
    }

    lastKeyTimeRef.current = now;
    recentKeysRef.current.push(now);

    const { wpm, cpm } = computeCurrentWpm();
    speedSamplesRef.current.push({ timestamp: relTs, wpm, cpm, windowSizeMs: SPEED_WINDOW_MS });

    keystrokeBufferRef.current.push({
      type: 'keydown',
      timestamp: relTs,
      isDelete,
      wordPosition: getWordPosition(content, cursorPos),
      sentencePosition: getSentencePosition(content, cursorPos),
      paragraphPosition: getParagraphPosition(content, cursorPos),
    });
  }, [computeCurrentWpm]);

  const handlePaste = useCallback((
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    cursorPos: number,
    content: string
  ) => {
    if (!sessionStartRef.current) return;

    const pastedText = e.clipboardData.getData('text');
    const pasteLength = pastedText.length;
    const relTs = getRelativeTime();

    keystrokeBufferRef.current.push({
      type: 'paste',
      timestamp: relTs,
      isPaste: true,
      pasteLength,
      wordPosition: getWordPosition(content, cursorPos),
    });

    if (pasteLength > 50 && onFlag) {
      onFlag({
        type: 'paste_warning',
        severity: pasteLength > 300 ? 'high' : 'medium',
        message: `Paste detected (${pasteLength} chars). This will be noted in your authenticity report.`
      });
    }
  }, [onFlag]);

  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, []);

  return { startTracking, stopTracking, handleKeyDown, handlePaste, speedSamplesRef };
};
