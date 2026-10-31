// SERVER-ONLY — avisos a Alejandro por Telegram (@BraltoBot). Sin TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no hace nada.
// Nunca lanza: un aviso que no sale se anota en el log y el flujo sigue. Devuelve si salió.
export async function avisarPorTelegram(texto: string, origen = 'aviso'): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) console.error(`[${origen}] Telegram rechazó el aviso (HTTP ${res.status})`)
    return res.ok
  } catch (err) {
    console.error(`[${origen}] no salió el aviso a Telegram:`, err instanceof Error ? err.message : err)
    return false
  }
}
