// Política de privacidad y términos: son borradores pendientes de revisión legal. Mientras
// LEGAL_REVIEWED sea false solo se ven donde se ven los bloques pendientes (desarrollo y
// previews de Vercel, ver lib/home/pending.ts); en producción las páginas dan 404 y los
// enlaces del pie y del banner de cookies no aparecen. Con la revisión aprobada: true.
export const LEGAL_REVIEWED = false

export function legalPagesVisible({ reviewed, pendingVisible }: { reviewed: boolean; pendingVisible: boolean }): boolean {
  return reviewed || pendingVisible
}
