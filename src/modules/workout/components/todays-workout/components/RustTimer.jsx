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

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward, Minus, Plus } from 'lucide-react'

const GOUD = '#FFD700'
const GROEN = '#10b981'
const STANDAARD_SEC = 90
const SLEUTEL = (naam) => `myarc.rust.${naam}`

export const gekozenRusttijd = (oefeningNaam) => {
  try {
    const n = parseInt(localStorage.getItem(SLEUTEL(oefeningNaam)), 10)
    return Number.isFinite(n) && n >= 15 && n <= 600 ? n : STANDAARD_SEC
  } catch {
    return STANDAARD_SEC
  }
}

const bewaarRusttijd = (oefeningNaam, sec) => {
  try { localStorage.setItem(SLEUTEL(oefeningNaam), String(sec)) } catch { /* privémodus */ }
}

const mmss = (sec) => {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RustTimer({ oefeningNaam, onKlaar, onStop, isMobile }) {
  const [totaal, setTotaal] = useState(() => gekozenRusttijd(oefeningNaam))
  const [over, setOver] = useState(() => gekozenRusttijd(oefeningNaam))
  const [loopt, setLoopt] = useState(true)
  const klaarRef = useRef(false)

  // Aftellen op een eindtijd en niet met een teller die je elke seconde met
  // één verlaagt: zet de telefoon zijn scherm uit, dan lopen intervallen
  // achter en klopt de resterende tijd niet meer bij het terugkomen.
  const eindRef = useRef(Date.now() + gekozenRusttijd(oefeningNaam) * 1000)

  useEffect(() => {
    if (!loopt) return
    const tik = () => {
      const rest = Math.round((eindRef.current - Date.now()) / 1000)
      setOver(rest)
      if (rest <= 0 && !klaarRef.current) {
        klaarRef.current = true
        if (navigator.vibrate) navigator.vibrate([30, 50, 30])
        onKlaar?.()
      }
    }
    tik()
    const id = setInterval(tik, 250)
    return () => clearInterval(id)
  }, [loopt, onKlaar])

  const verzet = (delta) => {
    const nieuw = Math.max(15, Math.min(600, totaal + delta))
    setTotaal(nieuw)
    bewaarRusttijd(oefeningNaam, nieuw)
    // De lopende klok meeschuiven, zodat +15 tijdens het rusten ook echt
    // vijftien seconden extra geeft in plaats van pas de volgende set.
    eindRef.current += delta * 1000
    klaarRef.current = false
    setOver(Math.round((eindRef.current - Date.now()) / 1000))
  }

  const opnieuw = () => {
    eindRef.current = Date.now() + totaal * 1000
    klaarRef.current = false
    setLoopt(true)
    setOver(totaal)
  }

  const pauze = () => {
    if (loopt) {
      setLoopt(false)
    } else {
      eindRef.current = Date.now() + Math.max(0, over) * 1000
      setLoopt(true)
    }
  }

  const voorbij = over <= 0
  const pct = Math.max(0, Math.min(100, (over / Math.max(1, totaal)) * 100))
  const kleur = voorbij ? GROEN : GOUD

  return (
    <div style={{
      borderTop: `1px solid ${voorbij ? 'rgba(16,185,129,0.35)' : 'rgba(255,215,0,0.28)'}`,
      background: voorbij ? 'rgba(16,185,129,0.08)' : 'rgba(255,215,0,0.06)',
      flexShrink: 0,
    }}>
      {/* Aflopende balk: in één oogopslag hoeveel er nog staat, zonder te lezen */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, transition: 'width 0.25s linear' }} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10,
        padding: isMobile ? '0.7rem 0.9rem' : '0.8rem 1.25rem',
      }}>
        <div style={{ minWidth: isMobile ? 66 : 78 }}>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: kleur,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {voorbij ? '0:00' : mmss(over)}
          </div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
          }}>
            {voorbij ? 'Klaar' : 'Rust'} · {mmss(totaal)}
          </div>
        </div>

        <RondeKnop titel="15 seconden korter" onClick={() => verzet(-15)} isMobile={isMobile}><Minus size={15} /></RondeKnop>
        <RondeKnop titel="15 seconden langer" onClick={() => verzet(15)} isMobile={isMobile}><Plus size={15} /></RondeKnop>
        <RondeKnop titel={loopt ? 'Pauzeer' : 'Hervat'} onClick={pauze} isMobile={isMobile}>
          {loopt ? <Pause size={15} /> : <Play size={15} />}
        </RondeKnop>
        <RondeKnop titel="Opnieuw" onClick={opnieuw} isMobile={isMobile}><RotateCcw size={14} /></RondeKnop>

        <div style={{ flex: 1 }} />

        {/* Doorgaan kan altijd — een timer die je vasthoudt is een timer die
            je de volgende keer niet meer aanzet. */}
        <button
          onClick={onStop}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 44, padding: isMobile ? '0 0.85rem' : '0 1.1rem',
            background: voorbij ? kleur : 'rgba(255,255,255,0.06)',
            border: `1px solid ${voorbij ? kleur : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12,
            color: voorbij ? '#0a0a0a' : '#fff',
            fontSize: isMobile ? '0.78rem' : '0.84rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <SkipForward size={15} strokeWidth={2.6} />
          Volgende set
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
        width: 40, height: 40, flexShrink: 0,
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
