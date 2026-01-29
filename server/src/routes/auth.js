import { Router } from "express";
import User from "../models/User.js";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

function hash(pw) {
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_").slice(0, 50);
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
function logoFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("unsupported_file_type"));
  }
  cb(null, true);
}
const uploadLogo = multer({
  storage,
  fileFilter: logoFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/auth/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (username === "admin@123" && password === "password@1234") {
    return res.json({ ok: true, admin: true });
  }
  return res.status(401).json({ error: "invalid_credentials" });
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, name, password, logo } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: "bad_request" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "already_exists" });
    const doc = await User.create({ email, name, logo: logo || "", passwordHash: hash(password) });
    res.status(201).json({ userId: String(doc._id), name: doc.name, email: doc.email, logo: doc.logo });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    console.log(`[Login Attempt] Email: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[Login Failed] User not found for email: ${email}`);
      return res.status(401).json({ error: "invalid_credentials" });
    }
    if (user.passwordHash !== hash(password)) {
      console.log(`[Login Failed] Password mismatch for user: ${email}`);
      return res.status(401).json({ error: "invalid_credentials" });
    }
    console.log(`[Login Success] User: ${email}`);
    res.json({ userId: String(user._id), name: user.name, email: user.email, logo: user.logo });
  } catch (e) {
    console.error("[Login Error]", e);
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/auth/upload-logo", uploadLogo.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const url = `/uploads/${req.file.filename}`;
    const absUrl = `${req.protocol}://${req.get("host")}${url}`;
    res.status(201).json({ url: absUrl, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) {
    res.status(400).json({ error: typeof e === "object" && e?.message ? e.message : "upload_error" });
  }
});

router.get("/auth/notifications", async (req, res) => {
  try {
    const userId = req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "unauthorized" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "not_found" });
    // Return most recent first
    const notifs = (user.notifications || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(notifs);
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
