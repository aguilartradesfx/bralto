import type { ContextoKnox, DecisionKnox } from './tipos'

// Qué hace Knox con el último mensaje de una conversación: contestar, pasárselo a Ale o quedarse callado.
// `ficha` es lo que Ale aprobó que Knox puede decir (servicios, diagnóstico, guías, sesiones). Vive en la base,
// no en el repo. Lanza un error si Claude no responde; quien llama lo trata como «no contestar y avisar».
export async function decidir(_ctx: ContextoKnox, _ficha: string, _ahora: Date = new Date()): Promise<DecisionKnox> {
  throw new Error('decidir: todavía no está implementado')
}
