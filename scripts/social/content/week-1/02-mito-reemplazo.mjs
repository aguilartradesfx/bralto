const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '02-mito-reemplazo', pillar: 'mito',
  slides: [
    { type: 'cover', aiPrompt: AI('a cracked obsidian shield with molten-orange light glowing through the cracks'),
      pill: 'mito · IA', headline: 'La IA no reemplaza a tu agencia', accent: 'no', subtitle: 'Reemplaza a las que no la usan. Tú decides de qué lado estás.' },
  ],
}
