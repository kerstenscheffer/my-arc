// src/components/Login.jsx - Clean Premium Login (No Photos)
import LoginMain from './login/LoginMain'
import { LifeBuoy, Shield } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden',
      // Premium gradient background - No photos
      background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)',
      position: 'relative'
    }}>
      {/* Subtle golden glow effect - premium touch */}
      <div
        style={{
          position: 'fixed',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.02) 0%, transparent 50%)',
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0.4
        }}
      />

      {/* Login Interface */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <LoginMain onLoginSuccess={onLoginSuccess} />
      </div>

      {/* Footer quick-links: support + privacy. Fixed onderaan, redelijk
          zichtbaar zonder de login-flow te overheersen. */}
      <LoginFooter />
    </div>
  )
}

function LoginFooter() {
  const linkStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.01em',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }
  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 14px)`,
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      <a href="/support" style={{ ...linkStyle, pointerEvents: 'auto' }}>
        <LifeBuoy size={14} strokeWidth={2.4} color="#FFD700" />
        Support
      </a>
      <a href="/privacy" style={{ ...linkStyle, pointerEvents: 'auto' }}>
        <Shield size={14} strokeWidth={2.4} color="rgba(255,255,255,0.7)" />
        Privacy
      </a>
    </div>
  )
}
