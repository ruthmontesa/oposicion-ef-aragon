'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function loginAction(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const email = (formData.get('email') as string ?? '').trim()
  const password = formData.get('password') as string ?? ''

  if (!email || !password) {
    return { error: 'Introduce email y contraseña' }
  }

  // createSupabaseServer() en un Server Action SÍ puede escribir cookies
  // (a diferencia de Server Components donde cookies().set() lanza).
  // Las cookies de sesión se envían al navegador en el Set-Cookie del redirect.
  const supabase = createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mostrar el error real de Supabase para facilitar el diagnóstico
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Confirma tu email antes de entrar (revisa tu bandeja de entrada)' }
    }
    return { error: error.message }
  }

  // redirect() lanza internamente — las cookies ya están en el Set-Cookie
  redirect('/dashboard')
}
