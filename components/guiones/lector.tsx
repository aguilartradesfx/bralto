'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GuionFila, Vista } from '@/lib/guiones/tipos'
import { AYUDA_VISTA, ETIQUETA_VISTA, etiquetaGancho } from '@/lib/guiones/vista'
import { usarPantallaPrendida } from './pantalla-prendida'

// «Leer para grabar»: el guion a pantalla completa, con letra grande y fondo oscuro (siempre, aunque el panel esté en
// claro), las líneas en orden con su etiqueta y al final los ganchos. Se sale con «Salir» (arriba y abajo) o con Esc.
// Mientras está abierto, la pantalla no se apaga (si el navegador deja). El tamaño de letra se recuerda en este teléfono.

const LLAVE = 'bralto-guiones-letra'
const MIN = 0.75
const MAX = 1.75
const PASO = 0.125

// Los mismos tonos de las etiquetas del panel, pensados para el fondo oscuro
const COLOR: Record<Vista, string> = { usted: '#ff9a63', mitad: '#8ab4ff', motion: '#c8a6ff' }
const CHICO =
  'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ffffff14] font-semibold text-[#ededed] transition-opacity disabled:opacity-30'

export function Lector({ guion, cerrar }: { guion: GuionFila | null; cerrar(): void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const salir = useRef<HTMLButtonElement>(null)
  const [escala, setEscala] = useState(1)
  const abierto = guion?.id ?? null
  const pantalla = usarPantallaPrendida(abierto !== null)

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(LLAVE))
      if (v >= MIN && v <= MAX) setEscala(v)
    } catch {}
  }, [])

  // Se abre por id: si la página se pone al día mientras lee, no se cierra ni vuelve arriba
  useEffect(() => {
    const d = ref.current
    if (!d || !abierto) return
    if (!d.open) d.showModal()
    d.scrollTop = 0
    salir.current?.focus({ preventScroll: true })
    const raiz = document.documentElement
    const antes = raiz.style.overflow
    raiz.style.overflow = 'hidden'
    return () => {
      raiz.style.overflow = antes
      if (d.open) d.close()
    }
  }, [abierto])

  const cambiar = useCallback((delta: number) => {
    setEscala((e) => {
      const nueva = Math.min(MAX, Math.max(MIN, Math.round((e + delta) / PASO) * PASO))
      try {
        localStorage.setItem(LLAVE, String(nueva))
      } catch {}
      return nueva
    })
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={cerrar}
      aria-labelledby="lector-titulo"
      className="m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-[#0a0a0a] p-0 text-[#ededed] backdrop:bg-black"
    >
      {guion && (
        <>
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#ffffff14] bg-[#0a0a0a] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p id="lector-titulo" className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#bdbdbd]">
              {guion.titulo}
            </p>
            <button type="button" onClick={() => cambiar(-PASO)} disabled={escala <= MIN} aria-label="Letra más chica" className={`${CHICO} text-[14px]`}>
              A−
            </button>
            <button type="button" onClick={() => cambiar(PASO)} disabled={escala >= MAX} aria-label="Letra más grande" className={`${CHICO} text-[18px]`}>
              A+
            </button>
            <button ref={salir} type="button" onClick={cerrar} className="h-11 shrink-0 rounded-full bg-[#ffffff24] px-5 text-[15px] font-semibold text-[#f5f5f5]">
              Salir
            </button>
          </div>

          <div className="mx-auto max-w-3xl px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6 sm:px-8" style={{ fontSize: `${escala}rem` }}>
            {pantalla === 'no' && (
              <p className="mb-6 rounded-xl bg-[#ffffff0f] px-4 py-3 text-[0.875em] leading-snug text-[#bdbdbd]">
                Este teléfono puede apagar la pantalla solo: tócala de vez en cuando.
              </p>
            )}
            <p className="mb-8 text-[0.8em] leading-relaxed text-[#8f8f8f]">
              {(Object.keys(COLOR) as Vista[]).map((v, i) => (
                <span key={v}>
                  {i > 0 && ' · '}
                  <b className="font-bold tracking-[0.1em]" style={{ color: COLOR[v] }}>
                    {ETIQUETA_VISTA[v]}
                  </b>
                  : {AYUDA_VISTA[v].toLowerCase()}
                </span>
              ))}
            </p>

            <ol className="space-y-10">
              {guion.lineas.map((l, i) => (
                <li key={i}>
                  <p className="text-[0.8em] font-bold tracking-[0.14em]" style={{ color: COLOR[l.vista] ?? COLOR.usted }}>
                    <span className="tabular-nums text-[#7a7a7a]">{i + 1}</span> · {ETIQUETA_VISTA[l.vista] ?? l.vista}
                  </p>
                  <p className="mt-2 text-[1.75em] font-medium leading-[1.35] [text-wrap:pretty]">{l.dice}</p>
                  {l.pantalla && <p className="mt-2 text-[0.95em] leading-snug text-[#8f8f8f]">En pantalla: {l.pantalla}</p>}
                </li>
              ))}
            </ol>

            {guion.ganchos.length > 0 && (
              <section aria-labelledby="lector-ganchos" className="mt-16 border-t border-[#ffffff1a] pt-10">
                <h2 id="lector-ganchos" className="text-[0.8em] font-bold tracking-[0.14em] text-[#bdbdbd]">
                  LOS {guion.ganchos.length} GANCHOS
                </h2>
                <p className="mt-1 text-[0.95em] text-[#8f8f8f]">Grábalos aparte: cada uno arranca una versión de prueba.</p>
                <ol className="mt-8 space-y-10">
                  {guion.ganchos.map((g, i) => (
                    <li key={i}>
                      <p className="text-[0.8em] font-bold tracking-[0.14em] text-[#ff9a63]">
                        <span className="tabular-nums text-[#7a7a7a]">{i + 1}</span> · {etiquetaGancho(g.tipo).toUpperCase()}
                      </p>
                      <p className="mt-2 text-[1.75em] font-medium leading-[1.35] [text-wrap:pretty]">{g.dice}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <button type="button" onClick={cerrar} className="mt-16 h-14 w-full rounded-2xl bg-[#ffffff24] text-[17px] font-semibold text-[#f5f5f5]">
              Salir
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}
