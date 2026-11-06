// src/modules/business-os/berichtTekst.js
//
// Check-in bericht (WhatsApp) — helpers voor BerichtVak.jsx.
// Gino schrijft "Een hele goede {dagdeel} <naam>!"; het dagdeel wordt pas
// ingevuld als Kersten het bericht opent, want dan weet je wanneer het weggaat.

export const ITEM_KOLOMMEN = 'id, coach_id, client_id, ronde_datum, groep, suggesties, bericht, bewerkt_bericht, verstuurd_at'

export const dagdeel = (d = new Date()) => {
  const u = d.getHours()
  return u < 12 ? 'ochtend' : u < 18 ? 'middag' : 'avond'
}

export const vulDagdeel = (tekst) => String(tekst || '').replace(/\{dagdeel\}/g, dagdeel())

// Kerstens vaste opbouw (6 nov 2026). Leeg begin als Gino nog niets schreef.
export const sjabloon = (voornaam) => vulDagdeel(
  `Een hele goede {dagdeel} ${voornaam || ''}! Alles goed?\n\n`
  + 'Ik zag dat je ... had aangegeven in de check-in, dat zou ik ... doen.\n\n'
  + 'En compliment! Ik zag ook dat je ... deed. Ik zou toch ... doen om nog meer progressie te boeken.\n\n'
  + 'Maar in ieder geval, lekker bezig!',
)

// 06-12345678 / +31 6 1234 5678 / 0031... → 31612345678. Geen nummer: null.
export function waNummer(telefoon) {
  let n = String(telefoon || '').replace(/[^\d+]/g, '')
  if (!n) return null
  if (n.startsWith('+')) n = n.slice(1)
  else if (n.startsWith('00')) n = n.slice(2)
  else if (n.startsWith('0')) n = `31${n.slice(1)}`
  return /^\d{8,15}$/.test(n) ? n : null
}

export async function kopieer(tekst) {
  try { await navigator.clipboard.writeText(tekst); return true } catch { /* val terug */ }
  try {
    const t = document.createElement('textarea')
    t.value = tekst; t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  } catch { return false }
}
