const express = require('express');
const { protect } = require('../middleware/auth');
const { analyzeTextual } = require('../services/analysisService');

const router = express.Router();
router.use(protect);

// POST /api/analysis/text — analyze text snippet in real-time (NEW FEATURE)
router.post('/text', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 20) {
      return res.status(400).json({ error: 'Text must be at least 20 characters.' });
    }

    const result = analyzeTextual(text);
    res.json({ analysis: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/analysis/live-flags — return real-time flags for editor (NEW FEATURE)
router.post('/live-flags', async (req, res, next) => {
  try {
    const { recentKeystrokes, pastedText, timeSinceLastKey } = req.body;
    const flags = [];

    if (pastedText && pastedText.length > 100) {
      flags.push({
        type: 'paste_warning',
        severity: pastedText.length > 500 ? 'high' : 'medium',
        message: `Large paste detected (${pastedText.length} chars). This will be flagged in your authenticity report.`
      });
    }

    if (timeSinceLastKey && timeSinceLastKey < 100 && recentKeystrokes > 50) {
      flags.push({
        type: 'speed_warning',
        severity: 'medium',
        message: 'Typing speed unusually fast — verify this is natural writing.'
      });
    }

    res.json({ flags });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
