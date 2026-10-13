// Contexto de un bloque en HTML. Lo escribe el equipo y lo carga el seed; no viene de formularios.
import { marked } from 'marked'

export function contextoHtml(markdown: string): string {
  // Las tablas anchas se desplazan dentro de su caja, no la página
  return String(marked.parse(markdown, { async: false }))
    .replaceAll('<table>', '<div class="plan-table"><table>')
    .replaceAll('</table>', '</table></div>')
}
