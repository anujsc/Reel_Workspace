import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import {
  InvalidInstagramUrlError,
  MediaNotFoundError,
  PrivateMediaError,
} from "../utils/errors.js";
import { InstagramMediaResult } from "./instagramFetcher.js";
import { browserPool } from "./browserPool.js";

/**
 * Puppeteer-based Instagram scraper configuration
 */
interface ScraperConfig {
  headless: boolean;
  timeout: number;
  userAgent: string;
  executablePath?: string;
}

const DEFAULT_CONFIG: ScraperConfig = {
  headless: true,
  timeout: 60000, // Increased to 60 seconds
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  executablePath: undefined,
};

/**
 * Instagram Puppeteer Scraper Service
 * Scrapes Instagram reels directly using headless browser
 */
export class InstagramPuppeteerScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const launchOptions: any = {
      headless: this.config.headless ? "new" : false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    };

    // Priority order for finding Chrome:
    // 1. Custom config executablePath
    // 2. PUPPETEER_EXECUTABLE_PATH env (standard Puppeteer env var)
    // 3. CHROME_PATH env (alternative)
    // 4. Let Puppeteer auto-detect from cache
    if (this.config.executablePath) {
      console.log(
        `[Puppeteer] Using custom Chromium at: ${this.config.executablePath}`
      );
      launchOptions.executablePath = this.config.executablePath;
    } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      console.log(
        `[Puppeteer] Using Chromium from PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`
      );
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (process.env.CHROME_PATH) {
      console.log(
        `[Puppeteer] Using system Chromium from CHROME_PATH: ${process.env.CHROME_PATH}`
      );
      launchOptions.executablePath = process.env.CHROME_PATH;
    } else {
      console.log(
        `[Puppeteer] Using auto-detected Chrome from cache: ${
          process.env.PUPPETEER_CACHE_DIR || "~/.cache/puppeteer"
        }`
      );
      // Let Puppeteer find Chrome in its cache directory
    }

    try {
      console.log(`[Puppeteer] Launching browser with options:`, {
        headless: launchOptions.headless,
        executablePath: launchOptions.executablePath || "auto-detect",
        cacheDir: process.env.PUPPETEER_CACHE_DIR || "default",
        argsCount: launchOptions.args.length,
      });

      this.browser = await puppeteer.launch(launchOptions);
      console.log(`[Puppeteer] ✓ Browser launched successfully`);
      return this.browser;
    } catch (error) {
      console.error(`[Puppeteer Scraper] Failed to launch browser:`, error);
      throw new MediaNotFoundError(
        `Failed to launch browser: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extract video URL from Instagram page using Puppeteer
   */
  async scrapeInstagramReel(url: string): Promise<InstagramMediaResult> {
    console.log(`[Puppeteer Scraper] Starting scrape for: ${url}`);
    const perfStart = Date.now();

    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport for faster rendering (reduced resolution)
      await page.setViewport({ width: 1280, height: 720 });

      // Enhanced stealth: Set user agent
      await page.setUserAgent(this.config.userAgent);

      // Set extra headers to look more like a real browser
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      });

      // OPTIMIZATION: Enable request interception to block unnecessary resources
      await page.setRequestInterception(true);
      
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        // Block images, stylesheets, fonts, media (we only need HTML/scripts)
        if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
          request.abort();
        }
        // Block third-party analytics/tracking
        else if (
          url.includes("analytics") ||
          url.includes("ads") ||
          url.includes("tracking") ||
          url.includes("doubleclick") ||
          url.includes("facebook.com/tr") ||
          url.includes("google-analytics")
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Navigate to Instagram URL with optimized wait condition
      console.log(`[Puppeteer Scraper] Navigating to URL...`);
      const navStart = Date.now();
      await page.goto(url, {
        waitUntil: "domcontentloaded", // Don't wait for all network activity
        timeout: 15000, // Reduced from 60s to 15s
      });
      console.log(`[Puppeteer Scraper] Navigation: ${Date.now() - navStart}ms`);

      // Reduced wait time for dynamic content
      console.log(`[Puppeteer Scraper] Waiting for content...`);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Reduced from 1500ms

      // Check if page requires login (private account)
      const isLoginRequired = await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const doc = document as any;
        return (
          doc.body.innerText.includes("Log in to see photos") ||
          doc.body.innerText.includes("This account is private")
        );
      });

      if (isLoginRequired) {
        throw new PrivateMediaError(
          "This content is private or requires login"
        );
      }

      // Method 1: Try to extract video URL from page scripts first (most reliable)
      console.log(`[Puppeteer Scraper] Looking for video URL in scripts...`);
      const scriptVideo = await this.extractFromScripts(page);
      if (scriptVideo && !scriptVideo.videoUrl.startsWith("blob:")) {
        console.log(`[Puppeteer Scraper] ✓ Found video URL via scripts`);
        return scriptVideo;
      }

      // Method 2: Try JSON-LD
      console.log(`[Puppeteer Scraper] Trying JSON-LD extraction...`);
      const jsonLdVideo = await this.extractFromJsonLd(page);
      if (jsonLdVideo && !jsonLdVideo.videoUrl.startsWith("blob:")) {
        console.log(`[Puppeteer Scraper] ✓ Found video URL via JSON-LD`);
        return jsonLdVideo;
      }

      // Method 3: Try to find video element (may return blob URL)
      console.log(`[Puppeteer Scraper] Looking for video element...`);
      const videoUrl = await page.evaluate(() => {
        // @ts-ignore - document is available in browser context
        const doc = document as any;
        const videoElement = doc.querySelector("video");
        if (
          videoElement &&
          videoElement.src &&
          !videoElement.src.startsWith("blob:")
        ) {
          return videoElement.src;
        }

        // Try to find video in source tags
        const sourceElement = doc.querySelector("video source");
        if (sourceElement && sourceElement.getAttribute("src")) {
          const src = sourceElement.getAttribute("src");
          if (!src.startsWith("blob:")) {
            return src;
          }
        }

        return null;
      });

      if (videoUrl) {
        console.log(`[Puppeteer Scraper] ✓ Found video URL via DOM`);

        // Extract additional metadata
        const metadata = await this.extractMetadata(page);

        return {
          sourceUrl: url,
          videoUrl,
          ...metadata,
        };
      }

      // Method 4: Parse page HTML with Cheerio (last resort)
      console.log(`[Puppeteer Scraper] Trying Cheerio parsing...`);
      const html = await page.content();
      const $ = cheerio.load(html);

      // Look for video tags
      const videoSrc = $("video").attr("src") || $("video source").attr("src");

      if (videoSrc && !videoSrc.startsWith("blob:")) {
        console.log(`[Puppeteer Scraper] ✓ Found video URL via Cheerio`);
        const metadata = await this.extractMetadata(page);

        return {
          sourceUrl: url,
          videoUrl: videoSrc,
          ...metadata,
        };
      }

      throw new MediaNotFoundError(
        "Could not find video URL in page content (all methods exhausted)"
      );
    } catch (error) {
      if (
        error instanceof PrivateMediaError ||
        error instanceof MediaNotFoundError
      ) {
        throw error;
      }

      console.error(`[Puppeteer Scraper] Error:`, error);
      throw new MediaNotFoundError(
        `Failed to scrape Instagram reel: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      const totalTime = Date.now() - perfStart;
      console.log(`[Puppeteer Scraper] Total scrape time: ${totalTime}ms`);
      await page.close();
    }
  }

  /**
   * Extract metadata from page
   */
  private async extractMetadata(
    page: Page
  ): Promise<Partial<InstagramMediaResult>> {
    return await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const doc = document as any;
      const metadata: Partial<any> = {};

      // Try to get title from meta tags
      const titleMeta =
        doc.querySelector('meta[property="og:title"]') ||
        doc.querySelector('meta[name="title"]');
      if (titleMeta) {
        metadata.title = titleMeta.getAttribute("content") || undefined;
      }

      // Try to get description
      const descMeta =
        doc.querySelector('meta[property="og:description"]') ||
        doc.querySelector('meta[name="description"]');
      if (descMeta) {
        metadata.description = descMeta.getAttribute("content") || undefined;
      }

      // Try to get thumbnail
      const thumbMeta =
        doc.querySelector('meta[property="og:image"]') ||
        doc.querySelector('meta[name="thumbnail"]');
      if (thumbMeta) {
        metadata.thumbnailUrl = thumbMeta.getAttribute("content") || undefined;
      }

      // Try to get video duration
      const videoElement = doc.querySelector("video");
      if (videoElement && videoElement.duration) {
        metadata.durationSeconds = Math.floor(videoElement.duration);
      }

      return metadata;
    });
  }

  /**
   * Extract video URL from JSON-LD structured data
   */
  private async extractFromJsonLd(
    page: Page
  ): Promise<InstagramMediaResult | null> {
    return await page.evaluate(() => {
      // @ts-ignore - document and window are available in browser context
      const doc = document as any;
      // @ts-ignore
      const win = window as any;
      const scripts = Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      );

      for (const script of scripts) {
        try {
          const data = JSON.parse((script as any).textContent || "");

          if (data["@type"] === "VideoObject" && data.contentUrl) {
            return {
              sourceUrl: win.location.href,
              videoUrl: data.contentUrl,
              title: data.name || undefined,
              description: data.description || undefined,
              thumbnailUrl: data.thumbnailUrl || undefined,
              durationSeconds: data.duration
                ? parseInt(data.duration.replace(/\D/g, ""))
                : undefined,
            };
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }

      return null;
    });
  }

  /**
   * Extract video URL from inline scripts
   */
  private async extractFromScripts(
    page: Page
  ): Promise<InstagramMediaResult | null> {
    return await page.evaluate(() => {
      // @ts-ignore - document and window are available in browser context
      const doc = document as any;
      // @ts-ignore
      const win = window as any;
      const scripts = Array.from(doc.querySelectorAll("script"));

      for (const script of scripts) {
        const content = (script as any).textContent || "";

        // Pattern 1: Look for video_url in Instagram's data
        const videoUrlMatch = content.match(
          /"video_url":"([^"]+)"|'video_url':'([^']+)'/
        );
        if (videoUrlMatch) {
          const videoUrl = videoUrlMatch[1] || videoUrlMatch[2];
          // Skip blob URLs
          if (videoUrl.startsWith("blob:")) continue;

          // Unescape the URL
          const unescapedUrl = videoUrl
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");

          return {
            sourceUrl: win.location.href,
            videoUrl: unescapedUrl,
          };
        }

        // Pattern 2: Look for src patterns with .mp4
        const srcMatch = content.match(/"src":"(https:\/\/[^"]+\.mp4[^"]*)"/);
        if (srcMatch) {
          const videoUrl = srcMatch[1]
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");
          if (!videoUrl.startsWith("blob:")) {
            return {
              sourceUrl: win.location.href,
              videoUrl,
            };
          }
        }

        // Pattern 3: Look for video_versions array (Instagram API format)
        const videoVersionsMatch = content.match(
          /"video_versions":\[([^\]]+)\]/
        );
        if (videoVersionsMatch) {
          const versionsStr = videoVersionsMatch[1];
          const urlMatch = versionsStr.match(/"url":"([^"]+)"/);
          if (urlMatch) {
            const videoUrl = urlMatch[1]
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/");
            if (!videoUrl.startsWith("blob:")) {
              return {
                sourceUrl: win.location.href,
                videoUrl,
              };
            }
          }
        }

        // Pattern 4: Look for playback_url
        const playbackMatch = content.match(/"playback_url":"([^"]+)"/);
        if (playbackMatch) {
          const videoUrl = playbackMatch[1]
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");
          if (!videoUrl.startsWith("blob:")) {
            return {
              sourceUrl: win.location.href,
              videoUrl,
            };
          }
        }

        // Pattern 5: Look for contentUrl in JSON-LD within scripts
        const contentUrlMatch = content.match(
          /"contentUrl":"(https:\/\/[^"]+)"/
        );
        if (contentUrlMatch) {
          const videoUrl = contentUrlMatch[1]
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");
          if (!videoUrl.startsWith("blob:")) {
            return {
              sourceUrl: win.location.href,
              videoUrl,
            };
          }
        }
      }

      return null;
    });
  }
}

/**
 * Fetch Instagram media using Puppeteer scraper with browser pooling
 */
export async function fetchInstagramMediaWithPuppeteer(
  url: string
): Promise<InstagramMediaResult> {
  // Use browser pool instead of creating new instance
  const page = await browserPool.getNewPage();

  try {
    // Set viewport for faster rendering
    await page.setViewport({ width: 1280, height: 720 });

    // Set user agent
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    await page.setUserAgent(userAgent);

    // Set extra headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    // OPTIMIZATION: Enable request interception
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const reqUrl = request.url();

      // Block unnecessary resources
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        request.abort();
      } else if (
        reqUrl.includes("analytics") ||
        reqUrl.includes("ads") ||
        reqUrl.includes("tracking") ||
        reqUrl.includes("doubleclick") ||
        reqUrl.includes("facebook.com/tr")
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate with optimized settings
    console.log(`[Puppeteer] Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Reduced wait time
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check for private content
    const isLoginRequired = await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const doc = document as any;
      return (
        doc.body.innerText.includes("Log in to see photos") ||
        doc.body.innerText.includes("This account is private")
      );
    });

    if (isLoginRequired) {
      throw new PrivateMediaError(
        "This content is private or requires login"
      );
    }

    // Create scraper instance to use extraction methods
    const scraper = new InstagramPuppeteerScraper();

    // Try extraction methods
    const scriptVideo = await scraper["extractFromScripts"](page);
    if (scriptVideo && !scriptVideo.videoUrl.startsWith("blob:")) {
      return scriptVideo;
    }

    const jsonLdVideo = await scraper["extractFromJsonLd"](page);
    if (jsonLdVideo && !jsonLdVideo.videoUrl.startsWith("blob:")) {
      return jsonLdVideo;
    }

    const videoUrl = await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const doc = document as any;
      const videoElement = doc.querySelector("video");
      if (
        videoElement &&
        videoElement.src &&
        !videoElement.src.startsWith("blob:")
      ) {
        return videoElement.src;
      }

      const sourceElement = doc.querySelector("video source");
      if (sourceElement && sourceElement.getAttribute("src")) {
        const src = sourceElement.getAttribute("src");
        if (src && !src.startsWith("blob:")) {
          return src;
        }
      }

      return null;
    });

    if (videoUrl) {
      const metadata = await scraper["extractMetadata"](page);
      return {
        sourceUrl: url,
        videoUrl,
        ...metadata,
      };
    }

    throw new MediaNotFoundError("Could not find video URL");
  } finally {
    await browserPool.closePage(page);
  }
}
