// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const JWT_EXPIRES_MS = 24 * 60 * 60 * 1000; // 1 day in ms (adjust if you want)

// helper: send token as httpOnly cookie
async function sendToken(res, user) {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  const cookieOptions = {
    httpOnly: true,
    maxAge: JWT_EXPIRES_MS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("token", token, cookieOptions);

  // Re-fetch minimal user to ensure latest following/followers counts
  const fresh = await User.findById(user._id)
    .select("-password")
    .populate("followers", "_id")
    .populate("following", "_id");
  const userSafe = {
    id: fresh._id,
    name: fresh.name,
    email: fresh.email,
    role: fresh.role,
    avatarUrl: fresh.avatarUrl,
    coverUrl: fresh.coverUrl,
    followersCount: fresh.followers?.length || 0,
    following: (fresh.following || []).map((f) => f._id),
  };
  return res.json({ message: "Success", user: userSafe });
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const user = new User({ name, email, password });
    await user.save();

    return sendToken(res, user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.banned) return res.status(403).json({ message: "Account banned" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    return sendToken(res, user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me  (protected)
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("followers", "_id")
    .populate("following", "_id");
  const response = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    followersCount: (user.followers && user.followers.length) || 0,
    following: (user.following || []).map((f) => f._id),
  };
  res.json({ user: response });
});

module.exports = router;
// This code defines authentication routes for a Node.js Express application, including signup, login, logout, and fetching the current user's info. It uses JWT for session management and bcrypt for password hashing.
