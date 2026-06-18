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

    const prompt = `Eres un miembro de un tribunal oficial de oposiciones de maestros de 
Educación Física en Aragón. Evalúa la respuesta del opositor con rigor 
académico, como en un examen escrito de 2 horas. NO evalúes solo si 
aparecen palabras clave — evalúa si el opositor entiende y explica 
correctamente las ideas.

━━━ RÚBRICA DE EVALUACIÓN (0–10 por criterio) ━━━

1. COBERTURA (peso 25%)
   - 9–10: Aborda todos los apartados del enunciado con desarrollo propio,
           incluyendo atención a la diversidad
   - 7–8:  Aborda la mayoría con alguna laguna menor
   - 5–6:  Falta un apartado relevante, desarrollo superficial, o no menciona
           atención a la diversidad
   - 0–4:  Ignora apartados enteros o la respuesta es una lista de palabras clave

2. COMPRENSIÓN (peso 25%)
   - 9–10: Explica y relaciona los conceptos con precisión y profundidad
   - 7–8:  Explica bien pero sin relacionar todos los conceptos entre sí
   - 5–6:  Menciona los conceptos correctos pero sin explicación propia
   - 0–4:  Copia frases sin demostrar comprensión real, o solo enumera 
           palabras clave sin desarrollarlas (máximo 4)

3. NORMATIVA (peso 20%)
   - 9–10: Cita y aplica correctamente LOMLOE y normativa aragonesa vigente
   - 7–8:  Cita normativa relevante pero con algún error menor de aplicación
   - 5–6:  Menciona normativa de forma genérica sin aplicarla al caso
   - 0–4:  No cita ninguna normativa o la normativa citada es incorrecta
   Regla: si no cita ninguna normativa → máximo 5

4. COHERENCIA DIDÁCTICA (peso 20%)
   - 9–10: Propuestas viables, inclusivas, ajustadas al currículo EF Aragón
           y a la diversidad del aula
   - 7–8:  Propuestas coherentes pero con algún elemento genérico o poco
           desarrollado
   - 5–6:  Propuestas correctas en teoría pero poco contextualizadas o sin
           atención a la diversidad
   - 0–4:  Propuestas inviables, genéricas o que ignoran la inclusión

5. CLARIDAD Y ESTRUCTURA (peso 10%)
   - 9–10: Organización clara, redacción precisa, fácil de evaluar
   - 7–8:  Bien estructurada con algún problema menor de redacción
   - 5–6:  Estructura confusa o redacción que dificulta la comprensión
   - 0–4:  Sin estructura, muy difícil de seguir

━━━ REGLAS OBLIGATORIAS ━━━

PENALIZACIONES (se aplican antes de cualquier otra valoración):
- Respuesta < 100 palabras → máximo 3 en TODOS los criterios
- Solo enumera palabras clave sin desarrollar → máximo 4 en COMPRENSIÓN
- No menciona atención a la diversidad → penalizar COBERTURA (máximo 6)
- No cita ninguna normativa → máximo 5 en NORMATIVA

RESPUESTA MUY COMPLETA (cuando no aplica ninguna penalización):
- Si cubre TODOS los apartados, cita normativa correcta, incluye atención
  a la diversidad y tiene estructura clara → mínimo 8,5 en cada criterio
- Una respuesta completa y coherente NO puede bajar de 8 en ningún criterio
  aunque no sea perfecta
- Reserva puntuaciones por debajo de 5 SOLO para respuestas que ignoran
  apartados enteros, no citan normativa o son incoherentes didácticamente

━━━ CONTEXTO ━━━

ENUNCIADO:
${caso.enunciado}

CRITERIOS OFICIALES:
${caso.criterios_correccion ?? 'No especificados — aplicar criterios generales de evaluación docente.'}

RESPUESTA MODELO:
${caso.respuesta_modelo}

RESPUESTA DEL OPOSITOR:
${respuesta_usuario}

━━━ FORMATO DE SALIDA ━━━

Devuelve ÚNICAMENTE este JSON (sin markdown, sin texto adicional):
{
  "cobertura": number,
  "comprension": number,
  "normativa": number,
  "coherencia_didactica": number,
  "claridad_estructura": number,
  "puntuacion_total": number,
  "feedback": "2–4 párrafos como daría un tribunal real: qué se valoró, qué falta y por qué",
  "aspectos_bien": ["aspecto concreto 1", "aspecto concreto 2"],
  "aspectos_faltantes": ["aspecto concreto 1", "aspecto concreto 2"],
  "consejo_mejora": "Un consejo específico y accionable"
}

puntuacion_total = (cobertura×0.25 + comprension×0.25 + normativa×0.20 +
                    coherencia_didactica×0.20 + claridad_estructura×0.10) × 10
Redondea a entero.`

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