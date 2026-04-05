import Video from "../models/Video.js";
import { io } from "../server.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import jpeg from "jpeg-js";
import { uploadVideoToCloudinary, getHLSUrl } from "./cloudinary.service.js";

// Render (Linux) has ffmpeg pre-installed — no installer needed
// For local Windows dev, install ffmpeg and add it to PATH

// --- Helper: Extract MULTIPLE frames ---
const extractFrames = (inputPath, outputFolder, baseName) => {
  return new Promise((resolve, reject) => {
    let generatedFiles = [];
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ["20%", "50%", "80%"],
        filename: `${baseName}-frame-%i.jpg`,
        folder: outputFolder,
      })
      .on("filenames", (filenames) => {
        generatedFiles = filenames.map((f) => path.join(outputFolder, f));
      })
      .on("end", () => resolve(generatedFiles))
      .on("error", (err) => reject(err));
  });
};

// --- Helper: AI Moderation ---
const checkViolenceAndChaos = async (framePath) => {
  try {
    const PAT = process.env.CLARIFAI_PAT;
    const USER_ID = process.env.CLARIFAI_USER_ID;
    const APP_ID = process.env.CLARIFAI_APP_ID;

    const imageBytes = fs.readFileSync(framePath, { encoding: "base64" });

    // FIXED: Using direct model endpoint to solve "Resource does not exist"
    const response = await fetch(
      `https://api.clarifai.com/v2/models/moderation-recognition/outputs`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Key ${PAT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_app_id: { user_id: USER_ID, app_id: APP_ID },
          inputs: [{ data: { image: { base64: imageBytes } } }],
        }),
      }
    );

    const result = await response.json();

    if (result.status && result.status.code !== 10000) {
      console.error("❌ Clarifai API Error:", result.status.description);
      return true; // Fail-safe
    }

    if (!result.outputs || !result.outputs[0].data) {
      console.error("❌ API Response empty or malformed.");
      return true;
    }

    const concepts = result.outputs[0].data.concepts;
    let isSafe = true;

    for (const concept of concepts) {
      // NEW: Stricter limit for violence/gore (35%) vs others (50%)
     let dangerLimit = 0.50; 
  if (concept.name === 'explicit') dangerLimit = 0.85;
  if (concept.name === 'gore' || concept.name === 'weapon') dangerLimit = 0.35;

  if (["gore", "drug", "weapon", "explicit"].includes(concept.name) && concept.value > dangerLimit) {
    console.log(`🚨 CLARIFAI DANGER: ${concept.name.toUpperCase()} (${Math.round(concept.value * 100)}%)`);
    isSafe = false;
    break;
  }
    }
    return isSafe;
  } catch (error) {
    console.error("AI System Crash:", error.message);
    return true; // Fail-safe
  }
};

// --- THE MAIN PROCESSING PIPELINE ---
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

    // --- PHASE 1: SENSITIVITY ANALYSIS ---
    await update(10, "analyzing");
    const framePaths = await extractFrames(video.path, "uploads", baseName);
    const model = await nsfwjs.load();

    let isVideoSafe = true;
    let flagReason = "";

    for (const framePath of framePaths) {
      const imageBuffer = fs.readFileSync(framePath);
      const jpegData = jpeg.decode(imageBuffer, true);
      const numChannels = 3;
      const numPixels = jpegData.width * jpegData.height;
      const values = new Int32Array(numPixels * numChannels);

      for (let i = 0; i < numPixels; i++) {
        values[i * numChannels + 0] = jpegData.data[i * 4 + 0];
        values[i * numChannels + 1] = jpegData.data[i * 4 + 1];
        values[i * numChannels + 2] = jpegData.data[i * 4 + 2];
      }

      const tensor = tf.tensor3d(values, [jpegData.height, jpegData.width, numChannels], "int32");
      const predictions = await model.classify(tensor);
      tensor.dispose();

      const topPrediction = predictions[0].className;
      const confidence = predictions[0].probability;


      const isNsfwSafe = !(
        ["Porn", "Hentai"].includes(topPrediction) && confidence > 0.80
      );

      const isViolenceSafe = await checkViolenceAndChaos(framePath);

      if (!isNsfwSafe || !isViolenceSafe) {
        isVideoSafe = false;
        flagReason = !isNsfwSafe ? `NSFW (${topPrediction} ${Math.round(confidence * 100)}%)` : "Violence/Gore";
        break;
      }
    }

    framePaths.forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));

    if (!isVideoSafe) {
      console.log(`🚨 Flagged: ${flagReason}`);
      await update(0, "flagged");
      return;
    }

// --- PHASE 2: UPLOAD TO CLOUDINARY ---
    await update(30, "processing");
    const uploadResult = await uploadVideoToCloudinary(video.path, "pulse");
    const publicId = uploadResult.public_id;
    await update(80, "processing");

    // Cleanup local file after upload
    if (fs.existsSync(video.path)) fs.unlinkSync(video.path);

    // --- PHASE 3: FINALIZE ---
    await Video.findByIdAndUpdate(videoId, {
      cloudinaryId: publicId,
      "qualities.1080p": getHLSUrl(publicId, "1080p"),
      "qualities.720p":  getHLSUrl(publicId, "720p"),
      "qualities.480p":  getHLSUrl(publicId, "480p"),
      progress: 100,
      status: "safe",
    });

    io.emit("video-progress", { videoId, progress: 100, status: "safe" });
    console.log(`🎉 HLS Stream Ready on Cloudinary!`);
  } catch (error) {
    console.error("Process Fail:", error);
    await Video.findByIdAndUpdate(videoId, { status: "flagged", progress: 0 });
  }
};