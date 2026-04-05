# Pulse — AI-Moderated Video Streaming Platform

A full-stack video management and streaming platform with AI content moderation, HLS adaptive playback, real-time processing updates, and role-based access control.

---

## Live Deployment

- Frontend: https://pulse-topaz-pi.vercel.app
- Backend API: https://pulse-nkqh.onrender.com
- GitHub: https://github.com/shiven24k/pulse

---

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS v4
- Framer Motion
- HLS.js
- Socket.io-client
- Axios

**Backend**
- Node.js + Express.js (ESM)
- MongoDB + Mongoose
- Socket.io
- JWT + bcrypt
- Multer (file uploads)
- FFmpeg via @ffmpeg-installer (frame extraction)
- Cloudinary (video storage + HLS delivery)

## AI Content Moderation

Every uploaded video goes through a two-layer moderation pipeline before it's ever stored or streamed.

### Layer 1 — NSFW Detection (nsfwjs + TensorFlow.js)

Uses the `nsfwjs` model running locally via `@tensorflow/tfjs` (pure JS, no native addon required).

FFmpeg extracts 3 frames at **20%, 50%, and 80%** of the video duration. Each frame is:
1. Decoded with `jpeg-js` into raw pixel data
2. Converted to a `tf.tensor3d`
3. Classified by nsfwjs into 5 categories: `Drawing`, `Hentai`, `Neutral`, `Porn`, `Sexy`

Flag condition:
- Top prediction is `Porn` or `Hentai` **and** confidence > **80%**

Anything below that threshold passes through (avoids false positives on artistic content).

### Layer 2 — Violence & Harmful Content (Clarifai API)

Uses Clarifai's `moderation-recognition` model. Each frame is sent as base64 to:

```
POST https://api.clarifai.com/v2/models/moderation-recognition/outputs
```

Concepts checked and their thresholds:

| Concept  | Flag Threshold |
|----------|---------------|
| gore     | > 35%         |
| weapon   | > 35%         |
| drug     | > 50%         |
| explicit | > 85%         |

Gore and weapons use a stricter threshold (35%) since even partial detection is a strong signal. Explicit content is set higher (85%) to avoid false positives.

If Clarifai is unreachable or returns an error, the pipeline **fails safe** (returns `true` = safe) so a network blip doesn't block all uploads.

### Moderation Flow

```
Upload → Extract 3 frames → For each frame:
  ├── nsfwjs check (local, no API cost)
  └── Clarifai check (API call)
      ↓
  Any frame flagged? → status: "flagged", pipeline stops
  All frames safe?   → Upload to Cloudinary → HLS generation
```

Frames are deleted from local disk after analysis regardless of outcome.

### Required Environment Variables

```env
CLARIFAI_PAT=your_personal_access_token
CLARIFAI_USER_ID=clarifai
CLARIFAI_APP_ID=main
```

Get your PAT from: https://clarifai.com/settings/security



## Features

### Role-Based Access Control (RBAC)

| Role   | View Safe Videos | Upload | Delete | Manage Users |
|--------|-----------------|--------|--------|--------------|
| Viewer | ✅              | ❌     | ❌     | ❌           |
| Editor | ✅ + own uploads | ✅    | ❌     | ❌           |
| Admin  | ✅ all          | ✅     | ✅     | ✅           |

### Video Processing Pipeline

1. Video uploaded via Multer to temp local storage
2. FFmpeg extracts frames at 20%, 50%, 80% timestamps
3. nsfwjs classifies each frame (flags Porn/Hentai > 80% confidence)
4. Clarifai checks for gore (>35%), weapons (>35%), drugs (>50%), explicit (>85%)
5. If any frame flagged → status `flagged`, pipeline stops, local files cleaned up
6. If all frames safe → video uploaded to Cloudinary
7. Cloudinary generates HLS streams (480p / 720p / 1080p)
8. Cloudinary URLs stored in MongoDB, status set to `safe`
9. Real-time progress pushed via Socket.io at each phase

### Upload Rate Limiting
- Max 3 uploads per user per hour
- Returns 429 with a clear error message

### Real-time Updates
- Socket.io pushes `video-progress` events during processing
- No polling — instant status updates in the UI

---

## API Reference

### Auth

| Method | Endpoint        | Access | Description          |
|--------|----------------|--------|----------------------|
| POST   | /auth/register  | Public | Register new user    |
| POST   | /auth/login     | Public | Login, returns JWT   |
| GET    | /auth/users     | Admin  | List all users       |
| PATCH  | /auth/users/:id/role | Admin | Update user role |

### Videos

| Method | Endpoint      | Access        | Description                  |
|--------|--------------|---------------|------------------------------|
| GET    | /videos       | All roles     | Fetch videos (filtered by role) |
| POST   | /videos       | Editor, Admin | Upload + trigger processing  |
| DELETE | /videos/:id   | Admin         | Delete video + Cloudinary asset |

All protected routes require: `Authorization: Bearer <token>`

---

## Local Development

### Prerequisites
- Node.js v18+
- pnpm
- MongoDB Atlas account
- Cloudinary account
- Clarifai account

### Backend

```bash
cd backend
pnpm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLARIFAI_PAT=your_clarifai_pat
CLARIFAI_USER_ID=clarifai
CLARIFAI_APP_ID=main
```

```bash
pnpm dev
```

### Frontend

```bash
cd frontend
pnpm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
pnpm dev
```

---

## Project Structure

```
pulse/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT auth + authorize() RBAC helper
│   │   └── uploadLimit.js   # 3 uploads/hour rate limiter
│   ├── models/
│   │   ├── User.js          # email, password, role
│   │   └── Video.js         # title, cloudinaryId, qualities, status, progress
│   ├── routes/
│   │   ├── auth.routes.js   # register, login, user management
│   │   └── video.routes.js  # upload, fetch, delete
│   ├── services/
│   │   ├── cloudinary.service.js  # upload, delete, HLS URL generation
│   │   └── processing.service.js # NSFW + violence check → Cloudinary pipeline
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.jsx      # User role management UI
│   │   │   ├── HlsVideoPlayer.jsx  # HLS.js player
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT storage + axios default headers
│   │   └── pages/
│   │       ├── Login.jsx
│   │       └── Dashboard.jsx       # Upload, feed, player, real-time progress
│   └── vercel.json                 # SPA rewrite rule
│
└── readme.md
```

---

## Deployment

### Backend (Render)
- Root Directory: `backend`
- Build Command: `pnpm install`
- Start Command: `pnpm start`
- Add all env vars from `backend/.env` in Render dashboard

### Frontend (Vercel)
- Root Directory: `frontend`
- Framework: Vite
- Add `VITE_API_URL=https://your-render-url.onrender.com` in Vercel env vars

---

## Author

Shiven Kashyap — https://github.com/shiven24k
