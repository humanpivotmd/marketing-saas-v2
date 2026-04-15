-- ============================================
-- 006: action_logs 테이블 추가
-- 목적: 관리자 행동 감사 로그 분리
--   (기존에 usage_logs에 섞여 있던 admin_* action_type을 전용 테이블로)
-- 결정 사항 (2026-04-15 승인):
--   - RLS 없음 (자체 JWT 인증이라 auth.uid()가 null 반환, 앱 레벨 requireAdmin에서 보호)
--   - ip_address / user_agent 수집 안 함 (metadata JSONB에 필요 시 추가)
--   - 기존 usage_logs 데이터는 유지 (혼재 기간 허용)
-- ============================================

CREATE TABLE IF NOT EXISTS action_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action         VARCHAR(50) NOT NULL
                 CHECK (action IN (
                   'password_reset',
                   'role_change',
                   'status_change',
                   'usage_grant',
                   'user_delete',
                   'user_unlock'
                 )),
  metadata       JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_action_logs_admin_id    ON action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_target_user ON action_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action      ON action_logs(action);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at  ON action_logs(created_at DESC);

-- RLS는 비활성 (애플리케이션 레벨 requireAdmin으로 보호)
-- service_role key 사용 시 RLS 우회되므로 사실상 영향 없음
ALTER TABLE action_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE action_logs IS '관리자 행동 감사 로그. 앱 레벨 requireAdmin으로 보호됨.';
COMMENT ON COLUMN action_logs.admin_id IS '작업을 수행한 관리자 user id';
COMMENT ON COLUMN action_logs.target_user_id IS '작업 대상 user id (nullable)';
COMMENT ON COLUMN action_logs.action IS 'password_reset|role_change|status_change|usage_grant|user_delete|user_unlock';
COMMENT ON COLUMN action_logs.metadata IS '추가 컨텍스트 (before/after, reason 등)';
