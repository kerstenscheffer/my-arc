// src/modules/meal-plan/components/DagenKiezer.jsx
//
// "Waar geldt deze wijziging?" voor aanpassen en wisselen van een maaltijd.
// Zeven dagen om aan te tikken, en daarboven de keuze tussen:
//
//   Altijd        -> blijvend in het weekplan, op de gekozen weekdagen
//   Alleen week X -> eenmalig op die datums (deze week, volgende week of de
//                    week erna); daarna staat het gewone plan er weer
//
// Geeft via onKies één object terug:
//   { modus: 'altijd', dagen: ['monday', ...] }
//   { modus: 'week',   dagen: [...], datums: ['2026-10-20', ...] }
// Wat ermee gebeurt (weekplan of losse datum) bepaalt de aanroeper.
//
// `volScherm`: zelfde keuzes, maar groot: pop-up van onder over een geblurde
// pagina, met ronde foto en grote vraag (stijl van het logscherm). Eerst een
// volledig scherm; met zo weinig tekst bleef de helft leeg (27 okt 2026).
//
// `dagenMetMaaltijd(maandag | null)`: optioneel, geeft (async) de dag-keys
// terug waar deze maaltijd op dit moment staat; null = het vaste weekplan.
// Die dagen krijgen een stip, zodat je ziet waar hij terugkomt.
//
// `trainingsdagen` (pre-workout): alleen die weekdagen zijn te kiezen; een
// pre-workout op een rustdag of eenmalig op een rustdag heeft geen betekenis
// (en deed eenmalig ook niets). `vastAltijd`: bij "Altijd" staan de
// trainingsdagen vast aan, je kiest niet zelf: de pre-workout volgt de
// training, ook als die later verschuift.
//
// `fotoNaar`: bij wisselen twee foto's, oud -> nieuw.
import React, { useEffect, useMemo, useState } from 'react'
import { X, Repeat, CalendarDays, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
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
  volScherm = false, foto = null, fotoNaar = null, dagenMetMaaltijd = null,
  trainingsdagen = null, vastAltijd = false,
  // `inline`: alleen de keuzes en de knop, zonder kop of eigen venster — voor
  // binnen een ander scherm (het wisselscherm, 27 okt 2026).
  inline = false,
}) {
  const mag = (key) => !trainingsdagen || trainingsdagen.includes(key)
  const bekeken = datum ? new Date(datum) : new Date()
  const ditMaandag = maandagVan(new Date())
  // Welke week bekijkt de klant nu? Die staat voorgeselecteerd bij "Alleen".
  const startWeek = Math.max(0, Math.min(2, Math.round((maandagVan(bekeken) - ditMaandag) / (7 * 864e5))))

  // Verwijderen begint op "Eenmalig" met alleen de bekeken dag: wie snel
  // doortikt, haalt anders de maaltijd voor altijd uit het weekplan.
  const [modus, setModus] = useState(gevaar ? 'week' : 'altijd')
  const [week, setWeek] = useState(startWeek)
  const [gekozen, setGekozenRuw] = useState(() => new Set(dagKey && mag(dagKey) ? [dagKey] : []))
  const setGekozen = (v) => setGekozenRuw(prev => new Set([...(typeof v === 'function' ? v(prev) : v)].filter(mag)))
  const vast = vastAltijd && !!trainingsdagen && modus === 'altijd'
  const effectief = vast ? new Set(trainingsdagen) : gekozen

  const weekMaandag = plus(ditMaandag, week * 7)
  const datumVan = (idx) => plus(weekMaandag, idx)

  // Op welke dagen staat deze maaltijd? Vast plan bij "Altijd", de
  // gekozen week (met losse dag-aanpassingen) bij "Eenmalig".
  const [aanwezig, setAanwezig] = useState(() => new Set())
  useEffect(() => {
    if (!dagenMetMaaltijd) return undefined
    let weg = false
    Promise.resolve(dagenMetMaaltijd(modus === 'altijd' ? null : weekMaandag))
      .then(keys => { if (!weg) setAanwezig(new Set(keys || [])) }, () => { if (!weg) setAanwezig(new Set()) })
    return () => { weg = true }
  }, [modus, week]) // eslint-disable-line react-hooks/exhaustive-deps
  // "Alle dagen": waar deze maaltijd staat, of zonder die info de hele week.
  // Nog een keer tikken = terug naar alleen de bekeken dag.
  const doelDagen = new Set([...(aanwezig.size > 0 ? aanwezig : DAGEN.map(d => d.key))].filter(mag))
  const alleDagenAan = doelDagen.size > 0 && gekozen.size === doelDagen.size && [...doelDagen].every(k => gekozen.has(k))
  const zetAlleDagen = () => setGekozen(alleDagenAan ? new Set(dagKey ? [dagKey] : []) : new Set(doelDagen))

  const wissel = (key) => !vast && mag(key) && setGekozen(prev => {
    const n = new Set(prev)
    if (n.has(key)) n.delete(key); else n.add(key)
    return n
  })

  const lijst = DAGEN.filter(d => effectief.has(d.key))
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

  const keuzes = (
    <>
        {/* Altijd / Eenmalig */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {[
            { key: 'altijd', Icon: Repeat, label: 'Altijd' },
            { key: 'week', Icon: CalendarDays, label: 'Eenmalig' },
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

        {/* De zeven dagen. Erboven één regel: links de week (alleen bij "Eén
            week", met losse pijltjes), rechts "Alle dagen" = alle dagen waar
            deze maaltijd staat (zonder die info: de hele week). */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, minHeight: 24 }}>
            {modus === 'week' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={bezig || week === 0}
                  aria-label="Vorige week" style={{ ...pijl, opacity: week === 0 ? 0.25 : 1 }}><ChevronLeft size={18} strokeWidth={2.8} /></button>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                  Alleen {kortDatum(weekMaandag)} – {kortDatum(plus(weekMaandag, 6))}
                </span>
                <button onClick={() => setWeek(w => Math.min(2, w + 1))} disabled={bezig || week === 2}
                  aria-label="Volgende week" style={{ ...pijl, opacity: week === 2 ? 0.25 : 1 }}><ChevronRight size={18} strokeWidth={2.8} /></button>
              </div>
            ) : <span />}
            {!vast && doelDagen.size > 1 && <button onClick={zetAlleDagen} disabled={bezig} style={{
              background: 'none', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 900,
              cursor: 'pointer', padding: 0, fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{alleDagenAan ? 'Alleen deze dag' : 'Alle dagen'}</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {DAGEN.map((d, i) => {
              const aan = effectief.has(d.key)
              const kan = mag(d.key) && !vast
              return (
                <button key={d.key} onClick={() => wissel(d.key)} disabled={bezig || !kan} style={{
                  padding: '0.55rem 0', borderRadius: 10, cursor: kan ? 'pointer' : 'default', fontFamily: 'inherit',
                  opacity: mag(d.key) ? 1 : 0.25,
                  background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                  color: aan ? '#000' : 'rgba(255,255,255,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{d.kort}</span>
                  {modus === 'week' && (
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, opacity: 0.75 }}>{datumVan(i).getDate()}</span>
                  )}
                  {/* Stip: deze maaltijd staat op deze dag. */}
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', marginTop: 2,
                    background: aanwezig.has(d.key) ? (aan ? '#000' : '#fff') : 'transparent',
                  }} />
                </button>
              )
            })}
          </div>
          {aanwezig.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
              in je plan
            </div>
          )}
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

  if (inline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }}>{vraag}</div>
        {keuzes}
        {foutBlok}
        {extra}
        {knop}
        {onTerug && (
          <button onClick={onTerug} disabled={bezig} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer', padding: '0.4rem', touchAction: 'manipulation',
          }}>{terugTekst}</button>
        )}
        <style>{'@keyframes cmeSpin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  if (volScherm) {
    // Pop-up van onder over een geblurde pagina: je ziet nog waar je zat.
    // Tik naast de pop-up = sluiten.
    return (
      <div onClick={() => !bezig && onClose?.()} style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        animation: 'dkFade 0.2s ease',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          position: 'relative', background: '#0a0a0a',
          borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
          width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'dkOmhoog 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0', flexShrink: 0 }} />
          <button onClick={onClose} disabled={bezig} aria-label="Sluiten" style={{
            position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 10, zIndex: 2,
            background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}><X size={16} /></button>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ padding: isMobile ? '1rem 1rem 1rem' : '1.25rem 1.5rem 1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                {foto && fotoNaar ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '0.8rem' }}>
                    <img src={foto} alt="" style={{
                      width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', opacity: 0.5,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }} />
                    <ArrowRight size={20} strokeWidth={2.8} color="#fff" />
                    <img src={fotoNaar} alt="" style={{
                      width: 84, height: 84, borderRadius: '50%', objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }} />
                  </div>
                ) : foto && (
                  <img src={foto} alt="" style={{
                    width: 84, height: 84, borderRadius: '50%', objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.12)', display: 'block', margin: '0 auto 0.8rem',
                  }} />
                )}
                <div style={{
                  fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.025em', lineHeight: 1.2, padding: '0 2rem',
                }}>{vraag}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                  {titel}{subtitel ? ` · ${subtitel}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {keuzes}
                {foutBlok}
                {extra}
              </div>
            </div>
          </div>

          <div style={{
            flexShrink: 0, background: '#0a0a0a',
            padding: isMobile ? '0.25rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '0.25rem 1.5rem 1.5rem',
            display: 'flex', flexDirection: 'column',
          }}>{knop}</div>
        </div>
        <style>{'@keyframes cmeSpin { to { transform: rotate(360deg); } } @keyframes dkFade { from { opacity: 0 } to { opacity: 1 } } @keyframes dkOmhoog { from { transform: translateY(100%) } to { transform: translateY(0) } }'}</style>
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

const pijl = {
  width: 24, height: 24, flexShrink: 0, padding: 0, background: 'none',
  border: 'none', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const iconBtn = {
  width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
