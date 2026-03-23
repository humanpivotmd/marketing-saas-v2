// This script attempts to create the exec_sql RPC function
// by leveraging the Supabase Management API
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://apdjueobqyodbgiwntdo.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGp1ZW9icXlvZGJnaXdudGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgwMzc3MywiZXhwIjoyMDg5Mzc5NzczfQ.3ICQWkRJ1ltiLfcEP3SDfYU26wx1A61oIb4oY-GECMM'

const PROJECT_REF = 'apdjueobqyodbgiwntdo'

async function tryManagementApi() {
  // Try using the database query endpoint
  const sqlFile = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '001_init.sql'),
    'utf-8'
  )

  // Supabase has a /pg endpoint for SQL execution via service role
  const endpoints = [
    { url: `${SUPABASE_URL}/pg`, method: 'POST' },
    { url: `${SUPABASE_URL}/rest/v1/rpc/run_migration`, method: 'POST' },
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: sqlFile })
      })
      console.log(`${ep.url}: ${res.status} ${res.statusText}`)
      if (res.ok) {
        const data = await res.text()
        console.log('Response:', data.substring(0, 500))
      }
    } catch (err) {
      console.log(`${ep.url}: ${err.message}`)
    }
  }

  // Try using psql-compatible endpoint
  // Supabase exposes a pooler at db.{ref}.supabase.co
  // But we can't use psql from Node without pg module

  // Let's install pg and try direct connection
  console.log('\nTrying direct PostgreSQL connection...')
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: `postgresql://postgres.${PROJECT_REF}:${process.env.DB_PASSWORD || 'placeholder'}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    })

    const client = await pool.connect()
    console.log('Connected to PostgreSQL!')
    client.release()
    await pool.end()
  } catch (err) {
    console.log(`pg connection failed: ${err.message}`)
    console.log('\nTo create tables, use one of:')
    console.log('1. Supabase Dashboard > SQL Editor - paste contents of 001_init.sql and 002_seed.sql')
    console.log('2. Install pg module and provide database password')
  }
}

tryManagementApi().catch(console.error)
