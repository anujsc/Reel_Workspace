import puppeteer, { Browser, Page } from "puppeteer";

/**
 * Browser Pool Service
 *
 * Maintains a single browser instance across requests to avoid
 * expensive browser launch overhead (~2-3s per launch).
 *
 * Key benefits:
 * - Reuses browser instance (saves 2-3s per request)
 * - Creates new pages for each request (isolated contexts)
 * - Handles browser disconnections gracefully
 * - Thread-safe with launching flag
 */
class BrowserPool {
  private browser: Browser | null = null;
  private launching: boolean = false;
  private launchAttempts: number = 0;
  private readonly MAX_LAUNCH_ATTEMPTS = 3;
  private idleTimeout: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create browser instance
   */
  async getBrowser(): Promise<Browser> {
    // Clear idle timeout when browser is used
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    // Return existing connected browser
    if (this.browser && this.browser.isConnected()) {
      console.log(`[BrowserPool] Reusing existing browser instance`);
      this.scheduleIdleShutdown();
      return this.browser;
    }

    // Wait if another request is launching
    if (this.launching) {
      console.log(`[BrowserPool] Waiting for ongoing browser launch...`);
      await this.waitForLaunch();
      return this.getBrowser();
    }

    // Launch new browser
    return await this.launchBrowser();
  }

  /**
   * Schedule browser shutdown after idle period
   */
  private scheduleIdleShutdown(): void {
    this.idleTimeout = setTimeout(async () => {
      console.log(
        `[BrowserPool] Browser idle for ${this.IDLE_TIMEOUT_MS / 1000}s, shutting down to save memory...`,
      );
      await this.shutdown();
    }, this.IDLE_TIMEOUT_MS);
  }

  /**
   * Launch a new browser instance with optimized settings
   */
  private async launchBrowser(): Promise<Browser> {
    this.launching = true;
    this.launchAttempts++;

    try {
      console.log(
        `[BrowserPool] Launching browser (attempt ${this.launchAttempts})...`,
      );

      const isProduction = process.env.NODE_ENV === "production";
      const isWindows = process.platform === "win32";

      const launchOptions: any = {
        headless: "new",
        args: [
          // Essential args for stability
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",

          // Performance optimizations (safe ones)
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--no-first-run",

          // Memory optimizations - only for production Linux
          ...(isProduction && !isWindows
            ? ["--single-process", "--no-zygote"]
            : []),

          // Existing optimizations
          "--disable-accelerated-2d-canvas",
          "--window-size=1280,720",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-blink-features=AutomationControlled",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",

          // Additional stability args for Windows
          ...(isWindows
            ? [
                "--disable-features=VizDisplayCompositor",
                "--disable-features=RendererCodeIntegrity",
              ]
            : []),
        ],
        // Increase timeout for slower systems
        timeout: 60000,
      };

      // Determine Chrome executable path
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        console.log(
          `[BrowserPool] Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`,
        );
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      } else if (process.env.CHROME_PATH) {
        console.log(
          `[BrowserPool] Using CHROME_PATH: ${process.env.CHROME_PATH}`,
        );
        launchOptions.executablePath = process.env.CHROME_PATH;
      } else {
        console.log(`[BrowserPool] Using Puppeteer bundled Chromium`);
      }

      this.browser = await puppeteer.launch(launchOptions);

      // Handle unexpected disconnections
      this.browser.on("disconnected", () => {
        console.warn(`[BrowserPool] Browser disconnected unexpectedly`);
        this.browser = null;
        this.launchAttempts = 0;
        if (this.idleTimeout) {
          clearTimeout(this.idleTimeout);
          this.idleTimeout = null;
        }
      });

      console.log(`[BrowserPool] ✓ Browser launched successfully`);
      this.launchAttempts = 0;
      this.scheduleIdleShutdown();
      return this.browser;
    } catch (error) {
      console.error(`[BrowserPool] Failed to launch browser:`, error);

      if (this.launchAttempts >= this.MAX_LAUNCH_ATTEMPTS) {
        this.launchAttempts = 0;
        throw new Error(
          `Failed to launch browser after ${
            this.MAX_LAUNCH_ATTEMPTS
          } attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }

      // Retry after delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.launchBrowser();
    } finally {
      this.launching = false;
    }
  }

  /**
   * Wait for ongoing browser launch to complete
   */
  private async waitForLaunch(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    while (this.launching && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (waited >= maxWait) {
      throw new Error("Browser launch timeout");
    }
  }

  /**
   * Get a new page from the browser pool
   */
  async getNewPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    console.log(`[BrowserPool] Created new page`);
    return page;
  }

  /**
   * Close a page (not the browser)
   */
  async closePage(page: Page): Promise<void> {
    try {
      await page.close();
      console.log(`[BrowserPool] Closed page`);
    } catch (err) {
      console.error(
        `[BrowserPool] Error closing page:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  /**
   * Shutdown the browser pool (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    if (this.browser) {
      console.log(`[BrowserPool] Shutting down browser...`);
      try {
        await this.browser.close();
        this.browser = null;
        console.log(`[BrowserPool] ✓ Browser closed`);
      } catch (error) {
        console.error(`[BrowserPool] Error during shutdown:`, error);
      }
    }
  }

  /**
   * Get pool status for monitoring
   */
  getStatus(): { connected: boolean; launching: boolean } {
    return {
      connected: this.browser?.isConnected() ?? false,
      launching: this.launching,
    };
  }
}

// Export singleton instance
export const browserPool = new BrowserPool();
