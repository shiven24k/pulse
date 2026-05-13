/**
 * Seeds two demo users in MongoDB with their roles pre-assigned.
 *
 * After running this, sign in through the app UI with these emails —
 * the /auth/sync route detects the email match and links the Clerk account
 * automatically, preserving the pre-assigned role.
 *
 * Run: node seed.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const DEMO = [
  { email: "admin@vigil.demo", role: "admin" },
  { email: "creator@vigil.demo", role: "editor" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  for (const { email, role } of DEMO) {
    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = role;
      await existing.save();
      console.log(`Updated: ${email} → ${role}`);
    } else {
      await User.create({ email, role });
      console.log(`Created: ${email} → ${role}`);
    }
  }

  const all = await User.find({}, "email role clerkId").lean();
  console.log("\nAll users in DB:");
  all.forEach((u) =>
    console.log(`  ${u.email.padEnd(30)} role=${u.role}  linked=${!!u.clerkId}`)
  );

  await mongoose.disconnect();
  console.log("\nDone.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
