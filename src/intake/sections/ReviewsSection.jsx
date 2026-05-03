// src/intake/sections/ReviewsSection.jsx — LIGHT + Auto-scroll
import { useState, useEffect, useRef } from 'react'
import { Star } from 'lucide-react'

const G = '#C9A84C'
const BG = '#fafafa'
const REVIEWS = [
  { name: 'Hessel', date: 'dec 2025', title: 'Van 79,8 naar 74,4 in 8 weken!', text: 'Kersten begreep het meteen! Na een week lange 0-meting kreeg ik een uitgebreid plan. Het is vooral de kennis en info die mij aanspreekt waardoor ik nu zonder teveel na te denken stabiel blijf. Als jij je aan het plan houd zal Kersten altijd de volle 100% geven!' },
  { name: 'Me', date: 'dec 2025', title: 'Echt een aanrader!', text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls om te kijken hoe je er nu voor staat. Ook kan je makkelijk contact opnemen als je ergens tegen aan loopt.' },
  { name: 'Indi', date: 'dec 2025', title: 'Myarc is super!', text: 'Kersten helpt me iedere week met mijn maaltijden en zorgt ervoor dat ik precies krijg wat ik nodig heb. Zijn begeleiding is professioneel, persoonlijk, betrouwbaar en veel lachen natuurlijk. Ik kan Myarc aan iedereen aanraden!' },
  { name: 'Toon', date: 'nov 2025', title: 'Super Coach!', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'Sassus', date: 'nov 2025', title: '-5,1 kg en eindelijk gelukt!', text: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal heeft Kersten mij goed geholpen.' },
  { name: 'Consumer', date: 'nov 2025', title: 'Zeer professionele aanpak!', text: 'Alles duidelijk en gestructureerd in een overzichtelijke app. Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten. Een absolute aanrader voor wie op een duurzame manier fitter wil worden!' }
]

export default function ReviewsSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 }); if (sectionRef.current) o.observe(sectionRef.current); return () => o.disconnect() }, [])

  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    let animId, pos = 0; const speed = 0.4
    const scroll = () => { pos += speed; if (pos >= el.scrollWidth / 2) pos = 0; el.scrollLeft = pos; animId = requestAnimationFrame(scroll) }
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }
    animId = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true }); el.addEventListener('touchend', resume)
    return () => { cancelAnimationFrame(animId); el.removeEventListener('mouseenter', pause); el.removeEventListener('mouseleave', resume); el.removeEventListener('touchstart', pause); el.removeEventListener('touchend', resume) }
  }, [])

  const doubled = [...REVIEWS, ...REVIEWS]

  return (
    <section ref={sectionRef} style={{ background: BG, padding: isMobile ? '3.5rem 0' : '5rem 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '0 1rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em', color: '#1a1a1a', display: 'inline-block', border: `1px solid ${G}`, borderRadius: '4px', padding: '0.4rem 1.25rem', marginBottom: '1.5rem', opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>CLIENT TESTIMONIALS</span>
        <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: isMobile ? 'clamp(1.2rem, 5vw, 1.6rem)' : 'clamp(1.6rem, 3vw, 2.5rem)', fontWeight: '400', color: '#1a1a1a', maxWidth: '750px', margin: '0 auto 0.75rem', lineHeight: 1.3, opacity: vis ? 1 : 0, transition: 'opacity 0.7s ease 0.1s' }}>
          "Ik probeerde al jaren af te vallen maar niks werkte totdat ik het 16 weken programma gedaan had!"
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#FFD700" color="#FFD700" />)}
          <span style={{ fontSize: '0.72rem', color: '#999', fontWeight: '600', marginLeft: '0.25rem' }}>Beoordeeld op Trustpilot</span>
        </div>
      </div>

      <div ref={scrollRef} style={{ display: 'flex', gap: isMobile ? '0.75rem' : '1rem', overflow: 'hidden', paddingLeft: isMobile ? '1rem' : '2rem', paddingRight: isMobile ? '1rem' : '2rem', cursor: 'grab', opacity: vis ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
        {doubled.map((r, idx) => (
          <div key={idx} style={{ minWidth: isMobile ? '270px' : '310px', maxWidth: isMobile ? '270px' : '310px', padding: isMobile ? '1.1rem' : '1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid #eee', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${G}, #B8973F)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>{r.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a' }}>{r.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{r.date} on <span style={{ color: '#00b67a', fontWeight: '600' }}>Trustpilot</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>{[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#FFD700" color="#FFD700" />)}</div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1a1a1a', margin: '0 0 0.35rem', lineHeight: 1.3 }}>{r.title}</h4>
            <p style={{ fontSize: '0.78rem', color: '#888', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</p>
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: `linear-gradient(90deg, ${BG}, transparent)`, pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: `linear-gradient(270deg, ${BG}, transparent)`, pointerEvents: 'none', zIndex: 5 }} />
    </section>
  )
}
