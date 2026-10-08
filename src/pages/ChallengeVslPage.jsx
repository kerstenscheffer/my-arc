// src/pages/ChallengeVslPage.jsx
//
// VSL-pagina voor de 6 Weken Challenge: video bovenaan, daaronder het
// verhaal (resultaten, herkenning, aanpak, coach, geschiktheid, vragen) en
// overal dezelfde knop naar de kennismaking in Calendly. Geen betaling, geen
// formulier: de kennismaking is de enige actie.
//
// Zelfde huisstijl als /6weekchallenge: puur zwart, DM Sans, witte koppen,
// kleine gouden labels, witte knoppen. Deze pagina scrolt gewoon door (geen
// snap-scroll), want het is leestekst en geen presentatie.

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  Star, ChevronDown, ChevronRight, Utensils, Dumbbell, MessageCircle,
  Check, CalendarCheck, Play,
} from 'lucide-react'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
const BG = '#000000'

// Drie vlakken wisselen elkaar af, zoals op de acquisition.com-pagina: zwart,
// wit en een lichte goudtint. Elke Sectie zet zijn thema; Kop, Tekst en Label
// lezen het mee zodat de kleuren per vlak kloppen.
const THEMAS = {
  zwart: { bg: BG,        tekst: '#fff', tekst85: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.55)', rand: 'rgba(255,255,255,0.1)',  randZacht: 'rgba(255,255,255,0.08)', kaart: 'rgba(255,255,255,0.03)', label: GOLD,      icoon: '#fff' },
  wit:   { bg: '#ffffff', tekst: '#000', tekst85: '#1a1a1a',                dim: 'rgba(0,0,0,0.6)',        rand: 'rgba(0,0,0,0.12)',       randZacht: 'rgba(0,0,0,0.1)',        kaart: 'rgba(0,0,0,0.03)',       label: '#a86f00', icoon: '#000' },
  goud:  { bg: '#f6edd2', tekst: '#000', tekst85: '#1a1a1a',                dim: 'rgba(0,0,0,0.6)',        rand: 'rgba(0,0,0,0.12)',       randZacht: 'rgba(0,0,0,0.1)',        kaart: 'rgba(255,255,255,0.65)', label: '#a86f00', icoon: '#000' },
}
const ThemaCtx = createContext(THEMAS.zwart)
const useThema = () => useContext(ThemaCtx)
// De hero is net iets lichter dan de vaste balk erboven, zodat je de twee
// vlakken van elkaar ziet.
const HERO_BG = '#161616'
const GOUD_KNOP = 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'

const CALENDLY = 'https://calendly.com/kerstenscheffer/strategie-gesprek-kersten-clone'
const VIDEO_ID = '41Hfc2YVBAA'
// Vul in zodra het bedrag vaststaat, bv. '€150'. Leeg = de zin noemt geen
// bedrag.
const BORG_BEDRAG = ''

const CTA_TEKST = 'Start mijn challenge'

const RESULTATEN = [
  { kg: '4,5', weken: 4 },
  { kg: '3,5', weken: 3 },
  { kg: '2,5', weken: 2 },
]

const TRANSFORMATIES = [
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

const REVIEWS = [
  { name: 'Hessel', date: 'dec 2025', text: 'Kersten begreep het meteen! Na een uitgebreide 0-meting kreeg ik een plan op maat. Van 79,8 naar 74,4 in 8 weken. Als jij je aan het plan houdt geeft Kersten altijd de volle 100%!' },
  { name: 'Indi', date: 'dec 2025', text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden. Professioneel, persoonlijk, betrouwbaar. Ik kan Myarc aan iedereen aanraden!' },
  { name: 'Toon', date: 'nov 2025', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'Sassus', date: 'nov 2025', text: 'Na 100 mislukte pogingen is het mij met Kersten gelukt een routine te creëren die ik kan continueren. Hij laat je jezelf verbazen over wat je kan bereiken.' },
]

const HERKENNING = [
  'Je probeert op je voeding te letten. Maar hoeveel je precies moet eten, weet je eigenlijk niet. Overdag gaat het prima, totdat je ’s avonds op de bank zit en alsnog een zak chips opentrekt.',
  'Of je gaat al naar de sportschool. Je doet je oefeningen, maakt je trainingen af en vraagt je na een paar weken af: ga ik hier eigenlijk wel van vooruit?',
  'Misschien weet je best wat je zou moeten doen. Alleen lukt het je steeds een paar weken, waarna een drukke periode je ritme weer onderuit haalt.',
]

const AANPAK = [
  {
    Icon: Utensils,
    kop: 'Voeding die past bij jouw leven',
    alineas: [
      'Je krijgt een persoonlijk voedingsplan in de app, met maaltijd- en gerechtopties die aansluiten op je doel.',
      'We brengen structuur aan op momenten waarop dat makkelijk kan. Bijvoorbeeld bij je ontbijt en lunch op werkdagen. Rond gezinsmaaltijden, etentjes en andere sociale momenten kijken we hoe je flexibiliteit kunt houden.',
      'Zo hoef je niet iedere dag opnieuw uit te zoeken wat je gaat eten en hoe dat binnen je plan past.',
    ],
  },
  {
    Icon: Dumbbell,
    kop: 'Training waarmee je gericht vooruitgaat',
    alineas: [
      'Je krijgt een trainingsschema dat aansluit op je doel en beschikbare tijd, inclusief uitlegvideo’s in de app.',
      'Afhankelijk van jouw situatie kan dat bijvoorbeeld met twee tot drie trainingen van ongeveer 45 minuten per week.',
      'Je houdt bij wat je doet, zodat we kunnen zien of je vooruitgaat en wanneer een aanpassing nodig is.',
    ],
  },
  {
    Icon: MessageCircle,
    kop: 'Persoonlijke begeleiding bij het volhouden',
    alineas: [
      'Een drukke week, honger in de avond of weinig vooruitgang: je kunt bespreken waar je tegenaan loopt.',
      'Via check-ins en WhatsApp kijk ik met je mee. We gebruiken onder andere je gewicht, trainingsprestaties, energie en slaap om te bepalen wat goed gaat en wat aandacht nodig heeft.',
      'Je krijgt een plan én hulp om het in jouw dagelijks leven uit te voeren.',
    ],
  },
]

const GESCHIKT = [
  'Vet wilt verliezen of spieren wilt opbouwen.',
  'Duidelijkheid zoekt over wat je moet eten en hoe je moet trainen.',
  'Moeite hebt om je aanpak consequent vol te houden.',
  'Begeleiding wilt die rekening houdt met je werk, gezin en sociale leven.',
  'Bereid bent te trainen, afspraken na te komen en je voortgang bij te houden.',
]

const BORG_EISEN = [
  'Minimaal twee workouts per week.',
  '75% van je voedingsplan volgen.',
  'Drie calls met mij gedurende het traject.',
  'Drie keer per week je gewicht in de app bijhouden.',
]

const VRAGEN = [
  {
    vraag: 'Hoe werkt de borg?',
    antwoord: [
      `Je legt aan het begin een borg${BORG_BEDRAG ? ` van ${BORG_BEDRAG}` : ''} in. Na zes weken krijg je die terug als je aan de afgesproken deelnamevoorwaarden hebt voldaan.`,
      'De voorwaarden gaan over de acties die je uitvoert. In de video noem ik onder andere:',
      { lijst: BORG_EISEN },
      'Vóór je begint, krijg je duidelijkheid over de volledige voorwaarden en hoe we beoordelen of je eraan hebt voldaan. Wanneer je niet aan de voorwaarden voldoet, kun je de borg verliezen.',
    ],
  },
  {
    vraag: 'Waarom werk je met een borg?',
    antwoord: [
      'Ik wil samenwerken met mannen die serieus aan hun doel willen werken. De borg is bedoeld als stok achter de deur om de afspraken ook uit te voeren.',
      'Mijn doel is dat je de begeleiding ervaart, vooruitgang boekt en je borg terugkrijgt doordat je de afgesproken acties hebt uitgevoerd.',
    ],
  },
  {
    vraag: 'Moet ik na zes weken doorgaan?',
    antwoord: [
      'Nee. Mijn bedoeling is dat je ervaart wat coaching voor je kan betekenen. Als je daarna verder wilt werken aan je langetermijndoel, kunnen we de volgende stappen bespreken.',
      'Je beslist zelf of je daarmee verder wilt.',
    ],
  },
  {
    vraag: 'Past dit bij een drukke baan en een gezin?',
    antwoord: [
      'Daar houden we rekening mee bij het maken van je plan. We kijken naar je beschikbare tijd, je maaltijden en de momenten waarop het meestal lastig wordt.',
      'Je zult wel ruimte moeten maken om te trainen en je afspraken uit te voeren. Tijdens de kennismaking bespreken we of dat nu haalbaar is.',
    ],
  },
  {
    vraag: 'Hoeveel begeleiding krijg ik?',
    antwoord: [
      'Je krijgt toegang tot de app, persoonlijke plannen, check-ins en WhatsApp-support.',
      'We bespreken je voortgang en kijken welke ondersteuning nodig is. Soms vraagt dat om een gesprek; wanneer alles goed loopt, kan contact via WhatsApp voldoende zijn. Vooraf leggen we de contactafspraken en verplichte calls vast.',
    ],
  },
  {
    vraag: 'Welk resultaat kan ik verwachten?',
    antwoord: [
      'Dat hangt onder andere af van je startpunt, doel en hoe je het plan uitvoert.',
      'Bij vetverlies volgen we onder andere je gewicht. Bij spieropbouw kijken we naar je trainingsprestaties en foto’s. Tijdens de kennismaking bespreken we waar jij je de komende zes weken op gaat richten.',
    ],
  },
]

// ── Bouwstenen ──────────────────────────────────────────────────────────────

function Label({ children, m, center }) {
  const t = useThema()
  return (
    <div style={{
      fontSize: m ? '0.62rem' : '0.7rem', fontWeight: 800,
      letterSpacing: '0.15em', color: t.label, textTransform: 'uppercase',
      marginBottom: m ? '0.7rem' : '0.9rem',
      textAlign: center ? 'center' : 'left',
    }}>{children}</div>
  )
}

function Kop({ children, m, center, groot }) {
  const t = useThema()
  return (
    <h2 style={{
      margin: 0,
      fontSize: groot ? (m ? '1.75rem' : '2.9rem') : (m ? '1.5rem' : '2.1rem'),
      fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: t.tekst,
      textTransform: 'uppercase',
      textAlign: center ? 'center' : 'left',
    }}>{children}</h2>
  )
}

function Tekst({ children, m, center, dim, style }) {
  const t = useThema()
  return (
    <p style={{
      margin: 0,
      fontSize: m ? '0.98rem' : '1.08rem', fontWeight: 600, lineHeight: 1.55,
      color: dim ? t.dim : t.tekst85,
      letterSpacing: '-0.01em', textAlign: center ? 'center' : 'left',
      ...style,
    }}>{children}</p>
  )
}

// De knop: wit vlak, zwarte tekst, zoals op de challenge-pagina.
function Cta({ m, sub, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      <a
        href={CALENDLY}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          minHeight: m ? 68 : 76, padding: m ? '0 1.8rem' : '0 2.6rem',
          width: m ? '100%' : 'auto', minWidth: m ? 0 : 380,
          borderRadius: 14, background: GOUD_KNOP, color: '#000',
          fontSize: m ? '1.18rem' : '1.3rem', fontWeight: 900, letterSpacing: '0.02em',
          textTransform: 'uppercase', textDecoration: 'none', boxSizing: 'border-box',
          boxShadow: '0 10px 30px rgba(212,175,55,0.35), 0 4px 12px rgba(0,0,0,0.25)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CalendarCheck size={24} strokeWidth={2.6} /> {CTA_TEKST}
      </a>
      {sub && (
        <div style={{ fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Sectie({ children, m, smal, lijn = true, thema = 'zwart', style }) {
  const t = THEMAS[thema] || THEMAS.zwart
  return (
    <ThemaCtx.Provider value={t}>
      <section style={{
        padding: m ? '4rem 1.25rem' : '6.5rem 3rem',
        background: t.bg, color: t.tekst,
        borderTop: lijn ? `1px solid ${t.randZacht}` : 'none',
        ...style,
      }}>
        <div style={{ maxWidth: smal ? 720 : 1000, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </section>
    </ThemaCtx.Provider>
  )
}

function TrustpilotBadge({ style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
      </svg>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>4.8</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(s => (
          <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  )
}

// De video: eerst een stilstaand beeld met een afspeelknop, pas bij een tik
// de echte speler. Zo laadt de pagina snel en begint er niets vanzelf.
function Video({ m }) {
  const [speelt, setSpeelt] = useState(false)
  const src = appSafeEmbedUrl(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`)
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16 / 9',
      borderRadius: m ? 14 : 18, overflow: 'hidden', background: '#111',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    }}>
      {speelt ? (
        <iframe
          src={src}
          title="Hoe de 6 Weken Challenge werkt"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <button
          onClick={() => setSpeelt(true)}
          aria-label="Video afspelen"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            padding: 0, border: 'none', cursor: 'pointer',
            backgroundImage: `url(https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          <div style={{
            position: 'relative', width: m ? 68 : 84, height: m ? 68 : 84, borderRadius: '50%',
            background: GOUD_KNOP, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.35)',
          }}>
            <Play size={m ? 28 : 34} fill="#000" color="#000" style={{ marginLeft: 4 }} />
          </div>
        </button>
      )}
    </div>
  )
}

function Vraag({ item, open, onToggle, m }) {
  const t = useThema()
  return (
    <div style={{ borderBottom: `1px solid ${t.randZacht}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: m ? '1rem 0' : '1.2rem 0', background: 'transparent', border: 'none',
          color: t.tekst, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: m ? '1.02rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {item.vraag}
        <ChevronDown size={20} strokeWidth={2.6} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
      </button>
      {open && (
        <div style={{ paddingBottom: m ? '1.1rem' : '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {item.antwoord.map((a, i) => a.lijst ? (
            <ul key={i} style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {a.lijst.map(r => (
                <li key={r} style={{ fontSize: m ? '0.95rem' : '1.02rem', fontWeight: 700, color: t.tekst, lineHeight: 1.5 }}>{r}</li>
              ))}
            </ul>
          ) : (
            <Tekst key={i} m={m}>{a}</Tekst>
          ))}
        </div>
      )}
    </div>
  )
}

// ── De pagina ───────────────────────────────────────────────────────────────

export default function ChallengeVslPage() {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [openVraag, setOpenVraag] = useState(0)
  // De zwevende knop komt pas als de knop bovenaan uit beeld is.
  const [zwevend, setZwevend] = useState(false)
  const heroCtaRef = useRef(null)
  const reviewsRef = useRef(null)

  useEffect(() => {
    const check = () => setM(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const el = heroCtaRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setZwevend(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Reviews schuiven vanzelf door, zoals op de challenge-pagina.
  useEffect(() => {
    const el = reviewsRef.current
    if (!el) return
    let animId, pos = 0
    const scroll = () => {
      pos += 0.4
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(scroll)
    }
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }
    animId = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true }); el.addEventListener('touchend', resume)
    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause); el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause); el.removeEventListener('touchend', resume)
    }
  }, [])

  const reviewsDubbel = [...REVIEWS, ...REVIEWS]

  return (
    <div style={{
      background: BG, color: '#fff', minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>

      {/* ══ 1. Bovenaan: label, korte kop, video, één alinea, knop ══
          Alles op het eerste scherm van een telefoon. De lange uitleg staat
          onder de video, niet erboven: de video is waar je voor komt. */}
      {/* Vaste balk bovenaan met het label als witte pil, rood bolletje ervoor. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: BG, borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: `calc(env(safe-area-inset-top, 0px) + ${m ? '0.6rem' : '0.75rem'}) 1rem ${m ? '0.6rem' : '0.75rem'}`,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: m ? '0.45rem 0.85rem' : '0.5rem 1.1rem', borderRadius: 6,
          background: '#fff', color: '#000',
          fontSize: m ? '0.66rem' : '0.74rem', fontWeight: 900, letterSpacing: '0.08em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          Gratis 6 Weken Challenge | Voor drukke mannen
        </span>
      </div>

      {/* Zwart tot halverwege de video, daaronder wit: de overgang loopt dwars
          door het beeld en trekt je oog naar de video en de knop eronder. */}
      <section style={{ background: HERO_BG, padding: `${m ? '5.4rem' : '7.5rem'} ${m ? '1.25rem' : '3rem'} 0` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Kop m={m} center groot>Strakker en sterker met een aanpak die werkt naast je baan, gezin en sociale leven.</Kop>
          <Tekst m={m} center style={{ marginTop: m ? '1.3rem' : '1.7rem', fontSize: m ? '1.08rem' : '1.22rem', color: '#fff' }}>
            Bekijk de video en ontdek hoe de challenge werkt, wat je krijgt en welke inzet we van je verwachten.
          </Tekst>
        </div>
      </section>
      {/* De video zelf staat op een vlak dat boven zwart en onder wit is;
          het vlak is precies zo hoog als de video, dus de grens ligt op de
          helft. */}
      <div style={{
        background: `linear-gradient(180deg, ${HERO_BG} 0%, ${HERO_BG} 50%, #fff 50%, #fff 100%)`,
        padding: `${m ? '2.2rem' : '3rem'} ${m ? '1.25rem' : '3rem'} 0`,
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Video m={m} />
        </div>
      </div>
      <section style={{ background: '#fff', color: '#000', padding: `${m ? '2rem' : '2.8rem'} ${m ? '1.25rem' : '3rem'} ${m ? '3.2rem' : '4.5rem'}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div ref={heroCtaRef}>
            <Cta m={m} />
          </div>
          <Tekst m={m} center style={{ marginTop: m ? '1.8rem' : '2.4rem', color: '#111', fontWeight: 700 }}>
            Persoonlijke voeding, gerichte trainingen en coaching, met ruimte voor een biertje en lekker eten. Zonder iedere dag in de sportschool te staan.
          </Tekst>
        </div>
      </section>

      {/* ══ 2. Resultaten ══ */}
      <Sectie m={m} lijn={false} thema="goud">
        <Kop m={m} center>Deze mannen zetten de eerste stap al.</Kop>
        <Tekst m={m} center dim style={{ marginTop: '0.9rem' }}>In de video laat ik de voortgang van drie deelnemers zien:</Tekst>

        <div style={{
          display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)',
          gap: m ? '0.6rem' : '1rem', marginTop: m ? '1.4rem' : '2rem',
        }}>
          {RESULTATEN.map(r => (
            <div key={r.kg} style={{
              padding: m ? '1rem 1.1rem' : '1.4rem 1.2rem', borderRadius: 14,
              border: `1px solid ${THEMAS.goud.rand}`, background: THEMAS.goud.kaart,
              display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: m ? '2rem' : '2.6rem', fontWeight: 900, letterSpacing: '-0.04em', color: THEMAS.goud.tekst, lineHeight: 1 }}>{r.kg}</span>
              <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 800, color: THEMAS.goud.dim }}>kilo lichter in {r.weken} weken</span>
            </div>
          ))}
        </div>

        <Tekst m={m} center style={{ marginTop: m ? '1.4rem' : '1.8rem' }}>
          Mannen die volgens hun eigen plan werken aan hun doel, terwijl er ook ruimte blijft voor hun sociale leven.
        </Tekst>

        {/* De transformaties van Kersten en Nitish, zoals op de andere pagina's. */}
        <div style={{
          display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(2, 1fr)',
          gap: m ? '0.8rem' : '1.2rem', marginTop: m ? '1.6rem' : '2.4rem',
        }}>
          {TRANSFORMATIES.map(t => (
            <div key={t.src} style={{
              padding: m ? '0.6rem' : '0.8rem', borderRadius: 14,
              border: `1px solid ${THEMAS.goud.rand}`, background: THEMAS.goud.kaart,
            }}>
              <div style={{ borderRadius: 10, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                <img src={t.src} alt={t.caption} draggable={false}
                  onError={(e) => { e.currentTarget.style.opacity = 0 }}
                  style={{ maxWidth: '100%', width: 'auto', height: 'auto', display: 'block' }} />
              </div>
              <p style={{ margin: '0.6rem 0 0.2rem', fontSize: m ? '0.8rem' : '0.86rem', fontWeight: 800, color: THEMAS.goud.dim, textAlign: 'center' }}>
                {t.caption}
              </p>
            </div>
          ))}
        </div>

        <Tekst m={m} center dim style={{ marginTop: m ? '1.2rem' : '1.6rem', fontSize: m ? '0.82rem' : '0.88rem' }}>
          Dit zijn individuele veranderingen in lichaamsgewicht, geen belofte voor jouw resultaat. Tijdens de kennismaking bespreken we je startpunt en wat voor jou een passende doelstelling is.
        </Tekst>
        <Cta m={m} style={{ marginTop: m ? '2.2rem' : '3rem' }} />
      </Sectie>

      {/* ══ 3. Herkenning ══ */}
      <Sectie m={m} smal>
        <Label m={m}>Herkenning</Label>
        <Kop m={m}>Je weet dat er iets moet veranderen. Maar hoe krijg je het passend in je week?</Kop>
        <Tekst m={m} dim style={{ marginTop: '0.9rem' }}>Misschien herken je dit.</Tekst>
        <div style={{ display: 'flex', flexDirection: 'column', gap: m ? '0.7rem' : '0.9rem', marginTop: m ? '1.3rem' : '1.8rem' }}>
          {HERKENNING.map((t, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.9rem', alignItems: 'flex-start',
              padding: m ? '1rem 1.1rem' : '1.2rem 1.4rem', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ flexShrink: 0, fontSize: m ? '1rem' : '1.1rem', fontWeight: 900, color: GOLD, lineHeight: 1.5 }}>{i + 1}.</span>
              <Tekst m={m}>{t}</Tekst>
            </div>
          ))}
        </div>
        <p style={{ margin: `${m ? '1.5rem' : '2rem'} 0 0`, fontSize: m ? '1.15rem' : '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: '#fff' }}>
          Dan moet je plan ook werken op de dagen waarop je weinig tijd en energie hebt.
        </p>
        <Tekst m={m} style={{ marginTop: '0.9rem' }}>
          Daar kijken we samen naar. Wat past bij jouw doel? Wat kun je daadwerkelijk uitvoeren? En wat moet er veranderen om dat vol te houden?
        </Tekst>
      </Sectie>

      {/* ══ 4. De aanpak ══ */}
      <Sectie m={m} thema="wit">
        <Label m={m} center>De aanpak</Label>
        <Kop m={m} center>Je weet wat je gaat eten, hoe je gaat trainen en wie er met je meekijkt.</Kop>
        <Tekst m={m} center dim style={{ marginTop: '0.9rem' }}>Tijdens de 6 Weken Challenge werken we aan drie onderdelen.</Tekst>
        <div style={{
          display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)',
          gap: m ? '0.8rem' : '1.2rem', marginTop: m ? '1.5rem' : '2.4rem',
        }}>
          {AANPAK.map((a, i) => (
            <div key={a.kop} style={{
              padding: m ? '1.2rem 1.1rem' : '1.6rem 1.4rem', borderRadius: 16,
              border: `1px solid ${THEMAS.wit.rand}`, background: THEMAS.wit.kaart,
              display: 'flex', flexDirection: 'column', gap: '0.8rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <a.Icon size={m ? 28 : 32} strokeWidth={2.6} color={THEMAS.wit.icoon} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: THEMAS.wit.label }}>{i + 1} VAN 3</span>
              </div>
              <h3 style={{ margin: 0, fontSize: m ? '1.2rem' : '1.3rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, color: THEMAS.wit.tekst }}>{a.kop}</h3>
              {a.alineas.map((t, n) => (
                <Tekst key={n} m={m} style={{ fontSize: m ? '0.92rem' : '0.98rem' }}>{t}</Tekst>
              ))}
            </div>
          ))}
        </div>
        <Cta m={m} style={{ marginTop: m ? '2.4rem' : '3.2rem' }} />
      </Sectie>

      {/* ══ 5. De coach ══ */}
      <Sectie m={m}>
        <div style={{
          display: 'grid', gridTemplateColumns: m ? '1fr' : '1.15fr 0.85fr',
          gap: m ? '1.4rem' : '3rem', alignItems: 'center',
        }}>
          <div>
            <Label m={m}>De coach</Label>
            <Kop m={m}>Ik ben Kersten. En ik kijk verder dan je voedings- en trainingsschema.</Kop>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: m ? '1.1rem' : '1.4rem' }}>
              <Tekst m={m}>Als ondernemer heb ik zelf ook niet altijd tijd om lang in de sportschool te staan. Ik begrijp dus dat je resultaat wilt boeken met de tijd die je beschikbaar hebt.</Tekst>
              <Tekst m={m}>In mijn coaching kijk ik daarom naar jouw hele situatie. Wat wil je bereiken? Hoe ziet je week eruit? En op welke momenten wordt het lastig?</Tekst>
              <Tekst m={m}>Ik begeleid al tientallen mannen en help ze om concrete oplossingen te vinden voor de dingen waar ze op vastlopen.</Tekst>
              <Tekst m={m}>Met deze challenge wil ik je laten ervaren hoe die begeleiding werkt. Zodat je ontdekt wat bij jou past en hoe je gericht aan je lichaam kunt werken.</Tekst>
              <p style={{ margin: '0.4rem 0 0', fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.35, color: '#fff' }}>
                Van jou vraag ik eerlijkheid en inzet. Van mij krijg je een persoonlijk plan, aandacht voor je voortgang en begeleiding bij het bijsturen.
              </p>
            </div>
          </div>
          <div style={{
            borderRadius: 18, overflow: 'hidden', aspectRatio: m ? '4 / 3' : '4 / 5',
            backgroundImage: 'url(/waarom-kersten.jpg)', backgroundSize: 'cover', backgroundPosition: 'center top',
            border: '1px solid rgba(255,255,255,0.1)', order: m ? -1 : 0,
          }} />
        </div>
      </Sectie>

      {/* ══ 6. Geschiktheid ══ */}
      <Sectie m={m} smal thema="goud">
        <Label m={m}>Geschiktheid</Label>
        <Kop m={m}>Past de 6 Weken Challenge bij jou?</Kop>
        <Tekst m={m} dim style={{ marginTop: '0.9rem' }}>Deze challenge sluit aan als je:</Tekst>
        <div style={{ marginTop: m ? '1.1rem' : '1.4rem' }}>
          {GESCHIKT.map((t, i) => (
            <div key={t} style={{
              display: 'flex', gap: '0.8rem', alignItems: 'center',
              padding: m ? '0.8rem 0' : '1rem 0',
              borderTop: i === 0 ? `1px solid ${THEMAS.goud.randZacht}` : 'none',
              borderBottom: `1px solid ${THEMAS.goud.randZacht}`,
            }}>
              <Check size={m ? 22 : 26} strokeWidth={3} color={THEMAS.goud.icoon} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: m ? '1.02rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: THEMAS.goud.tekst }}>{t}</span>
            </div>
          ))}
        </div>
        <Tekst m={m} style={{ marginTop: m ? '1.2rem' : '1.5rem' }}>
          Je hoeft vooraf niet alles te weten of al een perfect ritme te hebben. Wel moet je bereid zijn om aan de slag te gaan en open te bespreken wat je lastig vindt.
        </Tekst>
      </Sectie>

      {/* ══ 7. Vragen ══ */}
      <Sectie m={m} smal thema="wit">
        <Label m={m}>Veelgestelde vragen</Label>
        <Kop m={m}>Dit wil je waarschijnlijk nog weten.</Kop>
        <div style={{ marginTop: m ? '1.2rem' : '1.6rem', borderTop: `1px solid ${THEMAS.wit.randZacht}` }}>
          {VRAGEN.map((v, i) => (
            <Vraag key={v.vraag} item={v} m={m} open={openVraag === i} onToggle={() => setOpenVraag(openVraag === i ? -1 : i)} />
          ))}
        </div>
      </Sectie>

      {/* ══ Slot: reviews en de laatste knop ══ */}
      <Sectie m={m} style={{ paddingBottom: m ? '7rem' : '8rem' }}>
        <Kop m={m} center>Plan je kennismaking.</Kop>
        <Tekst m={m} center dim style={{ marginTop: '0.9rem' }}>
          Een gesprek van een half uur. We bespreken je doel, waar je nu vastloopt en of de challenge bij je past.
        </Tekst>
        <Cta m={m} style={{ marginTop: m ? '2rem' : '2.6rem' }} />

        <TrustpilotBadge style={{ margin: `${m ? '2rem' : '2.8rem'} 0 1rem` }} />
        <div
          ref={reviewsRef}
          style={{
            display: 'flex', gap: m ? '0.75rem' : '1rem', overflow: 'hidden', cursor: 'grab',
            marginLeft: m ? '-1.25rem' : '-3rem', marginRight: m ? '-1.25rem' : '-3rem',
            paddingLeft: m ? '1.25rem' : '3rem', paddingRight: m ? '1.25rem' : '3rem',
          }}
        >
          {reviewsDubbel.map((r, idx) => (
            <div key={idx} style={{
              minWidth: m ? 240 : 300, maxWidth: m ? 240 : 300, flexShrink: 0,
              padding: m ? '0.85rem 1rem' : '1rem 1.15rem', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: '0.5rem' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={TP_GREEN} color={TP_GREEN} strokeWidth={0} />)}
              </div>
              <p style={{
                fontSize: m ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500,
                lineHeight: 1.5, marginBottom: '0.6rem', marginTop: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{r.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', border: `1px solid ${TP_GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: TP_GREEN }}>{r.name.charAt(0)}</div>
                  <span style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{r.name}</span>
                </div>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: m ? '2.5rem' : '3rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
        </div>
      </Sectie>

      {/* Zwevende knop zodra de knop bovenaan uit beeld is. */}
      <a
        href={CALENDLY} target="_blank" rel="noopener noreferrer"
        style={{
          position: 'fixed', left: '50%',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${m ? '1.1rem' : '1.5rem'})`,
          transform: 'translateX(-50%)', zIndex: 90,
          opacity: zwevend ? 1 : 0, pointerEvents: zwevend ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: m ? '0.85rem 1.6rem' : '0.95rem 2rem', borderRadius: 999,
          background: GOUD_KNOP, color: '#000', textDecoration: 'none',
          fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.02em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 24px rgba(255,215,0,0.25)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {CTA_TEKST} <ChevronRight size={16} strokeWidth={3} />
      </a>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        body { background: #000; margin: 0; }
      `}</style>
    </div>
  )
}
