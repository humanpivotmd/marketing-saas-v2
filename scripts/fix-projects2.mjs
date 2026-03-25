const URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function run(label, sql) {
  const r = await fetch(`${URL}/rest/v1/rpc/run_migration`, { method: 'POST', headers: H, body: JSON.stringify({ sql }) })
  const t = await r.text()
  console.log(`[${r.status === 204 ? 'OK' : r.status}] ${label}${r.status !== 204 ? ' ' + t : ''}`)
}

// 현재 projects 테이블 컬럼 확인
await run('check cols', `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND table_schema = 'public' ORDER BY ordinal_position`)

// 테이블을 DROP하고 다시 생성 (데이터 없으므로 안전)
await run('drop projects', `DROP TABLE IF EXISTS projects CASCADE`)

// 다시 생성
await run('create projects', `CREATE TABLE projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL, keyword_text VARCHAR(200), business_type VARCHAR(10) NOT NULL DEFAULT 'B2C' CHECK (business_type IN ('B2B', 'B2C')), current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7), step_status JSONB NOT NULL DEFAULT '{"s1":"pending","s2":"pending","s3":"pending","s4":"pending","s5":"pending","s6":"pending","s7":"pending"}', topic_type VARCHAR(30) CHECK (topic_type IN ('info', 'intro', 'service', 'product')), selected_title VARCHAR(500), title_candidates JSONB, custom_prompt TEXT, prompt_mode VARCHAR(20) DEFAULT 'combine' CHECK (prompt_mode IN ('priority', 'combine', 'reference')), draft_content TEXT, content_ids JSONB DEFAULT '{}', settings_snapshot JSONB, status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')), confirmed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`)

// image_scripts/video_scripts도 재생성 (projects FK 의존)
await run('drop image_scripts', `DROP TABLE IF EXISTS image_scripts CASCADE`)
await run('create image_scripts', `CREATE TABLE image_scripts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, content_id UUID REFERENCES contents(id) ON DELETE SET NULL, channel VARCHAR(20) NOT NULL, ai_tool VARCHAR(50) NOT NULL DEFAULT 'midjourney', image_size VARCHAR(30) NOT NULL DEFAULT '1080x1080', image_style VARCHAR(20) NOT NULL DEFAULT 'photo' CHECK (image_style IN ('photo', 'illustration')), style_detail VARCHAR(100), prompts JSONB NOT NULL DEFAULT '[]', thumbnail_prompt TEXT, status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'edited')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`)

await run('drop video_scripts', `DROP TABLE IF EXISTS video_scripts CASCADE`)
await run('create video_scripts', `CREATE TABLE video_scripts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, content_id UUID REFERENCES contents(id) ON DELETE SET NULL, format VARCHAR(20) NOT NULL DEFAULT 'short' CHECK (format IN ('short', 'normal')), target_channel VARCHAR(20) NOT NULL DEFAULT 'youtube', scene_count INTEGER NOT NULL DEFAULT 4 CHECK (scene_count BETWEEN 1 AND 5), scene_duration INTEGER NOT NULL DEFAULT 5 CHECK (scene_duration BETWEEN 3 AND 10), total_duration INTEGER, image_style VARCHAR(20) DEFAULT 'photo' CHECK (image_style IN ('photo', 'illustration')), style_detail VARCHAR(100), storyboard JSONB NOT NULL DEFAULT '[]', full_script TEXT, status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'edited')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`)

// contents.project_id FK
await run('fk contents', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_contents_project') THEN ALTER TABLE contents ADD CONSTRAINT fk_contents_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL; END IF; END $$`)

// RLS + indexes
await run('rls', `ALTER TABLE projects ENABLE ROW LEVEL SECURITY; ALTER TABLE image_scripts ENABLE ROW LEVEL SECURITY; ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY`)
await run('policy projects', `CREATE POLICY projects_user ON projects FOR ALL USING (true)`)
await run('policy image_scripts', `CREATE POLICY image_scripts_user ON image_scripts FOR ALL USING (true)`)
await run('policy video_scripts', `CREATE POLICY video_scripts_user ON video_scripts FOR ALL USING (true)`)
await run('indexes', `CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id); CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status); CREATE INDEX IF NOT EXISTS idx_projects_keyword ON projects(keyword_id); CREATE INDEX IF NOT EXISTS idx_image_scripts_project ON image_scripts(project_id); CREATE INDEX IF NOT EXISTS idx_video_scripts_project ON video_scripts(project_id)`)
await run('trigger', `CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at()`)
await run('reload', `NOTIFY pgrst, 'reload schema'`)

// Verify
console.log('\n--- Verify ---')
const r1 = await fetch(`${URL}/rest/v1/projects?select=id,keyword_text,business_type,current_step&limit=1`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } })
console.log('projects:', r1.status, await r1.text())

const r2 = await fetch(`${URL}/rest/v1/projects?select=*,keywords(keyword,grade)&limit=1`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } })
console.log('projects+join:', r2.status, (await r2.text()).slice(0, 200))

console.log('\n=== DONE ===')
