// src/components/login/QuoteSlider.jsx - ELEGANT GOLDEN VERSION
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
    }, 7000)
    
    return () => clearInterval(interval)
  }, [])
  
  const currentQuote = MOTIVATIONAL_QUOTES[currentIndex]
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '25px' : '35px',
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
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '300',
          color: 'rgba(255, 255, 255, 0.45)',
          marginBottom: '0.25rem',
          fontStyle: 'italic',
          letterSpacing: '0.02em',
          textShadow: '0 2px 15px rgba(0,0,0,0.8)',
          lineHeight: 1.2
        }}>
          "{currentQuote.text}"
        </p>
        <cite style={{
          fontSize: isMobile ? '0.625rem' : '0.7rem',
          color: 'rgba(255, 215, 0, 0.6)',
          fontStyle: 'normal',
          fontWeight: '500',
          opacity: 0.7,
          textShadow: '0 0 8px rgba(255, 215, 0, 0.2)'
        }}>
          — {currentQuote.author}
        </cite>
      </blockquote>
      
      {/* Progress dots - Golden */}
      <div style={{
        display: 'flex',
        gap: '0.3rem',
        justifyContent: 'center',
        marginTop: '0.5rem'
      }}>
        {MOTIVATIONAL_QUOTES.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentIndex ? '12px' : '3px',
              height: '2px',
              background: index === currentIndex 
                ? 'rgba(255, 215, 0, 0.5)' 
                : 'rgba(255,255,255,0.1)',
              borderRadius: '1px',
              transition: 'all 0.5s ease',
              opacity: index === currentIndex ? 0.6 : 0.3,
              boxShadow: index === currentIndex ? '0 0 6px rgba(255, 215, 0, 0.3)' : 'none'
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
