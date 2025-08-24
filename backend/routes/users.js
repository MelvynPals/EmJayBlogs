const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// PUT /api/users/me/upload  (multipart, fields: avatar, cover)
router.put(
  "/me/upload",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate("followers")
        .populate("following");
      if (!user) return res.status(404).json({ message: "User not found" });
      if (req.files?.avatar)
        user.avatarUrl = `/uploads/${req.files.avatar[0].filename}`;
      if (req.files?.cover)
        user.coverUrl = `/uploads/${req.files.cover[0].filename}`;
      await user.save();
      res.json({
        user: {
          id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          coverUrl: user.coverUrl,
          followersCount: user.followers.length,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/users/me  (return user data) - protected
router.get("/me", protect, async (req, res) => {
  const user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };
  res.json({ user });
});

// PUT /api/users/me  (update name/email) - protected
router.put("/me", protect, async (req, res) => {
  try {
  const { name, email } = req.body;
    if (!name && !email)
      return res.status(400).json({ message: "Nothing to update" });

    if (email && email !== req.user.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/me/password  (change password) - protected
router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword; // pre-save hook in model will hash
    await user.save();

    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/me/posts - get posts created by current user
router.get("/me/posts", protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Follow / Unfollow
router.post("/:id/follow", protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (req.user._id.equals(targetId))
      return res.status(400).json({ message: "Cannot follow yourself" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    // if already following -> unfollow
    const isFollowing = target.followers.some((f) => f.equals(req.user._id));
    if (isFollowing) {
      target.followers = target.followers.filter(
        (f) => !f.equals(req.user._id)
      );
      await target.save();
      req.user.following = req.user.following.filter(
        (f) => !f.equals(target._id)
      );
      await req.user.save();
      return res.json({
        message: "Unfollowed",
        target: { id: target._id, followersCount: target.followers.length },
        currentUser: {
          id: req.user._id,
          following: req.user.following.map((f) => f),
        },
      });
    } else {
      target.followers.push(req.user._id);
      await target.save();
      req.user.following.push(target._id);
      await req.user.save();
      return res.json({
        message: "Followed",
        target: { id: target._id, followersCount: target.followers.length },
        currentUser: {
          id: req.user._id,
          following: req.user.following.map((f) => f),
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Who-to-follow suggestions (simple) - keep this BEFORE generic :id route
router.get("/suggestions", protect, async (req, res) => {
  try {
    const LIMIT = 6;
    const myId = req.user._id;
    // ensure following is array of ObjectIds (protect middleware should have populated req.user)
    const followingIds = (req.user.following || []).map((id) => id.toString());

    // 1. Primary candidates: friends-of-friends (people followed by those I follow => they have at least one mutual follower with me)
    // We approximate by: users whose followers contain any of my followingIds
    let fofCandidates = await User.find({
      _id: { $ne: myId, $nin: followingIds },
      followers: { $in: followingIds },
    })
  .select("name avatarUrl followers")
      .lean();

    // compute mutual follower count (intersection of their followers with my following list)
    const followingSet = new Set(followingIds);
    fofCandidates.forEach((u) => {
      const mutuals = (u.followers || []).filter((f) =>
        followingSet.has(f.toString())
      );
      u.mutualCount = mutuals.length;
      u.followersCount = (u.followers || []).length;
    });

    // sort descending by mutualCount then followersCount
    fofCandidates.sort(
      (a, b) =>
        b.mutualCount - a.mutualCount || b.followersCount - a.followersCount
    );

    let suggestions = fofCandidates.slice(0, LIMIT);

    // 2. If not enough, fill with popular users (by followers count) not already included/following/self
    if (suggestions.length < LIMIT) {
      const excludeIds = new Set([
        myId.toString(),
        ...followingIds,
        ...suggestions.map((s) => s._id.toString()),
      ]);
      // fetch a pool and sort locally by follower count
      let fillPool = await User.find({ _id: { $nin: Array.from(excludeIds) } })
  .select("name avatarUrl followers")
        .lean();
      fillPool.forEach((u) => {
        u.followersCount = (u.followers || []).length;
        u.mutualCount = 0;
      });
      fillPool.sort((a, b) => b.followersCount - a.followersCount);
      for (const u of fillPool) {
        if (suggestions.length >= LIMIT) break;
        suggestions.push(u);
      }
    }

    // Final shape: remove heavy followers arrays
    suggestions = suggestions.map((u) => ({
      _id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      followersCount: u.followersCount,
      mutualCount: u.mutualCount,
    }));

    res.json({ suggestions });
  } catch (err) {
    console.error("suggestions error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Consolidated GET /api/users/:id (public) AFTER /suggestions
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
  .populate("followers", "name avatarUrl")
  .populate("following", "name avatarUrl");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      user: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
