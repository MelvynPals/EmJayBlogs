const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");

const router = express.Router();

// Utility to escape regex special chars
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSnippet(content, q, maxLen = 160) {
  if (!content) return "";
  const lower = content.toLowerCase();
  const lowerQ = q.toLowerCase();
  const idx = lower.indexOf(lowerQ);
  if (idx === -1)
    return content.slice(0, maxLen) + (content.length > maxLen ? "…" : "");
  const pad = Math.floor(maxLen / 2);
  const start = Math.max(0, idx - pad);
  const end = Math.min(content.length, idx + lowerQ.length + pad);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < content.length) snippet = snippet + "…";
  return snippet;
}

// GET /api/search?q=term
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limitPosts = Math.min(parseInt(req.query.postLimit, 10) || 10, 25);
    const limitUsers = Math.min(parseInt(req.query.userLimit, 10) || 8, 25);

    if (!q || q.length < 2) {
      return res.json({ query: q, posts: [], users: [] });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const [posts, users] = await Promise.all([
      Post.find({ $or: [{ title: regex }, { content: regex }] })
        .sort({ createdAt: -1 })
        .limit(limitPosts)
        .populate("author", "name avatarUrl")
        .select("title content author createdAt favorites reactions"),
      User.find({ $or: [{ name: regex }, { email: regex }] })
        .limit(limitUsers)
  .select("name avatarUrl"),
    ]);

    const mappedPosts = posts.map((p) => ({
      id: p._id,
  title: p.title, // post title retained
      author: p.author
        ? {
            id: p.author._id,
            name: p.author.name,
            avatarUrl: p.author.avatarUrl,
          }
        : null,
      createdAt: p.createdAt,
      favoritesCount: (p.favorites || []).length,
      reactionsCount: (p.reactions || []).length,
      snippet: buildSnippet(p.content, q),
    }));

    const mappedUsers = users.map((u) => ({
      id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl,
    }));

    res.json({ query: q, posts: mappedPosts, users: mappedUsers });
  } catch (err) {
    console.error("Search error", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
