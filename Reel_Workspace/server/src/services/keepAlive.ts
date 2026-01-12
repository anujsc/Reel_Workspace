import cron, { ScheduledTask } from "node-cron";
import axios from "axios";

/**
 * Keep-alive service to prevent Render free tier from spinning down
 * Pings the server every 30 minutes
 */
export class KeepAliveService {
  private static instance: KeepAliveService;
  private cronJob: ScheduledTask | null = null;
  private serverUrl: string;

  private constructor() {
    this.serverUrl =
      process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  }

  static getInstance(): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService();
    }
    return KeepAliveService.instance;
  }

  /**
   * Start the keep-alive cron job
   * Runs every 30 minutes
   */
  start(): void {
    if (this.cronJob) {
      console.log("⚠️  Keep-alive service already running");
      return;
    }

    // Only run in production
    if (process.env.NODE_ENV !== "production") {
      console.log("ℹ️  Keep-alive service disabled in development");
      return;
    }

    // Run every 30 minutes: */30 * * * *
    this.cronJob = cron.schedule("*/30 * * * *", async () => {
      try {
        const response = await axios.get(`${this.serverUrl}/api/health`, {
          timeout: 10000,
        });
        console.log(
          `✅ Keep-alive ping successful at ${new Date().toISOString()}`
        );
        console.log(`   Status: ${response.data.status}`);
      } catch (error) {
        console.error(
          `❌ Keep-alive ping failed at ${new Date().toISOString()}:`,
          error
        );
      }
    });

    console.log("🔄 Keep-alive service started (pinging every 30 minutes)");
    console.log(`   Target URL: ${this.serverUrl}/api/health`);
  }

  /**
   * Stop the keep-alive cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("⏹️  Keep-alive service stopped");
    }
  }
}
