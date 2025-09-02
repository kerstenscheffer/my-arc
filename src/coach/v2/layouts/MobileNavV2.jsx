// src/coach/v2/layouts/MobileNavV2.jsx
export default function MobileNavV2({ navigationItems, currentView, setCurrentView, currentTheme, pageThemes }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      padding: '0.75rem 0.5rem',
      zIndex: 100,
      boxShadow: `0 -4px 20px rgba(0, 0, 0, 0.5), ${currentTheme.glow}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {navigationItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: currentView === item.id ? 'translateY(-3px)' : 'translateY(0)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: currentView === item.id
                ? `linear-gradient(135deg, ${pageThemes[item.id].borderActive} 0%, ${pageThemes[item.id].borderColor} 100%)`
                : 'rgba(255, 255, 255, 0.03)',
              border: currentView === item.id 
                ? `1px solid ${pageThemes[item.id].primary}` 
                : '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}>
              <item.icon 
                size={22} 
                color={currentView === item.id 
                  ? pageThemes[item.id].primary 
                  : 'rgba(255, 255, 255, 0.7)'} 
              />
            </div>
            <span style={{
              fontSize: '0.7rem',
              color: currentView === item.id 
                ? pageThemes[item.id].primary 
                : 'rgba(255, 255, 255, 0.5)',
              fontWeight: currentView === item.id ? '600' : '400'
            }}>
              {item.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
