'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/15 text-white/70 hover:border-white/30 hover:text-white rounded-lg transition-colors no-print"
    >
      <Printer size={13} />
      Imprimir / PDF
    </button>
  )
}
