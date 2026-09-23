// src/pages/SixWeekChallengeCheckout.jsx
// Checkout op /6week-checkout — EENMALIG €297, de 6 weken In Shape Challenge
// met win-your-money-back.
//
// Opmaak en beeld zijn die van /6weekchallenge: de brede herofoto, de drie
// grote knoppen, de schermvullende methode-slides en het voorwaarden-scherm.
// Alleen het tweede scherm is van de checkout zelf gebleven — daar staan de
// garanties, het formulier en de reviews, en dat is wat er moet gebeuren.
//
// Twee varianten, één pagina. Met `termijnen` erop staat dezelfde tekst op
// /6week-checkout-2x, maar reken je in twee keer af: nu en over drie weken.
// Alles wat tussen de varianten verschilt staat in VARIANT hieronder, zodat de
// tekst niet op twee plekken uit elkaar gaat lopen.
//
// Stripe: /api/create-checkout-session (one-time), plan '6-week-challenge'.
//
// Bewust een kopie van de challenge-pagina en geen gedeelde component: die
// pagina mag hierdoor niet stukgaan, en de twee lopen uit elkaar zodra de copy
// per pagina verandert.

import { useState, useEffect, useRef, Fragment } from 'react'
import { Star, Lock, Mail, User, Phone, ChevronDown, X, Compass, ListChecks, Target, HelpCircle, Clock, BadgeEuro, Maximize2, Minimize2, ClipboardList, ShieldCheck, PartyPopper, Crosshair, Utensils, TrendingUp, ClipboardCheck, LineChart, SlidersHorizontal, Video } from 'lucide-react'

// Eenmalige prijs.
const PRICE = 297

// Stripe Price ID van dit traject — de checkout rekent hiermee af, niet met
// PRICE hierboven (die is alleen nog de weergegeven prijs op de pagina).
// Eenmalige prijs. Het eerste id dat we kregen was een maandabonnement van
// €297; die combinatie weigert Stripe in 'payment'-mode ("You specified
// `payment` mode but passed a recurring price"), waardoor elke afrekening
// stukliep. Dit id hoort bij hetzelfde product, maar dan one_time.
const STRIPE_PRICE_ID = 'price_1UFdw6J3V4uXn1OkvJicc73b'

// Twee termijnen van €148,50: een abonnement dat elke 3 weken int en na de
// tweede incasso stopt (zie de stripe-webhook; die zet de stop). Abonnementen
// kunnen bij Stripe niet met iDEAL, dus deze variant is kaart-only.
const TERMIJN_BEDRAG = 148.5
const STRIPE_PRICE_ID_2X = 'price_1UI2xdJ3V4uXn1OkOVZpVKTr'

const VARIANT = {
  eenmalig: {
    plan: '6-week-challenge',
    priceId: STRIPE_PRICE_ID,
    mode: 'payment',
    cancelPath: '/6week-checkout',
    knop: `Start Nu · €${PRICE}`,
    balkKnop: `Maak investering · €${PRICE}`,
    prijsRegel: null,
  },
  termijnen: {
    plan: '6-week-challenge-2x',
    priceId: STRIPE_PRICE_ID_2X,
    mode: 'subscription',
    cancelPath: '/6week-checkout-2x',
    knop: `Start Nu · 2 × €${String(TERMIJN_BEDRAG).replace('.', ',')}`,
    balkKnop: `In 2 termijnen · €${PRICE}`,
    prijsRegel: `2 termijnen van €${String(TERMIJN_BEDRAG).replace('.', ',')} — de eerste nu, de tweede over 3 weken. Samen €${PRICE}, verder niets. Betalen met kaart.`,
  },
}

// Same Stripe publishable key as the other checkouts.
const STRIPE_PK = 'pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
// Puur zwart: de fades in de banners lopen naar #000, dus elke andere
// donkergrijze tint geeft een zichtbare rand rond het beeld.
const BG = '#000000'

// Offer(0) + formulier(1). Het hero-scherm is weg: je komt hier met een
// beslissing in je hoofd, dus je begint bij het aanbod. Trustpilot en de
// transformaties staan verderop, bij de reviews onder het formulier.
const SECTION_COUNT = 2

const REVIEWS = [
  { name: 'Hessel', date: 'dec 2025', text: 'Kersten begreep het meteen! Na een uitgebreide 0-meting kreeg ik een plan op maat. Van 79,8 naar 74,4 in 8 weken. Als jij je aan het plan houdt geeft Kersten altijd de volle 100%!' },
  { name: 'Me', date: 'dec 2025', text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls.' },
  { name: 'Indi', date: 'dec 2025', text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden. Professioneel, persoonlijk, betrouwbaar. Ik kan Myarc aan iedereen aanraden!' },
  { name: 'Toon', date: 'nov 2025', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'Sassus', date: 'nov 2025', text: 'Na 100 mislukte pogingen is het mij met Kersten gelukt een routine te creëren die ik kan continueren. Hij laat je jezelf verbazen over wat je kan bereiken.' },
  { name: 'Consumer', date: 'nov 2025', text: 'Zeer professionele aanpak! Alles duidelijk en gestructureerd in een overzichtelijke app. Feedback en motivatie op de juiste momenten. Absolute aanrader!' },
]

// Transformatie-reviews (before/after) met resultaat-tekst.
const TRANSFORMATIONS = [
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

// De slider draait reviews en transformatiefoto's door elkaar, zodat de
// foto's meeschuiven in plaats van er als los blok boven te staan.
const SLIDES = REVIEWS.flatMap((review, i) => {
  const foto = i === 1 ? TRANSFORMATIONS[0] : i === 3 ? TRANSFORMATIONS[1] : null
  return foto ? [{ soort: 'review', ...review }, { soort: 'foto', ...foto }] : [{ soort: 'review', ...review }]
})

// De 3 pijlers — copy gelijk aan /16week (OfferPilarenSection).
// ── De methode: schermvullend, één pijler per slide ─────────────────────────
//
// Drie pijlers zijn drie verhalen; in een lijstje van drie regels lees je ze
// als opsomming. Als slide krijgt elke pijler het hele scherm: foto, wat het
// is, en wat we concreet gaan doen.
const PIJLERS = [
  {
    // Op dit beeld staan de titel en de kernwoorden al; die laten we dan ook
    // weg uit de tekst eronder, anders staat alles er twee keer.
    foto: '/methode/voeding-slide.jpg',
    beeldVult: true,
    // De titel staat op dit beeld, dus de pagina zet er geen tweede boven.
    titelInBeeld: true,
    kop: 'Weet wat je eet',
    zin: 'Vaste structuur in de app, zonder rekenen. Etentjes bouwen we in.',
    doen: [
      { Icon: ClipboardList, kop: 'Structuur',     tekst: 'Plan staat klaar. Nul denkwerk.' },
      { Icon: Utensils,      kop: 'Keuze',         tekst: '500 gerechten in jouw plan.' },
      { Icon: PartyPopper,   kop: 'Flexibiliteit', tekst: 'Etentjes leren we mee omgaan.' },
      { Icon: ShieldCheck,   kop: 'Zekerheid',     tekst: 'Weten dat het klopt.' },
    ],
  },
  {
    foto: '/methode/training-slide.jpg',
    beeldVult: true,
    titelInBeeld: true,
    kop: 'Elke training telt',
    zin: "Schema op maat, uitlegvideo's per oefening, onder het uur.",
    doen: [
      { Icon: ClipboardList, kop: 'Schema',           tekst: 'Jouw dagen, locatie, niveau.' },
      { Icon: Crosshair,     kop: 'Focus',            tekst: 'Alleen wat telt.' },
      { Icon: TrendingUp,    kop: 'Resultaatgericht', tekst: 'Zie dat het werkt.' },
      { Icon: ShieldCheck,   kop: 'Zekerheid',        tekst: 'Hoe, hoeveel, welke. Nooit twijfelen.' },
    ],
  },
  {
    foto: '/methode/begeleiding-slide.jpg',
    beeldVult: true,
    titelInBeeld: true,
    kop: 'Coach in jouw corner',
    zin: 'Wekelijkse call, snel bereikbaar in de app, ik kijk mee met je cijfers.',
    doen: [
      { Icon: LineChart,          kop: 'Cijfers',   tekst: 'Kijk dagelijks mee, stuur op data.' },
      { Icon: SlidersHorizontal,  kop: 'Bijsturen', tekst: 'Stilstaan is geen optie.' },
      { Icon: ClipboardCheck,     kop: 'Check-in',  tekst: 'Wat liep vast, wat gaat anders.' },
      { Icon: Video,              kop: 'Weekcall',  tekst: 'Wat werkt, wat niet.' },
    ],
  },
]

function MethodeSlider({ isMobile, onClose }) {
  const [i, setI] = useState(0)
  const raakX = useRef(null)
  const p = PIJLERS[i]
  const naar = (n) => setI(Math.max(0, Math.min(PIJLERS.length - 1, n)))

  useEffect(() => {
    const toets = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1))
      // Pijl naar rechts en Enter doen hetzelfde: verder, en op de laatste
      // slide sluiten.
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setI(v => {
          if (v >= PIJLERS.length - 1) { onClose(); return v }
          return v + 1
        })
      }
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [onClose])

  return (
    <div
      // Klikken in het venster gaat naar de volgende slide; knoppen en
      // bolletjes vangen hun eigen klik af.
      onClick={(e) => {
        if (e.target.closest('button')) return
        if (i >= PIJLERS.length - 1) onClose()
        else naar(i + 1)
      }}
      onTouchStart={(e) => { raakX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (raakX.current == null) return
        const verschil = e.changedTouches[0].clientX - raakX.current
        if (Math.abs(verschil) > 50) naar(i + (verschil < 0 ? 1 : -1))
        raakX.current = null
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        animation: 'bladWaas 0.2s ease',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Foto over de volle breedte, met de kop er half overheen. */}
      {/* Beeld met tekst erop krijgt een vaste verhouding van 16:5, zodat wat
          je exporteert ook precies is wat je ziet: geen bijsnijden, geen zwarte
          balken. De gewone foto's blijven een band met vaste hoogte. */}
      <div style={{
        position: 'relative', width: '100%', flexShrink: 0,
        ...(p.beeldVult && !isMobile
          ? { aspectRatio: '49 / 15' }   // 1960x600, exact de verhouding van het beeld
          : { height: isMobile ? '34vh' : 'min(46vh, 460px)' }),
      }}>
        <div key={p.foto} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${p.foto})`,
          backgroundSize: 'cover',
          // Staat de tekst op het beeld, dan houden we de onderkant vast: daar
          // staat de titel. Bijsnijden gebeurt dan bovenin.
          backgroundPosition: p.beeldVult ? 'center bottom' : 'center',
          backgroundRepeat: 'no-repeat',
          animation: 'pijlerIn 0.35s ease',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          // Beeld dat zelf al tekst draagt laten we helemaal met rust: geen
          // fade, anders vreet die de onderste regel op. De gewone foto's
          // lopen wel naar zwart, daar staat de kop overheen.
          background: p.beeldVult
            ? `linear-gradient(180deg, rgba(0,0,0,0) 86%, ${BG} 100%)`
            : `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.8) 72%, ${BG} 100%)`,
        }} />
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            position: 'absolute', top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 12 : 20}px)`,
            right: isMobile ? 12 : 20,
            width: 40, height: 40, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, color: '#fff', cursor: 'pointer',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} strokeWidth={2.8} />
        </button>
      </div>

      {/* Tekst: wat het is, en wat we gaan doen. */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: isMobile ? '0 1.25rem 1.25rem' : '0 2rem 2rem',
      }}>
        <div style={{
          maxWidth: 1100, width: '100%', margin: '0 auto', position: 'relative',
          marginTop: p.beeldVult ? (isMobile ? '2.5rem' : '4.5rem') : (isMobile ? -18 : -28),
        }}>
          {/* Het label 'PIJLER x VAN 3' blijft weg als het beeld al tekst
              draagt; de titel staat er altijd, zodat elke slide op de pagina
              zelf zijn kop heeft. */}
          {!p.beeldVult && (
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800,
              letterSpacing: '0.16em', color: GOLD, marginBottom: isMobile ? 8 : 12,
            }}>
              PIJLER {i + 1} VAN {PIJLERS.length}
            </div>
          )}
          {!p.titelInBeeld && (
            <div style={{
              fontSize: isMobile ? '1.7rem' : '2.6rem', fontWeight: 900,
              letterSpacing: '-0.03em', lineHeight: 1.08,
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}>
              <span style={{ color: GOLD }}>{i + 1}. </span>
              {p.kop}
            </div>
          )}
          {!p.beeldVult && (
            <p style={{
              margin: `${isMobile ? 10 : 14}px 0 ${isMobile ? '1.4rem' : '2rem'}`,
              fontSize: isMobile ? '0.95rem' : '1.2rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.65)', lineHeight: 1.45,
            }}>
              {p.zin}
            </p>
          )}

          {/* Zelfde opzet als het eerste scherm: gelijke kolommen met het
              icoon boven een bold wit woord, en de zin eronder. Zo leest elke
              slide hetzelfde als de knoppenrij op de homeslide. */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${p.doen.length}, 1fr)`,
            gap: isMobile ? '1.75rem 1rem' : '3.5rem',
            width: '100%',
            maxWidth: isMobile ? '100%' : 1250,
            margin: '0 auto',
          }}>
            {p.doen.map((regel) => (
              <div key={regel.kop || regel.tekst} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: isMobile ? 9 : 16, textAlign: 'center',
              }}>
                <regel.Icon size={isMobile ? 32 : 60} strokeWidth={2.6} color="#fff" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: isMobile ? '0.95rem' : '1.45rem', fontWeight: 900,
                  color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15,
                }}>
                  {regel.kop || regel.tekst}
                </span>
                {regel.kop && regel.tekst && (
                  <span style={{
                    fontSize: isMobile ? '0.82rem' : '1.05rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
                  }}>
                    {regel.tekst}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geen knoppenbalk: je bladert met de pijltjestoetsen, Enter, een
          klik in het venster of een swipe. */}
    </div>
  )
}

// ── De voorwaarden: schermvullend, zelfde opzet als de methode-slides ──────
const GARANTIE_KAARTEN = [
  { Icon: Target,    kop: 'Plan volgt of resultaat haalt' },
  { Icon: Clock,     kop: 'Merkt dat het niet past' },
  { Icon: BadgeEuro, kop: '6 weken service' },
]

function VoorwaardenVenster({ isMobile, onClose }) {
  useEffect(() => {
    const toets = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        animation: 'bladWaas 0.2s ease',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Banner met de titel erop, net als bij de methode. */}
      <div style={{
        position: 'relative', width: '100%', flexShrink: 0,
        // Geen maxHeight: die maakte het vak lager dan de verhouding van de
        // foto, waardoor cover de bovenkant eraf sneed.
        ...(isMobile ? { height: '30vh' } : { aspectRatio: '49 / 15' }),
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/voorwaarden-banner.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: '14%', pointerEvents: 'none',
          background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${BG} 100%)`,
        }} />
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            position: 'absolute', top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 12 : 20}px)`,
            right: isMobile ? 12 : 20,
            width: 40, height: 40, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, color: '#fff', cursor: 'pointer',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} strokeWidth={2.8} />
        </button>
      </div>

      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: isMobile ? '0 1.25rem 1.5rem' : '0 2rem 2.5rem',
      }}>
        <div style={{
          maxWidth: 1250, width: '100%', margin: '0 auto',
          marginTop: isMobile ? '0.5rem' : '0.75rem',
          // Kolom over de volle hoogte, zodat de slotzin onderaan het scherm
          // kan staan in plaats van vlak onder de iconen.
          minHeight: '100%', display: 'flex', flexDirection: 'column',
        }}>
          {/* Hiërarchie: het bedrag is waar het oog begint, daarna het
              lijstje, dan de belofte. */}
          <div style={{
            fontSize: isMobile ? '1.75rem' : '2.8rem', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1, textAlign: 'center',
            maxWidth: 820, margin: '0 auto',
          }}>
            <span style={{ color: GOLD }}>€300 inleg</span>, die je terug krijgt.
          </div>

          {/* Eén regel: de drie manieren om je inleg terug te krijgen, met
              'of' ertussen. Zelfde vorm als de knoppen op het eerste scherm:
              icoon boven een bold wit woord. */}
          {/* Een streep in plaats van een kopje: hij scheidt de zin van de
              drie voorwaarden zonder zelf gelezen te willen worden. */}
          <div style={{
            width: isMobile ? 120 : 180, height: 1,
            margin: `${isMobile ? '1.25rem' : '1.75rem'} auto 0`,
            background: 'rgba(255,255,255,0.35)',
          }} />

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? '0.9rem' : '2.75rem',
            marginTop: isMobile ? '1rem' : '1.25rem',
          }}>
            {GARANTIE_KAARTEN.map((g, n) => (
              <Fragment key={g.kop}>
                {n > 0 && (
                  <span style={{
                    fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 800,
                    color: 'rgba(255,255,255,0.25)', alignSelf: isMobile ? 'center' : 'flex-start',
                    marginTop: isMobile ? 0 : 14,
                  }}>
                    of
                  </span>
                )}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: isMobile ? 7 : 10, textAlign: 'center',
                  width: isMobile ? '100%' : 300,
                }}>
                  <g.Icon size={isMobile ? 24 : 34} strokeWidth={2.6} color="#fff" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: isMobile ? '0.9rem' : '1.15rem', fontWeight: 900,
                    color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2,
                    whiteSpace: isMobile ? 'normal' : 'nowrap',
                  }}>
                    {g.kop}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          <p style={{
            margin: `${isMobile ? '2rem' : '3rem'} auto ${isMobile ? '0.5rem' : '1rem'}`,
            marginTop: 'auto',
            maxWidth: 900, width: '100%', textAlign: 'center',
            paddingTop: isMobile ? '1.25rem' : '1.75rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: isMobile ? '1.2rem' : '1.75rem', fontWeight: 900,
            color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.25,
          }}>
            {/* Eén regel: afbreken haalt de klap uit de zin. */}
            <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
              Mijn doel: serieuze mannen gratis serieus resultaat laten zien.
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

// ── Blad dat vanaf de onderkant openschuift ──────────────────────────────────
// Zelfde vorm als het blad in het log-scherm van de app: de pagina erachter
// vervaagt, het blad komt van onderen omhoog en groeit mee met zijn inhoud tot
// 80% van het scherm. Bewust lokaal en niet geïmporteerd uit de app-modules:
// dit is een publieke verkooppagina die op zichzelf moet staan.
function Blad({ open, titel, onClose, isMobile, children }) {
  if (!open) return null
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        // Op telefoon schuift hij van onder in beeld, op desktop staat hij
        // midden op het scherm: daar is onderaan plakken alleen maar ver weg.
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
        animation: 'bladWaas 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: BG,
        borderRadius: isMobile ? '18px 18px 0 0' : 18,
        border: '1px solid rgba(255,255,255,0.1)',
        borderBottom: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
        maxHeight: isMobile ? '80vh' : '84vh',
        display: 'flex', flexDirection: 'column',
        animation: `${isMobile ? 'bladOmhoog' : 'bladIn'} 0.28s cubic-bezier(0.22, 1, 0.36, 1)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '1rem 1.15rem' : '1.1rem 1.35rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            {titel}
          </span>
          <button
            onClick={onClose}
            aria-label="Sluit"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '0.9rem 1.15rem' : '1rem 1.35rem',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
          textAlign: 'left',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Trustpilot-badge — identiek aan /16week ──────────────────────────────────
function TrustpilotBadge({ size = 'sm', style }) {
  const fs = size === 'lg' ? '0.7rem' : '0.65rem'
  const star = size === 'lg' ? 12 : 11
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
      </svg>
      <span style={{ fontSize: fs, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
      <span style={{ fontSize: fs, fontWeight: 800, color: '#fff' }}>4.8</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(s => (
          <svg key={s} width={star} height={star} viewBox="0 0 24 24" fill={TP_GREEN}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  )
}

export default function SixWeekChallengeCheckout({ termijnen = false }) {
  const variant = termijnen ? VARIANT.termijnen : VARIANT.eenmalig
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef(null)
  const containerRef = useRef(null)
  const offerRef = useRef(null)
  const formRef = useRef(null)
  // Wat er onder de twee knoppen openklapt: 'methode', 'voorwaarden' of niets.
  const [open, setOpen] = useState(null)
  // Volledig scherm: handig als je de pagina op een groot scherm laat zien.
  const [volledig, setVolledig] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Actieve sectie bijhouden voor de nav-dots.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(container.children).indexOf(entry.target)
            if (idx >= 0) setCurrent(idx)
          }
        })
      },
      { root: container, threshold: 0.55 }
    )
    Array.from(container.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Basis voor elke sectie: één scherm hoog, inhoud verticaal gecentreerd.
  const screen = {
    scrollSnapAlign: 'start',
    minHeight: isMobile ? '100dvh' : '100vh',
    background: BG,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: isMobile ? '3.5rem 1.25rem' : '4rem 3rem',
    position: 'relative',
  }

  // Auto-scroll review carousel — same vibe as the other checkout pages.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId, pos = 0
    const speed = 0.4
    const scroll = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(scroll)
    }
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }
    animId = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume)
    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
    }
  }, [])

  useEffect(() => {
    const kijk = () => setVolledig(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', kijk)
    return () => document.removeEventListener('fullscreenchange', kijk)
  }, [])

  const wisselVolledig = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const handleCheckout = async () => {
    if (!name || !email) {
      setError('Vul je naam en e-mail in')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: variant.plan,
          price: PRICE,
          priceId: variant.priceId,
          mode: variant.mode,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          // Na betaling meteen door naar de intake, niet naar /success.
          successPath: '/myintake',
          cancelPath: variant.cancelPath,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      if (data.sessionId) {
        const stripe = window.Stripe(STRIPE_PK)
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const doubledSlides = [...SLIDES, ...SLIDES]

  return (
    <div style={{ background: BG }}>
      <div
        ref={containerRef}
        style={{
          // Zachte snap-scroll: glijdt naar de dichtstbijzijnde sectie zodra je
          // in de buurt komt (proximity houdt je nergens vast — belangrijk op
          // een checkout met een formulier).
          height: isMobile ? '100dvh' : '100vh',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity', scrollBehavior: 'smooth',
          background: BG, color: '#fff',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >

        {/* ══ SCHERM 1: OFFER ══ */}
        <section ref={offerRef} style={{ ...screen, textAlign: 'center', padding: 0, justifyContent: 'flex-start' }}>
          {/* Foto bovenaan die onderin dood loopt in het zwart; de kop valt er
              net overheen. Zelfde truc als de koppen in de app. */}
          {/* Het vak heeft dezelfde verhouding als de foto (1200x600, dus 2:1),
              want anders sneed cover er op desktop meer dan de helft af: een
              venster van 1440 breed en 300 hoog is 4,8:1. Op desktop begrenzen
              we de breedte, zodat de hoogte binnen het scherm blijft. */}
          {/* Op desktop loopt de foto van rand tot rand; de hoogte is
              begrensd zodat de kop eronder nog in beeld valt. Op telefoon
              houden we de echte 2:1-verhouding aan, daar past hij precies. */}
          {/* De herofoto draagt het logo en de titel al, dus die staan niet
              meer als tekst in de pagina. Vaste verhouding 49:15 (1960x600),
              zodat er niets wordt bijgesneden. */}
          <div style={{
            position: 'relative', width: '100%',
            margin: 0,
            aspectRatio: '49 / 15',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/6week-challenge-hero.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center 45%',
            }} />
            {/* Klein randje naar zwart onderaan, zodat de foto niet met een
                harde lijn eindigt. */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: '14%', pointerEvents: 'none',
              background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${BG} 100%)`,
            }} />
          </div>

          <div style={{
            maxWidth: isMobile ? 520 : 1100, width: '100%',
            // Negatieve marge: de kop schuift over de onderkant van de foto,
            // maar houdt afstand tot het beeld.
            marginTop: isMobile ? '1.5rem' : '2.5rem',
            padding: isMobile ? `0 1.25rem 3.5rem` : `0 2rem 4rem`,
            position: 'relative', zIndex: 2,
          }}>
            {/* Logo en kop stonden hier; die staan nu op de herofoto zelf. */}

            {/* Twee knoppen: de methode en de voorwaarden. Geen omlijnde
                vakken meer maar een icoon met het woord eronder; het scherm
                oogde te druk met alles in een container. */}
            {/* Drie gelijke kolommen, samen ongeveer zo breed als de titel op
                het beeld erboven. */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '0.75rem' : '1.5rem',
              width: '100%',
              maxWidth: isMobile ? '100%' : 980,
              margin: `${isMobile ? 0 : '1.5rem'} auto 0`,
            }}>
              {[
                { id: 'methode', label: 'De methode', Icon: Compass },
                { id: 'voorwaarden', label: 'De voorwaarden', Icon: ListChecks },
                { id: 'waarom', label: 'Waarom doe ik dit?', Icon: HelpCircle },
              ].map((k) => {
                const aan = open === k.id
                return (
                  <button
                    key={k.id}
                    onClick={() => setOpen(aan ? null : k.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: isMobile ? 9 : 18,
                      padding: 0, border: 'none', background: 'transparent',
                      color: '#fff', opacity: aan ? 1 : 0.9,
                      fontSize: isMobile ? '0.75rem' : '1.4rem', fontWeight: 900,
                      letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <k.Icon size={isMobile ? 32 : 68} strokeWidth={2.6} color="#fff" />
                    {k.label}
                  </button>
                )
              })}
            </div>

          </div>
        </section>

        {/* ══ SCHERM 2: FORMULIER + REVIEWS ══ */}
        <section ref={formRef} style={{ ...screen, justifyContent: 'center', padding: isMobile ? '3.5rem 1.25rem' : '5rem 2rem' }}>
          <div style={{ maxWidth: 520, width: '100%' }}>
            {/* De twee garanties onder elkaar, met een icoon ervoor. */}
            <div style={{
              margin: isMobile ? '0 auto 1.75rem' : '0 auto 2.25rem',
              maxWidth: 480, width: '100%', textAlign: 'left',
            }}>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
                letterSpacing: '0.15em', color: GOLD,
                marginBottom: isMobile ? '0.6rem' : '0.75rem', textAlign: 'center',
              }}>
                EXTRA GARANTIES
              </div>
              {[
                { Icon: Clock, tekst: 'Binnen 7 dagen niet tevreden? Geld terug.' },
                { Icon: BadgeEuro, tekst: 'Vind je tijdens de 6 weken dat je geen €297 aan coaching waarde krijgt? Geld terug.' },
              ].map((r, i) => (
                <div key={r.tekst} style={{
                  display: 'flex', gap: '0.7rem',
                  alignItems: 'center', justifyContent: 'center',
                  padding: isMobile ? '0.7rem 0' : '0.8rem 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {/* Zelfde stijl als de drie knoppen: bold en wit. */}
                  <r.Icon
                    size={isMobile ? 20 : 22} strokeWidth={2.4}
                    style={{ flexShrink: 0, color: '#fff' }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
                    textAlign: 'center',
                  }}>{r.tekst}</span>
                </div>
              ))}
            </div>

            <div style={{
              borderRadius: isMobile ? 16 : 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
            }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: 800, color: '#fff', marginBottom: '1rem',
              }}>Jouw gegevens</div>

              {[
                { icon: User,  value: name,  set: setName,  placeholder: 'Je naam',                      type: 'text' },
                { icon: Mail,  value: email, set: setEmail, placeholder: 'Je e-mailadres',               type: 'email' },
                { icon: Phone, value: phone, set: setPhone, placeholder: 'Je telefoonnummer (optioneel)', type: 'tel' },
              ].map((field, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.05)',
                  marginBottom: '0.6rem',
                }}>
                  <field.icon size={16} color="rgba(255,255,255,0.55)" strokeWidth={2} />
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: 500, fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}

              {error && (
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#ef4444', fontWeight: 600,
                  marginBottom: '0.75rem', marginTop: '0.25rem',
                }}>{error}</div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.1rem',
                  borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.4)' : '#fff',
                  color: '#000',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '0.5rem', minHeight: 52,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(255,255,255,0.15)',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  letterSpacing: '0.01em', fontFamily: 'inherit',
                }}
              >
                {loading ? 'Even geduld...' : variant.knop}
              </button>

              {/* Alleen bij termijnen: wat je precies betaalt en wanneer. Dit
                  hoort vlak bij de knop te staan, niet in de kleine lettertjes. */}
              {variant.prijsRegel && (
                <div style={{
                  marginTop: '0.7rem', padding: isMobile ? '0.65rem 0.8rem' : '0.75rem 0.9rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, textAlign: 'center',
                }}>
                  {variant.prijsRegel}
                </div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.4rem', marginTop: '0.85rem',
              }}>
                <Lock size={12} color="rgba(255,255,255,0.25)" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.25)', fontWeight: 500,
                }}>Veilig betalen via Stripe · SSL beveiligd</span>
              </div>
            </div>

            {/* ══ Reviews en transformaties — onderaan, na het formulier ══ */}
            <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
              <TrustpilotBadge style={{ margin: isMobile ? '1rem 0' : '1.25rem 0' }} />

              <div
                ref={scrollRef}
                style={{
                  display: 'flex', gap: isMobile ? '0.75rem' : '1rem',
                  overflow: 'hidden', cursor: 'grab',
                  marginLeft: isMobile ? '-1.25rem' : '-2rem',
                  marginRight: isMobile ? '-1.25rem' : '-2rem',
                  paddingLeft: isMobile ? '1.25rem' : '2rem',
                  paddingRight: isMobile ? '1.25rem' : '2rem',
                }}
              >
                {doubledSlides.map((slide, idx) => (
                  <div key={idx} style={{
                    minWidth: isMobile ? 240 : 280, maxWidth: isMobile ? 240 : 280,
                    padding: slide.soort === 'foto'
                      ? (isMobile ? '0.6rem' : '0.7rem')
                      : (isMobile ? '0.85rem 1rem' : '1rem 1.15rem'),
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {slide.soort === 'foto' ? (
                      <>
                        {/* Contain en een maximum: de before/after-collage mag
                            niet bijgesneden worden, maar ook de slider niet
                            drie keer zo hoog maken als een review. */}
                        <div style={{ borderRadius: 9, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={slide.src}
                            alt={slide.caption}
                            draggable={false}
                            onError={(e) => { e.currentTarget.style.opacity = 0 }}
                            style={{
                              maxWidth: '100%', maxHeight: isMobile ? 170 : 195,
                              width: 'auto', height: 'auto', display: 'block',
                            }}
                          />
                        </div>
                        <p style={{
                          margin: '0.5rem 0 0',
                          fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 700,
                          color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, textAlign: 'center',
                        }}>
                          {slide.caption}
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 2, marginBottom: '0.5rem' }}>
                          {[1,2,3,4,5].map(ster => (
                            <Star key={ster} size={11} fill={TP_GREEN} color={TP_GREEN} strokeWidth={0} />
                          ))}
                        </div>
                        <p style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255,255,255,0.45)', fontWeight: 500,
                          lineHeight: 1.5, marginBottom: '0.6rem',
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{slide.text}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#fff', border: `1px solid ${TP_GREEN}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 800, color: TP_GREEN,
                            }}>{slide.name.charAt(0)}</div>
                            <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                              {slide.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{slide.date}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Zwevende knop naar het formulier: staat onderaan het scherm in
          plaats van in de tekst, en verdwijnt zodra je bij het formulier bent
          of een blad opent. */}
      <button
        onClick={scrollToForm}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? '1.25rem' : '1.75rem'})`,
          transform: 'translateX(-50%)',
          zIndex: 90,
          opacity: current === 0 && !open ? 1 : 0,
          pointerEvents: current === 0 && !open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.85rem 1.7rem' : '0.95rem 2rem',
          borderRadius: 999, border: 'none',
          background: '#fff', color: '#000',
          fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 24px rgba(255,255,255,0.12)',
          letterSpacing: '0.01em', whiteSpace: 'nowrap',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          fontFamily: 'inherit',
        }}
      >
        {variant.balkKnop} <ChevronDown size={16} strokeWidth={3} />
      </button>

      {/* Volledig scherm — linksboven, zodat hij nergens overheen valt. */}
      <button
        onClick={wisselVolledig}
        title={volledig ? 'Volledig scherm verlaten' : 'Volledig scherm'}
        aria-label={volledig ? 'Volledig scherm verlaten' : 'Volledig scherm'}
        style={{
          position: 'fixed',
          left: isMobile ? 10 : 20,
          top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 10 : 20}px)`,
          zIndex: 120,
          width: 36, height: 36, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 10,
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer', fontFamily: 'inherit',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {volledig ? <Minimize2 size={16} strokeWidth={2.6} /> : <Maximize2 size={16} strokeWidth={2.6} />}
      </button>

      {/* ══ Nav-dots — zoals /16week ══ */}
      <div style={{
        position: 'fixed',
        right: isMobile ? '10px' : '22px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        zIndex: 100,
      }}>
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i)
              containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              width: current === i ? '9px' : '5px',
              height: current === i ? '9px' : '5px',
              borderRadius: '50%',
              background: current === i ? GOLD : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
              boxShadow: current === i ? '0 0 8px rgba(255,186,9,0.5)' : 'none',
            }}
            aria-label={`Ga naar sectie ${i + 1}`}
          />
        ))}
      </div>

      {/* De methode — schermvullend, één pijler per slide. */}
      {open === 'methode' && (
        <MethodeSlider isMobile={isMobile} onClose={() => setOpen(null)} />
      )}

      {/* De voorwaarden — schermvullend, zelfde opzet als de methode-slides. */}
      {open === 'voorwaarden' && (
        <VoorwaardenVenster isMobile={isMobile} onClose={() => setOpen(null)} />
      )}


      {/* Waarom doe ik dit — foto rechts, twee redenen links. */}
      <Blad open={open === 'waarom'} titel="Waarom doe ik dit?" onClose={() => setOpen(null)} isMobile={isMobile}>
        <div style={{
          position: 'relative',
          margin: isMobile ? '-0.9rem -1.15rem 0' : '-1rem -1.35rem 0',
          minHeight: isMobile ? 250 : 290,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%',
            backgroundImage: 'url(/waarom-kersten.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center top',
          }} />
          {/* Fade naar links, zodat de tekst over de foto heen kan lopen. */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(270deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 18%, rgba(0,0,0,0.88) 38%, #000 54%)',
          }} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%',
            paddingLeft: isMobile ? '1.15rem' : '1.35rem',
            paddingRight: isMobile ? '40%' : '42%',
            paddingTop: isMobile ? '1.1rem' : '1.35rem',
            paddingBottom: isMobile ? '1.1rem' : '1.35rem',
          }}>
            {[
              'Ik wil je met een korte termijn doel laten zien dat mijn aanpak voor jou werkt, om je vervolgens met vol vertrouwen naar je uiteindelijke doel te begeleiden.',
              'Om de drempel naar coaching voor mannen laag te maken, zodat ze instappen en inzien hoe het alles voor hen kan veranderen.',
            ].map((tekst, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.6rem', alignItems: 'baseline',
                padding: isMobile ? '0.7rem 0' : '0.8rem 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{
                  flexShrink: 0,
                  fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: GOLD,
                }}>{i + 1}.</span>
                <span style={{
                  fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, letterSpacing: '-0.01em',
                  textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                }}>{tekst}</span>
              </div>
            ))}
          </div>
        </div>
      </Blad>

      <style>{`
        /* @import moet als eerste regel staan, anders negeert de browser 'm
           en valt het lettertype terug op de systeemfont. */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes bladWaas { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bladOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bladIn { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes pijlerIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }
        body { overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
