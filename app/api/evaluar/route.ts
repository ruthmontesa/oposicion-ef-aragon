import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { evaluarRespuesta } from '@/lib/ai/groq'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'

export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ──────────────────────────────────────
    const authClient = createSupabaseServer()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })

    const { sesion_id, pregunta_id, respuesta_usuario, puntos_clave, tema_numero } = body as {
      sesion_id?: string
      pregunta_id?: string
      respuesta_usuario?: string
      puntos_clave?: string[]
      tema_numero?: number
    }

    if (!sesion_id || !pregunta_id || !respuesta_usuario) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const db = createServerClient()

    // ── Obtener la sesión y la pregunta ────────────────────
    const { data: sesion } = await db
      .from('sesiones_estudio')
      .select('preguntas, tema_id, modo')
      .eq('id', sesion_id)
      .eq('user_id', user.id)
      .single()

    if (!sesion) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

    const preguntas = sesion.preguntas as Array<{
      id: string
      pregunta: string
      puntos_clave: string[]
    }>

    const pregunta = preguntas.find(p => p.id === pregunta_id)
    if (!pregunta) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })

    const puntosEsperados = puntos_clave ?? pregunta.puntos_clave

    // ── Construir contenido de referencia ──────────────────
    let contenidoReferencia = ''

    if (sesion.modo === 'apuntes') {
      const { data: apuntes } = await db
        .from('apuntes_usuario')
        .select('contenido_texto')
        .eq('user_id', user.id)
        .eq('tema_id', sesion.tema_id)
        .not('contenido_texto', 'is', null)
        .limit(1)

      contenidoReferencia = apuntes?.[0]?.contenido_texto ?? ''
    }

    if (!contenidoReferencia && tema_numero) {
      const temaStatic = TEMARIO_EF_ARAGON.find(t => t.numero === tema_numero)
      if (temaStatic) {
        contenidoReferencia = `Tema ${temaStatic.numero}: ${temaStatic.titulo}. Temario oficial oposiciones EF Aragón 2026.`
      }
    }

    if (!contenidoReferencia) {
      const { data: temaDb } = await db
        .from('temas')
        .select('numero, titulo, contenido_base')
        .eq('id', sesion.tema_id)
        .single()

      contenidoReferencia = temaDb?.contenido_base
        ?? `Tema ${temaDb?.numero}: ${temaDb?.titulo ?? 'Educación Física'}`
    }

    // ── Evaluar con Gemini ─────────────────────────────────
    const evaluacion = await evaluarRespuesta(
      pregunta.pregunta,
      respuesta_usuario,
      contenidoReferencia,
      puntosEsperados
    )

    // ── Persistir puntuación en la sesión ──────────────────
    const { data: sesionActual } = await db
      .from('sesiones_estudio')
      .select('puntuaciones, respuestas')
      .eq('id', sesion_id)
      .single()

    const puntuacionesActuales = (sesionActual?.puntuaciones as unknown[]) ?? []
    const respuestasActuales = (sesionActual?.respuestas as unknown[]) ?? []

    await db
      .from('sesiones_estudio')
      .update({
        puntuaciones: [...puntuacionesActuales, { pregunta_id, ...evaluacion }],
        respuestas: [...respuestasActuales, { pregunta_id, respuesta: respuesta_usuario }],
      })
      .eq('id', sesion_id)

    return NextResponse.json(evaluacion)
  } catch (err) {
    console.error('[/api/evaluar]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
