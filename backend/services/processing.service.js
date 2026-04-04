import Video from "../models/Video.js";
import { io } from "../server.js";

export const startProcessing = async (videoId) => {

  let progress = 0;

  const update = async (value, status) => {

    await Video.findByIdAndUpdate(videoId, {
      progress: value,
      status: status
    });
    const payload = { videoId, progress: value, status };

    // Send the payload to client
    io.emit("video-progress", payload);

    // Console print to verify
    console.log(`Uploading Progress: ${value}% - Status: ${status}`);
  };

  await update(10, "processing");

  setTimeout(() => update(30, "processing"), 1000);
  setTimeout(() => update(60, "processing"), 2000);

  setTimeout(async () => {

    const result = Math.random() > 0.5 ? "safe" : "flagged";

    await update(100, result);

  }, 3000);
};