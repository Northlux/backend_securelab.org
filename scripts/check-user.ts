import { createServerClient } from '@supabase/ssr'

async function checkUser() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get() {
          return ''
        },
        set() {},
        remove() {},
      },
    })

    console.log('🔍 Checking users in database...\n')

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }

    console.log(`📊 Found ${data?.length || 0} users:\n`)
    data?.forEach((user: any) => {
      console.log(`  ✓ ${user.email} (${user.role}) - ${user.created_at}`)
    })

    console.log('\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkUser().catch(console.error)
