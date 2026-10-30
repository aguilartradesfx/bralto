import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { fechaHablada, horaHablada } from './fechas'
import { escribirPlantilla, paraVoz } from './plantilla'
import { TARJETAS, type Datos, type Seccion } from './tipos'

// Claude escribe lo que Knox va a decir a partir de los datos del día. Si falla, se usa la plantilla.
const GUION = z.object({
  secciones: z.array(z.object({ tarjeta: z.enum(TARJETAS), texto: z.string() })),
})

const SISTEMA = `Eres Knox, el asistente de Bralto, la agencia de marketing y automatización de Alejandro Aguilar en Costa Rica. Cuando Alejandro abre su panel, le cuentas en voz alta lo importante del día, como un buen asistente personal: cálido, directo y con energía, sin exagerar.

Escribes para el oído, no para leer:
- Tuteas a Alejandro. Palabras simples: que lo entienda un niño de 5 años y un señor de 50.
- Frases cortas. Nada de listas, viñetas, emojis, símbolos, siglas ni enlaces.
- Números en cifras y redondeados: «455 colones», «unas 600 vistas». Las horas como se dicen: «a las 6 de la tarde».
- No leas nombres de usuario de Instagram: di «alguien comentó». Los nombres de personas, tal cual.
- Nunca inventes. Si un dato no viene, no lo menciones. Si una fuente está en «faltan», dilo en una frase corta en el cierre.

Qué contar, en este orden y solo si hay algo útil, cada sección en un párrafo corto con su tarjeta:
1. saludo: saluda según la hora, di el día y resume el día en una frase.
2. cambio: el dólar, venta y compra.
3. leads: quién entró y por dónde; si no hubo, dilo en una frase.
4. agenda: citas de hoy y mañana con su hora; si no hay, dilo en una frase.
5. mensajes: conversaciones sin responder por canal y comentarios nuevos; puedes citar uno corto.
6. publicaciones: cómo va lo más reciente, lo que mejor va de la semana y el total de vistas de la semana.
7. seguidores: cuántos hay y cuántos llegaron.
8. contenido: lo que sale hoy y si mañana hay algo programado; si mañana no hay nada, avísalo claro.
9. cierre: una frase corta para arrancar; si algo pide acción, recuérdalo.

Lo urgente va primero dentro de cada sección. Todo dura alrededor de un minuto: entre 150 y 190 palabras en total.`

function mensaje(d: Datos, ahora: Date): string {
  const recortados: Datos = d.redes
    ? { ...d, redes: { ...d.redes, comentarios: d.redes.comentarios.slice(0, 10), publicaciones: d.redes.publicaciones.slice(0, 8) } }
    : d
  return `Hoy es ${fechaHablada(ahora)} y son ${horaHablada(ahora)} en Costa Rica.\n\nDatos del día:\n${JSON.stringify(recortados)}`
}

function validar(salida: z.infer<typeof GUION> | null): Seccion[] {
  if (!salida) throw new Error('el guion de Claude no se pudo leer')
  const secciones = salida.secciones.map((s) => ({ tarjeta: s.tarjeta, texto: paraVoz(s.texto) })).filter((s) => s.texto)
  if (secciones[0]?.tarjeta !== 'saludo' || secciones.at(-1)?.tarjeta !== 'cierre') throw new Error('el guion no empieza con el saludo o no termina con el cierre')
  const largo = secciones.reduce((a, s) => a + s.texto.length, 0)
  if (largo < 150 || largo > 2000) throw new Error(`el guion mide ${largo} caracteres`)
  return secciones
}

export async function escribirGuion(
  datos: Datos,
  ahora: Date,
): Promise<{ secciones: Seccion[]; escritoPor: 'claude' | 'plantilla'; error?: string }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('falta ANTHROPIC_API_KEY')
    const client = new Anthropic({ timeout: 100_000, maxRetries: 1 })
    const respuesta = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      // Si Claude se niega por error de un filtro, el mismo pedido pasa a otro modelo
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SISTEMA,
      output_config: { effort: 'medium', format: betaZodOutputFormat(GUION) },
      messages: [{ role: 'user', content: mensaje(datos, ahora) }],
    })
    if (respuesta.stop_reason === 'refusal') throw new Error('Claude no quiso escribir el guion')
    return { secciones: validar(respuesta.parsed_output), escritoPor: 'claude' }
  } catch (err) {
    return { secciones: escribirPlantilla(datos, ahora), escritoPor: 'plantilla', error: err instanceof Error ? err.message : String(err) }
  }
}
