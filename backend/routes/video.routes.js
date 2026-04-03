import express from "express";
import multer from "multer";
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