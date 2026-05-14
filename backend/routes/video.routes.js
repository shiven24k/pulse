import express from "express";
import multer from "multer";
import fs from "fs";
import Video from "../models/Video.js";
import auth, { authorize } from "../middleware/auth.js";
import { startProcessing } from "../services/processing.service.js";
import { checkUploadLimit } from "../middleware/uploadLimit.js";
import { deleteVideoFromCloudinary } from "../services/cloudinary.service.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB hard cap
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are accepted"));
    }
    cb(null, true);
  },
});

// 1. LIST — role-filtered
router.get("/", auth, async (req, res) => {
  let query = {};
  if (req.user.role === "viewer") {
    query = { status: "safe" };
  } else if (req.user.role === "editor") {
    query = { $or: [{ status: "safe" }, { userId: req.user.id }] };
  }
  // admin sees everything
  try {
    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// 2. UPLOAD — editor / admin only
router.post(
  "/",
  auth,
  authorize("editor", "admin"),
  checkUploadLimit,
  (req, res, next) => {
    // Run multer and surface its errors (file size, type) as clean JSON
    upload.single("video")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Maximum size is 500 MB." });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file received" });

      const video = await Video.create({
        title: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path.replace(/\\/g, "/"),
        size: req.file.size,
        userId: req.user.id,
        status: "uploading",
      });

      startProcessing(video._id);
      res.json(video);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: err.message });
    }
  }
);

// 3. DELETE — admin only
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (video.path && fs.existsSync(video.path)) fs.unlinkSync(video.path);
    if (video.cloudinaryId) await deleteVideoFromCloudinary(video.cloudinaryId);

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
