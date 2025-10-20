import { useState, useEffect } from 'react'

// Module imports - ADD NEW MODULES HERE
 import NowActions from './modules/now-actions/NowActions'
// import TodayWins from './modules/today-wins/TodayWins'
// import ClientPulse from './modules/client-pulse/ClientPulse'
// import SmartInsights from './modules/smart-insights/SmartInsights'

export default function CoachCommandCenter({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [moduleData, setModuleData] = useState({})
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [clients])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Central data loading if needed
      // const data = await db.getCoachDashboardData()
      // setModuleData(data)
      setLoading(false)
    } catch (error) {
      console.error('Dashboard load error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Command Center laden...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{
            ...styles.title,
            fontSize: isMobile ? '1.5rem' : '2rem'
          }}>
            Coach Command Center
          </h1>
          <p style={styles.subtitle}>
            {clients?.length || 0} clients • Laatste update: {lastUpdate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          style={styles.refreshButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
          }}
        >
          🔄
        </button>
      </div>

      {/* Module Grid - MODULES RENDER HERE */}
      <div style={styles.moduleGrid}>
        
        {/* NOW ACTIONS MODULE */}
        <div style={styles.moduleSection}>
          <NowActions 
            db={db} 
            clients={clients}
            isMobile={isMobile}
            onActionComplete={loadDashboardData}
          />
        </div>

        {/* MAIN GRID - Client Pulse + Today Wins */}
        <div style={{
          ...styles.mainGrid,
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
        }}>
          {/* CLIENT PULSE MODULE */}
          <div style={styles.moduleCard}>
            {/* <ClientPulse 
              db={db} 
              clients={clients}
              isMobile={isMobile}
            /> */}
            <div style={styles.placeholderModule}>
              <h2 style={styles.moduleTitle}>💓 CLIENT PULSE</h2>
              <p style={styles.placeholderText}>Module wordt geladen...</p>
            </div>
          </div>

          {/* TODAY WINS MODULE */}
          <div style={styles.moduleCard}>
            {/* <TodayWins 
              db={db} 
              clients={clients}
              isMobile={isMobile}
            /> */}
            <div style={styles.placeholderModule}>
              <h2 style={styles.moduleTitle}>✨ TODAY'S WINS</h2>
              <p style={styles.placeholderText}>Module wordt geladen...</p>
            </div>
          </div>
        </div>

        {/* SMART INSIGHTS MODULE */}
        <div style={styles.moduleSection}>
          {/* <SmartInsights 
            db={db} 
            clients={clients}
            isMobile={isMobile}
          /> */}
          <div style={styles.placeholderModule}>
            <h2 style={styles.moduleTitle}>📊 SMART INSIGHTS</h2>
            <p style={styles.placeholderText}>Module wordt geladen...</p>
          </div>
        </div>

        {/* ADD MORE MODULES HERE */}
        {/* Just uncomment and import when ready:
        <div style={styles.moduleSection}>
          <NewModule db={db} clients={clients} isMobile={isMobile} />
        </div>
        */}
      </div>
    </div>
  )
}

// Styles
const styles = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  
  title: {
    fontWeight: '800',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0
  },
  
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.9rem',
    marginTop: '5px'
  },
  
  refreshButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  moduleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  moduleSection: {
    width: '100%'
  },
  
  mainGrid: {
    display: 'grid',
    gap: '20px'
  },
  
  moduleCard: {
    background: 'rgba(17, 17, 17, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  
  // Placeholder styles - Remove when modules are ready
  placeholderModule: {
    padding: '20px',
    background: 'rgba(17, 17, 17, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  moduleTitle: {
    fontSize: '1.1rem',
    color: '#10b981',
    marginBottom: '10px'
  },
  
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.9rem'
  },
  
  // Loading states
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    marginTop: '20px',
    color: 'rgba(255, 255, 255, 0.6)'
  }
}
