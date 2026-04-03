import Video from "../models/Video.js";
import { io } from "../server.js";

export const startProcessing = async (videoId) => {

  let progress = 0;

  const update = async (value, status) => {

    await Video.findByIdAndUpdate(videoId, {
      progress: value,
      status: status
    });

    io.emit("video-progress", {
      videoId,
      progress: value,
      status
    });
  };

  await update(10, "processing");

  setTimeout(() => update(30, "processing"), 1000);
  setTimeout(() => update(60, "processing"), 2000);

  setTimeout(async () => {

    const result = Math.random() > 0.5 ? "safe" : "flagged";

    await update(100, result);

  }, 3000);
};