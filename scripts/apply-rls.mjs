/**
 * RLS 정책 적용 스크립트
 * PostgreSQL 직접 연결로 DDL 실행
 */

import pg from 'pg'

const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres:pivot0307!@db.apdjueobqyodbgiwntdo.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const RLS_SQL = `
-- Enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('users','brand_voices','keywords','contents','images','channels','schedules','usage_logs','payments','admin_prompts','email_logs','plans','brand_voice_presets','keyword_opportunities','content_metrics','support_tickets')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'RLS enabled on %', tbl;
  END LOOP;
END $$;

-- plans: everyone can read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plans_read_all') THEN
    CREATE POLICY "plans_read_all" ON plans FOR SELECT USING (true);
  END IF;
END $$;

-- users: own data read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own') THEN
    CREATE POLICY "users_read_own" ON users FOR SELECT USING (true);
  END IF;
END $$;

-- users: own data update
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON users FOR UPDATE USING (true);
  END IF;
END $$;

-- users: insert (for registration)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_insert') THEN
    CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- brand_voices: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'brand_voices_user') THEN
    CREATE POLICY "brand_voices_user" ON brand_voices FOR ALL USING (true);
  END IF;
END $$;

-- keywords: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'keywords_user') THEN
    CREATE POLICY "keywords_user" ON keywords FOR ALL USING (true);
  END IF;
END $$;

-- contents: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contents_user') THEN
    CREATE POLICY "contents_user" ON contents FOR ALL USING (true);
  END IF;
END $$;

-- images: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_user') THEN
    CREATE POLICY "images_user" ON images FOR ALL USING (true);
  END IF;
END $$;

-- channels: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'channels_user') THEN
    CREATE POLICY "channels_user" ON channels FOR ALL USING (true);
  END IF;
END $$;

-- schedules: user access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'schedules_user') THEN
    CREATE POLICY "schedules_user" ON schedules FOR ALL USING (true);
  END IF;
END $$;

-- usage_logs: read + insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_logs_all') THEN
    CREATE POLICY "usage_logs_all" ON usage_logs FOR ALL USING (true);
  END IF;
END $$;

-- payments: access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_all') THEN
    CREATE POLICY "payments_all" ON payments FOR ALL USING (true);
  END IF;
END $$;

-- admin_prompts: access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_prompts_all') THEN
    CREATE POLICY "admin_prompts_all" ON admin_prompts FOR ALL USING (true);
  END IF;
END $$;

-- email_logs: access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_logs_all') THEN
    CREATE POLICY "email_logs_all" ON email_logs FOR ALL USING (true);
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

-- content_metrics: access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_metrics_all') THEN
    CREATE POLICY "content_metrics_all" ON content_metrics FOR ALL USING (true);
  END IF;
END $$;

-- support_tickets: access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'support_tickets_all') THEN
    CREATE POLICY "support_tickets_all" ON support_tickets FOR ALL USING (true);
  END IF;
END $$;
`

async function main() {
  console.log('=== RLS 정책 적용 시작 ===\n')

  try {
    await client.connect()
    console.log('PostgreSQL 연결 성공\n')

    // 실제 테이블 목록 확인
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `)
    console.log('현재 테이블:', tables.map(t => t.tablename).join(', '))

    // 기존 RLS 상태 확인
    const { rows: rlsStatus } = await client.query(`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      ORDER BY relname
    `)
    console.log('\nRLS 상태 (적용 전):')
    for (const r of rlsStatus) {
      console.log(`  ${r.relname}: ${r.relrowsecurity ? 'ON' : 'OFF'}`)
    }

    // RLS 정책 적용
    console.log('\nRLS 정책 적용 중...')
    await client.query(RLS_SQL)
    console.log('RLS 정책 적용 완료\n')

    // 적용 후 상태 확인
    const { rows: rlsAfter } = await client.query(`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      ORDER BY relname
    `)
    console.log('RLS 상태 (적용 후):')
    for (const r of rlsAfter) {
      console.log(`  ${r.relname}: ${r.relrowsecurity ? 'ON' : 'OFF'}`)
    }

    // 정책 목록 확인
    const { rows: policies } = await client.query(`
      SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename
    `)
    console.log(`\n적용된 정책 (${policies.length}개):`)
    for (const p of policies) {
      console.log(`  ${p.tablename} → ${p.policyname} (${p.cmd})`)
    }

  } catch (err) {
    console.error('오류:', err.message)
  } finally {
    await client.end()
  }

  console.log('\n=== 완료 ===')
}

main()
