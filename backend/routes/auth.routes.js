import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth, { authorize } from "../middleware/auth.js"

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if any users exist yet
    const userCount = await User.countDocuments();
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hashed,
      // If no users exist, make this one the Admin
      role: userCount === 0 ? "admin" : "viewer" 
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Fetch all, hide passwords
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database fetch failed" });
  }
});
router.patch("/users/:id/role", auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: "Role updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
