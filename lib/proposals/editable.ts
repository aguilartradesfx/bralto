// Campos de una solicitud que el panel edita vía PATCH (estado, prioridad y notas internas)
const EDITABLE_FIELDS = ['status', 'priority', 'internal_notes'] as const

type EditableField = (typeof EDITABLE_FIELDS)[number]

export function editableProposalFields(body: unknown): Partial<Record<EditableField, unknown>> {
  if (!body || typeof body !== 'object') return {}
  const source = body as Record<string, unknown>
  return Object.fromEntries(EDITABLE_FIELDS.filter((k) => k in source).map((k) => [k, source[k]]))
}
