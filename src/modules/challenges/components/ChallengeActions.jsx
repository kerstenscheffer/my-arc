// src/modules/challenges/components/ChallengeActions.jsx
// Challenge Action Buttons Component
// Kersten - 28 Augustus 2025

export default function ChallengeActions({ onStartChallenge, loading, isMobile, theme }) {
  return (
    <button
      onClick={onStartChallenge}
      disabled={loading}
      style={{
        width: '100%',
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: loading 
          ? 'rgba(220, 38, 38, 0.5)' 
          : theme.gradient,
        backgroundSize: '200% 100%',
        border: 'none',
        borderRadius: '16px',
        color: '#fff',
        fontSize: isMobile ? '1.1rem' : '1.2rem',
        fontWeight: '700',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '56px',
        boxShadow: loading 
          ? 'none'
          : `${theme.boxShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
        letterSpacing: '-0.01em'
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 20px 60px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          e.currentTarget.style.backgroundPosition = '100% 0'
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(1) translateY(0)'
          e.currentTarget.style.boxShadow = `${theme.boxShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          e.currentTarget.style.backgroundPosition = '0% 0'
        }
      }}
      onTouchStart={(e) => {
        if (!loading && isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (!loading && isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {loading ? (
        <>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Challenge starten...
        </>
      ) : (
        <>
          Start Challenge
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
