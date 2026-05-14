import Video from "../models/Video.js";
import { io } from "../server.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import fs from "fs";
import path from "path";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import jpeg from "jpeg-js";
import { uploadVideoToCloudinary, getHLSUrl } from "./cloudinary.service.js";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic?.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeUnlink = (filePath) => {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
};

const extractFrames = (inputPath, outputFolder, baseName) =>
  new Promise((resolve, reject) => {
    let files = [];
    ffmpeg(inputPath)
      .screenshots({ timestamps: ["20%", "50%", "80%"], filename: `${baseName}-frame-%i.jpg`, folder: outputFolder })
      .on("filenames", (f) => { files = f.map((n) => path.join(outputFolder, n)); })
      .on("end", () => resolve(files))
      .on("error", reject);
  });

// Returns true when all three Clarifai env vars are non-empty
const clarifaiConfigured = () =>
  !!(process.env.CLARIFAI_PAT?.trim() &&
     process.env.CLARIFAI_USER_ID?.trim() &&
     process.env.CLARIFAI_APP_ID?.trim());

// ─── Clarifai check ─────────────────────────────────────────────────────────

const runClarifaiCheck = async (framePath) => {
  try {
    const imageBytes = fs.readFileSync(framePath, { encoding: "base64" });

    const response = await fetch(
      "https://api.clarifai.com/v2/models/moderation-recognition/outputs",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Key ${process.env.CLARIFAI_PAT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_app_id: {
            user_id: process.env.CLARIFAI_USER_ID,
            app_id: process.env.CLARIFAI_APP_ID,
          },
          inputs: [{ data: { image: { base64: imageBytes } } }],
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    if (result.status?.code !== 10000)
      throw new Error(result.status?.description || "Clarifai API error");

    const concepts = result.outputs?.[0]?.data?.concepts;
    if (!concepts) throw new Error("Empty Clarifai response");

    const thresholds = { explicit: 0.85, gore: 0.35, weapon: 0.35, drug: 0.50 };

    for (const c of concepts) {
      const limit = thresholds[c.name] ?? 0.50;
      if (c.name in thresholds && c.value > limit) {
        return {
          safe: false,
          reason: `${c.name} ${Math.round(c.value * 100)}%`,
        };
      }
    }

    return { safe: true };
  } catch (err) {
    // Fail-open: if Clarifai is unavailable / token invalid, don't block the video
    console.warn(`[Clarifai] unavailable — ${err.message}`);
    return { safe: true, skipped: true, error: err.message };
  }
};

// ─── NSFW.js check ──────────────────────────────────────────────────────────

let _nsfwModel = null;
const getNsfwModel = async () => {
  if (!_nsfwModel) _nsfwModel = await nsfwjs.load();
  return _nsfwModel;
};

const runNsfwCheck = async (framePath) => {
  const model = await getNsfwModel();
  const imageBuffer = fs.readFileSync(framePath);
  const jpegData = jpeg.decode(imageBuffer, true);
  const px = jpegData.width * jpegData.height;
  const vals = new Int32Array(px * 3);
  for (let i = 0; i < px; i++) {
    vals[i * 3]     = jpegData.data[i * 4];
    vals[i * 3 + 1] = jpegData.data[i * 4 + 1];
    vals[i * 3 + 2] = jpegData.data[i * 4 + 2];
  }
  const tensor = tf.tensor3d(vals, [jpegData.height, jpegData.width, 3], "int32");
  const predictions = await model.classify(tensor);
  tensor.dispose();

  const top = predictions[0];
  const flagged = ["Porn", "Hentai"].includes(top.className) && top.probability > 0.80;
  return {
    safe: !flagged,
    label: top.className,
    confidence: Math.round(top.probability * 100),
  };
};

// ─── Main pipeline ───────────────────────────────────────────────────────────

export const startProcessing = async (videoId) => {
  let framePaths = [];

  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    const useClarifai = clarifaiConfigured();
    // Tell the frontend which APIs will run so it can show the right labels
    const apis = { nsfwjs: true, clarifai: useClarifai };

    const emit = async (progress, status, meta = {}) => {
      await Video.findByIdAndUpdate(videoId, { progress, status });
      io.emit("video-progress", { videoId, progress, status, apis, ...meta });
      console.log(`[${status}] ${progress}% | ${meta.phase ?? ""} ${meta.frame ? `frame ${meta.frame}/${meta.totalFrames}` : ""}`);
    };

    const baseName = path.parse(video.filename).name;

    // ── Phase 1: Extract frames ───────────────────────────────────────────
    await emit(5, "analyzing", { phase: "extracting_frames" });
    framePaths = await extractFrames(video.path, "uploads", baseName);
    const total = framePaths.length;

    let isVideoSafe = true;
    let flagReason = "";

    // ── Phase 2: NSFW.js — always runs ───────────────────────────────────
    for (let i = 0; i < framePaths.length; i++) {
      // 10 % → 35 % spread across frames
      const pct = Math.round(10 + (i / total) * 25);
      await emit(pct, "analyzing", { phase: "nsfw_check", frame: i + 1, totalFrames: total });

      const result = await runNsfwCheck(framePaths[i]);
      if (!result.safe) {
        isVideoSafe = false;
        flagReason = `NSFW · ${result.label} ${result.confidence}%`;
        break;
      }
    }

    // ── Phase 3: Clarifai — only when configured AND video still safe ─────
    if (isVideoSafe && useClarifai) {
      for (let i = 0; i < framePaths.length; i++) {
        // 40 % → 62 % spread across frames
        const pct = Math.round(40 + (i / total) * 22);
        await emit(pct, "analyzing", { phase: "clarifai_check", frame: i + 1, totalFrames: total });

        const result = await runClarifaiCheck(framePaths[i]);
        if (!result.safe && !result.skipped) {
          isVideoSafe = false;
          flagReason = `Violence/Gore · ${result.reason}`;
          break;
        }
        if (result.skipped) {
          // Token failed at runtime — log once and skip remaining Clarifai frames
          console.warn("[Clarifai] Skipping remaining frames due to API error");
          break;
        }
      }
    }

    // Cleanup frames
    framePaths.forEach(safeUnlink);
    framePaths = [];

    if (!isVideoSafe) {
      console.log(`🚨 Flagged: ${flagReason}`);
      await Video.findByIdAndUpdate(videoId, { progress: 0, status: "flagged", flagReason });
      io.emit("video-progress", { videoId, progress: 0, status: "flagged", flagReason, apis });
      return;
    }

    // ── Phase 4: Upload to Cloudinary ─────────────────────────────────────
    const absVideoPath = path.resolve(video.path);
    if (!fs.existsSync(absVideoPath)) {
      throw new Error(`Source video file missing before upload: ${absVideoPath}`);
    }
    await emit(65, "processing", { phase: "uploading" });

    // Crawl the bar from 65 → 84 % while the upload runs so it doesn't look frozen.
    // One tick per 4 s; stops (and clears) as soon as the upload settles.
    let uploadPct = 65;
    const uploadTick = setInterval(() => {
      if (uploadPct < 84) {
        uploadPct++;
        io.emit("video-progress", { videoId, progress: uploadPct, status: "processing", apis, phase: "uploading" });
      }
    }, 4_000);

    let uploadResult;
    try {
      uploadResult = await uploadVideoToCloudinary(absVideoPath, "pulse");
    } finally {
      clearInterval(uploadTick);
    }
    const publicId = uploadResult.public_id;

    safeUnlink(absVideoPath);

    // ── Phase 5: Finalize HLS ─────────────────────────────────────────────
    await emit(88, "processing", { phase: "finalizing" });

    await Video.findByIdAndUpdate(videoId, {
      cloudinaryId: publicId,
      "qualities.1080p": getHLSUrl(publicId, "1080p"),
      "qualities.720p": getHLSUrl(publicId, "720p"),
      "qualities.480p": getHLSUrl(publicId, "480p"),
      progress: 100,
      status: "safe",
    });

    io.emit("video-progress", { videoId, progress: 100, status: "safe", apis });
    console.log(`✅ Pipeline complete: ${video.title}`);
  } catch (error) {
    // Cleanup any remaining frames
    framePaths.forEach(safeUnlink);

    console.error("❌ Pipeline error:", error.message);

    // "failed" = technical/server error. "flagged" is reserved for content violations only.
    await Video.findByIdAndUpdate(videoId, {
      status: "failed",
      progress: 0,
      flagReason: `Processing error: ${error.message}`,
    });
    io.emit("video-progress", { videoId, progress: 0, status: "failed" });
  }
};
