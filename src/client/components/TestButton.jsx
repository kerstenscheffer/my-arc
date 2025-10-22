import { useState } from 'react'
import useIsMobile from '../../hooks/useIsMobile'
import { Zap } from 'lucide-react'

export default function TestButton() {
  const isMobile = useIsMobile()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    console.log('Test')
  }

  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.25rem',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(17, 17, 17, 0.4) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isHovered
            ? '1px solid rgba(59, 130, 246, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isMobile ? '16px' : '20px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <Zap
          size={isMobile ? 18 : 20}
          color={isHovered ? '#3b82f6' : 'rgba(255, 255, 255, 0.6)'}
          style={{
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        <span style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '700',
          color: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
          transition: 'all 0.3s ease'
        }}>
          Test
        </span>
      </button>
    </div>
  )
}
