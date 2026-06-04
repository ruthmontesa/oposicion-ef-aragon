import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const authClient = createSupabaseServer()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })

    const { caso_id, respuesta_usuario } = body as {
      caso_id?: string
      respuesta_usuario?: string
    }

    if (!caso_id || !respuesta_usuario) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const db = createServerClient()

    const { data: caso } = await db
      .from('casos_practicos')
      .select('enunciado, criterios_correccion, respuesta_modelo')
      .eq('id', caso_id)
      .single()

    if (!caso) return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })

    const prompt = `Eres un tribunal oficial de oposiciones de maestros de Educación Física de Aragón. Tu tarea es evaluar la respuesta del opositor comparándola con la respuesta modelo y los criterios de corrección oficiales.

IMPORTANTE:
- NO evalúes solo si aparecen palabras clave
- Evalúa si el opositor entiende y explica correctamente las ideas
- Penaliza respuestas que solo copian frases sin desarrollo propio
- Valora la claridad, coherencia y estructura como haría un tribunal real
- Ten en cuenta que es un examen escrito de 2 horas

CRITERIOS DE EVALUACIÓN (puntuar del 0 al 10 cada uno):
1. COBERTURA: ¿Incluye los apartados y puntos importantes que pide el enunciado?
2. COMPRENSIÓN: ¿Explica correctamente los conceptos o solo los menciona?
3. NORMATIVA: ¿Cita y aplica correctamente la legislación educativa vigente (LOMLOE, normativa aragonesa)?
4. COHERENCIA DIDÁCTICA: ¿Las propuestas son viables, inclusivas y coherentes con el currículo de EF en Aragón?
5. CLARIDAD Y ESTRUCTURA: ¿Está bien organizada y redactada la respuesta?

INSTRUCCIONES ADICIONALES:
- Si el opositor solo enumera palabras clave sin desarrollar → máximo 4 en comprensión
- Si no cita ninguna normativa → máximo 5 en normativa
- Si no menciona atención a la diversidad → penalizar cobertura
- Si la respuesta es vaga o genérica → bajar coherencia didáctica
- Si la respuesta es menor de 100 palabras → puntuación máxima 3 en todos los criterios

CASO ESPECIAL - RESPUESTA MUY COMPLETA:
- Si la respuesta cubre TODOS los apartados del enunciado, cita normativa correcta, incluye atención a la diversidad y tiene estructura clara → la puntuación mínima en cada criterio debe ser 8,5/10
- Una respuesta que desarrolla todos los puntos pedidos con coherencia y rigor NO puede bajar de 8/10 en ningún criterio aunque no sea perfecta
- Reserva puntuaciones por debajo de 5 en cualquier criterio SOLO para respuestas que ignoran apartados enteros, no citan normativa o son incoherentes didácticamente

DEVUELVE ÚNICAMENTE ESTE JSON (sin texto adicional, sin markdown):
{
  "cobertura": number,
  "comprension": number,
  "normativa": number,
  "coherencia_didactica": number,
  "claridad_estructura": number,
  "puntuacion_total": number,
  "feedback": "Feedback detallado como daría un tribunal real, señalando qué falta y qué está bien",
  "aspectos_bien": ["aspecto1", "aspecto2"],
  "aspectos_faltantes": ["aspecto1", "aspecto2"],
  "consejo_mejora": "Un consejo específico y accionable para mejorar la respuesta"
}

CALCULA puntuacion_total con estos pesos:
cobertura * 0.25 + comprension * 0.25 + normativa * 0.20 + coherencia_didactica * 0.20 + claridad_estructura * 0.10
Multiplica por 10 para obtener nota sobre 100.

ENUNCIADO DEL CASO:
${caso.enunciado}

CRITERIOS DE CORRECCIÓN OFICIALES:
${caso.criterios_correccion ?? 'No especificados — usar criterios generales de evaluación docente.'}

RESPUESTA MODELO DE REFERENCIA:
${caso.respuesta_modelo}

RESPUESTA DEL OPOSITOR A EVALUAR:
${respuesta_usuario}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const evaluacion = JSON.parse(completion.choices[0].message.content ?? '{}')

    // Recalcular puntuacion_total nosotros — Groq a veces olvida el ×10
    evaluacion.puntuacion_total = Math.round(
      ((Number(evaluacion.cobertura) || 0) * 0.25 +
        (Number(evaluacion.comprension) || 0) * 0.25 +
        (Number(evaluacion.normativa) || 0) * 0.20 +
        (Number(evaluacion.coherencia_didactica) || 0) * 0.20 +
        (Number(evaluacion.claridad_estructura) || 0) * 0.10) *
        10
    )

    await db.from('intentos_caso').insert({
      user_id: user.id,
      caso_id,
      respuesta_usuario,
      porcentaje_similitud: evaluacion.puntuacion_total ?? 0,
      feedback: evaluacion.feedback ?? '',
    })

    return NextResponse.json(evaluacion)
  } catch (err) {
    console.error('[/api/caso/evaluar]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
