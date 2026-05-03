// ========================================
// 📁 src/lead-magnet/components/ReviewsSection.jsx
// All 6 Trustpilot reviews — premium dark style
// ========================================
import { useState, useEffect, useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const G = '#ffba09'

const REVIEWS = [
  {
    name: 'Hessel',
    photo: null,
    date: '4 dagen geleden',
    title: 'Fijn en succesvol traject',
    text: 'Ik was al lang van plan om wat af te vallen en wat fitter te worden, gespierd was voor mij niet nodig. Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. Iedere week wegen, videobellen en daarin mijn voortgang bespreken. Kersten geeft niet alleen om jouw fysieke vooruitgangen. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf in gewicht. Ik ben van 79,8 naar 74,4 gegaan tijdens dit traject van 8 weken. Het doel was 75kg en dat is door een gebalanceerd plan goed gelukt. Geen vaste gerechten die je moet eten. Alleen wel een duw in de goeie richting, je krijgt gerechten die je kan proberen maar niks is verplicht, als jij je aan het plan houd zal Kersten altijd de volle 100% geven!'
  },
  {
    name: 'Me',
    photo: null,
    date: '2 dec 2025',
    title: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan',
    text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls om te kijken hoe je er nu voor staat. Ook kan je makkelijk contact opnemen als je ergens tegen aan loopt of als je vragen hebt.'
  },
  {
    name: 'Indi',
    photo: null,
    date: '1 dec 2025',
    title: 'Myarc is super!',
    text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb. Daarnaast motiveert hij me heel erg bij het sporten, en hebben we afspraken gemaakt waardoor ik het makkelijk kan volhouden en me fitter voel. Zijn begeleiding is professioneel, persoonlijk, betrouwbaar en veel lachen natuurlijk (wanneer dat kan) bijv. in de wekelijkse calls. Ik ben echt tevreden en kan Myarc aan iedereen aanraden die op zoek is naar goede en leuke ondersteuning op het gebied van voeding en sport.'
  },
  {
    name: 'Toon',
    photo: null,
    date: '5 nov 2025',
    title: 'Super Coach',
    text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!'
  },
  {
    name: 'Sassus',
    photo: '/review-sassus.png',
    date: '5 nov 2025',
    title: 'Na 100 mislukte pogingen',
    text: 'Na 100 mislukte pogingen van "crash" diëten, maandag begin ik echt, na de vakantie ga ik het echt volhouden tot aan de eerste week 1000% ervoor gaan en ik kan het wel alleen, wilde ik mijzelf nog 1 kans geven. Dit keer met hulp van iemand die er verstand van heeft en mij kan blijven motiveren in de moeilijke situaties. Met de energie die ik krijg van Kersten, zijn enthousiasme en motiverende gesprekken is het mij gelukt om een routine te creëren waarbij ik krachttrainingen en een voedingsschema kan inpassen waar ik mij goed bij voel en die ik kan continueren. Niet alleen bij het fysieke gedeelte maar ook het mentale stukje heeft Kersten mij goed geholpen. Kersten is een gespecialiseerde coach die je jezelf laat verbazen over wat je kan bereiken.'
  },
  {
    name: 'Consumer',
    photo: '/review-consumer.png',
    date: '3 nov 2025',
    title: 'Zeer professionele aanpak!',
    text: 'Zeer professionele aanpak! Kersten geeft alles duidelijk en gestructureerd weer in een overzichtelijke app, waarin je niet alleen je voeding, maar ook je slaap, trainingen en algemene voortgang kunt bijhouden. Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten. Dankzij zijn persoonlijke begeleiding en deskundige aanpak blijf je gemotiveerd en zie je echt resultaat. Een absolute aanrader voor wie op een duurzame en verantwoorde manier fitter wil worden!'
  }
]

export default function ReviewsSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const [expanded, setExpanded] = useState({})
  const ref = useRef(null)

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true)
    }, { threshold: 0.1 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])

  const MAX_CHARS = 160

  return (
    <section ref={ref} style={{
      background: '#0a0a0a',
      padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${G}40, transparent)`
      }} />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header — Trustpilot style */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.3rem'
          }}>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: '900',
              color: '#fff'
            }}>4.8</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={16} fill="#FFD700" color="#FFD700" />
              ))}
            </div>
          </div>
          <p style={{
            fontSize: isMobile ? '0.72rem' : '0.78rem',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: '600'
          }}>Beoordeeld op Trustpilot</p>
        </div>

        {/* Review cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {REVIEWS.map((r, i) => {
            const isLong = r.text.length > MAX_CHARS
            const isExpanded = expanded[i]
            const displayText = isLong && !isExpanded
              ? r.text.slice(0, MAX_CHARS) + '...'
              : r.text

            return (
              <div key={i} style={{
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: isMobile ? '1rem' : '1.25rem',
                position: 'relative',
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateY(0)' : 'translateY(25px)',
                transition: `all 0.7s ease ${0.2 + i * 0.1}s`
              }}>
                {/* Quote icon */}
                <Quote
                  size={isMobile ? 18 : 22}
                  color={G}
                  style={{
                    position: 'absolute',
                    top: isMobile ? '1rem' : '1.25rem',
                    right: isMobile ? '1rem' : '1.25rem',
                    opacity: 0.12
                  }}
                />

                {/* Person header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '0.6rem'
                }}>
                  {/* Photo or initial */}
                  <div style={{
                    width: isMobile ? '38px' : '44px',
                    height: isMobile ? '38px' : '44px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `2px solid ${G}30`,
                    background: r.photo ? 'none' : `linear-gradient(135deg, ${G}, #D4B85A)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {r.photo ? (
                      <img
                        src={r.photo}
                        alt={r.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.style.background = `linear-gradient(135deg, ${G}, #D4B85A)`
                          e.target.parentElement.innerHTML = `<span style="color:#fff;font-size:0.75rem;font-weight:800">${r.name.charAt(0)}</span>`
                        }}
                      />
                    ) : (
                      <span style={{
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>{r.name.charAt(0)}</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.88rem' : '0.95rem',
                        fontWeight: '800',
                        color: '#fff'
                      }}>{r.name}</span>
                      <span style={{
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.25)',
                        fontWeight: '500'
                      }}>{r.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '0.15rem' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} fill="#FFD700" color="#FFD700" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div style={{
                  fontSize: isMobile ? '0.82rem' : '0.88rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.35rem'
                }}>{r.title}</div>

                {/* Review text */}
                <p style={{
                  fontSize: isMobile ? '0.76rem' : '0.82rem',
                  color: 'rgba(255,255,255,0.45)',
                  fontWeight: '450',
                  lineHeight: 1.55,
                  margin: 0
                }}>{displayText}</p>

                {/* Read more */}
                {isLong && (
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [i]: !isExpanded }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: G,
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '0.35rem 0 0',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isExpanded ? 'Minder tonen' : 'Lees meer'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
