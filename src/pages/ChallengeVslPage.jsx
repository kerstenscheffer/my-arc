// src/pages/ChallengeVslPage.jsx
//
// VSL-pagina voor de 6 Weken Challenge: video bovenaan, daaronder het
// verhaal (resultaten, herkenning, aanpak, coach, geschiktheid, vragen) en
// overal dezelfde knop naar de kennismaking in Calendly. Geen betaling, geen
// formulier: de kennismaking is de enige actie.
//
// Zelfde huisstijl als /6weekchallenge: puur zwart, DM Sans, witte koppen,
// kleine grijze labels, witte knoppen. Deze pagina scrolt gewoon door (geen
// snap-scroll), want het is leestekst en geen presentatie.

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  Star, ChevronDown, ChevronLeft, ChevronRight, Utensils, Dumbbell, MessageCircle,
  Check, Play, Pause, Volume2, VolumeX, X,
  ClipboardList, ClipboardCheck, PartyPopper, ShieldCheck, Crosshair, TrendingUp, LineChart, SlidersHorizontal, Video as VideoIcoon,
} from 'lucide-react'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'
import { PrequalFlow } from './ChallengePrequalPage'
import { meet, pixel, volgTijdOpPagina } from './challengeTracking'

const TP_GREEN = '#00B67A'
const BG = '#000000'

// Drie vlakken wisselen elkaar af, zoals op de acquisition.com-pagina: zwart,
// wit en lichtgrijs. Elke Sectie zet zijn thema; Kop, Tekst en Label
// lezen het mee zodat de kleuren per vlak kloppen.
const THEMAS = {
  zwart: { bg: BG,        tekst: '#fff', tekst85: 'rgba(255,255,255,0.85)', dim: 'rgba(255,255,255,0.55)', rand: 'rgba(255,255,255,0.1)',  randZacht: 'rgba(255,255,255,0.08)', kaart: 'rgba(255,255,255,0.03)', label: 'rgba(255,255,255,0.55)', icoon: '#fff' },
  wit:   { bg: '#ffffff', tekst: '#000', tekst85: '#1a1a1a',                dim: 'rgba(0,0,0,0.6)',        rand: 'rgba(0,0,0,0.12)',       randZacht: 'rgba(0,0,0,0.1)',        kaart: 'rgba(0,0,0,0.03)',       label: 'rgba(0,0,0,0.5)', icoon: '#000' },
  // 'goud' heet nog zo, maar is sinds 21 okt 2026 lichtgrijs: geen geel meer op de pagina.
  goud:  { bg: '#f2f2f2', tekst: '#000', tekst85: '#1a1a1a',                dim: 'rgba(0,0,0,0.6)',        rand: 'rgba(0,0,0,0.1)',        randZacht: 'rgba(0,0,0,0.1)',        kaart: '#ffffff',                label: 'rgba(0,0,0,0.5)', icoon: '#000' },
}
const ThemaCtx = createContext(THEMAS.zwart)
// Elke knop opent het kalenderblad; de functie komt via context zodat de
// knoppen diep in de secties er niet aan hoeven te worden doorgegeven.
const OpenKalenderCtx = createContext(() => {})
const useThema = () => useContext(ThemaCtx)
// De hero is net iets lichter dan de vaste balk erboven, zodat je de twee
// vlakken van elkaar ziet.
const HERO_BG = '#161616'
// De donkere vlakken wisselen af tussen iets grijzer en dieper zwart
// (21 okt 2026), zodat de pagina niet één zwarte lap is.
const ZWART_GRIJS = '#141414'
const ZWART_MIDDEN = '#0b0b0b'

const CALENDLY = 'https://calendly.com/kerstenscheffer/strategie-gesprek-kersten-clone'
const VIDEO_ID = '41Hfc2YVBAA'

const CTA_TEKST = 'Plan kennismakingsgesprek'
// Donkergroen met witte letters, op lichte en donkere vlakken (22 okt 2026).
const CTA_GROEN = '#15803d'

const TRANSFORMATIES = [
  { src: '/review-transformatie-1.png', naam: 'Kersten', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/transformatie-nitish.jpg', naam: 'Nitish', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

// Alle reviews van Trustpilot (overgenomen 21 okt 2026), nieuwste eerst.
// Letterlijk zoals geplaatst; alleen alinea's samengevoegd.
const REVIEWS = [
  { name: 'Nitish Soundalgekar', date: '12 jul 2026', titel: 'Absoluut aanrader!', text: 'De afgelopen 3 maanden onder begeleiding van Kersten hebben mij op fysiek en mentaal niveau enorm onder de indruk gebracht van hoeveel mijn lichaam kan doen met de juiste kennis van voeding, denkwijze en oefeningen. Kersten heeft mij wekelijks heel professioneel begeleid. Het is mij eerder nooit gelukt om sterk en lean tegelijkertijd te worden, en ik ben ontzettend tevreden dat het mij gelukt is. Nu kan ik zonder hemdje over het strand lopen. En ik heb een gevoel dat ik na de 3 maanden zelfstandig deze conditie kan behouden en blijven ontwikkelen, dat is geweldig. Minder klagen, meer werk doen levert prachtige resultaten op. Ik zal iedere jongen die serieus aan zichzelf wil werken het traject van Kersten aanraden. Heel erg bedankt voor alles!' },
  { name: 'Finn', date: '9 mrt 2026', titel: 'Kersten heeft mij uitstekend geholpen…', text: 'Kersten heeft mij uitstekend geholpen met het process van 8 weken, ben hierin goed aangekomen en heb discipline om consistent te blijven gymmen' },
  { name: 'Hessel', date: '20 feb 2026', titel: 'Fijn en succesvol traject', text: 'Ik was al lang van plan om wat af te vallen en wat fitter te worden, gespierd was voor mij niet nodig. Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. iedere week wegen, videobellen en daarin mijn voortgang bespreken. Kersten geeft niet alleen om jouw fysieke vooruitgangen. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf in gewicht. Ik ben van 79,8 naar 74,4 gegaan tijdens dit traject van 8 weken. Het doel was 75kg en dat is door een gebalanceerd plan goed gelukt. Geen vaste gerechten die je moet eten. Alleen wel een duw in de goeie richting, je krijgt gerechten die je kan proberen maar niks is verplicht, als jij je aan het plan houd zal Kersten altijd de volle 100% geven!' },
  { name: 'Me', date: '2 dec 2025', titel: 'Als je hulp nodig hebt met sporten raad…', text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls om te kijken hoe je er nu voor staat. Ook kan je makkelijk contact opnemen als je ergens tegen aan loopt of als je vragen hebt.' },
  { name: 'Indi Scheffer', date: '1 dec 2025', titel: 'Myarc', text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb. Daarnaast motiveert hij me heel erg bij het sporten, en hebben we afspraken gemaakt waardoor ik het makkelijk kan volhouden en me fitter voel. Zijn begeleiding is professioneel, persoonlijk, betrouwbaar en veel lachen natuurlijk (wanneer dat kan) bijv. in de wekelijkse calls. Ik ben echt tevreden en kan Myarc aan iedereen aanraden die op zoek is naar goede en leuke ondersteuning op het gebied van voeding en sport.' },
  { name: 'Toon', date: '5 nov 2025', titel: 'Super Coach', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'SASSUS', date: '5 nov 2025', titel: 'Na 100 mislukte pogingen van…', text: 'Na 100 mislukte pogingen van "crash"dieten, maandag begin ik echt, na de vakantie ga ik het echt volhouden tot aan de eerste week 1000% ervoor gaan en ik kan het wel alleen, wilde ik mijzelf nog 1 kans geven. Dit keer met hulp van iemand die er verstand van heeft en mij kan blijven motiveren in de moeilijke situaties. Met de energie die ik krijg van Kersten, zijn enthousiasme en motiverende gesprekken is het mij gelukt om een routine te creeeren waarbij ik krachttrainingen en een voedingschema kan inpassen waar ik mij goed bij voel en die ik kan continueren. Niet alleen bij het fysieke gedeelte maar ook het mentale stukje heeft Kersten mij goed geholpen. Kersten is een gespecialiseerde coach die je jezelf laat verbazen over wat je kan bereiken.' },
  { name: 'Consumer', date: '3 nov 2025', titel: 'MY ARC', text: 'Zeer professionele aanpak! Kersten geeft alles duidelijk en gestructureerd weer in een overzichtelijke app, waarin je niet alleen je voeding, maar ook je slaap, trainingen en algemene voortgang kunt bijhouden. Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten. Dankzij zijn persoonlijke begeleiding en deskundige aanpak blijf je gemotiveerd en zie je echt resultaat. Een absolute aanrader voor wie op een duurzame en verantwoorde manier fitter wil worden!' },
]

// Kort en krachtig (21 okt 2026): één zin per punt.
const HERKENNING = [
  "Overdag gaat het goed. 's Avonds gaat de zak chips open.",
  'Je traint, maar ziet geen vooruitgang.',
  'Na een paar weken haalt een drukke periode je weer onderuit.',
]

// Compact (21 okt 2026): per onderdeel één kop en één zin.
// De drie pijlers als kaarten onder de bovenste knop (22 okt 2026; stonden
// eerst als aparte sectie verderop). Tik opent de uitleg (PijlerModal).
const AANPAK = [
  { pijler: 'voeding', kort: 'Voeding', sub: 'die past bij je leven', Icon: Utensils, kop: 'Voeding die past bij jouw leven', zin: 'Persoonlijk plan in de app, met ruimte voor etentjes en weekenden.' },
  { pijler: 'training', kort: 'Training', sub: 'die je vooruit helpt', Icon: Dumbbell, kop: 'Training die je vooruit helpt', zin: "Schema op jouw tijd en niveau, met uitlegvideo's per oefening." },
  { pijler: 'begeleiding', kort: 'Begeleiding', sub: 'bij het volhouden', Icon: MessageCircle, kop: 'Begeleiding bij het volhouden', zin: 'Check-ins en WhatsApp: ik kijk mee en we sturen samen bij.' },
]

// Kort (21 okt 2026): vier punten van een paar woorden.
const GESCHIKT = [
  'Je wilt vet kwijt of spieren erbij.',
  'Je wilt weten wat je eet en hoe je traint.',
  'Je hebt een druk leven.',
  'Je bent bereid om ervoor te gaan.',
]


// Kort (21 okt 2026): één of twee zinnen per antwoord.
const VRAGEN = [
  { vraag: 'Moet ik na zes weken doorgaan?', antwoord: ['Nee. Wil je daarna verder, dan bespreken we dat. Jij beslist.'] },
  { vraag: 'Past dit bij een drukke baan en gezin?', antwoord: ['Ja, je plan past zich aan je week aan. Trainen en je afspraken nakomen doe je wel zelf.'] },
  { vraag: 'Hoeveel begeleiding krijg ik?', antwoord: ['De app, je plannen, wekelijkse check-ins en WhatsApp. Waar nodig een call.'] },
  { vraag: 'Welk resultaat kan ik verwachten?', antwoord: ['Dat hangt af van je startpunt en inzet. In de kennismaking zetten we een haalbaar doel.'] },
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

// De startknop: overal donkergroen met witte tekst (22 okt 2026, eerst wit/
// zwart). `licht` bepaalt alleen nog de Trustpilot-regel eronder, voor een
// vlak zonder eigen Sectie-thema (de witte strook onder de video).
function Cta({ m, sub, style, licht }) {
  const openKalender = useContext(OpenKalenderCtx)
  const t = useThema()
  const opLicht = licht ?? t.tekst === '#000'
  const vlak = CTA_GROEN
  const letter = '#fff'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      <button
        onClick={openKalender} data-cta=""
        style={{
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          minHeight: m ? 68 : 76, padding: m ? '0 1rem' : '0 2.6rem',
          width: m ? '100%' : 'auto', minWidth: m ? 0 : 380,
          borderRadius: 14, background: vlak, color: letter,
          // Eén regel op de telefoon: kleiner lettertype en nooit afbreken.
          // Dikker dan 900 bestaat niet in het lettertype; een dunne zwarte
          // contour maakt de letters zwaarder.
          fontSize: m ? '1rem' : '1.4rem', fontWeight: 900, letterSpacing: '0.03em',
          whiteSpace: 'nowrap', WebkitTextStroke: `${m ? '0.5px' : '0.7px'} ${letter}`,
          textTransform: 'uppercase', textDecoration: 'none', boxSizing: 'border-box',
          boxShadow: 'none',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {CTA_TEKST}
      </button>
      {/* Trustpilot direct onder elke startknop (21 okt 2026). */}
      <TrustpilotBadge licht={opLicht} style={{ marginTop: 4 }} />
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
// telefoon met een stukje van de volgende). Schuift elke 5 s vanzelf door;
// raakt iemand hem aan (vegen, pijltje, bolletje), dan wacht hij 10 s.
// Lange reviews ingekort met 'Lees meer' (21 okt 2026).
function ReviewSlider({ m }) {
  const baan = useRef(null)
  const [actief, setActief] = useState(0)
  const [open, setOpen] = useState({})
  const rustTot = useRef(0)
  const actiefRef = useRef(0)
  actiefRef.current = actief
  const raak = () => { rustTot.current = Date.now() + 10000 }
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
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() < rustTot.current || document.hidden) return
      const el = baan.current
      if (!el || el.getBoundingClientRect().bottom < 0 || el.getBoundingClientRect().top > window.innerHeight) return
      naar((actiefRef.current + 1) % REVIEWS.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])
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
          onTouchStart={raak} onMouseEnter={raak} onWheel={raak}
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
              <div>
                <div style={{ fontSize: m ? '1.05rem' : '1.12rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{r.titel}</div>
                <p style={{
                  margin: '0.4rem 0 0', fontSize: m ? '0.95rem' : '1rem', fontWeight: 600, lineHeight: 1.5, color: '#222', letterSpacing: '-0.01em',
                  ...(open[r.name] ? {} : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                }}>
                  {r.text}
                </p>
                {r.text.length > 220 && (
                  <button onClick={() => { raak(); setOpen(o => ({ ...o, [r.name]: !o[r.name] })) }} style={{ marginTop: 4, padding: 0, background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 900, color: '#000', textDecoration: 'underline', cursor: 'pointer' }}>
                    {open[r.name] ? 'Minder' : 'Lees meer'}
                  </button>
                )}
              </div>
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
          <button onClick={() => { raak(); naar(actief - 1) }} aria-label="Vorige review" style={pijl(true)}><ChevronLeft size={20} strokeWidth={2.8} /></button>
        )}
        {!m && actief < REVIEWS.length - 1 && (
          <button onClick={() => { raak(); naar(actief + 1) }} aria-label="Volgende review" style={pijl(false)}><ChevronRight size={20} strokeWidth={2.8} /></button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1rem' }}>
        {REVIEWS.map((r, i) => (
          <button key={r.name} onClick={() => { raak(); naar(i) }} aria-label={`Review ${i + 1}`} style={{
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
// De omlijsting van alle modals op deze pagina: midden op het scherm, zo
// hoog als de inhoud, logo en kruisje zwevend bovenin (21 okt 2026).
function ModalKader({ open, onClose, m, children }) {
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
          {children}
        </div>
      </div>
    </div>
  )
}

function KalenderBlad({ open, onClose, m }) {
  return (
    <ModalKader open={open} onClose={onClose} m={m}>
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
    </ModalKader>
  )
}

// De drie pijlers van de aanpak, zoals op de 6-weken-pagina: banner met de
// titel erin, één zin, vier punten. Opent vanaf de punten onder de knop.
const PIJLERS = {
  voeding: {
    foto: '/methode/voeding-slide.jpg', kop: 'Weet wat je eet',
    zin: 'Vaste structuur in de app, zonder rekenen. Etentjes bouwen we in.',
    doen: [
      { Icon: ClipboardList, kop: 'Structuur', tekst: 'Plan staat klaar. Nul denkwerk.' },
      { Icon: Utensils, kop: 'Keuze', tekst: '500 gerechten in jouw plan.' },
      { Icon: PartyPopper, kop: 'Flexibiliteit', tekst: 'Etentjes leren we mee omgaan.' },
      { Icon: ShieldCheck, kop: 'Zekerheid', tekst: 'Weten dat het klopt.' },
    ],
  },
  training: {
    foto: '/methode/training-slide.jpg', kop: 'Elke training telt',
    zin: "Schema op maat, uitlegvideo's per oefening, onder het uur.",
    doen: [
      { Icon: ClipboardList, kop: 'Schema', tekst: 'Jouw dagen, locatie, niveau.' },
      { Icon: Crosshair, kop: 'Focus', tekst: 'Alleen wat telt.' },
      { Icon: TrendingUp, kop: 'Resultaatgericht', tekst: 'Zie dat het werkt.' },
      { Icon: ShieldCheck, kop: 'Zekerheid', tekst: 'Hoe, hoeveel, welke. Nooit twijfelen.' },
    ],
  },
  begeleiding: {
    foto: '/methode/begeleiding-slide.jpg', kop: 'Coach in jouw corner',
    zin: 'Wekelijkse call, snel bereikbaar in de app, ik kijk mee met je cijfers.',
    doen: [
      { Icon: LineChart, kop: 'Cijfers', tekst: 'Kijk dagelijks mee, stuur op data.' },
      { Icon: SlidersHorizontal, kop: 'Bijsturen', tekst: 'Stilstaan is geen optie.' },
      { Icon: ClipboardCheck, kop: 'Check-in', tekst: 'Wat liep vast, wat gaat anders.' },
      { Icon: VideoIcoon, kop: 'Weekcall', tekst: 'Wat werkt, wat niet.' },
    ],
  },
}

function PijlerModal({ pijler, onClose, onStart, m }) {
  const p = PIJLERS[pijler]
  return (
    <ModalKader open={!!p} onClose={onClose} m={m}>
      {p && (
        <>
          <img src={p.foto} alt={p.kop} draggable={false}
            style={{ width: '100%', aspectRatio: '1960 / 600', objectFit: 'cover', display: 'block', flexShrink: 0, background: '#141414' }} />
          <div style={{ padding: m ? '1.2rem 1.15rem 1.3rem' : '1.6rem 1.7rem 1.7rem', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            <p style={{ margin: 0, fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 800, lineHeight: 1.45, color: '#fff', textAlign: 'center', letterSpacing: '-0.01em' }}>{p.zin}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: m ? '1.2rem' : '1.5rem' }}>
              {p.doen.map(d => (
                <div key={d.kop} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: m ? '0.8rem 0.95rem' : '0.95rem 1.15rem', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <d.Icon size={20} strokeWidth={2.6} color="#000" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: m ? '1rem' : '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{d.kop}</div>
                    <div style={{ fontSize: m ? '0.88rem' : '0.94rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{d.tekst}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onStart} style={{
              marginTop: m ? '1.3rem' : '1.6rem', width: '100%', minHeight: m ? 58 : 64, borderRadius: 14, border: 'none',
              background: CTA_GROEN, color: '#fff', fontSize: m ? '1rem' : '1.15rem', fontWeight: 900, fontFamily: 'inherit',
              letterSpacing: '0.03em', textTransform: 'uppercase', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {CTA_TEKST}
            </button>
          </div>
        </>
      )}
    </ModalKader>
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
  // Welke pijler-uitleg open staat (voeding, training, begeleiding) of null.
  const [pijler, setPijler] = useState(null)
  const openKalender = () => { setKalenderOpen(true); meet('knop') }
  // De zwevende knop komt pas als de knop bovenaan uit beeld is.
  const [zwevend, setZwevend] = useState(false)
  const heroCtaRef = useRef(null)

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

  // Zwevend alleen als de bovenste knop voorbij is én er geen andere
  // startknop in beeld staat (21 okt 2026): nooit twee knoppen tegelijk.
  useEffect(() => {
    const hero = heroCtaRef.current
    if (!hero) return
    const knoppen = [...document.querySelectorAll('[data-cta]')]
    const zichtbaar = new Set()
    let heroVoorbij = false
    const werkBij = () => setZwevend(heroVoorbij && zichtbaar.size === 0)
    const obs = new IntersectionObserver((items) => {
      items.forEach(e => {
        if (e.target === hero) heroVoorbij = !e.isIntersecting && e.boundingClientRect.top < 0
        else if (e.isIntersecting) zichtbaar.add(e.target)
        else zichtbaar.delete(e.target)
      })
      werkBij()
    }, { threshold: 0 })
    obs.observe(hero)
    knoppen.forEach(k => { if (!hero.contains(k)) obs.observe(k) })
    return () => obs.disconnect()
  }, [])



  return (
    <OpenKalenderCtx.Provider value={openKalender}>
    <div style={{
      background: BG, color: '#fff', minHeight: '100vh',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>

      {/* ══ 1. Bovenaan: label, korte kop, video, één alinea, knop ══
          Alles op het eerste scherm van een telefoon. De lange uitleg staat
          onder de video, niet erboven: de video is waar je voor komt. */}
      {/* Vaste balk bovenaan: logo en het label als witte pil, samen in het midden. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: BG, borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: `calc(env(safe-area-inset-top, 0px) + ${m ? '0.6rem' : '0.75rem'}) 1rem ${m ? '0.6rem' : '0.75rem'}`,
      }}>
        {/* MY ARC-logo als één geheel met de pil: even hoog, op één lijn,
            samen in het midden (21 okt 2026). */}
        <img
          src="/ma-logo-header.png" alt="MY ARC"
          style={{ height: m ? 30 : 36, width: 'auto', display: 'block', flexShrink: 0, marginRight: m ? 8 : 12 }}
        />
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
          {/* Eten, trainen, iemand die meekijkt als horizontaal stappenplan:
              drie bollen 1-2-3 op één lijn, eronder het woord en een korte
              regel, geen kaarten (22 okt 2026). Elke stap opent zijn pijler. */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 620, margin: `${m ? '1.8rem' : '2.4rem'} auto 0` }}>
            {/* De lijn loopt van het midden van bol 1 naar het midden van bol 3. */}
            <span aria-hidden style={{ position: 'absolute', left: '16.67%', right: '16.67%', top: (m ? 44 : 52) / 2 - 1, height: 2, background: 'rgba(0,0,0,0.15)' }} />
            {AANPAK.map((a, i) => (
              <button key={a.kop} onClick={() => { setPijler(a.pijler); meet('pijler', { meta: { pijler: a.pijler } }) }} aria-label={a.kop} style={{
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: m ? 8 : 10,
                padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{
                  width: m ? 44 : 52, height: m ? 44 : 52, borderRadius: '50%', background: '#000', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900,
                  // Witte ring zodat de lijn netjes achter de bol stopt.
                  boxShadow: '0 0 0 5px #fff',
                }}>
                  {i + 1}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: m ? '0.92rem' : '1.15rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  {a.kort}<ChevronRight size={m ? 13 : 17} strokeWidth={3} style={{ flexShrink: 0 }} />
                </span>
                <span style={{ marginTop: -4, fontSize: m ? '0.78rem' : '0.88rem', fontWeight: 700, color: 'rgba(0,0,0,0.55)', lineHeight: 1.3 }}>
                  {a.sub}
                </span>
              </button>
            ))}
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
      <Sectie m={m} smal style={{ background: ZWART_GRIJS }}>
        <Kop m={m}>Je weet wat je moet doen. Alleen niet hoe je het volhoudt.</Kop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: m ? '0.6rem' : '0.8rem', marginTop: m ? '1.4rem' : '1.9rem' }}>
          {HERKENNING.map((t, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.9rem', alignItems: 'center',
              padding: m ? '1rem 1.1rem' : '1.2rem 1.4rem', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ flexShrink: 0, fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff' }}>{i + 1}.</span>
              <span style={{ fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, letterSpacing: '-0.01em' }}>{t}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: `${m ? '1.5rem' : '2rem'} 0 0`, fontSize: m ? '1.15rem' : '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: '#fff' }}>
          Je plan moet ook werken op je drukste dagen. Daar zorgen we samen voor.
        </p>
      </Sectie>

      {/* ══ 5. De coach ══ */}
      <Sectie m={m} style={{ background: BG }}>
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
        <Kop m={m}>Past dit bij jou?</Kop>
        <div style={{ marginTop: m ? '1.1rem' : '1.4rem' }}>
          {GESCHIKT.map((t, i) => (
            <div key={t} style={{
              display: 'flex', gap: '0.8rem', alignItems: 'center',
              padding: m ? '0.75rem 0' : '0.95rem 0',
              borderTop: i === 0 ? `1px solid ${THEMAS.goud.randZacht}` : 'none',
              borderBottom: `1px solid ${THEMAS.goud.randZacht}`,
            }}>
              <Check size={m ? 22 : 26} strokeWidth={3} color={THEMAS.goud.icoon} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: THEMAS.goud.tekst }}>{t}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: `${m ? '1.2rem' : '1.5rem'} 0 0`, fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.35, color: THEMAS.goud.tekst }}>
          Perfect hoeft niet. Inzet wel.
        </p>
      </Sectie>

      {/* ══ 7. Vragen ══ */}
      <Sectie m={m} smal thema="wit">
        <Kop m={m}>Vragen</Kop>
        <div style={{ marginTop: m ? '1.2rem' : '1.6rem', borderTop: `1px solid ${THEMAS.wit.randZacht}` }}>
          {VRAGEN.map((v, i) => (
            <Vraag key={v.vraag} item={v} m={m} open={openVraag === i} onToggle={() => setOpenVraag(openVraag === i ? -1 : i)} />
          ))}
        </div>
      </Sectie>

      {/* ══ Slot: de laatste knop ══ */}
      <Sectie m={m} style={{ paddingBottom: m ? '7rem' : '8rem', background: ZWART_MIDDEN }}>
        <Kop m={m} center>Klaar om te starten of heb je nog vragen?</Kop>
        <Tekst m={m} center dim style={{ marginTop: '0.9rem' }}>
          Plan hieronder je vrijblijvende kennismaking. We kijken samen naar je huidige situatie, je doelen en of de challenge bij jou past.
        </Tekst>
        <Cta m={m} style={{ marginTop: m ? '1.8rem' : '2.4rem' }} />

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
          background: CTA_GROEN, color: '#fff', textDecoration: 'none',
          fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {CTA_TEKST}
      </button>

      <KalenderBlad open={kalenderOpen} onClose={() => setKalenderOpen(false)} m={m} />
      <PijlerModal pijler={pijler} m={m} onClose={() => setPijler(null)} onStart={() => { setPijler(null); openKalender() }} />

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
