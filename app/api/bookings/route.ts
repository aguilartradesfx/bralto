import { NextResponse } from 'next/server'

const KEY = 'bralto:booked_slots'

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = require('@upstash/redis')
  return new Redis({ url, token })
}

export async function GET() {
  const redis = getRedis()
  if (!redis) return NextResponse.json({ booked: [] })

  try {
    const slots = await redis.smembers(KEY)
    return NextResponse.json({ booked: slots ?? [] })
  } catch {
    return NextResponse.json({ booked: [] })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const slot: unknown = body?.slot

  if (!slot || typeof slot !== 'string') {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  const redis = getRedis()
  if (!redis) {
    // Redis not configured — allow booking, slot blocking inactive
    return NextResponse.json({ success: true })
  }

  try {
    const added = await redis.sadd(KEY, slot)
    if (added === 0) {
      return NextResponse.json(
        { error: 'Este horario ya fue reservado. Por favor elija otro.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ success: true })
  } catch {
    // Redis error — allow booking rather than blocking the user
    return NextResponse.json({ success: true })
  }
}
