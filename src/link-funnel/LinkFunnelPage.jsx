// src/link-funnel/LinkFunnelPage.jsx
// Funnel-pagina voor link-verkeer (5 uur per week in shape programma).
// Doel: bezoekers laten aanmelden voor coaching. Eén beat per slide, need-based
// copy (wat ze nódig hebben, geen deliverables). Flow:
//   1. Opener      — "Wil jij in shape komen naast je drukke leven?"            → Ja, dat wil ik!
//   2. Probleem    — "...maar ben je druk, niet consistent of loop je vast?"    → Bekijk oplossing
//   3. Systeem     — "Het 5 uur per week in shape systeem" + ondertekst          → Bekijk de 5 onderdelen
//   4-8. Onderdeel — elk onderdeel een eigen offer-slide (need-based copy)
//   9. Afsluiter   — garantie + Trustpilot → intake-formulier (/intake)
// Elke knop scrollt naar de volgende sectie; alleen de eind-CTA opent /intake.
// GEEN prijzen. Hergebruikt PhotoFan + de screenshots/titels uit PILLARS.
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronDown, Check } from 'lucide-react'
import PhotoFan from '../sales-call/sections/PhotoFan'
import { PILLARS } from '../sales-call/sections/PillarenSection'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
const INTAKE_URL = '/intake'

// Value-first copy per onderdeel — je gééft het advies weg ("zó los je het op").
// Concrete tips in jij-vorm; de screenshot laat zien dat het systeem het voor ze
// doet. screenshot + title komen uit PILLARS zodat beeld en naam in sync blijven.
const FUNNEL_NEEDS = [
  [
    'Zorg voor vaste structuur in je maaltijden en leer flexibel te zijn, zodat je bijna niet kunt falen.',
    'Kies maaltijden die je lang vol houden, zodat je niet gaat snaaien of terugvalt.',
  ],
  [
    'Leer hoe je meedoet met feestjes, uit eten en het weekend zonder je voortgang te slopen.',
    'Bouw je favoriete dingen in plaats van ze te schrappen, zo houd je het echt vol.',
  ],
  [
    'Train kort maar effectief, zo’n 3x per week, zodat het in je drukke leven past.',
    'Focus op de juiste oefeningen en techniek, zodat elke training telt.',
  ],
  [
    'Houd je voortgang bij in kracht, gewicht en foto’s, zodat je zwart-op-wit ziet dat het werkt.',
    'Stuur bij op data in plaats van op gevoel, zodat je nooit van koers raakt.',
  ],
  [
    'Laat iemand meekijken en je bijsturen, zodat je niet vastloopt of er alleen voor staat.',
    'Stel je vragen meteen, zodat twijfel je nooit stillegt.',
  ],
]

const ONDERDELEN = PILLARS.map((p, i) => ({ title: p.title, screenshot: p.screenshot, needs: FUNNEL_NEEDS[i] || [] }))

const SECTION_BASE = {
  scrollSnapAlign: 'start', minHeight: '100dvh', background: '#0a0a0a',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  overflow: 'hidden',
}

function Trustpilot() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN} />
      </svg>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>4.8</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <svg key={s} width={12} height={12} viewBox="0 0 24 24" fill={TP_GREEN}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    </div>
  )
}

// Gouden knop. onClick = actie (scroll naar volgende sectie); anders link naar /intake.
function CTAButton({ isMobile, label, onClick }) {
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: isMobile ? '1rem 1.75rem' : '1.15rem 2.5rem',
    background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: 14,
    fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, letterSpacing: '-0.01em',
    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
    boxShadow: `0 10px 30px ${GOLD}44`, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const inner = <>{label}<ChevronRight size={isMobile ? 20 : 22} strokeWidth={3} /></>
  if (onClick) return <button onClick={onClick} style={style}>{inner}</button>
  return <a href={INTAKE_URL} style={style}>{inner}</a>
}

// Subtiele "volgende"-scrollknop voor de onderdeel-slides (sleept ze door).
function ScrollDown({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Volgende" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
      fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>
      Volgende
      <span style={{ display: 'inline-flex', width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${GOLD}66`, alignItems: 'center', justifyContent: 'center', animation: 'funnelBob 1.8s ease-in-out infinite' }}>
        <ChevronDown size={18} color={GOLD} strokeWidth={3} />
      </span>
    </button>
  )
}

// 1. Opener — boog + interessevraag + knop.
function FunnelOpening({ isMobile, onNext }) {
  return (
    <section style={{ ...SECTION_BASE, padding: isMobile ? '3.5rem 0 2.5rem' : '4rem 0' }}>
      <div style={{ marginBottom: isMobile ? '2.5rem' : '3.25rem' }}>
        <PhotoFan isMobile={isMobile} />
      </div>
      <div style={{ textAlign: 'center', padding: isMobile ? '0 1.25rem' : '0 2rem', maxWidth: 820 }}>
        <h1 style={{ margin: 0, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.02em', color: '#fff', fontSize: isMobile ? 'clamp(1.9rem, 8vw, 2.6rem)' : 'clamp(2.5rem, 4.4vw, 3.4rem)' }}>
          Wil jij in shape komen <span style={{ color: GOLD }}>naast je drukke leven?</span>
        </h1>
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <CTAButton isMobile={isMobile} label="Ja, dat wil ik!" onClick={onNext} />
        </div>
        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          <Trustpilot />
        </div>
      </div>
    </section>
  )
}

// 2. Probleem — herkenning + knop naar de oplossing.
function FunnelProblem({ isMobile, onNext }) {
  return (
    <section style={{ ...SECTION_BASE, padding: isMobile ? '3rem 1.25rem' : '4rem 2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 760 }}>
        <h2 style={{ margin: 0, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', fontSize: isMobile ? 'clamp(1.7rem, 7vw, 2.3rem)' : 'clamp(2.2rem, 3.8vw, 3rem)' }}>
          Maar ben je niet consistent of loop je vast? En wil je het <span style={{ color: GOLD }}>voorgoed oplossen?</span>
        </h2>
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <CTAButton isMobile={isMobile} label="Bekijk oplossing" onClick={onNext} />
        </div>
      </div>
    </section>
  )
}

// 3. Systeem — intro op de oplossing + knop naar de onderdelen.
function FunnelSystem({ isMobile, onNext }) {
  return (
    <section style={{ ...SECTION_BASE, padding: isMobile ? '3rem 1.25rem' : '4rem 2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 720 }}>
        <div style={{ fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 900, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase', marginBottom: isMobile ? '0.9rem' : '1.1rem' }}>
          De oplossing
        </div>
        <h2 style={{ margin: 0, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', fontSize: isMobile ? 'clamp(1.8rem, 7.5vw, 2.4rem)' : 'clamp(2.4rem, 4vw, 3.1rem)' }}>
          Los het op met de <span style={{ color: GOLD }}>5 uur per week in shape aanpak.</span>
        </h2>
        <p style={{ margin: isMobile ? '1.5rem auto 0' : '1.85rem auto 0', maxWidth: 580, fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.82)' }}>
          Een systeem gemaakt om als drukke man in shape te komen en te blijven. Hoe? Door deze 5 dingen.
        </p>
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <CTAButton isMobile={isMobile} label="Bekijk de 5 onderdelen" onClick={onNext} />
        </div>
      </div>
    </section>
  )
}

// 4-8. Onderdeel-slide — één offer per scherm met need-based copy.
function OnderdeelSlide({ isMobile, index, title, screenshot, needs, onNext }) {
  return (
    <section style={{ ...SECTION_BASE, padding: isMobile ? '3.5rem 1.25rem 2.5rem' : '4rem 2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, width: '100%' }}>
        <div style={{ fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 900, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase', marginBottom: isMobile ? '0.6rem' : '0.8rem' }}>
          Onderdeel {index + 1} van {ONDERDELEN.length}
        </div>
        <h2 style={{ margin: 0, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', fontSize: isMobile ? 'clamp(1.5rem, 6.5vw, 2rem)' : 'clamp(2rem, 3.4vw, 2.7rem)' }}>
          {title}
        </h2>
        <img
          src={screenshot}
          alt={title}
          onError={(e) => { e.currentTarget.style.opacity = 0 }}
          style={{ display: 'block', width: '100%', maxWidth: isMobile ? 320 : 460, height: 'auto', objectFit: 'contain', margin: isMobile ? '1.5rem auto' : '2rem auto', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.55))' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.7rem' : '0.85rem', maxWidth: 540, margin: '0 auto', textAlign: 'left' }}>
          {needs.map((n, j) => (
            <div key={j} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
              <Check size={isMobile ? 18 : 20} color="#fff" strokeWidth={3.5} style={{ flexShrink: 0, marginTop: 3 }} />
              <p style={{ margin: 0, fontSize: isMobile ? '0.98rem' : '1.12rem', lineHeight: 1.4, color: '#fff', fontWeight: 800 }}>{n}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          <ScrollDown onClick={onNext} />
        </div>
      </div>
    </section>
  )
}

// 9. Afsluiter — garantie + Trustpilot + grote intake-CTA. Geen prijzen.
function FunnelCTASection({ isMobile }) {
  return (
    <section style={{ ...SECTION_BASE, padding: isMobile ? '3rem 1.25rem' : '4rem 2rem' }}>
      <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', fontSize: isMobile ? 'clamp(1.8rem, 7.5vw, 2.4rem)' : 'clamp(2.4rem, 4vw, 3.2rem)' }}>
          Klaar om het <span style={{ color: GOLD }}>voorgoed op te lossen?</span>
        </h2>
        <p style={{ margin: isMobile ? '1.5rem auto 0' : '1.85rem auto 0', maxWidth: 560, fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.85)' }}>
          De 5 uur per week aanpak regelt deze 5 dingen voor je. Ik kijk mee, stuur bij en zorg dat je deze keer wél doorzet.
        </p>
        <p style={{ margin: isMobile ? '1.1rem auto 0' : '1.35rem auto 0', maxWidth: 540, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.6)' }}>
          Geen zichtbaar verschil binnen 30 dagen? Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.
        </p>
        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          <Trustpilot />
        </div>
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <CTAButton isMobile={isMobile} label="Start nu en vul het formulier in" />
        </div>
        <p style={{ margin: '0.9rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          Vrijblijvend, je hoort binnen 24 uur of je een match bent.
        </p>
      </div>
    </section>
  )
}

export default function LinkFunnelPage() {
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Scroll naar sectie met index i (volgorde = DOM-volgorde hieronder).
  const goTo = (i) => containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })

  // DOM-index van elke slide. 0 opener, 1 probleem, 2 systeem, 3..7 onderdelen, 8 afsluiter.
  const ONDERDEEL_START = 3

  return (
    <div style={{ background: '#000', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y proximity', scrollBehavior: 'smooth' }}>
        <FunnelOpening isMobile={isMobile} onNext={() => goTo(1)} />
        <FunnelProblem isMobile={isMobile} onNext={() => goTo(2)} />
        <FunnelSystem isMobile={isMobile} onNext={() => goTo(ONDERDEEL_START)} />
        {ONDERDELEN.map((o, i) => (
          <OnderdeelSlide
            key={i}
            isMobile={isMobile}
            index={i}
            title={o.title}
            screenshot={o.screenshot}
            needs={o.needs}
            onNext={() => goTo(ONDERDEEL_START + i + 1)}
          />
        ))}
        <FunnelCTASection isMobile={isMobile} />
      </div>

      <style>{`
        @keyframes funnelBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  )
}
