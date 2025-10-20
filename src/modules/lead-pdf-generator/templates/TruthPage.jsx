export default function TruthPage({ content, yourPhoto, truthIndex, pageIndex, settings }) {
  const truth = content.truths[truthIndex]
  const photoPosition = Math.floor(pageIndex / 2) % 2 === 0 ? 'left' : 'right'
  
  // Use default settings if not provided
  const s = settings || {
    typography: {
      truthTitleSize: 56,
      truthTextSize: 38
    },
    colors: {
      gradientStart: '#10b981',
      gradientEnd: '#3b82f6',
      gradientAngle: 135,
      pageBackground: '#000',
      textColor: '#ffffff',
      accentColor: '#10b981'
    },
    effects: {
      glowIntensity: 50,
      glassmorphismBlur: 20,
      photoOpacity: 10,
      borderGlow: true,
      gradientText: true
    },
    spacing: {
      pageMargin: 80,
      sectionGap: 40,
      lineHeight: 1.6
    }
  }
  
  // Unique gradient IDs for this page
  const circleGradientId = `circle-gradient-${pageIndex}`
  const underlineGradientId = `underline-gradient-${pageIndex}`
  const borderGradientId = `border-gradient-${pageIndex}`
  const titleGradientId = `title-gradient-${pageIndex}`
  const whyTextGradientId = `why-text-gradient-${pageIndex}`
  
  return (
    <div style={{
      width: '794px',
      height: '1123px',
      background: `linear-gradient(180deg, ${s.colors.pageBackground} 0%, #0a0a0a 100%)`,
      color: s.colors.textColor,
      padding: `${s.spacing.pageMargin}px`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Background photo layer */}
      {yourPhoto && (
        <>
          <img 
            src={yourPhoto} 
            alt="Watermark"
            style={{
              position: 'absolute',
              top: '50%',
              [photoPosition]: '-100px',
              transform: 'translateY(-50%)',
              width: '400px',
              height: '600px',
              objectFit: 'cover',
              opacity: s.effects.photoOpacity / 100,
              filter: 'blur(2px)',
              zIndex: 0
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            [photoPosition]: 0,
            width: '400px',
            height: '100%',
            background: `linear-gradient(${photoPosition === 'left' ? '90deg' : '270deg'}, transparent 0%, ${s.colors.pageBackground} 70%)`,
            zIndex: 0
          }} />
        </>
      )}
      
      {/* Number circle - SVG with INLINE gradient */}
      <div style={{
        width: '80px',
        height: '80px',
        marginBottom: `${s.spacing.sectionGap}px`,
        position: 'relative',
        zIndex: 1
      }}>
        <svg width="80" height="80" style={{ display: 'block' }}>
          <defs>
            <radialGradient id={circleGradientId}>
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </radialGradient>
          </defs>
          <circle
            cx="40"
            cy="40"
            r="38"
            fill={`url(#${circleGradientId})`}
            style={{
              filter: `drop-shadow(0 0 ${s.effects.glowIntensity * 0.8}px rgba(16, 185, 129, 0.5)) drop-shadow(0 0 ${s.effects.glowIntensity * 1.6}px rgba(16, 185, 129, 0.2))`
            }}
          />
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="36"
            fontWeight="900"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {truth.number}
          </text>
        </svg>
      </div>
      
      {/* Title with SVG gradient text - INLINE DEFS */}
      <div style={{ 
        marginBottom: `${s.spacing.sectionGap * 1.5}px`,
        position: 'relative',
        zIndex: 1
      }}>
        {/* SVG Title with INLINE gradient definition */}
        <div style={{ marginBottom: '20px' }}>
          <svg 
            width="100%" 
            height={s.typography.truthTitleSize * 1.3}
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id={titleGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={s.effects.gradientText ? `url(#${titleGradientId})` : s.colors.textColor}
              fontSize={s.typography.truthTitleSize}
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-2"
            >
              {truth.title}
            </text>
          </svg>
        </div>
        
        {/* SVG Underline with INLINE gradient */}
        <svg 
          width="100%" 
          height="3" 
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={underlineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="3"
            fill={`url(#${underlineGradientId})`}
            rx="1.5"
          />
        </svg>
      </div>
      
      {/* Explanation text */}
      <p style={{
        fontSize: `${s.typography.truthTextSize}px`,
        fontWeight: '600',
        lineHeight: s.spacing.lineHeight,
        color: s.colors.textColor,
        opacity: 0.9,
        position: 'relative',
        zIndex: 1,
        margin: 0,
        marginBottom: `${s.spacing.sectionGap * 1.5}px`
      }}>
        {truth.explanation}
      </p>
      
      {/* Why box with SVG gradient border */}
      <div style={{
        marginTop: 'auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* SVG Border with INLINE gradient */}
        {s.effects.borderGlow && (
          <svg 
            width="100%" 
            height="100%" 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <defs>
              <linearGradient id={borderGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <rect
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              fill="none"
              stroke={`url(#${borderGradientId})`}
              strokeWidth="2"
              rx="16"
            />
          </svg>
        )}
        
        {/* Content box */}
        <div style={{
          background: `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)`,
          backdropFilter: `blur(${s.effects.glassmorphismBlur}px)`,
          borderRadius: '16px',
          padding: `${s.spacing.sectionGap}px`,
          position: 'relative',
          border: s.effects.borderGlow ? 'none' : '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: `0 0 ${s.effects.glowIntensity * 0.8}px rgba(16, 185, 129, 0.2), inset 0 0 ${s.effects.glowIntensity * 0.4}px rgba(16, 185, 129, 0.05)`
        }}>
          <div style={{
            fontSize: `${s.typography.truthTextSize * 0.84}px`,
            fontWeight: '600',
            lineHeight: '1.5',
            color: s.colors.textColor
          }}>
            <span style={{
              fontSize: `${s.typography.truthTextSize * 1.05}px`,
              marginRight: '10px',
              display: 'inline-block',
              verticalAlign: 'middle'
            }}>💡</span>
            
            {/* SVG Gradient Text with INLINE defs */}
            {s.effects.gradientText ? (
              <svg 
                width="300" 
                height={s.typography.truthTextSize * 0.9} 
                style={{ 
                  display: 'inline-block', 
                  verticalAlign: 'middle',
                  marginRight: '10px'
                }}
              >
                <defs>
                  <linearGradient id={whyTextGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fill={`url(#${whyTextGradientId})`}
                  fontSize={s.typography.truthTextSize * 0.84}
                  fontWeight="700"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                >
                  Waarom dit werkt:
                </text>
              </svg>
            ) : (
              <strong style={{ color: s.colors.gradientStart }}>
                Waarom dit werkt:
              </strong>
            )}
            
            <br/>
            {truth.why}
          </div>
        </div>
      </div>
      
      {/* Page number indicator */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: '600',
        zIndex: 2
      }}>
        {pageIndex + 1} / 13
      </div>
    </div>
  )
}
