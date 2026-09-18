// src/client/components/BlokTijdSheet.jsx
//
// Een tijd verzetten vanuit de agenda van de klant. Tik op de tijd van een
// blok en je draait hem hier goed.
//
// Waarom een wiel en geen sleepbaar rooster: op een telefoon vecht slepen met
// scrollen, en je hebt precies één ding nodig — een andere begintijd. Het wiel
// is dezelfde beweging als een wekker zetten.
//
// Twee soorten wijziging, en dat verschil is het halve verhaal:
//   · "Alleen vandaag"  → client_agenda_overrides, één datum. Het plan van de
//                         coach blijft staan; morgen is alles weer als het was.
//   · "Elke <dag>"      → het plan zelf: maaltijdtijd in week_structure,
//                         training/slaap/werk in client_agenda_blocks.
// Standaard staat hij op vandaag: een dag waarop het anders liep hoort je plan
// niet te herschrijven.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarOff, RotateCcw } from 'lucide-react'
import { recurringIdFor, DAY_LABELS_NL_LONG } from '../../modules/client-agenda/ClientAgendaService'

const LIJN = 'rgba(255,255,255,0.08)'
const STAP = 5                       // minuten per klik van het wiel
const REGEL = 40                     // hoogte van één regel in het wiel
const AANTAL = (24 * 60) / STAP      // 288 tijden, 00:00 t/m 23:55

const tijd = (min) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const DUREN = [15, 30, 45, 60, 90, 120]

const TYPE_LABEL = { meal: 'Maaltijd', training: 'Training', sleep: 'Slaap', work: 'Werk', supplement: 'Supplementen' }

export default function BlokTijdSheet({
  blok, client, service, dagIso, mealPlanId, isMobile = false, onSluit, onKlaar,
}) {
  const duurVan = (b) => {
    const d = b.end >= b.start ? b.end - b.start : (24 * 60 - b.start) + b.end
    return Math.max(STAP, d)
  }
  const [start, setStart] = useState(() => Math.round(blok.start / STAP) * STAP)
  const [duur, setDuur] = useState(() => duurVan(blok))
  const [bereik, setBereik] = useState('vandaag')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const wielRef = useRef(null)
  const scrollTimer = useRef(null)

  // Het wiel begint op de huidige tijd van het blok.
  useEffect(() => {
    const el = wielRef.current
    if (!el) return
    const id = requestAnimationFrame(() => { el.scrollTop = (start / STAP) * REGEL })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') onSluit?.() }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])

  // Pas vastklikken als het scrollen stilligt; anders staat er tijdens het
  // draaien elke frame een ander getal en flikkert de hele sheet mee.
  const opScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const el = wielRef.current
      if (!el) return
      const i = Math.max(0, Math.min(AANTAL - 1, Math.round(el.scrollTop / REGEL)))
      setStart(i * STAP)
    }, 90)
  }
  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current) }, [])

  const eind = (start + duur) % 1440
  const soort = blok.type === 'meal' ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || 'Blok')
  const naam = blok.sublabel || (blok.type === 'meal' ? null : blok.label)
  const recurringId = recurringIdFor(blok)
  const verzet = blok.start !== start || duurVan(blok) !== duur
  const isOverschreven = !!blok.meta?.isOverridden

  const doe = async (fn) => {
    setBezig(true); setFout(null)
    try {
      await fn()
      onKlaar?.()
    } catch (e) {
      console.error('Tijd aanpassen mislukt:', e)
      setFout(e?.message || 'Opslaan mislukt')
      setBezig(false)
    }
  }

  const bewaar = () => doe(async () => {
    if (bereik === 'vandaag') {
      await service.upsertOverride({
        clientId: client.id, dateIso: dagIso, recurringId,
        startMin: start, endMin: eind,
      })
      return
    }
    await service.shiftBlock({
      block: { ...blok, clientId: client.id },
      newStartMin: start, newEndMin: eind,
      mealPlanId,
    })
  })

  const slaOver = () => doe(() => service.upsertOverride({
    clientId: client.id, dateIso: dagIso, recurringId, skipped: true,
  }))

  const zetTerug = () => doe(() => service.deleteOverride({
    clientId: client.id, dateIso: dagIso, recurringId,
  }))

  return createPortal(
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'min(420px, 100%)',
          maxHeight: isMobile ? '92dvh' : '90vh',
          overflowY: 'auto',
          background: '#0a0a0a',
          border: `1px solid ${LIJN}`,
          borderRadius: isMobile ? '18px 18px 0 0' : 18,
          padding: isMobile
            ? '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
            : '1.1rem 1.25rem 1.25rem',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Kop */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: '0.9rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {soort}
            </div>
            <div style={{
              fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
              marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {naam || soort}
            </div>
          </div>
          <button onClick={onSluit} aria-label="Sluiten" style={kaal}>
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* De nieuwe tijd, groot. Dit is waar je naar kijkt terwijl je draait. */}
        <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
          <span style={{
            fontSize: '2.1rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {tijd(start)}
          </span>
          <span style={{
            marginLeft: 8, fontSize: '0.8rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums',
          }}>
            tot {tijd(eind)}
          </span>
        </div>

        {/* Het wiel. Scroll-snap doet het werk; de band in het midden wijst aan
            welke regel telt. */}
        <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
          <div
            ref={wielRef}
            onScroll={opScroll}
            style={{
              height: REGEL * 5, overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%)',
            }}
          >
            <div style={{ paddingTop: REGEL * 2, paddingBottom: REGEL * 2 }}>
              {Array.from({ length: AANTAL }, (_, i) => {
                const m = i * STAP
                const actief = m === start
                return (
                  <div
                    key={m}
                    onClick={() => {
                      const el = wielRef.current
                      if (el) el.scrollTo({ top: i * REGEL, behavior: 'smooth' })
                      setStart(m)
                    }}
                    style={{
                      height: REGEL, scrollSnapAlign: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: actief ? '1.05rem' : '0.9rem',
                      fontWeight: actief ? 900 : 700,
                      color: actief ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {tijd(m)}
                  </div>
                )
              })}
            </div>
          </div>
          <div aria-hidden style={{
            position: 'absolute', left: 0, right: 0, top: REGEL * 2, height: REGEL,
            borderTop: `1px solid ${LIJN}`, borderBottom: `1px solid ${LIJN}`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* Hoe lang het duurt. */}
        <div style={{ marginBottom: '0.9rem' }}>
          <div style={kopje}>Duur</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DUREN.map(d => (
              <button
                key={d}
                onClick={() => setDuur(d)}
                style={{
                  ...chip,
                  background: duur === d ? '#fff' : 'transparent',
                  color: duur === d ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  borderColor: duur === d ? '#fff' : LIJN,
                }}
              >
                {d < 60 ? `${d} min` : `${d / 60} uur`}
              </button>
            ))}
          </div>
        </div>

        {/* Eenmalig of voorgoed. */}
        <div style={{ marginBottom: '0.9rem' }}>
          <div style={kopje}>Geldt voor</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'vandaag', label: 'Alleen deze dag' },
              { id: 'altijd', label: `Elke ${DAY_LABELS_NL_LONG[blok.day]?.toLowerCase() || 'week'}` },
            ].map(k => (
              <button
                key={k.id}
                onClick={() => setBereik(k.id)}
                style={{
                  ...chip, flex: 1, minHeight: 38,
                  background: bereik === k.id ? '#fff' : 'transparent',
                  color: bereik === k.id ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  borderColor: bereik === k.id ? '#fff' : LIJN,
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div style={{
            fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            marginTop: 6, lineHeight: 1.4,
          }}>
            {bereik === 'vandaag'
              ? 'Morgen staat je plan er weer zoals je coach het zette.'
              : 'Past je plan aan, ook voor de weken hierna.'}
          </div>
        </div>

        {fout && (
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, color: '#ef4444',
            marginBottom: '0.6rem',
          }}>
            {fout}
          </div>
        )}

        <button
          onClick={bewaar}
          disabled={bezig || !verzet}
          style={{
            width: '100%', minHeight: 46, borderRadius: 12, border: 'none',
            background: verzet ? '#fff' : 'rgba(255,255,255,0.12)',
            color: verzet ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
            cursor: verzet && !bezig ? 'pointer' : 'default', fontFamily: 'inherit',
            opacity: bezig ? 0.6 : 1,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {bezig ? 'Bezig…' : verzet ? `Verzetten naar ${tijd(start)}` : 'Kies een andere tijd'}
        </button>

        {/* Weg voor vandaag, of terug naar wat de coach had gezet. */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={slaOver} disabled={bezig} style={stilleKnop}>
            <CalendarOff size={13} strokeWidth={2.8} />
            Deze dag overslaan
          </button>
          {isOverschreven && (
            <button onClick={zetTerug} disabled={bezig} style={stilleKnop}>
              <RotateCcw size={13} strokeWidth={2.8} />
              Terug naar plan
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

const kaal = {
  width: 30, height: 30, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const kopje = {
  fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
}

const chip = {
  minHeight: 32, padding: '0 0.7rem', borderRadius: 999,
  border: `1px solid ${LIJN}`,
  fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const stilleKnop = {
  flex: 1, minHeight: 38, borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  background: 'transparent', border: `1px solid ${LIJN}`,
  color: 'rgba(255,255,255,0.55)',
  fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
