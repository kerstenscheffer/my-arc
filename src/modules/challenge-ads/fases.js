// src/modules/challenge-ads/fases.js
//
// Gedeeld door de Ads-trechter en de Comment-magnet-trechter: het oordeel per
// meting (goed / kan beter / loopt vast) en het samenvatten van een fase.

export const GROEN = '#10b981'
export const ORANJE = '#f59e0b'
export const ROOD = '#ef4444'
export const ZWAK = 'rgba(255,255,255,0.6)'

export const OORDEEL = {
  goed: { id: 'goed', tekst: 'Goed', kleur: GROEN, rang: 0 },
  matig: { id: 'matig', tekst: 'Kan beter', kleur: ORANJE, rang: 1 },
  slecht: { id: 'slecht', tekst: 'Loopt vast', kleur: ROOD, rang: 2 },
  weinig: { id: 'weinig', tekst: 'Te weinig data', kleur: 'rgba(255,255,255,0.45)', rang: -1 },
}

// `laag` = lager is beter (kosten per klik). `min` = onder zoveel in de basis
// zegt de waarde nog niets.
export const beoordeel = (waarde, basis, r) => {
  if (!r || waarde == null || !isFinite(waarde) || !(basis >= r.min)) return OORDEEL.weinig
  if (r.laag) return waarde <= r.goed ? OORDEEL.goed : waarde <= r.matig ? OORDEEL.matig : OORDEEL.slecht
  return waarde >= r.goed ? OORDEEL.goed : waarde >= r.matig ? OORDEEL.matig : OORDEEL.slecht
}

// Fase-oordeel = de slechtste beoordeelde meting; de zwakste rode meting
// schudt als de fase open staat.
export const vatFaseSamen = (f) => {
  const beoordeeld = f.metingen.map(x => x.oordeel).filter(o => o && o.rang >= 0)
  const oordeel = beoordeeld.length ? beoordeeld.reduce((x, y) => (y.rang > x.rang ? y : x)) : OORDEEL.weinig
  const rood = f.metingen.filter(x => x.oordeel?.id === 'slecht')
  const zwakste = rood.length ? rood.reduce((x, y) => (y.score < x.score ? y : x)).label : null
  return { ...f, oordeel, zwakste }
}

// Eerste fase die rood staat, anders de eerste oranje: daar loopt het vast.
export const vindVast = (fases) =>
  fases.find(f => f.oordeel.id === 'slecht') || fases.find(f => f.oordeel.id === 'matig') || null
