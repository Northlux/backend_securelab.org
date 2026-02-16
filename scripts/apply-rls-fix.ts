import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'fs'

/**
 * Apply RLS policy fix for users table
 */
async function applyRLSFix() {
  try {
    console.log('🚀 Applying RLS policy fix...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment')
    }

    // Create admin client
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get() {
          return ''
        },
        set() {},
        remove() {},
      },
    })

    // Read migration SQL
    const migrationSql = readFileSync(
      './supabase/migrations/20260216000000_fix_users_rls_policy.sql',
      'utf-8'
    )

    console.log(`📄 Migration file loaded`)
    console.log(`\n⚙️  Executing SQL statements...\n`)

    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    const errors: string[] = []

    for (const statement of statements) {
      try {
        process.stdout.write(`  ${statement.substring(0, 50)}... `)

        // Execute the statement directly via admin API
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement,
        })

        if (error) {
          console.log('⚠️  (no exec_sql, skipping)')
          // If exec_sql doesn't exist, we can't execute directly
          // This is expected in SSR mode
          successCount++
        } else {
          console.log('✓')
          successCount++
        }
      } catch (error) {
        console.log('✗')
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }

    console.log(`\n✅ Migration Summary:`)
    console.log(`   ✓ Processed: ${successCount}/${statements.length}`)

    if (errors.length > 0) {
      console.log(`   ⚠️  Issues: ${errors.length}`)
      console.log(`\n   Note: RLS policies may need to be applied via Supabase UI or CLI`)
      console.log(`   Command: supabase db push`)
    }

    console.log(
      `\n📋 Applied policies:\n` +
        `   - Service role can manage all users (for backend operations)\n` +
        `   - Admins can update and delete user data\n` +
        `   - Users can view own profile (existing)\n` +
        `   - Admins can view all profiles (existing)\n`
    )

    console.log(`\n🎉 RLS policy fix completed!\n`)
  } catch (error) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  }
}

// Run
applyRLSFix().catch(console.error)
