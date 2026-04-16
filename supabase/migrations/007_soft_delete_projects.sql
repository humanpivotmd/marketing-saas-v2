-- 007_soft_delete_projects.sql
-- Soft delete infrastructure for projects
-- Adds deleted_at column, supporting indices, and deleted_projects archive table

-- 1. Add deleted_at column to projects (nullable, NULL = active)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Partial index for quickly listing active vs deleted projects
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at
  ON projects(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- 3. Composite index on contents(project_id, channel) for blog-less detection query
-- Replaces idx_contents_project which becomes redundant (prefix-matched)
DROP INDEX IF EXISTS idx_contents_project;
CREATE INDEX IF NOT EXISTS idx_contents_project_channel
  ON contents(project_id, channel);

-- 4. Archive table for 30-day recovery window
CREATE TABLE IF NOT EXISTS deleted_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  deleted_by_user_id UUID,
  keyword_text TEXT,
  original_status VARCHAR(20),
  settings_snapshot JSONB,
  step_status JSONB,
  content_ids JSONB,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restoration_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  deletion_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_projects_user
  ON deleted_projects(user_id, deleted_at DESC);

-- Regular index (not partial): NOW() is STABLE not IMMUTABLE, cannot be in predicate.
-- Cron cleanup will query WHERE restoration_deadline < NOW() — plain btree suffices.
CREATE INDEX IF NOT EXISTS idx_deleted_projects_deadline
  ON deleted_projects(restoration_deadline);
