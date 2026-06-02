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
        role: 'user',
        content: `Eres un preparador experto de oposiciones de educación física de Aragón.
A partir del siguiente texto, genera 10 preguntas test de ALTA CALIDAD.

REGLAS OBLIGATORIAS:
- Usa SOLO la información del texto proporcionado, nunca inventes nada
- La respuesta correcta siempre debe estar redactada con palabras literales del texto
- Las opciones incorrectas deben ser plausibles y muy similares a la correcta
- Las preguntas deben ser específicas, nunca genéricas
- Incluye conceptos exactos, cifras, autores, artículos o ideas clave del texto
- Prohibido hacer preguntas que se puedan responder sin haber leído el texto
- Mínimo el 60% de preguntas sobre conceptos específicos del texto
- Las 4 opciones deben tener longitud y estructura similares
- Se permite 'Todas las anteriores' máximo 2 veces: solo si A, B y C aparecen literalmente en el texto
- Se permite 'Ninguna de las anteriores' máximo 2 veces: solo si A, B y C contradicen el texto

TIPOS DE PREGUNTAS A INCLUIR:
- Definiciones precisas extraídas literalmente del texto
- Conceptos clave con sus matices exactos
- Diferencias entre conceptos similares mencionados en el texto
- Cifras, fechas, porcentajes o datos concretos del texto
- Aplicación de conceptos explicados en el texto

FORMATO DE RESPUESTA (JSON estricto):
{
  "preguntas": [
    {
      "id": "q1",
      "pregunta": "Pregunta específica y concreta",
      "opciones": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "respuesta_correcta": "A) Cita literal exacta del texto",
      "explicacion": "Esta es la respuesta correcta porque el texto dice literalmente: [cita exacta]",
      "fragmento_fuente": "Párrafo o frase exacta del texto de donde viene la pregunta"
    }
  ]
}

TEXTO A ANALIZAR:
${textoCombinado.slice(0, 8000)}

Ahora revisa cada pregunta generada y aplica estos filtros:
1. ¿La respuesta correcta está copiada literalmente del texto? Si no, corrígela
2. ¿Las opciones incorrectas son suficientemente similares a la correcta? Si no, hazlas más parecidas
3. ¿La pregunta se puede responder sin leer el texto? Si sí, hazla más específica
4. ¿El fragmento_fuente contiene exactamente la frase de donde viene la respuesta? Si no, corrígelo

Devuelve únicamente el JSON final revisado, sin texto adicional.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 3000,
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
