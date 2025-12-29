/**
 * Quick test script to verify Puppeteer configuration
 * Run: node test-puppeteer.js
 */

import puppeteer from "puppeteer";

async function testPuppeteer() {
  console.log("🧪 Testing Puppeteer configuration...\n");

  // Show environment
  console.log("📋 Environment:");
  console.log("  NODE_ENV:", process.env.NODE_ENV || "development");
  console.log(
    "  PUPPETEER_EXECUTABLE_PATH:",
    process.env.PUPPETEER_EXECUTABLE_PATH || "not set"
  );
  console.log("  CHROME_PATH:", process.env.CHROME_PATH || "not set");
  console.log(
    "  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:",
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || "not set"
  );
  console.log("");

  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
    ],
  };

  // Determine executable path
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    console.log(
      "🔧 Using PUPPETEER_EXECUTABLE_PATH:",
      launchOptions.executablePath
    );
  } else if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
    console.log("🔧 Using CHROME_PATH:", launchOptions.executablePath);
  } else {
    console.log("🔧 Using auto-detected Chrome");
  }

  console.log("");

  try {
    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch(launchOptions);

    console.log("✅ Browser launched successfully!");

    const version = await browser.version();
    console.log("📦 Browser version:", version);

    console.log("🌐 Opening test page...");
    const page = await browser.newPage();
    await page.goto("https://example.com", { waitUntil: "networkidle2" });

    const title = await page.title();
    console.log("📄 Page title:", title);

    await browser.close();
    console.log("✅ Test completed successfully!");
    console.log("");
    console.log("🎉 Puppeteer is configured correctly!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("");
    console.error("💡 Troubleshooting:");
    console.error("  1. Make sure Chrome/Chromium is installed");
    console.error(
      "  2. Check PUPPETEER_EXECUTABLE_PATH points to valid Chrome binary"
    );
    console.error("  3. On Render, ensure build script installs Chromium");
    console.error("  4. Verify all required dependencies are installed");
    process.exit(1);
  }
}

testPuppeteer();
