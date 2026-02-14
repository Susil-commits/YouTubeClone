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
import serverless from "serverless-http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setDefaultResultOrder("ipv4first");

const app = express();

// Configure CORS to allow the frontend origin(s).
// Set `FRONTEND_URL` to your Vercel frontend URL (e.g. https://your-frontend.vercel.app).
// Optionally set `ADDITIONAL_ORIGINS` or `FRONTEND_URLS` as a comma-separated list.
// Always allow local dev origin `http://localhost:5173` so local Vite dev works.
const frontEndUrl = process.env.FRONTEND_URL || "";
const additional = process.env.ADDITIONAL_ORIGINS || "";
// New: FRONTEND_URLS can contain multiple comma-separated origins (useful for preview domains)
const frontendUrls = process.env.FRONTEND_URLS || "";
const allowedOrigins = ["http://localhost:5173"];
if (frontEndUrl) allowedOrigins.push(frontEndUrl);
if (additional) allowedOrigins.push(...additional.split(",").map(s => s.trim()).filter(Boolean));
if (frontendUrls) allowedOrigins.push(...frontendUrls.split(",").map(s => s.trim()).filter(Boolean));
// Always allow the known Vercel frontend domain for this project
const VERCEL_FRONTEND = "https://you-tube-clone-pj-phs1.vercel.app";
if (!allowedOrigins.includes(VERCEL_FRONTEND)) allowedOrigins.push(VERCEL_FRONTEND);

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    // if no allowed origins configured, allow any (useful for dev)
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"), false);
  },
  // Allow cookies/credentials across the Vercel frontend <> backend domains
  credentials: true,
  // Some clients may require a successful OPTIONS status other than 204
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Helpful debug middleware: logs origin and path for incoming requests
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

    // Use cached connection in serverless environments to avoid connection churn
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
// Only attempt to connect if we don't already have a cached connection/promise.
if (!globalThis._mongoose || (!globalThis._mongoose.conn && !globalThis._mongoose.promise)) {
  // Start Mongo connection asynchronously so it cannot block startup.
  // Using setImmediate ensures the call happens after the current event loop turn.
  setImmediate(() => connectMongoWithRetry());
}

// Recommended cookie options for production (Vercel frontend + backend)
export const COOKIE_OPTIONS = {
  httpOnly: true,
  // Force secure and sameSite none in production so cookies work across domains on Vercel
  secure: true,
  sameSite: "none",
  // domain can be set to your root domain if needed, e.g. ".example.com"
  // domain: process.env.COOKIE_DOMAIN || undefined,
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

// Simple root health route so the base URL (/) returns a friendly message
// Simple root health route — explicit 200 helps Render health checks
app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// In serverless deployments (Vercel) we do not call `app.listen` here.
// When running locally for development, use `npm run dev` which uses nodemon.

export default app;

// Export a serverless handler for Vercel / other serverless platforms
export const handler = serverless(app);

// Provide a CommonJS fallback so that builders or adapters expecting
// `module.exports = app` will still work. This is a no-op in pure ESM
// environments because `module` is undefined there.
if (typeof module !== "undefined" && module?.exports) {
  module.exports = app;
}

// If we're running on a traditional Node host (Render, Heroku, etc.)
// we must bind to a port so the platform's load balancer can route traffic.
// On Vercel (serverless) we _do not_ start a listener.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || "0.0.0.0";
  const server = app.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`);
  });
  server.on("error", (err) => {
    console.error("Server error", err);
    // Exit so the platform can restart the service if necessary
    process.exit(1);
  });
}
