import { permanentRedirect } from 'next/navigation'

// El índice de noticias pasó a ser la pestaña Noticias de /es/recursos (5/11/2026). Las notas
// siguen en /noticias/<slug>: lo que Google ya tiene no se pierde.
export default function NoticiasPage() {
  permanentRedirect('/es/recursos/noticias')
}
