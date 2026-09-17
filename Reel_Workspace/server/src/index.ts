import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import { authRoutes } from "./routes/auth.routes.js";
import { reelRoutes } from "./routes/reel.routes.js";
import { folderRoutes } from "./routes/folder.routes.js";
import { searchRoutes } from "./routes/search.routes.js";
import { shareRoutes } from "./routes/share.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { KeepAliveService } from "./services/keepAlive.js";

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL?.trim();

// Security Middleware
app.use(helmet());

// CORS Middleware
const allowedOrigins = [
  clientUrl,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      clientUrl: process.env.CLIENT_URL || "not set",
      allowedOrigins,
    },
  });
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Reel Workspace API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      reel: "/api/reel",
      folders: "/api/folders",
      search: "/api/search",
      share: "/api/share",
      chat: "/api/chat",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reel", reelRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/chat", chatRoutes);

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

/**
 * Start the server and connect to database
 */
const startServer = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      const requiredEnvironment = ["CLIENT_URL", "SERVER_URL"];
      if (process.env.USE_SOCIALKIT !== "false") {
        requiredEnvironment.push("SOCIALKIT_ACCESS_KEY");
      }

      const missingEnvironment = requiredEnvironment.filter(
        (name) => !process.env[name]?.trim(),
      );
      if (missingEnvironment.length > 0) {
        throw new Error(
          `Missing production environment variables: ${missingEnvironment.join(", ")}`,
        );
      }
    }

    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔗 Health check: ${process.env.SERVER_URL?.replace(/\/$/, "") || "[SERVER_URL not configured]"}/api/health`,
      );

      // Start keep-alive service in production
      const keepAlive = KeepAliveService.getInstance();
      keepAlive.start();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully...");
  const keepAlive = KeepAliveService.getInstance();
  keepAlive.stop();
  console.log("[Shutdown] Complete");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("⚠️  SIGINT received, shutting down gracefully...");
  const keepAlive = KeepAliveService.getInstance();
  keepAlive.stop();
  console.log("[Shutdown] Complete");
  process.exit(0);
});

// Start the server
startServer();

// Memory monitoring for Render free tier
if (process.env.NODE_ENV === "production") {
  console.log("🔍 Memory monitoring enabled for production");

  setInterval(() => {
    const used = process.memoryUsage();
    const mbUsed = Math.round(used.heapUsed / 1024 / 1024);
    const mbTotal = Math.round(used.heapTotal / 1024 / 1024);
    const mbRss = Math.round(used.rss / 1024 / 1024);

    console.log(
      `[Memory] Heap: ${mbUsed}/${mbTotal}MB | RSS: ${mbRss}MB | External: ${Math.round(used.external / 1024 / 1024)}MB`,
    );

    // Warning if approaching limit (512MB total on Render free tier)
    if (mbRss > 400) {
      console.warn(
        `⚠️  Memory usage high: ${mbRss}MB / 512MB - Consider restarting or optimizing`,
      );
    }

    // Critical warning
    if (mbRss > 450) {
      console.error(
        `🚨 CRITICAL: Memory usage very high: ${mbRss}MB / 512MB - Crash imminent!`,
      );
    }
  }, 60000); // Log every minute
}
