import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import ModoTest from '@/components/test/ModoTest'

type TemaConApuntes = {
  id: string
  numero: number
  titulo: string
}

export default async function TestPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: apuntes } = await supabase
    .from('apuntes_usuario')
    .select('tema_id, temas(id, numero, titulo)')
    .eq('user_id', session.user.id)

  const temasMap = new Map<string, TemaConApuntes>()
  for (const a of (apuntes ?? [])) {
    const tema = a.temas as unknown as TemaConApuntes | null
    if (tema && !temasMap.has(a.tema_id)) {
      temasMap.set(a.tema_id, tema)
    }
  }
  const temasConApuntes = Array.from(temasMap.values()).sort((a, b) => a.numero - b.numero)

  return <ModoTest temasConApuntes={temasConApuntes} />
}
