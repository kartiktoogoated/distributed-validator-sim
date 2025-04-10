import express, { Request, Response } from "express";
import { Validator } from "../../../core/Validator"; // Adjust the path as needed
import { info, error as logError } from "../../../../utils/logger";

const router = express.Router();

// Set the target URL you want to check.
// Change this URL to any website you want to monitor.
const TARGET_URL = "https://awewarad.com";

// Create an instance of Validator.
const validator = new Validator(1);

/**
 * GET /status
 * Checks the actual status of the target website and returns it as JSON.
 */
router.get("/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await validator.checkWebsite(TARGET_URL);
    info(`Fixed route status check for ${TARGET_URL}: ${status} at ${new Date().toISOString()}`);
    res.json({
      success: true,
      url: TARGET_URL,
      status,
      timeStamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logError(`Error in /status route: ${error}`);
    res.status(500).json({ success: false, message: "Failed to check website status." });
  }
});

export default router;
