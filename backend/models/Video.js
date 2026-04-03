import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({

  title: String,
  filename: String,
  path: String,
  size: Number,

  status: {
    type: String,
    enum: ["uploading","processing","safe","flagged"],
    default: "uploading"
  },

  progress: {
    type: Number,
    default: 0
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export default mongoose.model("Video", videoSchema);