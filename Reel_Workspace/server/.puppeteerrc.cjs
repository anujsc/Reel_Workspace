const { join } = require("path");
const { homedir } = require("os");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Download Chromium during npm install
  skipDownload: false,

  // Use Render's cache directory
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR || join(homedir(), ".cache", "puppeteer"),
};
