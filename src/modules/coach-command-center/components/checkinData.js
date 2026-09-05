// src/modules/coach-command-center/components/checkinData.js
//
// Vorm en samenvatting van een check-in. Apart van het formulier omdat een
// bestand dat naast een component ook constanten exporteert hot-reload
// breekt — en omdat het logboek de samenvatting nodig heeft zonder het
// formulier te renderen.

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

export const LEEG = {
  checks: { gewicht: '', training: '', voeding: '', opplan: '' },
  voor: '',
  waarnemingen: [{ o: '', s: '' }],
  vragen: [{ v: '', a: '' }],
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

  const w = (s.waarnemingen || []).filter(x => x.o || x.s)
  if (w.length) {
    r.push('', 'WAT OPVIEL → OPLOSSING')
    w.forEach(x => r.push(`  • ${x.o || '—'} → ${x.s || '—'}`))
  }

  const v = (s.vragen || []).filter(x => x.v || x.a)
  if (v.length) {
    r.push('', 'VRAGEN')
    v.forEach(x => r.push(`  V: ${x.v || ''}`, `  A: ${x.a || ''}`))
  }

  if (s.notities) r.push('', 'NOTITIES', '  ' + s.notities)
  if (s.bericht) r.push('', 'BERICHT NAAR CLIENT', '  ' + s.bericht)
  if (s.volgende?.wanneer || s.volgende?.onderwerp) {
    r.push('', `VOLGENDE CALL: ${s.volgende.wanneer || '—'} — ${s.volgende.onderwerp || ''}`)
  }

  const t = (s.todos || []).filter(x => x.t)
  if (t.length) {
    r.push('', "MIJN TO-DO'S")
    t.forEach(x => r.push(`  [${x.klaar ? 'x' : ' '}] ${x.t}${x.deadline ? ` (${x.deadline})` : ''}`))
  }
  return r.join('\n')
}

