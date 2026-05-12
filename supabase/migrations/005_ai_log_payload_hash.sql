-- =============================================================
-- NexusOps — Migration 005: AI log payload hash
-- Adds payload_hash to ai_interaction_logs for tamper detection.
-- SHA-256(prompt || response) stored alongside each AI interaction.
-- Allows audit reviewers to verify that logged content was not
-- modified post-storage.
-- =============================================================

ALTER TABLE public.ai_interaction_logs
  ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);
