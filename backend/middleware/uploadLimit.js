import Video from "../models/Video.js";

export const checkUploadLimit = async (req, res, next) => {
  const userId = req.user.id; // Assuming you have auth middleware setting req.user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // 1. Count videos uploaded by this user in the last hour
  const uploadCount = await Video.countDocuments({
    userId: userId,
    createdAt: { $gte: oneHourAgo }
  });

  if (uploadCount >= 3) {
    return res.status(429).json({ 
      error: "Upload limit reached. Please wait an hour to save API tokens!" 
    });
  }

  next();
};