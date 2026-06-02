function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
}

const STOPWORDS = new Set([
  'para', 'como', 'este', 'esta', 'esto', 'desde', 'hasta', 'entre',
  'cuando', 'donde', 'aunque', 'pero', 'porque', 'sino', 'sobre',
  'todas', 'todos', 'cada', 'cual', 'cuya', 'cuyo', 'mediante',
])

function filtrarStopwords(tokens: string[]): string[] {
  return tokens.filter(t => !STOPWORDS.has(t))
}

export function similitudJaccard(texto1: string, texto2: string): number {
  const arr1 = filtrarStopwords(tokenize(texto1))
  const arr2 = filtrarStopwords(tokenize(texto2))
  const set2 = new Set(arr2)
  const set1 = new Set(arr1)
  // Array.from evita spread de Set (compatible con cualquier target de TS)
  const interseccion = Array.from(set1).filter(x => set2.has(x))
  const union = Array.from(set1).concat(Array.from(set2).filter(x => !set1.has(x)))
  if (union.length === 0) return 0
  return (interseccion.length / union.length) * 100
}

export function coberturaKeywords(
  respuestaUsuario: string,
  textoReferencia: string
): { porcentaje: number; encontradas: string[]; faltantes: string[] } {
  const palabrasRef = filtrarStopwords(tokenize(textoReferencia))
  const palabrasUser = new Set(filtrarStopwords(tokenize(respuestaUsuario)))

  const freq: Record<string, number> = {}
  for (const p of palabrasRef) {
    freq[p] = (freq[p] ?? 0) + 1
  }

  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word)

  const encontradas = keywords.filter(k => palabrasUser.has(k))
  const faltantes = keywords.filter(k => !palabrasUser.has(k))

  return {
    porcentaje: keywords.length > 0 ? (encontradas.length / keywords.length) * 100 : 0,
    encontradas,
    faltantes: faltantes.slice(0, 10),
  }
}

export function similitudCombinada(
  respuestaUsuario: string,
  respuestaModelo: string
): number {
  const jaccard = similitudJaccard(respuestaUsuario, respuestaModelo)
  const { porcentaje: cobertura } = coberturaKeywords(respuestaUsuario, respuestaModelo)
  return Math.round(jaccard * 0.4 + cobertura * 0.6)
}
