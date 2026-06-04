'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

export type EvaluacionCaso = {
  cobertura: number
  comprension: number
  normativa: number
  coherencia_didactica: number
  claridad_estructura: number
  puntuacion_total: number
  feedback: string
  aspectos_bien: string[]
  aspectos_faltantes: string[]
  consejo_mejora: string
}

type Props = {
  evaluacion: EvaluacionCaso
  respuestaModelo: string
  onReintentar: () => void
}

const CRITERIOS: { key: keyof EvaluacionCaso; label: string }[] = [
  { key: 'cobertura', label: 'Cobertura' },
  { key: 'comprension', label: 'Comprensión' },
  { key: 'normativa', label: 'Normativa' },
  { key: 'coherencia_didactica', label: 'Coherencia Didáctica' },
  { key: 'claridad_estructura', label: 'Claridad y Estructura' },
]

function colorBarra(valor: number): string {
  if (valor > 7) return 'bg-green-500'
  if (valor >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function colorTotal(nota: number) {
  if (nota >= 70) return { text: 'text-green-600', bg: 'bg-green-50 border-green-200', msg: 'Buena respuesta' }
  if (nota >= 50) return { text: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', msg: 'Respuesta mejorable' }
  return { text: 'text-red-600', bg: 'bg-red-50 border-red-200', msg: 'Necesitas trabajar más' }
}

export default function ResultadoCaso({ evaluacion, respuestaModelo, onReintentar }: Props) {
  const [modeloVisible, setModeloVisible] = useState(false)

  const nota = Math.round(evaluacion.puntuacion_total)
  const { text, bg, msg } = colorTotal(nota)

  return (
    <div className="space-y-5">
      {/* Puntuación total */}
      <div className={`rounded-2xl border p-6 text-center ${bg}`}>
        <p className={`text-6xl font-bold tabular-nums ${text}`}>
          {nota}
          <span className="text-2xl font-semibold text-gray-400">/100</span>
        </p>
        <p className={`text-base font-semibold mt-2 ${text}`}>{msg}</p>
      </div>

      {/* Barras por criterio */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Por criterio</p>
        {CRITERIOS.map(({ key, label }) => {
          const valor = Number(evaluacion[key]) || 0
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 font-medium">{label}</span>
                <span className="text-xs font-bold tabular-nums text-gray-700">{valor}/10</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${colorBarra(valor)}`}
                  style={{ width: `${valor * 10}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Aspectos bien */}
      {evaluacion.aspectos_bien.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
              Aspectos bien trabajados
            </p>
          </div>
          <ul className="space-y-1.5">
            {evaluacion.aspectos_bien.map((a, i) => (
              <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">·</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aspectos faltantes */}
      {evaluacion.aspectos_faltantes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">
              Aspectos que faltan
            </p>
          </div>
          <ul className="space-y-1.5">
            {evaluacion.aspectos_faltantes.map((a, i) => (
              <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">·</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback del tribunal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Valoración del tribunal
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{evaluacion.feedback}</p>
      </div>

      {/* Consejo de mejora */}
      {evaluacion.consejo_mejora && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">
                Consejo de mejora
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">{evaluacion.consejo_mejora}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ver respuesta modelo */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setModeloVisible(v => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
        >
          <span className="text-sm font-semibold text-gray-700">Ver respuesta modelo</span>
          {modeloVisible
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>
        {modeloVisible && (
          <div className="px-4 pb-5 border-t border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-4">
              {respuestaModelo}
            </p>
          </div>
        )}
      </div>

      {/* Volver a intentarlo */}
      <button
        onClick={onReintentar}
        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        <RotateCcw className="w-4 h-4" />
        Volver a intentarlo
      </button>
    </div>
  )
}
