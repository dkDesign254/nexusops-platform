-- Migration 005: Add payload_hash to AI_Logs for tamper detection
-- SHA-256(prompt || response) stored alongside each AI interaction.
-- Allows audit reviewers to verify that logged content was not modified post-storage.

ALTER TABLE "AI_Logs"
  ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);
