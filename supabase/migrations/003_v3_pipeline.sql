-- ============================================
-- MarketingFlow v3 — 7단계 콘텐츠 생성 파이프라인
-- ============================================

-- ■ 1. users 테이블 확장 — B2B/B2C + 마이페이지 설정
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(10) DEFAULT 'B2C'
    CHECK (business_type IN ('B2B', 'B2C')),
  ADD COLUMN IF NOT EXISTS selected_channels TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS target_gender VARCHAR(10) DEFAULT 'all'
    CHECK (target_gender IN ('male', 'female', 'all')),
  ADD COLUMN IF NOT EXISTS fixed_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blog_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS industry_id UUID,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS service_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS writing_tone VARCHAR(50) DEFAULT 'auto';

-- ■ 2. industries — 업종 마스터 (관리자 CRUD)
CREATE TABLE IF NOT EXISTS industries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES industries(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  level         INTEGER NOT NULL DEFAULT 1
                CHECK (level IN (1, 2, 3)),
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ■ 3. contents 테이블 확장 — facebook + video_script + project_id + status 확장
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_type_check;
ALTER TABLE contents ADD CONSTRAINT contents_type_check
  CHECK (type IN ('blog', 'threads', 'instagram', 'facebook', 'video_script', 'script'));

ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_status_check;
ALTER TABLE contents ADD CONSTRAINT contents_status_check
  CHECK (status IN ('draft', 'generated', 'confirmed', 'edited', 'scheduled', 'published', 'failed'));

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_note TEXT;

-- ■ 4. channels 테이블 확장 — facebook
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_platform_check;
ALTER TABLE channels ADD CONSTRAINT channels_platform_check
  CHECK (platform IN ('instagram', 'threads', 'youtube', 'naver_blog', 'kakao', 'facebook'));

-- ■ 5. usage_logs 확장 — 새 action 타입
ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS usage_logs_action_type_check;
ALTER TABLE usage_logs ADD CONSTRAINT usage_logs_action_type_check
  CHECK (action_type IN (
    'content_create', 'keyword_analyze', 'image_generate', 'publish',
    'draft_generate', 'title_generate', 'image_script_generate', 'video_script_generate',
    'quality_score', 'content_revise'
  ));

-- ■ 6. projects — 7단계 작업 세션
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword_id      UUID REFERENCES keywords(id) ON DELETE SET NULL,
  keyword_text    VARCHAR(200),
  business_type   VARCHAR(10) NOT NULL DEFAULT 'B2C'
                  CHECK (business_type IN ('B2B', 'B2C')),
  current_step    INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  step_status     JSONB NOT NULL DEFAULT '{
    "s1": "pending", "s2": "pending", "s3": "pending",
    "s4": "pending", "s5": "pending", "s6": "pending", "s7": "pending"
  }',
  -- STEP3 초안 정보
  topic_type      VARCHAR(30)
                  CHECK (topic_type IN ('info', 'intro', 'service', 'product')),
  selected_title  VARCHAR(500),
  title_candidates JSONB,
  custom_prompt   TEXT,
  prompt_mode     VARCHAR(20) DEFAULT 'combine'
                  CHECK (prompt_mode IN ('priority', 'combine', 'reference')),
  -- STEP4 초안
  draft_content   TEXT,
  -- 채널별 콘텐츠 ID 매핑
  content_ids     JSONB DEFAULT '{}',
  -- 설정 스냅샷
  settings_snapshot JSONB,
  status          VARCHAR(20) DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'archived')),
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- contents.project_id FK
ALTER TABLE contents
  ADD CONSTRAINT IF NOT EXISTS fk_contents_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- users.industry_id FK
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS fk_users_industry
  FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE SET NULL;

-- ■ 7. image_scripts — STEP6 이미지 프롬프트
CREATE TABLE IF NOT EXISTS image_scripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES contents(id) ON DELETE SET NULL,
  channel         VARCHAR(20) NOT NULL,
  ai_tool         VARCHAR(50) NOT NULL DEFAULT 'midjourney',
  image_size      VARCHAR(30) NOT NULL DEFAULT '1080x1080',
  image_style     VARCHAR(20) NOT NULL DEFAULT 'photo'
                  CHECK (image_style IN ('photo', 'illustration')),
  style_detail    VARCHAR(100),
  prompts         JSONB NOT NULL DEFAULT '[]',
  thumbnail_prompt TEXT,
  status          VARCHAR(20) DEFAULT 'generated'
                  CHECK (status IN ('generating', 'generated', 'edited')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ■ 8. video_scripts — STEP7 영상 스토리보드
CREATE TABLE IF NOT EXISTS video_scripts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES contents(id) ON DELETE SET NULL,
  format          VARCHAR(20) NOT NULL DEFAULT 'short'
                  CHECK (format IN ('short', 'normal')),
  target_channel  VARCHAR(20) NOT NULL DEFAULT 'youtube',
  scene_count     INTEGER NOT NULL DEFAULT 4
                  CHECK (scene_count BETWEEN 1 AND 5),
  scene_duration  INTEGER NOT NULL DEFAULT 5
                  CHECK (scene_duration BETWEEN 3 AND 10),
  total_duration  INTEGER,
  image_style     VARCHAR(20) DEFAULT 'photo'
                  CHECK (image_style IN ('photo', 'illustration')),
  style_detail    VARCHAR(100),
  storyboard      JSONB NOT NULL DEFAULT '[]',
  full_script     TEXT,
  status          VARCHAR(20) DEFAULT 'generated'
                  CHECK (status IN ('generating', 'generated', 'edited')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ■ 9. user_prompts — 커스텀 프롬프트 (채널별)
CREATE TABLE IF NOT EXISTS user_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step          VARCHAR(30) NOT NULL,
  prompt_text   TEXT NOT NULL,
  mode          VARCHAR(20) DEFAULT 'combine'
                CHECK (mode IN ('priority', 'combine', 'reference')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_industries_parent ON industries(parent_id);
CREATE INDEX IF NOT EXISTS idx_industries_level ON industries(level, sort_order);
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_keyword ON projects(keyword_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_contents_project ON contents(project_id);

CREATE INDEX IF NOT EXISTS idx_image_scripts_project ON image_scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_image_scripts_user ON image_scripts(user_id);

CREATE INDEX IF NOT EXISTS idx_video_scripts_project ON video_scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_video_scripts_user ON video_scripts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_prompts_user ON user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_step ON user_prompts(user_id, step);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- industries: everyone reads, admin writes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'industries_read_all') THEN
    CREATE POLICY "industries_read_all" ON industries FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'industries_admin_write') THEN
    CREATE POLICY "industries_admin_write" ON industries FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- projects: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'projects_user') THEN
    CREATE POLICY "projects_user" ON projects FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- image_scripts: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'image_scripts_user') THEN
    CREATE POLICY "image_scripts_user" ON image_scripts FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- video_scripts: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'video_scripts_user') THEN
    CREATE POLICY "video_scripts_user" ON video_scripts FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- user_prompts: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_prompts_user') THEN
    CREATE POLICY "user_prompts_user" ON user_prompts FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- TRIGGERS
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'projects'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'industries'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON industries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'image_scripts'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON image_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'video_scripts'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON video_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'user_prompts'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- SEED: 업종 마스터 데이터
-- ============================================

INSERT INTO industries (id, parent_id, name, level, sort_order) VALUES
  -- 대분류 (level 1)
  (gen_random_uuid(), NULL, '음식업', 1, 1),
  (gen_random_uuid(), NULL, '뷰티/헬스', 1, 2),
  (gen_random_uuid(), NULL, '의료', 1, 3),
  (gen_random_uuid(), NULL, '교육', 1, 4),
  (gen_random_uuid(), NULL, '숙박/여행', 1, 5),
  (gen_random_uuid(), NULL, '인테리어/건설', 1, 6),
  (gen_random_uuid(), NULL, '자동차', 1, 7),
  (gen_random_uuid(), NULL, '반려동물', 1, 8),
  (gen_random_uuid(), NULL, '전문직', 1, 9),
  (gen_random_uuid(), NULL, '소매/쇼핑몰', 1, 10),
  (gen_random_uuid(), NULL, '교회/종교', 1, 11),
  (gen_random_uuid(), NULL, '공공/기관', 1, 12),
  (gen_random_uuid(), NULL, 'IT/테크', 1, 13),
  (gen_random_uuid(), NULL, '제조업', 1, 14)
ON CONFLICT DO NOTHING;

-- 중분류는 관리자가 추가 (admin CRUD)

-- ============================================
-- plans 4단계 확장 seed (002_seed.sql 보완)
-- ============================================

-- starter 플랜 추가 (없는 경우만)
INSERT INTO plans (name, display_name, price_monthly, price_yearly,
  content_limit, keyword_limit, image_limit, saved_keyword_limit,
  channel_limit, brand_voice_limit, team_member_limit, history_days,
  has_api_access, has_priority_support, sort_order)
SELECT 'starter', '스타터', 19900, 199000,
  50, 100, 30, 100, 3, 3, 0, 90,
  TRUE, FALSE, 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'starter');

-- premium 플랜 추가 (없는 경우만)
INSERT INTO plans (name, display_name, price_monthly, price_yearly,
  content_limit, keyword_limit, image_limit, saved_keyword_limit,
  channel_limit, brand_voice_limit, team_member_limit, history_days,
  has_api_access, has_priority_support, sort_order)
SELECT 'premium', '프리미엄', 0, 0,
  9999, 9999, 9999, 9999, 9999, 9999, 10, 9999,
  TRUE, TRUE, 4
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'premium');
