const URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function run(label, sql) {
  const r = await fetch(`${URL}/rest/v1/rpc/run_migration`, { method: 'POST', headers: H, body: JSON.stringify({ sql }) })
  const t = await r.text()
  console.log(`[${r.status === 204 ? 'OK' : r.status}] ${label}${r.status !== 204 ? ' ' + t : ''}`)
}

// 1. update_updated_at function
await run('create_function', `CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`)

// 2. triggers
await run('trigger_projects', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'projects'::regclass) THEN CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$`)
await run('trigger_industries', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'industries'::regclass) THEN CREATE TRIGGER set_updated_at BEFORE UPDATE ON industries FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$`)

// 3. RLS policies for service_role access
await run('policy_industries_admin', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'industries_admin_write') THEN CREATE POLICY industries_admin_write ON industries FOR ALL USING (true); END IF; END $$`)
await run('policy_image_scripts_all', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'image_scripts_all') THEN CREATE POLICY image_scripts_all ON image_scripts FOR ALL USING (true); END IF; END $$`)
await run('policy_video_scripts_all', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'video_scripts_all') THEN CREATE POLICY video_scripts_all ON video_scripts FOR ALL USING (true); END IF; END $$`)

// 4. Check actual column names
await run('check_contents_cols', `SELECT column_name FROM information_schema.columns WHERE table_name = 'contents' AND table_schema = 'public' ORDER BY ordinal_position`)

// Verify all tables
console.log('\n--- Verify ---')
for (const t of ['industries', 'projects', 'image_scripts', 'video_scripts', 'user_prompts']) {
  const r = await fetch(`${URL}/rest/v1/${t}?select=id&limit=1`, { headers: H })
  console.log(`[${r.status === 200 ? 'OK' : r.status}] ${t}`)
}
console.log('\n=== FIX COMPLETE ===')
