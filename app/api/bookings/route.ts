import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = Redis.fromEnv()
const KEY = 'bralto:booked_slots'

export async function GET() {
  const slots = await redis.smembers<string[]>(KEY)
  return NextResponse.json({ booked: slots ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const slot: unknown = body?.slot

  if (!slot || typeof slot !== 'string') {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  // SADD returns 1 if added, 0 if the member already existed — atomic, no race condition
  const added = await redis.sadd(KEY, slot)

  if (added === 0) {
    return NextResponse.json(
      { error: 'Este horario ya fue reservado. Por favor elija otro.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ success: true })
}
