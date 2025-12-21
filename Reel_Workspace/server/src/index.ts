import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import { authRoutes } from "./routes/auth.routes.js";
import { testRoutes } from "./routes/test.routes.js";
import { reelRoutes } from "./routes/reel.routes.js";
import { folderRoutes } from "./routes/folder.routes.js";
import { searchRoutes } from "./routes/search.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

// CORS Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? "*"
        : process.env.ALLOWED_ORIGINS,
    credentials: true,
  })
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
      test: "/api/test",
      reel: "/api/reel",
      folders: "/api/folders",
      search: "/api/search",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/reel", reelRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/search", searchRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

/**
 * Start the server and connect to database
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("⚠️  SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
