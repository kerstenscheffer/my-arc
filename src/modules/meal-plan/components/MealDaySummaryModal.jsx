// src/modules/meal-plan/components/MealDaySummaryModal.jsx
//
// Inzicht: hoe ging het eten? Opent via de knop 'Inzicht' in de bovenbalk
// van de maaltijdpagina (en via een tik op de dagregel).
//
// Van boven naar onder:
//   1. De gekozen dag — kcal tegen je doel, met wat er over is of te veel,
//      en eiwit, koolhydraten en vet als dunne witte balken.
//   2. Wat je die dag hebt gelogd — per maaltijd foto, tijd, kcal, eiwit.
//   3. De week van die dag — zeven staven kcal met je doel als lijn, plus
//      het weekgemiddelde en hoeveel dagen je op doel zat. Tik een staaf.
//   4. Maandkalender — stip onder elke dag met logs, reeks dagen op rij.
//      Tik een dag en je ziet hem hierboven, ook buiten deze week.
//
// Datums zijn lokale datums. De vorige versie rekende in UTC, waardoor een
// maaltijd na 22:00 bij de volgende dag telde en de stipjes verschoven.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ArrowRight, Flame, CalendarDays } from 'lucide-react'
import { foodImageFallback } from '../foodImageFallback'

const LIJN = 'rgba(255,255,255,0.08)'
const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const NL_DAY_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
// Lokale datum als sleutel (YYYY-MM-DD), niet via toISOString (= UTC).
const sleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vanSleutel = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const maandagVan = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// Hoe ligt de inname tegen het doel? Binnen 10% = op doel.
const kcalKleur = (waarde, doel) => {
  if (!doel || !waarde) return 'rgba(255,255,255,0.35)'
  const r = waarde / doel
  if (r >= 0.9 && r <= 1.1) return GROEN
  if (r > 1.1) return ROOD
  return ORANJE
}

function MacroBalk({ label, waarde, doel }) {
  const pct = doel > 0 ? Math.min(100, (waarde / doel) * 100) : 0
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {fmt(waarde)}<span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{doel > 0 ? ` / ${fmt(doel)}g` : 'g'}</span>
      </div>
      <div style={{ height: 4, marginTop: 6, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

const kopje = (tekst, extra = null) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '1.5rem 0 0.75rem' }}>
    <span style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tekst}</span>
    {extra && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{extra}</span>}
  </div>
)

export default function MealDaySummaryModal({
  isOpen, onClose,
  db, clientId,
  selectedDay,        // 'today' | weekday key
  onDayChange,        // (newKey) => void
  onOpenFullHistory,  // () => void
  targets = {},       // { calories, protein, carbs, fat }
  isMobile: propMobile,
}) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  // De dag waarmee het venster opent: de dag die op de maaltijdpagina openstaat.
  const startDatum = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    const idx = selectedDay === 'today' || !selectedDay ? (vandaag.getDay() + 6) % 7 : Math.max(0, DAYS_OF_WEEK.indexOf(selectedDay))
    return plusDagen(maandagVan(vandaag), idx)
  }, [selectedDay])

  const [gekozen, setGekozen] = useState(startDatum)
  const [maand, setMaand] = useState(() => ({ y: startDatum.getFullYear(), m: startDatum.getMonth() }))
  const [perDag, setPerDag] = useState(null) // { 'YYYY-MM-DD': [maaltijden] }

  useEffect(() => { setGekozen(startDatum); setMaand({ y: startDatum.getFullYear(), m: startDatum.getMonth() }) }, [startDatum])

  // Eén keer ophalen voor alles wat in beeld is: de zichtbare maand, de week
  // van de gekozen dag, en 60 dagen terug voor de reeks.
  const bereik = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    const kandidaten = [
      new Date(maand.y, maand.m, 1), new Date(maand.y, maand.m + 1, 0),
      maandagVan(gekozen), plusDagen(maandagVan(gekozen), 6),
      plusDagen(vandaag, -60), vandaag,
    ]
    const van = new Date(Math.min(...kandidaten)); const tot = new Date(Math.max(...kandidaten))
    return { van: sleutel(van), tot: sleutel(tot) }
  }, [maand, gekozen])

  useEffect(() => {
    if (!isOpen || !db?.supabase || !clientId) return
    let weg = false
    const van = vanSleutel(bereik.van)
    const tot = plusDagen(vanSleutel(bereik.tot), 1)
    db.supabase.from('consumed_meals')
      .select('id, meal_name, meal_type, calories, protein, carbs, fat, consumed_at, image_url')
      .eq('client_id', clientId)
      .gte('consumed_at', van.toISOString())
      .lt('consumed_at', tot.toISOString())
      .order('consumed_at', { ascending: true })
      .then(({ data }) => {
        if (weg) return
        const uit = {}
        ;(data || []).forEach(r => {
          if (!r.consumed_at) return
          const k = sleutel(new Date(r.consumed_at))
          ;(uit[k] = uit[k] || []).push(r)
        })
        setPerDag(uit)
      }, () => { if (!weg) setPerDag({}) })
    return () => { weg = true }
  }, [isOpen, db, clientId, bereik])

  if (!isOpen) return null

  const doel = { kcal: Number(targets.calories) || 0, eiwit: Number(targets.protein) || 0, koolh: Number(targets.carbs) || 0, vet: Number(targets.fat) || 0 }
  const totaal = (lijst) => (lijst || []).reduce((t, m) => ({
    kcal: t.kcal + (Number(m.calories) || 0),
    eiwit: t.eiwit + (parseFloat(m.protein) || 0),
    koolh: t.koolh + (parseFloat(m.carbs) || 0),
    vet: t.vet + (parseFloat(m.fat) || 0),
  }), { kcal: 0, eiwit: 0, koolh: 0, vet: 0 })

  const vandaagSleutel = sleutel(new Date())
  const gekozenSleutel = sleutel(gekozen)
  const maaltijden = perDag?.[gekozenSleutel] || []
  const dag = totaal(maaltijden)
  const verschil = doel.kcal ? Math.round(doel.kcal - dag.kcal) : null

  // Week van de gekozen dag.
  const maandag = maandagVan(gekozen)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = plusDagen(maandag, i); const k = sleutel(d)
    return { d, k, kcal: totaal(perDag?.[k]).kcal, eiwit: totaal(perDag?.[k]).eiwit, gelogd: !!perDag?.[k]?.length }
  })
  const gelogdeDagen = week.filter(w => w.gelogd)
  const weekGem = gelogdeDagen.length ? {
    kcal: gelogdeDagen.reduce((t, w) => t + w.kcal, 0) / gelogdeDagen.length,
    eiwit: gelogdeDagen.reduce((t, w) => t + w.eiwit, 0) / gelogdeDagen.length,
  } : null
  const opDoel = doel.kcal ? gelogdeDagen.filter(w => w.kcal >= doel.kcal * 0.9 && w.kcal <= doel.kcal * 1.1).length : 0
  const staafMax = Math.max(doel.kcal * 1.25, ...week.map(w => w.kcal), 1)

  // Reeks: dagen op rij met logs, tot en met vandaag (of gisteren als je
  // vandaag nog niets logde).
  let reeks = 0
  if (perDag) {
    let d = new Date(); d.setHours(0, 0, 0, 0)
    if (!perDag[sleutel(d)]?.length) d = plusDagen(d, -1)
    while (perDag[sleutel(d)]?.length) { reeks++; d = plusDagen(d, -1) }
  }

  // Kalender.
  const eerste = new Date(maand.y, maand.m, 1)
  const leeg = (eerste.getDay() + 6) % 7
  const dagenInMaand = new Date(maand.y, maand.m + 1, 0).getDate()
  const cellen = [...Array(leeg).fill(null), ...Array.from({ length: dagenInMaand }, (_, i) => i + 1)]
  while (cellen.length % 7) cellen.push(null)
  const vorigeMaand = () => setMaand(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  const volgendeMaand = () => setMaand(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))

  // Ligt de gekozen dag in de week die op de maaltijdpagina openstaat? Dan
  // kun je er direct naartoe.
  const dezeWeek = maandagVan(new Date())
  const inDezeWeek = gekozen >= dezeWeek && gekozen <= plusDagen(dezeWeek, 6)
  const kies = (d) => { setGekozen(d); if (d.getMonth() !== maand.m || d.getFullYear() !== maand.y) setMaand({ y: d.getFullYear(), m: d.getMonth() }) }

  const pijl = {
    width: 34, height: 34, padding: 0, background: 'transparent', border: 'none', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const dagTitel = gekozenSleutel === vandaagSleutel ? 'Vandaag'
    : gekozenSleutel === sleutel(plusDagen(new Date(), -1)) ? 'Gisteren'
    : gekozen.toLocaleDateString('nl-NL', { weekday: 'long' })

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147482000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem', paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isMobile ? '100%' : 540, maxHeight: isMobile ? '92vh' : '88vh',
          background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: isMobile ? '20px 20px 0 0' : 20,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Kop: gekozen dag met pijlen, sluiten */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '0.9rem 0.75rem 0.8rem 1rem' : '1rem 1rem 0.9rem 1.25rem', borderBottom: `1px solid ${LIJN}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inzicht</div>
            <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dagTitel} <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'none' }}>· {gekozen.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace(/\.$/, '')}</span>
            </div>
          </div>
          <button onClick={() => kies(plusDagen(gekozen, -1))} aria-label="Vorige dag" style={pijl}><ChevronLeft size={20} strokeWidth={3} /></button>
          <button onClick={() => kies(plusDagen(gekozen, 1))} aria-label="Volgende dag" style={pijl}><ChevronRight size={20} strokeWidth={3} /></button>
          <button onClick={onClose} aria-label="Sluiten" style={{ ...pijl, width: 38, height: 38, marginLeft: 4, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LIJN}` }}><X size={18} strokeWidth={2.8} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '1rem 1rem 1.5rem' : '1.2rem 1.25rem 1.6rem' }}>
          {perDag === null ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Laden…</div>
          ) : (
            <>
              {/* ── 1. De dag ── */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '2.2rem' : '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(dag.kcal)}<span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 0 }}>{doel.kcal ? ` / ${fmt(doel.kcal)} kcal` : ' kcal'}</span>
                  </div>
                  {verschil !== null && maaltijden.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: '0.8rem', fontWeight: 800, color: kcalKleur(dag.kcal, doel.kcal) }}>
                      {Math.abs(verschil) <= doel.kcal * 0.1
                        ? 'Op doel'
                        : verschil > 0 ? `Nog ${fmt(verschil)} kcal over` : `${fmt(-verschil)} kcal boven je doel`}
                    </div>
                  )}
                </div>
              </div>
              {doel.kcal > 0 && (
                <div style={{ height: 6, marginTop: 12, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (dag.kcal / doel.kcal) * 100)}%`, height: '100%', borderRadius: 3, background: maaltijden.length ? kcalKleur(dag.kcal, doel.kcal) : 'transparent', transition: 'width 0.4s ease' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: '1.1rem' }}>
                <MacroBalk label="Eiwit" waarde={dag.eiwit} doel={doel.eiwit} />
                <MacroBalk label="Koolh." waarde={dag.koolh} doel={doel.koolh} />
                <MacroBalk label="Vet" waarde={dag.vet} doel={doel.vet} />
              </div>

              {inDezeWeek && gekozenSleutel !== sleutel(startDatum) && (
                <button
                  onClick={() => { onDayChange?.(DAYS_OF_WEEK[(gekozen.getDay() + 6) % 7]); onClose?.() }}
                  style={{ marginTop: '1rem', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 12, color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <CalendarDays size={16} strokeWidth={2.6} /> Open deze dag in je plan
                </button>
              )}

              {/* ── 2. Wat je hebt gelogd ── */}
              {kopje('Gelogd', maaltijden.length ? `${maaltijden.length} ${maaltijden.length === 1 ? 'maaltijd' : 'maaltijden'}` : null)}
              {maaltijden.length === 0 ? (
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Op deze dag is niets gelogd.</div>
              ) : maaltijden.map((m, i) => {
                const naam = m.meal_name || 'Maaltijd'
                const foto = m.image_url || foodImageFallback(naam, m.meal_type, 120)
                return (
                  <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderTop: i ? `1px solid ${LIJN}` : 'none' }}>
                    <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                        {new Date(m.consumed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span style={{ flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>{fmt(m.calories)} kcal</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmt(m.protein)}g eiwit</span>
                    </span>
                  </div>
                )
              })}

              {/* ── 3. De week ── */}
              {kopje(`Week van ${maandag.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace(/\.$/, '')}`, doel.kcal ? `${opDoel}/${gelogdeDagen.length || 0} op doel` : null)}
              <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                {doel.kcal > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(doel.kcal / staafMax) * 100}%`, borderTop: '1px dashed rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                )}
                {week.map((w, i) => {
                  const aan = w.k === gekozenSleutel
                  return (
                    <button key={w.k} onClick={() => kies(w.d)} aria-label={`${NL_DAY_SHORT[i]} ${fmt(w.kcal)} kcal`} style={{ flex: 1, height: '100%', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'flex-end', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{
                        width: '100%', height: `${Math.max(w.gelogd ? 4 : 2, (w.kcal / staafMax) * 100)}%`, borderRadius: 6,
                        background: w.gelogd ? kcalKleur(w.kcal, doel.kcal) : 'rgba(255,255,255,0.08)',
                        opacity: aan ? 1 : 0.55, outline: aan ? '2px solid #fff' : 'none', outlineOffset: 2,
                        transition: 'height 0.3s ease',
                      }} />
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {week.map((w, i) => (
                  <span key={w.k} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', fontWeight: 900, color: w.k === gekozenSleutel ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{NL_DAY_SHORT[i]}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{weekGem ? fmt(weekGem.kcal) : '–'}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>gem. kcal</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{weekGem ? `${fmt(weekGem.eiwit)}g` : '–'}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>gem. eiwit</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{gelogdeDagen.length}/7</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>dagen gelogd</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.9rem', marginTop: '0.7rem', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: GROEN }} />op doel (±10%)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ORANJE }} />onder</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ROOD }} />boven</span>
                {doel.kcal > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, borderTop: '1px dashed rgba(255,255,255,0.5)' }} />doel</span>}
              </div>

              {/* ── 4. Maand ── */}
              {kopje('Maand', reeks > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#fff' }}><Flame size={13} strokeWidth={2.6} /> {reeks} {reeks === 1 ? 'dag' : 'dagen'} op rij gelogd</span> : null)}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <button onClick={vorigeMaand} aria-label="Vorige maand" style={pijl}><ChevronLeft size={18} strokeWidth={3} /></button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.88rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>{NL_MONTHS[maand.m]} {maand.y}</div>
                <button onClick={volgendeMaand} aria-label="Volgende maand" style={pijl}><ChevronRight size={18} strokeWidth={3} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {NL_DAY_SHORT.map(d => <div key={d} style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {cellen.map((d, i) => {
                  if (!d) return <div key={i} />
                  const datum = new Date(maand.y, maand.m, d); const k = sleutel(datum)
                  const lijst = perDag?.[k]
                  const kc = totaal(lijst).kcal
                  const aan = k === gekozenSleutel
                  const vandaag = k === vandaagSleutel
                  return (
                    <button key={i} onClick={() => kies(datum)} style={{
                      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      background: aan ? '#fff' : 'transparent',
                      border: vandaag && !aan ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
                      borderRadius: 9, color: aan ? '#0a0a0a' : '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {d}
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: lijst?.length ? (aan ? '#0a0a0a' : kcalKleur(kc, doel.kcal)) : 'transparent' }} />
                    </button>
                  )
                })}
              </div>

              {onOpenFullHistory && (
                <button
                  onClick={() => { onOpenFullHistory(); onClose?.() }}
                  style={{ marginTop: '1.5rem', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  Volledige geschiedenis <ArrowRight size={15} strokeWidth={2.6} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
