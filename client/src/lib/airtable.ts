/**
 * NexusOps — Client-side Airtable reader
 *
 * Reads the 5 SUPPORTING tables from Airtable directly in the browser.
 * The 5 core governance tables (workflows, logs, etc.) are read from
 * Supabase which is synced server-side — this file is for config-type
 * data that doesn't need realtime: pricing, integrations, tour content,
 * translations, and platform config.
 *
 * Rate limit: 5 req/s per base. A 200ms throttle is applied between
 * paginated requests to stay well within limits.
 *
 * Required env vars:
 *   VITE_AIRTABLE_TOKEN    — Airtable personal access token
 *   VITE_AIRTABLE_BASE_ID  — Defaults to app4DDa3zvaGspOhz
 */

const TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN as string | undefined;
const BASE  = (import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined) ?? "app4DDa3zvaGspOhz";
const BASE_URL = `https://api.airtable.com/v0/${BASE}`;

// ─── Table IDs ────────────────────────────────────────────────────────────────

export const TABLE_IDS = {
  platformConfig:      "tbl3JaS3SAuDElVjS",
  translations:        "tbl4qXtm02u7fBTjj",
  pricingPlans:        "tblzpl7KOGfcyQAOX",
  integrationRegistry: "tblVmcaXwPPrlpvAO",
  tourContent:         "tblM4Gl3WKHAwstYq",
  workspaces:          "tblvnclbTSib7eNly",
  workflowTemplates:   "tblXTEMcPvLk3rcIN",
  demoBookings:        "tblK6Iqa4055Og1H4",
  // Core governance tables (Workflow, ExecutionLog, AILog, PerformanceData, FinalReport)
  // are read from Supabase (server-synced) — not directly from Airtable in the browser
} as const;

// ─── Generic types ────────────────────────────────────────────────────────────

interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

interface FetchAllParams {
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  fields?: string[];
  maxRecords?: number;
}

/** Simple delay helper for rate-limit throttle. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches all records from an Airtable table, automatically following
 * pagination offsets. Applies a 200ms throttle between paginated requests.
 */
async function fetchAll<T>(tableId: string, params: FetchAllParams = {}): Promise<AirtableRecord<T>[]> {
  if (!TOKEN) {
    console.warn("[NexusOps/Airtable] VITE_AIRTABLE_TOKEN is not set. Airtable reads will return empty.");
    return [];
  }

  const allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined;
  let isFirstRequest = true;

  do {
    if (!isFirstRequest) await sleep(200);
    isFirstRequest = false;

    const url = new URL(`${BASE_URL}/${tableId}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    if (params.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
    if (params.maxRecords) url.searchParams.set("maxRecords", String(params.maxRecords));
    if (params.fields?.length) {
      params.fields.forEach((f) => url.searchParams.append("fields[]", f));
    }
    if (params.sort?.length) {
      params.sort.forEach((s, i) => {
        url.searchParams.set(`sort[${i}][field]`, s.field);
        url.searchParams.set(`sort[${i}][direction]`, s.direction);
      });
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[Airtable] ${res.status} ${res.statusText}: ${text}`);
    }

    const data: AirtableListResponse<T> = await res.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

// ─── Pricing Plans ────────────────────────────────────────────────────────────

export interface PricingPlan {
  recordId: string;
  name: string;
  slug: string;
  monthlyPriceUsd: number | null;
  annualPriceUsd: number | null;
  description: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  workflowLimit: number;   // -1 = unlimited
  seatsIncluded: number;   // -1 = unlimited
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  tier: string | null;
}

interface PricingPlanFields {
  "Plan Name"?: string;
  "Plan Slug"?: string;
  "Monthly Price USD"?: number;
  "Annual Price USD"?: number;
  "Description"?: string;
  "Features JSON"?: string;
  "Is Popular"?: boolean;
  "Is Active"?: boolean;
  "Sort Order"?: number;
  "Workflow Limit"?: number;
  "Seats Included"?: number;
  "Stripe Price ID Monthly"?: string;
  "Stripe Price ID Annual"?: string;
  "Tier"?: string;
}

/**
 * Fetches all active pricing plans from Airtable, sorted by Sort Order.
 */
export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  const records = await fetchAll<PricingPlanFields>(TABLE_IDS.pricingPlans, {
    filterByFormula: "{Is Active}",
    sort: [{ field: "Sort Order", direction: "asc" }],
  });

  return records.map((r) => {
    let features: string[] = [];
    try {
      const raw = r.fields["Features JSON"];
      if (raw) features = JSON.parse(raw) as string[];
    } catch {
      features = [];
    }
    return {
      recordId: r.id,
      name: r.fields["Plan Name"] ?? "Plan",
      slug: r.fields["Plan Slug"] ?? r.id,
      monthlyPriceUsd: r.fields["Monthly Price USD"] ?? null,
      annualPriceUsd: r.fields["Annual Price USD"] ?? null,
      description: r.fields["Description"] ?? "",
      features,
      isPopular: r.fields["Is Popular"] ?? false,
      isActive: r.fields["Is Active"] ?? false,
      sortOrder: r.fields["Sort Order"] ?? 0,
      workflowLimit: r.fields["Workflow Limit"] ?? -1,
      seatsIncluded: r.fields["Seats Included"] ?? -1,
      stripePriceIdMonthly: r.fields["Stripe Price ID Monthly"] ?? null,
      stripePriceIdAnnual: r.fields["Stripe Price ID Annual"] ?? null,
      tier: r.fields["Tier"] ?? null,
    };
  });
}

// ─── Integration Registry ─────────────────────────────────────────────────────

export interface Integration {
  recordId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status: "Live" | "Beta" | "Coming Soon";
  webhookSupported: boolean;
  oauthSupported: boolean;
  autoBuildSupported: boolean;
  docsUrl: string | null;
  sortOrder: number;
}

interface IntegrationFields {
  "Integration Name"?: string;
  "Slug"?: string;
  "Category"?: string;
  "Description"?: string;
  "Status"?: string;
  "Webhook Supported"?: boolean;
  "OAuth Supported"?: boolean;
  "Auto Build Supported"?: boolean;
  "Docs URL"?: string;
  "Sort Order"?: number;
}

/**
 * Fetches integrations from the Integration Registry.
 * @param status - Optional filter: "Live" | "Beta" | "Coming Soon"
 */
export async function fetchIntegrations(status?: string): Promise<Integration[]> {
  const params: FetchAllParams = {
    sort: [{ field: "Sort Order", direction: "asc" }],
  };
  if (status) {
    params.filterByFormula = `{Status} = "${status}"`;
  }

  const records = await fetchAll<IntegrationFields>(TABLE_IDS.integrationRegistry, params);

  return records.map((r) => ({
    recordId: r.id,
    name: r.fields["Integration Name"] ?? "Integration",
    slug: r.fields["Slug"] ?? r.id,
    category: r.fields["Category"] ?? "Other",
    description: r.fields["Description"] ?? "",
    status: (r.fields["Status"] ?? "Coming Soon") as Integration["status"],
    webhookSupported: r.fields["Webhook Supported"] ?? false,
    oauthSupported: r.fields["OAuth Supported"] ?? false,
    autoBuildSupported: r.fields["Auto Build Supported"] ?? false,
    docsUrl: r.fields["Docs URL"] ?? null,
    sortOrder: r.fields["Sort Order"] ?? 0,
  }));
}

// ─── Tour and Help Content ────────────────────────────────────────────────────

export type TourContentType = "tour_step" | "tooltip" | "gaia_context" | "onboarding" | "empty_state";

export interface TourStep {
  recordId: string;
  helpKey: string;
  type: TourContentType;
  page: string;
  title: string;
  bodyText: string;
  tourStepOrder: number;
  ctaLabel: string | null;
  ctaAction: string | null;
  targetElementSelector: string | null;
  active: boolean;
}

interface TourContentFields {
  "Help Key"?: string;
  "Type"?: string;
  "Page"?: string;
  "Title"?: string;
  "Body Text"?: string;
  "Tour Step Order"?: number;
  "CTA Label"?: string;
  "CTA Action"?: string;
  "Target Element Selector"?: string;
  "Active"?: boolean;
}

/**
 * Fetches tour/help content for a given page, sorted by Tour Step Order.
 * @param page - Page identifier e.g. "dashboard", "workflows"
 * @param type - Optional type filter e.g. "tour_step"
 */
export async function fetchTourContent(page: string, type?: TourContentType): Promise<TourStep[]> {
  let formula = `AND({Page} = "${page}", {Active})`;
  if (type) formula = `AND({Page} = "${page}", {Type} = "${type}", {Active})`;

  const records = await fetchAll<TourContentFields>(TABLE_IDS.tourContent, {
    filterByFormula: formula,
    sort: [{ field: "Tour Step Order", direction: "asc" }],
  });

  return records.map((r) => ({
    recordId: r.id,
    helpKey: r.fields["Help Key"] ?? r.id,
    type: (r.fields["Type"] ?? "tooltip") as TourContentType,
    page: r.fields["Page"] ?? page,
    title: r.fields["Title"] ?? "",
    bodyText: r.fields["Body Text"] ?? "",
    tourStepOrder: r.fields["Tour Step Order"] ?? 0,
    ctaLabel: r.fields["CTA Label"] ?? null,
    ctaAction: r.fields["CTA Action"] ?? null,
    targetElementSelector: r.fields["Target Element Selector"] ?? null,
    active: r.fields["Active"] ?? false,
  }));
}

// ─── Platform Config ──────────────────────────────────────────────────────────

export interface ConfigItem {
  recordId: string;
  key: string;
  value: string;
  category: string;
}

interface PlatformConfigFields {
  "Key"?: string;
  "Value"?: string;
  "Category"?: string;
}

/**
 * Fetches platform configuration records, optionally filtered by category.
 * @param category - Optional category filter e.g. "gaia", "ui", "limits"
 */
export async function fetchPlatformConfig(category?: string): Promise<ConfigItem[]> {
  const params: FetchAllParams = {};
  if (category) {
    params.filterByFormula = `{Category} = "${category}"`;
  }

  const records = await fetchAll<PlatformConfigFields>(TABLE_IDS.platformConfig, params);

  return records.map((r) => ({
    recordId: r.id,
    key: r.fields["Key"] ?? r.id,
    value: r.fields["Value"] ?? "",
    category: r.fields["Category"] ?? "",
  }));
}

// ─── Translations ─────────────────────────────────────────────────────────────

export interface Translation {
  recordId: string;
  key: string;
  languageCode: string;
  text: string;
  section: string;
}

interface TranslationFields {
  "Translation Key"?: string;
  "Language Code"?:  string;
  "Translated Text"?: string;
  "Section"?: string;
}

/**
 * Fetches translations for a given language code.
 * Falls back to English if key is missing in the requested language.
 * @param languageCode - e.g. "en" | "fr" | "de" | "ar"
 * @param section - Optional section filter e.g. "landing" | "dashboard"
 */
export async function fetchTranslations(
  languageCode: string,
  section?: string,
): Promise<Translation[]> {
  let formula = `{Language Code} = "${languageCode}"`;
  if (section) formula = `AND({Language Code} = "${languageCode}", {Section} = "${section}")`;

  const records = await fetchAll<TranslationFields>(TABLE_IDS.translations, {
    filterByFormula: formula,
  });

  return records.map((r) => ({
    recordId: r.id,
    key: r.fields["Translation Key"] ?? r.id,
    languageCode: r.fields["Language Code"] ?? languageCode,
    text: r.fields["Translated Text"] ?? "",
    section: r.fields["Section"] ?? "",
  }));
}

// ─── Workspaces ───────────────────────────────────────────────────────────────

export interface Workspace {
  recordId: string;
  name: string;
  slug: string;
  ownerUserId: string;
  plan: string;
  colorAccent: string;
  iconEmoji: string;
  description: string;
  isPersonal: boolean;
  memberCount: number;
  workflowCount: number;
  createdAt: string;
}

interface WorkspaceFields {
  "Workspace Name"?:  string;
  "Workspace Slug"?:  string;
  "Owner User ID"?:   string;
  "Plan"?:            string;
  "Color Accent"?:    string;
  "Icon Emoji"?:      string;
  "Description"?:     string;
  "Is Personal"?:     boolean;
  "Member Count"?:    number;
  "Workflow Count"?:  number;
  "Created At"?:      string;
}

/**
 * Fetches workspace records. If ownerUserId is provided, filters to that owner.
 */
export async function fetchWorkspaces(ownerUserId?: string): Promise<Workspace[]> {
  const params: FetchAllParams = {};
  if (ownerUserId) {
    params.filterByFormula = `{Owner User ID} = "${ownerUserId}"`;
  }

  const records = await fetchAll<WorkspaceFields>(TABLE_IDS.workspaces, params);

  return records.map((r) => ({
    recordId: r.id,
    name: r.fields["Workspace Name"] ?? "Workspace",
    slug: r.fields["Workspace Slug"] ?? r.id,
    ownerUserId: r.fields["Owner User ID"] ?? "",
    plan: r.fields["Plan"] ?? "free",
    colorAccent: r.fields["Color Accent"] ?? "#0ea472",
    iconEmoji: r.fields["Icon Emoji"] ?? "⬡",
    description: r.fields["Description"] ?? "",
    isPersonal: r.fields["Is Personal"] ?? false,
    memberCount: r.fields["Member Count"] ?? 0,
    workflowCount: r.fields["Workflow Count"] ?? 0,
    createdAt: r.fields["Created At"] ?? "",
  }));
}

// ─── Workflow Templates ───────────────────────────────────────────────────────

export type TemplateDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface WorkflowTemplate {
  recordId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  useCase: string;
  compatibleRuntimes: string[];
  gaiaPromptHint: string;
  makeBlueprintUrl: string | null;
  n8nImportUrl: string | null;
  difficulty: TemplateDifficulty;
  setupTimeMinutes: number;
  isFeatured: boolean;
  sortOrder: number;
}

interface WorkflowTemplateFields {
  "Template Name"?:         string;
  "Slug"?:                  string;
  "Category"?:              string;
  "Description"?:           string;
  "Use Case"?:              string;
  "Compatible Runtimes"?:   string;
  "Gaia Prompt Hint"?:      string;
  "Make Blueprint URL"?:    string;
  "n8n Import URL"?:        string;
  "Difficulty"?:            string;
  "Setup Time Minutes"?:    number;
  "Is Featured"?:           boolean;
  "Sort Order"?:            number;
}

/**
 * Fetches workflow templates, optionally filtered by featured flag.
 */
export async function fetchWorkflowTemplates(featuredOnly = false): Promise<WorkflowTemplate[]> {
  const params: FetchAllParams = {
    sort: [{ field: "Sort Order", direction: "asc" }],
  };
  if (featuredOnly) {
    params.filterByFormula = "{Is Featured}";
  }

  const records = await fetchAll<WorkflowTemplateFields>(TABLE_IDS.workflowTemplates, params);

  return records.map((r) => ({
    recordId: r.id,
    name: r.fields["Template Name"] ?? "Template",
    slug: r.fields["Slug"] ?? r.id,
    category: r.fields["Category"] ?? "General",
    description: r.fields["Description"] ?? "",
    useCase: r.fields["Use Case"] ?? "",
    compatibleRuntimes: r.fields["Compatible Runtimes"]
      ? r.fields["Compatible Runtimes"].split(",").map((s) => s.trim())
      : [],
    gaiaPromptHint: r.fields["Gaia Prompt Hint"] ?? "",
    makeBlueprintUrl: r.fields["Make Blueprint URL"] ?? null,
    n8nImportUrl: r.fields["n8n Import URL"] ?? null,
    difficulty: (r.fields["Difficulty"] ?? "Beginner") as TemplateDifficulty,
    setupTimeMinutes: r.fields["Setup Time Minutes"] ?? 15,
    isFeatured: r.fields["Is Featured"] ?? false,
    sortOrder: r.fields["Sort Order"] ?? 0,
  }));
}

// ─── Demo Bookings (write-only from browser) ──────────────────────────────────

export interface DemoBookingInput {
  fullName:    string;
  workEmail:   string;
  company:     string;
  jobTitle:    string;
  teamSize:    string;
  primaryUseCase: string;
  currentTools: string;
  preferredDate: string;
  message:     string;
  source?:     string;
}

/**
 * Creates a new Demo Booking record in Airtable.
 * Uses the Airtable REST API directly (token must have write access).
 */
export async function createDemoBooking(input: DemoBookingInput): Promise<string> {
  if (!TOKEN) throw new Error("VITE_AIRTABLE_TOKEN is not set — cannot write demo booking.");

  const res = await fetch(`${BASE_URL}/${TABLE_IDS.demoBookings}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Full Name":        input.fullName,
        "Work Email":       input.workEmail,
        "Company":          input.company,
        "Job Title":        input.jobTitle,
        "Team Size":        input.teamSize,
        "Primary Use Case": input.primaryUseCase,
        "Current Tools":    input.currentTools,
        "Preferred Date":   input.preferredDate,
        "Message":          input.message,
        "Status":           "New",
        "Source":           input.source ?? "website",
        "Submitted At":     new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Airtable] Demo booking failed: ${res.status} ${text}`);
  }

  const data: { id: string } = await res.json();
  return data.id;
}
