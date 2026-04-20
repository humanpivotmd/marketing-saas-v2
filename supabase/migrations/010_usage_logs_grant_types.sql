-- 010_usage_logs_grant_types.sql
-- usage_logs.action_type CHECK에 _grant 타입 추가
-- admin usage-grant API에서 INSERT 시 CHECK 위반 방지

ALTER TABLE usage_logs
  DROP CONSTRAINT IF EXISTS usage_logs_action_type_check;

ALTER TABLE usage_logs
  ADD CONSTRAINT usage_logs_action_type_check
  CHECK (action_type IN (
    'content_create', 'keyword_analyze', 'image_generate', 'publish',
    'draft_generate', 'title_generate', 'image_script_generate', 'video_script_generate',
    'quality_score', 'content_revise',
    'content_create_grant', 'keyword_analyze_grant', 'image_generate_grant'
  ));
