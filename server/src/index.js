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
app.use(cors());
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
connectMongoWithRetry();

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let port = Number(process.env.PORT || 4000);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const next = port + 1;
      console.warn(`Port ${port} in use, retrying on ${next}...`);
      port = next;
      setTimeout(() => {
        app.listen(port, () => {
          console.log(`Server listening on port ${port}`);
        });
      }, 500);
    } else {
      console.error("Server error", err);
    }
  });
}

export default app;
