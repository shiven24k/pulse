import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Video from "../models/Video.js";
import auth, { authorize } from "../middleware/auth.js"; // Import authorize
import { startProcessing } from "../services/processing.service.js";
import { checkUploadLimit } from "../middleware/uploadLimit.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 1. VIEWING LOGIC )
router.get("/", auth, async (req, res) => {
  let query = {};
  
  if (req.user.role === "viewer") {
    //Viewers see ALL videos that are marked as "safe" globally
    query = { status: "safe" };
    
  } else if (req.user.role === "editor") {
    query = {
      $or: [
        { status: "safe" },
        { userId: req.user.id }
      ]
    };
  } 
  // Admin sees EVERYTHING (query remains {})
  try {
    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// 2. POST: Only Editor and Admin can upload content
router.post("/", auth, authorize('editor', 'admin'), checkUploadLimit, upload.single("video"), async (req, res) => {
  const video = await Video.create({
    title: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path.replace(/\\/g, "/"),
    size: req.file.size,
    userId: req.user.id,
    status: "uploading"
  });

  startProcessing(video._id);
  res.json(video);
});

// 3. DELETE: Full System Access required (Admin Only)
router.delete("/:id", auth, authorize('admin'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // File cleanup
    if (fs.existsSync(video.path)) fs.unlinkSync(video.path);
    const hlsFolder = path.join("uploads", video._id.toString());
    if (fs.existsSync(hlsFolder)) fs.rmSync(hlsFolder, { recursive: true, force: true });

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// routes/admin.routes.js
router.get("/users", auth, authorize('admin'), async (req, res) => {
  const users = await User.find({}, "-password");
  res.json(users);
});

router.patch("/users/:id/role", auth, authorize('admin'), async (req, res) => {
  const { role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ message: "User role updated." });
});

export default router;