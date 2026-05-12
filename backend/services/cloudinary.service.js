import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload video in 6 MB chunks — cloudinary v2 signature: (path, callback, options)
export const uploadVideoToCloudinary = (localPath, folder = "vigil") =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      localPath,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
      {
        resource_type: "video",
        folder,
        chunk_size: 6_000_000,
        timeout: 180_000,
      }
    );
  });

// Delete a video from Cloudinary by public_id
export const deleteVideoFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: "video" });
};

// Build a streamable URL for a given quality using Cloudinary transformations
export const getHLSUrl = (publicId, quality) => {
  const heights = { "1080p": 1080, "720p": 720, "480p": 480 };
  const height = heights[quality] || 720;
  // Use mp4 with quality transformation — HLS.js can play mp4 directly
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [{ height, crop: "scale", quality: "auto", fetch_format: "auto" }],
    format: "mp4",
    secure: true,
  });
};
