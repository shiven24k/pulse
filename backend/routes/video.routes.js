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
    const video = await Video.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found or unauthorized" });
    }

    const videoPath = video.path;
    const videoSize = fs.statSync(videoPath).size;

    const range = req.headers.range;
    
    // NEW: Handle the browser's initial "probe" request gracefully
    if (!range) {
      const headers = {
        "Content-Length": videoSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
      return; // Stop execution here
    }

    // Existing chunking logic
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);

  } catch (error) {
    console.error("Streaming error:", error);
    res.status(500).json({ error: "Error streaming video" });
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