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

  /**
   * Get or create browser instance
   */
  async getBrowser(): Promise<Browser> {
    // Return existing connected browser
    if (this.browser && this.browser.isConnected()) {
      console.log(`[BrowserPool] Reusing existing browser instance`);
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
   * Launch a new browser instance with optimized settings
   */
  private async launchBrowser(): Promise<Browser> {
    this.launching = true;
    this.launchAttempts++;

    try {
      console.log(
        `[BrowserPool] Launching browser (attempt ${this.launchAttempts})...`
      );

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

          // Existing optimizations
          "--disable-accelerated-2d-canvas",
          "--window-size=1280,720",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-blink-features=AutomationControlled",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      };

      // Determine Chrome executable path
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      } else if (process.env.CHROME_PATH) {
        launchOptions.executablePath = process.env.CHROME_PATH;
      }

      this.browser = await puppeteer.launch(launchOptions);

      // Handle unexpected disconnections
      this.browser.on("disconnected", () => {
        console.warn(`[BrowserPool] Browser disconnected unexpectedly`);
        this.browser = null;
        this.launchAttempts = 0;
      });

      console.log(`[BrowserPool] ✓ Browser launched successfully`);
      this.launchAttempts = 0;
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
          }`
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
        err instanceof Error ? err.message : err
      );
    }
  }

  /**
   * Shutdown the browser pool (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
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
