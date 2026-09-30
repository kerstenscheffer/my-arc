// src/modules/workout/components/todays-workout/components/OpwarmPoort.jsx
//
// De vraag die vóór je eerste set van een oefening komt: ben je opgewarmd?
//
// Waarom een poort en geen tip ergens op de pagina: een tip lees je één keer en
// daarna nooit meer. De schade van niet opwarmen — blessures in plaats van
// spiergroei — komt precies op het moment dat je je eerste set intikt, dus daar
// hoort de vraag ook.
//
// Twee bewuste grenzen aan het "forceren":
//
//   1. Alleen vóór de éérste set van deze oefening, vandaag. Bij set twee en
//      drie ben je warm en zou de vraag alleen maar irritant zijn — en een
//      vraag die je wegklikt op de automatische piloot werkt niet meer.
//   2. Je komt er altijd doorheen. Een harde blokkade levert geen opgewarmde
//      klant op maar een klant die niets meer logt, en dan zie je als coach
//      helemaal niets. De opwarmroute vraagt wel een handeling, zodat je er
//      niet per ongeluk doorheen tikt.
//
// De gewichten komen uit opwarmen.js en zijn percentages van het werkgewicht,
// precies zoals in de uitlegvideo.

import { useEffect, useState } from 'react'
import { Flame, Check, Play, ArrowRight } from 'lucide-react'
import { opwarmSets } from '../opwarmen'

const VLAK = 'rgba(255,255,255,0.04)'
const LIJN = 'rgba(255,255,255,0.1)'

export default function OpwarmPoort({
  oefeningNaam,
  werkgewicht,           // schatting uit je vorige set; aanpasbaar
  eenheid = 'kg',
  isMobile = false,
  db,
  onKlaar,               // () => door naar het set-invoerscherm
  onVideo,               // (video) => de speler openen
}) {
  const [stap, setStap] = useState('vraag')   // 'vraag' | 'flow'
  const [gewicht, setGewicht] = useState(() => {
    const n = Number(werkgewicht)
    return Number.isFinite(n) && n > 0 ? n : 0
  })
  const [afgevinkt, setAfgevinkt] = useState({})
  const [video, setVideo] = useState(null)

  // De opwarmvideo wordt op zijn rol gezocht, niet op titel of id: zo blijft
  // hij werken als de video hernoemd of vervangen wordt.
  useEffect(() => {
    let weg = false
    if (!db?.supabase) return undefined
    db.supabase
      .from('coach_videos')
      .select('id, title, video_url, thumbnail_url, description')
      .eq('rol', 'warming_up')
      .eq('is_active', true)
      .maybeSingle()
      .then(r => r, () => ({ data: null }))
      .then(({ data }) => { if (!weg) setVideo(data || null) })
    return () => { weg = true }
  }, [db])

  const sets = opwarmSets(gewicht, eenheid)

  const knop = (vol) => ({
    flex: 1, minHeight: 50, padding: '0 1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: vol ? '#fff' : 'transparent',
    border: `1px solid ${vol ? '#fff' : 'rgba(255,255,255,0.22)'}`,
    borderRadius: 14,
    color: vol ? '#0a0a0a' : '#fff',
    fontSize: isMobile ? '0.88rem' : '0.94rem', fontWeight: 900,
    letterSpacing: '-0.01em', fontFamily: 'inherit', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  // ── De vraag ─────────────────────────────────────────────────────────────
  if (stap === 'vraag') {
    return (
      <div style={{
        padding: isMobile ? '1.1rem 1rem' : '1.35rem 1.25rem',
        background: VLAK, border: `1px solid ${LIJN}`, borderRadius: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <Flame size={18} color="#fff" strokeWidth={2.6} />
          <span style={{
            fontSize: isMobile ? '1rem' : '1.08rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em',
          }}>
            Heb je correct opgewarmd?
          </span>
        </div>
        <p style={{
          margin: '0 0 1rem', fontSize: isMobile ? '0.78rem' : '0.82rem',
          fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
        }}>
          Voor {oefeningNaam || 'deze oefening'}. Koud zwaar tillen levert blessures op
          in plaats van spiergroei.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onKlaar} style={knop(true)}>
            <Check size={16} strokeWidth={3} />
            Ja, ik ben warm
          </button>
          <button onClick={() => setStap('flow')} style={knop(false)}>
            Nee, help me
            <ArrowRight size={15} strokeWidth={3} />
          </button>
        </div>
      </div>
    )
  }

  // ── De opwarmroute ───────────────────────────────────────────────────────
  return (
    <div style={{
      padding: isMobile ? '1.1rem 1rem' : '1.35rem 1.25rem',
      background: VLAK, border: `1px solid ${LIJN}`, borderRadius: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <Flame size={18} color="#fff" strokeWidth={2.6} />
        <span style={{
          flex: 1, fontSize: isMobile ? '1rem' : '1.08rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em',
        }}>
          Zo warm je op
        </span>
      </div>

      {/* Het werkgewicht bepaalt alle percentages, dus dat moet kloppen. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
        padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${LIJN}`, borderRadius: 12,
      }}>
        <span style={{
          flex: 1, fontSize: isMobile ? '0.76rem' : '0.8rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.55)',
        }}>
          Je werkgewicht vandaag
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={gewicht || ''}
          onChange={(e) => setGewicht(Number(e.target.value) || 0)}
          style={{
            width: 76, padding: '0.35rem 0.5rem', textAlign: 'right',
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${LIJN}`,
            borderRadius: 9, color: '#fff', fontSize: '0.95rem', fontWeight: 900,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
          {eenheid}
        </span>
      </div>

      {sets.length === 0 ? (
        <p style={{
          margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
        }}>
          Vul je werkgewicht in, dan reken ik je opwarmsets uit.
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {sets.map((s, i) => {
            const aan = !!afgevinkt[s.id]
            return (
              <button
                key={s.id}
                onClick={() => setAfgevinkt(v => ({ ...v, [s.id]: !v[s.id] }))}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '0.65rem 0', minHeight: 48,
                  background: 'transparent', border: 'none',
                  borderTop: i === 0 ? 'none' : `1px solid ${LIJN}`,
                  textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: aan ? '#10b981' : 'transparent',
                  border: `1px solid ${aan ? '#10b981' : 'rgba(255,255,255,0.25)'}`,
                }}>
                  {aan && <Check size={13} color="#fff" strokeWidth={3.4} />}
                </span>
                <span style={{
                  flexShrink: 0, minWidth: 74, padding: '0.22rem 0.45rem',
                  background: '#fff', borderRadius: 7, textAlign: 'center',
                  color: '#0a0a0a', fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                }}>
                  {s.gewicht} {eenheid}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: isMobile ? '0.84rem' : '0.88rem',
                    fontWeight: 900, color: '#fff', letterSpacing: '-0.01em',
                  }}>
                    {s.reps} herhalingen
                  </span>
                  <span style={{
                    display: 'block', fontSize: '0.7rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {s.label}{s.optioneel ? ' · optioneel' : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {video && (
        <button
          onClick={() => onVideo?.(video)}
          style={{
            width: '100%', minHeight: 44, marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: `1px solid ${LIJN}`, borderRadius: 12,
            color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Play size={14} fill="currentColor" strokeWidth={0} />
          {video.title || 'Bekijk hoe je opwarmt'}
        </button>
      )}

      <button onClick={onKlaar} style={{ ...knop(true), width: '100%' }}>
        <Check size={16} strokeWidth={3} />
        Ik ben opgewarmd
      </button>
    </div>
  )
}
