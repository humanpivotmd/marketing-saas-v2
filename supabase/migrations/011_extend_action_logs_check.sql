-- 011_extend_action_logs_check.sql
-- action_logs.action CHECK에 prompt_activate, plan_limit_change 추가
-- admin prompts/activate, plan-limits PUT에서 감사 로그 기록용

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
    'project_delete',
    'prompt_activate',
    'plan_limit_change'
  ));
