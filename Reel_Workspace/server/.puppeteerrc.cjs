const { join } = require("path");
const { homedir } = require("os");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Don't download during npm install (we do it in build script)
  skipDownload: true,

  // Use home directory cache (Render allows this)
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR || join(homedir(), ".cache", "puppeteer"),
};
