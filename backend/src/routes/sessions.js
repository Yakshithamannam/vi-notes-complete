const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { computeSessionStats } = require('../services/statsService');
const { encryptContent, decryptContent } = require('../utils/encryption');

const router = express.Router();
router.use(protect);

// POST /api/sessions — create new session
router.post('/', [
  body('title').optional().trim().isLength({ max: 200 })
], async (req, res, next) => {
  try {
    const { title, metadata } = req.body;
    const session = await Session.create({
      userId: req.user._id,
      title: title || 'Untitled Document',
      metadata: {
        userAgent: req.headers['user-agent'],
        platform: metadata?.platform || 'web',
        editorVersion: metadata?.editorVersion || '1.0.0'
      }
    });
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions — list user's sessions
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const sessions = await Session.find(filter)
      .select('-keystrokes -pauses -speedSamples -encryptedContent -contentIv')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('analysisResult', 'authenticityScore verdict confidence');

    const total = await Session.countDocuments(filter);

    res.json({ sessions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('analysisResult');
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/keystrokes — append keystroke batch
router.post('/:id/keystrokes', [
  body('events').isArray({ min: 1 }),
], async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active.' });
    }

    const { events } = req.body;

    // Only store safe metadata, never key content
    const safeEvents = events.map(e => ({
      type: e.type,
      timestamp: e.timestamp,
      duration: e.duration,
      isDelete: e.isDelete,
      isPaste: e.isPaste,
      pasteLength: e.pasteLength,
      wordPosition: e.wordPosition,
      sentencePosition: e.sentencePosition,
      paragraphPosition: e.paragraphPosition
    }));

    session.keystrokes.push(...safeEvents);
    await session.save();

    res.json({ message: 'Keystrokes recorded', count: safeEvents.length });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/pauses — append pause events
router.post('/:id/pauses', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const { pauses } = req.body;
    session.pauses.push(...pauses);
    await session.save();

    res.json({ message: 'Pauses recorded', count: pauses.length });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/snapshot — record text snapshot metadata
router.post('/:id/snapshot', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const { timestamp, charCount, wordCount, paragraphCount, checksum } = req.body;
    session.textSnapshots.push({ timestamp, charCount, wordCount, paragraphCount, checksum });
    await session.save();

    res.json({ message: 'Snapshot recorded' });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/complete — finalize session
router.post('/:id/complete', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const { content, wordCount, charCount, paragraphCount } = req.body;

    session.status = 'completed';
    session.completedAt = new Date();
    session.durationMs = session.completedAt - session.startedAt;
    session.finalWordCount = wordCount || 0;
    session.finalCharCount = charCount || 0;
    session.finalParagraphCount = paragraphCount || 0;

    // Encrypt the content
    if (content) {
      const { encrypted, iv } = encryptContent(content);
      session.encryptedContent = encrypted;
      session.contentIv = iv;
    }

    // Compute aggregate stats
    session.stats = computeSessionStats(session);

    await session.save();
    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json({ message: 'Session deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
