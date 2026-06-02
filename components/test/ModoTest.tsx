'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, Trophy } from 'lucide-react'

type TemaConApuntes = {
  id: string
  numero: number
  titulo: string
}

type PreguntaTest = {
  id: string
  pregunta: string
  opciones: string[]
  respuesta_correcta: string
  explicacion: string
  fragmento_fuente: string
}

type RespuestaTest = {
  pregunta_id: string
  seleccionada: string
  correcta: boolean
}

type Estado = 'seleccion' | 'cargando' | 'test' | 'resultados'

export default function ModoTest({ temasConApuntes }: { temasConApuntes: TemaConApuntes[] }) {
  const [estado, setEstado] = useState<Estado>('seleccion')
  const [temasSeleccionados, setTemasSeleccionados] = useState<string[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [indicePregunta, setIndicePregunta] = useState(0)
  const [respuestas, setRespuestas] = useState<RespuestaTest[]>([])
  const [seleccionActual, setSeleccionActual] = useState<string | null>(null)
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false)
  const [sesionId, setSesionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const preguntaActual = preguntas[indicePregunta]
  const esUltimaPregunta = indicePregunta === preguntas.length - 1

  function toggleTema(temaId: string) {
    setTemasSeleccionados(prev =>
      prev.includes(temaId) ? prev.filter(id => id !== temaId) : [...prev, temaId]
    )
  }

  async function iniciarTest() {
    if (temasSeleccionados.length === 0) return
    setEstado('cargando')
    setError(null)
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema_ids: temasSeleccionados }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando el test')
      setPreguntas(data.preguntas)
      setSesionId(data.sesion_id ?? null)
      setRespuestas([])
      setIndicePregunta(0)
      setSeleccionActual(null)
      setMostrarRespuesta(false)
      setEstado('test')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setEstado('seleccion')
    }
  }

  function seleccionarOpcion(opcion: string) {
    if (mostrarRespuesta) return
    setSeleccionActual(opcion)
    setMostrarRespuesta(true)
    const correcta = opcion === preguntaActual.respuesta_correcta
    setRespuestas(prev => [
      ...prev,
      { pregunta_id: preguntaActual.id, seleccionada: opcion, correcta },
    ])
  }

  async function siguientePregunta(respuestasActuales: RespuestaTest[]) {
    if (esUltimaPregunta) {
      const aciertos = respuestasActuales.filter(r => r.correcta).length
      const puntuacion = Math.round((aciertos / preguntas.length) * 100)
      if (sesionId) {
        await fetch('/api/test', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sesion_id: sesionId,
            respuestas: respuestasActuales,
            puntuacion_final: puntuacion,
          }),
        }).catch(() => {})
      }
      setEstado('resultados')
    } else {
      setIndicePregunta(prev => prev + 1)
      setSeleccionActual(null)
      setMostrarRespuesta(false)
    }
  }

  // Sin apuntes
  if (temasConApuntes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-brand-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Sin apuntes subidos</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Primero debes subir tus apuntes en cada tema para usar el Modo Test.
            Ve a un tema, sube tu PDF y vuelve aquí.
          </p>
          <Link
            href="/temas"
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-brand-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            Ir a Temas
          </Link>
        </div>
      </div>
    )
  }

  // Selección de temas
  if (estado === 'seleccion') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">EF Aragón</p>
              <h1 className="text-lg font-bold text-gray-900">Modo Test</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800 font-medium">
              Preguntas tipo test directamente de tus apuntes. Ideal cuando estás cansada y quieres repasar sin esfuerzo.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Selecciona los temas para el test
              {temasSeleccionados.length > 0 && (
                <span className="ml-2 text-brand-600">({temasSeleccionados.length} seleccionados)</span>
              )}
            </p>
            <div className="space-y-2">
              {temasConApuntes.map(tema => {
                const sel = temasSeleccionados.includes(tema.id)
                return (
                  <button
                    key={tema.id}
                    onClick={() => toggleTema(tema.id)}
                    className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition ${
                      sel
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition ${
                        sel ? 'bg-brand-600' : 'border-2 border-gray-300'
                      }`}
                    >
                      {sel && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-gray-400 mr-2">
                        T{String(tema.numero).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-gray-800">{tema.titulo}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <button
              onClick={() => setTemasSeleccionados(temasConApuntes.map(t => t.id))}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Seleccionar todos
            </button>
            {temasSeleccionados.length > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <button
                  onClick={() => setTemasSeleccionados([])}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            onClick={iniciarTest}
            disabled={temasSeleccionados.length === 0}
            className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generar test de 10 preguntas
          </button>
        </div>
      </div>
    )
  }

  // Cargando
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-700">Generando tu test personalizado...</p>
          <p className="text-xs text-gray-400 mt-1">Analizando tus apuntes con IA</p>
        </div>
      </div>
    )
  }

  // Test activo
  if (estado === 'test' && preguntaActual) {
    const esCorrecta = seleccionActual === preguntaActual.respuesta_correcta

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-base font-bold text-gray-900">Modo Test</h1>
            </div>
            <p className="text-xs text-gray-500 tabular-nums">
              {indicePregunta + 1} / {preguntas.length}
            </p>
          </div>
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 bg-brand-500 transition-all duration-300"
              style={{ width: `${((indicePregunta + 1) / preguntas.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">
              Pregunta {indicePregunta + 1}
            </p>
            <p className="text-base text-gray-900 font-medium leading-snug">
              {preguntaActual.pregunta}
            </p>
          </div>

          <div className="space-y-2.5">
            {preguntaActual.opciones.map(opcion => {
              let cls =
                'w-full text-left p-4 rounded-xl border text-sm font-medium transition '
              if (!mostrarRespuesta) {
                cls +=
                  'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-gray-800'
              } else if (opcion === preguntaActual.respuesta_correcta) {
                cls += 'border-green-400 bg-green-50 text-green-800'
              } else if (opcion === seleccionActual) {
                cls += 'border-red-400 bg-red-50 text-red-800'
              } else {
                cls += 'border-gray-100 bg-gray-50 text-gray-400'
              }
              return (
                <button
                  key={opcion}
                  onClick={() => seleccionarOpcion(opcion)}
                  disabled={mostrarRespuesta}
                  className={cls}
                >
                  {opcion}
                </button>
              )
            })}
          </div>

          {mostrarRespuesta && (
            <div
              className={`rounded-2xl border p-5 space-y-4 ${
                esCorrecta ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-2">
                {esCorrecta ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-bold ${esCorrecta ? 'text-green-800' : 'text-red-800'}`}>
                  {esCorrecta ? '¡Correcto!' : (
                    <>
                      Incorrecto
                      <span className="font-normal ml-1 text-red-700">
                        — La correcta es: {preguntaActual.respuesta_correcta}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Explicación
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{preguntaActual.explicacion}</p>
              </div>

              {preguntaActual.fragmento_fuente && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    De tus apuntes
                  </p>
                  <blockquote className="text-xs text-gray-600 leading-relaxed bg-white/70 rounded-lg p-3 border border-gray-200 italic">
                    &ldquo;{preguntaActual.fragmento_fuente}&rdquo;
                  </blockquote>
                </div>
              )}
            </div>
          )}

          {mostrarRespuesta && (
            <button
              onClick={() => {
                const actuales = respuestas
                siguientePregunta(actuales)
              }}
              className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-brand-700 transition"
            >
              {esUltimaPregunta ? 'Ver resultados' : 'Siguiente pregunta'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Resultados
  if (estado === 'resultados') {
    const aciertos = respuestas.filter(r => r.correcta).length
    const porcentaje = Math.round((aciertos / preguntas.length) * 100)
    const colorScore =
      porcentaje >= 70 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'
    const bgScore =
      porcentaje >= 70
        ? 'border-green-200 bg-green-50'
        : porcentaje >= 50
        ? 'border-yellow-200 bg-yellow-50'
        : 'border-red-200 bg-red-50'
    const mensaje =
      porcentaje >= 70
        ? '¡Muy bien! Dominas estos contenidos.'
        : porcentaje >= 50
        ? 'Bien, pero repasa los fallos.'
        : 'Necesitas repasar más estos temas.'

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold text-gray-900">Resultados del test</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className={`rounded-2xl border p-8 text-center ${bgScore}`}>
            <Trophy className={`w-9 h-9 mx-auto mb-3 ${colorScore}`} />
            <p className={`text-5xl font-bold tabular-nums ${colorScore}`}>
              {aciertos}/{preguntas.length}
            </p>
            <p className={`text-xl font-semibold mt-1 ${colorScore}`}>{porcentaje}%</p>
            <p className="text-sm text-gray-600 mt-2">{mensaje}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Repaso de respuestas
            </p>
            {preguntas.map((p, i) => {
              const resp = respuestas.find(r => r.pregunta_id === p.id)
              const correcta = resp?.correcta ?? false
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${
                    correcta ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {correcta ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Pregunta {i + 1}</p>
                      <p className="text-sm text-gray-800 leading-snug mb-2">{p.pregunta}</p>
                      {!correcta && resp && (
                        <p className="text-xs text-red-700 mb-1">
                          Tu respuesta:{' '}
                          <span className="font-medium">{resp.seleccionada}</span>
                        </p>
                      )}
                      <p className="text-xs font-semibold text-green-700">
                        Correcta: {p.respuesta_correcta}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEstado('seleccion')
                setPreguntas([])
                setRespuestas([])
                setSesionId(null)
              }}
              className="flex-1 border border-brand-300 text-brand-700 rounded-xl py-3 font-semibold text-sm hover:bg-brand-50 transition"
            >
              Otro test
            </button>
            <Link
              href="/"
              className="flex-1 bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-brand-700 transition text-center"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
