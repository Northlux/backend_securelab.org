/**
 * Apply Migrations Script
 * Applies all SQL migrations to Supabase database via SQL Editor
 *
 * Usage: pnpm tsx scripts/apply-migrations.ts
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables')
  process.exit(1)
}

async function applyMigrations() {
  console.log('🔄 Applying migrations...\n')

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260207_create_users_and_auth.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Read migration file')
    console.log(`   File: 20260207_create_users_and_auth.sql`)
    console.log(`   Size: ${migrationSQL.length} bytes\n`)

    console.log('⚠️  IMPORTANT: Run this SQL in your Supabase dashboard:\n')
    console.log('1. Go to https://app.supabase.com/project/[project-id]/sql/new')
    console.log('2. Paste the SQL below:')
    console.log('3. Click "Run"\n')
    console.log('═'.repeat(80))
    console.log(migrationSQL)
    console.log('═'.repeat(80))
    console.log('\nOr use the Supabase CLI:')
    console.log('  npx supabase db push')
  } catch (error: any) {
    console.error('❌ Error reading migrations:', error.message)
    process.exit(1)
  }
}

applyMigrations()
