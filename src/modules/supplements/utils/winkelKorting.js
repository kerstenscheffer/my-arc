// Kortingen bij supplementwinkels. De link van de winkel zet een kortingscookie
// (bigbuffalo.nl/KERSTEN1 stuurt door naar ?growi=kersten1), dus elke link naar
// die winkel krijgt de parameter mee en de korting gaat bij het afrekenen
// vanzelf. De code staat erbij voor wie het handmatig wil invullen.
const KORTINGEN = [
  { domein: 'bigbuffalo.nl', param: 'growi', waarde: 'kersten1', code: 'KERSTEN1', procent: 15 },
]

function kortingVoor(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return KORTINGEN.find(k => host === k.domein || host.endsWith('.' + k.domein)) || null
  } catch {
    return null
  }
}

export function winkelUrl(url) {
  const k = kortingVoor(url)
  if (!k) return url
  const u = new URL(url)
  u.searchParams.set(k.param, k.waarde)
  return u.toString()
}

export function winkelCode(url) {
  return kortingVoor(url)?.code || null
}

export function winkelProcent(url) {
  return kortingVoor(url)?.procent || null
}
