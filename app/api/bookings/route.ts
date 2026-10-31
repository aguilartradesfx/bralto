import { NextResponse, after } from 'next/server'
import { horariosDisponibles } from '@/lib/agenda/servidor'
import { reconcilePendingOrders } from '@/lib/diagnostic/server'

// Redis key for permanently confirmed bookings
const KEY = 'bralto:booked_slots'
// TTL for temporary hold (seconds)
const LOCK_TTL = 300

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = require('@upstash/redis')
  return new Redis({ url, token })
}

// ── GET: return booked (permanent) + locked (temporary) slots ────────────────

export async function GET(req: Request) {
  const redis = getRedis()
  // Los horarios que retiene esta misma sesión no cuentan como ocupados (reintento tras un rechazo)
  const session = new URL(req.url).searchParams.get('session')

  // Conciliación de pagos aprovechando el tráfico de /agendar (además del cron): unas pocas
  // órdenes pendientes por visita, después de responder
  after(() =>
    reconcilePendingOrders({ limit: 3 }).catch((err) => console.error('[bookings] conciliación falló:', err)),
  )

  // Los horarios que se ofrecen: los fijos, con la anticipación mínima y sin lo ocupado en Google Calendar
  // (lib/agenda). Independiente de Redis y nunca falla: si Google no responde, son los fijos sin revisar el
  // calendario y Alejandro recibe el aviso. null solo si algo inesperado revienta: la página muestra todos.
  const disponibles: Promise<string[] | null> = horariosDisponibles()
    .then((d) => d.disponibles)
    .catch((err) => {
      console.error('[bookings] no se pudieron calcular los horarios:', err)
      return null
    })

  if (!redis) {
    return NextResponse.json({ booked: [], locked: [], disponibles: await disponibles })
  }

  try {
    const [booked, lockKeys, libres] = await Promise.all([
      redis.smembers(KEY) as Promise<string[]>,
      redis.keys('bralto:lock:*') as Promise<string[]>,
      disponibles,
    ])
    const owners: (string | null)[] =
      session && lockKeys.length ? await redis.mget(...lockKeys) : lockKeys.map(() => null)
    const locked = lockKeys
      .filter((_: string, i: number) => !session || owners[i] !== session)
      .map((k: string) => k.replace('bralto:lock:', ''))
    return NextResponse.json({ booked: booked ?? [], locked, disponibles: libres })
  } catch {
    return NextResponse.json({ booked: [], locked: [], disponibles: await disponibles })
  }
}

// ── POST: lock | unlock ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json()
  const { action, slot, sessionId } = body

  if (!slot || typeof slot !== 'string') {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  // ── lock: reserve slot for 5 minutes ──────────────────────────────────────
  if (action === 'lock') {
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const redis = getRedis()
    if (!redis) {
      // Redis not configured — grant lock anyway (no real blocking)
      return NextResponse.json({ success: true, expiresAt: Date.now() + LOCK_TTL * 1000 })
    }

    try {
      const lockKey = `bralto:lock:${slot}`

      // Reject if already permanently booked
      const isBooked = await redis.sismember(KEY, slot)
      if (isBooked) {
        return NextResponse.json(
          { error: 'Este horario ya fue confirmado por otro usuario. Por favor elija otro.' },
          { status: 409 },
        )
      }

      // NX = set only if the key does not exist
      const result = await redis.set(lockKey, sessionId, { nx: true, ex: LOCK_TTL })

      if (result === null) {
        // Already locked — check if it's by this same session
        const owner = await redis.get(lockKey)
        if (owner === sessionId) {
          const ttl = await redis.ttl(lockKey)
          return NextResponse.json({ success: true, expiresAt: Date.now() + ttl * 1000 })
        }
        return NextResponse.json(
          { error: 'Este horario acaba de ser seleccionado por otro usuario. Por favor elija otro.' },
          { status: 409 },
        )
      }

      return NextResponse.json({ success: true, expiresAt: Date.now() + LOCK_TTL * 1000 })
    } catch {
      // Redis error — grant lock optimistically
      return NextResponse.json({ success: true, expiresAt: Date.now() + LOCK_TTL * 1000 })
    }
  }

  // ── unlock: release lock when user goes back ───────────────────────────────
  if (action === 'unlock') {
    if (!sessionId) return NextResponse.json({ success: true })

    const redis = getRedis()
    if (!redis) return NextResponse.json({ success: true })

    try {
      const lockKey = `bralto:lock:${slot}`
      const owner = await redis.get(lockKey)
      if (owner === sessionId) await redis.del(lockKey)
    } catch { /* ignore — lock will expire on its own */ }

    return NextResponse.json({ success: true })
  }

  // Ya no hay "confirm" público: la cita solo se confirma después del pago de $97,
  // en el servidor (lib/diagnostic: retorno de la pasarela, webhook y barrido)
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
