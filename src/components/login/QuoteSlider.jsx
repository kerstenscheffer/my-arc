// src/components/login/QuoteSlider.jsx
import { useState, useEffect } from 'react'

const MOTIVATIONAL_QUOTES = [
  { text: "Every workout counts", author: "MY ARC" },
  { text: "Transform your body, transform your life", author: "Kersten" },
  { text: "Consistency beats perfection", author: "MY ARC" },
  { text: "Your only limit is you", author: "Kersten" },
  { text: "Progress, not perfection", author: "MY ARC" },
  { text: "Make yourself proud", author: "Kersten" },
  { text: "Stronger than yesterday", author: "MY ARC" },
  { text: "Discipline is freedom", author: "Kersten" },
  { text: "Results require patience", author: "MY ARC" },
  { text: "Trust the process", author: "Kersten" }
]

export default function QuoteSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isMobile = window.innerWidth <= 768
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 7000) // Sync with background slideshow
    
    return () => clearInterval(interval)
  }, [])
  
  const currentQuote = MOTIVATIONAL_QUOTES[currentIndex]
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '25px' : '35px', // AANGEPAST: Iets hoger voor betere spacing
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      zIndex: 15,
      width: '90%',
      maxWidth: '600px',
      pointerEvents: 'none'
    }}>
      <blockquote style={{
        margin: 0,
        padding: '0 1rem',
        animation: 'fadeInOut 7s ease-in-out infinite'
      }}>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.05rem', // AANGEPAST: Iets kleiner
          fontWeight: '300',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '0.25rem', // AANGEPAST: Kleinere margin
          fontStyle: 'italic',
          letterSpacing: '0.02em',
          textShadow: '0 2px 15px rgba(0,0,0,0.8)',
          lineHeight: 1.2 // AANGEPAST: Compactere line height
        }}>
          "{currentQuote.text}"
        </p>
        <cite style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem', // AANGEPAST: Kleiner
          color: '#10b981',
          fontStyle: 'normal',
          fontWeight: '500',
          opacity: 0.6
        }}>
          — {currentQuote.author}
        </cite>
      </blockquote>
      
      {/* Progress dots */}
      <div style={{
        display: 'flex',
        gap: '0.3rem', // AANGEPAST: Kleinere gap
        justifyContent: 'center',
        marginTop: '0.5rem' // AANGEPAST: Kleinere margin
      }}>
        {MOTIVATIONAL_QUOTES.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentIndex ? '12px' : '3px', // AANGEPAST: Kleiner
              height: '2px',
              background: index === currentIndex 
                ? 'rgba(16, 185, 129, 0.6)' 
                : 'rgba(255,255,255,0.1)',
              borderRadius: '1px',
              transition: 'all 0.5s ease',
              opacity: index === currentIndex ? 0.6 : 0.3
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { 
            opacity: 0; 
            transform: translateY(8px);
          }
          15%, 85% { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
