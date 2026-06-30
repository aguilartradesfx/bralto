const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '03-framework-que-automatizar', pillar: 'framework',
  slides: [
    { type: 'cover', aiPrompt: AI('three glowing orange concentric rings, a radar sweep made of light'),
      pill: 'framework', headline: 'Qué automatizar primero en tu agencia', accent: 'primero', subtitle: 'El filtro de 3 preguntas que uso' },
    { type: 'interior', pill: 'pregunta 1', heading: '¿Es repetitivo y con reglas claras?', headingAccent: 'repetitivo',
      cards: [{ kind: 'good', title: 'Sí, es candidato', body: 'Onboarding, reportes, respuestas a leads, facturación.' }, { kind: 'bad', title: 'No, espera', body: 'Estrategia creativa o relación con el cliente: ahí la IA asiste, no automatiza.' }] },
    { type: 'interior', pill: 'pregunta 2', heading: '¿Te quita horas cada semana?', headingAccent: 'horas',
      cards: [{ kind: 'plain', title: 'Mide antes', body: 'Si no sabes cuántas horas cuesta, no sabrás si valió. Cronométralo una semana.' }] },
    { type: 'interior', pill: 'pregunta 3', heading: '¿El error sale caro?', headingAccent: 'caro',
      cards: [{ kind: 'good', title: 'Empieza por lo barato de equivocarse', body: 'Borradores y clasificación primero. Cobros y contratos, con humano en el loop.' }] },
    { type: 'closing', headline: 'Automatiza lo aburrido, no lo importante', ctaLines: ['Guárdalo antes de tu próxima automatización', 'Coméntame "FILTRO"'], handle: '@bralto' },
  ],
}
