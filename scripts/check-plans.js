const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  // Try to read plans without specifying columns
  const { data, error } = await supabase.from('plans').select()
  console.log('Plans select():', error ? `ERROR: ${error.message}` : JSON.stringify(data, null, 2))

  // Try individual new tables
  const tables = ['brand_voices', 'keywords', 'contents', 'images', 'channels',
    'schedules', 'payments', 'admin_prompts', 'email_logs', 'brand_voice_presets',
    'keyword_opportunities', 'content_metrics', 'support_tickets']

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select().limit(1)
    console.log(`${table}:`, error ? `ERROR: ${error.message}` : `OK (${data?.length || 0} rows)`)
  }

  // Try inserting into plans
  console.log('\nTrying to insert into plans...')
  const { data: insertData, error: insertErr } = await supabase.from('plans').insert({
    name: 'free_test',
    display_name: 'Free Test',
    price_monthly: 0,
    price_yearly: 0,
  }).select()
  console.log('Insert:', insertErr ? `ERROR: ${insertErr.message}` : JSON.stringify(insertData))

  // Clean up test
  if (!insertErr && insertData) {
    await supabase.from('plans').delete().eq('name', 'free_test')
    console.log('Cleaned up test row')
  }
}

main().catch(console.error)
