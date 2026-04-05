import express from 'express';
import path from 'path';
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// 2. STATIC FILES (CORS for HLS streaming)
app.use("/uploads", cors(), express.static(path.join(process.cwd(), "uploads")));

// 3. ROUTES
app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);

// 4. SOCKET.IO
export const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// 5. DATABASE & START
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Mongo connected"))
  .catch(err => console.log("❌ Mongo error:", err));

server.listen(5000, () => {
  console.log("⚡ Server running on port 5000");
});