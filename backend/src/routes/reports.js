const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { analyzeSession } = require('../services/analysisService');
const { decryptContent } = require('../utils/encryption');

const router = express.Router();
router.use(protect);

// POST /api/reports/generate/:sessionId — analyze and generate report
router.post('/generate/:sessionId', async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
      status: { $in: ['completed', 'analyzed'] }
    });

    if (!session) {
      return res.status(404).json({ error: 'Completed session not found.' });
    }

    // Decrypt content for textual analysis
    let textContent = '';
    if (session.encryptedContent && session.contentIv) {
      try {
        textContent = decryptContent(session.encryptedContent, session.contentIv);
      } catch (e) {
        console.warn('Could not decrypt content for analysis:', e.message);
      }
    }

    const analysis = analyzeSession(session, textContent);

    // Save or update report
    const report = await Report.findOneAndUpdate(
      { sessionId: session._id },
      {
        userId: req.user._id,
        sessionId: session._id,
        ...analysis,
        generatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // Link report to session
    session.status = 'analyzed';
    session.analysisResult = report._id;
    await session.save();

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports — list user's reports
router.get('/', async (req, res, next) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ generatedAt: -1 })
      .limit(50)
      .populate('sessionId', 'title finalWordCount durationMs completedAt');

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('sessionId', 'title finalWordCount durationMs completedAt stats');

    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ report });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/:id/share — generate shareable link
router.post('/:id/share', async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!report.shareToken) {
      report.shareToken = uuidv4();
    }
    report.isPublic = true;
    report.publicSummary = `This document scored ${report.authenticityScore}/100 for human authorship authenticity. Verdict: ${report.verdict.replace(/_/g, ' ')}.`;
    await report.save();

    res.json({
      shareToken: report.shareToken,
      shareUrl: `/share/${report.shareToken}`,
      publicSummary: report.publicSummary
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/shared/:token — public report view (no auth required)
router.get('/shared/:token', async (req, res, next) => {
  try {
    const report = await Report.findOne({
      shareToken: req.params.token,
      isPublic: true
    }).select('authenticityScore verdict confidence behavioralScore textualScore correlationScore publicSummary generatedAt suspiciousSegments');

    if (!report) return res.status(404).json({ error: 'Shared report not found.' });
    res.json({ report });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
