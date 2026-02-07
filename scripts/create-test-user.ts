/**
 * Create Test User Script
 * Creates a test admin user in Supabase for testing the authentication system
 *
 * Usage: pnpm tsx scripts/create-test-user.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure these are set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createTestUser() {
  console.log('🔐 Creating test user in Supabase...\n')

  const email = 'masteradmin@securelab.org'
  const password = 'Stumble-Cleft-Hush4'

  try {
    // Check if users table exists
    console.log('📋 Checking database schema...')
    const { data: tableCheck } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    // Create user via admin API (or fetch if already exists)
    console.log(`\n📝 Creating user: ${email}`)
    let authUser = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        role: 'admin',
      },
    })

    if (authUser.error) {
      // If user already exists, fetch the user
      if (authUser.error.message.includes('already been registered')) {
        console.log('ℹ️  User already exists, fetching user...')
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email === email)

        if (!existingUser) {
          console.error('❌ Error: Could not find or create user')
          process.exit(1)
        }

        authUser.data.user = existingUser
        console.log(`✅ Auth user found`)
        console.log(`   ID: ${existingUser.id}`)
        console.log(`   Email: ${existingUser.email}`)
      } else {
        console.error('❌ Error creating auth user:', authUser.error.message)
        process.exit(1)
      }
    } else {
      if (!authUser.data.user) {
        console.error('❌ Error: No user returned from creation')
        process.exit(1)
      }

      console.log(`✅ Auth user created`)
      console.log(`   ID: ${authUser.data.user.id}`)
      console.log(`   Email: ${authUser.data.user.email}`)
    }

    // Get user ID
    const userId = authUser.data?.user?.id || authUser.data?.user?.id
    if (!userId) {
      console.error('❌ Error: Could not get user ID')
      process.exit(1)
    }

    // Create extended user profile
    console.log(`\n📋 Creating user profile...`)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        role: 'admin',
        status: 'active',
      })
      .select()
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116' || profileError.message.includes('users')) {
        console.warn('⚠️  Users table not yet created (run migrations first)')
        console.log('   The auth user was created successfully')
        console.log('   After running migrations, the profile will be created automatically')
      } else {
        console.error('❌ Error creating user profile:', profileError.message)
        process.exit(1)
      }
    } else {
      console.log(`✅ User profile created`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Status: ${profile.status}`)
    }

    // Test login
    console.log(`\n🔑 Testing login...`)
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      console.error('❌ Error logging in:', loginError.message)
      process.exit(1)
    }

    if (!session.session) {
      console.error('❌ Error: No session returned')
      process.exit(1)
    }

    console.log(`✅ Login successful`)
    console.log(`   Session token: ${session.session.access_token.substring(0, 20)}...`)
    console.log(`   Expires in: ${Math.round((session.session.expires_at! - Date.now() / 1000) / 60)} minutes`)

    console.log(`\n✨ Test user created successfully!\n`)
    console.log(`📧 Email:    ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👤 Role:     admin`)
    console.log(`✅ Status:   active`)
    console.log(`\n🌐 You can now login at: http://localhost:3000/login`)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

createTestUser()
