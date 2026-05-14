import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadVideoToCloudinary = (localPath, folder = "vigil") => {
  const absPath = path.resolve(localPath);

  if (!fs.existsSync(absPath)) {
    return Promise.reject(new Error(`Source video not found: ${absPath}`));
  }

  // v2 upload returns a Promise and uses a clean non-stream code path:
  // createReadStream → error handler attached → pipe to post_request.
  // upload_large's stream mode mixes direct writes + piped writes on the same
  // socket which causes the ECONNRESET on Cloudinary's end.
  return cloudinary.uploader.upload(absPath, {
    resource_type: "video",
    folder,
    timeout: 300_000,
  });
};

export const deleteVideoFromCloudinary = (publicId) =>
  cloudinary.uploader.destroy(publicId, { resource_type: "video" });

export const getHLSUrl = (publicId, quality) => {
  const heights = { "1080p": 1080, "720p": 720, "480p": 480 };
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [{ height: heights[quality] ?? 720, crop: "scale", quality: "auto", fetch_format: "auto" }],
    format: "mp4",
    secure: true,
  });
};
