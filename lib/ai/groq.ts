import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Contexto normativo compartido — convocatoria Aragón 2026
const CONTEXTO_OPOSICIONES = `Eres un experto preparador y evaluador de oposiciones de Educación Física para el Cuerpo de Maestros de España, especializado en la convocatoria de Aragón 2026 (308 plazas, pruebas a partir del 20 de junio de 2026).

Marco normativo vigente:
- Orden de 9 de septiembre de 1993 (BOE núm. 226, pág. 27400-27438): temario oficial EF Maestros Primaria (25 temas)
- Orden ECD/1112/2022: currículo de Educación Primaria en Aragón (competencias específicas, criterios de evaluación, saberes básicos)
- LOMLOE (Ley Orgánica 3/2020): marco legislativo educativo vigente
- Real Decreto 157/2022: enseñanzas mínimas Educación Primaria
- Orden ECD/864/2024: instrucciones organización y funcionamiento de CEIP en Aragón 2024/2025

Etapa: Educación Primaria, 6-12 años. Especialidad: Educación Física.`

export async function generarPreguntas(
  contenido: string,
  numPreguntas: number = 5,
  tituloTema?: string
): Promise<{ preguntas: Array<{ id: string; pregunta: string; puntos_clave: string[] }> }> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `${CONTEXTO_OPOSICIONES}\n\nRespondes ÚNICAMENTE con JSON válido y bien formado. Sin texto extra, sin markdown.`,
      },
      {
        role: 'user',
        content: `TEMA OFICIAL: ${tituloTema ?? 'Educación Física Primaria'}

MATERIAL DE REFERENCIA:
${contenido.slice(0, 5000)}

Genera exactamente ${numPreguntas} preguntas de examen oral para las oposiciones de EF Primaria Aragón 2026.

CRITERIOS:
- Preguntas abiertas que requieran 3-5 minutos de respuesta oral
- Al menos una debe pedir aplicación práctica en un aula de Primaria concreta
- Al menos una debe requerir referencia al currículo aragonés (Orden ECD/1112/2022) o LOMLOE
- Los puntos_clave son lo mínimo que el tribunal espera escuchar para considerar aprobada la pregunta
- Deben ser preguntas que realmente formularía un tribunal de Aragón, no preguntas genéricas

Devuelve SOLO este JSON con exactamente ${numPreguntas} preguntas:
{"preguntas":[{"id":"p1","pregunta":"Pregunta completa tal como la formularía el tribunal","puntos_clave":["Concepto fundamental 1","Concepto fundamental 2","Aplicación didáctica en Primaria","Marco normativo si aplica"]},{"id":"p2","pregunta":"...","puntos_clave":["...","...","..."]}]}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0].message.content ?? '{}'
  return JSON.parse(text)
}

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
  if (!respuestaUsuario.trim()) {
    return {
      porcentaje: 0,
      feedback: 'No se ha proporcionado ninguna respuesta.',
      puntos_cubiertos: [],
      puntos_faltantes: puntosClaveEsperados,
    }
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `${CONTEXTO_OPOSICIONES}

Actúas como miembro del tribunal de oposición de EF Primaria de Aragón. Tu evaluación debe ser rigurosa, justa y útil para que el opositor mejore de cara al examen real.

RÚBRICA DE EVALUACIÓN (basada en criterios oficiales Educaragón 2024):
1. Dominio conceptual: los conceptos son correctos, completos y explicados con profundidad
2. Estructura y claridad: la respuesta tiene una exposición organizada y fácil de seguir
3. Contextualización en Primaria: adapta los contenidos a la etapa (alumnado 6-12 años, currículo aragonés)
4. Fundamentación normativa: cita o aplica la legislación vigente cuando es pertinente al tema

ESCALA PORCENTUAL:
  0-20%  → Respuesta incorrecta, vacía o completamente fuera del tema. Suspenso claro.
 21-40%  → Muy superficial. Solo menciona términos sin desarrollarlos. No llegaría a aprobado.
 41-60%  → Conocimiento básico pero con lagunas importantes. Borde del aprobado.
 61-75%  → Buen nivel. Cubre lo esencial. El tribunal podría considerar aprobado.
 76-90%  → Muy buena respuesta. Sólida, contextualizada, bien estructurada. Notable.
 91-100% → Excelente. Completa, profunda, con normativa y aplicación práctica. Sobresaliente.

IMPORTANTE: Evalúa honestamente. Si la respuesta es pobre, la puntuación debe reflejarlo.
Responde ÚNICAMENTE con JSON válido.`,
      },
      {
        role: 'user',
        content: `PREGUNTA DEL TRIBUNAL:
"${pregunta}"

PUNTOS CLAVE QUE DEBE CUBRIR EL OPOSITOR:
${puntosClaveEsperados.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

CONTENIDO DE REFERENCIA:
${contenidoReferencia.slice(0, 4000)}

RESPUESTA DEL OPOSITOR:
"${respuestaUsuario}"

PROCESO DE EVALUACIÓN — sigue estos pasos:
1. Para cada punto clave: ¿lo menciona? ¿lo desarrolla con profundidad suficiente?
2. ¿Hay errores conceptuales o afirmaciones incorrectas?
3. ¿Adapta la respuesta al contexto real de un aula de Primaria en Aragón?
4. ¿Hace referencia a normativa (LOMLOE, Orden ECD/1112/2022, etc.)?
5. Asigna el porcentaje según la escala y redacta feedback específico de 3-5 frases.

El "feedback" debe ser MUY CONCRETO sobre esta respuesta específica:
- Nombra qué explicó bien con sus propias palabras
- Indica qué concepto clave omitió o desarrolló insuficientemente
- Da un ejemplo breve de cómo debería haberse explicado lo que faltó
- Si la respuesta es correcta pero le falta profundidad, di exactamente qué añadir

Los arrays deben contener exactamente los puntos de la lista de arriba según estén cubiertos o no.

Devuelve este JSON:
{
  "porcentaje": (número entero entre 0 y 100),
  "feedback": "3-5 frases específicas y concretas sobre esta respuesta",
  "puntos_cubiertos": ["punto clave de la lista que sí explicó con suficiente profundidad"],
  "puntos_faltantes": ["punto clave de la lista que faltó o fue insuficiente"]
}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0].message.content ?? ''
  return JSON.parse(text)
}
