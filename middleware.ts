import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware for authentication and authorization
 * Protects routes and redirects unauthenticated users to login
 */
export async function middleware(request: NextRequest) {
  // Create a Supabase client with the request/response for cookie handling
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // request.cookies.getAll() returns an array of { name, value } objects
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Debug logging
  const allCookies = request.cookies.getAll()
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}, Cookies: ${allCookies.length}`)
  if (allCookies.length > 0) {
    console.log(`[Middleware] Cookie names: ${allCookies.map(c => c.name).join(', ')}`)
  }

  // Protected routes - require authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      console.log(`[Middleware] Redirecting to login, user not found`)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup')) {
    if (user) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except:
    // - _next/static
    // - _next/image
    // - favicon.ico
    // - api routes (we'll protect those separately)
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
