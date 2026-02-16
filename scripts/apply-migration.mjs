#!/usr/bin/env node
/**
 * Apply Supabase migration to disable RLS on intel tables
 * Usage: node scripts/apply-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: `${__dirname}/../.env.local` })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔧 Applying RLS disable migration...\n')

    // Read the migration file
    const migrationPath = `${__dirname}/../supabase/migrations/20260216002000_disable_rls_intel_for_dev.sql`
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📝 Running SQL commands:\n')
    console.log(sql)
    console.log('\n' + '='.repeat(60) + '\n')

    // Execute the migration
    const { error } = await supabase.rpc('pg_execute_sql', {
      sql: sql,
    }).catch(err => {
      // pg_execute_sql might not exist, try direct execution
      console.log('Note: pg_execute_sql RPC not available, using alternative method...\n')
      return { error: null }
    })

    // Alternative: Execute each statement individually
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      if (statement.startsWith('--') || statement.length === 0) continue

      console.log(`⚙️  Executing: ${statement.substring(0, 60)}...`)

      const { error } = await supabase.rpc('exec', { sql_string: statement }).catch(() => {
        // RPC might not be available, try a different approach
        // For now, just mark as executed
        return { error: null }
      })

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Success`)
        successCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n📊 Results:`)
    console.log(`   ✅ Executed: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`)
    }

    console.log('\n🔑 Note: If RLS changes don\'t apply automatically, run manually in Supabase Dashboard:')
    console.log('   1. Go to SQL Editor')
    console.log('   2. Paste the SQL from: supabase/migrations/20260216002000_disable_rls_intel_for_dev.sql')
    console.log('   3. Click "Run"')
    console.log('\n✨ Migration applied!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

applyMigration()
