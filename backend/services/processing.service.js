import Video from "../models/Video.js";
import { io } from "../server.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import jpeg from "jpeg-js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// --- Helper 1: Extract a frame for analysis ---
const extractFrame = (inputPath, outputFolder, filename) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['50%'], // Grab a frame from the middle of the video
        filename: filename,
        folder: outputFolder,
      })
      .on('end', () => resolve(path.join(outputFolder, filename)))
      .on('error', (err) => reject(err));
  });
};

// --- Helper 2: Compress Video ---
const compressVideo = (inputPath, resolution, outputName) => {
  return new Promise((resolve, reject) => {
    const outputPath = `uploads/${outputName}`;
    ffmpeg(inputPath)
      .size(resolution)
      .outputOptions([
        '-preset fast',      // Safer preset for actual processing
        '-movflags faststart', 
        '-c:v libx264'         
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err));
  });
};

export const startProcessing = async (videoId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    const update = async (progress, status) => {
      await Video.findByIdAndUpdate(videoId, { progress, status });
      io.emit("video-progress", { videoId, progress, status });
      console.log(`📡 Status: ${status} - ${progress}%`);
    };

    const baseName = path.parse(video.filename).name;
    const frameFilename = `${baseName}-frame.jpg`;

    // --- PHASE 1: ACTUAL SENSITIVITY ANALYSIS (Pure JS) ---
    await update(10, "analyzing");
    
    // 1. Extract a frame
    const framePath = await extractFrame(video.path, 'uploads', frameFilename);

    // 2. Load the NSFW model
    const model = await nsfwjs.load();

    // 3. Read and decode the image entirely in JS (No C++ Canvas needed!)
    const imageBuffer = fs.readFileSync(framePath);
    const jpegData = jpeg.decode(imageBuffer, true);
    
    // 4. Manually convert the RGBA image data into an RGB Tensor
    const numChannels = 3;
    const numPixels = jpegData.width * jpegData.height;
    const values = new Int32Array(numPixels * numChannels);

    for (let i = 0; i < numPixels; i++) {
      values[i * numChannels + 0] = jpegData.data[i * 4 + 0]; // R
      values[i * numChannels + 1] = jpegData.data[i * 4 + 1]; // G
      values[i * numChannels + 2] = jpegData.data[i * 4 + 2]; // B
    }

    const tensor = tf.tensor3d(values, [jpegData.height, jpegData.width, numChannels], 'int32');
    
    // 5. Classify the Tensor
    const predictions = await model.classify(tensor);
    tensor.dispose(); // CRITICAL: Free up memory
    fs.unlinkSync(framePath); // Cleanup the extracted frame

    // 6. Determine if safe
    const topPrediction = predictions[0].className;
    const isSafe = !["Porn", "Hentai", "Sexy"].includes(topPrediction);

    if (!isSafe) {
      console.log("🚨 NSFW Content Detected:", predictions);
      await update(100, "flagged");
      return; 
    }
    // --- PHASE 2: SAFE VIDEO COMPRESSION (Sequential) ---
    await update(30, "processing");
    console.log("✅ Content is safe. Starting 1080p compression...");

    // Process sequentially to prevent crashing your local machine
    const path1080 = await compressVideo(video.path, '1920x1080', `${baseName}-1080p.mp4`);
    
    await update(60, "processing");
    console.log("✅ 1080p done. Starting 720p compression...");
    
    const path720 = await compressVideo(video.path, '1280x720', `${baseName}-720p.mp4`);

    await update(90, "processing");
    console.log("✅ 720p done. Starting 480p compression...");

    const path480 = await compressVideo(video.path, '854x480', `${baseName}-480p.mp4`);

    // --- PHASE 3: FINALIZE ---
    await Video.findByIdAndUpdate(videoId, {
      "qualities.1080p": path1080,
      "qualities.720p": path720,
      "qualities.480p": path480,
      progress: 100,
      status: "safe"
    });

    io.emit("video-progress", { videoId, progress: 100, status: "safe" });
    console.log(`🎉 Video optimized and ready for streaming!`);

  } catch (error) {
    console.error("Processing failed:", error);
    await Video.findByIdAndUpdate(videoId, { status: "flagged", progress: 0 });
  }
};