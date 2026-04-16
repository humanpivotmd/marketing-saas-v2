-- backfill_blogless_soft_delete.sql
-- MANUAL EXECUTION ONLY — do NOT put in migrations/ folder
-- Run this after 007_soft_delete_projects.sql and 008_project_delete_audit.sql are applied
-- Execute via Supabase Dashboard SQL Editor
--
-- Purpose: mark existing blog-less projects as soft-deleted (Q8=A)
-- Condition (Q2=B):
--   * settings_snapshot.selected_channels contains 'blog'
--   * no contents row with channel='blog'
--   * updated_at < NOW() - 30 days

-- STEP 1 — DRY RUN: count how many rows will be affected
SELECT COUNT(*) AS to_mark
FROM projects p
WHERE p.deleted_at IS NULL
  AND p.settings_snapshot->'selected_channels' @> '["blog"]'::jsonb
  AND p.updated_at < NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM contents c
    WHERE c.project_id = p.id
      AND c.channel = 'blog'
  );

-- STEP 2 — PREVIEW: show the rows that would be affected (max 100)
SELECT p.id, p.user_id, p.keyword_text, p.updated_at, p.current_step, p.status
FROM projects p
WHERE p.deleted_at IS NULL
  AND p.settings_snapshot->'selected_channels' @> '["blog"]'::jsonb
  AND p.updated_at < NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM contents c
    WHERE c.project_id = p.id
      AND c.channel = 'blog'
  )
ORDER BY p.updated_at DESC
LIMIT 100;

-- STEP 3 — SNAPSHOT to deleted_projects archive table before marking
-- Records rows into archive so 30-day recovery works
INSERT INTO deleted_projects (
  original_project_id, user_id, deleted_by_user_id, keyword_text,
  original_status, settings_snapshot, step_status, content_ids,
  deletion_reason
)
SELECT
  p.id, p.user_id, NULL, p.keyword_text,
  p.status, p.settings_snapshot, p.step_status, p.content_ids,
  'auto_cleanup_blogless_30d'
FROM projects p
WHERE p.deleted_at IS NULL
  AND p.settings_snapshot->'selected_channels' @> '["blog"]'::jsonb
  AND p.updated_at < NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM contents c
    WHERE c.project_id = p.id
      AND c.channel = 'blog'
  );

-- STEP 4 — MARK as deleted (use the same NOW() timestamp)
-- Capture timestamp in a variable so rollback is possible
DO $$
DECLARE
  mark_timestamp TIMESTAMPTZ := NOW();
  affected_count INT;
BEGIN
  UPDATE projects p
  SET deleted_at = mark_timestamp
  WHERE p.deleted_at IS NULL
    AND p.settings_snapshot->'selected_channels' @> '["blog"]'::jsonb
    AND p.updated_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM contents c
      WHERE c.project_id = p.id
        AND c.channel = 'blog'
    );

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Marked % projects as soft-deleted at %', affected_count, mark_timestamp;
END $$;

-- ROLLBACK (if needed, run immediately with the timestamp from above):
-- UPDATE projects SET deleted_at = NULL WHERE deleted_at = '<exact timestamp from RAISE NOTICE>';
-- DELETE FROM deleted_projects WHERE deletion_reason = 'auto_cleanup_blogless_30d' AND deleted_at > '<timestamp - 1 minute>';
