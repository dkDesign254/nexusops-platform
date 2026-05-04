export const ENV = {
  // Platform / app identity
  appId: process.env.VITE_APP_ID ?? "",

  // JWT cookie sessions (tRPC protectedProcedure)
  cookieSecret: process.env.JWT_SECRET ?? "",

  // Database (Drizzle direct connection)
  databaseUrl: process.env.DATABASE_URL ?? "",

  isProduction: process.env.NODE_ENV === "production",

  // LLM gateway (Forge / Gemini)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Make.com runtime dispatch
  makeApiKey: process.env.MAKE_API_KEY ?? "",

  // Airtable (server-side only — never exposed to browser)
  airtableApiKey: process.env.AIRTABLE_API_KEY ?? "",
  airtableBaseId: process.env.AIRTABLE_BASE_ID ?? "app4DDa3zvaGspOhz",

  // Webhook HMAC secrets — used to verify inbound webhooks from Make/n8n
  makeWebhookSecret: process.env.MAKE_WEBHOOK_SECRET ?? "",
  n8nWebhookSecret:  process.env.N8N_WEBHOOK_SECRET  ?? "",

  // Stripe — set STRIPE_SECRET_KEY on the server, VITE_STRIPE_PUBLISHABLE_KEY on client
  stripeSecretKey:      process.env.STRIPE_SECRET_KEY      ?? "",
  stripeWebhookSecret:  process.env.STRIPE_WEBHOOK_SECRET  ?? "",

  // Anthropic (optional — enables real Claude responses in GAIA panel)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
};
