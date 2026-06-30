const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '04-tip-auditar-copy', pillar: 'tip',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing orange magnifying lens hovering over an abstract dark grid'),
      pill: 'tip · prompt', headline: '1 prompt para auditar el copy de cualquier landing', accent: '1 prompt',
      subtitle: 'Pégalo, cambia la URL, y tienes 5 mejoras en 30 segundos' },
  ],
}
