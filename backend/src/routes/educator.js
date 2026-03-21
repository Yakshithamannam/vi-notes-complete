const express = require('express');
const Session = require('../models/Session');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.use(requireRole('educator', 'admin'));

// GET /api/educator/sessions — all student sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    const filter = { status: { $in: ['completed', 'analyzed'] } };

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email role')
      .populate('analysisResult', 'authenticityScore verdict confidence')
      .select('-keystrokes -pauses -speedSamples -encryptedContent -contentIv');

    const total = await Session.countDocuments(filter);
    res.json({ sessions, total });
  } catch (error) {
    next(error);
  }
});

// GET /api/educator/stats
router.get('/stats', async (req, res, next) => {
  try {
    const total = await Session.countDocuments({ status: { $in: ['completed', 'analyzed'] } });
    const analyzed = await Session.countDocuments({ status: 'analyzed' });
    res.json({ total, analyzed });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
