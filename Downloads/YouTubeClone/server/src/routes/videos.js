import { Router } from "express";
import mongoose from "mongoose";
import Video from "../models/Video.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

router.use(auth);

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

function fileFilter(req, file, cb) {
  const allowed = ["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("unsupported_file_type"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const url = `/uploads/${req.file.filename}`;
    const absUrl = `${req.protocol}://${req.get("host")}${url}`;
    res.status(201).json({ url: absUrl, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) {
    res.status(400).json({ error: typeof e === "object" && e?.message ? e.message : "upload_error" });
  }
});

router.post("/videos", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    const { title, videoUrl, bannerUrl, visibility, isMuted, category, description, timestamps } = req.body;
    const user = await User.findById(req.user.id).lean().catch(() => null);
    // Normalize timestamps: accept array of {time,label} or newline string
    let ts = [];
    if (Array.isArray(timestamps)) {
      ts = timestamps.filter((t) => t && typeof t.time === "string" && typeof t.label === "string");
    } else if (typeof timestamps === "string") {
      ts = timestamps
        .split("\n")
        .map((line) => {
          const m = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
          return m ? { time: m[1], label: m[2] } : null;
        })
        .filter(Boolean);
    }
    const doc = await Video.create({
      title,
      videoUrl,
      bannerUrl,
      creatorId: new mongoose.Types.ObjectId(req.user.id),
      creatorName: user?.name || "",
      creatorLogo: user?.logo || "",
      description: typeof description === "string" ? description : "",
      timestamps: ts,
      category: (category || "other").toLowerCase(),
      settings: {
        visibility: visibility || "public",
        isMuted: !!isMuted
      }
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.get("/videos", async (req, res) => {
  try {
    const { mine, category } = req.query;
    if (mine === "1") {
      if (!req.user) return res.status(401).json({ error: "unauthorized" });
      const query = { creatorId: req.user.id };
      if (category && category !== "all") query.category = category.toLowerCase();
      const list = await Video.find(query).sort({ createdAt: -1 });
      return res.json(list);
    }
    if (req.user && req.user.isAdmin) {
      const query = {};
      if (category && category !== "all") query.category = category.toLowerCase();
      const list = await Video.find(query).sort({ createdAt: -1 });
      return res.json(list);
    }
    const query = { "settings.isApproved": true };
    if (category && category !== "all") query.category = category.toLowerCase();
    const list = await Video.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/videos/:id", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "not_found" });
    if (String(video.creatorId) !== String(req.user.id)) {
      return res.status(403).json({ error: "forbidden" });
    }
    const { isMuted, visibility, bannerUrl, title, description, category, timestamps } = req.body;
    const updates = {};
    if (typeof isMuted === "boolean") updates["settings.isMuted"] = isMuted;
    if (visibility === "public" || visibility === "private" || visibility === "unlisted") updates["settings.visibility"] = visibility;
    if (typeof bannerUrl === "string") updates["bannerUrl"] = bannerUrl;
    if (typeof title === "string" && title.trim()) updates["title"] = title.trim();
    if (typeof description === "string") updates["description"] = description;
    if (typeof category === "string") {
      const c = category.toLowerCase();
      const allowed = ["music", "gaming", "comedy", "movies", "tech", "travel", "other"];
      if (allowed.includes(c)) updates["category"] = c;
    }
    if (Array.isArray(timestamps)) {
      updates["timestamps"] = timestamps.filter((t) => t && typeof t.time === "string" && typeof t.label === "string");
    } else if (typeof timestamps === "string") {
      const ts = timestamps
        .split("\n")
        .map((line) => {
          const m = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/);
          return m ? { time: m[1], label: m[2] } : null;
        })
        .filter(Boolean);
      updates["timestamps"] = ts;
    }
    const updated = await Video.findByIdAndUpdate(id, { $set: updates }, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.delete("/videos/:id", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "not_found" });
    if (String(video.creatorId) !== String(req.user.id)) {
      return res.status(403).json({ error: "forbidden" });
    }
    await removeFilesForVideo(video);
    await Video.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.patch("/admin/videos/:id/mute-override", async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const { adminMuteOverride } = req.body;
    const updated = await Video.findByIdAndUpdate(
      id,
      { $set: { "settings.adminMuteOverride": !!adminMuteOverride } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.patch("/admin/videos/:id/approve", async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const { isApproved } = req.body;
    const updated = await Video.findByIdAndUpdate(
      id,
      { $set: { "settings.isApproved": !!isApproved } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.patch("/admin/videos/:id/visibility", async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const { visibility } = req.body;
    
    // Find video to get creator info
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "not_found" });

    const updated = await Video.findByIdAndUpdate(
      id,
      { $set: { "settings.visibility": visibility } },
      { new: true }
    );

    // Notify creator if hidden
    if (visibility === "private" && video.creatorId) {
      await User.findByIdAndUpdate(video.creatorId, {
        $push: {
          notifications: {
            message: `Your video "${video.title}" has been hidden by an admin.`,
            date: new Date(),
            read: false
          }
        }
      });
    }

    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.delete("/admin/videos/:id", async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "not_found" });
    await removeFilesForVideo(video);
    await Video.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "bad_request" });
  }
});

router.post("/videos/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Video.findByIdAndUpdate(id, { $inc: { "stats.views": 1 } }, { new: true });
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json({ views: updated.stats?.views || 0 });
  } catch {
    res.status(400).json({ error: "bad_request" });
  }
});
function getLocalPathFromUrl(u) {
  try {
    const rel = new URL(u, "http://localhost").pathname; // safe parse
    const base = path.basename(rel);
    return path.join(uploadDir, base);
  } catch {
    return null;
  }
}

async function removeFilesForVideo(video) {
  const fs = await import("fs");
  const items = [];
  if (video.videoUrl) {
    const p = getLocalPathFromUrl(video.videoUrl);
    if (p) items.push(p);
  }
  if (video.bannerUrl) {
    const p = getLocalPathFromUrl(video.bannerUrl);
    if (p) items.push(p);
  }
  for (const p of items) {
    try {
      await fs.promises.unlink(p);
    } catch {}
  }
}
export default router;
