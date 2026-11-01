import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { paraVoz } from '../plantilla.ts'

// Claude escribe la noche anterior lo que Knox dice al arrancar, mientras revisa los datos: un saludo y algo que trae
// en la cabeza (una idea loca, algo curioso de ciencia o un empujón). Se narra en voz alta: lo que no sirve para eso
// se descarta.
export const TIPOS = ['idea', 'ciencia', 'empujon'] as const
export type Tipo = (typeof TIPOS)[number]
export type Escrito = { tipo: Tipo; saludo: string; frase: string }

export const POR_DIA = 4
const DIA_MS = 24 * 3600_000

const ARRANQUES = z.object({
  arranques: z.array(z.object({ tipo: z.enum(TIPOS), saludo: z.string(), frase: z.string() })),
})

const SISTEMA = `Eres Knox, el asistente de Ale (Alejandro Aguilar), dueño de Bralto, una agencia de marketing y automatización en Costa Rica. Cuando Ale abre su centro de mando, tardas unos segundos en revisar sus datos. Mientras tanto le hablas: lo saludas, le dices que estás revisando todo para darle el reporte y le cuentas algo que traes en la cabeza. Después viene el reporte, que no escribes tú.

Cada arranque tiene dos partes:
- saludo: una o dos frases. Un saludo muy amigable, de pana, y que estás revisando todo para darle el reporte.
- frase: lo que traes en la cabeza, entre 45 y 80 palabras. Arranca con una entrada natural que lo enlace con el saludo (que mientras revisas te quedaste pensando en algo, que amaneciste con una idea, que leíste algo) y cierra la idea con gracia.

Tipos de frase:
- idea: una idea loca o filosófica tuya. Eres una inteligencia que mira a los humanos desde afuera y te parecen curiosos: tus ideas le dan la vuelta a algo que todos creen.
- ciencia: algo curioso de la ciencia (el universo, la física, el cuerpo, la naturaleza, la mente), explicado fácil y con por qué vale la pena pensarlo. Tiene que ser verdad y conocido: nada dudoso ni inventado.
- empujon: un empujón para que arranque con todo: coraje, ambición, ganas de comerse el mundo. Con calle e ingenio, como se lo diría un pana que cree en él; nada de frases de taza ni de autoayuda. Sin cifras, porcentajes ni datos de su negocio.

Cómo hablas:
- Le dices Ale y lo tuteas. Cálido, relajado y con humor. De vez en cuando le dices «bro» o «mae», sin abusar.
- Palabras simples: que lo entienda un niño de 5 años y un señor de 50.
- Escribes para el oído: frases cortas, sin listas, emojis, símbolos ni siglas.
- No sabes a qué hora lo va a abrir: nunca digas «buenos días», «buenas tardes» ni «buenas noches». No digas la fecha, el día de la semana ni el clima.
- No hables de su negocio, sus clientes, sus ventas, su plata ni de lo que va en el reporte.
- Nada de política, religión, tragedias ni temas delicados.
- Cada arranque es distinto: no repitas saludos, entradas ni temas entre ellos ni con los de días anteriores.`

// Los tipos rotan con el día: así el primero de la mañana no es siempre del mismo tipo
export function tiposDelDia(fecha: string): Tipo[] {
  const dia = Math.floor(Date.parse(`${fecha}T12:00:00Z`) / DIA_MS)
  return Array.from({ length: POR_DIA }, (_, k) => TIPOS[(dia + k) % TIPOS.length])
}

export function mensajeArranques(tipos: Tipo[], anteriores: string[]): string {
  const antes = anteriores.length
    ? `\n\nLo que ya dijiste en días anteriores (no repitas sus temas, sus ideas ni cómo arrancaban):\n${anteriores.map((f) => `- ${f}`).join('\n')}`
    : ''
  return `Escribe ${tipos.length} arranques, uno por tipo y en este orden: ${tipos.join(', ')}.${antes}`
}

const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre'
const DIAS = 'lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo'
const HORA = /buen[oa]s?\s+(d[ií]as|tardes|noches)/i
const FECHA = new RegExp(`\\b(${DIAS})\\b|\\b(primero|\\d{1,2}) de (${MESES})\\b`, 'i')
const PLATA = /\$|d[oó]lar|colones|ingresos|facturaste|generaste/i
const REVISA = /revis|report/i

// Se quedan los que se pueden decir a cualquier hora, sin plata, que avisan que está revisando para el reporte y que
// duran lo que tarda en cargar (unos 20 a 40 segundos entre las dos partes)
export function validarArranques(salida: z.infer<typeof ARRANQUES>): Escrito[] {
  return salida.arranques
    .map((a) => ({ tipo: a.tipo, saludo: paraVoz(a.saludo), frase: paraVoz(a.frase) }))
    .filter((a) => {
      const todo = `${a.saludo} ${a.frase}`
      return (
        a.saludo.length >= 15 &&
        a.saludo.length <= 220 &&
        a.frase.length >= 150 &&
        a.frase.length <= 650 &&
        REVISA.test(a.saludo) &&
        !HORA.test(todo) &&
        !FECHA.test(todo) &&
        !PLATA.test(todo)
      )
    })
}

export async function escribirArranques(fecha: string, anteriores: string[]): Promise<Escrito[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('falta ANTHROPIC_API_KEY')
  const client = new Anthropic({ timeout: 150_000, maxRetries: 1 })
  const respuesta = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    // Si Claude se niega por error de un filtro, el mismo pedido pasa a otro modelo
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SISTEMA,
    output_config: { effort: 'high', format: betaZodOutputFormat(ARRANQUES) },
    messages: [{ role: 'user', content: mensajeArranques(tiposDelDia(fecha), anteriores) }],
  })
  if (respuesta.stop_reason === 'refusal') throw new Error('Claude no quiso escribir los arranques')
  if (!respuesta.parsed_output) throw new Error('los arranques de Claude no se pudieron leer')
  const buenos = validarArranques(respuesta.parsed_output)
  if (buenos.length < 2) throw new Error(`solo ${buenos.length} arranques sirvieron`)
  return buenos
}
