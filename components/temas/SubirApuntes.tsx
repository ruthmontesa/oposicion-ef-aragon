'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  temaNumero: number
  onListos: (temaId: string) => void
}

type Estado = 'idle' | 'subiendo' | 'ok' | 'error'

export function SubirApuntes({ temaNumero, onListos }: Props) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  const procesar = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setMensajeError('Solo se aceptan archivos PDF')
      setEstado('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMensajeError('El archivo supera el límite de 10 MB')
      setEstado('error')
      return
    }

    setNombreArchivo(file.name)
    setEstado('subiendo')
    setMensajeError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('temaNumero', temaNumero.toString())

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setMensajeError(data.error ?? 'Error al subir el archivo')
        setEstado('error')
        return
      }

      setEstado('ok')
      onListos(data.temaId)
    } catch {
      setMensajeError('Error de red. Inténtalo de nuevo.')
      setEstado('error')
    }
  }, [temaNumero, onListos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => { if (files[0]) procesar(files[0]) },
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: estado === 'subiendo' || estado === 'ok',
  })

  if (estado === 'ok') {
    return (
      <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
        <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-800">Apuntes listos</p>
          <p className="text-xs text-brand-600">{nombreArchivo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/50'
        } ${estado === 'subiendo' ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {estado === 'subiendo' ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm text-gray-500">Procesando {nombreArchivo}...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <FileText className="w-8 h-8 text-brand-500" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Suelta el PDF aquí' : 'Arrastra tu PDF o haz clic'}
            </p>
            <p className="text-xs text-gray-400">Solo PDF · Máximo 10 MB</p>
          </div>
        )}
      </div>

      {estado === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}
    </div>
  )
}
