-- 012_fix_action_logs_admin_fk.sql
-- admin_id NOT NULL + ON DELETE SET NULL 모순 수정
-- admin 삭제 시 감사 로그 보존을 위해 ON DELETE RESTRICT로 변경

ALTER TABLE action_logs
  DROP CONSTRAINT IF EXISTS action_logs_admin_id_fkey;

ALTER TABLE action_logs
  ADD CONSTRAINT action_logs_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT;
