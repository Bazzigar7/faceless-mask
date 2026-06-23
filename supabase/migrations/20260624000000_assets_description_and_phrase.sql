-- Slice 1: add explain-context + deterministic phrase fields to assets.
-- description: nullable text, Mask's grounded-explanation source for a
-- given asset — what Mask reads when asked to explain what's on stage.
-- exact_phrases: NOT NULL text[] DEFAULT '{}', mirrors the tags column
-- convention; holds one or more deterministic trigger phrases per asset
-- for exact-match lookup alongside the existing fuzzy tag scoring.
-- Applied live to the Supabase project 2026-06-24; committed here for
-- version history. Existing rows auto-receive description=NULL and
-- exact_phrases='{}' with no backfill required.

ALTER TABLE assets ADD COLUMN description text;
ALTER TABLE assets ADD COLUMN exact_phrases text[] NOT NULL DEFAULT '{}';
