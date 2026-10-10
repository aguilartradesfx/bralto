import { timingSafeEqual } from 'node:crypto'

// n8n llama a /api/noticias con el header x-api-key = NEWS_API_KEY
export function hasNewsApiKey(req: Request): boolean {
  const want = process.env.NEWS_API_KEY
  const got = req.headers.get('x-api-key')
  if (!want || !got) return false
  const a = Buffer.from(want)
  const b = Buffer.from(got)
  return a.length === b.length && timingSafeEqual(a, b)
}
