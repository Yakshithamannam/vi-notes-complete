const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/google — verify Google token and login/register
router.post('/google', async (req, res, next) => {
  try {
    const { googleToken } = req.body;
    if (!googleToken) return res.status(400).json({ error: 'Google token required.' });

    // Verify token with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    const googleData = await googleRes.json();

    if (!googleRes.ok || googleData.error) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const { email, name, sub: googleId } = googleData;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: `google_${googleId}_${Date.now()}`,
        isVerified: true,
        googleId
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      message: 'Logged in with Google',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
