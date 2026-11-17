'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProposal } from '@/app/(internal)/propuestas/actions'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
}

export function DeleteProposalButton({ slug }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Borrar esta propuesta y sus PDF? No se puede deshacer.')) return
    startTransition(async () => {
      await deleteProposal(slug)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-fg/45 transition-colors hover:text-red-400 disabled:opacity-40"
    >
      <Trash2 size={13} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
      Borrar
    </button>
  )
}
