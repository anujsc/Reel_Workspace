import { Router } from "express";
import { testExtractServices } from "../controllers/test.controller.js";

const router = Router();

/**
 * @route   POST /api/test/extract-services
 * @desc    Test endpoint to process Instagram Reel through all services
 * @access  Public (for testing)
 * @body    { "url": "https://www.instagram.com/reel/..." }
 */
router.post("/extract-services", testExtractServices);

export const testRoutes = router;
