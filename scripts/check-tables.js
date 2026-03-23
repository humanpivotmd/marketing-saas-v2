const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: 'public' }
})

async function check() {
  // Query information_schema to see actual tables
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .limit(5)

  console.log('Users query:', error ? `ERROR: ${error.message}` : JSON.stringify(data, null, 2))

  // Try to read from works (old v1 table)
  const { data: works, error: worksErr } = await supabase
    .from('works')
    .select('id')
    .limit(1)

  console.log('Works (v1) query:', worksErr ? `ERROR: ${worksErr.message}` : `${works?.length} rows`)

  // Check plans table specifically
  const { data: plans, error: plansErr } = await supabase
    .from('plans')
    .select('*')
    .limit(1)

  console.log('Plans query:', plansErr ? `ERROR: ${plansErr.message}` : JSON.stringify(plans, null, 2))

  // Try usage_logs - which showed 79 rows
  const { data: logs, error: logsErr } = await supabase
    .from('usage_logs')
    .select('*')
    .limit(2)

  console.log('Usage logs:', logsErr ? `ERROR: ${logsErr.message}` : JSON.stringify(logs, null, 2))
}

check().catch(console.error)
