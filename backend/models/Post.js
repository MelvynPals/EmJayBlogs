const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "dislike", "love"], required: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverUrl: { type: String, default: "" }, // optional cover image
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reactions: [reactionSchema], // one per user enforced in routes
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who favorited
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
