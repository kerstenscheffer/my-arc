// src/modules/meal-plan/components/DagenKiezer.jsx
//
// "Waar geldt deze wijziging?" voor aanpassen en wisselen van een maaltijd.
// Zeven dagen om aan te tikken, en daarboven de keuze tussen:
//
//   Elke week     -> blijvend in het weekplan, op de gekozen weekdagen
//   Alleen week X -> eenmalig op die datums (deze week, volgende week of de
//                    week erna); daarna staat het gewone plan er weer
//
// Geeft via onKies één object terug:
//   { modus: 'altijd', dagen: ['monday', ...] }
//   { modus: 'week',   dagen: [...], datums: ['2026-10-20', ...] }
// Wat ermee gebeurt (weekplan of losse datum) bepaalt de aanroeper.
//
// `volScherm`: zelfde keuzes, maar als volledig scherm in de stijl van het
// logscherm (ronde foto, grote vraag, knop vast onderaan). Voor verwijderen:
// een schuifvenstertje onderaan voelde te licht voor iets dat je plan wijzigt.
import React, { useMemo, useState } from 'react'
import { X, Repeat, CalendarDays, ArrowLeft } from 'lucide-react'
import { lokaleIso } from '../utils/dagVenster'

const DAGEN = [
  { key: 'monday', kort: 'Ma' }, { key: 'tuesday', kort: 'Di' }, { key: 'wednesday', kort: 'Wo' },
  { key: 'thursday', kort: 'Do' }, { key: 'friday', kort: 'Vr' }, { key: 'saturday', kort: 'Za' },
  { key: 'sunday', kort: 'Zo' },
]
const SLOT_KORT = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack1: 'snack', snack2: 'snack', snack3: 'snack', snack4: 'snack', pre_workout: 'pre-workout',
}

// Maandag van de week waar `datum` in valt, op lokale middernacht.
const maandagVan = (datum) => {
  const d = new Date(datum); d.setHours(0, 0, 0, 0)
  const idx = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - idx)
  return d
}
const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const kortDatum = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export default function DagenKiezer({
  titel, subtitel, datum, dagKey, slot, bezig = false, fout = null,
  isMobile, onKies, onTerug, terugTekst = '← Terug', onClose, extra = null,
  vraag = 'Waar geldt deze wijziging?', knopTekst = 'Opslaan', gevaar = false,
  volScherm = false, foto = null, keuzeVraag = null,
}) {
  const bekeken = datum ? new Date(datum) : new Date()
  const ditMaandag = maandagVan(new Date())
  // Welke week bekijkt de klant nu? Die staat voorgeselecteerd bij "Alleen".
  const startWeek = Math.max(0, Math.min(2, Math.round((maandagVan(bekeken) - ditMaandag) / (7 * 864e5))))

  // Verwijderen begint op "Eén week" met alleen de bekeken dag: wie snel
  // doortikt, haalt anders de maaltijd voor altijd uit het weekplan.
  const [modus, setModus] = useState(gevaar ? 'week' : 'altijd')
  const [week, setWeek] = useState(startWeek)
  const [gekozen, setGekozen] = useState(() => new Set(dagKey ? [dagKey] : []))

  const weekMaandag = plus(ditMaandag, week * 7)
  const datumVan = (idx) => plus(weekMaandag, idx)

  const wissel = (key) => setGekozen(prev => {
    const n = new Set(prev)
    if (n.has(key)) n.delete(key); else n.add(key)
    return n
  })
  const alles = gekozen.size === 7
  const zetAlles = () => setGekozen(alles ? new Set(dagKey ? [dagKey] : []) : new Set(DAGEN.map(d => d.key)))

  const lijst = DAGEN.filter(d => gekozen.has(d.key))
  const moment = SLOT_KORT[slot] || slot || 'maaltijd'

  const effect = useMemo(() => {
    if (!lijst.length) return 'Kies minstens één dag'
    if (modus === 'altijd') {
      const dagen = lijst.length === 7 ? 'elke dag' : `elke ${lijst.map(d => d.kort.toLowerCase()).join(', ')}`
      return `${dagen} · ${moment}, blijvend in je weekplan${gevaar ? ' (wat daar staat gaat weg)' : ''}`
    }
    const datums = lijst.map(d => `${d.kort.toLowerCase()} ${kortDatum(datumVan(DAGEN.indexOf(d)))}`).join(', ')
    return `${datums} · ${moment}, daarna weer je gewone plan`
  }, [modus, week, gekozen, gevaar]) // eslint-disable-line react-hooks/exhaustive-deps

  const kies = () => {
    if (bezig || !lijst.length) return
    const dagen = lijst.map(d => d.key)
    if (modus === 'altijd') onKies({ modus, dagen })
    else onKies({ modus, dagen, datums: lijst.map(d => lokaleIso(datumVan(DAGEN.indexOf(d)))) })
  }

  const weekLabels = ['Deze week', 'Volgende week', 'Week erna']

  const keuzes = (
    <>
        {/* Elke week / alleen één week */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {[
            { key: 'altijd', Icon: Repeat, label: 'Elke week' },
            { key: 'week', Icon: CalendarDays, label: 'Eén week' },
          ].map(o => {
            const aan = modus === o.key
            return (
              <button key={o.key} onClick={() => setModus(o.key)} disabled={bezig} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '0.6rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: aan ? '#fff' : 'transparent', color: aan ? '#000' : 'rgba(255,255,255,0.6)',
                fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <o.Icon size={15} strokeWidth={2.6} />{o.label}
              </button>
            )
          })}
        </div>

        {/* Welke week, alleen bij "Eén week" */}
        {modus === 'week' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {weekLabels.map((l, i) => {
              const aan = week === i
              return (
                <button key={l} onClick={() => setWeek(i)} disabled={bezig} style={{
                  flex: 1, padding: '0.45rem 0.3rem', borderRadius: 9, cursor: 'pointer',
                  background: aan ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  color: aan ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900 }}>{l}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.7 }}>
                    {kortDatum(plus(ditMaandag, i * 7))} – {kortDatum(plus(ditMaandag, i * 7 + 6))}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* De zeven dagen */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Dagen</span>
            <button onClick={zetAlles} disabled={bezig} style={{
              background: 'none', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
              cursor: 'pointer', padding: 0, fontFamily: 'inherit',
            }}>{alles ? 'Alleen deze dag' : 'Hele week'}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {DAGEN.map((d, i) => {
              const aan = gekozen.has(d.key)
              return (
                <button key={d.key} onClick={() => wissel(d.key)} disabled={bezig} style={{
                  padding: '0.55rem 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: aan ? '#10b981' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${aan ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                  color: aan ? '#000' : 'rgba(255,255,255,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{d.kort}</span>
                  {modus === 'week' && (
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, opacity: 0.75 }}>{datumVan(i).getDate()}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

    </>
  )

  const knop = (
    <button onClick={kies} disabled={bezig || !lijst.length} style={{
          padding: '0.8rem', borderRadius: 12, border: 'none', fontFamily: 'inherit',
          background: !lijst.length ? 'rgba(255,255,255,0.15)' : gevaar ? '#ef4444' : '#fff',
          color: gevaar && lijst.length ? '#fff' : '#000',
          fontSize: '0.88rem', fontWeight: 900, cursor: bezig || !lijst.length ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          touchAction: 'manipulation',
        }}>
          {bezig && <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'cmeSpin 0.8s linear infinite' }} />}
          {knopTekst}
        </button>
  )

  const foutBlok = fout && (
    <div style={{ fontSize: '0.7rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.5rem 0.6rem' }}>{fout}</div>
  )

  if (volScherm) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <button onClick={onClose} disabled={bezig} aria-label="Terug" style={{
          position: 'absolute', top: isMobile ? 'calc(0.75rem + env(safe-area-inset-top, 0px))' : '1rem', left: isMobile ? '0.75rem' : '1rem',
          width: 36, height: 36, borderRadius: 10, zIndex: 2,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}><ArrowLeft size={16} /></button>

        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          paddingTop: isMobile ? 'calc(3.5rem + env(safe-area-inset-top, 0px))' : '4rem',
        }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: isMobile ? '0.5rem 1rem 1.25rem' : '0.75rem 1.5rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.4rem' : '1.75rem' }}>
              {foto && (
                <img src={foto} alt="" style={{
                  width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                  border: '1px solid rgba(255,255,255,0.12)', display: 'block', margin: '0 auto 0.9rem',
                }} />
              )}
              <div style={{
                fontSize: isMobile ? '1.45rem' : '1.6rem', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.025em', lineHeight: 1.2,
              }}>{vraag}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>{titel}</div>
              {subtitel && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{subtitel}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {keuzeVraag && (
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>{keuzeVraag}</div>
              )}
              {keuzes}
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35, textAlign: 'center' }}>{effect}</div>
              {foutBlok}
              {extra}
            </div>
          </div>
        </div>

        <div style={{
          flexShrink: 0, background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '0.75rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '1rem 1.5rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ maxWidth: 520, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>{knop}</div>
        </div>
        <style>{'@keyframes cmeSpin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.12)',
      borderTopLeftRadius: isMobile ? 16 : 12, borderTopRightRadius: isMobile ? 16 : 12,
      maxWidth: isMobile ? '100%' : 620, width: '100%', margin: '0 auto',
      display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titel}</div>
          {subtitel && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{subtitel}</div>}
        </div>
        <button onClick={onClose} disabled={bezig} style={iconBtn}><X size={16} /></button>
      </div>

      <div style={{ padding: '0.85rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          {vraag}
        </div>

        {keuzes}

        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>{effect}</div>

        {foutBlok}

        {knop}

        {extra}

        {onTerug && (
          <button onClick={onTerug} disabled={bezig} style={{
            padding: '0.6rem', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
            color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600,
            cursor: bezig ? 'default' : 'pointer', touchAction: 'manipulation', fontFamily: 'inherit',
          }}>{terugTekst}</button>
        )}
      </div>
      <style>{'@keyframes cmeSpin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}

const iconBtn = {
  width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
