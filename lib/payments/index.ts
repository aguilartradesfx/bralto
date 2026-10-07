import { expectedEnvironment } from './environment'
import { buildInitParams, consultOrder, getSdkToken, orderFromWebhook } from './tilopay'
import type { PaymentGateway } from './types'

// Pasarela activa. Stripe sigue en lib/stripe pero desconectado: para volver a usarlo (u
// otra pasarela) se escribe su adaptador con este mismo contrato y se cambia esta línea.
export const paymentGateway: PaymentGateway = {
  provider: 'tilopay',
  async prepareCheckout(order) {
    const token = await getSdkToken()
    return {
      provider: 'tilopay',
      expectedEnvironment: expectedEnvironment(process.env),
      params: buildInitParams(order, { token }),
    }
  },
  getStatus: (orderNumber) => consultOrder(orderNumber),
  orderFromWebhook,
}

export { expectedEnvironment }
export type { ClientCheckout, Money, PaymentEnvironment, PaymentOrder, PaymentStatus } from './types'
