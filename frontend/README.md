# Pulse: Autonomous Video Moderation & HLS Streaming Engine

It is a cloud-integrated video infrastructure platform designed to solve the challenges of modern content hosting. By combining local machine learning (TensorFlow.js) with Enterprise Cloud Vision (Clarifai), the application ensures that every video uploaded is safe for consumption before a single pixel is streamed.

Once cleared by the AI, the engine utilizes FFmpeg to transcode the raw media into Adaptive HLS (HTTP Live Streaming) segments, allowing users to watch content at multiple quality levels (1080p, 720p, 480p) without buffering.

---

## 🚀 Core Features

### 🛡️ Dual-Layer AI Moderation
* **Local Analysis (NSFWJS)**: Uses a local TensorFlow.js model (MobileNetV2) to scan frames for explicit content (Porn/Hentai) with an **85% confidence threshold** to minimize false positives.
* **Cloud Analysis (Clarifai)**: Connects to the Clarifai Moderation API to detect **Weapons, Gore, and Drugs**. 
* **Temporal Sampling**: Instead of scanning every second, the system extracts frames at **20%, 50%, and 80%** of the video duration to balance security with processing speed.

### 📡 Adaptive HLS Streaming
* **Multi-Quality Transcoding**: Automatically generates three resolution streams: **1080p (High)**, **720p (Mid)**, and **480p (Low)**.
* **HLS Segmentation**: Uses FFmpeg to chop videos into 4-second `.ts` chunks, enabling "Instant Start" and adaptive bitrate switching.
* **Socket.io Integration**: Real-time progress tracking (Analyzing -> Processing -> Ready) updated live on the user dashboard.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Hls.js, Socket.io-client, Axios |
| **Backend** | Node.js, Express, MongoDB (Mongoose), FFmpeg |
| **AI / ML** | TensorFlow.js, NSFWJS, Clarifai API |
| **DevOps** | CORS-enabled static serving, Multer, Dotenv |

---

## ⚙️ Installation & Setup

### 1. System Requirements
* **FFmpeg**: Must be installed on the host machine to handle transcoding.
* **Node.js**: v18 or higher.
* **MongoDB**: A running instance (Local or Atlas).

### 2. Environment Variables
Create a `.env` file in the `/backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_auth_secret

# Clarifai API Credentials
CLARIFAI_PAT=your_personal_access_token
CLARIFAI_USER_ID=your_user_id
CLARIFAI_APP_ID=your_app_id