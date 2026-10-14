'use client'

import { Printer } from 'lucide-react'

interface Props {
  contractId: string
}

export function PrintButton({ contractId }: Props) {
  return (
    <a
      href={`/api/contracts/${contractId}/print`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 text-sm pn-btn-glass text-fg/80 hover:text-fg transition-colors"
    >
      <Printer size={13} />
      Imprimir / PDF
    </a>
  )
}
