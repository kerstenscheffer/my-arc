// src/pages/CoachingGuidePage.jsx
// v1.0 — Publieke pagina op /coaching-guide, printbaar als PDF

import { useEffect } from 'react'
import { generateCoachingGuideHTML } from '../modules/ai-meal-generator/mealplanhtmlgenerator'

export default function CoachingGuidePage() {
  const params = new URLSearchParams(window.location.search)
  const clientName = params.get('name') || 'Client'

  useEffect(() => {
    // Vervang de hele pagina met de gegenereerde HTML
    const html = generateCoachingGuideHTML(clientName)
    document.open()
    document.write(html)
    document.close()
  }, [])

  return null
}
