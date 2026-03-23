const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// First, create the exec_sql function via Supabase management API
async function createExecSqlFunction() {
  // Try the Supabase management API endpoint
  const endpoints = [
    '/rest/v1/rpc/exec_sql',
    '/pg/query',
    '/sql',
  ]

  // First let's try creating the function via an existing RPC
  // Actually, let's use the Supabase auth admin endpoint to check connectivity
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  })
  console.log('Auth API status:', response.status)
}

async function createTablesViaRpc() {
  // First, let's check if there's an existing exec_sql or run_sql RPC
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql_exec']
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql_query: 'SELECT 1' })
      if (!error) {
        console.log(`Found RPC: ${rpc}`)
        return rpc
      }
    } catch {}
  }
  return null
}

async function main() {
  console.log('Checking for SQL execution capability...')
  const rpcName = await createTablesViaRpc()

  if (!rpcName) {
    console.log('No SQL RPC found. Will create tables individually via REST API workaround.\n')
  }

  // The v1 DB already has: users, works, usage_logs (with v1 schema)
  // We need new tables: plans, brand_voices, keywords, contents, images, channels,
  // schedules, payments, admin_prompts, email_logs, brand_voice_presets,
  // keyword_opportunities, content_metrics, support_tickets

  // We also need to alter existing tables (users, usage_logs) to add new columns

  // Since we can't run raw SQL, let's verify which tables exist by trying to query
  const tablesToCheck = [
    'plans', 'brand_voices', 'keywords', 'contents', 'images', 'channels',
    'schedules', 'payments', 'admin_prompts', 'email_logs', 'brand_voice_presets',
    'keyword_opportunities', 'content_metrics', 'support_tickets',
    // v1 tables
    'users', 'works', 'usage_logs', 'keyword_cache', 'plan_limits', 'prompt_versions'
  ]

  console.log('Table status:')
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    const status = error
      ? (error.message.includes('schema cache') ? 'NOT_IN_CACHE' :
         error.message.includes('not found') ? 'NOT_EXISTS' : `ERROR: ${error.message}`)
      : 'EXISTS'
    console.log(`  ${table}: ${status}`)
  }

  console.log('\n===================================')
  console.log('IMPORTANT: Tables not in REST API cache need to be created')
  console.log('via Supabase Dashboard > SQL Editor.')
  console.log('SQL file: supabase/migrations/001_init.sql')
  console.log('Seed file: supabase/migrations/002_seed.sql')
  console.log('===================================\n')

  // For tables that exist, try seeding data
  // The "plans" table is new and needs to be created first

  // Check if we have v1 tables with data
  const { data: usersData } = await supabase.from('users').select('id, name, role, email').limit(5)
  console.log('Existing users:', JSON.stringify(usersData, null, 2))

  // Check v1 specific tables
  const { data: kwCache } = await supabase.from('keyword_cache').select('keyword').limit(3)
  console.log('Keyword cache:', kwCache ? `${kwCache.length} entries` : 'no data')

  const { data: planLimits } = await supabase.from('plan_limits').select('*').limit(5)
  console.log('Plan limits (v1):', planLimits ? JSON.stringify(planLimits, null, 2) : 'no data')
}

main().catch(console.error)
