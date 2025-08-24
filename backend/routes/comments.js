const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");

const router = express.Router();

// create comment
router.post("/", protect, async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    if (!postId || !content)
      return res.status(400).json({ message: "Missing fields" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
    });
    await comment.save();
    await comment.populate("author", "name avatarUrl");
    res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// get comments for post
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "name avatarUrl")
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/comments/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate(
      "author",
      "_id"
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const isOwner = String(comment.author._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });
    await comment.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("delete comment err", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
