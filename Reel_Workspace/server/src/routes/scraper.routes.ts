import { Router, Request, Response } from "express";
import { fetchInstagramMediaWithPuppeteer } from "../services/puppeteerScraper.js";
import { fetchInstagramMediaWithYtDlp } from "../services/ytdlpFetcher.js";
import { fetchInstagramMedia } from "../services/instagramFetcher.js";
import { fetchInstagramMediaWithInstaLoader } from "../services/instaLoaderScraper.js";

const router = Router();

/**
 * Test Puppeteer scraper directly
 * GET /api/scraper/puppeteer?url=<instagram_url>
 */
router.get("/puppeteer", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(`[Scraper API] Testing Puppeteer scraper for: ${url}`);

    const result = await fetchInstagramMediaWithPuppeteer(url);

    res.json({
      success: true,
      method: "puppeteer",
      data: result,
    });
  } catch (error) {
    console.error(`[Scraper API] Puppeteer error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Test yt-dlp scraper directly
 * GET /api/scraper/ytdlp?url=<instagram_url>
 */
router.get("/ytdlp", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(`[Scraper API] Testing yt-dlp scraper for: ${url}`);

    const result = await fetchInstagramMediaWithYtDlp(url);

    res.json({
      success: true,
      method: "ytdlp",
      data: result,
    });
  } catch (error) {
    console.error(`[Scraper API] yt-dlp error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Test InstaLoader scraper directly (lightweight, no browser)
 * GET /api/scraper/instaload?url=<instagram_url>
 */
router.get("/instaload", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(`[Scraper API] Testing InstaLoader scraper for: ${url}`);

    const result = await fetchInstagramMediaWithInstaLoader(url);

    res.json({
      success: true,
      method: "instaload",
      data: result,
    });
  } catch (error) {
    console.error(`[Scraper API] InstaLoader error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Test auto scraper (uses configured priority)
 * GET /api/scraper/auto?url=<instagram_url>
 */
router.get("/auto", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(`[Scraper API] Testing auto scraper for: ${url}`);

    const result = await fetchInstagramMedia(url);

    res.json({
      success: true,
      method: "auto",
      data: result,
    });
  } catch (error) {
    console.error(`[Scraper API] Auto scraper error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Compare all scraping methods
 * GET /api/scraper/compare?url=<instagram_url>
 */
router.get("/compare", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }

    console.log(`[Scraper API] Comparing all methods for: ${url}`);

    const results: any = {
      url,
      methods: {},
    };

    // Test Puppeteer
    try {
      const startTime = Date.now();
      const puppeteerResult = await fetchInstagramMediaWithPuppeteer(url);
      const duration = Date.now() - startTime;

      results.methods.puppeteer = {
        success: true,
        duration: `${duration}ms`,
        data: puppeteerResult,
      };
    } catch (error) {
      results.methods.puppeteer = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Test InstaLoader
    try {
      const startTime = Date.now();
      const instaloaderResult = await fetchInstagramMediaWithInstaLoader(url);
      const duration = Date.now() - startTime;

      results.methods.instaload = {
        success: true,
        duration: `${duration}ms`,
        data: instaloaderResult,
      };
    } catch (error) {
      results.methods.instaload = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Test yt-dlp
    try {
      const startTime = Date.now();
      const ytdlpResult = await fetchInstagramMediaWithYtDlp(url);
      const duration = Date.now() - startTime;

      results.methods.ytdlp = {
        success: true,
        duration: `${duration}ms`,
        data: ytdlpResult,
      };
    } catch (error) {
      results.methods.ytdlp = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(`[Scraper API] Compare error:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
