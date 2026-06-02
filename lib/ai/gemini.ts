import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

/**
 * Genera preguntas de examen oral basadas en el contenido del tema
 */
export async function generarPreguntas(
  contenido: string,
  numPreguntas: number = 5,
  tituloTema?: string
): Promise<{ preguntas: Array<{ id: string; pregunta: string; puntos_clave: string[] }> }> {
  const prompt = `Eres un experto en oposiciones de Educación Física en España, especializado en las oposiciones de Aragón 2026.

${tituloTema ? `TEMA: ${tituloTema}` : ''}

CONTENIDO DEL TEMA:
${contenido.slice(0, 8000)}

INSTRUCCIÓN: Genera exactamente ${numPreguntas} preguntas tipo examen oral de oposición. Las preguntas deben ser profundas, relevantes para el temario oficial, y similares a las que haría un tribunal de oposición real.

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones):
{
  "preguntas": [
    {
      "id": "p1",
      "pregunta": "Pregunta completa aquí",
      "puntos_clave": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
    }
  ]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean)
}

/**
 * Evalúa la respuesta del usuario comparándola con el contenido de referencia
 */
export async function evaluarRespuesta(
  pregunta: string,
  respuestaUsuario: string,
  contenidoReferencia: string,
  puntosClaveEsperados: string[]
): Promise<{
  porcentaje: number
  feedback: string
  puntos_cubiertos: string[]
  puntos_faltantes: string[]
}> {
  const prompt = `Eres un tribunal de oposición de Educación Física evaluando una respuesta oral.

PREGUNTA: ${pregunta}

PUNTOS CLAVE ESPERADOS:
${puntosClaveEsperados.map((p, i) => `${i + 1}. ${p}`).join('\n')}

CONTENIDO DE REFERENCIA (resumen del tema):
${contenidoReferencia.slice(0, 4000)}

RESPUESTA DEL OPOSITOR:
${respuestaUsuario}

Evalúa la respuesta y devuelve ÚNICAMENTE este JSON:
{
  "porcentaje": 75,
  "feedback": "Feedback constructivo y específico en 2-3 frases",
  "puntos_cubiertos": ["Punto que sí ha mencionado"],
  "puntos_faltantes": ["Punto que le ha faltado mencionar"]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean)
}
