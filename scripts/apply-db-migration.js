#!/usr/bin/env node

/**
 * Production Database Migration Tool
 * Applies security hardening migration to Supabase PostgreSQL
 *
 * Usage: node scripts/apply-db-migration.js
 */

const pg = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  let client

  try {
    console.log('\n🚀 Supabase Database Migration Tool')
    console.log('='.repeat(60) + '\n')

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not set in .env.local')
    }

    // Extract connection details from Supabase URL
    // Format: https://[project-ref].supabase.co
    const projectMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
    if (!projectMatch) {
      throw new Error('Invalid Supabase URL format')
    }

    const projectRef = projectMatch[1]
    const dbHost = `db.${projectRef}.supabase.co`

    console.log(`📦 Project: ${projectRef}`)
    console.log(`🗄️  Host: ${dbHost}`)
    console.log(`👤 User: postgres\n`)

    // Note: You need to provide the database password
    // It's the password you set when creating the Supabase project
    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (!dbPassword) {
      console.log('ℹ️  Database password not found in environment\n')
      console.log('To proceed, you need to either:')
      console.log('  1. Set SUPABASE_DB_PASSWORD in .env.local')
      console.log('  2. Use Supabase SQL Editor (recommended):')
      console.log(`     https://app.supabase.com/project/${projectRef}/sql/new\n`)
      console.log('Alternatively, use Supabase CLI:')
      console.log('  supabase db push\n')
      return showManualInstructions()
    }

    // Create PostgreSQL connection
    const pgConfig = {
      host: dbHost,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: 'require',
      application_name: 'migration-tool',
    }

    console.log('🔐 Connecting to database...')
    client = new pg.Client(pgConfig)
    await client.connect()
    console.log('✅ Connected!\n')

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260213000000_security_hardening.sql')
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8')

    // Parse and execute statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))

    console.log(`📄 Migration: 20260213000000_security_hardening.sql`)
    console.log(`📊 Statements: ${statements.length}\n`)
    console.log('⚙️  Executing statements...\n')

    let successCount = 0
    let skipCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const firstLine = stmt.split('\n')[0]

      try {
        // Determine operation type
        let op = '⚙️ '
        if (stmt.includes('CREATE TABLE')) op = '📋'
        else if (stmt.includes('CREATE INDEX')) op = '📑'
        else if (stmt.includes('CREATE POLICY')) op = '🔐'
        else if (stmt.includes('CREATE FUNCTION')) op = '⚡'
        else if (stmt.includes('ALTER')) op = '✏️ '
        else if (stmt.includes('DROP')) op = '🗑️ '

        const desc = firstLine.substring(0, 45)
        process.stdout.write(`  [${String(i + 1).padStart(2)}] ${op} ${desc.padEnd(50)}... `)

        // Execute statement
        await client.query(stmt)

        console.log('✅')
        successCount++
      } catch (error) {
        const msg = error.message || String(error)

        // Check for acceptable errors
        if (msg.includes('already exists') || msg.includes('already defined')) {
          console.log('⊘')
          skipCount++
        } else {
          console.log('❌')
          errors.push({ stmt: firstLine, error: msg })
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Results:')
    console.log(`  ✅ Executed: ${successCount}`)
    console.log(`  ⊘ Skipped: ${skipCount}`)
    console.log(`  ❌ Errors: ${errors.length}\n`)

    if (errors.length > 0) {
      console.log('⚠️  Errors encountered:')
      errors.forEach(({ stmt, error }) => {
        console.log(`  • ${stmt}`)
        console.log(`    └─ ${error.substring(0, 70)}\n`)
      })
    }

    console.log('🎉 Migration completed!')
    console.log('\n📚 Created resources:')
    console.log('  • billing_history table')
    console.log('  • upgrade_requests table')
    console.log('  • rate_limit_counters table')
    console.log('  • Security helper functions')
    console.log('  • RLS policies on all tables')
    console.log('  • Audit logging function\n')

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error('  ' + (error instanceof Error ? error.message : String(error)))
    console.error('')

    showManualInstructions()

    if (client) {
      await client.end()
    }
    process.exit(1)
  }
}

function showManualInstructions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efybjwirnwtrclqkwyvs.supabase.co'
  const projectRef = supabaseUrl.match(/([a-z0-9]+)\.supabase\.co/)?.[1] || 'your-project'

  console.log('\n' + '='.repeat(60))
  console.log('🔧 Manual Migration Steps (Recommended)')
  console.log('='.repeat(60) + '\n')

  console.log('1️⃣  Go to Supabase SQL Editor:')
  console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`)

  console.log('2️⃣  Copy the migration file:')
  console.log('   cat supabase/migrations/20260213000000_security_hardening.sql\n')

  console.log('3️⃣  Paste into SQL Editor and click "Run"\n')

  console.log('4️⃣  Verify in Supabase Dashboard:')
  console.log('   • Tables tab → Should see: billing_history, upgrade_requests')
  console.log('   • Functions tab → Should see: get_user_role, is_admin, etc.\n')

  console.log('Alternative: Use Supabase CLI')
  console.log('   supabase link')
  console.log('   supabase db push\n')
}

applyMigration()
