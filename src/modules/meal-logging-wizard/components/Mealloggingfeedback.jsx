import { useEffect } from 'react'

export default function MealLoggingFeedback({ status, mealName, onComplete }) {
  // status: 'loading', 'success', 'error'
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (status === 'success') {
      // Auto-close after 1.5 seconds
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, onComplete])

  if (!status) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10002,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '2.5rem 2rem' : '3rem 2.5rem',
        maxWidth: isMobile ? '90%' : '400px',
        textAlign: 'center',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Icon */}
        {status === 'loading' && (
          <div style={{
            width: isMobile ? '64px' : '80px',
            height: isMobile ? '64px' : '80px',
            margin: '0 auto 1.5rem',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              border: '4px solid rgba(16, 185, 129, 0.2)',
              borderTop: '4px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}

        {status === 'success' && (
          <div style={{
            width: isMobile ? '64px' : '80px',
            height: isMobile ? '64px' : '80px',
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <svg 
              width={isMobile ? "32" : "40"} 
              height={isMobile ? "32" : "40"} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            width: isMobile ? '64px' : '80px',
            height: isMobile ? '64px' : '80px',
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <svg 
              width={isMobile ? "32" : "40"} 
              height={isMobile ? "32" : "40"} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#fff" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}

        {/* Text */}
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.4rem',
          fontWeight: '700',
          color: status === 'error' ? '#ef4444' : '#10b981',
          marginBottom: '0.5rem'
        }}>
          {status === 'loading' && 'Maaltijd wordt opgeslagen...'}
          {status === 'success' && 'Maaltijd gelogd!'}
          {status === 'error' && 'Er ging iets mis'}
        </div>

        {mealName && (
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            {mealName}
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={onComplete}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Sluiten
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes successPop {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.1);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
