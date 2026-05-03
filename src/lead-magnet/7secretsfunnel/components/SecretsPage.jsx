// src/lead-magnet/7secretsfunnel/components/SecretsPage.jsx
import { useState, useEffect, useRef } from 'react'
import { GOLD } from './shared'

const pp = "'Poppins', sans-serif"
const DEADLINE = new Date('2026-03-11T12:00:00').getTime()

function useCountdown() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      if (diff <= 0) { setT('Verlopen'); return }
      const d = Math.floor(diff / 86400000)
      const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setT(d + 'd ' + h + ':' + m + ':' + s)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

const G = ({children}) => <span className="ss-gold" style={{ fontSize:'105%' }}>{children}</span>
const B = ({children}) => <span style={{ color:'#fff', fontWeight:700, fontSize:'105%' }}>{children}</span>

const SECRETS = [
  {
    title: <>Verhoog je <G>NEAT</G> voor meer eten en sneller vetverlies</>,
    body: <>De mannen die moeiteloos droog de zomer ingaan hebben één ding gemeen: <B>ze bewegen meer buiten de gym.</B> Dit heet NEAT en het verbrandt tot <G>30% van je dagelijkse calorieën.</G></>,
    steps: [
      'Loop 10 minuten na elke maaltijd',
      'Sta op tijdens je werkdag — elke 45 min',
      'Neem de trap in plaats van de lift',
      'Loop of fiets korte afstanden',
    ],
  },
  {
    title: <>Waarom dat laatste laagje <G>buikvet</G> niet weg wil</>,
    body: <>Een van de meest voorkomende oorzaken? <G>Chronisch hoog cortisol</G> door te weinig slaap en te veel stress. Je lichaam geeft het signaal om <B>vet vast te houden — juist rond je buik.</B></>,
    steps: [
      'Slaap minimaal 7-8 uur per nacht',
      'Telefoon weg 1 uur voor bed',
      'Koele slaapkamer (16-18°C)',
      "Bereid je volgende dag 's avonds voor",
    ],
  },
  {
    title: <>Meer <G>spierdefinitie</G> door een simpele dagelijkse gewoonte</>,
    body: <>Je hebt misschien al meer spieren dan je denkt — <B>ze zijn alleen niet zichtbaar.</B> Door te weinig water houdt je lichaam vocht vast onder je huid. Dat maakt je <B>zachter en platter</B> dan je bent.</>,
    steps: [
      'Drink minimaal 3 liter water per dag',
      'Begin je dag met 500ml direct na het opstaan',
      'Houd een fles bij je — vul direct bij als hij leeg is',
      'Vervang frisdrank en sap door water',
    ],
  },
  {
    title: <>De ene set die <G>80%</G> van je groei bepaalt</>,
    body: <>De meeste mannen bouwen hun sets op, maar tegen de tijd dat ze bij hun zwaarste set komen is <B>hun energie al op.</B> Het geheim? Na een goede warm-up <G>direct de zwaarste set</G> wanneer kracht en focus maximaal zijn.</>,
    steps: [
      '2-3 opwarmsets met licht gewicht',
      'Eerste werkset = zwaarste set, tot (bijna) falen',
      'Daarna 2-3 backoff sets met iets minder gewicht',
      'Focus op compound oefeningen (squat, bench, deadlift)',
    ],
  },
  {
    title: <>Dezelfde carbs, ander moment — een <G>droger</G> lichaam</>,
    body: <>Je hoeft <B>niet minder te eten.</B> Het gaat om <G>wanneer</G> je eet. Plan het merendeel van je koolhydraten rond je training — je lichaam <G>gebruikt ze in plaats van opslaat.</G></>,
    steps: [
      'Grote maaltijd met carbs 2-3 uur voor training',
      'Snelle carbs (rijstwafel, banaan) 1 uur ervoor',
      'Post-workout maaltijd binnen 2 uur na training',
      'Minder carbs op rustdagen',
    ],
  },
  {
    title: <>Extra <G>vet verliezen</G> zonder harder te diëten</>,
    body: <>'s Ochtends zijn je glycogeenvoorraden laag. Je lichaam schakelt sneller over op <G>vetverbranding.</G> Dezelfde beweging na de lunch heeft dit effect niet.</>,
    steps: [
      'Begin je dag met 20-30 min wandelen voor het ontbijt',
      'Of: fiets naar werk / school',
      'Stel je eerste maaltijd 1-2 uur uit',
      'Drink zwarte koffie of thee als boost',
    ],
  },
  {
    title: <><G>Testosteron</G> verhogen — gratis en effectiever dan supplementen</>,
    body: <><G>95% van je testosteron</G> wordt aangemaakt tijdens diepe slaap. Zonlicht en gezonde vetten doen de rest. Drie <G>gratis dingen</G> die effectiever zijn dan welk supplement dan ook.</>,
    steps: [
      'Slaap 7-9 uur in een donkere, koele kamer',
      'Minimaal 15 min direct zonlicht per dag',
      'Eet dagelijks gezonde vetten (eieren, avocado, noten)',
      'Vermijd alcohol — verlaagt testosteron direct',
    ],
  },
]

// Number sizes escalate toward secret 7
const numberSizes = [
  { mobile: '1.6rem', desktop: '1.8rem' },
  { mobile: '1.7rem', desktop: '1.9rem' },
  { mobile: '1.8rem', desktop: '2.1rem' },
  { mobile: '1.9rem', desktop: '2.3rem' },
  { mobile: '2.1rem', desktop: '2.5rem' },
  { mobile: '2.3rem', desktop: '2.8rem' },
  { mobile: '2.8rem', desktop: '3.2rem' },
]

function SecretItem({ secret, index, isOpen, isUnlocked, isNext, onToggle, isMobile, secretRef }) {
  const locked = !isUnlocked
  const size = numberSizes[index]

  return (
    <div ref={secretRef} style={{
      position: 'relative',
      transition: 'all 0.3s ease',
      pointerEvents: locked ? 'none' : 'auto',
      userSelect: locked ? 'none' : 'auto',
      borderTop: '1px solid rgba(255,186,9,0.08)',
      borderBottom: isOpen ? '1px solid rgba(255,186,9,0.08)' : 'none',
    }}>
      {/* Sparkles around numbers 3-7 when locked */}
      {index >= 2 && (
        <>
          <div style={{
            position: 'absolute', left: isMobile ? '0.8rem' : '1rem', top: '0.4rem',
            width: '3px', height: '3px', borderRadius: '50%',
            background: GOLD, opacity: locked ? 0.3 : 0,
            boxShadow: '0 0 6px '+GOLD,
            animation: locked ? 'ssSparkle 2.5s ease-in-out '+(index*0.3)+'s infinite' : 'none',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: isMobile ? '2.2rem' : '2.6rem', top: '0.2rem',
            width: '2px', height: '2px', borderRadius: '50%',
            background: GOLD, opacity: locked ? 0.25 : 0,
            boxShadow: '0 0 4px '+GOLD,
            animation: locked ? 'ssSparkle 3s ease-in-out '+(0.5+index*0.2)+'s infinite' : 'none',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: isMobile ? '0.3rem' : '0.5rem', bottom: '0.5rem',
            width: '2.5px', height: '2.5px', borderRadius: '50%',
            background: GOLD, opacity: locked ? 0.2 : 0,
            boxShadow: '0 0 5px '+GOLD,
            animation: locked ? 'ssSparkle 2.8s ease-in-out '+(1+index*0.25)+'s infinite' : 'none',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Header — clickable, SHAKES when it's the next to open */}
      <button onClick={onToggle} disabled={locked} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.9rem 0' : '1rem 0',
        background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        textAlign: 'left',
        animation: (isNext && !isOpen) ? 'ssRowShake 3s ease-in-out 1.5s infinite' : 'none',
      }}>
        {/* Big gold number — ALWAYS visible and sharp */}
        <div style={{ width: isMobile ? '3rem' : '3.5rem', flexShrink: 0, textAlign: 'center', overflow: 'visible' }}>
          <span className="ss-gold-gloss" style={{
            fontFamily: pp,
            fontSize: isMobile ? size.mobile : size.desktop,
            fontWeight: 900,
            lineHeight: 1,
            opacity: locked ? 0.4 : 1,
            transition: 'opacity 0.3s',
          }}>{index + 1}</span>
        </div>

        {/* Title — blurred when locked */}
        <div style={{ flex: 1, minWidth: 0, filter: locked ? 'blur(5px)' : 'none', opacity: locked ? 0.4 : 1, transition: 'all 0.3s' }}>
          <div style={{
            fontFamily: pp,
            fontSize: isMobile ? '0.88rem' : '0.95rem',
            fontWeight: 800, color: '#fff', lineHeight: 1.35,
          }}>
            {secret.title}
          </div>
        </div>

        {/* Chevron — hidden when locked */}
        {!locked && (
          <div style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? GOLD : 'rgba(255,255,255,0.15)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        )}
      </button>

      {/* Content — collapsible */}
      <div style={{
        maxHeight: isOpen ? '800px' : '0',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease 0.05s',
      }}>
        <div style={{ padding: isMobile ? '0 0 1.25rem' : '0 0 1.5rem', marginLeft: isMobile ? '3.75rem' : '4.5rem' }}>
          {/* Body */}
          <div style={{
            fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.88rem',
            lineHeight: 1.85, color: 'rgba(255,255,255,0.5)', fontWeight: 400,
            marginBottom: '1rem',
          }}>{secret.body}</div>

          {/* Implementation steps */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
          }}>
            <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.1rem' }}>Doe dit</div>
            {secret.steps.map((step, si) => (
              <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                  background: 'rgba(255,186,9,0.08)', border: '1px solid rgba(255,186,9,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 800, color: GOLD }}>{si + 1}</span>
                </div>
                <span style={{ fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* No extra divider needed — border-top handles separation */}
    </div>
  )
}

export default function SecretsPage({ isMobile, bonusSlot, bonusClicked, onBonusOpen }) {
  const [openIndex, setOpenIndex] = useState(null)
  const [unlockedUpTo, setUnlockedUpTo] = useState(0)
  const countdown = useCountdown()
  const secretRefs = useRef([])

  // Close open secret when bonus is clicked, ensure secret 2 is marked read
  useEffect(() => {
    if (bonusClicked) {
      setOpenIndex(null)
      if (unlockedUpTo < 2) setUnlockedUpTo(2)
    }
  }, [bonusClicked])

  // Secrets 3-7 are blocked until bonus is clicked
  const effectiveUnlock = (idx) => {
    if (idx <= 1) return idx <= unlockedUpTo
    // After secret 2, bonus must be clicked first
    if (!bonusClicked) return false
    return idx <= unlockedUpTo
  }

  const effectiveNext = (idx) => {
    if (!bonusClicked && idx >= 2) return false
    return idx === unlockedUpTo && openIndex !== idx
  }

  const toggle = (i) => {
    if (openIndex === i) {
      setOpenIndex(null)
      if (i >= unlockedUpTo) setUnlockedUpTo(i + 1)
    } else {
      setOpenIndex(i)
      setTimeout(() => {
        secretRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }

  const allRead = unlockedUpTo >= 7

  return (
    <>
      {/* Sticky timer */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,186,9,0.08)',
        padding: '0.5rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style={{ fontFamily: pp, fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Beschikbaar tot</span>
        <span style={{ fontFamily: pp, fontSize: '0.7rem', color: GOLD, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
      </div>

      <div style={{ maxWidth: '580px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem 0' : '2.5rem 2rem 0' }}>

        {/* Everything in one gold container */}
        <div style={{
          border: '1.5px solid rgba(255,186,9,0.2)',
          borderRadius: '18px',
          padding: isMobile ? '1.25rem 0.75rem 0.75rem' : '1.5rem 1rem 1rem',
          background: '#000',
        }}>
          {/* Title inside container */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '0.75rem' : '1rem' }}>
            <div className="ss-gold-gloss" style={{
              fontFamily: pp, fontSize: isMobile ? '1.8rem' : '2.2rem',
              fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
              marginBottom: '0.3rem',
              WebkitTextStroke: '0.5px rgba(255,186,9,0.3)',
            }}>7 Secrets</div>
            <h1 style={{
              fontFamily: pp, fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: 900, color: '#fff', lineHeight: 1.3,
              margin: '0 0 0.4rem',
            }}>
              Om Sneller <span className="ss-gold-gloss">Vet Kwijt</span> Te Raken En Er <span className="ss-gold-gloss">Gespierd</span> Uit Te Zien Deze Zomer
            </h1>
            <p style={{
              fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem',
              color: 'rgba(255,255,255,0.25)', fontWeight: 500, margin: 0,
            }}>
              Klik om te lezen · De volgende wordt ontgrendeld
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Secrets 1-2 */}
            {SECRETS.slice(0, 2).map((s, i) => (
              <SecretItem key={i} secret={s} index={i} isOpen={openIndex === i} isUnlocked={effectiveUnlock(i)} isNext={effectiveNext(i)} onToggle={() => toggle(i)} isMobile={isMobile} secretRef={el => secretRefs.current[i] = el} />
            ))}

            {/* Bonus between 2 and 3 — blocking */}
            <div style={{ padding: isMobile ? '0.5rem 0' : '0.6rem 0' }}>
              {bonusSlot}
            </div>

            {/* Secrets 3-7 */}
            {SECRETS.slice(2).map((s, i) => {
              const idx = i + 2
              return <SecretItem key={idx} secret={s} index={idx} isOpen={openIndex === idx} isUnlocked={effectiveUnlock(idx)} isNext={effectiveNext(idx)} onToggle={() => toggle(idx)} isMobile={isMobile} secretRef={el => secretRefs.current[idx] = el} />
            })}
          </div>

          {/* PDF Download — same style as BonusCard, locked until all 7 read */}
          <div style={{ marginTop: isMobile ? '0.5rem' : '0.6rem' }}>
            {allRead ? (
              <a href="/7-summer-shape-secrets-cheatsheet.pdf" download style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: isMobile ? '0.95rem 1rem' : '1rem 1.1rem',
                borderRadius: '14px', textDecoration: 'none', boxSizing: 'border-box',
                background: 'linear-gradient(145deg, #8b6914 0%, #b8860b 30%, #ffba09 50%, #b8860b 70%, #8b6914 100%)',
                boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
                position: 'relative', overflow: 'hidden',
                touchAction: 'manipulation',
                animation: 'ssBonusShake 1.8s ease-in-out 0.3s infinite',
              }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 60%)', backgroundSize: '200% 100%', animation: 'ssShimmer 3s ease-in-out infinite' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Gratis Download</div>
                </div>
                <svg style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: isMobile ? '0.95rem 1rem' : '1rem 1.1rem',
                borderRadius: '14px', boxSizing: 'border-box',
                background: 'linear-gradient(145deg, #8b6914 0%, #b8860b 30%, #ffba09 50%, #b8860b 70%, #8b6914 100%)',
                position: 'relative', overflow: 'hidden',
                opacity: 0.35, filter: 'saturate(0.3)',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff' }}>Gratis Bonus</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
