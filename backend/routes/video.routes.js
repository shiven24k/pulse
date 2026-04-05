import express from "express";
import multer from "multer";
import fs from "fs";
import Video from "../models/Video.js";
import auth, { authorize } from "../middleware/auth.js";
import { startProcessing } from "../services/processing.service.js";
import { checkUploadLimit } from "../middleware/uploadLimit.js";
import { deleteVideoFromCloudinary } from "../services/cloudinary.service.js";

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

    // Cleanup local file + Cloudinary asset
    if (video.path && fs.existsSync(video.path)) fs.unlinkSync(video.path);
    if (video.cloudinaryId) await deleteVideoFromCloudinary(video.cloudinaryId);

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;