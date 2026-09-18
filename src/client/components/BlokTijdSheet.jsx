// src/client/components/BlokTijdSheet.jsx
//
// Een tijd verzetten vanuit de agenda van de klant. Tik op de tijd van een
// blok en je draait hem hier goed.
//
// Waarom een wiel en geen sleepbaar rooster: op een telefoon vecht slepen met
// scrollen, en je hebt precies één ding nodig — een andere begintijd. Het wiel
// is dezelfde beweging als een wekker zetten.
//
// Waarom twee stappen en niet één scherm: eerst was alles tegelijk zichtbaar —
// wiel, duur, geldigheid, knop — en dan staat de zwaarste vraag (verander je
// vandaag of je hele plan?) onderaan als bijzaak. Nu kies je eerst de tijd, en
// pas daarna waarvoor hij geldt.
//
// Die tweede vraag is het halve verhaal:
//   · "Alleen deze dag"  → client_agenda_overrides, één datum. Het plan van de
//                         coach blijft staan; morgen is alles weer als het was.
//   · "Elke <dag>"      → het plan zelf: maaltijdtijd in week_structure,
//                         training/slaap/werk in client_agenda_blocks.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarOff, RotateCcw, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { recurringIdFor, DAY_LABELS_NL_LONG } from '../../modules/client-agenda/ClientAgendaService'
import TijdWiel from './TijdWiel'
import { STAP, tijdTekst as tijd } from './tijdHelpers'

const LIJN = 'rgba(255,255,255,0.08)'

const DUREN = [15, 30, 45, 60, 90, 120]

const TYPE_LABEL = { meal: 'Maaltijd', training: 'Training', sleep: 'Slaap', work: 'Werk', supplement: 'Supplementen' }

export default function BlokTijdSheet({
  blok, client, service, dagIso, mealPlanId, isMobile = false, onSluit, onKlaar,
}) {
  const duurVan = (b) => {
    const d = b.end >= b.start ? b.end - b.start : (24 * 60 - b.start) + b.end
    return Math.max(STAP, d)
  }
  const [stap, setStap] = useState('tijd')      // 'tijd' → 'bereik'
  const [start, setStart] = useState(() => Math.round(blok.start / STAP) * STAP)
  const [duur, setDuur] = useState(() => duurVan(blok))
  const [bereik, setBereik] = useState(null)    // bewust leeg: je kiest zelf
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') onSluit?.() }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])

  const eind = (start + duur) % 1440
  const soort = blok.type === 'meal' ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || 'Blok')
  const naam = blok.sublabel || (blok.type === 'meal' ? null : blok.label)
  const recurringId = recurringIdFor(blok)
  const verzet = blok.start !== start || duurVan(blok) !== duur
  const isOverschreven = !!blok.meta?.isOverridden
  const dagNaam = DAY_LABELS_NL_LONG[blok.day]?.toLowerCase() || 'week'

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

  const opTijd = stap === 'tijd'

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
        {/* Kop. Op stap twee staat links de weg terug. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: '0.75rem' }}>
          {!opTijd && (
            <button onClick={() => setStap('tijd')} aria-label="Terug" style={{ ...kaal, marginLeft: -6 }}>
              <ChevronLeft size={19} strokeWidth={3} />
            </button>
          )}
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

        {/* Waar je bent: twee streepjes, meer heeft een flow van twee stappen
            niet nodig. */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '0.9rem' }}>
          {['tijd', 'bereik'].map(s => (
            <span key={s} style={{
              flex: 1, height: 2, borderRadius: 2,
              background: (s === 'tijd' || !opTijd) ? '#fff' : 'rgba(255,255,255,0.12)',
              transition: 'background 0.2s ease',
            }} />
          ))}
        </div>

        {/* ── Stap 1: hoe laat, en hoe lang ── */}
        {opTijd && (
          <>
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

            {/* Het wiel is gedeeld met je dagindeling: overal dezelfde beweging. */}
            <div style={{ marginBottom: '0.9rem' }}>
              <TijdWiel waarde={start} onKies={setStart} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
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
          </>
        )}

        {/* ── Stap 2: waarvoor geldt dit ── */}
        {!opTijd && (
          <>
            {/* Wat je zojuist koos, klein en terug te draaien. */}
            <button onClick={() => setStap('tijd')} style={{
              width: '100%', marginBottom: '1rem', padding: '0.6rem 0.8rem',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
              borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{
                flex: 1, textAlign: 'left',
                fontSize: '1.05rem', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}>
                {tijd(start)}
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>
                  tot {tijd(eind)}
                </span>
              </span>
              <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                Wijzigen
              </span>
            </button>

            <div style={kopje}>Geldt dit voor</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
              {[
                {
                  id: 'vandaag',
                  titel: 'Alleen deze dag',
                  uitleg: 'Morgen staat je plan er weer zoals je coach het zette.',
                },
                {
                  id: 'altijd',
                  titel: `Elke ${dagNaam}`,
                  uitleg: 'Past je plan aan, ook voor de weken hierna.',
                },
              ].map(k => {
                const aan = bereik === k.id
                return (
                  <button
                    key={k.id}
                    onClick={() => setBereik(k.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '0.7rem 0.8rem', borderRadius: 12,
                      background: aan ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: `1px solid ${aan ? 'rgba(255,255,255,0.5)' : LIJN}`,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: aan ? '#fff' : 'transparent',
                      border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                    }}>
                      {aan && <Check size={13} strokeWidth={3.4} color="#0a0a0a" />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block', fontSize: '0.86rem', fontWeight: 900,
                        color: '#fff', letterSpacing: '-0.015em',
                      }}>
                        {k.titel}
                      </span>
                      <span style={{
                        display: 'block', fontSize: '0.66rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.35,
                      }}>
                        {k.uitleg}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {fout && (
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.6rem' }}>
            {fout}
          </div>
        )}

        {/* De knop. Op stap één brengt hij je verder, op stap twee slaat hij op. */}
        <button
          onClick={() => (opTijd ? setStap('bereik') : bewaar())}
          disabled={bezig || (opTijd ? !verzet : !bereik)}
          style={{
            width: '100%', minHeight: 46, borderRadius: 12, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: (opTijd ? verzet : bereik) ? '#fff' : 'rgba(255,255,255,0.12)',
            color: (opTijd ? verzet : bereik) ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
            cursor: (opTijd ? verzet : bereik) && !bezig ? 'pointer' : 'default',
            fontFamily: 'inherit', opacity: bezig ? 0.6 : 1,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {bezig ? 'Bezig…'
            : opTijd
              ? (verzet ? <>Verder <ChevronRight size={16} strokeWidth={3} /></> : 'Kies een andere tijd')
              : (bereik ? `Verzetten naar ${tijd(start)}` : 'Kies er een')}
        </button>

        {/* Weg voor vandaag, of terug naar wat de coach had gezet. Hoort bij de
            eerste stap: het zijn andere antwoorden op dezelfde vraag, geen
            vervolg erop. */}
        {opTijd && (
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
        )}
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
