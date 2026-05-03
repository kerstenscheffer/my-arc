import { useState, useEffect, useRef } from 'react'

export default function ClosingSection({ isMobile }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true) },
      { threshold: 0.25 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      minHeight: '100vh',
      background: '#000000',
      position: 'relative',
      padding: isMobile ? '3rem 1.25rem' : '5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>

      <div style={{
        maxWidth: '800px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>

        {/* ── Thin gold line ── */}
        <div style={{
          width: isMobile ? '50px' : '70px',
          height: '1px',
          background: 'rgba(255,186,9,0.3)',
          margin: '0 auto',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'all 0.8s ease'
        }} />

        {/* ── The question — one flowing block ── */}
        <h2 style={{
          fontSize: isMobile ? '1.85rem' : '3.25rem',
          fontWeight: '900',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
          transition: 'all 1s cubic-bezier(0.4,0,0.2,1) 0.2s'
        }}>
          <span style={{ color: '#ffffff' }}>Als jij </span>
          <span className="closing-shimmer">6 maanden</span>
          <span style={{ color: '#ffffff' }}> zou inleveren om de rest van je leven in je </span>
          <span className="closing-shimmer">beste shape</span>
          <span style={{ color: '#ffffff' }}> te zijn, zou je dat dan doen?</span>
        </h2>

        {/* ── Thin gold line bottom ── */}
        <div style={{
          width: isMobile ? '50px' : '70px',
          height: '1px',
          background: 'rgba(255,186,9,0.3)',
          margin: '0 auto',
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'all 0.8s ease 0.8s'
        }} />
      </div>

      <style>{`
        .closing-shimmer {
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
          animation: closingShimmer 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,186,9,0.2));
        }
        @keyframes closingShimmer {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </section>
  )
}
