import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // only set for legacy local-auth users
  role: {
    type: String,
    enum: ["viewer", "editor", "admin"],
    default: "viewer"
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);