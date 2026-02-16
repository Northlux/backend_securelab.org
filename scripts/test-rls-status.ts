import { createServerClient } from '@supabase/ssr'

async function testRLSStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials')
    process.exit(1)
  }

  const supabase = createServerClient(supabaseUrl, serviceKey, {
    cookies: {
      get() {
        return ''
      },
      set() {},
      remove() {},
    },
  })

  console.log('\n🔍 RLS Policy Status Check')
  console.log('='  .repeat(50))

  // Check if we can query the users table
  console.log('\n1. Testing users table query...')
  const { data: users, error: queryError } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(5)

  if (queryError) {
    console.error('   ❌ Query failed:', queryError.message)
  } else {
    console.log(`   ✓ Query succeeded, found ${users?.length || 0} users`)
    users?.forEach(u => console.log(`     - ${u.email} (${u.role})`))
  }

  // Check if we can insert a test user
  console.log('\n2. Testing insert with random UUID...')
  const testId = crypto.randomUUID()

  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert({
      id: testId,
      email: `test-${Date.now()}@example.com`,
      role: 'user',
    })
    .select()
    .single()

  if (insertError) {
    console.error('   ❌ Insert failed:', insertError.message)
    if (insertError.message.includes('row-level security')) {
      console.error('   ⚠️  RLS POLICY STILL BLOCKING!')
    } else if (insertError.message.includes('foreign key')) {
      console.error('   ℹ️  Foreign key error (auth user ID must exist)')
    }
  } else {
    console.log(`   ✓ Insert succeeded: ${insertData?.id}`)
  }

  console.log('\n' + '='.repeat(50))
}

testRLSStatus().catch(console.error)
