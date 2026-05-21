import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import videosRouter from "./routes/videos.js";
import authRouter from "./routes/auth.js";
import uploadsRouter from "./routes/uploads.js";
import dns from "dns";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder("ipv4first");

const app = express();

// CORS: allow the Vercel frontend origin (and any additional origins)
const frontEndUrl = process.env.FRONTEND_URL || "";
const additional = process.env.ADDITIONAL_ORIGINS || "";
const frontendUrls = process.env.FRONTEND_URLS || "";
const allowedOrigins = ["http://localhost:5173"];
if (frontEndUrl) allowedOrigins.push(frontEndUrl);
if (additional) allowedOrigins.push(...additional.split(",").map(s => s.trim()).filter(Boolean));
if (frontendUrls) allowedOrigins.push(...frontendUrls.split(",").map(s => s.trim()).filter(Boolean));

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"), false);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  try {
    const origin = req.get("origin") || "-";
    console.log(`[REQ] ${req.method} ${req.path} Origin: ${origin}`);
  } catch (e) {}
  next();
});
app.use(express.json());
app.use(morgan("dev"));

const mongoUri = process.env.MONGODB_URI || null;
const fallbackLocalUri = process.env.MONGODB_FALLBACK_URI || "mongodb://127.0.0.1:27017/youtube_clone";

async function connectMongoWithRetry(retry = 0, useFallback = false) {
  try {
    const uri = useFallback ? fallbackLocalUri : mongoUri || fallbackLocalUri;

    // Use cached connection to avoid reconnecting on each request
    if (globalThis._mongoose && globalThis._mongoose.conn) {
      console.log("Using cached MongoDB connection");
      return;
    }
    if (globalThis._mongoose && globalThis._mongoose.promise) {
      await globalThis._mongoose.promise;
      return;
    }

    const opts = {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true
    };

    const connectPromise = mongoose.connect(uri, opts).then((m) => {
      globalThis._mongoose = { conn: m, promise: null };
      return m;
    }).catch((e) => {
      globalThis._mongoose = { conn: null, promise: null };
      throw e;
    });

    globalThis._mongoose = { conn: null, promise: connectPromise };
    await connectPromise;
    console.log(`MongoDB connected${useFallback ? " (fallback)" : ""}`);
  } catch (err) {
    console.error("MongoDB connection error", err);
    const next = Math.min(30000, 2000 * Math.pow(2, retry));
    const willFallback = !useFallback && String(err?.code || "").toUpperCase() === "ECONNREFUSED" && Boolean(mongoUri);
    console.log(`Retrying MongoDB connection in ${Math.round(next / 1000)}s...${willFallback ? " using local fallback" : ""}`);
    setTimeout(() => connectMongoWithRetry(retry + 1, willFallback || useFallback), next);
  }
}

// Start Mongo connection (traditional server — connection persists for lifetime of process)
if (!globalThis._mongoose || (!globalThis._mongoose.conn && !globalThis._mongoose.promise)) {
  setImmediate(() => connectMongoWithRetry());
}

// Cookie options for cross-domain (Vercel frontend → Render backend)
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 1000 * 60 * 60 * 24 * 7
};

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected (event)");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error (event)", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

app.use("/api", videosRouter);
app.use("/api", authRouter);
app.use("/api", uploadsRouter);

app.get("/api/health", (req, res) => {
  res.json({
    db_ready_state: mongoose.connection.readyState,
    ok: mongoose.connection.readyState === 1
  });
});

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

// Serve uploaded files from the local uploads directory
const uploadsStaticDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsStaticDir));

export default app;

// CommonJS fallback
if (typeof module !== "undefined" && module?.exports) {
  module.exports = app;
}

// Render / traditional Node host: always bind to a port
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";
const server = app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
});
server.on("error", (err) => {
  console.error("Server error", err);
  process.exit(1);
});
