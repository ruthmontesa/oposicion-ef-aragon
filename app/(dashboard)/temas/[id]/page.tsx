import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'
import { RECURSOS_POR_TEMA } from '@/content/temas/recursos'
import { TemaInteractivo } from '@/components/temas/TemaInteractivo'

interface Props {
  params: { id: string }
}

const BLOQUE = (n: number) => n <= 10 ? 'Bloque A' : n <= 20 ? 'Bloque B' : 'Bloque C'

export default async function TemaPage({ params }: Props) {
  const numero = parseInt(params.id)
  if (isNaN(numero) || numero < 1 || numero > 25) notFound()

  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const temaStatic = TEMARIO_EF_ARAGON.find(t => t.numero === numero)
  if (!temaStatic) notFound()

  // Buscar el UUID del tema en BD (puede no existir si la tabla no está sembrada)
  const { data: temaDb } = await supabase
    .from('temas')
    .select('id')
    .eq('numero', numero)
    .single()

  const recursos = RECURSOS_POR_TEMA[numero] ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
          <Link href="/temas" className="text-gray-400 hover:text-gray-600 transition mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Tema {String(numero).padStart(2, '0')} · {BLOQUE(numero)}
              </span>
            </div>
            <h1 className="text-sm font-bold text-gray-900 font-display leading-snug line-clamp-2">
              {temaStatic.titulo}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <TemaInteractivo
          temaNumero={numero}
          temaTitulo={temaStatic.titulo}
          recursos={recursos}
        />
      </div>
    </main>
  )
}
