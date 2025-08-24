const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");

const router = express.Router();

// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const search = (req.query.search || "").trim();
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email role banned avatarUrl followers");
    res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        banned: !!u.banned,
        followersCount: (u.followers || []).length,
      })),
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/users/:id/ban  body { banned: true|false }
router.patch("/users/:id/ban", protect, adminOnly, async (req, res) => {
  try {
    const { banned } = req.body;
    if (typeof banned !== "boolean")
      return res.status(400).json({ message: "Missing banned boolean" });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (String(target._id) === String(req.user._id))
      return res.status(400).json({ message: "Cannot ban yourself" });
    if (target.role === "admin" && banned) {
      const activeAdmins = await User.countDocuments({
        role: "admin",
        banned: { $ne: true },
      });
      if (activeAdmins <= 1)
        return res
          .status(400)
          .json({ message: "Cannot ban the last active admin" });
    }
    target.banned = banned;
    await target.save();
    res.json({ user: { id: target._id, banned: target.banned } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/posts
router.get("/posts", protect, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const authorQuery = (req.query.author || "").trim();

    let baseFilter = {};
    let authorIds = [];
    if (authorQuery) {
      // If looks like ObjectId, include direct match
      if (mongoose.isValidObjectId(authorQuery)) {
        authorIds.push(authorQuery);
      }
      // Also search users by partial name or email fragment
      const userMatches = await User.find({
        $or: [
          { name: { $regex: authorQuery, $options: "i" } },
          { email: { $regex: authorQuery, $options: "i" } },
        ],
      }).select("_id");
      authorIds.push(...userMatches.map((u) => u._id.toString()));
      if (authorIds.length) {
        baseFilter.author = { $in: [...new Set(authorIds)] };
      } else {
        // No matching authors -> return empty page quickly
        return res.json({ posts: [], page: 1, totalPages: 1, total: 0 });
      }
    }

    const total = await Post.countDocuments(baseFilter);
    const posts = await Post.find(baseFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name");

    res.json({
      posts: posts.map((p) => ({
        id: p._id,
  title: p.title,
        author: p.author ? { id: p.author._id, name: p.author.name } : null,
        createdAt: p.createdAt,
      })),
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/posts/:id
router.delete("/posts/:id", protect, adminOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Deleted", id: post._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
