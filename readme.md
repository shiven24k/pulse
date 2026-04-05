# Video Streaming & Content Management Platform

## 📖 Project Overview
This project is a full-stack, multi-tenant video management platform developed as a comprehensive assignment. It demonstrates high-fidelity HLS video streaming, real-time WebSocket progress tracking, and an automated content moderation pipeline to classify and secure uploaded media.

## 🚀 Live Links
* **Frontend Application:** [Insert your Vercel URL here]
* **Backend API:** [Insert your Render URL here]

## 🛠️ Technology Stack
* **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide Icons
* **Backend:** Node.js, Express.js, Mongoose (MongoDB)
* **Real-time Communication:** Socket.io
* **Video Delivery:** HLS.js, HTTP Range Requests
* **Authentication & Security:** JSON Web Tokens (JWT), bcrypt

## ✨ Implemented Features
* **Role-Based Access Control (RBAC):**
  * `Viewer`: Read-only access to the globally secure video feed.
  * `Editor`: Capable of uploading new content and tracking real-time processing status.
  * `Admin`: Full system control, including user role management and global video deletion.
* **Content Moderation Pipeline:** Automated sensitivity analysis that evaluates videos upon upload before they are available in the public feed.
* **Real-Time System Feedback:** WebSockets push live processing progress updates to the client interface without requiring page reloads.
* **Optimized HLS Streaming:** Chunked video delivery utilizing range requests for seamless playback and reduced bandwidth consumption.

## 🚦 Local Setup Instructions

### 1. Repository Initialization
```bash
git clone [your-repo-url]
cd [repository-name]
```
2. Backend Configuration
Bash
cd backend
npm install
Create a .env file in the backend directory with the following variables:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
Start the server:

Bash
npm start
3. Frontend Configuration
Bash
cd frontend
npm install
Create a .env file in the frontend directory:

Code snippet
VITE_API_URL=http://localhost:5000
Start the development client:

Bash
npm run dev
🔐 API Architecture
Authentication Routes
POST /auth/register - Registers a new user (the first registered user defaults to Admin status).

POST /auth/login - Authenticates credentials and returns a JWT.

Video Management Routes
GET /videos - Retrieves the video feed (filtered securely based on the requesting user's RBAC role).

POST /videos - Uploads a new video to the processing pipeline (Restricted to Editor/Admin).

DELETE /videos/:id - Permanently deletes video records and associated HLS files (Restricted to Admin).

User Administration Routes
GET /admin/users - Retrieves a list of all registered users.

PATCH /admin/users/:id/role - Modifies a specific user's system access level.