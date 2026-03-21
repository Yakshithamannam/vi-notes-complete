import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi, reportApi } from '../../services/api';
import { useKeystrokeTracker } from '../../hooks/useKeystrokeTracker';
import { addNotification } from '../Notifications/NotificationBell';
import { LiveFlag } from '../../types';
import styles from './Editor.module.css';

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const countSentences = (text: string) => (text.match(/[.!?]+/g) || []).length;
const countParagraphs = (text: string) => text.split(/\n\n+/).filter(p => p.trim()).length;

interface EditorProps {
  initialTitle?: string;
}

const Editor: React.FC<EditorProps> = ({ initialTitle = '' }) => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveFlags, setLiveFlags] = useState<LiveFlag[]>([]);
  const [showFlagPanel, setShowFlagPanel] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [sessionStarted, setSessionStarted] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wpmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onFlag = useCallback((flag: LiveFlag) => {
    setLiveFlags(prev => [flag, ...prev.slice(0, 9)]);
    setShowFlagPanel(true);
    setTimeout(() => setShowFlagPanel(false), 5000);

    // Add to notification bell
    addNotification({
      type: flag.type === 'paste_warning' ? 'paste_detected' : 'info',
      title: flag.type === 'paste_warning' ? 'Paste detected' : 'Writing alert',
      message: flag.message,
    });
  }, []);

  const { startTracking, stopTracking, handleKeyDown, handlePaste, speedSamplesRef } =
    useKeystrokeTracker({ sessionId, onFlag });

  const startSession = useCallback(async () => {
    try {
      const res = await sessionApi.create({ title: title || 'Untitled Document' });
      const id = res.data.session._id;
      setSessionId(id);
      setIsRecording(true);
      setSessionStarted(new Date());
      startTracking();

      elapsedIntervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      wpmIntervalRef.current = setInterval(() => {
        const samples = speedSamplesRef.current;
        if (samples.length > 0) {
          setWpm(samples[samples.length - 1].wpm);
        }
      }, 2000);

      snapshotIntervalRef.current = setInterval(async () => {
        if (id && content) {
          await sessionApi.snapshot(id, {
            timestamp: Date.now(),
            charCount: content.length,
            wordCount: countWords(content),
            paragraphCount: countParagraphs(content),
          });
        }
      }, 30000);

      textareaRef.current?.focus();
    } catch (err) {
      console.error('Failed to start session', err);
      alert('Failed to start session. Please try again.');
    }
  }, [title, startTracking, content, speedSamplesRef]);

  const completeSession = useCallback(async () => {
    if (!sessionId || !content.trim()) return;
    setIsSubmitting(true);

    try {
      await stopTracking();

      [wpmIntervalRef, elapsedIntervalRef, snapshotIntervalRef].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });

      await sessionApi.complete(sessionId, {
        content,
        wordCount: countWords(content),
        charCount: content.length,
        paragraphCount: countParagraphs(content),
      });

      // Add session complete notification
      addNotification({
        type: 'session_complete',
        title: 'Session complete',
        message: `Your session "${title || 'Untitled'}" has been analyzed successfully.`,
        link: '/dashboard',
      });

      const reportRes = await reportApi.generate(sessionId);
      const reportId = reportRes.data.report._id;

      // Add report ready notification
      addNotification({
        type: 'report_ready',
        title: 'Report ready',
        message: `Authenticity report for "${title || 'Untitled'}" is ready to view.`,
        link: `/reports/${reportId}`,
      });

      navigate(`/reports/${reportId}`);
    } catch (err) {
      console.error('Failed to complete session', err);
      setIsSubmitting(false);
    }
  }, [sessionId, content, stopTracking, navigate, title]);

  const handleKeyDownWrapper = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    handleKeyDown(e, content, cursorPos);
  }, [handleKeyDown, content]);

  const handlePasteWrapper = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    handlePaste(e, cursorPos, content);
  }, [handlePaste, content]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const wordCount = countWords(content);
  const sentenceCount = countSentences(content);

  useEffect(() => {
    return () => {
      [wpmIntervalRef, elapsedIntervalRef, snapshotIntervalRef].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });
    };
  }, []);

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <input
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled Document"
            disabled={isRecording}
          />
        </div>

        <div className={styles.headerRight}>
          {isRecording && (
            <div className={styles.statusBar}>
              <span className={styles.recordingDot} />
              <span className={styles.statItem}>{formatElapsed(elapsed)}</span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.statItem}>{wordCount} words</span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.statItem}>{wpm} WPM</span>
              {liveFlags.length > 0 && (
                <>
                  <span className={styles.statDivider}>·</span>
                  <button
                    className={styles.flagBtn}
                    onClick={() => setShowFlagPanel(v => !v)}
                  >
                    ⚑ {liveFlags.length} flag{liveFlags.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>
          )}

          {!isRecording ? (
            <button className={styles.startBtn} onClick={startSession}>
              Start Session
            </button>
          ) : (
            <button
              className={styles.completeBtn}
              onClick={completeSession}
              disabled={isSubmitting || wordCount < 10}
            >
              {isSubmitting ? 'Analyzing…' : 'Complete & Analyze'}
            </button>
          )}
        </div>
      </div>

      {showFlagPanel && liveFlags.length > 0 && (
        <div className={styles.flagPanel}>
          <div className={styles.flagPanelHeader}>
            <span>Live Flags</span>
            <button onClick={() => setShowFlagPanel(false)}>✕</button>
          </div>
          {liveFlags.slice(0, 3).map((flag, i) => (
            <div key={i} className={`${styles.flagItem} ${styles[`flag_${flag.severity}`]}`}>
              <span className={styles.flagSeverity}>{flag.severity.toUpperCase()}</span>
              <span className={styles.flagMessage}>{flag.message}</span>
            </div>
          ))}
        </div>
      )}

      {!isRecording && (
        <div className={styles.preSession}>
          <div className={styles.preSessionCard}>
            <div className={styles.preSessionIcon}>✎</div>
            <h2>Ready to write?</h2>
            <p>
              Vi-Notes will silently monitor your writing process — keystroke timing,
              pauses, edits, and rhythm — to generate an authenticity report when you're done.
            </p>
            <ul className={styles.monitorList}>
              <li>✓ Keystroke timing metadata (not key content)</li>
              <li>✓ Pause patterns and revision behavior</li>
              <li>✓ Paste detection</li>
              <li>✓ Writing speed variance</li>
            </ul>
            <p className={styles.privacyNote}>
              Your keystrokes are never recorded — only timing and behavioral metadata.
            </p>
            <button className={styles.startBtnLarge} onClick={startSession}>
              Begin Writing Session
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className={styles.writingArea}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDownWrapper}
            onPaste={handlePasteWrapper}
            placeholder="Start writing…"
            spellCheck
            autoFocus
          />
          <div className={styles.docStats}>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{sentenceCount} sentences</span>
            <span>·</span>
            <span>{countParagraphs(content) || 1} paragraphs</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
