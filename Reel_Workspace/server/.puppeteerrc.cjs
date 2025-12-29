const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Don't download during npm install (we do it in build script)
  skipDownload: true,

  // Use Render's persistent cache directory
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR || "/opt/render/.cache/puppeteer",
};
