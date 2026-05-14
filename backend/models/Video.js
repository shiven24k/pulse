import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({

  title: String,
  filename: String,
  path: String,
  cloudinaryId: String,
  size: Number,

  qualities:{
  "1080p": { type: String, default: null },
    "720p": { type: String, default: null },
    "480p": { type: String, default: null }
  },
  status: {
    type: String,
    enum: ["uploading", "analyzing", "processing", "safe", "flagged", "failed"],
    default: "uploading"
  },

  progress: { type: Number, default: 0 },
  flagReason: { type: String, default: null },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export default mongoose.model("Video", videoSchema);