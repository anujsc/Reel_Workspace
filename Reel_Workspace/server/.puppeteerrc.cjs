const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Don't download during npm install
  skipDownload: true,

  // Use different cache paths for development vs production
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR ||
    (process.platform === "win32"
      ? join(process.cwd(), ".cache", "puppeteer") // Windows local dev
      : "/opt/render/project/.cache/puppeteer"), // Linux production
};
