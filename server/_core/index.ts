import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { webhookRouter } from "../webhooks";
import { runAirtableSync } from "../sync/airtable-sync";
import { seedIfEmpty } from "../sync/seed-data";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Health check — used by Render to determine instance readiness
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", ts: new Date().toISOString() });
  });

  // Inbound webhooks for Make, n8n, and Stripe
  app.use("/api/webhooks", webhookRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ── Post-startup data initialisation (non-blocking) ───────────────────────
  // Run after server is listening so HTTP is ready before any async work.
  server.on("listening", () => {
    void initData();
  });
}

/**
 * Initialises Supabase data on every server start:
 *  1. Run Airtable → Supabase sync (if both are configured)
 *  2. If sync produced 0 records (Airtable unavailable or empty),
 *     fall back to seeding sample data so the dashboard is never blank.
 */
async function initData(): Promise<void> {
  try {
    console.log("[Init] Starting data initialisation…");
    const syncResult = await runAirtableSync(true);

    if (syncResult.totalSynced === 0 && !syncResult.ok) {
      console.log("[Init] Airtable sync produced no records — attempting seed fallback…");
      const seedResult = await seedIfEmpty();
      if (seedResult.seeded) {
        console.log(`[Init] Seeded ${seedResult.workflowsInserted} sample workflows.`);
      } else {
        console.log("[Init] Seed skipped (data already present or Supabase unavailable).");
      }
    }

    console.log("[Init] Data initialisation complete.");
  } catch (err: unknown) {
    // Non-fatal — the server continues running even if init fails
    console.warn("[Init] Data initialisation failed (non-fatal):", err instanceof Error ? err.message : String(err));
  }
}

startServer().catch(console.error);
