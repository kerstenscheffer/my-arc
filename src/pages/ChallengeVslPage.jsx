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
  Star, ChevronDown, ChevronLeft, ChevronRight, Utensils, Dumbbell, MessageCircle,
  Check, CalendarCheck, Play, Pause, Volume2, VolumeX, X,
} from 'lucide-react'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'
import { PrequalFlow } from './ChallengePrequalPage'
import { meet, pixel, volgTijdOpPagina } from './challengeTracking'

const GOLD = '#FFD700'
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
// Elke knop opent het kalenderblad; de functie komt via context zodat de
// knoppen diep in de secties er niet aan hoeven te worden doorgegeven.
const OpenKalenderCtx = createContext(() => {})
const useThema = () => useContext(ThemaCtx)
// De hero is net iets lichter dan de vaste balk erboven, zodat je de twee
// vlakken van elkaar ziet.
const HERO_BG = '#161616'
const GOUD_KNOP = 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'

const CALENDLY = 'https://calendly.com/kerstenscheffer/strategie-gesprek-kersten-clone'
const VIDEO_ID = '41Hfc2YVBAA'

const CTA_TEKST = 'Start mijn challenge'

const HERO_PUNTEN = ['Persoonlijk voedingsplan', 'Persoonlijk trainingsplan', '1-op-1 begeleiding', 'Stok achter de deur', 'Alles in 1 app']

const TRANSFORMATIES = [
  { src: '/review-transformatie-1.png', naam: 'Kersten', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/transformatie-nitish.jpg', naam: 'Nitish', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
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


const VRAGEN = [
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

// De knop in MY ARC-stijl (21 okt 2026, eerst goud): op een donker vlak wit
// met zwarte tekst, op een licht vlak zwart met witte tekst. `licht` voor
// een vlak zonder eigen Sectie-thema (de witte strook onder de video).
function Cta({ m, sub, style, licht }) {
  const openKalender = useContext(OpenKalenderCtx)
  const t = useThema()
  const opLicht = licht ?? t.tekst === '#000'
  const vlak = opLicht ? '#000' : '#fff'
  const letter = opLicht ? '#fff' : '#000'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      <button
        onClick={openKalender}
        style={{
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          minHeight: m ? 68 : 76, padding: m ? '0 1rem' : '0 2.6rem',
          width: m ? '100%' : 'auto', minWidth: m ? 0 : 380,
          borderRadius: 14, background: vlak, color: letter,
          // Eén regel op de telefoon: kleiner lettertype en nooit afbreken.
          // Dikker dan 900 bestaat niet in het lettertype; een dunne zwarte
          // contour maakt de letters zwaarder.
          fontSize: m ? '1.12rem' : '1.45rem', fontWeight: 900, letterSpacing: '0.03em',
          whiteSpace: 'nowrap', WebkitTextStroke: `${m ? '0.5px' : '0.7px'} ${letter}`,
          textTransform: 'uppercase', textDecoration: 'none', boxSizing: 'border-box',
          boxShadow: 'none',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CalendarCheck size={m ? 22 : 26} strokeWidth={3} style={{ flexShrink: 0 }} /> {CTA_TEKST}
      </button>
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

function TrustpilotBadge({ style, licht }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
      </svg>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: licht ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: licht ? '#000' : '#fff' }}>4.8</span>
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

// Reviews als slider op een licht vlak: één kaart tegelijk in beeld (op de
// telefoon met een stukje van de volgende), vegen of pijltjes, bolletjes
// eronder. Dezelfde reviews als onderaan de pagina (21 okt 2026).
function ReviewSlider({ m }) {
  const baan = useRef(null)
  const [actief, setActief] = useState(0)
  const opScroll = () => {
    const el = baan.current
    if (!el) return
    const kaart = el.firstElementChild
    const stap = kaart ? kaart.getBoundingClientRect().width + 12 : el.clientWidth
    setActief(Math.max(0, Math.min(REVIEWS.length - 1, Math.round(el.scrollLeft / stap))))
  }
  const naar = (i) => {
    const el = baan.current
    const kaart = el?.children[i]
    if (el && kaart) el.scrollTo({ left: kaart.offsetLeft - el.firstElementChild.offsetLeft, behavior: 'smooth' })
  }
  const pijl = (links) => ({
    position: 'absolute', top: '50%', [links ? 'left' : 'right']: -18, transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
    color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  return (
    <div style={{ marginTop: m ? '1.4rem' : '2rem' }}>
      <TrustpilotBadge licht style={{ marginBottom: m ? '1rem' : '1.3rem' }} />
      <div style={{ position: 'relative' }}>
        <div
          ref={baan} onScroll={opScroll}
          style={{
            display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
            marginLeft: m ? '-1.25rem' : 0, marginRight: m ? '-1.25rem' : 0,
            paddingLeft: m ? '1.25rem' : 0, paddingRight: m ? '1.25rem' : 0,
            scrollPaddingLeft: m ? '1.25rem' : 0,
          }}
        >
          {REVIEWS.map(r => (
            <div key={r.name} style={{
              flex: `0 0 ${m ? '86%' : '100%'}`, scrollSnapAlign: 'start', boxSizing: 'border-box',
              padding: m ? '1.2rem 1.2rem 1.1rem' : '1.6rem 1.7rem 1.4rem', borderRadius: 16,
              background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex', flexDirection: 'column', gap: '0.8rem',
            }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} style={{ width: m ? 22 : 24, height: m ? 22 : 24, background: TP_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={m ? 14 : 15} fill="#fff" color="#fff" strokeWidth={0} />
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: m ? '1rem' : '1.08rem', fontWeight: 700, lineHeight: 1.5, color: '#111', letterSpacing: '-0.01em' }}>
                {r.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900 }}>{r.name.charAt(0)}</div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#000' }}>{r.name}</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(0,0,0,0.45)' }}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>
        {!m && actief > 0 && (
          <button onClick={() => naar(actief - 1)} aria-label="Vorige review" style={pijl(true)}><ChevronLeft size={20} strokeWidth={2.8} /></button>
        )}
        {!m && actief < REVIEWS.length - 1 && (
          <button onClick={() => naar(actief + 1)} aria-label="Volgende review" style={pijl(false)}><ChevronRight size={20} strokeWidth={2.8} /></button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1rem' }}>
        {REVIEWS.map((r, i) => (
          <button key={r.name} onClick={() => naar(i)} aria-label={`Review ${i + 1}`} style={{
            width: i === actief ? 22 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer',
            background: i === actief ? '#000' : 'rgba(0,0,0,0.2)', transition: 'width 0.25s ease, background 0.25s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── De speler ───────────────────────────────────────────────────────────────
//
// Eerst een stilstaand beeld met een afspeelknop; pas bij een tik de echte
// speler. De YouTube-bediening staat uit (controls=0) en daar ligt onze eigen
// laag overheen: play/pauze, geluid en een voortgangsbalk.
//
// Die balk loopt niet gelijk met de tijd. In het begin gaat hij snel en
// daarna vlakt hij af: wie wil weten "hoe lang duurt dit" ziet de balk
// opschieten en kijkt verder; tegen de tijd dat hij merkt dat de video
// langer is, zit hij er al in. Daarom is de balk ook niet versleepbaar.
//
// In de native app loopt de iframe via yt.html (zie youtubeHelpers); daar
// werkt de IFrame API niet, dus daar blijft de gewone YouTube-speler staan.
const TOON_VOORTGANG = (x) => Math.pow(Math.max(0, Math.min(1, x)), 0.45)

function laadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!window.__ytApiBelofte) {
    window.__ytApiBelofte = new Promise((resolve) => {
      const vorige = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { vorige?.(); resolve(window.YT) }
      const el = document.createElement('script')
      el.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(el)
    })
  }
  return window.__ytApiBelofte
}

function Video({ m }) {
  const [gestart, setGestart] = useState(false)
  const [speelt, setSpeelt] = useState(false)
  const [gedempt, setGedempt] = useState(false)
  const [voortgang, setVoortgang] = useState(0)
  // De bediening verdwijnt na een paar seconden zodra de video speelt, en
  // komt terug bij een tik of muisbeweging. Bij pauze blijft hij staan.
  const [bedieningZichtbaar, setBedieningZichtbaar] = useState(true)
  const iframeRef = useRef(null)
  const spelerRef = useRef(null)
  const verbergTimer = useRef(null)
  // Mijlpalen van de échte voortgang (niet de getoonde balk), één keer per sessie.
  const mijlpalen = useRef(new Set())
  useEffect(() => {
    [[0.25, 'video_25'], [0.5, 'video_50'], [0.75, 'video_75'], [0.98, 'video_100']].forEach(([grens, naam]) => {
      if (voortgang >= grens && !mijlpalen.current.has(naam)) { mijlpalen.current.add(naam); meet(naam) }
    })
  }, [voortgang])

  const toonBediening = () => {
    setBedieningZichtbaar(true)
    clearTimeout(verbergTimer.current)
    verbergTimer.current = setTimeout(() => setBedieningZichtbaar(false), 2500)
  }
  useEffect(() => {
    if (speelt) toonBediening()
    else { clearTimeout(verbergTimer.current); setBedieningZichtbaar(true) }
    return () => clearTimeout(verbergTimer.current)
  }, [speelt])

  const directeEmbed = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
  const appUrl = appSafeEmbedUrl(directeEmbed)
  // In de app gaat de URL door yt.html; dan geen eigen laag.
  const eigenLaag = appUrl === directeEmbed

  useEffect(() => {
    if (!gestart || !eigenLaag) return
    let weg = false
    laadYouTubeApi().then((YT) => {
      if (weg || !iframeRef.current) return
      spelerRef.current = new YT.Player(iframeRef.current, {
        events: {
          onReady: (e) => { e.target.playVideo() },
          onStateChange: (e) => {
            setSpeelt(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) setVoortgang(1)
          },
        },
      })
    })
    return () => { weg = true; try { spelerRef.current?.destroy?.() } catch { /* leeg */ } }
  }, [gestart, eigenLaag])

  useEffect(() => {
    if (!speelt) return
    const t = setInterval(() => {
      const p = spelerRef.current
      try {
        const duur = p?.getDuration?.() || 0
        const nu = p?.getCurrentTime?.() || 0
        if (duur > 0) setVoortgang(nu / duur)
      } catch { /* speler nog niet klaar */ }
    }, 200)
    return () => clearInterval(t)
  }, [speelt])

  const wisselSpelen = () => {
    const p = spelerRef.current
    if (!p?.getPlayerState) return
    if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo()
  }
  const wisselGeluid = (e) => {
    e.stopPropagation()
    const p = spelerRef.current
    if (!p?.mute) return
    if (gedempt) { p.unMute(); setGedempt(false) } else { p.mute(); setGedempt(true) }
  }

  const kader = {
    position: 'relative', width: '100%', aspectRatio: '16 / 9',
    borderRadius: m ? 14 : 18, overflow: 'hidden', background: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  }

  if (!gestart) {
    return (
      <div style={kader}>
        <button
          onClick={() => { setGestart(true); meet('video_start'); pixel('ViewContent', { content_name: '6 weken challenge video' }) }}
          aria-label="Video afspelen"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            padding: 0, border: 'none', cursor: 'pointer',
            // Eigen beeld in plaats van de YouTube-thumbnail: die loopt
            // uren achter op een nieuwe upload en daar hebben we geen grip op.
            backgroundImage: 'url(/challenge-thumbnail.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          {/* Los wit driehoekje, geen cirkel eromheen. */}
          <Play
            size={m ? 64 : 84} fill="#fff" color="#fff" strokeWidth={1}
            style={{ position: 'relative', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }}
          />
        </button>
      </div>
    )
  }

  if (!eigenLaag) {
    return (
      <div style={kader}>
        <iframe
          src={appUrl}
          title="Hoe de 6 Weken Challenge werkt"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    )
  }

  const bediening = m ? 44 : 52
  return (
    <div style={kader}>
      <iframe
        ref={iframeRef}
        src={`${directeEmbed}&enablejsapi=1&controls=0&disablekb=1&iv_load_policy=3&origin=${encodeURIComponent(window.location.origin)}`}
        title="Hoe de 6 Weken Challenge werkt"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
      {/* Tikken op het beeld pauzeert of hervat; de laag vangt de klik af
          zodat de YouTube-knoppen eronder niet reageren. */}
      <div
        onClick={() => { wisselSpelen(); toonBediening() }}
        onMouseMove={toonBediening}
        onTouchStart={toonBediening}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: bedieningZichtbaar ? bediening : 0, cursor: bedieningZichtbaar ? 'pointer' : 'none' }}
      />
      {!speelt && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Play size={m ? 56 : 72} fill="#fff" color="#fff" strokeWidth={1} style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />
        </div>
      )}
      {/* Eigen bediening onderin: play/pauze, geluid, voortgang. */}
      <div
        onMouseMove={toonBediening}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: bediening,
          display: 'flex', alignItems: 'center', gap: m ? 10 : 14,
          padding: m ? '0 0.75rem' : '0 1rem',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
          opacity: bedieningZichtbaar ? 1 : 0,
          transform: bedieningZichtbaar ? 'none' : 'translateY(8px)',
          pointerEvents: bedieningZichtbaar ? 'auto' : 'none',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
        <button onClick={wisselSpelen} aria-label={speelt ? 'Pauzeren' : 'Afspelen'} style={knopIcoon}>
          {speelt ? <Pause size={20} fill="#fff" color="#fff" /> : <Play size={20} fill="#fff" color="#fff" />}
        </button>
        <button onClick={wisselGeluid} aria-label={gedempt ? 'Geluid aan' : 'Geluid uit'} style={knopIcoon}>
          {gedempt ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <div style={{
            width: `${TOON_VOORTGANG(voortgang) * 100}%`, height: '100%',
            background: '#fff', borderRadius: 3,
            transition: 'width 0.25s linear',
          }} />
        </div>
      </div>
    </div>
  )
}

const knopIcoon = {
  width: 36, height: 36, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Het formulier als modal, met de transformaties bovenin en logo en kruisje
// eroverheen.
// Meteen de eerste vraag van de prekwalificatie, en wie zelf wil inplannen
// krijgt Calendly als laatste stap van datzelfde formulier.
function KalenderBlad({ open, onClose, m }) {
  useEffect(() => {
    if (!open) return
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toets = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', toets)
    return () => { document.body.style.overflow = vorige; window.removeEventListener('keydown', toets) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', animation: 'bladWaas 0.2s ease',
        // De modal staat midden op de pagina en is zo hoog als zijn inhoud:
        // geen lege zwarte ruimte onder de vraag.
        display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box',
        padding: m ? 'calc(env(safe-area-inset-top, 0px) + 2.2rem) 0.75rem calc(env(safe-area-inset-bottom, 0px) + 2.2rem)' : '5vh 1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // Een modal met wat lucht links en rechts en meer boven en onder,
          // in plaats van schermvullend (21 okt 2026).
          position: 'relative', width: '100%', maxWidth: 640, maxHeight: '100%',
          background: '#0a0a0a', borderRadius: 22, boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'modalIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Logo (midden) en kruisje (rechts) zweven over de foto's heen. */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: m ? '0.7rem 0.6rem 1.4rem' : '0.9rem 0.9rem 1.8rem',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}>
          <img
            src="/ma-logo-header.png" alt="MY ARC"
            style={{ width: m ? 72 : 90, height: 'auto', display: 'block', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}
          />
          <button
            onClick={onClose} aria-label="Sluiten"
            style={{
              position: 'absolute', top: m ? '0.6rem' : '0.8rem', right: m ? '0.5rem' : '0.8rem',
              width: 40, height: 40, flexShrink: 0, pointerEvents: 'auto',
              background: 'none', border: 'none',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={24} strokeWidth={2.8} />
          </button>
        </div>
        <div style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>
          {/* Bovenin het blad de transformaties van Kersten en Nitish: zo zie
              je tijdens de vragen waar je het voor doet (21 okt 2026).
              Volle breedte, tegen elkaar aan; bijgesneden op het bovenlijf. */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, width: '100%', flexShrink: 0 }}>
            {TRANSFORMATIES.map(t => (
              <div key={t.src} style={{ position: 'relative', height: m ? 170 : 240, overflow: 'hidden', background: '#141414' }}>
                <img src={t.src} alt={t.caption} draggable={false}
                  onError={(e) => { e.currentTarget.style.opacity = 0 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', display: 'block' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '1.4rem 0.6rem 0.45rem', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)', fontSize: m ? '0.72rem' : '0.8rem', fontWeight: 900, color: '#fff', textAlign: 'center' }}>
                  {t.naam} · 3 maanden
                </div>
              </div>
            ))}
          </div>
          <PrequalFlow m={m} compact />
        </div>
      </div>
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
  const [kalenderOpen, setKalenderOpen] = useState(false)
  const openKalender = () => { setKalenderOpen(true); meet('knop') }
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

  // Meting: bezoek bij binnenkomst, tijd op de pagina tot het verlaten.
  useEffect(() => {
    meet('bezoek')
    return volgTijdOpPagina()
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
    <OpenKalenderCtx.Provider value={openKalender}>
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
          Gratis 6 Weken Challenge | Online coaching
        </span>
      </div>

      {/* Zwart tot halverwege de video, daaronder wit: de overgang loopt dwars
          door het beeld en trekt je oog naar de video en de knop eronder. */}
      <section style={{ background: HERO_BG, padding: `${m ? '5.4rem' : '7.5rem'} ${m ? '1.25rem' : '3rem'} 0` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Kop m={m} center groot>In shape komen naast je drukke en sociale leven?</Kop>
          <Tekst m={m} center style={{ marginTop: m ? '1.2rem' : '1.6rem', fontSize: m ? '1.3rem' : '1.55rem', fontWeight: 800, lineHeight: 1.35, color: '#fff' }}>
            Kijk de video waar ik uitleg hoe de 6 weken challenge je hierbij helpt.
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
            <Cta m={m} licht />
          </div>
          {/* Wat je krijgt, onder elkaar met een vinkje (21 okt 2026). */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: m ? '1.6rem' : '2.2rem' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: m ? 10 : 12 }}>
              {HERO_PUNTEN.map(p => (
                <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: m ? '1.08rem' : '1.22rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em' }}>
                  <span style={{ width: m ? 26 : 30, height: m ? 26 : 30, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={m ? 16 : 18} strokeWidth={3.4} color="#fff" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {/* Direct onder de punten de transformaties van Kersten en Nitish
              (21 okt 2026; stonden eerst verderop bij de resultaten). */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: m ? '0.6rem' : '1rem', marginTop: m ? '1.8rem' : '2.4rem' }}>
            {TRANSFORMATIES.map(t => (
              <div key={t.src}>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: '#f2f2f2' }}>
                  <img src={t.src} alt={t.caption} draggable={false}
                    onError={(e) => { e.currentTarget.style.opacity = 0 }}
                    style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: m ? '0.74rem' : '0.88rem', fontWeight: 800, color: 'rgba(0,0,0,0.6)', textAlign: 'center', lineHeight: 1.3 }}>
                  {t.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 2. Resultaten ══ */}
      <Sectie m={m} lijn={false} thema="goud">
        <Kop m={m} center>Deze mannen zetten de eerste stap al.</Kop>
        <ReviewSlider m={m} />

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
      <button
        onClick={openKalender}
        style={{
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          position: 'fixed', left: '50%',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${m ? '1.1rem' : '1.5rem'})`,
          transform: 'translateX(-50%)', zIndex: 90,
          opacity: zwevend ? 1 : 0, pointerEvents: zwevend ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: m ? '0.85rem 1.6rem' : '0.95rem 2rem', borderRadius: 999,
          background: '#fff', color: '#000', textDecoration: 'none',
          fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {CTA_TEKST} <ChevronRight size={16} strokeWidth={3} />
      </button>

      <KalenderBlad open={kalenderOpen} onClose={() => setKalenderOpen(false)} m={m} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        body { background: #000; margin: 0; }
        @keyframes bladWaas { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes bladOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
    </OpenKalenderCtx.Provider>
  )
}
