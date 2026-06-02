import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function dividirEnChunks(texto: string, palabrasPorChunk = 500): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  for (let i = 0; i < palabras.length; i += palabrasPorChunk) {
    const chunk = palabras.slice(i, i + palabrasPorChunk).join(' ')
    if (chunk.length > 100) chunks.push(chunk)
  }
  return chunks
}

function seleccionarChunksAleatorios(
  apuntesConChunks: { chunks: string[] }[],
  maxPorTema = 2,
  maxTotal = 6
): string {
  const pool: string[] = []
  for (const { chunks } of apuntesConChunks) {
    if (chunks.length === 0) continue
    const shuffled = [...chunks].sort(() => Math.random() - 0.5)
    pool.push(...shuffled.slice(0, maxPorTema))
  }
  return pool
    .sort(() => Math.random() - 0.5)
    .slice(0, maxTotal)
    .join('\n\n---\n\n')
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { tema_ids } = await request.json() as { tema_ids: string[] }

  if (!Array.isArray(tema_ids) || tema_ids.length === 0) {
    return NextResponse.json({ error: 'Debes seleccionar al menos un tema' }, { status: 400 })
  }

  const { data: apuntes, error } = await supabase
    .from('apuntes_usuario')
    .select('contenido_texto, tema_id')
    .eq('user_id', session.user.id)
    .in('tema_id', tema_ids)

  if (error || !apuntes || apuntes.length === 0) {
    return NextResponse.json(
      { error: 'No se encontraron apuntes para los temas seleccionados' },
      { status: 404 }
    )
  }

  const apuntesConChunks = apuntes.map(a => ({
    chunks: dividirEnChunks(a.contenido_texto ?? ''),
  }))

  const textoCombinado = seleccionarChunksAleatorios(apuntesConChunks)

  if (!textoCombinado.trim()) {
    return NextResponse.json({ error: 'Los apuntes seleccionados están vacíos' }, { status: 400 })
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Eres un preparador experto de oposiciones de educación física de Aragón. Responde ÚNICAMENTE con JSON válido y bien formado. Sin texto extra, sin markdown.',
      },
      {
        role: 'user',
        content: `A partir del siguiente texto, genera 10 preguntas test de ALTA CALIDAD.

REGLAS:
- Usa SOLO la información del texto proporcionado
- No inventes nada que no esté en el texto
- Las preguntas deben ser específicas, no genéricas
- Incluye conceptos exactos, artículos o ideas clave del texto
- Evita preguntas obvias o triviales
- Las opciones incorrectas deben ser plausibles y muy similares entre sí

TIPOS DE PREGUNTAS: definiciones precisas, conceptos clave, diferencias entre conceptos, aplicación básica

TEXTO:
${textoCombinado.slice(0, 8000)}

Devuelve ÚNICAMENTE este JSON:
{
  "preguntas": [
    {
      "id": "q1",
      "pregunta": "...",
      "opciones": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "respuesta_correcta": "A) ...",
      "explicacion": "Explicación de por qué es correcta",
      "fragmento_fuente": "Párrafo exacto del texto del que viene la pregunta"
    }
  ]
}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  const preguntas: unknown[] = parsed.preguntas ?? []

  let sesionId: string | null = null
  try {
    const { data: sesion } = await supabase
      .from('sesiones_estudio')
      .insert({
        user_id: session.user.id,
        tema_id: tema_ids[0],
        modo: 'test',
        preguntas,
        respuestas: [],
        puntuaciones: [],
        completada: false,
      })
      .select('id')
      .single()
    sesionId = sesion?.id ?? null
  } catch {
    // Migration 002 may not have been applied yet — continue without saving
  }

  return NextResponse.json({ sesion_id: sesionId, preguntas })
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { sesion_id, respuestas, puntuacion_final } = await request.json() as {
    sesion_id: string
    respuestas: Array<{ pregunta_id: string; seleccionada: string; correcta: boolean }>
    puntuacion_final: number
  }

  if (sesion_id) {
    await supabase
      .from('sesiones_estudio')
      .update({
        respuestas,
        puntuaciones: [{ porcentaje: puntuacion_final, tipo: 'test' }],
        completada: true,
      })
      .eq('id', sesion_id)
      .eq('user_id', session.user.id)
  }

  return NextResponse.json({ ok: true })
}
