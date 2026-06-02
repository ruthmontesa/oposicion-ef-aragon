import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServer() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // En @supabase/ssr >=0.5 setAll recibe también headers de caché.
        // En Server Components cookies().set() lanza — ignorar con try/catch.
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          _headers?: Record<string, string>
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component: cookies().set() no está permitido.
            // El middleware ya gestiona el refresco.
          }
        },
      },
    }
  )
}
