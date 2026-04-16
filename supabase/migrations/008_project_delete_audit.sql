-- 008_project_delete_audit.sql
-- Allow 'project_delete' action in action_logs CHECK constraint
-- Per @checker caveat: use metadata JSONB for project_id, do NOT add new FK column

ALTER TABLE action_logs
  DROP CONSTRAINT IF EXISTS action_logs_action_check;

ALTER TABLE action_logs
  ADD CONSTRAINT action_logs_action_check
  CHECK (action IN (
    'password_reset',
    'role_change',
    'status_change',
    'usage_grant',
    'user_delete',
    'user_unlock',
    'project_delete'
  ));
