// src/modules/meal-plan/components/MealDayNavHeader.jsx
//
// Eén gecombineerde header bovenaan de meal-pagina: pijl-links +
// dagnaam-titel (midden, klikbaar) + pijl-rechts. Vervangt MealPageHeader.
//
// Klik op de dagnaam opent MealDaySummaryModal met agenda van de maand,
// dag-/week-gem stats en een knop naar de volledige geschiedenis.

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS_OF_WEEK = [
  { id: 0, name: 'Maandag',   key: 'monday' },
  { id: 1, name: 'Dinsdag',   key: 'tuesday' },
  { id: 2, name: 'Woensdag',  key: 'wednesday' },
  { id: 3, name: 'Donderdag', key: 'thursday' },
  { id: 4, name: 'Vrijdag',   key: 'friday' },
  { id: 5, name: 'Zaterdag',  key: 'saturday' },
  { id: 6, name: 'Zondag',    key: 'sunday' },
]

const getTodayIndex = () => {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

const indexToDate = (idx) => {
  const todayIdx = getTodayIndex()
  const date = new Date()
  date.setDate(date.getDate() + (idx - todayIdx))
  return date
}

export default function MealDayNavHeader({
  selectedDay,        // 'today' | 'monday' | 'tuesday' | …
  onDayChange,        // (newDayKey: string) => void
  onOpenSummary,      // () => void  — klik op dagnaam
  isMobile: propMobile,
  // Op de foto-kop: geen eigen balk of achtergrond, en alles in bold wit —
  // goud verdwijnt tegen een foto en de balk zou de fade doorsnijden.
  opFoto = false,
}) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  const todayIdx = getTodayIndex()
  const currentIdx = selectedDay === 'today' || !selectedDay
    ? todayIdx
    : Math.max(0, DAYS_OF_WEEK.findIndex(d => d.key === selectedDay))

  const currentDate = indexToDate(currentIdx)
  const dayInfo = DAYS_OF_WEEK[currentIdx]

  // Relative label — "Vandaag" / "Gisteren" / "Morgen" / null.
  const diff = currentIdx - todayIdx
  let relative = null
  if (diff === 0)  relative = 'Vandaag'
  else if (diff === -1) relative = 'Gisteren'
  else if (diff === 1)  relative = 'Morgen'

  const dateLabel = currentDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })

  const goPrev = () => {
    const prev = currentIdx - 1
    if (prev < 0) return // niet voorbij het begin van de week
    onDayChange?.(DAYS_OF_WEEK[prev].key)
  }
  const goNext = () => {
    const next = currentIdx + 1
    if (next > 6) return
    onDayChange?.(DAYS_OF_WEEK[next].key)
  }

  // Pijl-knoppen zonder kader: minimaal vierkant tap-target, witte pijl,
  // geen achtergrond of border. "Disabled" wordt alleen door de kleur
  // gemarkeerd. Compactere afmeting want het kader is weg.
  const arrowBtnStyle = (disabled) => ({
    width: isMobile ? 32 : 36,
    height: isMobile ? 32 : 36,
    borderRadius: 0,
    background: 'transparent',
    border: 'none',
    color: disabled ? 'rgba(255,255,255,0.25)' : '#fff',
    filter: opFoto ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  })

  return (
    <div style={opFoto ? { position: 'relative', zIndex: 2 } : {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      // Onderlijn verwijderd zodat de header rustig in de pagina valt.
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        // Pijlen meer naar binnen: bredere zij-padding zodat ze niet aan
        // de rand kleven.
        padding: isMobile ? '0.65rem 1.5rem' : '0.8rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <button
          onClick={goPrev}
          aria-label="Vorige dag"
          disabled={currentIdx === 0}
          style={arrowBtnStyle(currentIdx === 0)}
        >
          <ChevronLeft size={isMobile ? 24 : 26} strokeWidth={opFoto ? 3 : 2.4} />
        </button>

        {/* Centered clickable day title */}
        <button
          onClick={onOpenSummary}
          aria-label="Open dag-samenvatting"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '0.3rem 0.5rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3,
            minWidth: 0,
          }}
        >
          <div style={{
            // Tekst groter — was 0.95/1.05rem, nu 1.15/1.3rem zodat de
            // dagnaam echt de blikvanger is.
            fontSize: opFoto ? (isMobile ? '1.6rem' : '2.1rem') : (isMobile ? '1.15rem' : '1.3rem'),
            fontWeight: 900,
            color: opFoto ? '#fff' : '#FFD700',
            letterSpacing: opFoto ? '-0.03em' : '-0.02em',
            textShadow: opFoto ? '0 2px 12px rgba(0,0,0,0.7)' : 'none',
            lineHeight: 1.1,
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap',
          }}>
            {dayInfo?.name || '—'}
            {relative && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                color: 'rgba(0,0,0,0.85)',
                background: opFoto ? '#fff' : '#FFD700',
                padding: '2px 7px',
                borderRadius: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {relative}
              </span>
            )}
          </div>
          <div style={{
            // Datum-regel ook iets groter en helderder.
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            fontWeight: opFoto ? 800 : 600,
            color: opFoto ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
            lineHeight: 1,
            textShadow: opFoto ? '0 2px 10px rgba(0,0,0,0.75)' : 'none',
          }}>
            {dateLabel} · tik voor agenda
          </div>
        </button>

        <button
          onClick={goNext}
          aria-label="Volgende dag"
          disabled={currentIdx === 6}
          style={arrowBtnStyle(currentIdx === 6)}
        >
          <ChevronRight size={isMobile ? 24 : 26} strokeWidth={opFoto ? 3 : 2.4} />
        </button>
      </div>
    </div>
  )
}
