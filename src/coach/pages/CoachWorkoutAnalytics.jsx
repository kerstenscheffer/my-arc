import { useState, useEffect } from 'react'
import { 
  Users, Search, TrendingUp, Activity, Calendar, 
  ChevronDown, User, Mail, Phone, Target, X
} from 'lucide-react'
import ProgressChartsWidget from '../../modules/progress/ProgressChartsWidget'


export default function CoachWorkoutAnalytics({ db, coachId }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientSelector, setShowClientSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [clientStats, setClientStats] = useState(null)
  
  const isMobile = window.innerWidth <= 768
  
  useEffect(() => {
    loadClients()
  }, [coachId])
  
  useEffect(() => {
    if (selectedClient) {
      loadClientStats()
    }
  }, [selectedClient])
  
  const loadClients = async () => {
    try {
      setLoading(true)
      const clientData = await db.getClients(coachId)
      setClients(clientData || [])
      
      // Auto-select first client if available
      if (clientData && clientData.length > 0) {
        setSelectedClient(clientData[0])
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }
  
  const loadClientStats = async () => {
    if (!selectedClient) return
    
    try {
      // Load basic stats for the selected client
      const stats = await db.getRecentWorkoutStats(selectedClient.id)
      setClientStats(stats)
    } catch (error) {
      console.error('Failed to load client stats:', error)
      setClientStats(null)
    }
  }
  
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase()
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase()
    const email = (client.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
  
  const formatLastWorkout = (date) => {
    if (!date) return 'Nog geen training'
    
    const workoutDate = new Date(date)
    const today = new Date()
    const diffTime = Math.abs(today - workoutDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
    return `${Math.floor(diffDays / 30)} maanden geleden`
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Activity size={isMobile ? 24 : 32} color="#f97316" />
              Workout Analytics
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              margin: 0
            }}>
              Bekijk de trainingsvoortgang van je klanten
            </p>
          </div>
          
          {/* Quick Stats */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '800',
                color: '#f97316'
              }}>
                {clients.length}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Klanten
              </div>
            </div>
            
            {clientStats && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: '#3b82f6'
                  }}>
                    {clientStats.workoutsThisWeek || 0}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Deze Week
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: '#10b981'
                  }}>
                    {clientStats.currentStreak || 0}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Reeks
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Client Selector */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowClientSelector(!showClientSelector)}
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '56px'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} color="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                {selectedClient ? (
                  <>
                    <div style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '700',
                      marginBottom: '0.125rem'
                    }}>
                      {selectedClient.first_name} {selectedClient.last_name}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {selectedClient.email}
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Selecteer een klant...
                  </div>
                )}
              </div>
            </div>
            <ChevronDown 
              size={20} 
              style={{ 
                transform: showClientSelector ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                color: 'rgba(255, 255, 255, 0.5)'
              }} 
            />
          </button>
          
          {/* Client Dropdown */}
          {showClientSelector && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.75rem',
              background: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
              maxHeight: isMobile ? '70vh' : '400px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}>
              {/* Search */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={16} 
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(148, 163, 184, 0.5)'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Zoek klant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '16px', // Prevents zoom on iOS
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={16} color="rgba(255, 255, 255, 0.5)" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Client List */}
              <div style={{
                maxHeight: isMobile ? 'calc(70vh - 100px)' : '300px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                {loading ? (
                  <div style={{
                    padding: '2rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(249, 115, 22, 0.2)',
                      borderTopColor: '#f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client)
                        setShowClientSelector(false)
                        setSearchQuery('')
                      }}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.875rem 1rem',
                        background: selectedClient?.id === client.id 
                          ? 'rgba(249, 115, 22, 0.15)' 
                          : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '60px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedClient?.id !== client.id) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedClient?.id !== client.id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: selectedClient?.id === client.id
                          ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={18} color={selectedClient?.id === client.id ? '#fff' : 'rgba(255, 255, 255, 0.5)'} />
                      </div>
                      
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{
                          fontSize: isMobile ? '0.9rem' : '0.95rem',
                          fontWeight: '600',
                          marginBottom: '0.125rem',
                          color: selectedClient?.id === client.id ? '#f97316' : '#fff'
                        }}>
                          {client.first_name} {client.last_name}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {client.email}
                        </div>
                      </div>
                      
                      <div style={{
                        textAlign: 'right',
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        <div style={{ marginBottom: '0.125rem' }}>
                          {formatLastWorkout(client.last_workout_date)}
                        </div>
                        {client.workout_streak > 0 && (
                          <div style={{ color: '#10b981' }}>
                            🔥 {client.workout_streak} dagen
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {searchQuery ? 'Geen klanten gevonden' : 'Geen klanten beschikbaar'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Charts Widget */}
      {selectedClient ? (
        <ProgressChartsWidget 
          db={db}
          clientId={selectedClient.id}
          onOpenFullView={() => {
            // Optional: Navigate to detailed view
            console.log('Open full view for client:', selectedClient.id)
          }}
        />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <Users size={48} color="rgba(249, 115, 22, 0.2)" />
          <p style={{
            marginTop: '1rem',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Selecteer een klant om de trainingsdata te bekijken
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
