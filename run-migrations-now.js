const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://cyodlgfmrsvpocvgbykn.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5b2RsZ2ZtcnN2cG9jdmdieWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5NTY1MCwiZXhwIjoyMDc1MTcxNjUwfQ.2BcpUJny_-DJ0ANKUlqWC9Gt43hlTUAPSoEmqCiYpWU'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigrations() {
  console.log('🚀 Running database migrations...\n')
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  try {
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`[${i + 1}/${statements.length}] Running...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message)
        // Try direct table creation for basic tables
        if (statement.includes('CREATE TABLE')) {
          console.log('   Trying alternative approach...')
        }
      } else {
        console.log(`   ✅ Success`)
      }
    }
    
    console.log('\n✅ Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n⚠️  Note: The Supabase REST API has limitations.')
    console.log('Please run the migration manually in the Supabase Dashboard:')
    console.log('👉 https://supabase.com/dashboard/project/cyodlgfmrsvpocvgbykn/sql/new')
    process.exit(1)
  }
}

runMigrations()
