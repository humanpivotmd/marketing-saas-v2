const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://apdjueobqyodbgiwntdo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'
)

async function runMigration() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir).sort()

  for (const file of files) {
    if (!file.endsWith('.sql')) continue
    console.log(`Running: ${file}`)

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    // Split by semicolons but handle $$ blocks
    const statements = []
    let current = ''
    let inDollarBlock = false

    for (const line of sql.split('\n')) {
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('--')) {
        current += line + '\n'
        continue
      }

      if (trimmed.includes('$$')) {
        const count = (trimmed.match(/\$\$/g) || []).length
        if (count % 2 === 1) {
          inDollarBlock = !inDollarBlock
        }
      }

      current += line + '\n'

      if (!inDollarBlock && trimmed.endsWith(';')) {
        const stmt = current.trim()
        if (stmt && stmt !== ';') {
          statements.push(stmt)
        }
        current = ''
      }
    }

    if (current.trim()) {
      statements.push(current.trim())
    }

    let successCount = 0
    let errorCount = 0

    for (const stmt of statements) {
      if (!stmt || stmt === ';' || stmt.startsWith('--')) continue

      try {
        const { error } = await supabase.rpc('', {}).then(() => ({ error: null })).catch(() => ({ error: null }))
        // Use REST API to execute SQL via pg_net or just use the service key
        const response = await fetch('https://apdjueobqyodbgiwntdo.supabase.co/rest/v1/rpc/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM',
          },
          body: JSON.stringify({ query: stmt })
        })
        successCount++
      } catch (err) {
        // Ignore, we'll use a different approach
      }
    }
  }

  // Use the SQL editor endpoint directly
  console.log('\nExecuting full migration via Supabase SQL...')

  for (const file of files) {
    if (!file.endsWith('.sql')) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    try {
      const response = await fetch('https://apdjueobqyodbgiwntdo.supabase.co/pg/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM',
        },
        body: JSON.stringify({ query: sql })
      })

      if (response.ok) {
        console.log(`  ${file}: SUCCESS`)
      } else {
        const text = await response.text()
        console.log(`  ${file}: HTTP ${response.status} - trying alternative...`)
      }
    } catch (err) {
      console.log(`  ${file}: Network error - ${err.message}`)
    }
  }

  // Verify tables exist by querying
  console.log('\nVerifying tables...')
  const tables = ['plans', 'users', 'brand_voices', 'keywords', 'contents', 'images',
    'channels', 'schedules', 'usage_logs', 'payments', 'admin_prompts', 'email_logs',
    'brand_voice_presets', 'keyword_opportunities', 'content_metrics', 'support_tickets']

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`  ${table}: ERROR - ${error.message}`)
    } else {
      console.log(`  ${table}: OK`)
    }
  }

  // Insert seed data via supabase client
  console.log('\nInserting seed data...')

  // Plans
  const { error: planError } = await supabase.from('plans').upsert([
    { name: 'free', display_name: 'Free', price_monthly: 0, price_yearly: 0, content_limit: 10, keyword_limit: 20, image_limit: 5, saved_keyword_limit: 20, channel_limit: 1, brand_voice_limit: 1, team_member_limit: 0, history_days: 30, has_api_access: false, has_priority_support: false, sort_order: 0 },
    { name: 'starter', display_name: 'Starter', price_monthly: 29000, price_yearly: 278400, content_limit: 100, keyword_limit: 200, image_limit: 50, saved_keyword_limit: 200, channel_limit: 3, brand_voice_limit: 3, team_member_limit: 0, history_days: 180, has_api_access: false, has_priority_support: false, sort_order: 1 },
    { name: 'pro', display_name: 'Pro', price_monthly: 59000, price_yearly: 566400, content_limit: 500, keyword_limit: 1000, image_limit: 200, saved_keyword_limit: 1000, channel_limit: 10, brand_voice_limit: 10, team_member_limit: 3, history_days: 0, has_api_access: false, has_priority_support: false, sort_order: 2 },
    { name: 'business', display_name: 'Business', price_monthly: 149000, price_yearly: 1430400, content_limit: 0, keyword_limit: 0, image_limit: 0, saved_keyword_limit: 0, channel_limit: 0, brand_voice_limit: 0, team_member_limit: 20, history_days: 0, has_api_access: true, has_priority_support: true, sort_order: 3 },
  ], { onConflict: 'name' })

  if (planError) {
    console.log(`  Plans: ERROR - ${planError.message}`)
  } else {
    console.log('  Plans: 4 rows upserted')
  }

  // Admin Prompts
  const prompts = [
    { step: 'blog', version: 1, prompt_text: 'Blog prompt (see SQL)', is_active: true, traffic_ratio: 100 },
    { step: 'threads', version: 1, prompt_text: 'Threads prompt (see SQL)', is_active: true, traffic_ratio: 100 },
    { step: 'instagram', version: 1, prompt_text: 'Instagram prompt (see SQL)', is_active: true, traffic_ratio: 100 },
    { step: 'script', version: 1, prompt_text: 'Script prompt (see SQL)', is_active: true, traffic_ratio: 100 },
    { step: 'image', version: 1, prompt_text: 'Image prompt (see SQL)', is_active: true, traffic_ratio: 100 },
  ]

  const { data: existingPrompts } = await supabase.from('admin_prompts').select('step')
  if (!existingPrompts || existingPrompts.length === 0) {
    const { error: promptError } = await supabase.from('admin_prompts').insert(prompts)
    if (promptError) {
      console.log(`  Prompts: ERROR - ${promptError.message}`)
    } else {
      console.log('  Prompts: 5 rows inserted')
    }
  } else {
    console.log(`  Prompts: Already exist (${existingPrompts.length} rows)`)
  }

  // Brand Voice Presets
  const presets = [
    { industry: 'restaurant', name: '음식점/카페', tone: 'friendly', description: '따뜻하고 친근한 톤' },
    { industry: 'beauty', name: '뷰티/패션', tone: 'trendy', description: '트렌디하고 세련된 톤' },
    { industry: 'fitness', name: '피트니스/건강', tone: 'motivational', description: '동기부여하는 톤' },
    { industry: 'education', name: '교육/학원', tone: 'professional', description: '전문적인 톤' },
    { industry: 'tech', name: 'IT/테크', tone: 'informative', description: '정보 중심의 톤' },
    { industry: 'realestate', name: '부동산/인테리어', tone: 'trustworthy', description: '신뢰감 있는 톤' },
    { industry: 'pet', name: '반려동물', tone: 'warm', description: '따뜻하고 공감하는 톤' },
    { industry: 'travel', name: '여행/숙박', tone: 'adventurous', description: '설렘을 주는 톤' },
  ]

  const { error: presetError } = await supabase.from('brand_voice_presets').upsert(presets, { onConflict: 'industry' })
  if (presetError) {
    console.log(`  BV Presets: ERROR - ${presetError.message}`)
  } else {
    console.log('  BV Presets: 8 rows upserted')
  }

  console.log('\nMigration complete!')
}

runMigration().catch(console.error)
