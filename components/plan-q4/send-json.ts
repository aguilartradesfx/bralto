// Envía JSON a las APIs del plan; devuelve el mensaje de error, o null si salió bien
export async function sendJson(url: string, method: 'POST' | 'PATCH' | 'PUT', body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) return null
    const data: unknown = await res.json().catch(() => null)
    const error = data && typeof data === 'object' && 'error' in data ? (data as { error: unknown }).error : null
    return typeof error === 'string' ? error : 'No se pudo guardar'
  } catch {
    return 'Sin conexión, probá de nuevo'
  }
}
