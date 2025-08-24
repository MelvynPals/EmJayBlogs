const express = require("express");
const fs = require("fs");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// multer storage
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

// GET /api/posts - list (public)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "name avatarUrl");
    // attach commentsCount
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return { ...p.toObject(), commentsCount };
      })
    );
    res.json({ posts: withCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/posts/favorites  (current user's favorited posts) - protected
router.get("/favorites", protect, async (req, res) => {
  try {
    const posts = await Post.find({ favorites: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "name avatarUrl");
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return { ...p.toObject(), commentsCount };
      })
    );
    res.json({ posts: withCounts });
  } catch (err) {
    console.error("favorites route error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/posts/:id
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name avatarUrl"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    const commentsCount = await Comment.countDocuments({ post: post._id });
    res.json({ post: { ...post.toObject(), commentsCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts - create with optional 'cover' file
router.post("/", protect, upload.single("cover"), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Missing fields" });

    const coverUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const newPost = new Post({
      title,
      content,
      coverUrl,
      author: req.user._id,
    });
    await newPost.save();
    await newPost.populate("author", "name avatarUrl");
    // include commentsCount = 0
    res.status(201).json({ post: { ...newPost.toObject(), commentsCount: 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// favorite toggle
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const hasFav = post.favorites.some((u) => u.equals(req.user._id));
    if (hasFav) {
      post.favorites = post.favorites.filter((u) => !u.equals(req.user._id));
    } else {
      post.favorites.push(req.user._id);
    }
    await post.save();
    res.json({
      favoritesCount: post.favorites.length,
      favorites: post.favorites,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reaction toggle: clicking same type removes it, clicking different replaces it
router.post("/:id/reaction", protect, async (req, res) => {
  try {
    const { type } = req.body;
    if (!["like", "dislike", "love"].includes(type))
      return res.status(400).json({ message: "Invalid type" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // find existing reaction index for this user
    const existingIndex = post.reactions.findIndex(
      (r) => String(r.user) === String(req.user._id)
    );
    if (existingIndex !== -1) {
      const existing = post.reactions[existingIndex];
      if (existing.type === type) {
        // same type -> remove (toggle off)
        post.reactions.splice(existingIndex, 1);
        await post.save();
        return res.json({
          message: "Reaction removed",
          reactions: post.reactions,
        });
      } else {
        // different type -> replace
        post.reactions[existingIndex].type = type;
        await post.save();
        return res.json({
          message: "Reaction updated",
          reactions: post.reactions,
        });
      }
    } else {
      // no existing reaction -> add
      post.reactions.push({ user: req.user._id, type });
      await post.save();
      return res.json({ message: "Reaction added", reactions: post.reactions });
    }
  } catch (err) {
    console.error("reaction error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET posts by user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("author", "name avatarUrl");
    // attach commentsCount for each
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return { ...p.toObject(), commentsCount };
      })
    );
    res.json({ posts: withCounts });
  } catch (err) {
    console.error("GET /user/:userId error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// delete reaction
router.delete("/:id/reaction", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.reactions = post.reactions.filter((r) => !r.user.equals(req.user._id));
    await post.save();
    res.json({ message: "Removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/posts/:id  -> edit post (owner or admin). supports optional file upload 'cover'
router.put("/:id", protect, upload.single("cover"), async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, coverUrl } = req.body; // coverUrl optional string (if not uploading file)
    const file = req.file; // optional uploaded file

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // ownership check
    const isOwner = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    // If a new cover file is uploaded, remove previous file from disk (if any)
    if (file) {
      // delete old file (if exists and is stored under /uploads/)
      if (post.coverUrl && post.coverUrl.startsWith("/uploads/")) {
        try {
          const oldFilename = post.coverUrl.split("/uploads/")[1];
          if (oldFilename) {
            const oldPath = path.join(__dirname, "..", "uploads", oldFilename);
            fs.unlink(oldPath, (err) => {
              // non-fatal if deletion fails; just log
              if (err && err.code !== "ENOENT")
                console.error("Failed to remove old cover file", err);
            });
          }
        } catch (e) {
          console.error("Error while trying to remove old cover:", e);
        }
      }

      post.coverUrl = `/uploads/${file.filename}`;
    } else if (coverUrl !== undefined) {
      // allow updating coverUrl by string (e.g., set to '' to remove)
      post.coverUrl = coverUrl;
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;

    await post.save();
    await post.populate("author", "name avatarUrl");

    // include commentsCount for convenience
    const commentsCount = await Comment.countDocuments({ post: post._id });

    res.json({
      message: "Post updated",
      post: { ...post.toObject(), commentsCount },
    });
  } catch (err) {
    console.error("Failed to update post", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:id  -> delete post (owner or admin). cleans up comments, favorites, and cover file.
router.delete("/:id", protect, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // ownership check
    const isOwner = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    // delete cover file from disk if stored in uploads
    if (post.coverUrl && post.coverUrl.startsWith("/uploads/")) {
      try {
        const filename = post.coverUrl.split("/uploads/")[1];
        if (filename) {
          const filePath = path.join(__dirname, "..", "uploads", filename);
          fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT")
              console.error("Failed to remove cover file", err);
          });
        }
      } catch (e) {
        console.error("Error deleting cover file:", e);
      }
    }

    // remove the post document (use deleteOne instead of deprecated/non-existent remove())
    await post.deleteOne();

    // delete all comments associated with the post
    try {
      await Comment.deleteMany({ post: postId });
    } catch (err) {
      console.error("Failed to delete comments for post", err);
    }

    // remove post id from any user's favoritePosts array (if you keep that)
    try {
      await User.updateMany(
        { favoritePosts: postId },
        { $pull: { favoritePosts: postId } }
      );
    } catch (err) {
      // non-fatal, just log
      console.error("Failed to remove post from users favoritePosts", err);
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Failed to delete post", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
