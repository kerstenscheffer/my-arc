export default function CoverPage({ content, yourPhoto, pageIndex, settings }) {
  // Use default settings if not provided
  const s = settings || {
    typography: {
      coverTitleSize: 100,
      coverSubtitleSize: 32
    },
    colors: {
      gradientStart: '#10b981',
      gradientEnd: '#3b82f6',
      gradientAngle: 135,
      pageBackground: '#000',
      textColor: '#ffffff'
    },
    effects: {
      glowIntensity: 50,
      photoOpacity: 70
    },
    spacing: {
      pageMargin: 60
    }
  }

  return (
    <div style={{
      width: '794px',
      height: '1123px',
      background: s.colors.pageBackground,
      color: s.colors.textColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: `${s.spacing.pageMargin}px`
    }}>
      {/* Background photo with gradient overlay */}
      {yourPhoto && (
        <>
          <img 
            src={yourPhoto} 
            alt="Background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: s.effects.photoOpacity / 100
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
            zIndex: 0
          }} />
        </>
      )}
      
      {/* MY ARC Logo with gradient */}
      <div style={{
        position: 'absolute',
        top: `${s.spacing.pageMargin}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '36px',
        fontWeight: '900',
        letterSpacing: '3px',
        background: `linear-gradient(${s.colors.gradientAngle}deg, ${s.colors.gradientStart} 0%, ${s.colors.gradientEnd} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: `0 0 ${s.effects.glowIntensity * 1.2}px rgba(16, 185, 129, 0.3)`,
        zIndex: 2
      }}>
        MY ARC
      </div>
      
      {/* Main Title with glow - FIXED CENTERING */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: `${s.typography.coverTitleSize}px`,
          fontWeight: '900',
          textAlign: 'center',
          lineHeight: '0.95',
          marginBottom: '40px',
          margin: '0 auto 40px auto',
          whiteSpace: 'pre-line',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          color: s.colors.textColor,
          textShadow: `0 0 ${s.effects.glowIntensity * 1.6}px rgba(255, 255, 255, 0.3), 0 0 ${s.effects.glowIntensity * 0.8}px rgba(16, 185, 129, 0.2)`,
          maxWidth: '90%'
        }}>
          {content.cover.title}
        </h1>
        
        {/* Subtitle with gradient - FIXED ALIGNMENT */}
        <p style={{
          fontSize: `${s.typography.coverSubtitleSize}px`,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '20px',
          background: `linear-gradient(${s.colors.gradientAngle}deg, ${s.colors.gradientStart} 0%, ${s.colors.gradientEnd} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          padding: '10px 30px',
          borderTop: `2px solid rgba(16, 185, 129, 0.3)`,
          borderBottom: `2px solid rgba(16, 185, 129, 0.3)`,
          display: 'inline-block'
        }}>
          {content.cover.subtitle}
        </p>
      </div>
      
      {/* Tagline with subtle animation hint */}
      <p style={{
        position: 'absolute',
        bottom: `${s.spacing.pageMargin}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '18px',
        color: 'rgba(255, 255, 255, 0.6)',
        zIndex: 1,
        letterSpacing: '1px',
        textAlign: 'center'
      }}>
        {content.cover.tagline}
      </p>
    </div>
  )
}
