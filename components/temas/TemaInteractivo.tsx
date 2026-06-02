'use client'

import { useState } from 'react'
import { Globe, FileUp, Loader2, ExternalLink } from 'lucide-react'
import { SubirApuntes } from './SubirApuntes'
import { SesionPreguntas } from './SesionPreguntas'
import type { Recurso } from '@/content/temas/recursos'

interface Pregunta {
  id: string
  pregunta: string
  puntos_clave: string[]
}

interface Props {
  temaNumero: number
  temaTitulo: string
  recursos: Recurso[]
}

type Vista = 'opciones' | 'apuntes' | 'sesion'

export function TemaInteractivo({ temaNumero, temaTitulo, recursos }: Props) {
  const [vista, setVista] = useState<Vista>('opciones')
  const [modo, setModo] = useState<'web' | 'apuntes'>('web')
  const [generando, setGenerando] = useState(false)
  const [sesionId, setSesionId] = useState('')
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [apuntesListos, setApuntesListos] = useState(false)
  const [temaIdDb, setTemaIdDb] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function generarPreguntas(modoActual: 'web' | 'apuntes') {
    setGenerando(true)
    setError('')

    try {
      const res = await fetch('/api/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema_numero: temaNumero,
          tema_id: temaIdDb ?? undefined,
          modo: modoActual,
          num_preguntas: 5,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error generando preguntas')
        setGenerando(false)
        return
      }

      setSesionId(data.sesion_id)
      setPreguntas(data.preguntas)
      setVista('sesion')
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  function handleApuntesListos(temaId: string) {
    setTemaIdDb(temaId)
    setApuntesListos(true)
  }

  function reiniciar() {
    setVista('opciones')
    setPreguntas([])
    setSesionId('')
    setApuntesListos(false)
    setError('')
  }

  // ── SESIÓN ACTIVA ─────────────────────────────────────────
  if (vista === 'sesion') {
    return (
      <SesionPreguntas
        sesionId={sesionId}
        preguntas={preguntas}
        temaNumero={temaNumero}
        onReiniciar={reiniciar}
      />
    )
  }

  // ── SELECCIÓN DE MODO ─────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Opción 1 — Recursos web */}
      <div
        className={`bg-white rounded-2xl border-2 transition cursor-pointer ${
          modo === 'web' ? 'border-brand-400' : 'border-gray-100 hover:border-gray-200'
        }`}
        onClick={() => { setModo('web'); setVista('opciones') }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recursos del temario</h3>
              <p className="text-xs text-gray-400">La IA genera preguntas basadas en el temario oficial</p>
            </div>
          </div>

          {/* Lista de recursos */}
          {recursos.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Referencias para estudio</p>
              {recursos.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-800 hover:underline transition group"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                  <span className="line-clamp-1">{r.titulo}</span>
                </a>
              ))}
            </div>
          )}

          {modo === 'web' && (
            <button
              onClick={e => { e.stopPropagation(); generarPreguntas('web') }}
              disabled={generando}
              className="mt-4 w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {generando ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</> : 'Generar preguntas'}
            </button>
          )}
        </div>
      </div>

      {/* Opción 2 — Mis apuntes */}
      <div
        className={`bg-white rounded-2xl border-2 transition cursor-pointer ${
          modo === 'apuntes' ? 'border-brand-400' : 'border-gray-100 hover:border-gray-200'
        }`}
        onClick={() => { setModo('apuntes'); setVista('apuntes') }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <FileUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Mis apuntes</h3>
              <p className="text-xs text-gray-400">Sube tu PDF y la IA generará preguntas sobre tu material</p>
            </div>
          </div>

          {(modo === 'apuntes' || vista === 'apuntes') && (
            <div onClick={e => e.stopPropagation()} className="space-y-4">
              <SubirApuntes
                temaNumero={temaNumero}
                onListos={handleApuntesListos}
              />
              {apuntesListos && (
                <button
                  onClick={() => generarPreguntas('apuntes')}
                  disabled={generando}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {generando ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</> : 'Generar preguntas desde mis apuntes'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
