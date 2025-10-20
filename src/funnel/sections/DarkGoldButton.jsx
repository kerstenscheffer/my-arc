import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function DarkGoldButton({ isMobile }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      flexDirection: 'column',
      gap: '3rem'
    }}>
      <h2 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '2rem'
      }}>
        Dark Gold Button Test
      </h2>

      {/* Version 1: Donkerder basis */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1rem' }}>Versie 1: Donkerder</p>
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: isHovered 
              ? 'linear-gradient(135deg, #5c4515 0%, #705821 25%, #9b7f3a 50%, #705821 75%, #3d2f0e 100%)'
              : 'linear-gradient(135deg, #1a1309 0%, #3d2f0e 25%, #5c4515 50%, #3d2f0e 75%, #0f0a04 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: isHovered ? '#d4af37' : '#9b7f3a',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0)',
            boxShadow: isHovered 
              ? '0 12px 40px rgba(92, 69, 21, 0.6), 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(155, 127, 58, 0.3)'
              : '0 10px 30px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(92, 69, 21, 0.2)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
            minHeight: '44px',
            letterSpacing: '0.02em'
          }}
        >
          Plan Je Gesprek Gratis!
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Version 2: Bijna zwart met gouden hint */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1rem' }}>Versie 2: Bijna zwart</p>
        <button
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1309 40%, #3d2f0e 50%, #1a1309 60%, #000000 100%)',
            border: '1px solid rgba(92, 69, 21, 0.3)',
            borderRadius: '12px',
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#705821',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(92, 69, 21, 0.15)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            minHeight: '44px',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1a1309 0%, #3d2f0e 40%, #5c4515 50%, #3d2f0e 60%, #0a0a0a 100%)'
            e.currentTarget.style.color = '#9b7f3a'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #1a1309 40%, #3d2f0e 50%, #1a1309 60%, #000000 100%)'
            e.currentTarget.style.color = '#705821'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Plan Je Gesprek Gratis!
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Version 3: Zwart met subtiele gouden veeg (zoals hero) */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1rem' }}>Versie 3: Zwart met veeg</p>
        <button
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 45%, rgba(92, 69, 21, 0.2) 50%, #000000 55%, #0a0a0a 100%)',
            border: '1px solid rgba(92, 69, 21, 0.25)',
            borderRadius: '12px',
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#9b7f3a',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(92, 69, 21, 0.1)',
            minHeight: '44px',
            letterSpacing: '0.02em',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3d2f0e 0%, #5c4515 100%)'
            e.currentTarget.style.color = '#d4af37'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.border = '1px solid rgba(155, 127, 58, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #000000 45%, rgba(92, 69, 21, 0.2) 50%, #000000 55%, #0a0a0a 100%)'
            e.currentTarget.style.color = '#9b7f3a'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.border = '1px solid rgba(92, 69, 21, 0.25)'
          }}
        >
          Plan Je Gesprek Gratis!
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Color palette reference */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Dark Gold Palette:
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#0f0a04', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#0f0a04</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#1a1309', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#1a1309</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#3d2f0e', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#3d2f0e</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#5c4515', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#5c4515</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#705821', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#705821</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#9b7f3a', borderRadius: '8px', marginBottom: '0.5rem' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>#9b7f3a</span>
          </div>
        </div>
      </div>
    </section>
  )
}
