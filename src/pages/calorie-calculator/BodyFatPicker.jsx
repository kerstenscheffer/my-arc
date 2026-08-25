// src/pages/calorie-calculator/BodyFatPicker.jsx
// Vetpercentage kiezen met foto's — zelfde beelden en zelfde bediening als de
// MyArc-intake (`modules/public-intake/components/phase1/BodyFlow.jsx`).
//
// Bewust een eigen component en geen import uit die intake: BodyFlow zit vast
// aan de stap-state en het data-object van de intake-wizard. Losweken zou dat
// formulier raken, en dat draait live. De foto-URL's zijn wél gedeeld, dus een
// nieuwe set beelden hoeft maar op één plek vervangen te worden.
//
// Bediening: tik één foto voor een schatting, of twee náást elkaar als je er
// tussenin zit — dan rekenen we met het gemiddelde.

import { BF_OPTIES, bfWaarde } from './bodyFat'

export default function BodyFatPicker({ waarde, waarde2, onChange, accent = '#FFD700', isMobile }) {
  // Zelfde klik-afhandeling als de intake: eerste tik kiest, dezelfde nogmaals
  // deselecteert, een buur erbij maakt "tussenin", en een niet-buur begint
  // opnieuw (anders zou "10% én 33%" een onzinnig gemiddelde geven).
  const klik = (opt) => {
    if (waarde == null) return onChange(opt.value, null)
    if (waarde === opt.value && waarde2 == null) return onChange(null, null)
    if (waarde === opt.value && waarde2 != null) return onChange(waarde2, null)
    if (waarde2 === opt.value) return onChange(waarde, null)
    if (waarde2 == null) {
      const i1 = BF_OPTIES.findIndex(o => o.value === waarde)
      const i2 = BF_OPTIES.findIndex(o => o.value === opt.value)
      if (Math.abs(i1 - i2) === 1) {
        // Altijd de laagste eerst, zodat het "1"/"2"-label logisch loopt.
        return i2 < i1 ? onChange(opt.value, waarde) : onChange(waarde, opt.value)
      }
      return onChange(opt.value, null)
    }
    return onChange(opt.value, null)
  }

  const leeg = waarde == null
  const tussenin = waarde != null && waarde2 != null

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: '0.3rem' }}>
        {BF_OPTIES.map((opt, i) => {
          const gekozen = waarde === opt.value || waarde2 === opt.value
          const hint = i === 0 && leeg
          return (
            <button key={opt.value} onClick={() => klik(opt)} title={opt.sub}
              style={{
                background: 'transparent', padding: 0, borderRadius: 8, overflow: 'hidden',
                border: `2px solid ${gekozen ? accent : hint ? accent + '59' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', position: 'relative',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'border-color 0.15s ease',
              }}>
              <img src={opt.img} alt={opt.label} loading="lazy"
                style={{
                  width: '100%', aspectRatio: '2/3', objectFit: 'cover',
                  objectPosition: 'top', display: 'block',
                  filter: gekozen ? 'none' : 'brightness(0.55)',
                }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.3rem 0.25rem',
                background: gekozen ? `${accent}e0` : 'rgba(0,0,0,0.72)',
              }}>
                <div style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 800, color: gekozen ? '#000' : '#fff', textAlign: 'center' }}>{opt.label}</div>
                <div style={{ fontSize: '0.45rem', color: gekozen ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3, marginTop: '0.1rem' }}>{opt.sub}</div>
              </div>
              {gekozen && (
                <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', width: 16, height: 16, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#000' }}>
                    {tussenin ? (waarde === opt.value ? '1' : '2') : '✓'}
                  </span>
                </div>
              )}
              {leeg && (
                <div style={{ position: 'absolute', top: '0.3rem', left: '0.3rem', padding: '0.15rem 0.3rem', background: `${accent}d9`, borderRadius: 3 }}>
                  <span style={{ fontSize: '0.42rem', fontWeight: 800, color: '#000' }}>TAP</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {tussenin && (
        <div style={{ fontSize: '0.68rem', color: `${accent}aa`, fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
          Tussenin — we rekenen met ~{bfWaarde(waarde, waarde2)}%
        </div>
      )}
    </>
  )
}
