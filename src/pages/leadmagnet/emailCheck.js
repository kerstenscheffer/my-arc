// src/pages/leadmagnet/emailCheck.js
// E-mailadres controleren op tikfouten, zodat de PDF (en de challenge-mail)
// niet naar "naam@gmail.con" gaat. Twee soorten fouten:
//   - een extensie die nooit bestaat (.con, .cmo, .nll …): blokkeren
//   - een bekende provider net verkeerd getikt (gmial, hotmal, gmail.co):
//     blokkeren en de juiste voorstellen
// emailCheck(e) → { ok, suggestie }. suggestie is het verbeterde adres of null.

const FOUTE_EXTENSIES = new Set([
  'con', 'cmo', 'ocm', 'vom', 'xom', 'cpm', 'cim', 'comm', 'coom', 'cm', 'om', 'c',
  'nll', 'nk', 'bl', 'ml', 'n', 'nel', 'bee', 'b',
])
// Wat een getikte extensie meestal moest zijn.
const EXTENSIE_HERSTEL = { nll: 'nl', nk: 'nl', bl: 'nl', ml: 'nl', n: 'nl', nel: 'nl', bee: 'be', b: 'be' }

// Bekende providers met de extensies die ze echt hebben (de eerste is de gewone).
const PROVIDERS = {
  gmail: ['com'], googlemail: ['com'],
  hotmail: ['com', 'nl', 'be', 'co.uk', 'fr', 'de'], outlook: ['com', 'nl', 'be'],
  icloud: ['com'], yahoo: ['com', 'nl', 'co.uk', 'fr', 'de'],
  ziggo: ['nl'], kpnmail: ['nl'], kpnplanet: ['nl'], planet: ['nl'], telfort: ['nl'],
  telenet: ['be'], skynet: ['be'], xs4all: ['nl'], upcmail: ['nl'],
}

// Bestaande domeinen die op een provider lijken (cloud.com ≠ icloud.com).
const ECHTE_DOMEINEN = new Set(['cloud', 'gmx', 'mail', 'email', 'yahoo'])

// Afstand tussen twee woorden, met verwisseling van twee letters als één fout.
function afstand(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const k = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + k)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

export function emailCheck(invoer) {
  const e = String(invoer || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, suggestie: null }
  const [lokaal, domein] = [e.slice(0, e.lastIndexOf('@')), e.slice(e.lastIndexOf('@') + 1)]
  const delen = domein.split('.')
  if (delen.some(d => !d)) return { ok: false, suggestie: null }
  const naam = delen[0]
  const ext = delen.slice(1).join('.')
  const laatste = delen[delen.length - 1]

  // Bekende provider (exact of net verkeerd getikt)?
  let provider = PROVIDERS[naam] ? naam : null
  if (!provider && naam.length >= 5 && !ECHTE_DOMEINEN.has(naam)) {
    const kandidaten = Object.keys(PROVIDERS).filter(p => p.length >= 5 && afstand(naam, p) <= (p.length >= 7 ? 2 : 1))
    if (kandidaten.length === 1) provider = kandidaten[0]
  }
  if (provider) {
    const echt = PROVIDERS[provider]
    const goedeExt = echt.includes(ext) ? ext : (echt.includes(EXTENSIE_HERSTEL[ext]) ? EXTENSIE_HERSTEL[ext] : echt[0])
    const goed = `${provider}.${goedeExt}`
    if (goed === domein) return { ok: true, suggestie: null }
    // Juiste naam met een extensie die wij niet kennen maar die wel kan
    // bestaan (hotmail.com.br): niet tegenhouden. Alleen bij gmail/icloud weten
    // we zeker dat het .com is.
    const zekerFout = provider !== naam || FOUTE_EXTENSIES.has(laatste) || ext === 'co' || echt.length === 1
    if (zekerFout) return { ok: false, suggestie: `${lokaal}@${goed}` }
    return { ok: true, suggestie: null }
  }

  if (FOUTE_EXTENSIES.has(laatste)) {
    const herstel = EXTENSIE_HERSTEL[laatste] || 'com'
    return { ok: false, suggestie: `${lokaal}@${[...delen.slice(0, -1), herstel].join('.')}` }
  }
  return { ok: true, suggestie: null }
}
