import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { generarPreguntas } from '@/lib/ai/groq'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'

function buildContenidoWeb(numero: number, titulo: string): string {
  return `TEMARIO OFICIAL OPOSICIONES EDUCACIÓN FÍSICA — ARAGÓN 2026

Tema ${numero}: ${titulo}

Este tema forma parte del temario oficial del Cuerpo de Profesores de Enseñanza Secundaria, especialidad Educación Física, en la Comunidad Autónoma de Aragón (convocatoria 2026).

El candidato debe dominar este tema con rigor académico y capacidad de aplicación práctica en la etapa de Educación Secundaria y Bachillerato. Las preguntas del tribunal evalúan tanto el conocimiento teórico como la capacidad de articular conceptos con claridad y precisión propias de un docente especialista.`
}

export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ──────────────────────────────────────
    const authClient = createSupabaseServer()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Validar body ───────────────────────────────────────
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })

    const { tema_id, tema_numero, modo, num_preguntas } = body as {
      tema_id?: string
      tema_numero?: number
      modo?: string
      num_preguntas?: number
    }

    if (!modo || !['web', 'apuntes'].includes(modo)) {
      return NextResponse.json({ error: 'modo debe ser "web" o "apuntes"' }, { status: 400 })
    }
    if (!tema_id && !tema_numero) {
      return NextResponse.json({ error: 'Se requiere tema_id o tema_numero' }, { status: 400 })
    }

    const numPreguntas = Math.min(Math.max(Number(num_preguntas) || 5, 1), 10)
    const db = createServerClient()

    // ── Obtener/crear tema en BD ───────────────────────────
    let temaId = tema_id
    let temaTitulo = ''

    if (tema_numero) {
      const temaStatic = TEMARIO_EF_ARAGON.find(t => t.numero === tema_numero)
      if (!temaStatic) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 })
      temaTitulo = temaStatic.titulo

      // Buscar en BD; crear si no existe
      let { data: temaDb } = await db
        .from('temas')
        .select('id')
        .eq('numero', tema_numero)
        .single()

      if (!temaDb) {
        const { data: nuevo } = await db
          .from('temas')
          .insert({ numero: tema_numero, titulo: temaStatic.titulo })
          .select('id')
          .single()
        temaDb = nuevo
      }

      temaId = temaDb?.id
    } else if (tema_id) {
      const { data: temaDb } = await db.from('temas').select('titulo').eq('id', tema_id).single()
      if (!temaDb) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 })
      temaTitulo = temaDb.titulo
    }

    if (!temaId) return NextResponse.json({ error: 'No se pudo resolver el tema' }, { status: 500 })

    // ── Construir contenido según modo ────────────────────
    let contenido = ''

    if (modo === 'web') {
      const numero = tema_numero ?? 0
      contenido = buildContenidoWeb(numero, temaTitulo)
    } else {
      // modo === 'apuntes'
      const { data: apuntes } = await db
        .from('apuntes_usuario')
        .select('contenido_texto, nombre_archivo')
        .eq('user_id', user.id)
        .eq('tema_id', temaId)
        .not('contenido_texto', 'is', null)

      if (!apuntes || apuntes.length === 0) {
        return NextResponse.json(
          { error: 'No tienes apuntes subidos para este tema' },
          { status: 422 }
        )
      }

      contenido = apuntes
        .map((a: { nombre_archivo: string; contenido_texto: string }) => `[${a.nombre_archivo}]\n${a.contenido_texto}`)
        .join('\n\n---\n\n')
    }

    // ── Generar preguntas con Gemini ───────────────────────
    const { preguntas } = await generarPreguntas(contenido, numPreguntas, temaTitulo)

    // ── Guardar sesión ─────────────────────────────────────
    const { data: sesion, error: sesionError } = await db
      .from('sesiones_estudio')
      .insert({
        user_id: user.id,
        tema_id: temaId,
        modo: modo === 'web' ? 'base' : 'apuntes',
        preguntas,
        respuestas: [],
        puntuaciones: [],
        completada: false,
      })
      .select('id')
      .single()

    if (sesionError) {
      console.error('[/api/preguntas]', sesionError.message)
      return NextResponse.json({ error: 'Error guardando la sesión' }, { status: 500 })
    }

    return NextResponse.json({ sesion_id: sesion.id, tema: { id: temaId, titulo: temaTitulo }, preguntas })
  } catch (err) {
    console.error('[/api/preguntas] Unexpected:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
