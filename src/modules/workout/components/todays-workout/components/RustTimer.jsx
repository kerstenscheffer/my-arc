// src/modules/workout/components/todays-workout/components/RustTimer.jsx
//
// De rusttimer tussen twee sets, plus de "flow" eromheen: set invoeren →
// klok loopt → op nul staat het invoerscherm er weer.
//
// Waarom een aparte balk en geen apart scherm: je wilt tijdens het rusten
// nog steeds zien wat je net gelogd hebt en wat je vorige sessie deed. Een
// full-screen klok haalt precies dat weg.
//
// De rusttijd onthouden we per oefening in localStorage. Wie bij squats twee
// minuten pakt en bij curls veertig seconden, wil dat niet elke set opnieuw
// instellen.

import { useCallback, useRef } from 'react'
import { Pause, Play, RotateCcw, SkipForward, Minus, Plus } from 'lucide-react'
import { bewaarRusttijd } from '../rusttijd'
import { useRustKlok, verzetRustKlok, herstartRustKlok, wisselPauzeRustKlok, klokTekst } from '../rustKlok'

const GROEN = '#10b981'

const mmss = (sec) => klokTekst(Math.max(0, sec))

// De klok zelf staat in rustKlok.js en blijft lopen als dit scherm dicht gaat.
// `huidigeOefening`: het scherm waarin hij nu staat. Is dat een andere dan waar
// de rust begon, dan staat erbij waar de klok bij hoort.
export default function RustTimer({ huidigeOefening, onStop, isMobile }) {
  const { klok, over } = useRustKlok()
  const totaal = klok?.totaal ?? 0
  const loopt = klok?.pauzeOver == null
  const oefeningNaam = klok?.oefening
  const bron = klok?.bron
  const aangepast = !!klok?.aangepast

  const verzet = (delta) => {
    const nieuw = Math.max(15, Math.min(600, totaal + delta))
    // Handmatig aanpassen overschrijft de tijd van de coach voor déze
    // oefening, en blijft staan tot de klant hem weer verandert.
    bewaarRusttijd(oefeningNaam, nieuw)
    // De lopende klok meeschuiven, zodat +15 tijdens het rusten ook echt
    // vijftien seconden extra geeft in plaats van pas de volgende set.
    verzetRustKlok(nieuw, over + delta)
  }

  // Slepen over de klok verzet de rusttijd, in stappen van vijf seconden.
  // Sneller dan tien keer op + tikken, en je voelt meteen hoeveel je toevoegt.
  const sleep = useRef(null)

  const sleepStart = useCallback((e) => {
    sleep.current = { x: e.clientX, totaal, over: Math.max(0, over) }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [totaal, over])

  const sleepBeweeg = useCallback((e) => {
    if (!sleep.current) return
    // Zes pixels per stap van vijf seconden: genoeg om per ongeluk schuiven te
    // voorkomen, weinig genoeg om binnen een duimbreedte een minuut te halen.
    const stappen = Math.round((e.clientX - sleep.current.x) / 6)
    if (stappen === 0) return
    const nieuw = Math.max(15, Math.min(600, sleep.current.totaal + stappen * 5))
    if (nieuw === totaal) return
    verzetRustKlok(nieuw, Math.max(0, sleep.current.over + (nieuw - sleep.current.totaal)))
  }, [totaal])

  const sleepEinde = useCallback(() => {
    if (!sleep.current) return
    sleep.current = null
    if (oefeningNaam) bewaarRusttijd(oefeningNaam, totaal)
  }, [oefeningNaam, totaal])

  if (!klok) return null

  const voorbij = over <= 0
  const pct = Math.max(0, Math.min(100, (over / Math.max(1, totaal)) * 100))
  // Dik wit, net als de knop waar hij voor in de plaats komt. Groen alleen als
  // de rust om is — dat is het enige moment waarop de kleur iets zegt.
  const kleur = voorbij ? GROEN : '#fff'

  return (
    <div style={{ flexShrink: 0 }}>
      {huidigeOefening && oefeningNaam !== huidigeOefening && (
        <div style={{
          fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          Rust na {oefeningNaam}
        </div>
      )}
      {/* Aflopende balk: in één oogopslag hoeveel er nog staat, zonder te lezen */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, transition: 'width 0.25s linear' }} />
      </div>

      {/* Alles op één regel. Daarvoor zijn de ronde knoppen op een telefoon
          34px in plaats van 40, staan de tussenruimtes krap en heet de knop
          daar "Volgende" — met "Volgende set" erbij past het niet op 375px. */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
        gap: isMobile ? 6 : 10,
        padding: isMobile ? '0.6rem 0 0' : '0.7rem 0 0',
      }}>
        {/* De klok is een schuif: sleep hem naar rechts voor meer rust. */}
        <div
          onPointerDown={sleepStart}
          onPointerMove={sleepBeweeg}
          onPointerUp={sleepEinde}
          onPointerCancel={sleepEinde}
          title="Sleep om je rusttijd aan te passen"
          style={{
            minWidth: isMobile ? 82 : 96, flexShrink: 0, cursor: 'ew-resize',
            touchAction: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          }}
        >
          <div style={{
            fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: kleur,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {klokTekst(over)}
          </div>
          <div
            title={bron === 'coach' && !aangepast
              ? 'Rusttijd uit je schema. Met − en + pas je hem aan; die blijft dan staan.'
              : 'Rusttijd. Met − en + pas je hem aan; die blijft staan voor deze oefening.'}
            style={{
              fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Kort houden: "RUST · 1:30 ↔ · SCHEMA" liep op een telefoon
                onder de knoppen door. Het grote getal zegt al dat het een
                klok is; hier alleen de ingestelde tijd en waar die vandaan
                komt. Dat je kunt slepen staat in de title. */}
            {voorbij ? 'Klaar' : mmss(totaal)}
            {bron === 'coach' && !aangepast && <span style={{ color: 'rgba(255,255,255,0.65)' }}> · schema</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 5 : 8, flexShrink: 0 }}>
          <RondeKnop titel="15 seconden korter" onClick={() => verzet(-15)} isMobile={isMobile}><Minus size={15} /></RondeKnop>
          <RondeKnop titel="15 seconden langer" onClick={() => verzet(15)} isMobile={isMobile}><Plus size={15} /></RondeKnop>
          <RondeKnop titel={loopt ? 'Pauzeer' : 'Hervat'} onClick={wisselPauzeRustKlok} isMobile={isMobile}>
            {loopt ? <Pause size={15} /> : <Play size={15} />}
          </RondeKnop>
          <RondeKnop titel="Opnieuw" onClick={herstartRustKlok} isMobile={isMobile}><RotateCcw size={14} /></RondeKnop>
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Doorgaan kan altijd — een timer die je vasthoudt is een timer die
            je de volgende keer niet meer aanzet. */}
        <button
          onClick={onStop}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: isMobile ? 40 : 44, padding: isMobile ? '0 0.7rem' : '0 1.1rem',
            background: '#fff', border: '1px solid #fff', borderRadius: 12,
            color: '#0a0a0a',
            fontSize: isMobile ? '0.78rem' : '0.84rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <SkipForward size={15} strokeWidth={2.6} />
          {isMobile ? 'Volgende' : 'Volgende set'}
        </button>
      </div>
    </div>
  )
}

function RondeKnop({ children, onClick, titel, isMobile }) {
  return (
    <button
      onClick={onClick} title={titel} aria-label={titel}
      style={{
        width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 11, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
