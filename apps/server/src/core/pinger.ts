import dotenv from "dotenv";
dotenv.config();

import { Validator } from "./Validator";
import { info, warn, error as logError } from "../../utils/logger";
import prisma from "../prismaClient";

// how often to ping (ms)
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS ?? 60_000);

// this node’s validator ID & location
const myValidatorId = Number(process.env.VALIDATOR_ID);
const myLocation = process.env.LOCATION ?? "unknown";

// parse peer addresses (host:port)
const peerList = (process.env.PEERS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter((h) => h);

if (peerList.length === 0) {
  warn("No peers configured");
}

const validator = new Validator(myValidatorId);
validator.peers = peerList;

async function pollAndGossip() {
  // fetch every non‑paused site
  let sites;
  try {
    sites = await prisma.website.findMany({ where: { paused: false } });
  } catch (err) {
    logError(`pollAndGossip: failed to fetch sites :${(err as Error).message}`);
    return;
  }

  if (sites.length === 0) {
    warn(`pollAndGossip: no active sites found`);
    return;
  }

  for (const { url } of sites) {
    try {
      // 1) ping
      const start = Date.now();
      const vote = await validator.checkWebsite(url);
      const latency = Date.now() - start;
      const timeStamp = new Date().toISOString();

      // 2) gossip full payload out to all peers
      await validator.gossip(url, latency, timeStamp, myLocation);

      info(
        `Validator ${myValidatorId} pinged ${url}: ${vote.status} (${latency}ms) @ ${myLocation}`
      );
    } catch (siteErr) {
      logError(
        `pollAndGossip: error processing ${url}: ${(siteErr as Error).message}`
      );
    }
  }
}

info("Starting immediate pollAndGossip run");
pollAndGossip();
setInterval(() => {
  info("Running scheduled pollAndGossip");
  pollAndGossip().catch((e) =>
    logError(`pollAndGossip interval caught error: ${(e as Error).message}`)
  );
}, PING_INTERVAL_MS);
