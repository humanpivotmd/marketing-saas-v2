const URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function run(label, sql) {
  const r = await fetch(`${URL}/rest/v1/rpc/run_migration`, { method: 'POST', headers: H, body: JSON.stringify({ sql }) })
  const t = await r.text()
  console.log(`[${r.status === 204 ? 'OK' : r.status}] ${label}${r.status !== 204 ? ' ' + t : ''}`)
}

// projects.keyword_id FK가 Supabase에 인식되는지 확인
await run('check FK', `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'projects' AND constraint_type = 'FOREIGN KEY'`)

// FK가 없으면 추가
await run('add FK keyword', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'projects' AND constraint_name = 'projects_keyword_id_fkey') THEN ALTER TABLE projects ADD CONSTRAINT projects_keyword_id_fkey FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE SET NULL; END IF; END $$`)

await run('add FK user', `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'projects' AND constraint_name = 'projects_user_id_fkey') THEN ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; END IF; END $$`)

// PostgREST schema cache reload
await run('reload schema', `NOTIFY pgrst, 'reload schema'`)

// Test direct query
const r = await fetch(`${URL}/rest/v1/projects?select=id,keyword_text,business_type&limit=1`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } })
console.log('Direct query:', r.status, await r.text())

// Test with join
const r2 = await fetch(`${URL}/rest/v1/projects?select=*,keywords(keyword,grade)&limit=1`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } })
console.log('Join query:', r2.status, (await r2.text()).slice(0, 200))
