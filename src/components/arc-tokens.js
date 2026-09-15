// src/components/arc-tokens.js
// Kleuren en vaste stijlen van de MY ARC modal-stijl. Apart van arc-ui.jsx
// omdat een bestand met componenten alleen componenten mag exporteren
// (fast refresh).

export const LIJN = 'rgba(255,255,255,0.08)'
export const LIJN_ZACHT = 'rgba(255,255,255,0.05)'
export const ZWART = '#0a0a0a'

// Een select of input in een keuzevak: geen eigen kader, de waarde is de tekst.
export const keuzeSelect = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  color: '#fff', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
  fontFamily: 'inherit', padding: 0, appearance: 'none', WebkitAppearance: 'none',
}

// 'primair' = wit (de hoofdactie), 'stil' = omlijnd, 'gevaar' = rood,
// 'goed' = groen.
export const KNOP_STIJL = {
  primair: { background: '#fff', border: 'none', color: ZWART },
  stil:    { background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`, color: 'rgba(255,255,255,0.6)' },
  gevaar:  { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' },
  goed:    { background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' },
}
