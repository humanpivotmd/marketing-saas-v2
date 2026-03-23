const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase direct connection
// Try multiple connection strings
const PROJECT_REF = 'apdjueobqyodbgiwntdo'

// Common Supabase DB passwords
const passwords = ['pivot0307!', 'pivot0307', process.env.SUPABASE_DB_PASSWORD].filter(Boolean)

async function tryConnect(password) {
  // Supabase pooler connection (Transaction mode)
  const connectionString = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const client = await pool.connect()
    const result = await client.query('SELECT 1 as test')
    client.release()
    console.log(`Connected with password: ${password.substring(0, 3)}***`)
    return pool
  } catch (err) {
    await pool.end()
    return null
  }
}

async function main() {
  let pool = null

  for (const pw of passwords) {
    pool = await tryConnect(pw)
    if (pool) break
  }

  // Also try direct connection (Session mode)
  if (!pool) {
    for (const pw of passwords) {
      const connectionString = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(pw)}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
      const testPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      })
      try {
        const client = await testPool.connect()
        await client.query('SELECT 1')
        client.release()
        pool = testPool
        console.log(`Connected via session mode with: ${pw.substring(0, 3)}***`)
        break
      } catch {
        await testPool.end()
      }
    }
  }

  // Try direct host
  if (!pool) {
    for (const pw of passwords) {
      const connectionString = `postgresql://postgres:${encodeURIComponent(pw)}@db.${PROJECT_REF}.supabase.co:5432/postgres`
      const testPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      })
      try {
        const client = await testPool.connect()
        await client.query('SELECT 1')
        client.release()
        pool = testPool
        console.log(`Connected via direct host with: ${pw.substring(0, 3)}***`)
        break
      } catch (err) {
        console.log(`Direct host with ${pw.substring(0, 3)}***: ${err.message}`)
        await testPool.end()
      }
    }
  }

  if (!pool) {
    console.error('\nCould not connect to database.')
    console.error('Please run SQL manually in Supabase Dashboard > SQL Editor.')
    console.error('Files: supabase/migrations/001_init.sql and 002_seed.sql')
    process.exit(1)
  }

  // Execute migrations
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const files = ['001_init.sql', '002_seed.sql']

  for (const file of files) {
    console.log(`\nRunning: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    try {
      await pool.query(sql)
      console.log(`  ${file}: SUCCESS`)
    } catch (err) {
      console.log(`  ${file}: ERROR - ${err.message}`)
      // Try statement by statement
      console.log('  Trying statement by statement...')
      const statements = splitSql(sql)
      let success = 0, fail = 0
      for (const stmt of statements) {
        try {
          await pool.query(stmt)
          success++
        } catch (e) {
          fail++
          if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
            console.log(`    FAIL: ${e.message.substring(0, 100)}`)
          }
        }
      }
      console.log(`  Results: ${success} succeeded, ${fail} failed`)
    }
  }

  // Verify
  console.log('\n--- Verification ---')
  const { rows } = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `)
  console.log('Public tables:', rows.map(r => r.tablename).join(', '))

  const { rows: planRows } = await pool.query('SELECT name, display_name FROM plans ORDER BY sort_order')
  console.log('Plans:', planRows.map(r => `${r.name}(${r.display_name})`).join(', '))

  const { rows: promptRows } = await pool.query('SELECT step, is_active FROM admin_prompts ORDER BY step')
  console.log('Prompts:', promptRows.map(r => `${r.step}(active=${r.is_active})`).join(', '))

  await pool.end()
  console.log('\nMigration complete!')
}

function splitSql(sql) {
  const statements = []
  let current = ''
  let inDollarBlock = false

  for (const line of sql.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('--') && !inDollarBlock) {
      current += line + '\n'
      continue
    }

    const dollarMatches = (line.match(/\$\$/g) || []).length
    if (dollarMatches % 2 === 1) {
      inDollarBlock = !inDollarBlock
    }

    current += line + '\n'

    if (!inDollarBlock && trimmed.endsWith(';')) {
      const stmt = current.trim()
      if (stmt && stmt !== ';' && !stmt.match(/^--/)) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  if (current.trim() && current.trim() !== ';') {
    statements.push(current.trim())
  }

  return statements.filter(s => !s.match(/^\s*--/))
}

main().catch(console.error)
