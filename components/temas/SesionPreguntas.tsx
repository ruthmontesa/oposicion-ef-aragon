'use client'

import { useState } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'

interface Pregunta {
  id: string
  pregunta: string
  puntos_clave: string[]
}

interface Resultado {
  porcentaje: number
  feedback: string
  puntos_cubiertos: string[]
  puntos_faltantes: string[]
}

interface Props {
  sesionId: string
  preguntas: Pregunta[]
  temaNumero: number
  onReiniciar: () => void
}

function BarraProgreso({ valor }: { valor: number }) {
  const color = valor >= 70 ? 'bg-brand-500' : valor >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${valor}%` }} />
    </div>
  )
}

export function SesionPreguntas({ sesionId, preguntas, temaNumero, onReiniciar }: Props) {
  const [indice, setIndice] = useState(0)
  const [respuesta, setRespuesta] = useState('')
  const [evaluando, setEvaluando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [historial, setHistorial] = useState<(Resultado & { pregunta: string })[]>([])

  const preguntaActual = preguntas[indice]
  const esUltima = indice === preguntas.length - 1
  const terminado = indice >= preguntas.length

  async function evaluar() {
    if (!respuesta.trim()) return
    setEvaluando(true)

    try {
      const res = await fetch('/api/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId,
          pregunta_id: preguntaActual.id,
          respuesta_usuario: respuesta,
          puntos_clave: preguntaActual.puntos_clave,
          tema_numero: temaNumero,
        }),
      })
      const data: Resultado = await res.json()
      setResultado(data)
      setHistorial(h => [...h, { ...data, pregunta: preguntaActual.pregunta }])
    } catch {
      // mantener el estado si falla
    } finally {
      setEvaluando(false)
    }
  }

  function siguiente() {
    setIndice(i => i + 1)
    setRespuesta('')
    setResultado(null)
  }

  // ── RESUMEN FINAL ─────────────────────────────────────────
  if (terminado) {
    const promedio = Math.round(historial.reduce((s, r) => s + r.porcentaje, 0) / historial.length)
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sesión completada</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{promedio}%</p>
          <BarraProgreso valor={promedio} />
          <p className="text-sm text-gray-500 mt-3">{preguntas.length} preguntas respondidas</p>
        </div>

        <div className="space-y-3">
          {historial.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-gray-700 flex-1">{r.pregunta}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  r.porcentaje >= 70 ? 'bg-brand-100 text-brand-700'
                  : r.porcentaje >= 40 ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-600'
                }`}>{r.porcentaje}%</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.feedback}</p>
              {r.puntos_faltantes.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-red-500 font-medium mb-1">Faltó mencionar:</p>
                  <ul className="space-y-0.5">
                    {r.puntos_faltantes.map((p, j) => (
                      <li key={j} className="text-xs text-gray-500">· {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onReiniciar}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Volver al tema
        </button>
      </div>
    )
  }

  // ── PREGUNTA ACTUAL ───────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Pregunta {indice + 1} de {preguntas.length}</span>
        <span>{historial.length > 0 ? `Media: ${Math.round(historial.reduce((s, r) => s + r.porcentaje, 0) / historial.length)}%` : ''}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div className="bg-brand-400 h-1 rounded-full transition-all" style={{ width: `${((indice) / preguntas.length) * 100}%` }} />
      </div>

      {/* Pregunta */}
      <div className="bg-white rounded-xl border border-brand-100 p-5">
        <p className="text-sm font-medium text-gray-800 leading-relaxed">{preguntaActual.pregunta}</p>
        {preguntaActual.puntos_clave.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Puntos clave a cubrir</p>
            <div className="flex flex-wrap gap-1">
              {preguntaActual.puntos_clave.map((p, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Respuesta */}
      <textarea
        value={respuesta}
        onChange={e => setRespuesta(e.target.value)}
        disabled={!!resultado}
        rows={6}
        placeholder="Escribe tu respuesta aquí... Desarrolla los puntos clave del tema como si estuvieras ante el tribunal."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition resize-none disabled:bg-gray-50 disabled:text-gray-500"
      />

      {/* Resultado */}
      {resultado && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${resultado.porcentaje >= 70 ? 'text-brand-600' : resultado.porcentaje >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
              {resultado.porcentaje}%
            </span>
            <div className="flex-1"><BarraProgreso valor={resultado.porcentaje} /></div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{resultado.feedback}</p>
          {resultado.puntos_cubiertos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-brand-600 mb-1">Cubiertos:</p>
              <ul className="space-y-0.5">{resultado.puntos_cubiertos.map((p, i) => <li key={i} className="text-xs text-gray-600">✓ {p}</li>)}</ul>
            </div>
          )}
          {resultado.puntos_faltantes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1">Faltaron:</p>
              <ul className="space-y-0.5">{resultado.puntos_faltantes.map((p, i) => <li key={i} className="text-xs text-gray-500">· {p}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      {!resultado ? (
        <button
          onClick={evaluar}
          disabled={evaluando || !respuesta.trim()}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {evaluando ? 'Evaluando...' : 'Evaluar respuesta'}
        </button>
      ) : (
        <button
          onClick={esUltima ? siguiente : siguiente}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {esUltima ? 'Ver resumen' : 'Siguiente pregunta'}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
