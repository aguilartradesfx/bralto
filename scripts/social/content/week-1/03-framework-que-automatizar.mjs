const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '03-framework-que-automatizar', pillar: 'framework',
  slides: [
    { type: 'cover', aiPrompt: AI('three glowing orange concentric rings, a radar sweep made of light'),
      pill: 'framework', headline: 'Qué automatizar primero en tu agencia', accent: 'primero', subtitle: 'El filtro de 3 preguntas que uso' },

    { type: 'interior', pill: 'pregunta 1', heading: '¿Es repetitivo y con reglas claras?', headingAccent: 'repetitivo',
      blocks: [
        { type: 'card', kind: 'good', title: 'Sí → automatízalo', body: 'Onboarding, reportes, respuestas a leads, facturación. Ej: el reporte semanal de [CLIENTE].' },
        { type: 'card', kind: 'bad', title: 'No → aún no', body: 'Estrategia creativa o la relación con [CLIENTE]: ahí la IA asiste, no reemplaza.' },
      ] },

    { type: 'interior', pill: 'pregunta 2', heading: '¿Te quita horas cada semana?', headingAccent: 'horas',
      blocks: [
        { type: 'card', kind: 'plain', title: 'Mídelo antes', body: 'Cronométralo una semana. Si no sabes cuánto cuesta, no sabrás si valió automatizarlo.' },
        { type: 'metric', value: '5 h/sem', label: 'un reporte manual típico ≈ medio día de trabajo' },
        { type: 'card', kind: 'good', title: 'Regla', body: 'Empieza por lo que te robe más horas y menos te guste hacer. Ej: [TAREA QUE ODIAS].' },
      ] },

    { type: 'interior', pill: 'pregunta 3', heading: '¿El error sale caro?', headingAccent: 'caro',
      blocks: [
        { type: 'card', kind: 'good', title: 'Barato de equivocarse → primero', body: 'Borradores, clasificar leads, primeras respuestas. Ej: el follow-up inicial de [CLIENTE].' },
        { type: 'card', kind: 'bad', title: 'Caro → con humano en el loop', body: 'Cobros, contratos, promesas al cliente. La IA prepara, tú apruebas y envías.' },
      ] },

    { type: 'closing', headline: 'Automatiza lo aburrido, no lo importante', ctaLines: ['Guárdalo antes de tu próxima automatización', 'Coméntame "FILTRO"'], handle: '@bralto' },
  ],
}
