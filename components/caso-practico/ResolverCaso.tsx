'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Timer, TimerOff } from 'lucide-react'
import ResultadoCaso, { type EvaluacionCaso } from './ResultadoCaso'

type CasoData = {
  id: string
  anio: number
  convocatoria: string
  enunciado: string
  criterios_correccion: string | null
  respuesta_modelo: string
}

function formatTiempo(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export default function ResolverCaso({ caso }: { caso: CasoData }) {
  const [respuesta, setRespuesta] = useState('')
  const [evaluando, setEvaluando] = useState(false)
  const [evaluacion, setEvaluacion] = useState<EvaluacionCaso | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timerActivo, setTimerActivo] = useState(false)
  const [segundos, setSegundos] = useState(2 * 60 * 60)

  useEffect(() => {
    if (!timerActivo) return
    const id = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          clearInterval(id)
          setTimerActivo(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActivo])

  const palabras = respuesta.trim() ? respuesta.trim().split(/\s+/).length : 0

  async function evaluar() {
    if (!respuesta.trim()) return
    setEvaluando(true)
    setError(null)
    try {
      const res = await fetch('/api/caso/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caso_id: caso.id, respuesta_usuario: respuesta }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al evaluar')
      setEvaluacion(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setEvaluando(false)
    }
  }

  function reintentar() {
    setRespuesta('')
    setEvaluacion(null)
    setError(null)
    setTimerActivo(false)
    setSegundos(2 * 60 * 60)
  }

  const timerColor = segundos < 600 ? 'text-red-600' : segundos < 1800 ? 'text-yellow-600' : 'text-gray-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/caso-practico" className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Caso Práctico · {caso.anio}
              </p>
              <h1 className="text-base font-bold text-gray-900 line-clamp-1">{caso.convocatoria}</h1>
            </div>
          </div>

          {/* Temporizador */}
          <div className="flex items-center gap-2">
            {timerActivo && (
              <span className={`text-sm font-mono font-bold tabular-nums ${timerColor}`}>
                {segundos === 0 ? 'Tiempo agotado' : formatTiempo(segundos)}
              </span>
            )}
            <button
              onClick={() => setTimerActivo(v => !v)}
              title={timerActivo ? 'Pausar temporizador' : 'Iniciar temporizador (2 h)'}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              {timerActivo ? <TimerOff className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Enunciado */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">
            Enunciado del caso
          </p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {caso.enunciado}
          </p>
        </div>

        {!evaluacion ? (
          <>
            {/* Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tu respuesta
                </label>
                <span className={`text-xs tabular-nums font-medium ${
                  palabras >= 500 ? 'text-green-600' : palabras >= 200 ? 'text-yellow-600' : 'text-gray-400'
                }`}>
                  {palabras} palabras
                  {palabras < 500 && ' (recomendado: 500+)'}
                </span>
              </div>
              <textarea
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                disabled={evaluando}
                rows={16}
                placeholder="Desarrolla tu respuesta aquí. Ten en cuenta los apartados del enunciado, cita la normativa vigente (LOMLOE, Orden ECD/1112/2022) y aplica los conceptos al contexto de Educación Física en Aragón."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition resize-none disabled:bg-gray-50 disabled:text-gray-500 leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              onClick={evaluar}
              disabled={evaluando || !respuesta.trim()}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition disabled:cursor-not-allowed"
            >
              {evaluando ? 'Evaluando respuesta...' : 'Evaluar mi respuesta'}
            </button>

            {evaluando && (
              <p className="text-xs text-center text-gray-400">
                El tribunal está revisando tu respuesta. Puede tardar unos segundos.
              </p>
            )}
          </>
        ) : (
          <ResultadoCaso
            evaluacion={evaluacion}
            respuestaModelo={caso.respuesta_modelo}
            onReintentar={reintentar}
          />
        )}
      </div>
    </div>
  )
}
