/**
 * Calcula la similitud entre dos textos usando TF-IDF y Jaccard
 * No requiere IA — funciona de forma local y gratuita
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3) // ignora palabras cortas
}

const STOPWORDS = new Set([
  'para', 'como', 'este', 'esta', 'esto', 'desde', 'hasta', 'entre',
  'cuando', 'donde', 'aunque', 'pero', 'porque', 'sino', 'sobre',
  'todas', 'todos', 'cada', 'cual', 'cuya', 'cuyo', 'mediante',
  'through', 'with', 'that', 'this', 'from', 'they', 'have', 'what',
])

function filtrarStopwords(tokens: string[]): string[] {
  return tokens.filter(t => !STOPWORDS.has(t))
}

/**
 * Similitud Jaccard entre dos conjuntos de palabras
 */
export function similitudJaccard(texto1: string, texto2: string): number {
  const set1 = new Set(filtrarStopwords(tokenize(texto1)))
  const set2 = new Set(filtrarStopwords(tokenize(texto2)))
  const interseccion = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  if (union.size === 0) return 0
  return (interseccion.size / union.size) * 100
}

/**
 * Cobertura: qué % de palabras clave del texto de referencia
 * aparecen en la respuesta del usuario
 */
export function coberturaKeywords(
  respuestaUsuario: string,
  textoReferencia: string
): { porcentaje: number; encontradas: string[]; faltantes: string[] } {
  const palabrasRef = filtrarStopwords(tokenize(textoReferencia))
  const palabrasUser = new Set(filtrarStopwords(tokenize(respuestaUsuario)))

  // Frecuencia de palabras en referencia (top keywords)
  const freq: Record<string, number> = {}
  for (const p of palabrasRef) {
    freq[p] = (freq[p] || 0) + 1
  }

  // Top 30 keywords por frecuencia
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word)

  const encontradas = keywords.filter(k => palabrasUser.has(k))
  const faltantes = keywords.filter(k => !palabrasUser.has(k))

  return {
    porcentaje: keywords.length > 0 ? (encontradas.length / keywords.length) * 100 : 0,
    encontradas,
    faltantes: faltantes.slice(0, 10), // top 10 faltantes
  }
}

/**
 * Similitud combinada para casos prácticos:
 * 60% cobertura de keywords + 40% Jaccard
 */
export function similitudCombinada(
  respuestaUsuario: string,
  respuestaModelo: string
): number {
  const jaccard = similitudJaccard(respuestaUsuario, respuestaModelo)
  const { porcentaje: cobertura } = coberturaKeywords(respuestaUsuario, respuestaModelo)
  return Math.round(jaccard * 0.4 + cobertura * 0.6)
}
