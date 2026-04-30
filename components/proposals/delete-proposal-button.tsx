'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProposal } from '@/app/propuestas/actions'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
}

export function DeleteProposalButton({ slug }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar esta propuesta? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteProposal(slug)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      title="Eliminar propuesta"
      className="text-white/30 hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  )
}
