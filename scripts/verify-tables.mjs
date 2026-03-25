const URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

for (const t of ['projects', 'industries', 'image_scripts', 'video_scripts', 'user_prompts', 'contents', 'users']) {
  const r = await fetch(`${URL}/rest/v1/${t}?select=id&limit=1`, { headers: H })
  const body = await r.text()
  console.log(`${t}: ${r.status} ${r.status !== 200 ? body.slice(0, 100) : 'OK'}`)
}

// Check users columns
const r2 = await fetch(`${URL}/rest/v1/users?select=business_type,selected_channels&limit=1`, { headers: H })
console.log(`users v3 cols: ${r2.status} ${r2.status !== 200 ? await r2.text() : 'OK'}`)

// Check contents columns
const r3 = await fetch(`${URL}/rest/v1/contents?select=project_id,confirmed_at&limit=1`, { headers: H })
console.log(`contents v3 cols: ${r3.status} ${r3.status !== 200 ? await r3.text() : 'OK'}`)
