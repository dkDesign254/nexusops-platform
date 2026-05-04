import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import {
  createExecutionLog,
  getWorkflowById,
  updateWorkflowStatus,
} from "./db";
import { ENV } from "./_core/env";

const webhookRouter = Router();

// ─── HMAC signature verification ─────────────────────────────────────────────

/**
 * Verifies an HMAC-SHA256 signature header against the raw request body.
 * Returns true if the secret is empty (verification disabled) or if the
 * signatures match. Returns false only when a secret IS configured and the
 * signature does not match, preventing spoofed payloads.
 */
function verifySignature(
  secret: string,
  payload: string,
  header: string | undefined
): boolean {
  if (!secret) return true; // verification not configured — allow through
  if (!header) return false;

  // Header format: "sha256=<hex digest>"
  const sig = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ─── Shared handler ───────────────────────────────────────────────────────────

async function handleInboundWebhook(
  runtime: "make" | "n8n",
  body: Record<string, unknown>,
  res: import("express").Response
) {
  const workflowId = body.workflowId as string | undefined;

  if (!workflowId) {
    return res.status(400).json({ error: "Missing workflowId in payload" });
  }

  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return res.status(404).json({ error: `Workflow ${workflowId} not found` });
  }

  const step = (body.step as string) || "External Step";
  const eventType = (body.eventType as string) || "execution";
  const status = (body.status as string) === "failure" ? "failure" : "success";
  const message = (body.message as string) || `Event received from ${runtime.toUpperCase()} runtime.`;

  const validEventTypes = [
    "intake", "routing", "execution", "ai_call",
    "report", "error", "completion", "webhook_received",
  ] as const;
  type EventType = (typeof validEventTypes)[number];
  const safeEventType: EventType = validEventTypes.includes(eventType as EventType)
    ? (eventType as EventType)
    : "webhook_received";

  await createExecutionLog({
    workflowId,
    step,
    eventType: safeEventType,
    status: status as "success" | "failure" | "info",
    message: `[${runtime.toUpperCase()} Inbound] ${message}`,
  });

  if (status === "failure") {
    await updateWorkflowStatus(workflowId, "failed");
  }

  return res.status(200).json({ received: true, workflowId, runtime, logged: true });
}

// ─── Make Inbound Webhook ─────────────────────────────────────────────────────

webhookRouter.post("/make", async (req, res) => {
  const rawBody = JSON.stringify(req.body);
  const sig = req.headers["x-make-signature"] as string | undefined;

  if (!verifySignature(ENV.makeWebhookSecret, rawBody, sig)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    await handleInboundWebhook("make", req.body as Record<string, unknown>, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Webhook/Make] Error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ─── n8n Inbound Webhook ──────────────────────────────────────────────────────

webhookRouter.post("/n8n", async (req, res) => {
  const rawBody = JSON.stringify(req.body);
  const sig = req.headers["x-n8n-signature"] as string | undefined;

  if (!verifySignature(ENV.n8nWebhookSecret, rawBody, sig)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    await handleInboundWebhook("n8n", req.body as Record<string, unknown>, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Webhook/n8n] Error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

webhookRouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  // Stripe event processing handled in billing router
  // This endpoint just acknowledges receipt — billing router processes via tRPC
  return res.status(200).json({ received: true });
});

export { webhookRouter };
