import { redirect, notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import ResolverCaso from '@/components/caso-practico/ResolverCaso'

export default async function CasoPracticoDetallePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: caso } = await supabase
    .from('casos_practicos')
    .select('id, anio, convocatoria, enunciado, criterios_correccion, respuesta_modelo')
    .eq('id', params.id)
    .eq('activo', true)
    .single()

  if (!caso) notFound()

  return <ResolverCaso caso={caso} />
}
