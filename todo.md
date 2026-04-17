# AgentOps Platform — TODO

## Phase 1: Database Schema
- [x] Add Workflows table to drizzle/schema.ts
- [x] Add ExecutionLogs table to drizzle/schema.ts
- [x] Add AI_Logs table to drizzle/schema.ts
- [x] Add Reports table to drizzle/schema.ts
- [x] Generate and apply migration SQL

## Phase 2: Backend API
- [x] Workflow CRUD procedures (create, list, getById, updateStatus)
- [x] ExecutionLog procedures (create, listByWorkflow)
- [x] AI_Log procedures (create, listByWorkflow)
- [x] Report procedures (create, getByWorkflow)
- [x] Inbound webhook endpoint for Make (/api/webhooks/make)
- [x] Inbound webhook endpoint for n8n (/api/webhooks/n8n)
- [x] Outbound runtime routing logic (dispatch to Make or n8n)
- [x] AI-powered report generation using invokeLLM
- [x] server/db.ts helpers for all tables

## Phase 3: Frontend Layout & Dashboard
- [x] Design system: color palette, typography, global CSS
- [x] DashboardLayout integration with sidebar nav
- [x] Dashboard overview page with stats cards and workflow table
- [x] Status badge components
- [x] Runtime badge components

## Phase 4: Workflow Pages
- [x] Workflow intake form page (create new workflow)
- [x] Workflow detail page with drill-down tabs
- [x] Execution logs tab with timeline view
- [x] Error highlighting in execution logs

## Phase 5: AI Logs, Reports, Webhooks
- [x] AI logs view per workflow
- [x] Reports view with structured output (summary, insights, risks, recommendations)
- [x] Webhook simulation panel for testing inbound events
- [x] Full audit trail view per workflow

## Phase 6: Tests & Polish
- [x] Vitest tests for workflow router
- [x] Vitest tests for webhook handlers
- [x] Final UI polish and responsive design
- [x] Checkpoint and delivery

## Airtable Integration
- [x] Store AIRTABLE_API_KEY and AIRTABLE_BASE_ID as secrets
- [x] Build server/airtable.ts client with typed fetchers for all 5 tables
- [x] Build server/routers/airtable.ts tRPC router exposing all 5 tables
- [x] Register airtable router in server/routers.ts
- [x] Update Dashboard page to show Airtable workflow data + stats
- [x] Update WorkflowDetail page to show Airtable execution + AI + report data
- [x] Update ReportsPage to show Airtable Final Report data
- [x] Add PerformanceData page with metrics table and KPI summary cards
- [x] Add Performance Data nav item to sidebar
- [x] Write Vitest tests for Airtable router
- [x] Checkpoint and deliver

## Enterprise SaaS Upgrade
- [x] Design system: dark/light theme toggle (persistent), premium color tokens, Inter font
- [x] Global CSS overhaul: spacing scale, shadow system, animation tokens
- [x] Topbar component: live sync indicator, theme toggle, breadcrumbs, user menu
- [x] Enhanced sidebar: collapsible groups, active states, keyboard nav
- [x] Dashboard: health score card, success rate, AI insights panel (LLM-generated)
- [x] Dashboard: recent alerts / anomalies section
- [x] Dashboard: search + filter (status, runtime, date) + sort on workflow table
- [x] WorkflowDetail: execution timeline (step-by-step visual trace)
- [x] WorkflowDetail: AI interaction trace view (prompt/response panels)
- [x] WorkflowDetail: error inspection panel with full error details
- [x] WorkflowDetail: audit trail visualization
- [x] Reports: Executive Summary card view
- [x] Reports: Approve Report button (Airtable PATCH writeback)
- [x] Reports: Export mock (PDF/JSON download)
- [x] Enterprise: system logs panel page
- [x] Enterprise: usage metrics (workflow count, AI call count)
- [x] Enterprise: billing/plan tiers UI (Starter, Pro, Enterprise)
- [x] Enterprise: role-based UI placeholders (Admin, Analyst)
- [x] Polish: skeleton loading states across all pages
- [x] Polish: empty states with illustrations/icons
- [x] Polish: micro-interactions (hover, transition, focus)
- [x] Polish: data freshness / last-updated indicators
- [x] Tests: 32 Vitest tests passing (0 failures)
- [x] Checkpoint and deliver

## AI Workflow Command Center Upgrade
- [x] Fix 404 routes: Execution Logs (/logs) and AI Logs (/ai-logs) pages
- [x] Verify all sidebar nav links resolve to working pages
- [x] Add dedicated ExecutionLogsPage (all logs across all workflows, searchable)
- [x] Add dedicated AILogsPage (all AI interactions, searchable)
- [x] Rebuild Dashboard: system health bar (success rate, failures, active, last sync)
- [x] Dashboard: real LLM-backed Governance Insights panel
- [x] Dashboard: anomaly detection panel (failures, missing outputs)
- [x] Dashboard: Recent Issues / alerts section
- [x] Add WorkflowConfig page: runtime selector, trigger type, AI toggle, Run Now button
- [x] Add manual workflow simulation (Run Now triggers webhook dispatch)
- [x] Upgrade ReportsPage: Recharts charts (success rate trend, performance metrics)
- [x] Reports: LLM-generated executive summary per report
- [x] Reports: action recommendations section
- [x] Reports: progression/trend analysis view
- [x] Reports: JSON export (functional) + PDF export (mock)
- [x] Add AI Explain button on WorkflowDetail (LLM explains errors/steps)
- [x] Add AI Governance trace viewer (prompt/response side-by-side)
- [x] Add anomaly detection indicators on workflow rows
- [x] Functional pricing UI: Starter/Pro/Enterprise with mock upgrade flow
- [x] Role-based views: Admin vs Analyst UI differentiation
- [x] Polish: loading skeletons, empty states, hover transitions across all pages
- [x] TypeScript clean, 32 tests passing
- [x] Checkpoint and deliver

## UX Fixes & Feature Additions (Round 4)
- [x] Fix campaign names: show actual Performance Data ID names instead of Airtable record IDs
- [x] Auto-refreshing AI Insights panel (every 2 minutes, silent background refresh)
- [x] Workflow status dropdown on each dashboard row (manual status update → Airtable writeback)
- [x] Date-range filter on Performance Data charts and table
- [x] TypeScript clean, 34 tests passing (2 new tests for updateWorkflowStatus), checkpoint

## Readability & Label Fixes (Round 5)
- [x] Fix campaign names in Performance Data — confirmed API returns correct names; chart now uses full names with wrapping tick labels
- [x] Expand abbreviations to full words: CTR → Click-Through Rate, ROAS → Return on Ad Spend, CPC → Cost per Click, Conv. Rate → Conversion Rate, LLM → AI model, KPI → key performance indicators
- [x] Apply full-word labels in chart legends, table headers, KPI cards, and tooltip labels
- [x] TypeScript clean, 34 tests passing, checkpoint

## Enterprise Command Center Upgrade (Phase 6)

### Phase 1 — Fix routes, logs, reports
- [x] Execution Logs: all 22 rows show same Log ID (EXE-2026-001) — deduplicate display using recordId as fallback key; show unique identifier per row
- [x] AI Logs: filter out empty/placeholder records (no promptText, no timestamp) from list view
- [x] AI Logs: second record shows recordId as logId — show "—" for missing log IDs
- [x] Reports: "View workflow" button links to /workflow/:id (wrong path) — fix to /workflows/:id
- [x] Reports: empty second report (no summary, no timestamp) — hide incomplete records; show count in footer
- [x] Execution Logs: add clickable row-expand panel showing full message text
- [x] Execution Logs: group rows by workflow (show workflow name as section header)
- [x] AI Logs: add full prompt/response expand panel with copy button
- [x] AI Logs: show cost notes as visible inline badges

### Phase 2 — Make API key auth
- [x] Add MAKE_API_KEY to server/_core/env.ts
- [x] Add makeApiKey optional field to workflows.create tRPC input schema
- [x] Pass x-make-apikey header in dispatchToRuntime when runtime=make and key is provided
- [x] Add makeApiKey input field to WorkflowNew form (shown only when runtime=make)
- [x] Add x-make-apikey header field to WebhookSimulator outbound request builder
- [x] Add helper text in WorkflowNew explaining where to find the Make API key

### Phase 3 — Dashboard command center
- [x] Dashboard: add "Last sync" timestamp with live relative time (animated green dot, updates every 30s)
- [x] Dashboard: workflow table rows are clickable — navigate to /workflows/:recordId (already implemented, confirmed)
- [x] Dashboard: add Quick Actions bar — New Workflow, Execution Logs, AI Logs, Reports, Performance Data
- [x] Dashboard: anomaly panel shows specific workflow names and error messages (already implemented)

### Phase 4 — Tests and checkpoint
- [x] TypeScript clean (0 errors)
- [x] All 34 existing tests passing
- [x] Add 2 new tests for Make API key dispatch header (x-make-apikey present for Make, absent for n8n) — 36/36 passing
- [ ] Checkpoint and deliver
