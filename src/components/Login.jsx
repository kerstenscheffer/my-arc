// src/components/Login.jsx - Clean Premium Login (No Photos)
import LoginMain from './login/LoginMain'

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
    </div>
  )
}
