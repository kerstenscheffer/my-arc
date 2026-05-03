// ========================================
// 📁 src/funnel/five-pilar/sections/ValueFramesSection.jsx
// 4 FULL-SCREEN VALUE STATEMENTS
// Snap scroll + Enter/Space to advance
// After last frame → next section
// ========================================
import { useState, useEffect, useRef, useCallback } from 'react'

const frames = [
  {
    before: 'Hoe lijkt het jou om te bereiken in',
    gold: 'maanden',
    after: 'wat je anders jaren kost?'
  },
  {
    before: 'Hoe lijkt het jou om kennis en resultaat op te bouwen die je',
    gold: 'de rest van je leven',
    after: 'meeneemt?'
  }
]

export default function ValueFramesSection({ isMobile, onScrollNext, onNavigate }) {
  const [activeFrame, setActiveFrame] = useState(0)
  const [visibleFrames, setVisibleFrames] = useState(new Set())
  const sectionRef = useRef(null)
  const frameRefs = useRef([])

  // Track which frames are visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.index)
          if (entry.isIntersecting) {
            setVisibleFrames(prev => new Set([...prev, idx]))
            setActiveFrame(idx)
          }
        })
      },
      { threshold: 0.5 }
    )
    frameRefs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })
    return () => observer.disconnect()
  }, [])

  // Keyboard: Enter/Space/ArrowDown → next frame or next section
  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      // Only respond if this section is in view
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      if (rect.top > window.innerHeight || rect.bottom < 0) return

      e.preventDefault()

      if (activeFrame < frames.length - 1) {
        // Go to next frame
        const nextRef = frameRefs.current[activeFrame + 1]
        if (nextRef) nextRef.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        // Last frame → go to PillarSection (section index 2)
        if (onNavigate) onNavigate(2)
        else if (onScrollNext) onScrollNext()
      }
    }
  }, [activeFrame, onScrollNext, onNavigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <section ref={sectionRef} style={{
      position: 'relative',
      background: '#000'
    }}>
      {frames.map((frame, index) => (
        <div
          key={index}
          ref={el => frameRefs.current[index] = el}
          data-index={index}
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
            position: 'relative'
          }}
        >
          {/* Frame counter */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '2rem' : '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem',
            opacity: visibleFrames.has(index) ? 1 : 0,
            transition: 'opacity 0.6s ease'
          }}>
            {frames.map((_, i) => (
              <div key={i} style={{
                width: i === index ? '24px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === index
                  ? 'rgba(255, 186, 9, 0.6)'
                  : i < index
                    ? 'rgba(255, 186, 9, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.4s ease'
              }} />
            ))}
          </div>

          {/* Statement */}
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: isMobile ? '340px' : '700px',
            opacity: visibleFrames.has(index) ? 1 : 0,
            transform: visibleFrames.has(index) ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <span style={{ color: '#ffffff' }}>
              {frame.before}{' '}
            </span>
            <span className="shimmer-gold-frame">
              {frame.gold}
            </span>
            <span style={{ color: '#ffffff' }}>
              {' '}{frame.after}
            </span>
          </h2>

          {/* Bottom hint */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '2rem' : '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: visibleFrames.has(index) ? 0.4 : 0,
            transition: 'opacity 0.8s ease 0.5s',
            animation: 'bounceHint 2s ease-in-out infinite'
          }}>
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase'
            }}>
              {index < frames.length - 1 ? (isMobile ? 'Scroll' : 'Enter ↵') : (isMobile ? 'Scroll' : 'Enter ↵')}
            </span>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ opacity: 0.5 }}>
              <path d="M1 1L8 8L15 1" stroke="rgba(255,186,9,0.4)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      ))}

      <style>{`
        .shimmer-gold-frame {
          background: linear-gradient(
            110deg,
            #ffba09 0%,
            #ffba09 40%,
            #fff5d4 48%,
            #ffffff 50%,
            #fff5d4 52%,
            #ffba09 60%,
            #ffba09 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerFrame 4s ease-in-out infinite;
          filter: drop-shadow(0 0 25px rgba(255, 186, 9, 0.2));
        }
        @keyframes shimmerFrame {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
        @keyframes bounceHint {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </section>
  )
}
