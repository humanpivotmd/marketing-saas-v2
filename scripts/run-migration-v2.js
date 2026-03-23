const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function execSql(sql) {
  // Use the Supabase Management API SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return await response.json()
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true })
  return !error
}

async function runMigration() {
  console.log('Checking which tables need to be created...\n')

  const requiredTables = [
    'plans', 'users', 'brand_voices', 'keywords', 'contents', 'images',
    'channels', 'schedules', 'usage_logs', 'payments', 'admin_prompts',
    'email_logs', 'brand_voice_presets', 'keyword_opportunities',
    'content_metrics', 'support_tickets'
  ]

  const existingTables = []
  const missingTables = []

  for (const table of requiredTables) {
    const exists = await checkTableExists(table)
    if (exists) {
      existingTables.push(table)
    } else {
      missingTables.push(table)
    }
  }

  console.log(`Existing tables (${existingTables.length}): ${existingTables.join(', ')}`)
  console.log(`Missing tables (${missingTables.length}): ${missingTables.length > 0 ? missingTables.join(', ') : 'none'}`)

  if (missingTables.length > 0) {
    console.log('\nAttempting to create missing tables via exec_sql RPC...')
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '001_init.sql'),
      'utf-8'
    )
    try {
      await execSql(sql)
      console.log('SQL executed successfully!')
    } catch (err) {
      console.log(`exec_sql RPC not available: ${err.message}`)
      console.log('\nNOTE: Tables must be created via Supabase Dashboard SQL Editor.')
      console.log('SQL file: supabase/migrations/001_init.sql')
    }
  }

  // Try seeding with Supabase client
  console.log('\n--- Seeding data ---')

  // Seed plans
  const { data: existingPlans } = await supabase.from('plans').select('name')
  const planNames = (existingPlans || []).map(p => p.name)

  const plans = [
    { name: 'free', display_name: 'Free', price_monthly: 0, price_yearly: 0, content_limit: 10, keyword_limit: 20, image_limit: 5, saved_keyword_limit: 20, channel_limit: 1, brand_voice_limit: 1, team_member_limit: 0, history_days: 30, has_api_access: false, has_priority_support: false, sort_order: 0 },
    { name: 'starter', display_name: 'Starter', price_monthly: 29000, price_yearly: 278400, content_limit: 100, keyword_limit: 200, image_limit: 50, saved_keyword_limit: 200, channel_limit: 3, brand_voice_limit: 3, team_member_limit: 0, history_days: 180, has_api_access: false, has_priority_support: false, sort_order: 1 },
    { name: 'pro', display_name: 'Pro', price_monthly: 59000, price_yearly: 566400, content_limit: 500, keyword_limit: 1000, image_limit: 200, saved_keyword_limit: 1000, channel_limit: 10, brand_voice_limit: 10, team_member_limit: 3, history_days: 0, has_api_access: false, has_priority_support: false, sort_order: 2 },
    { name: 'business', display_name: 'Business', price_monthly: 149000, price_yearly: 1430400, content_limit: 0, keyword_limit: 0, image_limit: 0, saved_keyword_limit: 0, channel_limit: 0, brand_voice_limit: 0, team_member_limit: 20, history_days: 0, has_api_access: true, has_priority_support: true, sort_order: 3 },
  ]

  for (const plan of plans) {
    if (planNames.includes(plan.name)) {
      const { error } = await supabase.from('plans').update(plan).eq('name', plan.name)
      console.log(`  Plan ${plan.name}: ${error ? 'UPDATE ERROR - ' + error.message : 'updated'}`)
    } else {
      const { error } = await supabase.from('plans').insert(plan)
      console.log(`  Plan ${plan.name}: ${error ? 'INSERT ERROR - ' + error.message : 'inserted'}`)
    }
  }

  // Seed admin_prompts
  const { data: existingPrompts } = await supabase.from('admin_prompts').select('step')
  const existingSteps = (existingPrompts || []).map(p => p.step)

  const promptData = [
    { step: 'blog', version: 1, prompt_text: `당신은 한국 SEO에 특화된 블로그 작성 전문가입니다.\n\n## 작성 규칙\n- 네이버 SEO(C-Rank, D.I.A.)에 최적화된 구조로 작성\n- 제목은 키워드를 자연스럽게 포함 (32자 이내)\n- 소제목(H2, H3)을 활용한 체계적 구조\n- 키워드 밀도: 본문 대비 2-3%\n\n## Brand Voice\n{brand_voice}\n\n## 키워드: {keyword}\n## 톤: {tone}\n## 길이: {length}`, is_active: true, traffic_ratio: 100 },
    { step: 'threads', version: 1, prompt_text: `당신은 Threads 콘텐츠 전문가입니다.\n\n## 작성 규칙\n- 500자 이내의 짧고 임팩트 있는 텍스트\n- 해시태그 5-10개\n\n## Brand Voice\n{brand_voice}\n\n## 키워드: {keyword}\n## 톤: {tone}`, is_active: true, traffic_ratio: 100 },
    { step: 'instagram', version: 1, prompt_text: `당신은 Instagram 캡션 전문가입니다.\n\n## 작성 규칙\n- 2,200자 이내 캡션\n- 해시태그 최대 30개\n\n## Brand Voice\n{brand_voice}\n\n## 키워드: {keyword}\n## 톤: {tone}`, is_active: true, traffic_ratio: 100 },
    { step: 'script', version: 1, prompt_text: `당신은 영상 스크립트 전문가입니다.\n\n## 작성 규칙\n- 30초~3분 분량\n\n## Brand Voice\n{brand_voice}\n\n## 키워드: {keyword}\n## 톤: {tone}\n## 길이: {length}`, is_active: true, traffic_ratio: 100 },
    { step: 'image', version: 1, prompt_text: `Generate a marketing image for: {prompt}\n\nStyle: {style}\nSize: {size}`, is_active: true, traffic_ratio: 100 },
  ]

  for (const prompt of promptData) {
    if (existingSteps.includes(prompt.step)) {
      console.log(`  Prompt ${prompt.step}: already exists, skipping`)
    } else {
      const { error } = await supabase.from('admin_prompts').insert(prompt)
      console.log(`  Prompt ${prompt.step}: ${error ? 'ERROR - ' + error.message : 'inserted'}`)
    }
  }

  // Seed brand_voice_presets
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

  for (const preset of presets) {
    const { error } = await supabase.from('brand_voice_presets').upsert(preset, { onConflict: 'industry' })
    if (error) {
      console.log(`  BV Preset ${preset.industry}: ERROR - ${error.message}`)
    }
  }
  console.log('  BV Presets: 8 presets upserted')

  // Final verification
  console.log('\n--- Final Verification ---')
  for (const table of requiredTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`  ${table}: ${error ? 'ERROR' : `${count} rows`}`)
  }

  console.log('\nDone!')
}

runMigration().catch(console.error)
