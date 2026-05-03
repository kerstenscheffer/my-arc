// src/intake/ThankYouPage.jsx
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, ChevronLeft, ChevronRight, Star, BookOpen, Calendar } from 'lucide-react'

const G = '#C9A84C'
const GD = '#B8973F'
const VIDEO_URL = new URL('/welkom-video.mp4', import.meta.url).href
const EBOOK_URL = 'https://drive.google.com/file/d/1GFqsDcwYAuF6_xX37NjIp4CS57wCbpf1/view?usp=drive_link'
const CALENDLY_URL = 'https://calendly.com/kerstenscheffer/call-met-kersten'

const TRANSFORMATIONS = [
  { name: 'Janice', result: '-10,1 kg' },
  { name: 'Patrick', result: '-12,0 kg' },
  { name: 'Client 3', result: '-24,5 kg' },
  { name: 'Client 4', result: '-16,8 kg' },
  { name: 'Client 5', result: '-11,8 kg' },
  { name: 'Client 6', result: '-8,3 kg' }
]

const REVIEWS = [
  { name: 'Hessel', date: 'dec 2025', text: 'Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf. Van 79,8 naar 74,4 in 8 weken!' },
  { name: 'Me', date: 'dec 2025', text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls om te kijken hoe je er nu voor staat.' },
  { name: 'Indi', date: 'dec 2025', text: 'Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb. Professioneel, persoonlijk, betrouwbaar en veel lachen natuurlijk. Ik kan Myarc aan iedereen aanraden!' },
  { name: 'Toon', date: 'nov 2025', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'Sassus', date: 'nov 2025', text: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal.' },
  { name: 'Consumer', date: 'nov 2025', text: 'Zeer professionele aanpak! Alles duidelijk en gestructureerd in een overzichtelijke app. Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten.' }
]

export default function ThankYouPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a' }}>
      <HeroBlock m={isMobile} />
      <TransformationsBlock m={isMobile} />
      <EbookBlock m={isMobile} />
      <ReviewsBlock m={isMobile} />
    </div>
  )
}

/* ═══════════════════════════════════════
   1. HERO — Tekst links, video rechts
   ═══════════════════════════════════════ */
function HeroBlock({ m }) {
  return (
    <section style={{ padding: m ? '2rem 1.25rem 2.5rem' : '3.5rem 2rem 4rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: m ? '1.25rem' : '3rem', alignItems: 'flex-start', flexDirection: m ? 'column' : 'row' }}>

        {/* Tekst */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: m ? '0.8rem' : '1rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.4rem' }}>TOP! 🎉</p>
          <h1 style={{ fontSize: m ? '2.2rem' : '4.5rem', fontWeight: '900', lineHeight: 0.95, margin: '0 0 1rem', letterSpacing: '-0.03em' }}>
            <span style={{ display: 'block' }}>WE</span>
            <span style={{ display: 'block' }}>ZIJN</span>
            <span style={{ display: 'block' }}>BIJNA</span>
            <span style={{ display: 'block', color: G }}>KLAAR.</span>
          </h1>
          <p style={{ fontSize: m ? '0.9rem' : '1.1rem', color: '#555', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            Herinnering: Houdt je SMS en WhatsApp in de gaten of plan hier direct je kennismakingsgesprek in!
          </p>

          {/* Calendly button — blauw */}
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: m ? '0.5rem' : '0.6rem',
            padding: m ? '0.8rem 1.25rem' : '1rem 2rem',
            background: '#2563eb',
            color: '#fff', borderRadius: '10px', fontSize: m ? '0.85rem' : '1rem',
            fontWeight: '800', textDecoration: 'none', textTransform: 'uppercase', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(37,99,235,0.3)'
          }}>
            PLAN DIRECT IN
            <div style={{ width: m ? '28px' : '34px', height: m ? '28px' : '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={m ? 14 : 18} color="#fff" />
            </div>
          </a>

          <p style={{ fontSize: m ? '0.72rem' : '0.8rem', color: '#999', lineHeight: 1.5, margin: '0.75rem 0 0' }}>
            * Als je het ons niet laat weten, nemen wij binnen 1 uur contact met je op met een vaste datum en tijd.
          </p>

          {/* Desktop-only tekst */}
          {!m && (
            <>
              <div style={{ width: '50px', height: '2px', background: `linear-gradient(90deg, ${G}, transparent)`, margin: '2rem 0 1.25rem' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.4rem' }}>Bekijk daarna de korte video voor de volgende stap</p>
              <p style={{ fontSize: '1rem', color: '#555', margin: 0 }}>Ps. Verder naar beneden heb ik nog een verrassing voor je 🎁</p>
            </>
          )}
        </div>

        {/* Video */}
        <div style={{
          width: m ? '70%' : '38%',
          flexShrink: 0,
          margin: m ? '0 auto' : 0
        }}>
          <div style={{ borderRadius: m ? '12px' : '16px', overflow: 'hidden', boxShadow: '0 6px 30px rgba(0,0,0,0.1)' }}>
            <video controls playsInline preload="metadata" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <source src={VIDEO_URL} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {/* Mobile-only tekst onder video */}
      {m && (
        <div style={{ marginTop: '1.25rem' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 0.25rem' }}>Bekijk daarna de korte video voor de volgende stap</p>
          <p style={{ fontSize: '0.88rem', color: '#555', margin: 0 }}>Ps. Verder naar beneden heb ik nog een verrassing voor je 🎁</p>
        </div>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════
   2. TRANSFORMATIES — Slider
   ═══════════════════════════════════════ */
function TransformationsBlock({ m }) {
  const ref = useRef(null)
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })

  return (
    <section style={{ background: '#f0f0f0', padding: m ? '2.5rem 0' : '4rem 0', position: 'relative' }}>
      <div style={{ textAlign: 'center', padding: '0 1.25rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', display: 'inline-block', border: `1px solid ${G}`, borderRadius: '4px', padding: '0.4rem 1.25rem', marginBottom: '0.85rem' }}>TRANSFORMATIES</span>
        <h2 style={{ fontSize: m ? '1.5rem' : '2.2rem', fontWeight: '900', margin: 0, lineHeight: 1.15, textTransform: 'uppercase' }}>
          ZICHTBARE TRANSFORMATIES IN GEMIDDELD 16 WEKEN
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: m ? '6px' : '14px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <ChevronLeft size={20} color={G} />
        </button>
        <button onClick={() => scroll(1)} style={{ position: 'absolute', right: m ? '6px' : '14px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <ChevronRight size={20} color={G} />
        </button>

        <div ref={ref} style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingLeft: m ? '1.25rem' : '3rem', paddingRight: m ? '1.25rem' : '3rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {TRANSFORMATIONS.map((t, i) => (
            <div key={i} style={{ minWidth: m ? '220px' : '280px', scrollSnapAlign: 'start', flexShrink: 0 }}>
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.7rem', marginBottom: '0.6rem' }}>BEFORE / AFTER</div>
              <p style={{ textAlign: 'center', fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{t.name} <span style={{ color: G, fontWeight: '800' }}>{t.result}</span></p>
            </div>
          ))}
        </div>
      </div>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </section>
  )
}

/* ═══════════════════════════════════════
   3. EBOOK CADEAU
   ═══════════════════════════════════════ */
function EbookBlock({ m }) {
  return (
    <section style={{ background: '#f5f0e8', padding: m ? '2.5rem 1.25rem' : '4rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <h2 style={{ fontSize: m ? '1.5rem' : '2.2rem', fontWeight: '900', margin: '0 0 1.5rem', lineHeight: 1.15, textTransform: 'uppercase' }}>
          MIJN CADEAU VOOR JOU: MIJN EBOOK "BUIKVET VERLIEZEN" 🎁
        </h2>
        <div style={{ background: '#fff', border: `2px solid ${G}`, borderRadius: '16px', padding: m ? '1.5rem 1.25rem' : '2rem', textAlign: 'left' }}>
          <p style={{ fontSize: m ? '0.95rem' : '1.05rem', color: '#444', lineHeight: 1.6, margin: '0 0 0.85rem' }}>
            Je wilt afvallen maar tegelijk ook genieten? Het is niet nodig om elke dag kip met rijst te eten en elke sociale gelegenheid te vermijden.
          </p>
          <p style={{ fontSize: m ? '0.95rem' : '1.05rem', color: '#444', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            Ik leer je hier hoe je in het weekend een hapje kan gaan eten zonder dat dit jouw progressie in de weg zit.
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href={EBOOK_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: m ? '0.85rem 1.75rem' : '1rem 2.5rem',
              background: `linear-gradient(135deg, ${G}, ${GD})`,
              color: '#fff', borderRadius: '10px', fontSize: m ? '0.9rem' : '1rem',
              fontWeight: '800', textDecoration: 'none', touchAction: 'manipulation'
            }}>
              EBOOK DOWNLOADEN <BookOpen size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════
   4. REVIEWS — Auto-scroll
   ═══════════════════════════════════════ */
function ReviewsBlock({ m }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    let id, pos = 0
    const tick = () => { pos += 0.4; if (pos >= el.scrollWidth / 2) pos = 0; el.scrollLeft = pos; id = requestAnimationFrame(tick) }
    const stop = () => cancelAnimationFrame(id)
    const go = () => { id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    el.addEventListener('touchstart', stop, { passive: true }); el.addEventListener('touchend', go)
    return () => { cancelAnimationFrame(id); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go); el.removeEventListener('touchstart', stop); el.removeEventListener('touchend', go) }
  }, [])

  const doubled = [...REVIEWS, ...REVIEWS]

  return (
    <section style={{ background: '#fff', padding: m ? '2.5rem 0' : '4rem 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '0 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '0.6rem' }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="#FFD700" color="#FFD700" />)}
        </div>
        <h2 style={{ fontSize: m ? '1.4rem' : '2rem', fontWeight: '900', margin: 0 }}>WAT ANDEREN ZEGGEN</h2>
      </div>

      <div ref={ref} style={{ display: 'flex', gap: '0.85rem', overflow: 'hidden', paddingLeft: m ? '1.25rem' : '2rem', paddingRight: m ? '1.25rem' : '2rem', cursor: 'grab' }}>
        {doubled.map((r, i) => (
          <div key={i} style={{ minWidth: m ? '270px' : '320px', maxWidth: m ? '270px' : '320px', padding: '1.15rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${G}, ${GD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>{r.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700' }}>{r.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{r.date}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '0.45rem' }}>{[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#FFD700" color="#FFD700" />)}</div>
            <p style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</p>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35px', background: 'linear-gradient(90deg, #fff, transparent)', pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35px', background: 'linear-gradient(270deg, #fff, transparent)', pointerEvents: 'none', zIndex: 5 }} />
    </section>
  )
}
