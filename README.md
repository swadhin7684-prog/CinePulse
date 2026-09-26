# CinePulse — Next-Generation Cinematic Streaming Platform

A production-grade, full-stack video streaming web application designed with modern aesthetics, clean layered architecture, and scalable media streaming capabilities.

![Brand Accent](https://img.shields.io/badge/Accent-Electric%20Amber%20%23F59E0B-amber)
![Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20Node%20%7C%20Express%20%7C%20Firestore-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Highlights & Features

- **Distinct Original Branding**: Deep Obsidian (`#08090d`) and Electric Amber (`#F59E0B`) cinematic visual identity with rich glassmorphism.
- **Multi-Profile Household Management**: Create up to 5 profiles per account with custom avatar colors, language preferences, and Kids Mode maturity restrictions.
- **Custom Video Player**:
  - HTML5 streaming architecture with live timeline scrubber, buffer bar, and resume-from-timestamp notifications.
  - Periodic heartbeat synchronization reporting watch positions back to the database.
  - Playback speeds (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x), volume slider, and fullscreen mode.
  - Keyboard shortcuts (Space/K for play/pause, Left/Right for 10s skip, F for fullscreen, M for mute).
- **Intelligent Continue Watching**: Automatically surfaces in-progress titles on the home page and automatically marks them complete when watched past 92%.
- **Hybrid Recommendation Algorithm**:
  $$\text{Score} = (0.25 \times G) + (0.20 \times C) + (0.20 \times W) + (0.10 \times R) + (0.10 \times P) + (0.10 \times T) + (0.05 \times N)$$
  Dynamically balances watched genres, director/cast similarity, user ratings, popularity, trending momentum, and release recency.
- **Interactive Ratings & Reviews**: 5-star interactive rating widget with live recalculation of average community scores.
- **Universal Multi-Filter Search**: Instant debounced search querying across titles, genres, directors, and cast members.
- **Personal Watchlist ("My List")**: Optimistic bookmarking with instant toast feedback.
- **Admin Command Center**:
  - Live streaming analytics (total streams, registered users, views count).
  - Feature movies catalog manager (add/edit/delete, toggle Featured and Trending flags).
  - TV Shows & Episodes manager.
  - Household accounts & profiles monitor.
  - Genre taxonomy manager.
- **Production Hardening**: Firebase Authentication (Email/Password & Google Sign-In), Firebase Admin SDK ID token verification, Helmet security headers, rate limiting on authentication routes, CORS configuration, and centralized error handling.

---

## 🏗️ Architecture & Project Structure

```
/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, SkeletonLoader
│   │   │   ├── home/           # HeroBanner, MovieRow, MovieCard
│   │   │   ├── modal/          # ContentDetailModal (ratings, episodes, similar)
│   │   │   ├── player/         # CustomVideoPlayer with heartbeat sync
│   │   │   └── profile/        # ProfileSelectModal ("Who's watching?")
│   │   ├── pages/              # Home, Browse, Search, Watch, MyList, History, Profile, Settings, Login, Register
│   │   │   └── admin/          # AdminDashboard (Analytics, Movies, Shows, Users, Genres)
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── services/           # Axios instance with auth & profile interceptors
│   │   ├── App.jsx             # React Router v6 & ProtectedRoute guards
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind directives & design tokens
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js          # API proxy to http://localhost:5000
│
├── backend/
│   ├── src/
│   │   ├── config/             # firebase.js (Firebase Admin SDK Firestore singleton)
│   │   ├── controllers/        # auth, profile, movie, search, list, history, rating, recommendation, admin
│   │   ├── middleware/         # authMiddleware, adminMiddleware, validateMiddleware, errorHandler
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # firestoreDb, authService, movieService, historyService, listService, recommendationService
│   │   ├── utils/              # response.js, seedData.js, inspectDB.js
│   │   ├── app.js              # Express app
│   │   └── server.js           # Server bootstrap
│   ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **npm**: v9.0.0 or higher
- **Database**: Firebase Firestore via Firebase Admin SDK. Supports production Google Cloud Firestore credentials as well as zero-config local development mode.

### 2. Installation

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### 3. Environment Variables

Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=cinepulse_super_secret_jwt_key_2026_production_grade
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional for local (uses zero-config dev mode), required for production/Vercel:
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-firebase-project-id.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Running the Application

Start the backend API server:
```bash
cd backend
npm run dev
# Server listens on http://localhost:5000
```
*Note: On first startup, the database automatically seeds with genres, movies, shows, episodes, and demo accounts.*

Start the frontend Vite application:
```bash
cd frontend
npm run dev
# Frontend accessible at http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Preconfigured Profiles |
| :--- | :--- | :--- | :--- |
| **Standard User** | `user@cinepulse.io` | `Password123` | Alex, Sci-Fi Vault, Kids Corner |
| **Administrator** | `admin@cinepulse.io` | `Password123` | Admin HQ |

*(You can also register your own brand-new account on `/register`)*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/logout` — Invalidate session
- `GET  /api/auth/me` — Retrieve current account details (Protected)

### Household Profiles
- `GET    /api/profiles` — List account profiles
- `POST   /api/profiles` — Create new profile (max 5)
- `PUT    /api/profiles/:id` — Update profile settings
- `DELETE /api/profiles/:id` — Delete profile (must retain at least 1)

### Movies & TV Shows
- `GET /api/movies` — List movies with pagination, genre, year, sort
- `GET /api/movies/:id` — Retrieve movie details & stream URL
- `GET /api/movies/shows` — List TV shows
- `GET /api/movies/shows/:id` — TV show details with season episodes

### Search & Recommendations
- `GET /api/search?q=&genre=&year=&type=` — Full-text debounced catalog search
- `GET /api/recommendations` — Personalized hybrid recommendations for active profile
- `GET /api/recommendations/trending` — Top trending titles
- `GET /api/recommendations/popular` — Most viewed titles
- `GET /api/recommendations/similar/:id` — Content-similar titles

### Playback & Watch History
- `POST   /api/history` — Save playback timestamp heartbeat
- `GET    /api/history` — Chronological watch history
- `GET    /api/history/continue` — Partially watched titles for Home page
- `DELETE /api/history/:contentId` — Remove title from history

### My List & Ratings
- `GET    /api/my-list` — Profile's saved watchlist
- `POST   /api/my-list/:contentId` — Add title to list
- `DELETE /api/my-list/:contentId` — Remove title from list
- `POST   /api/ratings` — Submit 1-5 star rating and review
- `GET    /api/ratings/:contentId` — Get average rating & user score

### Admin Panel (Admin Protected)
- `GET    /api/admin/analytics` — Platform metrics & top viewed titles
- `GET    /api/admin/users` — List all registered users
- `POST   /api/admin/movies` — Add movie to catalog
- `PUT    /api/admin/movies/:id` — Edit movie
- `DELETE /api/admin/movies/:id` — Remove movie
- `POST   /api/admin/shows/:id/episodes` — Add episode to TV show
- `POST   /api/admin/genres` — Add genre
- `DELETE /api/admin/genres/:id` — Delete genre

---

## 🔒 Security Best Practices
- Passwords hashed with `bcryptjs` salt rounds before saving.
- Authentication tokens signed using HMAC SHA-256 JWTs with expiration.
- HTTP security headers powered by `helmet`.
- Rate limiting on `/api/auth` endpoints to thwart brute-force attempts.
- Role-based authorization middleware protecting administrative endpoints.
- Input validation sanitization and strict schema enforcement.
