const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('🚀 Running migrations...')
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  // Note: The anon key won't have permission to run DDL statements
  // We need to use the service role key or run this in the dashboard
  console.log('\n⚠️  Database migrations must be run with elevated permissions.')
  console.log('📋 Please run the following SQL in the Supabase Dashboard:\n')
  console.log('👉 Go to: https://supabase.com/dashboard/project/cyodlgfmrsvpocvgbykn/sql/new')
  console.log('\n' + '='.repeat(80))
  console.log(sql)
  console.log('='.repeat(80))
  console.log('\n✅ Copy the SQL above and run it in the Supabase SQL Editor')
}

runMigrations()
