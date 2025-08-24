// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.banned) return res.status(403).json({ message: "User is banned" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin only" });
};
