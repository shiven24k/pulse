import express from "express";
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

export const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//To listen connectors for debugging
io.on("connection", (socket) => {
  console.log("Client connected with ID:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("Mongo connected"))
.catch(err => console.log(err));

server.listen(5000, () => {
  console.log("Server running on port 5000");
});