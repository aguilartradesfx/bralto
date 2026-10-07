// Contrato propio de la capa de pagos. El checkout habla con esto, no con una pasarela:
// cambiar de pasarela es escribir otro adaptador (servidor) y su formulario (cliente).

/** Monto en unidades enteras de la moneda: 97 = $97.00. Nunca en céntimos. */
export type Money = { amount: number; currency: string }

/** Modo real de la cuenta en la pasarela */
export type PaymentEnvironment = 'PROD' | 'TEST'

export type PaymentOrder = {
  /** Único por comercio para siempre; se genera y se guarda antes de cobrar */
  orderNumber: string
  money: Money
  description: string
  customer: { firstName: string; lastName: string; email: string; phone: string }
  locale: 'es' | 'en'
  /** A dónde vuelve el cliente al terminar (la pasarela le agrega su resultado) */
  returnUrl: string
}

/** Lo que el navegador necesita para mostrar el paso de pago; `provider` elige el formulario */
export type ClientCheckout = {
  provider: 'tilopay'
  expectedEnvironment: PaymentEnvironment
  params: TilopayInitParams
}

export type TilopayInitParams = {
  token: string
  currency: string
  language: 'es' | 'en'
  /** Unidades enteras de la moneda (ver Money) */
  amount: number
  orderNumber: string
  billToFirstName: string
  billToLastName: string
  billToEmail: string
  billToAddress: string
  billToCountry: string
  billToTelephone: string
  capture: 1
  subscription: 0
  hashVersion: 'V2'
  redirect: string
}

/** Estado de una orden según la pasarela: la única fuente para decidir si se entrega algo */
export type PaymentStatus =
  | { state: 'approved'; money: Money; environment: PaymentEnvironment; reference: string }
  | { state: 'declined'; reason: string }
  | { state: 'not_found' }
  | { state: 'unknown' }

export interface PaymentGateway {
  readonly provider: ClientCheckout['provider']
  prepareCheckout(order: PaymentOrder): Promise<ClientCheckout>
  getStatus(orderNumber: string): Promise<PaymentStatus>
  /** Solo una pista para saber qué orden revisar: el estado siempre se confirma con getStatus */
  orderFromWebhook(payload: unknown): string | null
}
