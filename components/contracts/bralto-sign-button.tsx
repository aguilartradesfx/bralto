'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import SignatureCanvas from 'react-signature-canvas'
import { useRouter } from 'next/navigation'
import { PenLine, RotateCcw, X } from 'lucide-react'

interface Props {
  contractId: string
}

export function BraltoSignButton({ contractId }: Props) {
  const router = useRouter()
  const sigRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(480)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function openModal() {
    setOpen(true)
    setIsEmpty(true)
    setError(null)
    setTimeout(() => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth - 4)
      }
    }, 60)
  }

  function closeModal() {
    setOpen(false)
    sigRef.current?.clear()
    setIsEmpty(true)
    setError(null)
  }

  async function handleSign() {
    if (isEmpty) return
    const signatureData = sigRef.current?.toDataURL('image/png')
    if (!signatureData) return

    setLoading(true)
    setError(null)
    const res = await fetch(`/api/contracts/${contractId}/sign-bralto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature: signatureData }),
    })
    setLoading(false)

    if (res.ok) {
      closeModal()
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al firmar')
    }
  }

  const modal = open && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative pn-glass rounded-[24px] w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-fg font-semibold">Firma de Bralto</h3>
          <button onClick={closeModal} className="text-fg/40 hover:text-fg/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-fg/50">
          Tu firma cerrará el contrato como totalmente ejecutado.
        </p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-fg/40">Firma</span>
            <button
              onClick={() => { sigRef.current?.clear(); setIsEmpty(true) }}
              className="flex items-center gap-1 text-xs text-fg/40 hover:text-fg/60 transition-colors"
            >
              <RotateCcw size={11} /> Limpiar
            </button>
          </div>
          <div
            ref={containerRef}
            className={`border-2 rounded-xl overflow-hidden transition-colors ${isEmpty ? 'border-gray-300' : 'border-fg'}`}
          >
            <SignatureCanvas
              ref={sigRef}
              onEnd={() => setIsEmpty(sigRef.current?.isEmpty() ?? true)}
              penColor="#0a0a0a"
              canvasProps={{
                width: canvasWidth,
                height: 140,
                className: 'w-full touch-none bg-white',
                style: { display: 'block' },
              }}
            />
          </div>
          {isEmpty && (
            <p className="text-xs text-fg/30 mt-1">Dibujá tu firma en el recuadro</p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-fg/50 hover:text-fg/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={isEmpty || loading}
            onClick={handleSign}
            className="pn-btn-solid px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {loading ? 'Firmando...' : 'Confirmar firma'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        onClick={openModal}
        className="pn-btn-solid flex items-center gap-2 px-4 py-2 text-sm font-semibold"
      >
        <PenLine size={14} />
        Firmar como Bralto
      </button>
      {modal}
    </>
  )
}
