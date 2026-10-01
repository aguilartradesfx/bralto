// SERVER-ONLY — correos de la sección Tareas, después de responder
import { after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getResend, FROM_TASKS } from '@/lib/email/resend'
import type { Notice } from '@/lib/tasks/rules'
import { taskEmail, type TaskEmailContext } from '@/lib/tasks/emails'

// Un correo que falla se registra y no afecta la acción del usuario
export function sendTaskNotices(notices: Notice[], ctx: TaskEmailContext): void {
  if (notices.length === 0) return
  after(async () => {
    const service = createServiceClient()
    for (const notice of notices) {
      try {
        const { data } = await service.auth.admin.getUserById(notice.to)
        const to = data.user?.email
        if (!to) continue
        const { subject, html } = taskEmail(notice.email, ctx)
        const { error } = await getResend().emails.send({ from: FROM_TASKS, to, subject, html })
        if (error) console.error('[tasks] correo no enviado', notice.email, error)
      } catch (err) {
        console.error('[tasks] correo no enviado', notice.email, err)
      }
    }
  })
}
