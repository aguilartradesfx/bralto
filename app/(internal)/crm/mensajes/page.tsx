import { SinSeleccion } from '@/components/crm/bandeja'

export const metadata = { title: 'Mensajes' }

// Sin un chat elegido: en la compu, el aviso a la derecha; en el teléfono, solo la lista (la pone el layout)
export default function MensajesPage() {
  return <SinSeleccion />
}
