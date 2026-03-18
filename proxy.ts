import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard', '/record', '/observe', '/correct',
  '/levelup', '/practice', '/games', '/avatar', '/settings'
]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Skip static files
  if (path.startsWith('/_next') || path.includes('.')) return response

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Always verify with server - prevents cached session bypass
    const { data: { user } } = await supabase.auth.getUser()
    const isProtected = PROTECTED.some(p => path.startsWith(p))

    if (isProtected && !user) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    // Logged in users can't access auth page — must use logout button
    if (path === '/auth' && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

  } catch (error) {
    console.error('Proxy error:', error)
    // On error, redirect protected routes to auth
    const isProtected = PROTECTED.some(p => path.startsWith(p))
    if (isProtected) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.svg|.*\\.png|.*\\.ico).*)',],
}
