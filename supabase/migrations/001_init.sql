-- ============================================
-- MarketingFlow v2 Database Schema
-- ============================================

-- 001: plans
CREATE TABLE IF NOT EXISTS plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(50) NOT NULL UNIQUE,
  display_name        VARCHAR(100) NOT NULL,
  price_monthly       INTEGER DEFAULT 0,
  price_yearly        INTEGER DEFAULT 0,
  content_limit       INTEGER DEFAULT 10,
  keyword_limit       INTEGER DEFAULT 20,
  image_limit         INTEGER DEFAULT 5,
  saved_keyword_limit INTEGER DEFAULT 20,
  channel_limit       INTEGER DEFAULT 1,
  brand_voice_limit   INTEGER DEFAULT 1,
  team_member_limit   INTEGER DEFAULT 0,
  history_days        INTEGER DEFAULT 30,
  has_api_access      BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  sort_order          INTEGER DEFAULT 0,
  effective_from      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 002: users
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  role              VARCHAR(20) DEFAULT 'user'
                    CHECK (role IN ('user', 'member', 'team_admin', 'admin', 'super_admin')),
  status            VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'suspended')),
  email_verified    BOOLEAN DEFAULT FALSE,
  verify_token      VARCHAR(255),
  reset_token       VARCHAR(255),
  reset_expires     TIMESTAMPTZ,
  avatar_url        VARCHAR(500),
  plan_id           UUID REFERENCES plans(id) ON DELETE SET NULL,
  plan_started_at   TIMESTAMPTZ,
  plan_expires_at   TIMESTAMPTZ,
  onboarding_done   BOOLEAN DEFAULT FALSE,
  experience_level  VARCHAR(20) DEFAULT 'beginner'
                    CHECK (experience_level IN ('beginner', 'expert')),
  pending_plan_id   UUID REFERENCES plans(id),
  pending_plan_at   TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 003: brand_voices
CREATE TABLE IF NOT EXISTS brand_voices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  industry        VARCHAR(50),
  tone            VARCHAR(50),
  description     TEXT,
  target_audience TEXT,
  keywords        TEXT[],
  banned_words    TEXT[],
  required_words  TEXT[],
  sample_content  TEXT,
  is_default      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 004: keywords
CREATE TABLE IF NOT EXISTS keywords (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword               VARCHAR(200) NOT NULL,
  monthly_search        INTEGER,
  monthly_search_mobile INTEGER,
  monthly_search_pc     INTEGER,
  competition           VARCHAR(10),
  cpc                   INTEGER,
  grade                 VARCHAR(5),
  group_name            VARCHAR(100),
  trend_data            JSONB,
  last_analyzed         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 005: contents
CREATE TABLE IF NOT EXISTS contents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_voice_id   UUID REFERENCES brand_voices(id) ON DELETE SET NULL,
  keyword_id       UUID REFERENCES keywords(id) ON DELETE SET NULL,
  type             VARCHAR(20) NOT NULL
                   CHECK (type IN ('blog', 'threads', 'instagram', 'script')),
  title            VARCHAR(500),
  body             TEXT NOT NULL,
  hashtags         TEXT[],
  meta_description VARCHAR(300),
  tone             VARCHAR(50),
  word_count       INTEGER,
  status           VARCHAR(20) DEFAULT 'draft'
                   CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  version          INTEGER DEFAULT 1,
  parent_id        UUID REFERENCES contents(id) ON DELETE SET NULL,
  ai_model         VARCHAR(50),
  ai_prompt_used   TEXT,
  seo_score        INTEGER,
  prompt_version_id UUID,
  outline          JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 006: images
CREATE TABLE IF NOT EXISTS images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id    UUID REFERENCES contents(id) ON DELETE SET NULL,
  prompt        TEXT NOT NULL,
  style         VARCHAR(50),
  size          VARCHAR(20),
  storage_path  VARCHAR(500) NOT NULL,
  public_url    VARCHAR(500),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 007: channels
CREATE TABLE IF NOT EXISTS channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform        VARCHAR(20) NOT NULL
                  CHECK (platform IN ('instagram', 'threads', 'youtube', 'naver_blog', 'kakao')),
  account_name    VARCHAR(200),
  account_id      VARCHAR(200),
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires   TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 008: schedules
CREATE TABLE IF NOT EXISTS schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  channel_id      UUID REFERENCES channels(id) ON DELETE SET NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  published_at    TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  error_message   TEXT,
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 009: usage_logs
CREATE TABLE IF NOT EXISTS usage_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type   VARCHAR(50) NOT NULL
                CHECK (action_type IN ('content_create', 'keyword_analyze', 'image_generate', 'publish')),
  content_type  VARCHAR(20),
  ai_model      VARCHAR(50),
  tokens_used   INTEGER,
  estimated_cost DECIMAL(10,4),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 010: payments
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES plans(id) ON DELETE SET NULL,
  amount          INTEGER NOT NULL,
  billing_cycle   VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')),
  payment_method  VARCHAR(50),
  payment_key     VARCHAR(200),
  status          VARCHAR(20) DEFAULT 'completed'
                  CHECK (status IN ('completed', 'refunded', 'failed')),
  paid_at         TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 011: admin_prompts
CREATE TABLE IF NOT EXISTS admin_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step          VARCHAR(50) NOT NULL,
  version       INTEGER DEFAULT 1,
  prompt_text   TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT FALSE,
  traffic_ratio INTEGER DEFAULT 100,
  metrics       JSONB DEFAULT '{}',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 012: email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  to_email    VARCHAR(255) NOT NULL,
  subject     VARCHAR(500),
  template    VARCHAR(50),
  status      VARCHAR(20) DEFAULT 'sent',
  resend_id   VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 013: brand_voice_presets
CREATE TABLE IF NOT EXISTS brand_voice_presets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry    VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  tone        VARCHAR(50) NOT NULL,
  description TEXT,
  keywords    TEXT[],
  sample_content TEXT
);

-- 014: keyword_opportunities
CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword           VARCHAR(200) NOT NULL,
  industry          VARCHAR(50) NOT NULL,
  opportunity_score INTEGER NOT NULL,
  search_volume     INTEGER,
  competition_level VARCHAR(20),
  trend_direction   VARCHAR(20)
                    CHECK (trend_direction IN ('rising', 'stable', 'declining')),
  calculated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword, industry)
);

-- 015: content_metrics
CREATE TABLE IF NOT EXISTS content_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  channel_id  UUID REFERENCES channels(id) ON DELETE SET NULL,
  views       INTEGER DEFAULT 0,
  likes       INTEGER DEFAULT 0,
  comments    INTEGER DEFAULT 0,
  shares      INTEGER DEFAULT 0,
  fetched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 016: support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject     VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

CREATE INDEX IF NOT EXISTS idx_brand_voices_user ON brand_voices(user_id);

CREATE INDEX IF NOT EXISTS idx_keywords_user ON keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_user_group ON keywords(user_id, group_name);
CREATE INDEX IF NOT EXISTS idx_keywords_grade ON keywords(grade);

CREATE INDEX IF NOT EXISTS idx_contents_user_status ON contents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_user_created ON contents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_keyword ON contents(keyword_id);

CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_content ON images(content_id);

CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_platform ON channels(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_schedules_status_time ON schedules(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_content ON schedules(content_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action_date ON usage_logs(user_id, action_type, created_at);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_admin_prompts_step_active ON admin_prompts(step, is_active);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_keyword_opps_industry ON keyword_opportunities(industry);
CREATE INDEX IF NOT EXISTS idx_keyword_opps_score ON keyword_opportunities(opportunity_score DESC);

CREATE INDEX IF NOT EXISTS idx_content_metrics_content ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_fetched ON content_metrics(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- plans: everyone can read, admin can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plans_read_all') THEN
    CREATE POLICY "plans_read_all" ON plans FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plans_admin_write') THEN
    CREATE POLICY "plans_admin_write" ON plans FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- users: own data + admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own') THEN
    CREATE POLICY "users_read_own" ON users FOR SELECT USING (
      id = auth.uid()
      OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());
  END IF;
END $$;

-- brand_voices: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'brand_voices_user') THEN
    CREATE POLICY "brand_voices_user" ON brand_voices FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- keywords: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'keywords_user') THEN
    CREATE POLICY "keywords_user" ON keywords FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- contents: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contents_user') THEN
    CREATE POLICY "contents_user" ON contents FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- images: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_user') THEN
    CREATE POLICY "images_user" ON images FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- channels: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'channels_user') THEN
    CREATE POLICY "channels_user" ON channels FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- schedules: own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'schedules_user') THEN
    CREATE POLICY "schedules_user" ON schedules FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- usage_logs: own read + admin read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_logs_read_own') THEN
    CREATE POLICY "usage_logs_read_own" ON usage_logs FOR SELECT USING (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_logs_insert') THEN
    CREATE POLICY "usage_logs_insert" ON usage_logs FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- payments: own read, admin all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_read_own') THEN
    CREATE POLICY "payments_read_own" ON payments FOR SELECT USING (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- admin_prompts: admin only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_prompts_admin') THEN
    CREATE POLICY "admin_prompts_admin" ON admin_prompts FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- email_logs: admin only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_logs_admin') THEN
    CREATE POLICY "email_logs_admin" ON email_logs FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- brand_voice_presets: everyone reads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'brand_voice_presets_read') THEN
    CREATE POLICY "brand_voice_presets_read" ON brand_voice_presets FOR SELECT USING (true);
  END IF;
END $$;

-- keyword_opportunities: everyone reads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'keyword_opps_read') THEN
    CREATE POLICY "keyword_opps_read" ON keyword_opportunities FOR SELECT USING (true);
  END IF;
END $$;

-- content_metrics: own content's metrics
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_metrics_user') THEN
    CREATE POLICY "content_metrics_user" ON content_metrics FOR SELECT USING (
      EXISTS (SELECT 1 FROM contents WHERE contents.id = content_metrics.content_id AND contents.user_id = auth.uid())
    );
  END IF;
END $$;

-- support_tickets: own tickets + admin all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'support_tickets_user_read') THEN
    CREATE POLICY "support_tickets_user_read" ON support_tickets FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'support_tickets_user_create') THEN
    CREATE POLICY "support_tickets_user_create" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'support_tickets_admin') THEN
    CREATE POLICY "support_tickets_admin" ON support_tickets FOR ALL USING (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'users'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'brand_voices'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON brand_voices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'contents'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'channels'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
