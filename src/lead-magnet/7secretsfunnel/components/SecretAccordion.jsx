// src/lead-magnet/7secretsfunnel/components/SecretAccordion.jsx
import { useState } from 'react'
import { GOLD } from './shared'

const pp = "'Poppins', sans-serif"

const G = ({children}) => <span className="ss-gold" style={{ fontSize:'105%' }}>{children}</span>
const B = ({children}) => <span style={{ color:'#fff', fontWeight:700, fontSize:'105%' }}>{children}</span>

const SECRETS = [
  {
    icon: '🔥',
    title: <>Verhoog je <G>NEAT</G> voor meer eten en sneller vetverlies</>,
    body: <>De mannen die moeiteloos droog de zomer ingaan hebben één ding gemeen: <B>ze bewegen meer buiten de gym.</B><br/><br/>Lopen. Staan. Traplopen. Dit heet NEAT en het verbrandt tot <G>30% van je dagelijkse calorieën.</G><br/><br/>Hoe hoger je NEAT, hoe meer je kunt eten en alsnog vet verliezen. Het mooie? <B>Het kost geen extra willskracht</B> — alleen kleine aanpassingen.</>,
    tip: <>Bij mijn klanten is dit altijd een van de eerste dingen die ik aanpas. <B>Tussen je setjes rondlopen, af en toe wandelen, niet de hele avond op de bank.</B> Kleine veranderingen, groot verschil.</>,
  },
  {
    icon: '🌙',
    title: <>Waarom dat laatste laagje <G>buikvet</G> niet weg wil</>,
    body: <>Je doet alles goed maar dat laagje rond je buik blijft zitten.<br/><br/>Een van de meest voorkomende oorzaken? <G>Chronisch hoog cortisol</G> door te weinig slaap en te veel stress.<br/><br/>Je lichaam geeft dan het signaal om <B>vet vast te houden — juist rond je buik.</B></>,
    tip: <>Wat mij enorm helpt is 's avonds mijn volgende dag voorbereiden. Daarnaast: <B>koude kamer, warme douche, telefoon weg.</B> Simpele dingen die ervoor zorgen dat je lichaam 's nachts écht herstelt.</>,
  },
  {
    icon: '💧',
    title: <>Meer <G>spierdefinitie</G> door een simpele dagelijkse gewoonte</>,
    body: <>Je hebt misschien al meer spieren dan je denkt — <B>ze zijn alleen niet zichtbaar.</B><br/><br/>Door te weinig water te drinken houdt je lichaam vocht vast onder je huid. Dat maakt je <B>zachter en platter</B> dan je eigenlijk bent.<br/><br/>Mannen die er altijd droog uitzien drinken vaak <G>3+ liter per dag.</G></>,
    tip: <>Bijna elke klant die bij mij start drinkt te weinig. Zodra ze naar <B>3+ liter</B> gaan zien ze binnen dagen verschil. Gewoon <B>zichtbaar maken wat er al zit.</B></>,
  },
  {
    icon: '💪',
    title: <>De ene set die <G>80%</G> van je groei bepaalt</>,
    body: <>De meeste mannen bouwen hun sets op: licht beginnen, steeds zwaarder.<br/><br/>Maar tegen de tijd dat ze bij hun zwaarste set komen is <B>hun energie al op.</B><br/><br/>Het geheim? Na een goede warm-up <G>direct de zwaarste set</G> — wanneer kracht en focus op het hoogst zijn.</>,
    tip: <>Dit is een van de dingen die ik bij elke klant direct verander. <B>Goede warm-up, dan vol gas.</B> Ze tillen zwaarder, groeien sneller, en zijn eerder klaar.</>,
  },
  {
    icon: '🍽️',
    title: <>Dezelfde carbs, ander moment — een <G>droger</G> lichaam</>,
    body: <>Je hoeft <B>niet minder te eten</B> om er droger uit te zien. Het gaat om <G>wanneer</G> je eet.<br/><br/>Plan 50-60% van je koolhydraten rond je training. Het resultaat: <B>meer energie, sneller herstel</B>, en een lichaam dat koolhydraten <G>gebruikt in plaats van opslaat.</G></>,
    tip: <>Mijn klanten eten niet minder, alleen <B>slimmer.</B> Grotere maaltijd 3 uur voor training, snelle carbs 1 uur ervoor. Meer energie, droger lichaam.</>,
  },
  {
    icon: '☀️',
    title: <>Extra <G>vet verliezen</G> zonder harder te diëten</>,
    body: <>'s Ochtends zijn je glycogeenvoorraden laag. Je lichaam schakelt sneller over op <G>vetverbranding.</G><br/><br/>Een wandeling of fietsen naar werk verbrandt <B>meer vet dan diezelfde beweging na de lunch.</B><br/><br/>Je hoeft niet minder te eten. Je benut alleen het juiste moment.</>,
    tip: <>Bij veel klanten stel ik het ontbijt iets uit. <B>Niet als straf</B>, maar omdat het hun ochtend verandert in een vetverbrandingsmoment. Resultaat: <B>plattere buik, nul extra moeite.</B></>,
  },
  {
    icon: '⚡',
    title: <><G>Testosteron</G> verhogen — gratis en effectiever dan supplementen</>,
    body: <><G>95% van je testosteron</G> wordt aangemaakt tijdens diepe slaap.<br/><br/>Zonlicht stimuleert vitamine D, direct gelinkt aan <B>hogere testosteron.</B> Gezonde vetten leveren wat je lichaam nodig heeft.<br/><br/>Drie <G>gratis dingen</G> die effectiever zijn dan welk supplement dan ook.</>,
    tip: <>Het eerste wat ik bij elke klant check is <B>slaap.</B> Als dat niet op orde is, werkt de rest half zo goed. <B>Goeie slaap, voldoende zon, gezonde vetten</B> — en je lichaam doet de rest.</>,
  },
]

function SecretItem({ secret, index, isOpen, isUnlocked, isNext, onToggle, isMobile }) {
  const locked = !isUnlocked

  return (
    <div style={{
      position: 'relative',
      background: isOpen ? 'rgba(255,186,9,0.03)' : 'rgba(255,255,255,0.015)',
      border: isOpen ? '1px solid rgba(255,186,9,0.12)' : locked ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      transition: 'all 0.3s ease',
      filter: locked ? 'blur(3px)' : 'none',
      opacity: locked ? 0.4 : 1,
      pointerEvents: locked ? 'none' : 'auto',
      userSelect: locked ? 'none' : 'auto',
    }}>
      {/* Lock overlay for locked items */}
      {locked && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '16px', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      )}

      {/* Header — clickable */}
      <button onClick={onToggle} disabled={locked} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? '0.7rem' : '0.85rem',
        padding: isMobile ? '1rem 1rem' : '1.1rem 1.25rem',
        background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        textAlign: 'left', position: 'relative', zIndex: 1,
      }}>
        {/* Number — premium gold */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: isOpen ? 'rgba(255,186,9,0.12)' : 'rgba(255,255,255,0.04)',
          border: isOpen ? '1.5px solid rgba(255,186,9,0.25)' : '1.5px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}>
          <span className={isOpen ? 'ss-gold-gloss' : ''} style={{ fontFamily: pp, fontSize: '1.1rem', fontWeight: 900, color: isOpen ? undefined : 'rgba(255,255,255,0.2)', lineHeight: 1, transition: 'color 0.3s' }}>{index + 1}</span>
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: pp, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
            {secret.title}
          </div>
        </div>

        {/* Chevron / checkmark */}
        <div style={{
          width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%',
          background: isOpen ? 'rgba(255,186,9,0.1)' : 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'all 0.3s ease',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isOpen ? GOLD : 'rgba(255,255,255,0.2)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>

      {/* Content — collapsible */}
      <div style={{
        maxHeight: isOpen ? '800px' : '0',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease 0.05s',
      }}>
        <div style={{ padding: isMobile ? '0.15rem 1rem 1.25rem' : '0.15rem 1.25rem 1.5rem', marginLeft: isMobile ? '3.6rem' : '4rem' }}>
          {/* Body */}
          <div style={{
            fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.88rem',
            lineHeight: 1.85, color: 'rgba(255,255,255,0.5)', fontWeight: 400,
            marginBottom: '1rem',
          }}>{secret.body}</div>

          {/* Tip */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            background: 'rgba(255,186,9,0.04)', border: '1px solid rgba(255,186,9,0.08)',
            borderRadius: '12px', padding: isMobile ? '0.7rem' : '0.8rem',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden',
              flexShrink: 0, border: '1.5px solid rgba(255,186,9,0.2)',
            }}>
              <img src="/coach-modal.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontFamily: pp, fontSize: '0.42rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tip van Kersten</span>
              </div>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.6, fontWeight: 400 }}>{secret.tip}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SecretAccordion({ isMobile, bonusSlot }) {
  const [openIndex, setOpenIndex] = useState(null)
  const [unlockedUpTo, setUnlockedUpTo] = useState(0) // 0 = only first is unlocked

  const toggle = (i) => {
    if (openIndex === i) {
      // Closing — unlock the next one
      setOpenIndex(null)
      if (i >= unlockedUpTo) {
        setUnlockedUpTo(i + 1)
      }
    } else {
      setOpenIndex(i)
    }
  }

  // Insert bonus after secret 2 (index 1)
  const firstGroup = SECRETS.slice(0, 2)
  const secondGroup = SECRETS.slice(2)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: isMobile ? '2rem 1rem' : '3rem 2rem' }}>
      {/* Section header */}
      <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem', textAlign: 'center' }}>
        <div style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,186,9,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.3rem' }}>De 7 secrets</div>
        <div style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Klik op een secret om te lezen · De volgende wordt ontgrendeld</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.6rem' }}>
        {firstGroup.map((s, i) => (
          <SecretItem
            key={i}
            secret={s}
            index={i}
            isOpen={openIndex === i}
            isUnlocked={i <= unlockedUpTo}
            isNext={i === unlockedUpTo}
            onToggle={() => toggle(i)}
            isMobile={isMobile}
          />
        ))}

        {/* BONUS — between secret 2 and 3 */}
        {bonusSlot}

        {secondGroup.map((s, i) => {
          const realIndex = i + 2
          return (
            <SecretItem
              key={realIndex}
              secret={s}
              index={realIndex}
              isOpen={openIndex === realIndex}
              isUnlocked={realIndex <= unlockedUpTo}
              isNext={realIndex === unlockedUpTo}
              onToggle={() => toggle(realIndex)}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}
