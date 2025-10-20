// src/coach/pages/challenge-monitor/PhotoProgressView.jsx
import { useState, useEffect } from 'react'
import { Camera, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react'

export default function PhotoProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [photoData, setPhotoData] = useState({
    photos: [],
    fridayPhotos: [],
    completedWeeks: 0,
    totalPhotos: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    loadPhotoData()
  }, [client?.id, challengeData])

  async function loadPhotoData() {
    if (!client?.id || !challengeData) return

    try {
      const startDate = new Date(challengeData.start_date)
      const endDate = new Date(challengeData.end_date)
      
      // Load all progress photos
      const { data: photos } = await db.supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      // Filter Friday photos
      const fridayPhotos = photos?.filter(p => {
        const date = new Date(p.date)
        return date.getDay() === 5
      }) || []

      // Count completed weeks (need both front and side photos on Friday)
      const weekPhotos = {}
      fridayPhotos.forEach(photo => {
        const date = new Date(photo.date)
        const weekStart = new Date(startDate)
        const weekNum = Math.floor((date - weekStart) / (7 * 24 * 60 * 60 * 1000)) + 1
        
        if (!weekPhotos[weekNum]) {
          weekPhotos[weekNum] = { front: false, side: false }
        }
        
        if (photo.photo_type === 'front') weekPhotos[weekNum].front = true
        if (photo.photo_type === 'side') weekPhotos[weekNum].side = true
      })

      const completedWeeks = Object.values(weekPhotos).filter(
        week => week.front && week.side
      ).length

      setPhotoData({
        photos: photos || [],
        fridayPhotos,
        completedWeeks,
        totalPhotos: photos?.length || 0
      })
    } catch (error) {
      console.error('Error loading photo data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading photo data...
      </div>
    )
  }

  // Group photos by week
  const photosByWeek = {}
  for (let week = 1; week <= 8; week++) {
    photosByWeek[week] = []
  }

  photoData.photos.forEach(photo => {
    const date = new Date(photo.date)
    const startDate = new Date(challengeData.start_date)
    const weekNum = Math.min(8, Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1)
    photosByWeek[weekNum].push(photo)
  })

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(139, 92, 246, 0.2)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Camera size={20} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {photoData.totalPhotos}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Total Photos
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Calendar size={20} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {photoData.fridayPhotos.length}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Friday Photos
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          gridColumn: isMobile ? 'span 2' : 'span 1'
        }}>
          <CheckCircle size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {photoData.completedWeeks}/8
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Complete Weeks
          </div>
        </div>
      </div>

      {/* Week by Week Photo Grid */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Camera size={18} />
          Weekly Photo Progress
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
            const weekPhotos = photosByWeek[week] || []
            const fridayPhotos = weekPhotos.filter(p => {
              const date = new Date(p.date)
              return date.getDay() === 5
            })
            const hasFront = fridayPhotos.some(p => p.photo_type === 'front')
            const hasSide = fridayPhotos.some(p => p.photo_type === 'side')
            const isComplete = hasFront && hasSide
            const isCurrentWeek = week === challengeData.currentWeek

            return (
              <div
                key={week}
                style={{
                  background: isCurrentWeek 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.875rem' : '1rem',
                  border: `1px solid ${isCurrentWeek 
                    ? 'rgba(139, 92, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: weekPhotos.length > 0 ? '0.75rem' : 0
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      color: isCurrentWeek ? '#8b5cf6' : '#fff'
                    }}>
                      Week {week}
                    </span>
                    {isCurrentWeek && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '4px',
                        color: '#a78bfa',
                        fontWeight: '600'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {isComplete ? (
                      <>
                        <span style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          Complete
                        </span>
                        <CheckCircle size={16} color="#10b981" />
                      </>
                    ) : (
                      <>
                        <span style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          {hasFront && !hasSide ? 'Missing Side' : 
                           !hasFront && hasSide ? 'Missing Front' : 
                           'No Friday Photos'}
                        </span>
                        {week < challengeData.currentWeek && (
                          <XCircle size={16} color="#ef4444" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Photo thumbnails */}
                {weekPhotos.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '60px' : '80px'}, 1fr))`,
                    gap: '0.5rem'
                  }}>
                    {weekPhotos.slice(0, 6).map((photo, idx) => {
                      const isFriday = new Date(photo.date).getDay() === 5
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(photo)}
                          style={{
                            aspectRatio: '1',
                            background: photo.photo_url 
                              ? `url(${photo.photo_url}) center/cover`
                              : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: `2px solid ${isFriday 
                              ? 'rgba(251, 191, 36, 0.5)' 
                              : 'rgba(255, 255, 255, 0.1)'}`,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.borderColor = isFriday 
                              ? 'rgba(251, 191, 36, 0.5)' 
                              : 'rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {/* Photo type badge */}
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            padding: '2px 6px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            color: '#fff',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {photo.photo_type}
                          </div>
                          
                          {/* Friday indicator */}
                          {isFriday && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '8px',
                              height: '8px',
                              background: '#fbbf24',
                              borderRadius: '50%',
                              border: '1px solid rgba(0, 0, 0, 0.3)'
                            }} />
                          )}
                        </div>
                      )
                    })}
                    
                    {weekPhotos.length > 6 && (
                      <div
                        style={{
                          aspectRatio: '1',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontWeight: '600'
                        }}
                      >
                        +{weekPhotos.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <img
            src={selectedPhoto.photo_url}
            alt="Progress"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  )
}
