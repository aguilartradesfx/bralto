import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export const FROM = 'Bralto <contratos@send.bralto.io>'
export const FROM_TASKS = 'Bralto <tareas@send.bralto.io>'
