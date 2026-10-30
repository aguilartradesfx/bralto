import type { Alineacion } from './alineacion'

// La voz de Knox: ElevenLabs con la misma voz de los reels («Agustín»). Devuelve el mp3 y en qué segundo
// suena cada carácter, para sincronizar las tarjetas.
const VOZ = process.env.KNOX_VOZ_ID ?? 'kIyh6OkdYnM02DNUILKo'

export async function narrar(texto: string): Promise<{ audio: Buffer; alineacion: Alineacion | null }> {
  const clave = process.env.ELEVENLABS_API_KEY
  if (!clave) throw new Error('falta ELEVENLABS_API_KEY')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': clave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto, model_id: 'eleven_v4', voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`ElevenLabs: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  const j = (await res.json()) as { audio_base64: string; alignment?: Alineacion | null }
  return { audio: Buffer.from(j.audio_base64, 'base64'), alineacion: j.alignment ?? null }
}
