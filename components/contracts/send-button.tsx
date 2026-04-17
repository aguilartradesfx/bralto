'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export function SendButton({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSend() {
    setLoading(true)
    const res = await fetch(`/api/contracts/${contractId}/send`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      window.location.reload()
    }
  }

  if (done) return null

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      <Send size={13} />
      {loading ? 'Enviando...' : 'Generar enlace'}
    </button>
  )
}
