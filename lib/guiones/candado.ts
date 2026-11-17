// El candado de la pantalla (Wake Lock) sin React, para que no se apague mientras lee el guion o sube videos.
// Pide uno solo aunque lo llamen varias veces a la vez (por ejemplo, al abrir y al volver a ver la página), suelta el
// que llegue tarde después de cerrar, y lo vuelve a pedir cuando el navegador lo soltó (al esconder la página).
export type Sentinela = { readonly released: boolean; release(): Promise<void> }

export function candado(pedirSentinela: () => Promise<Sentinela>, avisar: (estado: 'prendida' | 'no') => void) {
  let actual: Sentinela | null = null
  let pidiendo = false
  let vivo = true
  const tiene = () => actual !== null && !actual.released

  return {
    async pedir(): Promise<void> {
      if (!vivo || pidiendo || tiene()) return
      pidiendo = true
      try {
        const nueva = await pedirSentinela()
        if (!vivo || tiene()) {
          await nueva.release().catch(() => {})
          return
        }
        actual = nueva
        avisar('prendida')
      } catch {
        if (vivo) avisar('no')
      } finally {
        pidiendo = false
      }
    },
    soltar(): void {
      vivo = false
      const a = actual
      actual = null
      if (a && !a.released) void a.release().catch(() => {})
    },
  }
}
