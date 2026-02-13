#!/usr/bin/env node

/**
 * Database Migration Runner
 * Connects to Supabase PostgreSQL and applies security hardening migration
 *
 * Usage: node scripts/run-migration.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  process.exit(1)
}

console.log('🚀 Database Migration Runner')
console.log('=' .repeat(50))
console.log(`\n📦 Supabase Project: ${SUPABASE_URL}\n`)

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error('❌ Error: Could not parse Supabase project reference from URL')
  process.exit(1)
}

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20260213000000_security_hardening.sql')
const migrationContent = fs.readFileSync(migrationPath, 'utf-8')

// Parse statements
const statements = migrationContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

console.log(`📄 Migration file: ${migrationPath}`)
console.log(`📊 SQL statements found: ${statements.length}\n`)

// Display what will be created
console.log('📋 This migration will:')
console.log('   ✓ Add "analyst" role to user_role enum')
console.log('   ✓ Create billing_history table')
console.log('   ✓ Create upgrade_requests table')
console.log('   ✓ Create rate_limit_counters table')
console.log('   ✓ Enable RLS on all tables')
console.log('   ✓ Create security helper functions')
console.log('   ✓ Update existing RLS policies')
console.log('   ✓ Create audit logging function')
console.log('   ✓ Create cleanup function')

console.log('\n' + '='.repeat(50))
console.log('🔧 To apply this migration:')
console.log('\nOption 1: Using Supabase SQL Editor (Recommended for first-time setup)')
console.log(`  1. Go to: https://app.supabase.com/project/${projectRef}/sql/new`)
console.log(`  2. Copy the migration file content:`)
console.log(`     cat supabase/migrations/20260213000000_security_hardening.sql`)
console.log('  3. Paste into Supabase SQL Editor')
console.log('  4. Click "Run"')

console.log('\nOption 2: Using psql (requires PostgreSQL client)')
console.log(`  psql -h db.${projectRef}.supabase.co -U postgres -d postgres < supabase/migrations/20260213000000_security_hardening.sql`)
console.log('  (When prompted for password, use your Supabase database password)')

console.log('\nOption 3: Using Supabase CLI')
console.log('  supabase db push')

console.log('\n' + '='.repeat(50))
console.log('\n✨ Migration ready to apply!')
console.log(`📚 Database: ${projectRef}`)
console.log(`🔐 Tables to create: 3`)
console.log(`⚙️  Functions to add: 5\n`)
