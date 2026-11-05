import { NextResponse, after } from 'next/server'
import { leerSignedRequest, respuestaMeta } from '@/lib/eliminar-datos/solicitud'
import { registrarSolicitud } from '@/lib/eliminar-datos/servidor'
import { SITE_URL } from '@/lib/seo'

// «Data deletion callback» de Meta: cuando alguien quita la app desde Facebook, Meta manda un POST con
// signed_request (firmado con la clave secreta de la app, META_APP_SECRET). Se guarda la solicitud y se
// contesta con la página donde ver el estado y su código. El middleware también manda aquí los POST a
// /eliminar-datos (lib/eliminar-datos/solicitud.ts, esAvisoDeMeta), por si en Meta quedó esa dirección.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secreto = process.env.META_APP_SECRET
  if (!secreto) {
    console.error('[eliminar-datos] falta META_APP_SECRET: no se puede revisar la firma de Meta')
    return NextResponse.json({ error: 'No disponible' }, { status: 503 })
  }

  let signed = ''
  try {
    const form = await request.formData()
    const v = form.get('signed_request')
    signed = typeof v === 'string' ? v : ''
  } catch {
    return NextResponse.json({ error: 'Falta signed_request' }, { status: 400 })
  }
  const datos = leerSignedRequest(signed, secreto)
  if (!datos) return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })

  try {
    const codigo = await registrarSolicitud({ origen: 'meta', metaUsuario: datos.userId }, after)
    return NextResponse.json(respuestaMeta(codigo, SITE_URL))
  } catch (err) {
    console.error('[eliminar-datos] no se pudo guardar la solicitud de Meta', err)
    return NextResponse.json({ error: 'No se pudo registrar' }, { status: 500 })
  }
}
