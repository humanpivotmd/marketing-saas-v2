const URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function run(label, sql) {
  const r = await fetch(`${URL}/rest/v1/rpc/run_migration`, { method: 'POST', headers: H, body: JSON.stringify({ sql }) })
  console.log(`[${r.status === 204 ? 'OK' : r.status}] ${label}`)
}

await run('scheduled_date', `ALTER TABLE contents ADD COLUMN IF NOT EXISTS scheduled_date DATE`)
await run('index', `CREATE INDEX IF NOT EXISTS idx_contents_scheduled ON contents(scheduled_date) WHERE scheduled_date IS NOT NULL`)
console.log('DONE')
