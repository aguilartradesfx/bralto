import { NextResponse, after } from 'next/server'
import { createBookingInGhl, getGhlAvailableSlotKeys } from '@/lib/ghl/bookings'

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

// ── POST: lock | unlock | confirm ────────────────────────────────────────────

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

  // ── confirm: make slot permanent and save to Supabase ─────────────────────
  if (action === 'confirm') {
    const redis = getRedis()

    if (redis) {
      try {
        const lockKey = `bralto:lock:${slot}`

        // Verify the session still owns the lock (not expired)
        if (sessionId) {
          const owner = await redis.get(lockKey)
          if (owner !== null && owner !== sessionId) {
            return NextResponse.json(
              { error: 'El bloqueo del horario expiró. Por favor regrese y seleccione otro.' },
              { status: 409 },
            )
          }
        }

        // Attempt permanent booking
        const added = await redis.sadd(KEY, slot)
        if (added === 0) {
          // Already booked by someone else
          return NextResponse.json(
            { error: 'Este horario ya fue confirmado. Por favor regrese y elija otro.' },
            { status: 409 },
          )
        }

        // Release temporary lock
        await redis.del(lockKey)
      } catch { /* continue to Supabase regardless */ }
    }

    // Persist booking details to Supabase
    // Required table: bookings (slot_key, nombre, apellido, telefono, email, answers, created_at)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      try {
        const { nombre, apellido, countryCode, telefono, email, answers } = body
        await fetch(`${supabaseUrl}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            slot_key: slot,
            nombre,
            apellido,
            telefono: `${countryCode ?? ''}${telefono ?? ''}`,
            email,
            answers,
          }),
        })
      } catch { /* Supabase save is non-critical — booking is already locked in Redis */ }
    }

    // Push the booking into GHL (contact + appointment + tag) after responding.
    const { nombre, apellido, countryCode, telefono, email, answers } = body
    after(async () => {
      try {
        await createBookingInGhl({
          slotKey: slot,
          firstName: nombre ?? '',
          lastName: apellido ?? '',
          phone: `${countryCode ?? ''}${telefono ?? ''}`,
          email: email ?? '',
          answers,
        })
      } catch (err) {
        console.error('[bookings → ghl] failed:', err)
      }
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
