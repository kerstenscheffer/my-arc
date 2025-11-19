import React, { useState, useEffect } from 'react'
import CoachCommandService from './CoachCommandService'
import ClientCard from './modules/ClientCard'

export default function CoachCommandCenter({ db, clients }) {
  console.log('🎯 [CommandCenter] Component mounted')
  console.log('  Clients received:', clients?.length)
  
  const isMobile = window.innerWidth <= 768
  const [clientsStatus, setClientsStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [pinnedIds, setPinnedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    console.log('🔄 [CommandCenter] Clients changed, reloading status...')
    loadClientsStatus()
  }, [clients])

  const loadClientsStatus = async () => {
    console.log('📡 [CommandCenter] Loading client statuses...')
    setLoading(true)
    
    try {
      if (!clients || clients.length === 0) {
        console.warn('⚠️ [CommandCenter] No clients provided')
        setLoading(false)
        return
      }

      console.log('  Calculating status for', clients.length, 'clients...')
      const statuses = await CoachCommandService.getAllClientsStatus(clients)
      console.log('✅ [CommandCenter] Statuses calculated:', statuses.length)
      
      console.log('  Loading pinned clients...')
      const pinned = await CoachCommandService.getPinnedClients()
      console.log('  Pinned clients:', pinned.length)
      
      setClientsStatus(statuses)
      setPinnedIds(pinned)
      console.log('✅ [CommandCenter] State updated successfully')
    } catch (error) {
      console.error('❌ [CommandCenter] Error loading statuses:', error)
    }
    
    setLoading(false)
  }

  const togglePin = async (clientId) => {
    console.log('📌 [CommandCenter] Toggling pin for:', clientId)
    const isPinned = await CoachCommandService.togglePin(clientId)
    if (isPinned) {
      setPinnedIds([...pinnedIds, clientId])
    } else {
      setPinnedIds(pinnedIds.filter(id => id !== clientId))
    }
  }

  // FILTER LOGIC
  const filteredClients = clientsStatus.filter(c => {
    // Status filter
    if (filter !== 'all' && c.status !== filter) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${c.client.first_name} ${c.client.last_name}`.toLowerCase()
      if (!fullName.includes(query)) return false
    }
    
    return true
  })

  // SORT: Pinned first, then by priority
  const sortedClients = [...filteredClients].sort((a, b) => {
    const aPin = pinnedIds.includes(a.client.id) ? 1 : 0
    const bPin = pinnedIds.includes(b.client.id) ? 1 : 0
    if (aPin !== bPin) return bPin - aPin
    return b.priority - a.priority
  })

  // COUNT PER STATUS
  const redCount = clientsStatus.filter(c => c.status === 'red').length
  const yellowCount = clientsStatus.filter(c => c.status === 'yellow').length
  const greenCount = clientsStatus.filter(c => c.status === 'green').length

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          marginBottom: '1rem',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          ⚡
        </div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: '#10b981',
          fontWeight: '500'
        }}>
          Calculating client status...
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255,255,255,0.5)',
          marginTop: '0.5rem'
        }}>
          Analyzing {clients?.length || 0} clients
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      
      {/* HEADER */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          🎯 Command Center
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '1.5rem'
        }}>
          Real-time client overview · {clients?.length || 0} total · {clientsStatus.length} with status
        </p>

        {/* SEARCH BAR */}
        <div style={{
          marginBottom: '1rem'
        }}>
          <input
            type="text"
            placeholder="🔍 Search client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              outline: 'none',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid #10b981'
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          />
        </div>

        {/* FILTER TABS */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'all', label: 'Alles', count: clientsStatus.length },
            { id: 'red', label: '🔴 Urgent', count: redCount },
            { id: 'yellow', label: '🟡 Check-in', count: yellowCount },
            { id: 'green', label: '🟢 On Track', count: greenCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
                background: filter === tab.id ? '#10b981' : 'rgba(255,255,255,0.05)',
                border: filter === tab.id ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: filter === tab.id ? '#000' : '#fff',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: filter === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT */}
      {(filter !== 'all' || searchQuery) && (
        <div style={{
          marginBottom: '1rem',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          Showing {sortedClients.length} of {clientsStatus.length} clients
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* CLIENT CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        {sortedClients.map(({ client, status, issues, actions, metrics }) => (
          <ClientCard
            key={client.id}
            client={client}
            status={status}
            issues={issues}
            metrics={metrics}
            isPinned={pinnedIds.includes(client.id)}
            onTogglePin={togglePin}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* EMPTY STATE */}
      {sortedClients.length === 0 && !loading && (
        <div style={{
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          textAlign: 'center',
          background: 'rgba(17, 17, 17, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '3rem',
            marginBottom: '1rem'
          }}>
            {searchQuery ? '🔍' : '🎯'}
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {searchQuery 
              ? `Geen clients gevonden voor "${searchQuery}"`
              : 'Geen clients in deze categorie'
            }
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255,255,255,0.6)'
          }}>
            {searchQuery 
              ? 'Probeer een andere zoekopdracht'
              : 'Probeer een ander filter'
            }
          </p>
          {(searchQuery || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilter('all')
              }}
              style={{
                marginTop: '1rem',
                padding: isMobile ? '0.6rem 1.25rem' : '0.75rem 1.5rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* FOOTER STATS */}
      {sortedClients.length > 0 && (
        <div style={{
          marginTop: isMobile ? '2rem' : '3rem',
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '0.25rem'
            }}>
              {redCount}
            </div>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Urgent Attention
            </div>
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: '#f59e0b',
              marginBottom: '0.25rem'
            }}>
              {yellowCount}
            </div>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Need Check-in
            </div>
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {greenCount}
            </div>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              On Track
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
