import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/record', '/observe', '/correct', '/levelup', '/practice', '/games', '/avatar', '/settings', '/self-rate']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Skip static assets
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

    // Use getSession - less aggressive, won't kick users mid-session
    const { data: { session } } = await supabase.auth.getSession()
    const isProtected = PROTECTED.some(p => path.startsWith(p))

    if (isProtected && !session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    // Only redirect from auth if they have a valid session
    if (path === '/auth' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

  } catch {
    // Never kick users on error — just let the request through
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.svg|.*\\.png|.*\\.ico|.*\\.jpg|.*\\.webp).*)'],
}
