import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText, Mic, Layout } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'

type ProgresoRow = {
  ultima_puntuacion: number | null
  veces_estudiado: number
  temas: { numero: number } | null
}

function bloqueLabel(numero: number) {
  if (numero <= 10) return 'A'
  if (numero <= 20) return 'B'
  return 'C'
}

function cardClasses(puntuacion: number | null, vecesEstudiado: number) {
  if (vecesEstudiado === 0 || puntuacion === null) return 'border-gray-200 bg-gray-50 hover:border-gray-300'
  if (puntuacion >= 70) return 'border-brand-200 bg-brand-50 hover:border-brand-300'
  if (puntuacion >= 40) return 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
  return 'border-red-200 bg-red-50 hover:border-red-300'
}

function scoreClasses(puntuacion: number | null, vecesEstudiado: number) {
  if (vecesEstudiado === 0 || puntuacion === null) return 'text-gray-400'
  if (puntuacion >= 70) return 'text-brand-600 font-semibold'
  if (puntuacion >= 40) return 'text-yellow-600 font-semibold'
  return 'text-red-500 font-semibold'
}

const SECCIONES = [
  { href: '/temas', icon: BookOpen, label: 'Temas', desc: '25 temas del temario oficial' },
  { href: '/caso-practico', icon: FileText, label: 'Caso Práctico', desc: 'Supuestos de convocatorias' },
  { href: '/programacion', icon: Layout, label: 'Programación', desc: 'Evaluación de unidades didácticas' },
  { href: '/oral', icon: Mic, label: 'Oral', desc: 'Simulación de exposición' },
] as const

export default async function DashboardPage() {
  const supabase = createSupabaseServer()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  const [{ data: profile }, { data: progresoRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('progreso_usuario')
      .select('ultima_puntuacion, veces_estudiado, temas(numero)')
      .eq('user_id', user.id),
  ])

  const progresoMap = new Map(
    ((progresoRaw ?? []) as unknown as ProgresoRow[])
      .filter(p => p.temas !== null)
      .map(p => [p.temas!.numero, p])
  )

  const temas = TEMARIO_EF_ARAGON.map(t => ({
    ...t,
    puntuacion: progresoMap.get(t.numero)?.ultima_puntuacion ?? null,
    vecesEstudiado: progresoMap.get(t.numero)?.veces_estudiado ?? 0,
  }))

  const temasEstudiados = temas.filter(t => t.vecesEstudiado > 0).length
  const progresoGlobal = Math.round((temasEstudiados / 25) * 100)
  const nombre = profile?.nombre || (profile?.email ?? '').split('@')[0] || 'Opositora'

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">EF Aragón</p>
            <h1 className="text-lg font-bold text-gray-900 font-display">Hola, {nombre}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Progreso global</p>
            <p className="text-xl font-bold text-brand-600">{progresoGlobal}%</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Barra de progreso */}
        <section>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresoGlobal}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {temasEstudiados} de 25 temas con al menos una sesión completada
          </p>
        </section>

        {/* Secciones */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Secciones
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SECCIONES.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition group"
              >
                <Icon className="w-5 h-5 text-brand-500 mb-2.5 group-hover:text-brand-600 transition" />
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Grid de 25 temas */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Temario — 25 temas
            </h2>
            <div className="flex gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-400 inline-block" />
                &gt;70%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                40-70%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Sin empezar
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {temas.map(({ numero, titulo, puntuacion, vecesEstudiado }) => (
              <Link
                key={numero}
                href={`/temas/${numero}`}
                className={`rounded-xl border p-3 transition flex flex-col gap-2 ${cardClasses(puntuacion, vecesEstudiado)}`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 tabular-nums">
                    T{String(numero).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400 bg-white/80 rounded px-1 py-0.5">
                    Blq. {bloqueLabel(numero)}
                  </span>
                </div>

                {/* Título */}
                <p className="text-xs text-gray-700 leading-snug line-clamp-3 flex-1">
                  {titulo}
                </p>

                {/* Puntuación */}
                <p className={`text-xs ${scoreClasses(puntuacion, vecesEstudiado)}`}>
                  {vecesEstudiado === 0
                    ? 'Sin empezar'
                    : puntuacion !== null
                    ? `${Math.round(puntuacion)}%`
                    : 'Estudiado'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
