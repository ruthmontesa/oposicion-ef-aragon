import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Ruta de diagnóstico — no está protegida por middleware
// Visita: http://localhost:3000/api/session-check
export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NO_URL',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'NO_KEY',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(_: { name: string; value: string; options: CookieOptions }[]) {},
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  return NextResponse.json({
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ definida' : '✗ NO DEFINIDA',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ definida' : '✗ NO DEFINIDA',
      service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ definida' : '✗ NO DEFINIDA',
    },
    cookies: {
      total: allCookies.length,
      supabase_cookies: supabaseCookies.map(c => ({ name: c.name, length: c.value.length })),
    },
    session: {
      exists: !!session,
      user_email: session?.user?.email ?? null,
      expires_at: session?.expires_at ?? null,
      error: error?.message ?? null,
    },
  })
}
