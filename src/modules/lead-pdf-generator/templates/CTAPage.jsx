export default function MasterChecklistPage({ content, yourPhoto, pageIndex, settings }) {
  const master = content.masterChecklist
  
  // Use default settings if not provided
  const s = settings || {
    typography: {
      checklistTitleSize: 48,
      checklistItemSize: 20
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
      borderGlow: true,
      gradientText: true
    },
    spacing: {
      pageMargin: 60,
      sectionGap: 40,
      lineHeight: 1.4
    }
  }
  
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
      flexDirection: 'column'
    }}>
      {/* Background gradient accent */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, rgba(16, 185, 129, ${s.effects.glowIntensity * 0.001}) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Title with fire emoji and gradient - FIXED CENTERING */}
      <h1 style={{
        fontSize: `${s.typography.checklistTitleSize * 1.17}px`,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: `${s.spacing.sectionGap * 1.5}px`,
        textTransform: 'uppercase',
        letterSpacing: '-2px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <span style={{
          background: s.effects.gradientText ? 
            'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #10b981 100%)' :
            s.colors.accentColor,
          WebkitBackgroundClip: s.effects.gradientText ? 'text' : 'unset',
          WebkitTextFillColor: s.effects.gradientText ? 'transparent' : s.colors.accentColor,
          backgroundClip: s.effects.gradientText ? 'text' : 'unset',
          textShadow: `0 0 ${s.effects.glowIntensity * 1.2}px rgba(249, 115, 22, 0.3)`
        }}>
          🔥 DE ULTIEME BS DETECTOR
        </span>
      </h1>
      
      {/* Sections with gradient accents */}
      {master.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} style={{
          marginBottom: `${s.spacing.sectionGap * 1.25}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderRadius: '12px',
          padding: `${s.spacing.sectionGap * 0.75}px`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}>
          {/* Section gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100px',
            height: '100%',
            background: `linear-gradient(90deg, 
              ${sectionIndex === 0 ? 'rgba(249, 115, 22, 0.1)' : 
                sectionIndex === 1 ? 'rgba(16, 185, 129, 0.1)' : 
                'rgba(59, 130, 246, 0.1)'} 0%, 
              transparent 100%)`,
            pointerEvents: 'none'
          }} />
          
          <h3 style={{
            fontSize: `${s.typography.checklistTitleSize * 0.67}px`,
            fontWeight: '800',
            marginBottom: `${s.spacing.sectionGap * 0.625}px`,
            borderBottom: '2px solid',
            borderImage: `linear-gradient(90deg, ${s.colors.gradientStart} 0%, ${s.colors.gradientEnd} 50%, transparent 100%) 1`,
            paddingBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: s.effects.gradientText ?
              `linear-gradient(135deg, 
                ${sectionIndex === 0 ? '#f97316' : 
                  sectionIndex === 1 ? '#10b981' : 
                  '#3b82f6'} 0%, 
                ${sectionIndex === 0 ? '#ef4444' : 
                  sectionIndex === 1 ? '#3b82f6' : 
                  '#8b5cf6'} 100%)` :
              (sectionIndex === 0 ? '#f97316' : 
               sectionIndex === 1 ? '#10b981' : 
               '#3b82f6'),
            WebkitBackgroundClip: s.effects.gradientText ? 'text' : 'unset',
            WebkitTextFillColor: s.effects.gradientText ? 'transparent' : 'inherit',
            backgroundClip: s.effects.gradientText ? 'text' : 'unset',
            color: s.effects.gradientText ? 'inherit' : 
                   (sectionIndex === 0 ? '#f97316' : 
                    sectionIndex === 1 ? '#10b981' : 
                    '#3b82f6')
          }}>
            {section.category}
          </h3>
          
          {section.checks.map((check, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              fontSize: `${s.typography.checklistItemSize}px`,
              fontWeight: '600',
              color: s.colors.textColor,
              opacity: 0.9,
              lineHeight: s.spacing.lineHeight
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                border: '3px solid',
                borderColor: sectionIndex === 0 ? '#f97316' : 
                            sectionIndex === 1 ? '#10b981' : 
                            '#3b82f6',
                borderRadius: '6px',
                marginRight: '15px',
                background: `rgba(${
                  sectionIndex === 0 ? '249, 115, 22' : 
                  sectionIndex === 1 ? '16, 185, 129' : 
                  '59, 130, 246'
                }, 0.05)`,
                flexShrink: 0
              }} />
              <span>{check}</span>
            </div>
          ))}
        </div>
      ))}
      
      {/* Scoring guide with glassmorphism */}
      <div style={{
        background: `linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)`,
        backdropFilter: `blur(${s.effects.glassmorphismBlur}px)`,
        border: '3px solid transparent',
        borderRadius: '16px',
        padding: `${s.spacing.sectionGap * 0.75}px`,
        marginTop: 'auto',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 0 ${s.effects.glowIntensity * 0.8}px rgba(16, 185, 129, 0.15), inset 0 0 ${s.effects.glowIntensity * 0.4}px rgba(16, 185, 129, 0.05)`
      }}>
        {/* Gradient border */}
        {s.effects.borderGlow && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px',
            padding: '3px',
            background: `linear-gradient(135deg, ${s.colors.gradientStart}, ${s.colors.gradientEnd}, #8b5cf6)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'exclude',
            maskComposite: 'exclude',
            pointerEvents: 'none'
          }} />
        )}
        
        <h3 style={{
          fontSize: `${s.typography.checklistTitleSize * 0.58}px`,
          fontWeight: '800',
          marginBottom: `${s.spacing.sectionGap * 0.5}px`,
          background: s.effects.gradientText ?
            `linear-gradient(135deg, ${s.colors.gradientStart} 0%, ${s.colors.gradientEnd} 100%)` :
            s.colors.accentColor,
          WebkitBackgroundClip: s.effects.gradientText ? 'text' : 'unset',
          WebkitTextFillColor: s.effects.gradientText ? 'transparent' : s.colors.accentColor,
          backgroundClip: s.effects.gradientText ? 'text' : 'unset'
        }}>
          📊 SCORING
        </h3>
        <div style={{ 
          fontSize: `${s.typography.checklistItemSize * 1.1}px`, 
          fontWeight: '600', 
          lineHeight: '1.8' 
        }}>
          <div style={{ color: '#10b981' }}>✅ {master.scoring.high}</div>
          <div style={{ color: '#f97316' }}>⚠️ {master.scoring.medium}</div>
          <div style={{ color: '#ef4444' }}>❌ {master.scoring.low}</div>
        </div>
      </div>
    </div>
  )
}
