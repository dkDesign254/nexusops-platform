/**
 * NexusOps — Billing tRPC Router
 *
 * Wraps Stripe Checkout and subscription management.
 * Requires STRIPE_SECRET_KEY to be set in the server environment.
 *
 * Install the Stripe SDK before using:
 *   pnpm add stripe
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

/** Lazy-loads Stripe to avoid crashing the server when key is not set. */
async function getStripe() {
  if (!ENV.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured on this server.");
  }
  // Dynamic import so the server starts even without stripe installed
  const { default: Stripe } = await import("stripe" as string) as { default: new (key: string, opts: object) => unknown };
  return new (Stripe as new (key: string, opts: object) => {
    checkout: {
      sessions: {
        create: (params: object) => Promise<{ url: string | null; id: string }>;
      };
    };
    subscriptions: {
      retrieve: (id: string) => Promise<{ status: string; current_period_end: number; items: { data: Array<{ price: { id: string } }> } }>;
    };
    webhooks: {
      constructEvent: (body: string, sig: string, secret: string) => { type: string; data: { object: Record<string, unknown> } };
    };
  })(ENV.stripeSecretKey, { apiVersion: "2024-12-18.acacia" });
}

export const billingRouter = router({
  /** Creates a Stripe Checkout session and returns the redirect URL. */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        customerId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        ...(input.customerId ? { customer: input.customerId } : {}),
      });
      return { url: session.url, sessionId: session.id };
    }),

  /** Returns the current subscription status for a Stripe customer. */
  getSubscription: publicProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(async ({ input }) => {
      const stripe = await getStripe();
      const sub = await stripe.subscriptions.retrieve(input.subscriptionId);
      return {
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        priceId: sub.items.data[0]?.price.id ?? null,
      };
    }),

  /** Stripe webhook event handler — validates signature and processes events. */
  handleWebhookEvent: publicProcedure
    .input(z.object({ payload: z.string(), signature: z.string() }))
    .mutation(async ({ input }) => {
      if (!ENV.stripeWebhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
      }
      const stripe = await getStripe();
      const event = stripe.webhooks.constructEvent(
        input.payload,
        input.signature,
        ENV.stripeWebhookSecret
      );

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          // TODO: update user subscription record in Supabase
          console.log("[Billing] Subscription event:", event.type, event.data.object["id"]);
          break;
        case "customer.subscription.deleted":
          console.log("[Billing] Subscription cancelled:", event.data.object["id"]);
          break;
        case "checkout.session.completed":
          console.log("[Billing] Checkout completed:", event.data.object["id"]);
          break;
      }

      return { received: true, type: event.type };
    }),
});
