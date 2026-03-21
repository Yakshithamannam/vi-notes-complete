# Vi-Notes — Full Stack Implementation

Authenticity verification platform that ensures genuine human writing through behavioral biometrics and statistical signature analysis.

## Project Structure

```
vi-notes/
├── backend/          # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── models/
│   │   │   ├── User.js           # User auth model
│   │   │   ├── Session.js        # Writing session + keystroke metadata
│   │   │   └── Report.js         # Authenticity report
│   │   ├── routes/
│   │   │   ├── auth.js           # Register, login, me
│   │   │   ├── sessions.js       # Session CRUD + keystroke ingestion
│   │   │   ├── reports.js        # Report generation + sharing
│   │   │   └── analysis.js       # Live text analysis (NEW)
│   │   ├── services/
│   │   │   ├── analysisService.js # Core detection engine
│   │   │   └── statsService.js    # Aggregate stats computation
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT middleware
│   │   └── utils/
│   │       └── encryption.js     # AES-256 content encryption
│   └── .env.example
│
└── frontend/         # React + TypeScript + Vite
    └── src/
        ├── App.tsx               # Routing
        ├── types/index.ts        # All TypeScript types
        ├── services/api.ts       # Axios API layer
        ├── hooks/
        │   ├── useAuth.tsx       # Auth context + hook
        │   └── useKeystrokeTracker.ts  # Behavioral capture hook
        └── components/
            ├── Auth/             # Login + Register
            ├── Dashboard/        # Session list
            ├── Editor/           # Writing interface
            └── Report/           # Authenticity report + timeline
```

## Features Implemented

### Existing Features
- **Basic Writing Editor** — Distraction-free textarea with live word/sentence/paragraph counts
- **User Login and Registration** — JWT-based auth with bcrypt, role support (user/educator)
- **Capture Keystroke Timing** — Timing metadata batched and sent to backend every 3s
- **Detect Pasted Text** — Paste events captured with character count, live warning shown
- **Save Writing Session Data** — Sessions stored in MongoDB with encrypted content (AES-256)

### New Features Added
- **Authenticity Report Generation** — Full behavioral + textual + correlation analysis producing a scored report with verdict, confidence, suspicious segments, and shareable link
- **Session Replay / Timeline Visualizer** — SVG chart showing word growth over time with pause and paste events marked on the timeline

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/sessions` | Start new session |
| GET | `/api/sessions` | List user sessions |
| POST | `/api/sessions/:id/keystrokes` | Append keystroke batch |
| POST | `/api/sessions/:id/pauses` | Append pause events |
| POST | `/api/sessions/:id/complete` | Finalize session |
| POST | `/api/reports/generate/:sessionId` | Generate authenticity report |
| GET | `/api/reports/:id` | Get report |
| POST | `/api/reports/:id/share` | Create shareable link |
| GET | `/api/reports/shared/:token` | Public report (no auth) |
| POST | `/api/analysis/text` | Analyze text snippet |
| POST | `/api/analysis/live-flags` | Get live editor flags |

## Privacy Design

- Raw keystroke content (which keys were pressed) is **never stored**
- Only timing, frequency, and structural metadata is captured
- Final document content is encrypted at rest (AES-256-CBC)
- Users can delete sessions at any time
- Monitoring is strictly limited to active writing sessions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Backend**: Node.js, Express.js, MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Security**: Helmet, CORS, rate limiting, AES-256 encryption
- **Analysis**: Custom behavioral scoring engine (extensible for TensorFlow/PyTorch)

## Next Steps

- Integrate TensorFlow.js for on-device ML scoring
- Add Electron wrapper for native keyboard event access
- Add educator dashboard for reviewing student submissions
- Implement WebSocket for real-time session monitoring
- Train supervised model on labeled human vs AI writing datasets
