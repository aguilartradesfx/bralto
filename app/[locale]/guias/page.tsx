import { permanentRedirect } from 'next/navigation'

// Las guías se ven juntas en /es/recursos (la primera pestaña); cada una sigue en /es/guias/<slug>
export default function GuiasPage() {
  permanentRedirect('/es/recursos')
}
