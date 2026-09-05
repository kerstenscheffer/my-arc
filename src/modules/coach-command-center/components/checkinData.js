// src/modules/coach-command-center/components/checkinData.js
//
// Vorm en samenvatting van een check-in. Apart van het formulier omdat een
// bestand dat naast een component ook constanten exporteert hot-reload
// breekt — en omdat het logboek de samenvatting nodig heeft zonder het
// formulier te renderen.

import { wandklokNL } from '../../../utils/tijd'

export const CHECKS = [
  { id: 'gewicht',  label: 'Gewicht' },
  { id: 'training', label: 'Training' },
  { id: 'voeding',  label: 'Voeding' },
  { id: 'opplan',   label: 'Op plan' },
]

// Doorklikken in plaats van een keuzelijst: één tik per check, en je ziet de
// stand van alle vier tegelijk.
export const RONDE = ['', 'goed', 'aandacht', 'slecht']
export const CHECK_LABEL = { '': '—', goed: 'Goed', aandacht: 'Aandacht', slecht: 'Slecht' }
export const CHECK_KLEUR = {
  '': 'rgba(255,255,255,0.35)',
  goed: '#10b981',
  aandacht: '#f59e0b',
  slecht: '#ef4444',
}

// Drie vragen die elke call gesteld worden. Vaste velden en geen losse
// vraag-regels: wat je altijd vraagt hoort al klaar te staan, anders sla je
// het over op de calls waar het juist telt.
//
// De volgorde is niet willekeurig — eerst hoe het gaat, dan waar het wringt,
// dan wat jij eraan kunt doen. Het derde antwoord is meestal de to-do.
export const VASTE_VRAGEN = [
  { id: 'gevoel', label: 'Hoe voel je je?',                                    hint: 'Energie, stemming, motivatie…' },
  { id: 'lastig', label: 'Wat vind je op dit moment nog lastig?',              hint: 'Waar loopt het vast…' },
  { id: 'hulp',   label: 'Wat kan ik doen om het makkelijker te maken?',       hint: 'Wat hij van jou nodig heeft…' },
]

export const LEEG = {
  checks: { gewicht: '', training: '', voeding: '', opplan: '' },
  voor: '',
  vast: { gevoel: '', lastig: '', hulp: '' },
  waarnemingen: [{ o: '', s: '' }],
  acties: [{ t: '', deadline: '' }],
  notities: '',
  bericht: '',
  volgende: { wanneer: '', onderwerp: '' },
  todos: [{ t: '', klaar: false, deadline: '' }],
}

/** Leesbare samenvatting. Gaat mee als note en is wat je kopieert. */
export function samenvatting(s, clientNaam) {
  const r = []
  r.push(`CHECK-IN — ${clientNaam || ''}`)
  r.push('')
  r.push('VOOR DE CALL')
  CHECKS.forEach(c => r.push(`  ${c.label}: ${CHECK_LABEL[s.checks?.[c.id] || '']}`))
  if (s.voor) r.push(`  ${s.voor}`)

  const vast = VASTE_VRAGEN.filter(q => (s.vast?.[q.id] || '').trim())
  if (vast.length) {
    r.push('', 'TIJDENS DE CALL')
    vast.forEach(q => r.push(`  ${q.label}`, `    ${s.vast[q.id].trim()}`))
  }

  const w = (s.waarnemingen || []).filter(x => x.o || x.s)
  if (w.length) {
    r.push('', 'WAT OPVIEL → OPLOSSING')
    w.forEach(x => r.push(`  • ${x.o || '—'} → ${x.s || '—'}`))
  }

  const a = (s.acties || []).filter(x => (x.t || '').trim())
  if (a.length) {
    r.push('', 'ACTIEPUNTEN VOOR JOU')
    a.forEach(x => r.push(`  • ${x.t.trim()}${x.deadline ? ` (voor ${x.deadline})` : ''}`))
  }

  if (s.notities) r.push('', 'NOTITIES', '  ' + s.notities)
  if (s.bericht) r.push('', 'BERICHT NAAR CLIENT', '  ' + s.bericht)
  if (s.volgende?.wanneer || s.volgende?.onderwerp) {
    r.push('', `VOLGENDE CALL: ${wandklokNL(s.volgende.wanneer)} — ${s.volgende.onderwerp || ''}`)
  }

  const t = (s.todos || []).filter(x => x.t)
  if (t.length) {
    r.push('', "MIJN TO-DO'S")
    t.forEach(x => r.push(`  [${x.klaar ? 'x' : ' '}] ${x.t}${x.deadline ? ` (${x.deadline})` : ''}`))
  }
  return r.join('\n')
}


/**
 * Staat er iets in dit formulier?
 *
 * Nodig om te weten of een concept bewaard moet worden. Zonder deze controle
 * schrijft het openen van het venster voor élke klant een leeg concept weg,
 * en dan staat de tabel binnen een week vol met rijen die niets betekenen.
 */
export function heeftInhoud(s) {
  if (!s) return false
  if (Object.values(s.checks || {}).some(Boolean)) return true
  if ((s.voor || '').trim() || (s.notities || '').trim() || (s.bericht || '').trim()) return true
  if ((s.volgende?.wanneer || '').trim() || (s.volgende?.onderwerp || '').trim()) return true
  if (Object.values(s.vast || {}).some(v => (v || '').trim())) return true
  if ((s.waarnemingen || []).some(x => (x.o || '').trim() || (x.s || '').trim())) return true
  if ((s.acties || []).some(x => (x.t || '').trim())) return true
  if ((s.todos || []).some(x => (x.t || '').trim())) return true
  return false
}

/**
 * Een bewaard concept klaarmaken voor het formulier.
 *
 * Ouder concept kan nog `vragen` bevatten van toen dat blok vraag-antwoord
 * heette. Die stilletjes laten vallen betekent dat iemand een half ingevulde
 * check-in kwijtraakt zonder dat er iets misging — daarom worden ze
 * omgezet naar actiepunten in plaats van genegeerd.
 */
export function uitConcept(data) {
  const s = { ...LEEG, ...(data || {}) }
  const oud = (data?.vragen || []).filter(x => (x?.v || '').trim() || (x?.a || '').trim())
  if (oud.length && !(s.acties || []).some(x => (x.t || '').trim())) {
    s.acties = oud.map(x => ({ t: [x.v, x.a].filter(Boolean).join(' — '), deadline: '' }))
  }
  delete s.vragen
  return s
}
