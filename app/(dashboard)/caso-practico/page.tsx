import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'

type CasoPractico = {
  id: string
  anio: number
  convocatoria: string
  enunciado: string
}

export default async function CasoPracticoPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: casos } = await supabase
    .from('casos_practicos')
    .select('id, anio, convocatoria, enunciado')
    .eq('activo', true)
    .order('anio', { ascending: false })

  const casosList = (casos ?? []) as CasoPractico[]

  const porAno = casosList.reduce<Record<number, CasoPractico[]>>((acc, c) => {
    if (!acc[c.anio]) acc[c.anio] = []
    acc[c.anio].push(c)
    return acc
  }, {})

  const anos = Object.keys(porAno).map(Number).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">EF Aragón</p>
            <h1 className="text-lg font-bold text-gray-900">Caso Práctico</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {casosList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">Sin casos disponibles</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Los supuestos prácticos de convocatorias anteriores se irán añadiendo próximamente.
            </p>
          </div>
        ) : (
          anos.map(ano => (
            <section key={ano}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Convocatoria {ano}
              </h2>
              <div className="space-y-2">
                {porAno[ano].map(caso => (
                  <Link
                    key={caso.id}
                    href={`/caso-practico/${caso.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition group"
                  >
                    <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition">
                      <FileText className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{caso.convocatoria}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {caso.enunciado.slice(0, 90)}&hellip;
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-brand-400 transition" />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
