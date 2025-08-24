// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // title: { type: String, default: "" }, // new "Title" field
    avatarUrl: { type: String, default: "" }, // profile image URL
    coverUrl: { type: String, default: "" }, // cover photo URL
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // who follows this user
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // who this user follows
    favoritePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // favorites
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// helper to compare password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
// This code defines a Mongoose schema for a User model in a Node.js application.
