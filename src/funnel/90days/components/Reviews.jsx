// src/funnel/90days/components/Reviews.jsx

import { useState, useEffect, useRef } from 'react'
import { GOLD, pp } from '../colors'

const REVIEWS = [
  {
    name: 'Hessel',
    date: 'feb 2026',
    body: 'Ik ben van 79,8 naar 74,4 gegaan in 8 weken. Het doel was 75kg en dat is gelukt. Kersten begreep het meteen!',
  },
  {
    name: 'SASSUS',
    date: 'nov 2025',
    body: 'Na 100 mislukte pogingen is het mij gelukt een routine te creëren die ik kan continueren. Niet alleen fysiek maar ook mentaal.',
  },
  {
    name: 'Indi',
    date: 'dec 2025',
    body: 'Kersten helpt me iedere week. Zijn begeleiding is professioneel, persoonlijk en betrouwbaar. Ik kan Myarc aan iedereen aanraden.',
  },
  {
    name: 'Consumer',
    date: 'nov 2025',
    body: 'Zeer professionele aanpak! Hij volgt je progressie actief op en biedt waardevolle feedback en motivatie op de juiste momenten.',
  },
  {
    name: 'Me',
    date: 'dec 2025',
    body: 'Je krijgt een goed schema om je doel te halen en wekelijkse calls. Je kan makkelijk contact opnemen als je ergens tegenaan loopt.',
  },
  {
    name: 'Toon',
    date: 'nov 2025',
    body: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!',
  },
]

const AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

function MiniStars() {
  return (
    <div style={{ display: 'flex', gap: '0.5px' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={8} height={8} viewBox="0 0 24 24" fill={GOLD} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review, index, isMobile }) {
  const cardWidth = isMobile ? 'calc(50vw - 1.2rem)' : '240px'

  return (
    <div style={{
      width: cardWidth, minWidth: cardWidth, flexShrink: 0,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: isMobile ? '0.7rem' : '0.85rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        marginBottom: '0.35rem',
      }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: AVATAR_COLORS[index % AVATAR_COLORS.length],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: pp, fontSize: '0.45rem', fontWeight: 800, color: '#fff',
          flexShrink: 0,
        }}>{review.name[0]}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: pp, fontSize: '0.6rem', fontWeight: 700, color: '#fff',
            lineHeight: 1.2,
          }}>{review.name}</div>
          <MiniStars />
        </div>
      </div>

      {/* Body */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '0.58rem' : '0.63rem',
        fontWeight: 400, lineHeight: 1.55,
        color: 'rgba(255,255,255,0.35)',
        display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{review.body}</div>
    </div>
  )
}

// ── Compact summary: avatar stack + stars + rating ──
export function ReviewSummary({ isMobile }) {
  const avatarSize = isMobile ? 22 : 26

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: isMobile ? '0.35rem' : '0.4rem',
    }}>
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {REVIEWS.slice(0, 5).map((r, i) => (
          <div key={i} style={{
            width: `${avatarSize}px`, height: `${avatarSize}px`,
            borderRadius: '50%',
            background: AVATAR_COLORS[i],
            border: '2px solid #000',
            marginLeft: i > 0 ? `${-avatarSize * 0.3}px` : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: pp, fontSize: '0.4rem', fontWeight: 800, color: '#fff',
            position: 'relative', zIndex: 5 - i,
          }}>{r.name[0]}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px' }}>
        <div style={{ display: 'flex', gap: '0.5px' }}>
          {[1,2,3,4,5].map(i => (
            <svg key={i} width={10} height={10} viewBox="0 0 24 24" fill={GOLD} stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
        <span style={{
          fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: 700, color: '#fff',
        }}>Gemiddeld 5/5 beoordeeld</span>
      </div>
    </div>
  )
}

// ── Auto-sliding carousel, 2 cards visible ──
export function ReviewCarousel({ isMobile }) {
  const scrollRef = useRef(null)
  const [currentPair, setCurrentPair] = useState(0)
  const totalPairs = Math.ceil(REVIEWS.length / 2)

  // Auto-slide every 4 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentPair(prev => (prev + 1) % totalPairs)
    }, 4000)
    return () => clearInterval(iv)
  }, [totalPairs])

  // Scroll to current pair
  useEffect(() => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.firstChild?.offsetWidth || 0
    const gap = isMobile ? 8 : 10
    scrollRef.current.scrollTo({
      left: currentPair * (cardWidth * 2 + gap * 2),
      behavior: 'smooth',
    })
  }, [currentPair, isMobile])

  return (
    <div>
      {/* Cards */}
      <div ref={scrollRef} style={{
        display: 'flex', gap: isMobile ? '0.5rem' : '0.6rem',
        overflowX: 'auto', overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
        padding: '0 0 0.5rem',
      }}>
        {REVIEWS.map((review, i) => (
          <div key={i} style={{ scrollSnapAlign: 'start' }}>
            <ReviewCard review={review} index={i} isMobile={isMobile} />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '0.3rem',
        marginTop: '0.5rem',
      }}>
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div key={i} onClick={() => setCurrentPair(i)} style={{
            width: currentPair === i ? '16px' : '5px',
            height: '5px',
            borderRadius: '3px',
            background: currentPair === i ? GOLD : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }} />
        ))}
      </div>
    </div>
  )
}
