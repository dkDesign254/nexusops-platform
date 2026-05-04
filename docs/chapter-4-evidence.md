# Chapter 4 — System Implementation Evidence
## NexusOps: Runtime-Independent AgentOps Platform for Governed AI Automation in Marketing Workflows

> **Document purpose:** This file aggregates implementation evidence for Chapter 4 of the accompanying academic research project. It maps each research objective to the corresponding platform feature, file artefact, and observable behaviour.

---

## 4.1 Research Objectives Mapping

| Research Objective | Platform Feature | Primary Artefacts |
|---|---|---|
| RO1: Design a runtime-agnostic governance layer for AI agents | Webhook ingest endpoint + tRPC execution log pipeline | `server/webhooks.ts`, `server/routers/sync.ts` |
| RO2: Provide quantifiable governance health metrics | Governance Health Score (0–100) on Dashboard | `client/src/pages/dashboard-page.tsx`, `server/routers/dashboard.ts` |
| RO3: Ensure full AI interaction traceability | AI Interactions audit log with model, prompt, tokens, confidence | `client/src/pages/ai-interactions-page.tsx` |
| RO4: Enable human-in-the-loop report approval | Reports page with approve/reject workflow | `client/src/pages/reports-page.tsx` |
| RO5: Support multi-runtime orchestration (Make, n8n, custom) | Runtime-agnostic webhook receiver + agent runtime labels | `server/webhooks.ts`, `client/src/pages/agents-page.tsx` |
| RO6: Deliver an enterprise-grade admin control plane | System administration panel with service health, user management | `client/src/pages/admin-page.tsx` |

---

## 4.2 Architecture Overview

### 4.2.1 Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 19, Vite, Wouter, Tailwind CSS | Lightweight SPA with code-splitting; wouter reduces bundle vs. react-router |
| API | Express.js + tRPC v11 | Type-safe end-to-end API without REST boilerplate; mutation/query separation |
| Database | Supabase (PostgreSQL) | Managed Postgres with row-level security; built-in auth and real-time subscriptions |
| Governance Data | Airtable (dual-layer) | Non-technical stakeholders can edit governance policies; synced to Supabase for queries |
| LLM Gateway | Anthropic Claude / Forge proxy | Server-side proxying prevents API key exposure; Gemini 2.5 Flash for cost efficiency |
| Deployment | Render.com (render.yaml) | Zero-downtime deploys; 12-factor compliant; health check endpoint at `/health` |

### 4.2.2 Data Flow

```
External Runtime (Make / n8n)
        │
        ▼  POST /api/webhooks/ingest
        │  [HMAC-SHA256 verified]
        ▼
  Webhook Router (server/webhooks.ts)
        │
        ▼
  Supabase: execution_logs table
        │
        ├──► Dashboard KPIs (real-time aggregation)
        ├──► Audit Page (table + swimlane timeline)
        ├──► Governance Health Score calculation
        └──► AI Traceability logs (ai_interactions table)
```

---

## 4.3 Governance Health Score — Calculation Evidence

**Location:** `client/src/pages/dashboard-page.tsx` (GovernanceHealthScore component)

**Formula:**

```
score = (audit_completeness × 0.40)
      + (ai_traceability   × 0.30)
      + (report_approval   × 0.20)
      + (workflow_reliability × 0.10)
```

**Component breakdown:**

| Dimension | Weight | Measurement Method |
|---|---|---|
| Audit Completeness | 40% | `(logs_with_step_name / total_logs) × 100` |
| AI Traceability | 30% | `(ai_logs_with_model_and_prompt / total_ai_logs) × 100` |
| Report Approval Rate | 20% | `(approved_reports / submitted_reports) × 100` |
| Workflow Reliability | 10% | `(successful_executions / total_executions) × 100` |

**Design rationale:** Audit completeness carries the highest weight (40%) because incomplete audit trails represent the most critical governance failure mode — an incomplete log cannot be remediated after the fact, while a rejected report can be resubmitted.

---

## 4.4 AI Interaction Traceability — Evidence

**Location:** `client/src/pages/ai-interactions-page.tsx`

Each AI interaction record stores:

| Field | Type | Purpose |
|---|---|---|
| `model` | string | Identifies which LLM generated the output (accountability) |
| `prompt_summary` | string | Truncated input for audit review |
| `response_summary` | string | Truncated output for audit review |
| `tokens_used` | number | Cost tracking and usage governance |
| `confidence` | number (0–1) | Signals low-confidence outputs for human review |
| `flagged` | boolean | Manual or automated flag for compliance review |
| `workflow_id` | FK | Links AI decision to the triggering workflow execution |
| `timestamp` | ISO 8601 | Temporal ordering for audit chain |

**Traceability chain:** workflow execution → execution log entry → AI interaction log entry → human review flag. This three-layer chain satisfies the IEEE 7001-2021 transparency requirements for autonomous systems.

---

## 4.5 Multi-Runtime Webhook Ingest — Evidence

**Location:** `server/webhooks.ts`

The ingest endpoint is deliberately runtime-agnostic. It accepts any JSON payload and maps known fields to the `execution_logs` schema. Unknown fields are stored in a `metadata` column.

```typescript
// Signature verification supports both Make and n8n header conventions
const makeSecret = env.makeWebhookSecret;
const n8nSecret  = env.n8nWebhookSecret;

// Timing-safe comparison prevents timing oracle attacks
function verifySignature(secret: string, payload: string, header: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}
```

**Supported runtimes tested:**

| Runtime | Signature Header | Payload Format |
|---|---|---|
| Make (Integromat) | `x-make-signature` | JSON object |
| n8n | `x-n8n-signature` | JSON object |
| Custom agent | configurable | JSON object |

---

## 4.6 Agent Configuration Studio — Evidence

**Location:** `client/src/pages/agents-page.tsx`

The Agent Configuration Studio implements an **Agent Governance Readiness Score** computed in real-time as users configure a new agent:

| Configuration Choice | Score Contribution | Governance Rationale |
|---|---|---|
| Runtime defined | +10 pts | Traceability requires known execution environment |
| AI analysis enabled | +15 pts | Automated pattern detection increases coverage |
| Approval required | +15 pts | Human-in-the-loop maintains oversight |
| Full logging level | +15 pts | Completeness maximises audit trail fidelity |
| Descriptive name (>10 chars) | +5 pts | Discoverability reduces governance overhead |
| Base score | 40 pts | Minimum viable governance baseline |

**Maximum score: 100 pts.** Agents scoring below 60 are labelled "Low Risk Readiness" and prompted to enable additional governance controls.

---

## 4.7 Security Implementation Evidence

### 4.7.1 Authentication
- Supabase email/password auth with JWT tokens
- `AuthGuard` component (`client/src/components/auth/auth-guard.tsx`) protects all non-public routes
- Server-side session validation via `createContext` on every tRPC request

### 4.7.2 Role-Based Access Control
- Admin role check in `admin-page.tsx`: `user.role !== "admin"` renders access-denied UI
- `adminProcedure` in tRPC enforces server-side admin gate
- Standard users cannot access admin data mutations

### 4.7.3 Webhook Security
- HMAC-SHA256 verification with `crypto.timingSafeEqual` (prevents timing attacks)
- Signature header names are runtime-specific (Make: `x-make-signature`, n8n: `x-n8n-signature`)
- Empty secret bypasses verification for local development only

### 4.7.4 Secret Management
- All secrets stored in environment variables (never hardcoded)
- `VITE_*` prefix boundary strictly enforced (client-safe only)
- `.env` in `.gitignore`; `.env.example` documents all required variables

---

## 4.8 Deployment Configuration Evidence

**Location:** `render.yaml`

| Service | Type | Build Command | Health Check |
|---|---|---|---|
| `nexusops-server` | Node.js web service | `pnpm install && pnpm build:server` | `GET /health` |
| `nexusops-client` | Static site | `pnpm install && pnpm build` | N/A (CDN) |

**Health endpoint response schema (`GET /health`):**

```json
{
  "status": "ok | degraded",
  "ts": "2026-05-05T12:00:00.000Z",
  "services": {
    "supabase": "ok | degraded | unconfigured",
    "airtable": "ok | unconfigured",
    "stripe":   "ok | unconfigured",
    "llm":      "ok | unconfigured",
    "make":     "ok | unconfigured",
    "n8n":      "ok | unconfigured"
  }
}
```

---

## 4.9 Key Implementation Decisions

### Decision 1: tRPC over REST
**Context:** Initial design used Express REST endpoints.
**Decision:** Migrated to tRPC v11 with Zod validation.
**Rationale:** End-to-end type safety eliminates an entire class of runtime errors (mismatched request/response shapes). The `publicProcedure / protectedProcedure / adminProcedure` pattern enforces auth at the API layer without boilerplate.

### Decision 2: Airtable as Governance Policy Store
**Context:** Governance tables (pricing, tour content, workflow policies) change frequently and require non-technical editing.
**Decision:** Primary governance data in Airtable, synced to Supabase on startup via `runAirtableSync()`.
**Rationale:** Airtable's GUI lowers the barrier for governance editors; Supabase provides the query performance and RLS security needed for application queries.

### Decision 3: Server-Side LLM Proxying
**Context:** GAIA AI assistant requires LLM API access.
**Decision:** All LLM calls proxied through `gaiaRouter.chat` tRPC mutation on the server.
**Rationale:** Keeps `ANTHROPIC_API_KEY` server-side. Never bundled into the client (`VITE_*` pattern enforced). Adds an injection point for rate limiting and cost monitoring.

### Decision 4: Governance Health Score as Single Metric
**Context:** Multiple governance dimensions make holistic assessment complex.
**Decision:** Weighted composite score (40/30/20/10) surfaced as a single 0–100 gauge.
**Rationale:** Research literature (ISO/IEC 42001:2023, NIST AI RMF) favours actionable composite metrics over dashboards with dozens of unweighted KPIs. The weighted formula surfaces audit completeness as the dominant factor, consistent with the research priority of traceability.

---

## 4.10 Limitations and Future Work

| Limitation | Impact | Proposed Resolution |
|---|---|---|
| Airtable sync is pull-based (startup only) | Governance policy changes require server restart to propagate | Implement webhook-triggered sync or periodic background job |
| Agent Governance Readiness Score is client-computed | Score can be manipulated by modifying client code | Move score computation to server-side tRPC mutation with Zod validation |
| No RLS policies defined on Supabase tables | Any authenticated user can read all rows | Define per-table RLS policies gating reads to `auth.uid()` ownership |
| Swimlane timeline limited to 20 workflows | Large-scale deployments lose context | Add pagination or virtual windowing to the swimlane component |
| Stripe integration uses lazy import workaround | Dynamic import adds ~200ms cold-start latency | Install stripe package via package manager and use static import |

---

*Generated: 2026-05-05 | Platform version: NexusOps 1.0 (pre-release) | Research context: MSc dissertation, AI Governance in Marketing Automation*
