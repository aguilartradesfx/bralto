const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '05-caso-prospeccion-linkedin', pillar: 'caso',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing orange network of connected nodes forming a funnel shape'),
      pill: 'caso · resultado', headline: 'Un agente que agenda reuniones en LinkedIn solo', accent: 'solo', subtitle: 'Lo que montamos y qué logró' },

    { type: 'interior', pill: 'el problema', heading: 'Prospectar a mano no escala', headingAccent: 'no escala',
      blocks: [
        { type: 'card', kind: 'plain', title: 'Antes', body: 'Horas buscando perfiles y escribiendo DMs uno por uno, sin seguimiento. El lead se enfría y se pierde.' },
        { type: 'metric', value: '2-3 h/día', label: 'prospectando a mano, sin garantía de respuesta' },
      ] },

    { type: 'interior', pill: 'la solución', heading: 'Un pipeline de 3 pasos', headingAccent: '3 pasos',
      blocks: [
        { type: 'card', kind: 'good', title: 'Qué hace el agente', body: 'Filtra perfiles de [NICHO], redacta un mensaje para [CLIENTE IDEAL] y agenda en tu calendario.' },
        { type: 'card', kind: 'plain', title: 'Con control', body: 'Tú apruebas el mensaje base; el agente ejecuta y hace el seguimiento por ti.' },
        { type: 'shot', src: 'scripts/social/assets/n8n-prospeccion.png', caption: 'El workflow del agente en n8n (aquí va tu captura)' },
      ] },

    { type: 'interior', pill: 'resultado', heading: 'Reuniones en automático', headingAccent: 'automático',
      blocks: [
        { type: 'card', kind: 'good', title: 'El cambio', body: 'De prospectar a mano a un flujo que corre solo. Tu equipo entra a cerrar, no a buscar.' },
        { type: 'shot', src: 'scripts/social/assets/reuniones-agendadas.png', caption: 'Reuniones agendadas por el agente (aquí va tu captura)' },
      ] },

    { type: 'closing', headline: '¿Quieres algo así en tu agencia?', ctaLines: ['Coméntame "AGENTE" y te cuento cómo', 'Sigue a Bralto para más casos'], handle: '@bralto' },
  ],
}
