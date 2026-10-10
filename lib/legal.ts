// Política de privacidad y términos. Revisados por el abogado: se publican en todas partes.
// Si vuelven a ser borrador (false), solo se ven donde se ven los bloques pendientes
// (desarrollo y previews de Vercel, ver lib/home/pending.ts); en producción las páginas dan
// 404 y los enlaces del pie y del banner de cookies no aparecen.
export const LEGAL_REVIEWED = true

export function legalPagesVisible({ reviewed, pendingVisible }: { reviewed: boolean; pendingVisible: boolean }): boolean {
  return reviewed || pendingVisible
}
