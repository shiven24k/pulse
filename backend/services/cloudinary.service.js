import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload raw video — returns public_id and secure_url
export const uploadVideoToCloudinary = (localPath, folder = "pulse") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      localPath,
      { resource_type: "video", folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

// Delete a video from Cloudinary by public_id
export const deleteVideoFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: "video" });
};

// Build a streamable URL for a given quality
export const getHLSUrl = (publicId, quality) => {
  const heights = { "1080p": 1080, "720p": 720, "480p": 480 };
  const height = heights[quality] || 720;
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [{ height, crop: "scale" }],
    format: "m3u8",
  });
};
