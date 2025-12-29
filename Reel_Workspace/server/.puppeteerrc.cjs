const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Don't download during npm install
  skipDownload: true,

  // Use project directory (persists from build to runtime on Render)
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR || "/opt/render/project/.cache/puppeteer",
};
