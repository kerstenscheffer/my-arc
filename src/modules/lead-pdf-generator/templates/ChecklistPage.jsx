export default function ChecklistPage({ content, yourPhoto, checklistIndex, pageIndex, settings }) {
  const checklist = content.checklists[checklistIndex]
  const isMobile = window.innerWidth <= 768
  
  // Use default settings if not provided
  const s = settings || {
    typography: {
      checklistTitleSize: 48,
      checklistItemSize: 24
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
      glassmorphismBlur: 10,
      photoOpacity: 10,
      borderGlow: true,
      gradientText: true
    },
    spacing: {
      pageMargin: 60,
      sectionGap: 40,
      lineHeight: 1.4
    }
  }
  
  // Unique ID for this page's gradients
  const gradientId = `gradient-page-${pageIndex}`
  const titleGradientId = `title-gradient-${pageIndex}`
  
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
      {/* Background photo layer - IMPROVED POSITIONING */}
      {yourPhoto && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        }}>
          {/* Photo with better positioning */}
          <img 
            src={yourPhoto} 
            alt="Watermark"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              objectFit: 'cover',
              opacity: s.effects.photoOpacity / 100,
              filter: `blur(4px)`
            }}
          />
          
          {/* Gradient overlay for readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at center, transparent 0%, ${s.colors.pageBackground}E6 50%, ${s.colors.pageBackground} 70%)`,
          }} />
        </div>
      )}
      
      {/* Title with SVG gradient text for export */}
      <div style={{ 
        marginBottom: `${s.spacing.sectionGap}px`,
        position: 'relative',
        zIndex: 2
      }}>
        {s.effects.gradientText ? (
          <svg 
            width="100%" 
            height={s.typography.checklistTitleSize * 1.5} 
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient 
                id={titleGradientId} 
                x1="0%" y1="0%" 
                x2="100%" y2="100%"
              >
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <text 
              x="0" 
              y={s.typography.checklistTitleSize}
              fill={`url(#${titleGradientId})`}
              fontSize={s.typography.checklistTitleSize}
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-1"
              style={{ textTransform: 'uppercase' }}
            >
              🚨 CHECKLIST: {checklist.title.toUpperCase()}
            </text>
          </svg>
        ) : (
          <h2 style={{
            fontSize: `${s.typography.checklistTitleSize}px`,
            fontWeight: '900',
            color: '#f97316',
            textTransform: 'uppercase',
            letterSpacing: '-1px',
            margin: 0
          }}>
            🚨 CHECKLIST: {checklist.title}
          </h2>
        )}
      </div>
      
      {/* Main checklist items - IMPROVED LAYOUT */}
      <div style={{ 
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: `${s.spacing.sectionGap * 0.75}px`,
        position: 'relative',
        zIndex: 2
      }}>
        {/* Check items with better spacing */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: `blur(${s.effects.glassmorphismBlur}px)`,
          borderRadius: '16px',
          padding: `${s.spacing.sectionGap * 0.75}px`,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {checklist.checks.map((check, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: i < checklist.checks.length - 1 ? `${s.spacing.sectionGap * 0.4}px` : 0,
              gap: '16px'
            }}>
              {/* Custom checkbox with gradient */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${s.colors.gradientStart}20 0%, ${s.colors.gradientEnd}20 100%)`,
                border: `2px solid ${s.colors.gradientStart}`,
                position: 'relative',
                marginTop: '2px'
              }}>
                {/* Inner glow effect */}
                <div style={{
                  position: 'absolute',
                  inset: '4px',
                  borderRadius: '4px',
                  background: `radial-gradient(circle, ${s.colors.gradientStart}30 0%, transparent 70%)`
                }} />
              </div>
              
              {/* Text with proper line height */}
              <span style={{ 
                fontSize: `${s.typography.checklistItemSize}px`,
                fontWeight: '600',
                color: s.colors.textColor,
                lineHeight: s.spacing.lineHeight,
                opacity: 0.95
              }}>
                {check}
              </span>
            </div>
          ))}
        </div>
        
        {/* Red flags - ENHANCED GLASSMORPHISM */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
          backdropFilter: `blur(${s.effects.glassmorphismBlur}px)`,
          borderRadius: '16px',
          padding: `${s.spacing.sectionGap * 0.6}px`,
          border: '2px solid rgba(239, 68, 68, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glow effect */}
          {s.effects.borderGlow && (
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, rgba(239, 68, 68, ${s.effects.glowIntensity / 200}) 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
          )}
          
          {/* Title */}
          <h3 style={{
            fontSize: `${s.typography.checklistTitleSize * 0.6}px`,
            fontWeight: '800',
            marginBottom: `${s.spacing.sectionGap * 0.4}px`,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: `0 0 ${s.effects.glowIntensity * 0.3}px rgba(239, 68, 68, 0.6)`,
            margin: 0,
            marginBottom: '16px'
          }}>
            ❌ RED FLAGS
          </h3>
          
          {/* Items */}
          {checklist.redFlags.map((flag, i) => (
            <div key={i} style={{
              fontSize: `${s.typography.checklistItemSize * 0.85}px`,
              fontWeight: '500',
              marginBottom: i < checklist.redFlags.length - 1 ? '12px' : 0,
              color: s.colors.textColor,
              paddingLeft: '24px',
              lineHeight: s.spacing.lineHeight,
              opacity: 0.9
            }}>
              • {flag}
            </div>
          ))}
        </div>
        
        {/* Green flags - ENHANCED GLASSMORPHISM */}
        <div style={{
          background: `linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)`,
          backdropFilter: `blur(${s.effects.glassmorphismBlur}px)`,
          borderRadius: '16px',
          padding: `${s.spacing.sectionGap * 0.6}px`,
          border: '2px solid rgba(16, 185, 129, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glow effect */}
          {s.effects.borderGlow && (
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, rgba(16, 185, 129, ${s.effects.glowIntensity / 200}) 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
          )}
          
          {/* Title */}
          <h3 style={{
            fontSize: `${s.typography.checklistTitleSize * 0.6}px`,
            fontWeight: '800',
            marginBottom: `${s.spacing.sectionGap * 0.4}px`,
            color: s.colors.gradientStart,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: `0 0 ${s.effects.glowIntensity * 0.3}px rgba(16, 185, 129, 0.6)`,
            margin: 0,
            marginBottom: '16px'
          }}>
            ✅ GREEN FLAGS
          </h3>
          
          {/* Items */}
          {checklist.greenFlags.map((flag, i) => (
            <div key={i} style={{
              fontSize: `${s.typography.checklistItemSize * 0.85}px`,
              fontWeight: '500',
              marginBottom: i < checklist.greenFlags.length - 1 ? '12px' : 0,
              color: s.colors.textColor,
              paddingLeft: '24px',
              lineHeight: s.spacing.lineHeight,
              opacity: 0.9
            }}>
              • {flag}
            </div>
          ))}
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
