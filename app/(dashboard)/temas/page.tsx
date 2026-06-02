import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'

type ProgresoRow = {
  ultima_puntuacion: number | null
  veces_estudiado: number
  temas: { numero: number } | null
}

const BLOQUES = [
  { label: 'Bloque A — Fundamentos científicos', rango: [1, 10] as const },
  { label: 'Bloque B — Didáctica de la EF', rango: [11, 20] as const },
  { label: 'Bloque C — Legislación', rango: [21, 25] as const },
]

function badge(p: number | null, v: number) {
  if (v === 0 || p === null) return { bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300', label: 'Sin empezar' }
  if (p >= 70) return { bg: 'bg-brand-100 text-brand-700', dot: 'bg-brand-400', label: `${Math.round(p)}%` }
  if (p >= 40) return { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', label: `${Math.round(p)}%` }
  return { bg: 'bg-red-100 text-red-600', dot: 'bg-red-400', label: `${Math.round(p)}%` }
}

export default async function TemasPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  const { data: progresoRaw } = await supabase
    .from('progreso_usuario')
    .select('ultima_puntuacion, veces_estudiado, temas(numero)')
    .eq('user_id', user.id)

  const progresoMap = new Map(
    ((progresoRaw ?? []) as unknown as ProgresoRow[])
      .filter(p => p.temas !== null)
      .map(p => [p.temas!.numero, p])
  )

  const temasConProgreso = TEMARIO_EF_ARAGON.map(t => ({
    ...t,
    puntuacion: progresoMap.get(t.numero)?.ultima_puntuacion ?? null,
    vecesEstudiado: progresoMap.get(t.numero)?.veces_estudiado ?? 0,
  }))

  const estudiados = temasConProgreso.filter(t => t.vecesEstudiado > 0).length

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 font-display">Temario</h1>
            <p className="text-xs text-gray-400">{estudiados} de 25 temas trabajados</p>
          </div>
          <div className="text-right">
            <div className="w-24 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full"
                style={{ width: `${Math.round((estudiados / 25) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{Math.round((estudiados / 25) * 100)}%</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {BLOQUES.map(({ label, rango }) => {
          const temaBloque = temasConProgreso.filter(t => t.numero >= rango[0] && t.numero <= rango[1])
          return (
            <section key={label}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</h2>
              <div className="space-y-2">
                {temaBloque.map(({ numero, titulo, puntuacion, vecesEstudiado }) => {
                  const { bg, dot, label: scoreLabel } = badge(puntuacion, vecesEstudiado)
                  return (
                    <Link
                      key={numero}
                      href={`/temas/${numero}`}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-brand-200 hover:shadow-sm transition group"
                    >
                      <span className="text-xs font-bold text-gray-400 tabular-nums w-5 shrink-0">
                        {String(numero).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-gray-800 flex-1 leading-snug group-hover:text-brand-700 transition">
                        {titulo}
                      </p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 ${bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${dot}`} />
                        {scoreLabel}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
