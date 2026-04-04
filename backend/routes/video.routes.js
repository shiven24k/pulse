import express from "express";
import multer from "multer";
import fs from "fs";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { startProcessing } from "../services/processing.service.js";



const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });
router.get("/", auth, async (req, res) => {

  const videos = await Video.find({
    userId: req.user.id
  });

  res.json(videos);
}); 
router.get("/:id/stream", auth, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user.id });
    if (!video) return res.status(404).json({ error: "Not found" });

    // Determine which quality to serve (default to 720p if available, else original)
    const requestedQuality = req.query.quality || "720p";
    const videoPath = video.qualities[requestedQuality] || video.path;

    const videoSize = fs.statSync(videoPath).size;
    const range = req.headers.range;

    // IMPLEMENT LAYER 1 CACHE STRATEGY (HTTP Headers)
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    res.setHeader("Accept-Ranges", "bytes");

    if (!range) {
      const headers = {
        "Content-Length": videoSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    const CHUNK_SIZE = 10 ** 6; // 1MB chunks
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    fs.createReadStream(videoPath, { start, end }).pipe(res);

  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, upload.single("video"), async (req, res) => {
    
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


export default router;