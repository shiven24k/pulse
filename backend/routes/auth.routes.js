import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken, createClerkClient } from "@clerk/backend";
import User from "../models/User.js";
import auth, { authorize } from "../middleware/auth.js";

const router = express.Router();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// POST /auth/sync — called by the frontend after any Clerk sign-in/sign-up
// Verifies the Clerk session token, finds or creates a MongoDB user, returns our role-enriched JWT
router.post("/sync", async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.split(" ")[1];
    if (!sessionToken) return res.status(401).json({ error: "No token" });

    // Omitting authorizedParties skips the azp claim check, which avoids mismatches
    // between the Clerk instance domain and the app origin
    let clerkUserId;
    try {
      const payload = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      clerkUserId = payload.sub;
    } catch (verifyErr) {
      console.error("[sync] token verify failed:", verifyErr.message);
      return res.status(401).json({ error: "Invalid Clerk token", detail: verifyErr.message });
    }

    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    // Always search by clerkId first, then fall back to email (handles re-linked
    // accounts, pre-seeded entries, and Clerk account recreation)
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Re-link: update clerkId regardless of what it was before
        user.clerkId = clerkUserId;
        await user.save();
        console.log(`[sync] re-linked ${email}`);
      } else {
        const userCount = await User.countDocuments();
        user = await User.create({
          clerkId: clerkUserId,
          email,
          role: userCount === 0 ? "admin" : "viewer",
        });
        console.log(`[sync] created ${email} → ${user.role}`);
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Sync error:", err.message);
    // 401 only for auth failures — everything else is a server error
    const status = err.name === "ClerkAPIResponseError" ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Legacy routes kept for backwards compatibility
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCount = await User.countDocuments();
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      role: userCount === 0 ? "admin" : "viewer",
    });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database fetch failed" });
  }
});

router.patch("/users/:id/role", auth, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: "Role updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
