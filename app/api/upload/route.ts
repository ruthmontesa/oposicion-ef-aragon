import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { extraerTextoPDF, prepararTextoParaIA } from '@/lib/utils/pdf'
import { TEMARIO_EF_ARAGON } from '@/content/temas/temario'

export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ──────────────────────────────────────
    const authClient = createSupabaseServer()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const temaNumeroStr = formData.get('temaNumero') as string | null

    if (!file || !temaNumeroStr) {
      return NextResponse.json({ error: 'Faltan archivo o temaNumero' }, { status: 400 })
    }

    const temaNumero = parseInt(temaNumeroStr)
    if (isNaN(temaNumero)) {
      return NextResponse.json({ error: 'temaNumero inválido' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })
    }

    const db = createServerClient()

    // ── Obtener/crear tema en BD ───────────────────────────
    let { data: tema } = await db
      .from('temas')
      .select('id')
      .eq('numero', temaNumero)
      .single()

    if (!tema) {
      const temaStatic = TEMARIO_EF_ARAGON.find(t => t.numero === temaNumero)
      const { data: nuevo } = await db
        .from('temas')
        .insert({
          numero: temaNumero,
          titulo: temaStatic?.titulo ?? `Tema ${temaNumero}`,
        })
        .select('id')
        .single()
      tema = nuevo
    }

    if (!tema) {
      return NextResponse.json({ error: 'No se pudo crear el tema en la base de datos' }, { status: 500 })
    }

    // ── Extraer texto del PDF ──────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    const textoRaw = await extraerTextoPDF(buffer)
    const contenidoTexto = prepararTextoParaIA(textoRaw)

    // ── Subir a Supabase Storage ───────────────────────────
    const storagePath = `${user.id}/${temaNumero}/${Date.now()}-${file.name}`
    const { error: storageError } = await db.storage
      .from('apuntes')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

    if (storageError) {
      // El bucket puede no existir — continuar guardando el texto igualmente
      console.warn('[/api/upload] Storage error (bucket "apuntes" quizás no existe):', storageError.message)
    }

    // ── Guardar en apuntes_usuario ─────────────────────────
    const { error: dbError } = await db.from('apuntes_usuario').insert({
      user_id: user.id,
      tema_id: tema.id,
      nombre_archivo: file.name,
      storage_path: storageError ? '' : storagePath,
      contenido_texto: contenidoTexto,
    })

    if (dbError) {
      console.error('[/api/upload] DB error:', dbError.message)
      return NextResponse.json({ error: 'Error guardando los apuntes' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, temaId: tema.id })
  } catch (err) {
    console.error('[/api/upload]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
