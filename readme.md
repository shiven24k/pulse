# 🎬 Pulse — Video Streaming & Content Management Platform

A full-stack, multi-tenant **video management and streaming platform** featuring **HLS playback**, **real-time processing updates**, and **automated content moderation**.
Built as a production-style assignment demonstrating scalable architecture, RBAC security, and optimized video delivery.

---

# 🌐 Live Deployment

### Frontend

https://pulse-topaz-pi.vercel.app/

### Backend API

https://pulse-nkqh.onrender.com

### GitHub Repository

https://github.com/shiven24k/pulse.git

---

# 📖 Project Overview

Pulse is designed as a **secure multi-role video platform** where users can upload videos, process them into HLS streams, and deliver optimized playback with role-based access.

Key capabilities:

* Multi-tenant architecture
* HLS adaptive streaming
* Real-time processing updates
* Automated content moderation
* Role-based access control
* Secure upload pipeline
* Production-style backend structure

---

# 🛠 Tech Stack

## Frontend

* React (Vite)
* Tailwind CSS
* Framer Motion
* Lucide Icons
* HLS.js

## Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Socket.io
* FFmpeg (video processing)

## Authentication & Security

* JWT Authentication
* bcrypt password hashing
* Role-based access control (RBAC)

## Video Delivery

* HLS Streaming
* HTTP Range Requests
* Chunked playback

---

# ✨ Features

## 🔐 Role Based Access Control (RBAC)

### Viewer

* Read-only video feed
* Watch processed videos
* No upload access

### Editor

* Upload videos
* Track processing status
* View content pipeline

### Admin

* Full platform control
* Manage user roles
* Delete videos globally
* System administration

---

# 🎥 Video Processing Pipeline

When a video is uploaded:

1. Video uploaded via Multer
2. Stored temporarily
3. FFmpeg converts to HLS format
4. Moderation pipeline runs
5. Progress updates via WebSocket
6. Video becomes available in feed
7. Streamed using HLS.js

---

# ⚡ Real-time Progress Tracking

Socket.io provides:

* Upload progress
* Processing progress
* Conversion status
* Moderation results
* Ready-to-stream notification

No polling required.

---

# 📡 Streaming Architecture

* HLS (.m3u8 playlist)
* Segment-based delivery (.ts chunks)
* HTTP range requests
* Adaptive playback
* Low bandwidth consumption
* Fast seeking support

---

# 🔐 API Architecture

## Authentication Routes

### Register

POST /auth/register

Creates a new user
First user becomes **Admin**

---

### Login

POST /auth/login

Returns JWT token

---

## Video Routes

### Get Videos

GET /videos

Returns video feed based on role

---

### Upload Video

POST /videos

Restricted to:

* Editor
* Admin

Triggers processing pipeline

---

### Delete Video

DELETE /videos/:id

Restricted to:

* Admin

Deletes:

* DB record
* HLS files
* original video

---

## Admin Routes

### Get Users

GET /admin/users

Admin only

---

### Update User Role

PATCH /admin/users/:id/role

Admin only

---

# 🚀 Local Development Setup

## 1. Clone Repository

```bash
git clone https://github.com/shiven24k/pulse.git
cd pulse
```

---

# Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
```

Start server

```bash
npm start
```

---

# Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```
VITE_API_URL=http://localhost:5000
```

Start frontend

```bash
npm run dev
```

---

# 🧠 System Design Highlights

* Multi-role authorization middleware
* WebSocket progress architecture
* HLS file serving via Express static
* Modular controller architecture
* Upload → Process → Stream pipeline
* Secure admin-only endpoints
* Stateless JWT auth

---

# 📁 Project Structure

```
pulse
│
├── frontend
│   ├── components
│   ├── pages
│   ├── hooks
│   └── utils
│
├── backend
│   ├── routes
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── services
│   └── socket
│
└── README.md
```

---

# 🔒 Security Features

* JWT authentication
* Role-based middleware
* Secure upload validation
* Protected admin routes
* Password hashing (bcrypt)
* File access restrictions

---

# 📈 Performance Optimizations

* HLS segmented streaming
* Range-based video loading
* FFmpeg compression
* Chunked delivery
* Lazy player loading
* WebSocket instead of polling

---

# 🎯 Assignment Requirements Covered

✅ Multi-tenant architecture
✅ RBAC system
✅ Real-time updates
✅ HLS streaming
✅ Video upload pipeline
✅ Content moderation pipeline
✅ Secure API
✅ Full stack deployment
✅ Production structure

---

# 👨‍💻 Author

Shiven Kashyap

GitHub
https://github.com/shiven24k

---
