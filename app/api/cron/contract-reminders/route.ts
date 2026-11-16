import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getResend, FROM } from '@/lib/email/resend'
import { emailContractReminder } from '@/lib/email/templates'
import { conOficina, cuerpoDe } from '@/lib/oficina/envoltorio'
import { resumenContratos } from '@/lib/oficina/resumenes'

// Vercel Cron — runs daily at 10am CR time (UTC-6 → 16:00 UTC)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const o = await conOficina('inko', async () => {
    const supabase = createServiceClient()
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, slug, data, sent_at')
      .eq('status', 'sent')
      .lt('sent_at', twoDaysAgo)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bralto.io'
    let sent = 0

    for (const c of contracts ?? []) {
      const correo = c.data?.cliente?.correo_notificaciones ?? c.data?.cliente?.correo_facturacion
      if (!correo) continue

      const { subject, html } = emailContractReminder({
        clienteName: c.data?.cliente?.representante_nombre ?? 'Cliente',
        empresa: c.data?.cliente?.empresa_nombre ?? '',
        contractUrl: `${siteUrl}/c/${c.slug}`,
      })

      const result = await getResend().emails.send({ from: FROM, to: correo, subject, html }).catch(() => null)
      if (result) {
        await supabase.from('contract_events').insert({
          contract_id: c.id,
          event_type: 'reminder_sent',
          metadata: { sent_to: correo },
        })
        sent++
      }
    }
    return {
      ...resumenContratos(sent),
      detalle: { ok: true, reminders_sent: sent },
    }
  }, { inicio: 'Estoy revisando los contratos sin firmar' })
  return NextResponse.json(cuerpoDe(o))
}
