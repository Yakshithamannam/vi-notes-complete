require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const reportRoutes = require('./routes/reports');
const analysisRoutes = require('./routes/analysis');
const educatorRoutes = require('./routes/educator');
const passwordResetRoutes = require('./routes/passwordReset');
const openaiRoutes = require('./routes/openai');
const oauthRoutes = require('./routes/oauth');
const { initWebSocket } = require('./services/websocketService');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/openai', openaiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.2.0' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Vi-Notes server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    initWebSocket(server);
  });
});

module.exports = app;
