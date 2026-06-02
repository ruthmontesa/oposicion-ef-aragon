/**
 * Extrae texto de un PDF usando pdf-parse
 * Se ejecuta SOLO en el servidor (API routes)
 */
export async function extraerTextoPDF(buffer: Buffer): Promise<string> {
  // Importación dinámica para evitar problemas en el cliente
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Limpia y trunca el texto para enviarlo a la IA
 */
export function prepararTextoParaIA(texto: string, maxChars: number = 8000): string {
  return texto
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars)
}
