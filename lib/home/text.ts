// Primera frase de un texto (la historia de cada caso, en el carrusel del home). Corta en . ! ?
// seguidos de un espacio y una mayúscula (o ¿ ¡), así no se queda en abreviaturas como "U.S."
export function firstSentence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s+[¿¡]?[A-ZÁÉÍÓÚÜÑ])/)
  return match ? match[0] : trimmed
}
