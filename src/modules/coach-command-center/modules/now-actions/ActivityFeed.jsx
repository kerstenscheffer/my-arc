// ActivityFeed.jsx - Real-time client activity display
import { useState, useEffect, useRef } from 'react'
import { Activity, TrendingUp, Clock, ChevronRight } from 'lucide-react'

export default function ActivityFeed({ db, clients, isMobile }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef(null)
  const unsubscribeRef = useRef(null)

  // Load activities
  const loadActivities = async () => {
    try {
      const ActivityFeedService = (await import('../../services/ActivityFeedService')).default
      const service = new ActivityFeedService(db)
      
      const clientIds = clients.map(c => c.id)
      const rawActivities = await service.getRecentActivities(clientIds, 24)
      const enrichedActivities = await service.enrichWithClientNames(rawActivities, clients)
      
      setActivities(enrichedActivities)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error loading activities:', error)
      setLoading(false)
    }
  }

  // Setup polling and real-time
  useEffect(() => {
    loadActivities()

    // Polling every 30 seconds
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadActivities()
      }, 30000)
    }

    // Setup real-time subscription
    setupRealTimeSubscription()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [clients, autoRefresh])

  const setupRealTimeSubscription = async () => {
    try {
      const ActivityFeedService = (await import('../../services/ActivityFeedService')).default
      const service = new ActivityFeedService(db)
      
      const clientIds = clients.map(c => c.id)
      unsubscribeRef.current = service.subscribeToActivities(clientIds, (payload) => {
        // Refresh on any change
        loadActivities()
      })
    } catch (error) {
      console.error('❌ Error setting up subscription:', error)
    }
  }

  // Group activities by time
  const groupActivities = () => {
    const groups = {
      now: [],
      recent: [],
      today: [],
      yesterday: [],
      older: []
    }

    const now = new Date()
    activities.forEach(activity => {
      const diff = now - activity.timestamp
      const hours = diff / (1000 * 60 * 60)
      
      if (hours < 0.5) groups.now.push(activity)
      else if (hours < 2) groups.recent.push(activity)
      else if (hours < 24) groups.today.push(activity)
      else if (hours < 48) groups.yesterday.push(activity)
      else groups.older.push(activity)
    })

    return groups
  }

  const groups = groupActivities()

  return (
    <div style={{
      marginTop: isMobile ? '1.5rem' : '2rem',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={isMobile ? 20 : 24} color="#10b981" />
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Client Activity
          </h3>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.4)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            {activities.length} actions
          </span>
        </div>

        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          style={{
            padding: '0.5rem 0.75rem',
            background: autoRefresh ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '10px',
            color: autoRefresh ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={14} />
          {autoRefresh ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Activity Feed */}
      <div style={{
        maxHeight: isMobile ? '400px' : '500px',
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            No recent activity
          </div>
        ) : (
          <>
            {/* Just Now */}
            {groups.now.length > 0 && (
              <TimeGroup title="Just Now" activities={groups.now} isMobile={isMobile} isHighlight />
            )}
            
            {/* Recent */}
            {groups.recent.length > 0 && (
              <TimeGroup title="Recent" activities={groups.recent} isMobile={isMobile} />
            )}
            
            {/* Today */}
            {groups.today.length > 0 && (
              <TimeGroup title="Today" activities={groups.today} isMobile={isMobile} />
            )}
            
            {/* Yesterday */}
            {groups.yesterday.length > 0 && (
              <TimeGroup title="Yesterday" activities={groups.yesterday} isMobile={isMobile} />
            )}
            
            {/* Older */}
            {groups.older.length > 0 && (
              <TimeGroup title="Earlier" activities={groups.older} isMobile={isMobile} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Time Group Component
function TimeGroup({ title, activities, isMobile, isHighlight }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: isHighlight ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
        fontWeight: '600'
      }}>
        {title}
      </div>
      
      {activities.map((activity, index) => (
        <ActivityItem 
          key={activity.id} 
          activity={activity} 
          isMobile={isMobile}
          isNew={isHighlight && index === 0}
        />
      ))}
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity, isMobile, isNew }) {
  const [hover, setHover] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginBottom: '0.5rem',
        background: hover ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
        border: `1px solid ${isNew ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        animation: isNew ? 'slideInFade 0.5s ease' : 'none'
      }}
    >
      {/* Icon */}
      <div style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        minWidth: isMobile ? '32px' : '36px',
        textAlign: 'center'
      }}>
        {activity.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: '#fff',
          fontWeight: '500',
          marginBottom: '0.25rem'
        }}>
          <span style={{ 
            color: '#10b981',
            fontWeight: '600'
          }}>
            {activity.clientName}
          </span>
          {' '}
          {activity.message}
        </div>
        
        {activity.detail && (
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {activity.detail}
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.3)',
        whiteSpace: 'nowrap'
      }}>
        {activity.timeAgo}
      </div>

      {/* Arrow */}
      <ChevronRight 
        size={isMobile ? 14 : 16} 
        color="rgba(255, 255, 255, 0.2)"
        style={{
          transform: hover ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 0.3s ease'
        }}
      />
    </div>
  )
}

// Add animation
const style = document.createElement('style')
style.textContent = `
  @keyframes slideInFade {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
document.head.appendChild(style)
