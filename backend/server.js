// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const path = require("path");
const multer = require("multer");

// create uploads folder if not exist
const uploadsDir = path.join(__dirname, "uploads");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// basic route
app.get("/", (req, res) => res.send("API is running"));

// auth routes
app.use("/api/auth", authRoutes);

// post routes
const postRoutes = require("./routes/posts");
app.use("/api/posts", postRoutes);

// user routes
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

// admin routes
app.use("/api/admin", require("./routes/admin"));

// comments route
app.use("/api/comments", require("./routes/comments"));

// search route
app.use("/api/search", require("./routes/search"));

// in main server setup (after app initialization):
app.use("/uploads", express.static(uploadsDir));

// connect to MongoDB then start server
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Seed default admin (dev convenience)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin123@example.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "supersecurepassword";
      const User = require("./models/User");
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const admin = new User({
          name: "Admin",
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
        await admin.save();
        console.log("Seeded default admin:", adminEmail);
      }
    } catch (seedErr) {
      console.error("Admin seed failed", seedErr);
    }
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
