import "./env.js"; // must be first — loads .env before any service module reads process.env
import express from 'express';
import path from 'path';
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";

const app = express();
const server = http.createServer(app);

// 1. GLOBAL MIDDLEWARE
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.CLIENT_URL || "http://localhost:5173";
    if (!origin || origin === allowed || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 2. STATIC FILES (CORS for HLS streaming)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 3. ROUTES
app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);

// 4. SOCKET.IO
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = process.env.CLIENT_URL || "http://localhost:5173";
      if (!origin || origin === allowed || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// 4b. GLOBAL ERROR HANDLER — catches anything that slips past route try/catch
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// 5. DATABASE & START
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Mongo connected"))
  .catch(err => console.log("❌ Mongo error:", err));

server.listen(process.env.PORT || 5000, () => {
  console.log(`⚡ Server running on port ${process.env.PORT || 5000}`);
});