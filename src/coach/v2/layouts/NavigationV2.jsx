// src/coach/v2/layouts/NavigationV2.jsx
export default function NavigationV2({ navigationItems, currentView, setCurrentView, pageThemes }) {
  return (
    <nav style={{
      position: 'sticky',
      top: '100px',
      width: '280px',
      height: 'fit-content'
    }}>
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        padding: '0.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {navigationItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '1rem',
              marginBottom: '0.25rem',
              background: currentView === item.id
                ? `linear-gradient(135deg, ${pageThemes[item.id].borderActive} 0%, ${pageThemes[item.id].borderColor} 100%)`
                : 'transparent',
              border: currentView === item.id
                ? `1px solid ${pageThemes[item.id].primary}`
                : '1px solid transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: currentView === item.id 
                ? pageThemes[item.id].primary 
                : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.95rem',
              fontWeight: currentView === item.id ? '600' : '500',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (currentView !== item.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== item.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'translateX(0)'
              }
            }}
          >
            <item.icon size={22} />
            <div>
              <div>{item.label}</div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginTop: '0.25rem'
              }}>
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </nav>
  )
}
