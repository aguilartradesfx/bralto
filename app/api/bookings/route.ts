import { NextResponse } from 'next/server'
import { getGhlAvailableSlotKeys } from '@/lib/ghl/bookings'

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

export async function GET() {
  const redis = getRedis()

  // Real availability from GHL, so the site hides curated slots already taken/
  // blocked in GHL. Independent of Redis and non-fatal: on any failure we return
  // `ghlAvailable: null` and the UI falls back to showing all curated slots.
  const ghlPromise: Promise<string[] | null> = getGhlAvailableSlotKeys().catch((err) => {
    console.warn('[bookings] GHL free-slots failed:', err)
    return null
  })

  if (!redis) {
    return NextResponse.json({ booked: [], locked: [], ghlAvailable: await ghlPromise })
  }

  try {
    const [booked, lockKeys, ghlAvailable] = await Promise.all([
      redis.smembers(KEY) as Promise<string[]>,
      redis.keys('bralto:lock:*') as Promise<string[]>,
      ghlPromise,
    ])
    const locked = lockKeys.map((k: string) => k.replace('bralto:lock:', ''))
    return NextResponse.json({ booked: booked ?? [], locked, ghlAvailable })
  } catch {
    return NextResponse.json({ booked: [], locked: [], ghlAvailable: await ghlPromise })
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
  // en el servidor (lib/diagnostic: retorno de Stripe y webhook)
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
