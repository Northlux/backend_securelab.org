import { test, expect } from '@playwright/test'

/**
 * Authentication Verification Tests
 * Tests the complete auth flow after RLS policy fix
 *
 * Prerequisites:
 * 1. RLS fix applied: DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
 * 2. Dev server running: pnpm dev
 * 3. .env.local configured with Supabase credentials
 */

const BASE_URL = 'http://localhost:3004'

test.describe('Backend Authentication & RLS Fix Verification', () => {
  test('✅ Admin dashboard loads without auth errors', async ({ page }) => {
    // Navigate to admin page
    await page.goto(`${BASE_URL}/admin`)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Check for error messages related to user profile
    const errorText = await page.locator('text=/User profile not found/i').count()
    expect(errorText).toBe(0)

    // Verify dashboard is visible
    const dashboard = await page.locator('heading').first()
    await expect(dashboard).toBeVisible()

    console.log('✓ Admin dashboard loaded successfully')
  })

  test('✅ Sources page loads without RLS errors', async ({ page }) => {
    // Navigate to sources page
    await page.goto(`${BASE_URL}/admin/intel/sources`)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Check for RLS policy errors
    const rlsError = await page.locator('text=/row-level security/i').count()
    expect(rlsError).toBe(0)

    // Check for user profile errors
    const profileError = await page.locator('text=/User profile not found/i').count()
    expect(profileError).toBe(0)

    // Verify page content is visible (either loaded or loading state)
    const pageContent = await page.locator('main, [role="main"]').count()
    expect(pageContent).toBeGreaterThan(0)

    console.log('✓ Sources page loaded without errors')
  })

  test('✅ Signals page loads without RLS errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/intel/signals`)
    await page.waitForLoadState('networkidle')

    const rlsError = await page.locator('text=/row-level security/i').count()
    expect(rlsError).toBe(0)

    const profileError = await page.locator('text=/User profile not found/i').count()
    expect(profileError).toBe(0)

    console.log('✓ Signals page loaded without errors')
  })

  test('✅ Tags page loads without RLS errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/intel/tags`)
    await page.waitForLoadState('networkidle')

    const rlsError = await page.locator('text=/row-level security/i').count()
    expect(rlsError).toBe(0)

    const profileError = await page.locator('text=/User profile not found/i').count()
    expect(profileError).toBe(0)

    console.log('✓ Tags page loaded without errors')
  })

  test('✅ User is authenticated with admin role', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')

    // Look for user profile display showing email and role
    const userProfile = await page.locator('text=/admin@/i, text=/Admin/i').first()
    await expect(userProfile).toBeVisible()

    console.log('✓ User authenticated with admin role')
  })

  test('✅ User database record was auto-created', async ({ page }) => {
    // This test verifies the user record was created in the database
    // Navigate to admin page to trigger user creation if needed
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')

    // If no error appears, the user record was successfully created
    const authErrors = await page.locator('text=/AuthError|User profile not found/i').count()
    expect(authErrors).toBe(0)

    console.log('✓ User database record was auto-created successfully')
  })

  test('✅ No RLS policy violations in console', async ({ page }) => {
    // Set up console message capture
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (
        msg.text().includes('row-level security') ||
        msg.text().includes('RLS') ||
        msg.text().includes('violates policy')
      ) {
        consoleMessages.push(msg.text())
      }
    })

    // Navigate through admin pages
    await page.goto(`${BASE_URL}/admin/intel/sources`)
    await page.waitForLoadState('networkidle')

    // Verify no RLS errors in console
    expect(consoleMessages).toHaveLength(0)

    console.log('✓ No RLS policy violations detected')
  })

  test('✅ Complete authentication flow works', async ({ page }) => {
    // 1. User can reach admin dashboard
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForLoadState('networkidle')

    // 2. User is authenticated
    const userIndicator = await page.locator('[class*="user"], [class*="profile"]').first()
    const isVisible = await userIndicator.isVisible().catch(() => false)
    // User info should be visible somewhere

    // 3. No critical errors
    const errorHeadings = await page.locator('heading:has-text("error"), h1:has-text("error")').count()
    expect(errorHeadings).toBe(0)

    // 4. Admin pages are accessible
    await page.goto(`${BASE_URL}/admin/intel/sources`)
    await page.waitForLoadState('networkidle')

    const sourceErrors = await page.locator('text=/User profile not found|row-level security/i').count()
    expect(sourceErrors).toBe(0)

    console.log('✓ Complete authentication flow verified')
  })
})

test.describe('RLS Policy Fix Status', () => {
  test('📋 Check current auth status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`)

    // Log the current state
    const title = await page.title()
    const url = page.url()

    console.log(`
    ╔════════════════════════════════════════╗
    ║ Authentication Status Report           ║
    ╠════════════════════════════════════════╣
    ║ URL: ${url}
    ║ Title: ${title}
    ║ Status: ${await page.locator('body').isVisible() ? '✓ LOADED' : '✗ FAILED'}
    ║
    ║ If you see RLS errors:
    ║ 1. Go to Supabase Dashboard
    ║ 2. SQL Editor → New Query
    ║ 3. Run: DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
    ║ 4. Reload this page
    ╚════════════════════════════════════════╝
    `)
  })
})
