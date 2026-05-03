// src/funnel/components/ObjectieHandlingSection.jsx
// Section 7 - Complete Objectie Handling System
// Based on complete sales script with 5 categories
import { useState, useEffect } from 'react'
import { 
  Clock,
  DollarSign,
  Users,
  Target,
  Brain,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Zap,
  Activity,
  Heart
} from 'lucide-react'

export default function ObjectieHandlingSection({ isMobile: propIsMobile }) {
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [activeCategory, setActiveCategory] = useState('tijd')
  const [expandedScript, setExpandedScript] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Complete objectie categorieën met scripts uit document
  const categories = {
    tijd: {
      title: 'Tijd Bezwaren',
      icon: Clock,
      color: '#ffba09',
      clientMessage: 'Weet dat iedereen 24 uur heeft. Het gaat om prioriteiten.',
      scripts: [
        {
          situation: '"Nu is niet het juiste moment" / "Het is een druk seizoen"',
          response: [
            '💬 "Dus wanneer je niet druk bent ga je het doen?"',
            '→ "Ja"',
            '',
            '💬 "Betekent dat je nooit meer druk bent voor de rest van je leven?"',
            '→ "Nee"',
            '',
            '💬 "Daarom! Als je met onze ondersteuning leert hoe je dit doet in drukke periodes,',
            '   dan kun je het ALTIJD doen, niet alleen als het rustig is."',
            '',
            '💬 "Daarbij heb je in drukke periodes juist MEER energie nodig."',
            '   "Zou het dan niet slim zijn om juist NU te werken aan je gezondheid?"',
            '',
            '✅ TOOLS BENADRUKKEN:',
            '   - Wij helpen je tijd BESPAREN met efficiënte workouts',
            '   - Meal prep in 4 uur per week',
            '   - 3x 45min per week = resultaat'
          ],
          outcome: 'Reframe: Drukke periode is juist de BESTE tijd om te starten'
        },
        {
          situation: '"Ik heb geen tijd in mijn dag"',
          response: [
            '💬 "Ik zei dat ook altijd tegen mezelf... tot mijn vriendin vroeg:',
            '   Hoeveel uur per dag zit je op YouTube?"',
            '',
            '💬 "Denk je dat er mensen zijn met MINDER tijd dan jij, die WEL sporten?"',
            '→ "Ja"',
            '',
            '💬 "Als zij het kunnen, kan jij het ook. Iedereen heeft 24 uur."',
            '   "Vaak is het probleem niet TIJD maar wat we doen met onze tijd."',
            '',
            '💬 "Mag ik vragen: Hoeveel uur per dag ben je op je telefoon?"',
            '→ [Laat zien]',
            '→ [STILTE - Laat het beseffen]',
            '',
            '📊 BREAKDOWN:',
            '   - 3x 45min workouts = 3 uur per week',
            '   - Meal prep 1x per week = 2 uur',
            '   - TOTAAL: 5 uur per week (1% van je week)',
            '',
            '💬 "Succesvolle mensen focussen op belangrijke zaken."',
            '   "Wij gaan alle rompslomp elimineren."',
            '   "Dan heb je zelfs MEER tijd over."'
          ],
          outcome: 'Reframe van "geen tijd" naar "geen prioriteit"'
        },
        {
          situation: '"Als ik meer tijd heb, dan start ik"',
          response: [
            '💬 "Ik begrijp het. Dit hield mij ook jaren tegen."',
            '   "Dit is de Als-Dan Bias."',
            '',
            '💬 "Het is hetzelfde als zeggen:"',
            '   "Als ik me beter voel, ga ik naar het ziekenhuis"',
            '   "Als ik gezonder ben, ga ik naar de sportschool"',
            '',
            '💬 "Snap je? Je wacht op iets dat nooit komt."',
            '',
            '💬 "De reden dat je nu geen tijd hebt, is JUIST waarom je moet starten."',
            '   "Want dan leer je het systeem in je drukke leven te integreren."',
            '',
            '⚡ "Wachten = Nooit beginnen."'
          ],
          outcome: 'Doorbreek Als-Dan cyclus'
        }
      ]
    },
    prijs: {
      title: 'Prijs Bezwaren',
      icon: DollarSign,
      color: '#d4a006',
      clientMessage: 'Investering in jezelf is de beste investering die je kunt maken.',
      scripts: [
        {
          situation: '"Het is te duur" / "Ik vind het veel geld"',
          response: [
            '💬 "Dus het is veel geld voor je?"',
            '→ "Ja"',
            '',
            '💬 "Dat is juist GOED! Voor iedereen is het veel geld."',
            '   "Maar die mensen hebben het gedaan en nu resultaten."',
            '',
            '💬 "Als het veel geld is, ben je EXTRA gemotiveerd om alles eruit te halen."',
            '',
            '💡 WAAROM HET NIET VEEL IS:',
            '',
            '💬 "Als het programma je alleen helpt gezonder te leven en lekker te sporten,',
            '   zou het dan al de moeite waard zijn?"',
            '→ "Ja, dat is al veel waard"',
            '',
            '💬 "Daarbij ga je ook nog 5-8kg spier opbouwen, meer energie,',
            '   minder stress, meer zelfvertrouwen."',
            '   "Is dat niet meer dan €1000 waard?"',
            '→ "Ja eigenlijk wel"',
            '',
            '💬 "Daarbij: 100% GARANTIE dat je je doelen behaalt."',
            '   "Denk je dat het onmogelijk is?"',
            '→ "Nee"',
            '',
            '✅ "Dus als ik het goed begrijp: je vindt het waardevol EN je gelooft erin?"'
          ],
          outcome: 'Van prijs naar waarde reframen'
        },
        {
          situation: '"Waar kies je voor?"',
          response: [
            '💬 "Het geld ga je HOE DAN OOK uitgeven de komende 12 maanden."',
            '',
            '💬 "De vraag is: Geef je het uit aan dingen die niks opleveren,',
            '   of aan iets dat je beter maakt?"',
            '',
            '💬 "Als je kijkt naar de afgelopen 12 maanden:"',
            '   "Heb je toen geld uitgegeven aan dingen die je niet nodig had?"',
            '→ "Ja"',
            '',
            '💬 "Kijk [naam], je gaat SOWIESO de lessen betalen om resultaat te krijgen."',
            '   "De vraag is: Wil je er meer tijd, geld en energie aan kwijt zijn of minder?"',
            '→ "Minder"',
            '',
            '⏱️ "Hoelang ben je al bezig om deze doelen te behalen?"',
            '→ [Bijv: 3 jaar]',
            '',
            '💬 "Je loopt hier dus al 3 jaar mee zonder resultaat..."',
            '   "Wat doet dit met je?"',
            '→ [Emotie]',
            '',
            '💬 "Als ons programma dat oplost, is dat niet meer dan €1000 waard?"',
            '→ "Ja zeker"',
            '',
            '🎯 KEUZE:',
            '   A) Meer tijd en energie verspillen zonder resultaat',
            '   B) Investeren en binnen 6 maanden klaar'
          ],
          outcome: 'Tijd vs Geld reframe'
        },
        {
          situation: '"Ik heb het geld echt niet..."',
          response: [
            '💬 "Ik geef je een voorbeeld:"',
            '   "Stel je krijgt vandaag een dikke rekening van de belastingdienst."',
            '   "Zou je die betalen?"',
            '→ "Ja zeker"',
            '',
            '💬 "Is geld dan echt het probleem?"',
            '→ "Nee"',
            '',
            '💬 "De realiteit is: Je kunt ALTIJD aan geld komen."',
            '',
            '💬 "Als ik tegen jou zou zeggen:"',
            '   "Ik heb een Ferrari die je mag hebben,"',
            '   "Als je binnen 24 uur €10.000 bij elkaar hebt."',
            '   "Zou je het dan bij elkaar krijgen?"',
            '→ "Ja"',
            '',
            '💬 "Dus als het echt nodig is en je wilt het echt, lukt het wel?"',
            '→ "Ja"',
            '',
            '💬 "Ik snap het he, begrijp me niet verkeerd."',
            '   "Ik probeer je alleen te helpen een beslissing te maken',
            '   die je leven kan veranderen."',
            '',
            '💬 "Is het dan niet tijd om ervoor te zorgen dat je het geld',
            '   bij elkaar krijgt en je doelen gaat behalen?"'
          ],
          outcome: 'Vindingrijkheid activeren'
        }
      ]
    },
    waarde: {
      title: 'Waarde Bezwaren',
      icon: Shield,
      color: '#8b6804',
      clientMessage: 'Bewezen systeem met garanties. Resultaten spreken voor zich.',
      scripts: [
        {
          situation: '"Ik weet niet of het werkt..."',
          response: [
            '💬 "Ik begrijp je zorgen. We hebben veel bewijs door resultaten van klanten."',
            '   "Ik durf 100% te zeggen dat het werkt, mits je het werk doet."',
            '',
            '💬 "Welk gedeelte van het programma zie je niet werken?"',
            '→ [Laat resultaten zien van mensen]',
            '→ [Specifiek antwoord]',
            '',
            '💬 "Ik snap het. Het enige dat resultaten voorkomt is dat mensen',
            '   niet het werk doen."',
            '',
            '💬 "Omdat het voor jou een groter bedrag is, ga je er met 100% motivatie',
            '   mee aan de slag. Zie ik dat verkeerd?"',
            '→ "Nee"',
            '',
            '💬 "Als je zeker weet dat je [doelen benoemen] gaat bereiken,',
            '   zou je er dan 100% voor willen gaan?"',
            '→ "Ja"',
            '',
            '✅ "Zou het dan niet de beste keuze zijn om gewoon te starten?"'
          ],
          outcome: 'Bewijs + Commitment check'
        },
        {
          situation: '"Wat als dit programma perfect was?" (Hypothetische Close)',
          response: [
            '💬 "Stel je voor dat het programma perfect was, zou je het dan doen?"',
            '→ "Ja natuurlijk!"',
            '',
            '💬 "Helder. Op welke manier verschilt het programma dan',
            '   van het perfecte programma volgens jou?"',
            '→ "Weet ik niet..."',
            '',
            '💬 "Dus is het programma dan perfect?"',
            '→ "Nee, ik voel dat er iets mist"',
            '',
            '💬 "Waar zit je op een schaal van 1 tot 10,',
            '   hoe perfect het programma aansluit op jou?"',
            '→ "6"',
            '',
            '💬 "Wat zou ervoor nodig zijn om het een 10 te maken?"',
            '→ [Hopelijk noemen ze het nu]',
            '',
            '💬 "Oké, en als we dat erbij zouden doen, zou je het dan wel doen?"',
            '→ "Nee"',
            '',
            '💬 "Oké, dus als ik het goed begrijp:"',
            '   "Je bent niet bang dat het programma slecht is,"',
            '   "Je twijfelt alleen of je er zelf resultaat mee gaat behalen?"',
            '→ "Ja ik twijfel omdat..."',
            '',
            '→ Door naar persoonlijke bezwaren'
          ],
          outcome: 'Ontdek het echte bezwaar'
        }
      ]
    },
    overleg: {
      title: 'Overleg Bezwaren',
      icon: Users,
      color: '#402400',
      clientMessage: 'Dit gaat over jouw lichaam, jouw gezondheid, jouw beslissing.',
      scripts: [
        {
          situation: '"Ik moet met mijn partner overleggen"',
          response: [
            '💬 "Natuurlijk, dat snap ik."',
            '',
            '💬 "Met welk gedeelte denk je dat ze niet akkoord gaan?"',
            '→ [Prijs of iets anders] → Los dat bezwaar op',
            '',
            'OPTIE 1 - WAT ALS ZE NEE ZEGGEN:',
            '',
            '💬 "Stel je voor dat je partner nee zegt, zou je het dan alsnog doen?"',
            '→ "Ja"',
            '💬 "Laten we het dan doen haha"',
            '',
            'OPTIE 2 - SUPPORT VS GOEDKEURING:',
            '',
            '💬 "Je vraagt niet om support maar om goedkeuring?"',
            '→ "Ja"',
            '',
            '💬 "Stel je voor: Over 3 jaar ben je nog steeds out of shape"',
            '   en ga je hen de schuld geven dat je niet mocht starten."',
            '   "Is dat eerlijk?"',
            '→ "Nee"',
            '',
            '💬 "Vraag om support, niet om goedkeuring."',
            '   "Het is JOUW beslissing."',
            '',
            '✅ "Laten we starten. 3 dagen bedenktijd garantie."'
          ],
          outcome: 'Support vs Goedkeuring reframe'
        }
      ]
    },
    persoonlijk: {
      title: 'Persoonlijke Bezwaren',
      icon: Brain,
      color: '#ffba09',
      clientMessage: 'Angst in je hoofd is altijd groter dan in werkelijkheid.',
      scripts: [
        {
          situation: '"Ik moet er even over nadenken"',
          response: [
            '💬 "Dat snap ik goed."',
            '   "Denk je dat meer tijd helpt of heb je meer informatie nodig?"',
            '→ "Meer informatie"',
            '',
            '💬 "Welke informatie mist er?"',
            '',
            '💬 "Laten we eerlijk zijn. Zal ik wat vragen stellen?"',
            '→ "Ja"',
            '',
            '✅ DE VRAGEN SERIE:',
            '',
            '1️⃣ "Geloof je dat dit product je gaat helpen je doelen te bereiken?"',
            '→ "Ja"',
            '',
            '2️⃣ "Geloof je mij op m\'n woord dat ik je ga helpen?"',
            '→ "Ja"',
            '',
            '3️⃣ "Denk je dat het voor jou gaat werken?"',
            '→ "Ja"',
            '',
            '4️⃣ "Kun je [prijs] bij elkaar krijgen?"',
            '→ "Ja"',
            '',
            '💬 "Denk je dan niet dat het de beste beslissing is om te starten?"',
            '',
            'BIJ TWIJFEL:',
            '',
            '💬 "Hoe kun je een geïnformeerde beslissing maken ZONDER het te doen?"',
            '',
            '💬 "Laten we beginnen. Binnen 30 dagen denk je: Dit wil ik niet?"',
            '   "Dan krijg je je geld terug."',
            '',
            '💬 "Als je het MEEMAAKT, weet je of het de juiste beslissing is."'
          ],
          outcome: 'Vragen serie → Geïnformeerde beslissing'
        },
        {
          situation: '"Het gaat te snel, ik ken je net pas"',
          response: [
            '💬 "Hoe lang wil je al in shape zijn?"',
            '→ "Mijn hele leven"',
            '',
            '💬 "Dat lijkt niet op een snelle beslissing."',
            '   "Nu neem je pas actie. Maar je beslist het al LANG."',
            '',
            '💬 "Kwam je naar deze meeting om erover na te denken?"',
            '→ "Nee"',
            '',
            '💬 "Wat je tegenhoudt is ANGST."',
            '   "Maar die is groter in je hoofd dan in werkelijkheid."',
            '',
            '💬 "Waar ben je het meest bang voor?"',
            '→ [Echte bezwaar] → OPLOSSEN'
          ],
          outcome: 'Ontdek echte angst'
        }
      ]
    }
  }

  const currentCategory = categories[activeCategory]

  return (
    <section 
      id="section-7"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)',
        padding: isMobile ? '2.5rem 1rem' : '3.5rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '1000px',
        height: '1000px',
        background: `radial-gradient(circle, ${currentCategory.color}12 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'all 0.5s ease',
        zIndex: 0
      }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
            background: `linear-gradient(135deg, ${currentCategory.color}15 0%, ${currentCategory.color}08 100%)`,
            border: `1px solid ${currentCategory.color}30`,
            borderRadius: '100px',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={isMobile ? 18 : 20} color={currentCategory.color} strokeWidth={2.5} />
            <span style={{
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '700',
              color: currentCategory.color
            }}>
              Sales Objectie Handling
            </span>
          </div>

          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            Nog Even Twijfelen?
          </h2>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '700px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.6
          }}>
            Normaal. Laten we samen kijken wat je tegenhoudt.
          </p>

          {/* Client Message */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: isMobile ? '1rem' : '1.25rem',
            background: `linear-gradient(135deg, ${currentCategory.color}10 0%, ${currentCategory.color}05 100%)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${currentCategory.color}30`,
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
              fontStyle: 'italic',
              position: 'relative',
              zIndex: 1
            }}>
              💡 {currentCategory.clientMessage}
            </p>
          </div>
        </div>

        {/* Category Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          {Object.entries(categories).map(([key, cat]) => {
            const Icon = cat.icon
            const isActive = activeCategory === key
            
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveCategory(key)
                  setExpandedScript(null)
                }}
                style={{
                  padding: isMobile ? '1rem 0.75rem' : '1.25rem 1rem',
                  background: isActive
                    ? `linear-gradient(135deg, ${cat.color}20 0%, ${cat.color}10 100%)`
                    : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isActive ? cat.color + '60' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = cat.color + '40'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: cat.color,
                    opacity: 0.8
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    borderRadius: '10px',
                    background: `${cat.color}18`,
                    border: `1px solid ${cat.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 0 20px ${cat.color}30` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={isMobile ? 20 : 24} color={cat.color} strokeWidth={2.5} />
                  </div>
                  <span style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    fontWeight: '700',
                    color: isActive ? cat.color : 'rgba(255, 255, 255, 0.7)',
                    transition: 'color 0.3s ease',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}>
                    {cat.title}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Scripts */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '1.25rem'
        }}>
          {currentCategory.scripts.map((script, index) => {
            const isExpanded = expandedScript === index
            
            return (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isExpanded ? currentCategory.color + '40' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Top accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: isExpanded ? currentCategory.color : 'transparent',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }} />

                {/* Shine overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Header */}
                <button
                  onClick={() => setExpandedScript(isExpanded ? null : index)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.15rem',
                    fontWeight: '700',
                    color: isExpanded ? currentCategory.color : '#fff',
                    margin: 0,
                    textAlign: 'left',
                    transition: 'color 0.3s ease'
                  }}>
                    {script.situation}
                  </h3>

                  {isExpanded ? (
                    <ChevronDown size={24} color={currentCategory.color} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={24} color="rgba(255, 255, 255, 0.5)" strokeWidth={2.5} />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{
                    padding: isMobile ? '0 1.25rem 1.25rem' : '0 1.5rem 1.5rem',
                    animation: 'slideDown 0.3s ease',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {/* Script Response */}
                    <div style={{
                      padding: isMobile ? '1rem' : '1.25rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '12px',
                      marginBottom: '1rem',
                      border: `1px solid ${currentCategory.color}20`
                    }}>
                      {script.response.map((line, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            color: line.startsWith('💬') || line.startsWith('→')
                              ? 'rgba(255, 255, 255, 0.9)'
                              : line.startsWith('✅') || line.startsWith('💡') || line.startsWith('🎯')
                                ? currentCategory.color
                                : 'rgba(255, 255, 255, 0.7)',
                            marginBottom: line === '' ? '0.75rem' : '0.375rem',
                            fontFamily: 'system-ui',
                            lineHeight: 1.6,
                            paddingLeft: line.startsWith('   ') ? '2rem' : line.startsWith('→') ? '1rem' : 0,
                            fontWeight: line.startsWith('💬') || line.startsWith('✅') ? '600' : '400'
                          }}
                        >
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>

                    {/* Outcome */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: isMobile ? '0.875rem' : '1rem',
                      background: `linear-gradient(135deg, ${currentCategory.color}15 0%, ${currentCategory.color}08 100%)`,
                      borderRadius: '12px',
                      border: `1px solid ${currentCategory.color}30`
                    }}>
                      <CheckCircle size={20} color={currentCategory.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          marginBottom: '0.25rem'
                        }}>
                          Outcome
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.875rem' : '0.95rem',
                          color: currentCategory.color,
                          fontWeight: '600'
                        }}>
                          {script.outcome}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Universal Close */}
        <div style={{
          marginTop: isMobile ? '2rem' : '2.5rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 186, 9, 0.3)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 50%, #8b6804 100%)'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '12px',
              background: 'rgba(255, 186, 9, 0.2)',
              border: '1px solid rgba(255, 186, 9, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 20px rgba(255, 186, 9, 0.3)'
            }}>
              <Zap size={isMobile ? 24 : 28} color="#ffba09" strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#ffba09',
                marginBottom: '0.75rem'
              }}>
                "Daarom Moet Je Het Juist Doen!"
              </h3>

              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.7
              }}>
                <p style={{ margin: '0 0 0.75rem' }}>
                  <strong style={{ color: '#ffba09' }}>Dit werkt op ALLES:</strong>
                </p>
                <ul style={{
                  margin: 0,
                  padding: '0 0 0 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <li>
                    <strong>Geen tijd?</strong> Daarom juist! → Leer in minder tijd resultaat behalen
                  </li>
                  <li>
                    <strong>Geen geld?</strong> Daarom juist! → "Ik kan het niet betalen" verdwijnt
                  </li>
                  <li>
                    <strong>Geen [X]?</strong> Daarom juist! → Hoelang blijft dit je tegenhouden?
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
