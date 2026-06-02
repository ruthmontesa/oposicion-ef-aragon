// ============================================================
// TIPOS GLOBALES DE LA APLICACIÓN
// ============================================================

export type Tema = {
  id: string
  numero: number
  titulo: string
  contenido_base: string | null
  preguntas_base: PreguntaBase[] | null
  created_at: string
}

export type PreguntaBase = {
  pregunta: string
  puntos_clave: string[]
}

export type ApunteUsuario = {
  id: string
  user_id: string
  tema_id: string
  nombre_archivo: string
  storage_path: string
  contenido_texto: string
  created_at: string
}

export type ModoPregunta = 'base' | 'apuntes' | 'todo'

export type SesionEstudio = {
  id: string
  user_id: string
  tema_id: string
  modo: ModoPregunta
  preguntas: PreguntaGenerada[]
  respuestas: RespuestaUsuario[]
  puntuaciones: Puntuacion[]
  created_at: string
}

export type PreguntaGenerada = {
  id: string
  pregunta: string
  puntos_clave: string[]
}

export type RespuestaUsuario = {
  pregunta_id: string
  respuesta: string
}

export type Puntuacion = {
  pregunta_id: string
  porcentaje: number
  feedback: string
  puntos_cubiertos: string[]
  puntos_faltantes: string[]
}

export type CasoPractico = {
  id: string
  anio: number
  convocatoria: string
  enunciado: string
  criterios_correccion: string | null
  respuesta_modelo: string
  fuente: string | null
  created_at: string
}

export type IntentoCaso = {
  id: string
  user_id: string
  caso_id: string
  respuesta_usuario: string
  porcentaje_similitud: number
  feedback: string
  created_at: string
}

export type ProgresoUsuario = {
  user_id: string
  tema_id: string
  veces_estudiado: number
  ultima_puntuacion: number | null
  tema?: Tema
}

export type Profile = {
  id: string
  email: string
  nombre: string | null
  avatar_url: string | null
  created_at: string
}
