// src/modules/video-feedback/feedbackPunten.js
//
// Coach-punten bij een techniekvideo (28 okt 2026). De coach legt de video van
// de klant naast een voorbeeld en noteert losse punten, elk met een soort en
// (optioneel) het moment in de klantvideo. Opgeslagen in
// client_exercise_submissions.feedback_punten:
//   [{ id, tekst, soort: 'goed' | 'beter' | 'tip', tijd: seconden | null }]
//
// coach_feedback blijft gevuld met dezelfde punten als platte tekst: oudere
// app-versies lezen alleen die kolom en zien de punten zo toch.

export const SOORTEN = {
  goed:  { label: 'Goed',     kleur: '#10b981', teken: '✓' },
  beter: { label: 'Verbeter', kleur: '#f59e0b', teken: '→' },
  tip:   { label: 'Tip',      kleur: '#ffffff', teken: '•' },
}

export const soortVan = (s) => SOORTEN[s] || SOORTEN.tip

export const tijdTekst = (sec) => {
  if (sec == null || !isFinite(sec)) return ''
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Punten uit een rij; oude feedback (alleen tekst) wordt één tip.
export function puntenVan(sub) {
  if (Array.isArray(sub?.feedback_punten)) return sub.feedback_punten.filter(p => p?.tekst)
  if (sub?.coach_feedback) return [{ id: 'oud', tekst: sub.coach_feedback, soort: 'tip', tijd: null }]
  return []
}

export function puntenAlsTekst(punten) {
  return punten
    .map(p => `${soortVan(p.soort).teken} ${p.tekst}${p.tijd != null ? ` (${tijdTekst(p.tijd)})` : ''}`)
    .join('\n') || null
}
