/**
 * Image Gallery Management System - Server
 * Run: npm install express multer && node server.js
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ── Ensure uploads folder exists ─────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ── In-memory image metadata store ───────────────────────────────────────────
let images = []; // { id, title, description, category, filename, uploadDate }
let nextId = 1;

// ── Multer storage config ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files are allowed."));
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOADS_DIR)); // serve uploaded images

// ── API Routes ────────────────────────────────────────────────────────────────

// POST /upload — upload image with metadata
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const { title, description, category } = req.body;
  if (!title || !category)
    return res.status(400).json({ error: "Title and category are required." });

  const record = {
    id: nextId++,
    title: title.trim(),
    description: (description || "").trim(),
    category: category.trim(),
    filename: req.file.filename,
    uploadDate: new Date().toISOString(),
  };

  images.push(record);
  res.status(201).json({ message: "Image uploaded successfully.", image: record });
});

// GET /images — return all metadata (newest first by default)
app.get("/images", (req, res) => {
  res.json(images);
});

// DELETE /image/:id — delete image file + remove metadata
app.delete("/image/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = images.findIndex((img) => img.id === id);

  if (idx === -1) return res.status(404).json({ error: "Image not found." });

  const { filename } = images[idx];
  const filePath = path.join(UPLOADS_DIR, filename);

  // Remove from memory first
  images.splice(idx, 1);

  // Delete file from disk (ignore if already gone)
  fs.unlink(filePath, () => {});

  res.json({ message: "Image deleted." });
});

// GET /download/:id — force-download the image
app.get("/download/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const img = images.find((i) => i.id === id);

  if (!img) return res.status(404).json({ error: "Image not found." });

  const filePath = path.join(UPLOADS_DIR, img.filename);
  res.download(filePath, img.title + path.extname(img.filename));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`✅  Gallery server running → http://localhost:${PORT}`)
);