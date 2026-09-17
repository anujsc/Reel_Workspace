import dns from "node:dns";
import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Connect to MongoDB with retry logic
 * @returns Promise<void>
 */
export const connectDB = async (): Promise<void> => {
  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI is required");
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 5, // Reduced from default 10 for Render free tier
        minPoolSize: 1, // Keep minimum connections
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        family: 4, // Use IPv4, skip IPv6 lookup
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database Name: ${conn.connection.name}`);

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });

      return;
    } catch (error) {
      retries++;
      console.error(
        `❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed:`,
      );

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      } else {
        console.error(error);
      }

      if (retries < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error("❌ Max retries reached. Could not connect to MongoDB.");
        throw error;
      }
    }
  }
};

/**
 * Disconnect from MongoDB
 * @returns Promise<void>
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    throw error;
  }
};
